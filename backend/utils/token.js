import jwt from 'jsonwebtoken';

export function signToken(user) {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  if (!secret) {
    throw new Error('JWT_SECRET is not set in environment variables');
  }

  const userId = user?._id ?? user;

  return jwt.sign({ sub: userId }, secret, { expiresIn });
}

export function setAuthCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production';
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000;

  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: maxAgeMs,
    path: '/',
  });
}

export function clearAuthCookie(res) {
  const isProduction = process.env.NODE_ENV === 'production';

  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  });
}

export function signAdminToken() {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  if (!secret) {
    throw new Error('JWT_SECRET is not set in environment variables');
  }

  return jwt.sign({ typ: 'admin' }, secret, { expiresIn });
}

export function setAdminCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production';
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000;

  res.cookie('admin_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: maxAgeMs,
    path: '/',
  });
}

export function clearAdminCookie(res) {
  const isProduction = process.env.NODE_ENV === 'production';

  res.clearCookie('admin_token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  });
}
