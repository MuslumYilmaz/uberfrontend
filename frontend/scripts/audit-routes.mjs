#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { buildRoutes } from './generate-prerender-routes.mjs';
import { readPrerenderRoutes, readSitemapPaths } from './prerender-sitemap-diff.mjs';
import { srcDir } from './content-paths.mjs';

const APP_ROUTES_PATH = path.join(srcDir, 'app', 'app.routes.ts');

const REQUIRED_SOURCE_SNIPPETS = [
  { label: 'explicit 404 route', snippet: "path: '404'" },
  { label: 'global fallback route', snippet: "// Global fallback — render 404" },
  { label: 'legacy safeJsonParse redirect', snippet: "redirectTo: 'javascript/coding/js-safe-json-parse'" },
  { label: 'legacy code-reviews redirect', snippet: "redirectTo: 'coding'" },
  { label: 'track hub redirect', snippet: "path: 'track'" },
  { label: 'framework prep redirect block', snippet: "path: 'framework-prep'" },
  { label: 'playbook alias redirect', snippet: "path: 'playbook'" },
  { label: 'system design blueprint hub', snippet: "path: 'system-design-blueprint'" },
  { label: 'tech matcher children', snippet: "matcher: techMatcher" },
];

const PUBLIC_SITEMAP_ROUTES = [
  '/',
  '/coding',
  '/incidents',
  '/tradeoffs',
  '/interview-questions',
  '/javascript/interview-questions',
  '/react/interview-questions',
  '/angular/interview-questions',
  '/vue/interview-questions',
  '/html/interview-questions',
  '/css/interview-questions',
  '/guides/interview-blueprint',
  '/guides/framework-prep',
  '/guides/system-design-blueprint',
  '/guides/behavioral',
  '/pricing',
  '/tracks',
  '/focus-areas',
  '/companies',
  '/system-design',
  '/tools/cv',
  '/legal',
  '/legal/editorial-policy',
];

function fail(lines) {
  lines.forEach((line) => console.error(line));
  process.exitCode = 1;
}

function main() {
  const generatedRoutes = buildRoutes();
  const prerenderRoutes = readPrerenderRoutes();
  const sitemapRoutes = readSitemapPaths();

  const generatedSet = new Set(generatedRoutes);
  const prerenderSet = new Set(prerenderRoutes);
  const sitemapSet = new Set(sitemapRoutes);
  const appRoutesSource = fs.readFileSync(APP_ROUTES_PATH, 'utf8');

  console.log(`[audit:routes] generated routes: ${generatedRoutes.length}`);
  console.log(`[audit:routes] prerender routes: ${prerenderRoutes.length}`);
  console.log(`[audit:routes] sitemap routes: ${sitemapRoutes.length}`);

  const missingFromPrerender = generatedRoutes.filter((route) => !prerenderSet.has(route));
  if (missingFromPrerender.length) {
    fail([
      `[audit:routes] missing generated routes from prerender.routes.txt: ${missingFromPrerender.length}`,
      ...missingFromPrerender.slice(0, 50).map((route) => `  - ${route}`),
    ]);
  }

  const orphanPrerenderRoutes = prerenderRoutes.filter((route) => !generatedSet.has(route));
  if (orphanPrerenderRoutes.length) {
    fail([
      `[audit:routes] prerender.routes.txt contains routes no longer generated: ${orphanPrerenderRoutes.length}`,
      ...orphanPrerenderRoutes.slice(0, 50).map((route) => `  - ${route}`),
    ]);
  }

  const sitemapOutsideGenerated = sitemapRoutes.filter((route) => !generatedSet.has(route));
  if (sitemapOutsideGenerated.length) {
    fail([
      `[audit:routes] sitemap contains routes outside generated route inventory: ${sitemapOutsideGenerated.length}`,
      ...sitemapOutsideGenerated.slice(0, 50).map((route) => `  - ${route}`),
    ]);
  }

  const missingPublicRoutes = PUBLIC_SITEMAP_ROUTES.filter((route) => !sitemapSet.has(route));
  if (missingPublicRoutes.length) {
    fail([
      `[audit:routes] sitemap is missing required public routes: ${missingPublicRoutes.length}`,
      ...missingPublicRoutes.map((route) => `  - ${route}`),
    ]);
  }

  const missingSourceContracts = REQUIRED_SOURCE_SNIPPETS.filter(
    ({ snippet }) => !appRoutesSource.includes(snippet),
  );
  if (missingSourceContracts.length) {
    fail([
      `[audit:routes] app.routes.ts is missing required route contracts: ${missingSourceContracts.length}`,
      ...missingSourceContracts.map(({ label }) => `  - ${label}`),
    ]);
  }

  if (process.exitCode !== 1) {
    console.log('[audit:routes] passed');
  }
}

main();
