import mongoose from 'mongoose';

const priceHistorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  pricePerUnit: {
    type: Number,
    required: true
  },
  effectiveDate: {
    type: Date,
    default: Date.now
  }
});

priceHistorySchema.index({ product: 1, effectiveDate: -1 });

export const PriceHistory = mongoose.model('PriceHistory', priceHistorySchema);
