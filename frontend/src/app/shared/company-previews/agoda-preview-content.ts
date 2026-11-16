import type { AuthoredCompanyPreview } from '../../shared/company-previews/authored-company-preview.model';

/**
 * Agoda frontend interview guide. The reported questions live with the process table (company-interview-processes.ts);
 * the five prompts here are the answer guides of some of them. The sources are self-reported accounts on LeetCode,
 * Code360, Medium, Blind, Substack, frontendgeek and Taro from 2024 to 2026, mostly Bangkok relocation loops, plus
 * Agoda's own interview-process page and interviewer's guide. Nothing here is a leaked, confirmed or official Agoda
 * question, and the accounts cannot establish a fixed loop.
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
// The re-apply rule (research record AO2, quoted from a 2025-07-15 archive capture of the 2021-11-08 post).
const AGODA_HOW_WE_HIRE_2021_URL = 'https://careersatagoda.com/blog/how-we-hire-for-tech-roles-at-agoda/';
const AGODA_INTERVIEWER_GUIDE_URL = 'https://medium.com/agoda-engineering/preparing-for-interview-at-agoda-2c07b7d13ca5';

export const AGODA_PREVIEW_TITLE = 'Agoda Frontend Interview Questions and Platform Interview Guide';
export const AGODA_PREVIEW_H1 = 'Agoda Frontend Interview Questions';
export const AGODA_PREVIEW_DESCRIPTION =
  'Agoda frontend interview: the Platform interview (60 min on HackerRank, three reported shapes), coding hour, architecture round and {#questions} reported questions.';
export const AGODA_PREVIEW_CANONICAL_PATH = '/companies/agoda/preview';
export const AGODA_PREVIEW_TRUST_NOTE =
  'Every question here was described by a candidate on a public page and is retold in our words: Agoda has confirmed none of them, nothing is leaked, and FrontendAtlas wrote the answer guides. {reports} public reports cover loops from 2024 to 2026, and Agoda says the order of its stages can change with the role, so trust your recruiter\'s description of your loop over this page.';

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
      'Front-end accounts from 2024 to 2026, most of them Senior and Staff loops for Bangkok with relocation, describe a 60-minute coding interview, a Platform hour whose shape depends on the interviewer, an architecture hour and a culture-fit conversation with an engineering manager; one July 2026 account had every round on HackerRank, a week apart. The {questions} questions candidates reported follow the round table; the first, a hotel search page design from a July 2026 loop, is open.',
    caveat:
      'Many of these candidates interviewed from India for Bangkok jobs; Gurgaon loops differ by team, Manila and Bangalore have too few accounts to describe a loop, and on 2026-10-21 every front-end posting was at Staff level or above.',
    chips: ['{#questions} reported questions', '{#reports} public reports, 2024–2026', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'Practise talking: in the newest loop only the coding hour asked for code',
    paragraphs: [
      'The newest front-end account (Bangkok, July 2026) wrote code only in the coding hour. Its Platform hour was fourteen spoken questions on page speed, rendering modes, CDN caching, client storage and token placement, CSRF and XSS, the entities of a hotel booking page, state in React, Core Web Vitals, funnel tracking and testing, and its architecture hour was the hotel search page talked through with no diagram. Prepare each of those as a two-minute answer that ends in a recommendation and its trade-off, not a definition.',
      'Other loops brought the code back. A February 2025 Staff loop\'s Platform hour turned a resume item into a pipeline function and then an async limit, and its author\'s advice was to list nothing on the resume that could become a JavaScript function you have not already written; a Gurgaon coding hour paired Longest Substring Without Repeating Characters with a debounce. Agoda\'s interviewer guide adds that the Platform round often hands over a snippet to review, fix and improve, so practise reading someone else\'s code aloud as well.',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked November 2026',
    title: 'What these Agoda accounts cover, and what only the recruiter can tell you',
    paragraphs: [
      'The accounts are candidates\' own posts on LeetCode, Medium, Blind, Code360, Substack, frontendgeek and Taro from 2024 to 2026: mostly Senior and Staff front-end loops for Bangkok with relocation, many interviewed from India, plus Gurgaon loops and a few full-stack loops and one new-graduate loop kept for their front-end questions. Agoda\'s interview-process page and an interviewer\'s guide on its engineering blog give the round names and what the Platform round is for; neither names a question.',
      'None of these accounts can settle the wording a candidate heard, the format in force this year or a particular team\'s habits, and the Platform hour in particular changed with the interviewer. Ask the recruiter whether a HackerRank test opens your loop and whether you are on the Senior or Staff track. Agoda\'s interview guide says live system design, technical Q&A and behavioural interviews must be done without AI tools unless you are asked to use them.',
    ],
  },
  roundSpotlights: [
    {
      id: 'platform-interview',
      kicker: 'Round decoder',
      title: 'Agoda Platform interview for frontend engineers: one hour, three shapes',
      lede: [
        'The Platform interview is the second of the four rounds on Agoda\'s interview-process page, after Coding and before System Design and Culture Fit. In the Bangkok front-end accounts it ran 60 minutes on HackerRank with an Agoda engineer, and the level track, Senior or Staff, was settled in the call that followed it.',
        'Agoda\'s interviewer guide says the round usually asks you to implement something related to Agoda and often hands you a code snippet to review, fix and improve. The front-end accounts each got a different hour: spoken questions on web fundamentals with no code (July 2026), a JavaScript implementation that grew out of an item on the resume (February 2025), and a discussion of front-end architecture (September 2025).',
      ],
      facts: [
        { label: 'Position in the loop', value: 'Second of four rounds: Coding, Platform, System Design, Agoda Culture Fit, as the Agoda careers page lists them (July 2025).' },
        { label: 'Length and tool', value: '60 minutes on HackerRank; one July 2026 account had a week between rounds.' },
        { label: 'Who runs it', value: 'An Agoda engineer; Agoda\'s interviewer guide describes the round from that engineer\'s side.' },
        { label: 'What it decides', value: 'The level track: a Staff applicant was moved to Senior after it in July 2026, and a Senior candidate was moved to the Staff track and given an extra BE Platform hour in September 2025.' },
        { label: 'Reported shapes', value: 'A spoken question-and-answer hour with no code; a JavaScript implementation built on your resume, then 10 to 15 minutes of behavioural questions; a discussion of front-end architecture.' },
        { label: 'Official description', value: 'Implement something related to Agoda, and review, fix and improve a code snippet, playing the role of a lint tool (Agoda Engineering interviewer guide, June 2023).' },
      ],
      practiceLink: { label: 'Rehearse the Platform hour with a free web-fundamentals drill', path: '/javascript/trivia/js-cookie-sessionstorage-localstorage' },
      processLink: { label: 'See the Platform interview row in the reported process', fragment: 'agoda-interview-process-1-stage-frontend-platform-interview' },
    },
    {
      id: 'architecture-interview',
      kicker: 'Round decoder',
      title: 'Agoda Architecture interview for frontend engineers: an hour of design without a diagram',
      lede: [
        'The Architecture interview is the System Design round on Agoda\'s interview-process page, the third of four, after Platform and before Culture Fit. In the front-end accounts it ran 60 minutes as a product design talked through with the interviewer, and the July 2026 account says no diagram was expected.',
        'The open question below comes from that July 2026 hour: a hotel search page built from scratch for a million users and several teams. Candidates moved to the Staff track had a second design hour, a BE Platform interview on backend design (September 2025).',
      ],
      facts: [
        { label: 'Position in the loop', value: 'Third of four rounds, after the Platform interview and before Culture Fit; the Staff track adds a BE Platform hour.' },
        { label: 'Length and format', value: '60 minutes; a product-design conversation, on HackerRank and with no diagram expected in the July 2026 account.' },
        { label: 'Follow-ups in the open question', value: 'Micro-frontends, monorepo or multi-repo, building and deploying each part on its own, framework and bundler choice, where the filter and input state lives and in which components, the component breakdown, testing architecture and monitoring.' },
        { label: 'Official description', value: 'The Agoda careers page lists System Design as the third of four rounds (Coding, Platform, System Design, Agoda Culture Fit).' },
      ],
      practiceLink: { label: 'Work through the hotel search page frontend case', path: '/system-design/hotel-search-page-frontend' },
      processLink: { label: 'See the Architecture interview row in the reported process', fragment: 'agoda-interview-process-1-stage-architecture-interview' },
    },
  ],
  roleLenses: {
    kicker: 'Role lenses',
    title: 'Booking screens and the front-facing APIs behind them',
    intro:
      'Agoda\'s own pages put front-end engineers on customer-facing booking surfaces built with TypeScript, React and Redux, and on the front-facing API services behind them. Neither lens is a team assignment; use the one your posting points to.',
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
          'The interviewer\'s guide says front-end developers also contribute to front-facing API services, and the reported Platform rounds asked about session management, token storage, CSRF and XSS, while the Staff-track BE Platform hour turned to performance bottlenecks, metrics and production debugging.',
        practiceFocus:
          'Typed data at the API boundary, session and token placement with its security trade-offs, request cancellation and retries, and the metrics you would watch after a deploy.',
      },
    ],
  },
  prompts: {
    kicker: 'Answer guides',
    title: 'Answer guides for the reported Agoda questions',
    intro:
      'For each question, clarify the contract, explain ownership and trade-offs, implement or diagram the smallest credible slice, and test the failure cases.',
    itemListName: 'Agoda answer guides',
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
        resourceLabel: 'Work through the hotel search page frontend case (Premium)',
        resourcePath: '/system-design/hotel-search-page-frontend',
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
          'Drive the table from a page index and page size held in state or the URL, derive the visible slice from the sorted data, and reset the page when the dataset changes.',
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
          'A one-hour question-and-answer round, as a 2026 account reported it: techniques to optimise page landing speed; SSG, SSR, CSR and ISR; the core entities of a hotel booking page; how a CDN works, what to cache in it and how updates reach it; the ways to store data on the client and where to store the authentication token with the security implications of each; what CSRF and XSS are and how to mitigate them; the ways to hold state in React; where to store the selected filters on a hotel booking page, in state or in query params; how to measure page performance with Core Web Vitals; how to track a funnel from search to view to book to pay; testing strategies with an example of each; and how to manage test failures that are not caused by your own code.',
        whatThisMeasures:
          'Breadth across the web platform with precise answers, trade-off reasoning for storage and rendering choices, security basics stated correctly, and whether you can tie performance and testing to how a product team works.',
        clarifyFirst: [
          'Ask whether the interviewer wants a definition or a recommendation for the product; for the storage and rendering questions, give the recommendation and its trade-off.',
          'For the hotel booking page questions, confirm the scenario before answering: logged in or not, shared links expected or not, how often prices change.',
        ],
        strongAnswer: [
          'Storage: cookies travel with every request and can be HttpOnly, Secure and SameSite; localStorage persists and is readable by any script on the origin; sessionStorage lives per tab. Put a session token in an HttpOnly, SameSite cookie and say why script-readable storage loses to XSS.',
          'Security: XSS runs attacker script in your origin and is mitigated by escaping, safe DOM APIs and a Content Security Policy; CSRF forges a request that carries the user\'s cookies and is mitigated by SameSite cookies, anti-CSRF tokens and origin checks.',
          'Rendering and CDN: SSG or ISR for stable pages, SSR for date-dependent search results, CSR behind a login. A CDN serves copies from edge locations near the user (CloudFront, Cloudflare, Akamai and Fastly are common ones); keep static assets there under versioned names that never need purging, and give HTML and price or availability data short lifetimes or explicit invalidation when they change.',
          'Landing speed: send less to the first view (split JavaScript by route, defer what sits below the fold, size and preload the hero image, compress and cache on the CDN) and keep the main thread free, which is what Lighthouse\'s Total Blocking Time, and the older Time to Interactive and First Input Delay, measure; then confirm LCP, INP and CLS in the field rather than from one lab run.',
          'Entities and state: a hotel booking page works with a search (destination, dates, guests), hotels with rooms, rates and availability per date, the filters and the booking itself. In React, keep UI-only state local, lift shared state to the nearest common parent, use context for values that rarely change and an external store such as Redux for state many distant components write; keep the selected filters in the query string so a link reproduces the search, and mirror them into state for the UI.',
          'Funnels: one analytics event per stage (search, view, book, pay) carrying a search id, so the counts can be joined and the drop between any two stages read directly.',
          'Testing: unit tests for pure logic with boundary cases, integration tests for component contracts, screenshot tests for layout; for failures outside your code, mock the external dependency or use a mock server, make tests independent of each other, and retry only tests you have marked as flaky.',
        ],
        commonMiss:
          'Answering localStorage for the token without naming the XSS exposure, or describing CSRF as a variant of XSS; the round checks whether the trade-off is understood, not whether the term is recognised.',
        resourceLabel: 'Read the twelve-question Platform hour answer guide (Premium)',
        resourcePath: '/javascript/trivia/js-web-fundamentals-hour-hotel-booking',
        reportedRound: { label: AGODA_BANGKOK_2026_LABEL, url: AGODA_BANGKOK_2026_URL },
      },
      {
        id: 'javascript-pipeline-and-hackerrank-coding-hour',
        title: 'Implement a pipeline function, extend it to an async limit, and clear the HackerRank coding hour',
        statement:
          'Two rounds reported from Bangkok loops. First, a JavaScript implementation round grown from the resume: a 2025 Staff candidate was asked to implement a pipeline function and then extend it so asynchronous steps run under a concurrency limit, in 40 to 50 minutes, followed by 10 to 15 minutes of behavioural questions. Second, the coding hour on HackerRank: two easy-to-medium problems with complexity analysis, then verbal questions on which test cases you would write and what to check before raising a pull request.',
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
    kicker: 'Mini walkthrough',
    title: 'Scope the hotel search page before the first sentence',
    intro:
      'Six steps through the open question\'s hotel search page, from requirements to the edge cases. The July 2026 interviewer expected no diagram, so each step is something you say rather than draw.',
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
    intro: 'One week for the rounds the Bangkok accounts describe: a timed coding hour, a Platform hour that may be all talk, an architecture hour without a diagram and a culture-fit conversation with a manager.',
    days: [
      { day: 'Day 1', focus: 'Web fundamentals out loud: list the web fundamentals you could not explain without notes, then answer each in two minutes with a recommendation and its trade-off.', artifact: 'A one-page answer sheet, one line of recommendation and one of trade-off per topic.' },
      { day: 'Day 2', focus: 'Your resume as a source of questions: for every utility your resume implies you could write, write it from memory, then add a cancel path or an asynchronous version.', artifact: 'Implementations with tests for each item, and a resume with anything you could not write taken off.' },
      { day: 'Day 3', focus: 'The coding hour: two easy-to-medium problems in JavaScript against a 60-minute timer on HackerRank, with the complexity of each stated before you move on.', artifact: 'A time log with the complexity stated for each solution.' },
      { day: 'Day 4', focus: 'Take-home shape: a React and TypeScript screen fed by a remote endpoint, with loading, error and empty states and the logic kept in modules you can test without the UI.', artifact: 'A small app with one test per request state and per piece of logic.' },
      { day: 'Day 5', focus: 'Architecture: the hotel search page from the open question, talked through without a diagram: the page split by team, the follow-ups the open question lists, and monitoring.', artifact: 'A one-page design with the open question\'s follow-ups answered in writing.' },
      { day: 'Day 6', focus: 'Behavioural: stories about conflict, a production incident, deadlines versus quality, mentoring and disagreeing with product, told as context, action and result.', artifact: 'Six stories with a measurable result, mapped to the culture-fit and technical-strategy questions in the behavioural list.' },
      { day: 'Day 7', focus: 'Mock loop: one coding hour, one Platform hour and one architecture hour on a shared editor, each narrated.', artifact: 'Your questions for the recruiter: whether a HackerRank test opens your loop, whether you are on the Senior or Staff track, and which rounds must be done without AI tools.' },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common Agoda frontend interview preparation questions',
    items: [
      { question: 'Are these the real Agoda questions?', answer: 'They are what candidates wrote about their own Agoda loops on LeetCode, Medium, Blind, Code360, Taro and similar public pages, retold in our words. Agoda has not confirmed any of them, and the answer guides and practice tasks are FrontendAtlas\'s own.' },
      { question: 'Is every round on HackerRank?', answer: 'The two Bangkok accounts that describe the tooling say so: the July 2026 account reports that all of its rounds were online on HackerRank with a week between them, and the September 2025 offer account says the Frontend Platform interview was also conducted through HackerRank. Agoda\'s process page describes a HackerRank online test as the coding assessment. One Gurgaon account names HackerRank for its coding round only, and the Code360 account names no tool, so confirm the tool for each round with the recruiter.' },
      { question: 'What is the Platform interview at Agoda?', answer: 'Agoda\'s process page lists it as the second of four rounds, after Coding and before System Design and Culture Fit. The interviewer\'s guide on the Agoda Engineering blog says the Platform round typically asks candidates to implement something related to Agoda and often includes reviewing, fixing and improving a given code snippet, playing the role of a lint tool. The front-end accounts describe three shapes: a spoken question-and-answer hour on web fundamentals with no code in July 2026, a JavaScript implementation grown out of a resume item and followed by behavioural questions in February 2025, and a front-end architecture discussion in September 2025. Prepare for all three.' },
      { question: 'Is there a cooling-off period after an Agoda rejection?', answer: 'Agoda\'s 2021 post on hiring for tech roles says a rejected candidate can re-apply to the same role after six months. One account, posted in February 2026, shows the wait in practice: a senior front-end candidate rejected in the second round of a Gurgaon loop applied again after the six-month cooling period and received an offer from a Bangkok loop. Neither source says whether another role or office can be tried sooner, so ask your recruiter.' },
      { question: 'Can I be down- or up-levelled?', answer: 'In the accounts used here the level is set after the Platform round. The July 2026 candidate applied for Staff and was moved to Senior after the second round; the September 2025 Senior candidate was moved to the Staff track and got an extra hour, a BE Platform interview on backend design; a commenter on the June 2025 Blind thread describes the same path: Staff consideration after the platform round, then one architecture round, then culture fit. Ask the recruiter which track you are on before the architecture round.' },
      { question: 'Does Agoda ask DSA?', answer: 'The accounts say yes, at easy-to-medium level and in JavaScript. The July 2026 Senior loop opened with two easy problems and complexity analysis; the February 2025 Staff loop had two medium problems one after the other with pair programming and feedback corrections; a September 2025 full-stack account describes two medium problems on HackerRank finished in 35 minutes. Some loops also open with a HackerRank assessment. The interviewer\'s guide says the Coding round looks for testing skills, critical and systematic thinking, code efficiency and readability, and computer science knowledge.' },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Build the underlying skills with free practice',
    intro:
      'Free practice for the shape of the Agoda rounds: a screen with every request state, the data structures the coding hour draws on, an architecture hour talked through, and stories for the culture fit. They practise the skills, not the reported questions themselves.',
    items: [
      { label: 'Fetch and render a list with loading, error and empty states', description: 'Every state of one typed request, shown on screen.', path: '/react/coding/react-fetch-list-states' },
      { label: 'DSA for frontend loops', description: 'A guide to read, not a timed task: the data structures and patterns front-end coding rounds use, each with a JavaScript drill.', path: '/guides/interview-blueprint/dsa-for-fe' },
      { label: 'Frontend system design blueprint', description: 'For the architecture hour, which the newest account says needed no diagram.', path: '/guides/system-design-blueprint' },
      { label: 'Behavioural stories', description: 'Context, action and result, the CAR shape Agoda\'s interview guide uses.', path: '/guides/behavioral/stories' },
    ],
  },
  sources: {
    kicker: 'Public interview reports and official context',
    title: 'Sources and evidence limits',
    intro: 'These links support the public context used by the guide. Their notes state what each source can and cannot establish about preparation.',
    items: [
      { label: AGODA_BANGKOK_2026_LABEL, url: AGODA_BANGKOK_2026_URL, note: 'One self-reported Bangkok relocation loop from July 2026, applied for at Staff level, moved to Senior after the second round and ended without an offer: three rounds on HackerRank a week apart, a coding hour, a spoken Platform hour and an architecture hour. It gives every question of its Platform hour, which other interviewers may not repeat.', kind: 'report' },
      { label: AGODA_GURGAON_2025_LABEL, url: AGODA_GURGAON_2025_URL, note: 'One self-reported Gurgaon loop from May to June 2025 with every round marked Cleared and a rejection as the outcome: a take-home, a coding hour, a front-end architecture hour and a technical-strategy hour. The page names no tool for the rounds, and its experience band disagrees with the account\'s eight-plus years.', kind: 'report' },
      { label: AGODA_OFFER_2025_LABEL, url: AGODA_OFFER_2025_URL, note: 'One self-reported Bangkok loop from August to September 2025 that ended in an offer, read through the author\'s feed: the recruiter\'s seven-step list with durations, a Platform interview on HackerRank, a move to the Staff track with an extra BE Platform hour, and the manager presenting the offer. It lists topics, not questions.', kind: 'report' },
      { label: AGODA_STAFF_2025_LABEL, url: AGODA_STAFF_2025_URL, note: 'One self-reported Staff Frontend loop in Bangkok from February 2025 that ended in selection: a coding round of two medium problems, a JavaScript implementation round grown from the resume, and a high-level design round. Its author\'s advice is to list nothing on the resume you could not write as a function on request.', kind: 'report' },
      { label: AGODA_BLIND_GURGAON_2025_LABEL, url: AGODA_BLIND_GURGAON_2025_URL, note: 'One self-reported Gurgaon loop from June 2025 that ended in a rejection without a managerial round: an online assessment, an HR screen, a HackerRank round and a platform round of spoken questions. Two commenters, not the poster, add that the recruiters and interviewers were in Bangkok and describe the Staff track.', kind: 'report' },
      { label: 'Public report: LeetCode senior front-end loops, Gurgaon then Bangkok, February 2026', url: 'https://leetcode.com/discuss/post/7580886/', note: 'A senior front-end candidate rejected in the second Gurgaon round, then given an offer by a Bangkok loop after the six-month cooling period. Used for the Gurgaon note and the cooling-off answer only.', kind: 'report' },
      { label: AGODA_BANGALORE_2025_LABEL, url: AGODA_BANGALORE_2025_URL, note: 'One self-reported Staff loop from July 2025 by a Bangalore candidate interviewing for Thailand relocation, not selected: a phone screen of an hour or more, a DSA and JavaScript round and a live HackerRank problem. It ends earlier in the loop than the Bangkok accounts.', kind: 'report' },
      { label: 'Agoda Careers: How we hire, the Tech team interview process, July 2025', url: AGODA_HOW_WE_HIRE_TECH_URL, note: 'Official page describing a HackerRank online test as the coding assessment, four rounds (Coding, Platform, System Design and Agoda Culture Fit), a final decision typically within two weeks of the last round, and the front-end stack of TypeScript with React and Redux, Rspack and Vite. It names no interview questions.', kind: 'official' },
      { label: 'Agoda Careers: How we hire for tech roles, November 2021', url: AGODA_HOW_WE_HIRE_2021_URL, note: 'An official post from November 2021, read from an archive capture of July 2025. Its FAQ says a rejected candidate can re-apply to the same role after six months; it describes the loop only in outline and names no interview questions.', kind: 'official' },
      { label: 'Agoda Engineering: Preparing for an interview at Agoda, June 2023', url: AGODA_INTERVIEWER_GUIDE_URL, note: 'An interviewer\'s guide on the Agoda Engineering blog. It states what the Coding round looks for and that the Platform round typically asks candidates to implement something related to Agoda and often includes reviewing, fixing and improving a code snippet; it is from 2023 and names no questions.', kind: 'official' },
    ],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full Agoda practice set',
    copy:
      'Premium unlocks the hotel search page frontend case, the twelve-question Platform hour answer guide, the car rental booking frontend case, the React paginated data table drill and the wider premium library of coding, concept and system-design practice.',
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
