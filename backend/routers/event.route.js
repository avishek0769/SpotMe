import { Router } from "express";
import { verifyStrictJWT } from "../middlewares/auth.middleware.js";
import { createEvent } from "../controllers/event.controller.js";

const eventRouter = Router();

eventRouter.route("/create").post(verifyStrictJWT, createEvent);
eventRouter.route("/edit").post(verifyStrictJWT);
eventRouter.route("/delete").delete(verifyStrictJWT);
eventRouter.route("/signed-url").get(verifyStrictJWT);
eventRouter.route("/enqueue-batch").patch(verifyStrictJWT);

export default eventRouter;
