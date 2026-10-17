import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  auditSiteFooterHtml,
  auditSiteFooterLinks,
  inspectSiteFooters,
  readPrerenderRoutes,
  readSiteFooter,
  siteFooterRoutes,
  siteFooterVisible,
  validateSiteFooter,
} from './audit-site-footer-links.mjs';

const BASE = 'https://frontendatlas.com';
const footer = {
  groups: [
    { id: 'practice', title: 'Practice', links: [{ label: 'Question library', route: '/coding' }, { label: 'Study plans', route: '/tracks' }] },
    { id: 'frontendatlas', title: 'FrontendAtlas', links: [{ label: 'Pricing', route: '/pricing' }, { label: 'GitHub', href: 'https://github.com/x/y', external: true }] },
  ],
  legal: [{ label: 'Terms', route: '/legal/terms' }],
  visibility: {
    hiddenRoutePatterns: ['^/auth(?:/|$)', '^/(?:javascript|react)/coding/[^/]+/?$'],
    practiceBarRoutePatterns: ['^/(?:javascript|react)/trivia/[^/]+/?$'],
  },
  deniedRoutes: ['/guides', '/html-css/interview-questions'],
};
const ROUTES = ['/coding', '/tracks', '/pricing', '/legal/terms'];

function siteFooter({ links = ROUTES, extra = '' } = {}) {
  const items = links.map((route) => `<li><a href="${route}">${route}</a></li>`).join('');
  return `<footer class="site-footer" data-testid="site-footer" data-nosnippet><nav aria-label="Site"><ul>${items}</ul></nav>`
    + `<a href="https://github.com/x/y" target="_blank" rel="noopener noreferrer">GitHub</a>${extra}</footer>`;
}

function page(route, body, { robots = 'index,follow', canonical = `${BASE}${route}` } = {}) {
  return `<!doctype html><html><head><link rel="canonical" href="${canonical}"><meta name="robots" content="${robots}"></head>`
    + `<body><header><a href="/">FrontendAtlas</a></header><main><h1>${route}</h1><a href="/elsewhere?x=1">content</a></main>${body}</body></html>`;
}

test('lists the internal footer routes in render order and decides visibility per route', () => {
  assert.deepEqual(siteFooterRoutes(footer), ROUTES);
  assert.equal(siteFooterVisible('/coding', footer), true);
  assert.equal(siteFooterVisible('/javascript/trivia/js-event-loop', footer), true);
  assert.equal(siteFooterVisible('/javascript/coding/js-throttle', footer), false);
  assert.equal(siteFooterVisible('/auth/login', footer), false);
});

test('reads the site footer and its anchors from raw HTML', () => {
  const [found] = inspectSiteFooters(page('/x', siteFooter()));
  assert.deepEqual(found.anchors.map((anchor) => anchor.href), [...ROUTES, 'https://github.com/x/y']);
  assert.deepEqual(inspectSiteFooters(page('/x', '<footer class="practice-bar"><a href="/coding">Prev</a></footer>')), []);
});

test('passes when a public page carries every footer route as a plain followable anchor', () => {
  assert.deepEqual(auditSiteFooterHtml(page('/x', siteFooter()), { route: '/x', footer }), []);
});

test('reports a missing route, a query-only link, a nofollow-only link and a denied link', () => {
  const html = page('/x', siteFooter({
    links: ['/coding?tech=react', '/tracks', '/guides'],
    extra: '<a href="/pricing" rel="nofollow">Pricing</a>',
  }));
  assert.deepEqual(auditSiteFooterHtml(html, { route: '/x', footer }), [
    '/x: footer links /coding only with a query or fragment (/coding?tech=react)',
    '/x: footer link to /pricing is not followable',
    '/x: footer lacks a link to /legal/terms',
    '/x: footer links the denied route /guides',
  ]);
});

