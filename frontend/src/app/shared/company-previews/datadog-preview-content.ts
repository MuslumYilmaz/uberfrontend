import type { AuthoredCompanyPreview } from '../../shared/company-previews/authored-company-preview.model';

/**
 * Datadog frontend interview guide. Every prompt is a FrontendAtlas practice version modelled on public,
 * self-reported frontend accounts (four on Taro from 2024 and 2025). Nothing here is a leaked, confirmed or official Datadog question, and a handful of
 * accounts cannot establish a fixed loop.
 */
const DATADOG_VALBONNE_URL =
  'https://www.jointaro.com/interviews/companies/datadog/experiences/senior-frontend-developer-valbonne-october-1-2024-accepted-offer-positive-47d59048/';
const DATADOG_VALBONNE_LABEL = 'Public report: Datadog senior frontend developer loop, Valbonne, October 2024';
const DATADOG_PARIS_URL =
  'https://www.jointaro.com/interviews/companies/datadog/experiences/senior-frontend-engineer-paris-september-1-2025-accepted-offer-positive-2a1ddfe8/';
const DATADOG_PARIS_LABEL = 'Public report: Datadog senior frontend engineer loop, Paris, September 2025';
const DATADOG_LISBON_URL =
  'https://www.jointaro.com/interviews/companies/datadog/experiences/senior-frontend-developer-lisbon-lisbon-district-november-23-2025-no-offer-positive-1a88bdda/';
const DATADOG_LISBON_LABEL = 'Public report: Datadog senior frontend developer loop, Lisbon, November 2025';
const DATADOG_LISBON_2024_URL =
  'https://www.jointaro.com/interviews/companies/datadog/experiences/software-engineer-front-end-lisbon-lisbon-district-june-1-2024-no-offer-negative-945bab75/';
const DATADOG_LISBON_2024_LABEL = 'Public report: Datadog software engineer (front end) interview, Lisbon, 2024';

export const DATADOG_PREVIEW_TITLE = 'Datadog Frontend Interview Questions: 5 Prompts + Prep Guide';
export const DATADOG_PREVIEW_H1 = 'Datadog Frontend Interview Questions';
export const DATADOG_PREVIEW_DESCRIPTION =
  'Prepare for a Datadog frontend interview with 5 practice prompts: sortable real-time tables, Live Tail log architecture, timed sorting and filtering.';
