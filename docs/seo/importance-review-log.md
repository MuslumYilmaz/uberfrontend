# Importance Review Log

Manual importance review in 5-question batches.
Scale: `1` (low interview value) to `5` (must-know for frontend interviews).

### Batch 01
- File: `javascript/trivia.json` (frontend + CDN mirror)
- IDs: `js-event-loop`, `js-closures`, `js-this-keyword`, `js-hoisting-tdz`, `js-var-let-const-hoisting`
- Old -> new:
  - `js-event-loop`: `5` -> `5`
  - `js-closures`: `5` -> `5`
  - `js-this-keyword`: `5` -> `5`
  - `js-hoisting-tdz`: `5` -> `5`
  - `js-var-let-const-hoisting`: `5` -> `5`
- Rationale:
  - `js-event-loop`: Core async runtime model; very common in interviews; high real-world debugging impact.
  - `js-closures`: Foundational for scope, callbacks, hooks, and module patterns; frequently tested.
  - `js-this-keyword`: Core invocation/binding behavior; commonly used to evaluate JavaScript depth.
  - `js-hoisting-tdz`: Frequent source of bugs; standard interview checkpoint for execution model understanding.
  - `js-var-let-const-hoisting`: Practical scoping/hoisting behavior directly tied to day-to-day correctness.
- Validation: frontend/CDN parity confirmed for reviewed IDs; no data changes required.
- Remaining in file: 56

### Batch 02
- File: `javascript/trivia.json` (frontend + CDN mirror)
- IDs: `js-promises-async-await`, `js-event-delegation`, `js-null-undefined-undeclared`, `js-equality-vs-strict-equality`, `js-hoisting`
- Old -> new:
  - `js-promises-async-await`: `5` -> `5`
  - `js-event-delegation`: `5` -> `5`
  - `js-null-undefined-undeclared`: `1` -> `4`
  - `js-equality-vs-strict-equality`: `1` -> `4`
  - `js-hoisting`: `5` -> `5`
- Rationale:
  - `js-promises-async-await`: Core async control-flow model and error handling pattern used in nearly all modern JS codebases.
  - `js-event-delegation`: Common interviewable DOM pattern with clear performance and maintainability implications.
  - `js-null-undefined-undeclared`: Fundamental correctness concept and frequent bug source; commonly probed in interviews.
  - `js-equality-vs-strict-equality`: High-frequency interview and code-review topic tied directly to runtime correctness.
  - `js-hoisting`: Core execution-model concept used to assess language fundamentals and debugging ability.
- Validation: `lint-questions` pass; frontend/CDN parity pass.
- Remaining in file: 51

### Batch 03
- File: `javascript/trivia.json` (frontend + CDN mirror)
- IDs: `js-higher-order-function`, `js-event-bubbling-capturing`, `js-call-apply-bind`, `js-foreach-vs-map`, `js-cookie-sessionstorage-localstorage`
- Old -> new:
  - `js-higher-order-function`: `3` -> `4`
  - `js-event-bubbling-capturing`: `5` -> `5`
  - `js-call-apply-bind`: `4` -> `4`
  - `js-foreach-vs-map`: `1` -> `4`
  - `js-cookie-sessionstorage-localstorage`: `1` -> `4`
- Rationale:
  - `js-higher-order-function`: Core functional programming concept used in callbacks, array methods, and abstraction patterns.
  - `js-event-bubbling-capturing`: High-frequency frontend interview topic with direct practical impact on DOM event handling.
  - `js-call-apply-bind`: Important for `this` binding and function reuse; still a common depth-check topic.
  - `js-foreach-vs-map`: Fundamental array-method distinction tied to side-effects vs transformations and code quality.
  - `js-cookie-sessionstorage-localstorage`: Practical browser-storage knowledge with frequent interview and real-world usage relevance.
- Validation: `lint-questions` pass; frontend/CDN parity pass.
- Remaining in file: 46

### Batch 04
- File: `javascript/trivia.json` (frontend + CDN mirror)
- IDs: `js-prototypal-inheritance`, `js-data-types`, `js-nan-property`, `js-currying`, `js-callbacks`
- Old -> new:
  - `js-prototypal-inheritance`: `1` -> `4`
  - `js-data-types`: `4` -> `4`
  - `js-nan-property`: `1` -> `3`
  - `js-currying`: `3` -> `3`
  - `js-callbacks`: `5` -> `5`
