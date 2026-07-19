const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  device: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
  type: { type: String, required: true }, // FAILED_UNLOCK | SIM_CHANGED | etc.
  detail: { type: String },
  photoUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Alert', alertSchema);
