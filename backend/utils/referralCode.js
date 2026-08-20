import crypto from 'crypto';
import User from '../models/User.js';

function slugifyName(fullName) {
  const base = String(fullName || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 24);

  return base || 'user';
}

function randomSuffix(length = 4) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

/**
 * Build a unique referralCode from the user's name.
 * Slugifies fullName, then appends a short random suffix on collision.
 */
export async function generateReferralCode(fullName) {
  const base = slugifyName(fullName);
  let candidate = base;
  let attempts = 0;

  while (attempts < 12) {
    const exists = await User.exists({ referralCode: candidate });
    if (!exists) {
      return candidate;
    }
    candidate = `${base}${randomSuffix(4)}`;
    attempts += 1;
  }

  return `${base}${randomSuffix(8)}`;
}

/**
 * Assign referralCode once per user (skips if already set — e.g. admin override).
 */
export async function assignReferralCodeIfMissing(user) {
  if (user.referralCode) {
    return user.referralCode;
  }

  const referralCode = await generateReferralCode(user.fullName);
  await User.findByIdAndUpdate(user._id, { referralCode });
  return referralCode;
}
