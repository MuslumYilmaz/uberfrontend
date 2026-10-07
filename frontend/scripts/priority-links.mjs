import fs from 'node:fs';
import path from 'node:path';
import { srcDir } from './content-paths.mjs';
import {
  isScopedRegistryDetailRoute,
  normalizeRoutePath,
  shouldIncludeRegistryDetailInSitemap,
} from './registry-detail-access-policy.mjs';

export const priorityLinksPath = path.join(srcDir, 'app', 'core', 'content', 'priority-links.json');

// Each surface is the page that renders the links for that surface.
export const PRIORITY_LINK_SOURCES = { home: '/', coding: '/coding' };
export const PRIORITY_LINK_SURFACES = Object.keys(PRIORITY_LINK_SOURCES);
export const MAX_PRIORITY_LINK_LABEL_LENGTH = 64;

export function readPriorityLinks(file = priorityLinksPath) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function allLinks(catalog) {
  return (Array.isArray(catalog?.groups) ? catalog.groups : [])
    .flatMap((group) => (Array.isArray(group?.links) ? group.links : []));
}

export function priorityLinkRoutes(catalog, surface) {
  return allLinks(catalog)
    .filter((link) => Array.isArray(link?.surfaces) && link.surfaces.includes(surface))
    .map((link) => link.route);
}

export function priorityLinkContracts(catalog = readPriorityLinks()) {
  return PRIORITY_LINK_SURFACES.map((surface) => ({
    source: PRIORITY_LINK_SOURCES[surface],
    targets: priorityLinkRoutes(catalog, surface),
  }));
}

export function validatePriorityLinks({ catalog, registry, prerenderRoutes }) {
  const errors = [];
  const groups = catalog?.groups;
  if (!Array.isArray(groups) || !groups.length) return ['catalog.groups must be a non-empty array'];

  const prerendered = new Set(prerenderRoutes);
  const accessByRoute = new Map((registry || []).map((entry) => [normalizeRoutePath(entry.route), entry.access]));
  const sources = new Set(Object.values(PRIORITY_LINK_SOURCES));
  const seenGroupIds = new Set();
  const seenRoutes = new Set();
  const seenLabels = new Set();

  groups.forEach((group, groupIndex) => {
    const groupName = isNonEmptyString(group?.id) ? group.id : `groups[${groupIndex}]`;
    if (!isNonEmptyString(group?.id)) errors.push(`${groupName}: id is required`);
    else if (seenGroupIds.has(group.id)) errors.push(`${groupName}: duplicate group id`);
    else seenGroupIds.add(group.id);
    if (!isNonEmptyString(group?.title)) errors.push(`${groupName}: title is required`);
    if (!Array.isArray(group?.links) || !group.links.length) {
      errors.push(`${groupName}: links must be a non-empty array`);
      return;
    }

    group.links.forEach((link, linkIndex) => {
      const where = `${groupName}.links[${linkIndex}]`;
      const { label, route, surfaces } = link || {};

      if (!isNonEmptyString(label)) errors.push(`${where}: label is required`);
      else {
        if (label !== label.trim()) errors.push(`${where}: label has surrounding whitespace`);
        if (label.length > MAX_PRIORITY_LINK_LABEL_LENGTH) {
          errors.push(`${where}: label exceeds ${MAX_PRIORITY_LINK_LABEL_LENGTH} characters`);
        }
        if (seenLabels.has(label)) errors.push(`${where}: duplicate label "${label}"`);
        seenLabels.add(label);
      }

      if (!Array.isArray(surfaces) || !surfaces.length) errors.push(`${where}: surfaces must be a non-empty array`);
      else {
        const unknown = surfaces.filter((surface) => !PRIORITY_LINK_SURFACES.includes(surface));
        if (unknown.length) errors.push(`${where}: unknown surface ${unknown.join(', ')}`);
        if (new Set(surfaces).size !== surfaces.length) errors.push(`${where}: duplicate surface`);
        // The home page is the strongest source, so every priority page is linked from it.
        if (!surfaces.includes('home')) errors.push(`${where}: every priority link must include the home surface`);
      }

      if (!isNonEmptyString(route)) {
        errors.push(`${where}: route is required`);
        return;
      }
      if (route !== normalizeRoutePath(route)) {
        errors.push(`${where}: route must be a clean path without query, fragment or trailing slash: ${route}`);
        return;
      }
      if (seenRoutes.has(route)) errors.push(`${where}: duplicate route ${route}`);
      seenRoutes.add(route);
      if (sources.has(route)) errors.push(`${where}: route is a source page: ${route}`);
      if (!prerendered.has(route)) errors.push(`${where}: route is not prerendered: ${route}`);
      if (isScopedRegistryDetailRoute(route)) {
        if (!accessByRoute.has(route)) errors.push(`${where}: route is missing from the practice registry: ${route}`);
        else if (!shouldIncludeRegistryDetailInSitemap(route, accessByRoute.get(route))) {
          errors.push(`${where}: route is premium and not publicly indexable: ${route}`);
        }
      }
    });
  });

  return errors;
}