export const DATADOG_PREVIEW_CANONICAL_PATH = '/companies/datadog/preview';
export const DATADOG_PREVIEW_TRUST_NOTE =
  'These are FrontendAtlas practice versions modelled on rounds described in public interview reports, not leaked, confirmed or official Datadog questions. A few self-reported loops cannot establish a fixed format; use recruiter-provided material as the source of truth.';

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
      'Prepare with five practice prompts shaped by three public senior frontend accounts from 2024 and 2025: a sortable table of real-time data, the frontend architecture of a Live Tail log view, a timed ordering-and-filtering exercise, incremental live coding on data and tables, and a walkthrough of how you would build a feature or fix a major bug.',
    caveat:
      'This guide uses public, self-reported interview accounts to create realistic constraints. It does not claim access to private interview material, a fixed interview format, or the stack of every Datadog team.',
    chips: ['5 practice prompts', 'React, data tables, real-time logs', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'Prepare for product judgment, not Datadog trivia',
    paragraphs: [
      'Every public account converges on the same material: data that keeps changing, tables that must stay sortable and filterable while it changes, and logs that arrive faster than a screen can show them. The accounts also describe loops that test algorithms and frontend work equally, with LeetCode-style screens before the React and design rounds. Each prompt below starts with the clarifying questions a strong candidate asks, then the behaviours a strong answer covers, then the miss that usually ends the round.',
      'The Paris account gives the most useful tactical advice: the live coding exercise starts simple and adds parts step by step, so complete each step, do not spend the hour questioning requirements, and leave optimisations such as context providers or virtualisation for the discussion rather than the code.',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked October 2026',
    title: 'What the public accounts establish, and what you still need to confirm',
    paragraphs: [
      'Three self-reported senior frontend loops on Taro inform this guide. Valbonne, October 2024: two algorithm exercises, a practical React session, a harder algorithm round, frontend architecture on a whiteboard tool, an experience and values interview, and team matching; its listed prompts include counting repeated words, matching a pattern without regular expressions, a sortable real-time table and a Live Tail log view. Paris, September 2025: a medium algorithm screen, incremental live coding on data and tables, frontend and API design, behavioural questions. Lisbon, November 2025: an ordering-and-filtering exercise and an onsite discussion of how to build a feature or fix a major bug. A shorter 2024 Lisbon account adds a prompt to sketch the architecture of a real-time event viewer.',
      'Together they establish that these round types occurred between 2021 and 2025; they do not establish exact wording, the current format, or how every office interviews. Confirm the exercise types, the allowed tools and the timing with the recruiter. Datadog publishes its roles on its careers site; use that for product context, not as evidence of interview content.',
    ],
  },
  roleLenses: {
    kicker: 'Role lenses',
    title: 'Two product contexts for practising transferable frontend judgment',
    intro:
      'These are preparation lenses derived from the public prompts and the kinds of screens an observability product runs, not claimed team assignments. Choose the lens closest to the role and keep the reasoning framework-neutral.',
    items: [
      {
        title: 'Live data views',
        description:
          'Logs, traces and events that stream in continuously and must stay readable, filterable and selectable while they move.',
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
    title: 'Five Datadog frontend interview practice questions',
    intro:
      'For each prompt, clarify the contract, explain ownership and trade-offs, implement or diagram the smallest credible slice, and test the failure cases. Each prompt links to the public report it is modelled on and to a practice page.',
    itemListName: 'Five Datadog frontend interview practice prompts',
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
        title: 'Solve an ordering-and-filtering exercise under time',
        statement:
          'A standard coding exercise on ordering and filtering a dataset, in the style of a medium algorithm problem, with follow-ups such as counting repeated words in a paragraph or matching a pattern without regular expressions.',
        whatThisMeasures:
          'Clean algorithmic fundamentals, correct comparators and predicates, edge cases around empty input and ties, and the ability to state complexity while coding.',
        clarifyFirst: [
          'Confirm the ordering rules for ties, case and locale, and whether the input may be mutated.',
          'Confirm the expected output shape and the size of the input before choosing an approach.',
        ],
        strongAnswer: [
          'Write the comparator or predicate as a named function with the tie rule spelled out.',
          'Use a frequency map for counting problems and say why it is linear.',
          'Handle empty input, a single element and duplicates before polishing.',
          'State the time and space complexity and the one optimisation you would add with more time.',
        ],
        commonMiss:
          'Using the default sort on numbers or forgetting that the default comparator sorts by string value.',
        resourceLabel: 'Implement Array.prototype.filter (Premium)',
        resourcePath: '/javascript/coding/js-array-prototype-filter',
        reportedRound: { label: DATADOG_LISBON_LABEL, url: DATADOG_LISBON_URL },
      },
      {
        id: 'incremental-live-coding-on-tables',
        title: 'Survive incremental live coding on data and tables',
        statement:
          'The exercise starts small, then adds requirements step by step for an hour: show rows, then filter them, then group or update them, then handle a new data shape. Keep working code at every step.',
        whatThisMeasures:
          'Pace under a clock, keeping state derivable from one source as requirements grow, immutable updates, and knowing which optimisations to mention rather than build.',
        clarifyFirst: [
          'Ask for the next step as soon as the current one works, and confirm the data shape before coding each step.',
          'Ask whether a quick inline solution is acceptable before extracting components or stores.',
        ],
        strongAnswer: [
          'Finish each step with working code before refactoring, and keep the earlier steps green.',
          'Keep rows in one array and derive filtered, grouped and sorted views from it, so each new step is a function of the same source.',
          'Update rows immutably by index or identity so later steps that compare or memoise still work.',
          'Mention virtualisation and context providers as follow-ups and keep the hour for behaviour.',
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
    kicker: 'Public mini walkthrough',
    title: 'Scope the sortable real-time table before writing the first line',
    intro:
      'Treat this as a representative exercise, not a description of the reported one. Work from the contract toward the data flow, and say each decision out loud.',
    steps: [
      { title: 'Pin the update contract', description: 'Replace, append or both; how fast; and whether an update may arrive for a row the user has selected.' },
      { title: 'Separate source from view', description: 'Raw rows in one place, sorted and filtered views derived from them with memoised comparators.' },
      { title: 'Give rows an identity', description: 'Key rows by a stable id so selection, focus and animations survive an update.' },
      { title: 'Decide what happens during interaction', description: 'Pause reordering while the user sorts or selects, and show a count of pending updates instead of moving the row under the pointer.' },
    ],
  },
  prepPlan: {
    kicker: 'Actionable preparation',
    title: 'A 7-day Datadog frontend interview preparation plan',
    intro: 'Every day ends with code, a test, a design artifact, or a question you can use in the real process.',
    days: [
      { day: 'Day 1', focus: 'Algorithm screens: two medium problems a day on ordering, filtering and frequency counts, with the comparator rules written down.', artifact: 'Four solved problems with stated complexity.' },
      { day: 'Day 2', focus: 'Sorting and filtering fundamentals: stable sorts, numeric versus string comparators, frequency maps.', artifact: 'The filter and sort drills passing with edge cases.' },
      { day: 'Day 3', focus: 'Tables under change: derived views, stable identity, immutable updates, batched rendering.', artifact: 'A sortable table that keeps selection while rows update.' },
      { day: 'Day 4', focus: 'Live data architecture: transport, bounded buffers, pause and resume, filters on a moving window.', artifact: 'A one-page Live Tail design with its failure states.' },
      { day: 'Day 5', focus: 'Incremental live coding: a one-hour drill where a partner adds a requirement every ten minutes.', artifact: 'A time log showing working code at every step.' },
      { day: 'Day 6', focus: 'Feature and bug walkthroughs: reproduction, evidence, safe rollout, success signal.', artifact: 'Two written walkthroughs, one feature and one major bug.' },
      { day: 'Day 7', focus: 'Mock loop: one algorithm round, one table build, one design walkthrough, one experience interview, each narrated.', artifact: 'A list of the questions you will ask the recruiter about format, tools and timing.' },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common Datadog frontend interview preparation questions',
    items: [
      { question: 'Are these the real Datadog questions?', answer: 'No. They are FrontendAtlas practice versions modelled on round types described in public, self-reported accounts. The wording, the data and the test cases are ours.' },
      { question: 'How much algorithm practice does a frontend loop need?', answer: 'The public accounts describe LeetCode-style screens and at least one algorithm round in the onsite, alongside React and design rounds. Plan for medium problems with clean fundamentals rather than hard puzzles.' },
      { question: 'Should I build virtualisation in the live coding round?', answer: 'The Paris account advises against it: complete each step and mention virtualisation and context providers as follow-ups. Keep the hour for behaviour.' },
      { question: 'Does every office interview the same way?', answer: 'The accounts come from Valbonne, Paris and Lisbon and differ in round count and order. Treat them as shapes to practise and confirm the loop with the recruiter.' },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Build the underlying skills with free practice',
    intro:
      'These public pages cover the sorting, counting, immutable update, streaming and incident skills used by the practice prompts. They are supporting drills, not claimed Datadog questions.',
    items: [
      { label: 'Update an array at an index immutably', description: 'Row updates that keep earlier state intact.', path: '/javascript/coding/js-update-at-index' },
      { label: 'Count vowels', description: 'A frequency-count warm-up for the counting prompts.', path: '/javascript/coding/js-count-vowels' },
      { label: 'Fix numeric sort in sortScores', description: 'The default comparator sorts by string value.', path: '/javascript/debug/js-debug-numeric-sort' },
      { label: 'Infinite scroll list system design', description: 'Bounded rendering of a growing list.', path: '/system-design/infinite-scroll-list' },
      { label: 'Search typing lag incident', description: 'A production bug walked through from report to fix.', path: '/incidents/search-typing-lag' },
      { label: 'SSE vs WebSocket for a live dashboard', description: 'Transport trade-offs for streaming views.', path: '/tradeoffs/sse-vs-websocket-live-dashboard' },
      { label: 'Frontend system design blueprint: performance', description: 'How to talk about rendering cost in a design round.', path: '/guides/system-design-blueprint/performance' },
    ],
  },
  sources: {
    kicker: 'Public interview reports and official context',
    title: 'Sources and evidence limits',
    intro: 'These links support the public context used by the guide. Their notes state what each source can and cannot establish about preparation.',
    items: [
      { label: DATADOG_VALBONNE_LABEL, url: DATADOG_VALBONNE_URL, note: 'One self-reported senior loop with an offer. It lists the sortable real-time table, the Live Tail log view, two algorithm prompts and the behavioural themes; it cannot establish exact wording or the current format.', kind: 'report' },
      { label: DATADOG_PARIS_LABEL, url: DATADOG_PARIS_URL, note: 'One self-reported senior loop with an offer. It establishes the incremental live coding shape and the data-and-tables focus; it names no exact prompt.', kind: 'report' },
      { label: DATADOG_LISBON_LABEL, url: DATADOG_LISBON_URL, note: 'One self-reported senior loop without an offer. It establishes the ordering-and-filtering exercise and the feature-or-bug walkthrough; it names no exact prompt.', kind: 'report' },
      { label: DATADOG_LISBON_2024_LABEL, url: DATADOG_LISBON_2024_URL, note: 'One self-reported account without an offer. It lists the prompt to sketch the architecture of a real-time event viewer; nothing else from it is used.', kind: 'report' },
      { label: 'Datadog: Candidate experience', url: 'https://careers.datadoghq.com/candidate-experience/', note: 'Official description of the hiring steps: an initial screen, interviews in rounds or panels with one step expected in person, a take-home project and an executive interview for some roles. It does not describe frontend questions.', kind: 'official' },
    ],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full Datadog practice set',
    copy:
      'This public guide is complete enough to plan a focused week. Premium unlocks the dynamic table, the sort and filter implementations, the live comments stream case and the broader company-tagged editorial set.',
    buttonLabel: 'Unlock the full Datadog practice set',
    src: 'company_preview_datadog',
  },
  about: [
    'Datadog frontend interview preparation',
    'Sortable real-time data tables',
    'Live log view frontend architecture',
    'Ordering and filtering coding exercises',
  ],
  indexAnchorLabel: 'Datadog frontend interview questions',
};
