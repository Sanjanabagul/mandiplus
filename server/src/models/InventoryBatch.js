import mongoose from 'mongoose';

const inventoryBatchSchema = new mongoose.Schema({
  batchNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
    uppercase: true,
    trim: true
  },
  hub: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hub',
    required: true,
    index: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  sourceFarmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  farmerName: {
    type: String,
    required: true
  },
  supplyRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FarmerSupplyRequest',
    required: true
  },
  receivedQuantity: {
    type: Number,
    required: true,
    min: [0, 'Received quantity cannot be negative']
  },
  remainingQuantity: {
    type: Number,
    required: true,
    min: [0, 'Remaining quantity cannot be negative']
  },
  reservedQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Reserved quantity cannot be negative']
  },
  soldQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Sold quantity cannot be negative']
  },
  rejectedQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Rejected quantity cannot be negative']
  },
  unit: {
    type: String,
    enum: ['kg', 'quintal', 'crate', 'tonne', 'dozen'],
    default: 'kg'
  },
  purchaseCostPerUnit: {
    type: Number,
    required: true,
    min: 0
  },
  sellingPricePerUnit: {
    type: Number,
    required: true,
    min: 0
  },
  qualityGrade: {
    type: String,
    enum: ['Grade A', 'Grade B', 'Grade C', 'FAQ'],
    default: 'Grade A'
  },
  qualityStatus: {
    type: String,
    enum: ['accepted', 'quarantined', 'expired', 'depleted'],
    default: 'accepted',
    index: true
  },
  isSellable: {
    type: Boolean,
    default: true,
    index: true
  },
  binLocation: {
    type: String,
    default: 'BAY-A1',
    trim: true
  },
  storageCondition: {
    type: String,
    default: 'Ambient Clean Room'
  },
  receivedAt: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    default: null
  },
  harvestDate: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

inventoryBatchSchema.index({ hub: 1, product: 1, isSellable: 1 });
inventoryBatchSchema.index({ hub: 1, qualityStatus: 1 });

export const InventoryBatch = mongoose.model('InventoryBatch', inventoryBatchSchema);
