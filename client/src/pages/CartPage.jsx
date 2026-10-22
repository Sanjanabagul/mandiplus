import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  ArrowRight,
  ShieldCheck,
  Truck,
  Sparkles,
  Warehouse
} from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';

export const CartPage = () => {
  const navigate = useNavigate();
  const {
    items,
    itemCount,
    subtotal,
    deliveryFee,
    finalTotal,
    savingsTotal,
    updateQuantity,
    removeFromCart,
    clearCart
  } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-blue-50 text-mandi-blue flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-mandi-navy mb-2">Your Mandi+ Cart is Empty</h2>
        <p className="text-xs text-mandi-muted max-w-sm mx-auto mb-6">
          Explore fresh vegetables, fruits, grains, pulses, and wholesale deals directly from certified regional farmers.
        </p>
        <Link
          to="/products"
          className="bg-mandi-blue hover:bg-mandi-blue-dark text-white font-bold py-3 px-8 rounded-xl text-xs transition-colors shadow-sm inline-flex items-center gap-2"
        >
          <span>Shop Fresh Produce</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-mandi-navy">Shopping Cart</h1>
          <p className="text-xs text-mandi-muted">{itemCount} items from verified farm sellers</p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 hover:underline"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Cart</span>
        </button>
      </div>

      {/* Centralized Mandi+ Hub Fulfilment Notice */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-900 mb-6 shadow-xs">
        <div className="flex items-center gap-2.5">
          <Warehouse className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Centralized Quick Fulfilment:</strong> All produce is picked, quality-checked, and consolidated at <strong>Mandi+ Hub</strong> for a single delivery to your doorstep.
          </span>
        </div>
        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded w-fit">
          Fulfilled by Mandi+ Hub
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* ---------------- LEFT: CART ITEMS LIST ---------------- */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm divide-y divide-gray-100">
          {items.map((item, idx) => {
            const product = item.product || {};
            const prodId = product._id || item.productId;
            const moq = item.minOrderQuantity || product.minOrderQuantity || 1;
            const unit = product.unit || 'kg';
            const price = item.unitPrice || product.pricePerUnit;

            return (
              <div key={idx} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">

                {/* Produce Image & Name */}
                <div className="flex items-center gap-4 flex-1">
                  <img
                    src={product.images && product.images.length > 0 ? product.images[0] : 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=200&q=80'}
                    alt={product.name}
                    className="w-20 h-20 rounded-xl object-cover border border-gray-100 shrink-0"
                  />

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] uppercase font-bold text-mandi-blue bg-blue-50 px-2 py-0.5 rounded">
                        {product.category || 'Produce'}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                        Fulfilled by Mandi+ Hub
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-mandi-navy">
                      <Link to={`/products/${prodId}`} className="hover:text-mandi-blue">
                        {product.name}
                      </Link>
                    </h3>
                    <div className="text-[11px] text-gray-500">
                      Source Farmer: <strong>{product.sellerName || 'Verified Regional Farmer'}</strong>
                    </div>
                    <div className="text-xs font-bold text-mandi-navy">
                      ₹{price} / {unit}
                    </div>
                  </div>
                </div>

                {/* Quantity Stepper & Subtotal */}
                <div className="flex items-center justify-between w-full sm:w-auto gap-6 sm:justify-end">
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
                      <button
                        onClick={() => updateQuantity(prodId, item.quantity - 1)}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-12 text-center text-xs font-bold text-gray-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(prodId, item.quantity + 1)}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[10px] text-gray-400">Min: {moq} {unit}</span>
                  </div>

                  <div className="text-right min-w-[80px]">
                    <div className="text-sm font-black text-mandi-navy">
                      ₹{(item.subtotal || price * item.quantity).toLocaleString('en-IN')}
                    </div>
                    <button
                      onClick={() => removeFromCart(prodId)}
                      className="text-[11px] text-red-500 hover:text-red-700 font-semibold hover:underline mt-1"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ---------------- RIGHT: PRICE SUMMARY ---------------- */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-mandi-navy uppercase tracking-wider pb-3 border-b border-gray-100">
            Price Summary
          </h3>

          <div className="space-y-2.5 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Items Total ({itemCount} units)</span>
              <span className="font-bold text-gray-800">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>

            {savingsTotal > 0 && (
              <div className="flex justify-between text-mandi-discount">
                <span>Direct Farmer Discount Savings</span>
                <span className="font-bold">-₹{savingsTotal.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Delivery Charges</span>
              <span>
                {deliveryFee === 0 ? (
                  <strong className="text-mandi-discount">FREE</strong>
                ) : (
                  <strong>₹{deliveryFee}</strong>
                )}
              </span>
            </div>

            {deliveryFee > 0 && (
              <p className="text-[10px] text-mandi-muted bg-yellow-50 text-yellow-800 p-2 rounded border border-yellow-200/60">
                Add ₹{(1500 - subtotal).toLocaleString('en-IN')} more to get <strong>FREE delivery</strong>!
              </p>
            )}
          </div>

          <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
            <span className="font-black text-sm text-mandi-navy">Total Amount</span>
            <span className="font-black text-xl text-mandi-navy">
              ₹{finalTotal.toLocaleString('en-IN')}
            </span>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-mandi-navy font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <Link
            to="/products"
            className="w-full text-center py-2 text-xs font-semibold text-mandi-blue hover:underline block"
          >
            Continue Shopping
          </Link>

          <div className="pt-4 border-t border-gray-100 space-y-2 text-[11px] text-gray-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-mandi-green shrink-0" />
              <span>Safe & Secure Checkout • Encrypted Transactions</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-mandi-blue shrink-0" />
              <span>Direct APMC Farm Gate Quality Assurance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
