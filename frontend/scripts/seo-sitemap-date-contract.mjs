import { sitemapDatesFromXml } from './seo-date-parity.mjs';

/** Read the tested deployment's sitemap, including child maps, via its own origin. */
export async function loadSitemapDateMap(baseUrl, fetchText, canonicalBase = 'https://frontendatlas.com') {
  const dates = new Map();
  const visited = new Set();
  const canonicalOrigin = new URL(canonicalBase).origin;
  async function read(route) {
    if (visited.has(route)) return;
    visited.add(route);
    const xml = await fetchText(new URL(route, baseUrl).href);
    if (/<sitemapindex\b/.test(xml)) {
      const children = [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)];
      if (!children.length) throw new Error(`Empty sitemap index: ${route}`);
      for (const [, loc] of children) {
        const child = new URL(loc.trim().replace(/&amp;/g, '&'));
        if (child.origin !== canonicalOrigin || child.search || child.hash) {
          throw new Error(`Unexpected sitemap child: ${loc}`);
        }
        await read(child.pathname);
      }
    } else if (/<urlset\b/.test(xml)) {
      for (const [path, day] of sitemapDatesFromXml(xml)) {
        if (dates.has(path)) throw new Error(`Duplicate sitemap route: ${path}`);
        if (day && (!/^\d{4}-\d{2}-\d{2}$/.test(day)
          || !Number.isFinite(Date.parse(`${day}T00:00:00.000Z`))
          || new Date(`${day}T00:00:00.000Z`).toISOString().slice(0, 10) !== day)) {
          throw new Error(`Invalid sitemap lastmod for ${path}: ${day}`);
        }
        dates.set(path, day);
      }
    } else {
      throw new Error(`Expected sitemap XML at ${route}`);
    }
  }
  await read('/sitemap.xml');
  if (!dates.size) throw new Error('Sitemap contains no page URLs');
  return dates;
}

export function schemaDateMatchesSitemap(schema, route, dates) {
  if (!schema || !dates.has(route)) return false;
  const day = dates.get(route);
  return day
    ? schema.dateModified === `${day}T00:00:00.000Z`
    : !Object.prototype.hasOwnProperty.call(schema, 'dateModified');
}
