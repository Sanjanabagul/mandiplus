import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { AuditLog } from '../models/AuditLog.js';
import { FarmerSupplyRequest } from '../models/FarmerSupplyRequest.js';
import { InventoryBatch } from '../models/InventoryBatch.js';
import { Hub } from '../models/Hub.js';
import { getSafeDatabaseDiagnostics } from '../config/db.js';

export const getAdminDashboard = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalBuyers,
      totalSellers,
      totalDeliveryPartners,
      pendingFarmerApplications,
      pendingDeliveryApplications,
      approvedFarmers,
      approvedDeliveryPartners,
      rejectedApplications,
      suspendedUsers,
      totalProducts,
      pendingApprovalProducts,
      pendingSupplyRequests,
      activeBatchesCount,
      orders
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'buyer' }),
      User.countDocuments({ role: { $in: ['seller', 'farmer'] } }),
      User.countDocuments({ role: 'delivery' }),
      User.countDocuments({ role: { $in: ['seller', 'farmer'] }, approvalStatus: 'pending' }),
      User.countDocuments({ role: 'delivery', approvalStatus: 'pending' }),
      User.countDocuments({ role: { $in: ['seller', 'farmer'] }, approvalStatus: 'approved', isActive: true, status: 'active' }),
      User.countDocuments({ role: 'delivery', approvalStatus: 'approved', isActive: true, status: 'active' }),
      User.countDocuments({ approvalStatus: 'rejected' }),
      User.countDocuments({ status: 'suspended' }),
      Product.countDocuments(),
      Product.countDocuments({ approvalStatus: 'pending' }),
      FarmerSupplyRequest.countDocuments({ status: { $in: ['submitted', 'under_review'] } }),
      InventoryBatch.countDocuments({ isSellable: true }),
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

    const recentApplications = await User.find({
      role: { $in: ['farmer', 'seller', 'delivery'] }
    })
      .select('-password')
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
        pendingFarmerApplications,
        pendingDeliveryApplications,
        approvedFarmers,
        approvedDeliveryPartners,
        rejectedApplications,
        suspendedUsers,
        totalPendingApplications: pendingFarmerApplications + pendingDeliveryApplications,
        totalProducts,
        pendingApprovalProducts,
        pendingSupplyRequests,
        activeBatchesCount,
        totalOrders: orders.length,
        completedOrdersCount,
        pendingOrdersCount,
        totalGMV
      },
      recentOrders,
      recentApplications
    });
  } catch (err) {
    next(err);
  }
};

export const getAdminDashboardStats = getAdminDashboard;

export const getAdminApplications = async (req, res, next) => {
  try {
    const { role, status, search, page = 1, limit = 15 } = req.query;
    const query = {
      role: { $in: ['farmer', 'seller', 'delivery'] }
    };

    if (role && role !== 'all') {
      if (role === 'farmer' || role === 'seller') {
        query.role = { $in: ['farmer', 'seller'] };
      } else {
        query.role = role;
      }
    }

    if (status && status !== 'all') {
      query.approvalStatus = status;
    }

    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { businessName: searchRegex },
        { locality: searchRegex }
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;
    const skip = (pageNum - 1) * limitNum;

    const [applications, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .populate('approvedBy', 'name email')
        .populate('rejectedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      applications,
      total,
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (err) {
    next(err);
  }
};

export const getFarmerApplications = async (req, res, next) => {
  req.query.role = 'farmer';
  return getAdminApplications(req, res, next);
};

export const getDeliveryApplications = async (req, res, next) => {
  req.query.role = 'delivery';
  return getAdminApplications(req, res, next);
};

export const getAdminApplicationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const application = await User.findById(id)
      .select('-password')
      .populate('approvedBy', 'name email')
      .populate('rejectedBy', 'name email')
      .lean();

    if (!application || !['farmer', 'seller', 'delivery'].includes(application.role)) {
      return res.status(404).json({
        success: false,
        message: 'Application not found.'
      });
    }

    return res.status(200).json({
      success: true,
      application
    });
  } catch (err) {
    next(err);
  }
};

export const approveApplication = async (req, res, next) => {
  try {
    const { id } = req.params;

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Application not found.'
      });
    }

    if (!['farmer', 'seller', 'delivery'].includes(targetUser.role)) {
      return res.status(400).json({
        success: false,
        message: `Cannot approve account with role '${targetUser.role}'. Only farmer and delivery applications require approval.`
      });
    }

    if (targetUser.approvalStatus === 'approved') {
      return res.status(409).json({
        success: false,
        message: 'This application has already been approved.'
      });
    }

    if (targetUser.approvalStatus === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Rejected applications cannot be approved directly.'
      });
    }

    const previousStatus = targetUser.approvalStatus;
    targetUser.approvalStatus = 'approved';
    targetUser.isActive = true;
    targetUser.status = 'active';
    targetUser.approvedAt = new Date();
    targetUser.approvedBy = req.user._id;
    targetUser.rejectionReason = '';

    if (['farmer', 'seller'].includes(targetUser.role) && targetUser.sellerProfile) {
      targetUser.sellerProfile.verified = true;
    }

    await targetUser.save();

    await AuditLog.create({
      user: req.user._id,
      action: 'APPLICATION_APPROVED',
      entityType: 'User',
      entityId: targetUser._id.toString(),
      details: {
        applicantName: targetUser.name,
        applicantEmail: targetUser.email,
        role: targetUser.role,
        previousStatus,
        newStatus: 'approved'
      },
      ipAddress: req.ip || ''
    });

    return res.status(200).json({
      success: true,
      message: `${targetUser.role === 'delivery' ? 'Delivery partner' : 'Farmer'} application approved successfully.`,
      application: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        approvalStatus: targetUser.approvalStatus,
        isActive: targetUser.isActive,
        approvedAt: targetUser.approvedAt
      }
    });
  } catch (err) {
    next(err);
  }
};

