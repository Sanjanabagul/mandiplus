process.env.NODE_ENV = 'test';

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../server.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { seedAdmin } from '../src/seeds/seedAdmin.js';

describe('Mandi+ Role-Based Registration & Approval Workflow Suite', () => {
  let adminToken = '';
  let buyerToken = '';
  let farmerToken = '';
  let farmerId = '';
  let deliveryId = '';
  let rejectDeliveryId = '';

  const testBuyerEmail = 'buyer.test.auto@mandiplus.com';
  const testFarmerEmail = 'farmer.test.auto@mandiplus.com';
  const testDeliveryEmail = 'delivery.test.auto@mandiplus.com';
  const testRejectDeliveryEmail = 'delivery.reject.auto@mandiplus.com';
  const testAdminEmail = 'admin@mandiplus.com';

  before(async () => {
    await connectDB();
    await seedAdmin();

    // Clean up test users if they lingered
    await User.deleteMany({
      email: {
        $in: [
          testBuyerEmail,
          testFarmerEmail,
          testDeliveryEmail,
          testRejectDeliveryEmail,
          'race.test@mandiplus.com'
        ]
      }
    });
  });

  after(async () => {
    // Cleanup created test accounts
    await User.deleteMany({
      email: {
        $in: [
          testBuyerEmail,
          testFarmerEmail,
          testDeliveryEmail,
          testRejectDeliveryEmail,
          'race.test@mandiplus.com'
        ]
      }
    });
    await disconnectDB();
  });

  // -------------------------------------------------------------
  // 1. REGISTRATION TESTS & STATUS VERIFICATION
  // -------------------------------------------------------------
  it('1. Buyer registers and receives active status immediately with auth token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Anita Buyer',
        email: testBuyerEmail,
        password: 'Password123!',
        phone: '+91 98111 22233',
        role: 'buyer',
        businessName: 'Anita Groceries',
        locality: 'Pune Market'
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.token, 'Buyer should receive an immediate JWT');
    assert.strictEqual(res.body.user.role, 'buyer');

    // Verify DB record
    const userInDb = await User.findById(res.body.user.id);
    assert.strictEqual(userInDb.approvalStatus, 'not_required');
    assert.strictEqual(userInDb.isActive, true);
    buyerToken = res.body.token;
  });

  it('2. Farmer registers with pending status and NO auth session', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Balasaheb Shinde',
        email: testFarmerEmail,
        password: 'Password123!',
        phone: '+91 98222 33344',
        role: 'farmer',
        businessName: 'Shinde Agro Estate',
        locality: 'Nashik APMC',
        farmLocation: 'Dindori, Nashik',
        farmSizeAcres: 10
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    farmerId = res.body.application.id;
    assert.strictEqual(res.body.status, 'pending');
    assert.strictEqual(res.body.approvalStatus, 'pending');
    assert.strictEqual(res.body.token, undefined, 'Farmer must NOT receive an authenticated session while pending');
    assert.ok(res.body.application);
    assert.ok(res.body.message.includes('pending approval'));

    // Verify DB record
    const userInDb = await User.findById(farmerId);
    assert.strictEqual(userInDb.approvalStatus, 'pending');
    assert.strictEqual(userInDb.isActive, false);
  });

  it('3. Delivery partner registers with pending status and NO auth session', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Chetan Transport',
        email: testDeliveryEmail,
        password: 'Password123!',
        phone: '+91 98333 44455',
        role: 'delivery',
        locality: 'Pune City',
        vehicleType: 'Pickup Van',
        vehicleNumber: 'MH-12-TX-1234'
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.approvalStatus, 'pending');
    assert.strictEqual(res.body.token, undefined, 'Delivery fleet must NOT receive JWT session while pending');

    deliveryId = res.body.application.id;
    const userInDb = await User.findById(deliveryId);
    assert.strictEqual(userInDb.approvalStatus, 'pending');
    assert.strictEqual(userInDb.isActive, false);
  });

  it('4. Rejection test target delivery partner registers', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Devidas Fleet',
        email: testRejectDeliveryEmail,
        password: 'Password123!',
        phone: '+91 98444 55566',
        role: 'delivery',
        locality: 'Pimpri'
      });

    assert.strictEqual(res.status, 201);
    rejectDeliveryId = res.body.application.id;
  });

  // -------------------------------------------------------------
  // 2. GLOBAL EMAIL UNIQUENESS TESTS
  // -------------------------------------------------------------
  it('5. Farmer cannot register with an existing buyer email (409 Conflict)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Imposter Farmer',
        email: testBuyerEmail,
        password: 'Password123!',
        role: 'farmer'
      });

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.message.includes('Email already registered'));
  });

  it('6. Delivery cannot register with an existing buyer email (409 Conflict)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Imposter Delivery',
        email: testBuyerEmail,
        password: 'Password123!',
        role: 'delivery'
      });

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.success, false);
  });

  it('7. Buyer cannot register with a pending farmer email (409 Conflict)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Imposter Buyer',
        email: testFarmerEmail,
        password: 'Password123!',
        role: 'buyer'
      });

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.success, false);
  });

  it('8. Farmer cannot register with a pending delivery email (409 Conflict)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Duplicate Cross Role',
        email: testDeliveryEmail,
        password: 'Password123!',
        role: 'farmer'
      });

    assert.strictEqual(res.status, 409);
  });

  it('9. Email normalization handles whitespace and uppercase letters', async () => {
    const paddedUpperEmail = `   ${testFarmerEmail.toUpperCase()}  `;
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Case Test',
        email: paddedUpperEmail,
        password: 'Password123!',
        role: 'buyer'
      });

    assert.strictEqual(res.status, 409);
  });

  it('10. Public registration cannot create admin role (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Fake Admin',
        email: 'fakeadmin@mandiplus.com',
        password: 'Password123!',
        role: 'admin'
      });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
  });

  it('11. Simultaneous registrations with the same email prevent duplicate accounts', async () => {
    const raceEmail = 'race.test@mandiplus.com';
    const [res1, res2] = await Promise.all([
      request(app).post('/api/auth/register').send({
        name: 'User 1',
        email: raceEmail,
        password: 'Password123!',
        role: 'buyer'
      }),
      request(app).post('/api/auth/register').send({
        name: 'User 2',
        email: raceEmail,
        password: 'Password123!',
        role: 'farmer'
      })
    ]);

    const statuses = [res1.status, res2.status].sort();
    assert.deepStrictEqual(statuses, [201, 409], 'Exactly one request must succeed (201) and one fail (409)');
    const count = await User.countDocuments({ normalizedEmail: raceEmail });
    assert.strictEqual(count, 1, 'Only one user account should exist in MongoDB');
  });

  // -------------------------------------------------------------
  // 3. PENDING LOGIN GUARDS
  // -------------------------------------------------------------
  it('12. Pending farmer cannot log in (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testFarmerEmail,
        password: 'Password123!'
      });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.approvalStatus, 'pending');
    assert.ok(res.body.message.includes('awaiting admin approval'));
  });

  it('13. Pending delivery partner cannot log in (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testDeliveryEmail,
        password: 'Password123!'
      });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.approvalStatus, 'pending');
    assert.ok(res.body.message.includes('awaiting admin approval'));
  });

  // -------------------------------------------------------------
  // 4. ADMIN AUTHENTICATION & ACCESS CONTROL
  // -------------------------------------------------------------
  it('14. Buyer cannot access admin endpoints (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${buyerToken}`);

    assert.strictEqual(res.status, 403);
  });

  it('15. Non-admin cannot authenticate through admin login endpoint (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/auth/admin/login')
      .send({
        email: testBuyerEmail,
        password: 'Password123!'
      });

    assert.strictEqual(res.status, 403);
    assert.ok(res.body.message.includes('restricted to Mandi+ administrators'));
  });

  it('16. Administrator authenticates through /api/auth/admin/login', async () => {
    const res = await request(app)
      .post('/api/auth/admin/login')
      .send({
        email: testAdminEmail,
        password: 'Password123!'
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.token);
    assert.strictEqual(res.body.user.role, 'admin');
    adminToken = res.body.token;
  });

  it('17. Admin dashboard stats accurately reflect real pending and registered counts', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.stats.totalUsers > 0);
    assert.ok(res.body.stats.pendingFarmerApplications >= 1);
    assert.ok(res.body.stats.pendingDeliveryApplications >= 2);
  });

  it('18. Admin lists applications with search and filters', async () => {
    const res = await request(app)
      .get('/api/admin/applications?status=pending')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.applications));
    assert.ok(res.body.applications.length >= 2);
  });

  // -------------------------------------------------------------
  // 5. APPROVE & REJECT WORKFLOW
  // -------------------------------------------------------------
  it('19. Admin approves pending farmer application', async () => {
    const res = await request(app)
      .patch(`/api/admin/applications/${farmerId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.application.approvalStatus, 'approved');
    assert.strictEqual(res.body.application.isActive, true);

    // Verify DB record
    const updatedInDb = await User.findById(farmerId);
    assert.strictEqual(updatedInDb.approvalStatus, 'approved');
    assert.strictEqual(updatedInDb.isActive, true);
    assert.ok(updatedInDb.approvedAt);
    assert.ok(updatedInDb.approvedBy);

    // Verify AuditLog
    const auditRecord = await AuditLog.findOne({
      entityId: farmerId.toString(),
      action: 'APPLICATION_APPROVED'
    });
    assert.ok(auditRecord, 'AuditLog entry must be recorded');
  });

  it('20. Approved farmer can now log in successfully', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testFarmerEmail,
        password: 'Password123!'
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.token);
    assert.strictEqual(res.body.user.role, 'farmer');
    assert.strictEqual(res.body.user.approvalStatus, 'approved');
    farmerToken = res.body.token;
  });

  it('21. Approved farmer can access farmer-protected routes', async () => {
    const res = await request(app)
      .get('/api/seller/dashboard')
      .set('Authorization', `Bearer ${farmerToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
  });

  it('22. Cannot re-approve an already approved application (409 Conflict)', async () => {
    const res = await request(app)
      .patch(`/api/admin/applications/${farmerId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.success, false);
  });

  it('23. Cannot approve a buyer or admin account through application endpoint (400)', async () => {
    const buyerInDb = await User.findOne({ email: testBuyerEmail });
    const res = await request(app)
      .patch(`/api/admin/applications/${buyerInDb._id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 400);
  });

  it('24. Rejection requires a rejection reason (400 Bad Request)', async () => {
    const res = await request(app)
      .patch(`/api/admin/applications/${rejectDeliveryId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    assert.strictEqual(res.status, 400);
    assert.ok(res.body.message.includes('reason is required'));
  });

  it('25. Admin rejects delivery application with reason', async () => {
    const reason = 'Vehicle registration number MH-12-TX-1234 does not match commercial transport permit.';
    const res = await request(app)
      .patch(`/api/admin/applications/${rejectDeliveryId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ rejectionReason: reason });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.application.approvalStatus, 'rejected');
    assert.strictEqual(res.body.application.isActive, false);

    const userInDb = await User.findById(rejectDeliveryId);
    assert.strictEqual(userInDb.approvalStatus, 'rejected');
    assert.strictEqual(userInDb.isActive, false);
    assert.strictEqual(userInDb.rejectionReason, reason);

    // Verify AuditLog
    const auditRecord = await AuditLog.findOne({
      entityId: rejectDeliveryId.toString(),
      action: 'APPLICATION_REJECTED'
    });
    assert.ok(auditRecord);
    assert.strictEqual(auditRecord.details.rejectionReason, reason);
  });

  it('26. Rejected delivery partner cannot log in (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testRejectDeliveryEmail,
        password: 'Password123!'
      });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.approvalStatus, 'rejected');
    assert.ok(res.body.message.includes('has been rejected'));
  });

  it('27. Applicant can securely check status via /api/auth/application-status', async () => {
    const res = await request(app)
      .get(`/api/auth/application-status?email=${encodeURIComponent(testRejectDeliveryEmail)}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.application.approvalStatus, 'rejected');
    assert.ok(res.body.application.rejectionReason);
    assert.strictEqual(res.body.application.password, undefined);
  });

  it('28. Cannot approve an already rejected application (400 Bad Request)', async () => {
    const res = await request(app)
      .patch(`/api/admin/applications/${rejectDeliveryId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 400);
    assert.ok(res.body.message.includes('Rejected applications cannot be approved'));
  });
});
