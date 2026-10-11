import React, { useState } from 'react';
import { MapPin, X, Check } from 'lucide-react';
import { useLocation } from '../context/LocationContext.jsx';

const POPULAR_MANDIS = [
  { city: 'Pune', locality: 'Market Yard / Gultekdi', state: 'Maharashtra', pincode: '411037' },
  { city: 'Pune', locality: 'Kothrud / Paud Road', state: 'Maharashtra', pincode: '411038' },
  { city: 'Nashik', locality: 'Nashik APMC Market', state: 'Maharashtra', pincode: '422003' },
  { city: 'Mumbai', locality: 'Vashi APMC Navi Mumbai', state: 'Maharashtra', pincode: '400703' },
  { city: 'Nagpur', locality: 'Kalamna Mandi Hub', state: 'Maharashtra', pincode: '440035' },
  { city: 'Kolhapur', locality: 'Shahu Market Yard', state: 'Maharashtra', pincode: '416005' }
];

export const LocationModal = ({ isOpen, onClose }) => {
  const { deliveryLocation, updateLocation } = useLocation();
  const [customPincode, setCustomPincode] = useState('');
  const [customLocality, setCustomLocality] = useState('');
  const [customCity, setCustomCity] = useState('');

  if (!isOpen) return null;

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customPincode.trim().length === 6) {
      updateLocation({
        city: customCity.trim() || 'Regional Mandi',
        locality: customLocality.trim() || 'Local Area',
        state: 'Maharashtra',
        pincode: customPincode.trim()
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-gray-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-mandi-blue flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-mandi-navy">Select Delivery Mandi Hub</h3>
            <p className="text-xs text-mandi-muted">Produce availability and delivery estimates vary by agricultural hub</p>
          </div>
        </div>

        {/* Current Selection */}
        <div className="bg-blue-50/60 border border-blue-200/60 rounded-xl p-3 my-4 flex items-center justify-between">
          <div className="text-xs">
            <span className="text-gray-500 block">Current Delivery Hub:</span>
            <span className="font-semibold text-mandi-navy text-sm">
              {deliveryLocation.locality}, {deliveryLocation.city} - {deliveryLocation.pincode}
            </span>
          </div>
          <span className="text-xs bg-mandi-blue text-white px-2 py-0.5 rounded font-medium">Active</span>
        </div>

        {/* Popular Regional APMC Mandis */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Major APMC Agri Hubs</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
            {POPULAR_MANDIS.map((m, idx) => {
              const isSelected = deliveryLocation.pincode === m.pincode;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    updateLocation(m);
                    onClose();
                  }}
                  className={`text-left p-2.5 rounded-lg border text-xs transition-all flex items-start justify-between ${
                    isSelected
                      ? 'border-mandi-blue bg-blue-50/50 text-mandi-blue font-semibold'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div>
                    <div className="font-bold">{m.locality}</div>
                    <div className="text-[11px] text-gray-500">{m.city} - {m.pincode}</div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-mandi-blue shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Pincode Form */}
        <form onSubmit={handleCustomSubmit} className="pt-3 border-t border-gray-100">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Or Enter Your Pincode</h4>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <input
              type="text"
              placeholder="6-digit Pincode"
              maxLength={6}
              value={customPincode}
              onChange={(e) => setCustomPincode(e.target.value.replace(/\D/g, ''))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-mandi-blue focus:outline-none col-span-1"
              required
            />
            <input
              type="text"
              placeholder="City (e.g. Pune)"
              value={customCity}
              onChange={(e) => setCustomCity(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-mandi-blue focus:outline-none col-span-1"
            />
            <input
              type="text"
              placeholder="Area / Locality"
              value={customLocality}
              onChange={(e) => setCustomLocality(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-mandi-blue focus:outline-none col-span-1"
            />
          </div>
          <button
            type="submit"
            disabled={customPincode.length !== 6}
            className="w-full bg-mandi-blue hover:bg-mandi-blue-dark disabled:bg-gray-200 text-white font-medium py-2 rounded-lg text-xs transition-colors"
          >
            Apply Location
          </button>
        </form>
      </div>
    </div>
  );
};
