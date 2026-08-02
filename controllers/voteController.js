import User from "../models/user.js";
import Poll from "../models/poll.js";
import Comment from "../models/comment.js";
import { notify } from "./notificationController.js";

// to vote on a Poll
export const votePoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);

    if (!poll) return res.status(404).json({ message: "Poll not found" });
    if (poll.closed) return res.status(400).json({ message: "Poll is closed" });

    const { value } = req.body;
    if (value === undefined || value === null || value === "")
      return res.status(400).json({ message: "Value is required" });

    // for the user can vote only once on a poll
    const hadVoted = poll.votes.some(
      (v) => String(v.user) === String(req.userId),
    );
    poll.votes = poll.votes.filter(
      (v) => String(v.user) !== String(req.userId),
    );

    poll.votes.push({ user: req.userId, value });
    await poll.save();
    if (!hadVoted)
      await notify({
        user: poll.creator,
        actor: req.userId,
        poll: poll._id,
        type: "vote",
      });

    res.json({ message: "Voted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// remove your own vote
export const removeVote = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ message: "Poll not found" });
    if (poll.closed) return res.status(400).json({ message: "Poll is closed" });

    poll.votes = poll.votes.filter(
      (v) => String(v.user) !== String(req.userId),
    );
    await poll.save();
    res.json({ message: "Vote removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// only creator can close or delete a poll
export const ownerGuard = (poll, userId) =>
  poll && String(poll.creator) === String(userId);

// update any poll(of that user)
export const updatePoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ message: "Poll not found" });
    if (!ownerGuard(poll, req.userId))
      return res.status(403).json({ message: "Not your poll" });
    const { question, category } = req.body;
    if (question !== undefined && question.trim())
      poll.question = question.trim();
    if (category !== undefined) poll.category = category;
    await poll.save();
    res.json({ message: "Poll updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// to add remove from my bookmark
export const toggleBookmark = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const id = req.params.id;
    const has = user.bookmarks.some((b) => String(b) === String(id));
    user.bookmarks = has
      ? user.bookmarks.filter((b) => String(b) !== String(id))
      : [...user.bookmarks, id];
    await user.save();
    res.json({ bookmarked: !has });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// to open or close a poll
export const closePoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ message: "Poll not found" });
    if (!ownerGuard(poll, req.userId))
      return res.status(403).json({ message: "Not your poll" });

    poll.closed = !poll.closed;
    await poll.save();
    res.json({ closed: poll.closed });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// to delete a poll
export const deletePoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ message: "Poll not found" });
    if (!ownerGuard(poll, req.userId))
      return res.status(403).json({ message: "Not your poll" });

    await Comment.deleteMany({ poll: poll._id });
    await poll.deleteOne();
    res.json({ message: "Poll deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