export const rejectApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A rejection reason is required.'
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Application not found.'
      });
    }

    if (!['farmer', 'seller', 'delivery'].includes(targetUser.role)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reject account with role '${targetUser.role}'. Only farmer and delivery applications can be processed.`
      });
    }

    if (targetUser.approvalStatus === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Approved accounts cannot be rejected via pending application workflow.'
      });
    }

    if (targetUser.approvalStatus === 'rejected') {
      return res.status(409).json({
        success: false,
        message: 'This application has already been rejected.'
      });
    }

    const previousStatus = targetUser.approvalStatus;
    targetUser.approvalStatus = 'rejected';
    targetUser.isActive = false;
    targetUser.status = 'suspended';
    targetUser.rejectedAt = new Date();
    targetUser.rejectedBy = req.user._id;
    targetUser.rejectionReason = rejectionReason.trim();

    await targetUser.save();

    await AuditLog.create({
      user: req.user._id,
      action: 'APPLICATION_REJECTED',
      entityType: 'User',
      entityId: targetUser._id.toString(),
      details: {
        applicantName: targetUser.name,
        applicantEmail: targetUser.email,
        role: targetUser.role,
        previousStatus,
        newStatus: 'rejected',
        rejectionReason: rejectionReason.trim()
      },
      ipAddress: req.ip || ''
    });

    return res.status(200).json({
      success: true,
      message: `${targetUser.role === 'delivery' ? 'Delivery partner' : 'Farmer'} application rejected successfully.`,
      application: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        approvalStatus: targetUser.approvalStatus,
        isActive: targetUser.isActive,
        rejectedAt: targetUser.rejectedAt,
        rejectionReason: targetUser.rejectionReason
      }
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
        revenueTrend
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getAdminDatabaseDiagnostics = async (req, res, next) => {
  try {
    const baseDiagnostics = await getSafeDatabaseDiagnostics();

    const [
      totalUsers,
      totalProducts,
      totalOrders,
      buyerCount,
      farmerCount,
      deliveryCount,
      adminCount,
      pendingApplications,
      approvedUsers,
      rejectedUsers,
      activeUsers,
      suspendedUsers
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      User.countDocuments({ role: 'buyer' }),
      User.countDocuments({ role: { $in: ['seller', 'farmer'] } }),
      User.countDocuments({ role: 'delivery' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ approvalStatus: 'pending' }),
      User.countDocuments({ approvalStatus: 'approved' }),
      User.countDocuments({ approvalStatus: 'rejected' }),
      User.countDocuments({ isActive: true, status: 'active' }),
      User.countDocuments({ status: 'suspended' })
    ]);

    return res.status(200).json({
      success: true,
      diagnostics: {
        ...baseDiagnostics,
        counts: {
          totalUsers,
          totalProducts,
          totalOrders,
          activeUsers,
          suspendedUsers,
          byRole: {
            buyer: buyerCount,
            farmer: farmerCount,
            delivery: deliveryCount,
            admin: adminCount
          },
          byApprovalStatus: {
            pending: pendingApplications,
            approved: approvedUsers,
            rejected: rejectedUsers
          }
        }
      }
    });
  } catch (err) {
    next(err);
  }
};
