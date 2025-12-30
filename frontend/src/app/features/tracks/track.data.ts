import { QuestionKind } from '../../core/models/question.model';
import { Tech } from '../../core/models/user.model';
import trackRegistry from '../../../assets/questions/track-registry.json';

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

type TrackRegistry = {
  schemaVersion: 1;
  tracks: TrackConfig[];
};

export const TRACKS: TrackConfig[] = (trackRegistry as TrackRegistry).tracks;

export const TRACK_LOOKUP = new Map<TrackSlug, TrackConfig>(
  TRACKS.map((t) => [t.slug, t]),
);
