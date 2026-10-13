import { verifyToken } from '../utils/tokenUtils.js';
import { User } from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please log in to proceed.'
    });
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.'
      });
    }

    if (user.status === 'suspended' || user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account is currently inactive or has been suspended. Please contact Mandi+ support.'
      });
    }

    if (['farmer', 'seller', 'delivery'].includes(user.role)) {
      if (user.approvalStatus === 'pending') {
        return res.status(403).json({
          success: false,
          message: `Access denied. Your ${user.role} account is awaiting administrator approval.`
        });
      }
      if (user.approvalStatus === 'rejected') {
        return res.status(403).json({
          success: false,
          message: `Access denied. Your ${user.role} application was rejected.`
        });
      }
      if (user.approvalStatus !== 'approved') {
        return res.status(403).json({
          success: false,
          message: `Access denied. Your ${user.role} account has not been approved.`
        });
      }
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.'
    });
  }
};

export const authenticateUser = protect;

export const optionalProtect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-password');
    req.user = user && user.status !== 'suspended' && user.isActive !== false ? user : null;
  } catch {
    req.user = null;
  }
  next();
};
