import catalog from './priority-links.json';

export type PriorityLinkSurface = 'home' | 'coding';

export type PriorityLink = {
  label: string;
  route: string;
};

export type PriorityLinkGroup = {
  id: string;
  title: string;
  links: readonly PriorityLink[];
};

type PriorityLinkCatalog = {
  groups: ReadonlyArray<{
    id: string;
    title: string;
    links: ReadonlyArray<PriorityLink & { surfaces: readonly string[] }>;
  }>;
};

const groups = (catalog as PriorityLinkCatalog).groups;

export function priorityLinkGroupsFor(surface: PriorityLinkSurface): readonly PriorityLinkGroup[] {
  return groups
    .map((group) => ({
      id: group.id,
      title: group.title,
      links: group.links
        .filter((link) => link.surfaces.includes(surface))
        .map(({ label, route }) => ({ label, route })),
    }))
    .filter((group) => group.links.length > 0);
}

export const HOME_PRIORITY_LINK_GROUPS = priorityLinkGroupsFor('home');
export const CODING_PRIORITY_LINK_GROUPS = priorityLinkGroupsFor('coding');