- Rationale:
  - `js-prototypal-inheritance`: Core JavaScript object model concept and frequent signal for language-depth understanding.
  - `js-data-types`: Foundational language knowledge that is commonly checked and broadly useful in day-to-day coding.
  - `js-nan-property`: Important correctness/troubleshooting concept, but less central than core async/scope/binding topics.
  - `js-currying`: Useful functional pattern, but less universally required in typical frontend interview loops.
  - `js-callbacks`: Fundamental control-flow pattern that underpins async/event-driven JavaScript and interview exercises.
- Validation: `lint-questions` pass; frontend/CDN parity pass.
- Remaining in file: 41

### Batch 05
- File: `javascript/trivia.json` (frontend + CDN mirror)
- IDs: `js-arrow-functions`, `js-object-destructuring`, `js-design-patterns`, `js-deferred-scripts`, `js-classes`
- Old -> new:
  - `js-arrow-functions`: `3` -> `4`
  - `js-object-destructuring`: `1` -> `4`
  - `js-design-patterns`: `1` -> `3`
  - `js-deferred-scripts`: `3` -> `4`
  - `js-classes`: `1` -> `4`
- Rationale:
  - `js-arrow-functions`: Widely used ES6 function form and common interview checkpoint, especially around lexical `this` behavior.
  - `js-object-destructuring`: High-frequency modern syntax used across production code and interview exercises.
  - `js-design-patterns`: Valuable architectural awareness topic, but broader and less universally tested than core language mechanics.
  - `js-deferred-scripts`: Practical script-loading/performance concept with common frontend interview relevance.
  - `js-classes`: Core modern syntax layer over prototypes; commonly asked alongside inheritance/prototype questions.
- Validation: `lint-questions` pass; frontend/CDN parity pass.
- Remaining in file: 36

### Batch 06
- File: `javascript/trivia.json` (frontend + CDN mirror)
- IDs: `js-object-creation-methods`, `js-memoization`, `js-microtasks-vs-macrotasks`, `js-promise-combinators-all-allsettled-race-any`, `js-object-create-vs-new`
- Old -> new:
  - `js-object-creation-methods`: `1` -> `3`
  - `js-memoization`: `1` -> `4`
  - `js-microtasks-vs-macrotasks`: `5` -> `5`
  - `js-promise-combinators-all-allsettled-race-any`: `5` -> `5`
  - `js-object-create-vs-new`: `1` -> `3`
- Rationale:
  - `js-object-creation-methods`: Useful language-knowledge topic, but less central than async/scope/core runtime fundamentals.
  - `js-memoization`: Common optimization concept with clear interview usefulness and practical frontend performance impact.
  - `js-microtasks-vs-macrotasks`: High-signal event-loop depth topic with strong debugging and correctness relevance.
  - `js-promise-combinators-all-allsettled-race-any`: Core async orchestration topic frequently used in production and interviews.
  - `js-object-create-vs-new`: Important prototype/construction distinction, but generally a medium-priority depth check.
- Validation: `lint-questions` pass; frontend/CDN parity pass.
- Remaining in file: 31

### Batch 07
- File: `javascript/trivia.json` (frontend + CDN mirror)
- IDs: `js-prototype-vs-proto`, `js-shallow-vs-deep-copy`, `js-map-filter-reduce`, `js-array-sort-pitfalls`, `js-mutability-vs-immutability`
- Old -> new:
  - `js-prototype-vs-proto`: `5` -> `5`
  - `js-shallow-vs-deep-copy`: `3` -> `4`
  - `js-map-filter-reduce`: `1` -> `4`
  - `js-array-sort-pitfalls`: `1` -> `3`
  - `js-mutability-vs-immutability`: `5` -> `5`
- Rationale:
  - `js-prototype-vs-proto`: High-signal JavaScript internals topic often used to assess language depth.
  - `js-shallow-vs-deep-copy`: Common real-world bug source and practical interview topic around references/state updates.
  - `js-map-filter-reduce`: Core array-transformation API set used heavily in frontend code and interview exercises.
  - `js-array-sort-pitfalls`: Important correctness topic (default lexicographic sort, mutation behavior), but medium priority versus broader fundamentals.
  - `js-mutability-vs-immutability`: Critical state-management concept with strong practical and interview relevance.
- Validation: `lint-questions` pass; frontend/CDN parity pass.
- Remaining in file: 26

