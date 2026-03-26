export function normalizePathname(url: string | null | undefined): string {
  const raw = String(url || '/').trim() || '/';
  const path = raw.split('?')[0]?.split('#')[0] || '/';
  return path === '' ? '/' : path;
}

export function isMarketingPath(url: string | null | undefined): boolean {
  const path = normalizePathname(url);
  return path === '/' || path === '/showcase';
}
