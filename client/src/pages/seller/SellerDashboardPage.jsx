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
  Sparkles
} from 'lucide-react';
import { sellerService } from '../../services/sellerService.js';
import { ProduceGradingModal } from '../../components/ProduceGradingModal.jsx';

export const SellerDashboardPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gradingModalOpen, setGradingModalOpen] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await sellerService.getDashboard();
      if (res.success) {
        setMetrics(res.metrics);
        setRecentOrders(res.recentOrders || []);
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

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await sellerService.updateOrderStatus(orderId, newStatus);
      fetchDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-mandi-green" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">

      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 mb-6">
        <div>
          <h1 className="text-2xl font-black text-mandi-navy flex items-center gap-2">
            <Store className="w-6 h-6 text-mandi-green" />
            <span>Farmer & Supplier Command Center</span>
          </h1>
          <p className="text-xs text-mandi-muted mt-0.5">
            Manage harvest inventory, fulfill incoming buyer orders, and track APMC payout settlements
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
            <span>Add New Produce Listing</span>
          </Link>
        </div>
      </div>

      {/* ---------------- METRICS OVERVIEW CARDS ---------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-gray-400 font-semibold text-[11px] uppercase tracking-wider block">Active Listings</span>
            <span className="text-2xl font-black text-mandi-navy">{metrics?.activeProducts || 0}</span>
            <span className="text-[11px] text-gray-500 block mt-0.5">{metrics?.totalProducts || 0} total registered</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-mandi-blue flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-gray-400 font-semibold text-[11px] uppercase tracking-wider block">Incoming Orders</span>
            <span className="text-2xl font-black text-amber-600">{metrics?.incomingOrders || 0}</span>
            <span className="text-[11px] text-gray-500 block mt-0.5">{metrics?.pendingFulfillment || 0} in preparation</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-gray-400 font-semibold text-[11px] uppercase tracking-wider block">Total Gross Sales</span>
            <span className="text-2xl font-black text-emerald-800">₹{(metrics?.totalGrossSales || 0).toLocaleString('en-IN')}</span>
            <span className="text-[11px] text-emerald-600 block mt-0.5">₹{(metrics?.completedSales || 0).toLocaleString('en-IN')} settled</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-mandi-green flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-gray-400 font-semibold text-[11px] uppercase tracking-wider block">Low Stock Alerts</span>
            <span className="text-2xl font-black text-red-600">{metrics?.lowStockProducts || 0}</span>
            <span className="text-[11px] text-gray-400 block mt-0.5">Under 20 units remaining</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ---------------- ORDER FULFILLMENT QUEUE ---------------- */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-8">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
          <div>
            <h3 className="font-bold text-base text-mandi-navy">Incoming Harvest Orders Queue</h3>
            <p className="text-xs text-mandi-muted">Orders requiring farmer confirmation and dispatch packing</p>
          </div>
          <Link to="/seller/orders" className="text-xs font-bold text-mandi-blue hover:underline">
            View All Seller Orders →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-xs text-gray-400 py-6 text-center">No pending orders. Produce is listed live in the marketplace!</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentOrders.map((order) => (
              <div key={order._id} className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-mandi-navy">#{order.orderNumber}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-mandi-blue'
                    }`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-gray-600 mt-1">
                    Customer: <strong>{order.buyerName}</strong> • {order.shippingAddress?.locality}, {order.shippingAddress?.city}
                  </div>
                  <div className="text-gray-500 text-[11px]">
                    Placed: {new Date(order.createdAt).toLocaleDateString('en-IN')}
                  </div>
                </div>

                {/* Status action buttons */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus(order._id, 'confirmed')}
                      className="bg-mandi-blue hover:bg-mandi-blue-dark text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-colors"
                    >
                      Confirm Order
                    </button>
                  )}

                  {order.status === 'confirmed' && (
                    <button
                      onClick={() => handleUpdateStatus(order._id, 'preparing')}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-colors"
                    >
                      Mark as Harvesting & Packing
                    </button>
                  )}

                  {order.status === 'preparing' && (
                    <button
                      onClick={() => handleUpdateStatus(order._id, 'ready_for_pickup')}
                      className="bg-mandi-green hover:bg-mandi-green-dark text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-colors"
                    >
                      Ready for Pickup at Farm Gate
                    </button>
                  )}

                  <Link
                    to={`/orders/${order._id}`}
                    className="p-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 text-xs"
                    title="View Details"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Produce Quality Modal */}
      <ProduceGradingModal isOpen={gradingModalOpen} onClose={() => setGradingModalOpen(false)} />
    </div>
  );
};
