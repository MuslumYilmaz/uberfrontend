# Company sources review, October 2026

Review of the eleven company pages that existed before the company-pages plan (Airbnb, Amazon, Apple, ByteDance, Google, Meta, Microsoft, Netflix, OpenAI, Stripe, Uber). Carried out on 2026-10-15 with the readable sources listed in [[interview-report-source-access]] (Taro, Blind, LeetCode Discuss through its GraphQL endpoint, Medium through RSS feeds, official careers pages). Glassdoor and 1point3acres return 403 and were not used.

Scope rules applied:

- A source is attached to a catalog item only when a readable public account describes that item's shape for that company. Trivia items cannot carry sources (the question lint forbids it), so trivia evidence is listed here instead.
- Items that were already tagged for a company gained sources; reported questions that match an item we do **not** tag for that company are listed under "found but not tagged" rather than tagged, so the catalog does not drift without a decision. One exception: the AI chat textarea system design case gained an OpenAI tag because a public account describes the OpenAI design prompt as "ChatGPT, but in a text area".
- Official preparation pages are rendered as a table on each company page (`company-official-guides.ts`). Only pages read on 2026-10-15 are listed; Stripe publishes none, and the Apple interview-tips page (general advice, no stages) was found and added on 2026-10-22.

## 1. Official preparation pages

| Company | Pages added to the table | Notes |
|---|---|---|
| Amazon | Front End Engineer interview prep (full-time), Front End Engineer prep for students, Interviewing at Amazon, Leadership Principles, Software development interview topics | The FEE page is the richest official front-end guide of any company: OA format (90-minute coding, 20-minute system design scenarios, work-style survey), 60-minute phone screen split between Leadership Principles and front-end coding, four 55-minute loop interviews, front-end system design objectives. |
| Google | How we hire, Interviewing at Google: best practices, advice and tips | The tips page renders client-side; our tools confirmed only its title. |
| Meta | Hiring process, Preparing for your initial Front End Engineer interview | The hiring process page describes the AI-native coding interview with a built-in assistant in CoderPad and recommends practising with AI tools. The FEE page links a downloadable guide. |
| Microsoft | Hiring tips, Interview tips | Generic: stages, STAR(R), culture focus areas, AI-use code of conduct. |
| Uber | Frontend Engineering Interview Guide, Landing the job at Uber: Front-End Engineer, Get interview ready | The frontend guide lists the loop: recruiter call, HackerRank, 60-minute technical phone screen, then algorithms, specialisation depth and collaboration interviews. |
| OpenAI | Interview guide | openai.com returns 403 to our tools; the row uses the public search preview of the official page. |
| ByteDance | Interview tips (ByteDance early careers), Interview tips (TikTok early careers) | Early-careers pages; the technical section covers coding, algorithms and design, HackerRank and Nowcoder practice, thinking out loud. |
| Netflix | New grads, Internships, Culture memo | No page for experienced hires; the new-grad and intern pages describe a take-home assessment and two to three rounds. |
| Airbnb | Careers FAQ | Only general statements (a test, a video or an event; meeting several team members). |
| Apple | https://www.apple.com/careers/us/interview_tips.html | General interview tips with no stages or frontend content; found on 2026-10-22, this table said none existed before. |
| Stripe | none | Job postings only; a 2023 Barcelona account says Stripe sends candidates a written prep guide before the loop. The Stripe Atlas "recruiting" guide is an excerpt from Elad Gil's book, not Stripe's process. |

## 2. Sources added to tagged items

