import crypto from 'crypto';
import {
  clearAdminCookie,
  setAdminCookie,
  signAdminToken,
} from '../utils/token.js';

function safeEqual(left, right) {
  const a = Buffer.from(String(left ?? ''), 'utf8');
  const b = Buffer.from(String(right ?? ''), 'utf8');

  if (a.length !== b.length) {
    crypto.timingSafeEqual(a, a);
    return false;
  }

  return crypto.timingSafeEqual(a, b);
}

export async function adminLogin(req, res) {
  const expectedEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedEmail || !expectedPassword) {
    return res.status(500).json({
      success: false,
      message: 'Admin login is not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env.',
    });
  }

  const email = String(req.body?.email || '')
    .trim()
    .toLowerCase();
  const password = String(req.body?.password || '');

  const emailOk = safeEqual(email, expectedEmail);
  const passwordOk = safeEqual(password, expectedPassword);

  if (!emailOk || !passwordOk) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  const token = signAdminToken();
  setAdminCookie(res, token);

  return res.json({
    success: true,
    token,
    message: 'Logged in successfully',
  });
}

export async function adminLogout(_req, res) {
  clearAdminCookie(res);
  return res.json({
    success: true,
    message: 'Logged out successfully',
  });
}

export async function adminMe(_req, res) {
  return res.json({
    success: true,
    admin: true,
  });
}
