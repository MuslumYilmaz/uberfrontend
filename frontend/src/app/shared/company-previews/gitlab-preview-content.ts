import type { AuthoredCompanyPreview } from '../../shared/company-previews/authored-company-preview.model';

/**
 * GitLab frontend interview guide. The stages, durations and interviewers come from GitLab handbook pages read
 * in October 2026; the exercises come from public, self-reported accounts (Taro re-hosts of Glassdoor reviews from
 * 2018 to 2025 and a 2025 Medium account). Every prompt is a FrontendAtlas practice version, not a leaked,
 * confirmed or official GitLab exercise: GitLab draws its merge requests from a curated bank.
 */
const GITLAB_TARO_LIVE_SESSION_2024_URL =
  'https://www.jointaro.com/interviews/companies/gitlab/experiences/front-end-engineer-united-states-february-1-2024-no-offer-neutral-031df9b0/';
const GITLAB_TARO_LIVE_SESSION_2024_LABEL = 'Public report: Taro front end engineer loop with a 90-minute live session, 2024';
const GITLAB_TARO_VUE_APP_2024_URL =
  'https://www.jointaro.com/interviews/companies/gitlab/experiences/front-end-engineer-canada-march-1-2024-no-offer-negative-fbb295a4/';
const GITLAB_TARO_VUE_APP_2024_LABEL = 'Public report: Taro front end engineer merge request round, 2024';
const GITLAB_TARO_HTML_2020_URL =
  'https://www.jointaro.com/interviews/companies/gitlab/experiences/frontend-developer-amsterdam-north-holland-february-1-2020-no-offer-negative-14a19a13/';
const GITLAB_TARO_HTML_2020_LABEL = 'Public report: Taro frontend developer merge request round, 2020';
const GITLAB_TARO_WRITTEN_2019_URL =
  'https://www.jointaro.com/interviews/companies/gitlab/experiences/frontend-engineer-united-kingdom-august-5-2019-no-offer-negative-d1e1bab6/';
const GITLAB_TARO_WRITTEN_2019_LABEL = 'Public report: Taro frontend engineer written questions, August 2019';
const GITLAB_MEDIUM_FULLSTACK_2025_URL = 'https://medium.com/@vedantj03/how-i-got-into-gitlab-an-open-source-journey-7ecdad137307';
const GITLAB_MEDIUM_FULLSTACK_2025_LABEL = 'Public report: Medium full-stack engineer loop with an offer, 2025';
const GITLAB_JOB_FAMILY_URL = 'https://handbook.gitlab.com/job-description-library/engineering/development/frontend/';
const GITLAB_TECHNICAL_INTERVIEW_URL = 'https://handbook.gitlab.com/handbook/hiring/interviewing/technical/';
const GITLAB_CANDIDATE_FAQ_URL = 'https://handbook.gitlab.com/handbook/hiring/candidate-faq/';
const GITLAB_AI_GUIDELINES_URL = 'https://about.gitlab.com/jobs/ai-interview-process/';
const GITLAB_SENIOR_FRONTEND_POSTING_URL = 'https://job-boards.greenhouse.io/gitlab/jobs/8826920002';

export const GITLAB_PREVIEW_TITLE = 'GitLab Frontend Interview Questions: 5 Prompts + Prep Guide';
export const GITLAB_PREVIEW_H1 = 'GitLab Frontend Interview Questions';
export const GITLAB_PREVIEW_DESCRIPTION =
  'Prepare for a GitLab frontend interview with 5 practice prompts built on the handbook and public reports: Vue merge request review, refetching, CSS, tests.';
export const GITLAB_PREVIEW_CANONICAL_PATH = '/companies/gitlab/preview';
export const GITLAB_PREVIEW_TRUST_NOTE =
  'These are FrontendAtlas practice versions modelled on the published GitLab loop and on public interview reports, not leaked, confirmed or official GitLab questions. GitLab draws its merge request exercises from a curated bank, and the public reports date from 2018 to 2025; use the material your recruiter sends as the source of truth.';

