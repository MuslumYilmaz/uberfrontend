#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { auditTechHubLinks, CONTEXTUAL_HUB_LINKS } from './audit-tech-hub-internal-links.mjs';

const BASE = 'https://frontendatlas.com';
const SOURCE = '/guide';
const TARGET = '/javascript/interview-questions';
const link = (href = TARGET, attrs = '') => `<a href="${href}" ${attrs}>JavaScript interview questions</a>`;

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

test('CLI validates the default editorial relationships and honors build/base overrides', (t) => {
  const f = fixture(t, CONTEXTUAL_HUB_LINKS);
  const canonicalBase = 'https://preview.example';
  for (const route of new Set(CONTEXTUAL_HUB_LINKS.flatMap(({ source, targets }) => [source, ...targets]))) {
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
