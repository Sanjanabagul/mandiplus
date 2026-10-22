import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { Notification } from '../models/Notification.js';
import { FarmerSupplyRequest } from '../models/FarmerSupplyRequest.js';
import { InventoryBatch } from '../models/InventoryBatch.js';
import { FarmerSettlement } from '../models/FarmerSettlement.js';

export const getSellerDashboard = async (req, res, next) => {
  try {
    const sellerId = req.user._id;

    const [
      totalProducts,
      activeBatches,
      allSupplyRequests,
      settlements,
      recentRequests
    ] = await Promise.all([
      Product.countDocuments({ $or: [{ seller: sellerId }, { sourceFarmers: sellerId }] }),
      InventoryBatch.find({ sourceFarmer: sellerId, isSellable: true }).lean(),
      FarmerSupplyRequest.find({ farmer: sellerId }).lean(),
      FarmerSettlement.find({ farmer: sellerId }).lean(),
      FarmerSupplyRequest.find({ farmer: sellerId }).sort({ createdAt: -1 }).limit(5).lean()
    ]);

    let totalAcceptedQuantity = 0;
    let pendingReviews = 0;
    let approvedForDelivery = 0;
    let acceptedSupplies = 0;

    for (const reqItem of allSupplyRequests) {
      if (['submitted', 'under_review'].includes(reqItem.status)) pendingReviews++;
      if (reqItem.status === 'approved_for_delivery') approvedForDelivery++;
      if (['accepted', 'partially_accepted'].includes(reqItem.status)) {
        acceptedSupplies++;
        totalAcceptedQuantity += (reqItem.receiving?.acceptedQuantity || 0);
      }
    }

    const totalGrossEarnings = settlements.reduce((sum, s) => sum + (s.netPayable || 0), 0);
    const completedPayouts = settlements.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
    const pendingPayout = Math.max(0, totalGrossEarnings - completedPayouts);

    return res.status(200).json({
      success: true,
      metrics: {
        totalProducts,
        activeBatchesInHub: activeBatches.length,
        totalSuppliesSubmitted: allSupplyRequests.length,
        pendingReviews,
        approvedForDelivery,
        acceptedSupplies,
        totalAcceptedQuantity: Math.round(totalAcceptedQuantity * 10) / 10,
        totalGrossSales: totalGrossEarnings,
        completedSales: completedPayouts,
        pendingSettlement: pendingPayout
      },
      recentRequests,
      activeBatches
    });
  } catch (err) {
    next(err);
  }
};

export const getSellerProducts = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const { category, isAvailable, page = 1, limit = 20 } = req.query;

    const query = { seller: sellerId };
    if (category && category !== 'all') query.category = category;
    if (isAvailable !== undefined) query.isAvailable = isAvailable === 'true';

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      products,
      total,
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      category,
      cropType,
      unit,
      pricePerUnit,
      originalPrice,
      stockQuantity,
      minOrderQuantity,
      bulkPricingTiers,
      qualityGrade,
      qualityGradeDetails,
      harvestDate,
      isOrganic,
      organicCertNumber,
      productionMethod,
      pickupLocality,
      pincode,
      images
    } = req.body;

    if (!name || !category || !pricePerUnit || stockQuantity === undefined || !pickupLocality) {
      return res.status(400).json({
        success: false,
        message: 'Name, category, price, stock, and pickup locality are required.'
      });
    }

    // Default image if none provided
    const productImages = images && images.length > 0 ? images : [
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80'
    ];

    const product = await Product.create({
      name,
      description: description || '',
      category,
      cropType: cropType || name,
      seller: req.user._id,
      sellerName: req.user.businessName || req.user.name,
      unit: unit || 'kg',
      pricePerUnit: parseFloat(pricePerUnit),
      originalPrice: originalPrice ? parseFloat(originalPrice) : null,
      stockQuantity: parseInt(stockQuantity, 10),
      minOrderQuantity: parseInt(minOrderQuantity || 1, 10),
      bulkPricingTiers: bulkPricingTiers || [],
      qualityGrade: qualityGrade || 'Grade A',
      qualityGradeDetails: qualityGradeDetails || {
        assessedAt: new Date(),
        assessedBy: 'Seller Declared',
        confidence: 0.95,
        notes: 'Verified healthy produce'
      },
      harvestDate: harvestDate || new Date(),
      isOrganic: Boolean(isOrganic),
      organicCertNumber: organicCertNumber || '',
      productionMethod: productionMethod || 'Traditional',
      pickupLocality,
      pincode: pincode || req.user.locality || '',
      images: productImages,
      isAvailable: true,
      approvalStatus: 'approved'
    });

    return res.status(201).json({
      success: true,
      message: 'Product listed successfully.',
      product
    });
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this listing.'
      });
    }

    Object.assign(product, req.body);
    await product.save();

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      product
    });
  } catch (err) {
    next(err);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product.'
      });
    }

    await Product.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Product listing removed successfully.'
    });
  } catch (err) {
    next(err);
  }
};

