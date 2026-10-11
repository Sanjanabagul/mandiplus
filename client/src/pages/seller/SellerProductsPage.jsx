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
  UploadCloud,
  MapPin,
  Tag,
  Layers,
  Leaf,
  Image as ImageIcon,
  IndianRupee,
  ShieldCheck
} from 'lucide-react';
import { sellerService } from '../../services/sellerService.js';
import { ProduceGradingModal } from '../../components/ProduceGradingModal.jsx';

export const SellerProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiGradingOpen, setIsAiGradingOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Vegetables');
  const [unit, setUnit] = useState('kg');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [minOrderQuantity, setMinOrderQuantity] = useState('10');
  const [qualityGrade, setQualityGrade] = useState('Grade A');
  const [pickupLocality, setPickupLocality] = useState('Nashik APMC');
  const [isOrganic, setIsOrganic] = useState(false);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Bulk tier inputs
  const [bulkTierQty, setBulkTierQty] = useState('50');
  const [bulkTierPrice, setBulkTierPrice] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await sellerService.getProducts();
      if (res.success) {
        setProducts(res.products || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setCategory('Vegetables');
    setUnit('kg');
    setPricePerUnit('');
    setOriginalPrice('');
    setStockQuantity('');
    setMinOrderQuantity('10');
    setQualityGrade('Grade A');
    setPickupLocality('Nashik APMC');
    setIsOrganic(false);
    setDescription('');
    setImageUrl('');
    setBulkTierPrice('');
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    setName(p.name);
    setCategory(p.category);
    setUnit(p.unit);
    setPricePerUnit(p.pricePerUnit);
    setOriginalPrice(p.originalPrice || '');
    setStockQuantity(p.stockQuantity);
    setMinOrderQuantity(p.minOrderQuantity);
    setQualityGrade(p.qualityGrade);
    setPickupLocality(p.pickupLocality);
    setIsOrganic(p.isOrganic);
    setDescription(p.description || '');
    setImageUrl(p.images?.[0] || '');
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();

    const bulkTiers = [];
    if (bulkTierQty && bulkTierPrice) {
      const discount = Math.round(((parseFloat(pricePerUnit) - parseFloat(bulkTierPrice)) / parseFloat(pricePerUnit)) * 100);
      bulkTiers.push({
        minQuantity: parseFloat(bulkTierQty),
        pricePerUnit: parseFloat(bulkTierPrice),
        discountPercent: Math.max(0, discount)
      });
    }

    const payload = {
      name,
      category,
      unit,
      pricePerUnit: parseFloat(pricePerUnit),
      originalPrice: originalPrice ? parseFloat(originalPrice) : null,
      stockQuantity: parseInt(stockQuantity, 10),
      minOrderQuantity: parseInt(minOrderQuantity, 10),
      qualityGrade,
      pickupLocality,
      isOrganic,
      description,
      images: imageUrl ? [imageUrl] : undefined,
      bulkPricingTiers: bulkTiers.length > 0 ? bulkTiers : undefined
    };

    setIsSaving(true);
    try {
      if (editingProduct) {
        await sellerService.updateProduct(editingProduct._id, payload);
      } else {
        await sellerService.createProduct(payload);
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving product.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this produce listing?')) {
      try {
        await sellerService.deleteProduct(id);
        fetchProducts();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 mb-6">
        <div>
          <h1 className="text-2xl font-black text-mandi-navy">My Farm Produce Catalog</h1>
          <p className="text-xs text-mandi-muted">Manage active inventory, wholesale price tiers, and quality grading</p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-mandi-green hover:bg-mandi-green-dark text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Produce Listing</span>
        </button>
      </div>

      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-mandi-green" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm max-w-md mx-auto">
          <h3 className="font-bold text-sm text-mandi-navy mb-1">No produce listed yet</h3>
          <p className="text-xs text-mandi-muted mb-4">Start selling to local grocery stores and restaurants now.</p>
          <button
            onClick={openAddModal}
            className="bg-mandi-green text-white text-xs font-bold py-2 px-5 rounded-lg"
          >
            Create First Listing
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Produce Details</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Price & MOQ</th>
                  <th className="p-3.5">Stock</th>
                  <th className="p-3.5">Quality Grade</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images?.[0] || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=100&q=80'}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-gray-800">{p.name}</div>
                          <div className="text-[11px] text-gray-400">{p.pickupLocality}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 text-gray-600 font-medium">
                      {p.category}
                    </td>

                    <td className="p-3.5">
                      <div className="font-bold text-mandi-navy">₹{p.pricePerUnit} / {p.unit}</div>
                      <div className="text-[10px] text-gray-400">Min: {p.minOrderQuantity} {p.unit}</div>
                    </td>

                    <td className="p-3.5">
                      <span className={`font-bold ${p.stockQuantity < 20 ? 'text-red-600' : 'text-emerald-700'}`}>
                        {p.stockQuantity} {p.unit}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase ${
                        p.qualityGrade === 'Grade A' ? 'bg-mandi-green' : 'bg-amber-500'
                      }`}>
                        {p.qualityGrade}
                      </span>
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-mandi-blue hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(p._id)}
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------- ADD / EDIT PRODUCE MODAL ---------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex justify-center items-start sm:items-center p-3 sm:p-4 md:p-6 animate-fade-in">
          {/* Backdrop click to close */}
          <div className="fixed inset-0 -z-10" onClick={() => setIsModalOpen(false)} />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl lg:max-w-3xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden border border-gray-100 my-auto">
            <form onSubmit={handleSaveProduct} className="flex flex-col h-full max-h-[92vh] sm:max-h-[88vh] overflow-hidden">
              
              {/* Sticky Modal Header */}
              <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xl border border-emerald-100 shrink-0">
                    🌾
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-mandi-navy">
                      {editingProduct ? 'Edit Produce Listing' : 'Add New Farm Produce'}
                    </h3>
                    <p className="text-xs text-mandi-muted">
                      List fresh harvest with transparent wholesale rates and quality grades
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <div className="overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar flex-1 text-xs sm:text-sm">
                
                {/* Section 1: Basic Produce Information */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-mandi-green" />
                    <span>Basic Harvest Details</span>
                  </h4>

                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-1 text-xs">
                        Produce Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Nashik Red Onions (Export Quality)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-mandi-blue/20 focus:border-mandi-blue focus:outline-none transition-all placeholder:text-gray-400"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-gray-700 font-semibold mb-1 text-xs">
                          Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-mandi-blue/20 focus:border-mandi-blue focus:outline-none transition-all bg-white"
                        >
                          <option value="Vegetables">Vegetables</option>
                          <option value="Fruits">Fruits</option>
                          <option value="Grains">Grains</option>
                          <option value="Pulses">Pulses</option>
                          <option value="Spices">Spices</option>
                          <option value="Organic Produce">Organic Produce</option>
                          <option value="Bulk Deals">Bulk Deals</option>
                          <option value="Dairy">Dairy</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-gray-700 font-semibold mb-1 text-xs">
                          Unit of Measurement <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={unit}
                          onChange={(e) => setUnit(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-mandi-blue/20 focus:border-mandi-blue focus:outline-none transition-all bg-white"
                        >
                          <option value="kg">kg (Kilogram)</option>
                          <option value="quintal">quintal (100 kg)</option>
                          <option value="crate">crate (20 kg standard)</option>
                          <option value="tonne">tonne (1000 kg)</option>
                          <option value="dozen">dozen</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Pricing & Stock Inventory */}
                <div className="pt-3 border-t border-gray-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5 text-mandi-green" />
                    <span>Pricing & Inventory</span>
                  </h4>

                  <div className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-gray-700 font-semibold mb-1 text-xs">
                          Selling Price per {unit} (₹) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-2.5 text-gray-400 text-xs sm:text-sm font-semibold">₹</span>
                          <input
                            type="number"
                            step="0.5"
                            value={pricePerUnit}
                            onChange={(e) => setPricePerUnit(e.target.value)}
                            placeholder="28"
                            className="w-full pl-8 pr-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-mandi-blue/20 focus:border-mandi-blue focus:outline-none font-semibold text-mandi-navy"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-gray-700 font-semibold text-xs">Original / APMC Rate (₹)</label>
                          {originalPrice && pricePerUnit && parseFloat(originalPrice) > parseFloat(pricePerUnit) && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              {Math.round(((parseFloat(originalPrice) - parseFloat(pricePerUnit)) / parseFloat(originalPrice)) * 100)}% OFF
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <span className="absolute left-3.5 top-2.5 text-gray-400 text-xs sm:text-sm font-semibold">₹</span>
                          <input
                            type="number"
                            step="0.5"
                            value={originalPrice}
                            onChange={(e) => setOriginalPrice(e.target.value)}
                            placeholder="35 (optional for discount display)"
                            className="w-full pl-8 pr-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-mandi-blue/20 focus:border-mandi-blue focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-gray-700 font-semibold mb-1 text-xs">
                          Available Stock ({unit}) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={stockQuantity}
                          onChange={(e) => setStockQuantity(e.target.value)}
                          placeholder="e.g. 2500"
                          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-mandi-blue/20 focus:border-mandi-blue focus:outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 font-semibold mb-1 text-xs">
                          Min. Order Qty (MOQ in {unit}) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={minOrderQuantity}
                          onChange={(e) => setMinOrderQuantity(e.target.value)}
                          placeholder="e.g. 10"
                          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-mandi-blue/20 focus:border-mandi-blue focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    {/* Wholesale Bulk Tier Card */}
                    <div className="bg-emerald-50/50 border border-emerald-200/70 rounded-xl p-3.5">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-gray-800 font-bold text-xs flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Wholesale Bulk Discount Tier (Optional)</span>
                        </label>
                        {bulkTierQty && bulkTierPrice && pricePerUnit && parseFloat(bulkTierPrice) < parseFloat(pricePerUnit) && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                            Bulk tier: {Math.round(((parseFloat(pricePerUnit) - parseFloat(bulkTierPrice)) / parseFloat(pricePerUnit)) * 100)}% cheaper
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mb-3">
                        Encourage larger bulk orders from restaurants & kirana retailers with dedicated volume discounts.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-gray-600 text-[11px] mb-1 font-medium">Qualifying Min. Qty ({unit})</label>
                          <input
                            type="number"
                            placeholder={`e.g. 50 ${unit}`}
                            value={bulkTierQty}
                            onChange={(e) => setBulkTierQty(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-mandi-green"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 text-[11px] mb-1 font-medium">Discounted Rate (₹/{unit})</label>
                          <input
                            type="number"
                            step="0.5"
                            placeholder={`e.g. ${pricePerUnit ? Math.round(parseFloat(pricePerUnit) * 0.9) : 25}`}
                            value={bulkTierPrice}
                            onChange={(e) => setBulkTierPrice(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-mandi-green"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Quality Grading & Origin Details */}
                <div className="pt-3 border-t border-gray-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-mandi-green" />
                    <span>Quality Grade & Location</span>
                  </h4>

                  <div className="space-y-3.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-gray-700 font-semibold text-xs">Quality Grade</label>
                        <button
                          type="button"
                          onClick={() => setIsAiGradingOpen(true)}
                          className="text-emerald-700 font-bold flex items-center gap-1.5 hover:underline text-[11px] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors hover:bg-emerald-100"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>Run AI Quality Grading</span>
                        </button>
                      </div>
                      <select
                        value={qualityGrade}
                        onChange={(e) => setQualityGrade(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-mandi-blue/20 focus:border-mandi-blue focus:outline-none transition-all bg-white"
                      >
                        <option value="Grade A">Grade A (Premium / Export Quality)</option>
                        <option value="Grade B">Grade B (Standard Commercial Grade)</option>
                        <option value="Grade C">Grade C (Processing / Economy)</option>
                        <option value="FAQ">FAQ (Fair Average Quality)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-gray-700 font-semibold mb-1 text-xs">
                          Harvest / APMC Locality <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                          <input
                            type="text"
                            value={pickupLocality}
                            onChange={(e) => setPickupLocality(e.target.value)}
                            placeholder="e.g. Nashik APMC / Dindori Farm"
                            className="w-full pl-10 pr-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-mandi-blue/20 focus:border-mandi-blue focus:outline-none"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-gray-700 font-semibold mb-1 text-xs">Produce Photo URL (Optional)</label>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <ImageIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                            <input
                              type="text"
                              placeholder="https://... or auto-fill via AI"
                              value={imageUrl}
                              onChange={(e) => setImageUrl(e.target.value)}
                              className="w-full pl-10 pr-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-mandi-blue/20 focus:border-mandi-blue focus:outline-none"
                            />
                          </div>
                          {imageUrl && (
                            <img
                              src={imageUrl}
                              alt="Preview"
                              className="w-10 h-10 rounded-xl object-cover border border-gray-200 shrink-0"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-semibold mb-1 text-xs">Produce Description (Optional)</label>
                      <textarea
                        rows="2"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g. Freshly harvested this morning, uniform shape, stored in climate-controlled crates."
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-mandi-blue/20 focus:border-mandi-blue focus:outline-none"
                      />
                    </div>

                    {/* Certified Organic toggle card */}
                    <label className="flex items-center gap-3 p-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/40 hover:bg-emerald-50/80 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isOrganic}
                        onChange={(e) => setIsOrganic(e.target.checked)}
                        className="w-4 h-4 rounded text-mandi-green focus:ring-mandi-green"
                      />
                      <div className="flex items-center gap-2">
                        <Leaf className="w-4 h-4 text-emerald-700 shrink-0" />
                        <div>
                          <span className="font-bold text-xs text-gray-800">Certified Organic & Chemical-Free</span>
                          <span className="text-[11px] text-gray-500 block">Highlights your listing with a verified organic green badge</span>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Sticky Modal Footer */}
              <div className="px-5 sm:px-6 py-3.5 border-t border-gray-100 bg-gray-50/90 flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs sm:text-sm font-semibold hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-mandi-green hover:bg-mandi-green-dark text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Listing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{editingProduct ? 'Update Produce Listing' : 'Publish Produce Listing'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Produce Grading Modal */}
      <ProduceGradingModal
        isOpen={isAiGradingOpen}
        onClose={() => setIsAiGradingOpen(false)}
        onGradingComplete={({ grade, imageUrl }) => {
          setQualityGrade(grade);
          if (imageUrl) setImageUrl(imageUrl);
        }}
      />
    </div>
  );
};
