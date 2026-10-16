const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createRequireAuth } = require('../lib/auth');
const { createArchiveRouter } = require('../archive/router');
const service = require('../archive/service');
const id = '507f1f77bcf86cd799439011';
const secret = 'isolated-test-secret-not-for-deployment';
const password = 'Test-Only9!';

async function harness(t, { department = 'Admin', tokenRole = 'admin', version = 0, tokenVersion = 0, missing = false } = {}) {
  const calls = [];
  const actor = missing ? null : { _id: id, auth_version: version, portal_access: { has_access: true, password: await bcrypt.hash(password, 4) }, employment_details: { department, status: 'ACTIVE' } };
  const Employee = { findById: () => ({ select() { return this; }, then(resolve, reject) { return Promise.resolve(actor).then(resolve, reject); } }) };
  const archiveService = { ...service,
    list: async name => { service.getCategory(name); calls.push('list'); return { records: [], total: 0 }; },
    mutate: async (name, record, action, user, reason) => { calls.push({ name, record, action, user, reason }); return { success: true }; },
  };
  const app = express(); app.use(express.json());
  app.use('/api/archive', createArchiveRouter({ Employee, archiveService, requireAuth: createRequireAuth(Employee, secret), requireAdmin: (req, res, next) => req.user.role === 'admin' ? next() : res.status(403).json({ error: 'Admin access required' }) }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const token = jwt.sign({ sub: id, role: tokenRole, auth_version: tokenVersion }, secret);
  const request = (path, options = {}) => fetch(`http://127.0.0.1:${server.address().port}/api/archive${path}`, { ...options, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers } });
  return { request, calls };
}
test('archive listing rejects unauthenticated callers', async t => {
  const { request, calls } = await harness(t);
  assert.equal((await request('/bookings', { headers: { Authorization: '' } })).status, 401);
  assert.equal(calls.length, 0);
});
test('staff cannot list, restore, purge, or use the generic archive route even with a stale admin claim', async t => {
  const { request, calls } = await harness(t, { department: 'Front Desk', tokenRole: 'admin' });
  for (const [path, method] of [['/categories', 'GET'], ['/bookings', 'GET'], [`/bookings/${id}/restore`, 'PATCH'], [`/bookings/${id}`, 'DELETE'], [`/bookings/${id}/archive`, 'POST']]) assert.equal((await request(path, { method })).status, 403);
  assert.equal(calls.length, 0);
});
test('archived accounts and revoked pre-restoration tokens are rejected', async t => {
  const missing = await harness(t, { missing: true });
  assert.equal((await missing.request('/categories')).status, 401);
  const restored = await harness(t, { version: 1, tokenVersion: 0 });
  assert.equal((await restored.request('/categories')).status, 401);
});
test('admins can list allowed categories and restore without a purge password', async t => {
  const { request, calls } = await harness(t);
  const response = await request('/categories');
  assert.equal(response.status, 200);
  assert.ok((await response.json()).some(item => item.key === 'bookings'));
  assert.equal((await request('/not_a_table')).status, 400);
  assert.equal((await request(`/bookings/${id}/restore`, { method: 'PATCH' })).status, 200);
  assert.equal(calls[0].action, 'restore');
});
test('permanent deletion requires exact confirmation, reason, and current password', async t => {
  const { request, calls } = await harness(t);
  const path = `/housekeeping_logs/${id}`;
  const send = body => request(path, { method: 'DELETE', body: JSON.stringify(body) });
  const body = { confirmation: `housekeeping_logs:${id}`, reason: 'Duplicate test record', password };
  assert.equal((await send({})).status, 400);
  assert.equal((await send({ ...body, confirmation: id })).status, 400);
  assert.equal((await send({ ...body, password: 'wrong' })).status, 403);
  assert.equal(calls.length, 0);
  assert.equal((await send(body)).status, 200);
  assert.equal(calls[0].action, 'purge');
  assert.equal(calls[0].reason, 'Duplicate test record');
  assert.ok(!JSON.stringify(calls).includes(password));
});
test('wrong purge-password attempts are rate limited', async t => {
  const { request, calls } = await harness(t);
  const options = { method: 'DELETE', body: JSON.stringify({ confirmation: `rooms:${id}`, reason: 'Test only', password: 'incorrect' }) };
  for (let index = 0; index < 5; index++) assert.equal((await request(`/rooms/${id}`, options)).status, 403);
  assert.equal((await request(`/rooms/${id}`, options)).status, 429);
  assert.equal(calls.length, 0);
});
