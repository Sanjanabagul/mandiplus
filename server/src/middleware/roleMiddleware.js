export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Support interchangeable farmer/seller role permissions
    const normalizedAllowedRoles = new Set(roles);
    if (normalizedAllowedRoles.has('seller') || normalizedAllowedRoles.has('farmer')) {
      normalizedAllowedRoles.add('seller');
      normalizedAllowedRoles.add('farmer');
    }

    if (!normalizedAllowedRoles.has(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user.role}' is not authorized to access this resource.`
      });
    }

    next();
  };
};

export const authorizeRoles = authorize;

export const requireApprovedAccount = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  const role = req.user.role;
  const requiresApproval = ['farmer', 'seller', 'delivery'].includes(role);

  if (requiresApproval) {
    if (req.user.approvalStatus === 'pending') {
      return res.status(403).json({
        success: false,
        message: `Your ${role} account is awaiting administrator approval.`
      });
    }

    if (req.user.approvalStatus === 'rejected') {
      return res.status(403).json({
        success: false,
        message: `Your ${role} application was not approved. Rejection reason: ${req.user.rejectionReason || 'Contact support'}`
      });
    }

    if (req.user.approvalStatus !== 'approved' || req.user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: `Your ${role} account is not approved or is currently inactive.`
      });
    }
  }

  next();
};

export const requireActiveAccount = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  if (req.user.status === 'suspended' || req.user.isActive === false) {
    return res.status(403).json({
      success: false,
      message: 'Your account has been deactivated or suspended. Please contact Mandi+ support.'
    });
  }

  next();
};
