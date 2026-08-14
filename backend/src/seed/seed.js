const bcrypt = require('bcryptjs');
const { connect } = require('../config/env');
const seedData = require('./seed-data');

const User = require('../models/User');
const Client = require('../models/Client');
const Appointment = require('../models/Appointment');
const InventoryItem = require('../models/InventoryItem');
const Invoice = require('../models/Invoice');
const Purchase = require('../models/Purchase');
const Package = require('../models/Package');
const RolePerm = require('../models/RolePerm');

const COLLECTIONS = [
  ['clients', Client, seedData.clients],
  ['appointments', Appointment, seedData.appointments],
  ['inventory', InventoryItem, seedData.inventory],
  ['invoices', Invoice, seedData.invoices],
  ['purchases', Purchase, seedData.purchases],
  ['packages', Package, seedData.packages],
  ['rolePerms', RolePerm, seedData.rolePerms]
];

async function seed({ reset } = {}) {
  await connect();

  if (reset) {
    await Promise.all([
      User.deleteMany({}),
      Client.deleteMany({}),
      Appointment.deleteMany({}),
      InventoryItem.deleteMany({}),
      Invoice.deleteMany({}),
      Purchase.deleteMany({}),
      Package.deleteMany({}),
      RolePerm.deleteMany({})
    ]);
    console.log('Cleared all collections (--reset).');
  }

  for (const [name, Model, docs] of COLLECTIONS) {
    const count = await Model.countDocuments({});
    if (count === 0 && docs.length) {
      await Model.insertMany(docs);
      console.log('Seeded ' + name + ' (' + docs.length + ' rows)');
    } else {
      console.log('Skipped ' + name + ' (already has ' + count + ' rows)');
    }
  }

  const userCount = await User.countDocuments({});
  if (userCount === 0) {
    const users = [];
    for (const u of seedData.users) {
      users.push(Object.assign({}, u, { passwordHash: bcrypt.hashSync(u.password, 10) }));
      delete users[users.length - 1].password;
    }
    await User.insertMany(users);
    console.log('Seeded users (' + users.length + ' accounts)');
  } else {
    console.log('Skipped users (already has ' + userCount + ' rows)');
  }

  console.log('Seed complete. Demo logins (password: demo1234):');
  seedData.users.forEach((u) => console.log('  ' + u.role.padEnd(10) + u.email));
}

if (require.main === module) {
  seed({ reset: process.argv.indexOf('--reset') >= 0 })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { seed };