test('reports a footer on a workspace route and a page with two footers', () => {
  assert.deepEqual(auditSiteFooterHtml(page('/javascript/coding/js-throttle', siteFooter()), { route: '/javascript/coding/js-throttle', footer }), [
    '/javascript/coding/js-throttle: renders the site footer on a workspace or private route',
  ]);
  assert.deepEqual(auditSiteFooterHtml(page('/javascript/coding/js-throttle', ''), { route: '/javascript/coding/js-throttle', footer }), []);
  assert.deepEqual(auditSiteFooterHtml(page('/x', siteFooter() + siteFooter()), { route: '/x', footer }), ['/x: expected exactly one site footer, found 2']);
  assert.deepEqual(auditSiteFooterHtml(page('/x', ''), { route: '/x', footer }), ['/x: expected exactly one site footer, found 0']);
});

test('validates the footer definition: clean, prerendered, unique, allowed routes within the limit', () => {
  assert.deepEqual(validateSiteFooter({ footer, prerenderRoutes: new Set(ROUTES) }), []);
  const broken = {
    ...footer,
    groups: [{ id: 'g', title: 'G', links: [
      { label: 'Alias', route: '/guides' },
      { label: 'Query', route: '/coding?kind=trivia' },
      { label: 'Missing', route: '/nowhere' },
      { label: 'Dup', route: '/tracks' },
      { label: 'Dup again', route: '/tracks' },
      { label: '', route: '/pricing' },
    ] }],
    legal: [],
  };
  assert.deepEqual(validateSiteFooter({ footer: broken, prerenderRoutes: new Set(['/guides', '/tracks', '/pricing']) }), [
    'footer route /guides is denied',
    'footer route /coding?kind=trivia must be a clean path without a query or fragment',
    'footer route /coding?kind=trivia is not prerendered',
    'footer route /nowhere is not prerendered',
    'footer routes repeat',
    'footer link /pricing has no label',
  ]);
  const oversized = { ...footer, legal: Array.from({ length: 23 }, (_, index) => ({ label: `L${index}`, route: `/legal/l${index}` })) };
  assert.ok(validateSiteFooter({ footer: oversized }).some((failure) => /limit is 24/.test(failure)));
});

test('audits a build: canonical indexable pages only, footer present or absent per route', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'site-footer-audit-'));
  const write = (route, html) => {
    const target = path.join(dir, route === '/' ? '' : route.slice(1), 'index.html');
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, html);
  };
  write('/', page('/', siteFooter()));
  write('/pricing', page('/pricing', siteFooter()));
  write('/javascript/coding/js-throttle', page('/javascript/coding/js-throttle', ''));
  write('/dashboard', page('/dashboard', '', { robots: 'noindex,nofollow' }));
  write('/javascript/trivia/js-event-loop', page('/javascript/trivia/js-event-loop', siteFooter({ links: ['/coding', '/tracks', '/pricing'] })));

  const report = auditSiteFooterLinks({ buildDir: dir, canonicalBase: BASE, footer, prerenderRoutes: new Set(ROUTES) });
  assert.deepEqual(report.summary, { pagesChecked: 4, pagesWithFooter: 3, footerRoutes: 4 });
  assert.deepEqual(report.failures, ['/javascript/trivia/js-event-loop: footer lacks a link to /legal/terms']);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('the checked-in footer definition is valid against the prerender route list', () => {
  const real = readSiteFooter();
  assert.deepEqual(validateSiteFooter({ footer: real, prerenderRoutes: readPrerenderRoutes() }), []);
  assert.ok(siteFooterRoutes(real).includes('/pricing'));
  assert.ok(siteFooterRoutes(real).includes('/legal'));
  for (const route of ['/javascript/coding/js-throttle', '/coding/js-throttle', '/auth/login', '/dashboard', '/interview/abc']) {
    assert.equal(siteFooterVisible(route, real), false, `${route} must not render the footer`);
  }
  for (const route of ['/', '/pricing', '/javascript/trivia/js-event-loop', '/system-design/news-feed', '/guides/behavioral/prep']) {
    assert.equal(siteFooterVisible(route, real), true, `${route} must render the footer`);
  }
});
