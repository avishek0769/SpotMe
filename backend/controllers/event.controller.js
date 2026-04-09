import Event from "../models/event.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";

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
        eventDate,
        userId: req.user._id,
        coverImage: "",
        accessLevel,
        sharableLink: `${process.env.BASE_URL}/event/${eventId}`,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    });

    return res.status(201).json(new ApiResponse(201, event, "Event created successfully"));
});

export {
    createEvent
};