import mongoose from 'mongoose';
import { Hub } from '../models/Hub.js';
import { Product } from '../models/Product.js';
import { InventoryBatch } from '../models/InventoryBatch.js';
import { InventoryMovement } from '../models/InventoryMovement.js';
import { FarmerSupplyRequest } from '../models/FarmerSupplyRequest.js';
import { FarmerSettlement } from '../models/FarmerSettlement.js';
import { Order } from '../models/Order.js';
import { DeliveryAssignment } from '../models/DeliveryAssignment.js';
import { Notification } from '../models/Notification.js';
import {
  getDefaultHub,
  syncProductStockFromBatches,
  dispatchStockSales
} from '../services/hubService.js';

export const getHubOverview = async (req, res, next) => {
  try {
    const hub = await getDefaultHub();
    const hubId = hub._id;

    const [
      totalProducts,
      batches,
      pendingSupplyRequests,
      expectedIncoming,
      ordersAwaitingPick,
      ordersPacking,
      ordersReadyForPickup,
      activeDeliveries,
      completedOrdersCount
    ] = await Promise.all([
      Product.countDocuments({ isAvailable: true, stockQuantity: { $gt: 0 } }),
      InventoryBatch.find({ hub: hubId }).lean(),
      FarmerSupplyRequest.countDocuments({ hub: hubId, status: { $in: ['submitted', 'under_review'] } }),
      FarmerSupplyRequest.countDocuments({ hub: hubId, status: 'approved_for_delivery' }),
      Order.countDocuments({ status: { $in: ['confirmed', 'processing_hub'] } }),
      Order.countDocuments({ status: { $in: ['picking', 'packing'] } }),
      Order.countDocuments({ status: 'ready_for_pickup' }),
      Order.countDocuments({ status: { $in: ['assigned', 'picked_up', 'out_for_delivery'] } }),
      Order.countDocuments({ status: 'delivered' })
    ]);

    let totalSellableQuantity = 0;
    let lowStockBatches = 0;
    let quarantinedBatches = 0;
    let expiredBatches = 0;

    const now = new Date();
    for (const b of batches) {
      if (b.isSellable && b.qualityStatus === 'accepted') {
        const avail = Math.max(0, (b.remainingQuantity || 0) - (b.reservedQuantity || 0));
        totalSellableQuantity += avail;
        if (avail <= 20) lowStockBatches++;
      }
      if (b.qualityStatus === 'quarantined') quarantinedBatches++;
      if (b.expiryDate && new Date(b.expiryDate) < now) expiredBatches++;
    }

    return res.status(200).json({
      success: true,
      hub: {
        id: hub._id,
        name: hub.name,
        code: hub.code,
        address: hub.address,
        operatingHours: hub.operatingHours
      },
      metrics: {
        totalSellableProducts: totalProducts,
        totalSellableQuantity: Math.round(totalSellableQuantity * 10) / 10,
        pendingSupplyRequests,
        expectedIncoming,
        ordersAwaitingPick,
        ordersPacking,
        ordersReadyForPickup,
        activeDeliveries,
        completedOrders: completedOrdersCount,
        lowStockBatches,
        quarantinedBatches,
        expiredBatches
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getSupplyRequests = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { produceName: { $regex: search, $options: 'i' } },
        { farmerName: { $regex: search, $options: 'i' } },
        { requestNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [requests, total] = await Promise.all([
      FarmerSupplyRequest.find(query)
        .populate('farmer', 'name email phone locality businessName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
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

export const reviewSupplyRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, reviewNotes = '' } = req.body; // action: 'approve' | 'reject'

    const request = await FarmerSupplyRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Produce supply request not found.'
      });
    }

    if (['accepted', 'partially_accepted', 'rejected', 'cancelled'].includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot review request in '${request.status}' state.`
      });
    }

    const newStatus = action === 'approve' ? 'approved_for_delivery' : 'rejected';
    request.status = newStatus;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.reviewNotes = reviewNotes.trim();

    request.statusHistory.push({
      status: newStatus,
      note: action === 'approve'
        ? `Request approved for delivery to Mandi+ Hub. ${reviewNotes}`
        : `Request rejected: ${reviewNotes}`,
      timestamp: new Date(),
      updatedBy: req.user._id
    });

    await request.save();

    await Notification.create({
      recipient: request.farmer,
      title: action === 'approve' ? 'Supply Approved for Hub Delivery' : 'Supply Request Rejected',
      message: action === 'approve'
        ? `Your supply request #${request.requestNumber} for ${request.produceName} was approved. Please dispatch produce to ${request.hubName}.`
        : `Your supply request #${request.requestNumber} was not approved. Notes: ${reviewNotes}`,
      type: 'order',
      link: `/seller/products`
    });

    return res.status(200).json({
      success: true,
      message: `Supply request ${action === 'approve' ? 'approved for hub delivery' : 'rejected'} successfully.`,
      request,
      supplyRequest: request
    });
  } catch (err) {
    next(err);
  }
};

export const receiveAndInspectSupply = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      receivedQuantity,
      acceptedQuantity,
      rejectedQuantity = 0,
      rejectionReason = '',
      gradeAssigned = 'Grade A',
      inspectionNotes = '',
      agreedPurchasePricePerUnit,
      sellingPricePerUnit,
      expiryDays = 7,
      binLocation = 'BAY-A1'
    } = req.body;

    const request = await FarmerSupplyRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Produce supply request not found.'
      });
    }

    if (['accepted', 'partially_accepted', 'rejected'].includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: `Shipment already processed in status '${request.status}'.`
      });
    }

    const recvQty = Number(receivedQuantity);
    const accQty = Number(acceptedQuantity);
    const rejQty = Number(rejectedQuantity);

    if (isNaN(recvQty) || recvQty < 0 || isNaN(accQty) || accQty < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid received and accepted quantities are required.'
      });
    }

    if (accQty + rejQty > recvQty + 0.01) {
      return res.status(400).json({
        success: false,
        message: 'Accepted quantity plus rejected quantity cannot exceed total received quantity.'
      });
    }

    const agreedPrice = agreedPurchasePricePerUnit !== undefined && agreedPurchasePricePerUnit !== null
      ? Number(agreedPurchasePricePerUnit)
      : request.proposedPricePerUnit;

    const sellPrice = sellingPricePerUnit !== undefined && sellingPricePerUnit !== null
      ? Number(sellingPricePerUnit)
      : Math.round(agreedPrice * 1.25); // Default 25% markup if not specified

    let createdBatch = null;

    // If accepted quantity > 0, generate batch, add to inventory, and sync product
    if (accQty > 0) {
      // Find or create catalog Product
      let product = null;
      if (request.product) {
        product = await Product.findById(request.product);
      }
      if (!product) {
        product = await Product.findOne({
          name: { $regex: new RegExp(`^${request.produceName.trim()}$`, 'i') },
          category: request.category
        });
      }

      if (!product) {
        product = await Product.create({
          name: request.produceName.trim(),
          description: `Fresh ${request.produceName.trim()} sourced directly from verified regional farmers, inspected and graded at Mandi+ Hub.`,
          category: request.category,
          cropType: request.produceName.trim(),
          hub: request.hub,
          fulfilledBy: 'Mandi+ Hub',
          sellerName: 'Mandi+ Hub Partner Farmers',
          unit: request.unit,
          pricePerUnit: sellPrice,
          originalPrice: Math.round(sellPrice * 1.15),
          stockQuantity: 0,
          minOrderQuantity: 1,
          qualityGrade: gradeAssigned,
          pickupLocality: 'Mandi+ Central Fulfilment Hub',
          isAvailable: true,
          approvalStatus: 'approved'
        });
      }

      // Generate unique lot/batch number: BATCH-[PROD_SLUG]-[TIMESTAMP_HEX]
      const prodSlug = request.produceName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
      const uniqueBatchId = `BATCH-${prodSlug}-${Date.now().toString(36).toUpperCase()}`;

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + (parseInt(expiryDays, 10) || 7));

      createdBatch = await InventoryBatch.create({
        batchNumber: uniqueBatchId,
        hub: request.hub,
        product: product._id,
        sourceFarmer: request.farmer,
        farmerName: request.farmerName,
        supplyRequest: request._id,
        receivedQuantity: accQty,
        remainingQuantity: accQty,
        reservedQuantity: 0,
        soldQuantity: 0,
        rejectedQuantity: rejQty,
        unit: request.unit,
        purchaseCostPerUnit: agreedPrice,
        sellingPricePerUnit: sellPrice,
        qualityGrade: gradeAssigned,
        qualityStatus: 'accepted',
        isSellable: true,
        binLocation: binLocation.trim() || 'BAY-A1',
        storageCondition: 'Temperature-Monitored Clean Room',
        receivedAt: new Date(),
        expiryDate,
        harvestDate: request.harvestDate,
        notes: inspectionNotes.trim()
      });

      // Record inventory movement
      await InventoryMovement.create({
        hub: request.hub,
        batch: createdBatch._id,
        batchNumber: uniqueBatchId,
        product: product._id,
        productName: product.name,
        movementType: 'receive_inbound',
        quantityDelta: accQty,
        balanceAfter: accQty,
        reason: `Inbound physical receiving & QC acceptance from ${request.farmerName} (Supply Request #${request.requestNumber})`,
        actor: req.user._id,
        actorName: req.user.name
      });

      // Synchronize product catalog stock
      await syncProductStockFromBatches(product._id, request.hub);

      // Create Farmer Settlement record for accepted produce
      const settlementNumber = `SETTL-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      const grossPayable = Math.round(accQty * agreedPrice * 100) / 100;

      await FarmerSettlement.create({
        settlementNumber,
        farmer: request.farmer,
        farmerName: request.farmerName,
        farmerPhone: request.farmerPhone,
        hub: request.hub,
        hubName: request.hubName,
        supplyRequest: request._id,
        batch: createdBatch._id,
        produceName: request.produceName,
        acceptedQuantity: accQty,
        unit: request.unit,
        ratePerUnit: agreedPrice,
        grossPayable,
        deductions: 0,
        netPayable: grossPayable,
        settlementStatus: 'approved',
        notes: `Automated settlement generation upon physical receipt and QC pass at ${request.hubName}.`
      });
    }

    // Determine final status
    let finalStatus = 'rejected';
    if (accQty > 0 && rejQty > 0) {
      finalStatus = 'partially_accepted';
    } else if (accQty > 0) {
      finalStatus = 'accepted';
    }

    request.status = finalStatus;
    request.receiving = {
      receivedQuantity: recvQty,
      acceptedQuantity: accQty,
      rejectedQuantity: rejQty,
      rejectionReason: rejectionReason.trim(),
      gradeAssigned,
      inspectionNotes: inspectionNotes.trim(),
      inspectedBy: req.user._id,
      inspectedAt: new Date(),
      agreedPurchasePricePerUnit: agreedPrice,
      batchNumber: createdBatch ? createdBatch.batchNumber : '',
      inventoryBatch: createdBatch ? createdBatch._id : null
    };

    request.statusHistory.push({
      status: finalStatus,
      note: `Received ${recvQty} ${request.unit}. Accepted: ${accQty} ${request.unit} (${gradeAssigned}). Rejected: ${rejQty} ${request.unit}. ${rejectionReason ? `Reason: ${rejectionReason}` : ''}`,
      timestamp: new Date(),
      updatedBy: req.user._id
    });

    await request.save();

    // Send notification to farmer
    await Notification.create({
      recipient: request.farmer,
      title: `Shipment ${finalStatus.replace('_', ' ').toUpperCase()} at Hub`,
      message: `Your produce delivery for #${request.requestNumber} was inspected at Mandi+ Hub. Accepted: ${accQty} ${request.unit}, Rejected: ${rejQty} ${request.unit}.`,
      type: 'order',
      link: `/seller/products`
    });

    return res.status(200).json({
      success: true,
      message: `Shipment inspection completed successfully. Status: ${finalStatus}.`,
      request,
      supplyRequest: request,
      batch: createdBatch
    });
  } catch (err) {
    next(err);
  }
};

