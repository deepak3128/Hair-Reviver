const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth, JWT_SECRET } = require('../middleware/auth');
const { clinicOnly, isAllowed } = require('../middleware/network');

const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    if (user.active === false) {
      return res.status(401).json({ error: 'This account has been disabled. Ask the owner.' });
    }

    if ((user.role === 'staff' || user.role === 'technician') && !isAllowed(req.ip)) {
      return res.status(401).json({
        error: 'Front Desk and Technician accounts can only sign in from the clinic network (clinic Wi-Fi).'
      });
    }

    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: user.toSafe() });
  } catch (e) {
    next(e);
  }
});

router.get('/me', auth, clinicOnly, async (req, res, next) => {
  try {
    const user = await User.findOne({ id: req.user.id });
    if (!user) return res.status(401).json({ error: 'User no longer exists' });
    res.json({ user: user.toSafe() });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
