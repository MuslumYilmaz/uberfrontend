import type { AuthoredCompanyPreview } from '../../shared/company-previews/authored-company-preview.model';

/**
 * CrowdStrike frontend interview guide. The reported questions live with the process table
 * (company-interview-processes.ts); the five prompts here are the answer guides of the take-home, review, fundamentals,
 * security and dashboard rows. The questions come from anonymous reviews re-hosted on Taro (2020 to 2025) and from two
 * Blind threads; CrowdStrike's interviewing and Emerging Talent pages give the official steps, and the two UK frontend
 * postings open in October 2026 give the stack. Every cited page was read again on 2026-11-13. The take-home brief is
 * not public: the guide describes the task only in the 2025 account's words and links no candidate solution. Nothing
 * here is a leaked, confirmed or official CrowdStrike question.
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
const CROWDSTRIKE_BLIND_ONSITE_2022_URL = 'https://www.teamblind.com/post/crowdstrike-frontend-interview-5n8jmgs4';
const CROWDSTRIKE_BLIND_ONSITE_2022_LABEL = 'Public report: Blind comment on a senior frontend interview thread, 2022';
const CROWDSTRIKE_INTERVIEWING_URL = 'https://www.crowdstrike.com/en-us/careers/interviewing/';
const CROWDSTRIKE_EMERGING_TALENT_URL = 'https://www.crowdstrike.com/en-us/careers/university-interns/';
const CROWDSTRIKE_FALCON_COMPLETE_POSTING_URL =
  'https://crowdstrike.wd5.myworkdayjobs.com/crowdstrikecareers/job/United-Kingdom---Remote/Sr-Engineer---Front-End--Remote--GBR-_R30396';
const CROWDSTRIKE_DATA_PLATFORM_POSTING_URL =
  'https://crowdstrike.wd5.myworkdayjobs.com/crowdstrikecareers/job/United-Kingdom---London/Sr-Engineer--Frontend---Data-Platform-Experiences--Hybrid--London-_R30313';

export const CROWDSTRIKE_PREVIEW_TITLE = 'CrowdStrike Frontend Interview Questions and Take-Home Review Guide';
export const CROWDSTRIKE_PREVIEW_H1 = 'CrowdStrike Frontend Interview Questions';
export const CROWDSTRIKE_PREVIEW_DESCRIPTION =
  'CrowdStrike frontend interview: the take-home file table and its review round, spoken web fundamentals, the AI rule and {#questions} reported questions.';
export const CROWDSTRIKE_PREVIEW_CANONICAL_PATH = '/companies/crowdstrike/preview';
export const CROWDSTRIKE_PREVIEW_TRUST_NOTE =
  'These questions come from CrowdStrike candidates: most wrote Glassdoor reviews, which Taro republishes in reworded form and often dates only to the month, and a few posted on Blind. Each question is retold in our words, CrowdStrike has not confirmed any of them, and every answer outline is FrontendAtlas\'s own. CrowdStrike has not published the take-home brief and this guide does not reproduce it, so the open question gives the task only as the 2025 account words it.';

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
      'CrowdStrike frontend and UI accounts from the United States, 2021 to 2025, describe a recruiter call, a manager conversation, spoken web fundamentals with engineers, a UI take-home and a review of that take-home; one 2022 account instead ended with an all-day virtual on-site. Under the table are the {questions} questions candidates reported in these and other CrowdStrike loops from 2020 to 2025; the first, the take-home table, is open.',
    caveat:
      'Most of these accounts are anonymous reviews that Taro re-posts, many dated only to the month, and none of the frontend accounts is from 2026. Both frontend roles open in October 2026 are in the United Kingdom, where a single 2024 account exists, so check the rounds of your loop with the recruiter.',
    chips: ['{#questions} reported questions', '{#reports} public reports, 2020–2026', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'What CrowdStrike frontend loops reward: a take-home you can defend and precise web fundamentals',
    paragraphs: [
      'Most reported questions are short spoken definitions. The 2025 manager loop lists twelve, from var, let and const to XSS, and calls its round with two engineers mostly fundamentals; eight subjects come up in two accounts each: those two, event bubbling, the CSS box model, CORS, what happens after a URL is entered, closures and frontend performance. Answer in a sentence or two with one example. The 2023 candidate thought the engineers wanted memorised definitions, and a 2022 interviewer asked whether JavaScript is single-threaded right after the candidate had said so in an answer about promises.',
      'Seven US accounts describe a take-home build, and the one named task is the open question: a table of downloadable files and their details, built from a screenshot. In the 2025 review the engineers asked what the candidate would change, how to add filtering and sorting, whether to generalise the component, when to load each file\'s status, how to handle thousands of entries and what select all does across pages. Write your trade-offs down before the review; in 2022 the reviewers did not know React, the framework one candidate had chosen.',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked November 2026',
    title: 'Where the CrowdStrike accounts come from and where they stop',
    paragraphs: [
      'Most accounts behind this guide are Glassdoor reviews re-posted on Taro, from US frontend and UI loops between 2021 and 2025; Taro rewrites their text and dates many of them to the first of a month. On Blind, a senior candidate\'s 2024 thread describes the fundamentals round, and a 2022 comment describes a screening and an on-site with UI builds. The question list also draws on a 2023 UI internship, a 2020 account and a 2024 general software engineer loop, and the behavioural questions on two 2026 commenters in a Blind thread about a full-stack role.',
      'Outside the United States there is one frontend account each from London in 2024, Denmark in 2025 and Canada in 2025, and none of the frontend accounts is from 2026. CrowdStrike\'s interviewing page, last modified on 20 October 2026, lists eight general hiring steps, says your recruiter will explain the steps for your role and rules out AI tools in interviews and assessments unless you are told to use them.',
    ],
  },
  roundSpotlights: [
    {
      id: 'take-home-review',
      kicker: 'Round decoder',
      title: 'The CrowdStrike frontend take-home and the review round after it',
      lede: [
        'Seven United States frontend and UI accounts from 2021 to 2025 describe a take-home task and four describe a review of it; the four that give an order put it after a manager conversation and a round with engineers. The one named task is the open question below: a table of downloadable files and their details, built from a screenshot.',
        'In the review, engineers, two in two accounts, go through what you submitted and how you would develop it; the questions from the 2025 review are in the list. In 2022 one review talked through some pseudo code without a whiteboard, and in another the reviewers did not know React, the framework the candidate had picked.',
      ],
      facts: [
        { label: 'Position in the loop', value: 'In the four accounts that give an order, after a manager conversation and a round with engineers, on fundamentals in two of them; a culture interview, a collaboration panel or a last talk with the hiring manager followed in some loops.' },
        { label: 'The build', value: 'In 2025 a table of downloadable files and their details from a screenshot. One 2022 account could use any language or framework, a 2021 account had 4 hours for its project, and in London in 2024 a task estimated at 5 hours took the candidate 10 within the week allowed.' },
        { label: 'The review', value: 'Engineers, two in two accounts, on your submission and its further development: pseudo code but no whiteboard in one 2022 account, reviewers who did not know React in another.' },
        { label: 'AI rule', value: 'CrowdStrike\'s interviewing page, last modified on 20 October 2026, requires interviews and assessments to be completed without AI unless you are explicitly asked to use AI tools; ask the recruiter whether the take-home follows the same rule.' },
        { label: 'Ember', value: 'Both frontend postings open in October 2026 name Ember and React; in one 2024 report the only feedback after a rejection named Ember; no public account lists an Ember question.' },
        { label: 'Where this comes from', value: 'Reviews of US frontend and UI loops from 2021 to 2025 re-posted on Taro, the 2024 London review and CrowdStrike\'s interviewing page, all in the sources list at the end of the page.' },
      ],
      practiceLink: { label: 'Start with the table markup in the free tables and accessibility task', path: '/html/coding/html-tables-accessibility' },
      processLink: { label: 'See the take-home rows in the reported process', fragment: 'crowdstrike-interview-process-1-stage-take-home-review' },
    },
  ],
  roleLenses: {
    kicker: 'Role lenses',
    title: 'Ember, React and very large data as practice contexts',
    intro:
      'All three come from the two UK frontend postings open in October 2026, not from interview accounts: no account lists an Ember, Web Components or LLM question.',
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
          'The Data Platform Experiences posting lists experience building UI on top of LLMs, agents or MCP-style tooling among its bonus points, and both postings ask for experience using AI technologies in your work.',
        practiceFocus:
          'Streaming responses, cancel and retry, showing tool steps and partial results, and not rendering model output as raw HTML.',
      },
      {
        title: 'Very large data, accessibility and tests',
        description:
          'The Falcon Complete posting describes evergreen browsers and truly massive amounts of data, asks for genuinely accessible interfaces, and names Playwright, QUnit or Mocha for testing. The Data Platform Experiences posting asks for charting libraries and interactive dashboards.',
        practiceFocus:
          'Paging and virtualisation for big tables, accessible tables and charts, and tests for edge cases such as select all across pages.',
      },
    ],
  },
  prompts: {
    kicker: 'Answer guides',
    title: 'CrowdStrike answer guides: the take-home, its review and the spoken rounds',
    intro:
      'Each guide serves one or more rows of the list, with the questions to ask first, an answer outline and the usual mistake.',
    itemListName: 'CrowdStrike answer guides',
    items: [
      {
        id: 'downloadable-files-table-select-all',
        title: 'Build the downloadable-files table from a screenshot',
        statement:
          'From a screenshot, build a table of a few downloadable files and their details, in code you can walk through and extend in the review that follows.',
        whatThisMeasures:
          'Turning a visual into semantic, accessible markup, a data model you can name, and code a reviewer can read without you.',
        clarifyFirst: [
          'Ask which framework you may use and how long the task should take, since accounts report anything from a 4-hour limit to a week.',
          'Ask what the reviewers will look at, and whether tests and a short README count.',
        ],
        strongAnswer: [
          'Write the data model from the screenshot first: one object per file with a stable id and each detail the screenshot shows, kept as typed values rather than display strings.',
          'Use a real table with a caption and header cells with scope, so a screen reader can move by row and column.',
          'Keep the table, its rows and the cell formatting in separate pieces, and keep data loading out of all three.',
          'Show loading, error and empty states, and test them along with long file names and keyboard use.',
          'Leave a short README with the trade-offs you made and what you would change with another day, since the review starts from your code.',
        ],
        commonMiss:
          'Copying the screenshot with nested divs: the table loses its headers for a screen reader, and there is no data model to extend when the review asks for more.',
        resourceLabel: 'Build the downloadable-files table (Premium)',
        resourcePath: '/react/coding/react-files-table-select-all',
        reportedRound: { label: CROWDSTRIKE_EM_FE_2025_LABEL, url: CROWDSTRIKE_EM_FE_2025_URL },
      },
      {
        id: 'take-home-review-defend-extend',
        title: 'Defend and extend your take-home in review',
        statement:
          'Two reviewers open your table and ask what you would change, how you would add filtering and sorting, whether the component should be generalised, when to load each file\'s status, how it would cope with thousands of entries, and what happens when someone selects all, moves to another page and deselects a few.',
        whatThisMeasures:
          'Owning your design decisions, extending code without rewriting it, and reasoning about data loading, selection and scale.',
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
          'For select all, store a mode plus exceptions keyed by file id, all except these or none except these, so select all, a page change and a few deselections stay correct without loading every id, and show the header checkbox as mixed.',
        ],
        commonMiss: 'Defending every line instead of saying what you would change, or proposing a full rewrite.',
        resourceLabel: 'Read the take-home review answer guide (Premium)',
        resourcePath: '/react/trivia/react-take-home-table-review-questions',
        reportedRound: { label: CROWDSTRIKE_EM_FE_2025_LABEL, url: CROWDSTRIKE_EM_FE_2025_URL },
      },
      {
        id: 'web-fundamentals-rapid-round',
        title: 'Web fundamentals rapid round',
        statement:
          'Two engineers ask short fundamentals questions: var, let and const; bubbling and event delegation; promises and deeply nested promises; bind, call and apply; CSS specificity; and managing z-index. Other accounts add the box model and copying objects. Answer each in under a minute with one example.',
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
          'Name content, padding, border and margin and what box-sizing changes, and contrast a spread copy, which shares nested objects, with structuredClone.',
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
    kicker: 'Mini walkthrough',
    title: 'Plan the take-home table before you write code',
    intro:
      'The 2025 account gives the task in one line: a table of a few downloadable files and their details, from a screenshot. Settle these points first, so that you can explain each one in the review.',
    steps: [
      {
        title: 'Read the screenshot as data',
        description:
          'List the columns and the details each file shows, decide the type of each value, and pick the field that identifies a file. Write that model down before any markup.',
      },
      {
        title: 'Choose real table markup',
        description:
          'A table with a caption, header cells with scope and one row per file, so a screen reader can move by row and column. Actions are buttons or links, not clickable cells.',
      },
      {
        title: 'Split the components',
        description:
          'A table, a row and the cells that format each value, with data loading kept outside them, so a reviewer can change one part without reading the rest.',
      },
      {
        title: 'Key every row by a stable file id',
        description:
          'Rows keyed by id keep their state when the list is later sorted, filtered or paged, which is where the 2025 review went next.',
      },
      {
        title: 'Cover the states',
        description:
          'Loading, an error with a retry and an empty list, each visible and tested, along with long file names and keyboard-only use.',
      },
      {
        title: 'Leave a short README',
        description:
          'What you built, what you left out and why, and what you would change with another day: the 2025 review asked the candidate what they would change.',
      },
    ],
  },
  prepPlan: {
    kicker: 'Actionable preparation',
    title: 'A 7-day CrowdStrike frontend interview preparation plan',
    intro: 'One day for each part of the loops the accounts describe, with the take-home and its review in the middle of the week and a design day drawn from the Denmark and Canada accounts.',
    days: [
      {
        day: 'Day 1',
        focus: 'Spoken fundamentals: short definitions of core JavaScript and DOM concepts, each with one example and one pitfall, said aloud.',
        artifact: 'Twenty timed answers of a minute or less, with the ones you hesitated on marked for a second pass.',
      },
      {
        day: 'Day 2',
        focus: 'CSS and the browser: the cascade, layout and rendering, explained aloud with a small example for each.',
        artifact: 'A one-page sheet of definitions and pitfalls you can read in five minutes.',
      },
      {
        day: 'Day 3',
        focus: 'Security and accessibility: the web security and accessibility basics a security company\'s UI depends on, each explained with one example.',
        artifact: 'Two answers of two minutes each, with one code example.',
      },
      {
        day: 'Day 4',
        focus: 'The take-home table: build the open question\'s table of downloadable files from a screenshot of your own, with semantic markup and tests.',
        artifact: 'A working table, its tests and a README of the trade-offs you made.',
      },
      {
        day: 'Day 5',
        focus: 'Review rehearsal: have a friend read your table for 30 minutes, then add one feature they choose without rewriting what works.',
        artifact: 'Notes on what they asked and how you answered.',
      },
      {
        day: 'Day 6',
        focus: 'Design round: sketch the frontend architecture of a data-heavy screen on a whiteboard and explain it in 20 minutes.',
        artifact: 'One diagram with the data flow, the state and what you would measure.',
      },
      {
        day: 'Day 7',
        focus: 'Manager and closing rounds: past projects and the decisions behind them, how you handle conflict, and how you work with other teams.',
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
          'A call in which engineers, two of them in two accounts, go through the take-home you submitted and how you would develop it further. In 2022 one review talked through some pseudo code without a whiteboard, and in another the reviewers did not know React, the framework the candidate had chosen. The questions asked in the 2025 review are in the list above.',
      },
      {
        question: 'Are these the real CrowdStrike questions?',
        answer:
          'They come from candidates\' own reports, mostly Glassdoor reviews republished by Taro, and the wording here is ours; CrowdStrike has confirmed none of them. Eight subjects come up in two accounts each, the rest in one. CrowdStrike has not published the take-home brief and this guide does not reproduce it, so the open question gives the task only as the 2025 account describes it.',
      },
      {
        question: 'Is there a LeetCode round?',
        answer:
          'No frontend account describes one, and three say outright that there was no LeetCode-style or algorithm round. CrowdStrike\'s interviewing page lists coding among the possible assessments and names Codeinterview.io for live coding; a 2025 Denmark loop had a 90-minute live coding exercise, and a 2025 Canada phone screen included coding challenges. Ask your recruiter which format your loop uses.',
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
    title: 'Free practice for the CrowdStrike round formats',
    intro: 'Free tasks for the formats the accounts describe, from the take-home table\'s markup to the manager conversations.',
    items: [
      {
        label: 'Tables and accessibility',
        description: 'Caption, header cells and scope: the markup the open take-home question starts from.',
        path: '/html/coding/html-tables-accessibility',
      },
      {
        label: 'Fetch and render a list',
        description: 'A small React build with the loading, error and empty states a list of records needs.',
        path: '/react/coding/react-fetch-list-states',
      },
      {
        label: 'Frontend fundamentals quiz',
        description: 'A 15-minute check of browser, CSS, JavaScript and HTTP basics before the spoken round.',
        path: '/guides/interview-blueprint/quiz',
      },
      {
        label: 'Shadow DOM and web components',
        description: 'Custom elements and the shadow DOM, for postings that bring Web Components and Lit into an Ember app.',
        path: '/html/trivia/html-shadow-dom',
      },
      {
        label: 'Frontend system design blueprint',
        description: 'A method for a whiteboard design round such as the 2025 Denmark one.',
        path: '/guides/system-design-blueprint',
      },
      {
        label: 'STAR stories',
        description: 'A structure for the manager, culture and team conversations.',
        path: '/guides/behavioral/stories',
      },
    ],
  },
  sources: {
    kicker: 'Public interview reports and official context',
    title: 'Sources and evidence limits',
    intro: 'The notes say what each source adds to this guide.',
    items: [
      {
        label: CROWDSTRIKE_EM_FE_2025_LABEL,
        url: CROWDSTRIKE_EM_FE_2025_URL,
        note: 'An engineering manager loop that Taro marks as an accepted offer: a recruiter screen, a behavioural hiring manager round, two managers, two engineers on fundamentals, the take-home table from a screenshot, a follow-up with two engineers and a culture interview. Its manager rounds may not apply to individual contributors.',
        kind: 'report',
      },
      {
        label: CROWDSTRIKE_LIST_ROUND_2023_LABEL,
        url: CROWDSTRIKE_LIST_ROUND_2023_URL,
        note: 'A senior loop that Taro dates only to December 2023, without an offer: a recruiter interview, technical discussion with a senior engineering manager, then two engineers taking turns through definition questions, and a generic rejection six days later.',
        kind: 'report',
      },
      {
        label: CROWDSTRIKE_REVIEW_2022_LABEL,
        url: CROWDSTRIKE_REVIEW_2022_URL,
        note: 'A senior loop without an offer, its questions withheld under an NDA: five rounds including HR, a take-home in any language or framework, and a review in which the interviewers did not know React, the candidate\'s choice.',
        kind: 'report',
      },
      {
        label: CROWDSTRIKE_UI_OFFER_2022_LABEL,
        url: CROWDSTRIKE_UI_OFFER_2022_URL,
        note: 'A referral that led to an offer, all on Zoom and with questions withheld under an NDA: a manager interview with some technical knowledge questions, two engineers on the role and values, the take-home, a code review of it with two engineers and a final talk about the team.',
        kind: 'report',
      },
      {
        label: CROWDSTRIKE_UK_2024_LABEL,
        url: CROWDSTRIKE_UK_2024_URL,
        note: 'The only London account, without an offer: two stages of questions read from a list, a home task estimated at 5 hours that took 10, and a rejection whose only feedback was about Ember.',
        kind: 'report',
      },
      {
        label: CROWDSTRIKE_DENMARK_2025_LABEL,
        url: CROWDSTRIKE_DENMARK_2025_URL,
        note: 'The only Denmark account, without an offer: a 90-minute live coding exercise in a language of the candidate\'s choice, then a whiteboard design whose requirements were sent in advance.',
        kind: 'report',
      },
      {
        label: CROWDSTRIKE_CANADA_2025_LABEL,
        url: CROWDSTRIKE_CANADA_2025_URL,
        note: 'The only Canada account, dated only to January 2025 and worded as if heavily rewritten: a recruiter screening, a technical phone screen with coding challenges and architectural discussions, and one design question in an unstated round.',
        kind: 'report',
      },
      {
        label: CROWDSTRIKE_BLIND_2024_LABEL,
        url: CROWDSTRIKE_BLIND_2024_URL,
        note: 'A senior candidate\'s own thread: before the interview the recruiter described a trivia-style round on JavaScript, CSS and frontend fundamentals, and afterwards the poster confirmed it. Replies in 2025 under the same name mention a take-home and a discussion of it, but the page does not attribute them to the poster.',
        kind: 'report',
      },
      {
        label: CROWDSTRIKE_BLIND_ONSITE_2022_LABEL,
        url: CROWDSTRIKE_BLIND_ONSITE_2022_URL,
        note: 'A commenter who declined an offer at the Senior level, answering a 2022 question about the senior frontend loop: a screening on JavaScript in depth, then an on-site with two UI builds and quizzes on performance and JavaScript patterns. The interview date is not given.',
        kind: 'report',
      },
      {
        label: 'CrowdStrike Careers: Interviewing at CrowdStrike',
        url: CROWDSTRIKE_INTERVIEWING_URL,
        note: 'CrowdStrike\'s page for all roles, last modified on 20 October 2026: eight steps from application to background check, possible assessments from coding to a mock customer call, Codeinterview.io for live coding, and no AI unless you are asked to use it. Nothing on it is specific to frontend roles.',
        kind: 'official',
      },
      {
        label: 'CrowdStrike Careers: Emerging Talent Programs',
        url: CROWDSTRIKE_EMERGING_TALENT_URL,
        note: 'CrowdStrike\'s page for internships and new graduate roles: up to three interview rounds, and a technical assessment for technical positions. It does not cover experienced frontend loops.',
        kind: 'official',
      },
      {
        label: 'CrowdStrike: Sr. Engineer - Front End posting (R30396)',
        url: CROWDSTRIKE_FALCON_COMPLETE_POSTING_URL,
        note: 'A remote United Kingdom role on Falcon Complete Core Engineering, read in October 2026: Ember and React, Playwright, QUnit or Mocha, accessible interfaces and very large amounts of data. It says nothing about the interview.',
        kind: 'official',
      },
      {
        label: 'CrowdStrike: Sr. Engineer, Frontend - Data Platform Experiences posting (R30313)',
        url: CROWDSTRIKE_DATA_PLATFORM_POSTING_URL,
        note: 'A hybrid London role on the new Data Platform Experiences team, read in October 2026: Ember at the core with Web Components and Lit coming in, React on AI-adjacent surfaces inside Web Component hosts, TypeScript, charts and dashboards, and UI on top of LLMs and agents.',
        kind: 'official',
      },
    ],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full CrowdStrike practice set',
    copy:
      'Premium opens every locked CrowdStrike question with its practice task and answer guide, and the rest of the Premium library.',
    buttonLabel: 'Unlock the full CrowdStrike practice set',
    src: 'company_preview_crowdstrike',
  },
  about: [
    'CrowdStrike frontend interview preparation',
    'CrowdStrike frontend take-home and review round',
    'Web fundamentals and browser security interview questions',
    'Downloadable files table take-home',
  ],
  indexAnchorLabel: 'CrowdStrike frontend interview questions',
};
