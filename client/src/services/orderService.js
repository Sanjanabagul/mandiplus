import api from './api.js';

export const orderService = {
  createOrder: async (orderData) => {
    const res = await api.post('/orders', orderData);
    return res.data;
  },

  getMyOrders: async (params = {}) => {
    const res = await api.get('/orders', { params });
    return res.data;
  },

  getOrderById: async (id) => {
    const res = await api.get(`/orders/${id}`);
    return res.data;
  },

  cancelOrder: async (id, reason) => {
    const res = await api.post(`/orders/${id}/cancel`, { reason });
    return res.data;
  },

  getOrderTracking: async (id) => {
    const res = await api.get(`/orders/${id}/tracking`);
    return res.data;
  }
};
