import type { AuthoredCompanyPreview } from '../../shared/company-previews/authored-company-preview.model';

/**
 * Waymo frontend interview guide. Every prompt is a FrontendAtlas practice version modelled on rounds
 * described in one public interview report (PracHub, May 2026). Nothing here is a leaked, confirmed or
 * official Waymo question, and one report cannot establish a fixed loop.
 */
const WAYMO_REPORT_URL =
  'https://prachub.com/interview-experiences/waymo-senior-frontend-engineer-interview-experience-rejected-30-minutes-after-pushing-on-the-process';
const WAYMO_REPORT_LABEL = 'Public report: Waymo senior frontend engineer loop, May 2026';

export const WAYMO_PREVIEW_TITLE = 'Waymo Frontend Interview Questions: 5 Prompts + Prep Guide';
export const WAYMO_PREVIEW_H1 = 'Waymo Frontend Interview Questions';
export const WAYMO_PREVIEW_DESCRIPTION =
  'Prepare for a Waymo frontend interview with 5 prompts modelled on a public 2026 report: tree filtering, Angular debugging, Promises, AI chat and autocomplete.';
export const WAYMO_PREVIEW_CANONICAL_PATH = '/companies/waymo/preview';
export const WAYMO_PREVIEW_TRUST_NOTE =
  'These are FrontendAtlas practice versions modelled on rounds described in public interview reports, not leaked, confirmed or official Waymo questions. One or two reports cannot establish a fixed loop; use recruiter-provided material as the source of truth.';

