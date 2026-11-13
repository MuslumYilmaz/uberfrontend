import type { AuthoredRoundSpotlight, AuthoredSectionCopy, AuthoredSource } from '../../../shared/company-previews/authored-company-preview.model';

export type NetflixPracticePrompt = {
  readonly id: string;
  readonly title: string;
  readonly statement: string;
  readonly whatThisMeasures: string;
  readonly clarifyFirst: readonly string[];
  readonly strongAnswer: readonly string[];
  readonly commonMiss: string;
  readonly resourceLabel: string;
  readonly resourcePath: string;
};

export type NetflixRoleLens = {
  readonly title: string;
  readonly description: string;
  readonly practiceFocus: string;
};

export type NetflixWalkthroughStep = {
  readonly title: string;
  readonly description: string;
};

export type NetflixPrepDay = {
  readonly day: string;
  readonly focus: string;
  readonly artifact: string;
};

export type NetflixPreviewFaq = {
  readonly question: string;
  readonly answer: string;
};

export type NetflixResourceLink = {
  readonly label: string;
  readonly description: string;
  readonly path: string;
};


// The title and description carry a count token ({#questions}) for the page to fill from the question list.
export const NETFLIX_PREVIEW_TITLE =
  'Netflix Frontend and UI Engineer Interview Questions: {#questions} Reported';
export const NETFLIX_PREVIEW_H1 = 'Netflix Frontend Interview Questions';
export const NETFLIX_PREVIEW_DESCRIPTION =
  'Netflix frontend and UI interview: recruiter and manager calls, a live screen or a take-home, the onsite, and {#questions} questions candidates reported.';
export const NETFLIX_PREVIEW_CANONICAL_PATH = '/companies/netflix/preview';
export const NETFLIX_PREVIEW_TRUST_NOTE =
  'Each question comes from a candidate\'s own account on Taro, Aced or LeetCode and is written here in our words; Netflix has confirmed none of them. A Netflix-tagged commenter on Blind told one candidate that each team interviews differently and to ask the recruiter, so what your recruiter says about your loop comes first.';

/** Product areas from Netflix's engineering page (read 2026-11-13); no account ties a round to one of them. */
export const NETFLIX_ROLE_LENSES: readonly NetflixRoleLens[] = [
  {
    title: 'Member experience and client UI',
    description:
      'Netflix\'s Member Systems and ML group builds the member-facing interface, personalisation and account management; Client and Partner Technologies and Streaming and Discovery are among its teams. A 2024 candidate was scheduled with the TV UI team.',
    practiceFocus:
      'Search, browse rows and title pages that stay quick on slower devices, and the system design of the app itself, which a 2024 UI engineer screen asked for.',
  },
  {
    title: 'Ads and commerce',
    description:
      'Ads Engineering builds the technology behind Netflix\'s advertising; Commerce Engineering works on sign-up, billing, payments and subscription management.',
    practiceFocus:
      'Flows where a failed request can cost a sign-up or a payment: field validation, retries, and error states a member can act on.',
  },
  {
    title: 'Content and internal tools',
    description:
      'Content and Business Products builds products for content production workflows and internal business functions, with Studio Production Engineering among its teams. Two 2024 loops centred on internal tools: one screen started from a tool\'s screenshot, and a full-stack loop built React components for event log configuration.',
    practiceFocus:
      'Data-dense screens: tables, collapsible rows and filters that stay correct when the data under them changes.',
  },
];

/**
 * The answer guides of the question list (company-interview-processes.ts): the open search question, the take-home,
 * the collapsible list, the caching question and the app design. Each prompt is a practice version written by
 * FrontendAtlas, not the interview's own wording.
 */
