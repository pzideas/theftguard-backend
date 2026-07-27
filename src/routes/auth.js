const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const PendingSignup = require('../models/PendingSignup');
const { sendVerificationCode } = require('../mailer');

const router = express.Router();

async function verifyCaptcha(token) {
  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`
  });
  const data = await response.json();
  return data.success === true;
}

// Step 1 of sign-up: verify captcha, email a 6-digit code
router.post('/send-code', async (req, res) => {
  try {
    const { email, password, captchaToken } = req.body;
    if (!email || !password || !captchaToken) {
      return res.status(400).json({ error: 'email, password and captchaToken are required' });
    }

    const captchaOk = await verifyCaptcha(captchaToken);
    if (!captchaOk) {
      return res.status(400).json({ error: 'Captcha verification failed' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const passwordHash = await bcrypt.hash(password, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await PendingSignup.findOneAndUpdate(
      { email: email.toLowerCase() },
      { email: email.toLowerCase(), passwordHash, code, expiresAt },
      { upsert: true, new: true }
    );

    await sendVerificationCode(email, code);
    res.json({ ok: true, message: 'Verification code sent' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send code', detail: err.message });
  }
});

// Step 2 of sign-up: confirm the code, create the real account
router.post('/verify-and-register', async (req, res) => {
  try {
    const { email, code } = req.body;
    const pending = await PendingSignup.findOne({ email: (email || '').toLowerCase() });

    if (!pending || pending.code !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }
    if (pending.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    const user = await User.create({ email: pending.email, passwordHash: pending.passwordHash });
    await PendingSignup.deleteOne({ _id: pending._id });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '90d' });
    res.status(201).json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed', detail: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '90d' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', detail: err.message });
  }
});

module.exports = router;
