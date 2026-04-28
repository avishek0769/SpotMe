import { Resend } from "resend";
import { S3Client, DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import Event from "../models/event.model.js";
import Photo from "../models/photo.model.js";
import User from "../models/user.model.js";
import qdrant from "./qdrant.js";

const resend = new Resend(process.env.RESEND_API_KEY);

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const THREE_DAYS_MS = 3 * ONE_DAY_MS;
const FOUR_DAYS_MS = 4 * ONE_DAY_MS;
const EMAIL_FROM = "SpotMe <team@avishekadhikary.tech>";

let schedulerRunning = false;

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function formatExpiryDate(dateValue) {
    return new Date(dateValue).toUTCString();
}

async function getEventThumbnailUrl(event) {
    const coverImageId = event.coverImage?._id || event.coverImage;

    if (coverImageId) {
        const coverImage = await Photo.findById(coverImageId).select("url");
        if (coverImage?.url) return coverImage.url;
    }

    const fallbackPhoto = await Photo.findOne({
        eventId: event._id,
        type: "event",
    })
        .sort({ createdAt: 1 })
        .select("url");

    return fallbackPhoto?.url || null;
}

async function deleteEventImagesFromS3(eventId) {
    let continuationToken = null;

    do {
        const listResponse = await s3.send(
            new ListObjectsV2Command({
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Prefix: `event_images/${eventId}/`,
                ContinuationToken: continuationToken,
            }),
        );

        if (listResponse.Contents?.length > 0) {
            await s3.send(
                new DeleteObjectsCommand({
                    Bucket: process.env.AWS_S3_BUCKET_NAME,
                    Delete: {
                        Objects: listResponse.Contents.map((obj) => ({
                            Key: obj.Key,
                        })),
                        Quiet: true,
                    },
                }),
            );
        }

        continuationToken = listResponse.NextContinuationToken;
    } while (continuationToken);
}

async function sendExpiryEmail(user, event, subject, headline, body, thumbnailUrl) {
    if (!user?.email) return;

    const expiryDate = formatExpiryDate(event.expiresAt);
    const thumbnailBlock = thumbnailUrl
        ? `
            <div style="margin: 16px 0 18px;">
                <img
                    src="${escapeHtml(thumbnailUrl)}"
                    alt="${escapeHtml(event.name)} thumbnail"
                    style="display: block; width: 100%; max-width: 560px; height: auto; border-radius: 14px; object-fit: cover; border: 1px solid #e5e7eb;"
                />
            </div>
        `
        : "";

    await resend.emails.send({
        from: EMAIL_FROM,
        to: user.email,
        subject,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                <h2 style="margin: 0 0 12px;">${escapeHtml(headline)}</h2>
                <p style="margin: 0 0 12px;">${escapeHtml(body)}</p>
                ${thumbnailBlock}
                <p style="margin: 0 0 8px;"><strong>Event:</strong> ${escapeHtml(event.name)}</p>
                <p style="margin: 0 0 8px;"><strong>Expires:</strong> ${escapeHtml(expiryDate)}</p>
                <p style="margin: 0 0 8px; color: #4b5563;">
                    Once this date is reached, the event can expire at any time and the images may be permanently deleted.
                </p>
                ${event.sharableLink ? `<p style="margin: 0;"><strong>Link:</strong> ${escapeHtml(event.sharableLink)}</p>` : ""}
            </div>
        `,
    });
}

async function processExpiredEvent(event, now) {
    const ageMs = now.getTime() - new Date(event.expiresAt).getTime();
    const updateData = {};

    if (event.status !== "expired") {
        updateData.status = "expired";
    }

    if (ageMs >= FOUR_DAYS_MS && !event.photosDeletedAt) {
        await deleteEventImagesFromS3(event._id.toString());

        await Promise.all([
            Photo.deleteMany({ eventId: event._id }),
            qdrant.deleteCollection(`Event_${event._id}`).catch(() => {}),
        ]);

        updateData.photosDeletedAt = now;
        updateData.coverImage = null;

        if (Object.keys(updateData).length > 0) {
            await Event.findByIdAndUpdate(event._id, updateData);
        }

        return;
    }

    const user = await User.findById(event.userId).select("email");
    const thumbnailUrl = await getEventThumbnailUrl(event);

    if (!event.expiryWarningSentAt) {
        await sendExpiryEmail(
            user,
            event,
            "SpotMe - Your event has expired",
            "Your event has expired",
            "The event is now expired. The photos will be permanently deleted after 3 days.",
            thumbnailUrl,
        );
        updateData.expiryWarningSentAt = now;
    }

    if (ageMs >= THREE_DAYS_MS && !event.finalWarningSentAt) {
        await sendExpiryEmail(
            user,
            event,
            "SpotMe - Final warning: event photos will be deleted tomorrow",
            "Final warning",
            "Your event has been expired for 3 days. The photos will be deleted tomorrow.",
            thumbnailUrl,
        );
        updateData.finalWarningSentAt = now;
    }

    if (Object.keys(updateData).length > 0) {
        await Event.findByIdAndUpdate(event._id, updateData);
    }
}

export async function runEventExpirySweep() {
    if (schedulerRunning) return;

    schedulerRunning = true;
    try {
        const now = new Date();
        const expiredEvents = await Event.find({
            expiresAt: { $lte: now },
            $or: [
                { status: { $ne: "expired" } },
                { expiryWarningSentAt: null },
                { finalWarningSentAt: null },
                { photosDeletedAt: null },
            ],
        }).sort({ expiresAt: 1 });

        for (const event of expiredEvents) {
            try {
                await processExpiredEvent(event, now);
            } catch (error) {
                console.error(`Failed to process expired event ${event._id}:`, error);
            }
        }
    } finally {
        schedulerRunning = false;
    }
}

export function startEventExpiryScheduler() {
    void runEventExpirySweep();

    return setInterval(() => {
        void runEventExpirySweep();
    }, 24 * 60 * 60 * 1000);
}
