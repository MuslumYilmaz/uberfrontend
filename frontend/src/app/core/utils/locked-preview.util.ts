import { PremiumPreviewContent, Question } from '../models/question.model';
import type { IncidentListItem } from '../models/incident.model';
import type { TradeoffBattleListItem } from '../models/tradeoff-battle.model';

export type LockedPreviewType = 'coding' | 'trivia' | 'system-design';

export type LockedPreviewSnippet = {
  title: string;
  language?: string;
  lines: string[];
};

export type LockedPreviewLink = {
  title: string;
  to: any[];
  premium?: boolean;
};

export type LockedPreviewData = {
  what: string;
  unlockDescription: string;
  keyDecisions?: string[];
  rubric?: string[];
  unlockBullets?: string[];
  learningGoals: string[];
  constraints: string[];
  snippet: LockedPreviewSnippet;
  pitfalls: string[];
  related: LockedPreviewLink[];
};

type RelatedCandidate = {
  id: string;
  title: string;
  access?: 'free' | 'premium';
  technology?: string;
  type?: string;
  tags?: string[];
  importance?: number;
};

type BuildContext = {
  type: LockedPreviewType;
  title: string;
  description: string;
  rawDescription?: string;
  tags: string[];
  difficulty?: string;
  technology?: string;
  premiumPreview?: PremiumPreviewContent;
};

type CodingContext = BuildContext & {
  starterCode?: string | null;
  starterCodeTs?: string | null;
  descSpecs?: {
    requirements?: string[];
    expectedBehavior?: string[];
  } | null;
  descriptionArgs?: string[];
};

export type CodingLockedPreviewQuestion = Pick<
  Question,
  'id' | 'title' | 'description' | 'tags' | 'difficulty' | 'premiumPreview' | 'starterCode' | 'code'
> & {
  starterCodeTs?: string;
} & Partial<Pick<Question, 'type' | 'technology' | 'access' | 'importance'>>;

type TriviaContext = BuildContext & {
  technology?: string;
};

type SystemDesignContext = BuildContext & {
  sectionTitles?: string[];
};

const DEFAULT_TECH = 'frontend';

export const CODING_PREMIUM_UNLOCK_DESCRIPTION =
  'Premium unlocks the runnable workspace, behavioral checks, implementation walkthrough, and edge-case discussion.';

export const SYSTEM_DESIGN_PREMIUM_UNLOCK_DESCRIPTION =
  'Premium unlocks the full architecture walkthrough, evaluation rubric, trade-offs, and failure-mode analysis.';

const TRIVIA_PREMIUM_UNLOCK_DESCRIPTION =
  'Premium unlocks the complete explanation, worked examples, follow-up questions, and common-mistake discussion.';

const TECHNOLOGY_CAPITALIZATION: ReadonlyArray<readonly [RegExp, string]> = [
  [/\breact\b/gi, 'React'],
  [/\bangular\b/gi, 'Angular'],
  [/\bvue\b/gi, 'Vue'],
  [/\bjavascript\b/gi, 'JavaScript'],
  [/\btypescript\b/gi, 'TypeScript'],
  [/\bhtml\b/gi, 'HTML'],
  [/\bcss\b/gi, 'CSS'],
];

const EDITORIAL_HTML_TAG_PATTERN = /<\/?(?:a|b|blockquote|br|code|del|div|em|h[1-6]|hr|i|ins|kbd|li|mark|ol|p|pre|s|small|span|strong|sub|sup|table|tbody|td|th|thead|tr|u|ul)\b[^>]*\/?>/gi;

const decodeEditorialEntitiesOnce = (text: string): string =>
  text.replace(/&(#(?:x[\da-f]+|\d+)|[a-z]+);/gi, (match, entity: string) => {
    const normalized = entity.toLowerCase();
    const named: Record<string, string> = {
      amp: '&',
      apos: "'",
      gt: '>',
      lt: '<',
      nbsp: ' ',
      quot: '"',
    };
    if (named[normalized] !== undefined) return named[normalized];
    if (!normalized.startsWith('#')) return match;

    const isHex = normalized.startsWith('#x');
    const value = Number.parseInt(normalized.slice(isHex ? 2 : 1), isHex ? 16 : 10);
    if (!Number.isInteger(value) || value < 0 || value > 0x10ffff) return match;
    return String.fromCodePoint(value);
  });

