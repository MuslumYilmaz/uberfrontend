import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { cdnPracticeRegistryPath, srcSitemapPath } from './content-paths.mjs';
import { buildRoutes } from './generate-prerender-routes.mjs';
import {
  priorityLinkContracts,
  priorityLinkRoutes,
  readPriorityLinks,
  validatePriorityLinks,
} from './priority-links.mjs';

const FREE = '/react/trivia/free-question';
const PREMIUM = '/react/trivia/premium-question';
const GUIDE = '/guides/interview-blueprint/quiz';
const registry = [
  { route: FREE, access: 'free' },
  { route: PREMIUM, access: 'premium' },
];
const prerenderRoutes = [FREE, PREMIUM, GUIDE, '/', '/coding'];
const link = (overrides = {}) => ({ label: 'Free question', route: FREE, surfaces: ['home'], ...overrides });
const catalogOf = (...links) => ({ groups: [{ id: 'group', title: 'Group', links }] });
const errorsFor = (...links) => validatePriorityLinks({ catalog: catalogOf(...links), registry, prerenderRoutes });

test('the shipped catalog only points at public, prerendered sitemap pages', () => {
  const catalog = readPriorityLinks();
  assert.deepEqual(validatePriorityLinks({
    catalog,
    registry: JSON.parse(fs.readFileSync(cdnPracticeRegistryPath, 'utf8')),
    prerenderRoutes: buildRoutes(),
  }), []);

  const sitemap = new Set([...fs.readFileSync(srcSitemapPath, 'utf8')
    .matchAll(/<loc>https:\/\/frontendatlas\.com([^<]*)<\/loc>/g)].map((match) => match[1] || '/'));
  const homeRoutes = priorityLinkRoutes(catalog, 'home');
  assert.deepEqual(homeRoutes.filter((route) => !sitemap.has(route)), []);

  const [home, coding] = priorityLinkContracts(catalog);
  assert.equal(home.source, '/');
  assert.equal(coding.source, '/coding');
  assert.deepEqual(home.targets, homeRoutes);
  assert(coding.targets.length > 0);
  assert.deepEqual(coding.targets.filter((route) => !homeRoutes.includes(route)), []);
});

test('accepts a free registry detail and a prerendered non-registry page', () => {
  assert.deepEqual(errorsFor(link(), link({ label: 'Quiz', route: GUIDE, surfaces: ['home', 'coding'] })), []);
});

test('rejects premium, unknown and unregistered detail targets', () => {
  assert.deepEqual(errorsFor(link({ route: PREMIUM })), [
    `group.links[0]: route is premium and not publicly indexable: ${PREMIUM}`,
  ]);
  assert.deepEqual(errorsFor(link({ route: '/guides/missing' })), [
    'group.links[0]: route is not prerendered: /guides/missing',
  ]);
  assert.deepEqual(errorsFor(link({ route: '/react/trivia/typo' })), [
    'group.links[0]: route is not prerendered: /react/trivia/typo',
    'group.links[0]: route is missing from the practice registry: /react/trivia/typo',
  ]);
});

for (const route of [`${FREE}?ref=home`, `${FREE}#answer`, `${FREE}/`, FREE.slice(1)]) {
  test(`rejects the unclean route ${route}`, () => {
    assert.deepEqual(errorsFor(link({ route })), [
      `group.links[0]: route must be a clean path without query, fragment or trailing slash: ${route}`,
    ]);
  });
}

test('rejects duplicate routes, duplicate labels and links back to a source page', () => {
  assert.deepEqual(errorsFor(link(), link({ label: 'Other label' })), [
    `group.links[1]: duplicate route ${FREE}`,
  ]);
  assert.deepEqual(errorsFor(link(), link({ route: GUIDE })), [
    'group.links[1]: duplicate label "Free question"',
  ]);
  assert.deepEqual(errorsFor(link({ route: '/coding' })), [
    'group.links[0]: route is a source page: /coding',
  ]);
});

test('rejects unknown surfaces and links that skip the home surface', () => {
  assert.deepEqual(errorsFor(link({ surfaces: ['home', 'footer'] })), [
    'group.links[0]: unknown surface footer',
  ]);
  assert.deepEqual(errorsFor(link({ surfaces: ['coding'] })), [
    'group.links[0]: every priority link must include the home surface',
  ]);
});

test('rejects empty labels, overlong labels and empty groups', () => {
  assert.deepEqual(errorsFor(link({ label: ' ' })), ['group.links[0]: label is required']);
  assert.deepEqual(errorsFor(link({ label: 'x'.repeat(65) })), [
    'group.links[0]: label exceeds 64 characters',
  ]);
  assert.deepEqual(validatePriorityLinks({ catalog: { groups: [] }, registry, prerenderRoutes }), [
    'catalog.groups must be a non-empty array',
  ]);
  assert.deepEqual(validatePriorityLinks({
    catalog: { groups: [{ id: 'group', title: 'Group', links: [] }] }, registry, prerenderRoutes,
  }), ['group: links must be a non-empty array']);
});
