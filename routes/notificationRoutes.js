import express from "express";
import { protect } from "../middleware/auth.js";
import { getNotifications } from "../controllers/notificationController.js";
import { markAllAsRead } from "../controllers/notificationController.js";

const notificationRouter = express.Router();

notificationRouter.use(protect);

notificationRouter.get("/", getNotifications);
notificationRouter.patch("/read", markAllAsRead);

export default notificationRouter;
