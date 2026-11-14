import type { AuthoredCompanyPreview } from '../../shared/company-previews/authored-company-preview.model';

/**
 * Revolut frontend interview guide. The reported questions live with the process table
 * (company-interview-processes.ts); the five prompts here are the answer guides of several of them. The questions come
 * from anonymous interview reviews re-posted on Taro (2020 to 2025), whose city and date are Taro's own rather than the
 * candidate's, so labels here carry no city. Two Blind posts, the Revolut Tech post on web engineering, the Bar Raiser
 * video and the engineering careers page give context. Nothing here is a leaked, confirmed or official Revolut question.
 */
const REVOLUT_TARO = 'https://www.jointaro.com/interviews/companies/revolut/experiences';
const REVOLUT_APRIL_2025_URL = `${REVOLUT_TARO}/frontend-developer-warsaw-masovia-april-1-2025-no-offer-neutral-71032bb4/`;
const REVOLUT_APRIL_2025_LABEL = 'Public report: Taro frontend developer loop, April 2025 (approximate date)';
const REVOLUT_MAY_2025_URL = `${REVOLUT_TARO}/frontend-engineer-barcelona-may-1-2025-no-offer-neutral-3c58f9b9/`;
const REVOLUT_MAY_2025_LABEL = 'Public report: Taro frontend engineer loop, May 2025 (approximate date)';
const REVOLUT_MARCH_2025_URL = `${REVOLUT_TARO}/frontend-engineer-barcelona-march-1-2025-no-offer-neutral-fd597039/`;
const REVOLUT_MARCH_2025_LABEL = 'Public report: Taro frontend engineer loop, March 2025 (approximate date)';
const REVOLUT_NOVEMBER_2025_URL = `${REVOLUT_TARO}/frontend-developer-portugal-november-5-2025-no-offer-neutral-c06a19bc/`;
const REVOLUT_NOVEMBER_2025_LABEL = 'Public report: Taro frontend developer test, November 2025';
const REVOLUT_REACT_2024_URL = `${REVOLUT_TARO}/senior-frontend-engineer-react-georgia-february-7-2024-no-offer-neutral-9a9832e4/`;
const REVOLUT_REACT_2024_LABEL = 'Public report: Taro senior frontend engineer (React) loop, February 2024';
const REVOLUT_SENIOR_APRIL_2024_URL = `${REVOLUT_TARO}/senior-frontend-engineer-madrid-april-1-2024-no-offer-neutral-c98763a9/`;
const REVOLUT_SENIOR_APRIL_2024_LABEL = 'Public report: Taro senior frontend engineer loop, April 2024 (approximate date)';
const REVOLUT_SENIOR_MAY_2024_URL = `${REVOLUT_TARO}/senior-frontend-developer-poland-may-1-2024-no-offer-negative-b869132a/`;
const REVOLUT_SENIOR_MAY_2024_LABEL = 'Public report: Taro senior frontend developer loop, May 2024 (approximate date)';
const REVOLUT_TEST_MAY_2024_URL = `${REVOLUT_TARO}/senior-frontend-software-engineer-porto-oporto-may-1-2024-no-offer-neutral-90611f7c/`;
const REVOLUT_TEST_MAY_2024_LABEL = 'Public report: Taro senior frontend software engineer test, May 2024 (approximate date)';
const REVOLUT_WEB_2023_URL = `${REVOLUT_TARO}/web-engineer-krakow-september-1-2023-no-offer-neutral-349ae671/`;
const REVOLUT_WEB_2023_LABEL = 'Public report: Taro web engineer loop, September 2023 (approximate date)';
const REVOLUT_SENIOR_2023_URL = `${REVOLUT_TARO}/senior-front-end-developer-lisbon-lisbon-district-april-24-2023-no-offer-positive-025ce14f/`;
const REVOLUT_SENIOR_2023_LABEL = 'Public report: Taro senior front end developer loop, April 2023';
const REVOLUT_TEST_2022_URL = `${REVOLUT_TARO}/frontend-developer-lisbon-lisbon-district-november-1-2022-no-offer-negative-34908269/`;
const REVOLUT_TEST_2022_LABEL = 'Public report: Taro frontend developer test, November 2022 (approximate date)';
const REVOLUT_OFFER_2022_URL = `${REVOLUT_TARO}/senior-frontend-engineer-berlin-april-1-2022-accepted-offer-positive-aa0a7d87/`;
const REVOLUT_OFFER_2022_LABEL = 'Public report: Taro senior frontend engineer offer, April 2022 (approximate date)';
const REVOLUT_BLIND_PLAN_2026_URL =
  'https://www.teamblind.com/post/what-to-expect-in-revolut-frontend-engineer-interview-screening-technical-team-bar-raiser-qpgmtoum';
