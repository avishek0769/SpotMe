import Photo from "../models/photo.model.js";
import Event from "../models/event.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, GetObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import archiver from "archiver";
import { QdrantClient } from "@qdrant/js-client-rest"

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY
})

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
    const { collectionId } = req.params;
    const { filename } = req.query;

    const getObjectCommand = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `selfies/${collectionId}/${filename}`
    });

    const signedUrl = await getSignedUrl(s3, getObjectCommand, { expiresIn: 3600 });

    return res.status(200).json(new ApiResponse(
        200,
        { url: signedUrl },
        "Signed URL generated successfully"
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

    await Photo.deleteMany({ _id: { $in: photoIds } });
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
        null,
        "All photos deleted successfully"
    ));
})

export {
    getSignedUrlForEvent,
    getSignedUrlForSelfie,
    downloadSelected,
    downloadAll,
    deletePhoto
}
