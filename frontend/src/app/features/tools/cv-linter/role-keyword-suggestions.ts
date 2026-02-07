import { CvRole } from '../../../core/models/cv-linter.model';

export type KeywordSuggestionTier = 'critical' | 'strong';

export interface RoleKeywordSuggestion {
  label: string;
  tier: KeywordSuggestionTier;
  tokens: string[];
  starter: string;
}

export const ROLE_KEYWORD_SUGGESTIONS: Record<CvRole, RoleKeywordSuggestion[]> = {
  senior_frontend_angular: [
    { label: 'accessibility (a11y)', tier: 'critical', tokens: ['accessibility', 'a11y', 'wcag', 'aria'], starter: 'Improved accessibility (a11y) by ...' },
    { label: 'performance', tier: 'critical', tokens: ['performance', 'web vitals', 'lcp', 'cls', 'ttfb'], starter: 'Optimized performance by ...' },
    { label: 'change detection (OnPush)', tier: 'critical', tokens: ['change detection', 'onpush', 'signals'], starter: 'Improved change detection (OnPush/signals) to ...' },
    { label: 'RxJS', tier: 'critical', tokens: ['rxjs', 'observables'], starter: 'Built reactive flows with RxJS observables to ...' },
    { label: 'NgRx', tier: 'critical', tokens: ['ngrx', 'state management'], starter: 'Used NgRx state management to ...' },
    { label: 'state management', tier: 'critical', tokens: ['state management', 'signals store'], starter: 'Strengthened state management to ...' },
    { label: 'TypeScript', tier: 'critical', tokens: ['typescript'], starter: 'Applied TypeScript typing to ...' },
    { label: 'unit testing', tier: 'critical', tokens: ['testing', 'unit test', 'jasmine', 'karma', 'jest'], starter: 'Expanded unit testing coverage to ...' },
    { label: 'SSR', tier: 'strong', tokens: ['ssr', 'angular universal', 'server-side rendering'], starter: 'Implemented SSR (Angular Universal) to ...' },
    { label: 'lazy loading', tier: 'strong', tokens: ['lazy loading', 'lazy load'], starter: 'Introduced lazy loading to ...' },
    { label: 'CI/CD', tier: 'strong', tokens: ['ci/cd', 'pipeline', 'continuous integration'], starter: 'Improved CI/CD pipeline reliability by ...' },
    { label: 'observability (Sentry)', tier: 'strong', tokens: ['observability', 'monitoring', 'telemetry', 'sentry'], starter: 'Added observability (Sentry/monitoring) to ...' },
    { label: 'Angular Material/design systems', tier: 'strong', tokens: ['angular material', 'design system'], starter: 'Scaled Angular Material/design system components by ...' },
  ],
  senior_frontend_react: [
    { label: 'accessibility (a11y)', tier: 'critical', tokens: ['accessibility', 'a11y', 'wcag', 'aria'], starter: 'Improved accessibility (a11y) by ...' },
    { label: 'performance', tier: 'critical', tokens: ['performance', 'web vitals', 'lcp', 'cls', 'ttfb'], starter: 'Optimized performance by ...' },
    { label: 'TypeScript', tier: 'critical', tokens: ['typescript'], starter: 'Applied TypeScript typing to ...' },
    { label: 'state management', tier: 'critical', tokens: ['state management', 'redux'], starter: 'Strengthened state management with Redux to ...' },
    { label: 'unit testing', tier: 'critical', tokens: ['testing', 'unit test', 'jest', 'cypress'], starter: 'Expanded unit testing coverage to ...' },
    { label: 'React hooks', tier: 'critical', tokens: ['react', 'hooks'], starter: 'Built reusable React hooks to ...' },
    { label: 'SSR (Next.js)', tier: 'strong', tokens: ['next.js', 'ssr', 'server-side rendering'], starter: 'Implemented SSR with Next.js to ...' },
    { label: 'lazy loading', tier: 'strong', tokens: ['lazy loading'], starter: 'Introduced lazy loading to ...' },
    { label: 'CI/CD', tier: 'strong', tokens: ['ci/cd', 'pipeline'], starter: 'Improved CI/CD pipeline reliability by ...' },
    { label: 'observability', tier: 'strong', tokens: ['observability', 'monitoring'], starter: 'Added observability to ...' },
  ],
  senior_frontend_general: [
    { label: 'accessibility (a11y)', tier: 'critical', tokens: ['accessibility', 'a11y', 'wcag', 'aria'], starter: 'Improved accessibility (a11y) by ...' },
    { label: 'performance', tier: 'critical', tokens: ['performance', 'web vitals', 'lcp', 'cls', 'ttfb'], starter: 'Optimized performance by ...' },
    { label: 'TypeScript', tier: 'critical', tokens: ['typescript'], starter: 'Applied TypeScript typing to ...' },
    { label: 'state management', tier: 'critical', tokens: ['state management'], starter: 'Strengthened state management to ...' },
    { label: 'unit testing', tier: 'critical', tokens: ['testing', 'unit test', 'jest'], starter: 'Expanded unit testing coverage to ...' },
    { label: 'CI/CD', tier: 'strong', tokens: ['ci/cd', 'pipeline'], starter: 'Improved CI/CD pipeline reliability by ...' },
    { label: 'observability', tier: 'strong', tokens: ['observability', 'monitoring'], starter: 'Added observability to ...' },
  ],
};

