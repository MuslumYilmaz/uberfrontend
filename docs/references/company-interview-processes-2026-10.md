# Frontend interview processes for the remaining company pages (October 2026)

This document holds the research for the "Reported interview process" tables. The pilot tables for Amazon, Walmart and Tesla were built on 2026-10-20 (`f3de4efd`). Their execution notes are in `company-pages-plan-2026-10.md`.

This document covers the other 19 company pages, so each one can get a table without new research. Nothing here is on the site yet, and every new table still needs its own approval.

## How the research was done

- **Date and method.**
  - On 2026-10-20 five research agents, one per group of companies, read every source in full. The ways they read pages:
    - server HTML and page data: Taro's `__NEXT_DATA__` and Blind's payload, which carries every comment and badge;
    - LeetCode Discuss through GraphQL;
    - Medium through RSS;
    - JavaScript-rendered pages through Playwright;
    - Meta's PDF guides as extracted text.
  - The coordinating session then re-read the key quotes on their pages. The result of that check is listed under "Re-checked" for each company.
- **What counts as evidence:**
  - official company pages;
  - first-person accounts on Taro, Blind, LeetCode Discuss, Medium, dev.to, personal blogs, Code360 and enginebogie;
  - news, cited as news and never as an account.
- **What does not count:**
  - Glassdoor, 1point3acres, Reddit and Kununu;
  - templated or marketing guides: Prepfully, Dataford, interviewpal, techprep, jobrise, IGotAnOffer, Exponent, GreatFrontEnd and FrontendLead;
  - take-home briefs hosted on GitHub.
- **Reading rules** (as in the pilot):
  - **Taro dates.** A date on the 1st of a month is a placeholder and is marked `*`.
  - **Taro reposts.** Taro probably re-hosts Glassdoor reviews with a changed city and date. Several Taro texts match Glassdoor previews word for word. Never put a Taro city in a public label.
  - **Blind.** A poster's own account, a commenter's own account (`c`) and a plan written before the interview (`p`) are different evidence. Badges are noted where they matter.
  - **Multi-company posts.** Only the part about the target company is used.
- **Readiness labels:**
  - **Ready:** enough first-hand accounts agree on a shape.
  - **Ready, team-specific:** the stage types agree but the loop varies by team, and the table must say so.
  - **Thin:** an official page plus partial loops. A table would need "one account" labels on most rows.
- **Source ids.** Ids are local to this document. Official pages end in `-O1`, `-O2` and so on, and news in `-N1`. LeetCode posts are given as `LC <id>`; the URL is `https://leetcode.com/discuss/post/<id>/`.

## Summary

Account counts are first-hand accounts that describe stages, rounded. The table rows themselves are in each company's section.

**Status on 2026-10-20:** sourced tables are on the company pages for every company marked ready or team-specific. ServiceNow covers India only. Netflix, Airbnb, OpenAI, ElevenLabs and Waymo wait for more first-hand accounts.

| Company | Readiness | Official process page | Accounts | The loop in one line |
|---|---|---|---|---|
| Meta | Ready | FEE screen and full-loop guides | 11, 2020–2025 | Recruiter, a 45–60 minute JavaScript screen, then 4–6 interviews: JavaScript coding, UI architecture and design without code, behavioural |
| Uber | Ready | Frontend interview guide and a candidate story | 9, 2021–2026 | Recruiter, an online assessment, a 60-minute phone screen, then algorithms, frontend specialization, system design, collaboration and leadership |
| Intuit | Ready | Hiring process page | 15, 2021–2026 | Recruiter, a technical phone interview, a craft demonstration, assessor or technical rounds, an AI round (recent plans), the hiring manager |
| Datadog | Ready for Europe | Candidate experience page | 14, 2021–2025 | Recruiter, a CoderPad screen with two problems, React live coding, a harder coding round, frontend system design, experience and values, team match |
| Google | Ready | Generic pages (how we hire, interview tips) | 8 plus 4 older, 2019–2026 | Recruiter, one or two screens, 4–5 interviews (mostly DSA, usually one frontend round, Googleyness), frontend-leaning design from L5 |
| ByteDance and TikTok | Ready | Early-careers pages only | 9 plus about 16 on Taro, 2020–2025 | An assessment for some, recruiter, two technical rounds (DSA and frontend), hiring manager (often with design), HR |
| Stripe | Ready; the onsite rows rest on fewer accounts | Careers FAQ | 8, 2021–2025 | Recruiter, a 60-minute multi-part CoderPad screen, an onsite with programming, bug squash, integration, frontend design and a manager conversation |
| Spotify | Ready for US and Canada web engineers | Start your journey and FAQ | 13, 2018–2026 | Recruiter, a 60–75 minute technical screen, then a final round with a web build, algorithms, system design and values |
| Booking.com | Ready for 2021–2023 | Start your journey | 15, 2021–2025 | A HackerRank test, recruiter, one or two frontend coding rounds, a fit interview; backend and design for full-stack roles |
| Revolut | Ready | None readable; a tech blog post and the Bar Raiser video | 13, 2022–2025 | Recruiter or HR, a HackerRank test (three tasks), an hour of React live coding, system design (mid and senior), team fit, Bar Raiser |
| Zalando | Ready, Berlin only | How we hire and a 2023 blog post | 5, 2019–2024 | Talent call, a Codility take-home, the hiring manager, then a final day: take-home review, JavaScript fundamentals, coding, system design, manager |
| ServiceNow | Ready for India; thin elsewhere | How we hire (Wayback copy) | 11, 2022–2025 | Screening, two JavaScript and DSA rounds, a design or machine-coding round, the hiring manager (then a director in one account) |
| Microsoft | Ready, team-specific | Generic hiring tips | 9, 2020–2025 | A short screen, then 2–6 interviews: machine coding, JavaScript and React concepts, DSA, design, the hiring manager |
| Apple | Ready, team-specific | None | 9 plus 2 full-stack, 2021–2026 | Recruiter or hiring manager, a 45–60 minute screen, a team loop of 4–7 interviews of 30–45 minutes, mostly frontend coding |
| Netflix | Thin | New-grad and intern pages only | 3 own loops plus comments and plans | Recruiter, a manager screen, a live JavaScript screen or a take-home, an onsite of coding, take-home review and behavioural interviews |
| Airbnb | Thin | FAQ only | 3 own loops plus commenters | A technical screen where tests must pass, then UI coding, algorithms, architecture and an experience round |
| OpenAI | Thin | Interview guide (Wayback copy) | 7; screens only for frontend | Recruiter or hiring manager, a two-part screen (refactoring or React, then system design), 4–6 hours of final interviews |
| ElevenLabs | Thin | Careers FAQ | 5, full-stack titles, 2024–2026 | An assessment and a recruiter call, practical live coding, product decomposition or design, a call with a founder or the CTO |
| Waymo | Thin | How we hire | 1 complete frontend loop plus 3 partial | Recruiter, a technical screen, up to five 45-minute onsite interviews (one loop: Angular debugging, Promise coding, frontend design, autocomplete) |

## Corrections for the live guides

Status on 2026-10-20, after a second check of each claim against its source.

1. **Stripe item sources: re-checked, no change.** LC 5883632 is a software engineer 2 screen. Its questions were JSON object traversal and manipulation, which the author says are "much easier for front end engineers and people who use JavaScript". The `js-group-by` and `js-lodash-get` notes already describe it that way.
2. **Revolut guide, FAQ "Does every hub interview the same way?": fixed.** The FAQ now says that system-design rounds appear in the 2023, 2024 and May 2025 loops but not in the others. The guide cites the two extra accounts (RV4, RV7).
3. **Intuit guide: fixed.**
   - The staff thread is now labelled as an August 2026 plan, written before the interview.
   - The region sentence now says that the one completed loop with a location was in Bangalore.
   - The two general software engineer sources stay, because the guide already labels them as backend-leaning and uses them only for the loop shape. The new table does not cite them.
4. **ServiceNow guide: fixed.**
   - The Amsterdam technical sessions are now the recruiter's plan.
   - The HackerRank detail is credited to a commenter.
   - The virtual DOM reply is credited to a ServiceNow-badged user.
   - LC 7711064 stays. The guide labels it as a search preview, following the existing rule for unreadable sources, and no prompt depends on it.
5. **ElevenLabs guide: fixed.** The intro, the assessment prompt, the FAQ and the source note now match the readable account: a 90-minute technical assessment before the recruiter screen, then a live round fixing a practical problem. The "four questions", React and linked-list details are gone, and the prompt keeps its id with a new title.
6. **Datadog guide: fixed.** The Glassdoor previews are replaced by the readable 2024 Lisbon Taro account, which has the same real-time event viewer prompt. The careers link now points to the candidate experience page.
7. **Spotify guide: re-checked, no change.** The 2021 comment reads: 'I was told that Web Interview for Spotify final round is "practical application of HTML, CSS, JS" e.g. build an image carousel'. The guide's "relayed being told … such as an image carousel" is a fair reading.
8. **Official guides table: fixed.**
   - Added the process pages of Datadog (two), ElevenLabs, Stripe, Intuit, Waymo, ServiceNow, Spotify (two), Booking.com and Zalando (two), plus Meta's full-loop guide. Each covers text was checked against the page on 2026-10-20 (ServiceNow through its Wayback copy).
   - Updated the TikTok row and the file comment.
9. **Amazon guide: fixed earlier**, in `a243dbd8`.

## Google

**Readiness: ready.** The loop shape recurs in accounts from 2019 to 2026. The official pages describe the generic Google process; there is no frontend-specific page.

**Official pages**
- GO-O1 https://www.google.com/about/careers/applications/how-we-hire/ :
  - "you may be asked to take the Google Hiring Assessment, designed to measure workstyle skills"
  - "additional role-related assessments, like a coding exercise"
  - "one or two shorter conversations over phone or video with your recruiter"
  - "a panel of interviews, either over video or in person"
  - "AI tools are not permitted to be used during your interviews"
  - "roughly 6-8 weeks"
- GO-O2 https://www.google.com/about/careers/applications/interview-tips : "In many cases, you'll complete initial interviews virtually before coming onsite".
- GO-N1 (news, 2026-05-07) https://www.businessinsider.com/google-job-interview-software-engineers-ai-assistant-coding-2026-5 :
  - From the second half of 2026, an "approved" AI assistant is allowed in a "code comprehension" round.
  - The pilot covers "junior to mid-level roles, to select teams in the US".
  - Googleyness and Leadership "will now also involve a technical design discussion about a candidate's past project".

**Accounts**

