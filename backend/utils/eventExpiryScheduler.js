import { Resend } from "resend";
import { S3Client, DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import Event from "../models/event.model.js";
import Photo from "../models/photo.model.js";
import User from "../models/user.model.js";
import Guest from "../models/guest.model.js";
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
const TWO_DAYS_MS = 2 * ONE_DAY_MS;
const FOUR_DAYS_MS = 4 * ONE_DAY_MS;
const FIVE_DAYS_MS = 5 * ONE_DAY_MS;

const EMAIL_FROM = "SpotMe <team@avishekadhikary.tech>";
const DEVELOPER_EMAIL = "avishekadhikary42@gmail.com";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

let schedulerRunning = false;

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

/** Format a date in IST (UTC+5:30) */
function formatDateIST(dateValue) {
    return new Date(dateValue).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    }) + " IST";
}

async function getEventThumbnailUrl(event) {
    const coverImageId = event.coverImage?._id || event.coverImage;
    if (coverImageId) {
        const coverImage = await Photo.findById(coverImageId).select("url");
        if (coverImage?.url) return coverImage.url;
    }
    const fallbackPhoto = await Photo.findOne({ eventId: event._id, type: "event" })
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
                        Objects: listResponse.Contents.map((obj) => ({ Key: obj.Key })),
                        Quiet: true,
                    },
                }),
            );
        }
        continuationToken = listResponse.NextContinuationToken;
    } while (continuationToken);
}

/**
 * Build a styled HTML email.
 * @param {object} opts
 * @param {string} opts.eventName
 * @param {string} opts.eventId
 * @param {string} opts.expiryDateIST
 * @param {string} opts.daysLeft  — e.g. "5", "3", "1"
 * @param {string|null} opts.thumbnailUrl
 * @param {"guest"|"owner"} opts.role
 * @param {string|null} opts.guestCollectionUrl  — only for guest
 */
function buildEmailHtml({ eventName, eventId, expiryDateIST, daysLeft, thumbnailUrl, role, guestCollectionUrl }) {
    const thumbnail = thumbnailUrl
        ? `<img src="${escapeHtml(thumbnailUrl)}" alt="${escapeHtml(eventName)}" style="display:block;width:100%;max-width:560px;height:200px;object-fit:cover;border-radius:10px;margin:0 0 24px;" />`
        : "";

    const urgencyColor = daysLeft <= 1 ? "#be123c" : daysLeft <= 3 ? "#c2410c" : "#b45309";
    const urgencyLabel = daysLeft <= 1 ? "Final Warning" : daysLeft <= 3 ? "Urgent" : "Heads Up";

    const guestCTA = role === "guest" && guestCollectionUrl
        ? `<p style="margin:0 0 12px;color:#374151;font-size:14px;">Download your photos before they're gone.</p>
           <a href="${escapeHtml(guestCollectionUrl)}" style="display:inline-block;background:#ff5600;color:#fff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Open My Collection</a>`
        : "";

    const ownerCTA = role === "owner"
        ? `<p style="margin:16px 0 8px;color:#374151;font-size:14px;">To extend the expiry, contact the developer with your Event ID:</p>
           <div style="background:#f3f4f6;border-radius:8px;padding:8px 14px;display:inline-block;margin-bottom:14px;">
               <code style="font-size:13px;color:#111827;font-family:monospace;">${escapeHtml(eventId)}</code>
           </div><br/>
           <a href="mailto:${DEVELOPER_EMAIL}?subject=Extend%20SpotMe%20Event%20Expiry&body=Hi%2C%20please%20extend%20my%20event%20%E2%80%94%20ID%3A%20${escapeHtml(eventId)}" style="display:inline-block;background:#1d4ed8;color:#fff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Email Developer</a>`
        : "";

    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:580px;background:#ffffff;border-radius:14px;border:1px solid #e5e7eb;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:#111827;padding:20px 28px;display:flex;align-items:center;">
            <span style="color:#ff5600;font-size:20px;font-weight:700;letter-spacing:-0.5px;">SpotMe</span>
            <span style="margin-left:12px;background:${urgencyColor};color:#fff;font-size:11px;font-weight:600;padding:3px 10px;border-radius:999px;text-transform:uppercase;letter-spacing:0.5px;">${urgencyLabel}</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px;">
            ${thumbnail}

            <h1 style="margin:0 0 6px;font-size:20px;font-weight:600;color:#111827;">Event expiring in ${escapeHtml(String(daysLeft))} day${daysLeft !== 1 ? "s" : ""}</h1>
            <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">Event: <strong style="color:#111827;">${escapeHtml(eventName)}</strong></p>

            <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:12px 16px;margin-bottom:20px;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#92400e;">Deletion date</p>
              <p style="margin:0;font-size:15px;font-weight:700;color:#78350f;">${escapeHtml(expiryDateIST)}</p>
              <p style="margin:6px 0 0;font-size:12px;color:#92400e;">When this date and time is reached, all photos in this event will be permanently deleted from our servers.</p>
            </div>

            ${guestCTA}
            ${ownerCTA}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 28px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">You're receiving this because you're associated with a SpotMe event.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendExpiryEmailToUser(toEmail, subject, htmlContent) {
    if (!toEmail) return;
    try {
        await resend.emails.send({ from: EMAIL_FROM, to: toEmail, subject, html: htmlContent });
    } catch (err) {
        console.error(`Failed to send email to ${toEmail}:`, err?.message);
    }
}

