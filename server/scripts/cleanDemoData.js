import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { connectDB, disconnectDB, getSanitizedMongoUri } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Order } from '../src/models/Order.js';
import { Product } from '../src/models/Product.js';
import { Review } from '../src/models/Review.js';
import { DeliveryAssignment } from '../src/models/DeliveryAssignment.js';
import { Notification } from '../src/models/Notification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicit confirmed demo identifiers defined strictly from seedData.js
const CONFIRMED_DEMO_EMAILS = [
  'farmer@mandiplus.com',
  'ramesh@mandiplus.com',
  'delivery@mandiplus.com',
  'buyer@mandiplus.com'
];

const CONFIRMED_DEMO_ORDER_NUMBERS = [
  'MP-202610-10001'
];

export const runDemoCleanup = async (isDryRun = false) => {
  console.log('\n=============================================================');
  console.log('🌾 MANDI+ TARGETED DEMO DATA CLEANUP & BACKUP UTILITY');
  console.log('=============================================================\n');

  try {
    await connectDB();
    const sanitizedHost = getSanitizedMongoUri();
    console.log(`Connected to: ${sanitizedHost}`);
    console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (Simulation only)' : '⚡ LIVE EXECUTION'}\n`);

    // 1. Locate confirmed demo users
    const matchedDemoUsers = await User.find({
      email: { $in: CONFIRMED_DEMO_EMAILS }
    }).select('-password').lean();

    console.log(`Identified ${matchedDemoUsers.length} confirmed seed demo user(s):`);
    matchedDemoUsers.forEach((u, i) => {
      console.log(` [${i + 1}] ID: ${u._id} | Name: ${u.name} | Role: ${u.role} | Email: ${u.email}`);
    });

    const demoUserIds = matchedDemoUsers.map(u => u._id);

    // 2. Locate confirmed demo orders
    const matchedDemoOrders = await Order.find({
      $or: [
        { orderNumber: { $in: CONFIRMED_DEMO_ORDER_NUMBERS } },
        { buyer: { $in: demoUserIds } }
      ]
    }).lean();
    console.log(`\nIdentified ${matchedDemoOrders.length} confirmed seed demo order(s):`);
    matchedDemoOrders.forEach((o, i) => {
      console.log(` [${i + 1}] ID: ${o._id} | OrderNumber: ${o.orderNumber} | Buyer: ${o.buyerName}`);
    });

    // 3. Locate confirmed demo products owned by demo farmers
    const matchedDemoProducts = await Product.find({
      seller: { $in: demoUserIds }
    }).lean();
    console.log(`\nIdentified ${matchedDemoProducts.length} confirmed seed demo product(s):`);
    matchedDemoProducts.forEach((p, i) => {
      console.log(` [${i + 1}] ID: ${p._id} | Name: ${p.name} | Seller: ${p.sellerName}`);
    });

    if (matchedDemoUsers.length === 0 && matchedDemoOrders.length === 0 && matchedDemoProducts.length === 0) {
      console.log('\n✅ No demo seed records exist in the active database. Everything is clean.');
      return { cleanedUsers: 0, cleanedOrders: 0, cleanedProducts: 0 };
    }

    // 4. Backup confirmed demo records before any deletion
    const backupDir = path.resolve(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupPayload = {
      timestamp: new Date().toISOString(),
      database: mongoose.connection.name,
      demoUsers: matchedDemoUsers,
      demoOrders: matchedDemoOrders,
      demoProducts: matchedDemoProducts
    };

    const backupFileName = `demo_backup_${Date.now()}.json`;
    const backupFilePath = path.join(backupDir, backupFileName);
    fs.writeFileSync(backupFilePath, JSON.stringify(backupPayload, null, 2), 'utf-8');
    console.log(`\n📁 Backup safely archived at: ${backupFilePath}`);

    if (isDryRun) {
      console.log('\n🔍 Dry run completed. No modifications were performed.');
      return { previewedUsers: matchedDemoUsers.length, previewedOrders: matchedDemoOrders.length, previewedProducts: matchedDemoProducts.length };
    }

    // 5. Targeted removal of confirmed demo records only
    const demoOrderIds = matchedDemoOrders.map(o => o._id);
    const demoProductIds = matchedDemoProducts.map(p => p._id);

    const userDeleteResult = await User.deleteMany({ _id: { $in: demoUserIds } });
    const orderDeleteResult = await Order.deleteMany({ _id: { $in: demoOrderIds } });
    const productDeleteResult = await Product.deleteMany({ _id: { $in: demoProductIds } });
    await Review.deleteMany({ product: { $in: demoProductIds } });
    await DeliveryAssignment.deleteMany({ order: { $in: demoOrderIds } });
    await Notification.deleteMany({ recipient: { $in: demoUserIds } });

    console.log(`\n✅ Successfully removed ${userDeleteResult.deletedCount} demo user(s).`);
    console.log(`✅ Successfully removed ${orderDeleteResult.deletedCount} demo order(s).`);
    console.log(`✅ Successfully removed ${productDeleteResult.deletedCount} demo product(s).`);

    // Verify remaining users (strictly preserving admin and any genuine users)
    const remainingUsers = await User.find().select('name email role approvalStatus').lean();
    console.log(`\n👥 Remaining genuine user accounts in database: ${remainingUsers.length}`);
    remainingUsers.forEach((u, i) => {
      console.log(` [${i + 1}] ${u.name} (${u.email}) - Role: ${u.role} - Status: ${u.approvalStatus}`);
    });

    return {
      cleanedUsers: userDeleteResult.deletedCount,
      cleanedOrders: orderDeleteResult.deletedCount,
      remainingUsersCount: remainingUsers.length
    };
  } catch (err) {
    console.error('Error during demo cleanup:', err.message);
    throw err;
  } finally {
    await disconnectDB();
  }
};

// Direct script execution support
if (process.argv[1] && process.argv[1].endsWith('cleanDemoData.js')) {
  const isDry = process.argv.includes('--dry-run');
  runDemoCleanup(isDry)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
