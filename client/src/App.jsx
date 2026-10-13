import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { Bot, Sparkles, X, ChevronRight, AlertCircle, ShoppingBag } from 'lucide-react';

// Context Providers
import { LanguageProvider, useLanguage } from './context/LanguageContext.jsx';
import { LocationProvider } from './context/LocationContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { WishlistProvider } from './context/WishlistContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';

// Core Components
import { Header } from './components/Header.jsx';
import { Footer } from './components/Footer.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { AIAssistantDrawer } from './components/AIAssistantDrawer.jsx';

// Pages
import { HomePage } from './pages/HomePage.jsx';
import { ProductListingPage } from './pages/ProductListingPage.jsx';
import { ProductDetailsPage } from './pages/ProductDetailsPage.jsx';
import { CartPage } from './pages/CartPage.jsx';
import { CheckoutPage } from './pages/CheckoutPage.jsx';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage.jsx';
import { OrderHistoryPage } from './pages/OrderHistoryPage.jsx';
import { OrderTrackingPage } from './pages/OrderTrackingPage.jsx';
import { WishlistPage } from './pages/WishlistPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { ProcurementAssistantPage } from './pages/ProcurementAssistantPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { ApplicationStatusPage } from './pages/ApplicationStatusPage.jsx';

// Role Dashboards
import { SellerDashboardPage } from './pages/seller/SellerDashboardPage.jsx';
import { SellerProductsPage } from './pages/seller/SellerProductsPage.jsx';
import { SellerOrdersPage } from './pages/seller/SellerOrdersPage.jsx';
import { SellerEarningsPage } from './pages/seller/SellerEarningsPage.jsx';
import { DeliveryDashboardPage } from './pages/delivery/DeliveryDashboardPage.jsx';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage.jsx';
import { AdminLoginPage } from './pages/admin/AdminLoginPage.jsx';

// Scroll to top helper
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// 404 Page Component
const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="w-24 h-24 bg-blue-50 text-mandi-blue rounded-full flex items-center justify-center mb-6 shadow-inner">
        <ShoppingBag className="w-12 h-12 text-mandi-blue" />
      </div>
      <h1 className="text-4xl font-extrabold text-mandi-navy mb-2">404 - Page Not Found</h1>
      <p className="text-gray-600 max-w-md mb-8 text-sm">
        The agricultural produce or page you are looking for does not exist or may have been relocated.
      </p>
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="bg-mandi-blue text-white font-bold px-6 py-2.5 rounded-md hover:bg-blue-600 transition-colors text-sm shadow-md"
        >
          Return to Marketplace
        </Link>
        <Link
          to="/products"
          className="bg-white border border-gray-300 text-mandi-navy font-bold px-6 py-2.5 rounded-md hover:bg-gray-50 transition-colors text-sm"
        >
          Browse All Crops
        </Link>
      </div>
    </div>
  );
};

// Inner App Layout
const AppLayout = () => {
  const location = useLocation();
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  // Don't show floating button on full AI assistant page
  const isAssistantPage = location.pathname === '/assistant' || location.pathname === '/procurement-assistant';

  return (
    <div className="min-h-screen flex flex-col bg-mandi-bg text-mandi-text">
      <ScrollToTop />
      <Header />

      <main className="flex-1">
        <Routes>
          {/* Public / Marketplace Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductListingPage />} />
          <Route path="/products/:id" element={<ProductDetailsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/assistant" element={<ProcurementAssistantPage />} />
          <Route path="/procurement-assistant" element={<ProcurementAssistantPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/application-status" element={<ApplicationStatusPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Protected Buyer Routes */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-confirmation/:id"
            element={
              <ProtectedRoute>
                <OrderConfirmationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-confirmation/:orderId"
            element={
              <ProtectedRoute>
                <OrderConfirmationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrderHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <OrderTrackingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:orderId"
            element={
              <ProtectedRoute>
                <OrderTrackingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <WishlistPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Farmer & Seller Routes */}
          <Route path="/seller" element={<Navigate to="/seller/dashboard" replace />} />
          <Route
            path="/seller/dashboard"
            element={
              <ProtectedRoute allowedRoles={['seller', 'farmer', 'admin']}>
                <SellerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/products"
            element={
              <ProtectedRoute allowedRoles={['seller', 'farmer', 'admin']}>
                <SellerProductsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/orders"
            element={
              <ProtectedRoute allowedRoles={['seller', 'farmer', 'admin']}>
                <SellerOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/earnings"
            element={
              <ProtectedRoute allowedRoles={['seller', 'farmer', 'admin']}>
                <SellerEarningsPage />
              </ProtectedRoute>
            }
          />

          {/* Delivery Partner Routes */}
          <Route path="/delivery" element={<Navigate to="/delivery/dashboard" replace />} />
          <Route
            path="/delivery/dashboard"
            element={
              <ProtectedRoute allowedRoles={['delivery', 'admin']}>
                <DeliveryDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/applications"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/applications/farmers"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/applications/delivery"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />

      {/* Global Floating AI Procurement Assistant Trigger */}
      {!isAssistantPage && (
        <aside aria-label="AI Procurement Assistant Quick Trigger">
          <button
            onClick={() => setIsAiDrawerOpen(true)}
            className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-3.5 rounded-full shadow-2xl hover:shadow-indigo-500/50 hover:scale-110 active:scale-95 transition-all flex items-center gap-2.5 border-2 border-white/20 group cursor-pointer"
            title="Ask Mandi+ AI Procurement Assistant"
          >
            <div className="relative">
              <Bot className="w-6 h-6 text-yellow-300 group-hover:rotate-12 transition-transform" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full animate-ping"></span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full"></span>
            </div>
            <span className="hidden sm:inline font-bold text-xs pr-1">Ask AI Mandi</span>
          </button>
        </aside>
      )}

      {/* Global AI Assistant Drawer */}
      <AIAssistantDrawer isOpen={isAiDrawerOpen} onClose={() => setIsAiDrawerOpen(false)} />
    </div>
  );
};

// Root App with Providers
export const App = () => {
  return (
    <LanguageProvider>
      <LocationProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <NotificationProvider>
                <AppLayout />
              </NotificationProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </LocationProvider>
    </LanguageProvider>
  );
};

export default App;
