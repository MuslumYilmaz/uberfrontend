# Walmart, NVIDIA and Tesla: reported frontend interview questions

> Working record started on 2026-10-19. It lists the frontend interview questions and tasks that public interview reports attribute to Walmart, NVIDIA and Tesla, with a source and access status for every item. Companion documents: `docs/references/company-pages-plan-2026-10.md` (how a company page is built), `docs/references/europe-company-shortlist-2026-10.md` (the same research format for Revolut, Zalando, Spotify, Booking.com, Adyen and Wise), `docs/references/interview-prep-market-research-2026-10.md` (section 4, companies by segment). Nothing here is a decision to build pages: tagging, new items and authored guides each need their own yes/no.

## Why these three (demand and coverage check, 2026-10-19)

The question was which companies get the most frontend-interview searches but have no page on competing prep sites.

Demand was measured on 2026-10-19 without absolute volumes: SpyFu returned 403 to our tools and Semrush needs the signed-in browser. Two proxies were used:

- Google autocomplete for about 330 employers with six phrasings (`<company> frontend interview`, `front end interview`, `frontend engineer interview`, `front end developer interview`, `ui engineer interview`, `ui developer interview`), plus YouTube and Bing autocomplete.
- Google Trends, worldwide, monthly from 2016-10 to 2026-10, with each term compared in batches of five against `atlassian frontend interview`. The table gives the sum over the last 24 months relative to Atlassian.

Coverage came from the sitemaps and listings of 15 sites: GreatFrontEnd (guides and blog), frontendinterviewhandbook.com, FrontendLead, BigFrontEnd.dev, devtools.tech, LearnersBucket, frontendgeek, PracHub, techinterview.org, Aced (formerly Exponent), IGotAnOffer, Hello Interview, interviewing.io, Prepfully and Dataford. Together they have a frontend-specific page for 132 companies. Prepfully (920 companies) and Dataford (about 1,055) generate a frontend template for almost any employer, so they are not counted as coverage.

| Company | Trends vs Atlassian, last 24 months | Google autocomplete | YouTube | Frontend pages on competitor sites | Countries with Trends data |
|---|---|---|---|---|---|
| Walmart | 0.80 (one-word `frontend`); 1.7 over the last 12 months | 12 software suggestions | 3 | frontendgeek: 2 user posts; devtools.tech: one "asked in" tag | India, United States (Brunei also flagged, likely noise) |
| NVIDIA | 0.83, all of it within the last 24 months | 4 | 0 | none | United States, Japan |
| Tesla | 0.33 (one-word `frontend`); 0.62 with `front end` | 6 | 0 | none | United States |

For scale, from the same method: Apple 4.07, TikTok 2.01, Uber 0.72, Rippling 0.13 (GreatFrontEnd has a Rippling guide).

Caveats:

- `walmart front end interview` (two words) is polluted by store roles (front end associate, team lead, coach), so Walmart is measured with the one-word spelling.
- NVIDIA's signal may include chip-design searches ("front end design" means logic design), and its autocomplete presence is weak.
- Trends values this close to the threshold flicker between 0 and about 50 per month.
- All company pages together brought 18 clicks in 16 months (Europe shortlist, demand check), so any one company is small in absolute terms.

Strong on autocomplete but at or below the Trends threshold: Agoda (12 suggestions; frontendgeek has 1 post), JPMorgan Chase (17 across the `jp morgan`, `jpmc` and `chase` spellings; frontendgeek has 1 post), Deloitte (11, YouTube 4; no page anywhere), IBM (14; BigFrontEnd.dev tags one question).

## Research rules

The rules are the ones used for the Europe shortlist:

- A question counts only if it is on a page our tools read in full (F) or appears verbatim in a search snippet (S). Unreadable sources are marked U.
- Glassdoor and 1point3acres are snippet-only. Reddit was not attempted.
- Templated pages (Dataford, Prepfully, interviewpal, techprep and similar) are listed as what ranks, never as evidence.
- A report that Taro re-hosts from Glassdoor is counted once.

Exclusions:

- Walmart: store roles; Flipkart, PhonePe and Cleartrip.
- NVIDIA: chip-design "front end" roles.
- Tesla: non-software "front end" meanings.

## Method

Three research agents worked on 2026-10-19, one per company, with about 415 tool calls in total. The coordinating session then checked eight items against their sources (seven quotes and one file) and read eight LeetCode posts the agents had left unread or seen only as snippets. All eight checks matched (see "Verification").

The shared web-search budget (200 calls per turn) ran out near the end, so a few mirrors and two Taro reports were not located (see "Open items").

LeetCode Discuss was read through its GraphQL endpoint. Article-type posts need `query($id: ID!){ ugcArticleDiscussionArticle(topicId: $id){ title content } }`; the argument is typed `ID!`, not `Int!`.

Source ids (W, N, T and the others) are local to this document. Each "Reported questions" bullet ends with its source ids and the report date.

## Walmart

**Verdict.** Moderate depth overall but thin per report.

