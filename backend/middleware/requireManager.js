import jwt from 'jsonwebtoken';
import Manager from '../models/Manager.js';

export async function requireManager(req, res, next) {
  try {
    const header = req.headers.authorization;
    const bearerToken =
      header && header.startsWith('Bearer ') ? header.slice(7) : null;
    const token = bearerToken || req.cookies?.manager_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Manager authentication required',
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({
        success: false,
        message: 'Server auth configuration error',
      });
    }

    const decoded = jwt.verify(token, secret);

    if (decoded?.typ !== 'manager' || !decoded?.sub) {
      return res.status(403).json({
        success: false,
        message: 'Manager access required',
      });
    }

    const manager = await Manager.findById(decoded.sub);

    if (!manager) {
      return res.status(401).json({
        success: false,
        message: 'Manager account no longer exists',
      });
    }

    if (!manager.active) {
      return res.status(403).json({
        success: false,
        message: 'This manager account has been deactivated',
      });
    }

    req.manager = manager;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired manager session',
    });
  }
}
