import { Router } from "express";
import { verifyStrictJWT } from "../middlewares/auth.middleware.js";
import { getSignedUrlForEvent, getSignedUrlForSelfie, downloadAll, downloadSelected, deletePhoto } from "../controllers/photo.controller.js";

const photoRouter = Router();

photoRouter.route("/signed-url/event/:eventId").get(verifyStrictJWT, getSignedUrlForEvent);
photoRouter.route("/signed-url/selfie/:collectionId").get(verifyStrictJWT, getSignedUrlForSelfie); // Test
photoRouter.route("/download/selected/:eventId").post(verifyStrictJWT, downloadSelected);
photoRouter.route("/download/all/event/:eventId").get(verifyStrictJWT, downloadAll);
photoRouter.route("/download/all/collection/:collectionId/:eventId").get(verifyStrictJWT, downloadAll); // Test
photoRouter.route("/delete/event/:eventId").delete(verifyStrictJWT, deletePhoto);
photoRouter.route("/delete/selfie/:collectionId").delete(verifyStrictJWT); // Test

export default photoRouter;
