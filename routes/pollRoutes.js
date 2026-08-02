import express from "express";
import { protect } from "../middleware/auth.js";
import {
  createPoll,
  bookmarkSet,
  listPolls,
  sendList,
  getMyPolls,
  getVotedPolls,
  getBookmarkedPolls,
  getTrending,
  getPoll,
  getPollStats,
  cleanUpGhostPolls,
} from "../controllers/pollController.js";
import { upload } from "../config/cloudinary.js";
import {
  closePoll,
  deletePoll,
  toggleBookmark,
  votePoll,
} from "../controllers/voteController.js";

const pollRouter = express.Router();
pollRouter.use(protect);

pollRouter.delete("/cleanup-ghosts", cleanUpGhostPolls);

pollRouter.get("/", listPolls);
pollRouter.post("/", upload.array("images", 4), createPoll);
pollRouter.get("/mine", getMyPolls);

pollRouter.get("/voted", getVotedPolls);
pollRouter.get("/bookmarks", getBookmarkedPolls);
pollRouter.get("/trending", getTrending);

pollRouter.get("/:id/analytics", getPollStats);
pollRouter.get("/:id", getPoll);
pollRouter.post("/:id/close", closePoll);
pollRouter.post("/:id/bookmark", toggleBookmark);
pollRouter.delete("/:id", deletePoll);

// vote
pollRouter.post("/:id/vote", votePoll);

export default pollRouter;
