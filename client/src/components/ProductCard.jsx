import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Check, Plus, Minus, ShieldCheck, MapPin } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';

export const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { items, addToCart, updateQuantity } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  if (!product) return null;

  const prodId = product._id || product.id;
  const cartItem = items.find(i => (i.product?._id || i.productId) === prodId);
  const inCartQty = cartItem?.quantity || 0;
  const isSaved = isWishlisted(prodId);

  const discountPercent = product.discountPercent || (
    product.originalPrice && product.originalPrice > product.pricePerUnit
      ? Math.round(((product.originalPrice - product.pricePerUnit) / product.originalPrice) * 100)
      : 0
  );

  const isAvailable = product.isAvailable && product.stockQuantity > 0;
  const moq = product.minOrderQuantity || 1;

  const handleAddToCartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAvailable) {
      addToCart(product, moq);
    }
  };

  const handleIncrement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCartQty < product.stockQuantity) {
      updateQuantity(prodId, inCartQty + 1);
    }
  };

  const handleDecrement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(prodId, inCartQty - 1);
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-hover transition-all duration-200 flex flex-col h-full overflow-hidden relative group">

      {/* Top Badges & Wishlist Button */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
        <div className="flex flex-col gap-1 items-start">
          {/* Quality Grade Tag */}
          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide shadow-sm ${
            product.qualityGrade === 'Grade A'
              ? 'bg-mandi-green text-white'
              : 'bg-amber-500 text-white'
          }`}>
            {product.qualityGrade || 'Grade A'}
          </span>

          {/* Organic Tag */}
          {product.isOrganic && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
              <ShieldCheck className="w-3 h-3" />
              <span>Organic</span>
            </span>
          )}
        </div>

        {/* Wishlist Heart */}
        <button
          onClick={handleWishlistToggle}
          className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
          title={isSaved ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
        </button>
      </div>

      {/* Product Image Link */}
      <Link to={`/products/${prodId}`} className="block relative pt-[75%] bg-gray-50 overflow-hidden">
        <img
          src={product.images && product.images.length > 0 ? product.images[0] : 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&q=80'}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {!isAvailable && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Card Content */}
      <div className="p-3.5 flex flex-col flex-1">
        <div className="text-[11px] text-gray-400 font-medium mb-0.5 uppercase tracking-wide">
          {product.category}
        </div>

        <Link
          to={`/products/${prodId}`}
          className="text-sm font-semibold text-mandi-text hover:text-mandi-blue line-clamp-1 leading-snug mb-1"
          title={product.name}
        >
          {product.name}
        </Link>

        {/* Supplier Locality */}
        <div className="flex items-center gap-1 text-[11px] text-mandi-muted mb-2 truncate">
          <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
          <span className="truncate">{product.sellerName} • {product.pickupLocality}</span>
        </div>

        {/* Pricing & Discounts */}
        <div className="flex items-baseline gap-2 mt-auto mb-2">
          <span className="text-base font-bold text-mandi-navy">
            ₹{product.pricePerUnit}
            <span className="text-xs font-normal text-gray-500">/{product.unit}</span>
          </span>

          {product.originalPrice && product.originalPrice > product.pricePerUnit && (
            <span className="text-xs text-gray-400 line-through">
              ₹{product.originalPrice}
            </span>
          )}

          {discountPercent > 0 && (
            <span className="text-xs font-bold text-mandi-discount">
              {discountPercent}% off
            </span>
          )}
        </div>

        {/* MOQ & Stock Indicator */}
        <div className="flex items-center justify-between text-[11px] text-gray-500 pb-2.5 border-b border-gray-100 mb-3">
          <span>Min. Order: <strong className="text-gray-700">{moq} {product.unit}</strong></span>
          {isAvailable ? (
            <span className="text-emerald-600 font-medium flex items-center gap-0.5">
              <Check className="w-3 h-3" /> In Stock
            </span>
          ) : (
            <span className="text-red-500 font-medium">Sold Out</span>
          )}
        </div>

        {/* Add to Cart / Quantity Stepper */}
        <div>
          {inCartQty > 0 ? (
            <div className="flex items-center justify-between bg-blue-50 border border-mandi-blue/30 rounded-lg p-1">
              <button
                onClick={handleDecrement}
                className="w-7 h-7 bg-white text-mandi-blue hover:bg-mandi-blue hover:text-white rounded flex items-center justify-center transition-colors shadow-xs"
                title="Decrease"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-bold text-mandi-blue px-2">
                {inCartQty} in cart
              </span>
              <button
                onClick={handleIncrement}
                disabled={inCartQty >= product.stockQuantity}
                className="w-7 h-7 bg-white text-mandi-blue hover:bg-mandi-blue hover:text-white disabled:opacity-40 rounded flex items-center justify-center transition-colors shadow-xs"
                title="Increase"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCartClick}
              disabled={!isAvailable}
              className="w-full bg-mandi-blue hover:bg-mandi-blue-dark disabled:bg-gray-100 disabled:text-gray-400 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm active:scale-98"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Add to Cart</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
