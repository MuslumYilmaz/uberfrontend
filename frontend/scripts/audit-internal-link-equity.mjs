#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'parse5';
import { cdnPracticeRegistryPath, cdnQuestionsDir, frontendRoot } from './content-paths.mjs';
import { buildFrameworkFamilyByIdMap, collectCompanyCounts } from './gen-showcase-stats.mjs';
import { shouldIncludeRegistryDetailInSitemap } from './registry-detail-access-policy.mjs';
import { createRobotsPolicy } from './internal-link-robots.mjs';

const TECHS = ['javascript', 'angular', 'react', 'vue', 'html', 'css'];
const QUESTION_ROUTE = /^\/(javascript|angular|react|vue|html|css)\/(coding|trivia|debug)\/[^/]+$/;
const AUTHORED_COMPANIES = new Set(['google', 'openai', 'netflix']);
export const CRITICAL_HUBS = [
  '/interview-questions', '/interview-questions/essential', '/machine-coding', '/coding',
  '/system-design', '/guides/system-design-blueprint', '/tracks', '/companies',
  '/guides/interview-blueprint/intro', '/guides/framework-prep', '/tradeoffs', '/incidents',
  ...TECHS.map((tech) => `/${tech}/interview-questions`), '/html-css/interview-questions',
];
const cleanPath = (value) => value.replace(/\/+$/, '') || '/';
const tokens = (value = '') => value.toLowerCase().split(/[\s,]+/).filter(Boolean);
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const sorted = (values) => [...values].sort();

function collectHtmlFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectHtmlFiles(full, out);
    else if (entry.isFile() && entry.name === 'index.html') out.push(full);
  }
  return out;
}
function internalUrl(href, baseUrl, canonicalBase) {
  try {
    const url = new URL(href, baseUrl);
    return /^https?:$/.test(url.protocol) && url.origin === canonicalBase ? url : null;
  } catch { return null; }
}

// Parse actual HTML: scripts, comments and template contents are not links.
// Closed <details> contents are traversed because those links exist in initial HTML.
export function parsePage(html, route, canonicalBase) {
  const anchors = [], canonicals = [], directives = [], testIds = new Set();
  let baseUrl = `${canonicalBase}${route}`, hasBase = false, companyCounts = '', companyTotal = null;
  const textContent = (node) => node.nodeName === '#text' ? node.value : (node.childNodes || []).map(textContent).join('');
  const visit = (node, context = {}) => {
    const attrs = Object.fromEntries((node.attrs || []).map(({ name, value }) => [name, value]));
    if (attrs['data-testid']) testIds.add(attrs['data-testid']);
    if (attrs['data-testid'] === 'company-preview-counts') companyCounts = textContent(node).replace(/\s+/g, ' ').trim();
    if (tokens(attrs.class).includes('preview-chip')) {
      const total = textContent(node).match(/^(\d+) editorial practice prompts?$/);
      if (total) companyTotal = Number(total[1]);
    }
    if (node.tagName === 'base' && attrs.href && !hasBase) {
      try { baseUrl = new URL(attrs.href, baseUrl).href; } catch { /* Invalid base is ignored. */ }
      hasBase = true;
    }
    if (node.tagName === 'link' && tokens(attrs.rel).includes('canonical')) {
      try { canonicals.push(new URL(attrs.href, baseUrl).href); } catch { canonicals.push(''); }
    }
    if (node.tagName === 'meta' && ['robots', 'googlebot'].includes((attrs.name || '').toLowerCase())) directives.push(...tokens(attrs.content));
    const navigation = context.navigation || ['nav', 'header', 'footer', 'aside'].includes(node.tagName)
      || ['sidebar', 'mobile_nav'].includes(attrs['data-trivia-link-zone'])
      || ['navigation', 'banner', 'contentinfo', 'complementary'].includes(attrs.role);
    const directory = context.directory || attrs['data-testid'] === 'public-question-directory';
    const companyIndex = context.companyIndex || attrs['data-testid'] === 'company-index-list';
    if (node.tagName === 'a' && attrs.href?.trim() && !attrs.href.trim().startsWith('#')) {
      const url = internalUrl(attrs.href, baseUrl, canonicalBase);
      if (url) anchors.push({ rawHref: attrs.href, pathname: url.pathname, route: cleanPath(url.pathname),
        pathWithQuery: `${url.pathname}${url.search}`, query: url.search, fragment: url.hash,
        follow: !tokens(attrs.rel).some((rel) => ['nofollow', 'sponsored', 'ugc'].includes(rel)),
        zone: navigation ? 'navigation' : 'content', directory: Boolean(directory), companyIndex: Boolean(companyIndex),
        companyCount: companyIndex ? Number(textContent(node).match(/(\d+)\s+editorial practice prompts?/)?.[1] ?? NaN) : null });
    }
    for (const child of node.childNodes || []) visit(child, { navigation, directory, companyIndex });
  };
  visit(parse(html));
  const canonical = canonicals.length === 1 ? canonicals[0] : null;
  return { route, anchors, testIds, companyCounts, companyTotal, canonical, canonicalCount: canonicals.length,
    indexable: !directives.some((value) => ['noindex', 'none'].includes(value)),
    follow: !directives.some((value) => ['nofollow', 'none'].includes(value)),
    selfCanonical: canonical === `${canonicalBase}${route}` };
}

