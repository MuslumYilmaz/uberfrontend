import type { AuthoredCompanyPreview } from '../../shared/company-previews/authored-company-preview.model';

/**
 * Shopee (Sea Group) frontend interview guide. The reported questions live with the process table
 * (company-interview-processes.ts); the five prompts here are the answer guides of several of them, the first for the
 * open question. The questions come from candidates' own posts: a Viblo interview from Ho Chi Minh City (2025),
 * Chinese-language records on Juejin and Nowcoder (2019 to 2022), two Taipei accounts on GoodJob, Singapore graduate
 * loops on Medium and PTT, and LeetCode posts with online-assessment and interview problems. Shopee's How we hire page
 * and a reprinted China campus posting give the official steps. Nothing here is a leaked, confirmed or official Shopee
 * question; Chinese and Vietnamese quotes are kept short and glossed in English.
 */
const SHOPEE_HCMC_2025_URL =
  'https://viblo.asia/p/luyen-tap-that-bai-va-thanh-cong-hanh-trinh-cua-anh-dat-hoc-vien-engineer-pro-vao-shopee-EbNVQnP04vR';
const SHOPEE_HCMC_2025_LABEL = 'Public report: Viblo account of a Frontend Engineer hire, Ho Chi Minh City, February 2025';
const SHOPEE_JUEJIN_2020_URL = 'https://juejin.cn/post/6880722165982429197';
const SHOPEE_JUEJIN_2020_LABEL = 'Public report: Juejin record of two frontend loops, March 2020 (posted October 2020)';
const SHOPEE_NOWCODER_2022_URL = 'https://www.nowcoder.com/discuss/353159545788768256';
const SHOPEE_NOWCODER_2022_LABEL = 'Public report: Nowcoder frontend social-hire account, April 2022';
const SHOPEE_CAMPUS_AUGUST_2020_URL = 'https://www.nowcoder.com/discuss/353156758342410240';
const SHOPEE_CAMPUS_AUGUST_2020_LABEL = 'Public report: Nowcoder frontend campus first and second rounds, August 2020';
const SHOPEE_TAIPEI_2021_URL = 'https://www.goodjob.life/experiences/5ff7488233dedf001238f46c';
const SHOPEE_TAIPEI_2021_LABEL = 'Public report: GoodJob frontend engineer written test and panels, Taipei, January 2021';
const SHOPEE_TAIPEI_2023_URL = 'https://www.goodjob.life/experiences/6a38a65e0214e43e1c1c7ce6';
const SHOPEE_TAIPEI_2023_LABEL = 'Public report: GoodJob senior software engineer loop, Taipei, June 2023';
const SHOPEE_SG_CAMPUS_2020_URL = 'https://www.nowcoder.com/discuss/495162';
const SHOPEE_SG_CAMPUS_2020_LABEL = 'Public report: Nowcoder first round for a Singapore frontend campus role, September 2020';
const SHOPEE_CAMPUS_JULY_2020_URL = 'https://www.nowcoder.com/discuss/463919';
const SHOPEE_CAMPUS_JULY_2020_LABEL = 'Public report: Nowcoder frontend campus interviews, July 2020';
const SHOPEE_CAMPUS_MARCH_2020_URL = 'https://www.nowcoder.com/discuss/353156107927494656';
const SHOPEE_CAMPUS_MARCH_2020_LABEL = 'Public report: Nowcoder frontend campus first round, March 2020';
const SHOPEE_MEDIUM_CAMPUS_2020_URL = 'https://medium.com/@g4691821/2020-new-grad-面試心得-3-shopee-eaabf411c35b';
const SHOPEE_MEDIUM_CAMPUS_2020_LABEL = 'Public report: Medium backend campus loop, Singapore, April 2020';
const SHOPEE_MEDIUM_CAMPUS_2022_URL =
  'https://medium.com/@julianachang/2022-新鮮人軟體工程師面試心得-yahoo-foodpanda-shopee-dell-d576d6c004b6';
const SHOPEE_MEDIUM_CAMPUS_2022_LABEL = 'Public report: Medium new-graduate backend loop, Singapore campus, January 2022';
const SHOPEE_HOW_WE_HIRE_URL = 'https://careers.shopee.sg/how-we-hire';
const SHOPEE_CHINA_CAMPUS_REPRINT_URL = 'https://campus.niuqizp.com/job-vlU5ZCLtN.html';

export const SHOPEE_PREVIEW_TITLE = 'Shopee Frontend Interview Questions: {#questions} Reported + Prep Guide';
export const SHOPEE_PREVIEW_H1 = 'Shopee Frontend Interview Questions';
export const SHOPEE_PREVIEW_DESCRIPTION =
  'Shopee frontend interview rounds in Vietnam, Singapore, China and Taiwan, from a two-hour frontend round to a written test, with {#questions} reported questions.';
