import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
dotenv.config();
try {
  await mongoose.connect(process.env.MONGO_URI);
  const email = process.argv[2]; const password = process.argv[3]; const name = process.argv[4] || 'FixFlow Administrator';
  if (!email || !password || password.length < 8) throw new Error('Usage: node scripts/seedAdmin.js admin@example.com StrongPassword123 [Name]');
  const existing = await User.findOne({ email });
  if (existing) throw new Error('This email already exists. Use a new email or update the user role manually.');
  await User.create({ name, email, password, role: 'admin' });
  console.log(`Admin account created: ${email}`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { await mongoose.disconnect(); }
