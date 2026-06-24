// shared/guides/guide.registry.ts
import { Type } from '@angular/core';

export type GuideAuthor = {
    type: 'Organization' | 'Person';
    name: string;
};

export type GuideSeo = {
    title?: string;
    description?: string;
    primaryKeyword?: string;
    keywords?: string[];
    faqPage?: {
        name?: string;
        items: Array<{
            question: string;
            answer: string;
        }>;
    };
    itemList?: {
        name?: string;
        items: Array<{
            name: string;
            description?: string;
            url?: string;
        }>;
    };
    publishedAt?: string;
    updatedAt?: string;
    author?: GuideAuthor;
    draftSource?: string;
    searchIntent?: string;
    readerPromise?: string;
    uniqueAngle?: string;
    factCheckedAt?: string;
    reviewedBy?: string;
};

/** A single article entry */
export type GuideEntry = {
    slug: string;
    title: string;
    load: () => Promise<Type<any>>;
    minutes?: number;
    summary?: string;
    seo?: GuideSeo;
};

export type GuideGroup = {
    title: string;
    items: Array<{ slug: string }>;
};

export function navFor(
    registry: GuideEntry[],
    slug: string,
    base?: string
) {
    const idx = registry.findIndex(e => e.slug === slug);
    const current = idx >= 0 ? registry[idx] : null;

    const baseSeg = base ?? inferBase(registry) ?? '';
    const prev =
        idx > 0 ? (['/', 'guides', baseSeg, registry[idx - 1].slug] as any[]) : null;
    const next =
        idx >= 0 && idx < registry.length - 1
            ? (['/', 'guides', baseSeg, registry[idx + 1].slug] as any[])
            : null;

    return { current, prev, next, idx };
}

function inferBase(registry: GuideEntry[]): string | null {
    if (registry === PLAYBOOK) return 'interview-blueprint';
    if (registry === SYSTEM) return 'system-design-blueprint';
    if (registry === BEHAVIORAL) return 'behavioral';
    return null;
}

/* ---------------------------------- PLAYBOOK ---------------------------------- */

