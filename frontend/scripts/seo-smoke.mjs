#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { cdnQuestionsDir, cdnSystemDesignIndexPath, generatedAppDir, srcPrerenderRoutesPath } from './content-paths.mjs';
import { loadTsModule } from './load-ts-module.mjs';
import { startSeoStaticServer } from './seo-static-server.mjs';
import { marksPremiumParts, premiumLockViolations } from './seo-premium-lock-contract.mjs';
import { loadSitemapDateMap, schemaDateMatchesSitemap } from './seo-sitemap-date-contract.mjs';

const BUILD_DIR = path.resolve(process.env.SEO_BUILD_DIR || 'dist/frontendatlas/browser');
const HOST = process.env.SEO_SERVER_HOST || '127.0.0.1';
const PORT = Number(process.env.SEO_SERVER_PORT || 4173);
const SAMPLE_GUIDE_ROUTE = '/guides/interview-blueprint/intro';
const GOOGLE_PREVIEW_ROUTE = '/companies/google/preview';
const GOOGLE_PREVIEW_CANONICAL = `https://frontendatlas.com${GOOGLE_PREVIEW_ROUTE}`;
const GOOGLE_PREVIEW_TITLE = 'Google Frontend Interview Questions: 24 Reported + Prep Guide';
const GOOGLE_PREVIEW_DESCRIPTION =
  'Google frontend interview: the screens, the loop and the Googleyness round explained, with 24 reported questions and the behavioural questions asked.';
const GOOGLE_PREVIEW_H1 = 'Google Frontend Interview Questions';
const GOOGLEBOT_USER_AGENT = 'Googlebot';
const TRIVIA_SCHEMA_HEADLINE_SUFFIX = 'Frontend interview practice question';
const TRIVIA_REQUIRED_SCHEMA_TYPES = ['BreadcrumbList', 'Article'];
const TRIVIA_FORBIDDEN_SCHEMA_TYPES = ['TechArticle', 'FAQPage', 'QAPage', 'Question', 'Quiz'];
const GOOGLE_PREVIEW_HEADINGS = [
  'What to study first for a Google frontend interview',
  'questions candidates reported',
  'Walk through the open question: a depth-first walk over HTML nodes',
  'A 7-day Google frontend interview preparation plan',
  'Common Google frontend interview preparation questions',
  'Free public practice',
  'Sources (',
];
const GOOGLE_PREVIEW_TRUST_NOTE = 'We reworded each one, and Google has confirmed none.';
// The free practice list. The reported-question list replaced the prompt cards and their ItemList.
const GOOGLE_PREVIEW_RESOURCE_ROUTES = [
  '/javascript/coding/js-get-by-path-1',
  '/javascript/coding/js-build-tree-from-flat-list',
  '/html/trivia/html-dom-tree-structure',
  '/javascript/trivia/js-event-delegation',
  '/javascript/trivia/js-compare-two-objects',
];
const NETFLIX_PREVIEW_ROUTE = '/companies/netflix/preview';
const NETFLIX_PREVIEW_CANONICAL = `https://frontendatlas.com${NETFLIX_PREVIEW_ROUTE}`;
const NETFLIX_PREVIEW_TITLE = 'Netflix Frontend and UI Engineer Interview Questions: 13 Reported';
const NETFLIX_PREVIEW_DESCRIPTION =
  'Netflix frontend and UI interview: recruiter and manager calls, a live screen or a take-home, the onsite, and 13 questions candidates reported.';