export const NETFLIX_PRACTICE_PROMPTS: readonly NetflixPracticePrompt[] = [
  {
    id: 'resilient-title-search',
    title: 'Implement resilient title search',
    statement:
      'Build a title-search experience that feels immediate while requests overlap, results arrive out of order, and the network becomes slow or unavailable.',
    whatThisMeasures:
      'JavaScript timing, async ownership, cancellation, accessible interaction, and whether UI state remains truthful under failure.',
    clarifyFirst: [
      'Confirm the minimum query length, debounce interval, result limit, selection behaviour, and whether earlier requests can be aborted.',
      'Ask whether the API filters on the server or returns a list you filter in the browser; in the 2024 Warsaw loop the interviewer pressed on the delay a 200 ms debounce adds, so have a number and a reason.',
      'Define keyboard behaviour plus loading, empty, error, offline, cancelled, and stale-result states before choosing components.',
    ],
    strongAnswer: [
      'Separate input state, active query, request identity, results, and visible status.',
      'Use debounce to limit starts and AbortController where transport cancellation is supported.',
      'Add a monotonically increasing token or takeLatest guard to every success, error, and cleanup write.',
      'Preserve keyboard focus and expose useful combobox or listbox semantics.',
      'Test out-of-order fulfillment, late rejection, rapid deletion, cancellation, empty results, and retry.',
    ],
    commonMiss:
      'Treating debounce as a race-condition solution while an older response or finally block can still overwrite the current query.',
    resourceLabel: 'Practice takeLatest request handling',
    resourcePath: '/javascript/coding/js-take-latest',
  },
  {
    id: 'accessible-continue-watching-row',
    title: 'Build an accessible Continue Watching row',
    statement:
      'As a take-home, build a Netflix-like browse screen around one Continue Watching row that keeps a user\'s place while cards load, progress changes, and input switches between pointer, keyboard, and remote-like controls.',
    whatThisMeasures:
      'Semantic structure, focus management, stable rendering, image behaviour, and code another engineer can review without you in the room.',
    clarifyFirst: [
      'Ask which devices and input methods matter, how many titles can appear, and whether the row is server-ranked or locally updated.',
      'Write it for the reviewer: a 2020 candidate\'s solution was judged very encapsulated and hard to understand, and an earlier loop asked why its take-home was built that way.',
    ],
    strongAnswer: [
      'Use stable title identities and preserve logical focus when cards update.',
      'Keep DOM order, visual order, and assistive-technology reading order aligned.',
      'Reserve image dimensions, lazy-load outside the near viewport, and provide useful fallback content.',
      'Bound rendering work without hiding items from keyboard and assistive-technology users.',
      'Cover loading, empty, offline, stale-progress, missing-image, and partial-update states, and say in a README which ones you left out.',
    ],
    commonMiss:
      'Optimising the carousel visually while losing focus, changing card order unexpectedly, or making controls pointer-only.',
    resourceLabel: 'Explore large-list rendering and recovery',
    resourcePath: '/system-design/infinite-scroll-list',
  },
  {
    id: 'personalized-row-rendering',
    title: 'Keep a filtered list correct and fast as its data changes',
    statement:
      'A collapsible list loses which items are open, and slows down, when a filter removes items or new data arrives. Explain how React updates it, then fix the work before reaching for memoization.',
    whatThisMeasures:
      'React render reasoning, stable identity, state boundaries, profiling discipline, and a plan for very large lists.',
    clarifyFirst: [
      'Ask how many items the list can hold, how often the data changes, and whether a filter runs in the browser or on the server.',
      'Agree what should happen to an expanded item that a filter hides and then shows again.',
    ],
    strongAnswer: [
      'Key items by their ids, never by index, so expanded state follows the item when others disappear.',
      'Keep expanded ids in one set owned by the list, and drop ids whose items no longer exist.',
      'Derive the filtered list from the data and the filter instead of storing a second copy.',
      'Capture a profiler trace before adding memo or useMemo, and keep the ones that change it.',
      'Window the rendering once the list grows past what the device draws smoothly, and keep collapse-all and expand-all cheap.',
    ],
    commonMiss:
      'Index keys: when a filter removes an item, the expanded state jumps to its neighbour.',
    resourceLabel: 'Review unnecessary React re-renders',
    resourcePath: '/react/trivia/react-rerender-decision-and-render',
  },
  {
    id: 'streaming-caching-failure-states',
    title: 'Reason about streaming delivery, caching, and failure states',
    statement:
      'Explain how a streaming product could deliver app code, artwork, metadata, and personalised responses while balancing speed, freshness, privacy, and graceful recovery.',
    whatThisMeasures:
      'Layered caching knowledge, invalidation judgement, personalisation boundaries, client resilience, and the ability to connect architecture to user experience.',
    clarifyFirst: [
      'Separate static public assets, versioned app bundles, catalogue metadata, personalised data, and playback-adjacent state.',
      'Ask what the business needs from each: freshness targets, regional constraints, device storage, authentication, offline behaviour, and acceptable stale content.',
    ],
    strongAnswer: [
      'Assign browser, service worker, CDN or edge, and origin caches only where their trust and freshness boundaries fit.',
      'Use content hashing or versioning for immutable assets and explicit revalidation for mutable data.',
      'Keep private personalised responses out of shared caches and define safe client persistence.',
      'Explain invalidation, stale-while-revalidate behaviour, and fallback UI for partial failures.',
      'Measure cache hit rate, latency, staleness, error rate, and user-visible recovery.',
    ],
    commonMiss:
      'Saying "cache everything at the CDN" without separating public assets from private or fast-changing personalised data.',
    resourceLabel: 'Review streaming delivery and caching strategies',
    resourcePath: '/javascript/trivia/content-delivery-caching-strategies-streaming',
  },
  {
    id: 'continue-watching-system-design',
    title: 'Design the Netflix app\'s browse screen, starting from Continue Watching',
    statement:
      'Design the frontend of the current Netflix app\'s browse screen, scoped to a Continue Watching row that reconciles progress across devices and stays usable on variable networks and hardware.',
    whatThisMeasures:
      'Frontend system design, requirements framing, state ownership, rendering scale, accessibility, resilience, observability, and rollout safety.',
    clarifyFirst: [
      'Confirm supported devices and inputs, progress freshness, row size, ordering rules, offline expectations, and what consistency users need.',
      'Identify which behaviour belongs to the client, API contract, edge delivery, or source-of-truth service before drawing component boxes.',
    ],
    strongAnswer: [
      'Define a device-aware payload with stable title ids, progress, artwork variants, ordering data, and a version or update time.',
      'Separate server state, local interaction state, focus state, image state, and optimistic progress.',
      'Use a bounded render window and prefetch policy appropriate to device capability and input direction.',
      'Reconcile newer progress without resetting focus or horizontal position.',
      'Include accessible navigation, offline and partial-failure behaviour, client metrics, experiments, and rollback.',
    ],
    commonMiss:
      'Starting with a diagram while requirements, state ownership, focus behaviour, failure recovery, and success metrics remain undefined.',
    resourceLabel: 'Use the performance system-design blueprint',
    resourcePath: '/guides/system-design-blueprint/performance',
  },
];

