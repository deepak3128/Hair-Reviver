const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, default: '' },
    city: { type: String, default: '' },
    gender: { type: String, default: '' },
    patchType: { type: String, default: '' },
    base: { type: String, default: '' },
    vendor: { type: String, default: '' },
    attach: { type: String, default: '' },
    cycle: { type: Number, default: 3 },
    lastService: { type: String, default: '' },
    joined: { type: String, default: '' },
    packageId: { type: String, default: null },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Client', clientSchema);