export const WAYMO_COMPANY_PREVIEW: AuthoredCompanyPreview = {
  slug: 'waymo',
  label: 'Waymo',
  title: WAYMO_PREVIEW_TITLE,
  h1: WAYMO_PREVIEW_H1,
  description: WAYMO_PREVIEW_DESCRIPTION,
  canonicalPath: WAYMO_PREVIEW_CANONICAL_PATH,
  trustNote: WAYMO_PREVIEW_TRUST_NOTE,
  hero: {
    kicker: 'Public Waymo prep guide',
    subtitle:
      'Prepare with five practice prompts shaped by one public account of a 2026 senior frontend loop: a tree filter rendered as UI, an Angular screen fixed from user bug reports, a TypeScript Promise problem, the frontend of an AI chat application, and an autocomplete search bar with debounce.',
    caveat:
      'This guide uses a public, self-reported interview account to create realistic constraints. It does not claim access to private interview material, a fixed interview format, or the stack of every Waymo team.',
    chips: ['5 practice prompts', 'TypeScript, Angular, AI chat system design', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'Prepare for product judgment, not Waymo trivia',
    paragraphs: [
      'The reported loop rewards engineers who state a contract before writing code: what a filter removes, which state owns a list, what happens to a reply when the user presses Stop. Each prompt below starts with the clarifying questions a strong candidate asks, then the behaviours a strong answer covers, then the miss that usually ends the round.',
      'Treat the report as a shape, not a script. The phone screen rendered a filtered tree as UI; the onsite mixed debugging, a Promise exercise, system design and a timed UI build. Practice those shapes in your own stack first, then once in Angular, because the May 2026 posting asked for production Angular experience.',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked October 2026',
    title: 'What the report establishes, and what you still need to confirm',
    paragraphs: [
      'One self-reported senior loop on PracHub (Simulation team, May 2026) describes the rounds this guide is modelled on. It establishes that those round types were asked once; it does not establish exact wording, the current format, or that every team interviews the same way. A second senior onsite account exists on 1point3acres but is locked, so it only confirms that more than one account exists.',
      'Confirm the exercise types, the allowed tools, the expected stack and the timing with the recruiter and the job description. Waymo publishes roles and teams on its careers site; use that for context, not as evidence of interview content.',
    ],
  },
  roleLenses: {
    kicker: 'Role lenses',
    title: 'Two product contexts for practising transferable frontend judgment',
    intro:
      'These are preparation lenses derived from the public report and the kinds of screens an autonomous-driving company runs, not claimed team assignments. Choose the lens closest to the role and keep the reasoning framework-neutral.',
    items: [
      {
        title: 'Simulation and internal tooling',
        description:
          'The reported loop came from a simulation team: data-dense screens, trees and tables of runs, filters that must stay truthful, and bug reports from engineers who use the tool all day.',
        practiceFocus:
          'Derived state, filtering and tree rendering, explicit empty and error states, reproducing bugs from reports, and keeping a screen responsive with large lists.',
      },
      {
        title: 'Operations and status dashboards',
        description:
          'Fleet and operations views combine live status, retries against flaky services and operator actions that must never fire twice.',
        practiceFocus:
          'Request ownership and cancellation, idempotent actions, reconnect and retry rules, and accessible controls that an operator can drive from the keyboard.',
      },
    ],
  },
  prompts: {
    kicker: 'Representative practice prompts',
    title: 'Five Waymo frontend interview practice questions',
    intro:
      'For each prompt, clarify the contract, explain ownership and trade-offs, implement or diagram the smallest credible slice, and test the failure cases. Each prompt links to the public report it is modelled on and to a runnable practice page.',
    itemListName: 'Five Waymo frontend interview practice prompts',
    items: [
      {
        id: 'tree-filter-render',
        title: 'Filter a tree by substring and render it indented',
        statement:
          'Given an n-ary tree of named nodes and a search term, drop every node whose name contains the term together with its subtree, then render what remains so the hierarchy stays readable.',
        whatThisMeasures:
          'Recursion or explicit stacks, pruning at visit time, order and indentation contracts, immutability, and whether you ask about case sensitivity and the empty term before coding.',
        clarifyFirst: [
          'Confirm match semantics: substring or exact, case-sensitive or not, and what an empty term should do.',
          'Confirm whether a matching root removes everything and whether ancestors of a surviving node must stay visible.',
        ],
        strongAnswer: [
          'Walk the tree depth-first and decide at each node whether it survives; skip the subtree of a pruned node instead of filtering afterwards.',
          'Carry depth with each node so indentation or nesting is derived during the walk.',
          'Keep sibling order and never mutate the input tree.',
          'Rendering as UI: map the same walk to nested list elements and keep expand and collapse state outside the traversal.',
          'Test a matching root, an empty term, case sensitivity, deep nesting and a node without children.',
        ],
        commonMiss:
          'Filtering children after rendering, which keeps the grandchildren of a pruned node alive, or letting an empty term prune the whole tree because every string includes the empty string.',
        resourceLabel: 'Practice the tree filter with tests',
        resourcePath: '/javascript/coding/js-filter-tree-render-indented',
        reportedRound: { label: WAYMO_REPORT_LABEL, url: WAYMO_REPORT_URL },
      },
      {
        id: 'angular-bug-reports-debugging',
        title: 'Fix an Angular screen from three user bug reports',
        statement:
          'You receive an Angular app and three short reports from people who use it. Reproduce each report, find the root cause, fix all three, and explain what you changed without breaking the existing behaviour.',
        whatThisMeasures:
          'Reading unfamiliar component and template code, turning a report into a reproduction, derived-state and event-binding reasoning, and communicating a root cause rather than a symptom patch.',
        clarifyFirst: [
          'Ask which report is most urgent and whether the fix may change the template structure or only the component logic.',
          'Ask how the screen is tested so your fix can be verified the same way.',
        ],
        strongAnswer: [
          'Reproduce before editing: trigger each report in the running app and name the state that is wrong.',
          'Look for derived state computed from a previous result instead of from the source, and for flags that are set but never reset.',
          'Check for duplicate handlers, such as a submit button inside a form that also listens for submit.',
          'Fix the cause, keep test ids and public behaviour, and say what each change does.',
        ],
        commonMiss:
          'Patching the symptom, for example resetting a flag in the click handler, while the derived-state bug that caused it stays in place.',
        resourceLabel: 'Debug the fleet status board (Premium)',
        resourcePath: '/angular/debug/ng-debug-fleet-status-bug-reports',
        reportedRound: { label: WAYMO_REPORT_LABEL, url: WAYMO_REPORT_URL },
      },
      {
        id: 'promise-contract-typescript',
        title: 'Implement a Promise contract in TypeScript',
        statement:
          'The report says a pure TypeScript Promise problem was asked and does not say which. Prepare the family: build a deferred promise, implement Promise.all with ordering and fail-fast semantics, and add cancellation or timeouts without breaking Promise rules.',
        whatThisMeasures:
          'Microtask timing, settlement rules, typed generics, error propagation, and whether you can explain adoption of a thenable and first-settlement-wins behaviour.',
        clarifyFirst: [
          'Confirm whether native Promise may be used inside the implementation or whether the exercise is about the state machine itself.',
          'Confirm the expected behaviour on an empty input and on the first rejection.',
        ],
        strongAnswer: [
          'Keep settlement in one place so only the first resolve or reject wins and later calls are ignored.',
          'Preserve input order in Promise.all results while letting work run concurrently.',
          'Type the public contract with generics and let callbacks run on a later microtask.',
          'State which follow-ups you would add: timeout, cancellation through AbortSignal, and settled-count reporting.',
        ],
        commonMiss:
          'Resolving with an array that fills in completion order, or letting a second resolve call overwrite an already settled value.',
        resourceLabel: 'Practice the deferred promise drill',
        resourcePath: '/javascript/coding/js-create-deferred-promise',
        reportedRound: { label: WAYMO_REPORT_LABEL, url: WAYMO_REPORT_URL },
      },
      {
        id: 'ai-chat-frontend-design',
        title: 'Design the frontend of an AI chat application',
        statement:
          'Design the composer, the streaming reply and the conversation state for an AI chat product: one active reply at a time, Send that becomes Stop, retries that never duplicate a turn, and stale stream events that cannot touch the new turn.',
        whatThisMeasures:
          'State ownership across input, drafts, uploads and the active turn; stream and command identity; cancellation and recovery; and accessibility of streamed text.',
        clarifyFirst: [
          'Confirm the transport (SSE, WebSocket or a fetch stream) and whether the server can resume a stream by sequence number.',
          'Confirm what Stop must guarantee: a server-side stop or only a local abort with partial text kept.',
        ],
        strongAnswer: [
          'Give every send and every stream a stable identity and reject events that do not match the active turn.',
          'Separate persisted draft, transient composition and attachment readiness so Enter during IME composition cannot send.',
          'Batch rendered tokens and keep the scroll pinned to the bottom until the reader scrolls up.',
          'Define recovery: resume by sequence or snapshot, retry with the same request id, and show a truthful status at every step.',
        ],
        commonMiss:
          'Treating a local abort as a confirmed server Stop, so a late chunk from the old stream mutates the new reply.',
        resourceLabel: 'Work through the AI chat composer case',
        resourcePath: '/system-design/ai-chat-textarea-design',
        reportedRound: { label: WAYMO_REPORT_LABEL, url: WAYMO_REPORT_URL },
      },
      {
        id: 'debounced-autocomplete',
        title: 'Build an autocomplete search bar with debounce',
        statement:
          'Build a search box that suggests results as the user types, waits for a pause before requesting, ignores stale responses, and stays usable from the keyboard.',
        whatThisMeasures:
          'Timing control, request ownership and cancellation, keyboard and listbox semantics, and truthful loading, empty and error states.',
        clarifyFirst: [
          'Confirm the debounce interval, the minimum query length, the result limit and the selection behaviour.',
          'Confirm whether earlier requests can be aborted or only ignored.',
        ],
        strongAnswer: [
          'Separate input value, active query, request identity, results and visible status.',
          'Debounce starts; use an abort controller or a latest-request guard so an older response cannot overwrite a newer query.',
          'Expose combobox and listbox semantics and keep focus in the input while arrowing through results.',
          'Test out-of-order responses, rapid deletion to an empty query, a failed request and retry.',
        ],
        commonMiss:
          'Treating debounce as the race-condition fix while an older response or a finally block still overwrites the current query.',
        resourceLabel: 'Practice the React autocomplete starter',
        resourcePath: '/react/coding/react-autocomplete-search-starter',
        reportedRound: { label: WAYMO_REPORT_LABEL, url: WAYMO_REPORT_URL },
      },
    ],
  },
  walkthrough: {
    kicker: 'Public mini walkthrough',
    title: 'Scope the tree filter before writing the first line',
    intro:
      'Treat this as a representative exercise, not a description of the reported screen. Work from the contract toward the traversal, and say each decision out loud.',
    steps: [
      {
        title: 'Pin the match rule',
        description:
          'Substring, case-sensitive, and an empty term keeps everything. Say it, then write it as the first guard.',
      },
      {
        title: 'Decide prune versus keep-ancestors',
        description:
          'This prompt prunes: a matching node takes its subtree with it. The opposite filter, keeping ancestors of a match, is a different traversal; name the difference.',
      },
      {
        title: 'Walk once, render during the walk',
        description:
          'Depth-first, siblings in order, depth carried along. Rendering text or nested list items is the same walk with a different emit step.',
      },
      {
        title: 'Test the edges before polishing',
        description:
          'Matching root, empty term, deep nesting, a leaf without children, and the input left untouched.',
      },
    ],
  },
  prepPlan: {
    kicker: 'Actionable preparation',
    title: 'A 7-day Waymo frontend interview preparation plan',
    intro: 'Every day ends with code, a test, a design artifact, or a question you can use in the real process.',
    days: [
      { day: 'Day 1', focus: 'Tree traversal: recursive and stack-based walks, prune at visit time, render text and nested lists.', artifact: 'The tree filter passing all eight tests in both forms.' },
      { day: 'Day 2', focus: 'Derived state: lists computed from a source, flags assigned rather than toggled, duplicate handlers.', artifact: 'A written root cause for each of the three fleet-board reports.' },
      { day: 'Day 3', focus: 'Promises in TypeScript: deferred, Promise.all ordering, first settlement wins, microtask timing.', artifact: 'A typed Promise.all with tests for order and fail-fast.' },
      { day: 'Day 4', focus: 'AI chat frontend: identities for sends and streams, Stop versus abort, resume rules.', artifact: 'A one-page state and recovery diagram for the composer and active turn.' },
      { day: 'Day 5', focus: 'Autocomplete: debounce, latest-request guard, combobox semantics, failure states.', artifact: 'The autocomplete starter with out-of-order responses handled.' },
      { day: 'Day 6', focus: 'Angular pass: rebuild the tree filter and the autocomplete as standalone components with signals.', artifact: 'Two small Angular components with behaviour checks.' },
      { day: 'Day 7', focus: 'Mock loop: one timed build, one debugging session from a bug report, one design walkthrough, each narrated.', artifact: 'A list of the questions you will ask the recruiter about format, tools and stack.' },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common Waymo frontend interview preparation questions',
    items: [
      {
        question: 'Are these the real Waymo questions?',
        answer:
          'No. They are FrontendAtlas practice versions modelled on round types described in one public, self-reported account. The wording, the data and the test cases are ours.',
      },
      {
        question: 'Is Waymo an Angular shop?',
        answer:
          'The May 2026 posting behind the report asked for production Angular experience and the onsite included an Angular debugging round. One report cannot establish the stack of every team; confirm it with the recruiter and prepare the same contracts in your own framework first.',
      },
      {
        question: 'Which Promise problem was asked?',
        answer:
          'The report only says a pure TypeScript Promise problem. Prepare the family: deferred promise, Promise.all semantics, and cancellation or timeout follow-ups.',
      },
      {
        question: 'Does the report describe the current loop?',
        answer:
          'It describes one loop in May 2026. Interview formats change by team and over time, so treat it as a shape to practise, not a schedule to expect.',
      },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Build the underlying skills with free practice',
    intro:
      'These public pages cover the traversal, async, debugging, design and communication skills used by the practice prompts. They are supporting drills, not claimed Waymo questions.',
    items: [
      { label: 'Filter a tree by substring and render it indented', description: 'Runnable version of the tree prompt with eight tests.', path: '/javascript/coding/js-filter-tree-render-indented' },
      { label: 'Create a deferred promise', description: 'Settle a promise from the outside and reason about first-settlement-wins.', path: '/javascript/coding/js-create-deferred-promise' },
      { label: 'Keep only the latest async result', description: 'Abort or ignore stale requests behind an autocomplete.', path: '/javascript/coding/js-take-latest' },
      { label: 'React autocomplete starter', description: 'Debounced suggestions with keyboard semantics.', path: '/react/coding/react-autocomplete-search-starter' },
      { label: 'AI chat composer and streaming turn', description: 'System design case for Send, Stop and stale stream events.', path: '/system-design/ai-chat-textarea-design' },
      { label: 'What actually cancels an Angular HTTP request', description: 'Cancellation lab for request ownership in Angular.', path: '/angular/trivia/angular-http-what-actually-cancels-request' },
      { label: 'Debug stale UI under OnPush', description: 'Angular change detection debugging from a real production bug.', path: '/angular/trivia/angular-onpush-change-detection-debugging-real-bug' },
    ],
  },
  sources: {
    kicker: 'Public interview reports and official context',
    title: 'Sources and evidence limits',
    intro: 'These links support the public context used by the guide. Their notes state what each source can and cannot establish about preparation.',
    items: [
      {
        label: WAYMO_REPORT_LABEL,
        url: WAYMO_REPORT_URL,
        note:
          'One self-reported senior loop from a simulation team. It establishes the round types this guide is modelled on; it cannot establish exact wording, the current format or the stack of other teams.',
        kind: 'report',
      },
      {
        label: 'Waymo careers',
        url: 'https://careers.withwaymo.com/',
        note: 'Official roles and teams for product context only, not evidence of interview content or format.',
        kind: 'official',
      },
    ],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full Waymo practice set',
    copy:
      'This public guide is complete enough to plan a focused week. Premium unlocks the Angular debugging exercise, the Promise.all implementation and the broader company-tagged editorial set.',
    buttonLabel: 'Unlock the full Waymo practice set',
    src: 'company_preview_waymo',
  },
  about: [
    'Waymo frontend interview preparation',
    'Tree filtering and rendering',
    'Angular debugging from user bug reports',
    'AI chat frontend system design',
  ],
  indexAnchorLabel: 'Waymo frontend interview questions',
};
