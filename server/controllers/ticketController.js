import Ticket from '../models/Ticket.js';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Comment from '../models/Comment.js';
import TicketHistory from '../models/TicketHistory.js';
import ServiceSettings from '../models/ServiceSettings.js';
import { notify } from '../utils/notify.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { rankTechniciansForTicket } from '../services/technicianMatching.js';
import { deleteImage, getImagePath, saveImage } from '../services/imageStorage.js';

const populate = q =>
  q.populate('createdBy','name email role department')
   .populate('assignedTo','name email phone availability')
   .populate('asset','assetName assetCode location');

export const createTicket = asyncHandler(async (req, res) => {
  const { title, description, category, priority, location, asset, dueDate } = req.body;
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 120 ||
      typeof description !== 'string' || !description.trim() || description.length > 3000 ||
      typeof category !== 'string' || !category.trim() || category.length > 80)
    return res.status(400).json({ message: 'Title, description and category are required' });
  if (priority !== undefined && !['low', 'medium', 'high', 'critical'].includes(priority))
    return res.status(400).json({ message: 'Choose a valid priority' });
  if (dueDate && Number.isNaN(Date.parse(dueDate)))
    return res.status(400).json({ message: 'Enter a valid due date' });
  if (asset && !mongoose.isValidObjectId(asset))
    return res.status(400).json({ message: 'Select a valid asset' });
  const resolvedPriority = priority || 'medium';
  let resolvedDueDate = dueDate || null;
  if (!resolvedDueDate) {
    const settings = await ServiceSettings.findOne({ key: 'workspace' }).lean();
    const hours = settings?.slaHours?.[resolvedPriority] || { low: 120, medium: 72, high: 24, critical: 4 }[resolvedPriority];
    resolvedDueDate = new Date(Date.now() + hours * 3600000);
  }
  const ticket = await Ticket.create({
    title: title.trim(), description: description.trim(), category: category.trim(), priority: resolvedPriority, location,
    asset: asset || null, dueDate: resolvedDueDate,
    createdBy: req.user.id, images: req.body.images || [],
  });
  await TicketHistory.create({ ticket: ticket.id, updatedBy: req.user.id, action: 'Ticket created', newStatus: 'open' });
  if (req.user.role === 'employee')
    await notify(req.user.id, `Your request "${ticket.title}" has been received`, ticket.id, 'status');
  const admins = await User.find({ role: 'admin', isActive: { $ne: false }, _id: { $ne: req.user.id } }).select('_id');
  await Promise.all(admins.map(admin =>
    notify(admin.id, `New ${resolvedPriority} priority request: "${ticket.title}"`, ticket.id, 'ticket')
  ));
  res.status(201).json({ ticket: await populate(Ticket.findById(ticket.id)) });
});

export const listTickets = asyncHandler(async (req, res) => {
  const { status, priority, search, page = 1, limit = 10 } = req.query;
  const filter = {};
  if (req.user.role === 'employee')   filter.createdBy = req.user.id;
  if (req.user.role === 'technician') filter.assignedTo = req.user.id;
  if (status)   filter.status = status;
  if (priority) filter.priority = priority;
  if (search)   filter.$or = [{ title: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }];
  const p = Math.max(1, Number(page));
  const l = Math.min(100, Math.max(1, Number(limit)));
  const [tickets, total] = await Promise.all([
    populate(Ticket.find(filter).sort({ createdAt: -1 }).skip((p - 1) * l).limit(l)),
    Ticket.countDocuments(filter),
  ]);
  res.json({ tickets, total, page: p, pages: Math.ceil(total / l) });
});

