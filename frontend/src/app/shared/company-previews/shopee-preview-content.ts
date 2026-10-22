import type { AuthoredCompanyPreview } from '../../shared/company-previews/authored-company-preview.model';

/**
 * Shopee (Sea Group) frontend interview guide. Every prompt is a FrontendAtlas practice version modelled on
 * public, self-reported frontend accounts read in full (Viblo, Juejin, Nowcoder and GoodJob, 2020 to 2025,
 * from Ho Chi Minh City, mainland China, Singapore campus hiring and Taipei), on two Singapore campus loops in
 * other tracks for the campus shape, on Shopee's own How we hire page and on a reprinted China campus posting.
 * Nothing here is a leaked, confirmed or official Shopee question, and nine accounts cannot establish a fixed
 * loop. Chinese and Vietnamese quotes are kept short and glossed in English.
 */
const SHOPEE_HCMC_2025_URL =
  'https://viblo.asia/p/luyen-tap-that-bai-va-thanh-cong-hanh-trinh-cua-anh-dat-hoc-vien-engineer-pro-vao-shopee-EbNVQnP04vR';
const SHOPEE_HCMC_2025_LABEL = 'Public report: Viblo frontend engineer account, Ho Chi Minh City, February 2025';
const SHOPEE_JUEJIN_2020_URL = 'https://juejin.cn/post/6880722165982429197';
const SHOPEE_JUEJIN_2020_LABEL = 'Public report: Juejin frontend interview record, mainland China, March 2020';
const SHOPEE_NOWCODER_2022_URL = 'https://www.nowcoder.com/discuss/353159545788768256';
const SHOPEE_NOWCODER_2022_LABEL = 'Public report: Nowcoder frontend social-hire interview, mainland China, April 2022';
const SHOPEE_TAIPEI_2021_URL = 'https://www.goodjob.life/experiences/5ff7488233dedf001238f46c';
const SHOPEE_TAIPEI_2021_LABEL = 'Public report: GoodJob frontend engineer written test and panels, Taipei, January 2021';
const SHOPEE_SG_CAMPUS_2020_URL = 'https://www.nowcoder.com/discuss/495162';
const SHOPEE_SG_CAMPUS_2020_LABEL = 'Public report: Nowcoder Singapore frontend campus first round, September 2020';
const SHOPEE_CAMPUS_JULY_2020_URL = 'https://www.nowcoder.com/discuss/463919';
const SHOPEE_CAMPUS_JULY_2020_LABEL = 'Public report: Nowcoder frontend campus interviews, mainland China, July 2020';
const SHOPEE_CAMPUS_MARCH_2020_URL = 'https://www.nowcoder.com/discuss/353156107927494656';
const SHOPEE_CAMPUS_MARCH_2020_LABEL = 'Public report: Nowcoder frontend campus first round, mainland China, March 2020';
const SHOPEE_MEDIUM_CAMPUS_2020_URL = 'https://medium.com/@g4691821/2020-new-grad-面試心得-3-shopee-eaabf411c35b';
const SHOPEE_MEDIUM_CAMPUS_2020_LABEL = 'Public report: Medium backend campus loop, Singapore, April 2020';
const SHOPEE_MEDIUM_CAMPUS_2022_URL =
  'https://medium.com/@julianachang/2022-新鮮人軟體工程師面試心得-yahoo-foodpanda-shopee-dell-d576d6c004b6';
const SHOPEE_MEDIUM_CAMPUS_2022_LABEL = 'Public report: Medium new-graduate backend loop, Singapore campus, January 2022';
const SHOPEE_HOW_WE_HIRE_URL = 'https://careers.shopee.sg/how-we-hire';
const SHOPEE_CHINA_CAMPUS_REPRINT_URL = 'https://campus.niuqizp.com/job-vlU5ZCLtN.html';

export const SHOPEE_PREVIEW_TITLE = 'Shopee Frontend Interview Questions: 5 Prompts + Prep Guide';
export const SHOPEE_PREVIEW_H1 = 'Shopee Frontend Interview Questions';
export const SHOPEE_PREVIEW_DESCRIPTION =
  'Prepare for a Shopee frontend interview with 5 practice prompts modelled on public reports: Promise from scratch, React hover menu, function cache, HTTP, CSS.';
