import Notification from '../models/Notification.js';

export const getNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const notes = await Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(50);
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const markRead = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params; // notification id
    const note = await Notification.findOne({ _id: id, user: userId });
    if (!note) return res.status(404).json({ message: 'Notification not found' });
    note.read = true;
    await note.save();
    res.json({ message: 'Marked read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const markAllRead = async (req, res) => {
  try {
    const userId = req.userId;
    await Notification.updateMany({ user: userId, read: false }, { $set: { read: true } });
    res.json({ message: 'All marked read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
