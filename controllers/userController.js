import User from "../models/User.js";
import Poll from "../models/Poll.js";
import { withCounts } from "../utils/counts.js";
import { shapePoll } from "../utils/pollShape.js";

// to get public profile on the poll they have created
export const getPublicProfile = async (req, res) => {
  try {
    // FIXED: Changed findone to findOne
    const user = await User.findOne({ username: req.params.username }).select(
      "name username avatar bio following",
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    const [polls, voted, followers, me] = await Promise.all([
      Poll.find({ creator: user._id })
        .populate("creator", "name username avatar")
        .sort("-createdAt"),
      Poll.countDocuments({ "votes.user": user._id }),
      User.countDocuments({ following: user._id }),
      User.findById(req.userId).select("bookmarks following"),
    ]);

    const set = new Set((me?.bookmarks || []).map(String));

    const isFollowing = (me?.following || []).some(
      (id) => String(id) === String(user._id),
    );

    // ADDED: Checks if the viewed profile follows the logged-in user back
    const followsMe = (user.following || []).some(
      (id) => String(id) === String(req.userId),
    );

    const shaped = await withCounts(
      polls.map((p) => shapePoll(p, req.userId, set)),
    );

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
      },
      isFollowing,
      followsMe, // Added to response so frontend can show "Follows you" badge
      isMe: String(user._id) === String(req.userId),
      stats: {
        created: polls.length,
        voted,
        followers,
        following: user.following.length,
      },
      polls: shaped,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// to follow another user or unfollow
export const toggleFollow = async (req, res) => {
  try {
    // FIXED: Find by username query object instead of treating username as an ID
    const target = await User.findOne({ username: req.params.username }).select(
      "_id",
    );

    if (!target) return res.status(404).json({ message: "User not found" });

    // FIXED: Added 'return' to prevent server crash if a user tries to follow themselves
    if (String(target._id) === String(req.userId)) {
      return res.status(400).json({ message: "You can't follow yourself" });
    }

    const me = await User.findById(req.userId).select("following");

    const already = me.following.some(
      (id) => String(id) === String(target._id),
    );

    if (already) {
      me.following.pull(target._id);
    } else {
      me.following.push(target._id);
    }

    await me.save();

    const followers = await User.countDocuments({ following: target._id });
    res.json({ following: !already, followers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// to see who the user follows and who follows the user
export const getConnections = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select("_id following")
      .populate("following", "name username avatar");

    if (!user) return res.status(404).json({ message: "User not found" });

    const followers = await User.find({ following: user._id }).select(
      "name username avatar",
    );

    res.json({ following: user.following, followers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
