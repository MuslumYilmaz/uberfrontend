# Frontend interview processes: JPMorgan Chase, Agoda and xAI (October 2026)

This document holds the research for "Reported interview process" tables on three new company pages chosen on 2026-10-21 (selection evidence in `docs/references/jpmorgan-agoda-xai-questions-2026-10.md`). It follows `docs/references/company-interview-processes-2026-10.md`, which covers the 19 earlier companies, and the pilot tables built on 2026-10-20 (`f3de4efd`). Nothing here is on the site; every table still needs its own approval.

## How the research was done

- **Date and method.** On 2026-10-21 three research agents, one per company, read every source in full where a full read was possible: Taro and Aced experience pages, Blind post pages, LeetCode Discuss through GraphQL, Code360 through its JSON endpoint, Medium through RSS, job postings through the Greenhouse, Ashby and Oracle recruiting APIs and through job-board mirrors. The coordinating session then re-read the key quotes on their pages; the result is listed under "Re-checked" for each company.
- **What counts as evidence:** official company pages and official job postings that describe the process; first-person accounts on Taro, Aced, Blind, LeetCode Discuss, Medium, dev.to, personal blogs, Code360 and enginebogie; news, cited as news and never as an account.
- **What does not count:** Glassdoor, 1point3acres, Reddit and Kununu (snippets are quoted only in the questions document, marked S); templated or marketing guides: Prepfully, Dataford, interviewpal, techprep, jobrise, IGotAnOffer, PracHub question lists, GreatFrontEnd and FrontendLead.
- **Reading rules** (as in the pilot): Taro dates on the 1st of a month are placeholders (`*`); Taro probably re-hosts Glassdoor reviews with a changed city and date, so no Taro city goes into a public label; on Blind, a poster's own account, a commenter's own account (`c`) and a plan written before the interview (`p`) are different evidence; multi-company posts are used only for the target company.
- **Readiness labels:** **Ready** (enough first-hand accounts agree on a shape), **Ready, team-specific** (stage types agree, loop varies by team), **Thin** (an official page plus partial loops; most rows need "one account" labels).
- **Source ids** are local to this document: JP, AGD and XA for accounts, `-O1` and so on for official pages and postings, `-N1` for news. LeetCode posts are given as `LC <id>`; the URL is `https://leetcode.com/discuss/post/<id>/`.

## Summary

Account counts are first-hand accounts that describe stages, rounded. The table rows themselves are in each company's section.

| Company | Readiness | Official process page | Accounts | The loop in one line |
|---|---|---|---|---|
| JPMorgan Chase | Ready, team-specific | How we hire and FAQs (generic; "will differ for each position") | 14 frontend, 2021–2026, plus about 20 generic | A recruiter screen; a one-hour React and JavaScript conversation, often split between two interviewers; 60–90 minutes of live coding; hiring manager or leadership; Software Engineer II/III requisitions probably use the HackerRank-plus-super-day loop |
| Agoda | Ready for Bangkok (Senior and Staff front end); team-specific for Gurgaon | Tech interview process page, interview guide, an interviewer's Medium guide | 13 frontend, 2022–2026, plus about 20 generic | A prep call; sometimes a HackerRank assessment; 60-minute coding, Frontend Platform, architecture and culture-fit interviews on HackerRank, a week apart; a preliminary call sets the level; the manager presents the offer |
| xAI | Thin on accounts; postings describe the loop | Careers page "What to expect"; eight closed frontend postings with stage lists | 2 frontend plus 1 locked, 2025; about 15 generic | Engineers review the CV and a "statement of exceptional work"; a 15-minute phone screen; a React coding interview (45 minutes in London); an HTML/CSS (Tailwind) interview from a screenshot; a team or founding-engineer stage; "within one week" on Google Meet |

## JPMorgan Chase

**Readiness: ready, team-specific.** The official pages say the process "will differ for each position", and JPMC-badged employees on Blind describe decentralised, team-run loops. Two shapes recur: a one-hour or two-stage frontend conversation with React and JavaScript questions, and the generic "super day" (an assessment, then three 45-minute rounds in one day) that React-titled Software Engineer II and III requisitions probably share, although no frontend report confirms the latter.

**Official pages** (read 2026-10-21)
- JP-O1 https://www.jpmorganchase.com/careers/how-we-hire : "The interview process will differ for each position. But as we get to know you—and you get to know us—you can expect to meet with several people in multiple rounds." Four steps: "Explore", "Apply", "Interview", "Decision".
- JP-O2 https://www.jpmorganchase.com/careers/how-we-hire/faqs : "Examples of some of the types of assessments we use include structured live interviews, on-demand/recorded interviews, and virtual skills assessments."; "Technical assessments may take the form of online tests or technical interviews where you demonstrate your skills live with an interviewer."; "many assessments may not be retaken for a designated timeframe."
- JP-O3 https://www.jpmorganchase.com/careers/explore-opportunities/programs/software-engineer-fulltime : the Software Engineer Program's Front-end Developer track; no interview text.
- JP-O4 the Oracle recruiting API (2026-10-21): 266 requisitions matching "React", 310 matching "front end"; frontend titles in London, Glasgow, New York, Jersey City, Plano, Chicago, Columbus and Bengaluru.