| Id | Source | Date | Role | What it reports |
|---|---|---|---|---|
| GO1 | [Blind](https://www.teamblind.com/post/Google-L5-interview-experience-uyV7evLt) | 2022-06 | L5, frontend domain, poster's own loop | "1. JS round: 2 questions … 2. System design … 3. Googlyness … 4. Coding #1 … 5. Coding #2" |
| GO2 | [Blind](https://www.teamblind.com/post/is-there-a-separate-frontend-interview-process-at-google-e6sbbcao) | 2022-07 | commenter's own loop (c) | "All rounds are the exact same except just one round is front end focused"; at L5 and above "the sys design round may have the front end focus"; team match after passing |
| GO3 | [Medium](https://medium.com/@stylus07/google-software-engineer-interview-experience-d31c16c1e309) | 2022-07 | UX Engineer or SWE, rejected | considered "for either UXE or SWE roles after my intial technical phone interview"; the second round "would be another technical round" |
| GO4 | [Taro](https://www.jointaro.com/interviews/companies/google/experiences/frontend-engineer-mountain-view-ca-july-1-2023-accepted-offer-positive-e47fc62d/) | 2023-07* | Frontend Engineer, offer | "Initial tech screen, followed by a JavaScript round on Google Docs. Then, the on-site interview consisted of four technical rounds." One round was DSA and the rest frontend. The text promotes a prep site. |
| GO5 | [Taro](https://www.jointaro.com/interviews/companies/google/experiences/front-end-developer-germany-june-23-2024-no-offer-positive-f76226db/) | 2024-06 | Front End Developer | "Call with a recruiter. The first interview is a simple tech task to validate your profile. This is followed by three tech interviews and a cultural fit interview." |
| GO6 | [Medium](https://shubhamjangle.medium.com/google-swe-iii-interview-the-round-by-round-breakdown-nobody-wrote-fd2c10fe52ff) | 2026-04 | SWE III (L4), frontend or SWE, India | a 45-minute screen, three 45-minute DSA rounds and Googleyness. Weak: the author writes a multi-company series, and the years of experience differ between his posts. |
| GO7 | [LC 1274542](https://leetcode.com/discuss/interview-experience/1274542/) | 2021-06 | L3/L4 frontend, India | "Onsite (5 rounds) +1 Telephonic + 2 Team Matching Rounds"; "there is just one domain specific round" |
| GO8 | [Blind](https://www.teamblind.com/post/Google-Frontend-interview-78mvqUW2) | 2021-06 | commenter's own L5 loop (c) | "2 general coding, 1 coding + frontend topic, googlyness and system design"; the design round is "mainly for frontend specific and api design" |

Older accounts:
- [LC 592667](https://leetcode.com/discuss/post/592667/) (2020-04): a one-hour phone screen asking for a JavaScript throttle.
- [LC 753581](https://leetcode.com/discuss/post/753581/) (2020-07; Google part only): a phone call and a Google Doc exercise.
- [LC 417531](https://leetcode.com/discuss/post/417531/) (2019-10): the recruiter promised a frontend round, but the onsite had "No front-end interview, no javascript".
- [LC 421954](https://leetcode.com/discuss/post/421954/) (2019-11, L3/L4): three algorithm rounds, an async and closure front-end round and a behavioural round.
- A Blind plan from 2023-07 (`…vafgojoz`): a frontend candidate was told L5 depended on a system design interview.

**Proposed table: front-end software engineers, experienced**

| Stage | What happens | Who | Sources |
|---|---|---|---|
| Recruiter conversations | One or two short calls by phone or video | All | GO-O1, GO5, GO7 |
| Hiring Assessment or coding exercise | A workstyle assessment; a coding exercise for some roles | Some candidates | GO-O1 (official only) |
| Technical screen | 45–60 minutes of coding in a shared document, JavaScript or DSA; one or two screens | Frontend candidates | GO3, GO4, GO5, GO6, LC 592667, LC 753581 |
| Interview loop | Four or five interviews by video or onsite: mostly DSA coding, usually one JavaScript or frontend round, and Googleyness | All | GO-O1, GO1, GO2, GO4–GO8, LC 421954 |
| System design | Frontend-leaning system and API design | L5 and above | GO1, GO2, GO8 |
| Hiring committee and team match | After the loop | All | GO2, GO7 |
| AI code-comprehension round | An approved AI assistant in a code comprehension round | Pilot only: junior to mid-level, select US teams, second half of 2026 | GO-N1 (news only) |

**Caveats**
- The official pages read on 2026-10-20 still ban AI tools. Only the news report describes the pilot.
- The number of frontend rounds varies:
  - one round in GO2, GO7 and GO8;
  - most rounds in GO4;
  - none in GO6 or in LC 417531's actual onsite.
- Recruiter plans can differ from the loop that happens (LC 417531).

**Re-checked:** GO-O1 ("AI tools are not permitted…", "a panel of interviews…") and GO1 ("JS round: 2 questions").

## Meta

**Readiness: ready.** Meta publishes Front End Engineer guides for the screen and the full loop, and 11 accounts agree with them.

**Official pages**
- ME-O1 https://www.metacareers.com/hiring-process/ :
  - "The process typically consists of a recruiter conversation, initial screening and a full loop interview."
  - "about 2 to 3 months"
  - "Select roles now include an authorized AI assistant within CoderPad" and "Candidates are expected to use this AI assistant".
  - The AI-assisted interview supports "Python, Java, TypeScript, C++, C#, Kotlin, Swift, Rust, and Go". JavaScript is not in the list.
- ME-O2 https://www.metacareers.com/FEE-prep-initial/ : "a 60-minute conversation with an engineer".
  - Its PDF (FEE Initial, IC4–IC5) says "one 45-minute interview": introductions 5 minutes, coding 35 minutes, questions 5 minutes.
  - The PDF also says "code in JavaScript".
- ME-O3 https://www.metacareers.com/FEE-prep-onsite/ : "at least three conversations with our engineers". Its PDF (FEE Full Loop, IC4–IC6) says:
  - "4 to 6 interviews": "Coding • UIE Architecture and Design • Behavioral".
  - Coding: "about two problems in the course of about 40 minutes"; "you need to code in JavaScript"; "We do not ask dynamic programming questions".
  - Design: "The UIE design interview is 45 minutes and does not involve coding".
  - Behavioural: "a 45-minute session".
  - Tools: "Excalidraw and Coderpad.io".
  - Banned help includes "using AI tools, like ChatGPT".
- About the PDFs: they are undated, and their producer string points to an export no earlier than late 2025. Their links are expiring fbcdn URLs, so cite the pages, not the PDFs.

**Accounts** (Taro links are `https://www.jointaro.com/interviews/companies/meta/experiences/<slug>/`)

| Id | Source | Date | Role | What it reports |
|---|---|---|---|---|
| ME1 | Taro `front-end-developer-intern-london-england-december-1-2021-no-offer-positive-4f6ff45b` | 2021-12* | intern | "Had a screening call with their recruiter." "The first round consisted of front-end inclined coding questions in JavaScript." |
| ME2 | Taro `front-end-engineer-intern-united-states-january-1-2022-accepted-offer-positive-2e0f20e4` | 2022-01* | intern, offer | the recruiter asked "basic JavaScript quizzes"; "The second and third rounds were technical interviews conducted via video call." A near-identical entry, `front-end-engineer-intern-united-states-december-5-2021-accepted-offer-positive-825fe97b`, says "Phone screen + 2 technicals. All JavaScript." |
| ME3 | [Medium](https://medium.com/@stylus07/meta-interview-experience-cdf53eea63f3) | 2022-03 | FEE | "a phone screen with HR", then a two-problem technical interview; "Exactly after 50 mins, the interviewer asked me to stop" |
| ME4 | [Blind](https://www.teamblind.com/post/meta-frontend-system-design-yexyrusi) | 2022-03 | L5, poster's own loop, rejected | "both coding rounds and the behavioural interview" went well; the design prompt was "a very specific frontend component, something like autocomplete" |
| ME5 | [Blind](https://www.teamblind.com/post/Frontend-interview-experience-CPR8odiD) | 2021-10 | multi-company post; Facebook part only | "Facebook(E4): phone interview was great bc questions were relevant to frontend … On-site: 2 coding, 2 behavioral, and 1 system design. … E5 offer!" |
| ME6 | [Blind](https://www.teamblind.com/post/Went-through-Frontend-Interviews-recently-here-are-the-kinda-questions-they-ask-dbyQb3ob) | 2021-10 | multi-company post; Facebook part only | the screen had "javascript questions like flatten array, timeout clearer, create a map class"; "onsite all html/css/js and one DOM algo"; design "a component like a typeahead" |
| ME7 | Taro `front-end-developer-new-york-ny-november-1-2020-no-offer-positive-b0918a8e` | 2020-11* | FEE | "four 45-minute interviews … Two focused on basic algorithms, one on app design, and one was behavioral." |
| ME8 | [Blind](https://www.teamblind.com/post/meta-front-end-phone-interview-beroc46d) | 2023-06 | poster's plan (p), outcome in replies | "No leetcode was a JS question"; "didn't pass the phone screen." |
| ME9 | Taro `front-end-developer-san-francisco-ca-march-6-2024-no-offer-positive-609eb715` | 2024-03 | FEE | "Technical video interview … two frontend-related problems." |
| ME10 | Taro `frontend-engineer-new-york-ny-april-1-2025-no-offer-positive-ae322f20` | 2025-04* | FEE | "two questions in the technical screen." Two other Taro entries look like the same report and are counted once. |
| ME11 | Taro `frontend-engineer-menlo-park-ca-june-1-2025-accepted-offer-positive-143f4163` | 2025-06* | FEE, offer | a 20-minute recruiter screen, a phone-based technical round, then an onsite with two coding rounds, "frontend system design" and "light HTML/CSS coding and behavioral". Weak: it promotes Prepfully and its question nearly matches the official example. |

Also: [LC 753581](https://leetcode.com/discuss/post/753581/) (2020-07, Facebook part) reports a two-question screen. [LC 1684186](https://leetcode.com/discuss/post/1684186/) (2022-01, intern, `p`) quotes the email: "they will focus on front-end concepts instead of algo/ds".

**Proposed table: Front End Engineer, IC4–IC6**

| Stage | What happens | Who | Sources |
|---|---|---|---|
| Recruiter call | Background and interest; some recruiters ask a short JavaScript quiz | All | ME-O1, ME1, ME2, ME3, ME11 |
| Initial technical screen | Coding with an engineer in CoderPad, in JavaScript: one or two problems; 45 minutes in the PDF, 60 on the page | IC4–IC5 | ME-O2, ME3, ME6, ME8, ME9, ME10, LC 753581 |
| Full loop: coding | About two problems in about 40 minutes, in JavaScript, with no dynamic programming; accounts describe DOM and utility problems | IC4–IC6 | ME-O3, ME4, ME5, ME6, ME7, ME11 |
| Full loop: UIE architecture and design | 45 minutes, no coding: a product front end, or a component such as autocomplete or typeahead | IC4–IC6 | ME-O3, ME4, ME5, ME6, ME7, ME11 |
| Full loop: behavioural | 45 minutes | IC4–IC6 | ME-O3, ME4, ME5, ME7, ME11 |

A second table for interns: a recruiter JavaScript quiz, then one or two JavaScript interviews by video. Sources: ME1, ME2, the `…825fe97b` entry and LC 1684186 (`p`).

**Caveats**
- The screen is 60 minutes on the page and 45 in the PDF.
- The loop is "at least three" conversations on the page and "4 to 6" interviews in the PDF.
- The AI-assisted interview conflicts with the FEE guides:
  - On the hiring process page it does not list JavaScript.
  - The FEE PDFs require JavaScript and ban AI tools.
  - Whether frontend loops use the AI format is unresolved.
- ME5 reports two behavioural rounds.
- Design scope differs: the PDF example is a product front end, while ME4 and ME6 describe a single component.

**Re-checked:**
- ME-O1: three quotes.
- ME-O3: the page quote, and eight PDF quotes from "4 to 6 interviews" to "using AI tools, like ChatGPT".
- The metacareers pages answer only to requests with full browser headers.

## Microsoft

**Readiness: ready, team-specific.** There is no frontend-specific official page. The accounts agree on stage types, but loop size and content vary by team and by country.

**Official pages**
- MS-O1 https://careers.microsoft.com/v2/global/en/hiring-tips :
  - "the team might schedule a brief screening conversation"
  - "Most interviews include 2-4 conversations with potential teammates and cross-functional colleagues, each lasting up to an hour."
  - "over the phone, on Microsoft Teams, or in person"
  - "without outside assistance unless explicitly permitted."
- MS-O2 https://careers.microsoft.com/v2/global/en/hiring-tips/technical-interviewing : "the short 45-minute interview round"; "a third-party coding tool where you can run and compile your code."
- MS-O3 https://careers.microsoft.com/v2/global/en/hiring-tips/student-interviewing : "You'll have an initial interview and, if selected, a second final interview." Also: "All our interviews are virtual."

**Accounts** (Taro links are `https://www.jointaro.com/interviews/companies/microsoft/experiences/<slug>/`)

| Id | Source | Date | Role | What it reports |
|---|---|---|---|---|
| MS1 | [dev.to](https://dev.to/dhilipkmr/software-engineer-2-ui-interview-at-microsoft-1i0b) | 2020-10 | SE II UI, Bangalore, offer | "Round 1 (Machine Coding): (2 hours)", then JavaScript, "Design / HLD + LLD", problem solving, the hiring manager, and "Round 6 (As Appropriate)" with an interviewer "at a GM/Partner level" |
| MS2 | [LC 1254448](https://leetcode.com/discuss/interview-experience/1254448/) | 2021-06 | FEE, Bangalore | machine coding in plain JavaScript, JavaScript concepts, problem solving and design, then "Round 5( Hiring Manager)" |
| MS3 | [LC 489795](https://leetcode.com/discuss/interview-question/489795/) | 2020-01 | Bangalore, offer | "Round1 - machine coding : Design a weekly calendar view"; "I had 2 more rounds after that" |
| MS4 | Taro `front-end-developer-tel-aviv-yafo-october-1-2022-no-offer-negative-7d7887be` | 2022-10* | Front End Developer | "one short phone call with HR, and two technical interviews via Teams, each one hour long." |
| MS5 | Taro `senior-frontend-engineer-new-york-ny-january-27-2022-no-offer-negative-54d03a33` | 2022-01 | Senior FE | "interviewed by a backend-only developer and asked data structure questions. Only one of the questions pertained to the frontend" |
| MS6 | [LC 5335067](https://leetcode.com/discuss/interview-question/5335067/) | 2024-06 | SSE, USA | "4 Rounds": design "a Netflix-like application", "React coding to implement an autocomplete", "Behavioral", "React coding to create a DOM using nested JSON" |
| MS7 | [LC 5456468](https://leetcode.com/discuss/interview-experience/5456468/) | 2024-07 | SDE2 frontend, offer declined | "Round 1: DSA + Javascript", "Round 2 DSA + Frontend", "Round 3: Component Design + Behavioural", "Round 4: Hiring Manager" |
| MS8 | Taro `frontend-developer-belgrade-central-serbia-may-1-2024-no-offer-negative-380c5ce5` | 2024-05* | Frontend Developer | "HR introduction", "Test task", "Technical interview"; the live coding was "not related to frontend" |
| MS9 | [LC 7347058](https://leetcode.com/discuss/interview-experience/7347058/) | 2025-11 | SE II Frontend | round 1: React and JavaScript output questions plus "Write Pollyfill of useEffect"; round 2: web security plus "Create step form in react" |

**Proposed table: frontend roles, varies by team**

| Stage | What happens | Who | Sources |
|---|---|---|---|
| Recruiter or HR call | A short call | All | MS-O1, MS1, MS4, MS8 |
| Take-home test task | In one account | One account | MS8 |
| Machine coding | A UI build: 1–2 hours in plain JavaScript in the 2020–2021 Bangalore accounts, React components in 2024–2025 | Most | MS1, MS2, MS3, MS6, MS7, MS9 |
| JavaScript and React concepts | Output questions, polyfills, promises | Most | MS1, MS2, MS4, MS7, MS9 |
| DSA and problem solving | Coding problems; some frontend candidates got mostly non-frontend questions | Most | MS1, MS2, MS3, MS5, MS7, MS8 |
| Design | Low-level design (2020–2021), application system design (2024), component design | Most | MS1, MS2, MS6, MS7 |
| Behavioural and hiring manager | Conversations | All | MS1, MS2, MS6, MS7 |
| Senior leader ("As Appropriate") | A final conversation with a senior leader | One account (2020) | MS1 |

Reported loop sizes: two interviews (MS4), four (MS6, MS7), five or six (MS1, MS2). Students get an initial and a final interview, both virtual (MS-O3).

**Caveats**
- The official "2-4 conversations" conflicts with the five or six rounds in the 2020–2021 Bangalore accounts.
- The student page says every interview is virtual; the general page allows phone, Teams or in person.
- Some frontend candidates were interviewed on non-frontend material (MS5, MS8).

**Re-checked:** MS-O1 ("Most interviews include 2-4 conversations…").

## Apple

**Readiness: ready, team-specific.** There is no official page: apple.com/careers has no interview content, and the jobs FAQ redirects to an Apple ID sign-in. Nine frontend accounts agree on a screen followed by a team loop of mostly frontend coding. The loop size and the behavioural content vary by team.

**Accounts** (Taro links are `https://www.jointaro.com/interviews/companies/apple/experiences/<slug>/`)

| Id | Source | Date | Role | What it reports |
|---|---|---|---|---|
| AP1 | [LC 6979238](https://leetcode.com/discuss/post/6979238/) | 2025-06 | IC3 Frontend | an online assessment ("Duration: 1 hour", "2 Coding Questions (DSA + JavaScript)", "20 Multiple Choice Questions"), a recruiter call, then "a 60-minute video interview with an Apple engineer"; the role was then filled |
| AP2 | [Medium](https://srijansinghgulati.medium.com/my-apple-interview-experience-and-why-i-declined-the-offer-5ff442962bd8) | 2022-07 | senior frontend, Hyderabad, offer declined | four rounds, three of them frontend and JavaScript; "The third round was pretty much a behavior round" |
| AP3 | Taro `front-end-developer-cupertino-ca-july-1-2022-no-offer-negative-9299c7ea` | 2022-07* | Front End Developer | a screen with "an easy coding question", then "a virtual on-site consisting of seven 30-minute 1:1 interviews." |
| AP4 | [Blind](https://www.teamblind.com/post/Apple-frontend-interview-advice-d64Fd3BM) | 2022-02 | senior frontend; plan with a reply after the onsite | "technical screen was mostly conversational with only ~15 minutes in coderpad"; "five 45 minute sessions"; afterwards: "rewrite a method from a popular utility library and build a relatively straightforward react form component." |
| AP5 | Taro `front-end-developer-united-states-august-25-2022-no-offer-positive-ceece13a` | 2022-08 | Front End Developer | "45-minute virtual interview … an autocomplete search bar in TypeScript with either Vue.js or React.js" |
| AP6 | Taro `frontend-engineer-san-francisco-ca-october-1-2023-accepted-offer-positive-e5223424` | 2023-10* | Frontend Engineer, offer | "30 minutes of verbal technical questions … The remaining 30 minutes involved two coding challenges" |
| AP7 | Taro `frontend-developer-united-states-february-1-2025-no-offer-neutral-01c585c0` | 2025-02* | Frontend Developer | a hiring manager meeting; a "Technical Screen (front-end specific)"; a "Virtual Onsite (5 interviews over the course of 2-3 days: 2 Technical, 2 Cross functional, Hiring Manager + Sr. Manager)"; then a meeting with the director |
| AP8 | [Blind](https://www.teamblind.com/post/my-apple-interview-was-absolutely-brutal-tjrprfjx) | 2025-03 | senior frontend, Cupertino | "1 technical screen and then a final round which is 4 rounds of coding. No behavioral rounds, no system design."; "each team has their own interview rounds/process" |
| AP9 | Taro `front-end-engineer-united-states-august-1-2021-no-offer-negative-2d79a1e7` | 2021-08* | Front End Engineer | "a 45-minute technical screen with the hiring manager" |

Full-stack accounts with explicit frontend rounds:
- [LC 6579616](https://leetcode.com/discuss/post/6579616/) (2025-03, ICT3, Cupertino, offer): a recruiter, the hiring manager and a phone screen, then "Onsite - 5 rounds", including React coding.
- [LC 8354843](https://leetcode.com/discuss/post/8354843/) (2026-06): a screen split into backend and frontend halves of 30 minutes each, then hiring manager, frontend coding, backend coding and system design rounds.

**Proposed table: frontend roles, team-specific**

| Stage | What happens | Who | Sources |
|---|---|---|---|
| Online assessment | 1 hour: two coding questions (DSA and JavaScript) and 20 multiple-choice questions | IC3, one account | AP1 |
| Recruiter call | A short call | Most | AP1, AP3, AP9, LC 6579616 |
| Hiring manager conversation | Before or as part of the screen | Some teams | AP7, AP9, LC 6579616, LC 8354843 |
| Technical screen | 45–60 minutes of React, JavaScript or TypeScript coding, sometimes with DSA; one screen was mostly conversation | All | AP1, AP3, AP4, AP5, AP6, AP8, AP9 |
| Team loop | 4–7 interviews of 30–45 minutes, mostly JavaScript, React and CSS coding and concepts; behavioural or cross-functional interviews in some teams, none in others | All | AP2, AP3, AP4, AP7, AP8, LC 6579616 |
| Director meeting | After the loop | One account | AP7 |

**Caveats**
- Loop composition differs:
  - no behavioural or design round (AP8);
  - one behavioural round (AP2);
  - two cross-functional interviews (AP7).
- Interview length differs: seven 30-minute interviews (AP3) against five 45-minute ones (AP4).

**Re-checked:** AP8 (both quotes).

## Netflix

**Readiness: thin.** Only NF2 (2020) describes a complete loop of the poster's own. The rest is a stage count, one screen, comments and recruiter plans. Netflix-badged commenters say each team runs its own process.

**Official pages** (none covers experienced or frontend hires; https://jobs.netflix.com/careers/engineering has no process text)
- NF-O1 https://jobs.netflix.com/careers/new-grads (US) : "New Grad interviews at Netflix typically include a take-home assessment followed by two rounds of interviews, with advancement based on the feedback at each stage." Also: "Interviewers will evaluate your technical (if applicable), role-specific, and behavioral skills."
- NF-O2 https://jobs.netflix.com/careers/internships (US, India, Poland, Japan) : "a take-home assessment followed by approximately two-to-three rounds of interviews". Both pages add: "You may be asked about which aspects of the memo resonate most with you – or not".

**Accounts**

| Id | Source | Date | Role | What it reports |
|---|---|---|---|---|
| NF1 | [Taro](https://www.jointaro.com/interviews/companies/netflix/experiences/senior-frontend-engineer-warsaw-masovia-november-1-2024-no-offer-negative-c999399f/) | 2024-11* | Senior FE | "The interview process consists of eight stages." No breakdown. |
| NF2 | [Taro](https://www.jointaro.com/interviews/companies/netflix/experiences/senior-front-end-engineer-los-angeles-ca-october-1-2020-no-offer-positive-86100381/) | 2020-10* | Senior FE | in order: a long recruiter conversation, "a long behavioral interview with a UI manager", "the take-home test". The onsite was "1 coding interview", "1 take-home test review" and "2 behavioral interviews". Also: "There were no LeetCode-type questions." |
| NF3 | [LC 7421643](https://leetcode.com/discuss/post/7421643/) | 2025-12 | frontend L4/L5, Poland, rejected | "Netflix online screening round 1"; "There were 3 tasks, 1h": flatten a nested object, write expect/toBe matchers, handle failing getVideos/getLikes calls |
| NF4 | [Blind](https://www.teamblind.com/post/netflix-frontend-onsite-interview-kodnou42) | 2024-01 | TV UI team (p) | a Netflix-badged commenter: "You'll most likely have a manager screen before any technical rounds"; the poster: "Yup already had that." Another commenter was rejected after a recruiter screen with "a few softball technical questions". |
| NF5 | [Blind](https://www.teamblind.com/post/interview-rounds-for-netflix-vyxxuxco) | 2024-02 | L4 Web UI (p) | the recruiter's plan: "a technical screen, which then would move to an onsite round", "two technicals, two behavioral: possibly DS/A + system design". A Netflix-badged commenter: "We don't centralize our interview process, generally." |
| NF6 | [Blind](https://www.teamblind.com/post/Netflix-front-end-interview-N0UJeDug) | 2022-03 | poster's loop "a few years back" | "take home assignment, follow up about why it's implemented in that way, culture section"; a commenter (c): "a manager call … a recruiter call, a phone screen, and then I believe a take home." |
| NF7 | [Blind](https://www.teamblind.com/post/netflix-frontend-interviews-q8kvrxy0) | 2024-08 | commenters only | "recruiter said no leetcode at any stage" (p); a Netflix-badged commenter: "Each team does interviews differently." |
| NF8 | [Taro](https://www.jointaro.com/interviews/companies/netflix/experiences/senior-frontend-engineer-san-jose-ca-august-1-2021-no-offer-negative-5771c678/) | 2021-08* | Senior FE | one talk with the would-be manager; it cannot be placed in a sequence |

Not used: FrontendLead Discuss threads (a vendor forum with anonymous posts) and accounts older than 2018.

**Proposed table: experienced frontend and UI engineers, varies by team (label every row "one account" or "reports")**

| Stage | What happens | Who | Sources |
|---|---|---|---|
| Recruiter screen | A conversation that can include light technical questions | US, Poland | NF2, NF4, NF5 (p), NF6 (c) |
| Hiring manager screen | A conversation before the technical rounds | Some loops | NF2, NF4 (c), NF6 (c), NF8 |
| Technical screen | A one-hour live JavaScript session with several small tasks | One detailed account | NF3; NF5 (p), NF6 (c) |
| Take-home | A build exercise, reviewed later in the onsite | 2020 and older loops | NF2, NF6 |
| Onsite | One coding interview, a take-home review and two behavioural interviews (2020); a 2024 plan lists two technical and two behavioural | Experienced hires | NF2, NF5 (p), NF6 |

New graduates and interns: a take-home assessment, then two rounds (new graduates) or about two to three (interns), with questions on the culture memo (NF-O1, NF-O2).

**Caveats:**
- The order differs: some loops start with the manager, others with a technical screen.
- Some loops use a take-home and others a live screen.
- "No LeetCode" (NF2, NF7) conflicts with "possibly DS/A" (NF5).
- A search summary said the Warsaw account described a take-home and an all-day onsite. The Taro text has neither, so do not use that claim.

**Re-checked:** NF-O1 ("take-home assessment followed by two rounds of interviews").

## Airbnb

**Readiness: thin.** Three accounts describe the poster's own loop, and they mostly list questions. Round counts come from commenters.

**Official page**
- AB-O1 https://careers.airbnb.com/faq/ : "Depending on the position, it may involve taking a test, making a video, or joining us for an event." Also: "Once the interview process has begun, we make it a priority for candidates to meet with multiple individuals on the current team."

**Accounts**

| Id | Source | Date | Role | What it reports |
|---|---|---|---|---|
| AB1 | [Taro](https://www.jointaro.com/interviews/companies/airbnb/experiences/front-end-engineer-san-francisco-ca-june-1-2022-declined-offer-negative-afab47f0/) | 2022-06* | FE | "after the technical screen and virtual onsite"; questions: "Build a simple React component. Explain the architecture for a mock chat app. Develop the UI for a simple card game." |
| AB2 | [Blind](https://www.teamblind.com/post/airbnb-frontend-interview-fyzmjrb5) | 2024-02 | FE | the poster, after the screen: "You need to pass all the test cases." A commenter (c): "my rounds were very frontend focused … js fundamnets (think event loop and closures) I was also asked to design a ui with best practices." |
| AB3 | [Blind](https://www.teamblind.com/post/Airbnb-front-end-interview-L5-gkNsa6jg) | 2022-02 | L5 (c) | an Airbnb-badged commenter: "2 web UI/JS questions, 1 leetcode med, 1 architecture question"; the architecture question is "something you worked on previously or something the interviewer chooses." A second Airbnb-badged commenter: "I also got an Experience round." |
| AB4 | [Blind](https://www.teamblind.com/post/Airbnb-Frontend-Engineer-Interview-H7oqkCqu) | 2022-04 | senior FE (c) | "not much algorithms"; "6 interviews in total 3 code related. 1 system design 1 experiences 1 more behavioral" |
| AB5 | [Blind](https://www.teamblind.com/post/Airbnb-Frontend-Interview-On-site-W3b1OXy5) | 2022-05 | G7/G8 (c) | an Airbnb-badged commenter: "You will get another ds/a algorithms question." |
| AB6 | [Blind](https://www.teamblind.com/post/Went-through-Frontend-Interviews-recently-here-are-the-kinda-questions-they-ask-dbyQb3ob) | 2021-10 | multi-company post; Airbnb part only, offer | "Two screens html/css/js. Onsite one algo (Array) and one html/css/js" |
| AB7 | [LC 7110255](https://leetcode.com/discuss/post/7110255/) | 2025-08 | FE (p) | "the recruiter gave me a generic response"; a later edit: "either a standard ui component or a design questions" |
| AB8 | [Taro](https://www.jointaro.com/interviews/companies/airbnb/experiences/software-engineer-united-states-december-1-2024-no-offer-negative-4a03cdeb/) | 2024-12* | "Software Engineer", frontend questions | "a tech screen and an onsite interview"; "There were four interviewers"; "React component and some vanilla JS questions." |

Not used:
- senior SWE loops with code review and core values rounds (Blind `…5OuBma7G`, `…kmknmGkz`), because they are not frontend;
- FrontendLead threads, which read like translated 1point3acres posts;
- members-only Medium posts.

**Proposed table: experienced frontend engineers, US, 2021–2024 (thin)**

| Stage | What happens | Who | Sources |
|---|---|---|---|
| Technical screen | Live frontend coding where the tests must pass; two HTML/CSS/JS screens in 2021 | FE | AB1, AB2, AB6, AB7 (p), AB8 |
| Onsite: UI coding | Build UI in React or plain HTML, CSS and JavaScript | FE | AB1, AB3 (c), AB4 (c), AB6, AB8 |
| Onsite: algorithms | A LeetCode-medium problem | Most | AB3 (c), AB5 (c), AB6 |
| Onsite: architecture | An app's architecture or a past project | FE | AB1, AB3 (c), AB4 (c) |
| Onsite: experience and behavioural | Experience round; one account adds a behavioural round | Commenters only | AB3 (c), AB4 (c) |

**Caveats:**
- AB4 says "not much algorithms", while AB3, AB5 and AB6 report an algorithm round.
- Only AB2 supports the "code must run and pass tests" style for frontend.
- Do not carry code review or core values rounds over from non-frontend loops.

**Re-checked:** AB3 ("2 web UI/JS questions, 1 leetcode med, 1 architecture question").

## Uber

**Readiness: ready.** The official frontend guide, a published candidate story and seven accounts from 2022 to 2026 agree on the core stages. Most accounts are from India.

**Official pages** (jobs.uber.com answers 403 to plain requests; the guide was read in a rendered browser)
- UB-O1 https://jobs.uber.com/en/uber-interview-guide/frontend-engineering-interview-guide/ (L3 to L6+), in order:
  - "Talk with a Recruiter or Sourcer (Virtual | 30 mins)"
  - "Complete a HackerRank coding assessment"
  - "Business (Technical) Phone Screen to Assess Coding + Design & Architecture Competencies (Online | 60 mins)"
  - "Interview 1: Software Engineering - Algorithms & Data Structures (Coding 1) (60 mins)"
  - "Interview 2: Software Engineering - Depth in Specialization (Coding 2) (60 mins)"
  - "Interview 3: Collaboration & Leadership (60 mins)"
  - "Decision (Virtual)"
  - The guide adds: "Each stage in our hiring process is a decision point." It also says the "steps and details within those steps may vary based on the specific role, location, and business needs."
- UB-O2 https://jobs.uber.com/en/people-stories/interview-prep/landing-the-job-at-uber-front-end-engineer/ (a senior engineer's story on Uber's site, undated), in order:
  - "Code Assessment: This initial stage involved a small challenge using vanilla JavaScript."
  - "Algorithms & Data Structures"
  - "Specialization (Web)"
  - "System Design"
  - "Hiring Manager: The final interview was a discussion about my past projects"

**Accounts**

| Id | Source | Date | Role | What it reports |
|---|---|---|---|---|
| UB1 | [LC 2409192](https://leetcode.com/discuss/post/2409192/) | 2022-08 | senior FE phone screen | a prompt "in code signal", "expected to come to a solution using Javascript" |
| UB2 | [Medium](https://medium.com/@iamjaasi/uber-sde-2-frontend-interview-experience-40c1a7437cc0) | 2022-11 | SWE II Frontend, offer | "a 35 mins codesignal test… 2 coding questions on DSA and 8 MCQ's based on frontend stuffs"; then DSA (1 h), "Tech Specialisation… machine coding round with vanilla JS", "System design and Architecture(1 hr)", "Leadership and Collaboration (1 hr)" |
| UB3 | [Taro](https://www.jointaro.com/interviews/companies/uber/experiences/frontend-engineer-ii-bengaluru-april-1-2022-no-offer-positive-f0d40cc2/) | 2022-04* | FE II | "a screening round in which I was asked to build a typical UI component in React", then four rounds on Zoom: design and architecture, frontend coding, "Algorithms and Data Structures (Bar Raiser)", behavioral |
| UB4 | [LC 6820731](https://leetcode.com/discuss/post/6820731/) | 2025-06 | SDE-2 FE, India, rejected | an eliminator round, then rounds on promises, machine coding ("do it vanilla js"), "design google calendar" and the hiring manager, all in one day |
| UB5 | [LC 7322609](https://leetcode.com/discuss/post/7322609/) | 2025-11 | FE SWE II | a phone round, then DSA, "design google calendar", behaviour and "Specialization Front End… either be a make a UI or a leetcodeish javascript question" |
| UB6 | [LC 7822801](https://leetcode.com/discuss/post/7822801/) | 2026-04 | L5A | "recruiters and initial documentation often state that the rounds will focus on… (DSA)"; the candidate got a React poll widget |
| UB7 | [LC 6840169](https://leetcode.com/discuss/post/6840169/) | 2025-06 | FE | "HR told me it would be a DSA round. To my surprise, it wasn't." |
| UB8 | [Taro](https://www.jointaro.com/interviews/companies/uber/experiences/frontend-developer-brazil-november-5-2025-no-offer-negative-0b9b9ae1/) | 2025-10 | Frontend II, Brazil (in Portuguese) | the HR call asked about backend experience and CSS `position` and `display` |
| UB9 | [Blind](https://www.teamblind.com/post/iFdAzgTp) | 2024-08 | L4 (p) | "Depth in Chosen Technology", "DS&A round", "systems design round" |

Older: LC 1064199 (2021), a CodeSignal phone screen with progress bars.

**Proposed table: frontend engineers, L3 to L5A**

| Stage | What happens | Who | Sources |
|---|---|---|---|
| Recruiter call | 30 minutes; one account had technical questions here | All | UB-O1, UB3, UB8 |
| Online assessment | HackerRank in the official guide; a 35-minute CodeSignal test (DSA and frontend multiple-choice) in 2022 | All | UB-O1, UB-O2, UB2 |
| Phone screen | 60 minutes of coding, sometimes a React UI component | All | UB-O1, UB1, UB3, UB4, UB5 |
| Algorithms and data structures | 60 minutes; called a bar raiser in one account | All | UB-O1, UB-O2, UB2, UB3, UB5, UB9 (p) |
| Frontend specialization | 60 minutes: a UI build or a JavaScript problem, plain JavaScript in two accounts | All | UB-O1, UB-O2, UB2, UB3, UB4, UB5, UB6, UB9 (p) |
| System design | Frontend architecture; two accounts got a calendar | Mid and senior | UB-O2, UB2, UB3, UB4, UB5, UB9 (p) |
| Collaboration and leadership, hiring manager | 60 minutes on past projects and behaviour | All | UB-O1, UB-O2, UB2, UB3, UB4, UB5 |

**Caveats:**
- The official guide names HackerRank; the 2021–2022 accounts used CodeSignal.
- The guide places design inside the phone screen, while the people story and four accounts have a separate system design round.
- Recruiters' "DSA" labels did not match the rounds that candidates got (UB6, UB7).

**Re-checked:** UB-O1 (four stage names, in a rendered browser).

## Stripe

**Readiness: ready, with thinner onsite rows.** The screen rows are solid. The onsite rows rest on ST1, ST4 and ST6's plan, so label them that way.

**Official page**
- ST-O1 https://stripe.com/careers (stripe.com/jobs redirects here): "Most processes include a recruiter screen, a technical or skills-based assessment, and a series of interviews with the team you'd be joining." Also: "Timelines vary by role, level, and location".
- There is no frontend page. Candidates mention a private prep document (ST6, ST8).

**Accounts**

| Id | Source | Date | Role | What it reports |
|---|---|---|---|---|
| ST1 | [Taro](https://www.jointaro.com/interviews/companies/stripe/experiences/frontend-engineer-barcelona-october-1-2023-no-offer-neutral-ceb407e7/) | 2023-10* | Frontend Engineer | stages: "Call with HR", "UI Elements coding assessment", "Problem-solving coding assessment", "Bug finding within an unknown project", "Integration test, involving the integration of two provided tools", "Frontend System Design", "Chat with the team manager"; "three weeks, with an additional two weeks to receive an answer." |
| ST2 | [Taro](https://www.jointaro.com/interviews/companies/stripe/experiences/frontend-developer-canada-september-19-2025-no-offer-positive-caea53c0/) | 2025-09 | Frontend Developer | "broken into a 3-part exercise through CoderPad" (stage not named) |
| ST3 | [Taro](https://www.jointaro.com/interviews/companies/stripe/experiences/frontend-engineer-san-francisco-ca-august-1-2025-no-offer-neutral-8ad7d78f/) | 2025-08* | Frontend Engineer | "a 30-minute recruiter screening phone call. After that, I had a 60-minute technical interview" (a 4-digit code entry form) |
| ST4 | [Taro](https://www.jointaro.com/interviews/companies/stripe/experiences/front-end-developer-india-november-15-2022-no-offer-positive-f4ea85cd/) | 2022-11 | Front End Developer, India | "The bug bash and integration rounds were the hardest" |
| ST5 | [Taro](https://www.jointaro.com/interviews/companies/stripe/experiences/frontend-developer-barcelona-march-1-2025-no-offer-positive-c1c921ed/) | 2025-03* | Frontend Developer (in Spanish, written as advice) | a 30-minute recruiter call; "una sesión de 1 hora en CoderPad… entre 2 a 4 ejercicios" (a one-hour CoderPad session with two to four exercises); then "4 rondas más, cada una de 45–60 minutos… bug fixing, deployment, testing, CI/CD" (four more rounds of 45–60 minutes) |
| ST6 | [Blind](https://www.teamblind.com/post/Stripe-frontend-onsite-SfaGgc1a) | 2024-11 | L3 FE (p) | "1st round: Programming Exercise 2nd round: Bug squash 3rd round: frontend design 4th round: integration 5th round: Experience with Goals"; a commenter (c): "I didn't get a bug bash, got a HM interview instead" |
| ST7 | [Blind](https://www.teamblind.com/post/stripe-frontend-interview-be7f1ymm) | 2024-07 | senior FE | "build a component for the first round"; afterwards "it was pretty easy" |
| ST8 | [Blind](https://www.teamblind.com/post/Stripe-Full-Stack-Onsite-Front-End-Design-Interview-2GZJMjep) | 2021-08 | full-stack (c) | a "Front-End Design Interview" on the schedule; a commenter: "build a UI component with the tech of your choice." |

**Proposed table: frontend engineers**

| Stage | What happens | Who | Sources |
|---|---|---|---|
| Recruiter screen | 30 minutes | All | ST-O1, ST1, ST3, ST5 |
| Technical screen | 60 minutes of live, multi-part coding in CoderPad, sometimes a UI build | All | ST-O1, ST3, ST5, ST7, possibly ST2 |
| Onsite: programming exercise | A coding exercise | Reports | ST1, ST6 (p) |
| Onsite: bug squash | Fix bugs in an unfamiliar codebase | Reports | ST1, ST4, ST5, ST6 (p) |
| Onsite: integration | Combine provided tools or APIs | Reports | ST1, ST4, ST6 (p) |
| Onsite: frontend design | Design a frontend system or component | Reports | ST1, ST6 (p), ST8 (c, 2021) |
| Onsite: experience or manager | A conversation about goals and past work | Reports | ST1, ST6 (p and c) |

**Caveats:**
- Rounds can be swapped: one candidate had a hiring-manager interview instead of the bug squash.
- ST5's "deployment, CI/CD" appears in one source only.

**Re-checked:** ST-O1, and ST1 ("Bug finding within an unknown project", "Frontend System Design").

## ByteDance and TikTok

**Readiness: ready.** There are nine accounts outside Taro plus about sixteen Taro accounts, and the core shape is consistent. The official pages cover early careers only.

**Official pages** (they render only in a browser)
- BD-O1 https://jobs.bytedance.com/en/campus/interview-tips : "You should expect to complete two to three interviews." Also: "We want to understand your coding, algorithm and design skills"; "find sample coding questions through sites like HackerRank & Nowcoder".
- BD-O2 https://careers.tiktok.com/m/campus/interview-tips (the same text is on lifeattiktok.com) adds: "Depending on the role and region, you may be invited to participate in an assessment." Also: "assessment events usually take a few hours to complete, and other candidates may join you."
- The "30 minutes to an hour" sentence on these pages applies to non-technical roles only.

**Accounts outside Taro**

| Id | Source | Date | Role | What it reports |
|---|---|---|---|---|
| BD1 | [Blind](https://www.teamblind.com/post/bytedance-new-grad-frontend-engineer-interview-breakdown-vqyvjs1l) | 2023-01 | new grad FE | "They gave me three problems on hackerrank."; the first round was in "hackerrank code pair" |
| BD2 | [Blind](https://www.teamblind.com/post/my-tiktok-front-end-interview-experience-any-idea-what-end-result-might-look-like-jfcdhq5r) | 2024-09 | FE | "Had a phone round with recruiter"; "Round 1. With a front end engineer - implement tool tip custom component"; "Round 2. With hiring manager … jumped into system design" (front-end specific); "Round 3 - with a PM - cross functional interview."; "Round 4. With department leader" |
| BD3 | [explainthis.io](https://explainthis.io/en/software-engineer-note/software-engineer-career/my-tiktok-frontend-interview) | summer 2022 | FE, 2 YOE, offer | "First Round: JavaScript & React & HTTP questions + 1 JavaScript whiteboard question"; "Third Round: 1 LeetCode Medium + Frontend System Design"; "Fourth Round (HR): Several behavioral questions"; two weeks in total. The same author posted LC 3094148 and a Blind post; counted once. |
| BD4 | [LC 979478](https://leetcode.com/discuss/interview-experience/979478/) | 2020-12 | new grad, California, offer | "Stage 1: OA", then two "LC medium" interviews, then a "Manager Interview" |
| BD5 | [LC 4881233](https://leetcode.com/discuss/interview-experience/4881233/) | 2024-03 | FE, rejected after round 1 | "30 min recruiter call", then HackerRank: "Implement JS throttling function" plus fetch-and-render in React |
| BD6 | [LC 6450891](https://leetcode.com/discuss/interview-experience/6450891/) | 2025-02 | Senior FE, Singapore | round 1: "There were 2 problems": LeetCode 784 and "React based coding" |
| BD7 | [LC 6437333](https://leetcode.com/discuss/interview-experience/6437333/) | 2025-02 | graduate assessment (front end) | "5 MCQs", "1 DSA Question", "1 Debugging Question" |
| BD8 | [Blind](https://www.teamblind.com/post/tiktok-behavioral-with-hiring-manager-round-utpnj2vx) | 2023-12 | FE (p) | "I passed the first two technical rounds" ("LC med and simple react exercise"); TikTok-badged commenters disagree on whether the manager round is "strictly behavioral" or "likely to hv coding" |
| BD9 | [LC 2270634](https://leetcode.com/discuss/interview-experience/2270634/) | 2022-06 | Seattle | "Phone Screen (15 min)"; "option to choose between 2 Algo or 1Algo + 1 FE" |

**Taro accounts** (`https://www.jointaro.com/interviews/companies/tiktok/experiences/<slug>/` unless noted)
- TT1 `frontend-engineer-united-states-october-27-2025-no-offer-neutral-22728914`: "OA -> 60-minute (LC style) -> Front-End Assessment -> Behavioral".
- TT2 `front-end-developer-united-states-march-4-2025-no-offer-positive-8082b9a5`: an OA, DSA, a "Frontend Coding round… UI implementation, and React expertise", then behavioral.
- TT3 `frontend-engineer-united-states-june-1-2024-declined-offer-neutral-363898ae`*: a recruiter call; "two coding round interviews" (LeetCode and frontend); "a meeting with the hiring manager".
- TT4 `front-end-engineer-united-states-july-8-2024-no-offer-neutral-d83a6ff3`: "a software design round administered by the hiring manager".
- TT5 `front-end-developer-san-jose-ca-march-1-2024-no-offer-neutral-fc19c254`*: "Third round: System design with the hiring manager. Last round: HR."
- TT6 `front-end-developer-october-22-2025-accepted-offer-positive-59a98129` (Singapore, offer): "2 technical rounds, 1 hiring manager round, 1 HR round… lasted a week."
- TT7 `frontend-developer-singapore-november-1-2023-accepted-offer-positive-31530cbd`* (offer): the third technical round was "with the hiring manager".
- TT8 `frontend-engineer-sydney-september-1-2024-no-offer-neutral-5db123fe`*: a recruiter screen, a JS/React screen, then a virtual onsite with "System design (frontend focus)", coding and behavioral rounds.
- TT9 `frontend-developer-singapore-august-1-2025-no-offer-neutral-4e4e5cf8`*: CodeSignal, "single frontend development problem divided into 4 levels".
- TT10 `frontend-developer-seattle-washington-october-27-2025-no-offer-positive-1abce1a2`: CodeSignal, "4 questions in 70 minutes".
- TT11 `graduate-front-end-developer-sydney-may-1-2024-no-offer-neutral-11f1f10b`*: "Online Assessment… Recruiter Call… 3 Technical Interviews… Behavioural Interview".
- TT12 `front-end-software-engineer-intern-united-states-august-1-2024-no-offer-neutral-56f0627e`* (intern): a 110-minute assessment.
- TT13 `frontend-software-engineer-intern-san-jose-ca-march-15-2025-no-offer-neutral-b48dd88e` (intern): "no phone screen at all".
- TT15 `frontend-developer-singapore-may-1-2024-no-offer-neutral-8a86f039`*: "I skipped the initial OA."
- TT16 `frontend-engineer-singapore-september-16-2025-no-offer-neutral-cc1b7edd`: "There was no online assessment".
- BDT1 `https://www.jointaro.com/interviews/companies/bytedance/experiences/front-end-engineer-australia-june-1-2021-accepted-offer-positive-14ef73af/`* (offer): two technical rounds, "One round with the director" and an HR round, all "on the same day".

**Proposed table: experienced frontend engineers, US, 2022–2025**

| Stage | What happens | Who | Sources |
|---|---|---|---|
| Online assessment | HackerRank or CodeSignal: multiple-choice and LeetCode-style questions; a frontend task in 2025 | Some candidates | TT1, TT2, TT10 |
| Recruiter call | 15–30 minutes | All | BD2, BD5, BD9, TT3, TT5 |
| Technical rounds | Usually two, about an hour each: one DSA or LeetCode round and one frontend round (a React component or a JavaScript utility) | All | BD2, BD5, BD8, TT1–TT5 |
| Hiring manager round | Experience plus frontend system design or React and JavaScript questions; some report it as behavioural only | Most | BD2, BD8, TT3, TT4, TT5 |
| PM cross-functional round | Working with product managers | One account | BD2 |
| Department leader round | Career history and a design discussion on performance and scale | One account | BD2 |
| HR or behavioural round | Behavioural and culture questions | Some accounts | BD3, TT1, TT2, TT5 |

Other variants:
- **Singapore and Australia:** an HR call, an online assessment for some candidates, two or three technical rounds of about an hour, a hiring manager round and an HR round. Sources: TT6, TT7, TT8, BDT1, BD6.
- **New graduates and interns:** an online assessment, one to three technical interviews, then a manager or behavioural round. Sources: BD1, BD4, BD7, TT11–TT13, BD-O1, BD-O2.

**Caveats:**
- Accounts disagree on whether the hiring manager round is behavioural only or includes design or coding.
- System design appears inside a technical round in BD3 but in the hiring manager round in TT4, TT5 and BD2.
- Some candidates had no online assessment (TT15, TT16).

**Re-checked:** BD-O1 ("two to three interviews", "coding, algorithm and design skills", in a rendered browser).

## OpenAI

**Readiness: thin.** For frontend roles only the screens are confirmed. No frontend account describes the final loop.

**Official page**
- OA-O1 https://openai.com/interview-guide/ (the live page answers 403 to our tools; read the Wayback copy https://web.archive.org/web/20261009124021/https://openai.com/interview-guide/):
  - "It typically takes the recruiting team one week to review your résumé"
  - "a recruiting coordinator will email you to schedule a conversation with the hiring manager or recruiter"
  - "Formats vary by team and may include: pair coding interviews, take-home projects, technical tests, etc."
  - On AI tools: "some formats intentionally allow them, while others are designed to assess your independent problem-solving without AI tools"
  - "4–6 hours of final interviews with 4–6 people over 1–2 days"
  - "hear from us within one week of your final interviews. Your recruiter may ask for references"

**Accounts**

| Id | Source | Date | Role | What it reports |
|---|---|---|---|---|
| OA1 | [Taro](https://www.jointaro.com/interviews/companies/openai/experiences/senior-frontend-software-engineer-united-states-may-30-2024-no-offer-negative-32a807aa/) | 2024-05 | Senior Frontend, US | a recruiter call, then "two back-to-back technical screens. The first involved refactoring existing code. The second was a systems design question."; "neither of the interviewers was a frontend engineer." Possibly a Glassdoor mirror. |
| OA2 | [Blind](https://www.teamblind.com/post/preparing-for-openai-frontend-engineer-interview-hb1zxdy6) | 2024-10 to 2025-01 | Frontend engineer, poster's updates | the recruiter call was "basic discussion around motivation and all. Why OpenAI?"; "cover edge cases in code refactoring"; "piece of JS code that was supposed to be fixed"; "The cool down period is 1 year." |
| OA3 | [Blind](https://www.teamblind.com/post/openai-front-end-interview-aqcvdppv) | 2023-08 | commenter's own account (c) | "The tech screen was great, it was a react based exercise in coderpad" |
| OA4 | [Blind](https://www.teamblind.com/post/openai-full-stack-swe-interview-experience-4zgmdu7u) | 2023-02 to 2023-03 | full-stack, frontend-leaning | a phone screen with "a simple question that kept increasing in complexity", a presentation of a past project, then an onsite where "System design was a combination of backend & frontend… Coding was frontend." |
| OA5 | [Blind](https://www.teamblind.com/post/open-ai-frontend-interview-dxwheejy) | 2025-04 | FE (p) | "The screening has two rounds - 1) Frontend coding 2) System design/ Architecture." |
| OA6 | [Blind](https://www.teamblind.com/post/openai-agentic-code-interview-up8jhuiq) | 2026-10 | Senior SWE, mainly frontend (p) | after the HR screen, a choice between "Traditional Coding \* 60 min… JavaScript / frontend-focused in my case" and "Agentic Coding \* 60 min \* Python codebase \* AI tools are part of the interview" |
| OA7 | [Taro](https://www.jointaro.com/interviews/companies/openai/experiences/front-end-developer-san-francisco-ca-december-1-2024-no-offer-neutral-550d792a/) | 2024-12* | Front End Developer | "initial video HR screening… did not make it past this point." |

**Proposed table: frontend engineers (thin; final-round rows need "one account" labels)**

| Stage | What happens | Who | Sources |
|---|---|---|---|
| Résumé review | About one week | All | OA-O1 |
| Recruiter or hiring manager call | Motivation and background | All | OA-O1, OA1, OA2, OA6 (p), OA7 |
| Technical screen | Two parts: refactor or fix existing JavaScript, or a React exercise in CoderPad; then a system design or architecture round | Frontend | OA1, OA2, OA3 (c), OA5 (p) |
| Agentic coding option | 60 minutes in a Python codebase with AI tools, offered as an alternative | One plan (2026) | OA6 (p) |
| Final interviews | 4–6 hours with 4–6 people over 1–2 days; one 2023 full-stack account had a project presentation, mixed design and frontend coding | All | OA-O1, OA4 |
| Decision and references | Within a week of the finals | All | OA-O1 |

**Caveats:** accounts disagree on algorithm questions.
- A 2024 recruiter said "absolutely no leetcode style" (Blind `…oh7zqh7i`, comment).
- OA2's poster says "They don't ask LC for FE", while a full-stack commenter expected "one leetcode".

**Re-checked:** OA-O1 ("Formats vary by team", "4–6 hours of final interviews…", on the Wayback copy).

## Datadog

**Readiness: ready for Europe, 2023–2025.** Only one 2021 account and two Blind plans cover the US.

**Official pages**
- DD-O1 https://careers.datadoghq.com/candidate-experience/ :
  - "Please note that one of the steps is expected to happen in person."
  - Six steps: "Initial Screen" (a recruiter and/or the hiring manager); a "Face-to-Face Interview" that "may consist of multiple rounds or panels"; a "Take-Home Project" ("Depending on the role"); an "Executive Interview" ("For some roles"); "Selection"; a "Post-Interview Survey".
- DD-O2 https://careers.datadoghq.com/candidate-experience/interviewing-at-datadog-ai-guidelines/ : "For certain roles, we conduct AI-assisted coding interviews… explicitly told in advance". Otherwise, "you should not use AI tools during live coding interviews".

**Accounts** (Taro links are `https://www.jointaro.com/interviews/companies/datadog/experiences/<slug>/`)

| Id | Source | Date | Role | What it reports |
|---|---|---|---|---|
| DD1 | Taro `senior-frontend-developer-valbonne-october-1-2024-accepted-offer-positive-47d59048` | 2024-10* | Senior FE, offer | "Two algorithmic exercises on CoderPad"; a round "focused on React"; "A single, more challenging algorithmic problem"; system design "on Excalidraw… frontend architecture"; a "one-hour" experience and values interview; "team match"; "All interviews were conducted virtually" |
| DD2 | Taro `senior-frontend-engineer-paris-september-1-2025-accepted-offer-positive-2a1ddfe8` | 2025-09* | Senior FE, offer | "LeetCode-style… medium"; "The exercise is incremental"; system design "in person at the Paris office… frontend and API design"; behavioural; team choice |
| DD3 | Taro `senior-software-engineer-frontend-france-july-1-2023-accepted-offer-positive-b4edf2ad` | 2023-07* | Senior FE, offer | "INTERVIEW WITH RECRUITER (30 min, Zoom)", then five one-hour rounds: a screen, "FRONTEND SYSTEM DESIGN", "REACT LIVE CODING", "LIVE CODING (AGAIN)", "HIRING MANAGER INTERVIEW"; then placement interviews with two teams; "3 months" overall |
| DD4 | Taro `senior-software-engineer-frontend-france-october-1-2024-accepted-offer-positive-3bd8f875` | 2024-10* | Senior FE, offer | "choose between a take-home frontend project or a live React coding session"; a product-focused coding round; "Experience & Values"; a "30-minute" team match |
| DD5 | Taro `software-engineer-front-end-paris-september-1-2024-accepted-offer-positive-ba0b1dd8` | 2024-09* | FE, offer | a recruiter, then five one-hour rounds (design, a frontend coding test, a more in-depth coding test, experience and values), then team matching |
| DD6 | Taro `frontend-engineer-madrid-february-1-2024-accepted-offer-positive-a8de35e5` | 2024-02* | FE, offer | a "first interview that can disqualify you" ("40 minutes"), then "four 1-hour interviews" (algorithms, "HTML and CSS test with React", system design, project and values); the offer came "after a visit to the Madrid office" |
| DD7 | [LC 7080135](https://leetcode.com/discuss/interview-experience/7080135) | 2025-05 to 2025-06 | Senior FE, Paris role | "1st Round: DSA", "2nd Round: React UI Coding", "3rd Round: Experience Interview", "4th Round: Values Interview"; team match was scheduled, then the offer was withdrawn |
| DD8 | Taro `senior-frontend-engineer-madrid-community-of-madrid-july-1-2025-no-offer-positive-f1c8b321` | 2025-07* | Senior FE | "two coding interviews, one cultural interview, one with the project manager, and one system-design interview." |
| DD9 | Taro `senior-frontend-developer-lisbon-lisbon-district-november-23-2025-no-offer-positive-1a88bdda` | 2025-11 | Senior FE | "HR screening", "Leetcode exercises on call", "On-site interview… a feature or fixing a major bug." |
| DD10 | Taro `front-end-software-engineer-brazil-january-25-2024-accepted-offer-positive-c193fd19` | 2024-01 | FE, offer | "2 LeetCode-style questions (Easy/Medium)", then "Medium/Hard" plus "System Design", then "FE Code Interview: React" and "Manager/Culture" |
| DD11 | Taro `software-engineer-front-end-new-york-ny-july-1-2021-no-offer-positive-2833c42b` | 2021-07* | FE, New York | a "tech screen over Zoom", a "take-home test… 4-6 hours", then an onsite with a "front-end focused" coding round, system design and "Several conversational interviews" |
| DD12 | Taro `senior-frontend-engineer-paris-april-1-2021-accepted-offer-positive-f33dca98` | 2021-04* | Senior FE, offer | live coding, a "Take-home assignment", live coding again, frontend system design, the hiring manager |
| DD13 | [Blind](https://www.teamblind.com/post/datadog-senior-front-end-interview-ad7w4qby) | 2021-12 | Senior FE (p) | "1 algo, 1 pair programming, 1 system design, 1 HM"; a Datadog-badged commenter: "Phone screen for both FE and BE is indeed 2 LC med" |
| DD14 | [Blind](https://www.teamblind.com/post/datadog-frontend-onsite-interview-zbvwu8be) | 2024-02 | FE (p) | "5 interviews in all (Coding, React, System Design, Leadership, and Experience interviews)" |

**Proposed table: experienced frontend engineers, Europe, 2023–2025**

| Stage | What happens | Who | Sources |
|---|---|---|---|
| Recruiter screen | About 30 minutes: background and a past project | All | DD-O1, DD1–DD6, DD9, DD10 |
| Technical screen | 40–60 minutes in CoderPad: two LeetCode easy or medium problems in JavaScript or TypeScript; it works as a gate | All | DD1, DD3–DD6, DD10, DD13 (c) |
| React live coding | One hour: render JSON or a table, then add search, sorting or filters step by step | Most | DD1, DD2, DD3, DD5, DD6, DD7, DD8, DD10 |
| Second coding round | One hour, harder or product-focused, with follow-ups | Most | DD1, DD3, DD4, DD5, DD8, DD10 |
| Frontend system design | One hour on Excalidraw: UI, API endpoints and performance; in person at an office in some loops | All | DD1–DD6, DD8, DD10, DD11 |
| Experience and values, hiring manager | A project deep dive and behavioural questions; two separate rounds in one account | All | DD1–DD8, DD10 |
| Take-home project | 4–10 hours in 2021 loops; offered instead of React live coding in one 2024 account | Some | DD-O1, DD4, DD11, DD12 |
| Team match | 30-minute calls with two teams | After passing | DD1–DD7 |

**Caveats:**
- The round order varies.
- The official page expects one step in person; DD1 says everything was virtual, while DD2, DD6 and DD9 had an in-person step.
- The official page mentions an executive interview "for some roles", but no frontend account reports one.
- No account mentions an AI-assisted coding interview.

**Re-checked:** DD-O1 ("one of the steps is expected to happen in person", "Take-Home Project") and DD3 (three round names).

## ElevenLabs

**Readiness: thin.** There is no complete loop for a purely frontend title, and the assessment formats differ.

**Official page**
- EL-O1 https://elevenlabs.io/careers (FAQ): "most processes include a pre-screen, virtual interviews (sometimes with a skills assessment like a take-home or case study), a hiring manager conversation, and a final round with a founder or Bar Raiser." The job posts on Ashby contain no process text.

**Accounts**

| Id | Source | Date | Role | What it reports |
|---|---|---|---|---|
| EL1 | [Aced](https://www.aced.io/experiences/eleven-labs-senior-frontend-engineer-interview-925c04) | interview date field 2026-07 | full-stack, frontend-leaning, senior, UK; in progress | a first-person account whose overview alone is readable: "They send you a technical assessment to do that takes 90mins. Then a recruiter screen… Then a technical round that includes live coding collaborating with the interviewer to fix a practical problem." |
| EL2 | [Aced](https://www.aced.io/experiences/eleven-labs-frontend-engineer-interview-c79e72) | 2025-11* | full-stack, frontend-leaning, US, rejected | "a recruiter screen, a LeetCode-style Python round, a practical front-end debugging round in a small React app, and then a final decomposition interview"; "no system design at all". It reads like an edited summary: three ElevenLabs entries were created within four minutes. |
| EL3 | [Taro](https://www.jointaro.com/interviews/companies/elevenlabs/experiences/full-stack-engineer-united-states-august-1-2024-no-offer-positive-675ce47d/) | 2024-08* | full-stack, US | a technical recruiter call; "React and LeetCode problems on CoderPad.io" ("Fix React bug", "Finish React component"); a text-to-speech React component built with an engineer; a final interview with the "Head of Organization" was not reached |
| EL4 | [Taro](https://www.jointaro.com/interviews/companies/elevenlabs/experiences/full-stack-engineer-poland-august-1-2024-accepted-offer-positive-766f1de3/) | 2024-08* | full-stack, Poland, offer | "Async LeetCode easy/medium question and some React knowledge check"; "Coding interview… changing constraints"; "System Design interview." |
| EL5 | [Taro](https://www.jointaro.com/interviews/companies/elevenlabs/experiences/full-stack-engineer-united-kingdom-may-1-2025-accepted-offer-positive-8ac03948/) | 2025-05* | full-stack, UK, offer | "A take-home technical exercise; A technical interview; A product interview; A call with the CTO"; "TypeScript and React"; "one month" |

Not used: an Aced question bank, which lists questions and is not an account. A backend-leaning Aced entry was also left out.

**Proposed table: full-stack, frontend-leaning engineers, 2024–2026 (thin)**

| Stage | What happens | Who | Sources |
|---|---|---|---|
| Recruiter call | Background and motivation; after the assessment in one account | All | EL-O1, EL1, EL2, EL3, EL5 |
| Coding assessment | A 90-minute assessment, an async CoderPad task (LeetCode plus React), a Python LeetCode round or a take-home | All, format varies | EL1–EL5 |
| Practical live coding | Fix a React bug, finish a component, or build a text-to-speech component | Most | EL1, EL2, EL3 |
| Product decomposition or system design | Turn a workflow into a product design | Most | EL2, EL4, EL5 |
| Leadership call | The CTO or a head of organization; a founder or Bar Raiser per the official FAQ | Late stage | EL-O1, EL5 (EL3 not reached) |

**Re-checked:** EL-O1 ("a pre-screen, virtual interviews", "a final round with a founder or Bar Raiser").

## Intuit

**Readiness: ready.** The official page and nine or more completed frontend accounts agree on this order: a craft demonstration, then technical or assessor rounds, then the hiring manager. Two rows need flags: the AI round (mostly plans) and team matching (one source).

**Official pages**
- IN-O1 https://www.intuit.com/careers/hiring-process/ (undated, for all roles; plain curl gets 429, node fetch works):
  - "The interview day usually begins with set-up and a craft demonstration, followed by interviews with potential team members and colleagues. In some circumstances, adjustments may be made to the interview process."
  - "Interview Set-Up": "15 min, Engineers 90 mins"; engineers spend it "solving a technical question on their own to present during the onsite craft demo".
  - "Craft Demonstration": "60 min | 4 Hiring team members".
  - "Assessors Interview": "45 min | 2 Assessors", with "follow-up questions from your case study".
  - "Team Member Interview": "30 min | 1 assessor".
  - "Manager Interview": "30-60 min | 1 people manager".
- IN-O2 https://www.intuit.com/blog/social-responsibility/job-readiness/how-to-ace-your-software-engineer-interview-at-intuit/ (updated 2025-07-22, by a principal engineer in India, not frontend). Use it only for the stage names: "Intuit's Assess for Awesome (A4A) process" and "Design presentation: Lasting 75 minutes".

**Accounts**

| Id | Source | Date | Role | What it reports |
|---|---|---|---|---|
| IN1 | [LC 7320927](https://leetcode.com/discuss/post/7320927/) | 2025-11 | Senior SWE Frontend, offered SWE-2, India | "Round 1 - TPI" ("Duration: 75 minutes"); "I was given a GitHub codebase one day prior to this round."; "they will give you 8 different story tasks and you can implement any two"; then rounds of 90, 60, 30 and 30 minutes; "Round 2 to Round 5 happened on same day with a gap of 10 minutes." |
| IN2 | [LC 6770567](https://leetcode.com/discuss/post/6770567/) | 2025-05 | Senior Frontend, India | "TPI Phone Interview [1.5 hours scheduled, lasted ~45 minutes]": JavaScript promises, classes, a todo machine-coding task, then "GenAI, RAG, LLM, Finetuning" |
| IN3 | [LC 4167001](https://leetcode.com/discuss/post/4167001/) | 2023-10 | SE2 Frontend | "I was given around a week+ time to prepare well"; "1st was craft demostation, 2nd was assessor round, 3rd was team member round and 4th was manager round." |
| IN4 | [LC 4980666](https://leetcode.com/discuss/post/4980666/) | 2024-04 | SE2, Bangalore, frontend work, offer | "Craft Demo Round ~45 mins"; "Technical Interview I ~45 mins"; "Technical Interview II ~30 mins"; "Hiring Manager Round ~30" |
| IN5 | [LC 2052880](https://leetcode.com/discuss/post/2052880/) | 2022-05 | Frontend, rejected | "The recruitment team will share the small project requirements, that need to be completed before the interview process."; "Need to design chessboard layout using HTML, CSS, JS"; "the last round is with Hiring Manager." |
| IN6 | [LC 1618037](https://leetcode.com/discuss/post/1618037/) | 2021-10 | SDE2 frontend, Bangalore, offer | "Recruiter shared a document containing a rough design of an app a day before the interview."; then "DS & Algo, 1 hour", "JavaScript, 1 hour", "Hiring Manager, 30 minutes" |
| IN7 | [LC 3851186](https://leetcode.com/discuss/post/3851186/) | 2023-07 to 2023-08 | SSE full stack (React craft task), Bengaluru | "a full stack assignment to be completed within 3-4 days"; an assessor round with "Two panel members"; a team member round |
| IN8 | [Blind](https://www.teamblind.com/post/final-interview-for-front-end-engineer-at-intuit-new-coding-format-5jbsqcv5) | 2024-10 | Front End Engineer SDE-II (p) | the recruiter's plan: "Coding Exercise with the A4A Panel (90 minutes) - Work through 2-3 coding stories, with one focusing on AI"; "Programming Fundamentals & System Design Assessment (60 minutes)"; "AI Proficiency with an AI Assessor (30 minutes)"; "Customer Obsession & Boundaryless Engineering with the Hiring Manager (30 minutes)"; "GitPod" |
| IN9 | [Blind](https://www.teamblind.com/post/intuit-a4a-interview-staff-swe-fe-bay-area-8-yoe-8ppjug5d) | 2026-08 | Staff SWE-FE, Bay Area (p) | "4 rounds (90 min Craft demo + 1 hour Technical + 30 min AI assessor + 30 min Manager Discussion)". The same text is on LC 8494313. |
| IN10 | [Blind](https://www.teamblind.com/post/intuit-team-matching-53d3l6c6) | 2025-10 | Frontend Engineer, after the loop | "The recruiter mentioned I'll be moving forward to the team matching stage."; a Credit Karma-badged commenter: "Intuit won't give you a job offer until you find a match" |
| IN11 | [Taro](https://www.jointaro.com/interviews/companies/intuit/experiences/staff-frontend-engineer-india-january-8-2025-no-offer-negative-8dde40c5/) | 2025-01 | Staff Frontend, India | "one screening round followed by four technical rounds"; "AI Assessment: Conducted by one interviewer." |
| IN12 | [Taro](https://www.jointaro.com/interviews/companies/intuit/experiences/staff-frontend-engineer-united-states-august-1-2024-no-offer-negative-3a91fb0d/) | 2024-08* | Staff Frontend, US | "recruiter and tech phone screens"; "The day started with 90 minutes of coding. You were given product requirements to build a front-end app against in your local dev environment."; then a demo to a panel, two IC modules and an EM behavioural module, a "six-hour on-site" |
| IN13 | [Taro](https://www.jointaro.com/interviews/companies/intuit/experiences/senior-software-engineer-frontend-bengaluru-march-1-2022-no-offer-negative-93ee0992/) | 2022-03* | Senior SWE Frontend | "1st round: CRAFT round. An assignment would be given, which you need to complete based on your availability."; a panel of five, a DSA plus JS/React round, a round "with an architect", then the hiring manager |
| IN14 | [Taro](https://www.jointaro.com/interviews/companies/intuit/experiences/front-end-engineer-intern-mountain-view-california-november-3-2025-no-offer-positive-f1fb2dd1/) | 2025-11 | FE intern | an online assessment with "Two LeetCode style medium questions" and two multiple-choice questions on GenAI and backend development |
| IN15 | [Taro](https://www.jointaro.com/interviews/companies/intuit/experiences/senior-fullstack-engineer-united-states-december-1-2023-accepted-offer-positive-09501015/) | 2023-12* | Senior full-stack with React questions, US, offer | an engineer "handed me the prompt"; "The next interview was a demo of my implementation to the panel."; two deep dives and a behavioural round with the hiring manager |

Minor sources:
- Taro `senior-front-end-developer-united-states-april-1-2022-no-offer-negative-cd8e79ed`: "Quick call with HR." "1 hour coding screen."
- Blind `…tknnxvj6` (2024-08, p): "Prompt will be provided at the time of interview, it's not a take home assessment."
- Blind `…pqztez7j` (2022-10): "I received the craft demo on the spot".

Not used:
- LC 7313117 and LC 6707615 (general software engineer loops with no frontend content);
- LC 6172529 (an A4A plan with no role).

**Proposed table: experienced frontend engineers, US and India, 2022–2026**

| Stage | What happens | Who | Sources |
|---|---|---|---|
| Recruiter or HR call | A short check of background | All | IN12, Taro `…cd8e79ed` |
| Technical phone interview | 45–75 minutes: JavaScript output, closures, promises, performance and security, React and one DSA problem; 2025 accounts add AI questions | Most | IN1, IN2, IN3, IN11, IN12 |
| Craft brief | The task arrives a day to a week ahead, or is built during the onsite (60–90 minutes) | All | IN-O1, IN1, IN3, IN5, IN6, IN7, IN12, IN13, IN15 |
| Craft demonstration | 45–90 minutes: present the build, walk through the code, add features live, answer questions on tests; recent plans describe two or three user stories, one about AI | All | IN-O1, IN1, IN3–IN9, IN11, IN12, IN13, IN15 |
| Technical or assessor rounds | One or two rounds of 30–60 minutes: JavaScript polyfills, promises, React internals, security, DSA, changes to the craft code | All | IN-O1, IN1, IN3–IN8, IN12, IN13 |
| AI round | 30 minutes with an AI assessor, 2024 onward | Mostly plans; one completed account | IN8 (p), IN9 (p), IN11 |
| Team member round | 30 minutes on values | 2023 accounts | IN-O1, IN3, IN7 |
| Hiring manager | About 30 minutes on projects and behaviour | All | IN-O1, IN1, IN4, IN5, IN6, IN8, IN9, IN11, IN12, IN13, IN15 |
| Team matching | After positive feedback, before the offer | One account | IN10 |

Interns: an online assessment with two LeetCode-medium questions and two multiple-choice questions (IN14, one account).

**Caveats:**
- The official page is undated. Its durations differ from the 2024+ plans (90, 60, 30 and 30 minutes), and it omits the phone interview and the AI round.
- The QuickBooks commenter in 2021 had no DSA rounds; other accounts did.
- Two accounts report down-levelling (IN1 and Blind `…x5rf3u0v`).
- IN11, IN12 and `…cd8e79ed` may be Glassdoor mirrors.

**Re-checked:** IN-O1 ("begins with set-up and a craft demonstration", "Craft Demonstration", "Assessors Interview") and IN1 (the codebase and same-day sentences).

## ServiceNow

**Readiness: ready for UI and frontend roles in India; thin for the US and Amsterdam.**

**Official page**
- SN-O1 https://careers.servicenow.com/how-we-hire/ returns a Cloudflare challenge. Read the Wayback copy instead: https://web.archive.org/web/20261007040159/https://careers.servicenow.com/how-we-hire/
  - It lists three steps: "Application", "Interview" and "Decision".
  - "Interview process and rounds vary by position. You may also be asked to do a technical coding assessment or presentation"
  - "the hiring team will debrief and make a final decision"

**Accounts**

| Id | Source | Date | Role | What it reports |
|---|---|---|---|---|
| SN1 | [Medium](https://medium.com/@karunakumari000532/my-servicenow-software-engineer-ui-interview-experience-2025-23f315b960dc) | 2025-09 | Software Engineer (UI), probably India; rejected after a hold | "Round 1: The Screening Call"; "Round 2: JavaScript and React Fundamentals", including "writing polyfills, such as for the map function"; "Round 3: Deep Dive into JavaScript"; "Round 4: Hiring Manager" |
| SN2 | [LC 6508672](https://leetcode.com/discuss/post/6508672/) | 2025-03 | Software Engineer (UI) IC2, selected | "I was given three coding problems and a few JavaScript output-based questions."; a second round the same day on HLD and LLD; the hiring manager asked "to design a voting poll system and display the results in charts as percentages."; a "Final Round (Director)" |
| SN3 | [LC 4096867](https://leetcode.com/discuss/post/4096867/) | 2023-09 | Frontend IC2 | "Round-1(1hr): Basic JS, HTML, CSS questions with basic problem solving and DSA."; "Round-2(1hr): 3 DSA questions"; "Round-3(1hr-HM)", including "ES6+ Map vs Object"; "Selected but position got filled." |
| SN4 | [Taro](https://www.jointaro.com/interviews/companies/servicenow/experiences/senior-software-engineer-frontend-hyderabad-march-1-2022-no-offer-positive-83f4f1a9/) | 2022-03* | Senior SWE Frontend | four rounds: JavaScript; trees and arrays; "I was asked to design a small web app and implement its basic functionality using vanilla JavaScript."; a "techno-managerial" hiring manager |
| SN5 | [Taro](https://www.jointaro.com/interviews/companies/servicenow/experiences/frontend-engineer-hyderabad-february-1-2024-no-offer-positive-1799e9aa/) | 2024-02* | Frontend Engineer | one interview with a coding problem and machine coding, with "options to use React, Angular, or vanilla JS, HTML, and CSS" |
| SN6 | [Taro](https://www.jointaro.com/interviews/companies/servicenow/experiences/senior-software-engineer-frontend-santa-clara-ca-january-1-2023-no-offer-positive-b6750124/) | 2023-01* | Senior SWE Frontend, US | "One recruiter call, then one HackerRank screen, followed by three technical rounds." |
| SN7 | [Taro](https://www.jointaro.com/interviews/companies/servicenow/experiences/senior-front-end-engineer-santa-clara-ca-january-1-2024-no-offer-neutral-902ecc84/) | 2024-01* | Senior FE, US | "four interviews, all of which included coding questions, except for the initial recruiter screen"; "All questions focused on algorithms." |
| SN8 | [Blind](https://www.teamblind.com/post/servicenow-frontend-swe-ic2-interview-n7rqq1v2) | 2025-11 | Frontend SWE IC2 (p) | "1st round (45 minutes) - with Hiring manager behavorial + code along"; "2nd round (90 minutes) - panel style "algorithmic" + system design" |
| SN9 | [LC 6822245](https://leetcode.com/discuss/post/6822245/) | 2025-06 | Senior Frontend, California (p) | "Round 1 (45 mins) with the hiring manager" |
| SN10 | [Blind](https://www.teamblind.com/post/ServiceNow-rounds-for-Software-engineer-front-end-focused-DZOzBuaO) | 2022-10 | front-end-focused, Amsterdam (p, with a later update) | a "10 minute phone call with the recruiter"; "2 more rounds after this, a 2-hour and 1-hour technical interview"; the hiring manager round "had a lot of behavioural questions" |
| SN11 | [LC 7406202](https://leetcode.com/discuss/post/7406202/) | 2025-12 | Staff SWE full stack, rejected | "Interview is scheduled for 1 hr"; "Frontend question related to drag and drop events" |

Unreadable: LC 7711064 (a 2026 frontend developer post). Its body returns null through every route, and the page sits behind Cloudflare.

**Proposed table: UI and frontend engineers in India, IC2 to senior, 2022–2025**

| Stage | What happens | Who | Sources |
|---|---|---|---|
| Screening call | A short call | All | SN1, SN4 |
| JavaScript fundamentals | One hour: closures, promises, polyfills and output prediction, or JavaScript, HTML and CSS with DSA | All | SN1, SN2, SN3, SN4 |
| Second technical round | Deeper JavaScript, DSA, or high- and low-level design | All | SN1, SN2, SN3, SN4 |
| Design or machine coding | A small web app in plain JavaScript, or a UI built in React, Angular or plain JavaScript | Some | SN4, SN5 |
| Hiring manager | One hour mixing JavaScript questions (Map versus Object), a design task and behavioural questions | All | SN1, SN2, SN3, SN4 |
| Director | A final round | One account | SN2 |

For the US the evidence is thin:
- a recruiter call, a HackerRank screen (one account), then three or four one-hour coding rounds focused on algorithms (SN6, SN7);
- two plans put a 45-minute hiring manager round first (SN8, SN9).

**Caveats:**
- SN7 had only algorithm questions, while SN1 was about JavaScript and React.
- System design appears in SN2 and SN8 but not in SN7.
- The hiring manager comes first in the US plans and last in the India accounts.

**Re-checked:** SN-O1 ("Interview process and rounds vary by position") and SN3 ("3 DSA questions", "Map vs Object").

## Waymo

**Readiness: thin.** The evidence is the official page, one complete frontend account, one employee comment and one SWE account with a UI round.

**Official page**
- WM-O1 https://careers.withwaymo.com/how-we-hire :
  - "This initial conversation will either be with a sourcer or recruiter."
  - "the next step includes 1-2 behavioral and/or technical phone or video interviews with a potential peer or manager."
  - At the virtual onsite, "you'll meet with up to five interviewers, including potential teammates and cross-functional partners. Expect each of these meetings to last approximately 45 minutes."
  - "Unless specifically noted in the instructions, the use of AI tools or LLMs is not permitted."

**Accounts**

| Id | Source | Date | Role | What it reports |
|---|---|---|---|---|
| WM1 | [PracHub](https://prachub.com/interview-experiences/waymo-senior-frontend-engineer-interview-experience-rejected-30-minutes-after-pushing-on-the-process) | interview 2026-05, published 2026-08 | Senior frontend, simulation team, rejected; "Curated and edited by PracHub" | a phone screen with a tree filter, then a UI that renders the filtered tree; "The VO (virtual onsite) had 4 rounds, all frontend focused.": Angular debugging "based on a few issues reported by users", "A Promise-related coding question, pure TS/JS.", "System design: design an AI chat model, frontend focused.", "Autocomplete search bar with debounce." |
| WM2 | [LC 7949696](https://leetcode.com/discuss/post/7949696/) | 2026-04 | Software Engineer, fleet response (not a frontend title), rejected | "Recruiter Screen", "Coding Round 1 java", "JavaScript / UI Round" (a generic tree viewer, "like a file explorer"), "Hiring Manager Round", "DSA Round" |
| WM3 | [Blind](https://www.teamblind.com/post/waymo-frontend-web-interview-xcpohaau) | 2023-03 | Waymo-badged commenter's own interview (c), year not stated | "2 Leetcode + 2 FE Qs"; "Just Angular and JavaScript."; "My phone interview was leetcode."; "Disclaimer: varies based on the interviewer." |
| WM4 | [Taro](https://www.jointaro.com/interviews/companies/waymo/experiences/software-engineering-intern-united-states-september-12-2022-no-offer-positive-279c47ab/) | 2022-09 | SWE intern | "two back-to-back technical interviews, each lasting 45 minutes"; "One interview focuses more on specific technologies, such as JavaScript" |

**Proposed table: frontend engineers, US, 2023–2026 (thin; most rows "one account")**

| Stage | What happens | Who | Sources |
|---|---|---|---|
| Recruiter or sourcer call | An initial conversation | All | WM-O1, WM2 |
| Technical screen | One or two phone or video interviews; a tree filter rendered as UI in one account, a LeetCode problem in another | All | WM-O1, WM1, WM3 (c) |
| Virtual onsite | Up to five interviews of about 45 minutes. One senior frontend loop had four frontend rounds: Angular debugging, a Promise coding question, frontend system design (an AI chat) and an autocomplete with debounce | All | WM-O1, WM1 |
| Algorithms | LeetCode-style rounds in some loops | Some | WM2, WM3 (c) |
| Hiring manager | A conversation | One SWE account | WM2 |

**Caveats:**
- The phone screen was frontend work in WM1 but a LeetCode problem in WM3.
- WM1 and WM3 mention Angular, while WM2's UI round used no framework.
- WM1 was edited by PracHub, and its practice list is PracHub's own addition.

**Re-checked:** WM-O1 ("up to five interviewers", "approximately 45 minutes", the AI rule) and WM1 ("had 4 rounds, all frontend focused", "design an AI chat model").

## Revolut

**Readiness: ready.** About 13 first-hand accounts from 2022 to 2025, across six European hubs, agree on the shape. Almost all of them are on Taro. revolut.com blocks automated reads (403) and is not cited.

**Official sources** (no process page could be read)
- RV-O1, the Revolut Tech post of 2025-10-16, https://medium.com/revolut/building-the-web-that-moves-money-inside-web-engineering-at-revolut-3dd4fb78fbfa . It lists no stages: "our interviews place candidates in real-world scenarios, asking them to implement features standard to web engineers… We don't focus on cracking obscure JavaScript puzzles".
- RV-O2, the Bar Raiser video of 2025-06-12, https://www.youtube.com/watch?v=zreFxR7MRuI (description only):
  - "Our Bar Raiser interview is where we get to know how you work and what drives you."
  - It "helps us understand how your previous work experience and decision-making abilities align with Revolut's culture."

**Accounts** (Taro links are `https://www.jointaro.com/interviews/companies/revolut/experiences/<slug>/`)

| Id | Source | Date | Role | What it reports |
|---|---|---|---|---|
| RV1 | Taro `frontend-developer-warsaw-masovia-april-1-2025-no-offer-neutral-71032bb4` | 2025-04* | mid, React | "Tech theory with HR - This lasted around 15 minutes"; "a 1-hour task involving fetching data from a source"; team fit and Bar Raiser were planned |
| RV2 | Taro `frontend-engineer-barcelona-may-1-2025-no-offer-neutral-3c58f9b9` | 2025-05* | FE | "Recruiter call"; "Pairing session: Use a service API with authentication to display data in a React component"; "FE system design: Suggest product features and design APIs"; "Team fit call" |
| RV3 | Taro `frontend-engineer-barcelona-march-1-2025-no-offer-neutral-fd597039` | 2025-03* | FE | a screening interview with some JavaScript questions; "LeetCode similar questions (three questions)"; "React-related question like a real scenario (pair programming)" |
| RV4 | Taro `senior-frontend-developer-poland-may-1-2024-no-offer-negative-b869132a` | 2024-05* | senior FE | "Offline algorithms HackerRank: 3 tasks for 110 minutes"; live coding on API calls, data mapping and rendering, error handling and unit tests; "Design Revolute's physical card delivery system. Need to design API, Frontend, and overall system" |
| RV5 | Taro `senior-frontend-engineer-madrid-april-1-2024-no-offer-neutral-c98763a9` | 2024-04* | senior FE | a HackerRank test with "three tasks. You had 85 minutes", "a round with HR", then "code online a small React app" |
| RV6 | Taro `senior-frontend-engineer-react-georgia-february-7-2024-no-offer-neutral-9a9832e4` | 2024-02 | senior FE, React | HackerRank, "1.5 hours", "within 8 days"; "1 hour of live coding in CodeSandbox… fetch data… display it in React, then add pagination and filtering"; system design and team fit were planned |
| RV7 | Taro `web-engineer-krakow-september-1-2023-no-offer-neutral-349ae671` | 2023-09* | web engineer | a recruiter, "Three HackerRank tasks", React components and three JavaScript questions, then "a Design interview to determine my level (Mid or Senior)" |
| RV8 | Taro `senior-front-end-developer-lisbon-lisbon-district-april-24-2023-no-offer-positive-025ce14f` | 2023-04 | senior FE | "two technical rounds with interviewers and one screening test before them"; "an existing React app needed to be improved" |
| RV9 | Taro `senior-frontend-engineer-berlin-april-1-2022-accepted-offer-positive-aa0a7d87` | 2022-04* | senior FE, offer | "3 HackerRank problems (easy, medium, and hard)", a technical interview on React, state management, software principles and design, then "culture fit" |
| RV10–RV13 | Taro `frontend-developer-portugal-november-5-2025-no-offer-neutral-c06a19bc`, `front-end-developer-krakow-january-14-2025-no-offer-neutral-7759dda2`, `senior-frontend-software-engineer-porto-oporto-may-1-2024-no-offer-neutral-90611f7c`, `frontend-developer-lisbon-lisbon-district-november-1-2022-no-offer-negative-34908269` | 2022–2025 | screen-only accounts | a HackerRank JavaScript test ("sliding window"; "solve two out of three"; "85 minutes"; "15 days to resolve", "1 hour and 25 minutes") |
| RV14 | [Blind](https://www.teamblind.com/post/revolut-front-end-interview-ryrerkjw) | 2022-04 | Berlin, 5 YOE | the poster (p): "2 rounds tech interview"; a reply that reads like the poster: "LC, js fundamentals, react etc. As I know that there wont be a system design"; a commenter: "I failed at the bar raiser… It was Amazon style LP" (the company is not named in the comment; treat it as ambiguous) |
| RV15 | [Blind](https://www.teamblind.com/post/what-to-expect-in-revolut-frontend-engineer-interview-screening-technical-team-bar-raiser-qpgmtoum) | 2026-03 | FE (p) | "Recruiter / Screening round", "Technical interview – focused on Core Frontend (JS/React) + System Design", "Team fit", "Bar Raiser round" |

Not used: a Taro entry written in the company's voice (`…846428c6`).

**Proposed table: frontend engineers in European hubs, 2022–2025**

| Stage | What happens | Who | Sources |
|---|---|---|---|
| Recruiter or HR screen | Background and salary; some recruiters ask a few JavaScript questions | All | RV2, RV3, RV5, RV7, RV12, RV15 (p) |
| HR theory check | About 15 minutes of React and event-loop questions | One account (mid level) | RV1 |
| HackerRank assessment | Three algorithm tasks in 85–110 minutes, done at home before a deadline; sometimes before the recruiter call | Most | RV3–RV7, RV9–RV13 |
| Live coding | About an hour of React and TypeScript: fetch from an API and render with loading and error states, or extend a small app | All | RV1–RV9 |
| System design | Product features and API contracts, or a whole system such as card delivery | Mid and senior, 2023–2025 | RV2, RV4, RV7; planned in RV6 and RV15 |
| Team or culture fit | Behavioural | All | RV2, RV9; planned in RV1, RV6, RV15 |
| Bar Raiser | Culture and decision-making | All | RV-O2 and plans; no first-hand account from 2022 on |

**Caveats:**
- The only offer (RV9, 2022) had neither a system design round nor a Bar Raiser.
- The order of the HackerRank test and the recruiter call varies.

**Re-checked:** RV4 ("3 tasks for 110 minutes", "physical card delivery system").

## Spotify

**Readiness: ready for web engineers in the US and Canada.** The detailed accounts are from 2021–2023. The European evidence is full-stack accounts from 2022 and a 2020 Stockholm plan.

**Official pages** (the old `/how-we-hire` URLs redirect here)
- SP-O1 https://www.lifeatspotify.com/start-your-journey :
  - "First, you'll have a video or telephone interview with one of our recruiters… a second interview with one or two members of the team. The final round usually involves meeting multiple band members"
  - "one will lead and the others will shadow."
- SP-O2 https://www.lifeatspotify.com/start-your-journey/faq : "for the more technical stuff, CoderPad and Mural". It also lists the values Spotify assesses.

**Accounts** (Taro links are `https://www.jointaro.com/interviews/companies/spotify/experiences/<slug>/`)

| Id | Source | Date | Role | What it reports |
|---|---|---|---|---|
| SP1 | [Blind](https://www.teamblind.com/post/spotify-final-round-web-interview-qyug2zqx), [Blind](https://www.teamblind.com/post/weak-system-design-interview-for-spotify-chances-of-no-hire-00wjs6rg) | 2022-04 | Web Engineer, personalization, offer | "First round was a chat with a recruiter"; a quoted description of the round: "JavaScript, DOM, CSS fundamentals deep-dive as well as application of web native APIs"; the final round was DS/algo, web dev, behavioural/values and system design; the web task was to build a form that fetches "data from Spotify API" and renders the result in the DOM |
| SP2 | [Blind](https://www.teamblind.com/post/spotify-web-engineer-interview-hntex8n7), [Blind](https://www.teamblind.com/post/spotify-senior-web-engineer-interview-k27u5vu7) | 2021-10 (p), 2022-04 | Senior Web Engineer, hired | phone screen: "I was told it's 75mins"; later: "I'm at Spotify now… Algo questions, build a feature with JS/HTML/CSS. There was no debugging round." |
| SP3 | [Blind](https://www.teamblind.com/post/spotify-fe-onsite-interview-what-to-expect-in-the-rounds-mnzdgooe) | 2022-05 | FE (p) | "Web Domain / Web System Design / Web Programming / Values" |
| SP4 | Taro `senior-web-engineer-united-states-august-30-2022-no-offer-neutral-e746c706` | 2022-08 | Senior Web Engineer | a "15-minute call with a technical recruiter"; round two with JavaScript and domain questions and a LeetCode question; onsite: "1 hour domain questions / 1 hour LeetCode medium / 1 hour values interview with the hiring manager / 1 hour systems design" |
| SP5 | Taro `web-engineer-toronto-on-april-1-2022-no-offer-positive-a2f8744e` | 2022-04* | Web Engineer | an HR call, a one-hour round with "basic JavaScript and CSS questions" and a "LeetCode Easy", then "4 interviews, of which 3 were technical. All were 1 hour long" |
| SP6 | Taro `web-engineer-new-york-ny-april-1-2023-no-offer-negative-5bce68df` | 2023-04* | Web Engineer | "First round: LC type question"; then behavioural, system design, DS and algorithms and a "Web code specific round" |
| SP7 | Taro `senior-web-engineer-united-states-september-1-2023-no-offer-negative-890b3570` | 2023-09* | Senior Web Engineer | "A brief recruiter call / A technical screen / Four final interviews"; "Build an app in vanilla JS, HTML, and CSS." |
| SP8 | Taro `web-engineer-united-states-may-1-2022-no-offer-neutral-70fb53e8` | 2022-05* | Web Engineer | a five-minute HR call, then "a live coding session with an engineer": "a mockup of two buttons… recreate it in HTML/CSS" (possibly a Glassdoor mirror) |
| SP9 | Taro `software-engineer-new-york-ny-february-1-2025-no-offer-positive-0dc5e197` | 2025-02* | Software Engineer, web rounds | "LeetCode Easy for a tech screen"; onsite: "Systems design / LeetCode Medium / Front-end interview question / Values interview"; "Simulate traffic lights using plain HTML, JS, and CSS." |
| SP10 | Taro `full-stack-engineer-berlin-june-1-2022-no-offer-negative-22da0651`, `full-stack-software-engineer-belgium-november-29-2022-no-offer-positive-3488a86e`, `full-stack-software-engineer-new-york-ny-september-1-2022-no-offer-positive-4a2958e7` | 2022 | full-stack with web rounds | a coding challenge, then an onsite with "Web Domain: Draw a traffic light…", programming, system design and values; "domain, programming, design, and culture"; a "75-minute technical screen via CoderPad" |
| SP11 | [Blind](https://www.teamblind.com/post/hi-guys-i-have-an-upcoming-interview-for-spotify-as-web-developer-stockholm-need-help-with-preparation-can-u-help-n6dpf5mu) | 2020 | web developer, Stockholm (p) | "algo, system design, values and js web round" |
| SP12 | Taro `web-developer-sweden-march-26-2025-no-offer-neutral-d9268ca5`; [Medium](https://medium.com/@christinacook/interning-at-spotify-as-a-web-developer-5a1b72ee24b2) | 2025, 2018 | interns | a whiteboard exam and live coding with three people watching; a 30-minute behavioural interview and a "90 interview on CSS/JavaScript questions" |
| SP13 | [Blind](https://www.teamblind.com/post/web-engineering-interview-spotify-gew40ym6) | 2026-03 | full-stack (p) | "One interview will be on web engineering topics." |

**Proposed table: web engineers**

| Stage | What happens | Who | Sources |
|---|---|---|---|
| Recruiter call | 5–30 minutes: background and why Spotify | All | SP-O1, SP1, SP4, SP5, SP8, SP9 |
| Technical screen | 60–75 minutes with one or two engineers: JavaScript and CSS questions, an easy algorithm problem, or rebuilding an HTML and CSS mockup | Web engineers | SP-O1, SP2, SP4, SP5, SP8, SP9, SP10 |
| Final: web practical or domain | A plain HTML, CSS and JavaScript build (a form that fetches from an API into the DOM, a traffic light) or web domain questions | Web and full-stack | SP1–SP7, SP9, SP10 |
| Final: algorithms | LeetCode easy to medium | Same | SP1, SP2, SP4, SP5, SP6, SP9, SP10 |
| Final: system design | Product design that includes the backend | Same | SP1, SP3, SP4, SP5, SP6, SP9, SP10 |
| Final: values | A values interview, STAR style | Same | SP-O2, SP1, SP4, SP5, SP6, SP9 |

Interns: a behavioural interview and one technical round (SP12, two single accounts from 2018 and 2025).

**Caveats**
- **The carousel was never reported as a task.** Before his interview, SP1 asked whether the round was about "crafting user interfaces? (e.g. build an image carousel)". The live guide attributes the carousel to another candidate (see the corrections section).
- On debugging, a Spotify-badged commenter said "live debugging/coding", while the hired SP2 said "There was no debugging round".
- SP1's quoted round description shares wording with a 2022 Android account (https://medium.com/@asifshaikh_39930/getting-interviewed-at-spotify-fdcca55d8ebf, not frontend), so both probably copy Spotify's prep text.

**Re-checked:** SP-O1 (three quotes), and SP1 (the recruiter line, the carousel context, and "fetch data from Spotify API" in the second thread).

## Booking.com

**Readiness: ready for the 2021–2023 frontend loop.** Frontend evidence after 2023 is thin, and 2025 general software engineer accounts describe a different loop (a take-home and a first technical session).

**Official page**
- BK-O1 https://careers.booking.com/start-your-journey/ (`/how-we-hire/` redirects here). The steps are Application, Interview, Business and Feedback:
  - "The first stage after application is a phone call with our sourcers or recruiters"
  - The business stage has "several rounds of interviews where you will meet your manager, teammates and colleagues. This depends on the department and seniority"
  - "3-6 weeks… some of our technical roles have technical tests and coding interviews"
  - Feedback comes "within a week".

**Accounts** (Taro links are `https://www.jointaro.com/interviews/companies/bookingcom/experiences/<slug>/`)

| Id | Source | Date | Role | What it reports |
|---|---|---|---|---|
| BK1 | [Code360](https://www.naukri.com/code360/interview-experiences/booking-com/interview-experience-frontend-engineer-apr-2023-exp-0-2-years) | 2023-04 | Frontend Engineer, Amsterdam relocation | "two different recruiters over a period of 2-3 weeks"; "a monitored HackerRank round… Three engineers" (40 minutes): "Create an autocomplete text box using vanilla JavaScript, HTML, and CSS." |
| BK2 | [enginebogie](https://enginebogie.com/interview/experience/booking-com-frontend-engineer/84) | 2023-05 | Frontend Engineer | "Machine Coding Round (60 minutes)"; the prompt text reads like the platform's own write-up |
| BK3 | [LC 3673403](https://leetcode.com/discuss/post/3673403/) | 2023-06 | FE II, Amsterdam, 4 YOE | "2 multiple choice css questions", "1 React question", "2 algorithms" |
| BK4 | [LC 3667151](https://leetcode.com/discuss/post/3667151/) | 2023-06 | Amsterdam (p) | "passed a Hackerrank test… next stage… live coding interview" |
| BK5 | Taro `junior-frontend-developer-amsterdam-march-1-2022-accepted-offer-positive-88561605` | 2022-03* | junior FE, offer | a recruiter screening, a "HackerRank test", "two Senior Frontend Engineers… create a React component using data from an API endpoint and follow the design spec", "team fit with the engineering managers"; "Total 3 weeks" |
| BK6 | Taro `front-end-software-engineer-ii-amsterdam-june-1-2022-accepted-offer-positive-2d3acd6d` | 2022-06* | FE II, offer | "a prepared application… introduce a new feature. You choose the framework: Vanilla, Vue, or React." |
| BK7 | Taro `frontend-software-engineer-ii-turkey-january-1-2023-accepted-offer-positive-e4aeb759` | 2023-01* | FE II, offer | "Initial technical screening / Two coding interviews with two engineers / A behavioral interview" |
| BK8 | Taro `junior-frontend-engineer-amsterdam-march-1-2022-accepted-offer-positive-9743e14f` | 2022-03* | junior FE, offer | "HackerRank / HR Call / Technical Interview / Culture Fit" |
| BK9 | [Blind](https://www.teamblind.com/post/bookingcom-frontend-interview-experience-owh781q6) | 2021-12 | FE | HackerRank: "2 leetcode easy, 2 html css MCQ, 1 React component… 100 min"; then "create a component using vanilla js, html and css in both rounds" |
| BK10 | [Blind](https://www.teamblind.com/post/bookingcom-interview-frontend-fzudnfhv) | 2021-11 | FE | HackerRank "around 90 mints, 5 questions", then two coding rounds "with 2 interviewer"; no algorithm problems after the HackerRank test |
| BK11 | Taro `frontend-developer-turkey-september-1-2021-no-offer-neutral-8e3079d9` | 2021-09* | FE | HackerRank, a recruiter call with "3 technical questions", "Implement a tooltip", "search box with autocomplete", "Culture fit" |
| BK12–BK15 | Taro `senior-full-stack-engineer-amsterdam-july-1-2023-no-offer-negative-cb57c4dd`, `full-stack-software-engineer-bangladesh-may-1-2022-accepted-offer-positive-8784f953`, `full-stack-software-engineer-germany-may-6-2022-accepted-offer-positive-bcb406d6`, `senior-software-engineer-amsterdam-may-29-2025-no-offer-neutral-4678e62e` | 2022–2025 | full-stack with a frontend round | a frontend interview, backend coding and solutions design; one lists "Recruiter call (15 min)", "Frontend Interview (60 min)", "Backend followed by System Design Interview (75 min)", "Fit Interview (60 min)" |

**Proposed table: frontend engineers, mostly Amsterdam, 2021–2023**

| Stage | What happens | Who | Sources |
|---|---|---|---|
| HackerRank assessment | 90–100 minutes, about five items: two easy algorithm problems, two HTML and CSS multiple-choice questions and one React component | Junior to FE II; full-stack | BK3, BK4, BK5, BK8, BK9, BK10, BK11, BK13 |
| Recruiter call | 15–30 minutes; a few technical questions in some | All | BK-O1, BK1, BK5, BK8, BK11, BK13 |
| Frontend coding, one or two rounds | About 60 minutes with two engineers: a component in plain JavaScript or React (autocomplete, tooltip, API data to a design spec, a new feature in a prepared app) | Frontend and full-stack | BK1, BK2, BK5, BK6, BK7, BK9–BK14 |
| Backend and system design | Backend coding and design | Full-stack and senior only | BK12–BK15 |
| Fit interview | About 60 minutes with engineering managers | All | BK5, BK7, BK8, BK11, BK13, BK14 |

**Caveats:**
- The HackerRank test usually comes before the recruiter call, but came after it in BK5.
- BK1's "monitored HackerRank round" was a live 40-minute interview, not the take-home test.
- No frontend-titled account mentions system design.

**Re-checked:** BK-O1 ("The first stage after application is a phone call with our sourcers or recruiters", "technical tests and coding interviews").

## Zalando

**Readiness: ready but narrow.** There are three complete frontend loops (2019, 2020, 2024) and the official process. Only one detailed account is from after 2022, and all are from Berlin. Taro has no Zalando pages.

**Official pages**
- ZA-O1 https://jobs.zalando.com/en/how-we-hire (Tech tab):
  - "(30 mins)… Talent Acquisition Partners"
  - "Ready for a challenge?… 'case study'… e.g. a business challenge or coding exercise"
  - "(45-60 mins) Meet with your Hiring Manager or potential Team Lead"
  - "The final interviews… (3-5 interviews; 45-60 min each)"
- ZA-O2 https://jobs.zalando.com/en/blog/technical-interview-for-software-engineers (2023-07-11):
  - "an initial call with a Talent Acquisition Partner / an interview with the Hiring Manager / a coding interview / a system design and architecture interview / a general tech interview"
  - "between 2–3 weeks"
  - "you may be given an additional coding challenge"

**Accounts**

| Id | Source | Date | Role | What it reports |
|---|---|---|---|---|
| ZA1 | [LC 5501338](https://leetcode.com/discuss/interview-experience/5501338/) | 2024-07 | Senior Frontend, Berlin, selected | "Codility… take-home test for 3 hours"; "Solution Discussion &#124; Round 1 (45 Min)"; "JavaScript Technical Interview (1 Hour)… two senior frontend engineers"; "System Design (1 Hour)… a load balancer for HTTP requests"; "Engineering Manager (45 min)"; "very long day… back-to-back" |
| ZA2 | [LC 1076335](https://leetcode.com/discuss/post/1076335/) | 2020-12 | Senior Front-End Engineer, Berlin, offer (anonymous replies answering as the offer holder) | "OA with two questions. 1. Front-End question(ReactJS). 2. Backend question(Desing API)", due in "3working days"; "2h phone interview(1. Senior Engineering, 2. Engineering Manager)"; "4h onsite interview(1.System Design 2. Javascript Basics 3.HR 4.Coding)" |
| ZA3 | [LC 1249280](https://leetcode.com/discuss/post/1249280/) | 2021-07 comment on a 2019 interview | frontend (implied by the thread) | "Coding test"; "Retrospecting Interview on code test"; "Basic and Advanced JavaScript + FrameWork questions"; "Hiring Manager - Behavioural Round"; "System Design (expect something related to E-commerce)" |
| ZA4 | [Blind](https://www.teamblind.com/post/zalando-frontend-interviews-asih8pba) | 2022-02 | FE, 5 YOE | the poster passed the Codility test ("array/string manipulation easy LC problems", about 2 hours); a commenter (c): the hiring manager "asked me theoretical questions only. Nothing technical." |
| ZA5 | [Blind](https://www.teamblind.com/post/zalando-frontend-interview-t3h2vsw1) | 2022-04 | commenter's plan (p) | "Two coding interviews / One system design interview / One general tech interview" |

**Proposed table: frontend engineers, Berlin**

| Stage | What happens | Who | Sources |
|---|---|---|---|
| Talent acquisition call | 30 minutes: motivation and salary | Tech roles | ZA-O1, ZA-O2 (no account describes it) |
| Codility challenge | Done at home, 2–3 hours: a React and Node app (2024), easy algorithm problems (2022), React plus an API design question (2020) | All accounts | ZA-O1, ZA1, ZA2, ZA3, ZA4 |
| Hiring manager | 30–60 minutes, sometimes non-technical; a two-hour phone stage in 2020 | All | ZA-O1, ZA-O2, ZA2, ZA3, ZA4 (c) |
| Final: take-home review | 45 minutes on the submitted code | Seniors | ZA1, ZA3 |
| Final: JavaScript and web fundamentals | One hour ("general tech") | All | ZA-O2, ZA1, ZA2, ZA3, ZA5 (p) |
| Final: live coding | One hour | Some | ZA-O2, ZA2, ZA5 (p) |
| Final: system design | One hour, backend-leaning (a load balancer in 2024) | All | ZA-O2, ZA1, ZA2, ZA3, ZA5 (p) |
| Final: engineering manager or HR | 45 minutes | Seniors | ZA1, ZA2 |

**Caveats:**
- The official pages disagree on the order. The How We Hire page puts the challenge before the hiring manager, and the 2023 blog puts the hiring manager first. In ZA1 the engineering manager came on the final day.
- The "2–3 weeks" timeline appears only in the 2023 blog.

**Re-checked:** ZA-O1 ("3-5 interviews; 45-60 min each", "case study", "Meet with your Hiring Manager").

## Next steps

- **Measure.** Read GSC 4–6 weeks after these tables deploy, looking at queries that contain "process", "rounds" or "loop", before adding more companies or changing the layout.
- **Thin companies.** Netflix, Airbnb, OpenAI, ElevenLabs and Waymo get a table only when more first-hand frontend accounts appear. Add new accounts to the matching section here first.
- **Re-check before editing a table.** Pages change: Spotify and Booking.com have moved their process pages, and OpenAI and ServiceNow now block direct reads. Re-read the official pages and update `checkedAt`.
