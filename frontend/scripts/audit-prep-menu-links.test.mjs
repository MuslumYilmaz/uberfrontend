import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { auditPrepMenuHtml, auditPrepMenuLinks, inspectHeaders } from './audit-prep-menu-links.mjs';

const BASE = 'https://frontendatlas.com';
const ROUTES = ['/coding', '/tracks', '/react/interview-questions'];
const menu = { sections: [{ id: 'practice', label: 'Practice', items: [
  { key: 'question_library', route: '/coding', chips: [{ key: 'react', route: '/react/interview-questions' }] },
  { key: 'study_plans', route: '/tracks' },
] }] };

function header({ tag = 'app-header', menuId = 'prepare-mega', hidden = true, links = ROUTES, extra = '' } = {}) {
  const items = links.map((route) => `<a href="${route}">${route}</a>`).join('');
  return `<${tag}><a href="/">FrontendAtlas</a><a href="/interview-questions">Interview Questions</a>${extra}`
    + `<nav id="${menuId}" aria-label="Interview prep"${hidden ? ' hidden=""' : ''}>${items}</nav></${tag}>`;
}

function page(route, body, { robots = 'index,follow', canonical = `${BASE}${route}` } = {}) {
  return `<!doctype html><html><head><link rel="canonical" href="${canonical}"><meta name="robots" content="${robots}"></head>`
    + `<body>${body}<main><a href="/elsewhere?x=1">content</a></main></body></html>`;
}

test('reads each header, its anchors and the hidden state of its menu', () => {
  const [found] = inspectHeaders(page('/x', header({ tag: 'app-marketing-header', menuId: 'marketing-prep-menu' })));
  assert.equal(found.tag, 'app-marketing-header');
  assert.deepEqual(found.menu, { hidden: true });
  assert.deepEqual(found.anchors.map((anchor) => anchor.href), ['/', '/interview-questions', ...ROUTES]);
});

test('passes when the header carries the logo, the hub and every menu route in a hidden menu', () => {
  assert.deepEqual(auditPrepMenuHtml(page('/x', header()), { route: '/x', routes: ROUTES }), []);
});

test('reports a missing route, a query-only link and a nofollow-only link', () => {
  const html = page('/x', header({ links: ['/coding?tech=react', '/tracks'], extra: '<a href="/react/interview-questions" rel="nofollow">React</a>' }));
  assert.deepEqual(auditPrepMenuHtml(html, { route: '/x', routes: ROUTES }), [
    '/x: header links /coding only with a query or fragment (/coding?tech=react)',
    '/x: header link to /react/interview-questions is not followable',
  ]);
  assert.deepEqual(auditPrepMenuHtml(page('/x', header({ links: ['/coding'] })), { route: '/x', routes: ROUTES }), [
    '/x: header lacks a link to /tracks',
    '/x: header lacks a link to /react/interview-questions',
  ]);
});

test('reports a visible menu, a missing menu and a page without exactly one header', () => {
  assert.deepEqual(auditPrepMenuHtml(page('/x', header({ hidden: false })), { route: '/x', routes: ROUTES }), [
    '/x: the prep menu is not hidden in initial HTML',
  ]);
  assert.deepEqual(auditPrepMenuHtml(page('/x', header({ menuId: 'other' })), { route: '/x', routes: ROUTES }), [
    '/x: app-header does not render the prep menu',
  ]);
  assert.deepEqual(auditPrepMenuHtml(page('/x', header() + header()), { route: '/x', routes: ROUTES }), [
    '/x: expected exactly one header, found 2',
  ]);
  assert.deepEqual(auditPrepMenuHtml(page('/x', '<div></div>'), { route: '/x', routes: ROUTES }), [
    '/x: expected exactly one header, found 0',
  ]);
});

test('audits canonical, indexable pages of a build and skips noindex and alias pages', () => {
  const buildDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prep-menu-audit-'));
  try {
    const write = (route, html) => {
      const dir = path.join(buildDir, route === '/' ? '' : route.slice(1));
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'index.html'), html);
    };
    write('/', page('/', header({ tag: 'app-marketing-header', menuId: 'marketing-prep-menu' })));
    write('/coding', page('/coding', header({ links: ['/coding'] })));
    write('/dashboard', page('/dashboard', '<div></div>', { robots: 'noindex,nofollow' }));
    write('/guides', page('/guides', '<div></div>', { canonical: `${BASE}/guides/interview-blueprint` }));

    const report = auditPrepMenuLinks({ buildDir, canonicalBase: BASE, menu });
    assert.deepEqual(report.summary, { pagesChecked: 2, menuRoutes: 3 });
    assert.deepEqual(report.failures, [
      '/coding: header lacks a link to /react/interview-questions',
      '/coding: header lacks a link to /tracks',
    ]);
  } finally {
    fs.rmSync(buildDir, { recursive: true, force: true });
  }
});
