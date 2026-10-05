import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadSitemapDateMap, schemaDateMatchesSitemap } from './seo-sitemap-date-contract.mjs';

test('follows canonical sitemap children on the tested deployment and preserves absent lastmod', async () => {
  const responses = {
    'http://localhost:4173/sitemap.xml': '<sitemapindex><sitemap><loc>https://frontendatlas.com/sitemap-1.xml</loc></sitemap></sitemapindex>',
    'http://localhost:4173/sitemap-1.xml': '<urlset><url><loc>https://frontendatlas.com/a</loc><lastmod>2026-01-02</lastmod></url><url><loc>https://frontendatlas.com/pending</loc></url></urlset>',
  };
  const fetched = [];
  const dates = await loadSitemapDateMap('http://localhost:4173', async (url) => {
    fetched.push(url);
    assert.ok(responses[url], `Unexpected request: ${url}`);
    return responses[url];
  });
  assert.deepEqual(fetched, Object.keys(responses));
  assert.deepEqual([...dates], [['/a', '2026-01-02'], ['/pending', '']]);
  assert.equal(schemaDateMatchesSitemap({ dateModified: '2026-01-02T00:00:00.000Z' }, '/a', dates), true);
  assert.equal(schemaDateMatchesSitemap({}, '/a', dates), false);
  assert.equal(schemaDateMatchesSitemap({}, '/pending', dates), true);
  assert.equal(schemaDateMatchesSitemap({ dateModified: undefined }, '/pending', dates), false);
  assert.equal(schemaDateMatchesSitemap({ dateModified: '2026-01-01T00:00:00.000Z' }, '/pending', dates), false);
  assert.equal(schemaDateMatchesSitemap({}, '/missing', dates), false);
  assert.equal(schemaDateMatchesSitemap(undefined, '/pending', dates), false);
});

test('rejects non-XML challenge responses, foreign children and invalid dates', async () => {
  for (const xml of [
    '<html>Security checkpoint</html>',
    '<sitemapindex><sitemap><loc>https://other.example/sitemap.xml</loc></sitemap></sitemapindex>',
    '<urlset><url><loc>https://frontendatlas.com/a</loc><lastmod>2026-02-30</lastmod></url></urlset>',
    '<urlset></urlset>',
  ]) {
    await assert.rejects(loadSitemapDateMap('http://localhost:4173', async () => xml));
  }
});
