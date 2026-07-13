export type GooglePracticePrompt = {
  readonly id: string;
  readonly title: string;
  readonly statement: string;
  readonly whatThisMeasures: string;
  readonly clarifyFirst: readonly string[];
  readonly strongAnswer: readonly string[];
  readonly commonMiss: string;
  readonly resourceLabel: string;
  readonly resourcePath: string;
};

export type GooglePrepDay = {
  readonly day: string;
  readonly focus: string;
  readonly artifact: string;
};

export type GooglePreviewFaq = {
  readonly question: string;
  readonly answer: string;
};

export type GoogleResourceLink = {
  readonly label: string;
  readonly description: string;
  readonly path: string;
};

export const GOOGLE_PREVIEW_TITLE =
  'Google Frontend Interview Questions: 7 Prompts + Prep Guide';
export const GOOGLE_PREVIEW_H1 = 'Google Frontend Interview Questions';
export const GOOGLE_PREVIEW_DESCRIPTION =
  'Prepare for a Google frontend interview with 7 representative questions covering DSA, JavaScript, browser APIs, UI coding, accessibility, and system design.';
export const GOOGLE_PREVIEW_CANONICAL_PATH = '/companies/google/preview';
export const GOOGLE_PREVIEW_DATE_MODIFIED = '2026-07-13T00:00:00.000Z';
export const GOOGLE_PREVIEW_TRUST_NOTE =
  'These are representative FrontendAtlas practice prompts, not leaked or confirmed Google interview questions. Interview formats vary by role, level, team, location, and time.';

export const GOOGLE_PROCESS_NOTE = {
  title: 'Current process note — reviewed July 2026',
  reportUrl:
    'https://www.businessinsider.com/google-job-interview-software-engineers-ai-assistant-coding-2026-5',
  guidanceUrl: 'https://www.google.com/about/careers/applications/interview-tips/',
} as const;

