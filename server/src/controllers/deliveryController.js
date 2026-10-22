import { Order } from '../models/Order.js';
import { DeliveryAssignment } from '../models/DeliveryAssignment.js';
import { Notification } from '../models/Notification.js';
import { getDefaultHub, dispatchStockSales } from '../services/hubService.js';

export const getDeliveryAssignments = async (req, res, next) => {
  try {
    const partnerId = req.user._id;
    const { status } = req.query;

    const query = { deliveryPartner: partnerId };
    if (status && status !== 'all') {
      query.status = status;
    }

    const assignments = await DeliveryAssignment.find(query)
      .populate({
        path: 'order',
        populate: { path: 'items.product', select: 'name unit images' }
      })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: assignments.length,
      assignments
    });
  } catch (err) {
    next(err);
  }
};

export const getAvailableDeliveries = async (req, res, next) => {
  try {
    // Deliveries ready for collection at Mandi+ Hub
    const defaultHub = await getDefaultHub();

    const orders = await Order.find({
      status: { $in: ['ready_for_pickup', 'confirmed', 'processing_hub'] },
      deliveryPartner: null
    })
      .sort({ createdAt: -1 })
      .lean();

    // Map each order with clear Mandi+ Hub pickup information
    const availableTasks = orders.map(order => ({
      ...order,
      pickupLocation: {
        name: defaultHub.name,
        address: `${defaultHub.address.street}, ${defaultHub.address.locality}`,
        city: defaultHub.address.city,
        phone: defaultHub.phone,
        bay: 'Mandi+ Hub Dispatch Bay 1'
      }
    }));

    return res.status(200).json({
      success: true,
      count: availableTasks.length,
      orders: availableTasks
    });
  } catch (err) {
    next(err);
  }
};

export const claimDelivery = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const partnerId = req.user._id;
    const defaultHub = await getDefaultHub();

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    if (order.deliveryPartner && order.deliveryPartner.toString() !== partnerId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'This delivery task has already been claimed by another partner.'
      });
    }

    order.deliveryPartner = partnerId;
    if (['confirmed', 'processing_hub'].includes(order.status)) {
      order.status = 'assigned';
    }
    order.statusHistory.push({
      status: order.status,
      note: `Delivery assigned to partner ${req.user.name} (${req.user.phone || 'Verified'}). Collect parcel from ${defaultHub.name}.`,
      timestamp: new Date(),
      updatedBy: partnerId
    });
    await order.save();

    // Create or update assignment record with Mandi+ Hub pickup address
    let assignment = await DeliveryAssignment.findOne({ order: order._id });
    if (!assignment) {
      assignment = await DeliveryAssignment.create({
        order: order._id,
        deliveryPartner: partnerId,
        pickupAddress: {
          hubId: defaultHub._id,
          hubName: defaultHub.name,
          supplierName: 'Mandi+ Central Fulfilment Hub',
          address: defaultHub.address.street,
          locality: defaultHub.address.locality,
          city: defaultHub.address.city,
          pincode: defaultHub.address.pincode,
          phone: defaultHub.phone
        },
        packageCount: order.packing?.packageCount || 1,
        deliveryAddress: {
          recipientName: order.shippingAddress.fullName,
          phone: order.shippingAddress.phone,
          locality: order.shippingAddress.locality,
          city: order.shippingAddress.city,
          pincode: order.shippingAddress.pincode,
          instructions: order.shippingAddress.instructions || ''
        },
        status: 'assigned'
      });
    } else {
      assignment.deliveryPartner = partnerId;
      assignment.status = 'assigned';
      assignment.pickupAddress = {
        hubId: defaultHub._id,
        hubName: defaultHub.name,
        supplierName: 'Mandi+ Central Fulfilment Hub',
        address: defaultHub.address.street,
        locality: defaultHub.address.locality,
        city: defaultHub.address.city,
        pincode: defaultHub.address.pincode,
        phone: defaultHub.phone
      };
      await assignment.save();
    }

    // Notify buyer
    await Notification.create({
      recipient: order.buyer,
      title: 'Delivery Partner Assigned',
      message: `${req.user.name} has been assigned to pick up your order from Mandi+ Hub and deliver it to you.`,
      type: 'delivery',
      link: `/orders/${order._id}`
    });

    return res.status(200).json({
      success: true,
      message: `Delivery assignment claimed. Please collect parcel from ${defaultHub.name}.`,
      assignment
    });
  } catch (err) {
    next(err);
  }
};

export const updateDeliveryStatus = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const { status, pickupOtp, proofOfDeliveryNotes = '', failureReason = '' } = req.body;

    const validStatuses = ['picked_up', 'out_for_delivery', 'delivered', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const assignment = await DeliveryAssignment.findById(assignmentId).populate('order');
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Delivery assignment not found.'
      });
    }

    if (assignment.deliveryPartner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this delivery.'
      });
    }

    const order = await Order.findById(assignment.order._id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Associated order not found.'
      });
    }

    if (status === 'picked_up') {
      if (pickupOtp && order.pickupOtp && pickupOtp.trim() !== order.pickupOtp.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid pickup verification OTP.'
        });
      }
      assignment.pickedUpAt = new Date();
      assignment.pickupOtpVerified = true;
      order.dispatchedAt = new Date();

      // Finalize batch deduction if not yet dispatched
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
    }

    if (status === 'delivered') {
      assignment.deliveredAt = new Date();
      order.paymentStatus = 'paid'; // COD collected
    }

    assignment.status = status === 'out_for_delivery' ? 'in_transit' : status;
    if (proofOfDeliveryNotes) assignment.proofOfDeliveryNotes = proofOfDeliveryNotes;
    if (failureReason) assignment.failureReason = failureReason;
    await assignment.save();

    // Sync order status
    order.status = status;
    order.statusHistory.push({
      status,
      note: proofOfDeliveryNotes || `Delivery status updated to ${status.replace(/_/g, ' ')} by ${req.user.name}.`,
      timestamp: new Date(),
      updatedBy: req.user._id
    });
    await order.save();

    // Customer Notification
    await Notification.create({
      recipient: order.buyer,
      title: `Delivery Update: ${status.replace(/_/g, ' ').toUpperCase()}`,
      message: `Your Mandi+ order #${order.orderNumber} is now ${status.replace(/_/g, ' ')}. ${proofOfDeliveryNotes ? `Note: ${proofOfDeliveryNotes}` : ''}`,
      type: 'delivery',
      link: `/orders/${order._id}`
    });

    return res.status(200).json({
      success: true,
      message: `Delivery status updated to '${status}'.`,
      assignment
    });
  } catch (err) {
    next(err);
  }
};
