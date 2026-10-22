import type { AuthoredCompanyPreview } from '../../shared/company-previews/authored-company-preview.model';

/**
 * Revolut frontend interview guide. Every prompt is a FrontendAtlas practice version modelled on public,
 * self-reported frontend accounts (six on Taro from 2023 to 2025, one Blind thread from 2022) and on
 * the Revolut Tech post on web engineering. Nothing here is a leaked, confirmed or official Revolut question, and a
 * handful of accounts cannot establish a fixed loop.
 */
const REVOLUT_APRIL_2025_URL =
  'https://www.jointaro.com/interviews/companies/revolut/experiences/frontend-developer-warsaw-masovia-april-1-2025-no-offer-neutral-71032bb4/';
const REVOLUT_APRIL_2025_LABEL = 'Public report: Revolut frontend developer loop, April 2025';
const REVOLUT_MAY_2025_URL =
  'https://www.jointaro.com/interviews/companies/revolut/experiences/frontend-engineer-barcelona-may-1-2025-no-offer-neutral-3c58f9b9/';
const REVOLUT_MAY_2025_LABEL = 'Public report: Revolut frontend engineer loop, May 2025';
const REVOLUT_MADRID_2024_URL =
  'https://www.jointaro.com/interviews/companies/revolut/experiences/senior-frontend-engineer-madrid-april-1-2024-no-offer-neutral-c98763a9/';
const REVOLUT_MADRID_2024_LABEL = 'Public report: Revolut senior frontend engineer loop, April 2024 (Taro, approximate date)';
const REVOLUT_PORTUGAL_2025_URL =
  'https://www.jointaro.com/interviews/companies/revolut/experiences/frontend-developer-portugal-november-5-2025-no-offer-neutral-c06a19bc/';
const REVOLUT_PORTUGAL_2025_LABEL = 'Public report: Revolut frontend developer screen, November 2025';
const REVOLUT_POLAND_2024_URL =
  'https://www.jointaro.com/interviews/companies/revolut/experiences/senior-frontend-developer-poland-may-1-2024-no-offer-negative-b869132a/';
const REVOLUT_POLAND_2024_LABEL = 'Public report: Revolut senior frontend developer loop, May 2024 (Taro, approximate date)';
const REVOLUT_KRAKOW_2023_URL =
  'https://www.jointaro.com/interviews/companies/revolut/experiences/web-engineer-krakow-september-1-2023-no-offer-neutral-349ae671/';
const REVOLUT_KRAKOW_2023_LABEL = 'Public report: Revolut web engineer loop, September 2023 (Taro, approximate date)';
const REVOLUT_BLIND_2022_URL = 'https://www.teamblind.com/post/revolut-front-end-interview-ryrerkjw';
const REVOLUT_HOME_TASK_URL = 'https://github.com/iskandiar/revolut-home-task';
const REVOLUT_WEB_ENGINEERING_URL =
  'https://medium.com/revolut/building-the-web-that-moves-money-inside-web-engineering-at-revolut-3dd4fb78fbfa';
const REVOLUT_BAR_RAISER_VIDEO_URL = 'https://www.youtube.com/watch?v=zreFxR7MRuI';

export const REVOLUT_PREVIEW_TITLE = 'Revolut Frontend Interview Questions: 5 Prompts + Prep Guide';
export const REVOLUT_PREVIEW_H1 = 'Revolut Frontend Interview Questions';
export const REVOLUT_PREVIEW_DESCRIPTION =
  'Prepare for a Revolut frontend interview with 5 practice prompts: a one-hour TypeScript fetch-and-render task, HackerRank, theory checks, system design.';
export const REVOLUT_PREVIEW_CANONICAL_PATH = '/companies/revolut/preview';
export const REVOLUT_PREVIEW_TRUST_NOTE =
  'These are FrontendAtlas practice versions modelled on rounds described in public interview reports, not leaked, confirmed or official Revolut questions. A few self-reported loops cannot establish a fixed format; use recruiter-provided material as the source of truth.';

