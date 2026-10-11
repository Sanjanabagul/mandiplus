import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  Heart,
  ShoppingCart,
  Zap,
  MapPin,
  Calendar,
  Layers,
  Star,
  Plus,
  Minus,
  Truck,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { productService } from '../services/productService.js';
import { reviewService } from '../services/reviewService.js';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { ProductCard } from '../components/ProductCard.jsx';

export const ProductDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review form state
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');

  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true);
      try {
        const res = await productService.getProductById(id);
        if (res.success && res.product) {
          setProduct(res.product);
          setSelectedImage(res.product.images?.[0] || '');
          setQuantity(res.product.minOrderQuantity || 1);

          // Load related products
          const relRes = await productService.getProducts({
            category: res.product.category,
            limit: 4
          });
          if (relRes.success) {
            setRelatedProducts(relRes.products.filter(p => p._id !== id));
          }

          // Load reviews
          const revRes = await reviewService.getProductReviews(id);
          if (revRes.success) {
            setReviews(revRes.reviews || []);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="w-10 h-10 border-4 border-mandi-blue border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-semibold">Loading produce details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-mandi-navy mb-2">Produce Not Found</h2>
        <p className="text-xs text-mandi-muted mb-6">The requested listing may have expired or been removed by the farmer.</p>
        <Link to="/products" className="bg-mandi-blue text-white text-xs font-bold px-6 py-2.5 rounded-lg">
          Browse All Produce
        </Link>
      </div>
    );
  }

  const isSaved = isWishlisted(product._id);
  const isAvailable = product.isAvailable && product.stockQuantity > 0;
  const moq = product.minOrderQuantity || 1;

  // Calculate tier price if quantity meets tier threshold
  let effectiveUnitPrice = product.pricePerUnit;
  let activeTierDiscount = 0;
  if (product.bulkPricingTiers && product.bulkPricingTiers.length > 0) {
    const matchedTier = [...product.bulkPricingTiers]
      .sort((a, b) => b.minQuantity - a.minQuantity)
      .find(t => quantity >= t.minQuantity);
    if (matchedTier) {
      effectiveUnitPrice = matchedTier.pricePerUnit;
      activeTierDiscount = matchedTier.discountPercent;
    }
  }

  const handleAddToCart = async () => {
    if (isAvailable) {
      await addToCart(product, quantity);
    }
  };

  const handleBuyNow = async () => {
    if (isAvailable) {
      await addToCart(product, quantity);
      navigate('/checkout');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please log in to submit a review.');
      return;
    }
    setReviewSubmitting(true);
    setReviewMessage('');

    try {
      const res = await reviewService.createReview({
        productId: product._id,
        rating: userRating,
        comment: userComment
      });

      if (res.success) {
        setReviews([res.review, ...reviews]);
        setUserComment('');
        setReviewMessage('Thank you! Your verified purchase review has been posted.');
      }
    } catch (err) {
      setReviewMessage(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-6">
        <Link to="/" className="hover:text-mandi-blue">Home</Link>
        <span>/</span>
        <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="hover:text-mandi-blue">
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-gray-800 font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Info Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">

        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-5 space-y-4">
          <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-50 border border-gray-100 relative group">
            <img
              src={selectedImage || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80'}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {product.isOrganic && (
              <span className="absolute top-3 left-3 bg-emerald-600 text-white font-bold text-[10px] uppercase px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Certified Organic
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                    selectedImage === img ? 'border-mandi-blue shadow-sm' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Farmer Card */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-700 text-white font-black flex items-center justify-center text-sm shadow-sm shrink-0">
                {product.sellerName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="text-[10px] text-gray-500 font-semibold uppercase block">Harvested By</span>
                <h4 className="font-bold text-sm text-mandi-navy">{product.sellerName}</h4>
                <div className="flex items-center gap-1 text-xs text-gray-600 mt-0.5">
                  <MapPin className="w-3 h-3 text-mandi-blue" />
                  <span>{product.pickupLocality}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                ★ {product.averageRating || 4.8}
              </span>
              <span className="text-[10px] text-gray-400 block mt-0.5">Verified Mandi Grower</span>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing, Specs & Actions */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-mandi-blue uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded">
                {product.category}
              </span>

              {/* Quality Grade with tooltip / explanation */}
              <span className={`text-xs font-black px-2.5 py-0.5 rounded uppercase tracking-wider text-white shadow-xs ${
                product.qualityGrade === 'Grade A' ? 'bg-mandi-green' : 'bg-amber-500'
              }`}>
                {product.qualityGrade} Verified
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-mandi-navy mb-2">
              {product.name}
            </h1>

            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              {product.description || 'Farm-fresh harvest directly from verified growers, graded according to standard APMC parameters.'}
            </p>

            {/* Pricing Details */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6">
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-3xl font-black text-mandi-navy">
                  ₹{effectiveUnitPrice}
                  <span className="text-sm font-normal text-gray-500"> / {product.unit}</span>
                </span>

                {product.originalPrice && product.originalPrice > effectiveUnitPrice && (
                  <span className="text-sm text-gray-400 line-through">
                    ₹{product.originalPrice}
                  </span>
                )}

                {(product.discountPercent > 0 || activeTierDiscount > 0) && (
                  <span className="text-sm font-bold text-mandi-discount">
                    {activeTierDiscount > 0 ? `${activeTierDiscount}% Tier Discount` : `${product.discountPercent}% off`}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                <span>Minimum Order: <strong className="text-gray-800">{moq} {product.unit}</strong></span>
                <span>•</span>
                <span>Available Stock: <strong className="text-emerald-700">{product.stockQuantity.toLocaleString('en-IN')} {product.unit}</strong></span>
              </div>
            </div>

            {/* Wholesale Price Tiers Table */}
            {product.bulkPricingTiers && product.bulkPricingTiers.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xs font-bold text-mandi-navy uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                  Wholesale Volume Pricing Tiers
                </h4>

                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">Order Quantity</th>
                        <th className="p-2.5">Unit Price</th>
                        <th className="p-2.5">Discount</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {product.bulkPricingTiers.map((t, idx) => {
                        const isTierActive = quantity >= t.minQuantity;
                        return (
                          <tr key={idx} className={isTierActive ? 'bg-emerald-50/50 font-semibold text-emerald-900' : ''}>
                            <td className="p-2.5">{t.minQuantity}+ {product.unit}</td>
                            <td className="p-2.5">₹{t.pricePerUnit} / {product.unit}</td>
                            <td className="p-2.5 text-mandi-discount font-bold">{t.discountPercent}% OFF</td>
                            <td className="p-2.5">
                              {isTierActive ? (
                                <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded font-bold">
                                  Applied
                                </span>
                              ) : (
                                <span className="text-gray-400 text-[10px]">Available</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Quantity Selector Stepper */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-xs font-bold text-gray-700">Select Quantity ({product.unit}):</span>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
                <button
                  onClick={() => setQuantity(Math.max(moq, quantity - 5))}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min={moq}
                  max={product.stockQuantity}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(moq, parseInt(e.target.value || moq, 10)))}
                  className="w-16 text-center text-xs font-bold focus:outline-none"
                />
                <button
                  onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 5))}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-xs font-medium text-gray-500">
                Item Total: <strong className="text-mandi-navy text-sm font-bold">₹{(effectiveUnitPrice * quantity).toLocaleString('en-IN')}</strong>
              </div>
            </div>

            {/* Action Buttons: Add to Cart, Buy Now, Wishlist */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleAddToCart}
                disabled={!isAvailable}
                className="flex-1 bg-yellow-400 hover:bg-yellow-300 disabled:bg-gray-200 text-mandi-navy font-black py-3 px-6 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={!isAvailable}
                className="flex-1 bg-mandi-blue hover:bg-mandi-blue-dark disabled:bg-gray-200 text-white font-black py-3 px-6 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
              >
                <Zap className="w-4 h-4" />
                <span>Buy Now</span>
              </button>

              <button
                onClick={() => toggleWishlist(product)}
                className={`p-3 rounded-xl border transition-colors ${
                  isSaved
                    ? 'border-red-300 bg-red-50 text-red-500'
                    : 'border-gray-300 text-gray-400 hover:text-red-500 hover:bg-gray-50'
                }`}
                title={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
              >
                <Heart className={`w-5 h-5 ${isSaved ? 'fill-red-500' : ''}`} />
              </button>
            </div>
          </div>

          {/* Delivery & Assurance Strip */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-mandi-green" />
              <span>Dispatches within 24h via Mandi Express Fleet</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-mandi-blue" />
              <span>APMC Physical Verification Guaranteed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications & Agricultural Details */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-8">
        <h3 className="text-base font-bold text-mandi-navy mb-4 pb-2 border-b border-gray-100">
          Agricultural Specifications & Harvest Metadata
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-gray-50 p-3 rounded-xl">
            <span className="text-gray-400 block mb-0.5">Crop Type</span>
            <span className="font-bold text-gray-800">{product.cropType || product.name}</span>
          </div>

          <div className="bg-gray-50 p-3 rounded-xl">
            <span className="text-gray-400 block mb-0.5">Production Method</span>
            <span className="font-bold text-gray-800">{product.productionMethod || 'Open Field'}</span>
          </div>

          <div className="bg-gray-50 p-3 rounded-xl">
            <span className="text-gray-400 block mb-0.5">Harvest Date</span>
            <span className="font-bold text-gray-800">
              {product.harvestDate ? new Date(product.harvestDate).toLocaleDateString('en-IN') : 'Recent Harvest'}
            </span>
          </div>

          <div className="bg-gray-50 p-3 rounded-xl">
            <span className="text-gray-400 block mb-0.5">Quality Inspection</span>
            <span className="font-bold text-emerald-700">
              {product.qualityGradeDetails?.assessedBy || 'Mandi+ Verified'}
            </span>
          </div>
        </div>
      </div>

      {/* Reviews & Ratings Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-8">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
          <div>
            <h3 className="text-base font-bold text-mandi-navy">Customer Ratings & Verified Reviews</h3>
            <p className="text-xs text-mandi-muted">Feedback from retail stores, restaurants, and bulk buyers</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-mandi-navy">★ {product.averageRating || 4.8}</span>
            <span className="text-xs text-gray-400">({reviews.length} reviews)</span>
          </div>
        </div>

        {/* Write a Review Form */}
        <form onSubmit={handleReviewSubmit} className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
          <h4 className="text-xs font-bold text-gray-700 mb-2">Leave a Verified Purchase Review</h4>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs text-gray-500">Rating:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setUserRating(star)}
                  className={`text-base ${userRating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <textarea
            rows={2}
            value={userComment}
            onChange={(e) => setUserComment(e.target.value)}
            placeholder="Share your experience regarding produce firmness, freshness, transport packaging, and flavor..."
            className="w-full border border-gray-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-mandi-blue focus:outline-none mb-2"
            required
          />

          <div className="flex items-center justify-between">
            {reviewMessage && <span className="text-xs text-emerald-700 font-semibold">{reviewMessage}</span>}
            <button
              type="submit"
              disabled={reviewSubmitting || !userComment.trim()}
              className="ml-auto bg-mandi-blue hover:bg-mandi-blue-dark disabled:bg-gray-200 text-white font-bold py-1.5 px-4 rounded-lg text-xs transition-colors"
            >
              {reviewSubmitting ? 'Posting...' : 'Submit Review'}
            </button>
          </div>
        </form>

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No reviews yet for this listing. Be the first to review!</p>
          ) : (
            reviews.map((r, idx) => (
              <div key={idx} className="border-b border-gray-100 pb-3 last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-gray-800">{r.buyerName}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                      Verified Buyer
                    </span>
                  </div>
                  <span className="text-xs font-bold text-yellow-500">★ {r.rating}</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{r.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Related Products Carousel */}
      {relatedProducts.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-base font-bold text-mandi-navy mb-4">Related Produce in {product.category}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {relatedProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
};
