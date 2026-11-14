import type { AuthoredCompanyPreview } from '../../shared/company-previews/authored-company-preview.model';

/**
 * Waymo frontend interview guide. The reported questions live with the process table
 * (company-interview-processes.ts); the prompts here are the answer guides of all six. The sources are public accounts
 * on PracHub, LeetCode, Blind and Taro and Waymo's hiring page. Nothing here is a leaked, confirmed or official Waymo
 * question, and one complete frontend loop cannot establish a fixed format.
 */
const WAYMO_REPORT_URL =
  'https://prachub.com/interview-experiences/waymo-senior-frontend-engineer-interview-experience-rejected-30-minutes-after-pushing-on-the-process';
const WAYMO_REPORT_LABEL = 'Public report: Waymo senior frontend engineer loop, May 2026';
const WAYMO_SWE_REPORT_URL = 'https://leetcode.com/discuss/post/7949696/';
const WAYMO_SWE_REPORT_LABEL = 'Public report: Waymo software engineer loop on LeetCode, April 2026';

export const WAYMO_PREVIEW_TITLE = 'Waymo Frontend Interview Questions: {#questions} Reported + Prep Guide';
export const WAYMO_PREVIEW_H1 = 'Waymo Frontend Interview Questions';
export const WAYMO_PREVIEW_DESCRIPTION =
  'Prepare for a Waymo frontend interview with {#questions} reported questions from 2026 reports: the tree filter screen, Angular debugging and a four-round onsite.';