function readSitemap(buildDir, canonicalBase) {
  const routes = new Set(), visited = new Set();
  const read = (file) => {
    if (visited.has(file)) return;
    visited.add(file);
    const xml = fs.readFileSync(file, 'utf8');
    const isIndex = /<sitemapindex\b/.test(xml);
    for (const match of xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)) {
      const href = match[1].trim().replace(/&amp;/g, '&');
      const url = internalUrl(href, canonicalBase, canonicalBase);
      if (!url) throw new Error(`Sitemap contains a URL outside ${canonicalBase}: ${href}`);
      if (isIndex) {
        const child = path.resolve(buildDir, `.${url.pathname}`);
        if (!child.startsWith(`${path.resolve(buildDir)}${path.sep}`)) throw new Error('Invalid sitemap path');
        read(child);
      } else {
        if (url.search || url.hash || cleanPath(url.pathname) !== url.pathname) throw new Error(`Sitemap URL must be canonical and clean: ${href}`);
        routes.add(url.pathname);
      }
    }
  };
  const index = path.join(buildDir, 'sitemap-index.xml');
  read(fs.existsSync(index) ? index : path.join(buildDir, 'sitemap.xml'));
  if (!routes.size) throw new Error('Sitemap contains no URLs');
  return routes;
}

function companyExpectations(questionsDir, slugs) {
  const load = (file) => fs.existsSync(file) ? readJson(file) : [];
  const lists = [
    ...['coding', 'trivia'].map((kind) => ({ kind, limit: 3, items: TECHS.flatMap((tech) => load(path.join(questionsDir, tech, `${kind}.json`))
      .sort((a, b) => Number(b.importance ?? 0) - Number(a.importance ?? 0) || (a.title || '').localeCompare(b.title || ''))
      .map((q) => ({ ...q, tech }))) })),
    { kind: 'system-design', limit: 2, items: load(path.join(questionsDir, 'system-design', 'index.json')) },
  ];
  const families = buildFrameworkFamilyByIdMap(fs.readFileSync(path.join(frontendRoot, 'src/app/shared/framework-families.ts'), 'utf8'));
  const counts = collectCompanyCounts(Object.fromEntries(lists.map(({ kind, items }) => [kind === 'system-design' ? 'system' : kind, items])), families);
  const samples = new Map(slugs.map((slug) => {
    const matches = lists.map((list) => ({ ...list, items: list.items.filter((q) => (q.companies || []).some((company) => String(company).trim().toLowerCase() === slug)) }));
    const keys = new Set(matches.flatMap(({ kind, items }) => items.map((q) => `${kind}:${q.tech || 'none'}:${q.id}`)));
    return [slug, { count: Math.min(8, keys.size), requiredIds: new Set(matches.flatMap(({ limit, items }) => items.slice(0, limit).map((q) => q.id))) }];
  }));
  return { counts, samples };
}
function increment(map, target, source) {
  if (!map.has(target)) map.set(target, new Set());
  map.get(target).add(source);
}
function shortestDistances(graph) {
  const distance = new Map();
  if (!graph.has('/')) return distance;
  const queue = ['/'];
  distance.set('/', 0);
  for (let i = 0; i < queue.length; i++) for (const target of graph.get(queue[i]) || []) {
    if (distance.has(target)) continue;
    distance.set(target, distance.get(queue[i]) + 1);
    queue.push(target);
  }
  return distance;
}

