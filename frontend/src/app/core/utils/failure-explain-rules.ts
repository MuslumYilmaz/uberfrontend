import type { FailureCategory, FailureHint } from '../models/editor-assist.model';
import { classifyFailureCategory } from './error-taxonomy.util';
import { normalizeErrorLine } from './failure-signature.util';
import failureExplainContent from './failure-explain-content.json';

type HintRule = {
  category: FailureCategory;
  hint: FailureHint;
};

type FailureSnapshot = {
  questionId: string;
  category: FailureCategory;
  errorLine: string;
  firstFailName: string;
  passCount: number;
  totalCount: number;
  failCount: number;
  failedTests: Array<{ name: string; errorLine: string }>;
  previousRun?: {
    passCount: number;
    totalCount: number;
    firstFailName?: string;
    signature?: string;
  };
};

type QuestionHintRule = {
  ruleId: string;
  questionId: string;
  priority: number;
  matches: (snapshot: FailureSnapshot) => boolean;
  buildHint: (snapshot: FailureSnapshot) => FailureHint;
};

const KNOWN_FAILURE_CATEGORIES: FailureCategory[] = [
  'missing-return',
  'undefined-access',
  'wrong-function-call',
  'type-mismatch',
  'off-by-one',
  'async-promise-mismatch',
  'reference-error',
  'assertion-mismatch',
  'syntax-error',
  'timeout',
  'mutability-side-effect',
  'edge-case',
  'unknown',
];

const FAILURE_CATEGORY_SET = new Set<FailureCategory>(KNOWN_FAILURE_CATEGORIES);