export const getSellerOrders = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const { status, page = 1, limit = 15 } = req.query;

    const query = { 'items.seller': sellerId };
    if (status && status !== 'all') {
      query.status = status;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Order.countDocuments(query)
    ]);

    // Format orders to highlight items relevant to this seller
    const formattedOrders = orders.map(order => {
      const myItems = order.items.filter(i => i.seller.toString() === sellerId.toString());
      const myTotal = myItems.reduce((acc, i) => acc + i.subtotal, 0);
      return {
        ...order,
        sellerItems: myItems,
        sellerItemTotal: myTotal
      };
    });

    return res.status(200).json({
      success: true,
      orders: formattedOrders,
      total,
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (err) {
    next(err);
  }
};

export const updateOrderStatusBySeller = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note = '' } = req.body;

    const allowedTransitions = ['confirmed', 'preparing', 'ready_for_pickup'];
    if (!allowedTransitions.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Sellers can only set status to: ${allowedTransitions.join(', ')}`
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    const hasSellerItem = order.items.some(i => i.seller.toString() === req.user._id.toString());
    if (!hasSellerItem && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order.'
      });
    }

    order.status = status;
    order.statusHistory.push({
      status,
      note: note || `Status updated by farmer/supplier ${req.user.name}`,
      timestamp: new Date(),
      updatedBy: req.user._id
    });

    await order.save();

    // Notify buyer
    await Notification.create({
      recipient: order.buyer,
      title: `Order Status: ${status.replace(/_/g, ' ').toUpperCase()}`,
      message: `Your Order #${order.orderNumber} is now marked as '${status.replace(/_/g, ' ')}' by the farmer.`,
      type: 'order',
      link: `/orders/${order._id}`
    });

    return res.status(200).json({
      success: true,
      message: `Order status updated to '${status}'.`,
      order
    });
  } catch (err) {
    next(err);
  }
};

export const getSellerEarnings = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const orders = await Order.find({ 'items.seller': sellerId }).lean();

    let grossRevenue = 0;
    let completedPayout = 0;
    const transactions = [];

    for (const order of orders) {
      const myItems = order.items.filter(i => i.seller.toString() === sellerId.toString());
      const amount = myItems.reduce((acc, i) => acc + i.subtotal, 0);

      grossRevenue += amount;
      if (order.status === 'delivered') {
        completedPayout += amount;
      }

      transactions.push({
        id: order._id,
        orderNumber: order.orderNumber,
        date: order.createdAt,
        itemsCount: myItems.length,
        amount,
        status: order.status,
        paymentStatus: order.paymentStatus
      });
    }

    return res.status(200).json({
      success: true,
      grossRevenue,
      completedPayout,
      pendingPayout: grossRevenue - completedPayout,
      transactions: transactions.sort((a, b) => new Date(b.date) - new Date(a.date))
    });
  } catch (err) {
    next(err);
  }
};
