#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { cdnSystemDesignIndexPath } from './content-paths.mjs';
import { startSeoStaticServer } from './seo-static-server.mjs';
import { loadSitemapDateMap, schemaDateMatchesSitemap } from './seo-sitemap-date-contract.mjs';

const BUILD_DIR = path.resolve(process.env.SEO_BUILD_DIR || 'dist/frontendatlas/browser');
const HOST = process.env.SEO_SERVER_HOST || '127.0.0.1';
const PORT = Number(process.env.SEO_SERVER_PORT || 4173);
const SAMPLE_GUIDE_ROUTE = '/guides/interview-blueprint/intro';
const GOOGLE_PREVIEW_ROUTE = '/companies/google/preview';
const GOOGLE_PREVIEW_CANONICAL = `https://frontendatlas.com${GOOGLE_PREVIEW_ROUTE}`;
const GOOGLE_PREVIEW_TITLE = 'Google Frontend Interview Questions: 7 Prompts + Prep Guide';
const GOOGLE_PREVIEW_DESCRIPTION =
  'Prepare for a Google frontend interview with 7 representative questions covering DSA, JavaScript, browser APIs, UI coding, accessibility, and system design.';
const GOOGLE_PREVIEW_H1 = 'Google Frontend Interview Questions';
const GOOGLEBOT_USER_AGENT = 'Googlebot';
const TRIVIA_SCHEMA_HEADLINE_SUFFIX = 'Frontend interview practice question';
const TRIVIA_REQUIRED_SCHEMA_TYPES = ['BreadcrumbList', 'Article'];
const TRIVIA_FORBIDDEN_SCHEMA_TYPES = ['TechArticle', 'FAQPage', 'QAPage', 'Question', 'Quiz'];
const GOOGLE_PREVIEW_HEADINGS = [
  'What to study first for a Google frontend interview',
  'Seven Google frontend interview practice questions',
  'Walk through autocomplete request ordering before you code',
  'A 7-day Google frontend interview preparation plan',
  'Common Google frontend interview preparation questions',
  'Free public practice',
];
const GOOGLE_PREVIEW_TRUST_NOTE =
  'These are representative FrontendAtlas practice prompts, not leaked or confirmed Google interview questions. Interview formats vary by role, level, team, location, and time.';
const GOOGLE_PREVIEW_PROMPTS = [
  { id: 'nested-navigation-tree', title: 'Traverse and transform a nested navigation tree' },
  { id: 'debounce-cancel-flush', title: 'Implement debounce with cancel and flush' },
  { id: 'accessible-autocomplete', title: 'Build an accessible autocomplete' },
  { id: 'take-latest-async-results', title: 'Keep only the latest async result' },
  { id: 'dom-event-delegation', title: 'Handle delegated events in a dynamic list' },
  {
    id: 'frontend-performance-network-security',
    title: 'Reason about frontend performance, networking, and security',
  },
  {
    id: 'search-suggestions-large-list-design',
    title: 'Design search suggestions for a large interactive list',
  },
];
const GOOGLE_PREVIEW_RESOURCE_ROUTES = [
  '/javascript/coding/js-get-by-path-1',
  '/javascript/coding/js-debounce',
  '/react/coding/react-autocomplete-search-starter',
  '/javascript/coding/js-take-latest',
  '/javascript/trivia/js-event-delegation',
  '/javascript/trivia/web-performance-optimize-load-time',
  '/system-design/infinite-scroll-list',
  '/javascript/trivia/js-compare-two-objects',
];
const NETFLIX_PREVIEW_ROUTE = '/companies/netflix/preview';
const NETFLIX_PREVIEW_CANONICAL = `https://frontendatlas.com${NETFLIX_PREVIEW_ROUTE}`;
const NETFLIX_PREVIEW_TITLE = 'Netflix Frontend Interview Questions: 6 Prompts + Prep Guide';
const NETFLIX_PREVIEW_DESCRIPTION =
  'Prepare for a Netflix frontend interview with 6 representative prompts on JavaScript, React, streaming UI, performance, accessibility, and system design.';
const NETFLIX_PREVIEW_H1 = 'Netflix Frontend Interview Questions';
const NETFLIX_PREVIEW_HEADINGS = [
  'Prepare for product judgment, not Netflix trivia',
  'What Netflix publishes—and what you still need to confirm',
  'Three product contexts for practicing transferable frontend judgment',
  'Six Netflix frontend interview practice questions',
  'Scope Continue Watching before drawing architecture boxes',
  'A 7-day Netflix frontend interview preparation plan',
  'Common Netflix frontend interview preparation questions',
  'Build the underlying skills with free practice',
  'Sources and evidence limits',
];
const NETFLIX_PREVIEW_TRUST_NOTE =
  'These are representative FrontendAtlas practice prompts, not leaked or confirmed Netflix interview questions. Interview formats vary by role and team, so use recruiter-provided material as the source of truth.';
