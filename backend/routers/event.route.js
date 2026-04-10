import { Router } from "express";
import { verifyStrictJWT, verifyJWT } from "../middlewares/auth.middleware.js";
import { createEvent, getAllEvents, deleteEvent, editEvent, enqueueBatch, getDetails, getAllPhotos, getAllGuests } from "../controllers/event.controller.js";

const eventRouter = Router();

eventRouter.route("/create").post(verifyStrictJWT, createEvent);
eventRouter.route("/list").get(verifyStrictJWT, getAllEvents);
eventRouter.route("/details/:eventId").get(verifyStrictJWT, getDetails);
eventRouter.route("/all-photos/:eventId").get(verifyStrictJWT, getAllPhotos);
eventRouter.route("/all-guests/:eventId").get(verifyStrictJWT, getAllGuests);
eventRouter.route("/edit/:eventId").patch(verifyStrictJWT, editEvent);
eventRouter.route("/delete/:eventId").delete(verifyStrictJWT, deleteEvent);
eventRouter.route("/enqueue-batch").post(verifyStrictJWT, enqueueBatch);

export default eventRouter;
