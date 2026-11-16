import type { AuthoredCompanyPreview } from './authored-company-preview.model';

/**
 * Meta frontend interview guide. The reported questions live with the process table (company-interview-processes.ts);
 * the seven prompts here are the answer guides of seven of them, the first one open. The rounds come from Meta's
 * hiring process page and its two Front End Engineer prep pages with the guides they link to; the questions come from
 * candidates' own posts on Taro, Blind and Medium from 2020 to 2025, re-read in November 2026. Nothing here is a
 * leaked, confirmed or official Meta question.
 */
const META_LONDON_2021_URL =
  'https://www.jointaro.com/interviews/companies/meta/experiences/front-end-developer-intern-london-england-december-1-2021-no-offer-positive-4f6ff45b/';
const META_LONDON_2021_LABEL = 'Public report: Meta front end developer intern, December 2021 (Taro, approximate date)';
const META_INTERN_2022_URL =
  'https://www.jointaro.com/interviews/companies/meta/experiences/front-end-engineer-intern-united-states-january-1-2022-accepted-offer-positive-2e0f20e4/';
const META_INTERN_2022_LABEL = 'Public report: Meta front end engineer intern offer, January 2022 (Taro, approximate date)';
const META_SAN_FRANCISCO_2024_URL =
  'https://www.jointaro.com/interviews/companies/meta/experiences/front-end-developer-san-francisco-ca-june-27-2024-no-offer-positive-07526bae/';
const META_SAN_FRANCISCO_2024_LABEL = 'Public report: Meta front end developer first round, June 2024';
const META_NEW_YORK_2025_URL =
  'https://www.jointaro.com/interviews/companies/meta/experiences/frontend-engineer-new-york-ny-april-1-2025-no-offer-positive-ae322f20/';
const META_NEW_YORK_2025_LABEL = 'Public report: Meta frontend engineer technical screen, April 2025 (Taro, approximate date)';
const META_MEDIUM_2022_URL = 'https://medium.com/@stylus07/meta-interview-experience-cdf53eea63f3';
const META_MEDIUM_2022_LABEL = 'Public report: Meta front end engineer interview experience, March 2022';
const META_BLIND_LIST_2021_URL =
  'https://www.teamblind.com/post/Went-through-Frontend-Interviews-recently-here-are-the-kinda-questions-they-ask-dbyQb3ob';
const META_BLIND_LIST_2021_LABEL = 'Public report: front end interview questions by company, Blind, October 2021';
const META_BLIND_DESIGN_2022_URL = 'https://www.teamblind.com/post/meta-frontend-system-design-yexyrusi';
const META_BLIND_DESIGN_2022_LABEL = 'Public report: Meta frontend system design round, Blind, March 2022';
const META_HIRING_PROCESS_URL = 'https://www.metacareers.com/hiring-process/';
const META_FEE_INITIAL_URL = 'https://www.metacareers.com/FEE-prep-initial/';
const META_FEE_ONSITE_URL = 'https://www.metacareers.com/FEE-prep-onsite/';

export const META_PREVIEW_TITLE = 'Meta Frontend Interview Questions: {#questions} Reported + Prep Guide';
export const META_PREVIEW_H1 = 'Meta Frontend Interview Questions';
export const META_PREVIEW_DESCRIPTION =
  'Meta front end engineer interview: the recruiter call, the JavaScript screen, the loop\'s coding, design and behavioural rounds, and {#questions} reported questions.';
