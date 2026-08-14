const mongoose = require('mongoose');

const rolePermSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['staff', 'technician'], unique: true, required: true },
    modules: [{ type: String }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('RolePerm', rolePermSchema);
