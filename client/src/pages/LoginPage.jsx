import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, Clock, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPendingOrRejected, setIsPendingOrRejected] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setErrorMessage('');
    setIsPendingOrRejected(false);

    try {
      const res = await login(email.trim().toLowerCase(), password);
      if (res.success) {
        if (res.user.role === 'seller' || res.user.role === 'farmer') navigate('/seller/dashboard');
        else if (res.user.role === 'admin') navigate('/admin/dashboard');
        else if (res.user.role === 'delivery') navigate('/delivery/dashboard');
        else navigate(redirect);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please verify credentials.';
      setErrorMessage(msg);
      if (msg.includes('awaiting admin approval') || msg.includes('has been rejected') || msg.includes('pending')) {
        setIsPendingOrRejected(true);
      }
    } finally {
      setLoading(false);
    }
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
          <h2 className="text-xl font-bold text-mandi-navy">Sign In to Your Account</h2>
          <p className="text-xs text-mandi-muted mt-1">Access orders, wholesale catalogs, or seller dashboard</p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs mb-4 border border-red-200 space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            {isPendingOrRejected && (
              <div className="pt-1 border-t border-red-200/60">
                <Link
                  to={`/application-status?email=${encodeURIComponent(email.trim().toLowerCase())}`}
                  className="font-bold underline hover:text-red-900 inline-flex items-center gap-1"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Check your application status details</span>
                </Link>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@business.com"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mandi-blue focus:outline-none"
                required
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mandi-blue focus:outline-none"
                required
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-mandi-blue hover:bg-mandi-blue-dark disabled:bg-gray-200 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-sm mt-2 cursor-pointer"
          >
            {loading ? <span>Authenticating...</span> : <span>Sign In</span>}
          </button>
        </form>

        <div className="text-center text-xs text-gray-500 mt-4 space-y-1">
          <div>
            Don't have an account?{' '}
            <Link to="/register" className="text-mandi-blue font-bold hover:underline">
              Register here
            </Link>
          </div>
          <div>
            Applied as Farmer or Delivery Fleet?{' '}
            <Link to="/application-status" className="text-gray-700 font-semibold hover:text-mandi-blue hover:underline">
              Check Application Status
            </Link>
          </div>
          <div className="pt-3 border-t border-gray-100 mt-3">
            <Link
              to="/admin/login"
              className="w-full bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 text-slate-800 font-semibold py-2.5 px-3 rounded-xl flex items-center justify-between text-xs transition-colors group shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-gray-900 block leading-tight">Mandi+ Administrator?</span>
                  <span className="text-[10px] text-gray-500 block leading-tight">Access Secure Admin Portal & Applications Review</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          </div>
        </div>


      </div>
    </div>
  );
};
