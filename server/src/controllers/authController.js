import { User } from '../models/User.js';
import { generateToken } from '../utils/tokenUtils.js';

export const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role,
      businessName,
      locality,
      farmLocation,
      farmSizeAcres,
      primaryCrops,
      vehicleType,
      vehicleNumber
    } = req.body;

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
    let userRole = role ? role.toLowerCase() : 'buyer';
    if (userRole === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Administrator accounts cannot be created via public registration.'
      });
    }

    // Normalize email: trim and lowercase
    const normalizedEmail = email.trim().toLowerCase();

    // Enforce global email uniqueness across ALL roles
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { normalizedEmail }]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered. Please sign in with your existing account or use another email address.'
      });
    }

    const isFarmer = userRole === 'farmer' || userRole === 'seller';
    const isDelivery = userRole === 'delivery';
    const isBuyer = userRole === 'buyer';

    const approvalStatus = isBuyer ? 'not_required' : 'pending';
    const isActive = isBuyer;
    const status = isBuyer ? 'active' : 'pending_approval';

    try {
      const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        normalizedEmail,
        password,
        phone: phone ? phone.trim() : '',
        role: userRole,
        businessName: businessName ? businessName.trim() : '',
        locality: locality ? locality.trim() : '',
        approvalStatus,
        isActive,
        status,
        submittedAt: new Date(),
        sellerProfile: isFarmer ? {
          verified: false,
          farmLocation: farmLocation || locality || '',
          farmSizeAcres: farmSizeAcres || 0,
          primaryCrops: primaryCrops || []
        } : undefined,
        deliveryProfile: isDelivery ? {
          vehicleType: vehicleType || 'Two-Wheeler / Mini Truck',
          vehicleNumber: vehicleNumber || '',
          isAvailable: false
        } : undefined
      });

      // Buyer: active immediately and issued auth token
      if (isBuyer) {
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
      }

      // Farmer: pending administrator approval
      if (isFarmer) {
        return res.status(201).json({
          success: true,
          message: 'Registration Submitted Successfully! Your farmer account application has been submitted successfully. Our admin team will review your details. Your account is currently pending approval. You will be able to log in after your application is approved.',
          status: 'pending',
          approvalStatus: 'pending',
          application: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            businessName: user.businessName,
            locality: user.locality,
            approvalStatus: 'pending',
            submittedAt: user.submittedAt
          }
        });
      }

      // Delivery: pending administrator approval
      return res.status(201).json({
        success: true,
        message: 'Delivery Partner Application Submitted. Thank you for applying to join the Mandi+ delivery network. Your application is awaiting administrator review.',
        status: 'pending',
        approvalStatus: 'pending',
        application: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          locality: user.locality,
          approvalStatus: 'pending',
          submittedAt: user.submittedAt
        }
      });
    } catch (createErr) {
      // Catch concurrent duplicate key violation in MongoDB (code 11000)
      if (createErr.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered. Please sign in with your existing account or use another email address.'
        });
      }
      throw createErr;
    }
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

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ email: normalizedEmail }, { normalizedEmail }]
    }).select('+password');

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

    // Role-specific approval checks
    if (['farmer', 'seller'].includes(user.role)) {
      if (user.approvalStatus === 'pending') {
        return res.status(403).json({
          success: false,
          message: 'Your farmer account is awaiting admin approval. You can log in once your application is approved.',
          status: 'pending',
          approvalStatus: 'pending'
        });
      }
      if (user.approvalStatus === 'rejected') {
        return res.status(403).json({
          success: false,
          message: 'Your farmer application has been rejected. Please check your application status or contact support.',
          status: 'rejected',
          approvalStatus: 'rejected',
          rejectionReason: user.rejectionReason
        });
      }
      if (user.isActive === false || user.status === 'suspended') {
        return res.status(403).json({
          success: false,
          message: 'Your farmer account is currently inactive. Please contact Mandi+ support.'
        });
      }
    }

    if (user.role === 'delivery') {
      if (user.approvalStatus === 'pending') {
        return res.status(403).json({
          success: false,
          message: 'Your delivery partner account is awaiting admin approval. You can log in once your application is approved.',
          status: 'pending',
          approvalStatus: 'pending'
        });
      }
      if (user.approvalStatus === 'rejected') {
        return res.status(403).json({
          success: false,
          message: 'Your delivery partner application has been rejected. Please check your application status or contact support.',
          status: 'rejected',
          approvalStatus: 'rejected',
          rejectionReason: user.rejectionReason
        });
      }
      if (user.isActive === false || user.status === 'suspended') {
        return res.status(403).json({
          success: false,
          message: 'Your delivery partner account is currently inactive. Please contact Mandi+ support.'
        });
      }
    }

    if (user.status === 'suspended' || user.isActive === false) {
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
        approvalStatus: user.approvalStatus,
        isActive: user.isActive,
        addresses: user.addresses,
        sellerProfile: user.sellerProfile,
        deliveryProfile: user.deliveryProfile
      }
    });
  } catch (err) {
    next(err);
  }
};

export const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ email: normalizedEmail }, { normalizedEmail }]
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials.'
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This portal is strictly restricted to Mandi+ administrators.'
      });
    }

    if (user.status === 'suspended' || user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Administrator account is deactivated. Contact system administrator.'
      });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: 'Administrator logged in successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        businessName: user.businessName,
        locality: user.locality
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getApplicationStatus = async (req, res, next) => {
  try {
    const rawEmail = req.query.email || req.body?.email;

    if (!rawEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required to query application status.'
      });
    }

    const normalizedEmail = rawEmail.trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ email: normalizedEmail }, { normalizedEmail }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No registration application found for this email address.'
      });
    }

    return res.status(200).json({
      success: true,
      application: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        businessName: user.businessName,
        locality: user.locality,
        approvalStatus: user.approvalStatus || (['buyer', 'admin'].includes(user.role) ? 'not_required' : 'pending'),
        isActive: user.isActive !== undefined ? user.isActive : (user.status === 'active'),
        submittedAt: user.submittedAt || user.createdAt,
        approvedAt: user.approvedAt,
        rejectedAt: user.rejectedAt,
        rejectionReason: user.approvalStatus === 'rejected' ? user.rejectionReason : undefined
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
