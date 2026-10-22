import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  DollarSign,
  Plus,
  Store,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Warehouse,
  ShieldCheck,
  Layers,
  Truck
} from 'lucide-react';
import { sellerService } from '../../services/sellerService.js';
import { farmerSupplyService } from '../../services/farmerSupplyService.js';
import { ProduceGradingModal } from '../../components/ProduceGradingModal.jsx';

export const SellerDashboardPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [activeBatches, setActiveBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gradingModalOpen, setGradingModalOpen] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await sellerService.getDashboard();
      if (res.success) {
        setMetrics(res.metrics);
        setRecentRequests(res.recentRequests || []);
        setActiveBatches(res.activeBatches || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-mandi-green" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in font-sans">

      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <Warehouse className="w-3 h-3 text-emerald-700" />
              Mandi+ Hub Supplier Portal
            </span>
          </div>
          <h1 className="text-2xl font-black text-mandi-navy flex items-center gap-2">
            <Store className="w-6 h-6 text-mandi-green" />
            <span>Farmer Produce Supply & Settlement Center</span>
          </h1>
          <p className="text-xs text-mandi-muted mt-0.5">
            Submit harvest supplies to Mandi+ Hub, monitor QC inspection grading, and track batch settlement earnings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setGradingModalOpen(true)}
            className="bg-emerald-50 hover:bg-emerald-100 text-mandi-green font-bold text-xs py-2 px-3.5 rounded-xl border border-emerald-200 flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>AI Produce Quality Inspector</span>
          </button>

          <Link
            to="/seller/products"
            className="bg-mandi-green hover:bg-mandi-green-dark text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Produce to Hub</span>
          </Link>
        </div>
      </div>

      {/* Mandi+ Hub Quick-Commerce Model Explainer Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 rounded-2xl p-5 mb-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-emerald-950">
              Centralized Mandi+ Hub Fulfilment Model Active
            </h3>
            <p className="text-xs text-emerald-900/80 mt-0.5 max-w-3xl leading-relaxed">
              You do not need to dispatch individual customer delivery orders to retail buyers. You supply verified produce directly to <strong>Mandi+ Hub</strong>. The hub quality-checks, stores, consolidates orders, and coordinates delivery partner pickup.
            </p>
          </div>
        </div>

        <Link
          to="/seller/earnings"
          className="bg-white hover:bg-emerald-100/50 text-emerald-900 border border-emerald-300 font-bold text-xs px-4 py-2 rounded-xl shrink-0 transition-colors shadow-xs"
        >
          View Settlement Records →
        </Link>
      </div>

      {/* METRICS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-gray-400 font-semibold text-[11px] uppercase tracking-wider block">Supplies Submitted</span>
            <span className="text-2xl font-black text-mandi-navy">{metrics?.totalSuppliesSubmitted ?? metrics?.totalProducts ?? 0}</span>
            <span className="text-[11px] text-gray-500 block mt-0.5">{metrics?.acceptedSupplies || 0} accepted into hub</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-mandi-blue flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-gray-400 font-semibold text-[11px] uppercase tracking-wider block">Hub Active Batches</span>
            <span className="text-2xl font-black text-emerald-700">{metrics?.activeBatchesInHub || metrics?.activeProducts || 0}</span>
            <span className="text-[11px] text-emerald-600 block mt-0.5">{metrics?.totalAcceptedQuantity || 0} kg accepted stock</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-gray-400 font-semibold text-[11px] uppercase tracking-wider block">Total Produce Earnings</span>
            <span className="text-2xl font-black text-slate-900">₹{(metrics?.totalGrossSales || 0).toLocaleString('en-IN')}</span>
            <span className="text-[11px] text-emerald-600 block mt-0.5">₹{(metrics?.completedSales || 0).toLocaleString('en-IN')} settled payouts</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-gray-400 font-semibold text-[11px] uppercase tracking-wider block">Pending Settlement</span>
            <span className="text-2xl font-black text-amber-600">₹{(metrics?.pendingSettlement || 0).toLocaleString('en-IN')}</span>
            <span className="text-[11px] text-gray-500 block mt-0.5">{metrics?.pendingReviews || 0} supply review(s)</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* RECENT PRODUCE SUPPLY REQUESTS */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-8">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
          <div>
            <h3 className="font-bold text-base text-mandi-navy">Recent Produce Deliveries to Mandi+ Hub</h3>
            <p className="text-xs text-mandi-muted">Inbound supply shipments, QC grading results, and accepted lot quantities</p>
          </div>
          <Link to="/seller/products" className="text-xs font-bold text-mandi-blue hover:underline">
            View All Supply Submissions →
          </Link>
        </div>

        {recentRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-xs">
            No supply submissions yet. Click "Submit Produce to Hub" to offer your harvest.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentRequests.map((reqItem) => (
              <div key={reqItem._id} className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-mandi-navy">#{reqItem.requestNumber}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      reqItem.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                      reqItem.status === 'partially_accepted' ? 'bg-teal-100 text-teal-800' :
                      reqItem.status === 'approved_for_delivery' ? 'bg-blue-100 text-blue-800' :
                      reqItem.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {reqItem.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-gray-700 font-semibold mt-1">
                    {reqItem.produceName} • Proposed: {reqItem.proposedQuantity} {reqItem.unit} @ ₹{reqItem.proposedPricePerUnit}/{reqItem.unit}
                  </div>
                  {reqItem.receiving?.acceptedQuantity ? (
                    <div className="text-emerald-700 font-medium text-[11px] mt-0.5">
                      ✅ Accepted at Hub: {reqItem.receiving.acceptedQuantity} {reqItem.unit} ({reqItem.receiving.gradeAssigned || 'Grade A'}) • Batch: {reqItem.receiving.batchNumber}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-[11px] mt-0.5">
                      Target Hub: {reqItem.hubName || 'Mandi+ Hub Central'}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-mono font-bold text-sm text-mandi-navy">
                      ₹{((reqItem.receiving?.acceptedQuantity || reqItem.proposedQuantity) * (reqItem.receiving?.agreedPurchasePricePerUnit || reqItem.proposedPricePerUnit)).toLocaleString('en-IN')}
                    </span>
                    <span className="block text-[10px] text-gray-400">Total Value</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Produce Grading AI Modal */}
      {gradingModalOpen && (
        <ProduceGradingModal
          isOpen={gradingModalOpen}
          onClose={() => setGradingModalOpen(false)}
          onGradeAssigned={(result) => {
            alert(`AI Inspection Complete: Graded ${result.qualityGrade} (${result.confidence * 100}% confidence).`);
            setGradingModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
