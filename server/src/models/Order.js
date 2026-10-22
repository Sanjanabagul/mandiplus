import mongoose from 'mongoose';

const allocatedBatchSchema = new mongoose.Schema({
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryBatch'
  },
  batchNumber: { type: String, default: '' },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  farmerName: { type: String, default: 'Mandi+ Partner Farmer' },
  quantity: { type: Number, required: true },
  purchaseCost: { type: Number, default: 0 }
}, { _id: false });

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true },
  image: { type: String, default: '' },
  category: { type: String, default: '' },
  unit: { type: String, default: 'kg' },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null
  },
  sellerName: { type: String, default: 'Mandi+ Hub' },
  unitPrice: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true },
  allocatedBatches: [allocatedBatchSchema],
  pickStatus: {
    type: String,
    enum: ['pending', 'picked', 'shortage'],
    default: 'pending'
  },
  pickedQuantity: {
    type: Number,
    default: 0
  }
}, { _id: false });

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: [
      'pending',
      'confirmed',
      'processing_hub',
      'picking',
      'packing',
      'ready_for_pickup',
      'assigned',
      'picked_up',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'preparing' // Legacy fallback
    ],
    required: true
  },
  note: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  hub: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hub',
    default: null,
    index: true
  },
  hubName: {
    type: String,
    default: 'Mandi+ Hub Central'
  },
  fulfilledBy: {
    type: String,
    default: 'Mandi+ Hub'
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  buyerName: { type: String, required: true },
  buyerEmail: { type: String, required: true },
  buyerPhone: { type: String, required: true },
  items: [orderItemSchema],
  subtotal: { type: Number, required: true },
  deliveryCharge: { type: Number, default: 0 },
  discountTotal: { type: Number, default: 0 },
  taxTotal: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    streetAddress: { type: String, required: true },
    locality: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    instructions: { type: String, default: '' }
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'test_simulation', 'online_gateway'],
    default: 'cod'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  status: {
    type: String,
    enum: [
      'pending',
      'confirmed',
      'processing_hub',
      'picking',
      'packing',
      'ready_for_pickup',
      'assigned',
      'picked_up',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'preparing' // Legacy fallback
    ],
    default: 'pending',
    index: true
  },
  statusHistory: [statusHistorySchema],
  picking: {
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    pickedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    notes: { type: String, default: '' }
  },
  packing: {
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    packedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    packageCount: { type: Number, default: 1 }
  },
  pickupOtp: {
    type: String,
    default: function() {
      return Math.floor(1000 + Math.random() * 9000).toString();
    }
  },
  handoverBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  dispatchedAt: {
    type: Date,
    default: null
  },
  deliveryPartner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  estimatedDeliveryDate: {
    type: Date
  },
  cancellationReason: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'items.seller': 1 });

export const Order = mongoose.model('Order', orderSchema);
