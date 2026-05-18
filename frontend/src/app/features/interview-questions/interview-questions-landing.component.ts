import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import type { InterviewQuestionsHubResolved } from '../../core/resolvers/interview-questions.resolver';
import { AnalyticsService } from '../../core/services/analytics.service';
import { QuestionListItem, QuestionService } from '../../core/services/question.service';
import { SeoService, type SeoMeta } from '../../core/services/seo.service';
import { Tech } from '../../core/models/user.model';
import { PrepRoadmapComponent, type PrepRoadmapItem } from '../../shared/components/prep-roadmap/prep-roadmap.component';

type InterviewQuestionsLandingConfig = {
  keyword: string;
  title: string;
  techs: Tech[];
  isMasterHub: boolean;
  featuredLinks: HubLink[];
};

type Kind = 'coding' | 'trivia';
type PrepPriority = 'must_know' | 'high_leverage' | 'core_reinforcement';
type HubLink = { label: string; route: any[]; path: string };

type QuestionSummaryRow = {
  id: string;
  title: string;
  tech: Tech;
  kind: Kind;
  difficulty: string;
  importance: number;
  priority: PrepPriority;
  description: string;
  link: any[];
};

type RawQuestionSummaryRow = QuestionListItem & { tech: Tech };
type SchemaQuestionLink = { title: string; path: string };
type PrepPlanLink = { label: string; route: any[]; summary: string };
type HubConceptLink = { label: string; route: any[]; ariaLabel: string };
type ReactCoverageLink = { label: string; route: any[] };
type ReactTopicCard = { title: string; answer: string; link: ReactCoverageLink };
type ReactSupportItem = { title: string; detail: string };
type AngularCoverageLink = { label: string; route: any[] };
type AngularTopicCard = { title: string; answer: string; link: AngularCoverageLink };
type AngularMistakeItem = { title: string; detail: string };
type HtmlCoverageLink = { label: string; route: any[] };
type HtmlTopicCard = { title: string; answer: string; link: HtmlCoverageLink };
type HtmlMistakeItem = { title: string; detail: string };
type HtmlBehavioralItem = { title: string; detail: string };
type HtmlResourceLink = { label: string; href: string; summary: string };
type HubIntentProfile = {
  heading: string;
  lead: string;
  tests: string[];
  usage: string[];
  credibility: string;
  relatedPrep: PrepPlanLink;
};
type HubFaqItem = { q: string; a: string };
const DEFAULT_CONFIG: InterviewQuestionsLandingConfig = {
  keyword: 'javascript interview questions',
  title: 'JavaScript Interview Questions',
  techs: ['javascript'],
  isMasterHub: false,
  featuredLinks: [],
};

const INTERVIEW_HUB_LINKS: HubLink[] = [
  {
    label: 'Frontend interview questions',
    route: ['/interview-questions'],
    path: '/interview-questions',
  },
  {
    label: 'JavaScript interview questions',
    route: ['/javascript/interview-questions'],
    path: '/javascript/interview-questions',
  },
  {
    label: 'React interview questions',
    route: ['/react/interview-questions'],
    path: '/react/interview-questions',
  },
  {
    label: 'Angular interview questions',
    route: ['/angular/interview-questions'],
    path: '/angular/interview-questions',
  },
  {
    label: 'Vue.js interview questions',
    route: ['/vue/interview-questions'],
    path: '/vue/interview-questions',
  },
  {
    label: 'HTML interview questions',
    route: ['/html/interview-questions'],
    path: '/html/interview-questions',
  },
  {
    label: 'CSS interview questions',
    route: ['/css/interview-questions'],
    path: '/css/interview-questions',
  },
  {
    label: 'HTML and CSS interview questions',
    route: ['/html-css/interview-questions'],
    path: '/html-css/interview-questions',
  },
];

const PREP_PLAN_LINKS: PrepPlanLink[] = [
  {
    label: 'JavaScript mastery crash track',
    route: ['/tracks', 'javascript-prep-path', 'mastery'],
    summary: 'Deep JavaScript path with checkpoints, output prediction, and coding drills.',
  },
  {
    label: 'Crash Track (7 days)',
    route: ['/tracks', 'crash-7d', 'preview'],
    summary: 'High-yield 7-day sprint for short interview timelines.',
  },
  {
    label: 'Foundations Track (30 days)',
    route: ['/tracks', 'foundations-30d', 'preview'],
    summary: '30-day study plan for fundamentals, framework practice, and architecture coverage.',
  },
];

