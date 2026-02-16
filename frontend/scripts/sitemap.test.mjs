import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve('src');
const INDEX_PATH = path.join(SRC_DIR, 'sitemap-index.xml');
const FALLBACK_PATH = path.join(SRC_DIR, 'sitemap.xml');
const MAX_URLS = 50000;
const GUIDE_REGISTRY_PATH = path.join(SRC_DIR, 'app', 'shared', 'guides', 'guide.registry.ts');

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
  const withSlash = raw.startsWith('/') ? raw : `/${raw}`;
  const clean = withSlash.replace(/\/+$/, '');
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

function getAllSitemapPaths(fileNames) {
  const paths = new Set();
  fileNames.forEach((fileName) => {
    const xml = readXml(path.join(SRC_DIR, fileName));
    extractLocs(xml).forEach((loc) => {
      try {
        paths.add(normalizePath(new URL(loc).pathname));
      } catch {
        paths.add(normalizePath(loc));
      }
    });
  });
  return paths;
}

function assertGuideDetailCoverage(paths) {
  if (!fs.existsSync(GUIDE_REGISTRY_PATH)) return;
  const registrySource = readXml(GUIDE_REGISTRY_PATH);
  const playbook = extractGuideSlugs(registrySource, 'PLAYBOOK');
  const frameworkPrep = playbook.filter((slug) => slug.endsWith('-prep-path'));
  const expected = [
    ...playbook.map((slug) => `/guides/interview-blueprint/${slug}`),
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
    '/guides',
    '/legal/editorial-policy',
  ];

  const missing = core.filter((route) => !paths.has(normalizePath(route)));
  if (missing.length) {
    throw new Error(`Sitemap missing core indexable routes: ${missing.join(', ')}`);
  }
}

const sitemapFiles = getSitemapFileNames();
sitemapFiles.forEach((fileName) => assertSitemapWithinLimit(fileName));
const paths = getAllSitemapPaths(sitemapFiles);
assertGuideDetailCoverage(paths);
assertCoreIndexableCoverage(paths);

console.log('Sitemap size check passed.');
