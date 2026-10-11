import express from 'express';
import {
  getAdminDashboard,
  getAdminUsers,
  updateUserStatus,
  getAdminProducts,
  updateProductApproval,
  getAdminOrders,
  getAdminAnalytics
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getAdminDashboard);
router.get('/users', getAdminUsers);
router.patch('/users/:id/status', updateUserStatus);
router.get('/products', getAdminProducts);
router.patch('/products/:id/approval', updateProductApproval);
router.get('/orders', getAdminOrders);
router.get('/analytics', getAdminAnalytics);

export default router;
