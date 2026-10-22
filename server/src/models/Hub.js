import mongoose from 'mongoose';

const hubSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Hub name is required'],
    trim: true,
    maxlength: 150
  },
  code: {
    type: String,
    required: [true, 'Hub unique code is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  address: {
    street: { type: String, required: true, trim: true },
    locality: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null }
    }
  },
  phone: {
    type: String,
    trim: true,
    default: '+91-1800-MANDI-HUB'
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: 'hub@mandiplus.com'
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  capacityMetricTons: {
    type: Number,
    default: 50
  },
  operatingHours: {
    open: { type: String, default: '05:00 AM' },
    close: { type: String, default: '10:00 PM' }
  }
}, {
  timestamps: true
});

hubSchema.index({ 'address.city': 1, 'address.pincode': 1 });

export const Hub = mongoose.model('Hub', hubSchema);
