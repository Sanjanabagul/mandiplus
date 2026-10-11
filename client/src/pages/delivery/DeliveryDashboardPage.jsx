import React, { useState, useEffect } from 'react';
import {
  Truck,
  MapPin,
  Phone,
  CheckCircle2,
  Package,
  AlertCircle,
  RefreshCw,
  Clock,
  ArrowRight
} from 'lucide-react';
import { deliveryService } from '../../services/deliveryService.js';
import { useAuth } from '../../context/AuthContext.jsx';

export const DeliveryDashboardPage = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('assigned'); // 'assigned' | 'available'
  const [loading, setLoading] = useState(true);
  const [proofNotes, setProofNotes] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchDeliveryData = async () => {
    setLoading(true);
    try {
      const [assignRes, availRes] = await Promise.all([
        deliveryService.getAssignments(),
        deliveryService.getAvailable()
      ]);
      if (assignRes.success) setAssignments(assignRes.assignments || []);
      if (availRes.success) setAvailableOrders(availRes.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryData();
  }, []);

  const handleClaim = async (orderId) => {
    try {
      await deliveryService.claimDelivery(orderId);
      fetchDeliveryData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error claiming delivery.');
    }
  };

  const handleUpdateStatus = async (assignmentId, status) => {
    try {
      await deliveryService.updateStatus(assignmentId, status, proofNotes);
      setProofNotes('');
      setUpdatingId(null);
      fetchDeliveryData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating delivery status.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
            <Truck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-mandi-navy">Mandi Express Logistics Fleet</h1>
            <p className="text-xs text-mandi-muted">
              Driver: {user?.name} • Vehicle: {user?.deliveryProfile?.vehicleType || 'Tata Ace Mini Truck'} ({user?.deliveryProfile?.vehicleNumber || 'MH-12-AQ-8899'})
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 text-xs font-bold shadow-xs">
          <button
            onClick={() => setActiveTab('assigned')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'assigned' ? 'bg-amber-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span>My Active Trips ({assignments.filter(a => a.status !== 'delivered').length})</span>
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'available' ? 'bg-amber-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span>Available to Claim ({availableOrders.length})</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-600" />
        </div>
      ) : activeTab === 'assigned' ? (
        /* ---------------- ASSIGNED DELIVERIES ---------------- */
        <div className="space-y-4">
          {assignments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm max-w-md mx-auto">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-bold text-sm text-mandi-navy mb-1">No active delivery assignments</h3>
              <p className="text-xs text-mandi-muted mb-4">Switch to the "Available to Claim" tab to accept shipments ready for farm pickup.</p>
              <button
                onClick={() => setActiveTab('available')}
                className="bg-amber-600 text-white font-bold py-2 px-5 rounded-lg text-xs"
              >
                Claim Available Deliveries
              </button>
            </div>
          ) : (
            assignments.map((a) => {
              const order = a.order || {};
              const isDelivered = a.status === 'delivered';

              return (
                <div
                  key={a._id}
                  className={`bg-white rounded-2xl border p-5 shadow-sm space-y-4 ${
                    isDelivered ? 'border-gray-200 opacity-80' : 'border-amber-200 bg-amber-50/10'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-gray-100 text-xs">
                    <div>
                      <span className="font-bold text-mandi-navy text-sm">Order #{order.orderNumber}</span>
                      <span className="text-gray-400 ml-2">Total Amount: ₹{order.totalAmount?.toLocaleString('en-IN')} (COD/Prepaid)</span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                      isDelivered ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      Status: {a.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Route: Pickup -> Dropoff */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100 space-y-1">
                      <div className="font-bold text-emerald-900 flex items-center gap-1.5 uppercase text-[10px]">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        1. Farm Gate Pickup
                      </div>
                      <div className="font-bold text-gray-800">{a.pickupAddress?.supplierName}</div>
                      <div className="text-gray-600">{a.pickupAddress?.locality}</div>
                      {a.pickupAddress?.phone && <div className="text-gray-500">Tel: {a.pickupAddress.phone}</div>}
                    </div>

                    <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-100 space-y-1">
                      <div className="font-bold text-blue-900 flex items-center gap-1.5 uppercase text-[10px]">
                        <MapPin className="w-3.5 h-3.5 text-mandi-blue" />
                        2. Store Destination Dropoff
                      </div>
                      <div className="font-bold text-gray-800">{a.deliveryAddress?.recipientName}</div>
                      <div className="text-gray-600">
                        {a.deliveryAddress?.locality}, {a.deliveryAddress?.city} - {a.deliveryAddress?.pincode}
                      </div>
                      <div className="text-mandi-blue font-semibold">Phone: {a.deliveryAddress?.phone}</div>
                    </div>
                  </div>

                  {/* Produce in Vehicle */}
                  <div className="text-xs">
                    <span className="font-bold text-gray-700 block mb-1">Produce Freight:</span>
                    <div className="flex flex-wrap gap-2">
                      {order.items?.map((item, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-[11px]">
                          {item.name}: <strong>{item.quantity} {item.unit}</strong>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Status Action Workflow Stepper */}
                  {!isDelivered && (
                    <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        {a.status === 'assigned' && (
                          <button
                            onClick={() => handleUpdateStatus(a._id, 'picked_up')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl shadow-xs transition-colors"
                          >
                            Mark Picked Up from Farm Gate
                          </button>
                        )}

                        {a.status === 'picked_up' && (
                          <button
                            onClick={() => handleUpdateStatus(a._id, 'out_for_delivery')}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-xl shadow-xs transition-colors"
                          >
                            Mark Out for Delivery to Store
                          </button>
                        )}

                        {a.status === 'in_transit' && (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Proof of Delivery Notes (e.g. Received by store manager)"
                              value={proofNotes}
                              onChange={(e) => setProofNotes(e.target.value)}
                              className="border border-gray-300 rounded-lg p-2 text-xs w-64 focus:ring-1 focus:ring-mandi-green focus:outline-none"
                            />
                            <button
                              onClick={() => handleUpdateStatus(a._id, 'delivered')}
                              className="bg-mandi-green hover:bg-mandi-green-dark text-white font-bold py-2 px-4 rounded-xl shadow-xs transition-colors"
                            >
                              Confirm Delivery Complete
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="text-[11px] text-gray-400">
                        Assigned on {new Date(a.assignedAt).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* ---------------- AVAILABLE TO CLAIM ---------------- */
        <div className="space-y-4">
          {availableOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm max-w-md mx-auto">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="font-bold text-sm text-mandi-navy mb-1">No unassigned orders</h3>
              <p className="text-xs text-mandi-muted">All current farm harvest orders have been assigned to delivery drivers.</p>
            </div>
          ) : (
            availableOrders.map((ord) => (
              <div
                key={ord._id}
                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs"
              >
                <div>
                  <div className="font-bold text-sm text-mandi-navy">Order #{ord.orderNumber}</div>
                  <div className="text-gray-600 mt-0.5">
                    Destination: <strong>{ord.shippingAddress?.fullName}</strong> ({ord.shippingAddress?.locality}, {ord.shippingAddress?.city})
                  </div>
                  <div className="text-gray-500 text-[11px] mt-0.5">
                    Items: {ord.items?.map(i => `${i.name} (${i.quantity} ${i.unit})`).join(', ')}
                  </div>
                </div>

                <button
                  onClick={() => handleClaim(ord._id)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-5 rounded-xl shadow-sm transition-colors text-xs whitespace-nowrap"
                >
                  Claim & Accept Trip
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
