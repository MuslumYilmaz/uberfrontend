import type { AuthoredCompanyPreview } from '../../shared/company-previews/authored-company-preview.model';

/**
 * CrowdStrike frontend interview guide. Every prompt is a FrontendAtlas practice version modelled on public,
 * self-reported frontend accounts (reviews re-hosted on Taro and one Blind thread, 2020 to 2025), on CrowdStrike's
 * interviewing and Emerging Talent pages, and on the two frontend postings open in October 2026. Nothing here is a
 * leaked, confirmed or official CrowdStrike question. The take-home task is described only in the public report's words.
 */
const CROWDSTRIKE_EM_FE_2025_URL =
  'https://www.jointaro.com/interviews/companies/crowdstrike/experiences/engineering-manager-frontend-united-states-september-3-2025-accepted-offer-neutral-6cbb594c/';
const CROWDSTRIKE_EM_FE_2025_LABEL = 'Public report: Taro frontend engineering manager loop, 2025';
const CROWDSTRIKE_DENMARK_2025_URL =
  'https://www.jointaro.com/interviews/companies/crowdstrike/experiences/senior-frontend-engineer-denmark-march-26-2025-no-offer-positive-775974f1/';
const CROWDSTRIKE_DENMARK_2025_LABEL = 'Public report: Taro senior frontend engineer loop in Denmark, 2025';
const CROWDSTRIKE_CANADA_2025_URL =
  'https://www.jointaro.com/interviews/companies/crowdstrike/experiences/senior-front-end-engineer-canada-january-1-2025-no-offer-neutral-476ef9db/';
const CROWDSTRIKE_CANADA_2025_LABEL = 'Public report: Taro senior front end engineer loop in Canada, 2025';
const CROWDSTRIKE_UK_2024_URL =
  'https://www.jointaro.com/interviews/companies/crowdstrike/experiences/senior-front-end-developer-london-england-june-1-2024-no-offer-negative-2b30d254/';
const CROWDSTRIKE_UK_2024_LABEL = 'Public report: Taro senior front end developer loop, 2024';
const CROWDSTRIKE_LIST_ROUND_2023_URL =
  'https://www.jointaro.com/interviews/companies/crowdstrike/experiences/senior-front-end-engineer-united-states-december-1-2023-no-offer-negative-08d0c99b/';
const CROWDSTRIKE_LIST_ROUND_2023_LABEL = 'Public report: Taro senior front end engineer loop, 2023';
const CROWDSTRIKE_REVIEW_2022_URL =
  'https://www.jointaro.com/interviews/companies/crowdstrike/experiences/senior-frontend-engineer-united-states-june-23-2022-no-offer-positive-e9222bd2/';
const CROWDSTRIKE_REVIEW_2022_LABEL = 'Public report: Taro senior frontend engineer loop, 2022';
const CROWDSTRIKE_UI_OFFER_2022_URL =
  'https://www.jointaro.com/interviews/companies/crowdstrike/experiences/ui-engineer-united-states-february-1-2022-accepted-offer-positive-26130ab1/';
const CROWDSTRIKE_UI_OFFER_2022_LABEL = 'Public report: Taro UI engineer loop, 2022';
const CROWDSTRIKE_BLIND_2024_URL = 'https://www.teamblind.com/post/crowdstrike-frontend-interview-jmjmpz0w';
const CROWDSTRIKE_BLIND_2024_LABEL = 'Public report: Blind senior frontend interview thread, 2024';
const CROWDSTRIKE_INTERVIEWING_URL = 'https://www.crowdstrike.com/en-us/careers/interviewing/';
const CROWDSTRIKE_EMERGING_TALENT_URL = 'https://www.crowdstrike.com/en-us/careers/university-interns/';
const CROWDSTRIKE_FALCON_COMPLETE_POSTING_URL =
  'https://crowdstrike.wd5.myworkdayjobs.com/crowdstrikecareers/job/United-Kingdom---Remote/Sr-Engineer---Front-End--Remote--GBR-_R30396';
