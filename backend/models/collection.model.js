import mongoose, { Schema, model } from "mongoose";

const collectionSchema = new Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "users",
        required: true
    },
    eventId: {
        type: mongoose.Types.ObjectId,
        ref: "events",
        required: true
    },
    selfies: [{
        type: mongoose.Types.ObjectId,
        ref: "photos"
    }],
    myPhotos: [{
        type: mongoose.Types.ObjectId,
        ref: "photos"
    }]
}, { timestamps: true });

const Collection = model("Collection", collectionSchema);

export default Collection;
