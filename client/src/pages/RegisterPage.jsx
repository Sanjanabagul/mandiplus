import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Phone,
  Store,
  Truck,
  ShoppingBag,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') || 'buyer';
  const { register } = useAuth();

  const [role, setRole] = useState(defaultRole === 'seller' ? 'farmer' : defaultRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [locality, setLocality] = useState('');
  const [vehicleType, setVehicleType] = useState('Two-Wheeler / Mini Truck');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [farmSizeAcres, setFarmSizeAcres] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedApplication, setSubmittedApplication] = useState(null);

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
      const payload = {
        name,
        email: email.trim().toLowerCase(),
        password,
        phone,
        role,
        businessName,
        locality,
        vehicleType: role === 'delivery' ? vehicleType : undefined,
        vehicleNumber: role === 'delivery' ? vehicleNumber : undefined,
        farmLocation: role === 'farmer' ? locality : undefined,
        farmSizeAcres: role === 'farmer' && farmSizeAcres ? parseFloat(farmSizeAcres) : undefined
      };

      const res = await register(payload);

      if (res.success) {
        if (role === 'buyer') {
          // Buyer logs in immediately and redirects to marketplace
          navigate('/?registered=true');
        } else {
          // Farmer or Delivery: show pending approval confirmation screen
          setSubmittedApplication({
            role,
            name,
            email: email.trim().toLowerCase(),
            phone,
            businessName,
            locality,
            submittedAt: new Date()
          });
        }
      }
    } catch (err) {
      const serverMsg = err.response?.data?.message;
      if (err.response?.status === 409) {
        setErrorMessage(
          serverMsg || 'Email already registered. Please sign in with your existing account or use another email address.'
        );
      } else {
        setErrorMessage(serverMsg || 'Registration failed. Please check form fields and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // PENDING APPROVAL CONFIRMATION VIEW (Farmer & Delivery)
  // -------------------------------------------------------------
  if (submittedApplication) {
    const isFarmer = submittedApplication.role === 'farmer';
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-lg w-full p-8 text-center animate-fade-in">
          
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-emerald-50 text-emerald-600 border border-emerald-200">
            {isFarmer ? <Store className="w-8 h-8" /> : <Truck className="w-8 h-8" />}
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 mb-3">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Application Status: Pending Review</span>
          </span>

          <h2 className="text-xl font-black text-mandi-navy mb-2">
            {isFarmer
              ? 'Registration Submitted Successfully!'
              : 'Delivery Partner Application Submitted'}
          </h2>

          <p className="text-xs text-gray-600 leading-relaxed mb-6">
            {isFarmer ? (
              <>
                Your farmer account application has been submitted successfully. Our admin team will review your details.
                <br /><br />
                Your account is currently pending approval. You will be able to log in after your application is approved.
              </>
            ) : (
              <>
                Thank you for applying to join the Mandi+ delivery network. Your application is awaiting administrator review.
                <br /><br />
                You can log in after the admin approves your application.
              </>
            )}
          </p>

          <div className="bg-gray-50 rounded-xl p-4 text-left text-xs mb-6 border border-gray-200 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Applicant Name:</span>
              <span className="font-bold text-gray-800">{submittedApplication.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Registered Email:</span>
              <span className="font-bold text-gray-800">{submittedApplication.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Phone:</span>
              <span className="font-bold text-gray-800">{submittedApplication.phone || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Role:</span>
              <span className="font-bold uppercase text-mandi-blue">{submittedApplication.role}</span>
            </div>
            {submittedApplication.locality && (
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Locality / APMC:</span>
                <span className="font-bold text-gray-800">{submittedApplication.locality}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/login"
              className="flex-1 bg-mandi-blue hover:bg-mandi-blue-dark text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <span>Return to Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to={`/application-status?email=${encodeURIComponent(submittedApplication.email)}`}
              className="flex-1 bg-white border border-gray-300 hover:border-mandi-blue hover:text-mandi-blue text-gray-700 font-bold py-3 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>Check Status</span>
            </Link>
          </div>

        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // REGISTRATION FORM VIEW
  // -------------------------------------------------------------
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

        {/* Informational callout for Administrators */}
        <div className="mb-4 p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-[11px] text-gray-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-mandi-blue shrink-0" />
            <span>Administrator accounts are provisioned via backend CLI for security.</span>
          </div>
          <Link to="/admin/login" className="text-mandi-blue font-bold hover:underline shrink-0 ml-2">
            Admin Login →
          </Link>
        </div>

        {/* Role Selector Tabs (Buyer, Farmer, Delivery only — NO public admin option) */}
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
            onClick={() => setRole('farmer')}
            className={`py-2 px-1 rounded-lg transition-all flex flex-col items-center gap-1 ${
              role === 'farmer' || role === 'seller' ? 'bg-white text-mandi-green shadow-sm' : 'text-gray-600 hover:text-gray-900'
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
              <label className="block text-gray-700 font-semibold mb-1">
                {role === 'farmer' ? 'Farmer Name *' : 'Full Name *'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === 'farmer' ? 'Rajesh Patil' : 'Ramesh Sharma'}
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
            <p className="text-[10px] text-gray-400 mt-1">
              Global identity policy: Each email address can belong to only one role on Mandi+.
            </p>
          </div>

          {/* Role-Specific Fields */}
          {role === 'farmer' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Farm / Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Sahyadri Agro Farms"
                  className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mandi-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Farm Location / APMC</label>
                <input
                  type="text"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="e.g. Nashik APMC / Dindori"
                  className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mandi-blue focus:outline-none"
                />
              </div>
            </div>
          )}

          {role === 'buyer' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Company / Store Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Annapurna Foods / Retail"
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
          )}

          {role === 'delivery' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Service Area / Locality</label>
                <input
                  type="text"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="e.g. Pune & Pimpri"
                  className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mandi-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Vehicle Type</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mandi-blue focus:outline-none bg-white"
                >
                  <option value="Two-Wheeler / Bike">Two-Wheeler / Bike</option>
                  <option value="Three-Wheeler / Auto">Three-Wheeler / Auto</option>
                  <option value="Tata Ace / Mini Truck">Tata Ace / Mini Truck</option>
                  <option value="Pickup Truck / Van">Pickup Truck / Van</option>
                </select>
              </div>
            </div>
          )}

          {role === 'delivery' && (
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Vehicle Registration Number (Optional)</label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="MH-12-AQ-8899"
                className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mandi-blue focus:outline-none"
              />
            </div>
          )}

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

          {(role === 'farmer' || role === 'delivery') && (
            <div className="p-2.5 bg-blue-50/70 text-blue-900 rounded-xl text-[11px] border border-blue-100 flex items-start gap-2">
              <Clock className="w-4 h-4 text-mandi-blue shrink-0 mt-0.5" />
              <span>
                <strong>Admin Approval Workflow:</strong> {role === 'farmer' ? 'Farmer' : 'Delivery fleet'} accounts require review by Mandi+ administration before activation.
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-mandi-blue hover:bg-mandi-blue-dark disabled:bg-gray-200 text-white font-bold py-3 rounded-xl text-xs transition-colors shadow-sm mt-3 cursor-pointer"
          >
            {loading ? (
              <span>Submitting Application...</span>
            ) : (
              <span>
                {role === 'buyer'
                  ? 'Create Buyer Account'
                  : `Submit ${role === 'farmer' ? 'Farmer' : 'Delivery'} Application`}
              </span>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-gray-500 mt-4 space-y-1">
          <div>
            Already registered?{' '}
            <Link to="/login" className="text-mandi-blue font-bold hover:underline">
              Sign In
            </Link>
          </div>
          <div>
            Applied earlier?{' '}
            <Link to="/application-status" className="text-gray-600 hover:text-mandi-blue hover:underline">
              Check Application Status
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
