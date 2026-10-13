import express from 'express';
import {
  register,
  login,
  adminLogin,
  getApplicationStatus,
  getMe,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/admin/login', adminLogin);
router.get('/application-status', getApplicationStatus);
router.get('/me', protect, getMe);
router.patch('/profile', protect, updateProfile);

// Address endpoints
router.post('/addresses', protect, addAddress);
router.patch('/addresses/:addressId', protect, updateAddress);
router.delete('/addresses/:addressId', protect, deleteAddress);

export default router;
