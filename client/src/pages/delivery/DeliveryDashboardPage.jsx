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
  ArrowRight,
  Warehouse,
  ShieldCheck,
  KeyRound
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
  const [pickupOtp, setPickupOtp] = useState('');
  const [activeOtpModalId, setActiveOtpModalId] = useState(null);
  const [actionError, setActionError] = useState('');

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
    setActionError('');
    try {
      const res = await deliveryService.claimDelivery(orderId);
      if (res.success) {
        fetchDeliveryData();
        setActiveTab('assigned');
      } else {
        setActionError(res.message || 'Error claiming delivery.');
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Error claiming delivery.');
    }
  };

  const handleUpdateStatus = async (assignmentId, status, otpValue = null) => {
    setActionError('');
    try {
      const res = await deliveryService.updateStatus(assignmentId, status, proofNotes, otpValue);
      if (res.success) {
        setProofNotes('');
        setPickupOtp('');
        setActiveOtpModalId(null);
        fetchDeliveryData();
      } else {
        setActionError(res.message || 'Error updating delivery status.');
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Error updating delivery status.');
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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-mandi-navy">Mandi+ Logistics Partner Portal</h1>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Warehouse className="w-3 h-3 text-emerald-600" />
                Hub Fulfilment Fleet
              </span>
            </div>
            <p className="text-xs text-mandi-muted">
              Partner: {user?.name} • Vehicle: {user?.deliveryProfile?.vehicleType || 'Mandi+ Quick Courier Van'} ({user?.deliveryProfile?.vehicleNumber || 'MH-12-AQ-8899'})
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
            <span>Hub Staged Orders ({availableOrders.length})</span>
          </button>
        </div>
      </div>

      {/* Mandatory Hub Fulfilment Operational Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 mb-6 text-xs text-amber-900 flex items-start gap-3 shadow-xs">
        <Warehouse className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-sm block mb-0.5">Centralized Hub Single-Pickup Protocol</span>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            All customer packages are consolidated, quality-checked, and packed together at <strong>Mandi+ Hub</strong>.
            You only visit the hub dispatch bay once per trip—<strong>no individual farm gate pickups</strong>.
            Present your OTP at Dispatch Bay 1 to collect verified cartons.
          </p>
        </div>
      </div>

      {actionError && (
        <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold mb-4 border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

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
              <p className="text-xs text-mandi-muted mb-4">
                Switch to the &ldquo;Hub Staged Orders&rdquo; tab to claim packed shipments ready at Mandi+ Hub.
              </p>
              <button
                onClick={() => setActiveTab('available')}
                className="bg-amber-600 text-white font-bold py-2 px-5 rounded-lg text-xs"
              >
                Claim Staged Hub Deliveries
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

                  {/* Route: Hub Pickup -> Customer Destination */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {/* 1. Hub Dispatch Bay Pickup */}
                    <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100 space-y-1">
                      <div className="font-bold text-emerald-900 flex items-center gap-1.5 uppercase text-[10px]">
                        <Warehouse className="w-3.5 h-3.5 text-emerald-600" />
                        1. Single Pickup Origin (Mandi+ Hub)
                      </div>
                      <div className="font-bold text-gray-800">
                        {a.pickupAddress?.hubName || a.pickupAddress?.supplierName || 'Mandi+ Central Fulfilment Hub'}
                      </div>
                      <div className="text-gray-600">
                        {a.pickupAddress?.streetAddress || 'Gate 4, APMC Regional Logistics Terminal, Nagar Road'}, {a.pickupAddress?.locality || 'Wagholi'}, {a.pickupAddress?.city || 'Pune'}
                      </div>
                      <div className="text-gray-500 font-medium">
                        Hub Bay Phone: {a.pickupAddress?.phone || '+91 20 8923 1100'}
                      </div>
                    </div>

                    {/* 2. Customer Destination */}
                    <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-100 space-y-1">
                      <div className="font-bold text-blue-900 flex items-center gap-1.5 uppercase text-[10px]">
                        <MapPin className="w-3.5 h-3.5 text-mandi-blue" />
                        2. Customer Destination Dropoff
                      </div>
                      <div className="font-bold text-gray-800">{a.deliveryAddress?.recipientName}</div>
                      <div className="text-gray-600">
                        {a.deliveryAddress?.streetAddress}, {a.deliveryAddress?.locality}, {a.deliveryAddress?.city} - {a.deliveryAddress?.pincode}
                      </div>
                      <div className="text-mandi-blue font-semibold">
                        Customer Phone: {a.deliveryAddress?.phone}
                      </div>
                    </div>
                  </div>

                  {/* Consolidated Carton Manifest */}
                  <div className="text-xs">
                    <span className="font-bold text-gray-700 block mb-1">Consolidated Carton Manifest:</span>
                    <div className="flex flex-wrap gap-2">
                      {order.items?.map((item, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-[11px]">
                          {item.name}: <strong>{item.quantity} {item.unit}</strong>
                          <span className="text-[10px] text-gray-400 ml-1">({item.sellerName || 'Direct Farm'})</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Status Action Workflow Stepper */}
                  {!isDelivered && (
                    <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        {a.status === 'assigned' && (
                          activeOtpModalId === a._id ? (
                            <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-emerald-300 shadow-sm">
                              <KeyRound className="w-4 h-4 text-emerald-600" />
                              <input
                                type="text"
                                maxLength={6}
                                placeholder="Enter Pickup OTP"
                                value={pickupOtp}
                                onChange={(e) => setPickupOtp(e.target.value)}
                                className="w-32 border border-gray-300 rounded p-1 text-xs font-mono font-bold"
                              />
                              <button
                                onClick={() => handleUpdateStatus(a._id, 'picked_up', pickupOtp)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded text-xs"
                              >
                                Verify & Pick Up
                              </button>
                              <button
                                onClick={() => setActiveOtpModalId(null)}
                                className="text-gray-400 hover:text-gray-600 px-1 text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setActiveOtpModalId(a._id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                            >
                              <Warehouse className="w-4 h-4" />
                              <span>Confirm Pickup at Mandi+ Hub</span>
                            </button>
                          )
                        )}

                        {a.status === 'picked_up' && (
                          <button
                            onClick={() => handleUpdateStatus(a._id, 'out_for_delivery')}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                          >
                            <Truck className="w-4 h-4" />
                            <span>Mark Out for Delivery</span>
                          </button>
                        )}

                        {(a.status === 'out_for_delivery' || a.status === 'in_transit') && (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Proof of Delivery Notes (e.g. Received by customer)"
                              value={proofNotes}
                              onChange={(e) => setProofNotes(e.target.value)}
                              className="border border-gray-300 rounded-lg p-2 text-xs w-64 focus:ring-1 focus:ring-mandi-green focus:outline-none"
                            />
                            <button
                              onClick={() => handleUpdateStatus(a._id, 'delivered')}
                              className="bg-mandi-green hover:bg-mandi-green-dark text-white font-bold py-2 px-4 rounded-xl shadow-xs transition-colors flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Confirm Delivery Complete</span>
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
              <p className="text-xs text-mandi-muted">
                All packed orders at Mandi+ Hub have been claimed by couriers.
              </p>
            </div>
          ) : (
            availableOrders.map((ord) => (
              <div
                key={ord._id}
                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-mandi-navy">Order #{ord.orderNumber}</span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      Packed at Mandi+ Hub
                    </span>
                  </div>
                  <div className="text-gray-600 mt-1">
                    Destination: <strong>{ord.shippingAddress?.fullName}</strong> ({ord.shippingAddress?.locality}, {ord.shippingAddress?.city})
                  </div>
                  <div className="text-gray-500 text-[11px] mt-0.5">
                    Freight: {ord.items?.map(i => `${i.name} (${i.quantity} ${i.unit})`).join(', ')}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-medium mt-1">
                    Pickup: Mandi+ Central Fulfilment Hub Dispatch Bay 1
                  </div>
                </div>

                <button
                  onClick={() => handleClaim(ord._id)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-5 rounded-xl shadow-sm transition-colors text-xs whitespace-nowrap flex items-center gap-1.5"
                >
                  <Truck className="w-4 h-4" />
                  <span>Claim & Accept Hub Trip</span>
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