export const REVOLUT_COMPANY_PREVIEW: AuthoredCompanyPreview = {
  slug: 'revolut',
  label: 'Revolut',
  title: REVOLUT_PREVIEW_TITLE,
  h1: REVOLUT_PREVIEW_H1,
  description: REVOLUT_PREVIEW_DESCRIPTION,
  canonicalPath: REVOLUT_PREVIEW_CANONICAL_PATH,
  trustNote: REVOLUT_PREVIEW_TRUST_NOTE,
  hero: {
    kicker: 'Public Revolut prep guide',
    subtitle:
      'Prepare with five practice prompts shaped by six public frontend accounts from 2023 to 2025 and by the Revolut Tech post on web engineering: a one-hour TypeScript task that fetches data and renders it with loading and error states, a pairing session against an authenticated API, a three-task HackerRank screen, a recruiter-run theory check, and a frontend system-design round about product features and API contracts.',
    caveat:
      'This guide uses public, self-reported interview accounts and the published Revolut Tech post on web engineering to create realistic constraints. It does not claim access to private interview material, a fixed interview format, or the stack of every Revolut team.',
    chips: ['5 practice prompts', 'TypeScript, React, API contracts', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'Prepare for product judgment, not Revolut trivia',
    paragraphs: [
      'The public accounts converge on one exercise: in about an hour, fetch data from a source and render it in React with TypeScript, with a loading state, data state management and fetching with error handling. The one account that shared written feedback was told that type management and loading-state handling needed more practice, so the drills below start there. The Revolut Tech post on web engineering describes the same bar from the other side of the table: the interviews place candidates in real-world scenarios and ask them to implement features standard to web engineers, not to crack obscure JavaScript puzzles.',
      'Around that exercise the accounts describe a HackerRank screen or a short theory check run by the recruiter, a frontend system-design round in a 2025 loop, a team-fit conversation and a Bar Raiser interview. Each prompt below starts with the clarifying questions a strong candidate asks, then the behaviours a strong answer covers, then the miss that usually ends the round.',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked October 2026',
    title: 'What the public accounts establish, and what you still need to confirm',
    paragraphs: [
      'Six self-reported frontend accounts on Taro inform this guide; Taro shows most of their dates as the first of a month, so those months are approximate, and its locations are not used. April 2025, a React role at middle level: an intro call with CV questions, a 15-minute theory check with HR from a checklist of React questions (reconciliation, microtasks versus macrotasks in the event loop, the DOM tree), then a one-hour TypeScript live-coding task with a provided boilerplate to implement a loading state, data state management and fetching with error handling, with optimisation or unit tests if time allowed; team-fit and Bar Raiser rounds would have followed. May 2025: a recruiter call, a pairing session that used a service API with authentication to display data in a React component, a frontend system-design round to suggest product features and design the APIs between the frontend and other services, and a team-fit call. April 2024, senior: a HackerRank screen with three tasks in 85 minutes, the third at a high-medium level, then a timed live-coding session on a small React app. November 2025: a HackerRank JavaScript test with a standard sliding-window problem. May 2024, senior: a HackerRank test with three tasks in 110 minutes, live coding on API calls, data mapping, error handling and unit tests, and a system-design round on a physical card delivery system. September 2023: three HackerRank tasks, React components with three JavaScript questions, and a design interview used to set the level. A 2022 Blind thread adds a reply describing LeetCode-style problems, JavaScript fundamentals and React, with no system design expected.',
      'Together they establish that these round types occurred between 2022 and 2025; they do not establish exact wording, the current format, or how every hub interviews. Confirm the screen format, the allowed tools, whether a take-home exists for the role and the timing with the recruiter. Revolut publishes its web stack and interview philosophy on its Tech blog and a careers video on the Bar Raiser stage; use them for context, not as evidence of specific questions.',
    ],
  },
  roleLenses: {
    kicker: 'Role lenses',
    title: 'Two product contexts for practising transferable frontend judgment',
    intro:
      'These are preparation lenses based on the two groups of web products described in the Revolut Tech post on web engineering, not claimed team assignments. Choose the lens closest to the role and keep the reasoning framework-neutral.',
    items: [
      {
        title: 'Customer-facing web products',
        description:
          'The website, the Revolut Business platform and the crypto exchange that the post lists as external web products, where every request has a loading, success, empty and failure state.',
        practiceFocus:
          'Typed API boundaries validated at runtime, one explicit request state, retries that never repeat an action that moves money, and copy that tells the user what happened.',
      },
      {
        title: 'Internal web applications',
        description:
          'The roughly one hundred internal tools the post describes for back-office management, compliance and risk monitoring, customer support, and data and reporting.',
        practiceFocus:
          'Dense tables and filters derived from one source, pagination and filtering contracts with the API, optimistic updates with rollback, and keyboard access to every control.',
      },
    ],
  },
  prompts: {
    kicker: 'Representative practice prompts',
    title: 'Five Revolut frontend interview practice questions',
    intro:
      'For each prompt, clarify the contract, explain ownership and trade-offs, implement or diagram the smallest credible slice, and test the failure cases. Each prompt links to the public report it is modelled on and to a practice page.',
    itemListName: 'Five Revolut frontend interview practice prompts',
    items: [
      {
        id: 'fetch-and-render-in-one-hour',
        title: 'Fetch data and render it in one hour, in TypeScript, with every request state',
        statement:
          'Given a React and TypeScript boilerplate and a data source, load the data and render it: show a loading state first, handle a failed request with a readable message, type the response and the component state, and add a test or an optimisation if time remains.',
        whatThisMeasures:
          'Request-state modelling, error handling that is explicit rather than swallowed, TypeScript at the boundary, pace under a clock, and whether the first ten minutes go to the contract or to folder structure.',
        clarifyFirst: [
          'Confirm the response shape, what an empty result looks like, and which failures are in scope: network, non-200 status, malformed data.',
          'Confirm how the interviewer wants errors surfaced at the fetch boundary, and whether tests are expected inside the hour.',
        ],
        strongAnswer: [
          'Hold the request in one discriminated union, loading, success with data, empty and error with a message, so no two states can be true at once.',
          'Type the response once at the fetch boundary, narrow unknown errors to a message, and never let `any` reach the component.',
          'Render the loading state before the request resolves, then branch on the status alone; show rows only on success.',
          'Guard stale responses with a cleanup flag, and add one test per state if time remains, starting with the error path.',
        ],
        commonMiss:
          'Three booleans for loading, error and data that drift apart, an untyped response object, and a component that renders nothing while the request is in flight.',
        resourceLabel: 'Practice the fetch-and-render exercise (free)',
        resourcePath: '/react/coding/react-fetch-list-states',
        reportedRound: { label: REVOLUT_APRIL_2025_LABEL, url: REVOLUT_APRIL_2025_URL },
      },
      {
        id: 'authenticated-api-pairing',
        title: 'Display data from an authenticated API in a React component, pairing with the interviewer',
        statement:
          'Pair with the interviewer to call a service API that requires authentication, display the data in a React component, and handle a missing or expired token, a failed request and a slow response while you talk through each decision.',
        whatThisMeasures:
          'Collaboration under observation, where auth and transport concerns live, request cancellation and timeouts, and how you explain trade-offs while typing.',
        clarifyFirst: [
          'Confirm how the token is provided, how long it lives and what the API returns when it is missing or expired.',
          'Confirm whether a shared fetch wrapper or a data-fetching library is acceptable, or whether the interviewer wants plain `fetch`.',
        ],
        strongAnswer: [
          'Put the auth header, the timeout and the JSON parsing in one small wrapper so the component only sees typed data or a typed error.',
          'Abort the request on unmount or when the inputs change, and treat a 401 as a distinct state with a distinct message.',
          'Narrate the plan before coding and after each step; ask for the next requirement as soon as the current one works.',
          'Keep the component declarative: it renders from the request state and never builds headers itself.',
        ],
        commonMiss:
          'Building the header inline in the component, ignoring the expired-token case, and coding in silence for twenty minutes before explaining the approach.',
        resourceLabel: 'Practice the fetch wrapper with timeout and abort (free)',
        resourcePath: '/javascript/coding/js-fetch-json-timeout',
        reportedRound: { label: REVOLUT_MAY_2025_LABEL, url: REVOLUT_MAY_2025_URL },
      },
      {
        id: 'hackerrank-screen-three-tasks',
        title: 'Clear the HackerRank screen: three tasks in 85 minutes',
        statement:
          'A timed online screen with three tasks of rising difficulty: two straightforward problems and one at a high-medium level. A later account recalls a standard sliding-window problem. Submit working code for all three with the time budget intact.',
        whatThisMeasures:
          'Clean fundamentals under a clock, reading a problem statement precisely, handling edge cases without prompting, and knowing when to move on.',
        clarifyFirst: [
          'Read every constraint and sample before coding; note input sizes, ties and empty inputs explicitly.',
          'Decide the order: bank the two easier tasks first, then spend the remaining time on the third.',
        ],
        strongAnswer: [
          'Write a brute-force version that passes the samples, then improve it only if the constraints demand it.',
          'Use a sliding window or a map-based count where the statement asks about contiguous ranges or frequencies, and state the complexity in a comment.',
          'Handle empty input, a single element and duplicates before polishing names.',
          'Leave the hardest task with a correct partial solution rather than an elegant incomplete one.',
        ],
        commonMiss:
          'Spending the first half hour on the hardest task, then rushing the two easy ones and losing points to off-by-one errors.',
        resourceLabel: 'Read the data structures and algorithms blueprint for frontend loops',
        resourcePath: '/guides/interview-blueprint/dsa-for-fe',
        reportedRound: { label: REVOLUT_MADRID_2024_LABEL, url: REVOLUT_MADRID_2024_URL },
      },
      {
        id: 'recruiter-theory-check',
        title: 'Answer the recruiter-run theory check: reconciliation, microtasks versus macrotasks, the DOM tree',
        statement:
          'Before the live-coding round, HR works through a short checklist of React and browser theory: how reconciliation decides what to update, how microtasks and macrotasks are ordered by the event loop, and what the DOM tree is. Answer each in two or three precise sentences.',
        whatThisMeasures:
          'Whether you can state fundamentals plainly to a listener who is checking answers against a list, without jargon they cannot verify and without drifting into unrelated detail.',
        clarifyFirst: [
          'Ask whether a short definition or an example is preferred; an example usually shows understanding fastest.',
          'Confirm which framework the role uses before answering the rendering question.',
        ],
        strongAnswer: [
          'Reconciliation: React compares the new element tree with the previous one and updates only the DOM nodes whose type or props changed, matching list children by key.',
          'Microtasks run to completion after the current task and before the next macrotask, so a resolved promise callback runs before a zero-delay timeout.',
          'The DOM tree is the in-memory tree of nodes that the browser builds from the HTML; scripts read and change it, and the browser renders from it.',
          'Add one concrete example per answer, for example a list rendered with index keys or a `setTimeout` versus `Promise.then` ordering.',
        ],
        commonMiss:
          'A long answer about Fiber internals or event-loop phases that never states the simple rule the checklist is looking for.',
        resourceLabel: 'Review microtasks versus macrotasks (free)',
        resourcePath: '/javascript/trivia/js-microtasks-vs-macrotasks',
        reportedRound: { label: REVOLUT_APRIL_2025_LABEL, url: REVOLUT_APRIL_2025_URL },
      },
      {
        id: 'frontend-system-design-api-contracts',
        title: 'Design a product feature end to end: the frontend, its API contracts and the services behind them',
        statement:
          'Propose features for a given product area, then design the frontend and the APIs that connect it to the other services: data shapes, loading and failure behaviour, consistency rules and how the client recovers when a step fails halfway.',
        whatThisMeasures:
          'Product thinking, API design from the point of view of the client, idempotency and retry rules for actions that move money, and how you reason about partial failure.',
        clarifyFirst: [
          'Confirm the scope: one feature or several, which clients consume the API, and whether the design should cover the services or only the contracts.',
          'Confirm the consistency expectation: can the user see a pending state, or must every screen reflect the final result?',
        ],
        strongAnswer: [
          'Start from the user flow and write the API contracts as the client needs them: request and response shapes, the error codes the UI branches on, and pagination where lists grow.',
          'Give every action that changes money an idempotency key and define what the client shows while it is pending and after a timeout.',
          'Separate read models from write actions so the screens stay fast while the actions stay safe.',
          'Name the failure cases out loud: the request that times out after the server committed, the duplicate tap, the stale cached view.',
        ],
        commonMiss:
          'Drawing boxes for services without a single concrete request or response, or designing the happy path and leaving partial failure for the interviewer to raise.',
        resourceLabel: 'Work through the resilient checkout and payment flow case (free)',
        resourcePath: '/system-design/resilient-checkout-payment-flow',
        reportedRound: { label: REVOLUT_MAY_2025_LABEL, url: REVOLUT_MAY_2025_URL },
      },
    ],
  },
  walkthrough: {
    kicker: 'Public mini walkthrough',
    title: 'Scope the one-hour fetch-and-render task before the first line',
    intro:
      'Treat this as a representative exercise, not a description of the reported one. Work from the contract toward the request state, and say each decision out loud.',
    steps: [
      { title: 'Pin the contract', description: 'Endpoint, response shape, what an empty result looks like, and which failures are in scope; write the response type first.' },
      { title: 'Choose one request state', description: 'A discriminated union with loading, success, empty and error, so the component never has to reconcile three booleans.' },
      { title: 'Render loading first', description: 'Set the loading state before the request resolves and branch the JSX on the status alone.' },
      { title: 'Make failure explicit', description: 'Map a rejection or a non-200 response to an error state with a readable message; narrow `unknown` before rendering it.' },
      { title: 'Guard the stale response', description: 'Flip a cleanup flag or abort the request when the inputs change, then add one test per state if time remains.' },
    ],
  },
  prepPlan: {
    kicker: 'Actionable preparation',
    title: 'A 7-day Revolut frontend interview preparation plan',
    intro: 'Every day ends with code, a test, a design artifact, or a question you can use in the real process.',
    days: [
      { day: 'Day 1', focus: 'TypeScript at the boundary: response types, narrowing unknown errors, discriminated unions for request state.', artifact: 'A typed fetch wrapper and a request-state union you can retype from memory.' },
      { day: 'Day 2', focus: 'The one-hour drill: loading, error, empty and success states in React, twice, against a timer.', artifact: 'Two timed runs with a stale-response guard and one test per state.' },
      { day: 'Day 3', focus: 'Theory check: reconciliation, the event loop, microtasks versus macrotasks and the DOM tree, explained in two sentences each.', artifact: 'A one-page answer sheet with one example per topic.' },
      { day: 'Day 4', focus: 'HackerRank rehearsal: three problems in 85 minutes, including one sliding-window problem.', artifact: 'A time log and the complexity stated for each solution.' },
      { day: 'Day 5', focus: 'Frontend system design: a product feature, its API contracts, idempotent actions and partial-failure recovery.', artifact: 'A one-page design with request and response shapes and the failure cases.' },
      { day: 'Day 6', focus: 'Team fit and Bar Raiser: stories that show a decision, its trade-off and its result, mapped to the three qualities the web-engineering post says the interviews value: think deeper, get it done, deliver wow.', artifact: 'Six stories in a structured format, each with a measurable result.' },
      { day: 'Day 7', focus: 'Mock loop: one screen, one pairing session, one design walkthrough and one team-fit conversation, each narrated.', artifact: 'A list of the questions you will ask the recruiter about format, tools and timing.' },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common Revolut frontend interview preparation questions',
    items: [
      { question: 'Are these the real Revolut questions?', answer: 'No. They are FrontendAtlas practice versions modelled on round types described in public, self-reported accounts and in the Revolut Tech post on web engineering. The wording, the data and the test cases are ours.' },
      { question: 'Is there still a take-home?', answer: 'A public candidate repository from 2017 quotes a web home task: rebuild the exchange screen of the Revolut app as a widget that polls currency rates every ten seconds, in React or Preact with Redux. None of the 2024 and 2025 accounts used here describes a take-home; they describe the one-hour live task instead. Confirm with the recruiter for the specific role.' },
      { question: 'Which stack should I prepare in?', answer: 'The Revolut Tech post on web engineering from October 2025 lists TypeScript, React and React Query at their latest stable versions, Rush and Nx for the monorepo, Zod to validate every external boundary at runtime, and Jest, Playwright, Storybook and React Testing Library for tests. Prepare in React and TypeScript.' },
      { question: 'What is the Bar Raiser round?', answer: 'The April 2025 account lists a team-fit interview and a Bar Raiser interview as the rounds after the live task, and Revolut publishes a careers video on preparing for the Bar Raiser. None of the public accounts used here describes its questions, so prepare stories with a decision, a trade-off and a measured result.' },
      { question: 'Does every hub interview the same way?', answer: 'The accounts come from different hubs and years and differ in round count and order: one loop opens with a HackerRank screen, another with a theory check, and system-design rounds appear in the 2023, 2024 and May 2025 loops but not in the others. Treat them as shapes to practise and confirm the loop with the recruiter.' },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Build the underlying skills with free practice',
    intro:
      'These public pages cover the fetching, request-state, event-loop, rendering and design skills used by the practice prompts. They are supporting drills, not claimed Revolut questions.',
    items: [
      { label: 'Fetch and render a list with loading, error and empty states', description: 'The one-hour exercise in React and TypeScript.', path: '/react/coding/react-fetch-list-states' },
      { label: 'Fetch JSON with timeout and abort', description: 'The request wrapper behind the pairing prompt.', path: '/javascript/coding/js-fetch-json-timeout' },
      { label: 'Debounce', description: 'The utility behind search inputs that call an API.', path: '/javascript/coding/js-debounce' },
      { label: 'Microtasks versus macrotasks', description: 'The ordering rule in the theory check.', path: '/javascript/trivia/js-microtasks-vs-macrotasks' },
      { label: 'React diffing algorithm', description: 'What reconciliation compares and what it updates.', path: '/react/trivia/react-diffing-algorithm' },
      { label: 'The DOM tree structure', description: 'The browser model the theory check asks you to define.', path: '/html/trivia/html-dom-tree-structure' },
      { label: 'Resilient checkout and payment flow', description: 'Idempotent actions and partial failure in a money flow.', path: '/system-design/resilient-checkout-payment-flow' },
      { label: 'Data structures and algorithms for frontend loops', description: 'How to prepare the HackerRank screen without drowning in puzzles.', path: '/guides/interview-blueprint/dsa-for-fe' },
      { label: 'Behavioural stories', description: 'A structure for the team-fit and Bar Raiser conversations.', path: '/guides/behavioral/stories' },
    ],
  },
  sources: {
    kicker: 'Public interview reports and official context',
    title: 'Sources and evidence limits',
    intro: 'These links support the public context used by the guide. Their notes state what each source can and cannot establish about preparation.',
    items: [
      { label: REVOLUT_APRIL_2025_LABEL, url: REVOLUT_APRIL_2025_URL, note: 'One self-reported loop for a React role at middle level, without an offer. It establishes the HR theory check, the one-hour TypeScript fetch-and-render task and the written feedback; it cannot establish exact wording or the current format.', kind: 'report' },
      { label: REVOLUT_MAY_2025_LABEL, url: REVOLUT_MAY_2025_URL, note: 'One self-reported loop without an offer. It establishes the authenticated-API pairing session, the frontend system-design round and the team-fit call; it names no exact prompt.', kind: 'report' },
      { label: REVOLUT_MADRID_2024_LABEL, url: REVOLUT_MADRID_2024_URL, note: 'One self-reported senior loop without an offer. It establishes the three-task, 85-minute HackerRank screen and a timed live-coding session on a small React app; it names no exact prompt.', kind: 'report' },
      { label: REVOLUT_PORTUGAL_2025_LABEL, url: REVOLUT_PORTUGAL_2025_URL, note: 'One self-reported screen without an offer. It establishes that the HackerRank stage can include a standard sliding-window problem; nothing beyond the screen is described.', kind: 'report' },
      { label: REVOLUT_POLAND_2024_LABEL, url: REVOLUT_POLAND_2024_URL, note: 'One self-reported senior loop without an offer. It establishes a three-task HackerRank test in 110 minutes, live coding on API calls, data mapping, error handling and unit tests, and a system-design round on a physical card delivery system.', kind: 'report' },
      { label: REVOLUT_KRAKOW_2023_LABEL, url: REVOLUT_KRAKOW_2023_URL, note: 'One self-reported loop without an offer. It establishes three HackerRank tasks, a round on React components and JavaScript questions, and a design interview used to set the level.', kind: 'report' },
      { label: 'Blind: Revolut front-end interview thread, April 2022', url: REVOLUT_BLIND_2022_URL, note: 'A 2022 thread in which one reply, apparently secondhand, describes LeetCode-style problems, JavaScript fundamentals and React, and says no system design was expected. It shows an earlier shape of the loop; it cannot establish the current format.', kind: 'report' },
      { label: 'Candidate repository: Revolut web development home task, October 2017', url: REVOLUT_HOME_TASK_URL, note: 'A public solution whose README quotes the brief: an exchange-screen widget that polls rates for GBP, EUR and USD every ten seconds, in React or Preact with Redux. It establishes a 2017 take-home, not anything about the current process.', kind: 'report' },
      { label: 'Revolut Tech: Building the Web that Moves Money, October 2025', url: REVOLUT_WEB_ENGINEERING_URL, note: 'Official post on web engineering at Revolut. It states the interview philosophy, real-world scenarios rather than obscure JavaScript puzzles, the stack and the two groups of web products; it names no interview questions.', kind: 'official' },
      { label: 'Revolut Careers: How to succeed in your Bar Raiser interview', url: REVOLUT_BAR_RAISER_VIDEO_URL, note: 'Official careers video on the Revolut YouTube channel, published June 2025. Its description says the Bar Raiser interview is where Revolut gets to know how you work and what drives you and whether your decision-making fits its culture; the guide uses it to confirm that the stage exists and its purpose, not for questions.', kind: 'official' },
      { label: 'Revolut Careers: Engineering', url: 'https://www.revolut.com/careers/team/engineering/', note: 'Lists four hiring steps, an intro call with an IT recruiter, tech interviews, team fit and offer, with no formats or durations. The live page blocks automated readers and was read from an archived copy.', kind: 'official' },
    ],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full Revolut practice set',
    copy:
      'This public guide is complete enough to plan a focused week. Premium unlocks the company-tagged Revolut set, including the debounced search against a fake API, and the wider premium library of coding, concept and system-design practice.',
    buttonLabel: 'Unlock the full Revolut practice set',
    src: 'company_preview_revolut',
  },
  about: [
    'Revolut frontend interview preparation',
    'TypeScript fetch-and-render live coding',
    'React rendering and event-loop theory checks',
    'Frontend system design with API contracts',
  ],
  indexAnchorLabel: 'Revolut frontend interview questions',
};
