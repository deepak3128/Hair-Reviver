const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    price: { type: Number, default: 0 },
    period: { type: String, default: '' },
    svc: { type: Number, default: 0 },
    desc: { type: String, default: '' },
    members: [{ type: String }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Package', packageSchema);
