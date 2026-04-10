import { Router } from "express";
import { verifyStrictJWT } from "../middlewares/auth.middleware.js";
import { createEvent, getAllEvents, deleteEvent, editEvent, getSignedUrl, enqueueBatch } from "../controllers/event.controller.js";

const eventRouter = Router();

eventRouter.route("/create").post(verifyStrictJWT, createEvent);
eventRouter.route("/list").get(verifyStrictJWT, getAllEvents);
eventRouter.route("/edit/:eventId").patch(verifyStrictJWT, editEvent);
eventRouter.route("/delete/:eventId").delete(verifyStrictJWT, deleteEvent);
eventRouter.route("/enqueue-batch").post(verifyStrictJWT, enqueueBatch);

export default eventRouter;
