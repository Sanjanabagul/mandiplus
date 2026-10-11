import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Sparkles,
  ArrowRight,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  Users,
  Store,
  Truck,
  Scale,
  Bot
} from 'lucide-react';
import { productService } from '../services/productService.js';
import { ProductCard } from '../components/ProductCard.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { AIAssistantDrawer } from '../components/AIAssistantDrawer.jsx';

export const HomePage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [deals, setDeals] = useState([]);
  const [vegetables, setVegetables] = useState([]);
  const [grains, setGrains] = useState([]);
  const [organic, setOrganic] = useState([]);
  const [nearbyFarmers, setNearbyFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [dealsRes, vegRes, grainRes, orgRes, farmersRes] = await Promise.all([
          productService.getFeaturedDeals(),
          productService.getProducts({ category: 'Vegetables', limit: 5 }),
          productService.getProducts({ category: 'Grains', limit: 5 }),
          productService.getProducts({ isOrganic: 'true', limit: 5 }),
          productService.getNearbyFarmers()
        ]);

        if (dealsRes.success) setDeals(dealsRes.deals || []);
        if (vegRes.success) setVegetables(vegRes.products || []);
        if (grainRes.success) setGrains(grainRes.products || []);
        if (orgRes.success) setOrganic(orgRes.products || []);
        if (farmersRes.success) setNearbyFarmers(farmersRes.farmers || []);
      } catch (err) {
        console.error('Error fetching homepage data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  return (
    <div className="min-h-screen bg-mandi-bg pb-12">

      {/* ---------------- SECTION 1: HERO PROMOTIONAL BANNER ---------------- */}
      <div className="relative overflow-hidden bg-gradient-to-r from-mandi-navy via-[#1f3557] to-[#164e32] text-white py-12 md:py-16 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="absolute inset-0 opacity-15 mix-blend-overlay bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>India's Hyper-Local Agricultural Commerce Platform</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Fresh from Farms. <br />
              <span className="text-yellow-300">Direct to Your Business.</span>
            </h1>

            <p className="text-sm sm:text-base text-gray-200 max-w-xl leading-relaxed">
              Discover quality produce at competitive wholesale prices from farmers and agricultural suppliers near you. Zero middlemen, genuine quality grades, and transparent mandi rates.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/products"
                className="bg-mandi-blue hover:bg-mandi-blue-dark text-white font-bold px-6 py-3 rounded-lg text-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <span>Shop Fresh Produce</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/register?role=seller"
                className="bg-mandi-green hover:bg-mandi-green-dark text-white font-bold px-6 py-3 rounded-lg text-sm transition-all shadow-md flex items-center gap-2"
              >
                <span>Sell on Mandi+</span>
              </Link>

              <button
                onClick={() => setIsAiDrawerOpen(true)}
                className="bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-3 rounded-lg text-sm backdrop-blur-sm transition-all border border-white/20 flex items-center gap-2"
              >
                <Bot className="w-4 h-4 text-yellow-300" />
                <span>AI Procurement</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 relative hidden lg:block">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80"
                alt="Fresh Produce Marketplace"
                className="rounded-xl w-full h-72 object-cover shadow-inner"
              />
              <div className="mt-3 flex items-center justify-between text-xs text-white/90 px-1">
                <span className="flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 100% Verified Regional Farmers
                </span>
                <span className="bg-yellow-400 text-mandi-navy px-2 py-0.5 rounded font-black text-[10px]">
                  Daily Mandi Index
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-8">

        {/* ---------------- SECTION 2: CATEGORY CARDS ---------------- */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-mandi-navy">Browse by Produce Category</h2>
            <Link to="/products" className="text-xs font-semibold text-mandi-blue hover:underline flex items-center">
              View All <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { title: 'Fresh Vegetables', cat: 'Vegetables', img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80' },
              { title: 'Farm Fruits', cat: 'Fruits', img: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=400&q=80' },
              { title: 'Grains & Pulses', cat: 'Grains', img: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=400&q=80' },
              { title: 'Pure Spices', cat: 'Spices', img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80' },
              { title: 'Organic Produce', cat: 'Organic Produce', img: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=400&q=80' },
              { title: 'Wholesale Deals', cat: 'Bulk Deals', img: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=400&q=80' }
            ].map((c, i) => (
              <Link
                key={i}
                to={`/products?category=${encodeURIComponent(c.cat)}`}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden group hover:border-mandi-blue hover:shadow-card transition-all"
              >
                <div className="h-28 overflow-hidden relative">
                  <img
                    src={c.img}
                    alt={c.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <span className="absolute bottom-2 left-2 right-2 text-white font-bold text-xs truncate">
                    {c.title}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ---------------- SECTION 3: TODAY'S BEST DEALS CAROUSEL ---------------- */}
        <section className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-mandi-green flex items-center justify-center">
                <TrendingDown className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-mandi-navy">Today's Best Wholesale Deals</h2>
                <p className="text-xs text-mandi-muted">Genuine verified discounts direct from local farmer harvest</p>
              </div>
            </div>

            <Link
              to="/products?hasBulkTiers=true"
              className="text-xs font-bold text-white bg-mandi-blue hover:bg-mandi-blue-dark px-3 py-1.5 rounded transition-colors"
            >
              View All Deals
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {deals.slice(0, 5).map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>

        {/* ---------------- SECTION 4: SHOP BY CATEGORY (ROWS) ---------------- */}
        {/* Fresh Vegetables Row */}
        <section className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <div>
              <h2 className="text-base font-bold text-mandi-navy">Fresh Vegetables</h2>
              <p className="text-xs text-mandi-muted">Harvested within 24 hours from regional APMC mandi farms</p>
            </div>
            <Link to="/products?category=Vegetables" className="text-xs font-semibold text-mandi-blue hover:underline">
              View All Vegetables →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {vegetables.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>

        {/* Grains & Pulses Row */}
        <section className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <div>
              <h2 className="text-base font-bold text-mandi-navy">Grains, Millets & Pulses</h2>
              <p className="text-xs text-mandi-muted">High-grade Sharbati wheat, aged basmati rice, and unpolished dals</p>
            </div>
            <Link to="/products?category=Grains" className="text-xs font-semibold text-mandi-blue hover:underline">
              View All Grains →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {grains.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>

        {/* Organic Produce Row */}
        <section className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <div>
                <h2 className="text-base font-bold text-mandi-navy">Certified Organic Produce</h2>
                <p className="text-xs text-mandi-muted">Pesticide-free chemical-free verified organic staples</p>
              </div>
            </div>
            <Link to="/products?isOrganic=true" className="text-xs font-semibold text-mandi-blue hover:underline">
              View All Organic →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {organic.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>

        {/* ---------------- SECTION 5: NEARBY FARMERS ---------------- */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-mandi-blue flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-mandi-navy">Verified Regional Farmers & Growers</h2>
                <p className="text-xs text-mandi-muted">Buy directly from farmer gate in Nashik, Pune & Maharashtra APMC mandis</p>
              </div>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold">
              {nearbyFarmers.length} Verified Farmers
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {nearbyFarmers.map((f) => (
              <div
                key={f._id}
                className="border border-gray-200 rounded-xl p-4 hover:border-mandi-blue hover:shadow-card transition-all flex flex-col justify-between bg-gray-50/40"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-11 h-11 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-sm shadow-sm shrink-0">
                      {f.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <h4 className="font-bold text-xs text-mandi-navy truncate">{f.businessName || f.name}</h4>
                      <p className="text-[11px] text-gray-500 truncate">{f.locality || 'Regional APMC'}</p>
                    </div>
                  </div>

                  <div className="space-y-1 text-[11px] text-gray-600 mb-3 bg-white p-2 rounded-lg border border-gray-100">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rating:</span>
                      <strong className="text-emerald-700 font-bold">★ {f.sellerProfile?.averageRating || 4.8} / 5.0</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Available Listings:</span>
                      <strong className="text-gray-800">{f.produceCount || 6} crops</strong>
                    </div>
                    {f.sellerProfile?.farmSizeAcres > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Farm Holding:</span>
                        <span className="text-gray-700">{f.sellerProfile.farmSizeAcres} Acres</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/products?search=${encodeURIComponent(f.businessName || f.name)}`)}
                  className="w-full text-center py-1.5 px-3 rounded-lg border border-mandi-blue text-mandi-blue hover:bg-mandi-blue hover:text-white font-semibold text-xs transition-colors"
                >
                  View Farmer Store
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- SECTION 6: WHOLESALE & BULK DEALS ---------------- */}
        <section className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-md">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-3">
              <span className="text-xs bg-yellow-400 text-mandi-navy font-black px-2.5 py-1 rounded uppercase tracking-wider">
                Retailers & Restaurant Procurement
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Bulk Agricultural Pricing Tiers with Guaranteed Quality
              </h2>
              <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
                Order full crates, quintals, and metric tons with volume tier discounts calculated transparently by our backend engine. No phone call haggling or hidden transport fees.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-white/10 rounded-xl p-3 border border-white/15">
                  <div className="text-yellow-300 font-bold text-sm">Tier 1: 50+ kg</div>
                  <div className="text-[11px] text-gray-300">10% - 15% Savings off retail</div>
                </div>
                <div className="bg-white/10 rounded-xl p-3 border border-white/15">
                  <div className="text-yellow-300 font-bold text-sm">Tier 2: 200+ kg</div>
                  <div className="text-[11px] text-gray-300">20% - 25% Volume discount</div>
                </div>
                <div className="bg-white/10 rounded-xl p-3 border border-white/15">
                  <div className="text-yellow-300 font-bold text-sm">Tier 3: 500+ kg / Tonne</div>
                  <div className="text-[11px] text-gray-300">Direct mandi truckload dispatch</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-3">
              <Link
                to="/products?hasBulkTiers=true"
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-mandi-navy font-bold py-3 px-4 rounded-xl text-center text-sm transition-all shadow-md"
              >
                Explore Wholesale Produce
              </Link>
              <button
                onClick={() => setIsAiDrawerOpen(true)}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-xl text-center text-sm border border-white/20 transition-all flex items-center justify-center gap-2"
              >
                <Bot className="w-4 h-4 text-yellow-300" />
                <span>AI Bulk Quote Engine</span>
              </button>
            </div>
          </div>
        </section>

        {/* ---------------- SECTION 7: WHY CHOOSE MANDI+ ---------------- */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-xl font-bold text-mandi-navy">Why Businesses Choose Mandi+</h2>
            <p className="text-xs text-mandi-muted mt-1">Transforming agricultural procurement from chaotic middlemen to transparent technology</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-mandi-blue flex items-center justify-center mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-mandi-navy mb-1">Direct Farmer Connections</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Connect directly with certified farmers across Maharashtra, Karnataka and Madhya Pradesh. Better margins for farmers, lower costs for buyers.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-mandi-green flex items-center justify-center mb-3">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-mandi-navy mb-1">Transparent Real-Time Mandi Pricing</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Prices calculated against live APMC market data and verified quality grades. No fabricated discounts or sudden surprise surcharges.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mb-3">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-mandi-navy mb-1">Tracked Express Logistics</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Dedicated agricultural delivery partners ensuring farm-gate pickup, proper crates handling, and next-morning store delivery.
              </p>
            </div>
          </div>
        </section>

        {/* ---------------- SECTION 8: BECOME A SELLER CTA ---------------- */}
        <section className="bg-emerald-800 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-xs bg-emerald-600 text-white font-bold px-3 py-1 rounded-full uppercase">
                Farmer & Supplier Portal
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Are you a Farmer, FPO, or Agricultural Supplier?
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100 max-w-xl">
                List your produce, reach thousands of restaurants, grocery stores, and retailers, and get paid directly to your bank account with zero middleman commissions.
              </p>
            </div>

            <Link
              to="/register?role=seller"
              className="bg-white hover:bg-yellow-300 text-mandi-navy font-black px-8 py-3.5 rounded-xl text-sm transition-all shadow-lg hover:shadow-xl shrink-0 whitespace-nowrap"
            >
              Start Selling on Mandi+
            </Link>
          </div>
        </section>

      </div>

      {/* Floating AI Assistant Trigger Button */}
      <button
        onClick={() => setIsAiDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-mandi-blue hover:bg-mandi-blue-dark text-white p-3.5 rounded-full shadow-2xl flex items-center gap-2 font-bold text-xs transition-all transform hover:scale-105 border-2 border-yellow-300"
        title="Open AI Procurement Assistant"
      >
        <Bot className="w-5 h-5 text-yellow-300 animate-pulse" />
        <span className="hidden sm:inline">Ask AI Procurement</span>
      </button>

      {/* AI Assistant Drawer */}
      <AIAssistantDrawer isOpen={isAiDrawerOpen} onClose={() => setIsAiDrawerOpen(false)} />
    </div>
  );
};
