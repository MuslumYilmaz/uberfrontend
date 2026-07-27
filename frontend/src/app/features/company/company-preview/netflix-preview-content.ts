export type NetflixPracticePrompt = {
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

export type NetflixRoleLens = {
  readonly title: string;
  readonly description: string;
  readonly practiceFocus: string;
};

export type NetflixWalkthroughStep = {
  readonly title: string;
  readonly description: string;
};

export type NetflixPrepDay = {
  readonly day: string;
  readonly focus: string;
  readonly artifact: string;
};

export type NetflixPreviewFaq = {
  readonly question: string;
  readonly answer: string;
};

export type NetflixResourceLink = {
  readonly label: string;
  readonly description: string;
  readonly path: string;
};

export type NetflixOfficialSource = {
  readonly label: string;
  readonly url: string;
  readonly note: string;
};

export const NETFLIX_PREVIEW_TITLE =
  'Netflix Frontend Interview Questions: 6 Prompts + Prep Guide';
export const NETFLIX_PREVIEW_H1 = 'Netflix Frontend Interview Questions';
export const NETFLIX_PREVIEW_DESCRIPTION =
  'Prepare for a Netflix frontend interview with 6 representative prompts on JavaScript, React, streaming UI, performance, accessibility, and system design.';
export const NETFLIX_PREVIEW_CANONICAL_PATH = '/companies/netflix/preview';
export const NETFLIX_PREVIEW_DATE_MODIFIED = '2026-07-27T00:00:00.000Z';
export const NETFLIX_PREVIEW_TRUST_NOTE =
  'These are representative FrontendAtlas practice prompts, not leaked or confirmed Netflix interview questions. Interview formats vary by role and team, so use recruiter-provided material as the source of truth.';

export const NETFLIX_ROLE_LENSES: readonly NetflixRoleLens[] = [
  {
    title: 'Member and discovery UI',
    description:
      'Practice search, browsing rows, playback-adjacent state, keyboard or remote input, and recovery on constrained devices.',
    practiceFocus:
      'Request ownership, focus stability, image delivery, responsive rendering, accessibility, and visible failure states.',
  },
  {
    title: 'Ads and commerce UI',
    description:
      'Rehearse interactive flows where latency, measurement, privacy, and partial failures can change product behavior.',
    practiceFocus:
      'State boundaries, safe data handling, observability, progressive delivery, and explicit trade-offs.',
  },
  {
    title: 'Studio and internal tools',
    description:
      'Prepare for data-dense dashboards and operational workflows that must remain understandable as data changes.',
    practiceFocus:
      'Large-list rendering, filtering, resilient updates, accessible controls, and maintainable component contracts.',
  },
];

export const NETFLIX_PRACTICE_PROMPTS: readonly NetflixPracticePrompt[] = [
  {
    id: 'resilient-title-search',
    title: 'Implement resilient title search',
    statement:
      'Build a title-search experience that feels immediate while requests overlap, results arrive out of order, and the network becomes slow or unavailable.',
    whatThisMeasures:
      'JavaScript timing, async ownership, cancellation, accessible interaction, and whether UI state remains truthful under failure.',
    clarifyFirst: [
      'Confirm the minimum query length, debounce interval, result limit, selection behavior, and whether earlier requests can be aborted.',
      'Define keyboard behavior plus loading, empty, error, offline, cancelled, and stale-result states before choosing components.',
    ],
    strongAnswer: [
      'Separate input state, active query, request identity, results, and visible status.',
      'Use debounce to limit starts and AbortController where transport cancellation is supported.',
      'Add a monotonically increasing token or takeLatest guard to every success, error, and cleanup write.',
      'Preserve keyboard focus and expose useful combobox or listbox semantics.',
      'Test out-of-order fulfillment, late rejection, rapid deletion, cancellation, empty results, and retry.',
    ],
    commonMiss:
      'Treating debounce as a race-condition solution while an older response or finally block can still overwrite the current query.',
    resourceLabel: 'Practice takeLatest request handling',
    resourcePath: '/javascript/coding/js-take-latest',
  },
  {
    id: 'accessible-continue-watching-row',
    title: 'Build an accessible Continue Watching row',
    statement:
      'Build a horizontally browsable Continue Watching exercise that preserves a user’s place while cards load, progress changes, and input switches between pointer, keyboard, and remote-like controls.',
    whatThisMeasures:
      'Semantic structure, focus management, stable rendering, image behavior, progressive enhancement, and product judgment across devices.',
    clarifyFirst: [
      'Ask which devices and input methods matter, how many titles can appear, and whether the row is server-ranked or locally updated.',
      'Define card semantics, focus movement, progress labeling, image fallbacks, and what happens when a title disappears.',
    ],
    strongAnswer: [
      'Use stable title identities and preserve logical focus when cards update.',
      'Keep DOM order, visual order, and assistive-technology reading order aligned.',
      'Reserve image dimensions, lazy-load outside the near viewport, and provide useful fallback content.',
      'Bound rendering work without hiding items from keyboard and assistive-technology users.',
      'Cover loading, empty, offline, stale-progress, missing-image, and partial-update states.',
    ],
    commonMiss:
      'Optimizing the carousel visually while losing focus, changing card order unexpectedly, or making controls pointer-only.',
    resourceLabel: 'Explore large-list rendering and recovery',
    resourcePath: '/system-design/infinite-scroll-list',
  },
  {
    id: 'personalized-row-rendering',
    title: 'Stop personalized rows from re-rendering unnecessarily',
    statement:
      'A browse screen becomes sluggish when playback progress and recommendation data update. Diagnose the work before changing memoization or state architecture.',
    whatThisMeasures:
      'Profiling discipline, React render reasoning, state boundaries, referential stability, and evidence-led performance work.',
    clarifyFirst: [
      'Ask which interaction is slow, which devices are affected, how updates enter the client, and what measurements already exist.',
      'Separate component render time, browser layout or paint, image work, scripting, and network latency.',
    ],
    strongAnswer: [
      'Capture a reproducible trace and identify the components and updates that dominate the interaction.',
      'Keep frequently changing playback state close to the consumers that need it.',
      'Stabilize props and selectors where evidence shows avoidable work.',
      'Apply memoization selectively and include its comparison and memory costs.',
      'Set a measurable budget and verify both interaction speed and UI correctness after the change.',
    ],
    commonMiss:
      'Adding memo everywhere before profiling, which can preserve poor state boundaries and add comparison overhead.',
    resourceLabel: 'Review unnecessary React re-renders',
    resourcePath: '/react/trivia/react-prevent-unnecessary-rerenders',
  },
  {
    id: 'streaming-caching-failure-states',
    title: 'Reason about streaming delivery, caching, and failure states',
    statement:
      'Explain how a streaming product could deliver app code, artwork, metadata, and personalized responses while balancing speed, freshness, privacy, and graceful recovery.',
    whatThisMeasures:
      'Layered caching knowledge, invalidation judgment, personalization boundaries, client resilience, and the ability to connect architecture to user experience.',
    clarifyFirst: [
      'Separate static public assets, versioned app bundles, catalog metadata, personalized data, and playback-adjacent state.',
      'Ask about freshness targets, regional constraints, device storage, authentication, offline behavior, and acceptable stale content.',
    ],
    strongAnswer: [
      'Assign browser, service worker, CDN or edge, and origin caches only where their trust and freshness boundaries fit.',
      'Use content hashing or versioning for immutable assets and explicit revalidation for mutable data.',
      'Keep private personalized responses out of shared caches and define safe client persistence.',
      'Explain invalidation, stale-while-revalidate behavior, and fallback UI for partial failures.',
      'Measure cache hit rate, latency, staleness, error rate, and user-visible recovery.',
    ],
    commonMiss:
      'Saying “cache everything at the CDN” without separating public assets from private or fast-changing personalized data.',
    resourceLabel: 'Review streaming delivery and caching strategies',
    resourcePath: '/javascript/trivia/content-delivery-caching-strategies-streaming',
  },
  {
    id: 'continue-watching-system-design',
    title: 'Design Continue Watching for regional and device scale',
    statement:
      'Design a representative frontend architecture for a Continue Watching row that reconciles progress across devices and remains usable on variable networks and hardware.',
    whatThisMeasures:
      'Frontend system design, requirements framing, state ownership, rendering scale, accessibility, resilience, observability, and rollout safety.',
    clarifyFirst: [
      'Confirm supported devices and inputs, progress freshness, row size, ordering rules, offline expectations, and what consistency users need.',
      'Identify which behavior belongs to the client, API contract, edge delivery, or source-of-truth service before drawing component boxes.',
    ],
    strongAnswer: [
      'Define a device-aware payload with stable title ids, progress, artwork variants, ordering data, and a version or update time.',
      'Separate server state, local interaction state, focus state, image state, and optimistic progress.',
      'Use a bounded render window and prefetch policy appropriate to device capability and input direction.',
      'Reconcile newer progress without resetting focus or horizontal position.',
      'Include accessible navigation, offline and partial-failure behavior, client metrics, experiments, and rollback.',
    ],
    commonMiss:
      'Starting with a diagram while requirements, state ownership, focus behavior, failure recovery, and success metrics remain undefined.',
    resourceLabel: 'Use the performance system-design blueprint',
    resourcePath: '/guides/system-design-blueprint/performance',
  },
  {
    id: 'consequential-frontend-decision',
    title: 'Defend a consequential frontend decision',
    statement:
      'Describe a frontend decision with meaningful product or engineering consequences, including the ambiguity you faced, alternatives you rejected, feedback you received, and what the outcome changed.',
    whatThisMeasures:
      'Judgment, communication, self-awareness, evidence, collaboration, and the ability to revise a position without hiding trade-offs.',
    clarifyFirst: [
      'Choose a story where you owned a real decision and can explain the user, technical, and organizational constraints.',
      'Define the decision point, available evidence, stakeholders, alternatives, and the metric or observation used to judge the result.',
    ],
    strongAnswer: [
      'Set context and stakes briefly, then state your personal responsibility.',
      'Compare credible alternatives and explain why the chosen trade-off fit the constraints.',
      'Describe disagreement or feedback accurately and show how it affected the decision.',
      'Report a measurable or observable outcome without overstating causality.',
      'End with what you would repeat, change, or investigate next.',
    ],
    commonMiss:
      'Telling a polished success story with no real alternative, disagreement, evidence, or reflection on what could improve.',
    resourceLabel: 'Structure a behavioral interview story',
    resourcePath: '/guides/behavioral/stories',
  },
];

export const NETFLIX_WALKTHROUGH_STEPS: readonly NetflixWalkthroughStep[] = [
  {
    title: 'Start with the user contract',
    description:
      'Define supported devices and inputs, progress freshness, ordering, row size, offline behavior, and what should happen when a title is no longer available.',
  },
  {
    title: 'Separate state by ownership',
    description:
      'Keep server-ranked titles and progress distinct from local focus, horizontal position, image status, and optimistic playback updates.',
  },
  {
    title: 'Protect visual and focus stability',
    description:
      'Use stable ids, reserve artwork space, reconcile data without resetting position, and specify keyboard or remote movement before animation.',
  },
  {
    title: 'Bound delivery and rendering',
    description:
      'Request device-appropriate artwork, prefetch only a small directional window, cancel stale work, and render enough items for smooth accessible navigation.',
  },
  {
    title: 'Design failure states explicitly',
    description:
      'Cover loading, empty, offline, stale progress, failed artwork, partial API data, retry, and a title disappearing during reconciliation.',
  },
  {
    title: 'Measure and roll out safely',
    description:
      'Treat performance numbers as exercise assumptions, then define focus loss, interaction latency, image failures, stale progress, experiment exposure, and rollback signals.',
  },
];

export const NETFLIX_PREP_SEQUENCE: readonly NetflixPrepDay[] = [
  {
    day: 'Day 1',
    focus:
      'Read the target job description and recruiter material, then map each stated responsibility to JavaScript, UI, accessibility, performance, design, or behavioral preparation.',
    artifact: 'A role-specific scope sheet with confirmed topics and open recruiter questions.',
  },
  {
    day: 'Day 2',
    focus:
      'Implement debounce and takeLatest contracts, then force overlapping requests to settle in the wrong order.',
    artifact: 'A tested search controller covering cancellation, stale success, late rejection, and cleanup.',
  },
  {
    day: 'Day 3',
    focus:
      'Build the accessible shell of a Continue Watching row for keyboard, pointer, and remote-like directional input.',
    artifact: 'A working row with stable focus, semantic cards, image fallbacks, and interaction tests.',
  },
  {
    day: 'Day 4',
    focus:
      'Profile a React browse screen, change one state boundary, and compare the trace instead of guessing at optimizations.',
    artifact: 'Before-and-after profiler evidence plus a short explanation of the chosen budget.',
  },
  {
    day: 'Day 5',
    focus:
      'Model delivery for bundles, artwork, catalog metadata, and personalized data across browser, service worker, edge, and origin layers.',
    artifact: 'A cache matrix documenting privacy, freshness, invalidation, and failure behavior.',
  },
  {
    day: 'Day 6',
    focus:
      'Design Continue Watching from requirements through state ownership, rendering, accessibility, failures, observability, and rollout.',
    artifact: 'A diagram and decision log that can be presented in 30 minutes.',
  },
  {
    day: 'Day 7',
    focus:
      'Run a timed mock combining one coding prompt, one system-design prompt, and one consequential-decision story.',
    artifact: 'A scored recording or review sheet with three concrete improvements for the next mock.',
  },
];

export const NETFLIX_PREVIEW_FAQS: readonly NetflixPreviewFaq[] = [
  {
    question: 'Are these real Netflix interview questions?',
    answer:
      'No. They are representative FrontendAtlas practice prompts built around transferable frontend skills and public product or engineering context. They are not leaked, confirmed, or presented as official Netflix questions.',
  },
  {
    question: 'Is React preparation enough?',
    answer:
      'No. React can be a useful implementation lens, but prepare framework-neutral JavaScript, browser behavior, accessibility, async correctness, performance, frontend system design, and communication. Let the job description define any framework-specific emphasis.',
  },
  {
    question: 'Should I memorize Netflix product trivia?',
    answer:
      'Use public product context to create realistic constraints, not trivia answers. Practice clarifying users, devices, state, failures, trade-offs, and measurements—the reasoning transfers even when the exact interview exercise changes.',
  },
  {
    question: 'What should I confirm with the recruiter?',
    answer:
      'Ask about exercise types, allowed language or framework, coding environment, accessibility expectations, system-design depth, interview timing, and any preparation material supplied for your role and team.',
  },
  {
    question: 'Which exercise should I start with?',
    answer:
      'Start with resilient title search because it exposes concrete JavaScript, race-condition, UI-state, and testing decisions. Then use the Continue Watching walkthrough to practice broader product and architecture judgment.',
  },
];

export const NETFLIX_RESOURCE_LINKS: readonly NetflixResourceLink[] = [
  {
    label: 'Implement debounce',
    description: 'Practice timer ownership, latest arguments, cancellation, and predictable invocation.',
    path: '/javascript/coding/js-debounce',
  },
  {
    label: 'Keep only the latest async result',
    description: 'Protect visible state from out-of-order success, failure, and cleanup.',
    path: '/javascript/coding/js-take-latest',
  },
  {
    label: 'Prevent unnecessary React re-renders',
    description: 'Connect profiling evidence to state boundaries and selective memoization.',
    path: '/react/trivia/react-prevent-unnecessary-rerenders',
  },
  {
    label: 'Review streaming delivery and caching',
    description: 'Compare client, CDN, edge, and origin responsibilities.',
    path: '/javascript/trivia/content-delivery-caching-strategies-streaming',
  },
  {
    label: 'Design an infinite-scrolling list',
    description: 'Explore large-list data flow, rendering, accessibility, and recovery.',
    path: '/system-design/infinite-scroll-list',
  },
  {
    label: 'Design draggable dashboard widgets',
    description: 'Practice data-dense UI state, layout constraints, persistence, and accessibility.',
    path: '/system-design/dashboard-widgets-draggable-resizable',
  },
  {
    label: 'Use the performance design blueprint',
    description: 'Structure requirements, budgets, rendering, resilience, and observability.',
    path: '/guides/system-design-blueprint/performance',
  },
  {
    label: 'Prepare behavioral stories',
    description: 'Turn consequential decisions into concise, evidence-backed interview answers.',
    path: '/guides/behavioral/stories',
  },
];

export const NETFLIX_OFFICIAL_SOURCES: readonly NetflixOfficialSource[] = [
  {
    label: 'Netflix Engineering',
    url: 'https://jobs.netflix.com/careers/engineering',
    note:
      'Use the published engineering domains to understand possible product contexts, not to infer a fixed interview loop.',
  },
  {
    label: 'Netflix Culture',
    url: 'https://jobs.netflix.com/culture',
    note:
      'Use the current culture material to prepare evidence-backed decision stories without trying to guess preferred answers.',
  },
  {
    label: 'Netflix New Grad interview guidance',
    url: 'https://jobs.netflix.com/careers/new-grads',
    note:
      'This guidance is new-grad specific and must not be generalized to every experienced frontend role.',
  },
  {
    label: 'React TV UI engineering case study',
    url: 'https://netflixtechblog.com/crafting-a-high-performance-tv-user-interface-using-react-3350e5a6ad3b',
    note:
      'An older engineering case study for constrained-device performance practice, not evidence of the current interview process or every current frontend stack.',
  },
  {
    label: 'Lumen dashboard engineering case study',
    url: 'https://netflixtechblog.com/lumen-custom-self-service-dashboarding-for-netflix-8c56b541548c',
    note:
      'An older dashboard case study that supplies product constraints for practice, not a current interview-format claim.',
  },
];
