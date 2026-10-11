import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Search, ChevronRight, Truck, RefreshCw } from 'lucide-react';
import { orderService } from '../services/orderService.js';

export const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderService.getMyOrders({
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      if (res.success) {
        setOrders(res.orders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const filteredOrders = orders.filter(o => {
    if (!searchQuery.trim()) return true;
    return o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.items.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded text-[10px] uppercase">Delivered</span>;
      case 'out_for_delivery':
      case 'picked_up':
        return <span className="bg-blue-100 text-mandi-blue font-bold px-2.5 py-0.5 rounded text-[10px] uppercase">Out for Delivery</span>;
      case 'ready_for_pickup':
      case 'preparing':
        return <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded text-[10px] uppercase">Preparing</span>;
      case 'cancelled':
        return <span className="bg-red-100 text-red-700 font-bold px-2.5 py-0.5 rounded text-[10px] uppercase">Cancelled</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 font-bold px-2.5 py-0.5 rounded text-[10px] uppercase">Pending</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-mandi-navy">My Orders & Tracking</h1>
          <p className="text-xs text-mandi-muted">Review past procurement orders, status timelines, and delivery receipts</p>
        </div>

        {/* Search by Order Number or Produce Name */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search order or crop..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-mandi-blue focus:outline-none"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2" />
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar text-xs">
        {['all', 'pending', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors capitalize ${
              statusFilter === st
                ? 'bg-mandi-blue text-white shadow-xs'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {st.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <RefreshCw className="w-7 h-7 animate-spin text-mandi-blue" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-sm text-mandi-navy mb-1">No orders found</h3>
          <p className="text-xs text-mandi-muted mb-4">You have no orders matching the selected filter criteria.</p>
          <Link to="/products" className="bg-mandi-blue text-white text-xs font-bold px-5 py-2 rounded-lg">
            Shop Fresh Produce
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:border-gray-300 transition-all"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-gray-100 text-xs">
                <div>
                  <span className="font-bold text-mandi-navy text-sm">#{order.orderNumber}</span>
                  <span className="text-gray-400 ml-2">
                    Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(order.status)}
                  <span className="font-black text-sm text-mandi-navy">
                    ₹{order.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Items in Order */}
              <div className="py-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-gray-50/60 p-2 rounded-xl border border-gray-100">
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=150&q=80'}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0"
                    />
                    <div className="truncate">
                      <div className="font-bold text-gray-800 truncate">{item.name}</div>
                      <div className="text-[11px] text-gray-500">
                        {item.quantity} {item.unit} • ₹{item.unitPrice}/{item.unit}
                      </div>
                      <div className="text-[10px] text-mandi-blue font-semibold">
                        Farmer: {item.sellerName}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Toolbar */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500 text-[11px]">
                  Delivering to: <strong>{order.shippingAddress.locality}, {order.shippingAddress.city}</strong>
                </span>

                <Link
                  to={`/orders/${order._id}`}
                  className="bg-blue-50 hover:bg-mandi-blue hover:text-white text-mandi-blue font-bold px-4 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>View Timeline & Details</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
