import type { AuthoredCompanyPreview } from '../../shared/company-previews/authored-company-preview.model';

/**
 * ServiceNow frontend interview guide. The reported questions live with the process table
 * (company-interview-processes.ts); the four prompts here are the answer guides of the polyfill, closure and output,
 * virtual DOM and Map rows. The questions come from candidates' posts on LeetCode Discuss, Medium, Blind and Taro
 * (2021 to 2025) and a ServiceNow-badged engineer's Blind reply about their own interviews; the Taro and Blind pages
 * were re-read on 2026-11-13, the LeetCode and Medium bodies come from the research sessions of October 2026. A 2026
 * LeetCode post known only from search summaries is left out. Nothing here is a leaked, confirmed or official
 * ServiceNow question.
 */
const SERVICENOW_MEDIUM_2025_URL =
  'https://medium.com/@karunakumari000532/my-servicenow-software-engineer-ui-interview-experience-2025-23f315b960dc';
const SERVICENOW_MEDIUM_2025_LABEL = 'Public report: software engineer (UI) loop on Medium, 2025';
const SERVICENOW_LEETCODE_IC2_2025_URL = 'https://leetcode.com/discuss/post/6508672/';
const SERVICENOW_LEETCODE_FRONTEND_2023_URL = 'https://leetcode.com/discuss/post/4096867/';
const SERVICENOW_LEETCODE_STAFF_2025_URL = 'https://leetcode.com/discuss/post/7406202/';
const SERVICENOW_LEETCODE_HM_2025_URL = 'https://leetcode.com/discuss/post/6833995/';
const SERVICENOW_LEETCODE_APPLICATIONS_2024_URL = 'https://leetcode.com/discuss/post/6062332/';
const SERVICENOW_TARO = 'https://www.jointaro.com/interviews/companies/servicenow/experiences';
const SERVICENOW_TARO_HYDERABAD_2022_URL = `${SERVICENOW_TARO}/senior-software-engineer-frontend-hyderabad-march-1-2022-no-offer-positive-83f4f1a9/`;
const SERVICENOW_TARO_HYDERABAD_2024_URL = `${SERVICENOW_TARO}/frontend-engineer-hyderabad-february-1-2024-no-offer-positive-1799e9aa/`;
const SERVICENOW_TARO_SANTA_CLARA_2023_URL = `${SERVICENOW_TARO}/senior-software-engineer-frontend-santa-clara-ca-january-1-2023-no-offer-positive-b6750124/`;
const SERVICENOW_TARO_SANTA_CLARA_2024_URL = `${SERVICENOW_TARO}/senior-front-end-engineer-santa-clara-ca-january-1-2024-no-offer-neutral-902ecc84/`;
const SERVICENOW_BLIND_STAFF_2021_URL = 'https://www.teamblind.com/post/servicenow-phone-screen-staff-engineer-interview-8msftqw8';
const SERVICENOW_BLIND_STAFF_2021_LABEL = 'Public thread: ServiceNow staff engineer phone screen, frontend-leaning, September 2021';
const SERVICENOW_BLIND_SENIOR_2021_URL = 'https://www.teamblind.com/post/servicenow-interview-uno44gdk';
const SERVICENOW_BLIND_AMS_2022_URL = 'https://www.teamblind.com/post/ServiceNow-rounds-for-Software-engineer-front-end-focused-DZOzBuaO';
const SERVICENOW_BLIND_IC2_2025_URL = 'https://www.teamblind.com/post/servicenow-frontend-swe-ic2-interview-n7rqq1v2';
const SERVICENOW_HOW_WE_HIRE_URL = 'https://careers.servicenow.com/how-we-hire/';

export const SERVICENOW_PREVIEW_TITLE = 'ServiceNow Frontend Interview Questions: {#questions} Reported + Prep Guide';
export const SERVICENOW_PREVIEW_H1 = 'ServiceNow Frontend Interview Questions';
export const SERVICENOW_PREVIEW_DESCRIPTION =
  'ServiceNow frontend interview: the screening call, JavaScript and algorithm rounds, a design or machine-coding round, the hiring manager and {#questions} reported questions.';
