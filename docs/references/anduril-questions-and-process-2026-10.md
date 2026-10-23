# Anduril Industries: reported frontend interview questions and interview process

> Working record started on 2026-10-23. It lists the frontend interview questions and tasks that public interview reports attribute to Anduril Industries, with a source and access status for every item, and the interview stages those reports and Anduril's own pages describe. Format follows `docs/references/shopee-questions-and-process-2026-10.md`. Background on why Anduril was picked is in `reports/company-candidates-research-2026-10-23.md`. The user approved Anduril for the next company wave on 2026-10-23; the build is recorded under Implementation.

## Why Anduril (2026-10-23)

Chosen in the candidate round recorded in `company-pages-plan-2026-10.md` (Candidate selection rule) and approved by the user on 2026-10-23 together with Capital One and GitLab.

- **Not covered.** No GreatFrontEnd company guide and no Front End Interview Handbook company page (lists re-read on 2026-10-22).
- **Demand.** Google suggestions on 2026-10-22: `anduril front end interview`, `anduril frontend interview`, `anduril frontend interview questions`; Bing returned three as well. For scale, ElevenLabs had two Google suggestions.
- **Hiring on the day.** Greenhouse listed 8 frontend-titled postings on 2026-10-22 and on 2026-10-23, the most of any uncovered candidate.
- **Readable sources.** Nine distinct candidates, five of them independent Blind posters or commenters.
- **Buyers.** US only: Anduril cannot sponsor F-1 students and its frontend postings ask for clearance eligibility.

## Research rules

- A question counts only if it is on a page our tools read in full (F). Search-snippet-only items (S) are allowed by the format, but none were needed: every source below was read in full. Unreadable sources are marked U.
- Never cited: Glassdoor, 1point3acres, Prepfully, Dataford, PracHub question lists, templated "N questions" pages. Glassdoor and Dataford appear once, in the what-ranks line of the Verdict, with no content taken from them.
- Taro (jointaro.com) pages are Glassdoor reviews re-hosted with rewritten text. Only the public HTML page was read, never Taro's API. Each report is counted once. A Taro date on the 1st of a month is a placeholder: it is marked `*` and only the month is given.
- Blind: all comments were read from the page data, with each speaker's company badge and Blind's own original-poster flag. Every claim is marked: OP = the original poster's own interview; (c) = a commenter's own interview, said in their own words; (p) = a plan or question written before the interview; (e) = a statement by an Anduril-badged commenter, not an account of an interview. A comment under a plan is not treated as the commenter's own interview unless they say so. A nickname with the same badge in several threads is treated as one person.
- LeetCode Discuss was read through `POST https://leetcode.com/graphql` (`ugcArticleDiscussionArticle`, then the `topic` fallback, plus `topicComments`). Medium would be read through RSS; no Anduril Medium account was found.
- Exclusions: hardware, mechanical, sales and business roles; posts that never name Anduril.

## Method

One research agent worked on 2026-10-23.

- Pages were fetched with curl and kept as raw copies for the session (81 files including 9 Blind search pages). Blind thread text, comments, badges and the OP flag come from the page's embedded data (JSON-LD plus the Next.js payload). Taro text is the visible page text. Anduril's site renders in the browser, but its HTML carries the page copy as embedded Sanity JSON, which was parsed directly. Greenhouse was read through its public board API (list, one call with `content=true`, and two single postings).
- Search: 10 WebSearch calls in total. Eight were on the five forum domains (jointaro.com 3, teamblind.com 1, leetcode.com 2, medium.com plus dev.to 1, all five together 1), one looked for an official Anduril statement on AI tools in interviews, and one recorded what ranks for the head query. Blind's own on-site search (direct page reads, not WebSearch) found six Anduril frontend threads (AN2, AN4 to AN8) that the teamblind.com WebSearch had not returned; two of them (AN6, AN7) later appeared in the unrestricted head-query search.
- Quote check: after writing, every quoted string in this file was matched by script against the saved page text (see the Quote check section at the end).

## Verdict