**Accounts**

| Id | Source | Date | Role | What it reports |
|---|---|---|---|---|
| JP1 | [Aced](https://www.aced.io/experiences/jp-morgan-chase-senior-frontend-engineer-interview-6faa4e) | about 2026-05 | Senior/L5 Frontend Engineer, UK onsite, rejected | "Recruiter screen" then "Technical interview": "Live coding a generic async promise React hook. Generic types and useEffect cleanup function expected"; two weeks |
| JP2 | [Blind](https://www.teamblind.com/post/jp-morgan-interview-tips-ohvqbeuy) and [Blind](https://www.teamblind.com/post/jp-morgan-swe-interview-guide-tsoukjaf) | 2023-04 to 05 | React Software Engineer III, London (own first stage; second stage as planned) | a technical interview over Zoom: "explain closure, diff between shallow clone and deep clone, Object.assign usecase, difference between useCallback and useMemo etc"; then "a 90 minute technical live coding interview and 30 minute behavioural interview" (p); a Google-badged commenter (c): "Interviews at JP are generally decentralized, so there is zero consistency." |
| JP3 | [Taro](https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/associate-software-engineer-united-kingdom-february-1-2025-no-offer-negative-7f96780a/) (Glassdoor mirror) | 2025-02* | Associate Software Engineer, UK | one interview "with 2 people"; "more a test of knowledge and React concepts than a test of aptitude"; `useState` versus `useRef` |
| JP4 | [Taro](https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/frontend-developer-london-england-january-1-2021-accepted-offer-positive-e00df0d2/) | 2021-01* | Frontend Developer, London, offer | "4 stages: 1 phone call, then on-site with 3 different people – tech lead, team manager, then managing director. The phone call was basic frontend questions. A 30-minute chat with the tech lead involved more simple paper coding." |
| JP5 | [Taro](https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/frontend-developer-london-england-july-1-2017-no-offer-negative-5853573b/) (probable mirror) | 2017-07* | Frontend Developer, London | a phone interview of "probably about 30 questions based around JavaScript"; a 90-minute face-to-face on React, Redux, TypeScript and the lifecycle with a Glasgow dial-in |
| JP6 | [Taro](https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/frontend-developer-united-states-april-1-2022-no-offer-neutral-a3d9886a/) | 2022-04* | Frontend Developer, US | "3 rounds with a VP, Developer, and Quality Assurance ... mostly on what you present on your resume ... there was technical coding on functional components. After clearing the first round, you will face the interview with the application owner and lead developer." |
| JP7 | [Taro](https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/lead-software-engineer-united-states-march-13-2025-no-offer-positive-5ec74572/) (Glassdoor mirror, tagged New York) | 2025-03 | Lead Software Engineer, US | "about 1 hour, conducted by 3 lead software engineers. One engineer asked 3 easy/medium level difficulty LeetCode-styled questions. Another engineer focused on asking about how React works ... The 3rd engineer asked some basic questions about the backend, REST, optimizations, and security." |
| JP8 | [Taro](https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/react-developer-united-states-june-1-2022-no-offer-positive-87452f0d/) | 2022-06* | React Developer, Houston | "Three video technical interviews"; a React to-do list with priorities; one interviewer mis-assigned to a backend Python role |
| JP9 | [Blind](https://www.teamblind.com/post/JPMorgan-Front-End-position---HELP-uwhCeSaA) | 2021-12 | Software Engineer - Front End, New York (p, c) | "a 1 hour interview split in 30mins between two interviewers"; JPMC-badged commenter (c): "Typical React or angular stuff, based on your past experience." |
| JP10 | [Blind](https://www.teamblind.com/post/JPMorgan-Chase---Front-End-Developer-Interview-Mb7vx1A6) | 2021-03 | Front end developer, US (p, c) | "45 minute behavioral and 45 minute technical interview"; JPMC-badged commenter (c): "Varies from team to team mostly, My team usually focuses on hands on experience with react, rx.js, typescript and JS advance core concepts through code pairing." |
| JP11 | [frontendgeek](https://www.frontendgeek.com/interview-experience/frontend-interview-experience-at-jp-morgan-refused-offer---9f684f90-12ee-45ec-ac82-e40d2010260e) | 2024-04 | SDE2, Bengaluru, offer refused | three 60-minute rounds in one sitting: "Security and React", "JavaScript/Framework", "Hiring Manager/Culture Fit"; "Congratulations!" on day 10 |
| JP12 | [Taro](https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/frontend-engineer-bengaluru-karnataka-april-1-2024-no-offer-negative-77dc2081/) | 2024-04* | Frontend Engineer, Bengaluru | one round ("Closures, Event loop, React.js optimization techniques"), then no second round |
| JP13 | [Blind](https://www.teamblind.com/post/jpmorgan-chase-interview-rounds-expectation-bengaluru-ta1v2q0n) | 2024-05 | Lead frontend, Bengaluru (p; JPMC-badged commenters) | "Generally it will be 3-4rounds.. 3 technical and 1 hr"; "mainly some basic react, performance optimisation in web" |
| JP14 | [LC 1076639](https://leetcode.com/discuss/post/1076639/) | 2021-02 | onsite, multiple teams, New York | "each interview was distinct depending on the team/hiring manager"; JavaScript fundamentals and DSA questions |
| JP15 | [Taro](https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/software-engineer-united-states-august-1-2025-declined-offer-negative-5c2f81ca/) | 2025-08* | Software Engineer, US (generic) | a recruiter phone screen; HackerRank with "two LeetCode-style easy questions"; "a virtual 'super day' ... consisting of three rounds: coding/PR review, system design, and behavioral", 45 minutes each |
| JP16 | [Blind](https://www.teamblind.com/post/jpmc-interview-expectations-d0ed5ppz) | 2026-04 | SWE 3 "power day", US, offer (generic) | "PR review, coding question, system design and then behavioral"; "System design was rate limiter with some modifications"; a JPMC-badged interviewer (c): "Coding questions expect an average difficulty medium" |
| JP17 | [LC 7421234](https://leetcode.com/discuss/post/7421234/), [LC 7455878](https://leetcode.com/discuss/post/7455878/), [LC 5438765](https://leetcode.com/discuss/post/5438765/), [LC 7275188](https://leetcode.com/discuss/post/7275188/), [LC 6830133](https://leetcode.com/discuss/post/6830133/) | 2024-07 to 2026-01 | SDE2 and SDE3 cohort "Super Day", India (generic) | a HackerRank assessment with two questions; three back-to-back rounds on one day: code or PR review plus one problem, high-level design on a HackerRank whiteboard or CodePair, a behavioural round with a Director or Executive Director; a 15-minute team match later |
| JP18 | [Blind](https://www.teamblind.com/post/jp-morgan-chase-swe-interview-hvaqkrr3) and [Blind](https://www.teamblind.com/post/jpmorgan-chase-technical-interview-oea4wzz4) | 2022 to 2024 | JPMC-badged commenters (c) | "The company does not have a standard coding format unlike big tech and depends on the LOB and org."; "It's very team-based." |

Not used: Glassdoor snippets (quoted only in the questions document), the Dataford templates, Taro's aggregated page, and six Blind threads that are plans with no report back.

**Proposed table: front-end and React engineers, team-run loops, 2021 to 2026 (team-specific)**

| Stage | What happens | Who | Sources |
|---|---|---|---|
| Recruiter contact | A phone screen about the CV; some candidates are contacted by email only and go straight to team interviews | Most | JP1, JP4, JP15, JP-O1 |
| Online assessment | HackerRank with two easy-to-medium problems, or a recorded video interview for some roles; weeks before the loop in some accounts | Software Engineer II and III requisitions; not reported in the frontend-titled loops | JP15, JP17, JP-O2 |
| Frontend technical conversation | One hour, often split between two interviewers or a panel of three: JavaScript fundamentals (closures, clones, `Object.assign`, `reduce`), React hooks and lifecycle, framework choice, resume-driven questions | Frontend-titled roles | JP2, JP3, JP5, JP6, JP7, JP9, JP10, JP12, JP13 |
| Live coding | 60 to 90 minutes: a small React build (a to-do list with priorities; "technical coding on functional components"; a generic async promise hook with `useEffect` cleanup) or paper coding; a 90-minute live coding plus 30-minute behavioural second stage in London | Most frontend loops | JP1, JP2 (p), JP4, JP6, JP8, JP10 (c) |
| Security and framework rounds | Three 60-minute rounds in one sitting: security and React, JavaScript and framework, hiring manager | One Bengaluru SDE2 loop | JP11 |
| Super day | Three 45-minute rounds in one day: pull-request review plus a medium problem, high-level design (a rate limiter recurs), behavioural | Generic Software Engineer II and III loops, US and India, 2024 to 2026; likely shared by React-titled requisitions, unconfirmed | JP15, JP16, JP17 |
| Hiring manager and leadership | A team manager, a managing director or an Executive Director; culture fit | Most | JP4, JP6, JP11, JP17 |

**Caveats**
- No standard loop exists; JPMC-badged commenters say the format "depends on the LOB and org" (JP18). A page must say so.
- Several frontend accounts are one to three lines long, and the Taro dates on the 1st are placeholders.
- The super-day shape (JP15–JP17) comes from generic Software Engineer loops; no frontend-titled report confirms it.
- Interviewers can be mis-assigned (JP8) and candidates ghosted after a cleared round (JP12).

**Re-checked:** JP11 (three rounds, "write a generic memoization function", "polyfill for the reduce function", "Congratulations!" on day 10), JP2 ("explain closure, diff between shallow clone and deep clone", "zero consistency"), JP-O1 ("will differ for each position", "several people in multiple rounds"); JP1, JP3, JP4, JP6, JP7, JP8 and JP12 were read in full by the coordinating session earlier on 2026-10-21.

## Agoda

**Readiness: ready for the Bangkok relocation loops (Senior and Staff front end, 2025 to 2026); team-specific for Gurgaon; thin for Manila and Bangalore.** Thirteen first-hand frontend accounts and about twenty generic engineering loops agree on the shape, and Agoda's own pages describe the four rounds.

**Official pages** (archive captures; the live careersatagoda.com returns a Cloudflare 403 to our tools)
- AGD-O1 https://careersatagoda.com/blog/how-we-hire-agodas-tech-team-interview-process/ (2025-07-23; capture 2026-04-06): "You may be asked to complete an Agoda coding assessment. You'll receive a Hacker Rank online test to complete within the provided timeframe."; "the Agoda Tech interview process typically includes 4 rounds – each designed to assess different competencies: Coding Round ... Platform Round ... System Design Round ... Agoda Culture Fit Round"; "We typically make the final decision within 2 weeks of your last interview round".
- AGD-O2 https://careersatagoda.com/blog/how-we-hire-for-tech-roles-at-agoda/ (2021-11-08; capture 2025-07-15): "sometimes we require candidates to complete a small project before their in-depth interviews"; "at least two rounds of technical interviews"; "You can re-apply to the same role after six months."; "Agoda provides relocation packages and visa support."
- AGD-O3 https://careersatagoda.com/how-we-hire/ (capture 2026-10-05): "application, assessment, interview, and decision. However, depending on the role, the order may vary."; "In some instances, we may ask you to complete a case study, either as a live exercise or a take-home assignment."
- AGD-O4 https://careersatagoda.com/interview/ (capture 2026-10-19): "We generally use the CAR method (Context – Action – Results)"; "Most candidates will go through two rounds of video interviews before progressing to the final stages."; "Some parts of the process (e.g., live system design, technical Q&A, and behavioral interviews) must be completed without AI".
- AGD-O5 https://careersatagoda.com/blog/how-we-hire-agoda-hiring-process/ (2024-07-19; capture 2025-10-25): "we aim to complete the process in under 30 days."
- AGD-O6 https://medium.com/agoda-engineering/preparing-for-interview-at-agoda-2c07b7d13ca5 (2023-06-19; capture 2025-05-12), an interviewer's guide: the Coding round looks for "Testing skills; Critical and systematic thinking; Code efficiency and readability; Computer science knowledge"; the Platform round "typically ask[s] candidates to implement something related to Agoda" and "often include[s] a task that involves reviewing, fixing, and improving a given code snippet".
- AGD-O7 Greenhouse board https://boards-api.greenhouse.io/v1/boards/agoda/jobs?content=true (2026-10-21): 309 postings; front-end-titled roles are Staff, Lead and Manager, all Bangkok-based with relocation.

**Accounts**

| Id | Source | Date | Role | What it reports |
|---|---|---|---|---|
| AGD1 | [LC 8459009](https://leetcode.com/discuss/post/8459009/) | 2026-07 | Senior Software Engineer (Frontend), Bangkok, applied for Staff, rejected | "All interview rounds were online on HackerRank. Each round happened with a gap of a week."; two easy DSA problems plus testing questions; a one-hour web-fundamentals Q&A; a one-hour hotel-search-page architecture round; down-levelled after round 2 |
| AGD2 | [Medium](https://kr-viku.medium.com/%EF%B8%8F-my-agoda-interview-journey-from-first-call-to-offer-086385b03d33) | 2025-08 to 09 | Senior Software Engineer, Bangkok, offer | the recruiter's email: "Prep Call (15 mins)", "Interview 1: Coding (60 mins)", "Interview 2: Platform (60 mins)", "Preliminary Call (30 mins)", "Interview 3: Architecture (60 mins)", "Interview 4: BE Platform (60 mins)", "Interview 5: Culture Fit (60 mins)"; the Frontend Platform interview "also conducted through HackerRank"; "At Agoda, your manager is the one who gives you the offer directly." |
| AGD3 | [LC 6398233](https://leetcode.com/discuss/interview-question/6398233) | 2025-02 | Staff Frontend, Bangkok, selected | "Recruiter Connect"; "2 Leet code, medium questions ... [JavaScript Leetcode]"; "This is a JavaScript coding round! Not a react machine coding round, nor a system design round" (40 to 50 minutes plus 10 to 15 minutes of behavioural questions); a second recruiter call; "HLD round, was asked to create a doctor appointment booking application"; salary negotiation |
| AGD4 | [LC 7199643](https://leetcode.com/discuss/post/7199643/) | 2025-09 | Full Stack (referred), Thailand, offer | two medium DSA problems on HackerRank; a JavaScript and React round (session management, promises, Lighthouse metrics, React testing); HR; backend design and code review; hiring manager |
| AGD5 | [Blind](https://www.teamblind.com/post/what-can-i-expect-in-agodas-sse-frontend-culture-fit-round-xchtevrv) | 2025-06 | Senior Frontend Engineer, moving to Bangkok (own loop; last round planned) | coding, Frontend Platform, architecture; an HR call, Staff consideration, an added architecture round, "Culture Fit + Tech" |
| AGD6 | [Medium](https://beyondthecode.medium.com/my-agoda-interview-journey-a-candid-reflection-55de22d2276b) (archive capture; probably the same loop as a Taro entry dated 2025-06*) | 2025-07 | Senior Software Engineer, Front End, Bangkok, no offer | an online assessment, a recruiter call, coding, platform, a preliminary call, "Architecture + Culture Fit"; no offer "due to current headcount constraints" |
| AGD7 | [Blind](https://www.teamblind.com/post/my-interview-experience-with-agoda-zhhgctzk) | 2025-06 | SSE, Gurgaon, rejected | "I successfully solved 8 HTML/CSS questions and 2 JavaScript coding problems."; "HR Screening"; "HackerRank Round: I cleared both JavaScript problems with 100% test case pass."; a platform round on hoisting, class behaviour, SSR versus CSR, atomic design, testing; "HR Salary & Relocation Discussion"; "I received a rejection email without a managerial round."; commenters (c): "Recruiters and interviewers were from bangkok!"; after the platform round, Staff consideration, "one architecture round", "And then cultural fit round" |
| AGD8 | [Code360](https://www.naukri.com/code360/interview-experiences/agoda/agoda-interview-experience-by-brijesh-verma-may-2025-exp-0-2-years) | 2025-05 to 06 | Frontend Engineer, Gurgaon, rejected | a take-home (Stock Analyzer Dashboard, React and TypeScript); 60 minutes of DSA plus a JavaScript debounce; 60 minutes of frontend architecture for a travel booking site; a 60-minute technical-strategy round; every round "Cleared", outcome "Rejection" |
| AGD9 | [Substack](https://nerddesignlab.substack.com/p/interview-experience-agoda-gurgaon) | 2024-10 | Full Stack, SDE2 offer, Gurgaon | DSA; a platform round with a system design and a frontend integrating backend API calls; managerial; "they decided to skip the next technical round" |
| AGD10 | [frontendgeek](https://www.frontendgeek.com/interview-experience/staff-frontend-interview-experience-at-agoda-rejected-thailand-relocation---f13f1824-08d9-4385-a219-269aaeb3d301) | 2025-07 | Staff Software Engineer, Bangalore, Thailand relocation, not selected | a 60-minute-plus phone screening (JavaScript basics, promises, sliding window); a "DSA & JavaScript Round" (one DSA, two JavaScript problems); a live HackerRank stack problem |
| AGD11 | [LC 7580886](https://leetcode.com/discuss/post/7580886/) | 2026-02 | Senior Frontend candidate, Gurgaon and Bangkok | Gurgaon: rejected in the second round; Bangkok: an offer after three rounds, "Applied again after 6-month cooling period" |
| AGD12 | [Blind](https://www.teamblind.com/post/agoda-bankok-platform-interview-wlgcyzeh) | 2024-10 | Front End or Full Stack, Bangkok (p, c) | the prep guide promises web-related questions for front-end candidates and "a code snippet and I would be asked to improve it" |
| AGD13 | [Taro](https://www.jointaro.com/interviews/companies/agoda/experiences/software-engineer-bangkok-july-1-2025-accepted-offer-positive-01180b45/) | 2025-07* | Software Engineer, Bangkok, new grad, offer (probable Glassdoor mirror) | a 90-minute HackerRank assessment with three questions; an in-person loop: coding, a 45-minute platform round, culture fit |
| AGD14–AGD30 | LeetCode 7082771, 7755434, 7565801, 7237792, 6859065, 5290917, 5978891, 3846220; Blind 873mc3nz, ke36kmpg, feczcb5s; Taro 207e9184, 67354397, 01bd1ff6; dev.to freeze_francis | 2019 to 2026 | generic Software Engineer, backend and full-stack loops in Bangkok | recruiter call; a HackerRank assessment (often one DSA plus one HTTP or API question); a live DSA hour; a platform hour of design critique and code review; a system-design hour (hotel, flight or concert booking); hiring manager or a 1.5-hour values round; CodeSignal in 2021 to 2023; a fly-in onsite before 2023 |

Not used: Glassdoor snippets (eight reviews; quoted only in the questions document), the Dataford and Prepfully templates, a member-only Medium post whose preview shows only the assessment.

**Proposed table: front-end engineers, Bangkok relocation loops, Senior and Staff, 2025 to 2026**

| Stage | What happens | Who | Sources |
|---|---|---|---|
| Recruiter prep call | 15 to 30 minutes on background, notice period, relocation and expectations | All | AGD-O1, AGD2, AGD3, AGD6 |
| HackerRank assessment | Three questions in 90 minutes, or one DSA problem plus one HTTP or API question; sometimes skipped | Some loops | AGD-O1, AGD6, AGD13, AGD14–AGD30; none in AGD1–AGD3 |
| Coding interview | 60 minutes on HackerRank with an engineer: two easy-to-medium DSA problems in JavaScript, then verbal questions on test cases and pull requests | All | AGD1, AGD3, AGD4, AGD7, AGD10; AGD-O6 |
| Frontend Platform interview | 60 minutes on HackerRank: a web-fundamentals Q&A, a JavaScript implementation grown from the resume, or a discussion of component reuse, state, API data and rendering performance; a code snippet to improve per the prep guide | All | AGD1, AGD2, AGD3, AGD4, AGD12; AGD-O1, AGD-O6 |
| Preliminary call | 30 minutes with the recruiter: compensation, relocation, feedback; the level is set here (Staff candidates can be down-levelled, strong Senior candidates moved to the Staff track) | All | AGD1, AGD2, AGD3, AGD5, AGD6, AGD7 (c) |
| Architecture interview | 60 minutes: a frontend-flavoured product design such as a hotel search page or a booking app, no diagram expected; the Staff track adds a "BE Platform" hour on a booking system | All; the extra hour on the Staff track | AGD1, AGD2, AGD3, AGD5, AGD8; AGD-O1 |
| Culture fit | 60 minutes with an engineering manager; CAR-method behavioural questions | All | AGD2, AGD5, AGD6; AGD-O1, AGD-O4 |
| Decision and offer | The hiring manager presents the offer; the official target is a decision within two weeks of the last round, or under 30 days overall | All | AGD2, AGD-O1, AGD-O5 |

**Gurgaon variant (team-specific):** an online assessment (HTML/CSS and JavaScript questions, or a take-home such as the Stock Analyzer Dashboard), an HR screen, a HackerRank JavaScript or DSA round, a platform round on frontend architecture and JavaScript depth, an HR salary and relocation call, then a managerial round for some and a rejection without one for others (AGD7, AGD8, AGD9, AGD11). Interviewers may sit in Bangkok (AGD7 commenter). The board lists no Gurugram front-end-titled role.

**Caveats**
- Every round is remote on HackerRank, a week apart (AGD1, AGD2); the whole loop ran one week in one account and two to three months in others.
- The platform round's content varies by interviewer: a pure Q&A (AGD1), a JavaScript implementation (AGD3) or an architecture discussion (AGD2).
- Rejections after clearing every technical round are reported: headcount (AGD6), no managerial round (AGD7), the "Cleared" rounds of AGD8.
- Manila and Bangalore rest on Glassdoor snippets and one relocation candidate; the board has no engineering roles there.
- All current front-end postings are Staff, Lead or Manager level with eight or more years of experience.

**Re-checked:** AGD2 ("Prep Call (15 mins)", "Interview 2: Platform (60 mins)", "also conducted through HackerRank", "your manager is the one who gives you the offer directly"), AGD3 ("This is a JavaScript coding round!", "pipe-line based JS function", "doctor appointment booking application"), AGD7 ("8 HTML/CSS questions and 2 JavaScript coding problems", "without a managerial round", "Recruiters and interviewers were from bangkok!"), AGD10 (the molecular-weight stack problem, "180000 Thai bhat"), AGD-O1 and AGD-O6 (in the archive captures).

## xAI

**Readiness: thin on accounts, but the official postings describe the loop stage by stage.** One London frontend account matches the postings' React round. Bay Area frontend loops rest on postings only. The company is now SpaceXAI (merger closed 2026-02-02, rebrand July 2026); the board slug and search demand are still "xai".

**Official pages and postings** (quotes verbatim; Built In posting and removal dates)
- XA-O1 https://x.ai/careers (read in Chrome on 2026-10-21): "We generally do not use recruiters for assessments. Applications are evaluated by our technical team members." Steps: "Submit your application: Our team will review your CV and statement of exceptional work." "Screening interview: A short interview to learn more about you and assess if the role fits. Prepare for short technical questions and a review of your background." "Technical interviews: Sessions where we dive deep into your technical expertise." "Offer extended".
- XA-O2 London Frontend Engineer and Developer Experience Frontend, https://www.builtinlondon.uk/job/frontend-engineer/7805551 and https://builtin.com/job/developer-experience-frontend/7740449 (removed 2026-02-17): "Initial technical screening during which a member of our team will ask some basic technical questions (15 minutes)", "React coding interview (45 minutes)", "HTML/CSS/Tailwind coding interview (45 minutes)", "Final stage with founding engineer Toby Pohlen (30 minutes)", "All interviews will be conducted via Google Meet."
- XA-O3 React Frontend Engineer - grok.com & API, https://builtin.com/job/react-frontend-engineer-grokcom-api/4446453 (2026-01-11 to 2026-01-27; team text on https://javascript.jobs/job/react-frontend-engineer-grokcom-api): a 15-minute "phone interview" with "some basic technical questions", then "two technical interviews: Coding interview in TypeScript: Write a small app in React. HTML/CSS interview: Given a screenshot of a UI, implement it."
- XA-O4 Frontend Engineer - Enterprise, https://builtin.com/job/frontend-engineer-enterprise/7383404 (2026-02-21 to 2026-02-25): the same two rounds, "at least two technical interviews".
- XA-O5 Senior Frontend Engineer - Grok Studio, https://builtin.com/job/senior-frontend-engineer-grok-studio/4739518 (2026-01-11 to 2026-01-27) and the 8VC copy titled "Agents UX" https://jobs.8vc.com/companies/x-ai/jobs/48336005-senior-frontend-engineer-grok-studio (posted 2025-04-03): "four technical interviews: Coding assessment in a language of your choice. Two front end technical interviews, in React/Typescript. Meet the Team: Present your past exceptional work and your vision with xAI to a small audience. Our goal is to finish the main process within one week."
- XA-O6 Senior Frontend Engineer - Autonomous Agents, https://builtin.com/job/senior-frontend-engineer-autonomous-agents/4379947 (2025-07) and the Starfleet copy https://builtin.com/job/senior-frontend-engineer-autonomous-agents-starfleet/6934961 (2026-02-19 to 2026-02-24): "Coding assessment in a language of your choice. Front end technical interview, in React/Typescript. Systems hands-on: Demonstrate practical skills in a live problem-solving session. Meet the Team".
- XA-O7 Frontend Engineer & UI/UX Designer, London, https://uiuxjobsboard.com/job/864124-frontend-engineer-ui-ux-designer-london-united-kingdom (mirror; removed about 2025-02): the React and HTML/CSS rounds, "Design a UI in a tool of your choice (e.g. Figma or Photoshop)", "a 20 minute presentation about previous design projects and complex UI flows you have implemented", "We don't rely on recruiters for assessments."
- XA-O8 Greenhouse board https://boards-api.greenhouse.io/v1/boards/xai/jobs?content=true (2026-10-21): 302 jobs; the only frontend-titled opening is "Web Engineer, X" (published 2026-03-19); no current engineering posting carries an interview section.
- XA-N1 https://finance.yahoo.com/news/elon-musk-admits-xai-passing-120627338.html (2026-03-18): Musk said past candidates were being re-contacted and that xAI "is being rebuilt from the foundations up".

**Accounts**

| Id | Source | Date | Role | What it reports |
|---|---|---|---|---|
| XA1 | [Taro](https://www.jointaro.com/interviews/companies/xai/experiences/frontend-engineer-london-england-august-13-2025-no-offer-positive-45b410e6/) (Glassdoor mirror) | 2025-08-13 | Frontend Engineer, London, no offer | "Standard 15-minute phone interview, followed by a 1-hour pair coding session"; "live building a chat interface in React with someone from the engineering team, who will review your code live"; "Standard React-related questions, such as what the `useCallback` hook does" |
| XA2 | [Taro](https://www.jointaro.com/interviews/companies/xai/experiences/software-engineer-specialist-yerevan-yerevan-august-1-2025-accepted-offer-negative-c940c932/) | 2025-08* | Software Engineer Specialist, offer | a CodeSignal assessment, then two interviews on JavaScript and React; "What is useRef and how is it used?"; "completely ghosted by the HR team" after the offer |
| XA3 | [Taro](https://www.jointaro.com/interviews/companies/xai/experiences/software-engineering-specialist-canada-october-8-2025-accepted-offer-neutral-ddc2c4f2/) | 2025-10-08 | Software Engineering Specialist, Canada, offer rescinded | a one-hour assessment, a 30-minute technical interview, a one-hour interview with a manager on a Java codebase |
| XA4 | [Aced](https://www.aced.io/experiences/x-ai-software-engineer-interview-7fbd12) | interview 2025-12 | Member of Technical Staff, L3, rejected | a 15-minute screen; "Pick one of the six prompts and build a demoable product in 4 hours" with "the provided X and xAI API keys", a GitHub repository and a Loom video within 24 hours; a one-hour in-person final on "an existing class" |
| XA5 | [Aced](https://www.aced.io/experiences/x-ai-senior-software-engineer-interview-3c2a0d) | interview 2025-11 | Senior Software Engineer, Safety, L5, rejected | intro call, hiring-manager screen, a technical phone screen on a shared pad, two onsite coding and design sessions in Palo Alto, recruiter follow-up; three weeks; no behavioural round |
| XA6 | [Blind](https://www.teamblind.com/post/xai-s-no-leetcode-interview-is-a-joke-8hnrfr1v) | 2026-10 | SWE coding round | a LeetCode problem in a loop marketed as "no LeetCode"; a Meta-badged commenter (c) had practical rounds |
| XA7 | [Blind](https://www.teamblind.com/post/xai-non-ml-position-interview-gmxxbmdx) | 2024-06 | non-ML SWE (p) | quotes the posting template: coding assessment in a language of choice, "Systems hands-on", project deep-dive, meet and greet, "no recruiters" |
| XA8 | 1point3acres [1125096](https://www.1point3acres.com/interview/thread/1125096) | undated | Frontend Engineering onsite, Bay Area | login-locked; public summary: "a React app task and backend algorithm challenge" |

Not used: the Dataford template, PracHub's question list, Exponent's guides (the source of the "no LeetCode" framing), the general Blind threads that carry no stages, and X (the social app) posts.

**Proposed table: frontend engineers, London and Bay Area, from postings 2025-03 to 2026-02 and one London account (thin)**

| Stage | What happens | Who | Sources |
|---|---|---|---|
| Application review | Engineers, not recruiters, review the CV and a "statement of exceptional work" | All | XA-O1, XA-O2, XA-O5, XA-O7 |
| Screening | A 15-minute "phone interview" with "some basic technical questions" | All | XA-O2, XA-O3, XA-O4; XA1 |
| React coding interview | "Write a small app in React" in TypeScript; 45 minutes in London; one or two interviews on Bay Area teams. The one account built a chat interface in a one-hour pair-coding session with live review | Frontend roles | XA-O2 to XA-O6; XA1 |
| HTML/CSS interview | "Given a screenshot of a UI, implement it"; 45 minutes with Tailwind in London | Frontend roles on the grok.com, Enterprise and London postings | XA-O2, XA-O3, XA-O4, XA-O7 (postings only) |
| Coding assessment in a language of your choice | A general coding round before the frontend interviews | Grok Studio and Autonomous Agents | XA-O5, XA-O6 (postings only) |
| Systems hands-on | A live problem-solving session | Autonomous Agents | XA-O6 (posting only) |
| Meet the team or founding engineer | Present past exceptional work to a small audience (Bay Area); 30 minutes with founding engineer Toby Pohlen (London) | All | XA-O2, XA-O5, XA-O6, XA-O7 |
| UI design exercise and presentation | Design a UI in Figma or Photoshop; a 20-minute presentation of past design work | Designer-hybrid role only | XA-O7 |
| Take-home and code-reading final | A four-hour AI-assisted product build with a GitHub repository and a Loom walkthrough, then a one-hour in-person session on an existing class | General software-engineer loops from late 2025; not on any frontend posting | XA4, XA-N1 context |

**Caveats**
- Every frontend posting with a loop was removed between 2025-06 and 2026-02; the 2026-10-21 board has no frontend posting with interview text. The table describes the 2025 to early-2026 loops.
- The "Software Engineer Specialist" loops (XA2, XA3) look like a contractor or human-data track with a CodeSignal assessment; they are not in the table.
- All postings promise "to finish the main process within one week" on Google Meet; the general accounts report three to four weeks (XA4, XA5).
- Whether coding rounds are LeetCode-style varies by team (XA5, XA6, XA7).
- Naming: xAI, SpaceXSI or SpaceXAI is an editorial decision; search demand is for "xai".

**Re-checked:** XA1 ("1-hour pair coding session", "chat interface in React", "`useCallback`"), XA2 ("What is useRef and how is it used?"), XA4 ("six prompts", "4 hours", GitHub and Loom), XA-O2 (the four London stages), XA-O4 and XA-O5 (read by the coordinating session earlier on 2026-10-21).

## Status (2026-10-21)

Built the same day, after the user's approval of the three pages: `COMPANY_INTERVIEW_PROCESSES` in `frontend/src/app/shared/company-previews/company-interview-processes.ts` gained `jpmorgan` (one team-specific variant with seven stages; the super-day rows cite the generic LeetCode and Taro accounts and say so), `agoda` (two variants: the Bangkok relocation loop with eight stages and a Gurgaon variant with six) and `xai` (one variant from the 2025 to 2026 postings plus the London account, titled "xAI (now SpaceXAI) frontend interview process"). `COMPANY_OFFICIAL_GUIDES` gained three rows per company. The spec slug list and the SSR test's `COMPANIES_WITH_PROCESS_TABLES` include the three slugs. Every cited source is one read in full; Glassdoor, 1point3acres and templates are not cited.

## Next steps

- **Approval per table.** Each company table needs its own yes/no before it goes on a page, following the 2026-10-20 pilot.
- **JPMorgan wording.** The page must say the loop is team-run; the table's super-day rows are labelled as generic-loop evidence until a React-titled account confirms them.
- **Agoda scope.** Publish the Bangkok relocation loop as the table; describe Gurgaon as a variant and leave Manila and Bangalore out.
- **xAI scope and name.** Label the table as "from postings 2025–2026 plus one London account"; decide between xAI and SpaceXAI in the title before writing. The "Software Engineer Specialist" CodeSignal loops stay off the page.
- **Measure.** Read Search Console 4–6 weeks after the pages deploy, as for the earlier tables.
- **Re-check before editing.** careersatagoda.com and x.ai block automated reads; the archive captures and the Chrome read are dated in each section.