export const PLAYBOOK: GuideEntry[] = [
    {
        slug: 'intro',
        title: 'Frontend Interview Preparation Guide (2026): Rounds, Roadmap, Questions',
        minutes: 16,
        summary: 'Understand frontend interview rounds, what hiring teams evaluate, which questions to practice, and how to follow a realistic prep roadmap.',
        seo: {
            title: 'Frontend Interview Preparation Guide (2026): Rounds, Roadmap, Questions',
            description: 'Prepare for frontend interviews with a 2026 guide to rounds, coding and UI questions, system design, behavioral prep, and a 30-day roadmap.',
            primaryKeyword: 'frontend interview preparation guide',
            keywords: [
                'frontend interview preparation guide',
                'frontend interview prep guide',
                'frontend interview roadmap',
                'frontend interview questions',
                'frontend developer interview preparation',
                'front end interview prep',
                '30 day frontend interview roadmap',
                'frontend coding interview preparation',
                'frontend UI interview preparation',
                'frontend system design interview preparation',
            ],
            faqPage: {
                name: 'Frontend interview preparation guide FAQ',
                items: [
                    {
                        question: 'How should I prepare for a frontend interview in 2026?',
                        answer: 'Start with JavaScript and browser fundamentals, then practice frontend coding prompts, UI component builds, frontend system design, and behavioral stories in a weekly sequence instead of jumping randomly between topics.',
                    },
                    {
                        question: 'What rounds are common in frontend interviews?',
                        answer: 'Most frontend loops include a recruiter screen, a live coding or JavaScript round, a UI or machine-coding task, sometimes a frontend system design round, and a behavioral or hiring manager conversation.',
                    },
                    {
                        question: 'Do frontend interviews include algorithms?',
                        answer: 'Yes, but frontend candidates usually see practical data structures, async code, DOM problems, array and map transformations, and moderate algorithms rather than deep competitive-programming puzzles.',
                    },
                    {
                        question: 'How long does frontend interview preparation take?',
                        answer: 'A focused 30-day plan works for candidates with existing frontend experience. Newer candidates should use a 4-6 week plan that leaves more time for fundamentals, UI builds, and mock interviews.',
                    },
                    {
                        question: 'What should senior frontend engineers practice?',
                        answer: 'Senior candidates should practice frontend system design, architecture trade-offs, performance, accessibility, testing strategy, and clear communication around product constraints and team decisions.',
                    },
                    {
                        question: 'What is the best way to practice frontend interview questions?',
                        answer: 'Use timed reps: solve one JavaScript or UI prompt, explain your approach out loud, test edge cases, then write a short retro that links the miss to the next focused practice block.',
                    },
                ],
            },
            readerPromise: 'Use this frontend interview preparation guide to understand the 2026 interview loop, pick the right practice roadmap, and move into coding, UI, system design, and behavioral drills with clear next steps.',
            publishedAt: '2025-08-30',
            updatedAt: '2026-06-04',
            author: {
                type: 'Organization',
                name: 'FrontendAtlas Team',
            },
            factCheckedAt: '2026-06-04',
            reviewedBy: 'FrontendAtlas',
        },
        load: () =>
            import('../../features/guides/playbook/fe-intro-article.component')
                .then(m => m.FeIntroArticle),
    },
    {
        slug: 'coding-interviews',
        title: 'Frontend Coding Interview Questions and Prep Guide (2026)',
        minutes: 18,
        summary: 'Prepare for frontend coding interviews with UI coding prompts, JavaScript utilities, most-asked practice links, a scoring rubric, and 45/60-minute strategies.',
        seo: {
            title: 'Frontend Coding Interview Questions and Prep Guide (2026)',
            description: 'Prepare for frontend coding interviews with UI coding questions, JS utilities, most-asked machine coding prompts, live practice links, rubric, and strategy.',
            primaryKeyword: 'frontend coding interview questions',
            keywords: [
                'frontend coding interview questions',
                'frontend coding interview prep',
                'frontend machine coding questions',
                'frontend UI coding interview questions',
                'React UI coding interview questions',
                'JavaScript coding interview questions',
                'frontend coding interview practice',
                'UI component coding interview questions',
                'frontend coding rounds',
            ],
            faqPage: {
                name: 'Frontend coding interview questions and prep guide FAQ',
                items: [
                    {
                        question: 'What questions are asked in frontend coding interviews?',
                        answer: 'Frontend coding interviews usually mix UI component prompts, JavaScript utility functions, async bugs, browser behavior, CSS/layout details, framework state questions, and follow-up discussion about accessibility, testing, and performance.',
                    },
                    {
                        question: 'How do I prepare for a frontend coding interview?',
                        answer: 'Practice timed frontend coding prompts, start with requirements and a small working version, add edge cases, explain tradeoffs out loud, and review one miss after every session before moving to the next problem.',
                    },
                    {
                        question: 'Is a frontend coding interview the same as LeetCode?',
                        answer: 'No. Some roles include algorithms, but frontend coding interviews often reward product UI behavior, DOM or framework state, async correctness, accessibility, and practical debugging more than pure data-structure puzzles.',
                    },
                    {
                        question: 'Should I use React or vanilla JavaScript in frontend coding interviews?',
                        answer: 'Use the tool the interviewer allows and your target role expects. React is common for UI rounds, but vanilla JavaScript fundamentals still matter for event handling, promises, DOM behavior, debounce, throttle, and state timing.',
                    },
                    {
                        question: 'How are frontend UI coding interviews evaluated?',
                        answer: 'Interviewers score visible correctness, state design, component boundaries, async behavior, empty/loading/error states, accessibility, tests or manual verification, and how clearly you narrate tradeoffs under time pressure.',
                    },
                    {
                        question: 'What should I do in the first 10 minutes of a 60-minute coding interview?',
                        answer: 'Clarify the prompt, define the smallest working scope, list edge cases, sketch state and events, then start shipping a visible baseline before adding polish or abstractions.',
                    },
                ],
            },
            itemList: {
                name: '25 frontend coding interview questions to practice',
                items: [
                    { name: 'Build accessible autocomplete with debounce and keyboard selection', description: 'Tests async state, stale responses, focus management, loading states, and accessible suggestion behavior.', url: '#question-1' },
                    { name: 'Implement a dropdown menu with mouse, keyboard, and Escape behavior', description: 'Tests event handling, focus movement, outside-click handling, and accessible trigger/menu state.', url: '#question-2' },
                    { name: 'Build a modal dialog with focus trap and dismissal behavior', description: 'Tests portals or overlays, keyboard handling, body scroll control, and accessible labeling.', url: '#question-3' },
                    { name: 'Create tabs with roving keyboard focus', description: 'Tests component state, ARIA tab semantics, controlled selection, and predictable keyboard navigation.', url: '#question-4' },
                    { name: 'Build an accordion or FAQ component', description: 'Tests controlled and uncontrolled state, multiple-open behavior, and semantic disclosure patterns.', url: '#question-5' },
                    { name: 'Implement a star rating component', description: 'Tests hover state, keyboard input, form value handling, precision, and reusable component API design.', url: '#question-6' },
                    { name: 'Build a paginated and sortable data table', description: 'Tests derived state, row identity, sorting, pagination, empty states, and scalable rendering.', url: '#question-7' },
                    { name: 'Build a nested checkbox tree with indeterminate parents', description: 'Tests recursive data, derived selection state, parent-child propagation, and edge cases.', url: '#question-8' },
                    { name: 'Implement a file explorer tree from nested JSON', description: 'Tests recursion, expansion state, keyboard-friendly structure, and async-loading follow-ups.', url: '#question-9' },
                    { name: 'Build a multi-step form with validation and persisted draft state', description: 'Tests form state, validation timing, persistence, navigation, and recovery from invalid input.', url: '#question-10' },
                    { name: 'Implement debounce', description: 'Tests timers, closures, cancellation, argument forwarding, and this binding.', url: '#question-11' },
                    { name: 'Implement throttle', description: 'Tests timer scheduling, leading/trailing calls, and high-frequency event control.', url: '#question-12' },
                    { name: 'Implement once or memoize', description: 'Tests closures, cache keys, return values, and repeated-call behavior.', url: '#question-13' },
                    { name: 'Build a promise pool with a concurrency limit', description: 'Tests async control flow, queues, ordering, errors, and resource limits.', url: '#question-14' },
                    { name: 'Implement a cancellable fetch wrapper that ignores stale responses', description: 'Tests AbortController, request identity, race conditions, and stale UI prevention.', url: '#question-15' },
                    { name: 'Write an event delegation helper for dynamic list items', description: 'Tests DOM traversal, bubbling, matching selectors, and cleanup.', url: '#question-16' },
                    { name: 'Build an LRU cache for API responses', description: 'Tests maps, ordering, eviction policy, and performance tradeoffs.', url: '#question-17' },
                    { name: 'Flatten nested data or safely deep clone an object', description: 'Tests recursion, circular references, arrays, objects, and practical limits.', url: '#question-18' },
                    { name: 'Explain async versus defer and script loading behavior', description: 'Tests browser parsing, resource loading, execution order, and render-blocking impact.', url: '#question-19' },
                    { name: 'Debug event loop ordering with promises and timers', description: 'Tests microtasks, macrotasks, rendering timing, and async explanation quality.', url: '#question-20' },
                    { name: 'Fix layout shift in a responsive card grid', description: 'Tests CSS layout, image sizing, content constraints, and Core Web Vitals awareness.', url: '#question-21' },
                    { name: 'Build responsive navigation with an accessible mobile menu', description: 'Tests CSS, semantic buttons, focus behavior, viewport constraints, and interaction states.', url: '#question-22' },
                    { name: 'Debug stale state in a React search component', description: 'Tests hooks, closures, effects, request races, and derived state.', url: '#question-23' },
                    { name: 'Build an optimistic todo list with rollback on failure', description: 'Tests mutation state, error recovery, temporary IDs, and user feedback.', url: '#question-24' },
                    { name: 'Design a shopping cart or transfer list with derived totals and selection', description: 'Tests state modeling, derived values, immutable updates, and product edge cases.', url: '#question-25' },
                ],
            },
            readerPromise: 'Use this frontend coding interview questions and prep guide to map likely coding prompts, understand the scoring rubric, practice a 45/60-minute strategy, and move into hands-on FrontendAtlas drills.',
            publishedAt: '2025-08-30',
            updatedAt: '2026-06-06',
            author: {
                type: 'Organization',
                name: 'FrontendAtlas Team',
            },
            factCheckedAt: '2026-06-06',
            reviewedBy: 'FrontendAtlas',
        },
        load: () =>
            import('../../features/guides/playbook/fe-coding-article.component')
                .then(m => m.FeCodingArticle),
    },
    {
        slug: 'javascript-interviews',
        title: 'JavaScript Coding Interview Questions and Patterns for Frontend Engineers (2026)',
        minutes: 18,
        summary: 'Practice frontend JavaScript coding interview questions with async, closures, DOM, promises, utility prompts, worked examples, and direct drills.',
        seo: {
            title: 'JavaScript Coding Interview Questions: Frontend Practice',
            description: 'Practice frontend JavaScript coding interview questions with debounce, throttle, Promise.all, event loop, closures, DOM delegation, EventEmitter, and drills.',
            primaryKeyword: 'javascript coding interview questions',
            keywords: [
                'javascript coding interview questions',
                'frontend javascript interview questions',
                'javascript interview practice',
                'javascript interview patterns',
                'javascript utility function interview questions',
                'most asked javascript coding interview questions',
                'frontend javascript coding interview questions',
                'javascript async interview questions',
                'javascript promise interview questions',
                'implement promise all javascript interview question',
                'promise all vs allsettled race any interview',
                'javascript event loop interview questions',
                'javascript output questions interview',
                'microtasks vs macrotasks interview question',
                'async await event loop interview question',
                'promise settimeout output interview question',
                'javascript debounce interview question',
                'implement debounce javascript interview',
                'javascript throttle interview question',
                'debounce vs throttle javascript interview',
                'event emitter javascript interview question',
                'lru cache javascript interview question',
                'javascript closure interview questions frontend',
                'this bind call apply javascript interview',
                'implement bind javascript interview question',
                'prototype chain javascript interview question',
                'implement new operator javascript interview',
                'instanceof javascript interview question',
                'array reduce javascript interview question',
                'groupby javascript interview question',
                'flatten array javascript interview question',
                'deep clone javascript interview question',
                'deep equal javascript interview question',
                'event delegation javascript interview question',
            ],
            faqPage: {
                name: 'JavaScript coding interview questions practice map FAQ',
                items: [
                    {
                        question: 'What are the most asked JavaScript coding interview questions?',
                        answer: 'Common prompts include debounce, throttle, Promise.all, event loop tracing, closures, this binding, array helpers, deep clone/equal, EventEmitter, and DOM event delegation.',
                    },
                    {
                        question: 'How should I practice JavaScript utility function interview questions?',
                        answer: 'Start with one direct drill, state the input/output contract, name edge cases, implement a baseline, then test cancellation, ordering, context, empty input, and repeated calls.',
                    },
                    {
                        question: 'Which JavaScript promise interview questions should I practice?',
                        answer: 'Prioritize Promise.all, Promise combinators, sleep, concurrency-limited map, takeLatest, and stale-response handling because they expose ordering, rejection, and async race behavior.',
                    },
                    {
                        question: 'How do I prepare for JavaScript event loop output questions?',
                        answer: 'Trace sync code first, then microtasks, then macrotasks. Write the expected output before running, and explain how await schedules the continuation as promise work.',
                    },
                    {
                        question: 'Is this different from JavaScript interview questions and answers?',
                        answer: 'Yes. The JavaScript interview questions and answers hub is for short-answer concept review. This guide is a practice map that connects high-frequency patterns to direct coding and concept drills.',
                    },
                ],
            },
            itemList: {
                name: '25 JavaScript coding interview questions to practice',
                items: [
                    { name: 'Implement debounce with trailing, leading, and cancel behavior', description: 'Tests timers, closures, argument forwarding, this binding, and leading/trailing policy.', url: '/javascript/coding/js-debounce' },
                    { name: 'Implement throttle for scroll or resize events', description: 'Tests timer windows, leading and trailing calls, dropped events, and cleanup.', url: '/javascript/coding/js-throttle' },
                    { name: 'Implement Promise.all with fail-fast semantics', description: 'Tests async ordering, rejection behavior, empty input, and non-promise values.', url: '/javascript/coding/js-promise-all' },
                    { name: 'Choose between Promise.all, allSettled, race, and any', description: 'Tests promise combinator tradeoffs around partial failure, first result, and first fulfillment.', url: '/javascript/trivia/js-promise-combinators-all-allsettled-race-any' },
                    { name: 'Trace event loop output with promises and timers', description: 'Tests sync execution, promise microtasks, timers, and output reasoning.', url: '/javascript/trivia/js-event-loop' },
                    { name: 'Explain microtasks versus macrotasks', description: 'Tests event loop priority, Promise callbacks, timers, and async/await continuation timing.', url: '/javascript/trivia/js-microtasks-vs-macrotasks' },
                    { name: 'Implement sleep or delay as a Promise utility', description: 'Tests Promise construction, timer resolution, and async testability.', url: '/javascript/coding/js-sleep' },
                    { name: 'Build a concurrency-limited async map', description: 'Tests queues, ordering, resource limits, and async error handling.', url: '/javascript/coding/js-concurrency-map-limit' },
                    { name: 'Implement takeLatest to ignore stale async responses', description: 'Tests request identity, race conditions, cancellation strategy, and stale UI prevention.', url: '/javascript/coding/js-take-latest' },
                    { name: 'Explain closures with a stateful counter or callback example', description: 'Tests lexical scope, retained state, stale callbacks, and memory reasoning.', url: '/javascript/trivia/js-closures' },
                    { name: 'Implement Function.prototype.bind', description: 'Tests this binding, partial arguments, function wrappers, and native-like behavior.', url: '/javascript/coding/js-implement-bind' },
                    { name: 'Implement the new operator', description: 'Tests constructor calls, prototype assignment, explicit return values, and object creation.', url: '/javascript/coding/js-implement-new' },
                    { name: 'Implement instanceof using the prototype chain', description: 'Tests prototype traversal, null boundaries, and object identity reasoning.', url: '/javascript/coding/js-implement-instanceof' },
                    { name: 'Implement Array.prototype.map', description: 'Tests callback arguments, return arrays, holes, and non-mutating transformations.', url: '/javascript/coding/js-array-prototype-map' },
                    { name: 'Implement Array.prototype.reduce', description: 'Tests accumulator state, initial value behavior, empty arrays, and callback order.', url: '/javascript/coding/js-array-prototype-reduce' },
                    { name: 'Explain when to use map, filter, or reduce', description: 'Tests array transformation judgment and readable data-shaping explanations.', url: '/javascript/trivia/js-map-filter-reduce' },
                    { name: 'Implement groupBy for UI-ready data shaping', description: 'Tests key generation, duplicate keys, empty input, object vs Map tradeoffs, and output shape.', url: '/javascript/coding/js-group-by' },
                    { name: 'Flatten nested arrays to a given depth', description: 'Tests recursion, depth boundaries, nested arrays, and iterative alternatives.', url: '/javascript/coding/js-flatten-depth' },
                    { name: 'Implement deep clone and name unsupported values', description: 'Tests nested objects, arrays, dates, functions, cycles, and reference identity.', url: '/javascript/coding/js-deep-clone' },
                    { name: 'Implement deep equal for nested arrays and objects', description: 'Tests recursive comparison, key order, primitives, arrays, and object references.', url: '/javascript/coding/js-deep-equal' },
                    { name: 'Build a mini EventEmitter', description: 'Tests subscribe, emit, unsubscribe, listener ordering, once behavior, and mutation during emit.', url: '/javascript/coding/js-event-emitter-mini' },
                    { name: 'Write a delegated event handler for dynamic elements', description: 'Tests bubbling, closest target lookup, containment, dynamic children, and cleanup.', url: '/javascript/coding/js-delegated-events-2' },
                    { name: 'Implement curry for fixed-arity functions', description: 'Tests closures, argument accumulation, arity, and repeated partial calls.', url: '/javascript/coding/js-curry-function' },
                    { name: 'Implement memoize with a clear cache-key policy', description: 'Tests caching, key generation, repeated calls, invalidation limits, and memory growth.', url: '/javascript/coding/js-memoize-function' },
                    { name: 'Build an LRU cache with bounded memory', description: 'Tests Map ordering, recency updates, eviction policy, and memory constraints.', url: '/javascript/coding/js-create-lru-cache' },
                ],
            },
            publishedAt: '2025-09-27',
            updatedAt: '2026-06-05',
            author: {
                type: 'Organization',
                name: 'FrontendAtlas Team',
            },
            readerPromise: 'Use this JavaScript coding interview map to choose high-frequency async, closure, promise, DOM, and utility-function drills, then move into direct FrontendAtlas practice links.',
            factCheckedAt: '2026-06-05',
            reviewedBy: 'FrontendAtlas',
        },
        load: () =>
            import('../../features/guides/playbook/js-problems-article.component')
                .then(m => m.JsProblemsArticle),
    },
    {
        slug: 'dsa-for-fe',
        title: 'DSA for Frontend Interviews: Data Structures, Algorithms, and Practice Map (2026)',
        minutes: 18,
        summary: 'Practice DSA for frontend interviews with frontend algorithm questions, arrays, hash maps, stacks, queues, LRU cache, Big-O, and JavaScript drills.',
        seo: {
            title: 'DSA for Frontend Interviews: Questions & JS Drills',
            description: 'Practice DSA for frontend interviews with algorithm interview questions, arrays, hash maps, stacks, queues, LRU cache, Big-O, and JavaScript drills.',
            primaryKeyword: 'dsa for frontend interviews',
            keywords: [
                'dsa for frontend interviews',
                'frontend dsa interview prep',
                'frontend algorithm interview questions',
                'javascript data structures interview',
                'frontend data structures and algorithms',
                'frontend coding interview dsa',
                'data structures and algorithms for frontend interviews',
                'dsa for frontend developers',
                'frontend algorithms interview',
                'frontend coding interview algorithms',
                'frontend algorithm patterns',
                'frontend algorithm questions javascript',
                'javascript dsa interview questions',
                'javascript dsa practice',
                'javascript data structures and algorithms interview',
                'implement stack queue javascript interview',
                'groupby javascript interview question',
                'flatten array javascript interview question',
                'array reduce interview question',
                'frontend big o interview',
                'lru cache frontend interview',
                'tree traversal frontend interview',
                'frontend recursion interview questions',
                'array shift o(n) interview',
                'javascript concurrency limit interview question',
                'take latest javascript interview question',
                'is dsa required for frontend interviews',
                'do frontend interviews ask algorithms',
                'do frontend developers need dsa',
                'how much leetcode for frontend interviews',
                'what dsa should frontend developers know',
                'frontend dsa roadmap',
                'frontend dsa study plan',
                'frontend dsa cheat sheet',
                'dsa for frontend interviews 1 week plan',
                'frontend algorithm interview prep plan',
            ],
            faqPage: {
                name: 'DSA for frontend interviews FAQ',
                items: [
                    {
                        question: 'Is DSA required for frontend interviews?',
                        answer: 'Basic DSA is often required. Frontend algorithm interview questions usually emphasize arrays, hash maps, stacks, queues, recursion, tree traversal, and Big-O reasoning more than obscure algorithms.',
                    },
                    {
                        question: 'Do frontend interviews ask algorithm questions?',
                        answer: 'Yes, many frontend interviews ask algorithm questions, but the strongest signal is usually practical JavaScript data work: grouping, deduping, traversal, caching, async queues, and explaining complexity.',
                    },
                    {
                        question: 'What DSA should frontend engineers prioritize?',
                        answer: 'Prioritize arrays, strings, Map, Set, stack, queue, recursion, tree DFS/BFS, sorting/search basics, LRU cache, and the ability to explain complexity clearly.',
                    },
                    {
                        question: 'How should I practice JavaScript DSA for frontend interviews?',
                        answer: 'Start with JavaScript DSA practice drills for reduce, groupBy, flatten, stack/queue, LRU cache, concurrency limits, and takeLatest. Then dry run edge cases and explain the Big-O trade-off for each solution.',
                    },
                    {
                        question: 'How much LeetCode should I do for frontend interviews?',
                        answer: 'Do enough to recognize common patterns, then shift to frontend-flavored drills. Random grinding is lower ROI than practicing data shaping, nested traversal, cache, and async queue prompts.',
                    },
                ],
            },
            itemList: {
                name: '20 frontend DSA questions to practice',
                items: [
                    { name: 'Implement Array.prototype.reduce', description: 'Tests accumulator state, initial value behavior, empty arrays, and callback order.', url: '/javascript/coding/js-array-prototype-reduce' },
                    { name: 'Remove duplicates with Set', description: 'Tests identity, output order, primitive vs object values, and O(n) dedupe.', url: '#question-2' },
                    { name: 'Count values with a frequency map', description: 'Tests key normalization, missing keys, repeated values, and object vs Map trade-offs.', url: '#question-3' },
                    { name: 'Group records by status or category', description: 'Tests derived keys, empty input, duplicate keys, and UI-ready output shape.', url: '/javascript/coding/js-group-by' },
                    { name: 'Flatten nested arrays to a requested depth', description: 'Tests recursion, depth boundary, mixed primitives, and iterative alternatives.', url: '/javascript/coding/js-flatten-depth' },
                    { name: 'Deep clone nested UI state', description: 'Tests arrays, objects, dates, cycles, unsupported values, and reference identity.', url: '/javascript/coding/js-deep-clone' },
                    { name: 'Deep equal two state snapshots', description: 'Tests recursive comparison, key order, arrays, primitives, and object references.', url: '/javascript/coding/js-deep-equal' },
                    { name: 'Implement stack and queue in JavaScript', description: 'Tests push/pop, enqueue/dequeue, peek, size, and O(1) queue strategy.', url: '/javascript/coding/js-stack-queue-implementation' },
                    { name: 'Model undo/redo with two stacks', description: 'Tests past/future state, clearing redo on new action, and empty history behavior.', url: '/javascript/coding/js-stack-queue-implementation' },
                    { name: 'Traverse nested comments with DFS or BFS', description: 'Tests traversal order, empty children, recursion depth, and cycle assumptions.', url: '#question-10' },
                    { name: 'Sort and paginate table rows', description: 'Tests comparator correctness, stable tie-breakers, derived pages, and empty states.', url: '#question-11' },
                    { name: 'Binary search a sorted ID list', description: 'Tests left/right bounds, insertion points, not-found behavior, and off-by-one safety.', url: '#question-12' },
                    { name: 'Detect repeated values in a list', description: 'Tests Set membership, early return, object identity, and O(n) vs O(n^2).', url: '#question-13' },
                    { name: 'Merge simple calendar intervals', description: 'Tests sorting, overlap policy, adjacent boundaries, and empty input.', url: '#question-14' },
                    { name: 'Build an LRU cache with bounded memory', description: 'Tests Map ordering, get/put complexity, eviction, and capacity edge cases.', url: '/javascript/coding/js-create-lru-cache' },
                    { name: 'Build a concurrency-limited async map', description: 'Tests queues, ordering, resource limits, failures, and async control flow.', url: '/javascript/coding/js-concurrency-map-limit' },
                    { name: 'Implement takeLatest to ignore stale async responses', description: 'Tests request identity, cancellation strategy, race conditions, and stale UI prevention.', url: '/javascript/coding/js-take-latest' },
                    { name: 'Choose stack vs queue for a frontend workflow', description: 'Tests LIFO/FIFO reasoning, queue implementation cost, and UI behavior fit.', url: '/javascript/trivia/js-queue-vs-stack' },
                    { name: 'Spot the Array.shift performance bug', description: 'Tests queue complexity, head-index alternatives, and performance explanation.', url: '/javascript/trivia/js-queue-vs-stack' },
                    { name: 'Explain the Big-O trade-off for a large filtered list', description: 'Tests when to preindex with Map, when to spend memory, and how to justify trade-offs.', url: '#question-20' },
                ],
            },
            publishedAt: '2025-09-27',
            updatedAt: '2026-06-06',
            author: {
                type: 'Organization',
                name: 'FrontendAtlas Team',
            },
            readerPromise: 'Use this DSA for frontend interviews practice map to prioritize arrays, hash maps, stacks, queues, recursion, cache, Big-O, and frontend algorithm interview questions, then move into direct JavaScript practice.',
            factCheckedAt: '2026-06-06',
            reviewedBy: 'FrontendAtlas',
        },
        load: () =>
            import('../../features/guides/playbook/fe-dsa-article.component')
                .then(m => m.FeDsaArticle),
    },
    {
        slug: 'ui-interviews',
        title: 'Frontend UI Interview Questions: Build Accessible Components Under Time',
        minutes: 22,
        summary: 'Practice frontend UI interview questions with modal, autocomplete, forms, tabs, accordion, data table, model answers, scoring rubrics, accessibility, keyboard support, and direct component drills.',
        seo: {
            title: 'Frontend UI Interview Questions: Component Coding Practice',
            description: 'Practice frontend UI interview questions with modal, autocomplete, tabs, data tables, model answers, senior rubrics, accessibility, and keyboard support.',
            primaryKeyword: 'frontend ui interview questions',
            keywords: [
                'frontend ui interview questions',
                'frontend ui coding interview',
                'frontend ui interview practice',
                'frontend component interview questions',
                'frontend component coding interview',
                'ui component interview questions',
                'react ui coding interview',
                'react component coding interview questions',
                'accessible component interview',
                'frontend accessibility interview questions',
                'keyboard accessibility interview questions frontend',
                'focus trap modal interview question',
                'aria tabs interview question',
                'frontend form validation interview question',
                'ui interview scoring rubric',
            ],
            faqPage: {
                name: 'Frontend UI interview questions FAQ',
                items: [
                    {
                        question: 'What are the most common frontend UI interview questions?',
                        answer: 'Common frontend UI interview questions include modal dialogs, autocomplete, tabs, accordion, data tables, nested checkboxes, forms, star rating, and nested comments.',
                    },
                    {
                        question: 'How do I practice frontend UI coding interview questions?',
                        answer: 'Practice one component at a time under 45 to 60 minutes. Ship the MVP first, then add keyboard support, ARIA semantics, responsive styling, edge cases, and a short trade-off explanation.',
                    },
                    {
                        question: 'Which React UI component questions should I practice?',
                        answer: 'Start with autocomplete, tabs, accordion, data table pagination, nested checkbox tree, nested comments, star rating, chips autocomplete, and progress bar drills.',
                    },
                    {
                        question: 'How do interviewers score accessibility and keyboard support?',
                        answer: 'Accessibility is core correctness. Interviewers expect labels, semantic controls, focus management, keyboard paths, visible focus, and clear disabled or error states.',
                    },
                    {
                        question: 'Is this different from frontend machine coding interviews?',
                        answer: 'It overlaps with frontend machine coding interviews, but this page narrows the scope to UI component execution. Broader machine coding rounds can also include data fetching, routing, app state, and larger product workflows.',
                    },
                    {
                        question: 'What should a senior answer include in a UI interview?',
                        answer: 'A senior answer should state the behavior contract, ship an MVP, explain state ownership, harden keyboard and accessibility, cover failure states, and describe tests or trade-offs out loud.',
                    },
                ],
            },
            itemList: {
                name: '12 frontend UI interview questions and component prompts to practice',
                items: [
                    { name: 'Modal / Confirm Dialog', description: 'Tests accessible modal behavior, open, confirm, cancel, close, accessible naming, Escape, outside click policy, and focus trap.', url: '/html/coding/html-dialog-confirm-a11y' },
                    { name: 'Autocomplete', description: 'Tests React autocomplete filtering, selection, debounce, loading, empty results, and stale response policy.', url: '/react/coding/react-autocomplete-search-starter' },
                    { name: 'Contact Form', description: 'Tests accessible form validation, labels, required fields, disabled submit, and error recovery.', url: '/react/coding/react-contact-form-starter' },
                    { name: 'Tabs', description: 'Tests React tabs active panel state, roving tabindex, ARIA tabs linkage, and Home/End keys.', url: '/react/coding/react-tabs-switcher' },
                    { name: 'Accordion', description: 'Tests React accordion expand/collapse state, single vs multi-open policy, button semantics, and keyboard toggles.', url: '/react/coding/react-accordion-faq' },
                    { name: 'Data Table / Pagination', description: 'Tests React data table pagination, page bounds, derived rows, disabled controls, empty pages, and table semantics.', url: '/react/coding/react-pagination-table' },
                    { name: 'Dynamic Table', description: 'Tests changing columns, stable keys, missing values, header mapping, and sort follow-up.', url: '/react/coding/react-dynamic-table' },
                    { name: 'Nested Checkbox Tree', description: 'Tests React nested checkbox parent-child sync, indeterminate state, DFS updates, partial selection, and reset.', url: '/react/coding/react-nested-checkboxes' },
                    { name: 'Nested Comments', description: 'Tests React nested comments recursive rendering, active reply input, empty replies, stable IDs, and nested UI state.', url: '/react/coding/react-nested-comments' },
                    { name: 'Star Rating', description: 'Tests React star rating hover vs committed state, keyboard input, reset, and accessible labels.', url: '/react/coding/react-star-rating' },
                    { name: 'Chips Autocomplete', description: 'Tests tag creation, duplicate prevention, keyboard removal, suggestions, and empty input.', url: '/react/coding/react-chips-input-autocomplete' },
                    { name: 'Progress Bar', description: 'Tests bounded values, ARIA progressbar, threshold colors, and reduced motion.', url: '/react/coding/react-progress-bar-thresholds' },
                ],
            },
            publishedAt: '2025-09-27',
            updatedAt: '2026-06-21',
            author: {
                type: 'Organization',
                name: 'FrontendAtlas Team',
            },
            readerPromise: 'Use this frontend UI interview questions practice map to prioritize common component prompts, model strong answers, score your solution with a rubric, and drill accessibility, keyboard support, and React/HTML/CSS execution under time pressure.',
            factCheckedAt: '2026-06-21',
            reviewedBy: 'FrontendAtlas',
        },
        load: () =>
            import('../../features/guides/playbook/fe-ui-in-60.component')
                .then(m => m.FeUiIn60Article),
    },
    {
        slug: 'api-design',
        title: 'Component API Design for Frontend Interviews: Props, Events, and Trade-offs',
        minutes: 22,
        summary: 'Practice component API design for frontend interviews with React props, events, a decision matrix, interactive API surface trade-offs, TypeScript guardrails, library patterns, accessibility, and direct UI drills.',
        seo: {
            title: 'Component API Design for Frontend Interviews',
            description: 'Practice component API design for frontend interviews with React props, events, slots, controlled state, compound components, accessibility, and UI drills.',
            primaryKeyword: 'component api design',
            keywords: [
                'component api design',
                'frontend component api design',
                'react component api design',
                'reusable component api design',
                'component api design for frontend interviews',
                'component api design interview',
                'frontend component api interview practice',
                'controlled vs uncontrolled component api',
                'state ownership component api',
                'compound components interview',
                'props vs slots component api',
                'component event payload design',
                'accessibility as component api',
                'react component props typescript',
                'typescript component api design',
                'radix aschild component api',
                'modal component api design',
                'tabs component api design',
                'autocomplete component api design',
                'data table component api design',
            ],
            faqPage: {
                name: 'Component API design for frontend interviews FAQ',
                items: [
                    {
                        question: 'What is component API design?',
                        answer: 'Component API design is the way you define how another engineer consumes your component: props, events, slots, state ownership, accessibility labels, styling hooks, and escape hatches.',
                    },
                    {
                        question: 'How do I practice component API design for frontend interviews?',
                        answer: 'Pick a real prompt like Modal, Tabs, Autocomplete, or Data Table. Name the API contract first, then implement the MVP, keyboard support, a11y contract, styling surface, and trade-offs.',
                    },
                    {
                        question: 'What is the controlled vs uncontrolled component API pattern?',
                        answer: 'Say who owns the state. Controlled components receive state and callbacks from the parent; uncontrolled components manage local state but can expose defaults and change events.',
                    },
                    {
                        question: 'When should I use compound components or slots?',
                        answer: 'Use compound components or slots when the content shape varies, such as Modal, Tabs, Accordion, Menu, or Table prompts. Use simple props for stable, small choices.',
                    },
                    {
                        question: 'How should component APIs expose events and accessibility?',
                        answer: 'Prefer domain payloads like onSelect({ value, item, reason }) instead of raw DOM events. Accessibility is part of the public API too: labels, ids, ARIA relationships, keyboard behavior, visible focus, and focus restore should be named in the contract.',
                    },
                    {
                        question: 'How should TypeScript shape a component API?',
                        answer: 'TypeScript should make invalid component states harder to express. Use native prop mirroring, controlled/uncontrolled unions, mutually exclusive props, discriminated unions, and ref forwarding only where they clarify the public contract.',
                    },
                    {
                        question: 'Which real library patterns help in component API interviews?',
                        answer: 'Useful patterns include React controlled/uncontrolled state, Radix asChild composition, MUI slotProps, React Aria hooks, and Headless UI render props. Use them as reference points, not as APIs to copy blindly.',
                    },
                    {
                        question: 'How is this component API design guide reviewed?',
                        answer: 'FrontendAtlas reviews this guide against UI component drills, live coding editor checks, and interview blueprint scoring rubrics so the advice stays tied to timed interview execution.',
                    },
                    {
                        question: 'How do I choose between prop-heavy, composed, and controlled component APIs?',
                        answer: 'Use a prop-heavy API only for a small stable surface, use composition when callers need custom content, and use controlled state when a parent must coordinate validation, analytics, reset, loading, or URL state.',
                    },
                ],
            },
            itemList: {
                name: '10 component API design interview prompts to practice',
                items: [
                    { name: 'Modal / Confirm Dialog API', description: 'Practice open/defaultOpen/onOpenChange, slots, focus restore, Escape policy, and a11y contract.', url: '/html/coding/html-dialog-confirm-a11y' },
                    { name: 'Tabs API', description: 'Practice value/defaultValue/onValueChange, item ids, disabled tabs, roving tabindex, and tabpanel linkage.', url: '/react/coding/react-tabs-switcher' },
                    { name: 'Accordion API', description: 'Practice single vs multiple state, value/defaultValue, collapsible behavior, disabled items, and button semantics.', url: '/react/coding/react-accordion-faq' },
                    { name: 'Autocomplete / Combobox API', description: 'Practice input value vs selected value, async loading/error/empty states, stale responses, and renderOption.', url: '/react/coding/react-autocomplete-search-starter' },
                    { name: 'Contact Form API', description: 'Practice field schema, validation timing, onSubmit(values), accessible errors, and disabled submit.', url: '/react/coding/react-contact-form-starter' },
                    { name: 'Data Table / Pagination API', description: 'Practice rows, columns, page/pageSize, onPageChange, cell renderers, and empty states.', url: '/react/coding/react-pagination-table' },
                    { name: 'Dynamic Table API', description: 'Practice column descriptors, accessors, header labels, fallback renderers, and stable row keys.', url: '/react/coding/react-dynamic-table' },
                    { name: 'Nested Checkbox Tree API', description: 'Practice selected ids, onCheckedChange(ids), indeterminate state, disabled nodes, and parent-child sync.', url: '/react/coding/react-nested-checkboxes' },
                    { name: 'Star Rating API', description: 'Practice value, max, readOnly, onValueChange, hover preview, keyboard input, and accessible labels.', url: '/react/coding/react-star-rating' },
                    { name: 'Progress Bar API', description: 'Practice value/min/max, threshold colors, labels, reduced motion, ARIA progressbar, and theme hooks.', url: '/react/coding/react-progress-bar-thresholds' },
                ],
            },
            publishedAt: '2025-09-28',
            updatedAt: '2026-06-23',
            author: {
                type: 'Organization',
                name: 'FrontendAtlas Team',
            },
            readerPromise: 'Use this component API design interview practice map to define React props, events, a decision matrix, interactive API surface trade-offs, TypeScript guardrails, library patterns, accessibility contracts, styling surfaces, and drill-reviewed follow-ups.',
            factCheckedAt: '2026-06-23',
            reviewedBy: 'FrontendAtlas',
        },
        load: () =>
            import('../../features/guides/playbook/component-api-design-article.component')
                .then(m => m.ComponentApiDesignArticle),
    },
    {
        slug: 'javascript-prep-path',
        title: 'JavaScript Interview Preparation Path: 7/14/30-Day Study Plan',
        minutes: 12,
        summary: 'Follow a JavaScript interview preparation path for frontend engineers with async, closures, event loop, promises, utility drills, trivia, coding practice, and a 7/14/30-day study plan.',
        seo: {
            title: 'JavaScript Interview Preparation Path: 7/14/30-Day Study Plan',
            description: 'JavaScript interview preparation for frontend engineers: follow a 7/14/30-day study plan for async, closures, event loop, promises, and utility drills.',
            primaryKeyword: 'javascript interview preparation',
            keywords: [
                'javascript interview preparation',
                'javascript interview prep path',
                'javascript interview study plan',
                'javascript interview preparation path',
                'javascript interview preparation roadmap',
                'javascript 7 day interview study plan',
                'javascript 14 day interview prep',
                'javascript 30 day interview plan',
                'frontend javascript interview prep',
                'frontend javascript interview preparation',
                'frontend javascript interview study plan',
                'javascript prep for frontend interviews',
                'frontend javascript coding interview preparation',
                'javascript coding interview preparation',
                'javascript interview practice',
                'javascript event loop interview prep',
                'javascript event loop output questions practice',
                'microtasks macrotasks interview prep',
                'async await event loop interview prep',
                'javascript output questions practice',
                'javascript async interview preparation',
                'javascript promises interview prep',
                'promise all interview practice javascript',
                'javascript promise combinators interview prep',
                'javascript concurrency interview practice',
                'take latest javascript interview practice',
                'javascript closures interview prep',
                'javascript closure output questions practice',
                'this keyword javascript interview prep',
                'call apply bind interview practice',
                'prototype chain javascript interview prep',
                'hoisting tdz javascript interview prep',
                'javascript utility function interview practice',
                'javascript debounce interview prep',
                'javascript throttle interview prep',
                'javascript reduce polyfill interview practice',
                'javascript deep clone interview prep',
                'javascript event emitter interview practice',
                'javascript dom event delegation interview',
            ],
            faqPage: {
                name: 'JavaScript interview preparation FAQ',
                items: [
                    {
                        question: 'How do I prepare for a JavaScript interview?',
                        answer: 'Start with the runtime model, then move into short implementation drills. A strong loop is event loop output, closures, this binding, Promise behavior, one utility implementation, and a review note after every miss.',
                    },
                    {
                        question: 'What is the best JavaScript interview study plan for frontend engineers?',
                        answer: 'Use a 7, 14, or 30-day plan based on interview date and baseline. Seven days patches common misses, fourteen days builds repeatable cadence, and thirty days adds mocks, mistake logs, and trade-off narration.',
                    },
                    {
                        question: 'How should I practice JavaScript event loop and output questions?',
                        answer: 'Predict before running code, then explain sync execution, microtask queue, macrotask queue, and async/await continuation order out loud. Mix Promise, setTimeout, queueMicrotask, await, and closure snippets.',
                    },
                    {
                        question: 'How do I practice JavaScript utility function interview questions?',
                        answer: 'Clarify the contract first: input shape, return type, mutation policy, async behavior, and edge cases. Then implement the smallest correct version and test empty input, invalid values, repeated calls, this/args handling, and cleanup.',
                    },
                    {
                        question: 'Do I need LeetCode for JavaScript-heavy frontend interviews?',
                        answer: 'Not always. In frontend-heavy loops, interviewers usually care more about async behavior, browser reasoning, state transitions, and utility implementation than pure algorithm depth. LeetCode helps when the target process includes a DS&A round.',
                    },
                    {
                        question: 'How long does JavaScript interview preparation usually take?',
                        answer: 'It depends on baseline and target bar. Seven days can patch obvious gaps, fourteen days usually stabilizes common patterns, and thirty days often builds stronger interview fluency through mocks and review.',
                    },
                ],
            },
            itemList: {
                name: '12 JavaScript interview prep patterns to practice',
                items: [
                    { name: 'Event loop output', description: 'Trace sync code, microtasks, macrotasks, async/await continuations, Promise vs setTimeout order, and mixed output snippets.', url: '/javascript/trivia/js-event-loop' },
                    { name: 'Closures + TDZ', description: 'Explain lexical bindings, closure capture, hoisting, temporal dead zone failures, closure-in-loop output, and delayed callbacks.', url: '/javascript/trivia/js-closures' },
                    { name: 'this / bind / call-site', description: 'Resolve implicit, explicit, constructor, default, and arrow binding with preserved args and bound function behavior.', url: '/javascript/coding/js-implement-bind' },
                    { name: 'Promise.all + combinators', description: 'Implement result ordering, fail-fast rejection, empty input, non-promise normalization, and Promise combinator trade-offs.', url: '/javascript/coding/js-promise-all' },
                    { name: 'Debounce', description: 'Delay work until input quiets while preserving this, args, timer cleanup, leading/trailing policy, and stale search protection.', url: '/javascript/coding/js-debounce' },
                    { name: 'Throttle', description: 'Limit high-frequency handlers with first/last call policy, trailing execution, scroll/resize use cases, and timer cleanup.', url: '/javascript/coding/js-throttle' },
                    { name: 'Array map/filter/reduce', description: 'Clarify callback contract, accumulator behavior, holes, indices, initial value rules, thisArg, and sparse-array edge cases.', url: '/javascript/coding/js-array-prototype-reduce' },
                    { name: 'Flatten / groupBy', description: 'Define input shape, recursion depth, grouping key policy, output contract, Map vs object trade-offs, and stack overflow risk.', url: '/javascript/coding/js-flatten-depth' },
                    { name: 'Deep clone / deep equal', description: 'State supported types, reference identity, recursion strategy, unsupported values, cycles, Date, Map, Set, and key-order behavior.', url: '/javascript/coding/js-deep-clone' },
                    { name: 'EventEmitter', description: 'Design on/off/emit/once contracts with unsubscribe behavior, listener ordering, mutation during emit, and leak-aware cleanup.', url: '/javascript/coding/js-event-emitter-mini' },
                    { name: 'DOM event delegation', description: 'Use bubbling, target checks, closest lookup, parent listeners, containment, nested matches, cleanup, and disabled states.', url: '/javascript/coding/js-delegated-events-2' },
                    { name: 'takeLatest / concurrency', description: 'Protect latest user intent with request identity, cancellation, bounded async work, stale response policy, and result ordering.', url: '/javascript/coding/js-take-latest' },
                ],
            },
            publishedAt: '2026-02-12',
            updatedAt: '2026-06-13',
            author: {
                type: 'Organization',
                name: 'FrontendAtlas Team',
            },
            searchIntent: 'Find a JavaScript interview preparation path that turns async, closures, event loop output, this binding, promises, stale state, and utility prompts into a repeatable 7/14/30-day study plan.',
            readerPromise: 'Use this JavaScript interview preparation path to move from runtime topics to trivia, coding drills, mastery checkpoints, and a 7/14/30-day study plan for frontend interviews.',
            uniqueAngle: 'Framework-specific bug families and direct drill mapping, not a generic topic list.',
            factCheckedAt: '2026-06-07',
            reviewedBy: 'FrontendAtlas',
        },
        load: () =>
            import('../../features/guides/playbook/javascript-prep-path-article.component')
                .then(m => m.JavascriptPrepPathArticle),
    },
    {
        slug: 'react-prep-path',
        title: 'How to Prepare for a React Interview: 7/14/30-Day Plan',
        minutes: 9,
        summary: 'Use this React interview preparation path to learn how to prepare for a React interview with hooks, state, rendering, coding drills, testing, and a 7/14/30-day study plan.',
        seo: {
            title: 'How to Prepare for a React Interview: 7/14/30-Day Plan',
            description: 'React interview preparation path for frontend engineers: hooks, effects, state, rendering, coding drills, testing, performance, and a 7/14/30-day plan.',
            primaryKeyword: 'how to prepare for react interview',
            keywords: [
                'how to prepare for react interview',
                'react interview preparation',
                'react interview study plan',
                'react interview prep path',
                'react interview roadmap',
                'react interview preparation for frontend engineers',
                'react hooks interview prep',
                'react coding interview preparation',
                'react coding interview questions',
                'react hooks and effects interview',
                'react useeffect interview questions',
                'react useeffect cleanup interview',
                'react useeffect dependencies interview',
                'react stale closure interview',
                'react hooks pitfalls interview',
                'react custom hooks interview preparation',
                'react rendering interview questions',
                'react reconciliation interview prep',
                'react keys interview question',
                'react state management interview questions',
                'react context performance interview',
                'react memoization interview questions',
                'usememo usecallback react interview',
                'react performance optimization interview',
                'react component coding interview',
                'react machine coding interview questions',
                'react ui coding interview',
                'react debounced search interview',
                'react autocomplete interview question',
                'react contact form interview question',
                'react transfer list interview question',
                'react tabs interview question',
                'senior react interview preparation',
                'junior react interview preparation',
                'mid level react interview prep',
                'do i need leetcode for react interviews',
                'what to study first for react interview',
                'how long to prepare for react interview',
                'react interview topics for frontend developers',
                'react interview preparation 7 days',
                'react interview preparation 14 days',
                'react interview preparation 30 days',
            ],
            faqPage: {
                name: 'React interview preparation FAQ',
                items: [
                    {
                        question: 'How do I prepare for a React interview?',
                        answer: 'Use a repeatable loop: review one React concept, answer a short trivia prompt, build one UI coding drill, then write one mistake and one prevention rule. Prioritize hooks, effects, state ownership, rendering behavior, forms, testing, and performance before broad topic browsing. Where to practice in FrontendAtlas: start with /guides/framework-prep/react-prep-path, then pair /coding?tech=react&kind=trivia with /coding?tech=react&kind=coding.',
                    },
                    {
                        question: 'What should I study first for a React interview?',
                        answer: 'Start with components, JSX, props, state, one-way data flow, keys, controlled inputs, hooks, useEffect cleanup, and stale closures. These topics support most React coding prompts and make advanced rendering or performance questions easier to reason about. Practical rule: do not move into architecture until you can explain state snapshots and cleanup without guessing.',
                    },
                    {
                        question: 'How long does it take to prepare for a React interview?',
                        answer: 'A 7-day pass can refresh high-risk gaps, 14 days can make the practice loop repeatable, and 30 days can build mock-ready depth. Extend the plan when the same miss repeats across trivia, coding, or review notes. Practical rule: timeline is less important than whether your misses stop repeating.',
                    },
                    {
                        question: 'How should I practice React coding interview questions?',
                        answer: 'Build small UI prompts under time pressure, then harden the result with loading, error, empty, cleanup, accessibility, and state-reset cases. Pair each coding drill with one related concept answer so implementation and explanation improve together. Where to practice in FrontendAtlas: use /coding?tech=react&kind=coding and review linked React trivia immediately after.',
                    },
                    {
                        question: 'How do I prepare for a senior React interview?',
                        answer: 'Focus on state ownership, effect cleanup, rendering internals, Context boundaries, Server Components, testing strategy, profiling, and trade-off communication. Senior preparation should include why a design scales, what can fail, and how you would validate the decision. Practical rule: every answer should include a correctness risk, a performance risk, or a maintainability trade-off.',
                    },
                    {
                        question: 'Do I need LeetCode for React interviews?',
                        answer: 'Not always. Many React loops prioritize UI correctness, async safety, and explanation quality over algorithm depth. Add DS&A only when the target process explicitly requires it.',
                    },
                    {
                        question: 'What is the practical difference between topics, trivia, and coding prompts?',
                        answer: 'Topics build the model, trivia checks explanation speed, and coding checks execution under constraints. Strong prep runs the same concept through all three layers.',
                    },
                    {
                        question: 'How long does it realistically take to get interview-ready?',
                        answer: 'A focused 7-day pass can stabilize high-risk gaps, 14 days usually makes the loop repeatable, and 30 days can make execution resilient under time pressure.',
                    },
                    {
                        question: 'Which React hooks and effects questions should I practice?',
                        answer: 'Prioritize useEffect cleanup, dependency arrays, stale closure callbacks, refs, functional updates, and custom-hook boundaries. Treat effects as synchronization with external systems and make cleanup explicit.',
                    },
                    {
                        question: 'What React rendering and performance topics matter most?',
                        answer: 'Focus on rerender triggers, reconciliation, keys, Context fan-out, memoization trade-offs, and profiling language. Keys define identity across renders, and unstable keys can move state to the wrong row.',
                    },
                    {
                        question: 'When should I use useMemo, useCallback, or React.memo?',
                        answer: 'Use memoization when it removes meaningful work, not by default. Interviewers care more about the reasoning and measurable hotspot than blanket usage.',
                    },
                    {
                        question: 'Context vs lifting state vs external store: how should I reason in interviews?',
                        answer: 'Start with ownership and update frequency, then pick the smallest boundary that keeps data flow clear. You are scored on boundary decisions, not tool loyalty.',
                    },
                    {
                        question: 'Controlled vs uncontrolled forms: what mental model should I use?',
                        answer: 'Controlled forms keep validation and UI behavior predictable because state is explicit. Choose based on validation complexity and interaction flow.',
                    },
                    {
                        question: 'Do I need to know class components in 2026?',
                        answer: 'Know enough to read and reason about class-based code, but expect most prompts to be hook-based.',
                    },
                    {
                        question: 'How much browser/DOM knowledge is expected for React roles?',
                        answer: 'Usually more than candidates expect. Event propagation, delegation, render timing, and async UI behavior appear in many React loops.',
                    },
                ],
            },
            itemList: {
                name: '12 React interview prep patterns to practice',
                items: [
                    { name: 'useEffect cleanup + dependencies', description: 'Practice useEffect cleanup, dependency-driven reruns, stale closure callbacks, timer/listener cleanup, and Strict Mode surprises.', url: '/react/trivia/react-useeffect-purpose' },
                    { name: 'Stale closures + state snapshots', description: 'Practice stale closure handlers, async callbacks, functional updates, latest value refs, and stale response guards.', url: '/react/trivia/react-stale-state-closures' },
                    { name: 'Keys + list identity', description: 'Practice React rendering interview questions around reconciliation, stable identity, keys, insert/delete/reorder behavior, and list-state stability.', url: '/react/trivia/react-keys-in-lists' },
                    { name: 'Memoization trade-offs', description: 'Practice when React.memo, useMemo, and useCallback help or add noise through referential equality and dependency reasoning.', url: '/react/trivia/react-usememo-vs-usecallback' },
                    { name: 'Context performance', description: 'Practice context boundaries, update frequency, provider fan-out, broad rerenders, split providers, and local state trade-offs.', url: '/react/trivia/react-context-performance-issues' },
                    { name: 'Debounced Search', description: 'Practice query state, delayed fetch, loading/error/empty states, latest-wins behavior, timer cleanup, and stale response guards.', url: '/react/coding/react-debounced-search' },
                    { name: 'Autocomplete', description: 'Practice input value, selected value, suggestions, keyboard behavior, loading, empty, error, and stale response states.', url: '/react/coding/react-autocomplete-search-starter' },
                    { name: 'Contact Form', description: 'Practice controlled fields, validation timing, submit state, duplicate submit protection, async failure, and accessible labels.', url: '/react/coding/react-contact-form-starter' },
                    { name: 'Transfer List', description: 'Practice stable IDs, selected state, disabled states, derived counts, duplicate moves, reorder/delete, and source mutation traps.', url: '/react/coding/react-transfer-list' },
                    { name: 'Tabs', description: 'Practice active tab state, tab ids, panels, disabled tabs, roving tabindex, Home/End keys, and ARIA expectations.', url: '/react/coding/react-tabs-switcher' },
                    { name: 'Dynamic Table', description: 'Practice row and column descriptors, accessors, fallback values, stable row keys, sort follow-ups, and large-list cost.', url: '/react/coding/react-dynamic-table' },
                    { name: 'Multi-step Signup', description: 'Practice step state, validation, preserved values, navigation guards, async submit recovery, and state ownership across steps.', url: '/react/coding/react-multi-step-signup' },
                ],
            },
            publishedAt: '2026-02-12',
            updatedAt: '2026-06-13',
            author: {
                type: 'Organization',
                name: 'FrontendAtlas Team',
            },
            searchIntent: 'Find how to prepare for a React interview with a practical study plan for hooks, state, rendering, coding drills, testing, and performance.',
            readerPromise: 'Use this React interview preparation path to turn hooks, rendering, coding, testing, and performance practice into a 7/14/30-day study plan.',
            uniqueAngle: 'React-specific render and state-design failure patterns tied directly to trivia and coding drills.',
            factCheckedAt: '2026-06-07',
            reviewedBy: 'FrontendAtlas',
        },
        load: () =>
            import('../../features/guides/playbook/react-prep-path-article.component')
                .then(m => m.ReactPrepPathArticle),
    },
    {
        slug: 'angular-prep-path',
        title: 'Angular Interview Preparation Path: 7/14/30-Day Study Plan',
        minutes: 9,
        summary: 'Follow an Angular interview preparation path for frontend engineers with RxJS, change detection, signals, DI, forms, testing, coding drills, and a 7/14/30-day study plan.',
        seo: {
            title: 'Angular Interview Preparation Path: 7/14/30-Day Plan',
            description: 'Angular interview preparation path for frontend engineers: RxJS, change detection, signals, DI, forms, testing, coding drills, and a 7/14/30-day plan.',
            primaryKeyword: 'angular interview preparation',
            keywords: [
                'angular interview preparation',
                'angular interview prep path',
                'angular interview study plan',
                'how to prepare for angular interview',
                'angular coding interview preparation',
                'frontend angular interview prep',
                'angular rxjs interview questions',
                'angular change detection interview',
                'angular onpush interview questions',
                'angular signals interview questions',
                'angular dependency injection interview',
                'angular reactive forms interview',
                'angular testing interview questions',
                'senior angular interview preparation',
                'angular interview preparation 7 days',
                'angular interview preparation 14 days',
                'angular interview preparation 30 days',
                'angular interview preparation for frontend engineers',
                'angular interview roadmap',
                'angular interview topics for frontend developers',
                'rxjs switchmap mergemap angular interview',
                'switchmap vs mergemap angular interview',
                'angular http cancellation interview',
                'angular stale response interview',
                'angular async pipe interview questions',
                'angular observables interview questions',
                'angular onpush change detection interview',
                'markforcheck vs detectchanges interview',
                'angular zonejs interview questions',
                'angular controlvalueaccessor interview',
                'angular routing interview questions',
                'angular performance optimization interview',
                'angular zoneless interview questions',
                'angular coding interview questions',
                'signals vs rxjs angular interview',
                'angular standalone components interview',
                'angular ssr hydration interview',
                'angular incremental hydration interview',
                'modern angular interview questions',
                'angular hierarchical dependency injection interview',
                'angular frontend coding interview',
                'angular debounced search interview',
                'angular autocomplete interview question',
                'angular data table interview question',
            ],
            faqPage: {
                name: 'Angular interview preparation FAQ',
                items: [
                    {
                        question: 'How do I prepare for an Angular interview?',
                        answer: 'Use a repeatable loop: review one Angular concept, answer a short trivia prompt, build one Angular coding drill, then write one symptom, root cause, and prevention note. Prioritize RxJS, change detection, DI, forms, routing, testing, and performance before broad topic browsing.',
                    },
                    {
                        question: 'What is the best Angular interview study plan for frontend engineers?',
                        answer: 'A strong Angular interview study plan runs concepts, trivia, and coding prompts together. Seven days can close obvious RxJS and change detection gaps, fourteen days can make the loop repeatable, and thirty days can build pressure-tested depth.',
                    },
                    {
                        question: 'Which Angular RxJS interview questions should I practice?',
                        answer: 'Prioritize cold vs hot Observables, AsyncPipe teardown, shareReplay lifetime, nested subscription risks, and flattening operator choice. Interviewers usually probe switchMap vs mergeMap, HTTP cancellation, stale response behavior, and retry placement.',
                    },
                    {
                        question: 'How do I prepare for Angular change detection and OnPush questions?',
                        answer: 'Start with trigger paths: input reference changes, events, AsyncPipe emissions, zones, and manual marks. Then practice why mutation breaks OnPush expectations and when markForCheck() is safer than detectChanges().',
                    },
                    {
                        question: 'Which Angular signals and modern Angular topics matter in interviews?',
                        answer: 'Expect signals vs RxJS, standalone components, zoneless change detection, SSR/hydration, route-level rendering, and migration trade-offs to appear in modern Angular interviews.',
                    },
                    {
                        question: 'How should I practice Angular coding interview questions?',
                        answer: 'Build small Angular UI prompts under time pressure, then harden them with loading, error, empty, cancellation, validation, disabled state, and testing checks. Pair each coding drill with one related trivia explanation.',
                    },
                    {
                        question: 'How do I prepare for a senior Angular interview?',
                        answer: 'Senior Angular preparation should emphasize architecture boundaries, provider scope, RxJS lifecycle discipline, change detection trade-offs, forms reliability, testing strategy, and migration reasoning.',
                    },
                    {
                        question: 'Do I need LeetCode for Angular interviews?',
                        answer: 'Not always. Angular-heavy loops usually score UI state correctness, async flow, RxJS behavior, and architecture trade-offs before deep algorithms. Add DS&A only when the process requires it.',
                    },
                ],
            },
            itemList: {
                name: '12 Angular interview prep patterns to practice',
                items: [
                    { name: 'Change Detection triggers', description: 'Practice Default vs OnPush, input references, events, AsyncPipe, zone-triggered checks, and zoneless follow-ups.', url: '/angular/trivia/angular-change-detection-strategies' },
                    { name: 'OnPush debugging', description: 'Practice Angular OnPush change detection interview bugs, stale rows, mutated arrays, markForCheck vs detectChanges, and root-cause narration.', url: '/angular/trivia/angular-onpush-change-detection-debugging-real-bug' },
                    { name: 'RxJS Observables', description: 'Practice Angular RxJS interview questions around cold vs hot Observables, AsyncPipe, teardown, shareReplay lifetime, and stream ownership.', url: '/angular/trivia/angular-observables-rxjs' },
                    { name: 'switchMap / mergeMap / exhaustMap / concatMap', description: 'Practice switchMap vs mergeMap, cancellation, parallelism, queueing, ignore-while-busy behavior, and stale response risk.', url: '/angular/trivia/rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use' },
                    { name: 'HTTP cancellation / stale responses', description: 'Practice Angular HTTP cancellation interview reasoning, switchMap cancellation, stale response guards, loading/error/empty states, and request ownership.', url: '/angular/trivia/angular-http-what-actually-cancels-request' },
                    { name: 'Dependency Injection hierarchy', description: 'Practice root, feature, component, and lazy-route provider scope, InjectionToken usage, multi providers, and test overrides.', url: '/angular/trivia/angular-dependency-injection' },
                    { name: 'Routing guards / lazy loading', description: 'Practice CanActivate vs CanMatch, resolver trade-offs, lazy boundaries, preloading, route events, and unauthorized flows.', url: '/angular/trivia/angular-routing' },
                    { name: 'ControlValueAccessor / forms', description: 'Practice value propagation, touched/dirty state, disabled state, validators, registerOnChange, and registerOnTouched.', url: '/angular/trivia/angular-controlvalueaccessor-vs-custom-two-way-binding' },
                    { name: 'Performance optimization', description: 'Practice modern Angular interview questions around change detection cost, trackBy, lazy loading, signals vs RxJS, zoneless mode, SSR/hydration, and profiling language.', url: '/angular/trivia/angular-performance-optimization' },
                    { name: 'Debounced Search', description: 'Practice input streams, debounce, switchMap, latest-wins UI, loading/error/empty states, and subscription ownership.', url: '/angular/coding/angular-debounced-search' },
                    { name: 'Autocomplete', description: 'Practice an Angular coding interview preparation component drill for input value, selected value, suggestions, keyboard behavior, async status, stale responses, and option identity.', url: '/angular/coding/angular-autocomplete-search-starter' },
                    { name: 'Data Table / Pagination', description: 'Practice an Angular coding interview preparation data UI drill for row identity, page state, filtering/sorting hooks, stable trackBy ids, empty pages, and pagination boundaries.', url: '/angular/coding/angular-pagination-table' },
                ],
            },
            publishedAt: '2026-02-12',
            updatedAt: '2026-06-13',
            author: {
                type: 'Organization',
                name: 'FrontendAtlas Team',
            },
            searchIntent: 'Find an Angular interview preparation path with a practical study plan for RxJS, change detection, signals, DI, forms, testing, and coding drills.',
            readerPromise: 'Use this Angular interview preparation path to turn RxJS, change detection, signals, DI, forms, testing, and coding drills into a 7/14/30-day study plan.',
            uniqueAngle: 'Angular-specific debugging and architecture decisions connected directly to operator choice, change detection, provider scope, forms, tests, and direct drills.',
            factCheckedAt: '2026-06-07',
            reviewedBy: 'FrontendAtlas',
        },
        load: () =>
            import('../../features/guides/playbook/angular-prep-path-article.component')
                .then(m => m.AngularPrepPathArticle),
    },
    {
        slug: 'vue-prep-path',
        title: 'Vue Interview Preparation Path: 7/14/30-Day Study Plan',
        minutes: 9,
        summary: 'Follow a Vue interview preparation path for frontend engineers with reactivity, Composition API, Pinia, Router, nextTick, coding drills, and a 7/14/30-day study plan.',
        seo: {
            title: 'Vue Interview Preparation Path: 7/14/30-Day Study Plan',
            description: 'Vue interview preparation path for frontend engineers: reactivity, Composition API, Pinia, Router, nextTick, coding drills, and a 7/14/30-day plan.',
            primaryKeyword: 'vue interview preparation',
            keywords: [
                'vue interview preparation',
                'vue interview prep path',
                'vue interview study plan',
                'how to prepare for vue interview',
                'vue coding interview preparation',
                'frontend vue interview prep',
                'vue interview preparation for frontend engineers',
                'vue interview roadmap',
                'vue interview preparation 7 days',
                'vue interview preparation 14 days',
                'vue interview preparation 30 days',
                'vue reactivity interview questions',
                'vue ref vs reactive interview',
                'ref vs reactive vue interview question',
                'computed vs watch vue interview',
                'watch vs watcheffect vue interview',
                'vue nexttick interview question',
                'vue reactivity destructuring trap',
                'vue shallowref interview question',
                'vue composition api interview',
                'vue options api vs composition api interview',
                'vue composables interview questions',
                'vue props emits interview',
                'vue pinia interview questions',
                'pinia vs vuex interview',
                'vue state management interview',
                'vue router guard interview',
                'vue router navigation guard interview',
                'vue lazy routes interview',
                'vue storeToRefs interview',
                'vue slots interview question',
                'vue scoped slots interview',
                'vue emits props interview',
                'vue component communication interview',
                'vue component API interview',
                'vue v-for keys interview',
                'vue virtual dom interview',
                'vue performance interview questions',
                'vue testing interview questions',
                'nuxt vue interview questions',
                'vue ssr interview questions',
                'vue migration vuex to pinia interview',
                'vue coding interview questions',
                'vue debounced search interview',
                'vue tabs interview question',
                'vue data table interview question',
                'vue shopping cart interview question',
                'vue todo list interview question',
                'vue pagination table interview',
            ],
            faqPage: {
                name: 'Vue interview preparation FAQ',
                items: [
                    {
                        question: 'How do I prepare for a Vue interview?',
                        answer: 'Use a repeatable Vue interview preparation loop: review one concept, answer one trivia prompt, build one Vue coding drill, then write one symptom, root cause, and prevention note. Prioritize reactivity, Composition API, computed/watch, nextTick, props/emits, router, Pinia, and UI coding before broad Q&A browsing.',
                    },
                    {
                        question: 'What is the best Vue interview study plan for frontend engineers?',
                        answer: 'The best Vue interview study plan runs topics, trivia, and coding prompts together. Seven days can stabilize reactivity and timing misses, fourteen days can make the loop repeatable, and thirty days can build mock-ready implementation depth.',
                    },
                    {
                        question: 'Which Vue reactivity interview questions should I practice?',
                        answer: 'Practice Vue reactivity interview questions around proxy tracking, ref vs reactive, computed vs watch, watch vs watchEffect, nextTick, shallowRef, destructuring traps, and stale async updates.',
                    },
                    {
                        question: 'How should I explain ref vs reactive in Vue interviews?',
                        answer: 'Explain ref vs reactive by state shape and tracking boundary. Use ref for primitives or replaceable values, use reactive for object-shaped state that should be tracked deeply, and mention destructuring risks unless refs are preserved with toRefs or storeToRefs.',
                    },
                    {
                        question: 'How do I practice Vue coding interview questions?',
                        answer: 'Practice Vue coding interview questions by building small UI prompts under time pressure, then hardening state, events, loading, error, empty, validation, and async race behavior.',
                    },
                    {
                        question: 'Do I need Nuxt for Vue interviews?',
                        answer: 'Nuxt matters for SSR-heavy Vue roles, but many frontend Vue interviews still score core Vue reactivity, component communication, Router, Pinia, and UI coding first.',
                    },
                    {
                        question: 'How do I prepare for a senior Vue interview?',
                        answer: 'Senior Vue interview preparation should emphasize architecture boundaries, reactivity/performance reasoning, component API design, Pinia vs Vuex migration language, Router guard safety, testing strategy, and SSR/Nuxt trade-offs.',
                    },
                    {
                        question: 'Do I need LeetCode for Vue interviews?',
                        answer: 'Not always. Vue-heavy frontend loops usually score reactivity, component state, async UI, Router/Pinia decisions, and coding prompt execution before deep algorithms.',
                    },
                ],
            },
            itemList: {
                name: '12 Vue interview prep patterns to practice',
                items: [
                    { name: 'Reactivity system', description: 'Practice proxy tracking, dependency collection, render scheduling, deep vs shallow tracking, and missing update symptoms.', url: '/vue/trivia/vue-reactivity-system' },
                    { name: 'ref vs reactive', description: 'Practice state shape, unwrapping rules, destructuring traps, .value usage, toRefs/storeToRefs, shallowRef, and raw-object equality.', url: '/vue/trivia/vue-ref-vs-reactive-difference-traps' },
                    { name: 'computed vs watch/watchEffect', description: 'Practice derived state vs side effects, cleanup, flush timing, explicit vs automatic dependencies, and infinite-loop risk.', url: '/vue/trivia/vue-computed-vs-watchers' },
                    { name: 'nextTick / DOM update queue', description: 'Practice batched updates, DOM commit timing, stale DOM reads, focus after conditional render, lifecycle timing, and nextTick overuse.', url: '/vue/trivia/vue-nexttick-dom-update-queue' },
                    { name: 'Slots and scoped slots', description: 'Practice props, emits, default slots, named slots, scoped slot payloads, and flexible component contracts.', url: '/vue/trivia/vue-slots-default-named-scoped-slot-props' },
                    { name: 'Router guards / navigation', description: 'Practice auth guards, redirect loops, lazy routes, route meta, pending navigation, and fallback UX.', url: '/vue/trivia/vue-router-navigation' },
                    { name: 'Pinia / Vuex / shared state', description: 'Practice local vs shared state, storeToRefs, actions/getters, async/error state, and Vuex-to-Pinia migration language.', url: '/vue/trivia/vuex-state-management' },
                    { name: 'v-for keys / virtual DOM identity', description: 'Practice stable keys, virtual DOM diffing, index-key bugs, insert/delete/reorder behavior, and preserved child state.', url: '/vue/trivia/vue-v-for-keys-why-not-index' },
                    { name: 'Debounced Search', description: 'Practice query state, debounce, status state, latest-wins results, rapid typing, stale response guards, and loading/error/empty states.', url: '/vue/coding/vue-debounced-search' },
                    { name: 'Tabs', description: 'Practice active tab state, panel mapping, default value policy, disabled tabs, keyboard expectations, and stable tab ids.', url: '/vue/coding/vue-tabs-switcher' },
                    { name: 'Data Table / Pagination', description: 'Practice row identity, page state, sorting/filtering hooks, empty states, pagination boundaries, and large-list rendering cost.', url: '/vue/coding/vue-pagination-table' },
                    { name: 'Shopping Cart / store state', description: 'Practice shared cart state, derived totals, quantity changes, duplicate products, optimistic recovery, and store boundaries.', url: '/vue/coding/vue-shopping-cart' },
                ],
            },
            publishedAt: '2026-02-12',
            updatedAt: '2026-06-13',
            author: {
                type: 'Organization',
                name: 'FrontendAtlas Team',
            },
            searchIntent: 'Find a Vue interview preparation path with a practical study plan for reactivity, Composition API, Pinia, Router, nextTick, and coding drills.',
            readerPromise: 'Use this Vue interview preparation path to turn reactivity, Composition API, Pinia, Router, nextTick, and coding drills into a 7/14/30-day study plan.',
            uniqueAngle: 'Vue-specific reactivity, component contract, router, and store-boundary pitfalls tied directly to trivia and coding drills.',
            factCheckedAt: '2026-06-07',
            reviewedBy: 'FrontendAtlas',
        },
        load: () =>
            import('../../features/guides/playbook/vue-prep-path-article.component')
                .then(m => m.VuePrepPathArticle),
    },
    {
        slug: 'system-design',
        title: 'Frontend System Design Interview Framework | 45-Minute Template',
        minutes: 18,
        summary: 'Answer frontend system design interviews with a 45-minute framework, autocomplete worked example, API and state contracts, rubric, and practice prompts.',
        seo: {
            title: 'Frontend System Design Interview Framework | 45-Minute Template',
            description: 'Answer frontend system design interviews with a 45-minute framework, autocomplete worked example, API/state contracts, rubric, and practice prompts.',
            primaryKeyword: 'frontend system design interview framework',
            keywords: [
                'frontend system design interview framework',
                'frontend system design interviews',
                'frontend system design interview questions',
                'frontend system design answer template',
                '45 minute frontend system design interview',
                'frontend architecture interview',
                'autocomplete frontend system design',
                'design autocomplete frontend system design',
                'frontend system design interview rubric',
                'frontend vs backend system design interview',
                'client side system design interview',
                'senior frontend system design interview',
            ],
            faqPage: {
                name: 'Frontend system design interview framework FAQ',
                items: [
                    {
                        question: 'What is a frontend system design interview framework?',
                        answer: 'A frontend system design interview framework is a repeatable structure for clarifying requirements, mapping frontend architecture, defining state and API contracts, walking through interface states, and closing with trade-offs.',
                    },
                    {
                        question: 'How do I answer a frontend system design interview in 45 minutes?',
                        answer: 'Spend 0-5 minutes clarifying scope, 5-12 on the surface map, 12-22 on state and API contracts, 22-32 on the core interaction, 32-40 on resilience and performance, and 40-45 on the recap.',
                    },
                    {
                        question: 'What is the difference between frontend system design and backend system design?',
                        answer: 'Frontend system design focuses on browser rendering, component boundaries, client state, API consumption, accessibility, performance, and user-visible failures. Backend system design goes deeper on services, storage, replication, queues, and infrastructure scaling.',
                    },
                    {
                        question: 'How do I design autocomplete in a frontend system design interview?',
                        answer: 'Start with scope, then define the combobox component, query and cache layer, API contract, stale response policy, keyboard behavior, and performance or telemetry trade-offs.',
                    },
                    {
                        question: 'What frontend system design trade-offs should senior engineers mention?',
                        answer: 'Mention latency versus freshness, local state versus server cache, debounce versus perceived responsiveness, virtualization cost, accessibility behavior, fallback UX, and the metrics you would watch after launch.',
                    },
                    {
                        question: 'What should I practice for a frontend architecture interview?',
                        answer: 'Practice realtime search first, then move through infinite scroll, news feed, notification systems, AI chat UI, design systems, live comments, dashboard widgets, and the deeper 45-minute answer script.',
                    },
                ],
            },
            itemList: {
                name: 'Frontend system design practice map',
                items: [
                    { name: 'Realtime search autocomplete', description: 'Practice debounce, cache keys, stale response policy, keyboard selection, accessibility, and observability.', url: '/system-design/realtime-search-debounce-cache' },
                    { name: 'Infinite scroll list', description: 'Practice pagination contracts, virtualization thresholds, scroll restoration, and loading states.', url: '/system-design/infinite-scroll-list' },
                    { name: 'News feed timeline', description: 'Practice freshness, optimistic interactions, card boundaries, media loading, and degraded states.', url: '/system-design/news-feed-timeline' },
                    { name: 'Notification toast system', description: 'Practice queueing, priority, focus safety, live regions, dismissal policy, and animation trade-offs.', url: '/system-design/notification-toast-system' },
                    { name: 'AI chat text area', description: 'Practice streaming state, send and cancel flow, draft persistence, retries, and token latency.', url: '/system-design/ai-chat-textarea-design' },
                    { name: 'Component design system architecture', description: 'Practice ownership, versioning, accessibility contracts, tokens, documentation, and migration risk.', url: '/system-design/component-design-system-architecture' },
                    { name: 'Live comments global stream', description: 'Practice realtime updates, backpressure, batching, moderation states, and scroll behavior.', url: '/system-design/live-comments-global-stream' },
                    { name: 'Dashboard widgets', description: 'Practice layout persistence, drag and resize state, chart loading, permissions, and performance budgets.', url: '/system-design/dashboard-widgets-draggable-resizable' },
                    { name: 'React autocomplete coding drill', description: 'Turn the autocomplete system design into working UI behavior and async correctness.', url: '/react/coding/react-autocomplete-search-starter' },
                    { name: '45-minute answer script', description: 'Go deeper on requirements, architecture, data, interfaces, and optimizations.', url: '/guides/system-design-blueprint/radio-framework' },
                ],
            },
            readerPromise: 'Use this frontend system design interview framework to structure a 45-minute answer, walk through autocomplete, compare against a rubric, and move into direct FrontendAtlas practice prompts.',
            uniqueAngle: 'Frontend-specific answer template with autocomplete API/state walkthrough, stale response handling, accessibility states, rubric, and direct practice map.',
            publishedAt: '2025-09-28',
            updatedAt: '2026-06-10',
            author: {
                type: 'Organization',
                name: 'FrontendAtlas Team',
            },
            factCheckedAt: '2026-06-10',
            reviewedBy: 'FrontendAtlas',
        },
        load: () =>
            import('../../features/guides/playbook/fe-system-design-fast-framework-article.component')
                .then(m => m.FeSystemDesignFastFrameworkArticle),
    },
    {
        slug: 'quiz',
        title: 'Frontend Interview Fundamentals Quiz: Browser, CSS, JavaScript, HTTP',
        minutes: 15,
        summary: 'Run a 15-minute frontend interview fundamentals quiz covering browser rendering, CSS layout, JavaScript async, HTTP caching, score bands, and practice links.',
        seo: {
            title: 'Frontend Interview Fundamentals Quiz: 15-Minute Diagnostic',
            description: 'Take a 15-minute frontend interview fundamentals quiz covering browser rendering, CSS layout, JavaScript async, HTTP caching, score bands, and practice links.',
            primaryKeyword: 'frontend interview fundamentals quiz',
            keywords: [
                'frontend interview fundamentals quiz',
                'frontend interview quiz',
                'frontend fundamentals check',
                'frontend technical interview fundamentals',
                'browser css javascript http quiz',
                'frontend interview practice quiz',
                '15 minute frontend interview quiz',
                'frontend fundamentals diagnostic',
                'frontend interview readiness quiz',
                'frontend technical interview self assessment',
                'frontend interview score bands',
                'browser rendering interview questions',
                'browser rendering pipeline interview questions',
                'css layout interview questions quiz',
                'javascript async interview quiz',
                'http caching frontend interview questions',
            ],
            faqPage: {
                name: 'Frontend interview fundamentals quiz FAQ',
                items: [
                    {
                        question: 'What is a frontend interview fundamentals quiz?',
                        answer: 'A frontend interview fundamentals quiz is a short diagnostic that checks whether you can explain browser, CSS, JavaScript, and HTTP concepts clearly enough for a frontend technical interview.',
                    },
                    {
                        question: 'How do I use this as a 15-minute frontend fundamentals diagnostic?',
                        answer: 'Spend about 15 minutes total: roughly one minute per question, plus a few minutes to score your misses and choose the next practice prompt.',
                    },
                    {
                        question: 'Which browser rendering interview questions should I know?',
                        answer: 'Know how HTML and CSS become the DOM, CSSOM, render tree, layout, paint, and composited output, then connect each step to performance and UI bugs.',
                    },
                    {
                        question: 'Which CSS layout interview questions matter most?',
                        answer: 'Expect box model, specificity, cascade order, positioning, Flexbox, Grid, and responsive layout questions that ask you to debug a real UI outcome.',
                    },
                    {
                        question: 'What JavaScript async topics appear in frontend interview quizzes?',
                        answer: 'Practice promises, async/await, microtasks, macrotasks, event loop output, error handling, and how async timing can create stale UI state.',
                    },
                    {
                        question: 'What HTTP caching topics should frontend engineers know?',
                        answer: 'Explain Cache-Control, ETag, max-age, revalidation, stale data policy, and how status codes change the UI state the user should see.',
                    },
                ],
            },
            itemList: {
                name: 'Frontend interview fundamentals diagnostic practice map',
                items: [
                    { name: 'Event loop output', description: 'Trace sync work, microtasks, timers, async/await continuation, and visible output order.', url: '/javascript/trivia/js-event-loop' },
                    { name: 'Closures', description: 'Practice lexical scope, retained state, stale callbacks, and callback examples.', url: '/javascript/trivia/js-closures' },
                    { name: 'this keyword', description: 'Explain call-site binding, arrow functions, bind/call/apply, and callback context loss.', url: '/javascript/trivia/js-this-keyword' },
                    { name: 'Promises and async/await', description: 'Practice promise state, async/await readability, and error handling semantics.', url: '/javascript/trivia/js-promises-async-await' },
                    { name: 'Microtasks vs macrotasks', description: 'Compare Promise callbacks, timers, rendering checkpoints, and output ordering.', url: '/javascript/trivia/js-microtasks-vs-macrotasks' },
                    { name: 'HTTP caching basics', description: 'Practice Cache-Control, ETag, freshness, revalidation, and user-visible stale data.', url: '/javascript/trivia/http-caching-basics' },
                    { name: 'CSS box model', description: 'Explain content-box, border-box, padding, margin, and overflow surprises.', url: '/css/trivia/css-box-model' },
                    { name: 'CSS specificity hierarchy', description: 'Practice cascade order, specificity scoring, source order, and conflict debugging.', url: '/css/trivia/css-specificity-hierarchy' },
                    { name: 'Grid vs Flexbox', description: 'Choose between one-dimensional alignment and two-dimensional layout tracks.', url: '/css/trivia/css-grid-vs-flexbox' },
                    { name: 'HTML DOM', description: 'Explain HTML parsing, DOM nodes, and how browser APIs expose document structure.', url: '/html/trivia/html-dom' },
                    { name: 'HTML parsing and rendering', description: 'Practice progressive parsing, blocking resources, script loading, and render timing.', url: '/html/trivia/html-parsing-rendering' },
                    { name: 'Full quiz practice area', description: 'Move from fundamentals checks into broader frontend coding and trivia practice.', url: '/coding' },
                ],
            },
            readerPromise: 'Run this frontend interview fundamentals quiz to diagnose browser, CSS, JavaScript, and HTTP weak spots, score your answers, and move into direct FrontendAtlas practice links.',
            uniqueAngle: 'A 15-minute frontend fundamentals diagnostic with score bands, answer rubric, and direct practice links instead of a generic question list.',
            publishedAt: '2025-09-28',
            updatedAt: '2026-06-12',
            author: {
                type: 'Organization',
                name: 'FrontendAtlas Team',
            },
            factCheckedAt: '2026-06-11',
            reviewedBy: 'FrontendAtlas',
        },
        load: () =>
            import('../../features/guides/playbook/fundamentals-check-article.component')
                .then(m => m.FundamentalsCheckArticle),
    },
    {
        slug: 'resume',
        title: 'Frontend Resume for Interviews: What Gets Calls and What Gets Rejected',
        minutes: 18,
        summary: 'Build a frontend developer resume that gets interviews with a 30-second skim test, ATS keywords, bullet examples, role examples, and rejection triggers.',
        seo: {
            title: 'Frontend Developer Resume: ATS Keywords & Bullet Examples (2026)',
            description: 'Build a frontend developer resume that gets interviews with ATS keywords, bullet examples, a 30-second skim test, role examples, and rejection triggers.',
            primaryKeyword: 'frontend resume for interviews',
            keywords: [
                'frontend resume for interviews',
                'frontend developer resume',
                'front end developer resume examples',
                'front-end developer resume',
                'frontend resume examples',
                'frontend engineer resume',
                'frontend resume that gets interviews',
                'frontend interview resume',
                'frontend developer resume ATS keywords',
                'front end developer resume keywords',
                'frontend resume skills',
                'frontend resume bullet points',
                'front end developer resume bullet examples',
                'senior frontend developer resume',
                'junior frontend developer resume',
                'react developer resume',
            ],
            faqPage: {
                name: 'Frontend resume for interviews FAQ',
                items: [
                    {
                        question: 'How do I write a frontend developer resume that gets interviews?',
                        answer: 'Write a frontend developer resume that gets interviews by emphasizing shipped UI, measurable impact, frontend-specific quality, and stories you can explain in coding, UI, system design, and behavioral rounds.',
                    },
                    {
                        question: 'What front end developer resume examples should I study?',
                        answer: 'Study front end developer resume examples that show the level, stack, product surface, technical lever, and measurable result in the first few bullets instead of listing generic tasks.',
                    },
                    {
                        question: 'Which frontend developer resume ATS keywords should I include?',
                        answer: 'Include role-matched keywords such as React, Angular, Vue, Next.js, TypeScript, accessibility, WCAG, Core Web Vitals, testing, state management, and API integration when you can prove them.',
                    },
                    {
                        question: 'What makes frontend resume bullet points stronger?',
                        answer: 'Strong frontend resume bullet points name the surface, technical lever, scope, and outcome instead of listing generic responsibilities.',
                    },
                    {
                        question: 'How should a junior frontend developer resume differ from a senior frontend developer resume?',
                        answer: 'Junior resumes rely more on projects, GitHub, internships, and coursework. Senior resumes need architecture, cross-team leverage, mentoring, reliability, and technical decision-making.',
                    },
                    {
                        question: 'Should I write a React developer resume or a general frontend engineer resume?',
                        answer: 'Use a React developer resume angle when the role is explicitly React-heavy. Use a broader frontend engineer resume when the job asks for architecture, cross-framework judgment, design systems, or platform ownership.',
                    },
                ],
            },
            itemList: {
                name: 'Frontend resume bullet rewrite topics',
                items: [
                    { name: 'Performance bullet rewrite', description: 'Rewrite frontend performance work with Core Web Vitals, bundle size, and release impact.', url: '#rewrite-performance' },
                    { name: 'Accessibility bullet rewrite', description: 'Rewrite accessibility work with WCAG, keyboard, screen reader, and support impact.', url: '#rewrite-accessibility' },
                    { name: 'Design system bullet rewrite', description: 'Rewrite component library work with adoption, reuse, and team leverage.', url: '#rewrite-design-system' },
                    { name: 'Testing bullet rewrite', description: 'Rewrite frontend testing work with regression, coverage, and escaped defect impact.', url: '#rewrite-testing' },
                    { name: 'Migration bullet rewrite', description: 'Rewrite modernization work with feature parity, users, and risk reduction.', url: '#rewrite-migration' },
                    { name: 'API integration bullet rewrite', description: 'Rewrite API work with typed boundaries, UI states, and reliability outcomes.', url: '#rewrite-api-integration' },
                    { name: 'Checkout bullet rewrite', description: 'Rewrite conversion flow work with validation, errors, and completion impact.', url: '#rewrite-checkout' },
                    { name: 'Dashboard bullet rewrite', description: 'Rewrite dashboard work with data volume, saved workflows, and time saved.', url: '#rewrite-dashboard' },
                    { name: 'Search autocomplete bullet rewrite', description: 'Rewrite async search work with debounce, caching, keyboard support, and stale response handling.', url: '#rewrite-search-autocomplete' },
                    { name: 'Analytics bullet rewrite', description: 'Rewrite instrumentation work with funnel insight and product impact.', url: '#rewrite-analytics' },
                    { name: 'Incident reduction bullet rewrite', description: 'Rewrite production bug work with race conditions, monitoring, and incident reduction.', url: '#rewrite-incident-reduction' },
                    { name: 'Team enablement bullet rewrite', description: 'Rewrite mentoring and documentation work with review churn and developer velocity impact.', url: '#rewrite-team-enablement' },
                ],
            },
            readerPromise: 'Use this frontend resume for interviews to pass the 30-second skim, map your skills to ATS keywords, rewrite weak bullets, and choose interview prep from your strongest stories.',
            uniqueAngle: 'A frontend-specific resume playbook that connects resume bullets to coding, UI, system design, framework, and behavioral interview rounds.',
            publishedAt: '2025-09-28',
            updatedAt: '2026-06-12',
            author: {
                type: 'Organization',
                name: 'FrontendAtlas Team',
            },
            factCheckedAt: '2026-06-12',
            reviewedBy: 'FrontendAtlas',
        },
        load: () =>
            import('../../features/guides/playbook/resume-article.component')
                .then(m => m.ResumeArticle),
    },
];