### Batch 08
- File: `javascript/trivia.json` (frontend + CDN mirror)
- IDs: `js-secure-cors-handling`, `content-delivery-caching-strategies-streaming`, `debounce-vs-throttle-search-input`, `js-map-vs-object`, `http-caching-basics`
- Old -> new:
  - `js-secure-cors-handling`: `1` -> `4`
  - `content-delivery-caching-strategies-streaming`: `1` -> `3`
  - `debounce-vs-throttle-search-input`: `1` -> `4`
  - `js-map-vs-object`: `1` -> `4`
  - `http-caching-basics`: `1` -> `4`
- Rationale:
  - `js-secure-cors-handling`: Frequent practical interview topic with strong real-world integration/security impact.
  - `content-delivery-caching-strategies-streaming`: Valuable architecture topic, but more specialized than universal frontend fundamentals.
  - `debounce-vs-throttle-search-input`: Common performance/control-flow interview pattern directly tied to UI responsiveness.
  - `js-map-vs-object`: Core data-structure choice question with practical correctness/performance implications.
  - `http-caching-basics`: High-value web-platform knowledge commonly used in frontend performance/debug scenarios.
- Validation: `lint-questions` pass; frontend/CDN parity pass.
- Remaining in file: 21

### Batch 09
- File: `javascript/trivia.json` (frontend + CDN mirror)
- IDs: `web-performance-optimize-load-time`, `js-current-trends`, `ai-streaming-data-handling`, `chat-conversation-state-management`, `sse-vs-websocket-real-time`
- Old -> new:
  - `web-performance-optimize-load-time`: `1` -> `5`
  - `js-current-trends`: `1` -> `2`
  - `ai-streaming-data-handling`: `1` -> `3`
  - `chat-conversation-state-management`: `5` -> `4`
  - `sse-vs-websocket-real-time`: `1` -> `4`
- Rationale:
  - `web-performance-optimize-load-time`: Universal frontend competency with high interview frequency and direct product impact.
  - `js-current-trends`: Useful discussion topic, but trend-awareness is less core than stable runtime/platform fundamentals.
  - `ai-streaming-data-handling`: Increasingly relevant practical topic, but not yet universal across all frontend interview loops.
  - `chat-conversation-state-management`: Strong state-modeling signal, but somewhat product-pattern-specific versus universal fundamentals.
  - `sse-vs-websocket-real-time`: Common real-time architecture choice with clear practical tradeoff evaluation value.
- Validation: `lint-questions` pass; frontend/CDN parity pass.
- Remaining in file: 16

### Batch 10
- File: `javascript/trivia.json` (frontend + CDN mirror)
- IDs: `ai-ux-integration-challenges`, `prompt-engineering-frontend`, `js-queue-vs-stack`, `js-big-o-notation`, `js-async-race-conditions`
- Old -> new:
  - `ai-ux-integration-challenges`: `1` -> `3`
  - `prompt-engineering-frontend`: `3` -> `2`
  - `js-queue-vs-stack`: `1` -> `3`
  - `js-big-o-notation`: `1` -> `4`
  - `js-async-race-conditions`: `5` -> `5`
- Rationale:
  - `ai-ux-integration-challenges`: Useful modern product topic, but not yet as universal as core frontend/runtime fundamentals.
  - `prompt-engineering-frontend`: Valuable context topic, though typically lower interview signal for frontend core competency.
  - `js-queue-vs-stack`: Foundational data-structure concept and common baseline interview check.
  - `js-big-o-notation`: High-signal reasoning skill for solution quality and tradeoff discussions in interviews.
  - `js-async-race-conditions`: Critical async correctness topic with strong practical debugging and interview relevance.
- Validation: `lint-questions` pass; frontend/CDN parity pass.
- Remaining in file: 11

### Batch 11
- File: `javascript/trivia.json` (frontend + CDN mirror)
- IDs: `js-web-workers-basics`, `js-escape-vs-sanitize`, `js-xss-dom-sinks`, `js-testing-edge-cases-strategy`, `js-performance-profiling-workflow`, `js-memory-leaks-common-sources`
- Old -> new:
  - `js-web-workers-basics`: `1` -> `3`
  - `js-escape-vs-sanitize`: `1` -> `4`
  - `js-xss-dom-sinks`: `1` -> `5`
  - `js-testing-edge-cases-strategy`: `1` -> `4`
  - `js-performance-profiling-workflow`: `1` -> `4`
  - `js-memory-leaks-common-sources`: `1` -> `4`
