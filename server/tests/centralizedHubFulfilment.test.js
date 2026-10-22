import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../server.js';
import { User } from '../src/models/User.js';
import { Product } from '../src/models/Product.js';
import { Hub } from '../src/models/Hub.js';
import { FarmerSupplyRequest } from '../src/models/FarmerSupplyRequest.js';
import { InventoryBatch } from '../src/models/InventoryBatch.js';
import { Order } from '../src/models/Order.js';
import { DeliveryAssignment } from '../src/models/DeliveryAssignment.js';
import { FarmerSettlement } from '../src/models/FarmerSettlement.js';
import { runSeed } from '../src/seeds/seed.js';

test('Mandi+ Hub Centralized Fulfilment & Multi-Farmer Consolidated Order Suite', async (t) => {
  let adminToken = '';
  let hubToken = '';
  let farmerAToken = '';
  let farmerBToken = '';
  let farmerCToken = '';
  let buyerToken = '';
  let deliveryToken = '';

  let defaultHub = null;
  let farmerA = null;
  let farmerB = null;
  let farmerC = null;
  let buyer = null;
  let deliveryPartner = null;

  let tomatoProduct = null;
  let onionProduct = null;
  let potatoProduct = null;

  await t.test('Setup & Seed Initial Database with Mandi+ Hub', async () => {
    await runSeed();
    defaultHub = await Hub.findOne({ code: 'HUB-PUN-01' });
    assert.ok(defaultHub, 'Default Mandi+ Hub must exist');
    assert.equal(defaultHub.name, 'Mandi+ Hub Central (Pune)');

    // Log in admin
    const adminRes = await request(app)
      .post('/api/auth/admin/login')
      .send({ email: 'admin@mandiplus.com', password: 'Password123!' });
    assert.equal(adminRes.status, 200);
    adminToken = adminRes.body.token;

    // Log in hub operator
    const hubRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'hub@mandiplus.com', password: 'Password123!' });
    assert.equal(hubRes.status, 200);
    hubToken = hubRes.body.token;

    // Log in Farmer A
    const fARes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'farmer@mandiplus.com', password: 'Password123!' });
    assert.equal(fARes.status, 200);
    farmerAToken = fARes.body.token;
    farmerA = fARes.body.user;

    // Log in Farmer B
    const fBRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ramesh@mandiplus.com', password: 'Password123!' });
    assert.equal(fBRes.status, 200);
    farmerBToken = fBRes.body.token;
    farmerB = fBRes.body.user;

    // Log in Farmer C
    const fCRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sunita@mandiplus.com', password: 'Password123!' });
    assert.equal(fCRes.status, 200);
    farmerCToken = fCRes.body.token;
    farmerC = fCRes.body.user;

    // Log in Buyer
    const buyerRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'buyer@mandiplus.com', password: 'Password123!' });
    assert.equal(buyerRes.status, 200);
    buyerToken = buyerRes.body.token;
    buyer = buyerRes.body.user;

    // Log in Delivery Partner
    const delivRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'delivery@mandiplus.com', password: 'Password123!' });
    assert.equal(delivRes.status, 200);
    deliveryToken = delivRes.body.token;
    deliveryPartner = delivRes.body.user;

    // Load products
    tomatoProduct = await Product.findOne({ name: 'Hybrid Salad Tomatoes (Farm Fresh)' });
    onionProduct = await Product.findOne({ name: 'Nashik Red Onions (Export Quality)' });
    potatoProduct = await Product.findOne({ name: 'Jyoti Table Potatoes (Cold Store Fresh)' });

    assert.ok(tomatoProduct, 'Tomatoes product must exist');
    assert.ok(onionProduct, 'Onions product must exist');
    assert.ok(potatoProduct, 'Potatoes product must exist');
    assert.equal(tomatoProduct.fulfilledBy, 'Mandi+ Hub');
  });

  await t.test('1. Hub Overview returns real database-backed operational metrics', async () => {
    const res = await request(app)
      .get('/api/hub/overview')
      .set('Authorization', `Bearer ${hubToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.metrics.totalSellableProducts > 0);
    assert.ok(res.body.metrics.totalSellableQuantity > 0);
    assert.equal(typeof res.body.metrics.ordersAwaitingPick, 'number');
    assert.equal(typeof res.body.metrics.ordersReadyForPickup, 'number');
  });

  let newSupplyRequestId = '';
  await t.test('2. Farmer submits a produce supply request to Mandi+ Hub', async () => {
    const res = await request(app)
      .post('/api/seller/supply-requests')
      .set('Authorization', `Bearer ${farmerAToken}`)
      .send({
        produceName: 'Desi Organic Cauliflower',
        category: 'Vegetables',
        unit: 'kg',
        proposedQuantity: 300,
        proposedPricePerUnit: 25,
        harvestDate: new Date(),
        qualityGradeProposed: 'Grade A',
        notes: 'Cold storage harvested cauliflower from Dindori farm.'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.supplyRequest.status, 'submitted');
    assert.equal(res.body.supplyRequest.proposedQuantity, 300);
    newSupplyRequestId = res.body.supplyRequest._id;
  });

  await t.test('3. Hub staff approves supply request for delivery to hub', async () => {
    const res = await request(app)
      .put(`/api/hub/supply-requests/${newSupplyRequestId}/review`)
      .set('Authorization', `Bearer ${hubToken}`)
      .send({
        action: 'approve',
        reviewNotes: 'Approved for arrival at Mandi+ Hub Bay 2 tomorrow morning.'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.supplyRequest.status, 'approved_for_delivery');
  });

  let createdBatchId = '';
  await t.test('4. Hub staff performs physical receiving, QC, and partial acceptance', async () => {
    // 300 received: 280 accepted Grade A, 20 rejected (damaged in transit)
    const res = await request(app)
      .post(`/api/hub/supply-requests/${newSupplyRequestId}/receive`)
      .set('Authorization', `Bearer ${hubToken}`)
      .send({
        receivedQuantity: 300,
        acceptedQuantity: 280,
        rejectedQuantity: 20,
        rejectionReason: 'Slight transit bruising on 20 kg crated produce.',
        gradeAssigned: 'Grade A',
        inspectionNotes: '280 kg pristine quality passed inspection.',
        agreedPurchasePricePerUnit: 25,
        sellingPricePerUnit: 34
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.supplyRequest.status, 'partially_accepted');
    assert.equal(res.body.supplyRequest.receiving.acceptedQuantity, 280);
    assert.equal(res.body.supplyRequest.receiving.rejectedQuantity, 20);

    // Verify inventory batch was created ONLY for accepted quantity
    assert.ok(res.body.batch);
    assert.equal(res.body.batch.remainingQuantity, 280);
    assert.equal(res.body.batch.isSellable, true);
    createdBatchId = res.body.batch._id;

    // Verify FarmerSettlement was created for accepted quantity: 280 * 25 = 7000
    const settlement = await FarmerSettlement.findOne({ supplyRequest: newSupplyRequestId });
    assert.ok(settlement);
    assert.equal(settlement.acceptedQuantity, 280);
    assert.equal(settlement.netPayable, 7000);
  });

  await t.test('5. Inventory batch and stock movements are auditable', async () => {
    const batchRes = await request(app)
      .get(`/api/hub/inventory/batches?search=Cauliflower`)
      .set('Authorization', `Bearer ${hubToken}`);

    assert.equal(batchRes.status, 200);
    assert.ok(batchRes.body.batches.length > 0);

    const movRes = await request(app)
      .get(`/api/hub/inventory/movements?batchId=${createdBatchId}`)
      .set('Authorization', `Bearer ${hubToken}`);

    assert.equal(movRes.status, 200);
    assert.ok(movRes.body.movements.length > 0);
    assert.equal(movRes.body.movements[0].movementType, 'receive_inbound');
  });

  // --- THE CORE CONSOLIDATED ORDER SCENARIO ---
  let consolidatedOrderId = '';
  await t.test('6. Consolidated Order: Buyer orders products from Farmer A, B, and C in ONE cart', async () => {
    // Cart items:
    // 2 kg Tomatoes (supplied originally by Farmer A)
    // 1 kg Onions (supplied originally by Farmer B)
    // 3 kg Potatoes (supplied originally by Farmer C)
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        shippingAddress: {
          fullName: 'Suresh Sharma',
          phone: '+91 98901 77889',
          streetAddress: 'Shop 4, Gandhi Chowk, Paud Road',
          locality: 'Kothrud',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411038'
        },
        paymentMethod: 'cod',
        items: [
          { productId: tomatoProduct._id.toString(), quantity: 2 },
          { productId: onionProduct._id.toString(), quantity: 1 },
          { productId: potatoProduct._id.toString(), quantity: 3 }
        ]
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);

    const order = res.body.order;
    consolidatedOrderId = order._id;

    // Verify invariants:
    // Invariant 1: Exactly ONE order was created
    assert.ok(order.orderNumber.startsWith('MP-'));
    assert.equal(order.items.length, 3, 'Order must contain all 3 items consolidated');

    // Invariant 2: Fulfilled by Mandi+ Hub
    assert.equal(order.fulfilledBy, 'Mandi+ Hub');
    assert.ok(order.hub);

    // Invariant 3: Source farmer & batch information preserved on order items
    const tomatoItem = order.items.find(i => i.product.toString() === tomatoProduct._id.toString());
    const onionItem = order.items.find(i => i.product.toString() === onionProduct._id.toString());
    const potatoItem = order.items.find(i => i.product.toString() === potatoProduct._id.toString());

    assert.ok(tomatoItem, 'Tomato item must exist in order');
    assert.ok(onionItem, 'Onion item must exist in order');
    assert.ok(potatoItem, 'Potato item must exist in order');

    assert.equal(tomatoItem.quantity, 2);
    assert.equal(onionItem.quantity, 1);
    assert.equal(potatoItem.quantity, 3);

    // Invariant 4: Delivery Assignment created with Mandi+ Hub pickup address, NOT individual farms
    const deliveryAssignment = await DeliveryAssignment.findOne({ order: order._id });
    assert.ok(deliveryAssignment);
    assert.equal(deliveryAssignment.pickupAddress.supplierName, 'Mandi+ Central Fulfilment Hub');
    assert.equal(deliveryAssignment.pickupAddress.city, 'Pune');
  });

  await t.test('7. Hub Picking: Hub staff views pick list and checks off picked items', async () => {
    // Get pick queue
    const queueRes = await request(app)
      .get('/api/hub/pick-queue')
      .set('Authorization', `Bearer ${hubToken}`);

    assert.equal(queueRes.status, 200);
    const inQueue = queueRes.body.orders.some(o => o._id.toString() === consolidatedOrderId.toString());
    assert.ok(inQueue, 'Consolidated order must appear in hub pick queue');

    // Start picking
    const startRes = await request(app)
      .post(`/api/hub/orders/${consolidatedOrderId}/pick/start`)
      .set('Authorization', `Bearer ${hubToken}`);

    assert.equal(startRes.status, 200);
    assert.equal(startRes.body.order.status, 'picking');

    // Complete picking
    const completePickRes = await request(app)
      .post(`/api/hub/orders/${consolidatedOrderId}/pick/complete`)
      .set('Authorization', `Bearer ${hubToken}`);

    assert.equal(completePickRes.status, 200);
    assert.equal(completePickRes.body.order.status, 'packing');
  });

  await t.test('8. Hub Packing: Order is packed into consolidated parcel and marked ready for pickup', async () => {
    const packRes = await request(app)
      .post(`/api/hub/orders/${consolidatedOrderId}/pack/complete`)
      .set('Authorization', `Bearer ${hubToken}`)
      .send({ packageCount: 1 });

    assert.equal(packRes.status, 200);
    assert.equal(packRes.body.order.status, 'ready_for_pickup');
    assert.ok(packRes.body.order.pickupOtp, '4-digit pickup OTP must be generated');
  });

  await t.test('9. Delivery Partner: Claims single pickup task from Mandi+ Hub', async () => {
    // Delivery partner views available tasks
    const availRes = await request(app)
      .get('/api/delivery/available')
      .set('Authorization', `Bearer ${deliveryToken}`);

    assert.equal(availRes.status, 200);

    // Claim delivery task
    const claimRes = await request(app)
      .post(`/api/delivery/claim/${consolidatedOrderId}`)
      .set('Authorization', `Bearer ${deliveryToken}`);

    assert.equal(claimRes.status, 200);
    assert.equal(claimRes.body.assignment.pickupAddress.supplierName, 'Mandi+ Central Fulfilment Hub');
  });

  await t.test('10. Dispatch Handover: Hub operator verifies pickup and dispatches order package', async () => {
    const orderBefore = await Order.findById(consolidatedOrderId);

    const handoverRes = await request(app)
      .post(`/api/hub/orders/${consolidatedOrderId}/handover`)
      .set('Authorization', `Bearer ${hubToken}`)
      .send({ pickupOtp: orderBefore.pickupOtp });

    assert.equal(handoverRes.status, 200);
    assert.equal(handoverRes.body.order.status, 'picked_up');
  });

  await t.test('11. Customer Delivery: Delivery partner marks order delivered with proof notes', async () => {
    const assignment = await DeliveryAssignment.findOne({ order: consolidatedOrderId });

    const delivRes = await request(app)
      .patch(`/api/delivery/assignments/${assignment._id}/status`)
      .set('Authorization', `Bearer ${deliveryToken}`)
      .send({
        status: 'delivered',
        proofOfDeliveryNotes: 'Delivered directly to Suresh Sharma at kitchen counter. Payment collected.'
      });

    assert.equal(delivRes.status, 200);

    const finalOrder = await Order.findById(consolidatedOrderId);
    assert.equal(finalOrder.status, 'delivered');
    assert.equal(finalOrder.paymentStatus, 'paid');
  });

  await t.test('12. Buyer Tracking: Vertical timeline shows all 9 status progression events', async () => {
    const trackRes = await request(app)
      .get(`/api/orders/${consolidatedOrderId}/tracking`)
      .set('Authorization', `Bearer ${buyerToken}`);

    assert.equal(trackRes.status, 200);
    assert.equal(trackRes.body.currentStatus, 'delivered');
    assert.equal(trackRes.body.fulfilledBy, 'Mandi+ Hub');
    assert.ok(trackRes.body.timeline.length >= 5);
  });
});
