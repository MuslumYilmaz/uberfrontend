import { FRAMEWORK_FAMILY_BY_ID, FrameworkFamily, FrameworkVariant } from '../framework-families';

/**
 * Company facts the plan needs beyond the rounds: the framework its tasks follow, because the form does not
 * ask for one, and the other names people search for. No public page imports this file.
 */
export type CompanyPlanFramework = 'react' | 'angular' | 'vue' | 'javascript';

export type CompanyPlanProfile = {
  readonly framework: CompanyPlanFramework;
  /** Accounts disagree, so the framework is the best reading of them rather than a plain fact. */
  readonly mixed?: true;
  /** Why this framework, from the process table, the reports and the authored guide. */
  readonly evidence: string;
  /** Other names a company search should match. */
  readonly aliases?: readonly string[];
};

export const COMPANY_PLAN_PROFILES: Readonly<Record<string, CompanyPlanProfile>> = {
  agoda: {
    framework: 'react',
    evidence: "Agoda's interview page describes TypeScript with React and Redux, and one take-home was a React and TypeScript dashboard.",
  },
  airbnb: {
    framework: 'react',
    evidence: 'Accounts build UI in React or with the DOM, and React is the only framework they name.',
  },
  amazon: {
    framework: 'javascript',
    mixed: true,
    aliases: ['AWS'],
    evidence: 'The official assessment is in JavaScript and the table names no framework. Reported UI widgets are tagged in React, Angular and Vue only because the catalog has all three.',
  },
  anduril: {
    framework: 'react',
    evidence: 'A React file explorer in two accounts, and onsites usually have one round in React.',
  },
  apple: {
    framework: 'react',
    mixed: true,
    evidence: 'Screens and loops name React, JavaScript and TypeScript, and one reported autocomplete allowed Vue or React.',
  },
  'booking-com': {
    framework: 'react',
    evidence: 'The assessment includes a React component and coding rounds use plain JavaScript or React.',
  },
  bytedance: {
    framework: 'react',
    aliases: ['TikTok'],
    evidence: 'Frontend rounds name a React component and React fundamentals.',
  },
  'capital-one': {
    framework: 'react',
    mixed: true,
    evidence: "The technical hour was a React project, an Angular form or the candidate's framework, and one posting names Angular.",
  },
  crowdstrike: {
    framework: 'javascript',
    mixed: true,
    evidence: 'One take-home allowed any language or framework, and no account names a framework round. October 2026 postings name Ember and React.',
  },
  datadog: {
    framework: 'react',
    evidence: 'One full round is React live coding.',
  },
  elevenlabs: {
    framework: 'react',
    evidence: 'Accounts mention React bug fixes, a React knowledge check and a React take-home. The senior account names no stack.',
  },
  gitlab: {
    framework: 'vue',
    evidence: 'Merge request rounds name Vue, HTML and CSS.',
  },
  google: {
    framework: 'javascript',
    evidence: 'Screens are JavaScript or algorithm coding, and the table names no framework.',
  },
  intuit: {
    framework: 'react',
    evidence: 'Technical rounds name React and React internals, and the reported framework tasks are React.',
  },
  jpmorgan: {
    framework: 'react',
    aliases: ['JP Morgan'],
    evidence: 'Technical conversations and live coding name React.',
  },
  meta: {
    framework: 'javascript',
    aliases: ['Facebook', 'Instagram'],
    evidence: 'Every public account describes plain JavaScript rather than framework tasks.',
  },
  microsoft: {
    framework: 'react',
    evidence: 'React components in 2024 to 2025 accounts, plain JavaScript only in 2020 to 2021.',
  },
  netflix: {
    framework: 'javascript',
    mixed: true,
    evidence: 'The one detailed screen is plain JavaScript and the table names no framework. One 2024 report and the guide prompts use React.',
  },
  openai: {
    framework: 'react',
    mixed: true,
    evidence: 'React is the only framework named, in a 2023 exercise and a 2024 streaming UI report. Other accounts name JavaScript without a framework.',
  },
  revolut: {
    framework: 'react',
    evidence: 'An hour of React and TypeScript live coding.',
  },
  servicenow: {
    framework: 'javascript',
    mixed: true,
    evidence: 'Accounts test JavaScript fundamentals rather than a framework. One machine coding round allowed React, Angular or plain JavaScript.',
  },
  shopee: {
    framework: 'react',
    evidence: 'A React build in the Ho Chi Minh City loop and React internals in the mainland China loop.',
  },
  spotify: {
    framework: 'javascript',
    mixed: true,
    evidence: 'The final web rounds in the accounts are plain HTML, CSS and JavaScript; React came up only as a few questions in two 2020 screens.',
  },
  stripe: {
    framework: 'javascript',
    evidence: 'The table names no framework, and the reported tasks are JavaScript.',
  },
  tesla: {
    framework: 'react',
    mixed: true,
    evidence: 'Most rounds name React, and one final loop was Angular.',
  },
  uber: {
    framework: 'javascript',
    mixed: true,
    evidence: 'The specialization round was plain JavaScript in two accounts. The phone screen sometimes builds a React component.',
  },
  walmart: {
    framework: 'react',
    mixed: true,
    evidence: 'Most rounds name React. 2026 assessments offer React or Angular, and one reports an Angular task.',
  },
  waymo: {
    framework: 'angular',
    evidence: 'The 2026 frontend account debugged Angular UI code, and a 2023 commenter names Angular and JavaScript.',
  },
  xai: {
    framework: 'react',
    aliases: ['x.ai'],
    evidence: 'Postings ask for a small React app in TypeScript.',
  },
  zalando: {
    framework: 'react',
    evidence: 'The 2024 take-home was a React and Node app.',
  },
};

