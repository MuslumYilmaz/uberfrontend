import type { AuthoredCompanyPreview } from '../../shared/company-previews/authored-company-preview.model';

/**
 * ServiceNow frontend interview guide. Every prompt is a FrontendAtlas practice version modelled on public,
 * self-reported accounts (a 2025 UI engineer write-up on Medium and Blind threads from 2021, 2022 and 2025)
 * plus the public preview of a 2026 LeetCode Discuss report whose full text our tools could not read.
 * Nothing here is a leaked, confirmed or official ServiceNow question, and a handful of accounts cannot
 * establish a fixed loop.
 */
const SERVICENOW_MEDIUM_2025_URL =
  'https://medium.com/@karunakumari000532/my-servicenow-software-engineer-ui-interview-experience-2025-23f315b960dc';
const SERVICENOW_MEDIUM_2025_LABEL = 'Public report: ServiceNow software engineer (UI) loop, 2025';
const SERVICENOW_BLIND_STAFF_2021_URL = 'https://www.teamblind.com/post/servicenow-phone-screen-staff-engineer-interview-8msftqw8';
const SERVICENOW_BLIND_STAFF_2021_LABEL = 'Public thread: ServiceNow staff engineer phone screen, frontend-leaning, September 2021';
const SERVICENOW_BLIND_SENIOR_2021_URL = 'https://www.teamblind.com/post/servicenow-interview-uno44gdk';
const SERVICENOW_BLIND_SENIOR_2021_LABEL = 'Public thread: ServiceNow senior engineer phone screen, frontend-leaning, February 2021';
const SERVICENOW_BLIND_IC2_2025_URL = 'https://www.teamblind.com/post/servicenow-frontend-swe-ic2-interview-n7rqq1v2';
const SERVICENOW_BLIND_IC2_2025_LABEL = 'Public thread: ServiceNow frontend software engineer (IC2) interview, November 2025';
const SERVICENOW_BLIND_AMS_2022_URL = 'https://www.teamblind.com/post/ServiceNow-rounds-for-Software-engineer-front-end-focused-DZOzBuaO';
const SERVICENOW_LEETCODE_2026_URL = 'https://leetcode.com/discuss/post/7711064/';

export const SERVICENOW_PREVIEW_TITLE = 'ServiceNow Frontend Interview Questions: 5 Prompts + Guide';
export const SERVICENOW_PREVIEW_H1 = 'ServiceNow Frontend Interview Questions';
export const SERVICENOW_PREVIEW_DESCRIPTION =
  'Prepare for a ServiceNow frontend interview with 5 practice prompts: polyfills with edge cases, closures and output prediction, a tiny virtual DOM, UI design.';
export const SERVICENOW_PREVIEW_CANONICAL_PATH = '/companies/servicenow/preview';
export const SERVICENOW_PREVIEW_TRUST_NOTE =
  'These are FrontendAtlas practice versions modelled on rounds described in public interview reports, not leaked, confirmed or official ServiceNow questions. A few self-reported loops cannot establish a fixed format; use recruiter-provided material as the source of truth.';

