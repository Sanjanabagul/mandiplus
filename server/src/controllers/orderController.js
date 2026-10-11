import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Cart } from '../models/Cart.js';
import { Notification } from '../models/Notification.js';

export const createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, paymentMethod = 'cod', items: directItems } = req.body;

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.locality || !shippingAddress.city || !shippingAddress.pincode) {
      return res.status(400).json({
        success: false,
        message: 'A complete delivery address is required to place an order.'
      });
    }

    // Determine items to purchase: either from body or from user's DB cart
    let checkoutItems = [];
    if (directItems && Array.isArray(directItems) && directItems.length > 0) {
      checkoutItems = directItems;
    } else {
      const cart = await Cart.findOne({ user: req.user._id });
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Your cart is empty.'
        });
      }
      checkoutItems = cart.items.map(i => ({
        productId: i.product.toString(),
        quantity: i.quantity
      }));
    }

    // Revalidate inventory, MOQ, and calculate server-side totals
    const orderItems = [];
    let subtotal = 0;
    const productsToUpdate = [];

    for (const item of checkoutItems) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Produce '${product?.name || 'Item'}' is currently unavailable.`
        });
      }

      if (item.quantity < product.minOrderQuantity) {
        return res.status(400).json({
          success: false,
          message: `Minimum order quantity for '${product.name}' is ${product.minOrderQuantity} ${product.unit}.`
        });
      }

      if (item.quantity > product.stockQuantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for '${product.name}'. Only ${product.stockQuantity} ${product.unit} available.`
        });
      }

      // Calculate unit price considering bulk tiers
      let effectivePrice = product.pricePerUnit;
      if (product.bulkPricingTiers && product.bulkPricingTiers.length > 0) {
        const matchedTier = [...product.bulkPricingTiers]
          .sort((a, b) => b.minQuantity - a.minQuantity)
          .find(t => item.quantity >= t.minQuantity);
        if (matchedTier) {
          effectivePrice = matchedTier.pricePerUnit;
        }
      }

      const itemSubtotal = effectivePrice * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.images && product.images.length > 0 ? product.images[0] : '',
        category: product.category,
        unit: product.unit,
        seller: product.seller,
        sellerName: product.sellerName,
        unitPrice: effectivePrice,
        quantity: item.quantity,
        subtotal: itemSubtotal
      });

      productsToUpdate.push({
        product,
        quantityToDecrement: item.quantity
      });
    }

    const deliveryCharge = subtotal > 1500 ? 0 : 50;
    const totalAmount = subtotal + deliveryCharge;

    // Generate unique order number (e.g. MP-202610-84729)
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const orderNumber = `MP-${datePrefix}-${randomSuffix}`;

    // Estimated delivery: 1-2 days from order
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 2);

    const order = await Order.create({
      orderNumber,
      buyer: req.user._id,
      buyerName: req.user.name,
      buyerEmail: req.user.email,
      buyerPhone: shippingAddress.phone || req.user.phone,
      items: orderItems,
      subtotal,
      deliveryCharge,
      totalAmount,
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'test_simulation' ? 'paid' : 'pending',
      status: 'pending',
      statusHistory: [{
        status: 'pending',
        note: `Order placed via ${paymentMethod === 'test_simulation' ? 'Simulated Digital Payment' : 'Cash on Delivery'}.`,
        timestamp: new Date(),
        updatedBy: req.user._id
      }],
      estimatedDeliveryDate: estimatedDelivery
    });

    // Safely decrement stock on products
    for (const item of productsToUpdate) {
      item.product.stockQuantity -= item.quantityToDecrement;
      if (item.product.stockQuantity <= 0) {
        item.product.stockQuantity = 0;
      }
      await item.product.save();
    }

    // Clear buyer's cart
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    // Send in-app notification to buyer
    await Notification.create({
      recipient: req.user._id,
      title: 'Order Confirmed!',
      message: `Your order #${orderNumber} for ₹${totalAmount.toLocaleString('en-IN')} has been placed successfully.`,
      type: 'order',
      link: `/orders/${order._id}`
    });

    // Notify sellers
    const uniqueSellerIds = [...new Set(orderItems.map(i => i.seller.toString()))];
    for (const sellerId of uniqueSellerIds) {
      await Notification.create({
        recipient: sellerId,
        title: 'New Order Received',
        message: `You have new incoming produce items to fulfill for Order #${orderNumber}.`,
        type: 'order',
        link: `/seller/orders`
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      order
    });
  } catch (err) {
    next(err);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { buyer: req.user._id };

    if (status && status !== 'all') {
      query.status = status;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      orders,
      total,
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (err) {
    next(err);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || id === 'undefined' || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing Order ID.'
      });
    }

    const order = await Order.findById(id)
      .populate('items.product', 'name images unit pickupLocality')
      .populate('deliveryPartner', 'name phone deliveryProfile');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    // Role check: buyer owner, admin, delivery partner, or seller of item
    const isBuyer = order.buyer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isDelivery = order.deliveryPartner && order.deliveryPartner.toString() === req.user._id.toString();
    const isSeller = order.items.some(item => item.seller.toString() === req.user._id.toString());

    if (!isBuyer && !isAdmin && !isDelivery && !isSeller) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this order.'
      });
    }

    return res.status(200).json({
      success: true,
      order
    });
  } catch (err) {
    next(err);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = 'Cancelled by buyer' } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    if (order.buyer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order.'
      });
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled as it is already in '${order.status}' status.`
      });
    }

    order.status = 'cancelled';
    order.cancellationReason = reason;
    order.statusHistory.push({
      status: 'cancelled',
      note: `Order cancelled. Reason: ${reason}`,
      timestamp: new Date(),
      updatedBy: req.user._id
    });

    await order.save();

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stockQuantity: item.quantity }
      });
    }

    // Notification
    await Notification.create({
      recipient: order.buyer,
      title: 'Order Cancelled',
      message: `Your order #${order.orderNumber} has been successfully cancelled.`,
      type: 'order',
      link: `/orders/${order._id}`
    });

    return res.status(200).json({
      success: true,
      message: 'Order cancelled successfully and inventory restored.',
      order
    });
  } catch (err) {
    next(err);
  }
};

export const getOrderTracking = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || id === 'undefined' || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing Order ID.'
      });
    }

    const order = await Order.findById(id).select('orderNumber status statusHistory estimatedDeliveryDate shippingAddress deliveryPartner');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    return res.status(200).json({
      success: true,
      orderNumber: order.orderNumber,
      currentStatus: order.status,
      timeline: order.statusHistory,
      estimatedDeliveryDate: order.estimatedDeliveryDate,
      shippingAddress: order.shippingAddress
    });
  } catch (err) {
    next(err);
  }
};
