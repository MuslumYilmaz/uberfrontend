import catalog from './prep-menu.json';

export type PrepMenuChip = {
  key: string;
  label: string;
  route: string;
};

export type PrepMenuItem = {
  key: string;
  icon: string;
  title: string;
  description: string;
  route: string;
  chips?: readonly PrepMenuChip[];
};

export type PrepMenuSection = {
  id: string;
  label: string;
  items: readonly PrepMenuItem[];
};

// One catalog feeds both headers. Every route is rendered in each page's initial HTML,
// so the catalog is validated by scripts/prep-menu.mjs and audited after the build.
export const PREP_MENU_SECTIONS: readonly PrepMenuSection[] = (catalog as { sections: PrepMenuSection[] }).sections;

export const PREP_MENU_ROUTES: readonly string[] = PREP_MENU_SECTIONS.flatMap((section) =>
  section.items.flatMap((item) => [item.route, ...(item.chips ?? []).map((chip) => chip.route)]),
);

export function isPrepMenuPath(path: string): boolean {
  return PREP_MENU_ROUTES.some((route) => path === route || path.startsWith(`${route}/`));
}
