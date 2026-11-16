import type { AuthoredCompanyPreview } from '../../shared/company-previews/authored-company-preview.model';

/**
 * Intuit frontend interview guide. The reported questions live with the process table
 * (company-interview-processes.ts); the prompts here are the answer guides of several of them. The sources are
 * candidates' own posts on LeetCode Discuss, Taro and Blind from 2021 to 2026, a few of them full-stack or general
 * software engineer loops kept for their frontend tasks, and Intuit's hiring-process page. Nothing here is a leaked,
 * confirmed or official Intuit question, and the accounts cannot establish a fixed loop.
 */
const INTUIT_SENIOR_2025_URL = 'https://leetcode.com/discuss/post/7320927/';
const INTUIT_SENIOR_2025_LABEL = 'Public report: Intuit senior frontend engineer loop, November 2025';
const INTUIT_SE2_2023_URL = 'https://leetcode.com/discuss/post/4167001/';
const INTUIT_SE2_2023_LABEL = 'Public report: Intuit SE2 frontend loop, October 2023';
const INTUIT_SDE2_2021_URL = 'https://leetcode.com/discuss/post/1618037/';
const INTUIT_SDE2_2021_LABEL = 'Public report: Intuit SDE2 frontend loop, Bangalore, October 2021';
const INTUIT_TARO_2022_URL =
  'https://www.jointaro.com/interviews/companies/intuit/experiences/software-engineer-los-angeles-ca-september-1-2022-no-offer-positive-60b4e7cb/';
const INTUIT_TARO_2022_LABEL = 'Public report: Intuit software engineer loop, September 2022 (Taro, approximate date)';
const INTUIT_BLIND_2024_URL =
  'https://www.teamblind.com/post/final-interview-for-front-end-engineer-at-intuit-new-coding-format-5jbsqcv5';
const INTUIT_BLIND_2024_LABEL = 'Public thread: Intuit front end engineer final interview, new coding format, October 2024';
const INTUIT_BLIND_STAFF_URL = 'https://www.teamblind.com/post/intuit-a4a-interview-staff-swe-fe-bay-area-8-yoe-8ppjug5d';
const INTUIT_BLIND_CRAFT_URL = 'https://www.teamblind.com/post/intuit-craft-demo-tips-swe-2-pqztez7j';
const INTUIT_SWE2_2025_URL = 'https://leetcode.com/discuss/post/7313117/';
const INTUIT_SENIOR_BE_2025_URL = 'https://leetcode.com/discuss/post/6707615/';

export const INTUIT_PREVIEW_TITLE = 'Intuit Frontend Interview Questions and Craft Demo Guide';
export const INTUIT_PREVIEW_H1 = 'Intuit Frontend Interview Questions';
export const INTUIT_PREVIEW_DESCRIPTION =
  'Intuit frontend interview: the Craft Demo explained (the brief, the length, what the panel grades), the AI round, and {#questions} reported questions from public reports.';
export const INTUIT_PREVIEW_CANONICAL_PATH = '/companies/intuit/preview';
export const INTUIT_PREVIEW_TRUST_NOTE =
  'These are tasks candidates described in their own posts on LeetCode Discuss, Taro and Blind, put in our words. None is an official or leaked Intuit question; we wrote the answer guides ourselves. Loops between 2021 and 2026 differ, as {reports} public reports show, so ask your recruiter how yours will run.';

