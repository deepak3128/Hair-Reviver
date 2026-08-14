const { connect, PORT } = require('./config/env');
const app = require('./app');
const { seed } = require('./seed/seed');

(async () => {
  await connect();
  await seed(); // seeds sample data only when collections are empty
  app.listen(PORT, () => {
    console.log('Hair Reviver API ready → http://localhost:' + PORT);
    console.log('  API docs:   /api/health');
    console.log('  Frontend:   / (served from repo root)');
  });
})().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
