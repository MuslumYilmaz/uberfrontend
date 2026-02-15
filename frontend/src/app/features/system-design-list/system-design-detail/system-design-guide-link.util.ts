export type SystemDesignGuideSlug =
  | 'intro'
  | 'foundations'
  | 'framework'
  | 'architecture'
  | 'state-data'
  | 'performance'
  | 'ux'
  | 'evaluation'
  | 'pitfalls'
  | 'checklist';

type GuideAwareQuestion = {
  id?: string | null;
  title?: string | null;
  description?: string | null;
  tags?: string[] | null;
  guideSlug?: string | null;
  guide?: string | null;
  guidePath?: string | null;
};

const DEFAULT_GUIDE_SLUG: SystemDesignGuideSlug = 'framework';

const ALL_GUIDE_SLUGS: ReadonlySet<SystemDesignGuideSlug> = new Set<SystemDesignGuideSlug>([
  'intro',
  'foundations',
  'framework',
  'architecture',
  'state-data',
  'performance',
  'ux',
  'evaluation',
  'pitfalls',
  'checklist',
]);

const GUIDE_ALIASES: Record<string, SystemDesignGuideSlug> = {
  state: 'state-data',
  data: 'state-data',
  tradeoffs: 'foundations',
  'trade-offs': 'foundations',
  tradeoff: 'foundations',
  'system-design': DEFAULT_GUIDE_SLUG,
  'system-design-blueprint': DEFAULT_GUIDE_SLUG,
};

const SLUG_KEYWORDS: Record<SystemDesignGuideSlug, readonly string[]> = {
  intro: ['intro', 'overview', 'what it tests'],
  foundations: ['requirements', 'constraints', 'trade-off', 'tradeoffs', 'scope', 'assumption'],
  framework: ['radio', 'framework', '5-step', 'approach', 'structure'],
  architecture: [
    'architecture',
    'frontend-architecture',
    'rendering',
    'ssr',
    'csr',
    'islands',
    'microfrontend',
    'design-system',
    'components',
  ],
  'state-data': [
    'state',
    'state-management',
    'data-flow',
    'cache',
    'caching',
    'storage',
    'sync',
    'pagination',
    'preferences',
  ],
  performance: [
    'performance',
    'web-vitals',
    'latency',
    'optimization',
    'virtualization',
    'streaming',
    'real-time',
    'charts',
  ],
  ux: ['ux', 'accessibility', 'a11y', 'i18n', 'offline', 'responsive', 'usability'],
  evaluation: ['evaluation', 'rubric', 'signal', 'interviewer'],
  pitfalls: ['pitfall', 'anti-pattern', 'mistake', 'failure'],
  checklist: ['checklist', 'one-page', 'cheat'],
};

const TIE_BREAK_ORDER: readonly SystemDesignGuideSlug[] = [
  'framework',
  'architecture',
  'state-data',
  'performance',
  'ux',
  'foundations',
  'intro',
  'evaluation',
  'pitfalls',
  'checklist',
];

function normalize(value: string | null | undefined): string {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function normalizeToken(value: string | null | undefined): string {
  return normalize(value)
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/_/g, '-')
    .replace(/\s+/g, '-');
}

function isGuideSlug(value: string): value is SystemDesignGuideSlug {
  return ALL_GUIDE_SLUGS.has(value as SystemDesignGuideSlug);
}

function extractExplicitGuideSlug(question?: GuideAwareQuestion | null): SystemDesignGuideSlug | null {
  if (!question) return null;

  const candidates = [question.guideSlug, question.guide, question.guidePath];
  for (const raw of candidates) {
    const token = normalizeToken(raw);
    if (!token) continue;

    if (isGuideSlug(token)) return token;
    if (GUIDE_ALIASES[token]) return GUIDE_ALIASES[token];

    const pathParts = token.split('/').filter(Boolean);
    for (let i = pathParts.length - 1; i >= 0; i -= 1) {
      const part = pathParts[i];
      if (isGuideSlug(part)) return part;
      if (GUIDE_ALIASES[part]) return GUIDE_ALIASES[part];
    }
  }

  return null;
}

function scoreFromKeywords(question?: GuideAwareQuestion | null): SystemDesignGuideSlug {
  if (!question) return DEFAULT_GUIDE_SLUG;

  const tags = (question.tags || [])
    .map((tag) => normalizeToken(tag))
    .filter((tag) => Boolean(tag));
  const tagSet = new Set(tags);

  const haystack = normalize(
    `${question.id || ''} ${question.title || ''} ${question.description || ''} ${tags.join(' ')}`
  );

  let bestSlug: SystemDesignGuideSlug = DEFAULT_GUIDE_SLUG;
  let bestScore = -1;

  for (const slug of TIE_BREAK_ORDER) {
    let score = 0;
    for (const keyword of SLUG_KEYWORDS[slug]) {
      const normalizedKeyword = normalizeToken(keyword);
      if (!normalizedKeyword) continue;

      if (tagSet.has(normalizedKeyword)) score += 6;
      else if (tags.some((tag) => tag.includes(normalizedKeyword) || normalizedKeyword.includes(tag))) score += 3;

      if (haystack.includes(normalizedKeyword)) score += 1;
    }

    if (score > bestScore) {
      bestScore = score;
      bestSlug = slug;
    }
  }

  return bestScore > 0 ? bestSlug : DEFAULT_GUIDE_SLUG;
}

export function pickSystemDesignGuideSlug(
  question?: GuideAwareQuestion | null
): SystemDesignGuideSlug {
  return extractExplicitGuideSlug(question) || scoreFromKeywords(question);
}

export function buildSystemDesignGuideRoute(
  question?: GuideAwareQuestion | null
): string[] {
  const slug = pickSystemDesignGuideSlug(question);
  return ['/', 'guides', 'system-design-blueprint', slug];
}
