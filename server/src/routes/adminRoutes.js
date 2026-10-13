import express from 'express';
import {
  getAdminDashboard,
  getAdminDashboardStats,
  getAdminApplications,
  getFarmerApplications,
  getDeliveryApplications,
  getAdminApplicationById,
  approveApplication,
  rejectApplication,
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

// Strict backend protection: all routes require authenticated admin
router.use(protect);
router.use(authorize('admin'));

// Dashboard & Statistics
router.get('/dashboard', getAdminDashboard);
router.get('/dashboard/stats', getAdminDashboardStats);

// Application Management & Approvals
router.get('/applications', getAdminApplications);
router.get('/applications/farmers', getFarmerApplications);
router.get('/applications/delivery', getDeliveryApplications);
router.get('/applications/:id', getAdminApplicationById);
router.patch('/applications/:id/approve', approveApplication);
router.patch('/applications/:id/reject', rejectApplication);

// User Governance
router.get('/users', getAdminUsers);
router.patch('/users/:id/status', updateUserStatus);

// Product Moderation
router.get('/products', getAdminProducts);
router.patch('/products/:id/approval', updateProductApproval);

// Orders & Analytics
router.get('/orders', getAdminOrders);
router.get('/analytics', getAdminAnalytics);

export default router;
