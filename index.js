import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './config/db.js';
import stationRoutes from './routes/stationRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

dotenv.config();

// ─── Initialize PostgreSQL / Supabase Schema ─────────────────────────────────
initDB();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/stations', stationRoutes);
app.use('/api/reports', reportRoutes);

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Fuel Station Finder API Server is running.',
    database: 'PostgreSQL (Supabase / Render ready)',
    timestamp: new Date(),
  });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
