import type { AuthoredCompanyPreview } from './authored-company-preview.model';

/**
 * Meta frontend interview guide. Every prompt is a FrontendAtlas practice version modelled on rounds
 * described in public, self-reported front end accounts (Taro, Medium and Blind, 2021 to 2025) and on
 * the process Meta publishes on its own hiring pages. Nothing here is a leaked, confirmed or official
 * Meta question, and accounts that mostly describe the initial screen cannot establish a fixed loop.
 */
const META_LONDON_2021_URL =
  'https://www.jointaro.com/interviews/companies/meta/experiences/front-end-developer-intern-london-england-december-1-2021-no-offer-positive-4f6ff45b/';
const META_LONDON_2021_LABEL = 'Public report: Meta front end developer intern, London, December 2021';
const META_INTERN_2022_URL =
  'https://www.jointaro.com/interviews/companies/meta/experiences/front-end-engineer-intern-united-states-january-1-2022-accepted-offer-positive-2e0f20e4/';
const META_INTERN_2022_LABEL = 'Public report: Meta front end engineer intern offer, United States, January 2022';
const META_SAN_FRANCISCO_2024_URL =
  'https://www.jointaro.com/interviews/companies/meta/experiences/front-end-developer-san-francisco-ca-june-27-2024-no-offer-positive-07526bae/';
const META_SAN_FRANCISCO_2024_LABEL = 'Public report: Meta front end developer first round, San Francisco, June 2024';
const META_NEW_YORK_2025_URL =
  'https://www.jointaro.com/interviews/companies/meta/experiences/frontend-engineer-new-york-ny-april-1-2025-no-offer-positive-ae322f20/';
const META_NEW_YORK_2025_LABEL = 'Public report: Meta frontend engineer technical screen, New York, April 2025';
const META_MEDIUM_2022_URL = 'https://medium.com/@stylus07/meta-interview-experience-cdf53eea63f3';
const META_MEDIUM_2022_LABEL = 'Public report: Meta front end engineer interview experience, March 2022';
const META_BLIND_LIST_2021_URL =
  'https://www.teamblind.com/post/Went-through-Frontend-Interviews-recently-here-are-the-kinda-questions-they-ask-dbyQb3ob';
const META_BLIND_LIST_2021_LABEL = 'Public report: front end interview questions by company, Blind, October 2021';
const META_BLIND_DESIGN_2022_URL = 'https://www.teamblind.com/post/meta-frontend-system-design-yexyrusi';
const META_BLIND_DESIGN_2022_LABEL = 'Public report: Meta frontend system design round, Blind, March 2022';
const META_HIRING_PROCESS_URL = 'https://www.metacareers.com/hiring-process/';
const META_FEE_INITIAL_URL = 'https://www.metacareers.com/FEE-prep-initial/';

export const META_PREVIEW_TITLE = 'Meta Frontend Interview Questions: 7 Prompts + Prep Guide';
export const META_PREVIEW_H1 = 'Meta Frontend Interview Questions';
export const META_PREVIEW_DESCRIPTION =
  'Prepare for a Meta front end engineer interview with 7 practice prompts: map from scratch, clearAllTimeout, memoization, DOM traversal, autocomplete design.';
export const META_PREVIEW_CANONICAL_PATH = '/companies/meta/preview';
export const META_PREVIEW_TRUST_NOTE =
  'These are FrontendAtlas practice versions modelled on rounds described in public interview reports and on Meta\'s own hiring pages, not leaked, confirmed or official Meta questions. Self-reported screens and loops from 2021 to 2025 cannot establish a fixed format; use recruiter-provided material as the source of truth.';

