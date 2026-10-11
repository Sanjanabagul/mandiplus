import express from 'express';
import {
  getDeliveryAssignments,
  getAvailableDeliveries,
  claimDelivery,
  updateDeliveryStatus
} from '../controllers/deliveryController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('delivery', 'admin'));

router.get('/assignments', getDeliveryAssignments);
router.get('/available', getAvailableDeliveries);
router.post('/claim/:orderId', claimDelivery);
router.patch('/assignments/:assignmentId/status', updateDeliveryStatus);

export default router;
