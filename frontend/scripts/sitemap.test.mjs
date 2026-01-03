import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve('src');
const INDEX_PATH = path.join(SRC_DIR, 'sitemap-index.xml');
const FALLBACK_PATH = path.join(SRC_DIR, 'sitemap.xml');
const MAX_URLS = 50000;

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

function assertSitemapWithinLimit(fileName) {
  const filePath = path.join(SRC_DIR, fileName);
  const xml = readXml(filePath);
  const count = countUrlEntries(xml);
  if (count > MAX_URLS) {
    throw new Error(`${fileName} has ${count} URLs (max ${MAX_URLS}). Split the sitemap.`);
  }
}

if (fs.existsSync(INDEX_PATH)) {
  const indexXml = readXml(INDEX_PATH);
  const locs = extractLocs(indexXml);
  if (!locs.length) {
    throw new Error('sitemap-index.xml does not list any sitemaps.');
  }
  locs.forEach((loc) => assertSitemapWithinLimit(toLocalFile(loc)));
} else {
  assertSitemapWithinLimit('sitemap.xml');
}

console.log('Sitemap size check passed.');