export const normalizeEditorialPlainText = (text: string): string => {
  const withoutMarkup = String(text || '').replace(EDITORIAL_HTML_TAG_PATTERN, ' ');
  const decoded = decodeEditorialEntitiesOnce(decodeEditorialEntitiesOnce(withoutMarkup));
  return decoded
    .replace(/`+/g, '')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const normalizeText = normalizeEditorialPlainText;

const capitalizeTechnologies = (text: string): string => {
  return TECHNOLOGY_CAPITALIZATION.reduce(
    (value, [pattern, replacement]) => value.replace(pattern, replacement),
    text,
  );
};

const sentenceBoundaryParts = (text: string): string[] => {
  const normalized = capitalizeTechnologies(normalizeText(text));
  if (!normalized) return [];
  return (normalized.match(/[^.!?]+[.!?]+(?=\s|$)/g) || [])
    .map((sentence) => sentence.trim())
    .filter(Boolean);
};

const COMPLETE_SENTENCE_VERB_PATTERN = /\b(?:is|are|be|being|been|has|have|do|does|must|should|can|will|accept|account|allow|apply|avoid|build|call|cancel|choose|clear|collect|compare|compose|connect|consider|copy|create|decide|define|derive|design|disable|discuss|display|emit|enable|ensure|execute|explain|expose|fetch|find|flatten|focus|handle|highlight|highlights|ignore|implement|include|invoke|keep|limit|load|maintain|make|match|matches|merge|mirror|mirrors|model|persist|plan|point|points|practice|preserve|provide|read|receive|recognize|reject|remove|render|resolve|return|returns|restore|run|set|show|simulate|sort|store|submit|support|supports|surface|take|test|tests|track|understand|update|use|validate|visit|write)\b/i;

const hasCompleteSentenceShape = (text: string): boolean => {
  const words = text.match(/[A-Za-z][A-Za-z'-]*/g) || [];
  if (words.length < 3 || !COMPLETE_SENTENCE_VERB_PATTERN.test(text)) return false;
  if (/^[a-z]|^[,.;:)]/.test(text)) return false;
  return !/^(?:concepts?|complexity|constraints?|functional requirements?|non-functional|key considerations?)\s*:/i.test(text);
};

const hasUnsafePreviewSyntax = (raw: string): boolean => {
  const value = decodeEditorialEntitiesOnce(decodeEditorialEntitiesOnce(String(raw || '')));
  return /(?:…|\.{2,}|`|\*\*|__|<\/?[a-z][^>]*>|\[[^\]]+\]\([^)]*\)|(?:^|\s)(?:src|public|app|assets)\/|\b[\w-]+\.(?:html?|tsx?|jsx?|css|scss|json)\b|\{[^}]*\}|=>)/i.test(value);
};

const cleanCompleteSentence = (raw: string, requireCompleteShape = true): string => {
  if (!raw || hasUnsafePreviewSyntax(raw)) return '';
  const clean = capitalizeTechnologies(normalizeText(raw))
    .replace(/\.{2,}/g, '.')
    .replace(/…+/g, '')
    .trim();
  if (!clean || /\bExpect\b.+\bdecisions\b.+\bconstraints\b/i.test(clean)) return '';
  if (/^(?:and|or|but|because|while|which|that|where|when|with|without|using|including)\b/i.test(clean)) return '';
  if (!/[.!?]$/.test(clean)) return '';
  return !requireCompleteShape || hasCompleteSentenceShape(clean) ? clean : '';
};

const completePublicSentences = (raw: string): string[] => {
  return String(raw || '')
    .split(/\r?\n+/)
    .flatMap((line) => line.match(/[^.!?]+[.!?]+(?=\s|$)/g) || [])
    .map((sentence) => cleanCompleteSentence(sentence.replace(/^\s*[-*]\s+/, '')))
    .filter(Boolean);
};

const authoredPreviewContent = (
  preview: PremiumPreviewContent | null | undefined,
): PremiumPreviewContent | null => {
  if (!preview) return null;
  if (hasUnsafePreviewSyntax(preview.summary)) return null;
  const summary = sentenceBoundaryParts(preview.summary).slice(0, 2).join(' ')
    || cleanCompleteSentence(preview.summary);
  const learningOutcomes = uniq(
    (preview.learningOutcomes || []).map((item) => cleanCompleteSentence(item, false)).filter(Boolean),
  )
    .slice(0, 5);
  const unlockDescription = cleanCompleteSentence(preview.unlockDescription, false);
  if (!summary || learningOutcomes.length < 3 || learningOutcomes.length > 5 || !unlockDescription) {
    return null;
  }
  return { summary, learningOutcomes, unlockDescription };
};

