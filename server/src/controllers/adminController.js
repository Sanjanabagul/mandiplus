import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';

export const getAdminDashboard = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalBuyers,
      totalSellers,
      totalDeliveryPartners,
      totalProducts,
      pendingApprovalProducts,
      orders
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'buyer' }),
      User.countDocuments({ role: 'seller' }),
      User.countDocuments({ role: 'delivery' }),
      Product.countDocuments(),
      Product.countDocuments({ approvalStatus: 'pending' }),
      Order.find().lean()
    ]);

    let totalGMV = 0;
    let completedOrdersCount = 0;
    let pendingOrdersCount = 0;

    for (const order of orders) {
      totalGMV += order.totalAmount;
      if (order.status === 'delivered') completedOrdersCount++;
      if (['pending', 'confirmed', 'preparing'].includes(order.status)) pendingOrdersCount++;
    }

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalBuyers,
        totalSellers,
        totalDeliveryPartners,
        totalProducts,
        pendingApprovalProducts,
        totalOrders: orders.length,
        completedOrdersCount,
        pendingOrdersCount,
        totalGMV
      },
      recentOrders
    });
  } catch (err) {
    next(err);
  }
};

export const getAdminUsers = async (req, res, next) => {
  try {
    const { role, status, search, page = 1, limit = 15 } = req.query;
    const query = {};

    if (role && role !== 'all') query.role = role;
    if (status && status !== 'all') query.status = status;
    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
        { phone: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      User.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      users,
      total,
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (err) {
    next(err);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended', 'pending_approval'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value.'
      });
    }

    const user = await User.findByIdAndUpdate(id, { status }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: `User status changed to '${status}'.`,
      user
    });
  } catch (err) {
    next(err);
  }
};

export const getAdminProducts = async (req, res, next) => {
  try {
    const { approvalStatus, category, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (approvalStatus && approvalStatus !== 'all') query.approvalStatus = approvalStatus;
    if (category && category !== 'all') query.category = category;
    if (search && search.trim()) {
      query.name = { $regex: search.trim(), $options: 'i' };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query).populate('seller', 'name email phone').sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
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

export const updateProductApproval = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approvalStatus, isAvailable } = req.body;

    const update = {};
    if (approvalStatus) update.approvalStatus = approvalStatus;
    if (isAvailable !== undefined) update.isAvailable = isAvailable;

    const product = await Product.findByIdAndUpdate(id, update, { new: true });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Product moderation status updated.',
      product
    });
  } catch (err) {
    next(err);
  }
};

export const getAdminOrders = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 15 } = req.query;
    const query = {};

    if (status && status !== 'all') query.status = status;
    if (search && search.trim()) {
      query.orderNumber = { $regex: search.trim(), $options: 'i' };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
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

export const getAdminAnalytics = async (req, res, next) => {
  try {
    const orders = await Order.find().lean();

    // 1. Sales by category
    const categorySalesMap = {};
    // 2. Status distribution
    const statusCountMap = {
      pending: 0,
      confirmed: 0,
      preparing: 0,
      ready_for_pickup: 0,
      picked_up: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0
    };
    // 3. Daily / recent revenue
    const dailyRevenueMap = {};

    for (const order of orders) {
      // Status count
      if (statusCountMap[order.status] !== undefined) {
        statusCountMap[order.status]++;
      }

      // Date revenue
      const dateKey = order.createdAt.toISOString().slice(0, 10);
      dailyRevenueMap[dateKey] = (dailyRevenueMap[dateKey] || 0) + order.totalAmount;

      // Category breakdown
      for (const item of order.items) {
        const cat = item.category || 'Other';
        categorySalesMap[cat] = (categorySalesMap[cat] || 0) + item.subtotal;
      }
    }

    const categoryDistribution = Object.keys(categorySalesMap).map(name => ({
      name,
      value: categorySalesMap[name]
    }));

    const statusDistribution = Object.keys(statusCountMap).map(status => ({
      status: status.replace(/_/g, ' ').toUpperCase(),
      count: statusCountMap[status]
    }));

    const revenueTrend = Object.keys(dailyRevenueMap)
      .sort()
      .map(date => ({
        date,
        sales: dailyRevenueMap[date]
      }));

    return res.status(200).json({
      success: true,
      analytics: {
        categoryDistribution,
        statusDistribution,
        revenueTrend: revenueTrend.length > 0 ? revenueTrend : [
          { date: 'Day 1', sales: 45000 },
          { date: 'Day 2', sales: 62000 },
          { date: 'Day 3', sales: 89000 },
          { date: 'Today', sales: 114500 }
        ]
      }
    });
  } catch (err) {
    next(err);
  }
};
