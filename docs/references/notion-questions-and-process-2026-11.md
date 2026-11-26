# Notion: reported frontend interview questions and interview process

> **Status, 2026-11-25.** Step 2 of the traffic-candidate research (`reports/company-traffic-candidates.md`): the research record, written from saved files only, with no web access in this step.
> Nothing is built: no page, catalog item, company tag, router entry or plan entry. New items, access levels and the take-home practice wait for the user's decisions (sections 10 to 12).
> Format model: `docs/references/binance-questions-and-process-2026-11.md`; row format: `docs/references/disney-questions-and-process-2026-11.md`.

## 2. Why Notion (rankability check of 2026-11-25)

- **Chosen on 2026-11-25** as the third company of the traffic round, in place of Sigma Computing. The user did not treat FrontendLead's company template ranking first as a blocker.
- **Group 2 of the round (brand interest, few suggestions, soft page 1).** Page 1 for `notion frontend interview questions` (Google US, web results, 2026-11-25): FrontendLead's template first, then Dataford, FastPrep, Glassdoor, 1point3acres, cleverprep, PracHub, a GitHub question list, InterviewDB and JobMentis. One first-hand host, one Glassdoor result, no authority site. Where FrontendLead's template ranks first, our comparable pages reach second to fourth at best (Datadog: FrontendLead first, ours fourth).
- **Demand.** Four Google suggestions pair Notion with a frontend term: `notion frontend interview`, `notion frontend engineer`, `notion frontend developer`, `notion staff frontend engineer`. The intern family adds `notion software engineer intern interview process`. Semrush volume was not measured (quota). **Intent warning:** `notion interview template` and `notion interview prep template` come from people looking for app templates, so company-wide queries are mixed; page targeting stays on the frontend and intern queries.
- **Postings on 2026-11-25** (Ashby `notion`, 173 open): two frontend postings, Design Engineer, Notion.com (New York, published 2026-11-23) and Software Engineering Intern, Frontend (Summer 2027; New York, secondary San Francisco; published 2026-11-06), plus Software Engineer, Web Infrastructure (San Francisco, secondary New York; published 2026-11-09).
- **Readable sources.** Live official prep guides for the Front End, Intern and New Grad tracks; 43 Taro pages (4 frontend-titled); 2 FrontendLead forum posts, a Substack write-up, an Aced card and 16 first-person Blind accounts; GitHub traces of the JSON viewer task and of the official 2026/27 take-home.

## 3. Research rules

The user's rules of 2026-11-25 (`research_notes/traffic-candidates-2026-11/agent-brief-step2.md`), short:

1. **Frontend-only by content.** Frontend questions stay, and so do the general questions frontend loops also ask (algorithms, behavioural, take-home review, debugging), whoever was asked. Backend implementation, backend or distributed system design, network internals, OS and concurrency, SQL, security protocols and non-JS language questions are dropped. Mixed rows are trimmed with a note. Row numbers are stable; removals are listed under Count.
2. **Source classes.** FrontendLead forum posts and Taro count as reports. Template and prep sites (PracHub cards, Aced question cards, Dataford, Prepfully, Glassdoor and 1point3acres snippets) are corroboration only (T or P). A row that rests on them alone is marked unverified and is never locked.
3. **The page shows no per-question sources and no site names, only the year** a question was reported. Sources stay in this record. The method note in section 11 names no site.
4. **No GitHub repository URLs and no take-home brief text in this record** (it is published in the public repo). GitHub traces appear as counts (N candidate solution repos, with years); their URLs stay in `research_notes/traffic-candidates-2026-11/notion/sources-step1.md` (section 6) and `raw/github-*.txt`.
5. **Take-homes in our own words:** what to build, inputs, required behaviour, constraints, time box, what reviewers look at, follow-ups. No company data, design files or brand names in practice items.
6. **Practice column:** `Var: <catalog id>` links as is; `Yakın: <catalog id> + what is missing`; `Yok: new item`. Catalog: the `origin/dev` export of 2026-11-25 (504 items).
7. **Access default for new items:** company-specific signature tasks premium; generic algorithms and trivia free.
8. **The 2026/27 @-mention take-home is active** and its repository asks candidates not to publish solutions. It is described here in our own words; its practice is a different-spec exercise (NEW-7), pending the user's decision.
9. **Quotes** are short, exact, from saved files only, with the source id beside each. No quote comes from a summary line: Taro index lines, bracketed complaint summaries in the Taro dump, or the lead's own-words summary of the take-home in the official-guides file.

Access codes: F read in full; S sentence-level; P search snippet or title only; U unreadable; T a prep site's own card (corroboration only); G a GitHub trace (counted, never quoted); (pre) a pre-interview ask; (c) a commenter's own account.

## 4. Sources

### 4.1 By class

