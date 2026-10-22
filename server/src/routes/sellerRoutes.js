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
import {
  submitSupplyRequest,
  getMySupplyRequests,
  getSupplyRequestById,
  getFarmerSettlements
} from '../controllers/farmerSupplyController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize, requireApprovedAccount } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('seller', 'farmer', 'admin'));

router.get('/dashboard', getSellerDashboard);
router.get('/products', getSellerProducts);
router.post('/products', createProduct);
router.patch('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.get('/orders', getSellerOrders);
router.patch('/orders/:id/status', updateOrderStatusBySeller);
router.get('/earnings', getSellerEarnings);

// Farmer Supply to Mandi+ Hub & Settlements
router.post('/supply-requests', requireApprovedAccount, submitSupplyRequest);
router.get('/supply-requests', getMySupplyRequests);
router.get('/supply-requests/:id', getSupplyRequestById);
router.get('/settlements', getFarmerSettlements);

export default router;
