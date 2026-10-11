import mongoose from 'mongoose';

const deliveryAssignmentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true
  },
  deliveryPartner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  pickupAddress: {
    supplierName: { type: String, required: true },
    locality: { type: String, required: true },
    phone: { type: String, default: '' },
    pincode: { type: String, default: '' }
  },
  deliveryAddress: {
    recipientName: { type: String, required: true },
    phone: { type: String, required: true },
    locality: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
    instructions: { type: String, default: '' }
  },
  status: {
    type: String,
    enum: ['assigned', 'picked_up', 'in_transit', 'delivered', 'failed'],
    default: 'assigned',
    index: true
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  pickedUpAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  proofOfDeliveryNotes: {
    type: String,
    default: ''
  },
  failureReason: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export const DeliveryAssignment = mongoose.model('DeliveryAssignment', deliveryAssignmentSchema);