| Company | Item | Source | What it establishes |
|---|---|---|---|
| Google | js-throttle | LeetCode Discuss, Google phone screen, April 2020 | A throttle wrapper for an expensive function with follow-ups on parameters. |
| Google | js-throttle | Blind Google frontend questions thread, December 2020 | "Limit a function so it calls f at most every 50 ms." |
| Google | js-debounce | LeetCode Discuss, Google onsite, spring 2019 | An API that runs a function after an interval and keeps waiting if called early. |
| Google | js-debounce | Blind thread, December 2020 | "A function that returns a version of f that runs on a timeout." |
| Netflix | js-debounce | Taro, Netflix senior frontend, Warsaw, November 2024 | A search-input problem where the interviewer discussed a 200 ms debounce. |
| Amazon | react/vue-image-slider, angular-image-slider-starter | LeetCode Discuss, Amazon FEE II loop, April 2020 | "Implement a carousel component" in the phone screen. |
| Amazon | react/angular/vue-tabs-switcher | same | A modal with three language tabs that switch the text. |
| Amazon | react/angular/vue-star-rating | LeetCode Discuss, Amazon FEE II phone screen, March 2020 | A five-star widget in vanilla HTML, CSS and JavaScript with hover and lower-star behaviour. |
| Amazon | js-array-prototype-map, -filter, -reduce, js-array-sort | LeetCode Discuss community list, July 2020 | A compiled list marks custom map, reduce, filter and sort as an Amazon phone interview question (secondhand). |
| ByteDance | js-array-prototype-map, -reduce | Blind, TikTok front end experience, September 2024 | "Implement a JavaScript built-in method" in the first technical round. |
| Meta | js-memoize-function | Medium, Meta front end engineer, March 2022 | A memoization problem as the second question of the first technical interview. |
| Meta | js-timer-manager, js-timer-manager-and-dom-renderer | Taro, Meta intern, January 2022; Blind by-company list, October 2021 | "Implement your own clearAllTimeout"; a timeout clearer in the Facebook screen. |
| Meta | js-dom-twin-node | Taro, Meta intern, London, December 2021 | Traverse the DOM tree up from a node and replicate it in a similar tree. |
| Meta | js-stack-queue-implementation | Taro, Meta front end developer, San Francisco, June 2024 | How to implement a stack or queue in JavaScript. |
| Meta | js-dom-find-node | Blind by-company list, October 2021 | Facebook onsite DOM algorithm: traverse the DOM and collect nodes. |
| Apple | js-unique-array | Taro, Apple front end developer, Hyderabad, December 2019 | Concatenate two arrays and find the unique elements. |
| Apple | vue-autocomplete-search | Taro, Apple front end developer, August 2022 (full read; until 2026-10-22 the source was the June 2025 LeetCode post from a search preview, whose only coding task is nested tabs) | An autocomplete search bar in TypeScript with Vue or React. |
| OpenAI | react-chat-streaming-ui, ai-chat-textarea-design (new OpenAI tag) | Taro, OpenAI senior frontend, May 2024 | The technical screen's design prompt: "ChatGPT, but in a text area." |

Pinned registry items touched: js-debounce, js-unique-array, the three tabs switchers (coding registry) and the AI chat composer scenario (system design registry); both registries were re-pinned with maintenance notes.

## 3. Found in public accounts but not tagged or absent from the catalog

| Company | Reported question | Source | Nearest catalog item | Status |
|---|---|---|---|---|
| Google | Promise retry function, then implementing then/catch/finally | LeetCode 2021 L3/L4 | none (also reported at Intuit 2025) | absent; candidate for a new free item |
| Google | Sequence tasks with promises after a topological sort | LeetCode 2021 | none | absent |
| Google | Execute queued objects only after the previous one finished | LeetCode 2019 | none | absent |
| Google | Consolidate results of a list of callback functions into one array | LeetCode 2019 | js-promise-all (Waymo) | tag not added |
| Google | "Somewhat autocomplete" with string manipulation | LeetCode 2021 | react-autocomplete-search-starter | tag not added |
| Google | Build nested checkbox; build debounce or throttle | Blind 2025 reply | react/angular/vue-nested-checkboxes (pinned) | tag not added |
| Google | DFS on HTML nodes; print a table in the DOM for input N; outline view for a Google Doc; Minesweeper reveal; what happens when a user clicks a link | Blind 2020 | js-dom-walk-text-content (Apple); trivia | not tagged |
| Amazon | Paginated widget of addresses, five per page with previous and next | LeetCode 2022 (offer) | react-pagination-table (pinned) | tag not added |
| Amazon | Countdown timer; modal screen; form from a picture; file explorer UI; recreate a given UI with HTML and CSS | LeetCode 2020, 2020, 2021, 2024, 2025 | none | absent |
| Amazon | Design an accordion (onsite); grid with search and sort and event bubbling (onsite) | community list 2020 | react-accordion-faq; react-dynamic-table (Datadog) | tag not added |
| Amazon | Front-end system design: image service, restaurant ordering app, component architecture, file browser | LeetCode 2020 to 2024 | image-upload-preview (pinned) | not tagged |
| Amazon | Block vs inline, reflow vs repaint, event loop micro and macro tasks, memory leaks, unit vs integration testing | LeetCode phone screen 2020 | trivia repaint-reflow (tagged), others | trivia cannot carry sources |
| Meta | Implement map from scratch | Taro London 2021 | js-array-prototype-map | not tagged for Meta |
| Meta | Flatten an array; a map class keyed by DOM nodes (DOMStore) | Blind 2021; Medium 2022 | js-flatten-depth (ByteDance); none | not tagged; absent |
| Meta | Front-end system design of a specific component such as autocomplete; typeahead component design | Blind 2022, 2021 | realtime-search-debounce-cache (pinned) | not tagged |
| Apple | Tooltip library in native JavaScript with data attributes; load CSS dynamically; min stack; multiply without the operator; run-length encode a string; promises in sequence with generators; first duplicate character; product of the other elements; HTML form with radio buttons; fix errors on an existing HTML page | Medium 2022; Taro 2019, 2022 | js-stack-queue-implementation (Meta); none | not tagged; absent |
| Apple | React output prediction with useContext, useMemo and useCallback; nested tabs from a flat list; HTTPS, CSP, CORS and cookie security | LeetCode 2025 (preview only) | trivia | preview only |
| Microsoft | Weekly calendar view in plain JavaScript (twice); full-page search with pagination and highlighted snippets; grid component in React; CSS spinner; Excel-style expression evaluation; meeting overlap; multi-step form with validation | LeetCode 2020, 2021, 2024; Taro 2020 | react-pagination-table, react-multi-step-signup (pinned); none | not tagged; absent. Nothing supports the snake game or chessboard items currently tagged for Microsoft. |
| Netflix | Filter results dynamically from a REST API by input query; caching strategies | Taro Warsaw 2024 | react-debounced-search (pinned); trivia caching | not tagged |
| Netflix | Array manipulation and DOM manipulation, take-home test | Taro Los Angeles 2020 | none specific | no match |
| ByteDance | Flat array of objects to a tree; setTimeout vs promises; output order of console.log; virtual DOM; tooltip component on HackerRank; CSS specificity | Blind 2023, 2024 | js-filter-tree-render-indented (Waymo); js-dom-renderer (Meta, ServiceNow); trivia | not tagged |
| Airbnb | Build a simple React component; architecture of a mock chat app; UI for a simple card game; HTML, CSS and JavaScript screens | Taro 2022; Blind 2018, 2021, 2022, 2024 | none | absent. Nothing supports the chips input currently tagged for Airbnb. |
| Stripe | JSON object traversal and manipulation; three-part incremental exercise; bug squash in an unfamiliar repository; integration round with API docs; front-end system design | LeetCode 2024; Taro 2023, 2025; Medium 2025 | js-group-by (OpenAI), js-lodash-get (ByteDance); debug items; none | not tagged. The Stripe page holds one trivia item. |
| Uber | mapLimit with a concurrency limit (callback style); topological sort of tasks; build a UI component in React; vanilla JavaScript DOM and async machine coding; collaborative calendar design; CSS position values; display none vs visibility hidden | LeetCode 2022; Taro 2022, 2025; Medium 2022 | js-concurrency-map-limit (pinned, ByteDance); trivia position and visibility (not Uber-tagged) | not tagged. The Uber page holds two trivia items. |
| OpenAI | Refactor a piece of JavaScript with edge cases; CRUD map of tuples; webhook service design | Taro 2024; Blind 2024 | react-debug-double-render (loosely); none | not tagged |

