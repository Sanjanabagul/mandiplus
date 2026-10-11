import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext.jsx';
import { ProductCard } from '../components/ProductCard.jsx';

export const WishlistPage = () => {
  const { wishlistItems, wishlistCount } = useWishlist();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="pb-4 border-b border-gray-200 mb-6">
        <h1 className="text-2xl font-bold text-mandi-navy flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500 fill-red-500" />
          <span>My Wishlist ({wishlistCount})</span>
        </h1>
        <p className="text-xs text-mandi-muted mt-0.5">Your saved farm produce and seasonal deals</p>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm max-w-xl mx-auto">
          <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-sm text-mandi-navy mb-1">Your wishlist is empty</h3>
          <p className="text-xs text-mandi-muted mb-4">
            Click the heart icon on any produce card to save it for later procurement or quick reordering.
          </p>
          <Link
            to="/products"
            className="bg-mandi-blue hover:bg-mandi-blue-dark text-white font-bold py-2.5 px-6 rounded-lg text-xs inline-flex items-center gap-1.5 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Discover Farm Produce</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {wishlistItems.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};
