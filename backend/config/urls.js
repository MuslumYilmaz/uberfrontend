const DEFAULT_SERVER_BASE = 'http://localhost:3001';
const DEFAULT_FRONTEND_BASE = 'http://localhost:4200';
const LOCAL_DEV_FRONTEND_ORIGINS = [
  'http://localhost:4200',
  'http://127.0.0.1:4200',
  'http://localhost:4310',
  'http://127.0.0.1:4310',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];

function hasScheme(value) {
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(value);
}

function normalizeBaseUrl(value, fallback) {
  const raw = String(value || '').trim();
  const candidate = raw || String(fallback || '').trim();
  if (!candidate) return '';

  const withScheme = hasScheme(candidate) ? candidate : `https://${candidate}`;
  const trimmed = withScheme.replace(/\/+$/, '');

  try {
    const url = new URL(trimmed);
    const path = url.pathname.replace(/\/+$/, '');
    return `${url.origin}${path}`;
  } catch {
    return trimmed;
  }
}

function normalizeOrigin(value, fallback) {
  const base = normalizeBaseUrl(value, fallback);
  if (!base) return '';
  try {
    return new URL(base).origin;
  } catch {
    return base.replace(/\/+$/, '');
  }
}

function resolveServerBase() {
  return normalizeBaseUrl(process.env.SERVER_BASE, DEFAULT_SERVER_BASE);
}

function resolveFrontendBase() {
  return normalizeBaseUrl(process.env.FRONTEND_BASE, DEFAULT_FRONTEND_BASE);
}

function isProductionRuntime() {
  return String(process.env.NODE_ENV || '').trim().toLowerCase() === 'production';
}

function resolveAllowedFrontendOrigins() {
  const raw = String(process.env.FRONTEND_ORIGINS || '').trim();
  const list = raw
    ? raw.split(',').map((entry) => entry.trim()).filter(Boolean)
    : [];

  const fallbackOrigin = normalizeOrigin(process.env.FRONTEND_ORIGIN, resolveFrontendBase());
  if (!list.length && fallbackOrigin) list.push(fallbackOrigin);

  const normalized = list.map((entry) => normalizeOrigin(entry)).filter(Boolean);
  if (!isProductionRuntime()) {
    normalized.push(...LOCAL_DEV_FRONTEND_ORIGINS);
  }
  return Array.from(new Set(normalized));
}

module.exports = {
  normalizeBaseUrl,
  normalizeOrigin,
  resolveServerBase,
  resolveFrontendBase,
  resolveAllowedFrontendOrigins,
};
