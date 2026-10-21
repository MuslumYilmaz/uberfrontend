import type { AuthoredCompanyPreview } from '../../shared/company-previews/authored-company-preview.model';

/**
 * Agoda frontend interview guide. Every prompt is a FrontendAtlas practice version modelled on public,
 * self-reported frontend accounts (LeetCode, Code360, Medium, Blind and frontendgeek, 2025 to 2026, mostly
 * Bangkok relocation loops interviewed from India plus two Gurgaon loops) and on Agoda's own interview-process
 * page and interviewer's guide. Nothing here is a leaked, confirmed or official Agoda question, and six accounts
 * cannot establish a fixed loop.
 */
const AGODA_BANGKOK_2026_URL = 'https://leetcode.com/discuss/post/8459009/';
const AGODA_BANGKOK_2026_LABEL = 'Public report: LeetCode senior frontend engineer loop, Bangkok, July 2026';
const AGODA_GURGAON_2025_URL =
  'https://www.naukri.com/code360/interview-experiences/agoda/agoda-interview-experience-by-brijesh-verma-may-2025-exp-0-2-years';
const AGODA_GURGAON_2025_LABEL = 'Public report: Code360 frontend engineer loop, Gurgaon, May 2025';
const AGODA_OFFER_2025_URL =
  'https://kr-viku.medium.com/%EF%B8%8F-my-agoda-interview-journey-from-first-call-to-offer-086385b03d33';
const AGODA_OFFER_2025_LABEL = 'Public report: Medium senior software engineer offer, Bangkok, September 2025';
const AGODA_STAFF_2025_URL = 'https://leetcode.com/discuss/interview-question/6398233';
const AGODA_STAFF_2025_LABEL = 'Public report: LeetCode staff frontend engineer loop, Bangkok, February 2025';
const AGODA_BLIND_GURGAON_2025_URL = 'https://www.teamblind.com/post/my-interview-experience-with-agoda-zhhgctzk';
const AGODA_BLIND_GURGAON_2025_LABEL = 'Public report: Blind senior software engineer loop, Gurgaon, June 2025';
const AGODA_BANGALORE_2025_URL =
  'https://www.frontendgeek.com/interview-experience/staff-frontend-interview-experience-at-agoda-rejected-thailand-relocation---f13f1824-08d9-4385-a219-269aaeb3d301';
const AGODA_BANGALORE_2025_LABEL = 'Public report: frontendgeek staff frontend engineer loop, Bangalore, July 2025';
const AGODA_HOW_WE_HIRE_TECH_URL = 'https://careersatagoda.com/blog/how-we-hire-agodas-tech-team-interview-process/';
const AGODA_INTERVIEWER_GUIDE_URL = 'https://medium.com/agoda-engineering/preparing-for-interview-at-agoda-2c07b7d13ca5';

export const AGODA_PREVIEW_TITLE = 'Agoda Frontend Interview Questions: 5 Prompts + Prep Guide';
export const AGODA_PREVIEW_H1 = 'Agoda Frontend Interview Questions';
export const AGODA_PREVIEW_DESCRIPTION =
  'Prepare for an Agoda frontend interview with 5 practice prompts modelled on public reports: hotel search page, React take-home, web fundamentals, debounce, DSA.';
export const AGODA_PREVIEW_CANONICAL_PATH = '/companies/agoda/preview';
export const AGODA_PREVIEW_TRUST_NOTE =
  'These are FrontendAtlas practice versions modelled on rounds described in public interview reports, not leaked, confirmed or official Agoda questions. Six self-reported loops cannot establish a fixed format; use recruiter-provided material as the source of truth.';

