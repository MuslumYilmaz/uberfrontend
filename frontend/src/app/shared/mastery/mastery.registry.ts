import { MasteryPath } from './mastery-path.model';
import { JAVASCRIPT_MASTERY_PATH } from './paths/javascript-mastery.path';

function comingSoonPath(frameworkSlug: string, title: string): MasteryPath {
  return {
    pathId: `${frameworkSlug}-mastery`,
    frameworkSlug,
    availability: 'coming-soon',
    title: `${title} Mastery Crash Track`,
    subtitle: 'This mastery track will be added in the next path rollout.',
    description: 'Track structure is ready. Content is not published yet for this framework.',
    theme: {
      accent: '#6cc2ff',
      accentSoft: '#324a68',
      surfaceTint: '#1c2e4a',
    },
    scoring: {
      knowledgeWeight: 35,
      codingWeight: 65,
    },
    modules: [],
    items: [],
  };
}

export const MASTERY_PATHS: MasteryPath[] = [
  JAVASCRIPT_MASTERY_PATH,
  comingSoonPath('react-prep-path', 'React'),
  comingSoonPath('angular-prep-path', 'Angular'),
  comingSoonPath('vue-prep-path', 'Vue'),
];

export const MASTERY_PATH_BY_SLUG: ReadonlyMap<string, MasteryPath> = new Map(
  MASTERY_PATHS.map((path) => [path.frameworkSlug, path]),
);

export function getMasteryPathBySlug(slug: string): MasteryPath | null {
  return MASTERY_PATH_BY_SLUG.get(slug) ?? null;
}
