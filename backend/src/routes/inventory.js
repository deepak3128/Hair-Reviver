const express = require('express');
const InventoryItem = require('../models/InventoryItem');
const Purchase = require('../models/Purchase');
const { nextId } = require('../utils/ids');
const { today } = require('../utils/dates');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res, next) => {
  try {
    const items = await InventoryItem.find({}).sort({ type: 1, base: 1 }).lean();
    res.json({
      items: items.map((i) => Object.assign({}, i, { low: i.qty <= i.thr }))
    });
  } catch (e) {
    next(e);
  }
});

router.get('/purchases', async (req, res, next) => {
  try {
    const purchases = await Purchase.find({}).sort({ date: -1 }).lean();
    res.json({ purchases });
  } catch (e) {
    next(e);
  }
});

router.post('/', requireRole('owner'), async (req, res, next) => {
  try {
    const body = req.body || {};
    const id = await nextId(InventoryItem, 'SKU-');
    const item = await InventoryItem.create(Object.assign({ id }, body));
    res.status(201).json({ item: Object.assign({}, item.toObject(), { low: item.qty <= item.thr }) });
  } catch (e) {
    next(e);
  }
});

router.put('/:id', requireRole('owner'), async (req, res, next) => {
  try {
    const item = await InventoryItem.findOne({ id: req.params.id });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    const allowed = ['type', 'base', 'vendor', 'batch', 'qty', 'thr', 'cost', 'received'];
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) item[k] = req.body[k];
    });
    await item.save();
    res.json({ item: Object.assign({}, item.toObject(), { low: item.qty <= item.thr }) });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/restock', requireRole('owner', 'staff'), async (req, res, next) => {
  try {
    const { qty, vendor, cost } = req.body || {};
    const n = Number(qty);
    if (!n || n <= 0) return res.status(400).json({ error: 'A positive qty is required' });

    const item = await InventoryItem.findOne({ id: req.params.id });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    item.qty += n;
    if (req.body.received) item.received = req.body.received;
    await item.save();

    const purchase = await Purchase.create({
      id: await nextId(Purchase, 'PR-'),
      date: today(),
      vendor: vendor || item.vendor || '—',
      item: (item.type || '') + ' ' + (item.base || '') + ' ×' + n,
      qty: n,
      cost: cost ? Number(cost) : 0
    });

    res.json({ item: Object.assign({}, item.toObject(), { low: item.qty <= item.thr }), purchase });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/deduct', requireRole('owner', 'technician'), async (req, res, next) => {
  try {
    const { qty } = req.body || {};
    const n = Number(qty);
    if (!n || n <= 0) return res.status(400).json({ error: 'A positive qty is required' });

    const item = await InventoryItem.findOne({ id: req.params.id });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    item.qty = Math.max(0, item.qty - n);
    await item.save();

    res.json({ item: Object.assign({}, item.toObject(), { low: item.qty <= item.thr }) });
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', requireRole('owner'), async (req, res, next) => {
  try {
    const item = await InventoryItem.findOneAndDelete({ id: req.params.id });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
