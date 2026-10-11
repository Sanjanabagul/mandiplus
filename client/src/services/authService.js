import api from './api.js';

export const authService = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },

  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },

  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  updateProfile: async (data) => {
    const res = await api.patch('/auth/profile', data);
    return res.data;
  },

  addAddress: async (addressData) => {
    const res = await api.post('/auth/addresses', addressData);
    return res.data;
  },

  updateAddress: async (addressId, addressData) => {
    const res = await api.patch(`/auth/addresses/${addressId}`, addressData);
    return res.data;
  },

  deleteAddress: async (addressId) => {
    const res = await api.delete(`/auth/addresses/${addressId}`);
    return res.data;
  }
};
