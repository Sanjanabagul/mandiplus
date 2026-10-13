import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, Clock, Phone, Mail, MapPin } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-mandi-navy text-gray-300 mt-16 border-t border-gray-800">
      {/* Platform Value Props Bar */}
      <div className="border-b border-gray-800 bg-[#121c2c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 text-mandi-blue flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white text-xs font-bold">100% Direct from Farmers</h4>
                <p className="text-[11px] text-gray-400">Zero unnecessary intermediaries or markups</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-mandi-green flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white text-xs font-bold">APMC Mandi Express Logistics</h4>
                <p className="text-[11px] text-gray-400">Farm gate pickup to store delivery</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 text-yellow-400 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white text-xs font-bold">Daily Transparent Mandi Rates</h4>
                <p className="text-[11px] text-gray-400">Grounded in actual wholesale transactions</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                <span className="text-base font-black">AI</span>
              </div>
              <div>
                <h4 className="text-white text-xs font-bold">AI Conversational Procurement</h4>
                <p className="text-[11px] text-gray-400">Natural voice ordering in EN, HI & MR</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">

          {/* Col 1: About */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-1.5 mb-3">
              <span className="text-2xl font-black italic tracking-wider text-white">
                Mandi<span className="text-yellow-400">+</span>
              </span>
              <span className="text-xl">🌾</span>
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed mb-4 pr-6">
              Mandi+ is an AI-powered hyper-local agricultural e-commerce platform bridging certified farmers and agricultural suppliers directly with retailers, restaurants, and wholesale institutions with transparent pricing and fast logistics.
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <MapPin className="w-4 h-4 text-mandi-blue shrink-0" />
              <span>Operating across Nashik, Pune, Mumbai, & Nagpur APMC Hubs</span>
            </div>
          </div>

          {/* Col 2: Produce Categories */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Categories</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/products?category=Vegetables" className="hover:text-white transition-colors">Fresh Vegetables</Link></li>
              <li><Link to="/products?category=Fruits" className="hover:text-white transition-colors">Farm Fresh Fruits</Link></li>
              <li><Link to="/products?category=Grains" className="hover:text-white transition-colors">Wheat & Rice Grains</Link></li>
              <li><Link to="/products?category=Pulses" className="hover:text-white transition-colors">Unpolished Dals</Link></li>
              <li><Link to="/products?category=Organic+Produce" className="hover:text-white transition-colors">Certified Organic</Link></li>
              <li><Link to="/products?category=Bulk+Deals" className="hover:text-white transition-colors">Wholesale Bulk Deals</Link></li>
            </ul>
          </div>

          {/* Col 3: For Farmers & Suppliers */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">For Farmers</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/register?role=seller" className="hover:text-white transition-colors font-medium text-emerald-400">Start Selling on Mandi+</Link></li>
              <li><Link to="/seller/dashboard" className="hover:text-white transition-colors">Seller Portal</Link></li>
              <li><Link to="/assistant" className="hover:text-white transition-colors">AI Produce Quality Check</Link></li>
              <li><Link to="/products" className="hover:text-white transition-colors">Mandi Daily Price Index</Link></li>
              <li><Link to="/register?role=delivery" className="hover:text-white transition-colors">Join Delivery Fleet</Link></li>
            </ul>
          </div>

          {/* Col 4: Help & Legal */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Customer Service</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/orders" className="hover:text-white transition-colors">Track Active Orders</Link></li>
              <li><Link to="/profile" className="hover:text-white transition-colors">Manage Delivery Addresses</Link></li>
              <li><Link to="/cart" className="hover:text-white transition-colors">Shopping Cart</Link></li>
              <li>
                <Link to="/admin/login" className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1.5 font-medium mt-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Portal</span>
                </Link>
              </li>
              <li className="flex items-center gap-1.5 text-gray-400 mt-2">
                <Phone className="w-3.5 h-3.5 text-yellow-400" />
                <span>+91 1800-MANDI-PLUS</span>
              </li>
              <li className="flex items-center gap-1.5 text-gray-400">
                <Mail className="w-3.5 h-3.5 text-yellow-400" />
                <span>support@mandiplus.in</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright and disclaimer */}
        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-3">
          <div>
            &copy; {new Date().getFullYear()} Mandi+ Agro Commerce Technologies Pvt. Ltd. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Privacy Policy</span>
            <span>Terms of Trade</span>
            <span>APMC Code of Conduct</span>
            <span>Security & Compliance</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
