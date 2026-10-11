import { User } from '../models/User.js';
import { generateToken } from '../utils/tokenUtils.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, businessName, locality } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Disallow public admin registration
    let userRole = role || 'buyer';
    if (userRole === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Administrator accounts cannot be created via public registration.'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      role: userRole,
      businessName: businessName || '',
      locality: locality || '',
      status: userRole === 'seller' ? 'active' : 'active' // Active by default for smooth onboarding
    });

    const token = generateToken(user._id, user.role);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        businessName: user.businessName,
        locality: user.locality,
        addresses: user.addresses
      }
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact Mandi+ support.'
      });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        businessName: user.businessName,
        locality: user.locality,
        avatar: user.avatar,
        addresses: user.addresses,
        sellerProfile: user.sellerProfile,
        deliveryProfile: user.deliveryProfile
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user
  });
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, businessName, locality, avatar, farmLocation, farmSizeAcres, primaryCrops } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (businessName !== undefined) user.businessName = businessName;
    if (locality !== undefined) user.locality = locality;
    if (avatar) user.avatar = avatar;

    if (user.role === 'seller') {
      if (farmLocation) user.sellerProfile.farmLocation = farmLocation;
      if (farmSizeAcres) user.sellerProfile.farmSizeAcres = farmSizeAcres;
      if (primaryCrops) user.sellerProfile.primaryCrops = primaryCrops;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user
    });
  } catch (err) {
    next(err);
  }
};

export const addAddress = async (req, res, next) => {
  try {
    const { fullName, phone, streetAddress, locality, city, state, pincode, landmark, isDefault, deliveryInstructions } = req.body;

    if (!fullName || !phone || !streetAddress || !locality || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'All address fields are required.'
      });
    }

    const user = await User.findById(req.user._id);

    if (isDefault || user.addresses.length === 0) {
      user.addresses.forEach(addr => { addr.isDefault = false; });
    }

    user.addresses.push({
      fullName,
      phone,
      streetAddress,
      locality,
      city,
      state,
      pincode,
      landmark: landmark || '',
      isDefault: isDefault || user.addresses.length === 0,
      deliveryInstructions: deliveryInstructions || ''
    });

    await user.save();

    return res.status(201).json({
      success: true,
      message: 'Address added successfully.',
      addresses: user.addresses
    });
  } catch (err) {
    next(err);
  }
};

export const updateAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user._id);

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found.'
      });
    }

    if (req.body.isDefault) {
      user.addresses.forEach(addr => { addr.isDefault = false; });
    }

    Object.assign(address, req.body);
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Address updated successfully.',
      addresses: user.addresses
    });
  } catch (err) {
    next(err);
  }
};

export const deleteAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user._id);

    user.addresses.pull({ _id: addressId });
    if (user.addresses.length > 0 && !user.addresses.some(a => a.isDefault)) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Address deleted successfully.',
      addresses: user.addresses
    });
  } catch (err) {
    next(err);
  }
};
