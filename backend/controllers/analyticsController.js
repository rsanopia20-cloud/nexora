import mongoose from 'mongoose';
import ExcelJS from 'exceljs';
import Link, { LINK_SORT } from '../models/Link.js';
import User from '../models/User.js';
import ClickEvent from '../models/ClickEvent.js';
import LinkUsage from '../models/LinkUsage.js';
import TrackingCode from '../models/TrackingCode.js';
import { buildShortTrackingUrl } from '../utils/publicUrl.js';

const IST_TZ = 'Asia/Kolkata';

const istDateTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: IST_TZ,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
});

const istFileDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: IST_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function formatIstDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${istDateTimeFormatter.format(date)} IST`;
}

/** Treat yyyy-mm-dd filters as Indian calendar days (UTC+05:30). */
function parseIstDateBoundary(input, endOfDay = false) {
  if (!input) return null;
  const text = String(input).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const iso = endOfDay
    ? `${text}T23:59:59.999+05:30`
    : `${text}T00:00:00.000+05:30`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

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
    const links = await Link.find().sort(LINK_SORT);

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
          sortOrder: link.sortOrder ?? 0,
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
          Link.findById(linkId).select('name destination active sortOrder'),
          ClickEvent.countDocuments({ linkId, userId }),
          LinkUsage.findOne({ linkId, userId }).select('usedAt').lean(),
          TrackingCode.findOne({ linkId, userId }).select('code').lean(),
        ]);

        return {
          linkId,
          linkName: link?.name || null,
          destination: link?.destination || null,
          linkActive: link?.active ?? null,
          sortOrder: link?.sortOrder ?? Number.MAX_SAFE_INTEGER,
          attempts,
          wasUsed: Boolean(usage),
          usedAt: usage?.usedAt || null,
          code: codeDoc?.code || null,
          trackingUrl: buildShortTrackingUrl(codeDoc?.code),
        };
      })
    );

    history.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

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

/**
 * GET /api/admin/analytics/export
 * Export click-attempt report as Excel (.xlsx), filterable by:
 * - userId (optional)
 * - linkId (optional)
 * - fromDate (optional, yyyy-mm-dd, Indian calendar day)
 * - toDate (optional, yyyy-mm-dd, Indian calendar day)
 */
export async function exportAnalyticsReport(req, res) {
  try {
    const { userId, linkId, fromDate, toDate } = req.query;

    if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid userId filter',
      });
    }

    if (linkId && !mongoose.Types.ObjectId.isValid(linkId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid linkId filter',
      });
    }

    const from = parseIstDateBoundary(fromDate, false);
    const to = parseIstDateBoundary(toDate, true);
    if (fromDate && !from) {
      return res.status(400).json({
        success: false,
        message: 'Invalid fromDate filter',
      });
    }
    if (toDate && !to) {
      return res.status(400).json({
        success: false,
        message: 'Invalid toDate filter',
      });
    }
    if (from && to && from > to) {
      return res.status(400).json({
        success: false,
        message: 'fromDate cannot be after toDate',
      });
    }

    const clickMatch = {};
    if (userId) clickMatch.userId = userId;
    if (linkId) clickMatch.linkId = linkId;
    if (from || to) {
      clickMatch.clickedAt = {};
      if (from) clickMatch.clickedAt.$gte = from;
      if (to) clickMatch.clickedAt.$lte = to;
    }

    const clicks = await ClickEvent.find(clickMatch)
      .sort({ clickedAt: -1 })
      .populate('userId', 'fullName email mobile')
      .populate('linkId', 'name destination')
      .lean();

    const usageMatch = {};
    if (userId) usageMatch.userId = userId;
    if (linkId) usageMatch.linkId = linkId;
    const usages = await LinkUsage.find(usageMatch).select('userId linkId').lean();
    const validPairs = new Set(usages.map((u) => `${u.userId}:${u.linkId}`));

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Nexora Bizworks';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Click Analytics', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    sheet.columns = [
      { header: 'Clicked At (IST)', key: 'clickedAt', width: 28 },
      { header: 'User Name', key: 'userName', width: 22 },
      { header: 'User Email', key: 'userEmail', width: 28 },
      { header: 'User Mobile', key: 'userMobile', width: 16 },
      { header: 'Link Name', key: 'linkName', width: 20 },
      { header: 'Destination URL', key: 'destination', width: 36 },
      { header: 'IP Address', key: 'ipAddress', width: 18 },
      { header: 'User Agent', key: 'userAgent', width: 42 },
      { header: 'Was Valid First Click', key: 'wasValidFirstClick', width: 22 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E79' },
    };
    headerRow.alignment = { vertical: 'middle', wrapText: true };
    headerRow.height = 22;

    clicks.forEach((click) => {
      const user = click.userId && typeof click.userId === 'object' ? click.userId : null;
      const link = click.linkId && typeof click.linkId === 'object' ? click.linkId : null;
      const pairKey = `${user?._id || click.userId}:${link?._id || click.linkId}`;

      sheet.addRow({
        clickedAt: formatIstDateTime(click.clickedAt),
        userName: user?.fullName || '',
        userEmail: user?.email || '',
        userMobile: user?.mobile || '',
        linkName: link?.name || '',
        destination: link?.destination || '',
        ipAddress: click.ipAddress || '',
        userAgent: click.userAgent || '',
        wasValidFirstClick: validPairs.has(pairKey) ? 'Yes' : 'No',
      });
    });

    const stamp = istFileDateFormatter.format(new Date());
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="nexora-analytics-report-${stamp}.xlsx"`
    );

    await workbook.xlsx.write(res);
    return res.end();
  } catch (error) {
    console.error('exportAnalyticsReport error:', error);
    if (res.headersSent) return;
    return res.status(500).json({
      success: false,
      message: 'Unable to export analytics report',
    });
  }
}
