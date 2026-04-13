import { Router } from "express";
import { verifyStrictJWT } from "../middlewares/auth.middleware.js";
import {
    findMatchPersist,
    findMatchWithoutPersist,
    removePhoto,
    addPhoto,
    getAllPhotos,
    getAllSelfies,
    getMyCollectionByEvent,
    getGuestCollectionByEvent,
} from "../controllers/collection.controller.js";

const collectionRouter = Router();

collectionRouter.route("/find-persist/:eventId").post(verifyStrictJWT, findMatchPersist);
collectionRouter.route("/find-without-persist/:eventId").post(findMatchWithoutPersist);
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
