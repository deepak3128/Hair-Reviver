const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    date: { type: String, required: true, index: true },
    clientId: { type: String, required: true, index: true },
    apptId: { type: String, default: null },
    items: [{ label: String, amount: Number }],
    total: { type: Number, default: 0 },
    paid: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'partial', 'paid'], default: 'pending', index: true },
    payments: [{ amount: Number, method: String, date: String }]
  },
  { timestamps: true }
);

invoiceSchema.methods.recomputeStatus = function () {
  if (this.paid >= this.total && this.total > 0) this.status = 'paid';
  else if (this.paid > 0) this.status = 'partial';
  else this.status = 'pending';
};

module.exports = mongoose.model('Invoice', invoiceSchema);