- **Sources:** 37 sources read in full, 17 snippet-only. Counting mirrors once, about a dozen first-person reports name concrete frontend questions.
- **Where the reports come from:** most of the detail comes from Walmart Global Tech India (Bengaluru, Chennai). US reports (Sunnyvale, Bentonville, often no city) mostly describe the loop format. No frontend report was found for Gurgaon, Hoboken or Sam's Club.
- **Newest:** LeetCode, 2026-05-23 [W31], a pre-interview post that describes the HackerRank Frontend Engineering Assessment from the invitation email. The newest report read in full that lists questions is Taro, Sunnyvale, 2025-04 [W6].
- **Titles:**
  - Postings: "Software Engineer III - UI", "Software Engineer III - Front End" (Sam's Club web), "Senior, Software Engineer - Frontend" or "- UI", "(USA) Senior, Software Engineer (React)", "Staff, Software Engineer".
  - India level codes: IN3 = Software Engineer III, IN4 = Senior.
- **What ranks for `walmart frontend interview questions`** (our search tool, not Google):
  - Five Dataford template pages: Walmart, Walmart Global Tech, Walmart Labs, Walmart Supply Chain, Walmart de México.
  - Then LeetCode 6036136, one Glassdoor review and Prepfully.
  - No editorial guide.

**Loop, India (SDE 3 / UI).**
- The common shape is four rounds [W10, W11; same order in W35 and W42]:
  - DSA, 60 minutes;
  - JavaScript, React and web fundamentals, 60 minutes;
  - hiring manager, 60 minutes;
  - HR, 30 minutes.
- Some SDE-2 frontend roles open with an assessment [W2, W33, W34]. One 2024-10 assessment had three sections: 20 multiple-choice questions on HTML, CSS and JavaScript; 2 easy coding questions in JavaScript only; 10 multiple-choice questions on React or Angular, the candidate's choice [W34].
- One 60-minute online round mixed a two-pointer problem with frontend concepts and output prediction [W9].
- A Chennai full-stack SDE III loop had five rounds [W37, interview 2021-01, posted 2021-08; W14 republishes it]:
  - calendar low-level design;
  - Java and DSA;
  - DSA;
  - JavaScript and DSA with Angular questions;
  - a point-of-sale design with the hiring manager.
- A React Native loop [W12]:
  - a 30-minute call with ES6 output snippets;
  - 75 minutes of JavaScript and React Native with hands-on coding;
  - a frontend architecture round;
  - hiring manager;
  - HR.

**Loop, US.**
- **Karat screen:** about ten minutes of one-line role questions, then 45 minutes of coding [W7, W21].
- **HackerRank:**
  - a one-hour frontend screen in Sunnyvale [W23];
  - two React code challenges [W6];
  - CodePair for a React Native team [W26].
- **2026 assessment** [W31]: a language-agnostic coding problem plus "debugging a React or Angular app, with AI assistance for UI navigation, syntax, and clarification". The recruiter had first said DSA and low-level design.
- **Onsites:**
  - "2 coding rounds, 2 design rounds and 1 behavioral round" [W20];
  - a 45-minute JavaScript coding screen, then coding, system design and team fit [W19];
  - DSA, high-level system design, a UI/JavaScript technical round and a managerial round [W24];
  - "Code with react, debug session, System design and talk with hiring manager" [W25].
- **Team-dependent:** a Staff Frontend AdTech candidate was sent a backend-only interview guide [W22].

### Reported questions: Walmart

**JavaScript fundamentals and output prediction**
- How JavaScript does type conversion internally [W5, 2019-10, SDE-III UI, Bengaluru].
- Closures, `let`/`var`/`const` and the kinds of functions. Then: optimise a heavy recursive operation; the candidate answered with currying [W10, 2024-01, SDE 3 UI].
- Hoisting; closures; "add two numbers using promise"; callback hell with an example; ES6 features in detail [W55, 2022-11, Front end developer].
- Predict the output of given code; JavaScript basics; scope [W9, 2024-11].
- ES6 output snippets on closures, hoisting and object methods; the JavaScript engine; synchronous and asynchronous functions [W12, 2024-11, React Native].
- Closures, currying and hoisting code snippets; `call`, `bind` and `apply` and when to use each [W37/W14, 2021, SDE III full stack, Chennai].
- An async/await and Promise snippet; how JavaScript runs on a single thread [W17, 2021-09, SDE3, Chennai].
- Closure and immediately invoked functions [W16, 2018-09, WalmartLabs].
- `let`, `var` and `const` [W3, 2020-10; W44, 2025-07].
- The detached-method `this` question: `obj = {a: 1, getA: function() { return this.a }}; var get = obj.getA; get()`. What does it print, and how do you prevent `undefined`? [W38, 2016-05, Front End Engineer]
- Closure, memory leaks, execution context [W39].

**Utility functions**
- One function that supports both `sum(a, b, c)` and `sum(a)(b)(c)`; split an array into chunks of a given size [W14/W37].
- Implement throttling. This is a devtools.tech page tagged Walmart, with no report behind it [W27].
- Implement any design pattern in JavaScript [W39].
- "Simple questions from BFE.dev" for a California team; reverse an array. This is a commenter describing their own Walmart interviews [W19, 2024-01].

**React and state**
- Implement `useMemo`. Implement the Context API, then extend it to handle API results. Also: why React, the virtual DOM, GraphQL experience, Next.js experience [W11, 2024-11, SDE 3 UI].
- `useMemo`, `useContext` and `useReducer`. How to avoid re-renders when using `useContext`, and how it removes prop drilling. React design patterns [W10].
- DOM versus virtual DOM; hooks, with most focus on `useEffect` [W9].
- Redux, hooks, Shadow DOM [W2, 2024-11, SDE II Frontend, Bengaluru].
- What `useState`, `useEffect`, `useMemo`, `useCallback`, `useRef` and `useReducer` are for, with snippets [W12].
- A custom timer hook (`useTimer`), listed by devtools.tech as "Asked at these companies: Walmart" [W28].
- Angular: lifecycle, services, component communication [W14/W37]; Angular and React questions [W16].
- Why React instead of Angular; what an event is in React [W15, 2021-03, SDE-2].
- Hooks, higher-order components, the Context API [W39]; React with Redux [W40]; hooks and Jest mocking [W44].
- A React-heavy second round; a first round with a LeetCode medium, "write an API" and React questions [W33, 2024-12, SDE-2 FE, India].
- "Multiple JS, CSS, HTML and react specific questions" in a tech-specific round [W35, 2024-06, SDE3].

**Machine coding and UI builds**
- "Complete two React code challenges on HackerRank. They are not difficult (event listeners) but will consume time." [W6, 2025-04, Senior SWE, Sunnyvale]
- A dropdown component API that works as single-select or multi-select and supports custom children; the interviewer wanted the high-level API. The candidate used compound components [W10].
- HTML and CSS for a simple UI component in VS Code, then a horizontal list component in a React Native playground [W12].
- Build a UI application in React "considering optimization and browser performance", after theory on HTML, CSS, JavaScript and React [W32, 2022-06].
- "Implement accordian using only vanilla JS", in a round with no React questions [W55, 2022-11].
- Debug a React or Angular app, AI assistance allowed (HackerRank assessment) [W31, 2026-05].
- A UI assignment in React or Angular as the first step [W39].
- An expandable folder tree in React [W41, 2017, San Francisco].
- An expense table that updates a bar graph [W52, review not pinned].
- Older take-homes:
  - a React issue browser for `walmartlabs/thorax`; the task is inferred from the code [W29, 2021-03];
  - the Walmart Labs "Store Services Take Home Challenge", a keyword product-search API (Node and Hapi suggested), to which one candidate added a React frontend [W30, gist 2015-07];
  - an intern option: a simple webpage on Typicode APIs [W51, 2022].

**HTML, CSS and accessibility**
- Flexbox; relative and absolute positioning; `z-index` and stacking contexts [W10].
- Block versus inline elements; flexbox [W9].
- Responsive versus adaptive design, and which to prefer [W11].
- The box model; the universal selector; elements versus tags [W15].
- Class versus id [W16].
- "Lot of questions from basic css and html" [W55].
- Specificity, box model, `z-index`, flex [W39].
- "Also they ask about accessibility", from a Walmart-badged Blind user [W18, 2022-01].

**Performance and browser**
- Server-side rendering where the above-the-fold part is server-rendered and the below-the-fold part is a client-rendered React component: how hydration and HTML/JS parsing play out [W10].
- Module federation; performance optimisation in browsers and React [W10].
- Memoization, code splitting, lazy loading, error boundaries, debouncing and throttling [W12].
- How to measure the performance of a React application (hiring manager round) [W11].
- In a system design round [W13, 2025-03, SWE-III]:
  - performance: lazy loading, resource hints, fewer requests through bundling, image compression and WebP, `async`/`defer`, list virtualisation, Lighthouse FCP, LCP and TTI;
  - security: XSS through input sanitising, CSRF through tokens.
- Page-load speed and handling many requests [W53, 2017, Senior UI Developer].

**Frontend system design**
- "Frontend focused system design like - design linkedin chat, design linkedin search auto complete....Also they ask about accessibility", as Walmart-badged advice [W18].
- How React components interact with backend APIs; polling versus WebSockets; API gateways, rate limiting, indexing [W13].
- The dropdown API above [W10].
- A frontend architecture round: React Native upgrade, bridgeless architecture, analytics, CI/CD [W12].
- "Design Uber app" [W15]; TinyURL and a spreadsheet [W4, 2020-12].
- Past projects [W7]; how you would debug frontend issues [W20].
- SSR, caching, hydration and performance metrics [W47].

**DSA in the frontend loop.** Every India loop has at least one DSA round.
- A variant of Search in Rotated Sorted Array, Valid Parentheses, and a stack-sorting problem [W10].
- First Missing Positive, Valid Parentheses, Two Sum [W11].
- A two-pointer easy-medium problem [W9].
- Predict the Winner, and a Meeting Rooms II variant [W8, 2023-11, IN3/IN4].
- Valid Anagram, Number of Islands, Best Time to Buy and Sell Stock [W55, 2022-11].
- A LeetCode medium in each of the two technical rounds [W33].
- Valid Parentheses [W3]; phone-digit words [W5]; a BST question [W1, 2024-01, Staff Front End, US].
- Next Greater Element I, Add One to Number, Find Median from Data Stream, Minimum Number of Taps, a zigzag diagonal traversal; split an array into chunks [W37/W14].
- Circular linked-list deletion and a queue [W15].
- A stack-and-counting problem [W26]; a hard recursion problem [W20]; DP and sliding window [W35]; the sum of leaf nodes [W39]; LeetCode medium [W18, W32].

**Behavioural and managerial**
- Why Walmart; innovation in your projects; testing types; CI/CD; the PR review process [W11].
- Reason for leaving; the most challenging task; strengths and weaknesses [W10].
- How a frontend engineer works between the designer and the backend engineer; taking tasks from a product manager; Agile [W12].
- STAR answers on company principles [W7].
- A full day at work; the frontend architecture of the current project; why leaving [W55, manager round].
- OOP, Java, React and DBMS in a hiring-manager round; the rejection cited DBMS knowledge [W33].
- "How to promote unsold products", worked on a whiteboard [W16].
- Leadership principles [W32].

### Sources: Walmart

| id | URL | publisher, date | role, location | access | content |
|---|---|---|---|---|---|
| W1 | https://www.jointaro.com/interviews/companies/walmart/experiences/staff-front-end-engineer-united-states-january-1-2024-no-offer-negative-d17f5e0d/ | Taro, 2024-01 | Staff Front End Engineer, US | F | BST question after an intro |
| W2 | https://www.jointaro.com/interviews/companies/walmart/experiences/software-development-engineer-ii-frontend-bengaluru-november-1-2024-no-offer-neutral-3a8dbb51/ | Taro, 2024-11 | SDE II Frontend, Bengaluru | F | JS assessment with MCQs; two technical rounds; Redux, hooks, Shadow DOM |
| W3 | https://www.jointaro.com/interviews/companies/walmart/experiences/front-end-developer-india-october-19-2020-no-offer-neutral-93bed894/ | Taro, 2020-10 | Front End Developer, India | F | Valid Parentheses; `let`/`var`/`const` |
| W4 | https://www.jointaro.com/interviews/companies/walmart/experiences/front-end-developer-toronto-on-december-1-2020-no-offer-negative-83c4b23e/ | Taro (Glassdoor mirror), 2020-12 | Front End Developer, tagged Toronto (wording suggests India) | F | Basic UI questions; TinyURL and spreadsheet design |
| W5 | https://www.jointaro.com/interviews/companies/walmart/experiences/sde-iii-bengaluru-october-1-2019-no-offer-negative-22235130/ | Taro, 2019-10 | SDE-III (UI opening), Bengaluru | F | JS type conversion; phone-digit words |
| W6 | https://www.jointaro.com/interviews/companies/walmart/experiences/senior-software-engineer-sunnyvale-ca-april-1-2025-no-offer-negative-6350f1a2/ | Taro, 2025-04 | Senior SWE, Sunnyvale | F | Two React challenges on HackerRank; system design final |
| W7 | https://www.jointaro.com/interviews/companies/walmart/experiences/software-engineer-united-states-july-1-2022-declined-offer-positive-32d8d783/ | Taro, 2022-07 | Software Engineer (React), US | F | Karat with short-answer frontend questions; system design on past projects; behavioural |
| W8 | https://www.frontendgeek.com/interview-experience/frontend-interview-experience-at-walmart-india-in3in4-ghosted---5b172313-fbe2-4960-908d-7c446a166ec2 | frontendgeek (tagged LeetCode), 2023-11 | SDE3 IN3/IN4, Bengaluru | F | DSA round only |
| W9 | https://leetcode.com/discuss/post/6036136/ (also on frontendgeek) | LeetCode, 2024-11 | Frontend engineer, Bengaluru | F | Two-pointer problem, DOM vs virtual DOM, `useEffect`, flexbox, output prediction |
| W10 | https://jaynil-gaglani.hashnode.dev/frontend-interview-experience-at-walmart | Hashnode, 2024-01 | SDE 3 UI, India | F, re-checked | Currying, hooks, SSR and hydration, dropdown API, stacking contexts, module federation |
| W11 | https://medium.com/@phalgun99/my-interview-experience-at-walmart-global-tech-for-the-software-engineer-3-ui-position-9751c81988ee | Medium via RSS, 2024-11 | SDE 3 UI, India | F, re-checked | Implement `useMemo` and the Context API; responsive vs adaptive; First Missing Positive |
| W12 | https://medium.com/@poonkuzhali_98336/walmart-global-tech-interview-experience-cdc3509408ea | Medium via RSS, 2024-12 | SWE (React Native), India | F | Output snippets; hands-on HTML/CSS; architecture round |
| W13 | https://dev.to/kriti_pare/interview-experience-at-walmart-global-tech-for-swe-iii-position-k95 | dev.to, 2025-03 | SWE-III | F | React-to-API system design, polling vs WebSockets, performance, XSS/CSRF |
| W14 | https://roundz.substack.com/p/interview-experience-79-walmart-sde3 | Roundz (Substack), published 2025-05 | SDE III full stack, Chennai | F | Probable republication of W37: currying, `sum(a)(b)(c)`, `call`/`bind`/`apply`, chunking, Angular |
| W15 | https://www.naukri.com/code360/interview-experiences/walmart/walmart-interview-experience-mar-2021-exp-0-2-years | Code360, 2021-03 | SDE-2, Bengaluru | F | React/CSS/HTML theory; "Design Uber app" |
| W16 | https://www.geeksforgeeks.org/walmart-engineer-3-interview-experience/ | GeeksforGeeks, 2018-09 | Engineer 3 full stack, WalmartLabs Bengaluru | F | UI round: closure, IIFE, class vs id |
| W17 | https://www.geeksforgeeks.org/interview-experiences/walmart-global-tech-interview-experience-for-sde3/ | GeeksforGeeks, 2021-09 | SDE3, Chennai | F | Async/await and Promise; single thread |
| W18 | https://www.teamblind.com/post/Walmart-Interview-for-Frontend-software-engineer-III-TQhXf1X5 | Blind, 2022-01 | Frontend SWE III, US | F | Walmart-badged advice: LinkedIn chat and autocomplete design, accessibility |
| W19 | https://www.teamblind.com/post/upcoming-walmart-sr-software-engineer-frontend-interview-gkvn233z | Blind, 2024-01 | Sr SWE Frontend, US | F | Loop from the recruiter; a commenter's BFE.dev-style questions |
| W20 | https://www.teamblind.com/post/walmart-global-tech-software-engineer-lll-front-end-k8ewxjrm | Blind, 2023-04 | SWE III front end, Sunnyvale | F | 2 coding, 2 design, 1 behavioural |
| W21 | https://www.teamblind.com/post/karat-interview-for-walmart-m8ayatus | Blind, 2024-09 | Senior SWE | F | Karat format |
| W22 | https://www.teamblind.com/post/walmart-staff-frontend-adtech-ny4opgz7 | Blind, 2022-07 | Staff Frontend, AdTech | F | Backend-only guide; prepare full stack, algorithms and frontend |
| W23 | https://www.teamblind.com/post/walmart-senior-frontend-engineer-m5munrjx | Blind, 2024-06 | Senior Frontend, Sunnyvale | F | One-hour HackerRank interview |
| W24 | https://www.teamblind.com/post/walmart-senior-software-engineer-interview-experience-j3hexss7 | Blind, 2024-07 | Senior SWE | F | DSA, high-level design, UI/JavaScript round, managerial |
| W25 | https://www.teamblind.com/post/Have-an-interview-with-walmart-SWE3-2-4-YOEneed-advice-0JOeTkW6 | Blind, 2023-10 | SWE3, frontend-heavy | F | React coding, debugging, system design, hiring manager |
| W26 | https://www.teamblind.com/post/walmart-interview-with-hackerrank-codepairs-7mck8u4m | Blind, 2023-11 | React Native team | F | HackerRank CodePair; stack-and-counting problem |
| W27 | https://devtools.tech/questions/s/implement-throttling-in-javascript-or-walmart-frontend-interview-question---qid---mLrwAyug9CgrVGbs6OYF | devtools.tech, undated | publisher tag | F (title only) | Throttling tagged Walmart |
| W28 | https://devtools.tech/questions/s/how-to-build-a-custom-timer-hook-in-react-js-or-usetimer-or-javascript-interview-question---qid---H5KlkIeowa1LrIn1mSN5 | devtools.tech, undated | publisher tag | F (tag only) | `useTimer` hook |
| W29 | https://github.com/sakib2424/Walmart | GitHub, 2021-03 | "SWE interview project for Walmart" | F | React issue browser (task inferred) |
| W30 | https://gist.github.com/daniyalzade/8e32cd266aebd6d2ce35 and https://github.com/devlinjunker/app.walmart.fend | GitHub, 2015-07 and 2018-09 | Walmart Labs take-home | F | Product-search API; React frontend added by one candidate |
| W31 | https://leetcode.com/discuss/post/8288813/walmart-interview-for-frontend-role-by-a-s7fk/ | LeetCode, 2026-05-23 | Frontend Engineer | F (GraphQL, coordinating session) | HackerRank Frontend Engineering Assessment |
| W32 | https://leetcode.com/discuss/interview-experience/2105625/ | LeetCode, 2022-06-03 | Frontend Engineer, offer declined | F (GraphQL, coordinating session) | DSA + basics; build a React UI with performance in mind; leadership principles |
| W33 | https://leetcode.com/discuss/interview-experience/6156237/Walmart-SDE-2-or-Front-end/ | LeetCode, 2024-12-17 | SDE-2 FE, India | F (GraphQL) | 2 easy JS problems and 10 MCQs; LC medium plus an API and React; React-heavy round; HM on OOP, Java, React, DBMS; probably the W2 candidate |
| W34 | https://leetcode.com/discuss/interview-experience/5988869/ | LeetCode, 2024-10-31 | Frontend OA, India | F (GraphQL) | 20 HTML/CSS/JS MCQs, 2 easy JS problems, 10 React or Angular MCQs |
| W35 | https://leetcode.com/discuss/interview-experience/5331800/SDE3-at-walmart/ | LeetCode, 2024-06-18 | SDE3, selected | F (GraphQL) | DP and sliding window; JS/CSS/HTML/React round; HM on past projects |
| W37 | https://leetcode.com/discuss/interview-experience/1436043/walmart-global-tech-india-sde-iii-chennai-august-2021 | LeetCode, posted 2021-08-31, interview 2021-01 | SDE III, Chennai, offer | F (GraphQL) | Calendar LLD; Java and DSA; JS and DSA with Angular; POS design; original of W14 |
| W38 | https://www.glassdoor.com/Interview/Given-a-JS-object-obj-a-1-getA-function-return-this-a-var-get-obj-getA-console-log-get-what-will-i-QTN_1517430.htm | Glassdoor, 2016-05 | Front End Engineer | S | Detached-method `this` question |
| W39 | https://www.glassdoor.com/Interview/Walmart-Global-Tech-Front-End-Developer-Interview-Questions-EI_IE3293060.0,19_KO20,39.htm | Glassdoor | Front End Developer, Global Tech | S | UI assignment; JS, React and CSS fragments |
| W40 | https://www.glassdoor.com/Interview/Walmart-Front-End-Developer-Interview-Questions-EI_IE715.0,7_KO8,27.htm | Glassdoor | Front End Developer | S | React, Redux; JS basics over frameworks |
| W41 | https://www.glassdoor.ie/Interview/Walmart-Interview-E715-RVW16294697.htm | Glassdoor, 2017 | React position, San Francisco | S | Expandable folder tree |
| W42 | https://www.glassdoor.fr/Entretien/Walmart-Entretien-E715-RVW98907814.htm | Glassdoor, 2024-09 | SDE-3, Bengaluru | S | DSA, then design with frontend questions |
| W43 | https://static.glassdoor.ie/Interview/Walmart-Interview-E715-RVW97801448.htm | Glassdoor, 2024-10 | Bentonville | S | Two-hour final; JS, React, Redux, hooks |
| W44 | https://www.glassdoor.es/Entrevista/Walmart-Global-Tech-Entrevista-E3293060-RVW91152949.htm | Glassdoor, 2025-07 | SWE III, Bengaluru | S | `let`/`var`/`const`; hooks; Jest mocking |
| W45 | https://www.glassdoor.com/Interview/Walmart-Global-Tech-Software-Development-Engineer-III-Interview-Questions-EI_IE3293060.0,19_KO20,53.htm | Glassdoor, about 2021 | SDE III, Bengaluru | S | JavaScript and DS first round |
| W46 | https://www.1point3acres.com/interview/thread/1041731 | 1point3acres | walmartlabs Frontend Engineer onsite | S | Algorithms plus a React/JS trivia round |
| W47 | https://javascript.plainenglish.io/walmart-sde-3-frontend-interview-experience-f9e7174c6cfe | Medium, member-only | SDE-3 Frontend, India | S | JS problem solving and web system design |
| W51 | https://leetcode.com/discuss/interview-experience/1921985/walmart-global-tech-swe-intern-us-all-locations-offer | LeetCode, 2022 | SWE III intern, US | S | Take-home with a frontend option |
| W52 | Glassdoor review not pinned; likely https://www.glassdoor.com.hk/Interview/Walmart-Interview-E715-RVW30132371.htm | Glassdoor | not shown | S | Expense table with a bar graph |
| W53 | https://www.glassdoor.co.in/Interview/Walmart-Senior-UI-Developer-Interview-Questions-EI_IE715.0,7_KO8,27.htm | Glassdoor, 2017 | Senior UI Developer, Bengaluru | S | Page-load speed |
| W55 | https://leetcode.com/discuss/interview-experience/2774667/ | LeetCode, 2022-11-03 | Front end developer (multi-company post) | F (GraphQL) | Walmart section: three LeetCode problems; HTML/CSS, hoisting, closures, promises, callback hell, ES6; vanilla-JS accordion; manager round on frontend architecture; offer stage |

W48 (a Sam's Club Medium post), W49 (Fishbowl post titles), W50 (a Glassdoor mirror check) and W54 (job-posting titles) carry no questions and are not tabled.

Mirrors:
- W9 is LeetCode 6036136 republished on frontendgeek.
- W14 is probably W37 republished.
- W2 and W33 are probably the same candidate.
- W4 mirrors a Glassdoor review.

Search summaries misattributed four items, all caught by reading the page:
- A Blind machine-coding list (tic-tac-toe, infinite scroll, Giphy) came from a Walmart-badged user, who then wrote "No. Gojek, Atlassian, Razorpay and few other companies".
- "React app building / vanilla js" was a LinkedIn user's guess on a backend thread.
- A dev.to "all frontend questions" post never mentions Walmart.
- enginebogie 715 has a frontend URL slug but is an Android interview.
- LeetCode 7185262 is a multi-company post. Its "React hooks, context vs Redux, React 19 new features" round belongs to NetApp; the Walmart part is a Java and Spring Boot senior loop (DSA, notification-system design, low-level design, hiring manager). A snippet-based Walmart item built on it was removed after the full read.

## NVIDIA

**Verdict.** Thin. After merging mirrors, 8 distinct reports carry a concrete frontend question or task: 4 are Glassdoor snippets and 3 are internships.
- Three Blind threads asking about the NVIDIA frontend loop got no answer. In one, an NVIDIA-badged user replies "we have a frontend team??" [N17].
- No NVIDIA frontend report exists on LeetCode Discuss, PracHub, GeeksforGeeks, Code360, Medium, dev.to, Hashnode, Substack, GitHub, LinkedIn, 1point3acres or Nowcoder.
- Newest: Blind 2026-06 [N15], "SSE Cloud and Frontend" at GeForce NOW in India: a hiring-manager screen and three virtual rounds, no questions. Newest with a concrete task: Taro internship 2025-04 [N8]. Newest full-time report with questions: Glassdoor 2024-01 [N1].
- **Never reported:** WebGL, Three.js, Omniverse, rendering performance, accessibility, utility functions such as debounce or flatten, and a confirmed frontend system design prompt.
- Postings name these teams: Marketplace (React, Next.js, TypeScript), Profiling Services visualisation, GeForce NOW content tools and Hardware Infrastructure; one posting is in Warsaw [N30].
- **What ranks:** Dataford's template first, then Glassdoor reviews. The templates (Dataford, jobrise, resumeinminutes, interviews.chat, Prepfully) carry prompts that no report supports: array flattening, SSR versus CSR for dashboards, GPU-cluster dashboards.

**Official process** [N21, re-checked]:
- Phone interviews first, then virtual or in-person rounds. "You will complete an onsite, in-person interview at our office before you can be considered for an offer."
- Interviews "usually last 30-60 minutes each".
- Coding is "usually done using Hackerrank".
- "The use of unapproved outside tools, such as ChatGPT, during the interview will result in the disqualification of candidacy."

**Reported loops**
- **Senior Frontend Engineer, interviewed 2024-01** [N1]:
  - recruiter call, then a technical screen with a same-level engineer;
  - virtual onsite of three technical rounds (HTML/CSS, JavaScript, React) and a manager interview;
  - the first two rounds build one page;
  - the React round ran on HackerRank, which froze when developer tools were open;
  - five months end to end.
- **Frontend Software Engineer, 2020-12, offer** [N3, Glassdoor original N2]:
  - JavaScript concepts with a senior engineer;
  - a coding phone screen: JavaScript problems, then HTML/JS/CSS;
  - a virtual onsite where "each subsequent round was based on the previous one".
- **Senior Software Engineer, San Diego, 2022-11** [N4]: frontend questions only, no algorithm rounds; vanilla JavaScript and React in online IDEs; exercises longer than the time allowed.
- **Senior Software Engineer, NVIDIA IT, San Francisco, 2022-09** [N5]: six rounds of coding and manager interviews.
- **Web Applications Development Engineer, about 2020-12** [N12]: three 45-minute interviews per team after exploratory calls.

### Reported questions: NVIDIA

**JavaScript**
- "Closures, bind, floating-point pitfalls when doing math with JS" [N3, 2020-12].
- "A set of JavaScript problems" in the phone screen; the problems are not listed [N3].
- "Vanilla Javascript and React questions using online IDEs" [N4, 2022-11].
- "Easy JavaScript questions" [N5, 2022-09].
- Closures and hoisting; Node.js, Require.js, Less/SASS [N6, 2015-01, Front End Engineer, Reading, UK].

**React**
- "Implement a complex component with React." [N3, 2020-12]
- "Given a React app accessing an external API, complete some steps to add small pieces of functionality and fix parts of the app that aren't properly using the API." [N1, 2024-01]
- Build a React app in TypeScript, JavaScript and CSS inside a provided project, owning the app logic and its structure [N8, 2025-04, internship].
- "Describe how hooks in React work." [N10, 2021-09, internship]

**UI builds and DOM**
- "Given a design of a page, recreate the page in HTML and CSS", then add JavaScript behaviour to the same page [N1].
- "Pure JS DOM implementation on an existing project" [N3].
- An internship "frontend case study" and a HackerRank-type API question; the wording is generic [N7, 2025-09].

**System design**
- "They focused more system design questions", for a frontend role on the ML/AI teams with an offer. The thread never says whether this was frontend design [N13, 2023-11].
- An NVIDIA-badged user's prep hint (advice, not a reported question): think about current ML APIs and how to use them in an application [N14, 2024-04].

**DSA**
- None in the 2022 San Diego frontend loop [N4].
- A 2013 UX internship asked a character sort and a coin-flip-based uniform point in a circle [N23].

**Behavioural**
- A tough behavioural round [N3]; previous work experience [N10]; "Tell me a bit more about yourself" [N8].
- The manager round was mostly the candidate's own questions [N1].

### Sources: NVIDIA

| id | URL | publisher, date | role, location | access | content |
|---|---|---|---|---|---|
| N1 | https://www.glassdoor.ie/Interview/NVIDIA-Interview-E7633-RVW85100795.htm | Glassdoor, interview 2024-01 | Senior Frontend Engineer | S | HTML/CSS rebuild, JS on the same page, React plus an external API on HackerRank |
| N2 | https://www.glassdoor.co.in/Interview/NVIDIA-Interview-E7633-RVW40490515.htm | Glassdoor, 2021-01 | Frontend Software Engineer | S | Original of N3 |
| N3 | https://www.jointaro.com/interviews/companies/nvidia/experiences/frontend-software-engineer-united-states-december-1-2020-accepted-offer-positive-ac4574c4/ | Taro, 2020-12 | Frontend Software Engineer, US, offer | F, re-checked | Closures, `bind`, floating point; chained onsite; complex React component |
| N4 | https://www.glassdoor.co.uk/Interview/NVIDIA-Interview-E7633-RVW71101082.htm | Glassdoor, 2022-11 | Senior SWE, San Diego | S | Frontend-only loop in online IDEs |
| N5 | https://www.jointaro.com/interviews/companies/nvidia/experiences/senior-software-engineer-san-francisco-ca-september-27-2022-no-offer-negative-d23b8847/ | Taro, 2022-09 | Senior SWE, NVIDIA IT, San Francisco | F | Six rounds; easy JavaScript |
| N6 | https://www.glassdoor.co.in/Interview/NVIDIA-Interview-E7633-RVW7436787.htm | Glassdoor, 2015-01 | Front End Engineer, Reading, UK | S | Closures, hoisting, Require.js, Less/SASS |
| N7 | https://www.glassdoor.fr/Entretien/NVIDIA-Entretien-E7633-RVW100351129.htm | Glassdoor, 2025-09 | Internship | S | Generic frontend case study; API question |
| N8 | https://www.jointaro.com/interviews/companies/nvidia/experiences/software-internship-california-city-ca-april-24-2025-no-offer-negative-7276dc55/ | Taro (Glassdoor mirror RVW96905510), 2025-04 | Software Internship, California | F | Live React build in a provided project |
| N10 | https://www.jointaro.com/interviews/companies/nvidia/experiences/software-engineer-intern-united-states-september-28-2021-accepted-offer-positive-8a6828bb/ | Taro (Glassdoor mirror RVW53215420), 2021-09 | SWE Intern, US, offer | F | How React hooks work |
| N12 | https://www.glassdoor.sg/Interview/NVIDIA-Interview-E7633-RVW41458998.htm | Glassdoor, about 2020-12 | Web Applications Development Engineer | S | Three 45-minute interviews per team |
| N13 | https://www.teamblind.com/post/frontend-web-dev-offer-from-nvidia-8xnsvuoo | Blind, 2023-11 | Frontend, ML/AI teams, offer | F | "They focused more system design questions" |
| N14 | https://www.teamblind.com/post/SSH8Bs5v | Blind, 2024-04 | Senior frontend, ML/AI | F | A commenter says the coding was frontend problems; ML API hint |
| N15 | https://www.teamblind.com/post/did-anyone-give-interviews-for-sse-cloud-and-frontend-in-nvidia-ricgaksg | Blind, 2026-06 | SSE Cloud and Frontend, GeForce NOW, India | F (3 of 7 replies need a login) | Loop shape only |
| N16-N18 | https://www.teamblind.com/post/nvidia-interviews-fmgg0nn0 ; https://www.teamblind.com/post/nvidia-frontend-onsite-1qqnske6 ; https://www.teamblind.com/post/nvidia-frontend-onsite-8qezpj1h | Blind, 2022-03 to 2023-08 | UI developer, frontend onsite | F | Questions with no useful answers |
| N21 | https://www.nvidia.com/en-us/about-nvidia/careers/how-we-hire/ | NVIDIA, official | All roles | F, re-checked | Process, HackerRank, ChatGPT ban |
| N23 | https://www.jointaro.com/interviews/companies/nvidia/experiences/user-experience-software-engineer-internship-davis-ca-february-1-2013-no-offer-negative-f4dde455/ | Taro, 2013-02 | UX SWE Internship, Davis | F | Algorithmic questions only |
| N29 | https://prachub.com/companies/nvidia | PracHub, 2026-10 | n/a | F | 106 NVIDIA questions, none frontend |
| N30 | e.g. https://nvidia.wd5.myworkdayjobs.com/en-US/NVIDIAExternalCareerSite/job/Senior-Frontend-Engineer--NVIDIA-Marketplace_JR2021196 | NVIDIA postings, 2025-2026 | Titles and teams | S | Frontend teams named in postings |

Search summaries got four things wrong:
- They attributed an "array flattening" phone screen to N2; neither N2 nor N3 contains it.
- They dated N4 as 2026; it is 2022-11.
- They dated the hooks question as 2026; it is 2021-09.
- They credited a TikTok review to NVIDIA.

## Tesla

**Verdict.** Moderate and fragmented, with the best primary material of the three:
- Taro, 10 reports read in full.
- Blind, 10 frontend posts.
- One LeetCode full-stack report and one Code360 report.
- Two take-home briefs that candidates published on GitHub.

Frameworks:
- React dominates.
- Angular appears in a 2024 Fremont loop and in a Codility screen.
- Vue appears in one Shanghai report.

Dates:
- Newest report read in full: Taro, Front End Developer, US, 2025-11 [T3].
- Newest loop mention: Blind, 2026-05 [B8], four rounds passed with no team match.
- Take-home repos were created as late as 2026-06.

Teams named:
- Digital Experience (tesla.com)
- Energy: UI, Service Engineering, Sales Engineering
- Autopilot: full stack, AI tooling
- Creative Technology: vehicle UI prototyping
- Vehicle UI

**What ranks for `tesla frontend interview questions`:**
- Dataford and Prepfully templates.
- A Dataford page for a different, Brazilian company named Tesla.
- Glassdoor reviews.
- FrontendAtlas does not appear.

**Loop**
- **Recruiter call** first.
- **Online assessment, often Codility:**
  - "2 hrs, 5 questions" [T5, 2022-01];
  - for a frontend SWE [B4, 2023-01];
  - in Digital Experience after the phone screen [B3, 2023-02].
- **Other assessments:**
  - three hours with HTML/CSS, a React like button and a string puzzle [T2, 2021];
  - three questions in 150 minutes, one of them a written question on a pull-request disagreement [A3, 2021-11];
  - a React assessment with a counter and tabs [G4, Beijing, 2023-06].
- **Screens:**
  - React questions about the take-home plus a LeetCode easy [B2, 2022-05];
  - a one-hour phone interview [T5];
  - a JavaScript, HTML and React video round with a DSA question [T2];
  - hand-write `JSON.stringify` [A2, 2021-05].
- **Take-homes are team-specific** [B14]:
  - Energy site layout [H1, H2];
  - Creative Technology gear shifter [H3, H4];
  - a React take-home [B2];
  - a take-home followed by a three-hour panel with a frontend engineer, a UX designer, a backend engineer, a PM and the hiring manager [G7].
- **Onsites, three to five rounds of about 45 minutes:**
  - 2 of 3 coding rounds frontend-focused, plus DSA, PM and hiring manager [B1, 2020-06, Chicago];
  - algorithm, system design (shared component, API), React, behavioural [T6, 2020-12, Fremont];
  - Angular, TypeScript/JavaScript, system design [T4, 2024-01, Fremont];
  - full-stack Autopilot new grad: a 45-minute frontend round (a React component styled with CSS), behavioural, Python backend, DSA, closing behavioural [L1, 2022-10];
  - SDE-1: five 45-minute interviews, including a web quiz on cookies and CSS declarations [C1, 2020-11].
- **Interns:**
  - one team-dependent round [T7];
  - a React round, then a system design final [T9];
  - React, CSS and JavaScript fundamentals plus UI component design [T8];
  - 45 minutes, half behavioural [B7].

### Reported questions: Tesla

**JavaScript and TypeScript**
- "Basic JS questions and implement a search bar" [T1, 2025-10, Amsterdam].
- JavaScript, HTML and React questions [T2, 2021-01].
- "The second round focuses on TypeScript and JavaScript." [T4, 2024-01, Fremont]
- "const var let difference hoisting closures security build tools" [G6].
- A concepts round with no coding: web security and React basics [A1, 2021].
- A web quiz on "cookies, CSS declaration etc." [C1, 2020-11].

**Utility functions**
- Hand-write `JSON.stringify`, after asking which value types to support [A2, 2021-05].
- A file labelled "TeslaRound1" [H5, 2025-08, re-checked]:
  - shallow versus deep copy of a nested object;
  - remove duplicates by `id` and sort;
  - mask sensitive keys of an object;
  - promise-returning functions combined with the masker as a callback.

**React**
- A like button (assessment) [T2].
- A search bar in a live React session [T1].
- A React app that calls an API and renders an autocomplete list, with debounce and other optimisations discussed [T7, 2025-03, internship].
- "Using React Context, fetch photos and render them with the appropriate theme contexts." [T5, 2022-01, Los Angeles]
- "Implement a basic React component, style it with CSS". The candidate was rejected on CSS depth [L1, 2022-10].
- React questions about the take-home [B2].
- A React round [T6, T9, G6].
- A deep dive on a React and Redux project [G4].
- React and Vue basics [G5, Shanghai].

**Angular**
- "The first round will cover all concepts about Angular, including a coding test." [T4, 2024-01, Fremont, re-checked]
- Codility with "4 questions on Angular, sql, .net and java" [G10].
- Angular, HTML and CSS appear on an SDE-1's prep list [C1].

**UI builds and take-homes**
- **Energy Service Engineering site layout** [H1]. The brief is a PDF in a candidate repo, created 2023-08 and modified 2026-02; it is summarised here, not reproduced.
  - Users enter how many of four battery types they want, plus transformers (one transformer per two batteries).
  - The UI shows the budget, land size and energy, and generates a site layout no wider than 100 ft.
  - Sessions must survive cache clears.
  - The app runs with one command on `localhost:8000` and is hosted.
  - Stack: React with JavaScript or TypeScript and a Go, Node or Python backend. Tests, TypeScript or an Electron app are a plus.
  - Repetition [H2]: 22 independent repos build it, created from 2023-06 to 2026-06; 14 of them name Tesla. An older variant uses one transformer per four devices and calls itself a full-stack Energy Sales Engineering take-home.
- **Creative Technology internship "UI Gear Shifter"** [H3, H4]. The 2025 brief is marked confidential by Tesla, so it is only summarised:
  - a browser prototype that switches Park, Drive and Reverse with a swipe or tap-and-hold instead of taps;
  - bonus tasks: a 3D scene, and a WebSocket command.
- **Smaller builds:**
  - a login form; replace `div`s with semantic HTML5 elements; position boxes with CSS [T5];
  - "frontend data extraction and mock UI building" [T3, 2025-11];
  - "Design user table" [T8];
  - a page that adds items to a list and displays them [G5];
  - a 2021 React and Flask take-home: map icons, configuration settings in a local database, real-time data over WebSockets [H7].

**HTML, CSS and accessibility**
- An HTML and CSS assessment task [T2].
- Semantic HTML5; CSS positioning; "Calculate the contrast between certain colors." [T5, re-checked]
- CSS depth was the stated rejection reason [L1].
- "HTML, CSS & JavaScript at an advanced level", given as advice [B2].

**Performance and browser**
- Debounce and other optimisations for the autocomplete [T7].
- Web security [A1].

**Frontend system design**
- "System design (shared component, API, technologies that could be used to build the application)" [T6, 2020-12].
- "The design of a car rental company" [T4, 2024-01, re-checked].
- "Design movements of Model X wings dancing" [T9, 2024-11, internship].
- System design for UI components; design a user table [T8, 2025-01].
- A final presentation round [G6].

**DSA in the frontend loop**
- Find duplicate numbers; a string puzzle [T2].
- A card game with a deque [T3].
- A binary-search medium [T7].
- A LeetCode easy [B2].
- Linked-list intersection, bucket sort with two pointers, Python dictionary problems [L1].
- Consecutive elements, rotate an array, count ways to reach the n-th stair [C1].

**Behavioural**
- Working under pressure across several projects [T6].
- Past projects [T3]; a resume deep dive [T7].
- Why Tesla, and whether the candidate accepts a busy work culture [L1].
- Replying to a colleague who disagrees with your pull request [A3].
- A written "if you had 3 mins with Elon" answer after the loop. This comes from a commenter whose role is not stated [B4].

### Sources: Tesla

| id | URL | publisher, date | role, location | access | content |
|---|---|---|---|---|---|
| T1 | https://www.jointaro.com/interviews/companies/tesla/experiences/frontend-developer-october-15-2025-no-offer-positive-3c909dee/ | Taro (Glassdoor mirror RVW100676086), 2025-10 | Frontend Developer, Amsterdam | F | React live coding; search bar |
| T2 | https://www.jointaro.com/interviews/companies/tesla/experiences/frontend-developer-san-francisco-ca-january-1-2021-no-offer-positive-8db5ee50/ | Taro (Glassdoor mirror RVW41771461), 2021-01 | Frontend Developer, San Francisco | F | Three-hour assessment; like button; video round |
| T3 | https://www.jointaro.com/interviews/companies/tesla/experiences/front-end-developer-united-states-november-17-2025-no-offer-positive-868af7da/ | Taro, 2025-11 | Front End Developer, US | F | Deque card game; data extraction and mock UI |
| T4 | https://www.jointaro.com/interviews/companies/tesla/experiences/front-end-developer-fremont-ca-january-1-2024-no-offer-neutral-9e5d4e3f/ | Taro, 2024-01 | Front End Developer, Fremont | F, re-checked | Angular, TS/JS, car-rental design |
| T5 | https://www.jointaro.com/interviews/companies/tesla/experiences/front-end-developer-los-angeles-ca-january-1-2022-no-offer-negative-eadce28f/ | Taro, 2022-01 | Front End Developer, Los Angeles | F, re-checked | Codility; HTML5, CSS, login form, React Context, contrast |
| T6 | https://www.jointaro.com/interviews/companies/tesla/experiences/front-end-developer-fremont-ca-december-1-2020-no-offer-positive-5152922f/ | Taro, 2020-12 | Front End Developer, Fremont | F | Algorithm, system design, React, behavioural |
| T7 | https://www.jointaro.com/interviews/companies/tesla/experiences/software-engineerinternship-fremont-ca-march-5-2025-accepted-offer-positive-461baf2a/ | Taro, 2025-03 | SWE internship (frontend), Fremont, offer | F | React autocomplete with an API and debounce |
| T8 | https://www.jointaro.com/interviews/companies/tesla/experiences/software-engineerinternship-fremont-ca-january-7-2025-accepted-offer-neutral-2d53a629/ | Taro, 2025-01 | SWE internship, Digital Experience, offer | F | React/CSS/JS; UI component design; user table |
| T9 | https://www.jointaro.com/interviews/companies/tesla/experiences/software-engineerinternship-palo-alto-ca-november-30-2024-accepted-offer-positive-5f2e19b5/ | Taro, 2024-11 | SWE internship, Palo Alto, offer | F | React round; Model X wings design |
| B1 | https://www.teamblind.com/post/tesla-frontend-onsite-bvg7rws6 | Blind, 2020-06 | Frontend engineer, Chicago | F | Onsite shape |
| B2 | https://www.teamblind.com/post/Tesla-Frontend-Interview-SbEAx1rM | Blind, 2022-05 | Frontend engineer | F | Take-home review; LeetCode easy |
| B3 | https://www.teamblind.com/post/Tesla-front-end-software-engineer-interview-PfuGrTKB | Blind, 2023-02 | Front end SWE, Digital Experiences | F | Phone screen, then Codility |
| B4 | https://www.teamblind.com/post/tesla-codility-assessment-for-frontend-software-engineer-pvjhqzke | Blind, 2023-01 | Frontend SWE | F | Codility; "3 mins with Elon" comment |
| B7 | https://www.teamblind.com/post/tesla-frontendmobile-swe-intern-interview-tips-pz6gagjy | Blind, 2025-02 | Frontend/Mobile SWE intern | F | 45 minutes, half behavioural |
| B8 | https://www.teamblind.com/post/onsite-experience-8-companies-in-the-past-6-months-0-offers-1niasf5x | Blind, 2026-05 | Frontend-focused engineer | F | Four rounds, no team match |
| B14 | https://www.teamblind.com/post/tesla-take-home-pjgtyeax | Blind, 2023-08 | General | F | Take-homes are team-specific |
| L1 | https://leetcode.com/discuss/interview-experience/2715209/ | LeetCode, 2022-10 | Full Stack (Autopilot), new grad, Palo Alto | F | React component plus CSS; Python; DSA |
| C1 | https://www.naukri.com/code360/interview-experiences/tesla/interview-experience-nov-2020-exp-0-2-years-2-4465 | Code360, 2020-11 | SDE-1, US | F | Web quiz on cookies and CSS |
| G4 | https://www.glassdoor.com.ar/Entrevista/Tesla-Entrevista-E43129-RVW77210049.htm | Glassdoor, 2023-06 | Front-end, Beijing | S | React assessment (counter, tabs); Redux |
| G5 | https://www.glassdoor.ca/Interview/Tesla-Interview-E43129-RVW102612160.htm | Glassdoor, possibly 2026-02 | Frontend, Shanghai | S | React and Vue basics; add-to-list page |
| G6 | https://www.glassdoor.ca/Interview/Tesla-Interview-E43129-RVW73526933.htm | Glassdoor, undated | Frontend | S | React live coding; presentation; JS fundamentals |
| G7 | https://www.glassdoor.ca/Interview/Tesla-Interview-E43129-RVW74782331.htm | Glassdoor, about 2023 | Frontend | S | Take-home; three-hour panel |
| G10 | https://www.glassdoor.com/Interview/1-Codelity-4-questions-on-Angular-sql-net-and-java-They-are-moderate-one-could-do-it-with-minimum-preparation-2-QTN_3121505.htm | Glassdoor, undated | Role not stated | S (page title) | Codility with Angular |
| A1 | https://www.1point3acres.com/bbs/thread-729067-1-1.html | 1point3acres, 2021 | Frontend onsite, US | S | Web security, React basics |
| A2, A3 | https://www.1point3acres.com/bbs/collection/232529 (thread not isolated) | 1point3acres, 2021-05 and 2021-11 | Frontend screen and assessment | S | `JSON.stringify`; pull-request question |
| H1 | https://github.com/HarryXiong24/tesla-energy-service-demo-project (`doc/SEIA Ui Application Evaluation Instructions.pdf`) | GitHub, PDF created 2023-08 | Energy Service Engineering UI evaluation | F, file confirmed | Site-layout brief |
| H2 | 22 repos, for example https://github.com/medwardson/tesla-take-home, https://github.com/jasssse/tesla-takehome, https://github.com/Nitinsairaj/TeslaEnergyServiceEngineeringUIApplicationsEvaluation | GitHub, 2023-06 to 2026-06 | Energy site layout | F | Independent builds of H1; two data variants |
| H3 | https://github.com/JoshPark1/Tesla-UI-Challenge-2025 | GitHub, 2025-12 | Creative Technology internship | F | Gear-shifter brief, marked confidential |
| H4 | https://github.com/thesimoneliu/2023_portfolio.github.io | GitHub portfolio, 2023 | Same challenge | F | Title-level corroboration |
| H5 | https://github.com/poornasaiv/Tesla_Interview_Coding (`src/Games/TeslaRound1.js`) | GitHub, 2025-08 | Role not stated | F, re-checked | Four JavaScript exercises |
| H7 | https://github.com/amitrajesh/TeslaTakeHome | GitHub, 2021-09 | Role not stated | F | React and Flask take-home with WebSockets |

Also read:
- Mirrors: Glassdoor G1 to G3 (mirrors of T1, T2 and T4), G8, G9 and G11, Taro T10, Blind B5, B6 and B9 to B13, LeetCode L2, PracHub P1, 1point3acres titles A4 to A8.
- About 20 GitHub repos that turned out to be LabVIEW, data, backend or other companies' challenges.
- None of them adds a frontend question beyond the items above.

Search summaries mixed things up:
- They moved the deque round into the Angular report.
- They merged two internship reports.
- They credited a Brazilian company's page to Tesla.
- They presented a ChatGPT joke reply and a coaching-service ad on Blind as reports.

## Cross-company notes

- **Glassdoor is the largest pool for all three and we only see snippets.** A signed-in read would upgrade most S items, but the user has not granted the browser extension permission for glassdoor.com.
- **Templates rank first for every query.** Every prompt that appears only on Dataford, Prepfully, jobrise or similar pages was rejected.
- **Themes that recur across the three, for a later catalog mapping:**
  - a React component built against an API with loading and error states (all three);
  - an HTML/CSS rebuild with JavaScript layered on top (NVIDIA, Tesla);
  - hooks and Context (Walmart, Tesla);
  - output prediction and closures (Walmart);
  - autocomplete with debounce (Tesla);
  - a compound-component dropdown API (Walmart);
  - SSR and hydration (Walmart);
  - Angular (Tesla Fremont, Walmart Chennai).
- **Readiness for a sourced company page:**
  - Tesla has the most primary material: full-text reports and published briefs.
  - Walmart has the most questions but is India-weighted.
  - NVIDIA does not have enough public frontend material for a sourced guide.

## Verification (2026-10-19)

The coordinating session checked eight items against their sources:
- NVIDIA Taro 2020-12 [N3]: React component, closures/`bind`/floating point, DOM round.
- NVIDIA How We Hire [N21]: HackerRank, ChatGPT ban, 30-60 minutes, in-person onsite.
- Tesla Taro Fremont 2024-01 [T4]: Angular, TS/JS, car rental.
- Tesla Taro Los Angeles 2022-01 [T5]: HTML5, CSS positioning, login form, React Context, contrast, Codility.
- Tesla "TeslaRound1.js" [H5]: four exercises.
- The site-layout PDF's presence in its repo [H1].
- Walmart Hashnode 2024-01 [W10]: dropdown API, SSR above the fold, module federation, stacking contexts, currying.
- Walmart Medium 2024-11 through RSS [W11]: `useMemo`, Context API, responsive vs adaptive, First Missing Positive.

It also read eight LeetCode posts in full for the first time: 8288813 [W31], 2105625 [W32], 6156237 [W33], 5988869 [W34], 5331800 [W35], 1436043 [W37], 2774667 [W55] and 7185262. The last one corrected an earlier snippet-based item (see the Walmart misattributions).

Every quoted phrase was found on its page.

## Open items

- **Absolute monthly volumes** for the three companies' frontend queries: Semrush through the signed-in browser.
- **Unread LeetCode posts:**
  - Walmart: none of the frontend posts is left; read on 2026-10-19.
  - NVIDIA: 7820756 (not frontend, by its snippet).
  - Tesla: none of the 17 unread titles mentions frontend.
- **Two Taro "Front End Developer" Tesla reports** in the United States were counted by Taro but not located.
- **Next steps, each needing its own yes/no:** the catalog mapping and implementation plan below propose the order; tagging, each new item and authored guides still need separate approval.

## Catalog mapping (2026-10-19)

The 461 catalog items were checked against the reported tasks above: titles, ids and a keyword search of every item's content.

**Already covered: tag candidates.** No new content is needed for these.

| Company | Reported task | Existing item | Access |
|---|---|---|---|
| Walmart | Detached-method `this` | `js-this-keyword` | free |
| Walmart | Add two numbers with promises | `js-add-two-promises` | premium |
| Walmart | `sum(a, b, c)` and `sum(a)(b)(c)` | `js-curry-function` (the open-ended `sum(a)(b)(c)..` form is only partly covered) | premium |
| Walmart | Throttling | `js-throttle` | premium |
| Walmart | Closures, hoisting, `call`/`apply`/`bind`, type coercion, callback hell | `js-closures`, `js-hoisting`, `js-call-apply-bind`, `js-type-coercion`, `js-promises-async-await` | free |
| Walmart | Valid Anagram | `js-valid-anagram` | premium |
| Walmart | Accordion (reported in vanilla JS) | `react-accordion-faq`, `angular-faq-accordion`, `vue-accordion-faq` | premium |
| Walmart | `useContext` re-renders, prop drilling, hooks usage | `react-context-performance-issues`, `react-lifting-state-up`, `react-hooks-youve-used`, `react-usememo-vs-usecallback`, `react-useref-vs-usestate` | free |
| Walmart | Stacking context, positioning, box model, specificity, block vs inline, class vs id, Shadow DOM | `css-z-index`, `css-position-relative-absolute-fixed`, `css-box-model`, `css-cascade-order`, `html-block-inline-elements`, `html-id-vs-class`, `html-shadow-dom` | free |
| Walmart | XSS, polling vs WebSockets, Lighthouse and lazy loading, Jest mocking | `js-xss-dom-sinks`, `js-escape-vs-sanitize`, `sse-vs-websocket-real-time`, `web-performance-optimize-load-time`, `js-deferred-scripts`, `js-mock-vs-stub-vs-spy` | free |
| Walmart | LinkedIn search autocomplete design | `realtime-search-debounce-cache` | premium |
| Walmart | Custom timer hook | `react-countdown-timer` | premium |
| Walmart | Angular lifecycle, services, component communication | `angular-lifecycle-hooks`, `angular-services`, `angular-input-output` | free |
| NVIDIA | Closures, `bind` | `js-closures`, `js-call-apply-bind` | free |
| NVIDIA | Pure JS DOM work | `js-dom-renderer`, `js-delegated-events-1` | premium |
| NVIDIA | React app against an API; how hooks work | `react-fetch-list-states`, `react-why-hooks-have-rules` | free |
| NVIDIA | HTML/CSS page rebuild | `html-semantic-layout`, `css-flexbox-navbar`, `css-grid-card-gallery` | free |
| Tesla | Like button | `react-like-button` | premium |
| Tesla | Search bar; autocomplete with an API and debounce | `react-autocomplete-search-starter` (free), `react-debounced-search` (premium) | mixed |
| Tesla | Theme through React Context | `react-theme-toggle` | premium |
| Tesla | Fetch and render | `react-fetch-list-states` | free |
| Tesla | Semantic HTML5, CSS positioning, login form | `html-semantic-layout`, `css-positioning-badge`, `html-contact-form-labeled`, `html-forms-validation-required` | free |
| Tesla | Shallow vs deep copy; remove duplicates | `js-shallow-clone` (free), `js-shallow-vs-deep-copy` (free), `js-deep-clone` (premium), `js-unique-array` (premium; dedupes by value, not by `id`) | mixed |
| Tesla | User table; add-to-list page | `react-pagination-table`, `react-dynamic-table` (premium), `react-todo-list` (free) | mixed |
| Tesla | Angular concepts round; cookies | Angular trivia set (free), Angular coding items (premium), `js-cookie-options`, `js-cookie-sessionstorage-localstorage` | mixed |

Before tagging, check each item against the interview registry pins. `generate:interview-content:check` shows whether an item is pinned. A pinned item needs the re-pin described in `company-pages-plan-2026-10.md`, Step 8.

**Not covered: new-item candidates.** "Partly" means the topic only appears inside another item.

| # | Proposed item (working id) | Type | Evidence | Effort |
|---|---|---|---|---|
| 1 | Fix a React app that misuses an API, then add a small feature (`react-debug-api-misuse`) | Debug, React (same shape as `react-debug-double-render`) | Walmart W31 and W25 (F), NVIDIA N1 (S). The catalog has one React debug item. | M |
| 2 | Battery site-layout configurator take-home (`react-battery-site-layout`) | Coding, React, take-home size | Tesla H1 and H2: brief read in full; 22 independent repos, 2023-06 to 2026-06 | XL |
| 3 | Dropdown/Select component API: single and multi-select, custom children, compound components (`react-select-compound-api`) | Coding or component design | Walmart W10 (F). No compound-component item exists. | L |
| 4 | State management in React: Redux and alternatives (`react-state-management-redux`) | Trivia | Walmart W2 (F), W40 and W43 (S). Vue has Vuex and Angular has NgRx; React has none. | S |
| 5 | SSR and hydration in React: server-rendered above the fold, client-rendered below, parse order (`react-ssr-hydration`) | Trivia | Walmart W10 (F), W47 (S). Partly: mentioned in 15 items, none dedicated. | S |
| 6 | Valid Parentheses (`js-valid-parentheses`) | Coding, DSA | Walmart W3, W10, W11 (three F reports) | S |
| 7 | Implement `useMemo` and a minimal Context API, then extend the Context to hold API results (`react-implement-usememo-context`) | Coding, React | Walmart W11 (F) | M |
| 8 | File explorer: folder tree with expand and collapse (`react-file-explorer`) | Coding, React | Walmart W41 (S, 2017). Common at other companies (market research, section 4). | M |
| 9 | WCAG colour contrast ratio (`js-color-contrast-ratio`) | Coding, JS | Tesla T5 (F, re-checked) | S |
| 10 | Car rental booking frontend (`car-rental-booking-frontend`) | System design | Tesla T4 (F, re-checked) | L |
| 11 | Messaging frontend (LinkedIn-style chat) (`messaging-chat-frontend`) | System design | Walmart W18 (F, advice). Partly: `ai-chat-textarea-design`, `chat-conversation-state-management`. | L |
| 12 | Code splitting, `React.lazy`/Suspense and module federation (`react-code-splitting-module-federation`) | Trivia | Walmart W10 and W12 (F). Partly: `web-performance-optimize-load-time`. | S |
| 13 | Implement `JSON.stringify` (`js-json-stringify`) | Coding, JS | Tesla A2 (S, 2021) | M |

Low priority, only on demand:
- a press-and-hold or swipe-to-confirm control, inspired by Tesla H3 but never using its confidential brief;
- responsive vs adaptive design;
- masking sensitive keys and deduplicating by `id`;
- floating-point pitfalls;
- one-off DSA problems (Two Sum, Best Time to Buy and Sell Stock, Number of Islands, First Missing Positive, Search in Rotated Sorted Array, Next Greater Element, Meeting Rooms II);
- the deque card game;
- an expense table with a bar chart;
- Uber and spreadsheet designs.

## Implementation plan (proposed 2026-10-19)

Approved by the user on 2026-10-19: the pace, the access table and the order. Phase 1 started the same day. Each new item is still reviewed by the user before the next one starts.

### Pace: one item per step, small waves per PR

Adding all thirteen at once would lower quality, for five reasons:
- **Pipeline cost.** Each coding item carries a lot:
  - a starter, tests and a solution with explanation;
  - sandbox assets that must stay byte-identical in `cdn/sb` and `frontend/src/assets/sb`;
  - for React items with solution code, a hand-written decision graph plus a `failure-explain-rules.ts` change;
  - sources, company tags, regenerated data version, prerender, sitemap and SEO checks.

  A failing check in a bulk change is hard to trace to one item.
- **Review depth.** The differentiator is that every prompt cites a public report read in full. This research already caught misattributions: the NetApp round and the Gojek list. Each item's sources must be re-read before it ships.
- **Visible defects.** PracHub's 2026-10-10 review reported "0/1 passed" on an unchanged free starter. Every starter needs a clear failing message and a reviewed test run.
- **Indexing.** Search Console showed index shedding in October (145 pages not indexed). Many new pages at once are harder to get indexed and impossible to measure one by one.
- **Budgets.** `codingHtmlBytes` (620,000) was close to its cap on 2026-10-17. Each coding item adds a row to `/coding`, and each free page adds about 160 KB to `totalHtmlBytes` (109,000,000). Five routes added 811,044 bytes on 2026-10-17.

Proposed rule:
- Each item is its own step, with its own commit, its own checks and the user's review before the next item starts.
- A wave of two to four items goes to `dev` as one PR.
- Trivia items may be done in pairs, because they carry no runnable assets.

### Access: mostly premium, with free entry points

The catalog today:
- Trivia: 236 of 236 free.
- React coding: 26 of 30 premium.
- Angular coding: 23 of 26 premium.
- System design: 16 of 23 premium.
- JavaScript coding: about half premium.

Premium entries are skipped by the SEO inventory, so they never reach the sitemap. Free items are the only pages that earn search traffic.

Proposed rule:
- **Practice items are premium:** debug, take-home, component API, from-scratch hooks, system design. Paid users get things that free sites and AI assistants do not provide.
- **Two exceptions stay free:**
  - trivia, in line with the whole catalog;
  - one runnable entry per company, the pattern already used for Waymo and Revolut.
- **Commodity DSA classics are free entries.** LeetCode already gives them away, so a paywall would block visitors without selling anything. The existing DSA items such as `js-valid-anagram` stay premium as they are.

| # | Item | Access | Reason |
|---|---|---|---|
| 1 | React debug (API misuse) | premium | Runnable debugging round; the Angular counterpart is premium |
| 2 | Battery site-layout take-home | premium | Flagship take-home practice; an open market gap |
| 3 | Select compound API | premium | Senior component design |
| 4 | React state management trivia | free | Trivia |
| 5 | SSR and hydration trivia | free | Trivia |
| 6 | Valid Parentheses | free | Walmart runnable entry; commodity DSA |
| 7 | `useMemo` and Context from scratch | premium | Practice item |
| 8 | File explorer | premium | Framework coding item |
| 9 | Colour contrast ratio | free | Tesla runnable entry |
| 10 | Car rental system design | premium | System design |
| 11 | Messaging system design | premium | System design |
| 12 | Code splitting and module federation trivia | free | Trivia |
| 13 | `JSON.stringify` | premium | Polyfill practice |

Totals:
- Premium: 8 of 13 items, and 8 of the 10 runnable or design items.
- Free: the two company entries and the three trivia items.

### Order

0. **Decisions.** Approve or adjust this plan, the access table and the wave order.
1. **Tag-only company pages, Walmart then Tesla.**
   - Tag the existing items from the mapping, with sources.
   - Add company branding, `llms.txt`, smoke, sitemap and SSR test rows.
   - Re-pin any pinned items.

   This keeps the company-page plumbing out of the new-item steps. NVIDIA stays on hold: its material is too thin for a sourced page.

   Phase 1 scope, decided while tagging on 2026-10-19:
   - **Pinned items stay untagged for now.** `react-debounced-search` and `react-theme-toggle` are pinned by the interview coding registry. No system design case is tagged either, because the design bundles are pinned too. Tagging any of them needs the Step 8 re-pin, which can follow later as its own step.
   - **Coding tags carry sources; trivia tags carry none.** A coding item gets a source only from a report read in full. Trivia cannot carry sources.
   - **Full source list on `react-autocomplete-search-starter`.** It already has six sources, the maximum, so its Tesla tag has no source.
   - **No Angular tags for Walmart.** The Angular detail (lifecycle, services, component communication) appears only in the Roundz republication W14. The original LeetCode post W37 says only "Angular standard questions".
   **Phase 1 status (2026-10-19): done, not pushed.**
   - b8e35e82, Walmart: 33 entries tagged; 5 coding items with sources, 28 trivia.
   - 426f3799, Tesla: 17 entries tagged; 7 coding items with sources, 1 coding item without (it already had the maximum of six), 9 trivia.
   - Verified on a clean build:
     - lint:questions:check, lint:tags, indexability readiness, company Karma specs;
     - backend interview content check and validation, with no pin drift;
     - backend catalog and interview Jest subsets, 137 of 137;
     - `verify:seo-prerender-guard`: build, meta check, links, link equity with 427 sitemap pages and 0 orphans, smoke;
     - `perf:contract:strict`.
   - Both previews prerender as indexable canonical pages (`/companies/walmart/preview`, `/companies/tesla/preview`).
   - **Budget warning for Wave 1.** `codingHtmlBytes` is 615,132 against the 620,000 cap, which leaves 4,868 bytes of headroom. `totalHtmlBytes` is 105,098,574 against 109,000,000. A new coding item will probably cross the `/coding` cap, so decide first between a dated threshold change and trimming the row markup.

2. **Wave 1, free entries (S, S).**
   - #6 Valid Parentheses, tagged `walmart`.
   - #9 Colour contrast ratio, tagged `tesla`.

   Both are small and prove the pipeline end to end.
3. **Wave 2, premium on existing formats (M, L, M).**
   - #1 React debug, tagged `walmart` and `nvidia` if the user wants an NVIDIA tag.
   - #3 Select compound API, tagged `walmart`.
   - #7 `useMemo` and Context from scratch, tagged `walmart`.
4. **Wave 3, flagship (XL).** #2 battery site-layout take-home, tagged `tesla`.
   - First decide whether it is a large React coding item or a new take-home format: a longer brief, several test groups for totals, the 100 ft layout rule and persistence, plus a README-style deliverable.
   - The brief is written in our own words, as a practice version modelled on a reported take-home. The candidate-published PDF is never copied.
5. **Wave 4, trivia pairs (S, S, S).**
   - #4 React state management and #5 SSR and hydration first.
   - Then #12 code splitting and module federation.

   These can move earlier if a wave stalls, because they are independent.
6. **Wave 5, system design (L, L).**
   - #10 car rental, tagged `tesla`.
   - #11 messaging, tagged `walmart`.

   Each must pass the system design editorial lint (`editorial.companyEvidence` mirrors `companies`).
7. **On demand:** #13 `JSON.stringify`, #8 file explorer, and the low-priority list.

**Measurement checkpoints**
- After Wave 2:
  - attempts and sign-ups that start from the two free entries;
  - clicks from locked premium items to pricing;
  - Lemon Squeezy's GA4 purchase event is not wired up, so no revenue attribution.
- Four to six weeks after each company's deploy: a Search Console readout on that company's queries, the same protocol as the Europe pages.

### Checklist for every new item

- **Sources.**
  - At least one source read in full (F) supports the item, and it is re-read before writing.
  - Glassdoor snippets are supplementary only.
  - Wording follows the trust rules: "public interview reports", "practice version modelled on a reported round". The banned phrases stay out of app files.
- **Own wording.** No copied briefs; Tesla's Creative Technology brief is marked confidential.
- **Runnable items.**
  - The unchanged starter fails with a clear message.
  - Tests cover the edge cases named in the reports.
  - The reference solution passes, and the explanation and approaches are complete.
  - React items with solution code get a hand-written decision graph and a `failure-explain-rules.ts` change, as the pre-commit assist-sync validator requires.
- **Assets.** Sandbox assets are synced with `format-framework-css.mjs --write`.
- **Data.**
  - `companies` tag and `sources` with the company slug.
  - `access` set from the table above. `premiumPreview` stays frozen to its three keys.
- **Checks.**
  - `lint:questions` and `gen:data`.
  - `gen-data-version --check`, with `cdn/data-version.json` committed.
  - `gen:prerender` and the question-id manifest update.
  - `rm -rf frontend/dist`, then `verify:seo-prerender-guard`.
  - `perf:contract:strict`, watching `codingHtmlBytes` and `totalHtmlBytes`. A threshold change needs a dated justification in `perf-contract.mjs`.
  - Targeted Karma specs, and backend Jest when registries move.
- **Review.** The user reviews the item before the next one starts.
