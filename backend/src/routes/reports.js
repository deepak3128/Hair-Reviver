const express = require('express');
const Client = require('../models/Client');
const Appointment = require('../models/Appointment');
const Invoice = require('../models/Invoice');
const InventoryItem = require('../models/InventoryItem');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { clinicOnly } = require('../middleware/network');
const { today, thisMonth, prevMonths, addDays, nextDue, statusOf } = require('../utils/dates');

const router = express.Router();
router.use(auth, clinicOnly);

router.get('/summary', async (req, res, next) => {
  try {
    const todayS = today();
    const month = thisMonth();
    const weekEnd = addDays(todayS, 6);

    const [clients, appts, invoices, inventory, users, techAppts] = await Promise.all([
      Client.find({}, 'id lastService cycle').lean(),
      Appointment.find({ date: { $regex: '^' + month } }, 'id').lean(),
      Invoice.find({}, 'total paid date').lean(),
      InventoryItem.find({}, 'qty thr').lean(),
      User.find({ role: 'technician' }, 'id').lean(),
      Appointment.find({ date: { $gte: todayS, $lte: weekEnd }, status: { $ne: 'cancelled' } }, 'techId date').lean()
    ]);

    const todayAppts = await Appointment.countDocuments({ date: todayS });
    const overdue = clients.filter((c) => c.lastService && statusOf(c) === 'overdue').length;
    const dueToday = clients.filter((c) => c.lastService && statusOf(c) === 'due today').length;

    const revMonth = invoices.filter((i) => i.date.slice(0, 7) === month).reduce((s, i) => s + i.paid, 0);
    const outstanding = invoices.reduce((s, i) => s + (i.total - i.paid), 0);
    const lowStock = inventory.filter((i) => i.qty <= i.thr).length;

    const loadMap = {};
    techAppts.forEach((a) => {
      loadMap[a.techId] = (loadMap[a.techId] || 0) + 1;
    });
    const techLoad = users.map((u) => ({ id: u.id, next7d: loadMap[u.id] || 0 }));

    res.json({
      kpis: {
        clients: clients.length,
        appointmentsToday: todayAppts,
        appointmentsMonth: appts.length,
        revenueMonth: revMonth,
        outstanding,
        overdue,
        dueToday,
        lowStock
      },
      techLoad
    });
  } catch (e) {
    next(e);
  }
});

router.get('/revenue', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const months = prevMonths(6).reverse();
    const q = {};
    if (from || to) {
      q.date = {};
      if (from) q.date.$gte = from;
      if (to) q.date.$lte = to;
    }
    const invoices = await Invoice.find(q, 'date paid total').lean();
    const series = months.map((m) => {
      const rows = invoices.filter((i) => i.date.slice(0, 7) === m);
      return { month: m, revenue: rows.reduce((s, i) => s + i.paid, 0), billed: rows.reduce((s, i) => s + i.total, 0) };
    });
    res.json({ months: series });
  } catch (e) {
    next(e);
  }
});

router.get('/services', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const q = {};
    if (from || to) {
      q.date = {};
      if (from) q.date.$gte = from;
      if (to) q.date.$lte = to;
    }
    const rows = await Appointment.find(q, 'service').lean();
    const counts = {};
    rows.forEach((a) => {
      counts[a.service] = (counts[a.service] || 0) + 1;
    });
    const services = Object.keys(counts)
      .map((service) => ({ service, count: counts[service] }))
      .sort((a, b) => b.count - a.count);
    res.json({ services });
  } catch (e) {
    next(e);
  }
});

router.get('/workload', async (req, res, next) => {
  try {
    const todayS = today();
    const weekEnd = addDays(todayS, 6);
    const techs = await User.find({ role: 'technician' }, 'id name rating completed onTime').lean();
    const rows = await Appointment.find(
      { techId: { $in: techs.map((t) => t.id) }, date: { $gte: todayS, $lte: weekEnd }, status: { $ne: 'cancelled' } },
      'techId'
    ).lean();
    const loadMap = {};
    rows.forEach((a) => {
      loadMap[a.techId] = (loadMap[a.techId] || 0) + 1;
    });
    const workload = techs.map((t) => Object.assign({}, t, { next7d: loadMap[t.id] || 0 }));
    res.json({ workload });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
