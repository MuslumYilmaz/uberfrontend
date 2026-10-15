#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'parse5';
import { parsePage } from './audit-internal-link-equity.mjs';
import { prepMenuRoutes, readPrepMenu } from './prep-menu.mjs';

// Each header renders the shared prep menu inside a <nav> with this id.
const MENU_ID_BY_HEADER = { 'app-header': 'prepare-mega', 'app-marketing-header': 'marketing-prep-menu' };
// Links the headers render outside the menu in initial HTML: the logo and the question hub.
export const HEADER_TOP_LEVEL_ROUTES = Object.freeze(['/', '/interview-questions']);

const NOT_FOLLOWED = /\b(?:nofollow|sponsored|ugc)\b/;

function collectHtmlFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectHtmlFiles(full, out);
    else if (entry.isFile() && entry.name === 'index.html') out.push(full);
  }
  return out;
}

const attrsOf = (node) => Object.fromEntries((node.attrs || []).map(({ name, value }) => [name, value]));

/** Headers in raw HTML with their anchors and the hidden state of their prep menu. */
export function inspectHeaders(html) {
  const headers = [];
  const visit = (node, header) => {
    let current = header;
    if (node.tagName && Object.hasOwn(MENU_ID_BY_HEADER, node.tagName)) {
      current = { tag: node.tagName, anchors: [], menu: null };
      headers.push(current);
    }
    if (current && node.tagName === 'nav') {
      const attrs = attrsOf(node);
      if (attrs.id === MENU_ID_BY_HEADER[current.tag]) current.menu = { hidden: Object.hasOwn(attrs, 'hidden') };
    }
    if (current && node.tagName === 'a') {
      const attrs = attrsOf(node);
      if (attrs.href?.trim()) current.anchors.push({ href: attrs.href.trim(), rel: (attrs.rel || '').toLowerCase() });
    }
    for (const child of node.childNodes || []) visit(child, current);
  };
  visit(parse(html), null);
  return headers;
}

export function auditPrepMenuHtml(html, { route, routes }) {
  const headers = inspectHeaders(html);
  if (headers.length !== 1) return [`${route}: expected exactly one header, found ${headers.length}`];

  const failures = [];
  const [header] = headers;
  if (!header.menu) failures.push(`${route}: ${header.tag} does not render the prep menu`);
  else if (!header.menu.hidden) failures.push(`${route}: the prep menu is not hidden in initial HTML`);

  for (const target of [...HEADER_TOP_LEVEL_ROUTES, ...routes]) {
    const exact = header.anchors.filter((anchor) => anchor.href === target);
    if (!exact.length) {
      const dirty = header.anchors.find((anchor) => anchor.href.split(/[?#]/)[0] === target);
      failures.push(dirty
        ? `${route}: header links ${target} only with a query or fragment (${dirty.href})`
        : `${route}: header lacks a link to ${target}`);
      continue;
    }
    if (exact.every((anchor) => NOT_FOLLOWED.test(anchor.rel))) failures.push(`${route}: header link to ${target} is not followable`);
  }
  return failures;
}

/** Every canonical, indexable prerendered page must carry the full header link set in initial HTML. */
export function auditPrepMenuLinks({ buildDir, canonicalBase = 'https://frontendatlas.com', menu = readPrepMenu() } = {}) {
  canonicalBase = canonicalBase.replace(/\/+$/, '');
  const routes = prepMenuRoutes(menu);
  const failures = [];
  let pagesChecked = 0;
  for (const file of collectHtmlFiles(buildDir)) {
    const rel = path.relative(buildDir, path.dirname(file)).replace(/\\/g, '/');
    const route = rel ? `/${rel}` : '/';
    const html = fs.readFileSync(file, 'utf8');
    const page = parsePage(html, route, canonicalBase);
    if (!page.selfCanonical || !page.indexable) continue;
    pagesChecked += 1;
    failures.push(...auditPrepMenuHtml(html, { route, routes }));
  }
  if (!pagesChecked) failures.push('no canonical, indexable prerendered pages were found');
  return { summary: { pagesChecked, menuRoutes: routes.length }, failures };
}

function run() {
  const buildDir = path.resolve(process.env.SEO_BUILD_DIR || 'dist/frontendatlas/browser');
  try {
    const report = auditPrepMenuLinks({ buildDir, canonicalBase: process.env.SEO_CANONICAL_BASE || 'https://frontendatlas.com' });
    console.log(`[seo:prep-menu] pagesChecked=${report.summary.pagesChecked} menuRoutes=${report.summary.menuRoutes}`);
    if (report.failures.length) {
      console.error(`[seo:prep-menu] ${report.failures.length} failures:`);
      for (const failure of report.failures.slice(0, 50)) console.error(`  - ${failure}`);
      if (report.failures.length > 50) console.error(`  ... and ${report.failures.length - 50} more`);
      process.exitCode = 1;
    } else {
      console.log('[seo:prep-menu] passed');
    }
  } catch (error) {
    console.error(`[seo:prep-menu] ${error.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) run();
