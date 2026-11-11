import { Router } from 'express';
import {
  createTicket, listTickets, getTicket, availableTickets, claimTicket,
  assignTicket, updateTicketStatus, closeTicket, ticketSummary, technicianMatches, updateWorkLog,
  uploadTicketImage, getTicketImage,
  getComments, addComment, getHistory,
} from '../controllers/ticketController.js';
import { protect, allowRoles } from '../middleware/auth.js';
import { imageUpload } from '../middleware/imageUpload.js';
const router = Router();
router.use(protect);
router.get('/',    listTickets);
router.post('/',   allowRoles('employee','admin'), createTicket);
router.get('/available', allowRoles('technician'), availableTickets);
router.get('/summary', ticketSummary);
router.patch('/:id/claim', allowRoles('technician'), claimTicket);
router.get('/:id/matches', allowRoles('admin'), technicianMatches);
router.patch('/:id/worklog', allowRoles('technician'), updateWorkLog);
router.post('/:id/images', allowRoles('technician'), imageUpload.single('image'), uploadTicketImage);
router.get('/:id/images/:filename', getTicketImage);
router.get('/:id', getTicket);
router.patch('/:id/assign', allowRoles('admin'),               assignTicket);
router.patch('/:id/status', allowRoles('technician'),          updateTicketStatus);
router.patch('/:id/close',  allowRoles('employee','admin'),    closeTicket);
router.get('/:id/comments',  getComments);
router.post('/:id/comments', addComment);
router.get('/:id/history',   getHistory);
export default router;