const NETFLIX_PREVIEW_PROMPTS = [
  { id: 'resilient-title-search', title: 'Implement resilient title search' },
  { id: 'accessible-continue-watching-row', title: 'Build an accessible Continue Watching row' },
  {
    id: 'personalized-row-rendering',
    title: 'Stop personalized rows from re-rendering unnecessarily',
  },
  {
    id: 'streaming-caching-failure-states',
    title: 'Reason about streaming delivery, caching, and failure states',
  },
  {
    id: 'continue-watching-system-design',
    title: 'Design Continue Watching for regional and device scale',
  },
  {
    id: 'consequential-frontend-decision',
    title: 'Defend a consequential frontend decision',
  },
];
const NETFLIX_PREVIEW_RESOURCE_ROUTES = [
  '/javascript/coding/js-debounce',
  '/javascript/coding/js-take-latest',
  '/react/trivia/react-rerender-decision-and-render',
  '/javascript/trivia/content-delivery-caching-strategies-streaming',
  '/system-design/infinite-scroll-list',
  '/system-design/dashboard-widgets-draggable-resizable',
  '/guides/system-design-blueprint/performance',
  '/guides/behavioral/stories',
];
const AUTHORED_GUIDE_SMOKE = [
  {
    label: 'Waymo',
    route: '/companies/waymo/preview',
    title: 'Waymo Frontend Interview Questions: 5 Prompts + Prep Guide',
    description:
      'Prepare for a Waymo frontend interview with 5 prompts modelled on a public 2026 report: tree filtering, Angular debugging, Promises, AI chat and autocomplete.',
    h1: 'Waymo Frontend Interview Questions',
    kicker: 'Public Waymo prep guide',
    headings: [
      'Prepare for product judgment, not Waymo trivia',
      'What the report establishes, and what you still need to confirm',
      'Five Waymo frontend interview practice questions',
      'Scope the tree filter before writing the first line',
      'A 7-day Waymo frontend interview preparation plan',
      'Common Waymo frontend interview preparation questions',
      'Build the underlying skills with free practice',
      'Sources and evidence limits',
    ],
    trustFragment: 'not leaked, confirmed or official Waymo questions',
    prompts: [
      { id: 'tree-filter-render', title: 'Filter a tree by substring and render it indented' },
      { id: 'angular-bug-reports-debugging', title: 'Fix an Angular screen from three user bug reports' },
      { id: 'promise-contract-typescript', title: 'Implement a Promise contract in TypeScript' },
      { id: 'ai-chat-frontend-design', title: 'Design the frontend of an AI chat application' },
      { id: 'debounced-autocomplete', title: 'Build an autocomplete search bar with debounce' },
    ],
    resources: [
      '/javascript/coding/js-filter-tree-render-indented',
      '/javascript/coding/js-create-deferred-promise',
      '/javascript/coding/js-take-latest',
      '/react/coding/react-autocomplete-search-starter',
      '/system-design/ai-chat-textarea-design',
      '/angular/trivia/angular-http-what-actually-cancels-request',
      '/angular/trivia/angular-onpush-change-detection-debugging-real-bug',
    ],
    reportUrl:
      'https://prachub.com/interview-experiences/waymo-senior-frontend-engineer-interview-experience-rejected-30-minutes-after-pushing-on-the-process',
  },
  {
    label: 'ElevenLabs',
    route: '/companies/elevenlabs/preview',
    title: 'ElevenLabs Frontend Interview Questions: 5 Prompts + Guide',
    description:
      'Prepare for an ElevenLabs frontend interview with 5 prompts modelled on public reports: audio-transcript sync, dubbing review UI, live fix, timed assessment.',
    h1: 'ElevenLabs Frontend Interview Questions',
    kicker: 'Public ElevenLabs prep guide',
    headings: [
      'Prepare for product judgment, not ElevenLabs trivia',
      'What the public pages establish, and what you still need to confirm',
      'Five ElevenLabs frontend interview practice questions',
      'Scope the transcript highlight before writing the first line',
      'A 7-day ElevenLabs frontend interview preparation plan',
      'Common ElevenLabs frontend interview preparation questions',
      'Build the underlying skills with free practice',
      'Sources and evidence limits',
    ],
    trustFragment: 'not leaked, confirmed or official ElevenLabs questions',
    prompts: [
      { id: 'audio-transcript-sync', title: 'Synchronise audio playback with transcript highlighting' },
      { id: 'dubbing-review-interface', title: 'Design a review and collaboration interface for a voice-dubbing project' },
      { id: 'fix-a-practical-react-problem', title: 'Fix a practical React problem live with the interviewer' },
      { id: 'timed-assessment-react-and-algorithms', title: 'Clear a 90-minute technical assessment before the first call' },
      { id: 'streaming-audio-and-text-ui', title: 'Stream generated audio and text to the screen without losing control' },
    ],
    resources: [
      '/javascript/coding/js-stream-to-text',
      '/javascript/coding/js-poll-until',
      '/javascript/debug/js-debug-async-race',
      '/javascript/debug/js-debug-stale-closure-autosave',
      '/react/coding/react-autocomplete-search-starter',
      '/javascript/trivia/ai-streaming-data-handling',
      '/system-design/ai-chat-textarea-design',
    ],
    reportUrl: 'https://www.aced.io/guides/elevenlabs-software-engineer-interview/questions',
  },
  {
    label: 'Datadog',
    route: '/companies/datadog/preview',
    title: 'Datadog Frontend Interview Questions: 5 Prompts + Prep Guide',
    description:
      'Prepare for a Datadog frontend interview with 5 practice prompts: sortable real-time tables, Live Tail log architecture, timed sorting and filtering.',
    h1: 'Datadog Frontend Interview Questions',
    kicker: 'Public Datadog prep guide',
    headings: [
      'Prepare for product judgment, not Datadog trivia',
      'What the public accounts establish, and what you still need to confirm',
      'Five Datadog frontend interview practice questions',
      'Scope the sortable real-time table before writing the first line',
      'A 7-day Datadog frontend interview preparation plan',
      'Common Datadog frontend interview preparation questions',
      'Build the underlying skills with free practice',
      'Sources and evidence limits',
    ],
    trustFragment: 'not leaked, confirmed or official Datadog questions',
    prompts: [
      { id: 'sortable-real-time-table', title: 'Build a table of real-time data that sorts by any column' },
      { id: 'live-tail-logs-architecture', title: 'Design the frontend architecture of a Live Tail log view' },
      { id: 'ordering-and-filtering-under-time', title: 'Solve an ordering-and-filtering exercise under time' },
      { id: 'incremental-live-coding-on-tables', title: 'Survive incremental live coding on data and tables' },
      { id: 'feature-or-major-bug-walkthrough', title: 'Explain how you would build a feature or fix a major bug' },
    ],
    resources: [
      '/javascript/coding/js-update-at-index',
      '/javascript/coding/js-count-vowels',
      '/javascript/debug/js-debug-numeric-sort',
      '/system-design/infinite-scroll-list',
      '/incidents/search-typing-lag',
      '/tradeoffs/sse-vs-websocket-live-dashboard',
      '/guides/system-design-blueprint/performance',
    ],
    reportUrl:
      'https://www.jointaro.com/interviews/companies/datadog/experiences/senior-frontend-developer-valbonne-october-1-2024-accepted-offer-positive-47d59048/',
  },
  {
    label: 'Intuit',
    route: '/companies/intuit/preview',
    title: 'Intuit Frontend Interview Questions: 5 Prompts + Prep Guide',
    description:
      'Prepare for an Intuit frontend interview with 5 practice prompts: craft demo app build, typeahead in a given codebase, promise retry, LLM streaming story.',
    h1: 'Intuit Frontend Interview Questions',
    kicker: 'Public Intuit prep guide',
    headings: [
      'Prepare for product judgment, not Intuit trivia',
      'What the public accounts establish, and what you still need to confirm',
      'Five Intuit frontend interview practice questions',
      'Scope the craft demo app before the panel joins',
      'A 7-day Intuit frontend interview preparation plan',
      'Common Intuit frontend interview preparation questions',
      'Build the underlying skills with free practice',
      'Sources and evidence limits',
    ],
    trustFragment: 'not leaked, confirmed or official Intuit questions',
    prompts: [
      { id: 'craft-demo-build-and-extend', title: 'Build a small app from a brief, then extend it live in the craft demo' },
      { id: 'typeahead-in-an-unfamiliar-codebase', title: 'Implement a typeahead in a codebase you received yesterday, then test it' },
      { id: 'promise-retry-and-race-polyfill', title: 'Implement a promise retry with delay, then a Promise.race polyfill' },
      { id: 'llm-user-story-with-streaming', title: 'Deliver an LLM user story with streaming output, error handling and tests' },
      { id: 'javascript-fundamentals-under-questioning', title: 'Answer JavaScript fundamentals under questioning: currying, memoization, output prediction, DOM comparison' },
    ],
    resources: [
      '/javascript/coding/js-promise-any',
      '/javascript/coding/js-stream-to-text',
      '/javascript/coding/js-sleep',
      '/react/coding/react-autocomplete-search-starter',
      '/javascript/trivia/js-hoisting',
      '/javascript/trivia/js-xss-dom-sinks',
      '/react/trivia/react-usememo-vs-usecallback',
    ],
    reportUrl:
      'https://leetcode.com/discuss/post/7320927/',
  },
  {
    label: 'ServiceNow',
    route: '/companies/servicenow/preview',
    title: 'ServiceNow Frontend Interview Questions: 5 Prompts + Guide',
    description:
      'Prepare for a ServiceNow frontend interview with 5 practice prompts: polyfills with edge cases, closures and output prediction, a tiny virtual DOM, UI design.',
    h1: 'ServiceNow Frontend Interview Questions',
    kicker: 'Public ServiceNow prep guide',
    headings: [
      'Prepare for product judgment, not ServiceNow trivia',
      'What the public accounts establish, and what you still need to confirm',
      'Five ServiceNow frontend interview practice questions',
      'Scope the map polyfill before writing the first line',
      'A 7-day ServiceNow frontend interview preparation plan',
      'Common ServiceNow frontend interview preparation questions',
      'Build the underlying skills with free practice',
      'Sources and evidence limits',
    ],
    trustFragment: 'not leaked, confirmed or official ServiceNow questions',
    prompts: [
      { id: 'polyfills-with-edge-cases', title: 'Write polyfills for built-in methods and defend the edge cases' },
      { id: 'closures-and-output-prediction', title: 'Predict console output and write loop counters that prove you understand closures' },
      { id: 'tiny-virtual-dom-renderer', title: 'Implement a tiny virtual DOM renderer' },
      { id: 'ui-design-and-data-flow', title: 'Design the components and data flow of a UI feature: notification panel, nested comments or autocomplete' },
      { id: 'fundamentals-over-frameworks', title: 'Explain Map versus Object and other fundamentals without leaning on a framework' },
    ],
    resources: [
      '/javascript/coding/js-array-foreach',
      '/javascript/coding/js-create-counter',
      '/javascript/coding/js-implement-bind',
      '/javascript/trivia/js-map-vs-object',
      '/javascript/trivia/js-closures',
      '/javascript/trivia/js-var-hoisting-shadowing-output',
      '/system-design/notification-toast-system',
      '/system-design/infinite-scroll-list',
    ],
    reportUrl:
      'https://medium.com/@karunakumari000532/my-servicenow-software-engineer-ui-interview-experience-2025-23f315b960dc',
  },
  {
    label: 'Amazon',
    route: '/companies/amazon/preview',
    title: 'Amazon Frontend Interview Questions: 7 Prompts + Prep Guide',
    description:
      'Prepare for an Amazon front end engineer interview with 7 practice prompts: star rating, carousel, paginated addresses, countdown timer, image service design.',
    h1: 'Amazon Frontend Interview Questions',
    kicker: 'Public Amazon prep guide',
    headings: [
      'Prepare for product judgment, not Amazon trivia',
      'What the official page and the public accounts establish, and what you still need to confirm',
      'Seven Amazon frontend interview practice questions',
      'Scope the paginated address widget before writing the first line',
      'A 7-day Amazon frontend interview preparation plan',
      'Common Amazon frontend interview preparation questions',
      'Build the underlying skills with free practice',
      'Sources and evidence limits',
    ],
    trustFragment: 'not leaked, confirmed or official Amazon questions',
    prompts: [
      { id: 'five-star-rating-vanilla', title: 'Build a five-star rating widget in vanilla HTML, CSS and JavaScript' },
      { id: 'carousel-with-state-follow-ups', title: 'Implement a carousel component, then defend its state management' },
      { id: 'language-tabs-modal', title: 'Recreate a modal with language tabs from an image' },
      { id: 'countdown-timer-in-thirty-minutes', title: 'Design and build a countdown timer in thirty minutes' },
      { id: 'paginated-address-widget', title: 'Code a paginated widget of seller addresses, five per page' },
      { id: 'image-service-frontend-design', title: 'Design the frontend of an image service or a restaurant ordering app' },
      { id: 'file-explorer-from-ascii-sketch', title: 'Build the interface of a file explorer from an ASCII sketch' },
    ],
    resources: [
      '/javascript/coding/js-build-tree-from-flat-list',
      '/javascript/coding/js-implement-new',
      '/javascript/coding/js-create-counter',
      '/javascript/coding/js-sleep',
      '/react/coding/react-todo-list',
      '/css/coding/css-forms-pseudoclasses',
      '/javascript/trivia/js-repaint-reflow',
      '/system-design/resilient-checkout-payment-flow',
    ],
    reportUrl: 'https://leetcode.com/discuss/post/546992/',
  },
  {
    label: 'Meta',
    route: '/companies/meta/preview',
    title: 'Meta Frontend Interview Questions: 7 Prompts + Prep Guide',
    description:
      'Prepare for a Meta front end engineer interview with 7 practice prompts: map from scratch, clearAllTimeout, memoization, DOM traversal, autocomplete design.',
    h1: 'Meta Frontend Interview Questions',
    kicker: 'Public Meta prep guide',
    headings: [
      'Prepare for product judgment, not Meta trivia',
      'What the official pages and the public accounts establish, and what you still need to confirm',
      'Seven Meta frontend interview practice questions',
      'Scope clearAllTimeout before writing the first line',
      'A 7-day Meta frontend interview preparation plan',
      'Common Meta frontend interview preparation questions',
      'Build the underlying skills with free practice',
      'Sources and evidence limits',
    ],
    trustFragment: 'not leaked, confirmed or official Meta questions',
    prompts: [
      { id: 'implement-map-from-scratch', title: 'Implement Array.prototype.map from scratch' },
      { id: 'clear-all-timeout', title: 'Implement your own clearAllTimeout' },
      { id: 'memoize-with-cache-keys', title: 'Write a memoize helper and defend its cache key' },
      { id: 'twin-dom-tree-node', title: 'Find the corresponding node in a twin DOM tree' },
      { id: 'traverse-dom-collect-nodes', title: 'Traverse the DOM and collect the nodes that match' },
      { id: 'stack-and-queue-in-javascript', title: 'Implement a stack and a queue in JavaScript, then clear a short algorithm screen' },
      { id: 'autocomplete-component-design', title: 'Design an autocomplete component, not the front end of a product' },
    ],
    resources: [
      '/javascript/coding/js-flatten-once',
      '/javascript/coding/js-array-foreach',
      '/javascript/coding/js-debounce',
      '/javascript/coding/js-create-lru-cache',
      '/javascript/coding/js-create-counter',
      '/javascript/trivia/js-queue-vs-stack',
      '/html/trivia/html-dom-tree-structure',
      '/system-design/infinite-scroll-list',
    ],
    reportUrl:
      'https://www.jointaro.com/interviews/companies/meta/experiences/front-end-developer-intern-london-england-december-1-2021-no-offer-positive-4f6ff45b/',
  },
  {
    label: 'Revolut',
    route: '/companies/revolut/preview',
    title: 'Revolut Frontend Interview Questions: 5 Prompts + Prep Guide',
    description:
      'Prepare for a Revolut frontend interview with 5 practice prompts: a one-hour TypeScript fetch-and-render task, HackerRank, theory checks, system design.',
    h1: 'Revolut Frontend Interview Questions',
    kicker: 'Public Revolut prep guide',
    headings: [
      'Prepare for product judgment, not Revolut trivia',
      'What the public accounts establish, and what you still need to confirm',
      'Five Revolut frontend interview practice questions',
      'Scope the one-hour fetch-and-render task before the first line',
      'A 7-day Revolut frontend interview preparation plan',
      'Common Revolut frontend interview preparation questions',
      'Build the underlying skills with free practice',
      'Sources and evidence limits',
    ],
    trustFragment: 'not leaked, confirmed or official Revolut questions',
    prompts: [
      { id: 'fetch-and-render-in-one-hour', title: 'Fetch data and render it in one hour, in TypeScript, with every request state' },
      { id: 'authenticated-api-pairing', title: 'Display data from an authenticated API in a React component, pairing with the interviewer' },
      { id: 'hackerrank-screen-three-tasks', title: 'Clear the HackerRank screen: three JavaScript tasks in 85 minutes' },
      { id: 'recruiter-theory-check', title: 'Answer the recruiter-run theory check: reconciliation, microtasks versus macrotasks, the DOM tree' },
      { id: 'frontend-system-design-api-contracts', title: 'Design a product feature end to end: the frontend, its API contracts and the services behind them' },
    ],
    resources: [
      '/react/coding/react-fetch-list-states',
      '/javascript/coding/js-fetch-json-timeout',
      '/javascript/coding/js-debounce',
      '/javascript/trivia/js-microtasks-vs-macrotasks',
      '/react/trivia/react-diffing-algorithm',
      '/html/trivia/html-dom-tree-structure',
      '/system-design/resilient-checkout-payment-flow',
      '/guides/interview-blueprint/dsa-for-fe',
      '/guides/behavioral/stories',
    ],
    reportUrl:
      'https://www.jointaro.com/interviews/companies/revolut/experiences/frontend-developer-warsaw-masovia-april-1-2025-no-offer-neutral-71032bb4/',
  },
  {
    label: 'Spotify',
    route: '/companies/spotify/preview',
    title: 'Spotify Frontend Interview Questions: 7 Prompts + Prep Guide',
    description:
      'Prepare for a Spotify web engineer interview with 7 frontend practice prompts: a fetch-to-DOM form, carousel, traffic light, event loop, system design.',
    h1: 'Spotify Frontend Interview Questions',
    kicker: 'Public Spotify prep guide',
    headings: [
      'Prepare for product judgment, not Spotify trivia',
      'What the public accounts and the official pages establish, and what you still need to confirm',
      'Seven Spotify frontend interview practice questions',
      'Scope the fetch-to-DOM search form before writing the first line',
      'A 7-day Spotify frontend interview preparation plan',
      'Common Spotify frontend interview preparation questions',
      'Build the underlying skills with free practice',
      'Sources and evidence limits',
    ],
    trustFragment: 'not leaked, confirmed or official Spotify questions',
    prompts: [
      { id: 'search-form-fetch-render-dom', title: 'Build a search form that fetches from an API and renders the results into the DOM, without a framework' },
      { id: 'image-carousel-html-css-js', title: 'Build an image carousel with HTML, CSS and JavaScript' },
      { id: 'traffic-light-html-css-js', title: 'Build a traffic light with plain HTML, CSS and JavaScript' },
      { id: 'event-loop-output-order', title: 'Predict the output order of code that mixes setTimeout and promise chains' },
      { id: 'closure-call-limit', title: 'Write a closure that limits how many times a function can run' },
      { id: 'system-design-full-stack', title: 'Design a product end to end in the system-design round, backend included' },
      { id: 'algorithms-round', title: 'Clear the data structures and algorithms round' },
    ],
    resources: [
      '/javascript/coding/js-take-latest',
      '/react/coding/react-fetch-list-states',
      '/javascript/trivia/js-event-loop-nested-microtask-output',
      '/javascript/coding/js-once',
      '/javascript/trivia/js-closures',
      '/javascript/trivia/js-event-delegation',
      '/javascript/trivia/js-memoization',
      '/css/trivia/css-box-model',
      '/guides/system-design-blueprint/architecture',
      '/guides/behavioral/stories',
    ],
    reportUrl:
      'https://www.teamblind.com/post/weak-system-design-interview-for-spotify-chances-of-no-hire-00wjs6rg',
  },
];
// Catalog-driven company previews with an editorial notes entry (COMPANY_EDITORIAL_NOTES).
const EDITORIAL_NOTE_SMOKE = [
  {
    label: 'Walmart',
    route: '/companies/walmart/preview',
    title: 'Walmart Frontend Interview Process and Practice Questions',
    h1: 'Walmart Frontend Interview Questions and Process',
    headings: [
      'Three loop shapes, by role and region',
      'Rehearse the reported rounds in order',
      'Common questions about Walmart frontend interviews',
    ],
    practicePath: '/javascript/coding/js-valid-parentheses',
  },
  {
    label: 'ByteDance and TikTok',
    route: '/companies/bytedance/preview',
    title: 'ByteDance and TikTok Frontend Interview Process and Prep',
    h1: 'ByteDance and TikTok Frontend Interview Questions',
    headings: [
      'Two technical rounds and a hiring manager round, by region',
      'Rehearse the reported rounds in order',
      'Common questions about ByteDance and TikTok frontend interviews',
    ],
    practicePath: '/javascript/coding/js-build-tree-from-flat-list',
  },
  {
    label: 'Microsoft',
    route: '/companies/microsoft/preview',
    title: 'Microsoft Frontend Interview Process and Practice Guide',
    h1: 'Microsoft Frontend Interview Questions and Process',
    headings: [
      'Two to six rounds, set by the team',
      'Rehearse the concept rounds, then the builds',
      'Common questions about Microsoft frontend interviews',
    ],
    practicePath: '/javascript/trivia/js-promises-async-await',
  },
  {
    label: 'Tesla',
    route: '/companies/tesla/preview',
    title: 'Tesla Frontend Interview Process and Practice Questions',
    h1: 'Tesla Frontend Interview Questions and Process',
    headings: [
      'Assessment, screen, then a three to five round onsite',
      'Rehearse the reported stages in order',
      'Common questions about Tesla frontend interviews',
    ],
    practicePath: '/javascript/coding/js-color-contrast-ratio',
  },
  {
    label: 'Booking.com',
    route: '/companies/booking-com/preview',
    title: 'Booking.com Frontend Interview Process and Practice',
    h1: 'Booking.com Frontend Interview Questions and Process',
    headings: [
      'HackerRank test, recruiter call, coding rounds, fit interview',
      'Rehearse the autocomplete round first',
      'Common questions about Booking.com frontend interviews',
    ],
    practicePath: '/react/coding/react-autocomplete-search-starter',
  },
  {
    label: 'Zalando',
    route: '/companies/zalando/preview',
    title: 'Zalando Frontend Interview Process and Practice',
    h1: 'Zalando Frontend Interview Questions and Process',
    headings: [
      'A take-home, a hiring manager call and a final day',
      'Rehearse the take-home, then the fundamentals hour',
      'Common questions about Zalando frontend interviews',
    ],
    practicePath: '/react/coding/react-autocomplete-search-starter',
  },
  {
    label: 'Stripe',
    route: '/companies/stripe/preview',
    title: 'Stripe Frontend Interview Process and Practice Questions',
    h1: 'Stripe Frontend Interview Questions and Process',
    headings: [
      'A multi-part screen, then an onsite of five rounds',
      'Rehearse the bug squash and the JSON screen',
      'Common questions about Stripe frontend interviews',
    ],
    practicePath: '/javascript/debug/js-debug-async-race',
  },
];
const ANGULAR_HTTP_CANCELLATION_LAB_ROUTE =
  '/angular/trivia/angular-http-what-actually-cancels-request';