export const AGODA_COMPANY_PREVIEW: AuthoredCompanyPreview = {
  slug: 'agoda',
  label: 'Agoda',
  title: AGODA_PREVIEW_TITLE,
  h1: AGODA_PREVIEW_H1,
  description: AGODA_PREVIEW_DESCRIPTION,
  canonicalPath: AGODA_PREVIEW_CANONICAL_PATH,
  trustNote: AGODA_PREVIEW_TRUST_NOTE,
  hero: {
    kicker: 'Public Agoda prep guide',
    subtitle:
      'Prepare with five practice prompts shaped by six public frontend accounts from 2025 and 2026, most of them Bangkok relocation loops interviewed from India, and by Agoda\'s own description of its four rounds: a hotel search page frontend designed from scratch for a million users and several teams, a scalable architecture for a travel booking site, a React and TypeScript take-home on stock data, a one-hour web-fundamentals round that runs from CDN caching to CSRF and Core Web Vitals, and a JavaScript implementation round beside a HackerRank coding hour.',
    caveat:
      'This guide uses public, self-reported interview accounts and Agoda\'s published careers and engineering pages to create realistic constraints. It does not claim access to private interview material, a fixed interview format, or the stack of every Agoda team.',
    chips: ['5 practice prompts', 'React, TypeScript, web platform', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'Prepare for product judgment, not Agoda trivia',
    paragraphs: [
      'The public accounts converge on a loop run remotely on HackerRank with about a week between rounds: a coding hour with two easy-to-medium problems and verbal questions on test cases and pull requests, a Frontend Platform hour, a preliminary call in which the level is set, an architecture hour on a product such as a hotel search page, and a culture-fit conversation with an engineering manager. Agoda\'s own interview-process page lists the same four rounds, Coding, Platform, System Design and Agoda Culture Fit, and its interviewer\'s guide says the Platform round typically asks candidates to implement something related to Agoda and often includes reviewing, fixing and improving a given code snippet.',
      'The round that sets the level is the Platform hour, and its content varies by interviewer: a 2026 Senior candidate got a web-fundamentals question-and-answer hour with no code, a 2025 Staff candidate got a JavaScript implementation grown out of a resume item, and a 2025 Senior candidate was told to expect component reusability, state management, handling API data and rendering performance. Each prompt below starts with the clarifying questions a strong candidate asks, then the behaviours a strong answer covers, then the miss that usually ends the round.',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked October 2026',
    title: 'What the public accounts establish, and what you still need to confirm',
    paragraphs: [
      'Six self-reported frontend accounts inform this guide. LeetCode, July 2026, a Senior Software Engineer (Frontend) candidate in a Bangkok relocation loop who had applied for Staff: three HackerRank rounds a week apart, two easy problems (Rank Transform of an Array and Climbing Stairs with 1, 2 or 3 steps) with questions on test cases and pull requests, a one-hour web-fundamentals question-and-answer round, a hotel search page architecture hour, a down-level after the second round and a rejection. Code360, May to June 2025, a Frontend Engineer in Gurgaon: a Stock Analyzer Dashboard take-home in React and TypeScript, an hour of Longest Substring Without Repeating Characters plus a debounced utility function, an hour of frontend architecture for a travel booking site and a technical-strategy hour, every round marked Cleared and the outcome a rejection. Medium, August to September 2025, a Senior Software Engineer in Bangkok with an offer: the recruiter\'s seven-step list with durations, a 15-minute prep call, 60-minute Coding and Platform interviews, a 30-minute preliminary call, 60-minute Architecture, BE Platform and Culture Fit interviews, the Platform interview also on HackerRank, and the manager presenting the offer. LeetCode, February 2025, a Staff Frontend candidate in Bangkok who was selected: two medium problems in JavaScript, a pipeline function extended to an async limit, and a doctor appointment booking application in the architecture round. Blind, June 2025, a Senior Software Engineer in Gurgaon: an assessment with 8 HTML/CSS questions and 2 JavaScript problems, an HR screen, a HackerRank round, a platform round on hoisting, class behaviour, SSR versus CSR, atomic design and testing, then a rejection without a managerial round; a commenter adds that the recruiters and interviewers were in Bangkok. frontendgeek, July 2025, a Staff candidate in Bangalore interviewing for Thailand relocation: a phone screen on JavaScript basics, promises and a sliding-window problem, a DSA and JavaScript round and a live HackerRank stack problem, not selected.',
      'Together they establish that these round types occurred in 2025 and 2026; they do not establish exact wording, the current format, or how the Gurgaon, Manila and Bangalore teams interview today. Confirm with the recruiter whether a HackerRank assessment opens the loop, which rounds belong to the Staff track, which tool each round uses and the timing. Agoda publishes its process on its careers site, which our tools could only read from an archive capture, and an interviewer\'s guide on its engineering blog; use them for the round names and the Platform round\'s intent, not as evidence of specific questions.',
    ],
  },
  roleLenses: {
    kicker: 'Role lenses',
    title: 'Two product contexts for practising transferable frontend judgment',
    intro:
      'These are preparation lenses based on Agoda\'s own description of its front-end work, not claimed team assignments. Choose the lens closest to the role and keep the reasoning framework-neutral.',
    items: [
      {
        title: 'Customer-facing booking surfaces',
        description:
          'Agoda\'s interview-process page describes TypeScript with React and Redux, Rspack and Vite for bundling, and micro-front-end and cross-platform solutions; the reported architecture rounds asked for a hotel search page and a travel booking site.',
        practiceFocus:
          'Search and filter state that survives reloads and shared links, rendering strategy per page type, CDN caching with explicit invalidation, and a funnel from search to payment that can be measured.',
      },
      {
        title: 'Front-facing API services',
        description:
          'The interviewer\'s guide says front-end developers also contribute to front-facing API services, and the reported Platform and BE Platform rounds asked about API data handling, token storage, CSRF and XSS, performance bottlenecks and production debugging.',
        practiceFocus:
          'Typed data at the API boundary, session and token placement with its security trade-offs, request cancellation and retries, and the metrics you would watch after a deploy.',
      },
    ],
  },
  prompts: {
    kicker: 'Representative practice prompts',
    title: 'Five Agoda frontend interview practice questions',
    intro:
      'For each prompt, clarify the contract, explain ownership and trade-offs, implement or diagram the smallest credible slice, and test the failure cases. Each prompt links to the public report it is modelled on and to a practice page.',
    itemListName: 'Five Agoda frontend interview practice prompts',
    items: [
      {
        id: 'hotel-search-page-frontend-architecture',
        title: 'Design a hotel search page frontend from scratch for a million users and several teams',
        statement:
          'Given a wireframe with date, city and guest inputs on top, filters on the left and result cards on the right, design the frontend: scalable, maintainable and observable, with a real-time chat integration, able to support a million users, multiple teams and fast, independent deploys of features. No diagram is expected; talk through the decisions and the follow-ups: micro-frontends, monorepo versus multi-repo, framework and bundler choice, where the filter and input state lives and in which components, component breakdown, testing architecture and monitoring.',
        whatThisMeasures:
          'Decomposition of a product page into ownable units, state placement for inputs and filters, deploy boundaries between teams, and whether you can name what you would measure once it is in production.',
        clarifyFirst: [
          'Confirm what independent deploys must mean: separate bundles composed on one page, separate routes, or separate repositories with their own release cadence.',
          'Confirm what the result cards need from the inputs: does a filter change refetch, re-rank a loaded set, or both, and must a shared link reproduce the same results?',
        ],
        strongAnswer: [
          'Split the page by ownership rather than by visual block: search inputs, filters and results as separately deployable units behind a thin shell, and say what the shell owns (routing, auth, layout, the design system) and what it does not.',
          'Keep the search inputs and selected filters in the URL as the source of truth so a link reproduces a result set, derive component state from it, and name the single writer for each piece.',
          'Name the build: one framework version shared through the shell, a bundler that supports runtime composition of the units, and a contract test per unit so a team can release without a page-wide deploy.',
          'Make it observable before it ships: Core Web Vitals per route, error rates per unit, and a search-to-view-to-book funnel carrying a search id, so a regression points to one deploy.',
        ],
        commonMiss:
          'Drawing the three visual areas as components and stopping there, with no answer for who deploys what, where the filter state lives, or how a regression would be noticed.',
        resourceLabel: 'Work through the real-time search with debounce and caching case (Premium)',
        resourcePath: '/system-design/realtime-search-debounce-cache',
        reportedRound: { label: AGODA_BANGKOK_2026_LABEL, url: AGODA_BANGKOK_2026_URL },
      },
      {
        id: 'travel-booking-frontend-architecture',
        title: 'Design a scalable frontend architecture for a travel booking website',
        statement:
          'Design the frontend architecture for a travel booking website similar to Agoda: it must handle high traffic, support micro-frontends, render SEO-friendly pages with SSR or SSG, and include performance optimisations. Say which pages are server-rendered, how the micro-frontends share a shell, and what you cache where.',
        whatThisMeasures:
          'Rendering-strategy judgment per page type, the real cost of micro-frontends, caching layers from the CDN to the browser, and performance reasoning tied to measurable metrics rather than to a list of features.',
        clarifyFirst: [
          'Confirm which pages matter for SEO (landing and property pages) and which sit behind a login (booking and account), since they want different rendering.',
          'Confirm the team shape: how many teams ship to the same page and whether they need separate release cadences, which is the reason to pay for micro-frontends.',
        ],
        strongAnswer: [
          'Pick rendering per page: SSG or ISR for stable landing content, SSR for search results that depend on dates and availability, client-side rendering inside the authenticated booking flow; say why each choice is cheap or costly.',
          'Make micro-frontends a team boundary: a shell that owns routing, auth and the design system, shared dependencies pinned once, and a contract per unit so one team\'s deploy cannot break another\'s.',
          'Layer the caches: CDN for HTML and assets with explicit invalidation when prices or availability change, HTTP caching with ETags for API reads, and a client cache keyed by the search parameters.',
          'Tie performance to numbers: a Core Web Vitals budget per route, code-splitting by route and by unit, an image policy for property photos, and field measurement so the budget is checked in production.',
        ],
        commonMiss:
          'Listing SSR, micro-frontends and a CDN as features without saying which page gets which, so the interviewer cannot tell whether you understand the cost of each.',
        resourceLabel: 'Work through the car rental booking frontend case (Premium)',
        resourcePath: '/system-design/car-rental-booking-frontend',
        reportedRound: { label: AGODA_GURGAON_2025_LABEL, url: AGODA_GURGAON_2025_URL },
      },
      {
        id: 'react-typescript-stock-dashboard-take-home',
        title: 'Build the React and TypeScript stock dashboard take-home, then explain it in the follow-up hour',
        statement:
          'Build a React and TypeScript single-page application that fetches stock data from a given API and shows it in paginated tables with summary statistics (the lowest value, the average open price for one year, the longest streak where close is above open), with attention to performance, modular architecture and clean code. In the 60-minute follow-up the same account was asked for Longest Substring Without Repeating Characters and to \'Create a debounced utility function in JavaScript.\'',
        whatThisMeasures:
          'Request-state handling, typed data at the API boundary, derived statistics computed once from the full dataset, pagination that stays correct when the data changes, and whether you can explain each module\'s job when asked.',
        clarifyFirst: [
          'Confirm the API shape, the page size, whether pagination is server-side or client-side, and what an empty or failed fetch must show.',
          'Confirm the definition of each statistic: which field is the lowest value, which year the average covers, and how a streak is counted across gaps in the data.',
        ],
        strongAnswer: [
          'Hold the request in one discriminated union with loading, success, empty and error states, and type the response once at the fetch boundary.',
          'Compute the statistics in a pure, tested module from the full dataset rather than from the visible page, and memoise them on the data reference.',
          'Drive the table from a page index and page size held in state or the URL, derive the visible slice from the sorted data, and reset the page when the dataset changes; the React paginated data table drill at /react/coding/react-pagination-table (Premium) covers this slice.',
          'Separate the data layer, the statistics and the table components so each has one job; in the follow-up, write the debounce with one timer per instance, a cancel method, and the preserved this and arguments.',
        ],
        commonMiss:
          'Computing the statistics inside the table\'s render from the current page, so the lowest value changes when the user pages, and a debounce that clears no timer and so still fires the stale call.',
        resourceLabel: 'Practice the fetch-and-render exercise (free)',
        resourcePath: '/react/coding/react-fetch-list-states',
        reportedRound: { label: AGODA_GURGAON_2025_LABEL, url: AGODA_GURGAON_2025_URL },
      },
      {
        id: 'web-fundamentals-platform-hour',
        title: 'Answer the one-hour web-fundamentals Platform round without writing code',
        statement:
          'A one-hour question-and-answer round, as a 2026 account reported it: techniques to optimise page landing speed; SSG, SSR, CSR and ISR; the core entities of a hotel booking page; what to cache in a CDN and how updates reach it; the ways to store data on the client and where to store the authentication token with the security implications of each; what CSRF and XSS are and how to mitigate them; the ways to hold state in React; where to store the selected filters on a hotel booking page, in state or in query params; how to measure page performance with Core Web Vitals; how to track a funnel from search to view to book to pay; testing strategies with an example of each; and how to manage test failures that are not caused by your own code.',
        whatThisMeasures:
          'Breadth across the web platform with precise answers, trade-off reasoning for storage and rendering choices, security basics stated correctly, and whether you can tie performance and testing to how a product team works.',
        clarifyFirst: [
          'Ask whether the interviewer wants a definition or a recommendation for the product; for the storage and rendering questions, give the recommendation and its trade-off.',
          'For the hotel booking page questions, confirm the scenario before answering: logged in or not, shared links expected or not, how often prices change.',
        ],
        strongAnswer: [
          'Storage: cookies travel with every request and can be HttpOnly, Secure and SameSite; localStorage persists and is readable by any script on the origin; sessionStorage lives per tab. Put a session token in an HttpOnly, SameSite cookie and say why script-readable storage loses to XSS.',
          'Security: XSS runs attacker script in your origin and is mitigated by escaping, safe DOM APIs and a Content Security Policy; CSRF forges a request that carries the user\'s cookies and is mitigated by SameSite cookies, anti-CSRF tokens and origin checks.',
          'Rendering and caching: SSG or ISR for stable pages, SSR for date-dependent search results, CSR behind a login; cache HTML and assets in the CDN with versioned asset names and explicit invalidation for content that changes.',
          'Filters and funnels: keep the selected filters in the query string so a link reproduces the search and mirror them into state for the UI; track the funnel with one event per stage carrying a search id so the counts can be joined; measure LCP, CLS and INP in the field.',
          'Testing: unit tests for pure logic with boundary cases, integration tests for component contracts, screenshot tests for layout; for failures outside your code, mock the external dependency or use a mock server, make tests independent of each other, and retry only tests you have marked as flaky.',
        ],
        commonMiss:
          'Answering localStorage for the token without naming the XSS exposure, or describing CSRF as a variant of XSS; the round checks whether the trade-off is understood, not whether the term is recognised.',
        resourceLabel: 'Review cookies versus sessionStorage versus localStorage (free)',
        resourcePath: '/javascript/trivia/js-cookie-sessionstorage-localstorage',
        reportedRound: { label: AGODA_BANGKOK_2026_LABEL, url: AGODA_BANGKOK_2026_URL },
      },
      {
        id: 'javascript-pipeline-and-hackerrank-coding-hour',
        title: 'Implement a pipeline function, extend it to an async limit, and clear the HackerRank coding hour',
        statement:
          'Two rounds reported from Bangkok loops. First, a JavaScript implementation round grown from the resume: a 2025 Staff candidate was asked to implement a pipeline function and then extend it so asynchronous steps run under a concurrency limit, in 40 to 50 minutes, followed by 10 to 15 minutes of behavioural questions. Second, the coding hour on HackerRank: two easy-to-medium problems (a 2026 account names Rank Transform of an Array and Climbing Stairs with 1, 2 or 3 steps) with complexity analysis, then verbal questions on which test cases you would write and what to check before raising a pull request.',
        whatThisMeasures:
          'Function composition and closures, promise sequencing with a concurrency cap, clean JavaScript under pair programming, complexity analysis, and whether you can talk about testing and code review as everyday work.',
        clarifyFirst: [
          'For the pipeline: confirm whether synchronous and asynchronous steps can be mixed, whether result order must be preserved, and what should happen when one step rejects.',
          'For the coding hour: read the constraints and samples before writing; confirm whether the interviewer wants the brute-force version first and whether tests should be written in the editor.',
        ],
        strongAnswer: [
          'Write the synchronous pipeline as a reduce over the functions, then an async version that awaits each step in sequence; for the limit, keep at most N promises in flight, start the next task when one settles, and store results in input order.',
          'Decide whether the first rejection fails the whole run or is collected, say which, and state the time complexity and the memory cost of the results array.',
          'For the two problems, write the simplest correct version first, state the time and space complexity, then handle empty input, a single element and ties out loud.',
          'When asked about tests, list boundary cases first (empty, one item, maximum size, invalid input), then name unit, integration and end-to-end tests with an example of each; for the pull-request question, mention a self-review, passing tests, a scoped diff and a description that states the reason for the change.',
        ],
        commonMiss:
          'An async limit built from a counter and polling with setTimeout instead of promise settlement, and a resume that lists a utility you cannot write on request; the 2025 account\'s own advice was not to mention anything that can be turned into a JavaScript function you have not already prepared.',
        resourceLabel: 'Practice the debounce utility (free)',
        resourcePath: '/javascript/coding/js-debounce',
        reportedRound: { label: AGODA_STAFF_2025_LABEL, url: AGODA_STAFF_2025_URL },
      },
    ],
  },
  walkthrough: {
    kicker: 'Public mini walkthrough',
    title: 'Scope the hotel search page before the first sentence',
    intro:
      'Treat this as a representative exercise, not a description of the reported one. Work from the requirements toward the deploy boundaries, and say each decision out loud; the reported round expected no diagram.',
    steps: [
      { title: 'Pin the requirements', description: 'Name the three input groups, the filters, the result cards, the chat integration and the non-functional targets: a million users, several teams, fast independent deploys, observability.' },
      { title: 'Decide state ownership', description: 'Put the search inputs and the selected filters in the URL as the source of truth, derive component state from it, and name the single writer for each piece.' },
      { title: 'Break the page into units', description: 'A shell that owns routing, layout, auth and the design system; search, filters and results as units with a typed contract between them; shared dependencies pinned once.' },
      { title: 'Draw the deploy boundary', description: 'One unit per team, built with a bundler that supports runtime composition, released on its own cadence with a contract test the shell runs before it mounts the unit.' },
      { title: 'Make it observable', description: 'Core Web Vitals per route, error rates per unit, and a search-to-view-to-book funnel keyed by a search id, so a regression points to one deploy.' },
      { title: 'Test the edges', description: 'A shared link with stale filters, a slow results unit while the inputs render, a filter change during an in-flight request, and a unit that fails to load.' },
    ],
  },
  prepPlan: {
    kicker: 'Actionable preparation',
    title: 'A 7-day Agoda frontend interview preparation plan',
    intro: 'Every day ends with code, a test, a design artifact, or a question you can use in the real process.',
    days: [
      { day: 'Day 1', focus: 'Web fundamentals: client storage and token placement, CSRF versus XSS, HTTP and CDN caching, SSG, SSR, CSR and ISR per page type, Core Web Vitals.', artifact: 'A one-page answer sheet with a recommendation and a trade-off for each topic.' },
      { day: 'Day 2', focus: 'Utility functions: a debounce with cancel, a pipeline in synchronous and asynchronous forms, an async limit that preserves order.', artifact: 'Three implementations with tests you can retype from memory.' },
      { day: 'Day 3', focus: 'The coding hour: two easy-to-medium problems in JavaScript against a timer, then the test cases and the pull-request checklist said out loud.', artifact: 'A time log with the complexity stated for each solution.' },
      { day: 'Day 4', focus: 'The take-home shape: a typed fetch with loading, error and empty states, a paginated table, summary statistics in a pure module.', artifact: 'A small dashboard with one test per statistic and per request state.' },
      { day: 'Day 5', focus: 'Architecture: the hotel search page and the travel booking site; rendering per page, micro-frontend boundaries, caching layers, observability.', artifact: 'Two one-page designs with the reported follow-up questions answered in writing.' },
      { day: 'Day 6', focus: 'Behavioural: stories about conflict, a production incident, deadlines versus quality, mentoring and disagreeing with product, told as context, action and result.', artifact: 'Six stories with a measurable result, mapped to the culture-fit and technical-strategy topics the accounts list.' },
      { day: 'Day 7', focus: 'Mock loop: one coding hour, one Platform hour and one architecture hour on a shared editor, each narrated.', artifact: 'A list of the questions you will ask the recruiter about the assessment, the Staff track, the tools and the timing.' },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common Agoda frontend interview preparation questions',
    items: [
      { question: 'Are these the real Agoda questions?', answer: 'No. They are FrontendAtlas practice versions modelled on round types and prompts described in public, self-reported accounts and on Agoda\'s own process pages. The wording, the data and the test cases are ours.' },
      { question: 'Is every round on HackerRank?', answer: 'The two Bangkok accounts that describe the tooling say so: the July 2026 account reports that all of its rounds were online on HackerRank with a week between them, and the September 2025 offer account says the Frontend Platform interview was also conducted through HackerRank. Agoda\'s process page describes a HackerRank online test as the coding assessment. One Gurgaon account names HackerRank for its coding round only, and the Code360 account names no tool, so confirm the tool for each round with the recruiter.' },
      { question: 'What is the Platform round?', answer: 'Agoda\'s process page lists it as the second of four rounds, after Coding and before System Design and Culture Fit. The interviewer\'s guide on the Agoda Engineering blog says the Platform round typically asks candidates to implement something related to Agoda and often includes reviewing, fixing and improving a given code snippet, playing the role of a lint tool. The frontend accounts describe three shapes: a web-fundamentals question-and-answer hour with no code in July 2026, a JavaScript implementation grown out of a resume item followed by behavioural questions in February 2025, and a discussion of component reusability, state management, API data handling and rendering performance in September 2025. Prepare for all three.' },
      { question: 'Can I be down- or up-levelled?', answer: 'In the accounts used here the level is set after the Platform round. The July 2026 candidate applied for Staff and was moved to Senior after the second round; the September 2025 Senior candidate was moved to the Staff track and got an extra hour, a BE Platform interview on a hotel booking system; a commenter on the June 2025 Blind thread describes the same path: Staff consideration after the platform round, then one architecture round, then culture fit. Ask the recruiter which track you are on before the architecture round.' },
      { question: 'Does Agoda ask DSA?', answer: 'The accounts say yes, at easy-to-medium level and in JavaScript. The July 2026 Senior loop opened with Rank Transform of an Array and Climbing Stairs with 1, 2 or 3 steps, with complexity analysis; the February 2025 Staff loop had two medium problems one after the other with pair programming and feedback corrections; a September 2025 full-stack account describes two medium problems on HackerRank finished in 35 minutes. Some loops also open with a HackerRank assessment. The interviewer\'s guide says the Coding round looks for testing skills, critical and systematic thinking, code efficiency and readability, and computer science knowledge.' },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Build the underlying skills with free practice',
    intro:
      'These public pages cover the utility, request-state, security, caching, rendering and testing skills used by the practice prompts. They are supporting drills, not claimed Agoda questions.',
    items: [
      { label: 'Debounce', description: 'The utility the Gurgaon follow-up asked for, with cancel and preserved arguments.', path: '/javascript/coding/js-debounce' },
      { label: 'Fetch and render a list with loading, error and empty states', description: 'The request-state core of the stock dashboard take-home.', path: '/react/coding/react-fetch-list-states' },
      { label: 'DOM XSS prevention', description: 'Dangerous sinks, safe APIs and Trusted Types for the security question.', path: '/javascript/trivia/js-xss-dom-sinks' },
      { label: 'Cookie versus sessionStorage versus localStorage', description: 'Where to store the authentication token and why.', path: '/javascript/trivia/js-cookie-sessionstorage-localstorage' },
      { label: 'HTTP caching basics', description: 'Cache-Control, ETag and 304 behind the CDN questions.', path: '/javascript/trivia/http-caching-basics' },
      { label: 'SSR and hydration in React', description: 'The rendering question in both architecture prompts.', path: '/react/trivia/react-ssr-hydration' },
      { label: 'When does a React app need Redux?', description: 'Local state, Context and external stores for the state-management question.', path: '/react/trivia/react-state-management-redux' },
      { label: 'Testing strategy: edge cases and boundaries', description: 'Boundary cases for the test-case question after the coding problems.', path: '/javascript/trivia/js-testing-edge-cases-strategy' },
      { label: 'Behavioural stories', description: 'A structure for the culture-fit and technical-strategy conversations.', path: '/guides/behavioral/stories' },
    ],
  },
  sources: {
    kicker: 'Public interview reports and official context',
    title: 'Sources and evidence limits',
    intro: 'These links support the public context used by the guide. Their notes state what each source can and cannot establish about preparation.',
    items: [
      { label: AGODA_BANGKOK_2026_LABEL, url: AGODA_BANGKOK_2026_URL, note: 'One self-reported Bangkok relocation loop interviewed in July 2026 for a Staff role, moved to Senior after the second round, without an offer. It establishes three HackerRank rounds a week apart, the two easy problems with test-case and pull-request questions, the full question list of the web-fundamentals hour and the hotel search page architecture round; it cannot establish the current format or what other interviewers ask in the Platform round.', kind: 'report' },
      { label: AGODA_GURGAON_2025_LABEL, url: AGODA_GURGAON_2025_URL, note: 'One self-reported Gurgaon loop from May to June 2025 with every round marked Cleared and a rejection as the outcome. It establishes the Stock Analyzer Dashboard take-home, the debounce follow-up, the travel booking architecture hour and the technical-strategy round; the page names no tool for the rounds, and its experience band disagrees with the account\'s eight-plus years.', kind: 'report' },
      { label: AGODA_OFFER_2025_LABEL, url: AGODA_OFFER_2025_URL, note: 'One self-reported Bangkok loop from August to September 2025 that ended in an offer, read through the author\'s feed. It establishes the recruiter\'s seven-step list with durations, the Platform interview on HackerRank, the move to the Staff track with a BE Platform hour and the manager presenting the offer; it lists topics, not questions.', kind: 'report' },
      { label: AGODA_STAFF_2025_LABEL, url: AGODA_STAFF_2025_URL, note: 'One self-reported Staff Frontend loop in Bangkok from February 2025 that ended in selection. It establishes two medium problems in JavaScript, the pipeline function extended to an async limit, the doctor appointment booking design and the advice not to list unprepared utilities on the resume; it cannot establish the current format.', kind: 'report' },
      { label: AGODA_BLIND_GURGAON_2025_LABEL, url: AGODA_BLIND_GURGAON_2025_URL, note: 'One self-reported Gurgaon loop from June 2025 that ended with a rejection and no managerial round. It establishes the assessment with 8 HTML/CSS questions and 2 JavaScript problems, the HackerRank coding round and the platform topics; a commenter, not the poster, adds that the recruiters and interviewers were in Bangkok and describes the Staff track.', kind: 'report' },
      { label: AGODA_BANGALORE_2025_LABEL, url: AGODA_BANGALORE_2025_URL, note: 'One self-reported Staff loop from July 2025 by a Bangalore candidate interviewing for Thailand relocation, not selected. It establishes a phone screen on JavaScript basics, promises and a sliding-window problem, a DSA and JavaScript round and a live HackerRank stack problem; it ends earlier in the loop than the Bangkok accounts.', kind: 'report' },
      { label: 'Agoda Careers: How we hire, the Tech team interview process, July 2025', url: AGODA_HOW_WE_HIRE_TECH_URL, note: 'Official page describing a HackerRank online test as the coding assessment, four rounds (Coding, Platform, System Design and Agoda Culture Fit), a final decision typically within two weeks of the last round, and the front-end stack of TypeScript with React and Redux, Rspack and Vite. The live site blocks automated reads, so it was read from an archive capture of April 2026; it names no interview questions.', kind: 'official' },
      { label: 'Agoda Engineering: Preparing for an interview at Agoda, June 2023', url: AGODA_INTERVIEWER_GUIDE_URL, note: 'An interviewer\'s guide on the Agoda Engineering blog. It states what the Coding round looks for and that the Platform round typically asks candidates to implement something related to Agoda and often includes reviewing, fixing and improving a code snippet; it is from 2023 and names no questions.', kind: 'official' },
    ],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full Agoda practice set',
    copy:
      'This public guide is complete enough to plan a focused week. Premium unlocks the real-time search with debounce and caching case, the car rental booking frontend case, the React paginated data table drill and the wider premium library of coding, concept and system-design practice.',
    buttonLabel: 'Unlock the full Agoda practice set',
    src: 'company_preview_agoda',
  },
  about: [
    'Agoda frontend interview preparation',
    'Hotel search page frontend architecture',
    'Web fundamentals and browser security questions',
    'JavaScript utility and HackerRank coding rounds',
  ],
  indexAnchorLabel: 'Agoda frontend interview questions',
};
