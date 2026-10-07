#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  auditTechHubLinks,
  CONTEXTUAL_HUB_LINKS,
  DEFAULT_LINK_CONTRACTS,
  mergeLinkContracts,
  PRIORITY_CONTENT_LINKS,
} from './audit-tech-hub-internal-links.mjs';

const BASE = 'https://frontendatlas.com';
const SOURCE = '/guide';
const TARGET = '/javascript/interview-questions';
const HTML_HUB = '/html/interview-questions';
const CSS_HUB = '/css/interview-questions';
const HTML_CSS_HUB = '/html-css/interview-questions';
const CSS_CODING_DETAIL = '/css/coding/example';
const CSS_TRIVIA_DETAIL = '/css/trivia/example';
const HTML_CODING_DETAIL = '/html/coding/example';
const HTML_TRIVIA_DETAIL = '/html/trivia/example';
const link = (href = TARGET, attrs = '') => `<a href="${href}" ${attrs}>JavaScript interview questions</a>`;

function dedicatedCssSchema(base = BASE) {
  return `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [{
      '@type': 'WebPage',
      name: 'Dedicated CSS interview questions',
      url: `${base}${CSS_HUB}`,
    }],
  })}</script>`;
}

function combinedHubBody({ cta = true, marker = true, schema = true } = {}) {
  const ctaAttrs = marker ? 'data-testid="html-css-dedicated-css-link"' : '';
  return `${schema ? dedicatedCssSchema() : ''}<main>${cta ? link(CSS_HUB, ctaAttrs) : ''}</main>`;
}

function prepEntry(kind, body) {
  // The nav wrapper mirrors the coding prerender context that prompted this guard.
  return `<nav><section data-testid="${kind}-prep-entry">${body}</section></nav>`;
}

function fixture(t, contracts = [{ source: SOURCE, targets: [TARGET] }]) {
  const buildDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fa-contextual-hubs-'));
  t.after(() => fs.rmSync(buildDir, { recursive: true, force: true }));
  const robots = (rules = '') => fs.writeFileSync(path.join(buildDir, 'robots.txt'), `User-agent: *\nAllow: /\n${rules}`);
  const page = (route, body = '', { canonical = `${BASE}${route}`, directives = 'index,follow' } = {}) => {
    const directory = path.join(buildDir, route.slice(1));
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'index.html'), `<html><head><base href="/"><link rel="canonical" href="${canonical}"><meta name="robots" content="${directives}"></head><body>${body}</body></html>`);
  };
  robots();
  for (const route of new Set(contracts.flatMap(({ source, targets }) => [source, ...targets]))) page(route);
  for (const { source, targets } of contracts) page(source, `<main>${targets.map((target) => link(target)).join('')}</main>`);
  return { buildDir, page, robots, audit: () => auditTechHubLinks({ buildDir, contracts }) };
}

function ownershipFixture(t) {
  const f = fixture(t, [{ source: HTML_CSS_HUB, targets: [CSS_HUB] }]);
  f.page(HTML_HUB);
  f.page(HTML_CSS_HUB, combinedHubBody());
  return f;
}

function addValidOwnershipDetails(f) {
  f.page(CSS_CODING_DETAIL, prepEntry('coding', link(CSS_HUB)));
  f.page(CSS_TRIVIA_DETAIL, prepEntry('trivia', link(CSS_HUB)));
  f.page(HTML_CODING_DETAIL, prepEntry('coding', `${link(HTML_HUB)}${link(HTML_CSS_HUB)}`));
  f.page(HTML_TRIVIA_DETAIL, prepEntry('trivia', `${link(HTML_HUB)}${link(HTML_CSS_HUB)}`));
}

test('counts distinct eligible sources while preserving content, navigation and raw diagnostics', (t) => {
  const f = fixture(t);
  f.page(SOURCE, `<main>${link()}${link()}</main><nav>${link()}</nav>`);
  f.page('/other', `<article>${link(`${BASE}${TARGET}`)}</article>`);
  f.page('/private', link(), { directives: 'noindex,follow' });
  f.page(TARGET, link());
  const report = f.audit();
  assert.deepEqual(report.failures, []);
  assert.deepEqual(report.targets, [{ route: TARGET, rawAnchors: 6, uniqueSources: 2, contentSources: 2, navigationSources: 1 }]);
});

