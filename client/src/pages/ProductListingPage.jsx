import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Filter,
  SlidersHorizontal,
  ChevronDown,
  X,
  RefreshCw,
  Search,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { productService } from '../services/productService.js';
import { ProductCard } from '../components/ProductCard.jsx';

export const ProductListingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Read filters from URL params
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const qualityGrade = searchParams.get('qualityGrade') || '';
  const isOrganic = searchParams.get('isOrganic') === 'true';
  const inStockOnly = searchParams.get('inStockOnly') === 'true';
  const hasBulkTiers = searchParams.get('hasBulkTiers') === 'true';
  const sortBy = searchParams.get('sortBy') || 'newest';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Local filter form state
  const [filterSearch, setFilterSearch] = useState(search);
  const [filterMinPrice, setFilterMinPrice] = useState(minPrice);
  const [filterMaxPrice, setFilterMaxPrice] = useState(maxPrice);
  const [selectedGrades, setSelectedGrades] = useState(qualityGrade ? qualityGrade.split(',') : []);

  useEffect(() => {
    setFilterSearch(search);
    setFilterMinPrice(minPrice);
    setFilterMaxPrice(maxPrice);
    setSelectedGrades(qualityGrade ? qualityGrade.split(',') : []);
  }, [search, minPrice, maxPrice, qualityGrade]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const query = {
        search,
        category,
        minPrice,
        maxPrice,
        qualityGrade,
        isOrganic: isOrganic ? 'true' : undefined,
        inStockOnly: inStockOnly ? 'true' : undefined,
        hasBulkTiers: hasBulkTiers ? 'true' : undefined,
        sortBy,
        page,
        limit: 12
      };

      const res = await productService.getProducts(query);
      if (res.success) {
        setProducts(res.products || []);
        setTotalCount(res.totalCount || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value === undefined || value === null || value === '' || value === false) {
      next.delete(key);
    } else {
      next.set(key, String(value));
    }
    next.set('page', '1'); // Reset to page 1 on filter update
    setSearchParams(next);
  };

  const handleGradeToggle = (grade) => {
    let nextGrades;
    if (selectedGrades.includes(grade)) {
      nextGrades = selectedGrades.filter(g => g !== grade);
    } else {
      nextGrades = [...selectedGrades, grade];
    }
    setSelectedGrades(nextGrades);
    updateParam('qualityGrade', nextGrades.length > 0 ? nextGrades.join(',') : '');
  };

  const handleApplyPriceFilter = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (filterMinPrice) next.set('minPrice', filterMinPrice);
    else next.delete('minPrice');

    if (filterMaxPrice) next.set('maxPrice', filterMaxPrice);
    else next.delete('maxPrice');

    next.set('page', '1');
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const categoriesList = [
    'All Products',
    'Vegetables',
    'Fruits',
    'Grains',
    'Pulses',
    'Spices',
    'Organic Produce',
    'Bulk Deals',
    'Dairy'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
        <Link to="/" className="hover:text-mandi-blue">Home</Link>
        <span>/</span>
        <span className="text-gray-800 font-semibold">
          {category ? category : search ? `Search: "${search}"` : 'All Produce'}
        </span>
      </nav>

      {/* Title & Sorting Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-mandi-navy">
            {category || (search ? `Search results for "${search}"` : 'All Agricultural Produce')}
          </h1>
          <p className="text-xs text-mandi-muted mt-0.5">
            Showing {products.length} of {totalCount} verified farmer listings
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Mobile Filter Toggle Button */}
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="md:hidden flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <Filter className="w-4 h-4 text-mandi-blue" />
            <span>Filters</span>
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => updateParam('sortBy', e.target.value)}
              className="border border-gray-300 rounded-lg py-1.5 px-3 text-xs bg-white text-gray-800 font-medium focus:ring-2 focus:ring-mandi-blue focus:outline-none"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="relevance">Relevance</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Customer Rating</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* ---------------- DESKTOP FILTERS SIDEBAR ---------------- */}
        <aside className="hidden md:block col-span-1 bg-white p-5 rounded-xl border border-gray-200 shadow-sm self-start space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="font-bold text-sm text-mandi-navy flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-mandi-blue" /> Filters
            </h3>
            <button
              onClick={clearAllFilters}
              className="text-[11px] text-mandi-blue hover:underline font-semibold"
            >
              Clear All
            </button>
          </div>

          {/* Category Filter */}
          <div>
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Category</h4>
            <div className="space-y-1 text-xs">
              {categoriesList.map((cat, idx) => {
                const isSelected = (!category && cat === 'All Products') || category === cat;
                return (
                  <button
                    key={idx}
                    onClick={() => updateParam('category', cat === 'All Products' ? '' : cat)}
                    className={`w-full text-left py-1.5 px-2 rounded-md transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50 text-mandi-blue font-bold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>{cat}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-mandi-blue" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="pt-3 border-t border-gray-100">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Price (₹ / Unit)</h4>
            <form onSubmit={handleApplyPriceFilter} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min ₹"
                  value={filterMinPrice}
                  onChange={(e) => setFilterMinPrice(e.target.value)}
                  className="border border-gray-300 rounded p-1.5 text-xs focus:ring-1 focus:ring-mandi-blue focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Max ₹"
                  value={filterMaxPrice}
                  onChange={(e) => setFilterMaxPrice(e.target.value)}
                  className="border border-gray-300 rounded p-1.5 text-xs focus:ring-1 focus:ring-mandi-blue focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gray-100 hover:bg-mandi-blue hover:text-white text-gray-700 py-1.5 rounded text-xs font-semibold transition-colors"
              >
                Apply Range
              </button>
            </form>
          </div>

          {/* Quality Grade Filter */}
          <div className="pt-3 border-t border-gray-100">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Quality Grade</h4>
            <div className="space-y-1.5 text-xs">
              {['Grade A', 'Grade B', 'Grade C', 'FAQ'].map((grade, idx) => (
                <label key={idx} className="flex items-center gap-2 cursor-pointer text-gray-700 hover:text-mandi-navy">
                  <input
                    type="checkbox"
                    checked={selectedGrades.includes(grade)}
                    onChange={() => handleGradeToggle(grade)}
                    className="rounded text-mandi-blue focus:ring-mandi-blue w-3.5 h-3.5"
                  />
                  <span>{grade}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Special Attributes Toggles */}
          <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-gray-700 hover:text-mandi-navy">
              <input
                type="checkbox"
                checked={isOrganic}
                onChange={(e) => updateParam('isOrganic', e.target.checked)}
                className="rounded text-mandi-blue focus:ring-mandi-blue w-3.5 h-3.5"
              />
              <span className="font-semibold text-emerald-800">Certified Organic Only</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-gray-700 hover:text-mandi-navy">
              <input
                type="checkbox"
                checked={hasBulkTiers}
                onChange={(e) => updateParam('hasBulkTiers', e.target.checked)}
                className="rounded text-mandi-blue focus:ring-mandi-blue w-3.5 h-3.5"
              />
              <span className="font-semibold text-blue-900">Wholesale Tier Deals</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-gray-700 hover:text-mandi-navy">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => updateParam('inStockOnly', e.target.checked)}
                className="rounded text-mandi-blue focus:ring-mandi-blue w-3.5 h-3.5"
              />
              <span>In Stock Only</span>
            </label>
          </div>
        </aside>

        {/* ---------------- MAIN PRODUCT GRID ---------------- */}
        <main className="col-span-1 md:col-span-3">
          {loading ? (
            <div className="min-h-[400px] flex flex-col items-center justify-center text-gray-400">
              <RefreshCw className="w-8 h-8 animate-spin text-mandi-blue mb-2" />
              <p className="text-xs font-semibold">Loading verified produce listings...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-mandi-blue flex items-center justify-center mx-auto mb-3">
                <Search className="w-8 h-8 text-mandi-blue" />
              </div>
              <h3 className="text-base font-bold text-mandi-navy mb-1">No matching produce found</h3>
              <p className="text-xs text-mandi-muted max-w-sm mx-auto mb-4">
                We couldn't find any products matching your active filters. Try adjusting your search keyword or clearing price and grade filters.
              </p>
              <button
                onClick={clearAllFilters}
                className="bg-mandi-blue text-white text-xs font-bold py-2 px-5 rounded-lg hover:bg-mandi-blue-dark transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {products.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => updateParam('page', page - 1)}
                    disabled={page <= 1}
                    className="p-2 border border-gray-300 rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                    <button
                      key={pNum}
                      onClick={() => updateParam('page', pNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                        page === pNum
                          ? 'bg-mandi-blue text-white shadow-xs'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pNum}
                    </button>
                  ))}

                  <button
                    onClick={() => updateParam('page', page + 1)}
                    disabled={page >= totalPages}
                    className="p-2 border border-gray-300 rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ---------------- MOBILE FILTER DRAWER MODAL ---------------- */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-xs md:hidden animate-fade-in">
          <div className="bg-white w-4/5 max-w-sm h-full p-5 overflow-y-auto ml-auto shadow-2xl flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="font-bold text-sm text-mandi-navy">Filter Products</h3>
                <button onClick={() => setIsMobileFilterOpen(false)} className="p-1 text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Category */}
              <div>
                <h4 className="text-xs font-bold text-gray-800 uppercase mb-2">Category</h4>
                <div className="space-y-1 text-xs">
                  {categoriesList.map((cat, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        updateParam('category', cat === 'All Products' ? '' : cat);
                        setIsMobileFilterOpen(false);
                      }}
                      className={`w-full text-left py-1.5 px-2 rounded-md ${
                        category === cat ? 'bg-blue-50 text-mandi-blue font-bold' : 'text-gray-600'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grade */}
              <div className="pt-3 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-800 uppercase mb-2">Quality Grade</h4>
                <div className="space-y-1.5 text-xs">
                  {['Grade A', 'Grade B', 'Grade C', 'FAQ'].map((grade, idx) => (
                    <label key={idx} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedGrades.includes(grade)}
                        onChange={() => handleGradeToggle(grade)}
                        className="rounded text-mandi-blue w-4 h-4"
                      />
                      <span>{grade}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex gap-2">
              <button
                onClick={() => { clearAllFilters(); setIsMobileFilterOpen(false); }}
                className="w-1/2 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700"
              >
                Clear
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-1/2 py-2 bg-mandi-blue text-white rounded-lg text-xs font-bold"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
