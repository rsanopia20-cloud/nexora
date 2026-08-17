import crypto from 'crypto';

function getTrackingSecret() {
  return process.env.TRACKING_SECRET;
}

function getBaseUrl() {
  return process.env.BASE_URL || 'http://localhost:5000';
}

function computeSignature(linkId, userId) {
  const secret = getTrackingSecret();

  if (!secret) {
    throw new Error(
      'TRACKING_SECRET is not set. Add it to backend/.env before generating tracking URLs.'
    );
  }

  const payload = `${linkId}.${userId}`;
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
    .slice(0, 8);
}

/**
 * Builds a signed one-time tracking URL for a (link, user) pair.
 * Format: `${BASE_URL}/t/${linkId}.${userId}.${signature}`
 */
export function generateTrackingUrl(linkId, userId) {
  const signature = computeSignature(String(linkId), String(userId));
  const baseUrl = getBaseUrl().replace(/\/$/, '');
  return `${baseUrl}/t/${linkId}.${userId}.${signature}`;
}

/**
 * Verifies the HMAC signature on a tracking token.
 * Uses timing-safe comparison to avoid timing attacks.
 */
export function verifySignature(linkId, userId, signature) {
  try {
    if (typeof signature !== 'string' || !signature) {
      return false;
    }

    if (!getTrackingSecret()) {
      return false;
    }

    const expected = computeSignature(String(linkId), String(userId));
    const expectedBuf = Buffer.from(expected, 'utf8');
    const providedBuf = Buffer.from(signature, 'utf8');

    // timingSafeEqual throws if lengths differ — treat as invalid instead
    if (expectedBuf.length !== providedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, providedBuf);
  } catch {
    return false;
  }
}
