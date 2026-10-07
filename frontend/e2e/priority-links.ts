import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, type Page } from '@playwright/test';

type CatalogLink = { label: string; route: string; surfaces: string[] };
type Catalog = { groups: { links: CatalogLink[] }[] };

const catalog = JSON.parse(
  readFileSync(resolve(__dirname, '../src/app/core/content/priority-links.json'), 'utf8'),
) as Catalog;

export const PRIORITY_LINK_SURFACES = {
  home: { path: '/', testId: 'showcase-priority-links' },
  coding: { path: '/coding', testId: 'coding-priority-links' },
} as const;

export type PriorityLinkSurface = keyof typeof PRIORITY_LINK_SURFACES;

export function priorityLinksFor(surface: PriorityLinkSurface): { label: string; route: string }[] {
  return catalog.groups
    .flatMap((group) => group.links)
    .filter((link) => link.surfaces.includes(surface))
    .map(({ label, route }) => ({ label, route }));
}

export async function assertPriorityLinksLayout(page: Page, surface: PriorityLinkSurface, label: string): Promise<void> {
  const block = page.getByTestId(PRIORITY_LINK_SURFACES[surface].testId);
  await block.scrollIntoViewIfNeeded();
  await expect(block).toBeVisible();
  await expect(block.locator('a')).toHaveCount(priorityLinksFor(surface).length);

  const violations = await block.evaluate((root) => {
    const issues: string[] = [];
    const viewportWidth = document.documentElement.clientWidth;
    const rootRect = root.getBoundingClientRect();
    if (rootRect.left < -1 || rootRect.right > viewportWidth + 1) issues.push('block leaves the viewport');

    root.querySelectorAll<HTMLElement>('.priority-links__grid, .priority-links__group, .priority-links__list, a')
      .forEach((element, index) => {
        if (element.scrollWidth > element.clientWidth + 1) {
          issues.push(`${element.className || element.tagName} ${index + 1} overflows its width`);
        }
      });

    root.querySelectorAll<HTMLElement>('a').forEach((link, index) => {
      const group = link.closest('.priority-links__group');
      if (!group) {
        issues.push(`link ${index + 1} is outside a group`);
        return;
      }
      const linkRect = link.getBoundingClientRect();
      const groupRect = group.getBoundingClientRect();
      if (linkRect.left < groupRect.left - 1 || linkRect.right > groupRect.right + 1) {
        issues.push(`link ${index + 1} leaves its group`);
      }
      if (linkRect.height < 24) issues.push(`link ${index + 1} is shorter than a 24px target`);
    });
    return issues;
  });
  expect(violations, `${label} priority links layout`).toEqual([]);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, `${label} should not overflow horizontally`).toBeLessThanOrEqual(1);
}
