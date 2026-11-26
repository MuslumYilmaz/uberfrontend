/** Published research reports: the /research hub lists them and each report page reads its own entry. */
export type ResearchReport = {
  slug: string;
  route: string;
  title: string;
  lead: string;
  description: string;
  summary: string;
  /** Day the report went public, as an ISO date; set on the release day. */
  publishedAt: string;
  publishedLabel: string;
  minutes: number;
  keywords: readonly string[];
  author: { name: string; url: string };
  sourceUrl: string;
};

export const ONPUSH_READINESS_REPORT: ResearchReport = {
  slug: 'angular-onpush-readiness',
  route: '/research/angular-onpush-readiness',
  title: 'OnPush by default: how much real Angular code is ready?',
  lead: 'A static reading of 31,531 components in 225 open-source Angular apps, with the code behind every finding.',
  description:
    'A static reading of 31,531 components in 225 open-source Angular apps: which components could drop the Eager stamp under OnPush by default, and what breaks.',
  summary:
    'In the 56 Angular 22 apps found without searching for the Eager stamp, 55% of components already declare OnPush. Of the components that still carry the stamp, 54% have no path around the OnPush triggers and 40% have at least one. In 93% of the components blocked by their own code, the only blocking finding is an asynchronous write of rendered state.',
  publishedAt: '2026-11-25',
  publishedLabel: 'November 2026',
  minutes: 38,
  keywords: [
    'Angular OnPush',
    'Angular 22',
    'ChangeDetectionStrategy.Eager',
    'OnPush by default',
    'Angular change detection',
    'zoneless Angular',
  ],
  author: { name: 'Müslim Yılmaz', url: 'https://github.com/MuslumYilmaz' },
  sourceUrl: 'https://github.com/MuslumYilmaz/onpush-census',
};

export const RESEARCH_REPORTS: readonly ResearchReport[] = [ONPUSH_READINESS_REPORT];
