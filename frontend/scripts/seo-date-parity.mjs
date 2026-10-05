import { normalizeRoutePath } from './registry-detail-access-policy.mjs';

// These route families already publish a dated main content schema. Requiring
// the field here prevents silently dropping dates from both code and tests.
const DATED_DETAIL = /^\/(?:[^/]+\/(?:coding|debug|trivia)\/[^/]+|(?:system-design|incidents|tradeoffs)\/[^/]+|guides\/(?:interview-blueprint|framework-prep|system-design-blueprint|behavioral)\/[^/]+)$/;
const DATED_LANDINGS = new Set(['/interview-questions/essential', ...['javascript', 'react', 'angular', 'vue', 'html', 'css', 'html-css']
  .map((tech) => `/${tech}/interview-questions`), ...['google', 'openai', 'netflix'].map((slug) => `/companies/${slug}/preview`)]);

export function auditContentDateParity(pages, sitemapDates) {
  const failures = [];
  for (const page of pages) {
    const route = normalizeRoutePath(page.route);
    if (!sitemapDates.has(route)) continue;
    const expected = sitemapDates.get(route) || '';
    const modified = [];
    const mainModified = [];
    const mainTypes = new Set(['Article', 'TechArticle', 'LearningResource', 'CollectionPage']);
    function visit(value) {
      if (!value || typeof value !== 'object') return;
      if (Object.hasOwn(value, 'dateModified')) {
        modified.push(value.dateModified);
        const types = Array.isArray(value['@type']) ? value['@type'] : [value['@type']];
        const identity = value.url || value.mainEntityOfPage || value['@id'];
        const ownPage = !identity || (typeof identity === 'string' && normalizeRoutePath(identity) === route);
        if (ownPage && types.some((type) => mainTypes.has(type))) mainModified.push(value.dateModified);
      }
      for (const child of Object.values(value)) {
        if (child && typeof child === 'object') visit(child);
      }
    }
    for (const raw of page.jsonLd) {
      try { visit(JSON.parse(raw)); } catch { /* Main metadata audit reports invalid JSON. */ }
    }
    if (expected && (DATED_DETAIL.test(route) || DATED_LANDINGS.has(route)) && !mainModified.length) {
      failures.push({ route, code: 'contentDate', message: 'Dated content schema is missing dateModified.' });
    }
    if (modified.some((date) => !expected || typeof date !== 'string' || date !== `${expected}T00:00:00.000Z`)) {
      failures.push({ route, code: 'contentDate', message: `JSON-LD dateModified differs from sitemap lastmod (${expected || 'pending/unresolved'}).` });
    }
  }
  return failures;
}

export function sitemapDatesFromXml(xml) {
  const dates = new Map();
  for (const [, block] of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1];
    if (loc) dates.set(new URL(loc).pathname, block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] || '');
  }
  return dates;
}