- **Depth: thin but consistent, and clearly frontend.** Nine distinct candidates describe an Anduril frontend loop on pages read in full: five on Blind (AN1 OP, AN2 OP, jHVU66 in AN2/AN3/AN4, shedog in AN3/AN4/AN5, ahdjekr32 in AN6) and four on Taro (AN9 to AN12). Four Anduril-badged commenters describe the frontend loop from the inside (AN2, AN3, AN7). Six more Blind threads (AN3 to AN8) open as plans whose OPs never posted an outcome; one OP skipped the interview. Accounts run from 2022-09* (AN9) to 2025-04 (AN1). **No 2026 frontend account was found** (NOT FOUND); the 2026 threads on Blind are all generic software loops.
- **The loop.** Recruiter call, then one technical screen with an applied frontend problem (about an hour; Zoom in 2022, HackerRank in 2025), then an onsite of three or four interviews: two coding rounds (one React, one JavaScript or data structures), one system design, one behavioral. Onsites were in person in Costa Mesa in 2022 (AN9) and at the Costa Mesa headquarters in 2024 (jHVU66 in AN2). Decisions came within days (AN9). An Anduril-badged commenter says the process varies: "some teams are iterating their process" (AN2).
- **Recurring tasks.** A file explorer or folder tree in React (three independent accounts: AN10 2023, jHVU66 in AN2 2024, ahdjekr32 in AN6 2025). A JavaScript class, then a React or framework app around it (AN11 2024 names a timer; AN12 2025 withholds the question but says it is "extremely similar to one that has already been mentioned here"). A simple React interface under time pressure (AN1). Lodash-style helpers and an autocomplete search in React (shedog, AN3 to AN5). One LeetCode-style or data-structures round is possible (AN9, AN11; Anduril-badged comment in AN3).
- **Recruiter guidance is often wrong.** AN1's recruiter promised an algorithm-heavy round with trigonometry and calculus; the onsite was two simple JavaScript and React tasks. AN12's recruiter sent a LeetCode-style guide while the coordinator's prep document pointed at a frontend test, and the frontend test was right. An Anduril-badged commenter: "Our recruiters are sometimes a bit out of the loop" (AN2).
- **Levels and places.** Mostly unstated. One intern loop (AN10, Costa Mesa). One plan for an "Air defense, mid level role" (AN4). Locations named: Costa Mesa (AN9, AN10, and jHVU66's onsite in AN2), Seattle (AN12), "United States" (AN11). No senior or staff frontend account: NOT FOUND.
- **Official text is generic.** The early-careers FAQ lists a recruiter call, technical and behavioral interviews and role-specific assessments that "could include live coding challenges" (AN-O1). Some software postings say candidates "will complete live coding interviews" (AN-O6). No Anduril page on candidates using AI tools in interviews: NOT FOUND. The applicant privacy notice says Anduril does not use solely automated hiring decisions (AN-O7).
- **Hiring signal on 2026-10-23.** Greenhouse lists 2,495 Anduril postings, 8 of them frontend-titled, all React plus TypeScript, in Costa Mesa, Seattle, Washington DC, Arlington, Reston and Boston (AN-O3). The two postings read in full require clearance eligibility and up to 25 percent travel (AN-O4, AN-O5).
- **What ranks for "anduril frontend interview questions"** (our WebSearch tool, 2026-10-23, nine results in order): a Dataford template guide (AN-T1), a Glassdoor review page, Blind AN6, four Glassdoor review pages, Blind AN3, Blind AN7. No editorial frontend guide ranks. GreatFrontEnd has no Anduril company guide (its company-guide URL returns 404) but hosts a generic file explorer question, which ahdjekr32 (AN6) says matches the screen. Whether FrontendLead tags Anduril could not be checked: the `/companies/<slug>` pattern tried returns 404 even for Google, and its public coding-questions page only echoes a company filter (NOT FOUND, not verified). shedog (AN3) says the questions were "listed on frontendlead".
- **Misattributions caught.** A WebSearch summary credited the onsite shape in AN1 to a commenter; it was the OP replying to a commenter. A WebSearch summary said the Taro 2025-09 internship report "mentions a frontend position"; the page does not. The Blind thread "I was asked frontend for a backend interview" never names Anduril and is excluded.

## Sources

Access: F = read in full, S = verbatim in a search snippet, U = unreadable. Speaker marks as in the rules: OP, (c), (p), (e). Badges are the company labels Blind shows next to each nickname.

| id | URL | publisher, date (YYYY-MM) | role, location | access | content |
|---|---|---|---|---|---|
| AN1 | https://www.teamblind.com/post/front-end-interviews-at-anduril-3hihnhlv | Blind, OP "‘merca" (Microsoft badge), posted 2025-04-21 (loop "last week") | front end role, location not stated, no offer | F | OP: recruiter said "algorithm intensive"; onsite "2 fairly simple coding challenges in JavaScript and React"; OP reply: "Then 2 coding challenges a system design and a behavioral for the onsite."; OP, replying to a deleted comment: "Oh I never got an email, just a call from the recruiter." Commenters: Meta-badged (non-frontend candidate, questions only); Anduril-badged "Ndrl25" (e): "DM your name to me if you want, I’d like to investigate". One Microsoft-badged comment is empty (deleted). The same OP asked a prep question in AN2 on 2025-04-07 (p) |
| AN2 | https://www.teamblind.com/post/anduril-front-end-interviews-bugagvca | Blind, OP "Orangerice" (Microsoft badge), posted 2023-09-18, updates to 2023-10-28 | front end role, location not stated, offer | F | OP own loop: "first interview easy af react", "ya boi passed", recruiter's onsite plan "2 coding one system design one behavioral", "I gots an offer". "DJ#KJd" (Anduril badge) (e) describes the loop. "jHVU66" (Amazon badge) (c), 2024-03: "I got the file folder component", then the onsite in Costa Mesa. Questions only from "HYJX67" ("New" badge), "JMsT78" ("New" badge), "‘merca" (Microsoft, 2025-04-07) |
| AN3 | https://www.teamblind.com/post/andruil-frontend-interview-onsite-btbkofql | Blind, OP "JMsT78" ("New" badge), posted 2024-03-23 | frontend onsite (p) | F | Anduril-badged "Oefs73" (e): "Team dependent"; Anduril-badged "lslckan" (e): "It's all React. But, Leetcode is fairgame in one interview."; "shedog" (Roblox badge) (c), 2024-05-15: "It wasn’t really leetcode for me"; "jHVU66" (Amazon) (p) 2024-03-25: "I have a FE onsite in a few days."; ex-Adobe-badged commenter: "Its leetcode" with no account behind it |
| AN4 | https://www.teamblind.com/post/anduril-frontend-interview-eg52tpe3 | Blind, OP "KtFz63" (SpotOn badge), posted 2024-04-03 | "Air defense, mid level role" (p) | F | "shedog" (Roblox) (c), 2024-05-15: "I have and cleared it", lodash-type flatten, map, reduce; "jHVU66" (Amazon) (c), 2024-04-04: "pretty much all react + client side architecture" |
| AN5 | https://www.teamblind.com/post/anduril-frontend-interview-tip-vo3xz40g | Blind, OP "WwUP64" (Amazon badge), posted 2024-02-29 | frontend role, referral (p) | F | "shedog" (Roblox) (c), 2024-05-16: "I was asked to design an auto complete search feature in react". Anduril-badged comments (e) on work-life balance and demos, one from a self-described "frontend dev"; nothing on the interview |
| AN6 | https://www.teamblind.com/post/anduril-front-end-interview-yt3cx1bt | Blind, OP "pnut-farme" (Fusion Media badge), posted 2025-03-12 | front end role (p); OP later skipped the interview | F | "ahdjekr32" (Mailchimp badge) (c), 2025-03-14: "When I did the screen I got the file explorer problem. It’s online and on greatfrontend". OP, 2025-06-16: "I skipped it. Don't really like how their front end developers have to travel lol." |
| AN7 | https://www.teamblind.com/post/anduril-frontend-interview-n3ugdrys | Blind, OP "ErfU00" (PayPal badge), posted 2025-04-17 | frontend technical phone screen (p) | F | Anduril-badged "WngN75" (e): "it really could go either way depending on interviewer" |
| AN8 | https://www.teamblind.com/post/anduril-frontend-interviews-qyxyn8n0 | Blind, OP "useEffects" (LinkedIn badge), posted 2025-07-23 | frontend role, applied (p) | F | Google-badged commenter describes "The L4/5 loop" without saying it was frontend; Anduril-badged "luesv56" (e) on culture; other comments are political noise |
| AN9 | https://www.jointaro.com/interviews/companies/anduril/experiences/frontend-software-engineer-costa-mesa-ca-september-1-2022-accepted-offer-positive-9ee69754/ | Taro (Glassdoor import), 2022-09* | Frontend Software Engineer, Costa Mesa, accepted offer | F | recruiter call, Zoom technical screen, in-person onsite (system design, coding, behavioral); heard back within five days; "General LeetCode-style coding questions and React coding questions" |
| AN10 | https://www.jointaro.com/interviews/companies/anduril/experiences/software-engineerinternship-costa-mesa-ca-july-5-2023-accepted-offer-positive-dbb3fa63/ | Taro (Glassdoor import), 2023-07 | Software Engineer (Internship), "a frontend position", Costa Mesa, accepted offer | F | four rounds: intro, two technical "where I had to build a small application", behavioral with a small technical question; the file explorer prompt verbatim |
| AN11 | https://www.jointaro.com/interviews/companies/anduril/experiences/software-engineer-united-states-december-24-2024-no-offer-positive-64f81210/ | Taro (Glassdoor import), 2024-12 | Software Engineer with a frontend focus, United States, no offer | F | recruiter call; one technical interview ("If you have a frontend focus, it will be an applied problem."); onsite of 2 technical (data structures, system design) and 1 behavioral; "Write a timer class and React app around it." |
| AN12 | https://www.jointaro.com/interviews/companies/anduril/experiences/software-engineer-seattle-wa-january-1-2025-no-offer-positive-c481c905/ | Taro (Glassdoor import), 2025-01* | Software Engineer, Seattle, no offer | F | recruiter call in December, coding interview in January on HackerRank: a component in JavaScript from a blank document, then the same in Vue, Angular or React; "Create an ES6/JavaScript class with three specified functions, then set it up using a framework like React." |
| AN30 | https://www.jointaro.com/interviews/companies/anduril/experiences/software-engineer-costa-mesa-ca-april-13-2024-no-offer-positive-ad87266b/ | Taro, 2024-04 | Software Engineer (not frontend), Costa Mesa, no offer | F | 30-minute recruiter screen, then a 1-hour tech screen with a senior engineer; "Create a class and two methods to retrieve and send data to an external source." (a drone sensing objects in a zone) |
| AN31 | https://www.jointaro.com/interviews/companies/anduril/experiences/software-engineer-boston-ma-august-19-2025-no-offer-neutral-3ee554cc/ | Taro, 2025-08 | Software Engineer (not frontend), Boston, no offer | F | "Single-day series of 4 interviews: one behavioral, two coding (medium difficulty), and one system design interview. Heard back the same day."; topological sort |
| AN32 | https://www.jointaro.com/interviews/companies/anduril/experiences/software-engineerinternship-united-states-september-18-2025-accepted-offer-positive-e4a5d771/ | Taro, 2025-09 | Software Engineer (Internship, not stated as frontend), United States, offer | F | one LeetCode medium, then a "Super Day" of two technical and one behavioral interview |
| AN33 | https://www.jointaro.com/interviews/companies/anduril/experiences/software-engineer-october-16-2025-no-offer-positive-b0151de7/ | Taro, 2025-10 | Software Engineer (not frontend), no offer | F | "LeetCode DSA and graphs."; "Expect 3-4 technical rounds with onsite." |
| AN34 | https://www.teamblind.com/post/Anduril-Software-Interview-SUOhG3nC | Blind, OP Amazon badge, 2023-03 | SDE/SWE (not frontend), failed phone screen | F | OP's phone screen: a "sensor distance" problem on two integer arrays; SpaceX-badged commenter: "phone screen: 1 LC medium" then "onsite: 1 LC medium/hard + 1 behavioral + 1 system design" |
| AN35 | https://www.teamblind.com/post/anduril-interview---experiences-AEsA1VUQ | Blind, OP Microsoft badge, 2023-04 | SWE tech screen (p) | F | OP: "It's the initial tech screen, only an hour on code pair."; commenters (c): LeetCode medium DP, BFS/DFS with harder follow-ups, resume grilling |
| AN36 | https://www.teamblind.com/post/requesting-advice-for-anduril-final-round-onsite-interview-iwoh2v1z | Blind, OP ViaSat badge, 2026-05 | SWE, Air Defense team (p, recruiter's plan) | F | "The recruiter said there would be 2 technical rounds, 1 system design round, and 1 behavioral."; OP's screen was LeetCode-style |
| AN37 | https://www.teamblind.com/post/anduril-system-design-interview-rju2r4d6 | Blind, OP "New" badge, 2026-10 | generic system design onsite (p) | F | Amazon-badged (c): two onsites, one "Anduril defence-style" design, one generic; Motional-badged (c): design questions "specific to their domain"; Anduril-badged (e): "If it involves networking study up on DDIL best practices." |
| AN38 | https://www.teamblind.com/post/should-i-cancel-my-anduril-interview-iqqf5hx2 | Blind, OP ex-Microsoft badge, 2026-03 | SWE (p) | F | Anduril-badged (e): LeetCode "typically not as bad as FAANG"; design problems "unique to aerospace or defense industries" |
| AN-O1 | https://www.anduril.com/early-careers | Anduril, read 2026-10-23 (copy embedded in the HTML) | official FAQ | F | "What does the interview process look like?" (quoted under Official pages); US work-authorization answer citing ITAR |
| AN-O2 | https://www.anduril.com/careers | Anduril, read 2026-10-23 | official | F | benefits FAQ and "Protecting Yourself from Recruitment Scams"; no interview format |
| AN-O3 | https://boards-api.greenhouse.io/v1/boards/andurilindustries/jobs | Greenhouse board API, read 2026-10-23 | all postings | F | 2,495 postings; 8 frontend-titled (list under Official pages) |
| AN-O4 | https://boards-api.greenhouse.io/v1/boards/andurilindustries/jobs/5147775007 | Greenhouse, first published 2026-06-29, updated 2026-10-22 | Frontend Software Engineer, Costa Mesa | F | stack, duties, clearance, travel, pay range (quoted under Official pages) |
| AN-O5 | https://boards-api.greenhouse.io/v1/boards/andurilindustries/jobs/5262987007 | Greenhouse, first published 2026-10-10, updated 2026-10-21 | Senior Front End Software Engineer, React; Arlington, Seattle, Washington DC | F | stack, duties, clearance, travel, pay range |
| AN-O6 | Greenhouse postings 5188527007, 5260733007, 5261122007 (same API, `content=true`) | Greenhouse, read 2026-10-23 | Senior Software Engineer, Discovery; Software Engineer, Strategic Defense; Senior Software Engineer, Strategic Defense (none frontend-titled) | F | "This application is for experienced coders with 3-12+ years of experience who will complete live coding interviews" and similar lines |
| AN-O7 | https://www.anduril.com/applicant-privacy-notice | Anduril, read 2026-10-23 | official | F | "We do not employ solely automated decision making that results in automated decisions being taken." |
| AN-T1 | https://dataford.io/interview-guides/anduril/frontend-engineer | Dataford template | template | not read | ranks first for the head query; never cited |

Distinct frontend candidates, each counted once: AN1 OP, AN2 OP, jHVU66 (AN2, AN3, AN4), shedog (AN3, AN4, AN5), ahdjekr32 (AN6), AN9, AN10, AN11, AN12. AN11 and AN12 are separate people: AN11 reached an onsite, AN12 stopped after the January coding interview and points back to an earlier report of a similar question.

Checked and not used:
- Blind threads with no frontend content, read in full: `anduril-application-interview-tips-nrvn2nbi` (2022, no interview answers), `anduril-mprlr5no` (2023, generic), `anduril-industries-swe-interview-qolrd50s` and `anduril-industries-interview-experience-grzetde3` (2023, generic), `anduril-industries-mission-swe-vs-swe-vdvuc1x3` (2024, role question), and 17 other generic 2024 to 2026 threads from Blind's "anduril interview" search plus one on getting into defense tech (phone screens, onsites, recruiter calls). These were parsed in full and searched for React, JavaScript, frontend, component, CSS and HTML terms; there were no relevant hits.
- `i-was-asked-frontend-for-a-backend-interview-autaw1om` (Blind, 2024-07): never names the company.
- `ive-failed-interviews-at-openai-anthropic-and-anduril...-yyomltfr` (Blind, 2026-03): non-technical sales roles; its remarks about not using AI on take-home assessments concern OpenAI and Anthropic, not Anduril.
- Taro generic or non-software pages: Senior Software Engineer New York 2021-01* (LeetCode mediums and hards), Software Engineer - Systems 2021-09* (C), Software Engineering Intern 2025-08 (online assessment, then Zoom), SWE Intern 2025-09 (phone, projects), Software Engineer 2025-05 (C++ phone screen), Engineer 2025-06 and Engineer 2021-07* (mechanical).
- LeetCode Discuss 1009510 (2021-01, question only; one reply "All medium LC questions.") and 8114974 (2026-04-29, a backend phone-screen question; the body is stored as an article the API returned as null; one reply).
- Medium and dev.to: no Anduril interview account found.

## Loop by level and region

All accounts are US. That fits the early-careers FAQ: Anduril cannot sponsor F-1 students, and candidates must be US citizens, permanent residents, protected individuals, or "otherwise eligible to obtain the required authorizations from the U.S. Department of State" (AN-O1). The frontend postings add security-clearance eligibility (AN-O4, AN-O5).

### Full-time front-end engineers, 2022 to 2025 (Costa Mesa headquarters, Seattle, unstated US offices)

- **Recruiter call.** "A phone call with the recruiter." (AN9, 2022); "1 call with recruiter discussing resume/past experience." (AN11, 2024); "First, the initial interview with a recruiter was somewhat generic." (AN12, 2025). Guidance from recruiters was unreliable: "My recruiter was telling me the next round is going to be algorithm intensive. I asked him if I should brush up on trigonometry and calculus and he said yea those are not off limits." (AN1 OP, 2025); AN12's recruiter "gave me an interview guide that looked like LeetCode, but then the coordinator sent me an interview preparation document that made it seem more like a frontend test. It was the latter."
- **Technical screen, one coding interview.** "A technical screen via Zoom." (AN9, 2022). "1 technical interview. If you have a frontend focus, it will be an applied problem." (AN11, 2024). "There was no CodeSandbox; it was HackerRank." (AN12, 2025). The OP of a 2023 generic thread calls the first screen "only an hour on code pair" (AN35). Reported screen tasks: a file or folder explorer in React (jHVU66 in AN2, 2024; ahdjekr32 in AN6, 2025), a JavaScript component or class from a blank document then moved into a framework (AN12), "easy af react" (AN2 OP, 2023). An Anduril-badged commenter in 2023 said the screen is "one of the coding. 4 interviews total" (AN2, e).
- **Onsite, three or four interviews.** "An on-site, in-person interview, including sessions for system design, coding, and behavioral questions." (AN9, 2022, Costa Mesa). "Yo so for the on-site recruiter said I have 2 coding one system design one behavioral, did something change?" (AN2 OP, 2023). "I'll be flying out to Costa Mesa." and "Im going to their HQ this week for an onsite, so I passed that coding round" (jHVU66, AN2, 2024-03). "1 onsite (2 technical, 1 behavioral):" with "One more traditional data structures" and "One system design" (AN11, 2024). "This was for onsite." and "Then 2 coding challenges a system design and a behavioral for the onsite." (AN1 OP, 2025). The Anduril-badged description in 2023: "There’s 2 coding, probably one react and one more vanillajs/standard programming knowledge, a systems design and a behavioral" (AN2, e). Asked why the counts differ, the same employee answered "Our recruiters are sometimes a bit out of the loop, but I know some teams are iterating their process" (AN2, e).
- **Decision.** "I also heard back within five days after my technical screen and on-site interview." (AN9). AN2's OP reported passing the first interview on 2023-10-05 and the offer on 2023-10-28. AN1's OP, replying to a deleted comment: "Oh I never got an email, just a call from the recruiter."
- **Variation by team and interviewer.** "Team dependent" (Oefs73, AN3, e). "it really could go either way depending on interviewer" and "Ideally the interview is measuring facets of both." (WngN75, AN7, e, answering whether the screen is React building or LeetCode).

### Front-end intern, Costa Mesa, 2023 (one account)

"The interview process for a frontend position had four rounds." "The first was a quick introductory interview." "The second and third were technical, where I had to build a small application." "The last one was behavioral, with a small technical question at the end." Offer accepted (AN10). The early-careers FAQ describes this kind of loop only in general terms: a recruiter call, technical and behavioral interviews, and role-specific assessments (AN-O1).

### Levels and teams

- Mid level: one plan, "Air defense, mid level role" (KtFz63, AN4, p). No outcome posted.
- L4/L5: one Google-badged commenter describes "The L4/5 loop includes 1 team fit (happened a day before the rest of it), 2 technical, 1 sys design, 1 behavioral. The technical is LC but could also be a debugging session." (AN8). The thread is about a frontend role, but the commenter does not say their loop was frontend, so this is context only.
- Senior and staff frontend: NOT FOUND. Postings exist at both levels (AN-O3).

### Generic software loops (context for stage shapes, not frontend)

The 2023 to 2026 generic loops have the same skeleton with LeetCode-style content: a 30-minute recruiter screen, a one-hour coding screen (AN30, AN31, AN35), then a single-day onsite of two coding rounds, one system design and one behavioral (AN31, AN36; one coding round in AN34), or a "Super Day" for interns (AN32). System design is often domain-specific: "Sys design the first time was an Anduril defence-style question." (Amazon-badged, AN37, c); "The system design questions were specific to their domain, not the generic distributed design questions you'd get at FAANG." (Motional-badged, AN37, c); "I'd also recommend thinking about and looking into system design problems that are unique to aerospace or defense industries, cause we're not gonna ask you to design Twitter." (Anduril-badged, AN38, e).

## Reported questions

### React component builds

- "Build a file explorer-type component with React, where a file icon is displayed next to text. If you click it, the child files would drop down below the parent folder." [AN10, 2023-07, intern, Costa Mesa, technical rounds]
- "I got the file folder component. It was pretty straight forward to be honest. Much more focused on functionality over styling." [jHVU66 (c), AN2, 2024-03, first coding round before the Costa Mesa onsite]
- "When I did the screen I got the file explorer problem. It’s online and on greatfrontend" [ahdjekr32 (c), AN6, 2025-03, screen]
- "They are super simple problems and the one I didn’t do well on was just building a react interface. You should brush up on html, css and React and is really just testing that you’re able to finish it in time." [AN1 OP, 2025-04, onsite]
- "Updating here first interview easy af react I wouldn’t even worry about it"; asked how to prepare: "Mmm practice doing react components in a code sandbox" [AN2 OP, 2023-10]
- "I was asked to design an auto complete search feature in react" [shedog (c), AN5, 2024-05]
- "I did the front end onsite not too long ago and it was pretty much all react + client side architecture" [jHVU66 (c), AN4, 2024-04]
- "General LeetCode-style coding questions and React coding questions" [AN9, 2022-09*]
- "It's all React. But, Leetcode is fairgame in one interview. Remember there are DS&A algo concepts in some React interview questions as well" [lslckan (e), AN3, 2024-03]
- A calendar component: only asked about, never reported. "Is it the calendar/file system I’m seeing on Glassdoor?" [AN2 OP, question, 2023-09]; "Was it the folder/file or calendar component?" [HYJX67, question, AN2, 2024-03]. First-person calendar account: NOT FOUND.

### JavaScript classes, vanilla JavaScript, then a framework

- "Write a timer class and React app around it." [AN11, 2024-12; the report does not say which round]
- "Create an ES6/JavaScript class with three specified functions, then set it up using a framework like React." [AN12, 2025-01*, coding interview on HackerRank]
- "tl;dr: The coding interview used vanilla JavaScript/ES6 classes, and then I was asked to implement it within a framework." and "I was asked to create a component in JavaScript from a blank document, and then the subsequent question was to set it up in a framework of my choice (Vue, Angular, or React)." [AN12]
- "I don't want to share the specific question to prevent them from changing it, but it's extremely similar to one that has already been mentioned here." [AN12; the timer-class report AN11 predates it, but AN12 never names the timer]
- "There’s 2 coding, probably one react and one more vanillajs/standard programming knowledge, a systems design and a behavioral" [DJ#KJd (e), AN2, 2023-09]
- "Do you know what's on the vanilla JS portion? Is it more DOM manipulation or just some programming knowledge?" [JMsT78, question, AN2, 2024-03]; the only reply was "Mine was in React so I can't really speak to that" [jHVU66]. What the vanilla round contains beyond AN12: NOT FOUND.
- "I had 2 fairly simple coding challenges in JavaScript and React with no complexity." [AN1 OP, 2025-04, onsite]

### Utility functions

- "I have and cleared it, it was mainly frontend focused, they asked me like load dash type questions (flatten, map, reduce), I primarily used frontendlead to prep and I think all the questions I was asked were there." [shedog (c), AN4, 2024-05]
- "It wasn’t really leetcode for me, rather more js fundamentsla and react focused, they pretty much asked me questions listed on frontendlead and it wasn’t that bad" [shedog (c), AN3, 2024-05]

### Data structures and LeetCode-style rounds

- "One more traditional data structures" (onsite) [AN11, 2024-12]; "General LeetCode-style coding questions" [AN9]. No frontend account names the problem: NOT FOUND.
- "Leetcode is fairgame in one interview." [lslckan (e), AN3]; "Its leetcode" [ex-Adobe-badged commenter, AN3, no account given]
- "On leetcode you can search Anduril and it gives you some coding questions - I did a bunch of those but it wasn’t applicable at all to the front end interviews" [AN1 OP]
- Generic (not frontend) problems for contrast: a class with two methods for a drone that senses objects [AN30]; "Essentially, this is the LeetCode question on topological sort" [AN31]; a "sensor distance" problem on two integer arrays [AN34]; LeetCode medium DP and BFS/DFS [AN35].

### Frontend system design

- The round is reported in five frontend accounts: AN1 ("a system design"), AN2 (the recruiter's "one system design"; DJ#KJd's "a systems design"), AN9 ("sessions for system design"), AN11 ("One system design"), AN4 ("client side architecture").
- The prompt itself: NOT FOUND. A commenter asked AN1's OP "What was system design experience like?" and got no answer.
- Generic design rounds are domain-specific (AN37, AN38 above). The frontend postings describe the domain: "Design, build, and deploy a real-time, map-based interface for displaying and interacting with sensor data and commanding physical assets" and "Fetch and manage large streams of data while maintaining performant rendering in a low-friction user experience" (AN-O4).

### Behavioral, recruiter and logistics

- A behavioral interview closes every onsite (AN1, AN2, AN9, AN11); the intern loop's behavioral round had "a small technical question at the end" (AN10). No frontend account lists the behavioral questions: NOT FOUND. Generic: "Why do you want to work at Anduril?" [AN30].
- Recruiter mismatch, from the inside: "DM your name to me if you want, I’d like to investigate" [Ndrl25 (e), AN1, reacting to the OP's recruiter story].
- Travel: "I skipped it. Don't really like how their front end developers have to travel lol." [AN6 OP]; the postings say "Must be willing to travel up to 25%." (AN-O4).

## Official pages (read 2026-10-23)

- **Early-careers FAQ (AN-O1).** "What does the interview process look like?" Answer, verbatim: "Our interview process is designed to be rigorous, transparent, and a true test of your capabilities. It's a deep dive into your technical prowess, problem-solving approach, and how you align with Anduril's mission. You can expect:" then "Recruiter Call: To discuss your background and ambitions.", "Technical and Behavioral Interviews: Expect challenging questions designed to assess your skills, critical thinking, and how you navigate complex situations.", "Role specific assessments: This could include live coding challenges, presentations, or in depth technical discussions, depending on the team and role." and "Your recruiter will provide clear guidance every step of the way." Other answers: "We review applications on a rolling basis."; F-1 sponsorship is not possible "Due to the sensitive nature of our work in national security and our strict adherence to U.S. government regulations, including ITAR (International Traffic in Arms Regulations)". The page names no frontend format.
- **Careers page (AN-O2).** Benefits FAQs and a scam notice: "If you receive an email from one of our recruiters, it will only come from an @anduril.com address." No interview format.
- **Postings that mention interviews (AN-O6).** "This application is for experienced coders with 3-12+ years of experience who will complete live coding interviews and it does not require active clearance but you must be eligible." (Senior Software Engineer, Discovery); "This application is for experienced coders with 3+ years of experience who will complete live coding interviews and it does not require active clearance but you must be eligible." (Software Engineer, Strategic Defense); "This application is for established coders with 8+ years of experience who will breeze through live coding interviews and it does not require active clearance but you must be eligible." (Senior Software Engineer, Strategic Defense). None of the eight frontend postings mentions interviews.
- **AI tools in interviews.** No Anduril page says whether candidates may use AI tools: NOT FOUND (official-site and Greenhouse search, plus a scan of all 2,495 postings). The only related official line is about Anduril's own process: "We do not employ solely automated decision making that results in automated decisions being taken." (AN-O7).
- **Frontend-titled postings on 2026-10-23 (AN-O3), for context only:** Frontend Software Engineer (Costa Mesa); Mission Software Engineer, Vehicle Software, Frontend (Costa Mesa, Seattle, Washington DC); Senior Front End Software Engineer, React (Arlington, Seattle, Washington DC); Senior Frontend Software Engineer, Discovery (Boston, Costa Mesa, Washington DC); Senior UI Engineer, EW (Costa Mesa); Software Engineer (Frontend), Space (Costa Mesa); Software Engineer, Front End (Reston); Staff Software Engineer, Frontend Platform (Costa Mesa). All name React and TypeScript; the Discovery posting also names Angular and Vue, and the Reston posting also names Vue.
- **Frontend Software Engineer, Costa Mesa (AN-O4), verbatim:** "In this role, you will be responsible for developing custom, map-based UI/UX for autonomous system command and control."; "Design, build, and deploy a real-time, map-based interface for displaying and interacting with sensor data and commanding physical assets"; "Fetch and manage large streams of data while maintaining performant rendering in a low-friction user experience"; "4+ years of professional experience using Javascript, Typescript, React."; "Eligible to obtain an active U.S. Secret security clearance"; "Must be willing to travel up to 25%." US base salary range $129,000 to $173,000.
- **Senior Front End Software Engineer, React (AN-O5), verbatim:** "We absolutely need React experience for this role. You will be owning all front end decisions for a team of 30+ engineers."; "Proficiency with web-based technologies, specifically React and Typescript"; "Experience with real-time user interfaces that use reactive programming libraries - ReactJS or similar"; "Eligible to obtain and maintain an active U.S. Top Secret security clearance". US base salary range $191,000 to $294,000.

## Proposed interview process tables

Rule as before: a stage cites only sources read in full. Taro counts under the current rule; the "independent" share is the five Blind candidates.

**Variant 1: front-end engineers, United States, 2022 to 2025 (seven candidate accounts; four Anduril-badged descriptions)**

| Stage | What happens | Who | Sources |
|---|---|---|---|
| Recruiter call | Resume and past experience; recruiters sometimes describe the wrong kind of technical round | All | AN9, AN11, AN12, AN1 |
| Technical screen | One coding interview of about an hour with an applied frontend problem: a file or folder explorer in React, or a JavaScript class or component written from a blank file and then moved into React, Vue or Angular; Zoom in 2022, HackerRank in 2025 | Front-end candidates | AN12, AN11, AN9; AN2 (OP and jHVU66), AN6 (ahdjekr32) |
| Onsite | Three or four interviews, in person at Costa Mesa in 2022 and 2024: two coding rounds (one React, one JavaScript or data structures), one system design, one behavioral | Candidates who pass the screen | AN1, AN2, AN9, AN11, AN4 (jHVU66); AN2 and AN3 (e) |
| Decision | Within about five days; one offer came three weeks after the screen result | Candidates who finish | AN9, AN2 |

**Variant 2: front-end intern, Costa Mesa, 2023 (one account)**

| Stage | What happens | Who | Sources |
|---|---|---|---|
| Introductory interview | A short first conversation | All | AN10 |
| Two technical rounds | Build a small application; the reported task is a file explorer in React | Intern candidates | AN10 |
| Behavioral interview | Behavioral questions with a small technical question at the end; offer | Candidates who pass | AN10 |

**Gaps.** Senior and staff frontend loops: no account (NOT FOUND); the generic L4/L5 loop in AN8 is not stated as frontend. Anything from 2026: no frontend account (NOT FOUND). The contents of the system design round and of the vanilla JavaScript round: NOT FOUND beyond AN12. A page can say these plainly instead of filling them in.

## Catalog mapping (proposal, not applied)

Source counts are the length of each item's `sources` array on 2026-10-23 (cap 6). Pin status comes from the hash-pinned ids in `backend/content/interview/authoring/interview-coding-registry-v1.authoring.json` and the pinned system design bundles. Nothing below is pinned except item 8, which is marked.

| # | Reported task | Supporting source | Item | File | Access | Sources now | Pin | Why it matches |
|---|---|---|---|---|---|---|---|---|
| 1 | File explorer or folder tree in React | AN10, AN2 (jHVU66, c), AN6 (ahdjekr32, c) | `react-file-explorer` | `cdn/questions/react/coding.json` | premium | 0 (`sources` is null; `companies` already has walmart) | not pinned | The same task: a nested folder tree where folders open to show children. The item adds sorting and keyboard navigation beyond what the reports describe |
| 2 | The recursion inside the file explorer, free | AN10, AN2 (jHVU66) | `js-filter-tree-render-indented` | `cdn/questions/javascript/coding.json` | free | 2 | not pinned | Renders each node's children under it, indented, depth first. Text output, not React, so it is a practice adaptation |
| 3 | A timer class with a React app around it | AN11 (timer named), AN12 (class then framework) | `react-countdown-timer` | `cdn/questions/react/coding.json` | premium | 1 | not pinned | The React half: Start, Pause and Reset, a ticking display and interval cleanup. The item uses hooks, so the class half has to be described in the guide |
| 4 | A JavaScript class with three specified functions, written before any framework | AN12, AN11 | `js-timer-manager` | `cdn/questions/javascript/coding.json` | premium | 3 | not pinned | Three specified timer functions (`mySetTimeout`, `myClearTimeout`, `myClearAllTimeouts`) in plain JavaScript. It is a function object, not ES6 class syntax. Free alternative for the class concept: trivia `js-classes` (free, no sources) |
| 5 | Lodash-style helpers: flatten, map, reduce | AN4 and AN3 (shedog, c) | `js-flatten-once` | `cdn/questions/javascript/coding.json` | free | 2 | not pinned | The flatten helper. Premium siblings for the other two: `js-array-prototype-map` (4 sources), `js-array-prototype-reduce` (3) |
| 6 | Autocomplete search in React | AN5 (shedog, c) | `react-autocomplete-search-starter` | `cdn/questions/react/coding.json` | free | 6 (at the cap) | not pinned | The same feature. At the cap, so link it from the guide or drop one source. Alternatives with room: `vue-autocomplete-search` (premium, 3) and `angular-autocomplete-search-starter` (premium, 2), which fit AN12's "framework of my choice (Vue, Angular, or React)". Avoid `react-debounced-search` (PINNED, 5) |
| 7 | One data-structures or LeetCode-style round | AN11, AN9, AN3 (lslckan, e) | `js-stack-queue-implementation` | `cdn/questions/javascript/coding.json` | premium | 3 | not pinned | Class-style data structures (`new Stack()`, `new Queue()`; constructor functions with prototype methods that can be written as ES6 classes), so it also rehearses the class theme. No source names the structure, so it is representative only. Free alternative: `js-valid-parentheses` (free, 4) |
| 8 | Onsite frontend system design | AN1, AN2, AN9, AN11, AN4 (jHVU66: "client side architecture"); domain from AN-O4 | `live-chart-high-frequency-updates` | `cdn/questions/system-design/index.json` | premium | 0 (no `sources` field) | **PINNED (needs re-pin)** | Bursty real-time data rendered on demand, closest to "large streams of data" with "performant rendering" in the posting. Unpinned alternatives: `model-training-progress-dashboard` (premium, 0; real-time streams, downsampling, stale-state signalling) or the free `offline-email-client` (offline-first sync, which fits the "DDIL" hint in AN37). No source names the design prompt |

Not proposed: `react-debounced-search`, `react-nested-comments` and `react-nested-checkboxes` (pinned, and the reports do not need them); `react-fetch-list-states` (at the cap, no matching report); any calendar or scheduler item (no first-person report).

## Practice prompts for the page

1. **Timer class, then a React app around it.** Write an ES6 `Timer` class with three methods (start, pause, reset) and a way to read the elapsed time, then build a small React app that drives it with buttons and a live display. Modelled on AN11 ("Write a timer class and React app around it.") and AN12 ("Create an ES6/JavaScript class with three specified functions, then set it up using a framework like React."). Two sources support the class-then-framework shape; only AN11 names a timer, and the three method names are ours. Links to `react-countdown-timer`.
2. **File explorer from nested data.** Render a nested folder tree in React where each row shows a file or folder icon next to its name, and clicking a folder shows its children below it. Modelled on AN10 (the verbatim prompt), with jHVU66 (AN2: "Much more focused on functionality over styling.") and ahdjekr32 (AN6, screen). Links to `react-file-explorer` (free alternative: `js-filter-tree-render-indented`).
3. **Vanilla first, then a framework.** Build a small UI component in plain JavaScript from an empty file, then port the same component to React, Vue or Angular without changing its behaviour. Modelled on AN12 (HackerRank, blank document, framework of choice) and the Anduril-badged description "one react and one more vanillajs/standard programming knowledge" (AN2). Links to `js-dom-renderer` (premium, 1 source), which builds DOM from a nested object without `innerHTML`.
4. **Lodash-style helpers.** Implement `flatten`, `map` and `reduce` without the native methods, with tests for nesting, holes and an empty input. Modelled on shedog (AN4: "load dash type questions (flatten, map, reduce)"). Links to `js-flatten-once`.
5. **Autocomplete search in React.** Build a React search input that suggests matches as the user types, ignores late responses to old queries and works from the keyboard. Modelled on shedog (AN5: "I was asked to design an auto complete search feature in react"). Links to `react-autocomplete-search-starter` (at the six-source cap, so a link from the guide rather than a new tag).

A sixth prompt for the system design round would have to be modelled on the job postings (a real-time map of assets and sensor streams), because no account names the design prompt.

## Open items

- No 2026 frontend account. Re-check Blind's on-site search for "anduril frontend" before building; it found six threads the domain-restricted WebSearch missed.
- The vanilla JavaScript round and the system design round have no reported prompt beyond AN12.
- shedog says the questions came from FrontendLead, and ahdjekr32 says the file explorer is on GreatFrontEnd. A guide should not imply these are Anduril's exact wording.
- Glassdoor pages rank for the head query and may hold more reports; they are excluded by rule.
- AI-tools policy for candidates: NOT FOUND. Ask a recruiter or re-check the early-careers page later.

## Quote check (2026-10-23)

Every string in straight double quotes above was matched by script, after whitespace normalisation, against the saved text of the pages (Blind post and comment text from page data, Taro visible text, Anduril page copy, Greenhouse posting content, LeetCode API replies). Result: 203 of 210 quoted strings match a saved page word for word. The other 7 are not source quotes: three search queries ("anduril frontend", "anduril interview", "anduril frontend interview questions"), two Blind thread-author nicknames that live in the post metadata rather than the comment text (ErfU00, useEffects; both checked by hand in the page data), the brief's own phrase for templated pages, and one phrase from a WebSearch summary that is quoted as the summary's error ("mentions a frontend position").

## Verification by the coordinating session (2026-10-23)

Re-read on the pages before writing: AN1 (onsite shape, recruiter prediction), AN2 (the original poster's "first interview easy af react" and "I gots an offer", jHVU66's "I got the file folder component" and the Costa Mesa trip), AN4 (shedog's lodash-style questions), AN6 (ahdjekr32's file explorer screen), AN9 to AN12 (Taro text, also matched against Taro's import records), and the two Greenhouse postings (map-based UI, large data streams, React and TypeScript, Secret and Top Secret clearance eligibility, 25 percent travel). The AN2 original poster's line about the recruiter's onsite plan was not found by WebFetch, so the page cites the Anduril-badged description of the same loop instead.

## Implementation (2026-10-23)

- Catalog tags with sources: `react-file-explorer` (AN10, AN2, AN6), `react-countdown-timer` (AN11), `js-flatten-once` (AN4), `js-filter-tree-render-indented` (AN10, as a practice adaptation). Company tag only: trivia `js-classes` (trivia carries no sources). Not tagged: `react-autocomplete-search-starter` (at the six-source cap; linked from the guide), `js-timer-manager` and `js-stack-queue-implementation` (no source names them), any system design item (no source names the prompt; `live-chart-high-frequency-updates` is pinned).
- Authored guide `frontend/src/app/shared/company-previews/anduril-preview-content.ts` with the five prompts above, company-specific study and lens headings, and every Taro report labelled without a location.
- Interview process table (two variants: frontend engineers, United States; frontend interns, 2023), the early-careers FAQ row in the official guides table, a monogram brand (Simple Icons has no Anduril mark), the llms.txt line, and the smoke, SSR, editorial, sitemap and branding fixtures.

## Status

| Step | State | Date |
|---|---|---|
| Research record | done | 2026-10-23 |
| Catalog tags, guide, process table | built on dev | 2026-10-23 |
| Indexing request | after the main deploy | |
| First readout | four weeks after deploy, against ElevenLabs's first week (9 clicks, 38 impressions) | |