const CROWDSTRIKE_DATA_PLATFORM_POSTING_URL =
  'https://crowdstrike.wd5.myworkdayjobs.com/crowdstrikecareers/job/United-Kingdom---London/Sr-Engineer--Frontend---Data-Platform-Experiences--Hybrid--London-_R30313';

export const CROWDSTRIKE_PREVIEW_TITLE = 'CrowdStrike Frontend Interview Questions and Take-Home Review Guide';
export const CROWDSTRIKE_PREVIEW_H1 = 'CrowdStrike Frontend Interview Questions';
export const CROWDSTRIKE_PREVIEW_DESCRIPTION =
  'CrowdStrike frontend interview: the take-home file table and its review round (what engineers ask), spoken web fundamentals, the AI rule and 5 practice prompts.';
export const CROWDSTRIKE_PREVIEW_CANONICAL_PATH = '/companies/crowdstrike/preview';
export const CROWDSTRIKE_PREVIEW_TRUST_NOTE =
  'These are FrontendAtlas practice versions modelled on rounds described in public interview reports, not leaked, confirmed or official CrowdStrike questions.';

export const CROWDSTRIKE_COMPANY_PREVIEW: AuthoredCompanyPreview = {
  slug: 'crowdstrike',
  label: 'CrowdStrike',
  title: CROWDSTRIKE_PREVIEW_TITLE,
  h1: CROWDSTRIKE_PREVIEW_H1,
  description: CROWDSTRIKE_PREVIEW_DESCRIPTION,
  canonicalPath: CROWDSTRIKE_PREVIEW_CANONICAL_PATH,
  trustNote: CROWDSTRIKE_PREVIEW_TRUST_NOTE,
  hero: {
    kicker: 'Public CrowdStrike prep guide',
    subtitle:
      'Prepare with five practice prompts shaped by public frontend accounts and by CrowdStrike careers pages: a recruiter call, a manager conversation, spoken web fundamentals and security questions with engineers, a take-home UI build, and a review of that build.',
    caveat:
      'Twenty frontend-focused accounts from 2020 to 2025 inform this guide: nineteen are reviews re-hosted on Taro and one is a Blind thread. We found no frontend account from 2026. Both frontend roles open in October 2026 are in the United Kingdom, where one 2024 report exists, so confirm the rounds with your recruiter.',
    chips: ['5 practice prompts', 'Take-home review, web fundamentals, security', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'What CrowdStrike frontend loops reward: a take-home you can defend and precise web fundamentals',
    paragraphs: [
      'In most United States accounts from 2021 to 2025, a recruiter call and a conversation with a hiring manager or engineering manager come early. Engineers, often two, then ask short spoken questions on JavaScript, HTML, CSS and browser security. The accounts describe definitions and examples rather than algorithm problems.',
      'Seven of the US accounts describe a take-home build and four describe a review of it; two say the review was with two engineers. The one named task is a table of downloadable files and their details, built from a screenshot. In the 2025 review, the engineers asked what the candidate would change and how to add filtering and sorting. They also asked when to load each file\'s status, how to handle thousands of entries, and what happens when someone selects all, moves to another page and deselects a few rows.',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked October 2026',
    title: 'What the public accounts establish',
    paragraphs: [
      'The fullest United States accounts from 2021 to 2025 describe one order: recruiter, manager, a round with engineers, a take-home and a review round, sometimes followed by a culture or team conversation. Other accounts list fewer rounds or a different order.',
      'Outside the United States, each country has one report. The United Kingdom report from 2024 describes a home task, the Denmark report from 2025 live coding and a whiteboard design, and the Canada report from 2025 a technical phone screen and a dashboard design question. CrowdStrike\'s interviewing page describes the general steps for all roles and leaves the number of interviews to the recruiter.',
    ],
  },
  roundSpotlights: [
    {
      id: 'take-home-review',
      kicker: 'Round decoder',
      title: 'CrowdStrike take-home build and review round for frontend engineers: what was asked',
      lede: [
        'Most United States frontend loops at CrowdStrike end with a take-home UI build and a review of it with engineers, after a recruiter call, a hiring-manager conversation and a spoken web-fundamentals round. The one named task is a table of downloadable files and their details, built from a screenshot; one report was allowed any language or framework, one names a 4-hour project, and the 2024 United Kingdom report had a week for a task estimated at 5 hours.',
        'In the review, engineers, two of them in two reports, go through the submission: what you would change, how you would add filtering and sorting, whether the component should be generalised, when to load each file\'s status, how it copes with thousands of rows, and what happens when someone selects all, moves to another page and deselects a few rows.',
      ],
      facts: [
        { label: 'Position in the loop', value: 'After the recruiter call, the hiring-manager conversation and the web-fundamentals round with engineers; sometimes followed by a culture interview, a collaboration panel or an informational talk with the manager.' },
        { label: 'The build', value: 'A table of downloadable files and their details from a screenshot; any language or framework in one report; a 4-hour project in one report; in the United Kingdom report a week for a task estimated at 5 hours, on which the candidate spent 10, with a reply nearly three weeks later.' },
        { label: 'The review', value: 'What you would change; filtering and sorting; generalising the component; when to load each file\'s status; thousands of rows; select all across pages.' },
        { label: 'Who runs it', value: 'Engineers from the team, two of them in two reports.' },
        { label: 'AI rule', value: 'CrowdStrike\'s interviewing page, last modified on 20 October 2026, requires interviews and assessments to be completed without AI unless you are explicitly asked to use AI tools; ask the recruiter whether the take-home follows the same rule.' },
        { label: 'Ember', value: 'Both frontend postings open in October 2026 name Ember and React; in one 2024 report the only feedback after a rejection named Ember; no public account lists an Ember question.' },
        { label: 'Sources', value: 'Taro re-hosted frontend and UI accounts from 2021 to 2025, a Blind thread from 2024 and CrowdStrike\'s interviewing page. All are listed under Sources below with what each can establish.' },
      ],
      practiceLink: { label: 'Rehearse the review: defend and extend your table', fragment: 'take-home-review-defend-extend' },
      processLink: { label: 'See the take-home rows in the reported process', fragment: 'crowdstrike-interview-process-1-stage-take-home-review' },
    },
  ],
  roleLenses: {
    kicker: 'Role lenses',
    title: 'Ember, React and very large data as practice contexts',
    intro: 'These lenses come from the two frontend postings open in October 2026. Choose the one closest to the role.',
    items: [
      {
        title: 'Ember at the core, React inside Web Component hosts',
        description:
          'The Data Platform Experiences posting describes a new UX that keeps Ember at its core for routing, services and dependency injection while opening the door to Web Components and Lit at the page and component level. React has a meaningful footprint, especially on AI-adjacent surfaces, where it typically lives inside a Web Component host, and TypeScript runs through most of the code. The Falcon Complete posting names Ember and React and offers help getting comfortable with Ember.',
        practiceFocus:
          'Component boundaries, services and dependency injection, custom elements with properties and events, and how a framework component behaves inside a Web Component host.',
      },
      {
        title: 'UI surfaces on top of LLMs and agents',
        description:
          'The Data Platform Experiences posting lists experience building UI on top of LLMs, agents or MCP-style tooling as a bonus, and the Falcon Complete posting asks for experience using AI technologies in your work.',
        practiceFocus:
          'Streaming responses, cancel and retry, showing tool steps and partial results, and not rendering model output as raw HTML.',
      },
      {
        title: 'Very large data, accessibility and tests',
        description:
          'The Falcon Complete posting describes evergreen browsers and very large amounts of data, asks for genuinely accessible interfaces, and names Playwright, QUnit or Mocha for testing. The Data Platform Experiences posting asks for charting libraries and interactive dashboards.',
        practiceFocus:
          'Paging and virtualisation for big tables, accessible tables and charts, and tests for edge cases such as select all across pages.',
      },
    ],
  },
  prompts: {
    kicker: 'Representative practice prompts',
    title: 'Five CrowdStrike frontend interview practice questions',
    intro:
      'For each prompt, clarify the scope, say your structure out loud, handle the edge cases, and test them. Each prompt links to the public report it is modelled on and to a practice page.',
    itemListName: 'Five CrowdStrike frontend interview practice prompts',
    items: [
      {
        id: 'downloadable-files-table-select-all',
        title: 'Build a downloadable-files table with select all',
        statement:
          'From a screenshot, build a table of downloadable files and their details that shows whether each file is available for download. Then add select all, and keep the selection correct when someone selects all, moves to another page and deselects a few rows.',
        whatThisMeasures:
          'Turning a visual into semantic, accessible markup, modelling selection state, and thinking about scale before a reviewer asks.',
        clarifyFirst: [
          'Ask how many rows to expect, whether the data is paged on the server, and whether select all means the visible page or every matching file.',
          'Ask what an unavailable file should do in the table.',
        ],
        strongAnswer: [
          'Use a real table with a caption, header cells with scope, and one labelled checkbox per row.',
          'Store selection as a mode plus exceptions, such as all except these ids, so select all does not need every id loaded.',
          'Key the selection by a stable file id, not a row position, so sorting or paging never moves a selection to another file.',
          'Test select all, deselecting after paging, a file whose availability changes, and an empty list.',
        ],
        commonMiss:
          'Keeping selected ids for the current page only, so select all and paging silently lose or invent selections.',
        resourceLabel: 'Practise semantic table markup (free)',
        resourcePath: '/html/coding/html-tables-accessibility',
        reportedRound: { label: CROWDSTRIKE_EM_FE_2025_LABEL, url: CROWDSTRIKE_EM_FE_2025_URL },
      },
      {
        id: 'take-home-review-defend-extend',
        title: 'Defend and extend your take-home in review',
        statement:
          'Two reviewers open your table and ask what you would change, how you would add filtering and sorting, whether the component should be generalised, when to load each file\'s status, and how it would cope with thousands of entries.',
        whatThisMeasures:
          'Owning your design decisions, extending code without rewriting it, and reasoning about data loading and scale.',
        clarifyFirst: [
          'Before the review, write down the trade-offs you made and what you would do with another day.',
          'Ask whether filtering and sorting run on the client or the server, since that decides how selection and paging behave.',
        ],
        strongAnswer: [
          'Name one or two changes you would make yourself before they ask, with the reason.',
          'Keep filter and sort state in one place, such as the URL, and decide on purpose whether a filter change keeps or clears the selection.',
          'Generalise only what a second use needs, such as column definitions and a row id, not a setting for every case.',
          'For file status, compare loading it with the list, on demand for visible rows, and by polling or push, and choose by how often it changes.',
          'For thousands of entries, page or virtualise the rows and keep selection independent of what is rendered.',
        ],
        commonMiss: 'Defending every line instead of saying what you would change, or proposing a full rewrite.',
        resourceLabel: 'Work through the component state from a mock case (Premium)',
        resourcePath: '/system-design/ui-component-state-from-mock',
        reportedRound: { label: CROWDSTRIKE_EM_FE_2025_LABEL, url: CROWDSTRIKE_EM_FE_2025_URL },
      },
      {
        id: 'web-fundamentals-rapid-round',
        title: 'Web fundamentals rapid round',
        statement:
          'Two engineers ask short fundamentals questions: var, let and const; bubbling and event delegation; promises and deeply nested promises; bind, call and apply; CSS specificity; and managing z-index. Answer each in under a minute with one example.',
        whatThisMeasures: 'Precise definitions, quick examples, and calm answers when a follow-up goes one level deeper.',
        clarifyFirst: [
          'If a question is ambiguous, say in one sentence which reading you are answering, then answer it.',
          'Ask whether they want a definition or an example from your own work.',
        ],
        strongAnswer: [
          'Lead with a one-sentence definition, then one short example, then one pitfall.',
          'Know the edges: the temporal dead zone for let and const, stopPropagation versus delegation, and a rejected promise with no handler.',
          'Explain specificity as a comparison of selectors, and z-index through stacking contexts rather than bigger numbers.',
          'Show how bind, call and apply each set this, and flatten nested promises by returning them or using async and await.',
        ],
        commonMiss:
          'Answering with a long story instead of a definition, or guessing a syntax detail instead of saying how you would check it.',
        resourceLabel: 'Review bubbling, capturing and event delegation (free)',
        resourcePath: '/javascript/trivia/js-event-delegation',
        reportedRound: { label: CROWDSTRIKE_EM_FE_2025_LABEL, url: CROWDSTRIKE_EM_FE_2025_URL },
      },
      {
        id: 'explain-xss-and-cors',
        title: 'Explain XSS and CORS for a security product',
        statement:
          'Explain what cross-site scripting is and how you would defend a UI against it, then explain what CORS lets the browser enforce and what it does not protect.',
        whatThisMeasures: 'Browser security basics stated precisely, with defences you would apply in real code.',
        clarifyFirst: [
          'Ask whether they want stored, reflected and DOM-based XSS separately, or one defence plan.',
          'Confirm whether the CORS question is about a failing request or about what CORS protects.',
        ],
        strongAnswer: [
          'Define XSS as untrusted data running as code in your origin, and name common sinks such as innerHTML and javascript: URLs in links.',
          'Defend in layers: framework escaping, safe DOM APIs such as textContent, sanitising any HTML you must render, and a Content Security Policy.',
          'Explain CORS as the browser deciding whether a page may read a cross-origin response, based on headers the server sends.',
          'Say what CORS does not do: it does not stop simple requests from reaching the server, does not replace CSRF protection, and is not authentication.',
        ],
        commonMiss:
          'Treating CORS as protection for the server, or fixing a CORS error by reflecting any origin with credentials allowed.',
        resourceLabel: 'Study DOM XSS sinks and safe APIs (free)',
        resourcePath: '/javascript/trivia/js-xss-dom-sinks',
        reportedRound: { label: CROWDSTRIKE_LIST_ROUND_2023_LABEL, url: CROWDSTRIKE_LIST_ROUND_2023_URL },
      },
      {
        id: 'real-time-dashboard-stays-fast',
        title: 'Design a real-time dashboard that stays fast',
        statement:
          'Design a highly interactive dashboard fed by live data: pick the transport, batch updates, downsample charts, show when data is stale, and name what you would measure first when it slows down.',
        whatThisMeasures:
          'Data flow design under load, rendering budgets, and clear freshness signals for people who act on the data.',
        clarifyFirst: [
          'Ask how often data changes, how many widgets and rows are on screen, and whether users need every event or only the latest state.',
          'Ask what a user does with stale data, since that decides how loudly to signal it.',
        ],
        strongAnswer: [
          'Choose server-sent events or WebSocket by direction and volume, with a snapshot plus sequenced updates so a reconnect can resume.',
          'Batch incoming events per animation frame or interval, and update only the widgets whose data changed.',
          'Downsample chart points to the available pixel width, and virtualise long tables and logs.',
          'Show a last-updated time and a stale state per widget, and measure long tasks, frame rate and memory before optimising.',
        ],
        commonMiss:
          'Re-rendering the whole dashboard on every message, then reaching for a faster chart library instead of fewer updates.',
        resourceLabel: 'Work through the real-time model training dashboard case (Premium)',
        resourcePath: '/system-design/model-training-progress-dashboard',
        reportedRound: { label: CROWDSTRIKE_CANADA_2025_LABEL, url: CROWDSTRIKE_CANADA_2025_URL },
      },
    ],
  },
  walkthrough: {
    kicker: 'Public mini walkthrough',
    title: 'Scope select all across pages before you code',
    intro: 'The select-all questions from the 2025 review depend on how selection is stored, so decide it first and say why.',
    steps: [
      {
        title: 'Define select all',
        description:
          'Agree whether it means the visible page, every loaded row or every file that matches the current filter. Each answer changes the data model.',
      },
      {
        title: 'Choose the selection model',
        description:
          'An explicit set of ids is simple and fine when every row is loaded. With server paging, store a mode plus exceptions, all except these ids or none except these ids, so select all, a page change and a few deselections stay correct without loading every id.',
      },
      {
        title: 'Decide when file status loads',
        description:
          'Load availability with each page if it rarely changes, fetch it for visible rows if it is expensive, and poll or subscribe only while a file\'s status can still change. Show unavailable files clearly and say whether they can be selected.',
      },
      {
        title: 'Expose the mixed state',
        description:
          'Set the header checkbox to checked, unchecked or mixed, with the indeterminate property on a native checkbox or aria-checked="mixed" on a custom one, so assistive technology reports a partial selection.',
      },
      {
        title: 'Plan for thousands of rows',
        description:
          'Page or virtualise the rows, keep the selection model independent of the rendered rows, and when the server needs the selection, send the mode plus exceptions instead of every id.',
      },
      {
        title: 'Test the edges',
        description:
          'Select all and then deselect on page two, change a filter after select all, an empty result, a file that becomes unavailable while selected, and keyboard-only selection.',
      },
    ],
  },
  prepPlan: {
    kicker: 'Actionable preparation',
    title: 'A 7-day CrowdStrike frontend interview preparation plan',
    intro: 'Every day ends with code, a test, a written answer, or a question you can use in the real process.',
    days: [
      {
        day: 'Day 1',
        focus: 'JavaScript fundamentals: var, let and const, bubbling and delegation, promises, and bind, call and apply.',
        artifact: 'One-minute spoken answers with one example each, recorded and timed.',
      },
      {
        day: 'Day 2',
        focus: 'CSS and the browser: specificity, z-index and stacking contexts, the box model, and what happens after a URL is entered.',
        artifact: 'A one-page sheet of definitions and pitfalls.',
      },
      {
        day: 'Day 3',
        focus: 'Security and accessibility: XSS sinks and defences, what CORS does and does not protect, and accessibility concerns for a data table.',
        artifact: 'Two answers you can give in two minutes each, with one code example.',
      },
      {
        day: 'Day 4',
        focus: 'Build the files table: semantic markup, row checkboxes, availability, paging and select all with exceptions.',
        artifact: 'A working table with tests for select all, deselecting after paging and an empty list.',
      },
      {
        day: 'Day 5',
        focus: 'Extend it: filtering and sorting in the URL, a generalised column definition, and status loading for visible rows.',
        artifact: 'A short list of what you would change and why, ready for the review round.',
      },
      {
        day: 'Day 6',
        focus: 'Design: a real-time dashboard with batching, downsampling and stale-data signals.',
        artifact: 'A 20-minute design you can explain on a whiteboard.',
      },
      {
        day: 'Day 7',
        focus: 'Manager and closing rounds: past projects, decisions you made, how you handle disagreement and how you work with other teams.',
        artifact: 'Five stories, plus questions for the recruiter about the rounds, the take-home and the rules on AI tools.',
      },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common CrowdStrike frontend interview preparation questions',
    items: [
      {
        question: 'What is the CrowdStrike take-home review round?',
        answer:
          'A call in which engineers, two of them in two reports, go through the take-home you submitted: what you would change, how you would add filtering and sorting, whether the component should be generalised, when to load each file\'s status, how it copes with thousands of rows, and what select all means across pages. Prepare the trade-offs you made and one or two changes you would make yourself.',
      },
      {
        question: 'Are these the real CrowdStrike questions?',
        answer:
          'No. They are FrontendAtlas practice versions modelled on round types in public, self-reported accounts. Some fundamentals questions repeat across accounts, but treat the exact wording and the take-home brief as unknown.',
      },
      {
        question: 'Is there a LeetCode round?',
        answer:
          'The frontend accounts name no algorithm round, and two describe the technical questions as not the LeetCode kind. CrowdStrike\'s interviewing page lists coding among the possible assessments and names Codeinterview.io for live coding, and one 2025 account from Denmark had a 90-minute live coding exercise. Ask your recruiter which format your loop uses.',
      },
      {
        question: 'Do I need to know Ember?',
        answer:
          'Both open postings name Ember and React, and one offers to help you get comfortable with Ember. In one 2024 report, the only feedback after a rejection named Ember. No public account lists an Ember question, but knowing how Ember structures routes, services and components helps you talk about the codebase.',
      },
      {
        question: 'Can I use AI tools in the interview?',
        answer:
          'CrowdStrike\'s interviewing page, last modified on 20 October 2026, requires interviews and assessments to be completed without AI unless you are explicitly asked to use AI tools, and says it will tell you upfront when an assessment allows them. Ask your recruiter whether the take-home follows the same rule.',
      },
      {
        question: 'How long is the take-home?',
        answer:
          'Reports differ. In one 2024 account the task was estimated at 5 hours, took the candidate 10 and came with a week to finish; a 2021 account names a project to complete within 4 hours. Ask for the expected time and what the review will cover.',
      },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Build the underlying skills with free practice',
    intro: 'These public pages cover the table, loading, fundamentals, security and real-time skills used by the practice prompts.',
    items: [
      {
        label: 'Tables and accessibility',
        description: 'Caption, header cells and scope: the markup half of the file table.',
        path: '/html/coding/html-tables-accessibility',
      },
      {
        label: 'Infinite scroll system design',
        description: 'Paging, windowing and request state for thousands of rows.',
        path: '/system-design/infinite-scroll-list',
      },
      {
        label: 'Poll until with timeout and abort',
        description: 'Polling mechanics for a file status that changes while the user waits.',
        path: '/javascript/coding/js-poll-until',
      },
      {
        label: 'Bubbling, capturing and event delegation',
        description: 'One handler for many row checkboxes, and the propagation questions around it.',
        path: '/javascript/trivia/js-event-delegation',
      },
      {
        label: 'Block scope versus function scope',
        description: 'The var, let and const question in two of the accounts.',
        path: '/javascript/trivia/js-block-scoped-or-function-scoped',
      },
      {
        label: 'The box model and box-sizing',
        description: 'The CSS box model question in two of the accounts.',
        path: '/css/trivia/css-box-model',
      },
      {
        label: 'Promise chains and async/await',
        description: 'Promises, chaining and the nested promises follow-up.',
        path: '/javascript/trivia/js-promises-async-await',
      },
      {
        label: 'DOM XSS sinks and safe APIs',
        description: 'Dangerous sinks, safe DOM APIs and Trusted Types for the XSS question.',
        path: '/javascript/trivia/js-xss-dom-sinks',
      },
      {
        label: 'Handling CORS securely',
        description: 'What CORS controls and how to fix errors without opening every origin.',
        path: '/javascript/trivia/js-secure-cors-handling',
      },
      {
        label: 'SSE versus WebSocket',
        description: 'Choosing the transport for a real-time dashboard.',
        path: '/javascript/trivia/sse-vs-websocket-real-time',
      },
    ],
  },
  sources: {
    kicker: 'Public interview reports and official context',
    title: 'Sources and evidence limits',
    intro:
      'The guide is built on these public interview reports, two CrowdStrike careers pages and the two frontend postings open in October 2026. Each note says what the source can and cannot establish.',
    items: [
      {
        label: CROWDSTRIKE_EM_FE_2025_LABEL,
        url: CROWDSTRIKE_EM_FE_2025_URL,
        note: 'A re-hosted Glassdoor review of an engineering manager loop with an offer. It establishes seven rounds, a round with two engineers on fundamentals, the take-home table of downloadable files built from a screenshot, and a review of it. Manager rounds may not apply to every role.',
        kind: 'report',
      },
      {
        label: CROWDSTRIKE_LIST_ROUND_2023_LABEL,
        url: CROWDSTRIKE_LIST_ROUND_2023_URL,
        note: 'A re-hosted Glassdoor review with a placeholder date and no offer. It establishes a recruiter interview, a round with a senior engineering manager, and two engineers taking turns through textbook-style questions. Its questions, not tied to a round, include XSS and the box model.',
        kind: 'report',
      },
      {
        label: CROWDSTRIKE_REVIEW_2022_LABEL,
        url: CROWDSTRIKE_REVIEW_2022_URL,
        note: 'A re-hosted Glassdoor review without an offer, with specifics withheld under an NDA. It establishes a take-home that could be built in any language or framework, a later round to discuss the implementation, and standard JavaScript questions that were not the LeetCode kind.',
        kind: 'report',
      },
      {
        label: CROWDSTRIKE_UI_OFFER_2022_LABEL,
        url: CROWDSTRIKE_UI_OFFER_2022_URL,
        note: 'A re-hosted Glassdoor review from a referral that led to an offer, with specifics withheld under an NDA. It establishes a manager interview with technical questions, an interview with two engineers, a take-home, a code review of it with two engineers and a final manager talk.',
        kind: 'report',
      },
      {
        label: CROWDSTRIKE_UK_2024_LABEL,
        url: CROWDSTRIKE_UK_2024_URL,
        note: 'A re-hosted Glassdoor review from the United Kingdom with a placeholder date and no offer. It establishes two stages of questions read from a list, a home task estimated at 5 hours that took 10, and a rejection whose only feedback named Ember. Its listed questions include CORS.',
        kind: 'report',
      },
      {
        label: CROWDSTRIKE_DENMARK_2025_LABEL,
        url: CROWDSTRIKE_DENMARK_2025_URL,
        note: 'A re-hosted Glassdoor review without an offer. It establishes a 90-minute live coding exercise in a language of the candidate\'s choice and a whiteboard design whose requirements were sent in advance. It also lists a question on frontend optimization.',
        kind: 'report',
      },
      {
        label: CROWDSTRIKE_CANADA_2025_LABEL,
        url: CROWDSTRIKE_CANADA_2025_URL,
        note: 'A re-hosted Glassdoor review with a placeholder date and wording that reads as heavily rewritten. It establishes a recruiter screening, a technical phone screen with coding challenges and architectural discussions, and a real-time dashboard design question in an unstated round.',
        kind: 'report',
      },
      {
        label: CROWDSTRIKE_BLIND_2024_LABEL,
        url: CROWDSTRIKE_BLIND_2024_URL,
        note: 'A short first-person thread. The poster wrote that the recruiter described a trivia-style round on JavaScript, CSS and frontend fundamentals, and confirmed it afterwards. Later replies under the same name mention a take-home and a discussion of it, not attributed to the poster.',
        kind: 'report',
      },
      {
        label: 'CrowdStrike Careers: Interviewing at CrowdStrike',
        url: CROWDSTRIKE_INTERVIEWING_URL,
        note: 'Official page for all roles, last modified on 20 October 2026. It lists eight steps from application to background check and names coding, system design, a business case, a presentation or a mock customer call as possible assessments. It has no frontend-specific text.',
        kind: 'official',
      },
      {
        label: 'CrowdStrike Careers: Emerging Talent Programs',
        url: CROWDSTRIKE_EMERGING_TALENT_URL,
        note: 'Official page for internships and new graduate roles. It describes up to three rounds of interviews and a technical assessment for technical positions. It does not describe experienced frontend loops.',
        kind: 'official',
      },
      {
        label: 'CrowdStrike: Sr. Engineer - Front End posting (R30396)',
        url: CROWDSTRIKE_FALCON_COMPLETE_POSTING_URL,
        note: 'Official posting for a remote role in the United Kingdom on the Falcon Complete Core Engineering team, read in October 2026. It names Ember and React, Playwright, QUnit or Mocha, accessible interfaces and very large amounts of data; it says nothing about the interview.',
        kind: 'official',
      },
      {
        label: 'CrowdStrike: Sr. Engineer, Frontend - Data Platform Experiences posting (R30313)',
        url: CROWDSTRIKE_DATA_PLATFORM_POSTING_URL,
        note: 'Official posting for a hybrid role in the United Kingdom, read in October 2026. It describes Ember at the core with Web Components and Lit coming in, React mostly on AI-adjacent surfaces inside Web Component hosts, TypeScript, data visualisation and UI on top of LLMs and agents.',
        kind: 'official',
      },
    ],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full CrowdStrike practice set',
    copy:
      'This public guide is complete enough to plan a focused week. Premium unlocks the component state from a mock case, the real-time model training dashboard case and the wider premium library for the same skills.',
    buttonLabel: 'Unlock the full CrowdStrike practice set',
    src: 'company_preview_crowdstrike',
  },
  about: [
    'CrowdStrike frontend interview preparation',
    'Frontend take-home and review round',
    'Web fundamentals and browser security interview questions',
    'Select all across pages in a data table',
  ],
  indexAnchorLabel: 'CrowdStrike frontend interview questions',
};
