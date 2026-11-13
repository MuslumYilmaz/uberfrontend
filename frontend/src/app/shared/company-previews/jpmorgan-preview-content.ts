import type { AuthoredCompanyPreview } from '../../shared/company-previews/authored-company-preview.model';

/**
 * JPMorgan Chase frontend interview guide. The reported questions live with the process table
 * (company-interview-processes.ts); the prompts here are the answer guides of several of them. The sources are public,
 * self-reported accounts from 2017 to 2026 on Taro, Aced, Blind, LeetCode Discuss, frontendgeek and Medium, plus the
 * official hiring pages. Nothing here is a leaked, confirmed or official JPMorgan Chase question; each team runs its
 * own loop, and the accounts cannot establish a fixed format.
 */
const JPMORGAN_ACED_2026_URL = 'https://www.aced.io/experiences/jp-morgan-chase-senior-frontend-engineer-interview-6faa4e';
const JPMORGAN_ACED_2026_LABEL = 'Public report: Aced senior frontend engineer loop, 2026';
const JPMORGAN_HOUSTON_2022_URL =
  'https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/react-developer-united-states-june-1-2022-no-offer-positive-87452f0d/';
const JPMORGAN_HOUSTON_2022_LABEL = 'Public report: Taro React developer loop, June 2022 (approximate date)';
const JPMORGAN_US_2022_URL =
  'https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/frontend-developer-united-states-january-2-2022-no-offer-positive-5a4dea31/';
const JPMORGAN_US_2022_LABEL = 'Public report: Taro frontend developer loop, January 2022';
const JPMORGAN_BENGALURU_2024_URL =
  'https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/frontend-engineer-bengaluru-karnataka-april-1-2024-no-offer-negative-77dc2081/';
const JPMORGAN_BENGALURU_2024_LABEL = 'Public report: Taro frontend engineer screen, April 2024 (approximate date)';
const JPMORGAN_LEAD_2025_URL =
  'https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/lead-software-engineer-united-states-march-13-2025-no-offer-positive-5ec74572/';
const JPMORGAN_LEAD_2025_LABEL = 'Public report: Taro lead software engineer panel, March 2025';
const JPMORGAN_UK_2025_URL =
  'https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/associate-software-engineer-united-kingdom-february-1-2025-no-offer-negative-7f96780a/';
const JPMORGAN_UK_2025_LABEL = 'Public report: Taro associate software engineer interview, United Kingdom, February 2025';
const JPMORGAN_FRONTENDGEEK_2024_URL =
  'https://www.frontendgeek.com/interview-experience/frontend-interview-experience-at-jp-morgan-refused-offer---9f684f90-12ee-45ec-ac82-e40d2010260e';
const JPMORGAN_FRONTENDGEEK_2024_LABEL = 'Public report: frontendgeek SDE2 frontend loop, Bengaluru, April 2024';
const JPMORGAN_LEETCODE_2021_URL = 'https://leetcode.com/discuss/post/1076639/';
const JPMORGAN_LEETCODE_2021_LABEL = 'Public report: LeetCode onsite across several teams, New York, February 2021';
const JPMORGAN_BLIND_2023_URL = 'https://www.teamblind.com/post/jp-morgan-interview-tips-ohvqbeuy';
const JPMORGAN_BLIND_2023_LABEL = 'Public report: Blind React software engineer interview, London, May 2023';
const JPMORGAN_HOW_WE_HIRE_URL = 'https://www.jpmorganchase.com/careers/how-we-hire';
const JPMORGAN_HIRING_FAQS_URL = 'https://www.jpmorganchase.com/careers/how-we-hire/faqs';
const JPMORGAN_PROGRAM_URL = 'https://www.jpmorganchase.com/careers/explore-opportunities/programs/software-engineer-fulltime';

export const JPMORGAN_PREVIEW_TITLE = 'JPMorgan Chase Frontend Interview Questions and React Round Guide';
export const JPMORGAN_PREVIEW_H1 = 'JPMorgan Chase Frontend Interview Questions';
export const JPMORGAN_PREVIEW_DESCRIPTION =
  'JPMorgan Chase frontend interview: the React and JavaScript conversation, live coding, the Bengaluru security round and the super day, with {#questions} reported questions.';
