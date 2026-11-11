import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  userId: { type: String, unique: true, sparse: true, immutable: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8, select: false },
  isActive: { type: Boolean, default: true },
  resetPasswordTokenHash: { type: String, select: false },
  resetPasswordExpires: { type: Date, select: false },
  role: { type: String, enum: ['admin', 'employee', 'technician'], default: 'employee' },
  phone: String,
  department: String,
  availability: { type: String, enum: ['available', 'busy', 'unavailable'], default: 'available' },
  skills: [{ type: String, trim: true }],
  experienceYears: { type: Number, min: 0, max: 60, default: 0 },
  rating: { type: Number, min: 0, max: 5, default: 5 }
}, { timestamps: true });

userSchema.pre('validate', function () {
  if (!this.userId && this._id) this.userId = `FF-${this._id.toString().toUpperCase()}`;
});
userSchema.pre('save', async function () {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 12);
});
userSchema.methods.comparePassword = function (candidate) { return bcrypt.compare(candidate, this.password); };
export default mongoose.model('User', userSchema);
