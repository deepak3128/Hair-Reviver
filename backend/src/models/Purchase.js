const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    date: { type: String, default: '' },
    vendor: { type: String, default: '' },
    item: { type: String, default: '' },
    qty: { type: Number, default: 0 },
    cost: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Purchase', purchaseSchema);