const uniq = (items: string[]): string[] => {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const val = normalizeText(item);
    if (!val || seen.has(val.toLowerCase())) continue;
    seen.add(val.toLowerCase());
    out.push(val);
  }
  return out;
};

const pickTags = (tags: string[], limit = 3): string[] => {
  return uniq(tags)
    .map((t) => t.toLowerCase())
    .slice(0, limit);
};

const buildWhatText = (ctx: BuildContext): string => {
  const authored = authoredPreviewContent(ctx.premiumPreview);
  if (authored) return authored.summary;

  const title = normalizeText(ctx.title).toLowerCase();
  const sentences = completePublicSentences(ctx.rawDescription || ctx.description)
    .filter((sentence) => !sentence.toLowerCase().startsWith(`${title}:`))
    .filter(Boolean);
  return sentences.slice(0, 2).join(' ');
};

const repeatsTitlePrefix = (title: string, summary: string): boolean => {
  const normalizedTitle = normalizeText(title).toLowerCase();
  const normalizedSummary = normalizeText(summary).toLowerCase();
  return normalizedSummary.startsWith(`${normalizedTitle}:`)
    || normalizedSummary.startsWith(`${normalizedTitle}.`);
};

const buildUnlockBullets = (ctx: BuildContext): string[] => {
  if (ctx.type === 'coding') {
    return [
      'Full editor workflow with starter files, tests, and solution context.',
      'Edge cases, common mistakes, and complexity notes for the interview discussion.',
      'Progress tracking once you unlock and complete the challenge.',
    ];
  }

  if (ctx.type === 'trivia') {
    return [
      'Complete answer structure with examples and common follow-ups.',
      'Mistake checks that keep the explanation precise.',
      'Related drills for the same concept area.',
    ];
  }

  return [
    'Full walkthrough across requirements, architecture, state, performance, and tradeoffs.',
    'Evaluation cues for senior-level discussion.',
    'Follow-up prompts and failure-mode coverage.',
  ];
};

const buildLearningGoals = (ctx: BuildContext, publicCandidates: string[]): string[] => {
  const authored = authoredPreviewContent(ctx.premiumPreview);
  if (authored) return authored.learningOutcomes;

  const summarySentences = new Set(
    completePublicSentences(ctx.rawDescription || ctx.description)
      .slice(0, 2)
      .map((sentence) => sentence.toLowerCase()),
  );
  return uniq([
    ...publicCandidates.map((item) => cleanCompleteSentence(item)).filter(Boolean),
    ...completePublicSentences(ctx.rawDescription || ctx.description),
  ])
    .filter((sentence) => !summarySentences.has(sentence.toLowerCase()))
    .slice(0, 5);
};

const hasKeyword = (ctx: BuildContext, keywords: string[]): boolean => {
  const haystack = `${ctx.title} ${ctx.description} ${(ctx.tags || []).join(' ')}`.toLowerCase();
  return keywords.some((k) => haystack.includes(k));
};

const inferConstraints = (ctx: BuildContext): string[] => {
  const out: string[] = [];
  if (ctx.type === 'coding') {
    if (hasKeyword(ctx, ['array', 'list'])) out.push('Preserve input order and handle empty arrays safely.');
    if (hasKeyword(ctx, ['string'])) out.push('Handle empty strings and mixed casing without errors.');
    if (hasKeyword(ctx, ['object', 'map', 'dictionary'])) out.push('Avoid prototype pitfalls when reading object keys.');
    if (hasKeyword(ctx, ['promise', 'async', 'await'])) out.push('Handle async flow without blocking the event loop.');
    if (hasKeyword(ctx, ['memo', 'cache'])) out.push('Use a stable cache key and avoid collisions.');
    if (hasKeyword(ctx, ['debounce'])) out.push('Cancel stale work and only execute the latest call.');
    if (hasKeyword(ctx, ['throttle'])) out.push('Limit executions to a fixed interval and define trailing behavior.');
    if (hasKeyword(ctx, ['tree', 'graph'])) out.push('Avoid deep recursion issues on large inputs.');
    if (hasKeyword(ctx, ['sort'])) out.push('Do not mutate inputs; return a new sorted output.');
  } else if (ctx.type === 'trivia') {
    out.push('Use exact terminology and avoid vague paraphrasing.');
    out.push('Include one concrete UI or code example in the explanation.');
    if (hasKeyword(ctx, ['accessibility', 'aria', 'a11y'])) out.push('Mention keyboard behavior and ARIA where relevant.');
    if (hasKeyword(ctx, ['css'])) out.push('Reference cascade/specificity or box model implications.');
    if (hasKeyword(ctx, ['html'])) out.push('Anchor the explanation in semantic HTML behavior.');
  } else {
    out.push('Assume real users and real latency; budget for perceived performance.');
    out.push('Define client-side caching and invalidation strategy.');
    out.push('Plan pagination or windowing for large UI lists.');
    if (hasKeyword(ctx, ['realtime', 'real-time', 'websocket', 'sse'])) out.push('Batch UI updates and handle reconnection/backoff.');
    if (hasKeyword(ctx, ['upload'])) out.push('Validate file size/type and show progress with retry.');
    if (hasKeyword(ctx, ['notifications'])) out.push('Define dedupe rules and unread state updates.');
  }
  return uniq(out);
};

