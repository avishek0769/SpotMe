import mongoose, { Schema, model } from "mongoose";

const eventSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    eventDate: {
        type: Date,
        required: true,
    },
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "users",
        required: true,
    },
    coverImage: {
        type: mongoose.Types.ObjectId,
        ref: "photos",
    },
    accessLevel: {
        type: String,
        enum: ["spot", "browse"],
        default: "spot",
    },
    sharableLink: {
        type: String,
        unique: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ["empty", "processing", "ready", "expired"],
        default: "empty",
    },
});

const Event = model("Event", eventSchema);

export default Event;
