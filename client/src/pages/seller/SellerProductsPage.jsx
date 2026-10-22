import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Search,
  X,
  MapPin,
  Tag,
  Layers,
  Leaf,
  IndianRupee,
  ShieldCheck,
  Warehouse,
  Clock,
  AlertCircle
} from 'lucide-react';
import { sellerService } from '../../services/sellerService.js';
import { farmerSupplyService } from '../../services/farmerSupplyService.js';
import { ProduceGradingModal } from '../../components/ProduceGradingModal.jsx';

export const SellerProductsPage = () => {
  const [activeTab, setActiveTab] = useState('supplies'); // 'supplies' | 'catalog'
  const [supplyRequests, setSupplyRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSupplyModalOpen, setIsSupplyModalOpen] = useState(false);
  const [isAiGradingOpen, setIsAiGradingOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Supply Request Form
  const [supplyForm, setSupplyForm] = useState({
    produceName: '',
    category: 'Vegetables',
    unit: 'kg',
    proposedQuantity: '',
    proposedPricePerUnit: '',
    harvestDate: new Date().toISOString().slice(0, 10),
    qualityGradeProposed: 'Grade A',
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const [reqRes, prodRes] = await Promise.all([
        farmerSupplyService.getMySupplyRequests().catch(() => ({ requests: [] })),
        sellerService.getProducts().catch(() => ({ products: [] }))
      ]);

      if (reqRes?.success) setSupplyRequests(reqRes.requests || []);
      if (prodRes?.success) setProducts(prodRes.products || []);
    } catch (err) {
      setErrorMsg('Failed to load supply submissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSupplySubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const res = await farmerSupplyService.submitSupplyRequest({
        ...supplyForm,
        proposedQuantity: Number(supplyForm.proposedQuantity),
        proposedPricePerUnit: Number(supplyForm.proposedPricePerUnit)
      });

      if (res.success) {
        setSuccessMsg(`Produce supply request #${res.supplyRequest.requestNumber} submitted to Mandi+ Hub!`);
        setIsSupplyModalOpen(false);
        setSupplyForm({
          produceName: '',
          category: 'Vegetables',
          unit: 'kg',
          proposedQuantity: '',
          proposedPricePerUnit: '',
          harvestDate: new Date().toISOString().slice(0, 10),
          qualityGradeProposed: 'Grade A',
          notes: ''
        });
        fetchData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit supply request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <Warehouse className="w-3 h-3 text-emerald-700" />
              Mandi+ Hub Central Fulfilment Supply
            </span>
          </div>
          <h1 className="text-2xl font-black text-mandi-navy flex items-center gap-2">
            <span>Produce Supply & Hub Inbound</span>
          </h1>
          <p className="text-xs text-mandi-muted mt-0.5">
            Submit farm produce to Mandi+ Hub. Accepted shipments are stored and fulfilled automatically to buyers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAiGradingOpen(true)}
            className="bg-emerald-50 hover:bg-emerald-100 text-mandi-green font-bold text-xs py-2 px-3.5 rounded-xl border border-emerald-200 flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>AI Produce Grader</span>
          </button>

          <button
            onClick={() => setIsSupplyModalOpen(true)}
            className="bg-mandi-green hover:bg-mandi-green-dark text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Harvest to Hub</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between text-xs mb-6 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between text-xs mb-6 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 space-x-2 mb-6">
        <button
          onClick={() => setActiveTab('supplies')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'supplies'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Warehouse className="w-4 h-4" />
          <span>My Supply Submissions to Mandi+ Hub ({supplyRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'catalog'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Catalog Produce Listings ({products.length})</span>
        </button>
      </div>

      {/* TAB 1: SUPPLY REQUESTS */}
      {activeTab === 'supplies' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-mandi-navy">Harvest Supply Shipments</h3>
            <span className="text-xs text-gray-400">All produce accepted here enters Mandi+ Hub sellable stock</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3.5">Request #</th>
                  <th className="px-6 py-3.5">Produce Item</th>
                  <th className="px-6 py-3.5">Proposed Qty</th>
                  <th className="px-6 py-3.5">Proposed Price</th>
                  <th className="px-6 py-3.5">Target Hub</th>
                  <th className="px-6 py-3.5">Status & QC Result</th>
                  <th className="px-6 py-3.5 text-right">Settlement Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {supplyRequests.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                      No produce supply requests submitted yet. Click "Submit Harvest to Hub" above.
                    </td>
                  </tr>
                ) : (
                  supplyRequests.map((reqItem) => {
                    const isAccepted = ['accepted', 'partially_accepted'].includes(reqItem.status);
                    return (
                      <tr key={reqItem._id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-mandi-navy">
                          #{reqItem.requestNumber}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{reqItem.produceName}</div>
                          <div className="text-[10px] text-gray-400">{reqItem.category} • Grade: {reqItem.qualityGradeProposed}</div>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-800">
                          {reqItem.proposedQuantity} {reqItem.unit}
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-700">
                          ₹{reqItem.proposedPricePerUnit} / {reqItem.unit}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {reqItem.hubName || 'Mandi+ Hub Central'}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <span className={`inline-flex text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              reqItem.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                              reqItem.status === 'partially_accepted' ? 'bg-teal-100 text-teal-800' :
                              reqItem.status === 'approved_for_delivery' ? 'bg-blue-100 text-blue-800' :
                              reqItem.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {reqItem.status.replace(/_/g, ' ').toUpperCase()}
                            </span>
                            {reqItem.receiving?.acceptedQuantity ? (
                              <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                                Accepted: {reqItem.receiving.acceptedQuantity} {reqItem.unit} (Lot #{reqItem.receiving.batchNumber})
                              </div>
                            ) : null}
                            {reqItem.receiving?.rejectedQuantity ? (
                              <div className="text-[10px] text-red-600 font-semibold mt-0.5">
                                Rejected: {reqItem.receiving.rejectedQuantity} {reqItem.unit} ({reqItem.receiving.rejectionReason})
                              </div>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-mandi-navy">
                          ₹{((reqItem.receiving?.acceptedQuantity || reqItem.proposedQuantity) * (reqItem.receiving?.agreedPurchasePricePerUnit || reqItem.proposedPricePerUnit)).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CATALOG PRODUCE LISTINGS */}
      {activeTab === 'catalog' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-mandi-navy">Live Marketplace Produce Listings</h3>
            <span className="text-xs text-emerald-700 font-semibold">Fulfilled directly by Mandi+ Hub</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-5">
            {products.map((p) => (
              <div key={p._id} className="border border-gray-200 rounded-xl p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded">
                      Fulfilled by Mandi+ Hub
                    </span>
                    <span className="text-[10px] font-bold text-gray-500">
                      {p.qualityGrade || 'Grade A'}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-gray-900 mb-1">{p.name}</h4>
                  <div className="text-xs text-gray-500 mb-2">{p.category}</div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-sm font-black text-mandi-navy">₹{p.pricePerUnit}</span>
                    <span className="text-gray-400">/{p.unit}</span>
                  </div>
                  <div className="font-bold text-emerald-700">
                    {p.stockQuantity} {p.unit} in stock
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: SUBMIT PRODUCE SUPPLY TO MANDI+ HUB */}
      {isSupplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-mandi-navy">Submit Produce Supply to Mandi+ Hub</h3>
              <button onClick={() => setIsSupplyModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Offer your harvest to <strong>Mandi+ Central Fulfilment Hub</strong>. Once approved for arrival, deliver produce to the hub bay for QC grading and batch creation.
            </p>

            <form onSubmit={handleSupplySubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Produce Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hybrid Desi Tomatoes, Nashik Red Onions"
                  value={supplyForm.produceName}
                  onChange={(e) => setSupplyForm({ ...supplyForm, produceName: e.target.value })}
                  className="w-full text-xs border border-gray-200 rounded-xl p-2.5 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category *</label>
                  <select
                    value={supplyForm.category}
                    onChange={(e) => setSupplyForm({ ...supplyForm, category: e.target.value })}
                    className="w-full text-xs border border-gray-200 rounded-xl p-2.5 font-semibold bg-white"
                  >
                    <option value="Vegetables">Vegetables</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Grains">Grains</option>
                    <option value="Pulses">Pulses</option>
                    <option value="Organic Produce">Organic Produce</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Unit of Measure *</label>
                  <select
                    value={supplyForm.unit}
                    onChange={(e) => setSupplyForm({ ...supplyForm, unit: e.target.value })}
                    className="w-full text-xs border border-gray-200 rounded-xl p-2.5 font-semibold bg-white"
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="quintal">Quintal</option>
                    <option value="crate">Crate (25kg)</option>
                    <option value="tonne">Metric Tonne</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Proposed Quantity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 500"
                    value={supplyForm.proposedQuantity}
                    onChange={(e) => setSupplyForm({ ...supplyForm, proposedQuantity: e.target.value })}
                    className="w-full text-xs border border-gray-200 rounded-xl p-2.5 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Proposed Price per Unit (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0.1"
                    step="0.1"
                    placeholder="e.g. 22"
                    value={supplyForm.proposedPricePerUnit}
                    onChange={(e) => setSupplyForm({ ...supplyForm, proposedPricePerUnit: e.target.value })}
                    className="w-full text-xs border border-gray-200 rounded-xl p-2.5 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Harvest / Dispatch Date</label>
                  <input
                    type="date"
                    value={supplyForm.harvestDate}
                    onChange={(e) => setSupplyForm({ ...supplyForm, harvestDate: e.target.value })}
                    className="w-full text-xs border border-gray-200 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Expected Quality Grade</label>
                  <select
                    value={supplyForm.qualityGradeProposed}
                    onChange={(e) => setSupplyForm({ ...supplyForm, qualityGradeProposed: e.target.value })}
                    className="w-full text-xs border border-gray-200 rounded-xl p-2.5 font-semibold bg-white"
                  >
                    <option value="Grade A">Grade A (Premium)</option>
                    <option value="Grade B">Grade B (Standard)</option>
                    <option value="Grade C">Grade C (Commercial)</option>
                    <option value="FAQ">FAQ (Fair Average)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Harvest Notes / Remarks</label>
                <textarea
                  value={supplyForm.notes}
                  onChange={(e) => setSupplyForm({ ...supplyForm, notes: e.target.value })}
                  placeholder="e.g. Graded at farm, packed in aerated plastic crates, ready for cold transport."
                  rows="2"
                  className="w-full text-xs border border-gray-200 rounded-xl p-2.5"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsSupplyModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-mandi-green hover:bg-mandi-green-dark rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submit to Mandi+ Hub</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Grading Modal */}
      {isAiGradingOpen && (
        <ProduceGradingModal
          isOpen={isAiGradingOpen}
          onClose={() => setIsAiGradingOpen(false)}
          onGradeAssigned={(res) => {
            setSupplyForm(prev => ({
              ...prev,
              qualityGradeProposed: res.qualityGrade || 'Grade A',
              notes: `AI Graded: ${res.qualityGrade} (${res.confidence * 100}% confidence). ${res.notes || ''}`
            }));
            setIsAiGradingOpen(false);
          }}
        />
      )}
    </div>
  );
};