const HUB_INTENT_PROFILES: Record<string, HubIntentProfile> = {
  master: {
    heading: 'What frontend interview rounds test',
    lead: 'Use this hub to build a compact prep loop across implementation, concept recall, and system-design reasoning before you branch into deeper paths.',
    tests: [
      'Whether you can implement small UI and JavaScript prompts under time pressure.',
      'Whether your explanations connect browser, framework, and state-management behavior.',
      'Whether you can choose the next practice surface without turning prep into random browsing.',
    ],
    usage: [
      'Start with the preparation guide so you know which rounds you are optimizing for.',
      'Use Essential 60 as the first compact practice route after the format is clear.',
      'Move into a framework prep path after repeated misses show a clear weak area.',
    ],
    credibility: 'Questions are curated from FrontendAtlas metadata, editorial review checks, and shipped practice routes rather than scraped generic lists.',
    relatedPrep: {
      label: 'Frontend interview preparation guide',
      route: ['/guides', 'interview-blueprint', 'intro'],
      summary: 'A route-level guide for interview stages, scoring signals, and how to sequence practice.',
    },
  },
  javascript: {
    heading: 'What JavaScript interview rounds test',
    lead: 'JavaScript interviews usually test execution order, data transformation, async safety, and whether you can explain trade-offs while coding.',
    tests: [
      'Async behavior, closures, prototypes, arrays, maps, and utility implementation details.',
      'Debugging stale state, race conditions, equality, coercion, and edge cases.',
      'Clear narration: what you chose, what can break, and how you would test it.',
    ],
    usage: [
      'Start with one coding prompt, then answer one concept question out loud.',
      'Use the prep path when misses repeat around async, closures, or utility design.',
      'Return to this hub to pick the next small rep instead of browsing the full library.',
    ],
    credibility: 'This hub is assembled from high-priority FrontendAtlas JavaScript prompts and reviewed for interview-specific trade-off language.',
    relatedPrep: {
      label: 'JavaScript interview prep path',
      route: ['/guides', 'framework-prep', 'javascript-prep-path'],
      summary: 'A 7/14/30-day path for async, closures, state, and utility prompts.',
    },
  },
  react: {
    heading: 'What React interview rounds test',
    lead: 'React interviews test component state, effects, rendering behavior, async UI, and whether your explanation survives follow-up questions.',
    tests: [
      'State ownership, effects, stale closures, refs, context, and rendering boundaries.',
      'Practical UI prompts such as search, forms, transfer lists, tables, and nested components.',
      'Performance judgment: when memoization, batching, or component splitting actually matters.',
    ],
    usage: [
      'Run one implementation prompt before opening deeper concept questions.',
      'Use concept questions to tighten explanations after you pass the basic UI behavior.',
      'Follow the React interview preparation path when hooks or rerender reasoning keeps repeating as the miss.',
    ],
    credibility: 'React prompts are prioritized by FrontendAtlas importance signals and reviewed for concrete interview follow-ups.',
    relatedPrep: {
      label: 'React interview preparation path',
      route: ['/guides', 'framework-prep', 'react-prep-path'],
      summary: 'A focused path for state, effects, rerender reasoning, and performance trade-offs.',
    },
  },
  angular: {
    heading: 'What Angular interview rounds test',
    lead: 'Angular interviews test RxJS flow control, change detection, dependency boundaries, forms, testing judgment, and how clearly you explain framework behavior.',
    tests: [
      'RxJS operators, HttpClient cancellation, async cleanup, and request race prevention.',
      'Change detection, DI scope, standalone boundaries, template binding, and forms trade-offs.',
      'Whether you can distinguish production bugs from memorized framework definitions.',
    ],
    usage: [
      'Start with one Angular coding prompt, then answer one concept question out loud.',
      'Use the top concept questions to rehearse explanations before deeper framework drills.',
      'Open the prep path when RxJS, change detection, or architecture misses repeat.',
    ],
    credibility: 'Angular prompts are curated from shipped FrontendAtlas practice routes and reviewed for interview-specific production pitfalls.',
    relatedPrep: {
      label: 'Angular interview prep path',
      route: ['/guides', 'framework-prep', 'angular-prep-path'],
      summary: 'A focused path for RxJS, change detection, DI boundaries, forms, and tests.',
    },
  },
  vue: {
    heading: 'What Vue.js interview rounds test',
    lead: 'Vue.js interviews test reactivity, rendering, component contracts, router/state decisions, and the ability to explain subtle lifecycle behavior. Use this Vue JS interview questions hub to rehearse that reasoning with practical prompts.',
    tests: [
      'Reactivity, refs, computed values, watchers, nextTick, and render timing.',
      'Component communication, props/emits, v-model, provide/inject, and store boundaries.',
      'Practical debugging around key stability, state resets, and visibility toggles.',
    ],
    usage: [
      'Start with one Vue coding prompt, then rehearse one concept explanation.',
      'Use related concept questions to find weak reactivity or lifecycle assumptions.',
      'Follow the Vue prep path when the same rendering or state miss repeats.',
    ],
    credibility: 'Vue prompts are grouped by FrontendAtlas importance signals and reviewed for framework-specific interview traps.',
    relatedPrep: {
      label: 'Vue interview prep path',
      route: ['/guides', 'framework-prep', 'vue-prep-path'],
      summary: 'A focused path for reactivity, rendering, state, and component contracts.',
    },
  },
  htmlCss: {
    heading: 'What HTML and CSS interview rounds test',
    lead: 'HTML and CSS interview questions test whether you can connect semantic markup, accessible forms, layout systems, cascade behavior, and responsive constraints in one UI answer.',
    tests: [
      'Semantic HTML, forms, labels, landmarks, metadata, and browser defaults.',
      'CSS layout with flexbox and grid, plus cascade, specificity, custom properties, and responsive sizing.',
      'Whether you can debug overflow, alignment, stacking, and accessibility issues without guessing.',
    ],
    usage: [
      'Start with one HTML concept question and one CSS layout question in the same session.',
      'Use coding prompts when your explanation is clear but the implementation still breaks under constraints.',
      'Move into the UI interviews guide when accessibility, layout, or browser behavior keeps repeating as the weak area.',
    ],
    credibility: 'HTML and CSS prompts are reviewed for practical browser behavior, accessible UI decisions, and interview-ready debugging language.',
    relatedPrep: {
      label: 'Frontend UI interviews guide',
      route: ['/guides', 'interview-blueprint', 'ui-interviews'],
      summary: 'A practical guide for accessible UI prompts, semantic markup, and layout-focused rounds.',
    },
  },
  html: {
    heading: 'What HTML interview rounds test',
    lead: 'HTML interview questions test semantic structure, forms, accessibility, metadata, and how browser defaults affect real UI behavior.',
    tests: [
      'Forms, labels, landmarks, document metadata, responsive images, and accessibility basics.',
      'Whether you can explain defaults without turning the answer into documentation recitation.',
      'Practical trade-offs around semantics, validation, SEO, and progressive enhancement.',
    ],
    usage: [
      'Start with one short concept question and explain the browser behavior in plain language.',
      'Use HTML questions as a quick fundamentals check before UI coding prompts.',
      'Move into the frontend fundamentals guide when browser basics feel inconsistent.',
    ],
    credibility: 'HTML questions are reviewed for practical browser behavior and interview-ready explanation quality.',
    relatedPrep: {
      label: 'Frontend fundamentals quiz guide',
      route: ['/guides', 'interview-blueprint', 'quiz'],
      summary: 'A compact browser, CSS, JavaScript, and HTTP fundamentals check.',
    },
  },
  css: {
    heading: 'What CSS interview rounds test',
    lead: 'CSS interviews test layout reasoning, selectors, cascade behavior, responsive constraints, accessibility, and whether you can debug visual bugs methodically. Treat each CSS interview question as a short trade-off rehearsal, not a vocabulary check.',
    tests: [
      'Flexbox, grid, cascade, specificity, custom properties, forms, and responsive layouts.',
      'Whether you can choose layout tools based on constraints instead of memorized rules.',
      'Practical debugging around overflow, alignment, stacking, and performance.',
    ],
    usage: [
      'Start with one CSS concept question, then implement one small layout prompt.',
      'Use the fundamentals guide when cascade or layout vocabulary is shaky.',
      'Return to each CSS interview question after the layout fix and explain the failure mode out loud.',
    ],
    credibility: 'CSS questions are reviewed for practical UI debugging and interview-ready trade-off language.',
    relatedPrep: {
      label: 'Frontend UI interviews guide',
      route: ['/guides', 'interview-blueprint', 'ui-interviews'],
      summary: 'A practical guide for accessible UI prompts and layout-focused rounds.',
    },
  },
};

const HUB_FAQ_PROFILES: Record<string, HubFaqItem[]> = {
  master: [
    {
      q: 'Where should frontend interview preparation start?',
      a: 'Start with one compact baseline: a process guide, Essential 60, and then one focused coding or concept rep. Broad browsing comes after you know the weak area.',
    },
    {
      q: 'Are these official company interview questions?',
      a: 'No. They are practice prompts and answer drills built around common frontend interview signals: implementation, explanation, debugging, and trade-off reasoning.',
    },
    {
      q: 'When should I move from questions to study plans?',
      a: 'Move into a study plan when misses repeat across the same topic, such as async JavaScript, React effects, CSS layout, or system-design trade-offs.',
    },
  ],
  javascript: [
    {
      q: 'How should I practice JavaScript interview questions?',
      a: 'Pair one utility or async coding prompt with one concept explanation. The goal is to prove both execution and reasoning in the same short loop.',
    },
    {
      q: 'Which JavaScript topics matter most first?',
      a: 'Start with execution order, closures, arrays/maps, equality, async behavior, and edge cases before expanding into less common language details.',
    },
    {
      q: 'When is a JavaScript answer interview-ready?',
      a: 'It is interview-ready when you can state the constraint, code the core behavior, name edge cases, and explain what you would test next.',
    },
  ],
  react: [
    {
      q: 'How do React interview questions differ from React interview preparation?',
      a: 'The questions test individual skills. React interview preparation connects those skills into a repeatable path for hooks, state ownership, effects, rendering, and performance trade-offs.',
    },
    {
      q: 'What should I practice first for React interviews?',
      a: 'Start with state ownership and effects, then add async UI, forms, lists, and performance follow-ups once the render model feels stable.',
    },
    {
      q: 'When should I use the React interview preparation path?',
      a: 'Use it when random React questions are not enough and you need a 7/14/30-day sequence that ties concept answers to coding drills.',
    },
  ],
  angular: [
    {
      q: 'What makes Angular interview questions hard?',
      a: 'Angular rounds often mix RxJS flow control, change detection, dependency boundaries, forms, and testing judgment in one scenario.',
    },
    {
      q: 'What should I review before Angular coding prompts?',
      a: 'Review Observables, HttpClient cancellation, template binding, form state, and lifecycle cleanup so implementation choices have a clear reason.',
    },
    {
      q: 'When should I open the Angular prep path?',
      a: 'Open it when the same RxJS, change detection, DI, or testing miss repeats across multiple questions.',
    },
  ],
  vue: [
    {
      q: 'Are Vue.js and Vue JS interview questions the same target?',
      a: 'Yes. Candidates search both variants, so this hub uses Vue.js for the framework name while still making the Vue JS query intent clear.',
    },
    {
      q: 'What should I practice first for Vue.js interviews?',
      a: 'Start with reactivity, computed values, watchers, nextTick timing, props/emits, and key stability before moving into larger component prompts.',
    },
    {
      q: 'How do I know a Vue answer is strong enough?',
      a: 'A strong answer predicts the update path, names the state boundary, and explains the bug you would expect if the component contract is wrong.',
    },
  ],
  htmlCss: [
    {
      q: 'Should I study HTML and CSS interview questions together?',
      a: 'Yes for UI rounds. Markup semantics, accessibility, layout, and cascade behavior usually appear together when you have to build or debug a component.',
    },
    {
      q: 'What should I practice first?',
      a: 'Start with semantic structure, forms, labels, flexbox, grid, cascade, specificity, and responsive constraints before moving into polish.',
    },
    {
      q: 'When should I use coding prompts instead of concept questions?',
      a: 'Use coding prompts when you can explain the rule but still miss alignment, overflow, focus, responsive, or accessibility details in implementation.',
    },
  ],
  html: [
    {
      q: 'What do HTML interview questions usually test?',
      a: 'They test semantic structure, forms, labels, landmarks, metadata, browser defaults, accessibility, and progressive enhancement decisions.',
    },
    {
      q: 'How should I answer an HTML concept question?',
      a: 'Explain the user or browser behavior first, then name the element, attribute, accessibility effect, and validation or SEO trade-off.',
    },
    {
      q: 'When should HTML prep move into UI coding?',
      a: 'Move into UI coding once the semantic answer is clear and you need to prove the structure works in a real component.',
    },
    {
      q: 'What is the difference between HTML and HTML5?',
      a: 'HTML5 is the common shorthand for modern HTML: the simple doctype, semantic elements, native media, validation, and living-standard browser behavior used in current web development.',
    },
    {
      q: 'How do I test my HTML code for accessibility?',
      a: 'Start manually with keyboard navigation, labels, focus order, headings, table headers, and mobile reflow. Then run Lighthouse, axe, an accessibility-tree inspection, and an HTML checker.',
    },
    {
      q: 'What are the best resources for learning HTML?',
      a: 'Use MDN for practical reference, the WHATWG HTML Living Standard for source-of-truth behavior, WAI tutorials for accessibility, Chrome DevTools for inspection, and W3C tools for validation.',
    },
    {
      q: 'How do behavioral questions show up in HTML interviews?',
      a: 'They usually ask for judgment stories: improving accessibility, fixing metadata or SEO, choosing native semantics over custom code, and collaborating on form or content clarity.',
    },
  ],
  css: [
    {
      q: 'How should I practice each CSS interview question?',
      a: 'State the layout constraint, choose the CSS tool, explain why alternatives are weaker, then test overflow, responsiveness, and accessibility impact.',
    },
    {
      q: 'Which CSS interview questions are highest leverage?',
      a: 'Flexbox, grid, cascade, specificity, custom properties, stacking, responsive sizing, and overflow debugging usually pay off first.',
    },
    {
      q: 'When should I switch from concepts to coding?',
      a: 'Switch when you understand the rule but cannot yet produce a stable layout under width, content, and interaction constraints.',
    },
  ],
};

