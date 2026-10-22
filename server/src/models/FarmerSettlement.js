import mongoose from 'mongoose';

const farmerSettlementSchema = new mongoose.Schema({
  settlementNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
    uppercase: true
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
    required: true
  },
  hubName: { type: String, required: true },
  supplyRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FarmerSupplyRequest',
    required: true
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryBatch',
    default: null
  },
  produceName: { type: String, required: true },
  acceptedQuantity: { type: Number, required: true, min: 0 },
  unit: { type: String, default: 'kg' },
  ratePerUnit: { type: Number, required: true, min: 0 },
  grossPayable: { type: Number, required: true, min: 0 },
  deductions: { type: Number, default: 0, min: 0 },
  netPayable: { type: Number, required: true, min: 0 },
  paidAmount: { type: Number, default: 0, min: 0 },
  settlementStatus: {
    type: String,
    enum: ['pending', 'approved', 'processing', 'settled', 'disputed'],
    default: 'pending',
    index: true
  },
  paymentReference: { type: String, default: '' },
  settledAt: { type: Date, default: null },
  notes: { type: String, default: '' }
}, {
  timestamps: true
});

farmerSettlementSchema.index({ farmer: 1, settlementStatus: 1 });
farmerSettlementSchema.index({ hub: 1, createdAt: -1 });

export const FarmerSettlement = mongoose.model('FarmerSettlement', farmerSettlementSchema);