export const ticketSummary = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'employee'
    ? { createdBy: new mongoose.Types.ObjectId(req.user.id) }
    : req.user.role === 'technician'
      ? { assignedTo: new mongoose.Types.ObjectId(req.user.id) }
      : {};
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const activeStatuses = ['open', 'assigned', 'in-progress'];
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfDay.getTime() + 86400000);
  const [result = { statuses: [], overdue: [], dueSoon: [] }] = await Ticket.aggregate([
    { $match: filter },
    {
      $facet: {
        statuses: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        overdue: [
          { $match: { dueDate: { $lt: now }, status: { $in: activeStatuses } } },
          { $count: 'count' },
        ],
        dueSoon: [
          { $match: { dueDate: { $gte: now, $lte: tomorrow }, status: { $in: activeStatuses } } },
          { $count: 'count' },
        ],
        todayAssigned: [
          { $match: { assignedAt: { $gte: startOfDay, $lt: startOfTomorrow } } },
          { $count: 'count' },
        ],
        available: req.user.role === 'technician' ? [
          { $match: { status: 'open', assignedTo: null } },
          { $count: 'count' },
        ] : [{ $count: 'count' }],
      },
    },
  ]);
  const summary = { open: 0, assigned: 0, inProgress: 0, resolved: 0, closed: 0 };
  for (const item of result.statuses) {
    const key = item._id === 'in-progress' ? 'inProgress' : item._id;
    if (Object.hasOwn(summary, key)) summary[key] = item.count;
  }
  summary.total = Object.values(summary).reduce((total, count) => total + count, 0);
  summary.overdue = result.overdue[0]?.count || 0;
  summary.dueSoon = result.dueSoon[0]?.count || 0;
  summary.todayAssigned = result.todayAssigned[0]?.count || 0;
  summary.availableAssignments = result.available[0]?.count || 0;
  res.json({ summary });
});

export const availableTickets = asyncHandler(async (req, res) => {
  const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 8));
  const tickets = await populate(Ticket.find({ status: 'open', assignedTo: null })
    .sort({ createdAt: 1 })
    .limit(limit));
  res.json({ tickets });
});

export const claimTicket = asyncHandler(async (req, res) => {
  if (req.user.availability === 'unavailable')
    return res.status(400).json({ message: 'Set your availability before accepting a request' });
  const ticket = await Ticket.findOneAndUpdate(
    { _id: req.params.id, status: 'open', assignedTo: null },
    { $set: { assignedTo: req.user._id, assignedAt: new Date(), status: 'assigned' } },
    { new: true }
  );
  if (!ticket) return res.status(409).json({ message: 'This request has already been assigned' });
  await TicketHistory.create({ ticket: ticket.id, updatedBy: req.user.id, action: 'Technician accepted request', previousStatus: 'open', newStatus: 'assigned', remarks: req.user.name });
  await notify(ticket.createdBy, `A technician has accepted: "${ticket.title}"`, ticket.id, 'assignment');
  const admins = await User.find({ role: 'admin', isActive: { $ne: false } }).select('_id');
  await Promise.all(admins.map(admin =>
    notify(admin.id, `${req.user.name} accepted: "${ticket.title}"`, ticket.id, 'assignment')
  ));
  res.json({ ticket: await populate(Ticket.findById(ticket.id)) });
});

export const technicianMatches = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id).select('category priority status');
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  if (['resolved', 'closed'].includes(ticket.status))
    return res.status(400).json({ message: 'Completed requests cannot be assigned' });
  res.json({ matches: await rankTechniciansForTicket(ticket) });
});

export const updateWorkLog = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  if (String(ticket.assignedTo) !== req.user.id)
    return res.status(403).json({ message: 'This ticket is not assigned to you' });
  if (ticket.status !== 'in-progress')
    return res.status(400).json({ message: 'Start the job before updating its work log' });
  const { repairChecklist, partsUsed } = req.body;
  if (repairChecklist !== undefined && (!Array.isArray(repairChecklist) || repairChecklist.length > 30 ||
      repairChecklist.some(item => !item || typeof item.label !== 'string' || !item.label.trim() || item.label.length > 160 || typeof item.completed !== 'boolean')))
    return res.status(400).json({ message: 'Checklist entries need a label and completion status' });
  if (partsUsed !== undefined && (!Array.isArray(partsUsed) || partsUsed.length > 30 ||
      partsUsed.some(part => typeof part !== 'string' || !part.trim() || part.trim().length > 100)))
    return res.status(400).json({ message: 'Parts used must be a list of up to 30 short text values' });
  if (repairChecklist) {
    ticket.repairChecklist = repairChecklist.map(item => ({
      label: item.label.trim(),
      completed: item.completed,
      completedAt: item.completed ? new Date() : undefined,
    }));
  }
  if (partsUsed) ticket.partsUsed = partsUsed.map(part => part.trim());
  await ticket.save();
  res.json({ ticket: await populate(Ticket.findById(ticket.id)) });
});

