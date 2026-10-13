import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Mic,
  MapPin,
  ShoppingCart,
  Heart,
  User,
  Bell,
  ChevronDown,
  Globe,
  Store,
  Truck,
  ShieldAlert,
  LogOut,
  Package,
  Bot
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useLocation } from '../context/LocationContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import { productService } from '../services/productService.js';
import { VoiceSearchModal } from './VoiceSearchModal.jsx';
import { LocationModal } from './LocationModal.jsx';

export const Header = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, isSeller, isAdmin, isDelivery } = useAuth();
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { language, setLanguage, t } = useLanguage();
  const { deliveryLocation, setIsLocationModalOpen, isLocationModalOpen } = useLocation();
  const { notifications, unreadCount, markAsRead } = useNotifications();

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  const searchRef = useRef(null);
  const accountRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setIsAccountOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch search suggestions with debouncing
  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await productService.getSearchSuggestions(searchTerm);
        if (res.success) {
          setSuggestions(res.suggestions || []);
        }
      } catch (err) {
        console.error(err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setShowSuggestions(false);
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setSearchTerm(suggestion.text);
    setShowSuggestions(false);
    if (suggestion.type === 'product' && suggestion.id) {
      navigate(`/products/${suggestion.id}`);
    } else {
      navigate(`/products?search=${encodeURIComponent(suggestion.text)}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-mandi-blue text-white shadow-header select-none">
      {/* Top Banner & Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-6">

          {/* 1. Brand Logo */}
          <Link to="/" className="flex flex-col items-start shrink-0 group">
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black italic tracking-wider text-white">
                Mandi<span className="text-yellow-300">+</span>
              </span>
              <span className="text-lg">🌾</span>
            </div>
            <span className="text-[10px] italic font-medium text-blue-100 -mt-1 group-hover:text-white transition-colors">
              Direct Farm Commerce
            </span>
          </Link>

          {/* 2. Delivery Location Selector */}
          <button
            onClick={() => setIsLocationModalOpen(true)}
            className="hidden lg:flex items-center gap-1.5 bg-blue-700/60 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-md text-xs transition-colors shrink-0 max-w-[170px]"
            title="Change Delivery Location"
          >
            <MapPin className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
            <div className="text-left truncate">
              <span className="text-[10px] text-blue-200 block leading-tight">{t('deliver_to')}</span>
              <span className="font-semibold truncate block leading-tight">
                {deliveryLocation.locality.split('/')[0]}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-blue-200 ml-auto shrink-0" />
          </button>

          {/* 3. Search Bar with Live Suggestions & Voice Search */}
          <div ref={searchRef} className="flex-1 relative max-w-2xl">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder={t('search_placeholder')}
                className="w-full h-10 pl-4 pr-20 rounded bg-white text-mandi-text text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-gray-400"
              />

              {/* Voice Search Button */}
              <button
                type="button"
                onClick={() => setIsVoiceOpen(true)}
                className="absolute right-10 p-1.5 text-gray-500 hover:text-mandi-blue rounded-full transition-colors"
                title={t('voice_search')}
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Search Submit Button */}
              <button
                type="submit"
                className="absolute right-0 top-0 bottom-0 px-3 bg-white text-mandi-blue hover:text-mandi-blue-dark rounded-r flex items-center justify-center transition-colors border-l border-gray-100"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white text-mandi-text rounded-md shadow-xl border border-gray-100 overflow-hidden z-50 animate-fade-in">
                <div className="py-1">
                  {suggestions.map((s, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectSuggestion(s)}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Search className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-medium text-gray-800">{s.text}</span>
                        {s.category && (
                          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                            in {s.category}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-mandi-blue uppercase font-semibold">
                        {s.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. Language Selector Toggle */}
          <div className="relative shrink-0 hidden md:block">
            <button
              onClick={() => setIsLanguageOpen(!isLanguageOpen)}
              className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1.5 rounded hover:bg-blue-700 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-yellow-300" />
              <span>{language === 'hi' ? 'हिंदी' : language === 'mr' ? 'मराठी' : 'EN'}</span>
              <ChevronDown className="w-3 h-3 text-blue-200" />
            </button>

            {isLanguageOpen && (
              <div className="absolute right-0 mt-1 w-32 bg-white text-mandi-text rounded-md shadow-lg border border-gray-100 py-1 z-50 text-xs">
                <button
                  onClick={() => { setLanguage('en'); setIsLanguageOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-blue-50 ${language === 'en' ? 'font-bold text-mandi-blue' : ''}`}
                >
                  English (EN)
                </button>
                <button
                  onClick={() => { setLanguage('hi'); setIsLanguageOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-blue-50 ${language === 'hi' ? 'font-bold text-mandi-blue' : ''}`}
                >
                  हिंदी (Hindi)
                </button>
                <button
                  onClick={() => { setLanguage('mr'); setIsLanguageOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-blue-50 ${language === 'mr' ? 'font-bold text-mandi-blue' : ''}`}
                >
                  मराठी (Marathi)
                </button>
              </div>
            )}
          </div>

          {/* 5. AI Assistant Shortcut */}
          <Link
            to="/assistant"
            className="hidden xl:flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-mandi-navy font-bold px-3 py-1.5 rounded-md text-xs shadow-sm transition-all transform hover:scale-105 shrink-0"
          >
            <Bot className="w-4 h-4 text-mandi-blue" />
            <span>AI Procurement</span>
          </Link>

          {/* 6. Notifications Center */}
          {isAuthenticated && (
            <div ref={notifRef} className="relative shrink-0">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-1.5 rounded-full hover:bg-blue-700 transition-colors relative"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-white" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-yellow-400 text-mandi-navy text-[10px] font-extrabold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white text-mandi-text rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 text-xs animate-fade-in">
                  <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between font-bold text-mandi-navy">
                    <span>Notifications ({unreadCount} new)</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-400">No notifications yet.</div>
                    ) : (
                      notifications.slice(0, 5).map(n => (
                        <div
                          key={n._id}
                          onClick={() => {
                            markAsRead(n._id);
                            if (n.link) navigate(n.link);
                            setIsNotificationsOpen(false);
                          }}
                          className={`p-3 cursor-pointer hover:bg-blue-50/60 transition-colors ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                        >
                          <div className="font-semibold text-mandi-navy">{n.title}</div>
                          <div className="text-gray-600 text-[11px] mt-0.5 line-clamp-2">{n.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 7. Wishlist Shortcut */}
          <Link
            to="/wishlist"
            className="hidden sm:flex items-center gap-1 hover:text-yellow-300 transition-colors text-xs font-semibold relative shrink-0"
            title="Wishlist"
          >
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-yellow-400 text-mandi-navy text-[10px] font-extrabold rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Admin Portal Header Shortcut */}
          <Link
            to={isAdmin ? "/admin/dashboard" : "/admin/login"}
            className="hidden md:flex items-center gap-1.5 bg-blue-800/80 hover:bg-blue-900 border border-blue-400/30 text-white font-medium px-2.5 py-1.5 rounded text-xs transition-colors shrink-0 shadow-sm"
            title="Mandi+ Administrator Console"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
            <span>Admin Portal</span>
          </Link>

          {/* 8. Account Dropdown / Login */}
          <div ref={accountRef} className="relative shrink-0">
            {isAuthenticated ? (
              <div>
                <button
                  onClick={() => setIsAccountOpen(!isAccountOpen)}
                  className="flex items-center gap-1.5 bg-white text-mandi-blue font-bold px-3 py-1.5 rounded hover:bg-gray-100 transition-colors text-xs"
                >
                  <User className="w-4 h-4" />
                  <span className="max-w-[80px] truncate">{user.name.split(' ')[0]}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {isAccountOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white text-mandi-text rounded-xl shadow-2xl border border-gray-100 py-1.5 z-50 text-xs animate-fade-in">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="font-bold text-mandi-navy truncate">{user.name}</div>
                      <div className="text-[10px] text-mandi-muted uppercase tracking-wider font-semibold">
                        {user.role} account
                      </div>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setIsAccountOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-blue-50 text-gray-700"
                    >
                      <User className="w-4 h-4 text-gray-400" />
                      <span>My Profile</span>
                    </Link>

                    <Link
                      to="/orders"
                      onClick={() => setIsAccountOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-blue-50 text-gray-700"
                    >
                      <Package className="w-4 h-4 text-gray-400" />
                      <span>My Orders</span>
                    </Link>

                    {/* Role Specific Shortcuts */}
                    {(isSeller || isAdmin) && (
                      <Link
                        to="/seller/dashboard"
                        onClick={() => setIsAccountOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-green-50 text-mandi-green font-semibold"
                      >
                        <Store className="w-4 h-4 text-mandi-green" />
                        <span>Seller Dashboard</span>
                      </Link>
                    )}

                    {(isDelivery || isAdmin) && (
                      <Link
                        to="/delivery/dashboard"
                        onClick={() => setIsAccountOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-amber-50 text-amber-700 font-semibold"
                      >
                        <Truck className="w-4 h-4 text-amber-600" />
                        <span>Delivery Hub</span>
                      </Link>
                    )}

                    {isAdmin && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setIsAccountOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600 font-semibold"
                      >
                        <ShieldAlert className="w-4 h-4 text-red-500" />
                        <span>Admin Console</span>
                      </Link>
                    )}

                    <div className="border-t border-gray-100 my-1"></div>

                    <button
                      onClick={() => {
                        logout();
                        setIsAccountOpen(false);
                        navigate('/');
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600 text-left font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t('logout')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-white text-mandi-blue font-bold px-4 py-1.5 rounded hover:bg-gray-100 transition-colors text-xs flex items-center gap-1.5 shadow-sm"
              >
                <span>{t('login')}</span>
              </Link>
            )}
          </div>

          {/* 9. Shopping Cart */}
          <Link
            to="/cart"
            className="flex items-center gap-2 text-white hover:text-yellow-300 transition-colors text-xs font-bold shrink-0 ml-1"
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2.5 w-4 h-4 bg-yellow-400 text-mandi-navy text-[10px] font-black rounded-full flex items-center justify-center animate-bounce">
                  {itemCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">{t('cart')}</span>
          </Link>
        </div>
      </div>

      {/* Voice Search Modal */}
      <VoiceSearchModal isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} />

      {/* Location Picker Modal */}
      <LocationModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} />
    </header>
  );
};
