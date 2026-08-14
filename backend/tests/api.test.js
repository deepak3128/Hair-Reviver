const { test, before, after } = require('node:test');
const assert = require('node:assert');
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

async function login(email, password) {
  const r = await fetch(base + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return r;
}

test('health endpoint', async () => {
  const r = await fetch(base + '/api/health');
  assert.equal(r.status, 200);
  const body = await r.json();
  assert.equal(body.ok, true);
});

test('login works and returns a token', async () => {
  const r = await login('neeraj@hairreviver.in', 'demo1234');
  assert.equal(r.status, 200);
  const body = await r.json();
  assert.ok(body.token);
  assert.equal(body.user.role, 'owner');
});

test('login rejects wrong password', async () => {
  const r = await login('neeraj@hairreviver.in', 'wrongpass');
  assert.equal(r.status, 401);
});

test('unauthenticated access is rejected', async () => {
  const r = await fetch(base + '/api/clients');
  assert.equal(r.status, 401);
});

test('owner can list clients', async () => {
  const { token } = await (await login('neeraj@hairreviver.in', 'demo1234')).json();
  const r = await fetch(base + '/api/clients', { headers: { Authorization: 'Bearer ' + token } });
  assert.equal(r.status, 200);
  const body = await r.json();
  assert.ok(body.clients.length >= 12);
});

test('owner can create a client', async () => {
  const { token } = await (await login('neeraj@hairreviver.in', 'demo1234')).json();
  const r = await fetch(base + '/api/clients', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test Client', phone: '+91 90000 00000', city: 'Pune' })
  });
  assert.equal(r.status, 201);
  const body = await r.json();
  assert.match(body.client.id, /^C-\d+$/);
});

test('technician cannot create clients', async () => {
  const { token } = await (await login('meghna@hairreviver.in', 'demo1234')).json();
  const r = await fetch(base + '/api/clients', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Nope' })
  });
  assert.equal(r.status, 403);
});

test('invoices and reports respond', async () => {
  const { token } = await (await login('neeraj@hairreviver.in', 'demo1234')).json();
  const h = { Authorization: 'Bearer ' + token };

  const inv = await (await fetch(base + '/api/invoices', { headers: h })).json();
  assert.ok(inv.invoices.length >= 20);

  const rep = await (await fetch(base + '/api/reports/summary', { headers: h })).json();
  assert.ok(rep.kpis.clients > 0);
  assert.ok(rep.kpis.outstanding >= 0);

  const roles = await (await fetch(base + '/api/roles', { headers: h })).json();
  assert.deepEqual(roles.owner.sort(), ['appointments', 'billing', 'client', 'clients', 'dashboard', 'inventory', 'reports', 'staff'].sort());
});

test('reminders: unauthenticated is rejected', async () => {
  const r = await fetch(base + '/api/reminders');
  assert.equal(r.status, 401);
});

test('reminders: owner can list due reminders and mark one sent', async () => {
  const { token } = await (await login('neeraj@hairreviver.in', 'demo1234')).json();
  const h = { Authorization: 'Bearer ' + token };

  const list = await (await fetch(base + '/api/reminders', { headers: h })).json();
  assert.ok(Array.isArray(list.reminders));

  const target = list.reminders[0];
  if (target) {
    assert.ok(target.link && target.link.indexOf('https://wa.me/') === 0);
    assert.ok(target.text && target.clientName);

    const mark = await fetch(base + '/api/reminders/appointments/' + target.id + '/reminder-sent', { method: 'PATCH', headers: h });
    assert.equal(mark.status, 200);
    const body = await mark.json();
    assert.ok(body.appointment.reminderSentAt);

    const again = await (await fetch(base + '/api/reminders', { headers: h })).json();
    assert.ok(!again.reminders.some((r) => r.id === target.id));
  }
});
