import Event from "../models/event.model.js";
import Photo from "../models/photo.model.js";
import Guest from "../models/guest.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";
import { Queue } from "bullmq";
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { QdrantClient } from "@qdrant/js-client-rest";

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY
})

const imageQueue = new Queue("imageQueue");

const createEvent = asyncHandler(async (req, res) => {
    const { name, eventDate, accessLevel } = req.body;
    if (!name || !eventDate) {
        throw new ApiError(400, "Name and event date are required");
    }
    if (accessLevel && !["spot", "browse"].includes(accessLevel)) {
        throw new ApiError(400, "Invalid access level");
    }

    const eventId = new mongoose.Types.ObjectId()
    const event = await Event.create({
        _id: eventId,
        name,
        eventDate: new Date(eventDate).toISOString(),
        userId: req.user._id,
        coverImage: null,
        accessLevel,
        sharableLink: `${process.env.BASE_URL}/event/${eventId}`,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    });

    return res.status(201).json(new ApiResponse(201, event, "Event created successfully"));
});

const getAllEvents = asyncHandler(async (req, res) => {
    const events = await Event.find({ userId: req.user._id })
    return res.status(200).json(new ApiResponse(200, events, "Successfully fetched all events for this user"))
})

const editEvent = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { name, eventDate, accessLevel, photoId } = req.body;
    let updateData = {};

    if (name) updateData.name = name;
    if (eventDate) updateData.eventDate = new Date(eventDate).toISOString();
    if (accessLevel) {
        if (!["spot", "browse"].includes(accessLevel)) {
            throw new ApiError(400, "Invalid access level");
        }
        updateData.accessLevel = accessLevel;
    }
    if (photoId) updateData.coverImage = photoId;

    const event = await Event.findByIdAndUpdate(eventId, updateData, { new: true });

    return res.status(200).json(new ApiResponse(200, event, "Event updated successfully"));
});

const deleteEvent = asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    let continuationToken = null;
    do {
        const listCommand = new ListObjectsV2Command({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Prefix: `event_images/${eventId}/`,
            ContinuationToken: continuationToken
        });
        const listResponse = await s3.send(listCommand);

        if (listResponse.Contents?.length > 0) {
            const deleteCommand = new DeleteObjectsCommand({
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Delete: {
                    Objects: listResponse.Contents.map(obj => ({ Key: obj.Key })),
                    Quiet: true
                }
            });
            continuationToken = listResponse.NextContinuationToken;
            await s3.send(deleteCommand);
        }
    } while (continuationToken);

    await Promise.all([
        Event.findByIdAndDelete(eventId),
        Photo.deleteMany({ eventId }),
        Guest.deleteMany({ eventId }),
        qdrant.deleteCollection(`Event_${eventId}`).catch(() => {}) 
    ]);

    return res.status(200).json(new ApiResponse(
        200,
        null,
        "Event and associated photos and guests deleted successfully"
    ));
})

const enqueueBatch = asyncHandler(async (req, res) => {
    const { urls } = req.body;
    const { eventId } = req.params;

    const photos = await Photo.insertMany(
        urls.map(url => ({
            url,
            eventId,
            collectionIds: []
        })),
        { ordered: false }
    )

    await imageQueue.add("processImages", { photos, eventId });

    return res.status(200).json(new ApiResponse(
        200,
        null,
        "Batch processing enqueued successfully"
    ));
})

const getDetails = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) {
        throw new ApiError(404, "Event not found");
    }
    return res.status(200).json(new ApiResponse(
        200,
        event,
        "Event details fetched successfully")
    );
})

const getAllPhotos = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { page = 0, limit = 0 } = req.query;

    const photos = await Photo.find({ eventId })
        .skip(parseInt(page) * parseInt(limit))
        .limit(parseInt(limit));

    return res.status(200).json(new ApiResponse(
        200,
        photos,
        "Photos fetched successfully"
    ));
})

const getAllGuests = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const guests = await Guest.find({ eventId });

    return res.status(200).json(new ApiResponse(
        200,
        guests,
        "Guests fetched successfully"
    ));
})

export {
    createEvent,
    getAllEvents,
    deleteEvent,
    editEvent,
    enqueueBatch,
    getDetails,
    getAllPhotos,
    getAllGuests
};