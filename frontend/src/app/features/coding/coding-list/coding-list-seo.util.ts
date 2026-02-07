import { SeoMeta } from '../../../core/services/seo.service';

const QUERY_PARAM_INDEX_BLOCKLIST = new Set([
  'q',
  'tech',
  'kind',
  'view',
  'category',
  'diff',
  'imp',
  'topic',
  'focus',
  'reset',
]);

export function hasIndexingSensitiveQueryParams(keys: string[]): boolean {
  if (!Array.isArray(keys) || keys.length === 0) return false;
  return keys.some((key) => {
    const normalized = String(key || '').trim().toLowerCase();
    if (!normalized) return false;
    if (QUERY_PARAM_INDEX_BLOCKLIST.has(normalized)) return true;
    // Keep all query variants out of index, even if key is not in the known filter set.
    return true;
  });
}

export function buildCodingListSeoMeta(baseSeo: SeoMeta, queryKeys: string[]): SeoMeta {
  if (!hasIndexingSensitiveQueryParams(queryKeys)) {
    return {
      ...baseSeo,
      canonical: '/coding',
    };
  }

  return {
    ...baseSeo,
    robots: 'noindex,follow',
    canonical: '/coding',
  };
}