const buildConstraints = (ctx: BuildContext, raw: string[]): string[] => {
  const base = uniq(raw.flatMap(completePublicSentences));
  const tags = pickTags(ctx.tags, 3);
  const extra: string[] = [];

  if (ctx.type === 'coding') {
    if (tags.includes('arrays')) extra.push('Do not mutate input arrays; preserve item order.');
    if (tags.includes('objects')) extra.push('Avoid mutating nested objects; return new references.');
    if (tags.includes('dom')) extra.push('Do not access the real DOM; use the provided node shape.');
    if (tags.includes('async') || tags.includes('promises')) extra.push('Return a Promise and resolve asynchronously without blocking.');
    extra.push('Handle empty or missing inputs without throwing errors.');
    extra.push('Keep runtime close to linear time where possible.');
    extra.push('Prefer a pure function: no side effects beyond the return value.');
  } else if (ctx.type === 'trivia') {
    if (tags.length) extra.push(`Differentiate ${tags.join(' vs ')} when relevant.`);
    extra.push('Keep the answer scoped to front-end usage and browser behavior.');
  } else {
    if (tags.length) extra.push(`Account for ${tags.join(', ')} constraints in the UI.`);
  }

  const combined = uniq([...base, ...inferConstraints(ctx), ...extra]);
  if (combined.length < 4) {
    combined.push(...uniq([
      'Be explicit about edge cases and error states.',
      'Prioritize clarity over cleverness in explanations.',
      'Explain the trade-offs behind your choices.',
    ]));
  }

  return uniq(combined).slice(0, 10);
};

const buildPitfalls = (ctx: BuildContext): string[] => {
  const tags = pickTags(ctx.tags, 3);
  const pitfalls: string[] = [];

  if (ctx.type === 'coding') {
    pitfalls.push('Mutating inputs instead of returning a new value.');
    pitfalls.push('Skipping edge cases like empty input, duplicates, or nulls.');
    if (tags.includes('async') || tags.includes('promises')) pitfalls.push('Forgetting to await or return the Promise.');
    pitfalls.push('Overlooking time complexity for large inputs.');
  } else if (ctx.type === 'trivia') {
    pitfalls.push('Confusing closely related concepts or terms.');
    pitfalls.push('Answering generically without a concrete example.');
    if (tags.length) pitfalls.push(`Misapplying ${tags[0]} rules outside their scope.`);
  } else {
    pitfalls.push('Ignoring pagination/virtualization for long feeds.');
    pitfalls.push('Underestimating client performance budgets.');
    pitfalls.push('Overfetching data or failing to cache responses.');
    pitfalls.push('Skipping failure states and retry UX.');
  }

  return uniq(pitfalls).slice(0, 5);
};

const buildKeyDecisions = (ctx: BuildContext): string[] => {
  const decisions: string[] = [];
  if (ctx.type === 'coding') {
    decisions.push('Define the exact input/output contract before coding.');
    if (hasKeyword(ctx, ['array', 'list'])) decisions.push('Choose iteration vs higher-order methods for readability.');
    if (hasKeyword(ctx, ['async', 'promise'])) decisions.push('Decide on concurrency and error propagation behavior.');
    decisions.push('Prioritize predictable edge-case handling over micro-optimizations.');
  } else if (ctx.type === 'trivia') {
    decisions.push('Give a precise definition first, then a concrete example.');
    if (hasKeyword(ctx, ['css'])) decisions.push('Tie the answer back to cascade/specificity or layout behavior.');
    if (hasKeyword(ctx, ['accessibility', 'aria', 'a11y'])) decisions.push('Call out keyboard and screen reader implications.');
  } else {
    decisions.push('Choose a data model that matches UI reads and writes.');
    decisions.push('Pick a pagination + caching strategy to keep the UI fast.');
    if (hasKeyword(ctx, ['realtime', 'websocket', 'sse'])) decisions.push('Select a realtime transport and reconnection policy.');
    decisions.push('Set performance budgets (LCP/INP) and validate with telemetry.');
  }
  return uniq(decisions).slice(0, 5);
};

