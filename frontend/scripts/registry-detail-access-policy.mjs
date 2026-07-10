const DETAIL_KINDS = new Set(['coding', 'debug', 'trivia']);
const DETAIL_COLLECTIONS = new Set(['system-design', 'incidents', 'tradeoffs']);

export function normalizeAccess(value) {
  return String(value || 'free').trim() === 'premium' ? 'premium' : 'free';
}

export function normalizeRoutePath(value) {
  const raw = String(value || '').trim();
  if (!raw) return '/';
  let pathname = raw;
  if (/^https?:\/\//i.test(raw)) {
    try {
      pathname = new URL(raw).pathname || '/';
    } catch {
      pathname = raw;
    }
  }
  const withSlash = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const stripped = withSlash.split('?')[0].split('#')[0];
  const clean = stripped.replace(/\/+$/, '');
  return clean === '' ? '/' : clean;
}

export function isScopedRegistryDetailRoute(route) {
  const clean = normalizeRoutePath(route);
  const parts = clean.split('/').filter(Boolean);

  if (parts.length === 3 && DETAIL_KINDS.has(parts[1])) {
    return Boolean(parts[0] && parts[2]);
  }

  if (parts.length === 2 && DETAIL_COLLECTIONS.has(parts[0])) {
    return Boolean(parts[1]);
  }

  return false;
}

export function shouldIncludeRegistryDetailInSitemap(route, access) {
  if (!isScopedRegistryDetailRoute(route)) return true;
  return normalizeAccess(access) !== 'premium';
}
