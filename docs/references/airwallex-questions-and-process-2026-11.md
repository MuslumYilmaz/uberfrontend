# Airwallex: reported frontend interview questions and interview process

> **Status, 2026-11-25.** Step 2 of the traffic-candidate research (`reports/company-traffic-candidates.md`, git-excluded): the question list, the process tables and the practice map for Airwallex, written from saved files only (no web access in this step).
> **Nothing is built.** No page, catalog item, company tag, router entry or plan entry exists for Airwallex. Every new item and content piece below needs the user's separate yes.
> **Inputs.** `research_notes/traffic-candidates-2026-11/airwallex/` (the step-1 report `sources-step1.md`, the raw saves, the lead's Taro dump) and the 2026-11-24 check `research_notes/company-candidates-2026-11-24/sources/airwallex.md`, both git-excluded. Same format as `docs/references/binance-questions-and-process-2026-11.md`.

## Why Airwallex (rankability check of 2026-11-25)

- **Page 1 is soft.** For `airwallex frontend interview questions` (Google, en-US, web results only, read 2026-11-25) page 1 holds no first-party result, two Glassdoor results and no authority site: Dataford ×2, Glassdoor Singapore ×2, PracHub ×2, 1point3acres ×2, Taro and Crack ML Interview. The FrontendLead company template is not on page 1. On our 19 live company pages, a page 1 with 0–2 first-party results and no authority site put us in positions 1–4 on 8 of 8 pages.
- **Demand.** 7 Google suggestions (as counted in the candidates report), which meets the high-demand threshold; the company stays filed with the brand-interest group. Frontend queries: `airwallex frontend interview (questions)`, `airwallex frontend engineer (interview)`, `airwallex senior frontend engineer`. Company-wide: `airwallex interview process / questions / experience / rounds / reddit`, `airwallex software engineer interview singapore`, `airwallex senior software engineer interview`.
- **Hiring on 2026-11-25 (Ashby, 500 open jobs).** Six frontend postings, all senior: Spend (San Francisco), Growth (San Francisco and Seattle), Billing, Scale and Scale Platform (Singapore). Four full-stack postings: Engineering Lead, Full Stack, Growth (Singapore, Seattle, San Francisco) and Senior Fullstack Engineer, Scale (London). None lists interview steps.
- **Sources after step 1.** Nine first-person frontend accounts (seven on Taro, a candidate's notes, a forum post), two of them outside Taro; one take-home with 64 candidate solution repos (2016–2025); official text: a 2022 process post, a 2026 post on AI in interviews, a 2026 London FAQ with stages, early-career and intern pages. Before step 1 the count was two readable reports, one of them independent (2021).
- **Decision.** The user approved Airwallex on 2026-11-25 as one of the first three companies (with Verkada and Notion; Freshworks is on hold).

## Research rules (the user's decisions of 2026-11-25)

1. **Frontend-only, by content.** Frontend questions stay, and so do the general questions frontend loops also ask (algorithms, behavioural questions, take-home reviews, debugging), whoever was asked. Backend implementation, backend or distributed system design, network internals, OS and concurrency, SQL, security protocols and non-JS language questions are dropped. Mixed rows are trimmed and say what was trimmed. Generic exercises and format-only lines go into the stage cells of the process tables, not into rows (the Binance precedent). General algorithm questions from backend loops before 2024 are listed only when a 2024–2026 loop reports the same kind of question.
2. **What counts.** Taro accounts and FrontendLead forum posts count. Prep and template sites (PracHub's curated pages, Dataford, Prepfully, Glassdoor snippets) are corroboration only (T/P); a row that rests on them alone is marked unverified.
3. **The page shows years only.** No per-question source and no site name on the page; this record keeps the ids and URLs. The method note in Page package notes describes the collection without naming a site.
4. **No GitHub repo URLs and no take-home brief text in this record** (it goes into the public repo). Repositories appear as counts with years; their URLs stay in `research_notes/traffic-candidates-2026-11/airwallex/sources-step1.md` (section 6) and `raw/github/`.
5. **Take-homes in our own words:** what to build, inputs, behaviour, constraints, time box, what reviewers look at, follow-ups. No brief text, no company data, design files or brand names; the brief's fictional brand gets a neutral name.
6. **Practice map per row:** `Var: <catalog id>` (link as is), `Yakın: <catalog id> + what is missing`, or `Yok: new item`. For conversation rows a guide path counts as `Var`.
7. **Access default for new items:** company-specific signature tasks premium; generic algorithms and trivia free.
8. (Notion only; not applicable here.)
9. **Quotes** are short, exact, from saved files, with the source id beside them. Lines a fetch model marked as paraphrase are not quoted, and neither are the lead's one-line Taro summaries (TS1–TS27). A script checks every quote (see Verification).

**Access codes** (as in step 1): F full text; S sentence-level (a curated page, or quotes returned by a fetch); P a search snippet, a paywalled preview or a second-hand paraphrase; U unreadable; T a template or a prep site's own page; G a GitHub artifact (code, not an account). **Taro:** the lead read 61 Airwallex pages in Chrome on 2026-11-25 (every frontend-titled page and the engineering pages since 2024), saved eight accounts verbatim (T1–T8) and summarised the rest in one line each (TS1–TS27). A Taro slug date is the posting date, not always the interview month.

## Sources

### How they were gathered

- **2026-11-24 (source check):** Blind by curl (24 thread pages, 7 listing and search pages), PracHub (listing, company page, 6 experience pages), V2EX and Nowcoder by curl, Hacker News Algolia (4 queries), Aced, the Airwallex Engineering Medium feed, careers.airwallex.com, Built In, the Ashby posting API, GitHub search.
- **2026-11-25 (step 1):** 15 web searches; the FrontendLead tag page and forum sitemap (1,555 forum URLs); a PracHub re-check (listing, 2 question pages, the frontend position page); 10 more Blind searches; 6 more Algolia queries; the V2EX search API and 8 threads; dev.to and singdev.fyi checks; careers.airwallex.com sitemaps; GitHub (11 code searches, 6 repository searches, 4 GraphQL batches, about 40 file reads); the Ashby API again. The lead read Taro in Chrome.
- **Not fetched by rule:** LeetCode, Glassdoor, 1point3acres, Dataford, NodeFlair, Indeed, Reddit, template sites. The take-home's live endpoint was not called.

### By class

| Class | Read | Frontend loop content | Ids |
|---|---|---|---|
| Taro (the lead, in Chrome) | 61 pages: 8 accounts verbatim, 27 one-line summaries | 7 frontend-titled accounts, 2019–2025 | T1–T8; TS1–TS27 |
| FrontendLead forum | the only Airwallex thread among 1,555 forum URLs | an HR call (2026) | F1 |
| Blind | 24 threads, 17 listing and search pages | none; general context | S1–S4 |
| PracHub (curated: T/P) | 10 experiences listed, 6 read; 2 question pages; the frontend position page | one frontend account (2026) | R1; R3, S5 |
| Aced | the question bank by company | none (0 questions) | — |
| Medium, dev.to, Hashnode, Substack | feeds and tag searches | none (Medium carries the official O1) | — |
| Hacker News (Algolia) | 10 queries | none (one link to an unread LinkedIn article) | — |
| Chinese-language sites | V2EX 12 threads, Nowcoder 2 posts; Juejin, CSDN and Zhihu through search only | staff replies on the Shanghai loop; backend accounts | O5; S6, S8, S9 |
| singdev.fyi | 1 story, paywalled preview | none (senior SWE) | S10 |
| Official pages | 7 | process and AI rules | O1–O7 |
| Postings (Ashby, 2026-11-25) | 6 frontend, 4 full-stack; 2 intern postings saved on 2026-11-24 | none state steps, except the intern postings | P1–P6; O4 |
| GitHub (counts only; URLs in research_notes) | 64 solution repos of one take-home; 1 sandbox; 1 prep repo; 2 notes files | the take-home; R2's notes | G1, G2, G3; R2, S7 |
| Not citable or unread | Glassdoor (26 reviews, a question page and the frontend page, seen in search only), Dataford, 1point3acres, NodeFlair, Indeed, templates; LinkedIn, LeetCode, Zhihu, a WeChat article (unread) | — | — |

### Frontend accounts

Taro URLs: `https://www.jointaro.com/interviews/companies/airwallex/experiences/<slug>/`.

| id | source | role, location, outcome | interview | class | rounds | questions or tasks |
|---|---|---|---|---|---|---|
| T1 | Taro `frontend-engineer-singapore-february-27-2025-no-offer-neutral-55fafb14` | Frontend Engineer, Singapore, no offer; through a recruiter; two weeks | 2025-02 | F | "Self-introduction, then an applied coding question on a Todo List." Then questions for the interviewer | "Todo list in React. Parts two and three are adding unit tests and API calls in the order of your choosing." |
| T2 | Taro `middle-frontend-developer-may-6-2025-no-offer-negative-f4e22964` | Middle Frontend Engineer, location not stated, no offer | 2025-05 | F | "The first one is asking basic frontend stuff, and two coding questions (one is algorithm and the other one is a React question)." "The second run is more about previous projects and one algorithm." | "A React todo list and a tree traverse coding question." |
| T3 | Taro `frontend-software-engineer-melbourne-victoria-august-13-2025-no-offer-negative-f42fe8c1` | Frontend Engineer, Melbourne, no offer; two weeks | 2025-08 | F | stage 1 a code challenge; stage 2 in person, general questions | "a very easy code challenge involving grabbing data, performing simple operations, and displaying it on a basic UI" |
| T4 | Taro `frontend-engineer-singapore-october-14-2025-no-offer-positive-396fbc40` | Frontend Engineer, Singapore, no offer | 2025-10 | F | "The interview process consisted of three rounds." HR phone screen; "Second was a technical round where I had to solve coding problems on a shared screen and explain my approach."; the third not described | "Can you explain how you would optimize the performance of a React application with a large dataset?" |
| T5 | Taro `senior-software-engineer-front-end-sydney-new-south-wales-march-22-2023-no-offer-positive-f18b89a7` | Senior Frontend Engineer, Sydney, no offer; two weeks | 2023-03 | F | "1st - 30 mins recruiter phone screen"; "2nd - 1hr project/behaviour interview with one eng manager and one lead eng"; a "take-home coding exercise building a simple application"; "3rd - 1.5hrs panel interview with two senior members to work through the coding exercise and asked some questions about your approaches and tech stacks"; a one-hour final with an engineering director and a senior engineer | a recent project: how you worked on it, technology decisions, challenges, how you solved them, what you would do differently |
| T6 | Taro `software-engineer-front-end-december-13-2021-accepted-offer-positive-cf0cd988` | Frontend Engineer, location not stated, accepted offer | 2021-12 | F | "Phone interview (behavioral questions) at first, then three rounds of technical interviews (self-introduction, project-related questions, and coding questions)", "with one homework assignment", "plus an on-site HR interview" | "Dynamic programming related coding questions"; the homework, a simple website with an "API provided", on a fictional theme that matches the take-home's brief copies (the name stays in research_notes) |
| T7 | Taro `senior-frontend-engineer-melbourne-victoria-november-23-2019-accepted-offer-neutral-59e9df87` | Senior Frontend Engineer, Melbourne, accepted offer; through a recruiter; four weeks | 2019-11 | F (thin) | an in-person interview that "seemed pretty ad-hoc" | "Do you have prior experience with FX?" |
| T8 | Taro `staff-engineer-melbourne-victoria-november-20-2024-no-offer-negative-8f39b395` | Staff Engineer (no frontend title; the lead's dump files it with the frontend accounts; a general account here), Melbourne, no offer; four weeks | 2024-11 | F | a recruiter; "Meet with a staff engineer for an experience interview"; "Takehome/Live Code"; "Design Challenge" | "Tell me about a project you've worked on before. What are some things you'd change about it? Describe an algorithm to sort an array." |
| R1 | PracHub, https://prachub.com/interview-experiences/airwallex-frontend-engineer-interview-experience-two-oas-then-i-withdrew-over-red-flags | Frontend Engineer, level and location not stated, withdrew | 2026-08 (published 2026-10-10) | S, "Curated and edited by PracHub", so T/P | OA 1 coding, OA 2 design; "After the OA, the next round is system design, behavioral, leadership, plus a bar raiser." | the name-keyed async scheduler (Q4); the autocomplete input design (Q17) |
| R2 | a candidate's interview notes in Chinese in a public repository (URL in research_notes) | frontend (inferred from the notes), mainland China (inferred: the same file covers two mainland companies), outcome not stated | 2021-05 | F | 一面 (round 1): "没有问前端基础，没有问算法题" (no fundamentals, no algorithms); 二面 (round 2): projects | round 1: React 17, class versus function components, webpack, micro-frontends; round 2: base component design, Node memory leaks, a mistake asked in English, micro-frontends with single-spa, security |
| F1 | FrontendLead forum, https://frontendlead.com/discuss/t/airwallex-senior-frontend-sde/3265 | senior frontend, San Francisco | 2026-03 | F | "Had a call with the HR, it seems the team is expanding in USA." | none; "If you choose the AI related product track, they need special permission from the manager." |

### General software-engineer accounts on Taro (the lead's one-line summaries; S; not quoted)

| id | slug start (outcome if given) | summary |
|---|---|---|
| TS1 | `senior-software-engineer-singapore-january-20-2026` (accepted) | four weeks; the number of connected components in an undirected graph |
| TS2 | `senior-software-engineer-january-6-2026` | a LeetCode-style simulation question in OOP |
| TS3 | `software-engineer-january-16-2026` | four interviews; first a coding interview with the company's own questions |
| TS4 | `software-engineer-singapore-january-10-2026` | recruiter, two or three technical rounds, final; a domain system design |
| TS5 | `software-engineer-sydney-new-south-wales-january-20-2026` (interview about 2021) | a 2Sum-like problem and list compaction |
| TS6 | `software-engineer-march-2-2026` | HR, technical coding, technical; easy-to-medium LeetCode (graph and DP) |
| TS7 | `software-engineer-ii-singapore-february-23-2026` | two one-hour LeetCode-medium rounds (DP and graph): a modified triangle problem with a follow-up, a graph DFS; system design: design Booking.com |
| TS8 | `ai-engineer-ii-march-24-2026` | live coding: Tic-Tac-Toe |
| TS9 | `engineering-lead-august-5-2026` | recruiter, live coding, system design, behavioural, CTO final; design: add a feature that downloads external files; coding: an account balance that maintains state |
| TS10 | `software-engineer-intern-may-24-2026` | a 15-minute recruiter call (why Airwallex, learning priorities), then technical |
| TS11 | `software-engineer-august-11-2026` | junior or medior; a domain question and a tree question written from scratch |
| TS12 | `software-engineer-october-5-2026` | HR; coding and a technical discussion with AI |
| TS13 | `software-engineer-singapore-october-11-2026` | live coding, system design, an onsite project deep dive |
| TS14 | `senior-software-engineer-singapore-march-2-2025` | HR, homework, a code review of the submission with a system design, a managerial round; testing and CI/CD of the app |
| TS15 | `senior-software-engineer-singapore-june-12-2025` | HR, engineering screening, coding, system design, bar raiser |
| TS16 | `ai-engineer-singapore-july-21-2025` | a real-life Python app built from scratch |
| TS17 | `software-engineer-august-6-2025` | LeetCode style with a payment scenario and many edge cases |
| TS18 | `senior-software-engineer-november-6-2025` (accepted) | HR, live coding with a small design discussion, system design (a payment system for banking), behavioural |
| TS19 | `senior-software-engineer-amsterdam-november-12-2025` | a safeguard so that a seller's wallet balance cannot go negative |
| TS20 | `software-engineer-singapore-december-10-2025` | LeetCode mediums, projects, database questions |
| TS21 | `engineering-lead-may-26-2024` | recruiter, hiring manager, system design, live coding, director; a bank-account transfers question |
| TS22 | `senior-software-engineer-singapore-october-7-2024` | project and stack; design a Google Docs comment feature |
| TS23 | `senior-software-engineer-october-24-2024` | the fastest speed over a 100-metre interval |
| TS24 | `software-engineer-august-15-2024` | the shortest path of a tree |
| TS25 | `software-engineer-singapore-river-may-1-2024` | coding, system design, hiring manager; sort an array in different ways |
| TS26 | interns, 2025 (several pages) | OA (company history and values, Python, SQL, system design), two LeetCode mediums, live coding with two engineers, behavioural |
| TS27 | directors and leads, 2025 (several pages) | recruiter, hiring manager, peer, system design, skip-level, CTO |

### Other context (not frontend accounts)

| id | source | date | role, place | class | what it adds |
|---|---|---|---|---|---|
| R3 | PracHub, https://prachub.com/interview-experiences/airwallex-backend-engineer-interview-experience-coding-ai-assisted-coding-system-design-and-a-bar-raiser | reported 2026-09 | "Software Engineer II backend position", Singapore | S curated, so T/P | coding: "given a triangle of numbers, find the path with the largest sum." with a follow-up through a required cell; an AI-assisted round that builds Tic-Tac-Toe and grows it into an app with a frontend and a backend, judged on "using the AI well while still actually understanding what it produced"; a booking-site design down to SQL tables (dropped); a bar raiser with project deep dives. May retell TS7 and TS8 (unverified) |
| S1 | Blind, https://www.teamblind.com/post/airwallex-interview-hejmcbnx | 2025-02 to 2025-12 | senior SDE; one commenter interviewed in Singapore | F | "It was definitely a easy-medium LC and a system design question very relevant to the team I'm interviewing for."; the Singapore commenter: "no LC at all" and "they give some irl requirement and ask you to design and implement it."; another: "They said they look at oop and coding style." |
| S2 | Blind, https://www.teamblind.com/post/airwallex-review-k4rdcsj6 | 2022-04 | an offer holder moving from the US to Singapore; commenters | F | "One of my questions was to explain how a CD player works" (role not stated); "For more senior roles the CEO needs final sign off." |
| S3 | Blind, https://www.teamblind.com/post/working-at-airwallex-k8ddhvge | 2021-10 | a staff-level commenter | F | "The interview was non traditional, lots of talk." |
| S4 | Blind: `/post/airwallex-review-mqwyryux`, `/post/catch-up-session-fnqddeo1`, `/post/Airwallex-Technical-Project-Sharing-WHNtrOV2`, `/post/airwallex-interview-crazy-8sx4vs2h` | 2022–2026 | backend, Singapore and unknown | F | process context only |
| S5 | PracHub, four software-engineer pages, e.g. https://prachub.com/interview-experiences/airwallex-software-engineer-interview-experience-real-time-robot-chase-system-design-then-a-rejection-with-no-feedback | 2026-08 and 2026-09 | Software Engineer; Vietnam, Singapore, a new Seattle team | S curated, so T/P | live coding, system design, behavioural, a CTO round (Vietnam). For a new Seattle team, "a direct two-round company screen — coding plus system design" with "Coding — merging paginated records from multiple data sources." and the questions "How do you use AI in your day-to-day work?" and "Would you delegate a task to an agent that picks its own tools?" |
| S6 | Nowcoder, https://www.nowcoder.com/discuss/465517667441516544 | 2023-03 and 2023-04 | backend, Shanghai | F | round 1: "有n个账户，每个账户都有存款，进行任意次交易保证每次最后每个账户存款>100" and "写一个算法输出所有交易的过程。（a向b转账X元的数组）", then "然后问了下算法当中可以改进的点（主要是工程上的改进点，不是算法上的）"; MySQL, Spring and an inverted index (dropped) |
| S7 | a personal blog's source in a public repository (URL in research_notes) | 2022-03 | Java backend, Shanghai, offer | F | four technical video rounds and HR: 3Sum, a hotel booking design, the soda-bottle problem, and a VP architecture round that ended with "用英文简单介绍你当前的团队" (introduce your current team in English) |
| S8 | V2EX, https://www.v2ex.com/t/472231, reply 4 | 2018-07 | backend | F | a coding task solved with an object-oriented design, rejected for lack of attention to detail |
| S9 | Nowcoder, https://www.nowcoder.com/feed/main/detail/4447bbeaf24547849630dcf5ba8ca9c6 | 2022-10 | a campus written test, four questions | F | no question text |
| S10 | singdev.fyi, https://singdev.fyi/stories/21 | interviews 2026-01 to 2026-03 | Senior Software Engineer, Singapore, offer | P (paywalled preview) | "1st round tech screen: AI Assisted coding, first 30 minutes was leetcode style question without referring to AI or any docs." |

### Official pages and postings

| id | page | date | what it covers |
|---|---|---|---|
| O1 | "Getting Hired", Airwallex Engineering on Medium, https://medium.com/airwallex-engineering/getting-hired-cb59018b26e9 (read through the publication feed) | 2022-04-08 | the five-stage engineering process (see Official process facts) |
| O2 | Airwallex Careers blog, https://careers.airwallex.com/blog/airwallex-ai-first/ (a Built In piece) | 2026-04-18 | the AI rule for engineering interviews |
| O3 | https://careers.airwallex.com/ai-careers/ | read 2026-11-24 | AI roles: intro chat, technical deep-dive, team and values, offer |
| O4 | Ashby, Software Engineer Intern (Summer 2027; Jan to Jun 2027), Singapore: https://jobs.ashbyhq.com/airwallex/6cdb0f39-234a-4234-b1f1-cb48a1fa2795 and https://jobs.ashbyhq.com/airwallex/39651124-122a-4033-91a2-af2687b83441 | published 2026-11-12, gone from the board on 2026-11-25 | stages and the AI assessment; not frontend |
| O5 | V2EX referral threads by Airwallex Shanghai staff: https://www.v2ex.com/t/472231, https://www.v2ex.com/t/612720, https://www.v2ex.com/t/832198 | 2018–2022 | a written test after the CV; interviews in Chinese with English checked |
| O6 | Airwallex Careers blog, https://careers.airwallex.com/blog/why-engineer-returned-to-airwallex-london/ | 2026-08-25 | the London engineering stages |
| O7 | https://careers.airwallex.com/early-careers/ | published 2026-03-17, modified 2026-09-24 | early careers: two to three rounds |

| id | posting (Ashby, read 2026-11-25) | published | team and stack |
|---|---|---|---|
| P1 | Senior Frontend Engineer, Spend; San Francisco, three office days a week | 2026-05-22 | expense management; React, TypeScript, a "domain-based Micro Frontend architecture", Apollo GraphQL with a Backend-for-Frontend layer, shared components and a design system; 6+ years |
| P2, P3 | Senior Frontend Engineer, Growth; San Francisco and Seattle (same text) | 2026-06-19, 2026-10-19 | acquisition sites, funnels, campaign tools, AI-powered internal tools; React, TypeScript, web performance, SEO, accessibility, experimentation; preferred: agentic UX with "streaming responses, and human-in-the-loop interfaces", Next.js, SSR; 5+ years |
| P4 | Senior Software Engineer, Billing (Frontend); Singapore, five office days | 2026-11-10 | quote-to-cash billing and checkout, where every number must "reconcile to the cent"; React plus Vue or Angular, TypeScript, micro-frontends (Single-SPA preferred), GraphQL, a Node.js BFF, Webpack or Rollup; React Testing Library and Cypress preferred |
| P5, P6 | Senior Software Engineer, Scale (Frontend) and Scale Platform (Frontend); Singapore (same text) | 2026-10-21 | a multi-tenant platform for embedded finance; ReactJS and TypeScript; judgement in "choosing the right level of abstraction" for system and component design |
| — | Engineering Lead, Full Stack, Growth (Singapore 2026-10-23; Seattle and San Francisco 2026-11-18); Senior Fullstack Engineer, Scale (London 2026-11-04) | — | React, Next.js and TypeScript with a backend language; context only |

### GitHub traces (counts only; URLs in research_notes)

| id | what | dates | notes |
|---|---|---|---|
| G1 | 64 candidate solution repos of the invite-request take-home, from 63 people | created 2016–2025: 2016 2, 2017 2, 2018 4, 2019 6, 2020 10, 2021 12, 2022 7, 2023 6, 2024 6, 2025 9 (the last in April 2025) | attributed by repository name, README, the brief's endpoint or its reserved test address. Not counted: 10 apps on the same theme without an Airwallex signal, and 4 mobile apps of another company's variant of the brief |
| G2 | one public sandbox named for an Airwallex frontend interview | 2026-11 | a receipt-entries table with a form and a search (Q3); no account text |
| G3 | one candidate's prep repo for an Airwallex AI-focused coding interview | 2026-11 | paraphrases a private company prep guide (P); the practice cases are the candidate's own, in Python |
| — | R2 and S7 are notes files in public repositories | 2021, 2022 | see the tables above |

## Official process facts

- **2022, all engineering roles (O1).**
  - A recruiter call first.
  - Tech screen, 60 minutes: your background and a coding challenge. "These are pretty similar to easy and medium questions on platforms like LeetCode."
  - "For our next interview, you have a choice between a take home challenge, or a live coding challenge." The take-home comes as files that outline a problem, solved in a common language of your choice and reviewed like any code review ("whether the solution works, how easy your code is to read, the quality (not quantity!) of tests"). "We typically find candidates complete the challenge in about 3–4 hours." The live option is a harder question in 60 minutes with assumptions, edge cases, tests and iteration: "We'll also ask you to assess the time complexity to see how well you can assess your own solution."
  - System Design and Problem Solving, 60–90 minutes, tailored to the candidate. "If you choose to complete a take home code challenge (as mentioned above), this interview will start with a code review of your solution." "During this interview, one of our engineers will review your code and ask how you think you could improve it." The design part starts from a product, for example "coming up with the right architecture for a live messaging app". The problem-solving part starts from an ambiguous real-world question such as "what's the fastest way to cross a city?" and maps the answer to data structures, usually without code.
  - Final, 60 minutes: "Our final interview is with one of our senior leaders in engineering — usually our CEO, CTO, or a VP of Engineering." Culture fit and company values.
  - Tip: "Practice medium and hard questions on LeetCode beforehand." in 30–40 minutes each.
- **2026, the AI rule (O2).** "Our engineering interviews now test for proficiency in working with AI rather than banning it."
- **2026, London engineering roles (O6).** "For engineering roles in London, candidates can expect the following stages: a coding interview, a system design interview, a hiring manager interview about your career background and project experience, and a bar raiser interview." "That final conversation focuses on your motivations, behaviours, fit with our core values and operating principles, and how you use AI in your work." The post says London hires backend and full-stack engineers and engineering leaders.
- **2026, Singapore software-engineer interns (O4, not frontend; both postings left the board on 2026-11-25).** Online technical assessment, talent screen, a live code interview (the second posting says technical interview), hiring manager interview. "As part of the interview process, we are interested not only in your coding fundamentals, but also in how you think about using AI in engineering." The stages may assess "How you approach problem solving with and without AI assistance" and "Your ability to evaluate, refine or challenge AI-generated suggestions".
- **2026, early careers (O7).** "Two to three rounds: a recruiter screen plus one or two technical/working sessions." "We care about how you think and collaborate, not memorized frameworks."
- **AI roles (O3).** Intro chat, a technical deep-dive aligned to your background, team and values, offer.
- **Shanghai, 2018–2022 (O5, staff replies in referral threads).** A written coding test once the CV passes: "嗯简历通过以后需要做道笔试题" (2018). Interviews in Chinese: "是中文面试 英文可能会有个自我介绍" (in Chinese, perhaps a self-introduction in English; 2019) and "中文面，过程中会考验你的英文能力" (in Chinese, with English tested along the way; 2022).
- **Postings (P1–P6).** No interview steps; the only interview line is the anti-scam notice.
- **Not found:** an official frontend-specific process, a named coding platform, a reapply rule.

## Loop by role, level and region

### Frontend, Singapore, 2025 (T1, T4; T2 of unstated location)

- T1 (2025-02): through a recruiter, two weeks; a self-introduction, then a React to-do list built live, then unit tests and API calls in the order the candidate chooses. The interviewer "gave guidance and discussion sometimes".
- T4 (2025-10): three rounds: an HR phone screen on background and experience; coding problems on a shared screen with the approach explained; a third round not described. Question: React performance with a large dataset.
- T2 (2025-05, mid level): round one, basic frontend questions plus two coding questions (an algorithm and a React task); round two, previous projects and one more algorithm. The account's question list names a React to-do list and a tree traversal without saying which round asked the tree. "Not that hard."
- Shape: two technical rounds around a live React task and an algorithm; no take-home in these three accounts.

### Frontend, Australia: Sydney 2023, Melbourne 2019 and 2025 (T5, T3, T7; T8 staff, 2024)

- T5 (Sydney, senior, 2023-03): recruiter (30 minutes); a one-hour project and behaviour interview with an engineering manager and a lead engineer; a take-home building a simple application; a 1.5-hour panel with two senior members on the exercise, the approach and the stack; a one-hour final with an engineering director and a senior engineer: "a bit of project deep dive, architecture questions and brain-teasing questions at the end". The director "will keep asking follow-up questions based on your answers". Two weeks.
- T3 (Melbourne, 2025-08): stage one, a very easy code challenge (fetch data, do simple operations, show them on a basic UI); the candidate "went above and beyond, creating a polished UI and analyzing the data thoroughly to get the best out of the challenge." Stage two, in person, general questions; "The focus seemed more on the UI technologies than my skills or experience." The candidate also felt their English fluency counted against them (the candidate's impression). Two weeks.
- T7 (Melbourne, senior, 2019-11): through a recruiter, four weeks; an in-person interview that "seemed pretty ad-hoc"; a question on FX experience.
- T8 (Melbourne, Staff Engineer, 2024-11; general): recruiter, an experience interview with a staff engineer, a take-home or live code, a design challenge; four weeks.

### Frontend online assessments, 2026, location not stated (R1; unverified)

- OA 1, coding: the name-keyed async scheduler (Q4). OA 2, design: the autocomplete input (Q17). The next stages were listed as system design, behavioural, leadership and a bar raiser; the candidate withdrew ("I withdrew before the next round because I had other offers.").

### The AI-era coding screen, general software roles, 2026 (S10, G3, TS12, R3; official O2, O4, O6)

- S10 (senior SWE, Singapore, 2026; preview): about 30 minutes of a LeetCode-style question without AI or docs, then a part the preview cuts off.
- G3 (2026-11; a candidate's paraphrase of a private company guide; role not stated): "a 30-minute real-world, AI-focused coding exercise without AI assistance", then a 25–30 minute deep dive "where AI is allowed for review, optimization, and edge cases".
- TS12 (SWE, 2026-10): coding and a technical discussion with AI. R3 (backend SWE II, Singapore, 2026; curated): an AI-assisted round that grows a Tic-Tac-Toe game into an app.
- No frontend account describes an AI round yet; the four 2025 frontend accounts mention none. A Glassdoor snippet (not citable) is said to report that AI was not allowed in a 2026 Singapore coding interview, so the rule may vary by round or team.
- F1 (senior frontend, San Francisco, 2026-03): "If you choose the AI related product track, they need special permission from the manager."

### General software engineers, 2024–2026 (TS lines, S1, S5): the shared coding screen

- Mostly Singapore (TS1, TS4, TS7, TS13, TS14, TS15, TS20, TS22, TS25): a recruiter, one or two coding rounds (easy-to-medium LeetCode, often graph and DP), a system design that is often domain-shaped, a hiring manager or bar raiser, sometimes a CTO final (TS9, S5). One 2025 senior loop had homework, then a code review of the submission next to a system design, with testing and CI/CD questions (TS14).
- S1 (2025): an easy-to-medium LeetCode problem and a team-specific design for one candidate; "no LC at all" for a Singapore commenter, who was given a real-life requirement to design and implement; "They said they look at oop and coding style."
- Payment-flavoured coding recurs: transfers between accounts (S6 2023, TS21 2024), a payment scenario with many edge cases (TS17 2025), an account balance that maintains state (TS9 2026).

### San Francisco and Seattle, 2026 (F1; S5; P1–P3)

- No US frontend account goes past the HR call (F1). A curated SWE page describes a new Seattle team's two-round screen, coding and system design, then the hiring manager, with a question on AI use (S5, T/P). The postings ask for React and TypeScript, micro-frontends and GraphQL (Spend), and web performance, SEO, accessibility, experimentation and agentic UX (Growth).

### Mainland China, 2018–2022 (R2; O5; S6, S7 backend)

- R2 (frontend, 2021-05): round one asked React 17's new features, class versus function components, webpack internals and custom loaders and plugins, and micro-frontends, and "没有问前端基础，没有问算法题"; round two asked about projects, base component design, Node memory leaks, a mistake (in English), micro-frontends with single-spa, and security.
- English is checked inside Chinese-language loops: R2's English question, O5 (2019, 2022), and the English team introduction in S7's VP round (backend, 2022).
- A 2026 news listing about an exit from China was seen during step 1 but not read; this variant may be historical (unverified).

### Early career (O4, O7; TS10, TS26)

- Interns in Singapore (2027 cohorts): an online assessment, a talent screen, live code, a hiring manager, with AI use assessed (O4). The early-careers page: two to three rounds (O7). TS10 (intern, 2026): a 15-minute recruiter call on why Airwallex and learning priorities, then technical. TS26 (interns, 2025): an OA with company history and values, Python, SQL and system design; two LeetCode mediums; live coding with two engineers; behavioural.

### Levels

- Mid (T2), senior (T5, T7, F1; all six frontend postings), staff (T8). No frontend account states years of experience. Senior candidates may meet the CEO or another C-suite member (S2, 2022; O1, 2022).

## The question list

One row per distinct question or task, by content (rule 1). Columns: the question in our words; the round as the source names it; the years the page would show; the number of independent first-person sources (plus T/P and official sources); the ids; the practice map (rule 6); the access proposal for new items; notes. Unverified means the row rests on a curated prep-site page or an artifact alone.

### A. Live UI builds

| # | question or task | round | years | sources | ids | practice | access (new) | notes |
|---|---|---|---|---|---|---|---|---|
| Q1 | Build a to-do list in React, then add unit tests and calls to an API, in the order you choose | applied coding round after a self-introduction (T1); round 1 next to an algorithm (T2) | 2025 | 2 | T1, T2 | Yakın: `react-todo-list` with its free four-round pressure mode (entry, filters, keyboard editing, undo); missing: tests the candidate writes, saving through an API | N1, premium | The interviewer guides and discusses (T1). No spec, time box or tooling reported. T2: "Not that hard." |
| Q2 | Fetch data, do simple operations on it and show the result on a basic UI | stage 1, a code challenge | 2025 | 1 | T3 | Var: `react-fetch-list-states`, `react-pagination-table` | — | Melbourne. The candidate called it very easy, added a polished UI and a thorough analysis of the data, and passed to stage 2. Live or take-home is not stated |
| Q3 | Receipt entries: a table of name and amount with a total row, a form that adds a row with field validation, a search that filters the rows and switches the total to the filtered sum | not stated (a live sandbox, by its look) | 2026 | 0 (+1 artifact) | G2 | Yakın: `react-filterable-user-list`, `react-debounced-search`, `react-contact-form-starter`; missing: the totals and the filtered total | — | Unverified: nothing says Airwallex set it. The candidate's notes record two clarifications: no virtualization needed, and the data can be trusted for now. Record only |

### B. JavaScript and TypeScript coding

| # | question or task | round | years | sources | ids | practice | access (new) | notes |
|---|---|---|---|---|---|---|---|---|
| Q4 | A scheduler for async functions keyed by name: tasks with the same name run one after another, tasks with different names run concurrently and independently. Follow-ups: cancel the running task of a name and move on to its next task; clear every running and queued task of a name | OA 1, coding | 2026 | 0 (+1 T/P) | R1 | Yakın: `js-concurrency-map-limit`, `js-take-latest`, `js-abortable-helpers`, `js-event-emitter-mini`; missing: per-name lanes, cancel and clear by name | N2, premium | Unverified (one curated page). The prompt calls it a scheduler "(event emitter)"; the question page says it tests "promise handling, race conditions and API design". Interface, error handling, platform and time box not reported |

### C. Algorithms and general coding

| # | question or task | round | years | sources | ids | practice | access (new) | notes |
|---|---|---|---|---|---|---|---|---|
| Q5 | A tree traversal coding question (the tree is not described) | a coding round (round 1 or 2; the account does not say) | 2025 | 1 | T2 | Var: `js-dom-find-node`, `js-build-tree-from-flat-list` | — | Topic only. General loops add a tree question written from scratch (TS11, 2026) and the shortest path of a tree (TS24, 2024) |
| Q6 | Dynamic programming: the largest sum along a path from the top of a triangle of numbers to the bottom; follow-up: the best path that must pass through a given cell | coding; two one-hour LeetCode-medium rounds (TS7) | 2021, 2026 | 3 for DP (T6, TS6, TS7), 1 naming the problem (TS7) (+1 T/P) | TS7, T6, TS6; R3 | Yok: new item | N4, free | T6 (frontend, 2021) names only "Dynamic programming related coding questions"; TS7 (SWE II, Singapore) a modified triangle with a follow-up; R3 has the same shape and may retell TS7 |
| Q7 | Count the connected components of an undirected graph | coding | 2026 | 1 | TS1 | Yakın: `js-maze-path` (grid search), `js-dom-find-node` (DFS and BFS on a tree); missing: an adjacency list and the component count | — | Senior SWE, Singapore. Unnamed graph questions in two more 2026 loops (TS6; TS7's graph DFS) |
| Q8 | Accounts hold balances: make transfers so that every account ends above a floor and output the transfers; then say what you would improve in engineering terms | coding, round 1 (S6) | 2023, 2024 | 2 (S6 names it; TS21 a bank-account transfers question) | S6, TS21 | Yok: new item | N5 (could), free | General, with a payments flavour; from a backend loop (S6, Shanghai) and an engineering-lead loop (TS21). Related unnamed prompts: an account balance that maintains state (TS9, 2026), a payment scenario with many edge cases (TS17, 2025) |
| Q9 | Merge paginated records from several data sources | coding, a two-round screen | 2026 | 0 (+1 T/P) | S5 | Yakın: `js-merge-sorted-arrays`, `js-concurrency-map-limit`; missing: page cursors across several async sources | — | Unverified; general SWE, a new Seattle team. Record only |

### D. Debugging, code review and AI-enabled rounds

No source reports a debugging round. The code review evidence is the review of your own take-home (Q23). The two-phase AI screen (about 30 minutes without AI, then a review or deep dive with AI allowed; S10, G3, TS12) is a format: it sits in the process notes and the spotlight, not in this list.

| # | question or task | round | years | sources | ids | practice | access (new) | notes |
|---|---|---|---|---|---|---|---|---|
| Q10 | Build Tic-Tac-Toe; in the AI-assisted version, then use AI tools to grow it into an app with a frontend and show that you understand what the AI produced (the backend half is trimmed) | live coding (TS8); an AI-assisted coding round (R3) | 2026 | 1 (+1 T/P) | TS8, R3 | Yakın: `react-tictactoe`; missing: the AI-allowed extension and a review of AI output | content R2 | TS8 (AI Engineer II) does not say AI was used; R3 (backend SWE II, Singapore) is curated and may retell TS8. The lead's map had Var (see Count) |

### E. Trivia and knowledge questions

| # | question or task | round | years | sources | ids | practice | access (new) | notes |
|---|---|---|---|---|---|---|---|---|
| Q11 | How would you optimise the performance of a React application with a large dataset? | round not stated (the account's technical round was coding on a shared screen) | 2025 | 1 | T4 | Var: `react-virtualized-list-recycling`, `react-usememo-vs-usecallback` | — | Singapore. An answer-guide candidate |
| Q12 | Class components versus function components: do they differ in memory and performance? | round 1 | 2021 | 1 | R2 | Var: `react-functional-vs-class-components` | — | "class component 与 functional component 比较。二者在内存和性能上是否有不同？" |
| Q13 | What React 17 changed | round 1 | 2021 | 1 | R2 | Yakın: `react-jsx-transform-and-why-not-required` (the new JSX transform), `react-why-event-delegation` (listeners on the root), `react-18-whats-new`; missing: one answer on React 17 | — | "是否了解react17新特性". Dated; a row the lead's map did not have |
| Q14 | How webpack works, whether you have written your own loader or plugin, and how you would speed up a build | round 1 | 2021 | 1 | R2 | Yakın: `js-tree-shaking`, `react-code-splitting-module-federation`; missing: loaders versus plugins, writing one, build-time tuning | — | "webpack 原理，有没有自己写过loader和plugin，怎么做性能优化？" P4 (2026) asks for Webpack or Rollup |
| Q15 | Micro-frontends: what they are, how several apps share common libraries, and the problems they bring (the team used single-spa) | rounds 1 and 2 | 2021 | 1 | R2 | Var: `react-code-splitting-module-federation` (shared dependencies across separately deployed apps; single-spa is not covered) | — | R2 guessed the shared-library question came from a gap in the team's own setup: "是否了解微前端？（对方用了微前端，但是没有解决多应用间common lib的问题，估计是想问我这个）"; round 2: "聊了一下微前端，以及可能会遇到的问题（他们用了single-spa）". P1 and P4 (2026) name micro-frontends |
| Q16 | A conversation about frontend security (no question given) | round 2 | 2021 | 1 | R2 | Var: `js-xss-dom-sinks`, `js-escape-vs-sanitize`, `js-secure-cors-handling` | — | Topic only: "聊了一下安全相关的事情" |

### F. System design and problem solving

| # | question or task | round | years | sources | ids | practice | access (new) | notes |
|---|---|---|---|---|---|---|---|---|
| Q17 | Design a reusable autocomplete search input on top of an existing search API: the API with pagination and a limit; the component architecture (input, label, field wrapper, popup, portal, portal manager); throttling versus debouncing; local result caching (LRU versus string distance versus popular results); the public props; exported versus internal components | OA 2, design | 2026 | 0 (+1 T/P) | R1 | Var: `realtime-search-debounce-cache`, `react-autocomplete-search-starter`, `js-autocomplete-engine`, `component-design-system-architecture`; also `js-create-lru-cache`, `react-modal-tooltip-portal`, `debounce-vs-throttle-search-input` | — | Unverified (one curated page). The topic list as written: "component architecture: input, label, field wrapper, popup modal, portal, portal manager", "local result caching: LRU vs. string distance vs. popular results" |
| Q18 | How you think about designing base components | round 2 | 2021 | 1 | R2 | Var: `component-design-system-architecture` | — | "对基础组件设计的理解". Split from Q17. P5 and P6 (2026) ask for judgement in "choosing the right level of abstraction" |
| Q19 | Design the architecture behind a live messaging app (the official example of the system design round) | system design and problem solving | 2022 | official | O1 | Var: `messaging-inbox-frontend` | — | Not a report. Trimmed to the client side |
| Q20 | Design a comment feature for an online document editor, like Google Docs comments | system design | 2024 | 1 | TS22 | Yakın: `react-nested-comments`, `live-comments-global-stream`; missing: comments anchored to ranges of text | — | General SWE, Singapore. Trimmed: storage and sync on the server |
| Q21 | Ambiguous real-world problems, scoped out loud and mapped to data structures without code: the fastest way to cross a city (the official example), how a CD player works, brain teasers at the end of a final | problem solving; final | 2022, 2023 | 2 (+official) | T5, S2, O1 | Yok: guide content | content R3, open | T5 (Sydney, senior frontend) had "brain-teasing questions at the end"; S2's role is not stated |

### G. Take-homes

| # | question or task | round | years | sources | ids | practice | access (new) | notes |
|---|---|---|---|---|---|---|---|---|
| Q22 | The invite-request landing page (in our own words below) | take-home, offered instead of live coding (O1) | 2021, 2023 (in use 2016–2025) | 2 (+official, +64 solution repos) | T6, T5, O1, G1 | Yakın: `react-contact-form-starter` (a validated form that posts, with loading, success and error), `react-modal-tooltip-portal` (a dialog through a portal), `html-forms-validation-required`; missing: the whole brief | N3, premium | T6 names its theme; T5's take-home ("building a simple application") fits the 2023 version but is not named. Possibly retired after April 2025 |
| Q23 | Walk reviewers through your take-home: your approach and stack, how you would improve the code, your tests, what production would need | a 1.5-hour panel with two senior members (T5); the code review that opens the design round (O1); a code review of the submission next to a system design, with testing and CI/CD (TS14) | 2022, 2023, 2025 | 2 (+official) | T5, TS14, O1 | Yakın: `react-take-home-table-review-questions` (the review format, for another take-home); missing: this take-home's questions | content R1 with N3, premium | O1: the reviewer will "ask how you think you could improve it" |

#### The take-home in our own words (Q22)

- **What to build.** A one-page site for a fictional online service that has not launched yet and lets visitors request an invitation.
- **Layout.** The page fills the screen height. A header stays at the top and a footer at the bottom; the middle holds a heading, a short line of text and one button. A rough layout sketch is supplied; desktop keeps that layout, the styling is free, and the page must work on a phone without zooming.
- **Form.** The button opens a dialog with three fields: full name, email, and the email again. All are required; the name needs at least three characters; the email must look valid; the second email must match the first.
- **Sending.** With invalid input nothing is sent and the problems are shown (one version asks to highlight the bad fields; later versions leave the feedback to the candidate and allow inline messages). With valid input the app posts the name and email as JSON to an endpoint the brief supplies and shows that the request is being sent.
- **Answers.** On success the dialog turns into a confirmation that closes back to the page. On a client error the app shows the server's own message and the user can send again. The server rejects one reserved address with an already-in-use message, so candidates can exercise the error path; that server contract did not change from 2019 to 2025.
- **Versions.** (1) Any current library or framework (React given as the example), any current build tool and styling method, support for today's browsers, and tests: seen in solution repos created 2019 to 2022. (2) React required, a build tool such as Create React App or webpack, inline errors allowed, UI tweaks welcome within the layout: a 2020 copy, partly also in 2018. (3) React required, unit tests required, built to production standard, typed code welcome, flexbox and grid allowed: a 2023 copy. Versions 1 and 3 ask for a repository or archive with a README on building, running and testing, and say to use the supplied API rather than build a backend (the 2020 copy of version 2 omits that part).
- **Time box.** None in any version. O1 says candidates typically spend 3–4 hours; two solvers wrote that they ran out of time (2019, 2020).
- **What reviewers look at.** Whether it works, readability and test quality (O1); your approach and stack in a 1.5-hour panel (T5); how you would improve it (O1); testing and CI/CD in a 2025 general homework review (TS14). Topics solvers answer in advance in their READMEs: production readiness, accessibility, error handling, the choice of form and state libraries, the styling approach, typing, CI and end-to-end tests.
- **What solvers test (acceptance ideas, 10 repos sampled 2016–2025).** The dialog opens and closes (button, outside click, Escape); errors for an empty submit, a short name, a bad email and mismatched emails; no request while the input is invalid; a sending state; the success view on 200 and closing it; the server's message on 400; a retry after a 400 that succeeds; a network-failure message; fields and errors reset when the dialog closes; the full-height layout and a phone-width view.
- **Stacks over time.** React with Redux and Enzyme (2016–2018); Create React App, styled-components, Formik or React Hook Form, Testing Library and Cypress (2019–2021); TypeScript, Vite, MSW and React Query (2022–2023); Next.js, Zod, TanStack Query, Vitest and Playwright (2024–2025); two Vue solutions (2020, 2021) under version 1.
- **Status.** No solution repo created after April 2025 was found on 2026-11-25, and the 2025 frontend accounts describe live tasks. The take-home may have been retired; not confirmed.

### H. Conversations

| # | question or task | round | years | sources | ids | practice | access (new) | notes |
|---|---|---|---|---|---|---|---|---|
| Q24 | A recent project in depth: how you worked, the technology decisions, the challenges and how you solved them, what you would do differently; expect a follow-up on every answer | project and behaviour round and final (T5); stage not stated (T8); round 2 (T2, R2); technical rounds (T6); onsite deep dive (TS13); hiring manager (O6); bar raiser (R3) | 2021, 2023, 2024, 2025, 2026 | 6 (+official, +1 T/P) | T5, T8, T2, T6, R2, TS13; O6; R3 | Var: guides `/guides/behavioral/stories`, `/guides/behavioral/fe-advanced` | — | R3's advice: have "two or three solid projects ready" and expect "many layers of follow-ups about your decisions" |
| Q25 | How you use AI in your daily work; whether you would delegate a task to an agent that picks its own tools | bar raiser (O6); a screen (S5) | 2026 | official (+1 T/P) | O6, O4, S5 | Yok: guide content | content R2, open | The intern postings assess problem solving "with and without AI assistance" (O4) |
| Q26 | Your motivations and behaviours, and how you fit Airwallex's core values and operating principles | bar raiser (O6); final with a senior leader (O1) | 2022, 2026 | official (+1 context) | O6, O1, S2 | Var: guide `/guides/behavioral/stories` | — | Senior candidates may meet the CEO or another C-suite member (S2, O1). The postings link the operating principles |
| Q27 | A mistake you made and how you fixed it, asked in English in a Chinese-language interview | round 2 | 2021 | 1 | R2 | Var: guide `/guides/behavioral/common-questions` | — | "直接用英语问你之前有没有犯过什么错误，以及怎么解决" |
| Q28 | Do you have prior experience with FX? | in-person interview | 2019 | 1 | T7 | Yok: guide content | content R4 (could), open | Domain fit; the Growth and Scale postings list fintech or payments experience as a plus |
| Q29 | Why Airwallex, and what you want to learn first | a 15-minute recruiter call (intern) | 2026 | 1 | TS10 | Var: guide `/guides/behavioral/common-questions` | — | Software engineer intern |

## Count

- **Rows: 29,** numbered Q1 to Q29: A 3, B 1, C 5, D 1, E 6, F 5, G 2, H 6. This is the first numbering; nothing was numbered and then removed. Items left out at the start are listed below without numbers.
- **By content:** 16 frontend rows (Q1–Q4, Q10–Q20, Q22; Q10, Q19 and Q20 trimmed) and 13 general rows (Q5–Q9, Q21, Q23–Q29).
- **By evidence:** 22 rows have an independent first-person source. Unverified: Q4 and Q17 (one curated page; locked only as marked), Q9 (curated) and Q3 (an artifact), the last two record only. Official only: Q19, Q25 and Q26 (Q25 also has a curated page; Q26 a Blind comment on meeting the CEO).
- **Practice map:** Var 13 (catalog 9: Q2, Q5, Q11, Q12, Q15, Q16, Q17, Q18, Q19; guides 4: Q24, Q26, Q27, Q29); Yakın 11 (Q1, Q3, Q4, Q7, Q9, Q10, Q13, Q14, Q20, Q22, Q23); Yok 5 (catalog items: Q6, Q8; guide content: Q21, Q25, Q28).
- **Changes to the lead's map (13 questions):**
  - Tic-Tac-Toe, Var to Yakın (Q10): the AI-allowed extension, the point of the 2026 round, has no practice.
  - The autocomplete row is split in two, both Var: Q17 (the 2026 OA) and Q18 (the 2021 base-component question). Q17 gains `js-create-lru-cache`, `react-modal-tooltip-portal` and `debounce-vs-throttle-search-input` for the caching, portal and throttle-versus-debounce follow-ups.
  - Additions within the same class: `js-event-emitter-mini` on Q4 (the prompt names an event emitter); the to-do pressure mode on Q1; `react-code-splitting-module-federation` on Q14. The DP row is made concrete (Q6: the triangle problem). The other eight keep the lead's class and ids.
  - New rows the lead's map did not cover (it left out take-homes and conversations): Q7, Q8, Q9, Q13, Q19, Q20, Q21, Q22, Q23, Q24–Q29.
- **Left out (not numbered):**
  - Backend or infrastructure (rule 1): Node memory leaks (R2, round 2: "是否有遇到过node 内存泄漏问题，怎么解决"; it would come back if the page targeted the Billing team's Node BFF work); designs of a booking site down to SQL tables (TS7, R3, S7), a payment system for banking (TS18), Ticketmaster and a real-time robot-chase game with server state (S5), an inverted index (S6); a safeguard that keeps a wallet balance from going negative (TS19, concurrency); MySQL, slow queries and Spring internals (S6); distributed transactions (S7); database questions (TS20); the interns' Python and SQL assessment (TS26); a Python app built from scratch (TS16).
  - Not clearly client or server: a feature that downloads external files (TS9, engineering lead, 2026). No prompt given: a domain system design (TS4), a design relevant to the team (S1).
  - Algorithms from backend loops before 2024 with no 2024–2026 echo: 3Sum and the soda-bottle problem (S7, 2022), reversing a linked list in groups of k (S6, 2023).
  - Unclear one-line prompts: the fastest speed over a 100-metre interval (TS23, 2024); a 2Sum-like problem and list compaction (TS5, about 2021).
  - Generic exercises and formats, moved to stage cells (the Binance precedent): describing or implementing a sort (T8, TS25, 2024); a LeetCode-style simulation in OOP (TS2); easy-to-medium LeetCode problems (O1, S1, TS6, TS20); basic frontend questions (T2); general questions in person (T3); the self-introduction (T1, T6, R2); questions for the interviewer (T1); a design challenge (T8); the two-phase AI screen (S10, G3, TS12).
  - Folded into a row: the CD player (S2) into Q21; the account-balance and payment-scenario prompts (TS9, TS17) into Q8's note; the tree question written from scratch and the shortest path of a tree (TS11, TS24) into Q5's note; the unnamed graph questions (TS6, TS7) into Q7's note.
- **Most repeated:** the project deep dive (Q24: six accounts 2021–2026, plus the 2026 London stages); the take-home and its review (Q22, Q23: two frontend accounts, the official process, a 2025 general homework review and 64 solution repos, 2016–2025); the React to-do list (Q1: two 2025 accounts); DP and graph questions (Q6, Q7: a 2021 frontend loop and three 2026 general loops, plus a curated page); AI in the loop (Q10, Q25: three official 2026 pages and five general-SWE reports, most of them curated or second-hand); micro-frontends (Q15 in both rounds of one 2021 account, plus two 2026 postings).
- **Gaps for a page:** no frontend account describes an AI-allowed round; no US frontend account goes past the HR call; the only frontend design questions after 2021 come from one curated 2026 page (Q4, Q17); no report asks about CSS, accessibility or TypeScript, although the postings ask for all three; the newest independent frontend account with rounds is from October 2025; the take-home's status after April 2025.

## Proposed interview process tables

The registry rule holds: a stage cites only sources read in full (T1–T8, O1, O6 here). The page shows the years only; the sources column stays in this record.

**Table 1. Frontend engineer, Singapore, 2025 (T1, T4; T2 of unstated location)**

| Stage | What happens | Who | Sources (record only) | Page label |
|---|---|---|---|---|
| Recruiter or HR screen | A phone screen with HR about your background and experience; some candidates come through a recruiter | All | T4, T1 | 2025 |
| Technical round 1 | A self-introduction, then live coding: a to-do list in React, extended with unit tests and API calls in the order you choose, with the interviewer guiding; or coding problems on a shared screen while you explain your approach. Basic frontend questions and an algorithm can sit beside the React task (one account names a tree traversal); a React performance question on a large dataset | All | T1, T2, T4 | 2025 |
| Technical round 2 | Your previous projects and one more algorithm | Candidates who pass round 1 | T2 | 2025 |
| Third round | Not described in the accounts | Some candidates | T4 | 2025 |

About two weeks in total (T1).

**Table 2. Frontend engineer, Australia: Sydney 2023, Melbourne 2025 (T5, T3)**

| Stage | What happens | Who | Sources (record only) | Page label |
|---|---|---|---|---|
| Recruiter screen | 30 minutes | All | T5 | 2023 |
| Project and behaviour interview | One hour with an engineering manager and a lead engineer | All | T5 | 2023 |
| Coding exercise | Sydney 2023: a take-home that builds a simple application. Melbourne 2025: a very easy code challenge that fetches data, does simple operations on it and shows it on a basic UI | All | T5, T3 | 2023, 2025 |
| Take-home review panel | 1.5 hours with two senior members working through your code, your approach and your stack | Take-home candidates | T5 | 2023 |
| Final | One hour with an engineering director and a senior engineer: a project deep dive with layered follow-ups, architecture questions and brain teasers at the end. Melbourne 2025: an in-person stage of general questions | Candidates who pass | T5, T3 | 2023, 2025 |

About two weeks (T3, T5). Page copy, not a row: Melbourne 2019, an in-person interview with a question on FX experience, four weeks (T7); a 2024 staff loop with an experience interview, a take-home or live code and a design challenge (T8).

**Table 3. The engineering process Airwallex published in 2022 (O1)**

| Stage | What happens | Who | Sources (record only) | Page label |
|---|---|---|---|---|
| Recruiter call | The role and the process | All | O1 | 2022 |
| Tech screen, 60 minutes | Your background and a coding challenge at the level of easy and medium LeetCode problems | All | O1 | 2022 |
| Take-home (3–4 hours) or live coding (60 minutes) | Your choice; readable code, reasonable assumptions and a few tests; live coding adds edge cases, iteration and the time complexity | All | O1 | 2022 |
| System design and problem solving, 60–90 minutes | Opens with a code review of your take-home if you chose it; then a product's technical design, or an ambiguous real-world problem mapped to data structures | All | O1 | 2022 |
| Final, 60 minutes | A senior engineering leader (the CEO, the CTO or a VP of Engineering): culture fit and values | All | O1 | 2022 |

**Table 4. London engineering roles, 2026 (O6)**

| Stage | What happens | Who | Sources (record only) | Page label |
|---|---|---|---|---|
| Coding interview | Not described further | London engineers | O6 | 2026 |
| System design interview | Not described further | London engineers | O6 | 2026 |
| Hiring manager interview | Your career background and project experience | London engineers | O6 | 2026 |
| Bar raiser | Your motivations, behaviours, fit with the core values and operating principles, and how you use AI in your work | London engineers | O6 | 2026 |

Under Tables 3 and 4, one line: since 2026 the engineering interviews test working with AI rather than banning it (O2).

**Drafts for page copy (not for the registry):**

- **Frontend online assessments, 2026 (R1, unverified):** OA 1 coding (the name-keyed scheduler), OA 2 design (the autocomplete input), then, as listed, system design, behavioural, leadership and a bar raiser.
- **Mainland China frontend, 2021 (R2):** round 1 on React 17, class versus function components, webpack and micro-frontends, with no fundamentals and no algorithms; round 2 on projects, base component design, micro-frontends with single-spa, security and a mistake asked in English (Node memory leaks trimmed). Context: a written test after the CV (2018) and Chinese interviews with English checked (2019, 2022) (O5).
- **The AI-era screen (general software roles, 2026):** about 30 minutes without AI or docs, then a review or deep dive with AI allowed (S10, G3); coding and discussion with AI (TS12); an AI-assisted build (R3). Not yet in a frontend account.
- **United States:** an HR call for senior frontend roles (F1); a new Seattle team's two-round screen (S5).
- **Early careers:** two to three rounds (O7); interns: an assessment, a talent screen, live code and a hiring manager, with AI use assessed (O4).

## New items to build (each needs the user's separate yes)

### Catalog items

**N1. To-do list in three parts: build, tests, API** (React and TypeScript; premium, a company signature). Evidence: Q1 (T1, Singapore 2025; T2, 2025).
- **Goal:** rehearse the 2025 applied coding round: a small React list first, then unit tests and API persistence, in the order the candidate picks.
- **Inputs (ours):** a starter; a provided in-memory API module (list, create, update, delete) with latency, a switch that fails the next call, and a call log; a stub test file; seed data of our own.
- **Part 1, build (about 15 minutes):** add a task (trimmed, not blank), toggle it, delete it, show the count of open tasks, with accessible names.
- **Part 2, tests:** the candidate writes unit tests for that behaviour: adding trims and rejects blanks, toggling flips one task, deleting removes one, the count is right.
- **Part 3, API:** load tasks on mount with loading, error and retry; create, toggle and delete through the API; on a failed save, show an error and return the row to the server's state (or undo an optimistic change); ignore a response that arrives after a newer one.
- **Checks:** parts 1 and 3 with today's step checks (typing, clicks, waits, counts, live regions) through the DOM and the fake API's visible state. Part 2 by mutation: the candidate's tests pass on our reference, and each faulty version (blank tasks accepted, toggle flips every task, delete removes the wrong row, count off by one) fails at least one of them.
- **Follow-ups:** optimistic versus pessimistic updates; how you would test the API part (a mock server or a fake module); what you tested first and why.
- **Time box:** 60 minutes (ours; no report gives one).
- **Runner:** part 2 needs the candidate-written test capability (below); part 3 needs nothing new with a provided API module.

**N2. Name-keyed async task scheduler** (JavaScript or TypeScript; premium, a company signature). Evidence: Q4 (R1, 2026; unverified).
- **Our interface (our design, not the reported one):** `createScheduler()` returns `schedule(name, task)`, `cancel(name)`, `clear(name)` and `on(event, listener)`; a task receives an `AbortSignal` and returns a promise; `schedule` returns a promise for the task's result.
- **Behaviour:** one first-in-first-out lane per name; lanes run concurrently; a task that throws or rejects settles its own promise and its lane moves on; `cancel(name)` aborts the running task, rejects its promise with an `AbortError` and starts the next queued task of that name; `clear(name)` aborts the running task and rejects every queued task of that name; other names are untouched; cancelling or clearing an idle name does nothing; a task may schedule another; `start`, `done`, `error` and `cancel` events fire in order.
- **Checks (fake timers):** order within a lane; overlap across lanes; a failure does not stall its lane; cancel rejects with `AbortError` and starts the next task at once; a task that ignores its signal cannot settle its promise after a cancel; clear rejects every queued task of its name; scheduling from inside a task; event order; no timers left behind.
- **Follow-ups:** a global concurrency limit across lanes; priorities; per-task timeouts; retries; what cancel means for a promise that ignores the signal.
- **Time box:** 45 minutes (ours). **Runner:** nothing new (`frontend/src/app/core/security/user-code-sandbox-suite.ts`, `user-code-sandbox-fake-timers.ts`).

**N3. Invite-request landing page, take-home style** (React and TypeScript; premium, a company signature; not in the lead's flags because the lead's map left out take-homes). Evidence: Q22, Q23 (T6 2021, T5 2023, O1 2022, G1 2016–2025).
- **Brand and data (ours):** a neutral fictional pre-launch service (working name Example Beta), our own copy, our own mock endpoint and our own reserved address that the mock rejects as already in use. Nothing from the original brief, sketch or server.
- **Behaviour:** as in the take-home section above, plus keyboard use: focus moves into the dialog and back, and Escape closes it.
- **Checks:** the dialog opens and closes (button, Escape, a click outside); an empty submit shows every error and sends nothing; a short name, a bad email and mismatched emails each show their error; a valid submit sends one POST with the name and email and shows a sending state while the answer is delayed; a 200 shows the success view, and closing it returns to the page; a 400 shows the server's own text; sending again after a 400 succeeds; a network failure shows an error; closing the dialog clears the fields and errors; the header and footer stay fixed; no horizontal overflow at a phone width.
- **Review follow-ups (R1):** what you would add for production; which tests you wrote and which you would add; why this form and state approach; how the dialog stays accessible; double submits; what you would change with more time.
- **Time box:** none in any version; O1 says 3–4 hours is typical; ours: the core in about two hours.
- **Runner:** `mockHttp` must return a response body so the page can show the server's own message (today every mocked answer is `{"id":1}`); a phone-width check may need a step that resizes the preview (none found in the step list; not verified). Optional: candidate-written tests, the same capability as N1.
- **Caveat:** the take-home may have been retired after April 2025; the item still trains the review panel's topics.

**N4. Number triangle: the best path, then the best path through a given cell** (JavaScript; free, a generic algorithm). Evidence: Q6 (TS7, 2026; R3, T/P; T6 2021 and TS6 2026 name DP only).
- **Behaviour:** `maxPathSum(triangle)` returns the largest sum from the top row to the bottom row, moving to one of the two adjacent numbers below; `maxPathSumThrough(triangle, row, col)` returns the largest sum among paths through that cell. Negative numbers allowed; a one-row triangle works; an invalid cell throws; the input is not mutated.
- **Checks:** fixed small cases; random small triangles against brute force, for both functions; 1,000 rows within the time budget; no mutation.
- **Follow-ups:** return the path itself; O(n) extra memory; the minimum instead of the maximum; why greedy choices fail.
- **Time box:** 30 minutes (the length of the no-AI half of the 2026 screen). **Runner:** nothing new.

**N5 (could; not in the first wave). Account transfers above a floor** (JavaScript; free). Evidence: Q8 (S6, 2023, backend; TS21, 2024).
- Given balances and a floor, return transfers `[from, to, amount]` that leave every account at or above the floor, or report that it is impossible when the total is below the number of accounts times the floor; amounts are positive whole cents and the total never changes. Checks: validity, the floor, the impossible case; fewest transfers as a stretch goal. Wait for a frontend or 2025–2026 source before building.

### Content pieces (not catalog items)

- **R1. Take-home review guide** (with N3; premium): the reviewers' questions (Q23) answered for our version of the take-home.
- **R2. AI in the loop** (decoder open; the drill's access is the user's call, behavioural drills being open on other pages): the 2026 facts (O2, O4, O6; S10, G3, TS12, R3, F1), an answer outline for Q25, and a drill: solve for 30 minutes without AI, then review and extend the same solution with an assistant, checking each suggestion. N4 or N2 serves the no-AI half; Q10's AI half points here.
- **R3. Problem-solving decoder** (open): how the ambiguous-problem round works (O1), with three prompts of our own (Q21).
- **R4. FX and multi-currency primer** (could, open): currencies, minor units, rounding, rates (Q28; P4's reconciliation line).

### Runner capabilities (read from the code on 2026-11-25)

- **JavaScript items** run a hidden test file that imports the candidate's module, in a describe and test DSL with Jest-style hooks (`frontend/src/app/core/security/user-code-sandbox-suite.ts`), with fake timers that advance synchronously or asynchronously (`user-code-sandbox-fake-timers.ts`). N2, N4 and N5 need nothing new.
- **Framework items** are checked by host-driven step lists (`FrameworkTestStep` in `frontend/src/app/core/models/question.model.ts`, run by `frontend/src/app/features/coding/coding-detail/opaque-dom-check-runner.ts`): typing, clicks, keys, focus, accessible names, live regions, timers, storage, layout and style checks, `mockHttp` and `expectHttpRequest`.
- **`mockHttp`** answers every request with the body `{"id":1}` and one status or a network error, for every URL; a later `mockHttp` step can change the status. A 400-then-200 sequence works; showing the server's own error text does not, and neither does a GET that returns a stored list. N3 needs a response-body field (a small change). N1's API part avoids it with a provided fake API module, as `react-fetch-list-states` does with its `fetchTeam`.
- **Candidate-written tests (new; needs the user's decision).** Nothing today runs tests that the candidate writes. A mutation mode would run the candidate's test file against our reference (every test must pass) and then against hidden faulty versions (each must fail at least one test), swapping the module under test at import time. For a JavaScript module this extends the existing runner; for a React component, the candidate's tests would also need render, query and event helpers inside the preview frame, a larger change. Proposal: N1's test part first targets a plain module (the list's state logic or its API client) in the JavaScript runner; React-level candidate tests later, if the first version earns its keep.

## Page package notes

- **Hero facts.** The official process (2022) with its take-home-or-live choice; the 2026 changes (interviews that test AI use; London stages with a bar raiser who asks how you use AI); frontend accounts from Singapore, Melbourne and Sydney, 2019–2025, and one curated 2026 assessment report; thin US evidence; 2021 notes from mainland China.
- **Spotlight candidates.**
  1. **AI in the loop (2026).** The newest and most distinctive element: three official 2026 pages and five general-SWE reports; the caveat that no frontend account describes it yet. Content: R2.
  2. **The take-home and its review (2016–2025).** The longest-running frontend task, described in our own words, with the review questions; practice N3 and R1; caveat: possibly retired.
  3. **The React task in parts (2025).** Build, then tests and API calls in your order; practice N1.
- **Signature round for the directory (proposal).** Take-home and review panel, with the freshness caveat; fallback: React to-do in parts.
- **Lock or open (27 rows on the page; Q3 and Q9 stay in this record).**

| Lock (10) | What the unlock adds | Open (17) |
|---|---|---|
| Q1 to-do in parts | the parts and the free order; N1 | Q5 tree traversal |
| Q2 fetch, process, display | the stage facts; practice links | Q7 connected components |
| Q4 name-keyed scheduler (unverified) | the lanes, cancel and clear; N2 | Q8 account transfers |
| Q6 number triangle | the problem and its follow-up; N4 | Q12 class versus function |
| Q10 Tic-Tac-Toe with AI | the AI-assisted extension; practice and R2 | Q13 React 17 |
| Q11 React with a large dataset | practice; an answer guide | Q14 webpack |
| Q15 micro-frontends | the shared-library and single-spa follow-ups; practice | Q16 security |
| Q17 autocomplete design (unverified) | the topic list; practice links | Q18 base components |
| Q22 invite-request take-home | the brief in our words; N3 | Q19 messaging app (official) |
| Q23 take-home review | the review questions; R1 | Q20 document comments |
| | | Q21 ambiguous problems; Q24–Q29 conversations (open by design) |

- **Method note for the page bottom (no site names):**

> How we collected these questions: we read first-person interview reports that candidates published on interview-review sites and community forums, interview notes candidates shared publicly, and Airwallex's own careers pages and job postings, all on or before 25 November 2026. Each question appears once however many reports mention it, with the years it was reported. We kept frontend questions and the general ones frontend candidates also get, such as algorithms, behavioural questions and take-home reviews, and left out backend-only topics such as database design. A take-home known only from candidates' published solutions is described in our own words with our own example brand, never in the original brief's words. A few questions come from a single report; we include them when the task is specific enough to practise.

- **Freshness line:**

> Reports from 2019 to 2026; the newest frontend report is from August 2026. Airwallex's own process pages are from 2022 and 2026. Checked 25 November 2026.

- **Plan and profile inputs.** `framework: 'react'` (every frontend posting, and every frontend account that names a framework, names React; Billing also asks for Vue or Angular). Alias: `空中云汇`, the Chinese name used by the Shanghai sources. Variant ids: `singapore` (default), `australia`; the official tables as `official`; China and the US as page copy.

## Open questions and unverified items

- **The take-home after April 2025:** no solution repo is dated later, and the 2025 frontend accounts describe live tasks. Retired or simply unpublished is unknown.
- **R1** is a curated prep-site page with no location; Q4 and Q17 rest on it alone.
- **R3** may retell TS7 and TS8; both are curated or summarised.
- **G2 (Q3):** whether Airwallex set the receipt task.
- **The two-phase AI screen** comes from a paywalled preview (S10) and a paraphrase of a private guide (G3); whether frontend screens use it is unknown, and a Glassdoor snippet (not citable) is said to report no AI in a 2026 Singapore coding interview.
- **Thin spots in the accounts:** T5's take-home is not named; T3's challenge may be live or take-home; T4's third round and T2's location are not given.
- **TS1–TS27** are the lead's summaries, not Taro's words; the slug dates are posting dates (TS5 was about 2021).
- **R2's city and outcome** are inferred or unknown; the mainland-China variant may be historical (the 2026 news listing was not read).
- **Unread pointers:** an Airwallex interviewer's LinkedIn article (2021); LeetCode posts (an intern compensation post, a 2022 contest with interview invites, a frontend HackerRank post that may not be Airwallex); three Zhihu questions; a 2018 WeChat recruiting article; the 1point3acres threads, including a frontend second-round thread; the full singdev story; Glassdoor reviews (not citable).
- **Decisions for the user:**
  1. Build N1, N2, N3 and N4 (N5 could) and the content R1–R4.
  2. The candidate-written test capability (N1; optional for N3) and the `mockHttp` response body (N3).
  3. Whether general software-engineer rows (Q6–Q8, Q20, Q29) appear on a frontend page; the proposal is yes, open except Q6.
  4. Locking Q4 and Q17, which rest on one curated page.
  5. Whether N3 is worth building if the take-home was retired.

## Verification

- `node research_notes/check_binance_quotes_2026-11-18.mjs docs/references/airwallex-questions-and-process-2026-11.md --raw=<a copy of research_notes/traffic-candidates-2026-11/airwallex/raw and taro>` checks every double-quoted phrase in this file against the saved pages; the result is in Status.
- Every catalog id in the practice column was checked against the `origin/dev` catalog export of 2026-11-25 (504 items); the guide paths against `frontend/src/app/shared/guides/guide.registry.ts`.

## Status (2026-11-25)

- Record written from the step-1 report, the raw saves, the lead's Taro dump and the lead's catalog mapping; nothing built.
- Quote check (2026-11-25), run against a copy of `raw/` and `taro/` only, so the step-1 report's own wording cannot pass: 103 of 103 distinct quoted phrases found. Two exact phrases from the sandbox notes (G2) sit inside HTML comments, which the checker strips as tags; they were paraphrased instead of quoted.
- Rule 4 sweep: no GitHub URL, repository owner, brief wording, brief brand, endpoint or reserved test address in this file. All 38 catalog ids in the practice column exist in the export, and so do the three guide paths.
