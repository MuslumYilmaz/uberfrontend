# Disney: reported frontend interview questions and interview process

> Working record started on 2026-11-03. It lists the frontend interview questions and tasks that public interview reports attribute to The Walt Disney Company, with a source and access status for every item. It also lists the interview stages that those reports and Disney's own pages describe, and what this evidence lacks compared with the other 30 company pages.
>
> Companion documents:
> - `docs/references/cloudflare-questions-and-process-2026-11.md` and `docs/references/crowdstrike-questions-and-process-2026-10.md` use the same format.
> - `docs/references/company-pages-plan-2026-10.md` describes how a company page is built.
> - `reports/company-candidates-research-2026-11-03-tur2.md` is the candidate round (git-excluded).
>
> The user chose Disney on 2026-11-03 and asked for this record only, with the same quality bar as the other company pages. No page, catalog tag, router entry or plan entry has been made.
>
> **Update 2026-11-11.** Six pointers that were unreadable on 2026-11-03, or read only as sentence-level quotes, were read through Claude in Chrome: the two LeetCode posts (DC-20, DC-21), three 1point3acres threads (DC-14 to DC-16, visible text only, because each hides its middle part behind a forum points threshold) and the AI Usage Guidelines (DO-7), plus Candidate Resources (DO-6) in full. The main additions: a second 2025 frontend code review, on a simple React app, with the Disney+ and Hulu streaming teams (DC-16); a 2025 onsite whose frontend coding round was a movie list with sort and search (DC-15); and the outcome of the lead loop in DC-8 (an offer, per DC-14). Two Workday frontend postings recorded on 2026-11-03 (DP-1, DP-2) were no longer listed on 2026-11-11. The raw saves of 2026-11-03 are lost (see Verification).
>
> **Update 2026-11-12.** Every question is now in one table (The question list, Q1 to Q61, in eight groups), with its round, role, date and catalog match. The 32 Taro accounts that this record cites were re-read from their public pages and saved, because the 2026-11-03 saves are lost. Every Taro quote still matches. Taro's question fields also held questions the first pass had not listed, among them a pet adoption app designed from the front end to the back end (D29), a concurrency deadlock question (D27), a backend hour that implements the API for the frontend (D28) and the four rounds of a Beijing loop (D35).
>
> **Frontend-only rule, 2026-11-12.** At the user's request, the question list keeps only frontend questions and general ones (behavioral questions, algorithms, the review of your own take-home), whoever was asked. Backend, infrastructure and systems questions are left out: three rows were removed (Q24, Q34, Q58) and two trimmed (Q50, Q61), and the other rows keep their numbers. The process tables and the catalog proposal follow the same rule.

## Why Disney (2026-11-03)

- **Not covered.** The frontend prep sites below have no company page for Disney. All lists were read on 2026-11-03.
  - GreatFrontEnd: no company guide (37 companies).
  - Front End Interview Handbook: no company page (36).
  - FrontendLead: no company guide (252; the sitemap was read again in the afternoon).
  - devtools.tech: no company list (38).
  - frontendgeek: no experience page (27).
  - LearnersBucket: no experience post.
- **Demand.** Five distinct Google autocomplete suggestions name Disney with a frontend term across the four 2026-10-26 templates:
  - `disney frontend developer`, `disney frontend engineer`, `disney frontend engineer interview`, `disney frontend interview` and `walt disney frontend interview`.
  - Bing gives none.
  - Google also suggests `disney streaming interview` and `disney streaming interview questions`. Queries for the take-home (`disney take home assignment`, `disney streaming take home`, `disney frontend take home`) return no Google suggestions.
  - Same-day calibration: ElevenLabs 2, Wise 5 valid, Cloudflare 7, Agoda 19.
- **Hiring on the day.** Disney lists jobs on two career sites: the Workday board (221 postings) and `www.disneycareers.com`, which carries postings that the Workday board does not show.
  - Four frontend-titled postings:
    - DP-1 "Sr Product Software Engineer (News Front-End)", New York;
    - DP-2 "Manager, Product Software Engineering - Frontend", New York;
    - DP-25 "Front-end Product Software Engineer II", ESPN, Bristol, Glendale or New York;
    - DP-26 "Lead Software Engineer (React)", Buenos Aires.
    - On 2026-11-11 DP-1 and DP-2 were no longer on the Workday board, while the Roku postings DP-7 and DP-8 were still listed. DP-25 and DP-26 were not re-checked.
  - 41 frontend-adjacent postings: generic titles whose work is web client code, full-stack roles that name a frontend framework, and roles that mention JavaScript or React. Two are Roku engineers for ABC News's living-room apps (DP-7, DP-8).
- **Readable sources.**
  - Taro: 366 Disney pages; 19 frontend-titled (2009 to 2025) and 31 generic-titled pages with frontend content.
  - Outside Taro: two first-person frontend accounts (DC-1, Blind, 2022, Disney Streaming; DC-8, PracHub, 2025-11, a lead frontend onsite in Seattle). Two Blind commenters describe their own Disney loops with frontend content (2022, 2025). Four Blind threads were written before frontend interviews (2022 to 2026). A TechPrep principal full-stack account (2026) counts as corroboration only. Since 2026-11-11: two more 2025 accounts on 1point3acres, visible text only (DC-16, a frontend phone screen with the streaming teams; DC-15, a general loop with a frontend coding round), and the original of DC-8 (DC-14).
  - GitHub: 43 public repositories, created from 2020-12 to 2025-07, call the same two JSON endpoints of one take-home brief. Twenty-six are web apps.
  - Official: Disney Careers' candidate pages, a 2026 interview checklist and an interview-prep guide, a 2026 recruiter podcast page, and the candidates' "AI Usage Guidelines" (DO-1 to DO-11). Disney Streaming and Hulu engineering posts from 2019 to 2021 describe the web and living-room stack (DO-12 to DO-16). None of these describes an engineering interview.
- **Buyers.** Accounts from the United States (New York, Glendale, Burbank, Los Angeles, Seattle, San Jose, Orlando), the United Kingdom, Canada, India and China.

## Research rules

- **Access codes.**
  - F: read in full.
  - S: verbatim in a search snippet.
  - U: unreadable.
  - P: seen in search results only, or a prep site's question page.
  - T: read in full, but on a prep site's own page. Used as corroboration only, never counted as a report.
  - G: a candidate's public GitHub repository, read in full through the GitHub API (README, languages, file list; source files for six repositories). The repositories are individuals' accounts, so their URLs stay in the git-excluded notes. This record describes them by date, platform and README wording.
  - (c): a commenter's own account.
  - (p): a plan written before the interview.
- **Quotes.**
  - Every quote comes from a saved page.
  - Taro pages were read from their public URLs with curl. No Taro API was called.
  - Blind, PracHub, TechPrep and Hacker News pages were read through WebFetch. WebFetch returned sentence-level quotations, not whole pages. These sources are F only for the sentences it returned. Where WebFetch marked a sentence as paraphrase, this record does not quote it.
  - Search summaries were used only to find pages.
- **Not cited.** Glassdoor, 1point3acres beyond the three threads read on 2026-11-11 (HTTP 403 for our tools), Prepfully, Dataford, interviewquery and other templated pages. PracHub question pages are P. Reddit was not attempted (our tools refuse it).
- **LeetCode.** On 2026-11-03 closed to this session: WebFetch received HTTP 403, and the permission classifier refused the GraphQL read in the Cloudflare research (`Website Access Circumvention`). On 2026-11-11 the two LeetCode pointers (DC-20, DC-21) were opened as ordinary pages in Claude in Chrome, logged out, and read in full.
- **1point3acres (added 2026-11-11).**
  - Three forum threads (DC-14 to DC-16) were opened in Claude in Chrome, logged out. Each shows its header, its first and last lines and its replies, and hides its middle part ("本帖隐藏的内容需要积分高于 188 才可浏览", with thresholds from 130 to 200 forum points). The hidden parts were not unlocked.
  - Quotes are in the original Chinese; our English translation follows outside quotation marks.
  - The site's English interview pages show a one-line summary and ask visitors to log in.
  - `company-interview-processes.spec.ts` and the SSR test ban the 1point3acres host in process tables, so these threads can inform page copy but cannot be cited in a table.
- **Saved text (2026-11-11 and 2026-11-12).** The pages read on 2026-11-11, and the Taro pages re-read on 2026-11-12, are saved under `research_notes/disney-2026-11/raw/` (git-excluded).
- **Taro.**
  - Taro interview pages are Glassdoor reviews re-hosted with rewritten text; each report is counted once.
  - Two Taro pages hold the same 2020 New York account with small wording changes (D28); it is counted once.
  - A Taro timestamp on the 1st of a month at 00:00, 07:00 or 08:00 UTC is a placeholder (222 of 366 pages). It is marked `*`, and only the month is given.
  - Taro may change the city. When Taro's outcome label contradicts the text, the text wins.
- **Units.**
  - The accounts name Disney Streaming Services (DSS), Hulu, ESPN, ABC News, the parks (Orlando, Anaheim, Lake Buena Vista) and Glendale and Burbank studio teams. Each account keeps the unit it names.
  - In 2026 a Walt Disney-badged commenter wrote "Hate to tell you, Disney Streaming hasn't existed for years." (DC-3).
  - Disney+ Hotstar accounts are excluded. Disney's fiscal 2025 results say that on November 14, 2024 Disney and Reliance "formed a joint venture (India joint venture)" that combined, among others, the "Disney+ Hotstar direct-to-consumer service in India", and that "RIL has an effective 56% controlling interest in the joint venture with 37% held by the Company" (DO-18). Hotstar's loops are therefore not Disney's.
- **Requests.** Requests carried a generic browser User-Agent and no personal data.
- **Scope.**
  - Web frontend roles (frontend, front end, UI and web developer titles), 2016 onward; older accounts as history.
  - Generic software-engineer loops that include a React, JavaScript, UI build, take-home or frontend system design element.
  - The web solutions of the take-home described below.
  - Mobile (Android, iOS, Roku) and backend loops are counted only as contrast.
  - Since 2026-11-12 the question list counts a question by its content, whoever was asked: a frontend question from a backend loop is listed (Q23), and a backend question is not listed from any loop.

## Method

1. **Taro, full sweep.** All 366 Disney interview pages in Taro's public sitemap index were fetched once, one every one to two seconds, all HTTP 200. The account fields (title, location, timestamp, outcome, process, questions) were saved per page.
   - Classified by title and text: 19 frontend-titled, 31 frontend-adjacent by text, 316 generic.
   - The 55 generic software-engineer loops from 2024 and 2025 were counted for contrast.
   - Accounts are D1 to D35 (D1 to D19 frontend-titled, D20 to D35 generic-titled).
2. **Community sources.** A research reader used WebSearch (35 calls) and WebFetch (60 calls).
   - Blind: 21 threads seen, most of them opened. Seven are in the tables (DC-1 to DC-7); the rest were backend, mobile or unanswered.
   - PracHub: the Disney list (4 stories, one frontend) and 48 Disney question pages; the Hulu and ESPN lists are empty.
   - TechPrep: 2 Disney community pages.
   - LeetCode and 1point3acres: titles from search only (U).
   - Hacker News: Algolia queries; one Disney+ interview anecdote.
   - Medium, dev.to, Hashnode, Substack, GeeksforGeeks and LinkedIn: only Disney+ Hotstar accounts, a recruiter's guide and an intern onboarding post.
3. **GitHub.**
   - 16 repository-name searches, then three code searches for the take-home's endpoint host.
   - READMEs, languages and file lists were read through the GitHub API. For six repositories that the code search did not index, the source files were read.
   - 43 repositories call the same two endpoints.
   - Mobile (Kotlin, Swift) and backend (Java) repositories from other Disney exercises were read and set aside.
4. **Postings and official pages.** A second reader covered Disney's own text.
   - **Workday:** the public jobs API (221 postings) was searched for frontend, front end, UI, web, React, JavaScript and TypeScript, and 120 posting details were saved. Searches for HackerRank, CodeSignal, Karat, HireVue and CoderPad returned no posting.
   - **`www.disneycareers.com`:** keyword searches (react 38 results, frontend 25, javascript 29, typescript 25, front end 33) found 21 relevant postings that the Workday board does not list. They were read through WebFetch (S).
   - **Disney Careers pages:** candidate resources, students and graduates, internships, the AI usage guidelines, the scam notice and the interview checklist and prep PDFs. curl fails on `join.disneycareers.com` and `www.disneycareers.com` with a local certificate error on this machine. TLS checks were not disabled, so these pages were read through WebFetch (S). The help centre answers HTTP 403.
   - **Engineering writing:** the Disney Streaming and Hulu blogs on Medium (read through their public RSS feeds), and the `disney`, `disneystreaming`, `hulu` and `espn` GitHub organisations.
   - **Corporate:** the fiscal 2025 results release and the 2024 joint-venture announcement, for Hotstar.
   - 10 WebSearch calls.
5. **Catalog.** 475 items in `cdn/questions` were read, without edits (the 60-entry `collections/frontend-essential-60.json` list only points at items). Pins were read from `backend/content/interview/authoring/*.json` (68 ids).
6. **Comparison.**
   - The stage names of all 30 company process tables were loaded from `frontend/src/app/shared/company-previews/company-interview-processes.ts` with `frontend/scripts/load-ts-module.mjs`.
   - Page sections come from `authored-company-preview.model.ts`.
   - Plan inputs come from `company-plan-rounds.ts`, `company-plan-profiles.ts` and `company-signatures.ts`.
   - Facts per page come from `reports/sirket-sayfalari-envanteri-2026-11-02.md`.
