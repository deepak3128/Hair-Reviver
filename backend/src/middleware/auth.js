const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const User = require('../models/User');

async function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  try {
    const user = await User.findOne({ id: payload.id });
    if (!user) return res.status(401).json({ error: 'This account no longer exists' });
    if (user.active === false) {
      return res.status(401).json({ error: 'This account has been disabled. Ask the owner.' });
    }
    req.user = { id: user.id, role: user.role, name: user.name };
    next();
  } catch (e) {
    next(e);
  }
}

function requireRole() {
  const roles = Array.from(arguments);
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (roles.indexOf(req.user.role) >= 0) return next();
    return res.status(403).json({ error: 'Your role does not allow this action' });
  };
}

module.exports = { auth, requireRole, JWT_SECRET };
