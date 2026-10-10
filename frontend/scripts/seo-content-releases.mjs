// Shared template releases that changed what crawlers see on a whole family of
// per-entry pages without touching the entries themselves. Per-entry dating
// ignores shared files on purpose (see seo-content-inventory.mjs), so each such
// release is recorded here once, with the day it went live and the public routes
// it affected. Dates only move forward: a route edited after the release keeps
// its own later date, and routes without a resolved date stay undated.
export const SHARED_CONTENT_RELEASES = Object.freeze([
  {
    day: '2026-10-05',
    routes: /^\/(?:javascript|react|angular|vue|html|css)\/(?:coding|debug)\/[^/]+$/,
    reason: 'Public coding and debug pages began to prerender their complete solution source (f9d4d4ac).',
  },
]);

const DAY = /^\d{4}-\d{2}-\d{2}$/;

function validDay(value, today) {
  return DAY.test(value) && !Number.isNaN(Date.parse(value))
    && new Date(value).toISOString().slice(0, 10) === value && value <= today;
}

export function applySharedContentReleases(report, releases = SHARED_CONTENT_RELEASES, now = new Date()) {
  const today = new Date(now).toISOString().slice(0, 10);
  for (const release of releases) {
    if (!validDay(release.day, today) || !(release.routes instanceof RegExp) || !release.reason) {
      throw new Error(`[seo-releases] Invalid shared content release: ${JSON.stringify(release.day)}`);
    }
    for (const [route, entry] of Object.entries(report.routes)) {
      if (!entry.lastmod || entry.lastmod >= release.day || !release.routes.test(route)) continue;
      entry.lastmod = release.day;
      entry.sharedRelease = release.reason;
    }
  }
  return report;
}
