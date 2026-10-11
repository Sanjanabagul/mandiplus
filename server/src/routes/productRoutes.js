import express from 'express';
import {
  getProducts,
  getProductById,
  getFeaturedDeals,
  getNearbyFarmers,
  getSearchSuggestions
} from '../controllers/productController.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/deals', getFeaturedDeals);
router.get('/nearby-farmers', getNearbyFarmers);
router.get('/suggestions', getSearchSuggestions);
router.get('/:id', getProductById);

export default router;