export const SERVICENOW_PREVIEW_CANONICAL_PATH = '/companies/servicenow/preview';
export const SERVICENOW_PREVIEW_TRUST_NOTE =
  'Candidates posted these accounts on LeetCode Discuss, Medium, Blind and Taro between 2021 and 2025, and one comes from a ServiceNow engineer looking back on their own interviews. Each is retold in our words; ServiceNow has not confirmed any of them, and every answer guide here is FrontendAtlas\'s own. Ask your recruiter which team and which rounds you will get.';

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
      'ServiceNow frontend accounts from 2022 to 2025 describe a short screening call, two technical rounds of JavaScript, algorithm problems or design, a design or machine-coding round in some loops, and a hiring manager round. The {questions} questions under the table come from those accounts and a few others; the first, a polyfill of the array map method, is open to everyone.',
    caveat:
      'Rounds depend on the team, a ServiceNow engineer wrote on Blind in 2022, and there is no question bank. Two Santa Clara loops moved from a recruiter call to coding rounds, only algorithms in the 2024 one, and a 2025 plan put the hiring manager before the technical rounds.',
    chips: ['{#questions} reported questions', '{#reports} public reports, 2021–2025', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'What the ServiceNow rounds test: the language itself, then problems against a clock',
    paragraphs: [
      'Many ServiceNow rounds test the language itself rather than a framework. The open question, the array map method without the built-in, came in the first technical round of a 2025 loop, after a screening call, with closures, promises and console output; the same candidate\'s second technical round went deeper into closures and polyfills, and the hiring manager round mixed JavaScript concepts with discussion. A ServiceNow-badged engineer on Blind gave the reason in 2021: the company has its own framework, so the fundamentals count for more than React or Angular.',
      'Algorithms are the other half: three problems with output questions in a 2025 first round, three problems in a 2023 second round, and nothing else in a 2024 Santa Clara loop. The hardest problem a ServiceNow-badged reply had seen was a LeetCode medium, usually on strings or stacks. Hiring managers asked for code as well as talk: sample JSON turned into a given output in 2022, a mixed array deep-flattened and grouped by type in 2025, and a voting poll with percentage charts in a 2025 loop, where the candidate lost ten to fifteen minutes to an error and showed the results as numbers. Get the logic working before the presentation.',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked November 2026',
    title: 'Where these ServiceNow accounts come from, and what they cannot settle',
    paragraphs: [
      'The accounts are candidates\' own posts from 2021 to 2025 on LeetCode Discuss, Medium, Blind and Taro, with replies from ServiceNow-badged engineers on four Blind threads. Most are for UI or frontend roles from IC2 to senior. Taro places two in Hyderabad and two in Santa Clara and dates each to the first of a month, one Blind thread comes from Amsterdam, and the rest give no place.',
      'They show which kinds of rounds came up and part of what was asked. They cannot fix the order: most accounts met the hiring manager after the technical rounds, while a 2022 Amsterdam loop and a 2025 plan put that round first. Nor can they say how your team interviews; a ServiceNow engineer on a 2022 thread says it depends on the team and that there is no question bank. Ask the recruiter which team you are joining, whether it is a platform or an applications team, how many technical rounds there are and which editor you will use.',
    ],
  },
  roleLenses: {
    kicker: 'Role lenses',
    title: 'Platform or applications: two kinds of ServiceNow team',
    intro:
      'A 2024 senior UI candidate learned only in the last of three rounds that ServiceNow has platform and applications teams, and two accounts name their team: a user-experience platform team in 2025, and in 2022 a dashboards team the candidate believed they were joining. The lenses follow ServiceNow\'s platform and applications work; ask the recruiter which one yours is.',
    items: [
      {
        title: 'UI platform and the web client runtime',
        description:
          'The 2025 plan was for a user-experience platform team that works on the web client runtime framework. A ServiceNow-badged engineer said in 2021 that the company builds on its own framework, and another guesses that this team mostly uses AngularJS.',
        practiceFocus:
          'The language without a framework: polyfills, closures and scope, turning a tree of plain objects into DOM nodes, and data flow you can draw without React.',
      },
      {
        title: 'Applications and product teams',
        description:
          'The 2024 candidate had applied for an applications engineer role and asked on LeetCode whether that work is more configuration than code; the 2022 Amsterdam candidate believed they were joining a dashboards team, without saying which kind.',
        practiceFocus:
          'Machine-coding builds that list, search and filter data in React, Angular or plain JavaScript, and a small feature taken from its data model to a working screen.',
      },
    ],
  },
  prompts: {
    kicker: 'Answer guides',
    title: 'How to answer the reported ServiceNow questions',
    intro:
      'Under each row it answers, a guide lists the questions to ask first, the points a strong answer makes and the mistake interviewers pick up on.',
    itemListName: 'ServiceNow frontend answer guides',
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
        // The thread asks about a staff phone screen; the virtual DOM task is what a ServiceNow engineer recalls from their own interviews.
        reportedRound: { label: 'Public thread: a ServiceNow engineer recalls their own interviews, September 2021', url: SERVICENOW_BLIND_STAFF_2021_URL },
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
    kicker: 'Mini walkthrough',
    title: 'Four decisions before your map polyfill runs',
    intro:
      'The open question, worked from the contract of the native method to the loop, in the order you would say each decision aloud.',
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
    intro: 'One day per kind of round, in the order most of the accounts met them, starting with the open question.',
    days: [
      { day: 'Day 1', focus: 'The open question: write the array map method without the built-in, then test it against holes, a this argument and a callback that is not a function.', artifact: 'A map polyfill and the tests that pin its contract.' },
      { day: 'Day 2', focus: 'Spoken JavaScript: an hour of core language questions answered aloud, each with a two-line example, the way several first technical rounds ran.', artifact: 'Twelve recorded answers, replayed once for gaps.' },
      { day: 'Day 3', focus: 'Algorithm hour: three problems in sixty minutes, the load of a whole round in a 2023 account; a 2025 first round also set three, beside output questions.', artifact: 'Three solutions with their complexity and the inputs you tested.' },
      { day: 'Day 4', focus: 'Deeper JavaScript: a second hour on the language in which you write the code instead of describing it, and defend each choice when pushed.', artifact: 'Five functions written against a timer, each with a note on what could break it.' },
      { day: 'Day 5', focus: 'Design and build: sketch the data model and components of a small feature, then build its core logic before any styling, as the design rounds of a 2022 and a 2025 account asked.', artifact: 'One small feature, designed on a page and working in plain JavaScript.' },
      { day: 'Day 6', focus: 'Machine coding: build one small screen twice, in plain JavaScript and in React or Angular, since a 2024 round let the candidate choose.', artifact: 'Two versions of one screen and a note on what the framework saved you.' },
      { day: 'Day 7', focus: 'Hiring manager and mock loop: why ServiceNow and why you are leaving, a past project in depth, then a coding round and a JavaScript round back to back.', artifact: 'Your questions for the recruiter: the team, platform or applications, how many technical rounds and which editor.' },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common ServiceNow frontend interview preparation questions',
    items: [
      {
        question: 'Are these the real ServiceNow questions?',
        answer:
          'They are what candidates reported on LeetCode Discuss, Medium, Blind and Taro from 2021 to 2025, plus one ServiceNow engineer\'s memory of their own interviews, retold in our words; ServiceNow has confirmed none of them. A ServiceNow-badged commenter on a 2022 Blind thread says the questions depend on the team and that there is no question bank.',
      },
      {
        question: 'Should I prepare React or Angular?',
        answer:
          'Plain JavaScript first. A ServiceNow-badged reply from 2021 says the company has its own framework, so knowing the fundamentals matters more than React or Angular, and a 2025 reply guesses that the user-experience team mostly uses AngularJS. A 2024 Hyderabad machine-coding round let the candidate choose React, Angular or plain JavaScript, and a 2024 Santa Clara candidate for a front-end role was asked no React or JavaScript questions at all.',
      },
      {
        question: 'How hard are the algorithm questions?',
        answer:
          'Mostly LeetCode medium where a level is given, though a 2025 first round included a problem that LeetCode rates hard. A ServiceNow engineer\'s reply from 2021 describes LeetCode mediums that are still real-world problems, and a 2025 reply calls a medium the hardest it has seen, usually on strings or stacks. Some rounds pack three problems into an hour, and a 2024 Santa Clara loop asked nothing but algorithms.',
      },
      {
        question: 'Is there a system design round?',
        answer:
          'In some loops. A 2025 IC2 loop had high- and low-level design in its second round and a design problem to build with the hiring manager, a 2025 plan lists a 90-minute panel on algorithms and system design, and a ServiceNow engineer\'s reply from 2021 mentions a round on UI design and data flow. The 2025 UI loop on Medium and a 2024 Santa Clara loop had no design round.',
      },
      {
        question: 'Which coding environment should I expect?',
        answer:
          'A 2023 Santa Clara loop began its technical part with a HackerRank screen, and a commenter on a 2022 Amsterdam thread says ServiceNow uses HackerRank for technical interviews. The other accounts do not name the editor, so ask your recruiter.',
      },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Free drills for a JavaScript-first loop',
    intro:
      'Free FrontendAtlas tasks for the formats the ServiceNow accounts describe: a polyfill like the open question, the this binding it relies on, a stack problem, a list screen, an algorithm plan and a story structure. None is a reported question.',
    items: [
      { label: 'Implement arrayForEach', description: 'A free polyfill in the shape of the open question, with thisArg and sparse arrays.', path: '/javascript/coding/js-array-foreach' },
      { label: 'What this refers to in a callback', description: 'The binding a polyfill has to pass on to its callback.', path: '/javascript/trivia/js-this-keyword' },
      { label: 'Valid Parentheses', description: 'A stack problem, the kind a ServiceNow-badged Blind reply names.', path: '/javascript/coding/js-valid-parentheses' },
      { label: 'Data structures and algorithms for frontend interviews', description: 'A plan for rounds that hold three problems in an hour.', path: '/guides/interview-blueprint/dsa-for-fe' },
      { label: 'A list with loading, error and empty states', description: 'An hour-sized React build for the machine-coding round.', path: '/react/coding/react-fetch-list-states' },
      { label: 'STAR stories for the hiring manager', description: 'A structure for the behavioural part and the question on why ServiceNow.', path: '/guides/behavioral/stories' },
    ],
  },
  sources: {
    kicker: 'Public interview reports and official context',
    title: 'Sources and evidence limits',
    intro: 'Each note says who posted the account, which rounds it describes and, where it says, how it ended.',
    items: [
      { label: SERVICENOW_MEDIUM_2025_LABEL, url: SERVICENOW_MEDIUM_2025_URL, note: 'A first-person account posted in September 2025: a screening call, a round on JavaScript and React fundamentals, a deeper JavaScript round and a short hiring manager round, then a hold and a rejection. The open question comes from its first technical round.', kind: 'report' },
      { label: 'Public report: software engineer (UI) IC2 loop on LeetCode Discuss, March 2025', url: SERVICENOW_LEETCODE_IC2_2025_URL, note: 'Interviews from 4 March 2025 over three days, posted that week: a coding round, a second technical round on high- and low-level design the same day, a hiring manager round with a design problem to build, and a general talk with a director. The candidate says they were selected.', kind: 'report' },
      { label: 'Public report: frontend IC2 loop on LeetCode Discuss, September 2023', url: SERVICENOW_LEETCODE_FRONTEND_2023_URL, note: 'Three one-hour rounds: JavaScript, HTML and CSS with basic problem solving, a round of algorithm problems, then a hiring manager round of motivation, JavaScript and one more problem. Selected, but the position was filled.', kind: 'report' },
      { label: 'Public report: Taro senior software engineer (frontend) loop, Hyderabad, March 2022 (approximate date)', url: SERVICENOW_TARO_HYDERABAD_2022_URL, note: 'A recruiter call a week after a LinkedIn message, then four rounds: JavaScript concepts with basic coding, programming on trees and arrays, a design and coding round in plain JavaScript, and a techno-managerial round with the hiring manager. Told every round was cleared, the candidate shared a salary figure and heard nothing more.', kind: 'report' },
      { label: 'Public report: Taro frontend engineer interview, Hyderabad, February 2024 (approximate date)', url: SERVICENOW_TARO_HYDERABAD_2024_URL, note: 'One interview with a coding problem and a machine-coding task. The candidate picked the language for the problem and could build in React, Angular or plain JavaScript, HTML and CSS; the interviewer helped when they were stuck. No offer.', kind: 'report' },
      { label: 'Public report: Taro senior software engineer (frontend) loop, Santa Clara, January 2023 (approximate date)', url: SERVICENOW_TARO_SANTA_CLARA_2023_URL, note: 'A recruiter call, a HackerRank screen and three technical rounds, one of them with a manager; after the screen the candidate had to chase the company for each round. No offer.', kind: 'report' },
      { label: 'Public report: Taro senior front-end engineer loop, Santa Clara, January 2024 (approximate date)', url: SERVICENOW_TARO_SANTA_CLARA_2024_URL, note: 'A recruiter screen, then one-hour interviews that were all coding: algorithm problems only, with no React, JavaScript or system design questions. The last interview went wrong over an inefficient approach. No offer.', kind: 'report' },
      { label: 'Public thread: ServiceNow frontend software engineer (IC2) interview, November 2025', url: SERVICENOW_BLIND_IC2_2025_URL, note: 'A plan posted before the interviews, for a team the poster was told works on the user-experience platform: a 45-minute behavioural and code-along round with the hiring manager, then a 90-minute panel on algorithms and system design. A ServiceNow-badged reply guesses that the team mostly uses AngularJS and calls a LeetCode medium on strings or stacks the hardest it has seen.', kind: 'report' },
      { label: 'Public thread: ServiceNow rounds for a front-end focused engineer, Amsterdam, October 2022', url: SERVICENOW_BLIND_AMS_2022_URL, note: 'A mid-level candidate, by their own reading, on what they believed was the dashboards team: a 10-minute recruiter call, then a competency-based hiring manager round of behavioural and past-project questions, with a 2-hour and a 1-hour technical interview to follow. Commenters say the questions depend on the team, and one says ServiceNow uses HackerRank.', kind: 'report' },
      { label: SERVICENOW_BLIND_STAFF_2021_LABEL, url: SERVICENOW_BLIND_STAFF_2021_URL, note: 'A question about a staff full-stack phone screen with a frontend focus. A ServiceNow-badged engineer answers with their own interviews: problems at the level of a LeetCode medium that still look like real work, JavaScript implementation questions and a round on UI design and data flow. The poster does not say how the screen went.', kind: 'report' },
      { label: 'Public thread: ServiceNow senior engineer phone screen, frontend-leaning, February 2021', url: SERVICENOW_BLIND_SENIOR_2021_URL, note: 'A question about a frontend-leaning senior phone screen. Two ServiceNow-badged replies: one expects JavaScript questions and says to know the fundamentals rather than React or Angular, because ServiceNow has its own framework; the other adds problem solving. No questions are reported.', kind: 'report' },
      { label: 'Public report: staff software engineer (full stack) interview on LeetCode Discuss, December 2025', url: SERVICENOW_LEETCODE_STAFF_2025_URL, note: 'After a referral in November, one hour-long technical interview: an algorithm problem, SQL questions, a frontend question and a coding problem. Rejected after a few weeks on hold.', kind: 'report' },
      { label: 'Public report: IC2 hiring manager round on LeetCode Discuss, June 2025', url: SERVICENOW_LEETCODE_HM_2025_URL, note: 'A post on one hiring manager round for an IC2 role: a JavaScript coding problem with follow-up questions, solved in code during the round. It says nothing about the other rounds.', kind: 'report' },
      { label: 'Public report: senior software engineer (UI) applications role on LeetCode Discuss, November 2024', url: SERVICENOW_LEETCODE_APPLICATIONS_2024_URL, note: 'A candidate waiting for a result after three rounds for an applications engineer role, who learned only in the last round that ServiceNow has platform and applications teams. No questions are reported.', kind: 'report' },
      { label: 'ServiceNow: How we hire', url: SERVICENOW_HOW_WE_HIRE_URL, note: 'Official page, read through its October 2026 Wayback copy because the live page answers with a bot check. Three steps, application, interview and decision; interview rounds vary by position and may include a technical coding assessment or a presentation, then the hiring team debriefs and decides. Nothing on frontend content.', kind: 'official' },
    ],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full ServiceNow practice set',
    copy:
      'Premium opens each locked ServiceNow row with its practice task and the answer guide written for it, and the rest of the premium library.',
    buttonLabel: 'Unlock the full ServiceNow practice set',
    src: 'company_preview_servicenow',
  },
  about: [
    'ServiceNow frontend interview preparation',
    'Array map polyfill in JavaScript',
    'ServiceNow JavaScript and algorithm rounds',
    'ServiceNow hiring manager round',
  ],
  indexAnchorLabel: 'ServiceNow frontend interview questions',
};
