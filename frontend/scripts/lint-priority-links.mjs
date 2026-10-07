#!/usr/bin/env node
import fs from 'node:fs';
import { cdnPracticeRegistryPath } from './content-paths.mjs';
import { buildRoutes } from './generate-prerender-routes.mjs';
import {
  PRIORITY_LINK_SURFACES,
  priorityLinkRoutes,
  readPriorityLinks,
  validatePriorityLinks,
} from './priority-links.mjs';

const catalog = readPriorityLinks();
const errors = validatePriorityLinks({
  catalog,
  registry: JSON.parse(fs.readFileSync(cdnPracticeRegistryPath, 'utf8')),
  prerenderRoutes: buildRoutes(),
});

if (errors.length) {
  for (const error of errors) console.error(`[lint-priority-links] ${error}`);
  process.exit(1);
}

const counts = PRIORITY_LINK_SURFACES
  .map((surface) => `${surface} ${priorityLinkRoutes(catalog, surface).length}`)
  .join(', ');
console.log(`[lint-priority-links] priority links look valid (${counts})`);