- Rationale:
  - `js-web-workers-basics`: Important performance/concurrency tool, but less universal than core language/runtime questions.
  - `js-escape-vs-sanitize`: Practical security distinction with strong interview and production relevance.
  - `js-xss-dom-sinks`: High-impact frontend security competency and common senior-level interview signal.
  - `js-testing-edge-cases-strategy`: Broadly useful quality-engineering topic with clear interview applicability.
  - `js-performance-profiling-workflow`: High practical value for diagnosing real frontend bottlenecks.
  - `js-memory-leaks-common-sources`: Critical long-lived app reliability topic with significant practical/debugging impact.
- Validation: `lint-questions` pass; frontend/CDN parity pass.
- Remaining in file: 5

### Batch 12
- File: `javascript/trivia.json` (frontend + CDN mirror)
- IDs: `js-esm-vs-cjs`, `js-tree-shaking`, `js-intl-datetime-timezone`, `js-mock-vs-stub-vs-spy`, `js-garbage-collection-and-gc-pauses`
- Old -> new:
  - `js-esm-vs-cjs`: `1` -> `4`
  - `js-tree-shaking`: `1` -> `4`
  - `js-intl-datetime-timezone`: `1` -> `4`
  - `js-mock-vs-stub-vs-spy`: `5` -> `4`
  - `js-garbage-collection-and-gc-pauses`: `1` -> `4`
- Rationale:
  - `js-esm-vs-cjs`: High practical interview value around module systems, interoperability, and build/runtime behavior.
  - `js-tree-shaking`: Core bundle-optimization topic tied directly to frontend performance outcomes.
  - `js-intl-datetime-timezone`: Frequent real-world correctness pain point with strong production relevance.
  - `js-mock-vs-stub-vs-spy`: Important testing-depth topic, but not always a universal must-ask across all frontend loops.
  - `js-garbage-collection-and-gc-pauses`: Strong performance/debugging competency signal for long-lived frontend apps.
- Validation: `lint-questions` pass; frontend/CDN parity pass.
- Remaining in file: 0

### Batch 13
- File: `javascript/coding.json` (frontend + CDN mirror)
- IDs: `js-number-clamp`, `js-reverse-string`, `js-count-vowels`, `js-flatten-once`, `js-unique-array`
- Old -> new:
  - `js-number-clamp`: `3` -> `2`
  - `js-reverse-string`: `4` -> `3`
  - `js-count-vowels`: `3` -> `2`
  - `js-flatten-once`: `3` -> `3`
  - `js-unique-array`: `3` -> `4`
- Rationale:
  - `js-number-clamp`: Useful utility pattern, but generally a lower-signal warm-up question.
  - `js-reverse-string`: Common introductory interview exercise with moderate signal on basic iteration/string handling.
  - `js-count-vowels`: Basic loop/counting drill with limited depth for frontend role evaluation.
  - `js-flatten-once`: Practical array-normalization task with moderate real-world utility and clear edge-case checks.
  - `js-unique-array`: Very common practical pattern (dedupe + order preservation) with strong day-to-day relevance.
- Validation: `lint-questions` pass; frontend/CDN parity pass.
- Remaining in file: 83

### Batch 14
- File: `javascript/coding.json` (frontend + CDN mirror)
- IDs: `js-max-char`, `js-capitalize-words`, `js-sum-numbers`, `js-compact`, `js-arrays-equal`
- Old -> new:
  - `js-max-char`: `3` -> `3`
  - `js-capitalize-words`: `3` -> `2`
  - `js-sum-numbers`: `1` -> `2`
  - `js-compact`: `3` -> `3`
  - `js-arrays-equal`: `3` -> `3`
- Rationale:
  - `js-max-char`: Solid frequency-map warm-up with moderate interview signal.
  - `js-capitalize-words`: Basic string-formatting drill; useful but lower-signal versus broader array/state patterns.
  - `js-sum-numbers`: Foundational accumulator/type-check exercise; low-to-moderate baseline relevance.
  - `js-compact`: Practical filtering/falsy handling pattern with moderate day-to-day usefulness.
  - `js-arrays-equal`: Common shallow-comparison pattern; moderate interview utility when framing equality semantics.
- Validation: `lint-questions` pass; frontend/CDN parity pass.
- Remaining in file: 78

### Batch 15
- File: `javascript/coding.json` (frontend + CDN mirror)
- IDs: `js-shallow-clone`, `js-sleep`, `js-once`, `js-object-create`, `js-update-at-index`
- Old -> new:
  - `js-shallow-clone`: `3` -> `4`
  - `js-sleep`: `5` -> `4`
  - `js-once`: `3` -> `3`
  - `js-object-create`: `3` -> `3`
  - `js-update-at-index`: `3` -> `4`
