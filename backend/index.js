import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import linkRoutes from './routes/linkRoutes.js';
import trackingRoutes from './routes/trackingRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import userRoutes from './routes/userRoutes.js';
import userLinkRoutes from './routes/userLinkRoutes.js';

dotenv.config();

if (!process.env.TRACKING_SECRET) {
  console.warn(
    'Warning: TRACKING_SECRET is not set in .env. Tracking URL generation will fail until it is added.'
  );
}

if (!process.env.BASE_URL) {
  console.warn(
    'Warning: BASE_URL is not set in .env. Falling back to http://localhost:5000 for tracking URLs.'
  );
}

if (!process.env.BREVO_API_KEY) {
  console.warn(
    'Warning: BREVO_API_KEY is not set in .env. Welcome emails will be skipped until it is added.'
  );
}

if (!process.env.SENDER_EMAIL) {
  console.warn(
    'Warning: SENDER_EMAIL is not set in .env. Welcome emails will be skipped until it is added (must be a verified Brevo sender).'
  );
}

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(helmet());
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Nexora API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/links', userLinkRoutes);
// TODO: Protect with admin-only auth middleware when admin roles are added.
app.use('/api/admin/links', linkRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
// Public tracking redirects — must NOT sit behind JWT auth
// Mounted at / so /t/:token (legacy) and /l/:code (short) both work
app.use('/', trackingRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

start();
