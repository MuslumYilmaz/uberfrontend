import type { AuthoredCompanyPreview } from '../../shared/company-previews/authored-company-preview.model';

/**
 * Datadog frontend interview guide. The reported questions live with the process table
 * (company-interview-processes.ts); the five prompts here are the answer guides of several of them. The questions come
 * from anonymous interview reviews re-posted on Taro (2021 to 2025), most of them senior loops in France, Spain and
 * Portugal; a 2025 LeetCode post adds to the process table only. Datadog's candidate experience and AI guideline pages
 * give the official steps. Nothing here is a leaked, confirmed or official Datadog question.
 */
const DATADOG_TARO = 'https://www.jointaro.com/interviews/companies/datadog/experiences';
const DATADOG_VALBONNE_URL = `${DATADOG_TARO}/senior-frontend-developer-valbonne-october-1-2024-accepted-offer-positive-47d59048/`;
const DATADOG_VALBONNE_LABEL = 'Public report: Taro senior frontend developer offer, October 2024 (approximate date)';
const DATADOG_PARIS_URL = `${DATADOG_TARO}/senior-frontend-engineer-paris-september-1-2025-accepted-offer-positive-2a1ddfe8/`;
const DATADOG_PARIS_LABEL = 'Public report: Taro senior frontend engineer offer, September 2025 (approximate date)';
const DATADOG_LISBON_URL = `${DATADOG_TARO}/senior-frontend-developer-lisbon-lisbon-district-november-23-2025-no-offer-positive-1a88bdda/`;
const DATADOG_LISBON_LABEL = 'Public report: Taro senior frontend developer loop, November 2025';
const DATADOG_LISBON_2024_URL = `${DATADOG_TARO}/software-engineer-front-end-lisbon-lisbon-district-june-1-2024-no-offer-negative-945bab75/`;
const DATADOG_LISBON_2024_LABEL = 'Public report: Taro software engineer (front end) loop, June 2024 (approximate date)';
const DATADOG_FRANCE_2024_URL = `${DATADOG_TARO}/senior-software-engineer-frontend-france-october-1-2024-accepted-offer-positive-3bd8f875/`;
const DATADOG_FRANCE_2024_LABEL = 'Public report: Taro senior software engineer (frontend) offer, October 2024 (approximate date)';
const DATADOG_FRANCE_2023_URL = `${DATADOG_TARO}/senior-software-engineer-frontend-france-july-1-2023-accepted-offer-positive-b4edf2ad/`;
const DATADOG_FRANCE_2023_LABEL = 'Public report: Taro senior software engineer (frontend) offer, July 2023 (approximate date)';
const DATADOG_MADRID_2025_URL = `${DATADOG_TARO}/senior-frontend-engineer-madrid-community-of-madrid-july-1-2025-no-offer-positive-f1c8b321/`;
const DATADOG_MADRID_2025_LABEL = 'Public report: Taro senior frontend engineer loop, July 2025 (approximate date)';
const DATADOG_MADRID_2024_URL = `${DATADOG_TARO}/frontend-engineer-madrid-february-1-2024-accepted-offer-positive-a8de35e5/`;
const DATADOG_MADRID_2024_LABEL = 'Public report: Taro frontend engineer offer, February 2024 (approximate date)';
const DATADOG_PARIS_2021_URL = `${DATADOG_TARO}/senior-frontend-engineer-paris-april-1-2021-accepted-offer-positive-f33dca98/`;
const DATADOG_PARIS_2021_LABEL = 'Public report: Taro senior frontend engineer offer, April 2021 (approximate date)';
const DATADOG_NEW_YORK_2021_URL = `${DATADOG_TARO}/software-engineer-front-end-new-york-ny-july-1-2021-no-offer-positive-2833c42b/`;
const DATADOG_NEW_YORK_2021_LABEL = 'Public report: Taro software engineer (front end) loop, July 2021 (approximate date)';
const DATADOG_CANDIDATE_EXPERIENCE_URL = 'https://careers.datadoghq.com/candidate-experience/';
const DATADOG_AI_GUIDELINES_URL = 'https://careers.datadoghq.com/candidate-experience/interviewing-at-datadog-ai-guidelines/';

export const DATADOG_PREVIEW_TITLE = 'Datadog Frontend Interview Questions: {#questions} Reported + Prep Guide';
export const DATADOG_PREVIEW_H1 = 'Datadog Frontend Interview Questions';
export const DATADOG_PREVIEW_DESCRIPTION =
  'Datadog frontend interview: the CoderPad algorithm screen, React live coding, the take-home, frontend system design on Excalidraw and {#questions} reported questions.';
