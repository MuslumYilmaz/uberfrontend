import type { AuthoredCompanyPreview } from '../../shared/company-previews/authored-company-preview.model';

/**
 * Anduril frontend interview guide. The reported questions live with the process table
 * (company-interview-processes.ts), and the five prompts here are the answer guides of its frontend rows. The sources
 * are self-reported accounts on Blind and Taro from 2022 to 2025, frontend loops and general software engineer loops,
 * plus Anduril's careers pages and two frontend postings. Nothing here is a leaked, confirmed or official Anduril
 * question. Taro re-hosts Glassdoor reviews in rewritten form.
 */
const ANDURIL_BLIND_ONSITE_2025_URL = 'https://www.teamblind.com/post/front-end-interviews-at-anduril-3hihnhlv';
const ANDURIL_BLIND_ONSITE_2025_LABEL = 'Public report: Blind front end onsite, April 2025';
const ANDURIL_BLIND_OFFER_2023_URL = 'https://www.teamblind.com/post/anduril-front-end-interviews-bugagvca';
const ANDURIL_BLIND_OFFER_2023_LABEL = 'Public report: Blind front end loop with an offer, 2023, and a 2024 coding round';
const ANDURIL_BLIND_SCREEN_2025_URL = 'https://www.teamblind.com/post/anduril-front-end-interview-yt3cx1bt';
const ANDURIL_BLIND_SCREEN_2025_LABEL = 'Public report: Blind comment on the front end screen, March 2025';
const ANDURIL_BLIND_CLEARED_2024_URL = 'https://www.teamblind.com/post/anduril-frontend-interview-eg52tpe3';
const ANDURIL_BLIND_CLEARED_2024_LABEL = 'Public report: Blind comment on the frontend interview, May 2024';
const ANDURIL_BLIND_TIP_2024_URL = 'https://www.teamblind.com/post/anduril-frontend-interview-tip-vo3xz40g';
const ANDURIL_BLIND_TIP_2024_LABEL = 'Public report: second Blind comment by the same candidate, May 2024';
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
const ANDURIL_TARO_SWE_2024_URL =
  'https://www.jointaro.com/interviews/companies/anduril/experiences/software-engineer-costa-mesa-ca-april-13-2024-no-offer-positive-ad87266b/';
const ANDURIL_TARO_SWE_2024_LABEL = 'Public report: Taro software engineer loop, Costa Mesa, April 2024';
const ANDURIL_TARO_BOSTON_2025_URL =
  'https://www.jointaro.com/interviews/companies/anduril/experiences/software-engineer-boston-ma-august-19-2025-no-offer-neutral-3ee554cc/';
const ANDURIL_TARO_BOSTON_2025_LABEL = 'Public report: Taro software engineer loop, Boston, August 2025';
const ANDURIL_TARO_SWE_OCT_2025_URL =
  'https://www.jointaro.com/interviews/companies/anduril/experiences/software-engineer-october-16-2025-no-offer-positive-b0151de7/';
const ANDURIL_TARO_SWE_OCT_2025_LABEL = 'Public report: Taro software engineer account, October 2025';
const ANDURIL_BLIND_PHONE_SCREEN_2023_URL = 'https://www.teamblind.com/post/Anduril-Software-Interview-SUOhG3nC';
const ANDURIL_BLIND_PHONE_SCREEN_2023_LABEL = 'Public report: Blind software engineer phone screen, 2023';
const ANDURIL_BLIND_TECH_SCREEN_2023_URL = 'https://www.teamblind.com/post/anduril-interview---experiences-AEsA1VUQ';
const ANDURIL_BLIND_TECH_SCREEN_2023_LABEL = 'Public report: Blind thread on the one-hour tech screen, 2023';
const ANDURIL_EARLY_CAREERS_URL = 'https://www.anduril.com/early-careers';
const ANDURIL_FRONTEND_POSTING_URL = 'https://boards.greenhouse.io/andurilindustries/jobs/5147775007';
const ANDURIL_SENIOR_REACT_POSTING_URL = 'https://boards.greenhouse.io/andurilindustries/jobs/5262987007';