export const getInventoryBatches = async (req, res, next) => {
  try {
    const { qualityStatus, isSellable, search, lowStock, page = 1, limit = 20 } = req.query;
    const query = {};

    if (qualityStatus && qualityStatus !== 'all') {
      query.qualityStatus = qualityStatus;
    }
    if (isSellable !== undefined) {
      query.isSellable = isSellable === 'true';
    }
    if (lowStock === 'true') {
      query.remainingQuantity = { $lte: 20 };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [batches, total] = await Promise.all([
      InventoryBatch.find(query)
        .populate('product', 'name category unit images pricePerUnit')
        .populate('sourceFarmer', 'name phone email locality')
        .populate('hub', 'name code')
        .sort({ receivedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      InventoryBatch.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      count: batches.length,
      total,
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      batches
    });
  } catch (err) {
    next(err);
  }
};

export const getBatchMovements = async (req, res, next) => {
  try {
    const { batchId, productId, limit = 50 } = req.query;
    const query = {};
    if (batchId) query.batch = batchId;
    if (productId) query.product = productId;

    const movements = await InventoryMovement.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10) || 50)
      .lean();

    return res.status(200).json({
      success: true,
      count: movements.length,
      movements
    });
  } catch (err) {
    next(err);
  }
};

export const adjustBatchStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, quantityDelta, reason, newQualityStatus } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A mandatory audit reason is required for any inventory adjustment.'
      });
    }

    const batch = await InventoryBatch.findById(id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Inventory batch not found.'
      });
    }

    const product = await Product.findById(batch.product);

    if (action === 'quarantine') {
      batch.qualityStatus = 'quarantined';
      batch.isSellable = false;
      await batch.save();

      await InventoryMovement.create({
        hub: batch.hub,
        batch: batch._id,
        batchNumber: batch.batchNumber,
        product: batch.product,
        productName: product?.name || 'Produce Item',
        movementType: 'quarantine',
        quantityDelta: 0,
        balanceAfter: batch.remainingQuantity,
        reason: `Batch quarantined: ${reason.trim()}`,
        actor: req.user._id,
        actorName: req.user.name
      });
    } else if (action === 'adjust_quantity') {
      const delta = Number(quantityDelta);
      if (isNaN(delta)) {
        return res.status(400).json({
          success: false,
          message: 'Valid quantity delta is required.'
        });
      }
      const newBalance = batch.remainingQuantity + delta;
      if (newBalance < 0) {
        return res.status(400).json({
          success: false,
          message: `Adjustment would result in negative batch inventory (${newBalance}).`
        });
      }
      batch.remainingQuantity = newBalance;
      if (newBalance === 0) {
        batch.qualityStatus = 'depleted';
        batch.isSellable = false;
      }
      await batch.save();

      await InventoryMovement.create({
        hub: batch.hub,
        batch: batch._id,
        batchNumber: batch.batchNumber,
        product: batch.product,
        productName: product?.name || 'Produce Item',
        movementType: 'manual_adjustment',
        quantityDelta: delta,
        balanceAfter: newBalance,
        reason: `Manual inventory adjustment: ${reason.trim()}`,
        actor: req.user._id,
        actorName: req.user.name
      });
    }

    await syncProductStockFromBatches(batch.product, batch.hub);

    return res.status(200).json({
      success: true,
      message: 'Batch inventory adjusted and recorded in audit log.',
      batch
    });
  } catch (err) {
    next(err);
  }
};