/** A worked start on the open question: filtering REST API results by the search input (Taro, Warsaw, 2024). */
export const NETFLIX_WALKTHROUGH_STEPS: readonly NetflixWalkthroughStep[] = [
  {
    title: 'Pin the contract',
    description:
      'Ask whether the API filters on the server or hands back a list to filter in the browser, the minimum query length, and how many results the box shows.',
  },
  {
    title: 'Choose when a request starts',
    description:
      'A debounce of about 200 ms holds requests while the user types. Say why that value, and what the user sees while it waits.',
  },
  {
    title: 'Let only the latest query write',
    description:
      'Abort the previous request with AbortController where the transport allows it, and drop any response whose query no longer matches the input.',
  },
  {
    title: 'Give every state its own message',
    description:
      'Idle, loading, results, no results, error and offline, so a slow request never shows results for a query the user has already changed.',
  },
  {
    title: 'Make it work from the keyboard',
    description:
      'Arrow keys move through the results, Enter picks one, Escape clears, and a screen reader hears how many results arrived.',
  },
  {
    title: 'Test the timing',
    description:
      'Fake timers and promises you settle by hand: responses that arrive out of order, a rejection after a newer success, and fast deletion back to an empty box.',
  },
];

/** Day titles (before the first colon) are open to every visitor; the rest of each day opens with a free account. */
export const NETFLIX_PREP_SEQUENCE: readonly NetflixPrepDay[] = [
  {
    day: 'Day 1',
    focus:
      'Recruiter and manager calls: a Netflix-tagged commenter advises showing real interest in the product without sounding desperate, and a 2024 recruiter screen asked which parts of the culture memo stood out to you and what you want from the role.',
    artifact: 'A two-minute answer on why Netflix and why this role, with one idea for its UI you could defend.',
  },
  {
    day: 'Day 2',
    focus:
      'The open question: say how results from a REST API should follow what the user types, debounce and stale responses included, then build it in plain JavaScript.',
    artifact: 'A working search box with a debounce, cancellation, and tests for responses that arrive out of order.',
  },
  {
    day: 'Day 3',
    focus:
      'Live screen: the 2025 screen in Poland set three small JavaScript tasks in one hour, while 2024 screens were a React build in CoderPad or a frontend system design. Ask your recruiter which one you will get, then rehearse that format against the clock.',
    artifact: 'Three timed attempts in the format your recruiter named, each with the cases you checked.',
  },
  {
    day: 'Day 4',
    focus:
      'Take-home: build a small UI as if a reviewer will read every file. A 2020 candidate\'s solution was called very encapsulated and hard to understand, so prefer plain structure and a short README.',
    artifact: 'A small project and a five-minute walk-through of why it is built that way, the follow-up an earlier loop asked.',
  },
  {
    day: 'Day 5',
    focus:
      'Frontend depth: a 2020 senior UI developer lists software design, state management, browser capabilities, JavaScript internals and CSS, and a 2020 candidate who found the coding easy credits javascript.info for refreshing the basics.',
    artifact: 'One page of notes per area, each with an example you could write on a whiteboard.',
  },
  {
    day: 'Day 6',
    focus:
      'Culture memo and behavioural interviews: read the memo, write down which parts resonate with you and which do not, and prepare for a manager who asks for a second example or drills into every sentence.',
    artifact: 'Five stories, each with the decision, the alternatives and what happened, checked in the culture drill above.',
  },
  {
    day: 'Day 7',
    focus:
      'Mock onsite: two or three technical rounds and two behavioural ones, the shape of the 2020 and 2024 onsites, with your take-home reviewed in one of them.',
    artifact: 'Your questions for the recruiter: take-home or live screen, which language or framework, whether algorithms or system design come up, and how many behavioural rounds.',
  },
];