export const INTUIT_COMPANY_PREVIEW: AuthoredCompanyPreview = {
  slug: 'intuit',
  label: 'Intuit',
  title: INTUIT_PREVIEW_TITLE,
  h1: INTUIT_PREVIEW_H1,
  description: INTUIT_PREVIEW_DESCRIPTION,
  canonicalPath: INTUIT_PREVIEW_CANONICAL_PATH,
  trustNote: INTUIT_PREVIEW_TRUST_NOTE,
  hero: {
    kicker: 'Public Intuit prep guide',
    subtitle:
      'Frontend accounts from 2021 to 2026 describe a technical phone interview, then an interview day built around the craft demo: you build a small app against a brief, demo it to a panel and answer for its code, before technical rounds, a 30-minute AI round in recent loops and the hiring manager. The {questions} reported questions follow the round table, and the first is open to everyone.',
    caveat:
      'Most accounts come from India and the United States and range from level-2 to staff engineers; a few are full-stack or general software engineer loops, kept for their frontend tasks. The AI round comes from two plans, posted in 2024 and 2026, and three completed 2025 loops: one staff frontend loop and two general software engineer loops.',
    chips: ['{#questions} reported questions', '{#reports} public reports, 2021–2026', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'What Intuit panels push on',
    paragraphs: [
      'The craft demo carries the day in every account that describes it: a small app built against a brief, then defended line by line before four or five people. Two 2022 accounts say Intuit looks for unit-testing experience from level 2, a 2023 panel asked for an error fallback page and for tests that check real conditions, and in 2024 a staff candidate\'s last technical round went back to a helper in the build and had it rewritten without built-ins. Build your practice app expecting any file to be read aloud.',
      'Around the craft day sit spoken JavaScript and React questions, short promise and DOM tasks and algorithm problems, and since 2024 an AI component: a 30-minute AI round in recruiter plans and a model-backed story in a 2025 loop. That 2025 candidate stalled by building the stream handling by hand when the interviewer expected Server-Sent Events, so know the browser\'s streaming primitives before the day.',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked November 2026',
    title: 'Where these accounts come from, and what to settle with the recruiter',
    paragraphs: [
      'The accounts are candidates\' own posts from 2021 to 2026: frontend loops on LeetCode Discuss and Taro, a few full-stack and general software engineer loops kept for their frontend tasks, and Blind threads, some written before the interview from the recruiter\'s plan. Intuit\'s hiring-process page gives the official outline of the interview day. Each account is one loop: together they show which rounds ran and roughly what they covered, not this year\'s wording or how your team will run its day.',
      'Settle three things with the recruiter: whether the craft brief comes before the day or at its start, whether you build in your own environment (a 2024 candidate had to paste a 90-minute build into a shared editor with a minute left), and what the AI round expects. The {reports} public reports are listed under Sources.',
    ],
  },
  roundSpotlights: [
    {
      id: 'craft-demo',
      kicker: 'Round decoder',
      title: 'Intuit Craft Demo for frontend candidates: how the build and the panel run',
      lede: [
        'The Craft Demo is the centre of Intuit\'s interview day, part of what an Intuit blog post calls its Assess for Awesome (A4A) process: you build a small app against a brief, demo it to a panel, walk through the code and change it on request while they question your choices. Intuit\'s hiring-process page gives engineers a 90-minute set-up block to solve a technical question on their own, then a 60-minute demonstration to four hiring-team members; plans from 2024 and 2026 give the craft round 90 minutes.',
        'When the brief arrives depends on the loop: ahead of the day in some (a design document the day before, a small project or a piece of work finished at home, a repository shared a day early), at the start of the day in others, built in your own environment or, in a 2024 plan, in GitPod. Panels asked about tests, failure states and individual lines, and later rounds returned to the code.',
      ],
      facts: [
        { label: 'Position in the loop', value: 'The first interview of the onsite day, after a recruiter call and a technical phone interview; technical or assessor rounds, a 30-minute AI round in loops from 2024 on and the hiring manager follow, in recent accounts on the same day.' },
        { label: 'Length', value: '90 minutes of building on Intuit\'s hiring-process page and in accounts and plans from 2024 to 2026, then the demo: 60 minutes on the official page and a separate module in a 2023 and a 2024 account. A 2024 Bangalore loop gives the craft demo round about 45 minutes.' },
        { label: 'The brief', value: 'Ahead of the day in 2021, 2022, 2023 and 2025 accounts, from a day to more than a week early; handed over at the start of the day in 2022, 2023 and 2024 accounts, with a choice of front end or back end in 2022.' },
        { label: 'The panel', value: 'Four hiring-team members on the official page and in a 2025 staff loop, five in a 2022 loop in India. A 2024 staff candidate was also asked to open with a few slides about themselves.' },
        { label: 'What the panel looked at', value: 'Tests and how the app behaves when a request fails, then individual lines of code; two 2022 accounts say Intuit expects unit-testing experience from level 2, and a 2024 staff loop returned to the build in a later technical round.' },
        { label: 'Since 2024', value: 'A 30-minute AI assessor round sits beside the craft demo in recruiter plans from October 2024 and August 2026 and in a completed 2025 staff loop; the 2024 plan also put one AI-focused story into the craft coding round.' },
      ],
      practiceLink: { label: 'Rehearse the build with the free fetch-and-list task', path: '/react/coding/react-fetch-list-states' },
      processLink: { label: 'See the craft demonstration row in the reported process', fragment: 'intuit-interview-process-1-stage-craft-demonstration' },
    },
  ],
  roleLenses: {
    kicker: 'Role lenses',
    title: 'Data screens or model-backed features: where to practise',
    intro:
      'The reported builds are mostly data screens: lists loaded from an API and forms that write through one. Recent loops add features that call a language model. Practise in whichever is nearer the team you applied to; neither lens says which team you would join.',
    items: [
      {
        title: 'Data-entry product screens',
        description:
          'Forms, lists and detail pages that load from an API, must fail gracefully and must be covered by tests before they ship.',
        practiceFocus:
          'Loading, empty and error states; an error fallback page; tests that assert behaviour rather than coverage; accessible controls.',
      },
      {
        title: 'AI-assisted features',
        description:
          'Features that call a language model, stream the result into the page and must handle slow, partial or malformed output.',
        practiceFocus:
          'Server-Sent Events and fetch streams, cancellation, retry with delay, validating model output, and tests for each output case.',
      },
    ],
  },
  prompts: {
    kicker: 'Representative practice prompts',
    title: 'Answer guides for the reported Intuit questions',
    intro:
      'For each question, clarify the contract, explain ownership and trade-offs, build the smallest credible slice, and test the failure cases.',
    itemListName: 'Intuit answer guides',
    items: [
      {
        id: 'craft-demo-build-and-extend',
        title: 'Build a small app from a brief, then extend it live in the craft demo',
        statement:
          'You get a short brief: in a 2022 loop, an app that calls a public countries API and lists each country with its population, flag and languages. Build it with loading, empty and error states and a few tests, then walk the panel through the code and add the features they ask for while they question every decision.',
        whatThisMeasures:
          'Component boundaries and state from a brief, honest loading and error states, tests that check conditions, and the ability to extend code under questioning.',
        clarifyFirst: [
          'Confirm whether the brief arrives in advance, which stack is allowed, and whether the panel wants a presentation before the code.',
          'Confirm the one or two features most likely to be requested live, such as sorting the response or adding a detail view.',
        ],
        strongAnswer: [
          'Separate data fetching from rendering so a new field or a new sort is a small change in one place.',
          'Show the three states on screen: loading, empty and a visible error fallback, and explain what each does for the user.',
          'Write a few tests that assert behaviour, such as the error fallback appearing when the request fails, rather than tests that only raise coverage.',
          'Narrate the why behind each choice, and name the next refactor instead of making it under time pressure.',
        ],
        commonMiss:
          'Presenting a polished demo with tests that assert nothing, so the first "what is the use of this test" question has no answer.',
        resourceLabel: 'Work through component and state design from a mock (Premium)',
        resourcePath: '/system-design/ui-component-state-from-mock',
        reportedRound: { label: INTUIT_SDE2_2021_LABEL, url: INTUIT_SDE2_2021_URL },
      },
      {
        id: 'typeahead-in-an-unfamiliar-codebase',
        title: 'Implement a typeahead in a codebase you received yesterday, then test it',
        statement:
          'Inside a repository you set up the day before, implement a typeahead component that queries as the user types, shows suggestions, handles no results and lets the user pick one, then cover it with unit tests.',
        whatThisMeasures:
          'Reading an unfamiliar codebase quickly, debouncing and cancelling stale requests, keyboard and focus handling, and component tests with Jest and a testing library.',
        clarifyFirst: [
          'Confirm where suggestions come from, how many to show, and whether selection must be keyboard-accessible.',
          'Confirm which test runner and utilities the codebase already has before writing the first test.',
        ],
        strongAnswer: [
          'Follow the existing patterns in the repository for data access and state rather than importing a new approach.',
          'Debounce input, ignore responses that arrive out of order, and show empty and error states.',
          'Expose the list with proper roles and arrow-key navigation, and close it on selection and on outside click.',
          'Write tests for typing, suggestion rendering, selection and the empty state before polishing styles.',
        ],
        commonMiss:
          'Finishing the component quickly and then running out of time on tests because the testing utilities were never practised.',
        resourceLabel: 'Practice the autocomplete search starter',
        resourcePath: '/react/coding/react-autocomplete-search-starter',
        reportedRound: { label: INTUIT_SENIOR_2025_LABEL, url: INTUIT_SENIOR_2025_URL },
      },
      {
        id: 'promise-retry-and-race-polyfill',
        title: 'Implement a promise retry with delay, then a Promise.race polyfill',
        statement:
          'Write a function that takes a promise-returning function, retries it a given number of times with a delay between attempts and rejects with the last error. Then explain Promise.race versus Promise.any and implement race without the built-in.',
        whatThisMeasures:
          'Promise mechanics, timers inside promise chains, settling exactly once, and the difference between first-settled and first-fulfilled semantics.',
        clarifyFirst: [
          'Confirm whether the delay is fixed or grows, and whether a retry should stop on specific errors.',
          'Confirm the expected behaviour for an empty iterable and for non-promise values in the race polyfill.',
        ],
        strongAnswer: [
          'Resolve on the first success and reject only after the last attempt, passing the final error through.',
          'Use a single outer promise and a recursive attempt function so each retry waits for the delay.',
          'Explain that race settles with the first settled promise while any resolves with the first fulfilled one and rejects only when all reject.',
          'In the polyfill, wrap each value with Promise.resolve and rely on the fact that a promise settles once.',
        ],
        commonMiss:
          'Calling resolve and reject on the same attempt path, or forgetting that race never resolves for an empty iterable.',
        resourceLabel: 'Practice the Promise.any sibling drill',
        resourcePath: '/javascript/coding/js-promise-any',
        reportedRound: { label: INTUIT_SENIOR_2025_LABEL, url: INTUIT_SENIOR_2025_URL },
      },
      {
        id: 'llm-user-story-with-streaming',
        title: 'Deliver an LLM user story with streaming output, error handling and tests',
        statement:
          'As a user, I want to generate a text description for my project and see it on the details page. Use the provided model endpoint, stream the output into the page, handle errors and unexpected output, and add unit tests for the different output cases.',
        whatThisMeasures:
          'Choosing a streaming primitive the codebase supports, rendering partial output, cancelling and retrying, validating model output before showing it, and testing each branch.',
        clarifyFirst: [
          'Confirm the endpoint contract: Server-Sent Events, a fetch stream or a single response, and what an error looks like on the wire.',
          'Confirm what the page should show for empty, truncated or malformed output.',
        ],
        strongAnswer: [
          'Use the streaming primitive the codebase or interviewer expects, such as EventSource for Server-Sent Events, instead of hand-rolling a parser.',
          'Append chunks to visible text as they arrive, keep a cancel control, and show a clear state when the stream ends early.',
          'Validate and sanitise the final output before rendering it, and fall back to a message the user can act on.',
          'Write tests for a normal stream, an error mid-stream and malformed output, mocking the transport.',
        ],
        commonMiss:
          'Building the transport by hand, running out of time, and never reaching the error handling or the tests the story asked for.',
        resourceLabel: 'Practice the chat UI with a streaming response (Premium)',
        resourcePath: '/react/coding/react-chat-streaming-ui',
        reportedRound: { label: INTUIT_SENIOR_2025_LABEL, url: INTUIT_SENIOR_2025_URL },
      },
      {
        id: 'javascript-fundamentals-under-questioning',
        title: 'Answer JavaScript fundamentals under questioning: currying, memoization, output prediction, DOM comparison',
        statement:
          'In a conversational round, write a currying function and a memoization function, predict the output of hoisting and promise snippets, explain closures and their uses, and implement a function that decides whether two DOM trees are identical. The currying and memoization questions come from the October 2023 loop, the closures question and the DOM comparison from the November 2025 loop, and both loops asked for output prediction.',
        whatThisMeasures:
          'Scope and the temporal dead zone, microtask ordering, closures as a design tool, pure recursion over trees, and the ability to explain while coding.',
        clarifyFirst: [
          'Confirm whether currying must support any arity and whether memoization should key on all arguments.',
          'Confirm whether the DOM comparison must include attributes and text nodes or only tags.',
        ],
        strongAnswer: [
          'Walk through hoisting by separating declaration from initialisation, and through promise snippets by separating synchronous executor code from then callbacks.',
          'Implement currying by collecting arguments until the original length is met, and memoization with a cache keyed on serialised arguments.',
          'Compare DOM trees recursively: node type, tag, attributes, text content, then children in order.',
          'Name the trade-off in each answer, such as memory growth in the memoization cache.',
        ],
        commonMiss:
          'Predicting output by intuition instead of ordering the synchronous code, the microtasks and the timers explicitly.',
        resourceLabel: 'Practice the curry function (Premium)',
        resourcePath: '/javascript/coding/js-curry-function',
        reportedRound: { label: INTUIT_SE2_2023_LABEL, url: INTUIT_SE2_2023_URL },
      },
    ],
  },
  walkthrough: {
    kicker: 'Mini walkthrough',
    title: 'Scope the craft demo app before the panel joins',
    intro:
      'The open countries question, scoped before the panel joins: what to pin down, where to split the code, how a failure shows and which tests to write.',
    steps: [
      { title: 'Pin the brief', description: 'Which fields to show, which API to call, what counts as done, and which stack the panel expects.' },
      { title: 'Separate fetch from render', description: 'One data module with a typed result, one component that renders loading, empty, error and data.' },
      { title: 'Make failure visible', description: 'An error fallback with a retry, not a blank screen, and a log line that would help in production.' },
      { title: 'Write the tests that matter', description: 'The fallback appears on failure, the list renders the fields, a sort changes the order; nothing that only raises coverage.' },
    ],
  },
  prepPlan: {
    kicker: 'Actionable preparation',
    title: 'A 7-day Intuit frontend interview preparation plan',
    intro:
      'Seven days built on the Intuit accounts: a phone interview of spoken questions and an algorithm, a craft build you defend line by line, follow-up coding rounds, the AI round and the manager. Each day leaves something you can show.',
    days: [
      { day: 'Day 1', focus: 'Phone interview: answer JavaScript and React questions out loud, then solve one algorithm problem against a 45-minute clock and state its complexity.', artifact: 'Two timed solutions and a page of notes on the questions you hesitated over.' },
      { day: 'Day 2', focus: 'Craft build: from a one-paragraph brief, build a small app in 90 minutes in your own environment, with loading, empty and error states, and stub what you cannot finish.', artifact: 'The app and a short list of what you stubbed and why.' },
      { day: 'Day 3', focus: 'Tests that prove something: unit tests for each state and the main interaction, each one something you could defend to a panel.', artifact: 'A test file you can explain line by line.' },
      { day: 'Day 4', focus: 'Demo and defence: present the app in 30 to 40 minutes to someone who then picks any line and asks why, and add one feature they request.', artifact: 'A recorded demo and the three answers you would change.' },
      { day: 'Day 5', focus: 'Follow-up coding: short JavaScript tasks and one algorithm problem in 30 to 60 minutes, then a change to your own craft code on request.', artifact: 'Three timed tasks with edge-case tests.' },
      { day: 'Day 6', focus: 'AI round: 30 minutes on AI in your work and in products; read up on retrieval-augmented generation, prompts and model settings such as temperature.', artifact: 'Short spoken answers of about two minutes each.' },
      { day: 'Day 7', focus: 'Manager round and a mock day: 30 minutes on projects and behaviour, then one full run of build, demo, technical round and AI round.', artifact: 'Your questions for the recruiter: when the brief arrives, where you build it and what the AI round covers.' },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common Intuit frontend interview preparation questions',
    items: [
      { question: 'What is the Intuit Craft Demo for frontend candidates?', answer: 'The hands-on centre of the interview day: you build a small app against a brief, demo it to a panel of four or five, walk through the code and change it on request. The brief came ahead of the day in some loops and at its start in others; the official page gives the demonstration 60 minutes, and recent plans give the build 90. Panels asked about tests and about what the app does when a request fails.' },
      { question: 'Are these the real Intuit questions?', answer: 'No. Each is a task a candidate described on LeetCode Discuss, Taro or Blind, retold in our words, and none is leaked or confirmed by Intuit. FrontendAtlas wrote the answer guides and chose the practice tasks.' },
      { question: 'How much of a frontend loop is about AI?', answer: 'Recruiter plans from 2024 and 2026 include a 30-minute round with an AI assessor, and a 2025 staff account went through one. A 2025 phone interview turned to generative AI, retrieval-augmented generation and fine-tuning although the job description did not mention AI, and the 2024 plan put one AI-focused story into the craft coding round. Two 2025 general software engineer loops describe the AI round asking about retrieval-augmented generation, system prompts and temperature.' },
      { question: 'Do I really need unit tests in the craft demo?', answer: 'Two 2022 accounts say Intuit looks for unit-testing experience from level 2, one candidate learning it only after the final round, and a 2023 panel questioned what the candidate\'s tests actually checked. Write a few tests that check behaviour and be ready to explain each one.' },
      { question: 'Does the craft prompt arrive in advance?', answer: 'It depends on the loop: a design document the day before in 2021, a small project or a piece of work finished at home in 2022 and 2023, a repository a day ahead in 2025, and a prompt handed over at the start of the day in 2022, 2023 and 2024 accounts. Ask the recruiter which applies to yours.' },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Build the underlying skills with free practice',
    intro:
      'Free drills for skills the Intuit rounds lean on: a list that loads from an API for the craft build, algorithm practice for the phone interview, DOM injection risks, and what useMemo and useCallback cost a component. The reported questions themselves are in the list above.',
    items: [
      { label: 'React fetch and render a list', description: 'Loading, empty and error states with a retry button.', path: '/react/coding/react-fetch-list-states' },
      { label: 'DSA for frontend loops', description: 'For the algorithm problem in the phone interview and the follow-up rounds.', path: '/guides/interview-blueprint/dsa-for-fe' },
      { label: 'DOM XSS prevention', description: 'Dangerous sinks and the safe APIs to use instead.', path: '/javascript/trivia/js-xss-dom-sinks' },
      { label: 'useMemo vs useCallback', description: 'When memoising makes a component slower.', path: '/react/trivia/react-usememo-vs-usecallback' },
    ],
  },
  sources: {
    kicker: 'Public interview reports and official context',
    title: 'Sources and evidence limits',
    intro: 'These links support the public context used by the guide. Their notes state what each source can and cannot establish about preparation.',
    items: [
      { label: INTUIT_SENIOR_2025_LABEL, url: INTUIT_SENIOR_2025_URL, note: 'One self-reported senior frontend loop in India that ended in an offer one level lower: a 75-minute technical phone interview, then on one day a 90-minute craft round in a repository sent the day before, technical rounds of 60 and 30 minutes and a manager round. One loop, not a fixed format.', kind: 'report' },
      { label: INTUIT_SE2_2023_LABEL, url: INTUIT_SE2_2023_URL, note: 'One self-reported SE2 frontend loop without an offer: a first technical round of spoken questions and short coding tasks, then a craft task with over a week to prepare and a panel presentation, followed by assessor, team member and manager rounds.', kind: 'report' },
      { label: INTUIT_SDE2_2021_LABEL, url: INTUIT_SDE2_2021_URL, note: 'One self-reported SDE2 frontend loop with an offer: a craft round built from a design document shared the day before and extended live, an hour of data structures and algorithms, an hour of JavaScript and 30 minutes with the hiring manager.', kind: 'report' },
      { label: INTUIT_TARO_2022_LABEL, url: INTUIT_TARO_2022_URL, note: 'One self-reported software engineer loop without an offer: a recruiter screen, a 45-minute technical interview, then a 4-to-6-hour virtual day in which the candidate built an app against a public countries API, answered two more coding questions and added features on request, and 30 minutes with the hiring manager. It says Intuit requires unit-testing experience from level 2.', kind: 'report' },
      { label: INTUIT_BLIND_2024_LABEL, url: INTUIT_BLIND_2024_URL, note: 'A recruiter\'s plan for a front end SDE-II final round, posted before the interview: 90 minutes of coding stories with the panel, one of them about AI, 60 minutes on fundamentals and system design, 30 minutes with an AI assessor and 30 with the hiring manager, in GitPod. The thread reports no questions.', kind: 'report' },
      { label: 'Blind: Intuit A4A interview plan for a staff frontend engineer, Bay Area, August 2026', url: INTUIT_BLIND_STAFF_URL, note: 'A candidate listing the planned rounds before the interview: a 90-minute craft demo, an hour of technical questions, 30 minutes with an AI assessor and 30 minutes with the manager. The single reply claims a hard algorithm problem in under 40 minutes; treat it as unverified.', kind: 'report' },
      { label: 'Blind: Intuit craft demo tips for SWE 2, September 2022', url: INTUIT_BLIND_CRAFT_URL, note: 'A SWE 2 candidate asking for tips before the final round, who came back a month later: the craft prompt was handed over on the spot with a choice of front end or back end, and unit testing is what Intuit looks for at level 2.', kind: 'report' },
      { label: 'LeetCode Discuss: Intuit SWE-2 interview experience, October 2025', url: INTUIT_SWE2_2025_URL, note: 'A backend-leaning loop with an offer, used only for the four-round shape and the AI round topics; its coding tasks were a Python API, SQL and one algorithm problem.', kind: 'report' },
      { label: 'LeetCode Discuss: Intuit senior software engineer interview, May 2025', url: INTUIT_SENIOR_BE_2025_URL, note: 'A backend-leaning loop without an offer, used only for the craft demo user-story format and the AI round; it names no frontend tasks.', kind: 'report' },
      { label: 'Intuit careers', url: 'https://jobs.intuit.com/', note: 'Intuit\'s job listings with roles and offices: useful for the product you would work on, silent on the interview.', kind: 'official' },
    ],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full Intuit practice set',
    copy:
      'Premium unlocks the streaming chat UI, the curry and memoization drills, the twin DOM tree exercise, the component-and-state design case and the broader company-tagged editorial set.',
    buttonLabel: 'Unlock the full Intuit practice set',
    src: 'company_preview_intuit',
  },
  about: [
    'Intuit frontend interview preparation',
    'Craft demo application build',
    'Promise retry and race polyfill',
    'Streaming LLM user stories',
  ],
  indexAnchorLabel: 'Intuit frontend interview questions',
};