- Rationale:
  - `js-shallow-clone`: High practical relevance for reference semantics and mutation bug prevention.
  - `js-sleep`: Useful async utility but narrower interview signal than core state/reference patterns.
  - `js-once`: Solid closure/HOF exercise with moderate interview utility.
  - `js-object-create`: Prototype-focused concept useful for depth checks, but not universal in most loops.
  - `js-update-at-index`: Core immutable update pattern used widely in frontend state management.
- Validation: `lint-questions` pass; frontend/CDN parity pass.
- Remaining in file: 73

### Batch 16
- File: `javascript/coding.json` (frontend + CDN mirror)
- IDs: `js-debounce`, `js-throttle`, `js-deep-clone`, `js-deep-equal`, `js-flatten-depth`
- Old -> new:
  - `js-debounce`: `4` -> `4`
  - `js-throttle`: `4` -> `4`
  - `js-deep-clone`: `1` -> `4`
  - `js-deep-equal`: `1` -> `4`
  - `js-flatten-depth`: `1` -> `3`
- Rationale:
  - `js-debounce`: High practical frontend utility for input/network/perf control.
  - `js-throttle`: High practical frontend utility for scroll/resize/perf control.
  - `js-deep-clone`: Common utility/interview topic with meaningful edge-case reasoning requirements.
  - `js-deep-equal`: Strong interview signal for recursive reasoning and object semantics.
  - `js-flatten-depth`: Useful recursive/iterative pattern, but slightly lower signal than clone/equality tasks.
- Validation: `lint-questions` pass; frontend/CDN parity pass.
- Remaining in file: 68

### Batch 17
- File: `javascript/coding.json` (frontend + CDN mirror)
- IDs: `js-curry-function`, `js-memoize-function`, `js-compose`, `js-group-by`, `js-event-emitter-mini`
- Old -> new:
  - `js-curry-function`: `2` -> `3`
  - `js-memoize-function`: `3` -> `4`
  - `js-compose`: `1` -> `3`
  - `js-group-by`: `1` -> `4`
  - `js-event-emitter-mini`: `5` -> `4`
- Rationale:
  - `js-curry-function`: Useful functional pattern with moderate interview frequency.
  - `js-memoize-function`: Practical optimization pattern with strong real-world and interview relevance.
  - `js-compose`: Important abstraction/composability pattern, but generally medium signal in typical frontend loops.
  - `js-group-by`: High practical utility pattern frequently needed in data-transform tasks.
  - `js-event-emitter-mini`: Strong architecture signal, but not always a universal must-ask at top priority.
- Validation: `lint-questions` pass; frontend/CDN parity pass.
- Remaining in file: 63

### Batch 18
- File: `javascript/coding.json` (frontend + CDN mirror)
- IDs: `js-concurrency-map-limit`, `js-abortable-helpers`, `js-streaming-ndjson-parser`, `js-array-prototype-map`, `js-array-prototype-reduce`
- Old -> new:
  - `js-concurrency-map-limit`: `5` -> `4`
  - `js-abortable-helpers`: `5` -> `3`
  - `js-streaming-ndjson-parser`: `1` -> `3`
  - `js-array-prototype-map`: `5` -> `4`
  - `js-array-prototype-reduce`: `5` -> `4`
- Rationale:
  - `js-concurrency-map-limit`: Strong async-control pattern with high value, but not a universal must-ask in every frontend loop.
  - `js-abortable-helpers`: Useful modern async utility design, though comparatively specialized.
  - `js-streaming-ndjson-parser`: Relevant streaming/parsing exercise with moderate practical interview signal.
  - `js-array-prototype-map`: Classic JavaScript internals exercise with strong but not always top-priority coding-round frequency.
  - `js-array-prototype-reduce`: Classic JavaScript internals exercise with strong but not always top-priority coding-round frequency.
- Validation: `lint-questions` pass; frontend/CDN parity pass.
- Remaining in file: 58

### Batch 19
- File: `javascript/coding.json` (frontend + CDN mirror)
- IDs: `js-array-prototype-filter`, `js-array-foreach`, `js-array-sort`, `js-create-counter`, `js-is-object-empty`
- Old -> new:
  - `js-array-prototype-filter`: `5` -> `4`
  - `js-array-foreach`: `2` -> `3`
  - `js-array-sort`: `4` -> `4`
  - `js-create-counter`: `5` -> `3`
  - `js-is-object-empty`: `3` -> `2`