export const NETFLIX_PREVIEW_FAQS: readonly NetflixPreviewFaq[] = [
  {
    question: 'Are these real Netflix interview questions?',
    answer:
      'Each one is what a candidate wrote that they were asked, on Taro, Aced or LeetCode, put in our words. Netflix has confirmed none, and most rest on a single account. The first question in the list is open to everyone; the others show their round, kind and topic.',
  },
  {
    question: 'Does Netflix ask LeetCode-style questions?',
    answer:
      'The accounts disagree. A 2020 senior frontend candidate had no LeetCode-type questions, and the recruiter for a 2024 L4 Web UI role said Netflix wanted to move away from them, yet the same plan listed possible algorithm and system design rounds. A 2024 UI engineer who got an offer says real production experience is what counts.',
  },
  {
    question: 'Will I get a take-home or a live screen?',
    answer:
      'Both appear. Two 2020 loops had a take-home, reviewed in the onsite in one of them. The 2025 screen in Poland was one live hour of small JavaScript tasks, and 2024 screens were a React build in CoderPad or a frontend system design. Netflix\'s own pages say new graduates and interns start with a take-home assessment.',
  },
  {
    question: 'How much do the culture memo and behavioural rounds weigh?',
    answer:
      'A lot in these accounts. A 2020 candidate spent 30 to 45 minutes extra in each behavioural interview on the memo, another 2020 loop gave half a day to behavioural interviews and the candidate believes the last one cost the offer, and a 2024 full-stack loop had four behavioural conversations, from the recruiter to a skip-level manager. The round decoder above has the questions.',
  },
  {
    question: 'What should I ask the recruiter?',
    answer:
      'One Netflix-tagged commenter wrote that Netflix does not centralise its interview process, and another told a candidate to ask the recruiter because each team interviews differently. Ask whether you get a take-home or a live screen, which language or framework it uses, whether algorithms come up, and how many behavioural rounds the onsite holds.',
  },
];

