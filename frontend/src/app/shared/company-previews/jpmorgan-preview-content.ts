import type { AuthoredCompanyPreview } from '../../shared/company-previews/authored-company-preview.model';

/**
 * JPMorgan Chase frontend interview guide. Every prompt is a FrontendAtlas practice version modelled on public,
 * self-reported frontend accounts from 2021 to 2026 (Aced, Taro, Blind, LeetCode Discuss and frontendgeek) and on
 * the official hiring pages. Nothing here is a leaked, confirmed or official JPMorgan Chase question; the loop is run
 * by each team, and a handful of accounts cannot establish a fixed format.
 */
const JPMORGAN_ACED_2026_URL = 'https://www.aced.io/experiences/jp-morgan-chase-senior-frontend-engineer-interview-6faa4e';
const JPMORGAN_ACED_2026_LABEL = 'Public report: Aced senior frontend engineer loop, UK, around May 2026';
const JPMORGAN_HOUSTON_2022_URL =
  'https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/react-developer-united-states-june-1-2022-no-offer-positive-87452f0d/';
const JPMORGAN_HOUSTON_2022_LABEL = 'Public report: Taro React developer loop, Houston, June 2022';
const JPMORGAN_US_2022_URL =
  'https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/frontend-developer-united-states-january-2-2022-no-offer-positive-5a4dea31/';
const JPMORGAN_US_2022_LABEL = 'Public report: Taro frontend developer loop, United States, January 2022';
const JPMORGAN_BENGALURU_2024_URL =
  'https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/frontend-engineer-bengaluru-karnataka-april-1-2024-no-offer-negative-77dc2081/';
const JPMORGAN_BENGALURU_2024_LABEL = 'Public report: Taro frontend engineer screen, Bengaluru, April 2024';
const JPMORGAN_LEAD_2025_URL =
  'https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/lead-software-engineer-united-states-march-13-2025-no-offer-positive-5ec74572/';
const JPMORGAN_LEAD_2025_LABEL = 'Public report: Taro lead software engineer panel, United States, March 2025';
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

export const JPMORGAN_PREVIEW_TITLE = 'JPMorgan Chase Frontend Interview Questions: 5 Prompts + Guide';
export const JPMORGAN_PREVIEW_H1 = 'JPMorgan Chase Frontend Interview Questions';
export const JPMORGAN_PREVIEW_DESCRIPTION =
  'Prepare for a JPMorgan Chase frontend interview with 5 practice prompts modelled on public reports: memoize, reduce polyfill, async React hook, to-do list.';