## 4. Tagged items that still have no source

- Google: js-add-two-promises, js-compose, js-curry-function, js-deep-clone, js-deep-equal, react-nested-comments, the three image sliders, angular-input-output-two-way.
- Amazon: like button, snake game, tic-tac-toe, chessboard, chips input, dynamic counter buttons (all three frameworks where they exist). Tic-tac-toe appears only as an SDE low-level design prompt.
- Meta: js-debounce and js-throttle (no Meta-specific account), event emitter, merge sorted arrays, palindrome, reverse string, maze path, array sort, dom renderer, transfer list.
- Apple: delegated events, DOM walks, selector polyfills, median, merge sorted arrays, reverse string, valid anagram, the dialog, angular-autocomplete-search-starter.
- Microsoft: every tagged coding item (snake, chessboard).
- Netflix: throttle, contact form, debug double render, recover BST, use effect once.
- ByteDance: add strings, three sum, flatten depth, lodash get, concurrency map limit.
- Airbnb: the chips input.
- OpenAI: js-group-by, react-debug-double-render.

## 5. Options for companies without sources

1. Keep the tags as editorial groupings (the current public stance: "editorial practice groupings, not verified official interview questions") and let the sources block stay empty. Cost: none. Risk: the pages look thinner next to the sourced ones.
2. Replace unsupported tags with the reported shapes in section 3, one company per step like the plan: Microsoft (calendar view, search with pagination, multi-step form), Airbnb (component build, chat-app architecture, card game UI), Stripe (JSON traversal, bug squash, integration), Uber (mapLimit, topological sort, UI component). Several matches are pinned items, so each step needs a re-pin.
3. Write new items for the shapes that appear at more than one company and have no catalog match: promise retry with delay (Google 2021, Intuit 2025), countdown timer (Amazon 2020, ByteDance 2023 "async timer"), flat array to tree (ByteDance 2023, Apple 2025 nested tabs), promise sequence or queue (Google 2019 and 2021, Apple 2019). New pages need a separate yes.
4. Retire the Stripe and Uber pages until they have sourced items; both hold trivia only and cannot carry sources.

Sources (all read 2026-10-15): the LeetCode, Taro, Blind and Medium links above, plus the official pages in section 1.
