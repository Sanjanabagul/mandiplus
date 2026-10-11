import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';

export const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.product',
      select: 'name pricePerUnit originalPrice stockQuantity minOrderQuantity unit images seller sellerName bulkPricingTiers isAvailable pickupLocality'
    });

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Filter out products that might have been deleted from DB
    const validItems = [];
    let subtotal = 0;
    let savingsTotal = 0;

    for (const item of cart.items) {
      if (item.product && item.product.isAvailable) {
        let effectivePrice = item.product.pricePerUnit;

        // Check for bulk tier pricing discounts based on quantity
        if (item.product.bulkPricingTiers && item.product.bulkPricingTiers.length > 0) {
          const matchedTier = [...item.product.bulkPricingTiers]
            .sort((a, b) => b.minQuantity - a.minQuantity)
            .find(t => item.quantity >= t.minQuantity);
          if (matchedTier) {
            effectivePrice = matchedTier.pricePerUnit;
          }
        }

        const itemSubtotal = effectivePrice * item.quantity;
        subtotal += itemSubtotal;

        if (item.product.originalPrice && item.product.originalPrice > effectivePrice) {
          savingsTotal += (item.product.originalPrice - effectivePrice) * item.quantity;
        }

        validItems.push({
          product: item.product,
          quantity: item.quantity,
          unitPrice: effectivePrice,
          subtotal: itemSubtotal,
          isStockSufficient: item.quantity <= item.product.stockQuantity,
          availableStock: item.product.stockQuantity,
          minOrderQuantity: item.product.minOrderQuantity
        });
      }
    }

    const deliveryFee = subtotal > 1500 || subtotal === 0 ? 0 : 50;
    const finalTotal = subtotal + deliveryFee;

    return res.status(200).json({
      success: true,
      items: validItems,
      itemCount: validItems.reduce((acc, item) => acc + item.quantity, 0),
      subtotal,
      savingsTotal,
      deliveryFee,
      finalTotal
    });
  } catch (err) {
    next(err);
  }
};

export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product || !product.isAvailable) {
      return res.status(404).json({
        success: false,
        message: 'Product is unavailable or out of stock.'
      });
    }

    const qty = parseInt(quantity, 10);
    if (qty < product.minOrderQuantity) {
      return res.status(400).json({
        success: false,
        message: `Minimum order quantity for this produce is ${product.minOrderQuantity} ${product.unit}.`
      });
    }

    if (qty > product.stockQuantity) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity exceeds available stock (${product.stockQuantity} ${product.unit} available).`
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const existingIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (existingIndex > -1) {
      const newQty = cart.items[existingIndex].quantity + qty;
      if (newQty > product.stockQuantity) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more. Total in cart exceeds available stock (${product.stockQuantity} ${product.unit}).`
        });
      }
      cart.items[existingIndex].quantity = newQty;
    } else {
      cart.items.push({
        product: productId,
        quantity: qty
      });
    }

    await cart.save();
    return getCart(req, res, next);
  } catch (err) {
    next(err);
  }
};

export const updateCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const qty = parseInt(quantity, 10);

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart is empty.'
      });
    }

    const existingIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (existingIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not in cart.'
      });
    }

    if (qty <= 0) {
      cart.items.splice(existingIndex, 1);
    } else {
      if (qty < product.minOrderQuantity) {
        return res.status(400).json({
          success: false,
          message: `Minimum order quantity is ${product.minOrderQuantity} ${product.unit}.`
        });
      }
      if (qty > product.stockQuantity) {
        return res.status(400).json({
          success: false,
          message: `Requested quantity exceeds available stock (${product.stockQuantity} ${product.unit}).`
        });
      }
      cart.items[existingIndex].quantity = qty;
    }

    await cart.save();
    return getCart(req, res, next);
  } catch (err) {
    next(err);
  }
};

export const removeCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    let cart = await Cart.findOne({ user: req.user._id });

    if (cart) {
      cart.items = cart.items.filter(item => item.product.toString() !== productId);
      await cart.save();
    }

    return getCart(req, res, next);
  } catch (err) {
    next(err);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    return res.status(200).json({
      success: true,
      message: 'Cart cleared successfully.',
      items: [],
      itemCount: 0,
      subtotal: 0,
      finalTotal: 0
    });
  } catch (err) {
    next(err);
  }
};

export const mergeCart = async (req, res, next) => {
  try {
    const { guestItems = [] } = req.body;
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    for (const guestItem of guestItems) {
      const product = await Product.findById(guestItem.productId);
      if (product && product.isAvailable && product.stockQuantity > 0) {
        const existing = cart.items.find(i => i.product.toString() === guestItem.productId);
        const qtyToAdd = Math.min(guestItem.quantity, product.stockQuantity);
        if (existing) {
          existing.quantity = Math.min(existing.quantity + qtyToAdd, product.stockQuantity);
        } else {
          cart.items.push({
            product: guestItem.productId,
            quantity: Math.max(qtyToAdd, product.minOrderQuantity)
          });
        }
      }
    }

    await cart.save();
    return getCart(req, res, next);
  } catch (err) {
    next(err);
  }
};