- Rationale:
  - `js-array-prototype-filter`: Strong API-internals exercise with good interview signal, but not universal top-priority.
  - `js-array-foreach`: Core iteration/callback semantics with moderate practical relevance.
  - `js-array-sort`: High practical importance due to comparator/mutation pitfalls and frequent real-world use.
  - `js-create-counter`: Useful closure warm-up, but lower-signal than broader data/async/state problems.
  - `js-is-object-empty`: Basic utility check with limited depth in most interview contexts.
- Validation: `lint-questions` pass; frontend/CDN parity pass.
- Remaining in file: 53

### Batch 20
- File: `javascript/coding.json` (frontend + CDN mirror)
- IDs: `js-add-two-promises`, `js-promise-all`, `js-implement-bind`, `js-implement-new`, `js-implement-instanceof`
- Old -> new:
  - `js-add-two-promises`: `5` -> `3`
  - `js-promise-all`: `5` -> `4`
  - `js-implement-bind`: `5` -> `4`
  - `js-implement-new`: `1` -> `4`
  - `js-implement-instanceof`: `3` -> `4`
- Rationale:
  - `js-add-two-promises`: Useful async warm-up, but narrower signal than broader promise/orchestration tasks.
  - `js-promise-all`: High-value async coordination pattern with frequent interview relevance.
  - `js-implement-bind`: Strong JavaScript internals depth-check topic, but not always top-priority in every loop.
  - `js-implement-new`: Important prototype/constructor semantics question and strong language-depth signal.
  - `js-implement-instanceof`: Clear prototype-chain reasoning exercise with solid practical interview value.
- Validation: `lint-questions` pass; frontend/CDN parity pass.
- Remaining in file: 48

### Batch 21
- File: `javascript/coding.json` (frontend + CDN mirror)
- IDs: `js-delegated-events-1`, `js-delegated-events-2`, `js-delegated-events-3`, `js-dom-walk-text-content-1`, `js-dom-walk-text-content-2`
- Old -> new:
  - `js-delegated-events-1`: `5` -> `4`
  - `js-delegated-events-2`: `5` -> `4`
  - `js-delegated-events-3`: `5` -> `3`
  - `js-dom-walk-text-content-1`: `2` -> `2`
  - `js-dom-walk-text-content-2`: `3` -> `3`
- Rationale:
  - `js-delegated-events-1`: Event delegation is a high-value frontend pattern with strong practical interview relevance.
  - `js-delegated-events-2`: Advanced delegation options are valuable, but still a variation on the same core concept.
  - `js-delegated-events-3`: Third variant overlaps heavily with the same topic, so relative importance is lower.
  - `js-dom-walk-text-content-1`: Useful tree-traversal exercise, but less common in standard frontend interview loops.
  - `js-dom-walk-text-content-2`: Practical ancestor traversal pattern with moderate day-to-day utility.
- Validation: `lint-questions` pass; frontend/CDN parity pass.
- Remaining in file: 43

### Batch 22
- File: `javascript/coding.json` (frontend + CDN mirror)
- IDs: `js-dom-walk-text-content-3`, `js-selector-polyfill-matches-1`, `js-recover-bst-swapped-nodes`, `js-selector-polyfill-closest-2`, `js-selector-polyfill-qsa-3`
- Old -> new:
  - `js-dom-walk-text-content-3`: `2` -> `2`
  - `js-selector-polyfill-matches-1`: `2` -> `3`
  - `js-recover-bst-swapped-nodes`: `1` -> `2`
  - `js-selector-polyfill-closest-2`: `2` -> `3`
  - `js-selector-polyfill-qsa-3`: `1` -> `2`
- Rationale:
  - `js-dom-walk-text-content-3`: Valuable traversal/selector-engine depth check, but comparatively specialized.
  - `js-selector-polyfill-matches-1`: Common frontend utility pattern with moderate practical interview relevance.
  - `js-recover-bst-swapped-nodes`: General algorithm exercise with some signal, but less frontend-specific.
  - `js-selector-polyfill-closest-2`: Frequently used delegation/boundary pattern in real frontend code.
  - `js-selector-polyfill-qsa-3`: Advanced selector traversal is useful, but more niche than common DOM utility questions.
- Validation: `lint-questions` pass; frontend/CDN parity pass.
- Remaining in file: 38

