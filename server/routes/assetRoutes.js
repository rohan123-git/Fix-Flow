import { Router } from 'express';
import mongoose from 'mongoose';
import Asset from '../models/Asset.js';
import Ticket from '../models/Ticket.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { protect, allowRoles } from '../middleware/auth.js';
const router = Router();
router.use(protect);
router.get('/', asyncHandler(async (req, res) => res.json({ assets: await Asset.find().sort({ createdAt: -1 }) })));
router.post('/', allowRoles('admin'), asyncHandler(async (req, res) => {
  const { assetName, assetCode, category, location, condition, purchaseDate, description, maintenanceIntervalDays } = req.body;
  if ([assetName, assetCode, category, location].some(value => typeof value !== 'string' || !value.trim()))
    return res.status(400).json({ message: 'Asset name, code, category and location are required' });
  if (maintenanceIntervalDays !== undefined && (!Number.isInteger(Number(maintenanceIntervalDays)) || Number(maintenanceIntervalDays) < 1 || Number(maintenanceIntervalDays) > 3650))
    return res.status(400).json({ message: 'Maintenance interval must be between 1 and 3650 days' });
  if (purchaseDate && Number.isNaN(Date.parse(purchaseDate)))
    return res.status(400).json({ message: 'Enter a valid purchase date' });
  const asset = await Asset.create({
    assetName: assetName.trim(), assetCode: assetCode.trim().toUpperCase(), category: category.trim(),
    location: location.trim(), condition, purchaseDate: purchaseDate || undefined,
    description: typeof description === 'string' ? description.trim() : undefined,
    maintenanceIntervalDays: maintenanceIntervalDays === undefined ? 90 : Number(maintenanceIntervalDays),
  });
  res.status(201).json({ asset });
}));

router.get('/predictive', allowRoles('admin'), asyncHandler(async (req, res) => {
  const assets = await Asset.find().sort({ assetName: 1 });
  const now = new Date();
  const predictions = assets.map(asset => {
    const lastMaintained = asset.maintenanceHistory.at(-1)?.performedAt || asset.purchaseDate || asset.createdAt;
    const nextMaintenanceDate = new Date(new Date(lastMaintained).getTime() + asset.maintenanceIntervalDays * 86400000);
    const daysUntilDue = Math.ceil((nextMaintenanceDate - now) / 86400000);
    const status = daysUntilDue < 0 ? 'overdue' : daysUntilDue <= Math.min(30, asset.maintenanceIntervalDays * 0.2) ? 'due-soon' : 'scheduled';
    return {
      asset: asset.toObject(),
      lastMaintained,
      nextMaintenanceDate,
      daysUntilDue,
      status,
      rule: `Maintenance interval: ${asset.maintenanceIntervalDays} days`,
    };
  });
  res.json({ predictions });
}));

router.get('/code/:assetCode', asyncHandler(async (req, res) => {
  const asset = await Asset.findOne({ assetCode: req.params.assetCode.toUpperCase() })
    .populate('maintenanceHistory.performedBy', 'name userId');
  if (!asset) return res.status(404).json({ message: 'Asset not found' });
  const ticketFilter = { asset: asset._id };
  if (req.user.role === 'employee') ticketFilter.createdBy = req.user._id;
  if (req.user.role === 'technician') ticketFilter.assignedTo = req.user._id;
  const tickets = await Ticket.find(ticketFilter)
    .select('title category status priority createdAt updatedAt resolvedAt closedAt resolutionNotes')
    .sort({ updatedAt: -1 })
    .limit(50);
  res.json({
    asset,
    maintenanceHistory: asset.maintenanceHistory,
    serviceHistory: tickets,
  });
}));

router.patch('/:id/maintenance-plan', allowRoles('admin'), asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid asset ID' });
  const interval = Number(req.body.maintenanceIntervalDays);
  if (!Number.isInteger(interval) || interval < 1 || interval > 3650)
    return res.status(400).json({ message: 'Maintenance interval must be between 1 and 3650 days' });
  const asset = await Asset.findByIdAndUpdate(
    req.params.id,
    { $set: { maintenanceIntervalDays: interval } },
    { new: true, runValidators: true }
  );
  if (!asset) return res.status(404).json({ message: 'Asset not found' });
  res.json({ asset });
}));

router.post('/:id/maintenance', allowRoles('admin'), asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid asset ID' });
  const notes = typeof req.body.notes === 'string' ? req.body.notes.trim() : '';
  const parts = req.body.parts === undefined ? [] : req.body.parts;
  if (notes.length < 3 || notes.length > 2000)
    return res.status(400).json({ message: 'Maintenance notes must contain 3 to 2000 characters' });
  if (!Array.isArray(parts) || parts.length > 30 || parts.some(part => typeof part !== 'string' || part.trim().length > 100))
    return res.status(400).json({ message: 'Parts must be a list of up to 30 short text values' });
  const asset = await Asset.findById(req.params.id);
  if (!asset) return res.status(404).json({ message: 'Asset not found' });
  asset.maintenanceHistory.push({ performedBy: req.user._id, notes, parts: parts.map(part => part.trim()) });
  asset.condition = 'good';
  await asset.save();
  res.status(201).json({ asset });
}));

export default router;
