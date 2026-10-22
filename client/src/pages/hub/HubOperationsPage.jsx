import React, { useState, useEffect } from 'react';
import {
  Warehouse,
  Package,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Truck,
  Layers,
  ArrowRight,
  ClipboardList,
  ShieldCheck,
  Search,
  Filter,
  Check,
  X,
  ExternalLink,
  RefreshCw,
  Box,
  FileText,
  AlertCircle,
  TrendingUp,
  MapPin,
  Calendar,
  CheckSquare,
  Square,
  Phone
} from 'lucide-react';
import { hubService } from '../../services/hubService.js';
import { useAuth } from '../../context/AuthContext.jsx';

export const HubOperationsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Data states
  const [overview, setOverview] = useState(null);
  const [supplyRequests, setSupplyRequests] = useState([]);
  const [batches, setBatches] = useState([]);
  const [pickQueue, setPickQueue] = useState([]);
  const [dispatchQueue, setDispatchQueue] = useState([]);

  // Modals & form states
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState('approve');
  const [reviewNotes, setReviewNotes] = useState('');

  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [receivingForm, setReceivingForm] = useState({
    receivedQuantity: '',
    acceptedQuantity: '',
    rejectedQuantity: '0',
    rejectionReason: '',
    gradeAssigned: 'Grade A',
    inspectionNotes: '',
    agreedPurchasePricePerUnit: '',
    sellingPricePerUnit: '',
    expiryDays: '7',
    binLocation: 'BAY-A1'
  });

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [adjustForm, setAdjustForm] = useState({
    action: 'adjust_quantity',
    quantityDelta: '',
    reason: ''
  });

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError('');
      const [ovData, reqData, batchData, pickData, dispData] = await Promise.all([
        hubService.getOverview().catch(() => null),
        hubService.getSupplyRequests({ limit: 50 }).catch(() => ({ requests: [] })),
        hubService.getBatches({ limit: 50 }).catch(() => ({ batches: [] })),
        hubService.getPickQueue().catch(() => ({ orders: [] })),
        hubService.getDispatchQueue().catch(() => ({ orders: [] }))
      ]);

      if (ovData?.success) setOverview(ovData);
      if (reqData?.success) setSupplyRequests(reqData.requests || []);
      if (batchData?.success) setBatches(batchData.batches || []);
      if (pickData?.success) setPickQueue(pickData.orders || []);
      if (dispData?.success) setDispatchQueue(dispData.orders || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load Mandi+ Hub operational data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    try {
      await hubService.reviewSupplyRequest(selectedRequest._id, {
        action: reviewAction,
        reviewNotes
      });
      setSuccessMsg(`Supply request #${selectedRequest.requestNumber} ${reviewAction === 'approve' ? 'approved for hub delivery' : 'rejected'}.`);
      setIsReviewModalOpen(false);
      setSelectedRequest(null);
      setReviewNotes('');
      fetchAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Review action failed.');
    }
  };

  const openReceiveModal = (reqItem) => {
    setSelectedRequest(reqItem);
    setReceivingForm({
      receivedQuantity: reqItem.proposedQuantity.toString(),
      acceptedQuantity: reqItem.proposedQuantity.toString(),
      rejectedQuantity: '0',
      rejectionReason: '',
      gradeAssigned: reqItem.qualityGradeProposed || 'Grade A',
      inspectionNotes: 'Passed standard Mandi+ Hub physical inspection.',
      agreedPurchasePricePerUnit: reqItem.proposedPricePerUnit.toString(),
      sellingPricePerUnit: Math.round(reqItem.proposedPricePerUnit * 1.25).toString(),
      expiryDays: '7',
      binLocation: 'BAY-A1'
    });
    setIsReceiveModalOpen(true);
  };

  const handleReceiveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    try {
      await hubService.receiveAndInspectSupply(selectedRequest._id, receivingForm);
      setSuccessMsg(`Produce received and inspected for #${selectedRequest.requestNumber}. Batch created in inventory.`);
      setIsReceiveModalOpen(false);
      setSelectedRequest(null);
      fetchAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Receiving inspection failed.');
    }
  };

  const handleStartPicking = async (orderId) => {
    try {
      await hubService.startPicking(orderId);
      fetchAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not start picking.');
    }
  };

  const handleTogglePickItem = async (order, idx, currentStatus) => {
    try {
      const nextStatus = currentStatus === 'picked' ? 'pending' : 'picked';
      await hubService.updatePickItem(order._id, idx, {
        pickStatus: nextStatus,
        pickedQuantity: nextStatus === 'picked' ? order.items[idx].quantity : 0
      });
      fetchAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update pick item.');
    }
  };

  const handleCompletePicking = async (orderId) => {
    try {
      await hubService.completePicking(orderId);
      setSuccessMsg('Picking completed. Order moved to Packing Workspace.');
      fetchAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete picking.');
    }
  };

  const handleCompletePacking = async (orderId) => {
    try {
      await hubService.completePacking(orderId, { packageCount: 1 });
      setSuccessMsg('Parcel packed and sealed. Order marked Ready for Pickup at Dispatch Bay.');
      fetchAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete packing.');
    }
  };

  const handleHandoverSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      await hubService.handoverOrder(selectedOrder._id, { pickupOtp: enteredOtp });
      setSuccessMsg(`Order #${selectedOrder.orderNumber} package handed over to delivery partner. Order marked Picked Up.`);
      setIsHandoverModalOpen(false);
      setSelectedOrder(null);
      setEnteredOtp('');
      fetchAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Handover verification failed.');
    }
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBatch) return;
    try {
      await hubService.adjustBatch(selectedBatch._id, adjustForm);
      setSuccessMsg(`Batch #${selectedBatch.batchNumber} inventory updated.`);
      setIsAdjustModalOpen(false);
      setSelectedBatch(null);
      fetchAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Batch adjustment failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-6 border border-emerald-700/40">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <Warehouse className="w-3.5 h-3.5 text-emerald-400" />
                Centralized Fulfilment Facility
              </span>
              <span className="bg-amber-400/20 text-amber-200 border border-amber-400/30 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {overview?.hub?.code || 'HUB-PUN-01'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Mandi+ Hub Operations
            </h1>
            <p className="text-emerald-100/90 text-sm mt-1 max-w-2xl">
              {overview?.hub?.name || 'Mandi+ Hub Central (Pune)'} — Farmer Produce Receiving, Batch Grading, Consolidated Picking & Delivery Dispatch.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2 rounded-xl text-xs flex items-center gap-2 border border-white/20 transition-colors shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <div className="bg-emerald-950/60 border border-emerald-600/30 rounded-xl px-4 py-2 text-right">
              <div className="text-[10px] text-emerald-300 font-semibold uppercase">Operating Hours</div>
              <div className="text-xs font-bold text-white">05:00 AM – 11:00 PM</div>
            </div>
          </div>
        </div>

        {/* Global Notifications / Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between text-sm shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between text-sm shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Operational Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Sellable Produce</span>
              <Layers className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {overview?.metrics?.totalSellableProducts ?? '-'}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">
              {overview?.metrics?.totalSellableQuantity ? `${overview.metrics.totalSellableQuantity} kg` : 'Active Stock'}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Pending Supply</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-extrabold text-amber-600">
              {overview?.metrics?.pendingSupplyRequests ?? '-'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Awaiting QC Review</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Inbound Delivery</span>
              <Truck className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-extrabold text-blue-600">
              {overview?.metrics?.expectedIncoming ?? '-'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Approved for Hub</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Orders to Pick</span>
              <ClipboardList className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-extrabold text-indigo-600">
              {overview?.metrics?.ordersAwaitingPick ?? '-'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Consolidated Picks</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Ready for Pickup</span>
              <Box className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-extrabold text-purple-600">
              {overview?.metrics?.ordersReadyForPickup ?? '-'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Packed at Dispatch Bay</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Active Transit</span>
              <TrendingUp className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-extrabold text-teal-600">
              {overview?.metrics?.activeDeliveries ?? '-'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Out for Customer Delivery</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 space-x-1 sm:space-x-4 overflow-x-auto bg-white p-2 rounded-xl shadow-sm">
          {[
            { id: 'overview', label: 'Hub Overview', icon: Warehouse, count: null },
            { id: 'receiving', label: 'Supply Receiving & QC', icon: ShieldCheck, count: supplyRequests.length },
            { id: 'inventory', label: 'Batch Inventory', icon: Layers, count: batches.length },
            { id: 'picking', label: 'Pick & Pack Workspace', icon: ClipboardList, count: pickQueue.length },
            { id: 'dispatch', label: 'Dispatch & Handover Bay', icon: Truck, count: dispatchQueue.length }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-emerald-950 text-emerald-200' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Quick Workflow Guide */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-emerald-600" />
                Mandi+ Hub Centralized Fulfilment Architecture
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm mb-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center">1</span>
                    Farmer Supply Inbound
                  </div>
                  <p className="text-xs text-slate-600">
                    Farmers submit produce requests. Hub staff approves, performs physical arrival check, assigns quality grade (A/B/C/FAQ), and logs auditable inventory batches.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-100">
                  <div className="flex items-center gap-2 font-bold text-teal-900 text-sm mb-1">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-xs flex items-center justify-center">2</span>
                    Hub Traceable Storage
                  </div>
                  <p className="text-xs text-slate-600">
                    Produce batches store source farmer, purchase cost, and harvest date. Catalog stock dynamically aggregates accepted sellable batches with zero negative inventory.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100">
                  <div className="flex items-center gap-2 font-bold text-indigo-900 text-sm mb-1">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">3</span>
                    Consolidated Order & Picking
                  </div>
                  <p className="text-xs text-slate-600">
                    A buyer orders tomatoes (Farmer A), onions (Farmer B), and potatoes (Farmer C) in one cart. The hub reserves batches and generates a single pick list.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100">
                  <div className="flex items-center gap-2 font-bold text-purple-900 text-sm mb-1">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center">4</span>
                    Single Pickup & Delivery
                  </div>
                  <p className="text-xs text-slate-600">
                    The delivery partner visits Mandi+ Hub once to collect the consolidated packed parcel via pickup OTP verification, and delivers directly to the buyer.
                  </p>
                </div>
              </div>

              {/* Hub Location & Facilities */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Facility Address:</strong> {overview?.hub?.address?.street}, {overview?.hub?.address?.locality}, {overview?.hub?.address?.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Hub Dispatch Bay:</strong> {overview?.hub?.phone || '+91-1800-MANDI-HUB'}</span>
                </div>
              </div>
            </div>

            {/* Hub Quick Action Center */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Quick Actions</h3>

              <button
                onClick={() => setActiveTab('receiving')}
                className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">Receive & Inspect Inbound Supply</div>
                  <div className="text-[11px] text-slate-500">Record physical arrival and QC grading</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
              </button>

              <button
                onClick={() => setActiveTab('picking')}
                className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-700">Open Pick & Pack Workspace</div>
                  <div className="text-[11px] text-slate-500">{pickQueue.length} order(s) waiting for pick/pack</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
              </button>

              <button
                onClick={() => setActiveTab('dispatch')}
                className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-purple-700">Dispatch Bay & OTP Handover</div>
                  <div className="text-[11px] text-slate-500">{dispatchQueue.length} order(s) ready for partner handover</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
              </button>

              <button
                onClick={() => setActiveTab('inventory')}
                className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-amber-700">Inventory Batch Audit & FEFO</div>
                  <div className="text-[11px] text-slate-500">{batches.length} active traceable produce batches</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: SUPPLY RECEIVING & QC */}
        {activeTab === 'receiving' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Farmer Produce Supply Inbound Queue</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inspect incoming shipments, record physical arrival, assign quality grade, and accept sellable batches into Mandi+ Hub.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5">Request #</th>
                    <th className="px-6 py-3.5">Farmer</th>
                    <th className="px-6 py-3.5">Produce Item</th>
                    <th className="px-6 py-3.5">Proposed Qty</th>
                    <th className="px-6 py-3.5">Price / Unit</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {supplyRequests.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                        No supply requests found. Approved farmers will submit produce deliveries here.
                      </td>
                    </tr>
                  ) : (
                    supplyRequests.map((reqItem) => {
                      const isPendingReview = ['submitted', 'under_review'].includes(reqItem.status);
                      const isApprovedForDelivery = reqItem.status === 'approved_for_delivery';
                      const isProcessed = ['accepted', 'partially_accepted', 'rejected'].includes(reqItem.status);

                      return (
                        <tr key={reqItem._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-slate-800">
                            {reqItem.requestNumber}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{reqItem.farmerName}</div>
                            <div className="text-[10px] text-slate-400">{reqItem.farmerPhone || 'Verified Partner'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-800">{reqItem.produceName}</div>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                              {reqItem.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-900">
                            {reqItem.proposedQuantity} {reqItem.unit}
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-700">
                            ₹{reqItem.proposedPricePerUnit} / {reqItem.unit}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                              reqItem.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                              reqItem.status === 'partially_accepted' ? 'bg-teal-100 text-teal-800' :
                              reqItem.status === 'approved_for_delivery' ? 'bg-blue-100 text-blue-800' :
                              reqItem.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {reqItem.status.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            {isPendingReview && (
                              <button
                                onClick={() => {
                                  setSelectedRequest(reqItem);
                                  setReviewAction('approve');
                                  setIsReviewModalOpen(true);
                                }}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] shadow-sm transition-colors"
                              >
                                Review Request
                              </button>
                            )}

                            {isApprovedForDelivery && (
                              <button
                                onClick={() => openReceiveModal(reqItem)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] shadow-sm transition-colors"
                              >
                                Record Physical QC
                              </button>
                            )}

                            {isProcessed && (
                              <span className="text-[11px] text-slate-400 font-semibold">
                                {reqItem.receiving?.acceptedQuantity ? `Batch: ${reqItem.receiving.batchNumber || 'Created'}` : 'Completed'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: INVENTORY BATCHES */}
        {activeTab === 'inventory' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Mandi+ Hub Traceable Batch Inventory</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Batch-level inventory preserving source farmer, lot number, remaining quantity, reserved quantities, and quality grade.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5">Batch / Lot #</th>
                    <th className="px-6 py-3.5">Produce Item</th>
                    <th className="px-6 py-3.5">Source Farmer</th>
                    <th className="px-6 py-3.5">Grade</th>
                    <th className="px-6 py-3.5">Remaining Stock</th>
                    <th className="px-6 py-3.5">Reserved</th>
                    <th className="px-6 py-3.5">Bin Location</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batches.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center text-slate-400">
                        No active inventory batches. Received farmer shipments will populate here.
                      </td>
                    </tr>
                  ) : (
                    batches.map((batch) => {
                      const available = Math.max(0, (batch.remainingQuantity || 0) - (batch.reservedQuantity || 0));
                      return (
                        <tr key={batch._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-slate-900">
                            {batch.batchNumber}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-800">
                            {batch.product?.name || 'Produce Item'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900">{batch.farmerName}</div>
                            <div className="text-[10px] text-slate-400">{batch.sourceFarmer?.locality || 'Verified Farm'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px]">
                              {batch.qualityGrade || 'Grade A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-900">
                            {batch.remainingQuantity} {batch.unit}
                            <span className="block text-[10px] text-emerald-600 font-semibold">
                              ({available} {batch.unit} available)
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-amber-600">
                            {batch.reservedQuantity || 0} {batch.unit}
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-600">
                            {batch.binLocation || 'BAY-A1'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              batch.qualityStatus === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                              batch.qualityStatus === 'quarantined' ? 'bg-red-100 text-red-800' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {batch.qualityStatus.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedBatch(batch);
                                setAdjustForm({ action: 'adjust_quantity', quantityDelta: '0', reason: '' });
                                setIsAdjustModalOpen(true);
                              }}
                              className="text-slate-600 hover:text-slate-900 font-bold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[11px] transition-colors"
                            >
                              Adjust / Quarantine
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: PICK & PACK WORKSPACE */}
        {activeTab === 'picking' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Consolidated Order Pick & Pack Workspace</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Consolidated pick lists across multiple source farmers. All items are picked together and sealed into a single parcel.
                </p>
              </div>
            </div>

            {pickQueue.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200/80 shadow-sm">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
                <div className="font-bold text-slate-800">No orders awaiting picking or packing</div>
                <div className="text-xs text-slate-500 mt-1">All incoming customer orders have been processed.</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {pickQueue.map((order) => {
                  const isPicking = order.status === 'picking';
                  const isPacking = order.status === 'packing';
                  const isConfirmed = order.status === 'confirmed' || order.status === 'processing_hub';
                  const allPicked = order.items.every(i => i.pickStatus === 'picked');

                  return (
                    <div key={order._id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                      <div className="p-4 sm:p-6 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 text-base">#{order.orderNumber}</span>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                              isPacking ? 'bg-purple-100 text-purple-800' :
                              isPicking ? 'bg-indigo-100 text-indigo-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {order.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Customer: <strong>{order.buyerName}</strong> • {order.shippingAddress?.locality}, {order.shippingAddress?.city}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {isConfirmed && (
                            <button
                              onClick={() => handleStartPicking(order._id)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition-colors"
                            >
                              Start Picking
                            </button>
                          )}

                          {isPicking && (
                            <button
                              onClick={() => handleCompletePicking(order._id)}
                              className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition-colors"
                            >
                              Complete Pick → Go to Packing
                            </button>
                          )}

                          {isPacking && (
                            <button
                              onClick={() => handleCompletePacking(order._id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition-colors"
                            >
                              Seal Parcel → Mark Ready for Pickup
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Pick Checklist */}
                      <div className="p-4 sm:p-6">
                        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                          Consolidated Item Pick List ({order.items.length} Products):
                        </div>
                        <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                          {order.items.map((item, idx) => {
                            const isItemPicked = item.pickStatus === 'picked';
                            return (
                              <div
                                key={idx}
                                className={`p-4 flex items-center justify-between text-xs transition-colors ${
                                  isItemPicked ? 'bg-emerald-50/40' : 'hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  {isPicking ? (
                                    <button
                                      onClick={() => handleTogglePickItem(order, idx, item.pickStatus)}
                                      className="p-1 text-slate-400 hover:text-emerald-600 transition-colors"
                                    >
                                      {isItemPicked ? (
                                        <CheckSquare className="w-5 h-5 text-emerald-600" />
                                      ) : (
                                        <Square className="w-5 h-5 text-slate-400" />
                                      )}
                                    </button>
                                  ) : (
                                    <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                                      {idx + 1}
                                    </div>
                                  )}

                                  <div>
                                    <div className="font-bold text-slate-900 text-sm">{item.name}</div>
                                    <div className="text-[11px] text-slate-500">
                                      Required: <strong>{item.quantity} {item.unit}</strong> • Source: {item.allocatedBatches?.[0]?.farmerName || 'Partner Farmer'} (Lot: {item.allocatedBatches?.[0]?.batchNumber || 'BAY-A1'})
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    isItemPicked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                                  }`}>
                                    {isItemPicked ? 'PICKED' : 'PENDING'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: DISPATCH BAY & HANDOVER */}
        {activeTab === 'dispatch' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Mandi+ Hub Dispatch Bay & Delivery Handover</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Orders packed and ready for collection. Hand over parcel to delivery partner and verify pickup OTP.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5">Order #</th>
                    <th className="px-6 py-3.5">Customer & Destination</th>
                    <th className="px-6 py-3.5">Parcels</th>
                    <th className="px-6 py-3.5">Assigned Partner</th>
                    <th className="px-6 py-3.5">Pickup Verification OTP</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dispatchQueue.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                        No orders waiting at the dispatch bay.
                      </td>
                    </tr>
                  ) : (
                    dispatchQueue.map((order) => {
                      return (
                        <tr key={order._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-slate-900">
                            #{order.orderNumber}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{order.buyerName}</div>
                            <div className="text-[10px] text-slate-500">
                              {order.shippingAddress?.locality}, {order.shippingAddress?.city}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-800">
                            {order.packing?.packageCount || 1} parcel(s)
                          </td>
                          <td className="px-6 py-4">
                            {order.deliveryPartner ? (
                              <div>
                                <div className="font-bold text-slate-900">{order.deliveryPartner.name}</div>
                                <div className="text-[10px] text-slate-400">{order.deliveryPartner.phone || 'Verified'}</div>
                              </div>
                            ) : (
                              <span className="text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded text-[10px]">
                                Awaiting Partner Claim
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-indigo-700 bg-indigo-50/50">
                            {order.pickupOtp || '4829'}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                              READY FOR PICKUP
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setEnteredOtp(order.pickupOtp || '');
                                setIsHandoverModalOpen(true);
                              }}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] shadow-sm transition-colors"
                            >
                              Verify Handover
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* MODAL: REVIEW SUPPLY REQUEST */}
      {isReviewModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Review Supply Request</h3>
            <p className="text-xs text-slate-500">
              Request <strong>#{selectedRequest.requestNumber}</strong> for <strong>{selectedRequest.proposedQuantity} {selectedRequest.unit} {selectedRequest.produceName}</strong> from {selectedRequest.farmerName}.
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Action</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewAction('approve')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                      reviewAction === 'approve'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Approve for Hub Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewAction('reject')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                      reviewAction === 'reject'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Reject Request
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Review Notes</label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="e.g. Approved for delivery to Bay 2 tomorrow before 9 AM."
                  rows="3"
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md"
                >
                  Submit Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PHYSICAL RECEIVING & QC */}
      {isReceiveModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-8">
            <h3 className="text-lg font-bold text-slate-900">Physical Inbound & Quality Inspection</h3>
            <p className="text-xs text-slate-500">
              Receiving shipment for <strong>#{selectedRequest.requestNumber}</strong> ({selectedRequest.produceName}) from {selectedRequest.farmerName}.
            </p>

            <form onSubmit={handleReceiveSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Received Qty ({selectedRequest.unit})</label>
                  <input
                    type="number"
                    required
                    value={receivingForm.receivedQuantity}
                    onChange={(e) => setReceivingForm({ ...receivingForm, receivedQuantity: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Accepted Qty ({selectedRequest.unit})</label>
                  <input
                    type="number"
                    required
                    value={receivingForm.acceptedQuantity}
                    onChange={(e) => setReceivingForm({ ...receivingForm, acceptedQuantity: e.target.value })}
                    className="w-full text-xs border border-emerald-300 bg-emerald-50/50 rounded-xl p-2.5 font-bold text-emerald-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rejected Qty ({selectedRequest.unit})</label>
                  <input
                    type="number"
                    value={receivingForm.rejectedQuantity}
                    onChange={(e) => setReceivingForm({ ...receivingForm, rejectedQuantity: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Grade</label>
                  <select
                    value={receivingForm.gradeAssigned}
                    onChange={(e) => setReceivingForm({ ...receivingForm, gradeAssigned: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 font-semibold bg-white"
                  >
                    <option value="Grade A">Grade A (Premium)</option>
                    <option value="Grade B">Grade B (Standard)</option>
                    <option value="Grade C">Grade C (Commercial)</option>
                    <option value="FAQ">FAQ (Fair Average Quality)</option>
                  </select>
                </div>
              </div>

              {Number(receivingForm.rejectedQuantity) > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rejection Reason</label>
                  <input
                    type="text"
                    value={receivingForm.rejectionReason}
                    onChange={(e) => setReceivingForm({ ...receivingForm, rejectionReason: e.target.value })}
                    placeholder="e.g. Bruised in transport, pest damage"
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Agreed Farmer Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={receivingForm.agreedPurchasePricePerUnit}
                    onChange={(e) => setReceivingForm({ ...receivingForm, agreedPurchasePricePerUnit: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={receivingForm.sellingPricePerUnit}
                    onChange={(e) => setReceivingForm({ ...receivingForm, sellingPricePerUnit: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Shelf Life (Days)</label>
                  <input
                    type="number"
                    value={receivingForm.expiryDays}
                    onChange={(e) => setReceivingForm({ ...receivingForm, expiryDays: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bin Location</label>
                  <input
                    type="text"
                    value={receivingForm.binLocation}
                    onChange={(e) => setReceivingForm({ ...receivingForm, binLocation: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Inspection Notes</label>
                <textarea
                  value={receivingForm.inspectionNotes}
                  onChange={(e) => setReceivingForm({ ...receivingForm, inspectionNotes: e.target.value })}
                  rows="2"
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReceiveModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
                >
                  Complete QC & Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VERIFY HANDOVER */}
      {isHandoverModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Dispatch Handover Verification</h3>
            <p className="text-xs text-slate-500">
              Order <strong>#{selectedOrder.orderNumber}</strong> for {selectedOrder.buyerName}.
            </p>

            <form onSubmit={handleHandoverSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pickup Verification OTP</label>
                <input
                  type="text"
                  required
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  placeholder="Enter 4-digit OTP"
                  className="w-full text-center tracking-widest font-mono text-lg font-extrabold border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block text-center">
                  Matched with OTP on delivery partner's handheld device.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsHandoverModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md"
                >
                  Confirm Handover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADJUST BATCH */}
      {isAdjustModalOpen && selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Adjust Batch Stock</h3>
            <p className="text-xs text-slate-500">
              Batch <strong>#{selectedBatch.batchNumber}</strong> ({selectedBatch.product?.name}). Current Stock: <strong>{selectedBatch.remainingQuantity} {selectedBatch.unit}</strong>.
            </p>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Action</label>
                <select
                  value={adjustForm.action}
                  onChange={(e) => setAdjustForm({ ...adjustForm, action: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 font-semibold bg-white"
                >
                  <option value="adjust_quantity">Adjust Quantity Delta (+/-)</option>
                  <option value="quarantine">Quarantine Batch (Stop Sale)</option>
                </select>
              </div>

              {adjustForm.action === 'adjust_quantity' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantity Delta (+ or -)</label>
                  <input
                    type="number"
                    required
                    value={adjustForm.quantityDelta}
                    onChange={(e) => setAdjustForm({ ...adjustForm, quantityDelta: e.target.value })}
                    placeholder="e.g. -5 for spoilage, +10 for recount"
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 font-semibold"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mandatory Audit Reason</label>
                <input
                  type="text"
                  required
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  placeholder="e.g. Physical inventory recount at Bay A1"
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md"
                >
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
