import { Router } from "express";
import { verifyStrictJWT } from "../middlewares/auth.middleware.js";
import { createEvent } from "../controllers/event.controller.js";

const eventRouter = Router();

eventRouter.route("/create").post(verifyStrictJWT, createEvent);

export default eventRouter;
