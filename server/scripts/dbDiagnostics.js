import mongoose from 'mongoose';
import { connectDB, disconnectDB, getSanitizedMongoUri, getSafeDatabaseDiagnostics } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Product } from '../src/models/Product.js';
import { Order } from '../src/models/Order.js';

const runDiagnostics = async () => {
  console.log('\n=============================================================');
  console.log('🌾 MANDI+ DATABASE SECURE DIAGNOSTICS');
  console.log('=============================================================\n');

  try {
    await connectDB();
    const diag = await getSafeDatabaseDiagnostics();

    console.log('STATUS: CONNECTED');
    console.log(`Database Name:     ${diag.databaseName}`);
    console.log(`Cluster Host:      ${diag.clusterHost}`);
    console.log(`Connection State:  ${diag.connectionState}`);
    console.log(`Collections:       ${(diag.collections || []).join(', ') || 'none'}`);

    const [
      totalUsers,
      totalProducts,
      totalOrders,
      buyerCount,
      farmerCount,
      deliveryCount,
      adminCount,
      pendingCount,
      approvedCount,
      rejectedCount
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      User.countDocuments({ role: 'buyer' }),
      User.countDocuments({ role: { $in: ['seller', 'farmer'] } }),
      User.countDocuments({ role: 'delivery' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ approvalStatus: 'pending' }),
      User.countDocuments({ approvalStatus: 'approved' }),
      User.countDocuments({ approvalStatus: 'rejected' })
    ]);

    console.log('\n📊 DATABASE COUNTS:');
    console.log('-------------------------------------------------------------');
    console.log(` • Total Users:                 ${totalUsers}`);
    console.log(`    - Buyers:                   ${buyerCount}`);
    console.log(`    - Farmers / Growers:        ${farmerCount}`);
    console.log(`    - Delivery Fleet:           ${deliveryCount}`);
    console.log(`    - Administrators:           ${adminCount}`);
    console.log(` • Approval Statuses:`);
    console.log(`    - Approved:                 ${approvedCount}`);
    console.log(`    - Pending Review:           ${pendingCount}`);
    console.log(`    - Rejected:                 ${rejectedCount}`);
    console.log(` • Total Products:              ${totalProducts}`);
    console.log(` • Total Orders:                ${totalOrders}`);
    console.log('-------------------------------------------------------------\n');

    console.log('👥 REGISTERED USERS LIST (Sanitized):');
    const users = await User.find().select('name email role approvalStatus isActive status createdAt').lean();
    if (users.length === 0) {
      console.log(' No users found in database.');
    } else {
      users.forEach((u, i) => {
        console.log(` [${i + 1}] ${u.name} | ${u.email} | Role: ${u.role.toUpperCase()} | Approval: ${u.approvalStatus} | Active: ${u.isActive} | Status: ${u.status}`);
      });
    }
    console.log('\n=============================================================\n');
  } catch (err) {
    console.error('\nSTATUS: CONNECTION_FAILED');
    console.error('Target Host:', getSanitizedMongoUri());
    console.error('Error Message:', err.message);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
};

runDiagnostics();
