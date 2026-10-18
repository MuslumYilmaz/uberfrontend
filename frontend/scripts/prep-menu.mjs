import fs from 'node:fs';
import path from 'node:path';
import { srcDir } from './content-paths.mjs';
import { normalizeRoutePath } from './registry-detail-access-policy.mjs';

// The header prep menu renders every route below in each page's initial HTML.
export const prepMenuPath = path.join(srcDir, 'app', 'core', 'content', 'prep-menu.json');

export const PREP_MENU_LIMITS = Object.freeze({ maxRoutes: 24, maxTitle: 40, maxDescription: 90, maxLabel: 24 });

// Every icon exists in the installed primeicons release.
export const PREP_MENU_ICONS = Object.freeze([
  'pi-map', 'pi-calendar', 'pi-star', 'pi-share-alt', 'pi-question-circle', 'pi-bolt', 'pi-th-large', 'pi-sitemap',
  'pi-directions-alt', 'pi-building', 'pi-filter', 'pi-sliders-h', 'pi-exclamation-triangle', 'pi-compass',
  'pi-comments', 'pi-file',
]);

// `/guides` canonicalizes to `/guides/interview-blueprint`, so a link to it fails the alias rule in
// audit-internal-link-equity.mjs. CSS detail pages must never link the combined HTML/CSS hub
// (audit-tech-hub-internal-links.mjs), which a sitewide menu would do. Pricing stays a top-bar link
// outside the menu: signed-out visitors get a Pricing link next to the account menu once auth
// resolves, signed-in users get Upgrade, and the site footer carries the crawlable link.
export const PREP_MENU_DENIED_ROUTES = Object.freeze(['/guides', '/html-css/interview-questions', '/pricing']);
export const PREP_MENU_EXEMPT_CRITICAL_HUBS = Object.freeze(['/html-css/interview-questions']);

const PRIVATE_ROUTE = /^\/(?:auth|dashboard|profile|admin|billing)(?:\/|$)/;
const KEY_PATTERN = /^[a-z][a-z0-9_]*$/;
const SECTION_ID_PATTERN = /^[a-z][a-z0-9-]*$/;

export function readPrepMenu(file = prepMenuPath) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function prepMenuRoutes(menu) {
  return (Array.isArray(menu?.sections) ? menu.sections : [])
    .flatMap((section) => (Array.isArray(section?.items) ? section.items : []))
    .flatMap((item) => [item?.route, ...(Array.isArray(item?.chips) ? item.chips : []).map((chip) => chip?.route)])
    .filter((route) => typeof route === 'string' && route.length > 0);
}

export function validatePrepMenu({ menu, prerenderRoutes, criticalHubs = [] }) {
  const errors = [];
  const sections = menu?.sections;
  if (!Array.isArray(sections) || !sections.length) return ['menu.sections must be a non-empty array'];

  const prerendered = new Set(prerenderRoutes);
  const seenSections = new Set();
  const seenKeys = new Set();
  const seenRoutes = new Set();

  const checkText = (where, field, value, max) => {
    if (typeof value !== 'string' || !value.trim()) {
      errors.push(`${where}: ${field} is required`);
      return;
    }
    if (value !== value.trim()) errors.push(`${where}: ${field} has surrounding whitespace`);
    if (value.length > max) errors.push(`${where}: ${field} exceeds ${max} characters`);
  };

  const checkKey = (where, key) => {
    if (typeof key !== 'string' || !KEY_PATTERN.test(key)) errors.push(`${where}: key must match ${KEY_PATTERN}`);
    else if (seenKeys.has(key)) errors.push(`${where}: duplicate key ${key}`);
    else seenKeys.add(key);
  };

  const checkRoute = (where, route) => {
    if (typeof route !== 'string' || !route) {
      errors.push(`${where}: route is required`);
      return;
    }
    if (route !== normalizeRoutePath(route)) {
      errors.push(`${where}: route must be a clean path without query, fragment or trailing slash: ${route}`);
      return;
    }
    if (seenRoutes.has(route)) errors.push(`${where}: duplicate route ${route}`);
    seenRoutes.add(route);
    if (PREP_MENU_DENIED_ROUTES.includes(route) || PRIVATE_ROUTE.test(route)) {
      errors.push(`${where}: route is not allowed in the menu: ${route}`);
    }
    if (!prerendered.has(route)) errors.push(`${where}: route is not prerendered: ${route}`);
  };

  sections.forEach((section, sectionIndex) => {
    const name = typeof section?.id === 'string' && section.id ? section.id : `sections[${sectionIndex}]`;
    if (typeof section?.id !== 'string' || !SECTION_ID_PATTERN.test(section.id)) {
      errors.push(`${name}: id must match ${SECTION_ID_PATTERN}`);
    } else if (seenSections.has(section.id)) {
      errors.push(`${name}: duplicate section id`);
    } else {
      seenSections.add(section.id);
    }
    checkText(name, 'label', section?.label, PREP_MENU_LIMITS.maxLabel);
    if (!Array.isArray(section?.items) || !section.items.length) {
      errors.push(`${name}: items must be a non-empty array`);
      return;
    }

    section.items.forEach((item, itemIndex) => {
      const where = `${name}.items[${itemIndex}]`;
      checkKey(where, item?.key);
      checkText(where, 'title', item?.title, PREP_MENU_LIMITS.maxTitle);
      checkText(where, 'description', item?.description, PREP_MENU_LIMITS.maxDescription);
      if (!PREP_MENU_ICONS.includes(item?.icon)) errors.push(`${where}: icon is not in the allowlist: ${item?.icon}`);
      checkRoute(where, item?.route);
      if (item?.chips === undefined) return;
      if (!Array.isArray(item.chips) || !item.chips.length) {
        errors.push(`${where}: chips must be a non-empty array when present`);
        return;
      }
      item.chips.forEach((chip, chipIndex) => {
        const chipWhere = `${where}.chips[${chipIndex}]`;
        checkKey(chipWhere, chip?.key);
        checkText(chipWhere, 'label', chip?.label, PREP_MENU_LIMITS.maxLabel);
        checkRoute(chipWhere, chip?.route);
      });
    });
  });

  if (seenRoutes.size > PREP_MENU_LIMITS.maxRoutes) {
    errors.push(`menu has ${seenRoutes.size} routes; the limit is ${PREP_MENU_LIMITS.maxRoutes}`);
  }
  // Every critical hub stays one click away from every page, which also keeps today's header links.
  for (const hub of criticalHubs) {
    if (!PREP_MENU_EXEMPT_CRITICAL_HUBS.includes(hub) && !seenRoutes.has(hub)) {
      errors.push(`critical hub is missing from the menu: ${hub}`);
    }
  }
  return errors;
}
