import { MasteryPath } from './mastery-path.model';
import { JAVASCRIPT_MASTERY_PATH } from './paths/javascript-mastery.path';

export const MASTERY_PATHS: MasteryPath[] = [
  JAVASCRIPT_MASTERY_PATH,
];

export const MASTERY_PATH_BY_SLUG: ReadonlyMap<string, MasteryPath> = new Map(
  MASTERY_PATHS.map((path) => [path.frameworkSlug, path]),
);

export function getMasteryPathBySlug(slug: string): MasteryPath | null {
  return MASTERY_PATH_BY_SLUG.get(slug) ?? null;
}
