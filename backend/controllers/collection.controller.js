import Photo from "../models/photo.model.js";
import Guest from "../models/guest.model.js";
import Event from "../models/event.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { indexFacesInImage } from "../workers/imageWorker.js";
import qdrant from "../utils/qdrant.js";
import Collection from "../models/collection.model.js";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import mongoose from "mongoose";
import path from "path";

const findMatchPersist = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { selfiePhotoIds, collectionId } = req.body;

    if (
        !selfiePhotoIds ||
        !Array.isArray(selfiePhotoIds) ||
        selfiePhotoIds.length === 0
    ) {
        throw new ApiError(400, "selfiePhotoIds must be a non-empty array");
    }

    const photos = await Photo.find({ _id: { $in: selfiePhotoIds }, eventId });

    if (photos.length !== selfiePhotoIds.length) {
        throw new ApiError(
            404,
            "One or more photos not found for the given event",
        );
    }

    // Track guest access
    const existingGuest = await Guest.findOne({
        eventId,
        userId: req.user._id,
    });
    if (existingGuest) {
        existingGuest.accessedAt = Date.now();
        await existingGuest.save();
    } else {
        await Guest.create({ eventId, userId: req.user._id });
    }

    const dirPath = `images/${uuidv4()}`;
    await fs.mkdir(dirPath, { recursive: true });

    // Extract face embeddings
    const results = await Promise.allSettled(
        photos.map(async (photo) => {
            const res = await fetch(photo.url);
            const arrayBuffer = await res.arrayBuffer();

            const imageName = `${dirPath}/${photo.url.split("/").pop()}`;
            await fs.writeFile(imageName, Buffer.from(arrayBuffer));

            const faces = await indexFacesInImage(imageName, photo._id);
            await fs.unlink(imageName);

            return faces;
        }),
    );
    await fs.rm(dirPath, { recursive: true });

    const allFaces = results
        .filter((r) => r.status === "fulfilled" && r.value?.length > 0)
        .flatMap((r) => r.value);

    if (allFaces.length === 0) {
        throw new ApiError(
            404,
            "No faces detected in the provided photos. Please try with clearer photos.",
        );
    }

    // Perform Match
    const searches = await Promise.all(
        allFaces.map((face) =>
            qdrant.search(`Event_${eventId}`, {
                vector: Array.from(face.embeddings),
                withPayload: true,
                score_threshold: 0.45,
            }),
        ),
    );

    // // Filter best matches
    const photoCount = new Map();
    searches.flat().forEach((result) => {
        const photoId = result.payload.photoId;
        if (!photoCount.has(photoId)) {
            photoCount.set(photoId, { count: 0, score: 0, result });
        }
        const data = photoCount.get(photoId);
        data.count += 1;
        data.score = Math.max(result.score, data.score);
    });

    const filteredResults = [...photoCount.values()]
        .filter((r) => r.count >= 2)
        .sort((a, b) => b.score - a.score)
        .map((r) => r.result);

    const filteredResultPhotoIds = filteredResults.map(
        (r) => r.payload.photoId,
    );

    const photosMatched = await Photo.find({
        _id: { $in: filteredResultPhotoIds },
    }).select("-type -eventId -createdAt -updatedAt");

    // Update user's collection with matched photos
    await Collection.findByIdAndUpdate(collectionId, {
        $addToSet: {
            myPhotos: {
                $each: filteredResultPhotoIds,
            },
        },
    });

    return res.json(new ApiResponse(200, photosMatched, "Match found"));
});

