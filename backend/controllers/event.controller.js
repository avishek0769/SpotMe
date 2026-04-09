import Event from "../models/event.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";
import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const createEvent = asyncHandler(async (req, res) => {
    const { name, eventDate, accessLevel } = req.body;
    if (!name || !eventDate) {
        throw new ApiError(400, "Name and event date are required");
    }
    if(accessLevel && !["spot", "browse"].includes(accessLevel)) {
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
    // TODO: Implement event deletion logic
})

const getSignedUrl = asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    const { url, fields } = await createPresignedPost(s3Client, {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `event_images/${eventId}/` + "${filename}",
        Conditions: [
            ["starts-with", "$key", `event_images/${eventId}/`],
            ["content-length-range", 0, 20 * 1024 * 1024],
        ],
        Expires: 3600 * 2
    });

    return res.status(200).json(new ApiResponse(
        200,
        { url, fields },
        "Signed URL generated successfully"
    ));
});

const enqueueBatch = asyncHandler(async (req, res) => {
    // TODO: Implement batch enqueueing logic
})

export {
    createEvent,
    getAllEvents,
    deleteEvent,
    editEvent,
    getSignedUrl,
    enqueueBatch
};