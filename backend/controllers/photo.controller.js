import Photo from "../models/photo.model.js";
import Event from "../models/event.model.js";
import Collection from "../models/collection.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, GetObjectCommand, DeleteObjectsCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import archiver from "archiver";
import qdrant from "../utils/qdrant.js";
import { v4 as uuidv4 } from 'uuid';

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const getSignedUrlForEvent = asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    const { url, fields } = await createPresignedPost(s3, {
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

const getSignedUrlForSelfie = asyncHandler(async (req, res) => {
    let { fileCount, eventId } = req.query;

    fileCount = parseInt(fileCount);
    if (!fileCount || fileCount < 1 || fileCount > 3) {
        throw new ApiError(400, "Invalid file count. Please specify a number between 1 and 3.");
    }

    const collection = await Collection.findOne({ userId: req.user._id, eventId });

    if (collection.selfies.length + fileCount > 3) {
        throw new ApiError(400, `Selfie upload limit exceeded. You can upload a maximum of 3 selfies. You have already uploaded ${collection.selfies.length} selfie(s).`);
    }

    const urlPromises = Array.from({ length: fileCount }, () => {
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: `selfies/${uuidv4()}}`,
        });

        return getSignedUrl(s3, command, { expiresIn: 3600 });
    });

    const signedUrls = await Promise.all(urlPromises);

    return res.status(200).json(new ApiResponse(
        200,
        { urls: signedUrls },
        "Signed URLs generated successfully"
    ));
});

const createSelfie = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { urls } = req.body;

    if (urls.length > 3) {
        throw new ApiError(400, "You can upload a maximum of 3 selfies at a time.");
    }

    let collection = await Collection.findOne({
        eventId,
        userId: req.user._id
    });
    if (collection?.selfies?.length >= 3) {
        throw new ApiError(400, `Selfie upload limit exceeded. You can upload a maximum of 3 selfies. You have already uploaded ${collection.selfies.length} selfie(s).`);
    }
    if (!collection) {
        collection = await Collection.create({
            eventId,
            userId: req.user._id
        });
    }

    const createdPhotos = await Photo.insertMany(
        urls.map(url => ({
            url,
            eventId,
            collectionIds: [collection._id]
        }))
    );

    collection = await Collection.findByIdAndUpdate(
        collection._id,
        {
            $addToSet: {
                selfies: {
                    $each: createdPhotos.map(photo => photo._id)
                }
            }
        },
        { new: true }
    );

    return res.status(201).json(new ApiResponse(
        201,
        { photos: createdPhotos, collection },
        "Selfies added to collection successfully"
    ));
})

const downloadSelected = asyncHandler(async (req, res) => {
    const { fileNames } = req.body;
    const { eventId } = req.params;
    const archive = archiver("zip", { zlib: { level: 5 } })

    res.attachment("selected_images.zip");
    archive.pipe(res)

    for (const fileName of fileNames) {
        const command = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: `event_images/${eventId}/${fileName}`
        })
        const { Body } = await s3.send(command);
        archive.append(Body, { name: fileName });
    }

    archive.finalize();
});

const downloadAll = asyncHandler(async (req, res) => {
    const { eventId, collectionId } = req.params;

    let allPhotos;
    if (collectionId) {
        allPhotos = await Photo.find({
            $in: { collectionIds: collectionId },
            eventId
        });
    }
    else {
        allPhotos = await Photo.find({ eventId });
    }

    const allFileKeys = allPhotos.map(photo => photo.url.split("/").pop())

    const archive = archiver("zip", { zlib: { level: 5 } })

    res.attachment("all_images.zip");
    archive.pipe(res)

    for (const fileName of allFileKeys) {
        const command = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: `event_images/${eventId}/${fileName}`
        })
        const { Body } = await s3.send(command);
        archive.append(Body, { name: fileName });
    }

    archive.finalize();
})

const deletePhoto = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { fileNames, photoIds } = req.body;

    const event = await Event.findById(eventId);
    if (event?.userId.toString() !== req.user._id.toString()) {
        throw new ApiError(404, "User not authorized to delete photos of this event");
    }

    if (fileNames?.length > 0) {
        const deleteParams = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Delete: {
                Objects: fileNames.map(name => ({ Key: `event_images/${eventId}/${name}` })),
                Quiet: true,
            },
        };
        await s3.send(new DeleteObjectsCommand(deleteParams));
    }

    const deleted = await Photo.deleteMany({ _id: { $in: photoIds } });
    await qdrant.delete(`Event_${eventId}`, {
        wait: true,
        filter: {
            must: [{
                key: "photoId",
                match: {
                    any: photoIds
                }
            }]
        }
    });

    return res.status(200).json(new ApiResponse(
        200,
        { deletedCount: deleted.deletedCount },
        "All photos deleted successfully"
    ));
})

const deleteSelfie = asyncHandler(async (req, res) => {
    const { collectionId } = req.params;
    const { fileNames, photoIds } = req.body;
    const collection = await Collection.findById(collectionId);

    if (collection?.userId.toString() !== req.user._id.toString()) {
        throw new ApiError(404, "User not authorized to delete selfies of this collection");
    }

    const deleteParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Delete: {
            Objects: fileNames.map(name => ({ Key: `selfies/${collectionId}/${name}` })),
            Quiet: true,
        },
    };
    await s3.send(new DeleteObjectsCommand(deleteParams));

    const deleted = await Photo.deleteMany({ _id: { $in: photoIds } });

    return res.status(200).json(new ApiResponse(
        200,
        { deletedCount: deleted.deletedCount },
        "All selfies deleted successfully"
    ));
})

export {
    getSignedUrlForEvent,
    getSignedUrlForSelfie,
    downloadSelected,
    downloadAll,
    deletePhoto,
    deleteSelfie,
    createSelfie
}
