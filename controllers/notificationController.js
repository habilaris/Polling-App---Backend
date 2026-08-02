import Notification from "../models/notification.js";

// Create a notification that come for vote or comment
export const notify = ({ user, poll, actor, type }) => {
  if (!user || String(user) === String(actor)) return;
  try {
    Notification.create({ user, poll, actor, type });
  } catch (e) {}
};

// unread count with latest notification
export const getNotifications = async (req, res) => {
  try {
    const items = await Notification.find({ user: req.user._id })
      .populate("actor", "name username avatar")
      .populate("poll", "question")
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      read: false,
    });
    res.json({ items, unreadCount });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// To mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.userId, read: false },
      { read: true },
    );

    res.json({ ok: true, message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