export const WAYMO_PREVIEW_CANONICAL_PATH = '/companies/waymo/preview';
export const WAYMO_PREVIEW_TRUST_NOTE =
  'The reported questions on this page are our wording of what candidates posted publicly, not leaked, confirmed or official Waymo questions, and the answer guides are FrontendAtlas\'s own. {reports} public accounts from 2022 to 2026 show what some loops asked; the instructions Waymo sends you come first.';

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
      'Waymo\'s hiring page sets out a sourcer or recruiter call, one or two phone or video interviews and a virtual onsite with up to five interviewers, each meeting lasting about 45 minutes, with AI tools barred unless the instructions say otherwise. A senior frontend candidate\'s loop from May 2026 shows what those rounds held for a frontend role. Under the round table are the {questions} questions candidates reported; anyone can read the first.',
    caveat:
      'One complete frontend loop, curated and edited by PracHub before it went up, stands behind most of this page. The other accounts come from a software engineer, an intern and a Waymo-badged commenter who says it depends on the interviewer.',
    chips: ['{#questions} reported questions', '{#reports} public accounts, 2022–2026', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'Prepare for product judgment, not Waymo trivia',
    paragraphs: [
      'The senior frontend loop rewards stating a contract before writing code: what the tree filter removes and what the UI shows for an empty term, which piece of component state a user\'s report points at, what happens to a streamed reply when the user stops it, and which response wins when typing outpaces the network. Each answer guide opens with the questions to ask, then the points a strong answer reaches and the slip that most often sinks it.',
      'The candidate, whose CV said React, recalls a job description asking for production-level Angular and met a debugging interviewer who only knew Angular; they could answer only at a high level, in pseudocode. They think the second onsite round, where small bugs crept into their code, is the one that cost them. Practise each shape in your own stack first, then once in Angular, and run your code before you call it done.',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked November 2026',
    title: 'What these Waymo accounts show, and what they leave to the recruiter',
    paragraphs: [
      'The frontend rounds come from one senior candidate\'s account on PracHub of a May 2026 loop for the simulation team, published in August 2026 and marked as curated and edited by PracHub. {reports} public accounts sit behind the page in all: that loop, a software engineer on the fleet response team whose April 2026 loop had one JavaScript UI round, a Waymo-badged engineer answering a 2023 Blind thread, and a 2022 intern loop on Taro. None of them can tell you how a question was worded or whether other teams run the same rounds.',
      'Ask the recruiter which framework the onsite uses and who will interview you: the senior candidate recalls the job description asking for production-level Angular, and one of their interviewers only knew Angular. Waymo\'s hiring page bars AI tools and LLMs unless the instructions allow them, and runs every live interview, technical, behavioural or design, without AI help.',
    ],
  },
  roleLenses: {
    kicker: 'Role lenses',
    title: 'Simulation tools or fleet response: where the accounts came from',
    intro:
      'The senior frontend loop was for the simulation team, and so was the interview the 2023 Blind thread asked about; the software engineer loop was for fleet response. Practise in the context nearer your role; neither one predicts the team you will meet.',
    items: [
      {
        title: 'Simulation team',
        description:
          'Both the 2026 senior frontend loop and the 2023 Blind thread concern the simulation team. Its reported rounds lean on hierarchical data, a debugging session in existing Angular code and a frontend design discussion.',
        practiceFocus:
          'Derived state, filtering and tree rendering, explicit empty and error states, reproducing bugs from reports, and keeping a screen responsive with large lists.',
      },
      {
        title: 'Fleet response',
        description:
          'The 2026 software engineer loop was for fleet response and had one frontend round, a UI component in plain JavaScript; its hiring-manager round covered production ownership, reliability and finding a root cause.',
        practiceFocus:
          'Rendering hierarchical data without a framework, handling events for a large list from one listener, and a production problem you can walk through from symptom to root cause.',
      },
    ],
  },
  prompts: {
    kicker: 'Representative practice prompts',
    title: 'Answer guides for the Waymo questions',
    intro:
      'For each prompt, clarify the contract, explain ownership and trade-offs, implement or diagram the smallest credible slice, and test the failure cases.',
    itemListName: 'Waymo answer guides',
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
          'Confirm what to return and render when the root itself matches, and whether a node whose children were all removed still shows as an empty branch.',
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
        id: 'tree-filter-ui',
        title: 'Build a tree viewer whose folders open and close',
        statement:
          'Build a component that renders hierarchical data like a file explorer: folders open and close, nested items render recursively, and one listener handles clicks for the whole tree. In the 2026 frontend phone screen a UI like this rendered a filtered tree, so plan for the data changing under it.',
        whatThisMeasures:
          'Recursive rendering, stable node identity, open state kept apart from the data, semantic nested lists or a tree role, and event delegation with its trade-offs.',
        clarifyFirst: [
          'Ask whether the UI should be a framework component or plain DOM, and whether keyboard navigation and selection are in scope.',
          'Ask whether the data can change while the tree is open, and what an empty folder should show.',
        ],
        strongAnswer: [
          'Treat the data as the only input and derive what is visible from it and the set of open folders; a stored copy of the visible tree goes stale.',
          'Key every node by a stable id or path and keep open folders in a set of those keys, so new data or a new filter term never loses what the user opened.',
          'Render recursively as nested ul and li elements with a button per folder that carries aria-expanded; use the tree, treeitem and group roles only when arrow-key navigation is in scope.',
          'Handle clicks with one listener on the root that reads the node key from the event target, and name the trade-off: fewer listeners, but every click has to find its node.',
          'Test an empty folder, a deep tree, a folder opened and closed twice, and a click on a nested item that must not toggle its parent.',
        ],
        commonMiss:
          'Keying rows by index or storing open state on the data objects, so refreshed data opens the wrong folders or forgets the ones the user opened.',
        resourceLabel: 'Build the file explorer tree in React (Premium)',
        resourcePath: '/react/coding/react-file-explorer',
        reportedRound: { label: WAYMO_SWE_REPORT_LABEL, url: WAYMO_SWE_REPORT_URL },
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
          'The report says a Promise problem in plain TypeScript or JavaScript was asked and does not say which. Prepare the family: build a deferred promise, implement Promise.all with ordering and fail-fast semantics, and add cancellation or timeouts without breaking Promise rules.',
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
    kicker: 'Mini walkthrough',
    title: 'Scope the tree filter before writing the first line',
    intro:
      'The open phone-screen question, scoped out loud: the match rule, what a match removes, one walk that also renders, then the edge cases.',
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
    intro:
      'A week built on the senior frontend loop: a tree problem with its UI, Angular debugging, plain TypeScript, a design round and a UI build, then a full mock with no AI tools open.',
    days: [
      { day: 'Day 1', focus: 'Tree recursion and its UI: recursive and stack-based walks, pruning at visit time, then an indented UI that follows the input value.', artifact: 'The tree filter passing all eight tests, and a small UI that re-renders it as the term changes.' },
      { day: 'Day 2', focus: 'Angular debugging: reading unfamiliar component and template code, derived state that goes stale, flags set and never reset, handlers bound twice.', artifact: 'A written root cause and fix for each bug in one Angular debugging exercise.' },
      { day: 'Day 3', focus: 'Plain TypeScript: async functions with no framework, typed generics, error propagation and timing you can explain line by line.', artifact: 'A typed async utility with tests for ordering and failure.' },
      { day: 'Day 4', focus: 'Frontend system design: one product surface from state ownership to failure recovery, talked through in 45 minutes.', artifact: 'A one-page state and recovery diagram with the questions you would ask first.' },
      { day: 'Day 5', focus: 'UI build under time: an input-driven component with keyboard support, stale responses ignored and honest loading, empty and error states.', artifact: 'A component with tests for out-of-order responses and a failed request.' },
      { day: 'Day 6', focus: 'Angular pass: rebuild the Day 1 UI and the Day 5 component as standalone Angular components with signals.', artifact: 'Two small Angular components with behaviour checks.' },
      { day: 'Day 7', focus: 'Mock loop: four 45-minute rounds back to back, each narrated, with no AI tools open.', artifact: 'Three things to ask the recruiter: which framework the onsite uses, who runs each round, and whether any round lets you use AI.' },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common Waymo frontend interview preparation questions',
    items: [
      {
        question: 'Are these the real Waymo questions?',
        answer:
          'They are what candidates said they were asked, written here in our words; none is leaked or confirmed by Waymo. The answer guides and the practice tasks are FrontendAtlas\'s, built to rehearse those rounds.',
      },
      {
        question: 'Is Waymo an Angular shop?',
        answer:
          'For some teams, going by the accounts. The senior candidate recalls the 2026 job description asking for production-level Angular and met an onsite interviewer who only knew Angular, and the 2023 Waymo-badged commenter names Angular and JavaScript. The 2026 software engineer loop built its UI with no framework. Ask the recruiter, and prepare the same contracts in your own framework before an Angular pass.',
      },
      {
        question: 'How long is the Waymo virtual onsite?',
        answer:
          'Waymo\'s hiring page says up to five interviewers, each meeting lasting about 45 minutes. The 2026 senior frontend loop had four rounds, all frontend; the account gives no lengths.',
      },
      {
        question: 'Can I use AI tools in a Waymo interview?',
        answer:
          'Not unless the instructions say so. The hiring page says AI tools and LLMs are not permitted unless specifically noted, and that live interviews, whether technical, behavioural or design, are held without AI assistance.',
      },
      {
        question: 'How current are these accounts?',
        answer:
          'The newest are from April and May 2026: the senior frontend loop and the software engineer loop. The Blind comment dates from March 2023 and the intern loop from September 2022. Rounds change by team and over time, so what your recruiter tells you outranks all of them.',
      },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Build the underlying skills with free practice',
    intro:
      'Free FrontendAtlas tasks that drill the skills the Waymo rounds call for; the tree filter is our runnable version of the open phone-screen question.',
    items: [
      { label: 'Filter a tree by substring and render it indented', description: 'Our runnable version of the open phone-screen question, with eight tests.', path: '/javascript/coding/js-filter-tree-render-indented' },
      { label: 'Keep only the latest async result', description: 'Abort or ignore a response that arrives after a newer request.', path: '/javascript/coding/js-take-latest' },
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
          'A senior frontend candidate\'s account of a May 2026 loop for the simulation team, published in August 2026 and marked as curated and edited by PracHub: a technical screen in two parts, then a virtual onsite of four frontend rounds. With another offer pending, the candidate pressed for a decision two days after the onsite and was turned down 30 minutes later.',
        kind: 'report',
      },
      {
        label: WAYMO_SWE_REPORT_LABEL,
        url: WAYMO_SWE_REPORT_URL,
        note:
          'A software engineer on the fleet response team, not a frontend title, with no offer: a recruiter screen, a Java coding round whose constraints kept changing, a JavaScript and UI round with no framework, a hiring-manager round and an algorithms round. Only its UI round is frontend work.',
        kind: 'report',
      },
      {
        label: 'Public comment: Waymo-badged engineer on Blind, March 2023',
        url: 'https://www.teamblind.com/post/waymo-frontend-web-interview-xcpohaau',
        note:
          'A reply in a thread about a simulation team interview from a commenter with a Waymo badge, describing their own interviews: two LeetCode-style and two frontend questions, only Angular and JavaScript, harder than Google in their view, and different from one interviewer to the next. The year of their interview is not given.',
        kind: 'report',
      },
      {
        label: 'Public report: Waymo software engineering intern loop on Taro, September 2022',
        url: 'https://www.jointaro.com/interviews/companies/waymo/experiences/software-engineering-intern-united-states-september-12-2022-no-offer-positive-279c47ab/',
        note:
          'An intern loop, not a frontend title, with no offer: two back-to-back 45-minute technical interviews, one leaning on technologies such as JavaScript and one on algorithms.',
        kind: 'report',
      },
      {
        label: 'Waymo: How we hire',
        url: 'https://careers.withwaymo.com/how-we-hire',
        note:
          'Waymo\'s own outline: a sourcer or recruiter conversation, one or two behavioural or technical phone or video interviews with a potential peer or manager, and a virtual onsite with up to five interviewers at about 45 minutes each. It bars AI tools and LLMs unless the instructions allow them.',
        kind: 'official',
      },
    ],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full Waymo practice set',
    copy:
      'Premium unlocks the React file explorer tree, the Angular debugging exercise, the Promise.all implementation and the broader company-tagged editorial set.',
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
