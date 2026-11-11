import mongoose from 'mongoose';
const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['ticket', 'assignment', 'status', 'system'], default: 'system' },
  relatedTicket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });
export default mongoose.model('Notification', notificationSchema);