7. **Verification.** Every quotation in this file was checked by script against the saved pages (see Verification).
8. **Follow-up (2026-11-11).** Six pointers and DO-6 were read through Claude in Chrome (see Research rules), and the Workday board was searched again for DP-1, DP-2, DP-7 and DP-8 by requisition number.
9. **Question list (2026-11-12).** The 32 Taro accounts that the record cites (33 pages, with D28's second copy) were re-read from their public URLs with `research_notes/disney-2026-11/taro_reread.py` (page HTML only, no API, one request every 1.3 seconds; all HTTP 200) and saved under `research_notes/disney-2026-11/raw/taro/`. The list was built from this record and those pages. Every catalog id that the mapping proposal names was checked against `cdn/questions` the same day and still exists.

## Verdict

- **There is no single Disney loop, and Disney says so.**
  - A Disney Streaming Services-badged commenter (2022): "In all seriousness, there is zero standardized interview process at Disney." and "It's entirely up to the team to decide how they interview." (DC-Cx1).
  - A 2021 Disney Streaming engineering post: "The autonomy that Disney Streaming affords each team to make the best technical choices for a software project meant that our team could choose freely from a variety of languages and frameworks." (DO-16).
  - Disney's official steps are generic: apply, a recruiter screen, interviews with the hiring team, selection, with behavioral questions answered in the STAR format (DO-2, DO-4, DO-5, DO-6). No official page describes an engineering round.
  - The page must therefore present team-level evidence, dated, rather than one company loop.
- **The most recurring frontend task is a take-home: a streaming home page driven like a TV remote.**
  - 26 public web repositories (created 2020-12 to 2025-07) call the same two JSON endpoints: a home document, and "ref sets" loaded by id. Thirteen call the work a Disney, DSS, ESPN or Hulu assignment, take-home, exercise, assessment or interview. Seven Roku, eight Rust and two C++ repositories solve the same brief on other platforms.
  - One candidate lists the requirements: "Consume the Home API and render pre populated data", "Focused tile must be scaled", "Support for control remote like navigation", "Tile interaction", then "Dynamically populate refs", "Popup tab focus trap in side bar" and "Video preview" as lower-priority items (2025-04).
  - Reported constraints: "No 3rd party libraries or frameworks" (2024-03), mouse input disabled "to better mimic a living room device scenario" (2024-04), and an old browser target ("Chrome version 38 doesn't support the following features", 2025-04). Other candidates used React and TypeScript (2024-07, 2025), so the framework rule may differ by team or year.
  - The teams named in READMEs are "Disney - Living Room Devices Client" (2024-03), "Disney ESPN Assignment" (2024-10), a Hulu repository (2025-01) and, for Roku, "the Disney Living Room Devices Engineering take-home assignment" (2025-07).
  - Disney's engineering posts explain the platforms: the Hulu living-room app "is actually a fully hosted modern web application written in HTML and JavaScript" (DO-13, 2021). For Disney+'s own client app framework, "we chose Rust, targeting WebAssembly (WASM)" (DO-14, 2021).
  - One Taro account matches: D26 (2021-05*, "front-end based"): "I was tasked with creating a streaming app based on a provided visual mockup.", then three interviews on "the rationale behind my technical choices" and state management.
  - The repositories show the task, not the stages around it.
- **On product teams, a take-home build is often followed by a review round (2016 to 2025).**
  - D7 (2021): a take-home with "test cases for all levels", reviewed by two senior engineers.
  - D21 (2023): "implement changes to a React app", then an in-person round on the changes.
  - D20 (2024, a frontend contract role): the take-home was reviewed and the candidate was "asked to make one revision on the call".
  - Also D14 (2016, a coding submission), D27 (2021, optional), D32 (2021, a C and C++ role, half of a 90-minute panel on the code), D33, D34; and DC-Cc3 (2025), whose take-home may never have been graded.
  - Contrast: one of the 55 generic software loops of 2024 and 2025 on Taro mentions a take-home, so the take-home is a team practice, not a company stage.
- **The live alternative is a short UI or JavaScript task.**
  - D1 (2025-05*): a one-hour React task to build "a scoreboard banner for the top of the website" from an API, in five steps; "Research on Google was permitted, but AI tools were not."
  - D23 (2024): "an on-screen test for JavaScript knowledge".
  - D28 (2020): "Build the UI shown to you" and "Add event listeners to integrate the provided API".
  - DC-Cc2 (2022, frontend): "two pretty easy coding questions". DC-Cc1 (2022): on Streaming teams, expect to "code in Javascript".
  - DC-15 (1point3acres, 2025 Q4, a general software engineer onsite; added 2026-11-11): "FrontEnd coding: 要求显示电影名，年份，可以sort, search" (show film titles and years, with sort and search), next to a system design, "算法题：LRU" (an LRU algorithm question) and behavioral questions. PracHub's movie-list question page (DC-9, P, 2026-01-22) appeared nine days after this post.
- **Code reading and review are a Disney theme.**
  - DC-1 (2022, Disney Streaming first round): no coding; "go over code (basically trick questions about scope)" and "a mock pr review".
  - DC-8 (2025-11, lead frontend): "a code review with a Principal Engineer" of "badly written code" that was frontend code, then mentoring questions.
  - DC-16 (1point3acres, 2025 Q3, frontend, the Disney+ and Hulu streaming teams; added 2026-11-11): at the second team "第二個technical round第一關是code review" (the technical round opened with a code review), although the recruiter had said it would be LeetCode-style. Asked what the code review covered, the poster replied: "基本上給你看一個滿簡單的程式(我是面前端的所以是一個簡單的react app)，要你找問題跟給feedback" (they show you a fairly simple program, for a frontend candidate a simple React app, and ask you to find problems and give feedback).
  - Three loops from 2022 to 2025 therefore name a code review round for frontend candidates. DC-8 (with its original DC-14) and DC-16 are separate posts by different anonymous posters, in different quarters and for different roles.
- **Frontend system design prompts:** a shopping cart and feature flags (DC-8), an upload-video feature like YouTube's (D20), "How to design an API service for a front-end application" (D21), UI components and the web API they need (D28), a pet adoption mobile app from the front end to the back end (D29, 2019) and the parks' fast pass system (D7). Plans: an SDE 2 candidate in 2026 was told only "that it is a system design." (DC-3); a SWE II candidate in 2025 had a systems design interview after a React-focused one (DC-6).
- **PM, TPM and director conversations** appear in D20 (a PM behavioral round), D27 (a long day with the Product Manager), D28 (lunch with the team director and PM), DC-8 (a Senior TPM) and D7 and D8 (a director).
- **AI.**
  - Official: Disney's "AI Usage Guidelines" for candidates rule out AI for "Completing assessments (such as coding exercises, job assessments, writing samples, or language tasks)" "unless instructed otherwise." and for "Generating interview answers in real time or using tools that respond on your behalf" (DO-7, read in full on 2026-11-11). The same page also rules out "Using AI note taking assistants, and all forms of recording or transcribing any conversations during the recruitment experience", while Disney's recruiters may use AI for notes "With candidate consent".
  - Reports agree: D1 (2025) allowed Google but not AI.
  - Several open postings ask for AI-assisted development in the job itself (DP-1, DP-27).
- **Stack.** Three of the four frontend-titled postings name React (DP-1, DP-25, DP-26), two of them with TypeScript (DP-1, DP-26); the fourth leads a JavaScript media player team (DP-2). Other teams use Angular (DP-11, DP-14) or Vue (DP-30). Hulu's web stack is React with Next.js (DO-12, 2019).
- **What ranks** for `disney frontend interview questions` (WebSearch, 2026-11-03): Prepfully question banks, a Dataford Hotstar guide, a 1point3acres thread, PracHub and the Blind thread DC-1. No editorial frontend guide appears.
- **Readiness.**
  - The evidence matches the CrowdStrike pattern: one recurring frontend take-home with many public solutions over five years, a review round and dated first-person accounts. It also has more: first-person frontend accounts outside Taro (two on 2026-11-03, and since 2026-11-11 two more 2025 accounts on 1point3acres, DC-15 and DC-16, visible text only), an official AI rule and official interview-prep pages. That is enough for a sourced guide.
  - Three limits:
    - The process is team-specific.
    - The living-room take-home rests on GitHub artifacts and one Taro account, not on a loop narrative.
    - The richest unread text is the hidden part of the 1point3acres threads (DC-14 to DC-16), which needs forum points; their visible text was read on 2026-11-11.

## Sources

Access: see Research rules. Detail: Q = names questions or a task, T = topics only, P = rounds or process only. Taro URLs share the prefix `https://www.jointaro.com/interviews/companies/disney/experiences/`; the tables give the slug after it. Dates marked `*` are Taro placeholders (month only). The cited Taro pages were re-read on 2026-11-12; their rows now also carry each page's question field and the process sentences that The question list uses.

### Frontend-titled accounts (Taro, Glassdoor rewrites)

| id | slug | date | role, location (as Taro shows it) | access | detail | content |
|---|---|---|---|---|---|---|
| D1 | software-engineer-ii-frontend-bergen-op-zoom-may-1-2025-no-offer-positive-1707e185/ | 2025-05* | Software Engineer II - Frontend, Bergen op Zoom, Netherlands (Taro's city, probably wrong) | F | Q | "I first had a call with a recruiter, followed by a one-hour technical interview with a senior engineer."; "The task was to create a scoreboard banner for the top of the website."; "There were five steps. I completed only two steps before time ran out."; "Research on Google was permitted, but AI tools were not."; question "Coding in React frameworks to make a scoreboard on a website, using their API as direction." |
| D2 | web-developer-united-states-july-3-2024-no-offer-neutral-a832781e/ | 2024-07-03 | Web Developer, United States | F | P | "Phone screening with a recruiter and interview with the hiring team."; "The phone screening was basic behavioral; they were looking to see if you would fit in with the culture."; "There were no coding questions in the interview, but they asked questions about the technology you would use in the position."; question "What are your greatest strengths?" |
| D3 | web-developer-united-states-november-29-2023-no-offer-neutral-a807064c/ | 2023-11-29 | Web Developer, United States | F | P | "We had a phone interview."; question "What kind of environment do you thrive in?" |
| D4 | web-developer-orlando-fl-march-1-2023-no-offer-negative-97a08d01/ | 2023-03* | Web Developer, Orlando | F | Q | "Video call, ask about my skills and experience."; "Tech stack and then proceed to share screen for a technical test where they wanted me to create a new plugin that would take care of certain functions."; question "What would you do when you have a roadblock?" |
| D5 | ui-developer-india-october-2-2022-no-offer-neutral-e0da480c/ | 2022-10-02 | UI Developer, India | F | P | "It felt really scripted."; question "What were my shift availabilities?" (probably not an engineering role) |
| D6 | junior-front-end-developer-manchester-england-august-1-2022-no-offer-positive-f7f14c02/ | 2022-08* | Junior Front End Developer, Manchester | F | P | "Very well-thought-out interview process, including behavioral interview(s) and a technical assessment."; "The company provided very detailed feedback that was both beneficial and insightful."; question "What is my motivation for learning to code?" |
| D7 | full-stack-web-developer-united-states-june-16-2021-no-offer-negative-5fbbceee/ | 2021-06-16 | Full Stack Web Developer, United States | F | Q | "The recruiter was very quick to send me to the next round, an interview with the director."; "After meeting with the director, I received a take-home coding project."; "Then, I met with two senior engineers for a system design white-boarding session."; "I believe they were testing my OOP design skills."; "This was the round where they reviewed my coding assignment."; "The take-home challenge had test cases for all levels, and senior engineers had certain specs to meet."; "I was not applying for a senior role, yet most of the questions during this code review were pointed towards those specs."; "The final round of the interview was with another manager on a different team."; questions "Design the fast pass system for their parks." and "Which React hooks handle which React lifecycle events?", and what `window.history` does |
| D8 | web-developer-united-states-may-1-2021-accepted-offer-positive-b23fee74/ | 2021-05*, accepted offer | Web Developer, United States | F | P | "Recruiter's initial call to see if it's a good fit."; "Call with the team asking technical and behavioral questions."; "The last interview was with the director/head of that team department."; "It was super laid-back and focused on more behavioral, goal-oriented questions."; "I got the news within 2 weeks."; question "What is your favorite Disney Character?" |
| D9 | web-developer-intern-united-states-november-1-2020-no-offer-positive-5973c513/ | 2020-11* | Web Developer Intern, United States | F | P | "There was an initial 30-minute phone call with a recruiter for behavioral questions and to discuss your resume."; "Afterwards, there is another interview with a developer for going over technical questions."; question "Tell me a bit about yourself." |
| D10 | front-end-developer-united-states-september-23-2020-declined-offer-positive-69229f70/ | 2020-09-23, declined offer | Front End Developer, United States | F | P | "So far, I've had one hour-long coding interview, with a final round of interviews after."; "I really like how they prepare you for the interview by giving a broad summary of what they will bring up and ask."; question field: "They asked about my hobbies and why I wanted to work there." |
| D11 | front-end-development-united-states-june-1-2019-no-offer-positive-e744090e/ | 2019-06* | Front End Development, United States | F | P | "The recruiter started by discussing my general background (school, address, etc.)."; "They asked general questions based on my resume."; "I had also prepared for technical questions, but they did not ask any."; question "Why do you want to work for the Walt Disney Company?" |
| D12 | web-developer-lake-buena-vista-fl-october-1-2017-no-offer-negative-442e2a59/ | 2017-10* | Web Developer, Lake Buena Vista | F | Q | a short phone call on past experience and what-ifs; "The interview was conducted by three people simultaneously."; question "You are designing a roller coaster. Would you make four trains with five carts each, or five trains with four carts each? Why?" |
| D13 | senior-web-developer-los-angeles-ca-january-1-2017-declined-offer-neutral-1e878fa9/ | 2017-01*, declined offer | Senior Web Developer, Los Angeles | F | Q | "Questions were about React and Redux."; question "Why shouldn't state be mutated?" |
| D14 | senior-web-developer-glendale-ca-june-1-2016-accepted-offer-positive-9d8cb663/ | 2016-06*, accepted offer | Senior Web Developer, Glendale | F | P | "One phone interview. Coding submission."; "If you’ve been a senior dev working on JavaScript projects, and your HTML and CSS are solid, you will be fine."; questions field: "Nda" |
| D15 | web-developer-glendale-ca-february-1-2016-accepted-offer-positive-a847dd65/ | 2016-02*, accepted offer | Web Developer, Glendale | F | P | "I interviewed 8 people, 2 at a time."; question "Why are you applying to this job?" |
| D16 | web-developer-atlanta-ga-march-1-2015-no-offer-neutral-02c66945/ | 2015-03* | Web Developer (an ESPN internship), Atlanta | F | Q | "One question asked about the programming language JavaScript DOM, since that's what you'll be working with in the internship." |

D17 to D19 (Web Developer, Orlando 2014*, Anaheim 2012* and Burbank 2009*) describe recruiter calls only and are not listed.

### Frontend accounts outside Taro

| id | URL | publisher, dates | role, location | access | content |
|---|---|---|---|---|---|
| DC-1 | https://www.teamblind.com/post/disney-front-end-interview-xps3iweg | Blind, post 2022-02-10, the poster's reply 2022-02-12 | "the first round of a front end loop with Disney Streaming Services"; "YOE: 3" | F (WebFetch, sentence quotations) | Before the round: "Can anyone give any insight into the types of technical problems (LC vs building UIs) that might come up". The poster's own account afterwards: "Definitely - I didn’t have to code at all." and "Just had to go over code (basically trick questions about scope) and tell what was going on and do a mock pr review". Holds DC-Cc1 and DC-Cx1 |
| DC-Cc1 (c) | same thread | Blind, 2022-02-12, JPMorgan Chase badge | role not stated; same position as a friend | F | "In terms of leetcode, the questions tend to be easy/medium, and if it's Streaming then they will most likely" "ask you to code in Javascript."; "Be prepared for some of them being Disney-themed."; "Myself and a friend interviewed for the same position but had different interviewers, and I got a simple" "fizzbuzz question while they got a DFS graph problem!" |
| DC-Cx1 | same thread | Blind, 2022-02-11, Disney Streaming Services badge | an insider's remark, not an account | F | "In all seriousness, there is zero standardized interview process at Disney."; "It's entirely up to the team to decide how they interview." |
| DC-8 | https://prachub.com/interview-experiences/disney-seniorplus-lead-software-engineer-interview-experience-four-part-onsite-with-a-code-review-and-whiteboard-system-design | PracHub, interview date "Nov 2025", published date "Aug 24, 2026" | "I was interviewing for Lead Software Engineer (Frontend)."; Seattle; in progress when written, an offer per DC-14 | F (WebFetch, the story as consecutive quotations) | "They've started doing in-person onsites now, so the last two interviews were at the Seattle office."; "The second round had four parts total."; "The first part was a half-hour chat with a Senior TPM," "mainly to get a sense of your working style and see your collaboration style."; "The second part was a code review with a Principal Engineer — they showed you some badly written code" "(I was interviewing for frontend, so it was frontend code)" "and wanted to see what suggestions you'd give."; "Mainly they wanted to see how you mentor juniors, then asked what you'd do to help this person" "if the code had been written by a junior, and after that asked some mentoring experience questions too."; "The third and fourth parts were both system design, frontend-focused" "the first was a shopping cart, the second was feature flag design."; "Drew it directly on the whiteboard."; afterwards "the hiring manager wanted to talk more about" "my stakeholder management experience." The first round is not described. Its 1point3acres original (DC-14) was read on 2026-11-11: the visible lines match, and the poster later reported an offer |
| DC-Cc2 (c) | https://www.teamblind.com/post/disney-streaming-services-fe-interview-what-to-expect-aycfis6w | Blind, 2022-01-31, Oracle badge | frontend | F | "I interviewed for FE recently and it's relevant to the job."; "More behavioral questions and two pretty easy coding questions."; "Actually a really great interview." |
| DC-Cc3 (c) | https://www.teamblind.com/post/disney-streaming-front-end-interview-advice-ivnyirmr | Blind, 2025-04-02, Visa badge | role not stated, in a thread about a React-focused SWE II interview | F for the quoted sentences | "Had a recent interview with disney where they asked a mix of react questions, behavioral, and a system design question."; "Communication was vague and slow."; "Don't even know if anyone actually graded my take home or not but was disappointed." The sentence that says the take-home was to build a UI was returned as paraphrase and is not quoted |
| DC-14 | https://www.1point3acres.com/bbs/thread-1157660-1-1.html | 1point3acres, posted 2025-12-12; read 2026-11-11 | "2025(10-12月) FrontEndEng 硕士 全职@disney"; "Lead Software Engineer (前端)", Seattle; an offer | F for the visible text; the middle part is hidden (188 points) | the original of DC-8: "他們家現在開始in person onsite, 所以後面兩個面試是在Seattle office面的" (in-person onsites now, so the last two interviews were at the Seattle office) and "第二輪總共四關" (the second round had four parts); after the hidden part: "上禮拜五面試，禮拜二收到信說hiring manager想再多聊我的一些stakeholder management的經驗" (the hiring manager wanted to talk more about stakeholder management) and "可能因為是lead position所以他們比較注重mentoring, collaboration, system design的部分" (as a lead position, they focused on mentoring, collaboration and system design); the poster's reply of 2026-01-08: "過了! 已經簽了offer, 正在跑background check" (passed; offer signed, background check running) |
| DC-16 | https://www.1point3acres.com/bbs/thread-1155288-1-1.html | 1point3acres, posted 2025-11-20; read 2026-11-11 | "2025(7-9月) FrontEndEng 硕士 全职@disney - 网上海投 - 技术电面"; two streaming teams: "都是streaming service (Disney+, Hulu)"; in progress when written | F for the visible text; the middle part is hidden (130 points) | "目前正在同時跟兩個team面試，都是streaming" (interviewing with two teams at once, both streaming); "第一個HM 問了一些基本behavior questions 跟一題簡單哩扣" (the first hiring manager asked basic behavioral questions and one easy LeetCode problem); "第二個HM 比較在意你的專案經驗" (the second cared more about project experience); "第二個technical round第一關是code review，但是recruiter完全給錯方向，說會是leetcode類型..." (the technical round opened with a code review, though the recruiter had said it would be LeetCode-style); the poster's reply of 2025-12-31: "基本上給你看一個滿簡單的程式(我是面前端的所以是一個簡單的react app)，要你找問題跟給feedback" (a fairly simple program, for frontend a simple React app: find the problems and give feedback) |
| DC-15 | https://www.1point3acres.com/bbs/thread-1161025-1-1.html | 1point3acres, posted 2026-01-13; read 2026-11-11 | "2025(10-12月) 码农类General 硕士 全职@disney - 网上海投 - Onsite"; a general software role; a reply asking "这是SWE嘛还是DE" (software or data engineering?) has no answer | F for the visible text; three parts are hidden (200 points) | "店面考题：" (the phone screen question, hidden); onsite: "系统设计" (system design, details hidden), "算法题：LRU" (an LRU algorithm question), "FrontEnd coding: 要求显示电影名，年份，可以sort, search" (show film titles and years, with sort and search; details hidden), "BQ" (behavioral questions) |

### Plans and insider remarks (Blind)

| id | URL | date | content |
|---|---|---|---|
| DC-2 (p) | https://www.teamblind.com/post/disney-streaming-interview-experience-disneyhulu-upn3mha7 | 2022-03-02 | "A recruiter from Disney Streaming services reached about a potential Frontend engineering role." A commenter (Microsoft badge) on their own senior loop, role not stated: "Phone screen was LC medium+. Onsite, one was medium and one was a graph hard." and "The 2 system design." |
| DC-3 (p) | https://www.teamblind.com/post/disney-streaming-frontend-system-design-interview-2lnw88up | "Apr 8", year not shown (probably 2026) | a frontend SDE 2 candidate before a system design round; the Walt Disney-badged reply: "Hate to tell you, Disney Streaming hasn't existed for years." The rest of that reply (a shared technology organisation with Disney Entertainment and ESPN; for a full-stack role a coding, a system design and a behavioral session) was returned as paraphrase |
| DC-4 (p) | https://www.teamblind.com/post/disney-streaming-services-fe-interview-what-to-expect-aycfis6w | 2022-01-20 | "Got an invite to interview for one of the web teams."; "It's for a frontend position, web strictly remote."; "I only have an hour and 20-mins is delegated to the technical Q." Holds DC-Cc2 and DC-Cc4 (c), a 2022 Disney Streaming Services intern's own account: "Intern interview were pretty straightforward, Hashmap questions and tech stack questions." and "They did ask alot of behavioral and culture fit questions." |
| DC-6 (p) | https://www.teamblind.com/post/disney-streaming-front-end-interview-advice-ivnyirmr | 2025-04-01 and 2025-04-10 | "I have an interview coming up that is React focused for a SWE II position."; "The recruiter was pretty vague about the interview other than the language,"; then "I have my systems design interview in a week". Holds DC-Cc3 |

Also read and not used for rounds: a 2022 Disney Streaming backend on-site where a behavioral round turned to "how a react dom like actually worked on a lower level" (DC-5); a 2025 Disney and ESPN Streaming Android loop (DC-7); a 2022 Hacker News comment on a Disney+ interview, role not stated: "Really open ended questions, but the interviewer was looking for very specific answers." (DC-22).

### TechPrep community pages (T)

| id | URL | date | role, location | content |
|---|---|---|---|---|
| DC-12 | https://www.techprep.app/community/interview-experiences/disney-principal-fullstack-engineer-interview-2026 | "Published 30th Oct 2026" | "Principal · Fullstack Engineer", "APAC" | "Round 1: Frontend Technology & Coding": "This session focused heavily on ReactJS internals, advanced UI rendering mechanisms."; "I was asked how can I improve the performance of the UI rendering."; "He also asked me about browser engine."; "I was given a partially implemented coding problem where I completed the core business logic" "and successfully rendered data fetched from a centralized store."; then "Round 2: System Design" and "Round 3: Low-Level Design (LLD)", described as a rate limiter and a token bucket (paraphrase). The page links TechPrep's own guides from inside the account |
| DC-13 | https://www.techprep.app/community/interview-experiences/disney-senior-software-engineer-interview-los-angeles-2024 | interview "August 2024" | Senior Software Engineer, Los Angeles; not frontend | summary only: a recruiter screen, a coding screen with a graph search, a data pipeline system design |

### Frontend-adjacent accounts (Taro, generic titles)

| id | slug | date | role, location | access | content |
|---|---|---|---|---|---|
| D20 | software-engineer-glendale-ca-september-27-2024-no-offer-positive-a4213d93/ | 2024-09-27 | Software Engineer, Glendale | F | "For a contract role working on a frontend-focused role, the steps were:" "Phone screen with recruiter", "Phone call with tech lead", "Did a take-home project", "Zoom call with two engineers. Went over the take-home project and asked to make one revision on the call. Then, did a LeetCode medium problem.", "Zoom meeting with PM over behavioral questions", "Zoom meeting with principal engineer over systems design."; question: draw and explain an upload-video feature like YouTube's |
| D21 | software-engineer-new-york-ny-august-18-2023-accepted-offer-neutral-1e34dfa8/ | 2023-08-18, accepted offer | Software Engineer, New York | F | "Take-home assignment where you're asked to implement changes to a React app."; "In-person interview where you talk about the changes made, some system design exercises, and then some more behavioral-type questions with management."; question "How to design an API service for a front-end application" |
| D22 | software-engineer-san-jose-ca-june-1-2024-no-offer-neutral-46dc4646/ | 2024-06* | Software Engineer, San Jose | F | "This is the first round of HM interview. 45mins."; question "How to manage React component state." |
| D23 | software-developer-glendale-ca-july-4-2024-declined-offer-neutral-be5fa80f/ | 2024-07-04, declined offer | Software Developer, Glendale | F | "Remote video call by a team of 3 people."; "Lasted about 45 minutes, with some general technical and background questions."; "Also included an on-screen test for JavaScript knowledge. Given a scenario, I needed to complete code to produce the desired result."; question "Tell us about previous work experience and projects worked on." |
| D24 | product-engineer-united-states-march-13-2024-accepted-offer-positive-cfc1deee/ | 2024-03-13, accepted offer | Product Engineer, United States | F | "First with HR.", "Second with the tech engineers (tech interview).", "Third with the hiring manager (behavioral)."; question "How would you redirect bad traffic on a website?" |
| D25 | software-developer-united-states-august-6-2022-no-offer-positive-d12b6833/ | 2022-08-06 | Software Developer, United States | F | "The recruiter reached out to me and asked many questions, such as about current skills and recent projects."; "After that, I completed a coding challenge on a website with two questions."; "Two weeks later, I heard that the position had been cancelled."; question "Array, REST API, and JSON problem-solving" |
| D26 | associate-software-engineer-united-states-may-1-2021-no-offer-positive-9249e5cd/ | 2021-05* | Associate Software Engineer, United States | F | "The process began with a screening call and discussion, followed by a coding challenge."; "The job was front-end based, and I was tasked with creating a streaming app based on a provided visual mockup."; "Next, I proceeded to the final round of interviews, which consisted of three separate interviews, each with two interviewers."; "During these interviews, we discussed the rationale behind my technical choices, my approach to other projects (with a focus on state management), and the company culture."; "However, I was encouraged to reapply after gaining more enterprise experience."; question "Tell us about a time you've developed something with a team." |
| D27 | senior-software-engineer-united-states-march-1-2021-no-offer-negative-b8051efd/ | 2021-03* | Senior Software Engineer, United States | F | "I was offered a take-home coding exercise, which was vaguely described as optional."; "I declined due to time constraints, with the alternative being a more in-depth technical assessment during subsequent interviews with Senior Engineers."; "Within a couple of days, I had one long day of interviews with the Product Manager, two Senior Engineers, and the Hiring Manager again."; "These ranged from process questions to a technical assessment to leadership fundamentals."; question "How do you handle a concurrency deadlock between two processes modifying the same data at the same time?" |
| D28 | full-stack-software-engineer-new-york-ny-january-1-2020-accepted-offer-positive-fa484c44/ (the same account also at …-fc4fd6e4/) | 2020-01*, accepted offer | Full Stack Software Engineer, New York | F | "45-minute technical phone screen with an engineer:" "A lot of OOP questions (maybe 30 minutes worth)" "Then a 15-minute coding session"; "On-site: 4 hours"; "On-site 1st hour: System design on a whiteboard" "Identify UI components" "Identify web API needed, including endpoint, sample request and responses, and HTTP method" "How would you integrate these?"; "On-site 2nd hour: Frontend focused" "Build the UI shown to you" "Add event listeners to integrate the provided API"; "On-site 3rd hour: Lunch with the prospective team director and PM"; "On-site 4th hour: Backend focused" "Implement the API and classes needed to support the frontend" "Identify data models needed and their relationships and constraints"; question field: OOP, REST API, UI components, HTTP method, request and response, data structures |
| D29 | software-engineer-canada-september-1-2019-no-offer-negative-3505625b/ | 2019-09* | Software Engineer (a full-stack position), Canada | F | "The interview was for a full-stack SDE position with a team at Disney"; "After an initial on-site interview with a group manager, I was asked for an on-site panel group interview."; "The panel interview lasted for four hours."; "The only Javascript question was about closures."; from the engineering team manager: "During his interview session, he asked me to walk through the design of a pet adoption mobile app from the front end to the back end."; question "Reverse words in a sentence." |
| D30 | software-engineer-united-states-may-9-2019-declined-offer-negative-7790ffe3/ | 2019-05-09, declined offer | Software Engineer, United States | F | "Technical phone screen followed by an onsite interview with 5 rounds."; each round mixed "Coding", "System design", "Behavioral assessment" and "Diagnosing a production problem"; question field: "The behavioral interview involved the typical process, going over your past work and motivations." |
| D31 | software-development-intern-new-york-ny-march-1-2019-accepted-offer-positive-2fe9a0ec/ | 2019-03*, accepted offer | Software Development Intern, New York | F | "This included SQL, web protocols, React, and more."; "No coding questions were provided, making it quite easy."; question "Non-relational vs. relational databases and specific use cases." |
| D32 | software-engineer-united-states-january-1-2021-accepted-offer-positive-530366fd/ | 2021-01*, accepted offer | Software Engineer, United States (C and C++ questions) | F | "The take-home assignment was the main portion of the interview and took me a good chunk of time to complete."; "The panel interview lasted about 90 minutes, with about half of that focusing on questions and review of the code I had written."; "During the code review, they asked why I made many of the decisions I did."; "it seemed they wanted to ensure I understood the trade-offs of my choices."; "After that, there were several algorithms, data structures, and C/C++ questions (no coding though), as well as a few behavioral-type questions." |
| D33 | software-engineer-zurich-december-1-2020-no-offer-negative-f6cf2bea/ | 2020-12* | Software Engineer, Zürich | F | "General online interview with a few technical questions, followed by a take-home assignment (~4 hours)."; question "General questions about algorithms (binary trees, heaps)" |
| D34 | software-engineering-intern-united-states-july-15-2020-accepted-offer-positive-cb05d517/ | 2020-07-15, accepted offer | Software Engineering Intern, United States | F | "Followed by two video calls with senior developers, involving casual conversation, experience discussion, interests, and more."; "After the initial video call, I was sent home with a coding challenge."; "Take-home coding challenge, took less than 10 hours." |
| D35 | senior-software-engineer-beijing-beijing-september-22-2025-accepted-offer-positive-1c2a0a75/ | 2025-09-22, accepted offer | Senior Software Engineer, Beijing | F | a virtual onsite of four rounds: "Algorithm and some practical questions.", "BFS of a binary tree.", "Hand-write a Promise.", "Linked list flip every two nodes." and "Some regret issues from production?" |

### Generic software-engineer loops, 2024 to 2025 (Taro, contrast only)

55 accounts with software-engineer titles from 2024 and 2025, outside the frontend-titled table, were grepped for stage words (counts are accounts that mention the stage):

| Stage word | Accounts |
|---|---|
| recruiter or HR | 24 |
| hiring or engineering manager | 21 |
| behavioral, values or culture | 16 |
| live, pair or algorithm coding | 12 |
| panel or onsite | 7 |
| system design | 4 |
| online test | 2 |
| take-home | 1 (D20) |
| PM or director | 1 |

Thirty-five of the 55 give California, Florida, New York or Washington as the location; fifteen give only the United States.

### Candidate take-home solutions (GitHub, first-person artifacts)

- **One brief, many solutions.**
  - 43 public repositories call the same two JSON endpoints on `cd-static.bamgrid.com`: a home document, and "ref sets" loaded by id.
  - Platforms: 26 web apps (JavaScript or TypeScript, created 2020-12 to 2025-07), 7 Roku channels (BrightScript, 2024-02 to 2025-07), 8 Rust apps (2021-01 to 2022-09) and 2 C++ apps (2023 to 2024).
  - Thirteen of the 26 web repositories call the work a Disney, DSS, ESPN or Hulu assignment, take-home, exercise, assessment or interview. The others show the same task without naming it.
  - Web repositories by year: 2020 one, 2021 four, 2022 two, 2024 twelve, 2025 seven.
  - None of the READMEs asks solvers to keep the brief private. The repositories are individuals' accounts, so their URLs stay in the git-excluded notes.
- **What the READMEs say the task is.**
  - "Create a minimum layout video streaming home page frontend utilizing provided url data." (2024-03, titled "Disney - Living Room Devices Client", "Engineering Interview Candidate Assignment", "Take-Home Coding Assignment").
  - "This is the backing code for my submission for the take-home coding assignment as part of the Disney interview process." (2024-04).
  - "This is a simple JavaScript application meant to mimic the landing page of a streaming service with selectable content tiles the user can scroll through." (2021-12, "Disney Streaming Take Home").
  - "Disney ESPN Assignment" (2024-10); "Welcome to My Take-Home Project!" (2025-01, a Hulu repository); "DSS take-home exercise." (2021-03).
  - Roku: "This is a Roku SceneGraph application developed as part of the Disney Living Room Devices Engineering take-home assignment." (2025-07).
- **Requirements as one candidate lists them** (2025-04, web, under P0 and P1 requirements):
  - P0: "Consume the Home API and render pre populated data", "Focused tile must be scaled", "Support for control remote like navigation", "Tile interaction".
  - P1: "Dynamically populate refs", "Popup tab focus trap in side bar", "Video preview".
- **Other details candidates report.**
  - Navigation by arrow keys only: "Mouse interactions (specifically, clicking and scrolling) are disabled to better mimic a living room device scenario." (2024-04); "Able to navigate intuitively with keyboard controls up/down/left/right." and "The focused tile is visually scales up for noticeability." (2024-03).
  - Rows loaded as they scroll into view: "Ref sets only load once they are at least partly visible on the page" (2024-04); "Initially unpopulated rows will dynamically populate as they come into view" (2024-06).
  - An old browser: "Chrome version 38 doesn't support the following features, thus, they were not implemented in the code:" followed by the Intersection Observer API (2025-04).
  - No framework in some accounts: "No 3rd party libraries or frameworks" (2024-03); "contstraints of NO JS frameworks or Webpack" (2024-07, spelling as in the source); "A minimal, performant tile-based UI built with vanilla Javascript." (2024-11).
  - React in others: "A simple Roku-like home screen implemented in React." (2024-07), and React with TypeScript in 2025.
- **Older Disney briefs.** A 2016 repository holds a "Client Engineering Coding Challenge for Front End Job Candidates": "Build a web app that displays images taken by NASA's Mars rovers, Opportunity and Curiosity."; "At the end of 2 hours, upload your app to your github repo and send the url to your Studio Tech contact." Mobile repositories (Kotlin and Swift) solve other Disney exercises (a Marvel catalogue, a guest reservation screen) and backend repositories a dog-breed API; none is used here.

### Unreadable or seen in search only

| id | pointer | publisher, date | access | note |
|---|---|---|---|---|
| DC-14 to DC-16 | 1point3acres threads 1157660, 1161025 and 1155288 | 1point3acres | F for the visible text since 2026-11-11 | moved to Frontend accounts outside Taro; their hidden parts were not read. DC-14 is the original of DC-8, so DC-8 is not independent of it |
| DC-17 to DC-19 | 1point3acres: a 2018 frontend interview (async patterns, callbacks, event listeners), a 2024 ads-platform full-stack phone screen, a 2015 Hulu loop | 1point3acres | U | search summaries only |
| DC-20, DC-21 | https://leetcode.com/discuss/post/748385/ and https://leetcode.com/discuss/post/1340579/ | LeetCode, 2020-07-22 and 2021-07-16 | F since 2026-11-11 | DC-20 is a question with no replies ("Comments (0)"), so it holds no account. DC-21: "Phone Interview. Hackerrank question.": print the names and times of the K distinct jobs with the longest running instances, from start and end log lines; role not stated. A commenter (2025-02-06): "Thanks for posting this. Got this question recently." Contrast only |
| DC-9 to DC-11 | PracHub question pages: "Build a sortable, searchable movie list UI" (2026-01-22); a shopping cart and feature flags page and a mentoring code review page, both linked from DC-8 | PracHub | P | prep-site expansions of reported questions; not counted |
| — | Glassdoor Disney and Disney Streaming reviews | Glassdoor | not opened (rule) | the Taro rows are rewrites of some of them |

### Postings (open on 2026-11-03)

DP-1 to DP-24 are Workday postings, saved as the API's JSON (F). DP-25 onward exist only on `www.disneycareers.com` and were read through WebFetch (S). No posting describes interview rounds or assessments. Every `www.disneycareers.com` posting links "Disney's guidelines on the use of AI for candidates". Ids are Disney requisition numbers.

| id | posting | content |
|---|---|---|
| DP-1 | 10157840 "Sr Product Software Engineer (News Front-End)", New York; Workday start 2026-10-15, "Date Posted" 2026-08-28; "Primarily On-Site / Occasionally from Home" | "As a Senior Product Software Engineer on the News Web Squad, you will be part of a team focused on building and maintaining the web sites for ABC News and the eight ABC Owned and Operated Television Stations."; "Minimum of 5 years of relevant professional software engineering experience."; "Extensive experience with TypeScript, JavaScript, React, Node.js, and modern front-end web development technologies and best practices."; "Comfortable leveraging AI-powered development tools and coding assistants to enhance productivity, with strong judgment in validating outputs, ensuring code quality, and guiding others on effective adoption." |
| DP-2 | 10160176 "Manager, Product Software Engineering - Frontend", New York; start 2026-10-09 | "We’re looking for an experienced Software Engineering Manager to lead the JavaScript-based Disney Media Player experience across web and connected-device surfaces." |
| DP-25 | 10162160 "Front-end Product Software Engineer II", ESPN; Bristol, Glendale or New York; posted 2026-10-22 (S) | "Experience with React and NodeJS"; "Minimum 3+ years relevant industry experience." |
| DP-26 | 10161097 "Lead Software Engineer (React)", Buenos Aires; posted 2026-11-02 (S) | "Build and maintain the React-based frontend across all product surfaces that finance workers and budget owners use daily."; "Deep React fluency required, including modern state management, performance optimization"; "7+ years of software engineering experience, with deep expertise in modern frontend development." |
| DP-7 | 10157846 "Sr Product Software Engineer (Roku Engineering)", New York; start 2026-10-12 (DP-8 is the Software Engineer II version, 10157641) | "As part of the ABC News Mobile and Living Room Devices team, you will help us push the boundaries of what is possible on some of the most interesting 10-foot devices in the marketplace!"; "Be a critical member of a team of engineers responsible for building our client app experiences in BrightScript, using the Roku SceneGraph SDK"; the role also touches "JavaScript- & React-based web tools, gulp build scripts, AWS configurations, and Node.js services" |
| DP-4 | 10145075 "Senior Software Engineer", Seattle or New York | "Our team is seeking a Senior Software Engineer to help us deliver excellent streaming experiences for Hulu, Disney+ and ESPN+ as a developer of our web-based JavaScript player." |
| DP-5 | 10130019 "Lead Software Engineer", Buenos Aires; "Date Posted" 2025-09-02 | "Hands-on coding. You will implement and debug in an unfamiliar codebase."; "Concrete system design. Handed an unfamiliar problem, you get down to the actual interfaces, interactions, and responsibilities."; "Strong React 18+ and TypeScript." The posting does not say whether the first two lines describe the interview or the job |
| DP-27 | 10162149 "Lead Full Stack Product Software Engineer - ESPN"; Bristol, New York or Glendale (S) | "Comprehensive expertise in JavaScript/TypeScript and modern frontend frameworks (React strongly preferred)"; "Experience using AI-assisted development tools (e.g., Cursor, Claude, Kiro)" |
| DP-3 | 10143792 "Software Engineer II", Ad Platforms; Glendale, Seattle or San Francisco | "Expertise in HTML & CSS, JavaScript/TypeScript and React Library" |
| DP-11 | 10149375 "Sr Full Stack Software Engineer", Orlando (parks payments) | "Design, develop, and maintain full-stack payment processing applications spanning Java 21/Spring backend microservices, Angular 18 frontend applications, and Node.js 20 API layers" |
| DP-12 | 10154769 "Staff Software Engineer", Burbank, fully remote | "Strong proficiency with a modern component-based front-end framework (Angular preferred; React, Vue, or similar considered), along with TypeScript, HTML, and CSS, and a strong sense of design patterns and best practice" |
| DP-29 | 10163074 "Sr Product Software Engineer", Glendale (S) | "Familiarity with web accessibility (WCAG) standards and inclusive design principles." |
| DP-30 | 10162958 "Product Software Engineer II", New York or San Francisco (S) | "Technologies: VueJS, React, NodeJS, Playwright, SonarQube" |
| DP-31 | 10162722 "Manager, Product Software Engineer", Ad Platforms, Glendale (S) | "spanning a modern front-end stack (React, TypeScript, and Next.js)." |

**Re-checked 2026-11-11 (Workday, by requisition number).** DP-1 (10157840) and DP-2 (10160176) returned no result, while a control search for a new posting (10160173) returned it, so both were closed or unlisted. DP-7 (10157846) and DP-8 (10157641) were still listed. DP-25 and DP-26 on `www.disneycareers.com` were not re-checked. New since 2026-11-03: 10160173 "Product Software Engineer II", New York, start 2026-11-09, a Java role that also asks for "Experience with UI frameworks (React/Typescript)". The search results are saved under `research_notes/disney-2026-11/raw/postings/`.

The other adjacent postings (DP-6, DP-9, DP-10, DP-13 to DP-24, DP-28, DP-32 to DP-45) name React, Angular, Vue or Next.js in full-stack, platform, internship or tooling roles. Eight iOS, Swift and Android postings filed under Disney's streaming frontend business were set aside.

### Official pages

| id | URL | date | access | content |
|---|---|---|---|---|
| DO-1 | https://sites.disney.com/lifeatdisney/career-opportunities/2026/07/16/top-5-tips-for-your-interview-with-disney/ | 2026-07-16 | F | "As you await your interview, start by carefully reviewing the invitation and confirming with your recruiter what will be covered, so you know what to expect."; "Using methods like STAR–Situation, Task, Action, Result–can help you clearly articulate specific projects, challenges and wins in your answer." |
| DO-2 | https://sites.disney.com/lifeatdisney/podcast/how-to-get-a-job-at-disney-recruiter-tips-resumes-interviews-applications-1-s3e11/ (show notes, not the audio) | 2026-06-30 | F | "Candidates who align most with the role will be invited to a recruiter screen, which is typically a virtual conversation to learn more about their background, interests and experience."; "When a recruiter believes the candidate could fit the role, they’re advanced to the interview stage with the hiring team."; on a rejection: "When facing a “no,” our recruiters emphasize not to become discouraged and to take it as a “not yet.”"; "Sevay recommends staying connected with the recruiter and keeping a close eye on the Disney Careers site to apply again in the future." |
| DO-3 | https://join.disneycareers.com/global/en (the scam notice) | undated | S | the notice warns about scammers "asking for personal information and/or money as part of our interview process" and says of Disney's recruiters: "They will not request funds or payment in any form or personal information" |
| DO-4 | the 2026 Disney Careers interview checklist (PDF linked from Candidate Resources) | 2026-06-17 | F (image PDF, transcribed) | "Be prepared to answer behavioral interview questions and practice using the STAR interview technique."; "If meeting virtually, make sure your internet connection is stable and check out Zoom FAQs."; "Check on your application on DisneyCareers.com to see where you are in the interview process." |
| DO-5 | the 2026 Disney Careers interview-prep PDF | 2026-06-17 | F | behavioral questions "are used to assess soft skills like communication, teamwork, adaptability, and leadership so we can see how you bring your character to life in the workplace." |
| DO-6 | https://join.disneycareers.com/global/en/candidate-resources | undated | F (Claude in Chrome, 2026-11-11; S on 2026-11-03) | the four steps: Apply, "Screen" ("If your experience and skills align with the role, a recruiter may reach out to spark a conversation full of possibility."), "Interview(s)" ("you may meet with our hiring team so they can learn more about the talents and experiences you bring."), "Selection" ("Once the interviews have concluded, our hiring team will reflect on each candidate’s journey."); "Our hiring teams use behavioral interviews to discover the hero behind the résumé — you!" |
| DO-7 | https://join.disneycareers.com/global/en/ai-usage ("AI Usage Guidelines") | undated | F (Claude in Chrome, 2026-11-11; S on 2026-11-03) | allowed: "You're welcome to use AI as you prepare to apply or interview, such as:" (research, résumé help, interview practice); not allowed: "Completing assessments (such as coding exercises, job assessments, writing samples, or language tasks)" "unless instructed otherwise."; "If AI use is allowed during the assessment, we will clearly communicate that expectation"; "Generating interview answers in real time or using tools that respond on your behalf"; "Using deepfake, appearance‑altering filters, or voice-cloning tools during interviews"; "Using AI note taking assistants, and all forms of recording or transcribing any conversations"; consequence: "this may, alongside other relevant factors, impact your candidacy and advancement"; on Disney's side: "AI can assist along the way, but people, not algorithms, make every advancement and hiring decision."; added from the full read: also not allowed, "Creating false or misleading experiences, skills, or qualifications on your résumé, cover letter, or application"; Disney's own use includes notes: "With candidate consent, Recruiters may use AI to support their note-taking, helping them stay fully focused on the conversation." |
| DO-9 | https://sites.disney.com/ngr-privacy-policy/ (the policy that covers applicants) | "Last Updated: 7/24/2023" | F | covers "information generated during an interview and/or any written assessments (when applicable) in connection with a job application"; names no assessment vendor |
| DO-10, DO-11 | https://join.disneycareers.com/global/en/students-and-recent-graduates and https://join.disneycareers.com/global/en/disney-internships | undated | S | "Upon submission, candidates may be invited to complete additional steps before an offer is extended."; "Internships are posted throughout the year based on business need and school terms."; summer application period "January – March."; spring "August – October." |
| DO-18 | https://thewaltdisneycompany.com/press-releases/the-walt-disney-company-reports-fourth-quarter-and-full-year-earnings-for-fiscal-2025/ | 2025-11-13 | F | the Hotstar joint venture (see Research rules) |
| DO-21 | Workday posting 10154299 (a product manager role in Canada) | open 2026-11-03 | F | the only posting with this disclosure: "At Disney, we incorporate certain artificial intelligence (AI) tools to support aspects of our recruitment process." |
| DO-24 | a 2018 Life at Disney post on the Grace Hopper Celebration (now HTTP 404) | 2018 | S (search snippet) | "Prior to the conference, Disney released a coding challenge via HackerRank." The only official mention of an assessment vendor found |

Searched and NOT FOUND: an official engineering interview page; anything official on coding rounds, take-homes, recorded video interviews, round counts or timelines; a named vendor other than Zoom and the 2018 HackerRank challenge; a candidate privacy notice beyond DO-9; a Disney Entertainment and ESPN Technology careers page (the Technology and Engineering career page is placeholder text). Most of the Disney Careers pages could be read only as sentence-level quotations (S); DO-6 and DO-7 were read in full through Claude in Chrome on 2026-11-11.

### Stack context (not interview evidence)

| id | URL | date | content |
|---|---|---|---|
| DO-12 | https://medium.com/hulu-tech-blog/introducing-hulus-modern-web-stack-d0be4cf4f439 | 2019-06-13 | "We chose React as our UI library."; "We chose next.js as the underlying framework."; "Ever since the first commit, we’ve required 100% unit test coverage." |
| DO-13 | https://medium.com/disney-streaming/building-the-hulu-experience-in-the-living-room-10eabf5391d6 | 2021-05-10 | "For Living Room devices, the Hulu experience that users are interacting with is actually a fully hosted modern web application written in HTML and JavaScript" |
| DO-14 | https://medium.com/disney-streaming/introducing-the-disney-application-development-kit-adk-ad85ca139073 | 2021-09-08 | "For client app development we chose Rust, targeting WebAssembly (WASM), for ease of web deployment and app updatability outside of any firmware update cycles that limit our ability to update the C-based runtime." |
| DO-15 | https://medium.com/disney-streaming/react-rxjs-pushing-state-down-4205af78f8b0 | 2021-10-28 | "State management in React is a difficult problem to solve because finding the right place to manage state is challenging." |
| DO-16 | https://medium.com/disney-streaming/api-driven-spa-with-nginx-1546a80b5fef | 2021-12-08 | the team-autonomy sentence quoted in the Verdict |
| DO-17 | https://github.com/disney/mocking-jukebox | created 2022-10-10 | "Record and playback mock data for network requests made by frontend web apps" |

The Disney Streaming blog stops in February 2023 and the Hulu blog in May 2021; no Disney writing on the web frontend from 2023 to 2026 was found.

### Previews and templates (not evidence)

Prepfully (Disney and Walt Disney frontend engineer question banks), Dataford (a Disney+ Hotstar frontend guide), PracHub question lists and the 1point3acres company page appear in search results and were not cited.

## Loop by level and region

Disney has no single loop (DC-Cx1, DO-16). The groups below follow the accounts, newest first.

### Frontend engineers on product teams, United States, 2020 to 2025 (D1, D7, D20 to D23, D26 to D28; DC-1, DC-Cc2, DC-Cc3; DC-15, DC-16)

1. A recruiter screen (D20, D26, D27, D28). Officially "typically a virtual conversation" (DO-2).
2. A hiring manager or tech lead (D20, D22, D27). In D7 the first conversation was with a director. In DC-16 (2025) each of two streaming teams opened with a hiring manager: one asked basic behavioral questions and an easy LeetCode problem, the other asked about project experience.
3. One of these:
   - a take-home build, later reviewed (D7, D20, D21, D26; D27 had the option);
   - a one-hour live React task in steps (D1);
   - an on-screen JavaScript test (D23);
   - "two pretty easy coding questions" (DC-Cc2);
   - on site, building a UI that is shown to you and wiring it to an API (D28);
   - on a 2022 Disney Streaming loop, reading code and a mock pull request review with no coding (DC-1);
   - a code review of a simple React app: find the problems and give feedback (DC-16, 2025, the streaming teams);
   - in an onsite for a general role, a frontend coding round on a movie list with sort and search, next to a system design, an LRU question and behavioral questions (DC-15, 2025).
4. Frontend system design (D20, D21, D28; DC-Cc3; announced in DC-3 and DC-6).
5. A PM, director or hiring manager conversation and behavioral questions (D7, D8, D20, D27, D28).

### Lead and principal (DC-8; DC-12 as corroboration)

- DC-8 (lead frontend, Seattle, 2025-11): an in-person second round in four parts: a Senior TPM conversation, a code review with a Principal Engineer, and two frontend system design rounds. A hiring manager follow-up on stakeholder management came after. The poster reported a signed offer in January 2026 (DC-14).
- DC-12 (T, principal full-stack, APAC, 2026): React internals and rendering performance with a partly built coding problem, then system design and low-level design.

### Living-room and streaming clients (G; D26; DC-1; DP-7, DP-8; DO-13, DO-14)

- The take-home in the GitHub section: a streaming home page from a JSON API, driven by arrow keys like a remote, often without a framework.
- In READMEs it is linked to "Living Room Devices" (2024-03 web, 2025-07 Roku), ESPN (2024-10) and Hulu (2025-01).
- Disney is hiring for this work today: the ABC News "Mobile and Living Room Devices team" (DP-7, DP-8, Roku).
- DO-13 describes the Hulu living-room app as a web application in HTML and JavaScript.

### United Kingdom and Europe (D6; DP-6)

- D6 (junior, Manchester, 2022): behavioral interviews and a technical assessment, with detailed feedback and a long wait.
- An open Disneyland Paris lead posting names JavaScript, TypeScript, React and Next.js (DP-6).

### Early career (D9, D31, D34; DC-Cc4; DO-10, DO-11, DO-24)

- D9 (2020): a 30-minute recruiter call, then a developer's technical questions.
- D31 (2019, New York): questions on SQL, web protocols and React, with no coding.
- DC-Cc4 (2022, a Disney Streaming Services intern): hashmap and tech-stack questions, with many behavioral and culture-fit questions.
- D34 (2020): a take-home coding challenge after two video calls, under ten hours.
- Officially, internships open through the year, with application periods by term (DO-11). In 2018 Disney released a HackerRank coding challenge before the Grace Hopper Celebration (DO-24, S).

### India and China (D5, D35)

- D5 (UI developer, India, 2022) reads like a non-engineering role.
- D35 (Beijing, 2025) is an algorithm loop with "Hand-write a Promise."
- Hotstar is excluded (see Research rules).

### Older accounts (2009 to 2017: D12 to D16)

- Park and studio web developer interviews: recruiter calls, a panel of eight people two at a time (D15), a coding submission and an NDA (D14), React and Redux questions (D13), the JavaScript DOM for an ESPN internship (D16) and a roller-coaster design puzzle (D12).

### Levels, locations and work model

- **Levels in accounts:**
  - "Software Engineer II - Frontend" (D1); SWE II and SDE 2 (DC-6, DC-3, plans).
  - Associate (D26); Junior (D6).
  - Senior (D13, D14, D27); P3 (DC-2, a reply on levels).
  - Lead (DC-8); Principal (DC-12, T).
- **Today's frontend postings:**
  - Software Engineer II with "Minimum 3+ years relevant industry experience." (DP-25).
  - Senior with five years (DP-1).
  - Lead with seven years (DP-26).
  - A manager (DP-2).
- **Work model:**
  - Postings: mostly "Primarily On-Site / Occasionally from Home" (DP-1, DP-2). DP-8 says "This position must sit onsite four (4) days a week in one of our technology offices listed above".
  - Reports: in 2022 one web team was "web strictly remote" (DC-4). By 2025 onsites were in person again for one lead loop (DC-8).

## Reported questions

The question list below gives every question with its round, role and date, including those first listed on 2026-11-12 from Taro's question fields (D2, D4, D9, D10, D15, D23, D26 to D35); their wording is quoted in the Sources tables. Since the frontend-only rule of 2026-11-12 the list leaves out backend, infrastructure and systems questions; the subsections below still record them as evidence.

### The living-room take-home (G, 2020 to 2025; D26)

- Build a streaming home page from a provided JSON API: a home document gives the rows, and further "ref sets" are fetched by id.
- Show rows of tiles and move focus with the arrow keys only. Scale the focused tile, open details on Enter and close them with Back or Escape.
- Lower-priority items in one candidate's list: load the remaining rows as they come into view, trap focus in a popup and preview video.
- Constraints reported:
  - no third-party libraries or frameworks (2024-03, 2024-07);
  - mouse input disabled (2024-04);
  - an old browser that lacks the Intersection Observer API (2025-04).
- Candidates' own notes add image fallbacks when art is missing (2024-04, 2024-06) and keeping the visible column when moving between rows (2024-11).
- D26 (2021): "creating a streaming app based on a provided visual mockup".

### Take-home builds and their review (product teams)

- "Take-home assignment where you're asked to implement changes to a React app." (D21, 2023), then a round on the changes.
- A take-home with "test cases for all levels", reviewed by two senior engineers (D7, 2021).
- A take-home for a frontend contract role, then "Went over the take-home project and asked to make one revision on the call." (D20, 2024).
- "I was offered a take-home coding exercise, which was vaguely described as optional." (D27, 2021).
- A take-home reviewed in a 90-minute panel: "During the code review, they asked why I made many of the decisions I did." (D32, 2021, a C and C++ role).
- Older: "Coding submission." (D14, 2016).

### Live coding

- "The task was to create a scoreboard banner for the top of the website." in five steps, with React and the company's API, in one hour; "Research on Google was permitted, but AI tools were not." (D1, 2025).
- "Given a scenario, I needed to complete code to produce the desired result." (D23, 2024).
- "Build the UI shown to you" and "Add event listeners to integrate the provided API" (D28, 2020).
- "two pretty easy coding questions" (DC-Cc2, 2022); on Streaming teams, coding "in Javascript" (DC-Cc1, 2022).
- "FrontEnd coding: 要求显示电影名，年份，可以sort, search" (show film titles and years, with sort and search), in a 2025 onsite for a general role (DC-15, read 2026-11-11; the details are hidden). PracHub's question page "Build a sortable, searchable movie list UI" (DC-9, P, 2026-01-22) appeared nine days later.

### Code reading and review

- "Just had to go over code (basically trick questions about scope) and tell what was going on and do a mock pr review" (DC-1, 2022, first round).
- "a code review with a Principal Engineer — they showed you some badly written code", "(I was interviewing for frontend, so it was frontend code)", followed by how you would help the junior who wrote it and "some mentoring experience questions" (DC-8, 2025).
- "基本上給你看一個滿簡單的程式(我是面前端的所以是一個簡單的react app)，要你找問題跟給feedback" (a fairly simple program, for frontend a simple React app: find the problems and give feedback), the first part of a streaming team's technical round, announced by the recruiter as LeetCode-style (DC-16, 2025).

### JavaScript and React questions

- "The only Javascript question was about closures." (D29, 2019).
- "Which React hooks handle which React lifecycle events?" and what the browser's history object does (D7, 2021).
- "How to manage React component state." (D22, 2024).
- "Questions were about React and Redux." and "Why shouldn't state be mutated?" (D13, 2017).
- "One question asked about the programming language JavaScript DOM, since that's what you'll be working with in the internship." (D16, 2015).
- React internals, "I was asked how can I improve the performance of the UI rendering." and "He also asked me about browser engine." (DC-12, T, 2026).
- In a 2022 backend loop, "how a react dom like actually worked on a lower level" (DC-5).

### System design

- "the first was a shopping cart, the second was feature flag design." (DC-8, 2025, frontend-focused, on a whiteboard).
- An upload-video feature like YouTube's, drawn and explained (D20, 2024).
- "How to design an API service for a front-end application" (D21, 2023).
- "Identify UI components", "Identify web API needed, including endpoint, sample request and responses, and HTTP method" and "How would you integrate these?" (D28, 2020).
- "Design the fast pass system for their parks." (D7, 2021, an OOP whiteboard round).
- A pet adoption mobile app, walked through "from the front end to the back end" in the engineering team manager's session (D29, 2019, a full-stack position).
- "a system design question" (DC-Cc3, 2025). Announced only: DC-3 (2026) and DC-6 (2025).

### Behavioral, PM and director

- Official: "Our hiring teams use behavioral interviews to discover the hero behind the résumé — you!" (DO-6); STAR in DO-1, DO-4 and DO-6.
- "Be prepared for some of them being Disney-themed." (DC-Cc1).
- "Why do you want to work for the Walt Disney Company?" (D11); "What is your favorite Disney Character?" (D8).
- Stakeholder management and mentoring for a lead (DC-8).
- PM rounds: "Zoom meeting with PM over behavioral questions" (D20); "one long day of interviews with the Product Manager, two Senior Engineers, and the Hiring Manager again" (D27); "Lunch with the prospective team director and PM" (D28).
- "How would you redirect bad traffic on a website?" (D24, a product engineer).

### Algorithms

- "Then, did a LeetCode medium problem." after the take-home review (D20).
- "Reverse words in a sentence." (D29).
- "Phone screen was LC medium+." for a senior loop of unstated role (DC-2).
- "Hand-write a Promise." (D35, Beijing).
- "一題簡單哩扣" (one easy LeetCode problem) from a streaming team's hiring manager (DC-16, 2025); "算法题：LRU" in an onsite (DC-15, 2025).
- A HackerRank phone question on log lines: the K distinct jobs with the longest running instances (DC-21, 2021, role not stated; a commenter got it again in early 2025).

## The question list (added 2026-11-12)

Every distinct question or task that a source attributes to Disney, one row each. Two accounts count as one question only when they describe the same task. Each row gives the round as the source names it (`Round not stated` when it does not), the role and date, and the sources; the quotes are in the Sources tables and under Reported questions. Taro keeps an account's questions in a field apart from its process text, so a Taro question has a round only when the process text places it; where it does not, the brackets name the loop's matching round as context. Since 2026-11-12 a row stays only when the question itself is frontend or general (behavioral questions, algorithms, the review of your own take-home), whoever was asked; backend, infrastructure and systems questions are left out, and Count lists the removed rows. The 1point3acres threads (DC-14 to DC-16) can inform page copy but cannot be cited in a process table (see Research rules). Catalog entries follow the mapping proposal below.

### A. Take-home builds and their review

| # | question or task | round | role, date | sources | catalog |
|---|---|---|---|---|---|
| Q1 | Build a streaming home page from a JSON API and drive it like a TV remote: a home document gives the rows, further sets of titles load by id, arrow keys only, the focused tile scaled, details on Enter, closed on Back. Lower priority in one brief: rows that load as they come into view, a focus trap in a popup, a video preview. Constraints reported: no third-party libraries or frameworks, no mouse, an old browser without Intersection Observer | take-home; D26: a coding challenge | web solutions created 2020-12 to 2025-07, whose READMEs name Living Room Devices (2024-03), ESPN (2024-10) and Hulu (2025-01); D26: Associate Software Engineer, a front-end job, United States, 2021-05*, a streaming app from a provided visual mockup | G (26 web repositories; the same brief also on Roku, Rust and C++); D26 | gaps 1 to 3; tag `ui-component-state-from-mock` (D26, the design step); links `react-file-explorer`, `css-grid-card-gallery`, `react-vanilla-dropdown-port`, `infinite-scroll-list`, `html-dialog-confirm-a11y`, `netflix-scale-expansion` |
| Q2 | Implement changes to a React app, then talk about the changes in person | take-home assignment, then an in-person interview | Software Engineer, New York, 2023-08-18 | D21 | gap 4 |
| Q3 | A take-home coding project with test cases for every level, where senior candidates had extra specs to meet; the review asked mostly about those specs | take-home coding project, then a code review with two senior engineers | Full Stack Web Developer, United States, 2021-06-16 (not a senior role) | D7 | gap 4 |
| Q4 | Go over your take-home with the reviewers: why you made each decision and what it trades off, and one revision made live on the call | a Zoom call with two engineers; a 90-minute panel, half of it on the code; final interviews on your technical choices | a frontend-focused contract role, Glendale, 2024-09-27; Associate Software Engineer, a front-end job, 2021-05*; Software Engineer, C and C++, 2021-01* | D20, D26, D32; the reviews in Q2 and Q3 (D21, D7) | gap 4 |
| Q5 | A web app that shows images taken by NASA's Mars rovers, built in two hours and sent to the Studio Tech contact as a GitHub link | coding challenge for front-end candidates | Studio Tech, 2016 | G (one repository) | none |

Not shared by the account: the take-home of a frontend-focused contract role (D20, 2024); an optional take-home, declined for a deeper technical assessment with senior engineers (D27, 2021); a take-home of about four hours (D33, Zürich, 2020); a coding submission (D14, 2016); a take-home that may never have been graded (DC-Cc3, 2025). The interns' take-home is in Q52.

### B. Live coding and UI tasks

| # | question or task | round | role, date | sources | catalog |
|---|---|---|---|---|---|
| Q6 | Build a scoreboard banner for the top of the website in React from the company's API, in five steps; Google allowed, AI tools not | one-hour technical interview with a senior engineer | Software Engineer II - Frontend, 2025-05* (Taro's city, Bergen op Zoom, is probably wrong) | D1 | links `react-fetch-list-states`, `react-autocomplete-search-starter` |
| Q7 | Show a list of films with their titles and years, with sort and search (the details are hidden) | onsite, frontend coding round | a general software role, 2025 Q4 | DC-15 (page copy only); DC-9 (P, a prep-site expansion) | link `react-filterable-user-list` (pinned) |
| Q8 | Build the UI shown to you, then add event listeners to integrate the provided API | on-site, 2nd hour, frontend focused | Full Stack Software Engineer, New York, 2020-01* | D28 | `ui-component-state-from-mock` (the design step only) |
| Q9 | Given a scenario, complete the code so that it produces the desired result: an on-screen JavaScript test | remote video call with a team of three, about 45 minutes | Software Developer, Glendale, 2024-07-04 | D23 | none |
| Q10 | Create a new plugin that handles certain functions, sharing your screen | technical test on a shared screen, after questions on the tech stack | Web Developer, Orlando, 2023-03* | D4 | none |
| Q11 | Two problems on arrays, a REST API and JSON | coding challenge on a website | Software Developer, United States, 2022-08-06 | D25 | none |
| Q12 | Complete the core business logic of a partly built problem and render data fetched from a central store | Round 1, Frontend Technology & Coding | Principal Full-stack Engineer, APAC, 2026 | DC-12 (T, corroboration only) | none |

Not shared by the account: two easy coding questions (DC-Cc2, frontend, 2022); a one-hour coding interview (D10, frontend, 2020); a 15-minute coding session in a phone screen (D28, 2020). A 2022 commenter expected Streaming teams to ask for JavaScript (DC-Cc1).

### C. Code reading, review and debugging

| # | question or task | round | role, date | sources | catalog |
|---|---|---|---|---|---|
| Q13 | Read code and say what is going on, with trick questions about scope, then a mock pull request review; no coding | first round | a Disney Streaming Services front end loop, 3 years of experience, 2022-02 | DC-1 | tag `react-debug-api-misuse` (DC-1); gap 5 |
| Q14 | Suggest changes to badly written frontend code, say how you would help the junior who wrote it, then answer questions on your mentoring experience | second round, part two: a code review with a Principal Engineer, in person | Lead Software Engineer (Frontend), Seattle, 2025-11 | DC-8 (DC-14, its original, hides this part) | `react-debug-api-misuse`; gap 5 |
| Q15 | Find the problems in a fairly simple React app and give feedback; the recruiter had said to expect a LeetCode-style round | technical round, first part | FrontEndEng, the Disney+ and Hulu streaming teams, 2025 Q3 | DC-16 (page copy only) | `react-debug-api-misuse`; gap 5 |
| Q16 | Diagnose a production problem | onsite: each of five rounds mixed this with coding, system design and behavioral questions | Software Engineer, United States, 2019-05-09 | D30 | none |

DP-5's posting asks a lead to implement and debug in an unfamiliar codebase without saying whether that describes the interview, so it is not a row.

### D. JavaScript, React, web and OOP questions

| # | question or task | round | role, date | sources | catalog |
|---|---|---|---|---|---|
| Q17 | Which React hooks handle which React lifecycle events | Round not stated | Full Stack Web Developer, United States, 2021-06-16 | D7 | `react-useeffect-purpose` (trivia, tag only) |
| Q18 | What `window.history` does | Round not stated | the same account | D7 | gap 7 |
| Q19 | How to manage React component state | first hiring manager round, 45 minutes | Software Engineer, San Jose, 2024-06* | D22 | `react-state-management-redux` (trivia, tag only) |
| Q20 | Why state should not be mutated, in an interview about React and Redux | Round not stated | Senior Web Developer, Los Angeles, 2017-01* | D13 | none |
| Q21 | Closures, the loop's only JavaScript question | Round not stated | Software Engineer, a full-stack position, Canada, 2019-09* | D29 | `js-closures` (trivia, tag only) |
| Q22 | React internals, how to improve UI rendering performance, and the browser engine | Round 1, Frontend Technology & Coding | Principal Full-stack Engineer, APAC, 2026 | DC-12 (T) | none |
| Q23 | How React DOM works at a lower level | a behavioral round that turned technical, on site | a Disney Streaming backend loop, 2022 | DC-5 | none |
| Q25 | The technologies you would use in the role; no coding | Round not stated | Web Developer, United States, 2024-07-03 | D2 | none |
| Q26 | OOP questions, about 30 minutes, before a 15-minute coding session | technical phone screen with an engineer, 45 minutes | Full Stack Software Engineer, New York, 2020-01* | D28 | none |

### E. System design

| # | question or task | round | role, date | sources | catalog |
|---|---|---|---|---|---|
| Q27 | A shopping cart, frontend-focused, drawn on a whiteboard | second round, part three, in person | Lead Software Engineer (Frontend), Seattle, 2025-11 | DC-8 | links `react-shopping-cart`, `resilient-checkout-payment-flow` (both pinned) |
| Q28 | Feature flag design, frontend-focused, on a whiteboard | second round, part four, in person | the same account | DC-8 | gap 6 |
| Q29 | An upload-video feature like YouTube's: draw it and explain your process | Round not stated (the loop's design round: a principal engineer, on Zoom) | a frontend-focused contract role, Glendale, 2024-09-27 | D20 | gap 8; link `image-upload-preview` (pinned; images only) |
| Q30 | How to design an API service for a front-end application | Round not stated (the in-person interview included system design exercises) | Software Engineer, New York, 2023-08-18 | D21 | none |
| Q31 | Identify the UI components and the web API they need (endpoints, sample requests and responses, HTTP methods), and how you would integrate them | on-site, 1st hour: system design on a whiteboard | Full Stack Software Engineer, New York, 2020-01* | D28 | `ui-component-state-from-mock` |
| Q32 | Walk through the design of a pet adoption mobile app from the front end to the back end | the engineering team manager's session | Software Engineer, a full-stack position, Canada, 2019-09* | D29 | none |
| Q33 | Design the fast pass system for the parks | Round not stated (the loop's system design whiteboard round, which the candidate took as a test of OOP design) | Full Stack Web Developer, United States, 2021-06-16 | D7 | none (skipped: an OOP design) |

Not shared by the account: a system design question (DC-Cc3, 2025); an onsite system design round whose details are hidden (DC-15, 2025); two system design rounds in a senior loop of unstated role (DC-2, a commenter, 2022); a system design round and a low-level design round whose content came back as paraphrase (DC-12, T, 2026); system design inside five mixed onsite rounds (D30, 2019); design rounds announced in plans (DC-3, 2026; DC-6, 2025).

### F. Recruiter, hiring manager, PM and director conversations

| # | question or task | round | role, date | sources | catalog |
|---|---|---|---|---|---|
| Q35 | Why you want to work for Disney, or why you are applying to this job | recruiter phone interview (D11); Round not stated (D10, D15) | Front End Development, 2019-06*; Front End Developer, 2020-09-23; Web Developer, Glendale, 2016-02* | D11, D10, D15 | behavioral guide |
| Q36 | Your favorite Disney character; some questions may be Disney-themed | Round not stated (D8's loop: a recruiter, a team call with technical and behavioral questions, the director) | Web Developer, United States, 2021-05*; a commenter, role not stated, 2022 | D8, DC-Cc1 | behavioral guide |
| Q37 | Your past work, recent projects and motivations | a recruiter; a remote call with three people; an onsite behavioral round; a hiring manager | Software Developer, 2022-08-06; Software Developer, Glendale, 2024-07-04; Software Engineer, 2019-05-09; FrontEndEng, the streaming teams, 2025 Q3 | D25, D23, D30, DC-16 | behavioral guide |
| Q38 | Your approach to other projects, with a focus on state management, and the company culture | final round: three interviews, each with two interviewers | Associate Software Engineer, a front-end job, 2021-05* | D26 | behavioral guide |
| Q39 | A time you developed something with a team | Round not stated | the same account | D26 | behavioral guide |
| Q40 | Tell me about yourself; your hobbies | Round not stated (D9's recruiter call covered behavioral questions and the résumé) | Web Developer Intern, 2020-11*; Front End Developer, 2020-09-23 | D9, D10 | behavioral guide |
| Q41 | Your greatest strengths | Round not stated (the phone screen was basic behavioral, on culture fit) | Web Developer, United States, 2024-07-03 | D2 | behavioral guide |
| Q42 | What kind of environment you thrive in | phone interview | Web Developer, United States, 2023-11-29 | D3 | behavioral guide |
| Q43 | What you would do when you hit a roadblock | Round not stated (a video call on skills and experience came before the technical test) | Web Developer, Orlando, 2023-03* | D4 | behavioral guide |
| Q44 | Your motivation for learning to code | Round not stated (behavioral interviews and a technical assessment) | Junior Front End Developer, Manchester, 2022-08* | D6 | behavioral guide |
| Q45 | Your working style and how you collaborate | second round, part one: a half-hour chat with a Senior TPM | Lead Software Engineer (Frontend), Seattle, 2025-11 | DC-8 | behavioral guide |
| Q46 | Your stakeholder management experience | a hiring manager follow-up after the onsite | the same account | DC-8, DC-14 | behavioral guide |
| Q47 | Process questions and leadership fundamentals, beside a technical assessment | one long day with the Product Manager, two Senior Engineers and the hiring manager | Senior Software Engineer, United States, 2021-03* | D27 | behavioral guide |
| Q48 | Designing a roller coaster: four trains of five carts or five trains of four carts, and why | a short phone call with three interviewers, on past experience and what-ifs | Web Developer, Lake Buena Vista, 2017-10* | D12 | none |
| Q49 | Behavioral questions answered in the STAR format, about specific projects, challenges and wins (official advice, not a report) | interviews with the hiring team | Disney Careers, 2026 | DO-1, DO-4, DO-5, DO-6 | behavioral guide |

Rounds named without their questions: a PM round on behavioral questions (D20, 2024); lunch with the prospective team director and PM (D28, 2020); a first interview with a director, and a final round with a manager on another team about the company and its engineering culture (D7, 2021); a laid-back last interview with the director or head of the department, on behavioral and goal-oriented questions (D8, 2021); basic behavioral questions with a hiring manager (DC-16, 2025); more behavioral questions than coding (DC-Cc2, 2022); a few behavioral questions in a C and C++ panel (D32, 2021).

### G. Early career

| # | question or task | round | role, date | sources | catalog |
|---|---|---|---|---|---|
| Q50 | Your familiarity with web protocols and React, with no coding (the call's SQL and database questions are left out as backend) | virtual interview | Software Development Intern, New York, 2019-03* | D31 | none |
| Q51 | Hashmap questions and tech-stack questions, with many behavioral and culture-fit questions | intern interview | a Disney Streaming Services intern, role not stated, 2022 | DC-Cc4 | none |
| Q52 | Your experience and interests, in casual conversations with senior developers, and a take-home coding challenge of under ten hours (not shared) | two video calls; take-home | Software Engineering Intern, United States, 2020-07-15 | D34 | none |
| Q53 | The JavaScript DOM, after a review of the résumé | an ESPN internship interview | Web Developer, an ESPN internship, Atlanta, 2015-03* | D16 | none (history only) |

Officially, students and graduates may be asked to complete further steps before an offer (DO-10, S), and in 2018 Disney sent a HackerRank challenge before the Grace Hopper Celebration (DO-24, S); neither names a question.

### H. Algorithms, data structures and other coding questions

| # | question or task | round | role, date | sources | catalog |
|---|---|---|---|---|---|
| Q54 | An LRU cache | onsite, algorithm question | a general software role, 2025 Q4 | DC-15 (page copy only) | link `js-create-lru-cache` (pinned) |
| Q55 | From log lines that start and end jobs, print the names and times of the K distinct jobs with the longest running instances | phone interview, a HackerRank question | role not stated, 2021-07; a commenter got it again in early 2025 | DC-21 | none |
| Q56 | Reverse the words in a sentence | Round not stated | Software Engineer, a full-stack position, Canada, 2019-09* | D29 | none (skipped) |
| Q57 | Hand-write a Promise; BFS of a binary tree; flip a linked list every two nodes; algorithm and practical questions; an unclear item on regrets from production | virtual onsite, four rounds, an algorithm in each | Senior Software Engineer, Beijing, 2025-09-22 | D35 | links `js-create-deferred-promise`, `js-promise-all` (the Promise) |
| Q59 | FizzBuzz; a friend interviewing for the same position got a DFS graph problem | Round not stated | a commenter, role not stated, 2022 | DC-Cc1 | none |
| Q60 | General algorithm questions on binary trees and heaps | Round not stated (a general online interview with a few technical questions came before a take-home) | Software Engineer, Zürich, 2020-12* | D33 | none |
| Q61 | Algorithms and data structures questions, without coding (the panel's C and C++ questions are left out) | panel interview, after the code review | Software Engineer, United States, 2021-01* | D32 | none |

Not shared by the account: a LeetCode medium after the take-home review (D20, 2024); one easy LeetCode problem from a hiring manager (DC-16, 2025); the phone screen question (DC-15, hidden); a medium-plus phone screen and an onsite with a medium and a hard graph problem, in a senior loop of unstated role (DC-2, a commenter, 2022); a graph search in a senior coding screen (DC-13, T, summary only, 2024).

### Count

- **Rows:** 58 since 2026-11-12 (61 before the frontend-only rule):
  - A, take-homes and their review: 5;
  - B, live coding and UI tasks: 7;
  - C, code reading, review and debugging: 4;
  - D, JavaScript, React, web and OOP questions: 9;
  - E, system design: 7;
  - F, conversations: 15;
  - G, early career: 4;
  - H, algorithms, data structures and other coding questions: 7.
- **By content:**
  - 27 rows are frontend questions. Two of them are mixed: a design that runs from the front end to the back end (Q32), and a hand-written Promise beside algorithm questions (Q57).
  - 31 rows are general: 15 conversations (F), two early-career interviews (Q51, Q52), six algorithm rows (Q54 to Q56, Q59 to Q61) and eight others: take-home work and its review, a plugin, arrays with a REST API, a production problem, the tech stack, OOP questions and an OOP design (Q3, Q4, Q10, Q11, Q16, Q25, Q26, Q33).
  - Who was asked does not decide: Q23, a React question from a backend loop, stays.
  - Three rows rest on corroboration or official advice only (Q12 and Q22 from DC-12, T; Q49, official).
- **Removed on 2026-11-12 (backend, infrastructure and systems questions):**
  - Q24, redirecting bad traffic on a website (D24, 2024);
  - Q34, the backend hour: the API and classes behind the frontend, and the data models (D28, 2020);
  - Q58, a concurrency deadlock between two processes (D27, 2021);
  - trimmed: the SQL and database questions in Q50 (D31, 2019) and the C and C++ questions in Q61 (D32, 2021).
- **Most repeated:**
  - the review of your own take-home (Q4, with Q2 and Q3: five accounts, 2021 to 2024);
  - the living-room brief (Q1: 26 web solutions from 2020-12 to 2025-07, and D26);
  - system design (Q27 to Q33: seven prompts from six accounts; five are about a front end, one runs from the front end to the back end, one is an OOP design);
  - the review of given code (Q13 to Q15: three loops, 2022 to 2025);
  - your past work and projects (Q37: four accounts) and why Disney (Q35: three).
- **Gaps for a page:**
  - The details of DC-15's movie list and DC-16's React app are hidden behind forum points, and the 1point3acres threads cannot be cited in a process table.
  - Apart from Q6 and Q7, no account says what a live React round asked.
  - No report asks a TypeScript, web security or accessibility question.
  - The living-room brief has no round-by-round account apart from D26.

## Official pages (read 2026-11-03)

- **Process.** Apply, a recruiter screen, interviews with the hiring team, then selection (DO-2, DO-6). The screen is "typically a virtual conversation" (DO-2). Interviews are behavioral and STAR-based (DO-1, DO-4, DO-5, DO-6) and may be on Zoom (DO-4).
- **AI.** The "AI Usage Guidelines" allow AI to prepare. They rule it out for coding exercises "unless instructed otherwise.", for real-time answers, for deepfake or voice tools, and for note-taking or recording assistants (DO-7).
- **Reapplying.** No rule or waiting period was found. The 2026 podcast page encourages reapplying ("take it as a “not yet.”", DO-2).
- **Fraud.** A recruitment-scam notice (DO-3).
- **Engineering-specific text:** NOT FOUND. Nothing official describes coding rounds, take-homes, round counts or timelines.

## Comparison with the other 30 company pages

The other pages were read from the repository on 2026-11-03.

**Not refreshed on 2026-11-11.** Since 2026-11-03 other guides gained company-specific practice tasks, timed rehearsals and round decoders (for example CrowdStrike, Agoda, Airbnb, GitLab and Stripe), so this comparison understates what a new guide needs; re-read the pages before building. Rows below changed on 2026-11-11 only where the newly read sources add evidence.

- **Stage names:** all 30 process tables in `company-interview-processes.ts`. The stage types were grouped by keyword, so the counts are approximate.
- **Per-page facts:** from `reports/sirket-sayfalari-envanteri-2026-11-02.md`.

### Process steps

| Stage type | Tables with it (of 30) | Disney evidence | Status for Disney |
|---|---|---|---|
| Recruiter or HR call | 29 | official: a recruiter screen (DO-2, DO-6); D20, D26, D27, D28 | present, official |
| Hiring manager | 16 | D20 (tech lead), D22, D27; D7 (director) | present |
| Online assessment | 19 | D25 (two questions on a website, 2022), D6 (a technical assessment, UK); 2 of 55 generic 2024–2025 loops; a HackerRank phone question (DC-21, 2021, role not stated) | thin |
| Technical or phone screen | 20 | D28 (45 minutes: OOP and 15 minutes of coding), D30, D10 | present, older |
| Live, UI or machine coding | 17 | D1 (React, one hour), D23 (JavaScript), D28 (build the shown UI), DC-Cc2, DC-15 (a movie list with sort and search, 2025) | present |
| JavaScript and web fundamentals | 9 | closures (D29), scope (DC-1), the history object (D7), JavaScript DOM (D16) | thin |
| Algorithms | 8 | a LeetCode medium after the take-home review (D20); D29; DC-2 (role not stated); an easy LeetCode problem with a hiring manager (DC-16, 2025); LRU (DC-15, 2025) | present on some teams |
| Frontend system design | 19 | DC-8 (shopping cart, feature flags), D20 (video upload), D21, D28 | present |
| Take-home and review | 6 (take-home in 5; a merge request review in GitLab) | product teams: D7, D20, D21, D26, D27 (optional); living-room teams: 26 web solutions (G) | present, the strongest Disney theme |
| Code reading or review of given code | 2 (GitLab merge request review, xAI code-reading final) | DC-1 (scope questions and a mock PR review), DC-8 (reviewing a junior's frontend code), DC-16 (a simple React app: find the problems, give feedback; 2025) | present: three loops, 2022 to 2025 |
| Debugging round | 1 (Stripe) | D30 ("Diagnosing a production problem", 2019); DP-5 says "implement and debug in an unfamiliar codebase" without saying it is an interview | thin |
| Behavioral or values | 18 | official STAR guidance (DO-1, DO-4, DO-5, DO-6); D20, D21, D26 | present, official |
| PM or product round | 1 (ElevenLabs product or design round) | D20 (PM behavioral), D27 (Product Manager), D28 (director and PM lunch), DC-8 (Senior TPM) | present; rare elsewhere |
| Director or leadership conversation | 2 (GitLab director, JPMorgan hiring manager and leadership) | D7, D8 | present |
| Living-room or TV constraint | 0 | the take-home's remote-style navigation and old-browser target (G); DP-7 | Disney only |
| Team match | 8 | none | missing |
| Decision or result | 8 | D8 (within two weeks), D26 (encouraged to reapply), D25 (position cancelled) | present |

### Facts the other pages show

| Fact | On other pages | Disney | Status |
|---|---|---|---|
| Total duration | 8 of 29 tables | D8 "I got the news within 2 weeks."; D25 "Two weeks later, I heard that the position had been cancelled."; D33 waited three months after the take-home | thin |
| Round durations | 83 of 238 rows | D1 one hour; D22 "45mins."; D23 "Lasted about 45 minutes"; D28 a 45-minute screen and four one-hour blocks; D32 "about 90 minutes"; DC-8 "a half-hour chat with a Senior TPM,"; D33 "~4 hours" and D34 "less than 10 hours" for take-homes | available |
| Number of rounds | many tables | D30 "an onsite interview with 5 rounds"; D26 "three separate interviews, each with two interviewers"; DC-8 "The second round had four parts total."; D20 six steps | available |
| Official process page | 28 of 30 pages have official guide rows | DO-2, DO-4 and DO-5 (F); DO-6 and DO-7 (S) | available, generic |
| Interview AI rule | official on some pages (CrowdStrike, GitLab) | official (DO-7, read in full since 2026-11-11); D1 agrees | available |
| Reapply or cooling-off | official on Google, GitLab, Spotify, Capital One | an encouragement only (DO-2); D26 "encouraged to reapply" | partial |
| Levels | named on some tables | SE II, Associate, Senior, Lead, Principal (see Loop) | available |
| NDA | rare | D14 (2016) | old |
| Work model | some pages | postings (DP-1, DP-2, DP-8); DC-4 (2022), DC-8 (2025) | available |

### Question families

| Family | Typical on other pages | Disney | Status |
|---|---|---|---|
| React or UI build tasks | most pages | D1 scoreboard, D21 React app changes, D26 streaming app, D28 shown UI, DC-15 movie list with sort and search; the living-room home page (G) | present |
| JavaScript utilities and promises | many pages | D23 (complete code to a result); D35 (a hand-written Promise, Beijing, 2025) | thin |
| DOM and vanilla widgets | some | the framework-free take-home (G); D28 event listeners; D16 (2015) | present |
| CSS and layout | some | tile focus scaling and grids (G); D14 (2016) | thin |
| Accessibility | some (CrowdStrike) | a focus trap in the take-home's popup (G); DP-29 asks for WCAG | thin |
| Web security | CrowdStrike, JPMorgan and others | none | missing |
| Performance | some | DC-12 (T, rendering performance); lazy rows and an old browser (G) | thin |
| Frontend system design prompt | many | shopping cart, feature flags, video upload, an API for a front end, UI components and their API, fast pass, a pet adoption app (D29) | present |
| Debugging | Stripe, ElevenLabs, Walmart | D30 (2019) | thin |
| Code review | GitLab | DC-1, DC-8, DC-16; take-home reviews | present |
| React state and internals | many | D13, D22, D7; DC-12 (T); DC-5 (backend loop) | present |
| TypeScript typing | Agoda, xAI, Cloudflare | postings only (DP-1, DP-26) | missing in reports |
| Company and product knowledge | rare | D11, D8; "Disney-themed" behavioral questions (DC-Cc1) | present |
| Behavioral and values | most pages | official STAR guidance; stakeholder management and mentoring (DC-8) | present |

### Page sections and plan data the other pages have

| Item | Other pages | What the Disney evidence supports |
|---|---|---|
| Hero caveat | every authored guide | the process differs by team (DC-Cx1, DO-16); the living-room take-home rests on public solutions and one Taro account; Hotstar is excluded; Disney Streaming is now part of a wider technology organisation (DC-3) |
| Round spotlight | 9 pages | the living-room take-home: a recurring brief with 43 public solutions over five years, linked to the Living Room Devices teams that are hiring today (DP-7, DP-8). Second choice: the code review (DC-1, DC-8, DC-16) |
| Practice prompts | 4 to 7 per authored guide | five proposed below |
| Official guides table | 28 of 30 pages | rows for the recruiter podcast page (DO-2), the interview checklist (DO-4), the prep guide (DO-5), Candidate Resources (DO-6) and the AI guidelines (DO-7) |
| Process table | 30 of 30 pages | three variants proposed below |
| Signature round (directory) | 30 of 30 (`company-signatures.ts`) | proposed below |
| Plan entry and profile | 30 of 30 (`company-plan-rounds.ts`, `company-plan-profiles.ts`) | inputs below |
| 7-day plan and FAQ | every authored guide | can be written from this record |

## Proposed interview process tables

The registry rule holds: a stage cites only sources read in full. G repositories, T pages, U pointers and S official pages are not cited in the tables; the page copy can describe them. The 1point3acres threads (DC-14 to DC-16) are not cited either, because `company-interview-processes.spec.ts` and the SSR test ban the host in process tables; DC-16's code review is left to page copy, and the Code review row below stands on its other sources.

**Variant 1: frontend engineers on product teams, United States, 2020 to 2025 (D1, D7, D20 to D23, D26 to D28; DC-1, DC-Cc2, DC-Cc3)**

| Stage | What happens | Who | Sources |
|---|---|---|---|
| Recruiter screen | Officially a recruiter screen, usually a virtual conversation about your background, interests and experience; reports open with a recruiter call | All | official DO-2; D20, D26, D27, D28 |
| Hiring manager or tech lead | A conversation about the role with the hiring manager, a tech lead or a director; one 45-minute hiring manager round asked how to manage React component state | Most candidates | D7, D20, D22, D27 |
| Coding: live task or take-home | Teams choose. Live: a one-hour React task that builds a scoreboard banner from an API in steps, with search allowed and AI not; an on-screen JavaScript test; easy coding questions. Take-home: changes to a React app, a streaming app from a visual mockup, or a project with tests for every level | All | D1, D7, D20, D21, D23, D26; DC-Cc2 |
| Code review | The take-home is reviewed with engineers, sometimes with one more change made on the call, and you explain your choices. One 2022 first round had no coding: reading code, scope questions and a mock pull request review | Candidates who pass the coding stage | D7, D20, D21, D26; DC-1 |
| Frontend system design | A whiteboard design: the UI components and the API they need, a video upload feature, an API service for a front end | Most candidates | D20, D21, D28; DC-Cc3 |
| PM, director and behavioral | A PM-led behavioral round, a long day with a product manager, senior engineers and the hiring manager, or a final talk with the director; Disney's guides prepare candidates for behavioral questions in the STAR format | Candidates who reach the end | official DO-4, DO-5; D7, D8, D20, D27 |
| Result | One accepted candidate heard within two weeks; a rejected associate was encouraged to reapply; Disney's recruiters call a no a "not yet" | All | official DO-2; D8, D26 |

Proposed evidence labels (at most 28 characters; the component computes its own from the cited sources):

| Stage | Label |
|---|---|
| Recruiter screen | Official page and 4 reports |
| Hiring manager or tech lead | 4 public reports, 2021–24 |
| Coding: live task or take-home | 7 public reports, 2021–25 |
| Code review | 5 public reports, 2021–24 |
| Frontend system design | 4 public reports, 2020–25 |
| PM, director and behavioral | Official guides, 4 reports |
| Result | Official page and 2 reports |

**Variant 2: lead frontend, Seattle, 2025 (DC-8)**

| Stage | What happens | Who | Sources |
|---|---|---|---|
| Senior TPM conversation | A half-hour conversation about your working style and how you collaborate | Lead candidates | DC-8 |
| Code review | A Principal Engineer shows badly written frontend code; you suggest changes, say how you would help the junior who wrote it, then answer mentoring questions | Lead candidates | DC-8 |
| Frontend system design | Two whiteboard rounds, in person: a shopping cart and a feature flag system | Lead candidates | DC-8 |
| Hiring manager follow-up | A further conversation about stakeholder management | Lead candidates | DC-8 |

All four labels: `One public report, 2025`. The first round of this loop is not described.

**Variant 3: interns and students (D9, D31, D34; DC-Cc4)**

| Stage | What happens | Who | Sources |
|---|---|---|---|
| Recruiter and technical interviews | A 30-minute recruiter call on behavior and the résumé, then a developer's technical questions; another intern was asked about web protocols and React, without coding; a 2022 streaming intern had hashmap and tech-stack questions and many culture-fit questions | Interns | D9, D31; DC-Cc4 |
| Take-home | A coding challenge sent home after two video calls, under ten hours | Some interns | D34 |

Labels: `3 public reports, 2019–22` and `One public report, 2020`. The official internship timing (DO-11, S) belongs in the page copy, not the table.

## Plan, signature and profile inputs (for the build step)

Proposals for `company-plan-rounds.ts`, `company-signatures.ts` and `company-plan-profiles.ts`; nothing is applied.

- **Plan lists.**
  - Variant 1: id `frontend`, `default: true`; reported levels mid and senior (SE II, Associate, Senior).
  - Variant 2: id `lead`, with an `ask` such as `Interviewing for a lead frontend role?`; `reported` lead.
  - Variant 3: id `early-career`, with an `ask` such as `Applying for an internship?`; `reported` junior.
- **Round kinds:**
  - Variant 1:
    - Recruiter screen: `recruiter`.
    - Hiring manager or tech lead: `people`.
    - Coding: `coding`.
    - Code review: `coding`.
    - Frontend system design: `design`.
    - PM, director and behavioral: `people`.
    - Result: `outcome`.
  - Variant 2: Senior TPM conversation (`people`), Code review (`coding`), Frontend system design (`design`), Hiring manager follow-up (`people`).
  - Variant 3: Recruiter and technical interviews (`recruiter`, `coding`), Take-home (`coding`).
- **Signature round (directory).** Changed on 2026-11-11 to `Code review`. Three loops from 2022 to 2025 name it for frontend candidates (DC-1; DC-8 with its original DC-14; DC-16), two of them from 2025, and the take-home reviews add to it (D7, D20, D21). CrowdStrike and Zalando already use `Take-home review` and GitLab uses `Merge request review`, so `Code review` stays distinct. The living-room take-home stays the round spotlight. Fallback: the earlier proposal, `Take-home and review`.
- **Profile.** `framework: 'react'`, `mixed: true`.
  - Evidence: the frontend reports and today's frontend postings name React. The living-room take-home is often written without a framework. Some teams use Angular or Vue (DP-11, DP-12, DP-30).
  - Aliases: `Walt Disney`, `Disney Streaming`, `Disney+`, `Hulu`, `ESPN`. Hulu and ESPN are Disney units whose engineering sits in the same technology organisation, per the postings and DC-3. Whether the plan should match them is a product decision.

## Catalog mapping proposal (not applied)

Counts were read from `cdn/questions` on 2026-11-03.

- Sources are capped at 6 (`MAX_QUESTION_SOURCES`); trivia cannot carry sources.
- The pins are the 68 ids found in the backend authoring registries.
- No catalog item mentions Disney yet.

The rules are the CrowdStrike record's:
- **Tag with a source:** an unpinned coding, debug or system-design item matching a task from a frontend-focused F report, with room under the cap.
- **Tag only:** a trivia item whose question is the reported question.
- **Link only:** everything else that helps.

### Tag with a source

| # | id | file | access | why it matches | source | sources now | pin |
|---|---|---|---|---|---|---|---|
| 1 | `ui-component-state-from-mock` | cdn/questions/system-design/index.json | premium | Designing components and state from a mock. D26 built "a streaming app based on a provided visual mockup"; D28 had to "Identify UI components" and "Build the UI shown to you". The note must say it practises the design step, not the reported app | D26 | 0 (content tags intuit, capital-one, crowdstrike) | unpinned |
| 2 | `react-debug-api-misuse` | cdn/questions/react/coding.json | premium | Reading broken React code and explaining the fix. DC-1 read code for scope bugs and did a mock pull request review; DC-8 reviewed badly written frontend code; DC-16 found the problems in a simple React app (2025). The note must say it practises reading broken code, not the reviewed code | DC-1 (DC-16 corroborates) | 2 (walmart); the Cloudflare record also proposes CF1 | unpinned |

Draft source entries (label 8 to 120 characters, note at most 280; `disney` goes into `companies`):

```json
{
  "label": "Taro: Disney associate software engineer interview, United States, 2021",
  "url": "https://www.jointaro.com/interviews/companies/disney/experiences/associate-software-engineer-united-states-may-1-2021-no-offer-positive-9249e5cd/",
  "company": "disney",
  "publisher": "Taro",
  "date": "2021-05",
  "note": "A front-end role whose coding challenge was a streaming app built from a provided visual mockup, then interviews on technical choices and state management. This design exercise practises the component and state step, not the app."
}
```

```json
{
  "label": "Blind: Disney Streaming front end interview, 2022",
  "url": "https://www.teamblind.com/post/disney-front-end-interview-xps3iweg",
  "company": "disney",
  "publisher": "Blind",
  "date": "2022-02",
  "note": "The first round of a Disney Streaming front end loop had no coding: the candidate read code, answered scope questions and did a mock pull request review. This exercise practises reading broken React code; it is not the reviewed code."
}
```

### Tag only (trivia)

These come from loops with generic or full-stack titles. Since 2026-11-12 a question counts by its content, not by who was asked (the user's rule), so all three qualify.

| # | id | file | supporting account | reported question |
|---|---|---|---|---|
| 1 | `react-state-management-redux` | react/trivia.json | D22 (2024) | "How to manage React component state." |
| 2 | `react-useeffect-purpose` | react/trivia.json | D7 (2021) | "Which React hooks handle which React lifecycle events?" |
| 3 | `js-closures` | javascript/trivia.json | D29 (2019, full-stack) | "The only Javascript question was about closures." |

### Link only

- **The living-room take-home:**
  - `react-file-explorer` (premium): keyboard navigation of a tree.
  - `css-grid-card-gallery` (free): a tile grid.
  - `react-vanilla-dropdown-port` (free): a widget built in plain JavaScript first, then ported to React.
  - `html-dialog-confirm-a11y` (premium): a dialog's naming and focus.
  - `infinite-scroll-list` (free system design): loading content as it scrolls into view.
  - `netflix-scale-expansion` (premium system design): a streaming row.
- **Live React with an API:**
  - `react-fetch-list-states` (free, at the 6-source cap).
  - `react-autocomplete-search-starter` (free, at the cap).
  - `react-filterable-user-list` (premium, pinned): for the movie list with sort and search in DC-15 (2025) and DC-9 (P). Pinned, so a link, not a tag.
- **System design:** `image-upload-preview` (pinned; images, not video), `resilient-checkout-payment-flow` (pinned; checkout after a cart), `react-shopping-cart` (pinned).
- **Algorithms (added 2026-11-12):** `js-create-lru-cache` (free, pinned) for the LRU question in DC-15 (2025).
- **Promises (added 2026-11-12):** `js-create-deferred-promise` (free) and `js-promise-all` (premium) for the hand-written Promise in D35 (2025).
- **Behavioral:** the behavioral guide, for STAR answers, Disney-themed questions, stakeholder management and mentoring.

### Skipped

- "Reverse words in a sentence." (D29): no matching item (`js-reverse-string`, premium, reverses characters, not words). The LeetCode medium (D20) is not shared.
- "Design the fast pass system for their parks." (D7): an OOP design with no frontend item.
- The roller-coaster puzzle (D12, 2017).

### Gaps (missing questions: reported, with no matching item)

1. **Remote-control navigation over rows of tiles.**
   - Move focus with the arrow keys across rows of different lengths, keeping the visible column, and scale the focused tile.
   - Open details on Enter and close them with Back.
   - This is the signature Disney take-home (G, D26); no item practises spatial focus.
2. **A home screen built from a home document plus sets fetched by id.** Rows load as they come into view, images fall back when missing, and the browser has no Intersection Observer (G).
3. **A framework-free app:** components, state and events without a library, under a rule against third-party libraries (G). `react-vanilla-dropdown-port` covers one widget.
4. **Changing an existing React app, then defending the change in review** (D21, D20, D7). The Cloudflare record lists the same gap.
5. **Reviewing a junior engineer's frontend pull request as a mentor** (DC-8, DC-1), or finding the problems in a simple React app (DC-16).
6. **Frontend feature flag or remote-config design** (DC-8).
7. **The browser History API** (D7).
8. **A video upload feature** (D20). `image-upload-preview` covers images only.

## Practice prompts for the page (proposal)

Our own practice versions; none copies a reported task or the take-home brief.

| # | title | statement | modelled on | links to |
|---|---|---|---|---|
| 1 | Build a streaming home page you can drive with a TV remote | Load a home document and render its rows of tiles. Move focus with the arrow keys only; scale the focused tile, open details on Enter and close them on Back. Load the remaining rows as they come into view, show a fallback when an image fails, and build it first without a framework. | D26 (2021-05*); the candidates' public solutions (G, 2020-12 to 2025-07); stack context DO-13 | `react-file-explorer`, `css-grid-card-gallery`, `react-vanilla-dropdown-port`, `infinite-scroll-list` |
| 2 | Change a React app, then defend the change in review | Take a small React app and implement a requested change. Walk a reviewer through what you changed and why, then make one more change live when asked. | D21 (2023-08-18), D20 (2024-09-27), D7 (2021-06-16) | `react-fetch-list-states`, `react-debug-api-misuse` |
| 3 | Review a junior engineer's frontend pull request | Read a component with bugs and unclear variable scope. List what you would change and why, then say how you would help the junior who wrote it improve. | DC-8 (2025-11), DC-16 (2025 Q3), DC-1 (2022-02) | `react-debug-api-misuse`, `react-debug-double-render`, `js-debug-stale-closure-autosave` |
| 4 | Design a frontend feature from the screen to the API | Pick a feature (a shopping cart, a feature flag service for the UI, a video upload). Name the components and their state, design the API calls they need, and explain how they fit together. | DC-8 (2025-11), D20 (2024-09-27), D21 (2023-08-18), D28 (2020-01*) | `ui-component-state-from-mock`, `image-upload-preview`, `resilient-checkout-payment-flow` |
| 5 | One hour, one React screen, no AI | In one hour, build a small React screen from an API in steps (a scoreboard banner, then extra features). Search is allowed, AI is not, as Disney's guidelines say for coding exercises unless told otherwise. | D1 (2025-05*), D23 (2024-07-04); official DO-7 | `react-fetch-list-states`, `react-autocomplete-search-starter` |
| 6 | Build a movie list you can sort and search | Render films with their titles and years from an API, add sorting and a search box, and keep the list usable from the keyboard as it grows. | DC-15 (2025 Q4); DC-9 (P) as context | `react-filterable-user-list`, `react-fetch-list-states` |

## Open items

- **Read on 2026-11-11, partly.** DC-14 to DC-16 were read through Claude in Chrome, visible text only. Their hidden parts (130 to 200 forum points) hold DC-15's phone screen question, the details of its system design and frontend coding rounds, and the middle of DC-14 and DC-16. They were not unlocked. DC-20 and DC-21 were read in full.
- **Still unreadable (U).** DC-17 to DC-19 (1point3acres: a 2018 frontend interview, a 2024 ads-platform full-stack phone screen, a 2015 Hulu loop), not attempted on 2026-11-11.
- **Found on 2026-11-11, not read.** Newer threads under the forum's Disney tag: 1189371 (a 2026 Q3 streaming phone screen for a general role, through a headhunter), 1187471 (a 2026 Q3 lead software engineer loop, Southern California) and 1158546 (a December 2025 streaming post).
- **The living-room take-home.**
  - The newest solution is from 2025-07. Whether the brief is still sent in 2026 is NOT FOUND, though the Living Room Devices team is hiring (DP-7, DP-8).
  - Which roles receive it is known only from READMEs: Living Room Devices, ESPN and Hulu.
  - Whether frameworks are allowed is unclear: some READMEs say no, while others used React.
  - No first-person loop narrative around it exists outside D26.
- **Official text.** DO-1, DO-2, DO-4, DO-5, DO-9, DO-18 and DO-21 were read in full on 2026-11-03, and DO-6 and DO-7 through Claude in Chrome on 2026-11-11. The scam notice (DO-3) is still a sentence-level read, because curl fails on Disney Careers hosts with a certificate error on this machine.
- **Paraphrase only.** Three sentences came back as paraphrase and are not quoted: DC-Cc3's take-home sentence, the second half of DC-3's insider reply, and DC-12's second and third rounds.
- **Units.** Disney Streaming no longer exists as a unit (DC-3). Accounts keep the unit they name, and the page should say `teams that build Disney+, Hulu and ESPN apps` rather than a unit name.
- **Thin areas.**
  - No ESPN, ABC News or parks web loop after 2023 except D2 (2024, no coding) and D4 (2023).
  - No India or Europe frontend loop worth a variant.
  - No TypeScript question in any report.
- **Taro.** 222 of 366 dates are placeholders. D1's city is probably wrong. The 32 cited accounts were re-read on 2026-11-12 (see Verification).
- **Postings.** Disney lists jobs on two sites; 21 relevant postings exist only on `www.disneycareers.com`, read as S. On 2026-11-11 DP-1 and DP-2 were gone from the Workday board, and the Roku postings DP-7 and DP-8 were still listed.
- **Not found:**
  - a Disney frontend interview post on Medium, dev.to, Hashnode, Substack, GeeksforGeeks or LinkedIn (only Hotstar);
  - a readable US Disney frontend post on LeetCode;
  - a Hacker News account beyond one 2022 anecdote.
  - X and YouTube were not searched.

## Verification

- **Method.** Two scripts, both kept in the session scratchpad (git-excluded):
  - `check_quotes.py` (the Cloudflare record's script) extracts every phrase in straight double quotes from this file, after removing code spans and fenced blocks. It searches for each phrase in all saved pages: Taro `.txt`, WebFetch returns, README files, posting text and official-page saves. Whitespace, curly quotes, dashes and HTML entities are normalised; wording, case and punctuation are not. A quote cut with an ellipsis must have each part in the same file.
  - `check_attribution.py` checks the source tables more strictly: each quote in a row must appear in the file of the source that row names (the Taro slug, the DC, DO or DP file).
- **Result.** Last run on 2026-11-03, after the final edits:
  - `check_quotes.py`: 342 of 342 distinct quoted phrases (425 occurrences) found verbatim in the saved pages.
  - `check_attribution.py`: 252 quotes in source-table rows, every one found in the named source's own file.
  - Proposed stage names, search terms and plan strings are in backticks, so the scripts count only source quotes.
- **Coverage of the check.**
  - Taro quotes were matched against the page data saved by curl.
  - Blind, PracHub, TechPrep and Hacker News quotes were matched against the WebFetch returns, which are sentence-level quotations, not raw HTML.
  - GitHub quotes were matched against the README files saved through the GitHub API.
  - Official quotes were matched against the reader's saves (curl text for sites.disney.com, thewaltdisneycompany.com and the PDFs; WebFetch returns for Disney Careers pages). Workday posting quotes were matched against text extracted from the API's JSON.
- **Follow-up, 2026-11-11.**
  - The saved pages and the two scripts of 2026-11-03 lived in a session scratchpad under `/private/tmp`. macOS's temporary-file cleanup deleted the files on 2026-11-08; the folders remain, empty. The 2026-11-03 results above stand as recorded but cannot be re-run. The candidates' repository URLs, which lived only there, are gone too; a GitHub code search for the take-home's endpoint host finds them again. Every source cited on a page must be re-read at build time anyway.
  - The pages read on 2026-11-11 are saved under `research_notes/disney-2026-11/raw/` (git-excluded). `research_notes/check_new_quotes_2026-11-11.mjs` takes every quoted phrase on a line that names DC-14, DC-15, DC-16, DC-20, DC-21, DO-6, DO-7 or posting 10160173 and searches the saves. It found 50 of 69. The 19 others are quotes from older sources on the same lines (DC-8, DC-9 and DO-2), verified on 2026-11-03. Every quote attributed to a source read on 2026-11-11 was found, including the DO-6 and DO-7 quotes that were sentence-level reads on 2026-11-03.
  - The phrases were then searched on the live pages in Chrome: DC-14 8 of 8, DC-15 7 of 7, DC-16 9 of 9, and DC-20 and DC-21 all found. The live re-check of DO-6 and DO-7 did not run, because the Chrome extension refused a second navigation to join.disneycareers.com; their quotes match the page text saved on the first visit the same day.
- **Follow-up, 2026-11-12.**
  - The 32 cited Taro accounts were re-read and saved (Method 9). `research_notes/check_disney_quotes_2026-11-12.mjs` searches every quoted phrase in this file, outside code spans and fenced blocks, in the 2026-11-11 and 2026-11-12 saves.
  - Result after the edits: 218 of 405 distinct phrases found, 162 of them in the re-read Taro pages. Every quote from a Taro account was found, including the 33 added to the Sources tables that day.
  - The 187 phrases not found all come from sources whose 2026-11-03 saves are lost: Blind, PracHub, TechPrep, Hacker News, the GitHub READMEs, the official pages and the postings. Seven of them share a line with a Taro account (quotes from DC-3, DC-8, DC-Cc1, DO-2 and DP-5).
  - The question list quotes nothing; its rows paraphrase the quoted sources. `check_new_quotes_2026-11-11.mjs` still finds 50 of 69, as before.

## Status

| Step | State | Date |
|---|---|---|
| Research record | written: Taro sweep, community, GitHub and official passes, comparison and catalog proposal | 2026-11-03 |
| U sources (1point3acres, LeetCode) and DO-6, DO-7 | DC-14 to DC-16 (visible text), DC-20, DC-21, DO-6 and DO-7 read through Claude in Chrome and added; the hidden forum parts and DC-17 to DC-19 not read | 2026-11-11 |
| Question list | Q1 to Q61 in eight groups; the 32 cited Taro accounts re-read and saved, and their question fields added to the Sources tables | 2026-11-12 |
| Frontend-only rule | three backend rows removed (Q24, Q34, Q58) and two trimmed (Q50, Q61); 58 rows remain; the process tables and the catalog proposal follow the rule | 2026-11-12 |
| Catalog tags, guide, process table, plan entry | not started (the user asked for this record only) | |

## Guide build notes (2026-11-14)

Written while the guide's process entry and question list were built (plan: `reports/disney-cloudflare-sayfa-plani-2026-11-14.md`, step 2).

- **DC-1** was re-read. The post: "I Have the first round of a front end loop with Disney Streaming Services coming up." The poster's reply of 2022-02-12: "Definitely - I didn’t have to code at all. Just had to go over code (basically trick questions about scope) and tell what was going on and do a mock pr review". The Disney Streaming Services-badged comment: "there is zero standardized interview process at Disney. It's entirely up to the team to decide how they interview."
- **DC-5's URL**, missing above, is https://www.teamblind.com/post/disney-streaming-interview-rant-3f6kmz3l (re-read 2026-11-14).
- **DC-Cc3's take-home sentence** is verbatim now: "Passed that and proceeded to get a take home challenge to build a UI and then got rejected."
- **DC-Cc1's "Disney-themed"** refers to behavioral questions, as Q36 has it.
- **Re-read on 2026-11-14 and saved** under `research_notes/disney-2026-11/raw/community/`: DC-4 (with DC-Cc2 and DC-Cc4), DC-5, DC-6 (with DC-Cc3) and DC-8. DO-1 and DO-2 were re-read the same day (`research_notes/official-2026-11-14/raw/`).
- **D1:** Taro's city for D1 is wrong, so the guide gives D1 an explicit role and no country.
- **The guide's counts:** 37 locked rows and 14 behavioural rows. Q5, Q7, Q12, Q15, Q22, Q49 and Q54 are left out for their sources.
- **Format-only rows left the list (2026-11-15).** Four context-free readers of the built page objected to locked rows that hold no question, only the shape of a round. The user agreed to keep in the list only rows that give a question or a topic a candidate can prepare for; rows that describe a round's format alone moved into the stage table's own text. Removed from the list, kept in the table: the on-screen JavaScript test (D23), the plugin test on a shared screen (D4), the 30 minutes of OOP questions (D28), the algorithm questions after the code review (D32), the technologies-for-the-role call (D2) and the production-problem diagnosis in each onsite round (D30). The guide lists 30 questions and 14 behavioural rows. The same rule will be applied to the other 30 guides in a later pass.
