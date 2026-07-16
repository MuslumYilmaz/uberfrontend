import { QuestionKind } from '../../core/models/question.model';
import { Tech } from '../../core/models/user.model';
import { TRACK_REGISTRY } from '../../generated/content-metadata';

export type TrackSlug = string;
export type TrackQuestionKind = QuestionKind | 'system-design';

export interface TrackQuestionRef {
  id: string;
  kind: TrackQuestionKind;
  tech?: Tech; // required for coding/trivia
}

export interface TrackConfig {
  slug: TrackSlug;
  title: string;
  subtitle: string;
  durationLabel: string;
  focus: string[];
  featured: TrackQuestionRef[];
  browseParams: Record<string, string | null>;
  hidden?: boolean;
}

export interface TrackMetrics {
  uniquePrompts: number;
  javascript: number;
  frameworkCoding: number;
  htmlCss: number;
  conceptQuestions: number;
  systemDesign: number;
  categoryTotal: number;
  categoriesOverlap: boolean;
}

type TrackRegistry = {
  schemaVersion: 1;
  tracks: TrackConfig[];
};

export const TRACKS: TrackConfig[] = (TRACK_REGISTRY as TrackRegistry).tracks;

export const TRACK_LOOKUP = new Map<TrackSlug, TrackConfig>(
  TRACKS.map((t) => [t.slug, t]),
);

export function trackQuestionRefKey(ref: TrackQuestionRef): string {
  return `${String(ref.tech || 'none').toLowerCase()}::${ref.kind}::${ref.id}`;
}

export function uniqueTrackQuestionRefs(refs: TrackQuestionRef[]): TrackQuestionRef[] {
  const seen = new Set<string>();
  return refs.filter((ref) => {
    const key = trackQuestionRefKey(ref);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function deriveTrackMetrics(track: TrackConfig): TrackMetrics {
  const refs = uniqueTrackQuestionRefs(track.featured);
  const frameworkTechs = new Set<Tech>(['react', 'angular', 'vue']);
  const htmlCssTechs = new Set<Tech>(['html', 'css']);

  const metrics: TrackMetrics = {
    uniquePrompts: refs.length,
    javascript: refs.filter((ref) => ref.tech === 'javascript').length,
    frameworkCoding: refs.filter(
      (ref) => ref.kind === 'coding' && !!ref.tech && frameworkTechs.has(ref.tech),
    ).length,
    htmlCss: refs.filter((ref) => !!ref.tech && htmlCssTechs.has(ref.tech)).length,
    conceptQuestions: refs.filter((ref) => ref.kind === 'trivia').length,
    systemDesign: refs.filter((ref) => ref.kind === 'system-design').length,
    categoryTotal: 0,
    categoriesOverlap: false,
  };

  metrics.categoryTotal = metrics.javascript
    + metrics.frameworkCoding
    + metrics.htmlCss
    + metrics.conceptQuestions
    + metrics.systemDesign;
  metrics.categoriesOverlap = metrics.categoryTotal > metrics.uniquePrompts;
  return metrics;
}