### Batch 23
- File: `javascript/coding.json` (frontend + CDN mirror)
- IDs: `js-get-by-path-1`, `js-set-by-path-2`, `js-deep-clone-cycles-3`, `js-querystring-parse-1`, `js-querystring-stringify-2`
- Old -> new:
  - `js-get-by-path-1`: `1` -> `4`
  - `js-set-by-path-2`: `1` -> `4`
  - `js-deep-clone-cycles-3`: `1` -> `3`
  - `js-querystring-parse-1`: `1` -> `3`
  - `js-querystring-stringify-2`: `1` -> `3`
- Rationale:
  - `js-get-by-path-1`: Very common frontend data-access utility with strong practical and interview relevance.
  - `js-set-by-path-2`: High-value immutable update pattern frequently used in state/data manipulation tasks.
  - `js-deep-clone-cycles-3`: Useful advanced clone/graph-reference reasoning, but more specialized than core day-to-day helpers.
  - `js-querystring-parse-1`: Common URL/filter state parsing task with practical interview value.
  - `js-querystring-stringify-2`: Common URL-building task with moderate practical/frontend interview relevance.
- Validation: `lint-questions` pass; frontend/CDN parity pass.
- Remaining in file: 33

### Batch 24
- File: `javascript/coding.json` (frontend + CDN mirror)
- IDs: `js-querystring-parse-3`, `js-add-strings`, `js-lodash-get`, `js-three-sum`, `js-merge-sorted-arrays`
- Old -> new:
  - `js-querystring-parse-3`: `1` -> `4`
  - `js-add-strings`: `1` -> `3`
  - `js-lodash-get`: `1` -> `4`
  - `js-three-sum`: `1` -> `3`
  - `js-merge-sorted-arrays`: `2` -> `3`
- Rationale:
  - `js-querystring-parse-3`: Advanced URL-state parsing is a common high-signal frontend utility/problem.
  - `js-add-strings`: Useful digit/carry logic drill with moderate interview value.
  - `js-lodash-get`: Very common nested-path access helper pattern in practical frontend data handling.
  - `js-three-sum`: Classic algorithmic reasoning task with moderate coding-round relevance.
  - `js-merge-sorted-arrays`: Foundational two-pointer pattern with steady practical interview utility.
- Validation: `lint-questions` pass; frontend/CDN parity pass.
- Remaining in file: 28

### Batch 25
- File: `javascript/coding.json` (frontend + CDN mirror)
- IDs: `js-valid-anagram`, `js-median-of-array`, `js-dom-renderer`, `js-timer-manager`, `js-timer-manager-and-dom-renderer`
- Old -> new:
  - `js-valid-anagram`: `1` -> `2`
  - `js-median-of-array`: `1` -> `2`
  - `js-dom-renderer`: `3` -> `3`
  - `js-timer-manager`: `5` -> `4`
  - `js-timer-manager-and-dom-renderer`: `3` -> `3`
- Rationale:
  - `js-valid-anagram`: Standard baseline algorithm drill with low-to-moderate frontend interview signal.
  - `js-median-of-array`: Useful fundamentals check, but typically not a top frontend-specific discriminator.
  - `js-dom-renderer`: Solid frontend-oriented rendering/data-to-UI transformation exercise with moderate relevance.
  - `js-timer-manager`: Strong practical async/timer-control pattern, but not universally must-ask at top priority.
  - `js-timer-manager-and-dom-renderer`: Combined practical exercise with steady mid-level frontend utility.
- Validation: `lint-questions` pass; frontend/CDN parity pass.
- Remaining in file: 23

### Batch 26
- File: `javascript/coding.json` (frontend + CDN mirror)
- IDs: `js-dom-find-node`, `js-dom-twin-node`, `js-stack-queue-implementation`, `js-palindrome-check`, `js-maze-path`
- Old -> new:
  - `js-dom-find-node`: `3` -> `3`
  - `js-dom-twin-node`: `3` -> `3`
  - `js-stack-queue-implementation`: `1` -> `2`
  - `js-palindrome-check`: `1` -> `1`
  - `js-maze-path`: `1` -> `2`
- Rationale:
  - `js-dom-find-node`: Practical traversal pattern with moderate frontend interview relevance.
  - `js-dom-twin-node`: Useful DOM-index/path reasoning exercise with moderate practical signal.
  - `js-stack-queue-implementation`: Foundational data-structure exercise with low-to-moderate frontend-specific signal.
  - `js-palindrome-check`: Basic warm-up algorithm with low discriminative value for frontend roles.
  - `js-maze-path`: Classic traversal/search exercise with moderate coding-round relevance.
