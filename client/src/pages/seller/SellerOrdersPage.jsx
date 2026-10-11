import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, CheckCircle2, RefreshCw, Truck, MapPin } from 'lucide-react';
import { sellerService } from '../../services/sellerService.js';

export const SellerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await sellerService.getOrders({
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

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await sellerService.updateOrderStatus(orderId, newStatus);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order status.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 mb-6">
        <div>
          <h1 className="text-2xl font-black text-mandi-navy">Farmer Fulfillment Orders</h1>
          <p className="text-xs text-mandi-muted">Fulfill incoming wholesale orders and dispatch to APMC carriers</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          {['all', 'pending', 'confirmed', 'preparing', 'ready_for_pickup', 'delivered'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-mandi-green text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-mandi-green" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm max-w-md mx-auto">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-sm text-mandi-navy mb-1">No orders found</h3>
          <p className="text-xs text-mandi-muted">No orders match the selected status filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-gray-100 text-xs">
                <div>
                  <span className="font-bold text-mandi-navy text-sm">#{order.orderNumber}</span>
                  <span className="text-gray-400 ml-2">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="bg-blue-100 text-mandi-blue font-bold px-2.5 py-0.5 rounded text-[10px] uppercase">
                    {order.status.replace(/_/g, ' ')}
                  </span>
                  <span className="font-black text-sm text-mandi-navy">
                    Farmer Total: ₹{(order.sellerItemTotal || order.totalAmount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div className="divide-y divide-gray-100 text-xs">
                {(order.sellerItems || order.items).map((item, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between">
                    <div>
                      <strong className="text-gray-800">{item.name}</strong>
                      <span className="text-gray-400 ml-2">Qty: {item.quantity} {item.unit}</span>
                    </div>
                    <span className="font-bold text-gray-800">₹{item.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>

              {/* Address & Controls */}
              <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-gray-500">
                  <MapPin className="w-3.5 h-3.5 text-mandi-blue shrink-0" />
                  <span>Deliver to: {order.shippingAddress?.fullName} ({order.shippingAddress?.locality}, {order.shippingAddress?.city})</span>
                </div>

                {/* Status Transitions */}
                <div className="flex items-center gap-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus(order._id, 'confirmed')}
                      className="bg-mandi-blue hover:bg-mandi-blue-dark text-white font-bold py-1.5 px-3.5 rounded-lg text-xs"
                    >
                      Confirm Order
                    </button>
                  )}

                  {order.status === 'confirmed' && (
                    <button
                      onClick={() => handleUpdateStatus(order._id, 'preparing')}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-1.5 px-3.5 rounded-lg text-xs"
                    >
                      Mark Harvesting & Packing
                    </button>
                  )}

                  {order.status === 'preparing' && (
                    <button
                      onClick={() => handleUpdateStatus(order._id, 'ready_for_pickup')}
                      className="bg-mandi-green hover:bg-mandi-green-dark text-white font-bold py-1.5 px-3.5 rounded-lg text-xs"
                    >
                      Ready for Pickup at Farm Gate
                    </button>
                  )}

                  <Link
                    to={`/orders/${order._id}`}
                    className="p-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 text-xs"
                  >
                    Track
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
