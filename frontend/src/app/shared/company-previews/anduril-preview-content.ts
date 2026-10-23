import type { AuthoredCompanyPreview } from '../../shared/company-previews/authored-company-preview.model';

/**
 * Anduril frontend interview guide. Every prompt is a FrontendAtlas practice version modelled on public,
 * self-reported frontend accounts (Blind and Taro, 2022 to 2025, all in the United States) and on Anduril's own
 * careers pages and frontend job postings. Nothing here is a leaked, confirmed or official Anduril question, and
 * nine accounts cannot establish a fixed loop. Taro re-hosts Glassdoor reviews, so its reports carry no location.
 */
const ANDURIL_BLIND_ONSITE_2025_URL = 'https://www.teamblind.com/post/front-end-interviews-at-anduril-3hihnhlv';
const ANDURIL_BLIND_ONSITE_2025_LABEL = 'Public report: Blind front end onsite, April 2025';
const ANDURIL_BLIND_OFFER_2023_URL = 'https://www.teamblind.com/post/anduril-front-end-interviews-bugagvca';
const ANDURIL_BLIND_OFFER_2023_LABEL = 'Public report: Blind front end loop with an offer, 2023, and a 2024 coding round';
const ANDURIL_BLIND_SCREEN_2025_URL = 'https://www.teamblind.com/post/anduril-front-end-interview-yt3cx1bt';
const ANDURIL_BLIND_SCREEN_2025_LABEL = 'Public report: Blind comment on the front end screen, March 2025';
const ANDURIL_BLIND_HELPERS_2024_URL = 'https://www.teamblind.com/post/anduril-frontend-interview-eg52tpe3';
const ANDURIL_BLIND_HELPERS_2024_LABEL = 'Public report: Blind comment on the frontend interview, May 2024';
const ANDURIL_BLIND_AUTOCOMPLETE_2024_URL = 'https://www.teamblind.com/post/anduril-frontend-interview-tip-vo3xz40g';
const ANDURIL_BLIND_AUTOCOMPLETE_2024_LABEL = 'Public report: Blind comment on an autocomplete round, May 2024';
const ANDURIL_TARO_OFFER_2022_URL =
  'https://www.jointaro.com/interviews/companies/anduril/experiences/frontend-software-engineer-costa-mesa-ca-september-1-2022-accepted-offer-positive-9ee69754/';
const ANDURIL_TARO_OFFER_2022_LABEL = 'Public report: Taro frontend software engineer loop with an offer, 2022';
const ANDURIL_TARO_INTERN_2023_URL =
  'https://www.jointaro.com/interviews/companies/anduril/experiences/software-engineerinternship-costa-mesa-ca-july-5-2023-accepted-offer-positive-dbb3fa63/';
const ANDURIL_TARO_INTERN_2023_LABEL = 'Public report: Taro frontend internship loop, July 2023';
const ANDURIL_TARO_TIMER_2024_URL =
  'https://www.jointaro.com/interviews/companies/anduril/experiences/software-engineer-united-states-december-24-2024-no-offer-positive-64f81210/';
const ANDURIL_TARO_TIMER_2024_LABEL = 'Public report: Taro software engineer loop with a frontend focus, December 2024';
const ANDURIL_TARO_CLASS_2025_URL =
  'https://www.jointaro.com/interviews/companies/anduril/experiences/software-engineer-seattle-wa-january-1-2025-no-offer-positive-c481c905/';
const ANDURIL_TARO_CLASS_2025_LABEL = 'Public report: Taro software engineer coding interview, 2025';
const ANDURIL_EARLY_CAREERS_URL = 'https://www.anduril.com/early-careers';
const ANDURIL_FRONTEND_POSTING_URL = 'https://boards.greenhouse.io/andurilindustries/jobs/5147775007';
const ANDURIL_SENIOR_REACT_POSTING_URL = 'https://boards.greenhouse.io/andurilindustries/jobs/5262987007';