export const PLAYBOOK_GROUPS: Array<{ key: string; title: string; items: Array<{ slug: string }> }> = [
    { key: 'intro', title: 'Introduction', items: [{ slug: 'intro' }] },
    {
        key: 'coding', title: 'Coding interviews', items: [
            { slug: 'coding-interviews' },
            { slug: 'javascript-interviews' },
            { slug: 'dsa-for-fe' },
        ]
    },
    {
        key: 'ui', title: 'User interface', items: [
            { slug: 'ui-interviews' },
            { slug: 'api-design' },
        ]
    },
    {
        key: 'framework-paths', title: 'Framework prep paths', items: [
            { slug: 'javascript-prep-path' },
            { slug: 'react-prep-path' },
            { slug: 'angular-prep-path' },
            { slug: 'vue-prep-path' },
        ]
    },
    { key: 'system', title: 'System design', items: [{ slug: 'system-design' }] },
    { key: 'quiz', title: 'Fundamentals', items: [{ slug: 'quiz' }] },
    { key: 'resume', title: 'Resume preparation', items: [{ slug: 'resume' }] },
];

/* ---------------------------------- SYSTEM DESIGN ---------------------------------- */

export const SYSTEM: GuideEntry[] = [
    {
        slug: 'intro',
        title: 'Front-End System Design: What It Really Tests',
        minutes: 8,
        summary: 'Learn what a front-end system design interview really scores, the senior trade-offs backend-heavy guides miss, and how to structure answers under pressure.',
        seo: {
            title: 'Front-End System Design Interview: What It Really Tests',
            description: 'Learn what frontend system design interviews test, how frontend scope differs from backend design, what interviewers score, and where to practice next.',
            primaryKeyword: 'what frontend system design interviews test',
            keywords: [
                'frontend system design interview overview',
                'frontend vs backend system design',
                'frontend system design interview signals',
                'what interviewers look for frontend system design',
                'frontend system design for senior frontend engineers',
            ],
            faqPage: {
                name: 'Frontend system design interview overview FAQ',
                items: [
                    {
                        question: 'What do frontend system design interviews test?',
                        answer: 'Frontend system design interviews test how you clarify requirements, choose client architecture, model state and API contracts, handle UX and accessibility, and explain performance or reliability tradeoffs.',
                    },
                    {
                        question: 'How is frontend system design different from backend system design?',
                        answer: 'Frontend system design focuses on browser rendering, component boundaries, client state, API consumption, accessibility, and user-visible failures. Backend design focuses more on services, storage, queues, replication, and infrastructure scaling.',
                    },
                    {
                        question: 'What do interviewers look for in frontend system design?',
                        answer: 'Interviewers look for clear scoping, structured architecture, practical state and data decisions, user-aware edge cases, performance reasoning, and tradeoff communication.',
                    },
                    {
                        question: 'Do frontend engineers need backend depth for system design interviews?',
                        answer: 'Frontend engineers need enough backend awareness to define contracts, pagination, auth boundaries, caching, and failure behavior, but scoring usually prioritizes client architecture and user experience decisions.',
                    },
                    {
                        question: 'Where should I practice after this frontend system design intro?',
                        answer: 'After the intro, learn the frontend system design interview answer template, review the weakest RADIO deep dive, then practice real prompts such as infinite scroll, realtime search, news feeds, notifications, AI chat UI, and design system architecture.',
                    },
                ],
            },
            readerPromise: 'Use this intro to understand what frontend system design interviews test, how frontend scope differs from backend design, which signals interviewers score, and when to move into RADIO and practice prompts.',
            publishedAt: '2025-09-28',
            updatedAt: '2026-06-02',
        },
        load: () =>
            import('../../features/guides/system-design/system-design-intro.component')
                .then(m => m.SystemDesignIntroArticle)
    },
    {
        slug: 'foundations',
        title: 'Scope, Constraints, and Trade-offs',
        minutes: 12,
        summary: 'Clarifying requirements, identifying constraints, and making principled trade-offs before you draw boxes.',
        seo: {
            title: 'Frontend System Design Interview Foundations: Scope and Trade-offs',
            description: 'Clarify frontend system design interview requirements, constraints, scope questions, and trade-offs in the first 5-8 minutes before architecture.',
            primaryKeyword: 'frontend system design requirements and tradeoffs',
            keywords: [
                'frontend system design constraints',
                'frontend system design scope questions',
                'system design clarification questions frontend',
                'frontend system design tradeoffs',
                'requirements clarification frontend system design',
                'frontend system design interview foundations',
                'frontend system design requirements checklist',
            ],
            faqPage: {
                name: 'Frontend system design requirements and tradeoffs FAQ',
                items: [
                    {
                        question: 'What requirements should I clarify in a frontend system design interview?',
                        answer: 'Clarify users, core flow, included and excluded features, device and network assumptions, data freshness, accessibility, security, performance budgets, and success metrics.',
                    },
                    {
                        question: 'How long should requirements clarification take?',
                        answer: 'In a 45-minute frontend system design interview, spend roughly the first 5-8 minutes on scope, constraints, and trade-offs before moving into architecture.',
                    },
                    {
                        question: 'What frontend constraints matter most before architecture?',
                        answer: 'SEO, realtime freshness, mobile performance, low-connectivity behavior, accessibility, auth boundaries, data volume, and observability requirements usually change frontend architecture.',
                    },
                    {
                        question: 'How do I explain trade-offs in a frontend system design interview?',
                        answer: 'Name the decision, connect it to the requirement, state what you gain, state what you give up, and explain when you would revisit the choice.',
                    },
                    {
                        question: 'What mistakes should I avoid before drawing architecture?',
                        answer: 'Avoid drawing before scope is clear, skipping non-functional requirements, making every feature v1, naming tools without trade-offs, and ignoring interviewer priorities.',
                    },
                ],
            },
            readerPromise: 'Use this foundations guide to clarify frontend system design requirements, constraints, and trade-offs in the first 5-8 minutes before moving into RADIO requirements and architecture.',
            publishedAt: '2025-08-31',
            updatedAt: '2026-05-28',
        },
        load: () =>
            import('../../features/guides/system-design/system-design-foundations')
                .then(m => m.SystemDesignFoundationsArticle)
    },
    {
        slug: 'framework',
        title: 'Frontend System Design 5-Step Answer Method',
        minutes: 14,
        summary: 'A quick-start answer flow for structuring frontend system design interviews before going deeper with RADIO.',
        seo: {
            title: 'Frontend System Design 5-Step Answer Method',
            description: 'Use a 5-step frontend system design interview flow to clarify requirements, map components, define data contracts, choose architecture, and close trade-offs.',
            primaryKeyword: 'frontend system design 5 step method',
            keywords: [
                'frontend system design answer flow',
                'frontend system design interview structure',
                'how to structure frontend system design interview',
                'frontend system design interview framework',
                'frontend system design answer method',
                '45 minute frontend system design interview',
            ],
            faqPage: {
                name: 'Frontend system design 5-step answer method FAQ',
                items: [
                    {
                        question: 'What is a frontend system design answer method?',
                        answer: 'A frontend system design answer method is a repeatable interview structure for clarifying requirements, mapping UI surfaces, defining state and API contracts, choosing architecture, and closing with trade-offs.',
                    },
                    {
                        question: 'How should I structure a frontend system design interview answer?',
                        answer: 'Start with requirements, map the main surfaces and components, define state/data/API contracts, choose the architecture and rendering model, then stress-test the design and summarize trade-offs.',
                    },
                    {
                        question: 'How much time should each step take?',
                        answer: 'In a 45-minute frontend system design interview, spend about 0-5 minutes clarifying, 5-12 on surfaces, 12-22 on state/data/API, 22-35 on architecture, and 35-45 on risks and recap.',
                    },
                    {
                        question: 'What is the difference between this 5-step method and RADIO?',
                        answer: 'This 5-step method is a quick answer flow for staying organized. RADIO is the deeper frontend system design framework that expands Requirements, Architecture, Data, Interface, and Optimizations.',
                    },
                    {
                        question: 'What should I say at the end of a frontend system design answer?',
                        answer: 'Close by naming the v1 design, the biggest trade-offs, the risks you would monitor, and which improvements you would make if scale, reliability, or product needs changed.',
                    },
                ],
            },
            readerPromise: 'Use this 5-step frontend system design answer method to structure a 45-minute interview before going deeper with the RADIO framework.',
            publishedAt: '2025-09-28',
            updatedAt: '2026-05-28',
        },
        load: () =>
            import('../../features/guides/system-design/system-design-framework')
                .then(m => m.SystemDesignFrameworkArticle)
    },
    {
        slug: 'radio-framework',
        title: 'Frontend System Design Interview Answer Template: 45-Minute RADIO',
        minutes: 20,
        summary: 'Copy a 45-minute frontend system design RADIO answer script with requirements, architecture, data, interface, optimizations, timeline, and examples.',
        seo: {
            title: 'Frontend System Design Interview Answer Template: 45-Minute RADIO',
            description: 'Copy a 45-minute frontend system design RADIO answer script: requirements, architecture, data, interface, optimizations, timeline, examples.',
            primaryKeyword: 'frontend system design interview answer template',
            keywords: [
                'frontend system design interview answer template',
                '45 minute frontend system design interview framework',
                'how to answer frontend system design interview',
                'RADIO framework frontend system design',
                'RADIO answer template',
                'RADIO framework for frontend system design interviews',
                'frontend system design interview checklist',
                'frontend system design 45 minute framework',
                'requirements architecture data interface optimizations',
                'what is the RADIO framework in frontend system design',
                'how to use RADIO framework for frontend system design interview',
                'frontend system design answer template 45 minutes',
                'what should I draw during a frontend system design interview',
                'RADIO framework autocomplete frontend system design',
                'RADIO framework news feed frontend system design',
                'RADIO framework chat frontend system design',
                'frontend system design interface API taxonomy',
            ],
            faqPage: {
                name: 'Frontend system design answer template FAQ',
                items: [
                    {
                        question: 'How do I use RADIO to answer a frontend system design interview question?',
                        answer: 'Start by clarifying the user flow and constraints, then sketch the frontend architecture, model server and client state, define component and API interfaces, and close with the highest-risk optimizations. Keep one core flow as the thread so every RADIO step supports the same answer.',
                    },
                    {
                        question: 'What should I draw during a RADIO answer?',
                        answer: 'Draw a scope box, client architecture, request flow, data contract, component/interface ownership, UI state map, and optimization backlog. Each artifact should connect to the same core user flow.',
                    },
                    {
                        question: 'How do I use RADIO for autocomplete, news feed, or chat?',
                        answer: 'Keep the RADIO steps stable while the prompt changes. For autocomplete, go deep on stale requests and combobox behavior; for news feed, pagination and cache consistency; for chat, realtime events, drafts, and recovery.',
                    },
                    {
                        question: 'What is the RADIO framework in frontend system design?',
                        answer: 'RADIO stands for Requirements, Architecture, Data, Interface, and Optimizations. It is a frontend system design interview framework for turning broad UI architecture prompts into a structured 45-minute answer with diagrams, contracts, and trade-offs.',
                    },
                    {
                        question: 'Is RADIO the best framework for frontend system design interviews?',
                        answer: 'RADIO is a strong default because it keeps frontend answers ordered from scope to architecture, data contracts, interface behavior, and optimization trade-offs. Adapt it when the interviewer asks to go deeper in one area.',
                    },
                ],
            },
            itemList: {
                name: 'Frontend system design answer template sections',
                items: [
                    {
                        name: 'Opening script',
                        description: 'Copy the first minute of the answer and set up the RADIO structure before drawing.',
                        url: '#frontend-system-design-interview-answer-template',
                    },
                    {
                        name: '45-minute timeline',
                        description: 'Use the timed RADIO flow to allocate requirements, architecture, data, interface, optimizations, and recap.',
                        url: '#45-minute-interview-timeline',
                    },
                    {
                        name: 'Requirements checklist',
                        description: 'Clarify the primary user flow, constraints, non-goals, success metrics, and edge cases before drawing architecture.',
                        url: '#radio-requirements',
                    },
                    {
                        name: 'Interface and API checklist',
                        description: 'Map component APIs, user interactions, loading and error states, keyboard behavior, focus, and accessibility announcements.',
                        url: '#radio-interface',
                    },
                    {
                        name: 'Autocomplete, news feed, and chat examples',
                        description: 'Apply the same answer template to autocomplete, news feed, and chat frontend system design prompts.',
                        url: '#run-radio-on-autocomplete-news-feed-and-chat',
                    },
                ],
            },
            readerPromise: 'Copy a 45-minute frontend system design RADIO answer script with requirements, architecture, data, interface, optimizations, timeline, and examples.',
            publishedAt: '2026-02-18',
            updatedAt: '2026-06-19',
        },
        load: () =>
            import('../../features/guides/system-design/system-design-radio-framework')
                .then(m => m.SystemDesignRadioFrameworkArticle)
    },
    {
        slug: 'radio-requirements',
        title: 'Frontend System Design Requirements Checklist',
        minutes: 16,
        summary: 'Use this requirements checklist to ask better frontend system design clarifying questions, lock scope, define constraints, and hand off to architecture.',
        seo: {
            title: 'Frontend System Design Requirements Checklist',
            description: 'Ask better frontend system design interview clarifying questions, lock scope, define requirements, success metrics, and hand off to architecture.',
            primaryKeyword: 'frontend system design requirements checklist',
            keywords: [
                'frontend system design clarifying questions',
                'RADIO requirements frontend system design',
                'first 5 minutes frontend system design interview',
                'functional and non-functional requirements frontend system design',
                'requirements questions frontend system design interview',
                'frontend system design requirements',
                'what clarifying questions should I ask in frontend system design',
                'frontend system design requirements before architecture',
                'frontend system design scope box',
                'frontend system design success metrics',
                'frontend system design assumptions and risk log',
                'frontend system design architecture handoff',
                'requirements checklist autocomplete frontend system design',
                'requirements questions news feed frontend system design',
                'requirements checklist dashboard frontend system design',
            ],
            faqPage: {
                name: 'Frontend system design requirements checklist FAQ',
                items: [
                    {
                        question: 'What is a frontend system design requirements checklist?',
                        answer: 'A frontend system design requirements checklist is the RADIO step where you clarify the user flow, scope, constraints, functional requirements, non-functional requirements, success metrics, and risks before drawing architecture.',
                    },
                    {
                        question: 'What clarifying questions should I ask first?',
                        answer: 'Start with the primary user, core task, v1 scope, out-of-scope work, scale assumptions, freshness needs, accessibility baseline, latency target, and failure states that would change the design.',
                    },
                    {
                        question: 'What is the difference between functional and non-functional requirements?',
                        answer: 'Functional requirements describe what the UI must do, such as search, filter, drag, submit, or notify. Non-functional requirements describe quality constraints such as latency, accessibility, reliability, security, offline behavior, and observability.',
                    },
                    {
                        question: 'How long should Requirements take in a frontend system design interview?',
                        answer: 'In a 45-minute frontend system design interview, spend roughly the first 5-8 minutes on Requirements. Use more time only when the prompt is ambiguous or the interviewer signals that constraints are the main challenge.',
                    },
                    {
                        question: 'What should I produce before moving to architecture?',
                        answer: 'Produce a one-line user flow, a Must/Nice/Out scope box, top constraints, two or three success metrics, an assumptions and risk log, and a clear handoff statement into architecture.',
                    },
                ],
            },
            readerPromise: 'Use this frontend system design requirements checklist to turn clarifying questions into a scope box, functional and non-functional requirements, success metrics, and a clean architecture handoff.',
            publishedAt: '2026-02-18',
            updatedAt: '2026-06-02',
        },
        load: () =>
            import('../../features/guides/system-design/system-design-radio-requirements')
                .then(m => m.SystemDesignRadioRequirementsArticle)
    },
    {
        slug: 'architecture',
        title: 'A - Frontend System Design Architecture Guide',
        minutes: 18,
        summary: 'Use this interview guide to structure frontend system design architecture decisions, from rendering boundaries and caching to clear trade-off framing.',
        seo: {
            title: 'Frontend System Design Architecture Guide',
            description: 'Design frontend system architecture with client-side boundaries, rendering strategy, data flow, caching, BFF trade-offs, and interview-ready diagrams.',
            primaryKeyword: 'frontend system design architecture guide',
            keywords: [
                'frontend architecture interview guide',
                'frontend client side architecture interview',
                'frontend rendering strategy system design',
                'frontend architecture diagram interview',
                'CSR vs SSR frontend system design',
                'frontend system design BFF',
                'route by route rendering strategy',
                'frontend system design tradeoffs',
                'what is frontend system design architecture',
                'what should I draw in a frontend architecture interview',
                'how to choose CSR SSR SSG edge rendering',
                'when to use BFF in frontend system design',
                'frontend system design client side boundaries',
                'frontend system design data flow caching',
                'frontend architecture interview rendering strategy',
                'frontend system design architecture diagram',
                'autocomplete frontend architecture interview',
                'news feed frontend architecture system design',
                'dashboard widgets frontend architecture',
                'AI chat frontend architecture system design',
                'design system architecture frontend interview',
            ],
            faqPage: {
                name: 'Frontend system design architecture FAQ',
                items: [
                    {
                        question: 'What is frontend system design architecture?',
                        answer: 'Frontend system design architecture is the part of the interview where you choose client-side boundaries, rendering strategy, data flow, cache layers, BFF or API boundaries, and resilience guardrails that satisfy the requirements.',
                    },
                    {
                        question: 'How do I choose CSR, SSR, SSG, or edge rendering?',
                        answer: 'Choose rendering per route. Use SSR or SSG for SEO and fast public entry routes, CSR for highly interactive authenticated tools, and edge rendering when global latency or cacheable personalization changes the user experience.',
                    },
                    {
                        question: 'What should I draw in a frontend architecture interview?',
                        answer: 'Draw the browser, app shell, router and rendering boundary, server-state cache, UI state, API or BFF boundary, downstream services, failure paths, and observability hooks that prove the design can run in production.',
                    },
                    {
                        question: 'When should I use a BFF in frontend system design?',
                        answer: 'Use a BFF when it reduces client orchestration, aggregates multiple APIs, shapes auth/session-aware responses, enables partial responses, or gives a cleaner caching and latency boundary. Skip it when it is backend topology noise.',
                    },
                    {
                        question: 'How is frontend architecture different from data model or interface design?',
                        answer: 'Architecture chooses system boundaries, rendering modes, data flow, cache layers, and resilience paths. Data model details entities and ownership, while interface design details components, interactions, accessibility, and UI states.',
                    },
                ],
            },
            readerPromise: 'Use this architecture guide to choose client-side boundaries, rendering strategy, BFF trade-offs, cache layers, and an interview-ready frontend architecture diagram.',
            publishedAt: '2025-09-28',
            updatedAt: '2026-06-02',
        },
        load: () =>
            import('../../features/guides/system-design/system-design-architecture')
                .then(m => m.SystemDesignArchitectureArticle)
    },
    {
        slug: 'state-data',
        title: 'D - Data Model Deep Dive for Frontend System Design Interviews',
        minutes: 18,
        summary: 'Master data modeling in a frontend system design interview with entity contracts, UI-state matrix, cache invalidation rules, and mutation rollback patterns.',
        seo: {
            title: 'Frontend State and Data Model System Design Guide',
            description: 'Design frontend state and data models for interviews with server/client state, API contracts, cache keys, invalidation, optimistic updates, and UI states.',
            primaryKeyword: 'frontend state and data model system design',
            keywords: [
                'frontend system design state management',
                'frontend data model interview',
                'frontend API contracts interview',
                'frontend cache invalidation interview',
                'server state vs client state frontend',
                'frontend optimistic updates interview',
                'frontend URL state query params',
                'frontend normalized cache interview',
                'frontend system design data flow',
                'frontend system design cache keys',
                'what is a frontend state and data model in system design',
                'how to separate server state client state and URL state',
                'what should frontend API contracts include',
                'how to explain cache invalidation in frontend interview',
                'when should I use optimistic updates',
                'frontend UI states idle loading error stale partial',
                'frontend query keys TTL invalidation interview',
                'real time search frontend data model',
                'news feed normalized cache frontend system design',
                'dashboard widgets state ownership frontend',
                'AI chat streaming state frontend system design',
            ],
            faqPage: {
                name: 'Frontend state and data model system design FAQ',
                items: [
                    {
                        question: 'What is a frontend state and data model in system design?',
                        answer: 'It is the part of a frontend system design answer where you define entities, API contracts, server state, client state, URL state, cache keys, invalidation, UI states, and mutation behavior.',
                    },
                    {
                        question: 'How do I separate server state, client state, and URL state?',
                        answer: 'Keep server state in API-backed cache, transient interaction state in components or UI stores, and shareable navigation state such as search, filters, sort, and cursor in the URL.',
                    },
                    {
                        question: 'What should frontend API contracts include?',
                        answer: 'Frontend API contracts should include stable IDs, timestamps or versions, pagination shape, error shape, stale or partial metadata, permission-sensitive fields, and the UI state each response can produce.',
                    },
                    {
                        question: 'How should I explain cache invalidation in a frontend interview?',
                        answer: 'Define query keys first, then name TTLs, mutation-triggered invalidation, permission-change invalidation, background refresh behavior, and what the user sees when data is stale.',
                    },
                    {
                        question: 'When should I use optimistic updates?',
                        answer: 'Use optimistic updates when the action is low risk, the rollback path is explicit, conflicts are modeled, and the UI can reconcile the server response without hiding divergence.',
                    },
                ],
            },
            readerPromise: 'Use this data guide to separate server state, client state, URL state, API contracts, cache keys, invalidation, optimistic updates, and interview-ready UI states.',
            publishedAt: '2025-09-28',
            updatedAt: '2026-06-02',
        },
        load: () =>
            import('../../features/guides/system-design/system-design-state')
                .then(m => m.SystemDesignStateArticle)
    },
    {
        slug: 'ux',
        title: 'I - Interface Deep Dive for Frontend System Design Interviews',
        minutes: 18,
        summary: 'Master interface design in a frontend system design interview with component boundaries, UI-state mapping, accessibility contracts, and interaction scripts.',
        seo: {
            title: 'Frontend Interface Design System Design Guide',
            description: 'Design frontend interface contracts for interviews with component boundaries, component APIs, UI states, keyboard focus, accessibility, and degraded UX.',
            primaryKeyword: 'frontend interface design system design',
            keywords: [
                'frontend system design interface guide',
                'frontend component API design interview',
                'frontend accessibility system design',
                'frontend UI states interview',
                'frontend interaction flow interview',
                'keyboard navigation frontend interview',
                'ARIA live regions frontend interview',
                'frontend state to UI mapping',
                'frontend degraded UX interview',
                'frontend responsive interface design',
                'what is frontend interface design in system design interviews',
                'what should a frontend component API include',
                'how to explain keyboard and focus behavior in frontend interview',
                'how to map UI states in frontend system design',
                'frontend component props events callbacks interview',
                'frontend accessibility contract system design',
                'combobox keyboard navigation frontend interview',
                'frontend interface design autocomplete system design',
                'notification toast ARIA live region system design',
                'dashboard widgets keyboard drag resize frontend system design',
            ],
            faqPage: {
                name: 'Frontend interface design system design FAQ',
                items: [
                    {
                        question: 'What is frontend interface design in system design interviews?',
                        answer: 'Frontend interface design is the RADIO step where you turn architecture and data choices into component boundaries, component APIs, user interaction flows, UI states, accessibility behavior, and degraded UX.',
                    },
                    {
                        question: 'What should a frontend component API include?',
                        answer: 'A frontend component API should include props, callbacks or events, controlled and uncontrolled state boundaries, error and loading states, accessibility semantics, and extension points that do not leak implementation details.',
                    },
                    {
                        question: 'How do I explain keyboard and focus behavior?',
                        answer: 'Describe the keyboard map, tab order, arrow-key behavior where relevant, focus transitions after async updates or dialogs, and ARIA/live-region announcements for loading, error, and success states.',
                    },
                    {
                        question: 'How should I map UI states in a frontend system design interview?',
                        answer: 'Map each state to what the user sees, which actions remain available, how focus behaves, and what telemetry proves the state is working: idle, loading, success, empty, error, stale, and partial.',
                    },
                    {
                        question: 'How is Interface different from Data or Optimizations?',
                        answer: 'Data defines entities, ownership, cache keys, and API contracts. Interface defines component responsibility, component APIs, interactions, accessibility, responsive behavior, and user-visible failure states. Optimizations tune performance and rollout risk.',
                    },
                ],
            },
            readerPromise: 'Use this interface guide to define component boundaries, component APIs, UI states, keyboard/focus behavior, accessibility, degraded UX, and interview-ready prompt decisions.',
            publishedAt: '2025-09-28',
            updatedAt: '2026-06-02',
        },
        load: () =>
            import('../../features/guides/system-design/system-design-ux')
                .then(m => m.SystemDesignCrossCuttingArticle)
    },
    {
        slug: 'performance',
        title: 'Frontend System Design Performance Optimization Guide',
        minutes: 18,
        summary: 'Learn frontend system design performance optimization for interviews with Core Web Vitals, budgets, bottleneck diagnosis, trade-offs, rollout, and validation.',
        seo: {
            title: 'Frontend System Design Performance Optimization Guide',
            description: 'Discuss frontend system design performance in interviews with Core Web Vitals, budgets, bottleneck diagnosis, trade-offs, rollout, and validation.',
            primaryKeyword: 'frontend system design performance optimization',
            keywords: [
                'frontend system design performance',
                'frontend system design interview optimization',
                'frontend performance budget interview',
                'Core Web Vitals interview',
                'INP frontend interview',
                'LCP frontend interview',
                'frontend performance metrics interview',
                'performance budget frontend system design',
                'frontend bottleneck diagnosis interview',
                'frontend rendering performance interview',
                'frontend caching tradeoffs interview',
                'frontend system design observability',
                'frontend performance SLO interview',
                'typeahead performance system design',
                'infinite scroll virtualization system design',
                'dashboard performance system design',
                'live chart performance system design',
                'form interaction latency frontend interview',
            ],
            faqPage: {
                name: 'Frontend system design performance optimization FAQ',
                items: [
                    {
                        question: 'How should I discuss performance in a frontend system design interview?',
                        answer: 'Start with the primary user journey, set measurable budgets, diagnose the dominant bottleneck, prioritize the top two fixes, and close with trade-offs, monitoring, rollout, and rollback criteria.',
                    },
                    {
                        question: 'What is a frontend performance budget in a system design interview?',
                        answer: 'A frontend performance budget is a small set of measurable limits for the critical journey, such as LCP, INP, CLS, route p95 latency, JavaScript cost, error rate, and task completion. It turns optimization from preference into an explicit interview constraint.',
                    },
                    {
                        question: 'Which Core Web Vitals should I mention in a frontend interview?',
                        answer: 'Mention LCP for perceived load speed, INP for responsiveness, and CLS for visual stability. Then connect those Core Web Vitals to route p95 latency, JavaScript execution cost, error budget, and the business task in the prompt.',
                    },
                    {
                        question: 'How do I diagnose frontend performance bottlenecks in a system design interview?',
                        answer: 'Trace the primary user path across network, server response, payload size, JavaScript parse and execution, rendering, data joins, and interaction work. Use p75 Core Web Vitals and p95 route or interaction latency so the slow tail is visible.',
                    },
                    {
                        question: 'Is INP better than FID for frontend interview answers?',
                        answer: 'Yes. INP is the current Core Web Vitals responsiveness metric, so interview answers should prefer INP while mentioning FID only as an older metric if the prompt uses it.',
                    },
                    {
                        question: 'What trade-offs should I call out for frontend performance optimization?',
                        answer: 'Common trade-offs include faster first paint versus server cost, aggressive caching versus stale data, code splitting versus waterfalls, virtualization versus accessibility, and optimistic UI versus rollback complexity.',
                    },
                ],
            },
            searchIntent: 'Find an interview-focused frontend system design performance optimization guide that explains budgets, Core Web Vitals, bottleneck diagnosis, scenario trade-offs, rollout, and validation.',
            readerPromise: 'Use this performance optimization guide to explain Core Web Vitals, bottleneck diagnosis, top-two prioritization, trade-offs, observability, rollout, and interview-ready scripts.',
            publishedAt: '2025-09-28',
            updatedAt: '2026-06-02',
        },
        load: () =>
            import('../../features/guides/system-design/system-design-performance')
                .then(m => m.SystemDesignPerformanceArticle)
    },
    {
        slug: 'evaluation',
        title: 'Frontend System Design Interview Rubric and Scorecard',
        minutes: 12,
        summary: 'Use a frontend system design interview rubric to score requirements, architecture, state, interfaces, performance, trade-offs, and communication.',
        seo: {
            title: 'Frontend System Design Interview Rubric and Scorecard',
            description: 'Use a frontend system design interview rubric to score requirements, architecture, state, interfaces, performance, trade-offs, and communication.',
            primaryKeyword: 'frontend system design interview rubric',
            keywords: [
                'frontend system design interview scorecard',
                'frontend system design evaluation criteria',
                'what interviewers look for frontend system design',
                'frontend system design interview signals',
                'senior frontend system design interview rubric',
                'frontend architecture interview rubric',
                'frontend system design strong hire signals',
                'system design interview scorecard frontend',
                'frontend system design self review',
                'frontend system design mock interview rubric',
                'frontend system design weak signals',
                'frontend system design communication signals',
                'frontend system design tradeoff evaluation',
                'frontend state management interview rubric',
                'frontend API contract interview rubric',
                'frontend performance accessibility interview rubric',
                'autocomplete frontend system design rubric',
                'infinite scroll system design evaluation',
                'dashboard frontend system design scorecard',
                'design system architecture interview rubric',
            ],
            faqPage: {
                name: 'Frontend system design interview rubric FAQ',
                items: [
                    {
                        question: 'How are frontend system design interviews scored?',
                        answer: 'Interviewers score how clearly you scope requirements, choose frontend architecture, model state and data, define interfaces, handle performance and accessibility, and communicate trade-offs under time pressure.',
                    },
                    {
                        question: 'What is a strong hire signal in frontend system design?',
                        answer: 'A strong hire signal is a decision that connects product constraints to browser behavior, names alternatives, explains trade-offs, and includes validation or rollback criteria.',
                    },
                    {
                        question: 'How do I use a frontend system design scorecard after a mock interview?',
                        answer: 'Score each rubric axis from 1 to 5, write the weakest missing evidence, pick one practice prompt that targets that gap, and repeat the answer with a clearer artifact or script cue.',
                    },
                    {
                        question: 'What do senior frontend system design answers include?',
                        answer: 'Senior answers show ownership of scope, rendering strategy, state boundaries, API contracts, accessibility, performance budgets, failure modes, observability, and realistic rollout trade-offs.',
                    },
                    {
                        question: 'What are red flags in frontend system design interviews?',
                        answer: 'Common red flags include jumping to diagrams before scope, giving backend-only answers, skipping constraints, ignoring accessibility or performance, listing tools without trade-offs, and rambling without checkpoints.',
                    },
                ],
            },
            searchIntent: 'Find a frontend system design interview rubric that explains what interviewers score, what weak and strong signals look like, and how to self-review a mock answer.',
            readerPromise: 'Use this scorecard to grade frontend system design answers across requirements, architecture, state, interfaces, performance, accessibility, trade-offs, and communication.',
            uniqueAngle: 'RADIO-mapped rubric with weak, solid, and strong-hire signals plus a self-review loop tied to FrontendAtlas practice prompts.',
            publishedAt: '2025-09-28',
            updatedAt: '2026-06-02',
        },
        load: () =>
            import('../../features/guides/system-design/system-design-evaluation')
                .then(m => m.SystemDesignSignalsArticle)
    },
    {
        slug: 'pitfalls',
        title: 'Frontend System Design Interview Pitfalls and Red Flags',
        minutes: 11,
        summary: 'Avoid frontend system design mistakes with red flags, repair scripts, RADIO mapping, and scenario-specific fixes.',
        seo: {
            title: 'Frontend System Design Interview Pitfalls and Red Flags',
            description: 'Avoid frontend system design interview pitfalls with red flags, repair scripts, and fixes for architecture, state, APIs, performance, and accessibility.',
            primaryKeyword: 'frontend system design interview pitfalls',
            keywords: [
                'frontend system design mistakes',
                'frontend system design red flags',
                'frontend system design anti patterns',
                'frontend system design interview mistakes',
                'frontend system design common mistakes',
                'system design mistakes to avoid frontend',
                'frontend architecture interview mistakes',
                'frontend performance interview mistakes',
                'frontend accessibility system design mistakes',
                'frontend state management interview mistakes',
                'frontend API contract interview mistakes',
                'frontend system design interviewer hints',
                'frontend system design loading error empty states',
                'frontend system design over engineering',
                'frontend system design tradeoff mistakes',
            ],
            faqPage: {
                name: 'Frontend system design interview pitfalls FAQ',
                items: [
                    {
                        question: 'What are the biggest frontend system design interview pitfalls?',
                        answer: 'The biggest pitfalls are skipping requirements, giving backend-only answers, listing buzzwords, ignoring state ownership, hand-waving API and component contracts, missing accessibility or performance, and rambling without checkpoints.',
                    },
                    {
                        question: 'How do I recover if my frontend system design answer gets messy?',
                        answer: 'Pause, restate the primary user flow, name the constraint you are optimizing for, choose the next artifact, and ask the interviewer whether to go deeper on architecture, data, interface, or performance.',
                    },
                    {
                        question: 'Why are backend-only answers a red flag in frontend system design?',
                        answer: 'Frontend rounds score browser rendering, client state, component contracts, user-visible failure states, accessibility, and performance. Backend awareness helps, but it should support the UI design instead of replacing it.',
                    },
                    {
                        question: 'What frontend performance mistakes should I avoid in system design interviews?',
                        answer: 'Avoid random optimization lists. Tie performance work to a bottleneck, metric, budget, trade-off, rollout plan, and validation method for the user-critical path.',
                    },
                    {
                        question: 'How do pitfalls differ from a frontend system design checklist?',
                        answer: 'A checklist confirms coverage before you finish. Pitfalls identify weak signals as they happen and give repair scripts for recovering during the interview.',
                    },
                ],
            },
            searchIntent: 'Find frontend system design interview mistakes, red flags, and repair scripts that explain what to avoid and what to say instead during real rounds.',
            readerPromise: 'Use this pitfalls guide to catch weak signals, recover messy answers, and connect fixes to RADIO, rubric scoring, checklist review, and practice prompts.',
            uniqueAngle: 'Frontend-specific red flags with repair scripts, RADIO mapping, and scenario prompts instead of a generic system design mistake list.',
            publishedAt: '2025-09-28',
            updatedAt: '2026-06-02',
        },
        load: () =>
            import('../../features/guides/system-design/system-design-pitfalls')
                .then(m => m.SystemDesignTrapsArticle)
    },
    {
        slug: 'checklist',
        title: 'Frontend System Design Interview Checklist: Final Review',
        minutes: 10,
        summary: 'Run a frontend system design final review across requirements, architecture, state, APIs, accessibility, performance, trade-offs, and closing.',
        seo: {
            title: 'Frontend System Design Interview Checklist: Final Review',
            description: 'Use a frontend system design interview checklist to review requirements, rendering, state, APIs, accessibility, performance, trade-offs, and closing scripts.',
            primaryKeyword: 'frontend system design interview checklist',
            keywords: [
                'frontend system design checklist',
                'frontend system design final review',
                'frontend system design cheatsheet',
                'frontend system design interview prep checklist',
                'frontend architecture interview checklist',
                'frontend system design final pass',
                'frontend system design review checklist',
                'frontend system design last minute checklist',
                'frontend system design closing script',
                'senior frontend system design checklist',
                'frontend state and API checklist',
                'frontend UI states checklist',
                'frontend accessibility performance checklist',
                'frontend system design tradeoffs checklist',
            ],
            faqPage: {
                name: 'Frontend system design interview checklist FAQ',
                items: [
                    {
                        question: 'What should a frontend system design interview checklist include?',
                        answer: 'A strong checklist should cover requirements, non-goals, rendering strategy, state ownership, API and component contracts, loading and failure states, accessibility, performance, observability, trade-offs, rollout risk, and closing summary.',
                    },
                    {
                        question: 'When should I use a frontend system design final review checklist?',
                        answer: 'Use it during the last few minutes of a mock or real interview, and again after practice, to catch missing evidence before the answer ends.',
                    },
                    {
                        question: 'How is this checklist different from a rubric?',
                        answer: 'A rubric scores answer quality. This checklist is a final pass that helps you verify coverage and close gaps before the interviewer has to ask.',
                    },
                    {
                        question: 'What frontend-specific checks are easy to miss?',
                        answer: 'Candidates often miss loading, empty, error, stale, and partial states; focus behavior; cache invalidation; route-level performance; degraded UX; and observability.',
                    },
                    {
                        question: 'How do I close a frontend system design interview answer?',
                        answer: 'Close by summarizing the scoped user path, architecture choice, state and API contracts, biggest trade-off, known risk, and validation plan.',
                    },
                    {
                        question: 'Is this checklist a replacement for a full frontend system design guide?',
                        answer: 'No. Use the full guide or RADIO framework to structure the answer, then use this checklist as the final review pass for missing requirements, contracts, UI states, accessibility, performance, trade-offs, and closing.',
                    },
                ],
            },
            searchIntent: 'Find a frontend system design interview checklist for last-minute review, final answer coverage, and closing scripts before or during a system design round.',
            readerPromise: 'Use this final review checklist to catch missing requirements, architecture, state, API, UI state, accessibility, performance, trade-off, and closing evidence.',
            uniqueAngle: 'Frontend-specific final pass with pass/warn/fail checks, timed review, scenario prompts, and links back to rubric, pitfalls, performance, and RADIO.',
            publishedAt: '2025-09-28',
            updatedAt: '2026-06-02',
        },
        load: () =>
            import('../../features/guides/system-design/system-design-checklist')
                .then(m => m.SystemDesignChecklistArticle)
    },
];

