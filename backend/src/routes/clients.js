const express = require('express');
const Client = require('../models/Client');
const { nextId } = require('../utils/ids');
const { nextDue, statusOf, daysUntil } = require('../utils/dates');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

function decorate(c) {
  const obj = typeof c.toObject === 'function' ? c.toObject() : c;
  return Object.assign({}, obj, {
    nextDue: obj.lastService ? nextDue(obj) : null,
    daysUntil: obj.lastService ? daysUntil(nextDue(obj)) : null,
    status: obj.lastService ? statusOf(obj) : 'active'
  });
}

router.get('/', async (req, res, next) => {
  try {
    const { search, status, city, skip = 0, limit = 200 } = req.query;
    const q = {};
    if (search) {
      const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      q.$or = [{ name: rx }, { phone: rx }, { city: rx }, { id: rx }];
    }
    if (city) q.city = { $regex: new RegExp('^' + String(city).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') };

    let docs = await Client.find(q)
      .sort({ name: 1 })
      .skip(Number(skip) || 0)
      .limit(Number(limit) || 200)
      .lean();

    docs = docs.map(decorate);
    if (status) {
      const wanted = String(status).toLowerCase();
      docs = docs.filter((c) => (wanted === 'overdue' ? c.status === 'overdue' : wanted === 'active' ? c.status === 'active' : c.status === 'due today'));
    }

    res.json({ clients: docs, total: docs.length });
  } catch (e) {
    next(e);
  }
});

router.post('/', requireRole('owner', 'staff'), async (req, res, next) => {
  try {
    const body = req.body || {};
    const id = await nextId(Client, 'C-');
    const client = await Client.create(Object.assign({ id }, body));
    res.status(201).json({ client: decorate(client) });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const c = await Client.findOne({ id: req.params.id });
    if (!c) return res.status(404).json({ error: 'Client not found' });
    res.json({ client: decorate(c) });
  } catch (e) {
    next(e);
  }
});

router.put('/:id', requireRole('owner', 'staff'), async (req, res, next) => {
  try {
    const c = await Client.findOne({ id: req.params.id });
    if (!c) return res.status(404).json({ error: 'Client not found' });
    const allowed = ['name', 'phone', 'city', 'gender', 'patchType', 'base', 'vendor', 'attach', 'cycle', 'lastService', 'joined', 'packageId', 'notes'];
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) c[k] = req.body[k];
    });
    await c.save();
    res.json({ client: decorate(c) });
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', requireRole('owner'), async (req, res, next) => {
  try {
    const c = await Client.findOneAndDelete({ id: req.params.id });
    if (!c) return res.status(404).json({ error: 'Client not found' });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