export const DATADOG_PREVIEW_CANONICAL_PATH = '/companies/datadog/preview';
export const DATADOG_PREVIEW_TRUST_NOTE =
  'The questions come from candidates\' anonymous reviews re-posted on Taro, most from senior frontend loops in France, Spain and Portugal, and are retold in our words. Datadog has confirmed none of them, and the answer guides are FrontendAtlas\'s. Datadog\'s own pages describe its steps only in general terms, so ask your recruiter which rounds your role runs and in what order.';

export const DATADOG_COMPANY_PREVIEW: AuthoredCompanyPreview = {
  slug: 'datadog',
  label: 'Datadog',
  title: DATADOG_PREVIEW_TITLE,
  h1: DATADOG_PREVIEW_H1,
  description: DATADOG_PREVIEW_DESCRIPTION,
  canonicalPath: DATADOG_PREVIEW_CANONICAL_PATH,
  trustNote: DATADOG_PREVIEW_TRUST_NOTE,
  hero: {
    kicker: 'Public Datadog prep guide',
    subtitle:
      'Datadog frontend accounts from 2021 to 2025, most of them senior loops in France, Spain and Portugal, describe a recruiter call, an algorithm screen on CoderPad, an hour of React live coding, a harder coding round, frontend system design on Excalidraw, an experience and values interview and team matching. Under the rounds are {questions} questions from those accounts; the first, a React table of real-time data, is open.',
    caveat:
      'The order and number of rounds change from loop to loop: one 2024 candidate traded the React hour for a take-home, and some loops held a round in person at an office while others stayed virtual. Outside Europe there are only a 2021 New York account and a 2024 account from Brazil.',
    chips: ['{#questions} reported questions', '{#reports} public reports, 2021–2025', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'What Datadog frontend loops reward: tables of moving data, and algorithms done cleanly',
    paragraphs: [
      'The Datadog frontend rounds keep returning to data that changes while you look at it. The open question asks for a React table of real-time data that sorts by any column; other loops built a table up step by step with filters and sorting, parsed data into an existing app, or set a take-home that charts load over time and raises alerts. The hired September 2025 Paris candidate gives the tactic for the step-by-step hour: finish each step, and leave optimisations such as a context provider or virtualisation alone.',
      'The design round keeps to the same ground: a Live Tail view of real-time logs, a real-time event viewer, a component for log data of any size, a dashboard of widgets, an app for monitors. The algorithm rounds are the other half, on CoderPad in JavaScript or TypeScript: string problems such as counting repeated words or matching a pattern without regular expressions, and tree problems solved with depth-first search. Either half can end a loop; a 2025 candidate in Spain lost a coding round by over-engineering a tag-matching problem that plain loops would have solved.',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked November 2026',
    title: 'Who wrote these Datadog accounts, and what they leave out',
    paragraphs: [
      '{reports} public accounts sit behind this guide. All but one are anonymous reviews re-posted on Taro from frontend loops between 2021 and 2025; the other is a 2025 LeetCode post on a Paris role, whose offer was withdrawn after team matching had been scheduled. Most come from senior candidates in France, Spain and Portugal, many of them hired, and Taro dates many reviews to the first of a month, a placeholder rather than the interview date.',
      'They show which rounds came up and what some candidates were asked; they cannot fix an order, and only a 2021 New York account describes a US loop. Datadog\'s candidate experience page lists an initial screen, face-to-face interviews in rounds or panels with one step expected in person, a take-home project and an executive interview for some roles; no frontend account reports the executive interview. Its AI guidelines rule out AI tools in live coding unless you are told in advance. Ask the recruiter for the order of your rounds, whether a take-home replaces the React hour, and which step is in person.',
    ],
  },
  roleLenses: {
    kicker: 'Role lenses',
    title: 'Live data views or tables and dashboards: where the Datadog rounds point',
    intro:
      'Neither lens is a team. Both come from what Datadog candidates were asked to build and design: data that streams in, and screens that must stay usable while the data under them changes.',
    items: [
      {
        title: 'Live data views',
        description:
          'Logs and events that stream in continuously and must stay readable, filterable and selectable while they move.',
        practiceFocus:
          'Bounded rendering of growing lists, stable row identity, pause-on-interaction, filters applied to a moving window, and truthful counts.',
      },
      {
        title: 'Tables and dashboards',
        description:
          'Dense tables that sort by any column, filter on several fields and keep their state while the data underneath refreshes.',
        practiceFocus:
          'Derived state computed from a single source, stable sort behaviour, immutable row updates, keyboard access to column controls and performance under frequent updates.',
      },
    ],
  },
  prompts: {
    kicker: 'Representative practice prompts',
    title: 'Answer guides for the reported Datadog questions',
    intro:
      'Each guide covers what to settle before you start, what a strong answer includes and the slip that most often ends the round.',
    itemListName: 'Datadog answer guides',
    items: [
      {
        id: 'sortable-real-time-table',
        title: 'Build a table of real-time data that sorts by any column',
        statement:
          'Render rows that keep arriving and changing, let the user sort by any column, and keep the sort, the selection and the scroll position stable while updates land.',
        whatThisMeasures:
          'Derived state from a single source, stable and deterministic sorting, immutable row updates, rendering cost under frequent changes, and accessible column controls.',
        clarifyFirst: [
          'Confirm the update rate and whether updates replace rows, append rows or both.',
          'Confirm whether sorting must be stable across equal values and whether a sort should pause when the user is interacting.',
        ],
        strongAnswer: [
          'Keep raw rows in one store and derive the sorted view with a memoised comparator per column instead of sorting in place.',
          'Give every row a stable identity so updates replace a row without resetting selection or focus.',
          'Batch incoming updates per animation frame and avoid re-rendering rows that did not change.',
          'Expose sort controls as buttons with the current direction announced, and keep keyboard access to every column.',
        ],
        commonMiss:
          'Sorting the array in place or on every update, so the table flickers, the selection jumps and equal values swap places.',
        resourceLabel: 'Practice the dynamic table (Premium)',
        resourcePath: '/react/coding/react-dynamic-table',
        reportedRound: { label: DATADOG_VALBONNE_LABEL, url: DATADOG_VALBONNE_URL },
      },
      {
        id: 'live-tail-logs-architecture',
        title: 'Design the frontend architecture of a Live Tail log view',
        statement:
          'Design the client for a view that shows logs as they arrive, lets the user filter the stream, pause and resume it, and inspect one line without losing their place.',
        whatThisMeasures:
          'Streaming transport choice, bounded memory and DOM, filter semantics on a moving window, pause and resume rules, and how to keep counts and timestamps truthful.',
        clarifyFirst: [
          'Confirm the arrival rate, whether filters apply on the server or the client, and how much history must stay scrollable.',
          'Confirm what pause means: stop rendering, stop receiving, or buffer and show a count of new lines.',
        ],
        strongAnswer: [
          'Choose the transport for the rate and the reconnect story, and give every line a monotonic sequence so gaps and duplicates are visible.',
          'Keep a bounded buffer and render a window of it; drop or compact old lines with an explicit rule the user can see.',
          'Apply filters to the buffer, not to the DOM, and show how many lines were hidden.',
          'Pause on interaction, buffer new lines with a count, and resume without duplicating or reordering.',
        ],
        commonMiss:
          'Appending every line to the DOM and filtering by hiding elements, so memory grows without bound and the view stalls under load.',
        resourceLabel: 'Work through the infinite scroll list case',
        resourcePath: '/system-design/infinite-scroll-list',
        reportedRound: { label: DATADOG_VALBONNE_LABEL, url: DATADOG_VALBONNE_URL },
      },
      {
        id: 'ordering-and-filtering-under-time',
        title: 'Solve an ordering, filtering or counting exercise under time',
        statement:
          'A standard coding exercise on ordering and filtering a dataset, in the style of a medium algorithm problem; other screens asked for counting the repeated words in a paragraph.',
        whatThisMeasures:
          'Clean algorithmic fundamentals, correct comparators and predicates, edge cases around empty input and ties, and the ability to state complexity while coding.',
        clarifyFirst: [
          'Confirm the ordering rules for ties, case and locale, and whether the input may be mutated.',
          'Confirm the expected output shape and the size of the input before choosing an approach.',
        ],
        strongAnswer: [
          'Write the comparator or predicate as a named function with the tie rule spelled out.',
          'Use a frequency map for counting problems, normalise case and punctuation before counting words, and say why it is linear.',
          'Handle empty input, a single element and duplicates before polishing.',
          'State the time and space complexity and the one optimisation you would add with more time.',
        ],
        commonMiss:
          'Using the default sort on numbers, forgetting that the default comparator sorts by string value, or splitting words on spaces alone so punctuation creates false duplicates.',
        resourceLabel: 'Implement Array.prototype.filter (Premium)',
        resourcePath: '/javascript/coding/js-array-prototype-filter',
        reportedRound: { label: DATADOG_LISBON_LABEL, url: DATADOG_LISBON_URL },
      },
      {
        id: 'incremental-live-coding-on-tables',
        title: 'Build a table step by step in an hour of incremental React live coding',
        statement:
          'The exercise starts with a simple table, then adds requirements one at a time: filter the rows, sort them, then whatever the interviewer asks next. Keep working code at every step.',
        whatThisMeasures:
          'Pace under a clock, keeping state derivable from one source as requirements grow, immutable updates, and knowing which optimisations to mention rather than build.',
        clarifyFirst: [
          'Ask for the next step as soon as the current one works, and confirm the data shape before coding each step.',
          'Ask whether a quick inline solution is acceptable before extracting components or stores.',
        ],
        strongAnswer: [
          'Finish each step with working code before refactoring, and keep the earlier steps green.',
          'Keep rows in one array and derive filtered and sorted views from it, so each new step is a function of the same source.',
          'Update rows immutably by index or identity so later steps that compare or memoise still work.',
          'Name virtualisation and context providers as later optimisations only if asked, and keep the hour for behaviour.',
        ],
        commonMiss:
          'Spending the first fifteen minutes on folder structure and questions, then running out of time on the third step.',
        resourceLabel: 'Practice immutable row updates',
        resourcePath: '/javascript/coding/js-update-at-index',
        reportedRound: { label: DATADOG_PARIS_LABEL, url: DATADOG_PARIS_URL },
      },
      {
        id: 'feature-or-major-bug-walkthrough',
        title: 'Explain how you would build a feature or fix a major bug',
        statement:
          'Without an editor, describe how you would approach developing a feature or fixing a major bug in a data-heavy product: where you would start, what you would measure, how you would ship it safely and how you would know it worked.',
        whatThisMeasures:
          'Product and engineering judgment, debugging method, risk management in production, and how you communicate a plan with explicit unknowns.',
        clarifyFirst: [
          'Ask what is already known about the bug or feature: reproduction steps, affected users, metrics, deadlines.',
          'Ask which constraints matter most: correctness, latency, rollout safety or team capacity.',
        ],
        strongAnswer: [
          'Reproduce or specify first; name the metric or test that proves the problem or the feature.',
          'Isolate the cause with evidence rather than guesses, and keep a list of what you ruled out.',
          'Ship behind a flag or a canary, with a rollback path and monitoring for the exact regression.',
          'Close the loop with a check on the metric and a note on what would prevent the next occurrence.',
        ],
        commonMiss:
          'Jumping to a fix without a reproduction or a success signal, so the interviewer cannot see how you would know you were done.',
        resourceLabel: 'Read the search typing lag incident',
        resourcePath: '/incidents/search-typing-lag',
        reportedRound: { label: DATADOG_LISBON_LABEL, url: DATADOG_LISBON_URL },
      },
    ],
  },
  walkthrough: {
    kicker: 'Mini walkthrough',
    title: 'Scope the sortable real-time table before writing the first line',
    intro:
      'Four decisions to say out loud before typing, for the open question: a React table of real-time data that the user can sort by any column.',
    steps: [
      { title: 'Pin the update contract', description: 'Replace, append or both; how fast; and whether an update may arrive for a row the user has selected.' },
      { title: 'Separate source from view', description: 'Raw rows in one place, sorted views derived from them with memoised comparators.' },
      { title: 'Give rows an identity', description: 'Key rows by a stable id so selection, focus and animations survive an update.' },
      { title: 'Decide what happens during interaction', description: 'Pause reordering while the user sorts or selects, and show a count of pending updates instead of moving the row under the pointer.' },
    ],
  },
  prepPlan: {
    kicker: 'Actionable preparation',
    title: 'A 7-day Datadog frontend interview preparation plan',
    intro:
      'Seven days in the order Datadog loops tend to run: the CoderPad screen, the React hour, the harder coding round, the design round and the experience interview, then a mock of the whole day.',
    days: [
      { day: 'Day 1', focus: 'Algorithm screen: two easy-to-medium problems in 40 to 60 minutes on CoderPad, in JavaScript or TypeScript, talking through each step.', artifact: 'Four solved problems with the complexity stated and the edge cases you tested.' },
      { day: 'Day 2', focus: 'The open question: a React table of real-time data that sorts by any column, built inside an hour with stable row identity.', artifact: 'A working table that keeps its sort and selection while rows update.' },
      { day: 'Day 3', focus: 'Growing tasks: an hour in which a partner adds one requirement at a time, the shape the hired 2025 Paris candidate describes for the React round.', artifact: 'A time log with working code at every step.' },
      { day: 'Day 4', focus: 'Harder coding round: one medium-to-hard problem whose criteria change halfway, solved first and tidied after.', artifact: 'Two problems where you changed the solution after a new criterion.' },
      { day: 'Day 5', focus: 'Frontend system design: a data-heavy screen on Excalidraw, covering the UI, the API endpoints and rendering performance.', artifact: 'One diagram with the endpoints, the state and the rendering limits.' },
      { day: 'Day 6', focus: 'Experience and values: a past project presented in about 15 minutes, then behavioural stories, why Datadog among them.', artifact: 'A project walkthrough and five stories, one about a conflict and one about tough feedback.' },
      { day: 'Day 7', focus: 'Mock loop: an algorithm round, a React hour, a design round and an experience interview on one day.', artifact: 'Your questions for the recruiter: the order of the rounds, whether a take-home replaces the React hour, and which step is in person.' },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common Datadog frontend interview preparation questions',
    items: [
      { question: 'Are these the real Datadog questions?', answer: 'They are questions candidates reported in anonymous reviews re-posted on Taro, retold in our words. Datadog has not confirmed any of them. A few problems recur in two to four reviews; most rows rest on one account. The outlines that answer them, and the tasks to practise on, come from FrontendAtlas.' },
      { question: 'How much algorithm practice does a Datadog frontend loop need?', answer: 'Most loops have two algorithm rounds: a screen of 40 to 60 minutes with two easy-to-medium problems on CoderPad, and later a single harder problem. A 2023 candidate could search MDN during the screen, and a 2024 Madrid candidate solved the screen problems together with the interviewer.' },
      { question: 'Should I build virtualisation in the React round?', answer: 'The hired September 2025 Paris candidate advises against it: the exercise grows one part at a time, so finish each step and skip optimisations such as a context provider or virtualisation.' },
      { question: 'Is there a take-home project?', answer: 'For some roles. Datadog\'s candidate experience page lists one, and its AI guidelines expect the work to be your own and to be discussed live afterwards. A 2024 France candidate chose a take-home over the live React round, with 4 to 6 suggested hours, and two 2021 accounts had one as a separate step.' },
      { question: 'Can I use AI tools in a Datadog interview?', answer: 'Not in live coding or technical assessments unless you are told otherwise in advance, according to Datadog\'s AI guidelines for interviews. Some roles run AI-assisted coding interviews in which AI tools are allowed and expected, and candidates are told beforehand. No frontend account here describes one.' },
      { question: 'Is any step in person?', answer: 'Datadog\'s page says one step is expected in person. In the accounts, the 2025 Paris candidate had the design round at the Paris office and a 2024 Madrid offer followed a visit to the Madrid office, while the 2024 candidate whose React round gave the open question interviewed entirely online.' },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Free practice for the Datadog rounds',
    intro:
      'Free drills for what the Datadog rounds share: an hour-sized React build, rows that keep their identity, one source for derived views, an algorithm plan, rendering cost in design and a story structure.',
    items: [
      { label: 'Fetch and render a list with loading, error and empty states', description: 'An hour-sized React build, the format of the live round.', path: '/react/coding/react-fetch-list-states' },
      { label: 'Keys in React lists', description: 'Why rows that update need a stable key, as in the open question.', path: '/react/trivia/react-keys-in-lists' },
      { label: 'Why derived state is an anti-pattern', description: 'Keep one source of rows and compute the sorted view from it.', path: '/react/trivia/react-derived-state-anti-pattern' },
      { label: 'Data structures and algorithms for frontend loops', description: 'A plan for the CoderPad screen and the harder coding round.', path: '/guides/interview-blueprint/dsa-for-fe' },
      { label: 'Frontend system design blueprint: performance', description: 'How to talk about rendering cost in the design round.', path: '/guides/system-design-blueprint/performance' },
      { label: 'Behavioural stories', description: 'A structure for the experience and values interview.', path: '/guides/behavioral/stories' },
    ],
  },
  sources: {
    kicker: 'Public interview reports and official context',
    title: 'Sources and evidence limits',
    intro: 'Each note says what that account or page covers and where it stops.',
    items: [
      { label: DATADOG_VALBONNE_LABEL, url: DATADOG_VALBONNE_URL, note: 'A hired senior engineer: a recruiter call, two algorithm exercises and later a single harder problem on CoderPad, a React session, frontend architecture on Excalidraw, an hour split between a past project and behavioural questions, then two team-match interviews. The open question comes from its React session.', kind: 'report' },
      { label: DATADOG_PARIS_LABEL, url: DATADOG_PARIS_URL, note: 'A hired senior engineer: a recruiter call with questions on past projects, a medium LeetCode-style screen, an incremental React exercise, a design round held at the Paris office, a behavioural round and short calls to choose a team. Its advice: finish each step before optimising.', kind: 'report' },
      { label: DATADOG_FRANCE_2024_LABEL, url: DATADOG_FRANCE_2024_URL, note: 'A hired senior engineer with a New York-based recruiter: a screen of a short project talk and two CoderPad problems, a take-home chosen over a live React session, a design interview on Excalidraw, a one-hour product-focused coding round, an experience and values interview with an engineering manager and a 30-minute team match.', kind: 'report' },
      { label: DATADOG_FRANCE_2023_LABEL, url: DATADOG_FRANCE_2023_URL, note: 'A hired senior engineer: a 30-minute recruiter call, then five one-hour rounds on Zoom, a CoderPad screen with MDN allowed, frontend system design on Excalidraw, React live coding with docs allowed, a harder live-coding round and a hiring-manager interview with a project presentation, then two placement interviews.', kind: 'report' },
      { label: DATADOG_MADRID_2024_LABEL, url: DATADOG_MADRID_2024_URL, note: 'A hired engineer: a 40-minute screen of two easy problems solved with the interviewer, then four one-hour interviews (coding, HTML and CSS with React, frontend system design, and a project presentation with values questions), two manager conversations and a visit to the Madrid office before the offer.', kind: 'report' },
      { label: DATADOG_MADRID_2025_LABEL, url: DATADOG_MADRID_2025_URL, note: 'A senior loop without an offer: two coding interviews, a cultural interview, one with a project manager and a design interview. The feedback was that the candidate did not discuss complex past projects enough.', kind: 'report' },
      { label: DATADOG_LISBON_LABEL, url: DATADOG_LISBON_URL, note: 'A senior loop without an offer, rated positive: an HR screen, LeetCode-style exercises on a call with an interviewer who explained well, then an on-site interview.', kind: 'report' },
      { label: DATADOG_LISBON_2024_LABEL, url: DATADOG_LISBON_2024_URL, note: 'A short review rated negative: a coding interview, then a design interview the candidate later learned they had failed; a promised feedback session never took place.', kind: 'report' },
      { label: DATADOG_PARIS_2021_LABEL, url: DATADOG_PARIS_2021_URL, note: 'A hired senior engineer in 2021: live coding of two simple functions, a take-home, live coding of one function of average difficulty, frontend system design and a hiring-manager interview mixing behavioural and technical talk.', kind: 'report' },
      { label: DATADOG_NEW_YORK_2021_LABEL, url: DATADOG_NEW_YORK_2021_URL, note: 'The only US account: a recruiter call the day after a referral, a tech screen on Zoom, a take-home given as 4 to 6 hours in one place and 6 to 8 in another, then an on-site with a front-end coding round, a design round and several conversations. No offer.', kind: 'report' },
      { label: 'Datadog: Candidate experience', url: DATADOG_CANDIDATE_EXPERIENCE_URL, note: 'Official description of the hiring steps: an initial screen with a recruiter or hiring manager, face-to-face interviews in rounds or panels with one step expected in person, a take-home project, an executive interview for some roles, then selection. It does not describe frontend questions.', kind: 'official' },
      { label: 'Datadog: AI guidelines for interviews', url: DATADOG_AI_GUIDELINES_URL, note: 'Official rules on AI tools: none in live coding or technical assessments unless you are told otherwise, AI-assisted coding interviews for some roles announced in advance, and take-home work that must be your own and is discussed live.', kind: 'official' },
    ],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full Datadog practice set',
    copy:
      'Premium opens the locked Datadog questions with their answer guides and practice tasks, and the wider premium library of coding, concept and system-design practice.',
    buttonLabel: 'Unlock the full Datadog practice set',
    src: 'company_preview_datadog',
  },
  about: [
    'Datadog frontend interview preparation',
    'Sortable real-time data tables in React',
    'Datadog CoderPad algorithm screen',
    'Datadog frontend system design round',
  ],
  indexAnchorLabel: 'Datadog frontend interview questions',
};
