import assert from 'node:assert/strict';
import test from 'node:test';
import { CRITICAL_HUBS } from './audit-internal-link-equity.mjs';
import { buildRoutes } from './generate-prerender-routes.mjs';
import { PREP_MENU_LIMITS, prepMenuRoutes, readPrepMenu, validatePrepMenu } from './prep-menu.mjs';

const prerenderRoutes = [
  '/', '/coding', '/tracks', '/companies', '/guides/framework-prep',
  '/guides', '/html-css/interview-questions', '/pricing', '/dashboard',
];
const item = (overrides = {}) => ({
  key: 'question_library',
  icon: 'pi-bolt',
  title: 'Question Library',
  description: 'Every practice format, with filters and full coverage.',
  route: '/coding',
  ...overrides,
});
const menuOf = (...items) => ({ sections: [{ id: 'practice', label: 'Practice', items }] });
const errorsFor = (menu, criticalHubs = []) => validatePrepMenu({ menu, prerenderRoutes, criticalHubs });

// The links today's prerendered headers carry; none may leave initial HTML.
const TODAYS_HEADER_ROUTES = [
  '/interview-questions',
  '/guides/interview-blueprint/intro',
  '/interview-questions/essential',
  '/coding',
  '/tracks',
];

test('the shipped menu is valid against the prerender routes and the critical hub list', () => {
  assert.deepEqual(validatePrepMenu({ menu: readPrepMenu(), prerenderRoutes: buildRoutes(), criticalHubs: CRITICAL_HUBS }), []);
});

test('the shipped menu keeps every link that today\'s headers render', () => {
  const routes = new Set(prepMenuRoutes(readPrepMenu()));
  assert.deepEqual(TODAYS_HEADER_ROUTES.filter((route) => !routes.has(route)), []);
  assert.ok(!routes.has('/html-css/interview-questions'));
  assert.ok(!routes.has('/guides'));
});

test('accepts a minimal valid menu', () => {
  assert.deepEqual(errorsFor(menuOf(item())), []);
});

test('rejects routes with a query, fragment or trailing slash', () => {
  for (const route of ['/coding?tech=react', '/coding#top', '/coding/']) {
    assert.deepEqual(errorsFor(menuOf(item({ route }))), [
      `practice.items[0]: route must be a clean path without query, fragment or trailing slash: ${route}`,
    ]);
  }
});

test('rejects the canonical alias, the combined HTML/CSS hub, pricing and private routes', () => {
  for (const route of ['/guides', '/html-css/interview-questions', '/pricing', '/dashboard']) {
    assert.deepEqual(errorsFor(menuOf(item({ route }))), [
      `practice.items[0]: route is not allowed in the menu: ${route}`,
    ]);
  }
});

test('rejects routes that are not prerendered', () => {
  assert.deepEqual(errorsFor(menuOf(item({ route: '/guides/missing' }))), [
    'practice.items[0]: route is not prerendered: /guides/missing',
  ]);
});

test('rejects duplicate keys and routes across items and chips', () => {
  const errors = errorsFor(menuOf(
    item({ chips: [{ key: 'question_library', label: 'Tracks', route: '/coding' }] }),
  ));
  assert.deepEqual(errors, [
    'practice.items[0].chips[0]: duplicate key question_library',
    'practice.items[0].chips[0]: duplicate route /coding',
  ]);
});

test('rejects missing, untrimmed or long text, unknown icons and empty chip lists', () => {
  const errors = errorsFor(menuOf(item({
    title: ' Question Library',
    description: 'x'.repeat(PREP_MENU_LIMITS.maxDescription + 1),
    icon: 'pi-bullseye',
    chips: [],
  })));
  assert.deepEqual(errors, [
    'practice.items[0]: title has surrounding whitespace',
    `practice.items[0]: description exceeds ${PREP_MENU_LIMITS.maxDescription} characters`,
    'practice.items[0]: icon is not in the allowlist: pi-bullseye',
    'practice.items[0]: chips must be a non-empty array when present',
  ]);
  assert.deepEqual(errorsFor({ sections: [{ id: 'Practice', label: '', items: [] }] }), [
    'Practice: id must match /^[a-z][a-z0-9-]*$/',
    'Practice: label is required',
    'Practice: items must be a non-empty array',
  ]);
});

test('requires every critical hub except the combined HTML/CSS hub', () => {
  assert.deepEqual(errorsFor(menuOf(item()), ['/coding', '/tracks', '/html-css/interview-questions']), [
    'critical hub is missing from the menu: /tracks',
  ]);
});

test('caps the number of routes', () => {
  const routes = Array.from({ length: PREP_MENU_LIMITS.maxRoutes + 1 }, (_, index) => `/hub-${index}`);
  const menu = menuOf(...routes.map((route, index) => item({ key: `hub_${index}`, route })));
  const errors = validatePrepMenu({ menu, prerenderRoutes: routes });
  assert.deepEqual(errors, [`menu has ${routes.length} routes; the limit is ${PREP_MENU_LIMITS.maxRoutes}`]);
});
