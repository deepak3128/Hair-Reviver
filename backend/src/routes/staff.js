const express = require('express');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { today, addDays, thisMonth } = require('../utils/dates');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(auth, requireRole('owner'));

router.get('/', async (req, res, next) => {
  try {
    const todayS = today();
    const weekEnd = addDays(todayS, 6);

    const members = await User.find({}, 'id name role phone joined rating completed onTime').sort({ role: 1, name: 1 }).lean();

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

module.exports = router;
