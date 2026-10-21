import assert from 'node:assert/strict';
import test from 'node:test';
import { auditContentDateParity, sitemapDatesFromXml } from './seo-date-parity.mjs';
import { EDITORIAL_NOTE_COMPANIES } from './authored-companies.mjs';

const route = '/react/trivia/example';
const page = (schema) => ({ route, jsonLd: [JSON.stringify({ '@graph': [{ '@type': 'TechArticle', ...schema }] })] });
test('main schema and sitemap dates agree, including unresolved local content', () => {
  assert.deepEqual(auditContentDateParity([page({ dateModified: '2026-01-02T00:00:00.000Z' })], new Map([[route, '2026-01-02']])), []);
  assert.deepEqual(auditContentDateParity([page({})], new Map([[route, '']])), []);
  assert.equal(auditContentDateParity([page({ dateModified: '2026-01-02T00:00:00.000Z' })], new Map([[route, '']])).length, 1);
});
test('missing, stale and invented dates fail on dated schema families', () => {
  for (const schema of [{}, { dateModified: '2026-01-01T00:00:00.000Z' }, { dateModified: 'invalid' }]) {
    assert.equal(auditContentDateParity([page(schema)], new Map([[route, '2026-01-02']])).length, 1);
  }
});
test('ordinary static pages need not invent a dated Article schema', () => {
  assert.deepEqual(auditContentDateParity([{ route: '/pricing', jsonLd: ['{"@type":"WebPage"}'] }], new Map([['/pricing', '2026-01-02']])), []);
});
test('an ancillary dated schema cannot hide a missing main content date', () => {
  const dateModified = '2026-01-02T00:00:00.000Z';
  for (const other of [{ '@type': 'FAQPage', dateModified }, { '@type': 'BreadcrumbList', dateModified },
    { '@type': 'TechArticle', url: 'https://frontendatlas.com/another-page', dateModified }]) {
    const value = { route, jsonLd: [JSON.stringify({ '@graph': [{ '@type': 'TechArticle', url: `https://frontendatlas.com${route}` }, other] })] };
    assert.equal(auditContentDateParity([value], new Map([[route, '2026-01-02']])).length, 1);
  }
});
test('company previews with editorial notes require a dated CollectionPage', () => {
  assert.ok(EDITORIAL_NOTE_COMPANIES.length > 0, 'at least one company carries editorial notes');
  for (const slug of EDITORIAL_NOTE_COMPANIES) {
    const notesRoute = `/companies/${slug}/preview`;
    const notesPage = (schema) => ({
      route: notesRoute,
      jsonLd: [JSON.stringify({ '@graph': [{ '@type': 'CollectionPage', url: `https://frontendatlas.com${notesRoute}`, ...schema }] })],
    });
    assert.equal(auditContentDateParity([notesPage({})], new Map([[notesRoute, '2026-01-02']])).length, 1, slug);
    assert.deepEqual(auditContentDateParity([notesPage({ dateModified: '2026-01-02T00:00:00.000Z' })], new Map([[notesRoute, '2026-01-02']])), [], slug);
  }
});
test('reads lastmod and its absence from actual sitemap URL entries', () => {
  assert.deepEqual([...sitemapDatesFromXml('<urlset><url><loc>https://frontendatlas.com/a</loc><lastmod>2026-01-02</lastmod></url><url><loc>https://frontendatlas.com/b</loc></url></urlset>')], [['/a', '2026-01-02'], ['/b', '']]);
});