const buildRubric = (ctx: BuildContext): string[] => {
  const rubric: string[] = [];
  if (ctx.type === 'coding') {
    rubric.push('Correctness: covers required behaviors and edge cases.');
    rubric.push('Clarity: readable structure and predictable control flow.');
    rubric.push('Complexity: avoids unnecessary work for large inputs.');
    rubric.push('API discipline: no mutation of inputs; returns expected shape.');
    rubric.push('Testability: solution is easy to unit test.');
  } else if (ctx.type === 'trivia') {
    rubric.push('Accuracy: uses correct terminology and facts.');
    rubric.push('Specificity: includes at least one concrete example.');
    rubric.push('Scope: stays within front-end/browser behavior.');
    rubric.push('Pitfall awareness: mentions a common mistake.');
  } else {
    rubric.push('Architecture: clear client data flow and component boundaries.');
    rubric.push('Performance: budgets + caching/virtualization where needed.');
    rubric.push('Resilience: offline/error states and retries defined.');
    rubric.push('Observability: metrics/logs to validate UX and perf.');
  }
  return uniq(rubric).slice(0, 5);
};

const extractFunctionName = (starterCode?: string | null, summary?: string): string => {
  const src = starterCode || '';
  const patterns = [
    /export\s+default\s+function\s+([A-Za-z0-9_]+)/,
    /function\s+([A-Za-z0-9_]+)\s*\(/,
    /const\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?\(/,
  ];
  for (const re of patterns) {
    const m = src.match(re);
    if (m?.[1]) return m[1];
  }
  if (summary) {
    const m = summary.match(/`([A-Za-z0-9_]+)\s*\(/);
    if (m?.[1]) return m[1];
  }
  return 'solve';
};

const buildCodingSnippet = (ctx: CodingContext): LockedPreviewSnippet => {
  const name = extractFunctionName(ctx.starterCode || ctx.starterCodeTs, ctx.description);
  const args = (ctx.descriptionArgs || []).slice(0, 2);
  const arg1 = args[0] || 'input';
  const arg2 = args[1] || 'options';
  const asyncHint = /async\s+function|return\s+new\s+Promise|await\s+/.test(ctx.starterCode || ctx.starterCodeTs || '');
  const callArgs = args.length >= 2 ? `${arg1}, ${arg2}` : arg1;
  const maybeAwait = asyncHint ? 'await ' : '';
  const lines = [
    '// Example usage',
    `const ${arg1} = /* ${ctx.title.toLowerCase()} input */;`,
    ...(args.length >= 2 ? [`const ${arg2} = /* config */;`] : []),
    `const result = ${maybeAwait}${name}(${callArgs});`,
    'console.log(result);',
    '',
    '// Edge case check',
    `const empty = ${args.length >= 2 ? `${arg1} && ${arg2}` : arg1} ?? null;`,
    `const fallback = ${maybeAwait}${name}(${callArgs});`,
    'console.log(fallback);',
    '',
    '// Expected: describe output shape, not the implementation',
    '// (no solution code in preview)',
  ];

  return {
    title: 'Mini snippet (usage only)',
    language: 'typescript',
    lines: lines.slice(0, 16),
  };
};

const buildTriviaSnippet = (ctx: TriviaContext): LockedPreviewSnippet => {
  const tech = (ctx.technology || DEFAULT_TECH).toLowerCase();
  let lines: string[] = [];

  if (tech.includes('css')) {
    lines = [
      '/* Scenario: which rule wins and why? */',
      '.card { color: #111; }',
      '.card.highlight { color: #e11d48; }',
      '',
      '<div class="card highlight">Text</div>',
      '// Which color applies?',
      '// Explain using cascade/specificity.',
      '',
      '/* Bonus: what changes if inline styles exist? */',
    ];
  } else if (tech.includes('html')) {
    lines = [
      '<table>',
      '  <caption>Monthly revenue</caption>',
      '  <thead>...</thead>',
      '  <tbody>...</tbody>',
      '</table>',
      '',
      '<!-- Which element improves accessibility and why? -->',
      '<!-- Answer should reference semantics -->',
    ];
  } else if (tech.includes('react') || tech.includes('vue') || tech.includes('angular')) {
    lines = [
      '// Component snippet',
      '<Card :title="title" v-if="isReady" />',
      '',
      '// Which part controls rendering?',
      '// What happens if isReady flips?',
      '',
      '// Explain the lifecycle or render behavior.',
      '',
    ];
  } else {
    lines = [
      '// Scenario: interpret this output',
      'const values = [0, 1, 2];',
      'const next = values.filter(Boolean);',
      '',
      '// What does next contain and why?',
      '// Explain the JS concept involved.',
      '',
      'console.log(next);',
    ];
  }

  return {
    title: 'Mini snippet (scenario)',
    language: 'text',
    lines: lines.slice(0, 14),
  };
};

const buildSystemDesignSnippet = (ctx: SystemDesignContext): LockedPreviewSnippet => {
  const tags = pickTags(ctx.tags, 2);
  const tagLine = tags.length ? `Focus: ${tags.join(', ')}` : 'Focus: latency, caching, UX';
  const lines = [
    'Constraints:',
    '- P95 UI response < 200ms',
    '- 1k+ events/sec during peak',
    `- ${tagLine}`,
    '',
    'Components:',
    '- Client cache + pagination',
    '- Realtime updates (SSE/WebSocket)',
    '- Observability + error states',
    '',
    'Endpoints:',
    '- GET /feed?cursor=',
    '- POST /events',
  ];

  return {
    title: 'Mini snippet (architecture sketch)',
    language: 'text',
    lines: lines.slice(0, 14),
  };
};

const buildRelatedLinks = (
  candidates: RelatedCandidate[],
  baseTags: string[],
  type: LockedPreviewType,
  technology: string | undefined,
  excludeId: string,
  maxItems = 6,
): LockedPreviewLink[] => {
  const tags = new Set(baseTags.map((t) => t.toLowerCase()));

  const scored = candidates
    .filter((c) => c.id && c.title && c.id !== excludeId)
    .map((c) => {
      const cTags = (c.tags || []).map((t) => t.toLowerCase());
      let score = 0;
      for (const t of cTags) if (tags.has(t)) score += 1;
      if (technology && c.technology === technology) score += 1;
      return { candidate: c, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) =>
      b.score - a.score
      || (b.candidate.importance || 0) - (a.candidate.importance || 0)
      || a.candidate.title.localeCompare(b.candidate.title)
    )
    .map((item) => item.candidate);

  const fallback = scored.length
    ? scored
    : candidates.filter((c) => c.id && c.title && c.id !== excludeId);

  const free = fallback.filter((c) => c.access !== 'premium');
  const premium = fallback.filter((c) => c.access === 'premium');
  const picked = free.length >= 3
    ? free.slice(0, maxItems)
    : [...free, ...premium].slice(0, maxItems);

  return picked.map((c) => {
    const to = type === 'system-design'
      ? ['/', 'system-design', c.id]
      : ['/', c.technology || technology || DEFAULT_TECH, c.type || type, c.id];
    return { title: c.title, to, premium: c.access === 'premium' };
  });
};

export const buildLockedPreviewForCoding = (
  q: CodingLockedPreviewQuestion,
  opts: {
    candidates: RelatedCandidate[];
    tech: string;
    kind: 'coding';
  }
): LockedPreviewData | null => {
  const desc = q.description as any;
  const descSpecs = desc?.specs || null;
  const args = Array.isArray(desc?.arguments)
    ? desc.arguments.map((a: any) => String(a?.name || '').trim()).filter(Boolean)
    : [];
  const ctx: CodingContext = {
    type: 'coding',
    title: q.title,
    description: normalizeText(typeof q.description === 'string' ? q.description : desc?.summary || ''),
    rawDescription: typeof q.description === 'string' ? q.description : desc?.summary || '',
    tags: q.tags || [],
    difficulty: q.difficulty,
    technology: opts.tech,
    premiumPreview: q.premiumPreview,
    starterCode: q.starterCode || q.code || '',
    starterCodeTs: q.starterCodeTs || '',
    descSpecs: descSpecs ? {
      requirements: descSpecs.requirements,
      expectedBehavior: descSpecs.expectedBehavior,
    } : null,
    descriptionArgs: args,
  };

  const rawConstraints = [
    ...(ctx.descSpecs?.requirements || []),
    ...(ctx.descSpecs?.expectedBehavior || []),
  ];
  const preview = authoredPreviewContent(ctx.premiumPreview);
  if (ctx.premiumPreview && !preview) return null;

  const publicOutcomeCandidates = [
    ...(descSpecs?.requirements || []),
    ...(descSpecs?.expectedBehavior || []),
    ...(Array.isArray(desc?.arguments) ? desc.arguments.map((argument: any) => argument?.desc) : []),
    desc?.returns?.desc,
  ].filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  const what = buildWhatText(ctx);
  const learningGoals = buildLearningGoals(ctx, publicOutcomeCandidates);
  if (!what || repeatsTitlePrefix(q.title, what) || learningGoals.length < 3) return null;

  return {
    what,
    unlockDescription: preview?.unlockDescription || CODING_PREMIUM_UNLOCK_DESCRIPTION,
    keyDecisions: buildKeyDecisions(ctx),
    rubric: buildRubric(ctx),
    unlockBullets: buildUnlockBullets(ctx),
    learningGoals,
    constraints: buildConstraints(ctx, rawConstraints),
    snippet: buildCodingSnippet(ctx),
    pitfalls: buildPitfalls(ctx),
    related: buildRelatedLinks(opts.candidates, ctx.tags, 'coding', opts.tech, q.id, 6),
  };
};

export const buildLockedPreviewForTrivia = (
  q: Question,
  opts: {
    candidates: RelatedCandidate[];
    tech: string;
    kind: 'trivia';
  }
): LockedPreviewData | null => {
  const ctx: TriviaContext = {
    type: 'trivia',
    title: q.title,
    description: normalizeText(typeof q.description === 'string' ? q.description : (q.description as any)?.summary || ''),
    rawDescription: typeof q.description === 'string' ? q.description : (q.description as any)?.summary || '',
    tags: q.tags || [],
    difficulty: q.difficulty,
    technology: opts.tech,
    premiumPreview: q.premiumPreview,
  };

  const what = buildWhatText(ctx);
  const learningGoals = buildLearningGoals(ctx, sentenceBoundaryParts(ctx.description).slice(2));
  const preview = authoredPreviewContent(ctx.premiumPreview);
  if (ctx.premiumPreview && !preview) return null;
  if (!what || repeatsTitlePrefix(q.title, what) || learningGoals.length < 3) return null;

  return {
    what,
    unlockDescription: preview?.unlockDescription || TRIVIA_PREMIUM_UNLOCK_DESCRIPTION,
    keyDecisions: buildKeyDecisions(ctx),
    rubric: buildRubric(ctx),
    unlockBullets: buildUnlockBullets(ctx),
    learningGoals,
    constraints: buildConstraints(ctx, []),
    snippet: buildTriviaSnippet(ctx),
    pitfalls: buildPitfalls(ctx),
    related: buildRelatedLinks(opts.candidates, ctx.tags, 'trivia', opts.tech, q.id, 6),
  };
};

export const buildLockedPreviewForSystemDesign = (
  q: {
    id: string;
    title: string;
    description: string;
    tags: string[];
    sectionTitles?: string[];
    premiumPreview?: PremiumPreviewContent;
  },
  opts: {
    candidates: RelatedCandidate[];
  }
): LockedPreviewData | null => {
  const ctx: SystemDesignContext = {
    type: 'system-design',
    title: q.title,
    description: normalizeText(q.description || ''),
    rawDescription: q.description || '',
    tags: q.tags || [],
    difficulty: 'intermediate',
    technology: 'front-end system design',
    premiumPreview: q.premiumPreview,
  };

  const sectionConstraints = uniq(
    [q.description || '', ...(q.sectionTitles || [])].flatMap(completePublicSentences),
  );
  const what = buildWhatText(ctx);
  const learningGoals = buildLearningGoals(ctx, q.sectionTitles || []);
  const preview = authoredPreviewContent(ctx.premiumPreview);
  if (ctx.premiumPreview && !preview) return null;
  if (!what || repeatsTitlePrefix(q.title, what) || learningGoals.length < 3) return null;

  return {
    what,
    unlockDescription: preview?.unlockDescription || SYSTEM_DESIGN_PREMIUM_UNLOCK_DESCRIPTION,
    keyDecisions: buildKeyDecisions(ctx),
    rubric: buildRubric(ctx),
    unlockBullets: buildUnlockBullets(ctx),
    learningGoals,
    constraints: buildConstraints(ctx, sectionConstraints),
    snippet: buildSystemDesignSnippet(ctx),
    pitfalls: buildPitfalls(ctx),
    related: buildRelatedLinks(opts.candidates, ctx.tags, 'system-design', undefined, q.id, 6),
  };
};

export const buildLockedPreviewForIncident = (
  item: IncidentListItem,
  candidates: IncidentListItem[],
): LockedPreviewData => {
  const summary = cleanCompleteSentence(item.summary)
    || 'Investigate a frontend failure by following the available evidence from symptom to root cause.';
  const related = candidates
    .filter((candidate) => candidate.id !== item.id && candidate.tech === item.tech)
    .slice(0, 4)
    .map((candidate) => ({
      title: candidate.title,
      to: ['/incidents', candidate.id],
      premium: candidate.access === 'premium',
    }));
  const signalSentences = (item.signals || [])
    .map((signal) => capitalizeTechnologies(normalizeText(signal)).replace(/[.!?]+$/, ''))
    .filter(Boolean)
    .slice(0, 4)
    .map((signal) => `Investigate this reported signal: ${signal}.`);

  return {
    what: summary,
    unlockDescription: 'Premium unlocks the staged investigation, evidence-based scoring, root-cause walkthrough, and regression-guard discussion.',
    keyDecisions: [
      'Separate the visible symptom from the underlying cause before changing code.',
      'Choose the smallest investigation step that removes the most ambiguity.',
      'Prefer a durable fix over a patch that only hides the symptom.',
      'Define the regression guard that should accompany the fix.',
    ],
    rubric: [
      'Strong answers prioritize evidence instead of guessing.',
      'A useful investigation order reduces the search space quickly.',
      'The proposed fix should match the demonstrated failure mode.',
      'A complete answer closes with a focused regression guard.',
    ],
    unlockBullets: [
      'Full staged debug workflow with evidence, hypotheses, and scoring.',
      'Root-cause explanation, durable fix, and regression guard.',
      'Evaluation guidance for prioritizing investigation steps.',
    ],
    learningGoals: [
      'Separate visible symptoms from the underlying cause.',
      'Prioritize the highest-signal investigation before changing code.',
      'Choose a durable fix and define a focused regression guard.',
    ],
    constraints: signalSentences,
    snippet: {
      title: 'Public failure signals',
      lines: signalSentences.map((signal) => `- ${signal}`),
    },
    pitfalls: [
      'Jumping to a fix before proving the root cause.',
      'Treating every symptom as equally important.',
      'Stopping at the first plausible explanation.',
      'Skipping the regression guard after the fix.',
    ],
    related,
  };
};

export const buildLockedPreviewForTradeoff = (
  item: TradeoffBattleListItem,
  candidates: TradeoffBattleListItem[],
): LockedPreviewData => {
  const summary = cleanCompleteSentence(item.summary)
    || 'Compare frontend implementation options against a concrete product constraint and defend one direction.';
  const related = candidates
    .filter((candidate) => candidate.id !== item.id && candidate.tech === item.tech)
    .slice(0, 4)
    .map((candidate) => ({
      title: candidate.title,
      to: ['/tradeoffs', candidate.id],
      premium: candidate.access === 'premium',
    }));

  return {
    what: summary,
    unlockDescription: 'Premium unlocks the option matrix, scenario-specific evaluation, answer walkthrough, and follow-up trade-off discussion.',
    keyDecisions: [
      'Pick a direction for the stated prompt instead of claiming a universal winner.',
      'State the trade-off that matters most for this scenario.',
      'Name the conditions that would make another option stronger.',
      'Keep the recommendation grounded in concrete constraints.',
    ],
    rubric: [
      'Strong answers connect the recommendation to the prompt.',
      'Good trade-off reasoning explains downsides as well as benefits.',
      'The answer should show when the recommendation stops being right.',
      'Follow-up pressure should not break the central argument.',
    ],
    unlockBullets: [
      'Full option matrix with scenario-specific evaluation dimensions.',
      'Answer structure for defending trade-offs under follow-up pressure.',
      'Evaluation guidance for explaining when an alternative becomes stronger.',
    ],
    learningGoals: [
      'Compare the available options against the prompt constraints.',
      'Defend one direction while acknowledging its main downside.',
      'Explain when an alternative becomes the stronger choice.',
    ],
    constraints: [summary],
    snippet: {
      title: 'Decision frame',
      lines: [
        '- Identify the constraint that changes the decision.',
        '- Compare benefits and costs for this scenario.',
        '- State when the alternative becomes stronger.',
      ],
    },
    pitfalls: [
      'Arguing from preference instead of prompt constraints.',
      'Pretending one option is always the winner.',
      'Ignoring the main downside of the chosen direction.',
      'Failing to explain when an alternative becomes stronger.',
    ],
    related,
  };
};
