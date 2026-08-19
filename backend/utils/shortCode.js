import crypto from 'crypto';
import TrackingCode from '../models/TrackingCode.js';
import { buildShortTrackingUrl } from './publicUrl.js';

// Unambiguous alphanumeric (no 0/O, 1/l/I)
const CHARSET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
const MAX_RETRIES = 5;

/**
 * Returns a random 6-character short code.
 */
export function generateShortCode() {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += CHARSET[bytes[i] % CHARSET.length];
  }
  return code;
}

/**
 * Reuse an existing short code for (linkId, userId), or create a new one.
 * Retries generation on rare unique-index collisions.
 */
export async function getOrCreateTrackingCode(linkId, userId) {
  const existing = await TrackingCode.findOne({ linkId, userId });
  if (existing) {
    return existing.code;
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    const code = generateShortCode();
    const taken = await TrackingCode.findOne({ code }).select('_id').lean();
    if (taken) {
      continue;
    }

    try {
      const created = await TrackingCode.create({
        code,
        linkId,
        userId,
      });
      return created.code;
    } catch (error) {
      // Duplicate code race (unique index) — retry with a new code
      if (error?.code === 11000) {
        const raced = await TrackingCode.findOne({ linkId, userId });
        if (raced) {
          return raced.code;
        }
        continue;
      }
      throw error;
    }
  }

  throw new Error('Unable to generate a unique tracking short code');
}

/**
 * Builds a short tracking URL: `${publicBase}/l/${code}`
 */
export async function generateShortTrackingUrl(linkId, userId) {
  const code = await getOrCreateTrackingCode(linkId, userId);
  return buildShortTrackingUrl(code);
}
