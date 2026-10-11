import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { config } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { Product } from '../src/models/Product.js';
import { Category } from '../src/models/Category.js';
import { Order } from '../src/models/Order.js';
import { Review } from '../src/models/Review.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uriFilePath = path.resolve(__dirname, '../.active-mongo-uri');

const viewDatabase = async () => {
  console.log('\n======================================================');
  console.log('🌾 MANDI+ DATABASE VIEWER');
  console.log('======================================================\n');

  let targetUri = config.mongodbUri;
  if (fs.existsSync(uriFilePath)) {
    const active = fs.readFileSync(uriFilePath, 'utf-8').trim();
    if (active) targetUri = active;
  }

  try {
    console.log(`Connecting to: ${targetUri}...`);
    await mongoose.connect(targetUri, { serverSelectionTimeoutMS: 3000 });
    console.log('✅ Connected to MongoDB!\n');

    // 1. Collection Counts
    const [userCount, prodCount, catCount, orderCount, revCount] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Category.countDocuments(),
      Order.countDocuments(),
      Review.countDocuments()
    ]);

    console.log('📊 COLLECTION STATISTICS:');
    console.log('------------------------------------------------------');
    console.log(` • Users:      ${userCount}`);
    console.log(` • Products:   ${prodCount}`);
    console.log(` • Categories: ${catCount}`);
    console.log(` • Orders:     ${orderCount}`);
    console.log(` • Reviews:    ${revCount}`);
    console.log('------------------------------------------------------\n');

    // 2. Users
    const users = await User.find().select('name email role phone createdAt').lean();
    console.log('👥 REGISTERED USERS:');
    users.forEach((u, i) => {
      console.log(` [${i + 1}] ${u.name} | Role: ${u.role.toUpperCase()} | Email: ${u.email} | Phone: ${u.phone}`);
    });
    console.log('');

    // 3. Products
    const products = await Product.find().select('name category pricePerUnit unit stockQuantity qualityGrade').limit(6).lean();
    console.log('🥦 SAMPLE PRODUCE LISTINGS (First 6):');
    products.forEach((p, i) => {
      console.log(` [${i + 1}] ${p.name} | Cat: ${p.category} | Price: ₹${p.pricePerUnit}/${p.unit} | Stock: ${p.stockQuantity} | Grade: ${p.qualityGrade}`);
    });
    console.log('');

    // 4. Orders
    const orders = await Order.find().select('orderNumber buyerName totalAmount status paymentMethod createdAt').limit(5).lean();
    console.log('📦 RECENT ORDERS:');
    if (orders.length === 0) {
      console.log(' No orders placed yet.');
    } else {
      orders.forEach((o, i) => {
        console.log(` [${i + 1}] Order #${o.orderNumber} | Buyer: ${o.buyerName} | Total: ₹${o.totalAmount} | Status: ${o.status.toUpperCase()} | Pay: ${o.paymentMethod}`);
      });
    }

    console.log('\n======================================================');
    console.log('💡 TIP: You can also explore data in the browser at http://localhost:5173/admin');
    console.log('   Login as: admin@mandiplus.com / Password123!');
    console.log('======================================================\n');

  } catch (err) {
    console.error('\n⚠️ Could not connect to external MongoDB service:', err.message);
    console.log('\nIf your server is using the automatic embedded in-memory MongoDB:');
    console.log('1. Check the server console logs for the active connection URI.');
    console.log('2. Or open http://localhost:5173/admin in your browser to view all database records live in the Admin Console!');
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

viewDatabase();
