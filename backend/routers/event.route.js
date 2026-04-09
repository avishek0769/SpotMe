import { Router } from "express";
import { verifyStrictJWT } from "../middlewares/auth.middleware.js";
import { createEvent, editEvent, getSignedUrl } from "../controllers/event.controller.js";

const eventRouter = Router();

eventRouter.route("/create").post(verifyStrictJWT, createEvent);
eventRouter.route("/edit/:eventId").patch(verifyStrictJWT, editEvent);
eventRouter.route("/delete").delete(verifyStrictJWT);
eventRouter.route("/signed-url/:eventId").get(verifyStrictJWT, getSignedUrl);
eventRouter.route("/enqueue-batch").patch(verifyStrictJWT);

export default eventRouter;
