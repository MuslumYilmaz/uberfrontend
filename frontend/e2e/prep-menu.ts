import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type Catalog = { sections: { items: { route: string; chips?: { route: string }[] }[] }[] };

const catalog = JSON.parse(
  readFileSync(resolve(__dirname, '../src/app/core/content/prep-menu.json'), 'utf8'),
) as Catalog;

// Every route the shared header prep menu renders in each page's initial HTML.
export const PREP_MENU_ROUTES: string[] = catalog.sections.flatMap((section) =>
  section.items.flatMap((item) => [item.route, ...(item.chips ?? []).map((chip) => chip.route)]),
);
