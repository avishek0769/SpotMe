import Photo from "../models/photo.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const getSignedUrl = asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    const { url, fields } = await createPresignedPost(s3Client, {
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

export {
    getSignedUrl
}