| Class | Count | Ids | Years | Notes |
|---|---|---|---|---|
| Official prep guides, live (read 2026-11-25 in the user's Chrome) | 4 pages | O1 to O4 | 2026 | Preferred over the older copies where they differ. Code Review section body not captured |
| Official, older copies and blog | 4 Wayback copies, 1 blog post | O5 to O8, O9 | 2023, 2026 | Logistics, references, values |
| Official starter repository of the 2026/27 early-career take-home | 1 | O10 (G, counted only) | 2026 | URL in research_notes |
| Postings (Ashby `notion`, 173 open on 2026-11-25) | 5 read | JP1 to JP5 | 2026 | None states interview steps |
| Notion engineer's statements (Hacker News) | 3 | H1 to H3 | 2021, 2022, 2025 | Employee, not official |
| Taro (read by the lead in Chrome) | 43 read: 32 with verbatim text (TA), 11 in one-line index form (TX) | TA-, TX- plus hash | 2023 to 2026 | 4 frontend-titled; 23 feed question rows |
| FrontendLead forum | 2 posts | FL1, FL2 | 2026 | Reformatted by the site on 2026-11-01 |
| Substack | 1 post | S1 | 2025 | General SWE loop, full text |
| Aced | 1 experience card (S), 1 question card (T) | A1, T13 | 2026 | Technical-round block is a placeholder |
| Blind | 155 threads read; 16 first-person accounts, 16 pre-interview asks, 1 intern ask | B5 to B33, B-FE1 to B-FE4, B9 to B32 (pre), B-I1 | 2020 to 2026 | Mostly general SWE |
| PracHub | 12 cards and guide lines (T) | T1 to T12 | 2025, 2026 | No card links a first-person account |
| GitHub traces (G, counts only) | JSON viewer: 1 candidate solution repo (2023), 2 practice repos reusing its sample data (2025), 1 older starter (2019, employer not verified). 2026/27 take-home: 1 public candidate solution and 2 public forks (2026). Older early-career take-homes: 6 candidate repos (2023 to 2024) and 5 (2024) | GH1 to GH4 | 2019 to 2026 | URLs in research_notes |
| Not citable (P) | Glassdoor: 3 reviews and company pages; 1point3acres: 6 threads; about 20 template and vendor sites | – | – | `raw/serp-and-unfetched-urls-2026-11-25.txt` |
| Unreadable (U) | Reddit (refused by the search tool); one Medium post (403) | – | – | – |

Raw saves: `research_notes/traffic-candidates-2026-11/notion/raw/` (32 files plus `raw/blind/`); Taro: `notion/taro/taro-dump-2026-11-25.md`; live guides: `notion/raw/official-notion-site-guides-2026-11-25.txt`.

### 4.2 Official pages

| id | page | read | what it gives |
|---|---|---|---|
| O1 | Software Engineering Interviews (track gallery), https://notion.notion.site/Software-Engineering-Interviews-63876cbf0aa9455fa0f0ffc854b40f6a | live, 2026-11-25 | Stages for every track; the gallery lists 22 tracks, among them Front End, Fullstack, Early Career, New Grad, Intern and Web Infrastructure |
| O2 | Front End Interview Prep, https://notion.notion.site/Front-End-Interview-Prep-04fe1776e31f46ad960a6877a6d0ad72 | live, 2026-11-25 | The frontend loop with durations, React and CodeSignal, the AI-enabled round, software design, career history. The Code Review heading is present but its body did not render in two reads |
| O3 | Intern Interview Prep, https://notion.notion.site/Intern-Interview-Prep-3c9efdeead05802594d2ef9d5dded673 | live, 2026-11-25 | Early-career stages, the take-home (Q15), the debugging-slot agenda |
| O4 | New Grad Interview Prep, https://notion.notion.site/New-Grad-Interview-Prep-3c9efdeead0580b4adeedbcd96f78893 | live, 2026-11-25 | Same as O3 plus a values capstone, references and a background check |
| O5 | Interviewing at Notion, https://notion.notion.site/Interviewing-at-Notion-47f38b00bc0e4ceeaa56007e12e61d8b | Wayback 2026-06-10 | Google Meet, breaks, behavioural style, anchor days |
| O6 | Interview Guides - Technical Roles, https://notion.notion.site/Interview-Guides-Technical-Roles-50e339f3fa8a4c8a8a4c1cd7a7565110 | Wayback 2026-06-15 | Index of guides; no separate frontend guide in that copy |
| O7 | Software Engineer, Intern, https://notion.notion.site/Software-Engineer-Intern-8e4b4fe36f6144229acc685b06b5bd26 | Wayback 2026-11-06 | Stages and durations; background check |
| O8 | Software Engineering Interviews (older copy of O1) | Wayback 2026-07-11 | Same stages as O1 |
| O9 | Blog, How Notion hires, https://www.notion.com/blog/how-notion-hires (2023-02-02, Chief People Officer) | 2026-11-25 | References, the CEO's role, values |
| O10 | Official starter repository of the 2026/27 take-home (Notion's GitHub organisation; created 2026-06-23, first commit 2026-07-27, last push 2026-08-13) | 2026-11-25 | Starter code and test notes; asks candidates not to fork or publish. Counted only (rule 4) |

The careers page has no process text and no rule for candidates.

### 4.3 Postings and engineer statements

| id | source | what it says |
|---|---|---|
| JP1 | Design Engineer, Notion.com (Marketing, Web team), New York, published 2026-11-23, https://jobs.ashbyhq.com/notion/881d1ece-c6a4-476d-b18d-d699627195e5 | 8 to 12 years; "Semantic HTML, modern CSS, JavaScript and TypeScript, React, and the browser's layout, rendering, and animation systems are materials you know well."; "Agents are already part of how you build."; the product is described as "seamlessly connecting docs, notes, projects, calendar, and email" |
| JP2 | Software Engineering Intern, Frontend (Summer 2027), New York, secondary San Francisco, published 2026-11-06, https://jobs.ashbyhq.com/notion/43ffba97-b64a-4c6a-ac13-c803253c9413 | Production UI on the web client "from marketplace and seller surfaces to permissions and sharing controls"; "Working toward proficiency in React / TypeScript"; a previous internship required |
| JP3 | Software Engineer, Web Infrastructure, San Francisco, secondary New York, published 2026-11-09, https://jobs.ashbyhq.com/notion/06c2599d-4dd5-4f97-843f-7194b546f042 | A junior role on load and interaction performance; "familiarity with React or another component-based UI framework is helpful" |
| JP4 | Recruiting Program Manager, published 2026-06-30, https://jobs.ashbyhq.com/notion/6b9d5c16-450a-42e4-af2a-d492460ca811 | The role must "manage AI and experimental interview formats" |
| JP5 | Software Engineer, Growth (Early Career), published 2026-07-06, https://jobs.ashbyhq.com/notion/297b4ece-765f-4eea-b1b8-46057cb6501f | "Your recruiter will partner with you to find the team that aligns best with your interests" |
| H1 | Hacker News, jitl (a Notion engineer by his own comments), item 26990400, 2021-04-30 | "We ask questions similar to the work you'd actually do at Notion"; quotes the then-backend screen: "This will be a backend only exercise." |
| H2 | Hacker News, jitl, item 29825583, 2022-01-06 | "Our frontend pipeline tests your ability to design and implement components in a UI framework." |
| H3 | Hacker News, jitl, item 45276702, 2025-09-17 | "built the html exporter during my hiring process work trial in 2019" (historical) |

Every posting carries a note on AI that concerns employees, not candidates.

### 4.4 Taro pages with verbatim text (TA)

URL: `https://www.jointaro.com/interviews/companies/notion/experiences/<slug>/`. Titles, places and outcomes as Taro gives them; dates are Taro's interview-time field.

| id | slug | date | title, place, outcome | used in |
|---|---|---|---|---|
| TA-c44a6831 | `software-engineer-frontend-new-york-ny-june-17-2025-no-offer-positive-c44a6831` | 2025-06-17 | Frontend Engineer, New York, no offer | loop: "coding interview, frontend-heavy interview" screen; onsite "Coding interview (data structures and algorithms)" and "System design (full stack)" |
| TA-f31be7ab | `software-engineer-december-16-2025-declined-offer-neutral-f31be7ab` | 2025-12-17 | Software Engineer, declined offer | Q3, Q6, Q14, Q21; 2 weeks |
| TA-04d19cfb | `software-engineer-san-francisco-california-august-27-2026-no-offer-positive-04d19cfb` | 2026-08-28 | Software Engineer, San Francisco, no offer | Q2 |
| TA-0b735320 | `software-engineer-september-1-2026-declined-offer-positive-0b735320` | 2026-09-02 | Software Engineer, declined offer, referral | Q2, Q18, Q19 |
| TA-9dc5b31c | `software-engineer-united-states-april-1-2025-no-offer-neutral-9dc5b31c` | 2025-04-01 | Software Engineer, US, no offer | Q7 |
| TA-41b2f3a3 | `software-engineer-march-22-2026-no-offer-positive-41b2f3a3` | 2026-03-23 | Software Engineer, no offer | loop; Q25 (values round) |
| TA-c39c4bde | `software-engineer-united-states-november-1-2024-no-offer-positive-c39c4bde` | 2024-11-01 | Software Engineer, US, no offer | loop: "The technical screen focused on data structures and was more practical to real-world applications." |
| TA-732c909c | `software-engineer-san-francisco-ca-may-30-2024-no-offer-positive-732c909c` | 2024-05-30 | Software Engineer, San Francisco, no offer | loop: "Tech screen specific to Notion product."; "They provided good pre-interview resources" |
| TA-f07b58c3 | `software-engineer-software-engineer-interview-new-york-april-3-2026-accepted-offer-positive-f07b58c3` | 2026-04-04 | Software Engineer, New York, accepted offer, referral | Q10, Q25; 4 weeks |
| TA-3d57b7c8 | `senior-swe-senior-swe-interview-new-york-april-30-2026-accepted-offer-positive-3d57b7c8` | 2026-05-01 | Senior SWE, New York, accepted offer | loop: "They focused on things like React proficiency and how well you can deal with a real codebase." |
| TA-08d8cec1 | `software-engineer-internship-swe-intern-interview-apr-26-april-25-2026-accepted-offer-positive-08d8cec1` | 2026-04-26 | Software Engineer (Internship), accepted offer | Q9; intern loop |
| TA-614a76ed | `software-engineer-internship-san-francisco-california-june-28-2026-no-offer-positive-614a76ed` | 2026-06-29 | Software Engineer (Internship), San Francisco, no offer | Q9 |
| TA-eff6edec | `software-engineer-san-francisco-california-october-15-2026-no-offer-positive-eff6edec` | 2026-10-16 | Software Engineer, San Francisco, no offer | Q9, Q15; the newest account |
| TA-cc580f1e | `software-engineer-new-grad-san-francisco-california-september-28-2026-no-offer-positive-cc580f1e` | 2026-09-29 | Software Engineer New Grad, San Francisco, no offer | Q15; new-grad loop; 3 weeks |
| TA-506b4163 | `software-engineer-new-york-new-york-january-28-2026-no-offer-positive-506b4163` | 2026-01-29 | Software Engineer, New York, no offer | Q22; 5 weeks; "they even sent a form to gather feedback about their interview process." |
| TA-c084fed3 | `swe-intern-canada-september-1-2025-no-offer-negative-c084fed3` | 2025-09-01 | SWE Intern, Canada, no offer | Q9: "OOP design and React + TS debugging" |
| TA-ad553f23 | `software-engineer-india-june-1-2025-no-offer-negative-ad553f23` | 2025-06-01 | Software Engineer, India, no offer | loop (India); its SQL design round is removed |
| TA-07d66912 | `software-engineerinternship-san-francisco-ca-october-4-2025-no-offer-positive-07d66912` | 2025-10-04 | Software Engineer (Internship), San Francisco, no offer | Q18, Q20; a CodeSignal assessment, then a "Byteboard take-home test (DSA)" |
| TA-0e71f7f0 | `software-engineer-india-october-1-2024-no-offer-negative-0e71f7f0` | 2024-10-01 | Software Engineer, India, no offer | Q6 |
| TA-cd9c6479 | `software-engineering-intern-united-states-october-2-2024-no-offer-positive-cd9c6479` | 2024-10-02 | Software Engineering Intern, US, no offer | Q7, Q9 |
| TA-685c6e6a | `senior-software-engineer-united-states-november-1-2024-no-offer-negative-685c6e6a` | 2024-11-01 | Senior Software Engineer, US, no offer | Q4 |
| TA-b858d70b | `software-engineer-united-states-may-1-2024-accepted-offer-positive-b858d70b` | 2024-05-01 | Software Engineer, US, accepted offer | Q23, Q24; loop |
| TA-30f811c0 | `software-engineer-united-states-january-10-2024-no-offer-positive-30f811c0` | 2024-01-10 | Software Engineer, US, no offer | Q1 |
| TA-5912acf0 | `software-engineer-united-states-february-22-2024-no-offer-neutral-5912acf0` | 2024-02-22 | Software Engineer, US, no offer | Q16 |
| TA-b1ca7ba6 | `software-engineer-backend-new-york-ny-april-1-2024-no-offer-neutral-b1ca7ba6` | 2024-04-01 | Backend Engineer, New York, no offer | Q5 (kept by content) |
| TA-492dad98 | `software-engineer-new-york-ny-september-19-2024-accepted-offer-positive-492dad98` | 2024-09-19 | Software Engineer, New York, accepted offer | Q23; loop: one screen, then two coding, one design and one soft-skills interview |
| TA-7bddc721 | `software-engineer-united-states-february-1-2024-accepted-offer-positive-7bddc721` | 2024-02-01 | Software Engineer, US, accepted offer | loop: "coding pair technical screen" |
| TA-94bcebf9 | `web-developer-san-francisco-ca-august-28-2023-no-offer-negative-94bcebf9` | 2023-08-28 | Web Engineer, San Francisco, no offer | loop: a screener call, then a take-home (content not given) |
| TA-52e52bbc | `frontend-developer-pune-december-3-2023-no-offer-positive-52e52bbc` | 2023-12-03 | Frontend Engineer, Pune, no offer | Q11 to Q13, Q17 |
| TA-dbf41aaf | `front-end-developer-berlin-december-25-2023-no-offer-positive-dbf41aaf` | 2023-12-25 | Frontend Engineer, Berlin, no offer | loop: "JS Base Vue Related REST API And One Test" (topics only) |
| TA-8978ffa3 | `software-engineering-intern-united-states-october-1-2025-no-offer-positive-8978ffa3` | 2025-10-01 | Software Engineering Intern, US, no offer | Q20; intern loop |
| TA-58c8a5b4 | `software-engineer-united-states-november-4-2025-no-offer-negative-58c8a5b4` | 2025-11-04 | Software Engineer, US (DevEx), no offer | removed: "Improve the Task Queue System" |

TA-8978ffa3 and TA-58c8a5b4 were found by search and are missing from the 2026-11-14 sitemap copy.

**Index-only pages (TX; one-line summaries in the dump, never quoted):** TX-9c98662c (early career, 2026-03, recruiter screen only), TX-cc82b598 (quality engineer, 2026-07, accepted; two array coding questions), TX-7d7a2b51 (software developer, 2026-05, recruiter call and an online assessment), TX-ce990f55 (Israel, 2025-05, LeetCode medium and hard), TX-0ea98104 (senior, 2025-02, onsite, rejected), TX-996da12d (2025-01, recruiter, screen, onsite, an NDA), TX-63909c92 (2025-08, the recruiter checked how well the candidate knew the product; Q26), TX-2ae8067b (mobile intern, 2024-09), TX-02404d40 (2024-06, accepted; data wrangling and an ETL design, removed), TX-62dabc29 (2024-03, live coding, a basic CRUD app setup; see section 12), TX-5c0e4b6e (2024-08, accepted; no detail). Slugs: `research_notes/traffic-candidates-2026-11/notion/taro-read-list.txt`.

### 4.5 Other first-person accounts

| id | source | date | role, outcome | what it says |
|---|---|---|---|---|
| FL1 | FrontendLead forum, https://frontendlead.com/discuss/t/notion-swe2-phone-screen/3477 | 2026-05-12 | "SWE2 (3 years)", phone screen; outcome not stated | "Undo/redo: implement and discuss low level design" (Q5). The Tips lines, one linking the site's own question, are probably the site's |
| FL2 | FrontendLead forum, https://frontendlead.com/discuss/t/notion-software-engineer-phone-screen/3430 | 2026-04-20 | "Software Engineer, Senior (6.5 years)", phone screen; outcome not stated | "Visualize JSON in React." and a link to a four-part exercise page whose author's public profile lists Notion (Q1; page URL in research_notes) |
| S1 | Substack, Wild Wild Tech, https://wildwildtech.substack.com/p/notion-interview-experience-2025 | 2025-06-06 | Software Engineer; No Hire | Screen: "an easy-to-medium problem involving string manipulation and implementing undo/redo operations", solved within 35 minutes of a 40 to 45 minute slot (Q5). Same-day rounds: "Notion's DSA rounds deviate from traditional LeetCode-style problems", with the to-do list (Q2); a calendar application design (Q14). No feedback |
| A1 | Aced, https://www.aced.io/experiences/notion-software-engineer-interview-f3bb8c | interview about 2026-08 | SWE, Entry Level / L3, United States; rejected | Recruiter screen and a technical interview: "the coding problem wasn't typical DSA" and "AI assistance is allowed, but feels like you're being judged a bit for using it."; recruiter question "Why are you interested in Notion?" (Q18). The technical-round questions on the card are a repeated placeholder |
| GH1 | 1 candidate solution repo (2023) | 2023-06 to 07 | – | A recursive collapsible JSON view labelled by its author as a Notion interview question, built on the same four stages and sample data as FL2's exercise page (Q1) |

### 4.6 Blind

First-person accounts (F):

| id | thread | date | role | what it says |
|---|---|---|---|---|
| B5 | https://www.teamblind.com/post/notion-swe-interview-gip63r0t ; https://www.teamblind.com/post/notion-onsite-totvg2k1 ; reply in https://www.teamblind.com/post/notion-core-values-interview-eska3k0j | 2026-03 to 04 | SWE; offer | Screen: "They said it wasn't LC, and it was more practical."; onsite: "I see there is an AI enabled interview and also a system design." |
| B6 | https://www.teamblind.com/post/notion-core-values-interview-eska3k0j | 2026-04-06 | SWE | A core values interview after the onsite: "I finished the onsite but have this interview next"; then "Doing reference checks rn" |
| B7 | https://www.teamblind.com/post/notion-core-values-interview-7huz2sw2 ; https://www.teamblind.com/post/notion-vs-harvey-ai-bowupitc | 2026-08-07 | senior; offer | "I have a Notion core values interview coming up (post onsite)"; "It's with the CEO, Ivan." |
| B8 | https://www.teamblind.com/post/notion-vs-stealth-ai-startup-ok4qheld | 2026-08-15 | 10 years; offer | "Ivan himself interviewed me at the end" |
| B14 | https://www.teamblind.com/post/from-unemployed-to-a-bunch-of-offers-in-4-months-staff-swe-interview-experience-journey-81lk4aq3 | 2026-05-07 | Staff SWE | Passed the onsite; "Couldn't find a team match because didn't vibe with the two hiring managers"; "Recruiter said I can be considered for future teams without reinterviewing."; the post-technical calls were hidden behavioural interviews "asking about team challenges/conflicts" (at three companies, Notion among them) |
| B15 | https://www.teamblind.com/post/hiring-manager-exec-interview-failed-repeatedly-bnb15x3q | 2026-04-08 | Staff SWE | Failed "solely due to hiring manager or exec round" at Notion and others; "At Notion I thankfully got some high level feedback." |
| B16 | https://www.teamblind.com/post/final-round-interview-rejects-86zat0nz | 2026-03-26 | 8 years | Rejected at the final round; the feedback call offered in the email never happened |
| B17 | https://www.teamblind.com/post/notion-staff-l5-offer-j7hq4z1y | 2025-06-13 | staff (L5), 10 years; expecting an offer | "phone screen - Coding"; "onsite - 2 coding, sys design, behavioral" |
| B18 | https://www.teamblind.com/post/notion-coding-screen-et2qlvcm | 2025-05-19 | not stated; moved on (reply) | "I answered the initial question, with edge cases and two follow ups." |
| B21 | https://www.teamblind.com/post/notion-wlb-expecting-offer-jwr4brs2 | 2024-12-28 | engineer, 12 years; expecting an offer | Interviewers said several times that "it's delivery focused role -- move really fast." |
| B22 | https://www.teamblind.com/post/ios-interview-at-notion-2jlkbtmc | 2025-01-17 | junior iOS; rejected | "they ask you to make a small app" (mobile; removed) |
| B27 | https://www.teamblind.com/post/notion-interview-experience-7ruuqqkg | 2022-12-16 | not stated; withdrew at references | "3 coding rounds (2 domain, 1 algo), 1 HM behavioral, 1 design) 1 director chat"; "Notion will want to reach out to your references before they give you any indication as to leveling or offer information." |
| B28 | https://www.teamblind.com/post/interview-summary-euo4pyrz | 2022-09-30 | not stated; rejected after the onsite | An onsite question was "basically a topological sort"; "I say O(V+E)." (Q8) |
| B29 | reply in https://www.teamblind.com/post/interview-notion-2dypdfwo | 2022 | app developer; made the onsite | A REST API screen with in-memory message storage (backend; removed) |
| B31 | https://www.teamblind.com/post/notion-phone-screen-swe-gwhweya7 | 2022-04-07 | SWE | A multi-part screen: "Got all parts working except for an optional part in the end"; bugs pointed out and fixed |
| B33 | replies in https://www.teamblind.com/post/notion-interview-yevtmkpg | 2020-06-24, 2022-05-18 | roles not stated (the thread's opening poster is a mobile engineer) | "It was a very application based question." (2020); "it's very web application based" (2022) |

Pre-interview asks (pre), used for process facts only:

| id | thread | date | fact |
|---|---|---|---|
| B-FE1 | https://www.teamblind.com/post/notion-full-stack-front-end-interview-uuluw8jp | 2025-06-05 | Front end or full stack screen: "I know it involves react but they're pretty vague about what it could entail" |
| B-FE2 | https://www.teamblind.com/post/technical-interview-with-notion-gahuotpk | 2024-03-19 | "FE SWE (IC1-3)"; replies: "They do general coding not LC" |
| B-FE3 | reply in https://www.teamblind.com/post/notion-interview-4vuxmjte | 2022-06-16 | "For frontend it's a regular react interview for building a small application." and "Prep materials your recruiter gives you should be pretty accurate" (not stated as the replier's own loop) |
| B-FE4 | https://www.teamblind.com/post/notion-machine-coding-ghopzm5g | 2024-01-29 | India, 6 years: an "upcoming Machine coding round with Notion" |
| B9 | https://www.teamblind.com/post/notion-onsite-fwow8u5y | 2026-08-23 | Backend onsite with "software design, AI coding, or behavioral rounds" |
| B10 | https://www.teamblind.com/post/notion-debugging-interview-vxhbvtfw | 2026-08-31 | "they have a debugging round"; no reply from a Notion candidate |
| B11 | https://www.teamblind.com/post/notion-onsite-ai-enabled-round-g2q6dntm ; https://www.teamblind.com/post/notion-onsite-coming-up-ri526l4y | 2026-08-24, 09-13 | Full-stack virtual onsite, Hyderabad; asks whether the AI-enabled round is existing code or "Or a fresh problem just like coding round and we need to build it with the help of AI" |
| B13 | https://www.teamblind.com/post/notion-in-india-seems-to-get-people-interviewing-sign-an-nda-get-them-to-do-their-assignment-and-then-they-ghost-you-yeu34f4y | 2026-10-26 | India; candidates "sign an NDA, get them to do their assignment and then they ghost you" (role not stated) |
| B19, B20, B23 | https://www.teamblind.com/post/notion-tech-screen-x3mmggjp ; https://www.teamblind.com/post/notion-interview-of58nmhy ; https://www.teamblind.com/post/any-insights-into-notion-interview-for-software-engineering-role-5xfepdac | 2025-07, 2025-03, 2024-10 | "All I know is that it's not leetcode."; "non leetcode styled coding questions with a team member" (backend-focused role); "Recruiter told me they wont be Leetcode style questions." |
| B24, B25 | https://www.teamblind.com/post/notion-interview-prep-4dwnto3i ; https://www.teamblind.com/post/notion-interview-process-qlwgwaqe | 2023-12, 2023-03 | A backend design round the recruiter "mentioned that it's unlike other design interviews"; a screen document saying candidates "solve a real world problem based on how Notion manages its documents" (Q7) |
| B26, B30, B32 | https://www.teamblind.com/post/anyone-interviewed-with-notion-recently-rsgt3t8j ; https://www.teamblind.com/post/notion-interview-tech-screen-lsf5mizf ; https://www.teamblind.com/post/notion-coding-interview-s565c3mo | 2023-03, 2022-03, 2022-02 | "No leetcode, just practical programming exercises"; a 2022 backend screen of "setting up an API, sending a payload, and returning a response" (removed); "There's a two hour coding session stated on their website" |
| B-I1 | https://www.teamblind.com/post/notion-swe-fall-intern-interview-3nuulu4c | 2026-05-19 | Fall intern: "I have a virtual onsite for Notion coming up"; asks about the coding round |

Not evidence: a 2026-03 reply in B5's onsite thread lists document, text and database coding prompts and two backend designs, and ends by offering a paid question bank. It is promotional, not first-person.

### 4.7 Templates (T, corroboration only)

PracHub cards read through tool summaries (`raw/prachub-*.txt`); none links a first-person account. T1 recursive React JSON viewer with collapse, shown 2025-07 (Q1). T2 text editor with undo and redo, shown 2025-08 (Q5). T3 block-based document editor with insert, update, move, delete and render, 2026-11 (Q7). T4 to-do list object model, 2026-06 (Q2, Q7). T5 table aggregation, 2026-02. T6 permissions and sharing with view, edit and owner levels, 2026-11. T7 shared calendar service, locked (Q14). T8 top errors in a time window, locked. T9 fewest character deletions to make two strings equal. T10 a DAG task graph with cycle rejection and a deterministic order (Q8). T11 a generic undo and redo for arithmetic commands, listed under General. T12 PracHub's Notion guide (frontend phrases: a slow React component, a recursive JSON viewer, a text editor with undo and redo). T13 Aced question card, Design Notion, reported about three years ago. Section 12 lists the T-only items.

## 5. Official process facts

- **All tracks (O1, live 2026-11-25; same as O8, 2026-07-11).** Initial interview with the talent team; a technical assessment: "You'll be building a solution to a real world problem with a Notion engineer in a live coding exercise."; panel interviews of two 60-minute coding interviews, a 60-minute design of a piece of software or a system to a rough spec, and a 60-minute career history interview; a final interview on past experience, values and motivations with a member of the leadership team, with a pointer to the operating values; reference checks; offers contingent on a background check with employment verification.
- **Front End track (O2, live 2026-11-25).** Initial interview (30 minutes); technical screen, a 60-minute coding interview; a 4-hour virtual onsite of an AI-enabled coding interview, code review, software design and career history; final interview(s) of 30 to 45 minutes; reference checks; background check.
  - React and the IDE: "Notion's frontend coding interviews are designed and optimized to be completed in React." and "By default, Notion uses CodeSignal as our coding interview tool (IDE), using React."
  - AI: "For this one interview, AI coding tools are available and strongly encouraged." The other coding rounds restrict AI: "Unlike our standard coding interviews where we restrict AI usage to understand how you solve problems". The guide names an AI-enabled IDE (Cursor, or VS Code with GitHub Copilot) or an agentic CLI such as Claude Code next to another IDE, and marks the round as needing preparation.
  - The AI-enabled round: a small toy codebase in CodeSignal; "There may be some failing test cases, performance issues, or poorly-written code that we'll work together to fix." The code is TypeScript but the round is not a TypeScript quiz, there are no LeetCode-style traps, and "the codebase is based off a realistic (but simplified) part of the Notion application."
  - Software design: an open-ended problem; "We'll collaborate using your diagramming tool of choice." (Excalidraw, Google Drawings or Whimsical are named).
  - Code review: the section heading is present; its body did not render in two reads (**not captured**).
  - Career history: with an engineering leader; past teams, collaboration, successes and challenges, high and low points, transitions, strengths and weaknesses, and why Notion; read the operating values.
  - General: ask clarifying questions; "You're welcome to look up anything you need on Google, StackOverflow, etc, and any common libraries can all be used."; talk while working.
- **Intern (O3, live 2026-11-25).** Initial interview (15 minutes); take-home assessment (3 hours); virtual onsite (2 hours) of a debugging interview and a coding interview; career history (45 minutes). Debugging-slot agenda: introductions 5 minutes, take-home review 10, debugging 40, questions 5. CodeSignal by default; your own editor if you tell the coordinator. The take-home is described in Q15. The Wayback copy of 2026-11-06 (O7) names the last stage Final Conversation and states that "all interviews will be conducted virtually over Google Meets".
- **New Grad (O4, live 2026-11-25).** As for interns, plus a 30-minute values capstone, reference checks and a background check.
- **Logistics (O5, Wayback 2026-06-10).** "Most interviews will be conducted virtually over G-Meet"; "For interviews lasting more than 3 hours, we will do our best to include a break in your schedule."; behavioural questions of the "tell me about a time" kind, with the advice to cover "fewer things but in more detail"; three in-office anchor days (Monday, Tuesday, Thursday).
- **References and the CEO (O9, 2023).** "We believe that references are a strong predictor of success at Notion, not just an exercise in checking the box." and "Our CEO and founder, Ivan Zhao, is involved in the hiring process for almost every role". Values named there: "we are drivers of our mission", pace setters, truth seekers, "we are kind and direct".
- **Candidates' AI use.** The only official rule is O2's, for the frontend track (the AI-enabled round encourages it; other coding rounds restrict it). Postings carry an AI note about employees; JP4 shows recruiting runs AI and experimental interview formats; JP1 asks a senior design engineer to show agent workflows in the job, not in the interview.
- **Team matching.** Early-career hires are matched to a team by the recruiter (JP5).
- **Not found:** a reapply or cooling-off rule; the Code Review content; a time box for any coding task other than the take-home's 3 hours.

## 6. Loop by role, level and region

### 6.1 Front End track and frontend-leaning loops, experienced (2022 to 2026)

- **Official shape since 2026** (O2): recruiter call, a 60-minute React screen on CodeSignal, a 4-hour virtual onsite (AI-enabled coding, code review, software design, career history), a final interview with leadership, references, background check.
- **Screens reported:** a JSON viewer in React (FL2, senior, 2026; TA-30f811c0, a one-hour live React screen in mini-challenges after a 30-minute recruiter call, 2024); undo and redo (FL1, SWE2, 2026); a coding interview that was frontend-heavy (TA-c44a6831, 2025); "a regular react interview for building a small application" (B-FE3, 2022, with recruiter prep material); a multi-part screen with follow-ups (B18, 2025; B31, 2022).
- **Onsites before the 2026 change:** frontend coding, a manager interview, a full-stack system design and a data-structures-and-algorithms coding round (TA-c44a6831, Frontend Engineer, New York, 2025); career history, system design, frontend coding and backend coding over two days, then an executive call, team matching and two to three reference checks (TA-b858d70b, 2024); two coding, one design and one soft-skills interview (TA-492dad98, 2024); three coding rounds (two domain, one algorithm), a hiring-manager behavioural, a design and a director chat (B27, 2022).
- **2026 reports:** the AI-enabled interview "requires a good understanding of modern AI tools, e.g., Claude Code, Cursor" (TA-f07b58c3, accepted); React proficiency and working in a real codebase (TA-3d57b7c8, senior, accepted); a core values interview after the onsite, often with the CEO (B6, B7, B8); staff candidates passed the onsite but failed or stalled at hiring-manager calls and team match (B14, B15).
- **A senior loop of 2024** (TA-685c6e6a) ran seven coding exercises; the last was a paired React build from a blurry screenshot (Q4).
- **A 2025 loop** (TA-f31be7ab) lists a React menu component, a frontend system design of a calendar UI, a JavaScript class for string manipulation, and a project retrospective that decided the team.

### 6.2 Generic and full-stack software engineers (contrast, 2020 to 2026)

- The SWE guide (O1) gives every track two 60-minute coding interviews, a design to a rough spec and a career history. Reports repeat that coding is practical, not LeetCode-style (TA-f07b58c3, TA-41b2f3a3, TA-7bddc721, TA-492dad98, B5, B19, B23, B26), while some screens focus on data structures (TA-c39c4bde) and some loops include an algorithm round (B27, TA-c44a6831).
- Backend screens of 2021 and 2022 set up a small web API and test it with cURL or a similar tool (H1, B29, B30); they are out of scope.
- Recruiters send prep documents and the screen follows them closely (TA-9dc5b31c, TA-732c909c, B-FE3, B25).

### 6.3 Early career: intern and new grad (2024 to 2026)

- **Official (O3, O4):** 15-minute call, 3-hour take-home, 2-hour virtual onsite (debugging, coding), 45-minute career history; new grads add a 30-minute values capstone and references.
- **2026/27 take-home:** the @-mention menu (Q15). TA-eff6edec (2026-10) describes "a take-home, where you're asked to build a feature parallel to one Notion has", then the debugging and phone-screen rounds; TA-cc580f1e (new grad, 2026-09) lists "A Take-Home Assignment", a virtual onsite and two behavioural interviews.
- **2025/26 cycle:** an online assessment, a take-home, two coding rounds (one debugging, one practical) and a hiring-manager chat (TA-08d8cec1, accepted, 2026-04); a take-home first, two back-to-back interviews "(not LeetCode style)" and a hiring-manager interview (TA-8978ffa3, 2025-10); a CodeSignal general assessment and a third-party DSA take-home (TA-07d66912, 2025-10). The 2025/26 take-home's content is not known.
- **Debugging round:** TypeScript-only (TA-cd9c6479, 2024), React and TypeScript (TA-c084fed3, 2025), "Debugging a mini Notion" (TA-614a76ed, 2026), a codebase to diagnose (TA-eff6edec, 2026).
- **Coding round:** a class to store and retrieve documents (TA-cd9c6479, 2024); "OOP design" (TA-c084fed3, 2025); building a feature with object-oriented code (TA-eff6edec, 2026); "practical system design coding questions" (TA-614a76ed, 2026).
- **Earlier take-homes (context; removed from the list):** 2023/24, a script that reads ratings from a CSV file and writes aggregates to a database through the public API (6 candidate solution repos, 2023 to 2024); 2024/25, a mail command-line app on the same API (5 candidate solution repos, 2024). Neither has a UI.
- A fall-intern onsite with a coding round was asked about in 2026 (B-I1); frontend IC1 to IC3 screens are "general coding not LC" (B-FE2, 2024).

### 6.4 India (2023 to 2026)

- Frontend Engineer, Pune, 2023 (TA-52e52bbc): an assignment to replicate the company's homepage (Q17), then a technical round of React and JavaScript questions ending with a DSA question (Q11 to Q13), then HR.
- 2024 (TA-0e71f7f0): a first coding round of text-editor functions run against test cases (Q6). 2025 (TA-ad553f23): a screen on code quality and SOLID principles, a design round on database modelling and SQL (removed), and a pair-programming session with "a follow-up, focusing on code readability, correctness, and solution trade-offs".
- 2024 to 2026 asks: a machine coding round (B-FE4); a full-stack virtual onsite in Hyderabad with an AI-enabled round (B11); assignments under an NDA, role not stated (B13).

### 6.5 Europe and other places

- Frontend Engineer, Berlin, 2023 (TA-dbf41aaf): topics only, JavaScript basics, Vue, a REST API and one test. Israel, 2025 (TX-ce990f55): LeetCode medium and hard (stage-level only). No other European frontend account.

### 6.6 Levels, timing and work model

- **Levels seen:** intern, new grad, entry level L3 (A1), FE IC1 to IC3 (B-FE2), SWE2 (FL1), senior (FL2, TA-3d57b7c8, TA-685c6e6a, B7), staff (B14, B15, B17).
- **Timing:** all rounds within a week (S1); two weeks (TA-f31be7ab, TA-04d19cfb); three weeks for a new grad (TA-cc580f1e); four weeks (TA-f07b58c3); five weeks (TA-506b4163). "The turnaround between rounds was at most two to three business days." (TA-f07b58c3).
- **References before the offer:** B27 (2022), B6 (2026), TA-b858d70b (2024), O1, O9.
- **Feedback:** none (S1, B16); high-level feedback (B15); a feedback form after rejection (TA-506b4163).
- **Work model:** virtual interviews on Google Meet (O5, O7); three in-office anchor days (O5, JP1); the frontend intern works from the New York or San Francisco office (JP2).
- **Pace:** interviewers told a candidate that "it's delivery focused role -- move really fast." (B21, 2024).

## 7. The question list

One row per distinct question or task, by content (rule 1). Years are the years the page would show. Sources: the number of independent first-person sources, then (+official, +T, +P, +G) for other classes. Practice per rule 6. Access is proposed only for new items. Quotes in Notes carry their source ids; the remaining quotes are in section 4.

### A. Live UI builds

| # | Question or task (our words) | Round | Years | Sources | Ids | Practice | Access (new) | Notes |
|---|---|---|---|---|---|---|---|---|
| Q1 | Render a JSON value as a collapsible tree in React, built in stages: an object of strings, numbers and booleans with an expand and collapse state; values that are objects, each with its own toggle; deep nesting; arrays | technical or phone screen; one hour of live React in mini-challenges, with questions afterwards | 2023, 2024, 2026 | 3 (+T, +P) | FL2, TA-30f811c0, GH1; T1; P (a Glassdoor snippet) | Yakın: `react-file-explorer` (recursive tree, open and close, keyboard) + `js-dom-renderer` (recursive render of a nested object) + `js-safe-json-parse` (the parse-error follow-up); missing: JSON value types, arrays versus objects, collapsed summaries, the staged build. Yok as a task: NEW-1 | premium (NEW-1) | "Visualize JSON in React." (FL2, senior, 2026); "Build a JSON object reader." (TA-30f811c0, 2024). The four stages come from the exercise page linked by FL2, whose author lists Notion as employer; GH1 uses the same stages and data. Whether the page is the interviewers' own is not verified. Follow-ups seen only on T1: parse a JSON string with a helpful error, per-node state, explain the component structure and complexity; the exercise page adds a styling question. Never reuse the exercise's sample record |
| Q2 | Build a bulleted to-do list where a new item can be inserted at any position, then let items nest under a bullet | coding interview, 50 minutes (2026); a product-style coding round solved as a data structure (2025); a technical phone screen on list features (2026) | 2025, 2026 | 3 (+T) | TA-04d19cfb, S1, TA-0b735320; T4 | Yakın: `react-todo-list` (flat add, toggle, remove) + `react-nested-comments` (recursive tree UI) + `js-build-tree-from-flat-list` (tree model); missing: insert at a position, indent and outdent, moves that keep subtrees. Task: NEW-2 | premium (NEW-2) | "I had 50 mins to solve it." (TA-04d19cfb). S1: "Write code to maintain a to-do checklist, allowing users to insert items anywhere." then "Implement nesting functionality for the to-do list."; S1 tracked parent-to-child indexes and "The interviewer suggested an easier navigation method". TA-0b735320 names only "a Notion-related question about implementing lists functionality", so it counts as probably the same task |
| Q3 | Build a menu component for the product in React (the account gives no spec) | one of four rounds in a loop the account introduces as the tech screen | 2025 | 1 | TA-f31be7ab | Var: `react-vanilla-dropdown-port`; also `react-select-compound-api` | – | "a React challenge to build a menu component" (TA-f31be7ab). The practice covers the usual menu requirements (keyboard, Escape, outside click, ARIA); the reported spec is unknown |
| Q4 | Build a fairly simple UI in React from a blurry screenshot, with no design file, in a paired session; the interviewers asked for plain hooks | the last of seven coding exercises in a senior loop | 2024 | 1 | TA-685c6e6a | Yakın: `ui-component-state-from-mock` (design from a mock) + `css-flexbox-navbar`, `css-grid-card-gallery`; missing: a timed React build from an image reference | – (shared gap with Verkada's planned design-to-UI item) | "seventh and final coding exercise", "build a fairly straightforward UI in React", "just use this blurry screenshot"; the candidate offered fancier hook APIs and "they specifically told me not to" (TA-685c6e6a). Rejected as fine but not strong enough |

### B. JavaScript and TypeScript coding (product-model classes)

| # | Question or task (our words) | Round | Years | Sources | Ids | Practice | Access (new) | Notes |
|---|---|---|---|---|---|---|---|---|
| Q5 | Implement undo and redo for text edits, then discuss the low-level design: how edits are recorded, what undo restores, when redo history is dropped | phone or technical screen (40 to 45 minutes in 2025) | 2024, 2025, 2026 | 3 (+T, +P) | FL1, S1, TA-b1ca7ba6; T2; P (a 1point3acres title, a Glassdoor snippet) | Yok: NEW-3 | premium proposed (NEW-3) | "Undo/redo: implement and discuss low level design" (FL1, SWE2, 2026); "an easy-to-medium problem involving string manipulation and implementing undo/redo operations", solved within 35 minutes (S1). "Given a text editor class, write the code for undoing and redoing text operations." (TA-b1ca7ba6, asked under a Backend Engineer title; kept by content). Follow-ups on T2 only: edits at any position, very large documents, branching history, merging keystrokes |
| Q6 | Implement the functions of a basic text editor class (string manipulation), checked against given test cases | first coding round (2024); one of four rounds (2025) | 2024, 2025 | 2 | TA-0e71f7f0, TA-f31be7ab | Yok: part 1 of NEW-3 (changed from the lead's Yakın on string helpers: none of them practises an editor class with state) | premium proposed (NEW-3) | "Implement functions for a basic text editor." with "a simple problem with some test cases" (TA-0e71f7f0); "a JS class for string manipulation" (TA-f31be7ab). Probably the first half of Q5's task; neither account says so |
| Q7 | Design classes and functions to store, retrieve and manage documents (an object-oriented coding question, which one account calls system design coding) | technical screen (2025); intern technical interview (2024) | 2024, 2025 | 2 (+1 prep-document statement, +T) | TA-cd9c6479, TA-9dc5b31c; B25 (pre, 2023); T3, T4 | Yok: NEW-4 | premium (NEW-4) | "Design a class to store and retrieve documents." (TA-cd9c6479); "create classes and functions to manage documents", and the screen was "very similar to what was in the prep documents they sent" (TA-9dc5b31c). B25's prep document said candidates "solve a real world problem based on how Notion manages its documents". Same round type, subject not stated: "build a feature using OOP" (TA-eff6edec, 2026), "OOP design and React + TS debugging" (TA-c084fed3, 2025), "practical system design coding questions" (TA-614a76ed, 2026) |

### C. Algorithms

| # | Question or task (our words) | Round | Years | Sources | Ids | Practice | Access (new) | Notes |
|---|---|---|---|---|---|---|---|---|
| Q8 | An onsite coding question that came down to a topological sort; the interviewer asked for its time complexity | onsite coding | 2022 | 1 (+T) | B28; T10 | Yok: NEW-5 | free (NEW-5) | "basically a topological sort"; the candidate answered "I say O(V+E)." and the feedback called the complexity wrong (B28), so a strong answer defines V and E for the given input. Other algorithm evidence names no problem (process tables) |

### D. Debugging, code review and AI-enabled rounds

| # | Question or task (our words) | Round | Years | Sources | Ids | Practice | Access (new) | Notes |
|---|---|---|---|---|---|---|---|---|
| Q9 | Find, diagnose and fix bugs in a small Notion-like React and TypeScript codebase | early-career virtual onsite: 40 minutes of debugging after a 10-minute take-home review (official); intern and SWE loops | 2024, 2025, 2026 | 5 (+official) | TA-cd9c6479, TA-c084fed3, TA-08d8cec1, TA-614a76ed, TA-eff6edec; O3, O4; B10 (pre) | Var: `react-debug-api-misuse`, `react-debug-transcript-sync`, `react-debug-double-render` (small React and TypeScript apps with user reports); `js-debug-bug-squash-invoices` (an unfamiliar multi-file repo with failing tests) | – (optional NEW-8, section 10) | "Debugging a mini Notion plus practical system design coding questions." (TA-614a76ed); "The debugging interview was only done in TypeScript" (TA-cd9c6479); "The debugging round tests your ability to find and diagnose bugs in a codebase" (TA-eff6edec). CodeSignal by default, your own editor on request (O3) |
| Q10 | Work in a small TypeScript toy codebase taken from a simplified part of the product: make failing tests pass, fix performance problems, clean up poorly written code, with AI coding tools allowed and encouraged | virtual onsite, AI-enabled coding interview (frontend track) | 2026 | 2 (+official, +2 pre) | O2; TA-f07b58c3, B5; B9 (pre, backend), B11 (pre, full stack) | Yakın: `js-debug-bug-squash-invoices` (failing tests in an unfamiliar repo) + `react-debug-double-render` (a render-performance bug); missing: a TypeScript toy codebase with failing tests, a slow path and messy code, worked with an AI assistant | – (optional NEW-8) | O2's rules are in section 5. "They've also added an AI-enabled interview that requires a good understanding of modern AI tools, e.g., Claude Code, Cursor." (TA-f07b58c3). No first-person account describes the codebase |

Not a row: the onsite **Code Review** round of the frontend track (O2). Its body was not captured and no candidate describes it. Practice for the stage: Yakın: review modes `intern-budget-case` and `spoken-prefix-case` (JavaScript) and `issue-label-filter-review-v1` (Vue). **No React code-review practice exists.**

### E. Trivia

| # | Question or task (our words) | Round | Years | Sources | Ids | Practice | Access (new) | Notes |
|---|---|---|---|---|---|---|---|---|
| Q11 | What are hooks in React? | technical round after the assignment | 2023 | 1 (+P) | TA-52e52bbc; P (Glassdoor snippet) | Var: `react-hooks-youve-used` (changed from the lead's `react-usestate-purpose`, a narrower match) | – | Frontend Engineer, Pune |
| Q12 | How do you stop components from re-rendering? (the account says containers) | same round | 2023 | 1 | TA-52e52bbc | Var: `react-rerender-decision-and-render`; also `react-usememo-vs-usecallback`, `react-context-performance-issues` | – | |
| Q13 | What is the difference between `useEffect` and `useState`? | same round | 2023 | 1 (+P) | TA-52e52bbc; P (Glassdoor snippet) | Var: `react-usestate-purpose` + `react-useeffect-purpose` | – | The round ended with "a DSA question" (TA-52e52bbc), not named |

### F. System design

| # | Question or task (our words) | Round | Years | Sources | Ids | Practice | Access (new) | Notes |
|---|---|---|---|---|---|---|---|---|
| Q14 | Design the frontend of a calendar: views, event layout, editing, data loading (a second account was asked to design a calendar application in a general design round; its capacity estimates, tables and change-data-capture parts are trimmed as backend) | one of four rounds (2025); system design round (2025) | 2025 | 2 (+T) | TA-f31be7ab, S1; T7 | Yok: NEW-6 | premium proposed (NEW-6) | "frontend system design about building a calendar UI" (TA-f31be7ab); "I was asked to design a calendar application, a common problem." (S1), covering requirements, entities, APIs and a block diagram. The 2026 Design Engineer posting lists calendar among the product's surfaces (JP1) |

Not a row: the design to a rough spec (O1; open-ended, 60 minutes, on a diagramming tool, O2) and "The system design interview focused more on data modeling and API design rather than scaling." (TA-b858d70b) are stage facts; they go into the process tables with practice links.

### G. Take-homes

| # | Question or task (our words) | Round | Years | Sources | Ids | Practice | Access (new) | Notes |
|---|---|---|---|---|---|---|---|---|
| Q15 | Early-career take-home, 2026/27 cycle: build an inline mention menu in a text box that suggests pages, people and dates from sources with different speeds, then extend it in one focused direction (details below) | take-home, 3 hours; reviewed for 10 minutes at the start of the debugging slot | 2026 | official + 2 (+G) | O3, O4, O10; TA-eff6edec, TA-cc580f1e; GH3 (1 public candidate solution and 2 public forks, 2026) | Yakın: `react-chips-input-autocomplete` (suggestions become removable tokens, keyboard) + `js-autocomplete-engine` (debounce, stale responses, ranking) + `js-take-latest` (cancellation) + `realtime-search-debounce-cache` (design); missing: several sources with different latency merged and ranked, relative dates, a trigger inside text. Practice: NEW-7, a different-spec exercise (rule 8) | premium proposed (NEW-7); **pending the user's decision** | The repository asks candidates not to publish solutions; no brief text or solution is reproduced. TA-eff6edec's "build a feature parallel to one Notion has" (2026-10) is probably this take-home |
| Q16 | Walk the interviewer through your take-home, then extend it with new features together with the team | early-career debugging slot (10 minutes of review, official); a technical interview built on the take-home (2024) | 2024, 2026 | 1 (+official) | TA-5912acf0; O3, O4 | Yakın: `react-take-home-table-review-questions` (the defend-and-extend format); missing: review questions on an autocomplete build | – | "This project will be reviewed and checked with another engineer." and "You will then implement new features based on this with the team during a technical interview." (TA-5912acf0) |
| Q17 | Assignment: rebuild the company's public homepage as a responsive page | assignment round before a technical round and HR (Frontend Engineer, Pune) | 2023 | 1 | TA-52e52bbc | Yakın: `html-semantic-layout`, `css-flexbox-navbar`, `css-grid-card-gallery`, `css-fluid-clamp`; missing: a full landing page from a reference (the gap of Q4) | – | "The assignment was to replicate the Notion homepage." (TA-52e52bbc). A practice uses our own page, never the company's design or assets |

**Q15 in our words (rule 5).**
- *What to build:* typing a trigger character and a few letters in a plain text box opens a menu of matching pages, people and dates; choosing one inserts a reference.
- *Inputs:* a React and TypeScript client with a plain text box, naive trigger detection that assumes the caret is at the end, one request per keystroke and plain-text insertion. A small local server whose page search already works (case-insensitive title match, stable order, a result limit) and is slowed down on purpose, with an optional failure rate, so that slow, failing and out-of-order responses happen. A people directory hosted by the company that the candidate wraps with an endpoint of their own: unranked substring matches over about ten thousand people, a cap per response, real and sometimes slow latency. Dates are produced on the client.
- *Required behaviour:* one focused direction rather than everything. The guide's examples: a styled, non-editable token for the inserted reference; keyboard navigation; accessibility; fast typing (debounce, cancellation, out-of-order responses); people results; dates such as today and tomorrow; one ranking across result kinds. The starter's notes add caret-aware trigger detection, closing the menu, several mentions in one text, highlighting the match, caching, and using page body text and recency in ranking.
- *Constraints:* Node 22 or newer; a built archive sent through a form; no public fork or published solution; a write-up of at most 500 words.
- *What reviewers look at:* product taste, reasoning and fundamentals, deliberate trade-offs (O3). A small suite runs against each submission to check the tasks the candidate says they completed; a few focused tests are expected (the server endpoint; ranking and date logic as plain functions), and a relative date must resolve against the clock when it is used, not be stored as a word.
- *Time box:* 3 hours (O3); the repository states none.
- *Follow-up:* the 10-minute take-home review in the onsite (Q16).

### H. Conversations

| # | Question or task (our words) | Round | Years | Sources | Ids | Practice | Access (new) | Notes |
|---|---|---|---|---|---|---|---|---|
| Q18 | Why Notion? Why are you interested in the company? | recruiter screen; career history (official prep) | 2025, 2026 | 3 (+official) | TA-0b735320, TA-07d66912, A1; O2 | Var: behavioral guide (`/guides/behavioral`) | – | "Why am I interested in Notion?" (TA-0b735320) |
| Q19 | What do you want next in your career? | recruiter screen | 2026 | 1 | TA-0b735320 | Var: behavioral guide | – | "What do I want moving forward?" (TA-0b735320) |
| Q20 | Tell me about a project | intern loops | 2025 | 2 | TA-8978ffa3, TA-07d66912 | Var: behavioral guide | – | "Tell me about a project." (TA-8978ffa3) |
| Q21 | Walk through a past project as a retrospective, which the company uses to decide your team | one of four rounds | 2025 | 1 | TA-f31be7ab | Var: behavioral guide | – | "a project retro behavioral screen to assess which team" (TA-f31be7ab) |
| Q22 | What AI tools have you used? | not stated | 2026 | 1 | TA-506b4163 | Yakın: behavioral guide; missing: an answer guide on the AI tools you use and how you check their output (it also prepares Q10) | – | "What AI tools have you used?" (TA-506b4163) |
| Q23 | Career history: your biggest achievements, challenges, how you worked with others, high and low points, transitions, strengths and weaknesses | onsite career history (60 minutes; 45 for early career) | 2022, 2024, 2025, 2026 | 4 (+official) | O1, O2, O3; TA-b858d70b, TA-492dad98, B17, B27 | Var: behavioral guide | – | Official advice: fewer stories in more detail, and what you did yourself (O5). TA-b858d70b calls its career and executive interviews behavioural and motivational |
| Q24 | A hiring-manager or executive call after the technical rounds that probes team challenges, conflicts and leadership, even when presented as an informal chat | after the onsite, before team match | 2024, 2026 | 3 | B14, B15, TA-b858d70b | Var: behavioral guide | – | B14: the calls ended up "asking about team challenges/conflicts"; B15 failed "solely due to hiring manager or exec round" |
| Q25 | A final interview on your past experience, values and motivations with a leader, often the CEO; read the operating values first | final interview (30 to 45 minutes); new-grad values capstone (30 minutes) | 2026 | 5 (+official) | O1, O2, O4, O9; B6, B7, B8, TA-f07b58c3, TA-41b2f3a3 | Var: behavioral guide | – | "It's with the CEO, Ivan." (B7); "Ivan himself interviewed me at the end" (B8). B27's 2022 loop ended with a director chat |
| Q26 | How well do you know the product? (the recruiter checked it) | recruiter call | 2025 | 1 (+official) | TX-63909c92; O5 | Var: behavioral guide | – | Index line only, not quoted. The general guide asks candidates to read about the company as a business and a product (O5) |

## 8. Count

- **Rows:** 26 listed, Q1 to Q26: A 4, B 3, C 1, D 2, E 3, F 1, G 3, H 9.
- **By content:** 13 frontend rows (Q1 to Q4, Q9 to Q17) and 13 general rows (product-model coding Q5 to Q7, the algorithm Q8, conversations Q18 to Q26). One mixed row is trimmed: Q14 loses S1's capacity estimates, tables and change-data-capture discussion. Q5 keeps an account given under a Backend Engineer title because the question is general.
- **Practice mappings:** technical rows Q1 to Q17: Var 5, Yakın 7, Yok 5. Conversation rows Q18 to Q26: Var 8 (behavioral guide), Yakın 1 (Q22). In all: Var 13, Yakın 8, Yok 5.
- **Removed before numbering (rule 1 or rule 2):**
  - backend screens that set up a web API (H1, 2021; B29 and B30, 2022);
  - "Improve the Task Queue System" (TA-58c8a5b4, 2025, a DevEx loop);
  - data wrangling and an ETL pipeline design (TX-02404d40, 2024);
  - a design round on database modelling and SQL queries (TA-ad553f23, 2025);
  - the 2023/24 and 2024/25 early-career take-homes (a CSV-to-database script and a mail command-line app on the public API, no UI; 6 and 5 candidate solution repos), kept as context in 6.3;
  - mobile tasks: an iOS small app (B22, 2025), a mobile intern's coding project (TX-2ae8067b, 2024);
  - the promotional Blind reply in B5's onsite thread (not first-person);
  - template-only items (T5, T6, T8, T9, T12, T13), listed in section 12.
- **Not rows, format only (they go into the process tables):** "Front-end heavy interview (React)" (TA-c44a6831); "a regular react interview for building a small application" (B-FE3); H2's components in a UI framework; "Tech screen specific to Notion product." (TA-732c909c); the data-structures screen (TA-c39c4bde); algorithm rounds that name no problem (TA-c44a6831, TA-52e52bbc, B27, TX-ce990f55, TX-cc82b598); "OOP design" (TA-c084fed3) and "build a feature using OOP" (TA-eff6edec); the Code Review round (O2); the design to a rough spec (O1, O2) and its data-modelling focus (TA-b858d70b); the third-party DSA take-home (TA-07d66912); "JS Base Vue Related REST API And One Test" (TA-dbf41aaf).
- **Changes to the lead's catalog mapping** (`reports/company-traffic-candidates.md`, section `Katalog eşleme ön çalışması`):
  1. Text editor class: Yakın (string helpers) became Yok, covered by NEW-3 part 1 (Q6).
  2. Hook trivia: `react-hooks-youve-used` is the match for "What are hooks" (Q11); `react-usestate-purpose` and `react-useeffect-purpose` answer Q13 together; `react-rerender-decision-and-render` answers Q12.
  3. CRUD (Var: `react-todo-list`, `react-contact-form-starter`): not listed; its only trace is a 2024 Taro index line that does not say frontend or backend (section 12).
  4. Code review (review modes), the general design to a rough spec (28 designs) and the data-model and API design (Yakın) moved from rows to process-table stages, because no question was reported.
  5. Permissions and sharing (Var: `js-folder-access-over-time`, unverified) moved to section 12: its only source is a template card (rule 2).
  6. Added rows the pre-mapping excluded: the take-homes Q15 to Q17 and the conversations Q18 to Q26. Partial links added: `js-dom-renderer` and `js-safe-json-parse` (Q1), `js-build-tree-from-flat-list` (Q2).
- **Step-1 inventory numbers (`sources-step1.md`, section 4) in this list:** 1 is Q1; 2 is Q5 and Q6; 3 is Q15; 4 is Q2; 5 is Q14; 6 (the block editor, T only) is in section 12; 7 and 10 are process-table stages; 8 is Q10; 9 is Q9; 11 is Q23; 12 is Q25; 13 is Q24; 14 is Q8; 15, 16 and 17 (T only) are in section 12; 18 is removed (no UI).
- **Most repeated:** the debugging round (Q9: 5 accounts 2024 to 2026, plus the official agenda); the final or values interview (Q25: 5 accounts in 2026, plus official pages); career history (Q23: 4 accounts plus official); the JSON viewer (Q1: 3 sources, 2023 to 2026); undo and redo (Q5: 3 accounts, 2024 to 2026, plus 2 editor-function accounts in Q6); the nested to-do list (Q2: 3 accounts, 2025 to 2026); document classes (Q7: 2 accounts plus a 2023 prep document).
- **Source concentration:** no single account dominates; most rows rest on one or two Taro pages. Only 4 Taro pages carry a frontend title; one names questions (TA-52e52bbc) and one gives the round structure (TA-c44a6831). Most rows come from Software Engineer accounts whose track is not stated, kept because the questions are frontend or general.
- **Gaps for a page:** no first-person account of the 2026 frontend onsite round by round; the Code Review content is unknown; no account gives the menu's spec (Q3) or the JSON viewer's time box beyond a one-hour screen; no TypeScript-typing, accessibility or CSS question is reported apart from the screenshot build (Q4) and the homepage assignment (Q17).

## 9. Proposed interview process tables (years only on the page)

Practice links refer to the catalog or to the new items of section 10. The Sources column stays in this record; the page shows the Years column.

**Variant 1: Front End track and frontend-leaning loops, experienced (official 2026; reports 2022 to 2026)**

| Stage | What happens | Who | Years | Sources (record only) | Practice |
|---|---|---|---|---|---|
| Recruiter call | 30 minutes with the talent team: your experience, what you want next, why the company | All | 2024–2026 | O1, O2; TA-30f811c0, TA-0b735320 | behavioral guide |
| Technical screen | 60 minutes of live coding in React on CodeSignal with an engineer: a practical, product-shaped build in parts, such as a JSON viewer, a nested to-do list, undo and redo or a menu, with follow-ups; AI tools are restricted | All | 2022–2026 | O2; FL1, FL2, TA-30f811c0, TA-04d19cfb, TA-c44a6831, S1, B18, B31, B-FE3 | NEW-1, NEW-2, NEW-3; `react-vanilla-dropdown-port` |
| Onsite: AI-enabled coding | A TypeScript toy codebase from a simplified part of the product with failing tests, slow code and poorly written code; AI tools encouraged; set up your AI IDE or CLI beforehand | All | 2026 | O2; TA-f07b58c3, B5 | `js-debug-bug-squash-invoices` (Yakın); optional NEW-8 |
| Onsite: code review | Listed in the 2026 frontend guide; its content is not public | All | 2026 | O2 | review modes (JavaScript, Vue); no React review yet |
| Onsite: software design | An open-ended problem drawn on a diagramming tool of your choice; reported: a calendar UI, and data modelling and API design rather than scale | All | 2024–2026 | O1, O2; TA-f31be7ab, TA-b858d70b, S1 | NEW-6; `ui-component-state-from-mock` |
| Onsite: career history | 60 minutes with an engineering leader: past teams, achievements, challenges, transitions, strengths, why the company | All | 2022–2026 | O1, O2; TA-b858d70b, TA-492dad98, B17, B27 | behavioral guide |
| Before 2026: a second coding round | Onsites had two coding rounds: frontend coding plus an algorithm round or backend coding | Reported loops | 2022–2025 | TA-c44a6831, TA-b858d70b, TA-492dad98, B17, B27, B28 | NEW-5 |
| Hiring manager or executive call, team match | A conversation about past projects that probes team challenges and conflicts; then a search for a team | Candidates who pass | 2024–2026 | B14, B15, TA-b858d70b | behavioral guide |
| Final interview | 30 to 45 minutes with a leader, often the CEO: experience, values, motivations | Candidates who pass | 2026 | O1, O2; B6, B7, B8, TA-f07b58c3 | behavioral guide |
| References and background check | References, sometimes before the level and offer are discussed; a background check with employment verification | Offer stage | 2022–2026 | O1, O2, O9; B6, B27, TA-b858d70b | – |

**Variant 2: Intern and New Grad (official 2026; reports 2024 to 2026)**

| Stage | What happens | Who | Years | Sources (record only) | Practice |
|---|---|---|---|---|---|
| Recruiter call | 15 minutes | All | 2024–2026 | O3, O4; TA-cd9c6479, TA-07d66912, TA-cc580f1e | behavioral guide |
| Online assessment | A general coding assessment before the take-home in some intern loops | Some candidates | 2025–2026 | TA-07d66912, TA-08d8cec1 | – |
| Take-home | 3 hours; in 2026/27 an inline mention menu with pages, people and dates, with a write-up of at most 500 words; earlier cycles used scripts on the public API with no UI | All | 2023–2026 | O3, O4, O10; TA-08d8cec1, TA-8978ffa3, TA-cc580f1e, TA-eff6edec; GH4 (earlier cycles) | NEW-7 (pending the user's decision) |
| Onsite: debugging | 5 minutes of introductions, a 10-minute review of your take-home, 40 minutes of debugging a small React and TypeScript codebase, 5 minutes of questions | All | 2024–2026 | O3, O4; TA-cd9c6479, TA-c084fed3, TA-08d8cec1, TA-614a76ed, TA-eff6edec | `react-debug-api-misuse`, `react-debug-transcript-sync` |
| Onsite: coding | A practical coding interview, not LeetCode style; reported: classes that store and manage documents, object-oriented features | All | 2024–2026 | O3, O4; TA-cd9c6479, TA-08d8cec1, TA-eff6edec, TA-c084fed3, TA-8978ffa3 | NEW-4 |
| Career history | 45 minutes; reported as a hiring-manager conversation | Candidates who pass | 2025–2026 | O3, O4; TA-08d8cec1, TA-8978ffa3 | behavioral guide |
| New grads: values capstone and references | A 30-minute values interview, then reference checks | New grads | 2026 | O4; TA-cc580f1e | behavioral guide |
| Background check | With employment verification | Offer stage | 2026 | O3, O4, O7 | – |

**Variant 3 (optional, or page copy): India, 2023 to 2026**

| Stage | What happens | Years | Sources (record only) |
|---|---|---|---|
| Assignment | Rebuild the company's homepage (frontend, Pune); an assignment under an NDA in 2026 (role not stated) | 2023, 2026 | TA-52e52bbc; B13 |
| Technical rounds | React and JavaScript questions ending with a DSA question; text-editor functions against test cases; code quality and SOLID; pair programming with a readability follow-up | 2023–2025 | TA-52e52bbc, TA-0e71f7f0, TA-ad553f23 |
| HR | A closing HR round | 2023 | TA-52e52bbc |

Stage labels on the page: years only (for example `Reported 2024–2026`); the counts stay in this record (rule 3).

## 10. New items to build (proposals; each needs the user's yes)

Agreed flow for every item (2026-11-25): built one by one, verified with the check engine, wrong-solution examples and a blind solver, one commit each on dev, no company tag until the page skeleton exists. Budget (lead's note from the `origin/dev` perf report): `/coding` HTML 627 KB against a 660 to 700 KB threshold, total HTML 72.3 of 75 MB; a coding row costs about 3 KB of `/coding` HTML (Binance record), so the six coding items below add about 18 KB. No item reuses the company's data, design files, brief text or brand.

### NEW-1 JSON viewer in stages (Q1), React + TypeScript, premium

- **Goal:** render any JSON value as a read-only tree with per-node collapse, built in the four stages the screen uses.
- **Inputs:** a JSON value from our own fixtures (for example a playlist with nested objects and an array of tracks); a later stage takes a JSON string.
- **Behaviour:**
  1. An object of primitives renders as key and value lines: strings quoted, numbers and booleans plain, `null` as `null`; the whole object collapses to a summary such as `{…} 4 keys`.
  2. Values that are objects get their own toggles; collapsing a child leaves its parent open.
  3. Deep nesting works by recursion; toggle state is per node (keyed by its path) and survives sibling updates.
  4. Arrays render with indices and collapse to `[…] 6 items`; empty containers render as `{}` or `[]` with no toggle.
  5. A JSON string with a syntax error shows a readable error and no tree.
- **Checks a runner can verify:** text for each stage's fixture; a toggle hides only its own subtree; `aria-expanded` on each toggle; summary text with counts; no toggle on empty containers; quotes only on strings; the error state.
- **Follow-ups:** a default expansion depth; expand all and collapse all; a keyboard tree (ARIA tree roles, arrows), as in `react-file-explorer`; lazy children for large data; copy the path of a value; an editing mode (a 2019 starter hints at it; unverified).
- **Time box:** 45 to 60 minutes (the 2024 account: a one-hour live React screen in mini-challenges).
- **Runner capability:** none new (clicks, DOM text, attributes).

### NEW-2 Nested to-do outliner (Q2), React + TypeScript, premium

- **Goal:** a bulleted to-do list where items can be inserted anywhere and nested, with the model separate from the UI.
- **Inputs:** an initial tree of items `{ id, text, done, children }` (our fixture).
- **Behaviour, part 1 (model, pure functions):** insert after an item; insert at an index under a parent; indent (the item becomes the last child of its previous sibling; no-op for a first child); outdent (the item becomes the next sibling of its parent; state and test what happens to its later siblings); remove an item with its subtree; toggle done. Ids are stable and the input is never mutated.
- **Behaviour, part 2 (UI):** nested lists; Enter inserts an empty item after the current one and focuses it; Tab and Shift+Tab indent and outdent; Backspace in an empty item removes it and focuses the previous item; a checkbox toggles done.
- **Checks:** unit tests of the model (order, nesting, immutability, first-child indent, top-level outdent, removal with children); UI tests with key events and focus assertions; nested list markup.
- **Follow-ups:** move an item with its subtree by keyboard; collapse a parent; whether completing a parent completes its children; undo (NEW-3); a flat list with parent ids and order keys versus a nested tree (S1's interviewer hinted at a simpler way to reach children than index bookkeeping).
- **Time box:** 50 minutes (reported).
- **Runner capability:** Tab handled inside the component and focus checks. The spec must keep a way out for keyboard users (for example Escape leaves the editing mode), so the outliner is not a Tab trap.

### NEW-3 Text editor with undo and redo (Q5, Q6), TypeScript, premium proposed

- **Goal:** part 1, a small text-buffer class with editing functions; part 2, an edit history with undo and redo; then a design discussion.
- **Inputs:** a class API of our own: construct with optional text; insert text at the cursor; delete a number of characters before the cursor (clamped); move the cursor (clamped); read the text and the cursor. Part 2 adds undo, redo and checks for whether each is possible.
- **Behaviour:** an edit that changes nothing is not recorded; a new recorded edit drops the redo history; undo and redo on an empty history do nothing; undo restores the text and the cursor; cursor moves alone are not undo steps (stated in the spec).
- **Checks:** unit tests on edit sequences: clamping, the undo and redo order, redo dropped after a new edit, ignored no-op edits, cursor restored, a long sequence of small edits within a time limit.
- **Follow-ups (discussion):** commands with inverse operations versus snapshots; merging consecutive typing into one undo step; a history cap; selections and replace; branching history; wiring it to a React text input with the usual shortcuts.
- **Time box:** 40 to 45 minutes (S1 solved it in about 35 minutes of a 40 to 45 minute screen).
- **Access reasoning:** premium, because it is the most repeated Notion screen question (three accounts 2024 to 2026, plus two editor-function accounts) and the item carries the company-shaped follow-ups. The alternative, free, would serve undo-redo searches as a traffic page; the user decides.
- **Runner capability:** none new.

### NEW-4 Document store classes (Q7), TypeScript, premium

- **Goal:** design classes that store, retrieve and manage documents, the object-oriented round reported in 2024 and 2025.
- **Inputs:** a class API of our own: create a document with a title, a body and an optional parent; get by id; update with a version bump; delete to a trash together with its descendants; restore; list the children of a parent by last update. Part 2: move a document under a new parent (rejecting a move under its own descendant) and return the ancestor path for breadcrumbs. Part 3: search titles (case-insensitive; prefix matches before other matches, then by recency).
- **Checks:** unit tests on sequences and invariants: no cycles; trashed documents hidden from lists and search; restore brings back the subtree; versions increase; timestamps from an injected clock.
- **Follow-ups:** version history and restoring an older version; per-document permissions with inheritance (the unverified template card T6); ordered blocks inside a document with insert and move; serialisation; two edits against the same version.
- **Time box:** 45 to 60 minutes (official coding interviews last 60).
- **Runner capability:** none new (the clock is a parameter).

### NEW-5 Topological sort (Q8), JavaScript, free

- **Goal:** order modules so each comes after the modules it imports, or report a cycle.
- **Inputs:** a list of `{ id, imports }` records (our framing: a bundler's module graph).
- **Behaviour:** a deterministic order (ties broken by input order) so the answer is unique; a cycle is reported with its members in path order; a self-import is a cycle; an unknown import id throws; modules without imports are included.
- **Checks:** a chain, a diamond, independent modules, the tie-break, a cycle and its path, a self-loop, the unknown id, a 10,000-module graph within a time limit.
- **Follow-ups:** O(V+E) and what V and E are here (the reported interviewer disputed the candidate's answer); Kahn's algorithm versus depth-first search with colours; parallel batches by level; re-ordering after one edge changes.
- **Time box:** 30 to 40 minutes. **Runner capability:** none new.

### NEW-6 Calendar UI system design (Q14), system design, premium proposed

- **Goal:** design the frontend of a team calendar with day, week and month views and event editing.
- **Prompt in our words:** requirements and non-goals; the client data model (events normalised by id; recurring events expanded for the visible range only); loading by visible range, prefetching neighbours, a cache keyed by range and calendar; the layout of overlapping events in columns; drag to create, move and resize with optimistic updates and rollback; time zones and daylight-saving changes; updates from other people (polling or push, reconciled with local edits); slow and offline states; accessibility (grid semantics, keyboard creation and moving, screen-reader labels); performance (virtualised long ranges, no layout thrash while dragging).
- **Checks:** the design format's rubric and practice questions; no runner.
- **Follow-ups:** editing one occurrence versus the whole series; shared calendars and permissions; the overlap layout as a coding exercise.
- **Time box:** 45 to 60 minutes (the official design interview lasts 60).
- **Access reasoning:** premium, as the company's reported prompt and in line with the recent company-page designs; the generic patterns stay in the free design set. Free is the alternative.

### NEW-7 Practice for the 2026/27 take-home (Q15), React + TypeScript, premium proposed, pending the user's decision (rule 8)

- **Not the take-home.** A different specification that trains the same skills: mixed-source autocomplete, debounce, cancellation and out-of-order responses, keyboard navigation and ranking.
- **Proposal: a command palette for a small notes app.** One input searches three sources:
  1. a local list of commands (instant);
  2. a mock document-search API with 100 to 600 ms latency, failures on demand and responses that can resolve out of order;
  3. a jump-to-date parser for relative phrases (`today`, `next friday`, `in 3 days`) resolved against an injected clock when chosen.
- **Behaviour:** debounce remote search; ignore or cancel stale responses so the last query wins; show local results at once and add remote results when they arrive; per-source sections or one merged list ranked by a documented score (exact prefix, then word start, then substring; commands boosted for short queries; recent documents boosted); keyboard navigation (arrows with wrap, Enter, Escape, Home and End) on an ARIA combobox and listbox with `aria-activedescendant`; a remote error that keeps the other sources visible; empty and loading states.
- **Checks:** fake timers advance the debounce; a controllable fetch mock resolves requests out of order and fails on demand; stale results never render; ranking and date resolution are exported as pure functions with unit tests and an injected clock; key events move the active option.
- **Follow-ups:** caching by query prefix; highlighting the match; a trade-off write-up of at most 300 words. An optional extension (the user's call, off by default because it moves closer to the take-home): open the palette from a trigger character typed at the caret in a text area.
- **Time box:** 60 to 90 minutes.
- **Access reasoning:** premium, as the practice for the page's early-career signature task; free is the alternative if the user prefers a generic autocomplete practice.
- **Runner capability:** advancing fake timers, controllable async mocks with out-of-order resolution, an injectable clock.

### Optional NEW-8 (not flagged by the lead): mini notes app to debug and clean up (Q9, Q10), React + TypeScript, premium

- **Goal:** one small multi-file TypeScript app (a page list and a block editor) with three failing tests, one performance problem (every block re-renders on each keystroke) and one poorly written module to refactor. It trains the early-career debugging round (five accounts) and the 2026 AI-enabled round (official).
- **Checks:** the failing tests pass; a render-count bound; the module's behaviour is unchanged after the refactor.
- **Runner capability:** a multi-file TypeScript project and render-count checks.
- **Decision needed** from the user. A React code-review mode for the Code Review stage is the other unfilled gap; it also needs a decision.

## 11. Page package notes

- **Signature (directory) proposal:** `AI-enabled coding round`. It is official, new in 2026 and specific to the frontend onsite. Fallback: `Practical React screen` (the JSON viewer, the nested to-do list, undo and redo).
- **Spotlights (round decoders, open):**
  1. The AI-enabled round: the official facts (toy TypeScript codebase, failing tests, performance issues, poor code; AI tools encouraged only here; set up the tools beforehand) and how to work: read the failing tests first, ask the assistant for a map of the code, verify every change by running the tests, narrate decisions.
  2. The early-career path: take-home, then a 10-minute review inside the debugging slot, then a practical coding round; the 500-word write-up; the reviewers' criteria.
  3. The practical screen: a JSON viewer in four stages.
- **Lock rule (from the Binance page):** a row is locked only when the unlock adds something the open topic does not: reported constraints or follow-ups, an answer guide or a practice task.

| Lock (13 rows) | What the unlock adds | Open (4 rows plus 9 conversations) |
|---|---|---|
| Q1 JSON viewer | the four stages, follow-ups, NEW-1 | Q11 hooks (free trivia) |
| Q2 nested to-do list | the 50-minute box, insert anywhere then nesting, the interviewer's hint, NEW-2 | Q12 stop re-renders (free trivia) |
| Q3 menu component | practice `react-vanilla-dropdown-port` | Q13 `useEffect` versus `useState` (free trivia) |
| Q4 UI from a blurry screenshot | the constraints (no design file, plain hooks, paired) | Q17 homepage assignment (a brief, not a question) |
| Q5 undo and redo | the low-level design discussion, follow-ups, NEW-3, answer guide | Q18 to Q26, open by design |
| Q6 text editor functions | the test-case format, NEW-3 part 1 | |
| Q7 document classes | the prep-document hint, NEW-4 | |
| Q8 topological sort | the complexity follow-up, NEW-5 | |
| Q9 debugging round | the agenda, TypeScript, practice links, answer guide | |
| Q10 AI-enabled round | what the codebase contains, the tools, answer guide | |
| Q14 calendar UI design | the scope, NEW-6, answer guide | |
| Q15 take-home | the task in our words, reviewers' criteria, the write-up, NEW-7 | |
| Q16 take-home review and extension | the review slot and the live extension | |

- **Answer guide candidates:** Q10 (working with an AI assistant in the round), Q9 (a debugging method: reproduce, read the failing test, find the entry point, form a hypothesis, fix, re-run), Q5 (command versus snapshot history, redo invalidation, merging keystrokes), Q14 (a calendar design outline), Q15 (choosing one direction and defending it), Q24 (stories about coordination and conflict, not only fast solo projects). Each cites the reported follow-ups (the no-templates rule).
- **Hero caveat:** most first-hand accounts come from Software Engineer loops whose track is not stated, and only a few name the frontend track; the Code Review round's content is not public; the AI-enabled round is new in 2026 and is described mainly by the company's own guide.
- **Method note for the page bottom (no site names):**

  > How we collected these questions: we read public interview accounts written by candidates (forum posts, blog write-ups and interview-experience pages), the company's own interview guides and job postings, and code that candidates published while preparing. A question is listed when at least one first-hand account or the company's own guide describes it; question lists on prep sites were used only to cross-check. Each question shows the year it was reported, not who reported it. Tasks are described in our own words: we do not publish take-home briefs, starter code or anything a company asked candidates to keep private, and every practice exercise uses our own specification, data and tests.

- **Freshness line:** `Reported 2022–2026. Newest account: October 2026. Company guides checked November 2026.`
- **Targeting:** title, H1 and meta lead with the frontend and intern queries (`notion frontend interview`, `notion frontend engineer`, `notion software engineer intern interview process`). No template wording in titles or headings, so the page does not compete for app-template searches; call the plan a prep plan.
- **Profile inputs:** framework React with TypeScript (O2, JP1, JP2); the frontend coding rounds are in React by default (O2).

## 12. Open questions and unverified items

1. **Code Review (O2):** the section body did not render in two reads; a third Chrome read may capture it. Until then the stage has no content and no React review practice exists.
2. **The take-home practice (NEW-7), rule 8:** the user decides the specification, the access level and whether the caret-trigger extension is allowed.
3. **Access decisions:** NEW-3 (premium proposed, free possible), NEW-6 (premium proposed, free possible), NEW-7 (premium proposed). Optional NEW-8 and a React review mode need a yes or no.
4. **Template-only items (unverified, kept off the list):** permissions and sharing with view, edit and owner levels (T6; the lead mapped `js-folder-access-over-time`, which fits if the user wants an unverified row); table aggregation (T5); a block-based document editor (T3, which corroborates Q7); top errors in a time window (T8); fewest deletions to make two strings equal (T9); a slow React component (T12); Design Notion (T13).
5. **CRUD app setup (TX-62dabc29, 2024):** the index line does not say frontend or backend, and the 2021 and 2022 backend screens built an API, so it is not listed. A re-read of the Taro page would settle it.
6. **FL1 and FL2:** whether they are independent of each other and of other sites is not known; the site reformatted both on 2026-11-01, and older search snippets show different titles.
7. **The JSON exercise page:** the interviewers' own page or a public practice page is not verified.
8. **A1 versus O2:** A1 (entry level, 2026) says AI assistance was allowed in the technical interview, while O2 restricts AI outside the AI-enabled round. The early-career rule is not stated officially.
9. **The 2025/26 early-career take-home** is not identified (TA-08d8cec1 and TA-8978ffa3 took one; TA-07d66912 got a third-party DSA take-home).
10. **Taro counts:** this record counts 32 pages with verbatim text, 23 of which feed question rows, and 11 index-only pages; the lead's summary says 24 frontend-relevant pages. The difference is one of definition.
11. **Not citable (P):** the Glassdoor snippets (a frontend-heavy screen, a practical React widget in the screen and onsite, a recruiter guide the process closely followed, hooks and `useEffect` versus `useState`) and a 1point3acres title about undo and redo for text input corroborate Q1, Q5, Q11 and Q13 only.
12. **Unreached:** Reddit; LeetCode Discuss holds only a 2026 India compensation post.
13. **B13's NDA claim** (India, 2026) names no role; whether frontend loops in India sign one is unknown.
14. **Step-1 count:** its summary says 15 Blind accounts; its table lists 16 ids (B5 to B33), which this record uses.

## 13. Verification and status

- Quotes: `node research_notes/traffic-candidates-2026-11/notion/check-quotes-2026-11-25.mjs` checks every double-quoted phrase in this file against the saved Notion files (raw saves, Blind threads, the Taro dump and the live-guides file; GitHub saves are excluded on purpose). Result: see Status.
- Not verifiable with our tools: the Code Review section body, Glassdoor and 1point3acres contents, the locked PracHub and Aced cards.
- **Status (2026-11-25):** record written from the step-1 saves, the Taro dump and the live guides. 26 rows; Var 13, Yakın 8, Yok 5; new items NEW-1 to NEW-7 proposed, NEW-8 optional. Nothing built or tagged.
- **Checks run on 2026-11-25:** quote check 144 of 144 distinct quoted phrases found in 182 saved files; every Taro slug, Taro id, Blind URL and posting URL in this file matches a saved file; no GitHub, exercise-page, hand-out or hosted-endpoint URL appears in this file (rule 4); all 19 tables have consistent columns.
- **Git:** `*.md` is ignored by the root `.gitignore`; the sibling records are tracked, so publishing this one needs `git add -f`. Nothing is committed.
