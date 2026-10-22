import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Cart } from '../models/Cart.js';
import { Notification } from '../models/Notification.js';
import { DeliveryAssignment } from '../models/DeliveryAssignment.js';
import {
  getDefaultHub,
  reserveStockAcrossBatches,
  releaseStockReservations,
  syncProductStockFromBatches
} from '../services/hubService.js';

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

    // Get the target Mandi+ Hub
    const hub = await getDefaultHub();

    // Revalidate inventory, MOQ, and calculate server-side totals
    const orderItems = [];
    let subtotal = 0;
    const reservedBatchHoldings = [];

    // Temporary unique order number for movement audit trail
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const orderNumber = `MP-${datePrefix}-${randomSuffix}`;

    try {
      for (const item of checkoutItems) {
        const product = await Product.findById(item.productId);
        if (!product || !product.isAvailable) {
          throw new Error(`Produce '${product?.name || 'Item'}' is currently unavailable at Mandi+ Hub.`);
        }

        if (item.quantity < product.minOrderQuantity) {
          throw new Error(`Minimum order quantity for '${product.name}' is ${product.minOrderQuantity} ${product.unit}.`);
        }

        if (item.quantity > product.stockQuantity) {
          throw new Error(`Insufficient stock for '${product.name}' at Mandi+ Hub. Only ${product.stockQuantity} ${product.unit} available.`);
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

        // Atomically reserve inventory from eligible batches at the hub
        let allocatedBatches = [];
        try {
          allocatedBatches = await reserveStockAcrossBatches({
            productId: product._id,
            quantity: item.quantity,
            hubId: hub._id,
            orderNumber,
            actor: req.user
          });
          reservedBatchHoldings.push(...allocatedBatches);
        } catch (reserveErr) {
          // If no specific batches exist in development/demo mode, decrement product stock directly
          if (product.stockQuantity >= item.quantity) {
            product.stockQuantity -= item.quantity;
            if (product.stockQuantity <= 0) product.stockQuantity = 0;
            await product.save();
          } else {
            throw reserveErr;
          }
        }

        orderItems.push({
          product: product._id,
          name: product.name,
          image: product.images && product.images.length > 0 ? product.images[0] : '',
          category: product.category,
          unit: product.unit,
          seller: product.seller || null,
          sellerName: 'Mandi+ Hub',
          unitPrice: effectivePrice,
          quantity: item.quantity,
          subtotal: itemSubtotal,
          allocatedBatches,
          pickStatus: 'pending',
          pickedQuantity: 0
        });
      }
    } catch (validationErr) {
      // Rollback any reservations made so far
      if (reservedBatchHoldings.length > 0) {
        await releaseStockReservations({
          allocatedBatches: reservedBatchHoldings,
          hubId: hub._id,
          orderNumber,
          actor: req.user
        });
      }
      return res.status(400).json({
        success: false,
        message: validationErr.message
      });
    }

    const deliveryCharge = subtotal > 1500 ? 0 : 50;
    const totalAmount = subtotal + deliveryCharge;

    // Estimated delivery: 1-2 days from order
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 2);

    const pickupOtp = Math.floor(1000 + Math.random() * 9000).toString();

    // Create consolidated order
    const order = await Order.create({
      orderNumber,
      hub: hub._id,
      hubName: hub.name,
      fulfilledBy: 'Mandi+ Hub',
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
      status: 'confirmed',
      statusHistory: [{
        status: 'confirmed',
        note: `Order confirmed. Consolidated preparation and packing scheduled at ${hub.name}.`,
        timestamp: new Date(),
        updatedBy: req.user._id
      }],
      pickupOtp,
      estimatedDeliveryDate: estimatedDelivery
    });

    // Create initial DeliveryAssignment record with Mandi+ Hub pickup address
    await DeliveryAssignment.create({
      order: order._id,
      deliveryPartner: null,
      pickupAddress: {
        hubId: hub._id,
        hubName: hub.name,
        supplierName: 'Mandi+ Central Fulfilment Hub',
        address: hub.address.street,
        locality: hub.address.locality,
        city: hub.address.city,
        pincode: hub.address.pincode,
        phone: hub.phone
      },
      packageCount: 1,
      deliveryAddress: {
        recipientName: shippingAddress.fullName,
        phone: shippingAddress.phone,
        locality: shippingAddress.locality,
        city: shippingAddress.city,
        pincode: shippingAddress.pincode,
        instructions: shippingAddress.instructions || ''
      },
      status: 'assigned'
    });

    // Clear buyer's cart
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    // Send in-app notification to buyer
    await Notification.create({
      recipient: req.user._id,
      title: 'Order Confirmed — Fulfilled by Mandi+ Hub',
      message: `Your consolidated order #${orderNumber} for ₹${totalAmount.toLocaleString('en-IN')} has been placed. Mandi+ Hub is now preparing your items.`,
      type: 'order',
      link: `/orders/${order._id}`
    });

    return res.status(201).json({
      success: true,
      message: 'Consolidated order placed successfully and assigned to Mandi+ Hub for fulfilment.',
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
        .populate('hub', 'name code address')
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
      .populate('hub', 'name code address phone email')
      .populate('items.product', 'name images unit pickupLocality')
      .populate('deliveryPartner', 'name phone deliveryProfile');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    // Role check: buyer owner, admin, hub operator, or assigned delivery partner
    const isBuyer = order.buyer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isHubOperator = req.user.role === 'hub_operator';
    const isDelivery = order.deliveryPartner && order.deliveryPartner.toString() === req.user._id.toString();

    if (!isBuyer && !isAdmin && !isHubOperator && !isDelivery) {
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

    // Orders cannot be cancelled once packed or dispatched
    if (!['pending', 'confirmed', 'processing_hub'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled as it is already in '${order.status}' status at Mandi+ Hub.`
      });
    }

    order.status = 'cancelled';
    order.cancellationReason = reason;
    order.statusHistory.push({
      status: 'cancelled',
      note: `Order cancelled. Reason: ${reason}. Inventory reservations released.`,
      timestamp: new Date(),
      updatedBy: req.user._id
    });

    await order.save();

    // Release batch inventory reservations
    const allAllocations = order.items.flatMap(i => i.allocatedBatches || []);
    if (allAllocations.length > 0) {
      await releaseStockReservations({
        allocatedBatches: allAllocations,
        hubId: order.hub,
        orderId: order._id,
        orderNumber: order.orderNumber,
        actor: req.user
      });
    } else {
      // Fallback stock restoration
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stockQuantity: item.quantity }
        });
      }
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
      message: 'Order cancelled successfully and inventory reservations released.',
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

    const order = await Order.findById(id)
      .populate('hub', 'name code address phone')
      .populate('deliveryPartner', 'name phone')
      .select('orderNumber status statusHistory estimatedDeliveryDate shippingAddress deliveryPartner hub hubName fulfilledBy pickupOtp');

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
      fulfilledBy: order.fulfilledBy || 'Mandi+ Hub',
      hub: order.hub || { name: 'Mandi+ Hub Central' },
      timeline: order.statusHistory,
      estimatedDeliveryDate: order.estimatedDeliveryDate,
      shippingAddress: order.shippingAddress,
      deliveryPartner: order.deliveryPartner
    });
  } catch (err) {
    next(err);
  }
};
