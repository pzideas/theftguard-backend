const express = require('express');
const { sendSosEmail } = require('../mailer');

const router = express.Router();

// Public endpoint (no auth, no MongoDB) - the Android app calls this
// directly after writing an alert to Firestore, just to trigger the
// email notification. Kept deliberately simple/stateless.
router.post('/', async (req, res) => {
  try {
    const { toEmail, deviceModel, lat, lng, photoUrl, type, detail } = req.body;

    if (!toEmail || !deviceModel) {
      return res.status(400).json({ error: 'toEmail and deviceModel are required' });
    }

    const isPhoto = type === 'FAILED_UNLOCK_PHOTO' || type === 'FAILED_UNLOCK';
    const title = type === 'SOS_TRIGGERED'
      ? 'SOS Alert Triggered'
      : isPhoto
        ? 'Wrong Password Attempt Detected'
        : (detail || 'TheftGuard Alert');
    const subjectPrefix = type === 'SOS_TRIGGERED' ? '🚨 SOS Alert' : '🔒 Security Alert';

    await sendSosEmail(toEmail, deviceModel, lat, lng, photoUrl, { title, subjectPrefix });

    res.json({ success: true });
  } catch (err) {
    console.error('notify error:', err.message);
    res.status(500).json({ error: 'Failed to send email', detail: err.message });
  }
});

module.exports = router;
