# Verkada: reported frontend interview questions and interview process

> **Status, 2026-11-25.** Step 2 of the traffic-candidate research (`reports/company-traffic-candidates.md`): the research record, written from saved files only, with no web access in this step.
> **Nothing is built.** No page, catalog tag, plan entry or new question exists for Verkada; every mapping, lock decision and new item below is a proposal.
> **Companions.** `docs/references/binance-questions-and-process-2026-11.md` (format model) and `docs/references/disney-questions-and-process-2026-11.md`; internal inputs in `research_notes/traffic-candidates-2026-11/verkada/` and `research_notes/company-candidates-2026-11-24/sources/verkada.md` (both git-excluded).

## Why Verkada (rankability check of 2026-11-25)

- **Demand.** Seven Google suggestions name Verkada with a frontend term (count of 2026-11-24). The 2026-11-25 query family: `verkada frontend interview (questions)`, `verkada frontend engineer (interview)`, `verkada frontend software engineer`, intern queries (`verkada frontend software engineer intern`, `verkada frontend software engineering intern 2026`, `verkada intern 2027`, `verkada intern interview process`) and company-wide ones (interview process, questions, experience, timeline, leetcode, prep, onsite interview).
- **Page 1** (Google in the user's Chrome, en-US, personalisation off, 2026-11-25).
  - `verkada frontend interview questions`: 1 first-person host by the check's host list (a backend Reddit thread), 1 Glassdoor page, 0 authority guides. The other eight results are prep, template or aggregator pages, and one of them is a competitor's forum post.
  - Other queries (first-person / Glassdoor / authority): `verkada frontend engineer interview` 1 / 2 / 0; `verkada interview questions` 1 / 1 / 0; `verkada interview process` 2 / 1 / 0, with the careers page.
- **Rule.** Verkada meets the high-demand, soft-page-1 rule (demand ≥ 7, at most two first-person results, no authority guide) and is kept in the brand-interest group. A competitor has a company template and seven forum posts; neither ranks first.
- **Postings.** 8 frontend-titled jobs among 352 open on the Greenhouse board, all in San Mateo, unchanged from 2026-11-24 to 2026-11-25 (J1 to J8 below).
- **Sources.** 7 forum posts (2025-06 to 2026-03), 11 Taro pages with frontend content (2019 to 2025), 4 GitHub take-home families (23 candidate solution repos, 2018 to 2024), and the careers page and candidate privacy policy.
- **Decision.** Approved on 2026-11-25 as one of the first three companies, after the user ruled that forum posts count as sources.

## Research rules

1. **Content rule** (the user's rules of 2026-11-12 and 2026-11-25). Frontend questions stay, and so do the general questions frontend loops also ask: algorithms, behavioural, take-home review and debugging. Who was asked does not decide. Backend implementation, backend or distributed system design, network internals, OS and concurrency, SQL, security protocols and language-specific non-JS questions go. Mixed rows are trimmed and the trim is stated. Row numbers are stable from this version on, and Count lists everything left out.
2. **Source weight.** FrontendLead forum posts count. Taro counts. Template and prep sites (PracHub's curated stories and cards, Dataford, Prepfully, Glassdoor snippets) are corroboration only (T/P). They are never the sole basis of a locked row, and a row that rests on them alone is marked **unverified**.
3. **Page.** No per-question sources and no site names; only the year a question was reported. This record keeps the ids and URLs. The method note proposed under Page package names no site.
4. **GitHub.** No repository URLs, account names or brief texts in this file. A take-home is cited as `N candidate solution repos (years)`; the URLs stay in `research_notes/`.
5. **Take-homes.** Written in our own words: what to build, inputs, behaviour, constraints, time box, reviewer focus, follow-ups. No brief text, company data, design files or brand names.
6. **Practice column.** `Var: <id>` links as is; `Yakın: <id>` plus what is missing; `Yok: new item`. Ids come from the origin/dev catalog export of 2026-11-25 (504 items).
7. **Access default for new items.** Company-specific signature tasks are premium; generic algorithms and trivia are free.
8. Rule 8 of the brief (Notion's active take-home) does not apply to Verkada.
9. **Quotes.** Short and exact, taken only from saved files, with the source id next to each quote. Summarizer output is never quoted: every PracHub save, and the lead's condensed Taro index lines and bracketed process notes. `research_notes/traffic-candidates-2026-11/verkada/check-quotes-2026-11-25.mjs` checks the quotes and also scans this file for GitHub leaks.

**Access codes.**
- F: full text.
- S: sentence-level, such as a one-line question field or an index line.
- T: a prep-site or template item.
- P: a search snippet only.
- U: unreadable.
- GH: a candidate solution repository. A GH repo is a trace of a take-home, not an interview report.

**Dates.** A Taro date on the 1st of a month at 00:00 is Taro's placeholder, so it is marked (approx.). The page shows years only.

## Sources

### By class

| Class | Read | Used | Ids | Notes |
|---|---|---|---|---|
| FrontendLead forum | 7 posts, all on the `verkada` tag (2025-06-15 to 2026-03-29) | 7, counted | FL1 to FL7 | Full text in the JSON-LD; template-style self-reports; seven usernames; no outcome or location |
| Taro (read in the user's Chrome, 2026-11-25) | 28 pages | 11 with frontend content counted; 1 Android page left out; 16 general pages for contrast and general questions | TA1 to TA12, TG1 to TG16 | Dump: `research_notes/traffic-candidates-2026-11/verkada/taro/taro-dump-2026-11-25.md` |
| Blind | 1 frontend thread; about 150 threads in the 11-24 sweep plus 2 on 2026-11-25 | B1 (process only); general loops for contrast | B1, BG1 to BG13, BG15 | BGn is Cn of the 11-24 file; BG15 is the 2021 hiring thread |
| PracHub | 1 locked new-grad frontend story; 5 Verkada question cards; 1 guide; 9 general stories | Corroboration only | P1, PH-DP, T3, T4, T5, T6, PS1 to PS9 | Every save is summarizer output and is never quoted |
| Aced | Company page answers 404; no Verkada page found | None | none | |
| Medium and Substack | 1 candidate post on Medium; Verkada's own employee profiles; no candidate account on Substack | M1 counted for general questions | M1, O4 | M1 is a 2020/21 backend new-grad loop |
| Official | Careers page, candidate privacy policy (June 2026), 2025 internship blog, a 2023 new-grad frontend profile | Process facts | O1 to O4 | |
| Postings | 8 frontend-titled, read through the Greenhouse API on 2026-11-25 | Context | J1 to J8 | None states interview steps |
| Hacker News | 2 hiring-manager posts | Context (official voice) | HN1, HN2 | No candidate account on HN |
| GitHub traces | 4 take-home families, 23 candidate solution repos from 22 accounts | Take-home rows (counts only) | GH-TS 9, GH-FP 6, GH-EL 4, GH-LC 4 | URLs in `research_notes/traffic-candidates-2026-11/verkada/sources-step1.md` §6 and `raw/github-*.txt` |
| LeetCode | 2 posts (read by the lead in Chrome on 2026-11-24) | None | LC1, LC2 | LC1 is a pre-onsite question with no account; LC2 has no Verkada row |

### Frontend reports, counted

FrontendLead posts (`https://frontendlead.com/discuss/t/<slug>/<id>`; dates are `createdAt` in UTC; class F):

| id | URL | date | role and level as written | round | what it says |
|---|---|---|---|---|---|
| FL1 | https://frontendlead.com/discuss/t/verkada-frontend-interview-experience/2093 | 2025-06-15 | frontend interview; no level | phone screen | "I was asked to create a video component from an array of images to play pause and render to to any position I want to start the video from." Reply of 2025-06-25: "they had given me a sample api with with the response and this was just in the phone screen." |
| FL2 | https://frontendlead.com/discuss/t/verkada-frontend-software-engineer-technical-interview/2574 | 2025-09-08 | Frontend Software Engineer; "Mid-level (Software Engineer II)" | technical interview | "Build a Timeline Component for a Video Scrubber Feature:"; "Clicking on timeline markers should render the corresponding image."; "A provided function returned a JSON object with an index and image."; "Images were spaced at regular intervals (every 5–15 minutes)."; "Added play/pause functionality using an interval to auto-advance the index, simulating video playback." |
| FL3 | https://frontendlead.com/discuss/t/verkada-frontend-phone-screen/2765 | 2025-10-17 | Software Engineer; Senior; 7 years (topic title: frontend phone screen) | phone screen | "Build a freeze frame in react, with conditional logic to toggle pause and play feature"; "click on certain part of the control bar to handle where it stops"; "create buttons to handle the toggle state" |
| FL4 | https://frontendlead.com/discuss/t/verkada-senior-fe-phone/2916 | 2025-11-22 | senior FE; 10 years | phone screen on CodeSignal | "Implement the controller for a frame-by-frame player framework in CodeSignal."; "The controller should support jumping to any arbitrary frame, and it should be able to auto-play and pause."; the post says candidates are expected to be comfortable with timers and closures. A reply, "was it vanilla javascript?", is unanswered |
| FL5 | https://frontendlead.com/discuss/t/verkada-phone-screen/2931 | 2025-11-27 | Senior Engineer; 10 years | phone screen | "React problem to construct video from images, abilty to pause and play the video, like a carousal" |
| FL6 | https://frontendlead.com/discuss/t/verkada-interview-experience/3318 | 2026-03-11 | Frontend Engineer; 4 years | phone screen | "fetch items from api and display result" |
| FL7 | https://frontendlead.com/discuss/t/verkada-frontend-engineer-interview-experience/3357 | 2026-03-29 (edited 2026-11-02) | Frontend Engineer | "Frontend coding round" | "Build a small UI that cobbles data from two different APIs."; "Render a list of cards, each card showing an image thumbnail."; "When you hover over the image, the card should start playing a video and the video should replace the image. When the mouse leaves, the video stops and the image comes back."; "Difficulty felt moderate if you're comfortable with typical frontend UI work." |

Taro pages with frontend content. The URL is `https://www.jointaro.com/interviews/companies/verkada/experiences/<slug>/`, and the full slugs are in `research_notes/traffic-candidates-2026-11/verkada/taro-read-list.txt` (TA11 is in the dump only). Quotes come from the process and questions fields as dumped.

| id | slug hash | title, place | date | outcome | what it gives |
|---|---|---|---|---|---|
| TA1 | 32e1ef55 | Senior Frontend Engineer, United States | 2025-07-29 | no offer | "Then, a tech interview with another engineer over Zoom and coding software online."; question "To build a UI from Figma." |
| TA2 | c0894851 | Senior Frontend Engineer, San Mateo | 2025-07 (approx.) | accepted offer | Just under a month from application to offer; "It began with a short call from a recruiter, followed by a technical online interview, and concluded with an onsite loop at HQ featuring several technical and behavioral interviews." Questions not shared, but "closely related to Verkada's business and the kind of challenges you'd face in the day-to-day role" |
| TA3 | 2b4c33e4 | Software Engineer, Canada | 2025-02-02 | no offer | Four parts: a recruiter call; "A frontend technical interview (e.g., building out a UI in a timed session)."; "A LeetCode-style interview."; "A behavioral interview with the engineering manager." Question: "Why do you want to work here?" |
| TA4 | ec2a77db | Software Developer, Canada | 2024-10-31 | no offer | Screening, a front-end technical interview, another technical interview, a behavioural interview; "Build a mockup based on a design."; "I would emphasize practicing CSS and styling." |
| TA5 | 16aa3df6 | Senior Software Engineer, United States | 2024-09 (approx.) | no offer | First coding round "a straightforward React challenge", rejected the next day: "Build a simple React component with various requirements. The question had three different steps." |
| TA6 | 68669dbd | Senior Frontend Engineer, San Mateo | 2024-06 (approx.) | no offer | A one-hour virtual technical interview with a team member, then a four-hour onsite; "All the questions focused on frontend development, which I appreciated. There were no LeetCode-style problems."; "Build a grid that enables cell selection." |
| TA7 | 07f644c0 | Front End Lead, San Mateo | 2024-05 (approx.) | no offer | A video call with the lead of an engineering team under marketing (the dump condenses this line); question "Are you familiar with CSS animation?" CMSs and localization were also raised |
| TA8 | 9f9b35d6 | Senior Android Engineer, United States | 2024-02-29 | no offer | Android loop; left out (see Count) |
| TA9 | 74abc463 | Senior Frontend Engineer, San Mateo | 2023-12 (approx.) | no offer | Recruiter on LinkedIn, then a technical phone screen: "Given a simple design in Figma, implement the UI using React (or your framework of choice). Styling is relatively important. Functionality involves basic interactions, such as click handlers."; "I didn't get to some of the styling details, but I had the layout generally implemented." No reply after a month |
| TA10 | d025c3c1 | Frontend Engineer, United States | 2023-12 (approx.) | no offer | Recruiter on LinkedIn; the position was filled, then a tech screen a month later: "The interview was with the hiring manager, mostly coding and quizzing me on React knowledge." |
| TA11 | cd0f189f | Senior Software Engineer, San Mateo | 2023-12 (approx.) | no offer | A technical phone screen, then "a full day of three more technical interviews and a less technical manager interview", with lunch with the team; "I was mostly asked React questions, and I hadn't really prepared for that."; questions: "Fix some broken JS code. Design a way to select a rectangular area in a grid layout. Design the frontend architecture for a camera display grid." |
| TA12 | 959b5497 | Frontend Engineer, United States | 2019-08-09 | no offer | Through a staffing agency: "I was given a take-home assignment on React with one week to work on it." |

Other first-person sources:

| id | source | date | role | what it gives |
|---|---|---|---|---|
| B1 | Blind, https://www.teamblind.com/post/verkada-onsite-frontend-interview-6v50jh22 | 2025-03-19 | frontend candidate before the onsite | "Also, there is one Algorithm round, is that supposed to be standard leetcode style questions?" Three later replies (2025-08 to 2026-05) only ask to DM |
| M1 | Medium, Shaurya Srivastava, "Unraveling Verkada’s Interview", https://shauryas481.medium.com/unraveling-verkadas-interview-14e043a0c30c | published 2021-11-03 (2020/21 season) | Software Backend Engineer, full time, new grad; no offer | Recruiter call (background, motivation, coding language), a custom CodeSignal assessment (three questions, 60 minutes), a 45-minute live screen, then a six-hour remote final: "The Final Onsite Interview consists of four separate interviews: Algorithms, Paired Programming, Architecture, and Culture interviews." The culture questions are rows Q21 to Q26 |

### General engineering loops (contrast, and general questions by content)

Taro general pages (the lead's index lines, class S; not quoted):

| id | hash | title, date | what the index line gives |
|---|---|---|---|
| TG1 | a78ab57c | Software Engineer Internship, US, 2025-03-03, accepted offer | take-home, two technical interviews, behavioural; a time you overcame a challenge (Q22) |
| TG2 | e22c9f40 | Senior Software Engineer, US, 2025-02-14 | a LeetCode-like problem on uniformly distributed indexes of a 2D matrix |
| TG3 | 725b5f4a | Backend Engineer, San Mateo, 2025-08-22 | assessment, HR screen, LeetCode round; a Kafka question (backend) |
| TG4 | 4d045296 | Software Engineer Intern, US, 2025-09-30, declined offer | three LeetCode-style rounds (HackerRank, two whiteboard), behavioural |
| TG5 | 2a9ca116 | Software Engineer Internship, South Korea, 2025-01-16 | LeetCode-style; a simple file system question |
| TG6 | 3344b80c | New Grad Software Engineer, US, 2024-01 (approx.) | CodeSignal pre-screen with two mediums, phone screen, 45-minute technical, onsite; a medium array and a medium graph problem |
| TG7 | 8612b963 | Backend Software Engineer, US, 2024-02-20 | one-hour assessment, background call, one-hour technical, manager interview |
| TG8 | 0946fc39 | Software Engineer, US, 2024-03 (approx.) | recruiter, 60-minute technical, a 3.5-hour final of four rounds, medium to hard; non-overlapping intervals |
| TG9 | 14aa2daf | Senior Software Engineer, San Mateo, 2024-02 (approx.) | phone screen of 30 minutes coding and 30 minutes design; five-round virtual onsite |
| TG10 | 5b59d592 | Senior Software Engineer, San Mateo, 2024-03 (approx.) | recruiter, technical screen, loop; interval ranges above a threshold over data points (Q12) |
| TG11 | d7cc24bf | Software Engineer New Grad, Seattle, 2024-01 (approx.) | 20-minute recruiter call, one-hour assessment, one-hour screen, four rounds (medium to hard and object-oriented design) |
| TG12 | 0184a138 | Principal Engineer, San Jose, 2024-11 (approx.) | a long two-graph screening question that had to run |
| TG13 | c319c562 | Software Engineer, San Mateo, 2024-04 (approx.) | recruiter, phone screen, onsite; Trie insert and iterate |
| TG14 | b8e69ce2 | Software Engineer Internship, US, 2024-08-22, declined offer | the recruiter asked which stack to intern in; LeetCode-style rounds and a take-home project; Two-Sum with constraints |
| TG15 | f35b3b5c | Software Engineer Internship, US, 2024-03 (approx.) | two LeetCode-medium technical rounds and a behavioural |
| TG16 | 6dea5221 | Senior Software Engineer, US, 2024-10-16 | recruiter did not show up |

Blind, general loops (URLs in the 11-24 file; raw copies under `research_notes/company-candidates-2026-11-24/raw/verkada/`):

| id | date | what it says |
|---|---|---|
| BG1 | 2025-03-31 | "the recruiter told me to install docker for the coding pair round" |
| BG2 | 2025-06-18 | Onsite plan: "1 Sys design", "2 pair programming", "1 cofounder", "1 hiring manager" |
| BG3 | 2025-05-11 | "Recruiter mentioned it was an internally developed LC style question. Med-Hard." |
| BG5 | 2023-07-25 | A reply: "it's not a centralized recruiting process. Each team has their own set of questions and expectations." |
| BG6 | 2023-07-31 | A reply that claims to be from Verkada: "We have a very limited set of questions we ask for each round and most engineers always choose the same questions depending on the interview." |
| BG7 | 2023-03-24 | "It is mentioned explicitly that there will not be any leet code style questions even in Algorithms round, but there will be one"; the poster says this held for new grad roles too |
| BG8 | 2020-11-01 | A new-grad reply: "Had an OA. Then talk with recruiter. Then a phone interview. Then another talk with recruiter. Then an onsite."; another: "Did a take home test and after submitting solution got a reject in few minutes." |
| BG11 | 2024-02-10 | A pre-pandemic ML candidate: "They sprung 8 (!) reference checks on me at the offer stage" |
| BG13 | 2024-04-30 | "Verkada (passed phone screen rejected by manager for fit)" |
| BG15 | 2021-10-17 | A comment, role unknown: "they told me the interview process was phone screen, phone interview, and on-site which would be pretty standard." and "But after onsite they just kept asking me for more rounds of interviews." |

BG4 (2025: hard LeetCode problems), BG9 and BG10 (embedded loops: pair programming, architecture, multithreading), BG12 (2024: a manager-run coding round) and BG14 (2026: a question-buying offer) add nothing frontend.

PracHub general stories (T, summarizer output; `research_notes/company-candidates-2026-11-24/raw/verkada/prachub-swe-*.txt`, numbered PS1 to PS9 in the files' alphabetical order):
- **Algorithm rounds:**
  - PS3, four-round onsite (2026-01): an LRU cache passed its tests, and an LFU cache was started but not finished.
  - PS4 (2026-09): a Sudoku board validation.
  - PS6 (2026-04): motion periods above a threshold across cameras.
  - PS8 (2025-12): two coding rounds on motion intervals.
  - PS9 (2025-10): a WordGuess scoring task.
- **Backend or networking, left out:**
  - PS1 (2026-09): a REST server for camera logs.
  - PS2 (2026-09): reaching every camera through nested groups; a write-up, not first person.
  - PS3's pair-programming database design and whiteboard design rounds.
  - PS4's voting-system design.
  - PS5 (2026-09): a Python log parser.
  - PS7 (2026-07): networking troubleshooting.

### Prep-site items (T, corroboration only)

| id | item | role, round, date | what it holds |
|---|---|---|---|
| P1 | Story, New Grad Frontend Engineer, three rounds, rejected after the behavioural | Frontend Engineer (New Grad); technical screen, HR screen, onsite; interview 2026-01, published 2026-08-25 | Story locked (sign-in and 20 XP); linked cards T5 and PH-DP |
| PH-DP | Card: a recency cache and a minimum-coins DP | Frontend Engineer (New Grad), onsite; dated 2026-01-10 in the company list | Overview only; links to P1 |
| T3 | Card: a JavaScript frame player controller | Software Engineer, technical screen, 2025-07-15 (updated 2026-07-04) | Inputs `renderFrame(index)`, `frameCount` and an FPS value; methods `play()`, `pause()`, `seek(frameIndex)`, `setFPS(fps)`, `currentFrame()`, `isPlaying()`; timers without overlap or drift, state in closures, cleanup; edge cases: seek while playing, invalid index, last frame, resume. Stop or loop at the end is left open |
| T4 | Card: a camera-card list from a defined visual contract | Frontend Engineer, technical screen, 2026-09-15 | One-line overview: responsive cards with a fixed preview ratio, status and missing-image states, semantic selection. Its only linked story does not name Verkada, so its source is unclear |
| T5 | Card: a React dashboard with filters | Frontend Engineer (New Grad), onsite, 2026-01-10 | Overview only: component split, controlled inputs, responsive CSS, empty states |
| T6 | Guide: Verkada software engineer questions | 2026-09-22 | Untraced frontend claims: a timed React grid of video player cards, rendering hundreds of live feeds without leaks, predicting call, apply and Promise output |

### Official pages, postings and hiring-manager posts

| id | source | date | use |
|---|---|---|---|
| O1 | Careers page, section Interviewing at Verkada, https://www.verkada.com/careers/ | no page date; saved 2026-11-24 | four official stages (see Official process facts) |
| O2 | Candidate privacy policy, https://www.verkada.com/candidate-privacy-policy/ | Last Revised: June 2026 | Verkada's own use of AI in interviews, the video vendor, checks before employment |
| O3 | Blog, Engineering at Verkada: a look into the 2025 software internship | 2025-10-02 | 30 software interns in 2025; frontend work on a stats page; nothing on interviews |
| O4 | Verkada's Medium profile of a new-grad frontend engineer (Cameras Home team) | 2023-08-16 | one line on meeting the team during interviews; no loop detail |
| HN1 | https://news.ycombinator.com/item?id=46109723 | 2025-12-01 | Senior/Staff Frontend (React), onsite in San Mateo; "I am the hiring manager."; engineering of 300 to 400 people |
| HN2 | https://news.ycombinator.com/item?id=47606590 | 2026-04-01 | An Access Control frontend manager: "My frontend team builds more than small widgets or forms."; the role asks for React and Redux depth and design sense |

| id | posting (Greenhouse job id) | first published | what it says |
|---|---|---|---|
| J1 | Senior Frontend Engineer - Fleet Management (5287692007) | 2026-11-09 | "Examples include user interfaces for new camera hardware initiatives (eg. our remote camera), Unified Event Timeline, our cameras home page, camera grids, and camera analytics dashboards."; "This role requires that you are on-site 5 days a week." |
| J2 | Senior Frontend Engineer - Access Control (5302630007) | 2026-11-19 | "Mastery of JavaScript: Scoping, closures, contexts, prototypes, classes, etc"; "Understanding of HTTP and practical debugging techniques"; 7+ years; onsite five days |
| J3 | Senior Frontend Engineer - Web Platform (5302631007) | 2026-11-19 | Microfrontend migration; "Experience with or a strong interest in AI-assisted development and integrating AI into engineering workflows." |
| J4 | Senior Frontend Engineer, Business Systems (5146916007) | 2026-05-26 | Partner and reseller tools; onsite at HQ |
| J5 | Staff Frontend Engineer - Design Systems (5233100007) | 2026-09-08 | "Partner deeply with the Product Design team to translate design visions and Figma tokens into robust, pixel-perfect, and interactive web components."; ARIA and WCAG |
| J6 | Staff Frontend Engineer - Mapping & Spatial Platform (5302618007) | 2026-11-19 | "For the past decade, floor plans have been static images; we are rebuilding that foundation from the ground up as a high-performance, interactive, and collaborative 3D engine."; JavaScript fundamentals and React state libraries |
| J7 | Embedded UI Engineer (5233101007) | 2026-09-08 | "Proficient in C/C++"; out of scope |
| J8 | Frontend Software Engineering Intern 2027 (5210942007) | 2026-08-25 | "Build best in class product experiences across our Command web platform (React) and mobile applications (React Native)"; "Experience building reusable components, utilizing CSS pre-processors and building pixel perfect user interfaces"; "Proficient understanding of JavaScript or TypeScript, including contexts, prototypes/classes and closures" |

### GitHub traces (counts only)

| id | task family | repos (accounts) | years | format |
|---|---|---|---|---|
| GH-TS | thumbnail timeline with infinite scroll | 9 (9), one of them a derived open-source component | 2018 to 2021 | take-home |
| GH-FP | camera placement on a floor-plan grid | 6 (5) | 2021 (November) | take-home; one solver's repository held the brief, read by the step-1 agent and not saved |
| GH-EL | event list with a large preview, from a design file | 4 (4) | 2023 to 2024 | called an assessment; live or take-home not stated |
| GH-LC | landing page with an autoplay carousel and an accordion, from a design file | 4 (4) | 2023 to 2024 | take-home, 4 to 8 hours in one solver's notes |

No solver repository was found for the 2025 and 2026 tasks (six code searches).

### Not cited

- **Glassdoor:** search snippets only (P). They mention a grid with cell selection, two coding rounds at the onsite (JavaScript and React), a one-week React take-home and an old thumbnail take-home "without libraries"; none is used.
- **Other prep and aggregator pages:** 1point3acres threads, Dataford, 4dayweek, lodely, Screena, InterviewDB, FastPrep, and a generated GitHub question list.
- **LC1 and LC2:** no account.
- **Other:** a private YouTube onsite vlog; no Reddit thread surfaced; dev.to and HN Algolia hold no candidate account.

## Official process facts

- **Four stages (O1).**
  - Initial screening: "The interview process at Verkada typically begins with a phone or video call with a recruiter."
  - Hiring manager screen: "This conversation includes a mix of behavioral and role-specific questions, as well as insights into Verkada and our current projects."
  - Technical assessment: "Depending on the role, candidates may be asked to complete technical assessments tailored to the position."
  - On-site interviews at an office: "This step often includes meetings with team members, technical exercises, and discussions about your experience and how it aligns with Verkada's needs."
  - No round count, duration or frontend-specific content.
- **AI.**
  - No rule on candidates' use of AI tools was found in the careers page, the policy, the eight postings or the HN posts.
  - Verkada's own use (O2): it may "record and analyze the interview content using tools that leverage artificial intelligence, where permitted (these tools support human decision-making and do not make hiring decisions)". The vendor list includes "Zoom (U.S.) - video interview hosting/recording".
  - J3 asks for interest in AI-assisted development.
- **Checks.** "we will then take up reference, employment background and other checks before commencing employment." (O2). A pre-pandemic candidate counted eight reference checks at the offer stage (BG11).
- **Work model.** All eight frontend postings are in San Mateo. Three require five days onsite (J1, J2, J7); two say onsite at HQ (J4, J8); both HN posts say onsite.
- **Platforms.** No official statement. Reports name CodeSignal (FL4 in 2025; M1's assessment, screen and algorithms round in 2020/21) and HackerRank (TG4, an intern loop in 2025).
- **Product echoes.** J1's event timeline, camera grids and single-camera viewers match the frame-player tasks (Q1 to Q3, Q9) and the camera-grid design question (Q16). J6's floor plans match the 2021 floor-plan take-home (Q18).

## Loop by role, level and region

The 2025 and 2026 frontend questions come from short forum posts, each about one coding round, and from three 2025 Taro pages that give one line or no question. Taro adds the loop shape for 2023 to 2025. No onsite with named questions is newer than 2024, and take-home traces stop in 2024.

### Frontend engineers, mid level to senior, United States, 2023 to 2026

- **Channel.** A recruiter message on LinkedIn (TA9, TA10, both 2023), an online application (TA6, 2024), a staffing agency (TA12, 2019).
- **Recruiter call.** Reported in TA1, TA2, TA6, TA9 and TA10. In one 2023 loop the role was filled after the call; the recruiter came back a month later (TA10).
- **Technical screen.**
  - Format: one hour on video with a team member (TA6, 2024), an engineer on Zoom with online coding software (TA1, 2025), CodeSignal (FL4, 2025). The hiring manager ran it in TA10 (2023): coding plus React questions.
  - 2025: the frame-sequence player family, with a sample API and its response supplied (FL1) or a provided function (FL2).
  - 2026: fetching and listing items (FL6); cards that play video on hover, in a round FL7 calls a frontend coding round.
  - 2023 to 2025: a UI from a design file where styling counts (TA9 in 2023, TA1 in 2025); a React component built in three steps, after which the candidate was rejected the next day (TA5, 2024).
- **Onsite at HQ.**
  - 2024: four hours, all frontend, no LeetCode-style problem. The one question reported for the loop (screen or onsite, not stated) is a grid with cell selection (TA6).
  - 2023, senior software title: a phone screen, then a full day of three technical interviews and a less technical manager interview, with lunch with the team. The interviews were mostly React questions. The questions reported for the loop, round not stated, are broken JavaScript, rectangle selection in a grid, and the frontend architecture of a camera display grid (TA11). The recruiter's prep email had a broken link, and the candidate would have liked a warning about the React focus.
  - 2025: several technical and behavioural interviews tied to the business, and an offer (TA2). A frontend candidate was told the onsite has one algorithm round (B1).
- **Levels.**
  - Mid level: Software Engineer II (FL2); 4 years (FL6).
  - Senior: 7 to 10 years (FL3, FL4, FL5); senior titles in TA1, TA2, TA6 and TA9.
  - Lead: TA7.
  - Postings: four senior roles asking 4+ to 7+ years, two staff roles, one intern role.
- **Outcomes.** One offer (TA2, 2025, in just under a month). The other Taro pages report no offer; TA9 heard nothing after the screen. FrontendLead posts state no outcome.

### Front End Lead on a marketing team, 2024 (TA7)

- A video call with the team's lead on familiarity with CMSs, localization and CSS animation. The call then moved straight to the candidate's questions. No offer.

### Software roles with a frontend round, Canada, 2024 to 2025 (TA3, TA4)

- TA3 (2025): recruiter call, a frontend interview building a UI in a timed session, a LeetCode-style interview, and a behavioural interview with the engineering manager ("Why do you want to work here?").
- TA4 (2024): screening, a front-end technical interview (build a mockup from a design), another technical interview, and a behavioural one. The stack was JavaScript, React and CSS, and the candidate's advice is to practise CSS and styling.

### Older loops with a take-home, 2018 to 2024

- A React take-home with a week to work on it, reached through a staffing agency (TA12, 2019).
- GitHub traces:
  - a thumbnail timeline (2018 to 2021);
  - a floor-plan camera placement (2021);
  - an event list built from a design file (2023 to 2024; format not stated);
  - a landing page with a carousel and an accordion (2023 to 2024, 4 to 8 hours).
- No 2025 or 2026 frontend report mentions a take-home. That the current frontend loop is live coding only is an inference from FL1 to FL7 and TA1 to TA3.

### Early career (thin)

- **Frontend accounts.** None is readable. P1 (new-grad frontend, 2026-01) is locked; its round labels are technical screen, HR screen and onsite, and it was rejected after the behavioural. Its linked cards are Q8, Q10 and Q11.
- **General intern and new-grad loops (contrast).**
  - LeetCode-style rounds on HackerRank and a whiteboard, plus a behavioural (TG4, 2025).
  - Two LeetCode-medium rounds and a behavioural (TG15, 2024).
  - A take-home, two technical interviews and a behavioural, with an offer (TG1, 2025).
  - A recruiter who asked which stack the intern wanted, then LeetCode-style rounds and a take-home project (TG14, 2024).
  - A CodeSignal pre-screen with two medium problems (TG6, 2024).
- **Postings.** J8 (2027 interns) asks for pixel-perfect UI work and JavaScript or TypeScript fundamentals.
- **Floor-plan take-home.** Its November 2021 dates fit campus recruiting; this is not confirmed.
- **Proposal.** No early-career variant is proposed; the page should say the evidence is thin.

### General engineering loops (contrast; not frontend)

- **M1 (2021, backend new grad).**
  - Recruiter call (the coding language chosen there is fixed for the assessment), then a CodeSignal assessment and a 45-minute live screen.
  - A six-hour remote final: algorithms (with a cofounder), paired programming (role-specific), architecture and databases, culture.
  - On the paired programming round: "Depending on what specific software engineer role the interview is for (e.g. backend engineer, frontend engineer, etc.), the scenario is different for each interviewee completing the paired programming interview."
- **2023 to 2026.**
  - Pair programming in a local environment, with Docker, Go, GitHub or PyCharm installed beforehand (BG1, BG5, PS3).
  - An onsite of one system design, two pair programming rounds, one cofounder interview and one hiring-manager interview (BG2, 2025).
  - Internally written LeetCode-style questions (BG3); questions set per team (BG5); a small set of questions per round, per a self-described insider (BG6); an algorithm round despite being told otherwise, new grads included (BG7).
- **Unknown.** Whether frontend onsites use the pair-programming setup is not documented in any frontend source.

### Locations and work model

- Reports name San Mateo (TA2, TA6, TA7, TA9, TA11), the United States (TA1, TA5, TA10, TA12) and Canada (TA3, TA4). The FrontendLead posts give no place.
- All eight frontend postings are in San Mateo, onsite.

## The question list

One row per distinct question or task, by content (rule 1).

**Column key.**
- **Round:** as the source names it.
- **Years:** what the page would show.
- **n:** counted sources, with GitHub repos and T items in brackets.
- **Practice:** rule 6.
- **New:** the build item in section New items to build, with its access.

Rows marked *unverified* rest on prep-site items alone. Rows marked *topic* give a subject without the question's wording.

### A. Live UI builds

| # | Question or task (our words) | Round | Years | n | Sources | Practice | New | Notes |
|---|---|---|---|---|---|---|---|---|
| Q1 | Turn a list of still frames from an API into a video player: play and pause, and start playback from any frame the user picks | phone screen | 2025 | 2 | FL1, FL5 | Yok: new item N1 (parts exist in `react-image-slider`, `react-countdown-timer`) | N1, premium | The sample response was supplied (FL1); FL5 likens it to a carousel. Prepare: no second timer on a repeated Play, no stale index inside the timer callback, cleanup on unmount, behaviour at the last frame |
| Q2 | Timeline for a video scrubber: one marker per frame from a provided function that returns an index and an image, frames 5 to 15 minutes apart; a click on a marker shows its frame; Play advances the index on an interval | technical interview | 2025 | 1 | FL2 | Yok: N1 (timeline task) | N1 | Mid level. The candidate rendered the frames as buttons styled as markers. Follow-ups: spacing by timestamp, time labels, keyboard steps, whether a marker click pauses |
| Q3 | Freeze-frame control in React: a play and pause toggle, buttons that show the state, and a click on the control bar that sets where playback stops | phone screen | 2025 | 1 | FL3 | Yok: N1 (control-bar task) | N1 | Senior, 7 years. A click on a bar needs its position or a range input; see N1's runner note |
| Q4 | Combine two APIs into a list of cards with image thumbnails; hovering a card replaces the image with its playing video; leaving stops the video and brings the image back | frontend coding round (stage not named) | 2026 | 1 | FL7 | Yakın: `react-fetch-list-states` + `js-promise-all`; missing: joining two sources by id, the media swap on hover and leave, one video at a time, a keyboard path | none yet (Open questions) | The reporter rated it moderate and advises practising hover handling and media swaps in any framework |
| Q5 | Fetch items from an API and display them | phone screen | 2026 | 1 | FL6 | Var: `react-fetch-list-states` | none | One line; 4 years of experience |
| Q6 | Build a small UI from a design file in React or a framework of your choice, where styling counts and the interactions are basic, such as click handlers | technical phone screen; frontend technical interview; timed UI session | 2023, 2024, 2025 | 4 (+8 GH, +1 T) | TA9, TA4, TA3, TA1; GH-EL, GH-LC; T4 | Yakın: `css-grid-card-gallery`, `css-flexbox-navbar`, `css-fluid-clamp` + `ui-component-state-from-mock`; missing: a React build from a written spec checked on computed styles | N3, premium | TA9 missed some styling details and heard nothing back; TA4 says practise CSS. Q19 and Q20 show what such files asked for in 2023 and 2024. T4 (2026, unclear source): a camera-card list built to a visual contract |
| Q7 | Build a grid that supports cell selection; extended: select a rectangular area of the grid | not stated (both loops had a screen, then an onsite) | 2023, 2024 | 2 | TA6, TA11 | Yakın: `react-chessboard-click-highlight`; missing: selecting a rectangle by drag or Shift, normalising its corners, extending it from the keyboard | N4, premium | TA6's onsite was all frontend (2024). TA11 was asked to design a way to select a rectangle (2023), maybe as a discussion rather than code |
| Q8 | *Unverified.* A React dashboard with filters: controlled filter inputs, a responsive layout, an empty state | onsite, new grad | 2026 | 0 (+2 T) | T5, P1 | Var: `react-filterable-user-list` | none | The card shows an overview only; its story is locked |

### B. JavaScript and TypeScript coding

| # | Question or task (our words) | Round | Years | n | Sources | Practice | New | Notes |
|---|---|---|---|---|---|---|---|---|
| Q9 | Implement the controller of a frame-by-frame player, with no UI: jump to any frame, autoplay and pause, built on timers and closures | phone screen on CodeSignal | 2025 | 1 (+1 T) | FL4; T3 | Yok: new item N2 | N2, premium | Senior, 10 years. Whether React was allowed is unknown. T3 adds an FPS setter, the current frame and a playing flag, no overlapping timers, drift and cleanup; edge cases: seek while playing, a bad index, the last frame, resume after pause |

### C. Algorithms

| # | Question or task (our words) | Round | Years | n | Sources | Practice | New | Notes |
|---|---|---|---|---|---|---|---|---|
| Q10 | *Unverified.* An LRU-style recency cache; a general onsite the same month also asked for an LFU cache | onsite, new-grad frontend; general onsite | 2026 | 0 (+2 T) | PH-DP; PS3 | Var: `js-create-lru-cache` (no LFU item) | none | Both are prep-site summaries; the frontend story is locked |
| Q11 | *Unverified.* The fewest coins that make an amount (dynamic programming) | onsite, new-grad frontend | 2026 | 0 (+1 T) | PH-DP | Yok: new item N5 | N5, free | Same card as Q10; no statement visible |
| Q12 | From time-ordered readings of one camera's motion level, return the periods at or above a threshold; then the periods when every camera is at or above it at once; then the bottleneck with many cameras | technical screen (general software loops) | 2024 to 2026 | 1 (+2 T) | TG10; PS8, PS6 | Yok: new item N6 | N6, free | Kept by content. TG10 is an index line (S); the 2025 and 2026 years come from the PS stories. A PS6 candidate could not finish part two and was rejected |

The algorithm round itself (B1, TA3; BG3, BG7) is a format and goes into the stage cells. The single-line algorithm exercises of the general loops are listed under Count.

### D. Debugging, code review and AI-enabled rounds

| # | Question or task (our words) | Round | Years | n | Sources | Practice | New | Notes |
|---|---|---|---|---|---|---|---|---|
| Q13 | Fix a piece of broken JavaScript | not stated (a phone screen, then three technical interviews and a manager interview) | 2023 | 1 | TA11 | Var: the JS debug set (`js-debug-off-by-one`, `js-debug-mutating-input`, `js-debug-missing-return-map-filter`, `js-debug-nullish-defaults`, `js-debug-numeric-sort`, `js-debug-lost-this-binding`, `js-debug-stale-closure-autosave`, `js-debug-async-race`) + `js-debug-bug-squash-invoices` | none | The code is not described. J2 asks for practical debugging. No code-review or AI-enabled round is reported for any Verkada role |

### E. Trivia and knowledge questions

| # | Question or task (our words) | Round | Years | n | Sources | Practice | New | Notes |
|---|---|---|---|---|---|---|---|---|
| Q14 | *Topic.* React knowledge questions, and the JavaScript the timer tasks rely on: closures, `setTimeout` and `setInterval` | technical screen with the hiring manager; onsite; phone screen | 2023, 2025 | 3 | TA10, TA11, FL4 | Var: `react-stale-state-closures`, `react-useeffect-purpose`, `react-useref-vs-usestate`, `js-closures`, `js-this-keyword`, `js-call-apply-bind`, `js-promises-async-await`, `js-event-loop` | none | No wording reported. J2, J6 and J8 list scoping, closures, contexts, prototypes and classes |
| Q15 | Are you familiar with CSS animation? The same call asked about CMSs and localization | video call with a team lead (Front End Lead, marketing team) | 2024 | 1 | TA7 | Yakın (lead's mapping was Yok): animation in `css-hardware-acceleration` and `css-transitions-transforms-lift` (no `@keyframes` item); `js-intl-datetime-timezone` covers locale dates only; no CMS or i18n item | N7, free, low | One account |

### F. System design

| # | Question or task (our words) | Round | Years | n | Sources | Practice | New | Notes |
|---|---|---|---|---|---|---|---|---|
| Q16 | Design the frontend architecture for a camera display grid | not stated (same loop as Q13) | 2023 | 1 (+1 T) | TA11; T6 | Yakın: `endless-short-video-feed` (one active player in a feed) + `infinite-scroll-list` (virtualised tiles); missing: a wall of many live streams at once (a stream budget, playback driven by visibility, layouts and a focus view, reconnects, memory) | none yet (answer-guide candidate) | T6 (untraced, 2026) frames the same area as many live feeds without dropped frames or leaks |

### G. Take-homes

| # | Task (our words; full descriptions below) | Round | Years | n | Sources | Practice | New | Notes |
|---|---|---|---|---|---|---|---|---|
| Q17 | Thumbnail timeline with infinite scroll | take-home | 2018 to 2021 | 0 (+9 GH) | GH-TS | Yakın: `react-virtualized-list-recycling` (free) + `infinite-scroll-list`; missing: a three-per-row grid over a time range, image addresses derived from timestamps, an interval switch, a scrollbar for the whole range | none | No trace after 2021 |
| Q18 | Camera placement on a floor-plan grid | take-home | 2021 | 0 (+6 GH) | GH-FP | Yakın: `react-chessboard-click-highlight`; missing: wall cells, one camera per cell, moving and removing, a facing direction, a saved schema | none | Intern targeting not confirmed |
| Q19 | Event list with a large preview, from a design file | assessment (live or take-home not stated) | 2023, 2024 | 0 (+4 GH) | GH-EL | Yakın: `react-filterable-user-list` (the title filter); missing: the preview swap and design fidelity | N3 | May be the design-file screen of Q6 (TA9, 2023); not established |
| Q20 | Landing page with an autoplay carousel and an accordion, from a design file | take-home, 4 to 8 hours | 2023, 2024 | 0 (+4 GH) | GH-LC | Yakın: `react-image-slider` + `react-accordion-faq`; missing: autoplay with per-slide progress, numbered jumps, play and pause, pixel fidelity | N3 (a later take-home mode) | The time box comes from one solver's notes, relaying the recruiter |

**Q17, thumbnail timeline.**
- **Build:** a page that scrolls through about a month of one camera's stored snapshots, taken every 20 seconds (about 134,000 images), three per row in time order.
- **Inputs:** each image's address is derived from its Unix timestamp; there is no list endpoint.
- **Required:** the page stays fast. Only the rows near the viewport exist in the DOM, while the scroll height represents the whole range. One solver kept fewer than 20 row nodes, and one offered a one-hour step beside the 20-second one.
- **Constraints:** one solver relays that basic libraries were allowed except jQuery; a non-citable snippet says no libraries.
- **Time box:** not stated.
- **Reviewer focus:** not reported. Solvers' notes discuss buffering rows above and below the window, and coupling to the source URL.
- **Follow-ups:** fast scrolling, placeholders while images load, jumping to a time, resizing.
- **Stacks:** Angular (3), React (4), plain JavaScript (1).

**Q18, floor-plan camera placement.**
- **Build:** render a floor plan given as a small grid of open and wall cells. A 10×10 sample is given, and hard-coding it is allowed.
- **Required:** users add cameras to open cells only, at most one per cell. A save action builds a data structure that describes the placements and logs it to the console.
- **Points to think about:** the UX for adding a camera, editing a placement (moving or removing it), and how the configuration could be stored.
- **Bonus:** drag-and-drop placement, and a facing direction for each camera.
- **Submission:** an archive, a repository or an online sandbox. No time limit stated.
- **Reviewer focus:** not reported.
- **What solvers built:** typed React with a storage model; two 3D renderings with coverage cones; Angular with a configuration dialog; click or drag to toggle cells.

**Q19, event list with a preview.**
- **Build:** reproduce a small screen from a design file: a large preview image and a list of three security events.
- **Inputs:** each event has a thumbnail, a title and subtitle, a site and a detail, and a time given as a Unix timestamp in seconds.
- **Required:** clicking a row shows that event's image in the preview. Spacing and type follow the design; one solver says the brief asked for React with SCSS.
- **Extras:** two of the four solvers added a title search filter; one calls it a bonus.
- **Format:** two single-file solutions share the same starter line, which hints at a shared online editor (a live round). This is not established.
- **Follow-ups:** the selected-row state, rows as buttons, time format and time zone, the empty filter result, responsive layout.

**Q20, landing page with a carousel and an accordion.**
- **Build:** a responsive, marketing-style page that matches a design file closely.
- **Time box:** 4 to 8 hours, set by the recruiter according to one solver.
- **Required:** a carousel that advances on a timer and shows each slide's progress or countdown; numbered controls that jump to a slide; a play and pause control; an accordion whose items open independently. One solver also built tabs, a gallery and a counter.
- **Decisions solvers documented:** pausing autoplay when a number is clicked, pixel fidelity at the design's width, image sizing on small phones, and skipping tests because of the time box.
- **Reviewer focus:** not reported.
- **Follow-ups:** clearing timers, reduced motion, accessible names on the controls.

### H. Conversations

| # | Question (our words) | Round | Years | n | Sources | Practice | New | Notes |
|---|---|---|---|---|---|---|---|---|
| Q21 | Why do you want to work here? (A recruiter asked M1 why a company like this one) | not stated (TA3); recruiter call and culture interview (M1) | 2021, 2025 | 2 | TA3, M1 | Var: `/guides/behavioral/prep` | none | |
| Q22 | Tell me about a time you overcame a challenge, or met a problem and solved it | behavioural (intern loop); culture interview | 2021, 2025 | 2 | TG1, M1 | Var: `/guides/behavioral/stories` | none | |
| Q23 | Describe the company you would most like to work at | culture interview | 2021 | 1 | M1 | Var: `/guides/behavioral/prep` | none | |
| Q24 | Your favourite project | culture interview | 2021 | 1 | M1 | Var: `/guides/behavioral/stories` | none | |
| Q25 | How you would convince your team to adopt an idea you proposed | culture interview | 2021 | 1 | M1 | Var: `/guides/behavioral/stories` | none | |
| Q26 | What you did in your past internships | culture interview; opening of the screen | 2021 | 1 | M1 | Var: `/guides/behavioral/stories` | none | Early career |

## Count

- **Rows.** 26 in all.
  - By group: A 8, B 1, C 3, D 1, E 2, F 1, G 4, H 6.
  - By content: 17 frontend rows (A, B, D, E, F, G) and 9 general rows (C and H).
- **Practice mappings.**
  - Var 11: Q5, Q8, Q10, Q13, Q14, Q21 to Q26.
  - Yakın 9: Q4, Q6, Q7, Q15, Q16, Q17 to Q20.
  - Yok 6: Q1, Q2, Q3, Q9, Q11, Q12.
- **Changes against the lead's pre-mapping** (11 questions: Var 4, Yakın 4, Yok 3):
  - Q15, CSS animation, CMS and localization, moves from Yok to Yakın: `css-hardware-acceleration` and `css-transitions-transforms-lift` cover animation. `@keyframes`, i18n and CMS stay uncovered, so N7 remains as a low-priority item.
  - The frame player is one Yok question in the lead's list. Here it is three UI rows (Q1 to Q3, item N1) and a controller row (Q9, item N2), because the controller can be checked with fake timers inside its own JavaScript tests.
  - JS fundamentals and React trivia merge into one topic row (Q14), still Var. No source reports a question's wording; only the topics are known.
  - Q10, the LRU cache, stays Var but is marked unverified (prep-site items only), and LFU has no item.
  - Q16, the camera-grid design, adds `infinite-scroll-list` beside `endless-short-video-feed`.
  - Rows outside the lead's list: Q8 (Var, unverified), Q12 (Yok, N6), Q17 to Q20 (take-homes, Yakın), Q21 to Q26 (behavioural, Var).
- **Rows that rest on weak ground.**
  - Prep sites only, marked unverified: Q8, Q10, Q11.
  - GitHub traces only: Q17 to Q20.
  - Topic rows: Q14.
  - Kept by content from general loops: Q12, and Q21 to Q26 (mostly one 2021 backend new-grad account, M1).
- **Left out by the content rule.**
  - TA8's Android task (2024): implement a network layer and show the data in a scrolling grid. It is mobile and platform-specific; Q5 has the web version of the same shape.
  - TG3's Kafka question (2025).
  - Backend and networking tasks: PS1's REST server for camera logs (2026), PS5's Python log parser (2026), M1's Flask API in the paired programming round (2021), PS3's pair-programming database design (2026), a web-server pair-programming warning (BG7's 2023 reply), and the Docker, Go and PyCharm setups (BG1, BG5, PS3).
  - Backend or distributed system design: PS4's voting system (2026), PS3's access-control and heartbeat design (2026), M1's architecture and databases round (2021), and the prep-site design cards (camera health monitoring, per-status device counts, a camera access-control service).
  - PS7's networking and troubleshooting rounds (2026).
  - Embedded loops: BG9, BG10 and J7's C and C++.
- **Not listed: format or process only** (these go into the stage cells):
  - the algorithm round (B1 and TA3, 2025);
  - TA5's React component in three steps (2024);
  - TA12's one-week React take-home (2019);
  - TA2's business-tied questions (2025);
  - TA10's React quiz, kept as topic Q14;
  - the official hiring-manager screen;
  - M1's assessment format.
- **Not listed: generic exercises named in one line by general loops** (these go into the algorithm stage cell):
  - non-overlapping intervals (TG8, 2024);
  - uniformly distributed indexes of a 2D matrix (TG2, 2025);
  - Trie insert and iterate (TG13, 2024);
  - Two-Sum with constraints (TG14, 2024, intern);
  - a simple file system question (TG5, 2025, intern);
  - a long two-graph question (TG12, 2024);
  - a medium array and a medium graph problem (TG6, 2024, new grad);
  - prep-site only: a Sudoku validation (PS4, 2026), WordGuess scoring (PS9, 2025), reachability through nested groups (PS2, 2026), and about 20 Verkada question-card titles with no story.
- **Not listed: untraced prep-site claims.** T6's grid of video player cards, hundreds of live feeds and call, apply and Promise output. T4 is noted under Q6, and T6 under Q16.
- **Most repeated.**
  - The frame-sequence player: Q1 to Q3 and Q9, five reports in 2025 plus T3.
  - Design to UI: Q6, four reports from 2023 to 2025, plus two GitHub families (Q19, Q20) and T4.
  - Grid selection: Q7, two reports, 2023 and 2024.
  - Camera intervals in general loops: Q12, one report plus two stories.
  - An algorithm round inside the frontend onsite: B1 and TA3, 2025.
- **Source concentration.**
  - Most 2025 and 2026 frontend rows come from forum posts one to eight lines long.
  - Taro adds one-line questions for 2023 to 2025.
  - The newest onsite with named questions is 2024 (TA6); TA11 is 2023.

## Proposed interview process tables (for the page; years only)

**Variant 1: frontend engineer, mid level to senior, United States, 2023 to 2026**

| Stage | What happens | Who | Years |
|---|---|---|---|
| Recruiter call | A short call, often after a LinkedIn message; the role and the steps are explained | All | 2023–2025 |
| Hiring-manager screen | Officially, behavioural and role-specific questions with the hiring manager or a team member. In one 2023 loop the hiring manager ran the technical screen: coding plus React questions | All (official stage) | 2023 |
| Technical screen | About an hour of live coding on video with an engineer, on an online editor. Reported tasks: a video player built from still frames (play and pause, jump to a frame, a timeline or control bar, or a controller with no UI); a small UI built from a design file where styling counts; fetching and listing items; a React component in three steps; cards that play video on hover (stage not named) | All | 2023–2026 |
| Onsite at the San Mateo office | Several technical interviews and a behavioural or manager interview: four hours in 2024, a full day with team lunch in 2023. Questions reported for these loops, round not stated: a grid with cell or rectangle selection, fixing broken JavaScript, the frontend architecture of a camera display grid, React questions. One 2024 loop had no LeetCode-style problem. In 2025 a frontend candidate was told to expect one algorithm round, and an offer loop called its questions close to the business and the daily work | Candidates who pass the screen | 2023–2025 |
| Offer and checks | An offer in just under a month from application (2025); reference and background checks before the start date | Candidates who pass | 2025 |

Proposed evidence labels: recruiter call `5 reports, 2023–25`; hiring-manager screen `Official · 1 report, 2023`; technical screen `12 reports, 2023–26`; onsite `4 reports, 2023–25`; offer and checks `Official · 1 report, 2025`.
Record-only source map: recruiter TA1, TA2, TA6, TA9, TA10; hiring-manager screen O1, TA10; screen FL1 to FL7, TA1, TA5, TA6, TA9, TA10; onsite TA2, TA6, TA11, B1; offer TA2, O2.

**Variant 2: software roles with a frontend round, Canada, 2024 to 2025**

| Stage | What happens | Who | Years |
|---|---|---|---|
| Recruiter call or screening | Background and the role | All | 2024–2025 |
| Frontend technical interview | A UI built in a timed session, or a mockup built from a design; practise CSS and styling | All | 2024–2025 |
| Second technical interview | A LeetCode-style interview (2025) or another technical interview (2024) | All | 2024–2025 |
| Behavioural interview | With the engineering manager; why you want to work here | All | 2024–2025 |

Label for each stage: `2 reports, 2024–25`. Sources: TA3, TA4.

**Variant 3: older loops with a take-home, 2018 to 2024**

| Stage | What happens | Who | Years |
|---|---|---|---|
| Recruiter or agency call | The company and its work explained, sometimes through a staffing agency | All | 2019 |
| Take-home | A React task: a week to work on it (2019); an infinite-scroll thumbnail timeline (2018–2021); camera placement on a floor plan (2021); a landing page from a design file in 4 to 8 hours (2023–2024) | Some loops | 2018–2024 |

Later stages are not reported. Label: `1 report and solution repos, 2018–24`. Sources: TA12, GH-TS, GH-FP, GH-LC.

No early-career table: no readable frontend intern or new-grad account exists.

## New items to build

One spec for each Yok row and for each signature Yakın row the lead flagged. None is approved; each needs the user's yes, and each goes through the new-item harness before commit.

Budget: six coding items add about 18 KB to `/coding` (627 KB on origin/dev against a 660 to 700 KB threshold).

### N1. Frame-sequence player (React; premium; must; covers Q1 to Q3)

- **Goal:** play a sequence of still frames as a video, with Play and Pause, a timeline to jump to any frame, and timers that survive repeated clicks and unmounting.
- **Inputs (ours):**
  - a fake `fetchFrames()` API that resolves to about 30 frames `{ index, takenAt, src }`;
  - generated SVG data URIs that print each frame's number and time;
  - timestamps 5 to 15 minutes apart, uneven on purpose;
  - a `FRAME_MS` constant of about 250, and a starter that shows one static frame.
- **Behaviour, as four tasks in an hour** (the `react-webhook-deliveries-four-tasks` format):
  1. Load: loading, error with Retry, empty; then the first frame, a `Frame 1 of 30` label and its time.
  2. Play and Pause: one toggle whose name follows the state, one frame per `FRAME_MS`, a stop at the last frame with Replay, and never a second timer on a second Play.
  3. Timeline: one marker button per frame, named with its time, and the current one marked with `aria-current`. A click jumps and keeps the play state, and a range input mirrors the position and moves it (the control-bar variant).
  4. Keyboard and cleanup: Left and Right step one frame, Space toggles, and unmounting clears every timer.
- **Checks a runner can make today:**
  - `waitForText` on the label after Play, in real time, as `react-countdown-timer` does;
  - Pause, `wait` four frames, `expectText` unchanged;
  - Play twice, Pause, then `expectNoPreviewTimers`: a second interval would survive the pause;
  - `click` a marker, then `expectText` and `expectAttribute` on `aria-current`;
  - `setValue` on the range input; `key` ArrowRight;
  - `unmountPreview` with `expectNoPreviewTimers`; the error path through a mode of the fake API.
- **Follow-ups for an answer guide:** `setInterval` against a `setTimeout` chain and drift; a functional update or a ref against the stale index; preloading the next frames; marker positions by timestamp; what a real `<video>` element would change.
- **Time box:** 45 to 60 minutes.
- **Runner:** nothing new is required. Optional:
  - a fake clock for the preview (an `advanceTime` step), which would check the pace exactly and faster than real time;
  - a positional click, only if the task keeps a plain progress bar, because `click` calls `element.click()` with no coordinates.

### N2. Frame-player controller (JavaScript; premium; should; covers Q9)

- **Goal:** `createFramePlayer({ frameCount, fps, renderFrame })` returns `play`, `pause`, `seek(i)`, `setFps(n)`, `currentFrame()`, `isPlaying()` and `destroy()`.
- **Rules we fix** (the reports leave them open):
  - `seek` renders at once and keeps the play state;
  - a non-integer or out-of-range index throws a `RangeError`;
  - playback stops at the last frame;
  - `setFps` while playing re-times from the current frame;
  - `play` and `pause` are idempotent, and `destroy` clears every timer.
- **Checks:** the tests install their own fake clock, as `js-timer-manager`'s tests do, and check:
  - render counts after advancing N milliseconds;
  - no double scheduling after a seek or a repeated play;
  - re-timing after `setFps`;
  - no live timer after `pause` or `destroy`;
  - a drift case in which each tick is scheduled against a target time.
- **Follow-ups:** `requestAnimationFrame` against timers, throttling in background tabs, a loop option, events for a UI.
- **Time box:** 30 to 45 minutes.
- **Runner:** nothing new.
- **Alternative:** one item in two parts, the controller and then a React UI over it, as `react-vanilla-dropdown-port` builds a class and then ports it.

### N3. Design to UI with style checks (React and CSS; premium; must; covers Q6, and the practice for Q19 and part of Q20)

- **Goal:** build a small screen from a written design spec in which layout, spacing and type are checked, plus one interaction.
- **Inputs (ours):**
  - a text spec with tokens (colours, type scale, spacing, radii, one breakpoint) and our own reference image;
  - a neutral domain such as a building's event log: four events, each with a title, a subtitle, a place, a detail, a Unix timestamp in seconds and a generated image.
- **Behaviour:**
  - a large preview and a list of event rows, each with a thumbnail, title and subtitle, place and detail, and a time as `h:mm am/pm` in a fixed time zone;
  - rows are buttons, and clicking one shows its image in the preview and marks it selected;
  - side by side from 900 px, stacked below;
  - an optional title filter with an empty state.
- **Checks with existing steps:**
  - `expectStyle` on font size and weight, padding, gap and radius; `expectColor`;
  - `expectLayout` at two viewports; `expectPlaced` for the preview against the list; `expectNoOverflow` at 375 px;
  - `expectText` on the formatted times;
  - `click` a row, then `expectAttribute` on the preview image and on the row's `aria-pressed`;
  - `setValue` on the filter, then `expectCount`.
- **Follow-ups:** image aspect ratio, focus styles, long titles, time zones, and what to drop when time runs out (TA9 lost the styling details).
- **Time box:** 45 to 60 minutes. A take-home mode (the Q20 landing page) would be a later, larger item.
- **Runner:** nothing new. The computed-style, layout, placement and colour steps already exist; only the design reference has to be ours.

### N4. Grid cell and rectangle selection (React; premium; should; covers Q7, and its grid also serves Q18)

- **Goal:** a grid where a click selects one cell and a drag, or Shift with the arrow keys, selects a rectangle in any direction.
- **Inputs (ours):** a 10×14 grid of labelled cells, such as a seating plan or a sheet, whose starter renders the cells as buttons.
- **Behaviour:**
  - a press on one cell and a release on another select the rectangle between them, shown with `aria-selected` and a summary such as `B2:D6 · 15 cells`;
  - Escape clears the selection;
  - the arrow keys move the active cell, and Shift with an arrow extends the rectangle;
  - a second rectangle with Ctrl or Cmd is a follow-up.
- **Checks:**
  - `click` selects one cell;
  - `drag` from B2 to D6, and from D6 to B2, then `expectCount` of 15 and the summary;
  - `key` with `shift` extends the selection; `key` Escape clears it.
- **Runner:**
  - Today's `drag` sends `pointerdown` and `mousedown` to the start cell, `pointerup` and `mouseup` to the end cell, and a click to their common ancestor, with no move, over or enter events between them. Either the task says to compute the rectangle from the press and release cells, or `drag` gains move and over events on the destination and on the cells along the path, so that solutions which track the hovered cell also pass.
  - `click` carries no modifier keys, so Shift+click needs a `shift` flag on `click` (the `key` step already has one).
- **Follow-ups:**
  - event delegation on large grids, and avoiding a re-render of every cell;
  - pointer capture for touch, and a live preview while dragging;
  - the state shape that the 2023 design version would discuss.
- **Time box:** 45 minutes.

### N5. Minimum coins (JavaScript; free; could; the source is unverified; covers Q11)

- **Task:** `minCoins(coins, amount)` returns the fewest coins, or `-1`.
- **Checks:**
  - an amount of 0, and an unreachable amount;
  - a case that defeats the greedy method (`[1, 3, 4]` and 6 give 2);
  - unsorted and duplicate coins;
  - a large amount within the time limit, at O(amount × coins).
- **Follow-ups:** return one combination; count the combinations (a different DP); memoised recursion against a table.
- **Time box:** 20 to 25 minutes.
- **Runner:** nothing new.

### N6. Periods above a threshold (JavaScript; free; should; covers Q12)

- **Part 1:** from time-ordered `[timestamp, level]` readings of one sensor, return the `[start, end]` periods where the level is at or above a threshold. A period ends at the first reading below the threshold, or at the last reading if the level never drops.
- **Part 2:** for several sensors, return the periods when all of them are at or above the threshold at once.
- **Follow-up:** with thousands of sensors, merge the sorted period lists with a sweep or a heap instead of pairwise intersections, and state the cost.
- **Checks:**
  - empty input, a single reading, a reading exactly at the threshold;
  - a period open at the end, touching periods;
  - three sensors with no overlap;
  - a large case within the time limit.
- **Data:** the reports use camera motion; the item uses neutral sensors and our own data.
- **Time box:** 45 minutes.
- **Runner:** nothing new.

### N7. CSS animation and localization (trivia; free; could; covers Q15)

- **T1, transitions against `@keyframes` animations:** when to use each, which properties stay on the compositor, and `prefers-reduced-motion`. It links to `css-hardware-acceleration` and `css-transitions-transforms-lift`.
- **T2, localizing a marketing site:** message catalogs and plural rules, `Intl` formatting, locale routing and `hreflang`, right-to-left layouts, text expansion, and translating content that comes from a CMS.
- **Evidence:** one account (2024), so the priority is low.

## Page package notes

### Signature and spotlights

- **Signature round (directory):** `Frame-by-frame player`. Five reports in 2025 (four phone screens and one technical interview), from mid level to senior.
- **Spotlight 1, the frame-player screen.** The variants are a frames-to-video player, a timeline scrubber, a control bar and a controller with no UI. The decoder covers what breaks: a second timer, a stale index, cleanup and the last frame. Practice: N1 and N2.
- **Spotlight 2, design to UI where styling counts.** Four reports from 2023 to 2025, plus the two design-file take-homes of 2023 and 2024. One candidate who had the layout but not the styling details heard nothing back.
- **Spotlight 3, a decoder for the algorithm round of a frontend onsite (2025).** It states the process fact and what general loops ask: periods over camera data (N6) and caches.
- **Hero caveat.**
  - The 2025 and 2026 frontend questions come from short forum posts and one-line report entries.
  - The newest onsite with named questions is from 2024.
  - No intern or new-grad frontend account is readable.
  - The take-home evidence ends in 2024.

### Lock or open (the Binance rule: lock only when the unlock adds constraints, follow-ups, an answer guide or a task)

| Lock (13) | What the unlock adds | Open (13) | Why open |
|---|---|---|---|
| Q1 to Q3, frame player (show as one row with three variants) | the supplied data, the marker and control-bar variants, N1 | Q5 fetch and display | the topic is the whole question; free practice |
| Q4 hover-video cards | two APIs, swap and restore, the follow-ups | Q8 dashboard | unverified |
| Q6 design to UI | styling counts, framework of choice, N3 | Q10 LRU cache, Q11 minimum coins | unverified; generic |
| Q7 grid selection | the rectangle extension, N4 | Q13 broken JavaScript | the topic only |
| Q9 controller | the API and the edge cases, N2 | Q14 React and JavaScript knowledge | topic |
| Q12 threshold periods | two parts and the scale follow-up, N6 | Q15 CSS animation, CMS, localization | a familiarity question |
| Q16 camera grid design | answer guide (to write) | Q21 to Q26 | behavioural rows are open by design |
| Q17 to Q20 take-homes | the full descriptions: inputs, constraints, time box, follow-ups | | |

Shown as one row, Q1 to Q3 leave the page with 11 locked rows and 13 open ones. One practice item under three rows would repeat the complaint from the Agoda read: one guide pasted under many rows.

**Lock refinement for the user.** A row whose only practice is a generic free item stays open (Q5, Q13). The free-unlock rule (`no practice task or answer guide yet`) is unchanged.

### Answer-guide candidates

- Q16: a camera wall with many live streams at once.
- Q7: rectangle selection and the shape of its state.
- Q4: autoplay rules, muted inline playback, one video at a time, releasing media.
- Q1 to Q3: the timer pitfalls, one guide for the family.
- Q12: the sweep over periods.

### Method note for the page bottom (proposal; names no site)

> How we collected these questions. We read public, first-person interview reports that candidates posted on interview-experience sites, discussion forums and personal blogs, and public code repositories where candidates shared their own take-home solutions. A question is listed when a report describes it well enough to practise; summaries on prep sites were used only to confirm a report, and the few questions that rest on them alone are marked as unconfirmed. Every question is written in our own words, and take-homes are described from what candidates published, with our own data and wording; we never copy a company's brief, data or design files. The year beside a question is the year it was reported. We also read the company's careers page, its candidate privacy notice and its current job postings. Teams and levels vary, so treat this as what candidates reported, not as a fixed script.

### Freshness line

`Questions reported from 2018 to 2026. Newest frontend report: March 2026. Reviewed November 2026.`

### Profile hints

- `framework: 'react'`. Most reports and six of the seven web postings name React (J4 names no framework). Two reports allow a framework of your choice (TA9, FL7).
- Older take-home solutions used Angular or plain JavaScript, so `mixed` is not needed.

## Open questions and unverified items

**Decisions for the user**
1. N1 and N2 as two items or one two-part item.
2. For N4, extending `drag` with move and over events and adding a `shift` flag to `click`. For N1, an optional fake-clock step and a positional click.
3. The lock refinement: open rows whose practice is a generic free item.
4. Whether the 2018 to 2021 take-homes (Q17, Q18) stay locked or show as open history.
5. Whether Q16 gets an answer guide only, or a camera-wall design item.
6. Whether Q4 (hover-video cards, the newest report, 2026) gets a premium item. It is not in the lead's new-item list.
7. The content-rule calls, which the user may veto:
   - Q12 comes from general loops;
   - Q21 to Q26 lean on one 2021 backend new-grad account;
   - the Android task (TA8) is left out.

**Unverified or unknown**
- **Unverified rows.** Q8, Q10 and Q11 rest on prep-site items. P1, the only intern or new-grad frontend story, is locked; it needs the user's sign-in and 20 XP.
- **The FrontendLead posts.**
  - Whether FL1 to FL7 are seven people: there are seven usernames and different levels, with no identity check possible.
  - The CodeSignal claim rests on FL4 alone.
  - Whether FL4's controller round allowed React is unanswered.
  - FL7's stage is not named.
- **Prep-site items.** The sources behind T3 to T6 are not traced; T4's linked story does not name Verkada.
- **GitHub families.**
  - GH-EL: live round or take-home, and whether it is TA9's 2023 design screen.
  - GH-FP: whether it targeted interns.
- **Frontend loops.**
  - Whether frontend onsites use the pair-programming setup with a local environment.
  - Whether frontend take-homes still exist after 2024.
- **Taro.**
  - The months are placeholders for TA2, TA5, TA6, TA7, TA9, TA10, TA11 and seven TG pages.
  - TG rows are the lead's index lines (S).
  - TA7's process line is condensed in the dump, so only its questions field is quoted.
- **Not read.** Glassdoor, 1point3acres and the private vlog may hold more frontend onsite detail; they are not citable here.

## Verification

- `node research_notes/traffic-candidates-2026-11/verkada/check-quotes-2026-11-25.mjs` checks every phrase in straight double quotes outside code spans against the saves:
  - `research_notes/traffic-candidates-2026-11/verkada/raw/`;
  - `research_notes/traffic-candidates-2026-11/verkada/taro/`;
  - `research_notes/company-candidates-2026-11-24/raw/verkada/`.
- It also fails on a GitHub URL, a solver's account name, the company's hiring host or the names of its public data folder and design file anywhere in this file.
- The result at writing time is in the Status line below.
- Not verifiable with our tools: the locked P1 story, Glassdoor, the private vlog, and how complete Taro's index lines are.

**Status (2026-11-25).** Record written; nothing built. Quote check: 83 of 83 distinct quoted phrases found in the three raw folders (469 files); leak scan clean.
