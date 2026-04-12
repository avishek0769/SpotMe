import mongoose, { Schema, model } from "mongoose";

const guestSchema = new Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "users"
    },
    eventId: {
        type: mongoose.Types.ObjectId,
        ref: "events",
        required: true
    },
    accessedAt: {
        type: Date,
        default: Date.now
    }
});

const Guest = model("Guest", guestSchema);

export default Guest;
