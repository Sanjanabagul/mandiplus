import mongoose from 'mongoose';

const bulkTierSchema = new mongoose.Schema({
  minQuantity: { type: Number, required: true },
  pricePerUnit: { type: Number, required: true },
  discountPercent: { type: Number, default: 0 }
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Produce name is required'],
    trim: true,
    maxlength: 150
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  cropType: {
    type: String,
    trim: true,
    default: ''
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sellerName: {
    type: String,
    required: true
  },
  images: [{
    type: String,
    default: []
  }],
  unit: {
    type: String,
    enum: ['kg', 'quintal', 'crate', 'tonne', 'dozen'],
    default: 'kg'
  },
  pricePerUnit: {
    type: Number,
    required: [true, 'Price per unit is required'],
    min: [0.01, 'Price must be greater than zero']
  },
  originalPrice: {
    type: Number,
    default: null
  },
  stockQuantity: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock quantity cannot be negative'],
    default: 0
  },
  minOrderQuantity: {
    type: Number,
    required: [true, 'Minimum order quantity is required'],
    min: [1, 'Minimum order quantity must be at least 1'],
    default: 1
  },
  bulkPricingTiers: [bulkTierSchema],
  qualityGrade: {
    type: String,
    enum: ['Grade A', 'Grade B', 'Grade C', 'FAQ'],
    default: 'Grade A'
  },
  qualityGradeDetails: {
    assessedAt: { type: Date },
    assessedBy: { type: String, default: 'Manual' },
    confidence: { type: Number },
    notes: { type: String, default: '' },
    defectRatePercent: { type: Number, default: 0 }
  },
  harvestDate: {
    type: Date,
    default: Date.now
  },
  isOrganic: {
    type: Boolean,
    default: false
  },
  organicCertNumber: {
    type: String,
    default: ''
  },
  productionMethod: {
    type: String,
    enum: ['Open Field', 'Greenhouse', 'Hydroponic', 'Organic Farmed', 'Traditional'],
    default: 'Traditional'
  },
  pickupLocality: {
    type: String,
    required: true,
    trim: true
  },
  pincode: {
    type: String,
    trim: true,
    default: ''
  },
  coordinates: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null }
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved' // Set to approved for direct catalog display in dev mode
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Full-text search index on name, description, category, cropType, and pickupLocality
productSchema.index({
  name: 'text',
  cropType: 'text',
  description: 'text',
  pickupLocality: 'text',
  category: 'text'
}, {
  weights: {
    name: 10,
    cropType: 8,
    category: 5,
    pickupLocality: 3,
    description: 1
  },
  name: 'ProductTextIndex'
});

productSchema.index({ category: 1, pricePerUnit: 1 });
productSchema.index({ seller: 1 });
productSchema.index({ isAvailable: 1, approvalStatus: 1 });

export const Product = mongoose.model('Product', productSchema);