export const getPickQueue = async (req, res, next) => {
  try {
    const orders = await Order.find({
      status: { $in: ['confirmed', 'processing_hub', 'picking'] }
    })
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (err) {
    next(err);
  }
};

export const startPickingOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    order.status = 'picking';
    order.picking = {
      startedAt: new Date(),
      pickedBy: req.user._id
    };
    order.statusHistory.push({
      status: 'picking',
      note: `Consolidated order picking initiated by hub operator ${req.user.name}.`,
      timestamp: new Date(),
      updatedBy: req.user._id
    });

    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Picking started for order.',
      order
    });
  } catch (err) {
    next(err);
  }
};

export const updatePickItem = async (req, res, next) => {
  try {
    const { orderId, itemIndex } = req.params;
    const { pickStatus, pickedQuantity } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    const idx = parseInt(itemIndex, 10);
    if (!order.items[idx]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item index.'
      });
    }

    order.items[idx].pickStatus = pickStatus || 'picked';
    order.items[idx].pickedQuantity = pickedQuantity !== undefined
      ? Number(pickedQuantity)
      : order.items[idx].quantity;

    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Item picking status updated.',
      order
    });
  } catch (err) {
    next(err);
  }
};

export const completePickingOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    // Mark all items as picked if not already
    order.items.forEach(item => {
      if (item.pickStatus === 'pending') {
        item.pickStatus = 'picked';
        item.pickedQuantity = item.quantity;
      }
    });

    order.status = 'packing';
    order.picking.completedAt = new Date();
    order.packing = {
      startedAt: new Date(),
      packedBy: req.user._id,
      packageCount: 1
    };

    order.statusHistory.push({
      status: 'packing',
      note: 'All items picked and consolidated. Packing in progress at Mandi+ Hub.',
      timestamp: new Date(),
      updatedBy: req.user._id
    });

    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Picking completed. Order moved to packing workspace.',
      order
    });
  } catch (err) {
    next(err);
  }
};

