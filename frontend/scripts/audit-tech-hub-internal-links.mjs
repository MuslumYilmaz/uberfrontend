#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'parse5';
import { parsePage } from './audit-internal-link-equity.mjs';
import { createRobotsPolicy } from './internal-link-robots.mjs';

const TECH_DETAIL_ROUTE = /^\/(html|css)\/(coding|trivia)\/[^/]+$/;
const HTML_INTERVIEW_HUB = '/html/interview-questions';
const CSS_INTERVIEW_HUB = '/css/interview-questions';
const HTML_CSS_INTERVIEW_HUB = '/html-css/interview-questions';
const PREP_ENTRY_TEST_ID = {
  coding: 'coding-prep-entry',
  trivia: 'trivia-prep-entry',
};
const DEDICATED_CSS_CTA_TEST_ID = 'html-css-dedicated-css-link';
const DEDICATED_CSS_SCHEMA_NAME = 'Dedicated CSS interview questions';

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

function tokens(value = '') {
  return value.toLowerCase().split(/[\s,]+/).filter(Boolean);
}

function attrsFor(node) {
  return Object.fromEntries((node.attrs || []).map(({ name, value }) => [name, value]));
}

function textFor(node) {
  return node.nodeName === '#text' ? node.value : (node.childNodes || []).map(textFor).join('');
}

function internalUrl(href, baseUrl, canonicalBase) {
  try {
    const url = new URL(href, baseUrl);
    return /^https?:$/.test(url.protocol) && url.origin === canonicalBase ? url : null;
  } catch {
    return null;
  }
}

function markedAnchors(html, route, canonicalBase, marker) {
  let baseUrl = `${canonicalBase}${route}`;
  let hasBase = false;
  const anchors = [];
  const visit = (node, context = {}) => {
    const attrs = attrsFor(node);
    if (node.tagName === 'base' && attrs.href && !hasBase) {
      try { baseUrl = new URL(attrs.href, baseUrl).href; } catch { /* Invalid base is ignored. */ }
      hasBase = true;
    }
    const navigation = context.navigation || ['nav', 'header', 'footer', 'aside'].includes(node.tagName)
      || ['sidebar', 'mobile_nav'].includes(attrs['data-trivia-link-zone'])
      || ['navigation', 'banner', 'contentinfo', 'complementary'].includes(attrs.role);
    const withinMarker = context.withinMarker || attrs['data-testid'] === marker;
    if (withinMarker && node.tagName === 'a' && attrs.href?.trim()) {
      const url = internalUrl(attrs.href, baseUrl, canonicalBase);
      const follow = !tokens(attrs.rel).some((rel) => ['nofollow', 'sponsored', 'ugc'].includes(rel));
      if (url) anchors.push({ pathname: url.pathname, query: url.search, fragment: url.hash, follow, navigation });
    }
    for (const child of node.childNodes || []) visit(child, { navigation, withinMarker });
  };
  visit(parse(html));
  return anchors;
}

function isCleanMarkerTarget(anchor, target) {
  return anchor.pathname === target && !anchor.query && !anchor.fragment && anchor.follow;
}

function hasDedicatedCssCta(html, route, canonicalBase) {
  return markedAnchors(html, route, canonicalBase, DEDICATED_CSS_CTA_TEST_ID)
    .some((anchor) => !anchor.navigation && isCleanMarkerTarget(anchor, CSS_INTERVIEW_HUB));
}

function hasCleanPrepEntryLink(html, route, canonicalBase, kind, target) {
  return markedAnchors(html, route, canonicalBase, PREP_ENTRY_TEST_ID[kind])
    .some((anchor) => isCleanMarkerTarget(anchor, target));
}

function hasDedicatedCssWebPageSchemaMention(html, canonicalBase) {
  const dedicatedCssUrl = `${canonicalBase}${CSS_INTERVIEW_HUB}`;
  const containsMention = (value) => {
    if (Array.isArray(value)) return value.some(containsMention);
    if (!value || typeof value !== 'object') return false;
    const types = Array.isArray(value['@type']) ? value['@type'] : [value['@type']];
    if (types.includes('WebPage')
      && value.name === DEDICATED_CSS_SCHEMA_NAME
      && value.url === dedicatedCssUrl) return true;
    return Object.values(value).some(containsMention);
  };
  let found = false;
  const visit = (node) => {
    const attrs = attrsFor(node);
    if (node.tagName === 'script' && attrs.type?.split(';', 1)[0].trim().toLowerCase() === 'application/ld+json') {
      try {
        if (containsMention(JSON.parse(textFor(node)))) found = true;
      } catch {
        // Invalid JSON-LD cannot satisfy the structured-data contract.
      }
    }
    for (const child of node.childNodes || []) visit(child);
  };
  visit(parse(html));
  return found;
}

