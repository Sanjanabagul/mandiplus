import api from './api.js';

export const cartService = {
  getCart: async () => {
    const res = await api.get('/cart');
    return res.data;
  },

  addToCart: async (productId, quantity = 1) => {
    const res = await api.post('/cart/items', { productId, quantity });
    return res.data;
  },

  updateCartItem: async (productId, quantity) => {
    const res = await api.patch(`/cart/items/${productId}`, { quantity });
    return res.data;
  },

  removeCartItem: async (productId) => {
    const res = await api.delete(`/cart/items/${productId}`);
    return res.data;
  },

  clearCart: async () => {
    const res = await api.delete('/cart');
    return res.data;
  },

  mergeCart: async (guestItems) => {
    const res = await api.post('/cart/merge', { guestItems });
    return res.data;
  }
};
