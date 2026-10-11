import api from './api.js';

export const sellerService = {
  getDashboard: async () => {
    const res = await api.get('/seller/dashboard');
    return res.data;
  },

  getProducts: async (params = {}) => {
    const res = await api.get('/seller/products', { params });
    return res.data;
  },

  createProduct: async (productData) => {
    const res = await api.post('/seller/products', productData);
    return res.data;
  },

  updateProduct: async (id, productData) => {
    const res = await api.patch(`/seller/products/${id}`, productData);
    return res.data;
  },

  deleteProduct: async (id) => {
    const res = await api.delete(`/seller/products/${id}`);
    return res.data;
  },

  getOrders: async (params = {}) => {
    const res = await api.get('/seller/orders', { params });
    return res.data;
  },

  updateOrderStatus: async (id, status, note) => {
    const res = await api.patch(`/seller/orders/${id}/status`, { status, note });
    return res.data;
  },

  getEarnings: async () => {
    const res = await api.get('/seller/earnings');
    return res.data;
  }
};
