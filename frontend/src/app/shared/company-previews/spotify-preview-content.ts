import type { AuthoredCompanyPreview } from '../../shared/company-previews/authored-company-preview.model';

/**
 * Spotify frontend interview guide. Every prompt is a FrontendAtlas practice version modelled on public,
 * self-reported web engineer accounts (Blind threads from 2019 to 2022, public previews of Glassdoor reports)
 * and on the official Life at Spotify hiring pages. Nothing here is a leaked, confirmed or official Spotify
 * question, and the detailed web accounts do not state a European office.
 */
const SPOTIFY_OFFER_2022_URL = 'https://www.teamblind.com/post/weak-system-design-interview-for-spotify-chances-of-no-hire-00wjs6rg';
const SPOTIFY_OFFER_2022_LABEL = 'Public report: Spotify web engineer final round with an offer, April 2022';
const SPOTIFY_FOLLOW_UP_2022_URL = 'https://www.teamblind.com/post/Spotify-Final-Round-Web-Interview-QyUG2ZqX';
const SPOTIFY_THREAD_2021_URL = 'https://www.teamblind.com/post/Spotify-Web-Engineer-Interview-hNTex8N7';
const SPOTIFY_THREAD_2021_LABEL = 'Public report: Spotify web engineer interview thread, 2021 to 2022';
const SPOTIFY_STOCKHOLM_2019_URL = 'https://www.teamblind.com/post/spotify-frontend-interview-4ghdysqn';
const SPOTIFY_GLASSDOOR_URL = 'https://www.glassdoor.com/Interview/Spotify-Web-Engineer-Interview-Questions-EI_IE408251.0,7_KO8,20.htm';
const SPOTIFY_INTERN_2018_URL = 'https://medium.com/@christinacook/interning-at-spotify-as-a-web-developer-5a1b72ee24b2';
const SPOTIFY_ANDROID_2022_URL = 'https://medium.com/@asifshaikh_39930/getting-interviewed-at-spotify-fdcca55d8ebf';
const SPOTIFY_HOW_WE_HIRE_URL = 'https://www.lifeatspotify.com/start-your-journey';
const SPOTIFY_INTERVIEW_PAGE_URL = 'https://www.lifeatspotify.com/start-your-journey/faq';
const SPOTIFY_JOBS_URL = 'https://jobs.lever.co/spotify';

export const SPOTIFY_PREVIEW_TITLE = 'Spotify Frontend Interview Questions: 7 Prompts + Prep Guide';
export const SPOTIFY_PREVIEW_H1 = 'Spotify Frontend Interview Questions';
export const SPOTIFY_PREVIEW_DESCRIPTION =
  'Prepare for a Spotify web engineer interview with 7 frontend practice prompts: a fetch-to-DOM form, carousel, traffic light, event loop, system design.';
export const SPOTIFY_PREVIEW_CANONICAL_PATH = '/companies/spotify/preview';
export const SPOTIFY_PREVIEW_TRUST_NOTE =
  'These are FrontendAtlas practice versions modelled on rounds described in public interview reports, not leaked, confirmed or official Spotify questions. The detailed web accounts do not state a European office; use recruiter-provided material as the source of truth.';

