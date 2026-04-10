import { Router } from "express";
import { verifyStrictJWT } from "../middlewares/auth.middleware.js";
import { getSignedUrl } from "../controllers/photo.controller.js";

const photoRouter = Router();

photoRouter.route("/signed-url/:eventId").get(verifyStrictJWT, getSignedUrl);

export default photoRouter;
