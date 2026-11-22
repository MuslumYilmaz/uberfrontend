import type { AuthoredCompanyPreview } from './authored-company-preview.model';

/**
 * Binance frontend interview guide. The reported questions live with the process table
 * (company-interview-processes.ts); the prompts here are the answer guides of all twenty locked rows and of the open
 * first row, one guide per row. The rounds come from
 * interview.tw, PTT, GoodJob, Juejin and Medium accounts of loops from 2020 to 2024, all in Chinese; the guide's own
 * sources list adds what the table does not cite: Binance's careers page, its post on early-career programs, the three
 * frontend postings read on 16 November 2026, a 2022 Blind comment, two interview.tw cards on algorithms, and three 2025
 * posts from other roles cited only for language. Open sections (decoders, FAQ, free practice, plan days) name a locked
 * row by its topic only and never link its practice task. Nothing here is a leaked, confirmed or official Binance question.
 */
const BINANCE_INTERVIEWTW_2022_URL = 'https://interview.tw/c/CmbI';
const BINANCE_INTERVIEWTW_2022_LABEL = 'Public report: interview.tw frontend engineer loop, 2022';
const BINANCE_JUEJIN_2020_URL = 'https://juejin.cn/post/6844904096948813832';
const BINANCE_JUEJIN_2020_LABEL = 'Public report: Juejin frontend write-up, posted March 2020';

export const BINANCE_PREVIEW_TITLE = 'Binance Frontend Interview Questions: {#questions} Reported + Prep Guide';
export const BINANCE_PREVIEW_H1 = 'Binance Frontend Interview Questions';
export const BINANCE_PREVIEW_DESCRIPTION =
  'Binance frontend interview: remote rounds of quick JavaScript and React questions, short utilities, an order book over a socket and {#questions} reported questions.';
export const BINANCE_PREVIEW_CANONICAL_PATH = '/companies/binance/preview';
export const BINANCE_PREVIEW_TRUST_NOTE =
  'Every row in the list goes back to a post on interview.tw, GoodJob, PTT, Juejin, Medium or Hacker News, and all but the Hacker News comment are in Chinese. The English wording is ours and keeps to what each post says. None of it is leaked material, nothing here has been confirmed by Binance, and FrontendAtlas wrote the answer guides. Most posts describe Taiwan and remote loops from 2020 to 2022: treat each as one person\'s loop in one year.';

