import type { AuthoredCompanyPreview } from '../../shared/company-previews/authored-company-preview.model';

/**
 * Spotify frontend interview guide. The reported questions live with the process table
 * (company-interview-processes.ts); the five prompts here are the answer guides of the open fetch-and-render form and of
 * the output-order, closure-limit, traffic-light and friend-activity rows. The stages come from the Life at Spotify pages
 * re-read in November 2026; the questions come from candidates: anonymous interview reviews re-posted on Taro (2018 to
 * 2025) and Blind threads from 2021, 2022 and 2026, all re-read in November 2026. Nothing here is a leaked, confirmed
 * or official Spotify question.
 */
const SPOTIFY_TARO = 'https://www.jointaro.com/interviews/companies/spotify/experiences';
const SPOTIFY_OFFER_2022_URL = 'https://www.teamblind.com/post/weak-system-design-interview-for-spotify-chances-of-no-hire-00wjs6rg';
const SPOTIFY_OFFER_2022_LABEL = 'Blind: web engineer final round with an offer, April 2022';
const SPOTIFY_FOLLOW_UP_2022_URL = 'https://www.teamblind.com/post/spotify-final-round-web-interview-qyug2zqx';
const SPOTIFY_HIRED_2022_URL = 'https://www.teamblind.com/post/Spotify-Web-Engineer-Interview-hNTex8N7';
const SPOTIFY_SCREEN_2021_URL = 'https://www.teamblind.com/post/spotify-senior-web-engineer-interview-k27u5vu7';
const SPOTIFY_FULLSTACK_2026_URL = 'https://www.teamblind.com/post/web-engineering-interview-spotify-gew40ym6';
const SPOTIFY_NY_2019_URL = `${SPOTIFY_TARO}/web-engineer-new-york-ny-march-1-2019-no-offer-neutral-9b0609c4/`;
const SPOTIFY_NY_2019_LABEL = 'Taro: web engineer phone screen, New York, March 2019 (approximate date)';
const SPOTIFY_NL_2019_URL = `${SPOTIFY_TARO}/web-engineer-netherlands-december-21-2019-accepted-offer-positive-5d4d2ae6/`;
const SPOTIFY_STOCKHOLM_2018_URL = `${SPOTIFY_TARO}/javascript-engineer-stockholm-stockholm-march-1-2018-no-offer-positive-f2f80c88/`;
const SPOTIFY_SENIOR_2022_URL = `${SPOTIFY_TARO}/senior-web-engineer-united-states-august-30-2022-no-offer-neutral-e746c706/`;
const SPOTIFY_TORONTO_2022_URL = `${SPOTIFY_TARO}/web-engineer-toronto-on-april-1-2022-no-offer-positive-a2f8744e/`;
const SPOTIFY_NEW_YORK_2025_URL = `${SPOTIFY_TARO}/software-engineer-new-york-ny-february-1-2025-no-offer-positive-0dc5e197/`;
const SPOTIFY_NEW_YORK_2025_LABEL = 'Taro: software engineer loop with a front-end question, New York, February 2025 (approximate date)';
const SPOTIFY_ITALY_2022_URL = `${SPOTIFY_TARO}/senior-fullstack-engineer-italy-june-1-2022-no-offer-negative-0f612934/`;
const SPOTIFY_ITALY_2022_LABEL = 'Taro: senior full-stack engineer loop, Italy, June 2022 (approximate date)';
const SPOTIFY_LONDON_2025_URL = `${SPOTIFY_TARO}/software-engineer-london-england-june-1-2025-no-offer-neutral-25c6c3bb/`;
const SPOTIFY_HOW_WE_HIRE_URL = 'https://www.lifeatspotify.com/start-your-journey';
const SPOTIFY_INTERVIEW_PAGE_URL = 'https://www.lifeatspotify.com/start-your-journey/faq';
const SPOTIFY_JOBS_URL = 'https://jobs.lever.co/spotify';

