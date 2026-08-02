import User from "../models/User.js";
import Comment from "../models/comment.js";

// Function to count comments and saves for given poll IDs
export async function countsFor(pollIds) {
  if (!pollIds.length) return { commentMap: {}, saveMap: {} };

  const [comments, saves] = await Promise.all([
    Comment.aggregate([
      { $match: { poll: { $in: pollIds } } },
      { $group: { _id: "$poll", n: { $sum: 1 } } },
    ]),
    User.aggregate([
      { $match: { bookmarks: { $in: pollIds } } },
      { $unwind: "$bookmarks" },
      { $match: { bookmarks: { $in: pollIds } } },
      { $group: { _id: "$bookmarks", n: { $sum: 1 } } },
    ]),
  ]);
  const commentMap = {};
  const saveMap = {};
  comments.forEach((c) => (commentMap[String(c._id)] = c.n));
  saves.forEach((s) => (saveMap[String(s._id)] = s.n));

  return { commentMap, saveMap };
}

// Function to add comment and save counts to shaped polls
export async function withCounts(shapedPolls) {
  const { commentMap, saveMap } = await countsFor(
    shapedPolls.map((p) => p._id),
  );
  return shapedPolls.map((p) => ({
    ...p,
    comments: commentMap[String(p._id)] || 0,
    saves: saveMap[String(p._id)] || 0,
  }));
}