const findMatchWithoutPersist = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { selfieImageIds } = req.body;

    if (
        !selfieImageIds ||
        !Array.isArray(selfieImageIds) ||
        selfieImageIds.length === 0
    ) {
        throw new ApiError(400, "selfieImageIds must be a non-empty array");
    }

    if (selfieImageIds.length > 3) {
        throw new ApiError(400, "You can upload a maximum of 3 selfies");
    }

    const selfieDir = path.join("images", "temp_selfies");
    const selfiePaths = selfieImageIds.map((id) => {
        const fileName = String(id || "").trim();
        if (!fileName || fileName !== path.basename(fileName)) {
            throw new ApiError(400, "Invalid selfie image id");
        }
        return path.join(selfieDir, fileName);
    });

    await Promise.all(
        selfiePaths.map(async (imagePath) => {
            try {
                await fs.access(imagePath);
            } catch {
                throw new ApiError(404, `Selfie image not found: ${path.basename(imagePath)}`);
            }
        }),
    );

    let allFaces = [];
    try {
        const results = await Promise.allSettled(
            selfiePaths.map(async (imagePath) => {
                const faces = await indexFacesInImage(imagePath, path.basename(imagePath));
                return faces;
            }),
        );

        allFaces = results
            .filter((r) => r.status === "fulfilled" && r.value?.length > 0)
            .flatMap((r) => r.value);
    } finally {
        await Promise.allSettled(selfiePaths.map((imagePath) => fs.unlink(imagePath)));
    }

    if (allFaces.length === 0) {
        throw new ApiError(
            404,
            "No faces detected in the provided photos. Please try with clearer photos.",
        );
    }

    const searches = await Promise.all(
        allFaces.map((face) =>
            qdrant.search(`Event_${eventId}`, {
                vector: Array.from(face.embeddings),
                withPayload: true,
                score_threshold: 0.45,
            }),
        ),
    );

    const photoCount = new Map();
    searches.flat().forEach((result) => {
        const photoId = result.payload.photoId;
        if (!photoCount.has(photoId)) {
            photoCount.set(photoId, { count: 0, score: 0, result });
        }
        const data = photoCount.get(photoId);
        data.count += 1;
        data.score = Math.max(result.score, data.score);
    });

    const filteredResults = [...photoCount.values()]
        .filter((r) => r.count >= 2)
        .sort((a, b) => b.score - a.score)
        .map((r) => r.result);

    const filteredResultPhotoIds = filteredResults.map(
        (r) => r.payload.photoId,
    );

    const photosMatched = await Photo.find({
        _id: { $in: filteredResultPhotoIds },
    }).select("-type -eventId -createdAt -updatedAt");

    return res.json(new ApiResponse(200, photosMatched, "Match found"));
});

const removePhoto = asyncHandler(async (req, res) => {
    const { collectionId } = req.params;
    const { photoIds } = req.body;

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
        throw new ApiError(400, "photoIds must be a non-empty array");
    }

    await Collection.findOneAndUpdate(
        { _id: collectionId, userId: req.user._id },
        {
            $pull: {
                myPhotos: {
                    $in: photoIds,
                },
            },
        },
    );

    return res.json(
        new ApiResponse(200, null, "Photos removed from collection"),
    );
});

const addPhoto = asyncHandler(async (req, res) => {
    const { collectionId } = req.params;
    const { photoIds, eventId } = req.body;

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
        throw new ApiError(400, "photoIds must be a non-empty array");
    }

    const event = await Event.findById(eventId);
    if (event.userId.toString() !== req.user._id.toString()) {
        throw new ApiError(
            404,
            "Only the event owner can add photos to this collection",
        );
    }

    await Collection.findByIdAndUpdate(collectionId, {
        $addToSet: {
            myPhotos: {
                $each: photoIds,
            },
        },
    });

    return res.json(new ApiResponse(200, null, "Photos added to collection"));
});

const getAllPhotos = asyncHandler(async (req, res) => {
    const { collectionId } = req.params;
    const { page, limit } = req.query;

    const collection = await Collection.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(collectionId),
                userId: req.user._id,
            },
        },
        {
            $lookup: {
                from: "photos",
                localField: "myPhotos",
                foreignField: "_id",
                as: "myPhotos",
                pipeline: [
                    { $project: { url: 1 } },
                    { $skip: Number(page) * Number(limit) },
                    { $limit: Number(limit) },
                ],
            },
        },
        {
            $unset: ["selfies"],
        },
    ]);

    return res.json(new ApiResponse(200, collection, "Photos retrieved"));
});

const getAllSelfies = asyncHandler(async (req, res) => {
    const { collectionId } = req.params;

    const collection = await Collection.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(collectionId),
                userId: req.user._id,
            },
        },
        {
            $lookup: {
                from: "photos",
                localField: "selfies",
                foreignField: "_id",
                as: "selfies",
                pipeline: [{ $project: { url: 1 } }],
            },
        },
        {
            $unset: ["myPhotos"],
        },
    ]);

    return res.json(new ApiResponse(200, collection, "Selfies retrieved"));
});

const getMyCollectionByEvent = asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    const collection = await Collection.findOne({
        eventId,
        userId: req.user._id,
    });

    return res.json(new ApiResponse(200, collection, "Collection retrieved"));
});

const getGuestCollectionByEvent = asyncHandler(async (req, res) => {
    const { eventId, userId } = req.params;

    const event = await Event.findById(eventId);
    if (!event || event.userId.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "Only the event owner can access guest collections",
        );
    }

    const collection = await Collection.findOne({ eventId, userId });

    return res.json(new ApiResponse(200, collection, "Collection retrieved"));
});

export {
    findMatchPersist,
    findMatchWithoutPersist,
    removePhoto,
    addPhoto,
    getAllPhotos,
    getAllSelfies,
    getMyCollectionByEvent,
    getGuestCollectionByEvent,
};
