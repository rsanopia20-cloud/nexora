import crypto from 'crypto';
import { BrevoClient } from '@getbrevo/brevo';

const RESET_WINDOW_MS = 30 * 60 * 1000;
const EMAIL_COOLDOWN_MS = 60 * 1000;
const EMAIL_LIMIT = 5;
const EMAIL_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const IP_LIMIT = 10;
const IP_LIMIT_WINDOW_MS = 15 * 60 * 1000;

const emailHits = new Map();
const ipHits = new Map();

export const RESET_TOKEN_TTL_MS = RESET_WINDOW_MS;
export const FORGOT_PASSWORD_MESSAGE =
  'If an account exists for this email, we sent a reset link. It expires in 30 minutes.';

function stripSlash(value) {
  return String(value || '').trim().replace(/\/$/, '');
}

export function getFrontendBaseUrl() {
  const raw =
    process.env.HOMEPAGE_URL ||
    String(process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0];
  const url = stripSlash(raw);
  if (!url) return 'http://localhost:5173';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export function createResetToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, tokenHash, expiresAt: new Date(Date.now() + RESET_WINDOW_MS) };
}

function prune(map, now) {
  for (const [key, entry] of map) {
    if (now > entry.resetAt) map.delete(key);
  }
}

function hitLimit(map, key, limit, windowMs) {
  const now = Date.now();
  if (map.size > 5000) prune(map, now);

  const entry = map.get(key);
  if (!entry || now > entry.resetAt) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count += 1;
  return entry.count > limit;
}

export function isIpRateLimited(ip) {
  return hitLimit(ipHits, ip || 'unknown', IP_LIMIT, IP_LIMIT_WINDOW_MS);
}

export function isEmailRateLimited(email) {
  return hitLimit(emailHits, email, EMAIL_LIMIT, EMAIL_LIMIT_WINDOW_MS);
}

export function isWithinSendCooldown(sentAt) {
  if (!sentAt) return false;
  return Date.now() - new Date(sentAt).getTime() < EMAIL_COOLDOWN_MS;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sendPasswordResetEmail(toEmail, toName, resetUrl) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.SENDER_EMAIL;
  const senderName = process.env.SENDER_NAME || 'Nexora';

  if (!apiKey || !senderEmail) {
    console.error('Password reset email skipped: BREVO_API_KEY and/or SENDER_EMAIL missing');
    return false;
  }

  const safeName = escapeHtml(toName?.trim() || 'there');
  const safeUrl = escapeHtml(resetUrl);
  const brevo = new BrevoClient({ apiKey });

  await brevo.transactionalEmails.sendTransacEmail({
    subject: 'Reset your Nexora password',
    sender: { name: senderName, email: senderEmail },
    to: [{ email: toEmail, name: toName?.trim() || 'there' }],
    htmlContent: `
      <p>Hi ${safeName},</p>
      <p>We received a request to reset the password for your Nexora account.</p>
      <p><a href="${safeUrl}">Choose a new password</a></p>
      <p>This link expires in 30 minutes and can be used once. If you did not request this, you can ignore this email.</p>
      <p>If the button does not open, copy this link into your browser:<br>${safeUrl}</p>
      <p>— Team Nexora</p>
    `,
  });

  console.log(`Password reset email sent to ${toEmail}`);
  return true;
}

/**
 * Confirms a successful password change. Never includes the new password.
 * Never throws — a mail failure must not undo the reset.
 */
export async function sendPasswordUpdatedEmail(toEmail, toName) {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.SENDER_EMAIL;
    const senderName = process.env.SENDER_NAME || 'Nexora';

    if (!apiKey || !senderEmail) {
      console.error('Password updated email skipped: BREVO_API_KEY and/or SENDER_EMAIL missing');
      return false;
    }

    if (!toEmail) {
      console.error('Password updated email skipped: recipient email is missing');
      return false;
    }

    const safeName = escapeHtml(toName?.trim() || 'there');
    const brevo = new BrevoClient({ apiKey });

    await brevo.transactionalEmails.sendTransacEmail({
      subject: 'Your Nexora password was updated',
      sender: { name: senderName, email: senderEmail },
      to: [{ email: toEmail, name: toName?.trim() || 'there' }],
      htmlContent: `
        <p>Hi ${safeName},</p>
        <p>Your Nexora account password was updated successfully.</p>
        <p>If you made this change, no further action is needed.</p>
        <p>If you did not update your password, contact us through our official channels right away so we can help secure your account.</p>
        <p>— Team Nexora</p>
      `,
    });

    console.log(`Password updated email sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('Password updated email failed:', error?.message || error);
    return false;
  }
}
