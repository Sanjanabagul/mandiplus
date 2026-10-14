import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const runDiagnostic = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('ERROR: MONGODB_URI is not set in server/.env');
    process.exit(1);
  }

  // Sanitize host for logging
  try {
    const urlObj = new URL(uri.replace('mongodb+srv://', 'http://').replace('mongodb://', 'http://'));
    console.log(`Connecting directly to host: ${urlObj.host}, database: ${urlObj.pathname.replace('/', '')}...`);
  } catch {
    console.log('Connecting to configured MONGODB_URI...');
  }

  try {
    // Explicitly connect to URI without any fallback
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log('STATUS: CONNECTED_SUCCESSFULLY');
    console.log(`Database Name: ${mongoose.connection.name}`);
    console.log(`Ready State: ${mongoose.connection.readyState}`);

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nCollections found:');
    collections.forEach(c => console.log(` - ${c.name}`));

    // Check Users collection
    const usersCol = mongoose.connection.db.collection('users');
    const userDocs = await usersCol.find({}).toArray();
    console.log(`\nTotal Users in database: ${userDocs.length}`);
    userDocs.forEach(u => {
      console.log(`ID: ${u._id} | Name: ${u.name} | Email: ${u.email} | Role: ${u.role} | ApprovalStatus: ${u.approvalStatus} | IsActive: ${u.isActive} | CreatedAt: ${u.createdAt}`);
    });

    // Check Products collection
    const productsCol = mongoose.connection.db.collection('products');
    const prodCount = await productsCol.countDocuments();
    console.log(`\nTotal Products in database: ${prodCount}`);

    // Check Categories collection
    const catsCol = mongoose.connection.db.collection('categories');
    const catCount = await catsCol.countDocuments();
    console.log(`Total Categories in database: ${catCount}`);

    // Check Orders collection
    const ordersCol = mongoose.connection.db.collection('orders');
    const orderCount = await ordersCol.countDocuments();
    console.log(`Total Orders in database: ${orderCount}`);

  } catch (err) {
    console.error('STATUS: CONNECTION_FAILED');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

runDiagnostic();