const PRIMARY_TECH_HUB_PATHS = new Set<string>([
  '/javascript/interview-questions',
  '/react/interview-questions',
  '/angular/interview-questions',
  '/vue/interview-questions',
  '/html/interview-questions',
  '/css/interview-questions',
]);

const REACT_TOPIC_CARDS: ReactTopicCard[] = [
  {
    title: 'Props, state, and one-way data flow',
    answer: 'Props are read-only inputs owned by a parent, while state belongs to the component that changes it. Strong answers connect callbacks, lifting state up, immutable updates, and when prop drilling should move into context or a store.',
    link: {
      label: 'Review props immutability',
      route: ['/react', 'trivia', 'react-why-props-immutable'],
    },
  },
  {
    title: 'Hooks and useEffect implementation',
    answer: 'Hooks let function components hold state, refs, reducer logic, memoization, and external synchronization. For useEffect, explain dependencies, cleanup, stale closures, and when derived values should stay in render instead.',
    link: {
      label: 'Practice useEffect timing and cleanup',
      route: ['/react', 'trivia', 'react-useeffect-purpose'],
    },
  },
  {
    title: 'Context API and state management',
    answer: 'The React Context API shares values below a provider, but provider updates can fan out to many consumers. Use it for cross-tree state like auth or theme, split providers, memoize values, and choose local state or a store when updates are frequent.',
    link: {
      label: 'Debug Context performance',
      route: ['/react', 'trivia', 'react-context-performance-issues'],
    },
  },
  {
    title: 'Forms and controlled inputs',
    answer: 'React form answers should explain controlled values, validation timing, defaultValue, refs, file input limits, loading and error states, and the warning that appears when field ownership switches.',
    link: {
      label: 'Compare controlled and uncontrolled inputs',
      route: ['/react', 'trivia', 'react-controlled-vs-uncontrolled'],
    },
  },
  {
    title: 'Class vs functional components and lifecycle',
    answer: 'Function components use hooks for state, effects, refs, memoization, and cleanup. Class components use this.state and lifecycle methods, so interviews often ask how mount, update, and unmount behavior maps to useEffect.',
    link: {
      label: 'Compare functions, classes, and lifecycle',
      route: ['/react', 'trivia', 'react-functional-vs-class-components'],
    },
  },
  {
    title: 'Performance optimization',
    answer: 'Start with profiling, then target real waste: unstable props, broad context updates, expensive derived work, list rendering, unnecessary effects, and memoization that adds complexity without reducing work.',
    link: {
      label: 'Prevent unnecessary rerenders',
      route: ['/react', 'trivia', 'react-prevent-unnecessary-rerenders'],
    },
  },
  {
    title: 'Debugging React applications',
    answer: 'Debug React by separating render, commit, effects, and event handlers. Use React DevTools, StrictMode signals, console traces, and small reproduction cases before guessing at memoization or state fixes.',
    link: {
      label: 'Debug double renders',
      route: ['/react', 'coding', 'react-debug-double-render'],
    },
  },
  {
    title: 'Testing React components',
    answer: 'Good tests cover user-visible behavior: initial state, interactions, validation, async loading and error paths, cleanup, and rerender edge cases. Prefer Testing Library style assertions over implementation details.',
    link: {
      label: 'Open the React prep path',
      route: ['/guides', 'framework-prep', 'react-prep-path'],
    },
  },
];

const REACT_MISTAKE_ITEMS: ReactSupportItem[] = [
  {
    title: 'Mutating props or state objects',
    detail: 'Mutation breaks React ownership, memoization, and predictable rerender behavior. Use callbacks and immutable updates instead.',
  },
  {
    title: 'Putting derived data into effect-managed state',
    detail: 'Pure derived values usually belong in render. Storing them in useEffect creates extra renders and stale synchronization bugs.',
  },
  {
    title: 'Missing effect dependencies or cleanup',
    detail: 'Timers, subscriptions, event listeners, and fetches need cleanup and dependency arrays that match the external sync being performed.',
  },
  {
    title: 'Using index keys for reorderable lists',
    detail: 'Index keys hide identity bugs when rows reorder, insert, delete, or hold input state. Prefer stable IDs from the data.',
  },
  {
    title: 'Treating Context as a global store',
    detail: 'Context is convenient for shared reads, but fast-changing provider values can rerender too much of the tree.',
  },
  {
    title: 'Adding memoization before measuring',
    detail: 'Blanket useMemo and useCallback can add noise. Profile first, then stabilize props or split components where it reduces real work.',
  },
];

const REACT_LIBRARY_ITEMS: ReactSupportItem[] = [
  {
    title: 'Routing and app structure',
    detail: 'React Router, Next.js, and Remix commonly appear when interviews discuss routes, nested layouts, server rendering, or data loading.',
  },
  {
    title: 'Server state and data fetching',
    detail: 'TanStack Query and SWR are common examples for caching, request dedupe, retries, stale data, and loading/error state.',
  },
  {
    title: 'Client state',
    detail: 'Redux Toolkit, Zustand, and Jotai are useful comparison points when Context or local state no longer fits the update pattern.',
  },
  {
    title: 'Forms and validation',
    detail: 'React Hook Form and Formik often show up when forms need validation, touched state, async submit handling, and field arrays.',
  },
  {
    title: 'Testing and component review',
    detail: 'Testing Library, Jest, Vitest, Playwright, and Storybook help explain behavior tests, integration checks, and component documentation.',
  },
];