export const GOOGLE_PRACTICE_PROMPTS: readonly GooglePracticePrompt[] = [
  {
    id: 'nested-navigation-tree',
    title: 'Traverse and transform a nested navigation tree',
    statement:
      'Given nested navigation data, find or transform matching nodes while preserving the required order and returning a predictable result for missing paths.',
    whatThisMeasures:
      'Tree traversal, complexity analysis, JavaScript data modeling, and care around mutation and unusually deep input.',
    clarifyFirst: [
      'Ask whether the tree can be empty, malformed, extremely deep, or cyclic, and whether order must be preserved.',
      'Confirm whether the transformation should mutate the input or return new objects along changed paths.',
    ],
    strongAnswer: [
      'Choose depth-first or breadth-first traversal deliberately and explain the trade-off.',
      'State O(n) time and account for recursion depth or an explicit stack.',
      'Preserve stable ordering and define the missing-node result.',
      'Test empty, single-node, deeply nested, duplicate-id, and malformed inputs.',
    ],
    commonMiss:
      'Assuming a fixed nesting depth or mutating shared input without making that contract explicit.',
    resourceLabel: 'Practice safe nested-path traversal in JavaScript',
    resourcePath: '/javascript/coding/js-get-by-path-1',
  },
  {
    id: 'debounce-cancel-flush',
    title: 'Implement debounce with cancel and flush',
    statement:
      'Implement a debounce utility that preserves arguments and context, and add cancel and flush behavior with a clear return-value contract.',
    whatThisMeasures:
      'Closures, timers, function context, API design, cleanup, and deterministic testing of asynchronous utilities.',
    clarifyFirst: [
      'Confirm leading versus trailing invocation, the return value, and what flush returns when nothing is pending.',
      'Ask how cancel affects retained arguments, context, and any previously returned result.',
    ],
    strongAnswer: [
      'Keep one timer and replace it on each qualifying call.',
      'Preserve the latest arguments and this context without retaining them after completion.',
      'Make cancel and flush idempotent and define leading/trailing interaction.',
      'Use fake timers to test rapid calls, cancellation, flushing, and cleanup.',
    ],
    commonMiss:
      'Creating a double invocation around flush or leaving timers and captured values alive after cancel.',
    resourceLabel: 'Practice implementing debounce',
    resourcePath: '/javascript/coding/js-debounce',
  },
  {
    id: 'accessible-autocomplete',
    title: 'Build an accessible autocomplete',
    statement:
      'Build a typeahead that requests suggestions, exposes clear loading and empty states, and remains fully operable by keyboard and assistive technology.',
    whatThisMeasures:
      'Accessible UI implementation, browser events, async state, focus management, and clear component boundaries.',
    clarifyFirst: [
      'Confirm the data source, minimum query length, result limit, selection behavior, and expected browser support.',
      'Ask whether focus stays in the input and how free-form values, no results, and request failures should behave.',
    ],
    strongAnswer: [
      'Use the combobox/listbox pattern with correct expanded, controls, and active-descendant relationships.',
      'Support Arrow keys, Enter, Escape, pointer input, and visible focus without trapping the user.',
      'Model loading, empty, error, cancelled, and stale outcomes explicitly.',
      'Debounce requests and protect the UI from out-of-order responses.',
      'Test keyboard flow and accessible names as well as successful selection.',
    ],
    commonMiss:
      'Building a mouse-only suggestion list or announcing every network update through an overly noisy live region.',
    resourceLabel: 'Try an optional React autocomplete implementation drill',
    resourcePath: '/react/coding/react-autocomplete-search-starter',
  },
  {
    id: 'take-latest-async-results',
    title: 'Keep only the latest async result',
    statement:
      'Coordinate overlapping requests so only the newest result can update the view, even when older work resolves or rejects later.',
    whatThisMeasures:
      'Race-condition reasoning, cancellation, ownership of UI state, and tests that control promise ordering.',
    clarifyFirst: [
      'Ask whether the underlying work can be aborted or only ignored after it settles.',
      'Define which request owns loading, error, and cleanup state when calls overlap.',
    ],
    strongAnswer: [
      'Cancel active work with AbortController where the API supports it.',
      'Pair cancellation with a monotonically increasing request token or takeLatest guard.',
      'Guard success, error, and finally writes so stale work cannot clear current state.',
      'Keep cancellation, stale results, and genuine failures distinguishable.',
      'Force out-of-order resolution and rejection in tests.',
    ],
    commonMiss:
      'Guarding the success path while a late catch or finally block still overwrites the newest request state.',
    resourceLabel: 'Practice takeLatest request handling',
    resourcePath: '/javascript/coding/js-take-latest',
  },
  {
    id: 'dom-event-delegation',
    title: 'Handle delegated events in a dynamic list',
    statement:
      'Handle interactions for a changing list through a stable ancestor, while identifying the intended item safely and updating only what changed.',
    whatThisMeasures:
      'DOM event propagation, delegation, target boundaries, dynamic content, efficient updates, and listener cleanup.',
    clarifyFirst: [
      'Confirm which child interactions count, whether controls can be nested, and where the delegation boundary ends.',
      'Ask how items are inserted or removed and whether keyboard activation must share the same action path.',
    ],
    strongAnswer: [
      'Explain capture and bubble phases plus the difference between target and currentTarget.',
      'Use closest with a containment check so nested elements and outside matches are safe.',
      'Key updates by stable item identity and avoid rebuilding the whole list.',
      'Cover keyboard behavior, removed nodes, and listener cleanup.',
    ],
    commonMiss:
      'Reading target.dataset directly, which breaks when the click lands on a nested icon or label.',
    resourceLabel: 'Review DOM event delegation',
    resourcePath: '/javascript/trivia/js-event-delegation',
  },
  {
    id: 'frontend-performance-network-security',
    title: 'Reason about frontend performance, networking, and security',
    statement:
      'Diagnose a slow data-heavy page and propose measured improvements across delivery, rendering, request behavior, and client-side security.',
    whatThisMeasures:
      'Evidence-led performance work, network trade-offs, rendering strategy, safe data handling, and prioritization under constraints.',
    clarifyFirst: [
      'Ask for target devices, network conditions, user journeys, performance goals, and the trusted-data boundary.',
      'Separate initial load, interaction latency, rendering cost, and backend response time before proposing fixes.',
    ],
    strongAnswer: [
      'Start with field or lab measurements and identify the dominant bottleneck.',
      'Discuss caching, compression, code splitting, request deduplication, and pagination where evidence supports them.',
      'Use batching or virtualization when rendering volume is the constraint.',
      'Include safe DOM APIs, output handling, and an appropriate Content Security Policy in the threat model.',
      'Set a budget or metric and explain how the change will be verified.',
    ],
    commonMiss:
      'Listing optimizations without measurement, or improving speed while ignoring unsafe rendering and data exposure.',
    resourceLabel: 'Review web load-time optimization trade-offs',
    resourcePath: '/javascript/trivia/web-performance-optimize-load-time',
  },
  {
    id: 'search-suggestions-large-list-design',
    title: 'Design search suggestions for a large interactive list',
    statement:
      'Design the frontend for ranked search suggestions and a large result list that stays responsive, accessible, and correct as data changes.',
    whatThisMeasures:
      'Frontend system design, API and state boundaries, caching, rendering scale, accessibility, resilience, and observability.',
    clarifyFirst: [
      'Confirm data size, server versus client search, ranking and freshness needs, target latency, and offline expectations.',
      'Ask which devices, assistive technologies, and failure modes the design must support.',
    ],
    strongAnswer: [
      'Define component, state, and API boundaries, including cursor or pagination contracts.',
      'Combine debounce, cancellation, takeLatest guards, caching, and explicit error states.',
      'Use windowing or incremental rendering without breaking focus or result semantics.',
      'Plan keyboard interaction, announcements, observability, and recovery from partial failures.',
      'Explain how trade-offs change for junior, mid-level, and senior design scope.',
    ],
    commonMiss:
      'Drawing component boxes without defining state ownership, stale-data behavior, accessibility, or failure recovery.',
    resourceLabel: 'Practice designing an infinite-scrolling list',
    resourcePath: '/system-design/infinite-scroll-list',
  },
];

