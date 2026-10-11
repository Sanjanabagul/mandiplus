import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await login(email, password);
      if (res.success) {
        if (res.user.role === 'seller') navigate('/seller/dashboard');
        else if (res.user.role === 'admin') navigate('/admin/dashboard');
        else if (res.user.role === 'delivery') navigate('/delivery/dashboard');
        else navigate(redirect);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail, demoRole) => {
    setEmail(demoEmail);
    setPassword('Password123!');
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
          <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs mb-4 flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
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
            className="w-full bg-mandi-blue hover:bg-mandi-blue-dark disabled:bg-gray-200 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-sm mt-2"
          >
            {loading ? <span>Authenticating...</span> : <span>Sign In</span>}
          </button>
        </form>

        <div className="text-center text-xs text-gray-500 mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-mandi-blue font-bold hover:underline">
            Register here
          </Link>
        </div>

        {/* Quick Demo Credentials Panel for Pair Programming / Review */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 text-center mb-3">
            Quick One-Click Test Accounts
          </h4>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              onClick={() => fillDemoAccount('buyer@mandiplus.com', 'buyer')}
              className="p-2 rounded-lg border border-gray-200 hover:border-mandi-blue hover:bg-blue-50/50 text-left transition-colors"
            >
              <div className="font-bold text-mandi-navy">🛒 Retail Buyer</div>
              <div className="text-gray-400 text-[10px]">buyer@mandiplus.com</div>
            </button>

            <button
              onClick={() => fillDemoAccount('farmer@mandiplus.com', 'seller')}
              className="p-2 rounded-lg border border-gray-200 hover:border-mandi-green hover:bg-green-50/50 text-left transition-colors"
            >
              <div className="font-bold text-mandi-green">🌾 Farmer Seller</div>
              <div className="text-gray-400 text-[10px]">farmer@mandiplus.com</div>
            </button>

            <button
              onClick={() => fillDemoAccount('delivery@mandiplus.com', 'delivery')}
              className="p-2 rounded-lg border border-gray-200 hover:border-amber-500 hover:bg-amber-50/50 text-left transition-colors"
            >
              <div className="font-bold text-amber-700">🚚 Delivery Fleet</div>
              <div className="text-gray-400 text-[10px]">delivery@mandiplus.com</div>
            </button>

            <button
              onClick={() => fillDemoAccount('admin@mandiplus.com', 'admin')}
              className="p-2 rounded-lg border border-gray-200 hover:border-red-500 hover:bg-red-50/50 text-left transition-colors"
            >
              <div className="font-bold text-red-600">🛡️ Administrator</div>
              <div className="text-gray-400 text-[10px]">admin@mandiplus.com</div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
