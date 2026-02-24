import { ResolveFn } from '@angular/router';
import type { MasteryPath } from '../../shared/mastery/mastery-path.model';

export type MasteryPathResolved = {
  slug: string;
  path: MasteryPath;
};

export const masteryPathResolver: ResolveFn<MasteryPathResolved | null> = async (route) => {
  const slug = String(route.paramMap.get('slug') || '').trim();
  if (!slug) return null;

  const { getMasteryPathBySlug } = await import('../../shared/mastery/mastery.registry');
  const path = getMasteryPathBySlug(slug);
  if (!path) return null;

  return {
    slug,
    path,
  };
};