export const ANDURIL_PREVIEW_TITLE = 'Anduril Frontend Interview Questions: 5 Prompts + Prep Guide';
export const ANDURIL_PREVIEW_H1 = 'Anduril Frontend Interview Questions';
export const ANDURIL_PREVIEW_DESCRIPTION =
  'Prepare for an Anduril frontend interview with 5 practice prompts modelled on public reports: file explorer, timer class, plain JS to React, autocomplete.';
export const ANDURIL_PREVIEW_CANONICAL_PATH = '/companies/anduril/preview';
export const ANDURIL_PREVIEW_TRUST_NOTE =
  'These are FrontendAtlas practice versions modelled on rounds described in public interview reports, not leaked, confirmed or official Anduril questions. Nine self-reported candidates cannot establish a fixed format, and recruiters have described the wrong kind of round before; use recruiter-provided material as the source of truth.';

export const ANDURIL_COMPANY_PREVIEW: AuthoredCompanyPreview = {
  slug: 'anduril',
  label: 'Anduril',
  title: ANDURIL_PREVIEW_TITLE,
  h1: ANDURIL_PREVIEW_H1,
  description: ANDURIL_PREVIEW_DESCRIPTION,
  canonicalPath: ANDURIL_PREVIEW_CANONICAL_PATH,
  trustNote: ANDURIL_PREVIEW_TRUST_NOTE,
  hero: {
    kicker: 'Public Anduril prep guide',
    subtitle:
      'Prepare with five practice prompts shaped by nine public frontend accounts from 2022 to 2025 and by Anduril employees describing the loop on Blind: a technical screen with an applied frontend problem, then an onsite of two coding rounds, a system design round and a behavioral interview.',
    caveat:
      'This guide uses public, self-reported interview accounts, Anduril careers pages and its frontend job postings to create realistic constraints. It does not claim access to private interview material, a fixed interview format, or the stack of every Anduril team.',
    chips: ['5 practice prompts', 'React, TypeScript, JavaScript classes', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'What Anduril frontend loops reward: a working React build in time and a class moved into a framework',
    paragraphs: [
      'The public accounts describe a short loop. A recruiter call comes first, then one technical screen of about an hour with an applied frontend problem, then an onsite of three or four interviews: two coding rounds, usually one in React and one in plain JavaScript or data structures, a system design round and a behavioral interview. One 2024 candidate flew to Costa Mesa for an in-person onsite.',
      'The tasks are practical rather than puzzle-heavy. Three separate candidates describe a file explorer or folder tree in React, two describe writing a JavaScript class first and then wiring it into a framework, and an April 2025 candidate says the hard part was finishing a simple React interface in time. One round can still be LeetCode-style, and Anduril employees on Blind say the format depends on the team and the interviewer, so prepare both and ask your recruiter which one you will get.',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked October 2026',
    title: 'What the public accounts establish, and what you still need to confirm',
    paragraphs: [
      'Nine self-reported candidates inform this guide. Five are on Blind: an April 2025 onsite without an offer, a 2023 loop that ended in an offer, and three commenters describing a 2024 coding round, a 2024 interview with lodash-style questions and an autocomplete task, and a 2025 screen. Four are on Taro from 2022 to 2025, including a 2023 frontend internship; Taro re-hosts Glassdoor reviews, so each is counted once and none is given a location here. Anduril employees also describe the loop in Blind comments; those are statements, not interview accounts.',
      'Together they establish the round types from 2022 to 2025. They do not establish the system design prompt, the content of the plain JavaScript round beyond one 2025 account, any senior or staff frontend loop, or the format in 2026. Anduril describes a recruiter call, technical and behavioral interviews and role-specific assessments that could include live coding, and its frontend postings ask for React and TypeScript, eligibility for a US security clearance and, in one posting, travel of up to 25 percent. Confirm the format with your recruiter.',
    ],
  },
  roleLenses: {
    kicker: 'Role lenses',
    title: 'Map-based command interfaces and live sensor data as practice contexts',
    intro:
      'These are preparation lenses based on Anduril frontend job postings, not claimed interview rounds or team assignments. Choose the lens closest to the role and keep the reasoning framework-neutral.',
    items: [
      {
        title: 'Map-based command and control interfaces',
        description:
          'The Costa Mesa frontend posting describes custom, map-based UI for autonomous system command and control: a real-time interface for displaying and interacting with sensor data and commanding physical assets.',
        practiceFocus:
          'Layered map state, selection and command flows with an explicit confirmation step, optimistic updates that can be rolled back, and keyboard access for operators.',
      },
      {
        title: 'Large live data streams',
        description:
          'The same posting asks for fetching and managing large streams of data while keeping rendering performant, and the senior React posting asks for experience with real-time interfaces built on reactive programming libraries.',
        practiceFocus:
          'Throttled rendering, windowed lists, stale-data signals, reconnection with backoff, and measuring frame cost before optimizing anything.',
      },
    ],
  },
  prompts: {
    kicker: 'Representative practice prompts',
    title: 'Five Anduril frontend interview practice questions',
    intro:
      'For each prompt, clarify the contract, get working behaviour first, explain where state lives, and test the failure cases. Each prompt links to the public report it is modelled on and to a practice page.',
    itemListName: 'Five Anduril frontend interview practice prompts',
    items: [
      {
        id: 'file-explorer-from-nested-data',
        title: 'Build a file explorer from nested data in React',
        statement:
          'Given a nested array of folders and files, render a tree where each row shows a file or folder icon next to its name, and clicking a folder shows its children below it. Get it working before you style it.',
        whatThisMeasures:
          'Recursive rendering, where open-folder state lives, stable keys, and whether you deliver working behaviour inside the time box.',
        clarifyFirst: [
          'Ask whether folders start open or closed, whether several folders can be open at once, and whether clicking a file must do anything.',
          'Confirm the data shape: is every folder given a children array, can a folder be empty, and do items carry ids or must keys come from their paths?',
        ],
        strongAnswer: [
          'Render one recursive node component that takes an item and its depth; a folder renders its children only when open, a file renders a row with its icon.',
          'Keep open state as a set of folder ids at the top, or inside each folder component if nothing else needs it, and say why you chose one.',
          'Key rows by id or path, indent by depth, and make each folder row a button with aria-expanded so the tree works from the keyboard.',
          'Test an empty folder, a deep path, two folders with the same name in different places, and toggling a folder twice.',
        ],
        commonMiss:
          'Styling the tree before the toggle works, or keying rows by name so two folders called src collide.',
        resourceLabel: 'Practise the file explorer tree (Premium)',
        resourcePath: '/react/coding/react-file-explorer',
        reportedRound: { label: ANDURIL_TARO_INTERN_2023_LABEL, url: ANDURIL_TARO_INTERN_2023_URL },
      },
      {
        id: 'timer-class-then-react-app',
        title: 'Write a timer class, then build a React app around it',
        statement:
          'Write a Timer class in plain JavaScript with start, pause and reset and a way to read the elapsed time, then build a small React app that drives it with buttons and a live display.',
        whatThisMeasures:
          'Separating logic from the view, correct time accounting across pauses, and clean teardown of subscriptions and intervals when the component unmounts.',
        clarifyFirst: [
          'Ask whether the timer counts up or down, what resolution the display needs, and whether reset should keep it running.',
          'Confirm whether the class may own an interval itself or should expose elapsed time computed from timestamps.',
        ],
        strongAnswer: [
          'Store the start timestamp and the accumulated time instead of counting ticks, so pauses and late intervals do not drift.',
          'Give the class subscribe and unsubscribe methods, or compute elapsed time on demand, and keep it free of React so it can be tested alone.',
          'In React, create the instance once, subscribe in an effect, update state on each tick, and clean up on unmount.',
          'Test pause then resume, reset while running, a second start, and unmounting while the timer runs.',
        ],
        commonMiss:
          'Putting the timing logic inside the component so the class is a thin wrapper, or leaving an interval running after unmount.',
        resourceLabel: 'Practise the React countdown timer (Premium)',
        resourcePath: '/react/coding/react-countdown-timer',
        reportedRound: { label: ANDURIL_TARO_TIMER_2024_LABEL, url: ANDURIL_TARO_TIMER_2024_URL },
      },
      {
        id: 'vanilla-component-then-framework',
        title: 'Build a component in plain JavaScript, then port it to a framework',
        statement:
          'Starting from an empty file, build a small interactive component with plain JavaScript and the DOM, then rebuild the same behaviour in React, Vue or Angular without changing what the user sees.',
        whatThisMeasures:
          'DOM fundamentals without a framework, then whether you can map imperative updates onto declarative state without changing behaviour.',
        clarifyFirst: [
          'Ask which framework you may choose for the second half and whether the plain version must keep working.',
          'Write the behaviour as a short list of inputs and outputs before starting either version.',
        ],
        strongAnswer: [
          'In the plain version, keep state in one object, render from it with a single function, and attach listeners with event delegation instead of one per element.',
          'Name what changes in the port: state moves into the framework, rendering becomes declarative, and listeners move into the template.',
          'Reuse pure logic, such as a class or helper functions, unchanged in both versions.',
          'Run the same list of cases against both versions so the port is checked against the original.',
        ],
        commonMiss:
          'Rewriting from scratch in the framework so the two versions drift apart, or using innerHTML with user text in the plain version.',
        resourceLabel: 'Review what classes in JavaScript give you (free)',
        resourcePath: '/javascript/trivia/js-classes',
        reportedRound: { label: ANDURIL_TARO_CLASS_2025_LABEL, url: ANDURIL_TARO_CLASS_2025_URL },
      },
      {
        id: 'lodash-style-helpers',
        title: 'Implement lodash-style flatten, map and reduce',
        statement:
          'Implement flatten, map and reduce without the native methods, then test them on nested arrays, sparse arrays and an empty input.',
        whatThisMeasures:
          'Precise behaviour of array helpers, recursion depth, and the edge cases you state before you write code.',
        clarifyFirst: [
          'Ask whether flatten is one level, a given depth or fully deep, and whether holes in sparse arrays must be skipped.',
          'Confirm the reduce contract with and without an initial value, including the empty-array error.',
        ],
        strongAnswer: [
          'Write flatten with a depth argument and recursion, or with an explicit stack if very deep inputs are possible.',
          'Make map and reduce skip holes like the native methods, pass the index and the array to the callback, and throw a TypeError for reduce on an empty array without an initial value.',
          'Keep each helper pure and return new arrays.',
          'State the time complexity and test nested, sparse, empty and single-element inputs.',
        ],
        commonMiss:
          'A reduce that silently returns undefined for an empty array, or a flatten that ignores the depth argument.',
        resourceLabel: 'Practise flattening one level (free)',
        resourcePath: '/javascript/coding/js-flatten-once',
        reportedRound: { label: ANDURIL_BLIND_HELPERS_2024_LABEL, url: ANDURIL_BLIND_HELPERS_2024_URL },
      },
      {
        id: 'autocomplete-search-react',
        title: 'Build an autocomplete search in React',
        statement:
          'Build a search input that suggests matches as the user types, ignores late responses to old queries and lets the user pick a suggestion from the keyboard.',
        whatThisMeasures:
          'Request ordering, debouncing, and an accessible listbox pattern under time pressure.',
        clarifyFirst: [
          'Ask whether suggestions come from a local list or an API, and what should show while a request is pending or fails.',
          'Confirm the keyboard behaviour: arrow keys to move, Enter to select, Escape to close.',
        ],
        strongAnswer: [
          'Debounce the input, and ignore or abort responses that belong to an older query so a slow answer cannot overwrite a newer one.',
          'Keep the query, the suggestions, the active index and the request status as separate pieces of state.',
          'Use the combobox and listbox roles with aria-activedescendant so screen readers announce the active option.',
          'Test fast typing, an empty result, a failed request and selecting with the keyboard.',
        ],
        commonMiss:
          'Rendering whichever response arrives last, so typing quickly shows results for an old query.',
        resourceLabel: 'Practise the React autocomplete starter (free)',
        resourcePath: '/react/coding/react-autocomplete-search-starter',
        reportedRound: { label: ANDURIL_BLIND_AUTOCOMPLETE_2024_LABEL, url: ANDURIL_BLIND_AUTOCOMPLETE_2024_URL },
      },
    ],
  },
  walkthrough: {
    kicker: 'Public mini walkthrough',
    title: 'Scope the file explorer before the first line',
    intro:
      'Treat this as a representative exercise, not a description of the reported one. The accounts stress finishing working behaviour in time, so scope down first and extend only when the basics work.',
    steps: [
      { title: 'Fix the data shape', description: 'Write the node type first: id, name, kind, and children for folders. Decide what an empty folder looks like.' },
      { title: 'Choose where open state lives', description: 'A set of open folder ids at the top is easy to reset and test; local state in each folder is simpler if nothing else needs it.' },
      { title: 'Render recursively', description: 'One node component for both kinds, indentation from depth, and children rendered only when a folder is open.' },
      { title: 'Make it usable', description: 'Folder rows as buttons with aria-expanded, a distinct icon for files, and focus kept on the row after a toggle.' },
      { title: 'Finish, then extend', description: 'Get open and close working first; sorting folders before files, selection and arrow-key navigation come after, if time allows.' },
      { title: 'Test the edges', description: 'An empty folder, a deep path, duplicate names in different folders, and toggling the same folder twice.' },
    ],
  },
  prepPlan: {
    kicker: 'Actionable preparation',
    title: 'A 7-day Anduril frontend interview preparation plan',
    intro: 'Every day ends with code, a test, a design artifact, or a question you can use in the real process.',
    days: [
      { day: 'Day 1', focus: 'React builds against a timer: the file explorer and an autocomplete, 45 minutes each.', artifact: 'Two working components and a note of where the time went.' },
      { day: 'Day 2', focus: 'A plain JavaScript class, then the same logic in React: a timer with start, pause and reset.', artifact: 'A tested Timer class and a React app that uses it unchanged.' },
      { day: 'Day 3', focus: 'Plain DOM: a small component from an empty file with event delegation, then the same component in a framework.', artifact: 'Two versions that pass the same list of cases.' },
      { day: 'Day 4', focus: 'Array helpers and one data-structures problem: flatten, map and reduce, then a stack or queue problem in JavaScript.', artifact: 'Helpers with edge-case tests and one timed problem with its complexity stated.' },
      { day: 'Day 5', focus: 'Frontend system design for live data: a map of moving assets fed by a sensor stream, with throttled rendering and stale-data signals.', artifact: 'A one-page design with the data flow, state ownership and what you would measure.' },
      { day: 'Day 6', focus: 'Behavioral: why the mission matters to you, a production incident, a disagreement, shipping under time pressure.', artifact: 'Five stories with a measurable result each.' },
      { day: 'Day 7', focus: 'Mock loop: one React round, one JavaScript round, one design round and one behavioral, back to back.', artifact: 'Questions for the recruiter about the screen format, the onsite rounds, clearance and travel.' },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common Anduril frontend interview preparation questions',
    items: [
      {
        question: 'Are these the real Anduril questions?',
        answer:
          'No. They are FrontendAtlas practice versions modelled on round types described in public, self-reported accounts. Two Blind commenters say their questions matched ones published on other prep sites, so treat the exact wording as unknown.',
      },
      {
        question: 'Is the frontend loop LeetCode or React?',
        answer:
          'Mostly React and JavaScript in the accounts used here. An April 2025 candidate whose recruiter promised an algorithm-heavy round got two simple JavaScript and React tasks instead, and a 2025 account says the coordinator preparation document pointed to a frontend test, which turned out to be right. An Anduril employee on Blind wrote that LeetCode is fair game in one interview, so prepare one data-structures problem as well.',
      },
      {
        question: 'What does the system design round ask?',
        answer:
          'No public frontend account names the prompt. Accounts of general software loops say Anduril design questions are specific to defense and aerospace, and the frontend postings describe real-time, map-based interfaces over large data streams, so practise one design in that shape.',
      },
      {
        question: 'Do I need a security clearance?',
        answer:
          'The two frontend postings read for this guide ask for eligibility to obtain a US Secret or Top Secret clearance, not an active one at application. The Anduril early-careers page explains that its work falls under US export regulations. Check the posting for your role.',
      },
      {
        question: 'Where are the onsites?',
        answer:
          'The one account that names a place flew to Costa Mesa for an in-person onsite in 2024. Frontend roles listed in October 2026 are in Costa Mesa, Seattle, Washington DC, Arlington, Reston and Boston, so ask your recruiter where your onsite will be.',
      },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Build the underlying skills with free practice',
    intro:
      'These public pages cover the recursion, request ordering, array helpers, classes and event handling used by the practice prompts. They are supporting drills, not claimed Anduril questions.',
    items: [
      { label: 'Filter a tree and render it indented', description: 'The depth-first recursion behind the file explorer task, as a text drill.', path: '/javascript/coding/js-filter-tree-render-indented' },
      { label: 'React autocomplete starter', description: 'Search suggestions with request ordering and keyboard selection.', path: '/react/coding/react-autocomplete-search-starter' },
      { label: 'Flatten one level', description: 'The flatten helper from the lodash-style questions.', path: '/javascript/coding/js-flatten-once' },
      { label: 'What are classes in JavaScript?', description: 'Class syntax, constructors and methods for the class-then-framework round.', path: '/javascript/trivia/js-classes' },
      { label: 'Event delegation', description: 'One listener for many elements in the plain JavaScript version of a component.', path: '/javascript/trivia/js-event-delegation' },
      { label: 'Debounce versus throttle', description: 'Which one to use for search input and which for a live data stream.', path: '/javascript/trivia/debounce-vs-throttle-search-input' },
      { label: 'Infinite scroll list design', description: 'Rendering large lists without loading everything, for the live data lens.', path: '/system-design/infinite-scroll-list' },
      { label: 'Behavioral stories', description: 'A structure for the mission and production-incident conversations.', path: '/guides/behavioral/stories' },
    ],
  },
  sources: {
    kicker: 'Public interview reports and official context',
    title: 'Sources and evidence limits',
    intro: 'These links support the public context used by the guide. Their notes state what each source can and cannot establish about preparation.',
    items: [
      { label: ANDURIL_BLIND_ONSITE_2025_LABEL, url: ANDURIL_BLIND_ONSITE_2025_URL, note: 'One self-reported onsite in April 2025 without an offer. It establishes two simple JavaScript and React coding tasks, a system design round and a behavioral interview, and a recruiter who had predicted an algorithm-heavy round. It does not describe the design prompt.', kind: 'report' },
      { label: ANDURIL_BLIND_OFFER_2023_LABEL, url: ANDURIL_BLIND_OFFER_2023_URL, note: 'A 2023 thread whose author describes an easy React first interview and later an offer, an Anduril employee describing two coding rounds, a systems design round and a behavioral interview, and a 2024 commenter who got the file folder component before an onsite in Costa Mesa.', kind: 'report' },
      { label: ANDURIL_BLIND_SCREEN_2025_LABEL, url: ANDURIL_BLIND_SCREEN_2025_URL, note: 'A commenter reports getting the file explorer problem in the screen in 2025. It establishes the task, not its wording or the rest of the loop.', kind: 'report' },
      { label: ANDURIL_BLIND_HELPERS_2024_LABEL, url: ANDURIL_BLIND_HELPERS_2024_URL, note: 'A commenter in a thread about the Anduril frontend interview says they cleared it and were asked lodash-style questions: flatten, map and reduce. One account, no stage named.', kind: 'report' },
      { label: ANDURIL_BLIND_AUTOCOMPLETE_2024_LABEL, url: ANDURIL_BLIND_AUTOCOMPLETE_2024_URL, note: 'The same commenter reports being asked to design an autocomplete search feature in React. One account, no stage named.', kind: 'report' },
      { label: ANDURIL_TARO_OFFER_2022_LABEL, url: ANDURIL_TARO_OFFER_2022_URL, note: 'A re-hosted Glassdoor review with a placeholder date. It establishes a recruiter call, a technical screen by video and an onsite with system design, coding and behavioral sessions, with LeetCode-style and React coding questions, ending in an accepted offer.', kind: 'report' },
      { label: ANDURIL_TARO_INTERN_2023_LABEL, url: ANDURIL_TARO_INTERN_2023_URL, note: 'A re-hosted Glassdoor review of a frontend internship loop with four rounds and an offer. It establishes building a small application and the file explorer prompt; it says nothing about full-time loops.', kind: 'report' },
      { label: ANDURIL_TARO_TIMER_2024_LABEL, url: ANDURIL_TARO_TIMER_2024_URL, note: 'A re-hosted Glassdoor review without an offer. It establishes an applied problem for frontend candidates, an onsite with a data-structures round, a system design round and a behavioral interview, and the timer class with a React app around it.', kind: 'report' },
      { label: ANDURIL_TARO_CLASS_2025_LABEL, url: ANDURIL_TARO_CLASS_2025_URL, note: 'A re-hosted Glassdoor review with a placeholder date. It establishes a coding interview on HackerRank that started with a JavaScript class or component in an empty file and then moved it into a framework of choice; the author withheld the exact question.', kind: 'report' },
      { label: 'Anduril: Early careers FAQ', url: ANDURIL_EARLY_CAREERS_URL, note: 'Official page listing a recruiter call, technical and behavioral interviews and role-specific assessments that could include live coding challenges, presentations or technical discussions. It names no frontend format.', kind: 'official' },
      { label: 'Anduril: Frontend Software Engineer posting, Costa Mesa', url: ANDURIL_FRONTEND_POSTING_URL, note: 'Official posting read in October 2026. It describes map-based interfaces for autonomous system command and control, large data streams with performant rendering, React and TypeScript, clearance eligibility and travel of up to 25 percent.', kind: 'official' },
      { label: 'Anduril: Senior Front End Software Engineer, React posting', url: ANDURIL_SENIOR_REACT_POSTING_URL, note: 'Official posting read in October 2026. It asks for React and TypeScript, real-time interfaces with reactive programming libraries and eligibility for a Top Secret clearance; it says nothing about interviews.', kind: 'official' },
    ],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full Anduril practice set',
    copy:
      'This public guide is complete enough to plan a focused week. Premium unlocks the file explorer tree with keyboard navigation, the React countdown timer and the wider premium library for the same skills.',
    buttonLabel: 'Unlock the full Anduril practice set',
    src: 'company_preview_anduril',
  },
  about: [
    'Anduril frontend interview preparation',
    'React component builds under time pressure',
    'JavaScript classes wired into a framework',
    'Frontend system design for real-time data',
  ],
  indexAnchorLabel: 'Anduril frontend interview questions',
};
