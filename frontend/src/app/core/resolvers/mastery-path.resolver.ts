import { ResolveFn } from '@angular/router';
import { MasteryPath } from '../../shared/mastery/mastery-path.model';
import { getMasteryPathBySlug } from '../../shared/mastery/mastery.registry';

export type MasteryPathResolved = {
  slug: string;
  path: MasteryPath;
};

export const masteryPathResolver: ResolveFn<MasteryPathResolved | null> = (route) => {
  const slug = String(route.paramMap.get('slug') || '').trim();
  if (!slug) return null;

  const path = getMasteryPathBySlug(slug);
  if (!path) return null;

  return {
    slug,
    path,
  };
};
