import { Router } from "express";
import { verifyStrictJWT, verifyJWT } from "../middlewares/auth.middleware.js";
import { findMatch, removePhoto, addPhoto } from "../controllers/collection.controller.js";

const collectionRouter = Router();

collectionRouter.route("/find/:eventId").post(verifyJWT, findMatch);
collectionRouter.route("/photo/remove/:collectionId").delete(verifyStrictJWT, removePhoto);
collectionRouter.route("/photo/add/:collectionId").post(verifyStrictJWT, addPhoto);
collectionRouter.route("/all-photos/:collectionId").get(verifyStrictJWT);
collectionRouter.route("/all-selfies/:collectionId").get(verifyStrictJWT);

export default collectionRouter;
