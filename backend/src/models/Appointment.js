const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    clientId: { type: String, required: true, index: true },
    techId: { type: String, default: null },
    date: { type: String, required: true, index: true },
    time: { type: String, default: '' },
    service: { type: String, default: 'Cleaning' },
    dur: { type: Number, default: 45 },
    status: {
      type: String,
      enum: ['scheduled', 'inprogress', 'completed', 'noshow', 'cancelled'],
      default: 'scheduled',
      index: true
    },
    reminder: {
      channel: { type: String, default: 'WhatsApp' },
      daysBefore: { type: Number, default: 1 }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
