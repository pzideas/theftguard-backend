const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  identifier: { type: String, required: true }, // serial/IMEI-like identifier
  model: { type: String },
  lastLocation: {
    lat: Number,
    lng: Number,
    updatedAt: Date
  },
  registeredAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Device', deviceSchema);
