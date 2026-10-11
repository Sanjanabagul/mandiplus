import { Order } from '../models/Order.js';
import { DeliveryAssignment } from '../models/DeliveryAssignment.js';
import { Notification } from '../models/Notification.js';

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
    // Orders that are ready for pickup and have no delivery partner assigned yet
    const orders = await Order.find({
      status: { $in: ['ready_for_pickup', 'confirmed'] },
      deliveryPartner: null
    })
      .sort({ createdAt: -1 })
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

export const claimDelivery = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const partnerId = req.user._id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    if (order.deliveryPartner) {
      return res.status(400).json({
        success: false,
        message: 'This delivery has already been assigned to another partner.'
      });
    }

    order.deliveryPartner = partnerId;
    order.statusHistory.push({
      status: order.status,
      note: `Delivery assigned to partner ${req.user.name} (${req.user.phone || 'Verified'})`,
      timestamp: new Date(),
      updatedBy: partnerId
    });
    await order.save();

    // Create or update assignment record
    let assignment = await DeliveryAssignment.findOne({ order: order._id });
    if (!assignment) {
      assignment = await DeliveryAssignment.create({
        order: order._id,
        deliveryPartner: partnerId,
        pickupAddress: {
          supplierName: order.items[0]?.sellerName || 'Farmer Hub',
          locality: order.items[0]?.locality || 'Local Mandi Hub',
          phone: ''
        },
        deliveryAddress: {
          recipientName: order.shippingAddress.fullName,
          phone: order.shippingAddress.phone,
          locality: order.shippingAddress.locality,
          city: order.shippingAddress.city,
          pincode: order.shippingAddress.pincode,
          instructions: order.shippingAddress.instructions
        },
        status: 'assigned'
      });
    } else {
      assignment.deliveryPartner = partnerId;
      assignment.status = 'assigned';
      await assignment.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Delivery assignment claimed successfully.',
      assignment
    });
  } catch (err) {
    next(err);
  }
};

export const updateDeliveryStatus = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const { status, proofOfDeliveryNotes = '', failureReason = '' } = req.body;

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

    assignment.status = status === 'out_for_delivery' ? 'in_transit' : status;
    if (proofOfDeliveryNotes) assignment.proofOfDeliveryNotes = proofOfDeliveryNotes;
    if (failureReason) assignment.failureReason = failureReason;

    if (status === 'picked_up') assignment.pickedUpAt = new Date();
    if (status === 'delivered') assignment.deliveredAt = new Date();

    await assignment.save();

    // Sync order status
    const order = await Order.findById(assignment.order._id);
    if (order) {
      order.status = status;
      if (status === 'delivered') {
        order.paymentStatus = 'paid'; // COD collected
      }
      order.statusHistory.push({
        status,
        note: proofOfDeliveryNotes || `Delivery status changed by ${req.user.name}`,
        timestamp: new Date(),
        updatedBy: req.user._id
      });
      await order.save();

      // Notify customer
      await Notification.create({
        recipient: order.buyer,
        title: `Delivery Update: ${status.replace(/_/g, ' ').toUpperCase()}`,
        message: `Order #${order.orderNumber} is now ${status.replace(/_/g, ' ')}. ${proofOfDeliveryNotes ? `Note: ${proofOfDeliveryNotes}` : ''}`,
        type: 'delivery',
        link: `/orders/${order._id}`
      });
    }

    return res.status(200).json({
      success: true,
      message: `Delivery updated to '${status}'.`,
      assignment
    });
  } catch (err) {
    next(err);
  }
};