export function auditTechHubLinks({
  buildDir,
  canonicalBase = 'https://frontendatlas.com',
  contracts = CONTEXTUAL_HUB_LINKS,
}) {
  if (!fs.existsSync(buildDir)) throw new Error(`Build directory not found: ${buildDir}. Run npm run build first.`);
  canonicalBase = canonicalBase.replace(/\/+$/, '');
  const robotsAllows = createRobotsPolicy(fs.readFileSync(path.join(buildDir, 'robots.txt'), 'utf8'));
  const htmlByRoute = new Map();
  const pages = new Map(collectHtmlFiles(buildDir).map((file) => {
    const relative = path.relative(buildDir, path.dirname(file)).replace(/\\/g, '/');
    const route = relative ? `/${relative}` : '/';
    const html = fs.readFileSync(file, 'utf8');
    htmlByRoute.set(route, html);
    return [route, parsePage(html, route, canonicalBase)];
  }));
  const failures = new Set();
  const eligiblePage = (route) => {
    const page = pages.get(route);
    return page?.selfCanonical && page.indexable && page.follow && robotsAllows(route);
  };
  const cleanAnchor = (anchor) => anchor.follow && !anchor.query && !anchor.fragment
    && anchor.pathname === anchor.route;
  const hasCleanContentLink = (page, target) => page.anchors.some((anchor) => (
    anchor.route === target && anchor.zone === 'content' && cleanAnchor(anchor)
  ));
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
      if (!hasCleanContentLink(page, target)) {
        failures.add(`${source} lacks a clean, followable content link to ${target}`);
      }
    }
  }

  // Preserve query ownership: CSS details point only to the dedicated CSS hub, while
  // HTML details retain both their dedicated hub and the combined HTML/CSS journey.
  for (const [route, page] of pages) {
    const match = route.match(TECH_DETAIL_ROUTE);
    if (!match || !eligiblePage(route)) continue;
    const [, tech, kind] = match;
    const detailHtml = htmlByRoute.get(route);
    if (tech === 'css') {
      if (!hasCleanPrepEntryLink(detailHtml, route, canonicalBase, kind, CSS_INTERVIEW_HUB)) {
        failures.add(`CSS detail ${route} lacks a clean, followable ${PREP_ENTRY_TEST_ID[kind]} link to ${CSS_INTERVIEW_HUB}`);
      }
      if (page.anchors.some((anchor) => anchor.route === HTML_CSS_INTERVIEW_HUB)) {
        failures.add(`CSS detail ${route} must not link to ${HTML_CSS_INTERVIEW_HUB}`);
      }
      continue;
    }
    if (!hasCleanPrepEntryLink(detailHtml, route, canonicalBase, kind, HTML_INTERVIEW_HUB)) {
      failures.add(`HTML detail ${route} lacks a clean, followable ${PREP_ENTRY_TEST_ID[kind]} link to ${HTML_INTERVIEW_HUB}`);
    }
    if (!hasCleanPrepEntryLink(detailHtml, route, canonicalBase, kind, HTML_CSS_INTERVIEW_HUB)) {
      failures.add(`HTML detail ${route} lacks a clean, followable ${PREP_ENTRY_TEST_ID[kind]} link to ${HTML_CSS_INTERVIEW_HUB}`);
    }
  }

  const combinedHub = pages.get(HTML_CSS_INTERVIEW_HUB);
  if (combinedHub && eligiblePage(HTML_CSS_INTERVIEW_HUB)) {
    if (!hasCleanContentLink(combinedHub, CSS_INTERVIEW_HUB)) {
      failures.add(`${HTML_CSS_INTERVIEW_HUB} lacks a clean, followable content CTA link to ${CSS_INTERVIEW_HUB}`);
    }
    const combinedHtml = htmlByRoute.get(HTML_CSS_INTERVIEW_HUB);
    if (!hasDedicatedCssCta(combinedHtml, HTML_CSS_INTERVIEW_HUB, canonicalBase)) {
      failures.add(`${HTML_CSS_INTERVIEW_HUB} lacks the dedicated CSS CTA marker and clean target`);
    }
    if (!hasDedicatedCssWebPageSchemaMention(combinedHtml, canonicalBase)) {
      failures.add(`${HTML_CSS_INTERVIEW_HUB} lacks the dedicated CSS WebPage schema mention`);
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
