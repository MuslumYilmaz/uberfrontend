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
type JavaScriptTopicCard = { title: string; answer: string; link: JavaScriptCoverageLink; secondaryLinks?: JavaScriptCoverageLink[] };
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
type VueShortAnswerCategory = 'fundamentals' | 'reactivity-rendering' | 'components' | 'routing-state' | 'modern';
type VueShortAnswerItem = {
  q: string;
  a: string;
  route?: any[];
  cta?: string;
  category: VueShortAnswerCategory;
  level: QuestionLevel;
};
type VueAnchorItem = { label: string; targetId: string };
type VueKeywordClusterItem = {
  label: string;
  targetId: string;
  detail: string;
};
type VueAudienceTrack = { title: string; detail: string };
type VueFocusedQuestionItem = {
  q: string;
  a: string;
  level: QuestionLevel;
  route?: any[];
  cta?: string;
};
type VueScenarioQuestionItem = {
  q: string;
  code: string;
  explanation: string;
  level: QuestionLevel;
  route?: any[];
  cta?: string;
};
type VueModernQuestionItem = {
  q: string;
  a: string;
  level: QuestionLevel;
  route?: any[];
  cta?: string;
};
type VueEditorialSignal = {
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
type HtmlShortAnswerCategory = 'fundamentals' | 'semantics' | 'forms-accessibility' | 'metadata-browser' | 'modern-scenarios';
type HtmlShortAnswerItem = {
  q: string;
  a: string;
  route?: any[];
  cta?: string;
  category: HtmlShortAnswerCategory;
  level: QuestionLevel;
};
type HtmlAnchorItem = { label: string; targetId: string };
type HtmlKeywordClusterItem = {
  label: string;
  targetId: string;
  detail: string;
};
type HtmlAudienceTrack = { title: string; detail: string };
type HtmlFocusedQuestionItem = {
  q: string;
  a: string;
  level: QuestionLevel;
  route?: any[];
  cta?: string;
};
type HtmlScenarioQuestionItem = HtmlFocusedQuestionItem;
type HtmlEditorialSignal = {
  reviewedLabel: string;
  reviewer: string;
  coverage: string;
  dateModified: string;
};
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
type CssShortAnswerCategory = 'fundamentals' | 'cascade-selectors' | 'layout' | 'responsive' | 'debugging-performance';
type CssShortAnswerItem = {
  q: string;
  a: string;
  route?: any[];
  cta?: string;
  category: CssShortAnswerCategory;
  level: QuestionLevel;
};
type CssAnchorItem = { label: string; targetId: string };
type CssKeywordClusterItem = {
  label: string;
  targetId: string;
  detail: string;
};
type CssAudienceTrack = { title: string; detail: string };
type CssFocusedQuestionItem = {
  q: string;
  a: string;
  level: QuestionLevel;
  route?: any[];
  cta?: string;
};
type CssScenarioQuestionItem = CssFocusedQuestionItem;
type CssEditorialSignal = {
  reviewedLabel: string;
  reviewer: string;
  coverage: string;
  dateModified: string;
};
type MasterEditorialSignal = {
  reviewedLabel: string;
  reviewer: string;
  coverage: string;
  dateModified: string;
};
type MasterAnchorItem = { label: string; targetId: string };
type MasterKeywordClusterItem = {
  label: string;
  targetId: string;
  detail: string;
};
type MasterShortAnswerCategory =
  | 'rounds'
  | 'javascript'
  | 'ui-coding'
  | 'html-css'
  | 'browser-security'
  | 'debugging-performance'
  | 'system-design'
  | 'prep';
type MasterShortAnswerItem = {
  q: string;
  a: string;
  route?: any[];
  cta?: string;
  extraLinks?: MasterFormatPathLink[];
  category: MasterShortAnswerCategory;
  level: QuestionLevel;
};
type MasterEssentialPreviewItem = {
  title: string;
  detail: string;
  route: any[];
  cta: string;
};
type MasterFormatPathLink = { label: string; route: any[] };
type MasterFormatPathItem = {
  title: string;
  detail: string;
  links: MasterFormatPathLink[];
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
  {
    label: 'Frontend machine coding questions',
    route: ['/machine-coding'],
    path: '/machine-coding',
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

const MASTER_EDITORIAL_SIGNAL: MasterEditorialSignal = {
  reviewedLabel: 'Reviewed May 21, 2026',
  reviewer: 'FrontendAtlas Editor',
  coverage: '30 essential frontend answers plus Essential 60, coding, concepts, frameworks, debugging, and system design paths',
  dateModified: '2026-05-21T00:00:00.000Z',
};

const MASTER_ANCHOR_ITEMS: MasterAnchorItem[] = [
  { label: 'Clusters', targetId: 'iq-master-clusters-title' },
  { label: 'Essential answers', targetId: 'iq-master-short-answers-title' },
  { label: 'Essential 60', targetId: 'iq-master-essential-title' },
  { label: 'Interview formats', targetId: 'iq-master-formats-title' },
  { label: 'Coding prompts', targetId: 'iq-master-coding-preview-title' },
  { label: 'Concept prompts', targetId: 'iq-master-concept-preview-title' },
  { label: 'Prep roadmap', targetId: 'iq-roadmap-title' },
];

const MASTER_KEYWORD_CLUSTERS: MasterKeywordClusterItem[] = [
  {
    label: 'Frontend interview questions for beginners',
    targetId: 'iq-master-short-answers-title',
    detail: 'Core JavaScript, semantic HTML, CSS layout, browser behavior, and UI states.',
  },
  {
    label: 'Frontend interview questions for experienced developers',
    targetId: 'iq-master-formats-title',
    detail: 'Architecture, debugging, performance, framework trade-offs, and system design.',
  },
  {
    label: 'Frontend UI coding and machine coding questions',
    targetId: 'iq-master-essential-title',
    detail: 'Widgets, forms, autocomplete, tables, state ownership, and accessible interactions.',
  },
  {
    label: 'JavaScript and browser API interview questions',
    targetId: 'iq-master-short-answers-title',
    detail: 'Event loop, closures, async flow, DOM, storage, security, debounce, and throttle.',
  },
  {
    label: 'HTML, CSS, and accessibility interview questions',
    targetId: 'iq-master-short-answers-title',
    detail: 'Semantic markup, forms, labels, cascade, responsive CSS, and keyboard access.',
  },
  {
    label: 'Frontend debugging and testing questions',
    targetId: 'iq-master-formats-title',
    detail: 'Async UI bugs, behavior tests, regressions, root-cause analysis, and incidents.',
  },
  {
    label: 'Frontend performance interview questions',
    targetId: 'iq-master-short-answers-title',
    detail: 'Rendering cost, hydration, layout shifts, memoization, and runtime profiling.',
  },
  {
    label: 'Frontend system design interview questions',
    targetId: 'iq-master-formats-title',
    detail: 'Frontend architecture, data flow, API contracts, pagination, caching, and trade-offs.',
  },
];

const MASTER_SHORT_ANSWERS: MasterShortAnswerItem[] = [
  {
    q: 'What do frontend interviews usually test?',
    a: 'Frontend interviews test whether you can build usable UI, explain browser and framework behavior, and debug trade-offs under time pressure. The core loop is usually implementation, concept explanation, follow-up constraints, and a short discussion of tests or edge cases. A good answer connects user behavior, data flow, rendering, accessibility, and performance instead of treating each topic as separate trivia.',
    route: ['/interview-questions/essential'],
    cta: 'Open Essential 60',
    category: 'rounds',
    level: 'beginner',
  },
  {
    q: 'How should I approach a frontend interview question?',
    a: 'Start by clarifying requirements, inputs, output states, and user interactions before writing code. Then build the smallest working version, cover edge cases, and explain how you would test failure states. This prevents overbuilding and makes trade-offs visible while there is still time to adjust.',
    route: ['/guides', 'interview-blueprint', 'intro'],
    cta: 'Read the frontend interview preparation guide',
    category: 'rounds',
    level: 'beginner',
  },
  {
    q: 'What JavaScript fundamentals matter most for frontend interviews?',
    a: 'The highest-signal JavaScript topics are execution order, closures, equality, array methods, object references, async code, and DOM interaction. These topics show up inside UI prompts because they decide when state changes, which callback runs, and whether data is copied or mutated. Weak fundamentals usually surface as stale UI, race conditions, sorting bugs, or confusing event behavior.',
    route: ['/javascript/interview-questions'],
    cta: 'Open JavaScript questions',
    category: 'javascript',
    level: 'beginner',
  },
  {
    q: 'What is the JavaScript event loop?',
    a: 'The event loop coordinates synchronous code, queued tasks, microtasks, rendering, and timers. Promise callbacks run as microtasks before timer callbacks from the task queue, which is why output-prediction questions often surprise people. In UI code, this affects loading states, chained async updates, and when the browser can paint.',
    route: ['/javascript', 'trivia', 'js-event-loop'],
    cta: 'Practice event loop',
    category: 'javascript',
    level: 'intermediate',
  },
  {
    q: 'How do closures affect frontend bugs?',
    a: 'A closure lets a function keep access to variables from the scope where it was created. That is useful for callbacks, event handlers, and debounced functions, but it can also preserve old values when the UI has moved on. Stale closures are common in delayed callbacks, effects, subscriptions, and retry logic.',
    route: ['/javascript', 'trivia', 'js-closures'],
    cta: 'Practice closures',
    category: 'javascript',
    level: 'intermediate',
  },
  {
    q: 'When should debounce or throttle be used?',
    a: 'Debounce waits until events stop for a delay, so it fits search boxes, validation, and resize handling where only the final value matters. Throttle limits how often a function runs, so it fits scroll, drag, and high-frequency progress updates. The edge case is cancellation: pending timers should be cleared when a component unmounts or when input becomes invalid.',
    route: ['/javascript', 'coding', 'js-debounce'],
    cta: 'Practice debounce',
    extraLinks: [{ label: 'Practice throttle', route: ['/javascript', 'coding', 'js-throttle'] }],
    category: 'javascript',
    level: 'intermediate',
  },
  {
    q: 'What makes a good UI coding answer?',
    a: 'A good UI coding answer renders the required states first: empty, loading, success, error, disabled, and interaction feedback. It keeps state ownership clear and avoids hiding important behavior in unexplained helpers. The strongest implementation is easy to test because each user action produces a visible, predictable result.',
    route: ['/guides', 'interview-blueprint', 'ui-interviews'],
    cta: 'Open UI interview guide',
    category: 'ui-coding',
    level: 'beginner',
  },
  {
    q: 'How should reusable frontend components be designed?',
    a: 'Reusable components should have a small public API, clear ownership of state, and predictable rendering for loading, error, and empty states. Inputs should describe behavior rather than internal implementation details. If a component needs many flags that conflict with each other, splitting it into smaller components is usually safer.',
    category: 'ui-coding',
    level: 'intermediate',
  },
  {
    q: 'How should frontend state be managed?',
    a: 'Keep state as close as possible to the UI that owns it, then lift it only when multiple parts of the tree need the same source of truth. Derived values should be computed from existing state instead of stored twice. Server data, form state, URL state, and client-only UI state usually deserve different handling because they fail and refresh differently.',
    category: 'ui-coding',
    level: 'intermediate',
  },
  {
    q: 'Why are controlled inputs useful?',
    a: 'Controlled inputs keep the displayed value and validation logic tied to explicit state. They are useful when the UI must show errors, disable submit, format values, or synchronize several fields. The trade-off is extra state management, so simple one-off inputs can still be uncontrolled when validation is minimal.',
    route: ['/react', 'trivia', 'react-controlled-vs-uncontrolled'],
    cta: 'Practice controlled inputs',
    category: 'ui-coding',
    level: 'intermediate',
  },
  {
    q: 'Why are keys important in frontend lists?',
    a: 'Keys define item identity when a UI library compares one render with the next. Stable keys preserve the right local state when rows are inserted, removed, filtered, or reordered. Index keys can be safe for static lists, but they often break forms, animations, and editable rows when order changes.',
    route: ['/react', 'trivia', 'react-keys-in-lists'],
    cta: 'Practice list keys',
    category: 'ui-coding',
    level: 'intermediate',
  },
  {
    q: 'What is semantic HTML?',
    a: 'Semantic HTML uses elements that describe the meaning and structure of content, such as nav, main, button, form, label, and table. It improves accessibility, browser defaults, keyboard behavior, and search understanding before extra JavaScript is added. A div can render the same pixels, but it usually loses built-in meaning and behavior.',
    route: ['/html-css/interview-questions'],
    cta: 'Open HTML/CSS questions',
    category: 'html-css',
    level: 'beginner',
  },
  {
    q: 'Why do labels matter in forms?',
    a: 'Labels connect visible text to an input so users, screen readers, and click targets all understand the field. Placeholders are not a replacement because they disappear during typing and often lack persistent context. Good form answers also cover error text, required fields, focus order, and submit behavior.',
    route: ['/html-css/interview-questions'],
    cta: 'Practice forms',
    category: 'html-css',
    level: 'beginner',
  },
  {
    q: 'How should accessibility be handled in frontend interviews?',
    a: 'Start with semantic elements, keyboard support, visible focus, labels, contrast, and meaningful text alternatives. ARIA should fill gaps only when native HTML cannot express the interaction. The practical check is whether a keyboard and screen reader user can complete the same workflow as a mouse user.',
    route: ['/html-css/interview-questions'],
    cta: 'Review accessibility prompts',
    category: 'html-css',
    level: 'intermediate',
  },
  {
    q: 'How does CSS specificity affect frontend bugs?',
    a: 'Specificity decides which CSS rule wins when multiple selectors target the same property. Bugs appear when a broad selector, utility class, inline style, or later rule overrides the intended style. Debugging should inspect the winning rule first, then reduce selector complexity instead of adding more force.',
    route: ['/css', 'trivia', 'css-specificity-hierarchy'],
    cta: 'Practice specificity',
    category: 'html-css',
    level: 'intermediate',
  },
  {
    q: 'When should Flexbox vs Grid be used?',
    a: 'Flexbox is strongest for one-dimensional layout where items flow in a row or column. Grid is better for two-dimensional layout where rows and columns need to align together. Many UI layouts use both: Grid for the page or card structure, Flexbox for alignment inside each region.',
    route: ['/css', 'trivia', 'css-grid-vs-flexbox'],
    cta: 'Practice Flexbox vs Grid',
    category: 'html-css',
    level: 'beginner',
  },
  {
    q: 'How do you debug layout issues?',
    a: 'Start by checking the box model, computed styles, containing block, overflow, and the rule that actually wins. Then isolate whether the problem is sizing, positioning, stacking, alignment, or content overflow. Good debugging avoids random CSS changes and uses devtools to prove which constraint is failing.',
    route: ['/css/interview-questions'],
    cta: 'Open CSS questions',
    category: 'html-css',
    level: 'intermediate',
  },
  {
    q: 'What makes responsive UI robust?',
    a: 'Responsive UI uses flexible layout, fluid sizing, sensible min and max constraints, and breakpoints based on content needs. It should handle long text, narrow screens, zoom, touch targets, and images without layout shifts. A strong answer tests the awkward states, not just the default desktop design.',
    route: ['/html-css/interview-questions'],
    cta: 'Practice responsive UI',
    category: 'html-css',
    level: 'intermediate',
  },
  {
    q: 'How do you prevent XSS in frontend code?',
    a: 'Prevent XSS by treating user-controlled HTML, URLs, and DOM sinks as unsafe unless they are sanitized or encoded for the exact context. Prefer textContent, safe template binding, trusted rendering pipelines, and server-side validation. The dangerous edge case is bypassing framework protections with raw HTML APIs or trusted-value escape hatches.',
    route: ['/javascript', 'trivia', 'js-xss-dom-sinks'],
    cta: 'Practice XSS prevention',
    category: 'browser-security',
    level: 'advanced',
  },
  {
    q: 'What should frontend developers know about browser storage?',
    a: 'Cookies are sent with requests and can support server sessions, while localStorage and sessionStorage are browser-only key-value stores. Sensitive tokens should not be casually stored in JavaScript-accessible storage because XSS can read them. Storage choices should consider expiration, cross-tab behavior, request needs, and security boundaries.',
    route: ['/javascript', 'trivia', 'js-cookie-sessionstorage-localstorage'],
    cta: 'Practice browser storage',
    category: 'browser-security',
    level: 'intermediate',
  },
  {
    q: 'How should frontend tests be scoped?',
    a: 'Frontend tests should protect user-visible behavior and critical data flow instead of private implementation details. Good tests cover rendering states, user events, async loading, validation, accessibility expectations, and regressions around previous bugs. Brittle tests usually assert component internals that can change without breaking the user experience.',
    category: 'debugging-performance',
    level: 'intermediate',
  },
  {
    q: 'How do you debug async UI bugs?',
    a: 'Async UI bugs often come from stale responses, missing cancellation, loading state races, or state updates after a component is gone. Reproduce the order of events first, then decide whether the latest request wins, all responses accumulate, or cancellation is required. Tests should include slow response, fast response, error, retry, and unmount cases.',
    route: ['/incidents'],
    cta: 'Practice debugging scenarios',
    category: 'debugging-performance',
    level: 'advanced',
  },
  {
    q: 'How do frontend memory leaks happen?',
    a: 'Frontend memory leaks happen when listeners, timers, subscriptions, observers, detached DOM references, or unbounded caches stay alive after the UI no longer needs them. The symptom may be slower interactions, duplicate events, growing memory, or stale network work. Cleanup should be tied to component lifecycle, route changes, and cache eviction rules.',
    route: ['/incidents'],
    cta: 'Practice debugging',
    category: 'debugging-performance',
    level: 'advanced',
  },
  {
    q: 'What performance topics are common in frontend interviews?',
    a: 'Common performance topics include bundle size, render cost, layout shift, image loading, network waterfalls, memoization, virtualization, caching, and Core Web Vitals. The best answer starts with measurement before optimization. Trade-offs matter because a faster first render can still create worse interactivity or maintainability if the fix is poorly chosen.',
    route: ['/system-design'],
    cta: 'Practice system design',
    category: 'debugging-performance',
    level: 'advanced',
  },
  {
    q: 'What causes SSR and hydration issues?',
    a: 'Hydration issues happen when the server-rendered HTML does not match what the client renders on startup. Common causes are time-dependent values, browser-only APIs, random IDs, locale differences, and conditional rendering that changes before hydration finishes. Fixes usually move unstable logic to the client boundary or make the initial server and client output deterministic.',
    route: ['/react/interview-questions'],
    cta: 'Review framework rendering',
    category: 'debugging-performance',
    level: 'advanced',
  },
  {
    q: 'What is frontend system design?',
    a: 'Frontend system design is the design of a client-side experience: UI architecture, data flow, API contracts, state ownership, performance, accessibility, recovery, and observability. It is not only choosing a framework or drawing components. A strong answer explains constraints first, then connects architecture decisions to user-visible behavior.',
    route: ['/system-design'],
    cta: 'Practice system design',
    category: 'system-design',
    level: 'advanced',
  },
  {
    q: 'How would you design autocomplete or typeahead?',
    a: 'Autocomplete needs input state, debouncing, async search, loading and empty states, keyboard navigation, selection, and stale-response protection. The data model should distinguish query text, highlighted option, selected value, and result list. Advanced follow-ups usually add caching, cancellation, accessibility roles, and latency recovery.',
    route: ['/system-design'],
    cta: 'Open system design practice',
    category: 'system-design',
    level: 'advanced',
  },
  {
    q: 'How do pagination and infinite scroll differ?',
    a: 'Pagination gives users stable pages, clearer URLs, and easier recovery, while infinite scroll favors continuous browsing and lower-friction discovery. Infinite scroll needs careful loading, virtualization, scroll restoration, footer access, and duplicate prevention. The right choice depends on task completion, SEO needs, accessibility, analytics, and data consistency.',
    route: ['/system-design'],
    cta: 'Practice frontend architecture',
    category: 'system-design',
    level: 'advanced',
  },
  {
    q: 'How do React, Angular, and Vue interviews differ?',
    a: 'React interviews often focus on state ownership, hooks, rendering, effects, and component boundaries. Angular interviews often emphasize RxJS, dependency injection, change detection, forms, testing, and architecture. Vue interviews often focus on reactivity, Composition API, component contracts, Router, Pinia or Vuex, and update timing.',
    route: ['/react/interview-questions'],
    cta: 'Open framework hubs',
    category: 'prep',
    level: 'intermediate',
  },
  {
    q: 'What are common frontend interview mistakes?',
    a: 'Common mistakes include coding before clarifying requirements, ignoring accessibility, mutating shared state, skipping loading and error states, and explaining fixes without tests. Another common miss is optimizing too early before proving where the bottleneck is. A safer pattern is to state assumptions, build the core behavior, test edge cases, then discuss trade-offs.',
    route: ['/interview-questions/essential'],
    cta: 'Use Essential 60',
    category: 'prep',
    level: 'beginner',
  },
];

const MASTER_ESSENTIAL_PREVIEW_ITEMS: MasterEssentialPreviewItem[] = [
  {
    title: 'JavaScript utilities',
    detail: 'Debounce, throttle, array transforms, async flow, equality, references, and browser behavior that appear inside UI prompts.',
    route: ['/interview-questions/essential'],
    cta: 'Open Essential 60',
  },
  {
    title: 'UI coding',
    detail: 'Autocomplete, tables, forms, widgets, stateful components, keyboard behavior, and accessible interaction details.',
    route: ['/interview-questions/essential'],
    cta: 'Start UI essentials',
  },
  {
    title: 'Concepts and browser fundamentals',
    detail: 'Event loop, closures, DOM events, storage, XSS, semantic HTML, cascade, responsive layout, and rendering behavior.',
    route: ['/interview-questions/essential'],
    cta: 'Review core concepts',
  },
  {
    title: 'System design and trade-offs',
    detail: 'Frontend architecture prompts around data flow, caching, pagination, performance, accessibility, and failure recovery.',
    route: ['/interview-questions/essential'],
    cta: 'Practice trade-offs',
  },
];

const MASTER_FORMAT_PATH_ITEMS: MasterFormatPathItem[] = [
  {
    title: 'UI coding rounds',
    detail: 'Timed widget and product-slice prompts where visible behavior, interaction details, and accessible states matter most.',
    links: [
      { label: 'Frontend machine coding questions', route: ['/machine-coding'] },
      { label: 'Open UI guide', route: ['/guides', 'interview-blueprint', 'ui-interviews'] },
    ],
  },
  {
    title: 'JavaScript utility rounds',
    detail: 'Focused implementation and explanation prompts for async, closures, arrays, DOM behavior, and utility functions.',
    links: [{ label: 'Open JavaScript hub', route: ['/javascript/interview-questions'] }],
  },
  {
    title: 'Framework rounds',
    detail: 'React, Angular, and Vue paths for state, rendering, lifecycle, reactivity, forms, testing, and architecture boundaries.',
    links: [
      { label: 'React', route: ['/react/interview-questions'] },
      { label: 'Angular', route: ['/angular/interview-questions'] },
      { label: 'Vue', route: ['/vue/interview-questions'] },
    ],
  },
  {
    title: 'Debugging rounds',
    detail: 'Root-cause scenarios for stale state, async races, rendering bugs, regressions, and production-style failure analysis.',
    links: [{ label: 'Open debugging scenarios', route: ['/incidents'] }],
  },
  {
    title: 'System design rounds',
    detail: 'Frontend architecture prompts for requirements, data, interfaces, optimizations, accessibility, and failure modes.',
    links: [{ label: 'Open system design', route: ['/system-design'] }],
  },
  {
    title: 'Concept quiz rounds',
    detail: 'Short explanation checks for JavaScript, CSS, browser APIs, HTTP, accessibility, and framework fundamentals.',
    links: [{ label: 'Open quiz guide', route: ['/guides', 'interview-blueprint', 'quiz'] }],
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
    credibility: 'Questions are selected through editorial review and organized around practical interview follow-ups rather than scraped generic lists.',
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
    credibility: 'React prompts are selected for recurring interview patterns and reviewed for concrete follow-up questions.',
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
    credibility: 'Angular prompts are selected for common production pitfalls and reviewed for interview-specific follow-ups.',
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
    credibility: 'Vue prompts are grouped by practical reactivity and component concerns and reviewed for framework-specific interview traps.',
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
      q: 'Are these frontend interview questions for beginners and experienced developers?',
      a: 'Yes. The master hub starts with beginner-friendly frontend fundamentals, then points experienced developers toward architecture, debugging, performance, framework, and system-design practice.',
    },
    {
      q: 'Does this page include frontend UI coding and machine coding questions?',
      a: 'Yes. The Essential 60 preview and coding sections route into UI coding and machine-coding style prompts such as forms, autocomplete, tables, widgets, stateful components, and interaction details.',
    },
    {
      q: 'Does this page cover JavaScript, browser APIs, HTML, CSS, React, Angular, and Vue?',
      a: 'Yes. The hub gives cross-topic answers first, then links into JavaScript, HTML, CSS, React, Angular, Vue, browser API, and HTML/CSS interview question paths for deeper practice.',
    },
    {
      q: 'Does this page include frontend debugging, testing, and performance questions?',
      a: 'Yes. The master answers and format cards cover async UI bugs, behavior tests, regressions, rendering cost, hydration, layout shifts, and performance trade-offs.',
    },
    {
      q: 'Does this page include frontend system design interview questions?',
      a: 'Yes. This page introduces frontend system design as part of the broad interview loop and links to the dedicated system-design practice area for deeper architecture prompts.',
    },
    {
      q: 'How should I practice frontend interview questions?',
      a: 'Start with the essential answers, use Essential 60 as a compact baseline, then pick one format: UI coding, JavaScript utilities, framework depth, debugging, concept quiz, or system design.',
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
      q: 'Are these Vue.js interview questions for beginners and experienced developers?',
      a: 'Yes. The page starts with Vue fundamentals, then moves into experienced-developer topics such as reactivity traps, Composition API design, Router, Pinia/Vuex, scenarios, testing, security, and performance.',
    },
    {
      q: 'Does this page cover Vue 3 and Composition API interview questions?',
      a: 'Yes. It covers Vue 3 reactivity, ref, reactive, computed values, watch, watchEffect, script setup, composables, Composition API trade-offs, Router, Pinia/Vuex, Teleport, Suspense, SSR, and Nuxt-style concerns.',
    },
    {
      q: 'Does this page include Vue reactivity interview questions like ref vs reactive and computed vs watch?',
      a: 'Yes. The reactivity sections cover ref, reactive, computed values, methods, watch, watchEffect, nextTick, dependency tracking, destructuring traps, virtual DOM diffing, and update batching.',
    },
    {
      q: 'Does this page include Vue scenario and code interview questions?',
      a: 'Yes. The scenario section covers destructuring that breaks reactivity, watcher loops, unstable v-for keys, prop mutation, nextTick timing, v-if lifecycle resets, computed side effects, and stale async search results.',
    },
    {
      q: 'Does this page include Vue testing, security, and performance interview questions?',
      a: 'Yes. It covers Vue Test Utils, Vitest, async DOM assertions, emitted events, v-html XSS risk, safe rich text, profiling, update dependencies, and cleanup for timers, listeners, and external subscriptions.',
    },
    {
      q: 'Where should I practice Vue.js coding interview questions?',
      a: 'Start with the Vue coding preview on this page, then move into debounced search, autocomplete, tabs, shopping cart, and the Vue prep path when you need a structured practice sequence.',
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
      q: 'Are these HTML interview questions for beginners, freshers, and experienced developers?',
      a: 'Yes. The page starts with beginner and fresher-friendly HTML fundamentals, then moves into experienced-developer topics such as accessibility trade-offs, browser parsing, Shadow DOM, native dialogs, iframes, responsive images, and markup scenarios.',
    },
    {
      q: 'Does this page cover semantic HTML interview questions?',
      a: 'Yes. It covers document structure, semantic elements, landmarks, headings, sections, articles, lists, navigation, language, and when generic div or span markup is not enough.',
    },
    {
      q: 'Does this page include HTML forms and validation interview questions?',
      a: 'Yes. It covers labels, placeholders, input types, native validation attributes, form errors, grouped controls, form methods, real buttons, and server-side validation boundaries.',
    },
    {
      q: 'Does this page cover HTML accessibility and ARIA interview questions?',
      a: 'Yes. It covers accessible names, alt text, data tables, ARIA roles, native semantics, keyboard checks, iframe titles, dialog behavior, and quick accessibility testing.',
    },
    {
      q: 'Does this page include HTML5, DOM, metadata, iframe, srcset, and Shadow DOM questions?',
      a: 'Yes. It covers HTML5-era native behavior, the DOM, head metadata, title and meta tags, viewport behavior, responsive images with srcset, iframe constraints, Shadow DOM, and browser parsing.',
    },
    {
      q: 'Where should I practice HTML coding interview questions?',
      a: 'Start with the HTML coding preview on this page, then practice basic document structure, labeled contact forms, validation, semantic layout, accessible tables, links, images, lists, and native dialog behavior.',
    },
  ],
  css: [
    {
      q: 'Are these CSS interview questions for beginners and experienced developers?',
      a: 'Yes. The page starts with CSS fundamentals, then moves into experienced-developer topics such as cascade architecture, specificity control, responsive constraints, stacking contexts, performance, and visual debugging.',
    },
    {
      q: 'Does this page cover CSS specificity and cascade interview questions?',
      a: 'Yes. It covers cascade order, layers, specificity, inheritance, pseudo selectors, !important, selector strategy, and how to debug conflicting declarations.',
    },
    {
      q: 'Does this page include Flexbox and CSS Grid interview questions?',
      a: 'Yes. It covers when to use Flexbox, when to use CSS Grid, Flexbox vs Grid trade-offs, alignment, wrapping navigation, responsive grids, positioning, sticky behavior, and z-index.',
    },
    {
      q: 'Does this page include responsive CSS and media query questions?',
      a: 'Yes. It covers responsive CSS, media queries, container queries, clamp(), fluid sizing, responsive navigation, card layouts, long text, reduced motion, and theme variables.',
    },
    {
      q: 'Does this page cover CSS debugging and performance questions?',
      a: 'Yes. It covers missing styles, specificity conflicts, horizontal scroll, stacking bugs, layout thrashing, hardware acceleration, custom properties, and maintainable CSS.',
    },
    {
      q: 'Where should I practice CSS coding interview questions?',
      a: 'Start with the CSS coding preview on this page, then move into Flexbox navbar, Grid card gallery, fluid clamp sizing, theme variables, and responsive layout drills.',
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
    a: 'Template-driven forms keep more behavior in the template and fit simple workflows. Mature Reactive Forms model controls explicitly in TypeScript and remain a strong choice for complex or existing applications. Angular 22 also makes Signal Forms a stable production option for new signal-first applications. Choose among them by validation complexity, dynamic fields, testing, library compatibility, migration cost, and team familiarity.',
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
    code: `@for (user of users; track user.id) {
  <li>{{ user.name }}</li>
}`,
    explanation: 'Stable identity lets Angular reuse DOM and component instances when a list changes. A modern @for block should track a stable item id; tracking an index or unstable expression can attach local row state and focus to the wrong item after reordering.',
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
    secondaryLinks: [
      {
        label: 'Practice shallowClone()',
        route: ['/javascript', 'coding', 'js-shallow-clone'],
      },
    ],
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
    q: 'Why does useEffect run twice in React StrictMode?',
    a: 'React StrictMode can run an extra effect setup and cleanup cycle in development. Production does not run that diagnostic check, but the issue it exposes is real: effects must clean up subscriptions, listeners, timers, and stale requests. Event handlers are not double-invoked by this render check, so user-triggered work should stay in the event path.',
    route: ['/react', 'trivia', 'react-strictmode-double-invoke-effects'],
    cta: 'Fix useEffect running twice',
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
    a: 'Passive effects generally run after paint for non-interaction updates, but React may run an interaction-caused effect before paint. Unlike useLayoutEffect, useEffect does not provide a pre-paint guarantee. useLayoutEffect runs after DOM mutations and blocks repainting, so reserve it for layout measurements or corrections that must be invisible to the user.',
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
    q: 'How does StrictMode affect useEffect tests?',
    a: 'StrictMode can make useEffect setup and cleanup run more than once in development, which exposes effects that are not idempotent. Tests should not depend on an effect running exactly once when StrictMode is enabled. Assert final user-visible behavior and make subscriptions, timers, listeners, and analytics calls cleanup-safe.',
    route: ['/react', 'trivia', 'react-strictmode-double-invoke-effects'],
    cta: 'Fix useEffect running twice',
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
    q: 'How would you build an autocomplete search bar in React?',
    code: `function Autocomplete() {
  // query, results, status, isOpen, activeIndex
}`,
    explanation: 'A strong implementation uses a controlled input, debounced async search, stale-response protection, keyboard wrap-around, input-held focus, ARIA combobox attributes, and visible tests for loading, empty, no-results, and error states.',
    route: ['/react', 'coding', 'react-autocomplete-search-starter'],
    cta: 'Practice autocomplete with debounce and keyboard navigation',
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
    explanation: 'React StrictMode can run an extra useEffect setup and cleanup cycle in development. The effect should tolerate setup, cleanup, and setup again without leaking subscriptions or duplicating permanent work. Move one-time application boot logic outside component effects when component lifetime is not the right owner.',
    route: ['/react', 'trivia', 'react-strictmode-double-invoke-effects'],
    cta: 'Fix useEffect running twice',
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

const VUE_EDITORIAL_SIGNAL: VueEditorialSignal = {
  reviewedLabel: 'Reviewed May 20, 2026',
  reviewer: 'FrontendAtlas Editor',
  coverage: '65 visible Vue.js questions across reactivity, Composition API, component contracts, Router, Pinia/Vuex, scenarios, modern Vue, testing, security, and performance',
  dateModified: '2026-05-20T00:00:00.000Z',
};

const VUE_ANCHOR_ITEMS: VueAnchorItem[] = [
  { label: 'Clusters', targetId: 'iq-vue-clusters-title' },
  { label: 'Short answers', targetId: 'iq-vue-short-answers-title' },
  { label: 'Audience', targetId: 'iq-vue-audience-title' },
  { label: 'Reactivity', targetId: 'iq-vue-reactivity-title' },
  { label: 'Components', targetId: 'iq-vue-components-title' },
  { label: 'Scenarios + code', targetId: 'iq-vue-scenarios-title' },
  { label: 'Modern Vue 3', targetId: 'iq-vue-modern-title' },
  { label: 'Testing + security', targetId: 'iq-vue-testing-security-title' },
  { label: 'Coding drills', targetId: 'iq-vue-coding-preview-title' },
  { label: 'Concepts', targetId: 'iq-vue-concept-preview-title' },
];

const VUE_KEYWORD_CLUSTERS: VueKeywordClusterItem[] = [
  {
    label: 'Beginner Vue.js questions',
    targetId: 'iq-vue-short-answers-title',
    detail: 'Vue basics, templates, directives, components, props, emits, lifecycle hooks, and common Vue.js interview answers.',
  },
  {
    label: 'Experienced Vue.js questions',
    targetId: 'iq-vue-audience-title',
    detail: 'Reactivity traps, component contracts, Router, Pinia/Vuex, SSR, testing, security, performance, and production debugging.',
  },
  {
    label: 'Vue 3 and Composition API',
    targetId: 'iq-vue-modern-title',
    detail: 'Composition API, script setup, composables, Pinia, Router 4, Teleport, Suspense, and SSR.',
  },
  {
    label: 'Reactivity: ref, reactive, computed, watch',
    targetId: 'iq-vue-reactivity-title',
    detail: 'ref vs reactive, computed vs watch, watchEffect, nextTick, dependency tracking, destructuring traps, and update timing.',
  },
  {
    label: 'Router, Pinia, and Vuex',
    targetId: 'iq-vue-components-title',
    detail: 'Vue Router navigation, route lifecycle, Pinia/Vuex boundaries, and shared state ownership.',
  },
  {
    label: 'Testing, security, and performance',
    targetId: 'iq-vue-testing-security-title',
    detail: 'Vue Test Utils, Vitest, async DOM updates, v-html safety, cleanup, and render performance.',
  },
];

const VUE_SHORT_ANSWERS: VueShortAnswerItem[] = [
  {
    q: 'What is Vue.js?',
    a: 'Vue.js is a progressive JavaScript framework for building reactive user interfaces with components. Vue tracks reactive state, renders templates, and patches the DOM when dependencies change. Its practical strength is that simple components stay approachable while larger apps can add Router, Pinia, composables, testing, and build tooling as needed.',
    route: ['/vue', 'trivia', 'vue-reactivity-vs-react-concepts'],
    cta: 'Review Vue concepts',
    category: 'fundamentals',
    level: 'beginner',
  },
  {
    q: 'What is the difference between Vue 2 and Vue 3?',
    a: 'Vue 3 introduced a Proxy-based reactivity system, the Composition API, better TypeScript support, fragments, Teleport, Suspense, and a faster runtime. Vue 2 used Object.defineProperty-based reactivity and the Options API as the dominant authoring model. The compatibility concern is that migrations can expose plugin, lifecycle, state-management, and template-assumption differences.',
    route: ['/vue', 'trivia', 'vue-composition-api'],
    cta: 'Review Vue 3 patterns',
    category: 'modern',
    level: 'intermediate',
  },
  {
    q: 'How does Vue reactivity work?',
    a: 'Vue tracks reactive reads during rendering or effects and triggers the dependent work when those values are written. In Vue 3, proxies let Vue observe object property access and updates more flexibly than Vue 2. The important edge case is that extracting values out of a reactive proxy can disconnect them from tracking unless you preserve refs.',
    route: ['/vue', 'trivia', 'vue-reactivity-system'],
    cta: 'Review reactivity',
    category: 'reactivity-rendering',
    level: 'intermediate',
  },
  {
    q: 'What is the difference between ref and reactive?',
    a: 'ref wraps a value in an object with a .value property, while reactive returns a proxy for object-shaped state. ref is usually clearer for primitives and replaceable values; reactive can be convenient when mutating properties on a stable object. Destructuring reactive state can break reactivity, so toRef or toRefs may be needed when extracting fields.',
    route: ['/vue', 'trivia', 'vue-ref-vs-reactive-difference-traps'],
    cta: 'Compare ref and reactive',
    category: 'reactivity-rendering',
    level: 'intermediate',
  },
  {
    q: 'What are computed properties in Vue?',
    a: 'Computed properties are cached derived values based on reactive dependencies. They rerun only when a dependency changes, which makes them better than methods for values used repeatedly in templates. Computed getters should stay pure and synchronous; side effects belong in watch or watchEffect.',
    route: ['/vue', 'trivia', 'vue-computed-properties'],
    cta: 'Review computed values',
    category: 'reactivity-rendering',
    level: 'beginner',
  },
  {
    q: 'What happens when methods are called in Vue templates?',
    a: 'A method called from a template can run again whenever the component renders. That is fine for cheap event handlers or formatting, but it is risky for expensive derived values. If the value is derived from reactive state and should be cached, computed is usually the better fit.',
    route: ['/vue', 'trivia', 'vue-methods-in-templates'],
    cta: 'Review template methods',
    category: 'reactivity-rendering',
    level: 'intermediate',
  },
  {
    q: 'When should you use watch in Vue?',
    a: 'Use watch when a reactive value changing should trigger an imperative side effect such as fetching, logging, writing to storage, or syncing external state. A watcher can observe a specific source and gives access to new and old values. It is the wrong tool for pure derived display state, where computed is simpler and safer.',
    route: ['/vue', 'trivia', 'vue-computed-vs-watchers'],
    cta: 'Compare computed and watch',
    category: 'reactivity-rendering',
    level: 'intermediate',
  },
  {
    q: 'What is watchEffect in Vue?',
    a: 'watchEffect runs immediately, tracks reactive values read during its synchronous callback, and reruns when an external change updates one of them. Vue suppresses a direct synchronous self-trigger such as watchEffect(() => count.value++), so that example runs once rather than looping forever. Mutating dependencies is still poor design because external writers, indirect cycles, and async work make the effect difficult to reason about.',
    route: ['/vue', 'trivia', 'vue-watch-vs-watcheffect-differences-infinite-loops'],
    cta: 'Review watchEffect traps',
    category: 'reactivity-rendering',
    level: 'advanced',
  },
  {
    q: 'What does nextTick do in Vue?',
    a: 'nextTick waits until Vue has flushed pending DOM updates from reactive state changes. It is useful when you need to focus, measure, or scroll after the DOM reflects new state. It should not be used as a general fix for unclear data flow; first explain why DOM timing is the actual dependency.',
    route: ['/vue', 'trivia', 'vue-nexttick-dom-update-queue'],
    cta: 'Review nextTick timing',
    category: 'reactivity-rendering',
    level: 'intermediate',
  },
  {
    q: 'What are Vue lifecycle hooks?',
    a: 'Lifecycle hooks run at specific points in a component lifecycle, such as creation, mount, update, and unmount. They help place setup, DOM-dependent work, subscriptions, and cleanup at the correct time. Bugs often come from reading DOM too early or forgetting to clean up timers, listeners, and external subscriptions.',
    route: ['/vue', 'trivia', 'vue-lifecycle-hooks'],
    cta: 'Review lifecycle hooks',
    category: 'components',
    level: 'beginner',
  },
  {
    q: 'What are components in Vue?',
    a: 'Vue components are reusable UI units that combine template, state, behavior, styles, and a public contract. Single-file components make that contract easier to maintain by keeping the component implementation in one file. The component should expose clear props and emits instead of letting children mutate parent-owned state directly.',
    route: ['/vue', 'trivia', 'vue-sfc-vs-global-components'],
    cta: 'Review component scope',
    category: 'components',
    level: 'beginner',
  },
  {
    q: 'How should props work in Vue?',
    a: 'Props are inputs owned by the parent and passed down to a child. A child should treat props as read-only and emit an event when it wants the parent to change state. Mutating props directly creates ownership confusion and can be overwritten on the next parent update.',
    route: ['/vue', 'trivia', 'vue-child-mutates-prop-directly'],
    cta: 'Review prop ownership',
    category: 'components',
    level: 'intermediate',
  },
  {
    q: 'Why should emits be declared in Vue?',
    a: 'Declaring emits documents the events a component can send and helps catch mistakes in event names or payload expectations. It also separates component events from native DOM events. In larger codebases, explicit emits make component contracts safer to refactor.',
    route: ['/vue', 'trivia', 'vue-why-declare-emits-type-safety-maintenance'],
    cta: 'Review emits contracts',
    category: 'components',
    level: 'intermediate',
  },
  {
    q: 'What are slots in Vue?',
    a: 'Slots let a parent provide content to a child component while the child controls placement. Named slots support multiple content regions, and scoped slots let the child expose data back to the parent render scope. The trade-off is that too many slot contracts can make component behavior harder to trace.',
    route: ['/vue', 'trivia', 'vue-slots-default-named-scoped-slot-props'],
    cta: 'Review Vue slots',
    category: 'components',
    level: 'intermediate',
  },
  {
    q: 'When should you use provide and inject?',
    a: 'provide and inject pass dependencies through a component tree without threading props through every level. They fit design-system services, form context, deeply nested wiring, or plugin-style dependencies. They can hide coupling, so app-wide business state is often clearer in a store such as Pinia.',
    route: ['/vue', 'trivia', 'vue-provide-inject-vs-prop-drilling-tradeoffs'],
    cta: 'Review provide/inject',
    category: 'components',
    level: 'advanced',
  },
  {
    q: 'What does v-model expand to?',
    a: 'v-model is syntax sugar for binding a value and listening for an update event. On custom components, it usually maps to a modelValue prop and update:modelValue event, with support for named models and modifiers. Understanding the expansion helps debug controlled form components and event payload bugs.',
    route: ['/vue', 'trivia', 'vue-v-model-syntax-sugar-expansion'],
    cta: 'Review v-model internals',
    category: 'components',
    level: 'intermediate',
  },
  {
    q: 'What is the difference between v-if and v-show?',
    a: 'v-if conditionally creates and destroys DOM and component instances, while v-show keeps the element mounted and toggles display. v-if is better when the block is rarely shown, and v-show is better for frequent visibility toggles. State reset and lifecycle cleanup are the key behavioral differences.',
    route: ['/vue', 'trivia', 'vue-v-show-vs-v-if-dom-lifecycle'],
    cta: 'Compare visibility strategies',
    category: 'reactivity-rendering',
    level: 'beginner',
  },
  {
    q: 'Why are keys important in v-for lists?',
    a: 'Keys give Vue stable identity for list items across insertions, removals, and reordering. Without stable keys, Vue may reuse DOM or component state for the wrong item. Index keys are fragile for dynamic lists because identity changes when order changes.',
    route: ['/vue', 'trivia', 'vue-v-for-keys-why-not-index'],
    cta: 'Review list keys',
    category: 'reactivity-rendering',
    level: 'intermediate',
  },
  {
    q: 'What are Vue directives?',
    a: 'Directives are template instructions such as v-bind, v-on, v-if, v-for, v-model, and v-show. They compile into reactive behavior that connects state, events, attributes, rendering, and visibility. Custom directives are useful for direct DOM behavior, but they should not replace component state flow.',
    route: ['/vue', 'trivia', 'vue-directives'],
    cta: 'Review directives',
    category: 'fundamentals',
    level: 'beginner',
  },
  {
    q: 'What is the Composition API?',
    a: 'The Composition API lets Vue components organize logic around features using setup, refs, reactive state, computed values, watchers, and composables. It is especially useful when one feature spans state, lifecycle, and side effects. The main benefit is maintainability and reuse, not simply replacing Options API syntax.',
    route: ['/vue', 'trivia', 'vue-composition-api'],
    cta: 'Review Composition API',
    category: 'modern',
    level: 'intermediate',
  },
  {
    q: 'What are composables in Vue?',
    a: 'Composables are functions that encapsulate reusable Composition API logic. They can own refs, computed values, watchers, lifecycle hooks, and cleanup behavior. A good composable has a clear ownership boundary and does not hide surprising global state unless that is its explicit purpose.',
    route: ['/vue', 'trivia', 'vue-composition-api-vs-mixins'],
    cta: 'Review reuse patterns',
    category: 'modern',
    level: 'intermediate',
  },
  {
    q: 'What is Vue Router used for?',
    a: 'Vue Router manages client-side navigation, route matching, nested views, params, query state, and navigation guards. It lets a Vue app behave like multiple pages while avoiding full document reloads. Route guards should have clear allowed, denied, and redirect outcomes to avoid navigation loops.',
    route: ['/vue', 'trivia', 'vue-router-navigation'],
    cta: 'Review Vue Router',
    category: 'routing-state',
    level: 'intermediate',
  },
  {
    q: 'When should you use Pinia or Vuex?',
    a: 'Use local component state until state must be shared across distant components, persisted, debugged centrally, or coordinated through a predictable update path. Pinia is the modern Vue 3 default, while Vuex still appears in older applications. The key decision is state ownership, not moving every value into a global store.',
    route: ['/vue', 'trivia', 'vuex-state-management'],
    cta: 'Review store boundaries',
    category: 'routing-state',
    level: 'advanced',
  },
  {
    q: 'How does Vue virtual DOM diffing work?',
    a: 'Vue renders a virtual node tree and compares the next tree with the previous one to decide what DOM patches are needed. Stable keys help Vue preserve the correct item and component identity during list changes. Diffing is efficient, but it cannot fix unclear identity or excessive reactive dependencies.',
    route: ['/vue', 'trivia', 'vue-virtual-dom-diffing'],
    cta: 'Review Vue diffing',
    category: 'reactivity-rendering',
    level: 'advanced',
  },
  {
    q: 'How do you improve Vue performance?',
    a: 'Start by reducing unnecessary reactive work, using computed values for cached derived state, keeping keys stable, splitting heavy components, and avoiding expensive template methods. For large lists, use pagination, windowing, or server-side constraints instead of rendering everything. Measure before optimizing because many Vue bottlenecks are data-shape or component-boundary problems.',
    route: ['/guides', 'framework-prep', 'vue-prep-path'],
    cta: 'Open Vue prep path',
    category: 'modern',
    level: 'advanced',
  },
];

const VUE_AUDIENCE_TRACKS: VueAudienceTrack[] = [
  {
    title: 'Vue.js interview questions for beginners',
    detail: 'Start with Vue templates, directives, components, props, emits, v-model, computed values, watchers, lifecycle hooks, and the difference between v-if, v-show, and v-for keys.',
  },
  {
    title: 'Vue.js interview questions for experienced developers',
    detail: 'Move into reactivity traps, Composition API design, composables, Router guards, Pinia/Vuex boundaries, SSR/Nuxt hydration, testing, security, performance, and production debugging scenarios.',
  },
];

const VUE_REACTIVITY_RENDERING_QUESTIONS: VueFocusedQuestionItem[] = [
  {
    level: 'intermediate',
    q: 'How does Vue know which component to update?',
    a: 'Vue tracks which reactive values are read while rendering or while running an effect. When one of those values changes, Vue schedules the dependent component or effect instead of rerendering everything immediately. The practical debugging step is to find which reactive read created the dependency.',
    route: ['/vue', 'trivia', 'vue-reactivity-system'],
    cta: 'Review dependency tracking',
  },
  {
    level: 'advanced',
    q: 'Why can destructuring break Vue reactivity?',
    a: 'Destructuring a property out of a reactive object can copy the current value out of the proxy. Later reads may no longer go through Vue tracking, so updates can appear stale. Use toRef or toRefs when extracted properties must remain reactive.',
    route: ['/vue', 'trivia', 'vue-destructuring-breaks-reactivity-torefs-toref'],
    cta: 'Debug destructuring',
  },
  {
    level: 'intermediate',
    q: 'Why should computed values avoid side effects?',
    a: 'Computed getters are meant to return cached derived state from reactive inputs. If a computed getter writes state, fetches data, or mutates external resources, rendering can become unpredictable. Use watch or watchEffect for side effects and keep computed values pure.',
    route: ['/vue', 'trivia', 'vue-computed-vs-watchers'],
    cta: 'Compare computed and watch',
  },
  {
    level: 'intermediate',
    q: 'Why does nextTick matter for DOM reads?',
    a: 'Vue batches reactive updates and patches the DOM asynchronously. Reading or focusing DOM immediately after changing state can see the old DOM. nextTick waits for the pending patch, which makes it useful for focus, measurement, and scroll logic.',
    route: ['/vue', 'trivia', 'vue-nexttick-dom-update-queue'],
    cta: 'Review DOM timing',
  },
  {
    level: 'intermediate',
    q: 'How does v-if affect component lifecycle?',
    a: 'v-if creates and destroys the element or component as the condition changes. That means child state resets, mounted and unmounted hooks can run, and cleanup must be correct. Use v-show when preserving state and avoiding repeated lifecycle work matters more than removing DOM.',
    route: ['/vue', 'trivia', 'vue-v-if-component-creation-destruction'],
    cta: 'Review v-if behavior',
  },
  {
    level: 'intermediate',
    q: 'How do keys affect state preservation?',
    a: 'Keys tell Vue which item or component instance is the same across renders. Stable keys preserve the right local state during reorder, insertion, and deletion. Unstable or index keys can attach input state, animation state, or component state to the wrong data item.',
    route: ['/vue', 'trivia', 'vue-v-for-keys-why-not-index'],
    cta: 'Review keyed lists',
  },
  {
    level: 'advanced',
    q: 'What does Vue virtual DOM diffing optimize?',
    a: 'Vue compares virtual nodes to patch only the DOM regions that changed. Static analysis and keyed identity help Vue skip or narrow work. Diffing still depends on clear state and stable identity; it cannot guess business meaning when keys are wrong.',
    route: ['/vue', 'trivia', 'vue-virtual-dom-diffing'],
    cta: 'Review diffing',
  },
  {
    level: 'advanced',
    q: 'How are Vue DOM updates batched?',
    a: 'Vue queues reactive updates and flushes DOM patches together to avoid unnecessary repeated work. Multiple state writes in the same tick can produce one DOM update. This improves performance but means DOM-dependent code must wait for the flush when timing matters.',
    route: ['/vue', 'trivia', 'vue-internal-rendering-pipeline'],
    cta: 'Review rendering pipeline',
  },
];

const VUE_COMPONENT_CONTRACT_QUESTIONS: VueFocusedQuestionItem[] = [
  {
    level: 'intermediate',
    q: 'Why should child components avoid mutating props?',
    a: 'Props are parent-owned inputs, so mutating them inside a child creates two unclear owners for the same state. Vue may warn, and the next parent render can overwrite the child mutation. Emit an event that describes intent and let the parent update its state.',
    route: ['/vue', 'trivia', 'vue-child-mutates-prop-directly'],
    cta: 'Review prop ownership',
  },
  {
    level: 'intermediate',
    q: 'What is the difference between native and component events?',
    a: 'Native events come from DOM elements, while component events are emitted by Vue components as part of their public API. Component events do not automatically bubble like DOM events. Declaring emits makes that boundary explicit and easier to type or refactor.',
    route: ['/vue', 'trivia', 'vue-native-vs-component-events'],
    cta: 'Compare event boundaries',
  },
  {
    level: 'intermediate',
    q: 'How do scoped slots change component design?',
    a: 'Scoped slots let a child expose data while the parent controls how that data is rendered. This is useful for reusable list, table, and layout components. The trade-off is that the parent becomes responsible for rendering details, so the slot contract must stay clear.',
    route: ['/vue', 'trivia', 'vue-slots-default-named-scoped-slot-props'],
    cta: 'Review scoped slots',
  },
  {
    level: 'advanced',
    q: 'What is the hidden cost of provide/inject?',
    a: 'provide/inject reduces prop drilling but creates an implicit dependency between ancestor and descendant. That can make data flow harder to discover and test. Use it for stable context-like dependencies, not as a replacement for every shared state problem.',
    route: ['/vue', 'trivia', 'vue-provide-inject-vs-prop-drilling-tradeoffs'],
    cta: 'Review provide/inject',
  },
  {
    level: 'intermediate',
    q: 'How should v-model be designed on custom components?',
    a: 'A custom component should treat its model prop as an input and emit update events when the user changes it. It should not mutate the model prop directly. Named models and modifiers can support richer contracts, but the one-way ownership pattern still matters.',
    route: ['/vue', 'trivia', 'vue-v-model-syntax-sugar-expansion'],
    cta: 'Review v-model expansion',
  },
  {
    level: 'intermediate',
    q: 'Why do single-file components help maintainability?',
    a: 'Single-file components keep template, script, and style for a component in one explicit module. They make ownership, imports, and local styles easier to reason about than broad global registration. Global components still fit truly shared primitives, but feature components should usually remain local.',
    route: ['/vue', 'trivia', 'vue-sfc-vs-global-components'],
    cta: 'Review SFC trade-offs',
  },
  {
    level: 'beginner',
    q: 'What should a Vue component public API include?',
    a: 'A component public API is mostly its props, emits, slots, and exposed behavior. The API should describe what the parent can control and what events the child can request. Internal refs, watchers, and DOM details should not leak unless the component is intentionally exposing them.',
    route: ['/vue', 'trivia', 'vue-why-declare-emits-type-safety-maintenance'],
    cta: 'Review emits contracts',
  },
  {
    level: 'advanced',
    q: 'How do component boundaries affect scalability?',
    a: 'Vue apps scale better when state ownership, feature boundaries, and component contracts are explicit. A flat global store or broad provide/inject tree can hide too much coupling. Clear component boundaries make tests, refactors, and route-level loading safer.',
    route: ['/vue', 'trivia', 'vue-architecture-decisions-scalability'],
    cta: 'Review architecture choices',
  },
];

const VUE_SCENARIO_QUESTIONS: VueScenarioQuestionItem[] = [
  {
    level: 'advanced',
    q: 'Why does this destructured value stop updating?',
    code: `const state = reactive({ count: 0 });
const { count } = state;

function increment() {
  state.count++;
}`,
    explanation: 'count is copied out of the reactive proxy, so reads of count no longer go through Vue tracking. Use toRef(state, "count") or toRefs(state) when the extracted value must remain reactive.',
    route: ['/vue', 'trivia', 'vue-destructuring-breaks-reactivity-torefs-toref'],
    cta: 'Fix destructuring',
  },
  {
    level: 'advanced',
    q: 'Why can this watch callback recurse forever?',
    code: `watch(total, () => {
  total.value++;
});

total.value = 1;`,
    explanation: 'watch tracks total as an explicit source, so writing total again in its callback schedules another watcher update. Use computed for derived values and keep writes in explicit actions instead of synchronizing a source back into itself.',
    route: ['/vue', 'trivia', 'vue-watch-vs-watcheffect-differences-infinite-loops'],
    cta: 'Review watcher recursion',
  },
  {
    level: 'intermediate',
    q: 'Why can this list keep the wrong input value?',
    code: `<li v-for="(item, index) in items" :key="index">
  <input v-model="item.name">
</li>`,
    explanation: 'The index key changes meaning when items are inserted, removed, or reordered. Vue can reuse DOM and component state for the wrong item. Use a stable item id as the key.',
    route: ['/vue', 'trivia', 'vue-v-for-keys-why-not-index'],
    cta: 'Debug index keys',
  },
  {
    level: 'intermediate',
    q: 'Why is this prop mutation fragile?',
    code: `const props = defineProps<{ user: { name: string } }>();

function rename() {
  props.user.name = 'Ada';
}`,
    explanation: 'The child is mutating parent-owned data through an object prop. That hides the update from the component contract and can be overwritten by the parent. Emit an intent event or ask the parent to pass a dedicated update callback.',
    route: ['/vue', 'trivia', 'vue-child-mutates-prop-directly'],
    cta: 'Review prop mutation',
  },
  {
    level: 'intermediate',
    q: 'Why does this focus call miss the input?',
    code: `editing.value = true;
inputRef.value?.focus();`,
    explanation: 'Changing editing schedules a DOM update, but the input may not exist until Vue flushes that update. Await nextTick before focusing the element. This is a timing issue, not a reason to delay every state change.',
    route: ['/vue', 'trivia', 'vue-nexttick-dom-update-queue'],
    cta: 'Review nextTick',
  },
  {
    level: 'intermediate',
    q: 'Why does this form reset when toggled?',
    code: `<ProfileForm v-if="showProfile" />`,
    explanation: 'v-if destroys and recreates the component, so local form state resets. If the form should preserve state while hidden, v-show or lifting the state may be a better choice. The correct answer depends on whether reset is desired.',
    route: ['/vue', 'trivia', 'vue-v-show-vs-v-if-dom-lifecycle'],
    cta: 'Compare v-if and v-show',
  },
  {
    level: 'advanced',
    q: 'Why is this computed property unsafe?',
    code: `const fullName = computed(() => {
  analytics.track('full-name-read');
  return first.value + ' ' + last.value;
});`,
    explanation: 'Computed getters can run during rendering and should remain pure. Tracking analytics inside the getter creates a side effect tied to rendering and cache invalidation. Use watch when a state change should trigger external work.',
    route: ['/vue', 'trivia', 'vue-computed-vs-watchers'],
    cta: 'Review computed purity',
  },
  {
    level: 'advanced',
    q: 'Why can this search show stale results?',
    code: `watch(query, async (value) => {
  results.value = await searchUsers(value);
});`,
    explanation: 'A slower previous request can resolve after a newer request and overwrite the latest results. Track request identity, cancel stale work when possible, or ignore responses that no longer match the current query.',
    route: ['/vue', 'coding', 'vue-debounced-search'],
    cta: 'Practice debounced search',
  },
];

const VUE_MODERN_QUESTIONS: VueModernQuestionItem[] = [
  {
    level: 'intermediate',
    q: 'How does Composition API differ from Options API?',
    a: 'Options API organizes code by option type, such as data, computed, methods, and hooks. Composition API organizes related feature logic together inside setup and composables. Options API can still be fine, but Composition API is usually easier to scale when logic is reused or split by feature.',
    route: ['/vue', 'trivia', 'vue-composition-api'],
    cta: 'Review Composition API',
  },
  {
    level: 'intermediate',
    q: 'What does script setup improve?',
    a: 'script setup is a compile-time syntax for writing Composition API components with less boilerplate. Top-level bindings are directly available to the template, and defineProps and defineEmits make component contracts concise. The trade-off is that developers must understand the compile-time macros instead of treating them like normal runtime functions.',
    route: ['/vue', 'trivia', 'vue-composition-api'],
    cta: 'Review setup patterns',
  },
  {
    level: 'advanced',
    q: 'What makes a good Vue composable?',
    a: 'A good composable has a clear input and output contract, owns cleanup for side effects it creates, and does not hide surprising shared state. It should be reusable without forcing a component structure. If every consumer needs different lifecycle or ownership rules, the abstraction may be too broad.',
    route: ['/vue', 'trivia', 'vue-composition-api-vs-mixins'],
    cta: 'Review reuse trade-offs',
  },
  {
    level: 'advanced',
    q: 'Why is Pinia the modern default over Vuex?',
    a: 'Pinia has a simpler API, strong TypeScript ergonomics, and fits Vue 3 Composition API patterns well. Vuex still appears in existing apps and teaches useful centralized-state concepts. Migration should focus on store boundaries and update flow, not only syntax replacement.',
    route: ['/vue', 'trivia', 'vuex-state-management'],
    cta: 'Review store boundaries',
  },
  {
    level: 'intermediate',
    q: 'What changed with Vue Router 4 style guards?',
    a: 'Vue Router 4 encourages returning values from guards instead of relying on next callbacks everywhere. This makes allowed, redirected, and canceled navigation outcomes clearer. Guard code still needs careful async handling to avoid loops or unresolved navigation.',
    route: ['/vue', 'trivia', 'vue-router-navigation'],
    cta: 'Review router flow',
  },
  {
    level: 'advanced',
    q: 'What is Teleport used for in Vue?',
    a: 'Teleport renders part of a component subtree somewhere else in the DOM, such as moving a modal to a root overlay container. It keeps logical component ownership while changing DOM placement. Focus management, stacking, and cleanup still need to be handled correctly.',
    route: ['/guides', 'framework-prep', 'vue-prep-path'],
    cta: 'Open Vue prep path',
  },
  {
    level: 'advanced',
    q: 'What is Suspense used for in Vue?',
    a: 'Suspense can coordinate fallback UI while async dependencies inside a component tree resolve. It is useful around async setup and route-level loading patterns. The boundary placement matters because too broad a boundary hides too much UI and too narrow a boundary can create noisy loading states.',
    route: ['/guides', 'framework-prep', 'vue-prep-path'],
    cta: 'Open Vue prep path',
  },
  {
    level: 'advanced',
    q: 'How do SSR and Nuxt affect Vue interviews?',
    a: 'SSR renders HTML on the server, then the client hydrates it into an interactive Vue app. Nuxt adds routing, data loading, SSR conventions, and deployment structure around Vue. Hydration bugs often come from different server and client output, browser-only data during initial render, or unstable IDs.',
    route: ['/guides', 'framework-prep', 'vue-prep-path'],
    cta: 'Open Vue prep path',
  },
];

const VUE_TESTING_SECURITY_PERFORMANCE_QUESTIONS: VueFocusedQuestionItem[] = [
  {
    level: 'intermediate',
    q: 'How should Vue component behavior be tested?',
    a: 'Test user-visible behavior through rendered output, interactions, emitted events, validation states, loading, and errors. Vue Test Utils helps mount components and interact with them, while tests should avoid depending on private implementation details. The goal is to prove the component contract, not the exact internal ref names.',
    route: ['/guides', 'framework-prep', 'vue-prep-path'],
    cta: 'Open Vue prep path',
  },
  {
    level: 'intermediate',
    q: 'How do Vitest and Vue Test Utils fit together?',
    a: 'Vitest runs assertions, mocks, timers, and test files, while Vue Test Utils renders Vue components and exposes wrapper utilities. Together they cover component behavior and smaller unit logic. A good test still waits for Vue async DOM updates before asserting rendered changes.',
    route: ['/guides', 'framework-prep', 'vue-prep-path'],
    cta: 'Open Vue prep path',
  },
  {
    level: 'advanced',
    q: 'How do you test async Vue updates?',
    a: 'After changing reactive state or triggering DOM events, wait for Vue to flush updates with nextTick or helper utilities. For promises and network-like flows, flush pending promises before asserting final UI. Otherwise tests may pass or fail based on timing instead of behavior.',
    route: ['/vue', 'trivia', 'vue-nexttick-dom-update-queue'],
    cta: 'Review update timing',
  },
  {
    level: 'intermediate',
    q: 'How do you test Vue emitted events?',
    a: 'Mount the component, trigger the user action, and assert the emitted event name and payload. This verifies the child contract without requiring a parent component. For v-model components, assert the update event rather than mutating the prop in the child.',
    route: ['/vue', 'trivia', 'vue-why-declare-emits-type-safety-maintenance'],
    cta: 'Review emits',
  },
  {
    level: 'advanced',
    q: 'Why is v-html a security risk?',
    a: 'v-html inserts raw HTML into the DOM, so untrusted content can create XSS if it is not sanitized before rendering. Interpolation escapes text by default, but v-html intentionally bypasses that escaping. Use it only for trusted or sanitized HTML and keep user-controlled input out of DOM sinks.',
    route: ['/vue', 'trivia', 'vue-reactive-interpolation-into-dom'],
    cta: 'Review interpolation safety',
  },
  {
    level: 'advanced',
    q: 'How should rich text be rendered safely in Vue?',
    a: 'Sanitize rich text before it reaches v-html, restrict allowed tags and attributes, and avoid user-controlled URLs or scripts. Backend validation and a Content Security Policy reduce the impact of mistakes. Client-side rendering choices do not replace server-side trust boundaries.',
    route: ['/vue', 'trivia', 'vue-reactive-interpolation-into-dom'],
    cta: 'Review DOM safety',
  },
  {
    level: 'advanced',
    q: 'How do you profile Vue performance?',
    a: 'Start with browser performance tools and Vue Devtools to identify expensive components, renders, and data changes. Then reduce unnecessary reactive dependencies, expensive template methods, unstable keys, and oversized lists. Optimization should follow measurement instead of guessing.',
    route: ['/vue', 'trivia', 'vue-virtual-dom-diffing'],
    cta: 'Review rendering costs',
  },
  {
    level: 'advanced',
    q: 'How do Vue components leak memory?',
    a: 'Leaks usually come from timers, event listeners, subscriptions, observers, or async callbacks that outlive the component. Cleanup belongs in the lifecycle owner that created the resource. Watchers and effects should also have clear invalidation or teardown behavior when they create external work.',
    route: ['/vue', 'trivia', 'vue-lifecycle-hooks'],
    cta: 'Review cleanup hooks',
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
    answer: 'Angular forms questions usually test state ownership, validation timing, async validation, and reusable controls. Mature Reactive Forms remain a strong option for dynamic or established workflows, while stable Signal Forms in Angular 22 are a production option for new signal-first applications. The best answer states the interoperability and migration trade-offs instead of naming one universal winner.',
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
  'Signal Forms: stable and production-ready in Angular 22 for signal-first applications, but not a universal replacement for every mature Reactive Forms workflow.',
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
    explanation: 'The href makes this anchor a real hyperlink; an anchor without href is not a hyperlink. Its accessible name comes from the image alt text, so "arrow" still does not describe the destination or action. Use alt text such as "View pricing" or add visible text.',
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
    cta: 'Build a responsive CSS Grid card gallery',
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
    cta: 'Build a responsive navbar with CSS Flexbox',
    level: 'intermediate',
  },
  {
    q: 'How should cards adapt in a responsive grid?',
    a: 'Cards should keep readable text, stable media ratios, and consistent action placement as columns change. Grid with minmax() and auto-fit can reduce breakpoint code while preserving minimum card width. Test long titles and missing images because they expose fragile card layouts.',
    route: ['/css', 'coding', 'css-grid-card-gallery'],
    cta: 'CSS Grid minmax() card gallery challenge',
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

const CSS_EDITORIAL_SIGNAL: CssEditorialSignal = {
  reviewedLabel: 'Reviewed May 20, 2026',
  reviewer: 'FrontendAtlas Editor',
  coverage: '65 visible CSS questions across cascade, specificity, box model, layout, responsive design, debugging, performance, and maintainable CSS',
  dateModified: '2026-05-20T00:00:00.000Z',
};

const CSS_ANCHOR_ITEMS: CssAnchorItem[] = [
  { label: 'Clusters', targetId: 'iq-css-clusters-title' },
  { label: 'Short answers', targetId: 'iq-css-short-answers-title' },
  { label: 'Audience', targetId: 'iq-css-audience-title' },
  { label: 'Cascade + specificity', targetId: 'iq-css-cascade-title' },
  { label: 'Box model + overflow', targetId: 'iq-css-box-model-title' },
  { label: 'Layout systems', targetId: 'iq-css-layout-title' },
  { label: 'Responsive CSS', targetId: 'iq-css-responsive-title' },
  { label: 'Debugging + performance', targetId: 'iq-css-debugging-title' },
  { label: 'Coding drills', targetId: 'iq-css-coding-preview-title' },
  { label: 'Concepts', targetId: 'iq-css-concept-preview-title' },
];

const CSS_KEYWORD_CLUSTERS: CssKeywordClusterItem[] = [
  {
    label: 'CSS interview questions for beginners',
    targetId: 'iq-css-short-answers-title',
    detail: 'CSS basics, box model, display, units, selectors, and first responsive rules.',
  },
  {
    label: 'CSS interview questions for experienced developers',
    targetId: 'iq-css-audience-title',
    detail: 'Production layout trade-offs, debugging, maintainability, and performance choices.',
  },
  {
    label: 'CSS specificity and cascade questions',
    targetId: 'iq-css-cascade-title',
    detail: 'Cascade order, layers, selector weight, inheritance, and conflict resolution.',
  },
  {
    label: 'CSS box model and overflow questions',
    targetId: 'iq-css-box-model-title',
    detail: 'Sizing, margins, padding, border-box, min-width, scrollbars, and clipped content.',
  },
  {
    label: 'Flexbox and CSS Grid interview questions',
    targetId: 'iq-css-layout-title',
    detail: 'One-dimensional layout, two-dimensional layout, containing blocks, sticky, and stacking.',
  },
  {
    label: 'Responsive CSS and media query questions',
    targetId: 'iq-css-responsive-title',
    detail: 'Media queries, container queries, clamp(), responsive cards, and adaptive navigation.',
  },
  {
    label: 'CSS debugging and performance questions',
    targetId: 'iq-css-debugging-title',
    detail: 'Missing styles, z-index, overflow, layout work, compositing, and maintainable CSS.',
  },
];

const CSS_SHORT_ANSWERS: CssShortAnswerItem[] = [
  {
    q: 'What is CSS?',
    a: 'CSS is the styling language browsers use to control presentation, layout, and visual states for HTML documents. It maps selectors to declarations, then the browser resolves those declarations through the cascade and computes final styles. CSS can fail in surprising ways because multiple rules, inherited values, browser defaults, and responsive constraints all interact.',
    route: ['/css', 'trivia', 'css-definition'],
    cta: 'Review CSS basics',
    category: 'fundamentals',
    level: 'beginner',
  },
  {
    q: 'How does the CSS cascade work?',
    a: 'The cascade decides which declaration wins when more than one rule applies to the same property. It evaluates origin, importance, cascade layers, specificity, scoping proximity, and source order. Source order only wins after the higher-priority cascade factors are tied.',
    route: ['/css', 'trivia', 'css-cascade-order'],
    cta: 'Review cascade order',
    category: 'cascade-selectors',
    level: 'intermediate',
  },
  {
    q: 'What is CSS specificity?',
    a: 'Specificity is the selector weight used when competing declarations are in the same origin and layer. Inline styles, IDs, classes or attributes, and element selectors carry different weight. Specificity fixes can become a maintenance problem when every override needs a stronger selector.',
    route: ['/css', 'trivia', 'css-specificity-hierarchy'],
    cta: 'Practice specificity',
    category: 'cascade-selectors',
    level: 'intermediate',
  },
  {
    q: 'What is inheritance in CSS?',
    a: 'Inheritance lets some computed values pass from parent elements to children. Text-related properties such as color and font-family commonly inherit, while layout properties such as margin and border usually do not. Bugs happen when a component unexpectedly receives typography, color, or custom property values from a parent context.',
    category: 'cascade-selectors',
    level: 'beginner',
  },
  {
    q: 'What is the CSS box model?',
    a: 'The box model describes how content, padding, border, and margin create an element box and spacing around it. With content-box, width applies only to content; with border-box, width includes padding and border. Many layout bugs come from mixing those sizing assumptions in the same component.',
    route: ['/css', 'trivia', 'css-box-model'],
    cta: 'Review the box model',
    category: 'fundamentals',
    level: 'beginner',
  },
  {
    q: 'What is the difference between margin and padding?',
    a: 'Padding creates space inside an element between its content and border. Margin creates space outside the element between it and neighboring boxes. Margin can collapse vertically in normal flow, while padding affects the element box and background area.',
    route: ['/css', 'trivia', 'css-margin-vs-padding'],
    cta: 'Compare margin and padding',
    category: 'fundamentals',
    level: 'beginner',
  },
  {
    q: 'How does display affect layout?',
    a: 'The display property controls how an element generates boxes and how its children participate in layout. Block, inline, flex, grid, and none all create very different layout behavior. Changing display can also change whether width, height, alignment, and child placement rules apply.',
    route: ['/css', 'trivia', 'css-display-flex'],
    cta: 'Review display and Flexbox',
    category: 'layout',
    level: 'beginner',
  },
  {
    q: 'When should you use Flexbox?',
    a: 'Flexbox is best for one-dimensional layouts where items need alignment, distribution, wrapping, or ordering along a row or column. It is well suited for nav bars, toolbars, centered content, and small component internals. For layout where rows and columns both matter, Grid is usually clearer.',
    route: ['/css', 'trivia', 'css-display-flex'],
    cta: 'Review Flexbox',
    category: 'layout',
    level: 'beginner',
  },
  {
    q: 'When should you use CSS Grid?',
    a: 'CSS Grid is best for two-dimensional layouts where rows and columns need to be controlled together. It handles page regions, card galleries, dashboards, and layouts with explicit tracks or areas. It can be more structure than needed for a single row of aligned controls.',
    route: ['/css', 'trivia', 'css-grid-vs-flexbox'],
    cta: 'Compare Grid and Flexbox',
    category: 'layout',
    level: 'intermediate',
  },
  {
    q: 'How does CSS positioning work?',
    a: 'Positioning controls whether an element stays in normal flow and what box its offsets use. Relative keeps its original space, absolute positions against a containing block, fixed uses the viewport, and sticky switches as the user scrolls. Positioning bugs often come from the wrong containing block or scroll container.',
    route: ['/css', 'trivia', 'css-position-relative-absolute-fixed'],
    cta: 'Review positioning',
    category: 'layout',
    level: 'intermediate',
  },
  {
    q: 'What is a stacking context?',
    a: 'A stacking context is a layer group where child z-index values are compared internally. Transforms, opacity, filters, positioned elements, isolation, and other properties can create new stacking contexts. An element with a large z-index can still appear behind another element if its parent context is lower.',
    route: ['/css', 'trivia', 'css-z-index'],
    cta: 'Debug stacking contexts',
    category: 'layout',
    level: 'advanced',
  },
  {
    q: 'How does z-index work?',
    a: 'z-index controls stacking order only for positioned or stacking-context-aware elements. It does not create a global ranking across the whole page. If two elements are in different stacking contexts, changing the child z-index may not change which one appears on top.',
    route: ['/css', 'trivia', 'css-z-index'],
    cta: 'Review z-index',
    category: 'layout',
    level: 'intermediate',
  },
  {
    q: 'How do rem, em, px, and percent differ?',
    a: 'px is an absolute CSS pixel unit, rem is relative to the root font size, em is relative to the current element font size, and percent depends on the property and containing context. rem is predictable for global spacing and type scales, while em is useful for component-relative sizing. Percent values can surprise you because width, height, transforms, and padding can use different reference boxes.',
    route: ['/css', 'trivia', 'css-units-em-rem-percent-px'],
    cta: 'Review CSS units',
    category: 'responsive',
    level: 'intermediate',
  },
  {
    q: 'What are media queries used for?',
    a: 'Media queries apply CSS when viewport, device, environment, or user preference conditions match. They are used for responsive layouts, reduced motion, color scheme, print styles, and input capabilities. Good media queries respond to layout constraints instead of copying a fixed list of device sizes.',
    route: ['/css', 'trivia', 'css-media-queries'],
    cta: 'Review media queries',
    category: 'responsive',
    level: 'beginner',
  },
  {
    q: 'What are container queries?',
    a: 'Container queries let a component adapt to the size or style context of its container instead of only the viewport. They are useful when the same component appears in a sidebar, grid, and full-width region. The component needs a defined query container, otherwise the query has no useful container to evaluate.',
    category: 'responsive',
    level: 'advanced',
  },
  {
    q: 'What does responsive design mean in CSS?',
    a: 'Responsive design means the UI adapts to different widths, input modes, zoom levels, content lengths, and user preferences. CSS tools include fluid units, media queries, container queries, flexible tracks, wrapping, and stable aspect ratios. A responsive layout should be tested with long content and narrow widths, not only common device presets.',
    route: ['/css', 'trivia', 'css-make-element-responsive'],
    cta: 'Practice responsive CSS',
    category: 'responsive',
    level: 'beginner',
  },
  {
    q: 'What are CSS custom properties?',
    a: 'CSS custom properties are variables declared with names like --space and read with var(). They cascade and inherit, so themes and component overrides can be controlled at runtime. The risk is accidental inheritance or missing fallbacks that make a component pick up the wrong value.',
    route: ['/css', 'trivia', 'css-custom-properties'],
    cta: 'Review custom properties',
    category: 'cascade-selectors',
    level: 'intermediate',
  },
  {
    q: 'What are pseudo-classes and pseudo-elements?',
    a: 'Pseudo-classes select elements in a state, such as :hover, :focus-visible, :checked, or :nth-child(). Pseudo-elements style generated parts of an element, such as ::before, ::after, or ::marker. Focus styles are a practical edge case because removing outlines globally breaks keyboard navigation.',
    route: ['/css', 'trivia', 'css-pseudo-classes-elements'],
    cta: 'Review pseudo selectors',
    category: 'cascade-selectors',
    level: 'intermediate',
  },
  {
    q: 'What is BEM in CSS?',
    a: 'BEM is a naming convention that separates blocks, elements, and modifiers to make selector intent explicit. It avoids deep descendant selectors and helps teams reason about component state. It is a convention, not a browser feature, so it works only when the team applies it consistently.',
    category: 'debugging-performance',
    level: 'intermediate',
  },
  {
    q: 'How do you debug CSS overflow?',
    a: 'Find the element that is wider or taller than its container, then inspect fixed widths, min-width defaults, grid tracks, absolute positioning, and long unwrapped text. Flex and grid children often need min-width: 0 or min-height: 0 to shrink correctly. Hiding overflow can mask the problem while making content or focus unreachable.',
    route: ['/css', 'trivia', 'css-make-element-responsive'],
    cta: 'Fix responsive overflow',
    category: 'debugging-performance',
    level: 'advanced',
  },
  {
    q: 'How do min-width and max-width affect responsive layout?',
    a: 'min-width prevents an element from shrinking below a threshold, while max-width prevents it from growing beyond a threshold. They are useful for readable cards, text columns, and media, but they can also create overflow if the minimum is too large. In flex and grid layouts, automatic minimum sizes are a common reason content refuses to shrink.',
    route: ['/css', 'trivia', 'css-make-element-responsive'],
    cta: 'Practice responsive sizing',
    category: 'responsive',
    level: 'intermediate',
  },
  {
    q: 'How do transforms and transitions differ?',
    a: 'Transforms change how an element is visually moved, scaled, rotated, or skewed without changing normal document flow. Transitions animate a property change between two states. Transform and opacity animations are usually cheaper than animating layout properties like width, height, or top.',
    category: 'debugging-performance',
    level: 'intermediate',
  },
  {
    q: 'How should CSS animations be used safely?',
    a: 'CSS animations should support the UI state without delaying essential information or causing motion discomfort. Use prefers-reduced-motion to simplify or remove nonessential motion for users who request it. Animating layout-heavy properties can create performance problems on slower devices.',
    route: ['/css', 'trivia', 'css-media-queries'],
    cta: 'Review media features',
    category: 'debugging-performance',
    level: 'intermediate',
  },
  {
    q: 'How do you improve CSS performance?',
    a: 'Start by measuring whether the problem is style recalculation, layout, paint, composite, or JavaScript. Prefer stable layout dimensions, avoid repeated layout reads after writes, and use transform or opacity for motion when possible. The transform vs top/left tradeoff matters because layout properties can re-enter layout and paint, while compositor-friendly properties can often reuse painted layers.',
    route: ['/css', 'trivia', 'css-hardware-acceleration'],
    cta: 'CSS animation performance',
    category: 'debugging-performance',
    level: 'advanced',
  },
  {
    q: 'How do you debug a CSS layout bug?',
    a: 'Inspect the element in DevTools, check the computed styles, and identify the actual constraint that fails. Then isolate cascade conflicts, box sizing, display mode, positioning, overflow, and responsive breakpoints. Guessing from the stylesheet alone is slower because the live DOM state may differ from the source you are reading.',
    route: ['/css', 'trivia', 'css-make-element-responsive'],
    cta: 'Practice layout debugging',
    category: 'debugging-performance',
    level: 'advanced',
  },
];

const CSS_AUDIENCE_TRACKS: CssAudienceTrack[] = [
  {
    title: 'CSS interview questions for beginners',
    detail: 'Start with selectors, the cascade, inheritance, the box model, display, Flexbox, Grid, positioning, units, and media queries. The goal is to explain what the browser does before adding complicated patterns.',
  },
  {
    title: 'CSS interview questions for experienced frontend developers',
    detail: 'Move into cascade architecture, specificity control, responsive component constraints, stacking contexts, performance measurement, design tokens, and visual debugging. Experienced answers should connect CSS choices to maintainability and production UI failures.',
  },
];

const CSS_CASCADE_QUESTIONS: CssFocusedQuestionItem[] = [
  {
    q: 'What order does the cascade use to choose a declaration?',
    a: 'The cascade evaluates origin and importance first, then cascade layers, specificity, scoping proximity, and source order. This means a later rule does not always win. Debugging should start with the computed style panel because it shows which cascade factor won.',
    route: ['/css', 'trivia', 'css-cascade-order'],
    cta: 'Review cascade order',
    level: 'intermediate',
  },
  {
    q: 'How is CSS specificity calculated?',
    a: 'Specificity compares selector weight from IDs, classes or attributes, pseudo-classes, elements, and pseudo-elements. It is compared only after higher cascade factors such as origin and layers are resolved. Inline styles and !important can change the conflict path and should be treated carefully.',
    route: ['/css', 'trivia', 'css-specificity-hierarchy'],
    cta: 'Practice specificity',
    level: 'intermediate',
  },
  {
    q: 'How do cascade layers help large stylesheets?',
    a: 'Cascade layers let you define priority groups such as reset, base, components, utilities, and overrides. A declaration in a later layer can beat a more specific declaration in an earlier layer. This reduces specificity escalation because priority can be modeled by layer order.',
    route: ['/css', 'trivia', 'css-cascade-order'],
    cta: 'Review cascade layers',
    level: 'advanced',
  },
  {
    q: 'How are inheritance and initial values different?',
    a: 'Inheritance reuses a computed value from the parent when a property is inheritable. An initial value is the property default defined by CSS when no cascade or inherited value applies. The distinction matters when reset styles or component wrappers unexpectedly change text, color, or spacing behavior.',
    level: 'beginner',
  },
  {
    q: 'How do :is(), :where(), and :has() affect selectors?',
    a: ':is() and :has() can make selectors more expressive, while :where() always contributes zero specificity. :has() can select a parent based on children or state, which avoids some JavaScript but can make selectors more complex. These selectors should be used with specificity and performance awareness.',
    route: ['/css', 'trivia', 'css-pseudo-classes-elements'],
    cta: 'Review pseudo selectors',
    level: 'advanced',
  },
  {
    q: 'When should !important be used?',
    a: '!important raises a declaration above normal declarations in the same cascade path. It can be justified for utility overrides, accessibility helpers, or third-party constraints, but it should not be the default way to fix conflicts. Overusing it makes later changes harder because every override needs another escalation.',
    route: ['/css', 'trivia', 'css-cascade-order'],
    cta: 'Review importance rules',
    level: 'intermediate',
  },
  {
    q: 'Why are IDs risky in CSS selectors?',
    a: 'ID selectors have high specificity and are harder to override than class selectors. They can be useful for anchors or unique DOM targets, but they often make component styles rigid. Class-based selectors are usually easier to compose and maintain.',
    level: 'beginner',
  },
  {
    q: 'How do you avoid brittle selector strategy?',
    a: 'Keep selectors shallow, prefer stable class names, avoid styling through fragile DOM depth, and use layers or utilities for planned overrides. Deep descendant selectors break when markup changes. A good selector should describe the styling contract, not the entire DOM path.',
    level: 'advanced',
  },
];

const CSS_BOX_MODEL_QUESTIONS: CssFocusedQuestionItem[] = [
  {
    q: 'What is the difference between content-box and border-box?',
    a: 'content-box applies width and height to the content area only. border-box includes padding and border inside the declared width and height. border-box is often easier for responsive components because padding does not unexpectedly increase the outer size.',
    route: ['/css', 'trivia', 'css-box-model'],
    cta: 'Review box sizing',
    level: 'beginner',
  },
  {
    q: 'Why does padding change an element size?',
    a: 'Padding is part of the element box, so with content-box it adds to the declared width or height. With border-box it is included inside the declared size. The active box-sizing mode determines whether padding causes overflow.',
    route: ['/css', 'trivia', 'css-box-model'],
    cta: 'Review the box model',
    level: 'beginner',
  },
  {
    q: 'When do vertical margins collapse?',
    a: 'Vertical margins can collapse between block elements in normal flow, including parent and child edges under certain conditions. Padding, borders, flex, grid, and overflow contexts can stop collapse. Unexpected margin collapse often looks like spacing is being applied to the wrong element.',
    level: 'intermediate',
  },
  {
    q: 'Why can width: 100% still overflow?',
    a: 'With content-box, padding and border are added on top of the 100% content width. Fixed children, long words, minimum sizes, and scrollbar space can also push the box wider than its container. The fix depends on the exact source, not only changing overflow.',
    route: ['/css', 'trivia', 'css-box-model'],
    cta: 'Debug box sizing',
    level: 'intermediate',
  },
  {
    q: 'Why do flex and grid children refuse to shrink?',
    a: 'Flex and grid items can have automatic minimum sizes based on their content. Long text, tables, images, and nowrap content can keep an item wider than its container. Setting min-width: 0 or min-height: 0 on the right child often lets the layout shrink correctly.',
    route: ['/css', 'trivia', 'css-make-element-responsive'],
    cta: 'Fix shrink issues',
    level: 'advanced',
  },
  {
    q: 'When should overflow be hidden, auto, or visible?',
    a: 'visible lets content escape the box, hidden clips it, and auto adds scrolling only when needed. hidden can be useful for masks, but it can hide focus outlines or important content. auto is safer when content must remain reachable.',
    level: 'intermediate',
  },
  {
    q: 'How should component sizing be constrained?',
    a: 'Use min-width, max-width, width, aspect-ratio, and content-aware layout rules to define what a component can tolerate. A component should have a stable minimum usable size and a clear maximum reading width when needed. Without constraints, it may look fine in one viewport and break with real content.',
    route: ['/css', 'trivia', 'css-make-element-responsive'],
    cta: 'Practice sizing constraints',
    level: 'advanced',
  },
  {
    q: 'How do scrollbars affect layout?',
    a: 'Scrollbars can consume space, create nested scrolling, and change available width depending on platform and styling. Components with fixed widths can shift or overflow when scrollbars appear. Testing with real overflow content exposes issues that empty mock states hide.',
    route: ['/css', 'trivia', 'css-units-em-rem-percent-px'],
    cta: 'Review sizing units',
    level: 'advanced',
  },
];

const CSS_LAYOUT_QUESTIONS: CssFocusedQuestionItem[] = [
  {
    q: 'How does Flexbox alignment work?',
    a: 'Flexbox uses a main axis and a cross axis. justify-content distributes along the main axis, while align-items and align-content control the cross axis. Direction and wrapping change which axis each property affects.',
    route: ['/css', 'trivia', 'css-display-flex'],
    cta: 'Review Flexbox',
    level: 'beginner',
  },
  {
    q: 'How do CSS Grid tracks work?',
    a: 'Grid tracks are rows and columns defined with fixed, flexible, minmax, auto, or named sizes. The browser places items into grid cells and can create implicit tracks when items exceed the explicit grid. Track sizing bugs usually come from confusing available space with content minimums.',
    route: ['/css', 'trivia', 'css-grid-vs-flexbox'],
    cta: 'Review Grid',
    level: 'intermediate',
  },
  {
    q: 'How do you build a wrapping nav with CSS?',
    a: 'Use Flexbox when the nav is a row of items that can align, distribute, and wrap. Preserve readable labels and visible focus states as items move to another line or into a disclosure pattern. Hiding links without an alternate path creates a navigation failure.',
    route: ['/css', 'coding', 'css-flexbox-navbar'],
    cta: 'Practice a Flexbox navbar coding challenge',
    level: 'intermediate',
  },
  {
    q: 'What determines an absolutely positioned element containing block?',
    a: 'An absolutely positioned element uses the nearest positioned ancestor or another containing-block-creating ancestor for offsets. If none exists, it may position relative to the initial containing block. Unexpected absolute positioning usually means the intended parent was not actually the containing block.',
    route: ['/css', 'trivia', 'css-position-relative-absolute-fixed'],
    cta: 'Review positioning',
    level: 'intermediate',
  },
  {
    q: 'Why does position: sticky fail?',
    a: 'Sticky positioning depends on a scroll container, an inset value, and enough room inside the parent to move. Overflow on an ancestor can create a different scroll container than expected. Debug sticky by checking ancestor overflow and the element offset before changing z-index.',
    route: ['/css', 'trivia', 'css-position-relative-absolute-fixed'],
    cta: 'Debug sticky positioning',
    level: 'advanced',
  },
  {
    q: 'How should overlays handle stacking contexts?',
    a: 'Overlays should be placed in a predictable layer with clear stacking context ownership. A transformed or opaque parent can trap an overlay below other page regions. Moving the overlay to a root layer is often cleaner than increasing z-index values indefinitely.',
    route: ['/css', 'trivia', 'css-z-index'],
    cta: 'Review stacking behavior',
    level: 'advanced',
  },
  {
    q: 'How does auto-fit with minmax() help responsive grids?',
    a: 'auto-fit with minmax() lets the grid create as many columns as fit while preserving a usable minimum column width. It reduces breakpoint code for card galleries and dashboards. The minimum value should be chosen from content needs, not an arbitrary device width.',
    route: ['/css', 'coding', 'css-grid-card-gallery'],
    cta: 'Practice CSS Grid card layout',
    level: 'intermediate',
  },
  {
    q: 'When is float still relevant?',
    a: 'Float is mostly legacy for page layout but still useful for text wrapping around media. Modern layout should use Flexbox or Grid for component and page structure. Legacy float bugs often involve clearing behavior and parents that collapse around floated children.',
    level: 'intermediate',
  },
];

const CSS_RESPONSIVE_QUESTIONS: CssFocusedQuestionItem[] = [
  {
    q: 'What does mobile-first CSS mean?',
    a: 'Mobile-first CSS starts with the narrowest useful layout and adds rules as more space becomes available. It usually reduces overrides because the base styles already handle constrained screens. The component still needs to be tested with long text and zoom, not only a phone-width viewport.',
    route: ['/css', 'trivia', 'css-media-queries'],
    cta: 'Review media queries',
    level: 'beginner',
  },
  {
    q: 'How do container queries differ from media queries?',
    a: 'Media queries react to viewport or environment conditions, while container queries react to a component container. Container queries make reusable components adapt based on placement. They work best when component boundaries and container names are intentional.',
    level: 'advanced',
  },
  {
    q: 'How does clamp() help fluid CSS?',
    a: 'clamp() sets a minimum, preferred, and maximum value in one expression. It is useful for fluid typography, spacing, and widths that should scale but stay bounded. Without reasonable min and max values, fluid sizing can become too small or too large.',
    route: ['/css', 'coding', 'css-fluid-clamp'],
    cta: 'Practice fluid sizing',
    level: 'intermediate',
  },
  {
    q: 'How should responsive cards be designed?',
    a: 'Cards should keep stable media ratios, readable text, predictable action placement, and enough space for long titles. Grid with minmax() can adapt columns without many breakpoints. Test missing images and long content because they expose fragile card layouts.',
    route: ['/css', 'coding', 'css-grid-card-gallery'],
    cta: 'Responsive card grid interview prompt',
    level: 'intermediate',
  },
  {
    q: 'How should navigation adapt at small widths?',
    a: 'Navigation should preserve reachable links, visible focus, and clear current-state cues. Wrapping, scrolling, disclosure menus, or priority links can work depending on item count. Simply hiding links for small screens removes navigation rather than making it responsive.',
    route: ['/css', 'coding', 'css-flexbox-navbar'],
    cta: 'CSS Flexbox responsive navbar interview prompt',
    level: 'intermediate',
  },
  {
    q: 'How do you handle long words, URLs, and untrusted text?',
    a: 'Long content can break cards, tables, buttons, and grids. Use overflow-wrap, min-width: 0, max-width constraints, and intentional truncation rules. Truncated important content should have another way to be read.',
    route: ['/css', 'trivia', 'css-make-element-responsive'],
    cta: 'Fix responsive overflow',
    level: 'advanced',
  },
  {
    q: 'How should reduced motion be handled in CSS?',
    a: 'Use prefers-reduced-motion to simplify or remove nonessential motion for users who request it. State changes should still be understandable without animation. Reduced motion is not only an accessibility detail; it also prevents motion-heavy UI from delaying important feedback.',
    route: ['/css', 'trivia', 'css-media-queries'],
    cta: 'Review media features',
    level: 'intermediate',
  },
  {
    q: 'How do CSS variables support themes?',
    a: 'CSS variables let themes change tokens such as color, spacing, radius, and shadows through the cascade. They can be scoped globally, per component, or by state such as dark mode. The fallback and inheritance path should be clear so components do not receive accidental theme values.',
    route: ['/css', 'coding', 'css-theme-variables-dark-mode'],
    cta: 'Build a CSS variables dark mode challenge',
    level: 'intermediate',
  },
];

const CSS_DEBUGGING_PERFORMANCE_QUESTIONS: CssScenarioQuestionItem[] = [
  {
    q: 'How do you debug missing CSS styles?',
    a: 'Check whether the stylesheet loaded, whether the selector matches the live DOM, whether the declaration is valid, and whether another rule wins. DevTools computed styles show both winning and overridden declarations. Reading the stylesheet alone is slower because the element state may differ at runtime.',
    route: ['/css', 'trivia', 'css-cascade-order'],
    cta: 'Review cascade debugging',
    level: 'beginner',
  },
  {
    q: 'How do you debug a specificity conflict?',
    a: 'Inspect the losing declaration and compare layer, importance, specificity, and source order against the winner. Lowering the winning selector or using a planned layer is often better than adding a stronger selector. Specificity escalation makes the next change harder.',
    route: ['/css', 'trivia', 'css-specificity-hierarchy'],
    cta: 'Practice specificity',
    level: 'intermediate',
  },
  {
    q: 'How do you debug a z-index problem?',
    a: 'Find the stacking contexts first, then compare z-index values inside the relevant context. Transforms, opacity, filters, isolation, and positioned ancestors can change the layer model. A huge z-index cannot escape a lower parent stacking context.',
    route: ['/css', 'trivia', 'css-z-index'],
    cta: 'Debug z-index',
    level: 'advanced',
  },
  {
    q: 'How do you debug horizontal scroll?',
    a: 'Identify the element wider than the viewport, then inspect fixed widths, min-width defaults, grid tracks, absolute positioning, and long unwrapped content. Temporarily outlining elements can reveal the offender quickly. The durable fix should remove the bad constraint instead of hiding the page overflow.',
    route: ['/css', 'trivia', 'css-make-element-responsive'],
    cta: 'Practice overflow fixes',
    level: 'advanced',
  },
  {
    q: 'What causes layout thrashing?',
    a: 'Layout thrashing happens when code repeatedly writes styles and then reads layout values that force the browser to recalculate geometry. CSS-heavy UI can suffer when animations or scripts keep changing layout properties. Batch reads and writes, and avoid animating properties that trigger layout when possible.',
    level: 'advanced',
  },
  {
    q: 'How do hardware acceleration and compositing affect CSS animation performance?',
    a: 'Hardware acceleration can help when animations are moved to composited layers, often with transform or opacity. It does not fix expensive layout, paint, JavaScript work, or will-change pitfalls by itself. Use DevTools to inspect layout, paint, layer promotion, paint flashing, FPS, and dropped frames before claiming the GPU solved the problem.',
    route: ['/css', 'trivia', 'css-hardware-acceleration'],
    cta: 'CSS hardware acceleration and compositing',
    level: 'advanced',
  },
  {
    q: 'What makes CSS maintainable?',
    a: 'Maintainable CSS has predictable selectors, controlled cascade layers, reusable tokens, explicit states, and limited global leakage. Components should expose styling hooks intentionally instead of depending on deep DOM selectors. CSS becomes fragile when every change requires a more specific override.',
    route: ['/css', 'trivia', 'css-custom-properties'],
    cta: 'Review CSS tokens',
    level: 'advanced',
  },
  {
    q: 'What are common CSS debugging mistakes?',
    a: 'Common mistakes include guessing before inspecting computed styles, hiding overflow without finding the source, increasing z-index blindly, and fixing specificity by nesting more selectors. Another failure is testing only one viewport with short placeholder text. CSS debugging should isolate the constraint, verify the winning rule, and test realistic content.',
    route: ['/css', 'trivia', 'css-make-element-responsive'],
    cta: 'Practice responsive debugging',
    level: 'intermediate',
  },
];

const HTML_EDITORIAL_SIGNAL: HtmlEditorialSignal = {
  reviewedLabel: 'Reviewed May 21, 2026',
  reviewer: 'FrontendAtlas Editor',
  coverage: '65 visible HTML questions across semantics, forms, accessibility, metadata, DOM, native browser behavior, modern HTML, and markup scenarios',
  dateModified: '2026-05-21T00:00:00.000Z',
};

const HTML_ANCHOR_ITEMS: HtmlAnchorItem[] = [
  { label: 'Clusters', targetId: 'iq-html-clusters-title' },
  { label: 'Short answers', targetId: 'iq-html-short-answers-title' },
  { label: 'Audience', targetId: 'iq-html-audience-title' },
  { label: 'Semantics', targetId: 'iq-html-semantics-title' },
  { label: 'Forms', targetId: 'iq-html-forms-title' },
  { label: 'Accessibility + ARIA', targetId: 'iq-html-accessibility-title' },
  { label: 'Metadata + parsing', targetId: 'iq-html-metadata-title' },
  { label: 'Modern scenarios', targetId: 'iq-html-modern-scenarios-title' },
  { label: 'Coding drills', targetId: 'iq-html-coding-preview-title' },
  { label: 'Concepts', targetId: 'iq-html-concept-preview-title' },
  { label: 'Support', targetId: 'iq-html-coverage-title' },
];

const HTML_KEYWORD_CLUSTERS: HtmlKeywordClusterItem[] = [
  {
    label: 'HTML interview questions for beginners',
    targetId: 'iq-html-short-answers-title',
    detail: 'Document structure, elements, DOM, links, images, forms, and metadata basics.',
  },
  {
    label: 'HTML interview questions for experienced developers',
    targetId: 'iq-html-audience-title',
    detail: 'Accessibility trade-offs, parsing behavior, Shadow DOM, native UI, and markup scenarios.',
  },
  {
    label: 'Semantic HTML interview questions',
    targetId: 'iq-html-semantics-title',
    detail: 'Landmarks, headings, sections, articles, lists, language, and document structure.',
  },
  {
    label: 'HTML forms and validation interview questions',
    targetId: 'iq-html-forms-title',
    detail: 'Labels, placeholders, input types, validation attributes, errors, and grouped controls.',
  },
  {
    label: 'HTML accessibility and ARIA interview questions',
    targetId: 'iq-html-accessibility-title',
    detail: 'Accessible names, alt text, tables, dialogs, keyboard behavior, iframes, and ARIA.',
  },
  {
    label: 'HTML metadata, DOM, and browser parsing questions',
    targetId: 'iq-html-metadata-title',
    detail: 'Head metadata, title, meta tags, parsing, script loading, responsive images, and iframes.',
  },
  {
    label: 'Modern HTML5 and markup scenario questions',
    targetId: 'iq-html-modern-scenarios-title',
    detail: 'Dialog, details, popover, templates, Shadow DOM, invalid nesting, labels, and table markup.',
  },
];

const HTML_SHORT_ANSWERS: HtmlShortAnswerItem[] = [
  {
    q: 'What is HTML?',
    a: 'HTML is the markup language browsers parse to create the structure and meaning of a web document. It describes content with elements such as headings, links, images, forms, tables, and landmarks. HTML quality affects accessibility, SEO, browser defaults, and how safely CSS and JavaScript can build on the page.',
    route: ['/html', 'coding', 'html-basic-structure'],
    cta: 'Build a basic document',
    category: 'fundamentals',
    level: 'beginner',
  },
  {
    q: 'What is the DOM?',
    a: 'The DOM is the browser-created object tree that represents the parsed document. JavaScript reads and changes the DOM, and CSS selectors match elements in it for styling. The live DOM can differ from the original HTML source after parsing fixes or script updates.',
    route: ['/html', 'trivia', 'html-dom'],
    cta: 'Review the DOM',
    category: 'fundamentals',
    level: 'beginner',
  },
  {
    q: 'What is the difference between tags and elements?',
    a: 'A tag is the written markup token, such as an opening or closing marker. An element is the full parsed node, including the tag, attributes, content, and browser-defined meaning. Void elements such as img do not have closing tags, which is a common edge case.',
    route: ['/html', 'trivia', 'html-tags'],
    cta: 'Review HTML tags',
    category: 'fundamentals',
    level: 'beginner',
  },
  {
    q: 'What does a valid HTML document structure include?',
    a: 'A valid document starts with a doctype, an html element with a language, a head for metadata, and a body for visible content. The head should include charset, viewport, title, and other metadata needed by browsers and crawlers. Missing structure can still render, but it creates ambiguity for accessibility, mobile layout, and SEO behavior.',
    route: ['/html', 'coding', 'html-basic-structure'],
    cta: 'Practice document structure',
    category: 'fundamentals',
    level: 'beginner',
  },
  {
    q: 'What belongs in the head and body?',
    a: 'The head contains document metadata, resource hints, styles, scripts, titles, descriptions, and viewport settings. The body contains the content and controls users interact with. Putting visible content or structural landmarks in the head is invalid and can produce unexpected parsing behavior.',
    route: ['/html', 'trivia', 'html-head-tag'],
    cta: 'Review the head element',
    category: 'metadata-browser',
    level: 'beginner',
  },
  {
    q: 'What are semantic HTML elements?',
    a: 'Semantic elements describe the meaning or role of content, such as header, nav, main, article, section, footer, button, and form. They give browsers and assistive technology useful information before any custom scripting. Replacing semantic controls with generic div elements often creates extra keyboard and accessibility work.',
    route: ['/html', 'trivia', 'html-semantic-elements'],
    cta: 'Review semantic elements',
    category: 'semantics',
    level: 'beginner',
  },
  {
    q: 'What is the difference between div and span?',
    a: 'div is a generic block-level container, while span is a generic inline container. Neither carries semantic meaning by itself. They are useful for grouping only when a more meaningful element is not available.',
    route: ['/html', 'trivia', 'html-div-vs-span'],
    cta: 'Compare div and span',
    category: 'semantics',
    level: 'beginner',
  },
  {
    q: 'What is the difference between block and inline elements?',
    a: 'Block elements normally start on a new line and occupy available width, while inline elements flow inside text. The distinction affects layout, spacing, and how elements accept dimensions. CSS can change display behavior, but the semantic choice should still match the content meaning.',
    route: ['/html', 'trivia', 'html-block-inline-elements'],
    cta: 'Review block and inline',
    category: 'fundamentals',
    level: 'beginner',
  },
  {
    q: 'How should anchors work in HTML?',
    a: 'An anchor creates navigation when it has a useful href. It should describe the destination with link text that makes sense out of context. Use a button instead when the action changes state on the current page rather than navigating.',
    route: ['/html', 'trivia', 'html-a-tag'],
    cta: 'Review anchors',
    category: 'semantics',
    level: 'beginner',
  },
  {
    q: 'What does the href attribute do?',
    a: 'href defines the target URL or fragment for an anchor or linked resource. A missing or fake href can break expected link behavior, keyboard navigation, and browser features such as opening in a new tab. For external links, security and referrer behavior may also matter.',
    route: ['/html', 'trivia', 'html-href-attribute'],
    cta: 'Review href behavior',
    category: 'semantics',
    level: 'beginner',
  },
  {
    q: 'How should image alt text work?',
    a: 'Alt text should describe the purpose of an informative image. Decorative images usually need empty alt text so assistive technology can skip them. If an image is inside a link, the alt text may need to describe the link action rather than the visual pixels.',
    route: ['/html', 'trivia', 'html-img-alt-attribute'],
    cta: 'Review image alt text',
    category: 'forms-accessibility',
    level: 'beginner',
  },
  {
    q: 'How do HTML forms work?',
    a: 'A form groups controls and can submit name/value pairs to a server or be handled by JavaScript. Native controls provide keyboard behavior, labels, validation hooks, and browser defaults. The form still needs server-side validation because client-side constraints can be bypassed.',
    route: ['/html', 'coding', 'html-contact-form-labeled'],
    cta: 'Build labeled forms',
    category: 'forms-accessibility',
    level: 'beginner',
  },
  {
    q: 'Why are labels better than placeholders?',
    a: 'A label gives a form control a durable accessible name and a larger clickable target. Placeholder text disappears as users type and is not a reliable replacement for a label. Placeholders are best used as examples or hints, not as the only field name.',
    route: ['/html', 'trivia', 'html-input-placeholder'],
    cta: 'Review placeholders',
    category: 'forms-accessibility',
    level: 'beginner',
  },
  {
    q: 'How does native form validation work?',
    a: 'Native validation uses attributes such as required, type, min, max, pattern, and minlength. The browser can block common invalid submissions and expose useful constraint states. It improves user experience, but server validation remains the real trust boundary.',
    route: ['/html', 'coding', 'html-forms-validation-required'],
    cta: 'Practice validation',
    category: 'forms-accessibility',
    level: 'intermediate',
  },
  {
    q: 'How should lists and navigation be marked up?',
    a: 'Lists should represent grouped items where order or grouping matters, and navigation should use nav when it identifies a major navigation region. Link lists are often appropriate for menus because they expose both grouping and navigation semantics. Overusing lists for purely visual layout can make the markup noisy.',
    route: ['/html', 'coding', 'html-lists-and-navigation'],
    cta: 'Practice navigation markup',
    category: 'semantics',
    level: 'beginner',
  },
  {
    q: 'How do accessible tables work?',
    a: 'Data tables need table markup, header cells, and clear relationships between headers and data cells. Captions and scope attributes help users understand row and column meaning. Tables used only for layout create misleading relationships and should be avoided.',
    route: ['/html', 'coding', 'html-tables-accessibility'],
    cta: 'Build accessible tables',
    category: 'forms-accessibility',
    level: 'intermediate',
  },
  {
    q: 'What metadata should an HTML page include?',
    a: 'A production page usually needs charset, viewport, title, description, canonical when needed, and relevant social metadata. Metadata helps browsers render correctly and helps crawlers understand the page. Missing viewport metadata is a common mobile rendering failure.',
    route: ['/html', 'coding', 'html-head-seo-basics'],
    cta: 'Review head metadata',
    category: 'metadata-browser',
    level: 'beginner',
  },
  {
    q: 'What are data attributes used for?',
    a: 'data-* attributes store custom, non-sensitive metadata on elements. They are useful for testing hooks, progressive enhancement, and connecting markup to scripts without inventing invalid attributes. They should not become a replacement for semantic attributes or server-trusted data.',
    route: ['/html', 'trivia', 'html-data-attribute'],
    cta: 'Review data attributes',
    category: 'metadata-browser',
    level: 'intermediate',
  },
  {
    q: 'When should you use an iframe?',
    a: 'An iframe embeds another browsing context inside the page. It is useful for third-party content, isolated documents, maps, videos, and sandboxed experiences. It needs a meaningful title and careful sandbox, permissions, loading, and security choices.',
    route: ['/html', 'trivia', 'html-iframe-tag'],
    cta: 'Review iframes',
    category: 'metadata-browser',
    level: 'intermediate',
  },
  {
    q: 'How do srcset and sizes work for images?',
    a: 'srcset provides candidate image resources, and sizes tells the browser how much layout width the image will occupy. The browser uses that information with device characteristics to choose an efficient image. Wrong sizes values can make the browser download images that are too large or too blurry.',
    route: ['/html', 'trivia', 'html-img-srcset'],
    cta: 'Review responsive images',
    category: 'metadata-browser',
    level: 'intermediate',
  },
  {
    q: 'How does browser HTML parsing affect the DOM?',
    a: 'Browsers parse HTML into tokens and build the DOM while applying error-recovery rules. Invalid nesting can be corrected into a different DOM than the source appears to describe. Debugging markup issues often means inspecting the live DOM, not only the source file.',
    route: ['/html', 'trivia', 'html-parsing-rendering'],
    cta: 'Review parsing behavior',
    category: 'metadata-browser',
    level: 'advanced',
  },
  {
    q: 'When should ARIA roles be used?',
    a: 'ARIA roles should be used when native HTML cannot express the needed role, state, or relationship. Native elements are usually better because they include built-in keyboard and accessibility behavior. Misused ARIA can create a worse accessibility tree than plain semantic HTML.',
    route: ['/html', 'trivia', 'html-aria-roles'],
    cta: 'Review ARIA roles',
    category: 'forms-accessibility',
    level: 'intermediate',
  },
  {
    q: 'What is Shadow DOM?',
    a: 'Shadow DOM provides an encapsulated DOM tree for a component. It can isolate markup and styles from the main document while still exposing slots and public component behavior. Accessibility, focus, and styling hooks still need deliberate design.',
    route: ['/html', 'trivia', 'html-shadow-dom'],
    cta: 'Review Shadow DOM',
    category: 'modern-scenarios',
    level: 'advanced',
  },
  {
    q: 'How should native dialog behavior work?',
    a: 'The dialog element can provide native modal semantics and focus handling support. A usable dialog still needs a clear name, predictable opening focus, escape behavior, and focus restoration. A visually correct overlay is incomplete if keyboard users can reach background content.',
    route: ['/html', 'coding', 'html-dialog-confirm-a11y'],
    cta: 'Practice dialog accessibility',
    category: 'modern-scenarios',
    level: 'advanced',
  },
  {
    q: 'What is the difference between HTML, HTML5, and XHTML?',
    a: 'HTML is the markup language used for web documents, and HTML5 is the common name for modern HTML features and parsing behavior. XHTML is an XML-based syntax with stricter parsing rules. Modern web work usually follows the HTML Living Standard rather than treating HTML5 as a frozen version.',
    route: ['/html', 'trivia', 'html-vs-xhtml'],
    cta: 'Compare HTML and XHTML',
    category: 'modern-scenarios',
    level: 'intermediate',
  },
];

const HTML_AUDIENCE_TRACKS: HtmlAudienceTrack[] = [
  {
    title: 'HTML interview questions for beginners',
    detail: 'Start with document structure, common elements, links, images, forms, labels, lists, metadata, and the DOM. The goal is to understand what native markup gives the browser before adding CSS or JavaScript.',
  },
  {
    title: 'HTML interview questions for experienced frontend developers',
    detail: 'Move into accessibility trade-offs, browser parsing, table relationships, Shadow DOM, native dialogs, iframes, responsive image markup, and production metadata. Experienced answers should connect markup choices to real browser and user behavior.',
  },
];

const HTML_SEMANTICS_QUESTIONS: HtmlFocusedQuestionItem[] = [
  {
    q: 'How do landmarks improve document structure?',
    a: 'Landmarks such as header, nav, main, aside, and footer divide the page into recognizable regions. They help assistive technology users jump through the page efficiently. Most pages should have one main landmark and meaningful navigation regions.',
    route: ['/html', 'trivia', 'html-semantic-elements'],
    cta: 'Review landmarks',
    level: 'beginner',
  },
  {
    q: 'How should heading structure work?',
    a: 'Headings create a content hierarchy for scanning, navigation, and accessibility. Heading levels should represent structure, not visual size. Skipping levels for styling can make the page harder to understand through assistive technology.',
    route: ['/html', 'coding', 'html-semantic-layout'],
    cta: 'Build semantic layout',
    level: 'beginner',
  },
  {
    q: 'When should you use section and article?',
    a: 'section groups a themed part of a document, usually with a heading. article represents independent content that could stand on its own, such as a post, card, or comment. A generic wrapper should stay a div when there is no meaningful document section.',
    route: ['/html', 'trivia', 'html-semantic-elements'],
    cta: 'Review semantic sections',
    level: 'intermediate',
  },
  {
    q: 'Why are generic div and span elements not enough?',
    a: 'div and span provide grouping without semantic meaning. They are useful for layout hooks, but they do not communicate navigation, button behavior, headings, form relationships, or document regions. Native semantic elements reduce custom accessibility work.',
    route: ['/html', 'trivia', 'html-div-vs-span'],
    cta: 'Compare generic elements',
    level: 'beginner',
  },
  {
    q: 'Why does the html lang attribute matter?',
    a: 'The lang attribute tells browsers and assistive technology the language of the document. It affects pronunciation, translation, spell checking, and some typographic behavior. Pages with mixed languages should mark language changes on the relevant elements.',
    route: ['/html', 'coding', 'html-basic-structure'],
    cta: 'Practice document basics',
    level: 'beginner',
  },
  {
    q: 'How should list markup be used?',
    a: 'Use ul for unordered groups, ol for ordered steps or rankings, and dl for name/value descriptions. Lists communicate grouping that screen readers and browsers can expose. Do not use lists only to force visual indentation when the content is not a list.',
    route: ['/html', 'trivia', 'html-ol-ul-dl-difference'],
    cta: 'Review list types',
    level: 'beginner',
  },
  {
    q: 'How do data attributes fit into semantic markup?',
    a: 'data-* attributes are useful for custom metadata that scripts or tests need to read. They should not replace existing semantic attributes such as href, alt, for, name, or aria-* when those have real meaning. Data attributes are markup hooks, not validation or security boundaries.',
    route: ['/html', 'trivia', 'html-data-attribute'],
    cta: 'Review data attributes',
    level: 'intermediate',
  },
  {
    q: 'What makes an HTML document easy to scan?',
    a: 'A scannable document has a clear title, meaningful headings, landmarks, descriptive links, and grouped content. The DOM order should match the reading and keyboard order where possible. Visual layout can change, but the markup should still make sense without CSS.',
    route: ['/html', 'coding', 'html-semantic-layout'],
    cta: 'Practice semantic layout',
    level: 'intermediate',
  },
];

const HTML_FORMS_QUESTIONS: HtmlFocusedQuestionItem[] = [
  {
    q: 'How should a label connect to a form control?',
    a: 'A label can connect to a control with for and id, or by wrapping the control. This gives the control an accessible name and increases the clickable target. The association should remain stable even when the layout changes.',
    route: ['/html', 'coding', 'html-contact-form-labeled'],
    cta: 'Build labeled forms',
    level: 'beginner',
  },
  {
    q: 'Why is placeholder text not a label?',
    a: 'Placeholder text disappears during input and may not be announced as a stable field name. A real label remains available before, during, and after typing. Placeholder text is better used for examples, formatting hints, or optional guidance.',
    route: ['/html', 'trivia', 'html-input-placeholder'],
    cta: 'Review placeholders',
    level: 'beginner',
  },
  {
    q: 'How do input types improve forms?',
    a: 'Input types such as email, url, number, date, and tel give browsers validation hints and mobile keyboard choices. They improve usability when they match the real data being collected. The wrong type can block valid input or create a poor mobile experience.',
    route: ['/html', 'coding', 'html-forms-validation-required'],
    cta: 'Practice input validation',
    level: 'beginner',
  },
  {
    q: 'How do validation attributes work?',
    a: 'Attributes such as required, minlength, maxlength, min, max, pattern, and type define browser-side constraints. They expose validity state and can block invalid submissions. Server validation is still required because browser constraints are user-experience helpers, not trusted enforcement.',
    route: ['/html', 'coding', 'html-forms-validation-required'],
    cta: 'Build validation states',
    level: 'intermediate',
  },
  {
    q: 'How should form errors be exposed?',
    a: 'Form errors should be visible, specific, and connected to the affected control. Use nearby text and aria-describedby when the relationship is not already clear. Color alone is not enough because users may miss the state or use assistive technology.',
    route: ['/html', 'coding', 'html-forms-validation-required'],
    cta: 'Practice form errors',
    level: 'intermediate',
  },
  {
    q: 'How should radio buttons and checkboxes be grouped?',
    a: 'Related radio buttons and checkboxes should be grouped with fieldset and legend when they share a prompt. The legend gives the group a clear accessible name. Without grouping, users may hear each option without the question it answers.',
    route: ['/html', 'coding', 'html-contact-form-labeled'],
    cta: 'Practice grouped controls',
    level: 'intermediate',
  },
  {
    q: 'What is the default method for an HTML form?',
    a: 'The default method is GET when no method is specified. GET appends form data to the URL, which is useful for search-like actions but wrong for sensitive or state-changing submissions. POST is usually the better fit when the form changes server state.',
    route: ['/html', 'trivia', 'html-form-default-method'],
    cta: 'Review form methods',
    level: 'beginner',
  },
  {
    q: 'Why should form actions use real buttons?',
    a: 'A real button has native role, focus, activation, disabled, and form submission behavior. A div with click handling does not provide those behaviors by default. Rebuilding button behavior manually is easy to get wrong for keyboard and assistive technology users.',
    route: ['/html', 'coding', 'html-contact-form-labeled'],
    cta: 'Practice form controls',
    level: 'beginner',
  },
];

const HTML_ACCESSIBILITY_QUESTIONS: HtmlFocusedQuestionItem[] = [
  {
    q: 'When should you add ARIA?',
    a: 'Add ARIA when native HTML cannot express the role, state, or relationship you need. Native elements should come first because they already include expected keyboard and accessibility behavior. Incorrect ARIA can make an accessible tree less accurate than plain HTML.',
    route: ['/html', 'trivia', 'html-aria-roles'],
    cta: 'Review ARIA roles',
    level: 'intermediate',
  },
  {
    q: 'What is an accessible name?',
    a: 'An accessible name is the name assistive technology exposes for a control or landmark. It can come from text content, labels, alt text, aria-label, aria-labelledby, or other naming rules. Missing or misleading names make controls hard to operate even when they are visible.',
    route: ['/html', 'coding', 'html-contact-form-labeled'],
    cta: 'Practice accessible names',
    level: 'intermediate',
  },
  {
    q: 'How should alt text work for linked images?',
    a: 'When an image is inside a link, the alt text often becomes the link name. It should describe the destination or action, not just the image appearance. Alt text like "arrow" or "icon" usually fails because it does not explain what happens.',
    route: ['/html', 'coding', 'html-links-and-images'],
    cta: 'Practice links and images',
    level: 'beginner',
  },
  {
    q: 'How do you make data tables accessible?',
    a: 'Use real table markup, header cells, a useful caption when context is needed, and scope or header associations for complex tables. The structure should let users understand row and column relationships. Layout tables should be avoided because they communicate false data relationships.',
    route: ['/html', 'coding', 'html-tables-accessibility'],
    cta: 'Build accessible tables',
    level: 'intermediate',
  },
  {
    q: 'What makes an HTML dialog accessible?',
    a: 'An accessible dialog has a clear name, appropriate modal behavior, predictable initial focus, escape behavior, and focus restoration. Background content should not stay reachable when the dialog is modal. The native dialog element helps, but the interaction still needs careful markup.',
    route: ['/html', 'coding', 'html-dialog-confirm-a11y'],
    cta: 'Practice dialog accessibility',
    level: 'advanced',
  },
  {
    q: 'How should keyboard navigation be checked?',
    a: 'Tab through the page and confirm that focus order follows the DOM and user task. Every interactive element should be reachable, visible, and operable by keyboard. Positive tabindex values usually create fragile focus order and should be avoided.',
    route: ['/html', 'trivia', 'web-accessibility-make-page-accessible'],
    cta: 'Review accessibility checks',
    level: 'intermediate',
  },
  {
    q: 'How should iframes be exposed accessibly?',
    a: 'An iframe needs a title that explains the embedded content. The title helps users decide whether to enter or skip the embedded context. Security attributes such as sandbox and permissions should also match what the embedded content actually needs.',
    route: ['/html', 'trivia', 'html-iframe-tag'],
    cta: 'Review iframes',
    level: 'intermediate',
  },
  {
    q: 'How do you test HTML accessibility quickly?',
    a: 'Start with keyboard navigation, labels, headings, landmarks, alt text, table headers, and form errors. Then inspect the accessibility tree and run automated checks such as Lighthouse or axe. Automated tools are useful, but they cannot prove that the user flow makes sense.',
    route: ['/html', 'trivia', 'web-accessibility-make-page-accessible'],
    cta: 'Practice accessibility review',
    level: 'advanced',
  },
];

const HTML_METADATA_QUESTIONS: HtmlFocusedQuestionItem[] = [
  {
    q: 'What belongs in the head for SEO and browser behavior?',
    a: 'The head should include charset, viewport, title, description, canonical when needed, and resource metadata. These values guide rendering, crawling, previews, and navigation labels. Missing or duplicated head metadata can create confusing snippets and mobile behavior.',
    route: ['/html', 'coding', 'html-head-seo-basics'],
    cta: 'Review head SEO basics',
    level: 'beginner',
  },
  {
    q: 'How should the title tag be used?',
    a: 'The title tag names the document for browser tabs, history, bookmarks, and search results. It should be specific to the page and not just repeat the site name. Multiple or vague titles make navigation and search snippets weaker.',
    route: ['/html', 'trivia', 'html-title-tag'],
    cta: 'Review title tags',
    level: 'beginner',
  },
  {
    q: 'What do meta tags do?',
    a: 'Meta tags provide metadata such as charset, viewport, description, robots hints, and social preview information. They do not replace visible content, but they influence browser and crawler behavior. Some meta tags are critical for mobile rendering and snippet quality.',
    route: ['/html', 'trivia', 'html-meta-tag'],
    cta: 'Review meta tags',
    level: 'beginner',
  },
  {
    q: 'Why does the viewport meta tag matter?',
    a: 'The viewport meta tag tells mobile browsers how to map CSS pixels to the device viewport. Without it, a page may render using a desktop-style layout width on phones. That makes otherwise valid markup feel broken on small screens.',
    route: ['/html', 'coding', 'html-head-seo-basics'],
    cta: 'Practice viewport metadata',
    level: 'beginner',
  },
  {
    q: 'How does HTML parsing affect invalid markup?',
    a: 'Browsers recover from invalid markup using parsing rules, and the resulting DOM may not match the source you expected. Invalid nesting around paragraphs, tables, forms, and interactive elements can produce surprising structure. Inspect the live DOM when markup behavior looks wrong.',
    route: ['/html', 'trivia', 'html-parsing-rendering'],
    cta: 'Review parsing behavior',
    level: 'advanced',
  },
  {
    q: 'How do script loading attributes affect parsing?',
    a: 'Classic scripts can block parsing unless they are deferred or loaded asynchronously. defer keeps execution ordered after parsing, while async runs when the script is ready. The wrong loading choice can delay content or create race conditions with DOM availability.',
    route: ['/html', 'trivia', 'html-parsing-rendering'],
    cta: 'Review parser behavior',
    level: 'advanced',
  },
  {
    q: 'How should responsive image markup be chosen?',
    a: 'Use srcset and sizes when the same image needs different resolutions, and picture when the art direction or format changes. Include width and height or an aspect ratio so space can be reserved before the image loads. Bad sizes values can cause unnecessary large downloads.',
    route: ['/html', 'trivia', 'html-img-srcset'],
    cta: 'Review srcset',
    level: 'intermediate',
  },
  {
    q: 'How should iframes be loaded and constrained?',
    a: 'Iframes should use only the permissions they need and should be titled clearly. loading="lazy" can defer offscreen iframe work, and sandbox can limit capabilities when appropriate. Embedded content affects performance, security, and accessibility, so it should not be treated as a neutral tag.',
    route: ['/html', 'trivia', 'html-iframe-tag'],
    cta: 'Review iframe behavior',
    level: 'advanced',
  },
];

const HTML_MODERN_SCENARIO_QUESTIONS: HtmlScenarioQuestionItem[] = [
  {
    q: 'How does native dialog compare with a custom modal?',
    a: 'Native dialog can provide built-in modal behavior and browser semantics. A custom modal must recreate focus trapping, naming, escape behavior, background isolation, and focus restoration. Native support reduces work, but the surrounding interaction still needs testing.',
    route: ['/html', 'coding', 'html-dialog-confirm-a11y'],
    cta: 'Practice dialog behavior',
    level: 'advanced',
  },
  {
    q: 'What are details, summary, and popover useful for?',
    a: 'details and summary provide native disclosure behavior without custom JavaScript. The popover attribute can expose lightweight overlay behavior for supported cases. Native primitives are useful when they match the interaction, but they still need labels, focus behavior, and fallback awareness.',
    level: 'intermediate',
  },
  {
    q: 'How do template and slot support component markup?',
    a: 'template holds inert markup that can be cloned later, and slot defines insertion points for web component content. They support reusable markup without immediately rendering everything into the main DOM. The trade-off is that composition and accessibility still need explicit contracts.',
    route: ['/html', 'trivia', 'html-shadow-dom'],
    cta: 'Review web components',
    level: 'advanced',
  },
  {
    q: 'Why can invalid nesting change the page structure?',
    a: 'The HTML parser can automatically close or move elements to produce a valid DOM. Source that looks nested one way may become a different live tree. This is especially important around paragraphs, forms, tables, lists, and interactive elements.',
    route: ['/html', 'trivia', 'html-parsing-rendering'],
    cta: 'Review parsing rules',
    level: 'advanced',
  },
  {
    q: 'Why is this input hard to use: <input placeholder="Email">?',
    a: 'The input has no durable accessible label. Placeholder text disappears during input and is not a stable field name. Add a label connected with for and id, then keep the placeholder only as optional hint text.',
    route: ['/html', 'coding', 'html-contact-form-labeled'],
    cta: 'Fix labeled inputs',
    level: 'beginner',
  },
  {
    q: 'Why is this image link weak: <a href="/pricing"><img alt="arrow"></a>?',
    a: 'The href makes the anchor a real hyperlink; an anchor without href is not a hyperlink. Its accessible name is still "arrow", which describes the icon rather than the destination. Use alt text such as "View pricing" so the link name explains what navigation will do.',
    route: ['/html', 'coding', 'html-links-and-images'],
    cta: 'Practice image links',
    level: 'beginner',
  },
  {
    q: 'Why is a table without headers hard to understand?',
    a: 'Data cells need header relationships so users can understand what each value means. Without th, caption, scope, or header associations, assistive technology cannot reliably expose row and column context. The visual grid alone is not enough for non-visual navigation.',
    route: ['/html', 'coding', 'html-tables-accessibility'],
    cta: 'Fix table markup',
    level: 'intermediate',
  },
  {
    q: 'Why is a clickable div a fragile button?',
    a: 'A clickable div lacks native button role, keyboard activation, disabled behavior, and form interaction. Adding JavaScript handlers does not automatically recreate all expected behavior. Use a real button for actions and style it as needed.',
    route: ['/html', 'coding', 'html-dialog-confirm-a11y'],
    cta: 'Practice native controls',
    level: 'beginner',
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
      return 'Frontend interview questions and answers, beginner to advanced, with Essential 60, JavaScript, HTML, CSS, React, Angular, Vue, UI coding, debugging, testing, accessibility, performance, and system design paths.';
    }

    if (this.isHtmlCssHub()) {
      return 'HTML and CSS interview questions and answers for UI rounds, with short answers, code scenarios, semantic markup, accessibility, layout, cascade, responsive behavior, and browser debugging.';
    }

    if (this.isVueHub()) {
      return 'Vue.js interview questions and Vue JS answers for Vue 3 rounds, with short answers, reactivity scenarios, Composition API, Router, Pinia/Vuex, testing, security, performance, and coding prompts.';
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

  masterEditorialSignal(): MasterEditorialSignal {
    return MASTER_EDITORIAL_SIGNAL;
  }

  masterAnchorItems(): MasterAnchorItem[] {
    return MASTER_ANCHOR_ITEMS;
  }

  masterKeywordClusters(): MasterKeywordClusterItem[] {
    return MASTER_KEYWORD_CLUSTERS;
  }

  masterShortAnswers(): MasterShortAnswerItem[] {
    return MASTER_SHORT_ANSWERS;
  }

  masterEssentialPreviewItems(): MasterEssentialPreviewItem[] {
    return MASTER_ESSENTIAL_PREVIEW_ITEMS;
  }

  masterFormatPathItems(): MasterFormatPathItem[] {
    return MASTER_FORMAT_PATH_ITEMS;
  }

  masterShortAnswerCategoryLabel(category: MasterShortAnswerCategory): string {
    switch (category) {
      case 'rounds':
        return 'Rounds';
      case 'javascript':
        return 'JavaScript';
      case 'ui-coding':
        return 'UI coding';
      case 'html-css':
        return 'HTML + CSS';
      case 'browser-security':
        return 'Browser + security';
      case 'debugging-performance':
        return 'Debugging + performance';
      case 'system-design':
        return 'System design';
      default:
        return 'Prep';
    }
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

  scrollToMasterSection(targetId: string): void {
    this.scrollToSection(targetId);
  }

  scrollToAngularSection(targetId: string): void {
    this.scrollToSection(targetId);
  }

  scrollToReactSection(targetId: string): void {
    this.scrollToSection(targetId);
  }

  scrollToVueSection(targetId: string): void {
    this.scrollToSection(targetId);
  }

  scrollToHtmlCssSection(targetId: string): void {
    this.scrollToSection(targetId);
  }

  scrollToCssSection(targetId: string): void {
    this.scrollToSection(targetId);
  }

  scrollToHtmlSection(targetId: string): void {
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

  vueEditorialSignal(): VueEditorialSignal {
    return VUE_EDITORIAL_SIGNAL;
  }

  vueAnchorItems(): VueAnchorItem[] {
    return VUE_ANCHOR_ITEMS;
  }

  vueKeywordClusters(): VueKeywordClusterItem[] {
    return VUE_KEYWORD_CLUSTERS;
  }

  vueShortAnswers(): VueShortAnswerItem[] {
    return VUE_SHORT_ANSWERS;
  }

  vueAudienceTracks(): VueAudienceTrack[] {
    return VUE_AUDIENCE_TRACKS;
  }

  vueReactivityRenderingQuestions(): VueFocusedQuestionItem[] {
    return VUE_REACTIVITY_RENDERING_QUESTIONS;
  }

  vueComponentContractQuestions(): VueFocusedQuestionItem[] {
    return VUE_COMPONENT_CONTRACT_QUESTIONS;
  }

  vueScenarioQuestions(): VueScenarioQuestionItem[] {
    return VUE_SCENARIO_QUESTIONS;
  }

  vueModernQuestions(): VueModernQuestionItem[] {
    return VUE_MODERN_QUESTIONS;
  }

  vueTestingSecurityPerformanceQuestions(): VueFocusedQuestionItem[] {
    return VUE_TESTING_SECURITY_PERFORMANCE_QUESTIONS;
  }

  vueShortAnswerCategoryLabel(category: VueShortAnswerCategory): string {
    switch (category) {
      case 'fundamentals':
        return 'Fundamentals';
      case 'reactivity-rendering':
        return 'Reactivity + rendering';
      case 'components':
        return 'Components';
      case 'routing-state':
        return 'Router + state';
      default:
        return 'Modern Vue';
    }
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

  htmlEditorialSignal(): HtmlEditorialSignal {
    return HTML_EDITORIAL_SIGNAL;
  }

  htmlAnchorItems(): HtmlAnchorItem[] {
    return HTML_ANCHOR_ITEMS;
  }

  htmlKeywordClusters(): HtmlKeywordClusterItem[] {
    return HTML_KEYWORD_CLUSTERS;
  }

  htmlShortAnswers(): HtmlShortAnswerItem[] {
    return HTML_SHORT_ANSWERS;
  }

  htmlAudienceTracks(): HtmlAudienceTrack[] {
    return HTML_AUDIENCE_TRACKS;
  }

  htmlSemanticsQuestions(): HtmlFocusedQuestionItem[] {
    return HTML_SEMANTICS_QUESTIONS;
  }

  htmlFormsQuestions(): HtmlFocusedQuestionItem[] {
    return HTML_FORMS_QUESTIONS;
  }

  htmlAccessibilityQuestions(): HtmlFocusedQuestionItem[] {
    return HTML_ACCESSIBILITY_QUESTIONS;
  }

  htmlMetadataQuestions(): HtmlFocusedQuestionItem[] {
    return HTML_METADATA_QUESTIONS;
  }

  htmlModernScenarioQuestions(): HtmlScenarioQuestionItem[] {
    return HTML_MODERN_SCENARIO_QUESTIONS;
  }

  htmlShortAnswerCategoryLabel(category: HtmlShortAnswerCategory): string {
    switch (category) {
      case 'fundamentals':
        return 'Fundamentals';
      case 'semantics':
        return 'Semantics';
      case 'forms-accessibility':
        return 'Forms + accessibility';
      case 'metadata-browser':
        return 'Metadata + browser';
      default:
        return 'Modern + scenarios';
    }
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

  cssEditorialSignal(): CssEditorialSignal {
    return CSS_EDITORIAL_SIGNAL;
  }

  cssAnchorItems(): CssAnchorItem[] {
    return CSS_ANCHOR_ITEMS;
  }

  cssKeywordClusters(): CssKeywordClusterItem[] {
    return CSS_KEYWORD_CLUSTERS;
  }

  cssShortAnswers(): CssShortAnswerItem[] {
    return CSS_SHORT_ANSWERS;
  }

  cssAudienceTracks(): CssAudienceTrack[] {
    return CSS_AUDIENCE_TRACKS;
  }

  cssCascadeQuestions(): CssFocusedQuestionItem[] {
    return CSS_CASCADE_QUESTIONS;
  }

  cssBoxModelQuestions(): CssFocusedQuestionItem[] {
    return CSS_BOX_MODEL_QUESTIONS;
  }

  cssLayoutQuestions(): CssFocusedQuestionItem[] {
    return CSS_LAYOUT_QUESTIONS;
  }

  cssResponsiveQuestions(): CssFocusedQuestionItem[] {
    return CSS_RESPONSIVE_QUESTIONS;
  }

  cssDebuggingPerformanceQuestions(): CssScenarioQuestionItem[] {
    return CSS_DEBUGGING_PERFORMANCE_QUESTIONS;
  }

  cssShortAnswerCategoryLabel(category: CssShortAnswerCategory): string {
    switch (category) {
      case 'fundamentals':
        return 'Fundamentals';
      case 'cascade-selectors':
        return 'Cascade + selectors';
      case 'layout':
        return 'Layout';
      case 'responsive':
        return 'Responsive';
      default:
        return 'Debugging + performance';
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
          title: 'Machine Coding / UI Coding',
          description: 'Practice timed widgets, async UI, framework implementation, and interaction states from one clean hub.',
          route: ['/machine-coding'],
          meta: 'Format-first practice',
          tone: 'structured',
        },
        {
          step: 4,
          title: 'Frontend Coding Challenges',
          description: 'Broaden into focused JavaScript functions, UI exercises, HTML/CSS implementation, and debugging tasks.',
          route: ['/coding'],
          meta: 'Focused coding practice',
          tone: 'structured',
        },
        {
          step: 5,
          title: 'Framework interview hubs',
          description: 'Branch into React, Angular, Vue, HTML, or CSS once the shared baseline shows which stack needs depth.',
          route: ['/react/interview-questions'],
          meta: 'React, Angular, Vue, HTML/CSS',
          tone: 'structured',
        },
        {
          step: 6,
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
        route: ['/system-design'],
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

  isCssHub(): boolean {
    return !this.isMasterHub()
      && this.config.techs.length === 1
      && this.config.techs[0] === 'css';
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
      return { route: ['/coding'], queryParams };
    }

    const queryParams: Record<string, string | number | boolean> = {};
    const primaryTech = this.primaryTechForLibrary();
    if (primaryTech) queryParams['tech'] = primaryTech;
    if (kind) queryParams['kind'] = kind;
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
      collectionPage['dateModified'] = MASTER_EDITORIAL_SIGNAL.dateModified;
      collectionPage['reviewedBy'] = {
        '@type': 'Organization',
        name: MASTER_EDITORIAL_SIGNAL.reviewer,
      };
      collectionPage['hasPart'] = this.masterTechHubLinks().map((hub) => ({
        '@type': 'WebPage',
        name: hub.label,
        url: this.seo.buildCanonicalUrl(hub.path),
      }));
      collectionPage['about'] = [
        ...(collectionPage['about'] || []),
        { '@type': 'Thing', name: 'frontend interview questions and answers' },
        { '@type': 'Thing', name: 'front end developer interview questions' },
        { '@type': 'Thing', name: 'frontend interview questions for beginners' },
        { '@type': 'Thing', name: 'front end developer interview questions for freshers' },
        { '@type': 'Thing', name: 'frontend interview questions for experienced developers' },
        { '@type': 'Thing', name: 'senior frontend interview questions' },
        { '@type': 'Thing', name: 'frontend coding interview questions' },
        { '@type': 'Thing', name: 'frontend machine coding questions' },
        { '@type': 'Thing', name: 'UI coding interview questions' },
        { '@type': 'Thing', name: 'frontend UI interview questions' },
        { '@type': 'Thing', name: 'JavaScript frontend interview questions' },
        { '@type': 'Thing', name: 'frontend JavaScript interview questions' },
        { '@type': 'Thing', name: 'browser API interview questions frontend' },
        { '@type': 'Thing', name: 'DOM interview questions frontend' },
        { '@type': 'Thing', name: 'HTML CSS interview questions' },
        { '@type': 'Thing', name: 'HTML CSS frontend interview questions' },
        { '@type': 'Thing', name: 'semantic HTML interview questions frontend' },
        { '@type': 'Thing', name: 'React Angular Vue interview questions' },
        { '@type': 'Thing', name: 'frontend accessibility interview questions' },
        { '@type': 'Thing', name: 'frontend performance interview questions' },
        { '@type': 'Thing', name: 'frontend rendering interview questions' },
        { '@type': 'Thing', name: 'frontend testing interview questions' },
        { '@type': 'Thing', name: 'frontend debugging interview questions' },
        { '@type': 'Thing', name: 'frontend system design interview questions' },
        { '@type': 'Thing', name: 'frontend system design questions' },
        { '@type': 'Thing', name: 'frontend architecture interview questions' },
      ];
      collectionPage['mentions'] = [
        { '@type': 'Thing', name: 'Coding prompts' },
        { '@type': 'Thing', name: 'Concept questions' },
        { '@type': 'Thing', name: 'Interview follow-ups' },
        { '@type': 'Thing', name: 'Common interview mistakes' },
        { '@type': 'Thing', name: 'FrontendAtlas Essential 60' },
        { '@type': 'Thing', name: 'UI coding interview questions' },
        { '@type': 'Thing', name: 'Frontend UI coding and machine coding questions' },
        { '@type': 'Thing', name: 'CSS layout interview questions frontend' },
        { '@type': 'Thing', name: 'Frontend system design practice' },
        { '@type': 'Thing', name: 'Frontend debugging scenarios' },
        { '@type': 'Thing', name: 'Browser API interview questions' },
        { '@type': 'Thing', name: 'Frontend UI testing' },
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

    if (this.isVueHub()) {
      collectionPage['dateModified'] = VUE_EDITORIAL_SIGNAL.dateModified;
      collectionPage['reviewedBy'] = {
        '@type': 'Organization',
        name: VUE_EDITORIAL_SIGNAL.reviewer,
      };
      collectionPage['about'] = [
        ...(collectionPage['about'] || []),
        { '@type': 'Thing', name: 'Vue.js interview questions' },
        { '@type': 'Thing', name: 'Vue.js interview questions and answers' },
        { '@type': 'Thing', name: 'Vue JS interview questions for beginners' },
        { '@type': 'Thing', name: 'Vue interview questions for experienced developers' },
        { '@type': 'Thing', name: 'Vue 3 interview questions' },
        { '@type': 'Thing', name: 'Vue Composition API interview questions' },
        { '@type': 'Thing', name: 'Vue reactivity interview questions' },
        { '@type': 'Thing', name: 'Vue ref vs reactive interview questions' },
        { '@type': 'Thing', name: 'Vue computed vs watch interview questions' },
        { '@type': 'Thing', name: 'Vue Router interview questions' },
        { '@type': 'Thing', name: 'Pinia interview questions' },
        { '@type': 'Thing', name: 'Vuex interview questions' },
        { '@type': 'Thing', name: 'Vue testing interview questions' },
        { '@type': 'Thing', name: 'Vue security interview questions' },
        { '@type': 'Thing', name: 'Vue performance interview questions' },
        { '@type': 'Thing', name: 'Vue scenario interview questions' },
        { '@type': 'Thing', name: 'Vue coding interview questions' },
      ];
      collectionPage['mentions'] = [
        ...(collectionPage['mentions'] || []),
        { '@type': 'Thing', name: 'Vue JS interview questions' },
        { '@type': 'Thing', name: 'Beginner to advanced Vue.js interview questions' },
        { '@type': 'Thing', name: 'Vue reactivity and rendering questions' },
        { '@type': 'Thing', name: 'Vue component contract questions' },
        { '@type': 'Thing', name: 'Vue scenario and code questions' },
        { '@type': 'Thing', name: 'Modern Vue 3 interview questions' },
        { '@type': 'Thing', name: 'Vue Router and navigation guards' },
        { '@type': 'Thing', name: 'Vue Pinia and Vuex state management' },
        { '@type': 'Thing', name: 'Vue Test Utils and Vitest testing' },
        { '@type': 'Thing', name: 'Vue XSS and v-html security' },
        { '@type': 'Thing', name: 'Vue SSR, Nuxt, and hydration' },
        { '@type': 'Thing', name: 'Vue coding interview prompts' },
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

    if (this.isCssHub()) {
      collectionPage['dateModified'] = CSS_EDITORIAL_SIGNAL.dateModified;
      collectionPage['reviewedBy'] = {
        '@type': 'Organization',
        name: CSS_EDITORIAL_SIGNAL.reviewer,
      };
      collectionPage['about'] = [
        ...(collectionPage['about'] || []),
        { '@type': 'Thing', name: 'CSS interview questions and answers' },
        { '@type': 'Thing', name: 'CSS interview questions for beginners' },
        { '@type': 'Thing', name: 'CSS interview questions for experienced developers' },
        { '@type': 'Thing', name: 'CSS selectors interview questions' },
        { '@type': 'Thing', name: 'CSS specificity interview questions' },
        { '@type': 'Thing', name: 'CSS cascade interview questions' },
        { '@type': 'Thing', name: 'CSS box model interview questions' },
        { '@type': 'Thing', name: 'CSS Flexbox interview questions' },
        { '@type': 'Thing', name: 'CSS Grid interview questions' },
        { '@type': 'Thing', name: 'CSS Flexbox vs Grid interview questions' },
        { '@type': 'Thing', name: 'CSS positioning interview questions' },
        { '@type': 'Thing', name: 'CSS z-index interview questions' },
        { '@type': 'Thing', name: 'CSS media queries interview questions' },
        { '@type': 'Thing', name: 'responsive CSS interview questions' },
        { '@type': 'Thing', name: 'CSS layout interview questions' },
        { '@type': 'Thing', name: 'CSS debugging interview questions' },
        { '@type': 'Thing', name: 'CSS performance interview questions' },
      ];
      collectionPage['mentions'] = [
        ...(collectionPage['mentions'] || []),
        { '@type': 'Thing', name: 'CSS cascade and specificity' },
        { '@type': 'Thing', name: 'CSS selectors and inheritance' },
        { '@type': 'Thing', name: 'CSS box sizing and overflow' },
        { '@type': 'Thing', name: 'CSS Flexbox and Grid layout' },
        { '@type': 'Thing', name: 'CSS stacking contexts and z-index' },
        { '@type': 'Thing', name: 'CSS custom properties and design tokens' },
        { '@type': 'Thing', name: 'CSS responsive layout debugging' },
        { '@type': 'Thing', name: 'CSS performance and hardware acceleration' },
        { '@type': 'Thing', name: 'CSS hardware acceleration and compositing' },
        { '@type': 'Thing', name: 'CSS animation performance interview questions' },
        { '@type': 'Thing', name: 'transform vs top/left performance' },
        { '@type': 'Thing', name: 'will-change CSS interview question' },
        { '@type': 'Thing', name: 'layout, paint, and composite' },
      ];
    }

    if (this.isHtmlHub()) {
      collectionPage['dateModified'] = HTML_EDITORIAL_SIGNAL.dateModified;
      collectionPage['reviewedBy'] = {
        '@type': 'Organization',
        name: HTML_EDITORIAL_SIGNAL.reviewer,
      };
      collectionPage['about'] = [
        ...(collectionPage['about'] || []),
        { '@type': 'Thing', name: 'HTML interview questions and answers' },
        { '@type': 'Thing', name: 'HTML interview questions for beginners' },
        { '@type': 'Thing', name: 'HTML interview questions for freshers' },
        { '@type': 'Thing', name: 'HTML interview questions for experienced developers' },
        { '@type': 'Thing', name: 'semantic HTML interview questions' },
        { '@type': 'Thing', name: 'HTML semantic elements interview questions' },
        { '@type': 'Thing', name: 'HTML forms interview questions' },
        { '@type': 'Thing', name: 'HTML form validation interview questions' },
        { '@type': 'Thing', name: 'HTML accessibility interview questions' },
        { '@type': 'Thing', name: 'ARIA interview questions' },
        { '@type': 'Thing', name: 'HTML metadata interview questions' },
        { '@type': 'Thing', name: 'HTML5 interview questions' },
        { '@type': 'Thing', name: 'DOM interview questions' },
        { '@type': 'Thing', name: 'HTML table accessibility questions' },
        { '@type': 'Thing', name: 'HTML image alt and srcset questions' },
        { '@type': 'Thing', name: 'HTML iframe interview questions' },
        { '@type': 'Thing', name: 'Shadow DOM interview questions' },
        { '@type': 'Thing', name: 'HTML markup scenario questions' },
      ];
      collectionPage['mentions'] = [
        ...(collectionPage['mentions'] || []),
        { '@type': 'Thing', name: 'HTML DOM and document structure' },
        { '@type': 'Thing', name: 'Semantic HTML landmarks and headings' },
        { '@type': 'Thing', name: 'HTML form labels and validation' },
        { '@type': 'Thing', name: 'HTML ARIA roles and accessible names' },
        { '@type': 'Thing', name: 'HTML metadata, title, and meta tags' },
        { '@type': 'Thing', name: 'HTML browser parsing and rendering' },
        { '@type': 'Thing', name: 'HTML native dialog behavior' },
        { '@type': 'Thing', name: 'HTML Shadow DOM and web components' },
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
    if (this.isMasterHub()) {
      jsonLd.push(this.masterShortAnswersFaqPage(canonicalUrl));
    }
    if (this.isJavaScriptHub()) {
      jsonLd.push(this.javascriptShortAnswersFaqPage(canonicalUrl));
    }
    if (this.isReactHub()) {
      jsonLd.push(this.reactShortAnswersFaqPage(canonicalUrl));
    }
    if (this.isVueHub()) {
      jsonLd.push(this.vueShortAnswersFaqPage(canonicalUrl));
    }
    if (this.isAngularHub()) {
      jsonLd.push(this.angularShortAnswersFaqPage(canonicalUrl));
    }
    if (this.isHtmlCssHub()) {
      jsonLd.push(this.htmlCssShortAnswersFaqPage(canonicalUrl));
    }
    if (this.isCssHub()) {
      jsonLd.push(this.cssShortAnswersFaqPage(canonicalUrl));
    }
    if (this.isHtmlHub()) {
      jsonLd.push(this.htmlShortAnswersFaqPage(canonicalUrl));
    }

    this.seo.updateTags({
      ...routeSeo,
      canonical: currentPath,
      jsonLd,
    });
  }

  private masterShortAnswersFaqPage(canonicalUrl: string): Record<string, any> {
    return {
      '@type': 'FAQPage',
      '@id': `${canonicalUrl}#master-short-answers`,
      url: canonicalUrl,
      name: 'Essential frontend interview questions and answers',
      mainEntity: this.masterShortAnswers().map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      })),
    };
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

  private vueShortAnswersFaqPage(canonicalUrl: string): Record<string, any> {
    return {
      '@type': 'FAQPage',
      '@id': `${canonicalUrl}#vue-short-answers`,
      url: canonicalUrl,
      name: 'Top Vue.js interview questions and short answers, beginner to advanced',
      mainEntity: this.vueShortAnswers().map((item) => ({
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

  private cssShortAnswersFaqPage(canonicalUrl: string): Record<string, any> {
    return {
      '@type': 'FAQPage',
      '@id': `${canonicalUrl}#css-short-answers`,
      url: canonicalUrl,
      name: 'Top CSS interview questions and short answers, beginner to advanced',
      mainEntity: this.cssShortAnswers().map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      })),
    };
  }

  private htmlShortAnswersFaqPage(canonicalUrl: string): Record<string, any> {
    return {
      '@type': 'FAQPage',
      '@id': `${canonicalUrl}#html-short-answers`,
      url: canonicalUrl,
      name: 'Top HTML interview questions and short answers, beginner to advanced',
      mainEntity: this.htmlShortAnswers().map((item) => ({
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
