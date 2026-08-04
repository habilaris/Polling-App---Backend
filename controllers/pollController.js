import User from "../models/user.js";
import Comment from "../models/comment.js";
import Poll from "../models/poll.js";

import { shapePoll } from "../utils/pollShape.js";
import { withCounts } from "../utils/counts.js";
import { uploadToCloudinary } from "../config/cloudinary.js";

const POP = [{ path: "creator", select: "name username avatar" }];

//  To bookmark id-set for  logged in users
export const bookmarkSet = async (userId) => {
  // Selects helps you retrieve the user object with only the necessary field you need to work on
  const me = await User.findById(userId).select("bookmarks");
  return new Set((me?.bookmarks || []).map(String));
};

// To create a poll
export const createPoll = async (req, res) => {
  try {
    const { question, type, category } = req.body;
    if (!question || !type) {
      console.log({ message: "Question and Type are Required" });
    }

    let options = [];
    if (type === "yesno") {
      options = [{ text: "Yes" }, { text: "No" }];
    } else if (type === "single") {
      const parsed = JSON.parse(req.body.options || "[]");
      options = parsed
        .filter((t) => t && t.trim())
        .map((t) => ({ text: t.trim() }));
      if (options.length < 2)
        return res.status(400).json({ message: "Add at least 2 options" });
    } else if (type === "image") {
      if (!req.files || req.files.length < 2)
        return res.status(400).json({ message: "Add at least 2 images" });
      const urls = await Promise.all(
        req.files.map((f) => uploadToCloudinary(f.buffer)),
      );
      options = urls.map((image) => ({ image, text: "" }));
    }

    // ======================================================>

    const poll = await Poll.create({
      creator: req.userId,
      question,
      type,
      category,
      options,
    });

    res.status(201).json(poll);
  } catch (e) {
    res.status(500).json({
      message: e.message,
    });
  }
};

// Shared list as a helper function for voted mine feed
export const sendList = async (req, res, filter) => {
  const polls = await Poll.find(filter).populate(POP).sort({ createdAt: -1 });

  const set = await bookmarkSet(req.userId);
  const shaped = polls.map((p) => shapePoll(p, req.userId, set));
  res.json(await withCounts(shaped));
};

// listPolls get listed polls
export const listPolls = async (req, res) => {
  try {
    const filter = {};
    if (req.query.type && req.query.type !== "all") {
      filter.type = req.query.type;
    }
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // User following another user can filter by following filter
    if (req.query.feed === "following") {
      const me = await User.findById(req.userId).select("following");
      filter.creator = { $in: me?.following || [] };
    }

    await sendList(req, res, filter);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// To get your own polls
export const getMyPolls = async (req, res) => {
  try {
    await sendList(req, res, { creator: req.userId });
  } catch (error) {
    console.log("Error in getMyPolls in poll controller: ", error);
  }
};

// getVotedPolls i.e the polls which i voted on
export const getVotedPolls = async (req, res) => {
  try {
    await sendList({ "votes.user": req.userId }, req, res);
  } catch (error) {
    console.log("Error in get voted polls in poll controller: " + error);
  }
};

// Poll which i have bookmarked on (GET)
export const getBookmarkedPolls = async (req, res) => {
  try {
    const me = await User.findById(req.userId).populate({
      path: "bookmarks",
      populate: { path: "creator", select: "name username avatar" },
    });

    const set = new Set(me?.bookmarks?.map((p) => String(p._id)) || []);
    const shaped =
      me?.bookmarks?.map((p) => {
        const pollShape = shapePoll(p, req.userId, set);
        return { ...pollShape, isBookmarked: true };
      }) || [];

    res.json(await withCounts(shaped));
  } catch (error) {
    console.log("Error in get bookmarked polls in poll controller: " + error);
  }
};

// To get the polls per type
export const getTrending = async (req, res) => {
  try {
    const types = ["single", "yesno", "rating", "image", "open"];
    const counts = await Promise.all(
      types.map(async (type) => Poll.countDocuments({ type })),
    );
    res.json(types.map((type, i) => ({ type, count: counts[i] })));
  } catch (error) {
    console.log("Error in get trending in poll controller: " + error);
    res.status(500).json({ message: error.message });
  }
};

// To get a single poll (used by shareable public view)
export const getPoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id).populate(POP);
    if (!poll) return res.status(404).json({ message: "Poll not found" });

    // Prevent view increment if request specifies ?noview=true OR if the user is the creator
    const creatorId = poll.creator?._id || poll.creator; //i.e: Not to increment view count if the user is the creator of the poll
    const isCreator = String(creatorId) === String(req.userId);
    const skipView = req.query.noview === "true";

    if (!isCreator && !skipView) {
      poll.views = (poll.views || 0) + 1; // count this view
      await poll.save();
    }

    const set = await bookmarkSet(req.userId);
    const [shaped] = await withCounts([shapePoll(poll, req.userId, set)]);
    res.json(shaped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// To get creator only-stats (no view increment)
export const getPollStats = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id).populate(POP);
    if (!poll) return res.status(404).json({ message: "Poll not found" });

    if (String(poll.creator._id) !== String(req.userId))
      return res.status(401).json({
        message: "Unauthorized",
      });

    const shaped = shapePoll(poll, req.userId);
    const comments = await Comment.countDocuments({ poll: poll._id });

    res.json({ poll: shaped, comments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const cleanUpGhostPolls = async (req, res) => {
  try {
    const allPolls = await Poll.find();
    let deleted = 0;

    for (const poll of allPolls) {
      const user = await User.findById(poll.creator);
      if (!user) {
        await Poll.findByIdAndDelete(poll._id);
        deleted++;
      }
    }
    res.status(200).json({ message: `Cleaned up ${deleted} ghost polls!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
