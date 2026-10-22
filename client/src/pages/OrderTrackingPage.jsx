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
  Phone,
  Warehouse,
  ShieldCheck,
  Check
} from 'lucide-react';
import { orderService } from '../services/orderService.js';

const STATUS_STEPS = [
  { key: 'confirmed', label: 'Order Confirmed', desc: 'Order verified and inventory reserved at Mandi+ Hub' },
  { key: 'processing_hub', label: 'Processing at Mandi+ Hub', desc: 'Routed to Mandi+ Hub fulfilment and pick queue' },
  { key: 'picking', label: 'Items Being Picked', desc: 'Hub staff picking fresh produce across traceable batches' },
  { key: 'packing', label: 'Packing Completed', desc: 'Consolidated, quality-inspected, and packed into single shipment' },
  { key: 'ready_for_pickup', label: 'Ready for Pickup', desc: 'Staged at Mandi+ Hub Dispatch Bay awaiting partner collection' },
  { key: 'assigned', label: 'Delivery Partner Assigned', desc: 'Logistics partner assigned to collect complete order from hub' },
  { key: 'picked_up', label: 'Picked Up from Mandi+ Hub', desc: 'Handover complete via secure pickup verification at hub bay' },
  { key: 'out_for_delivery', label: 'Out for Delivery', desc: 'Courier en route to your business/kitchen destination' },
  { key: 'delivered', label: 'Delivered', desc: 'Single consolidated shipment delivered & verified' }
];

