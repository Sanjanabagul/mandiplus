import api from './api.js';

export const farmerSupplyService = {
  submitSupplyRequest: async (data) => {
    const res = await api.post('/seller/supply-requests', data);
    return res.data;
  },

  getMySupplyRequests: async (params = {}) => {
    const res = await api.get('/seller/supply-requests', { params });
    return res.data;
  },

  getSupplyRequestById: async (id) => {
    const res = await api.get(`/seller/supply-requests/${id}`);
    return res.data;
  },

  getSettlements: async () => {
    const res = await api.get('/seller/settlements');
    return res.data;
  }
};