/**
 * Three-framework tasks missing from the shared map. That map also drives public company counts, the coding
 * list and SEO dates, so what only the plan needs stays here.
 */
export const COMPANY_PLAN_EXTRA_FAMILIES: readonly FrameworkFamily[] = [
  {
    key: 'chessboard-click-highlight',
    members: [
      { tech: 'react', id: 'react-chessboard-click-highlight', kind: 'coding' },
      { tech: 'angular', id: 'angular-chessboard-click-highlight', kind: 'coding' },
      { tech: 'vue', id: 'vue-chessboard-click-highlight', kind: 'coding' },
    ],
  },
];

/** Timed tasks that train the format of a live round, whatever the company. Picked per framework. */
export const COMPANY_PLAN_FORMAT_PRACTICE: Readonly<Record<CompanyPlanFramework, readonly string[]>> = {
  react: ['react-debounced-search', 'react-pagination-table'],
  angular: ['angular-debounced-search', 'angular-pagination-table'],
  vue: ['vue-debounced-search', 'vue-pagination-table'],
  javascript: ['js-throttle', 'js-promise-all'],
};

/**
 * General design cases a senior or staff plan adds to the design round the person faces next, after the company's
 * own cases and up to the level's cap. Offline-first comes first because chat and inbox rounds ask about it.
 */
export const COMPANY_PLAN_DESIGN_PRACTICE: readonly string[] = [
  'offline-email-client',
  'component-design-system-architecture',
  'news-feed-timeline',
  'dashboard-widgets-draggable-resizable',
];

/** Where a plan starts when the company is unlisted, and what fills a preview short of open tasks. */
export const COMPANY_PLAN_STARTERS: readonly string[] = [
  'js-debounce',
  'js-throttle',
  'js-promise-all',
  'js-valid-parentheses',
  'js-retry-with-delay',
  'js-curry-function',
  'js-memoize-function',
  'js-promise-any',
  'js-stream-to-text',
  'js-sleep',
];

/** The guide a round of this kind links to when its process row names none. */
export const COMPANY_PLAN_GUIDES = {
  people: { label: 'Behavioral interview guide', path: '/guides/behavioral' },
  design: { label: 'Frontend system design blueprint', path: '/guides/system-design-blueprint' },
} as const;

const EXTRA_FAMILY_BY_ID = new Map(COMPANY_PLAN_EXTRA_FAMILIES.flatMap((family) => family.members.map((member) => [member.id, family] as const)));

function familyOf(id: string): FrameworkFamily | undefined {
  return FRAMEWORK_FAMILY_BY_ID.get(id) ?? EXTRA_FAMILY_BY_ID.get(id);
}

/** Tasks with one key are the same exercise in different frameworks, so a plan takes one of them. */
export function companyPlanFamilyKey(id: string): string | null {
  return familyOf(id)?.key ?? null;
}

/**
 * The same task in a company's framework, or null when the task has no counterparts. A company with no
 * framework of its own still needs one for UI builds, so it gets React, the largest set of tasks.
 */
export function companyPlanFamilyMember(id: string, framework: CompanyPlanFramework): FrameworkVariant | null {
  const tech = framework === 'javascript' ? 'react' : framework;
  return familyOf(id)?.members.find((member) => member.tech === tech) ?? null;
}