const ANGULAR_TOPIC_CARDS: AngularTopicCard[] = [
  {
    title: 'RxJS and HttpClient cancellation',
    answer: 'HttpClient returns Observables, and real cancellation depends on unsubscribing from the active request. For typeahead or route changes, choose switchMap, AsyncPipe, or lifecycle teardown so stale responses do not win.',
    link: {
      label: 'Practice HttpClient cancellation',
      route: ['/angular', 'trivia', 'angular-http-what-actually-cancels-request'],
    },
  },
  {
    title: 'Dependency injection and services',
    answer: 'Angular DI creates and supplies services, config values, and scoped dependencies. Strong answers connect service responsibility with provider placement, because root, route, and component providers change instance lifetime.',
    link: {
      label: 'Review Angular dependency injection',
      route: ['/angular', 'trivia', 'angular-dependency-injection'],
    },
  },
  {
    title: 'Forms and validation',
    answer: 'Angular forms questions usually test state ownership, validation timing, async validation, and reusable controls. Reactive Forms are the safer default once the workflow is dynamic, validation-heavy, or needs focused tests.',
    link: {
      label: 'Compare Angular form strategies',
      route: ['/angular', 'trivia', 'angular-template-driven-vs-reactive-forms-which-scales'],
    },
  },
  {
    title: 'Change detection and OnPush',
    answer: 'Change detection answers should name the trigger path, not just the API. Default, OnPush, AsyncPipe, signals, markForCheck, and detectChanges all matter when you debug stale UI or excessive rerenders.',
    link: {
      label: 'Debug change detection strategies',
      route: ['/angular', 'trivia', 'angular-change-detection-strategies'],
    },
  },
  {
    title: 'Standalone components vs NgModules',
    answer: 'Standalone components cover most new Angular composition, routing, and provider setup. NgModules still matter for legacy declarations, module-shaped libraries, and compatibility boundaries.',
    link: {
      label: 'Compare standalone and NgModules',
      route: ['/angular', 'trivia', 'angular-ngmodules-vs-standalone'],
    },
  },
  {
    title: 'Testing Angular applications',
    answer: 'Good Angular tests protect behavior at the right boundary: pure validators and services without TestBed where possible, TestBed for template integration, and HTTP/router tools for async flows. Avoid tests that only prove construction.',
    link: {
      label: 'Open the Angular testing prep path',
      route: ['/guides', 'framework-prep', 'angular-prep-path'],
    },
  },
  {
    title: 'Performance optimization',
    answer: 'Performance answers should start with evidence, then choose the fix: lazy loading for bundle cost, OnPush and trackBy for render churn, and moving expensive work when the main thread is blocked.',
    link: {
      label: 'Review Angular performance optimization',
      route: ['/angular', 'trivia', 'angular-performance-optimization'],
    },
  },
  {
    title: 'State management and NgRx',
    answer: 'State management questions test whether state is local, shared, durable, or business-critical. Use local component state for short-lived UI state, services for contained feature state, and NgRx when explicit global transitions pay for their cost.',
    link: {
      label: 'Choose Store vs component state',
      route: ['/angular', 'trivia', 'ngrx-store-vs-component-state-angular-when-to-use'],
    },
  },
];

const ANGULAR_MISTAKE_ITEMS: AngularMistakeItem[] = [
  {
    title: 'Memorizing lifecycle hooks without timing',
    detail: 'Name what belongs in constructor, ngOnInit, ngAfterViewInit, and ngOnDestroy, then explain the production bug each hook can prevent.',
  },
  {
    title: 'Using mergeMap when latest search should win',
    detail: 'Typeahead and filter flows usually need switchMap so slower previous responses cannot overwrite newer user intent.',
  },
  {
    title: 'Treating DI as only service injection',
    detail: 'Provider scope, InjectionToken usage, multi providers, and lazy route boundaries are the interview details that reveal real Angular experience.',
  },
  {
    title: 'Mutating OnPush inputs and patching symptoms',
    detail: 'Fix the state update path first; random detectChanges calls usually hide a reference, zone, or async ownership problem.',
  },
  {
    title: 'Ignoring form edge cases',
    detail: 'Async validation cancellation, touched and disabled propagation, FormArray shape, and CVA behavior are what turn a simple form into an interview-grade form.',
  },
  {
    title: 'Writing tests that skip async behavior',
    detail: 'Cover loading, error, HTTP cancellation, router timing, and DOM interaction when those behaviors are the reason the Angular code exists.',
  },
];

const ANGULAR_MODERN_TOPICS: string[] = [
  'Standalone apps and route providers: know what moved out of AppModule and how provider scope changes during migration.',
  'Signals: explain where signal-based state helps and where RxJS still fits better for streams, cancellation, and multicasting.',
  'Zoneless change detection: describe how UI updates are scheduled when Zone.js is no longer the default notification path.',
  'Signal Forms: mention as an experimental modern forms direction, not as a production replacement for every Reactive Forms workflow.',
];

const HTML_TOPIC_CARDS: HtmlTopicCard[] = [
  {
    title: 'HTML role in web development',
    answer: 'HTML is the structural layer browsers parse into the DOM. Strong interview answers explain how markup gives content meaning before CSS styles it or JavaScript changes behavior.',
    link: {
      label: 'Practice HTML basic structure',
      route: ['/html', 'coding', 'html-basic-structure'],
    },
  },
  {
    title: 'Semantic HTML, forms, and validation',
    answer: 'Use headings, landmarks, labels, form controls, table headers, and metadata before adding ARIA or custom scripts. This keeps answers grounded in accessibility, SEO, and native browser behavior.',
    link: {
      label: 'Build a labeled contact form',
      route: ['/html', 'coding', 'html-contact-form-labeled'],
    },
  },
  {
    title: 'HTML vs HTML5 in interviews',
    answer: 'Treat HTML5 as modern HTML: the simple doctype, semantic elements, media, native validation, and the living-standard mindset. The interview signal is knowing which browser behavior comes for free.',
    link: {
      label: 'Review HTML document standards',
      route: ['/html', 'trivia', 'html-vs-xhtml'],
    },
  },
  {
    title: 'Accessibility testing workflow',
    answer: 'Do not stop at a validator. Test keyboard flow, labels, focus order, table headers, contrast, screen-reader or accessibility-tree output, then run Lighthouse, axe, and an HTML checker.',
    link: {
      label: 'Practice accessibility review',
      route: ['/html', 'trivia', 'web-accessibility-make-page-accessible'],
    },
  },
];

const HTML_MISTAKE_ITEMS: HtmlMistakeItem[] = [
  {
    title: 'Using div and span for every structure',
    detail: 'Reach for header, nav, main, section, article, footer, button, and anchor before generic containers.',
  },
  {
    title: 'Treating placeholders as labels',
    detail: 'Every input needs a durable accessible name; placeholder text disappears and is not a reliable label.',
  },
  {
    title: 'Skipping table captions and header scope',
    detail: 'Accessible tables need captions and header associations so row and column meaning survives assistive technology.',
  },
  {
    title: 'Building fake links or buttons',
    detail: 'Use anchors for navigation and buttons for actions so keyboard behavior, semantics, and browser defaults stay correct.',
  },
  {
    title: 'Adding ARIA before fixing native markup',
    detail: 'ARIA can help custom widgets, but it should not hide missing labels, wrong landmarks, or broken control choices.',
  },
  {
    title: 'Ignoring head metadata',
    detail: 'Charset, viewport, title, description, canonical, and social metadata are part of production HTML quality.',
  },
];

const HTML_BEST_PRACTICES: string[] = [
  'Start with a valid document skeleton: doctype, html lang, charset, viewport, title, and body content.',
  'Choose semantic elements first, then add ARIA only when native HTML cannot express the interaction.',
  'Keep heading order, one main landmark, descriptive links, useful alt text, and keyboard-friendly controls.',
  'Label every form control, group related fields, expose validation errors, and use native input types when they fit.',
  'Validate markup, run accessibility checks, test keyboard navigation, and inspect mobile reflow before calling the answer done.',
];

const HTML_MODERN_TOPICS: string[] = [
  'HTML5 as modern HTML: simple doctype, semantic elements, native media, form validation, and ongoing Living Standard updates.',
  'Native UI primitives: dialog, popover, details, summary, and when custom JavaScript still needs accessibility work.',
  'Web components: template, slot, custom elements, and Shadow DOM as encapsulation topics for experienced rounds.',
  'Responsive and performance-minded markup: srcset, sizes, loading, fetch priority, preload, and script loading attributes.',
  'Metadata and structured pages: language, viewport, title, description, canonical, Open Graph, and crawlable content.',
];

