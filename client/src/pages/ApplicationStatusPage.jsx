import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail, Search, Clock, CheckCircle2, XCircle, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { authService } from '../services/authService.js';

export const ApplicationStatusPage = () => {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [application, setApplication] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchStatus = async (queryEmail) => {
    if (!queryEmail) return;
    setLoading(true);
    setErrorMessage('');
    setApplication(null);

    try {
      const res = await authService.getApplicationStatus(queryEmail.trim().toLowerCase());
      if (res.success) {
        setApplication(res.application);
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'No application record found for this email address.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialEmail) {
      fetchStatus(initialEmail);
    }
  }, [initialEmail]);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchStatus(email);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-md w-full p-8 animate-fade-in">
        
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-1.5 mb-2">
            <span className="text-2xl font-black italic tracking-wider text-mandi-blue">
              Mandi<span className="text-yellow-400">+</span>
            </span>
            <span className="text-xl">🌾</span>
          </Link>
          <h2 className="text-xl font-bold text-mandi-navy">Check Application Status</h2>
          <p className="text-xs text-mandi-muted mt-1">
            Track approval progress for farmer or delivery partner registrations
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 mb-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-1 text-xs">Registered Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@business.com"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mandi-blue focus:outline-none text-xs"
                required
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-mandi-blue hover:bg-mandi-blue-dark disabled:bg-gray-200 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
          >
            {loading ? <span>Searching...</span> : (
              <>
                <Search className="w-4 h-4" />
                <span>Lookup Application</span>
              </>
            )}
          </button>
        </form>

        {errorMessage && (
          <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs mb-4 flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {application && (
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 animate-fade-in">
            {/* Status Header */}
            <div className="text-center mb-4">
              {application.approvalStatus === 'pending' && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Pending Administrator Review</span>
                </div>
              )}

              {application.approvalStatus === 'approved' && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Application Approved</span>
                </div>
              )}

              {application.approvalStatus === 'rejected' && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span>Application Not Approved</span>
                </div>
              )}

              {application.approvalStatus === 'not_required' && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Standard Active Account</span>
                </div>
              )}
            </div>

            {/* Applicant Details */}
            <div className="text-xs space-y-2 border-t border-b border-gray-200 py-3 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Applicant:</span>
                <span className="font-bold text-gray-800">{application.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Account Type:</span>
                <span className="font-bold uppercase text-mandi-blue">{application.role}</span>
              </div>
              {application.businessName && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Business / Farm:</span>
                  <span className="font-bold text-gray-800">{application.businessName}</span>
                </div>
              )}
              {application.submittedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Submitted On:</span>
                  <span className="text-gray-700">
                    {new Date(application.submittedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Status-specific Guidance */}
            {application.approvalStatus === 'pending' && (
              <p className="text-[11px] text-gray-600 text-center mb-4">
                Our verification team is reviewing your farm/vehicle details and APMC documentation. Please check back shortly.
              </p>
            )}

            {application.approvalStatus === 'approved' && (
              <div className="text-center space-y-3">
                <p className="text-[11px] text-emerald-700 font-semibold">
                  Congratulations! Your application has been approved. You can now sign in to your dashboard.
                </p>
                <Link
                  to="/login"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <span>Sign In to Your Account</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {application.approvalStatus === 'rejected' && (
              <div className="space-y-3">
                {application.rejectionReason && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200">
                    <span className="font-bold block mb-1">Administrative Feedback:</span>
                    <span>{application.rejectionReason}</span>
                  </div>
                )}
                <p className="text-[11px] text-gray-500 text-center">
                  If you have questions or wish to appeal, please contact Mandi+ support at support@mandiplus.com.
                </p>
              </div>
            )}

            {application.approvalStatus === 'not_required' && (
              <Link
                to="/login"
                className="w-full bg-mandi-blue hover:bg-mandi-blue-dark text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}

          </div>
        )}

        <div className="text-center text-xs text-gray-500 mt-6">
          <Link to="/login" className="text-mandi-blue font-bold hover:underline">
            Return to Login
          </Link>
          {' • '}
          <Link to="/register" className="text-gray-600 hover:text-mandi-blue hover:underline">
            Submit New Application
          </Link>
        </div>

      </div>
    </div>
  );
};
