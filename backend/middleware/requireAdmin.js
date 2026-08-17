import jwt from 'jsonwebtoken';

export function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization;
    const bearerToken =
      header && header.startsWith('Bearer ') ? header.slice(7) : null;
    const token = bearerToken || req.cookies?.admin_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required',
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

    if (decoded?.typ !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    req.admin = true;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired admin session',
    });
  }
}
