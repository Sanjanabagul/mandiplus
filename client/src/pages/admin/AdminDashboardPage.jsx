import React, { useState, useEffect } from 'react';
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
  Truck
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import { adminService } from '../../services/adminService.js';

const COLORS = ['#2874F0', '#18864B', '#FF9F00', '#FB641B', '#8884d8', '#00C49F'];

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'users' | 'products' | 'orders'
  const [loading, setLoading] = useState(true);

  // Tab Data States
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [dashRes, analRes] = await Promise.all([
        adminService.getDashboard(),
        adminService.getAnalytics()
      ]);

      if (dashRes.success) setStats(dashRes.stats);
      if (analRes.success) setAnalytics(analRes.analytics);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const loadUsersTab = async () => {
    try {
      const res = await adminService.getUsers({ search: searchQuery });
      if (res.success) setUsers(res.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadProductsTab = async () => {
    try {
      const res = await adminService.getProducts({ search: searchQuery });
      if (res.success) setProducts(res.products || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadOrdersTab = async () => {
    try {
      const res = await adminService.getOrders({ search: searchQuery });
      if (res.success) setOrders(res.orders || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') loadUsersTab();
    if (activeTab === 'products') loadProductsTab();
    if (activeTab === 'orders') loadOrdersTab();
  }, [activeTab, searchQuery]);

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await adminService.updateUserStatus(userId, newStatus);
      loadUsersTab();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProductApproval = async (prodId, status, isAvailable = true) => {
    try {
      await adminService.updateProductApproval(prodId, status, isAvailable);
      loadProductsTab();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCsv = () => {
    window.open('/api/reports/export-orders', '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-mandi-blue" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 mb-6">
        <div>
          <h1 className="text-2xl font-black text-mandi-navy flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-red-600" />
            <span>Mandi+ Administrator Console</span>
          </h1>
          <p className="text-xs text-mandi-muted">
            Platform governance, user verification, product moderation, and macro GMV analytics
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="bg-white border border-gray-300 hover:border-mandi-blue hover:text-mandi-blue text-gray-700 font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-2 shadow-xs transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export All Orders CSV</span>
        </button>
      </div>

      {/* ---------------- PLATFORM MACRO METRICS ---------------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider block mb-1">Gross Merchandise Value</span>
          <span className="text-2xl font-black text-mandi-navy">
            ₹{(stats?.totalGMV || 0).toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-emerald-600 block mt-0.5">Across {stats?.totalOrders || 0} orders</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider block mb-1">Registered Users</span>
          <span className="text-2xl font-black text-mandi-blue">{stats?.totalUsers || 0}</span>
          <span className="text-[11px] text-gray-500 block mt-0.5">
            {stats?.totalBuyers || 0} Buyers • {stats?.totalSellers || 0} Farmers
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider block mb-1">Active Catalog Produce</span>
          <span className="text-2xl font-black text-mandi-green">{stats?.totalProducts || 0}</span>
          <span className="text-[11px] text-gray-400 block mt-0.5">
            {stats?.pendingApprovalProducts || 0} pending review
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider block mb-1">Delivery Logistics Fleet</span>
          <span className="text-2xl font-black text-amber-600">{stats?.totalDeliveryPartners || 0}</span>
          <span className="text-[11px] text-gray-400 block mt-0.5">Active drivers across regional APMCs</span>
        </div>
      </div>

      {/* ---------------- NAVIGATION TABS ---------------- */}
      <div className="flex items-center gap-1.5 border-b border-gray-200 pb-2 mb-6 overflow-x-auto no-scrollbar text-xs font-bold">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`py-2 px-4 rounded-xl transition-colors ${
            activeTab === 'analytics' ? 'bg-mandi-blue text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Analytics & Trends
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`py-2 px-4 rounded-xl transition-colors ${
            activeTab === 'users' ? 'bg-mandi-blue text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          User Governance
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`py-2 px-4 rounded-xl transition-colors ${
            activeTab === 'products' ? 'bg-mandi-blue text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Produce Moderation
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`py-2 px-4 rounded-xl transition-colors ${
            activeTab === 'orders' ? 'bg-mandi-blue text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          All Orders Audit
        </button>
      </div>

      {/* ---------------- TAB 1: RECHARTS VISUAL ANALYTICS ---------------- */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Revenue Trend Area Chart */}
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

            {/* Category Share Distribution Bar Chart */}
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

          {/* Status Distribution Pie Chart */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-sm text-mandi-navy mb-1">Order Fulfillment Status Distribution</h3>
            <p className="text-[11px] text-gray-400 mb-4">Active order breakdown in logistics pipeline</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.statusDistribution || []}>
                  <XAxis dataKey="status" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#FF9F00" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- TAB 2: USER GOVERNANCE ---------------- */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden text-xs">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-mandi-navy">User Accounts & Roles</h3>
            <input
              type="text"
              placeholder="Search user name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1 text-xs focus:ring-1 focus:ring-mandi-blue focus:outline-none w-64"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Business / Firm</th>
                  <th className="p-3.5">Locality</th>
                  <th className="p-3.5">Account Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50/50">
                    <td className="p-3.5">
                      <div className="font-bold text-gray-800">{u.name}</div>
                      <div className="text-[11px] text-gray-400">{u.email}</div>
                    </td>
                    <td className="p-3.5 font-bold uppercase text-[10px] text-mandi-blue">
                      {u.role}
                    </td>
                    <td className="p-3.5 text-gray-600">{u.businessName || '—'}</td>
                    <td className="p-3.5 text-gray-500">{u.locality || '—'}</td>
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
                          className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
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
      )}

      {/* ---------------- TAB 3: PRODUCE MODERATION ---------------- */}
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
                          className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold px-2.5 py-1 rounded text-xs"
                        >
                          Approve
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateProductApproval(p._id, 'rejected', false)}
                          className="bg-red-50 text-red-600 hover:bg-red-100 font-bold px-2.5 py-1 rounded text-xs"
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

      {/* ---------------- TAB 4: ALL ORDERS AUDIT ---------------- */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden text-xs">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-mandi-navy">All Platform Orders Audit</h3>
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
    </div>
  );
};