export const META_COMPANY_PREVIEW: AuthoredCompanyPreview = {
  slug: 'meta',
  label: 'Meta',
  title: META_PREVIEW_TITLE,
  h1: META_PREVIEW_H1,
  description: META_PREVIEW_DESCRIPTION,
  canonicalPath: META_PREVIEW_CANONICAL_PATH,
  trustNote: META_PREVIEW_TRUST_NOTE,
  hero: {
    kicker: 'Public Meta prep guide',
    subtitle:
      'Prepare with seven practice prompts shaped by Meta\'s own hiring pages and seven public interview accounts from 2021 to 2025: implementing map from scratch, your own clearAllTimeout, a memoize helper, the matching node in a twin DOM tree, a DOM traversal that collects nodes, a stack and a queue in JavaScript, and the front-end design of an autocomplete component.',
    caveat:
      'This guide uses public, self-reported interview accounts and Meta\'s published hiring pages to create realistic constraints. It does not claim access to private interview material. Most accounts describe the initial screen rather than a full loop, so the loop shape comes from Meta\'s pages, not from the reports.',
    chips: ['7 practice prompts', 'Vanilla JavaScript, DOM, async, component design', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'Prepare for product judgment, not Meta trivia',
    paragraphs: [
      'Meta\'s front end track is its own thing. Every public account describes plain JavaScript and DOM work rather than framework tasks: implementing built-ins such as map, writing timer and memoization utilities, walking DOM trees, and keeping a store keyed by elements. Meta\'s page for the initial Front End Engineer interview describes a 60-minute conversation with an engineer that assesses technical and behavioural skills, with a downloadable guide written by its front end engineers. Its hiring process page adds that many technical interviews now run in CoderPad with a built-in AI assistant that candidates are expected to use, and that outside AI tools are not authorised.',
      'Two lessons repeat. The screens are short and move fast: the March 2022 account ran out of time on a DOM store, and the April 2025 screen ended with two unfinished problems, so practise writing utilities from memory rather than describing them. And the design round is about a component, not a product: the March 2022 Blind account prepared to design the front end of Facebook or Instagram and was asked for an autocomplete instead. Each prompt below starts with the clarifying questions a strong candidate asks, then the behaviours a strong answer covers, then the miss that usually ends the round.',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked October 2026',
    title: 'What the official pages and the public accounts establish, and what you still need to confirm',
    paragraphs: [
      'Meta\'s pages establish the shape: a recruiter conversation, an initial screening and a full loop, with sample tasks described as writing code, solving algorithms or creating a case study; a 60-minute initial Front End Engineer interview; a practice session in the interview tool through the Career Profile; and an AI-native coding interview in CoderPad that offers Claude, ChatGPT, Gemini and Meta\'s models, with design interviews in the same tool using Mermaid markdown. Seven self-reported accounts add the exercises. A December 2021 London intern account reports a recruiter screen on closures, stacks, queues, arrow functions and this, then a coding round that asked to implement map from scratch and to traverse up a DOM tree and replicate the traversal on a similar tree. A January 2022 intern account with an offer reports a recruiter chat on closures and var, let and const, then two technical video calls whose questions matched BigFrontend, including your own clearAllTimeout. A March 2022 Medium account reports a first technical interview with a DOM store class keyed by elements and a memoization problem, neither finished in fifty minutes.',
      'A June 2024 San Francisco account reports a first round on how to implement a stack or a queue in JavaScript. An April 2025 New York screen reports inserting a node into a circular linked list and a tree check on children sums, with no time to finish. An October 2021 Blind list from a candidate who interviewed at several companies records the Facebook screen as flattening an array, a timeout clearer and a map class, the onsite as HTML, CSS and JavaScript plus a DOM traversal that collects nodes, and a typeahead component as the design prompt. A March 2022 Blind account from an L5 candidate describes two DOM-traversal-style coding rounds, a behavioural round and a design round that asked for a specific component such as an autocomplete, failed after preparing product-level designs. Together they establish that these exercise types occurred; they do not establish exact wording, the current format, or how many rounds a given level gets. Confirm the round count, the tool, the AI assistant rules and the design scope with the recruiter.',
    ],
  },
  roleLenses: {
    kicker: 'Role lenses',
    title: 'Two skill areas for practising transferable frontend judgment',
    intro:
      'These are preparation lenses derived from the public prompts, not claimed team assignments. The accounts describe the same two areas at every level; keep the reasoning framework-neutral.',
    items: [
      {
        title: 'Utilities and built-ins',
        description:
          'Small functions that stand in for the language and the platform: map, timers, memoization, and stores keyed by objects.',
        practiceFocus:
          'Writing from memory, correct this and argument handling, cleanup of timers, cache keys and invalidation.',
      },
      {
        title: 'DOM structure and components',
        description:
          'Trees of nodes, traversals that keep a path, and components such as autocomplete that combine input, network and list state.',
        practiceFocus:
          'Iterative and recursive traversals, stable ordering, debouncing, caching, keyboard access and failure states.',
      },
    ],
  },
  prompts: {
    kicker: 'Representative practice prompts',
    title: 'Seven Meta frontend interview practice questions',
    intro:
      'For each prompt, clarify the contract, explain ownership and trade-offs, implement or diagram the smallest credible slice, and test the failure cases. Each prompt links to the public report it is modelled on and to a practice page.',
    itemListName: 'Seven Meta frontend interview practice prompts',
    items: [
      {
        id: 'implement-map-from-scratch',
        title: 'Implement Array.prototype.map from scratch',
        statement:
          'Write a map function with the same contract as the built-in: the callback receives the element, the index and the array, this inside the callback can be set, and sparse slots stay sparse.',
        whatThisMeasures:
          'Knowing the real contract of a built-in, handling this and holes correctly, leaving the input untouched, and the discipline to test the edges you did not think of first.',
        clarifyFirst: [
          'Confirm whether the function lives on the prototype or stands alone, and whether sparse arrays must be preserved.',
          'Confirm whether a thisArg must be supported and what happens when the callback is not a function.',
        ],
        strongAnswer: [
          'Loop by index with the in operator so holes are skipped and preserved rather than filled with undefined.',
          'Call the callback with element, index and array, applying the optional thisArg with call.',
          'Return a new array of the same length without touching the input.',
          'Test an empty array, a sparse array, a callback that uses the index and a thisArg.',
        ],
        commonMiss:
          'Using forEach or push inside the implementation, so holes collapse and the length changes.',
        resourceLabel: 'Practice Array.prototype.map (Premium)',
        resourcePath: '/javascript/coding/js-array-prototype-map',
        reportedRound: { label: META_LONDON_2021_LABEL, url: META_LONDON_2021_URL },
      },
      {
        id: 'clear-all-timeout',
        title: 'Implement your own clearAllTimeout',
        statement:
          'Wrap setTimeout so every pending timer is tracked, then write clearAllTimeout so one call cancels all of them, including the right handling of timers that already fired or were cleared one by one.',
        whatThisMeasures:
          'Wrapping a platform API without breaking its contract, tracking and releasing handles, and reasoning about timers that fire, are cleared or are scheduled during the clear.',
        clarifyFirst: [
          'Confirm whether the original setTimeout must keep its signature and return value, and whether intervals are in scope.',
          'Confirm whether timers scheduled while clearing should be cancelled too.',
        ],
        strongAnswer: [
          'Keep a Set of ids: add on schedule, delete when the callback runs or when clearTimeout is called for one id.',
          'Preserve the arguments and the return value of the native functions so existing code keeps working.',
          'Iterate a copy of the set while clearing so re-entrant scheduling cannot loop forever.',
          'Test a fired timer, a manually cleared timer and a clear called twice.',
        ],
        commonMiss:
          'Storing ids in an array that is never pruned, so cleared timers leak and clearAllTimeout grows with every call.',
        resourceLabel: 'Practice the timer manager (Premium)',
        resourcePath: '/javascript/coding/js-timer-manager',
        reportedRound: { label: META_INTERN_2022_LABEL, url: META_INTERN_2022_URL },
      },
      {
        id: 'memoize-with-cache-keys',
        title: 'Write a memoize helper and defend its cache key',
        statement:
          'Write memoize(fn) so repeated calls with the same arguments return the cached result, then explain how the key is built, when the cache is invalid and how memory stays bounded.',
        whatThisMeasures:
          'Closures, argument-to-key mapping, the difference between identity and value equality, and awareness of memory growth and invalidation.',
        clarifyFirst: [
          'Confirm the argument types: primitives only, objects by identity, or deep equality.',
          'Confirm whether the cache needs a size limit, a custom resolver or a way to clear it.',
        ],
        strongAnswer: [
          'Return a closure over a Map and build the key from the arguments with an explicit resolver instead of String(args).',
          'Use a nested Map or a WeakMap for object arguments so identity is respected and objects can be collected.',
          'Forward this and every argument, and decide deliberately whether thrown errors are cached.',
          'Mention a bound or an LRU policy when the input space is open-ended.',
        ],
        commonMiss:
          'Joining the arguments into a string, so two different objects share one key and the cache returns the wrong result.',
        resourceLabel: 'Practice memoization (Premium)',
        resourcePath: '/javascript/coding/js-memoize-function',
        reportedRound: { label: META_MEDIUM_2022_LABEL, url: META_MEDIUM_2022_URL },
      },
      {
        id: 'twin-dom-tree-node',
        title: 'Find the corresponding node in a twin DOM tree',
        statement:
          'Given two DOM trees with the same structure and a node in the first, return the node at the same position in the second. Walk up from the node to record the path, then replay it in the other tree.',
        whatThisMeasures:
          'Tree navigation with parentNode and children, recording a path as indices, replaying it, and handling the root and detached nodes.',
        clarifyFirst: [
          'Confirm whether the trees are structurally identical and whether text nodes count as children.',
          'Confirm whether the node may be the root or may not belong to the first tree at all.',
        ],
        strongAnswer: [
          'Walk up with parentNode, pushing the index of each node among its parent\'s children.',
          'Replay the recorded indices from the root of the second tree to reach the twin.',
          'Use children rather than childNodes when text nodes are excluded, and say why.',
          'Test the root, a leaf, and a node that is not in the first tree.',
        ],
        commonMiss:
          'Searching the second tree by tag name or text, which breaks as soon as two siblings look alike.',
        resourceLabel: 'Practice the twin DOM node (Premium)',
        resourcePath: '/javascript/coding/js-dom-twin-node',
        reportedRound: { label: META_LONDON_2021_LABEL, url: META_LONDON_2021_URL },
      },
      {
        id: 'traverse-dom-collect-nodes',
        title: 'Traverse the DOM and collect the nodes that match',
        statement:
          'Walk a DOM subtree and return every node that satisfies a predicate, in document order, without querySelectorAll. Then adapt it to breadth-first order and to a store keyed by node.',
        whatThisMeasures:
          'Depth-first and breadth-first traversal, document order, stack versus queue, and using Map or WeakMap to associate data with nodes.',
        clarifyFirst: [
          'Confirm whether the root itself counts, whether text nodes are included and which order the caller expects.',
          'Confirm the size of the tree, which decides between recursion and an explicit stack.',
        ],
        strongAnswer: [
          'Use an explicit stack for depth-first order, pushing children in reverse so document order is preserved.',
          'Use a queue for breadth-first order and show the one-line difference.',
          'Keep the predicate separate from the traversal so the same walker serves find, collect and count.',
          'For a store keyed by nodes, use a Map or a WeakMap rather than a string derived from the element.',
        ],
        commonMiss:
          'Keying a store by String(element), so every element collapses to the same key, the miss the March 2022 account describes.',
        resourceLabel: 'Practice finding a node in a DOM tree (Premium)',
        resourcePath: '/javascript/coding/js-dom-find-node',
        reportedRound: { label: META_BLIND_LIST_2021_LABEL, url: META_BLIND_LIST_2021_URL },
      },
      {
        id: 'stack-and-queue-in-javascript',
        title: 'Implement a stack and a queue in JavaScript, then clear a short algorithm screen',
        statement:
          'Explain and implement a stack and a queue with constant-time operations, then be ready for a short algorithm problem such as inserting into a circular linked list or checking a tree property.',
        whatThisMeasures:
          'Data structure fundamentals in plain JavaScript, the cost of shift on arrays, pointer handling in linked structures, and pace under a short screen.',
        clarifyFirst: [
          'Confirm the required operations and whether the queue must be constant time on dequeue.',
          'Confirm the input representation for the algorithm problem before coding: node shape, empty list, single node.',
        ],
        strongAnswer: [
          'Back the stack with an array and push and pop; back the queue with two stacks or a linked list so dequeue is not shift.',
          'Write the edge cases first: empty, one element, and wrap-around for a circular list.',
          'State the complexity of every operation as you write it.',
          'Keep the code small and finish; the 2025 screen ended with two unfinished problems.',
        ],
        commonMiss:
          'Using Array.prototype.shift for dequeue and calling it constant time.',
        resourceLabel: 'Practice stack and queue (Premium)',
        resourcePath: '/javascript/coding/js-stack-queue-implementation',
        reportedRound: { label: META_SAN_FRANCISCO_2024_LABEL, url: META_SAN_FRANCISCO_2024_URL },
      },
      {
        id: 'autocomplete-component-design',
        title: 'Design an autocomplete component, not the front end of a product',
        statement:
          'Design a typeahead that queries a server as the user types: input handling, debouncing, request cancellation, caching, result rendering, keyboard navigation and failure states. Keep the scope to the component.',
        whatThisMeasures:
          'Component-level front-end design: state ownership, network discipline, caching and invalidation, accessibility, and the judgment to stay at the right altitude.',
        clarifyFirst: [
          'Confirm the latency budget, the result size and whether results can be cached across sessions.',
          'Confirm the accessibility expectation and whether the component must work inside a form.',
        ],
        strongAnswer: [
          'Model the state: query, pending request, results, highlighted index, open or closed, error.',
          'Debounce input, cancel stale requests and ignore out-of-order responses.',
          'Cache by normalised query with a bound and an expiry, and show stale results while revalidating.',
          'Implement the combobox pattern with listbox and option roles, arrow keys, Enter and Escape.',
        ],
        commonMiss:
          'Drawing CDNs, load balancers and databases for a product while the component\'s states and network behaviour stay undefined.',
        resourceLabel: 'Work through the real-time search case (Premium)',
        resourcePath: '/system-design/realtime-search-debounce-cache',
        reportedRound: { label: META_BLIND_DESIGN_2022_LABEL, url: META_BLIND_DESIGN_2022_URL },
      },
    ],
  },
  walkthrough: {
    kicker: 'Public mini walkthrough',
    title: 'Scope clearAllTimeout before writing the first line',
    intro:
      'Treat this as a representative exercise, not a description of the reported one. Work from the contract toward the data flow, and say each decision out loud.',
    steps: [
      { title: 'Pin the contract', description: 'The wrapped setTimeout keeps its signature and return value; decide whether intervals and already-fired timers are in scope.' },
      { title: 'Choose the registry', description: 'A Set of ids, added on schedule and pruned when a callback runs or a single timer is cleared.' },
      { title: 'Decide re-entrancy', description: 'clearAllTimeout iterates a snapshot, so a callback that schedules a new timer during the clear cannot loop forever.' },
      { title: 'Test the lifecycle', description: 'A fired timer, a timer cleared once, a clear called twice, and a timer scheduled after the clear.' },
    ],
  },
  prepPlan: {
    kicker: 'Actionable preparation',
    title: 'A 7-day Meta frontend interview preparation plan',
    intro: 'Every day ends with code, a test, a design artifact, or a question you can use in the real process.',
    days: [
      { day: 'Day 1', focus: 'JavaScript fundamentals from the recruiter screens: closures, var, let and const, this, arrow functions, promises and hoisting, answered out loud in a minute each.', artifact: 'A one-page sheet with a code example per topic.' },
      { day: 'Day 2', focus: 'Built-ins from scratch: map, filter, reduce and forEach without prototype mutation, with holes and thisArg handled.', artifact: 'Four implementations with edge-case tests.' },
      { day: 'Day 3', focus: 'Timers and memoization: clearAllTimeout, a timer manager and memoize with object keys.', artifact: 'Three utilities and a note on cleanup and cache bounds.' },
      { day: 'Day 4', focus: 'DOM traversals: the twin node, collecting by predicate in both orders, and a store keyed by elements.', artifact: 'Three traversals that pass on a real DOM.' },
      { day: 'Day 5', focus: 'Data structures in JavaScript: stack, queue with constant-time dequeue, linked list insertion, tree checks.', artifact: 'Four structures with stated complexity.' },
      { day: 'Day 6', focus: 'Component design: autocomplete and typeahead with debouncing, cancellation, caching and keyboard access.', artifact: 'A one-page component design with its states and failure cases.' },
      { day: 'Day 7', focus: 'Mock screen in the interview tool: two problems in fifty minutes, written from memory, then a review of what you could not finish.', artifact: 'A list of the questions you will ask the recruiter about rounds, tools and the AI assistant rules.' },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common Meta frontend interview preparation questions',
    items: [
      { question: 'Are these the real Meta questions?', answer: 'No. They are FrontendAtlas practice versions modelled on round types described in public, self-reported accounts and on the process Meta publishes. The wording, the data and the test cases are ours.' },
      { question: 'Is the Meta front end track like the general software engineer loop?', answer: 'The accounts say no: plain JavaScript and DOM work instead of pure algorithms, with two DOM-traversal-style coding rounds in the March 2022 Blind account. Two screens from 2024 and 2025 still asked data structure questions, so keep stacks, queues, linked lists and trees warm.' },
      { question: 'What does the design round ask for?', answer: 'The two Blind accounts describe a specific component such as an autocomplete or a typeahead, not the front end of a product. Prepare state, network behaviour, caching and accessibility at component level.' },
      { question: 'Can I use an AI assistant during the interview?', answer: 'Meta\'s hiring process page says many technical interviews include a built-in assistant in CoderPad, offering Claude, ChatGPT, Gemini and Meta\'s models, and that candidates are expected to use it; outside AI tools are not authorised. The accounts in this guide predate that change, so confirm the rules for your rounds with the recruiter.' },
      { question: 'Where do the public questions come from?', answer: 'Two accounts say the screen questions matched BigFrontend, and two say they were listed on Glassdoor. Treat such lists as shapes to practise, not as the questions you will get.' },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Build the underlying skills with free practice',
    intro:
      'These public pages cover the built-in, closure, debounce, cache, data structure and DOM skills used by the practice prompts. They are supporting drills, not claimed Meta questions.',
    items: [
      { label: 'Flatten one level', description: 'Flattening an array, listed in the October 2021 Blind screen.', path: '/javascript/coding/js-flatten-once' },
      { label: 'Implement arrayForEach without prototype mutation', description: 'The built-in warm-up before map.', path: '/javascript/coding/js-array-foreach' },
      { label: 'Debounce function', description: 'The network discipline behind the autocomplete design.', path: '/javascript/coding/js-debounce' },
      { label: 'Create an LRU cache', description: 'A bounded cache for memoization and typeahead results.', path: '/javascript/coding/js-create-lru-cache' },
      { label: 'Create a counter function', description: 'Closures, the first recruiter screen topic in two accounts.', path: '/javascript/coding/js-create-counter' },
      { label: 'Stack vs queue in JavaScript', description: 'The data structure question in the June 2024 account.', path: '/javascript/trivia/js-queue-vs-stack' },
      { label: 'DOM tree structure and depth', description: 'The vocabulary for the traversal prompts.', path: '/html/trivia/html-dom-tree-structure' },
      { label: 'Infinite scroll system design', description: 'A free component-level design case in the same style.', path: '/system-design/infinite-scroll-list' },
    ],
  },
  sources: {
    kicker: 'Public interview reports and official context',
    title: 'Sources and evidence limits',
    intro: 'These links support the public context used by the guide. Their notes state what each source can and cannot establish about preparation.',
    items: [
      { label: 'Meta: hiring process', url: META_HIRING_PROCESS_URL, note: 'The stages, the practice session in the interview tool, the AI-native coding interview rules and the supported languages. It names no exercises.', kind: 'official' },
      { label: 'Meta: preparing for your initial Front End Engineer interview', url: META_FEE_INITIAL_URL, note: 'A 60-minute conversation with an engineer that assesses technical and behavioural skills, with a downloadable guide; official context only.', kind: 'official' },
      { label: META_LONDON_2021_LABEL, url: META_LONDON_2021_URL, note: 'One self-reported intern process without an offer. It establishes the recruiter screen topics, implementing map from scratch and the twin tree traversal; it cannot establish wording or frequency.', kind: 'report' },
      { label: META_INTERN_2022_LABEL, url: META_INTERN_2022_URL, note: 'One self-reported intern process with an offer. It establishes a recruiter chat on fundamentals, two technical calls and your own clearAllTimeout; it names no other exercise.', kind: 'report' },
      { label: META_MEDIUM_2022_LABEL, url: META_MEDIUM_2022_URL, note: 'One self-reported first technical interview without a pass. It establishes the DOM store class keyed by elements and the memoization problem, and that both ran out of time in about fifty minutes.', kind: 'report' },
      { label: META_SAN_FRANCISCO_2024_LABEL, url: META_SAN_FRANCISCO_2024_URL, note: 'One self-reported first round without a pass. It establishes a data structure conversation on stacks and queues in JavaScript; it names no other exercise.', kind: 'report' },
      { label: META_NEW_YORK_2025_LABEL, url: META_NEW_YORK_2025_URL, note: 'One self-reported technical screen without a pass. It establishes a circular linked list insertion and a tree check, both unfinished in the time given; it describes no later round.', kind: 'report' },
      { label: META_BLIND_LIST_2021_LABEL, url: META_BLIND_LIST_2021_URL, note: 'A list compiled by one candidate who interviewed at several companies. It records the Facebook screen, onsite and typeahead design prompt in a few words each; it cannot establish wording or frequency.', kind: 'report' },
      { label: META_BLIND_DESIGN_2022_LABEL, url: META_BLIND_DESIGN_2022_URL, note: 'One self-reported L5 loop without an offer. It establishes two DOM-traversal-style coding rounds and a component-level design round such as an autocomplete; the replies add general advice only.', kind: 'report' },
    ],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full Meta practice set',
    copy:
      'This public guide is complete enough to plan a focused week. Premium unlocks the map, timer manager, memoization, twin DOM node, DOM find and stack and queue drills, the real-time search case and the broader company-tagged editorial set.',
    buttonLabel: 'Unlock the full Meta practice set',
    src: 'company_preview_meta',
  },
  about: [
    'Meta front end engineer interview preparation',
    'JavaScript built-ins and utilities from scratch',
    'DOM tree traversal exercises',
    'Autocomplete component front-end design',
    'Timer and memoization helpers',
  ],
  indexAnchorLabel: 'Meta frontend interview questions',
};
