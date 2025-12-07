import { QuestionKind } from '../../core/models/question.model';
import { Tech } from '../../core/models/user.model';

export type TrackSlug = 'faang' | 'senior' | 'crash-7d' | 'foundations-30d';
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
}

export const TRACKS: TrackConfig[] = [
  {
    slug: 'faang',
    title: 'FAANG Track',
    subtitle: 'Intense prep: core JS, UI, and system design for Big Tech interviews.',
    durationLabel: 'Pick your pace',
    focus: [
      'Async JavaScript, concurrency, and performance tuning',
      'UI state patterns across React and Angular',
      'System design prompts tuned for front-end surfaces',
    ],
    browseParams: {
      kind: 'coding',
      diff: 'intermediate,hard',
      imp: 'medium,high',
      reset: '1',
    },
    featured: [
      { id: 'js-throttle', tech: 'javascript', kind: 'coding' },
      { id: 'js-debounce', tech: 'javascript', kind: 'coding' },
      { id: 'js-memoize-function', tech: 'javascript', kind: 'coding' },
      { id: 'js-promise-all', tech: 'javascript', kind: 'coding' },
      { id: 'js-concurrency-map-limit', tech: 'javascript', kind: 'coding' },
      { id: 'js-deep-equal', tech: 'javascript', kind: 'coding' },
      { id: 'js-deep-clone', tech: 'javascript', kind: 'coding' },
      { id: 'js-abortable-helpers', tech: 'javascript', kind: 'coding' },
      { id: 'js-streaming-ndjson-parser', tech: 'javascript', kind: 'coding' },
      { id: 'react-debounced-search', tech: 'react', kind: 'coding' },
      { id: 'react-shopping-cart', tech: 'react', kind: 'coding' },
      { id: 'angular-debounced-search', tech: 'angular', kind: 'coding' },
      { id: 'infinite-scroll-list', kind: 'system-design' },
      { id: 'realtime-search-debounce-cache', kind: 'system-design' },
    ],
  },
  {
    slug: 'senior',
    title: 'Senior Engineer Track',
    subtitle: 'Architecture, performance, and deep system design for senior roles.',
    durationLabel: 'Pick your pace',
    focus: [
      'Performance, streaming, and reliability patterns',
      'State management and theming at scale',
      'System design scenarios with UX constraints',
    ],
    browseParams: {
      view: 'formats',
      category: 'system',
      kind: 'coding',
      diff: 'intermediate,hard',
      imp: 'medium,high',
      reset: '1',
    },
    featured: [
      { id: 'js-streaming-ndjson-parser', tech: 'javascript', kind: 'coding' },
      { id: 'js-abortable-helpers', tech: 'javascript', kind: 'coding' },
      { id: 'js-concurrency-map-limit', tech: 'javascript', kind: 'coding' },
      { id: 'js-memoize-function', tech: 'javascript', kind: 'coding' },
      { id: 'js-throttle', tech: 'javascript', kind: 'coding' },
      { id: 'react-theme-toggle', tech: 'react', kind: 'coding' },
      { id: 'react-debounced-search', tech: 'react', kind: 'coding' },
      { id: 'angular-theme-toggle', tech: 'angular', kind: 'coding' },
      { id: 'css-theme-variables-dark-mode', tech: 'css', kind: 'coding' },
      { id: 'dashboard-widgets-draggable-resizable', kind: 'system-design' },
      { id: 'realtime-search-debounce-cache', kind: 'system-design' },
      { id: 'notification-toast-system', kind: 'system-design' },
    ],
  },
  {
    slug: 'crash-7d',
    title: 'Crash Track (7 days)',
    subtitle: 'Short deadline? Focused 7-day curriculum on the highest-signal topics.',
    durationLabel: '7-day focus',
    focus: [
      'Async JS primitives: debounce, throttle, and promises',
      'UI data flows: search, pagination, and table state',
      'One FE system design prompt to cover architecture patterns',
    ],
    browseParams: {
      view: 'formats',
      category: 'algo',
      kind: 'coding',
      diff: 'intermediate,hard',
      imp: 'medium,high',
      reset: '1',
    },
    featured: [
      { id: 'js-debounce', tech: 'javascript', kind: 'coding' },
      { id: 'js-throttle', tech: 'javascript', kind: 'coding' },
      { id: 'js-promise-all', tech: 'javascript', kind: 'coding' },
      { id: 'js-add-two-promises', tech: 'javascript', kind: 'coding' },
      { id: 'js-memoize-function', tech: 'javascript', kind: 'coding' },
      { id: 'js-deep-equal', tech: 'javascript', kind: 'coding' },
      { id: 'react-debounced-search', tech: 'react', kind: 'coding' },
      { id: 'react-pagination-table', tech: 'react', kind: 'coding' },
      { id: 'css-flexbox-navbar', tech: 'css', kind: 'coding' },
      { id: 'realtime-search-debounce-cache', kind: 'system-design' },
    ],
  },
  {
    slug: 'foundations-30d',
    title: 'Foundations Track (30 days)',
    subtitle: 'Rebuild your fundamentals step by step before going deeper.',
    durationLabel: '30-day fundamentals',
    focus: [
      'JavaScript basics, arrays, and control flow',
      'HTML semantics and accessible forms',
      'CSS layout fundamentals: box model, positioning, flex/grid',
      'Starter React, Angular, and Vue components',
    ],
    browseParams: {
      kind: 'coding',
      diff: 'easy,intermediate',
      imp: 'low,medium',
      reset: '1',
    },
    featured: [
      { id: 'js-reverse-string', tech: 'javascript', kind: 'coding' },
      { id: 'js-count-vowels', tech: 'javascript', kind: 'coding' },
      { id: 'js-flatten-once', tech: 'javascript', kind: 'coding' },
      { id: 'js-unique-array', tech: 'javascript', kind: 'coding' },
      { id: 'js-array-prototype-map', tech: 'javascript', kind: 'coding' },
      { id: 'js-array-prototype-filter', tech: 'javascript', kind: 'coding' },
      { id: 'js-array-prototype-reduce', tech: 'javascript', kind: 'coding' },
      { id: 'js-create-counter', tech: 'javascript', kind: 'coding' },
      { id: 'js-compact', tech: 'javascript', kind: 'coding' },
      { id: 'html-semantic-layout', tech: 'html', kind: 'coding' },
      { id: 'html-forms-input-basics', tech: 'html', kind: 'coding' },
      { id: 'css-box-model-margin-padding-border', tech: 'css', kind: 'coding' },
      { id: 'css-positioning-badge', tech: 'css', kind: 'coding' },
      { id: 'css-grid-card-gallery', tech: 'css', kind: 'coding' },
      { id: 'react-counter', tech: 'react', kind: 'coding' },
      { id: 'react-tabs-switcher', tech: 'react', kind: 'coding' },
      { id: 'angular-counter-starter', tech: 'angular', kind: 'coding' },
      { id: 'vue-counter', tech: 'vue', kind: 'coding' },
    ],
  },
];

export const TRACK_LOOKUP = new Map<TrackSlug, TrackConfig>(
  TRACKS.map((t) => [t.slug, t]),
);