export const completePackingOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { packageCount = 1 } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    order.status = 'ready_for_pickup';
    order.packing.completedAt = new Date();
    order.packing.packageCount = parseInt(packageCount, 10) || 1;

    // Generate 4-digit pickup OTP for secure delivery partner handover
    if (!order.pickupOtp) {
      order.pickupOtp = Math.floor(1000 + Math.random() * 9000).toString();
    }

    order.statusHistory.push({
      status: 'ready_for_pickup',
      note: `Order packed into ${order.packing.packageCount} consolidated parcel(s). Ready for pickup at Mandi+ Hub dispatch bay.`,
      timestamp: new Date(),
      updatedBy: req.user._id
    });

    await order.save();

    // Create or update DeliveryAssignment record so delivery partners see hub pickup details
    const defaultHub = await getDefaultHub();
    let assignment = await DeliveryAssignment.findOne({ order: order._id });
    if (!assignment) {
      await DeliveryAssignment.create({
        order: order._id,
        deliveryPartner: order.deliveryPartner || null,
        pickupAddress: {
          hubId: defaultHub._id,
          hubName: defaultHub.name,
          supplierName: 'Mandi+ Hub Central Dispatch',
          address: defaultHub.address.street,
          locality: defaultHub.address.locality,
          city: defaultHub.address.city,
          pincode: defaultHub.address.pincode,
          phone: defaultHub.phone
        },
        packageCount: order.packing.packageCount,
        deliveryAddress: {
          recipientName: order.shippingAddress.fullName,
          phone: order.shippingAddress.phone,
          locality: order.shippingAddress.locality,
          city: order.shippingAddress.city,
          pincode: order.shippingAddress.pincode,
          instructions: order.shippingAddress.instructions
        },
        status: order.deliveryPartner ? 'assigned' : 'assigned'
      });
    }

    // Notify buyer
    await Notification.create({
      recipient: order.buyer,
      title: 'Order Packed & Ready!',
      message: `Your order #${order.orderNumber} is packed and ready for pickup at Mandi+ Hub.`,
      type: 'order',
      link: `/orders/${order._id}`
    });

    return res.status(200).json({
      success: true,
      message: 'Order packed and marked ready for pickup from Mandi+ Hub.',
      order
    });
  } catch (err) {
    next(err);
  }
};

