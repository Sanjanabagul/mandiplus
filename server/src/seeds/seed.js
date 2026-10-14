import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { Notification } from '../models/Notification.js';
import { DeliveryAssignment } from '../models/DeliveryAssignment.js';
import { categoriesSeed, usersSeed, productsSeed } from './seedData.js';

export const runSeed = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Database demo seeding is strictly prohibited in production mode to protect genuine records.');
  }

  try {
    console.log('[Seed] Starting Mandi+ database seeding...');
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    // 1. Seed Categories
    console.log('[Seed] Seeding product categories...');
    for (const cat of categoriesSeed) {
      await Category.findOneAndUpdate(
        { slug: cat.slug },
        cat,
        { upsert: true, new: true }
      );
    }
    console.log(`[Seed] Seeded ${categoriesSeed.length} categories.`);

    // 2. Seed Users
    console.log('[Seed] Seeding demo users with encrypted credentials...');
    const userMap = {};
    for (const userData of usersSeed) {
      let existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        try {
          existingUser = await User.create(userData);
        } catch (createErr) {
          if (createErr.code === 11000) {
            existingUser = await User.findOne({ email: userData.email });
          } else {
            throw createErr;
          }
        }
        Object.assign(existingUser, {
          name: userData.name,
          role: userData.role,
          phone: userData.phone,
          businessName: userData.businessName,
          locality: userData.locality,
          status: userData.status || 'active',
          approvalStatus: userData.approvalStatus || (userData.role === 'buyer' || userData.role === 'admin' ? 'not_required' : 'approved'),
          isActive: userData.isActive !== undefined ? userData.isActive : true,
          sellerProfile: userData.sellerProfile || existingUser.sellerProfile,
          deliveryProfile: userData.deliveryProfile || existingUser.deliveryProfile
        });
        await existingUser.save();
      }
      userMap[userData.email] = existingUser;
    }
    console.log(`[Seed] Seeded ${Object.keys(userMap).length} users.`);

    // 3. Seed Products
    console.log('[Seed] Seeding produce listings...');
    const farmer1 = userMap['farmer@mandiplus.com'];
    const farmer2 = userMap['ramesh@mandiplus.com'];

    for (let i = 0; i < productsSeed.length; i++) {
      const p = productsSeed[i];
      const assignedFarmer = (i % 2 === 0) ? farmer1 : farmer2;

      await Product.findOneAndUpdate(
        { name: p.name, seller: assignedFarmer._id },
        {
          ...p,
          seller: assignedFarmer._id,
          sellerName: assignedFarmer.businessName || assignedFarmer.name,
          pickupLocality: assignedFarmer.locality || p.pickupLocality,
          isAvailable: true,
          approvalStatus: 'approved'
        },
        { upsert: true, new: true }
      );
    }
    console.log(`[Seed] Seeded ${productsSeed.length} product listings.`);

    // 4. Seed a sample Order for Buyer
    const buyer = userMap['buyer@mandiplus.com'];
    const deliveryPartner = userMap['delivery@mandiplus.com'];
    const sampleProduct = await Product.findOne({ name: 'Nashik Red Onions (Export Quality)' });

    if (buyer && sampleProduct && deliveryPartner) {
      const existingOrder = await Order.findOne({ buyer: buyer._id });
      if (!existingOrder) {
        const orderNumber = 'MP-202610-10001';
        const order = await Order.create({
          orderNumber,
          buyer: buyer._id,
          buyerName: buyer.name,
          buyerEmail: buyer.email,
          buyerPhone: buyer.phone,
          items: [{
            product: sampleProduct._id,
            name: sampleProduct.name,
            image: sampleProduct.images[0],
            category: sampleProduct.category,
            unit: sampleProduct.unit,
            seller: sampleProduct.seller,
            sellerName: sampleProduct.sellerName,
            unitPrice: 28,
            quantity: 50,
            subtotal: 1400
          }],
          subtotal: 1400,
          deliveryCharge: 50,
          totalAmount: 1450,
          shippingAddress: buyer.addresses[0],
          paymentMethod: 'cod',
          paymentStatus: 'pending',
          status: 'ready_for_pickup',
          statusHistory: [
            { status: 'pending', note: 'Order placed by buyer', timestamp: new Date(Date.now() - 3600000 * 4) },
            { status: 'confirmed', note: 'Confirmed by farmer Rajesh Patil', timestamp: new Date(Date.now() - 3600000 * 3) },
            { status: 'ready_for_pickup', note: 'Packed in 50kg gunny bags, ready at farm gate', timestamp: new Date(Date.now() - 3600000 * 1) }
          ],
          deliveryPartner: deliveryPartner._id
        });

        await DeliveryAssignment.create({
          order: order._id,
          deliveryPartner: deliveryPartner._id,
          pickupAddress: {
            supplierName: 'Sahyadri Agro Farms',
            locality: 'Nashik APMC',
            phone: '+91 98220 11223',
            pincode: '422003'
          },
          deliveryAddress: {
            recipientName: buyer.name,
            phone: buyer.phone,
            locality: 'Kothrud, Pune',
            city: 'Pune',
            pincode: '411038',
            instructions: 'Kitchen entrance'
          },
          status: 'assigned'
        });

        await Notification.create({
          recipient: buyer._id,
          title: 'Order Ready for Dispatch',
          message: `Your Order #${orderNumber} has been packed by the farmer and is awaiting delivery pickup.`,
          type: 'order',
          link: `/orders/${order._id}`
        });

        console.log('[Seed] Created sample order & delivery workflow for demonstration.');
      }
    }

    console.log('[Seed] Database seeding completed successfully! ✅');
  } catch (err) {
    console.error('[Seed] Error during seeding:', err);
    throw err;
  }
};

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  runSeed()
    .then(() => disconnectDB())
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
