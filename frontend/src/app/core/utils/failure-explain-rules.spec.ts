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

  it('returns debounce-specific hint when the wrapper calls synchronously', () => {
    const hint = buildFailureHint({
      questionId: 'js-debounce',
      errorLine: "Expected [ 'A' ] to equal []",
      firstFailName: 'does not call synchronously and runs after delay',
      passCount: 0,
      totalCount: 3,
      failCount: 3,
      failedTests: [
        {
          name: 'does not call synchronously and runs after delay',
          errorLine: "Expected [ 'A' ] to equal []",
        },
      ],
    });

    expect(hint.ruleId).toBe('js-debounce-trailing-delay');
    expect(hint.title.toLowerCase()).toContain('timer');
  });

  it('returns debounce-specific hint for latest-argument reset failures', () => {
    const hint = buildFailureHint({
      questionId: 'js-debounce',
      errorLine: "Expected [ 'A', 'B', 'C' ] to equal [ 'C' ]",
      firstFailName: 'rapid calls only run the latest argument after the final delay',
      passCount: 1,
      totalCount: 3,
      failCount: 2,
      failedTests: [
        {
          name: 'rapid calls only run the latest argument after the final delay',
          errorLine: "Expected [ 'A', 'B', 'C' ] to equal [ 'C' ]",
        },
      ],
    });

    expect(hint.ruleId).toBe('js-debounce-reset');
    expect(hint.title.toLowerCase()).toContain('latest call');
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

  it('explains eager instanceof right-hand-side validation', () => {
    const hint = buildFailureHint({
      questionId: 'js-implement-instanceof',
      errorLine: 'Expected TypeError for a callable with a non-object prototype',
      firstFailName: 'throws when the callable has a non-object prototype',
      passCount: 6,
      totalCount: 8,
      failCount: 2,
      failedTests: [
        {
          name: 'validates the right-hand side before a primitive-left early return',
          errorLine: 'Expected function to throw TypeError',
        },
      ],
    });

    expect(hint.ruleId).toBe('js-implement-instanceof-prototype-walk');
    expect(hint.actions.join(' ')).toContain('object/function prototype');
  });

  it('explains new.target constructor detection for the scoped bind helper', () => {
    const hint = buildFailureHint({
      questionId: 'js-implement-bind',
      errorLine: 'Expected the bound target receiver to be used',
      firstFailName: 'does not mistake an inherited receiver for a constructor call',
      passCount: 4,
      totalCount: 6,
      failCount: 2,
      failedTests: [
        {
          name: 'does not mistake an inherited receiver for a constructor call',
          errorLine: 'Expected normal-call but received undefined',
        },
      ],
    });

    expect(hint.ruleId).toBe('js-implement-bind-constructor-semantics');
    expect(hint.actions.join(' ')).toContain('new.target');
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
    expect(hint.actions.join(' ')).toContain('sparse arrays');
  });

  it('returns Reflect.construct guidance for myNew class construction', () => {
    const hint = buildFailureHint({
      questionId: 'js-implement-new',
      errorLine: "Class constructor cannot be invoked without 'new'",
      firstFailName: 'constructs ES classes',
      passCount: 2,
      totalCount: 8,
      failCount: 6,
      failedTests: [
        {
          name: 'constructs ES classes',
          errorLine: "Class constructor cannot be invoked without 'new'",
        },
      ],
    });
    expect(hint.ruleId).toBe('js-implement-new-operator-rules');
    expect(hint.actions.join(' ')).toContain('Reflect.construct');
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
      errorLine: 'Expected "second" to be first',
      firstFailName: 'only the first settlement wins',
      passCount: 4,
      totalCount: 7,
      failCount: 2,
      failedTests: [
        { name: 'only the first settlement wins', errorLine: 'Expected "second" to be first' },
      ],
    });
    expect(hint.ruleId).toBe('js-create-deferred-promise-settle-contract');
    expect(hint.title).toContain('createDeferred()');
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
    expect(hint.actions.join(' ')).toContain('percent-encoded ASCII controls');
  });

  it('returns deadline guidance for a pollUntil check that never settles', () => {
    const hint = buildFailureHint({
      questionId: 'js-poll-until',
      errorLine: 'Expected Timeout rejection',
      firstFailName: 'times out even when check never settles',
      passCount: 1,
      totalCount: 6,
      failCount: 5,
      failedTests: [
        {
          name: 'times out even when check never settles',
          errorLine: 'Promise remained pending',
        },
      ],
    });
    expect(hint.ruleId).toBe('js-poll-until-timeout-abort-loop');
    expect(hint.actions.join(' ')).toContain('separate retry and deadline timers');
  });

  it('returns shallowClone hint for invalid root guard failures', () => {
    const hint = buildFailureHint({
      questionId: 'js-shallow-clone',
      errorLine: 'Expected function to throw TypeError',
      firstFailName: 'throws TypeError for null and primitives',
      passCount: 8,
      totalCount: 13,
      failCount: 5,
      failedTests: [
        {
          name: 'throws TypeError for null and primitives',
          errorLine: 'Expected function to throw TypeError',
        },
      ],
    });

    expect(hint.ruleId).toBe('js-shallow-clone-invalid-root-guard');
    expect(hint.actions.join(' ')).toContain('value === null');
  });

  it('returns shallowClone hint for same top-level reference failures', () => {
    const hint = buildFailureHint({
      questionId: 'js-shallow-clone',
      errorLine: 'Expected objects not to be the same reference',
      firstFailName: 'returns a different object reference',
      passCount: 4,
      totalCount: 13,
      failCount: 3,
      failedTests: [
        {
          name: 'returns a different object reference',
          errorLine: 'Expected objects not to be the same reference',
        },
      ],
    });

    expect(hint.ruleId).toBe('js-shallow-clone-new-container');
    expect(hint.actions.join(' ')).toContain('Object.assign({}, value)');
  });

  it('returns shallowClone hint when nested references are deep-cloned', () => {
    const hint = buildFailureHint({
      questionId: 'js-shallow-clone',
      errorLine: 'Expected nested object references to be identical',
      firstFailName: 'preserves nested object references',
      passCount: 7,
      totalCount: 13,
      failCount: 2,
      failedTests: [
        {
          name: 'preserves nested object references',
          errorLine: 'Expected nested object references to be identical',
        },
      ],
    });

    expect(hint.ruleId).toBe('js-shallow-clone-nested-references');
    expect(hint.actions.join(' ')).toContain('Avoid recursion');
  });

  it('returns shallowClone hint for symbol and prototype property failures', () => {
    const hint = buildFailureHint({
      questionId: 'js-shallow-clone',
      errorLine: 'Expected inherited to be undefined',
      firstFailName: 'does not copy prototype properties',
      passCount: 10,
      totalCount: 13,
      failCount: 2,
      failedTests: [
        {
          name: 'does not copy prototype properties',
          errorLine: 'Expected inherited to be undefined',
        },
        {
          name: 'copies own enumerable symbol properties',
          errorLine: 'Expected undefined to be 123',
        },
      ],
    });

    expect(hint.ruleId).toBe('js-shallow-clone-own-enumerable-properties');
    expect(hint.actions.join(' ')).toContain('for...in');
  });

  it('returns shallowClone hint for sparse array custom-property failures', () => {
    const hint = buildFailureHint({
      questionId: 'js-shallow-clone',
      errorLine: 'Expected custom symbol value 9 but received undefined',
      firstFailName: 'preserves sparse array shape and custom enumerable properties',
      passCount: 13,
      totalCount: 14,
      failCount: 1,
      failedTests: [
        {
          name: 'preserves sparse array shape and custom enumerable properties',
          errorLine: 'Expected custom symbol value 9 but received undefined',
        },
      ],
    });

    expect(hint.ruleId).toBe('js-shallow-clone-own-enumerable-properties');
    expect(hint.actions.join(' ')).toContain('new Array(value.length)');
  });

  it('explains identity-guarded takeLatest controller cleanup', () => {
    const hint = buildFailureHint({
      questionId: 'js-take-latest',
      errorLine: 'Expected the newer signal to be aborted',
      firstFailName: 'a stale finally cannot clear the newer in-flight controller',
      passCount: 4,
      totalCount: 5,
      failCount: 1,
      failedTests: [
        {
          name: 'a stale finally cannot clear the newer in-flight controller',
          errorLine: 'Expected true but received false',
        },
      ],
    });

    expect(hint.ruleId).toBe('js-take-latest-abort-sequencing');
    expect(hint.actions.join(' ')).toContain('identical');
  });

  it('explains stream reader lock cleanup after decoder failure', () => {
    const hint = buildFailureHint({
      questionId: 'js-stream-to-text',
      errorLine: 'Expected releaseLock to be called once',
      firstFailName: 'releases the reader lock when decoder construction fails',
      passCount: 5,
      totalCount: 6,
      failCount: 1,
      failedTests: [
        {
          name: 'releases the reader lock when decoder construction fails',
          errorLine: 'Expected 1 but received 0',
        },
      ],
    });

    expect(hint.ruleId).toBe('js-stream-to-text-decoder-flow');
    expect(hint.actions.join(' ')).toContain('releaseLock');
  });

  it('returns css flexbox navbar hint for responsive layout failures', () => {
    const hint = buildFailureHint({
      questionId: 'css-flexbox-navbar',
      errorLine: 'Expected .links to use flex-wrap and CTA to remain visible at 480px; focus outline missing',
      firstFailName: 'navbar should wrap at max-width 480px',
      passCount: 2,
      totalCount: 5,
      failCount: 3,
      failedTests: [
        {
          name: 'navbar should wrap at max-width 480px',
          errorLine: 'Expected .links to use flex-wrap and CTA to remain visible at 480px',
        },
        {
          name: 'focus styles stay visible',
          errorLine: 'Expected :focus-visible styles for nav links and CTA',
        },
      ],
    });

    const text = `${hint.title} ${hint.why} ${hint.actions.join(' ')}`.toLowerCase();

    expect(hint.ruleId).toBe('css-flexbox-navbar-responsive-layout');
    expect(text).toContain('flexbox');
    expect(text).toContain('margin-left:auto');
    expect(text).toContain('max-width:480px');
    expect(text).toContain('focus');
  });

  it('returns css grid card gallery hint for exact track sizing failures', () => {
    const hint = buildFailureHint({
      questionId: 'css-grid-card-gallery',
      errorLine: 'Expected .gallery grid-template-columns to include repeat(2, minmax(0, 1fr)) and desktop repeat(4, minmax(0, 1fr))',
      firstFailName: 'gallery should use exact 2 columns before the desktop breakpoint',
      passCount: 3,
      totalCount: 8,
      failCount: 5,
      failedTests: [
        {
          name: 'gallery should use exact 2 columns before the desktop breakpoint',
          errorLine: 'Expected .gallery grid-template-columns to include repeat(2, minmax(0, 1fr))',
        },
        {
          name: 'cards should not overflow with long titles',
          errorLine: 'Expected no horizontal overflow for the gallery',
        },
      ],
    });

    const text = `${hint.title} ${hint.why} ${hint.actions.join(' ')}`.toLowerCase();

    expect(hint.ruleId).toBe('css-grid-card-gallery-track-sizing');
    expect(text).toContain('css grid');
    expect(text).toContain('repeat(2, minmax(0, 1fr))');
    expect(text).toContain('repeat(4, minmax(0, 1fr))');
    expect(text).toContain('auto-fit/minmax(220px, 1fr)');
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
