const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { today, addDays, thisMonth } = require('../utils/dates');
const { nextId } = require('../utils/ids');
const { auth, requireRole } = require('../middleware/auth');
const { clinicOnly } = require('../middleware/network');

const router = express.Router();
router.use(auth, clinicOnly, requireRole('owner'));

router.get('/', async (req, res, next) => {
  try {
    const todayS = today();
    const weekEnd = addDays(todayS, 6);

    const members = await User.find({}, 'id name role active phone joined rating completed onTime').sort({ role: 1, name: 1 }).lean();

    const result = await Promise.all(
      members.map(async (m) => {
        const isTech = m.role === 'technician';
        let load = 0;
        let completedMonth = 0;
        if (isTech) {
          load = await Appointment.countDocuments({ techId: m.id, date: { $gte: todayS, $lte: weekEnd }, status: { $ne: 'cancelled' } });
          completedMonth = await Appointment.countDocuments({ techId: m.id, status: 'completed', date: { $regex: '^' + thisMonth() } });
        }
        return Object.assign({}, m, isTech ? { load, completedMonth } : { load: null, completedMonth: null });
      })
    );

    res.json({ team: result });
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const body = req.body || {};
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const role = String(body.role || '').trim();
    const phone = String(body.phone || '').trim();

    if (!name) return res.status(400).json({ error: 'Name is required' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'A valid email is required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    if (role !== 'staff' && role !== 'technician') return res.status(400).json({ error: 'Role must be staff or technician' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'A team member with this email already exists' });

    const prefix = role === 'technician' ? 'T-' : 'S-';
    const seq = await nextId(User, prefix);
    const id = prefix + String(seq.slice(prefix.length)).padStart(2, '0');
    const member = await User.create({
      id,
      name,
      email,
      passwordHash: bcrypt.hashSync(password, 10),
      role,
      phone,
      joined: thisMonth()
    });

    res.status(201).json({ member: member.toSafe() });
  } catch (e) {
    if (e && e.code === 11000) return res.status(409).json({ error: 'A team member with this email already exists' });
    next(e);
  }
});

router.patch('/:id/access', async (req, res, next) => {
  try {
    const active = (req.body || {}).active;
    if (typeof active !== 'boolean') return res.status(400).json({ error: 'active must be true or false' });

    const member = await User.findOne({ id: req.params.id });
    if (!member) return res.status(404).json({ error: 'Team member not found' });
    if (member.role === 'owner') return res.status(400).json({ error: 'Owner access cannot be revoked' });
    if (member.id === req.user.id) return res.status(400).json({ error: 'You cannot change your own access' });

    member.active = active;
    await member.save();
    res.json({ member: member.toSafe() });
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const member = await User.findOne({ id: req.params.id });
    if (!member) return res.status(404).json({ error: 'Team member not found' });
    if (member.role === 'owner') return res.status(400).json({ error: 'Owner account cannot be removed' });
    if (member.id === req.user.id) return res.status(400).json({ error: 'You cannot remove your own account' });

    await User.deleteOne({ id: member.id });
    res.json({ ok: true, id: member.id });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
