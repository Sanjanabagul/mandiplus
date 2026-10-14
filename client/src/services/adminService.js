import api from './api.js';

export const adminService = {
  getDashboard: async () => {
    const res = await api.get('/admin/dashboard');
    return res.data;
  },

  getDashboardStats: async () => {
    const res = await api.get('/admin/dashboard/stats');
    return res.data;
  },

  getApplications: async (params = {}) => {
    const res = await api.get('/admin/applications', { params });
    return res.data;
  },

  getApplicationById: async (id) => {
    const res = await api.get(`/admin/applications/${id}`);
    return res.data;
  },

  getFarmerApplications: async (params = {}) => {
    const res = await api.get('/admin/applications/farmers', { params });
    return res.data;
  },

  getDeliveryApplications: async (params = {}) => {
    const res = await api.get('/admin/applications/delivery', { params });
    return res.data;
  },

  approveApplication: async (id) => {
    const res = await api.patch(`/admin/applications/${id}/approve`);
    return res.data;
  },

  rejectApplication: async (id, rejectionReason) => {
    const res = await api.patch(`/admin/applications/${id}/reject`, { rejectionReason });
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
  },

  getDbStatus: async () => {
    const res = await api.get('/admin/db-status');
    return res.data;
  },

  exportOrdersCsv: async () => {
    const res = await api.get('/reports/export-orders', { responseType: 'blob' });
    return res.data;
  }
};
