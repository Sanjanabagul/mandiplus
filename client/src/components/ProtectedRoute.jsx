import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-mandi-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Not logged in -> redirect to login (or admin login if accessing admin)
  if (!isAuthenticated) {
    const isTargetingAdmin = location.pathname.startsWith('/admin');
    const loginUrl = isTargetingAdmin
      ? `/admin/login?redirect=${encodeURIComponent(location.pathname)}`
      : `/login?redirect=${encodeURIComponent(location.pathname)}`;
    return <Navigate to={loginUrl} replace />;
  }

  // Pending approval account check for farmer/delivery
  if (
    ['farmer', 'seller', 'delivery'].includes(user?.role) &&
    user?.approvalStatus === 'pending'
  ) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white rounded-2xl border border-amber-200 p-8 text-center shadow-lg animate-fade-in">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <Clock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-mandi-navy mb-2">Account Pending Approval</h2>
          <p className="text-xs text-gray-600 mb-6 leading-relaxed">
            Your {user.role === 'delivery' ? 'delivery partner' : 'farmer'} application is currently awaiting administrator review. Protected dashboard tools unlock once approved.
          </p>
          <div className="flex flex-col gap-2.5">
            <Link
              to="/application-status"
              className="bg-mandi-blue text-white font-bold py-2.5 px-4 rounded-xl text-xs hover:bg-mandi-blue-dark transition-colors shadow-sm"
            >
              Check Application Status
            </Link>
            <Link
              to="/"
              className="bg-gray-100 text-gray-700 font-bold py-2.5 px-4 rounded-xl text-xs hover:bg-gray-200 transition-colors"
            >
              Return to Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Rejected account check
  if (
    ['farmer', 'seller', 'delivery'].includes(user?.role) &&
    user?.approvalStatus === 'rejected'
  ) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 p-8 text-center shadow-lg animate-fade-in">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-red-700 mb-2">Application Not Approved</h2>
          <p className="text-xs text-gray-600 mb-2 leading-relaxed">
            Your application to join Mandi+ as a {user.role} was not approved by administration.
          </p>
          {user.rejectionReason && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs mb-6 text-left border border-red-200">
              <span className="font-bold block mb-1">Reason:</span>
              <span>{user.rejectionReason}</span>
            </div>
          )}
          <Link
            to="/application-status"
            className="inline-block bg-gray-100 text-gray-700 font-bold py-2.5 px-6 rounded-xl text-xs hover:bg-gray-200 transition-colors"
          >
            Review Status Details
          </Link>
        </div>
      </div>
    );
  }

  // Suspended or inactive account check
  if (user?.status === 'suspended' || user?.isActive === false) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 p-8 text-center shadow-lg animate-fade-in">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-red-700 mb-2">Account Deactivated</h2>
          <p className="text-xs text-gray-600 mb-6">
            Your account is currently suspended or inactive. Please contact Mandi+ support.
          </p>
          <Link
            to="/"
            className="bg-gray-100 text-gray-700 font-bold py-2.5 px-6 rounded-xl text-xs hover:bg-gray-200 transition-colors"
          >
            Return to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  // Allowed roles check (with seller/farmer interchangeable compatibility)
  if (allowedRoles) {
    const effectiveRoles = new Set(allowedRoles);
    if (effectiveRoles.has('seller') || effectiveRoles.has('farmer')) {
      effectiveRoles.add('seller');
      effectiveRoles.add('farmer');
    }

    if (!effectiveRoles.has(user?.role)) {
      if (allowedRoles.includes('admin') && allowedRoles.length === 1) {
        return <Navigate to="/admin/login" replace />;
      }

      return (
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Access Restricted</h2>
          <p className="text-xs text-gray-600 mb-4">
            Your account role ({user?.role}) does not have permission to view this section.
          </p>
          <Link
            to="/"
            className="inline-block bg-mandi-blue text-white font-bold py-2 px-4 rounded-lg text-xs"
          >
            Return to Marketplace
          </Link>
        </div>
      );
    }
  }

  return children;
};