export const JPMORGAN_PREVIEW_CANONICAL_PATH = '/companies/jpmorgan/preview';
export const JPMORGAN_PREVIEW_TRUST_NOTE =
  'The questions come from candidates\' own accounts on Taro, Aced, Blind, LeetCode Discuss, frontendgeek and Medium, written here in our words; none is a leaked, confirmed or official JPMorgan Chase question, and the answer guides are ours. Each team runs its own loop: {reports} public reports show what some JPMorgan Chase teams asked, not what yours will, so the recruiter\'s account of your rounds comes first.';

export const JPMORGAN_COMPANY_PREVIEW: AuthoredCompanyPreview = {
  slug: 'jpmorgan',
  label: 'JPMorgan Chase',
  title: JPMORGAN_PREVIEW_TITLE,
  h1: JPMORGAN_PREVIEW_H1,
  description: JPMORGAN_PREVIEW_DESCRIPTION,
  canonicalPath: JPMORGAN_PREVIEW_CANONICAL_PATH,
  trustNote: JPMORGAN_PREVIEW_TRUST_NOTE,
  hero: {
    kicker: 'Public JPMorgan Chase prep guide',
    subtitle:
      'Frontend accounts from 2017 to 2026 in the UK, the US and India describe a recruiter call, an hour of JavaScript and React questions often split between two interviewers, a live-coding round of 30 to 90 minutes and a hiring-manager conversation, with each team setting its own loop. Below: how each round ran, then {questions} questions candidates reported; the first, a generic memoization function from a 2024 Bengaluru loop, is open.',
    caveat:
      'No two accounts describe the same loop, and JPMorgan Chase\'s own hiring page says the process differs for each position. Most accounts are a few lines long, several Taro dates are approximate, and the super-day shape comes from generic software-engineer loops rather than frontend-titled ones.',
    chips: ['{#questions} reported questions', '{#reports} public reports, 2017–2026', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'Learn the recurring questions, then rehearse your team\'s shape',
    paragraphs: [
      'The JPMorgan Chase accounts agree on the questions more than on the format. A closure question appears in three accounts, from the UK in 2021 and 2023 and from India in 2024; the other conversation questions, from clones and Object.assign to useCallback against useMemo, useState against useRef, context and higher-order components, cookies against web storage, CORS and the event loop, each come from one account, so learn them as one set of two-sentence answers. The coding is small and exact: a generic memoization function and a reduce polyfill in Bengaluru, a generic async promise hook with a useEffect cleanup in a 2026 UK senior loop, a to-do list with priorities in a 2022 React developer loop.',
      'The loop itself is team-run. The official How we hire page says the interview process will differ for each position, and JPMorgan Chase-badged commenters on Blind say it depends on the line of business. One Bengaluru SDE2 loop in 2024 ran three 60-minute rounds in one sitting, opening with security and React; a 2026 senior loop was a recruiter screen and one live-coding round over two weeks; a React developer in 2022 had three video interviews, one of them run by an interviewer assigned to a back-end role; a 2025 lead-level panel put three lead engineers in one hour. Prepare the recurring questions first, then rehearse the shape the recruiter describes.',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked October 2026',
    title: 'What these accounts can tell you, and what to ask the recruiter',
    paragraphs: [
      'The accounts behind this guide are candidates\' own posts on Taro, Aced, Blind, LeetCode Discuss, frontendgeek and Medium from 2017 to 2026, from the UK, the US and India, read beside JPMorgan Chase\'s own hiring pages. Most frontend accounts run to one to three lines; the fullest is a 2024 Bengaluru SDE2 loop with three rounds in one sitting. Taro dates on the first of a month are approximate, and two Taro entries re-host reviews first posted elsewhere. The accounts show which rounds and questions came up in some teams\' loops; they cannot give the exact wording, this year\'s format or how your team interviews.',
      'Ask the recruiter how many rounds your team runs, how long each lasts, whether a HackerRank assessment or a recorded video interview comes first, and whether the coding round opens with a pull-request review. The hiring FAQs list structured live interviews, on-demand recorded interviews and virtual skills assessments, and describe technical assessments as online tests or live interviews; the Software Engineer Program page describes a Front-end Developer track that builds AI-powered interfaces with streaming responses and citations, design systems and accessibility standards, and secure authentication with React. Neither page describes a frontend interview.',
    ],
  },
  roundSpotlights: [
    {
      id: 'react-interview',
      kicker: 'Round decoder',
      title: 'JPMorgan Chase React interview for frontend engineers: the rounds each team runs',
      lede: [
        'JPMorgan Chase, which candidates also write as JP Morgan or JPMC, has no standard loop: its How we hire page says the process differs by position, and JPMorgan Chase-badged commenters on Blind say it depends on the line of business and the team. The frontend and React accounts from 2017 to 2026, from the UK, the US and India, mostly describe two technical formats: an hour of spoken JavaScript and React questions, often split between two interviewers or put to a panel of three, and a live-coding round of 30 to 90 minutes with a small React build.',
        'Around them sit a recruiter call, a hiring-manager or leadership conversation and, in some loops, extra rounds: three 60-minute rounds in one sitting in a 2024 Bengaluru loop, opening with security and React, and the generic super day that Software Engineer II and III accounts describe. The open question in the list above comes from that Bengaluru security and React round.',
      ],
      facts: [
        { label: 'Position in the loop', value: 'After a recruiter phone screen. A HackerRank assessment with two easy-to-medium problems opens Software Engineer II and III requisitions; the frontend-titled loops do not report one.' },
        { label: 'Conversation round', value: 'About an hour, often split between two interviewers or put to a panel of three: spoken JavaScript, React and browser questions and questions on your CV. A 2021 New York onsite and a 2025 lead panel added algorithm questions.' },
        { label: 'Live coding', value: '30 to 90 minutes with an interviewer, over video in some loops: a small React build, or simple paper coding with a tech lead. A London candidate in 2023 was briefed on 90 minutes of live coding plus a 30-minute behavioural stage; other accounts give 30 to 45 minutes.' },
        { label: 'Security and framework rounds', value: 'One Bengaluru SDE2 loop in 2024: three 60-minute rounds in one sitting, security and React, then JavaScript and framework, then the hiring manager, with a coding question in each of the first two and an offer on day 10.' },
        { label: 'Super day', value: 'The generic Software Engineer II and III shape from 2024 to 2026: three rounds of 45 to 60 minutes in one day, a pull-request review plus a medium problem, high-level design on a HackerRank whiteboard or CodePair, and a behavioural round with a Director; probably shared by React-titled requisitions, unconfirmed.' },
      ],
      // The open question is the memoization function, so the rehearsal leads to its free explainer.
      practiceLink: { label: 'Start with the open question\'s subject: the free memoization explainer', path: '/javascript/trivia/js-memoization' },
      processLink: { label: 'See the frontend technical conversation row in the reported process', fragment: 'jpmorgan-interview-process-1-stage-frontend-technical-conversation' },
    },
  ],
  roleLenses: {
    kicker: 'Role lenses',
    title: 'AI-assisted interfaces or secure data screens: where a JPMorgan Chase frontend role may sit',
    intro:
      'JPMorgan Chase\'s Software Engineer Program page describes a Front-end Developer track that builds AI-powered chat interfaces, and the 2024 Bengaluru loop opened with a security and React round. Practise in the context nearer the requisition you applied for; neither tells you which team you will join.',
    items: [
      {
        title: 'AI-assisted interfaces and design systems',
        description:
          'The Front-end Developer track on the official Software Engineer Program page describes chat assistants with streaming responses and citations, design systems and accessibility standards, and React alongside Swift and Kotlin.',
        practiceFocus:
          'Streaming reads with cancellation, loading and failure states that stay truthful, accessible components with keyboard semantics, and typed contracts at the API boundary.',
      },
      {
        title: 'Secure data-handling screens',
        description:
          'Requisitions pair React with Java or Python back ends, and one Bengaluru loop opened with a round on XSS, security principles at work, React lifecycle methods and component design for data privacy.',
        practiceFocus:
          'Safe DOM sinks and escaping, where tokens and session state live, cookies versus storage, CORS, and components that render only the data a screen needs.',
      },
    ],
  },
  prompts: {
    kicker: 'Representative practice prompts',
    title: 'Answer guides for the reported JPMorgan Chase questions',
    intro:
      'Each guide sets out what to ask first, what a strong answer covers and the miss that most often costs the round.',
    itemListName: 'JPMorgan Chase answer guides',
    items: [
      {
        id: 'generic-memoize-function',
        title: 'Write a generic memoization function inside a security-and-React round',
        statement:
          'In a 60-minute security and React round, write memoize(fn): a wrapper that caches results by argument so a repeated call with the same input returns the cached value without calling fn again, then explain when it is safe to use.',
        whatThisMeasures:
          'Cache-key design, reference versus value equality, memory growth and eviction, the pure-function precondition, and whether you can move from security concepts to code without losing the thread.',
        clarifyFirst: [
          'Confirm how arguments are compared: one primitive, several primitives, or object references, and whether the this value matters for the wrapped function.',
          'Confirm whether the cache may grow without bound in the exercise or needs a size limit or an eviction rule.',
        ],
        strongAnswer: [
          'Build the key deliberately: a Map keyed by the single argument in the simple case, nested Maps or a serialised tuple for several, and say why JSON.stringify on object arguments is a trade-off rather than a default.',
          'Keep the cache in a closure per wrapped function, pass this and the full argument list through on a miss, and return the cached value on a hit.',
          'State the precondition out loud: memoization is correct only for pure functions with stable outputs, and cached rejections or thrown errors need a decision.',
          'Name the memory cost and offer a bounded cache or a WeakMap for object keys when the interviewer asks about growth.',
        ],
        commonMiss:
          'Keying each call with JSON.stringify, which collides on undefined, functions and key order, and leaving the cache to grow for the life of the page without saying so.',
        resourceLabel: 'Practice the memoize function (Premium)',
        resourcePath: '/javascript/coding/js-memoize-function',
        reportedRound: { label: JPMORGAN_FRONTENDGEEK_2024_LABEL, url: JPMORGAN_FRONTENDGEEK_2024_URL },
      },
      {
        id: 'reduce-polyfill-with-async-follow-ups',
        title: 'Write a polyfill for the reduce function, with promises, generators and currying as follow-ups',
        statement:
          'In a JavaScript and framework round, implement Array.prototype.reduce without using the native method: call the reducer with the accumulator, the current value, the index and the array for existing indices only, support an optional initial value, and throw on an empty array with no initial value. Expect the same round to move on to promises and asynchronous behaviour, generator functions, object manipulation, pure functions and currying.',
        whatThisMeasures:
          'Exact knowledge of a core array method, handling of sparse arrays and edge cases, and breadth across the JavaScript topics the round moves through after the code.',
        clarifyFirst: [
          'Confirm whether the polyfill goes on Array.prototype or is a standalone function, and whether holes in sparse arrays must be skipped as the native method skips them.',
          'Confirm the expected behaviour for an empty array without an initial value; the native method throws a TypeError.',
        ],
        strongAnswer: [
          'Detect whether an initial value was passed by the arguments length, not by comparing with undefined, so undefined stays a valid initial value.',
          'Without an initial value, take the first existing element as the accumulator and start from the next index; skip holes with an in check.',
          'Call the reducer with (accumulator, currentValue, index, array), return the final accumulator, and throw a TypeError for an empty array with no initial value.',
          'For the follow-ups, explain microtask ordering for promises, how a generator pauses at yield and resumes on next(), and show currying as a closure that collects arguments until the arity is met.',
        ],
        commonMiss:
          'Treating undefined as no initial value, iterating over holes in a sparse array, and returning undefined for an empty array instead of throwing.',
        resourceLabel: 'Practice implementing Array.prototype.reduce (Premium)',
        resourcePath: '/javascript/coding/js-array-prototype-reduce',
        reportedRound: { label: JPMORGAN_FRONTENDGEEK_2024_LABEL, url: JPMORGAN_FRONTENDGEEK_2024_URL },
      },
      {
        id: 'generic-async-promise-react-hook',
        title: 'Live-code a generic async promise React hook with typed state and effect cleanup',
        statement:
          'Write useAsync<T>(fn: () => Promise<T>, deps) in TypeScript without references: it runs the async function, exposes loading, data and error, re-runs when the dependencies change, and uses the useEffect cleanup function so a response that arrives after the component unmounted or the inputs changed does not reach state.',
        whatThisMeasures:
          'Generic types at a hook boundary, a request-state model that cannot contradict itself, effect lifecycle and cleanup, and stale-response handling while you narrate.',
        clarifyFirst: [
          'Confirm whether the hook runs on mount only or whenever the dependencies change, and whether a manual re-run function is expected.',
          'Confirm what cancellation must guarantee: ignoring a late result inside the hook, or also aborting the request with an AbortSignal.',
        ],
        strongAnswer: [
          'Type the hook with a generic parameter for the resolved value and return a discriminated union (idle, loading, success with data, error with an Error), so callers narrow on status rather than on three optional fields.',
          'Start each run by setting loading, then await inside the effect; keep a cancelled flag or an AbortController in the effect scope and flip it in the cleanup function.',
          'Check the flag before each setState after the await, so an unmounted component or a superseded run does not write state.',
          'Normalise unknown rejections to an Error and keep the dependency list honest; if the function identity changes on each render, say so and take the dependencies explicitly.',
        ],
        commonMiss:
          'A hook that sets state after the await with no cleanup, so a slower earlier request overwrites a newer result after the inputs changed.',
        resourceLabel: 'Practice fetching and rendering with loading, error and empty states (free)',
        resourcePath: '/react/coding/react-fetch-list-states',
        reportedRound: { label: JPMORGAN_ACED_2026_LABEL, url: JPMORGAN_ACED_2026_URL },
      },
      {
        id: 'priority-todo-list',
        title: 'Build a to-do list where each task has a priority that can be changed, and tasks can be deleted',
        statement:
          'In React, build a to-do list where each task carries a high, medium or low priority. The priority can be updated after the task is created, and a whole task can be deleted. Keep the input controlled, the ids stable and the updates immutable.',
        whatThisMeasures:
          'Local state modelling, controlled inputs, immutable updates of an array of objects, stable keys, and whether the priority control works from the keyboard.',
        clarifyFirst: [
          'Confirm whether tasks are sorted or grouped by priority, and the default priority for a new task.',
          'Confirm whether completion state or persistence is in scope, or only add, change priority and delete.',
        ],
        strongAnswer: [
          'Hold tasks as an array of objects with a stable id, text and priority, and derive a sorted or grouped view at render time rather than storing it.',
          'Update a priority by mapping to a new array with one replaced object; delete by filtering; leave the existing array and objects untouched.',
          'Render the priority as a labelled select or radio group so it is keyboard-operable and announced; use the id as the key, not the index.',
          'Keep the input controlled, clear it on submit, ignore empty or whitespace-only text, and show an empty state when the list is empty.',
        ],
        commonMiss:
          'Using the array index as the key, so deleting a task shifts the priority controls of the tasks after it, or mutating a task object in place so React does not re-render.',
        resourceLabel: 'Practice the React to-do list (free)',
        resourcePath: '/react/coding/react-todo-list',
        reportedRound: { label: JPMORGAN_HOUSTON_2022_LABEL, url: JPMORGAN_HOUSTON_2022_URL },
      },
      {
        id: 'react-and-javascript-conversation-round',
        title: 'Hold the React and JavaScript conversation round: closures, clones, hooks, storage and CORS',
        statement:
          'A technical conversation, in some accounts an hour with two interviewers, that moves through fundamentals: explain a closure; shallow versus deep clone and an Object.assign use case; useCallback versus useMemo; useState versus useRef; context and when a higher-order component is the better tool; the difference between a cookie, sessionStorage and localStorage; what CORS is. Answer each in two or three exact sentences with one example.',
        whatThisMeasures:
          'Whether you can state fundamentals plainly, pick the right example quickly, and move between JavaScript, React and browser topics without drifting into internals the interviewer did not ask about.',
        clarifyFirst: [
          'Ask whether the interviewer wants a definition or an example first; a short example usually proves understanding fastest.',
          'Confirm the role\'s framework and React version before the hook questions, since the memoization answer depends on it.',
        ],
        strongAnswer: [
          'Closure: a function keeps access to the variables of the scope it was created in after that scope has returned; give the counter example. Shallow clone (spread, Object.assign) copies the top level and shares nested references; deep clone (structuredClone) copies the whole graph; Object.assign also merges defaults into a target.',
          'useMemo caches a computed value and useCallback caches a function identity, both for referential stability between renders; useState schedules a re-render on change while useRef holds a mutable value that does not.',
          'Context shares a value down the tree without prop drilling; a higher-order component wraps a component to add behaviour and fits when the same cross-cutting logic must apply to several components.',
          'Cookies travel with requests to the server and can be HttpOnly; sessionStorage lives per tab until it closes; localStorage persists per origin. CORS is the browser rule that blocks cross-origin reads unless the server allows them with Access-Control headers.',
        ],
        commonMiss:
          'Long answers about internals that do not state the simple rule, or saying useCallback makes the function faster instead of explaining referential stability.',
        resourceLabel: 'Review closures (free)',
        resourcePath: '/javascript/trivia/js-closures',
        reportedRound: { label: JPMORGAN_BLIND_2023_LABEL, url: JPMORGAN_BLIND_2023_URL },
      },
    ],
  },
  walkthrough: {
    kicker: 'Mini walkthrough',
    title: 'Scope the 2026 live-coding task before the first line',
    intro:
      'The newest frontend account, a senior UK loop from 2026, names one live-coding task and the interviewer\'s expectations for it. Five decisions to make before you type, in the order you would say them out loud.',
    steps: [
      { title: 'Pin the signature', description: 'useAsync<T>(fn: () => Promise<T>, deps): the generic parameter is the resolved value. Say whether the hook runs on mount only or on each dependency change.' },
      { title: 'Choose one state', description: 'A discriminated union: idle, loading, success with data of type T, error with an Error. Callers narrow on status, and no two fields can disagree.' },
      { title: 'Run inside the effect', description: 'Set loading, call fn, await it, then write success or error. Normalise an unknown rejection to an Error before it reaches state.' },
      { title: 'Clean up', description: 'Declare a cancelled flag or an AbortController in the effect scope and flip it in the returned cleanup function; check it before each setState after the await.' },
      { title: 'Test the edges', description: 'Unmount mid-flight, change a dependency while a request is pending, a rejected promise, a function that throws synchronously, and two runs that resolve out of order.' },
    ],
  },
  prepPlan: {
    kicker: 'Actionable preparation',
    title: 'A 7-day JPMorgan Chase frontend interview preparation plan',
    intro: 'Seven days shaped by the JPMorgan Chase accounts: short spoken answers for the conversation round, small exact code for the live round, and the super-day shape in case your team runs it.',
    days: [
      { day: 'Day 1', focus: 'JavaScript conversation answers: about thirty short questions, the number a 2017 UK phone round asked, on scope, functions, objects and asynchrony, each answered in two sentences with one example.', artifact: 'A one-page answer sheet with one example per question.' },
      { day: 'Day 2', focus: 'Small functions from memory: the open memoization question first, then other utility functions and polyfills of built-in methods, each tested on undefined arguments, empty input and repeated calls.', artifact: 'Three functions with their tests, written without looking anything up.' },
      { day: 'Day 3', focus: 'Asynchrony in React: promise ordering, cancellation and effect cleanup, typed in TypeScript, then a component that loads data without letting a late response win.', artifact: 'A data-loading component with tests for unmount, a changed input and a rejected request.' },
      { day: 'Day 4', focus: 'React builds against a clock: two small components with local state, stable keys, immutable updates and keyboard-operable controls, in the 30 to 45 minutes two accounts give for live coding.', artifact: 'Two timed builds with a note of where the time went.' },
      { day: 'Day 5', focus: 'React and browser concepts: the React and browser topics you could not explain without notes, each answered in two sentences with one example.', artifact: 'A second answer sheet, for React and the browser.' },
      { day: 'Day 6', focus: 'The super-day shape: a pull-request review, one medium problem, a high-level design sketch and behavioural stories, as the generic Software Engineer II and III accounts describe it.', artifact: 'Six stories, among them why JPMorgan Chase and a time your design was rejected, each told as the situation, your choice, what it cost and how it ended.' },
      { day: 'Day 7', focus: 'Mock loop: one conversation round, one live-coding round and one hiring-manager conversation, each narrated.', artifact: 'What to ask the recruiter: how many rounds the team runs, whether a HackerRank test or a recorded interview comes first, and whether the coding round opens with a pull-request review.' },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common JPMorgan Chase frontend interview preparation questions',
    items: [
      { question: 'What does the JPMorgan Chase React interview ask?', answer: 'In the frontend and React accounts from 2017 to 2026, two technical formats recur: about an hour of spoken JavaScript, React and browser questions, often split between two interviewers or put to a panel of three, and a live-coding round of 30 to 90 minutes with a small React build or paper coding. One 2024 Bengaluru loop added a security and React round, and the generic super day is unconfirmed for React-titled requisitions. The reported questions are listed above; the first, a generic memoization function, is open.' },
      { question: 'Are these the real JPMorgan Chase questions?', answer: 'They come from candidates\' own accounts on Taro, Aced, Blind, LeetCode Discuss, frontendgeek and Medium and are written in our words, so no row is a leaked or confirmed JPMorgan Chase question. Most accounts name a question in a line or two; the answer guides and practice tasks are FrontendAtlas\'s.' },
      { question: 'Is there a standard JPMorgan loop?', answer: 'No. The official How we hire page says the interview process will differ for each position and that you can expect to meet several people in multiple rounds, and JPMorgan Chase-badged commenters on Blind say the format depends on the line of business and the team. The frontend accounts match that: a two-week senior loop with one live-coding round in 2026, three 60-minute rounds in one sitting in Bengaluru in 2024, three video interviews in 2022, a panel of three lead engineers in 2025. Ask how many rounds there are, how long each lasts and whether an online assessment comes first.' },
      { question: 'Will I get LeetCode-style problems?', answer: 'Some loops include them. A 2021 New York onsite mixed algorithm questions with JavaScript ones; in a 2025 lead-level panel one of three engineers asked three easy-to-medium LeetCode-style questions; in a 2022 React developer loop an interviewer assigned to a back-end Python role set a coding question; and the generic Software Engineer II and III accounts describe a HackerRank screen with two easy problems, then a coding round that opens with a pull-request review and moves to a medium problem, with a JPMorgan Chase-badged interviewer on Blind expecting medium difficulty. The frontend-titled accounts mostly describe concept questions and small builds. Ask the recruiter whether the team runs the super day.' },
      { question: 'Which spelling: JPMorgan Chase, JP Morgan or JPMC?', answer: 'The careers pages write the firm as JPMorganChase, one word, while the legal names stay JPMorgan Chase & Co. and JPMorgan Chase Bank, N.A. This guide uses JPMorgan Chase, the spelling candidates search for. Public interview reports write JP Morgan, JPMorgan, JPMC and Chase, and employees on Blind carry a JPMorgan Chase badge, so search for all of them when you look for more accounts.' },
      { question: 'What do Software Engineer II, III and Lead mean on a requisition?', answer: 'On 21 October 2026 the requisitions with frontend titles ran from Software Engineer II (React/Java, New York) and Software Engineer III (React, Glasgow) to Lead Software Engineer (React, Chicago) and Senior Lead Software Engineer (Jersey City), plus a Web Front End Developer in London. Candidates and employees describe Software Engineer II as Associate and Lead Software Engineer as VP, with Software Engineer III between them; that mapping is not official, so ask the recruiter which level and which team you are interviewing for.' },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Free practice for the JPMorgan Chase rounds',
    intro:
      'Free drills for the skills behind the JPMorgan Chase rounds: the subject of the open memoization question, data loading that survives a late response, stable list rendering, algorithm practice for the HackerRank step, and stories for the hiring-manager round.',
    items: [
      { label: 'What is memoization?', description: 'The subject of the open question: caching by argument, and when it is safe.', path: '/javascript/trivia/js-memoization' },
      { label: 'Fetch and render with loading, error and empty states', description: 'A timed React build that ignores a response arriving after its source changed.', path: '/react/coding/react-fetch-list-states' },
      { label: 'Keys in React lists', description: 'Why a key must be stable, and what breaks when the index is the key.', path: '/react/trivia/react-keys-in-lists' },
      { label: 'DSA for frontend loops', description: 'For the HackerRank step and the medium problem in the generic super day.', path: '/guides/interview-blueprint/dsa-for-fe' },
      { label: 'Behavioural stories', description: 'A structure for the hiring-manager, Director and culture-fit conversations.', path: '/guides/behavioral/stories' },
    ],
  },
  sources: {
    kicker: 'Public interview reports and official context',
    title: 'Sources and evidence limits',
    intro: 'These links support the public context used by the guide. Their notes state what each source can and cannot establish about preparation.',
    items: [
      { label: JPMORGAN_ACED_2026_LABEL, url: JPMORGAN_ACED_2026_URL, note: 'One self-reported senior (L5) loop in the UK, rejected after two weeks: a recruiter screen, then one live-coding round whose expectations the account states. The full account now sits behind a member wall. One loop; it cannot establish the current format or the loops of other teams.', kind: 'report' },
      { label: JPMORGAN_HOUSTON_2022_LABEL, url: JPMORGAN_HOUSTON_2022_URL, note: 'One self-reported React developer loop without an offer: three video technical interviews, one of them run by an interviewer assigned to a back-end Python role, with a React build in another. The date is approximate.', kind: 'report' },
      { label: JPMORGAN_US_2022_LABEL, url: JPMORGAN_US_2022_URL, note: 'One self-reported frontend developer interview without an offer, told in a few lines: React and JavaScript concept questions, one with a follow-up, and no coding task named.', kind: 'report' },
      { label: JPMORGAN_BENGALURU_2024_LABEL, url: JPMORGAN_BENGALURU_2024_URL, note: 'One self-reported first round of JavaScript and React questions, after which no second round was scheduled and the recruiter stopped answering. One screen; it cannot establish the rest of the loop.', kind: 'report' },
      { label: JPMORGAN_LEAD_2025_LABEL, url: JPMORGAN_LEAD_2025_URL, note: 'One self-reported lead-level panel of about an hour with three lead engineers: one set LeetCode-style questions, one asked about React, and one asked back-end questions. The panel shape in one 2025 loop; it cannot establish the current format.', kind: 'report' },
      { label: JPMORGAN_UK_2025_LABEL, url: JPMORGAN_UK_2025_URL, note: 'One self-reported interview with two people, described as more a test of knowledge and React concepts than of aptitude. One interview; it cannot establish the rest of the loop.', kind: 'report' },
      { label: JPMORGAN_FRONTENDGEEK_2024_LABEL, url: JPMORGAN_FRONTENDGEEK_2024_URL, note: 'One self-reported SDE2 loop with three 60-minute rounds in one sitting: security and React, JavaScript and framework, and the hiring manager, with a coding question in each of the first two and an offer on day 10 that the candidate declined. The open memoization question comes from its first round; it cannot establish how other Bengaluru teams interview.', kind: 'report' },
      { label: JPMORGAN_LEETCODE_2021_LABEL, url: JPMORGAN_LEETCODE_2021_URL, note: 'One self-reported onsite in which each interview differed with the team and the hiring manager: JavaScript and browser questions beside algorithm questions, with advice for frontend candidates. The question mix in 2021; it cannot establish the current format.', kind: 'report' },
      { label: JPMORGAN_BLIND_2023_LABEL, url: JPMORGAN_BLIND_2023_URL, note: 'One poster\'s own first technical interview over Zoom, with no briefing beforehand: a run of JavaScript and React concept questions. A commenter in the thread says JPMorgan interviews have no consistency between teams; the poster did not report back on the later stage.', kind: 'report' },
      { label: 'JPMorgan Chase: How we hire', url: JPMORGAN_HOW_WE_HIRE_URL, note: 'Official hiring page with four steps, Explore, Apply, Interview and Decision. It states that the interview process will differ for each position and that candidates meet several people in multiple rounds; it names no interview questions.', kind: 'official' },
      { label: 'JPMorgan Chase: hiring FAQs', url: JPMORGAN_HIRING_FAQS_URL, note: 'Official FAQs listing the assessment types, structured live interviews, on-demand recorded interviews and virtual skills assessments, and describing technical assessments as online tests or live technical interviews with an interviewer. Context for the format, not evidence of content.', kind: 'official' },
      { label: 'JPMorgan Chase: Software Engineer Program', url: JPMORGAN_PROGRAM_URL, note: 'Official page for the Software Engineer Program, read in October 2026. Its Front-end Developer track builds AI-powered interfaces such as chat assistants with streaming responses and citations, works on design systems and accessibility standards, and implements secure authentication with React, Swift and Kotlin. It says nothing about the interview.', kind: 'official' },
    ],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full JPMorgan Chase practice set',
    copy:
      'Premium unlocks the two drills behind the first prompts, Memoization and Implement Array.prototype.reduce, and the wider premium library of coding, concept and system-design practice.',
    buttonLabel: 'Unlock the full JPMorgan Chase practice set',
    src: 'company_preview_jpmorgan',
  },
  about: [
    'JPMorgan Chase frontend interview preparation',
    'JavaScript memoization and reduce polyfills',
    'Generic async React hooks with effect cleanup',
    'React and JavaScript fundamentals for banking frontend roles',
  ],
  indexAnchorLabel: 'JPMorgan Chase frontend interview questions',
};
