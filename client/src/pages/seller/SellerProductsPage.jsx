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
  UploadCloud
} from 'lucide-react';
import { sellerService } from '../../services/sellerService.js';
import { ProduceGradingModal } from '../../components/ProduceGradingModal.jsx';

export const SellerProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiGradingOpen, setIsAiGradingOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-mandi-navy mb-4">
              {editingProduct ? 'Edit Produce Listing' : 'Add New Farm Produce'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Produce Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Nashik Red Onions (Export Quality)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-mandi-blue focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-mandi-blue focus:outline-none"
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
                  <label className="block text-gray-700 font-semibold mb-1">Unit of Measurement *</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-mandi-blue focus:outline-none"
                  >
                    <option value="kg">kg (Kilogram)</option>
                    <option value="quintal">quintal (100 kg)</option>
                    <option value="crate">crate (20 kg standard)</option>
                    <option value="tonne">tonne (1000 kg)</option>
                    <option value="dozen">dozen</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Price per {unit} (₹) *</label>
                  <input
                    type="number"
                    step="0.5"
                    value={pricePerUnit}
                    onChange={(e) => setPricePerUnit(e.target.value)}
                    placeholder="28"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-mandi-blue focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Original Price (₹) (Optional)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="35 (for discount)"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-mandi-blue focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Available Stock ({unit}) *</label>
                  <input
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    placeholder="2500"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-mandi-blue focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Min. Order Qty (MOQ) *</label>
                  <input
                    type="number"
                    value={minOrderQuantity}
                    onChange={(e) => setMinOrderQuantity(e.target.value)}
                    placeholder="10"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-mandi-blue focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Quality Grade & AI button */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-gray-700 font-semibold">Quality Grade</label>
                  <button
                    type="button"
                    onClick={() => setIsAiGradingOpen(true)}
                    className="text-mandi-green font-bold flex items-center gap-1 hover:underline text-[11px]"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                    <span>Run AI Quality Grading</span>
                  </button>
                </div>
                <select
                  value={qualityGrade}
                  onChange={(e) => setQualityGrade(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-mandi-blue focus:outline-none"
                >
                  <option value="Grade A">Grade A (Premium / Export Quality)</option>
                  <option value="Grade B">Grade B (Standard Commercial Grade)</option>
                  <option value="Grade C">Grade C (Processing / Economy)</option>
                  <option value="FAQ">FAQ (Fair Average Quality)</option>
                </select>
              </div>

              {/* Wholesale Tier Discount */}
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                <label className="block text-gray-700 font-bold mb-1.5">Optional Wholesale Bulk Tier</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder={`Min Qty (e.g. 50 ${unit})`}
                    value={bulkTierQty}
                    onChange={(e) => setBulkTierQty(e.target.value)}
                    className="p-1.5 border border-gray-300 rounded text-xs"
                  />
                  <input
                    type="number"
                    placeholder={`Discounted Price ₹/${unit}`}
                    value={bulkTierPrice}
                    onChange={(e) => setBulkTierPrice(e.target.value)}
                    className="p-1.5 border border-gray-300 rounded text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Produce Image URL</label>
                <input
                  type="text"
                  placeholder="https://... or upload through AI grading"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-mandi-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Harvest Locality *</label>
                <input
                  type="text"
                  value={pickupLocality}
                  onChange={(e) => setPickupLocality(e.target.value)}
                  placeholder="e.g. Nashik APMC / Dindori Farm"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-mandi-blue focus:outline-none"
                  required
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-gray-700">
                <input
                  type="checkbox"
                  checked={isOrganic}
                  onChange={(e) => setIsOrganic(e.target.checked)}
                  className="rounded text-mandi-green"
                />
                <span>Certified Organic Chemical-Free Produce</span>
              </label>

              <button
                type="submit"
                className="w-full bg-mandi-green hover:bg-mandi-green-dark text-white font-bold py-2.5 rounded-xl transition-colors mt-2"
              >
                {editingProduct ? 'Update Listing' : 'Publish Produce Listing'}
              </button>
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