export const SERVICENOW_COMPANY_PREVIEW: AuthoredCompanyPreview = {
  slug: 'servicenow',
  label: 'ServiceNow',
  title: SERVICENOW_PREVIEW_TITLE,
  h1: SERVICENOW_PREVIEW_H1,
  description: SERVICENOW_PREVIEW_DESCRIPTION,
  canonicalPath: SERVICENOW_PREVIEW_CANONICAL_PATH,
  trustNote: SERVICENOW_PREVIEW_TRUST_NOTE,
  hero: {
    kicker: 'Public ServiceNow prep guide',
    subtitle:
      'Prepare with five practice prompts shaped by public frontend accounts from 2021 to 2025: polyfills for built-in methods with their edge cases, closures and console output prediction, a tiny virtual DOM renderer, the components and data flow of a notification panel or autocomplete, and fundamentals such as Map versus Object explained without a framework.',
    caveat:
      'This guide uses public, self-reported interview accounts to create realistic constraints. It does not claim access to private interview material, a fixed interview format, or the stack of every ServiceNow team.',
    chips: ['5 practice prompts', 'Vanilla JavaScript first', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'Prepare for product judgment, not ServiceNow trivia',
    paragraphs: [
      'The public accounts agree on one thing above all: the JavaScript rounds test fundamentals rather than a framework. A 2021 reply from an employee says the company has its own framework, so knowing how the language works matters more than React or Angular; a 2025 UI engineer describes two consecutive rounds of closures, polyfills and output prediction before the hiring manager asked about Map versus Object. Each prompt below starts with the clarifying questions a strong candidate asks, then the behaviours a strong answer covers, then the miss that usually ends the round.',
      'Round shapes vary by team and year. A 2022 Amsterdam candidate described a competency-based hiring manager round and, per the recruiter, two-hour and one-hour technical sessions to follow; a 2025 IC2 candidate listed a 45-minute behavioural and code-along session and a 90-minute panel on algorithms and system design, with the hardest problems described as medium string and stack questions. Practise fundamentals until they are automatic and keep a design vocabulary for the data-flow round.',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked October 2026',
    title: 'What the public accounts establish, and what you still need to confirm',
    paragraphs: [
      'One self-reported 2025 loop on Medium for a software engineer (UI) role informs most prompts: a screening call; a JavaScript and React fundamentals round with closures, promises, a map polyfill and console output prediction; a deeper JavaScript round with increment and decrement functions inside loops and polyfills of built-in methods with edge cases; and a hiring manager round on Map versus Object, how Map works internally and when to choose it. Blind threads add a 2021 staff phone screen where a reply lists implementing a virtual DOM, implementing built-in prototype methods and a round on UI design and data flow; a 2021 senior phone screen where an employee advises JavaScript fundamentals over frameworks; a 2022 Amsterdam loop with a competency-based manager round and two technical sessions; and a 2025 IC2 loop with a behavioural code-along and a panel on algorithms and system design.',
      'A 2026 LeetCode Discuss report for a senior frontend developer appears in public search previews with a nested comments design, an autocomplete with debouncing, loading and empty states, a notification panel design, a question about rendering one hundred thousand messages, and two medium algorithm problems. Its full text could not be read by our tools, so this guide uses only what the previews show. Together the accounts establish that these round types occurred between 2021 and 2025, with locations, where stated, in India, the Netherlands and the United States; they do not establish exact wording, the current format, or how every team interviews. Confirm the round structure, the coding environment and whether a system design round is included with the recruiter. ServiceNow publishes its roles on its careers site; use that for product context, not as evidence of interview content.',
    ],
  },
  roleLenses: {
    kicker: 'Role lenses',
    title: 'Two product contexts for practising transferable frontend judgment',
    intro:
      'These are preparation lenses derived from the public prompts and the kinds of screens a workflow platform runs, not claimed team assignments. Choose the lens closest to the role and keep the reasoning framework-neutral.',
    items: [
      {
        title: 'Platform UI runtime',
        description:
          'Components and rendering primitives that product teams build on, where a framework may be in-house and the language itself is the interface.',
        practiceFocus:
          'Polyfills and prototype methods, closures and scope, a tiny virtual DOM, and output prediction under the event loop.',
      },
      {
        title: 'Workflow product screens',
        description:
          'Notification panels, comment threads, autocomplete fields and long lists that must stay responsive as data grows.',
        practiceFocus:
          'Component boundaries and data flow, loading and empty states, debouncing, and virtualised rendering of large lists.',
      },
    ],
  },
  prompts: {
    kicker: 'Representative practice prompts',
    title: 'Five ServiceNow frontend interview practice questions',
    intro:
      'For each prompt, clarify the contract, explain ownership and trade-offs, implement or diagram the smallest credible slice, and test the failure cases. Each prompt links to the public report it is modelled on and to a practice page.',
    itemListName: 'Five ServiceNow frontend interview practice prompts',
    items: [
      {
        id: 'polyfills-with-edge-cases',
        title: 'Write polyfills for built-in methods and defend the edge cases',
        statement:
          'Implement map, then forEach or bind, without using the built-in. Handle sparse arrays, the this argument, non-function callbacks and arrays that change during iteration, and explain each decision.',
        whatThisMeasures:
          'How the language actually behaves: prototype methods, this binding, holes in arrays, argument validation and reading a specification-shaped contract.',
        clarifyFirst: [
          'Confirm whether holes should be skipped like the built-in does, and whether the callback receives index and array.',
          'Confirm whether the polyfill may be attached to the prototype or must stay a standalone function.',
        ],
        strongAnswer: [
          'Validate the callback and throw the same error type the built-in throws.',
          'Iterate over own indices that exist, skip holes, and pass value, index and array to the callback with the given this value.',
          'Read the length once so elements appended during iteration are not visited.',
          'Name one edge case you chose not to cover and why, such as array-like objects.',
        ],
        commonMiss:
          'A for loop that visits holes as undefined and ignores the this argument, so the first follow-up question exposes the gap.',
        resourceLabel: 'Implement Array.prototype.map (Premium)',
        resourcePath: '/javascript/coding/js-array-prototype-map',
        reportedRound: { label: SERVICENOW_MEDIUM_2025_LABEL, url: SERVICENOW_MEDIUM_2025_URL },
      },
      {
        id: 'closures-and-output-prediction',
        title: 'Predict console output and write loop counters that prove you understand closures',
        statement:
          'Predict what a set of snippets logs, covering hoisting, timers inside loops and promise ordering. Then write functions that increment and decrement a shared variable from inside loops without leaking it to the global scope.',
        whatThisMeasures:
          'Scope and the temporal dead zone, how closures capture variables, microtasks versus timers, and the ability to narrate execution order.',
        clarifyFirst: [
          'Confirm whether the snippet uses var or let in the loop before predicting the timer output.',
          'Confirm whether the counter must expose reset or only increment and decrement.',
        ],
        strongAnswer: [
          'Separate the synchronous pass, the microtask queue and the timer queue, and log in that order.',
          'Explain that var shares one binding across iterations while let creates one per iteration.',
          'Return an object of functions that close over a private variable, and show that the variable is unreachable from outside.',
          'Point out the memory implication of closures that capture large structures.',
        ],
        commonMiss:
          'Predicting timer output as 0, 1, 2 with var, or exposing the counter variable on a global object.',
        resourceLabel: 'Practice the counter function',
        resourcePath: '/javascript/coding/js-create-counter',
        reportedRound: { label: SERVICENOW_MEDIUM_2025_LABEL, url: SERVICENOW_MEDIUM_2025_URL },
      },
      {
        id: 'tiny-virtual-dom-renderer',
        title: 'Implement a tiny virtual DOM renderer',
        statement:
          'Given a nested object that describes elements, attributes, event handlers and children, render it to real DOM nodes. Then describe how you would update the DOM when a new tree arrives without rebuilding everything.',
        whatThisMeasures:
          'Recursion over trees, the difference between attributes and properties, event binding, and a plain-language understanding of reconciliation.',
        clarifyFirst: [
          'Confirm the tree shape: tag, props, children, and how text nodes and handlers are represented.',
          'Confirm whether updating is in scope or only initial rendering.',
        ],
        strongAnswer: [
          'Create elements recursively, append children in order, and treat strings as text nodes.',
          'Set attributes for plain values, properties for things like value and checked, and addEventListener for handlers.',
          'For updates, compare trees by position and type, patch changed props, and replace subtrees whose type changed.',
          'Explain why keys help when children reorder, without claiming to implement a full diff.',
        ],
        commonMiss:
          'Using innerHTML with string concatenation, which drops handlers and opens an injection hole.',
        resourceLabel: 'Build a DOM renderer from a nested object (Premium)',
        resourcePath: '/javascript/coding/js-dom-renderer',
        reportedRound: { label: SERVICENOW_BLIND_STAFF_2021_LABEL, url: SERVICENOW_BLIND_STAFF_2021_URL },
      },
      {
        id: 'ui-design-and-data-flow',
        title: 'Design the components and data flow of a UI feature: notification panel, nested comments or autocomplete',
        statement:
          'Pick a feature such as a notification panel, a nested comment thread or an autocomplete field. Define the components, where state lives, how data flows in and out, and how the feature behaves while loading, empty, failing and under a large volume of items.',
        whatThisMeasures:
          'Component boundaries, state ownership, derived versus stored state, loading and empty states, debouncing, and bounded rendering of long lists.',
        clarifyFirst: [
          'Confirm the data source and update frequency, and whether items arrive in real time.',
          'Confirm the largest realistic volume, such as one hundred thousand messages, before choosing a rendering strategy.',
        ],
        strongAnswer: [
          'Draw the component tree and mark which component owns each piece of state and which only receives it.',
          'Show the request flow with debouncing for user input and cancellation of stale responses.',
          'Give every list a loading, empty and error state and say what the user sees in each.',
          'Virtualise long lists and keep unread counts and ordering truthful while items arrive.',
        ],
        commonMiss:
          'Rendering every message into the DOM and keeping state in several components at once, so counts drift and the panel stalls.',
        resourceLabel: 'Work through the notification toast system case',
        resourcePath: '/system-design/notification-toast-system',
        reportedRound: { label: SERVICENOW_BLIND_STAFF_2021_LABEL, url: SERVICENOW_BLIND_STAFF_2021_URL },
      },
      {
        id: 'fundamentals-over-frameworks',
        title: 'Explain Map versus Object and other fundamentals without leaning on a framework',
        statement:
          'In a conversational round, explain the differences between Map and a plain object, how Map works internally, when you would choose each in a real application, and defend the trade-offs when the interviewer pushes back.',
        whatThisMeasures:
          'Depth of language understanding, the ability to reason about data structures and performance without a framework, and clear trade-off communication.',
        clarifyFirst: [
          'Ask what the keys look like and how often entries are added and removed before recommending a structure.',
          'Ask whether iteration order or serialisation matters for the use case.',
        ],
        strongAnswer: [
          'Map accepts any key type, keeps insertion order, exposes size and iterates cleanly; objects have prototype keys, string and symbol keys only, and serialise to JSON directly.',
          'Describe Map as a hash-based structure with constant-time average operations, and note that objects with many dynamic keys can lose engine optimisations.',
          'Choose Map for frequent additions and removals or non-string keys, and objects for fixed-shape records and JSON payloads.',
          'Mention WeakMap for object-keyed caches that should not block garbage collection.',
        ],
        commonMiss:
          'Reciting a list of differences without being able to say which one matters for the use case in front of you.',
        resourceLabel: 'Read the Map versus plain object answer',
        resourcePath: '/javascript/trivia/js-map-vs-object',
        reportedRound: { label: SERVICENOW_MEDIUM_2025_LABEL, url: SERVICENOW_MEDIUM_2025_URL },
      },
    ],
  },
  walkthrough: {
    kicker: 'Public mini walkthrough',
    title: 'Scope the map polyfill before writing the first line',
    intro:
      'Treat this as a representative exercise, not a description of the reported one. Work from the built-in contract toward the edge cases, and say each decision out loud.',
    steps: [
      { title: 'State the contract', description: 'Callback with value, index and array; an optional this argument; a new array of the same length; the original untouched.' },
      { title: 'Decide what a hole means', description: 'The built-in skips holes and preserves them in the result; say whether you match that.' },
      { title: 'Validate before iterating', description: 'Throw a TypeError for a non-function callback, using the same message shape as the built-in.' },
      { title: 'Iterate deliberately', description: 'Read the length once, check own property existence per index, and call the callback with the this argument.' },
    ],
  },
  prepPlan: {
    kicker: 'Actionable preparation',
    title: 'A 7-day ServiceNow frontend interview preparation plan',
    intro: 'Every day ends with code, a test, a design artifact, or a question you can use in the real process.',
    days: [
      { day: 'Day 1', focus: 'Polyfills: map, forEach, filter, bind, with holes, this binding and validation covered by tests.', artifact: 'Four polyfills with edge-case tests.' },
      { day: 'Day 2', focus: 'Closures and output prediction: hoisting, timers in loops, promise ordering, private counters.', artifact: 'Ten predicted snippets and a counter module.' },
      { day: 'Day 3', focus: 'Virtual DOM: render a nested object to DOM, then sketch the update strategy.', artifact: 'A renderer with handler and property support.' },
      { day: 'Day 4', focus: 'Medium algorithms on strings and stacks, timed, in a HackerRank-style editor.', artifact: 'Four solved problems with stated complexity.' },
      { day: 'Day 5', focus: 'UI design and data flow: notification panel and autocomplete with loading, empty and error states and virtualised lists.', artifact: 'Two one-page designs with component trees.' },
      { day: 'Day 6', focus: 'Fundamentals under questioning: Map versus Object, prototype chain, event loop, with trade-offs for a stated use case.', artifact: 'Written answers to six fundamentals questions.' },
      { day: 'Day 7', focus: 'Mock loop: a behavioural code-along, a two-hour technical session and a design discussion, each narrated.', artifact: 'A list of the questions you will ask the recruiter about format, editor and design expectations.' },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common ServiceNow frontend interview preparation questions',
    items: [
      { question: 'Are these the real ServiceNow questions?', answer: 'No. They are FrontendAtlas practice versions modelled on round types described in public, self-reported accounts. The wording, the data and the test cases are ours.' },
      { question: 'Should I prepare React or Angular?', answer: 'A 2021 reply from an employee says the company has its own framework and that fundamentals matter more than React or Angular; a 2025 reply guesses that one team uses AngularJS. Prepare plain JavaScript first and keep one framework ready for the team you are matched with.' },
      { question: 'How hard are the algorithm questions?', answer: 'Accounts from 2021 and 2025 describe medium problems that still look like real work, such as string manipulation and stack questions. Expect HackerRank-style editors in some loops.' },
      { question: 'Is there a system design round?', answer: 'Some accounts list a UI design and data flow round or a panel on algorithms and system design; others list only JavaScript rounds and a hiring manager. Confirm with the recruiter and prepare one feature design either way.' },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Build the underlying skills with free practice',
    intro:
      'These public pages cover the polyfill, closure, fundamentals and design skills used by the practice prompts. They are supporting drills, not claimed ServiceNow questions.',
    items: [
      { label: 'Implement arrayForEach', description: 'A forEach polyfill without mutating the prototype.', path: '/javascript/coding/js-array-foreach' },
      { label: 'Create a counter function', description: 'Closures that keep a private variable.', path: '/javascript/coding/js-create-counter' },
      { label: 'Implement Function.prototype.bind', description: 'A prototype method by hand.', path: '/javascript/coding/js-implement-bind' },
      { label: 'Map vs plain object', description: 'The hiring manager question, answered with trade-offs.', path: '/javascript/trivia/js-map-vs-object' },
      { label: 'Explain closures', description: 'Scope capture and its uses.', path: '/javascript/trivia/js-closures' },
      { label: 'Predict var hoisting and shadowing', description: 'Output prediction practice.', path: '/javascript/trivia/js-var-hoisting-shadowing-output' },
      { label: 'Notification toast system design', description: 'Components and data flow for a notification panel.', path: '/system-design/notification-toast-system' },
      { label: 'Infinite scroll list system design', description: 'Bounded rendering of a growing list.', path: '/system-design/infinite-scroll-list' },
    ],
  },
  sources: {
    kicker: 'Public interview reports and official context',
    title: 'Sources and evidence limits',
    intro: 'These links support the public context used by the guide. Their notes state what each source can and cannot establish about preparation.',
    items: [
      { label: SERVICENOW_MEDIUM_2025_LABEL, url: SERVICENOW_MEDIUM_2025_URL, note: 'One self-reported software engineer (UI) loop without an offer. It establishes the map polyfill, output prediction, loop counters, polyfills with edge cases and the Map versus Object discussion; it cannot establish exact wording or the current format.', kind: 'report' },
      { label: SERVICENOW_BLIND_STAFF_2021_LABEL, url: SERVICENOW_BLIND_STAFF_2021_URL, note: 'A candidate asking about a staff phone screen. One reply from a ServiceNow-badged user lists medium real-world problems, implementing a virtual DOM, implementing built-in prototype methods and a UI design and data flow round; the outcome is not reported.', kind: 'report' },
      { label: SERVICENOW_BLIND_SENIOR_2021_LABEL, url: SERVICENOW_BLIND_SENIOR_2021_URL, note: 'A candidate asking about a frontend-leaning senior phone screen. Replies tagged as employees advise JavaScript fundamentals over React or Angular because of an in-house framework, plus problem-solving questions; no exact questions are reported.', kind: 'report' },
      { label: 'Public thread: ServiceNow rounds for a front-end focused engineer, Amsterdam, October 2022', url: SERVICENOW_BLIND_AMS_2022_URL, note: 'A mid-level candidate describing a recruiter call and a competency-based hiring manager round, with two technical sessions still to come per the recruiter; one commenter says ServiceNow uses HackerRank, and replies mention design patterns and medium algorithms. The outcome is not reported.', kind: 'report' },
      { label: SERVICENOW_BLIND_IC2_2025_LABEL, url: SERVICENOW_BLIND_IC2_2025_URL, note: 'A candidate listing a 45-minute behavioural and code-along round and a 90-minute panel on algorithms and system design for a UI platform team. One reply describes the hardest problems as medium string and stack questions.', kind: 'report' },
      { label: 'LeetCode Discuss: ServiceNow senior frontend developer interview experience, February 2026', url: SERVICENOW_LEETCODE_2026_URL, note: 'Public search previews list a nested comments design, an autocomplete with loading and empty states, a notification panel design, rendering one hundred thousand messages and two medium algorithm problems. The full report could not be read by our tools, so nothing else from it is used.', kind: 'report' },
      { label: 'ServiceNow careers', url: 'https://careers.servicenow.com/', note: 'Official roles and teams for product context only, not evidence of interview content or format.', kind: 'official' },
    ],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full ServiceNow practice set',
    copy:
      'This public guide is complete enough to plan a focused week. Premium unlocks the map polyfill, the DOM renderer and the broader company-tagged editorial set.',
    buttonLabel: 'Unlock the full ServiceNow practice set',
    src: 'company_preview_servicenow',
  },
  about: [
    'ServiceNow frontend interview preparation',
    'JavaScript polyfills and closures',
    'Virtual DOM rendering',
    'UI component design and data flow',
  ],
  indexAnchorLabel: 'ServiceNow frontend interview questions',
};