- Validation: `lint-questions` pass; frontend/CDN parity pass.
- Remaining in file: 18

### Batch 27
- File: `javascript/coding.json` (frontend + CDN mirror)
- IDs: `js-take-latest`, `js-promise-any`, `js-poll-until`, `js-fetch-json-timeout`, `js-stream-to-text`
- Old -> new:
  - `js-take-latest`: `3` -> `4`
  - `js-promise-any`: `5` -> `4`
  - `js-poll-until`: `3` -> `3`
  - `js-fetch-json-timeout`: `3` -> `4`
  - `js-stream-to-text`: `3` -> `3`
- Rationale:
  - `js-take-latest`: Common UI correctness pattern for search/typeahead race prevention.
  - `js-promise-any`: Useful async combinator internals question, but not universal top-priority across all loops.
  - `js-poll-until`: Practical utility with moderate relevance in real-world async workflows.
  - `js-fetch-json-timeout`: High practical frontend utility for robust API clients.
  - `js-stream-to-text`: Relevant streaming utility with moderate frontend interview frequency.
- Validation: `lint-questions` pass; frontend/CDN parity pass.
- Remaining in file: 13

### Batch 28
- File: `javascript/coding.json` (frontend + CDN mirror)
- IDs: `js-storage-ttl-cache`, `js-escape-html`, `js-validate-username`, `js-safe-json-parse`, `js-measure-duration`
- Old -> new:
  - `js-storage-ttl-cache`: `1` -> `3`
  - `js-escape-html`: `3` -> `3`
  - `js-validate-username`: `1` -> `2`
  - `js-safe-json-parse`: `1` -> `2`
  - `js-measure-duration`: `3` -> `3`
- Rationale:
  - `js-storage-ttl-cache`: Practical frontend caching utility with moderate real-world relevance.
  - `js-escape-html`: Security-oriented helper with steady practical/interview utility.
  - `js-validate-username`: Basic validation exercise with low-to-moderate signal.
  - `js-safe-json-parse`: Common defensive utility pattern with low-to-moderate signal.
  - `js-measure-duration`: Useful profiling wrapper pattern with moderate practical relevance.
- Validation: `lint-questions` pass; frontend/CDN parity pass.
- Remaining in file: 8

### Batch 29
- File: `javascript/coding.json` (frontend + CDN mirror)
- IDs: `js-create-cleanup-bag`, `js-format-date-timezone`, `js-create-spy-function`, `js-create-deferred-promise`, `js-create-lru-cache`
- Old -> new:
  - `js-create-cleanup-bag`: `3` -> `3`
  - `js-format-date-timezone`: `1` -> `3`
  - `js-create-spy-function`: `5` -> `4`
  - `js-create-deferred-promise`: `5` -> `4`
  - `js-create-lru-cache`: `3` -> `3`
- Rationale:
  - `js-create-cleanup-bag`: Useful lifecycle-cleanup utility with moderate practical frontend relevance.
  - `js-format-date-timezone`: Common real-world date/time correctness problem with meaningful interview utility.
  - `js-create-spy-function`: Strong testing-depth topic, but not universal top-priority across all loops.
  - `js-create-deferred-promise`: Useful async testing control pattern, but similarly not always top-priority.
  - `js-create-lru-cache`: Valuable bounded-memory/cache concept with moderate practical relevance.
- Validation: `lint-questions` pass; frontend/CDN parity pass.
- Remaining in file: 3

### Batch 30
- File: `javascript/coding.json` (frontend + CDN mirror)
- IDs: `js-run-with-perf-budget`, `js-resolve-package-exports`, `js-sanitize-href-url`
- Old -> new:
  - `js-run-with-perf-budget`: `5` -> `4`
  - `js-resolve-package-exports`: `1` -> `2`
  - `js-sanitize-href-url`: `3` -> `4`
- Rationale:
  - `js-run-with-perf-budget`: Strong practical profiling/perf-budget concept, but not universal top-priority in all interview loops.
  - `js-resolve-package-exports`: Useful bundler/runtime-depth topic with narrower frontend interview frequency.
  - `js-sanitize-href-url`: High-value security utility pattern with strong practical and interview relevance.
- Validation: `lint-questions` pass; frontend/CDN parity pass.
- Remaining in file: 0
