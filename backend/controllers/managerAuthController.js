import Manager from '../models/Manager.js';
import {
  clearManagerCookie,
  setManagerCookie,
  signManagerToken,
} from '../utils/token.js';

function serializeManager(manager) {
  return {
    id: manager._id,
    managerId: manager.managerId,
    fullName: manager.fullName,
    email: manager.email || '',
    mobile: manager.mobile || '',
    active: Boolean(manager.active),
  };
}

export async function managerLogin(req, res) {
  try {
    const managerId = String(req.body?.managerId || '')
      .trim()
      .toUpperCase();
    const password = String(req.body?.password || '');

    if (!managerId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Manager ID and password are required',
      });
    }

    const manager = await Manager.findOne({ managerId }).select('+password');

    if (!manager) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Manager ID or password',
      });
    }

    if (!manager.active) {
      return res.status(403).json({
        success: false,
        message: 'This manager account has been deactivated. Contact admin.',
      });
    }

    const passwordOk = await manager.comparePassword(password);
    if (!passwordOk) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Manager ID or password',
      });
    }

    const token = signManagerToken(manager);
    setManagerCookie(res, token);

    return res.json({
      success: true,
      token,
      manager: serializeManager(manager),
      message: 'Logged in successfully',
    });
  } catch (error) {
    console.error('managerLogin error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to log in',
    });
  }
}

export async function managerLogout(_req, res) {
  clearManagerCookie(res);
  return res.json({
    success: true,
    message: 'Logged out successfully',
  });
}

export async function managerMe(req, res) {
  return res.json({
    success: true,
    manager: serializeManager(req.manager),
  });
}
