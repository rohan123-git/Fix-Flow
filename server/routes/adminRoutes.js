import { Router } from 'express';
import {
  users, createStaff, dashboard, technicians, createAsset, listAssets, activityFeed,
  getServiceSettings, updateServiceSettings, technicianPerformance,
} from '../controllers/adminController.js';
import { protect, allowRoles } from '../middleware/auth.js';
const router = Router();
router.use(protect);
router.use(allowRoles('admin'));
router.get('/dashboard',  dashboard);
router.get('/activity',   activityFeed);
router.get('/settings', getServiceSettings);
router.patch('/settings', updateServiceSettings);
router.get('/analytics/technicians', technicianPerformance);
router.get('/users',      users);
router.post('/users',     createStaff);
router.get('/technicians',technicians);
router.get('/assets',     listAssets);
router.post('/assets',    createAsset);
export default router;
