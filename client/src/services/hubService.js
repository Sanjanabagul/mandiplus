import api from './api.js';

export const hubService = {
  // Hub overview metrics
  getOverview: async () => {
    const res = await api.get('/hub/overview');
    return res.data;
  },

  // Supply requests inbound to hub
  getSupplyRequests: async (params = {}) => {
    const res = await api.get('/hub/supply-requests', { params });
    return res.data;
  },

  reviewSupplyRequest: async (id, data) => {
    const res = await api.put(`/hub/supply-requests/${id}/review`, data);
    return res.data;
  },

  receiveAndInspectSupply: async (id, data) => {
    const res = await api.post(`/hub/supply-requests/${id}/receive`, data);
    return res.data;
  },

  // Inventory batches & movements
  getBatches: async (params = {}) => {
    const res = await api.get('/hub/inventory/batches', { params });
    return res.data;
  },

  getMovements: async (params = {}) => {
    const res = await api.get('/hub/inventory/movements', { params });
    return res.data;
  },

  adjustBatch: async (id, data) => {
    const res = await api.post(`/hub/inventory/batches/${id}/adjust`, data);
    return res.data;
  },

  // Picking & Packing Workspace
  getPickQueue: async () => {
    const res = await api.get('/hub/pick-queue');
    return res.data;
  },

  startPicking: async (orderId) => {
    const res = await api.post(`/hub/orders/${orderId}/pick/start`);
    return res.data;
  },

  updatePickItem: async (orderId, itemIndex, data) => {
    const res = await api.patch(`/hub/orders/${orderId}/pick/items/${itemIndex}`, data);
    return res.data;
  },

  completePicking: async (orderId) => {
    const res = await api.post(`/hub/orders/${orderId}/pick/complete`);
    return res.data;
  },

  completePacking: async (orderId, data = {}) => {
    const res = await api.post(`/hub/orders/${orderId}/pack/complete`, data);
    return res.data;
  },

  // Dispatch & Handover
  getDispatchQueue: async () => {
    const res = await api.get('/hub/dispatch-queue');
    return res.data;
  },

  handoverOrder: async (orderId, data = {}) => {
    const res = await api.post(`/hub/orders/${orderId}/handover`, data);
    return res.data;
  },

  getHubList: async () => {
    const res = await api.get('/hub/list');
    return res.data;
  }
};
