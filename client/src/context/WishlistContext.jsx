import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';
import { useAuth } from './AuthContext.jsx';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(new Set());

  const fetchWishlist = async () => {
    if (isAuthenticated) {
      try {
        const res = await api.get('/wishlist');
        if (res.data.success) {
          const prods = res.data.products || [];
          setWishlistItems(prods);
          setWishlistIds(new Set(prods.map(p => p._id)));
        }
      } catch (err) {
        console.error('Failed to load wishlist:', err);
      }
    } else {
      setWishlistItems([]);
      setWishlistIds(new Set());
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [isAuthenticated]);

  const toggleWishlist = async (product) => {
    const prodId = product._id || product.id;
    if (!isAuthenticated) {
      alert('Please log in to save items to your wishlist.');
      return false;
    }

    try {
      const res = await api.post(`/wishlist/toggle/${prodId}`);
      if (res.data.success) {
        const nextSet = new Set(wishlistIds);
        if (res.data.isAdded) {
          nextSet.add(prodId);
          setWishlistItems(prev => [...prev, product]);
        } else {
          nextSet.delete(prodId);
          setWishlistItems(prev => prev.filter(p => p._id !== prodId));
        }
        setWishlistIds(nextSet);
        return res.data.isAdded;
      }
    } catch (err) {
      console.error('Wishlist toggle error:', err);
    }
    return false;
  };

  const isWishlisted = (productId) => {
    return wishlistIds.has(productId);
  };

  return (
    <WishlistContext.Provider value={{
      wishlistItems,
      wishlistCount: wishlistIds.size,
      toggleWishlist,
      isWishlisted,
      fetchWishlist
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
