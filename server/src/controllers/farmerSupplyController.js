import { FarmerSupplyRequest } from '../models/FarmerSupplyRequest.js';
import { FarmerSettlement } from '../models/FarmerSettlement.js';
import { Product } from '../models/Product.js';
import { Notification } from '../models/Notification.js';
import { getDefaultHub } from '../services/hubService.js';

export const submitSupplyRequest = async (req, res, next) => {
  try {
    const farmerId = req.user._id;
    const {
      produceName,
      category,
      unit = 'kg',
      proposedQuantity,
      proposedPricePerUnit,
      harvestDate,
      qualityGradeProposed = 'Grade A',
      notes = '',
      productId = null,
      hubId = null
    } = req.body;

    if (!produceName || !category || !proposedQuantity || !proposedPricePerUnit) {
      return res.status(400).json({
        success: false,
        message: 'Produce name, category, quantity, and proposed price are required.'
      });
    }

    if (proposedQuantity <= 0 || proposedPricePerUnit <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity and price must be greater than zero.'
      });
    }

    let targetHub;
    if (hubId) {
      const { Hub } = await import('../models/Hub.js');
      targetHub = await Hub.findById(hubId);
    }
    if (!targetHub) {
      targetHub = await getDefaultHub();
    }

    // Generate unique Request Number: SR-YYYYMMDD-XXXXX
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const requestNumber = `SR-${datePrefix}-${randomSuffix}`;

    const supplyRequest = await FarmerSupplyRequest.create({
      requestNumber,
      farmer: farmerId,
      farmerName: req.user.name,
      farmerPhone: req.user.phone || '',
      hub: targetHub._id,
      hubName: targetHub.name,
      product: productId || null,
      produceName: produceName.trim(),
      category: category.trim(),
      unit,
      proposedQuantity: Number(proposedQuantity),
      proposedPricePerUnit: Number(proposedPricePerUnit),
      harvestDate: harvestDate ? new Date(harvestDate) : new Date(),
      qualityGradeProposed,
      notes: notes.trim(),
      status: 'submitted',
      statusHistory: [{
        status: 'submitted',
        note: `Produce supply request submitted for ${proposedQuantity} ${unit} at ₹${proposedPricePerUnit}/${unit}.`,
        timestamp: new Date(),
        updatedBy: farmerId
      }]
    });

    // Notify farmer
    await Notification.create({
      recipient: farmerId,
      title: 'Supply Request Submitted',
      message: `Your produce supply request #${requestNumber} for ${produceName} has been submitted to ${targetHub.name}.`,
      type: 'order',
      link: `/seller/products`
    });

    return res.status(201).json({
      success: true,
      message: 'Produce supply request submitted successfully to Mandi+ Hub.',
      supplyRequest
    });
  } catch (err) {
    next(err);
  }
};

export const getMySupplyRequests = async (req, res, next) => {
  try {
    const farmerId = req.user._id;
    const { status, page = 1, limit = 20 } = req.query;

    const query = { farmer: farmerId };
    if (status && status !== 'all') {
      query.status = status;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [requests, total] = await Promise.all([
      FarmerSupplyRequest.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      FarmerSupplyRequest.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      count: requests.length,
      total,
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      requests
    });
  } catch (err) {
    next(err);
  }
};

export const getSupplyRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await FarmerSupplyRequest.findById(id)
      .populate('farmer', 'name email phone locality')
      .populate('hub', 'name code address phone')
      .populate('receiving.inventoryBatch')
      .lean();

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Produce supply request not found.'
      });
    }

    // Role check: farmer can only view their own; admin/hub operator can view any
    if (req.user.role === 'farmer' || req.user.role === 'seller') {
      if (request.farmer._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to view this supply request.'
        });
      }
    }

    return res.status(200).json({
      success: true,
      request
    });
  } catch (err) {
    next(err);
  }
};

export const getFarmerSettlements = async (req, res, next) => {
  try {
    const farmerId = req.user._id;
    const settlements = await FarmerSettlement.find({ farmer: farmerId })
      .sort({ createdAt: -1 })
      .lean();

    const summary = settlements.reduce((acc, s) => {
      acc.totalEarned += (s.netPayable || 0);
      acc.totalPaid += (s.paidAmount || 0);
      acc.pendingPayout += ((s.netPayable || 0) - (s.paidAmount || 0));
      return acc;
    }, { totalEarned: 0, totalPaid: 0, pendingPayout: 0 });

    return res.status(200).json({
      success: true,
      summary,
      settlements
    });
  } catch (err) {
    next(err);
  }
};
