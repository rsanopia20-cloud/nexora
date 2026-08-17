import Link from '../models/Link.js';
import ClickEvent from '../models/ClickEvent.js';
import LinkUsage from '../models/LinkUsage.js';
import TrackingCode from '../models/TrackingCode.js';
import { verifySignature } from '../utils/tracking.js';

function homepageUrl() {
  return process.env.HOMEPAGE_URL || process.env.CLIENT_URL || 'http://localhost:5173';
}

function redirectHome(res) {
  return res.redirect(302, homepageUrl());
}

/**
 * Shared one-time-click + analytics core used by:
 * - legacy /t/:token (HMAC redirect)
 * - new /l/:code (short-code redirect)
 * - authenticated POST /api/links/click (JSON)
 *
 * Always logs a ClickEvent attempt. Enforces one successful redeem via LinkUsage.
 *
 * @returns {Promise<{ status: 'already_used' } | { status: 'ok', destination: string } | { status: 'unavailable' }>}
 */
export async function processClickAttempt(linkId, userId, req) {
  // Log every attempt (including repeats). Never block the flow on this.
  try {
    await ClickEvent.create({
      linkId,
      userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  } catch (error) {
    console.error('ClickEvent logging failed:', error);
  }

  try {
    const alreadyUsed = await LinkUsage.findOne({ linkId, userId });

    if (alreadyUsed) {
      return { status: 'already_used' };
    }

    try {
      await LinkUsage.create({ linkId, userId });
    } catch (error) {
      // Duplicate key (11000) = race: another request redeemed first
      if (error?.code === 11000) {
        return { status: 'already_used' };
      }
      throw error;
    }

    const link = await Link.findById(linkId);

    if (!link || !link.active) {
      return { status: 'unavailable' };
    }

    return { status: 'ok', destination: link.destination };
  } catch (error) {
    console.error('processClickAttempt error:', error);
    return { status: 'unavailable' };
  }
}

/**
 * WhatsApp / public redirect wrapper around processClickAttempt.
 */
async function processValidClick(linkId, userId, req, res) {
  const result = await processClickAttempt(linkId, userId, req);

  if (result.status === 'ok') {
    return res.redirect(302, result.destination);
  }

  return redirectHome(res);
}

/** Legacy long-format: /t/{linkId}.{userId}.{signature} */
export async function handleTrackingClick(req, res) {
  const rawToken = req.params.token || '';
  const parts = rawToken.split('.');

  if (parts.length !== 3) {
    return redirectHome(res);
  }

  const [linkId, userId, signature] = parts;

  if (!verifySignature(linkId, userId, signature)) {
    return redirectHome(res);
  }

  return processValidClick(linkId, userId, req, res);
}

/** New short-code: /l/{code} */
export async function handleShortCodeClick(req, res) {
  const code = (req.params.code || '').trim();

  if (!code) {
    return redirectHome(res);
  }

  try {
    const tracking = await TrackingCode.findOne({ code });

    if (!tracking) {
      return redirectHome(res);
    }

    return processValidClick(tracking.linkId, tracking.userId, req, res);
  } catch (error) {
    console.error('handleShortCodeClick error:', error);
    return redirectHome(res);
  }
}

/**
 * Authenticated dashboard click: POST /api/links/click { linkId }
 * userId comes from JWT (req.user), never from the client body.
 */
export async function handleAuthenticatedClick(req, res) {
  try {
    const linkId = req.body?.linkId;
    const userId = req.user?._id;

    if (!linkId) {
      return res.status(400).json({
        success: false,
        message: 'linkId is required',
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const link = await Link.findById(linkId);

    if (!link || !link.active) {
      return res.status(404).json({
        success: false,
        message: 'Link not found',
      });
    }

    const result = await processClickAttempt(linkId, userId, req);

    if (result.status === 'already_used') {
      return res.status(200).json({ alreadyUsed: true });
    }

    if (result.status === 'ok') {
      return res.status(200).json({
        alreadyUsed: false,
        destination: result.destination,
      });
    }

    return res.status(404).json({
      success: false,
      message: 'Link not found',
    });
  } catch (error) {
    console.error('handleAuthenticatedClick error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to process link click',
    });
  }
}
