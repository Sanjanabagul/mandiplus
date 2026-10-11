import api from './api.js';

export const productService = {
  getProducts: async (params = {}) => {
    const res = await api.get('/products', { params });
    return res.data;
  },

  getProductById: async (id) => {
    const res = await api.get(`/products/${id}`);
    return res.data;
  },

  getFeaturedDeals: async () => {
    const res = await api.get('/products/deals');
    return res.data;
  },

  getNearbyFarmers: async () => {
    const res = await api.get('/products/nearby-farmers');
    return res.data;
  },

  getSearchSuggestions: async (query) => {
    const res = await api.get(`/products/suggestions?q=${encodeURIComponent(query)}`);
    return res.data;
  },

  getCategories: async () => {
    const res = await api.get('/categories');
    return res.data;
  }
};
