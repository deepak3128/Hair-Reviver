const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
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
