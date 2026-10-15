import type { CompanyReportedItem, CompanyReportsPayload, CompanyReportSource } from '../models/company-public.model';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const KINDS = new Set(['coding', 'debug', 'system-design']);
const TECHS = new Set(['javascript', 'react', 'angular', 'vue', 'css', 'html']);
const HTTPS_RE = /^https:\/\//i;

export function emptyCompanyReports(): CompanyReportsPayload {
  return { schemaVersion: 1, companies: {} };
}

function normalizeSource(value: unknown): CompanyReportSource | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const label = typeof record['label'] === 'string' ? record['label'].trim() : '';
  const url = typeof record['url'] === 'string' ? record['url'].trim() : '';
  if (!label || !HTTPS_RE.test(url)) return null;
  return {
    label,
    url,
    publisher: typeof record['publisher'] === 'string' ? record['publisher'].trim() : '',
    date: typeof record['date'] === 'string' ? record['date'].trim() : '',
  };
}

function normalizeItem(value: unknown): CompanyReportedItem | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const id = typeof record['id'] === 'string' ? record['id'].trim() : '';
  const kind = typeof record['kind'] === 'string' ? record['kind'] : '';
  const route = typeof record['route'] === 'string' ? record['route'].trim() : '';
  const title = typeof record['title'] === 'string' ? record['title'].trim() : '';
  if (!id || !KINDS.has(kind) || !route.startsWith('/') || !title) return null;
  const sources = Array.isArray(record['sources']) ? record['sources'].map(normalizeSource).filter((s): s is CompanyReportSource => !!s) : [];
  if (!sources.length) return null;
  const tech = typeof record['tech'] === 'string' && TECHS.has(record['tech']) ? record['tech'] as CompanyReportedItem['tech'] : undefined;
  return {
    id,
    kind: kind as CompanyReportedItem['kind'],
    ...(tech ? { tech } : {}),
    title,
    access: record['access'] === 'free' ? 'free' : 'premium',
    route,
    sources,
  };
}

/** Keeps well-formed entries only; a broken file degrades to an empty index instead of breaking the page. */
export function normalizeCompanyReports(raw: unknown): CompanyReportsPayload {
  if (!raw || typeof raw !== 'object') return emptyCompanyReports();
  const companies = (raw as Record<string, unknown>)['companies'];
  if (!companies || typeof companies !== 'object') return emptyCompanyReports();
  const out: Record<string, CompanyReportedItem[]> = {};
  for (const [slug, items] of Object.entries(companies as Record<string, unknown>)) {
    if (!SLUG_RE.test(slug) || !Array.isArray(items)) continue;
    const normalized = items.map(normalizeItem).filter((item): item is CompanyReportedItem => !!item);
    if (normalized.length) out[slug] = normalized;
  }
  return { schemaVersion: 1, companies: out };
}
