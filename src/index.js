require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/devices');
const notifyRoutes = require('./routes/notify');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/notify', notifyRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4000;

// /api/notify (used by the Firebase-based app for email alerts) doesn't need
// MongoDB at all, so the server should still start and serve it even if the
// Mongo connection fails or MONGO_URI isn't configured.
if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection failed (continuing anyway):', err.message));
} else {
  console.warn('MONGO_URI not set - skipping MongoDB connection, /api/notify will still work.');
}

app.listen(PORT, () => console.log(`TheftGuard backend running on port ${PORT}`));
