import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../models/User.js';

export default async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    await User.updateMany(
      { $or: [{ userId: { $exists: false } }, { userId: null }] },
      [{ $set: { userId: { $concat: ['FF-', { $toUpper: { $toString: '$_id' } }] } } }]
    );
    return;
  }

  if (!process.env.MONGO_URI) {
    const memoryMongo = await MongoMemoryServer.create();
    process.env.MONGO_URI = memoryMongo.getUri();
  }

  await mongoose.connect(process.env.MONGO_URI);
  await User.updateMany(
    { $or: [{ userId: { $exists: false } }, { userId: null }] },
    [{ $set: { userId: { $concat: ['FF-', { $toUpper: { $toString: '$_id' } }] } } }]
  );
  console.log('MongoDB connected');
}
