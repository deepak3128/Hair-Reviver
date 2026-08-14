const express = require('express');
const Appointment = require('../models/Appointment');
const Client = require('../models/Client');
const { nextId } = require('../utils/ids');
const { auth, requireRole } = require('../middleware/auth');
const { clinicOnly } = require('../middleware/network');

const router = express.Router();
router.use(auth, clinicOnly);

const STATUSES = ['scheduled', 'inprogress', 'completed', 'noshow', 'cancelled'];

async function decorate(doc, clientCache) {
  const obj = doc.toObject();
  let clientName = null;
  if (clientCache) {
    clientName = clientCache.get(obj.clientId) || null;
  } else {
    const c = await Client.findOne({ id: obj.clientId }, 'name').lean();
    clientName = c ? c.name : null;
  }
  return Object.assign({}, obj, { clientName });
}

router.get('/', async (req, res, next) => {
  try {
    const { date, from, to, techId, status, clientId, limit = 500 } = req.query;
    const q = {};
    if (date) q.date = date;
    if (from || to) {
      q.date = {};
      if (from) q.date.$gte = from;
      if (to) q.date.$lte = to;
    }
    if (techId) q.techId = techId;
    if (status) q.status = status;
    if (clientId) q.clientId = clientId;

    let docs = await Appointment.find(q)
      .sort({ date: 1, time: 1 })
      .limit(Number(limit) || 500)
      .lean();

    const ids = [...new Set(docs.map((d) => d.clientId))];
    const clients = await Client.find({ id: { $in: ids } }, 'id name').lean();
    const cache = new Map(clients.map((c) => [c.id, c.name]));

    docs = docs.map((d) => Object.assign({}, d, { clientName: cache.get(d.clientId) || null }));
    res.json({ appointments: docs, total: docs.length });
  } catch (e) {
    next(e);
  }
});

router.post('/', requireRole('owner', 'staff'), async (req, res, next) => {
  try {
    const body = req.body || {};
    if (!body.clientId || !body.date) return res.status(400).json({ error: 'clientId and date are required' });
    const id = await nextId(Appointment, 'A-');
    const appt = await Appointment.create(
      Object.assign({ id, status: 'scheduled', reminder: { channel: 'WhatsApp', daysBefore: 1 } }, body)
    );
    res.status(201).json({ appointment: await decorate(appt, null) });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const a = await Appointment.findOne({ id: req.params.id });
    if (!a) return res.status(404).json({ error: 'Appointment not found' });
    res.json({ appointment: await decorate(a, null) });
  } catch (e) {
    next(e);
  }
});

router.put('/:id', requireRole('owner', 'staff'), async (req, res, next) => {
  try {
    const a = await Appointment.findOne({ id: req.params.id });
    if (!a) return res.status(404).json({ error: 'Appointment not found' });
    const allowed = ['clientId', 'techId', 'date', 'time', 'service', 'dur', 'status', 'reminder'];
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) a[k] = req.body[k];
    });
    await a.save();
    res.json({ appointment: await decorate(a, null) });
  } catch (e) {
    next(e);
  }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (STATUSES.indexOf(status) < 0) return res.status(400).json({ error: 'Invalid status' });
    const a = await Appointment.findOne({ id: req.params.id });
    if (!a) return res.status(404).json({ error: 'Appointment not found' });
    if (req.user.role === 'technician' && a.techId !== req.user.id && req.user.id !== 'T-01') {
      return res.status(403).json({ error: 'Technicians can only update their own appointments' });
    }
    a.status = status;
    await a.save();
    res.json({ appointment: await decorate(a, null) });
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', requireRole('owner'), async (req, res, next) => {
  try {
    const a = await Appointment.findOneAndDelete({ id: req.params.id });
    if (!a) return res.status(404).json({ error: 'Appointment not found' });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
