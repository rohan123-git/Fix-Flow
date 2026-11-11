import User from '../models/User.js';
import Ticket from '../models/Ticket.js';
import Asset from '../models/Asset.js';
import TicketHistory from '../models/TicketHistory.js';
import ServiceSettings from '../models/ServiceSettings.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const users = asyncHandler(async (req, res) =>
  res.json({ users: await User.find({ isActive: { $ne: false } }).select('-password').sort({ createdAt: -1 }) }));

export const createStaff = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, department, skills, experienceYears } = req.body;
  if (!name || !email || !password || !['admin','technician','employee'].includes(role))
    return res.status(400).json({ message: 'Valid name, email, password and role are required' });
  if (typeof name !== 'string' || name.trim().length > 100)
    return res.status(400).json({ message: 'Name must be 1 to 100 characters' });
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ message: 'Enter a valid email address' });
  if (typeof password !== 'string' || password.length < 8)
    return res.status(400).json({ message: 'Password must contain at least 8 characters' });
  if (role === 'technician' && experienceYears !== undefined && (!Number.isFinite(Number(experienceYears)) || Number(experienceYears) < 0 || Number(experienceYears) > 60))
    return res.status(400).json({ message: 'Experience must be between 0 and 60 years' });
  if (skills !== undefined && (!Array.isArray(skills) || skills.length > 30 || skills.some(skill => typeof skill !== 'string' || skill.trim().length > 50)))
    return res.status(400).json({ message: 'Skills must be a list of up to 30 short text values' });
  if (await User.findOne({ email: email.toLowerCase().trim() })) return res.status(409).json({ message: 'Email already exists' });
  const user = await User.create({
    name: name.trim(), email: email.toLowerCase().trim(), password, role, phone, department,
    skills: role === 'technician' ? skills : undefined,
    experienceYears: role === 'technician' ? Number(experienceYears || 0) : undefined,
  });
  res.status(201).json({ user: { id: user.id, userId: user.userId, name: user.name, email: user.email, role: user.role } });
});

export const dashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const activeStatuses = ['open', 'assigned', 'in-progress'];
  const [total, open, assigned, progress, resolved, closed, technicianUsers, employees, overdue, dueSoon, maintenanceAlerts, workloadCounts] = await Promise.all([
    Ticket.countDocuments(),
    Ticket.countDocuments({ status: 'open' }),
    Ticket.countDocuments({ status: 'assigned' }),
    Ticket.countDocuments({ status: 'in-progress' }),
    Ticket.countDocuments({ status: 'resolved' }),
    Ticket.countDocuments({ status: 'closed' }),
    User.find({ role: 'technician', isActive: { $ne: false } }).select('name availability'),
    User.countDocuments({ role: 'employee', isActive: { $ne: false } }),
    Ticket.countDocuments({ dueDate: { $lt: now }, status: { $nin: ['resolved', 'closed'] } }),
    Ticket.countDocuments({ dueDate: { $gte: now, $lte: tomorrow }, status: { $in: activeStatuses } }),
    Asset.countDocuments({ condition: 'needs-maintenance' }),
    Ticket.aggregate([
      { $match: { status: { $in: ['assigned', 'in-progress'] }, assignedTo: { $ne: null } } },
      { $group: { _id: '$assignedTo', activeJobs: { $sum: 1 } } },
    ]),
  ]);
  const workloadByTechnician = new Map(workloadCounts.map(item => [String(item._id), item.activeJobs]));
  const workload = technicianUsers.map(technician => ({
    id: String(technician._id),
    name: technician.name,
    availability: technician.availability,
    activeJobs: workloadByTechnician.get(String(technician._id)) || 0,
  }));
  const technicians = technicianUsers.length;
  const activeTechnicians = technicianUsers.filter(technician => technician.availability === 'available').length;
  res.json({
    stats: { total, open, assigned, inProgress: progress, resolved, closed, technicians, activeTechnicians, employees, overdue, dueSoon, maintenanceAlerts },
    workload,
  });
});

