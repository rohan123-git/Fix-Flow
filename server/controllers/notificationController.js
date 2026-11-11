import Notification from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';
export const listNotifications = asyncHandler(async (req, res) => res.json({ notifications: await Notification.find({ recipient: req.user.id }).sort({ createdAt: -1 }).limit(50) }));
export const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user.id }, { isRead: true }, { new: true });
  if (!notification) return res.status(404).json({ message: 'Notification not found' });
  res.json({ notification });
});