const getActiveStepIndex = (status) => {
  switch (status) {
    case 'pending':
    case 'confirmed':
      return 0;
    case 'processing_hub':
      return 1;
    case 'picking':
      return 2;
    case 'packing':
      return 3;
    case 'ready_for_pickup':
      return 4;
    case 'assigned':
      return 5;
    case 'picked_up':
      return 6;
    case 'out_for_delivery':
      return 7;
    case 'delivered':
      return 8;
    default:
      return 0;
  }
};

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
  const canCancel = ['pending', 'confirmed', 'processing_hub'].includes(order.status);
  const activeStepIdx = isCancelled ? -1 : getActiveStepIndex(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-6">
        <div className="flex items-center gap-3">
          <Link to="/orders" className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-mandi-navy">Order Tracking: #{order.orderNumber}</h1>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Warehouse className="w-3 h-3 text-emerald-600" />
                Fulfilled by Mandi+ Hub
              </span>
            </div>
            <p className="text-xs text-mandi-muted">Centralized Quick-Commerce Fulfilment & Live Logistics Timeline</p>
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
            <span>Reason: {order.cancellationReason || 'Cancelled by buyer'}. Reserved hub inventory has been safely released.</span>
          </div>
        </div>
      )}

      {/* Prominent Mandi+ Hub Fulfilment Guarantee Banner */}
      {!isCancelled && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 mb-6 shadow-sm flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <Warehouse className="w-5 h-5" />
          </div>
          <div className="flex-1 text-xs">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-extrabold text-emerald-950 text-sm">Centralized Fulfilment Guarantee</span>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Mandi+ Hub Model
              </span>
            </div>
            <p className="text-emerald-900 font-medium leading-relaxed text-xs sm:text-sm">
              &ldquo;Your order is being prepared at Mandi+ Hub. Your delivery partner will collect your complete order from the hub.&rdquo;
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-emerald-800 pt-2 border-t border-emerald-200/60">
              <span>Fulfilment Hub: <strong>{order.hub?.name || 'Mandi+ Central Fulfilment Hub (Pune East - Wagholi)'}</strong></span>
              <span>Pickup Dispatch: <strong>Bay 1, Regional Fulfilment Terminal</strong></span>
              <span>Package: <strong>Single Consolidated Shipment</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- PERSISTED 9-STEP STATUS TIMELINE ---------------- */}
      {!isCancelled && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Mandi+ Hub Fulfilment Lifecycle (9 Milestones)
            </h3>
            <span className="text-xs font-bold text-mandi-blue capitalize">
              Current Status: {order.status.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="relative border-l-2 border-gray-200 ml-4 sm:ml-6 space-y-6">
            {STATUS_STEPS.map((st, idx) => {
              const isPast = activeStepIdx > idx;
              const isCurrent = activeStepIdx === idx;
              const isFuture = activeStepIdx < idx;

              // Find matching history entry
              const historyEntry = order.statusHistory?.find(h => h.status === st.key);

              return (
                <div key={idx} className="relative pl-6 sm:pl-8">
                  {/* Step Dot Icon */}
                  <div className={`absolute -left-2.5 top-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] shadow-xs ${
                    isCurrent
                      ? 'bg-mandi-blue ring-4 ring-blue-100 animate-pulse'
                      : isPast
                      ? 'bg-mandi-green'
                      : 'bg-gray-300'
                  }`}>
                    {isPast ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <h4 className={`text-xs font-bold ${
                        isCurrent
                          ? 'text-mandi-blue text-sm'
                          : isPast
                          ? 'text-gray-800'
                          : 'text-gray-400'
                      }`}>
                        {idx + 1}. {st.label}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {historyEntry?.note || st.desc}
                      </p>
                    </div>

                    {historyEntry?.timestamp && (
                      <span className="text-[10px] text-gray-400 font-medium shrink-0">
                        {new Date(historyEntry.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })},{' '}
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

      {/* Fulfilment Hub Origin & Destination Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 text-xs">
        {/* Hub Collection Origin */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider pb-2 border-b border-gray-100">
            <Warehouse className="w-4 h-4 text-emerald-600" />
            <span>Hub Dispatch Bay (Single Pickup Origin)</span>
          </div>
          <div className="font-bold text-gray-800 text-sm">
            {order.hub?.name || 'Mandi+ Central Fulfilment Hub'}
          </div>
          <p className="text-gray-600 leading-relaxed">
            {order.hub?.address?.street || 'Gate 4, APMC Regional Logistics Terminal, Nagar Road'}, {' '}
            {order.hub?.address?.locality || 'Wagholi'}, {order.hub?.address?.city || 'Pune'} - {order.hub?.address?.pincode || '412207'}
          </p>
          <div className="text-gray-500 flex items-center gap-1.5">
            <span>Fulfilment Contact:</span>
            <span className="font-semibold text-gray-700">{order.hub?.phone || '+91 20 8923 1100'}</span>
          </div>
          <div className="text-[11px] bg-emerald-50 text-emerald-800 p-2 rounded-lg border border-emerald-100 font-medium">
            Delivery partner collects the complete consolidated carton from this hub bay. No individual farm gate visits.
          </div>
        </div>

        {/* Customer Delivery Destination */}
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
      </div>

      {/* Logistics Partner Info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm mb-6 text-xs">
        <div className="flex items-center gap-2 text-mandi-blue font-bold text-xs uppercase tracking-wider pb-2 border-b border-gray-100 mb-3">
          <Truck className="w-4 h-4 text-mandi-blue" />
          <span>Assigned Mandi+ Logistics Partner</span>
        </div>
        {order.deliveryPartner ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-gray-800 text-sm">{order.deliveryPartner.name}</div>
              <div className="text-gray-600 mt-0.5">
                {order.deliveryPartner.deliveryProfile?.vehicleType || 'Mandi+ Quick-Commerce Mini Truck'}
                {order.deliveryPartner.deliveryProfile?.vehicleNumber && (
                  <span className="font-mono ml-2 text-gray-500 font-bold">
                    [{order.deliveryPartner.deliveryProfile.vehicleNumber}]
                  </span>
                )}
              </div>
            </div>
            {order.deliveryPartner.phone && (
              <a
                href={`tel:${order.deliveryPartner.phone}`}
                className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-mandi-blue font-bold px-3 py-1.5 rounded-lg transition-colors w-fit"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Courier ({order.deliveryPartner.phone})</span>
              </a>
            )}
          </div>
        ) : (
          <div className="text-gray-500 py-2">
            Order is being picked and packed at Mandi+ Hub. An authorized delivery courier will be assigned once the package reaches the Hub Ready-for-Pickup dispatch queue.
          </div>
        )}
      </div>

      {/* Items Summary Table with Traceable Batches */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <h3 className="text-xs font-bold text-mandi-navy uppercase tracking-wider">
            Consolidated Order Items ({order.items.length})
          </h3>
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            Single Package Fulfilment
          </span>
        </div>

        <div className="divide-y divide-gray-100 text-xs">
          {order.items.map((i, idx) => (
            <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="font-bold text-gray-800 text-sm">{i.name}</div>
                <div className="text-gray-500 mt-0.5">
                  {i.quantity} {i.unit} @ ₹{i.unitPrice}/{i.unit}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] mt-1">
                  <span className="text-mandi-blue font-semibold">
                    Source Farmer: {i.sellerName || 'Verified Regional Farmer'}
                  </span>
                  {i.allocatedBatches && i.allocatedBatches.length > 0 && (
                    <span className="text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded font-mono text-[10px]">
                      Batches: {i.allocatedBatches.map(b => b.batchNumber || b.batch).filter(Boolean).join(', ') || 'Auto-allocated'}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold text-mandi-navy text-sm">₹{i.subtotal.toLocaleString('en-IN')}</span>
              </div>
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
              Are you sure you want to cancel this order? Reserved stock will be immediately released back to Mandi+ Hub inventory.
            </p>

            <label className="block text-xs font-semibold text-gray-700 mb-1">Reason for Cancellation</label>
            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-xs mb-4 focus:ring-1 focus:ring-mandi-blue focus:outline-none"
            >
              <option value="Change of requirements">Change of produce requirements</option>
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
