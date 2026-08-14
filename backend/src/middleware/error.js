function notFound(req, res) {
  res.status(404).json({ error: 'Not found: ' + req.method + ' ' + req.originalUrl });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err && (err.name === 'ValidationError' || err.name === 'CastError')) {
    return res.status(400).json({ error: err.message });
  }
  if (err && err.code === 11000) {
    return res.status(409).json({ error: 'Duplicate value: ' + JSON.stringify(err.keyValue || {}) });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}

module.exports = { notFound, errorHandler };
