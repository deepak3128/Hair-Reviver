// Clinic-network gate: staff/technician restricted to CLINIC_NETWORKS, owner unrestricted.
process.env.CLINIC_NETWORKS = '10.0.0.0/8';

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { isAllowed } = require('../src/middleware/network');
const { connect } = require('../src/config/env');
const { seed } = require('../src/seed/seed');
const app = require('../src/app');

let server;
let base;

before(async () => {
  await connect();
  await seed();
  server = app.listen(0);
  await new Promise((r) => server.on('listening', r));
  base = 'http://127.0.0.1:' + server.address().port;
});

after(() => server && server.close());

test('unit: isAllowed matches CIDRs', () => {
  assert.equal(isAllowed('10.1.2.3'), true, 'inside 10/8');
  assert.equal(isAllowed('10.0.0.1'), true, 'network start');
  assert.equal(isAllowed('11.0.0.1'), false, 'outside 10/8');
  assert.equal(isAllowed('127.0.0.1'), false, 'loopback not allowed here');
  assert.equal(isAllowed('192.168.1.5'), false, 'different private range');
  assert.equal(isAllowed('::ffff:10.0.0.9'), true, 'ipv4-mapped ipv6');
});

test('unit: default networks allow localhost over IPv6 loopback', () => {
  const saved = process.env.CLINIC_NETWORKS;
  delete process.env.CLINIC_NETWORKS;
  try {
    assert.equal(isAllowed('::1'), true, '::1 is localhost');
    assert.equal(isAllowed('::ffff:127.0.0.1'), true, 'ipv4-mapped loopback');
  } finally {
    process.env.CLINIC_NETWORKS = saved;
  }
});

test('owner can sign in from anywhere (no clinic IP)', async () => {
  const r = await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'neeraj@hairreviver.in', password: 'demo1234' })
  });
  assert.equal(r.status, 200);
  const body = await r.json();
  assert.equal(body.user.role, 'owner');
});

test('staff sign-in is blocked off the clinic network', async () => {
  const r = await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ritu@hairreviver.in', password: 'demo1234' })
  });
  assert.equal(r.status, 401);
  const body = await r.json();
  assert.match(body.error, /clinic network/i);
});

test('staff sign-in works from a clinic IP (X-Forwarded-For)', async () => {
  const r = await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.0.5' },
    body: JSON.stringify({ email: 'ritu@hairreviver.in', password: 'demo1234' })
  });
  assert.equal(r.status, 200);
  const body = await r.json();
  assert.equal(body.user.role, 'staff');
});

test('staff token is rejected when used off the clinic network', async () => {
  const { token } = await (
    await fetch(base + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.0.5' },
      body: JSON.stringify({ email: 'ritu@hairreviver.in', password: 'demo1234' })
    })
  ).json();

  const r = await fetch(base + '/api/clients', { headers: { Authorization: 'Bearer ' + token } });
  assert.equal(r.status, 403);
  const body = await r.json();
  assert.match(body.error, /clinic network/i);
});

test('same staff token works again from the clinic network', async () => {
  const { token } = await (
    await fetch(base + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '10.0.0.5' },
      body: JSON.stringify({ email: 'ritu@hairreviver.in', password: 'demo1234' })
    })
  ).json();

  const r = await fetch(base + '/api/clients', {
    headers: { Authorization: 'Bearer ' + token, 'X-Forwarded-For': '10.0.0.5' }
  });
  assert.equal(r.status, 200);
});