export const technicians = asyncHandler(async (req, res) =>
  res.json({ technicians: await User.find({ role: 'technician', isActive: { $ne: false } }).select('name userId email phone availability department skills rating experienceYears') }));

export const createAsset = asyncHandler(async (req, res) => {
  const { assetName, assetCode, category, location } = req.body;
  if (!assetName || !assetCode || !category || !location)
    return res.status(400).json({ message: 'Asset name, code, category and location are required' });
  const asset = await Asset.create(req.body);
  res.status(201).json({ asset });
});

export const listAssets = asyncHandler(async (req, res) =>
  res.json({ assets: await Asset.find().sort({ createdAt: -1 }) }));

export const activityFeed = asyncHandler(async (req, res) => {
  const history = await TicketHistory.find()
    .populate('updatedBy', 'name role')
    .populate({ path: 'ticket', select: 'title status priority' })
    .sort({ createdAt: -1 })
    .limit(20);
  res.json({ activity: history });
});

export const getServiceSettings = asyncHandler(async (req, res) => {
  const settings = await ServiceSettings.findOneAndUpdate(
    { key: 'workspace' },
    { $setOnInsert: { key: 'workspace' } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.json({ settings });
});

export const updateServiceSettings = asyncHandler(async (req, res) => {
  const { slaHours } = req.body;
  const priorities = ['low', 'medium', 'high', 'critical'];
  if (!slaHours || typeof slaHours !== 'object' ||
      priorities.some(priority => !Number.isInteger(Number(slaHours[priority])) || Number(slaHours[priority]) < 1 || Number(slaHours[priority]) > 8760))
    return res.status(400).json({ message: 'Set SLA hours from 1 to 8760 for every priority' });
  const settings = await ServiceSettings.findOneAndUpdate(
    { key: 'workspace' },
    { $set: { slaHours: Object.fromEntries(priorities.map(priority => [priority, Number(slaHours[priority])])) } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
  res.json({ settings });
});

export const technicianPerformance = asyncHandler(async (req, res) => {
  const [results, technicians] = await Promise.all([
    Ticket.aggregate([
      { $match: { assignedTo: { $ne: null } } },
      {
        $group: {
          _id: '$assignedTo',
          assignedJobs: { $sum: 1 },
          completedJobs: { $sum: { $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0] } },
          onTimeJobs: { $sum: { $cond: [{ $and: [{ $in: ['$status', ['resolved', 'closed']] }, { $or: [{ $eq: ['$dueDate', null] }, { $lte: ['$resolvedAt', '$dueDate'] }] }] }, 1, 0] } },
          totalResolutionMs: { $sum: { $cond: [{ $and: [{ $in: ['$status', ['resolved', 'closed']] }, { $ne: ['$resolvedAt', null] }] }, { $subtract: ['$resolvedAt', '$createdAt'] }, 0] } },
        },
      },
    ]),
    User.find({ role: 'technician', isActive: { $ne: false } }).select('name userId availability rating skills experienceYears'),
  ]);
  const performanceByUser = new Map(results.map(result => [String(result._id), result]));
  const performance = technicians.map(technician => {
    const result = performanceByUser.get(String(technician._id));
    const completedJobs = result?.completedJobs || 0;
    return {
      userId: technician.userId,
      technician: technician.name,
      availability: technician.availability,
      skills: technician.skills,
      rating: technician.rating,
      experienceYears: technician.experienceYears,
      assignedJobs: result?.assignedJobs || 0,
      completedJobs,
      onTimeRate: completedJobs ? Math.round((result.onTimeJobs / completedJobs) * 100) : null,
      averageResolutionHours: completedJobs ? Math.round(result.totalResolutionMs / completedJobs / 3600000 * 10) / 10 : null,
    };
  });
  res.json({ performance });
});
