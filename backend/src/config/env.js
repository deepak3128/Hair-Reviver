const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const MONGODB_URI = (process.env.MONGODB_URI || '').trim();
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const PORT = process.env.PORT || 4000;

function today() {
  if (process.env.SIM_TODAY) return process.env.SIM_TODAY;
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

async function connect() {
  const mongoose = require('mongoose');
  mongoose.set('strictQuery', true);

  if (mongoose.connection.readyState === 1) return mongoose.connection;

  if (MONGODB_URI) {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    console.log('MongoDB connected (' + mongoose.connection.name + ')');
    return mongoose.connection;
  }

  // No URI configured: spin up an in-memory MongoDB so the API works out of the box.
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  console.log('Using in-memory MongoDB — set MONGODB_URI in backend/.env to use MongoDB Atlas.');
  return mongoose.connection;
}

module.exports = { connect, MONGODB_URI, JWT_SECRET, PORT, today };
