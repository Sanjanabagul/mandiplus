import React, { useState } from 'react';
import { User, MapPin, Phone, Mail, Trash2, Plus, ShieldCheck, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { authService } from '../services/authService.js';

export const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [locality, setLocality] = useState(user?.locality || '');
  const [message, setMessage] = useState('');

  // Address modal / adding
  const [addresses, setAddresses] = useState(user?.addresses || []);
  const [newStreet, setNewStreet] = useState('');
  const [newLocality, setNewLocality] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newPincode, setNewPincode] = useState('');
  const [addingAddress, setAddingAddress] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      await updateProfile({ name, phone, businessName, locality });
      setMessage('Profile updated successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to update profile.');
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!newStreet || !newLocality || !newCity || !newPincode) return;

    try {
      const res = await authService.addAddress({
        fullName: name,
        phone,
        streetAddress: newStreet,
        locality: newLocality,
        city: newCity,
        state: 'Maharashtra',
        pincode: newPincode
      });

      if (res.success) {
        setAddresses(res.addresses);
        setAddingAddress(false);
        setNewStreet('');
        setNewLocality('');
        setNewCity('');
        setNewPincode('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      const res = await authService.deleteAddress(addressId);
      if (res.success) {
        setAddresses(res.addresses);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-mandi-navy mb-6">Account Settings & Addresses</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

        {/* ---------------- PROFILE FORM ---------------- */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4 text-xs">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
            <div className="w-12 h-12 rounded-full bg-mandi-blue text-white font-black flex items-center justify-center text-base">
              {user?.name?.slice(0, 2).toUpperCase() || 'U'}
            </div>
            <div>
              <h3 className="text-base font-bold text-mandi-navy">{user?.name}</h3>
              <span className="text-[10px] bg-blue-100 text-mandi-blue font-bold px-2 py-0.5 rounded uppercase">
                {user?.role} Account
              </span>
            </div>
          </div>

          {message && (
            <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold">
              {message}
            </div>
          )}

          <form onSubmit={handleProfileSave} className="space-y-3">
            <div>
              <label className="block text-gray-600 font-semibold mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-mandi-blue focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-600 font-semibold mb-1">Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full p-2.5 border border-gray-200 bg-gray-50 rounded-lg text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-gray-600 font-semibold mb-1">Contact Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-mandi-blue focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-600 font-semibold mb-1">Business / Firm Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-mandi-blue focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-600 font-semibold mb-1">Default Locality / APMC Hub</label>
              <input
                type="text"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-mandi-blue focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-mandi-blue hover:bg-mandi-blue-dark text-white font-bold py-2.5 rounded-lg transition-colors mt-2"
            >
              Update Profile Details
            </button>
          </form>
        </div>

        {/* ---------------- ADDRESS BOOK ---------------- */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="text-base font-bold text-mandi-navy flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-mandi-blue" />
              Saved Delivery Addresses ({addresses.length})
            </h3>
            <button
              onClick={() => setAddingAddress(!addingAddress)}
              className="text-mandi-blue hover:underline font-bold text-xs"
            >
              {addingAddress ? 'Cancel' : '+ Add Address'}
            </button>
          </div>

          {/* Add Address Form */}
          {addingAddress && (
            <form onSubmit={handleAddAddress} className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-2.5">
              <input
                type="text"
                placeholder="Street Address / Building"
                value={newStreet}
                onChange={(e) => setNewStreet(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-mandi-blue focus:outline-none"
                required
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Locality"
                  value={newLocality}
                  onChange={(e) => setNewLocality(e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-mandi-blue focus:outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="City"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-mandi-blue focus:outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="Pincode"
                  maxLength={6}
                  value={newPincode}
                  onChange={(e) => setNewPincode(e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-mandi-blue focus:outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-mandi-green hover:bg-mandi-green-dark text-white font-bold py-2 rounded-lg transition-colors"
              >
                Save New Address
              </button>
            </form>
          )}

          {/* Address Cards */}
          <div className="space-y-3">
            {addresses.length === 0 ? (
              <p className="text-gray-400 py-4 text-center">No delivery addresses saved yet.</p>
            ) : (
              addresses.map((addr) => (
                <div
                  key={addr._id}
                  className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 flex items-start justify-between gap-3 hover:border-gray-300 transition-colors"
                >
                  <div>
                    <div className="font-bold text-gray-800 flex items-center gap-2">
                      <span>{addr.fullName}</span>
                      {addr.isDefault && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-bold">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mt-0.5 leading-relaxed">
                      {addr.streetAddress}, {addr.locality}, {addr.city} - <strong>{addr.pincode}</strong>
                    </p>
                    <div className="text-gray-500 text-[11px] mt-0.5">Contact: {addr.phone}</div>
                  </div>

                  <button
                    onClick={() => handleDeleteAddress(addr._id)}
                    className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                    title="Delete Address"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
