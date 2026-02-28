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
