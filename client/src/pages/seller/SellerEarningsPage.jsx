import React, { useState, useEffect } from 'react';
import { DollarSign, Download, TrendingUp, Clock, CheckCircle2, RefreshCw } from 'lucide-react';
import { sellerService } from '../../services/sellerService.js';

export const SellerEarningsPage = () => {
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEarnings = async () => {
      try {
        const res = await sellerService.getEarnings();
        if (res.success) {
          setEarnings(res);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadEarnings();
  }, []);

  const handleDownloadCsv = () => {
    window.open('/api/reports/export-orders', '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-mandi-green" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 mb-6">
        <div>
          <h1 className="text-2xl font-black text-mandi-navy">Farmer Earnings & Settlements</h1>
          <p className="text-xs text-mandi-muted">Direct APMC bank settlement history and gross transaction ledgers</p>
        </div>

        <button
          onClick={handleDownloadCsv}
          className="bg-white border border-gray-300 hover:border-mandi-green hover:text-mandi-green text-gray-700 font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-2 shadow-xs transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Download CSV Sales Report</span>
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-gray-400 font-semibold text-[11px] uppercase tracking-wider block mb-1">
            Total Gross Revenue
          </span>
          <span className="text-2xl font-black text-mandi-navy">
            ₹{(earnings?.grossRevenue || 0).toLocaleString('en-IN')}
          </span>
          <p className="text-[11px] text-gray-500 mt-1">Total value of all farm produce sold</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-emerald-700 font-semibold text-[11px] uppercase tracking-wider block mb-1">
            Settled Payouts
          </span>
          <span className="text-2xl font-black text-emerald-800">
            ₹{(earnings?.completedPayout || 0).toLocaleString('en-IN')}
          </span>
          <p className="text-[11px] text-emerald-600 mt-1">Cleared from delivered orders</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-amber-700 font-semibold text-[11px] uppercase tracking-wider block mb-1">
            Pending Settlements
          </span>
          <span className="text-2xl font-black text-amber-700">
            ₹{(earnings?.pendingPayout || 0).toLocaleString('en-IN')}
          </span>
          <p className="text-[11px] text-gray-400 mt-1">Orders currently in dispatch / packing</p>
        </div>
      </div>

      {/* Transaction Breakdown Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-bold text-sm text-mandi-navy">Order Transaction History</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Order Number</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Crops Count</th>
                <th className="p-3.5">Settlement Amount</th>
                <th className="p-3.5">Order Status</th>
                <th className="p-3.5">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(earnings?.transactions || []).map((t, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50">
                  <td className="p-3.5 font-bold text-mandi-navy">#{t.orderNumber}</td>
                  <td className="p-3.5 text-gray-500">{new Date(t.date).toLocaleDateString('en-IN')}</td>
                  <td className="p-3.5 text-gray-700">{t.itemsCount} produce items</td>
                  <td className="p-3.5 font-black text-emerald-800">₹{t.amount.toLocaleString('en-IN')}</td>
                  <td className="p-3.5">
                    <span className="bg-blue-100 text-mandi-blue font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                      {t.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className={`font-bold uppercase text-[10px] ${t.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {t.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
