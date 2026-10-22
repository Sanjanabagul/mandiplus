import React, { useState, useEffect } from 'react';
import { DollarSign, Download, TrendingUp, Clock, CheckCircle2, RefreshCw, Warehouse, ShieldCheck } from 'lucide-react';
import { sellerService } from '../../services/sellerService.js';
import { farmerSupplyService } from '../../services/farmerSupplyService.js';

export const SellerEarningsPage = () => {
  const [earnings, setEarnings] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEarnings = async () => {
      try {
        setLoading(true);
        const [earnRes, settlRes] = await Promise.all([
          sellerService.getEarnings().catch(() => null),
          farmerSupplyService.getSettlements().catch(() => ({ settlements: [] }))
        ]);

        if (earnRes?.success) setEarnings(earnRes);
        if (settlRes?.success) setSettlements(settlRes.settlements || []);
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

  const totalSettledFromBatches = settlements.reduce((sum, s) => sum + (s.netPayable || 0), 0);
  const totalPaidOut = settlements.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
  const totalPending = Math.max(0, totalSettledFromBatches - totalPaidOut);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <Warehouse className="w-3 h-3 text-emerald-700" />
              Mandi+ Hub Settlement Ledger
            </span>
          </div>
          <h1 className="text-2xl font-black text-mandi-navy">Farmer Earnings & Mandi+ Hub Settlements</h1>
          <p className="text-xs text-mandi-muted">Direct APMC bank settlement history and accepted produce batch ledger</p>
        </div>

        <button
          onClick={handleDownloadCsv}
          className="bg-white border border-gray-300 hover:border-mandi-green hover:text-mandi-green text-gray-700 font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-2 shadow-xs transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Download CSV Report</span>
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-gray-400 font-semibold text-[11px] uppercase tracking-wider block mb-1">
            Total Produce Value
          </span>
          <span className="text-2xl font-black text-mandi-navy">
            ₹{(totalSettledFromBatches || earnings?.grossRevenue || 0).toLocaleString('en-IN')}
          </span>
          <p className="text-[11px] text-gray-500 mt-1">Value of produce accepted by Mandi+ Hub</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-emerald-700 font-semibold text-[11px] uppercase tracking-wider block mb-1">
            Approved Payouts
          </span>
          <span className="text-2xl font-black text-emerald-800">
            ₹{(totalSettledFromBatches || earnings?.completedPayout || 0).toLocaleString('en-IN')}
          </span>
          <p className="text-[11px] text-emerald-600 mt-1">Approved for bank transfer upon QC pass</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <span className="text-amber-700 font-semibold text-[11px] uppercase tracking-wider block mb-1">
            Pending Processing
          </span>
          <span className="text-2xl font-black text-amber-700">
            ₹{(totalPending || earnings?.pendingPayout || 0).toLocaleString('en-IN')}
          </span>
          <p className="text-[11px] text-gray-400 mt-1">Under hub batch inspection / clearance</p>
        </div>
      </div>

      {/* Mandi+ Hub Accepted Produce Settlements Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8">
        <div className="p-4 bg-emerald-50/50 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-bold text-sm text-emerald-950 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Mandi+ Hub Accepted Batch Settlements ({settlements.length})</span>
          </h3>
          <span className="text-xs text-emerald-700 font-semibold">Calculated from physical QC acceptance</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px] bg-gray-50">
              <tr>
                <th className="p-3.5">Settlement ID</th>
                <th className="p-3.5">Produce Item</th>
                <th className="p-3.5">Accepted Qty</th>
                <th className="p-3.5">Agreed Rate</th>
                <th className="p-3.5">Net Payable</th>
                <th className="p-3.5">Fulfilment Hub</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {settlements.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-gray-400">
                    No batch settlements recorded yet. Once your harvest shipments pass QC at Mandi+ Hub, payout records will appear here.
                  </td>
                </tr>
              ) : (
                settlements.map((s, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="p-3.5 font-mono font-bold text-mandi-navy">{s.settlementNumber}</td>
                    <td className="p-3.5 font-bold text-gray-800">{s.produceName}</td>
                    <td className="p-3.5 font-semibold text-gray-700">{s.acceptedQuantity} {s.unit}</td>
                    <td className="p-3.5 font-semibold text-gray-700">₹{s.ratePerUnit}/{s.unit}</td>
                    <td className="p-3.5 font-black text-emerald-800">₹{s.netPayable.toLocaleString('en-IN')}</td>
                    <td className="p-3.5 text-gray-600">{s.hubName || 'Mandi+ Hub Central'}</td>
                    <td className="p-3.5">
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                        {s.settlementStatus || 'APPROVED'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