const HTML_BEHAVIORAL_ITEMS: HtmlBehavioralItem[] = [
  {
    title: 'Accessibility improvement story',
    detail: 'Prepare a short example where labels, keyboard flow, table headers, or focus order changed the user outcome.',
  },
  {
    title: 'SEO or metadata cleanup',
    detail: 'Show how better titles, descriptions, canonical tags, or semantic structure reduced ambiguity for users and crawlers.',
  },
  {
    title: 'Progressive enhancement trade-off',
    detail: 'Explain when native validation, dialog, or semantic controls avoided extra JavaScript while keeping a fallback path.',
  },
  {
    title: 'Design and product collaboration',
    detail: 'Tie markup decisions to shared language: clear labels, error copy, responsive constraints, and measurable acceptance checks.',
  },
];

const HTML_RESOURCE_LINKS: HtmlResourceLink[] = [
  {
    label: 'MDN HTML reference',
    href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Reference',
    summary: 'Elements, attributes, content categories, forms, metadata, and browser behavior.',
  },
  {
    label: 'WHATWG HTML Living Standard',
    href: 'https://html.spec.whatwg.org/multipage/introduction.html',
    summary: 'The current source for modern HTML behavior and standards terminology.',
  },
  {
    label: 'WAI form labels tutorial',
    href: 'https://www.w3.org/WAI/tutorials/forms/labels/',
    summary: 'Accessible labels, form control naming, instructions, and validation feedback.',
  },
  {
    label: 'Chrome DevTools accessibility reference',
    href: 'https://developer.chrome.com/docs/devtools/accessibility/reference?hl=en',
    summary: 'Accessibility tree inspection, Lighthouse checks, contrast, and reflow testing.',
  },
  {
    label: 'W3C HTML checker docs',
    href: 'https://validator.w3.org/docs/users.html',
    summary: 'Markup validation workflow for modern HTML documents and automated checks.',
  },
];

const DIFFICULTY_RANK: Record<string, number> = {
  easy: 0,
  intermediate: 1,
  hard: 2,
};