const ANGULAR_HTTP_CANCELLATION_LAB_CANONICAL =
  `https://frontendatlas.com${ANGULAR_HTTP_CANCELLATION_LAB_ROUTE}`;
const ANGULAR_HTTP_CANCELLATION_LAB_TITLE =
  'Does Angular HttpClient Unsubscribe Cancel Requests?';
const ANGULAR_HTTP_CANCELLATION_LAB_DESCRIPTION =
  'Test when unsubscribe cancels Angular HTTP requests, why server work may continue, and how six runnable tests expose stale UI bugs.';
const ANGULAR_HTTP_CANCELLATION_LAB_H1 =
  'Angular HttpClient Cancellation: Debug, Test, and Prevent Stale UI';
const ANGULAR_HTTP_CANCELLATION_LAB_CONTENT = [
  '15-second answer',
  'Cancellation behavior model',
  'RxJS subscription',
  'Browser transport',
  'UI commit',
  'Server work',
  'Manual unsubscribe',
  'switchMap',
  'mergeMap',
  'takeUntilDestroyed',
  'AsyncPipe',
  'shareReplay',
  'Browser DevTools',
  'HttpTestingController',
  'TestRequest.cancelled',
  'http-cancellation.spec.ts',
  'Interview focus',
  'Interview answer drill',
];
const ANGULAR_HTTP_CANCELLATION_LAB_RESOURCE_ROUTES = [
  '/angular/trivia/rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use',
  '/angular/trivia/angular-prevent-memory-leaks-unsubscribe-patterns',
  '/angular/trivia/rxjs-sharereplay-angular-how-it-breaks-your-app',
  '/javascript/coding/js-take-latest',
];
const ANGULAR_HTTP_CANCELLATION_LAB_OFFICIAL_SOURCES = [
  'https://angular.dev/guide/http/making-requests',
  'https://angular.dev/guide/http/testing',
  'https://angular.dev/api/common/http/testing/TestRequest',
  'https://angular.dev/api/common/http/HttpRequest',
];
const REACT_STALE_CLOSURES_ROUTE = '/react/trivia/react-stale-state-closures';
const REACT_STALE_CLOSURES_CANONICAL =
  `https://frontendatlas.com${REACT_STALE_CLOSURES_ROUTE}`;
const REACT_STALE_CLOSURES_TITLE = 'React Stale Closures: 6 PRs, Which Fix Is Right?';
const REACT_STALE_CLOSURES_DESCRIPTION =
  'Review six React pull requests: four stale closures, one intentional snapshot, and one async race. Predict the failure and reveal the minimal safe diff.';
const REACT_STALE_CLOSURES_H1 =
  'React Stale Closure Case Files: Diagnose Six Pull Requests';
const REACT_STALE_CLOSURES_TRUST_NOTE =
  'These are representative FrontendAtlas code-review scenarios, not real pull requests or leaked interview material.';
const REACT_STALE_CLOSURE_CASE_FILES = [
  { id: 'pr-interval-counter', title: 'Interval counter: update from previous state' },
  { id: 'pr-chat-theme', title: 'Chat connection: read the latest theme without reconnecting' },
  { id: 'pr-escape-listener', title: 'Escape listener: re-synchronize with isDirty' },
  { id: 'pr-debounced-autosave', title: 'Debounced autosave: pass the invocation snapshot' },
  { id: 'pr-export-snapshot', title: 'Export audit: preserve the initiating snapshot' },
  { id: 'pr-search-ordering', title: 'Async search: diagnose a race, not a closure' },
];
const REACT_STALE_CLOSURES_SECTION_HEADINGS = [
  'Callback contract',
  'React stale closure case files',
  'Diagnosis table',
  'Production code-review checklist',
  '30-second interview answer',
];
const REACT_STALE_CLOSURES_OFFICIAL_SOURCES = [
  'https://react.dev/learn/state-as-a-snapshot',
  'https://react.dev/reference/eslint-plugin-react-hooks/lints/exhaustive-deps',
  'https://react.dev/reference/react/useEffectEvent',
  'https://react.dev/reference/react/useRef',
];
const ASYNC_RACE_ROUTE = '/javascript/trivia/js-async-race-conditions';
const execFileAsync = promisify(execFile);

function pickSystemDesignSampleId() {
  const filePath = cdnSystemDesignIndexPath;
  if (!fs.existsSync(filePath)) return '';
  try {
    const list = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!Array.isArray(list)) return '';
    const first = list.find((item) => typeof item?.id === 'string' && item.id.trim().length > 0);
    return first?.id || '';
  } catch {
    return '';
  }
}

function curlArgs(url, { followRedirects = false, userAgent = '' } = {}) {
  const args = ['-sS'];
  if (followRedirects) args.push('-L');
  if (userAgent) args.push('-A', userAgent);
  args.push(url);
  return args;
}

async function curlStatus(url, options = {}) {
  const args = curlArgs(url, options);
  args.splice(args.length - 1, 0, '-o', '/dev/null', '-w', '%{http_code}');
  const { stdout } = await execFileAsync('curl', args, {
    encoding: 'utf8',
  });
  return Number(String(stdout).trim());
}

async function curlBody(url, options = {}) {
  const { stdout } = await execFileAsync('curl', curlArgs(url, options), {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 20,
  });
  return stdout;
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&');
}

