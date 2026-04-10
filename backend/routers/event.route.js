import { Router } from "express";
import { verifyStrictJWT, verifyJWT } from "../middlewares/auth.middleware.js";
import { createEvent, getAllEvents, deleteEvent, editEvent, enqueueBatch } from "../controllers/event.controller.js";

const eventRouter = Router();

eventRouter.route("/create").post(verifyStrictJWT, createEvent);
eventRouter.route("/list").get(verifyStrictJWT, getAllEvents);
eventRouter.route("/details/:eventId").get(verifyStrictJWT);
eventRouter.route("/all-photos/:eventId").get(verifyStrictJWT);
eventRouter.route("/all-guests/:eventId").get(verifyStrictJWT);
eventRouter.route("/guest/visit/:eventId").get(verifyJWT);
eventRouter.route("/edit/:eventId").patch(verifyStrictJWT, editEvent);
eventRouter.route("/delete/:eventId").delete(verifyStrictJWT, deleteEvent);
eventRouter.route("/enqueue-batch").post(verifyStrictJWT, enqueueBatch);

export default eventRouter;
