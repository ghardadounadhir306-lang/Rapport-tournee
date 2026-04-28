const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const authRoutes = require('./routes/auth.routes');
const tripRoutes = require('./routes/trip.routes');
const tourneeRoutes = require('./routes/tournee.routes');
const adminRoutes = require('./routes/admin.routes');
const { pool } = require('./db');

if (!process.env.JWT_SECRET) {
  throw new Error('Missing JWT_SECRET in Backend_auth/.env');
}

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/tournees', tourneeRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);

  if (err && Number.isInteger(err.statusCode)) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  return res.status(500).json({ message: 'Internal server error' });
});

const port = Number(process.env.PORT || 4000);

app.listen(port, () => {
  console.log(`Fleet backend running on http://localhost:${port}`);
});

process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});
