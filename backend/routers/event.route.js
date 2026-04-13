import { Router } from "express";
import { verifyStrictJWT } from "../middlewares/auth.middleware.js";
import {
    createEvent,
    getAllCreatedEvents,
    getAllSharedEvents,
    deleteEvent,
    editEvent,
    uploadComplete,
    enqueueBatch,
    getDetails,
    getAllPhotos,
    getAllGuests,
} from "../controllers/event.controller.js";

const eventRouter = Router();

eventRouter.route("/create").post(verifyStrictJWT, createEvent);
eventRouter.route("/created/list").get(verifyStrictJWT, getAllCreatedEvents);
eventRouter.route("/shared/list").get(verifyStrictJWT, getAllSharedEvents);
eventRouter.route("/details/:eventId").get(verifyStrictJWT, getDetails);
eventRouter.route("/all-photos/:eventId").get(verifyStrictJWT, getAllPhotos);
eventRouter.route("/all-guests/:eventId").get(verifyStrictJWT, getAllGuests);
eventRouter.route("/edit/:eventId").patch(verifyStrictJWT, editEvent);
eventRouter.route("/complete/:eventId").patch(verifyStrictJWT, uploadComplete);
eventRouter.route("/delete/:eventId").delete(verifyStrictJWT, deleteEvent);
eventRouter
    .route("/enqueue-batch/:eventId")
    .post(verifyStrictJWT, enqueueBatch);

export default eventRouter;
