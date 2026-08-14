/* Vercel serverless entry — the same Express app, exposed as a function.
 * On warm invocations mongoose keeps the Atlas connection alive; on a cold
 * start we connect once before handing off. Original /api/* path is preserved
 * by Vercel so Express routing works unchanged.
 */
const app = require('../backend/src/app');
const { connect } = require('../backend/src/config/env');

let connected = false;

module.exports = async (req, res) => {
  try {
    if (!connected) {
      await connect();
      connected = true;
    }
    return app(req, res);
  } catch (e) {
    res.status(500).json({ error: 'Database connection failed: ' + e.message });
  }
};