@Component({
  standalone: true,
  selector: 'app-interview-questions-landing',
  imports: [CommonModule, RouterModule, PrepRoadmapComponent],
  templateUrl: './interview-questions-landing.component.html',
  styleUrls: ['./interview-questions-landing.component.css'],
})
export class InterviewQuestionsLandingComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly questionService = inject(QuestionService);
  private readonly seo = inject(SeoService);
  private readonly analytics = inject(AnalyticsService);

  config: InterviewQuestionsLandingConfig = DEFAULT_CONFIG;
  loading = true;
  codingQuestions: QuestionSummaryRow[] = [];
  triviaQuestions: QuestionSummaryRow[] = [];
  relatedHubLinks: HubLink[] = [];
  featuredLinks: HubLink[] = [];
  readonly previewLimit = 6;

  ngOnInit(): void {
    const incoming = this.route.snapshot.data['interviewQuestions'] as Partial<InterviewQuestionsLandingConfig> | undefined;
    const techs = Array.isArray(incoming?.techs)
      ? incoming!.techs.filter((tech): tech is Tech =>
        ['javascript', 'react', 'angular', 'vue', 'html', 'css'].includes(String(tech)),
      )
      : [];
    const featuredLinks = this.normalizeHubLinks((incoming as { featuredLinks?: unknown } | undefined)?.featuredLinks);

    this.config = {
      keyword: String(incoming?.keyword || DEFAULT_CONFIG.keyword),
      title: String(incoming?.title || DEFAULT_CONFIG.title),
      techs: techs.length ? techs : DEFAULT_CONFIG.techs,
      isMasterHub: Boolean(incoming?.isMasterHub),
      featuredLinks,
    };

    this.featuredLinks = featuredLinks;
    this.relatedHubLinks = this.buildRelatedHubLinks();
    const resolved = this.route.snapshot.data['interviewQuestionsList'] as InterviewQuestionsHubResolved | undefined;
    if (resolved && this.hasResolvedRows(resolved)) {
      this.applyResolvedRows(resolved);
      this.loading = false;
      this.updateSchema();
      return;
    }

    this.loadLists();
  }

  keywordSentenceCase(): string {
    const keyword = this.config.keyword.trim().toLowerCase();
    if (keyword.startsWith('javascript')) return this.config.keyword.replace(/^javascript/i, 'JavaScript');
    if (keyword.startsWith('react')) return this.config.keyword.replace(/^react/i, 'React');
    if (keyword.startsWith('angular')) return this.config.keyword.replace(/^angular/i, 'Angular');
    if (keyword.startsWith('vue js')) return this.config.keyword.replace(/^vue js/i, 'Vue JS');
    if (keyword.startsWith('vue')) return this.config.keyword.replace(/^vue/i, 'Vue');
    if (keyword.startsWith('html and css')) return this.config.keyword.replace(/^html and css/i, 'HTML and CSS');
    if (keyword.startsWith('html css')) return this.config.keyword.replace(/^html css/i, 'HTML CSS');
    if (keyword.startsWith('html')) return this.config.keyword.replace(/^html/i, 'HTML');
    if (keyword.startsWith('css')) return this.config.keyword.replace(/^css/i, 'CSS');
    return this.config.keyword.charAt(0).toUpperCase() + this.config.keyword.slice(1);
  }

  introLead(): string {
    if (this.isMasterHub()) {
      return 'Frontend interview question hub with answers, coding prompts, concept questions, follow-ups, and common mistakes. Start with crucial JavaScript practice, then branch into React, Angular, Vue, HTML, CSS, and system design prep.';
    }

    if (this.isHtmlCssHub()) {
      return 'HTML and CSS interview questions and answers hub with coding prompts, concept questions, follow-ups, and common mistakes. Practice semantic markup, accessibility, layout, and cascade reasoning before moving into broader UI drills.';
    }

    if (this.isVueHub()) {
      return 'Vue.js interview questions and Vue JS answers hub with coding prompts, concept questions, follow-ups, and common mistakes. Practice reactivity and component reasoning first, then expand into prep paths and company-style drills.';
    }

    return `${this.keywordSentenceCase()} and answers hub with coding prompts, concept questions, follow-ups, and common mistakes. Practice concise answers first, then expand into Study Plans, guides, and Company Prep.`;
  }

  listIntentItems(): string[] {
    if (this.isMasterHub()) {
      return [
        'Start with curated JavaScript essentials to warm up interview execution speed.',
        'Mix coding implementation drills, concept explanation checks, and preview links in one short loop.',
        'Expand to framework hubs, guides, and tracks once your baseline is stable.',
      ];
    }

    const techName = this.currentHubTechLabel();
    return [
      `Prioritize high-impact ${techName} coding prompts first.`,
      `Use ${techName} concept rounds and explanations to sharpen answer speed.`,
      'Escalate into the frontend interview prep platform for guided sequencing.',
    ];
  }

  codingSectionTitle(): string {
    if (this.isMasterHub()) return 'Most crucial JavaScript coding interview questions';
    return `Most crucial ${this.currentHubTechDisplay()} coding interview questions`;
  }

  codingSectionSubtitle(): string {
    if (this.isMasterHub()) {
      return 'Curated by importance for fast onboarding. Start here, then open full libraries and tracks.';
    }
    return 'Ranked by interview importance so you can start with the highest-signal implementation drills.';
  }

  triviaSectionTitle(): string {
    if (this.isMasterHub()) return 'Most crucial JavaScript concept questions for interviews';
    return `Most crucial ${this.currentHubTechDisplay()} concept questions for interviews`;
  }

  triviaSectionSubtitle(): string {
    if (this.isMasterHub()) {
      return 'Use these high-importance concept checks to tighten your fundamentals before deeper rounds.';
    }
    return 'Ranked by interview importance to strengthen your explanation speed where it matters most.';
  }

  masterTechHubLinks(): HubLink[] {
    return INTERVIEW_HUB_LINKS.filter((hub) => PRIMARY_TECH_HUB_PATHS.has(hub.path));
  }

  prepPlanLinks(): PrepPlanLink[] {
    return PREP_PLAN_LINKS;
  }

  isReactHub(): boolean {
    return !this.isMasterHub() && this.config.techs.length === 1 && this.config.techs[0] === 'react';
  }

  reactTopicCards(): ReactTopicCard[] {
    return REACT_TOPIC_CARDS;
  }

  reactMistakeItems(): ReactSupportItem[] {
    return REACT_MISTAKE_ITEMS;
  }

  reactLibraryItems(): ReactSupportItem[] {
    return REACT_LIBRARY_ITEMS;
  }

  isAngularHub(): boolean {
    return !this.isMasterHub() && this.config.techs.length === 1 && this.config.techs[0] === 'angular';
  }

  angularTopicCards(): AngularTopicCard[] {
    return ANGULAR_TOPIC_CARDS;
  }

  angularMistakeItems(): AngularMistakeItem[] {
    return ANGULAR_MISTAKE_ITEMS;
  }

  angularModernTopics(): string[] {
    return ANGULAR_MODERN_TOPICS;
  }

  isHtmlHub(): boolean {
    return !this.isMasterHub() && this.config.techs.length === 1 && this.config.techs[0] === 'html';
  }

  htmlTopicCards(): HtmlTopicCard[] {
    return HTML_TOPIC_CARDS;
  }

  htmlMistakeItems(): HtmlMistakeItem[] {
    return HTML_MISTAKE_ITEMS;
  }

  htmlBestPractices(): string[] {
    return HTML_BEST_PRACTICES;
  }

  htmlModernTopics(): string[] {
    return HTML_MODERN_TOPICS;
  }

  htmlBehavioralItems(): HtmlBehavioralItem[] {
    return HTML_BEHAVIORAL_ITEMS;
  }

  htmlResourceLinks(): HtmlResourceLink[] {
    return HTML_RESOURCE_LINKS;
  }

  prepRoadmapTitle(): string {
    return this.isMasterHub()
      ? 'Recommended frontend interview preparation'
      : `Recommended ${this.currentRoadmapTechDisplay()} interview preparation`;
  }

  prepRoadmapSubtitle(): string {
    if (this.isMasterHub()) {
      return 'Start with the interview preparation guide, use Essential 60 as the core practice block, then broaden by format, stack, and final-round coverage.';
    }

    return `Start with the interview preparation guide and shared baseline, then tighten ${this.currentRoadmapTechDisplay()} coding, concepts, and follow-up depth.`;
  }

  prepRoadmapItems(): PrepRoadmapItem[] {
    if (this.isMasterHub()) {
      return [
        {
          step: 1,
          title: 'Frontend interview preparation guide',
          description: 'Learn the interview stages, scoring signals, and prep sequence before opening practice lists.',
          route: ['/guides', 'interview-blueprint', 'intro'],
          badge: 'Start here',
          meta: 'Process, rounds, and plan',
          tone: 'recommended',
        },
        {
          step: 2,
          title: 'FrontendAtlas Essential 60',
          description: 'Work through the core shortlist across JavaScript utilities, UI coding, concepts, and system design.',
          route: ['/interview-questions/essential'],
          meta: 'Core practice block',
          tone: 'practice',
        },
        {
          step: 3,
          title: 'Question Library',
          description: 'Broaden into more coding and concept coverage by format, stack, difficulty, and weak area.',
          route: ['/coding'],
          queryParams: { reset: 1 },
          meta: 'Broader coding + concepts',
          tone: 'structured',
        },
        {
          step: 4,
          title: 'Framework interview hubs',
          description: 'Branch into React, Angular, Vue, HTML, or CSS once the shared baseline shows which stack needs depth.',
          route: ['/react/interview-questions'],
          meta: 'React, Angular, Vue, HTML/CSS',
          tone: 'structured',
        },
        {
          step: 5,
          title: 'Study Plans / System Design',
          description: 'Move into longer tracks when you need weekly sequencing, architecture practice, or company-style prep.',
          route: ['/tracks'],
          meta: 'Structured weekly prep',
          tone: 'advanced',
        },
      ];
    }

    const tech = this.currentRoadmapTechDisplay();
    const questionTarget = this.libraryTarget();

    return [
      {
        step: 1,
        title: 'Frontend interview preparation guide',
        description: 'Learn the interview stages and scoring signals before narrowing into this technology.',
        route: ['/guides', 'interview-blueprint', 'intro'],
        badge: 'Start here',
        meta: 'Process, rounds, and plan',
        tone: 'recommended',
      },
      {
        step: 2,
        title: 'FrontendAtlas Essential 60',
        description: 'Start with the shared shortlist to stabilize interview fundamentals before framework-specific depth.',
        route: ['/interview-questions/essential'],
        meta: 'Shared frontend baseline',
        tone: 'practice',
      },
      {
        step: 3,
        title: `${tech} coding + concept questions`,
        description: `Practice ${tech} implementation prompts and explanation follow-ups from one filtered library view.`,
        route: questionTarget.route,
        queryParams: questionTarget.queryParams,
        meta: 'Coding execution + concept recall',
        tone: 'practice',
      },
      {
        step: 4,
        title: `${tech} interview prep path`,
        description: this.hubIntentProfile().relatedPrep.summary,
        route: this.hubIntentProfile().relatedPrep.route,
        meta: 'Framework-specific sequencing',
        tone: 'structured',
      },
      {
        step: 5,
        title: 'Final-round coverage',
        description: 'Add system design, behavioral, and company-style follow-ups after the framework baseline is stable.',
        route: ['/coding'],
        queryParams: { view: 'formats', category: 'system' },
        meta: 'System design, behavioral, company rounds',
        tone: 'advanced',
      },
    ];
  }

  supportsMultipleTechs(): boolean {
    return this.config.techs.length > 1;
  }

  mustKnowCount(): number {
    return [...this.codingQuestions, ...this.triviaQuestions]
      .filter((row) => row.priority === 'must_know')
      .length;
  }

  previewRows(kind: Kind): QuestionSummaryRow[] {
    const rows = kind === 'coding' ? this.codingQuestions : this.triviaQuestions;
    return rows.slice(0, this.previewLimit);
  }

  topConceptRows(): QuestionSummaryRow[] {
    return this.previewRows('trivia');
  }

  topConceptLinks(): HubConceptLink[] {
    const primaryTech = this.primaryTechForLibrary();
    const featured = primaryTech === 'angular' ? this.featuredLinks.slice(0, 3) : [];
    if (featured.length) {
      return featured.map((link) => ({
        label: link.label,
        route: link.route,
        ariaLabel: `Open ${link.label}`,
      }));
    }

    return this.topConceptRows().map((row) => ({
      label: row.title,
      route: row.link,
      ariaLabel: this.questionAriaLabel(row),
    }));
  }

  hubIntentProfile(): HubIntentProfile {
    return HUB_INTENT_PROFILES[this.hubProfileKey()] || HUB_INTENT_PROFILES['master'];
  }

  faqItems(): HubFaqItem[] {
    return HUB_FAQ_PROFILES[this.hubProfileKey()] || HUB_FAQ_PROFILES['master'];
  }

  questionCtaLabel(row: QuestionSummaryRow): string {
    const tech = this.techLabel(row.tech);
    return row.kind === 'trivia'
      ? `Open ${tech} interview question`
      : `Open ${tech} coding interview challenge`;
  }

  questionAriaLabel(row: QuestionSummaryRow): string {
    return `${this.questionCtaLabel(row)}: ${row.title}`;
  }

  viewAllTarget(kind: Kind): { route: any[]; queryParams?: Record<string, string | number | boolean> } {
    return this.libraryTarget(kind);
  }

  trackPrepRoadmapSelection(item: PrepRoadmapItem): void {
    this.analytics.track('interview_hub_route_selected', {
      hub_path: this.currentHubPath(),
      route_key: `roadmap_${item.step}`,
      roadmap_step: item.step,
      roadmap_title: item.title,
      is_master_hub: this.isMasterHub(),
    });
  }

  trackViewAll(kind: Kind): void {
    this.analytics.track('interview_hub_view_all_clicked', {
      hub_path: this.currentHubPath(),
      kind,
    });
  }

  priorityLabel(row: QuestionSummaryRow): string {
    switch (row.priority) {
      case 'must_know':
        return 'Must know';
      case 'high_leverage':
        return 'High leverage';
      default:
        return 'Core';
    }
  }

  priorityReason(row: QuestionSummaryRow): string {
    if (row.priority === 'must_know') {
      return row.kind === 'coding'
        ? 'Critical for coding rounds and edge-case discussion.'
        : 'Frequently tested in explanation-heavy rounds.';
    }

    if (row.priority === 'high_leverage') {
      return row.kind === 'coding'
        ? 'High interview value and common implementation surface.'
        : 'High-signal concept for concise interview explanations.';
    }

    return row.kind === 'coding'
      ? 'Solid reinforcement to stabilize your baseline execution.'
      : 'Useful reinforcement to keep recall fluent under pressure.';
  }

  isMasterHub(): boolean {
    return this.config.isMasterHub;
  }

  isHtmlCssHub(): boolean {
    return !this.isMasterHub()
      && this.config.techs.includes('html')
      && this.config.techs.includes('css');
  }

  isVueHub(): boolean {
    return !this.isMasterHub()
      && this.config.techs.length === 1
      && this.config.techs[0] === 'vue';
  }

  techLabel(tech: Tech): string {
    switch (tech) {
      case 'javascript':
        return 'JavaScript';
      case 'react':
        return 'React';
      case 'angular':
        return 'Angular';
      case 'vue':
        return 'Vue';
      case 'html':
        return 'HTML';
      case 'css':
        return 'CSS';
      default:
        return tech;
    }
  }

  private loadLists(): void {
    this.loading = true;
    const crucialTechs = this.crucialTechsForCurrentHub();

    forkJoin({
      coding: this.loadKindRows('coding', crucialTechs),
      trivia: this.loadKindRows('trivia', crucialTechs),
    }).subscribe({
      next: ({ coding, trivia }) => {
        this.codingQuestions = coding
          .map((row) => this.toRow(row, 'coding'))
          .slice(0, 12);
        this.triviaQuestions = trivia
          .map((row) => this.toRow(row, 'trivia'))
          .slice(0, 12);
        this.loading = false;
        this.updateSchema();
      },
      error: () => {
        this.codingQuestions = [];
        this.triviaQuestions = [];
        this.loading = false;
        this.updateSchema();
      },
    });
  }

  private loadKindRows(kind: Kind, techs: Tech[]) {
    return forkJoin(
      techs.map((tech) =>
        this.questionService.loadQuestionSummaries(tech, kind, { transferState: false }).pipe(
          map((rows) => rows.map((row) => ({ ...row, tech } as RawQuestionSummaryRow))),
          catchError(() => of([] as RawQuestionSummaryRow[])),
        ),
      ),
    ).pipe(
      map((buckets) => buckets.flat()),
      map((rows) =>
        rows
          .filter((row) => !!row.id && !!row.title && techs.includes(row.tech))
          .sort((a, b) => this.compareRows(a, b)),
      ),
    );
  }

  private hasResolvedRows(resolved: InterviewQuestionsHubResolved): boolean {
    return Array.isArray(resolved.coding) && Array.isArray(resolved.trivia);
  }

  private applyResolvedRows(resolved: InterviewQuestionsHubResolved): void {
    const crucialTechs = this.crucialTechsForCurrentHub();
    const codingRows = this.filterRowsForCurrentHub(resolved.coding, crucialTechs);
    const triviaRows = this.filterRowsForCurrentHub(resolved.trivia, crucialTechs);

    this.codingQuestions = codingRows
      .map((row) => this.toRow(row, 'coding'))
      .slice(0, 12);
    this.triviaQuestions = triviaRows
      .map((row) => this.toRow(row, 'trivia'))
      .slice(0, 12);
  }

  private filterRowsForCurrentHub(rows: RawQuestionSummaryRow[], techs: Tech[] = this.config.techs): RawQuestionSummaryRow[] {
    return rows
      .filter((row) => !!row.id && !!row.title && techs.includes(row.tech))
      .sort((a, b) => this.compareRows(a, b));
  }

  private crucialTechsForCurrentHub(): Tech[] {
    return this.isMasterHub() ? ['javascript'] : this.config.techs;
  }

  private compareRows(a: RawQuestionSummaryRow, b: RawQuestionSummaryRow): number {
    const aImportance = Number(a.importance || 0);
    const bImportance = Number(b.importance || 0);
    if (aImportance !== bImportance) return bImportance - aImportance;

    const aDifficulty = DIFFICULTY_RANK[String(a.difficulty || '').toLowerCase()] ?? 99;
    const bDifficulty = DIFFICULTY_RANK[String(b.difficulty || '').toLowerCase()] ?? 99;
    if (aDifficulty !== bDifficulty) return aDifficulty - bDifficulty;

    return String(a.title || '').localeCompare(String(b.title || ''));
  }

  private primaryTechForLibrary(): Tech | null {
    if (this.isMasterHub()) return 'javascript';
    if (this.config.techs.length === 1) return this.config.techs[0];
    return null;
  }

  private libraryTarget(kind?: Kind): { route: any[]; queryParams?: Record<string, string | number | boolean> } {
    if (this.isHtmlCssHub()) {
      const queryParams: Record<string, string | number | boolean> = {
        view: 'formats',
        category: 'html-css',
      };
      if (kind) queryParams['kind'] = kind;
      queryParams['reset'] = 1;
      return { route: ['/coding'], queryParams };
    }

    const queryParams: Record<string, string | number | boolean> = {};
    const primaryTech = this.primaryTechForLibrary();
    if (primaryTech) queryParams['tech'] = primaryTech;
    if (kind) queryParams['kind'] = kind;
    queryParams['reset'] = 1;
    return { route: ['/coding'], queryParams };
  }

  private hubProfileKey(): string {
    if (this.isMasterHub()) return 'master';
    if (this.isHtmlCssHub()) return 'htmlCss';
    return this.primaryTechForLibrary() || 'master';
  }

  private toRow(row: RawQuestionSummaryRow, kind: Kind): QuestionSummaryRow {
    const importance = Math.max(0, Number(row.importance || 0));
    return {
      id: String(row.id || ''),
      title: String(row.title || ''),
      tech: row.tech,
      kind,
      difficulty: String(row.difficulty || 'intermediate'),
      importance,
      priority: this.priorityFromImportance(importance),
      description: this.toShortDescription(row),
      link: ['/', row.tech, kind, row.id],
    };
  }

  private priorityFromImportance(importance: number): PrepPriority {
    if (importance >= 4) return 'must_know';
    if (importance >= 2) return 'high_leverage';
    return 'core_reinforcement';
  }

  private toShortDescription(row: QuestionListItem): string {
    const direct = this.cleanText(String(row.shortDescription || ''));
    if (direct) return direct;

    if (typeof row.description === 'string') {
      return this.cleanText(row.description);
    }

    const structured = row.description && typeof row.description === 'object'
      ? (row.description as { summary?: string; text?: string })
      : null;
    return this.cleanText(structured?.summary || structured?.text || '');
  }

  private cleanText(value: string): string {
    return String(value || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private updateSchema(): void {
    const routeSeo = (this.route.snapshot.data['seo'] as SeoMeta | undefined) || {};
    const currentPath = this.currentRoutePath();
    const canonicalUrl = this.seo.buildCanonicalUrl(currentPath);
    const masterHubUrl = this.seo.buildCanonicalUrl('/interview-questions');
    const tracksUrl = this.seo.buildCanonicalUrl('/tracks');
    const companiesUrl = this.seo.buildCanonicalUrl('/companies');
    const description = String(
      routeSeo.description
      || `${this.config.title} with coding and concept prompts for frontend interview preparation.`,
    );

    const schemaLinks = this.schemaQuestionLinks();
    const itemListElement = schemaLinks.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.title,
      url: this.seo.buildCanonicalUrl(item.path),
    }));

    const collectionPage: Record<string, any> = {
      '@type': 'CollectionPage',
      '@id': canonicalUrl,
      url: canonicalUrl,
      name: this.config.title,
      description,
      inLanguage: 'en',
      about: [
        { '@type': 'Thing', name: this.keywordSentenceCase() },
        { '@type': 'Thing', name: `${this.keywordSentenceCase()} and answers` },
        { '@type': 'Thing', name: 'Frontend interview questions' },
      ],
      mentions: [
        { '@type': 'Thing', name: 'Coding prompts' },
        { '@type': 'Thing', name: 'Concept questions' },
        { '@type': 'Thing', name: 'Interview follow-ups' },
        { '@type': 'Thing', name: 'Common interview mistakes' },
        { '@type': 'WebPage', name: 'Frontend interview prep platform', url: tracksUrl },
        { '@type': 'WebPage', name: 'Company frontend interview questions', url: companiesUrl },
      ],
    };

    if (!this.isMasterHub()) {
      collectionPage['isPartOf'] = {
        '@type': 'CollectionPage',
        '@id': masterHubUrl,
        url: masterHubUrl,
        name: 'Frontend Interview Questions',
      };
      collectionPage['mentions'] = [
        { '@type': 'WebPage', name: 'Frontend interview questions library', url: masterHubUrl },
        { '@type': 'Thing', name: 'Coding prompts' },
        { '@type': 'Thing', name: 'Concept questions' },
        { '@type': 'Thing', name: 'Interview follow-ups' },
        { '@type': 'Thing', name: 'Common interview mistakes' },
        { '@type': 'WebPage', name: 'Frontend interview prep platform', url: tracksUrl },
        { '@type': 'WebPage', name: 'Company frontend interview questions', url: companiesUrl },
      ];
    } else {
      collectionPage['hasPart'] = this.masterTechHubLinks().map((hub) => ({
        '@type': 'WebPage',
        name: hub.label,
        url: this.seo.buildCanonicalUrl(hub.path),
      }));
      collectionPage['mentions'] = [
        { '@type': 'Thing', name: 'Coding prompts' },
        { '@type': 'Thing', name: 'Concept questions' },
        { '@type': 'Thing', name: 'Interview follow-ups' },
        { '@type': 'Thing', name: 'Common interview mistakes' },
        { '@type': 'WebPage', name: 'Frontend interview prep platform', url: tracksUrl },
        { '@type': 'WebPage', name: 'Company frontend interview questions', url: companiesUrl },
      ];
    }

    if (this.isReactHub()) {
      collectionPage['about'] = [
        ...(collectionPage['about'] || []),
        { '@type': 'Thing', name: 'React props, state, and one-way data flow' },
        { '@type': 'Thing', name: 'React Hooks and useEffect implementation' },
        { '@type': 'Thing', name: 'React Context API and state management' },
        { '@type': 'Thing', name: 'React forms and controlled inputs' },
        { '@type': 'Thing', name: 'React class components versus functional components' },
        { '@type': 'Thing', name: 'React component lifecycle' },
      ];
      collectionPage['mentions'] = [
        ...(collectionPage['mentions'] || []),
        { '@type': 'Thing', name: 'Common React interview mistakes' },
        { '@type': 'Thing', name: 'React performance optimization' },
        { '@type': 'Thing', name: 'Debugging React applications' },
        { '@type': 'Thing', name: 'Testing React components' },
        { '@type': 'Thing', name: 'Common React libraries' },
        { '@type': 'Thing', name: 'React Hooks interview questions' },
      ];
    }

    if (this.isAngularHub()) {
      collectionPage['about'] = [
        ...(collectionPage['about'] || []),
        { '@type': 'Thing', name: 'Angular RxJS and HttpClient cancellation' },
        { '@type': 'Thing', name: 'Angular dependency injection' },
        { '@type': 'Thing', name: 'Angular forms and validation' },
        { '@type': 'Thing', name: 'Angular change detection' },
      ];
      collectionPage['mentions'] = [
        ...(collectionPage['mentions'] || []),
        { '@type': 'Thing', name: 'Angular common interview mistakes' },
        { '@type': 'Thing', name: 'Angular testing applications' },
        { '@type': 'Thing', name: 'Angular performance optimization' },
        { '@type': 'Thing', name: 'Angular standalone components versus NgModules' },
        { '@type': 'Thing', name: 'Angular state management and NgRx' },
        { '@type': 'Thing', name: 'Modern Angular interview topics' },
      ];
    }

    if (this.isHtmlHub()) {
      collectionPage['about'] = [
        ...(collectionPage['about'] || []),
        { '@type': 'Thing', name: 'HTML5 basics' },
        { '@type': 'Thing', name: 'HTML accessibility testing' },
        { '@type': 'Thing', name: 'HTML best practices' },
        { '@type': 'Thing', name: 'Semantic HTML forms and tables' },
      ];
      collectionPage['mentions'] = [
        ...(collectionPage['mentions'] || []),
        { '@type': 'Thing', name: 'Common HTML mistakes' },
        { '@type': 'Thing', name: 'Modern HTML interview topics' },
        { '@type': 'Thing', name: 'HTML learning resources' },
        { '@type': 'Thing', name: 'HTML role in web development' },
        { '@type': 'Thing', name: 'HTML behavioral interview preparation' },
      ];
    }

    if (itemListElement.length) {
      collectionPage['mainEntity'] = {
        '@type': 'ItemList',
        itemListElement,
      };
    }

    const breadcrumbList = {
      '@type': 'BreadcrumbList',
      itemListElement: this.breadcrumbItems(canonicalUrl, masterHubUrl),
    };

    this.seo.updateTags({
      ...routeSeo,
      canonical: currentPath,
      jsonLd: [collectionPage, breadcrumbList],
    });
  }

  private schemaQuestionLinks(): SchemaQuestionLink[] {
    const seen = new Set<string>();
    const out: SchemaQuestionLink[] = [];
    const combined = [...this.codingQuestions, ...this.triviaQuestions];

    for (const row of combined) {
      const path = `/${row.tech}/${row.kind}/${row.id}`;
      if (seen.has(path)) continue;
      seen.add(path);
      out.push({ title: row.title, path });
      if (out.length >= 20) break;
    }

    return out;
  }

  private breadcrumbItems(canonicalUrl: string, masterHubUrl: string): Array<Record<string, any>> {
    const items: Array<Record<string, any>> = [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'FrontendAtlas',
        item: this.seo.buildCanonicalUrl('/'),
      },
    ];

    if (!this.isMasterHub()) {
      items.push({
        '@type': 'ListItem',
        position: 2,
        name: 'Frontend Interview Questions',
        item: masterHubUrl,
      });
      items.push({
        '@type': 'ListItem',
        position: 3,
        name: this.config.title,
        item: canonicalUrl,
      });
      return items;
    }

    items.push({
      '@type': 'ListItem',
      position: 2,
      name: this.config.title,
      item: canonicalUrl,
    });
    return items;
  }

  private currentRoutePath(): string {
    const segments = this.route.snapshot.pathFromRoot
      .flatMap((entry) => entry.url || [])
      .map((segment) => segment.path)
      .filter((segment) => !!segment);

    return segments.length ? `/${segments.join('/')}` : '/';
  }

  private buildRelatedHubLinks(): HubLink[] {
    const currentPath = this.currentHubPath();
    return INTERVIEW_HUB_LINKS.filter((hub) => hub.path !== currentPath);
  }

  private normalizeHubLinks(raw: unknown): HubLink[] {
    if (!Array.isArray(raw)) return [];
    const seen = new Set<string>();
    const out: HubLink[] = [];

    for (const item of raw) {
      if (!item || typeof item !== 'object') continue;
      const candidate = item as { label?: unknown; path?: unknown; route?: unknown };
      const path = String(candidate.path || '').trim();
      const label = String(candidate.label || '').trim();
      if (!path.startsWith('/') || !label) continue;
      if (seen.has(path)) continue;
      seen.add(path);

      const route = Array.isArray(candidate.route)
        ? candidate.route.filter((part) => typeof part === 'string' || typeof part === 'number')
        : [path];
      out.push({ label, path, route });
    }

    return out;
  }

  private currentHubPath(): string {
    if (this.config.isMasterHub) return '/interview-questions';
    if (this.config.techs.length === 1) {
      const tech = this.config.techs[0];
      if (
        tech === 'javascript'
        || tech === 'react'
        || tech === 'angular'
        || tech === 'vue'
        || tech === 'html'
        || tech === 'css'
      ) {
        return `/${tech}/interview-questions`;
      }
    }

    if (this.config.techs.includes('html') && this.config.techs.includes('css')) {
      return '/html-css/interview-questions';
    }

    return '/interview-questions';
  }

  private currentHubTechLabel(): string {
    if (this.isHtmlCssHub()) return 'html and css';
    if (!this.config.techs.length) return 'frontend';
    return this.techLabel(this.config.techs[0]).toLowerCase();
  }

  private currentHubTechDisplay(): string {
    if (this.isHtmlCssHub()) return 'HTML and CSS';
    if (!this.config.techs.length) return 'frontend';
    return this.techLabel(this.config.techs[0]);
  }

  private currentRoadmapTechDisplay(): string {
    return this.currentHubTechDisplay();
  }
}