export const getDispatchQueue = async (req, res, next) => {
  try {
    const orders = await Order.find({
      status: { $in: ['ready_for_pickup', 'assigned'] }
    })
      .populate('deliveryPartner', 'name phone')
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (err) {
    next(err);
  }
};

export const handoverToDeliveryPartner = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { pickupOtp } = req.body;

    const order = await Order.findById(orderId).populate('deliveryPartner');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    if (!order.deliveryPartner) {
      return res.status(400).json({
        success: false,
        message: 'Cannot hand over order before a delivery partner has been assigned.'
      });
    }

    // Verify OTP if provided
    if (pickupOtp && order.pickupOtp && pickupOtp.trim() !== order.pickupOtp.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pickup verification OTP.'
      });
    }

    order.status = 'picked_up';
    order.dispatchedAt = new Date();
    order.handoverBy = req.user._id;

    order.statusHistory.push({
      status: 'picked_up',
      note: `Consolidated order package handed over at Mandi+ Hub to delivery partner ${order.deliveryPartner.name}.`,
      timestamp: new Date(),
      updatedBy: req.user._id
    });

    await order.save();

    // Update assignment status
    await DeliveryAssignment.findOneAndUpdate(
      { order: order._id },
      {
        status: 'picked_up',
        pickedUpAt: new Date(),
        pickupOtpVerified: true
      }
    );

    // Finalize inventory sales deduction from batches
    const allAllocations = order.items.flatMap(i => i.allocatedBatches || []);
    if (allAllocations.length > 0) {
      await dispatchStockSales({
        allocatedBatches: allAllocations,
        hubId: order.hub,
        orderId: order._id,
        orderNumber: order.orderNumber,
        actor: req.user
      });
    }

    // Notify buyer
    await Notification.create({
      recipient: order.buyer,
      title: 'Order Picked Up from Mandi+ Hub',
      message: `Your order #${order.orderNumber} has been collected by ${order.deliveryPartner.name} and is on its way.`,
      type: 'order',
      link: `/orders/${order._id}`
    });

    return res.status(200).json({
      success: true,
      message: 'Order handover completed. Status updated to picked_up.',
      order
    });
  } catch (err) {
    next(err);
  }
};
