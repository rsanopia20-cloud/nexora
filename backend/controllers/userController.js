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
