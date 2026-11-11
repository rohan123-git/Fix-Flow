import mongoose from 'mongoose';
const assetSchema = new mongoose.Schema({
  assetName: { type: String, required: true, trim: true },
  assetCode: { type: String, required: true, unique: true, trim: true },
  category: { type: String, required: true },
  location: { type: String, required: true },
  purchaseDate: Date,
  condition: { type: String, enum: ['good', 'needs-maintenance', 'damaged'], default: 'good' },
  description: String,
  maintenanceIntervalDays: { type: Number, min: 1, max: 3650, default: 90 },
  maintenanceHistory: [{
    performedAt: { type: Date, default: Date.now },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, trim: true, maxlength: 2000 },
    parts: [{ type: String, trim: true, maxlength: 100 }],
    relatedTicket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
  }]
}, { timestamps: true });
export default mongoose.model('Asset', assetSchema);
