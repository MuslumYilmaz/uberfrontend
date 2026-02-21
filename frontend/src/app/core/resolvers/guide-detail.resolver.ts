import { Type } from '@angular/core';
import { ResolveFn } from '@angular/router';

import {
  BEHAVIORAL,
  GuideEntry,
  PLAYBOOK,
  SYSTEM,
} from '../../shared/guides/guide.registry';

export type GuideDetailResolved = {
  slug: string;
  entry: GuideEntry;
  component: Type<unknown>;
};

const PREP_PATH_RX = /-prep-path$/;

async function resolveGuide(
  slug: string,
  registry: GuideEntry[],
): Promise<GuideDetailResolved | null> {
  if (!slug) return null;
  const entry = registry.find((item) => item.slug === slug);
  if (!entry) return null;

  try {
    const component = (await entry.load()) as Type<unknown>;
    return { slug, entry, component };
  } catch {
    return null;
  }
}

export const playbookGuideDetailResolver: ResolveFn<GuideDetailResolved | null> = (route) => {
  const slug = String(route.paramMap.get('slug') || '').trim();
  const frameworkOnly = route.data?.['frameworkOnly'] === true;
  const registry = frameworkOnly
    ? PLAYBOOK.filter((entry) => PREP_PATH_RX.test(entry.slug))
    : PLAYBOOK;
  return resolveGuide(slug, registry);
};

export const systemGuideDetailResolver: ResolveFn<GuideDetailResolved | null> = (route) => {
  const slug = String(route.paramMap.get('slug') || '').trim();
  return resolveGuide(slug, SYSTEM);
};

export const behavioralGuideDetailResolver: ResolveFn<GuideDetailResolved | null> = (route) => {
  const slug = String(route.paramMap.get('slug') || '').trim();
  return resolveGuide(slug, BEHAVIORAL);
};

