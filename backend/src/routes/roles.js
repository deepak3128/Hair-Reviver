const express = require('express');
const RolePerm = require('../models/RolePerm');
const { auth, requireRole } = require('../middleware/auth');
const { clinicOnly } = require('../middleware/network');

const router = express.Router();
router.use(auth, clinicOnly);

const DEFAULTS = {
  staff: ['dashboard', 'clients', 'client', 'appointments', 'billing'],
  technician: ['dashboard', 'appointments', 'inventory']
};
const ALL_MODULES = ['dashboard', 'clients', 'client', 'appointments', 'inventory', 'billing', 'staff', 'reports'];

router.get('/', async (req, res, next) => {
  try {
    const rows = await RolePerm.find({}).lean();
    const out = { staff: DEFAULTS.staff.slice(), technician: DEFAULTS.technician.slice() };
    rows.forEach((r) => {
      if (r.role === 'staff' || r.role === 'technician') out[r.role] = r.modules.slice();
    });
    res.json({
      owner: ['dashboard', 'clients', 'client', 'appointments', 'inventory', 'billing', 'staff', 'reports'],
      staff: out.staff,
      technician: out.technician
    });
  } catch (e) {
    next(e);
  }
});

router.put('/:role', requireRole('owner'), async (req, res, next) => {
  try {
    const role = req.params.role;
    if (role !== 'staff' && role !== 'technician') {
      return res.status(400).json({ error: 'Only staff and technician permissions are editable' });
    }
    const modules = (req.body || {}).modules;
    if (!Array.isArray(modules)) return res.status(400).json({ error: 'modules must be an array' });

    const cleaned = modules.filter((m) => ALL_MODULES.indexOf(m) >= 0);
    if (cleaned.indexOf('dashboard') < 0) cleaned.unshift('dashboard');
    if (cleaned.indexOf('clients') >= 0 && cleaned.indexOf('client') < 0) cleaned.push('client');

    await RolePerm.findOneAndUpdate({ role }, { modules: cleaned }, { upsert: true });
    res.json({ ok: true, role, modules: cleaned });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
