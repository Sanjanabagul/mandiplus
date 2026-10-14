process.env.NODE_ENV = 'test';
process.env.USE_EMBEDDED_DB_IF_LOCAL_FAILS = 'true';

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../server.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Product } from '../src/models/Product.js';
import { Order } from '../src/models/Order.js';
import { seedAdmin } from '../src/seeds/seedAdmin.js';

describe('Admin Portal Audit & Database Truth Verification Suite', () => {
  let adminToken = '';
  let buyerToken = '';
  let testFarmerId = '';
  let testDeliveryId = '';

  const testBuyerEmail = 'audit.buyer@mandiplus.com';
  const testFarmerEmail = 'audit.farmer.patil@mandiplus.com';
  const testDeliveryEmail = 'audit.delivery.shinde@mandiplus.com';
  const testRejectFarmerEmail = 'audit.farmer.rejected@mandiplus.com';

  before(async () => {
    await connectDB();

    // Reset database to completely empty state
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});

    // Provision legitimate administrator only
    const admin = await seedAdmin();
    assert.strictEqual(admin.email, 'admin@mandiplus.com');

    // Authenticate admin
    const loginRes = await request(app).post('/api/auth/admin/login').send({
      email: 'admin@mandiplus.com',
      password: 'Password123!'
    });
    assert.strictEqual(loginRes.status, 200);
    adminToken = loginRes.body.token;
  });

  after(async () => {
    await disconnectDB();
  });

  it('1. An empty database produces an empty applications table and zero demo accounts', async () => {
    const res = await request(app)
      .get('/api/admin/applications')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.total, 0);
    assert.deepStrictEqual(res.body.applications, []);
  });

  it('2. Admin dashboard statistics reflect only genuine records with zero fake numbers', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.stats.totalUsers, 1, 'Only the single admin user exists in fresh db');
    assert.strictEqual(res.body.stats.pendingFarmerApplications, 0);
    assert.strictEqual(res.body.stats.pendingDeliveryApplications, 0);
    assert.strictEqual(res.body.stats.approvedFarmers, 0);
    assert.strictEqual(res.body.stats.approvedDeliveryPartners, 0);
    assert.strictEqual(res.body.stats.totalOrders, 0);
    assert.strictEqual(res.body.stats.totalGMV, 0);
  });

  it('3. Analytics endpoint returns empty revenue trend instead of fabricated mock statistics', async () => {
    const res = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.body.analytics.revenueTrend, [], 'Should not contain mock [45000, 62000, ...] numbers');
  });

  it('4. Genuine buyer registration creates one active database document', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Genuine Buyer',
        email: testBuyerEmail,
        password: 'Password123!',
        role: 'buyer'
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.user.role, 'buyer');
    buyerToken = res.body.token;

    const userDoc = await User.findOne({ email: testBuyerEmail });
    assert.ok(userDoc);
    assert.strictEqual(userDoc.approvalStatus, 'not_required');
    assert.strictEqual(userDoc.isActive, true);
  });

  it('5. Genuine farmer registration creates one database document with pending status', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Genuine Farmer',
        email: testFarmerEmail,
        password: 'Password123!',
        phone: '+91 98220 99887',
        role: 'farmer',
        businessName: 'Genuine Organic Estate',
        locality: 'Nashik'
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.approvalStatus, 'pending');
    testFarmerId = res.body.application.id;

    const userDoc = await User.findById(testFarmerId);
    assert.ok(userDoc);
    assert.strictEqual(userDoc.approvalStatus, 'pending');
    assert.strictEqual(userDoc.isActive, false);
    assert.strictEqual(userDoc.role, 'farmer');
  });

  it('6. Genuine delivery partner registration creates one database document with pending status', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Genuine Delivery Fleet',
        email: testDeliveryEmail,
        password: 'Password123!',
        phone: '+91 98765 11223',
        role: 'delivery',
        locality: 'Pune',
        vehicleType: 'Pickup Mini Truck',
        vehicleNumber: 'MH-12-AB-9999'
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.approvalStatus, 'pending');
    testDeliveryId = res.body.application.id;

    const userDoc = await User.findById(testDeliveryId);
    assert.ok(userDoc);
    assert.strictEqual(userDoc.approvalStatus, 'pending');
    assert.strictEqual(userDoc.isActive, false);
  });

  it('7. Newly registered farmer and delivery partner appear in admin applications list as pending', async () => {
    const res = await request(app)
      .get('/api/admin/applications?status=pending')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.total, 2);
    const emails = res.body.applications.map(a => a.email);
    assert.ok(emails.includes(testFarmerEmail));
    assert.ok(emails.includes(testDeliveryEmail));
  });

  it('8. Dashboard stats dynamically update to reflect the new real pending applications', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.stats.totalUsers, 4, '1 Admin + 1 Buyer + 1 Farmer + 1 Delivery');
    assert.strictEqual(res.body.stats.pendingFarmerApplications, 1);
    assert.strictEqual(res.body.stats.pendingDeliveryApplications, 1);
    assert.strictEqual(res.body.stats.approvedFarmers, 0);
    assert.strictEqual(res.body.stats.approvedDeliveryPartners, 0);
  });

  it('9. Duplicate normalized email is rejected across different roles (409 Conflict)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Imposter Account',
        email: `  ${testFarmerEmail.toUpperCase()}  `,
        password: 'Password123!',
        role: 'buyer'
      });

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.message.includes('already registered'));
  });

  it('10. Pending farmer and pending delivery partner cannot log in (403 Forbidden)', async () => {
    const farmerRes = await request(app).post('/api/auth/login').send({
      email: testFarmerEmail,
      password: 'Password123!'
    });
    assert.strictEqual(farmerRes.status, 403);
    assert.strictEqual(farmerRes.body.approvalStatus, 'pending');

    const deliveryRes = await request(app).post('/api/auth/login').send({
      email: testDeliveryEmail,
      password: 'Password123!'
    });
    assert.strictEqual(deliveryRes.status, 403);
    assert.strictEqual(deliveryRes.body.approvalStatus, 'pending');
  });

  it('11. Normal user (buyer) cannot access admin endpoints or approve applications (403 Forbidden)', async () => {
    const accessRes = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${buyerToken}`);
    assert.strictEqual(accessRes.status, 403);

    const approveRes = await request(app)
      .patch(`/api/admin/applications/${testFarmerId}/approve`)
      .set('Authorization', `Bearer ${buyerToken}`);
    assert.strictEqual(approveRes.status, 403);
  });

  it('12. Administrator approves pending farmer application', async () => {
    const res = await request(app)
      .patch(`/api/admin/applications/${testFarmerId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.application.approvalStatus, 'approved');
    assert.strictEqual(res.body.application.isActive, true);

    const updatedFarmer = await User.findById(testFarmerId);
    assert.strictEqual(updatedFarmer.approvalStatus, 'approved');
    assert.strictEqual(updatedFarmer.isActive, true);
  });

  it('13. Approved farmer can now log in successfully and receive auth session', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testFarmerEmail,
      password: 'Password123!'
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.token);
    assert.strictEqual(res.body.user.role, 'farmer');
    assert.strictEqual(res.body.user.approvalStatus, 'approved');
  });

  it('14. Administrator approves pending delivery partner application', async () => {
    const res = await request(app)
      .patch(`/api/admin/applications/${testDeliveryId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.application.approvalStatus, 'approved');

    const updatedDelivery = await User.findById(testDeliveryId);
    assert.strictEqual(updatedDelivery.approvalStatus, 'approved');
    assert.strictEqual(updatedDelivery.isActive, true);
  });

  it('15. Administrator rejects application with mandatory rejection reason', async () => {
    // Register candidate to reject
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Incomplete Farmer Application',
        email: testRejectFarmerEmail,
        password: 'Password123!',
        role: 'farmer'
      });
    const rejectId = regRes.body.application.id;

    // Fail without reason
    const failRes = await request(app)
      .patch(`/api/admin/applications/${rejectId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    assert.strictEqual(failRes.status, 400);

    // Succeed with reason
    const rejectRes = await request(app)
      .patch(`/api/admin/applications/${rejectId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ rejectionReason: 'Incomplete land record documents.' });
    assert.strictEqual(rejectRes.status, 200);

    // Rejected applicant cannot log in
    const loginRes = await request(app).post('/api/auth/login').send({
      email: testRejectFarmerEmail,
      password: 'Password123!'
    });
    assert.strictEqual(loginRes.status, 403);
    assert.strictEqual(loginRes.body.approvalStatus, 'rejected');
  });

  it('16. Search and filters in admin applications return accurate records', async () => {
    const searchRes = await request(app)
      .get('/api/admin/applications?search=Genuine+Farmer')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(searchRes.status, 200);
    assert.strictEqual(searchRes.body.total, 1);
    assert.strictEqual(searchRes.body.applications[0].email, testFarmerEmail);
  });

  it('17. Safe database diagnostic endpoint returns sanitized status without credentials', async () => {
    const res = await request(app)
      .get('/api/admin/db-status')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.diagnostics);
    assert.strictEqual(res.body.diagnostics.connected, true);
    assert.ok(res.body.diagnostics.databaseName.startsWith('mandiplus'));
    assert.ok(typeof res.body.diagnostics.clusterHost === 'string');
    assert.ok(!res.body.diagnostics.clusterHost.includes('@'), 'Must never expose password or user credentials');
    assert.strictEqual(res.body.diagnostics.counts.byApprovalStatus.approved, 2, '1 Farmer + 1 Delivery approved');
  });

  it('18. Orders CSV export generates sanitized RFC 4180 CSV without formula injection', async () => {
    const buyer = await User.findOne({ email: testBuyerEmail });
    const farmer = await User.findOne({ email: testFarmerEmail });

    const sampleProduct = await Product.create({
      name: 'Alphonso Mangoes',
      seller: farmer._id,
      sellerName: farmer.name,
      category: 'Fruits',
      pricePerUnit: 600,
      unit: 'dozen',
      pickupLocality: 'Ratnagiri APMC',
      stockQuantity: 100
    });

    // Create a real order
    await Order.create({
      orderNumber: 'MP-TEST-CSV-001',
      buyer: buyer._id,
      buyerName: '=DDE("calc";0)', // Injection attempt
      buyerEmail: testBuyerEmail,
      buyerPhone: '+91 99999 11111',
      items: [{
        product: sampleProduct._id,
        seller: farmer._id,
        sellerName: farmer.name,
        name: sampleProduct.name,
        unit: 'dozen',
        quantity: 5,
        unitPrice: 600,
        subtotal: 3000
      }],
      subtotal: 3000,
      deliveryCharge: 50,
      totalAmount: 3050,
      shippingAddress: {
        fullName: 'Test Buyer',
        phone: '+91 99999 11111',
        streetAddress: 'Main St 101',
        locality: 'Pune Market',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001'
      },
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      status: 'pending'
    });

    const res = await request(app)
      .get('/api/reports/export-orders')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.ok(res.headers['content-type'].includes('text/csv'));
    assert.ok(res.text.includes('MP-TEST-CSV-001'));
    // Verify formula injection prevention: should be prefixed with single quote
    assert.ok(res.text.includes("''=DDE(\"\"calc\"\";0)") || res.text.includes("'=DDE"));
  });
});
