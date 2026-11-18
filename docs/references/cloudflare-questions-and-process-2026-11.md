# Cloudflare: reported frontend interview questions and interview process

> Working record started on 2026-11-03. It lists the frontend interview questions and tasks that public interview reports attribute to Cloudflare, with a source and access status for every item. It also lists the interview stages that those reports and Cloudflare's own pages describe, and what this evidence lacks compared with the other 30 company pages.
>
> Companion documents:
> - `docs/references/crowdstrike-questions-and-process-2026-10.md` uses the same format.
> - `docs/references/company-pages-plan-2026-10.md` describes how a company page is built.
> - `reports/company-candidates-research-2026-11-03.md` is the candidate round (git-excluded).
>
> The user chose Cloudflare on 2026-11-03 and asked for this record only. No page, catalog tag, router entry or plan entry has been made.
>
> **Update 2026-11-11.** Two LeetCode accounts that were unreadable on 2026-11-03 were read in full through Claude in Chrome: CF-C1, the frontend-heavy Bengaluru loop, and CF-C11, a 2025 software-engineer onsite. They give the first fully read description of the React and TypeScript app round, the length and three question types of the Orange Cloud round, and round lengths for a frontend loop. Changed sections: Why Cloudflare, Research rules, Method, Verdict, Sources, Loop, Reported questions, Comparison, the process tables, plan inputs, catalog mapping, practice prompts, Open items, Verification and Status. The raw saves of 2026-11-03 are lost (see Verification).
>
> **Second question round, 2026-11-11.** At the user's request, a wider sweep for reported questions:
> - the whole Taro set again (195 pages, no new page, no frontend content outside CF1 to CF33);
> - LeetCode's Cloudflare topic and search (CF-C12 to CF-C14, CF-C49);
> - the 1point3acres Cloudflare tag (39 threads since 2023, visible text);
> - Blind, PracHub, TechPrep, Hacker News, Naukri Code360, EngineBogie, blogs and Cloudflare TV (CF-C32 to CF-C48, CF-O12 to CF-O16).
>
> No new frontend account exists in any of them. The round adds the shared rounds' content: the Orange Cloud round's scenario questions, product and leadership rounds, a 2026 round on how candidates use AI coding tools, and the company-wide coding tasks. A rate limiter is the most repeated of those tasks. Every reported question is now collected in "The question list".
>
> **Frontend-only rule, 2026-11-12.** At the user's request, the question list keeps only frontend questions and general ones (behavioral questions, algorithms, debugging method), whoever was asked. Backend, network, infrastructure and security questions are left out: fifteen rows were removed and two trimmed, and the other rows keep their numbers. The rate limiter is one of the removed rows. The process tables, the catalog proposal and the practice prompts follow the same rule.

## Why Cloudflare (2026-11-03)

- **Not covered.** The frontend prep sites below have no company page for Cloudflare. All lists were read on 2026-11-03.
  - GreatFrontEnd: no company guide (37 companies). Its sitemap was read through Chrome because curl and WebFetch received HTTP 429.
  - Front End Interview Handbook: no company page (36).
  - FrontendLead: no company guide (252).
  - devtools.tech: no company list (38).
  - frontendgeek: no experience page (27).
  - LearnersBucket: no experience post.
- **Demand.** Seven distinct Google autocomplete suggestions name Cloudflare with a frontend term across the four 2026-10-26 templates:
  - `cloudflare frontend developer`, `cloudflare frontend engineer`, `cloudflare frontend engineer interview`, `cloudflare frontend engineer salary`, `cloudflare frontend engineer ui platform`, `cloudflare frontend interview` and `cloudflare frontend interview questions`.
  - Bing gives none.
  - Same-day calibration: ElevenLabs 2, Shopee 7, xAI 7, Agoda 19.
  - **A named round with its own demand.** Google suggests `cloudflare orange cloud interview` and `cloudflare orange cloud interview questions`, and completes `orange cloud interview` to `orange cloud interview cloudflare`, `orange cloud interview questions` and `orange cloud interview reddit`. Bing completes `orange cloud interview` to `cloudflare orange cloud interview` (2026-11-03). The Orange Cloud Interview is named on Cloudflare's careers page (CF-O1).
- **Hiring on the day.** The Greenhouse board lists 469 open postings. One is frontend-titled: "Senior Design Engineer" (CF-P1), Hybrid, offices in Austin, New York and San Francisco. It was first published on 2025-06-20 and updated on 2026-10-30. It was still listed on 2026-11-11 (473 postings; updated on 2026-11-09).
- **Readable sources.**
  - Taro: 11 frontend-titled pages (2016 to 2025).
  - PracHub: one frontend-titled account, reported February 2026.
  - Outside Taro: four 2024 to 2026 software-engineer accounts and one prep-site page that describe the company loop (hiring manager first, debugging, system design, values, PM and executive rounds).
  - Taro: 16 generic accounts since 2022 that name web and network fundamentals.
  - The richest frontend-heavy account (LeetCode, Bengaluru, CF-C1) could not be read on 2026-11-03. It was read in full on 2026-11-11, together with a 2025 software-engineer onsite (CF-C11).
  - Official: the careers page lists the hiring process (CF-O1). Blog posts from 2019 to 2026, the candidate privacy notice and the 2020 internship briefs add detail (CF-O2 to CF-O11, CF-OG1, CF-OG2).
- **Buyers.** Accounts from the United States, the United Kingdom, Portugal, Germany, Serbia and India.

## Research rules

- **Access codes.**
  - F: read in full.
  - S: verbatim in a search snippet.
  - U: unreadable.
  - P: seen in search results only.
  - T: read in full, but on a prep site's own page. Used as corroboration only, never counted as a report.
  - W: read in full from an Internet Archive capture. blog.cloudflare.com answered HTTP 429 with a challenge page after about 20 requests, so blog posts were read from archived copies; each raw file records the capture time and the post's published and modified dates.
  - (c): a commenter's own account.
  - (p): a plan written before the interview.
- **Quotes.**
  - Every quote comes from a saved page.
  - Taro pages were read from their public URLs with curl. No Taro API was called.
  - Blind, PracHub and TechPrep pages were read through WebFetch, whose verbatim returns were saved per source. For some pages WebFetch returned sentence-level quotations instead of the whole text; those sources are F only for the sentences it returned.
  - Search summaries were used only to find pages.
- **Not cited.** Glassdoor, 1point3acres, Prepfully, Dataford, PracHub question lists, interviewquery, techprep.app blog pages, AlgoCademy, scoutify and other templated pages. Reddit was not attempted (our tools refuse it).
- **Taro.**
  - Taro interview pages are Glassdoor reviews re-hosted with rewritten text; each report is counted once.
  - A Taro timestamp on the 1st of a month at 00:00, 07:00 or 08:00 UTC is a placeholder. It is marked `*`, and only the month is given.
  - Taro may change the city.
  - When Taro's outcome label contradicts the text, the text wins.
- **LeetCode.**
  - On 2026-11-03 WebFetch received HTTP 403 for the one Cloudflare frontend account (CF-C1). The session's permission classifier refused a read through LeetCode's GraphQL endpoint (`Website Access Circumvention`) and a republished copy on interviewexperiences.in (`Walled Content from a Copy`). CF-C1 was therefore U.
  - On 2026-11-11 CF-C1 and a second post (CF-C11) were opened as ordinary pages in Claude in Chrome, logged out, and read in full with its page-text tool. No API was called. The text is saved under `research_notes/cloudflare-2026-11/raw/community/` (git-excluded).
  - In the second question round the same day, LeetCode's Cloudflare topic page (`/discuss/topic/cloudflare/`, Interview tab) listed seven interview posts, and a search added two untagged ones. All were read the same way (CF-C12 to CF-C14, CF-Cc4, CF-Cc5, CF-Cp4 to CF-Cp6; saves under `raw/community/leetcode/`).
- **1point3acres (added 2026-11-11).** Read in Claude in Chrome, logged out: the visible text only, because each thread hides its middle part behind a forum points threshold that was not unlocked. Quotes are in the original Chinese; our translation follows outside quotation marks. The host cannot be cited in process tables (see the 1point3acres table under Sources).
- **Requests.** Requests carried a generic browser User-Agent and no personal data. Chrome was used for the GreatFrontEnd sitemap in the candidate round and, on 2026-11-11, for the two LeetCode posts.
- **Scope.**
  - Web frontend roles (frontend, front end, UI, web developer and design engineer titles), 2016 onward.
  - Generic software-engineer loops that include a React, JavaScript, browser, debugging or web and network fundamentals element.
  - Other generic loops are counted only as contrast.
  - Since 2026-11-12 the question list counts a question by its content, whoever was asked: a frontend or general question from a generic loop is listed, and a backend, network or infrastructure question is not listed from any loop.

## Method

1. **Taro, full sweep.** All 195 Cloudflare interview pages in Taro's public sitemap index (19 sub-sitemaps) were fetched once, one every one to two seconds, all HTTP 200. The account fields (title, location, timestamp, outcome, process, questions) were saved per page.
   - Classified by title and text: 11 frontend-titled (CF1 to CF11), 12 frontend-adjacent by text, 172 generic.
   - The 54 generic software-engineer loops from 2024 and 2025 were counted for contrast.
   - A second grep for DNS, HTTP, TCP, TLS, CDN, browser, "how the internet works" and the URL question found 16 accounts from 2022 on.
   - Accounts are CF1 to CF33 (frontend-titled, frontend-adjacent, early career, web and network fundamentals).
2. **Community sources.** A research reader used WebSearch (22 calls) and WebFetch.
   - PracHub: the Cloudflare list page (7 stories); 4 accounts opened.
   - Blind: about 20 threads opened. Eight are in the tables (CF-C6, CF-C8, CF-C10, CF-Cp1 to CF-Cp3 and their comments); the rest were backend or non-technical.
   - LeetCode: 2 Cloudflare posts, both HTTP 403.
   - TechPrep: 1 community page.
   - Hacker News: 18 Algolia queries.
   - GitHub: about 40 READMEs of assignment and take-home repositories.
   - Medium, dev.to, Hashnode, Substack, GeeksforGeeks and LinkedIn, plus a Chinese-language search: nothing on a Cloudflare frontend interview.
   - X and YouTube were not searched.
3. **Postings and official pages.** A second reader covered Cloudflare's own text.
   - **Greenhouse:** the documented public API returned all 469 postings with content. Every posting's text was grepped for interview, process and stack terms. The application forms of 8 jobs were read.
   - **cloudflare.com:** robots.txt and the sitemap (1,014 URLs). Careers, interview, hiring, candidate, recruit, intern, university, scam and fraud URLs were grepped. The careers, life-at-Cloudflare and early-talent pages and the candidate privacy notice were read. About 22 guessed careers paths answered 404.
   - **blog.cloudflare.com:** the sitemaps (8,086 post URLs) and tag pages were searched for hiring, intern and interview posts.
   - **GitHub:** about 20 repository searches found the 2020 to 2021 internship briefs on Cloudflare-run accounts.
   - 5 WebSearch calls.
4. **Catalog.** 475 items in `cdn/questions` were read, without edits. Pins were read from `backend/content/interview/authoring/*.json` (68 ids, of them 8 system design bundles).
5. **Comparison.**
   - The stage names of all 30 company process tables were loaded from `frontend/src/app/shared/company-previews/company-interview-processes.ts` with `frontend/scripts/load-ts-module.mjs`.
   - Page sections come from `authored-company-preview.model.ts`.
   - Plan inputs come from `company-plan-rounds.ts`, `company-plan-profiles.ts` and `company-signatures.ts`.
   - Facts per page come from `reports/sirket-sayfalari-envanteri-2026-11-02.md`.
6. **Verification.** Every quotation in this file was checked by script against the saved pages (see Verification).
7. **Follow-up (2026-11-11).** The two LeetCode posts were read through Claude in Chrome (see Research rules), and the Greenhouse board was checked again for CF-P1.
8. **Second question round (2026-11-11).**
   - **Taro:** all 195 pages were fetched again from the public sitemaps with `research_notes/cloudflare-2026-11/taro_sweep.py`, and every account was scanned for frontend, network, values, product, executive and rate-limit wording.
   - **LeetCode:** the Cloudflare topic page and two searches, read in Claude in Chrome.
   - **1point3acres:** the Cloudflare tag (64 threads), read in Claude in Chrome; visible text only.
   - **Community reader:** Blind, PracHub, TechPrep, Hacker News (Algolia API), Naukri Code360, EngineBogie (API), GeeksforGeeks, dev.to, Hashnode, Substack, Medium (RSS only) and Cloudflare TV, with WebFetch: 25 WebSearch and 54 WebFetch calls.
   - Glassdoor, Reddit, Prepfully and other templated pages were not opened.

## Verdict

- **Frontend evidence is thin and mostly recent.**
  - Eleven frontend-titled Taro rewrites, 2016 to 2025, are mostly about the process. Three describe the technical stages:
    - CF1, Lisbon, 2025-05*: a TypeScript task typing a JSON object, debugging a React app, and small problems.
    - CF2, United Kingdom, 2025-03-12: an at-home assessment and a pair programming exercise, in a loop of about seven stages.
    - CF3, United States, 2024-04-09: a hiring manager call, a technical interview, then a five-call onsite with two technical and three behavioral calls, under an NDA.
  - One 2026 frontend account outside Taro, CF-C3 (PracHub, reported 2026-02, United States), lists the stages:
    - the hiring manager and engineering manager;
    - several live coding and architecture or system design exercises;
    - an "orange cloud" behavioral interview, PM and cross collaboration rounds;
    - a final C-level conversation.
  - Since 2026-11-11 a second account outside Taro gives a whole frontend-heavy loop with round lengths: CF-C1 (LeetCode, posted 2025-12-07, Bengaluru, "Software Engineer (Fullstack, Frontend Heavy)", about eight years of experience):
    - "Hiring Manager Round (30 mins)";
    - "Technical Phone Screen – JavaScript (45 mins)": "A basic coding question that should be solved without using loops.";
    - "Orange Cloud Round (Behavioral) – 30 mins";
    - "System Design & Architecture (1 hour)" on projects from the candidate's résumé;
    - "App Coding Round – React + TypeScript (1 hour)", after which the candidate was rejected.
  - The second question round (2026-11-11) found no further frontend account in any of the places searched:
    - LeetCode's Cloudflare topic;
    - the 1point3acres tag (39 threads since 2023, all general software roles);
    - the whole Taro set;
    - Blind, PracHub, TechPrep, Hacker News, Code360, EngineBogie and blogs.
  - The only other frontend text is Cloudflare's own 2016 hiring post (CF-C43), which named React and Redux. Outside Glassdoor and Reddit, which were not opened, the public frontend evidence appears exhausted.
