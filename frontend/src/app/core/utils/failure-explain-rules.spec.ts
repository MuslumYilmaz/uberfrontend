import { buildFailureHint } from './failure-explain-rules';

describe('failure-explain-rules', () => {
  it('returns question-specific hint for sleep promise contract failures', () => {
    const hint = buildFailureHint({
      questionId: 'js-sleep',
      errorLine: 'Expected undefined to be "function"',
      firstFailName: 'returns a promise',
      passCount: 0,
      totalCount: 2,
      failCount: 2,
      failedTests: [
        { name: 'returns a promise', errorLine: 'Expected undefined to be "function"' },
        { name: 'resolves after at least the delay', errorLine: 'Expected false to be true' },
      ],
    });
    expect(hint.ruleId).toBe('js-sleep-return-promise');
    expect(hint.title.toLowerCase()).toContain('promise');
  });

  it('returns question-specific hint for capitalize words spacing case', () => {
    const hint = buildFailureHint({
      questionId: 'js-capitalize-words',
      errorLine: 'Expected "Welcome To Earth" to be "  Welcome   To  Earth  "',
      firstFailName: 'preserves multiple spaces',
      passCount: 2,
      totalCount: 4,
      failCount: 2,
      failedTests: [
        {
          name: 'preserves multiple spaces',
          errorLine: 'Expected "Welcome To Earth" to be "  Welcome   To  Earth  "',
        },
      ],
      previousRun: {
        passCount: 1,
        totalCount: 4,
        firstFailName: 'capitalizes each word in a simple sentence',
      },
    });
    expect(hint.ruleId).toBe('js-capitalize-words-spacing');
    expect(hint.why.toLowerCase()).toContain('good progress');
  });

  it('returns question-specific hint for next-batch prototype question', () => {
    const hint = buildFailureHint({
      questionId: 'js-object-create',
      errorLine: 'Expected [object Object] to be null',
      firstFailName: 'supports null prototype',
      passCount: 1,
      totalCount: 3,
      failCount: 2,
      failedTests: [
        { name: 'supports null prototype', errorLine: 'Expected [object Object] to be null' },
      ],
    });
    expect(hint.ruleId).toBe('js-object-create-prototype');
    expect(hint.title.toLowerCase()).toContain('prototype');
  });

  it('returns question-specific hint for reduce spec behavior', () => {
    const hint = buildFailureHint({
      questionId: 'js-array-prototype-reduce',
      errorLine: 'TypeError: Reduce of empty array with no initial value',
      firstFailName: 'empty array without initialValue throws TypeError',
      passCount: 4,
      totalCount: 6,
      failCount: 2,
      failedTests: [
        {
          name: 'empty array without initialValue throws TypeError',
          errorLine: 'TypeError: Reduce of empty array with no initial value',
        },
      ],
    });
    expect(hint.ruleId).toBe('js-array-prototype-reduce-spec');
    expect(hint.title.toLowerCase()).toContain('reduce');
  });

  it('returns question-specific hint for promiseAll ordering/rejection behavior', () => {
    const hint = buildFailureHint({
      questionId: 'js-promise-all',
      errorLine: 'Expected [2,1] to equal [1,2]',
      firstFailName: 'resolves array of values in order when all succeed',
      passCount: 1,
      totalCount: 4,
      failCount: 3,
      failedTests: [
        {
          name: 'resolves array of values in order when all succeed',
          errorLine: 'Expected [2,1] to equal [1,2]',
        },
        { name: 'rejects when any promise rejects', errorLine: 'Expected promise to reject' },
      ],
    });
    expect(hint.ruleId).toBe('js-promise-all-order-and-rejection');
    expect(hint.title.toLowerCase()).toContain('promiseall');
  });

  it('returns question-specific hint for instanceof prototype-chain edge cases', () => {
    const hint = buildFailureHint({
      questionId: 'js-implement-instanceof',
      errorLine: 'TypeError: Constructor must be a function',
      firstFailName: 'throws if Constructor is not a function',
      passCount: 3,
      totalCount: 6,
      failCount: 3,
      failedTests: [
        {
          name: 'throws if Constructor is not a function',
          errorLine: 'TypeError: Constructor must be a function',
        },
      ],
    });
    expect(hint.ruleId).toBe('js-implement-instanceof-prototype-walk');
    expect(hint.title.toLowerCase()).toContain('prototype');
  });

  it('returns question-specific hint for delegated hard options flow', () => {
    const hint = buildFailureHint({
      questionId: 'js-delegated-events-3',
      errorLine: 'Expected calls to be 1 but received 0',
      firstFailName: 'once removes after first successful match only',
      passCount: 2,
      totalCount: 8,
      failCount: 6,
      failedTests: [
        {
          name: 'once removes after first successful match only',
          errorLine: 'Expected calls to be 1 but received 0',
        },
      ],
    });
    expect(hint.ruleId).toBe('js-delegated-events-3-boundary-and-ignore');
    expect(hint.title.toLowerCase()).toContain('delegate');
  });

  it('returns question-specific hint for queryAllSimple selector validation', () => {
    const hint = buildFailureHint({
      questionId: 'js-selector-polyfill-qsa-3',
      errorLine: 'TypeError: unsupported selector syntax',
      firstFailName: 'throws on unsupported selector syntax',
      passCount: 3,
      totalCount: 9,
      failCount: 6,
      failedTests: [
        {
          name: 'throws on unsupported selector syntax',
          errorLine: 'TypeError: unsupported selector syntax',
        },
      ],
    });
    expect(hint.ruleId).toBe('js-selector-polyfill-qsa-3-validated-dfs-chain');
    expect(hint.title.toLowerCase()).toContain('queryallsimple');
  });

  it('returns question-specific hint for getByPath fallback semantics', () => {
    const hint = buildFailureHint({
      questionId: 'js-get-by-path-1',
      errorLine: 'Expected \"fb\" to be undefined',
      firstFailName: 'treats present-but-undefined as present (returns undefined)',
      passCount: 5,
      totalCount: 8,
      failCount: 3,
      failedTests: [
        {
          name: 'treats present-but-undefined as present (returns undefined)',
          errorLine: 'Expected \"fb\" to be undefined',
        },
      ],
    });
    expect(hint.ruleId).toBe('js-get-by-path-1-fallback-semantics');
    expect(hint.title.toLowerCase()).toContain('fallback');
  });

  it('returns question-specific hint for querystring stringify ordering/filtering', () => {
    const hint = buildFailureHint({
      questionId: 'js-querystring-stringify-2',
      errorLine: 'Expected \"q=hello%20world&page=2\" to be \"page=2&q=hello%20world\"',
      firstFailName: 'stringifies basic params with stable key ordering',
      passCount: 2,
      totalCount: 8,
      failCount: 6,
      failedTests: [
        {
          name: 'stringifies basic params with stable key ordering',
          errorLine: 'Expected \"q=hello%20world&page=2\" to be \"page=2&q=hello%20world\"',
        },
      ],
    });
    expect(hint.ruleId).toBe('js-querystring-stringify-2-order-and-filtering');
    expect(hint.title.toLowerCase()).toContain('stringifyquerystring');
  });

  it('returns question-specific hint for threeSum duplicate handling', () => {
    const hint = buildFailureHint({
      questionId: 'js-three-sum',
      errorLine: 'Expected [[-1,-1,2],[-1,0,1],[-1,0,1]] to equal [[-1,-1,2],[-1,0,1]]',
      firstFailName: 'finds unique triplets',
      passCount: 1,
      totalCount: 3,
      failCount: 2,
      failedTests: [
        {
          name: 'finds unique triplets',
          errorLine: 'Expected duplicate triplet output',
        },
      ],
    });
    expect(hint.ruleId).toBe('js-three-sum-two-pointer-dedupe');
    expect(hint.title.toLowerCase()).toContain('threesum');
  });

  it('returns question-specific hint for valid anagram frequency mismatch', () => {
    const hint = buildFailureHint({
      questionId: 'js-valid-anagram',
      errorLine: 'Expected true to be false',
      firstFailName: 'fails when character frequencies differ',
      passCount: 2,
      totalCount: 5,
      failCount: 3,
      failedTests: [
        {
          name: 'fails when character frequencies differ',
          errorLine: 'Expected true to be false',
        },
      ],
    });
    expect(hint.ruleId).toBe('js-valid-anagram-frequency-check');
    expect(hint.title.toLowerCase()).toContain('anagram');
  });

  it('returns question-specific hint for median odd/even and empty behavior', () => {
    const hint = buildFailureHint({
      questionId: 'js-median-of-array',
      errorLine: 'Expected NaN to be 2.5',
      firstFailName: 'even length',
      passCount: 1,
      totalCount: 5,
      failCount: 4,
      failedTests: [
        { name: 'even length', errorLine: 'Expected NaN to be 2.5' },
        { name: 'empty array returns NaN', errorLine: 'Expected false to be true' },
      ],
    });
    expect(hint.ruleId).toBe('js-median-of-array-sort-midpoint');
    expect(hint.title.toLowerCase()).toContain('median');
  });

  it('returns question-specific hint for maze path traversal guards', () => {
    const hint = buildFailureHint({
      questionId: 'js-maze-path',
      errorLine: 'Expected false to be true',
      firstFailName: 'finds path in grid',
      passCount: 2,
      totalCount: 4,
      failCount: 2,
      failedTests: [
        { name: 'finds path in grid', errorLine: 'Expected false to be true' },
      ],
    });
    expect(hint.ruleId).toBe('js-maze-path-bfs-reachability');
    expect(hint.title.toLowerCase()).toContain('maze');
  });

  it('returns question-specific hint for promiseAny aggregate rejection behavior', () => {
    const hint = buildFailureHint({
      questionId: 'js-promise-any',
      errorLine: 'AggregateError: All promises were rejected',
      firstFailName: 'rejects with AggregateError when all reject',
      passCount: 2,
      totalCount: 5,
      failCount: 3,
      failedTests: [
        {
          name: 'rejects with AggregateError when all reject',
          errorLine: 'AggregateError: All promises were rejected',
        },
      ],
    });
    expect(hint.ruleId).toBe('js-promise-any-aggregate-rejection');
    expect(hint.title.toLowerCase()).toContain('promiseany');
  });

  it('returns question-specific hint for safeJsonParse fallback contract', () => {
    const hint = buildFailureHint({
      questionId: 'js-safe-json-parse',
      errorLine: 'Expected {} to be null',
      firstFailName: 'uses null as default fallback when omitted',
      passCount: 3,
      totalCount: 5,
      failCount: 2,
      failedTests: [
        {
          name: 'uses null as default fallback when omitted',
          errorLine: 'Expected {} to be null',
        },
      ],
    });
    expect(hint.ruleId).toBe('js-safe-json-parse-fallback-contract');
    expect(hint.title.toLowerCase()).toContain('safejsonparse');
  });

  it('returns question-specific hint for measure duration sync/async error behavior', () => {
    const hint = buildFailureHint({
      questionId: 'js-measure-duration',
      errorLine: 'Expected promise to reject with async boom',
      firstFailName: 'propagates async rejections',
      passCount: 1,
      totalCount: 4,
      failCount: 3,
      failedTests: [
        {
          name: 'propagates async rejections',
          errorLine: 'Expected promise to reject with async boom',
        },
      ],
    });
    expect(hint.ruleId).toBe('js-measure-duration-sync-async-errors');
    expect(hint.title.toLowerCase()).toContain('measure');
  });

  it('returns question-specific hint for cleanup bag lifecycle behavior', () => {
    const hint = buildFailureHint({
      questionId: 'js-create-cleanup-bag',
      errorLine: 'Expected 2 to be 1',
      firstFailName: 'dispose is idempotent',
      passCount: 1,
      totalCount: 3,
      failCount: 2,
      failedTests: [
        { name: 'dispose is idempotent', errorLine: 'Expected 2 to be 1' },
      ],
    });
    expect(hint.ruleId).toBe('js-create-cleanup-bag-lifecycle');
    expect(hint.title.toLowerCase()).toContain('cleanup');
  });

  it('returns question-specific hint for timezone formatter contract', () => {
    const hint = buildFailureHint({
      questionId: 'js-format-date-timezone',
      errorLine: 'Expected 2020-01-01 to be 2019-12-31',
      firstFailName: 'formats date in different time zones',
      passCount: 1,
      totalCount: 3,
      failCount: 2,
      failedTests: [
        {
          name: 'formats date in different time zones',
          errorLine: 'Expected 2020-01-01 to be 2019-12-31',
        },
      ],
    });
    expect(hint.ruleId).toBe('js-format-date-timezone-intl-contract');
    expect(hint.title.toLowerCase()).toContain('timezone');
  });

  it('returns question-specific hint for spy call tracking and this binding', () => {
    const hint = buildFailureHint({
      questionId: 'js-create-spy-function',
      errorLine: 'Expected undefined to be 12',
      firstFailName: 'preserves this binding when used as a method',
      passCount: 1,
      totalCount: 4,
      failCount: 3,
      failedTests: [
        {
          name: 'preserves this binding when used as a method',
          errorLine: 'Expected undefined to be 12',
        },
      ],
    });
    expect(hint.ruleId).toBe('js-create-spy-function-recording-and-this');
    expect(hint.title.toLowerCase()).toContain('spy');
  });

  it('returns question-specific hint for deferred promise settle contract', () => {
    const hint = buildFailureHint({
      questionId: 'js-create-deferred-promise',
      errorLine: 'Expected promise to reject',
      firstFailName: 'rejects when reject is called',
      passCount: 1,
      totalCount: 3,
      failCount: 2,
      failedTests: [
        { name: 'rejects when reject is called', errorLine: 'Expected promise to reject' },
      ],
    });
    expect(hint.ruleId).toBe('js-create-deferred-promise-settle-contract');
    expect(hint.title.toLowerCase()).toContain('deferred');
  });

  it('returns question-specific hint for LRU eviction and recency', () => {
    const hint = buildFailureHint({
      questionId: 'js-create-lru-cache',
      errorLine: 'Expected [a,c] to equal [b,c]',
      firstFailName: 'evicts least-recently-used on overflow',
      passCount: 2,
      totalCount: 4,
      failCount: 2,
      failedTests: [
        { name: 'evicts least-recently-used on overflow', errorLine: 'Expected [a,c] to equal [b,c]' },
      ],
    });
    expect(hint.ruleId).toBe('js-create-lru-cache-eviction-and-recency');
    expect(hint.title.toLowerCase()).toContain('lru');
  });

  it('returns question-specific hint for perf budget timing and validation', () => {
    const hint = buildFailureHint({
      questionId: 'js-run-with-perf-budget',
      errorLine: 'TypeError: fn must be a function',
      firstFailName: 'throws on invalid inputs',
      passCount: 1,
      totalCount: 4,
      failCount: 3,
      failedTests: [
        { name: 'throws on invalid inputs', errorLine: 'TypeError: fn must be a function' },
      ],
    });
    expect(hint.ruleId).toBe('js-run-with-perf-budget-timing-and-validation');
    expect(hint.title.toLowerCase()).toContain('perf');
  });

  it('returns question-specific hint for package exports resolution', () => {
    const hint = buildFailureHint({
      questionId: 'js-resolve-package-exports',
      errorLine: 'Unable to resolve package entry',
      firstFailName: 'resolves conditional exports with browser + kind',
      passCount: 1,
      totalCount: 4,
      failCount: 3,
      failedTests: [
        {
          name: 'resolves conditional exports with browser + kind',
          errorLine: 'Unable to resolve package entry',
        },
      ],
    });
    expect(hint.ruleId).toBe('js-resolve-package-exports-conditional-resolution');
    expect(hint.title.toLowerCase()).toContain('package');
  });

  it('returns question-specific hint for href sanitizer security allowlist', () => {
    const hint = buildFailureHint({
      questionId: 'js-sanitize-href-url',
      errorLine: 'Expected null to be /settings',
      firstFailName: 'allows relative URLs and fragments',
      passCount: 2,
      totalCount: 5,
      failCount: 3,
      failedTests: [
        {
          name: 'allows relative URLs and fragments',
          errorLine: 'Expected null to be /settings',
        },
      ],
    });
    expect(hint.ruleId).toBe('js-sanitize-href-url-allowlist-security');
    expect(hint.title.toLowerCase()).toContain('sanitizer');
  });

  it('maps undefined assertion mismatch to missing return hint', () => {
    const hint = buildFailureHint({
      errorLine: 'Expected undefined to be Hello World',
      firstFailName: 'capitalizes words',
    });
    expect(hint.ruleId).toBe('missing-return');
    expect(hint.actions.length).toBeGreaterThanOrEqual(2);
  });

  it('falls back to generic debugging hint', () => {
    const hint = buildFailureHint({
      errorLine: 'Completely unknown failure phrase',
      firstFailName: 'mystery test',
      category: 'unknown',
    });
    expect(hint.ruleId).toBe('generic-debug');
  });
});