export const SPOTIFY_COMPANY_PREVIEW: AuthoredCompanyPreview = {
  slug: 'spotify',
  label: 'Spotify',
  title: SPOTIFY_PREVIEW_TITLE,
  h1: SPOTIFY_PREVIEW_H1,
  description: SPOTIFY_PREVIEW_DESCRIPTION,
  canonicalPath: SPOTIFY_PREVIEW_CANONICAL_PATH,
  trustNote: SPOTIFY_PREVIEW_TRUST_NOTE,
  hero: {
    kicker: 'Public Spotify prep guide',
    subtitle:
      'Prepare with seven practice prompts shaped by public web engineer accounts from 2021 and 2022, more recent Glassdoor previews and the official Life at Spotify pages: a search form that fetches from an API and renders into the DOM without a framework, an image carousel as a practice build, a traffic light, an event-loop output question, a closure that limits calls, a system-design round that includes the backend, and the algorithms round.',
    caveat:
      'This guide uses public, self-reported interview accounts and the official Spotify hiring pages to create realistic constraints. It does not claim access to private interview material, a fixed interview format, or the stack of every Spotify team.',
    chips: ['7 practice prompts', 'HTML, JavaScript, DOM, system design', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'Prepare for product judgment, not Spotify trivia',
    paragraphs: [
      'The public accounts of the web loop describe a recruiter chat, then a final round of four interviews: data structures and algorithms, a web practical, system design, and values. The web practical is where frontend preparation pays off, and it is framework-free. One candidate who received an offer built a form, fetched data from the Spotify API based on the input and rendered the result into the DOM; another, who joined Spotify, described building a feature with JavaScript, HTML and CSS and no debugging round. The first candidate wrote afterwards that the interviews needed a good grasp of HTML and JavaScript fundamentals, tested no arcane concepts and, for them, needed no CSS.',
      'Public previews of Glassdoor web engineer reports add JavaScript fundamentals under questioning: the output order of code that mixes setTimeout and promise chains, a closure that limits how many times a function can run, event delegation, memoization and the CSS box model, and a traffic light built in plain HTML, CSS and JavaScript. Each prompt below starts with the clarifying questions a strong candidate asks, then the behaviours a strong answer covers, then the miss that usually ends the round.',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked October 2026',
    title: 'What the public accounts and the official pages establish, and what you still need to confirm',
    paragraphs: [
      'Four Blind threads inform the web loop. April 2022, a web engineer candidate for a personalization team who received an offer: a recruiter chat about why they were looking, why Spotify, their current week and their stack, then a final round of four interviews (data structures and algorithms, web development, behavioural and values, system design); the web task was to build a form, fetch data from the Spotify API based on the input and render the result into the DOM, and the system-design discussion covered requirements, CAP trade-offs, database choice, how the layers interact, load balancing, message queues and caches. October 2021 to April 2022, a second thread: a Spotify engineer summarised the rounds as LeetCode-style algorithms and a live coding session relevant to the role, the original poster, who joined Spotify, described algorithm questions and building a feature with JavaScript, HTML and CSS with no debugging round, and the April 2022 candidate, before the final round, relayed being told the web round was a practical application of HTML, CSS and JavaScript, asked whether that meant debugging or building from scratch, and gave an image carousel as an example of their own; no account reports a carousel task. A 2019 thread opened by a Stockholm applicant has one commenter expecting algorithms, system design, values and a JavaScript web round, and another saying the process differs by country. Public previews of Glassdoor web engineer reports add the closure-limit prompt, and their full text could not be read by our tools; the output-order and traffic-light prompts also appear in Taro accounts from August 2022 and February 2025, and an April 2022 Taro account lists closures, memoization and event delegation.',
      'Two Medium posts give context outside the web loop: a 2018 web developer internship with a 30-minute behavioural interview and a 90-minute interview on CSS and JavaScript questions, and a 2022 Android loop in Stockholm with four one-hour final interviews (algorithms, system design, a pair-programming session in your own IDE, values), each with a second interviewer shadowing. The official Life at Spotify pages describe a recruiter call, a second interview with one or two team members, a final round with several band members, CoderPad and Mural for technical work, and an assessment of values, ownership, adaptability, collaboration and drive. Together they establish the round types in accounts from 2018 to 2022 and in more recent previews; they do not establish exact wording, the current web format, or how the London and Stockholm teams interview. Confirm the format, the tools and the timing with the recruiter.',
    ],
  },
  roleLenses: {
    kicker: 'Role lenses',
    title: 'Two product contexts for practising transferable frontend judgment',
    intro:
      'These are preparation lenses based on the open Spotify web and full-stack postings in October 2026, not claimed team assignments. Choose the lens closest to the role and keep the reasoning framework-neutral.',
    items: [
      {
        title: 'Internal business tools',
        description:
          'The Subscriptions mission builds internal products that let teams launch, configure and manage Premium offers through guided workflows, and the Platform team builds Groove for planning and dependency tracking, both with React and TypeScript.',
        practiceFocus:
          'Multi-step forms with validation and safe defaults, permissions and audit trails, optimistic edits with rollback, GraphQL contracts, and keyboard-first data entry.',
      },
      {
        title: 'Internationalisation platform',
        description:
          'The Stockholm Platform posting builds the localisation workflows and global rollouts behind more than 180 markets.',
        practiceFocus:
          'Locale-aware formatting with Intl, right-to-left layout, text expansion and truncation, pluralisation, and feature rollout by market.',
      },
    ],
  },
  prompts: {
    kicker: 'Representative practice prompts',
    title: 'Seven Spotify frontend interview practice questions',
    intro:
      'For each prompt, clarify the contract, explain ownership and trade-offs, implement or diagram the smallest credible slice, and test the failure cases. Prompts modelled on a report read in full link to it; the others draw on the Glassdoor previews listed under the sources.',
    itemListName: 'Seven Spotify frontend interview practice prompts',
    items: [
      {
        id: 'search-form-fetch-render-dom',
        title: 'Build a search form that fetches from an API and renders the results into the DOM, without a framework',
        statement:
          'Build a form whose input drives a request to a public API, then render the results into the page with plain DOM APIs: show progress while the request runs, show an empty and an error state, and make sure a slow earlier response never overwrites a newer one.',
        whatThisMeasures:
          'HTML and JavaScript fundamentals without a framework, fetch and error handling, safe DOM rendering, request ordering, and accessible form behaviour.',
        clarifyFirst: [
          'Confirm whether the request runs on submit or on every input, and whether a debounce is expected.',
          'Confirm the response shape, the empty case and how the request is authenticated, if at all.',
        ],
        strongAnswer: [
          'Use a real form element with a label and handle submit, so Enter works and keyboard and screen-reader behaviour come for free.',
          'Build result rows with createElement and textContent rather than innerHTML, so API data cannot inject markup.',
          'Keep one status at a time (idle, loading, results, empty, error) and render only that branch.',
          'Abort the previous request or tag each request with an id, and ignore any response that is not the latest.',
        ],
        commonMiss:
          'Concatenating API strings into innerHTML, and letting a slow first response replace the results of a later query.',
        resourceLabel: 'Practice cancelling stale requests (free)',
        resourcePath: '/javascript/coding/js-take-latest',
        reportedRound: { label: SPOTIFY_OFFER_2022_LABEL, url: SPOTIFY_OFFER_2022_URL },
      },
      {
        id: 'image-carousel-html-css-js',
        title: 'Build an image carousel with HTML, CSS and JavaScript',
        statement:
          'A practice instance of the build-a-feature round the 2021 to 2022 thread reports; the carousel itself was one candidate\'s example, not a reported task. Build a carousel that shows one image at a time with previous and next controls, wraps at both ends, and stays usable from the keyboard and with a screen reader.',
        whatThisMeasures:
          'DOM state without a framework, CSS for layout and transitions, event handling, and accessibility of interactive controls.',
        clarifyFirst: [
          'Confirm whether it should autoplay, loop and show indicators, and what happens when the window resizes.',
          'Confirm whether the images are known up front or loaded from an endpoint.',
        ],
        strongAnswer: [
          'Keep the current index as the single source of truth and derive the visible slide and the indicator state from it.',
          'Use buttons with accessible names for the controls, and announce the current slide with a live region or ARIA attributes.',
          'Pause autoplay on hover and focus, and respect prefers-reduced-motion.',
          'Wrap with modulo arithmetic so the first and last slides behave like any other.',
        ],
        commonMiss:
          'Clickable divs without keyboard support, and autoplay that keeps moving while the user is reading or focused on a control.',
        resourceLabel: 'Practice the image slider (Premium)',
        resourcePath: '/react/coding/react-image-slider',
        reportedRound: { label: SPOTIFY_THREAD_2021_LABEL, url: SPOTIFY_THREAD_2021_URL },
      },
      {
        id: 'traffic-light-html-css-js',
        title: 'Build a traffic light with plain HTML, CSS and JavaScript',
        statement:
          'Render three lights and cycle them on a timer with configurable durations, and add start and stop controls that leave no timer running.',
        whatThisMeasures:
          'Timers and cleanup, a small state machine in plain JavaScript, CSS for visual states, and how you reason about drift and restarts.',
        clarifyFirst: [
          'Confirm the sequence and the duration of each light, and whether durations can change while it runs.',
          'Confirm which controls exist, such as start, stop or a pedestrian button, and what they do mid-cycle.',
        ],
        strongAnswer: [
          'Model the light as an ordered list of states with durations and one function that moves to the next state.',
          'Schedule each transition with a single timer and clear it on stop, so a restart never stacks timers.',
          'Drive the visuals from a class or a data attribute on the container, so CSS owns the colours.',
          'Mention drift: chained setTimeout calls are fine for a demo, and a timestamp check is the fix when accuracy matters.',
        ],
        commonMiss: 'Three independent setInterval calls that drift apart and keep running after stop.',
        resourceLabel: 'Practice timed sequences with a sleep helper (free)',
        resourcePath: '/javascript/coding/js-sleep',
      },
      {
        id: 'event-loop-output-order',
        title: 'Predict the output order of code that mixes setTimeout and promise chains',
        statement:
          'Read a snippet that combines synchronous logs, setTimeout, a setTimeout inside a promise and a chain of promises, then state the exact order of the output and explain why.',
        whatThisMeasures:
          'A precise model of the event loop, the call stack, the microtask queue and task scheduling, and the ability to explain it step by step.',
        clarifyFirst: [
          'Confirm the runtime, browser or Node, since some ordering details differ between them.',
          'Read the whole snippet once before answering and note every promise that is already resolved.',
        ],
        strongAnswer: [
          'Run the synchronous code first and write down each log in order.',
          'Drain the microtask queue, promise callbacks in the order they were queued, before any timer runs.',
          'Treat each setTimeout callback as a new task; promise callbacks it queues run before the next timer.',
          'Say the rule out loud as you go, so a slip on one line does not hide the model.',
        ],
        commonMiss: 'Assuming setTimeout with zero delay runs before a resolved promise callback.',
        resourceLabel: 'Practice nested microtask output (free)',
        resourcePath: '/javascript/trivia/js-event-loop-nested-microtask-output',
      },
      {
        id: 'closure-call-limit',
        title: 'Write a closure that limits how many times a function can run',
        statement:
          'Implement a wrapper that takes a function and a limit, calls the function normally up to the limit, and returns undefined for every call after that, without global state.',
        whatThisMeasures:
          'Closures, higher-order functions, forwarding this and the arguments, and edge cases around the limit.',
        clarifyFirst: [
          'Confirm what calls after the limit return: undefined, the last result or an error.',
          'Confirm whether this and the arguments must be forwarded, and whether the limit can be zero.',
        ],
        strongAnswer: [
          'Keep the call count inside the closure, not on the function or in a module variable.',
          'Forward this and the arguments with apply, and return the result of each allowed call.',
          'Handle a limit of zero and negative limits explicitly.',
          'Note that once is the limit-one case and that a reset function is a small extension.',
        ],
        commonMiss:
          'A counter in an outer variable shared by every wrapped function, so wrapping a second function breaks the first.',
        resourceLabel: 'Practice once, the limit-one case (free)',
        resourcePath: '/javascript/coding/js-once',
      },
      {
        id: 'system-design-full-stack',
        title: 'Design a product end to end in the system-design round, backend included',
        statement:
          'Take a product-style prompt from requirements to architecture: the client, the API, the data store and the pieces that keep it fast and available, then defend the trade-offs.',
        whatThisMeasures:
          'Requirements gathering, how the layers interact, storage and consistency choices, and scaling tools such as load balancing, queues and caches, the topics one web engineer account lists for this round.',
        clarifyFirst: [
          'Confirm the core use cases, the expected scale and which parts the interviewer wants in depth.',
          'Confirm the consistency needs, for example whether users must see their own writes immediately.',
        ],
        strongAnswer: [
          'Start from requirements and a rough capacity estimate, then sketch the client, the API, the services and the storage.',
          'Choose the data store by access pattern and state what you give up under a partition, using the CAP framing where it helps.',
          'Add load balancing, a queue for slow work and caches at the client, the edge and the service, each with an invalidation rule.',
          'Close with the frontend view: loading states, pagination and what the client does when a dependency fails.',
        ],
        commonMiss:
          'Designing only the browser layer when the interviewer expected the database, queues and caches as well.',
        resourceLabel: 'Read the system design blueprint on architecture (free)',
        resourcePath: '/guides/system-design-blueprint/architecture',
        reportedRound: { label: SPOTIFY_OFFER_2022_LABEL, url: SPOTIFY_OFFER_2022_URL },
      },
      {
        id: 'algorithms-round',
        title: 'Clear the data structures and algorithms round',
        statement:
          'Solve one or two LeetCode-style problems in CoderPad, explain the complexity as you go, and keep the code readable enough to extend when the interviewer adds a follow-up.',
        whatThisMeasures:
          'Clean fundamentals, choosing a data structure for the access pattern, edge cases, and communication while coding.',
        clarifyFirst: [
          'Confirm the input size and the constraints before choosing an approach.',
          'Confirm whether the interviewer wants a working solution first or the optimal one straight away.',
        ],
        strongAnswer: [
          'Start with a correct solution that passes the examples, then improve it if the constraints demand it.',
          'Use maps, sets and stacks where they remove nested loops, and state the complexity.',
          'Test empty input, one element and duplicates aloud before declaring the answer done.',
          'Keep names and helpers clean, since the same interviewer may ask for an extension.',
        ],
        commonMiss: 'Jumping to an optimised solution before a working one exists, then running out of time.',
        resourceLabel: 'Read the data structures and algorithms blueprint for frontend loops',
        resourcePath: '/guides/interview-blueprint/dsa-for-fe',
        reportedRound: { label: SPOTIFY_THREAD_2021_LABEL, url: SPOTIFY_THREAD_2021_URL },
      },
    ],
  },
  walkthrough: {
    kicker: 'Public mini walkthrough',
    title: 'Scope the fetch-to-DOM search form before writing the first line',
    intro:
      'Treat this as a representative exercise, not a description of the reported one. Work from the contract toward the rendering, and say each decision out loud.',
    steps: [
      { title: 'Pin the trigger', description: 'Submit or every keystroke; if every keystroke, agree on a debounce and on what an empty query shows.' },
      { title: 'Choose one status', description: 'Idle, loading, results, empty or error, held in one variable, with one render function that switches on it.' },
      { title: 'Render safely', description: 'createElement and textContent for every value that comes from the API, and a single container that is replaced on each render.' },
      { title: 'Guard the request order', description: 'Abort the previous request or compare a request id, so only the latest response can reach the screen.' },
      { title: 'Keep it accessible', description: 'A labelled input inside a form, a real submit button, and a polite live region that announces the result count.' },
    ],
  },
  prepPlan: {
    kicker: 'Actionable preparation',
    title: 'A 7-day Spotify frontend interview preparation plan',
    intro: 'Every day ends with code, a test, a design artifact, or a question you can use in the real process.',
    days: [
      { day: 'Day 1', focus: 'DOM fundamentals without a framework: forms, events, createElement, textContent and event delegation.', artifact: 'A search form that renders rows safely from a fixture.' },
      { day: 'Day 2', focus: 'Fetch and request order: loading, empty and error states, and aborting the previous request.', artifact: 'The same form against a public API with a stale-response guard.' },
      { day: 'Day 3', focus: 'UI components in plain JavaScript: a carousel as a practice build and the traffic light a February 2025 account reports, each with cleanup and keyboard access.', artifact: 'Two components that pass a keyboard-only check.' },
      { day: 'Day 4', focus: 'JavaScript fundamentals under questioning: event-loop output order, closures, this, memoization and the CSS box model.', artifact: 'Five snippets with the written output and the rule behind each.' },
      { day: 'Day 5', focus: 'Algorithms: two LeetCode-style problems a day under CoderPad conditions, with the complexity stated.', artifact: 'Four solved problems with their edge cases listed.' },
      { day: 'Day 6', focus: 'System design end to end: requirements, the API, the data store, caches, queues and the client view.', artifact: 'A one-page design with the trade-offs you would defend.' },
      { day: 'Day 7', focus: 'Values and a mock loop: stories for ownership, adaptability, collaboration and drive, then one narrated round of each type.', artifact: 'A list of questions for the recruiter about the web round, the tools and the timing.' },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common Spotify frontend interview preparation questions',
    items: [
      { question: 'Are these the real Spotify questions?', answer: 'No. They are FrontendAtlas practice versions modelled on round types described in public, self-reported accounts and on the official Life at Spotify pages. The wording, the data and the test cases are ours.' },
      { question: 'Do I need React for the web round?', answer: 'The accounts used here describe HTML and JavaScript fundamentals and building a feature with JavaScript, HTML and CSS rather than a framework exercise, and one candidate needed no CSS at all. The current postings list React and TypeScript for the job itself, so prepare plain DOM work for the round and React for the conversation about your experience.' },
      { question: 'Is there a take-home?', answer: 'The official pages do not mention one, and none of the web accounts used here describes one. The official FAQ names CoderPad and Mural for the technical parts.' },
      { question: 'Do the London and Stockholm teams interview the same way?', answer: 'The detailed web accounts do not state a European office. A 2019 thread has a commenter saying the process differs by country, and a 2022 Stockholm Android account describes a final of four interviews with a second interviewer shadowing, the same shape the official page describes. Confirm the format for your office with the recruiter.' },
      { question: 'What does the values interview look for?', answer: 'The official interview page names values alignment, ownership and pride in what you deliver, adaptability, collaboration and drive, and asks candidates to make their answers on those qualities easy to see. Prepare one story for each.' },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Build the underlying skills with free practice',
    intro:
      'These public pages cover the DOM, request-order, event-loop, closure, CSS and design skills used by the practice prompts. They are supporting drills, not claimed Spotify questions.',
    items: [
      { label: 'Take latest: abort previous requests', description: 'The request-order guard behind the search form.', path: '/javascript/coding/js-take-latest' },
      { label: 'Fetch and render a list with loading, error and empty states', description: 'The same request states, in React.', path: '/react/coding/react-fetch-list-states' },
      { label: 'Nested microtask output', description: 'The output-order reasoning the event-loop question checks.', path: '/javascript/trivia/js-event-loop-nested-microtask-output' },
      { label: 'Once', description: 'A closure that limits a function to one call.', path: '/javascript/coding/js-once' },
      { label: 'Closures', description: 'Lexical scope and the state a wrapper keeps.', path: '/javascript/trivia/js-closures' },
      { label: 'Event delegation', description: 'One listener for many rows or controls.', path: '/javascript/trivia/js-event-delegation' },
      { label: 'Memoization', description: 'Caching results and choosing the cache key.', path: '/javascript/trivia/js-memoization' },
      { label: 'The CSS box model', description: 'Content, padding, border and margin, and box-sizing.', path: '/css/trivia/css-box-model' },
      { label: 'System design blueprint: architecture', description: 'How to lay out the client, the API and the services.', path: '/guides/system-design-blueprint/architecture' },
      { label: 'Behavioural stories', description: 'A structure for the values interview.', path: '/guides/behavioral/stories' },
    ],
  },
  sources: {
    kicker: 'Public interview reports and official context',
    title: 'Sources and evidence limits',
    intro: 'These links support the public context used by the guide. Their notes state what each source can and cannot establish about preparation.',
    items: [
      { label: SPOTIFY_OFFER_2022_LABEL, url: SPOTIFY_OFFER_2022_URL, note: 'One self-reported web engineer loop with an offer. It establishes the four-interview final, the form that fetches from the Spotify API and renders into the DOM, and the topics of the system-design discussion; it gives no location and cannot establish the current format.', kind: 'report' },
      { label: 'Blind: Spotify final round web interview thread, April 2022', url: SPOTIFY_FOLLOW_UP_2022_URL, note: 'The same candidate before and after the final round: the recruiter chat topics, and the view that the round needed HTML and JavaScript fundamentals and, for them, no CSS. Several replies are hidden behind a sign-up.', kind: 'report' },
      { label: SPOTIFY_THREAD_2021_LABEL, url: SPOTIFY_THREAD_2021_URL, note: 'A thread with a Spotify engineer summarising the rounds, a candidate who joined describing algorithms and a build-a-feature round with no debugging, and one candidate asking whether the web round would be debugging or building, with an image carousel as their own example. Details were exchanged in private messages and are not visible.', kind: 'report' },
      { label: 'Blind: Spotify frontend interview thread from a Stockholm applicant, 2019', url: SPOTIFY_STOCKHOLM_2019_URL, note: 'The only web thread tied to a European office. It records expected rounds and a comment that the process differs by country; nobody in the visible replies describes an actual Stockholm web loop.', kind: 'report' },
      { label: 'Glassdoor: Spotify web engineer interview reports', url: SPOTIFY_GLASSDOOR_URL, note: 'Public previews mention an output-order question mixing setTimeout and promise chains, a closure that limits how many times a function can run, JavaScript and CSS basics, and a traffic light in plain HTML, CSS and JavaScript. The full reports could not be read by our tools, so nothing else from them is used.', kind: 'report' },
      { label: 'Public report: Spotify senior web engineer interview on Taro, 2022', url: 'https://www.jointaro.com/interviews/companies/spotify/experiences/senior-web-engineer-united-states-august-30-2022-no-offer-neutral-e746c706/', note: 'A technical screen with an output-order question about console logs printed from timeouts and functions.', kind: 'report' },
      { label: 'Public report: Spotify web engineer interview on Taro, 2022', url: 'https://www.jointaro.com/interviews/companies/spotify/experiences/web-engineer-toronto-on-april-1-2022-no-offer-positive-a2f8744e/', note: 'A one-hour first round on closures and memoization, event listeners and event delegation. Taro dates are approximate.', kind: 'report' },
      { label: 'Public report: Spotify software engineer interview on Taro, 2025', url: 'https://www.jointaro.com/interviews/companies/spotify/experiences/software-engineer-new-york-ny-february-1-2025-no-offer-positive-0dc5e197/', note: 'A round asking to simulate traffic lights in plain HTML, JavaScript and CSS. Taro dates are approximate.', kind: 'report' },
      { label: 'Medium: Interning as a Web Developer at Spotify, September 2018', url: SPOTIFY_INTERN_2018_URL, note: 'An internship account with a 30-minute behavioural interview and a 90-minute interview on CSS and JavaScript questions. It is an early-career process from 2018, not the current web engineer loop.', kind: 'report' },
      { label: 'Medium: Getting Interviewed at Spotify, February 2022', url: SPOTIFY_ANDROID_2022_URL, note: 'A Stockholm Android loop: four one-hour final interviews (algorithms, system design, pair programming in your own IDE, values), each with a second interviewer. It shows the Stockholm final shape for mobile, not the web practical.', kind: 'report' },
      { label: 'Life at Spotify: Start your journey', url: SPOTIFY_HOW_WE_HIRE_URL, note: 'Official hiring stages, response times and the six-month reapply rule. It names no interview questions.', kind: 'official' },
      { label: 'Life at Spotify: Interview FAQ', url: SPOTIFY_INTERVIEW_PAGE_URL, note: 'Official interview stages, the lead-and-shadow format, CoderPad and Mural for technical work, and the qualities assessed. It names no interview questions.', kind: 'official' },
      { label: 'Spotify jobs on Lever', url: SPOTIFY_JOBS_URL, note: 'Official open roles. On 22 October 2026 they include a senior web engineer in London and senior full-stack engineers in London and Stockholm; used for product and stack context only.', kind: 'official' },
    ],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full Spotify practice set',
    copy:
      'This public guide is complete enough to plan a focused week. Premium unlocks the company-tagged Spotify set, including the image slider and the debounced search, and the wider premium library of coding, concept and system-design practice.',
    buttonLabel: 'Unlock the full Spotify practice set',
    src: 'company_preview_spotify',
  },
  about: [
    'Spotify frontend interview preparation',
    'Framework-free DOM and fetch exercises',
    'JavaScript event loop and closure questions',
    'Full-stack system design for web engineers',
  ],
  indexAnchorLabel: 'Spotify frontend interview questions',
};
