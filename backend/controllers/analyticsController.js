import mongoose from 'mongoose';
import Link from '../models/Link.js';
import User from '../models/User.js';
import ClickEvent from '../models/ClickEvent.js';
import LinkUsage from '../models/LinkUsage.js';
import TrackingCode from '../models/TrackingCode.js';

/**
 * GET /api/admin/analytics/links
 * Per-link attempt + valid-use counts.
 *
 * Uses Promise.all + countDocuments per link — fine while the admin pool stays
 * small (~7–50). If link volume grows large, switch to a $group aggregation
 * pipeline on ClickEvent / LinkUsage for fewer round-trips.
 */
export async function getLinkStats(_req, res) {
  try {
    const links = await Link.find().sort({ createdAt: 1 });

    const stats = await Promise.all(
      links.map(async (link) => {
        const [totalAttempts, uniqueValidUses] = await Promise.all([
          ClickEvent.countDocuments({ linkId: link._id }),
          LinkUsage.countDocuments({ linkId: link._id }),
        ]);

        return {
          linkId: link._id,
          linkName: link.name,
          destination: link.destination,
          active: link.active,
          totalAttempts,
          uniqueValidUses,
        };
      })
    );

    return res.json({
      success: true,
      count: stats.length,
      links: stats,
    });
  } catch (error) {
    console.error('getLinkStats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch link analytics',
    });
  }
}

/**
 * GET /api/admin/analytics/links/:linkId
 * Full click history for one link (every ClickEvent attempt).
 *
 * wasValidFirstClick: true if ANY LinkUsage exists for that (linkId, userId).
 * Same flag for all of a user's attempts on this link (not only the first
 * timestamp) — simpler and still answers "did this user ever redeem validly?".
 */
export async function getLinkDetail(req, res) {
  try {
    const { linkId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(linkId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid linkId',
      });
    }

    const link = await Link.findById(linkId);
    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Link not found',
      });
    }

    const [totalAttempts, uniqueValidUses, clickDocs, usages] = await Promise.all([
      ClickEvent.countDocuments({ linkId }),
      LinkUsage.countDocuments({ linkId }),
      ClickEvent.find({ linkId })
        .sort({ clickedAt: -1 })
        // User model fields are fullName / email / mobile (not name / phone)
        .populate('userId', 'fullName email mobile')
        .lean(),
      LinkUsage.find({ linkId }).select('userId').lean(),
    ]);

    const validUserIds = new Set(usages.map((u) => String(u.userId)));

    const clicks = clickDocs.map((click) => {
      const user = click.userId;
      const uid = user?._id ? String(user._id) : String(click.userId);

      return {
        userId: user?._id || click.userId,
        userName: user?.fullName || null,
        userEmail: user?.email || null,
        clickedAt: click.clickedAt,
        ipAddress: click.ipAddress || null,
        wasValidFirstClick: validUserIds.has(uid),
      };
    });

    return res.json({
      success: true,
      link: {
        id: link._id,
        name: link.name,
        destination: link.destination,
        active: link.active,
      },
      totalAttempts,
      uniqueValidUses,
      clicks,
    });
  } catch (error) {
    console.error('getLinkDetail error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch link detail',
    });
  }
}

/**
 * GET /api/admin/analytics/users
 * All registered users with contact details + quick click totals.
 */
export async function getAllUsers(_req, res) {
  try {
    const users = await User.find()
      .select('fullName email mobile createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const rows = await Promise.all(
      users.map(async (user) => {
        const [totalAttempts, totalValidUses] = await Promise.all([
          ClickEvent.countDocuments({ userId: user._id }),
          LinkUsage.countDocuments({ userId: user._id }),
        ]);

        return {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          mobile: user.mobile,
          createdAt: user.createdAt,
          totalAttempts,
          totalValidUses,
        };
      })
    );

    return res.json({
      success: true,
      count: rows.length,
      users: rows,
    });
  } catch (error) {
    console.error('getAllUsers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch users',
    });
  }
}

/**
 * GET /api/admin/analytics/users/:userId
 * Full profile + per-link analytics for one user.
 */
export async function getUserHistory(req, res) {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid userId',
      });
    }

    const user = await User.findById(userId).select('fullName email mobile createdAt');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const baseUrl = (process.env.BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

    const [codes, clickLinkIds, totalAttempts, totalValidUses] = await Promise.all([
      TrackingCode.find({ userId }).lean(),
      ClickEvent.distinct('linkId', { userId }),
      ClickEvent.countDocuments({ userId }),
      LinkUsage.countDocuments({ userId }),
    ]);

    const linkIdSet = new Set([
      ...codes.map((c) => String(c.linkId)),
      ...clickLinkIds.map((id) => String(id)),
    ]);

    const history = await Promise.all(
      [...linkIdSet].map(async (linkId) => {
        const [link, attempts, usage, codeDoc] = await Promise.all([
          Link.findById(linkId).select('name destination active'),
          ClickEvent.countDocuments({ linkId, userId }),
          LinkUsage.findOne({ linkId, userId }).select('usedAt').lean(),
          TrackingCode.findOne({ linkId, userId }).select('code').lean(),
        ]);

        return {
          linkId,
          linkName: link?.name || null,
          destination: link?.destination || null,
          linkActive: link?.active ?? null,
          attempts,
          wasUsed: Boolean(usage),
          usedAt: usage?.usedAt || null,
          code: codeDoc?.code || null,
          trackingUrl: codeDoc?.code ? `${baseUrl}/l/${codeDoc.code}` : null,
        };
      })
    );

    history.sort((a, b) =>
      String(a.linkName || '').localeCompare(String(b.linkName || ''))
    );

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.fullName,
        fullName: user.fullName,
        email: user.email,
        phone: user.mobile,
        mobile: user.mobile,
        createdAt: user.createdAt,
      },
      summary: {
        totalAttempts,
        totalValidUses,
        linksTracked: history.length,
        linksUsed: history.filter((h) => h.wasUsed).length,
      },
      history,
    });
  } catch (error) {
    console.error('getUserHistory error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch user history',
    });
  }
}

/**
 * GET /api/admin/analytics/summary
 * High-level dashboard counters + top 5 links by unique valid uses.
 */
export async function getDashboardSummary(_req, res) {
  try {
    const [totalLinks, totalUsers, totalClickAttempts, totalValidClicks, links] =
      await Promise.all([
        Link.countDocuments(),
        User.countDocuments(),
        ClickEvent.countDocuments(),
        LinkUsage.countDocuments(),
        Link.find().select('name').lean(),
      ]);

    const ranked = await Promise.all(
      links.map(async (link) => {
        const uniqueValidUses = await LinkUsage.countDocuments({
          linkId: link._id,
        });
        return {
          linkName: link.name,
          uniqueValidUses,
        };
      })
    );

    ranked.sort((a, b) => b.uniqueValidUses - a.uniqueValidUses);
    const topLinks = ranked.slice(0, 5);

    return res.json({
      success: true,
      totalLinks,
      totalUsers,
      totalClickAttempts,
      totalValidClicks,
      topLinks,
    });
  } catch (error) {
    console.error('getDashboardSummary error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch dashboard summary',
    });
  }
}
