import mongoose from 'mongoose';
const historySchema = new mongoose.Schema({
  ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  previousStatus: String,
  newStatus: String,
  remarks: String
}, { timestamps: true });
export default mongoose.model('TicketHistory', historySchema);
