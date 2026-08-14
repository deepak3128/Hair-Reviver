const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

const { notFound, errorHandler } = require('./middleware/error');

const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const appointmentRoutes = require('./routes/appointments');
const inventoryRoutes = require('./routes/inventory');
const billingRoutes = require('./routes/billing');
const staffRoutes = require('./routes/staff');
const reportRoutes = require('./routes/reports');
const roleRoutes = require('./routes/roles');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'hair-reviver-api', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/invoices', billingRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/roles', roleRoutes);

// Serve the built frontend (Vite) so a single server runs the whole app.
const DIST = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(path.join(DIST, 'index.html'))) {
  app.use(express.static(DIST));
} else {
  app.get('/', (req, res) =>
    res.status(200).send('Frontend not built yet. Run "npm run build" from the project root, then restart. API is live under /api.')
  );
}

app.use('/api', notFound);
app.use(errorHandler);

module.exports = app;
