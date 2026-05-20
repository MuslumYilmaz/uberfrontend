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
type ReactShortAnswerCategory = 'fundamentals' | 'state-hooks' | 'rendering-performance' | 'modern';
type ReactShortAnswerItem = {
  q: string;
  a: string;
  route?: any[];
  cta?: string;
  category: ReactShortAnswerCategory;
  level: QuestionLevel;
};
type ReactAnchorItem = { label: string; targetId: string };
type ReactKeywordClusterItem = {
  label: string;
  targetId: string;
  detail: string;
};
type ReactScenarioQuestionItem = {
  q: string;
  code: string;
  explanation: string;
  level: QuestionLevel;
  route?: any[];
  cta?: string;
};
type ReactModernQuestionItem = {
  q: string;
  a: string;
  level: QuestionLevel;
  route?: any[];
  cta?: string;
};
type ReactAudienceTrack = { title: string; detail: string };
type ReactFocusedQuestionItem = {
  q: string;
  a: string;
  level: QuestionLevel;
  route?: any[];
  cta?: string;
};
type ReactEditorialSignal = {
  reviewedLabel: string;
  reviewer: string;
  coverage: string;
  dateModified: string;
};
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
type HtmlCssShortAnswerCategory = 'html' | 'css' | 'accessibility' | 'responsive-debugging';
type HtmlCssShortAnswerItem = {
  q: string;
  a: string;
  route?: any[];
  cta?: string;
  category: HtmlCssShortAnswerCategory;
  level: QuestionLevel;
};
type HtmlCssAnchorItem = { label: string; targetId: string };
type HtmlCssKeywordClusterItem = {
  label: string;
  targetId: string;
  detail: string;
};
type HtmlCssAudienceTrack = { title: string; detail: string };
type HtmlCssFocusedQuestionItem = {
  q: string;
  a: string;
  level: QuestionLevel;
  route?: any[];
  cta?: string;
};
type HtmlCssCodeQuestionItem = {
  q: string;
  code: string;
  explanation: string;
  level: QuestionLevel;
  route?: any[];
  cta?: string;
};
type HtmlCssEditorialSignal = {
  reviewedLabel: string;
  reviewer: string;
  coverage: string;
  dateModified: string;
};
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
      q: 'Are these React interview questions for beginners and experienced developers?',
      a: 'Yes. The page starts with beginner React fundamentals, then moves into experienced-developer topics such as hooks, effects, rendering internals, React 19, server/client boundaries, testing, Context performance, hydration, and server-state trade-offs.',
    },
    {
      q: 'Does this page cover React rendering internals?',
      a: 'Yes. The rendering internals section covers Virtual DOM, render and commit phases, reconciliation, diffing assumptions, Fiber, keys, fragments, and useLayoutEffect timing.',
    },
    {
      q: 'Does this page include React 19 and server-first React questions?',
      a: 'Yes. The React 19 section covers Actions, useActionState, useOptimistic, useFormStatus, use(), Server Components, Next.js App Router boundaries, streaming, Suspense, and hydration mismatches.',
    },
    {
      q: 'Does this page include React testing interview questions?',
      a: 'Yes. The testing section covers React Testing Library, Jest, Vitest, act, async loading and error UI, mocked API boundaries, hook testing, StrictMode effects, and brittle test mistakes.',
    },
    {
      q: 'How should I prepare after reviewing these React interview questions?',
      a: 'Use this hub to find gaps, then move to the React interview preparation path for a 7, 14, or 30-day plan. The prep path owns the study-plan intent; this page owns the question-and-answer review intent.',
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
      q: 'Are these HTML and CSS interview questions for beginners and experienced developers?',
      a: 'Yes. The page starts with beginner HTML and CSS fundamentals, then moves into experienced frontend topics such as accessibility, cascade strategy, layout debugging, browser rendering, responsive UI, and code scenarios.',
    },
    {
      q: 'Does this page cover accessibility and forms?',
      a: 'Yes. It covers semantic HTML, labels, form validation, landmarks, focus states, alt text, dialog behavior, and quick accessibility testing for practical UI rounds.',
    },
    {
      q: 'Does this page cover CSS layout, cascade, and responsive UI?',
      a: 'Yes. It covers box model, cascade, specificity, Flexbox, Grid, positioning, z-index, media queries, responsive images, overflow debugging, and layout shift.',
    },
    {
      q: 'Where should I practice HTML and CSS coding scenarios?',
      a: 'Start with the code scenarios and preview prompts on this page, then open the HTML/CSS coding list for forms, links, images, semantic layouts, Flexbox nav bars, and responsive card grids.',
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

const REACT_EDITORIAL_SIGNAL: ReactEditorialSignal = {
  reviewedLabel: 'Reviewed May 20, 2026',
  reviewer: 'FrontendAtlas Editor',
  coverage: '65 visible React questions across answers, scenarios, modern React, rendering internals, React 19, server-first React, testing, state, and performance',
  dateModified: '2026-05-20T00:00:00.000Z',
};

const REACT_ANCHOR_ITEMS: ReactAnchorItem[] = [
  { label: 'Clusters', targetId: 'iq-react-clusters-title' },
  { label: 'Short answers', targetId: 'iq-react-short-answers-title' },
  { label: 'Beginner/experienced', targetId: 'iq-react-audience-title' },
  { label: 'Rendering internals', targetId: 'iq-react-rendering-internals-title' },
  { label: 'React 19 + server', targetId: 'iq-react-react19-server-title' },
  { label: 'Testing', targetId: 'iq-react-testing-title' },
  { label: 'Scenarios + code', targetId: 'iq-react-scenarios-title' },
  { label: 'Modern React', targetId: 'iq-react-modern-title' },
  { label: 'Coding prompts', targetId: 'iq-react-coding-preview-title' },
  { label: 'Concept prompts', targetId: 'iq-react-concept-preview-title' },
  { label: 'Topic map', targetId: 'iq-react-coverage-title' },
];

const REACT_KEYWORD_CLUSTERS: ReactKeywordClusterItem[] = [
  {
    label: 'Beginner',
    targetId: 'iq-react-short-answers-title',
    detail: 'React, JSX, components, props, state, keys, controlled inputs, and one-way data flow.',
  },
  {
    label: 'Experienced',
    targetId: 'iq-react-audience-title',
    detail: 'State ownership, effects, Context fan-out, rendering internals, server boundaries, testing, and performance.',
  },
  {
    label: 'Rendering internals',
    targetId: 'iq-react-rendering-internals-title',
    detail: 'Virtual DOM, render and commit phases, reconciliation, diffing, Fiber, fragments, keys, and layout effects.',
  },
  {
    label: 'React 19/server',
    targetId: 'iq-react-react19-server-title',
    detail: 'Actions, useActionState, useOptimistic, useFormStatus, use(), Server Components, Next.js boundaries, and streaming.',
  },
  {
    label: 'Testing',
    targetId: 'iq-react-testing-title',
    detail: 'Testing Library, Jest, Vitest, act, async UI, mocked APIs, hooks, StrictMode, and brittle tests.',
  },
  {
    label: 'Hooks',
    targetId: 'iq-react-short-answers-title',
    detail: 'useState, useEffect, cleanup, stale closures, refs, memoization, and Rules of Hooks.',
  },
  {
    label: 'State/forms',
    targetId: 'iq-react-short-answers-title',
    detail: 'Props, state ownership, lifting state up, derived state, batching, and controlled inputs.',
  },
  {
    label: 'Performance',
    targetId: 'iq-react-modern-title',
    detail: 'Context fan-out, unstable props, memoization, profiling, external stores, and server-state trade-offs.',
  },
];

const REACT_SHORT_ANSWERS: ReactShortAnswerItem[] = [
  {
    category: 'fundamentals',
    level: 'beginner',
    q: 'What is React?',
    a: 'React is a JavaScript library for building user interfaces from components. A React app describes what the UI should look like for a given state, and React updates the DOM when that state changes. Routing, server-state caching, and form validation are separate architectural choices rather than built-in React features.',
  },
  {
    category: 'fundamentals',
    level: 'beginner',
    q: 'What are React components?',
    a: 'React components are reusable UI units that receive props, hold state when needed, and return JSX. Function components are the standard shape in modern React, while class components still appear in older codebases. A component should keep rendering predictable by treating props as read-only and moving shared behavior into smaller components or hooks.',
    route: ['/react', 'trivia', 'react-pure-function-of-props-and-state'],
    cta: 'Review component rendering',
  },
  {
    category: 'fundamentals',
    level: 'beginner',
    q: 'What is JSX?',
    a: 'JSX is a syntax extension that lets React UI look close to HTML while still being JavaScript. JSX expressions compile to function calls, so values inside braces are evaluated as JavaScript and must follow JavaScript rules. The common edge case is that attributes are React props, so names such as className and htmlFor differ from plain HTML.',
    route: ['/react', 'trivia', 'react-jsx-transform-and-why-not-required'],
    cta: 'Review the JSX transform',
  },
  {
    category: 'fundamentals',
    level: 'beginner',
    q: 'What are props in React?',
    a: 'Props are read-only values passed from a parent component to a child component. They describe the child UI contract, such as labels, data, callbacks, and configuration. Mutating props breaks ownership and can hide update bugs because the parent still owns the source value.',
    route: ['/react', 'trivia', 'react-why-props-immutable'],
    cta: 'Review props immutability',
  },
  {
    category: 'fundamentals',
    level: 'beginner',
    q: 'What is state in React?',
    a: 'State is component-owned data that can change over time and trigger a new render. Use state for values that affect what the user sees, such as form input, selected tabs, loading state, and expanded sections. Values that can be derived directly from props or other state usually should not be stored separately.',
    route: ['/react', 'trivia', 'react-usestate-purpose'],
    cta: 'Review useState',
  },
  {
    category: 'fundamentals',
    level: 'beginner',
    q: 'What is one-way data flow in React?',
    a: 'One-way data flow means data moves down from parent to child through props, while changes move up through callbacks. The parent owns the state transition and passes the updated value back down. This keeps ownership clear, but deeply nested updates may need component composition, Context, or a store.',
    route: ['/react', 'trivia', 'react-lifting-state-up'],
    cta: 'Review lifting state up',
  },
  {
    category: 'rendering-performance',
    level: 'beginner',
    q: 'Why are keys important in React lists?',
    a: 'Keys tell React which list item identity should be preserved across renders. Stable keys let React keep row state, focus, and DOM reuse aligned with the right data item. Index keys are risky when items can be inserted, removed, sorted, or filtered because state can move to the wrong row.',
    route: ['/react', 'trivia', 'react-keys-in-lists'],
    cta: 'Review list keys',
  },
  {
    category: 'fundamentals',
    level: 'intermediate',
    q: 'What is the difference between controlled and uncontrolled inputs?',
    a: 'A controlled input gets its current value from React state and reports changes through events. An uncontrolled input keeps its current value in the DOM, usually read with a ref when needed. Switching a field between controlled and uncontrolled ownership can create warnings and broken form behavior.',
    route: ['/react', 'trivia', 'react-controlled-vs-uncontrolled'],
    cta: 'Compare form ownership',
  },
  {
    category: 'fundamentals',
    level: 'beginner',
    q: 'What does lifting state up mean?',
    a: 'Lifting state up means moving state to the closest shared parent that needs to coordinate multiple children. The parent passes the current value down as props and passes callbacks down for child events. It prevents duplicated state, but if the shared parent becomes too broad, rerenders and prop drilling can grow.',
    route: ['/react', 'trivia', 'react-lifting-state-up'],
    cta: 'Practice state ownership',
  },
  {
    category: 'state-hooks',
    level: 'beginner',
    q: 'What are React hooks?',
    a: 'Hooks are functions that let function components use React features such as state, effects, refs, reducers, memoization, and context. They must run in a consistent order on every render so React can associate each hook call with its stored state. Custom hooks reuse stateful logic, but they do not share state unless they call shared external state.',
    route: ['/react', 'trivia', 'react-hooks-youve-used'],
    cta: 'Review common hooks',
  },
  {
    category: 'state-hooks',
    level: 'intermediate',
    q: 'What are the Rules of Hooks?',
    a: 'Hooks must be called at the top level of a React function component or custom hook. They should not be called inside loops, conditions, nested functions, or ordinary utility functions. Breaking the order makes React read the wrong stored hook state on later renders.',
    route: ['/react', 'trivia', 'react-why-hooks-have-rules'],
    cta: 'Review Rules of Hooks',
  },
  {
    category: 'state-hooks',
    level: 'beginner',
    q: 'What is useState used for?',
    a: 'useState stores a value that belongs to a component and should trigger rendering when it changes. The setter schedules an update instead of mutating the current value immediately. When the next value depends on the previous value, a functional update avoids stale reads.',
    route: ['/react', 'trivia', 'react-usestate-purpose'],
    cta: 'Review useState',
  },
  {
    category: 'state-hooks',
    level: 'intermediate',
    q: 'What is useEffect used for?',
    a: 'useEffect synchronizes a component with something outside rendering, such as subscriptions, timers, DOM APIs, analytics, or network state. It runs after React commits the UI, and cleanup runs before the effect is replaced or the component unmounts. Pure derived values usually belong in render instead of in an effect.',
    route: ['/react', 'trivia', 'react-useeffect-purpose'],
    cta: 'Review useEffect',
  },
  {
    category: 'state-hooks',
    level: 'intermediate',
    q: 'How does effect cleanup work?',
    a: 'An effect may return a cleanup function that removes the external work created by that effect. Cleanup runs before React reruns the effect with changed dependencies and when the component unmounts. Timers, subscriptions, event listeners, and in-flight async work should have clear cleanup ownership.',
    route: ['/react', 'trivia', 'react-useeffect-purpose'],
    cta: 'Review effect timing',
  },
  {
    category: 'state-hooks',
    level: 'advanced',
    q: 'What are stale closures in React?',
    a: 'A stale closure happens when a callback keeps reading values from an older render. It often appears in timers, promises, subscriptions, and event handlers that outlive the render that created them. Functional state updates, correct dependencies, refs, or moving logic into the event path can fix the ownership problem.',
    route: ['/react', 'trivia', 'react-stale-state-closures'],
    cta: 'Debug stale closures',
  },
  {
    category: 'state-hooks',
    level: 'intermediate',
    q: 'What is the difference between useRef and useState?',
    a: 'useState stores render-affecting data and schedules a rerender when changed. useRef stores a mutable value that persists across renders without causing a rerender. Refs are useful for DOM nodes, timer IDs, previous values, and imperative handles, but they can hide UI bugs if used as state.',
    route: ['/react', 'trivia', 'react-useref-vs-usestate'],
    cta: 'Compare refs and state',
  },
  {
    category: 'rendering-performance',
    level: 'intermediate',
    q: 'What is the difference between useMemo and useCallback?',
    a: 'useMemo memoizes the result of running a calculation. useCallback memoizes the function reference itself. Both depend on stable dependency arrays, and neither helps if the expensive work is small or the props passed to children are still unstable.',
    route: ['/react', 'trivia', 'react-usememo-vs-usecallback'],
    cta: 'Compare memo hooks',
  },
  {
    category: 'rendering-performance',
    level: 'advanced',
    q: 'How can Context cause performance issues?',
    a: 'When a Context provider value changes, consumers that read that context can render again. A broad provider with a new object value on every render can fan out updates across a large tree. Splitting providers, stabilizing values, using local state, or choosing an external store can reduce unnecessary work.',
    route: ['/react', 'trivia', 'react-context-performance-issues'],
    cta: 'Debug Context performance',
  },
  {
    category: 'rendering-performance',
    level: 'intermediate',
    q: 'What causes a React component to re-render?',
    a: 'A component can re-render when its state updates, its parent renders, a consumed context value changes, or an external store subscription notifies it. Rendering does not always mean the DOM changes; React still compares the result before committing updates. Performance debugging should separate render frequency from actual slow commits.',
    route: ['/react', 'trivia', 'react-component-rerendering'],
    cta: 'Review rerender causes',
  },
  {
    category: 'rendering-performance',
    level: 'intermediate',
    q: 'What is state batching in React?',
    a: 'State batching means React groups multiple state updates into a single render pass when it can. React 18 broadened automatic batching across more async boundaries. The important edge case is that reading state immediately after calling a setter still reads the value from the current render.',
    route: ['/react', 'trivia', 'react-why-batching-state-updates'],
    cta: 'Review batching',
  },
  {
    category: 'rendering-performance',
    level: 'advanced',
    q: 'Why is derived state risky?',
    a: 'Derived state is risky when you store data that can be calculated from props or other state. The duplicated value can drift out of sync and often creates an extra render through an effect. Keep pure derived values in render, and use memoization only when the calculation is expensive enough to matter.',
    route: ['/react', 'trivia', 'react-derived-state-anti-pattern'],
    cta: 'Avoid derived state bugs',
  },
  {
    category: 'modern',
    level: 'intermediate',
    q: 'What problem do error boundaries solve?',
    a: 'Error boundaries catch rendering errors in their child tree and let the app show a fallback UI instead of unmounting everything. They do not catch errors in event handlers, async callbacks, or server-side rendering. Place them around meaningful product regions so a failure is isolated to the smallest useful surface.',
    route: ['/react', 'trivia', 'react-error-boundaries-what-they-solve'],
    cta: 'Review error boundaries',
  },
  {
    category: 'modern',
    level: 'intermediate',
    q: 'What are React portals?',
    a: 'Portals render children into a DOM node outside the parent DOM hierarchy while keeping the React owner tree intact. They are useful for modals, popovers, tooltips, and overlays that need to escape clipping or stacking contexts. Events still bubble through the React tree, so event handling can differ from the physical DOM position.',
    route: ['/react', 'trivia', 'react-portals'],
    cta: 'Review portals',
  },
  {
    category: 'modern',
    level: 'advanced',
    q: 'What is the difference between render props and HOCs?',
    a: 'Render props share behavior by passing a function that returns UI. Higher-order components share behavior by wrapping a component and returning a new component. Hooks replaced many of these patterns, but render props and HOCs still appear in older libraries and can add wrapper or composition complexity.',
    route: ['/react', 'trivia', 'react-render-props-vs-hocs'],
    cta: 'Compare reuse patterns',
  },
  {
    category: 'modern',
    level: 'advanced',
    q: 'Why does StrictMode run some effects twice in development?',
    a: 'StrictMode can intentionally mount, clean up, and remount components in development to reveal unsafe effects. This does not happen the same way in production, but the issue it exposes is real: effects must tolerate setup and cleanup correctly. Duplicate logs or requests usually mean the effect is not idempotent or the cleanup is incomplete.',
    route: ['/react', 'trivia', 'react-strictmode-double-invoke-effects'],
    cta: 'Review StrictMode effects',
  },
];

const REACT_AUDIENCE_TRACKS: ReactAudienceTrack[] = [
  {
    title: 'For beginners',
    detail: 'Start with React, components, JSX, props, state, one-way data flow, keys, controlled inputs, and lifting state up. These topics make hooks, effects, Context, and rendering behavior easier to reason about later.',
  },
  {
    title: 'For experienced developers',
    detail: 'Focus on ownership boundaries: effect cleanup, stale closures, Context performance, reconciliation, server/client component boundaries, testing async UI, and profiling before memoizing. These topics expose whether React knowledge holds up in production code.',
  },
];

const REACT_RENDERING_INTERNALS_QUESTIONS: ReactFocusedQuestionItem[] = [
  {
    level: 'intermediate',
    q: 'What is the Virtual DOM in React?',
    a: 'The Virtual DOM is a lightweight description of the UI that React creates from components. React compares the new description with the previous one, decides what changed, and commits the necessary host updates. The important detail is that the Virtual DOM is a means to coordinate updates, not a guarantee that every render is cheap.',
    route: ['/react', 'trivia', 'react-virtual-dom'],
    cta: 'Review Virtual DOM',
  },
  {
    level: 'advanced',
    q: 'What is the difference between render phase and commit phase?',
    a: 'The render phase calls components and calculates the next UI tree. The commit phase applies the chosen changes to the host environment and runs layout-related work. Render work can be restarted or discarded, so component render logic must stay pure and side effects belong in effects or event handlers.',
    route: ['/react', 'trivia', 'react-rerender-decision-and-render'],
    cta: 'Review render behavior',
  },
  {
    level: 'intermediate',
    q: 'What is reconciliation in React?',
    a: 'Reconciliation is the process React uses to compare the previous element tree with the next one. It matches elements by type and key, then decides which parts can be reused, updated, moved, or remounted. Incorrect keys or changing component types can reset state because React sees a different identity.',
    route: ['/react', 'trivia', 'react-reconciliation'],
    cta: 'Review reconciliation',
  },
  {
    level: 'advanced',
    q: 'What assumptions does React diffing use?',
    a: 'React uses heuristics instead of comparing every possible tree transformation. Different element types are treated as different subtrees, and keys tell React which children should keep identity across list changes. Those assumptions make updates practical, but unstable keys or accidental type changes can cause unexpected remounts.',
    route: ['/react', 'trivia', 'react-diffing-algorithm'],
    cta: 'Review diffing',
  },
  {
    level: 'advanced',
    q: 'What is Fiber in React?',
    a: 'Fiber is React internal architecture for organizing rendering work as units that can be scheduled, paused, resumed, or abandoned. It enables React to prioritize urgent updates differently from non-urgent work. You do not usually program against Fiber directly, but it explains why render logic must be pure and why concurrent rendering can restart work.',
    route: ['/react', 'trivia', 'react-reconciliation'],
    cta: 'Review render internals',
  },
  {
    level: 'intermediate',
    q: 'How do keys preserve or reset state?',
    a: 'React uses keys to decide whether a child in a list is the same child across renders. A stable key preserves component state for the same data item, while a changed key forces React to treat it as a new instance. This is useful for intentional resets, but index keys can accidentally move state to the wrong row.',
    route: ['/react', 'trivia', 'react-keys-in-lists'],
    cta: 'Review list keys',
  },
  {
    level: 'intermediate',
    q: 'How do fragments affect reconciliation?',
    a: 'Fragments group multiple children without adding an extra DOM node. Keyed fragments can preserve identity for a group of siblings during reconciliation. Unkeyed fragments are useful for markup cleanliness, but lists of fragments still need stable keys when identity matters.',
    route: ['/react', 'trivia', 'react-fragments-dom-and-reconciliation'],
    cta: 'Review fragments and reconciliation',
  },
  {
    level: 'advanced',
    q: 'What is the difference between useLayoutEffect and useEffect?',
    a: 'useEffect runs after the browser has painted the committed UI. useLayoutEffect runs after DOM mutations but before paint, so it can measure layout and synchronously adjust the UI before the user sees it. Overusing layout effects can block painting, so ordinary subscriptions and async work should stay in useEffect.',
    route: ['/react', 'trivia', 'react-useeffect-vs-uselayouteffect'],
    cta: 'Compare effect timing',
  },
];

const REACT_REACT19_SERVER_QUESTIONS: ReactFocusedQuestionItem[] = [
  {
    level: 'advanced',
    q: 'What are React 19 Actions?',
    a: 'Actions are async functions used with transitions or form submissions to manage mutation workflows. React can coordinate pending state, errors, optimistic updates, and final state around the action. The practical benefit is reducing manual loading and error wiring for form-like mutations.',
    route: ['/guides', 'framework-prep', 'react-prep-path'],
    cta: 'Open the React prep path',
  },
  {
    level: 'advanced',
    q: 'What is useActionState used for?',
    a: 'useActionState connects an action to state that updates when the action completes. It is useful when a form submit or mutation returns validation errors, success messages, or next state. The hook keeps pending and result handling close to the action, but the mutation contract still needs clear server and client ownership.',
    route: ['/guides', 'framework-prep', 'react-prep-path'],
    cta: 'Review React 19 actions',
  },
  {
    level: 'advanced',
    q: 'What is useOptimistic used for?',
    a: 'useOptimistic lets the UI show an expected result before the server confirms it. It is useful for quick feedback on mutations such as adding comments, toggling likes, or reordering items. The edge case is rollback and ordering: failed or out-of-order responses must not leave the UI in a false state.',
    route: ['/guides', 'framework-prep', 'react-prep-path'],
    cta: 'Review optimistic updates',
  },
  {
    level: 'advanced',
    q: 'What is useFormStatus used for?',
    a: 'useFormStatus reads the pending status of the nearest parent form submission. It lets a submit button or status message react to the form action without passing loading props through every component. It only works inside the form context, so placement matters.',
    route: ['/guides', 'framework-prep', 'react-prep-path'],
    cta: 'Review form status',
  },
  {
    level: 'advanced',
    q: 'What is use() with Suspense at a high level?',
    a: 'use() can read certain resources, such as promises or context, during rendering in supported React environments. When a promise is still pending, the nearest Suspense boundary can show fallback UI. The key requirement is that data ownership and caching are stable, otherwise rendering can repeatedly suspend or restart work.',
    route: ['/guides', 'framework-prep', 'react-prep-path'],
    cta: 'Review Suspense data flow',
  },
  {
    level: 'advanced',
    q: 'What is the difference between Server Components and Client Components?',
    a: 'Server Components render on the server and can access server-only data without shipping their component code to the browser. Client Components run in the browser and own interactivity, state, effects, and event handlers. Values passed from server to client boundaries must be serializable, and browser-only APIs belong on the client side.',
    route: ['/guides', 'framework-prep', 'react-prep-path'],
    cta: 'Review server/client boundaries',
  },
  {
    level: 'advanced',
    q: 'How do Next.js App Router boundaries affect data ownership?',
    a: 'The App Router encourages colocating data loading with server-rendered route segments and using client boundaries only where interactivity is needed. Caching, revalidation, and streaming behavior become part of the route contract. A good boundary keeps server data on the server while isolating client state to the smallest interactive surface.',
    route: ['/guides', 'framework-prep', 'react-prep-path'],
    cta: 'Open the React prep path',
  },
  {
    level: 'advanced',
    q: 'How do streaming, Suspense, and hydration mismatches fit together?',
    a: 'Streaming lets the server send usable HTML before every part of the UI is ready. Suspense boundaries define where loading fallbacks can appear while delayed content streams in. Hydration mismatches happen when the first client render disagrees with the server HTML, often because the output depends on time, randomness, browser state, or inconsistent data.',
    route: ['/react', 'coding', 'react-chat-streaming-ui'],
    cta: 'Practice streaming UI',
  },
];

const REACT_TESTING_QUESTIONS: ReactFocusedQuestionItem[] = [
  {
    level: 'intermediate',
    q: 'How should React Testing Library tests be written?',
    a: 'React Testing Library tests should assert behavior that a user can observe. Prefer role, label, text, and accessible name queries over component internals. A reliable test covers the visible state before and after interaction instead of asserting private methods or implementation details.',
    route: ['/guides', 'framework-prep', 'react-prep-path'],
    cta: 'Open the React testing prep path',
  },
  {
    level: 'intermediate',
    q: 'What is the difference between Jest and Vitest for React tests?',
    a: 'Jest and Vitest both provide test runners, assertions, mocks, and watch workflows. Vitest is often faster in Vite-based projects because it integrates with the Vite transform pipeline. The important choice is consistency with the app tooling, DOM environment, mocks, and coverage setup.',
    route: ['/guides', 'framework-prep', 'react-prep-path'],
    cta: 'Review React test tooling',
  },
  {
    level: 'advanced',
    q: 'What does act() do in React tests?',
    a: 'act() makes React flush updates related to an interaction or async step before assertions run. Testing utilities often wrap common user events for you, but warnings appear when a state update escapes the test boundary. The fix is to await the user action or async UI transition that causes the update.',
    route: ['/guides', 'framework-prep', 'react-prep-path'],
    cta: 'Review async test timing',
  },
  {
    level: 'intermediate',
    q: 'How do you test async loading and error UI?',
    a: 'Start by asserting the initial state, trigger the user action or render path, then wait for loading, success, or error text that the user sees. The test should cover at least one failure path when the component has recovery UI. Avoid asserting raw promise timing because the visible transition is the behavior that matters.',
    route: ['/guides', 'framework-prep', 'react-prep-path'],
    cta: 'Review async UI tests',
  },
  {
    level: 'advanced',
    q: 'How do mocked API tests with MSW-style boundaries work?',
    a: 'Mock Service Worker style tests intercept requests at the network boundary instead of mocking every fetch call manually. That keeps the component closer to production behavior while still controlling success, error, delay, and malformed-response cases. The test should assert the UI contract, not the internals of the data-fetching library.',
    route: ['/guides', 'framework-prep', 'react-prep-path'],
    cta: 'Review mocked API testing',
  },
  {
    level: 'intermediate',
    q: 'How do you test hooks through components?',
    a: 'A hook should be tested through a component when its value affects rendered UI or user interactions. That keeps the test aligned with React behavior such as render, commit, effects, and cleanup. Direct hook helpers can be useful for low-level reusable hooks, but user-facing behavior is usually safer to protect.',
    route: ['/guides', 'framework-prep', 'react-prep-path'],
    cta: 'Review hook testing',
  },
  {
    level: 'advanced',
    q: 'How does StrictMode affect effect tests?',
    a: 'StrictMode can run setup and cleanup more than once in development, which exposes effects that are not idempotent. Tests should not depend on an effect running exactly once when StrictMode is enabled. Assert the final user-visible behavior and make subscriptions, timers, and analytics calls cleanup-safe.',
    route: ['/react', 'trivia', 'react-strictmode-double-invoke-effects'],
    cta: 'Review StrictMode effects',
  },
  {
    level: 'intermediate',
    q: 'What makes React tests brittle?',
    a: 'React tests become brittle when they assert component names, state variables, exact DOM nesting, or implementation-specific mocks. They also become flaky when async updates, timers, and network responses are not awaited through visible UI. Prefer stable user-facing queries, realistic interactions, and one clear assertion target per behavior.',
    route: ['/guides', 'framework-prep', 'react-prep-path'],
    cta: 'Review React testing mistakes',
  },
];

const REACT_SCENARIO_QUESTIONS: ReactScenarioQuestionItem[] = [
  {
    level: 'advanced',
    q: 'Why can this delayed counter lose updates?',
    code: `function Counter() {
  const [count, setCount] = useState(0);

  function incrementLater() {
    setTimeout(() => setCount(count + 1), 500);
  }
}`,
    explanation: 'The timeout callback captures count from the render that created it. Multiple delayed clicks can all write the same next value. Use setCount((current) => current + 1) when the next value depends on previous state.',
    route: ['/react', 'trivia', 'react-stale-state-closures'],
    cta: 'Debug stale closures',
  },
  {
    level: 'advanced',
    q: 'What is wrong with this polling effect?',
    code: `useEffect(() => {
  const id = setInterval(() => poll(userId), 1000);
  return () => clearInterval(id);
}, []);`,
    explanation: 'The effect reads userId but never reruns when userId changes. That leaves the interval polling the user from the first render. Include the dependency, or move ownership so the interval is recreated and cleaned up when the user changes.',
    route: ['/react', 'trivia', 'react-useeffect-purpose'],
    cta: 'Review effect dependencies',
  },
  {
    level: 'intermediate',
    q: 'Why can an index key reset the wrong row state?',
    code: `{users.map((user, index) => (
  <UserRow key={index} user={user} />
))}`,
    explanation: 'React uses the key to match previous and next list items. If the list reorders or a row is inserted, an index key can point existing state at a different user. Use a stable ID from the data whenever row identity matters.',
    route: ['/react', 'trivia', 'react-keys-in-lists'],
    cta: 'Review list keys',
  },
  {
    level: 'advanced',
    q: 'Why can this Context provider rerender too much UI?',
    code: `<AppContext.Provider value={{ user, theme, cart, setCart }}>
  {children}
</AppContext.Provider>`,
    explanation: 'The provider creates a new object value whenever the parent renders, and every consumer sees the whole value as changed. Fast-changing cart state can rerender theme-only consumers. Split contexts or stabilize provider values around actual ownership boundaries.',
    route: ['/react', 'trivia', 'react-context-performance-issues'],
    cta: 'Debug Context fan-out',
  },
  {
    level: 'advanced',
    q: 'Why is this derived state unnecessary?',
    code: `const [fullName, setFullName] = useState('');

useEffect(() => {
  setFullName(first + ' ' + last);
}, [first, last]);`,
    explanation: 'fullName is a pure value derived from first and last, so storing it creates a second source of truth. The effect also adds an extra render after every name change. Calculate it during render, or use useMemo only if the calculation is expensive.',
    route: ['/react', 'trivia', 'react-derived-state-anti-pattern'],
    cta: 'Fix derived state',
  },
  {
    level: 'intermediate',
    q: 'Why does this input switch from uncontrolled to controlled?',
    code: `const [name, setName] = useState<string | undefined>();

return (
  <input value={name} onChange={(event) => setName(event.target.value)} />
);`,
    explanation: 'The input starts with value undefined, so React treats it as uncontrolled. After typing, value becomes a string and React treats it as controlled. Initialize with an empty string or provide value={name ?? ""} so ownership is consistent.',
    route: ['/react', 'trivia', 'react-controlled-vs-uncontrolled'],
    cta: 'Compare form ownership',
  },
  {
    level: 'advanced',
    q: 'Why does memoization not help this child?',
    code: `const MemoChart = memo(Chart);

return <MemoChart options={{ theme, stacked: true }} />;`,
    explanation: 'The options object is recreated on every parent render, so the memoized child receives a different prop reference each time. React.memo can only skip work when props are equal by the comparison being used. Stabilize the object with useMemo or pass simpler stable props if profiling shows the chart is expensive.',
    route: ['/react', 'trivia', 'react-usememo-vs-usecallback'],
    cta: 'Review memoization trade-offs',
  },
  {
    level: 'advanced',
    q: 'Why does this effect appear to run twice in development?',
    code: `useEffect(() => {
  analytics.startSession();
  return () => analytics.stopSession();
}, []);`,
    explanation: 'StrictMode can remount components in development to check that effects clean up correctly. The effect should tolerate setup, cleanup, and setup again without leaking subscriptions or duplicating permanent work. Move one-time application boot logic outside component effects when component lifetime is not the right owner.',
    route: ['/react', 'trivia', 'react-strictmode-double-invoke-effects'],
    cta: 'Review StrictMode behavior',
  },
];

const REACT_MODERN_QUESTIONS: ReactModernQuestionItem[] = [
  {
    level: 'intermediate',
    q: 'What changed with React 18 automatic batching?',
    a: 'React 18 batches more state updates that happen in promises, timeouts, native events, and other async callbacks. Batching reduces extra renders by applying related updates together. Code still should not expect state variables to change immediately after calling setters within the same render.',
    route: ['/react', 'trivia', 'react-why-batching-state-updates'],
    cta: 'Review batching',
  },
  {
    level: 'advanced',
    q: 'What does StrictMode check in modern React apps?',
    a: 'StrictMode enables extra development checks for unsafe rendering and effect behavior. It can reveal effects that do not clean up, render logic with side effects, and assumptions that fail under remounting. The fix is usually ownership and cleanup, not disabling StrictMode.',
    route: ['/react', 'trivia', 'react-strictmode-purpose'],
    cta: 'Review StrictMode purpose',
  },
  {
    level: 'advanced',
    q: 'What are Suspense boundaries used for?',
    a: 'Suspense boundaries let part of the UI show a fallback while a child is waiting for supported async work. They create loading boundaries instead of forcing the whole screen to block. Placement matters because a boundary that is too high hides too much UI, while one that is too low can create noisy loading fragments.',
    route: ['/guides', 'framework-prep', 'react-prep-path'],
    cta: 'Open the React prep path',
  },
  {
    level: 'advanced',
    q: 'What are transitions in React?',
    a: 'Transitions mark updates as non-urgent so React can keep urgent interactions responsive. They are useful when typing, clicking, or selecting should stay immediate while expensive UI updates can lag slightly. They do not make slow code fast, so profiling and splitting expensive work still matter.',
    route: ['/react', 'trivia', 'react-prevent-unnecessary-rerenders'],
    cta: 'Review render performance',
  },
  {
    level: 'advanced',
    q: 'What are React Server Components at a high level?',
    a: 'Server Components render on the server and can access server-only resources without shipping their component code to the browser. Client Components still handle browser interactivity, state, effects, and event handlers. The boundary matters because props crossing from server to client must be serializable.',
    route: ['/guides', 'framework-prep', 'react-prep-path'],
    cta: 'Open the React prep path',
  },
  {
    level: 'advanced',
    q: 'How do you debug a hydration mismatch?',
    a: 'A hydration mismatch happens when server-rendered markup does not match the first client render. Common causes include time-dependent output, random IDs, browser-only data, locale differences, and conditional rendering that differs between server and client. Make the initial render deterministic, then move browser-only reads into effects or client-only boundaries.',
    route: ['/guides', 'framework-prep', 'react-prep-path'],
    cta: 'Open the React prep path',
  },
  {
    level: 'advanced',
    q: 'When should React use an external store or server-state library?',
    a: 'Use local state for state owned by one component or a small subtree. Use Context sparingly for shared low-frequency values, and consider an external store when many components read and write frequently. Server-state libraries are a better fit for caching, dedupe, retries, stale data, and request status than hand-rolled effects.',
    route: ['/react', 'trivia', 'react-context-performance-issues'],
    cta: 'Compare Context and stores',
  },
  {
    level: 'intermediate',
    q: 'How should React behavior be tested?',
    a: 'React tests should assert user-visible behavior instead of private implementation details. Good coverage includes initial render, interactions, validation, loading, error, cleanup, and rerender edge cases. Testing Library style queries keep tests closer to the way users and assistive technology observe the UI.',
    route: ['/guides', 'framework-prep', 'react-prep-path'],
    cta: 'Open the React prep path',
  },
];

const REACT_TOPIC_CARDS: ReactTopicCard[] = [
  {
    title: 'Props, state, and one-way data flow',
    answer: 'Props are read-only inputs owned by a parent, while state belongs to the component that changes it. Use callbacks to request parent state changes, lift state when siblings need the same value, and keep updates immutable so rerender behavior stays predictable.',
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

const HTML_CSS_EDITORIAL_SIGNAL: HtmlCssEditorialSignal = {
  reviewedLabel: 'Reviewed May 20, 2026',
  reviewer: 'FrontendAtlas Editor',
  coverage: '65 visible HTML and CSS questions across semantics, forms, accessibility, layout, cascade, responsive UI, code scenarios, and browser debugging',
  dateModified: '2026-05-20T00:00:00.000Z',
};

const HTML_CSS_ANCHOR_ITEMS: HtmlCssAnchorItem[] = [
  { label: 'Clusters', targetId: 'iq-html-css-clusters-title' },
  { label: 'Short answers', targetId: 'iq-html-css-short-answers-title' },
  { label: 'Audience', targetId: 'iq-html-css-audience-title' },
  { label: 'Semantics + forms', targetId: 'iq-html-css-semantics-title' },
  { label: 'Layout + cascade', targetId: 'iq-html-css-layout-title' },
  { label: 'Code scenarios', targetId: 'iq-html-css-code-title' },
  { label: 'Browser debugging', targetId: 'iq-html-css-browser-title' },
  { label: 'Responsive UI', targetId: 'iq-html-css-responsive-title' },
  { label: 'Coding drills', targetId: 'iq-html-css-coding-preview-title' },
  { label: 'Concepts', targetId: 'iq-html-css-concept-preview-title' },
];

const HTML_CSS_KEYWORD_CLUSTERS: HtmlCssKeywordClusterItem[] = [
  {
    label: 'Beginner',
    targetId: 'iq-html-css-short-answers-title',
    detail: 'HTML structure, forms, labels, box model, cascade, and basic responsive rules.',
  },
  {
    label: 'Experienced',
    targetId: 'iq-html-css-audience-title',
    detail: 'Debugging, trade-offs, accessibility constraints, and production UI reasoning.',
  },
  {
    label: 'Semantics + forms',
    targetId: 'iq-html-css-semantics-title',
    detail: 'Landmarks, headings, native controls, validation, labels, and useful ARIA boundaries.',
  },
  {
    label: 'CSS layout',
    targetId: 'iq-html-css-layout-title',
    detail: 'Flexbox, Grid, positioning, stacking, specificity, cascade, and custom properties.',
  },
  {
    label: 'Code scenarios',
    targetId: 'iq-html-css-code-title',
    detail: 'Small markup and CSS snippets that reveal real layout, accessibility, and overflow behavior.',
  },
  {
    label: 'Responsive UI',
    targetId: 'iq-html-css-responsive-title',
    detail: 'Mobile-first constraints, responsive images, container behavior, and layout stability.',
  },
];

const HTML_CSS_SHORT_ANSWERS: HtmlCssShortAnswerItem[] = [
  {
    q: 'What is semantic HTML?',
    a: 'Semantic HTML uses elements that describe the meaning and structure of content, such as header, nav, main, article, section, button, and form. It helps browsers, search engines, assistive technologies, and other developers understand the page without guessing from class names. A common failure is replacing native buttons, links, and headings with generic div elements that then need extra keyboard and accessibility work.',
    route: ['/html', 'trivia', 'html-semantic-elements'],
    cta: 'Practice semantic HTML',
    category: 'html',
    level: 'beginner',
  },
  {
    q: 'What is the DOM?',
    a: 'The DOM is the browser-created object tree that represents the parsed HTML document. JavaScript reads and updates this tree, while CSS selectors match elements in it for styling. The source HTML and live DOM can differ after scripts run, so debugging often means inspecting the current DOM instead of only reading the original markup.',
    category: 'html',
    level: 'beginner',
  },
  {
    q: 'How should labels work in HTML forms?',
    a: 'A form control needs a durable accessible name, usually from a label associated with for and id or by wrapping the control. Labels increase the clickable target and help screen-reader users understand the field. Placeholder text is not a replacement because it disappears during input and may not be announced as a stable label.',
    route: ['/html', 'coding', 'html-contact-form-labeled'],
    cta: 'Build labeled forms',
    category: 'accessibility',
    level: 'beginner',
  },
  {
    q: 'What is accessibility in HTML and CSS?',
    a: 'Accessibility means the UI can be understood and operated by people using keyboards, screen readers, zoom, high contrast, or other assistive technology. HTML provides much of the semantic contract, while CSS must preserve readable contrast, focus visibility, and usable layout. A design can look correct but still fail if focus order, labels, or hidden content are wrong.',
    route: ['/html', 'trivia', 'web-accessibility-make-page-accessible'],
    cta: 'Review accessibility fixes',
    category: 'accessibility',
    level: 'beginner',
  },
  {
    q: 'How should alt text work for images?',
    a: 'Alt text describes the purpose of an image when the image carries information. Decorative images should usually have empty alt text so assistive technology can skip them. The edge case is an image inside a link or button, where the alt text may need to describe the action rather than the visual pixels.',
    route: ['/html', 'coding', 'html-links-and-images'],
    cta: 'Practice links and images',
    category: 'accessibility',
    level: 'beginner',
  },
  {
    q: 'When should you use a button instead of a link?',
    a: 'Use a link for navigation to another URL or location, and use a button for an action on the current page. Native elements provide the expected keyboard behavior, roles, focus handling, and activation events. A fake link or fake button often breaks keyboard access unless you rebuild behavior the browser already gives you.',
    category: 'html',
    level: 'beginner',
  },
  {
    q: 'How does native form validation work?',
    a: 'Native validation uses attributes such as required, type, min, max, pattern, and minlength to let the browser check common constraints. It reduces custom JavaScript but should be paired with clear labels and useful error text. Server-side validation is still required because client-side validation can be bypassed.',
    route: ['/html', 'coding', 'html-forms-validation-required'],
    cta: 'Practice form validation',
    category: 'html',
    level: 'intermediate',
  },
  {
    q: 'What metadata belongs in the head?',
    a: 'A production document should include charset, viewport, title, useful description, canonical when needed, and relevant social metadata. These tags help browsers render correctly and help crawlers understand the page. Missing viewport metadata is a common mobile bug because the layout may render at a desktop-style width on phones.',
    route: ['/html', 'coding', 'html-head-seo-basics'],
    cta: 'Review head metadata',
    category: 'html',
    level: 'beginner',
  },
  {
    q: 'What is the CSS box model?',
    a: 'The box model describes how content, padding, border, and margin combine to determine an element box and spacing around it. With content-box, width applies to the content area, while border-box includes padding and border in the declared width. Many layout bugs come from forgetting which sizing model is active.',
    route: ['/css', 'trivia', 'css-box-model'],
    cta: 'Review the box model',
    category: 'css',
    level: 'beginner',
  },
  {
    q: 'How does the CSS cascade work?',
    a: 'The cascade decides which declaration wins when more than one rule applies to the same property. It considers origin, importance, cascade layers, specificity, scoping proximity, and source order. Source order only wins after the earlier cascade factors are effectively tied.',
    route: ['/css', 'trivia', 'css-cascade-order'],
    cta: 'Review cascade order',
    category: 'css',
    level: 'intermediate',
  },
  {
    q: 'What is CSS specificity?',
    a: 'Specificity is the selector scoring system used when competing rules are in the same cascade layer and origin. Inline styles, IDs, classes or attributes, and element selectors contribute different weight. A common failure is fixing conflicts by adding more specific selectors until the stylesheet becomes hard to override.',
    route: ['/css', 'trivia', 'css-specificity-hierarchy'],
    cta: 'Practice specificity',
    category: 'css',
    level: 'intermediate',
  },
  {
    q: 'When should you use Flexbox?',
    a: 'Flexbox is best for one-dimensional layout where items flow in a row or column and need alignment or space distribution. It works well for nav bars, button groups, media objects, and vertically centered content. The trade-off is that complex two-dimensional placement is usually clearer with Grid.',
    route: ['/css', 'trivia', 'css-display-flex'],
    cta: 'Review Flexbox',
    category: 'css',
    level: 'beginner',
  },
  {
    q: 'When should you use CSS Grid?',
    a: 'Grid is best for two-dimensional layout where rows and columns both matter. It lets you define tracks, gaps, named areas, and responsive templates without relying on extra wrappers. It can be overkill for a simple row of controls where Flexbox would be easier to maintain.',
    route: ['/css', 'trivia', 'css-grid-vs-flexbox'],
    cta: 'Compare Grid and Flexbox',
    category: 'css',
    level: 'intermediate',
  },
  {
    q: 'How does CSS positioning work?',
    a: 'Positioning changes how an element participates in normal document flow and how offsets are calculated. Relative keeps the element in flow, absolute positions against the nearest positioned ancestor, fixed attaches to the viewport, and sticky switches behavior based on scroll. Many bugs happen because the expected containing block is not the one the browser uses.',
    route: ['/css', 'trivia', 'css-position-relative-absolute-fixed'],
    cta: 'Review positioning',
    category: 'css',
    level: 'intermediate',
  },
  {
    q: 'How does z-index work?',
    a: 'z-index only compares elements inside the relevant stacking context. New stacking contexts can be created by positioned elements, transforms, opacity, filters, isolation, and other properties. Raising a z-index value will not beat an element in a higher parent stacking context.',
    route: ['/css', 'trivia', 'css-z-index'],
    cta: 'Debug z-index',
    category: 'css',
    level: 'intermediate',
  },
  {
    q: 'What are media queries used for?',
    a: 'Media queries apply CSS conditionally based on viewport, device, user preference, or environment features. They are commonly used for layout changes, reduced motion, dark mode, and print styles. Good responsive CSS changes constraints and flow, not only font sizes.',
    route: ['/css', 'trivia', 'css-media-queries'],
    cta: 'Review media queries',
    category: 'responsive-debugging',
    level: 'beginner',
  },
  {
    q: 'How do responsive images work?',
    a: 'Responsive images use srcset, sizes, picture, and modern loading attributes to let the browser choose an appropriate resource. The goal is to avoid shipping oversized images while preserving sharpness and layout stability. Width and height or aspect-ratio should be set so the page does not jump while images load.',
    category: 'responsive-debugging',
    level: 'intermediate',
  },
  {
    q: 'What are CSS custom properties?',
    a: 'CSS custom properties are variables declared with names such as --space and read with var(). They cascade, inherit by default, and can change at runtime without recompiling CSS. A missing fallback or unexpected inheritance path can make a component pick up the wrong token.',
    category: 'css',
    level: 'intermediate',
  },
  {
    q: 'What are pseudo-classes and pseudo-elements?',
    a: 'Pseudo-classes select an element in a state, such as :hover, :focus-visible, :checked, or :nth-child(). Pseudo-elements style a generated part of an element, such as ::before, ::after, or ::marker. The practical edge case is focus styling: :focus-visible is usually better than removing outlines globally.',
    category: 'css',
    level: 'intermediate',
  },
  {
    q: 'How do you debug CSS overflow?',
    a: 'Start by identifying which element is wider or taller than its container, then inspect fixed widths, long unwrapped text, min-width defaults, grid tracks, and absolute positioning. Flex and grid children often need min-width: 0 or min-height: 0 to shrink as expected. Hiding overflow can mask the symptom while leaving keyboard focus or content access broken.',
    route: ['/css', 'trivia', 'css-make-element-responsive'],
    cta: 'Practice responsive fixes',
    category: 'responsive-debugging',
    level: 'advanced',
  },
  {
    q: 'What causes layout shift?',
    a: 'Layout shift happens when content moves after initial render because dimensions, fonts, ads, images, or async UI were not reserved. Set stable dimensions, reserve space for dynamic regions, and avoid inserting content above what the user is reading. The failure mode is a page that passes visual review but feels unstable while loading.',
    category: 'responsive-debugging',
    level: 'advanced',
  },
  {
    q: 'How should focus states be styled?',
    a: 'Focus states should be visible, consistent, and not depend only on color. Use :focus-visible to show keyboard focus without adding noisy outlines for pointer users. Removing outlines globally breaks keyboard navigation and makes interactive elements hard to locate.',
    category: 'accessibility',
    level: 'intermediate',
  },
  {
    q: 'What is the difference between block, inline, and inline-block?',
    a: 'Block elements start on a new line and usually fill the available width. Inline elements flow with text and do not accept width and height in the same way, while inline-block keeps inline flow but allows box dimensions. Confusing these display modes often causes unexpected spacing, alignment, or clickable-area bugs.',
    category: 'css',
    level: 'beginner',
  },
  {
    q: 'How do rem, em, px, and percent differ?',
    a: 'px is an absolute CSS pixel unit, rem is relative to the root font size, em is relative to the current element font size, and percent depends on the property and containing context. rem is often easier for consistent spacing and type scales, while em can be useful for component-relative sizing. Percent can be powerful but surprising when height or transforms use a different reference than expected.',
    category: 'responsive-debugging',
    level: 'intermediate',
  },
  {
    q: 'How do you make an HTML and CSS component responsive?',
    a: 'Start with semantic markup and fluid layout constraints, then add breakpoints only where the component actually needs a different structure. Use max-width, minmax(), flexible tracks, wrapping, responsive images, and stable spacing tokens. Test narrow widths, long text, zoom, keyboard focus, and overflow instead of only resizing a desktop viewport.',
    route: ['/css', 'trivia', 'css-make-element-responsive'],
    cta: 'Practice responsive CSS',
    category: 'responsive-debugging',
    level: 'advanced',
  },
];

const HTML_CSS_AUDIENCE_TRACKS: HtmlCssAudienceTrack[] = [
  {
    title: 'HTML and CSS interview questions for beginners',
    detail: 'Start with valid document structure, semantic elements, labels, forms, the box model, basic selectors, Flexbox, Grid, and media queries. The goal is to explain what the browser gives you before reaching for custom scripts or heavy abstractions.',
  },
  {
    title: 'HTML and CSS interview questions for experienced frontend developers',
    detail: 'Move into accessibility trade-offs, cascade strategy, layout debugging, stacking contexts, responsive images, performance, stable dimensions, and browser rendering behavior. Experienced answers should connect UI constraints to maintainable markup and CSS decisions.',
  },
];

const HTML_CSS_SEMANTICS_QUESTIONS: HtmlCssFocusedQuestionItem[] = [
  {
    q: 'How do landmarks improve a page?',
    a: 'Landmarks such as header, nav, main, aside, and footer divide the page into recognizable regions. They help assistive technology users jump through the page without reading every element. The page should normally have one main landmark, and landmarks should represent real regions rather than decorative wrappers.',
    route: ['/html', 'trivia', 'html-semantic-elements'],
    cta: 'Review semantic elements',
    level: 'beginner',
  },
  {
    q: 'How should headings be structured?',
    a: 'Headings create an outline that helps users scan the page and understand content hierarchy. Use heading levels for structure, not for visual size. Skipping levels or using headings only for styling can make the page harder to navigate with assistive technology.',
    level: 'beginner',
  },
  {
    q: 'When should you add ARIA?',
    a: 'Add ARIA when native HTML cannot express the role, state, or relationship you need. Native controls should come first because they already include keyboard and accessibility behavior. Misused ARIA can create a worse accessibility tree than plain semantic markup.',
    route: ['/html', 'trivia', 'web-accessibility-make-page-accessible'],
    cta: 'Practice accessibility review',
    level: 'intermediate',
  },
  {
    q: 'How should form errors be exposed?',
    a: 'Form errors should be visible, specific, and connected to the affected control. Use text near the field, update aria-describedby when helpful, and keep focus behavior predictable after submission. Color alone is not enough because users may miss the state or use assistive technology.',
    route: ['/html', 'coding', 'html-forms-validation-required'],
    cta: 'Build validation states',
    level: 'intermediate',
  },
  {
    q: 'How do tables stay accessible?',
    a: 'Data tables need real table markup, a useful caption when context is not obvious, and header cells that define row or column meaning. Complex tables may need scope or header associations. Layout tables should be avoided because they create misleading relationships for assistive technology.',
    level: 'intermediate',
  },
  {
    q: 'How should a dialog be implemented?',
    a: 'A dialog should expose modal state, focus the right starting point, keep keyboard focus inside while open, and restore focus when closed. The native dialog element can help, but the surrounding interaction still needs careful labels and escape behavior. A visually correct overlay is incomplete if background content remains reachable by keyboard.',
    route: ['/html', 'coding', 'html-dialog-confirm-a11y'],
    cta: 'Practice dialog accessibility',
    level: 'advanced',
  },
  {
    q: 'How do anchors and buttons affect keyboard behavior?',
    a: 'Anchors activate with Enter and navigate, while buttons activate with Enter or Space and trigger actions. Using the wrong element changes expected keyboard behavior and screen-reader announcement. Styling can make them look alike, but semantics should follow the user action.',
    level: 'beginner',
  },
  {
    q: 'How do you test HTML accessibility quickly?',
    a: 'Check keyboard navigation, visible focus, labels, headings, landmarks, image text, and form errors before relying on automated tools. Then run a validator, axe or Lighthouse, and inspect the accessibility tree for names and roles. Automated checks catch many issues but cannot prove that the interaction makes sense.',
    route: ['/html', 'trivia', 'web-accessibility-make-page-accessible'],
    cta: 'Review an accessibility flow',
    level: 'advanced',
  },
];

const HTML_CSS_LAYOUT_QUESTIONS: HtmlCssFocusedQuestionItem[] = [
  {
    q: 'How do Flexbox and Grid differ?',
    a: 'Flexbox lays out items along one main axis and is strongest for alignment and distribution within a row or column. Grid defines rows and columns together, so it is better for two-dimensional page or card layouts. Mixing them is normal: Grid can place regions, and Flexbox can align content inside a region.',
    route: ['/css', 'trivia', 'css-grid-vs-flexbox'],
    cta: 'Compare layout systems',
    level: 'intermediate',
  },
  {
    q: 'How do cascade layers change CSS conflicts?',
    a: 'Cascade layers let you group CSS by priority before specificity is compared. A low-specificity rule in a later layer can beat a highly specific rule in an earlier layer. This is useful for separating reset, theme, component, and override CSS without escalating selectors.',
    route: ['/css', 'trivia', 'css-cascade-order'],
    cta: 'Review cascade rules',
    level: 'advanced',
  },
  {
    q: 'How do you avoid specificity wars?',
    a: 'Use predictable selectors, keep component scopes shallow, and reserve high specificity for real overrides. Cascade layers, custom properties, and utility classes can reduce the need for nested selectors. The failure mode is CSS that works once but becomes impossible to safely change.',
    route: ['/css', 'trivia', 'css-specificity-hierarchy'],
    cta: 'Practice specificity',
    level: 'intermediate',
  },
  {
    q: 'How does position sticky fail?',
    a: 'Sticky positioning depends on scroll containment, offsets, and available space inside the parent. It often fails when an ancestor has overflow that creates a different scroll container or when the sticky element has no room to move. Debug by inspecting ancestors and the element offsets, not just z-index.',
    route: ['/css', 'trivia', 'css-position-relative-absolute-fixed'],
    cta: 'Review positioning',
    level: 'advanced',
  },
  {
    q: 'How do stacking contexts affect overlays?',
    a: 'An overlay can appear behind another element even with a large z-index if it is trapped in a lower stacking context. Transforms, opacity, filters, isolation, and positioned elements can create those contexts. Fixing the parent context or DOM placement is often better than increasing z-index values.',
    route: ['/css', 'trivia', 'css-z-index'],
    cta: 'Debug stacking',
    level: 'advanced',
  },
  {
    q: 'How should CSS custom properties be scoped?',
    a: 'Global tokens should describe broad design values, while component-level custom properties should expose controlled styling hooks. Because custom properties inherit, a value can travel farther than expected. Scope names and fallbacks should make overrides intentional.',
    level: 'intermediate',
  },
  {
    q: 'How do you choose breakpoints?',
    a: 'Choose breakpoints where the content or component starts to fail, not only common device widths. A card may need a breakpoint because text wraps poorly or controls no longer fit. Content-driven breakpoints age better than a fixed list of device sizes.',
    route: ['/css', 'trivia', 'css-media-queries'],
    cta: 'Review media queries',
    level: 'intermediate',
  },
  {
    q: 'How do you keep CSS maintainable at scale?',
    a: 'Keep selectors predictable, avoid accidental global leakage, document tokens, and make component states explicit. Prefer small layout primitives and clear naming over deeply nested selectors. Maintainability breaks when every new UI requires a more specific override than the last one.',
    level: 'advanced',
  },
];

const HTML_CSS_CODE_SCENARIOS: HtmlCssCodeQuestionItem[] = [
  {
    q: 'Why is this input hard to use with assistive technology?',
    code: `<input placeholder="Email" type="email">`,
    explanation: 'The input has no durable accessible label. Add a label connected with for and id so the field name remains available after the user starts typing. Placeholder text can still provide an example, but it should not be the only name.',
    route: ['/html', 'coding', 'html-contact-form-labeled'],
    cta: 'Fix labeled forms',
    level: 'beginner',
  },
  {
    q: 'Why can this image link have a poor accessible name?',
    code: `<a href="/pricing">\n  <img src="arrow.png" alt="arrow">\n</a>`,
    explanation: 'The link name becomes the image alt text, so "arrow" does not describe the destination or action. Use alt text such as "View pricing" or add visible text. The accessible name should match what the link does.',
    route: ['/html', 'coding', 'html-links-and-images'],
    cta: 'Practice links and images',
    level: 'beginner',
  },
  {
    q: 'Why does this flex item overflow?',
    code: `.row { display: flex; }\n.title { white-space: nowrap; }`,
    explanation: 'Flex items have an automatic minimum size that can prevent shrinking below content width. Add min-width: 0 to the flex child that must shrink, then apply overflow handling intentionally. Setting overflow hidden on the parent may hide the symptom without fixing the layout constraint.',
    route: ['/css', 'trivia', 'css-make-element-responsive'],
    cta: 'Practice responsive fixes',
    level: 'advanced',
  },
  {
    q: 'Why does this grid create horizontal scroll?',
    code: `.cards {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n}`,
    explanation: 'Three fixed columns can exceed the viewport when the container is narrow. Use responsive tracks such as repeat(auto-fit, minmax(220px, 1fr)) or add a breakpoint. The fix should preserve card readability and avoid squeezing content below its usable width.',
    route: ['/css', 'coding', 'css-grid-card-gallery'],
    cta: 'Build a responsive grid',
    level: 'intermediate',
  },
  {
    q: 'Why does this modal appear behind the header?',
    code: `.header { position: relative; z-index: 10; }\n.page { transform: translateZ(0); }\n.modal { position: fixed; z-index: 9999; }`,
    explanation: 'The transformed parent can create a stacking context that changes how the fixed modal is layered. A large z-index inside one context cannot beat a different parent context. Move the overlay to a safer root or adjust the stacking context hierarchy.',
    route: ['/css', 'trivia', 'css-z-index'],
    cta: 'Review z-index',
    level: 'advanced',
  },
  {
    q: 'Why is this button not keyboard friendly?',
    code: `<div class="button" onclick="save()">Save</div>`,
    explanation: 'A div does not provide button semantics, keyboard activation, disabled behavior, or the expected role. Use a real button and style it with CSS. Rebuilding native behavior with roles and key handlers is more error-prone than using the correct element.',
    level: 'beginner',
  },
  {
    q: 'Why can this hero image cause layout shift?',
    code: `<img src="/hero.jpg" alt="Dashboard preview">`,
    explanation: 'The browser does not know the image dimensions before it loads, so surrounding content can move when the image appears. Add width and height or an aspect-ratio so space is reserved. Responsive CSS can still scale the image after the intrinsic ratio is known.',
    level: 'intermediate',
  },
  {
    q: 'Why does this required field still need server validation?',
    code: `<input name="email" type="email" required>`,
    explanation: 'The browser can block common invalid submissions, but users or scripts can bypass client-side validation. Server validation protects the real data boundary and should return useful errors. Client validation improves user experience, not application trust.',
    route: ['/html', 'coding', 'html-forms-validation-required'],
    cta: 'Practice validation',
    level: 'intermediate',
  },
];

const HTML_CSS_BROWSER_DEBUG_QUESTIONS: HtmlCssFocusedQuestionItem[] = [
  {
    q: 'How does the browser turn HTML and CSS into pixels?',
    a: 'The browser parses HTML into the DOM, parses CSS into style rules, calculates computed styles, builds layout, paints, and composites layers. JavaScript or resource loading can interrupt parts of this process. Performance work starts by identifying whether the problem is style, layout, paint, compositing, or scripting.',
    level: 'advanced',
  },
  {
    q: 'What is a reflow or layout recalculation?',
    a: 'A layout recalculation happens when the browser must recompute element geometry. It can be triggered by DOM changes, class changes, font loading, image sizing, or reading layout after writing styles. Batching reads and writes reduces repeated layout work.',
    level: 'advanced',
  },
  {
    q: 'How do you debug an element that is not clickable?',
    a: 'Inspect whether another element is covering it, whether pointer-events is disabled, whether the element is outside its visible box, and whether it is actually a link or button. Stacking context and overflow clipping are common causes. The fix should preserve keyboard access, not only pointer clicks.',
    route: ['/css', 'trivia', 'css-z-index'],
    cta: 'Review stacking behavior',
    level: 'intermediate',
  },
  {
    q: 'How do you debug missing styles?',
    a: 'Check whether the stylesheet loaded, whether the selector matches, whether another declaration wins in the cascade, and whether the property is valid for that element. DevTools computed styles show the winning and overridden declarations. The fastest path is to inspect the actual element state instead of reading the stylesheet in isolation.',
    route: ['/css', 'trivia', 'css-cascade-order'],
    cta: 'Review the cascade',
    level: 'beginner',
  },
  {
    q: 'How do you debug invisible content?',
    a: 'Check display, visibility, opacity, color contrast, clipping, overflow, positioning, transforms, and whether the content exists in the DOM. Content can be present but inaccessible if it is visually hidden incorrectly or removed from the accessibility tree. The fix depends on whether the content should be hidden from everyone or only visually.',
    level: 'intermediate',
  },
  {
    q: 'How do fonts affect layout?',
    a: 'Font loading can change text metrics and cause layout shifts when the final font replaces a fallback. Use good fallback stacks, font-display choices, size-adjust where appropriate, and stable layout constraints. Long labels should be tested because they often reveal font and wrapping issues.',
    level: 'advanced',
  },
  {
    q: 'How do you debug mobile viewport issues?',
    a: 'Check the viewport meta tag, fixed widths, min-width values, overflowing grids, absolute positioning, and controls that do not wrap. Simulate narrow widths and zoom, then test on a real device when possible. The issue is often a single child that refuses to shrink.',
    route: ['/html', 'coding', 'html-head-seo-basics'],
    cta: 'Review viewport metadata',
    level: 'intermediate',
  },
  {
    q: 'How do you debug focus order?',
    a: 'Navigate with the keyboard and compare the focus order to the visual and DOM order. Positive tabindex values usually create fragile ordering and should be avoided. If focus disappears into hidden or offscreen content, the hiding and modal behavior need to be fixed.',
    route: ['/html', 'coding', 'html-dialog-confirm-a11y'],
    cta: 'Practice focus handling',
    level: 'advanced',
  },
];

const HTML_CSS_RESPONSIVE_QUESTIONS: HtmlCssFocusedQuestionItem[] = [
  {
    q: 'What does mobile-first CSS mean?',
    a: 'Mobile-first CSS starts with the narrowest useful layout and adds complexity as space becomes available. This usually creates fewer overrides because the base styles handle constrained screens. The edge case is a desktop-only component that still needs a usable narrow fallback.',
    route: ['/css', 'trivia', 'css-media-queries'],
    cta: 'Review responsive CSS',
    level: 'beginner',
  },
  {
    q: 'How do container queries differ from media queries?',
    a: 'Media queries react to the viewport or environment, while container queries react to the size or style context of a container. Container queries make reusable components adapt where they are placed. They are most useful when the same component appears in a sidebar, grid, and full-width region.',
    level: 'advanced',
  },
  {
    q: 'How should a navigation bar adapt on small screens?',
    a: 'The nav should preserve readable labels, reachable focus states, and clear current-location cues. Flex wrapping, overflow menus, or a disclosure pattern can work depending on item count. A responsive nav fails if it only hides links without giving users another path to them.',
    route: ['/css', 'coding', 'css-flexbox-navbar'],
    cta: 'Build a responsive nav',
    level: 'intermediate',
  },
  {
    q: 'How should cards adapt in a responsive grid?',
    a: 'Cards should keep readable text, stable media ratios, and consistent action placement as columns change. Grid with minmax() and auto-fit can reduce breakpoint code while preserving minimum card width. Test long titles and missing images because they expose fragile card layouts.',
    route: ['/css', 'coding', 'css-grid-card-gallery'],
    cta: 'Build card grids',
    level: 'intermediate',
  },
  {
    q: 'How do you handle long words and untrusted text?',
    a: 'Long words, URLs, and user-generated strings can break otherwise clean layouts. Use overflow-wrap, min-width: 0, max-width constraints, and clear truncation rules when content must stay on one line. Truncation should not hide essential information without another way to access it.',
    route: ['/css', 'trivia', 'css-make-element-responsive'],
    cta: 'Fix responsive overflow',
    level: 'advanced',
  },
  {
    q: 'How do you keep touch targets usable?',
    a: 'Interactive controls need enough physical size and spacing to avoid accidental taps. CSS should not shrink buttons below a usable hit area just to fit a dense layout. If space is tight, wrapping or grouping controls is better than making them tiny.',
    level: 'intermediate',
  },
  {
    q: 'How do reduced motion preferences affect CSS?',
    a: 'The prefers-reduced-motion media query lets users request less animation. Use it to remove or simplify motion that can distract, delay, or cause discomfort. Essential state changes should still be visible without relying on animation.',
    route: ['/css', 'trivia', 'css-media-queries'],
    cta: 'Review media features',
    level: 'intermediate',
  },
  {
    q: 'How do you test responsive HTML and CSS before shipping?',
    a: 'Test narrow and wide widths, zoom, long text, keyboard navigation, image loading, and common device sizes. Inspect overflow, focus visibility, layout shift, and readable contrast. A page that only passes one viewport can still fail real users because content and device constraints vary.',
    route: ['/css', 'trivia', 'css-make-element-responsive'],
    cta: 'Practice responsive review',
    level: 'advanced',
  },
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
      return 'HTML and CSS interview questions and answers for UI rounds, with short answers, code scenarios, semantic markup, accessibility, layout, cascade, responsive behavior, and browser debugging.';
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

  scrollToReactSection(targetId: string): void {
    this.scrollToSection(targetId);
  }

  scrollToHtmlCssSection(targetId: string): void {
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

  reactEditorialSignal(): ReactEditorialSignal {
    return REACT_EDITORIAL_SIGNAL;
  }

  reactAnchorItems(): ReactAnchorItem[] {
    return REACT_ANCHOR_ITEMS;
  }

  reactKeywordClusters(): ReactKeywordClusterItem[] {
    return REACT_KEYWORD_CLUSTERS;
  }

  reactShortAnswers(): ReactShortAnswerItem[] {
    return REACT_SHORT_ANSWERS;
  }

  reactAudienceTracks(): ReactAudienceTrack[] {
    return REACT_AUDIENCE_TRACKS;
  }

  reactRenderingInternalsQuestions(): ReactFocusedQuestionItem[] {
    return REACT_RENDERING_INTERNALS_QUESTIONS;
  }

  reactReact19ServerQuestions(): ReactFocusedQuestionItem[] {
    return REACT_REACT19_SERVER_QUESTIONS;
  }

  reactTestingQuestions(): ReactFocusedQuestionItem[] {
    return REACT_TESTING_QUESTIONS;
  }

  reactScenarioQuestions(): ReactScenarioQuestionItem[] {
    return REACT_SCENARIO_QUESTIONS;
  }

  reactModernQuestions(): ReactModernQuestionItem[] {
    return REACT_MODERN_QUESTIONS;
  }

  reactShortAnswerCategoryLabel(category: ReactShortAnswerCategory): string {
    switch (category) {
      case 'fundamentals':
        return 'Fundamentals';
      case 'state-hooks':
        return 'State + hooks';
      case 'rendering-performance':
        return 'Rendering + performance';
      default:
        return 'Modern React';
    }
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

  htmlCssEditorialSignal(): HtmlCssEditorialSignal {
    return HTML_CSS_EDITORIAL_SIGNAL;
  }

  htmlCssAnchorItems(): HtmlCssAnchorItem[] {
    return HTML_CSS_ANCHOR_ITEMS;
  }

  htmlCssKeywordClusters(): HtmlCssKeywordClusterItem[] {
    return HTML_CSS_KEYWORD_CLUSTERS;
  }

  htmlCssShortAnswers(): HtmlCssShortAnswerItem[] {
    return HTML_CSS_SHORT_ANSWERS;
  }

  htmlCssAudienceTracks(): HtmlCssAudienceTrack[] {
    return HTML_CSS_AUDIENCE_TRACKS;
  }

  htmlCssSemanticsQuestions(): HtmlCssFocusedQuestionItem[] {
    return HTML_CSS_SEMANTICS_QUESTIONS;
  }

  htmlCssLayoutQuestions(): HtmlCssFocusedQuestionItem[] {
    return HTML_CSS_LAYOUT_QUESTIONS;
  }

  htmlCssCodeScenarios(): HtmlCssCodeQuestionItem[] {
    return HTML_CSS_CODE_SCENARIOS;
  }

  htmlCssBrowserDebugQuestions(): HtmlCssFocusedQuestionItem[] {
    return HTML_CSS_BROWSER_DEBUG_QUESTIONS;
  }

  htmlCssResponsiveQuestions(): HtmlCssFocusedQuestionItem[] {
    return HTML_CSS_RESPONSIVE_QUESTIONS;
  }

  htmlCssShortAnswerCategoryLabel(category: HtmlCssShortAnswerCategory): string {
    switch (category) {
      case 'html':
        return 'HTML';
      case 'css':
        return 'CSS';
      case 'accessibility':
        return 'Accessibility';
      default:
        return 'Responsive + debugging';
    }
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
      collectionPage['dateModified'] = REACT_EDITORIAL_SIGNAL.dateModified;
      collectionPage['reviewedBy'] = {
        '@type': 'Organization',
        name: REACT_EDITORIAL_SIGNAL.reviewer,
      };
      collectionPage['about'] = [
        ...(collectionPage['about'] || []),
        { '@type': 'Thing', name: 'React interview questions and answers' },
        { '@type': 'Thing', name: 'Beginner to advanced React interview questions' },
        { '@type': 'Thing', name: 'React interview questions for experienced developers' },
        { '@type': 'Thing', name: 'React hooks interview questions' },
        { '@type': 'Thing', name: 'React useEffect interview questions' },
        { '@type': 'Thing', name: 'React state interview questions' },
        { '@type': 'Thing', name: 'React rendering interview questions' },
        { '@type': 'Thing', name: 'React performance interview questions' },
        { '@type': 'Thing', name: 'React Context interview questions' },
        { '@type': 'Thing', name: 'React forms interview questions' },
        { '@type': 'Thing', name: 'React StrictMode interview questions' },
        { '@type': 'Thing', name: 'React Suspense interview questions' },
        { '@type': 'Thing', name: 'React rendering internals interview questions' },
        { '@type': 'Thing', name: 'React Virtual DOM interview questions' },
        { '@type': 'Thing', name: 'React reconciliation interview questions' },
        { '@type': 'Thing', name: 'React Fiber interview questions' },
        { '@type': 'Thing', name: 'React 19 interview questions' },
        { '@type': 'Thing', name: 'React Actions interview questions' },
        { '@type': 'Thing', name: 'React useActionState interview questions' },
        { '@type': 'Thing', name: 'React useOptimistic interview questions' },
        { '@type': 'Thing', name: 'React Server Components interview questions' },
        { '@type': 'Thing', name: 'Next.js App Router React interview questions' },
        { '@type': 'Thing', name: 'React hydration interview questions' },
        { '@type': 'Thing', name: 'React Testing Library interview questions' },
        { '@type': 'Thing', name: 'React testing interview questions' },
        { '@type': 'Thing', name: 'React props, state, and one-way data flow' },
        { '@type': 'Thing', name: 'React Hooks and useEffect implementation' },
        { '@type': 'Thing', name: 'React Context API and state management' },
        { '@type': 'Thing', name: 'React forms and controlled inputs' },
        { '@type': 'Thing', name: 'React class components versus functional components' },
        { '@type': 'Thing', name: 'React component lifecycle' },
      ];
      collectionPage['mentions'] = [
        ...(collectionPage['mentions'] || []),
        { '@type': 'Thing', name: 'React scenario questions' },
        { '@type': 'Thing', name: 'React state ownership' },
        { '@type': 'Thing', name: 'React effect cleanup' },
        { '@type': 'Thing', name: 'React stale closures' },
        { '@type': 'Thing', name: 'React keys in lists' },
        { '@type': 'Thing', name: 'React controlled and uncontrolled inputs' },
        { '@type': 'Thing', name: 'React memoization trade-offs' },
        { '@type': 'Thing', name: 'React 18 automatic batching' },
        { '@type': 'Thing', name: 'React Server Components' },
        { '@type': 'Thing', name: 'React hydration mismatch debugging' },
        { '@type': 'Thing', name: 'React render phase and commit phase' },
        { '@type': 'Thing', name: 'React diffing algorithm' },
        { '@type': 'Thing', name: 'React form actions and useFormStatus' },
        { '@type': 'Thing', name: 'React use with Suspense' },
        { '@type': 'Thing', name: 'Next.js caching and data ownership' },
        { '@type': 'Thing', name: 'React streaming UI questions' },
        { '@type': 'Thing', name: 'Jest and Vitest React testing' },
        { '@type': 'Thing', name: 'React act async updates' },
        { '@type': 'Thing', name: 'MSW mocked API testing' },
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

    if (this.isHtmlCssHub()) {
      collectionPage['dateModified'] = HTML_CSS_EDITORIAL_SIGNAL.dateModified;
      collectionPage['reviewedBy'] = {
        '@type': 'Organization',
        name: HTML_CSS_EDITORIAL_SIGNAL.reviewer,
      };
      collectionPage['about'] = [
        ...(collectionPage['about'] || []),
        { '@type': 'Thing', name: 'HTML CSS interview questions' },
        { '@type': 'Thing', name: 'HTML and CSS interview questions and answers' },
        { '@type': 'Thing', name: 'HTML and CSS interview questions for beginners' },
        { '@type': 'Thing', name: 'HTML and CSS interview questions for experienced developers' },
        { '@type': 'Thing', name: 'semantic HTML interview questions' },
        { '@type': 'Thing', name: 'CSS layout interview questions' },
        { '@type': 'Thing', name: 'Flexbox and Grid interview questions' },
        { '@type': 'Thing', name: 'CSS specificity and cascade interview questions' },
        { '@type': 'Thing', name: 'accessibility interview questions' },
        { '@type': 'Thing', name: 'responsive UI interview questions' },
      ];
      collectionPage['mentions'] = [
        ...(collectionPage['mentions'] || []),
        { '@type': 'Thing', name: 'HTML forms and labels' },
        { '@type': 'Thing', name: 'Accessible HTML and CSS components' },
        { '@type': 'Thing', name: 'CSS responsive layout debugging' },
        { '@type': 'Thing', name: 'HTML and CSS code scenarios' },
        { '@type': 'Thing', name: 'Browser rendering and UI debugging' },
        { '@type': 'Thing', name: 'CSS box model and overflow' },
        { '@type': 'Thing', name: 'HTML metadata and viewport' },
        { '@type': 'Thing', name: 'Responsive images and layout shift' },
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
    if (this.isReactHub()) {
      jsonLd.push(this.reactShortAnswersFaqPage(canonicalUrl));
    }
    if (this.isAngularHub()) {
      jsonLd.push(this.angularShortAnswersFaqPage(canonicalUrl));
    }
    if (this.isHtmlCssHub()) {
      jsonLd.push(this.htmlCssShortAnswersFaqPage(canonicalUrl));
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

  private reactShortAnswersFaqPage(canonicalUrl: string): Record<string, any> {
    return {
      '@type': 'FAQPage',
      '@id': `${canonicalUrl}#react-short-answers`,
      url: canonicalUrl,
      name: 'Top React interview questions and short answers, beginner to advanced',
      mainEntity: this.reactShortAnswers().map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      })),
    };
  }

  private htmlCssShortAnswersFaqPage(canonicalUrl: string): Record<string, any> {
    return {
      '@type': 'FAQPage',
      '@id': `${canonicalUrl}#html-css-short-answers`,
      url: canonicalUrl,
      name: 'Top HTML and CSS interview questions and short answers, beginner to advanced',
      mainEntity: this.htmlCssShortAnswers().map((item) => ({
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
