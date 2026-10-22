import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: [
      'draft',
      'submitted',
      'under_review',
      'approved_for_delivery',
      'received',
      'partially_accepted',
      'accepted',
      'rejected',
      'cancelled'
    ],
    required: true
  },
  note: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { _id: false });

const receivingSchema = new mongoose.Schema({
  receivedQuantity: { type: Number, default: 0, min: 0 },
  acceptedQuantity: { type: Number, default: 0, min: 0 },
  rejectedQuantity: { type: Number, default: 0, min: 0 },
  rejectionReason: { type: String, default: '' },
  gradeAssigned: {
    type: String,
    enum: ['Grade A', 'Grade B', 'Grade C', 'FAQ', 'Rejected'],
    default: 'Grade A'
  },
  inspectionNotes: { type: String, default: '' },
  inspectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  inspectedAt: { type: Date },
  agreedPurchasePricePerUnit: { type: Number, default: null },
  batchNumber: { type: String, default: '' },
  inventoryBatch: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryBatch' }
}, { _id: false });

const farmerSupplyRequestSchema = new mongoose.Schema({
  requestNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  farmerName: { type: String, required: true },
  farmerPhone: { type: String, default: '' },
  hub: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hub',
    required: true,
    index: true
  },
  hubName: { type: String, required: true },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  produceName: {
    type: String,
    required: [true, 'Produce name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  unit: {
    type: String,
    enum: ['kg', 'quintal', 'crate', 'tonne', 'dozen'],
    default: 'kg'
  },
  proposedQuantity: {
    type: Number,
    required: [true, 'Proposed quantity is required'],
    min: [0.1, 'Quantity must be greater than zero']
  },
  proposedPricePerUnit: {
    type: Number,
    required: [true, 'Proposed price per unit is required'],
    min: [0.01, 'Price must be greater than zero']
  },
  harvestDate: {
    type: Date,
    default: Date.now
  },
  qualityGradeProposed: {
    type: String,
    enum: ['Grade A', 'Grade B', 'Grade C', 'FAQ'],
    default: 'Grade A'
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: [
      'draft',
      'submitted',
      'under_review',
      'approved_for_delivery',
      'received',
      'partially_accepted',
      'accepted',
      'rejected',
      'cancelled'
    ],
    default: 'submitted',
    index: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  reviewNotes: {
    type: String,
    default: ''
  },
  receiving: receivingSchema,
  statusHistory: [statusHistorySchema]
}, {
  timestamps: true
});

farmerSupplyRequestSchema.index({ farmer: 1, status: 1 });
farmerSupplyRequestSchema.index({ hub: 1, status: 1 });
farmerSupplyRequestSchema.index({ createdAt: -1 });

export const FarmerSupplyRequest = mongoose.model('FarmerSupplyRequest', farmerSupplyRequestSchema);
