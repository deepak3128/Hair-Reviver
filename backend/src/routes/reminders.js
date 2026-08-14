const express = require('express');
const Appointment = require('../models/Appointment');
const { auth } = require('../middleware/auth');
const { clinicOnly } = require('../middleware/network');
const { dueReminders } = require('../services/reminders');

const router = express.Router();
router.use(auth, clinicOnly);

router.get('/', async (req, res, next) => {
  try {
    const due = await dueReminders();
    res.json({ reminders: due, total: due.length });
  } catch (e) {
    next(e);
  }
});

router.patch('/appointments/:id/reminder-sent', async (req, res, next) => {
  try {
    const a = await Appointment.findOne({ id: req.params.id });
    if (!a) return res.status(404).json({ error: 'Appointment not found' });
    a.reminderSentAt = new Date();
    await a.save();
    res.json({ ok: true, appointment: a.toObject() });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
