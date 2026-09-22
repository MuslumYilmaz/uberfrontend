#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { auditBuild, parsePage } from './audit-internal-link-equity.mjs';
import { createRobotsPolicy } from './internal-link-robots.mjs';
import { cdnPracticeRegistryPath, frontendRoot } from './content-paths.mjs';
import { shouldIncludeRegistryDetailInSitemap } from './registry-detail-access-policy.mjs';
import { buildFrameworkFamilyByIdMap } from './gen-showcase-stats.mjs';

const BASE = 'https://frontendatlas.com';
const link = (route, attrs = '') => `<a href="${route}" ${attrs}>Question</a>`;
const companyLink = (route, count) => `<a href="${route}">${count} editorial practice prompts</a>`;
function fixture(t, routes = ['/', '/article']) {
  const buildDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fa-link-equity-'));
  t.after(() => fs.rmSync(buildDir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(buildDir, 'robots.txt'), 'User-agent: *\nAllow: /\n');
  fs.writeFileSync(path.join(buildDir, 'sitemap.xml'), `<urlset>${routes.map((route) => `<url><loc>${BASE}${route}</loc></url>`).join('')}</urlset>`);
  const page = (route, body = '', options = {}) => {
    const folder = path.join(buildDir, route.slice(1));
    fs.mkdirSync(folder, { recursive: true });
    const canonical = options.canonical ?? `${BASE}${route}`;
    fs.writeFileSync(path.join(folder, 'index.html'), `<html><head><base href="/"><meta name="robots" content="${options.robots ?? 'index,follow'}"><link rel="canonical" href="${canonical}">${options.head || ''}</head><body>${body}</body></html>`);
  };
  routes.forEach((route) => page(route));
  const audit = (options = {}) => auditBuild({ buildDir, registry: [], ...options });
  return { buildDir, page, audit };
}
const failures = (report) => report.failures.join('\n');

test('deduplicates incoming source pairs while preserving content/navigation and raw diagnostics', (t) => {
  const f = fixture(t);
  f.page('/', `${link('/article')}<div role="banner">${link('/article')}${link('/article')}</div><footer>${link('/article')}</footer>`);
  f.page('/article', `${link('/article')}${link('/article#answer')}${link('#answer')}`);
  const report = f.audit();
  assert.deepEqual(report.failures, []);
  assert.equal(report.summary.uniqueEdges, 1);
  assert.deepEqual(report.depths.find((row) => row.route === '/article'), { route: '/article', depth: 1, incomingSources: 1, contentSources: 1, navigationSources: 1 });
  assert.equal(report.targets.find((row) => row.route === '/article').rawAnchors, 6);
});

test('does not count noindex, canonical alias, blocked or nofollow sources', (t) => {
  const f = fixture(t);
  f.page('/', link('/auth/login'));
  f.page('/auth/login', link('/article'), { robots: 'noindex,follow' });
  f.page('/alias', link('/article'), { canonical: `${BASE}/` });
  f.page('/blocked', link('/article'));
  f.page('/nofollow', link('/article'), { robots: 'index,nofollow' });
  fs.writeFileSync(path.join(f.buildDir, 'robots.txt'), 'User-agent: *\nDisallow: /blocked\n');
  const report = f.audit();
  assert.match(failures(report), /Orphan sitemap page: \/article/);
  assert.equal(report.targets.find((row) => row.route === '/article').uniqueSources, 0);
  assert.deepEqual(report.excludedSources, ['/alias', '/auth/login', '/blocked']);
});

test('disconnected cycles have inbound links but fail homepage reachability', (t) => {
  const f = fixture(t, ['/', '/one', '/two']);
  f.page('/one', link('/two'));
  f.page('/two', link('/one'));
  const report = f.audit();
  assert.deepEqual(report.orphanRoutes, []);
  assert.deepEqual(report.unreachableRoutes, ['/one', '/two']);
});

test('self-links, fragments, nofollow and script/template pseudo-links cannot rescue an orphan', (t) => {
  const f = fixture(t);
  f.page('/', `${link('/article', 'rel="nofollow"')}<!-- ${link('/article')} --><script>const html = '${link('/article')}';</script><template>${link('/article')}</template>`);
  f.page('/article', `${link('/article')}${link('/article#answer')}`);
  assert.deepEqual(f.audit().orphanRoutes, ['/article']);
});

test('HTML parsing supports entities, unquoted hrefs, base URLs and disclosure contents', () => {
  const page = parsePage(`<base href="/"><link href="${BASE}/article" rel="canonical"><aside><a HREF=/other>Other</a></aside><details data-testid="public-question-directory"><a href="/article?one=1&amp;two=2">Answer</a></details><div data-trivia-link-zone="mobile_nav"><a href="/next">Next</a></div><a href="//outside.example/test">External</a>`, '/article', BASE);
  assert.equal(page.anchors.length, 3);
  assert.equal(page.anchors[0].zone, 'navigation');
  assert.equal(page.anchors[1].rawHref, '/article?one=1&two=2');
  assert.equal(page.anchors[1].directory, true);
  assert.equal(page.anchors[2].zone, 'navigation');
});

for (const [name, options, pattern] of [
  ['noindex', { robots: 'noindex,follow' }, /Sitemap page is noindex: \/article/],
  ['canonical alias', { canonical: `${BASE}/` }, /Sitemap page has invalid canonical: \/article/],
  ['duplicate canonical', { head: `<link rel="canonical" href="${BASE}/article">` }, /Sitemap page has invalid canonical: \/article/],
  ['Googlebot noindex', { head: '<meta content="noindex" name="Googlebot">' }, /Sitemap page is noindex: \/article/],
]) test(`sitemap cannot contain ${name} pages`, (t) => {
  const f = fixture(t);
  f.page('/', link('/article'));
  f.page('/article', '', options);
  assert.match(failures(f.audit()), pattern);
});

test('missing HTML and robots-blocked sitemap pages fail', (t) => {
  const f = fixture(t, ['/', '/blocked', '/missing']);
  f.page('/', link('/blocked'));
  fs.rmSync(path.join(f.buildDir, 'missing'), { recursive: true });
  fs.writeFileSync(path.join(f.buildDir, 'robots.txt'), 'User-agent: *\nDisallow: /blocked\n');
  const report = f.audit();
  assert.match(failures(report), /Missing prerendered sitemap page: \/missing/);
  assert.match(failures(report), /Sitemap page is blocked by robots: \/blocked/);
});

test('canonical alias links fail instead of creating direct graph edges', (t) => {
  const f = fixture(t);
  f.page('/', link('/alias'));
  f.page('/alias', link('/article'), { canonical: `${BASE}/article` });
  const report = f.audit();
  assert.match(failures(report), /Public link points to canonical alias: \/ -> \/alias/);
  assert.equal(report.aliasLinks[0].canonical, `${BASE}/article`);
  assert.deepEqual(report.orphanRoutes, ['/article']);
});

test('raw query matching detects robots conflicts even when clean target is allowed', (t) => {
  const f = fixture(t, ['/', '/tracks/example/preview']);
  f.page('/', `${link('/tracks/example/preview')}${link('/tracks/example/preview?entry=home&amp;variant=a')}`);
  fs.writeFileSync(path.join(f.buildDir, 'robots.txt'), 'User-agent: *\nDisallow: /tracks/\nAllow: /tracks/*/preview$\n');
  const report = f.audit();
  assert.equal(report.summary.orphanPages, 0);
  assert.match(failures(report), /Public link blocked by robots: \/ -> \/tracks\/example\/preview\?entry=home&variant=a/);
  fs.appendFileSync(path.join(f.buildDir, 'robots.txt'), 'Allow: /tracks/*/preview?\n');
  assert.deepEqual(f.audit().failures, []);
});

test('query-only URLs do not mask a missing canonical anchor; auth/premium links are informational', (t) => {
  const f = fixture(t);
  f.page('/', `${link('/article?ref=home')}${link('/auth/login?return=/article')}${link('/javascript/coding/paid')}${link('/companies/meta')}`);
  f.page('/javascript/coding/paid', '', { robots: 'noindex,follow' });
  fs.writeFileSync(path.join(f.buildDir, 'robots.txt'), 'User-agent: *\nDisallow: /auth/\nDisallow: /companies/\n');
  const report = f.audit({ registry: [{ route: '/javascript/coding/paid', access: 'premium', tech: 'javascript' }] });
  assert.deepEqual(report.orphanRoutes, ['/article']);
  assert.equal(report.queryLinks.length, 1);
  assert.equal(report.blockedPublicLinks.length, 0);
  assert.equal(report.legitimateNonPublicLinks.length, 3);
});

test('critical hubs at depth 3 fail; ordinary deep pages are reported', (t) => {
  const f = fixture(t, ['/', '/one', '/two', '/tradeoffs', '/deep']);
  f.page('/', link('/one')); f.page('/one', link('/two')); f.page('/two', link('/tradeoffs')); f.page('/tradeoffs', link('/deep'));
  const report = f.audit();
  assert.match(failures(report), /Critical hub exceeds depth 2: \/tradeoffs \(depth=3\)/);
  assert.deepEqual(report.deepRoutes.map((row) => row.route), ['/deep']);
});

test('public directories must contain every free question and exclude premium questions', (t) => {
  const question = '/javascript/trivia/free', premium = '/javascript/trivia/paid', hub = '/javascript/interview-questions';
  const registry = [{ route: question, tech: 'javascript', access: 'free' }, { route: premium, tech: 'javascript', access: 'premium' }];
  const f = fixture(t, ['/', hub, question]);
  f.page('/', link(hub)); f.page(hub, link(question));
  assert.match(failures(f.audit({ registry })), /Public question directory incomplete/);
  f.page(hub, `<details data-testid="public-question-directory">${link(question)}${link(premium)}</details>`);
  assert.match(failures(f.audit({ registry })), /contains non-public or unrelated targets/);
  f.page(hub, `<details data-testid="public-question-directory">${link(question)}</details>`);
  assert.deepEqual(f.audit({ registry }).failures, []);
  f.page('/', link('/one')); f.page('/one', link('/two')); f.page('/two', link(hub));
  assert.match(failures(f.audit({ registry })), /Public question exceeds depth 3: \/javascript\/trivia\/free \(depth=4\)/);
});

test('generic company sample/count hydration shells fail and authored previews preserve their contract', (t) => {
  const route = '/companies/meta/preview', authored = '/companies/google/preview';
  const f = fixture(t, ['/', '/companies', route, authored]);
  const companySamples = new Map([['meta', { count: 2, requiredIds: new Set(['one', 'two']) }]]);
  const companyCounts = { meta: { all: 2, coding: 2, trivia: 0, system: 0 }, google: { all: 1, coding: 1, trivia: 0, system: 0 } };
  const audit = () => f.audit({ companySamples, companyCounts });
  f.page('/', link('/companies'));
  f.page('/companies', `<section data-testid="company-index-list">${companyLink(route, 2)}${companyLink(authored, 1)}</section>`);
  assert.match(failures(audit()), /Company preview missing or unexpected initial-HTML samples/);
  const preview = '<span class="preview-chip">2 editorial practice prompts</span><span data-testid="company-preview-counts">Coding 2 · Concepts 0 · System 0</span><div data-testid="company-preview-question-one"></div><div data-testid="company-preview-question-two"></div>';
  f.page(route, preview);
  assert.deepEqual(audit().failures, []);
  f.page(route, preview.replace('Coding 2', 'Coding 999'));
  assert.match(failures(audit()), /Company preview count mismatch/);
  assert.equal(audit().companyCoverage[0].actualSamples, 2, 'Stale totals must fail even while samples are complete');
  f.page(route, preview);
  f.page('/companies', `<section data-testid="company-index-list">${companyLink(route, 999)}${companyLink(authored, 1)}</section>`);
  assert.match(failures(audit()), /Company directory count mismatch/);
  f.page('/companies', link(route) + link(authored));
  assert.match(failures(audit()), /Company directory missing initial-HTML link/);
});

test('company counts deduplicate framework families while preview samples retain each variant', (t) => {
  const route = '/companies/meta/preview';
  const f = fixture(t, ['/', '/companies', route]);
  const questionsDir = path.join(f.buildDir, 'catalog');
  for (const [tech, id] of [['react', 'react-counter'], ['angular', 'angular-counter-starter']]) {
    fs.mkdirSync(path.join(questionsDir, tech), { recursive: true });
    fs.writeFileSync(path.join(questionsDir, tech, 'coding.json'), JSON.stringify([{ id, title: 'Counter', companies: ['meta'] }]));
  }
  f.page('/', link('/companies'));
  f.page('/companies', `<section data-testid="company-index-list">${companyLink(route, 1)}</section>`);
  const preview = '<span class="preview-chip">1 editorial practice prompt</span><span data-testid="company-preview-counts">Coding 1 · Concepts 0 · System 0</span><div data-testid="company-preview-question-react-counter"></div><div data-testid="company-preview-question-angular-counter-starter"></div>';
  f.page(route, preview);
  assert.deepEqual(f.audit({ questionsDir }).failures, []);
  f.page(route, preview.replace('Coding 1', 'Coding 2'));
  assert.match(failures(f.audit({ questionsDir })), /Company preview count mismatch/);
});

test('framework family source parsing accepts the trailing comma used by the app registry', () => {
  const families = buildFrameworkFamilyByIdMap(`export const FRAMEWORK_FAMILIES = [
    { key: 'counter', members: [
      { tech: 'react', id: 'react-counter', kind: 'coding' },
      { tech: 'angular', id: 'angular-counter-starter', kind: 'coding' },
    ], },
    { key: 'other', members: [{ tech: 'vue', id: 'vue-other', kind: 'coding' }] },
  ];`);
  assert.deepEqual([...families], [['react-counter', 'counter'], ['angular-counter-starter', 'counter'], ['vue-other', 'other']]);
});

test('sitemap index validates every shard rather than only the first', (t) => {
  const f = fixture(t, ['/']);
  fs.writeFileSync(path.join(f.buildDir, 'sitemap-index.xml'), `<sitemapindex><sitemap><loc>${BASE}/sitemap.xml</loc></sitemap><sitemap><loc>${BASE}/sitemap-2.xml</loc></sitemap></sitemapindex>`);
  fs.writeFileSync(path.join(f.buildDir, 'sitemap-2.xml'), `<urlset><url><loc>${BASE}/missing</loc></url></urlset>`);
  assert.match(failures(f.audit()), /Missing prerendered sitemap page: \/missing/);
});

test('repository robots allows clean/parameterized previews without exposing private routes', () => {
  const allows = createRobotsPolicy(fs.readFileSync(path.join(frontendRoot, 'src', 'robots.txt'), 'utf8'));
  for (const family of ['companies', 'tracks']) {
    assert.equal(allows(`/${family}/example/preview`), true);
    assert.equal(allows(`/${family}/example/preview?entry=x&v=2`), true);
    for (const suffix of ['', '/preview-extra', '/preview/child']) assert.equal(allows(`/${family}/example${suffix}`), false);
  }
  assert.equal(allows('/auth/login'), false);
  assert.equal(allows('/dashboard'), false);
});

test('robots combines matching groups, prefers Allow ties and respects specific agent policy', () => {
  const allows = createRobotsPolicy('User-agent: *\nDisallow: /\nUser-agent: Googlebot\nDisallow: /private\nUser-agent: Googlebot\nAllow: /private\nDisallow: /secret\n');
  assert.equal(allows('/'), true);
  assert.equal(allows('/private'), true);
  assert.equal(allows('/secret'), false);
});

test('CLI preserves build/output envs; historical link quotas never fail a healthy graph', (t) => {
  const registry = JSON.parse(fs.readFileSync(cdnPracticeRegistryPath, 'utf8')).filter((q) => /^\/(javascript|angular|react|vue|html|css)\/(coding|trivia|debug)\/[^/]+$/.test(q.route) && shouldIncludeRegistryDetailInSitemap(q.route, q.access));
  const hubs = [...new Set(registry.map((q) => `/${q.tech}/interview-questions`))];
  const f = fixture(t, ['/', '/pricing', ...hubs, ...registry.map((q) => q.route)]);
  f.page('/', hubs.map((hub) => link(hub)).join('') + link('/pricing').repeat(4));
  for (const hub of hubs) f.page(hub, `<details data-testid="public-question-directory">${registry.filter((q) => hub === `/${q.tech}/interview-questions`).map((q) => link(q.route)).join('')}</details>`);
  const output = path.join(f.buildDir, 'report.json');
  const result = spawnSync(process.execPath, [path.join(frontendRoot, 'scripts/audit-internal-link-equity.mjs')], { cwd: frontendRoot, encoding: 'utf8', env: {
    ...process.env, SEO_BUILD_DIR: f.buildDir, SEO_LINK_EQUITY_OUTPUT: output, SEO_STRATEGIC_MIN_LINKS: '999999', SEO_TECH_HUB_MIN_LINKS: '99999', SEO_PRICING_MAX_LINKS: '1', SEO_TOP_TRIVIA_MAX: '0', SEO_TRIVIA_INBOUND_CAP: '0',
  } });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /legacy quotas \(informational only\)/);
  assert.match(result.stdout, /\[seo:link-equity\] passed/);
  const report = JSON.parse(fs.readFileSync(output, 'utf8'));
  assert.equal(report.summary.publicQuestions, registry.length);
  assert.equal(report.summary.orphanPages, 0);
});