export const uploadTicketImage = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Choose an image to upload' });
  const imageType = req.body.imageType;
  if (!['before', 'after'].includes(imageType))
    return res.status(400).json({ message: 'Choose whether this is a before or after image' });
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  if (String(ticket.assignedTo) !== req.user.id)
    return res.status(403).json({ message: 'This ticket is not assigned to you' });
  if (ticket.status !== 'in-progress')
    return res.status(400).json({ message: 'Start the job before uploading work images' });
  if (req.file.size > 5 * 1024 * 1024)
    return res.status(413).json({ message: 'Images must be no larger than 5 MB' });
  const filename = await saveImage(req.file.buffer);
  ticket[`${imageType}Images`].push(filename);
  try {
    await ticket.save();
  } catch (error) {
    await deleteImage(filename);
    throw error;
  }
  res.status(201).json({ image: `/api/tickets/${ticket.id}/images/${filename}` });
});

export const getTicketImage = asyncHandler(async (req, res, next) => {
  const imagePath = getImagePath(req.params.filename);
  if (!imagePath) return res.status(400).json({ message: 'Invalid image name' });
  const ticket = await Ticket.findById(req.params.id).select('createdBy assignedTo beforeImages afterImages');
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  const canAccess = req.user.role === 'admin' ||
    (req.user.role === 'employee' && String(ticket.createdBy) === req.user.id) ||
    (req.user.role === 'technician' && String(ticket.assignedTo) === req.user.id);
  if (!canAccess) return res.status(403).json({ message: 'Access denied' });
  const isAttached = [...ticket.beforeImages, ...ticket.afterImages].includes(req.params.filename);
  if (!isAttached) return res.status(404).json({ message: 'Image not found' });
  res.setHeader('Cache-Control', 'private, max-age=3600');
  res.sendFile(imagePath, error => { if (error) next(error); });
});

export const getTicket = asyncHandler(async (req, res) => {
  const ticket = await populate(Ticket.findById(req.params.id));
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  if (req.user.role === 'employee'   && String(ticket.createdBy._id) !== req.user.id)
    return res.status(403).json({ message: 'Access denied' });
  if (req.user.role === 'technician' && String(ticket.assignedTo?._id) !== req.user.id)
    return res.status(403).json({ message: 'Access denied' });
  const history = await TicketHistory.find({ ticket: ticket.id }).populate('updatedBy','name role').sort({ createdAt: 1 });
  res.json({ ticket, history });
});

export const assignTicket = asyncHandler(async (req, res) => {
  const { technicianId } = req.body;
  const [ticket, technician] = await Promise.all([Ticket.findById(req.params.id), User.findOne({ _id: technicianId, isActive: { $ne: false } })]);
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  if (!technician || technician.role !== 'technician') return res.status(400).json({ message: 'Select a valid technician' });
  if (technician.availability === 'unavailable')
    return res.status(400).json({ message: 'Unavailable technicians cannot be assigned' });
  if (['resolved','closed'].includes(ticket.status)) return res.status(400).json({ message: 'Completed tickets cannot be reassigned' });
  const previousStatus = ticket.status;
  ticket.assignedTo = technician.id; ticket.assignedAt = new Date(); ticket.status = 'assigned'; await ticket.save();
  await TicketHistory.create({ ticket: ticket.id, updatedBy: req.user.id, action: 'Technician assigned', previousStatus, newStatus: 'assigned', remarks: technician.name });
  await notify(technician.id, `You've been assigned: "${ticket.title}"`, ticket.id, 'assignment');
  await notify(ticket.createdBy, `A technician has been assigned to: "${ticket.title}"`, ticket.id);
  res.json({ ticket: await populate(Ticket.findById(ticket.id)) });
});

