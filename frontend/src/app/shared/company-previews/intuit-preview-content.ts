import type { AuthoredCompanyPreview } from '../../shared/company-previews/authored-company-preview.model';

/**
 * Intuit frontend interview guide. Every prompt is a FrontendAtlas practice version modelled on public,
 * self-reported accounts (three frontend loops on LeetCode Discuss from 2021, 2023 and 2025, one software
 * engineer loop on Taro from 2022, and Blind threads from 2022 and 2024). Nothing here is a leaked, confirmed
 * or official Intuit question, and a handful of accounts cannot establish a fixed loop.
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
  'Intuit frontend interview: the Craft Demo explained (the brief, the length, what the panel grades), the AI round, and 5 practice prompts from public reports.';
export const INTUIT_PREVIEW_CANONICAL_PATH = '/companies/intuit/preview';
export const INTUIT_PREVIEW_TRUST_NOTE =
  'These are FrontendAtlas practice versions modelled on rounds described in public interview reports, not leaked, confirmed or official Intuit questions. A few self-reported loops cannot establish a fixed format; use recruiter-provided material as the source of truth.';

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
      'Prepare with five practice prompts shaped by public frontend accounts from 2021 to 2025: a craft demo app built from a brief and extended live, a typeahead implemented inside a codebase received the day before, a promise retry with a Promise.race polyfill, an LLM user story with streaming output, and JavaScript fundamentals under questioning.',
    caveat:
      'This guide uses public, self-reported interview accounts to create realistic constraints. It does not claim access to private interview material, a fixed interview format, or the stack of every Intuit team.',
    chips: ['5 practice prompts', 'React, JavaScript, AI user stories', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'Prepare for product judgment, not Intuit trivia',
    paragraphs: [
      'Every public frontend account describes the same centre of gravity: a hands-on craft round where you build or extend a small application and defend it, surrounded by JavaScript fundamentals, a medium algorithm screen and, since 2024, an AI component. Candidates report that the panel asks why at every line, expects an error fallback and expects tests that check real conditions rather than coverage. Each prompt below starts with the clarifying questions a strong candidate asks, then the behaviours a strong answer covers, then the miss that usually ends the round.',
      'Two lessons repeat across years. A 2022 account says level 2 and above are expected to have unit testing experience, and a 2023 account lost the loop partly on tests that proved nothing. A 2025 account stalled on a streaming user story by building the transport by hand instead of using the primitive the interviewer expected. Practise tests and streaming until they are routine.',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked October 2026',
    title: 'What the public accounts establish, and what you still need to confirm',
    paragraphs: [
      'Three self-reported frontend loops on LeetCode Discuss inform this guide. November 2025, senior frontend: a 75-minute technical phone interview mixing a project discussion, balanced-brackets and connected-graph problems, hoisting and promise output questions, closures, web security, React memoisation hooks, Context versus Redux, an AI tooling question and accessibility; then a 90-minute round in a codebase received the day before with two of eight user stories (a nested comment component with IndexedDB and a typeahead with tests); a 60-minute round with a promise retry, Promise.race versus any and a race polyfill; a 30-minute round with a DOM tree comparison and an LLM user story expected to use Server-Sent Events; and a manager round on microfrontends, web vitals and workers. October 2023, SE2 frontend: a first round on web performance, security, currying, memoisation and output snippets, then a week-long craft task (an event management system) presented with slides, code and tests to a panel that asked for an error fallback and tests that check conditions. October 2021, SDE2 frontend, Bangalore: a Meeting Rooms app built from a design document the day before and extended live, a 3Sum and kSum round, a JavaScript round on polyfills and recursion, and a manager round.',
      'A 2022 Taro account for a software engineer role describes a 4-to-6-hour virtual loop whose build task was an application that fetches countries from a public API and shows population, flag and languages, with features added live and a note that level 2 and above need unit testing experience. Blind threads add the loop shape candidates call A4A: in October 2024 a front end SDE-II listed a 90-minute coding round with two or three stories, one of them AI-focused, a 60-minute fundamentals and system design round, a 30-minute AI assessor round and a 30-minute hiring manager round; a staff frontend thread lists a 90-minute craft demo, an hour of technical questions, 30 minutes with an AI assessor and 30 minutes with the manager; a 2022 thread says the SWE 2 craft prompt was given on the spot and amounted to fetching data from an API and displaying it. Two backend loops from 2025 confirm the same four-round shape and an AI round that asks about retrieval-augmented generation, system prompts and temperature.',
      'Together these establish that these round types occurred between 2021 and 2025 (the only one of the three LeetCode loops that states a location was in Bangalore, and a 2026 Bay Area candidate listed the same round types before the interview); they do not establish exact wording, the current format, or how every team interviews. Confirm the round structure, whether the craft prompt arrives in advance, the allowed stack and tools, and the AI expectations with the recruiter. Intuit publishes its roles on its careers site; use that for product context, not as evidence of interview content.',
    ],
  },
  roundSpotlights: [
    {
      id: 'craft-demo',
      kicker: 'Round decoder',
      title: 'Intuit Craft Demo for frontend candidates: what it is and what was asked',
      lede: [
        'The Craft Demo is the hands-on centre of Intuit\'s interview day, the loop candidates on Blind call A4A: you build or extend a small application from a brief, present it, walk the panel through the code and add features live while they ask why at every line. Intuit\'s hiring-process page lists it as the first interview of the day at 60 minutes; the recruiter plans reported in 2024 and 2026 give it 90 minutes, followed by a 60-minute technical round and 30 minutes each with an AI assessor and the hiring manager.',
        'The brief arrived in advance in most accounts: a design document the day before in 2021, a codebase with user stories the day before in November 2025, a week-long task in 2023; a 2022 account got the prompt on the spot. Panels expected an error fallback, tests that assert behaviour rather than coverage, and code that survives a feature request under questioning.',
      ],
      facts: [
        { label: 'Position in the loop', value: 'The first interview of the onsite day, after a recruiter call and a 45 to 75 minute technical phone interview; assessor rounds, a 30-minute AI round in loops from 2024 on, and the hiring manager follow.' },
        { label: 'Length', value: '60 minutes on Intuit\'s hiring-process page; 90 minutes in the recruiter plans reported in October 2024 and 2026.' },
        { label: 'The brief', value: 'A design document the day before (2021); a codebase received the day before with two of eight user stories (November 2025); a week-long event-management task presented with slides, code and tests (2023); fetch data from an API and display it, given on the spot (2022).' },
        { label: 'Reported tasks', value: 'A Meeting Rooms app; a countries app that fetches from a public API and shows population, flag and languages; a nested comment component with IndexedDB and a typeahead with tests; an event management system.' },
        { label: 'What the panel grades', value: 'The why behind every line, a visible error fallback, tests that check real conditions, and features added live without breaking the structure; a 2022 account says level 2 and above are expected to have unit-testing experience.' },
        { label: 'Since 2024', value: 'A 30-minute AI assessor round and AI-focused user stories sit beside the craft demo (October 2024 and 2026 recruiter plans, November 2025 loop).' },
        { label: 'Sources', value: 'LeetCode, November 2025, October 2023 and October 2021; Taro, September 2022; Blind threads from October 2024 and 2026; Intuit\'s hiring-process page. All are listed under Sources below with what each can establish.' },
      ],
      practiceLink: { label: 'Rehearse the craft demo build', fragment: 'craft-demo-build-and-extend' },
      processLink: { label: 'See the craft demonstration row in the reported process', fragment: 'intuit-interview-process-1-stage-craft-demonstration' },
    },
  ],
  roleLenses: {
    kicker: 'Role lenses',
    title: 'Two product contexts for practising transferable frontend judgment',
    intro:
      'These are preparation lenses derived from the public prompts and the kinds of screens a financial software product runs, not claimed team assignments. Choose the lens closest to the role and keep the reasoning framework-neutral.',
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
    title: 'Five Intuit frontend interview practice questions',
    intro:
      'For each prompt, clarify the contract, explain ownership and trade-offs, implement or diagram the smallest credible slice, and test the failure cases. Each prompt links to the public report it is modelled on and to a practice page.',
    itemListName: 'Five Intuit frontend interview practice prompts',
    items: [
      {
        id: 'craft-demo-build-and-extend',
        title: 'Build a small app from a brief, then extend it live in the craft demo',
        statement:
          'You receive a short brief, sometimes the day before and sometimes on the spot: fetch a list from an API, show selected fields, handle failures, add tests. In the session, walk the panel through the code, then add the features they ask for while they question every decision.',
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
          'In a conversational round, write a currying function and a memoization function, predict the output of hoisting and promise snippets, explain closures and their uses, and implement a function that decides whether two DOM trees are identical. The currying, memoization and snippet questions come from the October 2023 loop; the closures question and the DOM comparison from the November 2025 loop.',
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
    kicker: 'Public mini walkthrough',
    title: 'Scope the craft demo app before the panel joins',
    intro:
      'Treat this as a representative exercise, not a description of the reported one. Work from the brief toward the three states and the tests, and say each decision out loud.',
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
    intro: 'Every day ends with code, a test, a design artifact, or a question you can use in the real process.',
    days: [
      { day: 'Day 1', focus: 'Algorithm screen: balanced brackets with extra characters, connected components, 3Sum and kSum, with stated complexity.', artifact: 'Four solved problems with tests.' },
      { day: 'Day 2', focus: 'JavaScript fundamentals: hoisting and promise output prediction, closures, currying, memoization.', artifact: 'Six predicted snippets and two implemented helpers.' },
      { day: 'Day 3', focus: 'Craft demo: build a fetch-and-display app with loading, empty and error states and three behavioural tests.', artifact: 'A small app you can extend on request.' },
      { day: 'Day 4', focus: 'Unfamiliar codebase: clone an open-source app, add a typeahead following its patterns, write component tests.', artifact: 'A pull request against the sample app.' },
      { day: 'Day 5', focus: 'Promises and DOM: retry with delay, Promise.race and any, identical DOM tree comparison.', artifact: 'Three drills with edge-case tests.' },
      { day: 'Day 6', focus: 'AI user story: stream a model response with Server-Sent Events, handle errors and malformed output, test each branch.', artifact: 'A streaming component with mocked transport tests.' },
      { day: 'Day 7', focus: 'Mock loop: craft demo, technical round, AI discussion, hiring manager, each narrated, plus web security, web vitals and accessibility questions.', artifact: 'A list of the questions you will ask the recruiter about format, stack and tools.' },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common Intuit frontend interview preparation questions',
    items: [
      { question: 'What is the Intuit Craft Demo for frontend candidates?', answer: 'The hands-on centre of the interview day: you build or extend a small application from a brief, present it, walk the panel through the code and add features live while they ask why at every line. The brief arrived in advance in most accounts and on the spot in one; the official page gives it 60 minutes and recent recruiter plans 90. Panels expected an error fallback and tests that assert behaviour.' },
      { question: 'Are these the real Intuit questions?', answer: 'No. They are FrontendAtlas practice versions modelled on round types described in public, self-reported accounts. The wording, the data and the test cases are ours.' },
      { question: 'How much of a frontend loop is about AI?', answer: 'Accounts from 2024 and 2025 describe a 30-minute AI assessor round, an AI tooling question in the phone screen and one AI-focused user story in the coding round. Expect to explain retrieval-augmented generation, prompts and model output handling, and to code against a model endpoint.' },
      { question: 'Do I really need unit tests in the craft demo?', answer: 'A 2022 account says level 2 and above are expected to have unit testing experience, and a 2023 account was challenged on tests that checked nothing. Write a few tests that assert behaviour.' },
      { question: 'Does the craft prompt arrive in advance?', answer: 'Both happen in the accounts: a design document the day before in 2021, a codebase the day before with the user stories given on the spot in 2025, a week-long task in 2023, and an on-the-spot prompt in 2022. Ask the recruiter which applies to your loop.' },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Build the underlying skills with free practice',
    intro:
      'These public pages cover the promise, streaming, typeahead and fundamentals skills used by the practice prompts. They are supporting drills, not claimed Intuit questions.',
    items: [
      { label: 'Promise.any (first fulfilled)', description: 'The sibling of the Promise.race polyfill.', path: '/javascript/coding/js-promise-any' },
      { label: 'Stream to text', description: 'Read a ReadableStream into a string, the base of streaming output.', path: '/javascript/coding/js-stream-to-text' },
      { label: 'Sleep or delay promise', description: 'The delay primitive inside a retry.', path: '/javascript/coding/js-sleep' },
      { label: 'React autocomplete search starter', description: 'A typeahead with debouncing and stale-response handling.', path: '/react/coding/react-autocomplete-search-starter' },
      { label: 'Hoisting and the temporal dead zone', description: 'Why var logs undefined while let throws.', path: '/javascript/trivia/js-hoisting' },
      { label: 'DOM XSS prevention', description: 'Dangerous sinks and safe APIs for the web security questions.', path: '/javascript/trivia/js-xss-dom-sinks' },
      { label: 'useMemo vs useCallback', description: 'When memoising makes a component slower.', path: '/react/trivia/react-usememo-vs-usecallback' },
    ],
  },
  sources: {
    kicker: 'Public interview reports and official context',
    title: 'Sources and evidence limits',
    intro: 'These links support the public context used by the guide. Their notes state what each source can and cannot establish about preparation.',
    items: [
      { label: INTUIT_SENIOR_2025_LABEL, url: INTUIT_SENIOR_2025_URL, note: 'One self-reported senior frontend loop that ended in a lower-level offer. It lists the technical phone interview topics, the two-of-eight user stories in a provided codebase, the promise retry and race polyfill, the DOM tree comparison and the LLM user story; it cannot establish exact wording or the current format.', kind: 'report' },
      { label: INTUIT_SE2_2023_LABEL, url: INTUIT_SE2_2023_URL, note: 'One self-reported SE2 frontend loop without an offer. It establishes the currying and memoization exercises, the output snippets and the week-long craft task with its error fallback and test expectations.', kind: 'report' },
      { label: INTUIT_SDE2_2021_LABEL, url: INTUIT_SDE2_2021_URL, note: 'One self-reported SDE2 frontend loop with an offer. It establishes the craft demo built from a design document the day before and extended live, the 3Sum and kSum round and the JavaScript polyfill round.', kind: 'report' },
      { label: INTUIT_TARO_2022_LABEL, url: INTUIT_TARO_2022_URL, note: 'One self-reported software engineer loop without an offer. It establishes the fetch-countries build task with live feature additions and the note that level 2 and above need unit testing experience; it is not frontend-specific.', kind: 'report' },
      { label: INTUIT_BLIND_2024_LABEL, url: INTUIT_BLIND_2024_URL, note: 'One candidate describing the updated four-round format for a front end SDE-II, including the AI-focused story and the AI assessor round. The thread reports no questions.', kind: 'report' },
      { label: 'Blind: Intuit A4A interview plan for a staff frontend engineer, Bay Area, August 2026', url: INTUIT_BLIND_STAFF_URL, note: 'A candidate listing the planned rounds before the interview: a 90-minute craft demo, an hour of technical questions, 30 minutes with an AI assessor and 30 minutes with the manager. The single reply claims a hard algorithm problem in under 40 minutes; treat it as unverified.', kind: 'report' },
      { label: 'Blind: Intuit craft demo tips for SWE 2, September 2022', url: INTUIT_BLIND_CRAFT_URL, note: 'One candidate reporting that the SWE 2 craft prompt arrived on the spot, amounted to fetching data from an API and displaying it, and that unit testing is looked for at level 2.', kind: 'report' },
      { label: 'LeetCode Discuss: Intuit SWE-2 interview experience, October 2025', url: INTUIT_SWE2_2025_URL, note: 'A backend-leaning loop with an offer, used only for the four-round shape and the AI round topics; its coding tasks were a Python API, SQL and one algorithm problem.', kind: 'report' },
      { label: 'LeetCode Discuss: Intuit senior software engineer interview, May 2025', url: INTUIT_SENIOR_BE_2025_URL, note: 'A backend-leaning loop without an offer, used only for the craft demo user-story format and the AI round; it names no frontend tasks.', kind: 'report' },
      { label: 'Intuit careers', url: 'https://jobs.intuit.com/', note: 'Official roles and offices for product context only, not evidence of interview content or format.', kind: 'official' },
    ],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full Intuit practice set',
    copy:
      'This public guide is complete enough to plan a focused week. Premium unlocks the streaming chat UI, the curry and memoization drills, the twin DOM tree exercise, the component-and-state design case and the broader company-tagged editorial set.',
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
