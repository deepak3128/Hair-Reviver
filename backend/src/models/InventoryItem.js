const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    base: { type: String, required: true },
    vendor: { type: String, default: '' },
    batch: { type: String, default: '' },
    qty: { type: Number, default: 0 },
    thr: { type: Number, default: 5 },
    cost: { type: Number, default: 0 },
    received: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('InventoryItem', inventorySchema);
