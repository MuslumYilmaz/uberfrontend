import { CvRole } from '../../../core/models/cv-linter.model';

export type KeywordSuggestionTier = 'critical' | 'strong';

export interface RoleKeywordSuggestion {
  label: string;
  tier: KeywordSuggestionTier;
  tokens: string[];
  starter: string;
}

const JUNIOR_GENERAL_SUGGESTIONS: RoleKeywordSuggestion[] = [
  { label: 'JavaScript', tier: 'critical', tokens: ['javascript'], starter: 'Built JavaScript interactions to ...' },
  { label: 'HTML/CSS', tier: 'critical', tokens: ['html', 'css', 'html / css'], starter: 'Built semantic HTML and CSS layouts for ...' },
  { label: 'responsive design', tier: 'critical', tokens: ['responsive design', 'mobile-first', 'cross-browser'], starter: 'Created responsive design improvements for ...' },
  { label: 'Git/GitHub', tier: 'critical', tokens: ['git', 'github', 'git / github'], starter: 'Used Git/GitHub workflow to ...' },
  { label: 'API integration', tier: 'critical', tokens: ['api integration', 'rest', 'graphql', 'api'], starter: 'Integrated API data into ...' },
  { label: 'projects/portfolio', tier: 'critical', tokens: ['projects', 'portfolio', 'projects / portfolio'], starter: 'Built a portfolio project that ...' },
  { label: 'basic testing', tier: 'critical', tokens: ['testing', 'unit test', 'jest', 'testing library'], starter: 'Added basic testing for ...' },
  { label: 'accessibility basics', tier: 'critical', tokens: ['accessibility', 'a11y', 'wcag', 'aria'], starter: 'Improved accessibility basics by ...' },
  { label: 'TypeScript', tier: 'strong', tokens: ['typescript'], starter: 'Applied TypeScript typing to ...' },
  { label: 'performance basics', tier: 'strong', tokens: ['performance', 'lighthouse'], starter: 'Improved frontend performance by ...' },
];

const JUNIOR_ANGULAR_SUGGESTIONS: RoleKeywordSuggestion[] = [
  { label: 'Angular', tier: 'critical', tokens: ['angular', 'angularjs', 'angular.js'], starter: 'Built Angular components for ...' },
  { label: 'TypeScript', tier: 'critical', tokens: ['typescript'], starter: 'Applied TypeScript typing to ...' },
  { label: 'HTML/CSS', tier: 'critical', tokens: ['html', 'css', 'html / css'], starter: 'Built semantic HTML and CSS layouts for ...' },
  { label: 'responsive design', tier: 'critical', tokens: ['responsive design', 'mobile-first'], starter: 'Created responsive Angular layouts for ...' },
  { label: 'API integration', tier: 'critical', tokens: ['api integration', 'rest', 'api'], starter: 'Integrated API data into Angular views for ...' },
  { label: 'projects/portfolio', tier: 'critical', tokens: ['projects', 'portfolio', 'projects / portfolio'], starter: 'Built an Angular portfolio project that ...' },
  { label: 'basic testing', tier: 'critical', tokens: ['testing', 'unit test', 'jasmine', 'karma', 'jest'], starter: 'Added Angular testing coverage for ...' },
  { label: 'RxJS', tier: 'strong', tokens: ['rxjs', 'observables'], starter: 'Used RxJS observables to ...' },
  { label: 'Git/GitHub', tier: 'strong', tokens: ['git', 'github'], starter: 'Used Git/GitHub workflow to ...' },
  { label: 'accessibility basics', tier: 'strong', tokens: ['accessibility', 'a11y', 'aria'], starter: 'Improved accessibility basics by ...' },
];

