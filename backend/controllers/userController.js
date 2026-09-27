import User from '../models/User.js';
import Link, { LINK_SORT } from '../models/Link.js';
import LinkUsage from '../models/LinkUsage.js';
import ClickEvent from '../models/ClickEvent.js';
import { getOrCreateTrackingCode } from '../utils/shortCode.js';
import { buildShortTrackingUrl } from '../utils/publicUrl.js';
import {
  serializeBankDetails,
  validateBankDetails,
} from '../utils/bankDetails.js';

/**
 * GET /api/user/links
 * Returns every active admin link for the logged-in user, ensuring a short
 * tracking code exists, plus whether they already used it.
 */
export async function getMyLinks(req, res) {
  try {
    const userId = req.user._id;
    const activeLinks = await Link.find({ active: true }).sort(LINK_SORT);

    const links = await Promise.all(
      activeLinks.map(async (link) => {
        const code = await getOrCreateTrackingCode(link._id, userId);
        const trackingUrl = buildShortTrackingUrl(code);

        const [usage, attempts] = await Promise.all([
          LinkUsage.findOne({ linkId: link._id, userId }).lean(),
          ClickEvent.countDocuments({ linkId: link._id, userId }),
        ]);

        return {
          linkId: link._id,
          name: link.name,
          destination: link.destination,
          code,
          trackingUrl,
          wasUsed: Boolean(usage),
          usedAt: usage?.usedAt || null,
          attempts,
        };
      })
    );

    return res.json({
      success: true,
      count: links.length,
      links,
    });
  } catch (error) {
    console.error('getMyLinks error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to load your links',
    });
  }
}

function profileUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    mobile: user.mobile,
    createdAt: user.createdAt,
    bankDetails: serializeBankDetails(user.bankDetails),
  };
}

/**
 * PUT /api/user/profile
 * Update the logged-in user's name, email, and mobile.
 */
export async function updateMyProfile(req, res) {
  try {
    const fullName = String(req.body?.fullName || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const mobile = String(req.body?.mobile || '').trim();
    const errors = [];

    if (!fullName || fullName.length < 2 || fullName.length > 80) {
      errors.push({ field: 'fullName', message: 'Full name must be between 2 and 80 characters' });
    } else if (!/^[a-zA-Z\s.'-]+$/.test(fullName)) {
      errors.push({
        field: 'fullName',
        message: 'Full name can only contain letters and basic punctuation',
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ field: 'email', message: 'Enter a valid email address' });
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      errors.push({ field: 'mobile', message: 'Enter a valid 10-digit Indian mobile number' });
    }

    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: errors[0].message,
        errors,
      });
    }

    const [emailTaken, mobileTaken] = await Promise.all([
      User.findOne({ email, _id: { $ne: req.user._id } }).select('_id'),
      User.findOne({ mobile, _id: { $ne: req.user._id } }).select('_id'),
    ]);

    if (emailTaken) {
      errors.push({ field: 'email', message: 'This email is already registered' });
    }
    if (mobileTaken) {
      errors.push({ field: 'mobile', message: 'This mobile number is already registered' });
    }
    if (errors.length) {
      return res.status(409).json({
        success: false,
        message: errors[0].message,
        errors,
      });
    }

    req.user.fullName = fullName;
    req.user.email = email;
    req.user.mobile = mobile;
    await req.user.save();

    return res.json({
      success: true,
      message: 'Profile updated',
      user: profileUser(req.user),
    });
  } catch (error) {
    if (error?.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'email';
      const label = field === 'mobile' ? 'mobile number' : field;
      return res.status(409).json({
        success: false,
        message: `An account with this ${label} already exists`,
        errors: [{ field, message: `This ${label} is already registered` }],
      });
    }
    console.error('updateMyProfile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to update profile',
    });
  }
}

/**
 * PUT /api/user/bank-details
 * Save or update the logged-in user's payout bank details.
 */
export async function updateMyBankDetails(req, res) {
  try {
    const result = validateBankDetails(req.body || {});
    if (!result.ok) {
      return res.status(400).json({
        success: false,
        message: result.errors[0]?.message || 'Invalid bank details',
        errors: result.errors,
      });
    }

    req.user.bankDetails = result.data;
    await req.user.save();

    return res.json({
      success: true,
      message: 'Bank details saved',
      bankDetails: serializeBankDetails(req.user.bankDetails),
    });
  } catch (error) {
    console.error('updateMyBankDetails error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to save bank details',
    });
  }
}
