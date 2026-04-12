import mongoose, { Schema, model } from "mongoose";

const photoSchema = new Schema({
    eventId: {
        type: mongoose.Types.ObjectId,
        ref: "events",
        required: true
    },
    url: {
        type: String,
        required: true
    }
}, { timestamps: true });

const Photo = model("Photo", photoSchema);

export default Photo;