const JUNIOR_REACT_SUGGESTIONS: RoleKeywordSuggestion[] = [
  { label: 'React', tier: 'critical', tokens: ['react', 'reactjs', 'react.js'], starter: 'Built React components for ...' },
  { label: 'JavaScript', tier: 'critical', tokens: ['javascript'], starter: 'Built JavaScript interactions to ...' },
  { label: 'HTML/CSS', tier: 'critical', tokens: ['html', 'css', 'html / css'], starter: 'Built semantic HTML and CSS layouts for ...' },
  { label: 'responsive design', tier: 'critical', tokens: ['responsive design', 'mobile-first'], starter: 'Created responsive React layouts for ...' },
  { label: 'API integration', tier: 'critical', tokens: ['api integration', 'rest', 'api'], starter: 'Integrated API data into React views for ...' },
  { label: 'projects/portfolio', tier: 'critical', tokens: ['projects', 'portfolio', 'projects / portfolio'], starter: 'Built a React portfolio project that ...' },
  { label: 'basic testing', tier: 'critical', tokens: ['testing', 'unit test', 'jest', 'testing library'], starter: 'Added React testing coverage for ...' },
  { label: 'React hooks', tier: 'strong', tokens: ['hooks', 'usestate', 'useeffect', 'usememo', 'usecallback'], starter: 'Built reusable React hooks to ...' },
  { label: 'state management basics', tier: 'strong', tokens: ['state management', 'redux', 'context api', 'zustand'], starter: 'Managed React state with ...' },
  { label: 'TypeScript', tier: 'strong', tokens: ['typescript'], starter: 'Applied TypeScript typing to ...' },
];

const MID_GENERAL_SUGGESTIONS: RoleKeywordSuggestion[] = [
  { label: 'TypeScript', tier: 'critical', tokens: ['typescript'], starter: 'Applied TypeScript typing to ...' },
  { label: 'JavaScript', tier: 'critical', tokens: ['javascript'], starter: 'Improved JavaScript implementation for ...' },
  { label: 'state management', tier: 'critical', tokens: ['state management', 'redux', 'ngrx', 'zustand', 'context api'], starter: 'Strengthened state management to ...' },
  { label: 'testing', tier: 'critical', tokens: ['testing', 'unit test', 'jest', 'testing library', 'cypress'], starter: 'Expanded testing coverage to ...' },
  { label: 'accessibility (a11y)', tier: 'critical', tokens: ['accessibility', 'a11y', 'wcag', 'aria'], starter: 'Improved accessibility (a11y) by ...' },
  { label: 'performance', tier: 'critical', tokens: ['performance', 'web vitals', 'lcp', 'cls'], starter: 'Optimized performance by ...' },
  { label: 'API integration', tier: 'critical', tokens: ['api integration', 'rest', 'graphql', 'api'], starter: 'Improved API integration by ...' },
  { label: 'CI/CD', tier: 'strong', tokens: ['ci/cd', 'pipeline', 'continuous integration'], starter: 'Improved CI/CD pipeline reliability by ...' },
  { label: 'component architecture', tier: 'strong', tokens: ['component architecture', 'components', 'design system'], starter: 'Improved component architecture by ...' },
  { label: 'responsive design', tier: 'strong', tokens: ['responsive design', 'mobile-first'], starter: 'Improved responsive frontend delivery by ...' },
];

const MID_ANGULAR_SUGGESTIONS: RoleKeywordSuggestion[] = [
  { label: 'Angular', tier: 'critical', tokens: ['angular', 'angularjs', 'angular.js'], starter: 'Built Angular features for ...' },
  { label: 'TypeScript', tier: 'critical', tokens: ['typescript'], starter: 'Applied TypeScript typing to ...' },
  { label: 'RxJS', tier: 'critical', tokens: ['rxjs', 'observables'], starter: 'Built reactive flows with RxJS observables to ...' },
  { label: 'NgRx/state management', tier: 'critical', tokens: ['ngrx', 'state management', 'signals store'], starter: 'Used NgRx state management to ...' },
  { label: 'testing', tier: 'critical', tokens: ['testing', 'jasmine', 'karma', 'jest', 'cypress'], starter: 'Expanded Angular testing coverage to ...' },
  { label: 'accessibility (a11y)', tier: 'critical', tokens: ['accessibility', 'a11y', 'wcag', 'aria'], starter: 'Improved accessibility (a11y) by ...' },
  { label: 'performance', tier: 'critical', tokens: ['performance', 'web vitals', 'lcp', 'cls'], starter: 'Optimized Angular performance by ...' },
  { label: 'API integration', tier: 'strong', tokens: ['api integration', 'rest', 'graphql'], starter: 'Improved API integration in Angular by ...' },
  { label: 'CI/CD', tier: 'strong', tokens: ['ci/cd', 'pipeline', 'continuous integration'], starter: 'Improved CI/CD pipeline reliability by ...' },
  { label: 'component architecture', tier: 'strong', tokens: ['component architecture', 'components', 'design system'], starter: 'Improved Angular component architecture by ...' },
];

