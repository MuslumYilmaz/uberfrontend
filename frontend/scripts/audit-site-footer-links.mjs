#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'parse5';
import { parsePage } from './audit-internal-link-equity.mjs';
import { srcDir } from './content-paths.mjs';

// The app shell renders this footer on every public page from the same JSON
// (src/app/core/content/site-footer.json). The audit checks the prerendered
// HTML: public pages carry every footer route as a plain, followable anchor;
// workspace and private routes render no footer at all.
export const siteFooterPath = path.join(srcDir, 'app', 'core', 'content', 'site-footer.json');
export const prerenderRoutesPath = path.join(srcDir, 'prerender.routes.txt');
export const SITE_FOOTER_MAX_ROUTES = 24;

const NOT_FOLLOWED = /\b(?:nofollow|sponsored|ugc)\b/;
const CLEAN_PATH = /^\/[a-z0-9/-]*$/;

export function readSiteFooter(file = siteFooterPath) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function readPrerenderRoutes(file = prerenderRoutesPath) {
  return new Set(fs.readFileSync(file, 'utf8').split(/\r?\n/).map((line) => line.trim()).filter(Boolean));
}

/** Internal routes the footer links, in render order. */
export function siteFooterRoutes(footer) {
  return [...footer.groups.flatMap((group) => group.links), ...footer.legal]
    .map((link) => link.route)
    .filter(Boolean);
}

export function siteFooterVisible(route, footer) {
  return !(footer.visibility?.hiddenRoutePatterns || []).some((pattern) => new RegExp(pattern).test(route));
}

/** The footer JSON itself: clean, prerendered, non-denied routes within the size limit. */
export function validateSiteFooter({ footer, prerenderRoutes = null }) {
  const failures = [];
  const routes = siteFooterRoutes(footer);
  const denied = new Set(footer.deniedRoutes || []);
  for (const route of routes) {
    if (!CLEAN_PATH.test(route)) failures.push(`footer route ${route} must be a clean path without a query or fragment`);
    if (denied.has(route)) failures.push(`footer route ${route} is denied`);
    if (prerenderRoutes && !prerenderRoutes.has(route)) failures.push(`footer route ${route} is not prerendered`);
  }
  if (new Set(routes).size !== routes.length) failures.push('footer routes repeat');
  if (routes.length > SITE_FOOTER_MAX_ROUTES) failures.push(`footer carries ${routes.length} internal routes, the limit is ${SITE_FOOTER_MAX_ROUTES}`);
  for (const link of [...footer.groups.flatMap((group) => group.links), ...footer.legal]) {
    if (!link.label?.trim()) failures.push(`footer link ${link.route || link.href} has no label`);
    if (!link.route && !link.href) failures.push(`footer link ${link.label} has neither a route nor an href`);
  }
  return failures;
}

const attrsOf = (node) => Object.fromEntries((node.attrs || []).map(({ name, value }) => [name, value]));

/** Every site footer in raw HTML with its anchors. */
export function inspectSiteFooters(html) {
  const footers = [];
  const visit = (node, current) => {
    const attrs = attrsOf(node);
    if (node.tagName === 'footer' && attrs['data-testid'] === 'site-footer') {
      current = { anchors: [] };
      footers.push(current);
    } else if (current && node.tagName === 'a' && attrs.href?.trim()) {
      current.anchors.push({ href: attrs.href.trim(), rel: (attrs.rel || '').toLowerCase() });
    }
    for (const child of node.childNodes || []) visit(child, current);
  };
  visit(parse(html), null);
  return footers;
}

export function auditSiteFooterHtml(html, { route, footer }) {
  const footers = inspectSiteFooters(html);
  if (!siteFooterVisible(route, footer)) {
    return footers.length ? [`${route}: renders the site footer on a workspace or private route`] : [];
  }
  if (footers.length !== 1) return [`${route}: expected exactly one site footer, found ${footers.length}`];

  const failures = [];
  const [found] = footers;
  for (const target of siteFooterRoutes(footer)) {
    const exact = found.anchors.filter((anchor) => anchor.href === target);
    if (!exact.length) {
      const dirty = found.anchors.find((anchor) => anchor.href.split(/[?#]/)[0] === target);
      failures.push(dirty
        ? `${route}: footer links ${target} only with a query or fragment (${dirty.href})`
        : `${route}: footer lacks a link to ${target}`);
      continue;
    }
    if (exact.every((anchor) => NOT_FOLLOWED.test(anchor.rel))) failures.push(`${route}: footer link to ${target} is not followable`);
  }
  for (const denied of footer.deniedRoutes || []) {
    if (found.anchors.some((anchor) => anchor.href.split(/[?#]/)[0] === denied)) failures.push(`${route}: footer links the denied route ${denied}`);
  }
  return failures;
}

function collectHtmlFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectHtmlFiles(full, out);
    else if (entry.isFile() && entry.name === 'index.html') out.push(full);
  }
  return out;
}

/** Every canonical, indexable prerendered page either carries the whole footer or, on workspace routes, none. */
export function auditSiteFooterLinks({ buildDir, canonicalBase = 'https://frontendatlas.com', footer = readSiteFooter(), prerenderRoutes = readPrerenderRoutes() } = {}) {
  canonicalBase = canonicalBase.replace(/\/+$/, '');
  const failures = validateSiteFooter({ footer, prerenderRoutes });
  let pagesChecked = 0;
  let pagesWithFooter = 0;
  for (const file of collectHtmlFiles(buildDir)) {
    const rel = path.relative(buildDir, path.dirname(file)).replace(/\\/g, '/');
    const route = rel ? `/${rel}` : '/';
    const html = fs.readFileSync(file, 'utf8');
    const page = parsePage(html, route, canonicalBase);
    if (!page.selfCanonical || !page.indexable) continue;
    pagesChecked += 1;
    if (siteFooterVisible(route, footer)) pagesWithFooter += 1;
    failures.push(...auditSiteFooterHtml(html, { route, footer }));
  }
  if (!pagesChecked) failures.push('no canonical, indexable prerendered pages were found');
  return { summary: { pagesChecked, pagesWithFooter, footerRoutes: siteFooterRoutes(footer).length }, failures };
}

function run() {
  const buildDir = path.resolve(process.env.SEO_BUILD_DIR || 'dist/frontendatlas/browser');
  try {
    const report = auditSiteFooterLinks({ buildDir, canonicalBase: process.env.SEO_CANONICAL_BASE || 'https://frontendatlas.com' });
    console.log(`[seo:site-footer] pagesChecked=${report.summary.pagesChecked} pagesWithFooter=${report.summary.pagesWithFooter} footerRoutes=${report.summary.footerRoutes}`);
    if (report.failures.length) {
      console.error(`[seo:site-footer] ${report.failures.length} failures:`);
      for (const failure of report.failures.slice(0, 50)) console.error(`  - ${failure}`);
      if (report.failures.length > 50) console.error(`  ... and ${report.failures.length - 50} more`);
      process.exitCode = 1;
    } else {
      console.log('[seo:site-footer] passed');
    }
  } catch (error) {
    console.error(`[seo:site-footer] ${error.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) run();
