import { Question } from '../models/question.model';

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
  keyDecisions?: string[];
  rubric?: string[];
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
  tags: string[];
  difficulty?: string;
  technology?: string;
};

type CodingContext = BuildContext & {
  starterCode?: string | null;
  starterCodeTs?: string | null;
  descSpecs?: {
    requirements?: string[];
    expectedBehavior?: string[];
    implementationNotes?: string[];
  } | null;
  descriptionArgs?: string[];
};

type TriviaContext = BuildContext & {
  technology?: string;
};

type SystemDesignContext = BuildContext & {
  sectionTitles?: string[];
};

const DEFAULT_TECH = 'frontend';

const normalizeText = (text: string): string =>
  String(text || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/`+/g, '')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const trimWords = (text: string, maxWords: number): string => {
  const clean = normalizeText(text);
  if (!clean) return '';
  const words = clean.split(/\s+/);
  if (words.length <= maxWords) return clean;
  return `${words.slice(0, maxWords).join(' ')}…`;
};

const toSentence = (text: string): string => {
  const clean = normalizeText(text);
  if (!clean) return '';
  return /[.!?]$/.test(clean) ? clean : `${clean}.`;
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
  const tech = ctx.technology || DEFAULT_TECH;
  const tags = pickTags(ctx.tags, 2);
  const tagPhrase = tags.length ? tags.join(' and ') : 'core front-end patterns';
  const difficulty = ctx.difficulty ? `${ctx.difficulty} level` : 'interview-level';
  const sentence1 = `This premium ${tech} ${ctx.type.replace('-', ' ')} focuses on ${ctx.title}.`;
  const sentence2 = `You’ll apply ${tagPhrase} thinking with ${difficulty} constraints.`;
  const sentence3 = ctx.description ? `The prompt emphasizes ${trimWords(ctx.description, 16)}.` : '';
  return [sentence1, sentence2, sentence3].filter(Boolean).map(toSentence).join(' ');
};

const buildLearningGoals = (ctx: BuildContext): string[] => {
  const tech = ctx.technology || DEFAULT_TECH;
  const tags = pickTags(ctx.tags, 3);
  const goals: string[] = [];

  if (ctx.type === 'coding') {
    goals.push(`Translate the prompt into a clear ${tech} API signature and return shape.`);
    if (tags.length) {
      goals.push(`Apply ${tags.join(', ')} techniques to implement ${ctx.title.toLowerCase()}.`);
    }
    if (ctx.difficulty) {
      goals.push(`Handle ${ctx.difficulty} edge cases without sacrificing readability.`);
    }
    goals.push(`Reason about time/space complexity and trade-offs in ${tech}.`);
  } else if (ctx.type === 'trivia') {
    goals.push(`Define the core concept behind “${ctx.title}” in precise ${tech} terms.`);
    if (tags.length) {
      goals.push(`Connect ${tags.join(', ')} to a practical UI or styling outcome.`);
    }
    goals.push(`Identify the correct rule, behavior, or API without overgeneralizing.`);
  } else {
    goals.push(`Decompose ${ctx.title} into front-end components, state, and data flow.`);
    if (tags.length) {
      goals.push(`Apply ${tags.join(', ')} constraints to a real client architecture.`);
    }
    goals.push(`Define performance budgets and UX trade-offs for the interface.`);
    goals.push(`Plan instrumentation and resilience for user-facing failures.`);
  }

  return uniq(goals).slice(0, 6);
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
  const base = uniq(raw).map((item) => trimWords(item, 18)).filter(Boolean);
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
  q: Question,
  opts: {
    candidates: RelatedCandidate[];
    tech: string;
    kind: 'coding';
  }
): LockedPreviewData => {
  const desc = q.description as any;
  const descSpecs = desc?.specs || null;
  const args = Array.isArray(desc?.arguments)
    ? desc.arguments.map((a: any) => String(a?.name || '').trim()).filter(Boolean)
    : [];
  const ctx: CodingContext = {
    type: 'coding',
    title: q.title,
    description: normalizeText(typeof q.description === 'string' ? q.description : desc?.summary || ''),
    tags: q.tags || [],
    difficulty: q.difficulty,
    technology: opts.tech,
    starterCode: q.starterCode || q.code || '',
    starterCodeTs: (q as any).starterCodeTs || '',
    descSpecs: descSpecs ? {
      requirements: descSpecs.requirements,
      expectedBehavior: descSpecs.expectedBehavior,
      implementationNotes: descSpecs.implementationNotes,
    } : null,
    descriptionArgs: args,
  };

  const rawConstraints = [
    ...(ctx.descSpecs?.requirements || []),
    ...(ctx.descSpecs?.expectedBehavior || []),
    ...(ctx.descSpecs?.implementationNotes || []),
  ];

  return {
    what: buildWhatText(ctx),
    keyDecisions: buildKeyDecisions(ctx),
    rubric: buildRubric(ctx),
    learningGoals: buildLearningGoals(ctx),
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
): LockedPreviewData => {
  const ctx: TriviaContext = {
    type: 'trivia',
    title: q.title,
    description: normalizeText(typeof q.description === 'string' ? q.description : (q.description as any)?.summary || ''),
    tags: q.tags || [],
    difficulty: q.difficulty,
    technology: opts.tech,
  };

  return {
    what: buildWhatText(ctx),
    keyDecisions: buildKeyDecisions(ctx),
    rubric: buildRubric(ctx),
    learningGoals: buildLearningGoals(ctx),
    constraints: buildConstraints(ctx, []),
    snippet: buildTriviaSnippet(ctx),
    pitfalls: buildPitfalls(ctx),
    related: buildRelatedLinks(opts.candidates, ctx.tags, 'trivia', opts.tech, q.id, 6),
  };
};

export const buildLockedPreviewForSystemDesign = (
  q: { id: string; title: string; description: string; tags: string[]; sectionTitles?: string[] },
  opts: {
    candidates: RelatedCandidate[];
  }
): LockedPreviewData => {
  const ctx: SystemDesignContext = {
    type: 'system-design',
    title: q.title,
    description: normalizeText(q.description || ''),
    tags: q.tags || [],
    difficulty: 'intermediate',
    technology: 'front-end system design',
  };

  const sectionConstraints = uniq([q.description || '', ...(q.sectionTitles || [])])
    .map((item) => trimWords(item, 16))
    .filter(Boolean);

  return {
    what: buildWhatText(ctx),
    keyDecisions: buildKeyDecisions(ctx),
    rubric: buildRubric(ctx),
    learningGoals: buildLearningGoals(ctx),
    constraints: buildConstraints(ctx, sectionConstraints),
    snippet: buildSystemDesignSnippet(ctx),
    pitfalls: buildPitfalls(ctx),
    related: buildRelatedLinks(opts.candidates, ctx.tags, 'system-design', undefined, q.id, 6),
  };
};