export const META_PREVIEW_CANONICAL_PATH = '/companies/meta/preview';
export const META_PREVIEW_TRUST_NOTE =
  'Every reported question on this page was posted by a Meta front end candidate on Taro, Blind or Medium between 2020 and 2025 and is retold in our words, and FrontendAtlas wrote the answer guides. Meta\'s own guides set out the rounds with a few example questions, one of which a 2025 account reports in nearly the same words, and what your recruiter says about your loop outranks both.';

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
      'Meta\'s own pages lay out the Front End Engineer process: a recruiter call, a JavaScript screen with one engineer, then a loop of coding, UI architecture and design, and behavioural interviews. Candidates\' posts from 2020 to 2025 report {questions} questions, listed after the rounds; the first, writing JavaScript\'s map from scratch in a 2021 internship round, is open to all.',
    caveat:
      'Most of the accounts are from 2021 and 2022, and several candidates said their questions matched or resembled ones already posted online. Meta\'s hiring page now describes an AI assistant in CoderPad for select roles while its front end guides rule out AI tools, so ask your recruiter which rules your rounds follow.',
    chips: ['{#questions} reported questions', '{#reports} public reports, 2020–2025', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'What Meta front end rounds reward: plain JavaScript and DOM code, written from memory against the clock',
    paragraphs: [
      'Most coding questions in the accounts are plain JavaScript with no framework: built-ins such as map rewritten by hand, small utilities such as clearAllTimeout, memoization and an event emitter, a hash map class and a store keyed by DOM elements, and DOM walks that record a path or collect nodes. Meta\'s full loop guide asks for JavaScript and rules out dynamic programming, and a 2021 internship candidate was told to expect no React. Classic algorithm problems still came up: islands in a grid in a 2020 loop, a matrix class in 2021, and a circular linked list and a tree check in a 2025 screen.',
      'Two screens ended on the clock: the March 2022 candidate was stopped after 50 minutes without doing well on either problem, and the April 2025 candidate could not finish two problems in time. Several candidates said their questions matched or resembled ones on Glassdoor or BigFrontend, so practise the reported ones until you can write them without notes. Prepare the design round one component at a time as well as product by product: the 2022 L5 candidate had prepared the front end of systems such as Facebook or Instagram and was asked for a single component, such as an autocomplete, instead.',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked November 2026',
    title: 'What Meta\'s pages set out, and what the candidates\' posts add',
    paragraphs: [
      'Meta\'s hiring process page describes a recruiter conversation, an initial screening and a full loop over about 2 to 3 months, a practice session in the interview tool, and an AI assistant in CoderPad that select roles now use. Meta\'s Front End Engineer pages describe a 60-minute initial interview with an engineer and a loop of at least three conversations, and the guides they link to give a 45-minute screen, 4 to 6 loop interviews with the coding in JavaScript, a 45-minute design interview without code and a 45-minute behavioural interview. The pages were re-read in November 2026; the guides were read in October and November 2026.',
      '{reports} candidate accounts describe the rounds and supply the questions: posts on Taro, Blind and Medium from 2020 to 2025, most of them from 2021 and 2022 and a few from internship processes. Taro gives many of its accounts the 1st of a month as their date, so those months are approximate; several posts end at the screen, and none mentions the AI assistant. Ask your recruiter how many interviews your level gets, which tool and language each one uses, and whether the AI assistant applies to you.',
    ],
  },
  // The behavioural row of the process table links here. Meta's Front End interview guide (a PDF downloaded from the
  // full loop prep page, read 2026-11-09) describes the round; the accounts are the ones that row cites.
  roundSpotlights: [
    {
      id: 'behavioural',
      kicker: 'Round decoder',
      title: 'Meta behavioural interview for front end engineers: the five signals and what was asked',
      lede: [
        'Meta\'s front end full loop includes one behavioural interview beside the coding and design rounds. Meta\'s Front End interview guide describes a 45-minute session about your background, what you care about in tech and the impact you want to make, held to see whether you will thrive in a "fast-paced and highly unstructured environment".',
        'The guide names the five signals it assesses: resolving conflict, growing continuously, embracing ambiguity, driving results and communicating effectively. Front end accounts add what came up in practice: previous projects, debugging stories and past UI challenges.',
      ],
      facts: [
        { label: 'Where it comes', value: 'One 45-minute interview among the 4 to 6 of the full loop, in Meta\'s guide. A 2020 account had one behavioural interview among four 45-minute interviews, a 2021 E4 (IC4) onsite had two, and a 2025 account with an offer had a final round that mixed light HTML and CSS coding with behavioural questions.' },
        { label: 'The five signals', value: 'Resolving conflict: disagreements with colleagues or managers, how you resolved them, and empathy for very different views. Growing continuously: seeking ways to learn, and taking criticism as a chance to improve. Embracing ambiguity: deciding while information is missing, and pivoting when priorities shift. Driving results: pushing yourself and others to deliver against goals despite roadblocks. Communicating effectively: with your team and with cross-functional partners, adapted to the audience.' },
        { label: 'What you may be asked', value: 'Meta\'s guide lists the details of past and current projects, specific examples of what you did and its impact, what you learned from a past situation, and what you like about your role or about being a developer.' },
        { label: 'Asked in front end accounts', value: 'Debugging stories and past UI challenges (Taro, 2025, with an offer); conflict resolution and how it shaped the way the candidate handles project work, in a round the account does not name (Taro, November 2024, with an offer); previous experiences, in a round the candidate found easier for that reason (Taro, 2020). A 2022 Blind candidate for a senior role (posted as L5) was told the behavioural interview went well and the design round did not.' },
        { label: 'How Meta says to prepare', value: 'Review your résumé and outline two or three major projects to discuss in depth; be honest about projects that did not go well, which the guide says is not counted against you; organise each answer as the situation, your task, your actions and a measurable result; and give concrete examples, since the interviewer steers a theoretical answer back to a concrete one.' },
        { label: 'Sources', value: 'Meta\'s Front End interview guide, downloadable from its full loop preparation page, and front end accounts on Taro and Blind from 2020 to 2025; all are on the behavioural row of the process table.' },
      ],
      practiceLink: { label: 'Draft your stories with the STAR stories guide', path: '/guides/behavioral/stories' },
      processLink: { label: 'See the behavioural row in the reported process', fragment: 'meta-interview-process-1-stage-full-loop-behavioural' },
      // One question per signal of the guide, written from its description, then the two topics a 2025 account names.
      drill: {
        note: 'Six questions are written from the signals in Meta\'s guide, two follow what a 2025 account reports, and the last is the guide\'s own question about what you care about in tech.',
        questions: [
          { id: 'disagreement', text: 'Tell me about a disagreement with a colleague or a manager. How did you resolve it?', source: 'Meta\'s guide: resolving conflict' },
          { id: 'criticism', text: 'Tell me about criticism you received and what you changed after it.', source: 'Meta\'s guide: growing continuously' },
          { id: 'pivot', text: 'Tell me about a time you had to pivot away from a project because priorities shifted.', source: 'Meta\'s guide: embracing ambiguity' },
          { id: 'missing-information', text: 'Tell me about a decision you made while information was missing.', source: 'Meta\'s guide: embracing ambiguity' },
          { id: 'roadblock', text: 'Tell me about a goal you reached despite a roadblock.', source: 'Meta\'s guide: driving results' },
          { id: 'audience', text: 'Tell me about adapting how you explained your work to a cross-functional partner.', source: 'Meta\'s guide: communicating effectively' },
          { id: 'debugging', text: 'Tell me about a bug you had to debug.', source: 'Taro, 2025' },
          { id: 'ui-challenge', text: 'Tell me about a UI challenge in a past project.', source: 'Taro, 2025' },
          { id: 'impact', text: 'What are you passionate about in tech, and what impact do you want to make?', source: 'Meta\'s guide', kind: 'view' },
        ],
        checks: [
          'It shows the signal the question asks about.',
          'It is a concrete example, not a theory: the interviewer asks for one.',
          'I have two or three major projects outlined to discuss in depth.',
        ],
      },
    },
  ],
  roleLenses: {
    kicker: 'Role lenses',
    title: 'Language utilities and the DOM: the two kinds of code the Meta questions ask for',
    intro:
      'No Meta front end account names a team or a product area, so these lenses sort the reported questions by the code they call for, not by where you would work.',
    items: [
      {
        title: 'Language and utility code',
        description:
          'Built-ins rewritten by hand, timer and caching utilities, an event emitter, a hash map class and a store keyed by DOM elements: code that stands in for the language and the platform.',
        practiceFocus:
          'The exact contract of each built-in, forwarding this and the arguments, cleaning up timers and listeners, object identity as a key, and finishing inside the screen\'s time.',
      },
      {
        title: 'DOM structure and components',
        description:
          'Walks up and down the DOM, a DOM built from JSON, and design rounds about one component such as an autocomplete, or about a messaging front end.',
        practiceFocus:
          'Recording and replaying a path, document order, building nodes with the native API, and the states, data flow and failure cases of a single component.',
      },
    ],
  },
  prompts: {
    kicker: 'Answer guides',
    title: 'Answer guides for the reported Meta questions',
    intro:
      'FrontendAtlas\'s answer guides for {prompts} of the reported questions, each starting from what to ask the interviewer and ending with a common miss.',
    itemListName: 'Meta frontend interview answer guides',
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
          'The 2021 account names this onsite task only as traversing the DOM and collecting nodes; practise the general form: walk a subtree and return the nodes that satisfy a predicate, in document order, without querySelectorAll, then repeat the walk breadth-first.',
        whatThisMeasures:
          'Depth-first and breadth-first traversal, document order, and the choice between a stack and a queue.',
        clarifyFirst: [
          'Confirm whether the root itself counts, whether text nodes are included and which order the caller expects.',
          'Confirm the size of the tree, which decides between recursion and an explicit stack.',
        ],
        strongAnswer: [
          'Use an explicit stack for depth-first order, pushing children in reverse so document order is preserved.',
          'Use a queue for breadth-first order and show the one-line difference.',
          'Keep the predicate separate from the traversal so the same walker serves find, collect and count.',
          'Test an empty subtree, a root that matches, deep nesting, and text nodes when they count.',
        ],
        commonMiss:
          'Pushing children onto the stack in their natural order, so the collected nodes come back out of document order.',
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
          'Keep the code small and finish; the 2025 candidate could not complete the screen\'s questions in the time given.',
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
    kicker: 'Mini walkthrough',
    title: 'Settle what map promises before you write it',
    intro:
      'The open question, from a 2021 London internship round, asks for JavaScript\'s map without the built-in. Four decisions to say aloud before typing, each one a case your tests should cover.',
    steps: [
      { title: 'Name what the callback receives', description: 'The element, its index and the array itself, with an optional second argument that sets this inside the callback.' },
      { title: 'Keep empty slots empty', description: 'Check each index with the in operator, so a sparse array comes back sparse instead of filled with undefined.' },
      { title: 'Return a new array', description: 'Create the result at the input\'s length and never write to the input.' },
      { title: 'Test the four cases', description: 'An empty array, a sparse array, a callback that reads the index, and a thisArg.' },
    ],
  },
  prepPlan: {
    kicker: 'Actionable preparation',
    title: 'A 7-day Meta frontend interview preparation plan',
    intro:
      'Each day prepares one step of the process as Meta\'s guides lay it out, from the recruiter call through the JavaScript screen to the loop\'s coding, design and behavioural interviews.',
    days: [
      { day: 'Day 1', focus: 'Recruiter call: a two-minute account of your front end work and why Meta, then a spoken run through core JavaScript, since recruiters in 2021 and 2022 accounts asked basic questions and a 2021 quiz had ten questions on the DOM, JavaScript and CSS.', artifact: 'Your two-minute account and a page of one-line answers on core JavaScript.' },
      { day: 'Day 2', focus: 'Built-ins from scratch: map, then forEach and filter, written without calling the originals as the open question asks, and with the index, thisArg and empty slots handled.', artifact: 'Three implementations, each tested on an empty and a sparse array.' },
      { day: 'Day 3', focus: 'The screen\'s clock: two problems in 35 minutes of coding, the share of the 45-minute screen that Meta\'s initial interview guide gives to code, in plain JavaScript.', artifact: 'Two timed attempts and a note on where the minutes went.' },
      { day: 'Day 4', focus: 'The DOM without a framework: create, query and move elements with the native API, since a 2021 internship candidate was told to expect plain JavaScript and no React.', artifact: 'A small page built and changed with the native DOM API alone.' },
      { day: 'Day 5', focus: 'Data structures in plain JavaScript: the common ones as small classes, with the cost of each operation said aloud, since some screens and loops asked classic algorithm problems.', artifact: 'Four small classes with the cost written beside each method.' },
      { day: 'Day 6', focus: 'UI architecture and design: 45 minutes with no code, so practise scoping a front end aloud, from requirements to state, data flow, rendering and failure cases, drawn as you talk.', artifact: 'One design finished in 45 minutes, with the questions you asked before drawing.' },
      { day: 'Day 7', focus: 'Behavioural interview: two stories from the drill above for two of the five signals in Meta\'s guide, then your questions for the recruiter about tools, language and the AI assistant.', artifact: 'Two stories in the parts the drill asks for, and the questions you will put to your recruiter.' },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common Meta frontend interview preparation questions',
    items: [
      { question: 'Are these the real Meta questions?', answer: 'Each was posted by a candidate on Taro, Blind or Medium between 2020 and 2025 and is retold here in our words. Meta\'s guides describe the rounds and give a few example questions, one of which a 2025 account repeats almost word for word; FrontendAtlas wrote the answer guides.' },
      { question: 'Is the front end track like Meta\'s general software engineer loop?', answer: 'Meta\'s front end guides ask for JavaScript, rule out dynamic programming and put a UI architecture and design interview in the loop. Most reported coding questions are plain JavaScript and DOM work, but a 2020 loop, a 2021 interview and a 2025 screen asked classic algorithm problems, and in 2023 a recruiter suggested LeetCode practice for a screen whose one question turned out to be a JavaScript one.' },
      { question: 'What happens in the design interview?', answer: 'Meta\'s guide gives it 45 minutes with no coding and names Excalidraw among the loop\'s tools; Meta\'s hiring page now says design interviews run in CoderPad with Mermaid markdown and the same AI assistant as the coding interview. A 2022 L5 candidate was told in feedback that both coding rounds and the behavioural interview went well and this one did not. The design questions candidates reported are in the list above.' },
      { question: 'Can I use an AI assistant during the interview?', answer: 'Meta\'s hiring page says select roles now include an authorised AI assistant in CoderPad, with Claude, ChatGPT, Gemini and Meta\'s models to choose from, that candidates are expected to use it, and that no outside AI tools are allowed. The AI-native coding interview it describes lists TypeScript but not JavaScript, while the front end guides ask for JavaScript and rule out AI tools such as ChatGPT. No account here mentions the assistant, so ask your recruiter which rules your rounds follow.' },
      { question: 'Were the questions already online?', answer: 'Several candidates said so. A 2021 candidate wrote that the screen questions were all on Glassdoor, a 2022 L5 candidate counted about 12 coding questions that kept recurring there, a 2023 candidate\'s phone screen question was one listed on Glassdoor, and a 2022 internship candidate\'s coding questions came from BigFrontend.' },
      { question: 'How does the internship process differ?', answer: 'Internship accounts from 2021 and 2022 describe a recruiter call with basic JavaScript questions, then one or two JavaScript interviews, by video call in the 2022 account; one candidate was told to be comfortable with plain JavaScript and that no framework questions such as React would come up. None describes a design or behavioural round.' },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Free practice for the way Meta\'s rounds are run',
    intro:
      'Free tasks in the style the Meta accounts describe: a built-in written by hand, a small utility, the DOM, a design case for the no-code round and stories for the behavioural one. None is a reported Meta question.',
    items: [
      { label: 'Implement arrayForEach without prototype mutation', description: 'A built-in written by hand, with a simpler contract than the open map question.', path: '/javascript/coding/js-array-foreach' },
      { label: 'Debounce function', description: 'A utility written from scratch that forwards this and every argument.', path: '/javascript/coding/js-debounce' },
      { label: 'DOM tree structure and depth', description: 'Parents, children, siblings and depth: the terms DOM questions are asked in.', path: '/html/trivia/html-dom-tree-structure' },
      { label: 'Infinite scroll system design', description: 'A free design case to rehearse 45 minutes of front end architecture without code.', path: '/system-design/infinite-scroll-list' },
      { label: 'Behavioral stories', description: 'A structure for the stories the behavioural interview asks for.', path: '/guides/behavioral/stories' },
    ],
  },
  sources: {
    kicker: 'Public interview reports and official context',
    title: 'Sources and evidence limits',
    intro: 'Meta\'s three hiring pages come first, then the accounts behind the open question and the answer guides, each with the loop it describes.',
    items: [
      { label: 'Meta: hiring process', url: META_HIRING_PROCESS_URL, note: 'Meta\'s page on its hiring steps, re-read in November 2026: a recruiter conversation, an initial screening and a full loop over about 2 to 3 months, a practice session in the interview tool, and the AI assistant in CoderPad that select roles now use. It names no exercises.', kind: 'official' },
      { label: 'Meta: preparing for your initial Front End Engineer interview', url: META_FEE_INITIAL_URL, note: 'A 60-minute conversation with an engineer that assesses technical and behavioural skills, with a guide by Meta\'s front end engineers to download. The guide gives the screen as 45 minutes, 35 of them for coding in JavaScript.', kind: 'official' },
      { label: 'Meta: preparing for your Front End Engineer full loop', url: META_FEE_ONSITE_URL, note: 'At least three conversations with Meta engineers, and a guide to download that sets out 4 to 6 interviews of coding, UI architecture and design, and behavioural questions, with no AI tools allowed.', kind: 'official' },
      { label: META_LONDON_2021_LABEL, url: META_LONDON_2021_URL, note: 'A London internship process without an offer: a screening call with a recruiter on basic JavaScript, then a front-end-focused JavaScript coding round. The open question, map written from scratch, comes from that round.', kind: 'report' },
      { label: META_INTERN_2022_LABEL, url: META_INTERN_2022_URL, note: 'An internship offer: a recruiter call with a short JavaScript quiz, then two technical interviews by video whose coding questions, the candidate says, came from BigFrontend.', kind: 'report' },
      { label: META_MEDIUM_2022_LABEL, url: META_MEDIUM_2022_URL, note: 'A first-person post from March 2022: an HR phone screen, then a first technical interview of two problems that the interviewer stopped after 50 minutes. The candidate did not pass it and recommends BigFrontend for preparation.', kind: 'report' },
      { label: META_SAN_FRANCISCO_2024_LABEL, url: META_SAN_FRANCISCO_2024_URL, note: 'A first round without a pass, on basic data structures in JavaScript; the candidate advises preparing data structures and algorithms thoroughly.', kind: 'report' },
      { label: META_NEW_YORK_2025_LABEL, url: META_NEW_YORK_2025_URL, note: 'A technical screen without a pass, after an application through LinkedIn: two algorithm problems that the candidate could not finish in the time given.', kind: 'report' },
      { label: META_BLIND_LIST_2021_LABEL, url: META_BLIND_LIST_2021_URL, note: 'A list by one candidate who went through front end interviews at several companies; its Facebook part names the screen\'s JavaScript questions, the onsite and the design question in a few words each.', kind: 'report' },
      { label: META_BLIND_DESIGN_2022_LABEL, url: META_BLIND_DESIGN_2022_URL, note: 'An L5 front end loop without an offer, by a candidate with seven years of experience: both coding rounds and the behavioural interview went well, the design round did not, and the candidate was told to reapply in a couple of months.', kind: 'report' },
    ],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full Meta practice set',
    copy:
      'Premium opens the locked questions in the list with their practice tasks and answer guides, and every question in the Meta set.',
    buttonLabel: 'Unlock the full Meta practice set',
    src: 'company_preview_meta',
  },
  about: [
    'Meta front end engineer interview preparation',
    'Meta front end recruiter call and JavaScript screen',
    'Meta front end full loop: coding, UI architecture and design',
    'Meta behavioural interview for front end engineers',
  ],
  indexAnchorLabel: 'Meta frontend interview questions',
};
