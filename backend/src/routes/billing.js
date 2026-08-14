const express = require('express');
const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const { nextId } = require('../utils/ids');
const { today } = require('../utils/dates');
const { auth, requireRole } = require('../middleware/auth');
const { clinicOnly } = require('../middleware/network');

const router = express.Router();
router.use(auth, clinicOnly);

async function decorate(inv) {
  const obj = inv.toObject();
  const c = await Client.findOne({ id: obj.clientId }, 'name').lean();
  return Object.assign({}, obj, { clientName: c ? c.name : null, due: obj.total - obj.paid });
}

function computeStatus(inv) {
  if (inv.paid >= inv.total && inv.total > 0) inv.status = 'paid';
  else if (inv.paid > 0) inv.status = 'partial';
  else inv.status = 'pending';
}

router.get('/', async (req, res, next) => {
  try {
    const { clientId, status, from, to, limit = 500 } = req.query;
    const q = {};
    if (clientId) q.clientId = clientId;
    if (status) q.status = status;
    if (from || to) {
      q.date = {};
      if (from) q.date.$gte = from;
      if (to) q.date.$lte = to;
    }
    let docs = await Invoice.find(q).sort({ date: -1 }).limit(Number(limit) || 500).lean();

    const ids = [...new Set(docs.map((d) => d.clientId))];
    const clients = await Client.find({ id: { $in: ids } }, 'id name').lean();
    const cache = new Map(clients.map((c) => [c.id, c.name]));

    docs = docs.map((d) => Object.assign({}, d, { clientName: cache.get(d.clientId) || null, due: d.total - d.paid }));
    res.json({ invoices: docs, total: docs.length });
  } catch (e) {
    next(e);
  }
});

router.post('/', requireRole('owner', 'staff'), async (req, res, next) => {
  try {
    const body = req.body || {};
    if (!body.clientId) return res.status(400).json({ error: 'clientId is required' });
    const items = Array.isArray(body.items) ? body.items.map((i) => ({ label: String(i.label || 'Service'), amount: Number(i.amount) || 0 })) : [];
    if (!items.length) return res.status(400).json({ error: 'At least one item is required' });

    const inv = await Invoice.create({
      id: await nextId(Invoice, 'INV-'),
      date: body.date || today(),
      clientId: body.clientId,
      apptId: body.apptId || null,
      items,
      total: items.reduce((s, i) => s + i.amount, 0),
      paid: 0,
      status: 'pending'
    });
    res.status(201).json({ invoice: await decorate(inv) });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const inv = await Invoice.findOne({ id: req.params.id });
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ invoice: await decorate(inv) });
  } catch (e) {
    next(e);
  }
});

router.put('/:id', requireRole('owner', 'staff'), async (req, res, next) => {
  try {
    const inv = await Invoice.findOne({ id: req.params.id });
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });
    const allowed = ['date', 'clientId', 'apptId', 'items'];
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) inv[k] = req.body[k];
    });
    if (req.body.items) {
      inv.items = req.body.items.map((i) => ({ label: String(i.label || 'Service'), amount: Number(i.amount) || 0 }));
      inv.total = inv.items.reduce((s, i) => s + i.amount, 0);
    }
    await inv.save();
    res.json({ invoice: await decorate(inv) });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/payments', requireRole('owner', 'staff'), async (req, res, next) => {
  try {
    const inv = await Invoice.findOne({ id: req.params.id });
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });

    const amount = Number((req.body || {}).amount);
    if (!amount || amount <= 0) return res.status(400).json({ error: 'A positive amount is required' });

    const method = (req.body.method || 'Cash').toString();
    inv.payments.push({ amount, method, date: today() });
    inv.paid = inv.payments.reduce((s, p) => s + p.amount, 0);
    if (inv.paid > inv.total) inv.paid = inv.total;
    computeStatus(inv);
    await inv.save();

    res.json({ invoice: await decorate(inv) });
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', requireRole('owner'), async (req, res, next) => {
  try {
    const inv = await Invoice.findOneAndDelete({ id: req.params.id });
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
