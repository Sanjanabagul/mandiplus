import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight, Truck, Calendar, MapPin } from 'lucide-react';
import { orderService } from '../services/orderService.js';

export const OrderConfirmationPage = () => {
  const params = useParams();
  const orderId = params.id || params.orderId;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
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

    loadOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-mandi-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-mandi-navy mb-2">Order Not Found</h2>
        <Link to="/orders" className="text-xs font-bold text-mandi-blue hover:underline">
          View My Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-emerald-100 text-mandi-green flex items-center justify-center mx-auto mb-4 shadow-sm">
        <CheckCircle2 className="w-12 h-12" />
      </div>

      <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
        Order Confirmed
      </span>

      <h1 className="text-2xl sm:text-3xl font-black text-mandi-navy mt-3 mb-1">
        Thank You for Your Order!
      </h1>

      <p className="text-xs text-mandi-muted max-w-md mx-auto mb-6">
        Your produce order <strong className="text-gray-800">#{order.orderNumber}</strong> has been received by the regional farmers and is being prepared for dispatch.
      </p>

      {/* Summary Box */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm text-left mb-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 text-xs">
          <div>
            <span className="text-gray-400 block text-[10px]">Order Number</span>
            <span className="font-bold text-mandi-navy text-sm">#{order.orderNumber}</span>
          </div>

          <div className="text-right">
            <span className="text-gray-400 block text-[10px]">Payment Method</span>
            <span className="font-bold text-gray-800 uppercase">
              {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Simulated Digital'}
            </span>
          </div>
        </div>

        {/* Destination & Estimated Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
            <div className="flex items-center gap-1.5 text-gray-400 font-bold text-[10px] uppercase mb-1">
              <MapPin className="w-3.5 h-3.5 text-mandi-blue" /> Delivery Address
            </div>
            <div className="font-bold text-gray-800">{order.shippingAddress.fullName}</div>
            <div className="text-gray-600 text-[11px]">
              {order.shippingAddress.streetAddress}, {order.shippingAddress.locality}, {order.shippingAddress.city} - {order.shippingAddress.pincode}
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
            <div className="flex items-center gap-1.5 text-gray-400 font-bold text-[10px] uppercase mb-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Estimated Delivery
            </div>
            <div className="font-bold text-emerald-800">Within 24 to 48 Hours</div>
            <div className="text-gray-500 text-[11px]">Farm Gate Scheduled Dispatch</div>
          </div>
        </div>

        {/* Items Brief */}
        <div className="pt-2">
          <h4 className="text-xs font-bold text-gray-700 mb-2">Produce Ordered:</h4>
          <div className="divide-y divide-gray-100 text-xs">
            {order.items.map((i, idx) => (
              <div key={idx} className="py-2 flex justify-between items-center">
                <span>{i.name} ({i.quantity} {i.unit})</span>
                <span className="font-bold text-gray-800">₹{i.subtotal.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-gray-200 flex justify-between font-black text-sm text-mandi-navy">
            <span>Total Amount Paid / Payable</span>
            <span>₹{order.totalAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to={`/orders/${order._id}`}
          className="w-full sm:w-auto bg-mandi-blue hover:bg-mandi-blue-dark text-white font-bold py-3 px-8 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
        >
          <Truck className="w-4 h-4" />
          <span>Track Live Order Status</span>
        </Link>

        <Link
          to="/products"
          className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-8 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
        >
          <span>Continue Shopping</span>
        </Link>
      </div>
    </div>
  );
};
