import { Router } from "express";
import { verifyStrictJWT, verifyJWT } from "../middlewares/auth.middleware.js";
import {
    findMatch,
    removePhoto,
    addPhoto,
    getAllPhotos,
    getAllSelfies,
    getMyCollectionByEvent,
    getGuestCollectionByEvent,
} from "../controllers/collection.controller.js";

const collectionRouter = Router();

collectionRouter.route("/find/:eventId").post(verifyJWT, findMatch);
collectionRouter
    .route("/photo/remove/:collectionId")
    .delete(verifyStrictJWT, removePhoto);
collectionRouter
    .route("/photo/add/:collectionId")
    .post(verifyStrictJWT, addPhoto);
collectionRouter
    .route("/all-photos/:collectionId")
    .get(verifyStrictJWT, getAllPhotos);
collectionRouter
    .route("/all-selfies/:collectionId")
    .get(verifyStrictJWT, getAllSelfies);
collectionRouter
    .route("/my/:eventId")
    .get(verifyStrictJWT, getMyCollectionByEvent);
collectionRouter
    .route("/event/:eventId/user/:userId")
    .get(verifyStrictJWT, getGuestCollectionByEvent);

export default collectionRouter;
