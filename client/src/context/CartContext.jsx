import React, { createContext, useContext, useState, useEffect } from 'react';
import { cartService } from '../services/cartService.js';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [itemCount, setItemCount] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);
  const [savingsTotal, setSavingsTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const fetchCart = async () => {
    if (isAuthenticated) {
      setLoading(true);
      try {
        const data = await cartService.getCart();
        if (data.success) {
          setItems(data.items || []);
          setItemCount(data.itemCount || 0);
          setSubtotal(data.subtotal || 0);
          setDeliveryFee(data.deliveryFee || 0);
          setFinalTotal(data.finalTotal || 0);
          setSavingsTotal(data.savingsTotal || 0);
        }
      } catch (err) {
        console.error('Failed to load cart:', err);
      } finally {
        setLoading(false);
      }
    } else {
      // Local storage guest cart
      const saved = localStorage.getItem('mandi_guest_cart');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setItems(parsed);
          const count = parsed.reduce((sum, i) => sum + i.quantity, 0);
          const sub = parsed.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);
          setItemCount(count);
          setSubtotal(sub);
          setDeliveryFee(sub > 1500 || sub === 0 ? 0 : 50);
          setFinalTotal(sub + (sub > 1500 || sub === 0 ? 0 : 50));
        } catch {
          setItems([]);
        }
      }
    }
  };

  useEffect(() => {
    fetchCart();
  }, [isAuthenticated]);

  const addToCart = async (product, quantity = 1) => {
    const qty = parseInt(quantity, 10);
    const moq = product.minOrderQuantity || 1;

    if (qty < moq) {
      showToast(`Minimum order quantity is ${moq} ${product.unit}`, 'error');
      return false;
    }

    if (isAuthenticated) {
      try {
        const res = await cartService.addToCart(product._id || product.id, qty);
        if (res.success) {
          setItems(res.items || []);
          setItemCount(res.itemCount || 0);
          setSubtotal(res.subtotal || 0);
          setDeliveryFee(res.deliveryFee || 0);
          setFinalTotal(res.finalTotal || 0);
          setSavingsTotal(res.savingsTotal || 0);
          showToast(`Added ${qty} ${product.unit} of ${product.name} to cart!`);
          return true;
        }
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to add item to cart', 'error');
        return false;
      }
    } else {
      // Guest cart
      const existing = items.find(i => (i.product?._id || i.productId) === (product._id || product.id));
      let updated;
      if (existing) {
        updated = items.map(i => {
          if ((i.product?._id || i.productId) === (product._id || product.id)) {
            return { ...i, quantity: i.quantity + qty, subtotal: (i.quantity + qty) * i.unitPrice };
          }
          return i;
        });
      } else {
        updated = [
          ...items,
          {
            productId: product._id || product.id,
            product,
            quantity: qty,
            unitPrice: product.pricePerUnit,
            subtotal: qty * product.pricePerUnit
          }
        ];
      }
      setItems(updated);
      localStorage.setItem('mandi_guest_cart', JSON.stringify(updated));
      const count = updated.reduce((sum, i) => sum + i.quantity, 0);
      const sub = updated.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);
      setItemCount(count);
      setSubtotal(sub);
      setDeliveryFee(sub > 1500 || sub === 0 ? 0 : 50);
      setFinalTotal(sub + (sub > 1500 || sub === 0 ? 0 : 50));
      showToast(`Added ${qty} ${product.unit} of ${product.name} to cart!`);
      return true;
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    if (isAuthenticated) {
      try {
        const res = await cartService.updateCartItem(productId, newQuantity);
        if (res.success) {
          setItems(res.items || []);
          setItemCount(res.itemCount || 0);
          setSubtotal(res.subtotal || 0);
          setDeliveryFee(res.deliveryFee || 0);
          setFinalTotal(res.finalTotal || 0);
          setSavingsTotal(res.savingsTotal || 0);
        }
      } catch (err) {
        showToast(err.response?.data?.message || 'Could not update quantity', 'error');
      }
    } else {
      let updated;
      if (newQuantity <= 0) {
        updated = items.filter(i => (i.product?._id || i.productId) !== productId);
      } else {
        updated = items.map(i => {
          if ((i.product?._id || i.productId) === productId) {
            return { ...i, quantity: newQuantity, subtotal: newQuantity * i.unitPrice };
          }
          return i;
        });
      }
      setItems(updated);
      localStorage.setItem('mandi_guest_cart', JSON.stringify(updated));
      const count = updated.reduce((sum, i) => sum + i.quantity, 0);
      const sub = updated.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);
      setItemCount(count);
      setSubtotal(sub);
      setDeliveryFee(sub > 1500 || sub === 0 ? 0 : 50);
      setFinalTotal(sub + (sub > 1500 || sub === 0 ? 0 : 50));
    }
  };

  const removeFromCart = async (productId) => {
    if (isAuthenticated) {
      try {
        const res = await cartService.removeCartItem(productId);
        if (res.success) {
          setItems(res.items || []);
          setItemCount(res.itemCount || 0);
          setSubtotal(res.subtotal || 0);
          setDeliveryFee(res.deliveryFee || 0);
          setFinalTotal(res.finalTotal || 0);
          setSavingsTotal(res.savingsTotal || 0);
          showToast('Item removed from cart.');
        }
      } catch (err) {
        showToast('Error removing item', 'error');
      }
    } else {
      const updated = items.filter(i => (i.product?._id || i.productId) !== productId);
      setItems(updated);
      localStorage.setItem('mandi_guest_cart', JSON.stringify(updated));
      const count = updated.reduce((sum, i) => sum + i.quantity, 0);
      const sub = updated.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);
      setItemCount(count);
      setSubtotal(sub);
      setDeliveryFee(sub > 1500 || sub === 0 ? 0 : 50);
      setFinalTotal(sub + (sub > 1500 || sub === 0 ? 0 : 50));
      showToast('Item removed from cart.');
    }
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      await cartService.clearCart();
    } else {
      localStorage.removeItem('mandi_guest_cart');
    }
    setItems([]);
    setItemCount(0);
    setSubtotal(0);
    setDeliveryFee(0);
    setFinalTotal(0);
    setSavingsTotal(0);
  };

  return (
    <CartContext.Provider value={{
      items,
      itemCount,
      subtotal,
      deliveryFee,
      finalTotal,
      savingsTotal,
      loading,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      fetchCart,
      toastMessage,
      showToast
    }}>
      {children}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-mandi-navy text-white px-5 py-3 rounded-lg shadow-2xl border-l-4 border-mandi-green animate-fade-in text-sm font-medium">
          <span>{toastMessage.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{toastMessage.message}</span>
        </div>
      )}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