/** Free practice for the open question and the behavioural rounds. None of it is a locked question's practice task. */
export const NETFLIX_RESOURCE_LINKS: readonly NetflixResourceLink[] = [
  {
    label: 'Implement debounce',
    description: 'The debounce the open question turned on, written and tested from scratch.',
    path: '/javascript/coding/js-debounce',
  },
  {
    label: 'Debounce or throttle for a search input',
    description: 'Which one a search box needs, and how much delay each adds.',
    path: '/javascript/trivia/debounce-vs-throttle-search-input',
  },
  {
    label: 'Keep only the latest async result',
    description: 'Stop a slow response for an old query from replacing newer results.',
    path: '/javascript/coding/js-take-latest',
  },
  {
    label: 'JavaScript closures',
    description: 'How a function keeps the variables it was created with.',
    path: '/javascript/trivia/js-closures',
  },
  {
    label: 'Prepare behavioral stories',
    description: 'STAR stories for the manager conversation and the behavioural interviews.',
    path: '/guides/behavioral/stories',
  },
];

/**
 * The guide's own sources: Netflix's pages, then the account behind the open question. The process table's and the
 * question list's citations follow them on the page (company-evidence.ts), so the guide and the plan count the same
 * evidence. Notes are open to every visitor, so they describe formats and never a locked question.
 */
export const NETFLIX_SOURCES: readonly AuthoredSource[] = [
  {
    label: 'Netflix Engineering',
    url: 'https://jobs.netflix.com/careers/engineering',
    note:
      'Read in November 2026. It lists Netflix\'s engineering groups, among them Member Systems and ML, Ads, Commerce, Games, Infrastructure, and Content and Business Products, which the role lenses borrow. It describes no interview stages.',
    kind: 'official',
  },
  {
    label: 'Netflix Culture',
    url: 'https://jobs.netflix.com/culture',
    note:
      'The memo the behavioural interviews keep returning to: four principles and eight values, quoted in the round decoder. A 2020 candidate advises studying it and putting it in your own words.',
    kind: 'official',
  },
  {
    label: 'Netflix New Grad interview guidance',
    url: 'https://jobs.netflix.com/careers/new-grads',
    note:
      'Read in November 2026: a take-home assessment, then two rounds, advancing on the feedback at each stage. Interviewers evaluate technical, role-specific and behavioural skills and may ask which parts of the memo resonate with you. Written for new graduates, not experienced hires.',
    kind: 'official',
  },
  {
    label: 'Public report: Netflix senior frontend engineer interview, Warsaw, November 2024',
    url: 'https://www.jointaro.com/interviews/companies/netflix/experiences/senior-frontend-engineer-warsaw-masovia-november-1-2024-no-offer-negative-c999399f/',
    note:
      'No offer. Eight stages, none named, some with engineers in Poland and some in the United States; the candidate says the Poland-based technical interviewers asked domain questions about content platforms. The open question, filtering REST API results by the search input, comes from it, with a 200 ms debounce in the discussion.',
    kind: 'report',
  },
];

/**
 * The culture interviews, decoded on the guide; the process table's hiring-manager row links here. The memo
 * (jobs.netflix.com/culture) and the new grad and internship pages were read on 2026-11-09; the two careers pages
 * again on 2026-11-13. Those pages are written for early-career hires, so the section says so wherever it quotes them;
 * the experienced-hire evidence is the accounts on the table's recruiter, hiring-manager and onsite rows.
 */