export const SPOTIFY_PREVIEW_TITLE = 'Spotify Frontend Interview Questions: {#questions} Reported + Prep Guide';
export const SPOTIFY_PREVIEW_H1 = 'Spotify Frontend Interview Questions';
export const SPOTIFY_PREVIEW_DESCRIPTION =
  'Spotify web engineer interview: the recruiter call, the JavaScript and CSS screen, a framework-free web hour in the final and {#questions} reported questions.';
export const SPOTIFY_PREVIEW_CANONICAL_PATH = '/companies/spotify/preview';
export const SPOTIFY_PREVIEW_TRUST_NOTE =
  'Each question is something a Spotify candidate wrote about their own loop, in an anonymous review that Taro re-posts or in a Blind thread, put into our words; Spotify has confirmed none of them, and FrontendAtlas wrote the answer guides. The web engineer accounts stop in 2023, so ask your recruiter what your web round asks for.';

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
      'Spotify\'s hiring pages describe a recruiter call, a second interview with one or two team members and a final round with several. Candidates from 2018 to 2025, most of them web and full-stack engineers, describe how each step went; under the table are the {questions} questions they reported, and the first, a form that fetches from the Spotify API and renders the result, is open.',
    caveat:
      'Most accounts are anonymous reviews re-posted on Taro, many dated only to the month, and the web engineer ones stop in 2023. A 2022 full-stack final and a 2025 software engineer final had a case study and no web hour, so ask your recruiter which interviews your final holds.',
    chips: ['{#questions} reported questions', '{#reports} public reports, 2018–2026', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'What Spotify web loops test: JavaScript, the DOM and CSS by hand, without a framework',
    paragraphs: [
      'Most of the language questions came in the screen. Screens from 2018 to 2022 asked in what order a snippet of timers and promises prints, what a bind call returns, how a closure can cap the number of calls to a function, and how the box model and specificity work, and several set a small task as well: two buttons rebuilt from a mockup, or a balanced-brackets check. In the final\'s web hour, candidates built a form that fetches from the Spotify API and renders the result, a traffic light, or an app or feature they do not describe, in plain HTML, CSS and JavaScript; others answered web domain questions. The 2022 candidate with an offer called it straightforward: a good grasp of HTML and JavaScript fundamentals, nothing arcane and, for them, no CSS.',
      'The other final interviews are an algorithm hour, mostly very basic problems to LeetCode medium though one 2025 loop set a hard one, a system design that goes into the backend, and values. Two 2022 full-stack designs were Spotify features, the friend activity panel and playlist cover uploads, and the 2018 Stockholm infrastructure interview ended on why a site is slow for users in Australia. For values, Spotify\'s pages name values alignment, ownership, adaptability, collaboration and drive; candidates were asked about conflict, feedback, leadership and diversity.',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked November 2026',
    title: 'Where the Spotify accounts come from, and how old they are',
    paragraphs: [
      'The stages come from Spotify\'s Start your journey and interview FAQ pages, re-read in November 2026: a recruiter call by video or phone, a second interview with one or two team members, then a final round with several, one interviewer leading and the others shadowing, with CoderPad and Mural for the technical parts. The rounds and questions come from {reports} public reports: anonymous reviews re-posted on Taro from loops between 2018 and 2025, and Blind threads from 2021, 2022 and 2026, all re-read in November 2026.',
      'The web engineer accounts that give a place are from the United States, Canada and the Netherlands, from 2018 to 2023. The loops from Stockholm, London, Berlin and elsewhere in Europe are mostly full-stack, and the 2025 accounts are software engineer loops, one of them with a front-end question. Taro dates most reviews to the first of a month, a placeholder rather than the interview day, and the only 2026 source is a Blind post written before the final round.',
    ],
  },
  roleLenses: {
    kicker: 'Role lenses',
    title: 'Internal tools and localisation: two kinds of Spotify web work in the October 2026 postings',
    intro:
      'Both lenses come from Spotify web and full-stack postings on Lever in October 2026, not from an interview: no account says either product came up.',
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
    title: 'Answer guides behind the reported Spotify questions',
    intro:
      'Written by FrontendAtlas for the Spotify rows that have one: the reported task, what to ask before coding, what a strong answer shows and the slip that costs the round.',
    itemListName: 'Spotify answer guides',
    items: [
      {
        id: 'search-form-fetch-render-dom',
        title: 'Build a form that fetches from an API and renders the results into the DOM, without a framework',
        statement:
          'Build a form whose input drives a request to an API, the Spotify API in the 2022 account, then render the results into the page with plain DOM APIs: show progress while the request runs, show an empty and an error state, and make sure a slow earlier response never overwrites a newer one.',
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
        id: 'event-loop-output-order',
        title: 'Predict the output order of code that mixes setTimeout and promise chains',
        statement:
          'Read a snippet that logs numbers directly, inside setTimeout, inside a promise, in a chain of then calls and in a setTimeout created inside a promise, then state the exact order of the output and explain why. One 2019 candidate expected the mix to change once their review was posted, so learn the rules rather than one answer.',
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
        reportedRound: { label: SPOTIFY_NY_2019_LABEL, url: SPOTIFY_NY_2019_URL },
      },
      {
        id: 'closure-call-limit',
        title: 'Use a closure to limit how many times a function can run',
        statement:
          'Write a wrapper that takes a function and a limit, calls the function normally up to the limit and returns null on every call after it, without global state. In the reported version, a function that prints 1, wrapped with a limit of two and called three times, gives 1, 1 and then null.',
        whatThisMeasures:
          'Closures, higher-order functions, forwarding this and the arguments, and edge cases around the limit.',
        clarifyFirst: [
          'Confirm what calls after the limit return: null in the reported version, though undefined or the last result are common variants.',
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
        reportedRound: { label: SPOTIFY_NY_2019_LABEL, url: SPOTIFY_NY_2019_URL },
      },
      {
        id: 'traffic-light-html-css-js',
        title: 'Build a traffic light with plain HTML, CSS and JavaScript',
        statement:
          'Render three lights and cycle them on a timer with configurable durations, and add start and stop controls that leave no timer running. One 2022 version also asked for a blinking light and animations.',
        whatThisMeasures:
          'Timers and cleanup, a small state machine in plain JavaScript, CSS for visual states, and how you reason about drift and restarts.',
        clarifyFirst: [
          'Confirm the sequence and the duration of each light, and whether durations can change while it runs.',
          'Confirm which controls exist, such as start, stop or a blinking mode, and what they do mid-cycle.',
        ],
        strongAnswer: [
          'Model the light as an ordered list of states with durations and one function that moves to the next state.',
          'Schedule each transition with a single timer and clear it on stop, so a restart never stacks timers.',
          'Drive the visuals from a class or a data attribute on the container, so CSS owns the colours, the blink and the transitions, with a reduced-motion fallback.',
          'Mention drift: chained setTimeout calls are fine for a demo, and a timestamp check is the fix when accuracy matters.',
        ],
        commonMiss: 'Three independent setInterval calls that drift apart and keep running after stop.',
        resourceLabel: 'Practice timed sequences with a sleep helper (free)',
        resourcePath: '/javascript/coding/js-sleep',
        reportedRound: { label: SPOTIFY_NEW_YORK_2025_LABEL, url: SPOTIFY_NEW_YORK_2025_URL },
      },
      {
        id: 'system-design-full-stack',
        title: 'Design the feature that shows what your friends have been playing',
        statement:
          'Design the panel or feed that shows the songs a user\'s friends played most recently: what the client fetches and when, how new plays reach an open client, what the API returns, and what the backend stores and caches so the feed stays fast.',
        whatThisMeasures:
          'Requirements, the split between the client and the backend, live updates against polling, caching and pagination, privacy settings, and the client states a live feed needs.',
        clarifyFirst: [
          'Confirm what counts as recent, how many friends a user can follow, and whether a listener can hide their activity.',
          'Confirm how fresh the feed must be: live as songs change, or refreshed every so often.',
        ],
        strongAnswer: [
          'Start from requirements and a rough estimate of users, friends per user and plays per minute, then sketch the client, the API and the stores.',
          'Keep each user\'s latest play in a fast store keyed by user and build a feed by reading the friends\' entries, with a cache in front.',
          'Push new plays to open clients over a socket or server-sent events, fall back to polling, and merge updates without reordering the list under the reader.',
          'Cover the client states: loading, empty for a user with no friends, stale data after a reconnect, and a privacy setting that hides a user from every feed.',
        ],
        commonMiss:
          'Designing only the panel in the browser when the interviewer expected the API, the stores and the caching, or only the backend with no word on how the client stays current.',
        resourceLabel: 'Work through a real-time feed design (Premium)',
        resourcePath: '/system-design/scalable-notifications-feed',
        reportedRound: { label: SPOTIFY_ITALY_2022_LABEL, url: SPOTIFY_ITALY_2022_URL },
      },
    ],
  },
  walkthrough: {
    kicker: 'Mini walkthrough',
    title: 'Scope the fetch-and-render form before writing any code',
    intro:
      'Five decisions for the open question, a form that fetches from the Spotify API and renders the result in plain JavaScript, each said out loud before you type.',
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
    intro:
      'The week follows the loop the accounts describe: a recruiter call, a screen of JavaScript and CSS questions with a coding task, then a final with a web hour, algorithms, system design and values.',
    days: [
      { day: 'Day 1', focus: 'Recruiter call: two minutes on your background, why you are looking and why Spotify, the topics a 2022 recruiter covered, with your current stack ready to describe.', artifact: 'A short answer to each, and three questions about the interviews in your final.' },
      { day: 'Day 2', focus: 'Screen questions in JavaScript: the core language behaviour one or two engineers can probe in an hour, each answer said aloud and checked in a console.', artifact: 'Ten short explanations, each with a snippet you can run.' },
      { day: 'Day 3', focus: 'CSS by hand: the rules behind how a page is styled and laid out, explained while you style a small page without a framework.', artifact: 'A styled page and a note on every rule you would defend.' },
      { day: 'Day 4', focus: 'Web hour: the open question, a form that fetches from an API and renders the result in plain JavaScript, built inside an hour with loading, empty and error states.', artifact: 'A working page and a list of what you would add with more time.' },
      { day: 'Day 5', focus: 'Plain JavaScript UI: small components built without a framework, with event handling, cleanup and keyboard access.', artifact: 'Two components that pass a keyboard-only check.' },
      { day: 'Day 6', focus: 'Algorithms and system design: one or two problems in an hour, mostly easy to medium, then a product designed end to end with its backend.', artifact: 'Two solved problems with their complexity, and a one-page design.' },
      { day: 'Day 7', focus: 'Values: stories for ownership, adaptability, collaboration and drive, the qualities Spotify\'s pages name, and for conflict and feedback.', artifact: 'Five stories, and your questions for the recruiter about the web hour and its tools.' },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common Spotify frontend interview preparation questions',
    items: [
      { question: 'Are these the real Spotify questions?', answer: 'No. They are what Spotify candidates wrote about their own loops, mostly in anonymous reviews that Taro re-posts and in Blind threads, put into our words. Spotify has not confirmed any of them; the answer guides and practice tasks come from FrontendAtlas.' },
      { question: 'Do I need React for the web round?', answer: 'The final web rounds in the accounts are plain HTML, CSS and JavaScript; React came up only as a few questions in two 2020 screens. A 2023 senior candidate advised practising vanilla JavaScript, and the 2022 candidate with an offer needed a good grasp of HTML and JavaScript fundamentals and, for them, no CSS. The October 2026 postings list React and TypeScript for the job itself, so prepare plain DOM work for the round and React for talking about your own projects.' },
      { question: 'How long is the technical screen?', answer: 'Between 60 and 90 minutes in the accounts that give a length, with one or two engineers by video or phone. A 2021 senior candidate was told 75 minutes, and a 2022 full-stack screen ran 75 minutes on CoderPad.' },
      { question: 'Is there a take-home?', answer: 'No account here mentions one, and Spotify\'s pages describe interviews only, with CoderPad and Mural for the technical ones. A 2022 Berlin full-stack account lists a coding challenge before the onsite without saying what it was.' },
      { question: 'Do the London and Stockholm teams interview the same way?', answer: 'Most European accounts describe the same pieces as the American ones: a recruiter call, a screen with one or two engineers, then about four final interviews. The 2018 Stockholm JavaScript loop had an infrastructure interview and no separate web round, and a 2022 full-stack loop in Germany had a case study, so ask your recruiter which interviews your final holds.' },
      { question: 'What does the values interview look for?', answer: 'Spotify\'s interview pages ask whether your values align with Spotify\'s, whether you take ownership and pride in what you deliver, and whether you are adaptable, collaborative and driven, and they ask candidates to make their answers on those easy to see. The behavioural questions candidates reported are open in the question list.' },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Free practice for the Spotify web rounds',
    intro:
      'Free drills around the open question and the round formats: requests that ignore stale responses, safe rendering, labelled forms, design structure and values stories. None of them is a locked Spotify question.',
    items: [
      { label: 'Take latest: abort previous requests', description: 'The request-order guard the open form question needs.', path: '/javascript/coding/js-take-latest' },
      { label: 'Fetch JSON with a timeout and abort', description: 'fetch, AbortController and error handling without a framework.', path: '/javascript/coding/js-fetch-json-timeout' },
      { label: 'DOM XSS prevention', description: 'Why API data goes into textContent rather than innerHTML.', path: '/javascript/trivia/js-xss-dom-sinks' },
      { label: 'Contact form with proper labels', description: 'A labelled, accessible form in plain HTML.', path: '/html/coding/html-contact-form-labeled' },
      { label: 'Fetch and render a list with loading, error and empty states', description: 'The same request states, in React.', path: '/react/coding/react-fetch-list-states' },
      { label: 'System design blueprint: architecture', description: 'How to lay out the client, the API and the services in the design hour.', path: '/guides/system-design-blueprint/architecture' },
      { label: 'Behavioural stories', description: 'A structure for the values interview.', path: '/guides/behavioral/stories' },
    ],
  },
  sources: {
    kicker: 'Public interview reports and official context',
    title: 'Sources and evidence limits',
    intro: 'Spotify\'s own pages first, then the candidate accounts this guide leans on most; each note says what that page or account covers.',
    items: [
      { label: 'Life at Spotify: Start your journey', url: SPOTIFY_HOW_WE_HIRE_URL, note: 'Official page, re-read in November 2026: a recruiter call by video or phone, a second interview with one or two team members, a final round with several in which one interviewer leads and the others shadow, Google Meet or Zoom with CoderPad and Mural, the qualities Spotify looks for and a six-month wait before reapplying for a role. It names no interview questions.', kind: 'official' },
      { label: 'Life at Spotify: Interview FAQ', url: SPOTIFY_INTERVIEW_PAGE_URL, note: 'The same stages, the lead-and-shadow format and the tools as questions and answers, re-read in November 2026, with the qualities the interviewers weigh and a reply expected within a few days of the final interview.', kind: 'official' },
      { label: 'Spotify jobs on Lever', url: SPOTIFY_JOBS_URL, note: 'Official open roles. On 22 October 2026 they included a senior web engineer in London and senior full-stack engineers in London and Stockholm; used for the role lenses only.', kind: 'official' },
      { label: SPOTIFY_OFFER_2022_LABEL, url: SPOTIFY_OFFER_2022_URL, note: 'A web engineer for the Personalization team, posting in April 2022 after a final of four interviews; a later reply confirms the offer. The open question and the system design topics this candidate covered come from this thread.', kind: 'report' },
      { label: 'Blind: the same candidate before and after the final, April 2022', url: SPOTIFY_FOLLOW_UP_2022_URL, note: 'The recruiter chat, the description of the web interview the candidate had been given, and their view afterwards: HTML and JavaScript fundamentals, nothing arcane and, for them, no CSS.', kind: 'report' },
      { label: 'Blind: senior web engineer thread, October 2021 to April 2022', url: SPOTIFY_HIRED_2022_URL, note: 'A senior candidate who was working at Spotify by April 2022: algorithm questions and a feature built in JavaScript, HTML and CSS, with no debugging round. A Spotify engineer in the same thread had called the web interview live debugging or coding relevant to the role.', kind: 'report' },
      { label: 'Blind: the same senior candidate before the screen, October 2021', url: SPOTIFY_SCREEN_2021_URL, note: 'Told that the phone screen would last 75 minutes.', kind: 'report' },
      { label: SPOTIFY_NY_2019_LABEL, url: SPOTIFY_NY_2019_URL, note: 'A phone screen on Google Hangouts with two developers: CSS and JavaScript questions that moved to JavaScript alone, and no algorithms.', kind: 'report' },
      { label: 'Taro: web engineer offer, Netherlands, December 2019', url: SPOTIFY_NL_2019_URL, note: 'A web engineer who accepted an offer: a recruiter call and a technical interview on Skype with code shared on screen, CSS questions, an online code challenge with a complexity discussion, and a small HTML and CSS build.', kind: 'report' },
      { label: 'Taro: JavaScript engineer loop, Stockholm, March 2018 (approximate date)', url: SPOTIFY_STOCKHOLM_2018_URL, note: 'A referral for a full-stack JavaScript role leaning frontend: a recruiter phone call, a Skype call with two developers, then four on-site interviews plus lunch on culture, coding, infrastructure and problem solving, in about two weeks.', kind: 'report' },
      { label: 'Taro: senior web engineer loop, United States, August 2022', url: SPOTIFY_SENIOR_2022_URL, note: 'A 15-minute call with a technical recruiter, a virtual round of JavaScript and domain questions with a LeetCode problem, then four one-hour onsite interviews: domain questions, LeetCode medium, values with the hiring manager and system design. No offer.', kind: 'report' },
      { label: 'Taro: web engineer loop, Toronto, April 2022 (approximate date)', url: SPOTIFY_TORONTO_2022_URL, note: 'An HR call and a one-hour first round with JavaScript and CSS questions, a past project and an easy LeetCode problem, then four one-hour final interviews: algorithms, HTML and CSS, system design and a behavioural round.', kind: 'report' },
      { label: SPOTIFY_NEW_YORK_2025_LABEL, url: SPOTIFY_NEW_YORK_2025_URL, note: 'A software engineer loop: a recruiter, a LeetCode Easy screen, then a virtual onsite with system design, a LeetCode Medium problem, a front-end question and a values interview.', kind: 'report' },
      { label: SPOTIFY_ITALY_2022_LABEL, url: SPOTIFY_ITALY_2022_URL, note: 'A senior full-stack candidate who sat seven interviews, usually with one interviewer leading and another shadowing, and only one with questions about personality. The review lists its questions without their rounds.', kind: 'report' },
      { label: 'Taro: software engineer loop, London, June 2025 (approximate date)', url: SPOTIFY_LONDON_2025_URL, note: 'A tech screen with a past project and an easy coding problem, then coding, system design, values and a case study on production troubleshooting; the feedback was that the candidate was not collaborative enough.', kind: 'report' },
      { label: 'Blind: full-stack candidate before the final round, March 2026', url: SPOTIFY_FULLSTACK_2026_URL, note: 'Written before the last round of a full-stack loop: one interview would be on web engineering topics. The thread has no replies on how it went.', kind: 'report' },
    ],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full Spotify practice set',
    copy:
      'Premium opens every locked Spotify row, the practice task and answer guide behind it, and the Premium library for plain JavaScript, CSS and design rounds.',
    buttonLabel: 'Unlock the full Spotify practice set',
    src: 'company_preview_spotify',
  },
  about: [
    'Spotify web engineer interview process',
    'Spotify plain HTML, CSS and JavaScript web round',
    'Reported Spotify frontend interview questions',
    'Spotify values interview',
  ],
  indexAnchorLabel: 'Spotify frontend interview questions',
};
