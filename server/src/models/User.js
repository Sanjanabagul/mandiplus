import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  streetAddress: { type: String, required: true, trim: true },
  locality: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  pincode: { type: String, required: true, trim: true },
  landmark: { type: String, default: '' },
  isDefault: { type: Boolean, default: false },
  deliveryInstructions: { type: String, default: '' }
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your full name'],
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: [true, 'Please provide an email address'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  role: {
    type: String,
    enum: {
      values: ['buyer', 'seller', 'delivery', 'admin'],
      message: '{VALUE} is not a valid user role'
    },
    default: 'buyer'
  },
  businessName: {
    type: String,
    trim: true,
    default: ''
  },
  locality: {
    type: String,
    trim: true,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'pending_approval'],
    default: 'active'
  },
  addresses: [addressSchema],
  sellerProfile: {
    verified: { type: Boolean, default: false },
    farmLocation: { type: String, default: '' },
    farmSizeAcres: { type: Number, default: 0 },
    primaryCrops: [{ type: String }],
    totalRatings: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    bankDetails: {
      accountHolder: { type: String, default: '' },
      bankName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' }
    }
  },
  deliveryProfile: {
    vehicleType: { type: String, default: 'Two-Wheeler / Mini Truck' },
    vehicleNumber: { type: String, default: '' },
    drivingLicense: { type: String, default: '' },
    isAvailable: { type: Boolean, default: true },
    activeDeliveriesCount: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Index for role lookups
userSchema.index({ role: 1 });

// Password hashing middleware
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model('User', userSchema);
