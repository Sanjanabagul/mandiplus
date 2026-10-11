import { Product } from '../models/Product.js';
import { User } from '../models/User.js';

export const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      qualityGrade,
      isOrganic,
      locality,
      inStockOnly,
      hasBulkTiers,
      sortBy = 'newest',
      page = 1,
      limit = 12
    } = req.query;

    const query = {
      isAvailable: true,
      approvalStatus: 'approved'
    };

    // Text search or keyword match
    if (search && search.trim() !== '') {
      query.$text = { $search: search.trim() };
    }

    // Category filter
    if (category && category !== 'All Products' && category !== 'all') {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.pricePerUnit = {};
      if (minPrice) query.pricePerUnit.$gte = parseFloat(minPrice);
      if (maxPrice) query.pricePerUnit.$lte = parseFloat(maxPrice);
    }

    // Quality Grade filter
    if (qualityGrade) {
      const grades = Array.isArray(qualityGrade) ? qualityGrade : qualityGrade.split(',');
      query.qualityGrade = { $in: grades };
    }

    // Organic filter
    if (isOrganic === 'true') {
      query.isOrganic = true;
    }

    // Locality filter
    if (locality && locality.trim() !== '') {
      query.pickupLocality = { $regex: new RegExp(locality.trim(), 'i') };
    }

    // Stock availability
    if (inStockOnly === 'true') {
      query.stockQuantity = { $gt: 0 };
    }

    // Bulk tiers availability
    if (hasBulkTiers === 'true') {
      query['bulkPricingTiers.0'] = { $exists: true };
    }

    // Sorting
    let sortOptions = { createdAt: -1 };
    if (search && (!sortBy || sortBy === 'relevance')) {
      sortOptions = { score: { $meta: 'textScore' }, createdAt: -1 };
    } else if (sortBy === 'price_asc') {
      sortOptions = { pricePerUnit: 1 };
    } else if (sortBy === 'price_desc') {
      sortOptions = { pricePerUnit: -1 };
    } else if (sortBy === 'rating') {
      sortOptions = { averageRating: -1, totalReviews: -1 };
    } else if (sortBy === 'newest') {
      sortOptions = { createdAt: -1 };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    const [products, totalCount] = await Promise.all([
      Product.find(query, search ? { score: { $meta: 'textScore' } } : {})
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(query)
    ]);

    // Enhance products with calculated discount percent
    const formattedProducts = products.map(product => {
      let discountPercent = 0;
      if (product.originalPrice && product.originalPrice > product.pricePerUnit) {
        discountPercent = Math.round(((product.originalPrice - product.pricePerUnit) / product.originalPrice) * 100);
      }
      return {
        ...product,
        discountPercent
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedProducts.length,
      totalCount,
      currentPage: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
      products: formattedProducts
    });
  } catch (err) {
    next(err);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate('seller', 'name businessName phone locality sellerProfile avatar');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    let discountPercent = 0;
    if (product.originalPrice && product.originalPrice > product.pricePerUnit) {
      discountPercent = Math.round(((product.originalPrice - product.pricePerUnit) / product.originalPrice) * 100);
    }

    return res.status(200).json({
      success: true,
      product: {
        ...product.toObject(),
        discountPercent
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getFeaturedDeals = async (req, res, next) => {
  try {
    const products = await Product.find({
      isAvailable: true,
      approvalStatus: 'approved',
      $or: [
        { originalPrice: { $gt: 0 } },
        { 'bulkPricingTiers.0': { $exists: true } }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const formatted = products.map(p => {
      let discountPercent = 0;
      if (p.originalPrice && p.originalPrice > p.pricePerUnit) {
        discountPercent = Math.round(((p.originalPrice - p.pricePerUnit) / p.originalPrice) * 100);
      }
      return { ...p, discountPercent };
    });

    return res.status(200).json({
      success: true,
      deals: formatted
    });
  } catch (err) {
    next(err);
  }
};

export const getNearbyFarmers = async (req, res, next) => {
  try {
    const farmers = await User.find({ role: 'seller', status: 'active' })
      .select('name businessName locality avatar sellerProfile')
      .limit(8)
      .lean();

    // Attach active produce count for each farmer
    const enhancedFarmers = await Promise.all(
      farmers.map(async farmer => {
        const produceCount = await Product.countDocuments({
          seller: farmer._id,
          isAvailable: true,
          approvalStatus: 'approved'
        });
        return {
          ...farmer,
          produceCount
        };
      })
    );

    return res.status(200).json({
      success: true,
      farmers: enhancedFarmers
    });
  } catch (err) {
    next(err);
  }
};

export const getSearchSuggestions = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(200).json({ success: true, suggestions: [] });
    }

    const regex = new RegExp(q.trim(), 'i');

    const [products, matchingLocalities] = await Promise.all([
      Product.find({ name: regex, isAvailable: true, approvalStatus: 'approved' })
        .select('name category')
        .limit(6)
        .lean(),
      Product.distinct('pickupLocality', { pickupLocality: regex, isAvailable: true })
    ]);

    const suggestions = [
      ...products.map(p => ({ type: 'product', text: p.name, category: p.category, id: p._id })),
      ...matchingLocalities.slice(0, 3).map(loc => ({ type: 'location', text: loc }))
    ];

    return res.status(200).json({
      success: true,
      suggestions
    });
  } catch (err) {
    next(err);
  }
};