function extractAttribute(tag, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = String(tag || '').match(new RegExp(`\\b${escapedName}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  return match ? decodeHtml(match[2]).trim() : '';
}

function extractMetaContent(html, attributeName, attributeValue) {
  const expected = String(attributeValue || '').toLowerCase();
  const tags = String(html || '').match(/<meta\b[^>]*>/gi) || [];
  const tag = tags.find(
    (candidate) => extractAttribute(candidate, attributeName).toLowerCase() === expected,
  );
  return tag ? extractAttribute(tag, 'content') : '';
}

function extractTitle(html) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return m ? decodeHtml(m[1]).trim() : '';
}

function extractCanonical(html) {
  const m = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  return m ? m[1].trim() : '';
}

function extractRobots(html) {
  const m = html.match(/<meta\s+name="robots"\s+content="([^"]+)"/i);
  return m ? m[1].trim().toLowerCase() : '';
}

function extractH1(html) {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!m) return '';
  return decodeHtml(m[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function normalizeText(value) {
  return decodeHtml(value).replace(/\s+/g, ' ').trim();
}

function extractVisibleText(html) {
  return normalizeText(
    String(html || '')
      .replace(/<script\b[\s\S]*?<\/script\b[^>]*>/gi, ' ')
      .replace(/<style\b[\s\S]*?<\/style\b[^>]*>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  );
}

function extractInternalLinkPaths(html) {
  const paths = new Set();
  for (const match of String(html || '').matchAll(/<a\b[^>]*>/gi)) {
    const href = extractAttribute(match[0], 'href');
    if (!href) continue;
    try {
      const url = new URL(href, 'https://frontendatlas.com');
      if (url.origin === 'https://frontendatlas.com' && !url.search && !url.hash) {
        paths.add(url.pathname.replace(/\/+$/, '') || '/');
      }
    } catch {
      // Ignore malformed links; the dedicated link checks report missing routes below.
    }
  }
  return paths;
}

function extractLinkHrefs(html) {
  const hrefs = new Set();
  for (const match of String(html || '').matchAll(/<a\b[^>]*>/gi)) {
    const href = extractAttribute(match[0], 'href');
    if (href) hrefs.add(href);
  }
  return hrefs;
}

function extractSeoJsonLd(html) {
  const scripts = Array.from(String(html || '').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\b[^>]*>/gi));
  const match = scripts.find((entry) => extractAttribute(entry[1], 'id') === 'seo-jsonld');
  if (!match) return { graph: [], error: 'script#seo-jsonld is missing' };

  try {
    const parsed = JSON.parse(match[2]);
    return {
      graph: Array.isArray(parsed?.['@graph']) ? parsed['@graph'] : [],
      error: '',
    };
  } catch (error) {
    return { graph: [], error: error instanceof Error ? error.message : String(error) };
  }
}

function hasSchemaType(node, expectedType) {
  const types = Array.isArray(node?.['@type']) ? node['@type'] : [node?.['@type']];
  return types.includes(expectedType);
}

function collectBuiltTriviaPages(buildDir) {
  if (!fs.existsSync(buildDir)) return [];

  const pages = [];
  for (const technology of fs.readdirSync(buildDir, { withFileTypes: true })) {
    if (!technology.isDirectory()) continue;
    const triviaDir = path.join(buildDir, technology.name, 'trivia');
    if (!fs.existsSync(triviaDir)) continue;

    for (const question of fs.readdirSync(triviaDir, { withFileTypes: true })) {
      if (!question.isDirectory()) continue;
      const indexPath = path.join(triviaDir, question.name, 'index.html');
      if (!fs.existsSync(indexPath)) continue;
      pages.push({
        route: `/${technology.name}/trivia/${question.name}`,
        html: fs.readFileSync(indexPath, 'utf8'),
      });
    }
  }

  return pages.sort((left, right) => left.route.localeCompare(right.route));
}

function triviaIntentContractViolations({ route, html }) {
  const violations = [];
  const jsonLd = extractSeoJsonLd(html);
  if (jsonLd.error) return [`${route}: ${jsonLd.error}`];

  const schemaTypes = jsonLd.graph.flatMap((node) => {
    const type = node?.['@type'];
    return Array.isArray(type) ? type : type ? [type] : [];
  });
  const missingTypes = TRIVIA_REQUIRED_SCHEMA_TYPES.filter((type) => !schemaTypes.includes(type));
  const forbiddenTypes = TRIVIA_FORBIDDEN_SCHEMA_TYPES.filter((type) => schemaTypes.includes(type));
  if (missingTypes.length) violations.push(`missing ${missingTypes.join(',')}`);
  if (forbiddenTypes.length) violations.push(`forbidden ${forbiddenTypes.join(',')}`);

  const articles = jsonLd.graph.filter((node) => hasSchemaType(node, 'Article'));
  if (articles.length !== 1) {
    violations.push(`Article count ${articles.length}`);
  } else {
    const expectedHeadline = `${extractH1(html)} - ${TRIVIA_SCHEMA_HEADLINE_SUFFIX}`;
    if (articles[0]?.headline !== expectedHeadline) {
      violations.push(`headline=${articles[0]?.headline || '(missing)'}`);
    }
  }

  const forbiddenProperties = ['citation', 'hasPart'].filter((property) =>
    jsonLd.graph.some((node) => Object.prototype.hasOwnProperty.call(node, property)),
  );
  if (forbiddenProperties.length) {
    violations.push(`properties ${forbiddenProperties.join(',')}`);
  }
  if (/\bsource check\b/i.test(extractVisibleText(html))) {
    violations.push('visible Source check');
  }

  return violations.map((violation) => `${route}: ${violation}`);
}

const systemDesignId = pickSystemDesignSampleId();
if (!systemDesignId) {
  console.error('[seo:smoke] Could not find a system-design sample id.');
  process.exit(1);
}

let server = null;

try {
  server = await startSeoStaticServer({
    buildDir: BUILD_DIR,
    host: HOST,
    port: PORT,
    logPrefix: '[seo:smoke]',
  });

  const base = server.baseUrl.replace(/\/+$/, '');
  const sitemapDates = await loadSitemapDateMap(base, (url) => curlBody(url, {
    followRedirects: true, userAgent: GOOGLEBOT_USER_AGENT,
  }));
  const checks = [];

  const triviaPages = collectBuiltTriviaPages(BUILD_DIR);
  const triviaIntentViolations = triviaPages.flatMap(triviaIntentContractViolations);
  checks.push({
    name: 'all prerendered trivia pages follow the shared interview intent contract',
    ok: triviaPages.length > 0 && triviaIntentViolations.length === 0,
    detail: triviaIntentViolations.length
      ? `pages=${triviaPages.length} violations=${triviaIntentViolations.slice(0, 5).join(' | ')}`
      : `pages=${triviaPages.length}`,
  });

  const unknownPath = '/non-existent-seo-check-abc123';
  const unknownUrl = `${base}${unknownPath}`;
  const unknownStatus = await curlStatus(unknownUrl);
  const unknownBody = await curlBody(unknownUrl);
  const unknownCanonical = extractCanonical(unknownBody);
  const unknownRobots = extractRobots(unknownBody);
  checks.push({
    name: 'unknown route returns 404',
    ok: unknownStatus === 404,
    detail: `${unknownStatus} ${unknownPath}`,
  });
  checks.push({
    name: 'unknown route canonical is /404',
    ok: /https:\/\/frontendatlas\.com\/404\/?$/.test(unknownCanonical),
    detail: `canonical=${unknownCanonical || '(missing)'}`,
  });
  checks.push({
    name: 'unknown route robots is noindex',
    ok: unknownRobots.includes('noindex'),
    detail: `robots=${unknownRobots || '(missing)'}`,
  });

  const notFoundPath = '/404';
  const notFoundUrl = `${base}${notFoundPath}`;
  const notFoundStatus = await curlStatus(notFoundUrl);
  const notFoundBody = await curlBody(notFoundUrl);
  const notFoundCanonical = extractCanonical(notFoundBody);
  const notFoundRobots = extractRobots(notFoundBody);
  checks.push({
    name: '/404 returns 200 or 404',
    ok: notFoundStatus === 200 || notFoundStatus === 404,
    detail: `${notFoundStatus} ${notFoundPath}`,
  });
  checks.push({
    name: '/404 robots is noindex',
    ok: notFoundRobots.includes('noindex'),
    detail: `robots=${notFoundRobots || '(missing)'}`,
  });
  checks.push({
    name: '/404 canonical is /404',
    ok: /https:\/\/frontendatlas\.com\/404\/?$/.test(notFoundCanonical),
    detail: `canonical=${notFoundCanonical || '(missing)'}`,
  });

  const dashboardPath = '/dashboard';
  const dashboardUrl = `${base}${dashboardPath}`;
  const dashboardStatus = await curlStatus(dashboardUrl);
  const dashboardBody = await curlBody(dashboardUrl);
  const dashboardCanonical = extractCanonical(dashboardBody);
  const dashboardRobots = extractRobots(dashboardBody);
  checks.push({
    name: '/dashboard returns 200',
    ok: dashboardStatus === 200,
    detail: `${dashboardStatus} ${dashboardPath}`,
  });
  checks.push({
    name: '/dashboard robots is noindex',
    ok: dashboardRobots.includes('noindex'),
    detail: `robots=${dashboardRobots || '(missing)'}`,
  });
  checks.push({
    name: '/dashboard canonical is self (not homepage)',
    ok: /https:\/\/frontendatlas\.com\/dashboard\/?$/.test(dashboardCanonical),
    detail: `canonical=${dashboardCanonical || '(missing)'}`,
  });

  const systemPath = `/system-design/${systemDesignId}`;
  const systemUrl = `${base}${systemPath}`;
  const systemStatus = await curlStatus(systemUrl);
  const systemBody = await curlBody(systemUrl);
  const systemTitle = extractTitle(systemBody);
  const systemH1 = extractH1(systemBody);
  checks.push({
    name: 'system-design detail returns 200',
    ok: systemStatus === 200,
    detail: `${systemStatus} ${systemPath}`,
  });
  checks.push({
    name: 'system-design detail title is non-generic',
    ok: systemTitle.length > 0 && systemTitle.toLowerCase() !== 'system design scenario | frontendatlas',
    detail: `title=${systemTitle || '(missing)'}`,
  });
  checks.push({
    name: 'system-design detail has non-empty h1',
    ok: systemH1.length > 0,
    detail: `h1=${systemH1 || '(missing)'}`,
  });

  const guideUrl = `${base}${SAMPLE_GUIDE_ROUTE}`;
  const guideStatus = await curlStatus(guideUrl);
  const guideBody = await curlBody(guideUrl);
  const guideH1 = extractH1(guideBody);
  checks.push({
    name: 'guide detail returns 200',
    ok: guideStatus === 200,
    detail: `${guideStatus} ${SAMPLE_GUIDE_ROUTE}`,
  });
  checks.push({
    name: 'guide detail has non-empty h1',
    ok: guideH1.length > 0,
    detail: `h1=${guideH1 || '(missing)'}`,
  });

  const angularCancellationUrl = `${base}${ANGULAR_HTTP_CANCELLATION_LAB_ROUTE}`;
  const angularCancellationStatus = await curlStatus(angularCancellationUrl, {
    followRedirects: true,
    userAgent: GOOGLEBOT_USER_AGENT,
  });
  const angularCancellationBody = await curlBody(angularCancellationUrl, {
    followRedirects: true,
    userAgent: GOOGLEBOT_USER_AGENT,
  });
  const angularCancellationVisibleText = extractVisibleText(angularCancellationBody);
  const angularCancellationLinks = extractLinkHrefs(angularCancellationBody);
  const angularCancellationJsonLd = extractSeoJsonLd(angularCancellationBody);
  const angularCancellationArticle = angularCancellationJsonLd.graph.find((node) =>
    hasSchemaType(node, 'Article'),
  );
  const angularCancellationSchemaTypes = angularCancellationJsonLd.graph.flatMap((node) => {
    const type = node?.['@type'];
    return Array.isArray(type) ? type : type ? [type] : [];
  });

  checks.push({
    name: 'Googlebot receives the Angular HttpClient cancellation lab as 200',
    ok: angularCancellationStatus === 200,
    detail: `${angularCancellationStatus} ${ANGULAR_HTTP_CANCELLATION_LAB_ROUTE}`,
  });
  checks.push({
    name: 'Angular HttpClient cancellation lab has exact search metadata',
    ok:
      extractTitle(angularCancellationBody) === ANGULAR_HTTP_CANCELLATION_LAB_TITLE &&
      extractMetaContent(angularCancellationBody, 'name', 'description') ===
        ANGULAR_HTTP_CANCELLATION_LAB_DESCRIPTION &&
      extractMetaContent(angularCancellationBody, 'property', 'og:title') ===
        ANGULAR_HTTP_CANCELLATION_LAB_TITLE &&
      extractMetaContent(angularCancellationBody, 'name', 'twitter:title') ===
        ANGULAR_HTTP_CANCELLATION_LAB_TITLE,
    detail: `title=${extractTitle(angularCancellationBody) || '(missing)'}`,
  });
  checks.push({
    name: 'Angular HttpClient cancellation lab is self-canonical and indexable',
    ok:
      extractCanonical(angularCancellationBody) === ANGULAR_HTTP_CANCELLATION_LAB_CANONICAL &&
      extractRobots(angularCancellationBody).replace(/\s+/g, '') === 'index,follow',
    detail: `canonical=${extractCanonical(angularCancellationBody) || '(missing)'} robots=${
      extractRobots(angularCancellationBody) || '(missing)'
    }`,
  });
  const angularCancellationH1Count =
    (String(angularCancellationBody).match(/<h1\b/gi) || []).length;
  checks.push({
    name: 'Angular HttpClient cancellation lab has one exact H1',
    ok:
      extractH1(angularCancellationBody) === ANGULAR_HTTP_CANCELLATION_LAB_H1 &&
      angularCancellationH1Count === 1,
    detail: `h1=${extractH1(angularCancellationBody) || '(missing)'} count=${angularCancellationH1Count}`,
  });

  const missingAngularCancellationContent = ANGULAR_HTTP_CANCELLATION_LAB_CONTENT.filter(
    (expected) => !angularCancellationVisibleText.includes(normalizeText(expected)),
  );
  checks.push({
    name: 'Angular HttpClient cancellation lab exposes the complete debugging model in raw HTML',
    ok: missingAngularCancellationContent.length === 0,
    detail: missingAngularCancellationContent.length
      ? `missing=${missingAngularCancellationContent.join(' | ')}`
      : 'all present',
  });
  const angularCancellationMilestones = [
    '15-second answer',
    'Interview focus',
    'Interview answer drill',
    'Cancellation behavior model',
  ];
  const angularCancellationMilestonePositions = angularCancellationMilestones.map((label) =>
    angularCancellationVisibleText.indexOf(normalizeText(label)),
  );
  const angularCancellationOrderIsStable = angularCancellationMilestonePositions.every(
    (position, index) =>
      position >= 0 &&
      (index === 0 || position > angularCancellationMilestonePositions[index - 1]),
  );
  checks.push({
    name: 'Angular interview framing follows the quick answer and precedes the lab',
    ok: angularCancellationOrderIsStable,
    detail: `positions=${angularCancellationMilestonePositions.join(',')}`,
  });

  const missingAngularCancellationResources =
    ANGULAR_HTTP_CANCELLATION_LAB_RESOURCE_ROUTES.filter(
      (route) => !angularCancellationLinks.has(route),
    );
  checks.push({
    name: 'Angular HttpClient cancellation lab has four clean public practice links',
    ok: missingAngularCancellationResources.length === 0,
    detail: missingAngularCancellationResources.length
      ? `missing=${missingAngularCancellationResources.join(', ')}`
      : 'all present',
  });
  const hasAngularCancellationAsyncRaceLink = Array.from(angularCancellationLinks).some((href) => {
    try {
      const url = new URL(href, 'https://frontendatlas.com');
      return url.pathname === '/javascript/trivia/js-async-race-conditions';
    } catch {
      return false;
    }
  });
  checks.push({
    name: 'Angular HttpClient cancellation lab does not confound the active async-race title experiment',
    ok: !hasAngularCancellationAsyncRaceLink,
    detail: hasAngularCancellationAsyncRaceLink ? 'unexpected async-race link present' : 'none present',
  });
  const presentAngularCancellationSources = ANGULAR_HTTP_CANCELLATION_LAB_OFFICIAL_SOURCES.filter(
    (url) => angularCancellationLinks.has(url),
  );
  checks.push({
    name: 'Angular trivia omits the reference-only source review and official-source links',
    ok:
      !/\bsource check\b/i.test(angularCancellationVisibleText) &&
      presentAngularCancellationSources.length === 0,
    detail: presentAngularCancellationSources.length
      ? `present=${presentAngularCancellationSources.join(', ')}`
      : 'none present',
  });
  checks.push({
    name: 'Angular HttpClient cancellation lab JSON-LD parses',
    ok: !angularCancellationJsonLd.error && angularCancellationJsonLd.graph.length > 0,
    detail:
      angularCancellationJsonLd.error || `graph_nodes=${angularCancellationJsonLd.graph.length}`,
  });
  const requiredAngularCancellationSchemaTypes = ['BreadcrumbList', 'Article'];
  const missingAngularCancellationSchemaTypes = requiredAngularCancellationSchemaTypes.filter(
    (type) => !angularCancellationSchemaTypes.includes(type),
  );
  const forbiddenAngularCancellationSchemaTypes = [
    'TechArticle',
    'FAQPage',
    'QAPage',
    'Question',
  ];
  const presentForbiddenAngularCancellationSchemaTypes = forbiddenAngularCancellationSchemaTypes.filter(
    (type) => angularCancellationSchemaTypes.includes(type),
  );
  checks.push({
    name: 'Angular HttpClient cancellation lab uses only supported detail schema',
    ok:
      missingAngularCancellationSchemaTypes.length === 0 &&
      presentForbiddenAngularCancellationSchemaTypes.length === 0,
    detail: `missing=${missingAngularCancellationSchemaTypes.join(', ') || 'none'} forbidden=${
      presentForbiddenAngularCancellationSchemaTypes.join(', ') || 'none'
    }`,
  });
  checks.push({
    name: 'Angular HttpClient cancellation Article declares the shared interview intent',
    ok:
      angularCancellationArticle?.['@id'] === ANGULAR_HTTP_CANCELLATION_LAB_CANONICAL &&
      angularCancellationArticle?.headline ===
        `${ANGULAR_HTTP_CANCELLATION_LAB_H1} - ${TRIVIA_SCHEMA_HEADLINE_SUFFIX}` &&
      angularCancellationArticle?.description === ANGULAR_HTTP_CANCELLATION_LAB_DESCRIPTION &&
      angularCancellationArticle?.datePublished === '2026-01-25T00:00:00.000Z' &&
      schemaDateMatchesSitemap(angularCancellationArticle, ANGULAR_HTTP_CANCELLATION_LAB_ROUTE, sitemapDates) &&
      angularCancellationArticle?.isAccessibleForFree === true &&
      !Object.prototype.hasOwnProperty.call(angularCancellationArticle || {}, 'hasPart') &&
      !Object.prototype.hasOwnProperty.call(angularCancellationArticle || {}, 'citation'),
    detail: `dateModified=${angularCancellationArticle?.dateModified || '(missing)'}`,
  });

  const reactStaleClosuresUrl = `${base}${REACT_STALE_CLOSURES_ROUTE}`;
  const reactStaleClosuresStatus = await curlStatus(reactStaleClosuresUrl, {
    followRedirects: true,
    userAgent: GOOGLEBOT_USER_AGENT,
  });
  const reactStaleClosuresBody = await curlBody(reactStaleClosuresUrl, {
    followRedirects: true,
    userAgent: GOOGLEBOT_USER_AGENT,
  });
  const reactStaleClosuresVisibleText = extractVisibleText(reactStaleClosuresBody);
  const reactStaleClosuresLinks = extractLinkHrefs(reactStaleClosuresBody);
  const reactStaleClosuresAllHrefs = Array.from(
    String(reactStaleClosuresBody).matchAll(/<a\b[^>]*>/gi),
    (match) => extractAttribute(match[0], 'href'),
  ).filter(Boolean);
  const reactStaleClosuresJsonLd = extractSeoJsonLd(reactStaleClosuresBody);
  const reactStaleClosuresArticle = reactStaleClosuresJsonLd.graph.find((node) =>
    hasSchemaType(node, 'Article'),
  );
  const reactStaleClosuresSchemaTypes = reactStaleClosuresJsonLd.graph.flatMap((node) => {
    const type = node?.['@type'];
    return Array.isArray(type) ? type : type ? [type] : [];
  });

  checks.push({
    name: 'Googlebot receives the React stale closure case files as 200',
    ok: reactStaleClosuresStatus === 200,
    detail: `${reactStaleClosuresStatus} ${REACT_STALE_CLOSURES_ROUTE}`,
  });
  checks.push({
    name: 'React stale closure case files have exact search metadata',
    ok:
      extractTitle(reactStaleClosuresBody) === REACT_STALE_CLOSURES_TITLE &&
      extractMetaContent(reactStaleClosuresBody, 'name', 'description') ===
        REACT_STALE_CLOSURES_DESCRIPTION &&
      extractMetaContent(reactStaleClosuresBody, 'property', 'og:title') ===
        REACT_STALE_CLOSURES_TITLE &&
      extractMetaContent(reactStaleClosuresBody, 'property', 'og:description') ===
        REACT_STALE_CLOSURES_DESCRIPTION &&
      extractMetaContent(reactStaleClosuresBody, 'name', 'twitter:title') ===
        REACT_STALE_CLOSURES_TITLE &&
      extractMetaContent(reactStaleClosuresBody, 'name', 'twitter:description') ===
        REACT_STALE_CLOSURES_DESCRIPTION,
    detail: `title=${extractTitle(reactStaleClosuresBody) || '(missing)'}`,
  });
  checks.push({
    name: 'React stale closure case files are self-canonical and indexable',
    ok:
      extractCanonical(reactStaleClosuresBody) === REACT_STALE_CLOSURES_CANONICAL &&
      extractRobots(reactStaleClosuresBody).replace(/\s+/g, '') === 'index,follow',
    detail: `canonical=${extractCanonical(reactStaleClosuresBody) || '(missing)'} robots=${
      extractRobots(reactStaleClosuresBody) || '(missing)'
    }`,
  });
  const reactStaleClosuresH1Count =
    (String(reactStaleClosuresBody).match(/<h1\b/gi) || []).length;
  checks.push({
    name: 'React stale closure case files have one exact H1',
    ok:
      extractH1(reactStaleClosuresBody) === REACT_STALE_CLOSURES_H1 &&
      reactStaleClosuresH1Count === 1,
    detail: `h1=${extractH1(reactStaleClosuresBody) || '(missing)'} count=${reactStaleClosuresH1Count}`,
  });
  checks.push({
    name: 'React stale closure case files expose the visible trust note',
    ok: reactStaleClosuresVisibleText.includes(normalizeText(REACT_STALE_CLOSURES_TRUST_NOTE)),
    detail: reactStaleClosuresVisibleText.includes(normalizeText(REACT_STALE_CLOSURES_TRUST_NOTE))
      ? 'present'
      : 'missing',
  });

  const reactStaleClosuresHeadings = Array.from(
    String(reactStaleClosuresBody).matchAll(/<h([23])\b[^>]*>([\s\S]*?)<\/h\1>/gi),
    (match) => normalizeText(decodeHtml(match[2].replace(/<[^>]+>/g, ' '))),
  );
  const missingReactStaleClosuresHeadings = REACT_STALE_CLOSURES_SECTION_HEADINGS.filter(
    (heading) => !reactStaleClosuresHeadings.includes(normalizeText(heading)),
  );
  const reactStaleClosuresMilestones = [
    'React stale closures: direct answer',
    'Interview focus',
    'Interview answer drill',
    ...REACT_STALE_CLOSURES_SECTION_HEADINGS,
  ];
  const reactStaleClosuresMilestonePositions = reactStaleClosuresMilestones.map((label) =>
    reactStaleClosuresVisibleText.indexOf(normalizeText(label)),
  );
  const reactStaleClosuresOrderIsStable = reactStaleClosuresMilestonePositions.every(
    (position, index) =>
      position >= 0 &&
      (index === 0 || position > reactStaleClosuresMilestonePositions[index - 1]),
  );
  checks.push({
    name: 'React stale closure review sections are semantic and preserve content order',
    ok: missingReactStaleClosuresHeadings.length === 0 && reactStaleClosuresOrderIsStable,
    detail: missingReactStaleClosuresHeadings.length
      ? `missing=${missingReactStaleClosuresHeadings.join(' | ')}`
      : `positions=${reactStaleClosuresMilestonePositions.join(',')}`,
  });

  const missingReactStaleClosureCases = REACT_STALE_CLOSURE_CASE_FILES.filter((caseFile) => {
    const hasTitle = reactStaleClosuresVisibleText.includes(normalizeText(caseFile.title));
    const hasFragment = new RegExp(`\\bid=["']${caseFile.id}["']`, 'i').test(
      reactStaleClosuresBody,
    );
    return !hasTitle || !hasFragment;
  });
  const reactReviewContractCount =
    reactStaleClosuresVisibleText.split('Choose the value-ownership contract').length - 1;
  const reactMinimalDiffCount =
    (String(reactStaleClosuresBody).match(/aria-label=["']minimal code change["']/gi) || []).length;
  const reactProofTestCount =
    reactStaleClosuresVisibleText.split('Proof assertion').length - 1;
  const reactReviewContractsComplete =
    reactReviewContractCount === REACT_STALE_CLOSURE_CASE_FILES.length &&
    reactMinimalDiffCount === REACT_STALE_CLOSURE_CASE_FILES.length &&
    reactProofTestCount === REACT_STALE_CLOSURE_CASE_FILES.length;
  checks.push({
    name: 'React stale closure raw HTML contains six complete PR case files',
    ok: missingReactStaleClosureCases.length === 0 && reactReviewContractsComplete,
    detail:
      missingReactStaleClosureCases.length || !reactReviewContractsComplete
        ? `cases=${missingReactStaleClosureCases.map((item) => item.id).join(',') || 'none'} contracts=${reactReviewContractCount} diffs=${reactMinimalDiffCount} proofs=${reactProofTestCount}`
        : 'all six present',
  });

  const reactCommonMisdiagnosisCount =
    reactStaleClosuresVisibleText.split('Common misdiagnosis').length - 1;
  const reactCaseStarts = REACT_STALE_CLOSURE_CASE_FILES.map((caseFile) => ({
    caseFile,
    index: String(reactStaleClosuresBody).search(
      new RegExp(`\\bid=["']${caseFile.id}["']`, 'i'),
    ),
  }));
  const reactCaseSegments = reactCaseStarts.map(({ caseFile, index }, caseIndex) => {
    const nextIndex = reactCaseStarts[caseIndex + 1]?.index ?? reactStaleClosuresBody.length;
    const markup = index >= 0 && nextIndex > index
      ? reactStaleClosuresBody.slice(index, nextIndex)
      : '';
    return {
      id: caseFile.id,
      markup,
      commonMisdiagnosisCount: extractVisibleText(markup).split('Common misdiagnosis').length - 1,
    };
  });
  const reactCasesWithInvalidMisdiagnosis = reactCaseSegments.filter(
    ({ commonMisdiagnosisCount }) => commonMisdiagnosisCount !== 1,
  );
  checks.push({
    name: 'React stale closure raw HTML exposes one visible Common misdiagnosis per case',
    ok:
      reactCommonMisdiagnosisCount === REACT_STALE_CLOSURE_CASE_FILES.length &&
      reactCasesWithInvalidMisdiagnosis.length === 0,
    detail: reactCasesWithInvalidMisdiagnosis.length
      ? `total=${reactCommonMisdiagnosisCount} invalid=${reactCasesWithInvalidMisdiagnosis
          .map(({ id, commonMisdiagnosisCount }) => `${id}:${commonMisdiagnosisCount}`)
          .join(',')}`
      : `count=${reactCommonMisdiagnosisCount}`,
  });

  const reactAutosaveMarkup =
    reactCaseSegments.find(({ id }) => id === 'pr-debounced-autosave')?.markup || '';
  const compactReactAutosaveText = extractVisibleText(reactAutosaveMarkup).replace(/\s+/g, '');
  const reactAutosaveProofSteps = [
    'unmount();',
    'advanceTimersByTime(300);',
    "expect(onSave).not.toHaveBeenCalledWith('draftC');",
  ];
  let reactAutosaveProofCursor = -1;
  const reactAutosaveProofPositions = reactAutosaveProofSteps.map((step) => {
    const position = compactReactAutosaveText.indexOf(step, reactAutosaveProofCursor + 1);
    reactAutosaveProofCursor = position;
    return position;
  });
  const reactAutosaveProofIsOrdered = reactAutosaveProofPositions.every(
    (position, index) =>
      position >= 0 && (index === 0 || position > reactAutosaveProofPositions[index - 1]),
  );
  checks.push({
    name: 'React debounced autosave raw patch cancels on unmount and proves pending work cannot save',
    ok:
      compactReactAutosaveText.includes('saveLater.cancel()') && reactAutosaveProofIsOrdered,
    detail: `cancel=${compactReactAutosaveText.includes('saveLater.cancel()')} proof_positions=${reactAutosaveProofPositions.join(',')}`,
  });

  const reactAsyncRaceLinks = reactStaleClosuresAllHrefs.filter((href) => {
    try {
      return new URL(href, 'https://frontendatlas.com').pathname === ASYNC_RACE_ROUTE;
    } catch {
      return false;
    }
  });
  checks.push({
    name: 'React stale closure case files preserve exactly one clean async-race bridge',
    ok: reactAsyncRaceLinks.length === 1 && reactAsyncRaceLinks[0] === ASYNC_RACE_ROUTE,
    detail: reactAsyncRaceLinks.length ? reactAsyncRaceLinks.join(',') : 'missing',
  });
  const presentReactStaleClosureSources = REACT_STALE_CLOSURES_OFFICIAL_SOURCES.filter(
    (url) => reactStaleClosuresLinks.has(url),
  );
  checks.push({
    name: 'React trivia omits the reference-only source review and official-source links',
    ok:
      !/\bsource check\b/i.test(reactStaleClosuresVisibleText) &&
      presentReactStaleClosureSources.length === 0,
    detail: presentReactStaleClosureSources.length
      ? `present=${presentReactStaleClosureSources.join(', ')}`
      : 'none present',
  });

  const requiredReactStaleClosureSchemaTypes = ['BreadcrumbList', 'Article'];
  const missingReactStaleClosureSchemaTypes = requiredReactStaleClosureSchemaTypes.filter(
    (type) => !reactStaleClosuresSchemaTypes.includes(type),
  );
  const forbiddenReactStaleClosureSchemaTypes = [
    'TechArticle',
    'FAQPage',
    'QAPage',
    'Question',
    'Quiz',
  ];
  const presentForbiddenReactStaleClosureSchemaTypes = forbiddenReactStaleClosureSchemaTypes.filter(
    (type) => reactStaleClosuresSchemaTypes.includes(type),
  );
  checks.push({
    name: 'React stale closure case files use only supported detail schema',
    ok:
      !reactStaleClosuresJsonLd.error &&
      missingReactStaleClosureSchemaTypes.length === 0 &&
      presentForbiddenReactStaleClosureSchemaTypes.length === 0,
    detail:
      reactStaleClosuresJsonLd.error ||
      `missing=${missingReactStaleClosureSchemaTypes.join(',') || 'none'} forbidden=${
        presentForbiddenReactStaleClosureSchemaTypes.join(',') || 'none'
      }`,
  });

  checks.push({
    name: 'React stale closure Article declares the shared interview intent',
    ok:
      reactStaleClosuresArticle?.['@id'] === REACT_STALE_CLOSURES_CANONICAL &&
      reactStaleClosuresArticle?.headline ===
        `${REACT_STALE_CLOSURES_H1} - ${TRIVIA_SCHEMA_HEADLINE_SUFFIX}` &&
      reactStaleClosuresArticle?.description === REACT_STALE_CLOSURES_DESCRIPTION &&
      reactStaleClosuresArticle?.datePublished === '2026-01-25T00:00:00.000Z' &&
      schemaDateMatchesSitemap(reactStaleClosuresArticle, REACT_STALE_CLOSURES_ROUTE, sitemapDates) &&
      reactStaleClosuresArticle?.isAccessibleForFree === true &&
      !Object.prototype.hasOwnProperty.call(reactStaleClosuresArticle || {}, 'hasPart') &&
      !Object.prototype.hasOwnProperty.call(reactStaleClosuresArticle || {}, 'citation'),
    detail: `dateModified=${reactStaleClosuresArticle?.dateModified || '(missing)'}`,
  });

  const googleUrl = `${base}${GOOGLE_PREVIEW_ROUTE}`;
  const googleCurlOptions = { followRedirects: true, userAgent: GOOGLEBOT_USER_AGENT };
  const googleStatus = await curlStatus(googleUrl, googleCurlOptions);
  const googleBody = await curlBody(googleUrl, googleCurlOptions);
  const googleTitle = extractTitle(googleBody);
  const googleDescription = extractMetaContent(googleBody, 'name', 'description');
  const googleCanonical = extractCanonical(googleBody);
  const googleRobots = extractRobots(googleBody);
  const googleH1 = extractH1(googleBody);
  const googleVisibleText = extractVisibleText(googleBody);
  const googleInternalLinks = extractInternalLinkPaths(googleBody);
  const googleJsonLd = extractSeoJsonLd(googleBody);
  const googleCollectionPage = googleJsonLd.graph.find((node) => hasSchemaType(node, 'CollectionPage'));
  const googleBreadcrumbs = googleJsonLd.graph.find((node) => hasSchemaType(node, 'BreadcrumbList'));
  const googleItemList = googleJsonLd.graph.find((node) => hasSchemaType(node, 'ItemList'));
  const googleListItems = Array.isArray(googleItemList?.itemListElement)
    ? googleItemList.itemListElement
    : [];

  checks.push({
    name: 'Googlebot receives Google company preview as 200',
    ok: googleStatus === 200,
    detail: `${googleStatus} ${GOOGLE_PREVIEW_ROUTE}`,
  });
  checks.push({
    name: 'Google company preview has exact title',
    ok: googleTitle === GOOGLE_PREVIEW_TITLE,
    detail: `title=${googleTitle || '(missing)'}`,
  });
  checks.push({
    name: 'Google company preview has exact description',
    ok: googleDescription === GOOGLE_PREVIEW_DESCRIPTION,
    detail: `description=${googleDescription || '(missing)'}`,
  });
  checks.push({
    name: 'Google company preview mirrors exact Open Graph metadata',
    ok:
      extractMetaContent(googleBody, 'property', 'og:title') === GOOGLE_PREVIEW_TITLE &&
      extractMetaContent(googleBody, 'property', 'og:description') === GOOGLE_PREVIEW_DESCRIPTION,
    detail: `og:title=${extractMetaContent(googleBody, 'property', 'og:title') || '(missing)'}`,
  });
  checks.push({
    name: 'Google company preview mirrors exact Twitter metadata',
    ok:
      extractMetaContent(googleBody, 'name', 'twitter:title') === GOOGLE_PREVIEW_TITLE &&
      extractMetaContent(googleBody, 'name', 'twitter:description') === GOOGLE_PREVIEW_DESCRIPTION,
    detail: `twitter:title=${extractMetaContent(googleBody, 'name', 'twitter:title') || '(missing)'}`,
  });
  checks.push({
    name: 'Google company preview canonical is self-referential',
    ok: googleCanonical === GOOGLE_PREVIEW_CANONICAL,
    detail: `canonical=${googleCanonical || '(missing)'}`,
  });
  checks.push({
    name: 'Google company preview robots is index,follow',
    ok: googleRobots.replace(/\s+/g, '') === 'index,follow',
    detail: `robots=${googleRobots || '(missing)'}`,
  });
  checks.push({
    name: 'Google company preview has exact h1',
    ok: googleH1 === GOOGLE_PREVIEW_H1,
    detail: `h1=${googleH1 || '(missing)'}`,
  });

  const missingGoogleHeadings = GOOGLE_PREVIEW_HEADINGS.filter(
    (heading) => !googleVisibleText.includes(normalizeText(heading)),
  );
  checks.push({
    name: 'Google company preview core guide sections are present in raw HTML',
    ok: missingGoogleHeadings.length === 0,
    detail: missingGoogleHeadings.length ? `missing=${missingGoogleHeadings.join(' | ')}` : 'all present',
  });
  checks.push({
    name: 'Google company preview trust note is present in raw HTML',
    ok: googleVisibleText.includes(normalizeText(GOOGLE_PREVIEW_TRUST_NOTE)),
    detail: googleVisibleText.includes(normalizeText(GOOGLE_PREVIEW_TRUST_NOTE)) ? 'present' : 'missing',
  });

  const missingGooglePrompts = GOOGLE_PREVIEW_PROMPTS.filter(
    (prompt) => !googleVisibleText.includes(normalizeText(prompt.title)),
  );
  checks.push({
    name: 'Google company preview prompt titles are visible in raw HTML',
    ok: missingGooglePrompts.length === 0,
    detail: missingGooglePrompts.length
      ? `missing=${missingGooglePrompts.map((prompt) => prompt.title).join(' | ')}`
      : 'all seven present',
  });

  const missingGoogleResourceLinks = GOOGLE_PREVIEW_RESOURCE_ROUTES.filter(
    (route) => !googleInternalLinks.has(route),
  );
  checks.push({
    name: 'Google company preview has all contextual public resource links in raw HTML',
    ok: missingGoogleResourceLinks.length === 0,
    detail: missingGoogleResourceLinks.length
      ? `missing=${missingGoogleResourceLinks.join(', ')}`
      : 'all eight present',
  });

  checks.push({
    name: 'Google company preview JSON-LD parses',
    ok: !googleJsonLd.error && googleJsonLd.graph.length > 0,
    detail: googleJsonLd.error || `graph_nodes=${googleJsonLd.graph.length}`,
  });
  const requiredGoogleSchemaTypes = [
    'Organization',
    'WebSite',
    'CollectionPage',
    'BreadcrumbList',
    'ItemList',
  ];
  const missingGoogleSchemaTypes = requiredGoogleSchemaTypes.filter(
    (type) => !googleJsonLd.graph.some((node) => hasSchemaType(node, type)),
  );
  checks.push({
    name: 'Google company preview has the required top-level schema graph',
    ok: missingGoogleSchemaTypes.length === 0,
    detail: missingGoogleSchemaTypes.length ? `missing=${missingGoogleSchemaTypes.join(', ')}` : 'all present',
  });

  const googleListMatchesVisiblePrompts = GOOGLE_PREVIEW_PROMPTS.every((prompt, index) => {
    const item = googleListItems[index];
    return (
      item?.position === index + 1 &&
      item?.name === prompt.title &&
      item?.url === `${GOOGLE_PREVIEW_CANONICAL}#${prompt.id}`
    );
  });
  checks.push({
    name: 'Google company preview ItemList matches all seven visible prompts',
    ok: googleListItems.length === 7 && googleListMatchesVisiblePrompts,
    detail: `item_count=${googleListItems.length}`,
  });
  checks.push({
    name: 'Google company preview CollectionPage references the top-level ItemList',
    ok:
      Boolean(googleCollectionPage?.mainEntity?.['@id']) &&
      googleCollectionPage?.mainEntity?.['@id'] === googleItemList?.['@id'],
    detail: `mainEntity=${googleCollectionPage?.mainEntity?.['@id'] || '(missing)'}`,
  });
  checks.push({
    name: 'Google company preview CollectionPage declares free access and the sitemap modification date',
    ok:
      googleCollectionPage?.isAccessibleForFree === true &&
      schemaDateMatchesSitemap(googleCollectionPage, GOOGLE_PREVIEW_ROUTE, sitemapDates),
    detail: `dateModified=${googleCollectionPage?.dateModified || '(missing)'}`,
  });
  const googleBreadcrumbItems = Array.isArray(googleBreadcrumbs?.itemListElement)
    ? googleBreadcrumbs.itemListElement
    : [];
  checks.push({
    name: 'Google company preview BreadcrumbList ends at the canonical page',
    ok:
      googleBreadcrumbItems.length === 3 &&
      googleBreadcrumbItems[2]?.name === GOOGLE_PREVIEW_H1 &&
      googleBreadcrumbItems[2]?.item === GOOGLE_PREVIEW_CANONICAL,
    detail: `item_count=${googleBreadcrumbItems.length}`,
  });

  const netflixUrl = `${base}${NETFLIX_PREVIEW_ROUTE}`;
  const netflixCurlOptions = { followRedirects: true, userAgent: GOOGLEBOT_USER_AGENT };
  const netflixStatus = await curlStatus(netflixUrl, netflixCurlOptions);
  const netflixBody = await curlBody(netflixUrl, netflixCurlOptions);
  const netflixTitle = extractTitle(netflixBody);
  const netflixDescription = extractMetaContent(netflixBody, 'name', 'description');
  const netflixCanonical = extractCanonical(netflixBody);
  const netflixRobots = extractRobots(netflixBody);
  const netflixH1 = extractH1(netflixBody);
  const netflixVisibleText = extractVisibleText(netflixBody);
  const netflixInternalLinks = extractInternalLinkPaths(netflixBody);
  const netflixJsonLd = extractSeoJsonLd(netflixBody);
  const netflixCollectionPage = netflixJsonLd.graph.find((node) =>
    hasSchemaType(node, 'CollectionPage'));
  const netflixBreadcrumbs = netflixJsonLd.graph.find((node) =>
    hasSchemaType(node, 'BreadcrumbList'));
  const netflixItemList = netflixJsonLd.graph.find((node) => hasSchemaType(node, 'ItemList'));
  const netflixListItems = Array.isArray(netflixItemList?.itemListElement)
    ? netflixItemList.itemListElement
    : [];

  checks.push({
    name: 'Googlebot receives Netflix company preview as 200',
    ok: netflixStatus === 200,
    detail: `${netflixStatus} ${NETFLIX_PREVIEW_ROUTE}`,
  });
  checks.push({
    name: 'Netflix company preview has exact title',
    ok: netflixTitle === NETFLIX_PREVIEW_TITLE,
    detail: `title=${netflixTitle || '(missing)'}`,
  });
  checks.push({
    name: 'Netflix company preview has exact description',
    ok: netflixDescription === NETFLIX_PREVIEW_DESCRIPTION,
    detail: `description=${netflixDescription || '(missing)'}`,
  });
  checks.push({
    name: 'Netflix company preview mirrors exact Open Graph metadata',
    ok:
      extractMetaContent(netflixBody, 'property', 'og:title') === NETFLIX_PREVIEW_TITLE &&
      extractMetaContent(netflixBody, 'property', 'og:description') === NETFLIX_PREVIEW_DESCRIPTION,
    detail: `og:title=${extractMetaContent(netflixBody, 'property', 'og:title') || '(missing)'}`,
  });
  checks.push({
    name: 'Netflix company preview mirrors exact Twitter metadata',
    ok:
      extractMetaContent(netflixBody, 'name', 'twitter:title') === NETFLIX_PREVIEW_TITLE &&
      extractMetaContent(netflixBody, 'name', 'twitter:description') === NETFLIX_PREVIEW_DESCRIPTION,
    detail: `twitter:title=${extractMetaContent(netflixBody, 'name', 'twitter:title') || '(missing)'}`,
  });
  checks.push({
    name: 'Netflix company preview canonical is self-referential',
    ok: netflixCanonical === NETFLIX_PREVIEW_CANONICAL,
    detail: `canonical=${netflixCanonical || '(missing)'}`,
  });
  checks.push({
    name: 'Netflix company preview robots is index,follow',
    ok: netflixRobots.replace(/\s+/g, '') === 'index,follow',
    detail: `robots=${netflixRobots || '(missing)'}`,
  });
  checks.push({
    name: 'Netflix company preview has exact h1',
    ok: netflixH1 === NETFLIX_PREVIEW_H1,
    detail: `h1=${netflixH1 || '(missing)'}`,
  });

  const missingNetflixHeadings = NETFLIX_PREVIEW_HEADINGS.filter(
    (heading) => !netflixVisibleText.includes(normalizeText(heading)),
  );
  checks.push({
    name: 'Netflix company preview core guide sections are present in raw HTML',
    ok: missingNetflixHeadings.length === 0,
    detail: missingNetflixHeadings.length
      ? `missing=${missingNetflixHeadings.join(' | ')}`
      : 'all present',
  });
  checks.push({
    name: 'Netflix company preview trust note is present in raw HTML',
    ok: netflixVisibleText.includes(normalizeText(NETFLIX_PREVIEW_TRUST_NOTE)),
    detail: netflixVisibleText.includes(normalizeText(NETFLIX_PREVIEW_TRUST_NOTE))
      ? 'present'
      : 'missing',
  });

  const missingNetflixPrompts = NETFLIX_PREVIEW_PROMPTS.filter(
    (prompt) => !netflixVisibleText.includes(normalizeText(prompt.title)),
  );
  checks.push({
    name: 'Netflix company preview prompt titles are visible in raw HTML',
    ok: missingNetflixPrompts.length === 0,
    detail: missingNetflixPrompts.length
      ? `missing=${missingNetflixPrompts.map((prompt) => prompt.title).join(' | ')}`
      : 'all six present',
  });

  const missingNetflixResourceLinks = NETFLIX_PREVIEW_RESOURCE_ROUTES.filter(
    (route) => !netflixInternalLinks.has(route),
  );
  checks.push({
    name: 'Netflix company preview has all contextual public resource links in raw HTML',
    ok: missingNetflixResourceLinks.length === 0,
    detail: missingNetflixResourceLinks.length
      ? `missing=${missingNetflixResourceLinks.join(', ')}`
      : 'all eight present',
  });

  checks.push({
    name: 'Netflix company preview JSON-LD parses',
    ok: !netflixJsonLd.error && netflixJsonLd.graph.length > 0,
    detail: netflixJsonLd.error || `graph_nodes=${netflixJsonLd.graph.length}`,
  });
  const requiredNetflixSchemaTypes = [
    'Organization',
    'WebSite',
    'CollectionPage',
    'BreadcrumbList',
    'ItemList',
  ];
  const missingNetflixSchemaTypes = requiredNetflixSchemaTypes.filter(
    (type) => !netflixJsonLd.graph.some((node) => hasSchemaType(node, type)),
  );
  checks.push({
    name: 'Netflix company preview has the required top-level schema graph',
    ok: missingNetflixSchemaTypes.length === 0,
    detail: missingNetflixSchemaTypes.length
      ? `missing=${missingNetflixSchemaTypes.join(', ')}`
      : 'all present',
  });
  const forbiddenNetflixSchemaTypes = ['FAQPage', 'QAPage', 'JobPosting', 'PracticeProblem'];
  const presentForbiddenNetflixSchemaTypes = forbiddenNetflixSchemaTypes.filter(
    (type) => netflixJsonLd.graph.some((node) => hasSchemaType(node, type)),
  );
  checks.push({
    name: 'Netflix company preview avoids unsupported rich-result schema',
    ok: presentForbiddenNetflixSchemaTypes.length === 0,
    detail: presentForbiddenNetflixSchemaTypes.length
      ? `present=${presentForbiddenNetflixSchemaTypes.join(', ')}`
      : 'none present',
  });

  const netflixListMatchesVisiblePrompts = NETFLIX_PREVIEW_PROMPTS.every((prompt, index) => {
    const item = netflixListItems[index];
    return (
      item?.position === index + 1 &&
      item?.name === prompt.title &&
      item?.url === `${NETFLIX_PREVIEW_CANONICAL}#${prompt.id}`
    );
  });
  checks.push({
    name: 'Netflix company preview ItemList matches all six visible prompts',
    ok: netflixListItems.length === 6 && netflixListMatchesVisiblePrompts,
    detail: `item_count=${netflixListItems.length}`,
  });
  checks.push({
    name: 'Netflix company preview CollectionPage references the top-level ItemList',
    ok:
      Boolean(netflixCollectionPage?.mainEntity?.['@id']) &&
      netflixCollectionPage?.mainEntity?.['@id'] === netflixItemList?.['@id'],
    detail: `mainEntity=${netflixCollectionPage?.mainEntity?.['@id'] || '(missing)'}`,
  });
  checks.push({
    name: 'Netflix company preview CollectionPage declares free access and the sitemap modification date',
    ok:
      netflixCollectionPage?.isAccessibleForFree === true &&
      schemaDateMatchesSitemap(netflixCollectionPage, NETFLIX_PREVIEW_ROUTE, sitemapDates),
    detail: `dateModified=${netflixCollectionPage?.dateModified || '(missing)'}`,
  });
  const netflixBreadcrumbItems = Array.isArray(netflixBreadcrumbs?.itemListElement)
    ? netflixBreadcrumbs.itemListElement
    : [];
  checks.push({
    name: 'Netflix company preview BreadcrumbList ends at the canonical page',
    ok:
      netflixBreadcrumbItems.length === 3 &&
      netflixBreadcrumbItems[2]?.name === NETFLIX_PREVIEW_H1 &&
      netflixBreadcrumbItems[2]?.item === NETFLIX_PREVIEW_CANONICAL,
    detail: `item_count=${netflixBreadcrumbItems.length}`,
  });

  const OFFICIAL_GUIDE_SMOKE = [
    {
      label: 'Amazon',
      route: '/companies/amazon/preview',
      heading: 'Official preparation pages from Amazon',
      link: 'https://amazon.jobs/content/en/how-we-hire/fee-interview-prep',
    },
    {
      label: 'Google',
      route: '/companies/google/preview',
      heading: 'Official preparation pages from Google',
      link: 'https://www.google.com/about/careers/applications/interview-tips',
    },
  ];
  for (const guide of OFFICIAL_GUIDE_SMOKE) {
    const body = await curlBody(`${base}${guide.route}`, { followRedirects: true, userAgent: GOOGLEBOT_USER_AGENT });
    const visibleText = extractVisibleText(body);
    const hasHeading = visibleText.includes(normalizeText(guide.heading));
    const hasLink = body.includes(`href="${guide.link}"`);
    checks.push({
      name: `${guide.label} company preview renders the official preparation pages table in raw HTML`,
      ok: hasHeading && hasLink,
      detail: `heading=${hasHeading} link=${hasLink}`,
    });
  }
  {
    const body = await curlBody(`${base}/companies/apple/preview`, { followRedirects: true, userAgent: GOOGLEBOT_USER_AGENT });
    const leaked = extractVisibleText(body).includes(normalizeText('Official preparation pages from'));
    checks.push({
      name: 'Apple company preview has no official preparation pages table',
      ok: !leaked,
      detail: leaked ? 'table rendered without data' : 'absent',
    });
  }

  {
    const bytedanceBody = await curlBody(`${base}/companies/bytedance/preview`, { followRedirects: true, userAgent: GOOGLEBOT_USER_AGENT });
    const bytedanceText = extractVisibleText(bytedanceBody);
    const hasBlock = bytedanceText.includes(normalizeText('Practice items with public ByteDance interview accounts'));
    const hasReportLink = bytedanceBody.includes('href="https://www.teamblind.com/post/bytedance-new-grad-frontend-engineer-interview-breakdown-vqyvjs1l"');
    const hasItemLink = bytedanceBody.includes('href="/javascript/coding/js-build-tree-from-flat-list"');
    checks.push({
      name: 'ByteDance company preview renders the public interview reports block with item and report links',
      ok: hasBlock && hasReportLink && hasItemLink,
      detail: `block=${hasBlock} reportLink=${hasReportLink} itemLink=${hasItemLink}`,
    });
    const microsoftBody = await curlBody(`${base}/companies/microsoft/preview`, { followRedirects: true, userAgent: GOOGLEBOT_USER_AGENT });
    const leaked = extractVisibleText(microsoftBody).includes(normalizeText('Practice items with public'));
    checks.push({
      name: 'Microsoft company preview has no public interview reports block',
      ok: !leaked,
      detail: leaked ? 'block rendered without sourced items' : 'absent',
    });
  }

  for (const guide of AUTHORED_GUIDE_SMOKE) {
    const guideUrl = `${base}${guide.route}`;
    const guideCanonical = `https://frontendatlas.com${guide.route}`;
    const curlOptions = { followRedirects: true, userAgent: GOOGLEBOT_USER_AGENT };
    const status = await curlStatus(guideUrl, curlOptions);
    const body = await curlBody(guideUrl, curlOptions);
    const visibleText = extractVisibleText(body);
    const jsonLd = extractSeoJsonLd(body);
    const collectionPage = jsonLd.graph.find((node) => hasSchemaType(node, 'CollectionPage'));
    const itemList = jsonLd.graph.find((node) => hasSchemaType(node, 'ItemList'));
    const breadcrumbs = jsonLd.graph.find((node) => hasSchemaType(node, 'BreadcrumbList'));
    const listItems = Array.isArray(itemList?.itemListElement) ? itemList.itemListElement : [];
    const breadcrumbItems = Array.isArray(breadcrumbs?.itemListElement) ? breadcrumbs.itemListElement : [];
    const missingHeadings = guide.headings.filter((heading) => !visibleText.includes(heading));
    checks.push({
      name: `Googlebot receives ${guide.label} company preview as 200`,
      ok: status === 200,
      detail: `${status} ${guide.route}`,
    });
    checks.push({
      name: `${guide.label} company preview has exact title, description, canonical, robots and H1`,
      ok:
        extractTitle(body) === guide.title &&
        extractMetaContent(body, 'name', 'description') === guide.description &&
        extractCanonical(body) === guideCanonical &&
        String(extractRobots(body) || '').replace(/\s+/g, '') === 'index,follow' &&
        extractH1(body) === guide.h1,
      detail: `title=${extractTitle(body) || '(missing)'} h1=${extractH1(body) || '(missing)'}`,
    });
    checks.push({
      name: `${guide.label} company preview renders every guide section heading and the trust note`,
      ok: missingHeadings.length === 0 && visibleText.includes(guide.trustFragment),
      detail: missingHeadings.length ? `missing=${missingHeadings.join(' | ')}` : 'all headings present',
    });
    checks.push({
      name: `${guide.label} company preview ItemList matches all ${guide.prompts.length} visible prompts`,
      ok:
        listItems.length === guide.prompts.length &&
        guide.prompts.every((prompt, index) =>
          listItems[index]?.position === index + 1 &&
          listItems[index]?.name === prompt.title &&
          listItems[index]?.url === `${guideCanonical}#${prompt.id}`),
      detail: `item_count=${listItems.length}`,
    });
    checks.push({
      name: `${guide.label} company preview CollectionPage references the ItemList, declares free access and matches the sitemap date`,
      ok:
        Boolean(collectionPage?.mainEntity?.['@id']) &&
        collectionPage?.mainEntity?.['@id'] === itemList?.['@id'] &&
        collectionPage?.isAccessibleForFree === true &&
        schemaDateMatchesSitemap(collectionPage, guide.route, sitemapDates),
      detail: `mainEntity=${collectionPage?.mainEntity?.['@id'] || '(missing)'} dateModified=${collectionPage?.dateModified || '(missing)'}`,
    });
    checks.push({
      name: `${guide.label} company preview BreadcrumbList ends at the canonical page`,
      ok:
        breadcrumbItems.length === 3 &&
        breadcrumbItems[2]?.name === guide.h1 &&
        breadcrumbItems[2]?.item === guideCanonical,
      detail: `item_count=${breadcrumbItems.length}`,
    });
    checks.push({
      name: `${guide.label} company preview links its practice pages without catalog leakage`,
      ok:
        guide.resources.slice(0, 2).every((link) => body.includes(`href="${link}"`)) &&
        !visibleText.includes('Sample FrontendAtlas practice prompts') &&
        !visibleText.includes('Try free challenge'),
      detail: 'practice links present, catalog markup absent',
    });
  }

  for (const note of EDITORIAL_NOTE_SMOKE) {
    const body = await curlBody(`${base}${note.route}`, { followRedirects: true, userAgent: GOOGLEBOT_USER_AGENT });
    const visibleText = extractVisibleText(body);
    const jsonLd = extractSeoJsonLd(body);
    const collectionPage = jsonLd.graph.find((node) => hasSchemaType(node, 'CollectionPage'));
    const titleOk = extractTitle(body) === note.title;
    const headingsOk = [note.h1, ...note.headings].every((heading) => visibleText.includes(normalizeText(heading)));
    const catalogOk = visibleText.includes(normalizeText('What you can do now for free')) && body.includes(`href="${note.practicePath}"`);
    const schemaOk = Boolean(collectionPage?.dateModified) && !jsonLd.graph.some((node) => hasSchemaType(node, 'FAQPage'));
    checks.push({
      name: `${note.label} company preview renders its editorial notes around the catalog blocks with a dated CollectionPage`,
      ok: titleOk && headingsOk && catalogOk && schemaOk,
      detail: `title=${titleOk} headings=${headingsOk} catalog=${catalogOk} schema=${schemaOk}`,
    });
  }

  let failed = 0;
  for (const check of checks) {
    const status = check.ok ? 'PASS' : 'FAIL';
    console.log(`[seo:smoke] ${status} ${check.name} (${check.detail})`);
    if (!check.ok) failed += 1;
  }

  if (failed > 0) process.exit(1);
} finally {
  if (server) {
    await server.close();
  }
}
