import type { AuthoredRoundSpotlight } from '../../../shared/company-previews/authored-company-preview.model';

export type GooglePracticePrompt = {
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

export type GooglePrepDay = {
  readonly day: string;
  readonly focus: string;
  readonly artifact: string;
};

export type GooglePreviewFaq = {
  readonly question: string;
  readonly answer: string;
};

export type GoogleResourceLink = {
  readonly label: string;
  readonly description: string;
  readonly path: string;
};

export const GOOGLE_PREVIEW_TITLE = 'Google Frontend Interview Questions: {#questions} Reported + Prep Guide';
export const GOOGLE_PREVIEW_H1 = 'Google Frontend Interview Questions';
export const GOOGLE_PREVIEW_DESCRIPTION =
  'Google frontend interview: the screens, the loop and the Googleyness round explained, with {#questions} reported questions and the behavioural questions asked.';
export const GOOGLE_PREVIEW_CANONICAL_PATH = '/companies/google/preview';
export const GOOGLE_PREVIEW_TRUST_NOTE =
  'The technical questions come from candidates\' public posts on LeetCode Discuss, Blind and Medium from 2019 to 2022, most of them front end loops, and from a 2020 Blind thread whose poster mixed questions from their own interviews with ones found online; the behavioural questions add software engineer loops from 2024 to 2026. We reworded each one, and Google has confirmed none. FrontendAtlas wrote the answer outlines. Google\'s pages describe one process for every role, so ask your recruiter how many of your rounds are frontend.';

export const GOOGLE_PROCESS_NOTE = {
  title: 'A 2026 interview pilot for some US teams',
  reportUrl:
    'https://www.businessinsider.com/google-job-interview-software-engineers-ai-assistant-coding-2026-5',
  guidanceUrl: 'https://www.google.com/about/careers/applications/interview-tips/',
} as const;

/**
 * The answer guides of the reported questions in company-interview-processes.ts: the first is the open question's
 * (a depth-first walk over HTML nodes), the others answer the delayed-run API, the autocomplete round and the critical
 * rendering path follow-up. Three earlier prompts that matched no reported question (take-latest requests, delegated
 * events, search suggestions for a large list) were removed on 2026-11-13.
 */
export const GOOGLE_PRACTICE_PROMPTS: readonly GooglePracticePrompt[] = [
  {
    id: 'nested-navigation-tree',
    title: 'Traverse and transform a nested navigation tree',
    statement:
      'Given nested navigation data or a tree of DOM nodes, walk it depth first to find or transform the matching nodes, keeping document order and returning a predictable result for a missing path.',
    whatThisMeasures:
      'Tree traversal, complexity analysis, JavaScript data modeling, and care around mutation and unusually deep input.',
    clarifyFirst: [
      'Ask whether the tree can be empty, malformed, extremely deep, or cyclic, and whether order must be preserved.',
      'For DOM input, ask which nodes count: elements only, or text and comment nodes too.',
      'Confirm whether the transformation should mutate the input or return new objects along changed paths.',
    ],
    strongAnswer: [
      'Choose depth-first or breadth-first traversal deliberately and explain the trade-off.',
      'Write the recursive walk, then an iterative one with an explicit stack that pushes children in reverse so the visit order stays the same.',
      'State O(n) time and account for recursion depth or an explicit stack.',
      'For DOM nodes, say whether you follow children or childNodes, and name TreeWalker as the browser\'s own walk.',
      'Test empty, single-node, deeply nested, duplicate-id, and malformed inputs.',
    ],
    commonMiss:
      'Assuming a fixed nesting depth or mutating shared input without making that contract explicit.',
    resourceLabel: 'Practice safe nested-path traversal in JavaScript',
    resourcePath: '/javascript/coding/js-get-by-path-1',
  },
  {
    id: 'debounce-cancel-flush',
    title: 'Implement debounce with cancel and flush',
    statement:
      'Implement a debounce utility that preserves arguments and context, and add cancel and flush behavior with a clear return-value contract.',
    whatThisMeasures:
      'Closures, timers, function context, API design, cleanup, and deterministic testing of asynchronous utilities.',
    clarifyFirst: [
      'Confirm leading versus trailing invocation, the return value, and what flush returns when nothing is pending.',
      'Ask how cancel affects retained arguments, context, and any previously returned result.',
    ],
    strongAnswer: [
      'Keep one timer and replace it on each qualifying call.',
      'Preserve the latest arguments and this context without retaining them after completion.',
      'Make cancel and flush idempotent and define leading/trailing interaction.',
      'Use fake timers to test rapid calls, cancellation, flushing, and cleanup.',
    ],
    commonMiss:
      'Creating a double invocation around flush or leaving timers and captured values alive after cancel.',
    resourceLabel: 'Practice implementing debounce',
    resourcePath: '/javascript/coding/js-debounce',
  },
  {
    id: 'accessible-autocomplete',
    title: 'Build an accessible autocomplete',
    statement:
      'Build a typeahead that requests suggestions, exposes clear loading and empty states, and remains fully operable by keyboard and assistive technology.',
    whatThisMeasures:
      'Accessible UI implementation, browser events, async state, focus management, and clear component boundaries.',
    clarifyFirst: [
      'Confirm the data source, minimum query length, result limit, selection behavior, and expected browser support.',
      'Ask whether focus stays in the input and how free-form values, no results, and request failures should behave.',
    ],
    strongAnswer: [
      'Use the combobox/listbox pattern with correct expanded, controls, and active-descendant relationships.',
      'Support Arrow keys, Enter, Escape, pointer input, and visible focus without trapping the user.',
      'Model loading, empty, error, cancelled, and stale outcomes explicitly.',
      'Debounce requests and protect the UI from out-of-order responses.',
      'Test keyboard flow and accessible names as well as successful selection.',
    ],
    commonMiss:
      'Building a mouse-only suggestion list or announcing every network update through an overly noisy live region.',
    resourceLabel: 'Try an optional React autocomplete implementation drill',
    resourcePath: '/react/coding/react-autocomplete-search-starter',
  },
  {
    id: 'frontend-performance-network-security',
    title: 'Reason about frontend performance, networking, and security',
    statement:
      'Diagnose a slow data-heavy page and propose measured improvements across delivery, rendering, request behavior, and client-side security.',
    whatThisMeasures:
      'Evidence-led performance work, network trade-offs, rendering strategy, safe data handling, and prioritization under constraints.',
    clarifyFirst: [
      'Ask for target devices, network conditions, user journeys, performance goals, and the trusted-data boundary.',
      'Separate initial load, interaction latency, rendering cost, and backend response time before proposing fixes.',
    ],
    strongAnswer: [
      'Start with field or lab measurements and identify the dominant bottleneck.',
      'Discuss caching, compression, code splitting, request deduplication, and pagination where evidence supports them.',
      'Use batching or virtualization when rendering volume is the constraint.',
      'Include safe DOM APIs, output handling, and an appropriate Content Security Policy in the threat model.',
      'Set a budget or metric and explain how the change will be verified.',
    ],
    commonMiss:
      'Listing optimizations without measurement, or improving speed while ignoring unsafe rendering and data exposure.',
    resourceLabel: 'Review web load-time optimization trade-offs',
    resourcePath: '/javascript/trivia/web-performance-optimize-load-time',
  },
];

/** Day titles (the text before the first colon) are open to everyone; the rest opens with a free account. */
export const GOOGLE_PREP_SEQUENCE: readonly GooglePrepDay[] = [
  {
    day: 'Day 1',
    focus: 'Technical screen: an hour of coding in a plain shared document with no syntax highlighting and no way to run the code, so write and trace JavaScript by hand.',
    artifact: 'Two solutions written without running them, each traced aloud on one input.',
  },
  {
    day: 'Day 2',
    focus: 'JavaScript round: small utilities written from scratch in plain JavaScript, with a follow-up that changes the requirements once the first version works, as a 2021 account describes every round.',
    artifact: 'Three utilities with tests for the changed requirements.',
  },
  {
    day: 'Day 3',
    focus: 'Algorithms: medium problems written in your interview language, each inside a 45-minute slot, since most interviews in these loops are algorithm coding.',
    artifact: 'Four problems solved with their complexity stated before the code.',
  },
  {
    day: 'Day 4',
    focus: 'The open question: a depth-first walk over HTML nodes, written recursively and again with an explicit stack.',
    artifact: 'Both versions tested on an empty container, a deep chain and siblings in order.',
  },
  {
    day: 'Day 5',
    focus: 'Googleyness: a story for each behavioural question in the list, each a specific time rather than a habit, with an answer ready for how the team responded.',
    artifact: 'Six stories, and the hypotheticals answered with the approach first.',
  },
  {
    day: 'Day 6',
    focus: 'Design round: for L5 and above, one frontend system with its API contract, the focus most design accounts describe.',
    artifact: 'One design with its components, state, API calls and failure states on a page.',
  },
  {
    day: 'Day 7',
    focus: 'Mock loop: four or five 45-minute interviews in one day, one of them Googleyness, all in a plain document.',
    artifact: 'Questions for your recruiter: how many of your rounds are frontend, whether a design round applies at your level, and whether the AI pilot covers your team.',
  },
];

export const GOOGLE_PREVIEW_FAQS: readonly GooglePreviewFaq[] = [
  {
    question: 'Are these the real Google questions?',
    answer:
      'The technical ones come from public posts on LeetCode Discuss, Blind and Medium from 2019 to 2022, most of them by front end candidates, and from a 2020 Blind thread whose poster mixed their own interview questions with ones found online. The behavioural ones add software engineer loops from 2024 to 2026. We reworded them all, and Google has confirmed none.',
  },
  {
    question: 'How many of the rounds are frontend?',
    answer:
      'Usually one. A 2021 L3/L4 candidate in India had one domain round among five interviews and a 2022 L5 candidate one JavaScript round, while a 2023 offer had three frontend rounds out of four and a 2026 account had none. Ask your recruiter what your loop holds.',
  },
  {
    question: 'Should frontend candidates prepare algorithms?',
    answer:
      'Yes. Every loop in these accounts has algorithm coding, and most of its interviews are algorithm rounds. The 2021 candidate in India still advises putting more time into the frontend side: in that loop the algorithm questions felt simpler and the frontend round went deeper.',
  },
  {
    question: 'Is system design included in every frontend loop?',
    answer:
      'Not below L5 in these accounts. Blind posts from 2021 and 2022 describe a design round from L5, with a frontend and API focus in most cases; one L5 candidate\'s design round was not frontend at all. A 2019 front end onsite at an unstated level included an app design round.',
  },
  {
    question: 'Can candidates use JavaScript?',
    answer:
      'Yes in these accounts: front end candidates coded in JavaScript, and a 2021 L5 candidate used Python for the general coding rounds and JavaScript for the frontend one. The 2021 candidate in India learned after the loop that the team used Angular and Dart rather than React.',
  },
  {
    question: 'Does the reported 2026 AI-assisted pilot apply to every frontend candidate?',
    answer:
      'No such conclusion is supported. The May 2026 report describes a pilot for junior and mid-level roles on selected US software-engineering teams, not a standard format for every frontend candidate.',
  },
];

/** Free pages only; none of them is a locked reported question's practice task. */
export const GOOGLE_RESOURCE_LINKS: readonly GoogleResourceLink[] = [
  {
    label: 'Traverse nested paths in JavaScript',
    description: 'Safe lookup and edge cases in nested data, the skill behind the open question.',
    path: '/javascript/coding/js-get-by-path-1',
  },
  {
    label: 'Build a tree from a flat list',
    description: 'Nested data from flat records, then a walk over it.',
    path: '/javascript/coding/js-build-tree-from-flat-list',
  },
  {
    label: 'DOM tree structure and depth',
    description: 'How the DOM nests, the shape the open question walks.',
    path: '/html/trivia/html-dom-tree-structure',
  },
  {
    label: 'Review event delegation',
    description: 'Propagation, target boundaries and dynamic DOM behavior.',
    path: '/javascript/trivia/js-event-delegation',
  },
  {
    label: 'Compare JavaScript objects safely',
    description: 'Shallow and deep equality assumptions for nested state.',
    path: '/javascript/trivia/js-compare-two-objects',
  },
];

/**
 * The Googleyness interview, decoded on the guide; the process table's Googleyness row links here. Google's current
 * pages no longer use the word: the interview tips describe the same behavioural and hypothetical questions, and the
 * archived 2020 interview page named it as one of four areas. Questions are quoted only from accounts read in full,
 * and the ones from general software engineer loops say so.
 */
export const GOOGLE_GOOGLEYNESS_SPOTLIGHT: AuthoredRoundSpotlight = {
  id: 'googleyness',
  kicker: 'Round decoder',
  title: 'Google Googleyness interview for front-end engineers: what it is and what was asked',
  lede: [
    'Front-end loops at Google include one Googleyness interview beside the coding rounds and, at L5 and above, a design round: about 45 minutes of behavioural and hypothetical questions, which several accounts call Googleyness and Leadership and which is rated on the same Hire scale as the coding rounds.',
    'Google\'s current interview tips no longer use the word, but they describe the same questions, "Tell me about a time when…" and "How would you approach this situation…?", and ask for specific examples rather than habits.',
  ],
  facts: [
    {
      label: 'Position in the loop',
      value: 'One of the four or five loop interviews in front-end accounts from 2021 and 2022. In three 2026 software engineer accounts it sat in a first, virtual stage with one technical round, before the onsite coding; one early-career loop added 15 minutes of it to a technical interview.',
    },
    {
      label: 'What it looks for',
      value: 'Google\'s 2020 interview page described it as how you work alone and on a team, how you help others, how you handle ambiguity and how you push yourself to grow; several accounts call it Googleyness and Leadership.',
    },
    {
      label: 'Google\'s own examples',
      value: 'The interview tips ask how you push yourself to grow outside your comfort zone, how you would address a conflict with someone you work with, and when you drove collaboration. Google\'s re:Work guide gives "Tell me about a time your behavior had a positive impact on your team."',
    },
    {
      label: 'Asked in a 2026 front-end track',
      value: 'A walkthrough of the current project and your role in it; joining a project with unclear requirements; a time you worked under a tight deadline, with follow-ups on what you would do differently and how the team responded (Medium, April 2026, an L4 frontend/SWE track).',
    },
    {
      label: 'Patterns in other software engineer loops',
      value: 'A conflict with teammates and whether your suggestions were considered; a teammate who takes the credit for shared work; every task marked P0; a time you worked to a strict deadline; leading an underperforming team as its manager (LeetCode, 2024 and 2025).',
    },
    {
      label: 'Scoring',
      value: 'A 2026 account reports a Hire to Strong Hire rating for this round, on the same scale as its coding rounds.',
    },
    {
      label: 'A 2026 pilot',
      value: 'A pilot that a May 2026 Business Insider report describes, for junior to mid-level roles on some US teams, adds a technical design discussion about a past project to this round, beside an AI-assisted code comprehension round; ask your recruiter whether it applies to you.',
    },
    {
      label: 'Sources',
      value: 'Google\'s interview tips, its re:Work guide and its archived 2020 interview page, the front-end accounts on Blind, LeetCode and Medium, and LeetCode accounts from 2024 to 2026; all are on the Googleyness row of the process table.',
    },
  ],
  practiceLink: { label: 'Draft your stories with the STAR stories guide', path: '/guides/behavioral/stories' },
  processLink: { label: 'See the Googleyness row in the reported process', fragment: 'google-interview-process-1-stage-googleyness-interview' },
  // The facts above, one question each: Google's own examples first, then the accounts.
  drill: {
    note: 'Google\'s examples come from its interview tips and its re:Work guide; the rest are what the accounts report, the last two from general software engineer loops.',
    questions: [
      { id: 'comfort-zone', text: 'How do you push yourself to grow outside your comfort zone?', source: 'Google\'s interview tips' },
      { id: 'conflict', text: 'How would you address a conflict with someone you work with?', source: 'Google\'s interview tips', kind: 'approach' },
      { id: 'collaboration', text: 'Tell me about a time you drove collaboration.', source: 'Google\'s interview tips' },
      { id: 'team-impact', text: 'Tell me about a time your behavior had a positive impact on your team.', source: 'Google\'s re:Work guide' },
      { id: 'current-project', text: 'Walk me through your current project and your role in it.', source: 'Medium, April 2026' },
      { id: 'unclear-requirements', text: 'Tell me about joining a project with unclear requirements.', source: 'Medium, April 2026' },
      { id: 'tight-deadline', text: 'Tell me about a time you worked under a tight deadline. What would you do differently?', source: 'Medium, April 2026' },
      { id: 'credit', text: 'A teammate takes the credit for shared work. What do you do?', source: 'LeetCode, 2024 and 2025', kind: 'approach' },
      { id: 'every-task-p0', text: 'Every task is marked P0. What do you do?', source: 'LeetCode, 2024 and 2025', kind: 'approach' },
    ],
    checks: [
      'It is a specific time, not a habit.',
      'It shows how I worked with others or helped the team.',
      'I can say how the team responded, a follow-up a 2026 account reports.',
    ],
  },
};

/** The page's prose outside the lists, in the order it renders. Count tokens are filled from the page's evidence. */
export const GOOGLE_COPY = {
  subtitle:
    'Google\'s hiring pages describe one process for every role. Front end candidates\' accounts from 2019 to 2026 add the detail: one or two screens in a plain shared document, then four or five interviews that are mostly algorithm coding with usually one JavaScript or frontend round, a Googleyness interview and, from L5, a design round. Their {questions} reported questions follow the table, with the first one open; none comes from an account newer than July 2022.',
  caveat:
    'How many rounds are frontend varies: one in most accounts, three of the four onsite rounds in a 2023 loop that ended in an offer, none in a 2026 account. Google\'s pages say AI tools are not permitted in interviews, while a May 2026 press report describes a pilot for some US teams.',
  chips: ['{#questions} reported questions', '{#reports} public reports, 2019–2026'],
  promptsTitle: 'Google answer guides',
  promptsIntro: 'The practice versions behind the reported Google questions, written by FrontendAtlas.',
  studyParagraphs: [
    'Google\'s front end loops are mostly algorithm coding with one JavaScript round, so the JavaScript round is where frontend preparation pays off. The accounts show what it asks: in 2019, combining the results of callback functions into one array, a delayed-run API and a sequential queue; in 2021, a retry function followed by then, catch and finally, a task-sequencing problem finished with promises, and string manipulation that led to an autocomplete; in a 2020 phone screen, a throttle. In the 2021 loop every question started small and grew once the first version worked.',
    'The algorithm rounds fill the rest of the loop: minimum window substring, a hash map and set problem, paths in a 2D array, a graph problem and one the interviewer expected to be solved with a quad tree. Write them in a plain document without running the code, as the screens are run, and state the complexity before you start. From L5 there is a design round, frontend and API in most accounts; the 2019 onsite asked for an app in which drones shop for you.',
  ],
  walkthroughTitle: 'Walk through the open question: a depth-first walk over HTML nodes',
  walkthroughParagraphs: [
    'The open question asks for a depth-first search over the nodes of an HTML document. Settle the contract before writing anything: which nodes count (elements only, or text and comment nodes too), what the walk returns (an ordered list, the first match or a count), and whether a callback decides what matches.',
    'Write the recursive version first, then the iterative one with an explicit stack, pushing children in reverse so the visit order stays document order. Recursion depth follows the tree\'s depth, which is why a deep generated page is the reason to know both; the browser\'s TreeWalker does the same walk natively and is worth naming.',
    'Test an empty container, a single node, a deep chain, siblings in order and a text node beside elements, then state the cost: every node once, O(n) time, and memory that grows with the depth of the tree.',
  ],
  planIntro:
    'A week that takes the parts of the loop one at a time: the screen in a plain document, the JavaScript round, algorithms, the open question, Googleyness and, from L5, design. The accounts do not agree on the order of the rounds.',
  freeIntro:
    'Free pages for the JavaScript and browser skills behind the screen and the loop. The reported questions and their practice tasks are in the list above.',
} as const;
