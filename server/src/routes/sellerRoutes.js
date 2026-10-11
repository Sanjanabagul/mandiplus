import express from 'express';
import {
  getSellerDashboard,
  getSellerProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getSellerOrders,
  updateOrderStatusBySeller,
  getSellerEarnings
} from '../controllers/sellerController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('seller', 'admin'));

router.get('/dashboard', getSellerDashboard);
router.get('/products', getSellerProducts);
router.post('/products', createProduct);
router.patch('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.get('/orders', getSellerOrders);
router.patch('/orders/:id/status', updateOrderStatusBySeller);
router.get('/earnings', getSellerEarnings);

export default router;
