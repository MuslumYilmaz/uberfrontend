import type { PrepRoadmapItem } from './prep-roadmap.component';

export type PrepRoadmapSwitcherItem = PrepRoadmapItem & {
  id: 'interview_blueprint' | 'essential_60' | 'question_library' | 'study_plans' | 'final_rounds';
  match: RegExp[];
};

const TECH_SEGMENT = '(javascript|angular|react|vue|html|css)';

export const INTERVIEW_PREP_ROADMAP_ITEMS: PrepRoadmapItem[] = [
  {
    step: 1,
    title: 'Frontend interview preparation guide',
    description: 'Start by learning the interview formats, scoring signals, and how to sequence practice.',
    route: ['/guides', 'interview-blueprint', 'intro'],
    badge: 'Start here',
    meta: 'Process, rounds, and prep plan',
    tone: 'recommended',
  },
  {
    step: 2,
    title: 'FrontendAtlas Essential 60',
    description: 'Work through the core shortlist across JavaScript utilities, UI coding, concepts, and system design.',
    route: ['/interview-questions/essential'],
    meta: 'Core practice block',
    tone: 'practice',
  },
  {
    step: 3,
    title: 'Broaden with Question Library',
    description: 'Use filters for more coding, concepts, and stack-specific coverage after the core block.',
    route: ['/coding'],
    queryParams: { reset: 1 },
    meta: 'Format, stack, and difficulty filters',
    tone: 'structured',
  },
  {
    step: 4,
    title: 'Move into Study Plans / Framework Prep',
    description: 'Use tracks when you need a repeatable sequence, or framework paths when one stack needs depth.',
    route: ['/tracks'],
    meta: 'Structured sequence + stack depth',
    tone: 'structured',
  },
  {
    step: 5,
    title: 'Add final-round coverage',
    description: 'Layer in system design, behavioral, and company-style follow-ups once core practice is stable.',
    route: ['/system-design'],
    meta: 'System design + behavioral + company prep',
    tone: 'advanced',
  },
];

export const INTERVIEW_PREP_SWITCHER_ITEMS: PrepRoadmapSwitcherItem[] = INTERVIEW_PREP_ROADMAP_ITEMS.map((item) => {
  switch (item.step) {
    case 1:
      return {
        ...item,
        id: 'interview_blueprint',
        match: [/^\/guides\/interview-blueprint(?:\/.*)?$/],
      };
    case 2:
      return {
        ...item,
        id: 'essential_60',
        match: [/^\/interview-questions\/essential\/?$/],
      };
    case 3:
      return {
        ...item,
        id: 'question_library',
        match: [
          /^\/coding\/?$/,
          new RegExp(`^/${TECH_SEGMENT}/?$`),
          new RegExp(`^/${TECH_SEGMENT}/(?:coding|trivia|debug)/?$`),
        ],
      };
    case 4:
      return {
        ...item,
        id: 'study_plans',
        match: [/^\/tracks(?:\/.*)?$/, /^\/guides\/framework-prep(?:\/.*)?$/],
      };
    default:
      return {
        ...item,
        id: 'final_rounds',
        match: [
          /^\/system-design(?:\/.*)?$/,
          /^\/guides\/system-design(?:\/.*)?$/,
          /^\/guides\/system-design-blueprint(?:\/.*)?$/,
          /^\/guides\/behavioral(?:\/.*)?$/,
          /^\/companies(?:\/.*)?$/,
        ],
      };
  }
});

export function findPrepRoadmapSwitcherItem(url: string): PrepRoadmapSwitcherItem | null {
  const path = normalizePrepRoadmapPath(url);
  return INTERVIEW_PREP_SWITCHER_ITEMS.find((item) => item.match.some((rx) => rx.test(path))) ?? null;
}

export function normalizePrepRoadmapPath(url: string): string {
  const raw = String(url || '/').split('?')[0].split('#')[0].trim() || '/';
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  const normalized = path.length > 1 ? path.replace(/\/+$/, '') : path;
  return normalized.toLowerCase();
}
