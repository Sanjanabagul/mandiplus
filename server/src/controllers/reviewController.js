import mongoose from 'mongoose';
import { Review } from '../models/Review.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';

export const createReview = async (req, res, next) => {
  try {
    const { productId, orderId, rating, comment } = req.body;

    if (!productId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, rating, and review comment are required.'
      });
    }

    let isVerified = false;
    let resolvedOrderId = null;

    if (orderId && mongoose.isValidObjectId(orderId)) {
      const order = await Order.findById(orderId);
      if (order && order.buyer.toString() === req.user._id.toString()) {
        const hasPurchased = order.items.some(i => i.product.toString() === productId);
        if (hasPurchased) {
          isVerified = true;
          resolvedOrderId = order._id;
        }
      }
    }

    // If not verified yet, check if buyer has purchased this product previously
    if (!isVerified) {
      const pastOrder = await Order.findOne({
        buyer: req.user._id,
        'items.product': productId
      });
      if (pastOrder) {
        isVerified = true;
        resolvedOrderId = pastOrder._id;
      }
    }

    // Check if user already reviewed this product
    let review = await Review.findOne({
      product: productId,
      buyer: req.user._id
    });

    if (review) {
      // Update existing review
      review.rating = Number(rating);
      review.comment = comment;
      if (isVerified) review.isVerifiedPurchase = true;
      if (resolvedOrderId) review.order = resolvedOrderId;
      await review.save();
    } else {
      review = await Review.create({
        product: productId,
        order: resolvedOrderId || undefined,
        buyer: req.user._id,
        buyerName: req.user.name,
        rating: Number(rating),
        comment,
        isVerifiedPurchase: isVerified
      });
    }

    // Recalculate average rating for product
    const allReviews = await Review.find({ product: productId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await Product.findByIdAndUpdate(productId, {
      averageRating: parseFloat(avgRating.toFixed(1)),
      totalReviews: allReviews.length
    });

    return res.status(201).json({
      success: true,
      message: 'Review posted successfully.',
      review
    });
  } catch (err) {
    next(err);
  }
};

export const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ product: productId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    return res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (err) {
    next(err);
  }
};