const NETFLIX_PREVIEW_H1 = 'Netflix Frontend Interview Questions';
const NETFLIX_PREVIEW_HEADINGS = [
  'questions candidates reported',
  'Netflix culture interview for frontend engineers: what the memo asks for and what was asked',
  'Three Netflix engineering groups to practise against',
  'Walk through filtering API results as the user types',
  'A 7-day Netflix frontend interview preparation plan',
  'Common Netflix frontend interview preparation questions',
  'Build the underlying skills with free practice',
  'Sources (',
];
const NETFLIX_PREVIEW_TRUST_NOTE = 'Netflix has confirmed none of them.';
// The free practice list. The reported-question list replaced the prompt cards and their ItemList.
const NETFLIX_PREVIEW_RESOURCE_ROUTES = [
  '/javascript/coding/js-debounce',
  '/javascript/trivia/debounce-vs-throttle-search-input',
  '/javascript/coding/js-take-latest',
  '/javascript/trivia/js-closures',
  '/guides/behavioral/stories',
];
const AUTHORED_GUIDE_SMOKE = [
  {
    label: 'Waymo',
    route: '/companies/waymo/preview',
    title: 'Waymo Frontend Interview Questions: 6 Reported + Prep Guide',
    description:
      'Prepare for a Waymo frontend interview with 6 reported questions from 2026 reports: the tree filter screen, Angular debugging and a four-round onsite.',
    h1: 'Waymo Frontend Interview Questions',
    kicker: 'Public Waymo prep guide',
    headings: [
      'Prepare for product judgment, not Waymo trivia',
      'What these Waymo accounts show, and what they leave to the recruiter',
      'questions candidates reported',
      'Scope the tree filter before writing the first line',
      'A 7-day Waymo frontend interview preparation plan',
      'Common Waymo frontend interview preparation questions',
      'Build the underlying skills with free practice',
      'Sources (',
    ],
    trustFragment: 'not leaked, confirmed or official Waymo questions',
    resources: [
      '/javascript/coding/js-filter-tree-render-indented',
      '/javascript/coding/js-take-latest',
      '/angular/trivia/angular-http-what-actually-cancels-request',
      '/angular/trivia/angular-onpush-change-detection-debugging-real-bug',
    ],
    reportUrl:
      'https://prachub.com/interview-experiences/waymo-senior-frontend-engineer-interview-experience-rejected-30-minutes-after-pushing-on-the-process',
  },
  {
    label: 'ElevenLabs',
    route: '/companies/elevenlabs/preview',
    title: 'ElevenLabs Frontend Interview Questions and Coding Assessment Guide',
    description:
      'ElevenLabs frontend interview: the coding assessment (a 90-minute test, often on CoderPad, or a take-home), the live technical round and 19 reported questions.',
    h1: 'ElevenLabs Frontend Interview Questions',
    kicker: 'Public ElevenLabs prep guide',
    headings: [
      'Prepare for product judgment, not ElevenLabs trivia',
      'What these accounts can tell you, and what to ask the recruiter',
      'ElevenLabs coding assessment and live technical round: how each one runs',
      'questions candidates reported',
      'Scope the transcript highlight before writing the first line',
      'A 7-day ElevenLabs frontend interview preparation plan',
      'Common ElevenLabs frontend interview preparation questions',
      'Build the underlying skills with free practice',
      'Sources (',
    ],
    trustFragment: 'not leaked, confirmed or official ElevenLabs questions',
    // The reported-question list replaces the prompt cards: its locked rows are the Premium part, and no ItemList
    // names them. The sources sit closed at the end, linked only for an account.
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
    title: 'Datadog Frontend Interview Questions: 19 Reported + Prep Guide',
    description:
      'Datadog frontend interview: the CoderPad algorithm screen, React live coding, the take-home, frontend system design on Excalidraw and 19 reported questions.',
    h1: 'Datadog Frontend Interview Questions',
    kicker: 'Public Datadog prep guide',
    headings: [
      'What Datadog frontend loops reward: tables of moving data, and algorithms done cleanly',
      'Who wrote these Datadog accounts, and what they leave out',
      'questions candidates reported',
      'Scope the sortable real-time table before writing the first line',
      'A 7-day Datadog frontend interview preparation plan',
      'Common Datadog frontend interview preparation questions',
      'Free practice for the Datadog rounds',
      'Sources (',
    ],
    trustFragment: 'most from senior frontend loops in France, Spain and Portugal',
    resources: [
      '/react/coding/react-fetch-list-states',
      '/react/trivia/react-keys-in-lists',
      '/react/trivia/react-derived-state-anti-pattern',
      '/guides/interview-blueprint/dsa-for-fe',
      '/guides/system-design-blueprint/performance',
      '/guides/behavioral/stories',
    ],
    reportUrl:
      'https://www.jointaro.com/interviews/companies/datadog/experiences/senior-frontend-developer-valbonne-october-1-2024-accepted-offer-positive-47d59048/',
  },
  {
    label: 'Intuit',
    route: '/companies/intuit/preview',
    title: 'Intuit Frontend Interview Questions and Craft Demo Guide',
    description:
      'Intuit frontend interview: the Craft Demo explained (the brief, the length, what the panel grades), the AI round, and 30 reported questions from public reports.',
    h1: 'Intuit Frontend Interview Questions',
    kicker: 'Public Intuit prep guide',
    headings: [
      'What Intuit panels push on',
      'Where these accounts come from, and what to settle with the recruiter',
      'Intuit Craft Demo for frontend candidates: how the build and the panel run',
      'questions candidates reported',
      'Scope the craft demo app before the panel joins',
      'A 7-day Intuit frontend interview preparation plan',
      'Common Intuit frontend interview preparation questions',
      'Build the underlying skills with free practice',
      'Sources (',
    ],
    trustFragment: 'None is an official or leaked Intuit question',
    resources: [
      '/react/coding/react-fetch-list-states',
      '/guides/interview-blueprint/dsa-for-fe',
      '/javascript/trivia/js-xss-dom-sinks',
      '/react/trivia/react-usememo-vs-usecallback',
    ],
    reportUrl:
      'https://leetcode.com/discuss/post/7320927/',
  },
  {
    label: 'ServiceNow',
    route: '/companies/servicenow/preview',
    title: 'ServiceNow Frontend Interview Questions: 30 Reported + Prep Guide',
    description:
      'ServiceNow frontend interview: the screening call, JavaScript and algorithm rounds, a design or machine-coding round, the hiring manager and 30 reported questions.',
    h1: 'ServiceNow Frontend Interview Questions',
    kicker: 'Public ServiceNow prep guide',
    headings: [
      'What the ServiceNow rounds test: the language itself, then problems against a clock',
      'questions candidates reported',
      'Four decisions before your map polyfill runs',
      'A 7-day ServiceNow frontend interview preparation plan',
      'Common ServiceNow frontend interview preparation questions',
      'Free drills for a JavaScript-first loop',
      'Sources (',
    ],
    trustFragment: 'Candidates posted these accounts on LeetCode Discuss',
    resources: [
      '/javascript/coding/js-array-foreach',
      '/javascript/trivia/js-this-keyword',
    ],
    reportUrl:
      'https://medium.com/@karunakumari000532/my-servicenow-software-engineer-ui-interview-experience-2025-23f315b960dc',
  },
  {
    label: 'Amazon',
    route: '/companies/amazon/preview',
    title: 'Amazon Frontend Interview Questions: 37 Reported + Prep Guide',
    description:
      'Amazon front end engineer interview: the assessment, phone screen and loop explained, 37 reported questions and the Leadership Principles questions asked.',
    h1: 'Amazon Frontend Interview Questions',
    kicker: 'Public Amazon prep guide',
    headings: [
      'What Amazon front end loops reward: a working widget early, and a story for every principle',
      'What Amazon\'s page fixes, what candidates add, and the gap after 2024',
      'Amazon Leadership Principles questions for front end engineers: what was asked',
      'questions candidates reported',
      'Scope a coding-round component before writing the first line',
      'A 7-day Amazon frontend interview preparation plan',
      'Common Amazon frontend interview preparation questions',
      'Free practice for the skills Amazon\'s rounds draw on',
      'Sources (',
    ],
    trustFragment: 'own posts on LeetCode Discuss, Blind and Medium between 2019 and 2025',
    resources: [
      '/react/coding/react-autocomplete-search-starter',
      '/system-design/infinite-scroll-list',
      '/javascript/coding/js-build-tree-from-flat-list',
      '/react/coding/react-todo-list',
      '/javascript/coding/js-sleep',
      '/guides/behavioral/stories',
    ],
    reportUrl: 'https://leetcode.com/discuss/post/546992/',
  },
  {
    label: 'Meta',
    route: '/companies/meta/preview',
    title: 'Meta Frontend Interview Questions: 23 Reported + Prep Guide',
    description:
      'Meta front end engineer interview: the recruiter call, the JavaScript screen, the loop\'s coding, design and behavioural rounds, and 23 reported questions.',
    h1: 'Meta Frontend Interview Questions',
    kicker: 'Public Meta prep guide',
    headings: [
      'What Meta front end rounds reward: plain JavaScript and DOM code, written from memory against the clock',
      'questions candidates reported',
      'Settle what map promises before you write it',
      'A 7-day Meta frontend interview preparation plan',
      'Common Meta frontend interview preparation questions',
      'Sources (',
    ],
    trustFragment: 'posted by a Meta front end candidate',
    resources: [
      '/javascript/coding/js-array-foreach',
      '/javascript/coding/js-debounce',
    ],
    reportUrl:
      'https://www.jointaro.com/interviews/companies/meta/experiences/front-end-developer-intern-london-england-december-1-2021-no-offer-positive-4f6ff45b/',
  },
  {
    label: 'Revolut',
    route: '/companies/revolut/preview',
    title: 'Revolut Frontend Interview Questions and Bar Raiser Guide',
    description:
      'Revolut frontend interview: the HackerRank test, an hour of TypeScript and React live coding, design, team fit, the Bar Raiser and 22 reported questions.',
    h1: 'Revolut Frontend Interview Questions',
    kicker: 'Public Revolut prep guide',
    headings: [
      'What Revolut frontend loops test: request state in TypeScript, then algorithms against a clock',
      'Short anonymous reviews: what they show about Revolut, and what to confirm',
      'Revolut Bar Raiser interview for frontend engineers: what it is and how to prepare',
      'questions candidates reported',
      'Scope the one-hour fetch-and-render task before the first line',
      'A 7-day Revolut frontend interview preparation plan',
      'Common Revolut frontend interview preparation questions',
      'Free practice for the Revolut rounds',
      'Sources (',
    ],
    trustFragment: 'anonymous interview review re-posted on Taro',
    resources: [
      '/react/coding/react-fetch-list-states',
      '/javascript/coding/js-valid-parentheses',
      '/guides/interview-blueprint/dsa-for-fe',
      '/system-design/resilient-checkout-payment-flow',
      '/guides/behavioral/stories',
    ],
    reportUrl:
      'https://www.jointaro.com/interviews/companies/revolut/experiences/frontend-developer-warsaw-masovia-april-1-2025-no-offer-neutral-71032bb4/',
  },
  {
    label: 'Spotify',
    route: '/companies/spotify/preview',
    title: 'Spotify Frontend Interview Questions: 29 Reported + Prep Guide',
    description:
      'Spotify web engineer interview: the recruiter call, the JavaScript and CSS screen, a framework-free web hour in the final and 29 reported questions.',
    h1: 'Spotify Frontend Interview Questions',
    kicker: 'Public Spotify prep guide',
    headings: [
      'What Spotify web loops test: JavaScript, the DOM and CSS by hand, without a framework',
      'questions candidates reported',
      'Scope the fetch-and-render form before writing any code',
      'A 7-day Spotify frontend interview preparation plan',
      'Common Spotify frontend interview preparation questions',
      'Free practice for the Spotify web rounds',
      'Sources (',
    ],
    trustFragment: 'something a Spotify candidate wrote about their own loop',
    resources: [
      '/javascript/coding/js-take-latest',
      '/javascript/coding/js-fetch-json-timeout',
    ],
    reportUrl:
      'https://www.teamblind.com/post/weak-system-design-interview-for-spotify-chances-of-no-hire-00wjs6rg',
  },
  {
    label: 'xAI',
    route: '/companies/xai/preview',
    title: 'xAI (now SpaceXSI) Frontend Interview Questions and Process Guide',
    description:
      'Prepare for an xAI (SpaceXSI) frontend interview with 7 reported questions and the rounds from public postings and reports: chat UI, TS app, CSS screenshot.',
    h1: 'xAI (now SpaceXSI) Frontend Interview Questions',
    kicker: 'Public xAI prep guide',
    headings: [
      'Prepare for product judgment, not xAI trivia',
      'What closed postings and a few accounts can show, and what to ask your interviewers',
      'questions candidates reported',
      'Scope the chat interface before the first line of the pairing session',
      'A 7-day xAI frontend interview preparation plan',
      'Common xAI frontend interview preparation questions',
      'Build the underlying skills with free practice',
      'Sources (',
    ],
    trustFragment: 'not leaked, confirmed or official xAI questions',
    resources: [
      '/react/coding/react-fetch-list-states',
      '/css/coding/css-grid-card-gallery',
      '/css/coding/css-flexbox-navbar',
      '/javascript/trivia/ai-streaming-data-handling',
      '/javascript/trivia/chat-conversation-state-management',
      '/system-design/ai-chat-textarea-design',
      '/guides/behavioral/stories',
    ],
    reportUrl:
      'https://www.jointaro.com/interviews/companies/xai/experiences/frontend-engineer-london-england-august-13-2025-no-offer-positive-45b410e6/',
  },
  {
    label: 'JPMorgan Chase',
    route: '/companies/jpmorgan/preview',
    title: 'JPMorgan Chase Frontend Interview Questions and React Round Guide',
    description:
      'JPMorgan Chase frontend interview: the React and JavaScript conversation, live coding, the Bengaluru security round and the super day, with 28 reported questions.',
    h1: 'JPMorgan Chase Frontend Interview Questions',
    kicker: 'Public JPMorgan Chase prep guide',
    headings: [
      'Learn the recurring questions, then rehearse your team\'s shape',
      'What these accounts can tell you, and what to ask the recruiter',
      'JPMorgan Chase React interview for frontend engineers: the rounds each team runs',
      'questions candidates reported',
      'Scope the 2026 live-coding task before the first line',
      'A 7-day JPMorgan Chase frontend interview preparation plan',
      'Common JPMorgan Chase frontend interview preparation questions',
      'Free practice for the JPMorgan Chase rounds',
      'Sources (',
    ],
    trustFragment: 'none is a leaked, confirmed or official JPMorgan Chase',
    resources: [
      '/javascript/trivia/js-memoization',
      '/react/trivia/react-keys-in-lists',
      '/guides/interview-blueprint/dsa-for-fe',
      '/guides/behavioral/stories',
    ],
    reportUrl:
      'https://www.frontendgeek.com/interview-experience/frontend-interview-experience-at-jp-morgan-refused-offer---9f684f90-12ee-45ec-ac82-e40d2010260e',
  },
  {
    label: 'Agoda',
    route: '/companies/agoda/preview',
    title: 'Agoda Frontend Interview Questions and Platform Interview Guide',
    description:
      'Agoda frontend interview: the Platform interview (60 min on HackerRank, three reported shapes), coding hour, architecture round and 38 reported questions.',
    h1: 'Agoda Frontend Interview Questions',
    kicker: 'Public Agoda prep guide',
    headings: [
      'Practise talking: in the newest loop only the coding hour asked for code',
      'What these Agoda accounts cover, and what only the recruiter can tell you',
      'Agoda Platform interview for frontend engineers: one hour, three shapes',
      'Agoda Architecture interview for frontend engineers: an hour of design without a diagram',
      'questions candidates reported',
      'Scope the hotel search page before the first sentence',
      'A 7-day Agoda frontend interview preparation plan',
      'Common Agoda frontend interview preparation questions',
      'Build the underlying skills with free practice',
      'Sources (',
    ],
    trustFragment: 'Agoda has confirmed none of them, nothing is leaked',
    resources: [
      '/guides/interview-blueprint/dsa-for-fe',
      '/guides/system-design-blueprint',
      '/react/coding/react-fetch-list-states',
      '/guides/behavioral/stories',
    ],
    reportUrl:
      'https://leetcode.com/discuss/post/8459009/',
  },
  {
    label: 'Shopee',
    route: '/companies/shopee/preview',
    title: 'Shopee Frontend Interview Questions: 133 Reported + Prep Guide',
    description:
      'Shopee frontend interview rounds in Vietnam, Singapore, China and Taiwan, from a two-hour frontend round to a written test, with 133 reported questions.',
    h1: 'Shopee Frontend Interview Questions',
    kicker: 'Public Shopee prep guide',
    headings: [
      'What Shopee frontend rounds reward: JavaScript written from memory, and the web platform explained exactly',
      'questions candidates reported',
      'Scope the Promise implementation before the first line',
      'A 7-day Shopee frontend interview preparation plan',
      'Common Shopee frontend interview preparation questions',
      'Free practice for each part of a Shopee round',
      'Sources (',
    ],
    trustFragment: 'a Viblo interview in which a preparation course quotes a hire',
    resources: [
      '/javascript/coding/js-create-deferred-promise',
      '/guides/interview-blueprint/javascript-interviews',
    ],
    reportUrl:
      'https://viblo.asia/p/luyen-tap-that-bai-va-thanh-cong-hanh-trinh-cua-anh-dat-hoc-vien-engineer-pro-vao-shopee-EbNVQnP04vR',
  },
  {
    label: 'Anduril',
    route: '/companies/anduril/preview',
    title: 'Anduril Frontend Interview Questions: 11 Reported + Prep Guide',
    description:
      'Prepare for an Anduril frontend interview with 11 reported questions from public reports: the file explorer screen, two coding rounds, design, behavioral.',
    h1: 'Anduril Frontend Interview Questions',
    kicker: 'Public Anduril prep guide',
    headings: [
      'What Anduril frontend loops reward: working UI inside the hour, in React or plain JavaScript',
      'What Blind and Taro accounts show about the Anduril loop, and where they stop',
      'questions candidates reported',
      'Scope the file explorer before the first line',
      'A 7-day Anduril frontend interview preparation plan',
      'Common Anduril frontend interview preparation questions',
      'Build the underlying skills with free practice',
      'Sources (',
    ],
    trustFragment: 'read the list as what came up',
    resources: [
      '/javascript/coding/js-filter-tree-render-indented',
      '/javascript/trivia/js-classes',
      '/javascript/trivia/js-event-delegation',
      '/javascript/trivia/debounce-vs-throttle-search-input',
      '/system-design/infinite-scroll-list',
      '/guides/behavioral/stories',
    ],
    reportUrl:
      'https://www.teamblind.com/post/front-end-interviews-at-anduril-3hihnhlv',
  },
  {
    label: 'GitLab',
    route: '/companies/gitlab/preview',
    title: 'GitLab Frontend Interview Questions: 27 Reported + Prep Guide',
    description:
      'GitLab frontend interview: the merge request you review at home and improve in a 90-minute call, the written assessment and 27 reported questions.',
    h1: 'GitLab Frontend Interview Questions',
    kicker: 'Public GitLab prep guide',
    headings: [
      'What the GitLab frontend loop rewards: a written merge request review you can defend and improve live',
      'What GitLab publishes and what the accounts add',
      'The GitLab merge request review: the take-home half and the 90-minute call',
      'questions candidates reported',
      'Plan the merge request review before the call',
      'A 7-day GitLab frontend interview preparation plan',
      'Common GitLab frontend interview preparation questions',
      'Build the underlying skills with free practice',
      'Sources (',
    ],
    trustFragment: 'Taro re-posts with rewritten text and placeholder dates',
    resources: [
      '/javascript/debug/js-debug-mutating-input',
      '/javascript/debug/js-debug-off-by-one',
      '/vue/coding/vue-todo-list',
      '/vue/trivia/vue-conditional-list-rendering',
      '/guides/behavioral/stories',
    ],
    reportUrl:
      'https://www.jointaro.com/interviews/companies/gitlab/experiences/front-end-engineer-united-states-february-1-2024-no-offer-neutral-031df9b0/',
  },
  {
    label: 'Capital One',
    route: '/companies/capital-one/preview',
    title: 'Capital One Frontend Interview Questions and Power Day Guide',
    description:
      'Capital One frontend interview: Power Day explained (frontend design, React or Angular technical, case and behavioral hours), CodeSignal and 29 reported questions.',
    h1: 'Capital One Frontend Interview Questions',
    kicker: 'Public Capital One prep guide',
    headings: [
      'What Capital One frontend loops reward: designing a card application out loud and reading code critically',
      'What the accounts cover, and the gap after 2024',
      'Capital One Power Day for frontend engineers: the four interviews, hour by hour',
      'questions candidates reported',
      'Scope the card application design before you draw',
      'A 7-day Capital One frontend interview preparation plan',
      'Common Capital One frontend interview preparation questions',
      'Build the underlying skills with free practice',
      'Sources (',
    ],
    trustFragment: 'not leaked, confirmed or official Capital One questions',
    resources: [
      '/javascript/debug/js-debug-nullish-defaults',
      '/react/trivia/react-state-management-redux',
      '/angular/trivia/angular-routing',
      '/react/coding/react-fetch-list-states',
      '/guides/behavioral/stories',
    ],
    reportUrl:
      'https://www.jointaro.com/interviews/companies/capital-one/experiences/senior-frontend-engineer-washington-dc-july-1-2024-no-offer-neutral-3e4968d4/',
  },
  {
    label: 'CrowdStrike',
    route: '/companies/crowdstrike/preview',
    title: 'CrowdStrike Frontend Interview Questions and Take-Home Review Guide',
    description:
      'CrowdStrike frontend interview: the take-home file table and its review round, spoken web fundamentals, the AI rule and 38 reported questions.',
    h1: 'CrowdStrike Frontend Interview Questions',
    kicker: 'Public CrowdStrike prep guide',
    headings: [
      'What CrowdStrike frontend loops reward: a take-home you can defend and precise web fundamentals',
      'The CrowdStrike frontend take-home and the review round after it',
      'questions candidates reported',
      'Plan the take-home table before you write code',
      'A 7-day CrowdStrike frontend interview preparation plan',
      'Common CrowdStrike frontend interview preparation questions',
      'Free practice for the CrowdStrike round formats',
      'Sources (',
    ],
    trustFragment: 'These questions come from CrowdStrike candidates',
    resources: [
      '/html/coding/html-tables-accessibility',
      '/react/coding/react-fetch-list-states',
    ],
    reportUrl:
      'https://www.jointaro.com/interviews/companies/crowdstrike/experiences/engineering-manager-frontend-united-states-september-3-2025-accepted-offer-neutral-6cbb594c/',
  },
];
// Catalog-driven company previews with an editorial notes entry (COMPANY_EDITORIAL_NOTES).
const EDITORIAL_NOTE_SMOKE = [
  {
    label: 'Walmart',
    route: '/companies/walmart/preview',
    title: 'Walmart Frontend Interview: 2026 Assessment and Karat Screen',
    h1: 'Walmart Frontend Interview Questions and Process',
    headings: [
      'Three loop shapes, by role and region',
      'Walmart Frontend Engineering Assessment and Karat interview: how each one runs',
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
      'Build and run a component first, then the design round',
      'Common questions about ByteDance and TikTok frontend interviews',
    ],
    practicePath: '/react/coding/react-vanilla-dropdown-port',
  },
  {
    label: 'Microsoft',
    route: '/companies/microsoft/preview',
    title: 'Microsoft Frontend Interview Process and Practice Guide',
    h1: 'Microsoft Frontend Interview Questions and Process',
    headings: [
      'From a single interview to six rounds',
      'Start with the calendar, then the concept rounds',
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
      'Assessment, screen, then a three or four round onsite',
      'Start with the search bar, then the onsite rounds',
      'Common questions about Tesla frontend interviews',
    ],
    practicePath: '/react/coding/react-autocomplete-search-starter',
  },
  {
    label: 'Booking.com',
    route: '/companies/booking-com/preview',
    title: 'Booking.com Frontend Interview Process and Fit Interview',
    h1: 'Booking.com Frontend Interview Questions and Process',
    headings: [
      'HackerRank test, recruiter call, coding rounds, fit interview',
      'The Booking.com fit interview: who runs it and where it falls',
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
      'A multi-part screen, then an onsite of four or five rounds',
      'Start with the bug squash',
      'Common questions about Stripe frontend interviews',
    ],
    practicePath: '/javascript/debug/js-debug-off-by-one',
  },
  {
    label: 'Uber',
    route: '/companies/uber/preview',
    title: 'Uber Frontend Interview Process and Practice Questions',
    h1: 'Uber Frontend Interview Questions and Process',
    headings: [
      'The official loop and what candidates met',
      'Rehearse the screen, then the specialization round',
      'Common questions about Uber frontend interviews',
    ],
    practicePath: '/react/coding/react-fetch-list-states',
  },
  {
    label: 'Apple',
    route: '/companies/apple/preview',
    title: 'Apple Frontend Interview Process and Practice Questions',
    h1: 'Apple Frontend Interview Questions and Process',
    headings: [
      'A screen, then a team loop of four to seven rounds in most accounts',
      'Rehearse the screen, then the coding loop',
      'Common questions about Apple frontend interviews',
    ],
    practicePath: '/javascript/coding/js-build-tree-from-flat-list',
  },
  {
    label: 'Airbnb',
    route: '/companies/airbnb/preview',
    title: 'Airbnb Frontend Interview Practice and Official FAQ',
    h1: 'Airbnb Frontend Interview Practice',
    headings: [
      'A screen that changes, then coding, design and one project in depth',
      'The Airbnb UI coding round: what candidates built and how it went',
      'Common questions about Airbnb frontend interviews',
    ],
    practicePath: '/react/coding/react-autocomplete-search-starter',
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

  // The reported-question list replaced the prompt cards: the questions after the first stay in the page, locked,
  // and the page carries no ItemList.
  const googleLockedRows = (googleBody.match(/class="[^"]*cq-row__question[^"]*premium-locked[^"]*"/g) || []).length;
  checks.push({
    name: 'Google company preview locks its reported questions in the page and lists no prompts in its schema',
    ok: googleLockedRows > 0 && !googleItemList && !googleCollectionPage?.mainEntity,
    detail: `locked_rows=${googleLockedRows} itemList=${Boolean(googleItemList)}`,
  });

  const missingGoogleResourceLinks = GOOGLE_PREVIEW_RESOURCE_ROUTES.filter(
    (route) => !googleInternalLinks.has(route),
  );
  checks.push({
    name: 'Google company preview has all contextual public resource links in raw HTML',
    ok: missingGoogleResourceLinks.length === 0,
    detail: missingGoogleResourceLinks.length
      ? `missing=${missingGoogleResourceLinks.join(', ')}`
      : 'all present',
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
  ];
  const missingGoogleSchemaTypes = requiredGoogleSchemaTypes.filter(
    (type) => !googleJsonLd.graph.some((node) => hasSchemaType(node, type)),
  );
  checks.push({
    name: 'Google company preview has the required top-level schema graph',
    ok: missingGoogleSchemaTypes.length === 0,
    detail: missingGoogleSchemaTypes.length ? `missing=${missingGoogleSchemaTypes.join(', ')}` : 'all present',
  });

  checks.push({
    name: 'Google company preview CollectionPage marks its locked parts as Premium and declares the sitemap modification date',
    ok:
      marksPremiumParts(googleCollectionPage) &&
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

  // The reported-question list replaced the prompt cards: the questions after the first stay in the page, locked,
  // and the page carries no ItemList.
  const netflixLockedRows = (netflixBody.match(/class="[^"]*cq-row__question[^"]*premium-locked[^"]*"/g) || []).length;
  checks.push({
    name: 'Netflix company preview locks its reported questions in the page and lists no prompts in its schema',
    ok: netflixLockedRows > 0 && !netflixItemList && !netflixCollectionPage?.mainEntity,
    detail: `locked_rows=${netflixLockedRows} itemList=${Boolean(netflixItemList)}`,
  });

  const missingNetflixResourceLinks = NETFLIX_PREVIEW_RESOURCE_ROUTES.filter(
    (route) => !netflixInternalLinks.has(route),
  );
  checks.push({
    name: 'Netflix company preview has all contextual public resource links in raw HTML',
    ok: missingNetflixResourceLinks.length === 0,
    detail: missingNetflixResourceLinks.length
      ? `missing=${missingNetflixResourceLinks.join(', ')}`
      : 'all present',
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

  checks.push({
    name: 'Netflix company preview CollectionPage marks its locked parts as Premium and declares the sitemap modification date',
    ok:
      marksPremiumParts(netflixCollectionPage) &&
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
    {
      label: 'Apple',
      route: '/companies/apple/preview',
      heading: 'Official preparation pages from Apple',
      link: 'https://www.apple.com/careers/us/interview_tips.html',
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
    const body = await curlBody(`${base}/companies/tesla/preview`, { followRedirects: true, userAgent: GOOGLEBOT_USER_AGENT });
    const leaked = extractVisibleText(body).includes(normalizeText('Official preparation pages from'));
    checks.push({
      name: 'Tesla company preview has no official preparation pages table',
      ok: !leaked,
      detail: leaked ? 'table rendered without data' : 'absent',
    });
  }

  {
    const bytedanceBody = await curlBody(`${base}/companies/bytedance/preview`, { followRedirects: true, userAgent: GOOGLEBOT_USER_AGENT });
    const bytedanceText = extractVisibleText(bytedanceBody);
    // With the reported-question list the public reports block is gone: its items are rows, their sources the list at the end.
    const hasBlock = bytedanceText.includes(normalizeText('Practice items with public ByteDance interview accounts'));
    const hasList = bytedanceBody.includes('data-testid="company-question-list"');
    const hasReportLink = bytedanceBody.includes('href="https://www.teamblind.com/post/bytedance-new-grad-frontend-engineer-interview-breakdown-vqyvjs1l"');
    checks.push({
      name: 'ByteDance company preview shows its reported questions in the list, with no public reports block and no report link for a visitor',
      ok: !hasBlock && hasList && !hasReportLink,
      detail: `block=${hasBlock} list=${hasList} reportLink=${hasReportLink}`,
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
    const lockedRows = (body.match(/class="[^"]*cq-row__question[^"]*premium-locked[^"]*"/g) || []).length;
    checks.push({
      name: `${guide.label} company preview locks its reported questions in the page, marks them Premium and links no source for a visitor`,
      ok:
        lockedRows > 0 &&
        !itemList &&
        !collectionPage?.mainEntity &&
        marksPremiumParts(collectionPage) &&
        schemaDateMatchesSitemap(collectionPage, guide.route, sitemapDates) &&
        !body.includes(`href="${guide.reportUrl}"`),
      detail: `locked_rows=${lockedRows} itemList=${Boolean(itemList)} dateModified=${collectionPage?.dateModified || '(missing)'}`,
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
    // The guide shows its reported-question list, and the practice link of its notes.
    const listed = body.includes('data-testid="company-question-list"');
    const catalogOk = listed && body.includes(`href="${note.practicePath}"`);
    const schemaOk = Boolean(collectionPage?.dateModified) && !jsonLd.graph.some((node) => hasSchemaType(node, 'FAQPage'));
    checks.push({
      name: `${note.label} company preview renders its editorial notes around the catalog blocks with a dated CollectionPage`,
      ok: titleOk && headingsOk && catalogOk && schemaOk,
      detail: `title=${titleOk} headings=${headingsOk} catalog=${catalogOk} schema=${schemaOk}`,
    });
  }

  const premiumRoutes = new Set(loadTsModule(path.join(generatedAppDir, 'premium-question-routes.ts')).PREMIUM_QUESTION_ROUTES);
  const companyGuideRoutes = fs.readFileSync(srcPrerenderRoutesPath, 'utf8').split('\n')
    .map((line) => line.trim())
    .filter((route) => /^\/companies\/[^/]+\/preview$/.test(route));
  const lockProblems = [];
  for (const route of companyGuideRoutes) {
    const body = await curlBody(`${base}${route}`, { followRedirects: true, userAgent: GOOGLEBOT_USER_AGENT });
    const collectionPage = extractSeoJsonLd(body).graph.find((node) => hasSchemaType(node, 'CollectionPage'));
    lockProblems.push(...premiumLockViolations(body, { premiumRoutes, collectionPage }).map((problem) => `${route}: ${problem}`));
  }
  checks.push({
    name: `${companyGuideRoutes.length} company guides show no Premium practice name to visitors and mark the locked parts for search`,
    ok: companyGuideRoutes.length > 0 && premiumRoutes.size > 0 && lockProblems.length === 0,
    detail: lockProblems.length ? lockProblems.slice(0, 5).join(' | ') : `${premiumRoutes.size} Premium routes checked`,
  });

  // A Premium page prerenders the public locked view: its HTML, transfer state included, carries neither the answer
  // of a trivia question, the solution block of a coding task, nor the sections of a system design case. Probes are
  // 40-character runs of the locked text that the public fields (title, description, preview, practice) do not share.
  const prerenderedRoutes = new Set(fs.readFileSync(srcPrerenderRoutesPath, 'utf8').split('\n').map((line) => line.trim()));
  const readCdnJson = (...parts) => {
    const file = path.join(cdnQuestionsDir, ...parts);
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
  };
  const banks = new Map();
  const bankEntry = (tech, kind, id) => {
    const key = `${tech}/${kind}`;
    if (!banks.has(key)) banks.set(key, readCdnJson(tech, `${kind}.json`) ?? []);
    return banks.get(key).find((item) => item?.id === id) ?? null;
  };
  const lockedProbes = (texts, publicText) => texts
    .flatMap((text) => String(text || '').split(/<[^>]+>/))
    .flatMap((segment) => segment.match(/[A-Za-z0-9 ,]{40,}/g) ?? [])
    .map((run) => run.trim().slice(0, 40))
    .filter((probe) => probe.length === 40 && !publicText.includes(probe));
  const blockTexts = (blocks) => (blocks ?? []).flatMap((block) => [
    block?.text,
    block?.code,
    ...(block?.rows ?? []).flat(),
    ...(block?.steps ?? []).map((step) => step?.text),
    ...(block?.items ?? []).filter((item) => typeof item === 'string'),
  ]);
  const leakProblems = [];
  let lockedPages = 0;
  for (const route of premiumRoutes) {
    if (!prerenderedRoutes.has(route)) continue;
    const question = /^\/([a-z]+)\/(trivia|coding|debug)\/([^/]+)$/.exec(route);
    const design = /^\/system-design\/([^/]+)$/.exec(route);
    let probes = [];
    let solutionKey = false;
    if (question) {
      const [, tech, kind, id] = question;
      const entry = bankEntry(tech, kind, id);
      if (!entry) continue;
      const publicText = [entry.title, entry.description, entry.seo?.title, entry.seo?.description, entry.premiumPreview?.summary,
        ...(entry.premiumPreview?.learningOutcomes ?? []), entry.premiumPreview?.unlockDescription].map(String).join(' ');
      probes = kind === 'trivia' ? lockedProbes([...blockTexts(entry.answer?.blocks), entry.incidentCard?.scenario], publicText) : [];
      solutionKey = kind !== 'trivia';
    } else if (design) {
      const meta = readCdnJson('system-design', design[1], 'meta.json');
      if (!meta) continue;
      const publicText = JSON.stringify([meta.title, meta.description, meta.seo, meta.premiumPreview, meta.practice, meta.sources]);
      const sections = ['requirements', 'architecture', 'data', 'interfaces', 'optimizations']
        .map((section) => readCdnJson('system-design', design[1], `${section}.json`));
      probes = lockedProbes(sections.flatMap((section) => blockTexts(section?.blocks)), publicText);
    } else {
      continue;
    }
    lockedPages += 1;
    const body = await curlBody(`${base}${route}`, { followRedirects: true, userAgent: GOOGLEBOT_USER_AGENT });
    const found = probes.filter((probe) => body.includes(probe));
    if (found.length) leakProblems.push(`${route}: locked text in the HTML ("${found[0]}")`);
    if (solutionKey && body.includes('"solutionBlock"')) leakProblems.push(`${route}: solutionBlock in the HTML`);
  }
  checks.push({
    name: `${lockedPages} prerendered Premium pages carry no answer, solution or locked section in their HTML`,
    ok: lockedPages > 0 && leakProblems.length === 0,
    detail: leakProblems.length ? leakProblems.slice(0, 5).join(' | ') : `${lockedPages} pages checked`,
  });

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