/**
 * Send one round of expiry warnings to owner + all guests.
 */
async function sendWarningRound(event, daysLeft, thumbnailUrl) {
    const expiryDateIST = formatDateIST(event.expiresAt);
    const eventIdStr = event._id.toString();
    const subject = `SpotMe — Your event expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`;

    // Owner email
    const owner = await User.findById(event.userId).select("email");
    if (owner?.email) {
        const html = buildEmailHtml({
            eventName: event.name,
            eventId: eventIdStr,
            expiryDateIST,
            daysLeft,
            thumbnailUrl,
            role: "owner",
            guestCollectionUrl: null,
        });
        await sendExpiryEmailToUser(owner.email, subject, html);
    }

    // Guest emails — look up user emails directly (avoids populate ref-name mismatch)
    const guests = await Guest.find({ eventId: event._id });
    for (const guest of guests) {
        if (!guest.userId) continue;
        const guestUser = await User.findById(guest.userId).select("email");
        const guestEmail = guestUser?.email;
        if (!guestEmail) continue;
        const guestCollectionUrl = `${FRONTEND_URL}/events/${eventIdStr}/guest/collection`;
        const html = buildEmailHtml({
            eventName: event.name,
            eventId: eventIdStr,
            expiryDateIST,
            daysLeft,
            thumbnailUrl,
            role: "guest",
            guestCollectionUrl,
        });
        await sendExpiryEmailToUser(guestEmail, subject, html);
    }
}

async function processExpiredEvent(event, now) {
    const ageMs = now.getTime() - new Date(event.expiresAt).getTime();
    const updateData = {};

    if (event.status !== "expired") {
        updateData.status = "expired";
    }

    // After 5 days: permanently delete all photos
    if (ageMs >= FIVE_DAYS_MS && !event.photosDeletedAt) {
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

    const thumbnailUrl = await getEventThumbnailUrl(event);

    // Email 1: immediately on expiry (day 0) — 5 days left
    if (!event.expiryWarningSentAt) {
        await sendWarningRound(event, 5, thumbnailUrl);
        updateData.expiryWarningSentAt = now;
    }

    // Email 2: at ~day 2 (3 days left)
    if (ageMs >= TWO_DAYS_MS && !event.secondWarningSentAt) {
        await sendWarningRound(event, 3, thumbnailUrl);
        updateData.secondWarningSentAt = now;
    }

    // Email 3: at ~day 4 (1 day left)
    if (ageMs >= FOUR_DAYS_MS && !event.finalWarningSentAt) {
        await sendWarningRound(event, 1, thumbnailUrl);
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
                { secondWarningSentAt: null },
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