/** Static discovery audit; this does not reproduce Google's rendered graph. */
export function auditBuild({ buildDir, canonicalBase = 'https://frontendatlas.com', registry = readJson(cdnPracticeRegistryPath),
  questionsDir = cdnQuestionsDir, criticalHubs = CRITICAL_HUBS, companySamples, companyCounts } = {}) {
  canonicalBase = canonicalBase.replace(/\/+$/, '');
  const sitemap = readSitemap(buildDir, canonicalBase);
  const robotsAllows = createRobotsPolicy(fs.readFileSync(path.join(buildDir, 'robots.txt'), 'utf8'));
  const failures = new Set(), warnings = new Set();
  const pages = new Map(collectHtmlFiles(buildDir).map((file) => {
    const rel = path.relative(buildDir, path.dirname(file)).replace(/\\/g, '/'), route = rel ? `/${rel}` : '/';
    return [route, parsePage(fs.readFileSync(file, 'utf8'), route, canonicalBase)];
  }));
  const nodes = new Map([...pages].filter(([route, page]) => page.selfCanonical && page.indexable && robotsAllows(route)));
  for (const route of sitemap) {
    const page = pages.get(route);
    if (!page) failures.add(`Missing prerendered sitemap page: ${route}`);
    else {
      if (!page.indexable) failures.add(`Sitemap page is noindex: ${route}`);
      if (!page.selfCanonical) failures.add(`Sitemap page has invalid canonical: ${route} -> ${page.canonical || `(count=${page.canonicalCount})`}`);
    }
    if (!robotsAllows(route)) failures.add(`Sitemap page is blocked by robots: ${route}`);
  }
  if (!nodes.has('/')) failures.add('Homepage must be an indexable, crawlable canonical page');
  const graph = new Map([...nodes.keys()].map((route) => [route, new Set()]));
  const incoming = new Map(), contentIncoming = new Map(), navigationIncoming = new Map(), rawCounts = new Map(), rawSources = new Map();
  const queryLinks = [], blockedPublicLinks = [], aliasLinks = [], legitimateNonPublicLinks = [], otherNonPublicLinks = [];
  const premiumRoutes = new Set(registry.filter((q) => !shouldIncludeRegistryDetailInSitemap(q.route, q.access)).map((q) => q.route));
  const isPrivate = (route) => premiumRoutes.has(route) || /^\/(auth(?:\/|$)|dashboard(?:\/|$)|profile(?:\/|$)|admin(?:\/|$))/.test(route)
    || /^\/(companies|tracks)\/[^/]+(?:\/(?!preview(?:$|[/?])).*)?$/.test(route);
  for (const [source, page] of pages) for (const anchor of page.anchors) {
    rawCounts.set(anchor.route, (rawCounts.get(anchor.route) || 0) + 1);
    increment(rawSources, anchor.route, source);
    if (!nodes.has(source) || (anchor.route === source && !anchor.query)) continue;
    const targetPage = pages.get(anchor.route);
    const canonicalTarget = targetPage?.canonical && internalUrl(targetPage.canonical, canonicalBase, canonicalBase);
    const isPublic = sitemap.has(anchor.route) || nodes.has(anchor.route)
      || (canonicalTarget && sitemap.has(cleanPath(canonicalTarget.pathname)) && !isPrivate(anchor.route));
    const reference = { source, target: anchor.route, rawHref: anchor.rawHref, zone: anchor.zone };
    if (anchor.query && isPublic) queryLinks.push(reference);
    if (!isPublic) { (isPrivate(anchor.route) ? legitimateNonPublicLinks : otherNonPublicLinks).push(reference); continue; }
    if (!robotsAllows(anchor.pathWithQuery)) {
      blockedPublicLinks.push(reference);
      failures.add(`Public link blocked by robots: ${source} -> ${anchor.rawHref}`);
      continue;
    }
    if (canonicalTarget && canonicalTarget.href !== `${canonicalBase}${anchor.pathname}`) {
      aliasLinks.push({ ...reference, canonical: targetPage.canonical });
      failures.add(`Public link points to canonical alias: ${source} -> ${anchor.rawHref} (canonical ${targetPage.canonical})`);
      continue;
    }
    // A filtered/tracking URL is observable, but cannot conceal a missing clean URL.
    if (!anchor.follow || !page.follow || anchor.query || anchor.pathname !== anchor.route
      || anchor.route === source || !nodes.has(anchor.route)) continue;
    graph.get(source).add(anchor.route);
    increment(incoming, anchor.route, source);
    increment(anchor.zone === 'navigation' ? navigationIncoming : contentIncoming, anchor.route, source);
  }
  const distances = shortestDistances(graph);
  const orphanRoutes = sorted([...sitemap].filter((route) => route !== '/' && !(incoming.get(route)?.size)));
  const unreachableRoutes = sorted([...sitemap].filter((route) => !distances.has(route)));
  orphanRoutes.forEach((route) => failures.add(`Orphan sitemap page: ${route}`));
  unreachableRoutes.forEach((route) => failures.add(`Unreachable sitemap page from /: ${route}`));
  for (const hub of criticalHubs) if (sitemap.has(hub) && (distances.get(hub) ?? Infinity) > 2)
    failures.add(`Critical hub exceeds depth 2: ${hub} (depth=${distances.get(hub) ?? 'unreachable'})`);
  const directoryCoverage = [];
  const publicQuestions = registry.filter((q) => QUESTION_ROUTE.test(q.route) && shouldIncludeRegistryDetailInSitemap(q.route, q.access));
  for (const tech of TECHS) {
    const expected = new Set(publicQuestions.filter((q) => q.tech === tech).map((q) => q.route));
    if (!expected.size) continue;
    const hub = `/${tech}/interview-questions`;
    const actual = new Set((pages.get(hub)?.anchors || []).filter((a) => a.directory && a.follow && !a.query && a.pathname === a.route).map((a) => a.route));
    const missing = sorted([...expected].filter((route) => !actual.has(route))), unexpected = sorted([...actual].filter((route) => !expected.has(route)));
    directoryCoverage.push({ hub, expected: expected.size, linked: actual.size, missing, unexpected });
    if (missing.length) failures.add(`Public question directory incomplete: ${hub} (${missing.length} missing: ${missing.join(', ')})`);
    if (unexpected.length) failures.add(`Public question directory contains non-public or unrelated targets: ${hub} -> ${unexpected.join(', ')}`);
    for (const route of expected) {
      if (!sitemap.has(route)) failures.add(`Public registry question is absent from sitemap: ${route}`);
      if ((distances.get(route) ?? Infinity) > 3) failures.add(`Public question exceeds depth 3: ${route} (depth=${distances.get(route) ?? 'unreachable'})`);
    }
  }
  const companyRoutes = sorted([...sitemap].filter((route) => /^\/companies\/[^/]+\/preview$/.test(route)));
  const companyIndexLinks = new Map((pages.get('/companies')?.anchors || []).filter((a) => a.companyIndex && a.follow && !a.query).map((a) => [a.route, a]));
  const genericSlugs = companyRoutes.map((route) => route.split('/')[2]).filter((slug) => !AUTHORED_COMPANIES.has(slug));
  const expectedCompanies = companyRoutes.length ? companyExpectations(questionsDir, genericSlugs) : { counts: {}, samples: new Map() };
  const expectedSamples = companySamples ?? expectedCompanies.samples;
  const expectedCounts = companyCounts ?? expectedCompanies.counts;
  const companyCoverage = [], companyIndexCoverage = [];
  for (const route of companyRoutes) {
    if (!companyIndexLinks.has(route)) failures.add(`Company directory missing initial-HTML link: /companies -> ${route}`);
    const slug = route.split('/')[2];
    const counts = expectedCounts[slug];
    const actualTotal = companyIndexLinks.get(route)?.companyCount;
    companyIndexCoverage.push({ route, expectedTotal: counts?.all ?? null, actualTotal: actualTotal ?? null });
    if (!counts || actualTotal !== counts.all) failures.add(`Company directory count mismatch: ${route} (expected=${counts?.all ?? 'missing catalog'}, actual=${actualTotal ?? 'missing'})`);
    if (AUTHORED_COMPANIES.has(slug)) continue;
    const ids = pages.get(route)?.testIds || new Set();
    const sampleIds = new Set([...ids].filter((id) => id.startsWith('company-preview-question-')).map((id) => id.slice('company-preview-question-'.length)));
    const expected = expectedSamples.get(slug) ?? { count: 0, requiredIds: new Set() };
    const missing = sorted([...expected.requiredIds].filter((id) => !sampleIds.has(id)));
    const buckets = pages.get(route)?.companyCounts.match(/Coding (\d+)\s*·\s*Concepts (\d+)\s*·\s*System (\d+)/);
    const actualCounts = buckets ? { coding: Number(buckets[1]), trivia: Number(buckets[2]), system: Number(buckets[3]), all: pages.get(route).companyTotal } : null;
    companyCoverage.push({ route, expectedSamples: expected.count, actualSamples: sampleIds.size, missing, expectedCounts: counts, actualCounts });
    if (sampleIds.size !== expected.count || missing.length) failures.add(`Company preview missing or unexpected initial-HTML samples: ${route} (expected=${expected.count}, actual=${sampleIds.size}, missing=${missing.join(', ')})`);
    if (!actualCounts) failures.add(`Company preview missing initial-HTML counts: ${route}`);
    else if (!counts || ['all', 'coding', 'trivia', 'system'].some((kind) => actualCounts[kind] !== counts[kind]))
      failures.add(`Company preview count mismatch: ${route} (expected=${JSON.stringify(counts)}, actual=${JSON.stringify(actualCounts)})`);
  }
  const depths = [...sitemap].map((route) => ({ route, depth: distances.get(route) ?? null, incomingSources: incoming.get(route)?.size || 0,
    contentSources: contentIncoming.get(route)?.size || 0, navigationSources: navigationIncoming.get(route)?.size || 0 })).sort((a, b) => a.route.localeCompare(b.route));
  const deepRoutes = depths.filter(({ depth }) => depth !== null && depth > 3);
  if (deepRoutes.length) warnings.add(`${deepRoutes.length} sitemap pages have depth > 3`);
  if (queryLinks.length) warnings.add(`${queryLinks.length} public query links are informational; they do not count as clean canonical graph edges`);
  const targets = [...rawCounts].map(([route, rawAnchors]) => ({ route, rawAnchors, rawSources: rawSources.get(route)?.size || 0,
    uniqueSources: incoming.get(route)?.size || 0, contentSources: contentIncoming.get(route)?.size || 0, navigationSources: navigationIncoming.get(route)?.size || 0
  })).sort((a, b) => b.uniqueSources - a.uniqueSources || b.rawAnchors - a.rawAnchors || a.route.localeCompare(b.route));
  return { summary: { htmlPages: pages.size, canonicalIndexablePages: nodes.size, sitemapPages: sitemap.size,
    orphanPages: orphanRoutes.length, unreachablePages: unreachableRoutes.length, maxReachableDepth: Math.max(0, ...depths.map(({ depth }) => depth ?? 0)),
    uniqueEdges: [...graph.values()].reduce((total, links) => total + links.size, 0), publicQuestions: publicQuestions.length },
    failures: sorted(failures), warnings: sorted(warnings), orphanRoutes, unreachableRoutes, depths, deepRoutes, targets, directoryCoverage, companyCoverage, companyIndexCoverage,
    queryLinks, blockedPublicLinks, aliasLinks, legitimateNonPublicLinks, otherNonPublicLinks,
    excludedSources: sorted([...pages.keys()].filter((route) => !nodes.has(route))) };
}
function readNumberEnv(name, fallback) {
  const number = Number(process.env[name] ?? fallback);
  return Number.isFinite(number) ? Math.max(0, number) : fallback;
}
function run() {
  const buildDir = path.resolve(process.env.SEO_BUILD_DIR || 'dist/frontendatlas/browser');
  try {
    const report = auditBuild({ buildDir, canonicalBase: process.env.SEO_CANONICAL_BASE || 'https://frontendatlas.com' });
    const output = process.env.SEO_LINK_EQUITY_OUTPUT;
    if (output) fs.writeFileSync(path.resolve(output), `${JSON.stringify(report, null, 2)}\n`);
    console.log(`[seo:link-equity] ${Object.entries(report.summary).map(([key, value]) => `${key}=${value}`).join(' ')}`);
    console.log('[seo:link-equity] Unique sources are indexable canonical pages; content/navigation counts can overlap. Raw counts include excluded sources and duplicate anchors.');
    for (const row of report.targets.slice(0, readNumberEnv('SEO_LINK_EQUITY_TOP_SAMPLE_SIZE', 20)))
      console.log(`  ${row.route} uniqueSources=${row.uniqueSources} content=${row.contentSources} navigation=${row.navigationSources} rawAnchors=${row.rawAnchors}`);
    // Historical quantities stay observable, never release thresholds or Google signals.
    const oldLimits = { triviaCap: readNumberEnv('SEO_TRIVIA_INBOUND_CAP', 35), strategicMin: readNumberEnv('SEO_STRATEGIC_MIN_LINKS', 120),
      techHubMin: readNumberEnv('SEO_TECH_HUB_MIN_LINKS', 35), techPrepMin: readNumberEnv('SEO_TECH_PREP_MIN_LINKS', 35),
      pricingMax: readNumberEnv('SEO_PRICING_MAX_LINKS', 90), topTriviaMax: readNumberEnv('SEO_TOP_TRIVIA_MAX', 3) };
    console.log(`[seo:link-equity] legacy quotas (informational only): ${JSON.stringify(oldLimits)}`);
    console.log(`[seo:link-equity] non-public anchors: auth/premium=${report.legitimateNonPublicLinks.length} other=${report.otherNonPublicLinks.length}; public query anchors=${report.queryLinks.length}`);
    for (const warning of report.warnings) console.log(`[seo:link-equity] note: ${warning}`);
    if (report.failures.length) {
      console.error(`[seo:link-equity] ${report.failures.length} failures:`);
      for (const failure of report.failures) console.error(`  - ${failure}`);
      process.exitCode = 1;
    } else console.log('[seo:link-equity] passed');
  } catch (error) { console.error(`[seo:link-equity] ${error.message}`); process.exitCode = 1; }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) run();