export const SYSTEM_GROUPS = [
    { title: 'Introduction', items: [{ slug: 'intro' }] },
    { title: 'Core concepts', items: [{ slug: 'foundations' }, { slug: 'framework' }] },
    { title: 'RADIO guide', items: [{ slug: 'radio-framework' }, { slug: 'radio-requirements' }, { slug: 'architecture' }, { slug: 'state-data' }, { slug: 'ux' }, { slug: 'performance' }] },
    { title: 'Interview focus', items: [{ slug: 'evaluation' }, { slug: 'pitfalls' }, { slug: 'checklist' }] },
];

/* ---------------------------------- BEHAVIORAL ---------------------------------- */

export const BEHAVIORAL: GuideEntry[] = [
    {
        slug: 'intro',
        title: 'Frontend Behavioral Interview Questions: 12 STAR Answers',
        minutes: 18,
        summary: 'Practice 12 frontend behavioral interview questions with STAR(R) answer outlines, weak-vs-strong examples, scoring signals, and frontend scenarios.',
        seo: {
            title: 'Frontend Behavioral Interview Questions: 12 STAR Answers',
            description: 'Practice 12 frontend behavioral interview questions with STAR(R) answer outlines, weak-vs-strong examples, scoring signals, and frontend scenarios.',
            primaryKeyword: 'frontend behavioral interview questions',
            keywords: [
                'frontend behavioral interview questions',
                'frontend behavioral interview guide',
                'behavioral interview answers for software engineers',
                'STAR stories for frontend engineers',
                'frontend interview behavioral questions',
                'frontend behavioral interview examples',
                'frontend developer behavioral interview questions and answers',
                'software engineer behavioral interview stories',
                'frontend STAR interview answers',
                'frontend performance behavioral interview answer',
                'frontend accessibility behavioral interview answer',
                'frontend production incident behavioral interview answer',
                'frontend conflict with design interview answer',
                'frontend API conflict behavioral interview answer',
                'ambiguous requirements frontend interview answer',
            ],
            faqPage: {
                name: 'Frontend behavioral interview questions FAQ',
                items: [
                    {
                        question: 'What frontend behavioral interview questions should I practice?',
                        answer: 'Practice questions about performance, accessibility, incidents, API contracts, ambiguous requirements, design disagreements, mentoring, feedback, deadlines, and cross-functional launches.',
                    },
                    {
                        question: 'How do frontend engineers prepare for behavioral interviews?',
                        answer: 'Frontend engineers should prepare four to six stories that cover collaboration, ownership, ambiguity, incidents, accessibility, performance, and delivery trade-offs. Each story should use STAR(R), include a measurable result, and have a 60-90 second spoken version.',
                    },
                    {
                        question: 'What STAR stories should frontend engineers prepare?',
                        answer: 'Prepare stories about a performance win, accessibility push, incident or rollback, API contract conflict, ambiguous product scope, mentoring moment, and cross-functional disagreement.',
                    },
                    {
                        question: 'How long should a behavioral answer be?',
                        answer: 'Most behavioral answers should be about 60-90 seconds. Spend the early part on context and actions, then close with result, trade-off, and reflection.',
                    },
                    {
                        question: 'What do frontend behavioral interviews evaluate?',
                        answer: 'They evaluate communication, collaboration, ownership, judgment, growth, and whether your frontend decisions connect to user experience, accessibility, performance, reliability, and delivery quality.',
                    },
                    {
                        question: 'How do I make a frontend behavioral answer stronger?',
                        answer: 'Make the story specific, name the trade-offs, quantify the result, show how you worked with design, product, QA, or back-end partners, and explain what changed after the story.',
                    },
                    {
                        question: 'Which frontend examples work best for behavioral interviews?',
                        answer: 'Strong examples involve user-visible impact: performance regression recovery, accessible component decisions, incident response, API contract alignment, ambiguous feature scope, and mentoring or review systems.',
                    },
                ],
            },
            itemList: {
                name: 'Frontend behavioral interview questions to practice',
                items: [
                    {
                        name: 'Tell me about a time you improved frontend performance.',
                        description: 'Practice a STAR(R) answer about profiling a slow route, reducing bundle or render cost, coordinating rollout, and proving Core Web Vitals recovery.',
                        url: '#frontend-behavioral-interview-questions-to-practice',
                    },
                    {
                        name: 'Tell me about a time you disagreed with design or product on a frontend decision.',
                        description: 'Show how you influenced a UI decision with accessibility, usability, delivery risk, or measurable user impact.',
                        url: '#frontend-behavioral-interview-questions-to-practice',
                    },
                    {
                        name: 'Tell me about a production incident or rollback you handled.',
                        description: 'Explain how you reduced blast radius, rolled back or flagged off a bad release, communicated status, and improved tests or monitoring.',
                        url: '#frontend-behavioral-interview-questions-to-practice',
                    },
                    {
                        name: 'Tell me about a conflict with a back-end team or API contract.',
                        description: 'Describe how you aligned on schema, loading, pagination, errors, or cache behavior so the frontend could ship predictably.',
                        url: '#frontend-behavioral-interview-questions-to-practice',
                    },
                    {
                        name: 'Tell me about a project with ambiguous requirements.',
                        description: 'Show how you mapped flows, named unknowns, created a thin-slice milestone, and made success measurable.',
                        url: '#frontend-behavioral-interview-questions-to-practice',
                    },
                    {
                        name: 'Tell me about an accessibility trade-off you influenced.',
                        description: 'Connect user impact, standards, design constraints, and a pragmatic implementation path.',
                        url: '#frontend-behavioral-interview-questions-to-practice',
                    },
                    {
                        name: 'Tell me about a time you balanced quality and a tight deadline.',
                        description: 'Show the trade-off, risk controls, release strategy, and what quality bar stayed non-negotiable.',
                        url: '#frontend-behavioral-interview-questions-to-practice',
                    },
                    {
                        name: 'Tell me about mentoring or leveling up another frontend engineer.',
                        description: 'Explain the coaching loop, review habit, pairing approach, and team-level result.',
                        url: '#frontend-behavioral-interview-questions-to-practice',
                    },
                    {
                        name: 'Tell me about receiving difficult technical feedback and what changed.',
                        description: 'Show self-awareness, behavior change, and how the feedback improved your work or team process.',
                        url: '#frontend-behavioral-interview-questions-to-practice',
                    },
                    {
                        name: 'Tell me about a technical decision you changed your mind on.',
                        description: 'Show judgment, evidence gathering, humility, and how you communicated the updated direction.',
                        url: '#frontend-behavioral-interview-questions-to-practice',
                    },
                    {
                        name: 'Tell me about improving a review, testing, or release process.',
                        description: 'Connect process improvement to fewer regressions, faster reviews, safer deploys, or clearer ownership.',
                        url: '#frontend-behavioral-interview-questions-to-practice',
                    },
                    {
                        name: 'Tell me about coordinating a frontend launch across design, product, QA, and back-end.',
                        description: 'Show cross-functional planning, dependency management, risk tracking, and launch communication.',
                        url: '#frontend-behavioral-interview-questions-to-practice',
                    },
                ],
            },
            publishedAt: '2025-10-01',
            updatedAt: '2026-06-18',
            readerPromise: 'Use these 12 frontend behavioral interview questions to build STAR(R) answer outlines, compare weak and strong answers, and prepare frontend-specific examples before the call.',
        },
        load: () =>
            import('../../features/guides/behavioral/behavioral-intro')
                .then(m => m.BehavioralIntroArticle),
    },
    {
        slug: 'big-picture',
        title: 'Frontend Behavioral Interview Process: What Interviewers Score',
        minutes: 14,
        summary: 'Understand where frontend behavioral interviews fit in the hiring loop, what interviewers score, and how onsite signals affect decisions.',
        seo: {
            title: 'Frontend Behavioral Interview Process: What Interviewers Score',
            description: 'See where behavioral rounds fit in frontend interviews, what hiring managers score onsite, and which stories reduce debrief risk.',
            primaryKeyword: 'frontend behavioral interview process',
            keywords: [
                'frontend behavioral interview round',
                'frontend behavioral onsite interview',
                'frontend hiring manager interview',
                'behavioral interview screening and onsite',
                'frontend interview hiring signals',
                'software engineer behavioral interview process',
                'frontend behavioral interview scorecard',
                'what do frontend behavioral interviewers look for',
                'behavioral interview debrief signals',
                'senior frontend engineer behavioral interview',
                'frontend interview ownership examples',
                'frontend production incident behavioral interview',
            ],
            faqPage: {
                name: 'Frontend behavioral interview process FAQ',
                items: [
                    {
                        question: 'Where do behavioral interviews fit in a frontend hiring process?',
                        answer: 'Behavioral signals start in the recruiter screen, sharpen during the hiring manager conversation, and often decide close onsite loops during debrief or hiring committee review.',
                    },
                    {
                        question: 'What do frontend behavioral interviewers look for?',
                        answer: 'They look for ownership, communication, judgment, collaboration, growth, and whether your examples show reliable frontend delivery across product, design, backend, QA, accessibility, performance, and incidents.',
                    },
                    {
                        question: 'What happens in a frontend behavioral onsite interview?',
                        answer: 'The onsite round usually pressure-tests one or two real projects from several angles: what you owned, how you handled risk, how you aligned stakeholders, and what changed after the work shipped.',
                    },
                    {
                        question: 'Can you fail a software engineer interview because of behavioral?',
                        answer: 'Yes. Strong coding can still fail if the loop hears unclear ownership, poor conflict handling, blame, weak communication, or no learning from production mistakes.',
                    },
                    {
                        question: 'How do behavioral signals affect onsite debrief decisions?',
                        answer: 'Interviewers compare notes for repeatable evidence. Specific stories with actions, trade-offs, measurable results, and reflection reduce hiring risk; vague answers create leveling or trust concerns.',
                    },
                    {
                        question: 'What behavioral signals matter for senior frontend engineers?',
                        answer: 'Senior frontend candidates need examples of leverage: ambiguous scope ownership, technical direction, mentoring, cross-team influence, better release systems, and risk judgment around performance, accessibility, or reliability.',
                    },
                    {
                        question: 'What frontend stories should I prepare for each round?',
                        answer: 'Prepare stories about a performance regression, accessibility disagreement, incident rollback, API contract conflict, ambiguous PM or design scope, release risk, mentoring, and process improvement.',
                    },
                    {
                        question: 'How is this different from frontend behavioral interview questions practice?',
                        answer: 'This page explains the hiring process and scoring signals. The question practice page helps you turn those signals into STAR(R) answer outlines for specific prompts.',
                    },
                ],
            },
            itemList: {
                name: 'Frontend behavioral interview process stages',
                items: [
                    {
                        name: 'Recruiter screen',
                        description: 'Checks motivation, communication, role fit, logistics, and a concise frontend impact headline.',
                        url: '#frontend-behavioral-interview-stage-map',
                    },
                    {
                        name: 'Hiring manager screen',
                        description: 'Checks ownership level, collaboration habits, scope, and whether your frontend stories match the role.',
                        url: '#frontend-behavioral-interview-stage-map',
                    },
                    {
                        name: 'Onsite behavioral round',
                        description: 'Checks past behavior under pressure through conflict, ambiguity, failure, judgment, and growth stories.',
                        url: '#frontend-behavioral-interview-stage-map',
                    },
                    {
                        name: 'Cross-functional round',
                        description: 'Checks how you work with product, design, QA, backend, data, and support partners.',
                        url: '#frontend-behavioral-interview-stage-map',
                    },
                    {
                        name: 'Debrief and hiring committee',
                        description: 'Turns interviewer notes into pass, mixed, or risk signals for the final hiring decision.',
                        url: '#frontend-behavioral-interview-stage-map',
                    },
                ],
            },
            publishedAt: '2025-10-01',
            updatedAt: '2026-06-18',
            readerPromise: 'Use this frontend behavioral interview process guide to understand each hiring stage, the onsite signals interviewers score, and which stories to prepare before debrief.',
        },
        load: () =>
            import('../../features/guides/behavioral/behavioral-big-picture')
                .then(m => m.BehavioralBigPictureArticle),
    },
    {
        slug: 'evaluation-areas',
        title: 'Frontend Behavioral Interview Scorecard: 6 Signals',
        minutes: 14,
        summary: 'Use this frontend behavioral interview scorecard for communication, collaboration, ownership, growth, and leadership so each story maps to clear hiring signals.',
        seo: {
            title: 'Frontend Behavioral Interview Scorecard: 6 Signals',
            description: 'See the 6 signals frontend interviewers score, weak-vs-strong evidence, seniority expectations, and stories that reduce debrief risk.',
            primaryKeyword: 'frontend behavioral interview scorecard',
            keywords: [
                'frontend behavioral interview scorecard',
                'behavioral interview scorecard',
                'behavioral interview scorecard for software engineers',
                'behavioral evaluation areas',
                'behavioral interview competencies',
                'what do behavioral interviewers evaluate',
                'behavioral interview scoring rubric',
                'frontend behavioral interview rubric',
                'behavioral interview evaluation criteria',
                'software engineer behavioral interview rubric',
                'ownership behavioral interview signal',
                'senior frontend behavioral interview signals',
                'weak vs strong behavioral interview signals',
                'frontend performance behavioral interview story',
                'accessibility behavioral interview example',
                'production incident behavioral interview example',
                'API contract conflict behavioral interview',
                'design disagreement behavioral interview frontend',
            ],
            faqPage: {
                name: 'Frontend behavioral interview scorecard FAQ',
                items: [
                    {
                        question: 'What do behavioral interviewers evaluate?',
                        answer: 'Behavioral interviewers evaluate communication, collaboration, ownership, judgment, growth, and leadership signals. For frontend roles, they also look for evidence around accessibility, performance, release risk, API alignment, and cross-functional delivery.',
                    },
                    {
                        question: 'How are behavioral interviews scored?',
                        answer: 'Interviewers compare specific evidence from your stories against a scorecard. Clear actions, trade-offs, measurable results, and reflection reduce debrief risk; vague claims or blame create concern.',
                    },
                    {
                        question: 'What is a strong ownership signal in a behavioral interview?',
                        answer: 'A strong ownership signal shows that you found a risk, clarified the decision, coordinated the right people, followed through, measured the outcome, and improved the next release or process.',
                    },
                    {
                        question: 'How do senior frontend engineers show behavioral signals?',
                        answer: 'Senior frontend engineers show leverage: cross-functional risk management, mentoring, technical direction, better review or release systems, and decisions that help multiple teammates ship better work.',
                    },
                    {
                        question: 'Which frontend stories map well to behavioral interview scorecards?',
                        answer: 'Strong frontend stories include performance regressions, accessibility blockers, design disagreements, backend API contract conflicts, production rollbacks, ambiguous product scope, and mentoring or review process improvements.',
                    },
                    {
                        question: 'How do I use a frontend behavioral interview scorecard to prepare?',
                        answer: 'Pick six stories, tag each with two scorecard signals, add missing evidence such as trade-offs or metrics, then practice closing with the signal and result an interviewer can repeat in debrief.',
                    },
                ],
            },
            itemList: {
                name: 'Frontend behavioral interview scorecard signals',
                items: [
                    {
                        name: 'Communication',
                        description: 'Explains context, decisions, and trade-offs clearly for the audience.',
                        url: '#frontend-behavioral-interview-scorecard-signals',
                    },
                    {
                        name: 'Collaboration',
                        description: 'Shows how the candidate disagrees, aligns stakeholders, and preserves trust.',
                        url: '#frontend-behavioral-interview-scorecard-signals',
                    },
                    {
                        name: 'Ownership',
                        description: 'Shows risk discovery, follow-through, coordination, and measurable outcomes.',
                        url: '#frontend-behavioral-interview-scorecard-signals',
                    },
                    {
                        name: 'Judgment',
                        description: 'Shows practical trade-offs across user impact, quality, reliability, and deadlines.',
                        url: '#frontend-behavioral-interview-scorecard-signals',
                    },
                    {
                        name: 'Growth',
                        description: 'Shows how feedback or mistakes changed behavior, systems, or guardrails.',
                        url: '#frontend-behavioral-interview-scorecard-signals',
                    },
                    {
                        name: 'Leadership and seniority',
                        description: 'Shows mentoring, team leverage, repeatable systems, and broader alignment.',
                        url: '#frontend-behavioral-interview-scorecard-signals',
                    },
                ],
            },
            publishedAt: '2025-10-01',
            updatedAt: '2026-06-18',
            readerPromise: 'Use this frontend behavioral interview scorecard to map frontend stories to communication, collaboration, ownership, judgment, growth, and seniority signals before the interview.',
        },
        load: () =>
            import('../../features/guides/behavioral/behavioral-evaluation-areas')
                .then(m => m.BehavioralEvaluationAreasArticle),
    },
    {
        slug: 'prep',
        title: 'Frontend Behavioral Interview Prep Plan: 7 Days, Stories, and STAR(R)',
        minutes: 18,
        summary: 'Build a frontend behavioral interview prep plan with a 7-day routine, story bank, STAR(R) notes, mock loops, and final questions.',
        seo: {
            title: 'Frontend Behavioral Interview Prep Plan: 7 Days',
            description: 'Build a frontend behavioral interview prep plan with STAR(R) stories, a 7-day routine, weak-vs-strong notes, seniority signals, and final questions.',
            primaryKeyword: 'frontend behavioral interview prep plan',
            keywords: [
                'frontend behavioral interview prep plan',
                'frontend behavioral interview preparation',
                'STAR stories for frontend engineers',
                'frontend behavioral story bank',
                'software engineer behavioral interview prep',
                'software engineer behavioral interview prep plan',
                'behavioral interview practice plan',
                'frontend performance behavioral interview story',
                'accessibility behavioral interview example',
                'API contract conflict behavioral interview',
                'production incident behavioral interview example',
                'design disagreement behavioral interview frontend',
                'frontend behavioral interview final questions',
                'frontend behavioral interview mock practice',
                'senior frontend behavioral interview preparation',
            ],
            faqPage: {
                name: 'Frontend behavioral interview prep plan FAQ',
                items: [
                    {
                        question: 'How should frontend engineers prepare for behavioral interviews?',
                        answer: 'Frontend engineers should collect role-specific stories, map each story to interview signals, write STAR(R) bullets, quantify impact, practice follow-up questions, and prepare final questions for the team.',
                    },
                    {
                        question: 'How many behavioral stories should I prepare?',
                        answer: 'Prepare 7 to 10 raw stories, then select 4 or 5 strong examples for the role. Cover conflict, failure, ambiguity, ownership, leadership, feedback, and delivery under pressure.',
                    },
                    {
                        question: 'What frontend stories work best for behavioral interviews?',
                        answer: 'Strong frontend stories include performance regressions, accessibility blockers, API contract conflicts, design disagreements, production incidents, ambiguous scope, and mentoring or review process improvements.',
                    },
                    {
                        question: 'What does STAR(R) mean in behavioral interview prep?',
                        answer: 'STAR(R) means Situation, Task, Action, Result, and Reflection. The reflection step shows what changed in your process, checklist, monitoring, review habits, or judgment after the story.',
                    },
                    {
                        question: 'How do I avoid sounding rehearsed in a behavioral interview?',
                        answer: 'Use bullets instead of scripts, practice the same story against different prompts, and rehearse follow-up questions that test ownership, judgment, collaboration, and growth.',
                    },
                    {
                        question: 'How should senior frontend engineers prepare differently?',
                        answer: 'Senior and staff frontend engineers should prepare stories with broader scope: ambiguous projects, cross-functional risk, mentoring, incident prevention, technical direction, and repeatable team systems.',
                    },
                    {
                        question: 'What should I review the night before a behavioral interview?',
                        answer: 'Review the job description, pick four mapped stories, say each answer once, check each story for a metric and reflection, prepare two final questions, and stop editing.',
                    },
                ],
            },
            itemList: {
                name: '7-day frontend behavioral interview prep plan',
                items: [
                    {
                        name: 'Day 1: Collect frontend stories',
                        description: 'List raw stories from launches, regressions, incidents, accessibility, API alignment, ambiguous scope, and mentoring.',
                        url: '#7-day-frontend-behavioral-interview-prep-plan',
                    },
                    {
                        name: 'Day 2: Map stories to signals',
                        description: 'Tag each story with communication, collaboration, ownership, judgment, growth, or leadership/seniority.',
                        url: '#7-day-frontend-behavioral-interview-prep-plan',
                    },
                    {
                        name: 'Day 3: Write STAR(R) notes',
                        description: 'Turn the strongest examples into short Situation, Task, Action, Result, and Reflection bullets.',
                        url: '#7-day-frontend-behavioral-interview-prep-plan',
                    },
                    {
                        name: 'Day 4: Quantify impact and trade-offs',
                        description: 'Add user impact, metrics, risk reduction, scope, trade-offs, and follow-up guardrails.',
                        url: '#7-day-frontend-behavioral-interview-prep-plan',
                    },
                    {
                        name: 'Day 5: Practice follow-up questions',
                        description: 'Rehearse second-order questions about ownership, decisions, disagreement, growth, and seniority.',
                        url: '#7-day-frontend-behavioral-interview-prep-plan',
                    },
                    {
                        name: 'Day 6: Prepare final questions',
                        description: 'Write role-specific questions about quality bars, release risk, product/design trade-offs, and success metrics.',
                        url: '#7-day-frontend-behavioral-interview-prep-plan',
                    },
                    {
                        name: 'Day 7: Run a night-before tune-up',
                        description: 'Pick four stories, say each once, check metrics and reflections, then stop editing.',
                        url: '#7-day-frontend-behavioral-interview-prep-plan',
                    },
                ],
            },
            publishedAt: '2025-10-01',
            updatedAt: '2026-06-19',
            readerPromise: 'Use this frontend behavioral interview prep plan to build a 7-day routine, choose frontend-specific STAR(R) stories, practice follow-ups, and prepare final questions before the interview.',
        },
        load: () =>
            import('../../features/guides/behavioral/behavioral-prep')
                .then(m => m.BehavioralPrepArticle),
    },
    {
        slug: 'stories',
        title: 'Crafting STAR Stories',
        minutes: 14,
        summary: 'A practical recipe to structure concise, memorable examples.',
        seo: {
            title: 'STAR Stories for Behavioral Interviews: A Practical Answer Framework',
            description: 'Learn a practical interview framework to craft STAR stories that are concise, credible, and memorable across common behavioral prompts.',
            primaryKeyword: 'star stories for behavioral interviews',
            keywords: ['star stories for behavioral interviews', 'behavioral story framework', 'how to craft star stories'],
            publishedAt: '2025-10-01',
            updatedAt: '2026-04-04',
        },
        load: () =>
            import('../../features/guides/behavioral/behavioral-stories')
                .then(m => m.BehavioralStoriesArticle),
    },
    {
        slug: 'common-questions',
        title: 'Behavioral Interview Questions: How to Answer Common Prompts',
        minutes: 18,
        summary: 'Use clear frameworks and sample answer structures for top behavioral interview questions like conflict, failure, leadership, and “tell me about yourself.”',
        seo: {
            title: 'Behavioral Interview Questions: How to Answer Common Prompts',
            description: 'Use clear frameworks and sample answer structures for top behavioral interview questions like conflict, failure, leadership, and “tell me about yourself.”',
            primaryKeyword: 'behavioral interview questions',
            keywords: ['behavioral interview questions', 'common behavioral prompts', 'behavioral interview answers'],
            publishedAt: '2025-10-01',
            updatedAt: '2026-04-04',
        },
        load: () =>
            import('../../features/guides/behavioral/behavioral-common-questions')
                .then(m => m.BehavioralQuestionsArticle),
    },
    {
        slug: 'fe-advanced',
        title: 'Frontend Behavioral Interview Scenarios: How to Answer Technical Prompts',
        minutes: 13,
        summary: 'Answer frontend-specific behavioral prompts on trade-offs, accessibility, performance, and cross-team collaboration with structured, interview-ready examples.',
        seo: {
            title: 'Frontend Behavioral Interview Scenarios: How to Answer Technical Prompts',
            description: 'Answer frontend-specific behavioral prompts on trade-offs, accessibility, performance, and cross-team collaboration with structured, interview-ready examples.',
            primaryKeyword: 'frontend behavioral interview scenarios',
            keywords: ['frontend behavioral interview scenarios', 'technical behavioral interview examples', 'frontend collaboration tradeoffs stories'],
            publishedAt: '2025-10-01',
            updatedAt: '2026-04-04',
        },
        load: () =>
            import('../../features/guides/behavioral/behavioral-fe-advanced')
                .then(m => m.BehavioralFeAdvancedArticle),
    },
    {
        slug: 'practical-tips',
        title: 'Behavioral Interview Tips: Common Mistakes and Better Answers',
        minutes: 8,
        summary: 'Fix the delivery mistakes that weaken behavioral interviews: rambling, vague answers, weak impact, and poor remote interview habits.',
        seo: {
            title: 'Behavioral Interview Tips: Common Mistakes and Better Answers',
            description: 'Fix the delivery mistakes that weaken behavioral interviews: rambling, vague answers, weak impact, and poor remote interview habits.',
            primaryKeyword: 'behavioral interview tips',
            keywords: ['behavioral interview tips', 'behavioral interview mistakes', 'better behavioral answers'],
            publishedAt: '2025-10-01',
            updatedAt: '2026-04-04',
        },
        load: () =>
            import('../../features/guides/behavioral/behavioral-practical-tips')
                .then(m => m.BehavioralTipsArticle),
    },
    {
        slug: 'checklist',
        title: 'Behavioral Interview Checklist: Last-Minute Prep Before the Call',
        minutes: 5,
        summary: 'A fast pre-interview checklist for behavioral rounds: story bank, company research, questions to ask, and final delivery checks.',
        seo: {
            title: 'Behavioral Interview Checklist: Last-Minute Prep Before the Call',
            description: 'A fast pre-interview checklist for behavioral rounds: story bank, company research, questions to ask, and final delivery checks.',
            primaryKeyword: 'behavioral interview checklist',
            keywords: ['behavioral interview checklist', 'last minute behavioral interview prep', 'behavioral interview review'],
            publishedAt: '2025-10-01',
            updatedAt: '2026-04-04',
        },
        load: () =>
            import('../../features/guides/behavioral/behavioral-checklist')
                .then(m => m.BehavioralChecklistArticle),
    },
];

export const BEHAVIORAL_GROUPS = [
    { title: 'Overview', items: [{ slug: 'intro' }, { slug: 'big-picture' }, { slug: 'evaluation-areas' }] },
    { title: 'Preparation', items: [{ slug: 'prep' }, { slug: 'stories' }] },
    { title: 'Solving Common Questions', items: [{ slug: 'common-questions' }] },
    { title: 'Front-End Specifics', items: [{ slug: 'fe-advanced' }] },
    { title: 'Practical', items: [{ slug: 'practical-tips' }, { slug: 'checklist' }] },
];
