import crypto from 'crypto';
import Manager from '../models/Manager.js';

function serializeManager(manager) {
  return {
    id: manager._id,
    managerId: manager.managerId,
    fullName: manager.fullName,
    email: manager.email || '',
    mobile: manager.mobile || '',
    active: Boolean(manager.active),
    notes: manager.notes || '',
    createdAt: manager.createdAt,
    updatedAt: manager.updatedAt,
  };
}

function normalizeManagerId(value) {
  return String(value || '')
    .trim()
    .toUpperCase();
}

export function generateManagerIdSuggestion() {
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `MGR${suffix}`;
}

export async function listManagers(_req, res) {
  try {
    const managers = await Manager.find()
      .sort({ createdAt: -1 })
      .select('-password')
      .lean();

    return res.json({
      success: true,
      count: managers.length,
      managers: managers.map((manager) => serializeManager(manager)),
    });
  } catch (error) {
    console.error('listManagers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to list managers',
    });
  }
}

export async function getManager(req, res) {
  try {
    const manager = await Manager.findById(req.params.id).select('-password');

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found',
      });
    }

    return res.json({
      success: true,
      manager: serializeManager(manager),
    });
  } catch (error) {
    console.error('getManager error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch manager',
    });
  }
}

export async function createManager(req, res) {
  try {
    const body = req.body || {};
    const managerId = normalizeManagerId(body.managerId);
    const fullName = String(body.fullName || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const mobile = String(body.mobile || '').trim();
    const password = String(body.password || '');
    const notes = String(body.notes || '').trim();
    const active = body.active === undefined ? true : Boolean(body.active);

    if (!managerId) {
      return res.status(400).json({
        success: false,
        message: 'Manager ID is required',
      });
    }

    if (!fullName) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
    }

    const existing = await Manager.findOne({ managerId }).select('_id');
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'This Manager ID is already in use',
      });
    }

    const manager = await Manager.create({
      managerId,
      fullName,
      email,
      mobile,
      password,
      notes,
      active,
    });

    return res.status(201).json({
      success: true,
      manager: serializeManager(manager),
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This Manager ID is already in use',
      });
    }
    if (error?.name === 'ValidationError') {
      const message = Object.values(error.errors || {})
        .map((err) => err.message)
        .join(', ');
      return res.status(400).json({
        success: false,
        message: message || 'Invalid manager details',
      });
    }
    console.error('createManager error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to create manager',
    });
  }
}

export async function updateManager(req, res) {
  try {
    const manager = await Manager.findById(req.params.id).select('+password');

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found',
      });
    }

    const body = req.body || {};

    if (Object.prototype.hasOwnProperty.call(body, 'managerId')) {
      const nextId = normalizeManagerId(body.managerId);
      if (!nextId) {
        return res.status(400).json({
          success: false,
          message: 'Manager ID cannot be empty',
        });
      }
      if (nextId !== manager.managerId) {
        const taken = await Manager.findOne({
          managerId: nextId,
          _id: { $ne: manager._id },
        }).select('_id');
        if (taken) {
          return res.status(400).json({
            success: false,
            message: 'This Manager ID is already in use',
          });
        }
        manager.managerId = nextId;
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, 'fullName')) {
      const fullName = String(body.fullName || '').trim();
      if (!fullName) {
        return res.status(400).json({
          success: false,
          message: 'Full name cannot be empty',
        });
      }
      manager.fullName = fullName;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'email')) {
      manager.email = String(body.email || '').trim().toLowerCase();
    }

    if (Object.prototype.hasOwnProperty.call(body, 'mobile')) {
      manager.mobile = String(body.mobile || '').trim();
    }

    if (Object.prototype.hasOwnProperty.call(body, 'notes')) {
      manager.notes = String(body.notes || '').trim();
    }

    if (Object.prototype.hasOwnProperty.call(body, 'active')) {
      manager.active = Boolean(body.active);
    }

    if (Object.prototype.hasOwnProperty.call(body, 'password')) {
      const password = String(body.password || '');
      if (password) {
        if (password.length < 8) {
          return res.status(400).json({
            success: false,
            message: 'Password must be at least 8 characters',
          });
        }
        manager.password = password;
      }
    }

    await manager.save();

    return res.json({
      success: true,
      manager: serializeManager(manager),
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This Manager ID is already in use',
      });
    }
    if (error?.name === 'ValidationError') {
      const message = Object.values(error.errors || {})
        .map((err) => err.message)
        .join(', ');
      return res.status(400).json({
        success: false,
        message: message || 'Invalid manager details',
      });
    }
    console.error('updateManager error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to update manager',
    });
  }
}

export async function suggestManagerId(_req, res) {
  try {
    let suggestion = generateManagerIdSuggestion();
    // Avoid rare collisions with existing IDs.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const exists = await Manager.findOne({ managerId: suggestion }).select('_id');
      if (!exists) break;
      suggestion = generateManagerIdSuggestion();
    }

    return res.json({
      success: true,
      managerId: suggestion,
    });
  } catch (error) {
    console.error('suggestManagerId error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to generate Manager ID',
    });
  }
}
