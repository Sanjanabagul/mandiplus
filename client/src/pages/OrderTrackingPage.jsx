import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  AlertCircle,
  XCircle,
  ArrowLeft,
  RefreshCw,
  Phone
} from 'lucide-react';
import { orderService } from '../services/orderService.js';

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', desc: 'Received and awaiting farmer confirmation' },
  { key: 'confirmed', label: 'Farmer Confirmed', desc: 'Harvest scheduled at regional farm' },
  { key: 'preparing', label: 'Harvesting & Packing', desc: 'Graded and packed in standard crates/bags' },
  { key: 'ready_for_pickup', label: 'Ready at Farm Gate', desc: 'Ready for Mandi logistics partner pickup' },
  { key: 'out_for_delivery', label: 'Out for Delivery', desc: 'En route to your store/commercial kitchen' },
  { key: 'delivered', label: 'Delivered', desc: 'Delivered & verified by store manager' }
];

export const OrderTrackingPage = () => {
  const params = useParams();
  const orderId = params.id || params.orderId;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of requirements');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelMessage, setCancelMessage] = useState('');

  const fetchOrder = async () => {
    if (!orderId || orderId === 'undefined') {
      setLoading(false);
      return;
    }
    try {
      const res = await orderService.getOrderById(orderId);
      if (res.success && res.order) {
        setOrder(res.order);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (!orderId || orderId === 'undefined') return;
    setCancelLoading(true);
    try {
      const res = await orderService.cancelOrder(orderId, cancelReason);
      if (res.success) {
        setOrder(res.order);
        setCancelModalOpen(false);
      } else {
        setCancelMessage(res.message || 'Could not cancel order.');
      }
    } catch (err) {
      setCancelMessage(err.response?.data?.message || 'Cancellation failed.');
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-mandi-blue" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-mandi-navy mb-2">Order Not Found</h2>
        <Link to="/orders" className="text-xs font-bold text-mandi-blue hover:underline">
          Back to Orders
        </Link>
      </div>
    );
  }

  const isCancelled = order.status === 'cancelled';
  const canCancel = ['pending', 'confirmed'].includes(order.status);

  // Determine active step index
  const activeStepIdx = isCancelled
    ? -1
    : STATUS_STEPS.findIndex(s => s.key === order.status || (order.status === 'picked_up' && s.key === 'out_for_delivery'));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-6">
        <div className="flex items-center gap-3">
          <Link to="/orders" className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-mandi-navy">Order Tracking: #{order.orderNumber}</h1>
            <p className="text-xs text-mandi-muted">Live agricultural logistics milestone tracking</p>
          </div>
        </div>

        {canCancel && (
          <button
            onClick={() => setCancelModalOpen(true)}
            className="text-xs bg-red-50 text-red-600 hover:bg-red-100 font-bold px-3 py-1.5 rounded-lg border border-red-200 transition-colors"
          >
            Cancel Order
          </button>
        )}
      </div>

      {/* Cancelled Banner */}
      {isCancelled && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl mb-6 text-xs flex items-center gap-3">
          <XCircle className="w-6 h-6 shrink-0 text-red-600" />
          <div>
            <span className="font-bold block text-sm">Order Cancelled</span>
            <span>Reason: {order.cancellationReason || 'Cancelled by buyer'}. Inventory has been safely restored to the farmer catalog.</span>
          </div>
        </div>
      )}

      {/* ---------------- PERSISTED STATUS TIMELINE ---------------- */}
      {!isCancelled && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Fulfillment Lifecycle</h3>

          <div className="relative border-l-2 border-gray-200 ml-4 sm:ml-6 space-y-6">
            {STATUS_STEPS.map((st, idx) => {
              const isPastOrCurrent = activeStepIdx >= idx;
              const isCurrent = activeStepIdx === idx;

              // Find matching history entry
              const historyEntry = order.statusHistory?.find(h => h.status === st.key);

              return (
                <div key={idx} className="relative pl-6 sm:pl-8">
                  {/* Step Dot Icon */}
                  <div className={`absolute -left-2.5 top-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] shadow-xs ${
                    isCurrent
                      ? 'bg-mandi-blue ring-4 ring-blue-100 animate-pulse'
                      : isPastOrCurrent
                      ? 'bg-mandi-green'
                      : 'bg-gray-300'
                  }`}>
                    {isPastOrCurrent ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <h4 className={`text-xs font-bold ${isCurrent ? 'text-mandi-blue text-sm' : isPastOrCurrent ? 'text-gray-800' : 'text-gray-400'}`}>
                        {st.label}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {historyEntry?.note || st.desc}
                      </p>
                    </div>

                    {historyEntry?.timestamp && (
                      <span className="text-[10px] text-gray-400 font-medium">
                        {new Date(historyEntry.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}, {' '}
                        {new Date(historyEntry.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delivery Carrier & Address Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 text-xs">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-mandi-blue font-bold text-xs uppercase tracking-wider pb-2 border-b border-gray-100">
            <MapPin className="w-4 h-4" />
            <span>Delivery Destination</span>
          </div>
          <div className="font-bold text-gray-800 text-sm">{order.shippingAddress.fullName}</div>
          <p className="text-gray-600 leading-relaxed">
            {order.shippingAddress.streetAddress}, {order.shippingAddress.locality}, {order.shippingAddress.city} - {order.shippingAddress.pincode}
          </p>
          <div className="text-gray-500">Contact: {order.shippingAddress.phone}</div>
          {order.shippingAddress.instructions && (
            <div className="text-[11px] bg-gray-50 p-2 rounded text-gray-600 italic">
              Instructions: {order.shippingAddress.instructions}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider pb-2 border-b border-gray-100">
            <Truck className="w-4 h-4" />
            <span>Logistics Partner</span>
          </div>
          {order.deliveryPartner ? (
            <div>
              <div className="font-bold text-gray-800 text-sm">{order.deliveryPartner.name}</div>
              <div className="text-gray-600">{order.deliveryPartner.deliveryProfile?.vehicleType || 'Mandi Express Mini Truck'}</div>
              {order.deliveryPartner.deliveryProfile?.vehicleNumber && (
                <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                  Plate: {order.deliveryPartner.deliveryProfile.vehicleNumber}
                </div>
              )}
              {order.deliveryPartner.phone && (
                <div className="flex items-center gap-1 text-mandi-blue mt-2 font-semibold">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{order.deliveryPartner.phone}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-400 py-3">
              Mandi+ Express carrier will be assigned once farmer completes packing at farm gate.
            </div>
          )}
        </div>
      </div>

      {/* Items Summary Table */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-xs font-bold text-mandi-navy uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
          Items in this Order
        </h3>

        <div className="divide-y divide-gray-100 text-xs">
          {order.items.map((i, idx) => (
            <div key={idx} className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-bold text-gray-800">{i.name}</span>
                <span className="text-gray-400 ml-2">({i.quantity} {i.unit} @ ₹{i.unitPrice}/{i.unit})</span>
                <div className="text-[10px] text-mandi-blue">Farmer: {i.sellerName}</div>
              </div>
              <span className="font-bold text-mandi-navy">₹{i.subtotal.toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-gray-200 flex justify-between font-black text-sm text-mandi-navy">
          <span>Total Order Value</span>
          <span>₹{order.totalAmount.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Cancellation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-mandi-navy mb-2">Cancel Order #{order.orderNumber}?</h3>
            <p className="text-xs text-mandi-muted mb-4">
              Are you sure you want to cancel this order? Stock will be immediately restored to the regional farmer.
            </p>

            <label className="block text-xs font-semibold text-gray-700 mb-1">Reason for Cancellation</label>
            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-xs mb-4 focus:ring-1 focus:ring-mandi-blue focus:outline-none"
            >
              <option value="Change of requirements">Change of restaurant/store produce requirements</option>
              <option value="Procured elsewhere">Procured from local market earlier</option>
              <option value="Ordered by mistake">Placed order by mistake</option>
              <option value="Other">Other</option>
            </select>

            {cancelMessage && <p className="text-xs text-red-600 mb-3">{cancelMessage}</p>}

            <div className="flex gap-2">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="w-1/2 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelLoading}
                className="w-1/2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                {cancelLoading ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