const DEFAULT_FALLBACK_HINT: FailureHint = {
  ruleId: 'generic-debug',
  title: 'Start with the first failing test',
  why: 'The run produced a failure pattern that is not yet mapped to a specific rule.',
  actions: [
    'Read the first failing test name and expected value carefully.',
    'Log intermediate variables right before the failing assertion.',
    'Fix one failure at a time and re-run quickly.',
  ],
  confidence: 0.55,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isFailureHint(value: unknown): value is FailureHint {
  if (!isRecord(value)) return false;
  const ruleId = value['ruleId'];
  const title = value['title'];
  const why = value['why'];
  const actions = value['actions'];
  const confidence = value['confidence'];
  if (typeof ruleId !== 'string' || !ruleId.trim()) return false;
  if (typeof title !== 'string' || !title.trim()) return false;
  if (typeof why !== 'string' || !why.trim()) return false;
  if (!Array.isArray(actions)) return false;
  if (actions.some((item) => typeof item !== 'string' || !item.trim())) return false;
  if (typeof confidence !== 'number' || !Number.isFinite(confidence)) return false;
  if (confidence < 0 || confidence > 1) return false;
  return true;
}

function parseFailureExplainContent(raw: unknown): { hints: HintRule[]; fallbackHint: FailureHint } {
  if (!isRecord(raw)) {
    return { hints: [], fallbackHint: DEFAULT_FALLBACK_HINT };
  }

  const categoryHintsValue = raw['categoryHints'];
  const categoryHintsRaw = Array.isArray(categoryHintsValue) ? categoryHintsValue : [];
  const hints: HintRule[] = [];
  for (const item of categoryHintsRaw) {
    if (!isRecord(item)) continue;
    const categoryValue = item['category'];
    if (typeof categoryValue !== 'string') continue;
    const category = categoryValue as FailureCategory;
    if (!FAILURE_CATEGORY_SET.has(category)) continue;
    const hintValue = item['hint'];
    if (!isFailureHint(hintValue)) continue;
    hints.push({ category, hint: hintValue });
  }

  const fallbackValue = raw['fallbackHint'];
  const fallbackHint = isFailureHint(fallbackValue) ? fallbackValue : DEFAULT_FALLBACK_HINT;
  return { hints, fallbackHint };
}

const {
  hints: HINTS,
  fallbackHint: FALLBACK_HINT,
} = parseFailureExplainContent(failureExplainContent as unknown);

const HINT_BY_CATEGORY = new Map<FailureCategory, FailureHint>(
  HINTS.map((item) => [item.category, item.hint] as const),
);

function toLower(value: string): string {
  return String(value || '').trim().toLowerCase();
}

function includesAny(value: string, needles: string[]): boolean {
  const text = toLower(value);
  return needles.some((needle) => text.includes(toLower(needle)));
}

function anyFailingTestNameIncludes(snapshot: FailureSnapshot, needles: string[]): boolean {
  return snapshot.failedTests.some((item) => includesAny(item.name, needles));
}

function anyFailingErrorIncludes(snapshot: FailureSnapshot, needles: string[]): boolean {
  return snapshot.failedTests.some((item) => includesAny(item.errorLine, needles));
}

function improvedSincePrevious(snapshot: FailureSnapshot): boolean {
  if (!snapshot.previousRun) return false;
  return snapshot.passCount > snapshot.previousRun.passCount;
}

function buildProgressAwareWhy(snapshot: FailureSnapshot, base: string): string {
  if (improvedSincePrevious(snapshot) && snapshot.failCount > 0) {
    return `Good progress: some tests are now passing. ${base}`;
  }
  if (snapshot.failCount > 1) {
    return `Multiple tests are failing in the same run. ${base}`;
  }
  return base;
}

const QUESTION_HINT_RULES: QuestionHintRule[] = [
  {
    ruleId: 'js-sleep-return-promise',
    questionId: 'js-sleep',
    priority: 120,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, ['returns a promise']) ||
      anyFailingErrorIncludes(snapshot, ['to be "function"', "to be 'function'", 'to be function']),
    buildHint: (snapshot) => ({
      ruleId: 'js-sleep-return-promise',
      title: 'sleep must return a Promise',
      why: buildProgressAwareWhy(snapshot, 'The function contract should always be Promise-based.'),
      actions: [
        'Return `new Promise((resolve) => { ... })` directly from `sleep`.',
        'Resolve inside `setTimeout`, do not return from inside the callback only.',
        'Re-run and verify the "returns a promise" test passes before timing tests.',
      ],
      confidence: 0.96,
    }),
  },
  {
    ruleId: 'js-sleep-delay-timing',
    questionId: 'js-sleep',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, ['resolves after at least the delay', 'does not resolve synchronously']) ||
      anyFailingErrorIncludes(snapshot, ['elapsed', 'to be true']),
    buildHint: (snapshot) => ({
      ruleId: 'js-sleep-delay-timing',
      title: 'Delay timing is too short or inconsistent',
      why: buildProgressAwareWhy(snapshot, 'The Promise resolves before the expected minimum delay.'),
      actions: [
        'Use `setTimeout(resolve, ms)` with the same `ms` input, no unit conversion.',
        'Avoid immediate resolve paths that bypass the timer.',
        'Measure elapsed time around `await sleep(ms)` to confirm it is at least `ms`.',
      ],
      confidence: 0.9,
    }),
  },
  {
    ruleId: 'js-capitalize-words-spacing',
    questionId: 'js-capitalize-words',
    priority: 120,
    matches: (snapshot) => anyFailingTestNameIncludes(snapshot, ['preserves multiple spaces']),
    buildHint: (snapshot) => ({
      ruleId: 'js-capitalize-words-spacing',
      title: 'Word transform is changing spacing',
      why: buildProgressAwareWhy(snapshot, 'This case expects capitalization without collapsing or trimming spaces.'),
      actions: [
        'Preserve separators exactly as they are; transform words only.',
        'If using `split`, split with a space delimiter and keep empty segments, then join with spaces.',
        'Verify leading/trailing and repeated spaces are unchanged in output.',
      ],
      confidence: 0.95,
    }),
  },
  {
    ruleId: 'js-capitalize-words-basics',
    questionId: 'js-capitalize-words',
    priority: 100,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, ['simple sentence', 'mixed casing', 'empty input']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-capitalize-words-basics',
      title: 'Capitalize each word while keeping non-word structure',
      why: buildProgressAwareWhy(snapshot, 'Current output likely misses return value normalization or casing per token.'),
      actions: [
        'Return a string in all branches, including empty input.',
        'Uppercase first character and lowercase the rest for each word token.',
        'Fix one failing example end-to-end, then apply same transform across all tokens.',
      ],
      confidence: 0.88,
    }),
  },
  {
    ruleId: 'js-reverse-string-loop-bounds',
    questionId: 'js-reverse-string',
    priority: 100,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, ['reverses simple strings', 'empty input', 'single character']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-reverse-string-loop-bounds',
      title: 'Reverse logic likely has index boundary issues',
      why: buildProgressAwareWhy(snapshot, 'A reverse loop usually fails when start/end conditions are off by one.'),
      actions: [
        'Iterate from `str.length - 1` down to `0` inclusive.',
        'Build output with `out += str[i]` and return `out`.',
        'Re-test with `""` and `"x"` to confirm boundary handling.',
      ],
      confidence: 0.86,
    }),
  },
  {
    ruleId: 'js-count-vowels-case',
    questionId: 'js-count-vowels',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, ['uppercase vowels', 'mixed case']) ||
      anyFailingErrorIncludes(snapshot, ['to be 5']),
    buildHint: (snapshot) => ({
      ruleId: 'js-count-vowels-case',
      title: 'Vowel check is missing case normalization',
      why: buildProgressAwareWhy(snapshot, 'Uppercase and mixed-case inputs should count the same vowels.'),
      actions: [
        'Normalize input once (`toLowerCase`) before scanning.',
        'Count only `a,e,i,o,u`; ignore consonants, spaces, and punctuation.',
        'Confirm with `AEIOU` and `A quick brown fox` before full rerun.',
      ],
      confidence: 0.9,
    }),
  },
  {
    ruleId: 'js-flatten-once-depth',
    questionId: 'js-flatten-once',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, ['simple nested array', 'mixed array contents']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-flatten-once-depth',
      title: 'Function is flattening too deep or not flattening arrays consistently',
      why: buildProgressAwareWhy(snapshot, 'This task requires one-level flattening only.'),
      actions: [
        'When item is an array, push its direct children only (`...item`).',
        'Do not recurse into nested grandchildren (`[4]` should remain nested in sample).',
        'Keep non-array values unchanged and preserve original order.',
      ],
      confidence: 0.91,
    }),
  },
  {
    ruleId: 'js-unique-array-order',
    questionId: 'js-unique-array',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, ['removes duplicates', 'already-unique', 'mixed types', 'empty', 'nan']) ||
      anyFailingErrorIncludes(snapshot, ['to equal']),
    buildHint: (snapshot) => ({
      ruleId: 'js-unique-array-order',
      title: 'Deduplication should preserve first-seen order and strict identity',
      why: buildProgressAwareWhy(snapshot, 'Expected output keeps first occurrence order, including mixed types like `1` vs `"1"`.'),
      actions: [
        'Track seen values and append only first occurrences.',
        'Use strict equality semantics (`Set` works well for this case).',
        'Verify `[1, \"1\", 1]` becomes `[1, \"1\"]`.',
      ],
      confidence: 0.9,
    }),
  },
  {
    ruleId: 'js-sum-numbers-filter',
    questionId: 'js-sum-numbers',
    priority: 115,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, ['ignores non-numeric values', 'ignores numeric strings']) ||
      anyFailingErrorIncludes(snapshot, ['to be 12', 'to be 40']),
    buildHint: (snapshot) => ({
      ruleId: 'js-sum-numbers-filter',
      title: 'Sum should include numbers only',
      why: buildProgressAwareWhy(snapshot, 'Non-number values and numeric strings should be excluded from the total.'),
      actions: [
        'Filter with `typeof x === \"number\"` and `Number.isFinite(x)` before summing.',
        'Do not coerce strings like `"20"` into numbers for this task.',
        'Use `0` as the initial reducer value to handle empty arrays.',
      ],
      confidence: 0.93,
    }),
  },
  {
    ruleId: 'js-compact-falsy',
    questionId: 'js-compact',
    priority: 100,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, ['common falsy values', 'removes null', 'nan']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-compact-falsy',
      title: 'Falsy filtering is incomplete',
      why: buildProgressAwareWhy(snapshot, '`compact` should remove all falsy values (`0`, `false`, `\"\"`, `null`, `undefined`, `NaN`).'),
      actions: [
        'Filter with truthiness (`Boolean(value)`) to remove every falsy entry.',
        'Verify that `NaN` is removed as well.',
        'Keep original order of remaining values.',
      ],
      confidence: 0.87,
    }),
  },
  {
    ruleId: 'js-arrays-equal-contract',
    questionId: 'js-arrays-equal',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, ['different element order', 'different lengths', 'mixed type differences']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-arrays-equal-contract',
      title: 'Array equality contract should be strict and index-based',
      why: buildProgressAwareWhy(snapshot, 'Equality here means same length and same value at each index with strict comparison.'),
      actions: [
        'Return false early when lengths differ.',
        'Compare each index with strict equality (`!==`).',
        'Do not sort arrays before comparison; order matters.',
      ],
      confidence: 0.92,
    }),
  },
  {
    ruleId: 'js-debounce-reset',
    questionId: 'js-debounce',
    priority: 120,
    matches: (snapshot) => anyFailingTestNameIncludes(snapshot, ['resets timer on rapid calls', 'only last executes']),
    buildHint: (snapshot) => ({
      ruleId: 'js-debounce-reset',
      title: 'Debounce timer is not being reset correctly',
      why: buildProgressAwareWhy(snapshot, 'Rapid calls should cancel previous timers so only the latest invocation runs.'),
      actions: [
        'Store timer id in closure scope and `clearTimeout(timer)` before scheduling a new one.',
        'Assign `timer = setTimeout(...)` on every call.',
        'Validate with quick repeated calls: execution count should remain 0 until final delay completes.',
      ],
      confidence: 0.95,
    }),
  },
  {
    ruleId: 'js-debounce-args-this',
    questionId: 'js-debounce',
    priority: 110,
    matches: (snapshot) => anyFailingTestNameIncludes(snapshot, ['passes arguments', 'preserves this']),
    buildHint: (snapshot) => ({
      ruleId: 'js-debounce-args-this',
      title: 'Debounced callback is losing args or context',
      why: buildProgressAwareWhy(snapshot, 'The delayed invocation should keep both call arguments and `this` binding.'),
      actions: [
        'Return a regular function wrapper (not arrow) if `this` must be preserved.',
        'Inside timeout use `fn.apply(this, args)`.',
        'Confirm output for context-based examples like greeting methods.',
      ],
      confidence: 0.9,
    }),
  },
  {
    ruleId: 'js-sleep-default',
    questionId: 'js-sleep',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-sleep-default',
      title: 'Focus on the sleep contract first',
      why: buildProgressAwareWhy(snapshot, 'Stabilize Promise return behavior, then validate timing semantics.'),
      actions: [
        'Pass the Promise contract test before optimizing timing behavior.',
        'Change one thing per run and re-check elapsed timing.',
        'Keep implementation minimal to avoid mixed async patterns.',
      ],
      confidence: 0.74,
    }),
  },
  {
    ruleId: 'js-capitalize-words-default',
    questionId: 'js-capitalize-words',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-capitalize-words-default',
      title: 'Transform words without changing sentence structure',
      why: buildProgressAwareWhy(snapshot, 'For this problem, casing changes should not alter spacing layout.'),
      actions: [
        'Keep separators untouched and transform token text only.',
        'Handle empty input with a direct string return.',
        'Verify with mixed-case and multi-space examples.',
      ],
      confidence: 0.73,
    }),
  },
  {
    ruleId: 'js-reverse-string-default',
    questionId: 'js-reverse-string',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-reverse-string-default',
      title: 'Use a single backward pass',
      why: buildProgressAwareWhy(snapshot, 'Most failures here come from index boundaries or missing return.'),
      actions: [
        'Iterate backward once and append chars in order.',
        'Confirm edge cases: empty and single-character strings.',
        'Avoid extra transformations until core loop passes.',
      ],
      confidence: 0.72,
    }),
  },
  {
    ruleId: 'js-count-vowels-default',
    questionId: 'js-count-vowels',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-count-vowels-default',
      title: 'Normalize input and count vowel membership',
      why: buildProgressAwareWhy(snapshot, 'This question is mostly about consistent character normalization.'),
      actions: [
        'Normalize once, then scan with a simple vowel set.',
        'Count only vowels, not all letters.',
        'Check uppercase and mixed-case examples explicitly.',
      ],
      confidence: 0.72,
    }),
  },
  {
    ruleId: 'js-flatten-once-default',
    questionId: 'js-flatten-once',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-flatten-once-default',
      title: 'Flatten one level only',
      why: buildProgressAwareWhy(snapshot, 'The contract is single-depth flattening with order preservation.'),
      actions: [
        'Expand direct child arrays only.',
        'Do not recurse into nested grandchildren.',
        'Recheck expected output shape for nested arrays.',
      ],
      confidence: 0.73,
    }),
  },
  {
    ruleId: 'js-unique-array-default',
    questionId: 'js-unique-array',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-unique-array-default',
      title: 'Deduplicate while preserving first appearances',
      why: buildProgressAwareWhy(snapshot, 'Result order should mirror first time each value appears.'),
      actions: [
        'Use a seen set to keep first occurrences only.',
        'Keep strict type distinctions (`1` vs `"1"`).',
        'Check both numeric and string duplicate cases.',
      ],
      confidence: 0.73,
    }),
  },
  {
    ruleId: 'js-sum-numbers-default',
    questionId: 'js-sum-numbers',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-sum-numbers-default',
      title: 'Filter then sum numeric values only',
      why: buildProgressAwareWhy(snapshot, 'This problem expects strict numeric filtering before reduction.'),
      actions: [
        'Exclude strings/booleans/null from the accumulator.',
        'Use a stable numeric reducer starting from 0.',
        'Verify empty-array behavior returns 0.',
      ],
      confidence: 0.74,
    }),
  },
  {
    ruleId: 'js-compact-default',
    questionId: 'js-compact',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-compact-default',
      title: 'Keep only truthy entries',
      why: buildProgressAwareWhy(snapshot, 'The output should remove every falsy variant consistently.'),
      actions: [
        'Filter by truthiness to remove all falsy values.',
        'Keep original order of truthy items.',
        'Validate with `NaN`, `0`, empty string, and nullish values.',
      ],
      confidence: 0.72,
    }),
  },
  {
    ruleId: 'js-arrays-equal-default',
    questionId: 'js-arrays-equal',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-arrays-equal-default',
      title: 'Compare arrays strictly by length and index',
      why: buildProgressAwareWhy(snapshot, 'This equality check is deterministic and order-sensitive.'),
      actions: [
        'Fail fast on length mismatch.',
        'Compare each pair using strict equality.',
        'Keep order significance; do not reorder inputs.',
      ],
      confidence: 0.73,
    }),
  },
  {
    ruleId: 'js-debounce-default',
    questionId: 'js-debounce',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-debounce-default',
      title: 'Implement debounce as one timer in closure',
      why: buildProgressAwareWhy(snapshot, 'Correct debounce behavior depends on clear-and-reschedule semantics.'),
      actions: [
        'Keep a single timer reference in the wrapper closure.',
        'Clear previous timer before setting a new one.',
        'Ensure delayed call forwards args and context.',
      ],
      confidence: 0.75,
    }),
  },
  {
    ruleId: 'js-number-clamp-range',
    questionId: 'js-number-clamp',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, ['below lower', 'above upper', 'bounds', 'within range']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-number-clamp-range',
      title: 'Clamp should enforce inclusive lower/upper bounds',
      why: buildProgressAwareWhy(snapshot, 'The value should pass through unchanged only when already inside the range.'),
      actions: [
        'Apply lower bound first (`Math.max(value, min)`), then upper bound (`Math.min(..., max)`).',
        'Keep bounds inclusive so exact min/max values remain valid.',
        'Recheck below-range, above-range, and on-boundary examples.',
      ],
      confidence: 0.9,
    }),
  },
  {
    ruleId: 'js-number-clamp-default',
    questionId: 'js-number-clamp',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-number-clamp-default',
      title: 'Implement clamp as a pure bounds check',
      why: buildProgressAwareWhy(snapshot, 'This question is mostly about handling all bound positions consistently.'),
      actions: [
        'Return the original value when it is already in range.',
        'Clamp to `min` when below and `max` when above.',
        'Verify exact-boundary cases explicitly.',
      ],
      confidence: 0.74,
    }),
  },
  {
    ruleId: 'js-max-char-frequency',
    questionId: 'js-max-char',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, ['most common', 'multiple repetitions', 'tie', 'empty']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-max-char-frequency',
      title: 'Frequency counting or tie-breaking is off',
      why: buildProgressAwareWhy(snapshot, 'Track counts reliably and keep deterministic first-seen tie behavior.'),
      actions: [
        'Build a character-frequency map in one pass.',
        'Update winner only when count is strictly greater to preserve first tie winner.',
        'Return empty string for empty input.',
      ],
      confidence: 0.9,
    }),
  },
  {
    ruleId: 'js-max-char-default',
    questionId: 'js-max-char',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-max-char-default',
      title: 'Count characters, then pick the highest frequency',
      why: buildProgressAwareWhy(snapshot, 'This problem depends on stable counting and tie handling.'),
      actions: [
        'Use an object/map to accumulate counts.',
        'Track the best character while iterating counts.',
        'Keep deterministic behavior for ties.',
      ],
      confidence: 0.74,
    }),
  },
  {
    ruleId: 'js-shallow-clone-contract',
    questionId: 'js-shallow-clone',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, ['shallowly', 'non-object/array']) ||
      anyFailingErrorIncludes(snapshot, ['typeerror']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-shallow-clone-contract',
      title: 'Clone should copy top-level only and reject invalid input',
      why: buildProgressAwareWhy(snapshot, 'Shallow clone means new container, but nested references stay shared.'),
      actions: [
        'For arrays, return `value.slice()`; for objects, return `{ ...value }`.',
        'Keep nested objects by reference (`copy.nested === original.nested`).',
        'Throw `TypeError` for non-object/non-array values.',
      ],
      confidence: 0.92,
    }),
  },
  {
    ruleId: 'js-shallow-clone-default',
    questionId: 'js-shallow-clone',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-shallow-clone-default',
      title: 'Separate array/object branches for shallow cloning',
      why: buildProgressAwareWhy(snapshot, 'Correct branch handling avoids mutation and preserves shallow semantics.'),
      actions: [
        'Branch with `Array.isArray(value)` first.',
        'Handle plain object cloning in a separate branch.',
        'Fail fast on unsupported input types.',
      ],
      confidence: 0.75,
    }),
  },
  {
    ruleId: 'js-once-wrapper',
    questionId: 'js-once',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, ['only once', 'first result', 'preserves this context']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-once-wrapper',
      title: 'Once wrapper should cache first result and stop re-invocation',
      why: buildProgressAwareWhy(snapshot, 'The wrapped function should execute exactly once with stable return value thereafter.'),
      actions: [
        'Store `called` flag and cached `result` in closure state.',
        'Invoke underlying function only on first call and cache the output.',
        'Use `fn.apply(this, args)` to preserve call-site context.',
      ],
      confidence: 0.92,
    }),
  },
  {
    ruleId: 'js-once-default',
    questionId: 'js-once',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-once-default',
      title: 'Implement once with closure state',
      why: buildProgressAwareWhy(snapshot, 'This question is mainly closure-based call gating.'),
      actions: [
        'Track whether the wrapped function has already run.',
        'Cache and return the first result on later calls.',
        'Keep the wrapper transparent for args/context.',
      ],
      confidence: 0.75,
    }),
  },
  {
    ruleId: 'js-object-create-prototype',
    questionId: 'js-object-create',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, ['prototype', 'null prototype', 'invalid prototype']) ||
      anyFailingErrorIncludes(snapshot, ['typeerror']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-object-create-prototype',
      title: 'Prototype wiring or validation is incorrect',
      why: buildProgressAwareWhy(snapshot, 'Object creation should support valid prototypes (including null) and reject invalid ones.'),
      actions: [
        'Validate `proto` is object/function/null before creation.',
        'Create with `Object.create(proto)` to set prototype correctly.',
        'Copy optional props after creation and guard invalid props input.',
      ],
      confidence: 0.91,
    }),
  },
  {
    ruleId: 'js-object-create-default',
    questionId: 'js-object-create',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-object-create-default',
      title: 'Create object from prototype with safe input checks',
      why: buildProgressAwareWhy(snapshot, 'This task combines prototype semantics with defensive validation.'),
      actions: [
        'Create via `Object.create` instead of mutating `__proto__`.',
        'Allow null prototype explicitly.',
        'Throw clear `TypeError` for invalid prototype input.',
      ],
      confidence: 0.74,
    }),
  },
  {
    ruleId: 'js-update-at-index-immutable',
    questionId: 'js-update-at-index',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, ['immutably', 'out of range', 'non-array']) ||
      anyFailingErrorIncludes(snapshot, ['typeerror']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-update-at-index-immutable',
      title: 'Immutable update contract is not fully respected',
      why: buildProgressAwareWhy(snapshot, 'The function should always return a new array and preserve original input.'),
      actions: [
        'Start with a shallow copy (`arr.slice()`) and modify only the copy.',
        'Return unchanged copy when index is out of range.',
        'Throw `TypeError` when input is not an array.',
      ],
      confidence: 0.92,
    }),
  },
  {
    ruleId: 'js-update-at-index-default',
    questionId: 'js-update-at-index',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-update-at-index-default',
      title: 'Update by copying first, then replacing one slot',
      why: buildProgressAwareWhy(snapshot, 'This question is an immutable array update pattern.'),
      actions: [
        'Never write into the original array.',
        'Guard index boundaries before assignment.',
        'Return new array in all paths.',
      ],
      confidence: 0.75,
    }),
  },
  {
    ruleId: 'js-throttle-timing',
    questionId: 'js-throttle',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, ['ignores rapid calls', 'interval spacing', 'proper intervals', 'passes arguments']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-throttle-timing',
      title: 'Throttle window logic is inconsistent',
      why: buildProgressAwareWhy(snapshot, 'Throttle should run immediately, then ignore calls until the wait window expires.'),
      actions: [
        'Track `lastCallTime` (or equivalent) in closure state.',
        'Call only when `now - lastCallTime >= wait`.',
        'Forward latest call arguments to the executed invocation.',
      ],
      confidence: 0.9,
    }),
  },
  {
    ruleId: 'js-throttle-default',
    questionId: 'js-throttle',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-throttle-default',
      title: 'Throttle should gate execution frequency',
      why: buildProgressAwareWhy(snapshot, 'This task is mostly about enforcing time-window execution correctly.'),
      actions: [
        'Run first call immediately.',
        'Block intermediate calls within the wait window.',
        'Allow execution again once interval elapses.',
      ],
      confidence: 0.74,
    }),
  },
  {
    ruleId: 'js-deep-clone-types',
    questionId: 'js-deep-clone',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, ['nested objects', 'arrays correctly', 'date and regexp', 'primitives']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-deep-clone-types',
      title: 'Deep clone is missing one or more type branches',
      why: buildProgressAwareWhy(snapshot, 'A robust deep clone should recurse through objects/arrays and handle special built-ins.'),
      actions: [
        'Return primitives directly.',
        'Clone arrays/objects recursively, not by reference.',
        'Handle `Date` and `RegExp` with explicit constructors.',
      ],
      confidence: 0.9,
    }),
  },
  {
    ruleId: 'js-deep-clone-default',
    questionId: 'js-deep-clone',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-deep-clone-default',
      title: 'Implement deep clone via recursive branching',
      why: buildProgressAwareWhy(snapshot, 'This problem requires per-type recursion strategy.'),
      actions: [
        'Handle primitive/object/array/date/regexp paths separately.',
        'Recurse into child values for arrays/objects.',
        'Verify cloned output does not share nested references.',
      ],
      confidence: 0.75,
    }),
  },
  {
    ruleId: 'js-deep-equal-structures',
    questionId: 'js-deep-equal',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, ['primitives', 'nested objects', 'order matters', 'date and regexp', 'null vs undefined']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-deep-equal-structures',
      title: 'Deep comparison branch order is likely incorrect',
      why: buildProgressAwareWhy(snapshot, 'Deep equal should handle primitives first, then structured recursive comparisons.'),
      actions: [
        'Handle strict equality and `NaN` edge case early.',
        'Compare arrays by length/order, then recurse index by index.',
        'Compare object keys count and recursively compare each property.',
      ],
      confidence: 0.92,
    }),
  },
  {
    ruleId: 'js-deep-equal-default',
    questionId: 'js-deep-equal',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-deep-equal-default',
      title: 'Walk values recursively with explicit type guards',
      why: buildProgressAwareWhy(snapshot, 'Most failures come from missing a special-case branch in the comparison tree.'),
      actions: [
        'Guard null/object/array/date/regexp paths explicitly.',
        'Use recursion for nested members.',
        'Keep order-sensitive array comparison.',
      ],
      confidence: 0.76,
    }),
  },
  {
    ruleId: 'js-flatten-depth-control',
    questionId: 'js-flatten-depth',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, ['one level', 'two levels', 'depth 0', 'fully flattens', 'already flat', 'non-nested']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-flatten-depth-control',
      title: 'Depth handling is inconsistent',
      why: buildProgressAwareWhy(snapshot, 'Flatten should remove nesting only up to the requested depth and keep structure beyond that.'),
      actions: [
        'For `depth === 0`, return a shallow copy of input.',
        'Recurse only when current item is an array and depth > 0.',
        'Decrease depth on recursive calls and preserve item order.',
      ],
      confidence: 0.93,
    }),
  },
  {
    ruleId: 'js-flatten-depth-default',
    questionId: 'js-flatten-depth',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-flatten-depth-default',
      title: 'Treat depth as a strict recursion budget',
      why: buildProgressAwareWhy(snapshot, 'This problem is mainly about precise depth decrement behavior.'),
      actions: [
        'Flatten only while depth remains positive.',
        'Keep non-array items as-is.',
        'Validate with depth 0, 1, and large depth examples.',
      ],
      confidence: 0.76,
    }),
  },
  {
    ruleId: 'js-curry-function-arity',
    questionId: 'js-curry-function',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, ['curries', 'partial application', 'mixed grouping', '2-argument', 'single-argument']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-curry-function-arity',
      title: 'Currying arity check or argument accumulation is off',
      why: buildProgressAwareWhy(snapshot, 'Curried wrapper should collect arguments until function arity is satisfied.'),
      actions: [
        'Compare collected argument count with `fn.length`.',
        'If not enough args, return a function that accumulates the next chunk.',
        'When enough args exist, execute original function with merged args.',
      ],
      confidence: 0.91,
    }),
  },
  {
    ruleId: 'js-curry-function-default',
    questionId: 'js-curry-function',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-curry-function-default',
      title: 'Implement currying via recursive argument collection',
      why: buildProgressAwareWhy(snapshot, 'This problem is mostly about arity-aware wrapper recursion.'),
      actions: [
        'Accumulate args across invocations.',
        'Stop wrapping and execute once arity is met.',
        'Support mixed grouping patterns consistently.',
      ],
      confidence: 0.75,
    }),
  },
  {
    ruleId: 'js-memoize-function-cache',
    questionId: 'js-memoize-function',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, ['caches results', 'different arguments', 'multiple argument']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-memoize-function-cache',
      title: 'Memoization cache keying is inconsistent',
      why: buildProgressAwareWhy(snapshot, 'Same argument set should hit cache; different sets should compute independently.'),
      actions: [
        'Build a deterministic key from arguments (for this kata, JSON serialization is acceptable).',
        'Return cached value when key already exists.',
        'Store freshly computed result before returning.',
      ],
      confidence: 0.9,
    }),
  },
  {
    ruleId: 'js-memoize-function-default',
    questionId: 'js-memoize-function',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-memoize-function-default',
      title: 'Use a cache map keyed by call arguments',
      why: buildProgressAwareWhy(snapshot, 'Memoization depends on stable keying and lookup-before-compute flow.'),
      actions: [
        'Check cache before invoking the wrapped function.',
        'Persist result for the current args key.',
        'Keep separate entries for distinct argument tuples.',
      ],
      confidence: 0.74,
    }),
  },
  {
    ruleId: 'js-compose-order',
    questionId: 'js-compose',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, ['right-to-left', 'single function', 'identity', 'multiple arguments', 'type transformation']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-compose-order',
      title: 'Compose execution order is likely reversed',
      why: buildProgressAwareWhy(snapshot, 'Compose should apply functions from right to left.'),
      actions: [
        'Call rightmost function with all original arguments.',
        'Feed each intermediate result into the next function on the left.',
        'Return identity function when compose receives no functions.',
      ],
      confidence: 0.92,
    }),
  },
  {
    ruleId: 'js-compose-default',
    questionId: 'js-compose',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-compose-default',
      title: 'Treat compose as right-to-left function piping',
      why: buildProgressAwareWhy(snapshot, 'This task is mainly order-of-application correctness.'),
      actions: [
        'Start from the rightmost function result.',
        'Iterate leftward over remaining functions.',
        'Keep identity behavior for empty input list.',
      ],
      confidence: 0.75,
    }),
  },
  {
    ruleId: 'js-group-by-buckets',
    questionId: 'js-group-by',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, ['numbers by', 'strings by', 'objects by property', 'empty object']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-group-by-buckets',
      title: 'Grouping buckets are not being created or appended correctly',
      why: buildProgressAwareWhy(snapshot, 'Each computed key should map to an array containing matching items.'),
      actions: [
        'Compute group key with `keyFn(item)` for every element.',
        'Initialize bucket array when key appears first time.',
        'Push item into its bucket while preserving original traversal order.',
      ],
      confidence: 0.9,
    }),
  },
  {
    ruleId: 'js-group-by-default',
    questionId: 'js-group-by',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-group-by-default',
      title: 'Build result as key -> array buckets',
      why: buildProgressAwareWhy(snapshot, 'This problem is about deterministic bucket construction from callback keys.'),
      actions: [
        'Use an object/map as accumulator.',
        'Create missing buckets lazily.',
        'Return empty container for empty input.',
      ],
      confidence: 0.74,
    }),
  },
  {
    ruleId: 'js-event-emitter-subscriptions',
    questionId: 'js-event-emitter-mini',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, ['listener when event is emitted', 'removes listener', 'multiple listeners', 'unknown events/listeners']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-event-emitter-subscriptions',
      title: 'Emitter subscription lifecycle is inconsistent',
      why: buildProgressAwareWhy(snapshot, 'Listeners should register, deregister, and emit reliably without side effects.'),
      actions: [
        'Store listeners per event name in an internal map.',
        'Remove exact listener references in `off`.',
        'In `emit`, iterate over a snapshot copy and no-op for unknown events.',
      ],
      confidence: 0.92,
    }),
  },
  {
    ruleId: 'js-event-emitter-default',
    questionId: 'js-event-emitter-mini',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-event-emitter-default',
      title: 'Model emitter as event-name to listener-list',
      why: buildProgressAwareWhy(snapshot, 'Most failures come from missing event-list bookkeeping.'),
      actions: [
        'Initialize per-event arrays lazily.',
        'Keep `off` idempotent when event/listener is missing.',
        'Emit all subscribed listeners with provided args.',
      ],
      confidence: 0.75,
    }),
  },
  {
    ruleId: 'js-concurrency-map-limit-scheduler',
    questionId: 'js-concurrency-map-limit',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, ['preserves order', 'concurrency limit', 'fail-fast', 'all-settled', 'limit < 1']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-concurrency-map-limit-scheduler',
      title: 'Scheduler is violating order, limit, or strategy behavior',
      why: buildProgressAwareWhy(snapshot, 'This utility must coordinate worker execution and result placement deterministically.'),
      actions: [
        'Validate `limit >= 1` before starting.',
        'Write results by original item index to preserve output order.',
        'Handle `fail-fast` vs `all-settled` with explicit error branches.',
      ],
      confidence: 0.92,
    }),
  },
  {
    ruleId: 'js-concurrency-map-limit-default',
    questionId: 'js-concurrency-map-limit',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-concurrency-map-limit-default',
      title: 'Use a bounded worker pool with indexed result writes',
      why: buildProgressAwareWhy(snapshot, 'This task is mainly queue coordination plus strategy-specific error handling.'),
      actions: [
        'Run at most `limit` workers concurrently.',
        'Track next index atomically inside workers.',
        'Resolve only after all items are handled for the chosen strategy.',
      ],
      confidence: 0.76,
    }),
  },
  {
    ruleId: 'js-abortable-helpers-control-flow',
    questionId: 'js-abortable-helpers',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, ['withTimeout', 'withAbort', 'composeAbort']) ||
      anyFailingErrorIncludes(snapshot, ['timeout', 'aborted']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-abortable-helpers-control-flow',
      title: 'Timeout/abort race handling is incomplete',
      why: buildProgressAwareWhy(snapshot, 'Abortable helpers require deterministic first-settled behavior with proper listener cleanup.'),
      actions: [
        'In timeout wrapper, guard with a settled flag and clear timer on completion.',
        'In abort wrapper, reject immediately if already aborted and remove listeners after settle.',
        'For composed abort signal, propagate abort when any source aborts.',
      ],
      confidence: 0.91,
    }),
  },
  {
    ruleId: 'js-abortable-helpers-default',
    questionId: 'js-abortable-helpers',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-abortable-helpers-default',
      title: 'Treat timeout and abort as competing completion signals',
      why: buildProgressAwareWhy(snapshot, 'This question is mostly about race safety and cleanup discipline.'),
      actions: [
        'Track settled state to avoid double resolve/reject.',
        'Detach abort listeners after completion.',
        'Keep helper behavior deterministic for already-aborted signals.',
      ],
      confidence: 0.75,
    }),
  },
  {
    ruleId: 'js-streaming-ndjson-parser-buffering',
    questionId: 'js-streaming-ndjson-parser',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, ['chunk boundaries', 'last line', 'blank lines', 'malformed lines']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-streaming-ndjson-parser-buffering',
      title: 'Line buffering/parsing across chunks is incorrect',
      why: buildProgressAwareWhy(snapshot, 'NDJSON parser must preserve partial lines and continue after malformed entries.'),
      actions: [
        'Accumulate chunk text in a buffer and split by newline.',
        'Parse only complete non-empty lines; keep remainder for next chunk.',
        'On parse failure call `onError` and continue processing.',
      ],
      confidence: 0.93,
    }),
  },
  {
    ruleId: 'js-streaming-ndjson-parser-default',
    questionId: 'js-streaming-ndjson-parser',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-streaming-ndjson-parser-default',
      title: 'Process stream as buffered lines, not full payload',
      why: buildProgressAwareWhy(snapshot, 'This task is primarily chunk-boundary-safe line parsing.'),
      actions: [
        'Keep an internal tail buffer between chunks.',
        'Parse each full line with guarded `JSON.parse`.',
        'Finalize remaining buffer on stream flush.',
      ],
      confidence: 0.76,
    }),
  },
  {
    ruleId: 'js-array-prototype-map-spec',
    questionId: 'js-array-prototype-map',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, ['callbackFn is not a function', 'identity', 'square', 'preserves holes', 'thisArg', 'length snapshot']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-array-prototype-map-spec',
      title: 'myMap does not fully follow spec-like behavior',
      why: buildProgressAwareWhy(snapshot, 'Map should preserve holes, bind context, and iterate over snapshot length.'),
      actions: [
        'Validate callback type and throw `TypeError` for non-functions.',
        'Capture initial `length` once and iterate numeric indices up to it.',
        'Only map own indices (`hasOwnProperty`) so holes remain holes in output.',
      ],
      confidence: 0.93,
    }),
  },
  {
    ruleId: 'js-array-prototype-map-default',
    questionId: 'js-array-prototype-map',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-array-prototype-map-default',
      title: 'Implement myMap with length snapshot and hole-awareness',
      why: buildProgressAwareWhy(snapshot, 'Most failures come from sparse-array or callback-contract details.'),
      actions: [
        'Coerce receiver to object and read `length` once.',
        'Call callback with `(value, index, source)` and optional `thisArg`.',
        'Preserve output length and sparse structure.',
      ],
      confidence: 0.76,
    }),
  },
  {
    ruleId: 'js-array-prototype-reduce-spec',
    questionId: 'js-array-prototype-reduce',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, ['initialValue', 'without initialValue', 'leading holes', 'sparse arrays', 'passes index', 'empty array']) ||
      anyFailingErrorIncludes(snapshot, ['typeerror']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-array-prototype-reduce-spec',
      title: 'myReduce accumulator initialization or sparse handling is off',
      why: buildProgressAwareWhy(snapshot, 'Reduce behavior changes significantly depending on whether initial value is provided.'),
      actions: [
        'If no initial value, find first existing element as accumulator or throw on empty.',
        'Skip holes by checking own properties before callback invocation.',
        'Pass `(acc, value, index, array)` exactly to callback.',
      ],
      confidence: 0.94,
    }),
  },
  {
    ruleId: 'js-array-prototype-reduce-default',
    questionId: 'js-array-prototype-reduce',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-array-prototype-reduce-default',
      title: 'Split myReduce into init phase and iteration phase',
      why: buildProgressAwareWhy(snapshot, 'Clear initialization logic prevents most reduce edge-case bugs.'),
      actions: [
        'Handle initial accumulator selection first.',
        'Iterate over valid indices only.',
        'Enforce empty-without-initial error path.',
      ],
      confidence: 0.77,
    }),
  },
  {
    ruleId: 'js-array-prototype-filter-spec',
    questionId: 'js-array-prototype-filter',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'filter even',
        'empty array',
        'thisarg',
        'sparse',
        'snapshots length',
        'deleted before their turn',
        'callback is not a function',
      ]) ||
      anyFailingErrorIncludes(snapshot, ['is not a function', 'typeerror']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-array-prototype-filter-spec',
      title: 'myFilter needs spec-like callback and sparse-array handling',
      why: buildProgressAwareWhy(
        snapshot,
        'Filter should iterate over snapshot length, skip holes, and call callback with the right context.',
      ),
      actions: [
        'Throw `TypeError` when callback is not a function.',
        'Read `length` once, iterate indices, and process only own properties (`hasOwnProperty`).',
        'Call `callbackFn.call(thisArg, value, index, array)` and push values only when callback returns truthy.',
      ],
      confidence: 0.93,
    }),
  },
  {
    ruleId: 'js-array-prototype-filter-default',
    questionId: 'js-array-prototype-filter',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-array-prototype-filter-default',
      title: 'Implement myFilter with length snapshot and hole checks',
      why: buildProgressAwareWhy(snapshot, 'Most failures here come from callback contract and sparse-array iteration details.'),
      actions: [
        'Validate inputs first (`this` and callback).',
        'Snapshot length before loop and skip missing indices.',
        'Return a new result array without mutating the source.',
      ],
      confidence: 0.76,
    }),
  },
  {
    ruleId: 'js-array-foreach-spec',
    questionId: 'js-array-foreach',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'iterates in order',
        'thisarg',
        'sparse arrays',
        'snapshots length',
        'deleted before their turn',
      ]) ||
      anyFailingErrorIncludes(snapshot, ['arr must be an array', 'callbackfn must be a function']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-array-foreach-spec',
      title: 'arrayForEach loop semantics are off',
      why: buildProgressAwareWhy(
        snapshot,
        'forEach-like behavior requires stable order, optional thisArg binding, and sparse-array awareness.',
      ),
      actions: [
        'Validate `arr` is an array and `callbackFn` is a function.',
        'Snapshot `arr.length` once before iteration.',
        'Visit only existing indices and call `callbackFn.call(thisArg, value, index, arr)`.',
      ],
      confidence: 0.92,
    }),
  },
  {
    ruleId: 'js-array-foreach-default',
    questionId: 'js-array-foreach',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-array-foreach-default',
      title: 'Treat arrayForEach as side-effect iteration only',
      why: buildProgressAwareWhy(snapshot, 'This utility is about correct iteration behavior rather than return values.'),
      actions: [
        'Loop from index 0 to snapshot length.',
        'Skip holes with own-property checks.',
        'Do not build or return a transformed array.',
      ],
      confidence: 0.75,
    }),
  },
  {
    ruleId: 'js-array-sort-numeric-order',
    questionId: 'js-array-sort',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'ascending',
        'descending',
        'does not mutate',
        'empty and single-element',
      ]) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-array-sort-numeric-order',
      title: 'sortNumbers likely uses wrong comparator or mutates input',
      why: buildProgressAwareWhy(snapshot, 'Numeric sorting requires explicit compare logic and defensive cloning.'),
      actions: [
        'Clone first (for example with spread) so original array remains unchanged.',
        'Use numeric comparator `a - b` for ascending and `b - a` for descending.',
        'Keep edge behavior deterministic for empty/single-element arrays.',
      ],
      confidence: 0.9,
    }),
  },
  {
    ruleId: 'js-array-sort-default',
    questionId: 'js-array-sort',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-array-sort-default',
      title: 'Use clone + numeric comparator for sortNumbers',
      why: buildProgressAwareWhy(snapshot, 'Default string sort behavior is a common source of wrong numeric output.'),
      actions: [
        'Avoid in-place sort on the original input.',
        'Choose comparator based on `ascending` flag.',
        'Return the sorted clone.',
      ],
      confidence: 0.74,
    }),
  },
  {
    ruleId: 'js-create-counter-closure-state',
    questionId: 'js-create-counter',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, ['increments sequentially', 'negative', 'independent state']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-create-counter-closure-state',
      title: 'Counter state is not preserved correctly across calls',
      why: buildProgressAwareWhy(snapshot, 'This question is about closure state and per-instance isolation.'),
      actions: [
        'Capture `n` in an outer scope and return an inner function.',
        'Return current value before incrementing for each call.',
        'Ensure each `createCounter` call gets its own independent `n`.',
      ],
      confidence: 0.91,
    }),
  },
  {
    ruleId: 'js-create-counter-default',
    questionId: 'js-create-counter',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-create-counter-default',
      title: 'Implement counter using a closure',
      why: buildProgressAwareWhy(snapshot, 'Global/shared state between counters is usually the root cause here.'),
      actions: [
        'Keep state in function scope, not module scope.',
        'Increment exactly once per invocation.',
        'Return number values directly.',
      ],
      confidence: 0.74,
    }),
  },
  {
    ruleId: 'js-is-object-empty-type-branching',
    questionId: 'js-is-object-empty',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'non-empty object',
        'empty object',
        'non-empty array',
        'empty array',
        'throws typeerror',
      ]) ||
      anyFailingErrorIncludes(snapshot, ['typeerror']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-is-object-empty-type-branching',
      title: 'isEmpty should branch arrays, objects, and invalid inputs',
      why: buildProgressAwareWhy(snapshot, 'This utility needs explicit runtime type handling before checking emptiness.'),
      actions: [
        'Return `obj.length === 0` for arrays.',
        'For plain objects, use `Object.keys(obj).length === 0`.',
        'Throw `TypeError` for non-object/non-array inputs.',
      ],
      confidence: 0.92,
    }),
  },
  {
    ruleId: 'js-is-object-empty-default',
    questionId: 'js-is-object-empty',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-is-object-empty-default',
      title: 'Separate emptiness checks by runtime type',
      why: buildProgressAwareWhy(snapshot, 'Mixing object and array logic often produces false positives.'),
      actions: [
        'Check `Array.isArray` first.',
        'Then handle object branch with `Object.keys`.',
        'Guard invalid primitives with a thrown error.',
      ],
      confidence: 0.75,
    }),
  },
  {
    ruleId: 'js-add-two-promises-await-both',
    questionId: 'js-add-two-promises',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'sum of positive numbers',
        'negative and positive',
        'zero values',
        'immediately resolved',
        'rejects when one promise rejects',
      ]) ||
      anyFailingErrorIncludes(snapshot, ['rejected', 'promise']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-add-two-promises-await-both',
      title: 'addTwoPromises should await both values concurrently',
      why: buildProgressAwareWhy(snapshot, 'The function should resolve with sum and propagate rejection from either input promise.'),
      actions: [
        'Use `await Promise.all([promise1, promise2])` to resolve both concurrently.',
        'Return numeric sum of the two resolved values.',
        'Do not swallow errors; let rejections propagate.',
      ],
      confidence: 0.91,
    }),
  },
  {
    ruleId: 'js-add-two-promises-default',
    questionId: 'js-add-two-promises',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-add-two-promises-default',
      title: 'Resolve both promises and add their values',
      why: buildProgressAwareWhy(snapshot, 'Most failures here come from not awaiting both promises correctly.'),
      actions: [
        'Resolve both inputs before arithmetic.',
        'Return a number, not a promise of partial state.',
        'Keep behavior consistent for negative and zero values.',
      ],
      confidence: 0.74,
    }),
  },
  {
    ruleId: 'js-promise-all-order-and-rejection',
    questionId: 'js-promise-all',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'in order',
        'empty array',
        'any promise rejects',
        'not an array',
      ]) ||
      anyFailingErrorIncludes(snapshot, ['typeerror', 'reject']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-promise-all-order-and-rejection',
      title: 'promiseAll is missing order, empty-input, or reject behavior',
      why: buildProgressAwareWhy(snapshot, 'A correct Promise.all clone preserves index order and rejects on first failure.'),
      actions: [
        'Reject with `TypeError` when input is not an array.',
        'Resolve immediately with `[]` when array is empty.',
        'Store resolved values by original index and reject fast on first error.',
      ],
      confidence: 0.94,
    }),
  },
  {
    ruleId: 'js-promise-all-default',
    questionId: 'js-promise-all',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-promise-all-default',
      title: 'Aggregate promise results by index with a completion counter',
      why: buildProgressAwareWhy(snapshot, 'This task is mostly about bookkeeping and fail-fast error flow.'),
      actions: [
        'Normalize each item with `Promise.resolve`.',
        'Track remaining completions and resolve when it reaches zero.',
        'Keep one reject path for any failure.',
      ],
      confidence: 0.77,
    }),
  },
  {
    ruleId: 'js-implement-bind-constructor-semantics',
    questionId: 'js-implement-bind',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'binds this',
        'partial application',
        'called with new',
        'instanceof original',
        'constructor return object',
      ]) ||
      anyFailingErrorIncludes(snapshot, ['is not a function', 'prototype']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-implement-bind-constructor-semantics',
      title: 'myBind must handle normal calls and constructor calls differently',
      why: buildProgressAwareWhy(snapshot, 'Bound functions need both argument pre-binding and `new` semantics with prototype preservation.'),
      actions: [
        'Return a wrapper that applies `fn` with bound args plus call-time args.',
        'When wrapper is called with `new`, ignore `thisArg` and use the new instance.',
        'Set wrapper prototype to inherit from `fn.prototype` so `instanceof` works.',
      ],
      confidence: 0.93,
    }),
  },
  {
    ruleId: 'js-implement-bind-default',
    questionId: 'js-implement-bind',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-implement-bind-default',
      title: 'Build myBind as wrapper + prototype bridge',
      why: buildProgressAwareWhy(snapshot, 'Most failures are from missing constructor behavior or partial-arg forwarding.'),
      actions: [
        'Capture `fn`, `thisArg`, and pre-bound args in closure.',
        'Detect constructor calls with `this instanceof boundFn`.',
        'Preserve prototype chain for instances created via `new`.',
      ],
      confidence: 0.76,
    }),
  },
  {
    ruleId: 'js-implement-new-operator-rules',
    questionId: 'js-implement-new',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'correct prototype',
        'runs constructor',
        'override rule',
        'ignores primitive',
        'null return',
      ]) ||
      anyFailingErrorIncludes(snapshot, ['constructor']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-implement-new-operator-rules',
      title: 'myNew is not applying constructor return override rules correctly',
      why: buildProgressAwareWhy(snapshot, '`new` semantics require prototype creation plus conditional override by constructor return value.'),
      actions: [
        'Create instance via `Object.create(Constructor.prototype)`.',
        'Call constructor with `apply(instance, args)`.',
        'Return constructor result only when it is non-null object/function; otherwise return instance.',
      ],
      confidence: 0.93,
    }),
  },
  {
    ruleId: 'js-implement-new-default',
    questionId: 'js-implement-new',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-implement-new-default',
      title: 'Model myNew in three steps: create, apply, resolve return',
      why: buildProgressAwareWhy(snapshot, 'Most mistakes here come from skipping prototype setup or return override checks.'),
      actions: [
        'Wire prototype chain before constructor call.',
        'Invoke constructor with provided args on created instance.',
        'Implement object/function override rule explicitly.',
      ],
      confidence: 0.77,
    }),
  },
  {
    ruleId: 'js-implement-instanceof-prototype-walk',
    questionId: 'js-implement-instanceof',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'prototype chain',
        'works for arrays',
        'works for functions',
        'primitives and null/undefined',
        'object.create(null)',
        'constructor is not a function',
      ]) ||
      anyFailingErrorIncludes(snapshot, ['typeerror', 'prototype']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-implement-instanceof-prototype-walk',
      title: 'myInstanceOf should walk prototype chain with strict guards',
      why: buildProgressAwareWhy(
        snapshot,
        'Correct behavior depends on constructor validation and iterative prototype traversal.',
      ),
      actions: [
        'Throw `TypeError` when constructor argument is not a function.',
        'Return false early for primitives, `null`, and `undefined`.',
        'Walk `Object.getPrototypeOf(obj)` chain and compare against `Constructor.prototype`.',
      ],
      confidence: 0.94,
    }),
  },
  {
    ruleId: 'js-implement-instanceof-default',
    questionId: 'js-implement-instanceof',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-implement-instanceof-default',
      title: 'Implement myInstanceOf with guarded prototype traversal',
      why: buildProgressAwareWhy(snapshot, 'This question is mostly about edge-case guards around standard prototype walking.'),
      actions: [
        'Validate constructor input first.',
        'Handle non-object values as immediate false.',
        'Traverse until `null` prototype or match is found.',
      ],
      confidence: 0.77,
    }),
  },
  {
    ruleId: 'js-delegated-events-1-target-matching',
    questionId: 'js-delegated-events-1',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'matches selector',
        'nested targets',
        'closest',
        'no match',
        'cleanup removes',
        'invalid args',
      ]) ||
      anyFailingErrorIncludes(snapshot, ['closest', 'contains', 'typeerror']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-delegated-events-1-target-matching',
      title: 'delegate should match via closest and cleanup listeners safely',
      why: buildProgressAwareWhy(
        snapshot,
        'This level focuses on target-to-ancestor matching plus deterministic listener teardown.',
      ),
      actions: [
        'Validate `root`, `eventType`, `selector`, and `handler` inputs before registration.',
        'Use `target.closest(selector)` and ensure the match belongs to `root` via containment checks.',
        'Return cleanup function that removes the exact listener reference.',
      ],
      confidence: 0.93,
    }),
  },
  {
    ruleId: 'js-delegated-events-1-default',
    questionId: 'js-delegated-events-1',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-delegated-events-1-default',
      title: 'Model delegate as one listener + selector match bridge',
      why: buildProgressAwareWhy(snapshot, 'Most failures here are from matching wrong nodes or missing cleanup behavior.'),
      actions: [
        'Listen once on root, not on each child.',
        'Resolve match from event target to closest candidate.',
        'Keep teardown idempotent and exact.',
      ],
      confidence: 0.76,
    }),
  },
  {
    ruleId: 'js-delegated-events-2-options-flow',
    questionId: 'js-delegated-events-2',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'capture',
        'once',
        'does not remove',
        'idempotent',
        'invalid args',
      ]) ||
      anyFailingErrorIncludes(snapshot, ['capture', 'once', 'typeerror']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-delegated-events-2-options-flow',
      title: 'delegate options (`capture`/`once`) are not enforced correctly',
      why: buildProgressAwareWhy(snapshot, 'Medium-level delegate requires option-aware add/remove behavior with once semantics.'),
      actions: [
        'Normalize `capture` and pass it to both `addEventListener` and `removeEventListener`.',
        'For `once`, cleanup only after a successful selector match.',
        'Make cleanup idempotent using a removed flag.',
      ],
      confidence: 0.94,
    }),
  },
  {
    ruleId: 'js-delegated-events-2-default',
    questionId: 'js-delegated-events-2',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-delegated-events-2-default',
      title: 'Treat once/capture as listener lifecycle controls',
      why: buildProgressAwareWhy(snapshot, 'Incorrect listener removal timing is the common bug on this level.'),
      actions: [
        'Register one root listener with normalized capture flag.',
        'Invoke handler only for matched elements inside root.',
        'Cleanup only when required by options or explicit teardown.',
      ],
      confidence: 0.77,
    }),
  },
  {
    ruleId: 'js-delegated-events-3-boundary-and-ignore',
    questionId: 'js-delegated-events-3',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'ignore',
        'until',
        'closest match',
        'text node target',
        'stopPropagation',
        'capture option',
        'once removes',
      ]) ||
      anyFailingErrorIncludes(snapshot, ['stoppropagation', 'parentelement', 'typeerror']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-delegated-events-3-boundary-and-ignore',
      title: 'Hard delegate traversal rules (ignore/until/stop/once) are out of sync',
      why: buildProgressAwareWhy(
        snapshot,
        'This level depends on precise ancestor walking order and boundary checks.',
      ),
      actions: [
        'Start from element target, or `parentElement` when target is text node.',
        'Apply `ignore` and `until` during ancestor traversal before choosing match.',
        'Call `stopPropagation` before handler when configured, and cleanup on first successful `once` match.',
      ],
      confidence: 0.95,
    }),
  },
  {
    ruleId: 'js-delegated-events-3-default',
    questionId: 'js-delegated-events-3',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-delegated-events-3-default',
      title: 'Implement hard delegate with explicit traversal helpers',
      why: buildProgressAwareWhy(snapshot, 'Splitting start/match/ignore helpers prevents most logic-order bugs.'),
      actions: [
        'Create helper for resolving traversal start node.',
        'Create helper for closest match under optional boundary.',
        'Create helper for ignore checks before handler invocation.',
      ],
      confidence: 0.78,
    }),
  },
  {
    ruleId: 'js-dom-walk-text-content-1-dfs-order',
    questionId: 'js-dom-walk-text-content-1',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'document order',
        'nullish input',
        'text node root',
        'nodeValue',
        'missing childNodes',
        'deeply nested',
        'nullish children',
      ]) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-dom-walk-text-content-1-dfs-order',
      title: 'collectText should do defensive DFS over text nodes',
      why: buildProgressAwareWhy(snapshot, 'The output is a deterministic depth-first text concatenation task.'),
      actions: [
        'Return empty string for nullish nodes.',
        'For text nodes (`nodeType === 3`), coerce `nodeValue` safely to string or empty.',
        'Traverse `childNodes` in order with defensive checks for missing/null children.',
      ],
      confidence: 0.93,
    }),
  },
  {
    ruleId: 'js-dom-walk-text-content-1-default',
    questionId: 'js-dom-walk-text-content-1',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-dom-walk-text-content-1-default',
      title: 'Build collectText as a guarded tree walk',
      why: buildProgressAwareWhy(snapshot, 'Most misses are null-handling and node-type branching issues.'),
      actions: [
        'Check nullish node first.',
        'Handle text node branch separately.',
        'Iterate children in stable order and concatenate results.',
      ],
      confidence: 0.76,
    }),
  },
  {
    ruleId: 'js-dom-walk-text-content-2-boundary-walk',
    questionId: 'js-dom-walk-text-content-2',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'node itself',
        'closest matching ancestor',
        'boundary',
        'nullish node',
        'case-insensitive',
        'multiple classes',
      ]) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-dom-walk-text-content-2-boundary-walk',
      title: 'closestWithin ancestor matching or boundary stop is incorrect',
      why: buildProgressAwareWhy(snapshot, 'This function must combine simple selector matching with inclusive boundary control.'),
      actions: [
        'Walk from current node upward and test selector at each step.',
        'Stop when boundary is reached (inclusive stop before walking above it).',
        'Support `.class`, `tag`, and `tag.class` with case-insensitive tag checks.',
      ],
      confidence: 0.92,
    }),
  },
  {
    ruleId: 'js-dom-walk-text-content-2-default',
    questionId: 'js-dom-walk-text-content-2',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-dom-walk-text-content-2-default',
      title: 'Split closestWithin into match helper + ancestor loop',
      why: buildProgressAwareWhy(snapshot, 'Selector parsing and boundary logic are easier to debug when separated.'),
      actions: [
        'Implement a small `matchesSimple` helper first.',
        'Then run ancestor loop with boundary check.',
        'Return first matching node or null.',
      ],
      confidence: 0.75,
    }),
  },
  {
    ruleId: 'js-dom-walk-text-content-3-selector-chain',
    questionId: 'js-dom-walk-text-content-3',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'throws on invalid args',
        'matches tag selector',
        'matches class selector',
        'matches id selector',
        'tag.class',
        'descendant selector chains',
        'document order',
        'extra whitespace',
      ]) ||
      anyFailingErrorIncludes(snapshot, ['selector', 'typeerror']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-dom-walk-text-content-3-selector-chain',
      title: 'queryAll selector parsing or descendant-chain matching is incomplete',
      why: buildProgressAwareWhy(snapshot, 'This level requires robust step parsing plus ancestor-aware chain matching.'),
      actions: [
        'Validate root/selector and normalize selector whitespace.',
        'Parse selector into simple steps (`tag`, `.class`, `#id`, `tag.class`).',
        'Collect matches in document order by checking each candidate against full ancestor chain.',
      ],
      confidence: 0.94,
    }),
  },
  {
    ruleId: 'js-dom-walk-text-content-3-default',
    questionId: 'js-dom-walk-text-content-3',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-dom-walk-text-content-3-default',
      title: 'Treat queryAll as parse + walk + chain-match pipeline',
      why: buildProgressAwareWhy(snapshot, 'Hard-selector bugs usually come from mixing parsing and traversal in one block.'),
      actions: [
        'Build parser for selector steps first.',
        'Traverse elements only (skip text nodes).',
        'Evaluate descendant chain from last step backwards.',
      ],
      confidence: 0.77,
    }),
  },
  {
    ruleId: 'js-selector-polyfill-matches-1-token-rules',
    questionId: 'js-selector-polyfill-matches-1',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, ['matches tag', 'matches id', 'matches class', 'tag.class', 'defensive']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-selector-polyfill-matches-1-token-rules',
      title: 'matchesSimple token parsing is incorrect for id/class/tag cases',
      why: buildProgressAwareWhy(snapshot, 'The matcher should be deterministic for single-token selectors and defensive on invalid input.'),
      actions: [
        'Return false for invalid node or empty selector.',
        'Handle `#id` and `.class` tokens with empty-token guards.',
        'Handle `tag` and `tag.class` with case-insensitive tag comparison.',
      ],
      confidence: 0.92,
    }),
  },
  {
    ruleId: 'js-selector-polyfill-matches-1-default',
    questionId: 'js-selector-polyfill-matches-1',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-selector-polyfill-matches-1-default',
      title: 'Implement matchesSimple with explicit token branches',
      why: buildProgressAwareWhy(snapshot, 'Most failures are from missing branch guards for empty id/class tokens.'),
      actions: [
        'Trim selector once.',
        'Branch by first character (`#`, `.`, or tag path).',
        'Keep default return path false for unsupported forms.',
      ],
      confidence: 0.75,
    }),
  },
  {
    ruleId: 'js-recover-bst-swapped-nodes-inorder-anomalies',
    questionId: 'js-recover-bst-swapped-nodes',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'non-adjacent swapped',
        'adjacent swapped',
        'swap involving root',
        'null or single-node',
      ]) ||
      anyFailingErrorIncludes(snapshot, ['inorder', 'undefined']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-recover-bst-swapped-nodes-inorder-anomalies',
      title: 'recoverBST is not tracking inversion nodes correctly',
      why: buildProgressAwareWhy(snapshot, 'Correct fix needs inorder anomaly detection with first/second misplaced pointers.'),
      actions: [
        'Run inorder traversal and compare each node with previous node.',
        'Store first inversion predecessor as `first`, and current node as `second` on each inversion.',
        'Swap `first.val` and `second.val` once traversal completes.',
      ],
      confidence: 0.94,
    }),
  },
  {
    ruleId: 'js-recover-bst-swapped-nodes-default',
    questionId: 'js-recover-bst-swapped-nodes',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-recover-bst-swapped-nodes-default',
      title: 'Use inorder monotonicity to locate swapped nodes',
      why: buildProgressAwareWhy(snapshot, 'This problem is primarily about inversion detection, not rebuilding the tree.'),
      actions: [
        'Track previous node during inorder traversal.',
        'Capture misplaced nodes from one or two inversions.',
        'Swap values and return original root reference.',
      ],
      confidence: 0.78,
    }),
  },
  {
    ruleId: 'js-selector-polyfill-closest-2-ancestor-resolution',
    questionId: 'js-selector-polyfill-closest-2',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'returns itself',
        'closest matching ancestor',
        'id selector',
        'case-insensitive',
        'multiple classes',
        'invalid inputs',
      ]) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-selector-polyfill-closest-2-ancestor-resolution',
      title: 'closestSimple should climb ancestors with robust simple-selector matching',
      why: buildProgressAwareWhy(snapshot, 'The function should return nearest match (including self) or null for invalid paths.'),
      actions: [
        'Guard nullish node or empty selector early with null.',
        'Reuse simple matcher for `#id`, `.class`, `tag`, `tag.class`.',
        'Walk `parentNode` upward and return first match.',
      ],
      confidence: 0.92,
    }),
  },
  {
    ruleId: 'js-selector-polyfill-closest-2-default',
    questionId: 'js-selector-polyfill-closest-2',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-selector-polyfill-closest-2-default',
      title: 'Implement closestSimple as loop + matchesSimple helper',
      why: buildProgressAwareWhy(snapshot, 'Most misses come from selector guards or ancestor loop termination.'),
      actions: [
        'Normalize selector and reject empty tokens.',
        'Check current node before moving to parent.',
        'Return null when no match exists in ancestor chain.',
      ],
      confidence: 0.75,
    }),
  },
  {
    ruleId: 'js-selector-polyfill-qsa-3-validated-dfs-chain',
    questionId: 'js-selector-polyfill-qsa-3',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'invalid args',
        'unsupported selector syntax',
        'includes root',
        'class and #id',
        'tag.class',
        'descendant chains',
        'document order',
        'extra whitespace',
      ]) ||
      anyFailingErrorIncludes(snapshot, ['unsupported selector', 'invalid selector', 'typeerror']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-selector-polyfill-qsa-3-validated-dfs-chain',
      title: 'queryAllSimple needs stronger selector validation and chain matching',
      why: buildProgressAwareWhy(snapshot, 'Hard polyfill requires strict unsupported-syntax rejection plus ordered DFS matching.'),
      actions: [
        'Validate selector and reject unsupported syntax (`>`, `:`, `[]`, etc.).',
        'Parse steps and evaluate descendant chains against ancestor context.',
        'Traverse elements in document order and include root when it matches.',
      ],
      confidence: 0.95,
    }),
  },
  {
    ruleId: 'js-selector-polyfill-qsa-3-default',
    questionId: 'js-selector-polyfill-qsa-3',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-selector-polyfill-qsa-3-default',
      title: 'Build queryAllSimple as validated parse + DFS matcher',
      why: buildProgressAwareWhy(snapshot, 'The stable approach is validating syntax first, then matching each element against parsed steps.'),
      actions: [
        'Reject invalid root/selector inputs early.',
        'Parse selector into simple validated steps.',
        'DFS all element nodes and keep matches in traversal order.',
      ],
      confidence: 0.78,
    }),
  },
  {
    ruleId: 'js-get-by-path-1-fallback-semantics',
    questionId: 'js-get-by-path-1',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'dot path',
        'array path',
        'numeric segment',
        'fallback',
        'empty path',
        'nullish intermediates',
        'present-but-undefined',
      ]) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-get-by-path-1-fallback-semantics',
      title: 'getByPath traversal or fallback behavior is inconsistent',
      why: buildProgressAwareWhy(snapshot, 'This helper must distinguish missing keys from existing keys whose value is undefined.'),
      actions: [
        'Normalize path into segments and short-circuit empty path by returning input object.',
        'At each segment, return fallback only when key is missing or traversal hits nullish intermediate.',
        'If key exists and value is `undefined`, return `undefined` (do not replace with fallback).',
      ],
      confidence: 0.93,
    }),
  },
  {
    ruleId: 'js-get-by-path-1-default',
    questionId: 'js-get-by-path-1',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-get-by-path-1-default',
      title: 'Implement getByPath as guarded segment traversal',
      why: buildProgressAwareWhy(snapshot, 'Most failures are from path normalization and fallback edge cases.'),
      actions: [
        'Convert string/array path into consistent segments.',
        'Walk one segment at a time with nullish checks.',
        'Use fallback only for truly missing traversal paths.',
      ],
      confidence: 0.76,
    }),
  },
  {
    ruleId: 'js-set-by-path-2-immutable-container-build',
    questionId: 'js-set-by-path-2',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'immutably',
        'array index path',
        'creates missing containers',
        'empty path replaces root',
        'primitive intermediates',
        'array path input',
      ]) ||
      anyFailingErrorIncludes(snapshot, ['typeerror']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-set-by-path-2-immutable-container-build',
      title: 'setByPath must clone on write and create containers by next segment',
      why: buildProgressAwareWhy(snapshot, 'This helper requires immutable updates and dynamic object/array container creation.'),
      actions: [
        'Return replacement value directly for empty path.',
        'Clone each visited object/array before writing to avoid mutating original input.',
        'When path segment is missing, create array for numeric next segment, otherwise object.',
      ],
      confidence: 0.94,
    }),
  },
  {
    ruleId: 'js-set-by-path-2-default',
    questionId: 'js-set-by-path-2',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-set-by-path-2-default',
      title: 'Split setByPath into path parse + recursive immutable set',
      why: buildProgressAwareWhy(snapshot, 'Most bugs here come from accidental mutation or wrong container type decisions.'),
      actions: [
        'Parse path once and recurse by index.',
        'Shallow-clone current container before child assignment.',
        'Rebuild only touched branches and return new root.',
      ],
      confidence: 0.77,
    }),
  },
  {
    ruleId: 'js-deep-clone-cycles-3-reference-graph',
    questionId: 'js-deep-clone-cycles-3',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'simple objects deeply',
        'circular references',
        'shared references',
        'arrays with cycles',
        'primitives as-is',
      ]) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-deep-clone-cycles-3-reference-graph',
      title: 'deepClone is not preserving cycle/shared-reference topology',
      why: buildProgressAwareWhy(snapshot, 'Correct deep cloning requires memoizing source->clone mapping during traversal.'),
      actions: [
        'Use `Map`/`WeakMap` to remember already-cloned objects.',
        'Return memoized clone immediately when revisiting a node to preserve cycles.',
        'Clone arrays/objects recursively while leaving primitives unchanged.',
      ],
      confidence: 0.95,
    }),
  },
  {
    ruleId: 'js-deep-clone-cycles-3-default',
    questionId: 'js-deep-clone-cycles-3',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-deep-clone-cycles-3-default',
      title: 'Treat deepClone as graph clone, not plain tree clone',
      why: buildProgressAwareWhy(snapshot, 'Without memoization, cycles recurse forever and shared refs duplicate incorrectly.'),
      actions: [
        'Guard primitive values first.',
        'Memoize clone before recursing into children.',
        'Reuse memoized nodes for repeated references.',
      ],
      confidence: 0.78,
    }),
  },
  {
    ruleId: 'js-querystring-parse-1-normalization',
    questionId: 'js-querystring-parse-1',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'basic key-value',
        'treats + as space',
        'last value when keys repeat',
        'missing =',
        'empty keys',
        'malformed encoding',
        'empty input',
      ]) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-querystring-parse-1-normalization',
      title: 'parseQueryString decoding or overwrite semantics are wrong',
      why: buildProgressAwareWhy(snapshot, 'This parser should safely decode and keep only the last value for repeated keys.'),
      actions: [
        'Strip optional leading `?`, split by `&`, and skip empty parts.',
        'Treat no `=` as empty-string value and ignore empty decoded keys.',
        'Decode `+` as space, use safe decode fallback, and overwrite repeated keys with latest value.',
      ],
      confidence: 0.93,
    }),
  },
  {
    ruleId: 'js-querystring-parse-1-default',
    questionId: 'js-querystring-parse-1',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-querystring-parse-1-default',
      title: 'Implement parseQueryString as safe split/decode/assign',
      why: buildProgressAwareWhy(snapshot, 'Common misses are malformed decode handling and repeated-key semantics.'),
      actions: [
        'Normalize input and early-return `{}` on empty query.',
        'Safely decode key/value tokens.',
        'Assign key to latest value.',
      ],
      confidence: 0.76,
    }),
  },
  {
    ruleId: 'js-querystring-stringify-2-order-and-filtering',
    questionId: 'js-querystring-stringify-2',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'stable key ordering',
        'encodes keys and values',
        'skips undefined',
        'includes null',
        'repeats key for array values',
        'booleans',
        'empty object',
        'throws on non-object input',
      ]) ||
      anyFailingErrorIncludes(snapshot, ['typeerror']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-querystring-stringify-2-order-and-filtering',
      title: 'stringifyQueryString ordering, filtering, or encoding is off',
      why: buildProgressAwareWhy(snapshot, 'Stringifier must sort keys, encode values, and handle null/undefined/array rules precisely.'),
      actions: [
        'Validate plain-object input and throw on invalid root types.',
        'Sort keys, skip `undefined`, convert `null` to empty string.',
        'For array values, emit repeated `key=value` pairs in array order.',
      ],
      confidence: 0.94,
    }),
  },
  {
    ruleId: 'js-querystring-stringify-2-default',
    questionId: 'js-querystring-stringify-2',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-querystring-stringify-2-default',
      title: 'Build stringifyQueryString via sorted key iteration',
      why: buildProgressAwareWhy(snapshot, 'Most failures are from edge handling (`undefined`, arrays, encoding).'),
      actions: [
        'Sort object keys first for deterministic output.',
        'Normalize each value to string form with null/undefined rules.',
        'Join emitted pairs with `&`.',
      ],
      confidence: 0.77,
    }),
  },
  {
    ruleId: 'js-querystring-parse-3-nested-path-assign',
    questionId: 'js-querystring-parse-3',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'repeated keys into arrays',
        'bracket arrays',
        'nested objects',
        'nested arrays',
        'mixes forms',
        'decodes + and percent',
        'missing =',
        'empty input',
      ]) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-querystring-parse-3-nested-path-assign',
      title: 'parseQueryStringAdvanced path parsing/assignment is incomplete',
      why: buildProgressAwareWhy(snapshot, 'Advanced parsing needs bracket-path tokenization and consistent array/object merge behavior.'),
      actions: [
        'Parse keys like `a[b][]` into path segments.',
        'Create next container type from upcoming segment (`[]` => array, otherwise object).',
        'On repeated terminal keys, convert scalar to array and append subsequent values.',
      ],
      confidence: 0.95,
    }),
  },
  {
    ruleId: 'js-querystring-parse-3-default',
    questionId: 'js-querystring-parse-3',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-querystring-parse-3-default',
      title: 'Treat advanced query parse as decode + key-path assignment',
      why: buildProgressAwareWhy(snapshot, 'Most issues come from nested path container decisions and repeated-key merging.'),
      actions: [
        'Decode token safely first.',
        'Build path array from bracket notation.',
        'Assign value through path with merge-on-repeat semantics.',
      ],
      confidence: 0.78,
    }),
  },
  {
    ruleId: 'js-add-strings-carry-loop',
    questionId: 'js-add-strings',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'small numbers',
        'carry across digits',
        'different lengths',
        'very large numbers',
      ]) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-add-strings-carry-loop',
      title: 'addStrings digit/carry loop is not handling all positions',
      why: buildProgressAwareWhy(snapshot, 'String addition requires right-to-left traversal with persistent carry.'),
      actions: [
        'Iterate from both string ends while either index or carry remains.',
        'Convert char digits using charCode/subtraction and sum with carry.',
        'Append `sum % 10`, update carry with integer division, then reverse result.',
      ],
      confidence: 0.92,
    }),
  },
  {
    ruleId: 'js-add-strings-default',
    questionId: 'js-add-strings',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-add-strings-default',
      title: 'Implement addStrings as manual column addition',
      why: buildProgressAwareWhy(snapshot, 'Most bugs here are missed carry or stop-condition errors.'),
      actions: [
        'Walk both strings from right to left.',
        'Track carry every iteration.',
        'Reverse accumulated digits at the end.',
      ],
      confidence: 0.75,
    }),
  },
  {
    ruleId: 'js-lodash-get-path-resolution',
    questionId: 'js-lodash-get',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'reads nested values',
        'bracket notation',
        'default when missing',
        'default for null root',
      ]) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-lodash-get-path-resolution',
      title: 'get path parsing or default-return semantics are incorrect',
      why: buildProgressAwareWhy(snapshot, 'lodash.get-style behavior depends on robust segment parsing and null-safe traversal.'),
      actions: [
        'Parse dot/bracket syntax into segments before traversal.',
        'Return default when intermediate is nullish or key is missing.',
        'If final resolved value is `undefined`, return default value.',
      ],
      confidence: 0.92,
    }),
  },
  {
    ruleId: 'js-lodash-get-default',
    questionId: 'js-lodash-get',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-lodash-get-default',
      title: 'Implement get as segment parse + null-safe walk',
      why: buildProgressAwareWhy(snapshot, 'Most misses come from bracket parsing and undefined/default handling.'),
      actions: [
        'Tokenize path using regex or path-array input.',
        'Traverse with nullish guards at each step.',
        'Return default for missing/undefined results.',
      ],
      confidence: 0.76,
    }),
  },
  {
    ruleId: 'js-three-sum-two-pointer-dedupe',
    questionId: 'js-three-sum',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, ['unique triplets', 'all zeros', 'empty when no triplets']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-three-sum-two-pointer-dedupe',
      title: 'threeSum duplicate-skipping or pointer movement is wrong',
      why: buildProgressAwareWhy(snapshot, 'Correct 3Sum uses sorted array with two-pointer sweep and duplicate suppression.'),
      actions: [
        'Sort input copy first; iterate base index `i` while skipping duplicate bases.',
        'Use `l/r` pointers and adjust based on sum comparison to zero.',
        'After finding triplet, skip duplicate `l` and `r` values before continuing.',
      ],
      confidence: 0.93,
    }),
  },
  {
    ruleId: 'js-three-sum-default',
    questionId: 'js-three-sum',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-three-sum-default',
      title: 'Use sorted + two-pointer strategy for 3Sum',
      why: buildProgressAwareWhy(snapshot, 'Most failures are from duplicate handling, not the base sum check itself.'),
      actions: [
        'Sort once and loop base index.',
        'Search complement with inward pointers.',
        'Deduplicate emitted triplets.',
      ],
      confidence: 0.76,
    }),
  },
  {
    ruleId: 'js-merge-sorted-arrays-two-pointer',
    questionId: 'js-merge-sorted-arrays',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, ['merges two sorted arrays', 'empty arrays', 'duplicates']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-merge-sorted-arrays-two-pointer',
      title: 'mergeSortedArrays pointer merge logic is incomplete',
      why: buildProgressAwareWhy(snapshot, 'Merge should consume both inputs in ascending order and append leftovers.'),
      actions: [
        'Maintain two indices (`i`, `j`) and compare current elements.',
        'Push smaller/equal element then advance corresponding pointer.',
        'After loop, append remaining tail from whichever array is not exhausted.',
      ],
      confidence: 0.91,
    }),
  },
  {
    ruleId: 'js-merge-sorted-arrays-default',
    questionId: 'js-merge-sorted-arrays',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-merge-sorted-arrays-default',
      title: 'Implement mergeSortedArrays with classic merge step',
      why: buildProgressAwareWhy(snapshot, 'Most bugs are off-by-one pointer updates or missed tail appends.'),
      actions: [
        'Run merge loop while both arrays have remaining items.',
        'Handle equal values deterministically.',
        'Append remaining values from the unfinished array.',
      ],
      confidence: 0.75,
    }),
  },
  {
    ruleId: 'js-valid-anagram-frequency-check',
    questionId: 'js-valid-anagram',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'detects anagrams',
        'detects non-anagrams',
        'empty strings',
        'lengths differ',
        'frequencies differ',
        'repeats',
      ]) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-valid-anagram-frequency-check',
      title: 'Anagram frequency counting is incorrect',
      why: buildProgressAwareWhy(snapshot, 'Anagram checks require equal lengths and exact character count matching.'),
      actions: [
        'Return false immediately when lengths differ.',
        'Build a frequency map from first string and decrement with second.',
        'Fail when decrement hits missing/negative count and ensure all counts balance.',
      ],
      confidence: 0.92,
    }),
  },
  {
    ruleId: 'js-valid-anagram-default',
    questionId: 'js-valid-anagram',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-valid-anagram-default',
      title: 'Use frequency-map comparison for anagram validation',
      why: buildProgressAwareWhy(snapshot, 'Most misses are length guard or repeated-character count mismatches.'),
      actions: [
        'Guard unequal lengths first.',
        'Count characters in first input.',
        'Consume counts using second input and validate zeroed map.',
      ],
      confidence: 0.75,
    }),
  },
  {
    ruleId: 'js-median-of-array-sort-midpoint',
    questionId: 'js-median-of-array',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'odd length',
        'even length',
        'negatives',
        'duplicates',
        'empty array returns nan',
        'does not mutate original input',
      ]) ||
      anyFailingErrorIncludes(snapshot, ['nan']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-median-of-array-sort-midpoint',
      title: 'Median calculation misses midpoint or empty-array behavior',
      why: buildProgressAwareWhy(snapshot, 'Median should be computed from sorted copy with separate odd/even handling.'),
      actions: [
        'Sort a cloned array numerically (`a - b`) to avoid mutating input.',
        'Return middle element for odd length; average the two middle values for even length.',
        'Return `NaN` for empty input.',
      ],
      confidence: 0.93,
    }),
  },
  {
    ruleId: 'js-median-of-array-default',
    questionId: 'js-median-of-array',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-median-of-array-default',
      title: 'Implement median via sorted copy and index math',
      why: buildProgressAwareWhy(snapshot, 'Most failures are from in-place sort side effects or wrong even-length averaging.'),
      actions: [
        'Clone before sorting.',
        'Compute midpoint using floor(length / 2).',
        'Branch odd/even length explicitly.',
      ],
      confidence: 0.75,
    }),
  },
  {
    ruleId: 'js-dom-renderer-node-normalization',
    questionId: 'js-dom-renderer',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'creates elements with props and nested children',
        'handles string children',
        'keeps numeric children and skips null',
        'returns a text node for null input',
      ]) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-dom-renderer-node-normalization',
      title: 'render node normalization is inconsistent',
      why: buildProgressAwareWhy(snapshot, 'Renderer should normalize null/primitive/object nodes with stable prop and child handling.'),
      actions: [
        'Return empty text node for nullish input; text node for string/number input.',
        'Map `className` prop to `class` attribute and skip nullish prop values.',
        'Render children recursively, preserving numeric children and skipping nulls.',
      ],
      confidence: 0.93,
    }),
  },
  {
    ruleId: 'js-dom-renderer-default',
    questionId: 'js-dom-renderer',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-dom-renderer-default',
      title: 'Implement render as recursive node transformer',
      why: buildProgressAwareWhy(snapshot, 'Most issues come from child normalization and prop mapping edge cases.'),
      actions: [
        'Handle primitive/null branches before element branch.',
        'Create element and set normalized attributes.',
        'Recurse through children in order.',
      ],
      confidence: 0.76,
    }),
  },
  {
    ruleId: 'js-timer-manager-registry-lifecycle',
    questionId: 'js-timer-manager',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'runs scheduled callback',
        'clears a specific timer',
        'clears all timers',
        'returns unique ids',
        'ignores unknown clear',
      ]) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-timer-manager-registry-lifecycle',
      title: 'Timer registry bookkeeping is incorrect',
      why: buildProgressAwareWhy(snapshot, 'Custom timer manager needs stable id mapping and consistent clear semantics.'),
      actions: [
        'Assign unique ids and map each id to native timeout handle.',
        'On callback fire, delete id from registry before/after invoking callback.',
        'Implement clear-one and clear-all as no-throw operations for unknown ids.',
      ],
      confidence: 0.92,
    }),
  },
  {
    ruleId: 'js-timer-manager-default',
    questionId: 'js-timer-manager',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-timer-manager-default',
      title: 'Treat timer manager as id-to-handle map',
      why: buildProgressAwareWhy(snapshot, 'Most bugs are stale entries and inconsistent clear behavior.'),
      actions: [
        'Track handles in a map keyed by custom id.',
        'Delete entries on clear and completion.',
        'Use iteration to clear all active handles.',
      ],
      confidence: 0.75,
    }),
  },
  {
    ruleId: 'js-timer-manager-and-dom-renderer-combo',
    questionId: 'js-timer-manager-and-dom-renderer',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'render builds nested dom',
        'className',
        'preserves numbers',
        'skips null children',
        'clearalltimeouts is callable',
      ]) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-timer-manager-and-dom-renderer-combo',
      title: 'Combined timer/dom utility misses render normalization or clear-all contract',
      why: buildProgressAwareWhy(snapshot, 'This mixed exercise expects a safe `clearAllTimeouts` plus deterministic render behavior.'),
      actions: [
        'Keep `clearAllTimeouts` callable and side-effect-safe even with empty registry.',
        'Map `className` to `class` and preserve numeric child text.',
        'Skip null children while rendering nested structures recursively.',
      ],
      confidence: 0.91,
    }),
  },
  {
    ruleId: 'js-timer-manager-and-dom-renderer-default',
    questionId: 'js-timer-manager-and-dom-renderer',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-timer-manager-and-dom-renderer-default',
      title: 'Split responsibilities: timeout cleanup + recursive render',
      why: buildProgressAwareWhy(snapshot, 'This task is easier when timer and DOM logic stay clearly separated.'),
      actions: [
        'Implement timer cleanup helper independently.',
        'Implement render with primitive/null/object branches.',
        'Verify attribute and children normalization.',
      ],
      confidence: 0.74,
    }),
  },
  {
    ruleId: 'js-dom-find-node-traversal',
    questionId: 'js-dom-find-node',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'finds a node by predicate',
        'returns null when not found',
        'returns root when it matches',
        'finds deep nested node',
      ]) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-dom-find-node-traversal',
      title: 'findNode traversal or base cases are wrong',
      why: buildProgressAwareWhy(snapshot, 'Node search must check root first, then traverse descendants deterministically.'),
      actions: [
        'Return null on null root.',
        'Check predicate on current node before traversing children.',
        'Traverse children recursively/iteratively and return first match.',
      ],
      confidence: 0.9,
    }),
  },
  {
    ruleId: 'js-dom-find-node-default',
    questionId: 'js-dom-find-node',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-dom-find-node-default',
      title: 'Implement findNode as pre-order search',
      why: buildProgressAwareWhy(snapshot, 'Most failures are missed root check or wrong child traversal order.'),
      actions: [
        'Guard null root.',
        'Evaluate predicate at current node.',
        'Search children until first match.',
      ],
      confidence: 0.74,
    }),
  },
  {
    ruleId: 'js-dom-twin-node-structure-alignment',
    questionId: 'js-dom-twin-node',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'corresponding node in twin tree',
        'target is root',
        'missing target',
        'missing roots',
      ]) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-dom-twin-node-structure-alignment',
      title: 'findTwin is not preserving positional alignment across twin trees',
      why: buildProgressAwareWhy(snapshot, 'Twin-node lookup requires matching child index traversal between two isomorphic trees.'),
      actions: [
        'Return null when either root is missing.',
        'If current node in tree A equals target, return current node in tree B.',
        'Traverse both children arrays by index and recurse on aligned pairs.',
      ],
      confidence: 0.91,
    }),
  },
  {
    ruleId: 'js-dom-twin-node-default',
    questionId: 'js-dom-twin-node',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-dom-twin-node-default',
      title: 'Traverse twin trees in lockstep',
      why: buildProgressAwareWhy(snapshot, 'Most misses come from traversing one tree without aligned index mapping.'),
      actions: [
        'Keep recursion parameters as paired nodes from A/B trees.',
        'Check identity match on A-side node.',
        'Recurse through aligned children indices.',
      ],
      confidence: 0.74,
    }),
  },
  {
    ruleId: 'js-stack-queue-implementation-semantics',
    questionId: 'js-stack-queue-implementation',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'push/pop/peek/size',
        'empty peek',
        'enqueue/dequeue/peek/size',
        'empty dequeue',
        'queue remains correct after many dequeues',
      ]) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-stack-queue-implementation-semantics',
      title: 'Stack/Queue operation semantics are inconsistent',
      why: buildProgressAwareWhy(snapshot, 'Implementation must preserve LIFO/FIFO behavior and empty-state contracts.'),
      actions: [
        'Stack: `push`, `pop`, `peek`, `size` with `undefined` on empty pop/peek.',
        'Queue: dequeue from head in FIFO order and keep accurate size.',
        'Maintain queue correctness after many dequeues (head offset/compaction edge).',
      ],
      confidence: 0.92,
    }),
  },
  {
    ruleId: 'js-stack-queue-implementation-default',
    questionId: 'js-stack-queue-implementation',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-stack-queue-implementation-default',
      title: 'Separate Stack and Queue invariants clearly',
      why: buildProgressAwareWhy(snapshot, 'Most bugs are mixed LIFO/FIFO behavior or incorrect empty handling.'),
      actions: [
        'Implement stack with tail operations.',
        'Implement queue with head pointer for efficient dequeues.',
        'Keep `peek`/`size` consistent with current internal state.',
      ],
      confidence: 0.75,
    }),
  },
  {
    ruleId: 'js-palindrome-check-normalization',
    questionId: 'js-palindrome-check',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'simple palindromes',
        'ignores non-alphanumerics',
        'handles digits',
        'non-palindrome',
        'empty and symbol-only strings',
      ]) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-palindrome-check-normalization',
      title: 'Palindrome normalization or pointer comparison is incorrect',
      why: buildProgressAwareWhy(snapshot, 'This check must normalize case and non-alphanumerics before two-pointer comparison.'),
      actions: [
        'Lowercase and strip non-alphanumeric characters first.',
        'Use two pointers from both ends and compare until they cross.',
        'Treat empty normalized string as palindrome.',
      ],
      confidence: 0.92,
    }),
  },
  {
    ruleId: 'js-palindrome-check-default',
    questionId: 'js-palindrome-check',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-palindrome-check-default',
      title: 'Implement palindrome check as normalize + two-pointer loop',
      why: buildProgressAwareWhy(snapshot, 'Most misses are from skipping normalization steps.'),
      actions: [
        'Normalize to lowercase alphanumeric string.',
        'Compare mirrored characters with two indices.',
        'Return false on first mismatch, true otherwise.',
      ],
      confidence: 0.75,
    }),
  },
  {
    ruleId: 'js-maze-path-bfs-reachability',
    questionId: 'js-maze-path',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'finds path in grid',
        'returns false when blocked',
        'start equals end',
        'start or end is a wall',
      ]) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-maze-path-bfs-reachability',
      title: 'Maze reachability traversal misses boundary or wall checks',
      why: buildProgressAwareWhy(snapshot, 'Path existence requires visited tracking with directional exploration on valid cells.'),
      actions: [
        'Reject when start/end are wall cells.',
        'Use BFS/DFS with bounds checks and visited matrix.',
        'Return true on reaching end coordinate; false when frontier exhausts.',
      ],
      confidence: 0.93,
    }),
  },
  {
    ruleId: 'js-maze-path-default',
    questionId: 'js-maze-path',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-maze-path-default',
      title: 'Treat maze path as grid graph traversal',
      why: buildProgressAwareWhy(snapshot, 'Most errors are from revisiting cells or missing boundary guards.'),
      actions: [
        'Initialize visited state from start.',
        'Explore four directions with bounds/wall checks.',
        'Stop early when end is reached.',
      ],
      confidence: 0.76,
    }),
  },
  {
    ruleId: 'js-take-latest-abort-sequencing',
    questionId: 'js-take-latest',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'latest call',
        'propagates errors',
        'aborts the previous controller',
      ]) ||
      anyFailingErrorIncludes(snapshot, ['aborterror', 'stale', 'cancelled']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-take-latest-abort-sequencing',
      title: 'takeLatest cancellation sequencing is incorrect',
      why: buildProgressAwareWhy(snapshot, 'Only the most recent invocation should resolve; older ones must be aborted/rejected.'),
      actions: [
        'Track active call id and `AbortController` for the latest invocation.',
        'Abort previous controller before starting a new call.',
        'Reject stale results/errors when call id no longer matches latest id.',
      ],
      confidence: 0.94,
    }),
  },
  {
    ruleId: 'js-take-latest-default',
    questionId: 'js-take-latest',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-take-latest-default',
      title: 'Implement takeLatest as id-gated abortable wrapper',
      why: buildProgressAwareWhy(snapshot, 'Most failures are from stale promise completion winning over the latest call.'),
      actions: [
        'Increment a call sequence id per invocation.',
        'Abort previous in-flight request.',
        'Resolve/reject only if call id is still current.',
      ],
      confidence: 0.77,
    }),
  },
  {
    ruleId: 'js-promise-any-aggregate-rejection',
    questionId: 'js-promise-any',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'first fulfillment',
        'non-promise values',
        'aggregateerror',
        'empty input',
        'not an array',
      ]) ||
      anyFailingErrorIncludes(snapshot, ['aggregateerror', 'typeerror']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-promise-any-aggregate-rejection',
      title: 'promiseAny fulfillment/rejection contract is incomplete',
      why: buildProgressAwareWhy(snapshot, 'Promise.any should resolve on first success and aggregate all rejection reasons otherwise.'),
      actions: [
        'Validate input array and reject with `TypeError` for invalid input.',
        'Resolve immediately on first fulfilled value (including plain values via `Promise.resolve`).',
        'Collect rejection reasons by index and reject with `AggregateError` when all reject.',
      ],
      confidence: 0.94,
    }),
  },
  {
    ruleId: 'js-promise-any-default',
    questionId: 'js-promise-any',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-promise-any-default',
      title: 'Model promiseAny as first-success wins',
      why: buildProgressAwareWhy(snapshot, 'Most bugs are around all-rejected and empty-array edge handling.'),
      actions: [
        'Normalize each item with `Promise.resolve`.',
        'Short-circuit on first fulfillment.',
        'Count rejections and aggregate errors on full failure.',
      ],
      confidence: 0.77,
    }),
  },
  {
    ruleId: 'js-poll-until-timeout-abort-loop',
    questionId: 'js-poll-until',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'check becomes truthy',
        'async checks',
        'timeout',
        'aborted',
      ]) ||
      anyFailingErrorIncludes(snapshot, ['timeout', 'aborterror']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-poll-until-timeout-abort-loop',
      title: 'pollUntil retry/timeout/abort flow is inconsistent',
      why: buildProgressAwareWhy(snapshot, 'Polling must schedule retries until truthy result, timeout, or abort.'),
      actions: [
        'Run `check` and resolve immediately when result is truthy.',
        'Schedule next attempt with interval only when still pending.',
        'Handle timeout and abort with cleanup of timer/listener and deterministic rejection.',
      ],
      confidence: 0.93,
    }),
  },
  {
    ruleId: 'js-poll-until-default',
    questionId: 'js-poll-until',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-poll-until-default',
      title: 'Split pollUntil into attempt loop + cancellation guards',
      why: buildProgressAwareWhy(snapshot, 'Most misses are timer cleanup and abort listener lifecycle.'),
      actions: [
        'Track done-state to avoid duplicate settle.',
        'Reuse one attempt function for sync/async checks.',
        'Clean timers and listeners on every terminal path.',
      ],
      confidence: 0.76,
    }),
  },
  {
    ruleId: 'js-fetch-json-timeout-signal-bridge',
    questionId: 'js-fetch-json-timeout',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'resolves json',
        'non-ok status',
        'aborts on timeout',
        'external abort signal',
      ]) ||
      anyFailingErrorIncludes(snapshot, ['http', 'aborterror', 'timeout']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-fetch-json-timeout-signal-bridge',
      title: 'fetchJson timeout/abort bridging is incorrect',
      why: buildProgressAwareWhy(snapshot, 'This helper should combine timeout controller with external signal and HTTP status checks.'),
      actions: [
        'Create internal `AbortController` and bridge external abort signal to it.',
        'Set timeout that aborts with timeout-specific abort reason when configured.',
        'Throw on non-OK responses and return parsed JSON for successful responses.',
      ],
      confidence: 0.94,
    }),
  },
  {
    ruleId: 'js-fetch-json-timeout-default',
    questionId: 'js-fetch-json-timeout',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-fetch-json-timeout-default',
      title: 'Implement fetchJson as abort-aware fetch wrapper',
      why: buildProgressAwareWhy(snapshot, 'Most failures are from not cleaning timeout/signal listeners correctly.'),
      actions: [
        'Resolve fetcher from options/global fetch.',
        'Attach timeout and external abort to one controller signal.',
        'Cleanup timeout/listeners in `finally`.',
      ],
      confidence: 0.77,
    }),
  },
  {
    ruleId: 'js-stream-to-text-decoder-flow',
    questionId: 'js-stream-to-text',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'concatenates chunks',
        'multibyte characters',
        'rejects on abort',
        'invalid stream input',
      ]) ||
      anyFailingErrorIncludes(snapshot, ['readablestream', 'aborterror', 'typederror', 'typeerror']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-stream-to-text-decoder-flow',
      title: 'streamToText reader/decoder/abort handling is incomplete',
      why: buildProgressAwareWhy(snapshot, 'Streaming decode must preserve multibyte boundaries and honor abort/invalid-input guards.'),
      actions: [
        'Validate stream has `getReader()` and throw `TypeError` otherwise.',
        'Decode each chunk with `TextDecoder` in streaming mode and flush once at end.',
        'Handle abort by cancelling reader and rejecting with `AbortError`.',
      ],
      confidence: 0.94,
    }),
  },
  {
    ruleId: 'js-stream-to-text-default',
    questionId: 'js-stream-to-text',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-stream-to-text-default',
      title: 'Treat streamToText as read loop + streaming decoder',
      why: buildProgressAwareWhy(snapshot, 'Most bugs are decoder flushing and abort race handling.'),
      actions: [
        'Loop reader until done.',
        'Decode chunks in stream mode.',
        'Detach abort listeners in cleanup.',
      ],
      confidence: 0.77,
    }),
  },
  {
    ruleId: 'js-storage-ttl-cache-expiry-and-corruption',
    questionId: 'js-storage-ttl-cache',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'without ttl',
        'expires values',
        'corrupted json',
        'remove deletes key',
      ]) ||
      anyFailingErrorIncludes(snapshot, ['json', 'null']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-storage-ttl-cache-expiry-and-corruption',
      title: 'TTL cache retrieval/expiry/corruption handling is inconsistent',
      why: buildProgressAwareWhy(snapshot, 'Cache should parse payload safely, expire entries at read time, and clean bad records.'),
      actions: [
        'Store `{ value, exp }`-style payload with nullable expiry timestamp.',
        'On read, remove and return null for expired or malformed entries.',
        'Keep `remove` as direct key deletion passthrough.',
      ],
      confidence: 0.92,
    }),
  },
  {
    ruleId: 'js-storage-ttl-cache-default',
    questionId: 'js-storage-ttl-cache',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-storage-ttl-cache-default',
      title: 'Implement TTL cache as thin storage adapter',
      why: buildProgressAwareWhy(snapshot, 'Most misses are timestamp comparison and malformed JSON cleanup.'),
      actions: [
        'Serialize values with optional expiration time.',
        'Validate payload shape during reads.',
        'Evict on expiry or parse failure.',
      ],
      confidence: 0.75,
    }),
  },
  {
    ruleId: 'js-escape-html-entity-map',
    questionId: 'js-escape-html',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'special characters',
        'safe text unchanged',
        'existing entities',
      ]) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-escape-html-entity-map',
      title: 'escapeHtml replacement map or order is incorrect',
      why: buildProgressAwareWhy(snapshot, 'Escaping should map all HTML special chars, including `&` before entity-like sequences.'),
      actions: [
        'Convert input to string and replace ampersand, angle brackets, double quote, and apostrophe.',
        'Ensure ampersands are escaped before other substitutions, even in existing entity-like text.',
        'Leave text without escapable chars unchanged.',
      ],
      confidence: 0.91,
    }),
  },
  {
    ruleId: 'js-escape-html-default',
    questionId: 'js-escape-html',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-escape-html-default',
      title: 'Implement escapeHtml via character mapping',
      why: buildProgressAwareWhy(snapshot, 'Most failures are missing one of the required entity replacements.'),
      actions: [
        'Define a map for ampersand, angle brackets, double quote, and apostrophe.',
        'Use one regex replace over the stringified input.',
        'Return transformed string directly.',
      ],
      confidence: 0.74,
    }),
  },
  {
    ruleId: 'js-validate-username-rule-enforcement',
    questionId: 'js-validate-username',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'accepts valid usernames',
        'invalid length',
        'uppercase or invalid chars',
        'leading digit',
        'trailing underscore',
        'consecutive underscores',
        'non-string values',
      ]) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-validate-username-rule-enforcement',
      title: 'Username rule validation misses one or more constraints',
      why: buildProgressAwareWhy(snapshot, 'Validation combines type, length, charset, start/end, and underscore sequence rules.'),
      actions: [
        'Reject non-string inputs and enforce length bounds first.',
        'Enforce lowercase-start + allowed chars (`[a-z0-9_]`).',
        'Reject trailing underscore and consecutive underscores.',
      ],
      confidence: 0.93,
    }),
  },
  {
    ruleId: 'js-validate-username-default',
    questionId: 'js-validate-username',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-validate-username-default',
      title: 'Implement username checks as ordered guard clauses',
      why: buildProgressAwareWhy(snapshot, 'Most issues come from missing edge guards after regex pass.'),
      actions: [
        'Type and length guards first.',
        'Apply main character-pattern regex.',
        'Handle trailing/double underscore edge cases.',
      ],
      confidence: 0.76,
    }),
  },
  {
    ruleId: 'js-safe-json-parse-fallback-contract',
    questionId: 'js-safe-json-parse',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'valid json objects and arrays',
        'valid primitives',
        'fallback on invalid json',
        'fallback for non-string input',
        'default fallback',
      ]) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-safe-json-parse-fallback-contract',
      title: 'safeJsonParse fallback behavior is inconsistent',
      why: buildProgressAwareWhy(snapshot, 'This helper should parse valid JSON and return fallback on parse/type failure.'),
      actions: [
        'Return fallback immediately when input is not a string.',
        'Wrap `JSON.parse` in try/catch and return fallback on exceptions.',
        'Use `null` as default fallback when fallback argument is omitted.',
      ],
      confidence: 0.92,
    }),
  },
  {
    ruleId: 'js-safe-json-parse-default',
    questionId: 'js-safe-json-parse',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-safe-json-parse-default',
      title: 'Implement safeJsonParse as guarded try/catch',
      why: buildProgressAwareWhy(snapshot, 'Most failures are from not honoring fallback on invalid/non-string inputs.'),
      actions: [
        'Type-check text input first.',
        'Attempt `JSON.parse` in try/catch.',
        'Return fallback from all failure paths.',
      ],
      confidence: 0.75,
    }),
  },
  {
    ruleId: 'js-measure-duration-sync-async-errors',
    questionId: 'js-measure-duration',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'measures sync functions',
        'measures async functions',
        'propagates errors',
        'propagates async rejections',
      ]) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-measure-duration-sync-async-errors',
      title: 'measure wrapper is not timing/promisifying function execution correctly',
      why: buildProgressAwareWhy(snapshot, 'Wrapper should support sync/async functions uniformly and rethrow errors.'),
      actions: [
        'Capture start/end timestamps around `await Promise.resolve().then(fn)`.',
        'Return `{ result, durationMs }` for successful execution.',
        'Allow sync throws and async rejections to propagate without swallowing.',
      ],
      confidence: 0.92,
    }),
  },
  {
    ruleId: 'js-measure-duration-default',
    questionId: 'js-measure-duration',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-measure-duration-default',
      title: 'Implement measure with unified sync/async execution path',
      why: buildProgressAwareWhy(snapshot, 'Most bugs come from measuring only sync paths or masking errors.'),
      actions: [
        'Read start time before invoking function.',
        'Await normalized function result.',
        'Compute duration from end-start and return with result.',
      ],
      confidence: 0.75,
    }),
  },
  {
    ruleId: 'js-create-cleanup-bag-lifecycle',
    questionId: 'js-create-cleanup-bag',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'disposes remaining cleanups',
        'dispose is idempotent',
        'add after dispose runs immediately',
      ]) ||
      anyFailingErrorIncludes(snapshot, ['cleanup must be a function']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-create-cleanup-bag-lifecycle',
      title: 'Cleanup bag lifecycle behavior is inconsistent',
      why: buildProgressAwareWhy(snapshot, 'This utility should be idempotent and leak-safe across add/remove/dispose flows.'),
      actions: [
        'Store cleanups in a `Set` and return a remover that deletes only once.',
        'Make `dispose()` idempotent and run each remaining cleanup exactly once.',
        'If `add()` is called after dispose, run the cleanup immediately and keep bag size at 0.',
      ],
      confidence: 0.91,
    }),
  },
  {
    ruleId: 'js-create-cleanup-bag-default',
    questionId: 'js-create-cleanup-bag',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-create-cleanup-bag-default',
      title: 'Implement createCleanupBag with idempotent dispose semantics',
      why: buildProgressAwareWhy(snapshot, 'Most failures come from not coordinating remove/dispose edge cases.'),
      actions: [
        'Track callbacks in a Set with constant-time add/remove.',
        'Guard `dispose()` so repeated calls are safe.',
        'Treat add-after-dispose as immediate cleanup execution.',
      ],
      confidence: 0.74,
    }),
  },
  {
    ruleId: 'js-format-date-timezone-intl-contract',
    questionId: 'js-format-date-timezone',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'formats date in different time zones',
        'accepts a timestamp',
        'throws on invalid date',
      ]) ||
      anyFailingErrorIncludes(snapshot, ['invalid date', 'rangerror']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-format-date-timezone-intl-contract',
      title: 'Timezone formatter is not honoring date/timeZone contract',
      why: buildProgressAwareWhy(snapshot, 'This helper should normalize input and build YYYY-MM-DD from Intl parts.'),
      actions: [
        'Normalize input with `date instanceof Date ? date : new Date(date)`.',
        'Throw on invalid dates using `Number.isNaN(d.getTime())`.',
        'Use `Intl.DateTimeFormat(...).formatToParts` and reassemble `year-month-day`.',
      ],
      confidence: 0.9,
    }),
  },
  {
    ruleId: 'js-format-date-timezone-default',
    questionId: 'js-format-date-timezone',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-format-date-timezone-default',
      title: 'Implement timezone formatting with Intl.DateTimeFormat parts',
      why: buildProgressAwareWhy(snapshot, 'Most issues are from UTC-only formatting or missing invalid-date checks.'),
      actions: [
        'Normalize Date/timestamp input first.',
        'Build output from `year/month/day` formatToParts values.',
        'Return a strict `YYYY-MM-DD` string for all valid inputs.',
      ],
      confidence: 0.73,
    }),
  },
  {
    ruleId: 'js-create-spy-function-recording-and-this',
    questionId: 'js-create-spy-function',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'records calls and arguments',
        'delegates to the implementation and returns its value',
        'preserves this binding when used as a method',
        'reset clears recorded calls',
      ]) ||
      anyFailingErrorIncludes(snapshot, ['is not a function']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-create-spy-function-recording-and-this',
      title: 'Spy metadata or delegation behavior is incorrect',
      why: buildProgressAwareWhy(snapshot, 'Spy must record calls/this and preserve behavior when implementation exists.'),
      actions: [
        'Push each call args into `spy.calls` and receiver into `spy.thisValues`.',
        'Delegate using `impl.apply(this, args)` to preserve method `this`.',
        'Expose `callCount`, `lastCall`, and `reset` with correct empty-state behavior.',
      ],
      confidence: 0.91,
    }),
  },
  {
    ruleId: 'js-create-spy-function-default',
    questionId: 'js-create-spy-function',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-create-spy-function-default',
      title: 'Implement createSpy as callable function with attached state',
      why: buildProgressAwareWhy(snapshot, 'Most failures happen when call tracking and passthrough logic diverge.'),
      actions: [
        'Return a function object, not a plain object wrapper.',
        'Attach state arrays and helper methods directly on that function.',
        'Keep no-impl return value as `undefined` while still recording calls.',
      ],
      confidence: 0.74,
    }),
  },
  {
    ruleId: 'js-create-deferred-promise-settle-contract',
    questionId: 'js-create-deferred-promise',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'resolves when resolve is called',
        'rejects when reject is called',
        'adopts another promise when resolving',
      ]) ||
      anyFailingErrorIncludes(snapshot, ['expected promise to reject']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-create-deferred-promise-settle-contract',
      title: 'Deferred promise does not expose/forward settle behavior correctly',
      why: buildProgressAwareWhy(snapshot, 'The deferred object should surface Promise executor resolve/reject untouched.'),
      actions: [
        'Capture `resolve` and `reject` from `new Promise((res, rej) => ...)`.',
        'Return `{ promise, resolve, reject }` from the factory.',
        'Do not wrap `resolve` values manually; allow Promise adoption semantics.',
      ],
      confidence: 0.92,
    }),
  },
  {
    ruleId: 'js-create-deferred-promise-default',
    questionId: 'js-create-deferred-promise',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-create-deferred-promise-default',
      title: 'Implement createDeferred by exposing Promise settle controls',
      why: buildProgressAwareWhy(snapshot, 'Most bugs are from missing resolver capture or wrong returned shape.'),
      actions: [
        'Declare resolver variables outside Promise constructor.',
        'Assign them inside executor and return all three fields.',
        'Keep function minimal; Promise already handles first-settle wins.',
      ],
      confidence: 0.74,
    }),
  },
  {
    ruleId: 'js-create-lru-cache-eviction-and-recency',
    questionId: 'js-create-lru-cache',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'throws for invalid maxsize',
        'evicts least-recently-used on overflow',
        'get refreshes recency',
        'updating an existing key does not grow size',
      ]) ||
      anyFailingErrorIncludes(snapshot, ['maxsize must be a positive integer']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-create-lru-cache-eviction-and-recency',
      title: 'LRU recency updates or eviction order is incorrect',
      why: buildProgressAwareWhy(snapshot, 'Map insertion order must be maintained carefully on both get and set.'),
      actions: [
        'Validate `maxSize` as a positive integer before creating cache.',
        'On `get`, refresh recency via delete+set before returning value.',
        'On `set`, touch key then evict the oldest key while size exceeds limit.',
      ],
      confidence: 0.91,
    }),
  },
  {
    ruleId: 'js-create-lru-cache-default',
    questionId: 'js-create-lru-cache',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-create-lru-cache-default',
      title: 'Implement LRU with Map insertion-order operations',
      why: buildProgressAwareWhy(snapshot, 'Most issues are from not refreshing key order consistently.'),
      actions: [
        'Use a single internal `Map` as source of truth.',
        'Treat updates as recency refresh, not a separate append.',
        'Expose predictable `size`, `clear`, and `keys` helpers.',
      ],
      confidence: 0.73,
    }),
  },
  {
    ruleId: 'js-run-with-perf-budget-timing-and-validation',
    questionId: 'js-run-with-perf-budget',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'times sync functions and returns ok status',
        'times async functions and awaits the result',
        'clamps negative duration to 0',
        'throws on invalid inputs',
      ]) ||
      anyFailingErrorIncludes(snapshot, ['budgetms must be a non-negative number', 'fn must be a function']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-run-with-perf-budget-timing-and-validation',
      title: 'Perf budget runner has timing or input-validation gaps',
      why: buildProgressAwareWhy(snapshot, 'Function should normalize sync/async paths and compute non-negative duration.'),
      actions: [
        'Validate `fn` and `budgetMs` upfront and throw `TypeError` on invalid input.',
        'Measure around `await`ed execution so async work is included in duration.',
        'Clamp `durationMs` with `Math.max(0, end - start)` before computing `ok`.',
      ],
      confidence: 0.92,
    }),
  },
  {
    ruleId: 'js-run-with-perf-budget-default',
    questionId: 'js-run-with-perf-budget',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-run-with-perf-budget-default',
      title: 'Implement runWithPerfBudget with unified sync/async timing',
      why: buildProgressAwareWhy(snapshot, 'Most mistakes come from measuring only sync code or skipping input guards.'),
      actions: [
        'Read start/end from injected `now` function.',
        'Await `fn` result when it is promise-like.',
        'Return `{ ok, durationMs, value }` with deterministic duration logic.',
      ],
      confidence: 0.74,
    }),
  },
  {
    ruleId: 'js-resolve-package-exports-conditional-resolution',
    questionId: 'js-resolve-package-exports',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'resolves string exports',
        'resolves conditional exports with browser + kind',
        'falls back to module/main when exports is missing',
        'throws when nothing can be resolved',
      ]) ||
      anyFailingErrorIncludes(snapshot, ['unable to resolve package entry']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-resolve-package-exports-conditional-resolution',
      title: 'Package entry resolver is missing conditional export precedence',
      why: buildProgressAwareWhy(snapshot, 'Resolution should prefer exports conditions, then deterministic module/main fallbacks.'),
      actions: [
        'Build candidate conditions in order: `...conditions`, `kind`, `default`.',
        'Resolve nested conditional targets recursively and support root `exports[\".\"]`.',
        'Fallback to `module` for import and `main` otherwise; throw if unresolved.',
      ],
      confidence: 0.9,
    }),
  },
  {
    ruleId: 'js-resolve-package-exports-default',
    questionId: 'js-resolve-package-exports',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-resolve-package-exports-default',
      title: 'Implement resolvePackageEntry with explicit fallback chain',
      why: buildProgressAwareWhy(snapshot, 'Most failures are from treating exports as a flat string only.'),
      actions: [
        'Handle both string and object forms of `exports`.',
        'Keep condition matching deterministic and recursive.',
        'Do not silently return undefined when no entry resolves.',
      ],
      confidence: 0.73,
    }),
  },
  {
    ruleId: 'js-sanitize-href-url-allowlist-security',
    questionId: 'js-sanitize-href-url',
    priority: 110,
    matches: (snapshot) =>
      anyFailingTestNameIncludes(snapshot, [
        'blocks javascript: and data: urls',
        'blocks protocol-relative and backslash urls',
        'allows relative urls and fragments',
        'allows http(s), mailto, tel',
        'returns null for empty input',
      ]) ||
      anyFailingErrorIncludes(snapshot, ['javascript:', 'data:', 'vbscript:']) ||
      snapshot.failCount >= 2,
    buildHint: (snapshot) => ({
      ruleId: 'js-sanitize-href-url-allowlist-security',
      title: 'href sanitizer is allowing unsafe protocols or blocking safe URLs',
      why: buildProgressAwareWhy(snapshot, 'Use strict allowlist + normalization to avoid protocol-based XSS bypasses.'),
      actions: [
        'Trim input, strip control chars, and return null for empty values.',
        'Reject protocol-relative/backslash URLs and non-allowlisted schemes.',
        'Allow relative URLs and validate http/https via `new URL(...)` before returning.',
      ],
      confidence: 0.94,
    }),
  },
  {
    ruleId: 'js-sanitize-href-url-default',
    questionId: 'js-sanitize-href-url',
    priority: 40,
    matches: () => true,
    buildHint: (snapshot) => ({
      ruleId: 'js-sanitize-href-url-default',
      title: 'Implement sanitizeHrefUrl as strict allowlist sanitizer',
      why: buildProgressAwareWhy(snapshot, 'Most bugs come from relying on string checks without normalization.'),
      actions: [
        'Normalize first, then evaluate URL class (relative vs absolute).',
        'Allow only `http`, `https`, `mailto`, and `tel` schemes.',
        'Return `null` for unknown, malformed, or dangerous protocol inputs.',
      ],
      confidence: 0.76,
    }),
  },
];