export const SHOPEE_PREVIEW_CANONICAL_PATH = '/companies/shopee/preview';
export const SHOPEE_PREVIEW_TRUST_NOTE =
  'These are FrontendAtlas practice versions modelled on rounds described in public interview reports, not leaked, confirmed or official Shopee questions. Nine self-reported accounts, most of them from 2020 to 2022 and written in Chinese, cannot establish a fixed format; use recruiter-provided material as the source of truth.';

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
      'Prepare with five practice prompts shaped by public frontend interview accounts from Ho Chi Minh City, mainland China, Singapore campus hiring and Taipei, 2020 to 2025: a Promise written without using Promise after event-loop and async questions, a recursive multi-level hover menu in React, a function cache keyed by its arguments beside flatten, deep clone and new, an HTTP, caching, cookie and security round, and a 90-minute written test with CSS specificity and centring questions.',
    caveat:
      'This guide uses public, self-reported interview accounts, most of them written in Chinese between 2020 and 2022, together with Shopee\'s own hiring page and a reprinted campus posting, to create realistic constraints. It does not claim access to private interview material, a fixed interview format, or the stack of every Shopee team.',
    chips: ['5 practice prompts', 'JavaScript, React, HTTP, CSS', 'Full practice set requires Premium'],
  },
  studyPriorities: {
    kicker: 'Study priorities',
    title: 'Prepare for product judgment, not Shopee trivia',
    paragraphs: [
      'The public accounts reward engineers who can write JavaScript fundamentals from memory and explain the web platform precisely: a Promise implemented without Promise, a function cache, flatten, deep clone and new, then HTTP caching, cookie attributes, CSRF, XSS and CORS answered with the right headers and status codes. Networking and security questions appear in these frontend accounts more often than in most other companies\' public loops, sometimes as a whole round, and one or two LeetCode easy-to-medium problems sit in most technical rounds outside Taipei. Each prompt below starts with the clarifying questions a strong candidate asks, then the behaviours a strong answer covers, then the miss that usually ends the round.',
      'The shape differs by region. The 2025 Ho Chi Minh City account ran a two-hour frontend round in clear parts (CSS, JavaScript, a React build, an algorithm), a CS-fundamentals round, a behavioural interview a week later and a final conversation before the offer. Mainland-China loops run per department as a first and second technical interview plus HR, sometimes all on one day, and a second department can re-interview a candidate another has turned down. Singapore campus loops start with an online assessment and continue in video rounds of 60 to 90 minutes. Taipei ran a 30-minute HR call, a 90-minute written test and same-day panels with a product manager and a tech lead, where, in the candidate\'s words, communication mattered a lot. Practise narrating your decisions, not only typing them.',
    ],
  },
  sourceBoundary: {
    kicker: 'Source boundary · checked October 2026',
    title: 'What the public accounts establish, and what you still need to confirm',
    paragraphs: [
      'Seven self-reported frontend accounts read in full inform this guide. Viblo, February 2025, a Frontend Engineer at Shopee Vietnam in Ho Chi Minh City with an offer: an HR call, a two-hour frontend round split into CSS, JavaScript, a React build and an algorithm, a CS-fundamentals round, a behavioural interview a week later and a final conversation. Juejin, March 2020, a candidate with about eighteen months of experience in mainland China: two loops, a seller-platform loop that ended at HR and a same-day supply-chain session that led to a job, with about sixty questions listed. Nowcoder, April 2022, a social hire with more than two years of experience: a digital-bank frontend first round rejected with "算法有待加强" (algorithms need strengthening), then two rounds with a second department and another rejection. GoodJob, January 2021, a frontend engineer with four years of experience in Taipei: a 30-minute HR call, a 90-minute onsite written test with seven questions, same-day panels and no reply. Nowcoder, September 2020, a first round for a Singapore frontend campus role; and two mainland-China campus accounts from 2020: a March first-round rejection write-up and a July account with first and second technical rounds. Two Singapore backend campus loops from 2020 and 2022, by Taiwanese graduates, supply the campus assessment and round shape only.',
      'Together they establish that these rounds and tasks occurred; they do not establish exact wording, the current format, or how the Singapore experienced-hire loop runs today, which rests on search snippets only. Most full-text accounts are from 2020 to 2022 and written in Chinese; the newest full account is the 2025 Vietnamese one. Shopee\'s How we hire page lists five steps and says the number of rounds varies depending on the role and seniority, and a reprinted 2027 campus posting for mainland China gives the only official-origin frontend process line. On 21 October 2026 the Shopee job board listed no frontend-titled opening in Singapore or South-East Asia, and mainland China hires frontend engineers through its campus cycle; check the board, then confirm the language, the assessment, the number of rounds and the tools with the recruiter.',
    ],
  },
  roleLenses: {
    kicker: 'Role lenses',
    title: 'Two product contexts for practising transferable frontend judgment',
    intro:
      'These are preparation lenses derived from the departments the public accounts name (a seller platform, a supply-chain team, a digital bank and a team the account calls PFMS), not claimed team assignments. Choose the lens closest to the role and keep the reasoning framework-neutral.',
    items: [
      {
        title: 'Seller and back-office web',
        description:
          'The 2020 and 2022 mainland-China loops ran through seller-platform, supply-chain and PFMS teams and asked about webpack performance and async chunk loading, fifty SVG requests, what a CDN does, html2canvas and a schema-driven back-office form.',
        practiceFocus:
          'Bundle splitting and lazy loading, sprites and batching for many small assets, CDN caching with explicit invalidation, form state driven by a schema, and rendering work kept off the critical path.',
      },
      {
        title: 'Digital bank',
        description:
          'The 2022 digital-bank first round was an HTTP and security round: an HTTP message for a POST, strong versus negotiated caching, SameSite and CSRF, CORS, and carrying an ID number safely in a cookie, plus a Vue scenario: a vertically centred dialog created on demand through a createDialog call rather than injected as a component.',
        practiceFocus:
          'Cookie and token placement with its trade-offs, HTTPS and TLS reasoning, CORS with credentials, escaping and a Content Security Policy, and idempotent requests for actions that move money.',
      },
    ],
  },
  prompts: {
    kicker: 'Representative practice prompts',
    title: 'Five Shopee frontend interview practice questions',
    intro:
      'For each prompt, clarify the contract, explain ownership and trade-offs, implement or write out the smallest credible slice, and test the failure cases. Each prompt links to the public report it is modelled on and to a practice page; quoted Chinese and Vietnamese phrases are glossed in English.',
    itemListName: 'Five Shopee frontend interview practice prompts',
    items: [
      {
        id: 'promise-without-promise',
        title: 'Write a Promise without using Promise, after the event-loop and async questions',
        statement:
          'The 2025 Ho Chi Minh City account describes the JavaScript part of a two-hour frontend round: the interviewers went deep into the event loop, promises and async/await, then set one exercise, "code một Promise nhưng không được dùng Promise" (write a Promise without using Promise). Implement a MyPromise class with a constructor that takes an executor, then and catch methods that chain, and callbacks that run asynchronously, and be ready to predict the output of promise and setTimeout snippets before you start.',
        whatThisMeasures:
          'Whether you understand the state machine behind a promise (pending, fulfilled, rejected, settled once), how then returns a new promise and adopts returned values, why callbacks must run asynchronously, and whether you can predict microtask and macrotask order.',
        clarifyFirst: [
          'Confirm the scope: constructor, then and catch only, or also finally, static resolve and reject, and adopting thenables returned from handlers.',
          'Ask whether callbacks must run as microtasks (queueMicrotask) or whether setTimeout is acceptable, and whether the interviewer wants tests or a demonstration with console output.',
        ],
        strongAnswer: [
          'Hold the state, the value and two handler queues; let the executor call resolve or reject synchronously, and ignore every settlement after the first.',
          'Make then return a new promise: a handler\'s return value resolves it, a thrown error rejects it, and a missing handler passes the value or the reason through, so chains work and catch(fn) is then(undefined, fn).',
          'Queue handlers while pending and run them asynchronously once settled, so a then callback does not fire synchronously even when the promise is already resolved.',
          'Answer the warm-ups precisely first: the 2020 Juejin record asks whether microtasks run ahead of macrotasks without exception and for the output of a promise resolved with a rejected promise (it logs 2, the catch branch), and the 2021 Taipei written test asks what setTimeout inside a var loop logs.',
        ],
        commonMiss:
          'Calling then callbacks synchronously when the promise is already settled, or letting a second resolve overwrite the first value; both break the ordering questions the same round asked about.',
        resourceLabel: 'Practice the deferred promise with resolve and reject controls (free)',
        resourcePath: '/javascript/coding/js-create-deferred-promise',
        reportedRound: { label: SHOPEE_HCMC_2025_LABEL, url: SHOPEE_HCMC_2025_URL },
      },
      {
        id: 'recursive-hover-menu-react',
        title: 'Build a recursive multi-level hover menu in React',
        statement:
          'From the same 2025 account: build a multi-level menu in React where hovering an item drops down its sub-menu, and a sub-menu with children of its own keeps opening, described by the candidate as a recursion exercise. Take a nested array of items with an optional children array, render one component that renders itself for each child, and keep only the hovered path open.',
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
          'Use stable ids as keys rather than the array index, and add a focus and keyboard path (Enter or ArrowRight to open, Escape to close) so the menu works without a mouse; the React nested comments drill at /react/coding/react-nested-comments (Premium) rehearses the same recursive tree with a single active branch.',
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
          'A 2020 Juejin record of two mainland-China loops lists the handwritten tasks: a cache wrapper where f2 = cache(f1) returns the earlier result at once for the same arguments (f1("abc", 123, {b: 3}) took 1000 seconds to return 10; f2 with the same call returns 10 in 0 seconds), 拍平数组 (flatten an array), 深复制 (deep clone) and "new 的实现" (implement new). A 2022 Nowcoder social-hire account got 函数缓存 (a function cache) again in a second round. Implement each in plain JavaScript and say what each one does with its edge cases.',
        whatThisMeasures:
          'Closures and key derivation for a cache, recursion over nested arrays and objects, how the prototype chain and this binding work inside new, and whether you name the edge cases (object arguments, cycles, dates and functions in a clone, a constructor that returns an object) without being prompted.',
        clarifyFirst: [
          'For the cache: ask how two calls with the same object argument should compare (by reference or by serialised value), whether entries expire or the size is capped, and what to do when the function throws.',
          'For deep clone: confirm which types must survive (nested arrays and objects, Date, Map, Set, cyclic references) and whether structuredClone is allowed or the point is to write it by hand.',
        ],
        strongAnswer: [
          'Cache: return a wrapper that derives a key from the arguments (JSON.stringify for plain data, or a Map keyed by reference when identity is what the interviewer wants), stores results in a Map and returns the stored value on a hit; say how a thrown error and a Promise result should be treated.',
          'Flatten: a recursive reduce that concatenates nested arrays, then Array.prototype.flat(Infinity) once you have shown the hand-written version; the one-level version at /javascript/coding/js-flatten-once (free) is the warm-up.',
          'Deep clone: recurse over arrays and plain objects, copy Date, Map and Set explicitly, and keep a WeakMap of visited objects so cycles terminate; the full drill is at /javascript/coding/js-deep-clone (Premium).',
          'new: create an object whose prototype is the constructor\'s prototype, call the constructor with that object as this, and return the constructor\'s result if it is an object, otherwise the new object; /javascript/coding/js-implement-new (free) covers the same contract. The 2020 record also asks whether an arrow function can be used with new, and the 2022 account asks you to walk an object\'s and a function\'s prototype chain all the way to null.',
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
          'The 2022 Nowcoder account lists its digital-bank frontend first round in order: given the URL and return body of a POST, write the HTTP message; strong versus negotiated caching; from HTTP to cookies and the SameSite attribute, then on to CSRF and XSS; cross-origin requests, which the candidate extended to simple versus preflighted requests; and how to keep an ID number safe when it must travel in a cookie. The 2020 Juejin record asks about the HTTPS and TLS handshakes, symmetric versus asymmetric encryption, the HttpOnly and Secure flags and the status codes behind each cache type, and the 2020 Singapore campus first round asks how HTTPS prevents a man-in-the-middle attack and how a session, a cookie and a token differ.',
        whatThisMeasures:
          'Precise web-platform knowledge stated from memory: the shape of an HTTP response, cache headers and their status codes, cookie attributes and the attacks they limit, CORS mechanics, and transport-security reasoning for sensitive data.',
        clarifyFirst: [
          'For the HTTP message, confirm whether the interviewer wants the request, the response or both, and which headers matter for the body (Content-Type, Content-Length, Set-Cookie).',
          'For the ID-number question, ask what the cookie is for and whether the server can hold the value instead, before describing how to protect it in transit.',
        ],
        strongAnswer: [
          'Write the response as a status line, headers, a blank line and the body: HTTP/1.1 201 Created (or 200 OK), Content-Type: application/json, Content-Length, Set-Cookie if a session starts, then the JSON; say what changes for a redirect or an error.',
          'Strong caching: Cache-Control max-age or Expires, the browser serves its copy without a request and reports 200 from cache; negotiated caching: ETag with If-None-Match or Last-Modified with If-Modified-Since, and the server answers 304 when nothing changed. The 2020 campus first round asked for exactly those header pairs.',
          'Cookies: HttpOnly keeps script away from the value and limits what XSS can steal, Secure limits it to HTTPS, SameSite (Lax by default in current browsers, Strict for sensitive actions) limits CSRF; XSS is a different attack that runs script inside your origin and is limited by escaping, safe DOM APIs and a Content Security Policy.',
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
          'A 2021 Taipei account reproduces its 90-minute onsite written test, which the candidate rated junior level: sort an array and remove duplicates in decreasing order; the rules of CSS specificity; shallow versus deep copy; how to manage CSS in a large application; three ways to centre horizontally and vertically; optimise or debug a class component; and the console output of setTimeout inside a var loop. The same-day panels then asked about cookie details, localStorage and sessionStorage, whether computing load belongs on the frontend or the backend, and how the browser renders HTML, CSS and JavaScript. The 2020 mainland-China campus first round asked for the centring methods and the caching headers as well. Answer all seven in writing with a clock running, then explain each answer aloud.',
        whatThisMeasures:
          'Fast, correct fundamentals on paper: array methods, the specificity algorithm, copy semantics, CSS organisation at scale, layout techniques, class-to-hooks judgment and closure behaviour in loops, plus the ability to explain each answer to a product manager and a tech lead the same day.',
        clarifyFirst: [
          'For the centring and CSS-at-scale questions, ask whether the interviewer wants methods named or a recommendation with trade-offs, and whether a methodology such as BEM or scoped styles is assumed.',
          'For the class component, confirm what "optimise" targets (render count, readability, bundle size) before rewriting it with hooks.',
        ],
        strongAnswer: [
          'Sort and dedupe: Array.from(new Set(arr)).sort((a, b) => b - a), and say why sort without a comparator would order the numbers as strings.',
          'Specificity: inline styles beat ids, ids beat classes, attributes and pseudo-classes, which beat elements and pseudo-elements; !important overrides the comparison and later rules win ties. Three ways to centre: flex with justify-content and align-items, grid with place-items, and absolute positioning with a transform; name margin auto on a sized block as a fourth if asked.',
          'Shallow versus deep copy: spread and Object.assign copy one level and nested objects stay shared; a JSON round-trip drops functions and dates; structuredClone or a hand-written recursion handles the rest. CSS at scale: a naming convention or scoped styles, design tokens, a layering order and a lint rule, with one place for global resets.',
          'The loop: var hoists one i shared by all three callbacks, so after the loop it logs 3 undefined three times; let gives each iteration its own binding. The class component: move it to a function component with hooks where that simplifies it, add stable keys to the list items, and memoise only what profiling shows is expensive, as the account\'s own answer suggested.',
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
    kicker: 'Public mini walkthrough',
    title: 'Scope the Promise implementation before the first line',
    intro:
      'Treat this as a representative exercise, not a description of the reported one. Work from the contract toward the microtask, and say each decision out loud.',
    steps: [
      { title: 'Pin the contract', description: 'A constructor that takes an executor and calls it at once with resolve and reject; then(onFulfilled, onRejected) and catch(onRejected) that return new promises. Say what you are leaving out: finally, the static helpers, thenable adoption.' },
      { title: 'Model the state', description: 'Three states (pending, fulfilled, rejected), one value or reason, and a guard so only the first resolve or reject counts; a throw inside the executor rejects.' },
      { title: 'Queue the handlers', description: 'While pending, push each then call\'s handlers into two arrays; on settlement, drain the arrays in order.' },
      { title: 'Make then chain', description: 'Each then creates a new promise; a handler\'s return value resolves it, a thrown error rejects it, and a missing handler passes the value or the reason through.' },
      { title: 'Run callbacks asynchronously', description: 'Schedule handler execution with queueMicrotask (or setTimeout if told to), even when the promise is already settled, so the ordering matches the native behaviour you were asked to predict.' },
      { title: 'Test the edges', description: 'Resolve twice, reject after resolve, throw in a handler, a then without handlers, a handler returning one of your own promises, and the output order against a native Promise.' },
    ],
  },
  prepPlan: {
    kicker: 'Actionable preparation',
    title: 'A 7-day Shopee frontend interview preparation plan',
    intro: 'Every day ends with code, a test, a written answer, or a question you can use in the real process.',
    days: [
      { day: 'Day 1', focus: 'Event loop and promises: microtask and macrotask order, promise-chain output questions, setTimeout inside a var loop, catching errors with async/await.', artifact: 'A Promise written without Promise, with a test list you can retype from memory.' },
      { day: 'Day 2', focus: 'Handwritten utilities: a function cache keyed by arguments, flatten, deep clone, new, valid brackets, a publish-subscribe function.', artifact: 'Six implementations with edge cases written as tests.' },
      { day: 'Day 3', focus: 'React builds: the recursive multi-level hover menu, keys and one-way data flow, a class component moved to hooks, a component with data fetching.', artifact: 'The hover menu with keyboard access and a note on where the open state lives.' },
      { day: 'Day 4', focus: 'HTTP and security: an HTTP message for a POST response, strong versus negotiated caching with 200 and 304, cookie attributes, CSRF versus XSS, simple versus preflighted CORS requests, the HTTPS handshake, session versus cookie versus token.', artifact: 'A one-page answer sheet with the status code or header named for each topic.' },
      { day: 'Day 5', focus: 'CSS and the browser: specificity, three ways to centre, the position values, display none versus visibility hidden, managing CSS at scale, how the browser renders a page.', artifact: 'The seven Taipei written-test questions answered in 90 minutes against a clock.' },
      { day: 'Day 6', focus: 'Algorithms: sort and dedupe, string compression (elephant-walk to e6t-w2k), count the smaller elements, binary search, the intersection of two sets with sorting and two pointers or a hash map, reverse a linked list in groups of k.', artifact: 'Solutions in JavaScript with the time complexity stated for each.' },
      { day: 'Day 7', focus: 'Mock loop and behavioural: a two-hour frontend round narrated in parts, a CS-fundamentals round that starts from a system you built, a story about a colleague who held a different view.', artifact: 'A list of the questions you will ask the recruiter about the language, the assessment, the rounds and the tools.' },
    ],
  },
  faqs: {
    kicker: 'Preparation FAQ',
    title: 'Common Shopee frontend interview preparation questions',
    items: [
      { question: 'Are these the real Shopee questions?', answer: 'No. They are FrontendAtlas practice versions modelled on rounds and tasks described in public, self-reported accounts and on Shopee\'s own hiring page. The wording, the data and the test cases are ours, and the quoted Chinese and Vietnamese phrases are the candidates\' own words, glossed in English.' },
      { question: 'Which language is the interview in?', answer: 'Mainland-China loops run in Chinese; the full-text accounts from there are written in Chinese about Chinese-language rounds. Singapore campus loops are reported in English by Taiwanese candidates: the 2022 account says its technical round was conducted entirely in English, and a 2021 platform-engineer account on PTT says its rounds were in English, while a commenter on that thread adds that a round may run in Chinese depending on the interviewer. The Vietnamese accounts do not say which language was used, and the Taipei written test mixes English and Chinese questions. Ask the recruiter.' },
      { question: 'Is there an online assessment?', answer: 'Campus accounts describe one. Two Singapore campus loops in other tracks sat an online assessment: 70 minutes with ten multiple-choice questions on operating systems and networking plus two coding problems in 2022, and twenty-odd multiple-choice questions plus one LeetCode problem in 2021. A 2021 mainland-China campus thread, visible only as a search snippet, describes a frontend variant with five JavaScript problems. In mainland China the reprinted campus posting lists a written test after the application and says some roles have none; the two social-hire accounts used here started with a technical interview. The 2025 Ho Chi Minh City loop had no assessment, and Taipei ran a 90-minute written test onsite instead. Confirm with the recruiter.' },
      { question: 'How much algorithm work is there?', answer: 'The Singapore and mainland-China accounts put one or two LeetCode easy-to-medium problems in each technical round: a string-compression task in the 2020 Singapore campus first round, binary search, the intersection of two sets and quicksort in a 2021 campus first round, and reversing a linked list in groups of k in the 2022 social-hire round, whose feedback was "算法有待加强" (algorithms need strengthening). The 2025 Ho Chi Minh City round ended with one algorithm on mapping characters between two data sets. The Taipei candidate wrote that algorithms were hardly required ("對於演算法倒是不太要求"). Expect the handwritten utilities to count as much as the algorithms.' },
      { question: 'Is Shopee hiring frontend engineers right now?', answer: 'On 21 October 2026 the Shopee job board listed no frontend-titled opening in Singapore or South-East Asia; its 80 Singapore engineering postings carried backend, graduate and intern titles, and the only frontend-titled roles were two full-stack Python and React positions in São Paulo. Mainland China hires frontend engineers through its campus cycle, whose 2027 posting appeared in April 2026. Check the board before you plan a week of preparation.' },
    ],
  },
  resourceLinks: {
    kicker: 'Free public practice',
    title: 'Build the underlying skills with free practice',
    intro:
      'These public pages cover the promise, utility, event-loop, caching, cookie, security and CSS skills used by the practice prompts. They are supporting drills, not claimed Shopee questions.',
    items: [
      { label: 'Create a deferred promise', description: 'The resolve and reject controls behind the Promise-from-scratch exercise.', path: '/javascript/coding/js-create-deferred-promise' },
      { label: 'Implement the new operator', description: 'The handwritten new asked in both mainland-China accounts.', path: '/javascript/coding/js-implement-new' },
      { label: 'Flatten one level', description: 'The warm-up for 拍平数组 (flatten an array) from the 2020 seller-platform round.', path: '/javascript/coding/js-flatten-once' },
      { label: 'JavaScript event loop visualizer', description: 'Predict the output of the promise and setTimeout questions.', path: '/javascript/trivia/js-event-loop' },
      { label: 'HTTP caching basics', description: 'Strong versus negotiated caching, ETag, If-None-Match and 304.', path: '/javascript/trivia/http-caching-basics' },
      { label: 'Cookie attributes', description: 'HttpOnly, Secure and SameSite for the cookie and CSRF questions.', path: '/javascript/trivia/js-cookie-options' },
      { label: 'DOM XSS prevention', description: 'How an XSS attack runs and which sinks to avoid.', path: '/javascript/trivia/js-xss-dom-sinks' },
      { label: 'Cascade, specificity and !important', description: 'The specificity rules from the written test and the Singapore first round.', path: '/css/trivia/css-cascade-order' },
      { label: 'Behavioural stories', description: 'A structure for the colleague-with-a-different-view and hardest-problem questions.', path: '/guides/behavioral/stories' },
    ],
  },
  sources: {
    kicker: 'Public interview reports and official context',
    title: 'Sources and evidence limits',
    intro:
      'These links support the public context used by the guide. Their notes state what each source can and cannot establish about preparation. Most full-text accounts are from 2020 to 2022 and written in Chinese; the quotes above are glossed in English.',
    items: [
      { label: SHOPEE_HCMC_2025_LABEL, url: SHOPEE_HCMC_2025_URL, note: 'One self-reported Frontend Engineer loop at Shopee Vietnam in Ho Chi Minh City, published in February 2025 by a preparation course in the candidate\'s own words and ending in an offer. It establishes the HR call, the two-hour frontend round split into CSS, JavaScript, a React build and an algorithm, the CS-fundamentals round, the behavioural interview a week later and the offer a few days after the final conversation; it names no interview language and cannot establish the current format.', kind: 'report' },
      { label: SHOPEE_JUEJIN_2020_LABEL, url: SHOPEE_JUEJIN_2020_URL, note: 'One self-reported record of two mainland-China loops in March 2020, a seller-platform loop that ended at HR and a same-day supply-chain session that led to a job, with about sixty questions listed. It establishes the handwritten tasks (a function cache, flatten, deep clone, new), the promise output questions and the HTTP, caching and cookie questions of that year; the city is not stated and the loop is more than five years old.', kind: 'report' },
      { label: SHOPEE_NOWCODER_2022_LABEL, url: SHOPEE_NOWCODER_2022_URL, note: 'One self-reported social-hire loop in April 2022 by a Guangdong University of Technology alumnus with more than two years of experience, city not stated: a digital-bank frontend first round that ended with "算法有待加强" (algorithms need strengthening), then a first and second round with a second department, which the account calls PFMS, that also ended in a rejection. It establishes the HTTP, caching, SameSite, CORS and cookie-safety questions, the k-group linked-list reversal and the function cache; it cannot establish the current format.', kind: 'report' },
      { label: SHOPEE_TAIPEI_2021_LABEL, url: SHOPEE_TAIPEI_2021_URL, note: 'One self-reported frontend engineer loop in Taipei in January 2021 by a candidate with four years of experience who heard nothing afterwards. It establishes the 30-minute HR call, the 90-minute onsite written test with its seven questions, the same-day panels with a product manager and a tech lead, the behavioural questions, and the candidate\'s view that algorithms were hardly required and communication mattered; it is one loop from 2021.', kind: 'report' },
      { label: 'Public report: Shopee senior software engineer loop on GoodJob, 2023', url: 'https://www.goodjob.life/experiences/6a38a65e0214e43e1c1c7ce6', note: 'A Taipei account interviewed in June 2023 and hired: four stages, an HR conversation, a manager round on technology, a peer round and a senior-manager conversation. Used for the Taipei caveat only.', kind: 'report' },
      { label: SHOPEE_SG_CAMPUS_2020_LABEL, url: SHOPEE_SG_CAMPUS_2020_URL, note: 'One self-reported first round for a Singapore frontend campus role in September 2020, posted on Nowcoder in Chinese. It establishes the string-compression algorithm, the JavaScript versus CSS animation question, specificity, React keys, HTTPS and man-in-the-middle attacks, and session versus cookie versus token; it covers one round only.', kind: 'report' },
      { label: SHOPEE_CAMPUS_JULY_2020_LABEL, url: SHOPEE_CAMPUS_JULY_2020_URL, note: 'One self-reported mainland-China campus loop from July 2020 with a first and a second technical round. It establishes the process-versus-thread, XSS, CSRF, keep-alive and HTTP/2 questions, the event-loop puzzle, the thousands-separator task, and the second round\'s React, diffing, 304 and "a user reports a button that cannot be clicked" questions; it cannot establish the current campus format.', kind: 'report' },
      { label: SHOPEE_CAMPUS_MARCH_2020_LABEL, url: SHOPEE_CAMPUS_MARCH_2020_URL, note: 'One self-reported 2020 spring campus first round in mainland China. It establishes the caching headers (If-None-Match and If-Modified-Since), the centring question, Vue basics, the promise-chain output and the count-the-smaller-elements algorithm; a Shopee frontend employee corrects the candidate\'s caching answer in the comments.', kind: 'report' },
      { label: SHOPEE_MEDIUM_CAMPUS_2020_LABEL, url: SHOPEE_MEDIUM_CAMPUS_2020_URL, note: 'One Taiwanese new graduate\'s Singapore backend campus loop from spring 2020, read for the campus shape only: an application on 23 March, an HR call on 14 April, three technical rounds of 90, 90 and 60 minutes on a shared editor with a design-concept question in each, and a verbal offer on 28 April. It is not a frontend loop and names no frontend question.', kind: 'report' },
      { label: SHOPEE_MEDIUM_CAMPUS_2022_LABEL, url: SHOPEE_MEDIUM_CAMPUS_2022_URL, note: 'One Taiwanese new graduate\'s Singapore campus backend loop from January 2022, read for the campus shape only: a 70-minute online assessment with ten multiple-choice questions and two coding problems, one 90-minute technical round conducted entirely in English, and a rejection sixteen days after applying. It is not a frontend loop.', kind: 'report' },
      { label: 'Shopee Careers: How we hire, read October 2026', url: SHOPEE_HOW_WE_HIRE_URL, note: 'Official page, read in Chrome on 21 October 2026. It lists five steps (Apply, Getting to Know You, Putting Your Skills to the Test, Meet the Hiring Manager, Preparing to Join Us) and answers that "The number of rounds varies depending on the role and seniority."; it names no frontend format or question.', kind: 'official' },
      { label: 'Shopee China campus posting for frontend development engineers, 2027 cycle (reprint), April 2026', url: SHOPEE_CHINA_CAMPUS_REPRINT_URL, note: 'A reprint, on a third-party campus site, of a Shenzhen Shopee campus posting for 2027 frontend development engineers in Beijing, Shanghai and Shenzhen, posted in April 2026, with the process line "网申/内推 > 笔试（部分岗位不设笔试） > 2-3轮专业面试 > HR沟通 > Offer" (online application or referral, a written test that some roles skip, two to three technical rounds, an HR conversation, offer). The site states that it is a reprint; the line is the only official-origin frontend process description and applies to mainland China.', kind: 'official' },
    ],
  },
  cta: {
    kicker: 'Full company practice',
    title: 'Continue with the full Shopee practice set',
    copy:
      'This public guide is complete enough to plan a focused week. Premium unlocks the memoisation drill, the deep clone drill, the React nested comments tree and the wider premium library of coding, concept and system-design practice.',
    buttonLabel: 'Unlock the full Shopee practice set',
    src: 'company_preview_shopee',
  },
  about: [
    'Shopee frontend interview preparation',
    'Promise and event-loop implementation questions',
    'HTTP caching, cookie and web security questions',
    'Handwritten JavaScript utilities and CSS fundamentals',
  ],
  indexAnchorLabel: 'Shopee frontend interview questions',
};