export const SHOPEE_PREVIEW_CANONICAL_PATH = '/companies/shopee/preview';
export const SHOPEE_PREVIEW_TRUST_NOTE =
  'The questions come from candidates\' posts on Juejin, Nowcoder, GoodJob, Medium, PTT and LeetCode and from a Viblo interview in which a preparation course quotes a hire; most are written in Chinese about loops between 2019 and 2022 and are retold here in our words. Shopee has confirmed none of them, and the answer guides are FrontendAtlas\'s. Shopee\'s How we hire page says the number of rounds depends on the role and seniority, so ask your recruiter which rounds yours will have.';

export const SHOPEE_COMPANY_PREVIEW: AuthoredCompanyPreview = {
  slug: 'shopee',
  label: 'Shopee',
  title: SHOPEE_PREVIEW_TITLE,
  h1: SHOPEE_PREVIEW_H1,
  description: SHOPEE_PREVIEW_DESCRIPTION,
  canonicalPath: SHOPEE_PREVIEW_CANONICAL_PATH,
  trustNote: SHOPEE_PREVIEW_TRUST_NOTE,
  hero: {
    kicker: 'Public Shopee prep guide',
    subtitle:
      'Shopee accounts from four places describe four different loops: a two-hour frontend round and a CS-fundamentals round in Ho Chi Minh City, online rounds on a shared editor for Singapore graduates, two technical interviews and HR in the mainland-China accounts, run per department for the two social hires, and a written test with team panels in Taipei. Under the rounds are {questions} questions from those accounts; the first, a Promise written without the Promise API, is open.',
    caveat:
      'The Ho Chi Minh City table rests on one account and the Taipei table on two, and the Singapore table has a single frontend round beside backend and platform graduates\' loops. Most accounts are from 2019 to 2022 and written in Chinese, and no full account of a Singapore loop for experienced frontend engineers was found.',
    chips: ['{#questions} reported questions', '{#reports} public reports, 2019–2025', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'What Shopee frontend rounds reward: JavaScript written from memory, and the web platform explained exactly',
    paragraphs: [
      'Shopee\'s frontend rounds lean on what you can write and explain without a reference. The open question asks for a Promise written without the Promise API; the Chinese-language loops add a function cache keyed by its arguments, flatten, deep clone and new by hand, balanced brackets and a publish-subscribe function, and a run of output questions on promise chains, microtasks and var inside a loop. HTTP and cookies fill half of one 2022 first round and recur across the Chinese-language loops: an HTTP message written out for a POST, strong against negotiated caching with its headers and status codes, SameSite, CSRF and XSS, cross-origin requests, and how to carry an ID number in a cookie safely.',
      'The shape changes with the place. Ho Chi Minh City ran a two-hour frontend round in parts (CSS, JavaScript, a React build, an algorithm), then a CS-fundamentals round that started from a system the candidate worked on. The two Chinese-language social-hire loops ran per department, a first and a second technical interview and then HR, once all on one day, and a second department can re-interview a candidate the first turned down. Two Singapore graduate loops opened with an online assessment; where an account gives a length, the rounds after it ran 60 to 90 minutes on a shared online editor. Taipei set a 90-minute written test the candidate rated junior level, then panels with a product manager and a tech lead, where in the candidate\'s words algorithms were hardly asked and communication mattered a lot.',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked November 2026',
    title: 'Who posted these Shopee accounts, and where they stop',
    paragraphs: [
      '{reports} public accounts sit behind this guide. The fullest are a 2025 Viblo interview with a Frontend Engineer hired at Shopee Vietnam, published by a preparation course in the candidate\'s words; a 2020 Juejin record of two loops with different departments by a frontend engineer who joined the second; a 2022 Nowcoder account by a social hire turned down by two departments; a 2021 GoodJob account of a Taipei written test and panels; and six Nowcoder campus accounts from 2019 to 2021, one of them for a Singapore role. Singapore graduate loops for backend and platform roles on Medium and PTT, a 2023 Taipei account on GoodJob and LeetCode posts with online-assessment and interview problems fill in the rest.',
      'They show what these candidates were asked; they cannot fix today\'s format. Most are from 2019 to 2022 and written in Chinese, the accounts in the mainland-China table name no city, and no full account of a Singapore loop for experienced frontend engineers was found. Shopee\'s How we hire page lists five steps and says the number of rounds varies with the role and seniority; a campus posting for 2027 graduates, reprinted in April 2026, gives the only official-origin frontend process line, for Beijing, Shanghai and Shenzhen. Ask the recruiter about the interview language, the assessment, the number of rounds and the tools.',
    ],
  },
  roleLenses: {
    kicker: 'Role lenses',
    title: 'Back-office web or a digital bank: the teams the Chinese-language accounts name',
    intro:
      'Two of the Chinese-language accounts name the teams they met: a seller platform and a supply-chain team in 2020, a digital bank and a team called PFMS in 2022. Each lens gathers what those teams asked; neither is a team you would be assigned to.',
    items: [
      {
        title: 'Seller and back-office web',
        description:
          'The seller-platform, supply-chain and PFMS rounds asked about webpack performance and async chunk loading, fifty SVG requests, what a CDN does, html2canvas and schema-driven back-office forms.',
        practiceFocus:
          'Bundle splitting and lazy loading, sprites and batching for many small assets, CDN caching with explicit invalidation, form state driven by a schema, and rendering work kept off the critical path.',
      },
      {
        title: 'Digital bank',
        description:
          'The 2022 digital-bank first round opened with five HTTP and security questions: an HTTP message for a POST, strong versus negotiated caching, SameSite with CSRF and XSS, cross-origin requests, and an ID number carried safely in a cookie. Two output questions, new, a Vue dialog created on demand through a createDialog call and an algorithm problem followed, and the HR feedback named algorithms as the weak point.',
        practiceFocus:
          'Cookie and token placement with its trade-offs, HTTPS and TLS reasoning, CORS with credentials, escaping and a Content Security Policy, and idempotent requests for actions that move money.',
      },
    ],
  },
  prompts: {
    kicker: 'Representative practice prompts',
    title: 'Answer guides for five of the reported Shopee questions',
    intro:
      'For each question below: the points to agree with the interviewer first, what a strong answer contains, and the mistake that most often costs the round. Phrases quoted from the Chinese and Vietnamese accounts are glossed in English.',
    itemListName: 'Shopee answer guides',
    items: [
      {
        id: 'promise-without-promise',
        title: 'Write a Promise without using the Promise API',
        statement:
          'The Ho Chi Minh City account, posted in February 2025, describes the JavaScript part of a two-hour frontend round, which set one exercise: "code một Promise nhưng không được dùng Promise" (write a Promise without using Promise). Implement a MyPromise class whose constructor takes an executor, with then and catch methods that chain and callbacks that run asynchronously.',
        whatThisMeasures:
          'Whether you understand the state machine behind a promise (pending, then fulfilled or rejected, settled once), how then returns a new promise and adopts returned values, and why callbacks must run asynchronously.',
        clarifyFirst: [
          'Confirm the scope: constructor, then and catch only, or also finally, static resolve and reject, and adopting thenables returned from handlers.',
          'Ask whether callbacks must run as microtasks (queueMicrotask) or whether setTimeout is acceptable, and whether the interviewer wants tests or a demonstration with console output.',
        ],
        strongAnswer: [
          'Hold the state, the value and two handler queues; let the executor call resolve or reject synchronously, and ignore every settlement after the first.',
          'Make then return a new promise: a handler\'s return value resolves it, a thrown error rejects it, and a missing handler passes the value or the reason through, so chains work and catch(fn) is then(undefined, fn).',
          'Queue handlers while pending and run them asynchronously once settled, so a then callback does not fire synchronously even when the promise is already resolved.',
          'Before calling it done, run your class beside the native Promise on cases you write yourself: then attached after resolution, a handler that throws, a handler that returns a promise, and two then calls on one promise.',
        ],
        commonMiss:
          'Calling then callbacks synchronously when the promise is already settled, or letting a second resolve overwrite the first value; either makes your class disagree with the native Promise on ordering.',
        resourceLabel: 'Practice the deferred promise with resolve and reject controls (free)',
        resourcePath: '/javascript/coding/js-create-deferred-promise',
        reportedRound: { label: SHOPEE_HCMC_2025_LABEL, url: SHOPEE_HCMC_2025_URL },
      },
      {
        id: 'recursive-hover-menu-react',
        title: 'Build a recursive multi-level hover menu in React',
        statement:
          'From the same Ho Chi Minh City account: build a multi-level menu in React where hovering an item drops down its sub-menu, and a sub-menu with children of its own keeps opening, described by the candidate as a recursion exercise. Take a nested array of items with an optional children array, render one component that renders itself for each child, and keep only the hovered path open.',
        whatThisMeasures:
          'Recursive component design over nested data, where the open state lives, hover handling that does not close the menu while the pointer travels into the sub-menu, stable keys, and keyboard access.',
        clarifyFirst: [
          'Confirm the data shape (an id, a label, an optional children array) and the maximum depth, and whether several branches may be open at once or only the hovered path.',
          'Ask whether hover alone is enough or the menu must also open on focus and the arrow keys, and how a sub-menu should position itself when it would overflow the viewport.',
        ],
        strongAnswer: [
          'Write one MenuItem component that renders a label and, when it has children and is open, a list of MenuItem for them; recursion over the data keeps the depth unbounded without duplicated markup.',
          'Keep the open state per item (an open flag inside each MenuItem) or as one open path in the parent; say which you chose and why the parent version makes closing siblings and keyboard navigation simpler.',
          'Handle pointer movement: open on mouseenter of the item, close on mouseleave of the item including its sub-menu, so the pointer can move into the sub-menu without collapsing it; add a short close delay if asked.',
          'Use stable ids as keys rather than the array index, and add a focus and keyboard path (Enter or ArrowRight to open, Escape to close) so the menu works without a mouse.',
        ],
        commonMiss:
          'A sub-menu that closes as soon as the pointer leaves the parent label because the leave handler sits on the label rather than on the item with its sub-menu, and a children list rendered with index keys so hover state jumps between items.',
        resourceLabel: 'Practice recursion over nested nodes with the indented tree filter (free)',
        resourcePath: '/javascript/coding/js-filter-tree-render-indented',
        reportedRound: { label: SHOPEE_HCMC_2025_LABEL, url: SHOPEE_HCMC_2025_URL },
      },
      {
        id: 'function-cache-flatten-deep-clone-new',
        title: 'Implement a function cache keyed by its arguments, then flatten an array, deep-clone an object and implement new',
        statement:
          'A 2020 Juejin record of two loops with different departments lists the handwritten tasks: a cache wrapper where f2 = cache(f1) returns the earlier result at once for the same arguments (f1("abc", 123, {b: 3}) took 1000 seconds to return 10; f2 with the same call returns 10 in 0 seconds), 拍平数组 (flatten an array), 深复制 (deep clone) and "new 的实现" (implement new). A 2022 Nowcoder social-hire account got 函数缓存 (a function cache) again in a second round. Implement each in plain JavaScript and say what each one does with its edge cases.',
        whatThisMeasures:
          'Closures and key derivation for a cache, recursion over nested arrays and objects, how the prototype chain and this binding work inside new, and whether you name the edge cases (object arguments, cycles, dates and functions in a clone, a constructor that returns an object) without being prompted.',
        clarifyFirst: [
          'For the cache: ask how two calls with the same object argument should compare (by reference or by serialised value), whether entries expire or the size is capped, and what to do when the function throws.',
          'For deep clone: confirm which types must survive (nested arrays and objects, Date, Map, Set, cyclic references) and whether structuredClone is allowed or the point is to write it by hand.',
        ],
        strongAnswer: [
          'Cache: return a wrapper that derives a key from the arguments (JSON.stringify for plain data, or a Map keyed by reference when identity is what the interviewer wants), stores results in a Map and returns the stored value on a hit; say how a thrown error and a Promise result should be treated.',
          'Flatten: a recursive reduce that concatenates nested arrays, then Array.prototype.flat(Infinity) once you have shown the hand-written version; the free Flatten One Level task is the warm-up.',
          'Deep clone: recurse over arrays and plain objects, copy Date, Map and Set explicitly, and keep a WeakMap of visited objects so cycles terminate.',
          'new: create an object whose prototype is the constructor\'s prototype, call the constructor with that object as this, and return the constructor\'s result if it is an object, otherwise the new object; the free task that implements the new operator covers the same contract. The 2020 record also asks whether an arrow function can be used with new, and the 2022 account asks you to walk an object\'s and a function\'s prototype chain all the way to null.',
        ],
        commonMiss:
          'A cache keyed by arguments.join(",") that treats {b: 3} as "[object Object]", a deep clone that loops forever on a cyclic reference, and an implementation of new that forgets the constructor may return an object of its own.',
        resourceLabel: 'Practice memoisation keyed by arguments (Premium)',
        resourcePath: '/javascript/coding/js-memoize-function',
        reportedRound: { label: SHOPEE_JUEJIN_2020_LABEL, url: SHOPEE_JUEJIN_2020_URL },
      },
      {
        id: 'http-caching-cookie-security-hour',
        title: 'Answer the HTTP, caching, cookie and security round',
        statement:
          'The 2022 Nowcoder account lists its digital-bank frontend first round in order, and its first five questions are: given the URL and return body of a POST, write the HTTP message; strong versus negotiated caching; from HTTP to cookies and the SameSite attribute, then on to CSRF and XSS; cross-origin requests, which the candidate extended to simple versus preflighted requests; and how to keep an ID number safe when it must travel in a cookie. The 2020 Juejin record asks about the HTTPS and TLS handshakes, symmetric versus asymmetric encryption, the HttpOnly and Secure flags and the status codes behind each cache type, and the 2020 Singapore campus first round asks how HTTPS prevents a man-in-the-middle attack and how a session, a cookie and a token differ.',
        whatThisMeasures:
          'Precise web-platform knowledge stated from memory: the shape of an HTTP response, cache headers and their status codes, cookie attributes and the attacks they limit, CORS mechanics, and transport-security reasoning for sensitive data.',
        clarifyFirst: [
          'For the HTTP message, confirm whether the interviewer wants the request, the response or both, and which headers matter for the body (Content-Type, Content-Length, Set-Cookie).',
          'For the ID-number question, ask what the cookie is for and whether the server can hold the value instead, before describing how to protect it in transit.',
        ],
        strongAnswer: [
          'Write the response as a status line, headers, a blank line and the body: HTTP/1.1 201 Created (or 200 OK), Content-Type: application/json, Content-Length, Set-Cookie if a session starts, then the JSON; say what changes for a redirect or an error.',
          'Strong caching: Cache-Control max-age or Expires, the browser serves its copy without a request and reports 200 from cache; negotiated caching: ETag with If-None-Match or Last-Modified with If-Modified-Since, and the server answers 304 when nothing changed. A 2020 campus first round asked which headers relate to caching and named If-None-Match and If-Modified-Since.',
          'Cookies: HttpOnly keeps script away from the value and limits what XSS can steal, Secure limits it to HTTPS, SameSite (Lax by default in Chromium-based browsers, so set it explicitly; Strict for sensitive actions) limits CSRF; XSS is a different attack that runs script inside your origin and is limited by escaping, safe DOM APIs and a Content Security Policy.',
          'CORS: a simple request (GET, HEAD, or POST with a form or text content type and safe headers) is sent and its response checked for Access-Control-Allow-Origin; anything else triggers an OPTIONS preflight, and credentials need Allow-Credentials with an explicit origin. For the ID number: keep it out of the cookie if a server-side session id can stand in for it; if it must travel, send it only over HTTPS with Secure, HttpOnly and SameSite set, encrypt or tokenise the value server-side and keep the lifetime short. For HTTPS and a man-in-the-middle, explain certificate verification and the key exchange in the TLS handshake.',
        ],
        commonMiss:
          'Describing CSRF as a form of XSS, naming 304 for a strong cache hit, or answering the ID-number question with "use HTTPS" alone when the interviewer is waiting for cookie flags, encryption of the value and a reason not to store it in the cookie at all.',
        resourceLabel: 'Review HTTP caching basics (free)',
        resourcePath: '/javascript/trivia/http-caching-basics',
        reportedRound: { label: SHOPEE_NOWCODER_2022_LABEL, url: SHOPEE_NOWCODER_2022_URL },
      },
      {
        id: 'written-test-and-css-questions',
        title: 'Clear the 90-minute written test and the CSS questions',
        statement:
          'A 2021 Taipei account reproduces its 90-minute onsite written test, which the candidate rated junior level: sort an array and remove duplicates in decreasing order; the rules of CSS specificity; shallow versus deep copy; how to manage CSS in a large application; three ways to centre horizontally and vertically; optimise or debug a class component; and the console output of setTimeout inside a var loop. The same-day panels asked practical questions on cookie details, localStorage and sessionStorage, and the account\'s question list adds where computing load belongs and how the browser renders a page. A 2020 campus first round on Nowcoder asked for the centring methods and the caching headers as well. Answer all seven in writing with a clock running, then explain each answer aloud.',
        whatThisMeasures:
          'Fast, correct fundamentals on paper: array methods, the specificity algorithm, copy semantics, CSS organisation at scale, layout techniques, class-to-hooks judgment and closure behaviour in loops, plus the ability to explain each answer to a product manager and a tech lead the same day.',
        clarifyFirst: [
          'For the centring and CSS-at-scale questions, ask whether the interviewer wants methods named or a recommendation with trade-offs, and whether a methodology such as BEM or scoped styles is assumed.',
          'For the class component, confirm what "optimise" targets (render count, readability, bundle size) before rewriting it with hooks.',
        ],
        strongAnswer: [
          'Sort and dedupe: Array.from(new Set(arr)).sort((a, b) => b - a), and say why sort without a comparator would order the numbers as strings.',
          'Specificity: inline styles beat ids, ids beat classes, attributes and pseudo-classes, which beat elements and pseudo-elements; !important overrides the comparison and later rules win ties. Three ways to centre: flex with justify-content and align-items, grid with place-items, and absolute positioning with a transform; name margin auto on a sized block as a fourth if asked.',
          'Shallow versus deep copy: spread and Object.assign copy one level and nested objects stay shared; a JSON round-trip drops functions and undefined values and turns dates into strings; structuredClone or a hand-written recursion handles the rest. CSS at scale: a naming convention or scoped styles, design tokens, a layering order and a lint rule, with one place for global resets.',
          'The loop: var hoists one i shared by all three callbacks, so after the loop it logs 3 undefined three times; let gives each iteration its own binding. The class component: the account\'s own answer was a function component with hooks and keys on the list items; beyond that, memoise only what profiling shows is expensive.',
        ],
        commonMiss:
          'Sorting with the default comparator, which orders numbers as strings, or answering the loop question with 0 1, 1 2, 2 3 because the shared var binding was not run through in your head.',
        resourceLabel: 'Practice inline centring (free)',
        resourcePath: '/css/coding/css-inline-centering',
        reportedRound: { label: SHOPEE_TAIPEI_2021_LABEL, url: SHOPEE_TAIPEI_2021_URL },
      },
    ],
  },
  walkthrough: {
    kicker: 'Mini walkthrough',
    title: 'Scope the Promise implementation before the first line',
    intro:
      'Six decisions for the open question, in the order an interviewer tends to probe them, from the contract down to when each callback runs.',
    steps: [
      { title: 'Pin the contract', description: 'A constructor that takes an executor and calls it at once with resolve and reject; then(onFulfilled, onRejected) and catch(onRejected) that return new promises. Say what you are leaving out: finally, the static helpers, thenable adoption.' },
      { title: 'Model the state', description: 'Three states (pending, fulfilled, rejected), one value or reason, and a guard so only the first resolve or reject counts; a throw inside the executor rejects.' },
      { title: 'Queue the handlers', description: 'While pending, push each then call\'s handlers into two arrays; on settlement, drain the arrays in order.' },
      { title: 'Make then chain', description: 'Each then creates a new promise; a handler\'s return value resolves it, a thrown error rejects it, and a missing handler passes the value or the reason through.' },
      { title: 'Run callbacks asynchronously', description: 'Schedule handler execution with queueMicrotask (or setTimeout if told to), even when the promise is already settled, so the ordering matches the native behaviour.' },
      { title: 'Test the edges', description: 'Resolve twice, reject after resolve, throw in a handler, a then without handlers, a handler returning one of your own promises, and the output order against a native Promise.' },
    ],
  },
  prepPlan: {
    kicker: 'Actionable preparation',
    title: 'A 7-day Shopee frontend interview preparation plan',
    intro:
      'A week built on the parts the Shopee accounts describe: questions answered from memory, code written without a reference, a React build, algorithm problems, then the behavioural rounds.',
    days: [
      { day: 'Day 1', focus: 'Promises from the inside: the open question, a Promise written without the Promise API, then the event loop that decides when its callbacks run.', artifact: 'Your class passing cases you wrote against the native Promise.' },
      { day: 'Day 2', focus: 'JavaScript by hand: the small utilities and language mechanics the Chinese-language first rounds ask candidates to write without a reference, each with its edge cases.', artifact: 'Five utilities written from memory with tests, each inside 15 minutes.' },
      { day: 'Day 3', focus: 'Output questions: predicting the logs of short snippets of promises, timers and scope, and explaining each line.', artifact: 'Ten snippets you wrote and predicted before running them.' },
      { day: 'Day 4', focus: 'HTTP and the browser: caching, cookies, cross-origin requests and web security, each answered with the exact header, attribute or status code.', artifact: 'A one-page answer sheet you can retell without notes.' },
      { day: 'Day 5', focus: 'CSS and React: the layout and cascade questions of a written test, then a React component built and explained aloud.', artifact: 'A timed written answer set and one finished component.' },
      { day: 'Day 6', focus: 'Algorithms: one or two easy-to-medium problems a day in JavaScript, with the time complexity stated, as most technical rounds outside Taipei add.', artifact: 'Six solved problems with their complexity written down.' },
      { day: 'Day 7', focus: 'Mock loop and behavioural: a two-hour round in parts, a CS-fundamentals conversation that starts from a system you built, and the open behavioural questions.', artifact: 'Your questions for the recruiter: the language, the assessment, the number of rounds and the tools.' },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common Shopee frontend interview preparation questions',
    items: [
      { question: 'Are these the real Shopee questions?', answer: 'They are questions candidates reported in their own posts, retold in our words; quoted Chinese and Vietnamese phrases are glossed in English. Shopee has confirmed none of them. About a fifth of them recur in two or three accounts; most rest on one. The answer guides and the practice tasks are FrontendAtlas\'s.' },
      { question: 'Which language is the interview in?', answer: 'Taiwanese graduates describe the Singapore loops as run in English: a 2022 account says its technical round was conducted entirely in English, and the poster of a 2021 PTT account told a commenter that the Shopee rounds were in English, while another commenter added that a round may run in Chinese depending on the interviewer. The accounts in the mainland-China table are written in Chinese and mention no other language, the Ho Chi Minh City account does not say, and the Taipei written test mixes English and Chinese questions. Ask the recruiter.' },
      { question: 'Is there an online assessment?', answer: 'Singapore accounts describe one, none of them for a stated frontend role: 70 minutes with ten multiple-choice questions on operating systems and networking plus two coding problems in a 2022 campus loop, twenty-odd multiple-choice questions plus one LeetCode problem in a 2021 one, and multiple-choice questions then a coding problem on Glider.ai in a 2020 backend post on LeetCode. No frontend account here describes Shopee\'s assessment. In mainland China the reprinted campus posting lists a written test after the application and says some roles have none; the Ho Chi Minh City account had no assessment, and Taipei set a 90-minute written test on site instead.' },
      { question: 'How much algorithm work is there?', answer: 'Most technical rounds outside Taipei add one to three problems, mostly easy to medium, though a 2020 Singapore round also set a LeetCode hard. The Ho Chi Minh City frontend round ended with an algorithm problem, the Chinese-language first rounds set short ones beside the JavaScript questions, and the Singapore graduate rounds paired problems with CS questions. A 2022 social hire was turned down after a first round with the feedback "算法有待加强" (algorithms need strengthening). The Taipei candidate wrote that algorithms were hardly asked ("對於演算法倒是不太要求"). Expect the hand-written JavaScript utilities to count as much as the algorithms.' },
      { question: 'Can another Shopee team interview me after a rejection?', answer: 'It happened in both Chinese-language social-hire accounts. In 2020 a candidate turned down by a seller-platform team after HR was invited back by the supply-chain team, finished both technical rounds and HR in one day and joined; in 2022 a candidate turned down by a digital-bank team was interviewed by a second department, which also said no.' },
      { question: 'Can I interview for more than one Shopee role at once, or from abroad?', answer: 'Shopee\'s How we hire page says you can apply for more than one role but interview for only one at a time, and that a candidate overseas during the interview period may be offered an online video interview. In the accounts, Taiwanese graduates were asked about moving to Singapore and a Vietnamese candidate about moving to Saigon.' },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Free practice for each part of a Shopee round',
    intro:
      'The open question\'s practice task first, then general preparation for the JavaScript, algorithm, framework and behavioural parts the accounts describe.',
    items: [
      { label: 'Create a deferred promise', description: 'The practice task for the open question: resolve and reject controls you can test against.', path: '/javascript/coding/js-create-deferred-promise' },
      { label: 'JavaScript interview guide', description: 'How a JavaScript question hour runs, for the rounds that open with fundamentals.', path: '/guides/interview-blueprint/javascript-interviews' },
      { label: 'Frontend fundamentals quiz', description: 'A timed check across JavaScript, CSS and the browser before a written test or a first round of quick questions.', path: '/guides/interview-blueprint/quiz' },
      { label: 'Data structures and algorithms for frontend loops', description: 'A plan for the one or two problems most Shopee technical rounds add.', path: '/guides/interview-blueprint/dsa-for-fe' },
      { label: 'React prep path', description: 'For the React build in the Ho Chi Minh City round and the React questions of other loops.', path: '/guides/framework-prep/react-prep-path' },
      { label: 'Vue prep path', description: 'Several Chinese-language loops asked about Vue, one of them at length.', path: '/guides/framework-prep/vue-prep-path' },
      { label: 'Fetch and render a list with loading, error and empty states', description: 'A React build sized for an interview, with the states a data screen needs.', path: '/react/coding/react-fetch-list-states' },
      { label: 'Behavioural stories', description: 'Stories for the open behavioural questions: a disagreement, your hardest problem, a move to another city.', path: '/guides/behavioral/stories' },
    ],
  },
  sources: {
    kicker: 'Public interview reports and official context',
    title: 'Sources and evidence limits',
    intro: 'Each note says who posted the account, when, and which rounds it covers.',
    items: [
      { label: SHOPEE_HCMC_2025_LABEL, url: SHOPEE_HCMC_2025_URL, note: 'A Frontend Engineer hired at Shopee Vietnam, whose HR call asked whether they would move to Saigon; published in February 2025 by a preparation course in the candidate\'s own words. It covers an HR call, a two-hour frontend round in four parts, a CS-fundamentals round, a pass notice a week later, a behavioural interview and a final conversation, with the offer a few days after. It gives no interview dates and no interview language.', kind: 'report' },
      { label: SHOPEE_JUEJIN_2020_LABEL, url: SHOPEE_JUEJIN_2020_URL, note: 'A frontend engineer with about eighteen months of experience, interviewed in March 2020 and posted in October 2020: a seller-platform loop of two technical rounds that ended at HR, then a same-day supply-chain session of two technical rounds and HR that led to a job. It lists about sixty questions and names no city.', kind: 'report' },
      { label: SHOPEE_NOWCODER_2022_LABEL, url: SHOPEE_NOWCODER_2022_URL, note: 'A social hire with more than two years of experience, April 2022: a digital-bank frontend first round that ended with the feedback "算法有待加强" (algorithms need strengthening), then a first and a second round with a team the account calls PFMS, which also ended without an offer. It names no city.', kind: 'report' },
      { label: SHOPEE_CAMPUS_AUGUST_2020_LABEL, url: SHOPEE_CAMPUS_AUGUST_2020_URL, note: 'A campus candidate\'s first and second frontend rounds, posted in August 2020 as a list of the questions asked; it gives no city and no result.', kind: 'report' },
      { label: SHOPEE_TAIPEI_2021_LABEL, url: SHOPEE_TAIPEI_2021_URL, note: 'A frontend engineer with four years of experience in Taipei, January 2021, who heard nothing afterwards: a 30-minute HR call, a 90-minute written test on site that the candidate rated junior level, and same-day panels with a product manager and a tech lead. The candidate adds that algorithms were hardly asked and that communication mattered.', kind: 'report' },
      { label: SHOPEE_TAIPEI_2023_LABEL, url: SHOPEE_TAIPEI_2023_URL, note: 'A senior software engineer in Taipei who received an offer, interviewed in June 2023 and posted in June 2026: an HR conversation, a manager round on technology, a peer round and a senior-manager chat. It does not say the role was frontend.', kind: 'report' },
      { label: SHOPEE_SG_CAMPUS_2020_LABEL, url: SHOPEE_SG_CAMPUS_2020_URL, note: 'One first round for a Singapore frontend campus role, September 2020, posted on Nowcoder in Chinese: an algorithm problem, then CSS, React and web questions. It covers that round only.', kind: 'report' },
      { label: SHOPEE_CAMPUS_JULY_2020_LABEL, url: SHOPEE_CAMPUS_JULY_2020_URL, note: 'A campus candidate\'s first and second frontend rounds, posted in July 2020: browser, security and JavaScript questions with a short coding task in the first; React, HTTP, performance and a debugging scenario in the second. It gives no city and no result.', kind: 'report' },
      { label: SHOPEE_CAMPUS_MARCH_2020_LABEL, url: SHOPEE_CAMPUS_MARCH_2020_URL, note: 'A spring 2020 campus first round, posted in March 2020: database and network questions, JavaScript, CSS and Vue questions, and an algorithm problem. A commenter whose profile names Shopee frontend corrects one of the candidate\'s answers.', kind: 'report' },
      { label: SHOPEE_MEDIUM_CAMPUS_2020_LABEL, url: SHOPEE_MEDIUM_CAMPUS_2020_URL, note: 'One Taiwanese new graduate\'s Singapore backend campus loop from spring 2020, read for the campus shape: an application on 23 March, an HR call on 14 April, three technical rounds of 90, 90 and 60 minutes on a shared editor with a design-concept question in each, and a verbal offer on 28 April. It is not a frontend loop.', kind: 'report' },
      { label: SHOPEE_MEDIUM_CAMPUS_2022_LABEL, url: SHOPEE_MEDIUM_CAMPUS_2022_URL, note: 'One Taiwanese new graduate\'s Singapore campus backend loop from January 2022: a 70-minute online assessment, one 90-minute technical round conducted entirely in English, and a rejection sixteen days after applying. It is not a frontend loop.', kind: 'report' },
      { label: 'Shopee Careers: How we hire, read October 2026', url: SHOPEE_HOW_WE_HIRE_URL, note: 'Official page, read in Chrome on 21 October 2026. It lists five steps (Apply, Getting to Know You, Putting Your Skills to the Test, Meet the Hiring Manager, Preparing to Join Us), says the number of rounds varies with the role and seniority, that you can interview for one role at a time, and that a candidate overseas may get an online video interview. It names no frontend format.', kind: 'official' },
      { label: 'Shopee China campus posting for frontend development engineers graduating in 2027 (reprint), April 2026', url: SHOPEE_CHINA_CAMPUS_REPRINT_URL, note: 'A reprint, on a third-party campus site, of a Shenzhen Shopee campus posting for frontend development engineers graduating in 2027, in Beijing, Shanghai and Shenzhen, posted in April 2026, with the process line "网申/内推 > 笔试（部分岗位不设笔试） > 2-3轮专业面试 > HR沟通 > Offer" (online application or referral, a written test that some roles skip, two to three technical rounds, an HR conversation, offer). The site states that it is a reprint; the line is the only official-origin frontend process description and applies to mainland China.', kind: 'official' },
    ],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full Shopee practice set',
    copy:
      'Premium opens each locked Shopee question with its wording, practice task and answer guide, and every other Premium question in the FrontendAtlas library.',
    buttonLabel: 'Unlock the full Shopee practice set',
    src: 'company_preview_shopee',
  },
  about: [
    'Shopee frontend interview preparation',
    'Writing a Promise without the Promise API',
    'Shopee frontend rounds in Vietnam, Singapore, China and Taiwan',
    'Shopee online assessment and written test',
  ],
  indexAnchorLabel: 'Shopee frontend interview questions',
};
