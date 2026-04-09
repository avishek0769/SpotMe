import { Schema, model } from "mongoose";

const eventSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    eventDate: {
        type: Date,
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    coverImage: {
        type: String
    },
    accessLevel: {
        type: String,
        enum: ["spot", "browse"],
        default: "spot"
    },
    sharableLink: {
        type: String,
        unique: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ["empty", "processing", "expired"],
        default: "empty"
    }
}, { timestamps: true });

const Event = model("Event", eventSchema);

export default Event;
