#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve('src');
const INDEX_PATH = path.join(SRC_DIR, 'sitemap-index.xml');
const FALLBACK_SITEMAP = path.join(SRC_DIR, 'sitemap-1.xml');
const ALT_SITEMAP = path.join(SRC_DIR, 'sitemap.xml');
const PRERENDER_PATH = path.join(SRC_DIR, 'prerender.routes.txt');

function extractLocs(xml) {
  return Array.from(xml.matchAll(/<loc>(.*?)<\/loc>/g))
    .map((m) => (m[1] || '').trim())
    .filter(Boolean);
}

function normalizeRoute(route) {
  const raw = String(route || '').trim();
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
  return clean === '' ? '/' : clean;
}

function readSitemapFiles() {
  if (fs.existsSync(INDEX_PATH)) {
    const indexXml = fs.readFileSync(INDEX_PATH, 'utf8');
    const locs = extractLocs(indexXml);
    const files = locs
      .map((loc) => {
        try {
          const url = new URL(loc);
          return path.join(SRC_DIR, path.basename(url.pathname));
        } catch {
          return path.join(SRC_DIR, path.basename(loc));
        }
      })
      .filter((file) => fs.existsSync(file));
    if (files.length) return files;
  }

  if (fs.existsSync(FALLBACK_SITEMAP)) return [FALLBACK_SITEMAP];
  if (fs.existsSync(ALT_SITEMAP)) return [ALT_SITEMAP];
  return [];
}

function readSitemapPaths() {
  const files = readSitemapFiles();
  if (!files.length) return [];
  const paths = new Set();
  files.forEach((file) => {
    const xml = fs.readFileSync(file, 'utf8');
    extractLocs(xml).forEach((loc) => paths.add(normalizeRoute(loc)));
  });
  return Array.from(paths);
}

function readPrerenderRoutes() {
  if (!fs.existsSync(PRERENDER_PATH)) return [];
  return fs
    .readFileSync(PRERENDER_PATH, 'utf8')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(normalizeRoute);
}

const sitemapPaths = readSitemapPaths();
const prerenderRoutes = readPrerenderRoutes();

const prerenderSet = new Set(prerenderRoutes);
const missing = sitemapPaths.filter((p) => !prerenderSet.has(p));

console.log(`[prerender-sitemap-diff] sitemap URLs: ${sitemapPaths.length}`);
console.log(`[prerender-sitemap-diff] prerender routes: ${prerenderRoutes.length}`);
console.log(`[prerender-sitemap-diff] missing from prerender: ${missing.length}`);

if (missing.length) {
  console.log('[prerender-sitemap-diff] first 50 missing routes:');
  missing.slice(0, 50).forEach((p) => console.log(`  ${p}`));
  process.exitCode = 1;
}