export const JPMORGAN_PREVIEW_CANONICAL_PATH = '/companies/jpmorgan/preview';
export const JPMORGAN_PREVIEW_TRUST_NOTE =
  'These are FrontendAtlas practice versions modelled on rounds described in public interview reports, not leaked, confirmed or official JPMorgan Chase questions. Each team runs its own loop and a handful of self-reported accounts cannot establish a fixed format; use recruiter-provided material as the source of truth.';

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
      'Prepare with five practice prompts shaped by nine public frontend accounts from 2021 to 2026 and by the official hiring pages: a generic memoization function in a security-and-React round, a polyfill for reduce with promise, generator and currying follow-ups, a generic async promise React hook with typed state and effect cleanup, a to-do list whose tasks carry a changeable priority, and the React and JavaScript conversation round on closures, clones, hooks, storage and CORS.',
    caveat:
      'This guide uses public, self-reported interview accounts and the official JPMorgan Chase hiring pages to create realistic constraints. It does not claim access to private interview material, a fixed interview format, or the stack of every JPMorgan Chase team; each team runs its own loop.',
    chips: ['5 practice prompts', 'JavaScript, React, web security', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'Prepare for product judgment, not JPMorgan Chase trivia',
    paragraphs: [
      'The public accounts agree on the questions more than on the format. Across the UK, the US and India, frontend candidates describe the same conversation: explain a closure, the difference between a shallow and a deep clone and an Object.assign use case, useCallback versus useMemo, useState versus useRef, context and when a higher-order component fits, the difference between a cookie, sessionStorage and localStorage, what CORS is. The coding they describe is small and exact: a generic memoization function, a polyfill for reduce, a generic async promise React hook with a useEffect cleanup function, a to-do list with priorities. Each prompt below starts with the clarifying questions a strong candidate asks, then the behaviours a strong answer covers, then the miss that usually ends the round.',
      'The loop itself is team-run. The official How we hire page says the interview process will differ for each position, and employees say the same in public threads. One Bengaluru SDE2 loop in 2024 ran three 60-minute rounds in one sitting, opening with security and React; a 2026 UK senior loop was a recruiter screen and one technical interview; a Houston React developer in 2022 had three video interviews, one of them run by an interviewer assigned to a back-end role; a 2025 lead-level panel put three lead engineers in one hour. Prepare the recurring questions first, then rehearse the shape the recruiter describes.',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked October 2026',
    title: 'What the public accounts establish, and what you still need to confirm',
    paragraphs: [
      'Nine public frontend accounts from 2021 to 2026 inform this guide: one senior account on Aced from the UK, around May 2026, with a recruiter screen and a live-coding interview on a generic async promise React hook; five accounts on Taro, a React developer in Houston in 2022 with three video interviews and a priority to-do list, a US frontend developer in 2022 asked about context, higher-order components and reduce, a Bengaluru frontend engineer in 2024 asked about closures, the event loop and React optimisation, a UK associate in 2025 asked about useState versus useRef, and a US lead-level panel in 2025 with LeetCode-style questions, React depth and back-end basics; one frontendgeek account from Bengaluru in 2024 with three 60-minute rounds on security and React, JavaScript and the framework, and the hiring manager; one LeetCode Discuss post from a New York onsite in 2021 across several teams; and one Blind thread from a London React software engineer in 2023. Together they establish that those questions and shapes occurred; they do not establish exact wording, the current format, or how each team interviews. Several accounts are a few lines long, and the dates on some of them are approximate.',
      'Confirm with the recruiter how many rounds there are, how long each lasts, whether a HackerRank assessment or a recorded interview comes first, and whether the team runs a pull-request review. The official How we hire page and hiring FAQs describe assessment types, structured live interviews, on-demand recorded interviews and virtual skills assessments, with technical assessments as online tests or live technical interviews, but no frontend format. The official Software Engineer Program page describes a Front-end Developer track that builds AI-powered interfaces with streaming responses and citations, design systems and accessibility standards, and secure authentication with React. Use those pages for context, not as evidence of specific questions.',
    ],
  },
  roleLenses: {
    kicker: 'Role lenses',
    title: 'Two product contexts for practising transferable frontend judgment',
    intro:
      'These are preparation lenses derived from the official Software Engineer Program page, the frontend requisition titles and the security-and-React round in one public account, not claimed team assignments. Choose the lens closest to the role and keep the reasoning framework-neutral.',
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
    title: 'Five JPMorgan Chase frontend interview practice questions',
    intro:
      'For each prompt, clarify the contract, explain ownership and trade-offs, implement or diagram the smallest credible slice, and test the failure cases. Each prompt links to the public report it is modelled on and to a practice page.',
    itemListName: 'Five JPMorgan Chase frontend interview practice prompts',
    items: [
      {
        id: 'generic-memoize-function',
        title: 'Write a generic memoization function inside a security-and-React round',
        statement:
          'In a 60-minute round that also covers XSS, security principles at work, React lifecycle methods and component design for data privacy, write memoize(fn): a wrapper that caches results by argument so a repeated call with the same input returns the cached value without calling fn again, then explain when it is safe to use.',
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
    kicker: 'Public mini walkthrough',
    title: 'Scope the generic async promise hook before the first line',
    intro:
      'Treat this as a representative exercise, not a description of the reported one. Work from the signature toward the cleanup, and say each decision out loud.',
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
    intro: 'Every day ends with code, a test, a design artifact, or a question you can use in the real process.',
    days: [
      { day: 'Day 1', focus: 'JavaScript fundamentals: closures, the event loop, shallow versus deep clone, Object.assign, prototypes, var, let and const, arrow versus normal functions.', artifact: 'A one-page answer sheet with one example per topic.' },
      { day: 'Day 2', focus: 'Utility functions from memory: memoize, a reduce polyfill, an LRU cache and balanced brackets, each with edge-case tests.', artifact: 'Four functions with tests for sparse arrays, undefined arguments and empty input.' },
      { day: 'Day 3', focus: 'Asynchrony: promises and microtask order, generators, currying, then the generic async promise hook with useEffect cleanup in TypeScript.', artifact: 'A useAsync<T> hook with a test that a late response does not overwrite a newer one.' },
      { day: 'Day 4', focus: 'React builds against a clock: the priority to-do list, then fetch and render a list with loading, error and empty states.', artifact: 'Two timed builds with stable ids, immutable updates and a keyboard-operable priority control.' },
      { day: 'Day 5', focus: 'React concepts and web security: useCallback versus useMemo, useState versus useRef, context versus higher-order components, the lifecycle, XSS and DOM sinks, cookies versus storage, CORS.', artifact: 'A second answer sheet, two sentences and one example per topic.' },
      { day: 'Day 6', focus: 'The super-day shape that generic Software Engineer II and III accounts describe: review a pull request for hardcoded credentials and poor variable names, solve one medium problem, sketch a rate limiter; then behavioural stories about a feature you were proud of, a conflict in a team and why a bank.', artifact: 'Six stories in a structured format, each with a decision, a trade-off and a measured result.' },
      { day: 'Day 7', focus: 'Mock loop: one conversation round, one live-coding round and one hiring-manager conversation, each narrated.', artifact: 'A list of the questions you will ask the recruiter about rounds, length, assessments and the team.' },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common JPMorgan Chase frontend interview preparation questions',
    items: [
      { question: 'Are these the real JPMorgan Chase questions?', answer: 'No. They are FrontendAtlas practice versions modelled on rounds described in public, self-reported accounts on Aced, Taro, Blind, LeetCode Discuss and frontendgeek. The wording, the data and the test cases are ours.' },
      { question: 'Is there a standard JPMorgan loop?', answer: 'No. The official How we hire page says the interview process will differ for each position and that you can expect to meet several people in multiple rounds, and employees in public threads describe decentralised, team-run interviews that depend on the line of business. The public frontend accounts match that: a recruiter screen and one technical interview in the UK in 2026, three 60-minute rounds in one sitting in Bengaluru in 2024, three video interviews in Houston in 2022, a panel of three lead engineers in 2025. Confirm the number of rounds, their length and whether an online assessment comes first.' },
      { question: 'Will I get LeetCode-style problems?', answer: 'Some loops include them. A New York candidate in 2021 was asked to delete a node in a linked list, check for balanced brackets and implement an LRU cache alongside JavaScript questions; in a 2025 lead-level panel one of three engineers asked three easy-to-medium LeetCode-style questions; and the generic Software Engineer II and III accounts describe a HackerRank screen with two easy problems, then a coding round that opens with a pull-request review and moves to a medium problem, with one interviewer in those threads saying the expected difficulty is medium. The frontend-titled UK and Bengaluru accounts used here describe concept questions and small builds instead. Ask the recruiter whether the team runs the super day.' },
      { question: 'Which spelling: JPMorgan Chase, JP Morgan or JPMC?', answer: 'The company\'s own careers pages use JPMorgan Chase, and this guide follows them. Public interview reports write JP Morgan, JPMorgan, JPMC and Chase, and employees on Blind carry a JPMC badge, so search for all of them when you look for more accounts.' },
      { question: 'What do Software Engineer II, III and Lead mean on a requisition?', answer: 'On 21 October 2026 the requisitions with frontend titles ran from Software Engineer II (React/Java, New York) and Software Engineer III (React, Glasgow) to Lead Software Engineer (React, Chicago) and Senior Lead Software Engineer (Jersey City), plus a Web Front End Developer in London. Candidates and employees describe Software Engineer II as Associate, Software Engineer III as mid level and Lead Software Engineer as VP; that mapping is not official, so ask the recruiter which level and which team you are interviewing for.' },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Build the underlying skills with free practice',
    intro:
      'These public pages cover the JavaScript, React, storage and security fundamentals used by the practice prompts. They are supporting drills, not claimed JPMorgan Chase questions.',
    items: [
      { label: 'Explain closures in JavaScript', description: 'The opening question in several of the public accounts.', path: '/javascript/trivia/js-closures' },
      { label: 'JavaScript event loop visualiser', description: 'Predict the order of microtasks and macrotasks before you explain it.', path: '/javascript/trivia/js-event-loop' },
      { label: 'useMemo versus useCallback', description: 'Referential stability, and when memoizing makes a render slower.', path: '/react/trivia/react-usememo-vs-usecallback' },
      { label: 'useRef versus useState', description: 'Why changing a ref does not re-render.', path: '/react/trivia/react-useref-vs-usestate' },
      { label: 'Higher-order components', description: 'What they are and when to reach for one over context.', path: '/react/trivia/react-higher-order-components' },
      { label: 'Cookie versus sessionStorage versus localStorage', description: 'The storage question from the New York onsite.', path: '/javascript/trivia/js-cookie-sessionstorage-localstorage' },
      { label: 'DOM XSS prevention', description: 'Dangerous sinks, safe APIs and Trusted Types for the security-and-React round.', path: '/javascript/trivia/js-xss-dom-sinks' },
      { label: 'Create an LRU cache', description: 'The bounded cache asked in New York and the eviction follow-up to memoize.', path: '/javascript/coding/js-create-lru-cache' },
      { label: 'Behavioural stories', description: 'A structure for the hiring-manager and culture-fit conversations.', path: '/guides/behavioral/stories' },
    ],
  },
  sources: {
    kicker: 'Public interview reports and official context',
    title: 'Sources and evidence limits',
    intro: 'These links support the public context used by the guide. Their notes state what each source can and cannot establish about preparation.',
    items: [
      { label: JPMORGAN_ACED_2026_LABEL, url: JPMORGAN_ACED_2026_URL, note: 'One self-reported senior (L5) loop in the UK, rejected: a recruiter screen, then a technical interview with live coding of a generic async promise React hook where generic types and a useEffect cleanup function were expected, and "Tell me about yourself" in the project discussion. It establishes that exercise in one 2026 loop; it cannot establish the current format or the loops of other teams.', kind: 'report' },
      { label: JPMORGAN_HOUSTON_2022_LABEL, url: JPMORGAN_HOUSTON_2022_URL, note: 'One self-reported React developer loop without an offer: three video technical interviews, one of them run by an interviewer assigned to a back-end Python role, and a React question to build a to-do list where each task has a high, medium or low priority that can be updated and whole tasks can be deleted. It establishes that build in 2022; it cannot establish exact wording or the current loop.', kind: 'report' },
      { label: JPMORGAN_US_2022_LABEL, url: JPMORGAN_US_2022_URL, note: 'One self-reported frontend developer loop without an offer: a question about context that led to a follow-up on when a higher-order component would be used, and the benefits of the reduce method. It establishes those concept questions; it names no coding task.', kind: 'report' },
      { label: JPMORGAN_BENGALURU_2024_LABEL, url: JPMORGAN_BENGALURU_2024_URL, note: 'One self-reported first round on closures, the event loop and React optimisation techniques, after which no second round was scheduled. It establishes those topics in one 2024 screen; it cannot establish the rest of the loop.', kind: 'report' },
      { label: JPMORGAN_LEAD_2025_LABEL, url: JPMORGAN_LEAD_2025_URL, note: 'One self-reported lead-level panel of about an hour with three lead engineers: three easy-to-medium LeetCode-style questions from one, how React works and why React over Angular from another, back-end basics, REST, optimisation and security from the third. It establishes the panel shape and topic mix in one 2025 loop; it cannot establish the current format.', kind: 'report' },
      { label: JPMORGAN_UK_2025_LABEL, url: JPMORGAN_UK_2025_URL, note: 'One self-reported interview with two people, described as more a test of knowledge and React concepts than of aptitude, including the difference between useState and useRef. It establishes the concept-check shape in one 2025 interview; it cannot establish the rest of the loop.', kind: 'report' },
      { label: JPMORGAN_FRONTENDGEEK_2024_LABEL, url: JPMORGAN_FRONTENDGEEK_2024_URL, note: 'One self-reported SDE2 loop with three 60-minute rounds in one sitting: security and React (XSS, security principles at work, React lifecycle methods, component design for data privacy, a generic memoization function), JavaScript and framework (promises, asynchronous behaviour, generator functions, a reduce polyfill, object manipulation, pure functions and currying) and a hiring-manager round, with an offer on day 10 that the candidate declined. It establishes those rounds in 2024; it cannot establish how other Bengaluru teams interview.', kind: 'report' },
      { label: JPMORGAN_LEETCODE_2021_LABEL, url: JPMORGAN_LEETCODE_2021_URL, note: 'One self-reported onsite in which each interview was distinct depending on the team and hiring manager: prototypes, arrow versus normal functions, CORS, cookie versus session versus local storage, deleting a node in a linked list, balanced brackets and an LRU cache. It establishes the question mix in 2021; it cannot establish the current format.', kind: 'report' },
      { label: JPMORGAN_BLIND_2023_LABEL, url: JPMORGAN_BLIND_2023_URL, note: 'One poster\'s own first technical interview over Zoom with no briefing: explain a closure, shallow versus deep clone, an Object.assign use case, useCallback versus useMemo; a commenter in the thread describes JPMorgan interviews as decentralised with no consistency between teams. It establishes those questions in 2023; the poster did not report back on the later stage.', kind: 'report' },
      { label: 'JPMorgan Chase: How we hire', url: JPMORGAN_HOW_WE_HIRE_URL, note: 'Official hiring page with four steps, Explore, Apply, Interview and Decision. It states that the interview process will differ for each position and that candidates meet several people in multiple rounds; it names no interview questions.', kind: 'official' },
      { label: 'JPMorgan Chase: hiring FAQs', url: JPMORGAN_HIRING_FAQS_URL, note: 'Official FAQs listing the assessment types, structured live interviews, on-demand recorded interviews and virtual skills assessments, and describing technical assessments as online tests or live technical interviews with an interviewer. Context for the format, not evidence of content.', kind: 'official' },
    ],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full JPMorgan Chase practice set',
    copy:
      'This public guide is complete enough to plan a focused week. Premium unlocks the two drills behind the first prompts, Memoization and Implement Array.prototype.reduce, and the wider premium library of coding, concept and system-design practice.',
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
