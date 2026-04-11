import Photo from "../models/photo.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";


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

export {
    getSignedUrlForEvent,
    getSignedUrlForSelfie
}