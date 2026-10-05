import { SEO_CONTENT_DATES } from '../../generated/seo-content-dates';

const CANONICAL_ORIGIN = 'https://frontendatlas.com';

/** Uses the same verified content dates as the sitemap; unresolved dates stay absent. */
export function seoContentDateModified(
  canonical: string,
  dates: Readonly<Record<string, string>> = SEO_CONTENT_DATES,
): string | undefined {
  try {
    const url = new URL(canonical, CANONICAL_ORIGIN);
    if (url.origin !== CANONICAL_ORIGIN) return undefined;
    const route = url.pathname.replace(/\/+$/, '') || '/';
    if (!Object.prototype.hasOwnProperty.call(dates, route)) return undefined;
    const day = dates[route];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return undefined;
    const date = new Date(`${day}T00:00:00.000Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== day) return undefined;
    return date.toISOString();
  } catch {
    return undefined;
  }
}
