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
    required: false,
    default: null,
    index: true
  },
  pickupAddress: {
    hubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hub', default: null },
    hubName: { type: String, default: 'Mandi+ Hub Central' },
    supplierName: { type: String, default: 'Mandi+ Hub Fulfilment Facility' },
    address: { type: String, default: 'Mandi+ Hub Dispatch Bay 1' },
    locality: { type: String, default: 'Central Agricultural Hub' },
    city: { type: String, default: 'Pune' },
    phone: { type: String, default: '+91-1800-MANDI-HUB' },
    pincode: { type: String, default: '411001' }
  },
  packageCount: {
    type: Number,
    default: 1
  },
  pickupOtpVerified: {
    type: Boolean,
    default: false
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
