import Link from '../models/Link.js';
import LinkUsage from '../models/LinkUsage.js';
import ClickEvent from '../models/ClickEvent.js';
import { getOrCreateTrackingCode } from '../utils/shortCode.js';

function getBaseUrl() {
  return (process.env.BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
}

/**
 * GET /api/user/links
 * Returns every active admin link for the logged-in user, ensuring a short
 * tracking code exists, plus whether they already used it.
 */
export async function getMyLinks(req, res) {
  try {
    const userId = req.user._id;
    const activeLinks = await Link.find({ active: true }).sort({ createdAt: 1 });
    const baseUrl = getBaseUrl();

    const links = await Promise.all(
      activeLinks.map(async (link) => {
        const code = await getOrCreateTrackingCode(link._id, userId);
        const trackingUrl = `${baseUrl}/l/${code}`;

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