export const BINANCE_COMPANY_PREVIEW: AuthoredCompanyPreview = {
  slug: 'binance',
  label: 'Binance',
  title: BINANCE_PREVIEW_TITLE,
  h1: BINANCE_PREVIEW_H1,
  description: BINANCE_PREVIEW_DESCRIPTION,
  canonicalPath: BINANCE_PREVIEW_CANONICAL_PATH,
  trustNote: BINANCE_PREVIEW_TRUST_NOTE,
  hero: {
    kicker: 'Public Binance prep guide',
    subtitle:
      'Accounts of Taiwan and remote frontend loops from 2020 to 2022 describe three remote technical rounds, sometimes a fourth, with HR closing the 2020 loop; the early rounds are a quick run of JavaScript, React and browser questions with a short utility to write. {questions} reported questions follow the table, and any whose wording would add nothing to its topic is open to read.',
    caveat:
      'The newest round-by-round account is from May 2022, and most locked questions come from that single four-round loop; the 2020 and 2021 Taiwan and remote accounts have the same three-round shape with fewer exact questions. Where an account says where an interviewer came from, it was Taiwan or mainland China, and one 2022 round switched to English for a conversation.',
    chips: ['{#questions} reported questions', '{#reports} public reports, 2020–2025', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'Prepare for a stream of questions, not one long problem',
    paragraphs: [
      "The 2022 account's first two rounds held nine and fourteen questions, a short utility to write among quick questions on React internals, redux and the browser; a 2021 round began with online coding on CodeShare and went on to event delegation and the event loop; the 2024 senior candidate called the whole interview a continuous run of questions. Practise answering in two or three sentences and stopping, so the interviewer picks where to go deeper, and write a throttle, a flatten without flat, a dedupe without Set, a compose and a deep copy until each takes a few minutes.",
      "Go below the API. The 2022 candidate's advice is that Binance's interviews lean hard on understanding JavaScript and React from the inside: know many implementations and their edge cases, and how React and redux are implemented. The questions bear that out: why hooks exist and why they cannot be conditional, what fiber does, what the render and commit phases do, how connect reaches the store, and redux, which came up in 2020, 2021 and 2022, with its data flow asked in 2020 and 2022.",
      'Then performance and the order book. A 2020 round leaned on optimising a web app for a given scenario, two 2021 rounds discussed React performance and a performance problem a user reports, and the 2022 loop asked about a slow page again beside the order book on the spot trading page, which a socket floods with data. Prepare one method for finding what is slow and one answer for rendering data that changes faster than the screen can show, and keep a three-minute English account of your biggest project ready for the last rounds.',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked November 2026',
    title: 'Where the Binance evidence stops, and what only your recruiter can tell you',
    paragraphs: [
      'The rounds rest on three round-by-round accounts of Taiwan and remote loops (a Medium post on a 2020 loop, a 2021 PTT post and a 2022 interview.tw card), a 2021 GoodJob account, a Juejin write-up posted in March 2020 that names no place, and a 2024 GoodJob account from a senior candidate; {reports} public reports in all. Other interview.tw cards from 2020 to 2022 add their first question or line each; the rest of their text, and about 2,000 characters of the 2022 card, are locked on interview.tw and were not read.',
      "Binance publishes nothing on its engineering rounds. Its careers page gives application review, interviews, an offer and onboarding; its post on early-career programs lists possible assessments and interviews; and the three frontend postings read in November 2026 ask for React, Vue or TypeScript and AI tools in development work, and one requires fluency in Mandarin. These {official} pages are the official side of the guide. No account places its loop outside Taiwan; a 2022 Blind comment by a senior frontend candidate gives no place, and two 2025 accounts from other roles and a 2025 referral post are cited only for language. Before your loop, find out from the recruiter the number of rounds on your team, the language they run in, and whether a take-home is part of it.",
    ],
  },
  roundSpotlights: [
    {
      id: 'technical-rounds',
      kicker: 'Round decoder',
      title: "Binance's technical rounds: a quick run of questions with short code to write",
      lede: [
        'In the frontend accounts from 2021 to 2024, an early technical round is a remote call that moves fast from one question to the next: a short utility to write, then questions on JavaScript, React internals, redux and the browser.',
        "The 2022 account's first round held nine questions and its second fourteen, and the 2024 senior candidate described the interview as a continuous run of questions with none about the résumé.",
      ],
      facts: [
        {
          label: 'Format',
          value:
            'Remote in every Taiwan and remote account: three phone rounds before HR in 2020; in 2021 three rounds planned and a fourth added, with the code written on CodeShare; four video rounds in 2022. The 2021 candidate heard about one to two hours after each round whether it was passed.',
        },
        {
          label: 'Round one, 2022',
          value:
            "Nine questions: a throttle to write, two on hooks and their rules, when a higher-order component pays off, how react-redux's connect gets data into a component, the browser cache, HTTP status codes, what typeof returns and whether instanceof keeps walking the prototype chain.",
        },
        {
          label: 'Round two, 2022',
          value:
            "Fourteen questions: the technology at the candidate's company, String.includes and three array methods, a flatten and a dedupe to write, the event loop with a snippet to trace, the redux data flow, useMemo and useCallback, a localStorage read that came back empty, an order book fed by a socket, and two questions on keeping a token safe.",
        },
        {
          label: 'The 2021 and 2020 rounds',
          value:
            'In 2021 the first round was online coding on CodeShare, then event delegation, the event loop, capture and bubbling and React internals; the second, announced as algorithms, garbage collection and bundlers, asked instead about React performance, set a React coding exercise and asked about new ESNext and React features and keys. In 2020 a frontend engineer from Taiwan discussed the render and commit phases and Redux state management and set JavaScript whiteboard questions, and the second round leaned on performance.',
        },
        {
          label: 'The 2024 senior run',
          value:
            'A senior candidate with three years of experience, who was not hired, describes one continuous run of questions on CSS, React, JavaScript, tooling such as Webpack and algorithm problems, with no question about the résumé, and rated the experience 2.0 on GoodJob.',
        },
        {
          label: 'Algorithms',
          value:
            'A 2021 account names JavaScript fundamentals and algorithms, and the 2024 run had algorithm problems; no round-by-round account names a problem. Two interview.tw cards do: a quick sort to implement in a second technical stage (2022), and a 2020 loop whose questions were all algorithms but one on CSS. The author of the Medium post met easy to medium LeetCode problems at every company in that write-up, Binance among them.',
        },
        {
          label: 'Who interviews',
          value:
            "Where the accounts say, a frontend engineer from Taiwan led a 2020 first round and a senior engineer from mainland China a 2021 one, and the author of the Medium post met interviewers from Taiwan and from China. The 2021 PTT candidate says the third round was partly in English, with Chinese still the main language.",
        },
        {
          label: 'What candidates advise',
          value:
            "Binance's interviews lean hard on understanding JavaScript and React from the inside: know many implementations and their edge cases, and how React and redux are implemented (2022); have solid fundamentals (2021); prepare the fundamentals and expect a string of questions (2024).",
        },
        {
          label: 'Where this comes from',
          value: 'Accounts on interview.tw (2022), PTT (2021), GoodJob (2021 and 2024) and Medium (a 2020 loop), and two interview.tw cards (2020 and 2022).',
        },
      ],
      practiceLink: { label: 'Find your gaps with the free fundamentals quiz', path: '/guides/interview-blueprint/quiz' },
      processLink: { label: 'See the technical rounds in the reported process', fragment: 'binance-interview-process-1-stage-technical-round-1' },
    },
    {
      id: 'fourth-round-and-english',
      kicker: 'Round decoder',
      title: 'The Binance fourth round and the English check: what candidates were asked',
      lede: [
        'Two accounts had a fourth technical round, for different reasons: in 2021 the head of the department the candidate was referred to had not interviewed them yet, and in 2022 a team that was hiring saw candidates who passed round two first and turned this one down in round three, so a fourth round with another interviewer followed.',
        "The 2022 round mixed technical questions with the candidate's motives, and near the end the interviewer asked whether the candidate's English was all right and switched to it for a conversation.",
      ],
      facts: [
        {
          label: 'The 2022 round',
          value:
            "The interviewer introduced himself and the day's plan, then asked about the end-to-end testing at the candidate's company, the projects on the résumé, the proudest achievement of their working years, why they wanted to leave, micro-frontends, a React snippet, fiber, page caching and a CDN, a list component fed by an API and list recycling, and code review. Then came the English conversation, what the candidate hoped to gain at Binance, the interviewer's rules for working under him, and what would make the candidate leave Binance.",
        },
        {
          label: 'The 2021 round',
          value:
            'WebSocket, CDN, CORS, redux, error handling and async questions, added because the head of the department the candidate was referred to had not interviewed them yet. The candidate decided to join Binance.',
        },
        {
          label: 'Language in the frontend accounts',
          value:
            'Where the accounts say where an interviewer came from, it is Taiwan or mainland China. The 2021 candidate says the third round was partly in English, with Chinese still the main language, and that no language requirement came up; the 2022 fourth round switched to English for a conversation. A 2022 senior frontend candidate on Blind interviewed in English with a first interviewer from China whose English was hard to follow.',
        },
        {
          label: 'Postings and other roles',
          value:
            "One of the three frontend postings read in November 2026, a frontend-oriented full-stack role on facial recognition, requires fluency in Mandarin. A 2025 Java candidate's first phone review was entirely in English but asked mostly about the projects on the résumé, and a 2025 candidate for a Golang role advises preparing everything in English, though it depends on the team. A 2025 V2EX referral post for frontend and other roles gives the working language as mainly Chinese, with reading and writing English enough and good English a plus.",
        },
        {
          label: 'What to have ready',
          value:
            'Your biggest project told in English in about three minutes, then why you are leaving, what you want from Binance and what would make you leave, each short enough to leave room for the follow-up.',
        },
        {
          label: 'Where this comes from',
          value:
            'interview.tw (2022) and PTT (2021) for the fourth rounds; replies under the PTT post, a Blind comment (2022), a 2026 posting, two GoodJob accounts (2025) and a V2EX post (2025) for the language.',
        },
      ],
      practiceLink: { label: 'Shape your stories with the STAR stories guide', path: '/guides/behavioral/stories' },
      processLink: { label: 'See the fourth round in the reported process', fragment: 'binance-interview-process-1-stage-team-or-fourth-technical-round' },
      drill: {
        note: "The questions come from the 2022 account's third and fourth rounds, translated from Chinese. That fourth round switched to English for a conversation whose topic the account does not give, so the first question asks for your biggest project in English; the others can be practised in either language.",
        questions: [
          {
            id: 'biggest-project-in-english',
            text: 'In English: tell me about the biggest or most complex project you have worked on so far, or the one that contributed most to your company.',
            source: 'interview.tw, 2022',
          },
          { id: 'greatest-achievement', text: 'What is the achievement you are proudest of in your years of work?', source: 'interview.tw, 2022' },
          { id: 'why-leave', text: 'Why do you want to leave your current job?', source: 'interview.tw, 2022', kind: 'view' },
          { id: 'what-you-hope-to-gain', text: 'If you join Binance, what do you hope to gain?', source: 'interview.tw, 2022', kind: 'view' },
          { id: 'what-would-make-you-leave', text: 'At Binance, what would make you want to leave?', source: 'interview.tw, 2022', kind: 'view' },
          { id: 'code-review', text: 'What is your view of code review?', source: 'interview.tw, 2022', kind: 'view' },
        ],
        checks: [
          'I can tell it in English in about three minutes without reading from notes.',
          'It names the frontend decisions I made, so a technical follow-up has somewhere to go.',
        ],
        viewChecks: ['I can say it in English in under a minute.', 'The reason would still hold at Binance, and it is not a complaint about my current team.'],
      },
    },
  ],
  roleLenses: {
    kicker: 'Role lenses',
    title: 'Which Binance loop you are in: Taiwan or remote, the Juejin write-up, or senior',
    intro: 'Three groups of accounts stand behind the list. Read the lens closest to your own loop first; each gives only what its own accounts asked.',
    items: [
      {
        title: 'Frontend engineers, Taiwan and remote',
        description:
          'Accounts of loops in 2020, 2021 and 2022 with three remote technical rounds, HR closing the 2020 one, and a fourth round in 2021 and 2022. They asked for short utilities (a throttle, a flatten without flat, a dedupe without Set), React internals and redux, the browser cache and HTTP, a performance scenario or a slow page, the order book over a socket, and in the last round a list component, list recycling, code review and a conversation in English.',
        practiceFocus:
          'Utilities written without the built-in that does the job, React and redux explained from the inside, a method for a slow page, and an answer for data that changes faster than the screen can show.',
      },
      {
        title: 'Frontend engineers, the Juejin write-up',
        description:
          'A write-up posted in March 2020 that names no place, with two technical rounds: a compose function with an unknown number of arguments and a deep copy, closures, hooks and fiber, redux and how to build it, the publish-subscribe and singleton patterns and permissions for routes, pages and navigation; then a modal and a tooltip to write live, which the candidate did not finish, file upload and project highlights.',
        practiceFocus: 'Components written live together with where they mount, and redux and React internals at the level of how you would build them.',
      },
      {
        title: 'Senior candidates',
        description:
          'A 2024 senior candidate had a continuous run of questions on CSS, React, JavaScript, Webpack and algorithms with no résumé questions. A 2022 senior frontend candidate on Blind had basic frontend questions and abstract data types with an interviewer from China, and a 2021 comment describes an earlier opening, which the commenter took to lean staff, that came with a take-home: a K-line chart and a live price table built with no library.',
        practiceFocus: 'Breadth across CSS, JavaScript and tooling at speed, and drawing charts on a canvas if your opening may set a take-home.',
      },
    ],
  },
  prompts: {
    kicker: 'Answer guides',
    title: 'Answer guides for the reported Binance questions',
    intro:
      'FrontendAtlas wrote an answer guide for every locked row and for the open first row. Binance set none of them.',
    itemListName: 'Binance frontend interview answer guides',
    items: [
      {
        id: 'order-book-over-a-socket',
        title: 'Keep an order book fed by a socket fast and correct',
        statement:
          "Binance's spot trading page shows an order book that the server feeds over a socket with a large volume of updates. Explain how the frontend takes in that volume of data and keeps both the page fast and the book correct for the user.",
        whatThisMeasures:
          'Whether you separate receiving data from drawing it: merging updates into a correct book, checking their order, rendering on a clock instead of per message, drawing only what is visible and keeping the main thread free.',
        clarifyFirst: [
          'Ask how the feed works: a full snapshot followed by incremental updates (a price, its new size and a sequence number), or a full book every time.',
          'Ask how many updates arrive per second at peak and how many price levels the page shows, since a dozen visible rows and a deep ladder need different work.',
          'Ask what the user must never see: a stale best price, bids and asks that cross, or a level that should have gone.',
          'Ask what shares the page with the book, such as a chart and an order form, since they compete for the same main thread.',
        ],
        strongAnswer: [
          'Keep the book outside React state: apply each message to a map of price to size for each side as it arrives, delete a level whose size drops to zero, and keep the best bid and ask in order.',
          'Check the sequence: drop updates older than the snapshot, hold those that arrive before it, and when a number is skipped, fetch a new snapshot rather than draw a book you know is wrong.',
          'Render on a clock, not per message: flush to the UI once per animation frame, or every 100 ms or so, so a burst of hundreds of messages becomes one render.',
          'Draw only the visible levels, a fixed number on each side, in fixed-height rows that update in place, and group levels by price step when the user zooms out; virtualise the list only for a deep ladder.',
          'Keep the main thread free: parse and merge in a Web Worker when the volume is high and send the UI only the rows it shows, and memoise rows so a level whose size did not change does not re-render.',
          'Show change without noise: flash a cell when its size changes, limit how often it flashes, and show a reconnecting state and the time of the last update when the socket drops.',
        ],
        commonMiss:
          'Calling setState for every socket message, so the book re-renders far more often than the screen can show and falls behind the price it displays, or merging updates without checking their sequence, so one lost message leaves a level that no longer exists.',
        resourceLabel: 'Build an order book from a snapshot and a burst of updates (Premium)',
        resourcePath: '/react/coding/react-order-book-socket-feed',
        reportedRound: { label: BINANCE_INTERVIEWTW_2022_LABEL, url: BINANCE_INTERVIEWTW_2022_URL },
      },
      {
        id: 'token-storage-and-safety',
        title: 'Say where a token should live in the browser and how to keep it safe',
        statement:
          'The backend gives the frontend a token after login. Explain how you make sure it is safe, then compare keeping it in localStorage with keeping it in a cookie: what each choice exposes and what closes the gap.',
        whatThisMeasures:
          'Whether you know the two attacks that matter, a script reading the token (XSS) and another site making the browser use it (CSRF), which storage each one reaches, and what the server must do besides.',
        clarifyFirst: [
          'Ask what the token is: a short-lived access token, a long-lived refresh token or a session ID, since each deserves different storage.',
          'Ask whether the API is on the same site as the page (the same registrable domain, such as api.example.com beside www.example.com) or on another site, which decides whether a cookie is sent at all and which SameSite setting works.',
          'Ask whether the page loads third-party scripts, since any script on the page can read localStorage.',
        ],
        strongAnswer: [
          'localStorage: any script running on the origin can read it, so one XSS hole hands over the token, and it stays until removed; the browser never sends it by itself, so on its own it is not exposed to CSRF.',
          'A cookie the server sets with HttpOnly, Secure and SameSite (Lax or Strict): scripts cannot read it, it travels only over HTTPS and most cross-site requests leave it out; close the remaining CSRF risk with a CSRF token or an Origin check on requests that change state.',
          'A common split: keep a short-lived access token in memory and a refresh token in an HttpOnly cookie on a narrow path, so a reload costs one refresh call and a stolen access token soon expires.',
          'Make the token itself safe: the server verifies its signature and expiry on every request, refresh tokens rotate and are revoked on logout, and nothing secret goes into a JWT payload, which is only encoded.',
          'Prevent XSS in the first place with a Content Security Policy, no innerHTML with user data and dependencies you audit, because a script running on your page can act as the user whatever the storage.',
        ],
        commonMiss:
          'Saying an HttpOnly cookie makes the app safe from XSS: it hides the token, but an injected script can still send requests as the user, so XSS has to be prevented, not only contained.',
        resourceLabel: 'Compare cookies, sessionStorage and localStorage (free)',
        resourcePath: '/javascript/trivia/js-cookie-sessionstorage-localstorage',
        reportedRound: { label: BINANCE_INTERVIEWTW_2022_LABEL, url: BINANCE_INTERVIEWTW_2022_URL },
      },
      {
        id: 'slow-page-triage',
        title: 'Follow up a user who says a page is slow, then make it faster',
        statement:
          "A user reports that a page is slow. Say how you follow it up, how you tell a slow page from a slow connection on the user's side, and, once the problem is confirmed, which optimisations you would reach for.",
        whatThisMeasures:
          "Whether you measure before you optimise: the user's context, a reproduction with numbers, network, server and browser time told apart, and fixes chosen by what the measurements show.",
        clarifyFirst: [
          'Ask what slow means to the user: the first load, one interaction, scrolling, or the page getting slower the longer it stays open.',
          'Ask for their device, browser, connection and location, and whether other users or other pages are slow too.',
          'Ask whether the site collects real-user timings, such as Core Web Vitals and resource timings, or errors, since those answer half the questions before you reproduce anything.',
        ],
        strongAnswer: [
          "Collect the context and reproduce: the page, the time, the device and the steps, then reproduce with CPU and network throttling that match the user's.",
          "Split the time: slow DNS, connection or download on every resource points to the user's network; a long wait between sending the request and its first byte points to the server; fast responses followed by a slow paint or long tasks point to the page itself.",
          'Use field data to tell one user from many: real-user timings by country, device and connection show whether the problem follows the network or the page.',
          'For loading: less JavaScript through code splitting by route, compressed assets cached for a long time under hashed names, images in the right size and format, preconnect hints for critical origins, and server rendering or a CDN for the first view.',
          'For interaction: find the long tasks in the Performance panel, stop re-rendering what did not change, virtualise long lists, debounce expensive handlers and move heavy work off the main thread.',
          'Close the loop: measure again on the same setup, tell the user what changed, and keep a performance budget or a monitor so the page does not slow down again.',
        ],
        commonMiss:
          "Listing optimisations before establishing what is slow, or blaming the user's network without checking whether the server or the page's own JavaScript takes the time.",
        resourceLabel: "Read how to cut a page's load time (free)",
        resourcePath: '/javascript/trivia/web-performance-optimize-load-time',
        reportedRound: { label: BINANCE_INTERVIEWTW_2022_LABEL, url: BINANCE_INTERVIEWTW_2022_URL },
      },
      {
        id: 'event-loop-order-and-timeout-zero',
        title: 'Predict the log order of a timer, a promise and a then, and say why',
        statement:
          'Explain the event loop, then trace the snippet the account sketches: a `setTimeout` that logs 0, a `new Promise` whose executor logs 1 (assume it calls resolve), a `then` that logs 2, and a `console.log(3)`. Say why the timer logs last, and how long a timeout of 0 ms really waits.',
        whatThisMeasures:
          'Whether you know what runs at once, what waits as a microtask and what waits as a task, and can trace a snippet line by line instead of guessing.',
        clarifyFirst: [
          'Ask whether the executor calls resolve, since a then on a promise that never settles never logs.',
          'Ask whether the code runs in a browser or in Node.js; both give this order, but their timers differ in detail.',
          'Ask whether they want only the order or the state of the queues after each line.',
        ],
        strongAnswer: [
          'The script is one task: setTimeout schedules its callback as a later task, the Promise executor runs at once, logs 1 and resolves the promise, so the then call that follows queues its callback as a microtask straight away, and console.log(3) logs 3.',
          "When the script's task ends, the engine empties the microtask queue before it takes another task, so 2 logs next and the timer's callback logs 0 last: 1, 3, 2, 0.",
          'A timeout of 0 means no sooner than now, not now: the callback waits for the current task and every microtask, browsers raise nested timers to at least 4 ms after five levels of nesting, and background tabs slow timers further.',
          'Microtasks are promise reactions, queueMicrotask and MutationObserver callbacks; tasks are timers, events and messages. The browser renders between tasks, which is why a long chain of microtasks can hold up a paint.',
          'Prove it with a variation: put the then work after an await in an async function, add a second then, and trace where each callback lands.',
        ],
        commonMiss:
          'Logging 1 after 3 because the promise "is async": the executor runs at once, and only the then callback waits; or saying a 0 ms timer runs right after the current line.',
        resourceLabel: 'Predict the order step by step in the event loop visualizer (free)',
        resourcePath: '/javascript/trivia/js-event-loop',
        reportedRound: { label: BINANCE_INTERVIEWTW_2022_LABEL, url: BINANCE_INTERVIEWTW_2022_URL },
      },
      {
        id: 'hooks-rules-and-early-return',
        title: 'Explain why hooks exist and what an early return before one breaks',
        statement:
          'Say why React introduced hooks and why it forbids calling them conditionally. Then review a component that calls `useEffect`, returns early under an `if`, and calls a second `useEffect` after that return: what is wrong, and how do you fix it?',
        whatThisMeasures: 'Whether you know that React matches each hook to its state by call order, and can spot a hook that only some renders reach.',
        clarifyFirst: [
          'Ask whether the condition can change between renders of the same component; if it can, the number of hooks changes with it.',
          'Ask what the early return renders and whether the second effect should run in that case, which decides where the condition goes.',
        ],
        strongAnswer: [
          'Why hooks: state and effects in function components, logic shared through custom hooks instead of higher-order components and render props that nest wrappers, and related code kept together instead of split across lifecycle methods.',
          'How React finds a hook\'s state: it keeps a list for each component and walks it in call order on every render; hooks have no names, so the nth call must be the same hook every time.',
          'The snippet: when the condition holds, the component returns after one hook, and otherwise it calls two. Once the condition flips, React sees a different number of hooks and throws ("Rendered fewer hooks than expected" or "Rendered more hooks than during the previous render"), and the second effect never runs while the early return is taken.',
          'The fix: call every hook before any return and move the condition inside the effect (`useEffect(() => { if (!ready) return; … }, [ready])`), or move the second effect into a child component that renders only when the condition holds.',
          'Catch it before review: the react-hooks/rules-of-hooks lint rule flags a hook after an early return, inside a condition or inside a loop.',
        ],
        commonMiss: 'Wrapping the second useEffect call in the same condition instead of putting the condition inside the effect, which breaks the rule in another way.',
        resourceLabel: 'Read why hooks have rules (free)',
        resourcePath: '/react/trivia/react-why-hooks-have-rules',
        reportedRound: { label: BINANCE_INTERVIEWTW_2022_LABEL, url: BINANCE_INTERVIEWTW_2022_URL },
      },
      {
        id: 'redux-data-flow-and-cost',
        title: 'Say what redux is for, write its data flow, and build a small one',
        statement:
          'Explain what redux is for and write out how it processes data, from an event in the UI to a re-render. Then name the performance problems you have met with it, and explain how you would implement redux yourself.',
        whatThisMeasures:
          'Whether you know the one-way flow and the contract behind it (pure reducers, state that is never mutated, subscribers notified), can explain why a component re-renders, and can build the core in a few lines.',
        clarifyFirst: [
          'Ask whether they mean the redux core or Redux Toolkit with react-redux, since the boilerplate and the defaults differ.',
          'Ask how far the implementation should go: createStore with getState, dispatch and subscribe, or also middleware and combineReducers.',
        ],
        strongAnswer: [
          'What it is for: one store for state the whole app shares, changed only by dispatching plain action objects to pure reducers, so every change can be traced, tested and replayed; worth it when many distant components read and change the same state.',
          "The flow: the UI dispatches an action; middleware such as a thunk or a logger can intercept it; the root reducer computes the next state from the previous one without mutating it; the store notifies its subscribers; react-redux compares each component's selected value and re-renders only those whose value changed.",
          'Performance problems: a selector that returns a new object or array on every call, so its component re-renders after every action; a component subscribed to the whole state; large state copied on each change; and many small actions in a row. The fixes: narrow selectors, memoised selectors (reselect), normalised state, and fewer, larger actions (React 18 batches the renders, but every dispatch still runs every reducer and selector).',
          'The core by hand: `createStore(reducer)` keeps the state and a list of listeners; `getState` returns the state; `dispatch(action)` sets `state = reducer(state, action)` and calls every listener; `subscribe(listener)` adds one and returns a function that removes it; one init action fills the initial state.',
          'How components reach the store: a Provider puts the store in React context, and useSelector or connect subscribe to it, the mechanism behind the open question on connect in the 2022 loop.',
        ],
        commonMiss:
          "Mutating state inside a reducer, so the reference stays the same and the components that select it never re-render, unless the reducer runs inside Redux Toolkit's createSlice, where Immer turns the mutation into a copy.",
        resourceLabel: 'Read when a React app needs redux (free)',
        resourcePath: '/react/trivia/react-state-management-redux',
        reportedRound: { label: BINANCE_JUEJIN_2020_LABEL, url: BINANCE_JUEJIN_2020_URL },
      },
      {
        id: 'list-recycling-by-hand',
        title: 'Recycle the rows of a long list yourself',
        statement:
          'After writing a list component fed by an API, say how you would implement list recycling yourself: render only the rows in view, reuse their nodes as the user scrolls, and keep the scroll position honest.',
        whatThisMeasures:
          'Whether you can turn the idea of virtualisation into working parts: the visible window computed from the scroll position, a spacer that keeps the scroll bar true, and rows that stay correct while their content changes.',
        clarifyFirst: [
          'Ask whether rows have a fixed height, since variable heights need measuring and a cache of row positions.',
          'Ask how long the list gets and whether more items load as the user nears the end.',
          'Ask whether rows hold state of their own, such as an input or an expanded panel, which recycling must not lose or move to the wrong item.',
        ],
        strongAnswer: [
          'The window: from scrollTop and the viewport height, compute the first and last visible index (the first is scrollTop divided by the row height, rounded down) and render that slice plus a few rows of overscan above and below.',
          'The scroll bar: give an inner element the full height (row count times row height) and place the rendered rows with a transform or an absolute top, so the scroll bar and the scroll position behave as if every row existed.',
          'Recycling: keep a fixed pool of row elements about the size of the window, and when the window moves, give a node that left the view the data of a row that entered it instead of creating and destroying nodes. In React, keying the rendered slots by position reuses components, while keying by item id keeps item state with its item; choose by whether rows hold state.',
          'Smooth updates: read scrollTop in a passive scroll listener and move the window at most once per animation frame, and keep row heights stable so the content does not jump.',
          'Variable heights: start from an estimate, measure rendered rows with a ResizeObserver, store their offsets, and find the first visible row with a binary search over the offsets.',
          'Keep it usable: keyboard focus and find-in-page do not reach rows that are not rendered, so keep the focused row mounted and give each row aria-setsize and aria-posinset so a screen reader knows the length of the list.',
        ],
        commonMiss:
          'Rendering every row and hiding the ones out of view, which keeps the DOM as large as the list, or keying recycled slots by position while rows keep their own state, so text typed into one item shows up on another.',
        resourceLabel: 'Build a virtualized list of 10,000 rows with twenty nodes (free)',
        resourcePath: '/react/coding/react-virtualized-list-recycling',
        reportedRound: { label: BINANCE_INTERVIEWTW_2022_LABEL, url: BINANCE_INTERVIEWTW_2022_URL },
      },
      {
        id: 'react-fiber-core-function',
        title: 'Explain what React fiber is and what its core function is',
        statement:
          "Do you know React fiber, and what is its core function? A Juejin round also asked about hooks and fiber and for what it calls fiber's three ordering strategies.",
        whatThisMeasures:
          'Whether you can explain React from the inside in a few sentences: how rendering is split into units, why it can pause, and why the commit stays in one piece.',
        clarifyFirst: [
          'Ask whether they want the short answer or the scheduling detail: the 2022 round asked for the core function, the Juejin round for strategies.',
          'Ask which React they have in mind: before React 18 nearly all rendering was synchronous, and since React 18 concurrent features decide when rendering yields.',
        ],
        strongAnswer: [
          "What it is: React's reconciler since React 16. Every element in the tree gets a fiber, a plain object that holds its type, props, state and links to its child, sibling and parent, so the work of rendering becomes a list of units React can walk one at a time.",
          'Its core function: rendering that can be interrupted and prioritised. Before fiber, React rendered a tree in one synchronous recursion that could block the main thread through a large update; with the work in units, React can pause, give the browser a turn, resume, and throw away work when something more urgent arrives, though it yields only in concurrent rendering, which since React 18 means transitions and deferred values.',
          'The two phases: render builds the work-in-progress tree and, in concurrent rendering, can be interrupted and restarted, so it must stay pure; commit applies the changes to the DOM in one pass and cannot be interrupted, then runs layout effects, while `useEffect` callbacks usually run after the browser paints.',
          "The ordering question: the Juejin account does not spell out its three strategies (三大排序策略). They may be the three strategies of React's diffing (compare the tree level by level, by component type, and by key within a list) or its scheduling (priorities, time slicing, and interrupting and restarting work), so say which reading you answer, and give both if there is time.",
          "Priorities in code: updates carry a priority, which React's source tracks as lanes, and a click outranks a transition; `useTransition` and `useDeferredValue` mark work as less urgent, as in a search box that stays responsive while a long list re-renders.",
        ],
        commonMiss: 'Saying fiber makes React faster: it makes rendering interruptible and prioritised, and a large update rendered synchronously still blocks the main thread.',
        resourceLabel: 'Read what React fiber is and how it schedules work (free)',
        resourcePath: '/react/trivia/react-fiber-scheduling',
        reportedRound: { label: BINANCE_INTERVIEWTW_2022_LABEL, url: BINANCE_INTERVIEWTW_2022_URL },
      },
      {
        id: 'throttle-which-calls-run',
        title: 'Write a throttle and say which calls of a burst run',
        statement: "Write a throttle function: the first question of the 2022 loop's first round.",
        whatThisMeasures:
          'Closures and timers under time pressure, and whether you decide which calls of a burst run instead of leaving it to chance; the 2022 candidate advises knowing many implementations and their edge cases.',
        clarifyFirst: [
          'Ask whether the first call runs at once (leading) and whether the last call of a burst still runs when the wait ends (trailing).',
          'Ask whether the throttled function must keep `this` and its arguments, and whether it needs a `cancel`.',
        ],
        strongAnswer: [
          'Leading-only: keep the time of the last run; on each call, run the function with its `this` and arguments if the wait has passed, and ignore the call otherwise. This is the version the practice task asks for.',
          'Trailing as well: when a call arrives inside the wait, store its arguments and `this` and set one timer for the time left; when it fires, run the stored call, so the last call of a burst lands. Say that this changes which arguments win.',
          'Housekeeping: `cancel` clears the timer and the stored call; return nothing, or the last result if the caller needs one.',
          'Throttle versus debounce: a throttle runs at a steady rate during a burst, a debounce waits for the burst to stop. For a scroll handler, throttle what must follow the scroll, such as a progress bar, and debounce what may wait, such as saving the position.',
          'For drawing, `requestAnimationFrame` is a throttle tied to the screen: one run per frame, never faster than the display.',
        ],
        commonMiss: 'Mixing up throttle and debounce, or not saying which calls of a burst run, so the interviewer cannot tell whether a dropped last call is a bug or a choice.',
        resourceLabel: 'Write a leading-only throttle against tests, with a reference solution (Premium)',
        resourcePath: '/javascript/coding/js-throttle',
        reportedRound: { label: BINANCE_INTERVIEWTW_2022_LABEL, url: BINANCE_INTERVIEWTW_2022_URL },
      },
      {
        id: 'flatten-one-level-by-hand',
        title: 'Flatten an array without flat, then to any depth',
        statement: 'Write a function that turns `[[1,2,3], [2,3,4]]` into `[1,2,3,2,3,4]` without the built-in `flat`.',
        whatThisMeasures: 'Whether you can write the loop cleanly, keep items that are not arrays, and grow it to any depth without running out of stack.',
        clarifyFirst: [
          'Ask whether one level is enough or nesting can go deeper, and whether a depth argument is wanted, as `flat` takes.',
          'Ask whether `concat` and spreading are allowed, or only plain loops.',
        ],
        strongAnswer: [
          'One level: loop over the array, push the items of each nested array and push any other item as it is, so `[1, [2, 3]]` becomes `[1, 2, 3]`.',
          'The short form, `[].concat(...arr)`, flattens one level too, but it passes every item as an argument, so a very long array can throw a RangeError.',
          'Any depth: recurse with a depth counter that stops at zero, or, for very deep nesting, use a stack of arrays and indexes so the call stack never grows.',
          'Edge cases: keep strings and other iterables whole, skip holes in sparse arrays as `flat` does, and return a new array without touching the input.',
        ],
        commonMiss: 'Flattening every level when one was asked, or dropping the items that were never nested.',
        resourceLabel: 'Flatten one level against tests, with a reference solution (free)',
        resourcePath: '/javascript/coding/js-flatten-once',
        reportedRound: { label: BINANCE_INTERVIEWTW_2022_LABEL, url: BINANCE_INTERVIEWTW_2022_URL },
      },
      {
        id: 'dedupe-without-set-by-hand',
        title: 'Remove duplicates without Set, and match what Set would do',
        statement: 'Write a function that turns `[1,2,3,2,3,4]` into `[1,2,3,4]` without using `Set`.',
        whatThisMeasures: 'Whether you know how JavaScript compares values (NaN, -0, objects) and can trade a short quadratic answer for a linear one.',
        clarifyFirst: [
          'Ask whether the first occurrence must keep its place, and whether `Map` or a plain object is allowed.',
          'Ask whether the array can hold objects or mixed types such as `1` and `"1"`.',
        ],
        strongAnswer: [
          '`arr.filter((v, i) => arr.indexOf(v) === i)` keeps first occurrences in order, but it is quadratic and drops every NaN, because `indexOf` cannot find NaN.',
          'Pushing into a result only when `!result.includes(v)` keeps one NaN, as Set does, since `includes` compares with SameValueZero; it is still quadratic.',
          'Linear: a Map from value to `true`, checked before each push. A plain object as the lookup turns keys into strings, so `1` and `"1"` collide.',
          'Objects count as duplicates only by reference, as in Set; deduping by content needs a key function, such as an id.',
        ],
        commonMiss: 'Using an object as the lookup, so `1` and `"1"` count as one value, or sorting first and losing the original order.',
        resourceLabel: 'Remove duplicates against tests, with a reference solution (Premium)',
        resourcePath: '/javascript/coding/js-unique-array',
        reportedRound: { label: BINANCE_INTERVIEWTW_2022_LABEL, url: BINANCE_INTERVIEWTW_2022_URL },
      },
      {
        id: 'compose-with-any-arguments',
        title: 'Write compose when the number of arguments is not known',
        statement: "Write a compose function when the number of arguments is not known in advance; the account's note adds arguments and promises.",
        whatThisMeasures: 'Rest parameters, the `arguments` object, the direction of composition, and what changes when a step returns a promise.',
        clarifyFirst: [
          'Ask whether functions run right to left (compose) or left to right (pipe).',
          'Ask whether a step may return a promise, which makes the composed function return one too.',
        ],
        strongAnswer: [
          'Shape: `compose(...fns)` returns `(...args) => …`; the rightmost function takes every argument, and each result goes to the function on its left, which is `reduceRight` over the rest.',
          'Unknown arguments: rest parameters collect any number of them; in older code the same comes from `Array.prototype.slice.call(arguments)`.',
          'Empty and single: decide what `compose()` returns, usually its first argument, and make `compose(f)` behave like `f`.',
          'Promises: make the composed function `async` and await each step, or chain `then`, so a step that returns a promise passes its value on rather than the promise itself.',
          'Keep `this` if the caller needs it by calling the first step with `apply`.',
        ],
        commonMiss: 'Running the functions left to right, or passing all the original arguments to every function instead of only the rightmost one.',
        resourceLabel: 'Write compose against tests, with a reference solution (Premium)',
        resourcePath: '/javascript/coding/js-compose',
        reportedRound: { label: BINANCE_JUEJIN_2020_LABEL, url: BINANCE_JUEJIN_2020_URL },
      },
      {
        id: 'deep-copy-with-cycles',
        title: 'Write a deep copy that survives cycles and keeps its types',
        statement: 'Write a deep copy, in the same Juejin round as the compose function.',
        whatThisMeasures: 'Recursion, the types a naive copy breaks, and whether you know what the platform already offers and where it stops.',
        clarifyFirst: [
          'Ask which types it must keep: Date, RegExp, Map, Set, class instances.',
          'Ask whether objects can point back to themselves.',
        ],
        strongAnswer: [
          'Return primitives and functions as they are; copy arrays and plain objects key by key, and rebuild Date, RegExp, Map and Set as new ones of the same kind.',
          'Cycles: keep a WeakMap from each source object to its copy and return the copy when an object comes round again; without it, a cycle overflows the stack.',
          'Prototypes and keys: `Object.create(Object.getPrototypeOf(src))` keeps the prototype, and `Reflect.ownKeys` also copies symbol keys.',
          '`structuredClone` does most of this and handles cycles, but throws on functions and DOM nodes and drops prototypes; a `JSON.parse(JSON.stringify(x))` round trip turns Dates into strings, drops `undefined` and functions, and throws on cycles.',
        ],
        commonMiss: 'Offering the JSON round trip as a deep copy, or writing a recursion that overflows the stack on the first cycle.',
        resourceLabel: 'Write a deep clone against tests, with a reference solution (Premium)',
        resourcePath: '/javascript/coding/js-deep-clone',
        reportedRound: { label: BINANCE_JUEJIN_2020_LABEL, url: BINANCE_JUEJIN_2020_URL },
      },
      {
        id: 'promise-all-in-order',
        title: 'Write Promise.all by hand, with results in input order',
        statement: 'Write `Promise.all` by hand, in a 2022 round of about an hour.',
        whatThisMeasures: 'Whether you know the contract of `Promise.all`: input order, the first rejection, plain values and an empty input.',
        clarifyFirst: [
          'Ask whether the input may be any iterable, and whether plain values can sit among the promises.',
          'Ask whether they also want `allSettled`, `race` or `any`, which differ only in when they settle.',
        ],
        strongAnswer: [
          'Return a new promise, and turn the input into an array first, since an iterable has no length.',
          'An empty array resolves to `[]` at once.',
          'Wrap each item with `Promise.resolve`, so plain values work, and store each value at its own index, not in the order it arrives.',
          'Count fulfilled items in a counter and resolve when it reaches the array length; `results.length` is no counter, because writing to the last index sets it at once.',
          'Reject with the first rejection; later results and rejections change nothing, since a settled promise stays settled.',
        ],
        commonMiss: 'Pushing results as they arrive, which returns them in finish order, or counting with `results.length`.',
        resourceLabel: 'Write Promise.all against tests, with a reference solution (Premium)',
        resourcePath: '/javascript/coding/js-promise-all',
        reportedRound: { label: 'Public report: interview.tw card, March 2022', url: 'https://interview.tw/i/6245173766582508ad355b92' },
      },
      {
        id: 'browser-cache-and-status-codes',
        title: "Explain the browser's caches and the status codes 200, 301, 302 and 304",
        statement: "Explain the browser's cache, and what the HTTP status codes 200, 301, 302 and 304 each mean.",
        whatThisMeasures: 'Whether you know where a response can come from, which headers decide it, and what each status code tells the browser to do next.',
        clarifyFirst: [
          'Ask whether they mean the HTTP cache the server controls with headers, or also a service worker cache your own code controls.',
        ],
        strongAnswer: [
          'Where a response comes from: the memory cache (this tab, short-lived), the disk cache (the HTTP cache, ruled by headers), a service worker answering from the Cache API by your own code, and the back/forward cache for whole pages. Chrome DevTools marks the first two as "(memory cache)" and "(disk cache)" in the Size column beside a 200.',
          'The codes: 200 is a full response; 301 is a permanent redirect that browsers cache, so a wrong one is hard to undo; 302 is a temporary redirect, followed each time; 304 Not Modified answers a conditional request with no body, so the browser reuses its own copy.',
          'Freshness: `Cache-Control: max-age` keeps a copy fresh for that long; `no-cache` stores it but revalidates before each use; `no-store` keeps nothing; `private` keeps it out of shared caches.',
          'Validators: an ETag or a Last-Modified date lets the browser ask `If-None-Match` or `If-Modified-Since`, which is how a 304 happens.',
        ],
        commonMiss: 'Calling a "200 (disk cache)" a 304: the 304 needed a round trip to the server, the cached 200 did not.',
        resourceLabel: 'Read HTTP caching basics: Cache-Control, ETag and 304 (free)',
        resourcePath: '/javascript/trivia/http-caching-basics',
        reportedRound: { label: BINANCE_INTERVIEWTW_2022_LABEL, url: BINANCE_INTERVIEWTW_2022_URL },
      },
      {
        id: 'caching-a-page-and-cdn',
        title: 'Cache a page well, say what cannot be cached, and explain a CDN',
        statement:
          "Describe an optimisation of a page that uses the cache. Then: can every resource be cached? When a resource's cache time runs out, is a request always sent again, and does it always bring the latest data? Can the page's own files be cached? What is a CDN?",
        whatThisMeasures: 'Whether you can cache a deployed site so returning users load fast and still get every release, and know where caching must stop.',
        clarifyFirst: [
          'Ask whether the page is behind a login, since private responses must not sit in a shared cache such as a CDN.',
          'Ask how often the site deploys, which decides how long the HTML may be cached.',
        ],
        strongAnswer: [
          'The optimisation: give scripts, styles and images hashed file names and a year of `max-age` with `immutable`, so returning users fetch nothing that did not change, and let a new release change the names.',
          'What cannot be cached, or must not be: anything marked `no-store`, responses with personal data in shared caches, and POST responses in practice.',
          'Expiry: an expired copy that carries an ETag or Last-Modified is revalidated with `If-None-Match` or `If-Modified-Since`, and an unchanged file comes back as a 304 with no body; without a validator it is downloaded again. `stale-while-revalidate` serves the old copy while it checks.',
          'Latest data: a fresh copy is used without asking the server, so a long `max-age` can serve stale data until it expires; that is why HTML usually gets `no-cache` with an ETag, so a release shows at once.',
          'The page itself: HTML can be cached, briefly or with revalidation, and a service worker can keep a shell of the page for offline use.',
          'A CDN keeps copies at edge servers near users, so cached responses are served from the edge without reaching the origin; `s-maxage` sets its lifetime apart from the browser, and a deploy purges or versions what changed.',
        ],
        commonMiss: 'Saying an expired resource is always downloaded again, or caching the HTML for a long time so users keep running an old release after a deploy.',
        resourceLabel: 'Read HTTP caching basics: Cache-Control, ETag and 304 (free)',
        resourcePath: '/javascript/trivia/http-caching-basics',
        reportedRound: { label: BINANCE_INTERVIEWTW_2022_LABEL, url: BINANCE_INTERVIEWTW_2022_URL },
      },
      {
        id: 'api-list-component-and-improvements',
        title: 'Write a list component fed by an API, then say what you would improve',
        statement:
          'Write the core of a component that fetches data from an API and renders it as a list. Then, given more time, say what you would improve for the user and for the structure of the code.',
        whatThisMeasures:
          'Whether the core is correct before it is clever (loading, error and empty states, and no stale response overwriting a newer one), and whether your improvements come in a sensible order.',
        clarifyFirst: [
          'Ask how large the list can get and whether the API pages its results.',
          'Ask whether the request depends on input such as a search term, which makes races between responses likely.',
          'Ask whether a data library is allowed or the code should use plain hooks.',
        ],
        strongAnswer: [
          'Core: state for the data, loading and error; an effect that fetches with an AbortController and aborts in its cleanup, ignoring the AbortError that the abort itself causes; a render that shows loading, an error with a retry, an empty message, or the list with stable keys from the item ids.',
          'Races: when the request depends on changing input, cancel the request that is still running before starting the next, or number the requests and keep only the newest answer, so an old answer cannot replace a newer one.',
          'For the user: skeleton rows instead of a spinner, keeping the old list visible while new data loads, pagination or infinite scroll for long lists, and keeping the scroll position when the user comes back.',
          'For the code: move the fetching into a hook or a data library (caching, deduplication, retries), type the response, keep the list presentational, and test the four states.',
          'For performance: memoise rows whose data did not change, and recycle rows once the list is long, which is the follow-up the 2022 round asked next.',
        ],
        commonMiss: 'Fetching without cleanup, so a slow earlier response overwrites a later one, or showing a blank screen when the request fails or returns nothing.',
        resourceLabel: 'Fetch and render a list with its loading, error and empty states (free)',
        resourcePath: '/react/coding/react-fetch-list-states',
        reportedRound: { label: BINANCE_INTERVIEWTW_2022_LABEL, url: BINANCE_INTERVIEWTW_2022_URL },
      },
      {
        id: 'modal-and-tooltip-in-body',
        title: 'Build a modal and a tooltip, and decide where each one mounts',
        statement:
          'Write a modal and a tooltip component of your own. Should the modal mount in `body` or in its parent `div`, and why? If the tooltip mounts in `body`, how does it position itself against the element it describes?',
        whatThisMeasures:
          'Whether you know why overlays escape their parents (clipping and stacking), and can keep a dialog usable with a keyboard and a screen reader.',
        clarifyFirst: [
          'Ask whether the native `<dialog>` element is allowed, since `showModal()` handles the top layer, the inert background and Escape.',
          'Ask whether the tooltip shows on hover only or also on keyboard focus, and how close to an edge of the screen its anchor can sit.',
        ],
        strongAnswer: [
          "Mount the modal in `body` through a portal (`createPortal`): an ancestor's `overflow: hidden` can clip it (a `position: fixed` modal only once an ancestor has a `transform`, `filter` or `contain`, which makes that ancestor its containing block and moves the modal with it), and an ancestor's stacking context can bury it under other content whatever its z-index. React events still bubble through the portal along the component tree.",
          'Make it a real dialog: `role="dialog"` with `aria-modal` and a label, focus moved inside on open, Tab kept inside, Escape and the overlay closing it, focus returned to the opener on close, and the page behind made inert and kept from scrolling.',
          "Position the tooltip from its anchor: read `getBoundingClientRect()`, place the tooltip with `position: fixed` at those viewport coordinates (or add the scroll offsets for `absolute`), flip it to the other side when it would leave the screen, and update it on resize and on scroll in the capture phase (`addEventListener('scroll', update, true)`), so scrolling inside a container moves it too.",
          'Make the tooltip readable: show it on focus as well as hover, let Escape dismiss it and the pointer move onto it without closing it (WCAG 1.4.13), link it with `aria-describedby`, and add a short delay so it does not flash while the pointer passes.',
          'Name the trade-off: mounting in the parent keeps inherited styles and CSS variables simple (React context reaches a portal either way) but breaks as soon as a parent clips; mounting in `body` needs positioning code but works wherever the trigger sits, except inside a native modal `<dialog>`, where a tooltip in `body` would sit under the top layer and be inert, so mount it inside the dialog there.',
        ],
        commonMiss:
          'Rendering the modal inside its parent, where an ancestor clips it or a transform moves it, or positioning the tooltip once and never again when the page scrolls.',
        resourceLabel: 'Build a delete dialog and tooltips through portals (Premium)',
        resourcePath: '/react/coding/react-modal-tooltip-portal',
        reportedRound: { label: BINANCE_JUEJIN_2020_LABEL, url: BINANCE_JUEJIN_2020_URL },
      },
      {
        id: 'file-upload-drop-progress-preview',
        title: 'Build file upload with drag-and-drop, a progress bar and a preview',
        statement:
          'Explain how you implemented file upload, then how drag-and-drop works for it, how its progress bar gets its numbers, and how a preview works and which events it listens to.',
        whatThisMeasures: 'Whether you know the browser APIs behind each part and their traps, and keep the upload usable without a mouse.',
        clarifyFirst: [
          'Ask which file types and sizes are allowed, and whether several files can go at once.',
          'Ask whether uploads can be cancelled or retried, and whether large files go up in chunks.',
        ],
        strongAnswer: [
          'Selection: an `<input type="file">` (with `accept` and `multiple`) stays the keyboard path, and the drop zone is an extra way to give it files.',
          'Drag-and-drop: listen to `dragenter`, `dragover`, `dragleave` and `drop`; call `preventDefault()` on `dragover` and `drop`, or the browser opens the file instead of dropping it; read the files from `event.dataTransfer.files` and validate type and size before uploading.',
          "Progress: `fetch` gives no upload progress events, so use `XMLHttpRequest` and its `upload.onprogress` (`loaded` and `total`), or upload in chunks and count them; `abort()` cancels, `loadend` ends the bar after `load`, `error`, `abort` or `timeout`, and the request's own `load` with its status says whether the server accepted the file.",
          "Preview: `URL.createObjectURL(file)` gives an image or a video a URL at once, revoked with `URL.revokeObjectURL` when the preview goes away; `FileReader.readAsDataURL` works too but holds the whole file in memory as a string. The events: `change` on the input and `drop` on the zone hand over the files, and FileReader's `load` (with `error`) delivers the data URL; revoke an object URL when its row is removed or unmounted.",
          'Feedback: one row per file with its name, size, progress and state, and an error the user can retry, announced to screen readers through a live region.',
        ],
        commonMiss: 'Forgetting `preventDefault()` on `dragover`, so dropping a file navigates away from the page, or creating object URLs and never revoking them.',
        resourceLabel: 'Build a receipt upload with a drop zone, progress and previews (Premium)',
        resourcePath: '/react/coding/react-file-upload-dropzone-progress',
        reportedRound: { label: BINANCE_JUEJIN_2020_LABEL, url: BINANCE_JUEJIN_2020_URL },
      },
      {
        id: 'role-aware-routes-and-sidebar',
        title: 'Guard routes, pages and a sidebar by permission',
        statement:
          'Implement permission management for routes, for pages and for which parts of the navigation show; for example, a side navigation that shows different options to different people.',
        whatThisMeasures: 'Whether you keep one source of truth for who can do what, so routes, pages and navigation cannot disagree, and know that the server has the final say.',
        clarifyFirst: [
          'Ask whether permissions come from roles or are granted one by one, and whether a user can hold several roles.',
          'Ask what a user who opens a forbidden URL should see: a redirect, a 403 page or a login prompt.',
        ],
        strongAnswer: [
          'One model: map roles to permissions once and check permissions, not role names, everywhere, so a new role does not mean editing every screen.',
          'Routes: describe each route with the permission it needs, and wrap protected routes in one guard that waits for the user to load, then renders the page, redirects to login or shows a 403.',
          'Navigation: build the sidebar from the same route list filtered by permission, so a link can never point at a page the user cannot open.',
          'Inside pages: hide or disable buttons and fields with the same check, through a small `can(permission)` helper or hook.',
          'The server decides: client checks only shape the interface, so every API call is checked on the server too, and a deep link survives login by returning the user to the page they asked for.',
        ],
        commonMiss: 'Hiding a link in the sidebar but leaving its route open, or trusting the client-side check as if it were security.',
        resourceLabel: 'Build a support console with role-aware routes and sidebar (Premium)',
        resourcePath: '/react/coding/react-role-aware-routes',
        reportedRound: { label: BINANCE_JUEJIN_2020_LABEL, url: BINANCE_JUEJIN_2020_URL },
      },
      {
        id: 'k-line-and-live-price-table',
        title: 'Plan a K-line chart and a live price table with no library',
        statement:
          'A take-home asks you to implement a K-line (candlestick) chart and a price table that keeps updating, without any library. Plan the data, the drawing and the updates.',
        whatThisMeasures: 'Whether you can draw and update a chart from first principles, and keep a live table smooth, the half the order book question also tests.',
        clarifyFirst: [
          'Ask where the data comes from: a REST call for past candles and a socket for live trades, or a single feed.',
          'Ask which intervals, zoom and pan the chart needs, and how the work is judged: correctness, smoothness or code quality.',
        ],
        strongAnswer: [
          'Data: each candle holds open, high, low and close for one interval; fold live trades into the current candle (update the close, raise the high, lower the low) and start a new candle when the interval rolls over.',
          'Scales: map time to x and price to y from the visible range plus a little padding, and write the two scale functions yourself, since no charting library is allowed.',
          'Drawing: use a canvas sized for `devicePixelRatio` so lines stay sharp, draw each candle as a wick line and a body rectangle coloured by whether it closed up or down, and add grid lines and axis labels.',
          'Updates: redraw on `requestAnimationFrame` at most once per frame, and only the last candle while the scales stay the same; a high or low outside the visible range rescales, so everything redraws, and zoom and pan change the visible range too.',
          'The table: merge socket updates into state, flush once per frame, flash the cells that changed, keep the row order stable, and format prices to a fixed number of decimals.',
          'Hand-in: a README with how to run it and what you left out, and tests for the candle folding and the scales.',
        ],
        commonMiss:
          "Redrawing the whole chart on every trade, or drawing on a canvas that ignores `devicePixelRatio`, so the chart is blurry on a high-density screen.",
        resourceLabel: 'Practise the live half on the order book task (Premium)',
        resourcePath: '/react/coding/react-order-book-socket-feed',
        reportedRound: { label: 'Public report: PTT comment, March 2021, on a take-home', url: 'https://www.ptt.cc/bbs/Soft_Job/M.1614929795.A.64E.html' },
      },
    ],
  },
  walkthrough: {
    kicker: 'Mini walkthrough',
    title: 'Rehearse rounds one and two as a run of quick questions',
    intro:
      "The 2022 account's first two rounds held nine and fourteen questions, and the 2024 senior candidate called the interview a continuous run of questions. Rehearse that pace before the real one.",
    steps: [
      {
        title: 'Build the list',
        description:
          'Take the topics of the 2022 rounds one and two from the list above, two short utilities to write and about twenty questions, and shuffle them so you cannot prepare the next one.',
      },
      {
        title: 'Set the pace',
        description: 'Give each spoken question about two minutes and each utility about ten, with a timer you can hear, and record yourself.',
      },
      {
        title: 'Answer, then stop',
        description:
          'Say the core in two or three sentences and stop: the interviewer picks where to go deeper, so leave room for the follow-up instead of covering every layer at once.',
      },
      {
        title: 'Mark the misses',
        description: 'Play the recording back, mark each answer that ran long, guessed or lacked an example, and redo only those the next day.',
      },
      {
        title: 'Add the English turn',
        description: 'End with three minutes on your biggest project in English, as the 2022 fourth round switched to English for a conversation.',
      },
    ],
  },
  prepPlan: {
    kicker: 'Actionable preparation',
    title: 'A 7-day Binance frontend interview preparation plan',
    intro:
      'One day for each kind of question the accounts describe: short utilities, JavaScript and the browser, React internals, redux, performance, the order book, and the last rounds with their English conversation.',
    days: [
      {
        day: 'Day 1',
        focus:
          'Short utilities against the clock: a throttle, a debounce, a flatten, a dedupe, a compose and a deep copy, each written from scratch on a plain editor, then String.includes by hand.',
        artifact: 'Six functions with their edge cases, each written in under ten minutes.',
      },
      {
        day: 'Day 2',
        focus:
          'JavaScript and the browser: the event loop with a short snippet traced line by line, typeof and instanceof, closures, event delegation, and the browser cache with its status codes.',
        artifact: 'A one-page sheet with a two-sentence answer for each topic and the snippet traced queue by queue.',
      },
      {
        day: 'Day 3',
        focus:
          'React internals: hooks and their rules, fiber, the render and commit phases, useMemo against useCallback, keys and higher-order components, each said in two or three sentences, then one layer deeper.',
        artifact: 'A two-minute recording on fiber and a short answer for each of the other topics.',
      },
      {
        day: 'Day 4',
        focus:
          'Redux: its data flow from a click to a re-render and how connect reaches the store, each said in two or three sentences, then one layer deeper.',
        artifact: 'The redux flow drawn once, with what each step does.',
      },
      {
        day: 'Day 5',
        focus: 'Performance: a method for finding what makes a page slow and the fixes you would reach for, with one example from your own work.',
        artifact: 'A short checklist you can say in order, and the example with its numbers.',
      },
      {
        day: 'Day 6',
        focus: 'Real-time data: an order book or a price table fed by a socket, built small and run under a burst of updates.',
        artifact: 'A small working feed and a two-minute account of what keeps it smooth.',
      },
      {
        day: 'Day 7',
        focus:
          'The last rounds: your biggest project in English in three minutes, why you are leaving, what you want from Binance and what would make you leave, your view of code review, and a mock run of twenty quick questions from days 1 to 4.',
        artifact: 'The drill stories, an English recording, and a short list to ask the recruiter: the rounds, their language and any take-home.',
      },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common Binance frontend interview preparation questions',
    items: [
      {
        question: 'How many interview rounds does Binance have for frontend engineers?',
        answer:
          "Binance's careers page gives an average of four interviews over two to four weeks. The frontend accounts from Taiwan and remote loops describe three remote technical rounds, with a fourth in two of them and an HR round in the 2020 one: in 2021 the fourth came because the head of the department the candidate was referred to had not interviewed them, and in 2022 because a team that was hiring saw candidates who passed round two first and turned this one down in round three. A Juejin write-up posted in 2020 reports two technical rounds.",
      },
      {
        question: 'Are these real Binance interview questions?',
        answer:
          'Candidates reported them; Binance has confirmed none. Each row goes back to a post on interview.tw, GoodJob, PTT, Juejin, Medium or Hacker News, put into English, and most locked rows come from one four-round account of 2022; the 2020 and 2021 accounts describe the same kind of questions with fewer exact wordings.',
      },
      {
        question: 'Do I need to speak Mandarin for a Binance frontend interview?',
        answer:
          'The accounts do not settle it, but one of the three frontend postings read in November 2026, a frontend-oriented full-stack role on facial recognition, requires fluency in Mandarin. Where the accounts say where an interviewer came from, it is Taiwan or mainland China; the 2021 candidate\'s third round was partly in English, with Chinese still the main language, and the 2022 fourth round switched to English for a conversation. A 2022 senior frontend candidate on Blind interviewed in English with an interviewer from China whose English was hard to follow, and a 2025 referral post gives the working language as mainly Chinese, with reading and writing English enough. Ask the recruiter which language your rounds will be in.',
      },
      {
        question: 'Does Binance give frontend candidates a take-home assignment?',
        answer:
          "None of the round-by-round accounts mentions one, and the 2021 candidate said there was no assignment, only three technical rounds plus one. Two take-homes appear in comments about earlier openings: a K-line chart and a live price table, in a 2021 comment by someone who took their opening to lean staff, and a content management system with translations, in a 2022 comment by someone who declined it. Binance's post on its early-career programs lists an online or take-home assessment among possible steps.",
      },
      {
        question: "What do Binance's 2026 frontend postings ask for?",
        answer:
          'The three frontend postings read in November 2026, for teams in Hong Kong, Singapore and Taiwan (one also in Australia, New Zealand and the United Arab Emirates), ask for React, with Vue required on the KYC team and TypeScript named for the wallet and facial recognition roles. All three ask for AI tools in development work, two of them in daily work, and one names Cursor, Claude Code and Copilot; the facial recognition role also requires fluency in Mandarin. They say Binance may use AI to review applications and that people make the final hiring decision. None describes the interview rounds.',
      },
      {
        question: 'How fast does Binance answer after each round?',
        answer:
          "In the 2021 account each round's result came about one to two hours after it, which the candidate called very efficient, and another 2021 candidate who was not hired got feedback. Not every candidate heard back: two interview.tw cards, from 2020 and 2021, are marked as never answered. Binance's careers page puts the whole process at two to four weeks on average.",
      },
      {
        question: 'Which React topics come up most in Binance interviews?',
        answer:
          "Redux and React internals. Redux came up in accounts from 2020, 2021 and 2022, along with how react-redux's connect gets data into a component. Fiber came up by name in 2020, 2021 and 2022 too, beside the render and commit phases, hooks and their rules, useMemo and useCallback, higher-order components and keys.",
      },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Free practice for the Binance rounds',
    intro:
      'Free tasks to rehearse on your own before a Binance loop: a short utility, a promise you control, React internals, the DOM events behind delegation, a quick check of your fundamentals and stories for the last rounds. Binance set none of them; they practise what its rounds ask.',
    items: [
      {
        label: 'Debounce function',
        description: 'A short utility like the ones some rounds opened with: write it from scratch, then its cancel and its edge cases.',
        path: '/javascript/coding/js-debounce',
      },
      {
        label: 'Create a deferred promise',
        description: 'A promise you resolve from outside, a small step towards writing a promise of your own.',
        path: '/javascript/coding/js-create-deferred-promise',
      },
      {
        label: 'React fiber and how it schedules work',
        description: 'The fiber tree, units of work and priorities, for a React internals question that came up by name in three accounts.',
        path: '/react/trivia/react-fiber-scheduling',
      },
      {
        label: 'React render and commit phases',
        description: 'What runs in each phase and why only one of them can be interrupted, as a 2020 first round asked.',
        path: '/react/trivia/react-render-vs-commit-phase',
      },
      {
        label: 'Bubbling, capturing and event delegation',
        description: 'Why a click handler fires twice and how one listener serves a whole list, for the 2021 first round.',
        path: '/javascript/trivia/js-event-delegation',
      },
      {
        label: 'Data structures and algorithms for frontend loops',
        description: 'Easy to medium problems of the kind the 2020 Medium author met and two interview.tw cards name, with a frontend slant.',
        path: '/guides/interview-blueprint/dsa-for-fe',
      },
      {
        label: 'Frontend fundamentals quiz',
        description: 'Quick questions on JavaScript, CSS, browsers and HTTP, to find your gaps before a round of quick questions does.',
        path: '/guides/interview-blueprint/quiz',
      },
      {
        label: 'STAR stories',
        description: 'Story structure for the last two rounds: your biggest project, your proudest achievement and why you are moving on.',
        path: '/guides/behavioral/stories',
      },
    ],
  },
  sources: {
    kicker: 'Public interview reports and official context',
    title: 'Sources and evidence limits',
    intro:
      'The official pages and postings come first, then the posts this guide cites outside the table, then each account the table and the list rely on, listed once. In all, {official} official pages and {reports} public reports.',
    items: [
      {
        label: 'Binance careers page',
        url: 'https://www.binance.com/en/careers',
        note: 'Read on 16 November 2026: four hiring steps and an average of two to four weeks with four interviews. Nothing on engineering rounds, assessments or the use of AI by candidates.',
        kind: 'official',
      },
      {
        label: 'Binance Square: Kickstart Your Web3 Career Early With Binance',
        url: 'https://www.binance.com/en/square/post/445767',
        note: "Binance's early-career recruitment, which depending on the program may include an online or take-home assessment and interviews with HR, the hiring manager, a business unit lead and cross-functional interviews.",
        kind: 'official',
      },
      {
        label: 'Posting: Frontend Engineer, KYC',
        url: 'https://job-boards.eu.greenhouse.io/binance/jobs/5002661101',
        note: 'Read on 16 November 2026, for Hong Kong, Singapore and Taiwan: React and Vue required, internal tools including AI-driven products, and AI tools in daily work.',
        kind: 'official',
      },
      {
        label: 'Posting: Full Stack Engineer (Web, Frontend Oriented), AI Facial Recognition',
        url: 'https://job-boards.eu.greenhouse.io/binance/jobs/5007086101',
        note: 'Read on 16 November 2026, for Australia, Hong Kong, New Zealand, Singapore, Taiwan and the United Arab Emirates: an in-house facial recognition product for KYC, web fundamentals from browser rendering to caching and performance, AI-assisted tools such as Cursor, Claude Code and Copilot in daily work, and fluency in Mandarin.',
        kind: 'official',
      },
      {
        label: 'Posting: Senior Frontend Engineer, Web3 Wallet',
        url: 'https://job-boards.eu.greenhouse.io/binance/jobs/5002553101',
        note: 'Read on 16 November 2026, for Hong Kong, Singapore and Taiwan: React and TypeScript, and AI tools to raise development efficiency. Like the other postings, it says Binance may use AI in hiring and that people make the final decision.',
        kind: 'official',
      },
      {
        label: 'Blind comment, July 2022',
        url: 'https://www.teamblind.com/post/binance-interview-process-umfa8acz',
        note: 'A senior frontend candidate, replying in a thread opened by a backend applicant in Europe, on the first round: basic frontend questions and abstract data types with an interviewer from China whose English was hard to follow. Cited for the language of the interviews.',
        kind: 'report',
      },
      {
        label: 'interview.tw card, April 2022',
        url: 'https://interview.tw/i/624febad9a3f73004c1c57a5',
        note: 'A frontend engineer, hired, whose card opens with a quick sort to implement in the second technical stage; the rest of the card is locked. Cited for the algorithm questions.',
        kind: 'report',
      },
      {
        label: 'interview.tw card, January 2020',
        url: 'https://interview.tw/i/5e89e7e5db461001a3721e6c',
        note: 'A frontend engineer in Taipei who heard nothing back; the card says the questions were all algorithms but one on CSS, and the rest is locked. Cited for the algorithm questions and the silence.',
        kind: 'report',
      },
      {
        label: 'GoodJob account, July 2025',
        url: 'https://www.goodjob.life/experiences/68bd3cf8b5fd01f7afe038c6',
        note: "A Java engineer's loop whose first phone review was entirely in English and mostly about the projects on the résumé. Cited for the language only.",
        kind: 'report',
      },
      {
        label: 'GoodJob account, August 2025',
        url: 'https://www.goodjob.life/experiences/68f2f350dea9de0ddbec012e',
        note: 'A candidate for a Golang role (titled BAP-Golang Engineer), not hired, who advises preparing in English, depending on the team. Cited for the language only.',
        kind: 'report',
      },
      {
        label: 'V2EX referral post, June 2025',
        url: 'https://www.v2ex.com/t/1136400',
        note: 'A referral post for frontend, backend and other roles in Thailand, Dubai, Singapore and remote, which gives the working language as mainly Chinese, with reading and writing English enough. Cited for the language only.',
        kind: 'report',
      },
    ],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full Binance practice set',
    copy: 'Premium opens each locked Binance row, and with it the answer guide or practice task the row has.',
    buttonLabel: 'Unlock the full Binance practice set',
    src: 'company_preview_binance',
  },
  about: [
    'Binance frontend interview preparation',
    'Binance frontend technical rounds',
    'React internals and redux interview questions',
    'Order book over a WebSocket',
  ],
  indexAnchorLabel: 'Binance frontend interview questions',
};