const REVOLUT_BLIND_2022_URL = 'https://www.teamblind.com/post/revolut-front-end-interview-ryrerkjw';
const REVOLUT_WEB_ENGINEERING_URL =
  'https://medium.com/revolut/building-the-web-that-moves-money-inside-web-engineering-at-revolut-3dd4fb78fbfa';
const REVOLUT_BAR_RAISER_VIDEO_URL = 'https://www.youtube.com/watch?v=zreFxR7MRuI';

export const REVOLUT_PREVIEW_TITLE = 'Revolut Frontend Interview Questions and Bar Raiser Guide';
export const REVOLUT_PREVIEW_H1 = 'Revolut Frontend Interview Questions';
export const REVOLUT_PREVIEW_DESCRIPTION =
  'Revolut frontend interview: the HackerRank test, an hour of TypeScript and React live coding, design, team fit, the Bar Raiser and {#questions} reported questions.';
export const REVOLUT_PREVIEW_CANONICAL_PATH = '/companies/revolut/preview';
export const REVOLUT_PREVIEW_TRUST_NOTE =
  'Every question here comes from an anonymous interview review re-posted on Taro and is retold in our words. Taro attaches its own city and date to these reviews, so the guide names no city and treats each month as approximate. Revolut has confirmed none of the questions; the answer guides and practice tasks are written by FrontendAtlas, and what your recruiter says about the rounds comes first.';

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
      'Revolut frontend candidates describe a recruiter or HR call, a HackerRank test of three algorithm tasks taken at home, about an hour of live coding in TypeScript and React, a design round for mid and senior roles, then team fit and a Bar Raiser. Below the rounds sit {questions} questions from those reviews; the first, an hour-long TypeScript task to fetch data and render it with a loading state and error handling, is open to read.',
    caveat:
      'Nearly every review is a short, anonymous one re-posted on Taro, and most ended without an offer. The one offer, from 2022, came without a separate design round or a Bar Raiser, and none of these reviews describes sitting the Bar Raiser.',
    chips: ['{#questions} reported questions', '{#reports} public reports, 2020–2026, the newest a plan', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'What Revolut frontend loops test: request state in TypeScript, then algorithms against a clock',
    paragraphs: [
      'The live-coding hour gets the most words in these reviews. The open question shows it best: a prepared TypeScript boilerplate, sixty minutes, and a loading state, data held in state and fetching with error handling to build, with tests or an optimisation only if time is left. That candidate finished a working solution and was still turned down, with feedback on type management, generic types included, and on loading-state handling. Other loops asked for the same skill in another shape: data from an authenticated API in a pairing session, a mock API with pagination and filtering in CodeSandbox, API calls with data mapping and unit tests, or an existing React app to improve.',
      'Before that hour most loops set a HackerRank test of three tasks in 85 to 110 minutes, with days to start it. The reviews that name its tasks describe string, keypad and grid problems rather than frontend ones, and one candidate found the hidden test cases frustrating, so bank the easier tasks first. A recruiter or HR call can carry a short theory check, and the design round for mid and senior roles asks for the frontend and its APIs together. Revolut Tech says its interviews favour real-world features over JavaScript puzzles; the reviews bear that out for the live hour, not for the test.',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked November 2026',
    title: 'Short anonymous reviews: what they show about Revolut, and what to confirm',
    paragraphs: [
      '{reports} public accounts sit behind this guide. Almost all are anonymous interview reviews re-posted on Taro and dated 2020 to 2025; the others are a 2022 Blind thread and a March 2026 Blind post, written before an interview, that lists the rounds its author expected. Taro gives these reviews its own city and date, so places are left out here and months are approximate. Most reviews run to a few lines and end without an offer; the only offer, from 2022, describes three HackerRank problems, a technical interview and a culture-fit round.',
      'Ask the recruiter whether your loop opens with the HackerRank test or the call, how many days you have to start the test, whether the live hour comes with a boilerplate, and whether your level gets a design round. The engineering careers page lists four steps, an intro call with an IT recruiter, tech interviews, team fit and offer, with no formats; the Bar Raiser appears in a careers video instead, and the Revolut Tech post on web engineering from October 2025 describes the stack and what the interviews value, not their questions.',
    ],
  },
  roundSpotlights: [
    {
      id: 'bar-raiser',
      kicker: 'Round decoder',
      title: 'Revolut Bar Raiser interview for frontend engineers: what it is and how to prepare',
      lede: [
        'Revolut\'s careers video describes the Bar Raiser as the interview where it gets to know how you work and what drives you, looking at how your previous work experience and decision-making align with its culture. In the plans frontend candidates report, it comes last, after a team-fit interview: the April 2025 review lists both after the live task, and a March 2026 Blind post lists a recruiter screen, a technical interview, team fit and then the Bar Raiser.',
        'No frontend review used here describes sitting it or lists its questions, and the 2022 review that ended in an offer had no Bar Raiser at all. Revolut Tech\'s post on web engineering names three things its interviews look for, practical problem solving, delivering end to end and a sense of perfection, and ties them to think deeper, get it done and deliver wow. Bring stories with a decision, what it cost and how it ended, and the reasons behind each.',
      ],
      facts: [
        { label: 'Position in the loop', value: 'Last, after team fit, in the April 2025 and March 2026 plans. Revolut’s careers video describes it; the engineering careers page does not list it, and the 2022 offer came without it.' },
        { label: 'What it covers', value: 'How you work and what drives you, and how your previous work and decision-making align with Revolut\'s culture, in the words of the careers video\'s description (June 2025). No public frontend review lists its questions.' },
        { label: 'Length', value: 'Not given in any review.' },
        { label: 'Before it', value: 'A recruiter or HR call, in some loops with a short theory check; a HackerRank test of three algorithm tasks in 85 to 110 minutes, sometimes before the call; about an hour of live coding in TypeScript and React; a design round for mid and senior roles; team fit.' },
        { label: 'Official pages', value: 'The careers video "How to succeed in your Bar Raiser interview" and the engineering careers page, which lists an intro call, tech interviews, team fit and an offer with no formats or durations.' },
        { label: 'Behind these facts', value: 'Revolut\'s careers video and pages, the Revolut Tech post on web engineering, the April 2025 review on Taro and the March 2026 Blind post.' },
      ],
      practiceLink: { label: 'Prepare decision stories with the behavioural guide', path: '/guides/behavioral' },
      processLink: { label: 'See the Bar Raiser row in the reported process', fragment: 'revolut-interview-process-1-stage-bar-raiser' },
    },
  ],
  roleLenses: {
    kicker: 'Role lenses',
    title: 'Customer products or internal tools: the two halves of Revolut\'s web estate',
    intro:
      'Revolut Tech\'s October 2025 post splits its web work into customer-facing products and around a hundred internal web applications. No review says which half a candidate interviewed for, so practise the live hour against the half your posting names.',
    items: [
      {
        title: 'Customer-facing web products',
        description:
          'The main website, Revolut Business, the crypto exchange platform and the HRMS, which the post lists on the customer-facing side, where every request needs a loading, success, empty and failure state.',
        practiceFocus:
          'Typed API boundaries validated at runtime, as the post says the team does with Zod; one explicit request state; retries that never repeat an action that moves money; and copy that tells the user what happened.',
      },
      {
        title: 'Internal web applications',
        description:
          'Around a hundred internal applications for back-office, compliance, support, data and operations work, by the post\'s count.',
        practiceFocus:
          'Dense tables and filters derived from one source, pagination and filtering agreed with the API, optimistic updates with rollback, and keyboard access to every control.',
      },
    ],
  },
  prompts: {
    kicker: 'Representative practice prompts',
    title: 'Answer guides for the reported Revolut questions',
    intro:
      'Each guide covers what to settle before coding, what a strong answer includes and the slip that most often ends the round.',
    itemListName: 'Revolut answer guides',
    items: [
      {
        id: 'fetch-and-render-in-one-hour',
        title: 'Fetch data and render it in one hour, in TypeScript, with every request state',
        statement:
          'On a prepared TypeScript boilerplate and a data source, load the data and render it: show a loading state first, handle a failed request with a readable message, type the response and the component state, and add a test or an optimisation if time remains.',
        whatThisMeasures:
          'Request-state modelling, error handling that is explicit rather than swallowed, TypeScript at the boundary, generic types where a helper is shared, and pace under a clock.',
        clarifyFirst: [
          'Confirm the response shape, what an empty result looks like, and which failures are in scope: network, non-200 status, malformed data.',
          'Confirm how the interviewer wants errors surfaced at the fetch boundary, and whether tests are expected inside the hour.',
        ],
        strongAnswer: [
          'Hold the request in one discriminated union, loading, success with data, empty and error with a message, so no two states can be true at once.',
          'Type the response once at the fetch boundary, with a generic parameter if the fetch helper is shared, narrow unknown errors to a message, and never let `any` reach the component.',
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
        title: 'Solve a sliding-window problem inside a three-task HackerRank test',
        statement:
          'A timed HackerRank test of three tasks, one of them a standard sliding-window problem in JavaScript. Submit working code for all three with the time budget intact.',
        whatThisMeasures:
          'Clean fundamentals under a clock, reading a problem statement precisely, handling edge cases without prompting, and knowing when to move on.',
        clarifyFirst: [
          'Read every constraint and sample before coding; note input sizes, ties and empty inputs explicitly.',
          'Decide the order: bank the easier tasks first, then spend the remaining time on the hardest.',
        ],
        strongAnswer: [
          'Write a brute-force version that passes the samples, then improve it only if the constraints demand it.',
          'For a contiguous range, move two indices over the input and keep the window\'s state in a map or a counter, so each element enters and leaves once; state the complexity in a comment.',
          'Handle empty input, a single element and duplicates before polishing names.',
          'Leave the hardest task with a correct partial solution rather than an elegant incomplete one, since HackerRank hides some test cases.',
        ],
        commonMiss:
          'Spending the first half hour on the hardest task, then rushing the easier ones and losing points to off-by-one errors in the window bounds.',
        resourceLabel: 'Read the data structures and algorithms blueprint for frontend loops',
        resourcePath: '/guides/interview-blueprint/dsa-for-fe',
        reportedRound: { label: REVOLUT_NOVEMBER_2025_LABEL, url: REVOLUT_NOVEMBER_2025_URL },
      },
      {
        id: 'recruiter-theory-check',
        title: 'Answer the HR theory check: reconciliation, microtasks versus macrotasks, the DOM tree',
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
          'Give every action that changes money or an order an idempotency key and define what the client shows while it is pending and after a timeout.',
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
    kicker: 'Mini walkthrough',
    title: 'Scope the one-hour fetch-and-render task before the first line',
    intro:
      'Five decisions for the open question, in the order you would say them while the boilerplate loads. The feedback that candidate received, on types and on the loading state, decides which two come first.',
    steps: [
      { title: 'Pin the contract', description: 'Endpoint, response shape, what an empty result looks like, and which failures are in scope; write the response type first, generic if the fetch helper is shared.' },
      { title: 'Choose one request state', description: 'A discriminated union with loading, success, empty and error, so the component never has to reconcile three booleans.' },
      { title: 'Render loading first', description: 'Set the loading state before the request resolves and branch the JSX on the status alone.' },
      { title: 'Make failure explicit', description: 'Map a rejection or a non-200 response to an error state with a readable message; narrow `unknown` before rendering it.' },
      { title: 'Guard the stale response', description: 'Flip a cleanup flag or abort the request when the inputs change, then add one test per state if time remains.' },
    ],
  },
  prepPlan: {
    kicker: 'Actionable preparation',
    title: 'A 7-day Revolut frontend interview preparation plan',
    intro:
      'A week on the rounds the Revolut reviews describe: the HackerRank test, the live hour and the types it was judged on, the theory a recruiter may check, the design round, then team fit and the Bar Raiser. In the reviews, the theory check comes in the recruiter or HR call, before the live hour.',
    days: [
      { day: 'Day 1', focus: 'HackerRank test: three algorithm tasks in 85 minutes in one sitting, the easier ones first, knowing that some test cases are hidden.', artifact: 'A timed run with the minutes each task took and the cases you missed.' },
      { day: 'Day 2', focus: 'The live hour: the open fetch-and-render task in TypeScript from a boilerplate, with a loading state and error handling inside 60 minutes.', artifact: 'Two timed runs; on the second, type the response and the state before writing any markup.' },
      { day: 'Day 3', focus: 'Types under pressure: generic types for a fetch helper and a state type that cannot contradict itself, the two areas one candidate\'s feedback named.', artifact: 'A typed fetch helper and a state type you can write from memory.' },
      { day: 'Day 4', focus: 'Pairing in React: an hour-long React build narrated to a partner, every request state handled before any styling.', artifact: 'Notes on where you went quiet, and what you would say there next time.' },
      { day: 'Day 5', focus: 'Theory check: JavaScript and React theory answered in two sentences each, for a recruiter who checks your answers against a list.', artifact: 'A one-page answer sheet with one example per answer.' },
      { day: 'Day 6', focus: 'Design round: one product flow from the screen to the API, drawn on Excalidraw, the board a 2024 loop provided.', artifact: 'One diagram with the screens, the calls between them and what the user sees when a call fails.' },
      { day: 'Day 7', focus: 'Team fit and Bar Raiser: stories about how you work and decide, set against the three things Revolut Tech says its interviews value: think deeper, get it done, deliver wow.', artifact: 'Five stories, each with a decision, what it cost and how it ended, and your questions for the recruiter about the order of the rounds.' },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common Revolut frontend interview preparation questions',
    items: [
      { question: 'Are these the real Revolut questions?', answer: 'They are questions candidates reported in anonymous reviews re-posted on Taro, retold in our words. Revolut has not confirmed any of them, and most reviews give a line or two per round, so several rows name what a task was about without its full wording. FrontendAtlas wrote the answer guides and chose the practice tasks.' },
      { question: 'What is on the Revolut HackerRank test?', answer: 'Three algorithm tasks in most reviews, with 85 minutes in three of them, an hour and a half in one and 110 minutes in a senior review, taken at home within 8 to 15 days of receiving it. Reviews rate the tasks from easy to hard; one says solving two of the three was the bar, and another found the hidden test cases frustrating.' },
      { question: 'What is the Revolut Bar Raiser interview?', answer: 'The last round in the plans candidates report, after team fit. Revolut\'s careers video says it is where Revolut gets to know how you work and what drives you, and how your past decisions fit its culture. No frontend review used here describes its questions, so prepare stories with a decision, what it cost and how it ended.' },
      { question: 'Is there a take-home?', answer: 'Not in the 2022 to 2025 reviews: their coding is the HackerRank test, which you take at home before a deadline, and a live hour with an interviewer. A review dated 2020 describes a home test instead, a React widget built to 98% code coverage. Ask the recruiter whether your role has one.' },
      { question: 'Which stack should I prepare in?', answer: 'TypeScript and React. Revolut Tech\'s post on web engineering from October 2025 lists TypeScript, React and React Query, a Rush and Nx monorepo, Zod to validate every external boundary at runtime, and Jest, Playwright, Storybook and React Testing Library, kept to the latest stable releases and never more than one major version behind. The live-coding reviews name TypeScript, React and CodeSandbox.' },
      { question: 'Does every office interview the same way?', answer: 'The reviews differ in order and count: some open with the HackerRank test and others with the call, one had a 15-minute theory check with HR before the live hour, and separate design rounds appear in the 2023, 2024 and 2025 loops but not in the 2022 offer. Taro\'s place names are not the candidates\', so the reviews cannot tell you how a given office runs it.' },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Free practice for the Revolut rounds',
    intro:
      'Free drills in the order of the loop: the open question\'s own task first, then a warm-up and a plan for the HackerRank test, a design case on a money flow, and a structure for the last two conversations.',
    items: [
      { label: 'Fetch and render a list with loading, error and empty states', description: 'The open question\'s task: a request state you can type, in React and TypeScript.', path: '/react/coding/react-fetch-list-states' },
      { label: 'Valid Parentheses', description: 'A short algorithm warm-up before a timed three-task test.', path: '/javascript/coding/js-valid-parentheses' },
      { label: 'Data structures and algorithms for frontend loops', description: 'How to prepare an algorithm test without drowning in puzzles.', path: '/guides/interview-blueprint/dsa-for-fe' },
      { label: 'Resilient checkout and payment flow', description: 'A free frontend design case on a flow that moves money.', path: '/system-design/resilient-checkout-payment-flow' },
      { label: 'Behavioural stories', description: 'A structure for the team-fit and Bar Raiser conversations.', path: '/guides/behavioral/stories' },
    ],
  },
  sources: {
    kicker: 'Public interview reports and official context',
    title: 'Sources and evidence limits',
    intro: 'Each note says what that review or page covers and where it stops.',
    items: [
      { label: REVOLUT_APRIL_2025_LABEL, url: REVOLUT_APRIL_2025_URL, note: 'A review without an offer: an intro call on the CV, about 15 minutes of React theory with HR from a checklist, then the open question, an hour-long TypeScript task on a prepared boilerplate. The candidate finished it and was turned down; the feedback named type management and loading-state handling. Team fit and a Bar Raiser would have followed.', kind: 'report' },
      { label: REVOLUT_MAY_2025_LABEL, url: REVOLUT_MAY_2025_URL, note: 'A review without an offer: a recruiter call, a React round worked together with an interviewer, a frontend design round and a team-fit call about past experience, each named in a line.', kind: 'report' },
      { label: REVOLUT_MARCH_2025_LABEL, url: REVOLUT_MARCH_2025_URL, note: 'A screening call on salary and the next steps with some JavaScript questions, three LeetCode-style problems of which the candidate passed two, then a pair-programming round in React, where the loop ended.', kind: 'report' },
      { label: REVOLUT_NOVEMBER_2025_LABEL, url: REVOLUT_NOVEMBER_2025_URL, note: 'A test-only review: a HackerRank JavaScript test the candidate found straightforward and could mostly no longer recall. No later round is described.', kind: 'report' },
      { label: REVOLUT_REACT_2024_LABEL, url: REVOLUT_REACT_2024_URL, note: 'A HackerRank test of two easy problems and one medium in an hour and a half, to be done within 8 days, then an hour of live coding in CodeSandbox, which the candidate failed; the design and team-fit rounds were never reached.', kind: 'report' },
      { label: REVOLUT_SENIOR_APRIL_2024_LABEL, url: REVOLUT_SENIOR_APRIL_2024_URL, note: 'Three HackerRank tasks in 85 minutes, the third at a high-medium level, then an HR round on background that may include small technical questions, then a time-limited live round in React. A templated rejection followed, and a request for feedback went unanswered.', kind: 'report' },
      { label: REVOLUT_SENIOR_MAY_2024_LABEL, url: REVOLUT_SENIOR_MAY_2024_URL, note: 'A senior review rated negative: three HackerRank tasks in 110 minutes, a live-coding round, then a design round on Excalidraw in which, by the candidate\'s account, the interviewer\'s clarifying questions took the first 30 minutes and the rest was rushed.', kind: 'report' },
      { label: REVOLUT_TEST_MAY_2024_LABEL, url: REVOLUT_TEST_MAY_2024_URL, note: 'Three HackerRank tasks rated easy, medium and difficult in 85 minutes, barely enough to pass every hidden test case, then a screening call; the position closed before the technical interview.', kind: 'report' },
      { label: REVOLUT_WEB_2023_LABEL, url: REVOLUT_WEB_2023_URL, note: 'A month-long loop: a recruiter call that set out the steps, three HackerRank tasks, a round of React components and JavaScript questions, then a design interview to decide between mid and senior, and a templated rejection.', kind: 'report' },
      { label: REVOLUT_SENIOR_2023_LABEL, url: REVOLUT_SENIOR_2023_URL, note: 'A screening test of three problems, the third harder than the first two, then a technical interview of common JavaScript questions and a second of React questions with a small coding task. Rated positive, without an offer.', kind: 'report' },
      { label: REVOLUT_TEST_2022_LABEL, url: REVOLUT_TEST_2022_URL, note: 'A first call, then three HackerRank algorithm questions as homework, 85 minutes for all three within 15 days, and two or three technical questions after that. Rated negative; the candidate recalls the tasks only roughly.', kind: 'report' },
      { label: REVOLUT_OFFER_2022_LABEL, url: REVOLUT_OFFER_2022_URL, note: 'The only review with an offer: three HackerRank problems rated easy, medium and hard, a technical interview on React, state management, software principles and design, and a culture-fit round. No separate design round and no Bar Raiser.', kind: 'report' },
      { label: 'Public report: Blind frontend interview plan, March 2026', url: REVOLUT_BLIND_PLAN_2026_URL, note: 'A frontend engineer at another company, preparing for Revolut, lists the stages they expect: a screening round, a technical interview on core JavaScript and React with system design, team fit and a Bar Raiser. Written before the interview; it names no question.', kind: 'report' },
      { label: 'Blind: Revolut front-end interview thread, April 2022', url: REVOLUT_BLIND_2022_URL, note: 'A Berlin candidate with five years\' experience asks about two technical rounds. A reply that reads like the poster\'s lists LeetCode, JavaScript fundamentals and React and expects no system design; another, about a bar raiser failed two years earlier, does not name the company, so the guide does not use it.', kind: 'report' },
      { label: 'Revolut Tech: Building the Web that Moves Money, October 2025', url: REVOLUT_WEB_ENGINEERING_URL, note: 'Official post from 16 October 2025. Its interviews put candidates in real-world scenarios rather than obscure JavaScript puzzles and value practical problem solving, delivery end to end and a sense of perfection; it lists the stack and the customer-facing and internal web products. It names no interview question.', kind: 'official' },
      { label: 'Revolut Careers: How to succeed in your Bar Raiser interview', url: REVOLUT_BAR_RAISER_VIDEO_URL, note: 'Official careers video on the Revolut YouTube channel, published June 2025. Its description says the Bar Raiser is where Revolut gets to know how you work and what drives you, and whether your decision-making fits its culture; the guide uses it for the stage and its purpose, not for questions.', kind: 'official' },
      { label: 'Revolut Careers: Engineering', url: 'https://www.revolut.com/careers/team/engineering/', note: 'Lists four hiring steps, an intro call with an IT recruiter, tech interviews, team fit and offer, with no formats or durations.', kind: 'official' },
    ],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full Revolut practice set',
    copy:
      'Premium opens the locked Revolut questions with their answer guides and practice tasks, and the wider premium library of coding, concept and system-design practice.',
    buttonLabel: 'Unlock the full Revolut practice set',
    src: 'company_preview_revolut',
  },
  about: [
    'Revolut frontend interview preparation',
    'Revolut HackerRank assessment',
    'TypeScript fetch-and-render live coding',
    'Revolut Bar Raiser interview',
  ],
  indexAnchorLabel: 'Revolut frontend interview questions',
};