export const NETFLIX_CULTURE_SPOTLIGHT: AuthoredRoundSpotlight = {
  id: 'culture',
  kicker: 'Round decoder',
  title: 'Netflix culture interview for frontend engineers: what the memo asks for and what was asked',
  lede: [
    'Netflix frontend loops spend whole interviews on behaviour and fit with the culture memo: a 2020 account had a long behavioural interview with a UI manager and two more in the onsite, a 2024 full-stack loop opened its recruiter screen on the memo and ended with a skip-level manager, and a 2024 recruiter plan for an L4 Web UI role lists two behavioural rounds. Netflix\'s own pages for new graduates and interns say you may be asked which parts of the memo resonate most with you and which do not.',
    'The memo names four principles (the Dream Team, people over process, uncomfortably exciting, great and always better) and eight values: selflessness, judgment, candor, creativity, courage, inclusion, curiosity and resilience.',
  ],
  facts: [
    {
      label: 'Where it comes',
      value: 'A long behavioural interview with a UI manager before the take-home, then two behavioural interviews in the onsite (2020); half a day of behavioural interviews with senior leadership and product, ending with a senior manager (another 2020 account); a recruiter screen on the memo, a behavioural hiring-manager call and two behavioural rounds in the onsite, one with a skip-level manager (2024, senior full-stack); two cultural rounds out of five in 2024 UI engineer onsites. Netflix-tagged commenters say each team runs its own loop.',
    },
    {
      label: 'What the memo asks for',
      value: 'Selflessness: what is best for Netflix over yourself or your team. Judgment: long-term solutions and wise decisions despite ambiguity, with data informing intuition. Candor: giving and receiving feedback, and admitting mistakes openly. Creativity: new ideas, pursued persistently. Courage: risking failure or challenging the status quo. Inclusion: counteracting your biases so everyone can do their best work. Curiosity: learning fast, as interested in others\' ideas as your own. Resilience: adapting quickly and making tough decisions without long delay.',
    },
    {
      label: 'What Netflix tells early-career candidates',
      value: 'Its new grad and internship pages say interviewers evaluate technical, role-specific and behavioural skills, that you may be asked which parts of the memo resonate most with you and which do not, and that interviewers want to see qualities such as curiosity, candor and resilience. They recommend four or five examples ready in the STAR shape. The pages are written for new graduates and interns, not for experienced hires.',
    },
    {
      label: 'Asked in frontend accounts',
      value: 'To convince your teammates of something they were originally against, from a senior manager who "drilled deep into every sentence" (Taro, 2020); a thorough conversation about the memo, which the candidate advises studying and putting in your own words (Taro, 2020); which memo principles stood out, surprised you or did not resonate, feedback you gave and received, and a decision you disagreed with and could not change, with a second example asked for (Aced, 2024). The others are listed with the reported questions.',
    },
    {
      label: 'Sources',
      value: 'Netflix\'s culture memo and new grad page, listed under Sources below, its internship page, and frontend and full-stack accounts on Taro, Blind and Aced from 2020 to 2024 on the recruiter, hiring-manager and onsite rows of the process table.',
    },
  ],
  practiceLink: { label: 'Draft your stories with the STAR stories guide', path: '/guides/behavioral/stories' },
  processLink: { label: 'See the hiring-manager row in the reported process', fragment: 'netflix-interview-process-1-stage-hiring-manager-conversation' },
  // Accounts' questions and the early-career pages' one first, then one per memo value or practice, written from its text.
  drill: {
    note: 'The first four come from accounts of experienced loops and from Netflix\'s pages for new graduates and interns; the rest are written from the values and practices in the memo.',
    questions: [
      { id: 'convince', text: 'Tell me about a time you had to convince your teammates of something they were originally against.', source: 'Taro, 2020' },
      { id: 'memo', text: 'Which parts of the culture memo resonate most with you, and which do not?', source: 'Netflix\'s new grad and internship pages; Aced, 2024', kind: 'view' },
      { id: 'disagreed-not-persuaded', text: 'Tell me about a time you disagreed with a decision and were not able to persuade people.', source: 'Aced, 2024' },
      { id: 'critical-feedback', text: 'Tell me about a time you received critical feedback from a manager or lead, and how you improved afterwards.', source: 'Aced, 2024' },
      { id: 'disagree-then-commit', text: 'Tell me about a decision you argued against and then committed to.', source: 'The memo: disagree then commit' },
      { id: 'judgment', text: 'Tell me about a decision you made despite ambiguity, and the data that informed it.', source: 'The memo: judgment' },
      { id: 'candor', text: 'Tell me about feedback you gave a colleague, or a mistake you admitted openly.', source: 'The memo: candor' },
      { id: 'courage', text: 'Tell me about a time you challenged the status quo at the risk of failing.', source: 'The memo: courage' },
      { id: 'selflessness', text: 'Tell me about a time you put what was best for the company ahead of your own team.', source: 'The memo: selflessness' },
      { id: 'resilience', text: 'Tell me about a tough decision you had to make quickly when circumstances changed.', source: 'The memo: resilience' },
    ],
    viewChecks: ['I have read the memo and can say which parts resonate with me, and which do not.'],
    checks: [
      'I have read the memo and can say which parts resonate with me, and which do not.',
      'It shows the value the question asks about, in what I did.',
      'Four or five STAR examples are ready, as Netflix\'s early-career pages recommend.',
    ],
  },
};