- **The 2024 to 2026 loop shape, across engineering roles.**
  1. A hiring manager conversation comes first in CF2, CF3, CF-C1, CF-C2, CF-C3, CF-C4, CF-C5 and CF-C7 (CF13: an engineering manager).
  2. A technical screen or live coding follows: CF3, CF-C3, a 45-minute JavaScript screen in CF-C1, a partitions problem in CF-C11, a Battleship-style game in CF-C4, a key-value store in CF-C5, and pair coding on debugging announced in CF-C2.
  3. A loop of four to six rounds follows. Its parts:
     - "orange cloud" behavioral or culture fit: CF-C3, CF-C4, CF-C1 and CF-C11 (both 30 minutes), CF-C7 (T);
     - a PM, product or cross collaboration round: CF-C3, CF-C4, CF-C16, CF-C18, CF-C7 (T); listed in the 2025 and 2026 plans CF-Cc6, CF-Cp8 and CF-Cp9, and in a 2020 loop (CF-Cc5);
     - debugging or code review: CF-C4, CF-C49 (a code snippet to review, 2026), CF-C7 (T), and CF1 for frontend;
     - system design: CF-C3, CF-C4, CF-C1 (on the candidate's own projects), CF-C11, CF-C7 (T);
     - in 2026, AI-assisted coding: CF-C4, CF-C7 (T); and a senior leadership round on how the candidate uses AI coding tools (CF-C49).
  4. A final call with an executive, cofounder or CXO: CF-C3, CF-C4, CF-C7 (T); also announced to the CF-C6 poster in 2024. Since 2026-11-11 more sources support it:
     - a C-suite round after a senior leadership round (CF-C49, 2026);
     - a pending C-suite round in India (CF-C35);
     - VP and CEO calls (CF36, 2022) and a CTO chat (CF37, 2024);
     - officially in 2025: "every single person that joins us has a C-level interview with one of them." (CF-O12). An office visit: CF-C4, CF-C7 (T). The posting CF-P1 says offer-stage candidates "may be asked to attend an in-person interview within one of the Cloudflare Offices or Cloudflare Hubs."
- **The React and TypeScript app round.**
  - CF-C1 (F, read 2026-11-11, posted 2025-12): "Given a React + TS app repo", "Mock UI + API already present" and "Asked to implement 4 frontend tasks", in one hour. Candidates were asked beforehand to "Install npm, nvm, React". Google, docs and StackOverflow were allowed; "AI tools" were not. The candidate finished two tasks, nearly finished the third and was rejected: "Completing just 2/4 tasks wasn’t enough."
  - CF-C7 (T, London, Senior Fullstack, 2026-08) describes the same round: "They gave me a React + TS app with a UI and API already built" and "asked me to build out 4 extra features." There AI was allowed.
  - Neither account names the four tasks, so the process tables describe the round's format, not its tasks.
- **Web and network fundamentals are the most recurring Cloudflare topic.** Sixteen Taro accounts since 2022 name them, often in the hiring manager or screening round:
  - "what happens when you enter a link in your browser and press enter" (CF13);
  - DNS resolution (CF26);
  - "Explain DNS.", HTTP versus HTTPS and TCP/IP (CF25);
  - "Describe how an internet request works (round trip)." (CF28);
  - TLS (CF29) and CDN (CF30, CF33).
  - None of them is frontend-titled, but the URL question is a standard frontend question.
- **AI.** A 2026 senior leadership round in Bangalore was entirely about the candidate's use of AI coding tools (CF-C49), and Cloudflare's recruiting leader said in 2025: "We will need to have hiring teams that know how to leverage AI." (CF-O12). CF-C1's app round (2025-12) did not allow "AI tools". The 2026 accounts describe AI-assisted coding: "an AI-assisted coding challenge" (CF-C4) and "I was allowed to use Google and AI for whatever I wanted." (CF-C7, T). In October 2025, CF-C5 used AI with the interviewer's OK. The posting asks for "AI-native curiosity". No official rule on candidates' own use of AI was found. The candidate privacy notice (CF-O3) covers AI that ranks candidates ("We utilize AI-powered tools, such as Eightfold, to help analyze and rank candidates based on their likelihood of success in a role."), not AI in the candidate's answers.
- **Official text.** The careers page (CF-O1) lists "Our Hiring Process":
  - initial conversations with a recruiter;
  - team panel interviews: "Meet with your prospective manager and peers. These conversations focus on how you think, your problem-solving approach, and the skills you bring to the table.";
  - executive calls: "A conversation with senior leadership to align on vision, values, and long-term goals. This includes our Orange Cloud Interview focused on the behaviors we value.";
  - an offer, then orientation.
  - The same page lists six "Cloudflare Capabilities", "The behaviors we value and reference when measuring success, giving feedback, and rewarding performance." That the Orange Cloud Interview tests these six is our reading of the shared wording, not a statement on the page.
  - Other official details:
    - the privacy notice names HackerRank "to administer coding tests to candidates" (CF-O3, updated 2026-09-24);
    - a 2019 post: "We put people through on average 8 interviews and a pair programming exercise." (CF-O7);
    - a 2023 post: "Before anyone gets an offer, every candidate in the final stage connects with one of our executive leaders including our co-founders." (CF-O8).
  - Frontend-specific official text: NOT FOUND.
- **What the Orange Cloud round asks (added 2026-11-11).**
  - Two 2025 accounts describe it as a 30-minute behavioral round among the panel or onsite rounds, not as a call with an executive.
  - CF-C1: "This round is based on Cloudflare’s values." Its examples: "Tell me about a mistake you made and what you learned", "Something you learned outside your work" and "Fun/challenging situations in your career"; "More about culture-fit and mindset than technical skills."
  - CF-C11: "Pretty standard, tell me about a situation questions. It's only 30 mins."
  - CF-C39 (Blind, 2024): "I got 3 scenario questions and the interviewer said I did a great job and I am certainly a cultural fit ☺️"; "However, I wouldn’t recommend anyone going with zero scenarios prepared." The questions were not shared.
  - CF35 (a SOC engineer, 2024): "with an Orange Cloud interview at the end. This involved many fake pleasantries and scripted behavioral questions and answers."
  - Cloudflare-badged commenters:
    - it is "similar to the behavioral interview round that many companies have now", answered with the STAR method and judged against the "Cloudflare capabilities" (CF-Cc16);
    - "a sanity check interview" (CF-Cc15);
    - "Orange cloud be sure to show your empathetic and chill" (CF-Cc10).
  - In 2025 and 2026 plans and comments it is one of the loop's rounds, next to coding, system design, a PM round and the hiring manager (CF-Cc6, CF-Cp8, CF-Cp9, CF-Cp11).
  - The careers page places the Orange Cloud Interview in the executive calls (CF-O1). No account gives a rubric. A Cloudflare employee's comment ties it to the capabilities (CF-Cc16), so the six capabilities on the careers page are the best guide to what it looks for.
- **Team-dependence (added 2026-11-11).**
  - Cloudflare-badged commenters say each team runs its own interviews:
    - "Every team is in charge of their own interviewing so impossible to answer without knowing the team" (CF-Cc30, 2024);
    - "Each team has their own set of questions, it’s pretty hard to predict what you’ll see" (CF-Cc25, 2025);
    - "there aren’t any company wide guideline, each team uses it differently." (CF-Cc29, 2023).
  - A 2025 recruiting leader on Cloudflare TV says interviews became fewer and "more prescriptive" (CF-O12).
  - The page must present the loop as typical, not fixed.
- **The company-wide coding tasks (added 2026-11-11).**
  - A rate limiter is the most repeated:
    - per IP, path, user and tenant (CF-C12, 2024);
    - rules with filters and policies (CF-C15 and CF-C16, 2025);
    - a packet stream in Go (CF-C14, 2021);
    - rate limiting pseudo code inside a 2026 design round (CF-C49).
  - A hit counter appears twice (CF-C11; CF-Cc24, 2025).
  - A stack with an increment command was the 2025 screen for the R2 team (CF-C37).
  - None of these comes from a frontend account.
  - Since 2026-11-12 the rate limiter is left out of the question list as a backend task; the hit counter and the stack stay as algorithm questions.
- **Stack.** CF-P1: "We primarily use Typescript and React." The role is about frontend work on the dashboard, with Figma. Another posting says "Our frontend is written in Typescript and React." (CF-P3). The engineering blog describes the dashboard as "a single page application that houses all of the UI for our wide portfolio of existing products" (CF-S2, 2023).
- **What ranks** for `cloudflare frontend interview questions` (WebSearch, 2026-11-03): Prepfully, Glassdoor, the LeetCode account, AlgoCademy and scoutify. No editorial frontend guide appears.
- **Readiness.**
  - The loop is well documented. The official page and the reports agree: a recruiter, a hiring manager, panel interviews with the team, an Orange Cloud Interview inside the executive calls, then an offer. The Orange Cloud Interview is a named round with its own search demand.
  - The frontend tasks are thinner. Since 2026-11-11 the app round rests on an F account (CF-C1) with T corroboration (CF-C7), and CF1 names frontend tasks. No account names the app round's four tasks, and CF3 says "You have to sign an NDA, so you can't post questions."
  - After the second question round (2026-11-11):
    - The shared rounds are well documented: the hiring manager, Orange Cloud, PM, leadership and C-level calls, and network fundamentals.
    - The frontend tasks are not, and no further public source exists outside Glassdoor and Reddit.
    - The question list held 6 frontend items and 52 company-wide ones. Since the frontend-only rule of 2026-11-12 it holds 43 rows: 12 frontend questions and 31 general ones (see The question list).
  - Enough for a content-only guide, if the page keeps three kinds of evidence apart: frontend reports (CF-C3, CF1 to CF3), the company-wide loop (official text plus CF-C2, CF-C4, CF-C5) and the web-fundamentals theme. All of it must be dated.

## Sources

Access: see Research rules. Detail: Q = names questions or a task, T = topics only, P = rounds or process only. Taro URLs share the prefix `https://www.jointaro.com/interviews/companies/cloudflare/experiences/`; the tables give the slug after it. Dates marked `*` are Taro placeholders (month only).

### Frontend-titled accounts (Taro, Glassdoor rewrites)

| id | slug | date | role, location (as Taro shows it) | access | detail | content |
|---|---|---|---|---|---|---|
| CF1 | frontend-engineer-lisbon-lisbon-district-may-1-2025-no-offer-positive-fffe2762/ | 2025-05* | Frontend Engineer, Lisbon | F | Q | "It started with an HR interview, followed by a few technical stages."; "One technical task involved TypeScript, specifically creating a type for a JSON object."; "Other tasks focused on debugging and solving small problems."; question "One challenge was debugging an issue in a React app."; "The interview process was well-structured, with interesting questions and tasks." |
| CF2 | frontend-developer-united-kingdom-march-12-2025-no-offer-negative-9c2d2a74/ | 2025-03-12 | Frontend Developer, United Kingdom | F | P | "I had a great initial chat with the hiring manager, but I left feeling disheartened after learning there would be at least six more interview rounds."; "These included two technical assessments—one at home and another as a pair programming exercise."; "I ultimately withdrew after receiving offers from companies with more reasonable processes."; question "Tell me about the types of projects you've worked on." |
| CF3 | frontend-engineer-united-states-april-9-2024-no-offer-negative-6b44551c/ | 2024-04-09 | Frontend Engineer, United States | F | P | "The hiring manager call, technical interview, and then a 5-call onsite (2 technical, 3 behavioral) all occurred within 8 days."; "Then, I just received a generic rejection email." (after three weeks of follow-ups without a reply); "You have to sign an NDA, so you can't post questions." |
| CF4 | frontend-engineer-los-angeles-ca-march-1-2024-no-offer-neutral-6526a6ee/ | 2024-03* | Frontend Engineer, Los Angeles | F | P | "I had my behavioral interview cancelled a day and a half before the scheduled date" |
| CF5 | web-developer-belgrade-central-serbia-january-1-2023-no-offer-positive-ed867ceb/ | 2023-01* | Web Developer, Belgrade | F | P | "First, there was an interview with HR."; "After that, an interview with a designer."; "And in the end, an interview with managers."; "It all took maybe around a week or two."; question "What are your salary expectations?" |
| CF6 | front-end-developer-united-states-august-3-2022-no-offer-positive-12fe2643/ | 2022-08-03 | Front End Developer, United States | F | Q | rejected after the first round: "I didn't make it past the first round of the interview process."; question "Describe how to solve a difficult problem." |
| CF7 | front-end-engineer-austin-tx-august-1-2021-no-offer-negative-324a30f0/ | 2021-08* | Front End Engineer, Austin | F | Q | "I received an email from a recruiter with a link to schedule a Google Meet call."; the recruiter asked "What I knew about Cloudflare.", "How I got into coding." and "A lot about my current role."; question "Tell me about the project you're currently working on." |
| CF8 | full-stack-web-engineer-united-states-november-1-2018-no-offer-positive-24e5825b/ | 2018-11* | Full Stack Web Engineer, United States | F | Q | phone screen: "We discussed a large project and the architecture that I chose to use."; "I also shared how I would approach it differently if I were to build the project again." |
| CF9 | software-engineer-front-end-san-francisco-ca-april-1-2018-no-offer-positive-446beb00/ | 2018-04* | Software Engineer - Front End, San Francisco | F | Q | next steps named by the recruiter: "Interview with the Hiring Manager.", "Take-home exercise." and "Face-to-face interview in San Francisco."; stopped because "H1B visas were not available for the position"; questions "What kind of work do you do at your current company?" and "Are you building new features, or working on general improvements?" |
| CF10 | front-end-engineer-united-states-august-12-2016-no-offer-negative-0d5b900e/ | 2016-08-12 | Front End Engineer, United States | F | P | the recruiter stopped replying; question "What are your availabilities for a phone interview?" |
| CF11 | frontend-engineering-united-states-march-29-2016-no-offer-neutral-0e0ac2da/ | 2016-03-29 | Frontend Engineering, United States | F | P | "They requested sample code from a project I was proud of." |

### Frontend accounts outside Taro

| id | URL | publisher, dates | role, location | access | content |
|---|---|---|---|---|---|
| CF-C1 | https://leetcode.com/discuss/post/7396827/ | LeetCode Discuss, posted 2025-12-07; read 2026-11-11 | "Software Engineer (Fullstack, Frontend Heavy) - Bengaluru"; "I have around 8 years of experience."; rejected | F (Claude in Chrome, page text) | "I applied to Cloudflare back in July and got shortlisted for the initial Hiring Manager round in October."; "All rounds were conducted virtually."; "Hiring Manager Round (30 mins)": "Mostly resume walkthrough"; "Technical Phone Screen – JavaScript (45 mins)": "A basic coding question that should be solved without using loops." and "There was a small extension too."; "selected for panel interviews (3–4 rounds)" and "Eventually, only 3 rounds were scheduled."; "Orange Cloud Round (Behavioral) – 30 mins": "This round is based on Cloudflare’s values.", "Tell me about a mistake you made and what you learned", "Something you learned outside your work", "Fun/challenging situations in your career", "More about culture-fit and mindset than technical skills."; "System Design & Architecture (1 hour)": "Interviewer picked projects from my resume", "Deep dive into architecture, decisions, tradeoffs"; "App Coding Round – React + TypeScript (1 hour)": "Install npm, nvm, React", "Given a React + TS app repo", "Mock UI + API already present", "Asked to implement 4 frontend tasks"; allowed: Google, docs and StackOverflow; not allowed: "AI tools"; "Final Verdict: Rejected"; "Completing just 2/4 tasks wasn’t enough." Four comments ask questions and add no account |
| CF-C3 | https://prachub.com/interview-experiences/cloudflare-frontend-engineer-interview-with-a-repeated-system-design-round-31294ef427 | PracHub, "Reported Feb 2026", "Published Sep 17, 2026" | Frontend Engineer, United States; level not shown; no offer | F (WebFetch, the whole account as 13 consecutive quotations) | "I went through an extensive sequence that started with conversations with the hiring manager and engineering manager"; "about my background, then moved into several live coding and architecture or system design exercises."; the later stages included an "orange cloud" behavioral interview and "PM and cross collaboration rounds"; "and a final C-level executive conversation about why I wanted the job and why I would be a good fit."; "Everything went well until I was accused of cheating"; "but they still had me redo the system design interview online."; "The second attempt went well, although it wasn't as strong as the first, and I was cut off anyway." Names no questions |

### Software-engineer accounts outside Taro, 2020 to 2026

| id | URL | publisher, dates | role, location | access | content |
|---|---|---|---|---|---|
| CF-C2 | https://prachub.com/interview-experiences/cloudflare-software-engineer-interview-experience-two-month-wait-then-advanced-to-technical-the-same-night | PracHub, interview "Dec 2025", "Published Aug 24, 2026" | Software Engineer; location and level not shown; in progress | F (WebFetch, sentence quotations) | "the first round was with the hiring manager."; questions "Why Cloudflare", "Do you have any experience using Cloudflare products?", "Introduce a recent project", "Technical details of the project", "Have you ever contributed to any production code?", "Have you ever done any code reviews?", "How do you resolve conflicts during code reviews?", "What is your methodology when debugging or when something goes wrong?"; announced next rounds: "Technical round (one hour of pair coding, focused on debugging and problem solving", "might not be a traditional algorithm question.", "Hiring manager (they discuss which team you're a fit for based on how the technical round went)", "Recruiter (offer round)" |
| CF-C4 | https://prachub.com/interview-experiences/cloudflare-software-engineer-interview-with-battleship-coding-and-austin-office-tour-3f1fddb771 | PracHub, "Reported Apr 2026", "Published Sep 17, 2026" | Software Engineer, Austin; level not shown; no offer | F (WebFetch, 19 consecutive quotations) | "It began with a hiring manager call, followed by a live coding round where I built a Battleship-style game."; the loop had an "orange cloud" behavioral interview and "a debugging discussion, a system design conversation, and a PM-focused interview."; "I also had another hiring manager conversation that included an AI-assisted coding challenge."; "I used prompts to fix bugs in a project and environment I wasn't fully familiar with."; then an invitation to "a final call with a senior executive or cofounder." and "Before that call happened, I got an Austin office tour."; the process stopped when "the role direction had changed". No frontend round named |
| CF-C5 | https://prachub.com/interview-experiences/cloudflare-software-engineer-interview-experience-hm-chat-hr-screen-then-a-key-value-store-round-where-ai-wrote-my-crypto | PracHub, interview "Oct 2025", "Published Aug 25, 2026" | Software Engineer (a Go team); location and level not shown; no response | F (WebFetch, 18 consecutive quotations) | "The HM round was basically both sides chatting about background."; "HR screen, about two weeks later."; "I could use search, and had to implement a key-value store where the value needs to be encrypted at rest,"; "I used Google AI to implement the hash-sha256 interface function" with the interviewer's OK; "Most teams at Cloudflare are hybrid, but some teams can go remote with manager approval, which is pretty appealing." |
| CF-C6 | https://www.teamblind.com/post/cloudflare-interview-process-length-2ottvzxe | Blind, post 2024-07-22 (poster badge Arista Networks) | role not stated | F (WebFetch) | after a hiring manager round: "They said next I’d get a hacker rank test and then I would get to chat with everyone on the team" and "and eventually an executive." Holds CF-Cc1 and CF-Cc2 |
| CF-Cc1 (c) | same thread | Blind, 2024-07-23, Cloudflare badge | role not stated | F | "It was about 8 interviews for me and it took place over 2 weeks as I pushed for it because I lost my job."; "the recruiter was on the phone with me with feedback and assurances almost everyday." |
| CF-Cc2 (c) | same thread | Blind, 2025-01-06, Tavant badge | role not stated | F | "Hey i cleared HM and engineer screen." The comment does not name Cloudflare; the link rests on its place in the thread |
| CF-C7 | https://www.techprep.app/community/interview-experiences/cloudflare-senior-fullstack-engineer-interview-london-2026 | TechPrep community page, "August 2026", published 2026-09-20 | Senior Fullstack Engineer, London | T (WebFetch, the account as 27 consecutive quotations) | "Started with a 30-minute conversation with the hiring manager."; "Culture fit, 30 mins:"; "PM interview, 45 mins:"; "Debugging round, 45 mins:" "They gave me a codebase which was describing a HTTP server but the routing was broken"; "System design, 1hr:" "I was asked to design an Instagram for cats."; "AI-assisted coding round, 45 mins:" "They gave me a React + TS app with a UI and API already built" "and asked me to build out 4 extra features."; "I was allowed to use Google and AI for whatever I wanted."; "the final steps included an office visit" "and a 15-minute call with a CXO." The page links its own prep guides from the account ("Study the design Instagram here"), so it is corroboration only |
| CF-C8 | https://www.teamblind.com/post/cloudflare-software-engineer-interview-hmydfd4e | Blind, post 2024-08-08, the poster's reply 2024-08-14 (badge XOJET Aviation) | "Position: Software Engineer CDE (Remote) ~5 YOE" | F (WebFetch) | "Have 2nd round interview (hackerrank round) with cloudflare next week."; after it: "Not too hard, strictly leetcode type questions for this team. Mediums". Holds CF-Cc3 |
| CF-Cc3 (c) | same thread | Blind, 2024-08-09 and 2024-09-05, JPMorgan Chase badge | role not stated: "Me and OP might’ve went for the same position."; the poster asked "What was the position? Front end specific?" and no answer appears | F | "Multiple choice + coding assessment."; "The multiple choice could be things like what is the output of this function or something."; "The assessment for me was a react project with 2 hours to completion"; "I finished all my rounds about 3 weeks ago" and then "Last Thursday night I got a generic rejected email couldn’t even get feedback" |
| CF-C10 | https://www.teamblind.com/post/cloudflare-ui-platform-team-london-pihemmox | Blind, 2022-01-02, Amazon badge | title "Cloudflare UI platform team London" | F | "Got an offer for the above mentioned role,"; no rounds described |
| CF-C11 | https://leetcode.com/discuss/post/6796944/ | LeetCode Discuss, posted 2025-05-30; read 2026-11-11 | Software Engineer: "This is for a mid-level role."; location not stated; rejected | F (Claude in Chrome, page text) | phone screen: "You were given a list of partitions and partitions used, determine the min amount of partitions required to fit all partitions."; "Onsite (4 interviews)": "Design hit counter"; system design: "You were given an existing design of an edge data center, where the logs gets generated." and "You were tasked to transport the logs to a core datacenter.", with "Encryption at rest and transit" and "I was asked to design this on premises data center (meaning no AWS, no GCP)."; "Project Retroscpective:" "You need to do a deep dive into the architecture."; "Behavioural interview (orange cloud):" "Pretty standard, tell me about a situation questions. It's only 30 mins."; "Recruiter told me I got a no-hire for system design." Not frontend. A Chinese version of the same account is on 1point3acres (thread 1135156, 2025-07-01); it is counted once |
| CF-C12 | https://leetcode.com/discuss/post/6396271/ | LeetCode Discuss, posted 2025-02-09; read 2026-11-11 | "Position: Software engineer", "Location: Remote, US", "Date: July, 2024", "Status: 4 YOE" | F (Claude in Chrome, page text) | "TPS: 3 sum extending to 4 sum"; "Coding Round:" "I was asked to complete the below function for different cases:" "Global count to check rate limiting", "Path specific request limit", "User + Path", "User + Path + Tenant", for "public boolean isRateLimited(String requestIpAddress, String requestHttpMethod, String requestHttpPath, int requestUserId, int requestTenantId) {}"; "System Design: Design Twitter". A commenter (2025-07-14): "Had the exact same loop, did you get the offer?" Not frontend |
| CF-C13 | https://leetcode.com/discuss/post/1201388/ | LeetCode Discuss, posted 2021-05-10; read 2026-11-11 | "Applied for a distributed systems engineer position."; London; rejected | F (Claude in Chrome, page text) | "It was hiring manager round, not an algorithms interview or system design."; "Question was around implementing a 'fan out' process using socket programming."; "Was allowed to Google anything." Not frontend |
| CF-C14 | https://leetcode.com/discuss/post/1424264/ | LeetCode Discuss, posted 2021-08-25; read 2026-11-11 | title "Cloudflare OA"; role not stated | F (Claude in Chrome, page text) | "Asked to code in Go. Asked a lot of questions about containers(what,why,how)."; "Rate Limter question."; "Take a continuous stream of timestamps on stdin"; "For each input, respond with either a 'd' which instructs the router to DROP the"; limits "3 packets per 1 second" and "10 packets per 5 seconds"; "Was not able to solve." Not frontend |
| CF-Cc4 (c) | https://leetcode.com/discuss/post/5225585/ | LeetCode Discuss, a commenter's own round, 2025-08-18 (the post is a 2024 question from a backend candidate) | role not stated | F (Claude in Chrome, page text) | "Expect Computer Network questions in HM round (Gave mine in August 2025)"; then "DNS", "Request/response life cycle", "Http vs https" |
| CF-Cc5 (c) | https://leetcode.com/discuss/post/530068/ | LeetCode Discuss, a commenter's own loop, 2020-07-26 | "Senior SW Engineer position based in London"; an offer ("I successfully interviewed with Cloudflare last month") | F (Claude in Chrome, page text) | "All the interviews were driven by potential future team mates."; "Initial Chat:" "I had an initial chat with an engineer."; "Phone Interview:" "Medium Leetcode problem."; "Virtual Onsite Interview:" "Technical Session", "Pair Programming Session: one easy and one medium Leetcode problems.", "System Design Session: design a CF domain specific flow, with follow up questions oriented on problems with distributed services.", "Engineering Manager Session: more of a cultural fit interview.", "Product Session: interview to understand how I deal with product in a team.", "Hiring Manager Session: again, more of a cultural interview.", "CTO screen: very informal chat with the CTO"; advice: "Make sure to understand CF as a product as well." Older (2020), but the earliest account of the product and executive rounds |
| CF-C49 | https://leetcode.com/discuss/post/7901539/ | LeetCode Discuss, posted 2026-04-14; read 2026-11-11 | title "Cloudflare \| SSE \| Bangalore \| March 2026"; "My YOE - 4"; declined before the last round | F (Claude in Chrome, page text) | "Cloudflare has started aggresively hiring in Bangalore as they have plans on expanding engineering teams in India."; "Virtual HM round (30 mins, elimination)"; "Onsite 1 (90 mins) - This was supposed to be a purely coding round, but the interviewer gave me a design problem - Design a batch processing system which will ingest support tickets data and use 3rd party LLM provider to summarise it + some pseudo code on how we will do rate limiting."; "Onsite 2 (60 mins) - Design a distributed system which will allow users to ping an http endpoint on a schedule."; "Virtual 3rd round (90 mins) - Debugging and code review with senior engineer."; "the interviewer gave me a code snippet and asked me to review it and point out gaps."; "Virtual 4th round (45 mins) - Senior leadership round"; "However the interview revolved completely around how I use GenAI/Coding Agents in my day to day work, what types of tools that I use, what are some shortcomings of coding agents, etc."; on the last round: "the recruiter would have scheduled the C-suite round (scheduling it takes around 2 weeks), where there's a 10-15% chance that you might not get an offer." The copy on interviewexperiences.in comes from this post. Not frontend |

### Plans (p)

| id | URL | publisher, date | content |
|---|---|---|---|
| CF-Cp1 | https://www.teamblind.com/post/cloudflare-frontend-interview-help-wlqz7cao | Blind, 2024-09-12, Amazon badge | "Hello, I am interviewing for frontend engineer at Cloudflare but cannot find much information on what to expect." No reply describes an interview |
| CF-Cp2 | https://www.teamblind.com/post/cloudflare-full-stack-engineer-interview-ac2zojyi | Blind, 2024-09-09, Stanley Black & Decker badge | "I have the first tech screen coming up with Cloudflare (after an HM round)" "for an early-mid career Full Stack Engineer role."; one reply, not tied to the replier's own interview: "Leetcode medium to hard" |
| CF-Cp3 | https://www.teamblind.com/post/cloudflare-frontend-interview-nq7pzv1e | Blind, 2020-11-16, Atlassian badge | before a frontend interview: "LC type or building out UI component?"; "JS domain language?" No answer describes a loop |
| CF-Cp4 | https://leetcode.com/discuss/post/5254029/ | LeetCode, 2024-06-03 (read 2026-11-11) | before a software-engineer loop: "R1 - HLD System Desgin", "R2 - Hackerank round"; "Should I focus on topics like networking, DNS etc as cloudflare asks these kind of questions?" No reply describes a loop |
| CF-Cp5 | https://leetcode.com/discuss/post/7441672/ | LeetCode, 2025-12-26 (read 2026-11-11) | "an upcoming interview loop with the Cloudflare workers deploy team including the orange cloud interview". A reply (2025-12-27) claims "the orange cloud round usually tests how you think about reliability, tradeoffs, and real-world infra scenarios." It describes no interview of the replier's own and contradicts CF-C1 and CF-C11, so it is not used |
| CF-Cp6 | https://leetcode.com/discuss/post/5809812/ | LeetCode, 2024-09-19 (read 2026-11-11) | "Did anyone apear for cloudflare senior dev interview?" No answer |
| CF-Cp7 | https://www.teamblind.com/post/cloudflare-swe-interview-gms7382q | Blind, 2026-02-22 (year from the listing), Introhive badge | before a software-engineer hiring manager round; answered by CF-Cc6 and CF-Cc7 |
| CF-Cp8 | https://www.teamblind.com/post/cloudflare-onsite-interview-experience-in-us-ovrzkhe6 | Blind, 2026-08-15, Oracle badge | "Recruiter mentioned 4 rounds : orange cloud, backend coding, system design and product"; "Backend role - Austin". Holds CF-Cc10 |
| CF-Cp9 | https://www.teamblind.com/post/cloudflare-interview-3b5kr3dk | Blind, 2025-01-07, Tavant badge (probably the CF-Cc2 commenter) | "I have final loop with cloudflare and looks like there 5 rounds with 3 behavioural"; "General interview with system engineer Orange cloud interview Product manager interview"; "Its for SWE in Analytics and reporting team." |
| CF-Cp10 | https://www.teamblind.com/post/cloudflare-final-interview-loop-jlifvddc | Blind, 2025-01-23, Samsung badge | a senior software engineer: "No hacker rank. This is a 3 round panel interview" |
| CF-Cp11 | https://www.teamblind.com/post/cloudflare-interview-any-tips-sl7m8wia | Blind, 2025-08-07, Google badge | a security engineer: "They scheduled me with 3 people back to back via Google meet.": a peer or technical interview, the hiring manager and an Orange Cloud interview |
| CF-Cp12 | https://www.teamblind.com/post/cloudflare-onsite-interview-arn1bz4k | Blind, 2025-08-19 | "I see 5 interviews for onsite."; the only reply: "Behavioral." |
| CF-Cp13 | https://www.teamblind.com/post/cloudflare-interview-process-15s7u7b8 | Blind, 2025-08-20, Expedia Group badge | "I have a 1-hour interview scheduled with Cloudflare following the hiring manager round." |
| CF-Cp14 | https://www.teamblind.com/post/LFLSvHbp | Blind, 2025-01-22, Sirius XM badge | before a coding round; holds CF-Cc20 |
| CF-Cp15 | https://www.teamblind.com/post/cloudflare-hackeerrank-45-min-pair-programming-interview-expectations-vzf4ix4r | Blind, 2024-10-22, Amazon badge | "Hi, I have a hackeerrank 45 min pair programming interview for Senior Software Engineer position"; holds CF-Cc21 and CF-Cc22 |
| CF-Cp16 | https://www.teamblind.com/post/cloudflare-engineering-manager-interview-hi11e7ww | Blind, 2025-09-05 | an engineering manager in India; holds CF-Cc23 |
| CF-Cp17 | https://www.teamblind.com/post/cloudflare-interview-q4u8znyc | Blind, 2025-04-12, JPMorgan Chase badge | "What can i expect from 45 mins hackerrank round ?"; holds CF-Cc24 and CF-Cc25 |
| CF-Cp18 | https://www.teamblind.com/post/cloudflare-engineering-interview-tips-hop6vtxp | Blind, 2023-03-21, Cisco badge | "Hey y'all I have a 60 min live coding interview coming up for a Sr Software Engineer role."; second-hand: "where you are allowed to do a google search but need to build an API."; holds CF-Cc26 and CF-Cc27 |
| CF-Cp19 | https://www.teamblind.com/post/anyone-done-a-pair-programming-round-with-cloudflare-ew1txwfl | Blind, 2025-05-26 | before a pair programming round; holds CF-Cc28 |
| CF-Cp20 | https://www.teamblind.com/post/Cloudflare-Interview-Process-58Tn7NHY | Blind, 2023-12-04, Lockheed Martin badge | "The interview is for a systems engineer."; a HackerRank round; holds CF-Cc29 |

Also read and not used for rounds: an offer comparison by a frontend developer with no rounds (Blind, 2025-08-11), a 2019 full-stack plan with no rounds, and twelve Blind threads about backend or non-technical roles.

### 1point3acres, software-engineer loops, 2023 to 2026 (visible text only; added 2026-11-11)

The forum's Cloudflare tag (`tag-3264`) holds 64 threads, 39 of them from 2023 on. None is filed as a frontend role: all are general software (`码农类General`), apart from a manager role, data science and two non-interview threads. The threads were read in Claude in Chrome, logged out; each hides its middle part behind a points threshold (`[HIDDEN>188]` in the saved text), which was not unlocked. Quotes are in the original Chinese with our translation outside quotation marks. The process-table spec and the SSR test ban the 1point3acres host in process tables, so these threads can inform page copy and the question list, not a table. Saved text: `research_notes/cloudflare-2026-11/raw/1point3acres/visible-threads-2026-11-11.txt`.

Three threads are originals or copies of accounts above and are not counted again: 1156893 is the original of CF-C2 (its reply of 2026-04-06 adds the role, a 2026 summer internship, and the outcome: "一周后 Technical 挂了，是 pair programming ，主要考察 system design 跟能不能快速上手不熟悉的工具", failed the technical a week later; pair programming that mainly tested system design and picking up unfamiliar tools quickly); 1158160 is the original of CF-C5 ("Cloudflare都多组是hybrid，但是部分组经manager同意是可以remote的"); 1135156 is a Chinese version of CF-C11.

| id | thread | header (date, category, round, outcome) | visible content |
|---|---|---|---|
| CF-C15 | 1145863 | 2025 Q3, full-time, onsite, fail | "实现rate limit 输入是一对reqest 一堆rule rule里面有filter polic" (implement a rate limit; input is a request and a set of rules with filters and policies); the rejection: "最后发好人卡 非常强 但是我们选了更match的人" (very strong, but we chose a better match) |
| CF-C16 | 1161981 | 2025 Q4, full-time, fail | "一轮做题，一轮SD，然后是product behaviour和general BQ。" (one coding round, one system design, then a product behaviour round and general behavioral questions); "实现 rate limit。" |
| CF-C17 | 1158486 | 2025 Q4, full-time, through a headhunter, technical phone screen, pass | "一道MED 一道HARD (不用写code，讲解解题思路就行)" (one medium and one hard problem, explained without writing code) |
| CF-C18 | 1176111 | 2026 Q2, a software development manager role, video interview | "cloudflare sdm第一轮hm店面30mins，别的公司一般第一轮都是recruiter" (a 30-minute hiring manager screen first, where other companies start with a recruiter); later rounds include "一轮product" (a product round) |
| CF-C19 | 1122844 | 2025 Q2, full-time, technical phone screen | "第一轮面试竟然是一个director of engineering面" (the first round was with a director of engineering); "浅浅问两个bq吧" (two light behavioral questions); the recruiter said the role could be remote |
| CF-C20 | 1052937 | 2024 Q1, full-time, initial call, fail | "无Coding ，聊简历，聊过去的项目，深挖，然后问点Network的基础问题，TCP，Socket之类的。" (no coding; a deep dive into past projects, then network basics such as TCP and sockets) |
| CF-C21 | 1064927 | 2024 Q2, full-time, technical phone screen, fail | "第一轮 hm 略微聊一下简历 问一些network基础知识" (the hiring manager round: a little résumé talk and network basics); title "cloudflare network HM + 店面 无coding" (no coding) |
| CF-C22 | 1073751 | 2024 Q3, "senior backend SDE", first round, pass | "首轮视频面试，45分钟。"; projects, contributions and problems solved, then "tcp 和 udp" |
| CF-C23 | 1075913 | 2024 Q3, "Senior backend SWE", panel, pass | "panel interview 有两位面试官，45分钟。没有coding，全程都在聊天。" (two interviewers, 45 minutes, no coding); "为什么想换公司，为什么申请cloudflare" (why leave, why Cloudflare) |
| CF-C24 | 1067015 | 2024 Q2, full-time, technical phone screen | "类似meeting rooms给一堆intervals" (an interval problem like meeting rooms) |
| CF-C25 | 1054638 | 2024 Q1, full-time, video interview, fail | two interviewers, one a principal engineer; a reply confirms "没有coding 纯project dive deep +sd" (no coding: a project deep dive and system design); another reply on a different loop: "1 算法，1 sd，2 BQ 4轮sde l3-4" (one algorithm, one system design and two behavioral rounds for SDE L3-4) |
| CF-C26 | 1058141 | 2024, full-time, onsite invitation | "收到了cloudflare连着五轮panel interviews的邀请" (five consecutive panel interviews); "面的是senior role" |
| CF-C27 | 1018125 | 2023, a systems role, video interview | "DNS, etc. 这个大概10分钟多一点。" (DNS and similar topics, a little over ten minutes) |
| CF-C28 | 1029059 | 2023 Q4, full-time | "目前完成第一個HM二十分鐘聊天，主要是聊之前的經歷" (a 20-minute hiring manager chat, mainly about past experience), then "Why Cloudflare" before the hidden part |
| CF-C29 | 1066742 | 2024 Q2, full-time, pass | "Cloudflare真的很神奇，好像没有HR，直接第一轮约的就是HM" (no HR step; the first round was the hiring manager); a reply: "他家就是hm直面加收尾，好几轮。" (hiring manager first, then several rounds) |
| CF-C30 | 1107153 | 2024 Q4, new graduate, "Software Engineer, Magic Firewall", fail | second round with two interviewers; "是NG的岗位，没想到会考system design" (a new-graduate role, and still a system design question) |
| CF-C31 | 1134746 | 2024 Q4, software engineering intern, fail | "先是一个director级别的人约的30min面试，但是更像hr call" (a 30-minute call with a director that felt like an HR call); then "仅一轮coding" (a single coding round) |

Also listed under the tag and not used: a manager's "EM面" (1154710), an intern technical screen that is fully hidden (1160314), a senior technical screen that is fully hidden (1157798), a data-science screen (1106289) and a May 2026 news thread, "Cloudflare裁员20%，1100个职位" (1175944, a 20% layoff, 1,100 roles). The Greenhouse board still listed 473 postings on 2026-11-11.

### Blind, PracHub, Hacker News and other community sources (second round, added 2026-11-11)

Read through WebFetch by a research reader on 2026-11-11 (25 WebSearch and 54 WebFetch calls, plus 14 curl calls to the Hacker News Algolia and EngineBogie APIs, with no personal data). Saves: `research_notes/cloudflare-2026-11/raw/community/agent/`. WebFetch's paraphrase and summary lines are marked there and are never quoted here. Blind pages without a year were dated from the Blind listing. No new frontend, UI, full-stack or design-engineer account was found.

| id | URL | publisher, date | role, location, outcome | access | content |
|---|---|---|---|---|---|
| CF-C35 | https://www.teamblind.com/post/interviewing-at-cloudflare-india-prepare-for-a-never-ending-marathon-zniidahy | Blind, 2026-03-24, Salesforce badge | India; withdrew | S | "They put me through more than seven rounds of interviews some of which were redundant."; "I eventually gave up and made an excuse to drop out of the process."; a commenter asks "Did you go through the C-suite round?" Holds CF-Cc8 and CF-Cc9 |
| CF-C36 | https://www.teamblind.com/post/avoid-cloudflare-interview-e1j46oqt | Blind, 2026-01-07, Google badge | ">20yoe"; outcome not stated | S | "It was insanely vague, with nothing to go on -- no inputs/outputs, no spec, no API or prototype definitions,"; "This was a coding question, in an IDE, with a high-level language." Holds CF-Cc11 |
| CF-C37 | https://www.teamblind.com/post/cloudflare-interview-7gj1iyd5 | Blind, 2025-01-14, Black Knight Financial badge | a technical screen for the R2 team | F | "a stack implementation question" "with push, pop, and incr command. I passed 10/14 test cases, needed to implement lazy propagation for incr." Holds CF-Cc13 |
| CF-C38 | https://www.teamblind.com/post/cloudflare-worst-interview-experience-ever-ua7se6f0 | Blind, 2026-10-14, IBM badge | a recruiter call | F | "The recruiter was 15 min late."; "Never read my resume."; "Did not even bother explaining the role itself." |
| CF-C39 | https://www.teamblind.com/post/cloudflare-orange-cloud-interview-gjwkkfzo | Blind, 2024-02-10, the poster's report 2024-02-13, no badge | role not stated; told they were a cultural fit | F | before: "I’m looking for tips to prepare for my Cloudflare Orange Cloud round interview."; after: "I got 3 scenario questions and the interviewer said I did a great job and I am certainly a cultural fit ☺️"; "I’ve done a lot of prep with scenario based questions before."; "However, I wouldn’t recommend anyone going with zero scenarios prepared." Two requests for the questions got no answer. Holds CF-Cc15 to CF-Cc17 |
| CF-C40 | https://www.teamblind.com/post/cloudflare-phone-interview-gatdfnwe | Blind, 2025-06-10, Walmart badge | a phone interview | F | "It was on hacker rank platform. For me 7/11 test cases ran." |
| CF-C41 | https://www.teamblind.com/post/cloudflare-ghosting-me-at-team-match-stage-wmydlp7g | Blind, 2025-05-19 | "Software engineering role."; no reply after team match | F | "I’ve been ghosted after reaching the team match stage." |
| CF-C42 | https://hn.algolia.com/api/v1/items/20856671 | Hacker News comment, 2019-09-02 | role not stated | F (API JSON) | "Scuttled a phone interview with a hiring manager at Cloudflare real fast" after a question on "your best quality" |
| CF-C43 | https://hn.algolia.com/api/v1/items/12017806 | a Hacker News hiring thread, July 2016, Cloudflare's own post | employer post, historical | F (API JSON) | "Great front-end engineers -- building new UI"; "Our new projects are using React + Redux + Babel + css-modules, and generally adopting Higher Order Components."; "The interview process is a phone screen with a recruiter, then one or two technical interviews by phone, then a full day of onsite interviews." |
| CF-C44 | https://indiscretemusings.substack.com/p/on-cloudflare | Substack, 2026-01-08 | a junior non-engineering hire | S | "I went through 10+ interviews, the last with Matthew, the co-founder and CEO."; "The structure covered several areas: technical (even for non-technical roles), behavioral, and others, as you’d expect." |
| CF-C45 | https://lets-code.co.in/interview-experience/cloudflare-software-engineer/6a15d0af5a2624747306d750/ | lets-code.co.in, 2026-05-26, anonymous, no source given | Software Engineer; rejected | T | a templated prep-site page; "Questions were based on real scenarios such as handling disagreements". Corroboration only |
| CF-C46 | https://www.teamblind.com/post/cloudflare-panel-interview-ssxsycnm | Blind, 2024-02-28, outcome 2024-07-02, CPI badge | new graduate; rejected | F | "I recently scheduled an interview with Cloudflare for a panel interview with 4 of their employees."; "I'm a new grad candidate and I'm not that good with system design."; "Rejected the next day". Holds CF-Cc30 |
| CF-C47 | https://www.teamblind.com/post/cloudflare-interview-bsl8qu7o | Blind, 2024-04-07 | software engineer; passed the hiring manager round | S | "It was mostly projects related with few behavioral questions"; next: "It says it is a technical interview and system design is also mentioned but no coding." Holds CF-Cc31 |
| CF-C48 | https://www.teamblind.com/post/cloudflare-interview-process-xnnc7duk | Blind, 2024-02-15, update 2024-03-04, Arista Networks badge | software engineer, Austin, a networking-related role | F | "Just questions about my experience and some behavioural questions about how I work with others etc."; "Following that apparently there’s a pair programming interview and a system design interview."; "The panel interviews are kind of clustered, had 3 in one day and 2 the next day" |
| CF-C32 to CF-C34 | three PracHub stories (`…solutions-engineer-missed-interviews…`, `…account-executive-interview-with-a-mock-discovery-call…`, `…account-executive-interview-with-manager-call-and-sales-role-play…`) | PracHub, reported 2026-01 to 2026-04 | a solutions engineer (Spain) and two account executives (Singapore, United Kingdom) | S | not engineering; used only for the product-knowledge theme: "Product knowledge mattered a lot, and I needed to know Cloudflare's products well to do well." (CF-C34) |

**Comments with the commenter's own round or a Cloudflare badge** (in the threads above):

| id | thread | badge, date | content |
|---|---|---|---|
| CF-Cc6 | CF-Cp7 | Gcore, 2026-02-25 | "HM interview is just simple convo, after that will be coding screen."; "Then the loop will be 5 rounds: System Design, Coding, PM, Orange Cloud, and another one with HM." |
| CF-Cc7 | CF-Cp7 | Salesforce, 2026-03-24 (the CF-C35 poster) | "This is not true for India. There are extra behavioral and project discussion rounds on top of these 5 rounds." |
| CF-Cc8 | CF-C35 | Goldman Sachs, 2026-03-25 | "LC medium."; "Sys des - std questions, nothing complex." |
| CF-Cc9 | CF-C35 | Cloudflare, 2026-04-03 | "All cloudflare interviews are very long. 90 days easily." |
| CF-Cc10 | CF-Cp8 | Cloudflare, 2026-08-20 | "It’s team dependent and pretty standard big tech style industry interviews."; "Not usually leetcode hard or anything."; "Orange cloud be sure to show your empathetic and chill" |
| CF-Cc11 | CF-C36 | Cloudflare, 2026-01-09 | "CF definitely has some ancient domain-specific questions, & experimental new questions, for their hiring pipelines." |
| CF-Cc13 | CF-C37 | Cloudflare, 2025-01-22 | "Specifically it's called Super Stack that Cloudflare uses especially the r2 team." |
| CF-Cc15 | CF-C39 | Cloudflare, 2024-02-11 | "It’s kind of a sanity check interview to make sure you’re not insane." |
| CF-Cc16 | CF-C39 | Cloudflare, 2024-02-11 | "It's similar to the behavioral interview round that many companies have now. "; "And for "Cloudflare capabilities" for the qualities that the CF interviewer will be looking for in your answers." |
| CF-Cc17 | CF-C39 | Cloudflare, 2024-02-11 | "Don’t be an idiot. It’s the easiest thing ever." |
| CF-Cc20 | CF-Cp14 | Cloudflare, 2025-01-27 | "- The first coding round is generally a leetcode medium of some kind."; "- The hiring manager will fit you to a level based on experience & how well the interviews go." |
| CF-Cc21 | CF-Cp15 | Intel, 2024-10-22 | "It is not LC style, more of an elaborate real-world programming exercise." |
| CF-Cc22 | CF-Cp15 | ByteDance, 2024-11-23 | "It’s a practical type of question, using a language aligned with the role."; "You share your screen and use your own IDE and it’s open book" |
| CF-Cc23 | CF-Cp16 | Cloudflare, 2025-09-13 | "Can only speak for my org, but we look for technical managers (more system design, less leetcode)" |
| CF-Cc24 | CF-Cp17 | Trend Micro, 2025-04-14 | "I got asked this a couple weeks ago https://algo.monster/liteproblems/362" (problem 362 is Design Hit Counter; the link was not opened) |
| CF-Cc25 | CF-Cp17 | Cloudflare, 2025-04-12 | "Each team has their own set of questions, it’s pretty hard to predict what you’ll see" |
| CF-Cc26 | CF-Cp18 | Cloudflare, 2023-03-21 | "Depends on the team really but usually a mix of mostly LC mediums, sometimes hard" |
| CF-Cc27 | CF-Cp18 | Cloudflare, 2023-03-23 | "Make sure you have a local environment for your interview."; "If you plan on using JS, have node, etc ready to go, things like that." |
| CF-Cc28 | CF-Cp19 | Expedia Group, 2025-05-26 | "It's Leetcode style! I recently did it. There was only 1 problem. LC easy-medium array based" |
| CF-Cc29 | CF-Cp20 | Cloudflare, 2023-12 | "The interviewer presents the problem and you walk them through how you would solve it,"; "Yeah same general idea as leetcode, but there aren’t any company wide guideline, each team uses it differently." |
| CF-Cc30 | CF-C46 | Cloudflare, 2024-02-29 | "Every team is in charge of their own interviewing so impossible to answer without knowing the team" |
| CF-Cc31 | CF-C47 | Amazon, 2024-04-08 | "they drill down on my resume and asked many counter questions."; "They also gave me bug and how would I debug it, also asked me about deadlocks" |

Read and not used: comments without content (CF-Cc12, CF-Cc14, CF-Cc18, CF-Cc19, CF-Cc32, CF-Cc33 in the saves), seven Blind threads without rounds, a passing mention on dev.to, and EngineBogie experience 1230 (see Unreadable). The same posters appear more than once: a Sirius XM poster in CF-Cp14, CF-Cp10 and CF-C37; the Salesforce poster in CF-C35 and CF-Cc7; one Cloudflare-badged commenter in CF-Cc11, CF-Cc20 and CF-Cc23.

### Frontend-adjacent accounts (Taro, generic titles)

| id | slug | date | role, location | access | content |
|---|---|---|---|---|---|
| CF12 | software-engineer-united-states-july-12-2025-no-offer-negative-e1643845/ | 2025-07-12 | Software Engineer, United States | F | question "Technical screen - vanilla JS promises"; "After the onsite interview, I was rejected with a generic email." |
| CF13 | software-engineer-germany-december-1-2024-no-offer-positive-968f1ec1/ | 2024-12* | Software Engineer, Germany | F | "The first round is with an engineering manager, who asks behavioral questions and a single technical question (what happens when you enter a link in your browser and press enter)."; "The second round is a technical screening."; "The third round is with the team."; question "Tell me about a time in which you took a 'step' outside the norm of your workplace." |
| CF14 | software-engineer-portugal-september-18-2024-no-offer-positive-3c9cb577/ | 2024-09-18 | Software Engineer, Portugal | F | "The first interview was with the team manager with a relaxed tone."; "It took around 20 minutes and was a mix of technical with behavioral."; question "Describe what happens after your search for a website on the internet (internet protocols)." |
| CF15 | software-engineer-united-states-august-1-2024-no-offer-negative-55f09b51/ | 2024-08* | Software Engineer, United States (a data team) | F | "The phone screen included:" "1 LeetCode (medium)", "1 SQL (medium)", "1 React"; "I guess this is because that group specifically focuses on data." |
| CF16 | software-engineer-san-francisco-ca-october-1-2023-no-offer-negative-7047176e/ | 2023-10* | Software Engineer, San Francisco | F | "My process started with a coding challenge that I spent a significant amount of time on."; question "Basic questions about browsers, DNS, routing, etc." |
| CF18 | software-engineer-united-states-june-16-2022-no-offer-negative-c12d5ae5/ | 2022-06-16 | Software Engineer, United States | F | "Talk with a recruiter", "Code screen", "Talk with hiring manager", "Virtual onsite interview"; "They also insisted I use Python, even though I expressed I was more comfortable with JavaScript."; question "Implementing an in-memory cache." |
| CF19 | software-engineer-united-states-november-11-2021-accepted-offer-positive-323fdcc4/ | 2021-11-11 | Software Engineer, United States, accepted offer | F | online assessment: "Implement the front-end and back-end using the Cloudflare platform." |

### Web and network fundamentals in generic loops (Taro, 2022 to 2025)

The grep found 16 accounts from 2022 on. The 13 software-engineer ones are listed: CF13, CF14 and CF16 above, and CF24 to CF33 below. The other three are a solutions engineer, a SOC engineer and a cloud engineer, and are not listed.

| id | slug | date | role, location | access | content |
|---|---|---|---|---|---|
| CF24 | software-engineer-united-states-august-1-2024-no-offer-positive-d606677a/ | 2024-08* | Software Engineer, United States | F | "1 phone screen, mainly focused on internet-related knowledge (HTTP/HTTPS/DNS, etc.), no coding."; then LeetCode on HackerRank: "Solve the 3Sum question." |
| CF25 | software-development-engineer-united-states-november-1-2024-no-offer-negative-bddb091b/ | 2024-11* | Software Development Engineer, United States | F | a call booked as 20 minutes "turned out to be a hiring manager round"; questions "Explain DNS.", "Tell me the differences between HTTP and HTTPS." and "Explain the TCP/IP protocol." |
| CF26 | software-engineer-colorado-springs-co-august-1-2024-no-offer-negative-a6b85523/ | 2024-08* | Software Engineer, Colorado Springs | F | "Initial call with engineer, some technical questions"; question "Describe the process of DNS resolution." |
| CF27 | software-engineer-bengaluru-september-1-2025-no-offer-negative-48b89a11/ | 2025-09* | Software Engineer, Bengaluru | F | "I was rejected right after the hiring manager round."; question "DNS related deep questions and encryption keys" |
| CF28 | software-engineer-kansas-city-mo-january-1-2025-no-offer-positive-6937e242/ | 2025-01* | Software Engineer, Kansas City | F | "HR screen, met with a manager for hiring, discussed role, Cloudflare & how the internet works"; question "Describe how an internet request works (round trip)." |
| CF29 | software-engineer-united-states-march-1-2023-no-offer-negative-d11c7fd5/ | 2023-03* | Software Engineer, United States | F | "Initial interview", "Take-home coding exercise", "Technical interview with the team manager", "Offer"; take-home: "Perform a TLS handshake with a Cloudflare worker service and decrypt the response, which contained a link to a Google form."; "Also, do a system design for a Message Authentication Code system in 10 minutes, without a whiteboard, and over the phone." |
| CF30 | graduate-software-engineer-united-kingdom-may-29-2025-no-offer-neutral-7e169c8f/ | 2025-05-29 | Graduate Software Engineer, United Kingdom | F | "a couple of pair programming questions via video"; questions "Build a circular buffer on a video call.", "Parse JSON in Python." and "Design communication mechanisms for a CDN." |
| CF31 | sde-intern-united-states-october-17-2023-no-offer-positive-692a535e/ | 2023-10-17 | SDE intern, United States | F | "The coding interview was about HTTP requests and very similar to actual daily work."; "Topics included HTTP status codes, sending requests, and schedulers." |
| CF32 | software-engineer-united-states-march-31-2025-no-offer-neutral-d354f148/ | 2025-03-31 | Software Engineer, United States | F | a screening call "asked for networking questions dealing with switches"; question "How to connect switches?" |
| CF33 | software-engineer-united-states-july-22-2024-no-offer-neutral-9b4d9eee/ | 2024-07-22 | Software Engineer, United States | F | "Have you worked on projects involving technologies Cloudflare uses, such as CDN, security, and networking?"; "How would you design a system to handle using Cloudflare services?" |

### Early career (Taro)

| id | slug | date | role | access | content |
|---|---|---|---|---|---|
| CF17 | software-engineer-intern-united-states-june-17-2023-no-offer-positive-9cc48b20/ | 2023-06-17 | Software Engineer Intern | F | take-home: "Build a front-end service, a back-end service, and an auth service and deploy on Cloudflare infrastructure."; then "Screening interview by hiring manager.", "Pair programming interview." and "HR interview."; question "Write a function in Go." |
| CF20 | software-engineer-iran-october-1-2021-no-offer-negative-de27d210/ | 2021-10* | Software Engineer (location shown as Iran) | F | "They sent me an online test (10 questions) which was mostly about network & security and not related to the job description." |
| CF21 | software-engineer-intern-united-states-september-1-2021-no-offer-negative-f630480e/ | 2021-09* | Software Engineer Intern | F | "Code a frontend React website that basically mimics Facebook's core functionalities."; "Also, build the backend API for it too." |
| CF22 | software-engineering-united-states-october-29-2020-no-offer-neutral-ac54f85f/ | 2020-10-29 | Software Engineering (internship loop) | F | "You will complete a general coding assignment centered around JavaScript."; questions "Develop a JSON API." and "Create a static HTML webpage." |
| CF23 | software-engineer-new-grad-united-states-september-1-2020-no-offer-negative-2c2a1ca1/ | 2020-09* | Software Engineer New Grad | F | "Build a website with their serverless tools, then write an additional tool to send HTTP requests to that site." |

### Generic software-engineer loops, 2024 to 2025 (Taro, contrast only)

54 accounts with software-engineer titles from 2024 and 2025, outside the tables above, were grepped for stage words (counts are accounts that mention the stage):

| Stage word | Accounts |
|---|---|
| recruiter or HR | 24 |
| hiring or engineering manager | 23 |
| behavioral or values | 13 |
| live, pair or algorithm coding | 11 |
| system design | 7 |
| take-home | 5 |
| online test | 4 |
| team round | 2 |

Examples of named generic tasks: "Implementing a network protocol in Rust." (2024-08*); "Solve the 3Sum question." (CF24); "Implementing an in-memory cache." (CF18).

### Taro re-sweep and other generic accounts (added 2026-11-11)

All 195 Cloudflare pages were fetched again on 2026-11-11 from the public sitemaps (the 2026-11-03 saves were lost); no page was added since 2026-11-03, and none fails. A keyword scan of the 162 pages outside CF1 to CF33 found no frontend content: no React, JavaScript, TypeScript, CSS, HTML, DOM, browser, frontend or UI wording at all. Taro also holds a copy of the LeetCode post CF-C12 (`software-engineer-india-february-17-2025-no-offer-positive-33c89066/`, the same text), so Taro imports more than Glassdoor reviews; it is counted once. The generic accounts below add evidence for the shared rounds. Saves: `research_notes/cloudflare-2026-11/raw/taro/`.

| id | slug | date | role, location | access | content |
|---|---|---|---|---|---|
| CF34 | software-engineer-lisbon-lisbon-district-september-30-2025-no-offer-positive-749cb301/ | 2025-09-30 | Software Engineer, Lisbon | F | "Cloudflare’s software engineer interview process has about 7 stages:" "Recruiter screen", "Technical phone interviews", "System design", "Practical coding/debugging", "Behavioral/values", "Team/hiring manager", "Sometimes a final deep dive or presentation". A generic list; no task named |
| CF35 | soc-engineer-united-states-february-7-2024-no-offer-neutral-26abb23e/ | 2024-02-07 | SOC Engineer, United States | F | "Quizzed on security and networking concepts, with an Orange Cloud interview at the end. This involved many fake pleasantries and scripted behavioral questions and answers."; "Researched the company extensively but was not asked a single question about "Why Cloudflare."" |
| CF36 | senior-software-engineer-paris-may-1-2022-declined-offer-positive-15a90462/ | 2022-05* | Senior Software Engineer, Paris, declined offer | F | "starting with an easy home assignment"; "One with the hiring manager."; "Approximately five interviews with engineers."; "Two calls with the VP and CEO, which proceeded in a similar friendly manner."; questions "Mid Leetcode problems." and "Design a data streaming system with Cloudflare scale." |
| CF37 | research-engineering-intern-san-francisco-ca-july-3-2024-accepted-offer-positive-268f2c35/ | 2024-07-03 | Research Engineering Intern, San Francisco, accepted offer | F | "A technical interview round with engineers from the team, covering different disciplines."; "Finally, a chat with the CTO."; question "Determine the cause and solution for high tail latency in a distributed system." |
| CF38 | software-engineer-india-april-12-2022-no-offer-negative-1af71cd4/ | 2022-04-12 | Software Engineer, India (the Zaraz team) | F | "I applied to the Zaraz team and received a link to the take-home assessment after a few months."; "The task stated it could be completed in two hours"; "Take-home assessment using the Cloudflare handler (similar to AWS Lambda) and a few other requirements." |
| CF39 | software-engineer-new-york-new-york-october-27-2025-no-offer-positive-cb009227/ | 2025-10-27 | Software Engineer, New York | F | "Focused on my background, project experience, and motivation to join Cloudflare."; question "They asked how I would handle missing or inconsistent data when creating performance dashboards." |
| CF40 | soc-engineer-poland-december-1-2022-accepted-offer-negative-8754c30b/ | 2022-12* | SOC Engineer, Poland | F | "6 rounds of interviews"; "Final round with executives"; question "Just questions about L4 and L7." |

### Unreadable or seen in search only

| id | URL | publisher, date | access | note |
|---|---|---|---|---|
| CF-C1, CF-C11 | https://leetcode.com/discuss/post/7396827/ and https://leetcode.com/discuss/post/6796944/ | LeetCode Discuss | F since 2026-11-11 | U on 2026-11-03 (HTTP 403; the GraphQL read and a republished copy were refused). Read through Claude in Chrome on 2026-11-11 and moved to the tables above. The search summaries of CF-C1 recorded here on 2026-11-03 matched the post |
| — | EngineBogie experience 1230 (https://enginebogie.com/api/interview/experience/1230) | EngineBogie, created 2026-01-27 | F (API JSON, 2026-11-11) | a rewrite of CF-C1 with the same rounds and lengths. Its hiring manager question names another company ("describe what Oracle does"), so the site fills in a reused question bank. Not evidence |
| — | interviewexperiences.in, `Cloudflare SSE Bangalore March 2026` | interviewexperiences.in | not opened | a copy of LeetCode 7901539, read in the original on 2026-11-11 as CF-C49 |
| — | Glassdoor Cloudflare frontend and developer reviews | Glassdoor | not opened (rule) | appear in every search; the Taro rows are rewrites of some of them |

### Postings (Greenhouse, open on 2026-11-03)

| id | posting | content |
|---|---|---|
| CF-P1 | 6998777 "Senior Design Engineer", Hybrid; offices Austin, New York, San Francisco; first published 2025-06-20, updated 2026-10-30; https://boards.greenhouse.io/cloudflare/jobs/6998777 | "You will help design and develop frontend experiences that improve overall developer experience throughout our dashboard."; "On any given day, you might be working in Figma collaborating on designs or inspiration, developing new components and user interactions, polishing existing pages, or improving developer experience"; "We primarily use Typescript and React."; "Experience designing and building frontend applications."; "Experience debugging, optimizing and identifying failure modes in large-scale frontend applications."; "the AI-native curiosity to create a solution using the latest tools"; on interviews: "Please note that applicants who progress to the offer stage of the interview process may be asked to attend an in-person interview within one of the Cloudflare Offices or Cloudflare Hubs." |

On 2026-11-11 the board listed 473 postings, and CF-P1 was still among them (updated on 2026-11-09).

Other postings (all 469 were read). Every posting carries the in-person sentence above and "More details about this will be available at that stage of the interview process." No posting title other than CF-P1 contains frontend, front-end, UI, web or full-stack. No posting mentions a take-home, pair programming or a coding test. Posting ids are Greenhouse ids.

| id | posting | content |
|---|---|---|
| CF-P2 | 8175620 Systems Engineer, Growth Engineering, Hybrid (Austin) | "As an experienced, product-minded front-end or full-stack engineer, you will bridge product engineering and growth to translate product vision into polished code that directly impacts key business metrics and evolves our self-service properties."; "Proficiency in TypeScript/JavaScript for building reusable SDKs and UI components, alongside strong knowledge of HTML, CSS, and modern JavaScript ecosystems." |
| CF-P3 | 8257140 Systems Engineer - Data Security, Hybrid (Austin) | "Our frontend is written in Typescript and React." |
| CF-P4 | 8259402 Software Engineer, AI Agents, In-Office (Bengaluru) | the only posting with an interview section: "Interview Signal"; "Build a mini agent on Workers using the Agent SDK" |

### Official pages

| id | URL | date | access | content |
|---|---|---|---|---|
| CF-O1 | https://www.cloudflare.com/careers/ | undated (read 2026-11-03) | F | "Our Hiring Process": "Connect with a recruiter to discuss your background, interests, and the role."; "Meet with your prospective manager and peers. These conversations focus on how you think, your problem-solving approach, and the skills you bring to the table."; "A conversation with senior leadership to align on vision, values, and long-term goals. This includes our Orange Cloud Interview focused on the behaviors we value."; "We move quickly once we've found the right person."; the six capabilities: "Be curious to learn and grow", "Communicate clearly and transparently", "Do the right thing", "Embrace diversity", "Get your work across the finish line", "Lead with empathy" |
| CF-O2 | https://www.cloudflare.com/careers/early-talent/ | undated | F | about intern work, not interviews: "We don't do 'test projects.' We do real-world impact." |
| CF-O3 | https://www.cloudflare.com/candidate-privacy-notice/ | "Last Updated: September 24, 2026" | F | "Information generated during technical assessments, including test results, work samples, and technical metadata (such as session activity, duration, and technical identifiers) captured by our proprietary assessment platforms."; "HackerRank, a cloud services provider located in the United States of America and engaged by Cloudflare to administer coding tests to candidates on Cloudflare’s behalf."; "We utilize AI-powered tools, such as Eightfold, to help analyze and rank candidates based on their likelihood of success in a role." |
| CF-O4 | https://blog.cloudflare.com/cloudflare-1111-intern-program/ | 2025-09-22, modified 2026-07-15 | W | "For the Software Engineering internship, we plan to fast track review of candidates who complete an assignment to build a type of AI-powered application on Cloudflare."; "Our interview process will take 3-4 weeks." |
| CF-O5 | https://blog.cloudflare.com/lessons-from-the-2020-intern-assignment/ | 2020-06-23 | W | "I'm not a huge fan of timed coding exercises, which is a pretty traditional way that companies gauge candidate skill"; "The exercise was designed specifically to be a little past beginner JavaScript."; "By far the place where applicants struggled the most was in writing clean code." |
| CF-O6 | https://blog.cloudflare.com/one-year-later-1111-interns/ | 2026-10-05 | W | context: "So far, we’ve hosted 750 internships across 48 teams in nine offices" |
| CF-O7 | https://blog.cloudflare.com/helping-to-build-cloudflare-part-5/ | 2019-02-05 | W | "We put people through on average 8 interviews and a pair programming exercise." |
| CF-O8 | https://blog.cloudflare.com/cloudflares-a-top-100-most-loved-workplace-for-2023/ | 2023-10-05 | W | "Before anyone gets an offer, every candidate in the final stage connects with one of our executive leaders including our co-founders." |
| CF-O9 | https://blog.cloudflare.com/internship-experience-research-engineer/ | 2021-10-11 | W | a research intern's own account: "a pair programming interview task with a member of the team" |
| CF-O10 | https://blog.cloudflare.com/international-womens-day-2020-building-a-modern-security-team/ | 2020-03-06 | W | of the co-founders and executives: "One of them will always be the last person to meet the candidate on their final interview." |
| CF-O11 | https://blog.cloudflare.com/when-i-knew-cloudflare-was-the-right-place-for-me/ | 2019-03-28 | W | "Cloudflare gives candidates the unique opportunity to interview a member of their executive team as a last stage." |
| CF-O12 | https://cloudflare.tv/this-week-in-net/cloudflare-growth-culture-ai-in-recruitment-and-11-years-of-project-galileo/YgQYE4gd | 2025 (page dated 2025-11-14) | S (read 2026-11-11) | a recruiting leader on Cloudflare TV: "every single person that joins us has a C-level interview with one of them."; "Spend 20 minutes with them. They can ask them any question."; "for some of the more technical roles, you have to showcase your technical ability by going through coding exercises."; "So the actual number of interviews have been scaled back."; "the rigor of the interviews have been maintained and have been more prescriptive"; "We will need to have hiring teams that know how to leverage AI."; "Curiosity ranks high." |
| CF-O13 | https://cloudflare.tv/event/how-to-standout-for-engineering-product-opportunities/5dvozngX | 2020-07-21 | S (read 2026-11-11) | a recruiter with product and engineering directors: "usually you'll do some sort of kind of technical screen, at least on the engineering side."; "if you're going to be writing code, write in what's comfortable and ask if that's okay."; "We just want to see how you think."; "Everybody's always going to ask about, tell me about yourself."; "Tell me about an accomplishment you're most proud of."; on the co-founders' final call: "it's basically 20 minutes" |
| CF-O14 | https://cloudflare.tv/event/cftv-anniversary-cloudflare-careers-day-recruiting-at-cloudflare/DvNPD6Zw | 2021-06-09 | S (read 2026-11-11) | "there's going to be behavioral interview question to really understand that you have the same kind of values"; "you will get the opportunity to speak with our CEO, Matthew," "or our CTO, John Graham-Cumming." |
| CF-O15 | https://cloudflare.tv/shows/recruiting-corner/recruiting-corner/Xdg77mgO | 2020-07-09 | S (read 2026-11-11) | "and just talk to you for 20 to 30 minutes."; "this is less of an interview and just more of a time to connect with these people"; "Let's break that up over the course of maybe two or three days." |
| CF-O16 | https://cloudflare.tv/event/cloudflare-careers-day-recruitment-corner/DZyqzdZr | 2021-05-28 | S (read 2026-11-11) | "usually directly with the, with the hiring manager."; "Sometimes you might have a take home test."; "After that you have usually a panel with some of the interviewers."; "each interviewer will have two to three focus areas that they're going to cover with you" |

Searched and NOT FOUND on cloudflare.com: a frontend or engineering interview page, a candidate FAQ, a `how we hire` or `what to expect` page, a reapply rule, a recruitment-scam page (two Bengaluru postings carry a fraud alert), and any official rule on candidates using AI. CF-O12 (a 2015 post titled with "interview questions") is a joke about TCP/IP quirks, not interview evidence.

### Official internship briefs (GitHub, 2020 to 2021)

The briefs sit on two GitHub user accounts run for Cloudflare hiring. `cloudflare-internship-2020` is linked from CF-O5. That `cloudflare-hiring` is Cloudflare's rests on commits from cloudflare.com addresses; no official page links it. None of the briefs asks candidates not to share them.

| id | repository | created | content |
|---|---|---|---|
| CF-OG1 | https://github.com/cloudflare-internship-2020/internship-application-fullstack | 2020-04-10 | "Using Cloudflare Workers, you'll deploy an application that will randomly send users to one of two webpages." |
| CF-OG2 | https://github.com/cloudflare-hiring/cloudflare-2020-general-engineering-assignment | 2020-09-18 | "In this exercise, you'll deploy a Cloudflare Workers project in order to build a linktree-style website." |

Five more briefs (systems and product management, CF-OG3 to CF-OG7, 2020 to 2021) are not frontend and are not listed here.

### Candidate repositories (GitHub)

About 40 README files of candidates' repositories were read. None asks solvers not to publish or not to name Cloudflare. What they show:
- **2021:** several front-end repositories for the general assignment, React clients of a social or Reddit-style app; one is described as the front-end portion of a take-home.
- **2022:** an internship social-media app.
- **2023 and January 2025:** take-homes built with React plus Workers or Pages Functions, and a URL shortener (2023).
- **2026:** projects for the Software Engineer application assignment, an AI app with a chat front end. The assignment text copied in one of them asks for a public repository and forbids copying other submissions; it does not ask candidates to keep the brief private.

No repository of a four-feature React and TypeScript interview app was found, and a code search found none either. The repositories are individuals' accounts, so their URLs stay in the git-excluded notes, not in this record.

### Stack context (not interview evidence)

| id | URL | date | content |
|---|---|---|---|
| CF-S1 | https://blog.cloudflare.com/project-a11y/ | 2022-09-30 | "For designers and developers at Cloudflare, our accessibility remediation project has resulted in an overhaul of our component library." |
| CF-S2 | https://blog.cloudflare.com/benchmarking-dashboard-performance/ | 2023-06-22 | "The Cloudflare dashboard is a single page application that houses all of the UI for our wide portfolio of existing products, as well as the new features we're releasing every day." |
| CF-S3 | https://blog.cloudflare.com/vertical-microfrontends/ | 2026-01-30 | the dashboard and Zero Trust are "two entirely separate projects" routed by path |

Cloudflare's open-source component library `cloudflare/kumo` (created 2025-10-30) exists; no official text ties it to the dashboard, so it is not cited.

### Previews and templates (not evidence)

Prepfully (a Cloudflare frontend engineer question bank), Dataford, PracHub question lists, techprep.app blog pages, AlgoCademy and scoutify appear in search results and were not cited.

## Loop by level and region

**Official text.** The careers page (CF-O1) lists five steps: initial conversations with a recruiter, team panel interviews with "your prospective manager and peers", executive calls that include the Orange Cloud Interview, an offer, and orientation. It does not say which roles the panel covers or what it tests beyond "how you think, your problem-solving approach, and the skills you bring to the table."

The privacy notice (CF-O3) names HackerRank for coding tests and "proprietary assessment platforms". Every posting says offer-stage candidates may be asked to interview in person (CF-P1).

Older official posts add three things:
- "on average 8 interviews and a pair programming exercise" (CF-O7, 2019);
- an executive as the last interviewer (CF-O10, 2020; CF-O11, 2019);
- every final-stage candidate meeting an executive leader (CF-O8, 2023).

Frontend-specific official text: NOT FOUND.

### Frontend engineers, 2024 to 2026 (CF-C3, CF-C1, CF1, CF2, CF3; CF4)

- **United States, 2026 (CF-C3, PracHub):** hiring manager and engineering manager, then "several live coding and architecture or system design exercises", then an "orange cloud" behavioral interview, PM and cross collaboration rounds, and a final C-level conversation. The candidate redid the system design interview online after being "accused of cheating" and was then cut off.
- **Bengaluru, 2025 (CF-C1, LeetCode, a frontend-heavy full-stack role; added 2026-11-11):** a 30-minute hiring manager round, a 45-minute JavaScript phone screen, then three panel rounds: a 30-minute Orange Cloud round, a one-hour system design on the candidate's own projects and a one-hour React and TypeScript app round. All virtual. Rejected after finishing two of the four app tasks. The application in July led to the first round in October.
- **United States, 2024 (CF3):** a hiring manager call, a technical interview and a five-call onsite with two technical and three behavioral calls, all within eight days. Then a generic rejection after three weeks of unanswered follow-ups. NDA.
- **Los Angeles, 2024 (CF4):** a behavioral interview was scheduled and then cancelled.
- **United Kingdom, 2025 (CF2):** a hiring manager chat, then "at least six more interview rounds", including an at-home technical assessment and a pair programming exercise. The candidate withdrew.
- **Lisbon, 2025 (CF1):** an HR interview, then a few technical stages: a TypeScript type for a JSON object, debugging tasks, small problems, and debugging an issue in a React app.
- **Not reported for frontend roles:** an online test, an algorithm round and a take-home review. Round lengths come from one account (CF-C1).

### Engineering loop, 2024 to 2026 (CF-C2, CF-C4, CF-C5, CF-C6, CF-C11; CF-C7 as corroboration)

- **Hiring manager first.**
  - CF-C2 lists the hiring manager's questions: why Cloudflare, Cloudflare products, a recent project, production code, code reviews and conflicts in them, and debugging method.
  - In CF-C5 the HR screen came about two weeks after the hiring manager.
- **Technical round.**
  - "one hour of pair coding, focused on debugging and problem solving" (CF-C2, announced);
  - a Battleship-style game (CF-C4);
  - a key-value store encrypted at rest, with search allowed (CF-C5);
  - a partitions problem on the phone screen, then "Design hit counter" in a four-interview onsite (CF-C11, 2025, mid-level);
  - a HackerRank test announced in 2024 (CF-C6); a second-round HackerRank with LeetCode-style mediums (CF-C8, 2024, a remote CDE team);
  - a commenter's "Multiple choice + coding assessment." whose coding part was "a react project with 2 hours to completion" (CF-Cc3, 2024, role not stated).
- **Loop.** "orange cloud" behavioral, debugging discussion, system design, PM-focused interview, and an AI-assisted coding challenge inside a second hiring manager conversation (CF-C4, Austin, 2026-04). CF-C11's onsite (2025, mid-level) had coding, a system design on moving logs from edge data centers to a core data center without public cloud, a project retrospective and a 30-minute orange cloud interview. CF-C7 (T) describes the same blocks with lengths: culture fit 30 minutes, PM 45, debugging 45, system design 60, AI-assisted coding 45.
- **End.**
  - A call with a senior executive, cofounder or CXO, and an office visit (CF-C4; CF-C7 T; announced in CF-C6).
  - CF-C2 was told the hiring manager would discuss team fit and the recruiter would run an offer round.
- **2025 and 2026 loop lists (added 2026-11-11).**
  - "Then the loop will be 5 rounds: System Design, Coding, PM, Orange Cloud, and another one with HM." (CF-Cc6, 2026).
  - "Recruiter mentioned 4 rounds : orange cloud, backend coding, system design and product" (CF-Cp8, 2026, a backend role in Austin).
  - "I have final loop with cloudflare and looks like there 5 rounds with 3 behavioural" (CF-Cp9, 2025).
  - In India the loop is longer: "There are extra behavioral and project discussion rounds on top of these 5 rounds." (CF-Cc7). A 2026 Bangalore senior loop had:
    - a 30-minute hiring manager round;
    - two design rounds of 90 and 60 minutes;
    - a 90-minute debugging and code review round;
    - a 45-minute senior leadership round on how the candidate uses AI coding tools;
    - a C-suite round (CF-C49).
  - Panels can be packed together: "had 3 in one day and 2 the next day" (CF-C48, 2024).
  - Officially, each interviewer covers "two to three focus areas" from an interview plan (CF-O16, 2021).
- **Coding round formats (added 2026-11-11).**
  - A 45-minute HackerRank "pair programming" round for senior roles (CF-Cp15, CF-Cp17).
  - Descriptions differ: "It is not LC style, more of an elaborate real-world programming exercise." (CF-Cc21), against "LC easy-medium array based" (CF-Cc28).
  - A Cloudflare employee: "The first coding round is generally a leetcode medium of some kind." (CF-Cc20).
  - Candidates use their own environment: "You share your screen and use your own IDE and it’s open book" (CF-Cc22); "If you plan on using JS, have node, etc ready to go, things like that." (CF-Cc27, a Cloudflare badge, 2023). CF-C1's app round also asked for npm, nvm and React to be installed first.
- **Length.**
  - "All cloudflare interviews are very long. 90 days easily." (CF-Cc9, Cloudflare badge, 2026);
  - "about 8 interviews ... over 2 weeks" when pushed (CF-Cc1, Cloudflare badge, 2024);
  - "within 8 days" before the result (CF3);
  - "maybe around a week or two" (CF5, 2023);
  - more than two months from application to the first interview (CF-C2).

### Early career (CF17, CF19 to CF23, CF30, CF31)

- From 2020 to 2023, intern, new graduate and some software-engineer applications started with a build on Cloudflare's own platform:
  - a serverless website and an HTTP tool (CF23, 2020);
  - a JSON API and a static HTML page (CF22, 2020);
  - a React clone of Facebook's core features with a backend API (CF21, 2021);
  - "Implement the front-end and back-end using the Cloudflare platform." (CF19, 2021);
  - front-end, back-end and auth services deployed on Cloudflare (CF17, 2023).
- Later stages:
  - a hiring manager screen, pair programming and HR (CF17);
  - pair programming questions over video (CF30, 2025);
  - an HTTP-requests coding interview (CF31, 2023).
- **Official, 2020.** The 2020 assignment replaced timed coding exercises. It "was designed specifically to be a little past beginner JavaScript", and applicants "struggled the most" with clean code (CF-O5). The briefs are public (CF-OG1, CF-OG2).
- **Official, 2026.** The Software Engineering internship fast-tracks candidates who submit "an assignment to build a type of AI-powered application on Cloudflare", and "Our interview process will take 3-4 weeks." (CF-O4). The 2027 intern application forms read on 2026-11-03 have no assignment question; they ask for an optional GitHub link.

### Older frontend accounts (2016 to 2022: CF6 to CF11)

- Recruiter-led starts:
  - a recruiter call about Cloudflare, the path into coding and the current role (CF7);
  - a recruiter's plan of hiring manager, take-home and a face-to-face interview in San Francisco (CF9, 2018);
  - a sample-code request (CF11, 2016).
- A full-stack web phone screen about a past project's architecture (CF8).
- Rejection after the first round (CF6).

### Levels, locations and work model

- **Levels.** No frontend account states a level; CF-C1 has about eight years of experience, and CF-C11 calls its role "mid-level". The open posting is "Senior" (CF-P1); CF-C7 (T) is a senior fullstack account. CF-Cp2 names an "early-mid career" full-stack role.
- **Locations.**
  - Frontend accounts: United States (CF3, CF4, CF-C3), United Kingdom (CF2), Lisbon (CF1), Belgrade (CF5, web developer), Bengaluru (CF-C1, frontend-heavy full-stack).
  - Postings: Austin, New York, San Francisco (CF-P1).
- **Work model.**
  - "Most teams at Cloudflare are hybrid, but some teams can go remote with manager approval, which is pretty appealing." (CF-C5, 2025).
  - CF-P1 is Hybrid and may ask offer-stage candidates for an in-person interview.

## Reported questions

The question list applies the frontend-only rule of 2026-11-12; the subsections below still record every reported question as evidence, including those the list leaves out.

### Coding and app tasks

- App round: "Given a React + TS app repo", "Mock UI + API already present", "Asked to implement 4 frontend tasks"; "AI tools" not allowed [CF-C1, 2025-12, one hour; the tasks are not named]
- "One technical task involved TypeScript, specifically creating a type for a JSON object." [CF1, 2025-05*, Frontend Engineer, Lisbon]
- "Other tasks focused on debugging and solving small problems." [CF1]
- "several live coding and architecture or system design exercises" [CF-C3, 2026-02, Frontend Engineer; no task named]
- "These included two technical assessments—one at home and another as a pair programming exercise." [CF2, 2025-03-12; no task named]
- Corroboration (T): "They gave me a React + TS app with a UI and API already built" and "asked me to build out 4 extra features." [CF-C7, 2026-08, Senior Fullstack, London, in an "AI-assisted coding round, 45 mins:"]
- Commenter (c), role not stated: "The assessment for me was a react project with 2 hours to completion"; "The multiple choice could be things like what is the output of this function or something." [CF-Cc3, 2024]
- Generic loops: a partitions problem and "Design hit counter" [CF-C11, 2025-05, mid-level]; "a live coding round where I built a Battleship-style game" [CF-C4]; a key-value store "encrypted at rest" [CF-C5]; "Implementing an in-memory cache." [CF18]; "1 React" in a data team's phone screen [CF15]; a HackerRank round, "strictly leetcode type questions for this team. Mediums" [CF-C8, 2024]
- Official: HackerRank is "engaged by Cloudflare to administer coding tests to candidates" [CF-O3]
- Plan (p), 2020: "LC type or building out UI component?" [CF-Cp3]; no answer

### Debugging

- "One challenge was debugging an issue in a React app." [CF1]
- "a debugging discussion" [CF-C4]; "I used prompts to fix bugs in a project and environment I wasn't fully familiar with." [CF-C4, AI-assisted]
- Announced: "Technical round (one hour of pair coding, focused on debugging and problem solving" [CF-C2]; hiring manager question "What is your methodology when debugging or when something goes wrong?" [CF-C2]
- Corroboration (T): "They gave me a codebase which was describing a HTTP server but the routing was broken" [CF-C7]
- Posting: "Experience debugging, optimizing and identifying failure modes in large-scale frontend applications." [CF-P1]

### JavaScript screen

- "A basic coding question that should be solved without using loops."; "There was a small extension too." [CF-C1, 2025-12, 45 minutes; the question itself is not given]
- "Technical screen - vanilla JS promises" [CF12, 2025-07-12, Software Engineer]

### Web and network fundamentals

- "what happens when you enter a link in your browser and press enter" [CF13, 2024-12*, in the engineering manager round]
- "Describe what happens after your search for a website on the internet (internet protocols)." [CF14, 2024-09-18, team manager round]
- "Describe how an internet request works (round trip)." [CF28, 2025-01*]
- "Explain DNS."; "Tell me the differences between HTTP and HTTPS."; "Explain the TCP/IP protocol." [CF25, 2024-11*, a hiring manager round]
- "Describe the process of DNS resolution." [CF26, 2024-08*]; "DNS related deep questions and encryption keys" [CF27, 2025-09*]
- "mainly focused on internet-related knowledge (HTTP/HTTPS/DNS, etc.), no coding." [CF24, 2024-08*, phone screen]
- "Basic questions about browsers, DNS, routing, etc." [CF16, 2023-10*]
- "Design communication mechanisms for a CDN." [CF30, 2025-05-29, graduate]; "Topics included HTTP status codes, sending requests, and schedulers." [CF31, 2023-10-17, intern]
- Take-home: "Perform a TLS handshake with a Cloudflare worker service and decrypt the response, which contained a link to a Google form." [CF29, 2023-03*]

### System design

- Frontend: "architecture or system design exercises"; the candidate had to "redo the system design interview online." [CF-C3, 2026-02]
- Frontend-heavy: "Interviewer picked projects from my resume" and "Deep dive into architecture, decisions, tradeoffs" [CF-C1, 2025-12, one hour]
- Generic: "a system design conversation" [CF-C4]; moving logs from edge data centers to a core data center, with "Encryption at rest and transit", on premises "(meaning no AWS, no GCP)" [CF-C11, 2025-05]; "Also, do a system design for a Message Authentication Code system in 10 minutes, without a whiteboard, and over the phone." [CF29]; "How would you design a system to handle using Cloudflare services?" [CF33]
- Corroboration (T): "I was asked to design an Instagram for cats." [CF-C7]
- Past projects: "We discussed a large project and the architecture that I chose to use." [CF8, 2018-11*, phone screen]; a project retrospective: "You need to do a deep dive into the architecture." [CF-C11, 2025-05]

### Hiring manager, values ("orange cloud") and PM rounds

- Hiring manager [CF-C1, 30 minutes]: "Mostly resume walkthrough", with "What I do in my current role", "My projects and responsibilities" and "Whether my experience matched what they were looking for".
- Hiring manager [CF-C2]: "Why Cloudflare"; "Do you have any experience using Cloudflare products?"; "Introduce a recent project"; "Technical details of the project"; "Have you ever contributed to any production code?"; "Have you ever done any code reviews?"; "How do you resolve conflicts during code reviews?"
- Recruiter, 2021 [CF7]: "What I knew about Cloudflare."; "How I got into coding."; "Tell me about the project you're currently working on."
- Behavioral: "Tell me about a time in which you took a 'step' outside the norm of your workplace." [CF13]; "Tell me about the types of projects you've worked on." [CF2]; "Describe how to solve a difficult problem." [CF6]
- Values: "Tell me about a mistake you made and what you learned", "Something you learned outside your work" and "Fun/challenging situations in your career" in a 30-minute "Orange Cloud Round (Behavioral)" [CF-C1, 2025-12]; "Pretty standard, tell me about a situation questions. It's only 30 mins." [CF-C11, 2025-05]; an "orange cloud" behavioral interview [CF-C3, CF-C4]; three behavioral calls in a five-call onsite [CF3]
- Official: the executive calls include "our Orange Cloud Interview focused on the behaviors we value." [CF-O1]. The same page lists the behaviors it values as "Cloudflare Capabilities": "Be curious to learn and grow", "Communicate clearly and transparently", "Do the right thing", "Embrace diversity", "Get your work across the finish line", "Lead with empathy" [CF-O1]. That the Orange Cloud Interview scores these six is our reading, not a statement on the page.
- PM: "PM and cross collaboration rounds" [CF-C3]; "a PM-focused interview" [CF-C4]; corroboration (T): "questions focused on collaboration with other PMs," [CF-C7]
- Executive: "a final C-level executive conversation about why I wanted the job and why I would be a good fit." [CF-C3]; "a final call with a senior executive or cofounder." [CF-C4]
- Designer: "After that, an interview with a designer." [CF5, 2023-01*, Web Developer, Belgrade]

### Take-home and early-career assignments

- Frontend: "one at home" [CF2, 2025]; "Take-home exercise." announced by the recruiter [CF9, 2018]
- Early career and generic, all on Cloudflare's platform: CF17, CF19, CF21, CF22, CF23 (see Early career); CF29's TLS take-home.
- Official briefs: "Using Cloudflare Workers, you'll deploy an application that will randomly send users to one of two webpages." [CF-OG1, 2020]; "In this exercise, you'll deploy a Cloudflare Workers project in order to build a linktree-style website." [CF-OG2, 2020]; the 2026 internship's AI-app assignment [CF-O4]
- Official, 2019: "We put people through on average 8 interviews and a pair programming exercise." [CF-O7]

## The question list (added 2026-11-11)

Every distinct question or task that a source attributes to Cloudflare, one row each. Two accounts count as one question only when they describe the same task. Each row gives the round as the source names it ("Round not stated" when it does not), the role and date, and the sources; the quotes are in the Sources tables and under Reported questions. Frontend rows come first. Since 2026-11-12 a row stays only when the question itself is frontend or general (behavioral questions, algorithms, debugging method), whoever was asked; backend, network, infrastructure and security questions are left out, and Count lists the removed rows. Catalog entries follow the mapping proposal below.

### A. Frontend and app tasks

| # | question or task | round | role, date | sources | catalog |
|---|---|---|---|---|---|
| Q1 | Implement four frontend tasks in a React and TypeScript repository whose mock UI and API are in place, in one hour; search and docs allowed, AI tools not | app coding round, 60 min | frontend-heavy full-stack, Bengaluru, 2025-12; corroboration: senior full-stack, London, 2026-08, AI allowed | CF-C1; CF-C7 (T) | gap 3, closed 2026-11-18; link `react-webhook-deliveries-four-tasks` (premium, built for this row; `react-fetch-list-states` stays the free neighbour) |
| Q2 | Write a TypeScript type for a JSON object | technical stage | Frontend Engineer, Lisbon, 2025-05* | CF1 | gap 1 |
| Q3 | Debug an issue in a React app | technical stage | Frontend Engineer, Lisbon, 2025-05* | CF1 | `react-debug-api-misuse`, `js-debug-async-race` |
| Q4 | A React project in two hours, after multiple-choice questions on what code outputs | assessment | role not stated, 2024 | CF-Cc3 | link `react-webhook-deliveries-four-tasks` (since 2026-11-18; was `react-fetch-list-states`) |
| Q5 | A basic JavaScript question solved without loops, then a small extension | JavaScript phone screen, 45 min | frontend-heavy full-stack, Bengaluru, 2025-12 | CF-C1 | links `js-flatten-once`, `js-sum-numbers` |
| Q6 | Vanilla JavaScript promises | technical screen | Software Engineer, United States, 2025-07 | CF12 | `js-promises-async-await` (trivia) |

Not shared by the account: live coding and architecture exercises (CF-C3, 2026); an at-home assessment and a pair programming exercise (CF2, 2025); one React question in a data team's phone screen (CF15, 2024).

### B. Web fundamentals (often in the hiring manager or first round)

| # | question or task | round | role, date | sources | catalog |
|---|---|---|---|---|---|
| Q7 | What happens when you enter a link and press enter; how an internet request works, end to end | hiring manager or first round | software engineers, Germany 2024-12*, Portugal 2024-09, Kansas City 2025-01*; a hiring manager round in 2025-08 (c) | CF13, CF14, CF28, CF-Cc4 | `html-parsing-rendering` (part); gap 2 |
| Q8 | Explain DNS and DNS resolution | hiring manager round, phone screen | software engineers, 2024 to 2025; a systems role, 2023 | CF25, CF26, CF27, CF24, CF-Cc4, CF-C27 | gap 2 |
| Q9 | HTTP versus HTTPS | hiring manager round, phone screen | software engineers, 2024 to 2025 | CF25, CF24, CF-Cc4 | `http-caching-basics` (part) |
| Q11 | Basic questions about browsers, DNS and routing | Round not stated | software engineer, 2023-10* | CF16 | none |
| Q12 | HTTP status codes, sending requests and schedulers | intern coding interview | 2023-10 | CF31 | none |

### C. System design

| # | question or task | round | role, date | sources | catalog |
|---|---|---|---|---|---|
| Q15 | System design on projects from your résumé: architecture, decisions, trade-offs and improvements | system design, 60 min | frontend-heavy full-stack, Bengaluru, 2025-12 | CF-C1 | none |
| Q19 | Design Twitter | system design | software engineer, remote US, 2024-07 | CF-C12 | none |
| Q24 | Design an Instagram for cats | system design, 60 min | senior full-stack, London, 2026-08 | CF-C7 (T) | none |

Not shared by the account: frontend architecture or system design exercises (CF-C3, 2026); a project deep dive plus system design (CF-C25, 2024); a system design question for a new graduate (CF-C30, 2024).

Q19 and Q24 are product prompts that frontend system design rounds also use; neither account says whether its round was about the front end or the back end.

### D. Debugging and code review

| # | question or task | round | role, date | sources | catalog |
|---|---|---|---|---|---|
| Q25 | Review a code snippet and point out its gaps (the round's follow-up on debugging performance in a distributed system is left out) | debugging and code review, 90 min | senior software engineer, Bangalore, 2026-03 | CF-C49 | link `react-debug-api-misuse` |
| Q26 | Fix bugs with AI prompts in an unfamiliar project | AI-assisted coding | software engineer, Austin, 2026-04 | CF-C4 | none |
| Q28 | A bug, and how you would debug it (the round's deadlock questions are left out) | technical round | software engineer, 2024-04 (c) | CF-Cc31 | none |
| Q29 | Your method when debugging or when something goes wrong | hiring manager | software engineering intern, 2025-12 | CF-C2 | none |

CF1's React debugging task is Q3.

### E. Algorithms and general coding

| # | question or task | round | role, date | sources | catalog |
|---|---|---|---|---|---|
| Q31 | Design a hit counter | onsite coding; Round not stated (c) | 2025-05; 2025-04 | CF-C11, CF-Cc24 | none |
| Q32 | The fewest partitions that hold all the used data | phone screen | mid-level software engineer, 2025-05 | CF-C11 | none |
| Q33 | 3Sum, extended to 4Sum | phone screen | software engineers, 2024 | CF-C12, CF24 | link `js-three-sum` |
| Q34 | A stack with push, pop and increment ("Super Stack") | technical screen, R2 team | 2025-01 | CF-C37, CF-Cc13 | link `js-stack-queue-implementation` |
| Q36 | An in-memory cache | Round not stated | software engineer, 2022-06 | CF18 | `js-create-lru-cache` (pinned, link) |
| Q37 | A Battleship-style game | live coding | software engineer, Austin, 2026-04 | CF-C4 | none |
| Q38 | An interval problem like meeting rooms | phone screen | software engineer, 2024 Q2 | CF-C24 | none |
| Q40 | Build a circular buffer; parse JSON in Python | graduate pair programming | 2025-05 | CF30 | none |
| Q41 | One medium and one hard problem, explained without code | phone screen | software engineer, 2025 Q4 | CF-C17 | none |
| Q42 | HackerRank problems in a LeetCode style (not shared) | HackerRank round | 2024; 2025-06 | CF-C8, CF-C40 | none |
| Q43 | A vague "Implement X" prompt in an empty IDE | coding | 2026-01 | CF-C36 | none |

### F. Hiring manager, Orange Cloud, product and executive conversations

| # | question or task | round | role, date | sources | catalog |
|---|---|---|---|---|---|
| Q44 | Why Cloudflare; which Cloudflare products you have used; what you know about Cloudflare | hiring manager or recruiter | 2021 to 2025 | CF-C2, CF7, CF-C23, CF-C28, CF39 | behavioral guide |
| Q45 | A résumé walkthrough: your current role, projects and responsibilities, and whether your experience fits | hiring manager, often 30 min | 2024 to 2026 | CF-C1, CF-C47, CF-C48, CF-C49 | none |
| Q46 | A recent project in technical depth; production code; code reviews and how you resolve conflicts in them | hiring manager | software engineering intern, 2025-12 | CF-C2 | none |
| Q47 | A mistake you made and what you learned | Orange Cloud, 30 min | frontend-heavy full-stack, 2025-12 | CF-C1 | behavioral guide |
| Q48 | Something you learned outside your work | Orange Cloud, 30 min | frontend-heavy full-stack, 2025-12 | CF-C1 | behavioral guide |
| Q49 | Fun or challenging situations in your career | Orange Cloud, 30 min | frontend-heavy full-stack, 2025-12 | CF-C1 | behavioral guide |
| Q50 | Scenario questions (three in one round; "tell me about a situation" questions; scripted behavioral questions) | Orange Cloud | 2024-02; 2025-05; a SOC engineer, 2024-02 | CF-C39, CF-C11, CF35 | behavioral guide |
| Q51 | A time you took a step outside the norm of your workplace | Round not stated | software engineer, Germany, 2024-12* | CF13 | behavioral guide |
| Q52 | The types of projects you have worked on; how you solve a difficult problem | Round not stated | 2025-03; 2022-08 | CF2, CF6 | behavioral guide |
| Q53 | How you work with product and PMs | PM or product round | 2020 to 2026 | CF-Cc5, CF-C3, CF-C4, CF-C16, CF-C18; CF-C7 (T) | gap 6 |
| Q54 | How you use GenAI and coding agents day to day, which tools, and their shortcomings | senior leadership round, 45 min | senior software engineer, Bangalore, 2026-03 | CF-C49 | gap 9 |
| Q55 | Why you want the job and why you are a good fit | C-level call | Frontend Engineer, United States, 2026-02 | CF-C3 | none |
| Q56 | Tell me about yourself; an accomplishment you are most proud of | Round not stated (official advice, not a report) | Cloudflare TV, 2020 | CF-O13 (S) | behavioral guide |

### G. Early career and take-homes

| # | question or task | round | role, date | sources | catalog |
|---|---|---|---|---|---|
| Q57 | Build on Cloudflare's platform: a Workers site and an HTTP tool, a JSON API and a static page, a React front end with an API, front-end, back-end and auth services; in 2026, an AI app on Cloudflare | application assignment | interns and new graduates, 2020 to 2023; 2026 | CF17, CF19, CF21, CF22, CF23, CF-O4 | none |

### Count

- **Rows:** 43 since 2026-11-12 (58 before the frontend-only rule):
  - A, frontend and app tasks: 6;
  - B, web fundamentals: 5;
  - C, system design: 3;
  - D, debugging and code review: 4;
  - E, algorithms and general coding: 11;
  - F, conversations: 13;
  - G, early career and take-homes: 1.
- **By content:**
  - 12 rows are frontend questions: the app and JavaScript tasks (Q1 to Q6), the web fundamentals (Q7 to Q9, Q11, Q12) and the platform builds with a front end (Q57, mixed with back-end parts). Four of them come from frontend or frontend-heavy accounts (Q1, Q2, Q3, Q5).
  - 31 rows are general: three system design rows (Q15 on your own projects; Q19 and Q24, product prompts whose accounts do not say front end or back end), four debugging rows, eleven algorithm and coding rows and thirteen conversations.
- **Removed on 2026-11-12 (backend, network, infrastructure and security questions), fifteen rows:**
  - network: TCP/IP, TCP versus UDP and sockets (Q10); communication mechanisms for a CDN (Q13); a TLS handshake take-home (Q14); a fan-out over sockets (Q39);
  - backend system design: a batch system that summarises tickets with an LLM (Q16), a scheduled HTTP pinger (Q17), logs moved between data centers (Q18), data streaming at Cloudflare scale (Q20), tail latency in a distributed system (Q21), a Message Authentication Code system (Q22), a system on Cloudflare services and a domain flow with distributed follow-ups (Q23);
  - backend coding and debugging: an HTTP server whose routing is broken (Q27), the rate limiter (Q30), a key-value store encrypted at rest (Q35), the Zaraz team's serverless take-home (Q58);
  - trimmed: the distributed-system follow-up in Q25 and the deadlock questions in Q28.
- **Most repeated:** the web fundamentals (Q7 to Q9: nine accounts), the PM or product round (Q53: nine sources) and why Cloudflare (Q44: five).
- **Gaps for a page:** no row names the app round's four tasks. The Orange Cloud scenarios in Q50 are not shared.

## Official pages (read 2026-11-03)

The pages and quotes are listed under Sources: CF-O1 to CF-O11, CF-OG1, CF-OG2, and CF-P1 to CF-P4.

**What they settle:**
- The current process: the five steps on the careers page, with the Orange Cloud Interview inside the executive calls (CF-O1).
- Coding tests are run on HackerRank (CF-O3).
- Offer-stage candidates may be asked to interview in person (every posting).
- An executive meets every final-stage candidate before an offer (CF-O8, 2023; also CF-O10 and CF-O11).
- The 2026 internship has an AI-app fast track and a 3-4 week process (CF-O4).

**What they do not settle:** any frontend-specific stage, a take-home for experienced hires, round lengths, a rule on candidates using AI, and a reapply rule.

## Comparison with the other 30 company pages

The other pages were read from the repository on 2026-11-03.

**Not refreshed on 2026-11-11.** Since 2026-11-03 other guides gained company-specific practice tasks, timed rehearsals and round decoders (for example CrowdStrike, Agoda, Airbnb, GitLab and Stripe), so this comparison understates what a new guide needs; re-read the pages before building. Rows below changed on 2026-11-11 only where CF-C1 or CF-C11 add evidence.

- **Stage names:** all 30 process tables in `company-interview-processes.ts`. The stage types were grouped by keyword, so the counts are approximate.
- **Per-page facts:** from `reports/sirket-sayfalari-envanteri-2026-11-02.md`.

### Process steps

| Stage type | Tables with it (of 30) | Cloudflare evidence | Status for Cloudflare |
|---|---|---|---|
| Recruiter or HR call | 29 | official: initial conversations with a recruiter (CF-O1); CF1 (HR first), CF5, CF7, CF9; CF-C5 (HR after the hiring manager) | present, official |
| Hiring manager | 16 | the first conversation in CF2, CF3, CF-C2, CF-C3, CF-C4, CF-C5; CF13 (engineering manager); CF-C7 (T); official: team panel interviews with "your prospective manager and peers" (CF-O1) | present, and earlier than on most pages |
| Online assessment | 19 | frontend-titled accounts: none. Engineering: HackerRank rounds (CF-C6 announced, CF-C8), a multiple-choice test and a two-hour React project (CF-Cc3, role not stated), a coding challenge (CF16, 2023), a network and security test (CF20, 2021). Official: HackerRank runs coding tests (CF-O3) | official for engineering; not reported in a frontend-titled account |
| Technical or phone screen | 20 | CF-C1 (a 45-minute JavaScript screen), CF3 (technical interview), CF12 (vanilla JS promises), CF-Cc2 (engineer screen); generic: CF-C11 | present |
| Live, UI or machine coding | 17 | CF-C1 (a one-hour React and TypeScript app round with four tasks; F since 2026-11-11), CF-C3 (live coding), CF2 (pair programming), CF1 (small problems); generic: CF-C4; CF-C7 (T) | present; the format is documented in an F source, the tasks are not named |
| JavaScript and web fundamentals | 9 | CF12 (promises); web and network fundamentals in 16 generic accounts | present, and network-heavy |
| Algorithms | 8 | frontend: none. Generic: LeetCode medium (CF15), 3Sum (CF24; corrected on 2026-11-11, CF26 does not name it), 3Sum extended to 4Sum (CF-C12), in-memory cache (CF18), a partitions problem and a hit counter (CF-C11, 2025); "Leetcode medium to hard" (CF-Cp2 reply) | missing for frontend |
| Frontend system design | 19 | CF-C3 (architecture or system design, no prompt named); CF-C1 (one hour on the candidate's own projects); generic prompts only | present, without a named frontend prompt |
| Take-home and review | 6 | CF2 (at home, 2025), CF9 (announced, 2018); official internship assignments (CF-O5 for 2020, CF-O4 for 2026) | single report for experienced frontend hires; no review round |
| Debugging round | 1 (Stripe) | CF1 (React app), CF-C4, CF-C2 (announced), CF-C7 (T); CF-C49 (a 90-minute debugging and code review round, 2026), CF-Cc31 (a bug to debug, 2024) | present; candidate signature round |
| Behavioural or values | 18 | official: the Orange Cloud Interview (CF-O1); CF-C1 and CF-C11 (30 minutes; CF-C1 names three question types); CF3 (three calls), "orange cloud" (CF-C3, CF-C4), culture fit (CF-C7, T) | present, official, a named round with search demand |
| PM or cross-functional round | 0 | CF-C3, CF-C4, CF-C16, CF-C18, CF-Cc5; plans CF-Cc6, CF-Cp8, CF-Cp9; CF-C7 (T) | Cloudflare only; no other page has this stage; nine sources since 2020 |
| Executive conversation | 0 | official: executive calls (CF-O1), an executive leader meets every final-stage candidate (CF-O8); CF-C3 (C-level), CF-C4 (senior executive or cofounder), CF-C7 (CXO, T), CF-C6 (announced); since 2026-11-11: officially a 20-minute C-level interview for every hire (CF-O12, S, 2025), a C-suite round in 2026 (CF-C49; CF-C35, India), VP and CEO calls (CF36, 2022), a CTO chat (CF37, 2024) | Cloudflare only, official |
| Designer interview | 0 | CF5 (Web Developer, 2023) | single report |
| AI-assisted coding | 2 (Intuit, OpenAI) | CF-C4 (2026), CF-C7 (T); CF-C1's 2025 app round did not allow AI tools; a 2026 senior leadership round on how the candidate uses AI coding tools (CF-C49) | generic loops only |
| Office visit or in-person stage | 0 | CF-C4, CF-C7 (T); official: CF-P1 | present (official sentence) |
| Team match | 8 | CF-C2 (announced), CF13 (a round with the team) | generic hint only |
| Decision or result | 8 | CF2 (withdrew), CF3 (generic rejection after three weeks of follow-ups), CF-C3 (cut off), CF-C1 (rejected after two of four app tasks), CF-C11 (a no-hire for system design) | present |

### Facts the other pages show

| Fact | On other pages | Cloudflare | Status |
|---|---|---|---|
| Total duration | 8 of 29 tables | CF-Cc9 (Cloudflare badge, 2026): "90 days easily"; CF3 "within 8 days" plus three weeks to the result; CF5 "around a week or two"; CF-Cc1 "over 2 weeks"; CF-C2 two months before the first interview; official: "We move quickly once we've found the right person." (CF-O1) and "Our interview process will take 3-4 weeks." (internship, CF-O4) | available |
| Round durations | 83 of 238 rows | CF-C1 (frontend-heavy): 30, 45, 30, 60 and 60 minutes; CF-C11 "It's only 30 mins." (orange cloud); CF14 "around 20 minutes" (manager round, generic); CF-C2 "one hour of pair coding" (announced, generic); CF-C7 (T) | available from one frontend-heavy account |
| Number of rounds | many tables | CF-Cc6 (2026): five rounds after the coding screen; CF-C35 (India, 2026): more than seven; CF-C26 (2024): five panel interviews; CF2 "at least six more interview rounds" after the hiring manager; CF3 "5-call onsite"; CF-Cc1 "about 8 interviews"; official, 2019: "on average 8 interviews and a pair programming exercise" (CF-O7) | available |
| Official process page | 28 of 30 pages have official guide rows | the careers page's five steps (CF-O1), the candidate privacy notice (CF-O3), the 2026 internship post (CF-O4) | available |
| Interview AI rule | official on some pages (CrowdStrike, GitLab) | reports: AI allowed in 2026 AI-assisted rounds (CF-C4; CF-C7 T) and with the interviewer's OK (CF-C5); "AI tools" not allowed in CF-C1's 2025 app round; a 2026 leadership round asked how the candidate uses AI coding tools (CF-C49). Official: none for candidates; the privacy notice covers AI that ranks candidates (CF-O3) | reports conflict; no official rule |
| Reapply or cooling-off | official on Google, GitLab, Spotify, Capital One | NOT FOUND | missing |
| Levels | named on some tables | no frontend account states a level; CF-C1 has about eight years of experience; posting Senior | missing |
| NDA | rare | CF3 "You have to sign an NDA, so you can't post questions." | explains the thin question list |
| Work model | some pages | CF-C5 (hybrid, remote with manager approval); CF-P1 Hybrid | available |

### Question families

| Family | Typical on other pages | Cloudflare | Status |
|---|---|---|---|
| React or UI build tasks | most pages | the app round's format in an F account (CF-C1) and a T account (CF-C7); live coding without a named task (CF-C3) | format documented; no named task |
| JavaScript utilities and promises | many pages | "vanilla JS promises" (CF12); a task to solve without loops (CF-C1) | thin |
| DOM and vanilla widgets | some | none | missing |
| CSS and layout | some | none | missing |
| Accessibility | some (CrowdStrike) | none | missing |
| Web security (XSS, CORS) | CrowdStrike, JPMorgan and others | none for frontend; generic TLS take-home (CF29) and encryption keys (CF27) | missing for frontend |
| Performance | some | none in reports; the posting asks for "optimizing" | missing |
| Frontend system design prompt | many (autocomplete, feeds, dashboards) | none named (CF-C3); two product prompts whose accounts do not say front end or back end: an Instagram for cats (CF-C7, T) and Design Twitter (CF-C12) | thin |
| Debugging | Stripe, ElevenLabs, Walmart (2026 assessment) | React app (CF1); bugs fixed with AI prompts (CF-C4); method question (CF-C2) | present |
| TypeScript typing | Agoda and xAI mention TypeScript | "creating a type for a JSON object" (CF1) | present |
| Web fundamentals | the URL question on CrowdStrike (CS9) | URL, DNS, HTTP versus HTTPS, request round trip, status codes (11 accounts); the TCP/IP, TLS and CDN questions are left out as network content since 2026-11-12 | present, the strongest Cloudflare theme |
| Company and product knowledge | rare | "Why Cloudflare", "Do you have any experience using Cloudflare products?" (CF-C2); "What I knew about Cloudflare." (CF7); "Make sure to understand CF as a product as well." (CF-Cc5); product knowledge in non-engineering loops (CF-C34) | present |
| Behavioral and values | most pages | the Orange Cloud round's examples: a mistake and what you learned, something learned outside work, challenging situations (CF-C1); three scenario questions (CF-C39); code-review conflicts, PM collaboration, executive "why" conversation | present |

### Page sections and plan data the other pages have

| Item | Other pages | What the Cloudflare evidence supports |
|---|---|---|
| Hero caveat | every authored guide | frontend reports are few; NDA; the loop shape comes partly from engineering accounts; the app task rests on T and U sources |
| Round spotlight | 9 pages | the Orange Cloud Interview: an official name (CF-O1), two 2026 reports (CF-C3, CF-C4), two 2025 reports that give its length and, in CF-C1, three question types, and its own search suggestions. This is the same shape as Revolut's Bar Raiser and Capital One's Power Day spotlights. Second choice: the debugging round (CF1, CF-C4) |
| Practice prompts | 4 to 7 per authored guide | five proposed below |
| Official guides table | 28 of 30 pages | rows for the careers page (CF-O1), the candidate privacy notice (CF-O3) and the 2026 internship post (CF-O4) |
| Process table | 30 of 30 pages | two variants proposed below |
| Signature round (directory) | 30 of 30 (`company-signatures.ts`) | proposed below |
| Plan entry and profile | 30 of 30 (`company-plan-rounds.ts`, `company-plan-profiles.ts`) | inputs below |
| 7-day plan and FAQ | every authored guide | can be written from this record |

## Proposed interview process tables

The registry rule holds: a stage cites only sources read in full. CF-C7 (T) and CF-C1 (U) are not cited.

**Variant 1: frontend engineers, 2024 to 2026 (CF-C3, CF-C1, CF1, CF2, CF3)**

Changed on 2026-11-11: CF-C1 (Bengaluru, a frontend-heavy full-stack role) joins the variant and gives the round lengths. Its loop has the same shape as the United States and European accounts.

| Stage | What happens | Who | Sources |
|---|---|---|---|
| Recruiter conversation | The official first step is a conversation with a recruiter about your background and the role; one 2025 loop opened with an HR interview before the technical stages | All | official CF-O1; CF1 |
| Hiring manager | The first conversation in most accounts, 30 minutes in one: a résumé walkthrough, your current role and projects, and whether your experience fits. Officially part of the team panel with "your prospective manager and peers" | All | official CF-O1; CF-C1, CF-C3, CF2, CF3 |
| JavaScript phone screen | 45 minutes on a basic JavaScript question to solve without loops, with a small extension (2025); a technical interview after the hiring manager call (2024) | Most candidates | CF-C1, CF3 |
| App coding and debugging | One hour on a React and TypeScript repository whose mock UI and API are already in place: implement four frontend tasks, with search and docs allowed and AI tools not allowed (2025). Other accounts name a TypeScript type for a JSON object, debugging an issue in a React app and small problems, or a pair programming exercise and an at-home assessment | All | CF-C1, CF-C3, CF1, CF2 |
| Architecture or system design | One hour on projects from your résumé: architecture, decisions, trade-offs and improvements (2025); architecture or system design exercises, one redone online (2026) | Most candidates | CF-C1, CF-C3 |
| Orange Cloud Interview | A 30-minute behavioral round on Cloudflare's values: a mistake and what you learned, something you learned outside work, challenging situations in your career (2025). Officially the executive calls include the Orange Cloud Interview, focused on "the behaviors we value" | Candidates who reach the panel | official CF-O1; CF-C1, CF-C3 |
| PM and executive conversations | Three behavioral calls in a five-call onsite (2024); PM and cross collaboration rounds and a final C-level conversation about why you want the job (2026). Officially an executive leader meets every final-stage candidate | Candidates who reach the end | official CF-O8; CF-C3, CF3 |
| Offer or result | Officially, an offer follows quickly and offer-stage candidates may be asked to interview in person; reports end with a rejection after an unfinished app round, a generic rejection after three weeks of follow-ups, or a withdrawal after hearing of six more rounds | All | official CF-O1, CF-P1; CF-C1, CF2, CF3 |

Proposed evidence labels (at most 28 characters; the component computes its own from the cited sources):

| Stage | Label |
|---|---|
| Recruiter conversation | Official page and 1 report |
| Hiring manager | Official page and 4 reports |
| JavaScript phone screen | 2 public reports, 2024–25 |
| App coding and debugging | 4 public reports, 2025–26 |
| Architecture or system design | 2 public reports, 2025–26 |
| Orange Cloud Interview | Official page and 2 reports |
| PM and executive conversations | Official page and 2 reports |
| Offer or result | Official pages and 3 reports |

**Variant 2: software engineers across teams, 2024 to 2026 (CF-C2, CF-C4, CF-C5, CF-C6, CF-C11; since the second question round also CF-C37, CF-C39, CF-C40, CF-C48, CF-C49)**

This variant shows the company loop that frontend candidates are likely to meet. It must be labelled as engineering-wide, not frontend-specific.

| Stage | What happens | Who | Sources |
|---|---|---|---|
| Hiring manager | Experience questions: why Cloudflare, Cloudflare products, a recent project, code reviews and conflicts, your debugging method; in one 2026 loop a 30-minute round that can end the process | All | CF-C2, CF-C4, CF-C5, CF-C6, CF-C48, CF-C49 |
| HR screen | One account had an HR screen about two weeks after the hiring manager | Some candidates | CF-C5 |
| Online test | A HackerRank coding test, the provider Cloudflare names for coding tests. One 2024 candidate had LeetCode-style mediums in a second-round HackerRank; another was told a HackerRank test came after the hiring manager; a 2025 candidate passed 7 of 11 tests in a HackerRank phone interview | Some teams | official CF-O3; CF-C6, CF-C8, CF-C40 |
| Technical round | One hour of pair coding on debugging and problem solving (announced); a live Battleship-style game; a phone-screen problem on fitting data into the fewest partitions; a stack with push, pop and increment for the R2 team (2025) | All | CF-C2, CF-C4, CF-C11, CF-C37 |
| Interview loop | An "orange cloud" behavioral interview, a debugging discussion, a system design conversation and a PM-focused interview; another onsite had coding (a hit counter), a system design round, a project retrospective and a 30-minute orange cloud interview; one orange cloud interview was three scenario questions (2024); a 2026 senior loop had two design rounds and a debugging and code review round | Candidates who pass the technical round | CF-C4, CF-C11, CF-C39, CF-C49 |
| Senior leadership round | 45 minutes on how you use GenAI and coding agents, which tools, and their shortcomings, although it was announced as behavioral | One 2026 account (senior, Bangalore) | CF-C49 |
| AI-assisted coding | Fixing bugs with prompts in an unfamiliar project, inside a second hiring manager conversation | One 2026 account | CF-C4 |
| Executive call and office visit | Officially, executive calls with senior leadership include the Orange Cloud Interview, and an executive leader meets every final-stage candidate. One 2026 account had a final call with a senior executive or cofounder after an office tour; offer-stage candidates may be asked to interview in person; a 2026 candidate was told a C-suite round follows the leadership round and that some candidates are not offered at that stage | Candidates who reach the end | official CF-O1, CF-O8, CF-P1; CF-C4, CF-C49 |
| Team fit and offer | The hiring manager discusses team fit, then a recruiter offer round (announced) | Candidates who pass | CF-C2 |

Proposed evidence labels:

| Stage | Label |
|---|---|
| Hiring manager | 6 public reports, 2024–26 |
| HR screen | One public report, 2025 |
| Online test | Official page and 3 reports |
| Technical round | 4 public reports, 2025–26 |
| Interview loop | 4 public reports, 2024–26 |
| Senior leadership round | One public report, 2026 |
| AI-assisted coding | One public report, 2026 |
| Executive call and office visit | Official pages and 2 reports |
| Team fit and offer | One report, announced |

**Variant 3: interns and new graduates (official CF-O4, CF-O5; CF17, CF21 to CF23, CF30)**

| Stage | What happens | Who | Sources |
|---|---|---|---|
| Application and assignment | The 2026 Software Engineering internship fast-tracks candidates who submit an AI-powered application built on Cloudflare. From 2020 to 2023 applications started with a build on Cloudflare's own platform, such as a Workers site or a React front end with an API | Interns and new graduates | official CF-O4, CF-O5; CF17, CF21, CF22, CF23 |
| Interviews | Officially a 3 to 4 week process (2026 internship). Reports name a hiring manager screen, a pair programming interview and an HR interview (2023 intern), and pair programming questions over video (2025 graduate) | Interns and new graduates | official CF-O4; CF17, CF30 |

Proposed evidence labels:

| Stage | Label |
|---|---|
| Application and assignment | Official pages and 4 reports |
| Interviews | Official page and 2 reports |

The intern evidence is mostly not frontend: the 2026 assignment is an AI app with a chat front end, and CF17's question was "Write a function in Go."

## Plan, signature and profile inputs (for the build step)

Proposals for `company-plan-rounds.ts`, `company-signatures.ts` and `company-plan-profiles.ts`; nothing is applied.

- **Plan lists.**
  - Variant 1: id `frontend`, `default: true`.
  - Variant 2: id `engineers`, with an `ask` such as `Interviewing for a non-frontend engineering team?`
  - Variant 3: id `early-career`, with an `ask` such as `Applying for an internship or a graduate role?`
  - No frontend account states a level, so Variants 1 and 2 do not set `reported`. Variant 3 could set `reported` to junior.
- **Round kinds:**
  - Variant 1 (stages as changed on 2026-11-11):
    - Recruiter conversation: `recruiter`.
    - Hiring manager: `people`.
    - JavaScript phone screen: `coding`.
    - App coding and debugging: `coding`.
    - Architecture or system design: `design`.
    - Orange Cloud Interview: `people`.
    - PM and executive conversations: `people`.
    - Offer or result: `outcome`.
  - Variant 2 adds HR screen (`recruiter`), Online test (`coding`), Technical round (`coding`), Interview loop (`people`, `coding`, `design`), AI-assisted coding (`coding`), Senior leadership round (`people`, added 2026-11-11), Executive call and office visit (`people`) and Team fit and offer (`outcome`).
  - Variant 3: Application and assignment (`coding`), Interviews (`coding`, `people`).
- **Signature round (directory).** `Orange Cloud Interview`. It is the company's own name for the round (CF-O1), it appears in 2025 and 2026 reports (CF-C1, CF-C11, CF-C3, CF-C4), and it has its own search suggestions. Fallback: `React and TypeScript app round`, the round candidates can practise in code (CF-C1; CF-C7 T).
- **Profile.** `framework: 'react'`, with evidence along these lines: the open frontend posting says "We primarily use Typescript and React.", one 2025 account debugged a React app and typed JSON in TypeScript, and another had a one-hour React and TypeScript app round (CF-C1). No aliases needed.

## Catalog mapping proposal (not applied)

Counts were read from `cdn/questions` on 2026-11-03.

- Sources are capped at 6 (`MAX_QUESTION_SOURCES`); trivia cannot carry sources.
- The pins are the 68 ids found in the backend authoring registries.
- No catalog item mentions Cloudflare yet.

The rules are the CrowdStrike record's:
- **Tag with a source:** an unpinned coding, debug or system-design item matching a task from a frontend-titled F report, with room under the cap.
- **Tag only:** a trivia item whose question is the reported question.
- **Link only:** everything else that helps.

### Tag with a source

| # | id | file | access | why it matches | source | sources now | pin |
|---|---|---|---|---|---|---|---|
| 1 | `react-debug-api-misuse` | cdn/questions/react/coding.json | premium | A React debugging exercise; CF1 names "debugging an issue in a React app". The note must say it practises React debugging, not the reported bug | CF1 | 2 (walmart) | unpinned |
| 2 | `js-debug-async-race` | cdn/questions/javascript/debug.json | free | A free debugging exercise. CF1 says "Other tasks focused on debugging and solving small problems." It is the page's free entry; the note must say the reported tasks are unnamed | CF1 | 3 (elevenlabs, stripe, gitlab) | unpinned |

Draft source entry, for both items (label 8 to 120 characters, note at most 280; `cloudflare` goes into `companies`):

```json
{
  "label": "Taro: Cloudflare frontend engineer interview, Lisbon, 2025",
  "url": "https://www.jointaro.com/interviews/companies/cloudflare/experiences/frontend-engineer-lisbon-lisbon-district-may-1-2025-no-offer-positive-fffe2762/",
  "company": "cloudflare",
  "publisher": "Taro",
  "date": "2025-05",
  "note": "After an HR interview, the technical stages included typing a JSON object in TypeScript, debugging an issue in a React app and small problems. This exercise practises debugging; it is not the reported task."
}
```

### Tag only (trivia)

These rest on generic software-engineer accounts, not frontend-titled ones. Since 2026-11-12 a question counts by its content, not by who was asked (the user's rule), so the three below qualify. The CDN item left with its question (Q13).

| # | id | file | supporting accounts | reported question |
|---|---|---|---|---|
| 1 | `html-parsing-rendering` | html/trivia.json | CF13, CF14, CF28 | what happens when you enter a link and press enter; a request round trip |
| 2 | `http-caching-basics` | javascript/trivia.json | CF24, CF25 | HTTP and HTTPS questions |
| 3 | `js-promises-async-await` | javascript/trivia.json | CF12 | "Technical screen - vanilla JS promises" |

### Link only

- **Live coding and the app round (CF-C1, F since 2026-11-11):** `react-fetch-list-states` (free; at the 6-source cap). Its free Interview Pressure Mode runs four timed rounds in 45 minutes on fetching, refreshing, the newest request and cancellation, the closest shape to "4 extra features" on an app with an API. On 2026-11-02 the user decided not to add Pressure Mode links to plan rows, so it is a guide link only. Also `react-autocomplete-search-starter` (free, at the cap). Since 2026-11-18, Q1 and Q4 link `react-webhook-deliveries-four-tasks` (premium; tagged `cloudflare` with CF-C1, CF-C3 and CF1 as sources): a webhook-deliveries console with a mock API and four tasks, seven catalog checks and a 60-minute Pressure Mode in four rounds (six checks, the runner's cap).
- **Debugging:** `react-debug-double-render` (premium, unpinned), the free `js-debug-*` exercises.
- **Algorithms (Q33, Q34, Q36; added 2026-11-11, changed 2026-11-12):** `js-three-sum` (premium), `js-stack-queue-implementation` (premium; a stack without the increment command), `js-create-lru-cache` (pinned). Links, not tags, because the tag rule asks for a frontend-titled report. The rate limiter (Q30) and its nearest item, `js-throttle`, left with the frontend-only rule.
- **The JavaScript screen without loops (CF-C1):** `js-flatten-once` and `js-sum-numbers` (free), `js-flatten-depth` (premium). The account does not name its question, so these are links, not tags.
- **Promises:** `js-promise-any`, `js-create-deferred-promise`, `js-retry-with-delay` (free coding), `js-promise-all` (premium), `js-promise-combinators-all-allsettled-race-any` (trivia).
- **Web fundamentals:** `js-secure-cors-handling`, `js-cookie-sessionstorage-localstorage`, `js-cookie-options`.
- **Design:** `infinite-scroll-list` (free system design), `component-design-system-architecture` (premium; the posting's design-engineer and component work).
- **Behavioral:** the behavioral guide, for the hiring manager, "orange cloud" and PM rounds.

### Skipped

- The Battleship game (CF-C4, generic; no matching item).
- The encrypted key-value store (CF-C5): backend, removed from the question list on 2026-11-12.
- The early-career platform assignments (CF17, CF19, CF21 to CF23: Cloudflare's own platform, 2020 to 2023).

### Gaps (missing questions: reported, with no matching item)

1. **TypeScript.** "creating a type for a JSON object" (CF1); the app round is in TypeScript (CF-C1). No catalog item asks for TypeScript types. Corrected 2026-11-12: the earlier wording said the catalog had no TypeScript item at all, but all 39 React coding items open in `App.tsx` and all 96 JavaScript coding items carry TypeScript tests, so the format can hold a TypeScript task.
2. **The URL question, end to end:** DNS, TCP and TLS, HTTP, the CDN cache, then parsing and rendering (CF13, CF14, CF16, CF24 to CF28). `html-parsing-rendering` and `http-caching-basics` each cover one part. The CrowdStrike record lists the same gap.
3. **Extending an existing React and TypeScript app** with a working UI and API under a clock (CF-C1 F, four tasks in one hour; CF-C3 live coding; CF-C7 T). Pressure Mode is the nearest; no item hands over a small codebase and asks for several features. Since CF-C1 this is the best-supported Cloudflare frontend gap. Closed 2026-11-18 by `react-webhook-deliveries-four-tasks` (premium): a small React and TypeScript console with an in-file mock API; task 1 request states with the newest request winning, task 2 narrowing an `unknown` payload (the legacy export holds five records with one bad field each), task 3 a status filter with a retry action, task 4 a planted stale-closure refresh bug. The tasks and data are ours; CF-C1 names none of the four.
4. **Debugging an unfamiliar codebase:** bugs fixed with AI prompts in an unfamiliar project (CF-C4). Our debug items are single functions or components. CF-C7's broken router in an HTTP server (T) is backend and left out since 2026-11-12.
5. **An AI-assisted coding round** (CF-C4; CF-C7 T).
6. **The Orange Cloud Interview, the PM round and the executive "why Cloudflare" conversation** (CF-O1; CF-C1, CF-C11, CF-C3, CF-C4; CF-C7 T). The behavioral guide has no section on Cloudflare's six behaviors and does not cover a PM interviewer. This is page copy rather than a catalog item.
7. **Cloudflare product knowledge** ("Do you have any experience using Cloudflare products?", CF-C2; CF7). Page copy, not a catalog item.
8. **Removed on 2026-11-12.** The rate limiter with rules (Q30) is a backend task, so it is no longer a gap for this page.
9. **Talking about AI coding tools** (added 2026-11-11): how you use them, which ones, and where they fall short (Q54: CF-C49). Page copy, not a catalog item.

## Practice prompts for the page (proposal)

Our own practice versions; none copies a reported task.

| # | title | statement | modelled on | links to |
|---|---|---|---|---|
| 1 | Add features to a React and TypeScript app against the clock | You get a small React and TypeScript app whose mock UI and API already work. Set the project up before the clock starts, then add four small features in one hour without AI tools, keep the app working after each one, and say what you would test. | CF-C1 (2025-12), CF-C3 (2026-02, live coding), CF1 (2025-05*); CF-C7 (T) only as context | `react-webhook-deliveries-four-tasks` (built 2026-11-18); `react-fetch-list-states` |
| 2 | Find the bug in a React app, then type the JSON it loads | A React screen shows wrong data. Find and fix the bug, explain how you found it, then write a TypeScript type for the JSON the screen loads. | CF1 (2025-05*) | `react-debug-api-misuse`, `js-debug-async-race` |
| 3 | What happens when you open a link, the Cloudflare way | Walk through DNS resolution, the TCP and TLS handshakes, the HTTP request and response, what a CDN cache changes, and how the browser parses and renders the page. | CF13 (2024-12*), CF14 (2024-09-18), CF25 (2024-11*), CF26 (2024-08*), CF28 (2025-01*) | `html-parsing-rendering`, `http-caching-basics`, `content-delivery-caching-strategies-streaming` |
| 4 | Prepare the Orange Cloud Interview and the PM round | Prepare one scenario story for each of the six behaviors Cloudflare lists, from being curious to learn and grow to leading with empathy, and have stories ready for a mistake you learned from, something you learned outside work and a hard situation in your career. Then answer the hiring manager's openers: why Cloudflare, which Cloudflare products you have used, a code review conflict and how you debug. Then give a collaboration story with a PM, and say how you use AI coding tools and where they fall short. | official CF-O1; CF-C1 (2025-12), CF-C39 (2024-02), CF-C11 (2025-05), CF-C2 (2025-12), CF-C3 (2026-02), CF-C4 (2026-04), CF-C49 (2026-03) | behavioral guide |
| 5 | Explain promises in a vanilla JavaScript screen | Explain how promises settle, how errors travel through a chain, and when you would use `Promise.all`, `allSettled` or `any`; then write a small helper with them. | CF12 (2025-07-12) | `js-promises-async-await`, `js-promise-any`, `js-create-deferred-promise` |
| 6 | Solve a JavaScript task without loops | In 45 minutes, solve a small array or object task with recursion or array methods instead of loops, then extend it when the interviewer adds a requirement. | CF-C1 (2025-12; the account does not give the question) | `js-flatten-once`, `js-sum-numbers`, `js-flatten-depth` |

## Open items

- **CF-C1 was read on 2026-11-11** through Claude in Chrome. It documents the app round's format but not its four tasks; a commenter's "What question was asked in machine coding??" has no answer on the page.
- **Official pages.**
  - The careers page, the privacy notice and the postings were read live.
  - Blog posts were read from Internet Archive captures (W), because blog.cloudflare.com answered HTTP 429.
  - That the `cloudflare-hiring` GitHub account is Cloudflare's rests on commit email domains only.
  - Frontend-specific official text: NOT FOUND.
- **What the Orange Cloud Interview asks.** Since 2026-11-11 two 2025 accounts give its length (30 minutes), CF-C1 gives three question types, CF-C39 reports three scenario questions without sharing them, and Cloudflare-badged commenters tie it to the capabilities and the STAR method (CF-Cc16). No source gives a rubric. Google suggests `orange cloud interview reddit`; Reddit was not attempted (our tools refuse it), so the user can paste those threads.
- **AI rule.**
  - The 2026 accounts describe AI-assisted rounds and AI allowed in a round (CF-C4; CF-C7 T).
  - CF-C1 (read 2026-11-11) says "AI tools" were not allowed in its 2025 app round.
  - No official rule for candidates; the privacy notice covers only AI that ranks candidates (CF-O3).
- **CF-Cc3's two-hour React project assessment.** The role is not stated. The poster asked whether it was a front-end position and no answer appears.
- **Thin frontend questions.** CF3 cites an NDA, and only CF1 names frontend tasks. Glassdoor (not opened by rule) may hold more.
- **No frontend level** in any account. The open posting is Senior and has been open since 2025-06-20, so it may be an evergreen posting. Whether Cloudflare is hiring frontend engineers actively: NOT FOUND beyond CF-P1.
- **CF-C7 authenticity.** A TechPrep community page that links TechPrep's own guides from inside the account; kept as T.
- **PracHub.** Accounts are user-submitted and edited by the site; CF-C3 and CF-C4 were published on the same day (2026-09-17).
- **Taro.** Rows are Glassdoor rewrites, and 18 of the 33 dates are month-only placeholders.
- **Independence.** CF-Cc2's link to Cloudflare is inferred from its place in the thread.
- **Not found:**
  - a Cloudflare frontend interview post on Medium, dev.to, Hashnode, Substack, GeeksforGeeks or LinkedIn;
  - a Hacker News comment describing a Cloudflare frontend or UI loop (18 Algolia queries);
  - a readable design-engineer, UI-engineer or web-developer loop after 2023;
  - a frontend take-home account from an experienced hire after 2021;
  - a repository of the four-feature React and TypeScript app.
  - X and YouTube were not searched.
- **Found, not read:**
  - EngineBogie 1230 (title only; its search summary matches CF-C1, so probably a copy);
  - interviewexperiences.in `Cloudflare SSE Bangalore March 2026` (by its title a different, 2026 account; not attempted on 2026-11-11).
  - LeetCode 6796944 was read on 2026-11-11 (CF-C11).
- **Left over from the second question round (2026-11-11).**
  - **Not opened (budget):**
    - Blind threads fzue6kgx, fophu04x, zsfz27qw, hipcebpb, 65a2d07m, 8onb6vrt, pwmbnidy, 8ev01g2t, wfgxpapw, c2glneqe, gf23jvoq, y5e48eto, qpkl1b7s, gwm8dm8w (PM candidates) and BB8jHsDd, and an India repost (eenvvnjb);
    - Blind listing pages 3 to 22;
    - the 2019 pstree.cc post;
    - two Cloudflare TV episodes ("Getting Started in Tech: Interviewing the Interview", "Story Time").
  - **Not unlocked:** the hidden parts of the 1point3acres threads, which need forum points.
  - **Checked, nothing on Cloudflare:** a LeetCode post on about forty senior frontend loops (7580886).
  - **Still not opened by rule:** Glassdoor. Reddit was not attempted.

## Verification

- **Method.** `check_quotes.py` (session scratchpad, git-excluded) extracts every phrase in straight double quotes from this file, after removing code spans and fenced blocks. It then searches for each phrase in the saved pages: Taro `.txt`, WebFetch returns, the posting text and the official-page notes. Whitespace, curly quotes, dashes and HTML entities are normalised; wording, case and punctuation are not. A quote cut with an ellipsis must have each part in the same file.
- **Result.** Last run on 2026-11-03, after the official pages and the community reader's last sources were added: 279 of 279 distinct quoted phrases (391 occurrences) found verbatim in the saved pages. Proposed stage names, classifier messages, search terms and plan strings are in backticks, so the script counts only source quotes.
- **Coverage of the check.**
  - Taro quotes were matched against the page data saved by curl.
  - Blind, PracHub and TechPrep quotes were matched against the WebFetch returns, which are sentence-level quotations, not raw HTML.
  - Official quotes were matched against the readers' raw saves, including Internet Archive captures for blog posts.
- **Follow-up, 2026-11-11.**
  - The saved pages and `check_quotes.py` of 2026-11-03 lived in a session scratchpad under `/private/tmp`. macOS's temporary-file cleanup deleted the files on 2026-11-08; the folders remain, empty. The 2026-11-03 result above stands as recorded but cannot be re-run, and every source cited on a page must be re-read at build time anyway.
  - The two LeetCode posts read on 2026-11-11 are saved under `research_notes/cloudflare-2026-11/raw/community/` (git-excluded). `research_notes/check_new_quotes_2026-11-11.mjs` takes every quoted phrase on a line that names CF-C1 or CF-C11 and searches the saves with the same normalisation as before. It found 51 of 78. The 27 others are quotes from older sources on the same lines (for example CF-C4, CF-C7 and CF-O1), which the lost saves verified on 2026-11-03. Every quote attributed to CF-C1 or CF-C11 was found.
  - The same 51 phrases were then searched on the live pages in Chrome: 34 of 34 on CF-C1 and 17 of 17 on CF-C11.
- **Second question round, 2026-11-11.**
  - **Script.** The checker now covers every id added that day: CF-C11 to CF-C49, CF-Cc4 to CF-Cc31, CF-Cp4 to CF-Cp20, CF34 to CF40 and CF-O12 to CF-O16. It found 319 of the 338 quoted phrases on those lines in the saves. The other 19 are quotes from older sources on the same lines (for example CF-P1, CF-C4, CF-C7 and CF-O3), which were verified on 2026-11-03.
  - **Live pages in Chrome:** all 62 LeetCode quotes (CF-C12 to CF-C14, CF-Cc4, CF-Cc5, CF-Cp4 to CF-Cp6, CF-C49) and all 34 1point3acres quotes were found. Two of the 1point3acres quotes needed the rendered page, which also showed that CF-C28's question reads "Why Cloudflare" in full.
  - **Community reader.** It checked its own 229 quotes against its saves, and the quotes copied into this record were checked again by the script. Blind and PracHub were not re-checked live, because Blind renders an empty page in the browser extension.
  - **Correction.** The re-sweep found one wrong claim from 2026-11-03: CF26 does not name 3Sum (see the Algorithms row under Comparison).

## Status

| Step | State | Date |
|---|---|---|
| Research record | written: Taro sweep, community and official passes, comparison and catalog proposal | 2026-11-03 |
| CF-C1 and CF-C11 (LeetCode) | read through Claude in Chrome and added | 2026-11-11 |
| Second question round: Taro re-sweep, LeetCode, 1point3acres, community reader, Cloudflare TV | done; The question list added (6 frontend and 52 company-wide rows) | 2026-11-11 |
| Frontend-only rule | fifteen backend, network, infrastructure and security rows removed and two trimmed; 43 rows remain; the process tables, catalog proposal and practice prompts follow the rule | 2026-11-12 |
| Orange Cloud questions beyond CF-C1 and CF-C39 (Reddit) | waiting for the user to paste threads, if wanted | |
| Catalog tags, guide, process table, plan entry | not started (the user asked for this record only) | |

## Guide build notes (2026-11-14)

Written while the guide's process entry and question list were built (plan: `reports/disney-cloudflare-sayfa-plani-2026-11-14.md`, step 2).

- **The 2026-11-11 correction was wrong.** CF26's Taro page lists, in its questions field, "Three Array Sum LeetCode problem." (the 2026-11-11 save, re-checked on 2026-11-14). CF26 therefore supports Q33 beside CF-C12 and CF24, and the guide cites it there.
- **Q56 has a candidate account.** CF35 (Taro, SOC engineer, 2024-02) lists "Tell me about yourself, please." The guide keeps the question as a behavioural row on CF35 alone; the Cloudflare TV advice (CF-O13) is not cited for it.
- **A row this list missed.** CF39 (Taro, software engineer, New York, 2025-10-27) lists "They asked how I would handle missing or inconsistent data when creating performance dashboards." The guide adds it as a product design row with no round.
- **CF-C1 is dated by its post, 2025-12;** its loop began with the hiring manager round in October 2025.
- **Re-read on 2026-11-14 and saved** under `research_notes/cloudflare-2026-11/raw/community/agent/`: CF-C2 to CF-C5 (PracHub, curated), CF-C6, CF-C8 with CF-Cc3, and CF-C47 with CF-Cc31 (Blind). CF-O1 and CF-O4 were re-read the same day (`research_notes/official-2026-11-14/raw/`).
- **Not cited by the guide, for want of a saved text:** CF-O3, CF-O5, CF-O8 and CF-P1.
- **The guide's counts:** 28 locked rows and 13 behavioural rows. Q24, Q38 and Q41 are left out for their sources (T, 1point3acres).
- **Format-only rows left the list (2026-11-15).** As on the Disney guide, rows that describe a round's format without a question or a topic moved into the stage table's text: the HackerRank problems of two 2024 to 2025 accounts (CF-C8, CF-C40; the Online test stage now says one team set LeetCode-style mediums) and the spoken "Implement X" prompt in an empty IDE (CF-C36; now in the Technical screen stage). The guide lists 26 questions and 12 behavioural rows.