export const GITLAB_COMPANY_PREVIEW: AuthoredCompanyPreview = {
  slug: 'gitlab',
  label: 'GitLab',
  title: GITLAB_PREVIEW_TITLE,
  h1: GITLAB_PREVIEW_H1,
  description: GITLAB_PREVIEW_DESCRIPTION,
  canonicalPath: GITLAB_PREVIEW_CANONICAL_PATH,
  trustNote: GITLAB_PREVIEW_TRUST_NOTE,
  hero: {
    kicker: 'Public GitLab prep guide',
    subtitle:
      'Prepare with five practice prompts shaped by GitLab handbook pages and by public frontend accounts from 2018 to 2025: a short written assessment, a recruiter screen, a merge request you review on your own time and improve live in a 90-minute session, then behavioral and director interviews.',
    caveat:
      'This guide uses GitLab handbook pages, its guidelines on AI in interviews and public, self-reported interview accounts to create realistic constraints. It does not claim access to the curated exercise bank or to private interview material.',
    chips: ['5 practice prompts', 'Vue, CSS, Jest, code review', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'What the GitLab frontend loop rewards: a written merge request review you can defend and improve live',
    paragraphs: [
      'GitLab publishes the loop itself. After a short written assessment and a 30-minute recruiter screen, you receive a merge request on a small, self-contained application at least 72 hours before a 90-minute call, review it for up to an hour, and finish the review a day before. In the call you walk the interviewer through your comments and write code to improve the merge request. A 45-minute behavioral interview and a 60-minute interview with a Director of Engineering follow.',
      'Public accounts describe the merge request as a small Vue app with an API call, data operations and conditional rendering, with Jest unit tests in one 2024 account, broken HTML and plain JavaScript to convert to Vue in a 2020 account, and a mobile layout to fix in another. What helped was a prioritized list of improvements the candidate could explain and then implement: correctness first, then repeated API calls, then layout and tests. GitLab welcomes transparent use of AI in technical assessments, as long as you can explain your prompts and decisions.',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked October 2026',
    title: 'What GitLab publishes, and what you still need to confirm',
    paragraphs: [
      'The stages, durations and interviewers come from GitLab handbook pages read in October 2026: the frontend job family page, the technical interview page, the candidate handbook page and the guidelines on using AI in the interview process. The exercises come from public, self-reported accounts: two 2024 merge request rounds and earlier ones on Taro, which re-hosts Glassdoor reviews, and a 2025 Medium account of a full-stack loop with separate 90-minute frontend and backend technical interviews.',
      'Together they establish the format. They do not establish the current written questions, since the verbatim ones are from 2018 and 2019, whether the exercise now uses Vue 2 or Vue 3, any Staff loop, or an India loop newer than 2022, although the two frontend roles open in October 2026 are listed in Bangalore. Some candidates met a hiring manager or director before the technical round, and roles have closed mid-loop. Confirm the order and the exercise with your recruiter.',
    ],
  },
  roleLenses: {
    kicker: 'Role lenses',
    title: 'Repository interfaces and a large Vue frontend as practice contexts',
    intro:
      'These are preparation lenses based on GitLab job postings and its frontend development guide, not claimed interview rounds or team assignments. Choose the lens closest to the role and keep the reasoning framework-neutral.',
    items: [
      {
        title: 'Repository and code review interfaces',
        description:
          'The Senior and Staff frontend postings open in October 2026 sit on a team that owns core repository capabilities, from Git command-line operations to web-based code exploration, and the job family page asks for comfort with the GitLab code review process.',
        practiceFocus:
          'Rendering large diffs and file trees, review threads with optimistic updates, keyboard navigation, and performance budgets you can measure.',
      },
      {
        title: 'Modernizing a large Vue and Rails frontend',
        description:
          'The Staff posting asks to lead modernization of a monolith or legacy frontend architecture toward modular, reusable and independently deployable systems, and the frontend guide describes a Rails and Haml app with Vue and GraphQL as the first choice for API calls.',
        practiceFocus:
          'Incremental migration plans, choosing between Apollo, Pinia and component state, GraphQL data loading, and tests that protect behaviour during a refactor.',
      },
    ],
  },
  prompts: {
    kicker: 'Representative practice prompts',
    title: 'Five GitLab frontend interview practice questions',
    intro:
      'For each prompt, read the requirement first, comment by impact, implement the most important change in small steps, and test the failure cases. Each prompt links to the public report it is modelled on and to a practice page.',
    itemListName: 'Five GitLab frontend interview practice prompts',
    items: [
      {
        id: 'review-vue-merge-request-live',
        title: 'Review a small Vue merge request, then improve it live',
        statement:
          'You receive a merge request on a small Vue app that fetches a list, transforms it and renders it conditionally. Review it in about an hour, leave prioritized comments a day before the call, then walk through them and implement the most important fixes in a 90-minute session.',
        whatThisMeasures:
          'Asynchronous communication in review comments, knowledge of Vue, HTML and CSS, and how you collaborate while changing code someone else wrote.',
        clarifyFirst: [
          'Read the linked issue or requirements first, and note what the change is supposed to do before judging how it does it.',
          'Run the app and its tests locally, and confirm in the call which of your comments the interviewer wants implemented first.',
        ],
        strongAnswer: [
          'Order comments by impact: bugs and broken requirements, then performance such as repeated API calls, then accessibility and layout, then style.',
          'Write each comment as a suggestion with a reason and, where it helps, a short code sample, as you would on a real merge request.',
          'In the call, implement the top two or three fixes in small commits, run the tests after each one, and say what you would leave for a follow-up.',
          'Note what the merge request does well, and ask where the intent is unclear instead of assuming.',
        ],
        commonMiss:
          'Leaving a handful of vague comments, or spending the session on cosmetic changes while a repeated API call or a failing test stays in place.',
        resourceLabel: 'Practise a Vue component with an API call (Premium)',
        resourcePath: '/vue/coding/vue-debounced-search',
        reportedRound: { label: GITLAB_TARO_LIVE_SESSION_2024_LABEL, url: GITLAB_TARO_LIVE_SESSION_2024_URL },
      },
      {
        id: 'stop-refetching-on-click',
        title: 'Stop a component from refetching on every click',
        statement:
          'The merge request calls the same endpoint every time a button is clicked. Explain the cost in a review comment, then change it so the data loads once and is reused, with loading and error states still correct.',
        whatThisMeasures:
          'Spotting redundant network work in review, choosing where data should load, and keeping UI states honest after the change.',
        clarifyFirst: [
          'Ask whether the data can change while the page is open, which decides between loading once on mount and refreshing on demand.',
          'Confirm what the user should see while loading and after a failure.',
        ],
        strongAnswer: [
          'Load once in the right lifecycle hook or behind a cached promise, and keep the result in component state.',
          'Guard against overlapping requests so a second click while loading does not start another one.',
          'Keep explicit loading, error and loaded states, and allow a retry after an error.',
          'Add or update a test that fails if the endpoint is called more than once.',
        ],
        commonMiss:
          'Caching the data but losing the error state, or fixing the click handler while leaving the same call in a watcher.',
        resourceLabel: 'Fix an async race in a fetch helper (free)',
        resourcePath: '/javascript/debug/js-debug-async-race',
        reportedRound: { label: GITLAB_TARO_VUE_APP_2024_LABEL, url: GITLAB_TARO_VUE_APP_2024_URL },
      },
      {
        id: 'fix-markup-match-mobile-mock',
        title: 'Fix broken markup and match the mobile mock',
        statement:
          'The merge request has invalid HTML and a view that breaks on narrow screens. Correct the markup, use Flexbox and media queries so the layout matches a mobile mock, and justify each change in a comment.',
        whatThisMeasures:
          'Semantic HTML, CSS layout skill, and whether your review explains why each change matters to users.',
        clarifyFirst: [
          'Ask for the breakpoints and the mock, and whether the layout must hold under browser zoom.',
          'Confirm which browsers matter before reaching for newer CSS features.',
        ],
        strongAnswer: [
          'Fix the structure first: valid nesting, landmarks, labels, and button elements for actions.',
          'Build the layout mobile first with Flexbox, then add media queries for wider screens instead of overriding desktop rules.',
          'Check text overflow, tap target size and focus order at the narrowest width.',
          'Explain each change briefly in the review so the author learns the reason, not only the fix.',
        ],
        commonMiss:
          'Patching the mobile view with fixed widths and absolute positioning, which breaks at the next screen size.',
        resourceLabel: 'Practise a responsive Flexbox navbar (free)',
        resourcePath: '/css/coding/css-flexbox-navbar',
        reportedRound: { label: GITLAB_TARO_HTML_2020_LABEL, url: GITLAB_TARO_HTML_2020_URL },
      },
      {
        id: 'make-unit-tests-catch-bug',
        title: 'Make the unit tests catch the bug',
        statement:
          'The merge request changes how a component loads its data, and its unit test still passes. Write a test with a spy on the API call that fails on the bug and passes on the fix, then say what the test protects.',
        whatThisMeasures:
          'Testing behaviour rather than implementation, using mocks and spies precisely, and explaining the value of a test in review.',
        clarifyFirst: [
          'Ask which test runner and helpers the project uses, and whether the API layer is already mocked.',
          'Confirm the behaviour the test should pin: how many calls, with which arguments, and what renders afterwards.',
        ],
        strongAnswer: [
          'Mock the API module, mount the component, trigger the interaction, and assert the number of calls and the rendered result.',
          'Make the test fail first on the current code so it proves the bug exists.',
          'Avoid asserting on internal method names that a refactor could rename.',
          'Reset mocks between tests so one test cannot leak into the next.',
        ],
        commonMiss:
          'A test that only checks the component renders, which passes with or without the bug.',
        resourceLabel: 'Build a spy function like Jest mocks (free)',
        resourcePath: '/javascript/coding/js-create-spy-function',
        reportedRound: { label: GITLAB_TARO_LIVE_SESSION_2024_LABEL, url: GITLAB_TARO_LIVE_SESSION_2024_URL },
      },
      {
        id: 'written-page-load-answer',
        title: 'Answer the written question on how a browser loads a page',
        statement:
          'In writing, describe what happens in the browser from typing a URL to a painted, interactive page, in as much detail as you think is useful, and name one performance risk at each step.',
        whatThisMeasures:
          'Depth of browser knowledge and clear technical writing, which the asynchronous review round also depends on.',
        clarifyFirst: [
          'Decide the depth up front: network, parsing, rendering and interactivity, each with one concrete detail.',
          'Structure it with short paragraphs or a numbered list, since the reader reviews it asynchronously.',
        ],
        strongAnswer: [
          'Cover DNS, the connection and TLS, the request and caching headers, then HTML parsing into the DOM and CSS into the CSSOM.',
          'Explain render-blocking CSS and parser-blocking scripts, and how defer, async and preload change the order.',
          'Describe layout, paint and compositing, then script execution or hydration for interactivity.',
          'Name one risk per step, such as an uncached request, a blocking script, a layout shift or a long task.',
        ],
        commonMiss:
          'A list of terms without the order of events, or an answer that stops at the DOM without reaching rendering.',
        resourceLabel: 'Review how browsers parse and render HTML (free)',
        resourcePath: '/html/trivia/html-parsing-rendering',
        reportedRound: { label: GITLAB_TARO_WRITTEN_2019_LABEL, url: GITLAB_TARO_WRITTEN_2019_URL },
      },
    ],
  },
  walkthrough: {
    kicker: 'Public mini walkthrough',
    title: 'Plan the merge request review before the call',
    intro:
      'Treat this as a representative routine, not a description of the curated exercise. The handbook suggests up to an hour of review, finished at least a day before the call.',
    steps: [
      { title: 'Read the requirement', description: 'Start from the issue or description: what should change for the user, and what would prove it works.' },
      { title: 'Run it', description: 'Pull the branch, start the app, run the tests, and note anything that fails before you read the code.' },
      { title: 'Comment by impact', description: 'Bugs and broken requirements first, then performance such as repeated API calls, then accessibility and layout, then style.' },
      { title: 'Pick what you will implement', description: 'Choose two or three fixes you can finish in the session and say why they come first.' },
      { title: 'Narrate while coding', description: 'Small commits, tests after each change, and a running explanation of the trade-offs.' },
      { title: 'Leave a follow-up list', description: 'Close with what you did not change and why, as you would hand it to the author.' },
    ],
  },
  prepPlan: {
    kicker: 'Actionable preparation',
    title: 'A 7-day GitLab frontend interview preparation plan',
    intro: 'Every day ends with code, a test, a written artifact, or a question you can use in the real process.',
    days: [
      { day: 'Day 1', focus: 'Read the GitLab code review guidelines and the technical interview page, then write a review checklist ordered by impact.', artifact: 'A one-page checklist you will use on the real merge request.' },
      { day: 'Day 2', focus: 'Vue fundamentals for the exercise: lifecycle hooks, computed values versus watchers, props and events, and where data loading belongs.', artifact: 'A small Vue component that loads data once and renders loading, error and empty states.' },
      { day: 'Day 3', focus: 'Review a deliberately flawed change, from an open-source project or your own old code, with prioritized written comments.', artifact: 'Ten review comments, each with a reason and a suggested change.' },
      { day: 'Day 4', focus: 'Implement your top review suggestions against a timer while narrating, then run the tests.', artifact: 'Notes from a 45-minute self-run session: what you finished and what you would leave for a follow-up.' },
      { day: 'Day 5', focus: 'HTML and CSS repair: fix invalid markup, then match a mobile mock with Flexbox and media queries.', artifact: 'A before-and-after page that holds at 360 pixels.' },
      { day: 'Day 6', focus: 'Unit tests: mock an API module, assert call counts and rendered output, and make a test fail before the fix.', artifact: 'Three tests that would catch the refetch bug.' },
      { day: 'Day 7', focus: 'Behavioral and director preparation: stories on iteration, a production bug, a disagreement and asynchronous collaboration; then write the browser page-load answer.', artifact: 'Five STAR stories and a one-page written answer.' },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common GitLab frontend interview preparation questions',
    items: [
      {
        question: 'Are these the real GitLab questions?',
        answer:
          'No. They are FrontendAtlas practice versions. GitLab says the merge request is self-contained and drawn from a curated bank of technical exercises, so yours will differ; the practice here follows the published format and what public accounts describe.',
      },
      {
        question: 'Is the exercise in Vue?',
        answer:
          'Public accounts from 2019 to 2024 describe Vue, HTML and CSS, with Haml in older ones and Jest unit tests in a 2024 account; one 2024 account says Vue 2. The job family page asks for experience with Vue or another modern JavaScript framework. Ask your recruiter which stack the exercise uses.',
      },
      {
        question: 'Can I use AI tools?',
        answer:
          'The GitLab guidelines say transparent use of AI is welcome in technical assessments if you can explain your prompts and technical decisions, that you should not read from AI-produced answers in interviews, and that you should disclose which tools you used.',
      },
      {
        question: 'Is there a frontend system design or algorithm round?',
        answer:
          'Not in the published frontend loop or in the recent accounts. Two older senior accounts, from 2019 and 2021, describe an extra round of frontend theory questions such as CORS and optimizing a slow-loading list, and a 2019 account had a 10-minute linked-list exercise.',
      },
      {
        question: 'Where are the open frontend roles?',
        answer:
          'In October 2026 the two frontend-titled postings, Senior and Staff, are listed in Bangalore, India. GitLab says all its roles are remote with location-based eligibility for some, and its candidate page says it cannot proceed if you need visa sponsorship, unless you already hold a work permit in the Netherlands.',
      },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Build the underlying skills with free practice',
    intro:
      'These public pages cover the request handling, layout, testing, document head, browser rendering and Vue lifecycle skills used by the practice prompts. They are supporting drills, not claimed GitLab questions.',
    items: [
      { label: 'Fix an async race in a fetch helper', description: 'Stop duplicate requests and reuse a cached response, the move behind the refetch prompt.', path: '/javascript/debug/js-debug-async-race' },
      { label: 'Responsive Flexbox navbar', description: 'A Flexbox layout that survives narrow widths, for the mobile mock prompt.', path: '/css/coding/css-flexbox-navbar' },
      { label: 'Build a spy function', description: 'The test double behind Jest mock functions, for the unit test prompt.', path: '/javascript/coding/js-create-spy-function' },
      { label: 'Essential tags in the HTML head', description: 'The viewport meta tag and the rest of a correct document head.', path: '/html/coding/html-head-seo-basics' },
      { label: 'How browsers parse and render HTML', description: 'The order of events behind the written page-load question.', path: '/html/trivia/html-parsing-rendering' },
      { label: 'Vue lifecycle hooks', description: 'Where a fetch belongs in a Vue component and when it runs.', path: '/vue/trivia/vue-lifecycle-hooks' },
      { label: 'Infinite scroll list design', description: 'Rendering a long list without loading everything, for the slow-list theory question.', path: '/system-design/infinite-scroll-list' },
      { label: 'Behavioral stories', description: 'A structure for the behavioral and director interviews.', path: '/guides/behavioral/stories' },
    ],
  },
  sources: {
    kicker: 'Public interview reports and official context',
    title: 'Sources and evidence limits',
    intro: 'These links support the public context used by the guide. Their notes state what each source can and cannot establish about preparation.',
    items: [
      { label: 'GitLab handbook: Frontend Engineer job family', url: GITLAB_JOB_FAMILY_URL, note: 'Official page, last modified March 2026. It lists the six hiring steps with durations and interviewers, from the written assessment to the director interview, and the requirements, including Vue or another modern framework and automated tests.', kind: 'official' },
      { label: 'GitLab handbook: Technical interviews', url: GITLAB_TECHNICAL_INTERVIEW_URL, note: 'Official page, last modified August 2026. It describes the merge request sent at least 72 hours ahead, the 90-minute call to walk through the review and improve the code, the curated bank of exercises and the encouragement to use AI.', kind: 'official' },
      { label: 'GitLab handbook: Candidate handbook page', url: GITLAB_CANDIDATE_FAQ_URL, note: 'Official page, last modified August 2026. It describes screening calls of 30 to 40 minutes, team interviews, three references with at least one past manager, the visa rule and the six-month wait before reapplying.', kind: 'official' },
      { label: 'GitLab: Using AI in the interview process', url: GITLAB_AI_GUIDELINES_URL, note: 'Official guidelines by stage: transparent AI use is welcome in technical assessments, interviews should not be read from AI-produced answers, and candidates should disclose the tools they used.', kind: 'official' },
      { label: GITLAB_TARO_LIVE_SESSION_2024_LABEL, url: GITLAB_TARO_LIVE_SESSION_2024_URL, note: 'A re-hosted Glassdoor review with a placeholder date and no offer. It establishes a 30-minute recruiter call, a merge request done in Vue.js with unit tests in Jest, a 90-minute live session and feedback on JavaScript, CSS and Vue performance.', kind: 'report' },
      { label: GITLAB_TARO_VUE_APP_2024_LABEL, url: GITLAB_TARO_VUE_APP_2024_URL, note: 'A re-hosted Glassdoor review with a placeholder date and no offer. It establishes the merge request sent two days ahead as a simple Vue 2 app with an API call, and the candidate caching data, cutting API calls and adding media queries.', kind: 'report' },
      { label: GITLAB_TARO_HTML_2020_LABEL, url: GITLAB_TARO_HTML_2020_URL, note: 'A re-hosted Glassdoor review from 2020, when the exercise was a pull request in the GitLab codebase. It establishes broken HTML, plain JavaScript to convert to Vue, and unit tests and a CI pipeline that failed; the current exercise is self-contained.', kind: 'report' },
      { label: GITLAB_TARO_WRITTEN_2019_LABEL, url: GITLAB_TARO_WRITTEN_2019_URL, note: 'A re-hosted Glassdoor review that ended after the written answers. It establishes one written question, what happens in the browser as it loads a page; the current written questions are not public.', kind: 'report' },
      { label: GITLAB_MEDIUM_FULLSTACK_2025_LABEL, url: GITLAB_MEDIUM_FULLSTACK_2025_URL, note: 'A first-person full-stack account that ended in an offer, with interviews in early 2025. It establishes a 90-minute frontend technical interview on JavaScript, Vue.js, testing and frontend practice next to a separate backend one, and a 60-minute hiring manager round.', kind: 'report' },
      { label: 'GitLab: Senior Frontend Engineer posting, Bangalore', url: GITLAB_SENIOR_FRONTEND_POSTING_URL, note: 'Official posting first published in September 2026. It places the role on a team that owns core repository capabilities and lists Vue, React, Angular, TypeScript or JavaScript as helpful; it says nothing about the interview.', kind: 'official' },
    ],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full GitLab practice set',
    copy:
      'This public guide is complete enough to plan a focused week. Premium unlocks the Vue debounced search component and the wider premium library for the Vue, testing and code review skills the loop relies on.',
    buttonLabel: 'Unlock the full GitLab practice set',
    src: 'company_preview_gitlab',
  },
  about: [
    'GitLab frontend interview preparation',
    'Merge request review and live implementation',
    'Vue, HTML and CSS fixes in code review',
    'Frontend unit testing with mocks and spies',
  ],
  indexAnchorLabel: 'GitLab frontend interview questions',
};