export const updateTicketStatus = asyncHandler(async (req, res) => {
  const { status, remarks, resolutionNotes } = req.body;
  if (!['in-progress','resolved'].includes(status))
    return res.status(400).json({ message: 'Invalid status update' });
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  if (req.user.role === 'technician' && String(ticket.assignedTo) !== req.user.id)
    return res.status(403).json({ message: 'This ticket is not assigned to you' });
  if (['closed','resolved'].includes(ticket.status))
    return res.status(400).json({ message: 'Ticket is already resolved or closed' });
  if (status === 'in-progress' && ticket.status !== 'assigned')
    return res.status(400).json({ message: 'Only assigned tickets can be started' });
  if (status === 'resolved' && ticket.status !== 'in-progress')
    return res.status(400).json({ message: 'Start the job before resolving it' });
  const previousStatus = ticket.status;
  ticket.status = status;
  if (status === 'resolved') { ticket.resolvedAt = new Date(); ticket.resolutionNotes = resolutionNotes || remarks || ''; }
  await ticket.save();
  await TicketHistory.create({ ticket: ticket.id, updatedBy: req.user.id, action: `Status → ${status}`, previousStatus, newStatus: status, remarks: remarks || resolutionNotes });
  await notify(ticket.createdBy, `Your ticket "${ticket.title}" is now ${status}`, ticket.id, 'status');
  const admins = await User.find({ role: 'admin', isActive: { $ne: false } }).select('_id');
  await Promise.all(admins.map(admin =>
    notify(admin.id, `"${ticket.title}" is now ${status}`, ticket.id, 'status')
  ));
  res.json({ ticket: await populate(Ticket.findById(ticket.id)) });
});

export const closeTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  if (req.user.role === 'employee' && String(ticket.createdBy) !== req.user.id)
    return res.status(403).json({ message: 'Access denied' });
  if (ticket.status !== 'resolved')
    return res.status(400).json({ message: 'Only resolved tickets can be closed' });
  const previousStatus = ticket.status;
  ticket.status = 'closed'; ticket.closedAt = new Date(); await ticket.save();
  await TicketHistory.create({ ticket: ticket.id, updatedBy: req.user.id, action: 'Employee confirmed & closed', previousStatus, newStatus: 'closed' });
  if (ticket.assignedTo) await notify(ticket.assignedTo, `Ticket "${ticket.title}" was confirmed closed`, ticket.id, 'status');
  if (req.user.role !== 'admin') {
    const admins = await User.find({ role: 'admin', isActive: { $ne: false } }).select('_id');
    await Promise.all(admins.map(admin =>
      notify(admin.id, `"${ticket.title}" was confirmed closed`, ticket.id, 'status')
    ));
  }
  res.json({ message: 'Ticket closed', ticket });
});

/* ── Comments ─────────────────────────────────────── */
export const getComments = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  if (req.user.role === 'employee' && String(ticket.createdBy) !== req.user.id)
    return res.status(403).json({ message: 'Access denied' });
  if (req.user.role === 'technician' && String(ticket.assignedTo) !== req.user.id)
    return res.status(403).json({ message: 'Access denied' });
  const comments = await Comment.find({ ticket: req.params.id }).populate('author','name role').sort({ createdAt: 1 });
  res.json({ comments });
});

export const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ message: 'Comment text is required' });
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  if (req.user.role === 'employee' && String(ticket.createdBy) !== req.user.id)
    return res.status(403).json({ message: 'Access denied' });
  if (req.user.role === 'technician' && String(ticket.assignedTo) !== req.user.id)
    return res.status(403).json({ message: 'Access denied' });
  const comment = await Comment.create({ ticket: req.params.id, author: req.user.id, text: text.trim() });
  const populated = await Comment.findById(comment.id).populate('author','name role');
  res.status(201).json({ comment: populated });
});

/* ── Ticket history ───────────────────────────────── */
export const getHistory = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  if (req.user.role === 'employee' && String(ticket.createdBy) !== req.user.id)
    return res.status(403).json({ message: 'Access denied' });
  if (req.user.role === 'technician' && String(ticket.assignedTo) !== req.user.id)
    return res.status(403).json({ message: 'Access denied' });
  const history = await TicketHistory.find({ ticket: req.params.id }).populate('updatedBy','name role').sort({ createdAt: 1 });
  res.json({ history });
});