function buildSnapshot(input: {
  questionId?: string;
  errorLine: string;
  firstFailName?: string;
  category?: FailureCategory;
  passCount?: number;
  totalCount?: number;
  failCount?: number;
  failedTests?: Array<{ name: string; errorLine?: string }>;
  previousRun?: {
    passCount: number;
    totalCount: number;
    firstFailName?: string;
    signature?: string;
  };
}): FailureSnapshot {
  const totalCount = Number.isFinite(input.totalCount) ? Math.max(0, Math.floor(Number(input.totalCount))) : 0;
  const passCount = Number.isFinite(input.passCount) ? Math.max(0, Math.floor(Number(input.passCount))) : 0;
  const inferredFailCount = Math.max(0, totalCount - passCount);
  const failCount = Number.isFinite(input.failCount)
    ? Math.max(0, Math.floor(Number(input.failCount)))
    : inferredFailCount;
  const failedTestsRaw = Array.isArray(input.failedTests) ? input.failedTests : [];
  const failedTests = failedTestsRaw
    .map((item) => ({
      name: String(item?.name || '').trim(),
      errorLine: normalizeErrorLine(item?.errorLine || ''),
    }))
    .filter((item) => !!item.name || !!item.errorLine);

  if (failedTests.length === 0 && (input.firstFailName || input.errorLine)) {
    failedTests.push({
      name: String(input.firstFailName || '').trim(),
      errorLine: normalizeErrorLine(input.errorLine || ''),
    });
  }

  return {
    questionId: String(input.questionId || '').trim(),
    category: input.category || classifyFailureCategory(input.errorLine),
    errorLine: normalizeErrorLine(input.errorLine || ''),
    firstFailName: String(input.firstFailName || '').trim(),
    passCount,
    totalCount,
    failCount,
    failedTests,
    previousRun: input.previousRun,
  };
}

function findQuestionHint(snapshot: FailureSnapshot): FailureHint | null {
  if (!snapshot.questionId) return null;
  const matches = QUESTION_HINT_RULES
    .filter((rule) => rule.questionId === snapshot.questionId && rule.matches(snapshot))
    .sort((a, b) => b.priority - a.priority);
  if (!matches.length) return null;
  return matches[0].buildHint(snapshot);
}

export function buildFailureHint(input: {
  questionId?: string;
  errorLine: string;
  firstFailName?: string;
  category?: FailureCategory;
  passCount?: number;
  totalCount?: number;
  failCount?: number;
  failedTests?: Array<{ name: string; errorLine?: string }>;
  previousRun?: {
    passCount: number;
    totalCount: number;
    firstFailName?: string;
    signature?: string;
  };
}): FailureHint {
  const snapshot = buildSnapshot(input);
  const questionHint = findQuestionHint(snapshot);
  if (questionHint) return questionHint;

  const category = snapshot.category || classifyFailureCategory(snapshot.errorLine);
  const mapped = HINT_BY_CATEGORY.get(category);
  if (mapped) return mapped;
  return FALLBACK_HINT;
}
