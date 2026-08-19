import mongoose from 'mongoose';
import Link, { LINK_SORT } from '../models/Link.js';
import ClickEvent from '../models/ClickEvent.js';
import LinkUsage from '../models/LinkUsage.js';
import TrackingCode from '../models/TrackingCode.js';

export async function createLink(req, res) {
  try {
    const { name, destination } = req.body;

    if (!name?.trim() || !destination?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'name and destination are required',
      });
    }

    const last = await Link.findOne().sort({ sortOrder: -1 }).select('sortOrder').lean();
    const sortOrder = Number.isFinite(last?.sortOrder)
      ? last.sortOrder + 1
      : await Link.countDocuments();

    const link = await Link.create({
      name: name.trim(),
      destination: destination.trim(),
      active: true,
      sortOrder,
    });

    return res.status(201).json({
      success: true,
      link,
    });
  } catch (error) {
    console.error('createLink error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to create link',
    });
  }
}

export async function getAllLinks(req, res) {
  try {
    const filter = {};

    if (req.query.active === 'true') {
      filter.active = true;
    } else if (req.query.active === 'false') {
      filter.active = false;
    }

    const links = await Link.find(filter).sort(LINK_SORT);

    return res.json({
      success: true,
      count: links.length,
      links,
    });
  } catch (error) {
    console.error('getAllLinks error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch links',
    });
  }
}

/**
 * PUT /api/admin/links/reorder
 * Saves the admin list order. WhatsApp and user dashboards use this order.
 */
export async function reorderLinks(req, res) {
  try {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'orderedIds array is required',
      });
    }

    const uniqueIds = [...new Set(orderedIds.map(String))];
    if (uniqueIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid link id',
      });
    }

    const existing = await Link.find({ _id: { $in: uniqueIds } }).select('_id');
    if (existing.length !== uniqueIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more links were not found',
      });
    }

    await Promise.all(
      uniqueIds.map((id, index) =>
        Link.updateOne({ _id: id }, { $set: { sortOrder: index } })
      )
    );

    const leftovers = await Link.find({ _id: { $nin: uniqueIds } }).sort(LINK_SORT);
    await Promise.all(
      leftovers.map((link, index) =>
        Link.updateOne(
          { _id: link._id },
          { $set: { sortOrder: uniqueIds.length + index } }
        )
      )
    );

    return res.json({
      success: true,
      message: 'Link order saved',
    });
  } catch (error) {
    console.error('reorderLinks error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to save link order',
    });
  }
}

/**
 * GET /api/links — authenticated user dashboard listing.
 * Returns only active links with display fields (real destination URLs).
 */
export async function getActiveLinksForUser(req, res) {
  try {
    const links = await Link.find({ active: true })
      .select('_id name destination')
      .sort(LINK_SORT)
      .lean();

    return res.json({
      success: true,
      count: links.length,
      links,
    });
  } catch (error) {
    console.error('getActiveLinksForUser error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch links',
    });
  }
}

export async function updateLink(req, res) {
  try {
    const { id } = req.params;
    const updates = {};

    if (req.body.name !== undefined) {
      updates.name = String(req.body.name).trim();
    }
    if (req.body.destination !== undefined) {
      updates.destination = String(req.body.destination).trim();
    }
    if (req.body.active !== undefined) {
      updates.active = Boolean(req.body.active);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Provide at least one of: name, destination, active',
      });
    }

    const link = await Link.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Link not found',
      });
    }

    return res.json({
      success: true,
      link,
    });
  } catch (error) {
    console.error('updateLink error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to update link',
    });
  }
}

export async function deleteLink(req, res) {
  try {
    const { id } = req.params;

    // Soft delete: set active: false instead of removing the document.
    // Historical ClickEvent / LinkUsage rows still reference this linkId;
    // keeping the Link row preserves meaningful analytics joins later.
    const link = await Link.findByIdAndUpdate(
      id,
      { active: false },
      { new: true }
    );

    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Link not found',
      });
    }

    return res.json({
      success: true,
      message: 'Link deactivated (soft delete)',
      link,
    });
  } catch (error) {
    console.error('deleteLink error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to delete link',
    });
  }
}

/**
 * Permanently delete a link and its related tracking/click records.
 * Use after soft-remove when admin wants to wipe it completely.
 */
export async function permanentDeleteLink(req, res) {
  try {
    const { id } = req.params;

    const link = await Link.findById(id);
    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Link not found',
      });
    }

    await Promise.all([
      TrackingCode.deleteMany({ linkId: id }),
      ClickEvent.deleteMany({ linkId: id }),
      LinkUsage.deleteMany({ linkId: id }),
      Link.findByIdAndDelete(id),
    ]);

    return res.json({
      success: true,
      message: 'Link permanently deleted',
      deletedLinkId: id,
    });
  } catch (error) {
    console.error('permanentDeleteLink error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to permanently delete link',
    });
  }
}
