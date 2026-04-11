import { Router } from "express";
import { verifyStrictJWT, verifyJWT } from "../middlewares/auth.middleware.js";

const collectionRouter = Router();

collectionRouter.route("/find/:eventId").post(verifyJWT);
collectionRouter.route("/photo/remove/:collectionId").delete(verifyStrictJWT);
collectionRouter.route("/photo/add/:collectionId").post(verifyStrictJWT);
collectionRouter.route("/all-photos/:collectionId").get(verifyStrictJWT);
collectionRouter.route("/all-selfies/:collectionId").get(verifyStrictJWT);

export default collectionRouter;