const MID_REACT_SUGGESTIONS: RoleKeywordSuggestion[] = [
  { label: 'React', tier: 'critical', tokens: ['react', 'reactjs', 'react.js'], starter: 'Built React features for ...' },
  { label: 'TypeScript', tier: 'critical', tokens: ['typescript'], starter: 'Applied TypeScript typing to ...' },
  { label: 'React hooks', tier: 'critical', tokens: ['hooks', 'usestate', 'useeffect', 'usememo', 'usecallback'], starter: 'Built reusable React hooks to ...' },
  { label: 'state management', tier: 'critical', tokens: ['state management', 'redux toolkit', 'redux', 'zustand', 'context api'], starter: 'Strengthened React state management to ...' },
  { label: 'testing', tier: 'critical', tokens: ['testing', 'jest', 'testing library', 'cypress', 'playwright'], starter: 'Expanded React testing coverage to ...' },
  { label: 'accessibility (a11y)', tier: 'critical', tokens: ['accessibility', 'a11y', 'wcag', 'aria'], starter: 'Improved accessibility (a11y) by ...' },
  { label: 'performance', tier: 'critical', tokens: ['performance', 'web vitals', 'lcp', 'cls'], starter: 'Optimized React performance by ...' },
  { label: 'API integration', tier: 'strong', tokens: ['api integration', 'rest', 'graphql'], starter: 'Improved API integration in React by ...' },
  { label: 'CI/CD', tier: 'strong', tokens: ['ci/cd', 'pipeline', 'continuous integration'], starter: 'Improved CI/CD pipeline reliability by ...' },
  { label: 'component architecture', tier: 'strong', tokens: ['component architecture', 'components', 'design system'], starter: 'Improved React component architecture by ...' },
];

export const ROLE_KEYWORD_SUGGESTIONS: Record<CvRole, RoleKeywordSuggestion[]> = {
  junior_frontend_general: JUNIOR_GENERAL_SUGGESTIONS,
  junior_frontend_angular: JUNIOR_ANGULAR_SUGGESTIONS,
  junior_frontend_react: JUNIOR_REACT_SUGGESTIONS,
  mid_frontend_general: MID_GENERAL_SUGGESTIONS,
  mid_frontend_angular: MID_ANGULAR_SUGGESTIONS,
  mid_frontend_react: MID_REACT_SUGGESTIONS,
  senior_frontend_general: [
    { label: 'accessibility (a11y)', tier: 'critical', tokens: ['accessibility', 'a11y', 'wcag', 'aria'], starter: 'Improved accessibility (a11y) by ...' },
    { label: 'performance', tier: 'critical', tokens: ['performance', 'web vitals', 'lcp', 'cls', 'ttfb'], starter: 'Optimized performance by ...' },
    { label: 'TypeScript', tier: 'critical', tokens: ['typescript'], starter: 'Applied TypeScript typing to ...' },
    { label: 'state management', tier: 'critical', tokens: ['state management'], starter: 'Strengthened state management to ...' },
    { label: 'unit testing', tier: 'critical', tokens: ['testing', 'unit test', 'jest'], starter: 'Expanded unit testing coverage to ...' },
    { label: 'CI/CD', tier: 'strong', tokens: ['ci/cd', 'pipeline'], starter: 'Improved CI/CD pipeline reliability by ...' },
    { label: 'observability', tier: 'strong', tokens: ['observability', 'monitoring'], starter: 'Added observability to ...' },
  ],
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
};
