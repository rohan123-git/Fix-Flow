import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'node:crypto';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const makeToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, department } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
  if (password.length < 8) return res.status(400).json({ message: 'Password must contain at least 8 characters' });
  if (await User.findOne({ email })) return res.status(409).json({ message: 'Email is already registered' });
  // Public registration always creates an employee. Admins create staff through the admin endpoint.
  const user = await User.create({ name, email, password, phone, department, role: 'employee' });
  res.status(201).json({ token: makeToken(user.id), user: { id: user.id, userId: user.userId, name: user.name, email: user.email, role: user.role, phone: user.phone, department: user.department, availability: user.availability } });
});
export const login = asyncHandler(async (req, res) => {
  const { identifier, email, password, expectedRole } = req.body;
  const loginId = String(identifier || email || '').trim();
  if (!loginId || typeof password !== 'string')
    return res.status(400).json({ message: 'Enter your email or user ID and password' });
  if (expectedRole && !['admin', 'employee', 'technician'].includes(expectedRole))
    return res.status(400).json({ message: 'Choose a valid workspace' });
  const user = await User.findOne({
    $or: [{ email: loginId.toLowerCase() }, { userId: loginId.toUpperCase() }],
  }).select('+password');
  if (!user || !user.isActive || !(await user.comparePassword(password || ''))) return res.status(401).json({ message: 'Invalid email or password' });
  if (expectedRole && user.role !== expectedRole)
    return res.status(401).json({ message: 'Invalid email or password for this workspace' });
  res.json({ token: makeToken(user.id), user: { id: user.id, userId: user.userId, name: user.name, email: user.email, role: user.role, phone: user.phone, department: user.department, availability: user.availability } });
});
export const me = asyncHandler(async (req, res) => res.json({ user: req.user }));
export const setAvailability = asyncHandler(async (req, res) => {
  const { availability } = req.body;
  if (!['available', 'busy', 'unavailable'].includes(availability))
    return res.status(400).json({ message: 'Choose a valid availability status' });
  req.user.availability = availability;
  await req.user.save();
  res.json({ availability: req.user.availability });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, department } = req.body;
  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 100))
    return res.status(400).json({ message: 'Name must contain 1 to 100 characters' });
  if (phone !== undefined && (typeof phone !== 'string' || phone.trim().length > 30))
    return res.status(400).json({ message: 'Phone number must be 30 characters or fewer' });
  if (department !== undefined && (typeof department !== 'string' || department.trim().length > 80))
    return res.status(400).json({ message: 'Department must be 80 characters or fewer' });
  if (name !== undefined) req.user.name = name.trim();
  if (phone !== undefined) req.user.phone = phone.trim();
  if (department !== undefined) req.user.department = department.trim();
  await req.user.save();
  res.json({ user: {
    id: req.user.id, userId: req.user.userId, name: req.user.name, email: req.user.email,
    role: req.user.role, phone: req.user.phone, department: req.user.department,
    availability: req.user.availability,
  } });
});

export const requestPasswordReset = asyncHandler(async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ message: 'Enter a valid email address' });
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpFrom = process.env.SMTP_FROM;
  if (!smtpHost || !smtpFrom || !Number.isInteger(smtpPort))
    return res.status(503).json({ message: 'Password reset email is not configured. Contact your workspace administrator.' });

  const user = await User.findOne({ email });
  if (!user) return res.status(202).json({ message: 'If that account exists, a reset link will be sent.' });
  const resetToken = randomBytes(32).toString('hex');
  user.resetPasswordTokenHash = createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
  await user.save();

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
  });
  const resetUrl = new URL('/reset-password', process.env.CLIENT_URL || 'http://localhost:5173');
  resetUrl.searchParams.set('token', resetToken);
  try {
    await transporter.sendMail({
      from: smtpFrom,
      to: user.email,
      subject: 'Reset your FixFlow password',
      text: `Use this one-time link within 30 minutes to reset your FixFlow password: ${resetUrl}`,
    });
  } catch (error) {
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    console.error('Password reset email delivery failed:', error);
    return res.status(503).json({ message: 'Unable to send a password reset email. Contact your workspace administrator.' });
  }
  res.status(202).json({ message: 'If that account exists, a reset link will be sent.' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (typeof token !== 'string' || !/^[\da-f]{64}$/i.test(token))
    return res.status(400).json({ message: 'The reset link is invalid or expired' });
  if (typeof password !== 'string' || password.length < 8 || password.length > 128)
    return res.status(400).json({ message: 'Password must contain 8 to 128 characters' });
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpires: { $gt: new Date() },
  }).select('+resetPasswordTokenHash +resetPasswordExpires');
  if (!user) return res.status(400).json({ message: 'The reset link is invalid or expired' });
  user.password = password;
  user.resetPasswordTokenHash = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  res.json({ message: 'Password updated. You can now sign in.' });
});
