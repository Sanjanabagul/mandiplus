import api from './api.js';

export const adminService = {
  getDashboard: async () => {
    const res = await api.get('/admin/dashboard');
    return res.data;
  },

  getUsers: async (params = {}) => {
    const res = await api.get('/admin/users', { params });
    return res.data;
  },

  updateUserStatus: async (id, status) => {
    const res = await api.patch(`/admin/users/${id}/status`, { status });
    return res.data;
  },

  getProducts: async (params = {}) => {
    const res = await api.get('/admin/products', { params });
    return res.data;
  },

  updateProductApproval: async (id, approvalStatus, isAvailable) => {
    const res = await api.patch(`/admin/products/${id}/approval`, { approvalStatus, isAvailable });
    return res.data;
  },

  getOrders: async (params = {}) => {
    const res = await api.get('/admin/orders', { params });
    return res.data;
  },

  getAnalytics: async () => {
    const res = await api.get('/admin/analytics');
    return res.data;
  }
};