export const ANDURIL_PREVIEW_TITLE = 'Anduril Frontend Interview Questions: {#questions} Reported + Prep Guide';
export const ANDURIL_PREVIEW_H1 = 'Anduril Frontend Interview Questions';
export const ANDURIL_PREVIEW_DESCRIPTION =
  'Prepare for an Anduril frontend interview with {#questions} reported questions from public reports: the file explorer screen, two coding rounds, design, behavioral.';
export const ANDURIL_PREVIEW_CANONICAL_PATH = '/companies/anduril/preview';
export const ANDURIL_PREVIEW_TRUST_NOTE =
  'Every question here comes from a candidate\'s account, posted on Blind or written on Glassdoor and reposted on Taro, and is retold in our words. Two of those candidates say their tasks can be found on prep sites, so read the list as what came up, not as Anduril\'s own wording.';

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
      'Frontend accounts from 2022 to 2025 describe a recruiter call, an hour-long screen on one applied frontend problem, and an onsite of two coding rounds, a system design round and a behavioral interview, held at Costa Mesa in 2022 and 2024. Below the table of rounds are the {questions} questions candidates reported from frontend and general software engineer loops; the file explorer task is open to everyone.',
    caveat:
      'The frontend accounts stop in April 2025 and none is for a senior or staff title; the Taro ones are Glassdoor reviews reposted in rewritten form. Recruiters have predicted the wrong kind of round before, so ask yours which screen you will get.',
    chips: ['{#questions} reported questions', '{#reports} public reports, 2022–2025', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'What Anduril frontend loops reward: working UI inside the hour, in React or plain JavaScript',
    paragraphs: [
      'The frontend accounts describe a short loop. A recruiter call comes first, then one technical screen of about an hour with an applied frontend problem, then an onsite of three or four interviews: two coding rounds, usually one in React and one in plain JavaScript or data structures, a system design round and a behavioral interview. Two candidates went to Costa Mesa for an in-person onsite, in 2022 and 2024.',
      'The frontend tasks are practical rather than puzzle-heavy: three candidates got the file explorer, two were asked to write a JavaScript class and then put it in a framework, one of them around a timer, and an April 2025 candidate says the hard part was finishing a simple React interface in time. The general software engineer loops are LeetCode-style, from a sensor-distance search to dynamic programming, graphs and a topological sort, and an Anduril engineer on Blind says LeetCode is fair game in one frontend interview, so prepare one medium problem as well and ask your recruiter which screen you will get.',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked November 2026',
    title: 'What Blind and Taro accounts show about the Anduril loop, and where they stop',
    paragraphs: [
      'The guide rests on {reports} public reports. The frontend ones run from 2022 to 2025: Blind posts and comments by candidates for front-end roles, among them an April 2025 onsite without an offer and a 2023 loop that ended in one, and four Taro reviews of frontend loops, one of them a 2023 internship. The general software engineer accounts, on Blind and Taro from 2022 to 2025, add the algorithm questions and the shape of a one-hour coding screen. Taro reposts Glassdoor reviews in rewritten form, and Anduril engineers who comment on Blind describe the loop without giving accounts of their own.',
      'Together they show the order of the rounds and the kind of task in each, not this year\'s format: no frontend account is from 2026 or for a senior or staff title, and none names the system design prompt. Anduril\'s early-careers page lists a recruiter call, technical and behavioral interviews and role-specific assessments that could include live coding; its frontend postings ask for React and TypeScript, eligibility for a US security clearance and, in the Costa Mesa posting, travel of up to 25 percent.',
    ],
  },
  roleLenses: {
    kicker: 'Role lenses',
    title: 'Map-based command interfaces and live sensor data as practice contexts',
    intro:
      'Both contexts come from Anduril\'s own frontend postings, not from interview accounts. They suit the system design round, whose prompt no account names.',
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
    title: 'Answer guides for the reported Anduril questions',
    intro:
      'For each question, clarify the contract, get working behaviour first, explain where state lives, and test the failure cases.',
    itemListName: 'Anduril answer guides',
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
        resourceLabel: 'Practise the dropdown class and its React port (free)',
        resourcePath: '/react/coding/react-vanilla-dropdown-port',
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
        reportedRound: { label: ANDURIL_BLIND_CLEARED_2024_LABEL, url: ANDURIL_BLIND_CLEARED_2024_URL },
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
        reportedRound: { label: ANDURIL_BLIND_TIP_2024_LABEL, url: ANDURIL_BLIND_TIP_2024_URL },
      },
    ],
  },
  walkthrough: {
    kicker: 'Mini walkthrough',
    title: 'Scope the file explorer before the first line',
    intro:
      'The accounts stress finishing working behaviour in time, so scope down first and extend only when the basics work.',
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
    intro:
      'Seven days in the order of the Anduril loop: the React screen, the plain JavaScript and algorithm half of the onsite, the design round, the behavioral interview, then a mock onsite.',
    days: [
      { day: 'Day 1', focus: 'React build in time: the file explorer from nested data inside the hour the screen lasts, working before it is styled.', artifact: 'A tree that opens and closes from the keyboard, and a note of where the minutes went.' },
      { day: 'Day 2', focus: 'Plain JavaScript: classes, closures, recursion and DOM events with no framework, for the vanilla JavaScript round an Anduril engineer described on Blind.', artifact: 'Small plain-JavaScript exercises with tests, written in a bare editor with no CodeSandbox.' },
      { day: 'Day 3', focus: 'React state and effects: a component that subscribes to an object outside React and cleans up on unmount, and an input that ignores late responses.', artifact: 'Two components with tests for unmounting mid-update and for a slow response arriving last.' },
      { day: 'Day 4', focus: 'Algorithm round: one LeetCode-medium problem against the clock, talked through aloud, then extended twice the way an interviewer would.', artifact: 'Timed solutions with their complexity written down.' },
      { day: 'Day 5', focus: 'Frontend system design for live data: a map of moving assets fed by sensor streams, with throttled rendering and a stale-data signal, the shape of Anduril\'s frontend postings.', artifact: 'A one-page design with the data flow, where state lives and what you would measure.' },
      { day: 'Day 6', focus: 'Behavioral and resume: why Anduril and its mission, a short answer to tell me about yourself, and every project on your resume explained in depth.', artifact: 'A short introduction, a why-Anduril answer and notes on each resume project an interviewer could probe.' },
      { day: 'Day 7', focus: 'Mock onsite: one React round, one plain JavaScript or data-structures round, one design round and one behavioral interview, back to back.', artifact: 'Questions for your recruiter: React or LeetCode-style for the screen, which frameworks are allowed, where the onsite is, and the clearance and travel terms in the posting.' },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common Anduril frontend interview preparation questions',
    items: [
      {
        question: 'Are these the real Anduril questions?',
        answer:
          'They are what candidates for front-end and general software engineer roles at Anduril posted on Blind and Taro between 2022 and 2025, rewritten in our words; Anduril has published none of them. The frontend ones lean on React and plain JavaScript, the general ones on LeetCode-style problems. The answer guides for the frontend questions are FrontendAtlas\'s own work.',
      },
      {
        question: 'Is the frontend loop LeetCode or React?',
        answer:
          'Mostly React and JavaScript in the frontend accounts. In April 2025 a recruiter promised an algorithm-heavy round and the onsite held two simple JavaScript and React tasks; in another 2025 loop the coordinator\'s preparation document pointed to a frontend test, and it was right. An Anduril engineer on Blind wrote that LeetCode is fair game in one interview, and the general software engineer loops are LeetCode-style, so prepare one medium problem as well.',
      },
      {
        question: 'What does the system design round ask?',
        answer:
          'No account names the prompt. A 2024 frontend candidate called the onsite almost all React plus client-side architecture. In general software engineer loops the design questions were specific to defense, and an Anduril engineer on Blind wrote that they will not ask you to design Twitter. The frontend postings describe real-time, map-based interfaces over large data streams, so practise one design in that shape.',
      },
      {
        question: 'Do I need a security clearance?',
        answer:
          'The two frontend postings read for this guide ask for eligibility to obtain a US Secret or Top Secret clearance, not an active one at application. The Anduril early-careers page explains that its work falls under US export regulations. Check the posting for your role.',
      },
      {
        question: 'Where are the onsites?',
        answer:
          'Two accounts name Costa Mesa: an in-person onsite in 2022 and a candidate who flew there in 2024. Frontend roles listed in October 2026 are in Costa Mesa, Seattle, Washington DC, Arlington, Reston and Boston, so ask your recruiter where your onsite will be.',
      },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Build the underlying skills with free practice',
    intro:
      'Free tasks and explainers for the skills behind the Anduril rounds: recursion over nested data, class syntax, event handling, input timing and rendering a large live list.',
    items: [
      { label: 'Filter a tree and render it indented', description: 'The depth-first recursion behind the file explorer task, as a text drill.', path: '/javascript/coding/js-filter-tree-render-indented' },
      { label: 'What are classes in JavaScript?', description: 'Class syntax, constructors and methods.', path: '/javascript/trivia/js-classes' },
      { label: 'Event delegation', description: 'One listener for many elements, in plain JavaScript.', path: '/javascript/trivia/js-event-delegation' },
      { label: 'Debounce versus throttle', description: 'Which one to use for search input and which for a live data stream.', path: '/javascript/trivia/debounce-vs-throttle-search-input' },
      { label: 'Infinite scroll list design', description: 'Rendering large lists without loading everything, for the live data lens.', path: '/system-design/infinite-scroll-list' },
      { label: 'Behavioral stories', description: 'A structure for why-Anduril answers and a resume deep dive.', path: '/guides/behavioral/stories' },
    ],
  },
  sources: {
    kicker: 'Public interview reports and official context',
    title: 'Sources and evidence limits',
    intro: 'These links support the public context used by the guide. Their notes state what each source can and cannot establish about preparation.',
    items: [
      { label: ANDURIL_BLIND_ONSITE_2025_LABEL, url: ANDURIL_BLIND_ONSITE_2025_URL, note: 'One self-reported onsite in April 2025 without an offer. It establishes two simple JavaScript and React coding tasks, a system design round and a behavioral interview, and a recruiter who had predicted an algorithm-heavy round. It does not describe the design prompt.', kind: 'report' },
      { label: ANDURIL_BLIND_OFFER_2023_LABEL, url: ANDURIL_BLIND_OFFER_2023_URL, note: 'A 2023 thread whose author describes an easy React first interview and later an offer, an Anduril employee describing two coding rounds, a systems design round and a behavioral interview, and a 2024 commenter who got the file folder component before an onsite in Costa Mesa.', kind: 'report' },
      { label: ANDURIL_BLIND_SCREEN_2025_LABEL, url: ANDURIL_BLIND_SCREEN_2025_URL, note: 'A commenter reports getting the file explorer problem in the screen in 2025 and says it is on a prep site. It establishes the task, not its wording or the rest of the loop.', kind: 'report' },
      { label: ANDURIL_BLIND_CLEARED_2024_LABEL, url: ANDURIL_BLIND_CLEARED_2024_URL, note: 'A candidate who cleared the frontend interview in 2024 says it was mainly frontend-focused JavaScript questions, all of which they had seen on a prep site. In the same thread a candidate for a front-end position calls the onsite almost all React plus client-side architecture. Neither names the round of each question.', kind: 'report' },
      { label: ANDURIL_BLIND_TIP_2024_LABEL, url: ANDURIL_BLIND_TIP_2024_URL, note: 'The same candidate, answering a question about frontend positions: mostly frontend work rather than LeetCode, and one React task. No round named.', kind: 'report' },
      { label: ANDURIL_TARO_OFFER_2022_LABEL, url: ANDURIL_TARO_OFFER_2022_URL, note: 'A Costa Mesa frontend loop from 2022 that ended in an accepted offer, reposted from Glassdoor with an approximate date: a recruiter call, a screen by video, then an in-person onsite of system design, coding and behavioral sessions mixing LeetCode-style and React questions, with an answer within five days.', kind: 'report' },
      { label: ANDURIL_TARO_INTERN_2023_LABEL, url: ANDURIL_TARO_INTERN_2023_URL, note: 'A 2023 frontend internship loop in Costa Mesa, reposted from Glassdoor: an introduction, two technical rounds building a small application, whose task was the file explorer, and a behavioral round with a short technical question. It ended in an offer and says nothing about full-time loops.', kind: 'report' },
      { label: ANDURIL_TARO_TIMER_2024_LABEL, url: ANDURIL_TARO_TIMER_2024_URL, note: 'A December 2024 loop without an offer, reposted from Glassdoor, by a candidate with a frontend focus: a recruiter call about the resume, one technical interview with an applied problem, and an onsite of a data-structures round, a system design round and a behavioral interview. It lists one JavaScript and React task without saying which round it came from.', kind: 'report' },
      { label: ANDURIL_TARO_CLASS_2025_LABEL, url: ANDURIL_TARO_CLASS_2025_URL, note: 'A Seattle loop from early 2025 without an offer, reposted from Glassdoor with an approximate date: a generic recruiter call in December, then a coding interview on HackerRank in January with no CodeSandbox. The recruiter\'s guide looked like LeetCode, the coordinator\'s pointed to a frontend test, and the frontend test was right. The author outlined the task but kept the specific question back.', kind: 'report' },
      { label: ANDURIL_TARO_SWE_2024_LABEL, url: ANDURIL_TARO_SWE_2024_URL, note: 'A general software engineer loop, not frontend, without an offer: a 30-minute recruiter screen on the resume and why Anduril, then an hour-long tech screen with a senior engineer built around one coding question.', kind: 'report' },
      { label: ANDURIL_TARO_BOSTON_2025_LABEL, url: ANDURIL_TARO_BOSTON_2025_URL, note: 'A general software engineer loop, not frontend, without an offer: a 30-minute screen, an hour of easy-to-medium coding, then one day of four interviews, two coding, one system design and one behavioral, with an answer the same day. It gives one coding question without its round.', kind: 'report' },
      { label: ANDURIL_TARO_SWE_OCT_2025_LABEL, url: ANDURIL_TARO_SWE_OCT_2025_URL, note: 'A general software engineer account, not frontend, without an offer: rounds of 45 to 60 minutes it calls hard, three or four technical rounds counting the onsite, and a short introduction asked for.', kind: 'report' },
      { label: ANDURIL_BLIND_PHONE_SCREEN_2023_LABEL, url: ANDURIL_BLIND_PHONE_SCREEN_2023_URL, note: 'A 2023 thread by a software engineer who did not pass the phone screen and later posted its coding question. A commenter gives a phone screen of one medium-difficulty LeetCode problem and an onsite of a medium or hard problem, a behavioral and a system design round.', kind: 'report' },
      { label: ANDURIL_BLIND_TECH_SCREEN_2023_LABEL, url: ANDURIL_BLIND_TECH_SCREEN_2023_URL, note: 'A 2023 thread about the one-hour live coding screen for software engineers. Two commenters describe the LeetCode-medium topics they got, one about a year earlier, and a third was questioned closely on their resume.', kind: 'report' },
      { label: 'Anduril: Early careers FAQ', url: ANDURIL_EARLY_CAREERS_URL, note: 'Official page listing a recruiter call, technical and behavioral interviews and role-specific assessments that could include live coding challenges, presentations or technical discussions. It names no frontend format.', kind: 'official' },
      { label: 'Anduril: Frontend Software Engineer posting, Costa Mesa', url: ANDURIL_FRONTEND_POSTING_URL, note: 'Official posting read in October 2026. It describes map-based interfaces for autonomous system command and control, large data streams with performant rendering, React and TypeScript, clearance eligibility and travel of up to 25 percent.', kind: 'official' },
      { label: 'Anduril: Senior Front End Software Engineer, React posting', url: ANDURIL_SENIOR_REACT_POSTING_URL, note: 'Official posting read in October 2026. It asks for React and TypeScript, real-time interfaces with reactive programming libraries and eligibility for a Top Secret clearance; it says nothing about interviews.', kind: 'official' },
    ],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full Anduril practice set',
    copy:
      'Premium unlocks the file explorer tree with keyboard navigation, the React countdown timer and the wider premium library for the same skills.',
    buttonLabel: 'Unlock the full Anduril practice set',
    src: 'company_preview_anduril',
  },
  about: [
    'Anduril frontend interview preparation',
    'React component builds under time pressure',
    'Plain JavaScript and React coding rounds',
    'Frontend system design for real-time data',
  ],
  indexAnchorLabel: 'Anduril frontend interview questions',
};
