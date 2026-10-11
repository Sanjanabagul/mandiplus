process.env.NODE_ENV = 'test';

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../server.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { runSeed } from '../src/seeds/seed.js';

describe('Mandi+ Backend API Suite', () => {
  let authToken = '';
  let sampleProductId = '';

  before(async () => {
    // Ensure database connection and seed data are ready before tests run
    await connectDB();
    await runSeed();
  });

  after(async () => {
    await disconnectDB();
  });

  it('GET /api/health should return online status', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'online');
    assert.strictEqual(res.body.platform, 'Mandi+ Agri-Commerce API');
  });

  it('GET /api/categories should return seeded categories', async () => {
    const res = await request(app).get('/api/categories');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.categories));
    assert.ok(res.body.categories.length > 0);
  });

  it('GET /api/products should return produce listings with calculated discounts', async () => {
    const res = await request(app).get('/api/products');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.products.length > 0);
    sampleProductId = res.body.products[0]._id;
    assert.ok(sampleProductId, 'Sample product id should exist');
  });

  it('GET /api/products/suggestions should return autocomplete items', async () => {
    const res = await request(app).get('/api/products/suggestions?q=on');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.suggestions));
  });

  it('POST /api/auth/login should authenticate seeded demo buyer', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'buyer@mandiplus.com',
      password: 'Password123!'
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.token, 'Should return a JWT token');
    assert.strictEqual(res.body.user.role, 'buyer');
    authToken = res.body.token;
  });

  it('GET /api/auth/me should return current authenticated profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.user.email, 'buyer@mandiplus.com');
  });

  it('POST /api/cart/items should add product to cart and calculate server total', async () => {
    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        productId: sampleProductId,
        quantity: 15
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.finalTotal > 0);
  });

  it('POST /api/ai/procurement/chat should process query and return real inventory recommendations', async () => {
    const res = await request(app)
      .post('/api/ai/procurement/chat')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        message: 'I need 25 kg tomatoes for my kitchen',
        language: 'en'
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.reply);
    assert.ok(Array.isArray(res.body.recommendations));
  });
});
