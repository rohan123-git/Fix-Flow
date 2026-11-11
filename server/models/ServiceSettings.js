import mongoose from 'mongoose';

const serviceSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'workspace', unique: true },
  slaHours: {
    low: { type: Number, min: 1, max: 8760, default: 120 },
    medium: { type: Number, min: 1, max: 8760, default: 72 },
    high: { type: Number, min: 1, max: 8760, default: 24 },
    critical: { type: Number, min: 1, max: 8760, default: 4 },
  },
}, { timestamps: true });

export default mongoose.model('ServiceSettings', serviceSettingsSchema);
