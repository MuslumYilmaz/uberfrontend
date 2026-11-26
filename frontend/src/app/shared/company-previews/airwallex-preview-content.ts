import type { AuthoredCompanyPreview } from './authored-company-preview.model';

/**
 * Airwallex frontend interview guide. The reported questions live with the process table
 * (company-interview-processes.ts), and the prompts here are the answer guides of its six locked rows. The guide names
 * no source (`sourceDisplay: 'year'`): rows and rounds show the years their accounts give, and the method note says how
 * the questions were collected. The take-home known from candidates' published solutions and a 2021 candidate's notes
 * from mainland China are described in decoders, in our own words, with no brief, brand or repository. Open sections
 * (decoders, FAQ, free practice, plan days) name a locked row by its topic only and never link its free practice task.
 * Nothing here is a leaked or confirmed Airwallex question.
 */
export const AIRWALLEX_PREVIEW_TITLE = 'Airwallex Frontend Interview Questions: {#questions} Reported + Prep Guide';
export const AIRWALLEX_PREVIEW_H1 = 'Airwallex Frontend Interview Questions';
export const AIRWALLEX_PREVIEW_DESCRIPTION =
  'Airwallex frontend interview: live React tasks, a take-home with a review panel, AI in its 2026 interviews and {#questions} reported questions.';
export const AIRWALLEX_PREVIEW_CANONICAL_PATH = '/companies/airwallex/preview';
export const AIRWALLEX_PREVIEW_TRUST_NOTE =
  "Each row comes from a candidate's own account of an Airwallex interview or from Airwallex's published hiring posts, told in our words. Two rows rest on a single curated account and say so. Airwallex has confirmed none of the candidate accounts, none of it comes from a leaked question, and the answer guides are our own work; treat each row as a single interview, not a pattern.";