for (const [name, body] of [
  ['navigation only', `<nav>${link()}</nav>`],
  ['complementary role only', `<div role="complementary">${link()}</div>`],
  ['mobile navigation only', `<div data-trivia-link-zone="mobile_nav">${link()}</div>`],
  ['query only', link(`${TARGET}?ref=guide`)],
  ['fragment only', link(`${TARGET}#answers`)],
  ['trailing slash alias', link(`${TARGET}/`)],
  ['nofollow', link(TARGET, 'rel="nofollow"')],
  ['sponsored', link(TARGET, 'rel="sponsored"')],
  ['UGC', link(TARGET, 'rel="ugc"')],
  ['external URL', link(`https://other.example${TARGET}`)],
  ['comment, script and template pseudo-links', `<!-- ${link()} --><script>const example = '${link()}';</script><template>${link()}</template>`],
]) {
  test(`${name} cannot satisfy the contextual link contract`, (t) => {
    const f = fixture(t);
    f.page(SOURCE, body);
    assert.deepEqual(f.audit().failures, [`${SOURCE} lacks a clean, followable content link to ${TARGET}`]);
  });
}

for (const role of ['source', 'target']) {
  for (const [name, options] of [
    ['noindex', { directives: 'noindex,follow' }],
    ['nofollow', { directives: 'index,nofollow' }],
    ['canonical alias', { canonical: `${BASE}/another-page` }],
  ]) {
    test(`${name} ${role} cannot provide a public contextual relationship`, (t) => {
      const f = fixture(t);
      const route = role === 'source' ? SOURCE : TARGET;
      f.page(route, role === 'source' ? link() : '', options);
      const report = f.audit();
      assert.deepEqual(report.failures, [`${role} must be canonical, indexable, followable and crawlable: ${route}`]);
      assert.equal(report.targets[0].uniqueSources, 0);
    });
  }
  test(`robots-blocked ${role} cannot provide a public contextual relationship`, (t) => {
    const f = fixture(t);
    const route = role === 'source' ? SOURCE : TARGET;
    f.robots(`Disallow: ${route}\n`);
    assert.deepEqual(f.audit().failures, [`${role} must be canonical, indexable, followable and crawlable: ${route}`]);
  });
  test(`missing ${role} fails rather than accepting a dangling or absent relationship`, (t) => {
    const f = fixture(t);
    const route = role === 'source' ? SOURCE : TARGET;
    fs.rmSync(path.join(f.buildDir, route.slice(1), 'index.html'));
    assert.deepEqual(f.audit().failures, [`missing prerender ${role} ${route}`]);
  });
}

test('a valid content link can coexist with navigation, tracking and nofollow variants', (t) => {
  const f = fixture(t);
  f.page(SOURCE, `<header>${link()}</header><main>${link()}${link(`${TARGET}?ref=guide`)}${link(TARGET, 'rel="nofollow"')}</main>`);
  assert.deepEqual(f.audit().failures, []);
  assert.equal(f.audit().targets[0].contentSources, 1);
});

test('enforces CSS-only ownership while preserving HTML and combined-hub journeys', (t) => {
  const f = ownershipFixture(t);
  addValidOwnershipDetails(f);
  assert.deepEqual(f.audit().failures, []);
});

test('CSS coding and trivia details need a clean dedicated CSS-hub prep-entry link', (t) => {
  const f = ownershipFixture(t);
  addValidOwnershipDetails(f);
  f.page(CSS_TRIVIA_DETAIL, prepEntry('trivia', link(`${CSS_HUB}?ref=trivia`)));
  assert.deepEqual(f.audit().failures, [
    `CSS detail ${CSS_TRIVIA_DETAIL} lacks a clean, followable trivia-prep-entry link to ${CSS_HUB}`,
  ]);
});

test('CSS details cannot retain a combined HTML/CSS link, including a nofollow query variant', (t) => {
  const f = ownershipFixture(t);
  addValidOwnershipDetails(f);
  f.page(CSS_CODING_DETAIL, `${prepEntry('coding', link(CSS_HUB))}<main>${link(`${HTML_CSS_HUB}?ref=css`, 'rel="nofollow"')}</main>`);
  assert.deepEqual(f.audit().failures, [
    `CSS detail ${CSS_CODING_DETAIL} must not link to ${HTML_CSS_HUB}`,
  ]);
});

test('HTML details must retain both their dedicated hub and the combined HTML/CSS hub', (t) => {
  const f = ownershipFixture(t);
  addValidOwnershipDetails(f);
  f.page(HTML_CODING_DETAIL, prepEntry('coding', link(HTML_CSS_HUB)));
  f.page(HTML_TRIVIA_DETAIL, prepEntry('trivia', link(HTML_HUB)));
  assert.deepEqual(f.audit().failures, [
    `HTML detail ${HTML_CODING_DETAIL} lacks a clean, followable coding-prep-entry link to ${HTML_HUB}`,
    `HTML detail ${HTML_TRIVIA_DETAIL} lacks a clean, followable trivia-prep-entry link to ${HTML_CSS_HUB}`,
  ]);
});

