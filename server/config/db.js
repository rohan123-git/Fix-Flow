import mongoose from 'mongoose';
import User from '../models/User.js';

export default async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI);
  await User.updateMany(
    { $or: [{ userId: { $exists: false } }, { userId: null }] },
    [{ $set: { userId: { $concat: ['FF-', { $toUpper: { $toString: '$_id' } }] } } }]
  );
  console.log('MongoDB connected');
}