export const AIRWALLEX_COMPANY_PREVIEW: AuthoredCompanyPreview = {
  slug: 'airwallex',
  label: 'Airwallex',
  title: AIRWALLEX_PREVIEW_TITLE,
  h1: AIRWALLEX_PREVIEW_H1,
  description: AIRWALLEX_PREVIEW_DESCRIPTION,
  canonicalPath: AIRWALLEX_PREVIEW_CANONICAL_PATH,
  trustNote: AIRWALLEX_PREVIEW_TRUST_NOTE,
  hero: {
    kicker: 'Public Airwallex prep guide',
    subtitle:
      "Airwallex's 2022 hiring post sets a 60-minute tech screen, a take-home or live coding, a design and problem-solving interview and a final with a senior leader, and a 2026 post says its interviews now test working with AI. Frontend accounts from Singapore and Australia add live React tasks, a take-home review panel and project deep dives. {questions} reported questions sit below the table: a data task, a tree traversal and ambiguous real-world problems are open, and the React questions, the take-home with its review and the 2026 online assessments are locked.",
    caveat:
      'No frontend account describes an AI round yet, no frontend account from the United States goes past an HR call, and the newest frontend loop, a curated 2026 account, stops after two online assessments, where the candidate withdrew. We found no published solution of the long-running take-home after April 2025.',
    chips: ['{#questions} reported questions', '{#reports} public reports, 2019–2026', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'Expect live React with follow-ups, and a take-home you defend in detail',
    paragraphs: [
      'In Singapore in 2025 the first technical round was live: a self-introduction, then a React to-do list grown with unit tests and API calls in whatever order you choose, with the interviewer guiding; another 2025 account names a tree traversal among its coding questions, beside a React task. Practise building the list, then writing its tests, then wiring it to an API, and say which order you pick and why.',
      'The take-home and its review have run the longest: a one-page site with a validated form that posts to an API, with candidates publishing solutions from 2016, a choice between it and live coding in the 2022 post, and a 1.5-hour panel on your code, approach and stack in 2023. Even if the take-home has been retired, its review questions carry over: how you would improve the code, what your tests cover, how its testing and CI/CD would work. Have an answer ready for every decision in your own submission.',
      'Four frontend accounts, from 2021 to 2025, include a round on your projects, and a 2023 Sydney final kept asking follow-up questions based on your answers; the 2022 post puts a senior engineering leader in the final, and a 2026 post says the London bar raiser asks how you use AI. Prepare two or three projects in depth, a few sentences on which AI tools you work with and how you check their output, and, for senior roles, an answer on whether you have worked with FX or payments.',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked November 2026',
    title: "Frontend accounts from three cities, and Airwallex's own posts: what each covers",
    paragraphs: [
      'The list draws on {reports} public reports. Interview-experience pages give frontend loops from 2019 to 2025 in Singapore, Melbourne and Sydney, and general software engineering loops from 2024 to 2026; a curated account adds a 2026 frontend loop of two online assessments; a discussion thread and a 2023 forum post add general context. Two rows rest on that one curated account, and no frontend account from the United States goes past an HR call.',
      "Airwallex's own pages are its 2022 post on getting hired, a 2026 post on its AI-first culture that says how its interviews now treat AI, a 2026 post on engineering in London and its early-careers page; these {official} pages are Airwallex's word, and none is specific to frontend. Three questions for your recruiter: take-home or live coding, which rounds allow AI tools, and who runs the final.",
    ],
  },
  roundSpotlights: [
    {
      id: 'ai-in-the-loop',
      kicker: 'Round decoder',
      title: "AI in Airwallex's 2026 interviews: the rule and what candidates saw",
      lede: [
        'Airwallex said in 2026 that its engineering interviews now test working with AI rather than banning it, and in London the bar raiser asks how you use AI in your work.',
        "No frontend account describes an AI round yet, so the facts below come from Airwallex's pages and from general software engineering loops.",
      ],
      facts: [
        {
          label: 'Interns',
          value:
            'A 2026 intern posting in Singapore said the stages may assess how you solve problems with and without AI assistance, and how you evaluate, refine or challenge suggestions an AI makes.',
        },
        {
          label: 'Without AI first',
          value: "A senior engineer's 2026 account opens with about 30 minutes of coding without AI or documentation; the rest of it is not public.",
        },
        {
          label: 'An AI-assisted build',
          value:
            'A curated 2026 backend account describes a round that grows Tic-Tac-Toe into an app with AI tools, judged on using the AI well while understanding what it produced.',
        },
        {
          label: 'Frontend so far',
          value: "A 2026 senior frontend candidate for a San Francisco role wrote after an HR call that the AI product track needs a manager's permission. No frontend account describes an AI round.",
        },
        {
          label: 'Where this comes from',
          value: "Airwallex's 2026 posts and an intern posting, and accounts from general software engineering loops in 2026.",
        },
      ],
      practiceLink: { label: 'Warm up without AI on the scheduler answer guide', fragment: 'name-keyed-scheduler' },
      processLink: { label: 'See the London stages in the reported process', fragment: 'airwallex-interview-process-4-stage-bar-raiser' },
    },
    {
      id: 'take-home',
      kicker: 'Round decoder',
      title: 'The Airwallex take-home and the panel that reviews it',
      lede: [
        "Candidates published solutions to an Airwallex take-home from 2016 to April 2025; Airwallex's 2022 post offers it as a choice instead of live coding and says candidates typically finish it in 3 to 4 hours.",
        'The review that follows is a round of its own: a 1.5-hour panel in a 2023 Sydney loop, and the opening of the design interview in the 2022 post.',
      ],
      facts: [
        {
          label: 'What it was',
          value: 'A one-page site built around a single form, known from the solutions candidates published from 2016 to 2025. The locked take-home row describes it in our words.',
        },
        {
          label: 'What reviewers look at',
          value:
            'Whether it works, how readable it is, the quality, not the quantity, of its tests, and how you would improve it, per the 2022 post; the review row in the list adds what candidates reported.',
        },
        {
          label: 'Live instead',
          value: "The 2022 post's live option is a harder problem in 60 minutes, with assumptions, edge cases, tests and the time complexity.",
        },
        {
          label: 'Status',
          value: 'We found no published solution dated after April 2025, and the 2025 Singapore accounts describe live coding, so the take-home may have been retired.',
        },
        {
          label: 'Where this comes from',
          value: "Airwallex's 2022 post, frontend accounts from 2021 and 2023, and the solutions candidates published.",
        },
      ],
      practiceLink: { label: 'Read the review panel answer guide', fragment: 'take-home-review-panel' },
      processLink: { label: 'See the review panel in the reported process', fragment: 'airwallex-interview-process-2-stage-take-home-review-panel' },
    },
    {
      id: 'china-2021',
      kicker: 'Round decoder',
      title: 'A 2021 frontend loop in mainland China: React 17, webpack and micro-frontends',
      lede: [
        "One candidate's notes from a 2021 frontend loop, apparently in mainland China, describe two rounds; for the first, the notes say no frontend basics and no algorithm questions were asked.",
        'We retell them in our words; they are the only frontend account from mainland China that we found.',
      ],
      facts: [
        {
          label: 'Round one',
          value:
            'What React 17 changed; whether class and function components differ in memory and performance; how webpack works, whether you have written a loader or a plugin, and how you would optimise performance; and micro-frontends, where the candidate guessed the interviewer wanted to hear how several apps share common libraries.',
        },
        {
          label: 'Round two',
          value: 'Your projects; how you think about designing base components; micro-frontends again, with single-spa; questions related to security; and, asked in English, a mistake you made and how you fixed it.',
        },
        {
          label: 'Language',
          value: 'Airwallex staff wrote in 2019 that interviews there were in Chinese with perhaps a self-introduction in English, in 2022 that they were in Chinese with English tested along the way, and in 2018 that a written test followed a CV that passed.',
        },
        {
          label: 'Caveat',
          value: "One candidate's notes, with the place inferred and no interview date given. Airwallex's 2026 frontend postings still name micro-frontends and single-spa, but this loop may be historical.",
        },
      ],
      practiceLink: { label: 'Free: code splitting and module federation in React', path: '/react/trivia/react-code-splitting-module-federation' },
    },
  ],
  roleLenses: {
    kicker: 'Role lenses',
    title: 'Which Airwallex loop you are in: Singapore, Australia, or a senior or US role',
    intro: 'Frontend accounts come from Singapore, Australia and, thinly, the United States. Read the lens nearest your loop; each covers only what its accounts report.',
    items: [
      {
        title: 'Frontend engineers in Singapore',
        description:
          'Three 2025 accounts, two from Singapore and one that names no place: an HR screen; a live round of a React to-do list grown with tests and API calls, or coding problems on a shared screen; a second round on projects and one more algorithm (one account names a tree traversal without saying which round asked it); a question on React performance with a large dataset; and a third round no account describes.',
        practiceFocus: 'A React list grown with tests and an API, a tree traversal, and an answer for rendering large data.',
      },
      {
        title: 'Frontend engineers in Australia',
        description:
          'A senior loop in Sydney in 2023: a 30-minute recruiter screen, an hour on a recent project with an engineering manager and a lead engineer, a take-home, a 1.5-hour review panel and a final with an engineering director that ended in brain teasers. In Melbourne in 2025, an easy data-and-UI challenge, then in-person general questions; in 2019, an ad-hoc in-person interview, and a question on FX experience.',
        practiceFocus: 'A take-home you can defend in detail, a project deep dive that survives follow-ups, and a brain teaser talked through aloud.',
      },
      {
        title: 'Senior, staff and US roles',
        description:
          'A 2024 staff engineer loop in Melbourne, from a general engineering account: a recruiter, an experience interview with a staff engineer, a take-home or live code, and a design challenge. A curated 2026 frontend account that gives no level or place: two online assessments, a name-keyed async scheduler and an autocomplete design, before system design, behavioural, leadership and bar raiser rounds. In the United States, a 2026 senior frontend account stops after the HR call; postings in San Francisco and Seattle ask for React, TypeScript, micro-frontends and GraphQL, or web performance, with agentic UX preferred.',
        practiceFocus: 'Async control flow with cancellation, the public API of a component, and a design round on a domain problem.',
      },
    ],
  },
  prompts: {
    kicker: 'Answer guides',
    title: 'Answer guides for the locked Airwallex questions',
    intro:
      'Each locked row has an answer guide by FrontendAtlas; none comes from Airwallex. Guides that link a coding task send you to checks that run against your code and a reference solution.',
    itemListName: 'Airwallex frontend interview answer guides',
    items: [
      {
        id: 'take-home-review-panel',
        title: 'Defend your take-home in a review panel',
        statement:
          'Walk two reviewers through your take-home: your approach and stack, what your tests cover, how you would improve the code, and what production would need.',
        whatThisMeasures:
          'Whether you can explain and question your own decisions, take a better idea without defending everything, and show that you know what is missing.',
        clarifyFirst: [
          'Ask whether they want a demo first or to read the code with you.',
          'Ask which parts they want to go deep on: state, tests, styling or the API layer.',
          'Ask whether you may change the code during the session.',
          'Ask how long you have, so the walkthrough leaves room for their questions.',
        ],
        strongAnswer: [
          'Open with a two-minute tour: the structure, the main decision you made and the one you would revisit.',
          'Explain each library by what it saved you and what it costs, such as a form library against hand-written validation.',
          'Show your tests by behaviour rather than by file: the error paths, the sending state, the server error, and what you did not test and why.',
          'Name what production needs: error tracking, accessibility checks, protection against double submits, environment config, and a CI pipeline that runs the tests.',
          'When a reviewer suggests a change, weigh it aloud and say when you would take it.',
        ],
        commonMiss: 'Defending every line, or apologising for every gap, instead of saying plainly what you chose, what you skipped and why.',
        resourceLabel: 'Practise defending and extending a take-home in review (Premium)',
        resourcePath: '/react/trivia/react-take-home-table-review-questions',
      },
      {
        id: 'name-keyed-scheduler',
        title: 'Run async tasks in lanes by name, with cancel and clear',
        statement:
          'Write a scheduler where tasks under one name run one after another and different names run side by side, then add cancel and clear by name.',
        whatThisMeasures:
          'Whether you can model a queue per key, settle every promise exactly once, abort work cleanly and keep one name from touching another.',
        clarifyFirst: [
          'Ask what a task receives and returns: an AbortSignal and a promise, or a callback.',
          'Ask what cancel does to the running task and to the ones waiting behind it.',
          'Ask whether a cancelled task that resolves later may still report a result.',
          'Ask whether events are needed, such as start, done, error and cancel.',
        ],
        strongAnswer: [
          'Keep a map from each name to a lane: the running task and a first-in, first-out queue. Start the next task when the running one settles, and delete the lane when it empties.',
          'Call the task inside a try, so a task that throws at once rejects like one that rejects later, and its lane moves on either way.',
          "Give each task its own AbortController; cancel aborts it, rejects its promise with the signal's AbortError and starts the next task at once.",
          'Mark each job settled the first time it settles, so a cancelled task that answers late changes nothing and cannot free its lane a second time.',
          'Let clear reject the running task and every waiting one of that name, and leave every other name alone.',
          "If events are asked for, fire done, error or cancel before the next task's start, and let each listener be removed on its own.",
        ],
        commonMiss:
          'Waiting for a cancelled task to notice its signal before starting the next one, or letting its late answer settle the promise or start the next task again.',
        resourceLabel: 'Build the name-keyed scheduler on a fake clock (Premium; checks and a reference solution)',
        resourcePath: '/javascript/coding/js-named-task-scheduler',
      },
      {
        id: 'autocomplete-component-design',
        title: 'Design a reusable autocomplete input on a search API',
        statement:
          'Design a reusable autocomplete search input on top of an existing search API, from the API contract to the components a team would import.',
        whatThisMeasures:
          "Whether you can design a component's API as well as its behaviour: request control, caching, accessibility, and what stays internal.",
        clarifyFirst: [
          'Ask what the API returns, and whether it pages and limits results.',
          'Ask who uses the component: one product, or many teams with their own styling.',
          'Ask how fresh results must be, which decides how long cache entries live.',
          'Ask whether the results render in a popup that must escape scrolling containers.',
        ],
        strongAnswer: [
          'Call the API with a debounce on typing, cancel a request when a newer query replaces it, and ignore answers that arrive out of order.',
          'Debounce rather than throttle for typing, since only the last query matters; throttling fits scroll-driven loading of more pages.',
          'Cache by query, page and limit with a bounded LRU, so a cached page never answers a different request, and say when popular results or string distance help, such as for empty or misspelt queries.',
          'Split it into an input, a label, a field wrapper and a popup rendered through a portal, with a portal manager so several popups stack correctly.',
          'Keep the public props small (value, onChange, a fetch function, a render function for items, onSelect) and the rest internal, and build it as an ARIA combobox with a listbox and aria-activedescendant.',
          'Name the trade-offs you would test: the cache size, the debounce delay, and what the popup does on a phone.',
        ],
        commonMiss: 'Exporting every internal piece as public API, or caching without a bound, so the component is hard to change and leaks memory in a long session.',
        resourceLabel: 'Practise the design of real-time search with debounce and caching (Premium system design)',
        resourcePath: '/system-design/realtime-search-debounce-cache',
      },
      {
        id: 'invite-take-home',
        title: 'Build a small app as a take-home',
        statement: 'Build a small, tested app as a take-home of a few hours.',
        whatThisMeasures: 'Whether you can turn a short brief into a finished, tested and accessible app, and keep the scope honest.',
        clarifyFirst: [
          'Check which framework, build tool and styling the brief requires, and whether tests are required.',
          'Check the API contract: what a success and an error look like, and whether some address always fails.',
          'Check the layout sketch and which parts you may restyle.',
          'Check what the README must cover: how to install, start and test the app.',
        ],
        strongAnswer: [
          'Build the page shell first: a header and a footer that stay put, a title, a short intro line and one call-to-action button, working on a phone without zooming.',
          'Open the form in an accessible dialog: focus moves in and back, Escape and a click outside close it, and closing clears the fields and errors.',
          'Validate before sending: required fields, a name of at least three characters, an email that looks valid and a second email that matches, with the errors shown inline.',
          "Send one request with a sending state, block double submits, show a success view that closes back to the page, and on an error show the server's own message and let the user send again.",
          'Test the behaviour: each validation error, no request while input is invalid, the sending state, success, the server error and a retry that succeeds.',
          'Write the README for a reviewer: how to run it, what you tested and what you would add for production.',
        ],
        commonMiss:
          "Shipping a polished page whose error path was never tried, or showing a generic error instead of the server's own message, so the address the server rejects never gets the message it should.",
        resourceLabel: 'Build a contact form that posts, with loading, success and error (Premium; checks and a reference solution)',
        resourcePath: '/react/coding/react-contact-form-starter',
      },
      {
        id: 'todo-list-in-parts',
        title: 'Build a React to-do list live',
        statement: 'Build a to-do list in React in a live coding round.',
        whatThisMeasures: 'Whether you can build a small React feature cleanly and then make it testable and connected, choosing an order and explaining it.',
        clarifyFirst: [
          'Ask what the list needs first: add, toggle, delete, a count of open items.',
          'Ask which test tools are set up, and whether they expect component or unit tests.',
          'Ask what the API looks like and whether it can fail.',
          'Ask whether you may choose the order of the remaining parts, and say which you pick.',
        ],
        strongAnswer: [
          'Build the list with clear state: add a trimmed, non-blank task, toggle one task, delete one, and show the count of open tasks, with an accessible name on every control.',
          'Pull the list logic into plain functions so the tests do not need the UI: adding trims and rejects blanks, toggling flips one task, deleting removes one, and the count is right.',
          'Wire the API with loading, error and retry on load, and decide whether saves are optimistic; if they are, roll back on failure and say so.',
          'Track the latest request for each task and drop an answer for a task when a newer request for the same task has gone out, so a slow save cannot overwrite a newer change on screen; if the server can apply writes out of order, send a version with each save.',
          'Say why you chose your order of tests and API: the round leaves the order to you, and your reason shows how you plan.',
        ],
        commonMiss: 'Writing the whole feature inside one component so it cannot be tested without the UI, then running out of time before the API part.',
        resourceLabel: 'Warm up on a to-do list with local state (free; checks and a reference solution)',
        resourcePath: '/react/coding/react-todo-list',
      },
      {
        id: 'react-large-dataset',
        title: 'Keep a React app fast with a large dataset',
        statement: 'Explain how you would optimise the performance of a React application that shows a large dataset.',
        whatThisMeasures: 'Whether you measure before you optimise and choose fixes by cause: too many DOM nodes, too many renders, or too much work in each render.',
        clarifyFirst: [
          'Ask how large: thousands of rows in a table, a long feed, or a chart with many points.',
          'Ask what the user does with it: scroll, filter, sort or edit cells.',
          'Ask where the data comes from and whether all of it has to load at once.',
          'Ask which devices matter, since a phone has far less headroom.',
        ],
        strongAnswer: [
          'Measure first with the React Profiler and the browser performance panel, and name what is slow: the first render, scrolling or updates.',
          'Render only what is visible: virtualise long lists and tables so a few dozen rows exist however long the data is.',
          'Stop needless renders: keep state close to where it changes, memoise rows with stable props, and avoid passing new objects and callbacks on every render.',
          'Move heavy work off the render path: compute derived data once, memoise selectors, and run very heavy parsing or sorting in a Web Worker.',
          'Load less: page or stream from the server, and filter and sort there when the data is too large for the client.',
          'Keep input responsive with transitions or deferred values for filters, so typing is handled first and the list catches up, as long as each row renders quickly.',
        ],
        commonMiss: 'Wrapping everything in useMemo and memo without measuring, which adds overhead and misses the real cost of ten thousand DOM nodes.',
        resourceLabel: 'Build a virtualized list that keeps twenty nodes for 10,000 rows (free; checks and a reference solution)',
        resourcePath: '/react/coding/react-virtualized-list-recycling',
      },
    ],
  },
  prepPlan: {
    kicker: 'Actionable preparation',
    title: 'A 7-day Airwallex frontend interview preparation plan',
    intro:
      'Seven days that follow an Airwallex loop: the live React task, an algorithm, the take-home and its review, design, the AI question, and the project deep dive that several accounts report.',
    days: [
      {
        day: 'Day 1',
        focus: 'A small React feature built live: say each decision aloud, in about an hour.',
        artifact: 'A working feature and a list of the decisions you explained.',
        practice: [{ label: 'To-do list with local state', path: '/react/coding/react-todo-list' }, { label: 'Fetch and render a list with loading, error and empty states', path: '/react/coding/react-fetch-list-states' }],
      },
      {
        day: 'Day 2',
        focus: 'Algorithms at medium level, timed: a tree traversal, a graph search and a dynamic programming problem, 30 minutes each.',
        artifact: 'Three solutions with their time complexity said aloud.',
        practice: [{ label: 'Build a tree from a flat list of nodes', path: '/javascript/coding/js-build-tree-from-flat-list' }],
      },
      {
        day: 'Day 3',
        focus: 'A take-home in three to four hours: a small app built around a form, tested, with a README.',
        artifact: 'A finished app with tests and a README a reviewer can follow.',
        practice: [{ label: 'Contact form with an HTTP submit', path: '/react/coding/react-contact-form-starter' }],
      },
      {
        day: 'Day 4',
        focus: "The review: explain your take-home's decisions, tests and gaps to someone who questions each one, for an hour.",
        artifact: 'Two-minute answers on your stack, your tests and what production needs.',
        practice: [{ label: 'Defending and extending a take-home in review', path: '/react/trivia/react-take-home-table-review-questions' }],
      },
      {
        day: 'Day 5',
        focus: 'Design: a reusable component with a clean API, and a live product such as a messaging app, at the length of a 60 to 90 minute interview.',
        artifact: 'A diagram and the trade-offs you would defend.',
        practice: [{ label: 'Real-time search with debounce and caching (system design)', path: '/system-design/realtime-search-debounce-cache' }, { label: 'System design blueprint', path: '/guides/system-design-blueprint' }],
      },
      {
        day: 'Day 6',
        focus: 'Performance and AI: a large dataset in React, then one problem solved without AI and another with an assistant whose suggestions you check, about two hours in all.',
        artifact: 'A profiled fix with numbers, and notes on what the assistant got wrong.',
        practice: [{ label: 'Virtualized list: 10,000 rows, twenty nodes', path: '/react/coding/react-virtualized-list-recycling' }, { label: 'useMemo against useCallback', path: '/react/trivia/react-usememo-vs-usecallback' }, { label: 'Name-keyed task scheduler: one lane per name, with cancel and clear', path: '/javascript/coding/js-named-task-scheduler' }],
      },
      {
        day: 'Day 7',
        focus:
          "The deep dive: two or three projects with every decision explained, a mistake and how you fixed it, and why Airwallex; read its values and operating principles.",
        artifact: 'Project notes ready for follow-ups, and questions for the recruiter on rounds, AI and the take-home.',
        practice: [{ label: 'STAR stories guide', path: '/guides/behavioral/stories' }],
      },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common Airwallex frontend interview preparation questions',
    items: [
      {
        question: 'How many interview rounds does Airwallex have for frontend engineers?',
        answer:
          "Airwallex's 2022 post describes five stages for its engineering hires: a recruiter call, a 60-minute tech screen, a take-home or live coding, a design and problem-solving interview, and a final with a senior leader. Frontend accounts from 2025 describe two or three rounds, three in a Singapore loop; a 2023 Sydney loop had four interviews and a take-home, one interview being a 1.5-hour panel on it. Loops took about two weeks in three accounts and four weeks in one (2019); a general staff loop in 2024 also took four weeks.",
      },
      {
        question: 'Are these real Airwallex interview questions?',
        answer:
          "Each comes from a candidate's account of an Airwallex interview or from Airwallex's own posts, in our words. Airwallex has not confirmed the candidate accounts, and none of it comes from a leaked question. Two rows rest on one curated account and say so; read every row as one candidate's interview.",
      },
      {
        question: 'Does Airwallex ask LeetCode questions?',
        answer:
          "Often in general software loops. Airwallex's 2022 post sets questions at the level of easy and medium LeetCode problems in the tech screen and advises practising medium and hard ones, and general accounts from 2026 report graph and dynamic programming problems. One 2025 frontend account lists a tree traversal beside a React task, and a 2021 frontend loop asked dynamic programming questions.",
      },
      {
        question: 'Does Airwallex still give a take-home?',
        answer:
          'Its 2022 post offers a take-home of about 3 to 4 hours or a live coding problem, your choice. Candidates published solutions to the landing-page take-home from 2016 to April 2025, and the 2025 Singapore accounts describe live coding, so it may have been retired. Ask your recruiter.',
      },
      {
        question: 'Can I use AI in an Airwallex interview?',
        answer:
          'Airwallex said in 2026 that its engineering interviews test working with AI rather than banning it, and its London bar raiser asks how you use AI in your work. How that applies to a frontend round is not reported yet; a general 2026 screen opened with a part without AI. Confirm the rule for each round with your recruiter.',
      },
      {
        question: 'Which framework does Airwallex use in frontend interviews?',
        answer:
          'React, as far as the reports go: every frontend posting and every frontend account that names a framework names it, and the postings add TypeScript; a billing posting in Singapore also asks for a second framework such as Vue or Angular, and postings name micro-frontends and GraphQL.',
      },
      {
        question: 'Who runs the final interview at Airwallex?',
        answer:
          "In Airwallex's 2022 post the final is with a senior engineering leader, usually the CEO, the CTO or a VP of Engineering; a 2023 Sydney final was with an engineering director and a senior engineer, and the 2026 London final is a bar raiser interview. A 2022 commenter wrote that the CEO signs off on more senior hires.",
      },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Free practice for the Airwallex rounds',
    intro:
      'Free practice for an Airwallex loop: data on a small UI, a tree to build and walk, memoisation, micro-frontends, a design outline and stories for the deep dive. None of it comes from Airwallex.',
    items: [
      {
        label: 'Fetch and render a list with loading, error and empty states',
        description: 'The 2025 Melbourne challenge fetched data, did simple operations on it and showed it on a basic UI.',
        path: '/react/coding/react-fetch-list-states',
      },
      {
        label: 'Build a tree from a flat list of nodes',
        description: 'A tree to build and then walk, for the tree traversal a 2025 frontend loop asked.',
        path: '/javascript/coding/js-build-tree-from-flat-list',
      },
      {
        label: 'useMemo against useCallback',
        description: 'What each one saves, and when memoising makes a component slower.',
        path: '/react/trivia/react-usememo-vs-usecallback',
      },
      {
        label: 'Code splitting and module federation in React',
        description: 'Shared code across separately deployed apps, the core of a micro-frontend question.',
        path: '/react/trivia/react-code-splitting-module-federation',
      },
      {
        label: 'System design blueprint',
        description: 'A structure for the 60 to 90 minute design and problem-solving interview.',
        path: '/guides/system-design-blueprint',
      },
      {
        label: 'STAR stories guide',
        description: 'For the project deep dive and the final with a senior leader.',
        path: '/guides/behavioral/stories',
      },
    ],
  },
  methodNote: {
    kicker: 'Method',
    title: 'How we collected these questions',
    paragraphs: [
      "We read first-person interview reports that candidates published on interview-review sites and community forums, interview notes candidates shared publicly, and Airwallex's careers posts and job postings, up to 25 November 2026. A question is listed once with the years it was reported. Frontend questions stay, with the general ones frontend candidates also meet, such as algorithms, behavioural questions and take-home reviews; backend-only topics such as database design are left out.",
      'A take-home whose brief is known only from the solutions candidates published is described in our own words, without the brief\'s wording or brand, and a single curated account backs two rows, which say so. Rounds vary by office, team and year, so practise each row as one candidate\'s report.',
    ],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full Airwallex practice set',
    copy: 'Premium opens the locked Airwallex rows and their answer guides, plus a practice task for the async task scheduler, with automated checks and a reference solution.',
    buttonLabel: 'Unlock the full Airwallex practice set',
    src: 'company_preview_airwallex',
  },
  about: [
    'Airwallex frontend interview preparation',
    'Airwallex take-home and review panel',
    'AI in Airwallex engineering interviews',
    'Async task scheduler interview question',
  ],
  indexAnchorLabel: 'Airwallex frontend interview questions',
};
