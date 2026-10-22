import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Banknote,
  Plus,
  ArrowRight,
  AlertCircle,
  Truck,
  Warehouse
} from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { orderService } from '../services/orderService.js';
import { authService } from '../services/authService.js';

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, itemCount, subtotal, deliveryFee, finalTotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [step, setStep] = useState(1); // 1: Address, 2: Review, 3: Payment
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Address form fields
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [streetAddress, setStreetAddress] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('Pune');
  const [state, setState] = useState('Maharashtra');
  const [pincode, setPincode] = useState('411038');
  const [instructions, setInstructions] = useState('');

  const [savedAddresses, setSavedAddresses] = useState(user?.addresses || []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (user?.addresses && user.addresses.length > 0) {
      setSavedAddresses(user.addresses);
      const defaultIdx = user.addresses.findIndex(a => a.isDefault);
      setSelectedAddressIndex(defaultIdx > -1 ? defaultIdx : 0);
    } else {
      setShowAddAddressForm(true);
    }
  }, [user]);

  const handleAddNewAddress = async (e) => {
    e.preventDefault();
    if (!fullName || !phone || !streetAddress || !locality || !city || !pincode) {
      setErrorMessage('Please fill in all required address fields.');
      return;
    }

    try {
      const res = await authService.addAddress({
        fullName,
        phone,
        streetAddress,
        locality,
        city,
        state,
        pincode,
        deliveryInstructions: instructions
      });

      if (res.success) {
        setSavedAddresses(res.addresses);
        setSelectedAddressIndex(res.addresses.length - 1);
        setShowAddAddressForm(false);
        setErrorMessage('');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to save address.');
    }
  };

  const handlePlaceOrder = async () => {
    const selectedAddress = savedAddresses[selectedAddressIndex];
    if (!selectedAddress) {
      setErrorMessage('Please select or add a delivery address.');
      setStep(1);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await orderService.createOrder({
        shippingAddress: selectedAddress,
        paymentMethod
      });

      if (res.success && res.order) {
        await clearCart();
        navigate(`/order-confirmation/${res.order._id}`);
      } else {
        setErrorMessage(res.message || 'Failed to place order.');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Checkout failed. Please check produce availability.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-mandi-navy mb-2">Your Cart is Empty</h2>
        <p className="text-xs text-mandi-muted mb-4">Please add products to your cart before proceeding to checkout.</p>
        <Link to="/products" className="bg-mandi-blue text-white text-xs font-bold px-6 py-2 rounded-lg">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-mandi-navy mb-6">Mandi+ Direct Checkout</h1>

      {/* Stepper Header */}
      <div className="grid grid-cols-3 gap-2 mb-8 bg-white p-3 rounded-xl border border-gray-200 text-center text-xs font-bold">
        <button
          onClick={() => setStep(1)}
          className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            step >= 1 ? 'bg-mandi-blue text-white shadow-xs' : 'text-gray-400'
          }`}
        >
          <span>1. Delivery Address</span>
        </button>

        <button
          onClick={() => { if (savedAddresses.length > 0) setStep(2); }}
          className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            step >= 2 ? 'bg-mandi-blue text-white shadow-xs' : 'text-gray-400'
          }`}
        >
          <span>2. Order Review</span>
        </button>

        <button
          onClick={() => { if (savedAddresses.length > 0) setStep(3); }}
          className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            step >= 3 ? 'bg-mandi-blue text-white shadow-xs' : 'text-gray-400'
          }`}
        >
          <span>3. Payment Method</span>
        </button>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2 border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* ---------------- MAIN STEP CONTENT ---------------- */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">

          {/* STEP 1: DELIVERY ADDRESS */}
          {step === 1 && (
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <h3 className="text-base font-bold text-mandi-navy flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-mandi-blue" />
                  Select Delivery Address
                </h3>
                <button
                  onClick={() => setShowAddAddressForm(!showAddAddressForm)}
                  className="text-xs text-mandi-blue hover:underline font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddAddressForm ? 'Cancel' : 'Add New Address'}</span>
                </button>
              </div>

              {/* Saved Addresses List */}
              {!showAddAddressForm && savedAddresses.length > 0 && (
                <div className="space-y-3 mb-6">
                  {savedAddresses.map((addr, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedAddressIndex(idx)}
                      className={`p-4 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between ${
                        selectedAddressIndex === idx
                          ? 'border-mandi-blue bg-blue-50/40 shadow-xs'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm text-mandi-navy flex items-center gap-2">
                          <span>{addr.fullName}</span>
                          <span className="text-gray-400 text-xs font-normal">({addr.phone})</span>
                          {addr.isDefault && (
                            <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded">Default</span>
                          )}
                        </div>
                        <p className="text-gray-600 mt-1 leading-relaxed">
                          {addr.streetAddress}, {addr.locality}, {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                        </p>
                        {addr.deliveryInstructions && (
                          <p className="text-[11px] text-gray-500 italic mt-1">
                            Note: {addr.deliveryInstructions}
                          </p>
                        )}
                      </div>

                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedAddressIndex === idx ? 'border-mandi-blue bg-mandi-blue text-white' : 'border-gray-300'
                      }`}>
                        {selectedAddressIndex === idx && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => setStep(2)}
                    className="w-full bg-mandi-blue hover:bg-mandi-blue-dark text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors mt-4 shadow-sm"
                  >
                    <span>Deliver to this Address</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Add New Address Form */}
              {(showAddAddressForm || savedAddresses.length === 0) && (
                <form onSubmit={handleAddNewAddress} className="space-y-3 text-xs bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h4 className="font-bold text-gray-800">New Address Details</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-600 mb-1 font-semibold">Recipient Full Name *</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-mandi-blue focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1 font-semibold">Phone Number *</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-mandi-blue focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-600 mb-1 font-semibold">Street / Shop / Building Address *</label>
                    <input
                      type="text"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      placeholder="e.g. Shop 12, Main Mandi Road, Near Gandhi Chowk"
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-mandi-blue focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-gray-600 mb-1 font-semibold">Locality / Area *</label>
                      <input
                        type="text"
                        value={locality}
                        onChange={(e) => setLocality(e.target.value)}
                        placeholder="e.g. Kothrud"
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-mandi-blue focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1 font-semibold">City *</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-mandi-blue focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1 font-semibold">Pincode *</label>
                      <input
                        type="text"
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-mandi-blue focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-600 mb-1 font-semibold">Delivery Instructions (Optional)</label>
                    <input
                      type="text"
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="e.g. Call before arrival, leave at rear kitchen dock"
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-mandi-blue focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-mandi-green hover:bg-mandi-green-dark text-white font-bold py-2.5 rounded-lg text-xs transition-colors mt-2"
                  >
                    Save Address & Continue
                  </button>
                </form>
              )}
            </div>
          )}

          {/* STEP 2: ORDER REVIEW */}
          {step === 2 && (
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <h3 className="text-base font-bold text-mandi-navy flex items-center gap-2">
                  <Truck className="w-4 h-4 text-mandi-blue" />
                  Order Review & Dispatch Summary
                </h3>
                <button onClick={() => setStep(1)} className="text-xs text-mandi-blue hover:underline">
                  Change Address
                </button>
              </div>

              {/* Delivery Destination Snippet */}
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 mb-4 text-xs">
                <span className="text-gray-400 block font-semibold text-[10px] uppercase">Delivering To:</span>
                <span className="font-bold text-mandi-navy">
                  {savedAddresses[selectedAddressIndex]?.fullName} ({savedAddresses[selectedAddressIndex]?.phone})
                </span>
                <div className="text-gray-600 text-[11px]">
                  {savedAddresses[selectedAddressIndex]?.streetAddress}, {savedAddresses[selectedAddressIndex]?.locality}, {savedAddresses[selectedAddressIndex]?.city} - {savedAddresses[selectedAddressIndex]?.pincode}
                </div>
              </div>

              {/* Mandi+ Hub Centralized Fulfilment Guarantee */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4 text-xs text-emerald-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Warehouse className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Consolidated Hub Order:</strong> All {itemCount} items will be picked and packed at <strong>Mandi+ Hub</strong> into a single consolidated delivery package.
                  </span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded shrink-0">
                  Fulfilled by Mandi+ Hub
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-3 divide-y divide-gray-100 mb-6">
                {items.map((i, idx) => (
                  <div key={idx} className="pt-2 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-gray-800">{i.product?.name || 'Produce'}</div>
                      <div className="text-[11px] text-gray-500">
                        Qty: {i.quantity} {i.product?.unit || 'kg'} • Source Farmer: <strong>{i.product?.sellerName || 'Verified Regional Farmer'}</strong> • Fulfilled by Mandi+ Hub
                      </div>
                    </div>
                    <div className="font-bold text-mandi-navy">
                      ₹{(i.subtotal || i.unitPrice * i.quantity).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep(3)}
                className="w-full bg-mandi-blue hover:bg-mandi-blue-dark text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <span>Continue to Payment Method</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 3: PAYMENT METHOD */}
          {step === 3 && (
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <h3 className="text-base font-bold text-mandi-navy flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-mandi-blue" />
                  Select Payment Option
                </h3>
                <button onClick={() => setStep(2)} className="text-xs text-mandi-blue hover:underline">
                  Review Order
                </button>
              </div>

              <div className="space-y-3 mb-6">
                {/* Cash on Delivery */}
                <label className={`p-4 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                  paymentMethod === 'cod' ? 'border-mandi-blue bg-blue-50/40 shadow-xs' : 'border-gray-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="text-mandi-blue focus:ring-mandi-blue"
                    />
                    <div>
                      <div className="font-bold text-sm text-mandi-navy flex items-center gap-1.5">
                        <Banknote className="w-4 h-4 text-emerald-600" />
                        <span>Cash on Delivery (COD)</span>
                      </div>
                      <p className="text-gray-500 text-[11px]">Pay directly upon produce delivery inspection at your store</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-700">Recommended</span>
                </label>

                {/* Simulated Digital Mode */}
                <label className={`p-4 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                  paymentMethod === 'test_simulation' ? 'border-mandi-blue bg-blue-50/40 shadow-xs' : 'border-gray-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'test_simulation'}
                      onChange={() => setPaymentMethod('test_simulation')}
                      className="text-mandi-blue focus:ring-mandi-blue"
                    />
                    <div>
                      <div className="font-bold text-sm text-mandi-navy flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-mandi-blue" />
                        <span>Simulated Instant Digital Payment (Test Mode)</span>
                      </div>
                      <p className="text-gray-500 text-[11px]">Instant simulated clearance without real debit card or bank credentials</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-blue-100 text-mandi-blue font-bold px-2 py-0.5 rounded">
                    Test Mode
                  </span>
                </label>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:bg-gray-200 text-mandi-navy font-black py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
              >
                {isSubmitting ? (
                  <span>Revalidating Stock & Placing Order...</span>
                ) : (
                  <span>Confirm & Place Order (₹{finalTotal.toLocaleString('en-IN')})</span>
                )}
              </button>
            </div>
          )}

        </div>

        {/* ---------------- RIGHT: ORDER PRICE SUMMARY ---------------- */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-mandi-navy uppercase tracking-wider pb-3 border-b border-gray-100">
            Order Total
          </h3>

          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Items Subtotal ({itemCount} units)</span>
              <span className="font-bold text-gray-800">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Charges</span>
              <span>{deliveryFee === 0 ? <strong className="text-mandi-discount">FREE</strong> : `₹${deliveryFee}`}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
            <span className="font-black text-sm text-mandi-navy">Final Payable</span>
            <span className="font-black text-xl text-mandi-navy">
              ₹{finalTotal.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="pt-4 border-t border-gray-100 text-[11px] text-gray-400 space-y-1">
            <p>• Prices and stock validated atomically by backend server</p>
            <p>• Delivery timeline: 24 to 48 hours directly from farm gate</p>
          </div>
        </div>

      </div>
    </div>
  );
};
