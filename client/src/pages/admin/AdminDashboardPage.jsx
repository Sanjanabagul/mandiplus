import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Users,
  Package,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  Search,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Truck,
  Store,
  Clock,
  Check,
  X,
  Eye,
  Filter,
  FileText,
  ChevronRight,
  ShieldAlert,
  Calendar,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Warehouse
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { adminService } from '../../services/adminService.js';

export const AdminDashboardPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';

  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [dbInfo, setDbInfo] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [activeTab, setActiveTab] = useState(initialTab); // 'overview' | 'applications' | 'users' | 'products' | 'orders'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Application Management State
  const [applications, setApplications] = useState([]);
  const [appRoleFilter, setAppRoleFilter] = useState('all'); // 'all' | 'farmer' | 'delivery'
  const [appStatusFilter, setAppStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [appSearch, setAppSearch] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');
  const [actionErrorMessage, setActionErrorMessage] = useState('');

  // Approve / Reject Modal Dialog States
  const [approveConfirmTarget, setApproveConfirmTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  // Other Tab States
  const [users, setUsers] = useState([]);
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderSearch, setOrderSearch] = useState('');

  // Fetch macro stats, analytics, and verified DB connection diagnostics
  const fetchDashboardData = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [dashRes, analRes, dbRes] = await Promise.all([
        adminService.getDashboard(),
        adminService.getAnalytics(),
        adminService.getDbStatus().catch(() => ({ success: false }))
      ]);

      if (dashRes.success) setStats(dashRes.stats);
      if (analRes.success) setAnalytics(analRes.analytics);
      if (dbRes?.success) setDbInfo(dbRes.diagnostics);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to fetch governance data.';
      setLoadError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Applications List
  const fetchApplications = async () => {
    try {
      const res = await adminService.getApplications({
        role: appRoleFilter,
        status: appStatusFilter,
        search: appSearch
      });
      if (res.success) {
        setApplications(res.applications || []);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
    }
  };

  // Fetch Users List
  const fetchUsers = async () => {
    try {
      const res = await adminService.getUsers({
        role: userRoleFilter,
        status: userStatusFilter,
        search: userSearch
      });
      if (res.success) setUsers(res.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  // Fetch Products List
  const fetchProducts = async () => {
    try {
      const res = await adminService.getProducts();
      if (res.success) setProducts(res.products || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  // Fetch Orders List
  const fetchOrders = async () => {
    try {
      const res = await adminService.getOrders({ search: orderSearch });
      if (res.success) setOrders(res.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'applications') fetchApplications();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'products') fetchProducts();
    if (activeTab === 'orders') fetchOrders();
  }, [activeTab, appRoleFilter, appStatusFilter, appSearch, userRoleFilter, userStatusFilter, userSearch, orderSearch]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
    setActionSuccessMessage('');
    setActionErrorMessage('');
  };

  // Quick refresh
  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    if (activeTab === 'applications') await fetchApplications();
    if (activeTab === 'users') await fetchUsers();
    setRefreshing(false);
  };

  // Approve decision handler
  const handleConfirmApprove = async () => {
    if (!approveConfirmTarget) return;
    setIsSubmittingDecision(true);
    setActionSuccessMessage('');
    setActionErrorMessage('');

    try {
      const res = await adminService.approveApplication(approveConfirmTarget._id);
      if (res.success) {
        setActionSuccessMessage(
          `Successfully approved ${approveConfirmTarget.role === 'delivery' ? 'delivery partner' : 'farmer'} application for ${approveConfirmTarget.name}.`
        );
        setApproveConfirmTarget(null);
        setSelectedApplication(null);
        fetchApplications();
        fetchDashboardData();
      }
    } catch (err) {
      setActionErrorMessage(
        err.response?.data?.message || 'Failed to approve application.'
      );
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  // Reject decision handler
  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    if (!rejectionReason.trim()) {
      setActionErrorMessage('Please provide a reason for application rejection.');
      return;
    }

    setIsSubmittingDecision(true);
    setActionSuccessMessage('');
    setActionErrorMessage('');

    try {
      const res = await adminService.rejectApplication(rejectTarget._id, rejectionReason.trim());
      if (res.success) {
        setActionSuccessMessage(
          `Application for ${rejectTarget.name} has been rejected. Feedback recorded.`
        );
        setRejectTarget(null);
        setRejectionReason('');
        setSelectedApplication(null);
        fetchApplications();
        fetchDashboardData();
      }
    } catch (err) {
      setActionErrorMessage(
        err.response?.data?.message || 'Failed to reject application.'
      );
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  // User suspend / reactivate
  const handleToggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await adminService.updateUserStatus(userId, newStatus);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  // Product moderation
  const handleUpdateProductApproval = async (prodId, status, isAvailable = true) => {
    try {
      await adminService.updateProductApproval(prodId, status, isAvailable);
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCsv = async () => {
    try {
      const blobData = await adminService.exportOrdersCsv();
      const url = window.URL.createObjectURL(new Blob([blobData], { type: 'text/csv;charset=utf-8;' }));
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', `mandiplus-orders-report-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setActionErrorMessage('Failed to export orders CSV: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-mandi-blue" />
        <span className="text-xs font-bold text-gray-500">Loading Governance Portal from Database...</span>
      </div>
    );
  }

  if (loadError && !stats) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 shadow-sm">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-black text-gray-900 mb-1">Database Connection Unavailable</h2>
          <p className="text-xs text-red-700 max-w-md mx-auto mb-6 leading-relaxed">
            {loadError}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleManualRefresh}
              className="bg-mandi-blue hover:bg-blue-600 text-white font-bold text-xs py-2.5 px-5 rounded-xl flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Querying Database</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      
      {/* ---------------- TOP BANNER & ACTIONS ---------------- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-red-100 text-red-700 rounded-lg">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-black text-mandi-navy">Mandi+ Admin Portal</h1>
            {dbInfo && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ml-2 ${
                dbInfo.connected
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dbInfo.connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                <span>DB: {dbInfo.databaseName} ({dbInfo.connectionState})</span>
              </span>
            )}
          </div>
          <p className="text-xs text-mandi-muted mt-1">
            Real database records, farmer verification, fleet governance, product moderation & platform analytics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="bg-white border border-gray-300 hover:border-mandi-blue hover:text-mandi-blue text-gray-700 font-bold text-xs py-2 px-3.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="bg-white border border-gray-300 hover:border-mandi-blue hover:text-mandi-blue text-gray-700 font-bold text-xs py-2 px-3.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Orders CSV</span>
          </button>
        </div>
      </div>

      {/* Global Toast Messages */}
      {actionSuccessMessage && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs mb-6 flex items-center justify-between border border-emerald-200 shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{actionSuccessMessage}</span>
          </div>
          <button onClick={() => setActionSuccessMessage('')} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionErrorMessage && (
        <div className="p-3.5 bg-red-50 text-red-800 rounded-xl text-xs mb-6 flex items-center justify-between border border-red-200 shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-medium">{actionErrorMessage}</span>
          </div>
          <button onClick={() => setActionErrorMessage('')} className="text-red-700 hover:text-red-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ---------------- 6 MANDATORY SUMMARY STAT CARDS ---------------- */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        
        {/* Card 1: Total Registered Users */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider block">Total Users</span>
          <div className="my-1">
            <span className="text-2xl font-black text-mandi-navy">{stats?.totalUsers || 0}</span>
          </div>
          <span className="text-[10px] text-gray-500 font-medium">All registered roles</span>
        </div>

        {/* Card 2: Pending Farmer Applications */}
        <div
          onClick={() => {
            setActiveTab('applications');
            setAppRoleFilter('farmer');
            setAppStatusFilter('pending');
          }}
          className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 shadow-sm hover:border-amber-400 cursor-pointer transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-amber-700 font-bold text-[10px] uppercase tracking-wider">Pending Farmers</span>
            <Store className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="my-1">
            <span className="text-2xl font-black text-amber-700">{stats?.pendingFarmerApplications || 0}</span>
          </div>
          <span className="text-[10px] text-amber-800 font-medium group-hover:underline flex items-center gap-0.5">
            <span>Review required</span>
            <ChevronRight className="w-3 h-3" />
          </span>
        </div>

        {/* Card 3: Pending Delivery Applications */}
        <div
          onClick={() => {
            setActiveTab('applications');
            setAppRoleFilter('delivery');
            setAppStatusFilter('pending');
          }}
          className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 shadow-sm hover:border-amber-400 cursor-pointer transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-amber-700 font-bold text-[10px] uppercase tracking-wider">Pending Delivery</span>
            <Truck className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="my-1">
            <span className="text-2xl font-black text-amber-700">{stats?.pendingDeliveryApplications || 0}</span>
          </div>
          <span className="text-[10px] text-amber-800 font-medium group-hover:underline flex items-center gap-0.5">
            <span>Review required</span>
            <ChevronRight className="w-3 h-3" />
          </span>
        </div>

        {/* Card 4: Approved Farmers */}
        <div
          onClick={() => {
            setActiveTab('applications');
            setAppRoleFilter('farmer');
            setAppStatusFilter('approved');
          }}
          className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:border-emerald-300 cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">Approved Farmers</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="my-1">
            <span className="text-2xl font-black text-emerald-600">{stats?.approvedFarmers || 0}</span>
          </div>
          <span className="text-[10px] text-gray-500 font-medium">Active producers</span>
        </div>

        {/* Card 5: Approved Delivery Partners */}
        <div
          onClick={() => {
            setActiveTab('applications');
            setAppRoleFilter('delivery');
            setAppStatusFilter('approved');
          }}
          className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:border-blue-300 cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">Approved Delivery</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-mandi-blue" />
          </div>
          <div className="my-1">
            <span className="text-2xl font-black text-mandi-blue">{stats?.approvedDeliveryPartners || 0}</span>
          </div>
          <span className="text-[10px] text-gray-500 font-medium">Active drivers</span>
        </div>

        {/* Card 6: Rejected Applications */}
        <div
          onClick={() => {
            setActiveTab('applications');
            setAppRoleFilter('all');
            setAppStatusFilter('rejected');
          }}
          className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:border-red-300 cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">Rejected</span>
            <XCircle className="w-3.5 h-3.5 text-red-500" />
          </div>
          <div className="my-1">
            <span className="text-2xl font-black text-red-600">{stats?.rejectedApplications || 0}</span>
          </div>
          <span className="text-[10px] text-gray-500 font-medium">Denied registrations</span>
        </div>

      </div>

      {/* ---------------- NAVIGATION TABS ---------------- */}
      <div className="flex items-center gap-1.5 border-b border-gray-200 pb-2 mb-6 overflow-x-auto no-scrollbar text-xs font-bold">
        <button
          onClick={() => handleTabChange('overview')}
          className={`py-2 px-4 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'overview' ? 'bg-mandi-navy text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => handleTabChange('applications')}
          className={`py-2 px-4 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 relative ${
            activeTab === 'applications' ? 'bg-mandi-blue text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Application Reviews</span>
          {(stats?.totalPendingApplications || 0) > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'applications' ? 'bg-white text-mandi-blue' : 'bg-amber-500 text-white'
            }`}>
              {stats.totalPendingApplications}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange('users')}
          className={`py-2 px-4 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'users' ? 'bg-mandi-navy text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>All Users Management</span>
        </button>

        <button
          onClick={() => handleTabChange('products')}
          className={`py-2 px-4 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'products' ? 'bg-mandi-navy text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Produce Moderation</span>
        </button>

        <button
          onClick={() => handleTabChange('orders')}
          className={`py-2 px-4 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'orders' ? 'bg-mandi-navy text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Orders Audit</span>
        </button>

        <Link
          to="/hub/operations"
          className="py-2 px-4 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs sm:ml-auto"
          title="Switch to Mandi+ Hub Centralized Fulfilment Console"
        >
          <Warehouse className="w-3.5 h-3.5 text-yellow-300" />
          <span>Mandi+ Hub Console →</span>
        </Link>
      </div>

      {/* ---------------- TAB 1: OVERVIEW & ANALYTICS ---------------- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Pending Applications Queue Alert */}
          {(stats?.totalPendingApplications || 0) > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl shrink-0 mt-0.5">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-mandi-navy">
                    {stats.totalPendingApplications} Registration Applications Awaiting Review
                  </h3>
                  <p className="text-xs text-amber-800 mt-0.5">
                    {stats.pendingFarmerApplications || 0} Farmers and {stats.pendingDeliveryApplications || 0} Delivery Fleet partners are waiting for your approval to start trading.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveTab('applications');
                  setAppStatusFilter('pending');
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition-colors shrink-0 shadow-sm cursor-pointer"
              >
                <span>Process Pending Queue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Macro GMV Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider block mb-1">
                Gross Merchandise Value
              </span>
              <span className="text-2xl font-black text-mandi-navy">
                ₹{(stats?.totalGMV || 0).toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-emerald-600 block mt-0.5">Across {stats?.totalOrders || 0} platform orders</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider block mb-1">
                Active Catalog Produce
              </span>
              <span className="text-2xl font-black text-mandi-green">{stats?.totalProducts || 0}</span>
              <span className="text-[11px] text-gray-500 block mt-0.5">
                {stats?.pendingApprovalProducts || 0} listings pending review
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider block mb-1">
                Buyer Network
              </span>
              <span className="text-2xl font-black text-mandi-blue">{stats?.totalBuyers || 0}</span>
              <span className="text-[11px] text-gray-500 block mt-0.5">Active retail buyers & restaurants</span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Platform Revenue Trend */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-sm text-mandi-navy mb-1">Platform Revenue Over Time (₹)</h3>
              <p className="text-[11px] text-gray-400 mb-4">Daily GMV throughput across regional APMC mandis</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics?.revenueTrend || []}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2874F0" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#2874F0" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="sales" stroke="#2874F0" fillOpacity={1} fill="url(#salesGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-sm text-mandi-navy mb-1">Sales by Agricultural Category (₹)</h3>
              <p className="text-[11px] text-gray-400 mb-4">Volume breakdown across produce types</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.categoryDistribution || []}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#18864B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ---------------- TAB 2: APPLICATION REVIEWS (FARMER & DELIVERY) ---------------- */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          
          {/* Controls Bar: Filters & Search */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
            
            {/* Role Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-gray-400 font-bold uppercase text-[10px] mr-1">Role:</span>
              <button
                onClick={() => setAppRoleFilter('all')}
                className={`py-1.5 px-3 rounded-lg font-bold transition-colors cursor-pointer ${
                  appRoleFilter === 'all' ? 'bg-mandi-navy text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Applications
              </button>
              <button
                onClick={() => setAppRoleFilter('farmer')}
                className={`py-1.5 px-3 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  appRoleFilter === 'farmer' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Farmers</span>
              </button>
              <button
                onClick={() => setAppRoleFilter('delivery')}
                className={`py-1.5 px-3 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  appRoleFilter === 'delivery' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Delivery Fleet</span>
              </button>
            </div>

            {/* Status Filter Dropdown & Search */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-gray-50 border border-gray-300 rounded-xl px-2.5 py-1.5">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <select
                  value={appStatusFilter}
                  onChange={(e) => setAppStatusFilter(e.target.value)}
                  className="bg-transparent font-bold text-gray-700 focus:outline-none text-xs cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending Review Only</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="relative flex-1 md:w-64">
                <input
                  type="text"
                  placeholder="Search applicant or email..."
                  value={appSearch}
                  onChange={(e) => setAppSearch(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-mandi-blue focus:outline-none"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

          </div>

          {/* Applications Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-gray-200 bg-gray-50/70 text-gray-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Applicant</th>
                    <th className="p-3.5">Account Role</th>
                    <th className="p-3.5">Farm / Vehicle Details</th>
                    <th className="p-3.5">APMC / Locality</th>
                    <th className="p-3.5">Submission Date</th>
                    <th className="p-3.5">Review Status</th>
                    <th className="p-3.5 text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-gray-400">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <span>No registration applications matched the current filters.</span>
                      </td>
                    </tr>
                  ) : (
                    applications.map((app) => {
                      const isPending = app.approvalStatus === 'pending';
                      const isApproved = app.approvalStatus === 'approved';
                      const isRejected = app.approvalStatus === 'rejected';

                      return (
                        <tr key={app._id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="p-3.5">
                            <div className="font-bold text-gray-900">{app.name}</div>
                            <div className="text-[11px] text-gray-400">{app.email}</div>
                            {app.phone && <div className="text-[10px] text-gray-500">{app.phone}</div>}
                          </td>

                          <td className="p-3.5">
                            {app.role === 'farmer' || app.role === 'seller' ? (
                              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                                <Store className="w-3 h-3" />
                                <span>Farmer / Seller</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                                <Truck className="w-3 h-3" />
                                <span>Delivery Fleet</span>
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-gray-700">
                            {app.role === 'farmer' || app.role === 'seller' ? (
                              <div>
                                <span className="font-semibold block">{app.businessName || 'Family Farm'}</span>
                                {app.sellerProfile?.primaryCrops?.length > 0 && (
                                  <span className="text-[10px] text-gray-400">
                                    Crops: {app.sellerProfile.primaryCrops.join(', ')}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div>
                                <span className="font-semibold block">{app.deliveryProfile?.vehicleType || 'Two-Wheeler'}</span>
                                {app.deliveryProfile?.vehicleNumber && (
                                  <span className="text-[10px] text-gray-400">Reg: {app.deliveryProfile.vehicleNumber}</span>
                                )}
                              </div>
                            )}
                          </td>

                          <td className="p-3.5 text-gray-600">{app.locality || '—'}</td>

                          <td className="p-3.5 text-gray-500">
                            {new Date(app.submittedAt || app.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>

                          <td className="p-3.5">
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3" />
                                <span>Pending</span>
                              </span>
                            )}
                            {isApproved && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Approved</span>
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-100 text-red-800 border border-red-200" title={app.rejectionReason}>
                                <XCircle className="w-3 h-3" />
                                <span>Rejected</span>
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => setSelectedApplication(app)}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-2.5 py-1 rounded text-xs transition-colors cursor-pointer"
                              title="View full application details"
                            >
                              <Eye className="w-3.5 h-3.5 inline mr-1" />
                              <span>Details</span>
                            </button>

                            {isPending && (
                              <>
                                <button
                                  onClick={() => setApproveConfirmTarget(app)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded text-xs transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setRejectTarget(app);
                                    setRejectionReason('');
                                  }}
                                  className="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-2.5 py-1 rounded text-xs transition-colors border border-red-200 cursor-pointer inline-flex items-center gap-1"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- TAB 3: ALL USERS GOVERNANCE ---------------- */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-bold uppercase text-[10px]">Filter Role:</span>
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-2.5 py-1 font-bold text-gray-700 focus:outline-none"
              >
                <option value="all">All Roles</option>
                <option value="buyer">Buyers</option>
                <option value="seller">Farmers / Sellers</option>
                <option value="delivery">Delivery Fleet</option>
                <option value="admin">Administrators</option>
              </select>
            </div>

            <div className="relative flex-1 md:w-64">
              <input
                type="text"
                placeholder="Search user name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full border border-gray-300 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-mandi-blue focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-gray-200 bg-gray-50/70 text-gray-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Business / Locality</th>
                    <th className="p-3.5">Approval Status</th>
                    <th className="p-3.5">Account Status</th>
                    <th className="p-3.5 text-right">Governance Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50/50">
                      <td className="p-3.5">
                        <div className="font-bold text-gray-900">{u.name}</div>
                        <div className="text-[11px] text-gray-400">{u.email}</div>
                      </td>
                      <td className="p-3.5 font-bold uppercase text-[10px] text-mandi-blue">
                        {u.role}
                      </td>
                      <td className="p-3.5 text-gray-600">
                        {u.businessName || u.locality || '—'}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.approvalStatus === 'approved' || u.approvalStatus === 'not_required'
                            ? 'bg-emerald-100 text-emerald-800'
                            : u.approvalStatus === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {u.approvalStatus || (u.role === 'buyer' ? 'not_required' : 'pending')}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleToggleUserStatus(u._id, u.status)}
                            className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                              u.status === 'active'
                                ? 'bg-red-50 hover:bg-red-100 text-red-600'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {u.status === 'active' ? 'Suspend' : 'Reactivate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- TAB 4: PRODUCE MODERATION ---------------- */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden text-xs">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-mandi-navy">Product Listings Moderation</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Product</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Price / Stock</th>
                  <th className="p-3.5">Farmer</th>
                  <th className="p-3.5">Approval Status</th>
                  <th className="p-3.5 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50/50">
                    <td className="p-3.5 font-bold text-mandi-navy">{p.name}</td>
                    <td className="p-3.5 text-gray-600">{p.category}</td>
                    <td className="p-3.5">₹{p.pricePerUnit}/{p.unit} ({p.stockQuantity} in stock)</td>
                    <td className="p-3.5 text-gray-600">{p.sellerName}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        p.approvalStatus === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.approvalStatus}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5">
                      {p.approvalStatus !== 'approved' ? (
                        <button
                          onClick={() => handleUpdateProductApproval(p._id, 'approved', true)}
                          className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold px-2.5 py-1 rounded text-xs cursor-pointer"
                        >
                          Approve
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateProductApproval(p._id, 'rejected', false)}
                          className="bg-red-50 text-red-600 hover:bg-red-100 font-bold px-2.5 py-1 rounded text-xs cursor-pointer"
                        >
                          Disable
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------- TAB 5: ALL ORDERS AUDIT ---------------- */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden text-xs">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-mandi-navy">All Platform Orders Audit</h3>
            <input
              type="text"
              placeholder="Search order number..."
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1 text-xs focus:ring-1 focus:ring-mandi-blue focus:outline-none w-60"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Order Number</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Buyer</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((o) => (
                  <tr key={o._id} className="hover:bg-gray-50/50">
                    <td className="p-3.5 font-bold text-mandi-navy">#{o.orderNumber}</td>
                    <td className="p-3.5 text-gray-500">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="p-3.5 font-semibold text-gray-800">{o.buyerName}</td>
                    <td className="p-3.5 font-black text-gray-900">₹{o.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="p-3.5">
                      <span className="bg-blue-100 text-mandi-blue font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                        {o.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 uppercase font-bold text-[10px] text-gray-600">
                      {o.paymentMethod} ({o.paymentStatus})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------- MODAL 1: APPLICATION DETAILS VIEW ---------------- */}
      {selectedApplication && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 text-xs">
            
            <div className="flex items-start justify-between pb-3 border-b border-gray-200 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-mandi-blue rounded-xl">
                  {selectedApplication.role === 'delivery' ? <Truck className="w-5 h-5" /> : <Store className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-mandi-navy">{selectedApplication.name}</h3>
                  <span className="font-bold uppercase text-[10px] text-mandi-blue">{selectedApplication.role} Application</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedApplication(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                <div>
                  <span className="text-gray-400 font-bold text-[10px] uppercase block">Email Address</span>
                  <span className="font-semibold text-gray-800 break-all">{selectedApplication.email}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold text-[10px] uppercase block">Phone Number</span>
                  <span className="font-semibold text-gray-800">{selectedApplication.phone || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold text-[10px] uppercase block">Locality / APMC</span>
                  <span className="font-semibold text-gray-800">{selectedApplication.locality || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold text-[10px] uppercase block">Status</span>
                  <span className="font-bold uppercase text-mandi-navy">{selectedApplication.approvalStatus}</span>
                </div>
              </div>

              {/* Farmer Details */}
              {(selectedApplication.role === 'farmer' || selectedApplication.role === 'seller') && (
                <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200 space-y-1.5">
                  <span className="text-emerald-800 font-bold text-[11px] block">Agricultural Profile</span>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Farm / Firm:</span>
                    <span className="font-semibold text-gray-800">{selectedApplication.businessName || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Farm Location:</span>
                    <span className="font-semibold text-gray-800">{selectedApplication.sellerProfile?.farmLocation || selectedApplication.locality || '—'}</span>
                  </div>
                  {selectedApplication.sellerProfile?.farmSizeAcres > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Farm Size:</span>
                      <span className="font-semibold text-gray-800">{selectedApplication.sellerProfile.farmSizeAcres} Acres</span>
                    </div>
                  )}
                </div>
              )}

              {/* Delivery Details */}
              {selectedApplication.role === 'delivery' && (
                <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-200 space-y-1.5">
                  <span className="text-amber-800 font-bold text-[11px] block">Logistics Profile</span>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Vehicle Type:</span>
                    <span className="font-semibold text-gray-800">{selectedApplication.deliveryProfile?.vehicleType || 'Two-Wheeler'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Vehicle Registration:</span>
                    <span className="font-semibold text-gray-800">{selectedApplication.deliveryProfile?.vehicleNumber || '—'}</span>
                  </div>
                </div>
              )}

              {/* Audit Stamps if any */}
              {selectedApplication.approvedAt && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-[11px] border border-emerald-200">
                  <span className="font-bold block">Approved on:</span>
                  <span>{new Date(selectedApplication.approvedAt).toLocaleString('en-IN')}</span>
                </div>
              )}

              {selectedApplication.rejectedAt && (
                <div className="p-3 bg-red-50 text-red-800 rounded-xl text-[11px] border border-red-200">
                  <span className="font-bold block">Rejected on:</span>
                  <span>{new Date(selectedApplication.rejectedAt).toLocaleString('en-IN')}</span>
                  {selectedApplication.rejectionReason && (
                    <span className="block mt-1 font-medium">Reason: {selectedApplication.rejectionReason}</span>
                  )}
                </div>
              )}
            </div>

            {/* Actions in details modal */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
              <button
                onClick={() => setSelectedApplication(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-xl cursor-pointer"
              >
                Close
              </button>

              {selectedApplication.approvalStatus === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      setRejectTarget(selectedApplication);
                      setRejectionReason('');
                    }}
                    className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold py-2 px-4 rounded-xl cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => setApproveConfirmTarget(selectedApplication)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl cursor-pointer shadow-sm"
                  >
                    Approve Application
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ---------------- MODAL 2: APPROVE CONFIRMATION DIALOG ---------------- */}
      {approveConfirmTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-200 text-xs text-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-mandi-navy mb-1">Confirm Approval</h3>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Are you sure you want to approve <strong>{approveConfirmTarget.name}</strong> as an active {approveConfirmTarget.role === 'delivery' ? 'delivery partner' : 'farmer'}?
              <br />
              This will grant immediate login rights to protected dashboards.
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setApproveConfirmTarget(null)}
                disabled={isSubmittingDecision}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApprove}
                disabled={isSubmittingDecision}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                {isSubmittingDecision ? 'Approving...' : 'Confirm Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- MODAL 3: REJECT CONFIRMATION DIALOG (REQUIRES REASON) ---------------- */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 text-xs">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-black text-gray-900">Reject Application</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              Please specify the reason for rejecting <strong>{rejectTarget.name}</strong>'s application. This will be securely recorded in the audit log and shared with the applicant.
            </p>

            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-1">Rejection Reason *</label>
              <textarea
                rows="3"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Incomplete APMC land record documentation or invalid license details provided."
                className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-xs"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setRejectTarget(null);
                  setRejectionReason('');
                }}
                disabled={isSubmittingDecision}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={isSubmittingDecision || !rejectionReason.trim()}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-bold py-2 px-4 rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                {isSubmittingDecision ? 'Submitting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