/** The page's prose outside the lists, in the order it renders. Count tokens are filled from the page's evidence. */
export const NETFLIX_COPY = {
  subtitle:
    'Accounts of experienced frontend, UI and full-stack loops from 2020 to 2025 describe a recruiter call, a conversation with the hiring manager, a live screen or a take-home, then an onsite split between technical and behavioural interviews. Below the table are the questions those candidates reported; the first is open to everyone.',
  caveat:
    'Netflix publishes its process only for new graduates and interns, and Netflix-tagged commenters say each team runs its own loop. The newest account is a 2025 screen in Poland; a 2024 Warsaw account counts eight stages without naming them.',
  chip: 'Public accounts, 2020–2025',
  studyTitle: 'What Netflix\'s rounds reward: plain JavaScript, code a reviewer can follow, and the culture memo',
  studyParagraphs: [
    'The technical rounds in these accounts are practical rather than LeetCode: three small JavaScript tasks in an hour in the 2025 Poland screen (flattening a nested object, expect and toBe matchers, two async calls where one may fail), a React table of collapsible event log configurations in a 2024 CoderPad screen, a collapsible list whose data a filter changes in a 2024 onsite, and frontend system designs of the Netflix app and of an internal tool from its screenshot. The open question, filtering API results as the user types, turned on how much delay a debounce adds.',
    'Code quality is judged as much as correctness: one 2020 candidate\'s solution was called very encapsulated and hard to understand, an earlier loop asked why the take-home was built that way, and a 2024 onsite had a round of personal opinions on styling and state management. The behavioural half weighs as much: a senior manager drilled into every sentence of one 2020 candidate\'s past decisions, and a 2024 full-stack loop asked for a second example of a decision the candidate disagreed with.',
  ],
  roleLensesTitle: 'Three Netflix engineering groups to practise against',
  roleLensesIntro:
    'Netflix\'s engineering page lists groups such as Member Systems and ML, Ads, Commerce, and Content and Business Products, and describes no interview. The lenses borrow their product areas; no account ties a round to one of them.',
  walkthroughTitle: 'Walk through filtering API results as the user types',
  walkthroughIntro:
    'The open question from the 2024 Warsaw loop, answered out loud in six steps. The interviewer there pressed on the delay a debounce adds, so say your numbers and why you chose them.',
  planIntro:
    'One day for each part of the loop the accounts describe: the calls, the open question, the screen, the take-home, frontend depth and the behavioural rounds, then a mock onsite.',
  freeIntro: 'Free practice for the open question on filtering API results as the user types, and for the behavioural rounds.',
} as const;

/** What the accounts cover and what only a recruiter can say; shown with the sources at the end of the page. */
export const NETFLIX_SOURCE_BOUNDARY: AuthoredSectionCopy = {
  kicker: 'Source boundary · checked November 2026',
  title: 'What the accounts cover, and what only your recruiter can tell you',
  paragraphs: [
    'Netflix\'s new grad and internship pages describe a take-home assessment and two or about two to three rounds; no Netflix page covers experienced hires. The experienced-hire rows come from two 2020 loops, a 2021 account of one manager talk and a 2024 Warsaw account on Taro, three 2024 loops on Aced, a 2025 screen in Poland posted on LeetCode, a March 2022 Blind post about a loop a few years earlier, a 2024 recruiter plan for an L4 Web UI role, and Netflix-tagged commenters on Blind.',
    'One Netflix-tagged commenter wrote that Netflix does not centralise its interview process; another told a candidate to ask the recruiter because each team interviews differently. Ask yours whether you get a take-home or a live screen, which language or framework it uses, whether algorithms come up, and how many behavioural rounds the onsite holds.',
  ],
};
