import express from 'express';
import { chatProcurement, getConversationHistory, gradeProduceImage } from '../controllers/aiController.js';
import { optionalProtect, protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/procurement/chat', optionalProtect, chatProcurement);
router.get('/procurement/history', protect, getConversationHistory);
router.post('/produce-grading', upload.single('image'), gradeProduceImage);

export default router;
