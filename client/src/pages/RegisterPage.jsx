import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { User, Mail, Lock, Phone, Store, Truck, ShoppingBag, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') || 'buyer';
  const { register } = useAuth();

  const [role, setRole] = useState(defaultRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [locality, setLocality] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('Please accept Mandi+ terms and conditions.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await register({
        name,
        email,
        password,
        phone,
        role,
        businessName,
        locality
      });

      if (res.success) {
        if (role === 'seller') navigate('/seller/dashboard');
        else if (role === 'delivery') navigate('/delivery/dashboard');
        else navigate('/');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-lg w-full p-8 animate-fade-in">

        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-1.5 mb-2">
            <span className="text-2xl font-black italic tracking-wider text-mandi-blue">
              Mandi<span className="text-yellow-400">+</span>
            </span>
            <span className="text-xl">🌾</span>
          </Link>
          <h2 className="text-xl font-bold text-mandi-navy">Join Mandi+ Agricultural Platform</h2>
          <p className="text-xs text-mandi-muted mt-1">Select your role to unlock customized tools</p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs mb-4 flex items-center gap-2 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-xl mb-6 text-xs font-bold text-center">
          <button
            type="button"
            onClick={() => setRole('buyer')}
            className={`py-2 px-1 rounded-lg transition-all flex flex-col items-center gap-1 ${
              role === 'buyer' ? 'bg-white text-mandi-blue shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Buyer / Retail</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('seller')}
            className={`py-2 px-1 rounded-lg transition-all flex flex-col items-center gap-1 ${
              role === 'seller' ? 'bg-white text-mandi-green shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Farmer / Seller</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('delivery')}
            className={`py-2 px-1 rounded-lg transition-all flex flex-col items-center gap-1 ${
              role === 'delivery' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Delivery Fleet</span>
          </button>
        </div>

        <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ramesh Sharma"
                className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mandi-blue focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Phone Number *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98220 00000"
                className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mandi-blue focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@business.com"
              className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mandi-blue focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                {role === 'seller' ? 'Farm / Business Name' : 'Company / Store Name'}
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder={role === 'seller' ? 'Sahyadri Agro' : 'Annapurna Foods'}
                className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mandi-blue focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">APMC / Locality</label>
              <input
                type="text"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder="e.g. Pune Market Yard"
                className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mandi-blue focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Password *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mandi-blue focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Confirm Password *</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mandi-blue focus:outline-none"
                required
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-gray-600 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="rounded text-mandi-blue"
            />
            <span>I agree to Mandi+ terms of trade & quality assurance guidelines.</span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-mandi-blue hover:bg-mandi-blue-dark disabled:bg-gray-200 text-white font-bold py-3 rounded-xl text-xs transition-colors shadow-sm mt-3"
          >
            {loading ? <span>Creating Account...</span> : <span>Create {role} Account</span>}
          </button>
        </form>

        <div className="text-center text-xs text-gray-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-mandi-blue font-bold hover:underline">
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
};
