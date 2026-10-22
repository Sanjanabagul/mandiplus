import express from 'express';
import {
  getHubOverview,
  getSupplyRequests,
  reviewSupplyRequest,
  receiveAndInspectSupply,
  getInventoryBatches,
  getBatchMovements,
  adjustBatchStock,
  getPickQueue,
  startPickingOrder,
  updatePickItem,
  completePickingOrder,
  completePackingOrder,
  getDispatchQueue,
  handoverToDeliveryPartner
} from '../controllers/hubController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { Hub } from '../models/Hub.js';

const router = express.Router();

// Public / general hub info
router.get('/list', async (req, res, next) => {
  try {
    const hubs = await Hub.find({ isActive: true }).lean();
    res.status(200).json({ success: true, count: hubs.length, hubs });
  } catch (err) {
    next(err);
  }
});

// All operational endpoints require authentication and hub_operator or admin role
router.use(protect);
router.use(authorize('admin', 'hub_operator'));

router.get('/overview', getHubOverview);
router.get('/supply-requests', getSupplyRequests);
router.put('/supply-requests/:id/review', reviewSupplyRequest);
router.post('/supply-requests/:id/receive', receiveAndInspectSupply);

router.get('/inventory/batches', getInventoryBatches);
router.get('/inventory/movements', getBatchMovements);
router.post('/inventory/batches/:id/adjust', adjustBatchStock);

router.get('/pick-queue', getPickQueue);
router.post('/orders/:orderId/pick/start', startPickingOrder);
router.patch('/orders/:orderId/pick/items/:itemIndex', updatePickItem);
router.post('/orders/:orderId/pick/complete', completePickingOrder);
router.post('/orders/:orderId/pack/complete', completePackingOrder);

router.get('/dispatch-queue', getDispatchQueue);
router.post('/orders/:orderId/handover', handoverToDeliveryPartner);

export default router;