export const GOOGLE_PREP_SEQUENCE: readonly GooglePrepDay[] = [
  {
    day: 'Day 1',
    focus: 'Solve two tree or array problems in JavaScript and explain time and space complexity before coding.',
    artifact: 'Two reviewed solutions with edge-case tests and written complexity notes.',
  },
  {
    day: 'Day 2',
    focus: 'Implement debounce, throttle, cancellation, and takeLatest behavior with explicit contracts.',
    artifact: 'Small utilities plus fake-timer and out-of-order promise tests.',
  },
  {
    day: 'Day 3',
    focus: 'Review DOM APIs, propagation, browser fundamentals, networking boundaries, and common web-security risks.',
    artifact: 'A delegated dynamic-list exercise with tests and a one-page browser/security note.',
  },
  {
    day: 'Day 4',
    focus: 'Build the accessible shell of a typeahead, including focus, keyboard, loading, empty, and error behavior.',
    artifact: 'A working UI slice with keyboard and accessibility assertions.',
  },
  {
    day: 'Day 5',
    focus: 'Trace frontend latency from request to paint, then evaluate rendering, caching, payload, and loading trade-offs.',
    artifact: 'A measured performance audit with a prioritized budget and verification notes.',
  },
  {
    day: 'Day 6',
    focus: 'Design search suggestions and a large interactive list at the depth appropriate for your target level.',
    artifact: 'A diagram covering API contracts, state ownership, caching, accessibility, failures, and observability.',
  },
  {
    day: 'Day 7',
    focus: 'Run a timed mock, revisit missed edge cases, and practice explaining decisions before implementation details.',
    artifact: 'A mock-interview scorecard, recording or notes, and a final edge-case checklist.',
  },
];

export const GOOGLE_PREVIEW_FAQS: readonly GooglePreviewFaq[] = [
  {
    question: 'Is Google frontend preparation React-only?',
    answer:
      'No. Prepare framework-neutral JavaScript, browser, accessibility, problem-solving, and design skills. A particular role may still name a framework, so use the job description and recruiter material for that loop.',
  },
  {
    question: 'Should frontend candidates prepare DSA?',
    answer:
      'Yes. Data structures, algorithms, clean problem solving, and complexity analysis remain useful preparation, although their weight can vary by role and interview plan.',
  },
  {
    question: 'Is system design included in every frontend loop?',
    answer:
      'Do not assume it is. Expectations often depend on seniority, role, team, and the current process. Ask the recruiter what design depth is expected.',
  },
  {
    question: 'Can candidates use JavaScript?',
    answer:
      'Language rules can vary, so confirm them with the recruiter. For frontend preparation, practice writing and explaining idiomatic JavaScript without relying on framework shortcuts.',
  },
  {
    question: 'Does the reported 2026 AI-assisted pilot apply to every frontend candidate?',
    answer:
      'No such conclusion is supported. The May 2026 report describes a pilot for junior and mid-level roles on selected US software-engineering teams, not a standard format for every frontend candidate.',
  },
];

export const GOOGLE_RESOURCE_LINKS: readonly GoogleResourceLink[] = [
  {
    label: 'Traverse nested paths in JavaScript',
    description: 'Practice safe lookup and edge-case handling in nested data.',
    path: '/javascript/coding/js-get-by-path-1',
  },
  {
    label: 'Implement a debounce utility',
    description: 'Exercise timer ownership, argument handling, and predictable invocation.',
    path: '/javascript/coding/js-debounce',
  },
  {
    label: 'Build autocomplete in React (optional framework drill)',
    description: 'Apply the accessible typeahead requirements in one framework-specific exercise.',
    path: '/react/coding/react-autocomplete-search-starter',
  },
  {
    label: 'Keep only the latest async result',
    description: 'Practice cancellation and stale-response guards directly.',
    path: '/javascript/coding/js-take-latest',
  },
  {
    label: 'Review event delegation',
    description: 'Rehearse propagation, target boundaries, and dynamic DOM behavior.',
    path: '/javascript/trivia/js-event-delegation',
  },
  {
    label: 'Optimize frontend load time',
    description: 'Connect measurement to networking, delivery, and rendering trade-offs.',
    path: '/javascript/trivia/web-performance-optimize-load-time',
  },
  {
    label: 'Design an infinite-scrolling list',
    description: 'Explore large-list state, pagination, rendering, and recovery choices.',
    path: '/system-design/infinite-scroll-list',
  },
  {
    label: 'Compare JavaScript objects safely',
    description: 'Review shallow and deep equality assumptions for nested state.',
    path: '/javascript/trivia/js-compare-two-objects',
  },
];
