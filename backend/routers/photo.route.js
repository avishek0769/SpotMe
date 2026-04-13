import { Router } from "express";
import { verifyStrictJWT } from "../middlewares/auth.middleware.js";
import multer from "multer";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import {
    getSignedUrlForEvent,
    getSignedUrlForSelfie,
    createSelfie,
    uploadSelfiesWithoutPersist,
    downloadAll,
    downloadSelected,
    downloadAllFoundWithoutPersist,
    deletePhoto,
    deleteSelfie,
} from "../controllers/photo.controller.js";

const photoRouter = Router();
const tempSelfieDir = path.join("images", "temp_selfies");
fs.mkdirSync(tempSelfieDir, { recursive: true });

const tempSelfieUpload = multer({
    storage: multer.diskStorage({
        destination: (_, __, cb) => cb(null, tempSelfieDir),
        filename: (_, file, cb) => {
            const ext = path.extname(file.originalname) || ".jpg";
            cb(null, `${uuidv4()}${ext}`);
        },
    }),
    limits: { files: 3, fileSize: 15 * 1024 * 1024 },
    fileFilter: (_, file, cb) => {
        if (file.mimetype?.startsWith("image/")) cb(null, true);
        else cb(new Error("Only image files are allowed"));
    },
});

photoRouter
    .route("/signed-url/event/:eventId")
    .get(verifyStrictJWT, getSignedUrlForEvent);
photoRouter
    .route("/signed-url/selfie")
    .get(verifyStrictJWT, getSignedUrlForSelfie);
photoRouter
    .route("/create/selfie/:eventId")
    .post(verifyStrictJWT, createSelfie);
photoRouter
    .route("/upload/selfie-temp")
    .post(tempSelfieUpload.array("selfies", 3), uploadSelfiesWithoutPersist);
photoRouter
    .route("/download/selected/:eventId")
    .post(verifyStrictJWT, downloadSelected);
photoRouter
    .route("/download/all/found/:eventId")
    .post(downloadAllFoundWithoutPersist);
photoRouter
    .route("/download/all/event/:eventId")
    .get(verifyStrictJWT, downloadAll);
photoRouter
    .route("/download/all/collection/:collectionId/:eventId")
    .get(verifyStrictJWT, downloadAll);
photoRouter
    .route("/delete/event/:eventId")
    .delete(verifyStrictJWT, deletePhoto);
photoRouter
    .route("/delete/selfie/:collectionId")
    .delete(verifyStrictJWT, deleteSelfie);

export default photoRouter;
