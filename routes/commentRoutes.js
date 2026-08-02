import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getComments,
  addComment,
  deleteComment,
} from "../controllers/commentController.js";

const commentRouter = express.Router();
commentRouter.use(protect);

commentRouter.get("/:pollId", getComments);
commentRouter.post("/:pollId", addComment);

commentRouter.delete("/:id", deleteComment);

export default commentRouter;
