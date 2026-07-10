import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import {
  cdnPracticeRegistryPath as PRACTICE_REGISTRY_PATH,
  cdnQuestionTrackRegistryPath as TRACK_REGISTRY_PATH,
} from './content-paths.mjs';
import {
  isScopedRegistryDetailRoute,
  normalizeAccess,
  normalizeRoutePath,
} from './registry-detail-access-policy.mjs';

const SRC_DIR = path.resolve('src');
const INDEX_PATH = path.join(SRC_DIR, 'sitemap-index.xml');
const FALLBACK_PATH = path.join(SRC_DIR, 'sitemap.xml');
const MAX_URLS = 50000;
const GUIDE_REGISTRY_PATH = path.join(SRC_DIR, 'app', 'shared', 'guides', 'guide.registry.ts');
const APP_ROUTES_PATH = path.join(SRC_DIR, 'app', 'app.routes.ts');
const ROBOTS_PATH = path.join(SRC_DIR, 'robots.txt');
const VERCEL_CONFIG_PATH = path.resolve('vercel.json');
const CODING_QUERY_KEYS = ['reset', 'kind', 'view', 'category', 'tech', 'q', 'diff', 'imp', 'topic', 'focus'];

function readXml(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing ${filePath}. Run: npm run gen:data`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function countUrlEntries(xml) {
  const matches = xml.match(/<url>/g);
  return matches ? matches.length : 0;
}

function extractLocs(xml) {
  const matches = xml.matchAll(/<loc>([^<]+)<\/loc>/g);
  return Array.from(matches, (m) => m[1]);
}

function parseAbsoluteUrl(value) {
  try {
    return new URL(String(value || '').trim());
  } catch {
    return null;
  }
}

function toLocalFile(loc) {
  try {
    const url = new URL(loc);
    return url.pathname.replace(/^\//, '');
  } catch {
    return String(loc).replace(/^\//, '');
  }
}

function normalizePath(rawPath) {
  const raw = String(rawPath || '').trim();
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
  return clean || '/';
}

function assertSitemapWithinLimit(fileName) {
  const filePath = path.join(SRC_DIR, fileName);
  const xml = readXml(filePath);
  const count = countUrlEntries(xml);
  if (count > MAX_URLS) {
    throw new Error(`${fileName} has ${count} URLs (max ${MAX_URLS}). Split the sitemap.`);
  }
}

function extractGuideSlugs(content, exportName) {
  const marker = `export const ${exportName}`;
  const start = content.indexOf(marker);
  if (start === -1) return [];
  const rest = content.slice(start);
  const end = rest.indexOf('];');
  if (end === -1) return [];
  const block = rest.slice(0, end);
  const slugs = [];
  const re = /slug:\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = re.exec(block))) {
    slugs.push(match[1]);
  }
  return slugs;
}

function getSitemapFileNames() {
  if (!fs.existsSync(INDEX_PATH)) return ['sitemap.xml'];
  const indexXml = readXml(INDEX_PATH);
  const locs = extractLocs(indexXml);
  if (!locs.length) {
    throw new Error('sitemap-index.xml does not list any sitemaps.');
  }
  return locs.map((loc) => toLocalFile(loc));
}

function getAllSitemapLocs(fileNames) {
  return fileNames.flatMap((fileName) => {
    const xml = readXml(path.join(SRC_DIR, fileName));
    return extractLocs(xml);
  });
}

function getAllSitemapEntries(fileNames) {
  return fileNames.flatMap((fileName) => {
    const xml = readXml(path.join(SRC_DIR, fileName));
    return Array.from(xml.matchAll(/<url>([\s\S]*?)<\/url>/g), (match) => {
      const block = match[1] || '';
      const loc = (block.match(/<loc>([^<]+)<\/loc>/) || [])[1] || '';
      const lastmod = (block.match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1] || '';
      return { loc, lastmod };
    }).filter((entry) => entry.loc);
  });
}

function getAllSitemapPaths(fileNames) {
  const paths = new Set();
  getAllSitemapLocs(fileNames).forEach((loc) => {
    paths.add(normalizePath(loc));
  });
  return paths;
}

function assertNoQueryOrHashInSitemapLocs(locs) {
  const offenders = locs.filter((loc) => {
    try {
      const url = new URL(loc);
      return Boolean(url.search || url.hash);
    } catch {
      const raw = String(loc || '');
      return raw.includes('?') || raw.includes('#');
    }
  });

  if (offenders.length) {
    throw new Error(
      `Sitemap locs must not contain query or hash fragments. Examples: ${offenders.slice(0, 5).join(', ')}`
    );
  }
}

function assertPracticeCanonicalCoverage(paths, locs) {
  const required = ['/coding', '/interview-questions', '/machine-coding', '/system-design'];
  const missing = required.filter((route) => !paths.has(normalizePath(route)));
  if (missing.length) {
    throw new Error(`Sitemap missing practice canonical routes: ${missing.join(', ')}`);
  }

  const codingQueryLocs = locs.filter((loc) => /\/coding[?#]/.test(String(loc || '')));
  if (codingQueryLocs.length) {
    throw new Error(
      `Sitemap must only include clean /coding, not query variants. Examples: ${codingQueryLocs.slice(0, 5).join(', ')}`
    );
  }
}

function assertFlexboxNavbarSitemapCoverage(paths, locs) {
  const route = '/css/coding/css-flexbox-navbar';
  const canonical = 'https://frontendatlas.com/css/coding/css-flexbox-navbar';
  if (!paths.has(route)) {
    throw new Error(`Sitemap missing canonical route: ${route}`);
  }
  if (!locs.some((loc) => String(loc || '').trim() === canonical)) {
    throw new Error(`Sitemap missing exact canonical loc: ${canonical}`);
  }

  const variants = locs.filter((loc) => {
    const raw = String(loc || '').trim();
    if (raw === canonical) return false;

    const parsed = parseAbsoluteUrl(raw);
    return parsed?.origin === 'https://frontendatlas.com' && parsed.pathname === route;
  });
  if (variants.length) {
    throw new Error(
      `Sitemap must only include the canonical Flexbox navbar URL. Variants: ${variants.slice(0, 5).join(', ')}`
    );
  }
}

function assertCssGridCardGallerySitemapCoverage(paths, entries, locs) {
  const route = '/css/coding/css-grid-card-gallery';
  const canonical = 'https://frontendatlas.com/css/coding/css-grid-card-gallery';
  if (!paths.has(route)) {
    throw new Error(`Sitemap missing canonical route: ${route}`);
  }

  const exactEntries = entries.filter((entry) => String(entry.loc || '').trim() === canonical);
  if (exactEntries.length !== 1) {
    throw new Error(`Sitemap must include exactly one CSS Grid card gallery canonical loc: ${canonical}`);
  }
  if (exactEntries[0].lastmod !== '2026-07-09') {
    throw new Error(
      `CSS Grid card gallery sitemap lastmod must be 2026-07-09, got ${exactEntries[0].lastmod || '(missing)'}`
    );
  }

  const variants = locs.filter((loc) => {
    const raw = String(loc || '').trim();
    if (raw === canonical) return false;

    const parsed = parseAbsoluteUrl(raw);
    return parsed?.origin === 'https://frontendatlas.com' && parsed.pathname === route;
  });
  if (variants.length) {
    throw new Error(
      `Sitemap must only include the canonical CSS Grid card gallery URL. Variants: ${variants.slice(0, 5).join(', ')}`
    );
  }
}

function assertGuideDetailCoverage(paths) {
  if (!fs.existsSync(GUIDE_REGISTRY_PATH)) return;
  const registrySource = readXml(GUIDE_REGISTRY_PATH);
  const playbook = extractGuideSlugs(registrySource, 'PLAYBOOK');
  const frameworkPrep = playbook.filter((slug) => slug.endsWith('-prep-path'));
  const interviewBlueprintOnly = playbook.filter((slug) => !slug.endsWith('-prep-path'));
  const expected = [
    ...interviewBlueprintOnly.map((slug) => `/guides/interview-blueprint/${slug}`),
    ...frameworkPrep.map((slug) => `/guides/framework-prep/${slug}`),
    ...extractGuideSlugs(registrySource, 'SYSTEM').map((slug) => `/guides/system-design-blueprint/${slug}`),
    ...extractGuideSlugs(registrySource, 'BEHAVIORAL').map((slug) => `/guides/behavioral/${slug}`),
  ];
  const missing = expected.filter((route) => !paths.has(normalizePath(route)));
  if (missing.length) {
    throw new Error(
      `Sitemap missing ${missing.length} guide detail routes. Examples: ${missing.slice(0, 5).join(', ')}`
    );
  }
}

function assertCoreIndexableCoverage(paths) {
  const core = [
    '/changelog',
    '/interview-questions',
    '/guides/interview-blueprint',
    '/legal/editorial-policy',
  ];

  const missing = core.filter((route) => !paths.has(normalizePath(route)));
  if (missing.length) {
    throw new Error(`Sitemap missing core indexable routes: ${missing.join(', ')}`);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readPracticeRegistryDetailRoutes() {
  if (!fs.existsSync(PRACTICE_REGISTRY_PATH)) {
    throw new Error(`Missing ${PRACTICE_REGISTRY_PATH}. Run: npm run gen:data`);
  }

  const registry = readJson(PRACTICE_REGISTRY_PATH);
  if (!Array.isArray(registry)) {
    throw new Error('Practice registry must be an array.');
  }

  return registry
    .map((item) => ({
      route: normalizeRoutePath(item?.route),
      access: normalizeAccess(item?.access),
      family: String(item?.family || ''),
    }))
    .filter((item) => item.route && isScopedRegistryDetailRoute(item.route));
}

function assertRegistryDetailAccessPolicy(paths) {
  const detailRoutes = readPracticeRegistryDetailRoutes();
  const premium = detailRoutes.filter((item) => item.access === 'premium');
  const free = detailRoutes.filter((item) => item.access === 'free');

  const premiumIncluded = premium.filter((item) => paths.has(item.route));
  if (premiumIncluded.length) {
    throw new Error(
      `Sitemap must exclude premium locked detail routes. Examples: ${
        premiumIncluded.slice(0, 10).map((item) => item.route).join(', ')
      }`,
    );
  }

  const freeMissing = free.filter((item) => !paths.has(item.route));
  if (freeMissing.length) {
    throw new Error(
      `Sitemap missing free registry detail routes. Examples: ${
        freeMissing.slice(0, 10).map((item) => item.route).join(', ')
      }`,
    );
  }

  const premiumByFamily = premium.reduce((acc, item) => {
    acc[item.family] = (acc[item.family] || 0) + 1;
    return acc;
  }, {});
  console.log(
    `[sitemap:test] registry detail access policy checked: free=${free.length} premium_excluded=${premium.length} ${JSON.stringify(premiumByFamily)}`,
  );
}

function readPublicTrackPreviewRoutes() {
  if (!fs.existsSync(TRACK_REGISTRY_PATH)) return [];
  const registry = readJson(TRACK_REGISTRY_PATH);
  const tracks = Array.isArray(registry?.tracks) ? registry.tracks : [];
  return tracks
    .filter((track) => track?.slug && !track?.hidden)
    .map((track) => normalizeRoutePath(`/tracks/${track.slug}/preview`));
}

function assertPreviewAndHubCoverage(paths) {
  const requiredHubs = [
    '/coding',
    '/incidents',
    '/tradeoffs',
    '/system-design',
    '/tracks',
    '/companies',
  ];
  const missingHubs = requiredHubs.filter((route) => !paths.has(route));
  if (missingHubs.length) {
    throw new Error(`Sitemap missing public hub routes: ${missingHubs.join(', ')}`);
  }

  const missingTrackPreviews = readPublicTrackPreviewRoutes().filter((route) => !paths.has(route));
  if (missingTrackPreviews.length) {
    throw new Error(
      `Sitemap missing public track preview routes. Examples: ${missingTrackPreviews.slice(0, 5).join(', ')}`,
    );
  }

  const hasCompanyPreview = Array.from(paths).some((route) => /^\/companies\/[^/]+\/preview$/.test(route));
  if (!hasCompanyPreview) {
    throw new Error('Sitemap must keep public company preview routes.');
  }
}

function assertNoPrivateOrRedirectRoutes(paths) {
  const forbiddenExact = [
    '/auth/login',
    '/auth/signup',
    '/auth/callback',
    '/dashboard',
    '/profile',
    '/admin/users',
    '/billing/success',
    '/billing/cancel',
    '/onboarding/quick-start',
    '/tools/cv-linter',
    '/track',
  ];
  const forbiddenPrefixes = [
    '/auth/',
    '/admin/',
    '/billing/',
    '/onboarding/',
  ];
  const forbiddenRedirects = [
    '/guides/interview-blueprint/javascript-prep-path',
    '/guides/interview-blueprint/react-prep-path',
    '/guides/interview-blueprint/angular-prep-path',
    '/guides/interview-blueprint/vue-prep-path',
    '/guides/system-design',
    '/guides/system-design/radio',
    '/guides/system-design/radio/framework',
    '/guides/system-design/radio/requirements',
    '/guides/system-design/radio/architecture',
    '/guides/system-design/radio/data-model',
    '/guides/system-design/radio/interface',
    '/guides/system-design/radio/optimizations',
  ];

  const offenders = Array.from(paths).filter((route) => {
    if (forbiddenExact.includes(route) || forbiddenRedirects.includes(route)) return true;
    return forbiddenPrefixes.some((prefix) => route.startsWith(prefix));
  });

  if (offenders.length) {
    throw new Error(
      `Sitemap must not include private or redirect routes. Examples: ${offenders.slice(0, 10).join(', ')}`,
    );
  }
}

function assertCssThemeVariablesSitemapEntry(entries) {
  const loc = 'https://frontendatlas.com/css/coding/css-theme-variables-dark-mode';
  const entry = entries.find((item) => item.loc === loc);
  if (!entry) {
    throw new Error(`Sitemap missing CSS theme variables challenge: ${loc}`);
  }
  if (entry.lastmod !== '2026-01-30') {
    throw new Error(`CSS theme variables sitemap lastmod must be 2026-01-30, got ${entry.lastmod || '(missing)'}`);
  }
}

function assertOpenAiCompanyPreviewSitemapEntry(entries) {
  const loc = 'https://frontendatlas.com/companies/openai/preview';
  const matches = entries.filter((item) => item.loc === loc);
  if (matches.length !== 1) {
    throw new Error(`Sitemap must include exactly one OpenAI company preview loc: ${loc}`);
  }
  if (matches[0].lastmod !== '2026-07-11') {
    throw new Error(`OpenAI company preview sitemap lastmod must be 2026-07-11, got ${matches[0].lastmod || '(missing)'}`);
  }
}

function normalizeTitle(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function propertyNameToString(name) {
  if (!name) return '';
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return String(name.text || '');
  }
  return '';
}

function getObjectProperty(objectLiteral, propName) {
  return objectLiteral.properties.find((prop) => {
    if (!ts.isPropertyAssignment(prop)) return false;
    return propertyNameToString(prop.name) === propName;
  }) || null;
}

function readStringProperty(objectLiteral, propName) {
  const prop = getObjectProperty(objectLiteral, propName);
  if (!prop) return '';
  const init = prop.initializer;
  if (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init)) {
    return init.text;
  }
  return '';
}

function readObjectProperty(objectLiteral, propName) {
  const prop = getObjectProperty(objectLiteral, propName);
  if (!prop || !ts.isObjectLiteralExpression(prop.initializer)) return null;
  return prop.initializer;
}

function readArrayProperty(objectLiteral, propName) {
  const prop = getObjectProperty(objectLiteral, propName);
  if (!prop || !ts.isArrayLiteralExpression(prop.initializer)) return null;
  return prop.initializer;
}

function isStaticPathSegment(segment) {
  const value = String(segment || '');
  if (value === '') return true;
  return !value.includes(':') && !value.includes('*');
}

function joinRoutePath(parentPath, segment) {
  const parent = normalizePath(parentPath || '/');
  const child = String(segment || '');
  if (!child) return parent;
  if (parent === '/') return normalizePath(`/${child}`);
  return normalizePath(`${parent}/${child}`);
}

function hasStaticDefaultRedirectChild(routeObject) {
  const children = readArrayProperty(routeObject, 'children');
  if (!children) return false;

  return children.elements.some((child) => {
    if (!ts.isObjectLiteralExpression(child)) return false;
    const childPath = readStringProperty(child, 'path');
    const redirectTo = readStringProperty(child, 'redirectTo');
    if (childPath !== '' || !redirectTo) return false;
    return isStaticPathSegment(redirectTo);
  });
}

function collectRouteSeoEntries(routeArray, parentPath, out) {
  routeArray.elements.forEach((element) => {
    if (!ts.isObjectLiteralExpression(element)) return;

    const pathSegment = readStringProperty(element, 'path');
    const currentPath = joinRoutePath(parentPath, pathSegment);
    const hasRedirect = Boolean(getObjectProperty(element, 'redirectTo'));
    const hasDefaultRedirectChild = hasStaticDefaultRedirectChild(element);
    const dataObject = readObjectProperty(element, 'data');
    const seoObject = dataObject ? readObjectProperty(dataObject, 'seo') : null;

    if (seoObject && !hasRedirect && !hasDefaultRedirectChild && isStaticPathSegment(pathSegment)) {
      const title = readStringProperty(seoObject, 'title');
      if (title) {
        out.push({
          path: currentPath,
          title,
          robots: readStringProperty(seoObject, 'robots'),
        });
      }
    }

    const children = readArrayProperty(element, 'children');
    if (children) {
      collectRouteSeoEntries(children, currentPath, out);
    }
  });
}

function readRoutesArrayExpression(sourceFile) {
  let routesArray = null;
  sourceFile.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return;
    node.declarationList.declarations.forEach((decl) => {
      if (!ts.isIdentifier(decl.name)) return;
      if (decl.name.text !== 'routes') return;
      if (decl.initializer && ts.isArrayLiteralExpression(decl.initializer)) {
        routesArray = decl.initializer;
      }
    });
  });
  return routesArray;
}

function assertIndexableRouteTitlesUnique() {
  if (!fs.existsSync(APP_ROUTES_PATH)) return;

  const source = fs.readFileSync(APP_ROUTES_PATH, 'utf8');
  const sourceFile = ts.createSourceFile(
    APP_ROUTES_PATH,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  const routesArray = readRoutesArrayExpression(sourceFile);
  if (!routesArray) {
    throw new Error('Could not parse routes array in src/app/app.routes.ts');
  }

  const rawEntries = [];
  collectRouteSeoEntries(routesArray, '/', rawEntries);

  // Keep one SEO record per static route path (child routes override parent for same path).
  const byPath = new Map();
  rawEntries.forEach((entry) => {
    byPath.set(normalizePath(entry.path), entry);
  });

  const indexableEntries = Array.from(byPath.values()).filter(
    (entry) => !String(entry.robots || '').toLowerCase().includes('noindex'),
  );

  const titleMap = new Map();
  indexableEntries.forEach((entry) => {
    const key = normalizeTitle(entry.title);
    if (!key) return;
    const list = titleMap.get(key) || [];
    list.push(entry);
    titleMap.set(key, list);
  });

  const duplicates = Array.from(titleMap.values()).filter((entries) => entries.length > 1);
  if (duplicates.length) {
    const details = duplicates
      .map((entries) => {
        const title = entries[0].title;
        const paths = entries.map((entry) => entry.path).join(', ');
        return `"${title}" -> ${paths}`;
      })
      .join(' | ');
    throw new Error(`Duplicate indexable SEO titles detected: ${details}`);
  }

  const homeEntry = indexableEntries.find((entry) => normalizePath(entry.path) === '/');
  if (!homeEntry) {
    throw new Error('Missing indexable SEO title for homepage (/).');
  }

  const homeTitlePhrase = normalizeTitle(homeEntry.title);
  const homePhraseCollisions = indexableEntries.filter((entry) => {
    if (normalizePath(entry.path) === '/') return false;
    return normalizeTitle(entry.title).includes(homeTitlePhrase);
  });

  if (homePhraseCollisions.length) {
    const details = homePhraseCollisions
      .map((entry) => `${entry.path} ("${entry.title}")`)
      .join(', ');
    throw new Error(
      `Homepage primary title phrase appears in other indexable route titles (${details}).`,
    );
  }
}

function assertRobotsAllowsCodingQueryNoindex() {
  if (!fs.existsSync(ROBOTS_PATH)) {
    throw new Error(`Missing ${ROBOTS_PATH}.`);
  }

  const robots = fs.readFileSync(ROBOTS_PATH, 'utf8');
  if (!/^\s*Sitemap:\s*https:\/\/frontendatlas\.com\/sitemap\.xml\s*$/im.test(robots)) {
    throw new Error('robots.txt must expose Sitemap: https://frontendatlas.com/sitemap.xml');
  }
  if (/^\s*Disallow:\s*\/coding\?/im.test(robots)) {
    throw new Error('robots.txt must not disallow /coding?; query variants need to be crawlable for noindex.');
  }
}

function assertVercelCodingQueryNoindexHeaders() {
  if (!fs.existsSync(VERCEL_CONFIG_PATH)) {
    throw new Error(`Missing ${VERCEL_CONFIG_PATH}.`);
  }

  const config = JSON.parse(fs.readFileSync(VERCEL_CONFIG_PATH, 'utf8'));
  const covered = new Set();

  (Array.isArray(config.headers) ? config.headers : []).forEach((rule) => {
    if (rule?.source !== '/coding') return;

    const hasQueryKeys = (Array.isArray(rule.has) ? rule.has : [])
      .filter((entry) => entry?.type === 'query' && entry?.key)
      .map((entry) => String(entry.key));

    const hasNoindexHeader = (Array.isArray(rule.headers) ? rule.headers : []).some((header) => {
      const key = String(header?.key || '').toLowerCase();
      const value = String(header?.value || '').toLowerCase().replace(/\s+/g, '');
      return key === 'x-robots-tag' && value === 'noindex,follow';
    });

    if (hasNoindexHeader) {
      hasQueryKeys.forEach((key) => covered.add(key));
    }
  });

  const missing = CODING_QUERY_KEYS.filter((key) => !covered.has(key));
  if (missing.length) {
    throw new Error(`vercel.json missing X-Robots-Tag noindex headers for /coding query keys: ${missing.join(', ')}`);
  }
}

function readVercelConfig() {
  if (!fs.existsSync(VERCEL_CONFIG_PATH)) {
    throw new Error(`Missing ${VERCEL_CONFIG_PATH}.`);
  }

  return JSON.parse(fs.readFileSync(VERCEL_CONFIG_PATH, 'utf8'));
}

function getGlobalVercelHeader(config, headerName) {
  const normalizedHeaderName = String(headerName || '').toLowerCase();
  const globalRule = (Array.isArray(config.headers) ? config.headers : [])
    .find((rule) => rule?.source === '/(.*)');

  const header = (Array.isArray(globalRule?.headers) ? globalRule.headers : [])
    .find((entry) => String(entry?.key || '').toLowerCase() === normalizedHeaderName);

  if (!header?.value) {
    throw new Error(`vercel.json missing global ${headerName} header.`);
  }

  return String(header.value);
}

function parseCspDirectives(policy) {
  const directives = new Map();
  String(policy || '')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      const [name, ...tokens] = part.split(/\s+/);
      directives.set(name.toLowerCase(), new Set(tokens));
    });
  return directives;
}

function assertCspDirectiveSources({ headerName, policy, directiveName, requiredSources }) {
  const directives = parseCspDirectives(policy);
  const sources = directives.get(directiveName);
  if (!sources) {
    throw new Error(`${headerName} missing ${directiveName}.`);
  }

  const missing = requiredSources.filter((source) => !sources.has(source));
  if (missing.length) {
    throw new Error(`${headerName} ${directiveName} missing required source(s): ${missing.join(', ')}`);
  }
}

function assertVercelCspAllowsCodingSandboxRunner() {
  const config = readVercelConfig();
  const headerNames = ['Content-Security-Policy', 'Content-Security-Policy-Report-Only'];

  headerNames.forEach((headerName) => {
    const policy = getGlobalVercelHeader(config, headerName);

    assertCspDirectiveSources({
      headerName,
      policy,
      directiveName: 'script-src',
      requiredSources: ["'unsafe-eval'", 'blob:'],
    });
    assertCspDirectiveSources({
      headerName,
      policy,
      directiveName: 'script-src-elem',
      requiredSources: ['blob:'],
    });
    assertCspDirectiveSources({
      headerName,
      policy,
      directiveName: 'worker-src',
      requiredSources: ['blob:'],
    });
  });
}

function assertVercelCspAllowsGoogleAnalyticsCollection() {
  const config = readVercelConfig();
  const headerNames = ['Content-Security-Policy', 'Content-Security-Policy-Report-Only'];
  const requiredSources = [
    'https://analytics.google.com',
    'https://*.analytics.google.com',
    'https://www.google.com',
    'https://stats.g.doubleclick.net',
  ];

  headerNames.forEach((headerName) => {
    const policy = getGlobalVercelHeader(config, headerName);

    assertCspDirectiveSources({
      headerName,
      policy,
      directiveName: 'connect-src',
      requiredSources,
    });
  });
}

const sitemapFiles = getSitemapFileNames();
sitemapFiles.forEach((fileName) => assertSitemapWithinLimit(fileName));
const locs = getAllSitemapLocs(sitemapFiles);
const entries = getAllSitemapEntries(sitemapFiles);
const paths = getAllSitemapPaths(sitemapFiles);
assertNoQueryOrHashInSitemapLocs(locs);
assertPracticeCanonicalCoverage(paths, locs);
assertFlexboxNavbarSitemapCoverage(paths, locs);
assertCssGridCardGallerySitemapCoverage(paths, entries, locs);
assertGuideDetailCoverage(paths);
assertCoreIndexableCoverage(paths);
assertRegistryDetailAccessPolicy(paths);
assertPreviewAndHubCoverage(paths);
assertNoPrivateOrRedirectRoutes(paths);
assertCssThemeVariablesSitemapEntry(entries);
assertOpenAiCompanyPreviewSitemapEntry(entries);
assertIndexableRouteTitlesUnique();
assertRobotsAllowsCodingQueryNoindex();
assertVercelCodingQueryNoindexHeaders();
assertVercelCspAllowsCodingSandboxRunner();
assertVercelCspAllowsGoogleAnalyticsCollection();

console.log('Sitemap size check passed.');
