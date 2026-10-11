import express from 'express';
import { exportOrdersCsv } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/export-orders', exportOrdersCsv);

export default router;
