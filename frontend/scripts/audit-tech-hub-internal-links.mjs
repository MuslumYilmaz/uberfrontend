#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parsePage } from './audit-internal-link-equity.mjs';
import { createRobotsPolicy } from './internal-link-robots.mjs';

export const TECH_HUB_TARGETS = [
  '/javascript/interview-questions',
  '/react/interview-questions',
  '/angular/interview-questions',
  '/vue/interview-questions',
  '/html/interview-questions',
  '/css/interview-questions',
  '/html-css/interview-questions',
];

// These are editorial source/target relationships, not sitewide link-count quotas.
export const CONTEXTUAL_HUB_LINKS = [
  { source: '/', targets: ['/interview-questions', ...TECH_HUB_TARGETS] },
  { source: '/coding', targets: TECH_HUB_TARGETS },
  ...['/interview-questions', '/guides/framework-prep', '/tracks', '/companies']
    .map((source) => ({ source, targets: TECH_HUB_TARGETS })),
  {
    source: '/guides/interview-blueprint/intro',
    targets: ['/interview-questions', '/javascript/interview-questions', '/html-css/interview-questions'],
  },
  {
    source: '/guides/interview-blueprint/ui-interviews',
    targets: ['/css/interview-questions', '/html-css/interview-questions', '/machine-coding'],
  },
  {
    source: '/guides/interview-blueprint/quiz',
    targets: ['/html/interview-questions', '/css/interview-questions', '/javascript/interview-questions'],
  },
];

function collectHtmlFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectHtmlFiles(full, out);
    else if (entry.isFile() && entry.name === 'index.html') out.push(full);
  }
  return out;
}

export function auditTechHubLinks({
  buildDir,
  canonicalBase = 'https://frontendatlas.com',
  contracts = CONTEXTUAL_HUB_LINKS,
}) {
  if (!fs.existsSync(buildDir)) throw new Error(`Build directory not found: ${buildDir}. Run npm run build first.`);
  canonicalBase = canonicalBase.replace(/\/+$/, '');
  const robotsAllows = createRobotsPolicy(fs.readFileSync(path.join(buildDir, 'robots.txt'), 'utf8'));
  const pages = new Map(collectHtmlFiles(buildDir).map((file) => {
    const relative = path.relative(buildDir, path.dirname(file)).replace(/\\/g, '/');
    const route = relative ? `/${relative}` : '/';
    return [route, parsePage(fs.readFileSync(file, 'utf8'), route, canonicalBase)];
  }));
  const failures = new Set();
  const eligiblePage = (route) => {
    const page = pages.get(route);
    return page?.selfCanonical && page.indexable && page.follow && robotsAllows(route);
  };
  const cleanAnchor = (anchor) => anchor.follow && !anchor.query && !anchor.fragment
    && anchor.pathname === anchor.route;
  const targetRoutes = [...new Set(contracts.flatMap(({ targets }) => targets))];
  const totals = new Map(targetRoutes.map((target) => [target, {
    rawAnchors: 0, sources: new Set(), contentSources: new Set(), navigationSources: new Set(),
  }]));

  for (const [source, page] of pages) {
    for (const anchor of page.anchors) {
      const count = totals.get(anchor.route);
      if (!count) continue;
      count.rawAnchors += 1;
      if (source === anchor.route || !eligiblePage(source) || !eligiblePage(anchor.route) || !cleanAnchor(anchor)) continue;
      count.sources.add(source);
      count[anchor.zone === 'content' ? 'contentSources' : 'navigationSources'].add(source);
    }
  }

  for (const target of targetRoutes) {
    if (!pages.has(target)) failures.add(`missing prerender target ${target}`);
    else if (!eligiblePage(target)) failures.add(`target must be canonical, indexable, followable and crawlable: ${target}`);
  }
  for (const { source, targets } of contracts) {
    const page = pages.get(source);
    if (!page) {
      failures.add(`missing prerender source ${source}`);
      continue;
    }
    if (!eligiblePage(source)) {
      failures.add(`source must be canonical, indexable, followable and crawlable: ${source}`);
      continue;
    }
    for (const target of targets) {
      if (!page.anchors.some((anchor) => anchor.route === target && anchor.zone === 'content' && cleanAnchor(anchor))) {
        failures.add(`${source} lacks a clean, followable content link to ${target}`);
      }
    }
  }

  return {
    failures: [...failures].sort(),
    sources: contracts.map(({ source }) => source),
    targets: [...totals].map(([route, counts]) => ({
      route,
      rawAnchors: counts.rawAnchors,
      uniqueSources: counts.sources.size,
      contentSources: counts.contentSources.size,
      navigationSources: counts.navigationSources.size,
    })),
  };
}

function run() {
  try {
    const report = auditTechHubLinks({
      buildDir: path.resolve(process.env.SEO_BUILD_DIR || 'dist/frontendatlas/browser'),
      canonicalBase: process.env.SEO_CANONICAL_BASE || 'https://frontendatlas.com',
    });
    console.log('[seo:tech-hub-links] canonical target counts (unique eligible sources; content/navigation can overlap):');
    for (const row of report.targets) {
      console.log(`  ${row.route} uniqueSources=${row.uniqueSources} content=${row.contentSources} navigation=${row.navigationSources} rawAnchors=${row.rawAnchors}`);
    }
    console.log(`[seo:tech-hub-links] contextual sources checked: ${report.sources.join(', ')}`);
    if (report.failures.length) {
      console.error('[seo:tech-hub-links] failures:');
      for (const failure of report.failures) console.error(`  - ${failure}`);
      process.exitCode = 1;
    } else console.log('[seo:tech-hub-links] passed');
  } catch (error) {
    console.error(`[seo:tech-hub-links] ${error.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) run();
