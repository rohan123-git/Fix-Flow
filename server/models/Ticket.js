import mongoose from 'mongoose';
const ticketSchema = new mongoose.Schema({
  title:           { type: String, required: true, trim: true, maxlength: 120 },
  description:     { type: String, required: true, maxlength: 3000 },
  category:        { type: String, required: true },
  priority:        { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  status:          { type: String, enum: ['open','assigned','in-progress','resolved','closed'], default: 'open' },
  createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedAt:      Date,
  asset:           { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', default: null },
  location:        String,
  images:          [String],
  resolutionNotes: String,
  repairChecklist: [{
    label: { type: String, required: true, trim: true, maxlength: 160 },
    completed: { type: Boolean, default: false },
    completedAt: Date,
  }],
  beforeImages: [{ type: String }],
  afterImages: [{ type: String }],
  partsUsed: [{ type: String, trim: true, maxlength: 100 }],
  dueDate:         { type: Date, default: null },
  resolvedAt:      Date,
  closedAt:        Date,
}, { timestamps: true });
ticketSchema.index({ createdBy: 1, status: 1 });
ticketSchema.index({ assignedTo: 1, status: 1 });
export default mongoose.model('Ticket', ticketSchema);
