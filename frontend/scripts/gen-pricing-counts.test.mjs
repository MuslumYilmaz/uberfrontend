import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { cdnPracticeRegistryPath } from './content-paths.mjs';
import { countPremiumPractices } from './gen-showcase-stats.mjs';
import {
  OUTPUT_PATH,
  buildPricingCounts,
  countPricingAreas,
  latestMonth,
  loadPricingSources,
  renderPricingCountsModule,
  resolveExampleRow,
} from './gen-pricing-counts.mjs';

test('every practice route lands in one area, so the Premium counts add up to the Premium total', async () => {
  const registry = JSON.parse(await readFile(cdnPracticeRegistryPath, 'utf8'));
  const areas = Object.values(countPricingAreas(registry));
  assert.equal(areas.reduce((sum, area) => sum + area.premium, 0), countPremiumPractices(registry));
  assert.equal(areas.reduce((sum, area) => sum + area.total, 0), new Set(registry.map((entry) => entry.route)).size);
});

test('a route outside every area stops the generator instead of dropping out of the counts', () => {
  assert.throws(
    () => countPricingAreas([{ route: '/svelte/coding/counter', access: 'free' }]),
    /\/svelte\/coding\/counter matches 0 pricing areas/,
  );
});

test('an area splits free, Premium and Premium Hard, counting a repeated route once', () => {
  const areas = countPricingAreas([
    { route: '/react/coding/a', access: 'free', difficulty: 'hard' },
    { route: '/react/coding/b', access: 'premium', difficulty: 'hard' },
    { route: '/react/coding/c', access: 'premium', difficulty: 'intermediate' },
    { route: '/react/coding/b', access: 'premium', difficulty: 'hard' },
    { route: '/angular/debug/d', access: 'premium', difficulty: 'hard' },
    { route: '/css/coding/e', access: 'free' },
  ]);
  assert.deepEqual(areas.react, { total: 3, free: 1, premium: 2, premiumHard: 1 });
  assert.deepEqual(areas.debug, { total: 1, free: 0, premium: 1, premiumHard: 1 });
  assert.deepEqual(areas.htmlCss, { total: 1, free: 1, premium: 0, premiumHard: 0 });
});

test('the stamp is the month of the newest catalog change', () => {
  assert.equal(latestMonth([{ updatedAt: '2026-10-30' }, { updatedAt: '2026-11-02' }, { updatedAt: 'soon' }]), '2026-11');
  assert.throws(() => latestMonth([{}]), /no dated registry entry/);
});

const sources = {
  registryByRoute: new Map([
    ['/react/coding/locked', { route: '/react/coding/locked', access: 'premium' }],
    ['/react/coding/open', { route: '/react/coding/open', access: 'free' }],
    ['/javascript/debug/squash', { route: '/javascript/debug/squash', access: 'premium' }],
  ]),
  companiesByRoute: new Map([['/javascript/debug/squash', ['stripe']]]),
  rehearsalsById: new Map([
    ['meta-loop', { id: 'meta-loop', access: 'premium', company: 'meta' }],
    ['open-loop', { id: 'open-loop', access: 'free', company: 'meta' }],
  ]),
  companyGuideSlugs: new Set(['meta', 'stripe']),
};

test('a locked example must be a Premium item of its own row', () => {
  assert.deepEqual(
    resolveExampleRow('react', [{ route: '/react/coding/locked', label: 'Locked' }], sources),
    [{ label: 'Locked', route: '/react/coding/locked' }],
  );
  assert.throws(() => resolveExampleRow('react', [{ route: '/react/coding/open', label: 'Open' }], sources), /react\[0\]: \/react\/coding\/open is free now/);
  assert.throws(() => resolveExampleRow('react', [{ route: '/react/coding/gone', label: 'Gone' }], sources), /is not in the practice registry/);
  assert.throws(() => resolveExampleRow('react', [{ route: '/javascript/debug/squash', label: 'Squash' }], sources), /belongs to debug, not react/);
  assert.throws(() => resolveExampleRow('react', [], sources), /needs 1 to 4 examples/);
  assert.throws(() => resolveExampleRow('react', [{ route: '/react/coding/locked', label: ' ' }], sources), /needs a label/);
});

test('a company example must carry the company tag, and a format example must be a Premium rehearsal', () => {
  assert.deepEqual(
    resolveExampleRow('companyGuides', [{ route: '/javascript/debug/squash', label: 'Stripe squash', company: 'stripe' }], sources),
    [{ label: 'Stripe squash', route: '/javascript/debug/squash', company: 'stripe' }],
  );
  assert.throws(
    () => resolveExampleRow('companyGuides', [{ route: '/javascript/debug/squash', label: 'Squash', company: 'meta' }], sources),
    /is not tagged with meta/,
  );
  assert.deepEqual(
    resolveExampleRow('formats', [{ rehearsal: 'meta-loop', label: 'Meta loop' }], sources),
    [{ label: 'Meta loop', route: '/companies/meta/preview', company: 'meta' }],
  );
  assert.throws(() => resolveExampleRow('formats', [{ rehearsal: 'open-loop', label: 'Open' }], sources), /open-loop is free/);
});

test('the published module matches the catalog and the example list', async () => {
  const expected = renderPricingCountsModule(buildPricingCounts(await loadPricingSources()));
  assert.equal(await readFile(OUTPUT_PATH, 'utf8'), expected);
});
