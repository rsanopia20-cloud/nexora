function stripSlash(value) {
  return String(value || '').trim().replace(/\/$/, '');
}

function withProtocol(value) {
  const url = stripSlash(value);
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function isLoopback(url) {
  try {
    const { hostname } = new URL(url);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  } catch {
    return true;
  }
}

/**
 * Public origin for /l/{code} tracking links.
 * Skips localhost so admin/dashboard do not show local URLs for codes
 * that were created on the deployed backend.
 */
export function getPublicBaseUrl() {
  const candidates = [
    process.env.TRACKING_BASE_URL,
    process.env.BASE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ];

  for (const raw of candidates) {
    const url = withProtocol(raw);
    if (url && !isLoopback(url)) return url;
  }

  return withProtocol(process.env.BASE_URL) || 'http://localhost:5000';
}

export function buildShortTrackingUrl(code) {
  if (!code) return null;
  return `${getPublicBaseUrl()}/l/${code}`;
}
