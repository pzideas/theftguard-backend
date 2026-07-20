const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Device = require('../models/Device');
const LocationLog = require('../models/LocationLog');
const Alert = require('../models/Alert');
const User = require('../models/User');
const requireAuth = require('../middleware/auth');

const router = express.Router();

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const upload = multer({ dest: uploadsDir });

router.use(requireAuth);

// Register a new device under the logged-in owner
router.post('/register', async (req, res) => {
  try {
    const { imei, model } = req.body;
    if (!imei) return res.status(400).json({ error: 'imei/identifier is required' });

    const device = await Device.create({ owner: req.userId, identifier: imei, model });
    res.status(201).json({ deviceId: device._id });
  } catch (err) {
    res.status(500).json({ error: 'Device registration failed', detail: err.message });
  }
});

// List all devices belonging to the logged-in owner
router.get('/', async (req, res) => {
  const devices = await Device.find({ owner: req.userId });
  res.json({ devices });
});

// Receive a GPS location ping from a device
router.post('/location', async (req, res) => {
  try {
    const { deviceId, lat, lng } = req.body;
    const device = await Device.findOne({ _id: deviceId, owner: req.userId });
    if (!device) return res.status(404).json({ error: 'Device not found' });

    device.lastLocation = { lat, lng, updatedAt: new Date() };
    await device.save();
    await LocationLog.create({ device: device._id, lat, lng });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save location', detail: err.message });
  }
});

// Get location history for a device (for the dashboard map trail)
router.get('/:deviceId/history', async (req, res) => {
  const device = await Device.findOne({ _id: req.params.deviceId, owner: req.userId });
  if (!device) return res.status(404).json({ error: 'Device not found' });

  const history = await LocationLog.find({ device: device._id })
    .sort({ recordedAt: -1 })
    .limit(200);
  res.json({ history });
});

// Receive a security alert (failed unlock, SIM change, etc.)
router.post('/alert', async (req, res) => {
  try {
    const { deviceId, type, detail } = req.body;
    const device = await Device.findOne({ _id: deviceId, owner: req.userId });
    if (!device) return res.status(404).json({ error: 'Device not found' });

    const alert = await Alert.create({ device: device._id, type, detail });
    res.status(201).json({ alertId: alert._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save alert', detail: err.message });
  }
});

// Receive a silently captured photo after a failed unlock attempt
router.post('/photo', upload.single('photo'), async (req, res) => {
  try {
    const { deviceId } = req.body;
    const device = await Device.findOne({ _id: deviceId, owner: req.userId });
    if (!device) return res.status(404).json({ error: 'Device not found' });

    const photoUrl = `/uploads/${req.file.filename}`;
    await Alert.create({ device: device._id, type: 'FAILED_UNLOCK_PHOTO', photoUrl });

    res.json({ ok: true, photoUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save photo', detail: err.message });
  }
});

// Get all alerts for a device (newest first)
router.get('/:deviceId/alerts', async (req, res) => {
  const device = await Device.findOne({ _id: req.params.deviceId, owner: req.userId });
  if (!device) return res.status(404).json({ error: 'Device not found' });

  const alerts = await Alert.find({ device: device._id }).sort({ createdAt: -1 }).limit(100);
  res.json({ alerts });
});
// Temporary: test email sending directly
router.get('/test-email', async (req, res) => {
  try {
    const owner = await User.findById(req.userId);
    await sendSosEmail(owner.email, 'Test Device', 27.85, 69.11, null);
    res.json({ ok: true, message: 'Email sent, check inbox' });
  } catch (err) {
    res.status(500).json({ error: 'Email failed', detail: err.message, stack: err.stack });
  }
});
module.exports = router;