test('detail hub links outside the prep entry cannot satisfy CSS ownership', (t) => {
  const f = ownershipFixture(t);
  addValidOwnershipDetails(f);
  f.page(CSS_CODING_DETAIL, `<main>${link(CSS_HUB)}</main>`);
  assert.deepEqual(f.audit().failures, [
    `CSS detail ${CSS_CODING_DETAIL} lacks a clean, followable coding-prep-entry link to ${CSS_HUB}`,
  ]);
});

test('does not apply CSS ownership requirements to noindex details', (t) => {
  const f = ownershipFixture(t);
  addValidOwnershipDetails(f);
  f.page(CSS_CODING_DETAIL, prepEntry('coding', link(HTML_CSS_HUB)), { directives: 'noindex,follow' });
  assert.deepEqual(f.audit().failures, []);
});

test('requires the combined hub dedicated CSS CTA marker and WebPage schema mention', (t) => {
  const f = ownershipFixture(t);
  addValidOwnershipDetails(f);
  f.page(HTML_CSS_HUB, combinedHubBody({ marker: false, schema: false }));
  assert.deepEqual(f.audit().failures, [
    `${HTML_CSS_HUB} lacks the dedicated CSS CTA marker and clean target`,
    `${HTML_CSS_HUB} lacks the dedicated CSS WebPage schema mention`,
  ]);
});

test('default contracts keep one entry per source and add the priority pages to home and /coding', () => {
  const sources = DEFAULT_LINK_CONTRACTS.map(({ source }) => source);
  assert.equal(new Set(sources).size, sources.length);
  for (const source of ['/', '/coding']) {
    const hubs = CONTEXTUAL_HUB_LINKS.find((contract) => contract.source === source).targets;
    const priority = PRIORITY_CONTENT_LINKS.find((contract) => contract.source === source).targets;
    assert(priority.length > 0);
    assert.deepEqual(DEFAULT_LINK_CONTRACTS.find((contract) => contract.source === source).targets, [...hubs, ...priority]);
  }
  assert.deepEqual(mergeLinkContracts(
    [{ source: '/a', targets: ['/x', '/y'] }],
    [{ source: '/a', targets: ['/y', '/z'] }, { source: '/b', targets: ['/x'] }],
  ), [{ source: '/a', targets: ['/x', '/y', '/z'] }, { source: '/b', targets: ['/x'] }]);
});

test('a priority page that loses its home link fails the default contract', (t) => {
  const [home] = PRIORITY_CONTENT_LINKS;
  const contracts = [{ source: home.source, targets: home.targets.slice(0, 2) }];
  const f = fixture(t, contracts);
  f.page(home.source, `<main>${link(contracts[0].targets[0])}</main><nav>${link(contracts[0].targets[1])}</nav>`);
  assert.deepEqual(f.audit().failures, [
    `${home.source} lacks a clean, followable content link to ${contracts[0].targets[1]}`,
  ]);
});

test('CLI validates the default editorial relationships and honors build/base overrides', (t) => {
  const f = fixture(t, DEFAULT_LINK_CONTRACTS);
  f.page(HTML_CSS_HUB, combinedHubBody());
  const routes = new Set(DEFAULT_LINK_CONTRACTS.flatMap(({ source, targets }) => [source, ...targets]));
  // Priority targets include HTML/CSS details, which must keep their hub ownership links.
  for (const route of routes) {
    const match = /^\/(html|css)\/(coding|trivia)\/[^/]+$/.exec(route);
    if (!match) continue;
    const [, tech, kind] = match;
    f.page(route, prepEntry(kind, tech === 'css' ? link(CSS_HUB) : `${link(HTML_HUB)}${link(HTML_CSS_HUB)}`));
  }
  const canonicalBase = 'https://preview.example';
  for (const route of routes) {
    const file = path.join(f.buildDir, route.slice(1), 'index.html');
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replaceAll(BASE, canonicalBase));
  }
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('./audit-tech-hub-internal-links.mjs', import.meta.url))], {
    encoding: 'utf8',
    env: { ...process.env, SEO_BUILD_DIR: f.buildDir, SEO_CANONICAL_BASE: canonicalBase },
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /\[seo:tech-hub-links\] passed/);
});
