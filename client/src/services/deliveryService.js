import api from './api.js';

export const deliveryService = {
  getAssignments: async (params = {}) => {
    const res = await api.get('/delivery/assignments', { params });
    return res.data;
  },

  getAvailable: async () => {
    const res = await api.get('/delivery/available');
    return res.data;
  },

  claimDelivery: async (orderId) => {
    const res = await api.post(`/delivery/claim/${orderId}`);
    return res.data;
  },

  updateStatus: async (assignmentId, status, proofOfDeliveryNotes = '', failureReason = '') => {
    const res = await api.patch(`/delivery/assignments/${assignmentId}/status`, {
      status,
      proofOfDeliveryNotes,
      failureReason
    });
    return res.data;
  }
};
