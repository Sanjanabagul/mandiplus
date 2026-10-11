import api from './api.js';

export const reviewService = {
  getProductReviews: async (productId) => {
    const res = await api.get(`/reviews/product/${productId}`);
    return res.data;
  },

  createReview: async (reviewData) => {
    const res = await api.post('/reviews', reviewData);
    return res.data;
  }
};
