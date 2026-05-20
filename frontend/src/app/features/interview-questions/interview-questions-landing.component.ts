import { CommonModule, DOCUMENT } from '@angular/common';
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
type JavaScriptCoverageLink = { label: string; route: any[] };
type JavaScriptTopicCard = { title: string; answer: string; link: JavaScriptCoverageLink };
type JavaScriptSupportItem = { title: string; detail: string };
type JavaScriptResourceLink = { label: string; href: string; summary: string };
type QuestionLevel = 'beginner' | 'intermediate' | 'advanced';
type JavaScriptShortAnswerCategory = 'fundamentals' | 'async' | 'coding' | 'browser-security';
type JavaScriptShortAnswerItem = {
  q: string;
  a: string;
  route?: any[];
  cta?: string;
  category: JavaScriptShortAnswerCategory;
  level: QuestionLevel;
};
type JavaScriptAnchorItem = { label: string; targetId: string };
type JavaScriptOutputQuestionItem = {
  q: string;
  code: string;
  output: string;
  explanation: string;
  level: QuestionLevel;
  route?: any[];
  cta?: string;
};
type JavaScriptBrowserQuestionItem = {
  q: string;
  a: string;
  level: QuestionLevel;
  route?: any[];
  cta?: string;
};
type JavaScriptEditorialSignal = {
  reviewedLabel: string;
  reviewer: string;
  coverage: string;
  dateModified: string;
};
type ReactCoverageLink = { label: string; route: any[] };
type ReactTopicCard = { title: string; answer: string; link: ReactCoverageLink };
type ReactSupportItem = { title: string; detail: string };
type AngularCoverageLink = { label: string; route: any[] };
type AngularTopicCard = { title: string; answer: string; link: AngularCoverageLink };
type AngularMistakeItem = { title: string; detail: string };
type AngularShortAnswerCategory = 'fundamentals' | 'components' | 'di-change-detection' | 'rxjs-forms' | 'modern';
type AngularShortAnswerItem = {
  q: string;
  a: string;
  route?: any[];
  cta?: string;
  category: AngularShortAnswerCategory;
  level: QuestionLevel;
};
type AngularAnchorItem = { label: string; targetId: string };
type AngularScenarioQuestionItem = {
  q: string;
  code: string;
  explanation: string;
  level: QuestionLevel;
  route?: any[];
  cta?: string;
};
type AngularModernQuestionItem = {
  q: string;
  a: string;
  level: QuestionLevel;
  route?: any[];
  cta?: string;
};
type AngularAudienceTrack = { title: string; detail: string };
type AngularFocusedQuestionItem = {
  q: string;
  a: string;
  level: QuestionLevel;
  route?: any[];
  cta?: string;
};
type AngularEditorialSignal = {
  reviewedLabel: string;
  reviewer: string;
  coverage: string;
  dateModified: string;
};
type AngularKeywordClusterItem = {
  label: string;
  targetId: string;
  detail: string;
};
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
      q: 'Are these JavaScript interview questions for beginners or experienced developers?',
      a: 'Yes. The short-answer grid starts with beginner fundamentals, then moves into intermediate and advanced topics such as async races, prototypes, browser events, XSS, and debugging.',
    },
    {
      q: 'Do these include output-based JavaScript interview questions?',
      a: 'Yes. The output section includes code snippets for coercion, sort behavior, object references, var timing, microtasks, timers, and this binding so you can practice predicting console output.',
    },
    {
      q: 'Where should I practice JavaScript coding interview questions?',
      a: 'Start with the coding prompts on this page, then open the full JavaScript coding list for utilities such as sort, debounce, throttle, duplicate removal, cloning, and DOM traversal.',
    },
    {
      q: 'What are common mistakes in JavaScript interviews?',
      a: 'Common misses include mutating inputs, sorting numbers without a comparator, losing this in callbacks, treating closures as frozen snapshots, ignoring rejected promises, and using JSON cloning as a universal deep-copy answer.',
    },
    {
      q: 'What are the best resources for JavaScript interview preparation?',
      a: 'Use MDN for practical language reference, the ECMAScript specification for precise semantics, Chrome DevTools docs for debugging workflow, OWASP guidance for XSS prevention, and FrontendAtlas practice routes for interview drills.',
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
      q: 'Are these Angular interview questions for beginners and experienced developers?',
      a: 'Yes. The page starts with beginner Angular fundamentals, then moves into experienced-developer topics such as scenarios, testing, security, routing, performance, RxJS, change detection, and modern Angular.',
    },
    {
      q: 'Does this page include Angular testing interview questions?',
      a: 'Yes. The testing section covers TestBed, fakeAsync, tick, HttpTestingController, component harnesses, guards, resolvers, async pipe UI, and brittle Angular test mistakes.',
    },
    {
      q: 'Does this page cover Angular security, guards, resolvers, and performance?',
      a: 'Yes. The security and routing sections cover Angular sanitization, DomSanitizer, XSS prevention, user-controlled URLs, guards, resolvers, AOT/JIT, template compilation, lazy loading, and performance profiling.',
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

const JAVASCRIPT_SHORT_ANSWERS: JavaScriptShortAnswerItem[] = [
  {
    category: 'fundamentals',
    level: 'beginner',
    q: 'What are callbacks in JavaScript?',
    a: 'A callback is a function passed into another function so it can be called later. Callbacks are used in event handlers, array methods, timers, and older asynchronous APIs. The main risk is losing clear control flow or error handling when callbacks become deeply nested or when this is not preserved.',
    route: ['/javascript', 'trivia', 'js-callbacks'],
    cta: 'Review callbacks',
  },
  {
    category: 'fundamentals',
    level: 'beginner',
    q: 'What is the difference between == and ===?',
    a: '== checks equality after JavaScript converts one or both operands to compatible types. === checks equality without type conversion, so both the value and the type must already match. This makes === the safer default because expressions like false == 0 and "" == 0 can be true even though the original values mean different things.',
    route: ['/javascript', 'trivia', 'js-equality-vs-strict-equality'],
    cta: 'Review equality rules',
  },
  {
    category: 'fundamentals',
    level: 'beginner',
    q: 'What is hoisting in JavaScript?',
    a: 'Hoisting is JavaScript behavior where declarations are registered before the surrounding code executes. Function declarations are initialized early enough to be called before their written position, while var declarations exist early but hold undefined until assignment. let and const bindings also exist before execution reaches them, but reading them too early throws because they are in the temporal dead zone.',
    route: ['/javascript', 'trivia', 'js-hoisting'],
    cta: 'Practice hoisting',
  },
  {
    category: 'fundamentals',
    level: 'intermediate',
    q: 'How do closures work in JavaScript?',
    a: 'A closure is formed when a function keeps access to variables from the scope where it was created. Those variables stay available even after the outer function has finished running. Closures are useful for callbacks, function factories, private state, and delayed work, but they can also keep memory alive longer than expected when references are retained.',
    route: ['/javascript', 'trivia', 'js-closures'],
    cta: 'Review closures',
  },
  {
    category: 'fundamentals',
    level: 'intermediate',
    q: 'What is the difference between arrow functions and regular functions?',
    a: 'Arrow functions do not create their own this, arguments object, or constructor behavior. They read this from the surrounding lexical scope, which makes them useful for callbacks that should preserve outer context. Regular functions are better for object methods, constructors, generators, and APIs where this should depend on how the function is called.',
    route: ['/javascript', 'trivia', 'js-arrow-vs-regular-functions'],
    cta: 'Compare function styles',
  },
  {
    category: 'fundamentals',
    level: 'intermediate',
    q: 'How does this work in JavaScript?',
    a: 'In a regular function, this is determined by how the function is called. In obj.method(), this is obj, but assigning the method to another variable and calling it can remove that receiver. bind, call, and apply set this explicitly, while arrow functions inherit this from the surrounding scope.',
    route: ['/javascript', 'trivia', 'js-this-keyword'],
    cta: 'Review this binding',
  },
  {
    category: 'fundamentals',
    level: 'beginner',
    q: 'What is the difference between var, let, and const?',
    a: 'var is scoped to the nearest function and can be redeclared in the same scope. let and const are scoped to the nearest block, which makes them safer inside loops and conditionals. const requires an initial value and prevents rebinding, but object properties and array items can still be mutated.',
    route: ['/javascript', 'trivia', 'js-var-let-const-hoisting'],
    cta: 'Review variable scope',
  },
  {
    category: 'fundamentals',
    level: 'beginner',
    q: 'What is the difference between null, undefined, and undeclared?',
    a: 'undefined is the default value for a declared variable or missing object property that has no assigned value. null is an explicit value that represents an intentional absence. Undeclared means the identifier was never declared, so reading it directly throws a ReferenceError unless you check it with typeof.',
    route: ['/javascript', 'trivia', 'js-null-undefined-undeclared'],
    cta: 'Compare null and undefined',
  },
  {
    category: 'async',
    level: 'intermediate',
    q: 'What is the JavaScript event loop?',
    a: 'The event loop is the mechanism that lets JavaScript run synchronous code and later resume asynchronous callbacks. The call stack runs first, then queued microtasks run, then the runtime can take another task such as a timer or user event. This model allows a single JavaScript thread to coordinate timers, Promises, network callbacks, rendering, and user input.',
    route: ['/javascript', 'trivia', 'js-event-loop'],
    cta: 'Review the event loop',
  },
  {
    category: 'async',
    level: 'advanced',
    q: 'What are microtasks and macrotasks?',
    a: 'Microtasks are high-priority queued callbacks such as Promise.then, Promise.catch, Promise.finally, and queueMicrotask. Macrotasks are broader event-loop tasks such as timers, message events, and user input callbacks. After the current stack finishes, JavaScript drains the microtask queue before it moves to the next macrotask, so Promise callbacks usually run before setTimeout callbacks.',
    route: ['/javascript', 'trivia', 'js-microtasks-vs-macrotasks'],
    cta: 'Compare task queues',
  },
  {
    category: 'async',
    level: 'beginner',
    q: 'What is the purpose of Promises?',
    a: 'A Promise is an object that represents the eventual result of asynchronous work. It starts pending, then either fulfills with a value or rejects with a reason. Promises make async code easier to compose because success, failure, chaining, and fan-out behavior all use the same contract.',
    route: ['/javascript', 'trivia', 'js-promise-fundamental-understanding'],
    cta: 'Review Promise fundamentals',
  },
  {
    category: 'async',
    level: 'intermediate',
    q: 'How is async/await different from Promises?',
    a: 'async/await is syntax built on top of Promises, not a separate async system. An async function always returns a Promise, and await unwraps a fulfilled Promise or throws the rejection. It reads well for sequential steps, but independent work should still be started before awaiting or grouped with Promise.all.',
    route: ['/javascript', 'trivia', 'js-promises-async-await'],
    cta: 'Practice async/await',
  },
  {
    category: 'async',
    level: 'intermediate',
    q: 'What is the difference between Promise.all, allSettled, race, and any?',
    a: 'Promise.all waits for every input to fulfill, but rejects immediately when one input rejects. Promise.allSettled waits for every input and returns status objects for both fulfilled and rejected results. Promise.race mirrors the first settled input, while Promise.any returns the first fulfillment and rejects only when every input rejects.',
    route: ['/javascript', 'trivia', 'js-promise-combinators-all-allsettled-race-any'],
    cta: 'Compare Promise combinators',
  },
  {
    category: 'async',
    level: 'advanced',
    q: 'How do you handle async race conditions?',
    a: 'An async race condition happens when two or more async operations can finish in an order that no longer matches the current user intent. The usual fix is to cancel stale work with AbortController or ignore stale results with a request id, timestamp, or version token. The state update should happen only if the completed operation still matches the latest accepted operation.',
    route: ['/javascript', 'trivia', 'js-async-race-conditions'],
    cta: 'Review async races',
  },
  {
    category: 'async',
    level: 'advanced',
    q: 'How do you debug async JavaScript issues?',
    a: 'Debug async issues by tracing when each operation starts, settles, updates state, and cleans up. Browser network tools show request timing, async stack traces show where callbacks came from, and rejected Promise handling shows hidden failure paths. A small reproduction helps separate stale responses, duplicate requests, missing cleanup, and swallowed errors.',
    route: ['/javascript', 'debug', 'js-debug-async-race'],
    cta: 'Debug an async race',
  },
  {
    category: 'coding',
    level: 'beginner',
    q: 'What is the difference between map, filter, and reduce?',
    a: 'map transforms every item and returns a new array with the same length. filter keeps only the items that pass a condition and can return a shorter array. reduce accumulates the array into one result, such as a number, object, grouped map, or rebuilt array.',
    route: ['/javascript', 'trivia', 'js-map-filter-reduce'],
    cta: 'Compare array methods',
  },
  {
    category: 'coding',
    level: 'beginner',
    q: 'How do you remove duplicates from an array?',
    a: 'For primitive values, [...new Set(arr)] returns a new array with duplicates removed in first-seen order. Set uses SameValueZero equality, so NaN matches NaN and 1 is different from "1". For arrays of objects, deduplicate by a stable key such as id, because two object literals with the same fields are still different references.',
    route: ['/javascript', 'coding', 'js-unique-array'],
    cta: 'Practice remove duplicates',
  },
  {
    category: 'coding',
    level: 'intermediate',
    q: 'How do you implement debounce?',
    a: 'Debounce creates a wrapper that waits until calls stop for a specified delay before running the original function. Each call clears the old timer and schedules a new one, so only the final call in a burst normally runs. The wrapper should pass through the latest arguments and this value, and optional cancel or flush methods can make it easier to control.',
    route: ['/javascript', 'coding', 'js-debounce'],
    cta: 'Practice debounce',
  },
  {
    category: 'coding',
    level: 'intermediate',
    q: 'How do you implement throttle?',
    a: 'Throttle creates a wrapper that runs the original function at most once during a fixed time window. Calls that happen during the cooldown can be ignored or saved for one trailing execution, depending on the chosen API. The implementation should preserve this, forward arguments, and define whether the first call, last call, or both can run.',
    route: ['/javascript', 'coding', 'js-throttle'],
    cta: 'Practice throttle',
  },
  {
    category: 'coding',
    level: 'intermediate',
    q: 'What is the difference between shallow and deep cloning?',
    a: 'A shallow clone copies only the top-level object or array and reuses nested object references. A deep clone recursively creates new nested objects and arrays so changes in the copy do not affect the original. Deep cloning is harder because real values can include cycles, Dates, Maps, Sets, class instances, functions, and prototypes.',
    route: ['/javascript', 'trivia', 'js-shallow-vs-deep-copy'],
    cta: 'Compare clone depth',
  },
  {
    category: 'coding',
    level: 'beginner',
    q: 'Why does Array.sort() sometimes sort numbers incorrectly?',
    a: 'Array.sort() sorts values as strings by default, not as numbers. That means [2, 10] can become [10, 2] because "10" comes before "2" lexicographically. Use a numeric comparator such as (a, b) => a - b, and copy the array first if the original order must be preserved.',
    route: ['/javascript', 'coding', 'js-array-sort'],
    cta: 'Practice numeric sort',
  },
  {
    category: 'coding',
    level: 'intermediate',
    q: 'Why is immutability important in JavaScript interviews?',
    a: 'Immutability means representing a change by creating a new value instead of modifying the existing one. It prevents accidental updates through shared references, which is especially important for nested objects and arrays. It also makes UI rendering, reducer logic, memoization, undo history, and debugging easier because each state transition has a clear before and after.',
    route: ['/javascript', 'trivia', 'js-mutability-vs-immutability'],
    cta: 'Review immutability',
  },
  {
    category: 'browser-security',
    level: 'advanced',
    q: 'How do you prevent XSS in JavaScript?',
    a: 'Prevent XSS by treating user-controlled strings as unsafe until they are encoded, validated, or sanitized for the exact context where they are used. Prefer safe DOM APIs such as textContent for text, validate URLs before assigning href, and avoid dangerous sinks such as innerHTML for untrusted input. If trusted HTML rendering is required, use a proven sanitizer and add defenses such as Content Security Policy and Trusted Types.',
    route: ['/javascript', 'trivia', 'js-xss-dom-sinks'],
    cta: 'Review DOM XSS prevention',
  },
  {
    category: 'fundamentals',
    level: 'intermediate',
    q: 'What is prototypal inheritance in JavaScript?',
    a: 'Prototypal inheritance means objects can delegate property lookups to another object through their prototype chain. If a property is not found on the object itself, JavaScript checks its prototype, then the next prototype, until it reaches null. Constructor functions and classes both use this prototype mechanism under the hood.',
    route: ['/javascript', 'trivia', 'js-prototypal-inheritance'],
    cta: 'Review prototypes',
  },
  {
    category: 'fundamentals',
    level: 'intermediate',
    q: 'What is type coercion in JavaScript?',
    a: 'Type coercion is JavaScript converting a value from one type to another during an operation. It happens with loose equality, arithmetic, string concatenation, Boolean contexts, and many built-in APIs. Coercion can be useful, but explicit conversion with Number, String, or Boolean is clearer when behavior matters.',
    route: ['/javascript', 'trivia', 'js-type-coercion'],
    cta: 'Review type coercion',
  },
];

const JAVASCRIPT_ANCHOR_ITEMS: JavaScriptAnchorItem[] = [
  { label: 'Short answers', targetId: 'iq-javascript-short-answers-title' },
  { label: 'Code output', targetId: 'iq-javascript-output-title' },
  { label: 'Browser + DOM', targetId: 'iq-javascript-browser-title' },
  { label: 'Coding prompts', targetId: 'iq-javascript-coding-preview-title' },
  { label: 'Concept prompts', targetId: 'iq-javascript-concept-preview-title' },
  { label: 'Topic map', targetId: 'iq-javascript-coverage-title' },
];

const JAVASCRIPT_EDITORIAL_SIGNAL: JavaScriptEditorialSignal = {
  reviewedLabel: 'Reviewed May 19, 2026',
  reviewer: 'FrontendAtlas Editor',
  coverage: '25 answers, 8 output questions, and 8 browser/DOM/security questions',
  dateModified: '2026-05-19T00:00:00.000Z',
};

const JAVASCRIPT_OUTPUT_QUESTIONS: JavaScriptOutputQuestionItem[] = [
  {
    level: 'beginner',
    q: 'What does typeof null return?',
    code: `console.log(typeof null);`,
    output: `"object"`,
    explanation: 'typeof null returns "object" because of a long-standing JavaScript legacy bug. The value is still the primitive null, so check null directly with value === null.',
  },
  {
    level: 'beginner',
    q: 'What is the output of loose equality compared with strict equality?',
    code: `console.log(false == 0);
console.log(false === 0);
console.log("" == 0);`,
    output: `true
false
true`,
    explanation: 'Loose equality converts types before comparison, while strict equality does not. This is why strict equality is the default choice when the original value type matters.',
    route: ['/javascript', 'trivia', 'js-equality-vs-strict-equality'],
    cta: 'Review equality rules',
  },
  {
    level: 'beginner',
    q: 'What is the output of Array.sort() without a comparator?',
    code: `console.log([2, 10, 1].sort());`,
    output: `[1, 10, 2]`,
    explanation: 'sort() converts values to strings by default and compares them lexicographically. Use (a, b) => a - b for numeric sorting and copy first when mutation is not allowed.',
    route: ['/javascript', 'coding', 'js-array-sort'],
    cta: 'Practice numeric sort',
  },
  {
    level: 'intermediate',
    q: 'What does this var loop log?',
    code: `for (var i = 0; i < 3; i += 1) {
  setTimeout(() => console.log(i), 0);
}`,
    output: `3
3
3`,
    explanation: 'var creates one function-scoped binding shared by every callback. By the time the timers run, the loop has finished and that shared i is 3.',
    route: ['/javascript', 'trivia', 'js-var-let-const-hoisting'],
    cta: 'Review var and let',
  },
  {
    level: 'beginner',
    q: 'What happens when two variables reference the same object?',
    code: `const a = { user: { name: "Ada" } };
const b = a;
b.user.name = "Lin";
console.log(a.user.name);`,
    output: `"Lin"`,
    explanation: 'Objects are assigned by reference, so a and b point at the same object. Mutating nested data through b is visible through a.',
    route: ['/javascript', 'trivia', 'js-mutability-vs-immutability'],
    cta: 'Review mutation',
  },
  {
    level: 'beginner',
    q: 'Why do string plus and minus behave differently?',
    code: `console.log("5" + 1);
console.log("5" - 1);`,
    output: `"51"
4`,
    explanation: 'The + operator performs string concatenation when one side is a string. The - operator only has numeric meaning, so JavaScript coerces "5" to 5.',
    route: ['/javascript', 'trivia', 'js-type-coercion'],
    cta: 'Review coercion',
  },
  {
    level: 'intermediate',
    q: 'What is the event loop output order?',
    code: `console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));
console.log("D");`,
    output: `A
D
C
B`,
    explanation: 'Synchronous code runs first, then the microtask from Promise.then, then the timer task. This order is the key event-loop rule behind many async output questions.',
    route: ['/javascript', 'trivia', 'js-event-loop'],
    cta: 'Review event loop',
  },
  {
    level: 'intermediate',
    q: 'What happens when a method loses its receiver?',
    code: `"use strict";
const user = {
  name: "Ada",
  getName() {
    return this.name;
  },
};
const fn = user.getName;
console.log(fn());`,
    output: `TypeError`,
    explanation: 'Calling fn() without user as the receiver makes this undefined in strict mode. Keep the receiver with user.getName(), bind the method, or wrap the call in another function.',
    route: ['/javascript', 'debug', 'js-debug-lost-this-binding'],
    cta: 'Debug lost this',
  },
];

const JAVASCRIPT_BROWSER_QUESTIONS: JavaScriptBrowserQuestionItem[] = [
  {
    level: 'intermediate',
    q: 'What is event delegation?',
    a: 'Event delegation attaches one listener to a common parent and handles events from matching child elements. It works because many DOM events bubble upward. It reduces listener count for dynamic lists, but the handler still needs a reliable target check such as closest().',
    route: ['/javascript', 'trivia', 'js-event-delegation'],
    cta: 'Review event delegation',
  },
  {
    level: 'intermediate',
    q: 'What is the difference between event bubbling and capturing?',
    a: 'Capturing runs listeners from the document down toward the target before the target phase. Bubbling runs listeners from the target back up toward the document. Most app code relies on bubbling, while capture is useful when a parent must observe an event before child handlers run.',
    route: ['/javascript', 'trivia', 'js-event-bubbling-capturing'],
    cta: 'Compare event phases',
  },
  {
    level: 'beginner',
    q: 'What is the difference between preventDefault() and stopPropagation()?',
    a: 'preventDefault() cancels the browser default action, such as navigating a link or submitting a form. stopPropagation() stops the event from continuing through the capture or bubble path. They solve different problems, so using one does not imply the other.',
  },
  {
    level: 'beginner',
    q: 'What is the difference between innerHTML and textContent?',
    a: 'textContent writes text and treats characters such as < and > as text. innerHTML parses a string as HTML and can execute dangerous markup paths if the content is not trusted. Use textContent for user-controlled strings and only render sanitized HTML when markup is required.',
    route: ['/javascript', 'trivia', 'js-xss-dom-sinks'],
    cta: 'Review safe DOM sinks',
  },
  {
    level: 'beginner',
    q: 'What is the difference between cookies, localStorage, and sessionStorage?',
    a: 'Cookies can be sent with HTTP requests and can use security flags such as HttpOnly, Secure, and SameSite. localStorage persists until cleared, while sessionStorage lasts for the current tab session. Storage APIs are convenient for non-sensitive client state, but they are readable by JavaScript.',
    route: ['/javascript', 'trivia', 'js-cookie-sessionstorage-localstorage'],
    cta: 'Compare browser storage',
  },
  {
    level: 'advanced',
    q: 'How do you safely use user input in DOM URLs or HTML?',
    a: 'Treat user input as unsafe until it is encoded, validated, or sanitized for the exact context. For links, allow only safe schemes such as http, https, mailto, tel, or safe relative URLs. For HTML, use a reviewed sanitizer and avoid assigning untrusted strings to dangerous sinks.',
    route: ['/javascript', 'trivia', 'js-xss-dom-sinks'],
    cta: 'Review DOM XSS prevention',
  },
  {
    level: 'intermediate',
    q: 'How do you search or traverse DOM nodes safely?',
    a: 'Use focused DOM APIs such as querySelector, querySelectorAll, closest, matches, and tree traversal instead of assuming a fixed child index. Code should handle missing nodes with null checks. Traversal logic also needs to preserve document order when the result order matters.',
    route: ['/javascript', 'coding', 'js-dom-find-node'],
    cta: 'Practice DOM search',
  },
  {
    level: 'advanced',
    q: 'What causes browser memory leaks in JavaScript?',
    a: 'Leaks often come from event listeners, timers, subscriptions, detached DOM references, and unbounded Maps or caches that keep objects reachable. Cleanup should remove listeners, clear timers, abort stale work, and bound long-lived storage. DevTools memory snapshots help confirm whether objects are still retained after a user flow ends.',
    route: ['/javascript', 'coding', 'js-storage-ttl-cache'],
    cta: 'Practice bounded storage',
  },
];

const ANGULAR_SHORT_ANSWERS: AngularShortAnswerItem[] = [
  {
    category: 'fundamentals',
    level: 'beginner',
    q: 'What is Angular?',
    a: 'Angular is a TypeScript framework for building component-based web applications. It includes routing, forms, dependency injection, templates, HTTP utilities, and a CLI-driven build workflow. The key difference from a small view library is that Angular gives the application structure and many production conventions up front.',
  },
  {
    category: 'fundamentals',
    level: 'beginner',
    q: 'What is the difference between Angular and AngularJS?',
    a: 'AngularJS is the original 1.x framework based on JavaScript, scopes, controllers, and digest-cycle patterns. Angular is the modern TypeScript framework built around components, decorators, dependency injection, RxJS, and a different rendering and tooling model. They are different platforms, so migrating from AngularJS to Angular is usually a rewrite or staged migration, not a simple version bump.',
    route: ['/angular', 'trivia', 'angular-vs-angularjs'],
    cta: 'Compare Angular and AngularJS',
  },
  {
    category: 'components',
    level: 'beginner',
    q: 'What are components in Angular?',
    a: 'Components are the main building blocks of Angular UI. A component combines a TypeScript class, a template, styles, metadata, inputs, outputs, and lifecycle hooks. Components should own view behavior, while shared business logic usually belongs in services or facades.',
    route: ['/angular', 'trivia', 'angular-component-vs-service-responsibilities'],
    cta: 'Review component responsibilities',
  },
  {
    category: 'components',
    level: 'beginner',
    q: 'What is metadata in an Angular component?',
    a: 'Component metadata is the configuration passed to the @Component decorator. It tells Angular the selector, template, styles, imports, providers, change detection mode, and other compile-time/runtime details. Metadata mistakes can cause missing directives, wrong provider scope, or templates that compile but behave differently than expected.',
    route: ['/angular', 'trivia', 'angular-component-metadata'],
    cta: 'Review component metadata',
  },
  {
    category: 'components',
    level: 'beginner',
    q: 'What are directives in Angular?',
    a: 'Directives attach behavior to templates. Components are directives with templates, attribute directives change behavior or styling on an existing element, and structural directives change the rendered tree. The practical detail is that structural directives can create and destroy embedded views, so state and cleanup behavior can change.',
    route: ['/angular', 'trivia', 'angular-directives'],
    cta: 'Review Angular directives',
  },
  {
    category: 'components',
    level: 'beginner',
    q: 'What is the difference between structural and attribute directives?',
    a: 'Structural directives change whether a block exists in the view tree, usually by creating or destroying embedded views. Attribute directives keep the host element in place and change behavior, classes, styles, or properties. This matters because structural directives can reset component state and trigger teardown, while attribute directives normally do not.',
    route: ['/angular', 'trivia', 'angular-structural-vs-attribute-directives'],
    cta: 'Compare directive types',
  },
  {
    category: 'components',
    level: 'beginner',
    q: 'What are pipes in Angular?',
    a: 'Pipes transform values for display in a template. Built-in pipes handle common formatting such as dates, numbers, and currency, while custom pipes keep presentation transforms reusable. Expensive or impure pipes can run often, so heavy work should be cached, moved to state, or handled before rendering.',
    route: ['/angular', 'trivia', 'angular-pipes'],
    cta: 'Review Angular pipes',
  },
  {
    category: 'components',
    level: 'beginner',
    q: 'What is data binding in Angular?',
    a: 'Data binding connects component state and template behavior. Interpolation and property binding move data from the component to the view, event binding moves user actions back to the component, and two-way binding combines both directions. Binding bugs often come from targeting the wrong DOM property, mutating state in place, or hiding ownership with two-way syntax.',
    route: ['/angular', 'trivia', 'angular-data-binding'],
    cta: 'Review Angular data binding',
  },
  {
    category: 'components',
    level: 'beginner',
    q: 'What is the difference between interpolation and property binding?',
    a: 'Interpolation writes a string expression into text content or an attribute-like position. Property binding sets a DOM or directive property with the actual value type, such as a boolean, object, or array. Use property binding when type matters, because interpolation always passes through string rendering.',
    route: ['/angular', 'trivia', 'angular-interpolation-vs-property-binding'],
    cta: 'Compare binding syntax',
  },
  {
    category: 'components',
    level: 'beginner',
    q: 'What are @Input() and @Output()?',
    a: '@Input() lets a parent pass data into a child component. @Output() exposes events from the child back to the parent, usually with EventEmitter or newer output APIs. The contract should stay one-way: inputs describe state, outputs describe user or child events, and the parent owns the resulting state change.',
    route: ['/angular', 'trivia', 'angular-input-output'],
    cta: 'Review input and output',
  },
  {
    category: 'components',
    level: 'intermediate',
    q: 'What is the difference between constructor and ngOnInit()?',
    a: 'The constructor is for TypeScript class creation and dependency injection. ngOnInit() runs after Angular has initialized inputs, so it is the safer place for initialization that depends on bound data. DOM-dependent work still belongs later, such as ngAfterViewInit, because the view is not fully ready in ngOnInit().',
    route: ['/angular', 'trivia', 'angular-ngoninit-vs-constructor'],
    cta: 'Compare constructor and ngOnInit',
  },
  {
    category: 'components',
    level: 'intermediate',
    q: 'What are Angular lifecycle hooks?',
    a: 'Lifecycle hooks let a component respond to creation, input changes, content/view initialization, checks, and destruction. Common hooks include ngOnInit, ngOnChanges, ngAfterViewInit, and ngOnDestroy. The important part is timing: subscriptions, DOM reads, cleanup, and input-dependent setup belong in different hooks.',
    route: ['/angular', 'trivia', 'angular-lifecycle-hooks'],
    cta: 'Review lifecycle hooks',
  },
  {
    category: 'di-change-detection',
    level: 'intermediate',
    q: 'What is dependency injection in Angular?',
    a: 'Dependency injection is the Angular system for creating and supplying services, tokens, and other dependencies. Providers decide what value is created and injector scope decides who shares it. A correct answer names where the provider lives, when the instance is created, and which components or routes share it.',
    route: ['/angular', 'trivia', 'angular-dependency-injection'],
    cta: 'Review dependency injection',
  },
  {
    category: 'di-change-detection',
    level: 'intermediate',
    q: 'What are services in Angular?',
    a: 'Services hold reusable logic that should not belong to a single template. They commonly manage API calls, feature state, mapping, permissions, logging, or coordination between components. The main trade-off is scope: a root service is shared broadly, while route or component providers create narrower instances.',
    route: ['/angular', 'trivia', 'angular-services'],
    cta: 'Review Angular services',
  },
  {
    category: 'di-change-detection',
    level: 'advanced',
    q: 'What is hierarchical dependency injection?',
    a: 'Hierarchical dependency injection means Angular resolves providers through an injector tree. A child injector can reuse a parent provider or override it with a more local instance. This is powerful for feature boundaries, but accidental local providers can create duplicate service state.',
    route: ['/angular', 'trivia', 'angular-hierarchical-dependency-injection-real-bug'],
    cta: 'Debug provider scope',
  },
  {
    category: 'di-change-detection',
    level: 'intermediate',
    q: 'What is change detection in Angular?',
    a: 'Change detection is how Angular checks application state and updates templates. Zone-based apps usually schedule checks from async activity, events, and framework hooks, while newer patterns can make update triggers more explicit. When debugging stale UI, first identify the trigger path before reaching for detectChanges or markForCheck.',
    route: ['/angular', 'trivia', 'angular-change-detection-strategies'],
    cta: 'Review change detection',
  },
  {
    category: 'di-change-detection',
    level: 'advanced',
    q: 'What is OnPush change detection?',
    a: 'OnPush tells Angular to check a component when inputs change by reference, events run, observables update through async pipe, signals update, or change detection is explicitly requested. It improves render predictability but exposes mutation bugs quickly. If the object reference stays the same after a nested mutation, an OnPush child may not update.',
    route: ['/angular', 'trivia', 'angular-onpush-change-detection-debugging-real-bug'],
    cta: 'Debug OnPush stale UI',
  },
  {
    category: 'di-change-detection',
    level: 'advanced',
    q: 'What is Zone.js used for in Angular?',
    a: 'Zone.js patches async APIs so Angular can know when tasks finish and schedule change detection in zone-based applications. It makes many UI updates feel automatic after timers, promises, and DOM events. In zoneless setups, updates need explicit notification paths such as signals, async pipe, or manual change detection APIs.',
    route: ['/angular', 'trivia', 'angular-zonejs-change-detection'],
    cta: 'Review Zone.js and change detection',
  },
  {
    category: 'rxjs-forms',
    level: 'intermediate',
    q: 'What are Observables and RxJS in Angular?',
    a: 'Observables represent streams of values over time, and RxJS provides operators for transforming, combining, canceling, and sharing those streams. Angular uses Observables in HttpClient, forms, router events, and many async workflows. The practical skill is choosing operators that match user intent, such as switchMap for latest-only search.',
    route: ['/angular', 'trivia', 'angular-observables-rxjs'],
    cta: 'Review Observables and RxJS',
  },
  {
    category: 'rxjs-forms',
    level: 'advanced',
    q: 'How does HttpClient request cancellation work?',
    a: 'HttpClient requests are canceled when the subscription to the request Observable is unsubscribed. switchMap cancels the previous inner request when a new value arrives, and async pipe or takeUntilDestroyed can cancel work during teardown. Ignoring an old response is not the same as aborting the underlying request.',
    route: ['/angular', 'trivia', 'angular-http-what-actually-cancels-request'],
    cta: 'Review HttpClient cancellation',
  },
  {
    category: 'rxjs-forms',
    level: 'intermediate',
    q: 'What is the difference between template-driven and reactive forms?',
    a: 'Template-driven forms keep more form behavior in the template and are fine for simple workflows. Reactive forms model controls in TypeScript, which makes dynamic fields, validation, async flows, and tests easier to control. For complex forms, reactive forms are usually the safer default because the state graph is explicit.',
    route: ['/angular', 'trivia', 'angular-template-driven-vs-reactive-forms-which-scales'],
    cta: 'Compare form strategies',
  },
  {
    category: 'modern',
    level: 'intermediate',
    q: 'What is lazy loading in Angular?',
    a: 'Lazy loading delays loading a route or feature until it is needed. It reduces initial bundle cost and creates clearer feature boundaries. The trade-off is that provider scope, preloading strategy, and route-level data loading must be planned so navigation stays predictable.',
    route: ['/angular', 'trivia', 'angular-lazy-loading'],
    cta: 'Review lazy loading',
  },
  {
    category: 'modern',
    level: 'intermediate',
    q: 'What are standalone components?',
    a: 'Standalone components can declare their own imports and participate in routing without being declared in an NgModule. They simplify new Angular apps and feature composition. NgModules still appear in older codebases and some library boundaries, so migration answers should cover compatibility and provider scope.',
    route: ['/angular', 'trivia', 'angular-ngmodules-vs-standalone'],
    cta: 'Compare standalone and NgModules',
  },
  {
    category: 'modern',
    level: 'advanced',
    q: 'What is NgRx and when should you use it?',
    a: 'NgRx is a Redux-style state management library for Angular. It is useful when shared state has complex transitions, multiple writers, effects, optimistic updates, or audit/debugging needs. For local UI state or small feature state, component state, services, signals, or RxJS may be simpler.',
    route: ['/angular', 'trivia', 'ngrx-store-vs-component-state-angular-when-to-use'],
    cta: 'Choose NgRx vs local state',
  },
  {
    category: 'rxjs-forms',
    level: 'advanced',
    q: 'How do you prevent memory leaks in Angular?',
    a: 'Prefer async pipe when templates consume streams because Angular handles subscription cleanup. For manual subscriptions, use takeUntilDestroyed, takeUntil with a destroy subject, or explicit unsubscribe when needed. Also clean up timers, global listeners, WebSocket streams, and resolver streams that might never complete.',
    route: ['/angular', 'trivia', 'angular-prevent-memory-leaks-unsubscribe-patterns'],
    cta: 'Review memory leak prevention',
  },
];

const ANGULAR_ANCHOR_ITEMS: AngularAnchorItem[] = [
  { label: 'Short answers', targetId: 'iq-angular-short-answers-title' },
  { label: 'Beginner/experienced', targetId: 'iq-angular-audience-title' },
  { label: 'Testing', targetId: 'iq-angular-testing-title' },
  { label: 'Security', targetId: 'iq-angular-security-title' },
  { label: 'Routing + perf', targetId: 'iq-angular-classic-title' },
  { label: 'Scenarios + code', targetId: 'iq-angular-scenarios-title' },
  { label: 'Modern Angular', targetId: 'iq-angular-modern-title' },
  { label: 'Coding prompts', targetId: 'iq-angular-coding-preview-title' },
  { label: 'Concept prompts', targetId: 'iq-angular-concept-preview-title' },
  { label: 'Topic map', targetId: 'iq-angular-coverage-title' },
];

const ANGULAR_EDITORIAL_SIGNAL: AngularEditorialSignal = {
  reviewedLabel: 'Reviewed May 20, 2026',
  reviewer: 'FrontendAtlas Editor',
  coverage: '65 visible Angular questions across answers, scenarios, modern Angular, testing, security, routing, and performance',
  dateModified: '2026-05-20T00:00:00.000Z',
};

const ANGULAR_KEYWORD_CLUSTERS: AngularKeywordClusterItem[] = [
  {
    label: 'Beginner',
    targetId: 'iq-angular-short-answers-title',
    detail: 'Angular basics, components, directives, pipes, binding, inputs, outputs, services, and lifecycle timing.',
  },
  {
    label: 'Experienced',
    targetId: 'iq-angular-audience-title',
    detail: 'Senior Angular questions around production boundaries, RxJS, change detection, testing strategy, and migration risk.',
  },
  {
    label: 'Testing',
    targetId: 'iq-angular-testing-title',
    detail: 'TestBed, fakeAsync, tick, HttpTestingController, harnesses, guards, resolvers, and Observable UI tests.',
  },
  {
    label: 'Security',
    targetId: 'iq-angular-security-title',
    detail: 'XSS prevention, sanitization, DomSanitizer, trusted HTML, user-controlled URLs, CSP, and direct DOM risks.',
  },
  {
    label: 'Modern Angular',
    targetId: 'iq-angular-modern-title',
    detail: 'Standalone components, signals, route providers, control flow, deferrable views, zoneless change detection, SSR, and hydration.',
  },
  {
    label: 'Routing/Performance',
    targetId: 'iq-angular-classic-title',
    detail: 'Guards, resolvers, AOT/JIT, template compilation, lazy loading, preloading, profiling, and standalone migration.',
  },
];

const ANGULAR_AUDIENCE_TRACKS: AngularAudienceTrack[] = [
  {
    title: 'For beginners',
    detail: 'Start with Angular, components, templates, directives, pipes, binding, inputs, outputs, services, and lifecycle timing. These questions build the vocabulary needed before RxJS, routing, testing, and performance trade-offs become useful.',
  },
  {
    title: 'For experienced developers',
    detail: 'Focus on change detection, provider scope, HttpClient cancellation, route boundaries, testing strategy, sanitization, standalone migration, and profiling. These topics expose whether an Angular answer can survive production edge cases.',
  },
];

const ANGULAR_TESTING_QUESTIONS: AngularFocusedQuestionItem[] = [
  {
    level: 'intermediate',
    q: 'When should you use TestBed instead of a plain unit test?',
    a: 'Use plain unit tests for pure functions, validators, mapping logic, and services that do not need Angular runtime behavior. Use TestBed when the code depends on templates, dependency injection, lifecycle hooks, pipes, directives, or Angular change detection. TestBed has more setup cost, so the boundary should match the behavior you need to prove.',
    route: ['/guides', 'framework-prep', 'angular-prep-path'],
    cta: 'Open the Angular testing prep path',
  },
  {
    level: 'intermediate',
    q: 'How do you test Angular component inputs and outputs?',
    a: 'Set inputs through the host or fixture API, run change detection, and assert the rendered behavior instead of private fields. For outputs, trigger the user action or child method that emits and assert the parent-facing event. Useful component tests cover changed inputs, missing optional inputs, disabled states, and emitted payload shape.',
    route: ['/angular', 'trivia', 'angular-input-output'],
    cta: 'Review input and output',
  },
  {
    level: 'advanced',
    q: 'What do fakeAsync() and tick() do in Angular tests?',
    a: 'fakeAsync runs a test inside a controlled async zone so timers and microtasks can be advanced deterministically. tick() moves virtual time forward and flushes timer work scheduled for that window. It is useful for debounce, delay, timeout, and lifecycle timing, but it should not hide unclear async ownership.',
    route: ['/guides', 'framework-prep', 'angular-prep-path'],
    cta: 'Review async testing strategy',
  },
  {
    level: 'advanced',
    q: 'How does HttpTestingController test HttpClient code?',
    a: 'HttpTestingController lets a test expect a request, assert its method, URL, params, and body, then flush a success or error response. It proves the service sends the right HTTP contract without making a network call. A reliable test also verifies no unexpected requests remain after the scenario.',
    route: ['/angular', 'trivia', 'angular-http-what-actually-cancels-request'],
    cta: 'Review HttpClient behavior',
  },
  {
    level: 'advanced',
    q: 'What are Angular component harnesses?',
    a: 'Component harnesses provide a stable testing API for interacting with components through user-facing behavior. They reduce brittle selectors and hide markup details that should not matter to the test. Harnesses are most valuable for shared UI components where many tests need the same reliable interactions.',
    route: ['/guides', 'framework-prep', 'angular-prep-path'],
    cta: 'Open the Angular prep path',
  },
  {
    level: 'advanced',
    q: 'How do you test Angular guards and resolvers?',
    a: 'Test guards by controlling route state, auth or permission services, and the expected allow, redirect, or block result. Test resolvers by asserting the data request and by checking completion behavior, because navigation can wait for a resolver. Router-focused tests should separate access control from data prefetch behavior.',
    route: ['/angular', 'trivia', 'angular-routing'],
    cta: 'Review Angular routing',
  },
  {
    level: 'intermediate',
    q: 'How do you test Observable UI rendered with async pipe?',
    a: 'Push values through a controllable Observable or subject, run change detection, and assert the text, loading state, or error state visible to the user. The async pipe owns subscription cleanup, so the test should focus on rendering transitions instead of manual unsubscribe calls. Include empty, loading, next value, and failure paths when the UI depends on them.',
    route: ['/angular', 'trivia', 'angular-observables-rxjs'],
    cta: 'Review Angular Observables',
  },
  {
    level: 'intermediate',
    q: 'What makes Angular tests brittle?',
    a: 'Tests become brittle when they assert private methods, framework internals, or exact DOM structure that users cannot observe. They also become flaky when async work is not owned clearly, such as unflushed HTTP requests or timers. Prefer behavior assertions, stable selectors or harnesses, explicit async control, and tests at the smallest boundary that proves the risk.',
    route: ['/guides', 'framework-prep', 'angular-prep-path'],
    cta: 'Review Angular testing mistakes',
  },
];

const ANGULAR_SECURITY_QUESTIONS: AngularFocusedQuestionItem[] = [
  {
    level: 'intermediate',
    q: 'How does Angular protect templates from XSS?',
    a: 'Angular treats template expressions as data binding, not executable template strings created at runtime. It escapes interpolated text and sanitizes values for risky contexts such as HTML and URLs. The protection is strongest when data stays in Angular templates instead of being written through direct DOM APIs.',
    route: ['/angular', 'trivia', 'angular-data-binding'],
    cta: 'Review Angular data binding',
  },
  {
    level: 'intermediate',
    q: 'What is the security difference between interpolation and [innerHTML]?',
    a: 'Interpolation renders text, so HTML markup from a user is displayed as text instead of becoming elements. [innerHTML] asks Angular to render HTML and relies on sanitization to remove unsafe content. Use interpolation or text content for ordinary user input, and treat rich HTML as a special case with strict source and sanitization rules.',
    route: ['/angular', 'trivia', 'angular-interpolation-vs-property-binding'],
    cta: 'Compare binding syntax',
  },
  {
    level: 'advanced',
    q: 'What is DomSanitizer used for?',
    a: 'DomSanitizer is an Angular API for sanitizing values or explicitly marking a value trusted for a specific security context. It is needed only when ordinary binding and built-in sanitization are not enough for a controlled use case. The dangerous part is that trust decisions move responsibility from Angular to application code.',
    route: ['/guides', 'framework-prep', 'angular-prep-path'],
    cta: 'Review Angular security topics',
  },
  {
    level: 'advanced',
    q: 'Why is bypassSecurityTrustHtml dangerous?',
    a: 'bypassSecurityTrustHtml tells Angular to skip normal sanitization for that value. If the value contains user-controlled markup, the app can reintroduce XSS even though Angular templates are normally safe. Only use bypass APIs for tightly controlled, audited content and keep the trusted boundary small.',
    route: ['/guides', 'framework-prep', 'angular-prep-path'],
    cta: 'Review Angular security topics',
  },
  {
    level: 'advanced',
    q: 'How should Angular handle user-controlled URLs?',
    a: 'Bind URLs through Angular properties when possible so framework sanitization can run for the target context. Validate allowed schemes and destinations before using user-controlled links, redirects, images, or resource URLs. Special contexts such as iframe sources and script-like URLs need stricter allowlists, not string concatenation.',
    route: ['/angular', 'trivia', 'angular-data-binding'],
    cta: 'Review safe binding',
  },
  {
    level: 'advanced',
    q: 'How do you render CMS or rich text safely in Angular?',
    a: 'Treat CMS HTML as untrusted unless it comes from a trusted pipeline with server-side sanitization and a narrow allowlist. Client-side rendering should still avoid scripts, event-handler attributes, unsafe URLs, and unknown embeds. The safer architecture sanitizes before storage or delivery, then renders through a small component with clear ownership.',
    route: ['/guides', 'framework-prep', 'angular-prep-path'],
    cta: 'Review Angular security topics',
  },
  {
    level: 'intermediate',
    q: 'How do CSP and backend validation support Angular security?',
    a: 'Content Security Policy reduces the damage of injected scripts by limiting what the browser can execute or load. Backend validation and output encoding protect data before it reaches the Angular app and protect non-Angular consumers too. Angular template safety is one layer, not a replacement for server-side validation and browser policy.',
    route: ['/guides', 'framework-prep', 'angular-prep-path'],
    cta: 'Review Angular prep path',
  },
  {
    level: 'advanced',
    q: 'Why can direct DOM access create Angular security bugs?',
    a: 'Direct DOM writes can bypass Angular binding, sanitization, and change detection assumptions. APIs such as nativeElement.innerHTML or third-party widgets need careful review because they may insert unsanitized markup. Prefer Angular templates, Renderer2 for DOM operations, and explicit sanitization boundaries for unavoidable integrations.',
    route: ['/angular', 'trivia', 'angular-data-binding'],
    cta: 'Review Angular binding safety',
  },
];

const ANGULAR_CLASSIC_QUESTIONS: AngularFocusedQuestionItem[] = [
  {
    level: 'intermediate',
    q: 'What is the difference between guards and resolvers?',
    a: 'Guards decide whether navigation may proceed, redirect, or stop. Resolvers fetch data before route activation so the destination can start with required data available. Access control belongs in guards, while data prefetch belongs in resolvers or component loading depending on the user experience.',
    route: ['/angular', 'trivia', 'angular-routing'],
    cta: 'Review Angular routing',
  },
  {
    level: 'advanced',
    q: 'What is the difference between CanMatch and CanActivate?',
    a: 'CanMatch runs while the router is deciding whether a route can match at all. CanActivate runs after a route has matched and before it activates. CanMatch is useful for feature flags, role-based route trees, and lazy route selection, while CanActivate fits ordinary activation checks.',
    route: ['/angular', 'trivia', 'angular-routing'],
    cta: 'Review guard behavior',
  },
  {
    level: 'advanced',
    q: 'What happens if a resolver Observable never completes?',
    a: 'A resolver that never completes can keep navigation waiting indefinitely. HTTP Observables usually complete, but streams such as subjects, router events, or store selectors may not complete on their own. Use finite streams, take(1), or move non-blocking data to in-component loading when waiting would harm navigation.',
    route: ['/angular', 'trivia', 'angular-routing'],
    cta: 'Review resolver timing',
  },
  {
    level: 'intermediate',
    q: 'What is the difference between AOT and JIT in Angular?',
    a: 'AOT compiles Angular templates during the build, while JIT compiles them at runtime. AOT improves startup, catches more template issues earlier, and is the normal production choice. JIT can be useful in development-style workflows, but it adds runtime compilation cost.',
    route: ['/angular', 'trivia', 'angular-template-compilation-and-binding'],
    cta: 'Review template compilation',
  },
  {
    level: 'advanced',
    q: 'How does Angular template compilation help catch bugs?',
    a: 'Angular compiles templates into instructions and can type-check bindings before production runtime. That catches mistakes such as misspelled properties, incompatible input types, and invalid template expressions earlier. Runtime stale UI problems still require change detection and state ownership debugging.',
    route: ['/angular', 'trivia', 'angular-template-compilation-and-binding'],
    cta: 'Review compiler behavior',
  },
  {
    level: 'advanced',
    q: 'How should you approach Angular performance profiling?',
    a: 'Start by measuring the slow route, interaction, or render path before applying a checklist. Common bottlenecks include heavy template work, unstable list identity, excessive change detection, oversized route chunks, and repeated HTTP or derived-state work. The fix should match the measured bottleneck, such as trackBy, OnPush, lazy loading, memoized state, or moving work out of the template.',
    route: ['/angular', 'trivia', 'angular-performance-optimization'],
    cta: 'Review Angular performance',
  },
  {
    level: 'advanced',
    q: 'What can go wrong during NgModule to standalone migration?',
    a: 'Declarations move out of NgModules, but provider scope must be handled separately. A migration can accidentally duplicate services, drop shared imports, or move providers to a broader or narrower lifetime than intended. Validate route boundaries, lazy loading, and shared UI imports as separate migration checks.',
    route: ['/angular', 'trivia', 'angular-appmodule-standalone-changes'],
    cta: 'Review standalone migration',
  },
  {
    level: 'intermediate',
    q: 'What is the difference between lazy loading and preloading?',
    a: 'Lazy loading delays fetching a route or feature until it is needed. Preloading fetches lazy code in the background after initial load so future navigation can feel faster. The trade-off is startup cost, network timing, and whether a feature is likely enough to justify early background loading.',
    route: ['/angular', 'trivia', 'angular-lazy-loading'],
    cta: 'Review lazy loading',
  },
];

const ANGULAR_SCENARIO_QUESTIONS: AngularScenarioQuestionItem[] = [
  {
    level: 'advanced',
    q: 'Why does this OnPush child stay stale after a nested mutation?',
    code: `@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '{{ user.name }}'
})
export class UserCard {
  @Input() user!: User;
}

this.user.name = 'Ada';`,
    explanation: 'OnPush checks input references, not every nested field mutation. If the parent mutates user.name while keeping the same object reference, the child can stay stale. Create a new object, emit new state, or use an explicit observable/signal update path.',
    route: ['/angular', 'trivia', 'angular-onpush-change-detection-debugging-real-bug'],
    cta: 'Debug OnPush stale UI',
  },
  {
    level: 'advanced',
    q: 'Why is switchMap safer than mergeMap for typeahead search?',
    code: `results$ = search.valueChanges.pipe(
  debounceTime(250),
  switchMap(query => http.get('/api/search', { params: { query } }))
);`,
    explanation: 'switchMap unsubscribes from the previous inner request when a new query arrives. With HttpClient, that unsubscribe can abort the old request and prevents stale responses from winning. mergeMap allows parallel requests, which is correct for some workflows but risky for latest-only UI.',
    route: ['/angular', 'trivia', 'rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use'],
    cta: 'Choose the right RxJS operator',
  },
  {
    level: 'intermediate',
    q: 'What is wrong with a manual subscription that never tears down?',
    code: `ngOnInit() {
  this.form.valueChanges.subscribe(value => {
    this.saveDraft(value);
  });
}`,
    explanation: 'valueChanges is long-lived and can keep emitting after the component should be gone. Use async pipe where possible, or bind manual subscriptions to the component lifetime with takeUntilDestroyed or another teardown pattern. HttpClient one-shot streams are different because they usually complete.',
    route: ['/angular', 'trivia', 'angular-prevent-memory-leaks-unsubscribe-patterns'],
    cta: 'Review teardown patterns',
  },
  {
    level: 'advanced',
    q: 'How can provider scope create duplicate service instances?',
    code: `@Component({
  selector: 'app-cart-panel',
  providers: [CartService]
})
export class CartPanel {}`,
    explanation: 'A provider on a component creates an instance for that component subtree. If the cart state was supposed to be shared app-wide, this local provider can create a second cart. Move the provider to root or the intended route boundary and state who should share the instance.',
    route: ['/angular', 'trivia', 'angular-hierarchical-dependency-injection-real-bug'],
    cta: 'Debug DI scope',
  },
  {
    level: 'advanced',
    q: 'How do async validators create stale form results?',
    code: `username = new FormControl('', [], [
  value => this.api.checkUsername(value)
]);`,
    explanation: 'Async validators can race when old requests finish after newer values. Angular handles async validator subscriptions, but the validator still needs predictable cancellation/error behavior and should return finite Observables. Add debouncing or switchMap-style ownership when validation depends on fast-changing input.',
    route: ['/angular', 'trivia', 'angular-template-driven-vs-reactive-forms-which-scales'],
    cta: 'Review form validation strategy',
  },
  {
    level: 'intermediate',
    q: 'Why does trackBy or track identity matter in Angular lists?',
    code: `<li *ngFor="let user of users; trackBy: trackUser">
  {{ user.name }}
</li>`,
    explanation: 'Stable identity lets Angular reuse DOM and component instances when a list changes. Without a useful trackBy or track expression, reordering or refreshing arrays can recreate more UI than necessary. The bug is not only performance; local row state and focus can also reset unexpectedly.',
    route: ['/angular', 'trivia', 'angular-ngfor-trackby'],
    cta: 'Review list identity',
  },
  {
    level: 'intermediate',
    q: 'When is async pipe better than a manual subscribe?',
    code: `<section *ngIf="user$ | async as user">
  {{ user.name }}
</section>`,
    explanation: 'async pipe subscribes, updates the template, and unsubscribes when the view is destroyed. It is usually better for read-only template data because lifecycle ownership is clear. Manual subscribe is still useful for imperative effects, but then teardown and error handling are your responsibility.',
    route: ['/angular', 'trivia', 'angular-observables-rxjs'],
    cta: 'Review Angular Observables',
  },
  {
    level: 'advanced',
    q: 'What changes when a provider moves to a lazy route boundary?',
    code: `export const routes: Routes = [
  {
    path: 'admin',
    providers: [AdminFeatureService],
    loadComponent: () => import('./admin.page')
  }
];`,
    explanation: 'Route-level providers create instances scoped to that route branch. That is useful for feature isolation, but it can split state if callers expected a root singleton. Lazy loading and provider boundaries should be explained together because both affect runtime ownership.',
    route: ['/angular', 'trivia', 'angular-lazy-loading'],
    cta: 'Review lazy loading boundaries',
  },
];

const ANGULAR_MODERN_QUESTIONS: AngularModernQuestionItem[] = [
  {
    level: 'intermediate',
    q: 'How do standalone components change Angular architecture?',
    a: 'Standalone components remove the need to declare every component in an NgModule. Imports move closer to the component or route that uses them, which makes feature boundaries easier to see. The migration risk is provider scope, because moving declarations and providers are different decisions.',
    route: ['/angular', 'trivia', 'angular-ngmodules-vs-standalone'],
    cta: 'Compare standalone and NgModules',
  },
  {
    level: 'advanced',
    q: 'What are route-level providers useful for?',
    a: 'Route-level providers scope services to a route branch instead of the whole app. They are useful for feature state, temporary workflows, and lazy-loaded boundaries that should not share instances globally. They can also create duplicate state if a root singleton was expected.',
    route: ['/angular', 'trivia', 'angular-lazy-loading'],
    cta: 'Review route boundaries',
  },
  {
    level: 'advanced',
    q: 'When should you use signals instead of RxJS?',
    a: 'Signals are a good fit for local synchronous state and derived values that the template reads directly. RxJS remains stronger for event streams, cancellation, multicasting, retry, debouncing, and HTTP orchestration. Many Angular apps use both: signals for state reads and RxJS for async pipelines.',
    route: ['/angular', 'trivia', 'angular-observables-rxjs'],
    cta: 'Compare streams and state',
  },
  {
    level: 'advanced',
    q: 'How do signal inputs and outputs affect component contracts?',
    a: 'Signal-based APIs make input reads and derived state more explicit in modern Angular components. They do not remove the need for clear ownership: parents still pass state down, and children still emit meaningful events up. The main benefit is predictable reactivity with less glue code for derived template state.',
    route: ['/angular', 'trivia', 'angular-input-output'],
    cta: 'Review component contracts',
  },
  {
    level: 'intermediate',
    q: 'What problem does the new Angular control flow syntax solve?',
    a: 'The newer @if, @for, and @switch syntax makes template control flow more explicit and avoids some microsyntax friction. The interview value is understanding view creation, list identity, and empty states, not only naming the syntax. The same performance and state-reset concerns still apply.',
    route: ['/angular', 'trivia', 'angular-structural-vs-attribute-directives'],
    cta: 'Review view creation',
  },
  {
    level: 'advanced',
    q: 'What are deferrable views in Angular?',
    a: 'Deferrable views let Angular delay loading part of a template until a trigger such as viewport visibility, interaction, or idle time. They are mainly a performance and loading-strategy tool. Use them for expensive non-critical UI, but keep loading, placeholder, and error states deliberate.',
    route: ['/angular', 'trivia', 'angular-lazy-loading'],
    cta: 'Review loading strategy',
  },
  {
    level: 'advanced',
    q: 'What changes in zoneless Angular change detection?',
    a: 'Zoneless Angular removes the assumption that patched async APIs automatically notify the framework. Updates need explicit notification paths such as signals, async pipe, or change detection APIs. That can reduce hidden work, but it requires clearer state ownership and update boundaries.',
    route: ['/angular', 'trivia', 'angular-zonejs-change-detection'],
    cta: 'Review zoneless change detection',
  },
  {
    level: 'advanced',
    q: 'How do SSR and hydration affect Angular performance?',
    a: 'Server-side rendering can improve first contentful paint and crawlable content by sending HTML earlier. Hydration lets Angular attach behavior to server-rendered markup instead of rebuilding the whole page from scratch. The trade-off is complexity around browser-only code, data consistency, and measuring whether SSR helps the actual route.',
    route: ['/angular', 'trivia', 'angular-performance-optimization'],
    cta: 'Review Angular performance',
  },
];

const JAVASCRIPT_TOPIC_CARDS: JavaScriptTopicCard[] = [
  {
    title: 'Shallow vs deep cloning',
    answer: 'A shallow clone copies the top-level array or object but keeps nested references shared. A deep clone copies nested structures too, which means you must discuss cycles, Dates, Maps, Sets, functions, prototypes, and performance before choosing an approach.',
    link: {
      label: 'Compare shallow and deep copy',
      route: ['/javascript', 'trivia', 'js-shallow-vs-deep-copy'],
    },
  },
  {
    title: 'Promises and async operations',
    answer: 'Promises represent a future success or failure value and give async work a composable contract. Chaining, microtask timing, error propagation, async/await readability, and Promise combinators all follow from that same contract.',
    link: {
      label: 'Review Promises and async/await',
      route: ['/javascript', 'trivia', 'js-promises-async-await'],
    },
  },
  {
    title: 'Async race conditions and stale updates',
    answer: 'Race conditions happen when multiple async operations can finish in a different order than user intent. Debug by naming the owner of the latest request, cancelling or ignoring stale work, and testing success, error, abort, and retry paths.',
    link: {
      label: 'Explain async race conditions',
      route: ['/javascript', 'trivia', 'js-async-race-conditions'],
    },
  },
  {
    title: 'Immutability and state updates',
    answer: 'Immutability keeps state transitions traceable, avoids accidental shared-reference bugs, and makes UI change detection easier to reason about. Copy caller-owned or shared data, and keep mutation limited to local implementation details.',
    link: {
      label: 'Review mutability vs immutability',
      route: ['/javascript', 'trivia', 'js-mutability-vs-immutability'],
    },
  },
  {
    title: 'Sorting, comparators, and mutation',
    answer: 'JavaScript sort converts values to strings unless you pass a comparator, so numeric sorting needs a function such as a - b. Also call out that sort mutates the array unless you copy first.',
    link: {
      label: 'Practice numeric sorting',
      route: ['/javascript', 'coding', 'js-array-sort'],
    },
  },
  {
    title: 'DOM XSS prevention',
    answer: 'XSS answers should separate escaping text from sanitizing HTML. Prefer safe DOM APIs such as textContent, validate URLs before assigning href, avoid dangerous sinks, and use Trusted Types or reviewed sanitizers when HTML is unavoidable.',
    link: {
      label: 'Review DOM XSS prevention',
      route: ['/javascript', 'trivia', 'js-xss-dom-sinks'],
    },
  },
];

const JAVASCRIPT_MISTAKE_ITEMS: JavaScriptSupportItem[] = [
  {
    title: 'Mutating inputs without saying so',
    detail: 'Array.sort, push, splice, and nested object edits can change caller-owned data. Copy first when the contract expects immutability.',
  },
  {
    title: 'Sorting numbers lexicographically',
    detail: 'Default sort compares strings, so 100 can come before 20. Use an explicit comparator and mention mutation.',
  },
  {
    title: 'Dropping Promise returns or rejection handling',
    detail: 'A missing return breaks chains, and unhandled rejections hide failure states. Explain success, error, and cleanup paths.',
  },
  {
    title: 'Explaining closures as copied values',
    detail: 'Closures keep access to lexical bindings. That distinction matters for loops, delayed callbacks, and stale-state bugs.',
  },
  {
    title: 'Using JSON clone as a universal deep clone',
    detail: 'JSON cloning drops undefined, functions, Symbols, prototypes, Dates, Maps, Sets, BigInt, and cycles. Name the trade-off before using it.',
  },
  {
    title: 'Fixing XSS with partial string filters',
    detail: 'Blocklists miss dangerous contexts. Choose safe sinks, encode for the right context, sanitize reviewed HTML, and validate URLs.',
  },
];

const JAVASCRIPT_BEST_PRACTICES: string[] = [
  'Restate inputs, outputs, constraints, mutation policy, and edge cases before writing code.',
  'Prefer the simplest correct implementation first, then explain the built-in or optimized variant as a follow-up.',
  'Test empty input, single item, duplicates, nested data, invalid values, async rejection, cancellation, and ordering.',
  'Narrate trade-offs clearly: mutation versus copying, shallow versus deep behavior, sync versus async control flow, and readability versus performance.',
  'Finish by naming complexity, failure modes, and the regression tests you would keep.',
];

const JAVASCRIPT_ASYNC_DEBUG_ITEMS: JavaScriptSupportItem[] = [
  {
    title: 'Trace ownership first',
    detail: 'Identify which request, timer, listener, or callback owns the next state update before changing code.',
  },
  {
    title: 'Separate ordering from failure',
    detail: 'Check whether the bug is stale success, late rejection, missing cleanup, duplicate work, or a swallowed error.',
  },
  {
    title: 'Use browser tools deliberately',
    detail: 'Pause on exceptions, inspect async stack traces, watch network cancellation, and add focused logs around start, settle, and cleanup.',
  },
  {
    title: 'Protect the regression',
    detail: 'Keep tests for overlapping requests, rejected promises, aborts, retries, and component or listener teardown when those behaviors exist.',
  },
];

const JAVASCRIPT_RESOURCE_LINKS: JavaScriptResourceLink[] = [
  {
    label: 'MDN JavaScript Guide',
    href: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
    summary: 'Practical language guide for functions, objects, promises, modules, collections, and core semantics.',
  },
  {
    label: 'ECMAScript language specification',
    href: 'https://tc39.es/ecma262/multipage/',
    summary: 'Source-of-truth semantics for the language when an interview answer needs precision.',
  },
  {
    label: 'MDN Promise reference',
    href: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise',
    summary: 'Promise states, chaining, static combinators, and async behavior reference.',
  },
  {
    label: 'Chrome DevTools JavaScript debugging',
    href: 'https://developer.chrome.com/docs/devtools/javascript',
    summary: 'Breakpoints, stepping, console workflow, and runtime debugging tools.',
  },
  {
    label: 'OWASP XSS Prevention Cheat Sheet',
    href: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html',
    summary: 'Context-aware escaping, safe sinks, sanitization, and browser security controls.',
  },
];

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
    answer: 'Angular DI creates and supplies services, config values, and scoped dependencies. Service responsibility should be explained with provider placement, because root, route, and component providers change instance lifetime.',
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
  private readonly document = inject(DOCUMENT);

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

  isJavaScriptHub(): boolean {
    return !this.isMasterHub() && this.config.techs.length === 1 && this.config.techs[0] === 'javascript';
  }

  javascriptTopicCards(): JavaScriptTopicCard[] {
    return JAVASCRIPT_TOPIC_CARDS;
  }

  javascriptMistakeItems(): JavaScriptSupportItem[] {
    return JAVASCRIPT_MISTAKE_ITEMS;
  }

  javascriptBestPractices(): string[] {
    return JAVASCRIPT_BEST_PRACTICES;
  }

  javascriptAsyncDebugItems(): JavaScriptSupportItem[] {
    return JAVASCRIPT_ASYNC_DEBUG_ITEMS;
  }

  javascriptResourceLinks(): JavaScriptResourceLink[] {
    return JAVASCRIPT_RESOURCE_LINKS;
  }

  javascriptAnchorItems(): JavaScriptAnchorItem[] {
    return JAVASCRIPT_ANCHOR_ITEMS;
  }

  javascriptEditorialSignal(): JavaScriptEditorialSignal {
    return JAVASCRIPT_EDITORIAL_SIGNAL;
  }

  scrollToJavaScriptSection(targetId: string): void {
    this.scrollToSection(targetId);
  }

  scrollToAngularSection(targetId: string): void {
    this.scrollToSection(targetId);
  }

  private scrollToSection(targetId: string): void {
    const target = this.document.getElementById(targetId);
    if (!target) return;

    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const view = this.document.defaultView;
    if (view) {
      view.history.replaceState(null, '', `${view.location.pathname}${view.location.search}#${targetId}`);
    }
  }

  javascriptShortAnswers(): JavaScriptShortAnswerItem[] {
    return JAVASCRIPT_SHORT_ANSWERS;
  }

  javascriptOutputQuestions(): JavaScriptOutputQuestionItem[] {
    return JAVASCRIPT_OUTPUT_QUESTIONS;
  }

  javascriptBrowserQuestions(): JavaScriptBrowserQuestionItem[] {
    return JAVASCRIPT_BROWSER_QUESTIONS;
  }

  questionLevelLabel(level: QuestionLevel): string {
    switch (level) {
      case 'beginner':
        return 'Beginner';
      case 'intermediate':
        return 'Intermediate';
      default:
        return 'Advanced';
    }
  }

  javascriptQuestionLevelLabel(level: QuestionLevel): string {
    return this.questionLevelLabel(level);
  }

  javascriptShortAnswerCategoryLabel(category: JavaScriptShortAnswerCategory): string {
    switch (category) {
      case 'fundamentals':
        return 'Fundamentals';
      case 'async':
        return 'Async';
      case 'coding':
        return 'Coding';
      default:
        return 'Browser + security';
    }
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

  angularAnchorItems(): AngularAnchorItem[] {
    return ANGULAR_ANCHOR_ITEMS;
  }

  angularEditorialSignal(): AngularEditorialSignal {
    return ANGULAR_EDITORIAL_SIGNAL;
  }

  angularShortAnswers(): AngularShortAnswerItem[] {
    return ANGULAR_SHORT_ANSWERS;
  }

  angularKeywordClusters(): AngularKeywordClusterItem[] {
    return ANGULAR_KEYWORD_CLUSTERS;
  }

  angularAudienceTracks(): AngularAudienceTrack[] {
    return ANGULAR_AUDIENCE_TRACKS;
  }

  angularTestingQuestions(): AngularFocusedQuestionItem[] {
    return ANGULAR_TESTING_QUESTIONS;
  }

  angularSecurityQuestions(): AngularFocusedQuestionItem[] {
    return ANGULAR_SECURITY_QUESTIONS;
  }

  angularClassicQuestions(): AngularFocusedQuestionItem[] {
    return ANGULAR_CLASSIC_QUESTIONS;
  }

  angularScenarioQuestions(): AngularScenarioQuestionItem[] {
    return ANGULAR_SCENARIO_QUESTIONS;
  }

  angularModernQuestions(): AngularModernQuestionItem[] {
    return ANGULAR_MODERN_QUESTIONS;
  }

  angularShortAnswerCategoryLabel(category: AngularShortAnswerCategory): string {
    switch (category) {
      case 'fundamentals':
        return 'Fundamentals';
      case 'components':
        return 'Components';
      case 'di-change-detection':
        return 'DI + change detection';
      case 'rxjs-forms':
        return 'RxJS + forms';
      default:
        return 'Modern Angular';
    }
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

    if (this.isJavaScriptHub()) {
      collectionPage['dateModified'] = JAVASCRIPT_EDITORIAL_SIGNAL.dateModified;
      collectionPage['reviewedBy'] = {
        '@type': 'Organization',
        name: JAVASCRIPT_EDITORIAL_SIGNAL.reviewer,
      };
      collectionPage['about'] = [
        ...(collectionPage['about'] || []),
        { '@type': 'Thing', name: 'Beginner to advanced JavaScript interview questions' },
        { '@type': 'Thing', name: 'JavaScript interview questions for beginners' },
        { '@type': 'Thing', name: 'JavaScript interview questions for experienced developers' },
        { '@type': 'Thing', name: 'JavaScript shallow copy versus deep copy' },
        { '@type': 'Thing', name: 'JavaScript Promises and async await' },
        { '@type': 'Thing', name: 'JavaScript async race conditions' },
        { '@type': 'Thing', name: 'JavaScript immutability and state updates' },
        { '@type': 'Thing', name: 'JavaScript sorting comparators and mutation' },
        { '@type': 'Thing', name: 'Output-based JavaScript interview questions' },
        { '@type': 'Thing', name: 'JavaScript DOM events and event delegation' },
        { '@type': 'Thing', name: 'JavaScript browser storage questions' },
        { '@type': 'Thing', name: 'DOM XSS prevention in JavaScript' },
      ];
      collectionPage['mentions'] = [
        ...(collectionPage['mentions'] || []),
        { '@type': 'Thing', name: 'JavaScript coding interview questions' },
        { '@type': 'Thing', name: 'Common JavaScript interview mistakes' },
        { '@type': 'Thing', name: 'JavaScript coding interview best practices' },
        { '@type': 'Thing', name: 'Debugging async JavaScript issues' },
        { '@type': 'Thing', name: 'JavaScript interview preparation resources' },
        { '@type': 'Thing', name: 'Promise combinators and error handling' },
        { '@type': 'Thing', name: 'JavaScript event bubbling and capturing' },
        { '@type': 'Thing', name: 'JavaScript typeof null and coercion output questions' },
      ];
    }

    if (this.isAngularHub()) {
      collectionPage['dateModified'] = ANGULAR_EDITORIAL_SIGNAL.dateModified;
      collectionPage['reviewedBy'] = {
        '@type': 'Organization',
        name: ANGULAR_EDITORIAL_SIGNAL.reviewer,
      };
      collectionPage['about'] = [
        ...(collectionPage['about'] || []),
        { '@type': 'Thing', name: 'Beginner to advanced Angular interview questions' },
        { '@type': 'Thing', name: 'Angular interview questions' },
        { '@type': 'Thing', name: 'Angular interview questions and answers' },
        { '@type': 'Thing', name: 'Angular interview questions for beginners' },
        { '@type': 'Thing', name: 'Angular interview questions for experienced developers' },
        { '@type': 'Thing', name: 'Senior Angular interview questions' },
        { '@type': 'Thing', name: 'Angular RxJS interview questions' },
        { '@type': 'Thing', name: 'Angular change detection interview questions' },
        { '@type': 'Thing', name: 'OnPush change detection Angular interview questions' },
        { '@type': 'Thing', name: 'Angular dependency injection interview questions' },
        { '@type': 'Thing', name: 'Angular testing interview questions' },
        { '@type': 'Thing', name: 'Angular TestBed interview questions' },
        { '@type': 'Thing', name: 'fakeAsync tick Angular interview' },
        { '@type': 'Thing', name: 'HttpTestingController interview questions' },
        { '@type': 'Thing', name: 'Angular security interview questions' },
        { '@type': 'Thing', name: 'Angular DomSanitizer interview questions' },
        { '@type': 'Thing', name: 'Angular XSS prevention interview questions' },
        { '@type': 'Thing', name: 'Angular signals interview questions' },
        { '@type': 'Thing', name: 'Angular standalone components interview questions' },
        { '@type': 'Thing', name: 'zoneless Angular interview questions' },
        { '@type': 'Thing', name: 'Angular guards and resolvers interview questions' },
        { '@type': 'Thing', name: 'Angular AOT and JIT interview questions' },
        { '@type': 'Thing', name: 'AOT vs JIT Angular interview questions' },
        { '@type': 'Thing', name: 'Angular compiler interview questions' },
        { '@type': 'Thing', name: 'Angular performance profiling interview questions' },
        { '@type': 'Thing', name: 'Angular performance optimization interview questions' },
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
        { '@type': 'Thing', name: 'Angular standalone components and signals' },
        { '@type': 'Thing', name: 'Angular forms and testing' },
        { '@type': 'Thing', name: 'Angular TestBed and fakeAsync' },
        { '@type': 'Thing', name: 'Angular HttpTestingController' },
        { '@type': 'Thing', name: 'Angular DomSanitizer and sanitization' },
        { '@type': 'Thing', name: 'Angular XSS prevention' },
        { '@type': 'Thing', name: 'Angular route guards and resolvers' },
        { '@type': 'Thing', name: 'Angular AOT versus JIT' },
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

    const jsonLd = [collectionPage, breadcrumbList];
    if (this.isJavaScriptHub()) {
      jsonLd.push(this.javascriptShortAnswersFaqPage(canonicalUrl));
    }
    if (this.isAngularHub()) {
      jsonLd.push(this.angularShortAnswersFaqPage(canonicalUrl));
    }

    this.seo.updateTags({
      ...routeSeo,
      canonical: currentPath,
      jsonLd,
    });
  }

  private javascriptShortAnswersFaqPage(canonicalUrl: string): Record<string, any> {
    return {
      '@type': 'FAQPage',
      '@id': `${canonicalUrl}#javascript-short-answers`,
      url: canonicalUrl,
      name: 'Top JavaScript interview questions and short answers, beginner to advanced',
      mainEntity: this.javascriptShortAnswers().map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      })),
    };
  }

  private angularShortAnswersFaqPage(canonicalUrl: string): Record<string, any> {
    return {
      '@type': 'FAQPage',
      '@id': `${canonicalUrl}#angular-short-answers`,
      url: canonicalUrl,
      name: 'Top Angular interview questions and short answers, beginner to advanced',
      mainEntity: this.angularShortAnswers().map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      })),
    };
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
