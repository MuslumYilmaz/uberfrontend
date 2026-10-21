# JPMorgan Chase, Agoda and xAI: reported frontend interview questions

> Working record started on 2026-10-21. It lists the frontend interview questions and tasks that public interview reports attribute to JPMorgan Chase, Agoda and xAI, with a source and access status for every item. Companion documents: `docs/references/jpmorgan-agoda-xai-interview-processes-2026-10.md` (the loop stages for the same three companies), `docs/references/walmart-nvidia-tesla-questions-2026-10.md` (the same research format and the demand method), `docs/references/company-pages-plan-2026-10.md` (how a company page is built). Nothing here is a decision to build pages: tagging, new items and authored guides each need their own yes/no.

## Why these three (demand, competition and the ElevenLabs reading, 2026-10-21)

The question was which company to add after Walmart and Tesla, given two Search Console observations: the pages whose companies have a GreatFrontEnd guide sit on page 2 to 4, and the ElevenLabs page converted from its first day.

Search Console, company previews, 2026-07-01 to 2026-10-18 (data lags about three days):

| Page | Impressions | Clicks | CTR | Average position | GreatFrontEnd or FEIH guide |
|---|---|---|---|---|---|
| OpenAI | 248 | 9 | 3.6% | 15.6 | yes |
| Netflix | 245 | 3 | 1.2% | 15.4 | yes |
| Google | 211 | 0 | 0% | 20.4 | yes |
| Amazon | 133 | 0 | 0% | 32 | yes |
| Apple | 74 | 0 | 0% | 27 | yes |
| ElevenLabs (live since 2026-10-14; data for 15 to 18 October) | 27 | 7 | 25.9% | 11.9 | no |

- The mechanism holds: "openai frontend interview" ranks 13, "google frontend interview" 26 to 44, while "elevenlabs interview" ranks 1. The CTR gap comes from the absence of an editorial competitor, not from the page.
- The ElevenLabs sample is four days and seven clicks, all under anonymized queries; the launch-day clicks cannot be separated from the author's own checks. Re-read the page around 2026-11-12.
- The scarce resource is impressions, not CTR. All company pages together earned 21 clicks in three and a half months; a company with real "<company> frontend interview" demand and no editorial guide is worth more than a famous company that GreatFrontEnd already covers.
- Fame alone fails: NVIDIA has demand (Trends 0.83 of Atlassian) but no readable reports, which is why it was deferred on 2026-10-19.

Demand was measured with Google autocomplete on 2026-10-21 (three templates: `<company> frontend interview`, `frontend engineer interview`, `interview`; the count is the number of completions that name a frontend, UI or UX interview) and compared with the six-template sweep of 2026-10-19. Trends values are the 2026-10-19 batches against `atlassian frontend interview` (last 24 months / last 12 months); Trends could not be re-read in Chrome on 2026-10-21. Coverage comes from the 2026-10-19 sweep of 15 prep sites plus the Front End Interview Handbook sitemap read on 2026-10-21 (36 companies).

| Company | Autocomplete 2026-10-21 / 2026-10-19 | Trends vs Atlassian | Editorial competitor | Readable reports before this round | Buyer region |
|---|---|---|---|---|---|
| JPMorgan Chase | 8 under "jp morgan" plus 2 under "jpmorgan" / 17 | 0 per spelling (demand is split across jp morgan, jpmorgan, jpmc and chase) | none; Dataford has three to five template slugs, Prepfully, one frontendgeek user post | 6 full-text plus 3 Glassdoor snippets | US, UK, Ireland, India |
| Agoda | 10 / 12 | 0.21 / 0.31 | none; Dataford, Prepfully, one frontendgeek post | 2 full-text (2025, 2026) plus 4 snippets | Bangkok relocation, mostly India and South-East Asia; Manila and India hubs |
| xAI | 4 / 4 | not measurable | none; PracHub question list, LearnersBucket, Dataford | official postings plus one Glassdoor snippet; a Blind thread with 33,555 views and no answer | US, London |
| DoorDash (not chosen) | 7 / 9 | not measured | Front End Interview Handbook page updated 2026-10-05, linking to GreatFrontEnd | 2 Taro, Blind, snippets | US |
| NVIDIA (not chosen) | 4 / 4 | 0.83 / 1.3 | none | thin | US |
| Deloitte, IBM, Salesforce, Oracle, EPAM, Accenture (not chosen) | 10, 9, 8, 6, 6, 5 | 0.14 / 0.32 / 0.09 / 0.32 / 0 / 0.16 | FEIH pages for Salesforce and Oracle | Glassdoor snippets | services firms, India-heavy, basic questions |

For scale on the same 2026-10-21 measure: ElevenLabs 2, Waymo 2, Datadog 2, Intuit 7, Revolut 7, Walmart 13, Google 15, Amazon 16, Uber 19, Atlassian 20.

Hiring context on 2026-10-21: JPMorgan's recruiting API listed 266 open requisitions matching "React" and 311 matching "front end", with new US and UK frontend postings on 20 and 21 October; xAI's Greenhouse board listed 301 jobs, three of them frontend-titled, while earlier frontend postings (Enterprise, Grok Studio, Agents UX) had closed; ElevenLabs' Ashby board listed 156 jobs with one frontend-leaning full-stack role.

## Research rules

The rules are the ones used for the Walmart, NVIDIA and Tesla round:

- A question counts only if it is on a page our tools read in full (F) or appears verbatim in a search snippet (S). Unreadable sources are marked U.
- Glassdoor and 1point3acres are snippet-only. Reddit was not attempted.
- Templated pages (Dataford, Prepfully, interviewpal, techprep, PracHub question lists and similar) are listed as what ranks, never as evidence. Aced experience pages are first-person accounts and count; Aced's generated guides do not.
- A report that Taro re-hosts from Glassdoor is counted once. Taro dates on the 1st of a month are placeholders and are marked `*`.
- Multi-company posts are used only for the target company's section.

Exclusions:

- JPMorgan Chase: branch, operations, "front office" trading and campus software-engineer-program loops with no JavaScript, React or UI content.
- Agoda: hotel, customer-service and front-desk roles.
- xAI: "explainable AI" meanings and pre-2025 Twitter/X Corp reports; post-merger X web-engineering reports are kept in a separate subsection.

## Method

Three research agents worked on 2026-10-21, one per company, under a shared brief (evidence rules, access recipes and output format). The coordinating session then re-read a sample of quotes on their pages (see "Verification").

Access recipes that worked: Taro experience pages, Aced experience pages, Blind post pages, LeetCode Discuss through GraphQL (legacy `topic(id: Int!)` and article `ugcArticleDiscussionArticle(topicId: ID!)` queries), the Code360 JSON endpoint `fetch_single_interview_experience?slug=`, Medium RSS feeds, GeeksforGeeks, job-board APIs (Greenhouse `boards-api`, Ashby `posting-api`, JPMorgan's Oracle `recruitingCEJobRequisitions`). Blocked: Glassdoor, 1point3acres, Dataford (429), naukri.com HTML (403), Fishbowl.

Source ids (J, A, X; official pages `-O`, news `-N`) are local to this document. Each "Reported questions" bullet ends with its source ids and the report date.

## JPMorgan Chase

**Verdict.** Moderate depth for the loop, thin per report. Interviews are team-driven, so the questions recur more than the format does.

- **Sources:** 56 pages read in full (11 Taro reports with frontend titles or React content, 15 further Taro software-engineer reports, 16 LeetCode posts, 18 Blind threads, one frontendgeek report, one dev.to post, three Medium posts through RSS, three GeeksforGeeks campus accounts, four official pages including the recruiting API), 9 Glassdoor pages and one Medium post as snippets, two Medium posts unreadable. Sixteen first-person frontend reports carry at least one concrete question or task [J1–J15, J18–J20]; about twenty more describe the generic software-engineer loop that React-titled roles share.
- **Where the reports come from:** UK (London React Software Engineer III 2023 [J15, J16]; Senior/L5 Frontend Engineer, about 2026-05 [J1]; Associate 2025 [J11]; London Frontend Developer 2021 with an offer [J6] and 2017 [J7]); US (New York onsite 2021 [J13]; New York "Software Engineer - Front End" 2021 [J18]; Houston React Developer 2022 [J2]; Frontend Developer with no city 2021 to 2022 [J3–J5]; Lead Software Engineer tagged New York on Glassdoor, 2025 [J10]); India (Bengaluru SDE2 2024 with an offer refused [J12]; Bengaluru Frontend Engineer 2024 [J8]; Bengaluru lead frontend 2024, commenters [J20]; Java full stack with a frontend section 2025 [J14]). No frontend report for Jersey City, Plano, Columbus, Wilmington, Bournemouth or Dublin, although requisitions exist there.
- **Newest:** Aced, UK, Senior/L5, about 2026-05 [J1]: live coding of a generic async promise React hook. The newest generic-loop reports are from 2026-04 [J41, US "power day"] and 2026-09 [J42, VP-level, Java and React questions].
- **Titles and levels:** requisitions on 2026-10-21 [J-O4]: "Web Front End Developer" (London), "Software Engineer II (React/Java)" (New York), "Software Engineer II Associate - React/UI/Python" and "Software Engineer III - React/UI/Python" (Plano), "Software Engineer III - React" and "Frontend Lead Software Engineer" (Glasgow), "Lead Software Engineer - React" (Chicago), "Lead Software Engineer - Front End/React/AIML" and "Senior Lead Software Engineer- Front end and React" (Jersey City), "Front End Lead Software Engineer" and "Lead Software Engineer - Sr. UI Developer" (Columbus), "Lead Software Engineer - Java Full Stack, React" (Bengaluru). Levels as candidates and employees describe them: Software Engineer II = Associate (grade 601 in India), grade 602 = "AVP/SDE3", Software Engineer III = mid level, Lead Software Engineer = VP, Executive Director above that [J20, J30-Med, J48, J58]. Not official.
- **Hiring on 2026-10-21:** the recruiting API returned 266 requisitions matching "React" and 310 matching "front end"; new frontend postings appeared on 2026-10-19, 20 and 21 in London, New York, Plano and Bengaluru [J-O4].
- **What ranks for `jpmorgan frontend interview questions`** (our search tool, not Google): five Dataford templates (three guide slugs and two question lists), LeetCode 1076639 [J13], the Aced experience at its old tryexponent.com URL [J1], a Taro work review [J60] and a Taro report [J4]. No editorial guide; GreatFrontEnd and Front End Interview Handbook have no JPMorgan page.

**Loop, official framing.** "The interview process will differ for each position. But as we get to know you—and you get to know us—you can expect to meet with several people in multiple rounds." [J-O1]. Assessments "include structured live interviews, on-demand/recorded interviews, and virtual skills assessments"; technical assessments "may take the form of online tests or technical interviews where you demonstrate your skills live with an interviewer" [J-O2]. Employees say the same on Blind: "Interviews at JP are generally decentralized, so there is zero consistency." [J15, commenter]; "It's very team-based." [J43, JPMC-badged commenter]; "The company does not have a standard coding format unlike big tech and depends on the LOB and org." [J46, JPMC-badged commenter].

**Loop, UK (London and Glasgow).**
- React Software Engineer III, London, 2023 [J15 own, J16 plan]: a first technical interview over Zoom with no briefing ("explain closure, diff between shallow clone and deep clone, Object.assign usecase, difference between useCallback and useMemo etc"), then, as briefed, "a 90 minute technical live coding interview and 30 minute behavioural interview"; the poster never reported back on stage 2.
- Senior/L5 Frontend Engineer, UK onsite, about 2026-05, rejected [J1]: a recruiter screen and one technical interview over two weeks: "Live coding a generic async promise React hook. Generic types and useEffect cleanup function expected".
- Associate Software Engineer, UK, 2025-02* [J11, Glassdoor mirror]: one interview "with 2 people", "more a test of knowledge and React concepts than a test of aptitude"; `useState` versus `useRef`.
- Frontend Developer, London, 2021-01*, offer [J6]: "4 stages: 1 phone call, then on-site with 3 different people – tech lead, team manager, then managing director. The phone call was basic frontend questions. A 30-minute chat with the tech lead involved more simple paper coding."
- Frontend Developer, London, 2017-07* [J7, probable Glassdoor mirror]: a phone interview of "probably about 30 questions based around JavaScript", then a 90-minute face-to-face at 25 Bank Street with a Glasgow dial-in on React, Redux, TypeScript and the lifecycle; rejected because "my knowledge of frameworks was not strong enough".
- Glassdoor UK "Software Engineer Front End" [J24, S]: "1 hour of technical questions and then 30 mins of behavioral questions over Zoom"; "general knowledge of JavaScript principles", "no algorithm questions". Glasgow Software Engineer Program, 2025-08 [J30, S]: "Superday with 2 interviews - each 45 minutes long both technical and behavioral."

**Loop, US.**
- One-hour sessions, often split between interviewers: "a 1 hour interview split in 30mins between two interviewers" for a New York "Software Engineer - Front End", 2021-12 [J18 plan]; "45 minute behavioral and 45 minute technical interview" for a front-end interview day, 2021-03 [J19 plan]; "a 1 hour zoom meeting with 2 people" for a full-stack role with a frontend focus, 2024-01 [J17 plan]. JPMC-badged commenters: "Typical React or angular stuff, based on your past experience." [J18]; "My team usually focuses on hands on experience with react, rx.js, typescript and JS advance core concepts through code pairing." [J19].
- Panels: "3 rounds with a VP, Developer, and Quality Assurance ... mostly on what you present on your resume ... there was technical coding on functional components", then "the application owner and lead developer" [J4, 2022-04*]; "about 1 hour, conducted by 3 lead software engineers. One engineer asked 3 easy/medium level difficulty LeetCode-styled questions. Another engineer focused on asking about how React works ... The 3rd engineer asked some basic questions about the backend, REST, optimizations, and security." [J10, Lead, 2025-03].
- "Three video technical interviews" for a Houston React Developer, one of them mis-assigned to a backend Python interviewer [J2, 2022-06*]; multiple teams with distinct interviews in New York [J13, 2021]; two team interviews with no recruiter call at VP level, the first on Java and React [J42, 2026-09].
- The generic "super day" that React-titled Software Engineer II and III roles most likely share (no frontend report confirms it): a recruiter phone screen, HackerRank with "two LeetCode-style easy questions", then "a virtual 'super day' ... consisting of three rounds: coding/PR review, system design, and behavioral", each 45 minutes, the coding round opening with "10 minutes of reviewing a pull request (PR) and a LeetCode medium problem" [J40, 2025-08*]; "a power day ... PR review, coding question, system design and then behavioral", "System design was rate limiter with some modifications ... I think they weigh the pr section heavily b/c I didn't finish and they still passed me." [J41, 2026-04, offer]; a JPMC-badged interviewer in the same thread: "Coding questions expect an average difficulty medium".

**Loop, India (Bengaluru, Mumbai, Hyderabad).**
- SDE2 frontend, Bengaluru, 2024-04, offer refused [J12]: three 60-minute rounds in one sitting. Round 1 "Security and React": XSS and ransomware, security principles at work, React lifecycle methods "and their significance in maintaining secure web applications", component design for data privacy, "write a generic memoization function". Round 2 "JavaScript/Framework": "Promises, asynchronous behavior, and generator functions", "write a polyfill for the reduce function", object manipulation, "pure functions and currying". Round 3 hiring manager and culture fit: the project, a feature drawn as a flow chart, conflict resolution. A "Congratulations!" email on day 10.
- Frontend Engineer, Bengaluru, 2024-04* [J8]: one round on "Closures, Event loop, React.js optimization techniques", then no second round: "The HR doesn't pick up the call and just ghosted."
- Lead frontend, Bengaluru, 2024-05 [J20, JPMC-badged commenters]: "Generally it will be 3-4rounds.. 3 technical and 1 hr"; "mainly some basic react, performance optimisation in web"; "mostly it will be more around javascript, typescript, graphql".
- Generic SDE2 and SDE3 cohort "Super Day", 2024 to 2026 [J32–J38, J30-Med]: a HackerRank assessment with two questions, sometimes months before the loop; three back-to-back rounds on one day in any order: code or pull-request review plus one easy-to-medium problem (45 to 60 minutes), high-level design on a HackerRank whiteboard or CodePair (a rate limiter recurs), a behavioural or hiring-manager round with a Director or Executive Director. A 15-minute team-match call may follow [J34].

### Reported questions: JPMorgan Chase

**JavaScript fundamentals**
- "What is a closure in JavaScript?" [J6, 2021-01*, Frontend Developer, London].
- "explain closure, diff between shallow clone and deep clone, Object.assign usecase" [J15, 2023-05, React Software Engineer, London].
- "Closures, Event loop, React.js optimization techniques." [J8, 2024-04*, Frontend Engineer, Bengaluru].
- "Explain the benefits of the reduce method" [J3, 2022-01, Frontend Developer, US].
- "What is a prototype in Javascript?"; "What's the difference between a fat arrow vs normal function?"; "What is CORS?"; "What's the difference between a cookie, session, local storage?" [J13, 2021-02, onsite, New York].
- "Diff between var,let,const"; "Scope"; "Promise" [J14, 2025-07, Java full stack, India].
- "Promises, asynchronous behavior, and generator functions"; "pure functions and currying" [J12, 2024-04, SDE2, Bengaluru].
- "about 30 questions based around JavaScript" on a phone screen; "What new features of TypeScript do you like?" [J7, 2017-07*, Frontend Developer, London].
- Glassdoor (S): `typeof`, array functions, function scoping [J24, UK Software Engineer Front End]; closures, hoisting, two-way data binding, `display: none` versus `visibility: hidden`, swap two variables without a temporary, design patterns [J25, UI Developer, about 2021]; "the difference between async functions and setTimeout", the JavaScript data types [J26, Front End Engineer, about 2022]. Medium (S, page unreadable): the event loop; Promises versus callbacks [J22].

**Utility functions and polyfills**
- "write a polyfill for the reduce function" [J12, 2024-04, SDE2, Bengaluru].
- "write a generic memoization function" [J12].
- "Live coding a generic async promise React hook. Generic types and useEffect cleanup function expected" [J1, about 2026-05, Senior/L5 Frontend Engineer, UK].
- "How do you implement a LRU cache?"; "How to check for balanced brackets?" [J13, 2021-02, New York].

**React builds and concept questions**
- "React question to build a to-do list where each task has a high, medium, or low priority option. Priorities can be updated, and whole tasks can be deleted." [J2, 2022-06*, React Developer, Houston].
- "Create a Functional Component with a search bar and group of Strings when you enter the text in search bar it will show you the suggestions based on Strings"; `useEffect`; higher-order components [J14, 2025-07, Java full stack].
- "I was asked about context. In my response, I mentioned the concept of a higher-order component, and was then asked to go into more detail about when a HOC would be used." [J3, 2022-01, Frontend Developer, US].
- "technical coding on functional components" [J4, 2022-04*, Frontend Developer, US].
- "difference between useCallback and useMemo" [J15, 2023-05, London]; "the difference between a useState hook and a useRef hook" [J11, 2025-02*, Associate, UK, also on Glassdoor as J29].
- "Why would a developer choose React over Angular?" [J10, 2025-03, Lead Software Engineer, US].
- React lifecycle methods "and their significance in maintaining secure web applications"; component design "minimizing security vulnerabilities and ensuring data privacy" [J12, 2024-04, SDE2, Bengaluru].
- "How much have you used React? What do you know about Redux?", "What is a stateless component?", the React lifecycle with benefits and drawbacks, "What's going on lately with React?" [J7, 2017-07*, London].
- Glassdoor (S): React hooks "like useRef" for a UI/React Software Engineer II in India [J27]; props, state, Redux, hooks [J23, Front End Developer]; "create react app followed by a vague explanation of what they wanted me to build" in a 1.5-hour challenge after a 30-minute product-manager call [J26, about 2022]; "a technical task to implement a React application interacting with an API" after concept questions, and the purpose of a pure component [J28, Full Stack Developer]. Medium (S, unreadable): "how do you write test cases in React applications?", a text input with a label showing its value, Mocha and code coverage [J22].
- Not attributable to JPMorgan alone: a pair-programming task to fetch from an API and render a table, then types, race conditions with AbortController, a custom hook, `useState` versus `useReducer`, inline arrow handlers, in a post titled "Coding Challenges in React Interview for JPMC and Barclays" [J21, 2026-04].
- Not located today (U): Glassdoor snippets seen in the 2026-10-21 selection round for Glasgow 2025-09 (an online React task rendering Pokémon in a list from an API), London 2025-07 (a TypeScript React app fetching the Pokémon API into styled cards with unit tests), London 2025-11 (JavaScript garbage collection) and Jersey City 2025-11 (a LeetCode medium). They probably sit on Glassdoor's Software Engineer pages.

**HTML and CSS**
- Campus accounts only: CSS selectors, ways to use CSS, HTML5 features, "HTML and CSS without Javascript is of no use" [J55]; "He literally discussed with me 10 minutes on CSS." [J57]. Glassdoor (S): `display: none` versus `visibility: hidden`, canvas and SVG, Bootstrap grid classes [J25]; "They asked technical question on HTML,CSS, JAVASCRIPT and REACT JS." [J23, Mumbai].

**DSA and coding exercises in frontend loops**
- "3 easy/medium level difficulty LeetCode-styled questions" from one of three lead engineers [J10, 2025-03, Lead, US].
- "How to delete a node in linked list?"; "How to check for balanced brackets?" [J13, 2021-02, New York].
- A mis-assigned Python task: count how often each weekday occurs in a given year [J2, 2022-06*, Houston].
- A planned "90 minute technical live coding interview" [J16, 2023-05, React SWE III, London]; a Microsoft-badged commenter expected "LC medium + bunch of related questions on the language".
- Generic software-engineer loops: a HackerRank assessment with two easy-to-medium problems [J32, J34, J40, J49]; a pull-request review with "hardcoded credentials and poor variable names" [J40] or "exception handling, variable names, logging, println statements" [J33]; medium problems such as a min-stack variant, group anagrams with constraints, sorting a string by character frequency [J36, J37]; "isPalindrome" [J43, commenter]; "Mean/Median/Mode from an array" [J59, commenter].

**System design**
- No frontend-specific design round was reported. Generic high-level design rounds: a rate limiter [J34, J35, J41], a parking lot [J32], flash-sale traffic [J38], a news aggregator [J40], payment processing [J36], a document-upload service with third-party validation [J37b], a CRUD user service with a background-check call [J52]. "Walk me through, in as much detail as possible, how you would deploy a new web service." [J51, 2019-03*, UK graduate].

**Behavioural**
- "Tell me about yourself." [J1]; "What are some accomplishments you're proud of?" [J5, 2021-03, Frontend Developer, US].
- A feature the candidate was proud of; "conflict resolution within a team and handling team dynamics" [J12, hiring-manager round].
- "Why JP Morgan, it's a bank the work and pace might be different?"; a disagreement with a manager; "How do I behave when my design is rejected" [J30-Med, 2024-06, AVP/SDE3, Executive Director round].
- "handling being stuck on a task"; "learning mindset" [J40, 2025-08*, US super day].

### Sources: JPMorgan Chase

Frontend reports (F = read in full, S = snippet, U = unreadable; Taro dates on the 1st are placeholders; two Taro entries are confirmed Glassdoor mirrors):

| id | URL | publisher, date | role, location | access | content |
|---|---|---|---|---|---|
| J1 | https://www.aced.io/experiences/jp-morgan-chase-senior-frontend-engineer-interview-6faa4e | Aced, about 2026-05 | Frontend Engineer, Senior/L5, UK onsite, rejected | F | recruiter screen; live coding of a generic async promise React hook |
| J2 | https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/react-developer-united-states-june-1-2022-no-offer-positive-87452f0d/ | Taro, 2022-06* | React Developer, Houston | F | three video interviews; priority to-do list; a mis-assigned Python task |
| J3 | https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/frontend-developer-united-states-january-2-2022-no-offer-positive-5a4dea31/ | Taro, 2022-01 | Frontend Developer, US | F | context then HOC follow-up; `reduce` |
| J4 | https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/frontend-developer-united-states-april-1-2022-no-offer-neutral-a3d9886a/ | Taro, 2022-04* | Frontend Developer, US | F | VP, developer and QA panel on the resume; functional components |
| J5 | https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/frontend-developer-united-states-march-26-2021-no-offer-neutral-22304fb3/ | Taro, 2021-03 | Frontend Developer, US | F | multiple rounds across departments |
| J6 | https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/frontend-developer-london-england-january-1-2021-accepted-offer-positive-e00df0d2/ | Taro, 2021-01* | Frontend Developer, London, offer | F | phone call, then tech lead, team manager and managing director; closure |
| J7 | https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/frontend-developer-london-england-july-1-2017-no-offer-negative-5853573b/ | Taro, 2017-07* (probable mirror) | Frontend Developer, London | F | 30 JavaScript phone questions; 90-minute React, Redux, TypeScript interview |
| J8 | https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/frontend-engineer-bengaluru-karnataka-april-1-2024-no-offer-negative-77dc2081/ | Taro, 2024-04* | Frontend Engineer, Bengaluru | F | closures, event loop, React optimisation; ghosted |
| J9 | https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/front-end-developer-india-august-21-2016-accepted-offer-positive-619f8a51/ | Taro, 2016-08 | Front End Developer, India, offer | F | eight rounds; no questions |
| J10 | https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/lead-software-engineer-united-states-march-13-2025-no-offer-positive-5ec74572/ | Taro, 2025-03 (Glassdoor mirror, tagged New York) | Lead Software Engineer, US | F | three-engineer panel: LeetCode, React depth, backend basics; React over Angular |
| J11 | https://www.jointaro.com/interviews/companies/jpmorgan-chase/experiences/associate-software-engineer-united-kingdom-february-1-2025-no-offer-negative-7f96780a/ | Taro, 2025-02* (Glassdoor mirror) | Associate Software Engineer, UK | F | React concepts; `useState` versus `useRef` |
| J12 | https://www.frontendgeek.com/interview-experience/frontend-interview-experience-at-jp-morgan-refused-offer---9f684f90-12ee-45ec-ac82-e40d2010260e | frontendgeek, 2024-04 | SDE2, Bengaluru, offer refused | F | three 60-minute rounds: security and React, JavaScript, hiring manager |
| J13 | https://leetcode.com/discuss/post/1076639/ | LeetCode, 2021-02 | onsite, multiple teams, New York | F | the question list; advice for frontend candidates |
| J14 | https://leetcode.com/discuss/post/6913307/ | LeetCode, 2025-07 | Java Full Stack, India | F | a frontend list: `var`/`let`/`const`, Promise, `useEffect`, HOC, search bar with suggestions |
| J15 | https://www.teamblind.com/post/jp-morgan-interview-tips-ohvqbeuy | Blind, 2023-04 to 05 | React Software Engineer, London (own) | F | closure, clones, `Object.assign`, `useCallback` versus `useMemo`; "zero consistency" comment |
| J16 | https://www.teamblind.com/post/jp-morgan-swe-interview-guide-tsoukjaf | Blind, 2023-05 | React Software Engineer III, London (plan) | F | 90-minute live coding plus 30-minute behavioural as briefed |
| J17 | https://www.teamblind.com/post/front-end-swe-interview-with-jp-morgan-z35wvsmt | Blind, 2024-01 | full stack, frontend focus, US (plan) | F | one-hour Zoom with two people; no answers |
| J18 | https://www.teamblind.com/post/JPMorgan-Front-End-position---HELP-uwhCeSaA | Blind, 2021-12 | Software Engineer - Front End, New York (plan, commenters) | F | one hour split between two interviewers; "Typical React or angular stuff" |
| J19 | https://www.teamblind.com/post/JPMorgan-Chase---Front-End-Developer-Interview-Mb7vx1A6 | Blind, 2021-03 | Front end developer, US (plan, commenters) | F | 45-minute behavioural plus 45-minute technical; code pairing on React, RxJS, TypeScript |
| J20 | https://www.teamblind.com/post/jpmorgan-chase-interview-rounds-expectation-bengaluru-ta1v2q0n | Blind, 2024-05 | Lead frontend, Bengaluru (plan, JPMC-badged commenters) | F | three technical rounds plus HR; basic React, web performance, TypeScript, GraphQL |
| J21 | https://dev.to/aajinkya/coding-challenges-in-react-5bnn | dev.to, 2026-04 | "JPMC and Barclays" (multi-company) | F | fetch-and-render pair-programming task; not attributable to one company |
| J22 | https://medium.com/@ajit34555/jp-morgan-interview-second-62f94e148bb5 | Medium | React second round | U (snippets S) | React test cases, Mocha, event loop, Promises versus callbacks |
| J23–J30 | Glassdoor pages: Front End Developer (EI_IE5224839.0,13_KO14,33), Software Engineer Front End UK (KO14,41), UI Developer (E145 KO11,23), Front End Engineer (KO11,29), Software Engineer II India (KO14,34), Full Stack Developer, Software Engineer Associate (KO11,38), Software Engineer Program (KO14,39) | Glassdoor, 2021 to 2025 | various | S | the snippet items quoted above |
| J30-Med | https://khaniqbal.medium.com/jp-morgan-avp-sde3-interview-experience-selected-df2d199dfd20 | Medium through RSS, 2024-09 | AVP/SDE3 (grade 602), Java, India, selected | F | three one-hour elimination rounds in one week |
| J32–J59 | LeetCode 5438765, 7232697, 7421234, 7455878, 7275188, 6766946, 7359766, 6830133, 897947; Taro 5c2f81ca, 41164240, 5c0e6666, aa96633d, 1256186e, 2363ebf5, ae49eab0; Blind d0ed5ppz, kea5nvlr, oea4wzz4, y5w758fz, jnhkqeq8, hvaqkrr3, lg0ijch5, g26e7y6t, v2rrv0uw, ks4121yh; GeeksforGeeks campus posts; Medium 111e16dd3577 | 2019 to 2026 | generic Software Engineer II/III, Lead and campus loops, US, UK and India | F | the super-day shape, level names, calibration problems |
| J60 | https://www.jointaro.com/interviews/companies/jpmorgan-chase/work-experiences/frontend-developer-dublin-dublin-august-28-2024-5-4a71e1c9/ | Taro work review, 2024-08 | Frontend Developer, Dublin | F | a work review that ranks for the query; no interview content |

Official pages (read 2026-10-21):

| id | URL | content |
|---|---|---|
| J-O1 | https://www.jpmorganchase.com/careers/how-we-hire | "Explore", "Apply", "Interview", "Decision"; "The interview process will differ for each position. But as we get to know you—and you get to know us—you can expect to meet with several people in multiple rounds." |
| J-O2 | https://www.jpmorganchase.com/careers/how-we-hire/faqs | "Examples of some of the types of assessments we use include structured live interviews, on-demand/recorded interviews, and virtual skills assessments."; "Technical assessments may take the form of online tests or technical interviews where you demonstrate your skills live with an interviewer." |
| J-O3 | https://www.jpmorganchase.com/careers/explore-opportunities/programs/software-engineer-fulltime | the Software Engineer Program's Front-end Developer track: "You'll create AI-powered interfaces like chat assistants with streaming responses and citations, contribute to design systems and accessibility standards, implement secure authentication, and use modern frameworks like React, Swift, and Kotlin"; no interview-format text |
| J-O4 | https://jpmc.fa.oraclecloud.com/hcmRestApi/resources/latest/recruitingCEJobRequisitions (finder `findReqs;siteNumber=CX_1001,keyword=...`) | 266 requisitions match "React", 310 "front end"; the frontend-titled requisitions listed under "Titles and levels" |

Not used as evidence: Dataford (five slugs), Prepfully, the Aced and Exponent question lists, interviewquery, the GeeksforGeeks "JP Morgan Chase Interview Questions" list, Taro's aggregated "From reported experiences" page.

## Agoda

**Verdict.** Good depth for the Bangkok relocation loops and for Gurgaon, thin for Bangalore, snippet-only for Manila. Agoda is the best-sourced of the three.

- **Sources:** 46 candidate-side pages read in full (17 LeetCode posts, 1 Code360 report, 2 Medium posts through the author feed or an archive, 1 frontendgeek, 1 Substack, 1 dev.to, 7 Taro, 16 Blind threads) and 9 official pages (five careersatagoda.com pages and the Staff front-end posting from archive captures, because the live site returns a Cloudflare 403; two Agoda Engineering posts on Medium; the Greenhouse board API). Of the 46, 13 are frontend loops with concrete content [A1–A8, A11–A15]; about twenty generic software-engineer loops [A21–A46] fix the shape. Nine sources are snippet-only: eight Glassdoor reviews [AG1–AG8] and a member-only Medium post [A11].
- **Where the reports come from:** Bangkok relocation loops, mostly interviewed from India [A1, A3, A4, A8, A9, A12]; Gurgaon [A2, A7, A11, A13, A20]; Bangalore candidates relocating to Thailand [A12]; Manila only through Glassdoor snippets [AG2, AG3]. Senior and Staff dominate; one SDE2 offer in Gurgaon [A13]; one new-grad loop in Bangkok [A32].
- **Newest:** LeetCode, interview July 2026, posted 2026-08-13 [A1]. The newest Blind thread is from 2026-07 [A19], the newest Glassdoor snippet from 2026-02 [AG1].
- **Titles and levels:** on the Greenhouse board on 2026-10-21 [AO9]: "Staff Software Engineer - Front End", "Staff Software Engineer - Front End AI", "Lead Software Engineer - Front End", "Frontend/Full Stack Engineer Manager", plus Staff and Lead "Full Stack". Agoda numbers levels in titles ("Staff - Level 4", "Lead Software Engineer (Level 5)", "Principal ... L7"). Reports describe down-levelling from Staff to Senior after the platform round [A1] and fast-tracking from Senior to Staff after a strong platform round [A3, A8, A7 commenter].
- **Hiring on 2026-10-21:** 309 postings; four front-end-titled, all Bangkok-based with relocation; one Gurugram "Staff Software Engineer - Full Stack"; no engineering postings in Manila or Bangalore. The Staff front-end posting asks for "8+ years' experience building and leading rich web applications at scale" and "Deep mastery of JavaScript/TypeScript and modern frameworks (React, Next, Vue)" [AO8].
- **What ranks for `agoda frontend interview questions`** (our search tool, not Google): the Dataford template, six Prepfully pages, the Code360 report [A2], Glassdoor's "Senior Front End Developer" page and one review. No editorial guide. The template prompts (a Spotify-like streaming site, an Instagram-style app, a real-time messenger, a video streaming frontend, flatten a nested list, a `useEffectOnce` hook, a maximum-discount calculation) appear in no first-person report.

**Loop, Bangkok (Senior and Staff front end, relocation, 2025 to 2026).** Every round is remote on HackerRank: "All interview rounds were online on HackerRank. Each round happened with a gap of a week." [A1]; the Frontend Platform interview was "also conducted through HackerRank" [A3].
1. Application through the careers site, LinkedIn or a referral; a recruiter "Prep Call (15 mins)" [A3; A4 "Recruiter Connect"; A21 30 minutes]. Some loops open with a HackerRank online assessment [A9, A32: three questions in 90 minutes; A23–A25: one DSA problem plus one HTTP or API question]; A1, A3 and A4 had none.
2. Coding interview, 60 minutes, with an engineer: two easy-to-medium DSA problems plus quick verbal questions on testing and the pull-request process [A1; A4 "2 Leet code, medium questions, one after the other ... [JavaScript Leetcode]"; A5 "Two medium level DSA questions"]. One Glassdoor snippet reports a five-problem HackerRank test for a 2026-02 Senior Front End loop [AG1], which may be an assessment rather than this round.
3. Frontend Platform interview, 60 minutes: three shapes were reported: a web-fundamentals question-and-answer hour with no code [A1]; a JavaScript implementation grown out of a resume item, 40 to 50 minutes, then 10 to 15 minutes of behavioural questions ("This is a JavaScript coding round! Not a react machine coding round, nor a system design round" [A4]); an architecture discussion on "Component reusability", "State management best practices", "Handling API data efficiently" and "Debugging and optimizing rendering" [A3], or a performance scenario followed by React questions [A14]. Agoda's prep guide tells front-end candidates to expect web-related questions and a code snippet to improve [A16, relayed]. For backend and full-stack candidates the same slot is a design critique plus a code review [A21–A24, A38; AO6].
4. Preliminary or recruiter call, 30 minutes: relocation, notice period, compensation and feedback [A3, A4, A9]. Strong candidates move to the Staff track here and get an extra architecture round [A3, A8, A7 commenter]; A1 was down-levelled after round 2.
5. Architecture interview, 60 minutes: a frontend-flavoured product design with no diagram expected (a hotel search page [A1]; "create a doctor appointment booking application" [A4]; "design and review a system end-to-end" from both frontend and backend perspectives [A3]). The Staff track adds a "BE Platform" hour on a hotel booking system [A3].
6. Culture fit, 60 minutes, with an engineering manager [A3; A8 "Culture Fit + Tech"; A25 rejected here; A21 "Values round 1.5 hour"], then a feedback call in which "your manager is the one who gives you the offer directly" [A3; A4 "They will provide a low ball number"].

Timing: a week between rounds [A1]; A3 went from the first call in August 2025 to an offer by the end of September; A25's loop took one week, A23's two months. Official: "We typically make the final decision within 2 weeks of your last interview round" [AO1] and "we aim to complete the process in under 30 days" [AO5]. Rejections after clearing every technical round are reported, over headcount [A9, A10] or without a managerial round [A7]. The six-month re-apply rule [AO2] is confirmed by a candidate who "Applied again after 6-month cooling period" [A20].

**Loop, Gurgaon (2024 to 2025).**
- Frontend Engineer, 8+ years, May to June 2025 [A2]: a take-home "Stock Analyzer Dashboard" (listed as a 120-minute "Online Coding Interview"), then 60 minutes of Longest Substring Without Repeating Characters plus "Create a debounced utility function in JavaScript.", then 60 minutes of frontend system design for a travel booking site, then a 60-minute technical-strategy round. Every round is marked "Cleared"; the outcome is "Rejection".
- Senior Software Engineer, June 2025 [A7]: an online assessment ("8 HTML/CSS questions and 2 JavaScript coding problems"), "HR Screening", a HackerRank round ("both JavaScript problems with 100% test case pass"), a platform round (hoisting, class behaviour, SSR versus CSR, atomic design, testing), "HR Salary & Relocation Discussion", then "a rejection email without a managerial round". A commenter: "Recruiters and interviewers were from bangkok!"
- Full Stack, SDE2 offer, October 2024 [A13]: a DSA round, a platform round ("design a system's architecture and create an integrated frontend for backend API calls"), a managerial round; the next technical round was skipped.
- Frontend Engineer, May 2025 [A11, preview only]: HackerRank, 90 minutes, one machine-coding problem plus five multiple-choice questions.
- The Greenhouse board lists no Gurugram front-end-titled role; interviewers may sit in Bangkok. Confidence: medium.

**Loop, Bangalore and Manila.** One Bangalore Staff candidate interviewing for Thailand relocation, July 2025 [A12]: a 60-minute-plus phone screening (JavaScript basics, promises, a sliding-window problem), a "DSA & JavaScript Round" (one DSA and two JavaScript problems), a live HackerRank stack problem; not selected. Manila has Glassdoor snippets only [AG2, AG3]: a 90-minute assessment with "3 questions to build a react component or general javascript questions", then an hour "with 1 leetcode question and another question to build something"; the board shows no Manila engineering roles, so no Manila loop should be stated as fact.

**Generic software-engineer loops, for structure only** [A21–A46]: recruiter call, a HackerRank assessment (often one DSA problem plus one HTTP or API call), a live DSA hour, a platform hour (critique a given design, REST choices, code review of a snippet, testing and rollout questions), a system-design hour (hotel, flight or concert booking), then the hiring manager or culture fit. CodeSignal was used in 2021 to 2023 [A17, A29, A44]; a fly-in onsite existed before 2023 [A44, A45]; a 2025 Bangkok new-grad loop was in person ("Remember to bring your laptop to the office, as they do not provide one.") [A32].

### Reported questions: Agoda

**Web fundamentals (platform round)**
- The one-hour question-and-answer platform round, quoted in full: "Techniques to optimize page landing speed"; "A bit about SSG, SSR, CSR, ISR"; "List core entities for hotel booking page."; "What things would you cache in CDN, how updates will happen to them."; "How CDNs work?"; "What are different ways to store data on client side? (local storage, session storage, ...)"; "Where will you store the authentication token? What are advantages, disadvantages, and security implications of each storage"; "What is CSRF and XSS? How they happen? What is the mitigation for it?"; "What are different ways to store data or do state management in React? (local state, props, context api. External state management libs like redux)"; "On hotel booking page, what are different ways we can store the state of selected filters? (state, query params ...)"; "How do you measure web page performance? (Core web vitals performance metrics)"; "How would you track the funnel conversion i.e. How many users went through this flow of search -> view -> book -> pay, and how many at each stage?"; "Different testing strategies and best practices for them? (Unit test, integration test, screenshot test and example/boundary for each)"; "How would you manage test failures happening not because of your own code? (mocking those external deps, using mock servers, add a retry for flaky test, make tests independent of each other ...)" [A1, 2026-07, Senior Software Engineer (Frontend), Bangkok].
- After the coding problems: "If you had to test this function you wrote, what all test cases you will write. Also tell other kinds of testing such unit tests, e2e tests..."; "Before raising a PR, what all we should check/do?" [A1].
- "The interviewer asked some JS concepts around session management, promises, and some scenario-based questions."; "how to improve Lighthouse scores ... LCP, FID, TTI, and TBT"; "testing in React: unit testing vs. integration testing vs. E2E testing" [A5, 2025-09, Full Stack, Thailand].
- "JavaScript concepts: Hoisting, Class behavior, SSR vs. CSR"; "Frontend structure: Atomic design architecture"; "Testing practices and debugging" [A7, 2025-06, SSE, Gurgaon].
- "What is useContext in React?"; "Explain all the React Hooks and how would you use them."; "When you try to access any website, what is the process that your device will go through until the website is loaded?"; "What is the difference between HTTP and HTTPS?"; "What is a TLS Server and how does it work?"; "How would you improve the performance of a React application?" [A32, 2025-07*, Software Engineer, Bangkok].
- "JavaScript Basic and promise" in a 60-minute-plus phone screening [A12, 2025-07, Staff, Bangalore]; "What is CDN and name some services?" [A33, 2025-10*, Staff, Bangkok].
- Explain LCP, CLS and INP; optimise a page with thousands of images; browser storage options; frontend testing types (S, paraphrase) [AG1, 2026-02, Senior Software Engineer Front End, Bangkok].
- Platform topics without wording: "Component reusability / State management best practices / Handling API data efficiently / Debugging and optimizing rendering" [A3, 2025-09, Senior, Bangkok]; "a scenario to optimize performance and then asked some react questions in continuity" [A14, 2024-08].

**Utility functions**
- "Create a debounced utility function in JavaScript." [A2, 2025-05, Frontend Engineer, Gurgaon].
- "I was asked to implement a pipe-line based JS function. And extented to a asyc-limit question." (40 to 50 minutes, grown out of a resume item: "not mention something, that can be turned into a Javascript function, which you have not already prepared!") [A4, 2025-02, Staff Frontend, Bangkok].
- "JavaScript: Immutable Copy Implementation" of a class with three numeric properties and a `sum()` method (statement cut by the paywall) [A11, 2025-05, Frontend Engineer, India, S].
- "Memoization Function — build a wrapper that returns cached result for same inputs without recomputing." [AG1, 2026-02, S].
- Unnamed JavaScript problems: two in the assessment and two in the HackerRank round [A7]; "1 DSA Problem and 2 JS problems" [A12].

**React and framework builds**
- Take-home: "Build a React + TypeScript single-page application to fetch and display stock data from a given API. The application should include paginated data tables, summary statistics (such as the lowest value, the average open price for 2006, and the longest positive streak where close > open), and an interactive user interface with a focus on performance, modular architecture, and clean code practices." [A2, 2025-05, Frontend Engineer, Gurgaon].
- Machine-code a flashcard after explaining a tool from your project "like a kid would understand" [A6, 2024-09, Full Stack, location not stated].
- "design a system's architecture and create an integrated frontend for backend API calls" [A13, 2024-10, Full Stack, Gurgaon].
- An assessment with "3 questions to build a react component or general javascript questions", then "1 leetcode question and another question to build something" [AG2, 2026-02, Senior Frontend, S]; a HackerRank test "with both react and algorithms questions" whose React part displays a list of elements [AG4, 2025-07, Full Stack, Bangkok, S].
- A code snippet to improve in the platform round: "In second part they may give you code snippet for review, make sure you cover best practices and security aspects" [A19 commenter, 2026-07]; the prep guide's "code snippet and I would be asked to improve it" [A16 commenter, 2024-10].

**HTML and CSS**
- "8 HTML/CSS questions" in the assessment [A7]; five multiple-choice questions beside the machine-coding task [A11, S]; a Gurgaon 2026 assessment "with DSA and MCQ questions" [AG8, S]; 2019 Bangkok: 11 questions, five of them coding [AG5, S]. No CSS layout task was reported anywhere.

**DSA**
- "Leetcode 1331 - Rank Transform of an Array" and "Leetcode 70 - Climbing Stairs" with 1, 2 or 3 steps, two easy problems in an hour with complexity analysis [A1, 2026-07, Senior (Frontend), Bangkok].
- Longest Substring Without Repeating Characters [A2, 2025-05, Gurgaon].
- "2 Leet code, medium questions, one after the other ... expect some pair programming and feedback corrections" [A4, 2025-02, Staff Frontend, Bangkok]; "Two medium level DSA questions" on HackerRank, both done in 35 minutes [A5, 2025-09, Full Stack].
- Planes descending at given speeds with one shot per second: the maximum number of planes that can be stopped from landing; the number of robot paths through a grid with obstructions, moving right and down [A6, 2024-09, Full Stack].
- A sliding-window problem in the phone screen; a stack problem: "calculate the molecular weight of a given chemical formula that may contain nested parentheses and multipliers. Valid atoms are C = 12 , H = 1 , and O = 8" [A12, 2025-07, Staff, Bangalore].
- "A straightforward array question"; "A medium-difficulty hash-map problem" [A13, 2024-10, Gurgaon].
- "Comment Moderator" (banned-word filtering with hash lookups) and "Cross the Threshold" (binary search on the answer) in a five-problem HackerRank test [AG1, 2026-02, S]; "reverse an array and find pair of sum" [AG6, older, Gurugram, S]; "Leetcode medium" [A18 commenter, 2024-09]; "the leetcode is easy to medium level" [A17 commenter, 2021-11].
- Generic loops, for calibration: Min Stack, Koko Eating Bananas, Next Greater Element, Course Schedule [A28]; Minimum Window Substring, Task Scheduler [A30]; monotonic-stack and binary-search variations [A22, A25]; "call an external endpoint and parse the response from the json" in an assessment [A25]; reverse only the alphanumeric characters of each word ("Hello, Bangkok:)" becomes "olleH, kokgnaB:)") [A31].

**Frontend system design**
- "Design a hotel search page from scratch. The design should be scalable, maintainable, and observable. It should have real-time chat integration. It should support a million users, multiple teams, have flexibility of deploying multiple features with fast iterations." The wireframe is given (date, city and guest inputs on top; filters on the left; result cards on the right). Follow-ups: micro-frontends, monorepo versus multi-repo, build and independent deployment, framework choice, where filter and input state lives and in which components, component breakdown, bundler selection, testing architecture, monitoring; "no diagram-drawing was expected" [A1, 2026-07, Senior (Frontend), Bangkok].
- "Design a scalable frontend architecture for a travel booking website (similar to Agoda) that can handle high traffic, support micro-frontends, provide SEO-friendly rendering (SSR/SSG), and include performance optimizations." [A2, 2025-05, Gurgaon].
- "Architectural Round: HLD round, was asked to create a doctor appointment booking application" [A4, 2025-02, Staff Frontend, Bangkok].
- Architecture: "design and review a system end-to-end", scalability and trade-offs, code review practices, system evolution, "Both frontend and backend architecture perspectives"; BE Platform: a hotel booking system, "How would you identify performance bottlenecks? How can the system be optimized for scalability and reliability? What metrics would you monitor, and how would you debug production issues?" [A3, 2025-09, Senior then Staff track, Bangkok].
- "one small system design question" in the platform round [A15, 2022-09, SSE Full Stack, Bangkok]; "design a system which manages booking hotels in Peak time" [A19 commenter, 2026-07]; "design an ecommerce platform ... more of a design discussion round rather than a system design round" [A40, 2024-08, Lead].
- Generic loops: improve a given booking design (load balancer, rate limiter, queue) and review a booking API [A21]; an airline-aggregator critique, then flight aggregation [A22]; hotel search with proximity search [A24]; a hotel inventory service querying internal data plus partners [A25]; file storage, flight booking, flight-price retrieval under provider rate limits [A26]; a vendor-facing bookings API [A35].

**Behavioural**
- "Technical Strategy" round: "How do you ensure your team follows best coding practices?", "Have you ever disagreed with product or design decisions? How did you handle it?", "What's your approach to mentoring junior developers and scaling a team?", "What do you think about the future of frontend development over the next 3–5 years?", "How do you balance fast delivery with long-term maintainable architecture?" [A2, 2025-06, Gurgaon].
- Culture fit with an engineering manager: handling conflicts, learning from production issues, balancing perfection with deadlines, working in a diverse international environment [A3, 2025-09, Bangkok]; "Behavioural question around agoda" for 10 to 15 minutes inside the platform round [A4].
- "Values round 1.5 hour ... mentorship, mistakes, experiment, trade off, conflict" [A21, 2025-08, Staff]; "technical leadership, handling conflicts, pushing back on design decisions" [A22, 2026-04, Staff]; "working under a tight deadline, mentoring juniors" (rejected on this round) [A25, 2025-06]; "Why do you want to join Agoda?" in every round [A27, 2024-10].
- An HR call on salary expectations and reasons for leaving, then a rejection because the team wanted React-only candidates although the posting listed Angular and Vue [AG1, 2026-02, S]. Interviewers use the CAR method (Context, Action, Results) [AO4].

### Sources: Agoda

Frontend accounts (F = read in full, S = snippet, U = unread; Taro dates on the 1st are placeholders):

| id | URL | publisher, date | role, location | access | content |
|---|---|---|---|---|---|
| A1 | https://leetcode.com/discuss/post/8459009/ | LeetCode, 2026-08 (interview 2026-07) | Senior Software Engineer (Frontend) after applying for Staff; Bangkok, relocation | F | three HackerRank rounds a week apart; web-fundamentals hour; hotel search page architecture; rejected |
| A2 | https://www.naukri.com/code360/interview-experiences/agoda/agoda-interview-experience-by-brijesh-verma-may-2025-exp-0-2-years (JSON endpoint) | Code360, rounds 2025-05-08 to 2025-06-06 | Frontend Engineer, Gurgaon, "8+ years" (the slug says 0 to 2 years) | F | Stock Analyzer take-home; debounce; travel-site architecture; technical strategy; rejected |
| A3 | https://kr-viku.medium.com/%EF%B8%8F-my-agoda-interview-journey-from-first-call-to-offer-086385b03d33 (through the author feed) | Medium, 2025-11 (loop 2025-08 to 09) | Senior Software Engineer, Bangkok, offer; frontend candidate moved to the Staff track | F | the recruiter's seven-step list with durations; Frontend Platform topics; the manager presents the offer |
| A4 | https://leetcode.com/discuss/interview-question/6398233 | LeetCode, 2025-02 | Staff Frontend, Bangkok, selected | F | two medium problems in JavaScript; pipeline function with async limit; doctor appointment app design |
| A5 | https://leetcode.com/discuss/post/7199643/ | LeetCode, 2025-09 | Full Stack (referred), Thailand, offer | F | two medium DSA; JavaScript and React round; backend design improvement and code review |
| A6 | https://leetcode.com/discuss/interview-experience/5823525/ | LeetCode, 2024-09 | Full Stack, frontend developer, location not stated | F | planes and grid-path problems; flashcard machine coding; rejected |
| A7 | https://www.teamblind.com/post/my-interview-experience-with-agoda-zhhgctzk | Blind, 2025-06 | SSE, Gurgaon | F | assessment, HR, HackerRank, platform, HR, rejection; commenters on the Staff track and Bangkok interviewers |
| A8 | https://www.teamblind.com/post/what-can-i-expect-in-agodas-sse-frontend-culture-fit-round-xchtevrv | Blind, 2025-06 | Senior Frontend Engineer, moving to Bangkok | F | coding, Frontend Platform, architecture, Staff consideration, culture fit |
| A9 | https://beyondthecode.medium.com/my-agoda-interview-journey-a-candid-reflection-55de22d2276b (archive capture) | Medium, 2025-07 | Senior Software Engineer, Front End, Bangkok | F | six stages; no offer "due to current headcount constraints"; no questions |
| A10 | https://www.jointaro.com/interviews/companies/agoda/experiences/senior-frontend-engineer-bangkok-june-1-2025-no-offer-positive-0be35f2b/ | Taro, 2025-06* | Senior Frontend Engineer, Bangkok | F | five rounds, headcount; probably the same loop as A9, counted once |
| A11 | https://medium.com/frontend-army/my-agoda-frontend-interview-experience-82-lpa-senior-software-engineer-6eda35f4df67 | Medium, 2025-05 | Frontend Engineer, India | S (member-only; preview) | 90-minute HackerRank machine coding plus MCQs |
| A12 | https://www.frontendgeek.com/interview-experience/staff-frontend-interview-experience-at-agoda-rejected-thailand-relocation---f13f1824-08d9-4385-a219-269aaeb3d301 | frontendgeek, 2025-07 | Staff Software Engineer, Bangalore, Thailand relocation | F | phone screening; DSA and JavaScript round; stack problem; "180000 Thai bhat it is base pay" |
| A13 | https://nerddesignlab.substack.com/p/interview-experience-agoda-gurgaon | Substack, 2024-10 | Full Stack, SDE2 offer, Gurgaon | F | DSA; platform with a frontend build; managerial |
| A14 | https://www.teamblind.com/post/agoda-platform-round-interview-question-examples-oqgxtogk | Blind, 2023-10, follow-up 2024-08 | senior full stack, React | F | performance scenario then React questions |
| A15 | https://www.teamblind.com/post/agoda-bankok-platform-interview-10gow7wq | Blind, 2022-08 | SSE Full Stack, Bangkok | F | platform round with one small design question |
| A16 | https://www.teamblind.com/post/agoda-bankok-platform-interview-wlgcyzeh | Blind, 2024-10 | Front End or Full Stack, Bangkok (p, c) | F | the prep guide's "web-related questions" and "code snippet to improve" |
| A17 | https://www.teamblind.com/post/agoda-frontend-interview-dzhtx8dh | Blind, 2021-11 | frontend (p, c) | F | "easy to medium level" LeetCode, "basic platform" |
| A18 | https://www.teamblind.com/post/agoda-interview-front-end-role-l1sptmvy | Blind, 2024-09 | front end (p, c) | F | "Leetcode medium" |
| A19 | https://www.teamblind.com/post/agoda-platform-interview-khv6no3o | Blind, 2026-07 | platform round (p, c) | F | peak-time hotel bookings; code snippet review |
| A20 | https://leetcode.com/discuss/post/7580886/ | LeetCode, 2026-02 | Senior Frontend candidate; Gurgaon and Bangkok loops | F (Agoda part) | Gurgaon rejection in round 2; Bangkok offer after the six-month cooling period |
| A32 | https://www.jointaro.com/interviews/companies/agoda/experiences/software-engineer-bangkok-july-1-2025-accepted-offer-positive-01180b45/ | Taro, 2025-07* | Software Engineer, Bangkok, new grad | F (probable Glassdoor mirror) | 90-minute assessment; in-person loop; hooks, HTTP and TLS questions |
| A33 | https://www.jointaro.com/interviews/companies/agoda/experiences/staff-software-engineer-october-1-2025-no-offer-negative-207e9184/ | Taro, 2025-10* (Glassdoor mirror) | Staff Software Engineer, Bangkok | F | "What is CDN and name some services?" |
| A21–A31, A34–A46 | LeetCode 7082771, 7755434, 7565801, 7237792, 6859065, 5290917, 5978891, 3846220, 3620884, 3679612, 1586149; Taro 67354397, 01bd1ff6, 6e64f563, 9cea17ff; Blind 873mc3nz, ke36kmpg, feczcb5s, yEbnnTsd, vVTy6T8t, 37d73dtm, ivzdeley, zqvqazkj; dev.to freeze_francis | 2019 to 2026 | generic Software Engineer, backend and full-stack loops in Bangkok and Gurugram | F | loop shape, platform-round format and DSA calibration only |

Glassdoor snippets (S):

| id | page | date | role, location | content |
|---|---|---|---|---|
| AG1 | https://static.glassdoor.nl/Interview/Agoda-Senior-Front-End-Developer-Interview-Questions-EI_IE461386.0,5_KO6,32.htm | 2026-02 | Senior Software Engineer Front End, Bangkok | five-problem HackerRank test; web performance, testing and storage round; "React-only" rejection |
| AG2 | Senior Frontend Developer page (EI_IE461386.0,5_KO6,31.htm) | 2026-02 | Senior Frontend, city not in the snippet | 90-minute assessment; one LeetCode plus one build task |
| AG3 | same page | 2024-09 | Senior Frontend, Manila | medium DSA first round; an unanswered take-home |
| AG4 | Full Stack pages | 2025-07 | Full Stack, Bangkok | React plus algorithms HackerRank; display a list |
| AG5, AG6 | https://www.glassdoor.com/Interview/Agoda-Frontend-Engineer-Interview-Questions-EI_IE461386.0,5_KO6,23.htm | 2019-12 and older | Frontend Engineer, Bangkok; Gurugram | 60-minute HackerRank with 11 questions; two CoderPad interviews; "reverse an array and find pair of sum" |
| AG7 | Senior Software Engineer page | 2025 | Senior Software Engineer | one-hour live HackerRank, two medium questions |
| AG8 | company overview | 2026 | Gurgaon | assessment "with DSA and MCQ questions" |

Official pages (archive captures; the live careersatagoda.com returns a Cloudflare 403 to our tools; the Staff posting is confirmed live on Greenhouse):

| id | URL | publisher, date | access | content |
|---|---|---|---|---|
| AO1 | https://careersatagoda.com/blog/how-we-hire-agodas-tech-team-interview-process/ | Agoda Careers, 2025-07-23 (capture 2026-04-06) | F | HackerRank assessment; the four rounds; decision within two weeks; the front-end stack |
| AO2 | https://careersatagoda.com/blog/how-we-hire-for-tech-roles-at-agoda/ | Agoda Careers, 2021-11-08 (capture 2025-07-15) | F | coding quiz, "sometimes ... a small project", at least two technical interviews, six-month re-apply rule, relocation |
| AO3 | https://careersatagoda.com/how-we-hire/ | Agoda Careers (capture 2026-10-05) | F | four stages whose order may vary; live or take-home case study |
| AO4 | https://careersatagoda.com/interview/ | Agoda Careers (capture 2026-10-19) | F | CAR method; two video rounds then face-to-face; AI rules |
| AO5 | https://careersatagoda.com/blog/how-we-hire-agoda-hiring-process/ | Agoda Careers, 2024-07-19 (capture 2025-10-25) | F | "under 30 days"; assessment, initial and final interviews |
| AO6 | https://medium.com/agoda-engineering/preparing-for-interview-at-agoda-2c07b7d13ca5 | Agoda Engineering, 2023-06-19 (capture 2025-05-12) | F | an interviewer's guide to the Coding and Platform rounds |
| AO7 | https://medium.com/agoda-engineering/a-day-in-the-life-of-a-front-end-engineer-at-agoda-7dafe10f4ddb | Agoda Engineering, 2025-09-24 (capture 2025-11-02) | F | React with TypeScript, C# and .NET integration, in-house design system |
| AO8 | https://careersatagoda.com/job/6161341-staff-software-engineer-front-end-bangkok-based-relocation-provided/ | Agoda posting, first published 2024-08-09, updated 2026-10-16 | F | Staff front-end requirements; relocation package |
| AO9 | https://boards-api.greenhouse.io/v1/boards/agoda/jobs?content=true | Greenhouse board, 2026-10-21 | F | 309 postings; four front-end-titled, all Bangkok |

Official wording to reuse (all verified in the captures): "You'll receive a Hacker Rank online test to complete within the provided timeframe." [AO1]; "the Agoda Tech interview process typically includes 4 rounds ... Coding Round ... Platform Round ... System Design Round ... Agoda Culture Fit Round" [AO1]; "We typically make the final decision within 2 weeks of your last interview round" [AO1]; "We write TypeScript code powered by React and Redux to build robust front end applications, leveraging Rspack and Vite for efficient bundling" and "our micro-front end (MFE) and cross-platform (CXP) solutions" [AO1]; "we often include a task that involves reviewing, fixing, and improving a given code snippet ... Play the role of a lint tool" and "we typically ask candidates to implement something related to Agoda" [AO6]; "Frontend developers are not limited to working solely on the client-side; they also contribute to front-facing API services." [AO6]; "Some parts of the process (e.g., live system design, technical Q&A, and behavioral interviews) must be completed without AI, unless specifically asked or encouraged to." [AO4].

## xAI

**Verdict.** Thin on candidate accounts, rich on official loop descriptions. The postings are the primary source; only two readable first-person frontend accounts exist.

- **Naming:** xAI merged into SpaceX (closed 2026-02-02 [X-N1]) and rebranded as SpaceXAI in the first week of July 2026 [X-N2]. On 2026-10-21 the careers page title read "SpaceXSI" and its footer "© 2026 SpaceXAI LLC"; the Greenhouse board slug is still `xai`, and search demand is for "xai". Whether the page says xAI, SpaceXAI or both is an editorial decision.
- **Sources:** 41 read in full (17 official pages and postings, 18 candidate accounts, 3 items about X the social app, 3 news pages), 7 snippet-only, 10 unreadable. Frontend-specific accounts: one London loop read in full [X1], one "Software Engineer Specialist" loop with JavaScript and React interviews [X2], two Bay Area frontend onsites locked behind 1point3acres' login [X4, X5], one Glassdoor review about React hooks and a scaling discussion that no tool could open [X3]. Everything else is general software-engineer evidence, used only for pace and tone.
- **Where the reports come from:** London [X1], a remote "Specialist" track [X2, X9], Bay Area onsites [X4, X5, locked], Palo Alto and San Francisco for general roles [X7, X8, X10, X14]. Levels are flat: Aced tags two accounts L3 and L5, nothing else carries a level.
- **Newest:** Blind, 2026-10 [X13], a software-engineer coding round with a LeetCode problem inside a loop marketed as "no LeetCode". The newest frontend account is X1 (Taro date 2025-08-13, Glassdoor date not visible). The newest frontend postings with a loop are "Frontend Engineer - Enterprise" (posted 2026-02-21, removed 2026-02-25) and the London "Frontend Engineer" and "Developer Experience Frontend" pair (removed 2026-02-17).
- **Titles:** Frontend Engineer (London; Enterprise, Palo Alto), React Frontend Engineer - grok.com & API (London and Palo Alto), Senior Frontend Engineer - Grok Studio (shown as "Agents UX" on the 8VC board), Senior Frontend Engineer - Autonomous Agents (and "- Starfleet"), Developer Experience Frontend (London), Frontend Engineer & UI/UX Designer (London), Web Engineer, X (Palo Alto, open), Member of Technical Staff - Grok Product (open; "highly scalable frontends"). Every engineering posting carries the band "$180,000 - $440,000 USD".
- **Hiring on 2026-10-21:** the Greenhouse board listed 302 jobs; "Web Engineer, X" (first published 2026-03-19) was the only frontend-titled opening; no current engineering posting carries an interview section. Musk said on 2026-03-18 that xAI "is being rebuilt from the foundations up" and that past candidates were being re-contacted [X-N3].
- **What ranks for `xai frontend interview questions`** (our search tool, not Google): the Dataford template, a fr.glassdoor.ch review, the 8VC "Agents UX" posting, a dead Built In posting, the javascript.jobs mirror of the grok.com posting, a dead Greenhouse id, Glassdoor mirrors of one review, the empty Blind thread. No editorial guide; GreatFrontEnd, Front End Interview Handbook and LearnersBucket have no xAI page. PracHub's company page lists 69 questions, 8 of them frontend-tagged, none linked to a readable account.

**Loop, official postings (2025-03 to 2026-02).** Every engineering posting used one template: the team reviews the CV and a "statement of exceptional work", then a 15-minute "phone interview", then a per-team "main process" with the goal "to finish the main process within one week", all on Google Meet. The per-team parts:
- Grok Studio / Agents UX, Bay Area, live 2025-04 to 2026-01 [X-O6]: "Coding assessment in a language of your choice. Two front end technical interviews, in React/Typescript. Meet the Team: Present your past exceptional work and your vision with xAI to a small audience."
- Autonomous Agents, Bay Area, 2025-03 to 2026-02 [X-O7]: "Coding assessment in a language of your choice. Front end technical interview, in React/Typescript. Systems hands-on: Demonstrate practical skills in a live problem-solving session. Meet the Team".
- grok.com & API, London and Palo Alto, 2025-12 to 2026-01 [X-O5], and Enterprise, Palo Alto, 2026-02 [X-O4]: "Coding interview in TypeScript: Write a small app in React. HTML/CSS interview: Given a screenshot of a UI, implement it." The Enterprise posting says "at least two technical interviews".
- London Frontend Engineer and Developer Experience Frontend, removed 2026-02-17 [X-O8]: "Initial technical screening during which a member of our team will ask some basic technical questions (15 minutes). React coding interview (45 minutes). HTML/CSS/Tailwind coding interview (45 minutes). Final stage with founding engineer Toby Pohlen (30 minutes)."
- Frontend Engineer & UI/UX Designer, London, removed about 2025-02 [X-O9]: the React and HTML/CSS rounds, then "Design a UI in a tool of your choice (e.g. Figma or Photoshop)" and "a 20 minute presentation about previous design projects and complex UI flows you have implemented"; "We don't rely on recruiters for assessments."
- The careers page on 2026-10-21 [X-O1] keeps four generic steps and "We generally do not use recruiters for assessments. Applications are evaluated by our technical team members."

**Loop, candidate accounts.**
- London, Frontend Engineer, no offer [X1, Taro date 2025-08-13]: "Standard 15-minute phone interview, followed by a 1-hour pair coding session"; "live building a chat interface in React with someone from the engineering team, who will review your code live"; "Standard React-related questions, such as what the `useCallback` hook does". This matches the React round of X-O5 and X-O8; no HTML/CSS round is mentioned, so the candidate may have stopped after it.
- "Software Engineer Specialist" track [X2, 2025-08*; X9, Canada, 2025-10]: a CodeSignal assessment or a one-hour online assessment, then two interviews (JavaScript and React in X2; code review and translating code between languages in X9); both offers were later ghosted or rescinded. The titles look like a contractor or human-data track rather than the product frontend teams; keep them apart on the page.
- General software-engineer loops, for pace only: a 15-minute screen, a 4-hour AI-assisted take-home (one of six xAI prompts, X and xAI API keys, a GitHub repository and a Loom walkthrough within 24 hours) and a one-hour in-person final reading an existing class [X7, 2025-12, MTS L3]; six touchpoints in three weeks with class-design problems and no LeetCode [X8, 2025-11, Senior, Safety]; LeetCode problems reported by X13 and a commenter in X14, practical problems by X17 and a commenter in X13. Varies by team.
- No candidate account exists for the Grok Studio, Agents UX or Autonomous Agents loops; their stages rest on postings only.

### Reported questions: xAI

**React builds (live)**
- Build a chat interface in React during a one-hour pair-coding session while an engineer reviews the code live [X1, 2025-08*, Frontend Engineer, London].
- "Coding interview in TypeScript: Write a small app in React" (posting wording) [X-O4 2026-02 Palo Alto; X-O5 2026-01 London and Palo Alto; X-O9 about 2025-02 London]; "React coding interview (45 minutes)" [X-O8, 2026-02, London]; "Two front end technical interviews, in React/Typescript" [X-O6, 2025-04 to 2026-01, Bay Area].
- An onsite "React app task and backend algorithm challenge" (U, public summary only) [X4, date unknown, Frontend Engineering, Bay Area]; an onsite "React-based webapp task" (U) [X5].

**React and JavaScript fundamentals**
- What the `useCallback` hook does [X1, 2025-08*, London].
- "What is useRef and how is it used?" [X2, 2025-08*, Software Engineer Specialist].
- When to use `useState`, `useEffect` and `useMemo`, with practical use cases; a system-design discussion about scaling a backend to 10,000+ users (U, search paraphrase only) [X3, date unknown].

**HTML and CSS**
- No candidate account. Posting wording: "HTML/CSS interview: Given a screenshot of a UI, implement it" [X-O4, X-O5, X-O9]; "HTML/CSS/Tailwind coding interview (45 minutes)" [X-O8, 2026-02, London].

**UI design (designer-hybrid role only)**
- "Design a UI in a tool of your choice (e.g. Figma or Photoshop)" and a 20-minute presentation of previous design projects and complex UI flows [X-O9, about 2025-02, London].

**General coding and DSA**
- "Coding assessment in a language of your choice" [X-O6, X-O7, X-O10]; a "backend algorithm challenge" at the frontend onsite (U) [X4].
- Implement an iterator class with `next`, `hasNext`, `getState` and `setState`, then treat a list of iterators as one continuous iterator; an in-memory key-value store with `set`, `begin`, `commit` and `abort`, then nested transactions [X8, 2025-11, Senior SWE, Safety, Palo Alto].
- Read an existing 70 to 100-line class and implement the missing functionality for splitting LLM input into token-sized queues [X7, 2025-12, MTS L3, in person].
- A text editor with undo and redo (S) [X22, MTS]; a LeetCode problem inside a "no LeetCode" loop [X13, 2026-10, SWE].

**Frontend and system design**
- "Systems hands-on: Demonstrate practical skills in a live problem-solving session" [X-O7, Autonomous Agents]; "Systems design hands-on" [X-O10, Exceptional Engineer].
- Design a rate limiter, with follow-ups on fixed and rolling windows, a leaky bucket, multi-URL rules and cumulative request-body size [X8, 2025-11, Senior SWE, Safety].
- Template only, no account: a collaborative document editor, an asynchronous React typeahead, a nested JSON viewer (PracHub list).

**Take-home (general software-engineer loops, not seen on frontend postings)**
- Pick one of six xAI prompts and build a demoable product in four hours with your own IDE and AI tools, using the provided X and xAI API keys; submit a GitHub repository and a Loom video within 24 hours, explaining "What systems did you use?" and "Why did you build it this way?" [X7, 2025-12, MTS L3]; "their 4-hour intensive programming challenge" [X11, 2025-10, Grok role, San Francisco]; "4 hour take home project and one live coding with real codebase" (S) [X22, 2026-01].

**Behavioural and presentation**
- "Meet the Team: Present your past exceptional work and your vision with xAI to a small audience." [X-O6, X-O7]; "Project deep-dive: Present and answer questions about exceptional work that you've done." [X-O10].
- "Can you walk me through your background and previous experience?", "Are you okay with the work style here?", "Why do you want to work at xAI, and what part of the company do you want to work on?" [X7, 2025-12, MTS L3].
- "What's the most challenged project you recently had?" [X10, 2025-07*, SWE, San Francisco].

### Sources: xAI

Official pages and postings (dates are Built In posting and removal dates unless noted):

| id | URL | publisher, date | role, location | access | content |
|---|---|---|---|---|---|
| X-O1 | https://x.ai/careers | xAI, read in Chrome 2026-10-21 (curl and WebFetch get a Cloudflare 403) | all roles | F | four-step "Interview process"; "We generally do not use recruiters for assessments."; offices Palo Alto, Seattle, Tennessee, London |
| X-O2 | https://boards-api.greenhouse.io/v1/boards/xai/jobs?content=true | Greenhouse board, snapshot 2026-10-21 | 302 jobs | F | one frontend-titled opening; no engineering posting with an interview section |
| X-O3 | https://job-boards.greenhouse.io/xai/jobs/5063930007 | Greenhouse, published 2026-03-19 | Web Engineer, X; Palo Alto | F | TypeScript, Node.js, React, CSS/SASS; no interview text |
| X-O4 | https://builtin.com/job/frontend-engineer-enterprise/7383404 | Built In, 2026-02-21 to 2026-02-25 | Frontend Engineer - Enterprise; Palo Alto | F | 15-minute phone interview; TypeScript/React app; HTML/CSS from a screenshot |
| X-O5 | https://builtin.com/job/react-frontend-engineer-grokcom-api/4446453 (team text on the mirror https://javascript.jobs/job/react-frontend-engineer-grokcom-api, dated 2025-12-20) | Built In, 2026-01-11 to 2026-01-27 | React Frontend Engineer - grok.com & API; London and Palo Alto | F | the same two interviews; "React with NextJS", Tailwind; London late meetings |
| X-O6 | https://builtin.com/job/senior-frontend-engineer-grok-studio/4739518 and https://jobs.8vc.com/companies/x-ai/jobs/48336005-senior-frontend-engineer-grok-studio (8VC, posted 2025-04-03, title "Agents UX") | Built In, 2026-01-11 to 2026-01-27 | Senior Frontend Engineer - Grok Studio; Bay Area | F | coding assessment; two React/TypeScript interviews; Meet the Team |
| X-O7 | https://builtin.com/job/senior-frontend-engineer-autonomous-agents/4379947, https://jobs.8vc.com/companies/x-ai/jobs/47017313-senior-frontend-engineer-autonomous-agents (8VC, 2025-03-08), https://builtin.com/job/senior-frontend-engineer-autonomous-agents-starfleet/6934961 (2026-02-19 to 2026-02-24) | Built In, 2025-07-17 to 2025-07-19 | Senior Frontend Engineer - Autonomous Agents; Bay Area | F | coding assessment; one React/TypeScript interview; systems hands-on; Meet the Team; stack "React, Express, PostgreSQL" |
| X-O8 | https://builtin.com/job/developer-experience-frontend/7740449 (2026-02-03 to 2026-02-17) and https://www.builtinlondon.uk/job/frontend-engineer/7805551 (removed 2026-02-17) | Built In | Developer Experience Frontend; Frontend Engineer; London, 20 Air Street | F | 15-minute screening; React 45 minutes; HTML/CSS/Tailwind 45 minutes; 30 minutes with Toby Pohlen |
| X-O9 | https://uiuxjobsboard.com/job/864124-frontend-engineer-ui-ux-designer-london-united-kingdom (mirror; the Built In copy 2618190 is gone) | undated; removed about 2025-02 per a search summary | Frontend Engineer & UI/UX Designer; London | F | React app; HTML/CSS from a screenshot; Figma or Photoshop design; 20-minute presentation |
| X-O10 | https://builtin.com/job/exceptional-engineer-ai-coding-tools/7559499 | Built In, 2026-02-11 to 2026-02-25 | Exceptional Engineer - AI Coding Tools; Palo Alto and San Francisco | F | practical coding; systems design hands-on; project deep-dive; meet and greet; in-person finals |
| X-O11 | https://job-boards.greenhouse.io/xai/jobs/5051984007 | Greenhouse, published 2026-03-05, open | Member of Technical Staff - Grok Product; Palo Alto | F | "the user-facing chat portal at grok.com"; "highly scalable frontends, APIs"; no interview text |
| X-O12 | https://job-boards.greenhouse.io/xai/jobs/4784549007, 4800099007, 4985397007 | Greenhouse | earlier ids | U (redirect to the board) | removed |

Candidate accounts:

| id | URL | publisher, date | role, location | access | content |
|---|---|---|---|---|---|
| X1 | https://www.jointaro.com/interviews/companies/xai/experiences/frontend-engineer-london-england-august-13-2025-no-offer-positive-45b410e6/ (the Glassdoor original is the one review on https://www.glassdoor.com/Interview/xAI-Frontend-Engineer-Interview-Questions-EI_IE10404667.0,3_KO4,21.htm) | Taro, 2025-08-13 (Glassdoor mirror, count once) | Frontend Engineer, London | F (Taro), S (Glassdoor) | 15-minute phone interview; one-hour pair-coding chat interface in React; `useCallback` |
| X2 | https://www.jointaro.com/interviews/companies/xai/experiences/software-engineer-specialist-yerevan-yerevan-august-1-2025-accepted-offer-negative-c940c932/ (probable original: Glassdoor RVW103683812) | Taro, 2025-08* | Software Engineer Specialist; Taro city untrusted | F | CodeSignal; two JavaScript and React interviews; `useRef`; offer, then "completely ghosted by the HR team" |
| X3 | https://fr.glassdoor.ch/Entretien/xAI-Entretien-E10404667-RVW104333199.htm | Glassdoor, date not visible | not visible | U | hooks and a 10,000-user scaling discussion, per search paraphrase |
| X4 | https://www.1point3acres.com/interview/thread/1125096 | 1point3acres, date not visible | Frontend Engineering onsite, Bay Area | U | "a React app task and backend algorithm challenge" (public summary) |
| X5 | https://www.1point3acres.com/interview/thread/1102668 | 1point3acres | SDE onsite | U | "React-based webapp task" (public summary) |
| X6 | https://www.teamblind.com/post/xai-interview-e5irxzr7 | Blind, 2025-01-26, 33,555 views | frontend role (question) | F | no answers |
| X7 | https://www.aced.io/experiences/x-ai-software-engineer-interview-7fbd12 | Aced, interview 2025-12, submitted 2026-04 | Member of Technical Staff, L3; in-person final | F | 15-minute screen; four-hour take-home; code-reading final; rejected after 4 weeks |
| X8 | https://www.aced.io/experiences/x-ai-senior-software-engineer-interview-3c2a0d | Aced, interview 2025-11 | Senior Software Engineer, Safety, L5; Palo Alto | F | key-value store with transactions; iterators; rate limiter; no behavioural round |
| X9 | https://www.jointaro.com/interviews/companies/xai/experiences/software-engineering-specialist-canada-october-8-2025-accepted-offer-neutral-ddc2c4f2/ | Taro, 2025-10-08 | Software Engineering Specialist, Canada | F | one-hour assessment; two technical interviews; offer rescinded "due to restructuring" |
| X10 | https://www.jointaro.com/interviews/companies/xai/experiences/software-engineer-san-francisco-california-july-1-2025-no-offer-positive-8ba06b7f/ | Taro, 2025-07* | Software Engineer, San Francisco | F | resume conversation |
| X11 | https://andys.blog/xai/ | personal blog, 2025-10-09 | Grok role, San Francisco | F | recruiter-sourced; "4-hour intensive programming challenge"; withdrew |
| X12 | https://gaijineer.co/xai-software-engineer-interview-process | undated, anonymous | Software Engineer | F, low confidence | screen; live coding; design; hands-on; presentation; team interview |
| X13 | https://www.teamblind.com/post/xai-s-no-leetcode-interview-is-a-joke-8hnrfr1v | Blind, 2026-10 | SWE | F | LeetCode problem in a "no LeetCode" loop; commenters disagree |
| X14 | https://www.teamblind.com/post/xai-onsite-kinda-sucked-5ui5wpze | Blind, 2025-07 | SWE onsite | F | three interviewers; "easy compared with OpenAI and Anthropic" |
| X15 | https://www.teamblind.com/post/xai-offer-timeline-after-interview-30rczpzh | Blind, 2026-02 | AI infrastructure, Dublin | F | seven rounds; offer pending "Elon review" |
| X16 | https://www.teamblind.com/post/xai-non-ml-position-interview-gmxxbmdx | Blind, 2024-06 | non-ML SWE (p) | F | quotes the posting template |
| X17 | https://www.teamblind.com/post/xai-coding-interview-rgfjokxf | Blind, 2025-11 | SWE coding round | F | practical problems; commenters report LeetCode |
| X18 | https://www.teamblind.com/post/xai-onsite-interview-k8fgjeot | Blind, 2025-05 | SWE (p) | F | "60-minute technical assessment" |
| X19 | https://prachub.com/interview-experiences/xai-software-engineer-interview-final-stage-silence-483d0330b3 | PracHub, reported 2026-07 | Software Engineer, Hawthorne | F | no rounds or questions |
| X20 | https://news.ycombinator.com/item?id=47370767 and related comments | Hacker News, 2024 to 2026 | various | F | culture remarks; a fast-track recruiter outreach |
| X21 | https://www.teamblind.com/company/xAI/posts/xai-interview | Blind listing, read 2026-10-21 | 30 threads | F | loop fragments: 15-minute first rounds, a 30-minute team-matching call |
| X22 | Glassdoor snippets: https://fr.glassdoor.ch/Entretien/xAI-Entretien-E10404667-RVW104302618.htm, https://www.glassdoor.sg/Interview/xAI-Interview-E10404667-RVW101270143.htm, https://www.glassdoor.sg/Interview/xAI-Interview-E10404667-RVW103773444.htm | Glassdoor, 2025 to 2026 | MTS and SWE | S | phone screen, system design, LeetCode-style round, exec interview; undo/redo editor; take-home plus live coding; CodeSignal with camera and ID |

News:

| id | URL | publisher, date | access | content |
|---|---|---|---|---|
| X-N1 | https://driveteslacanada.ca/news/spacex-completes-merger-with-xai/ | Drive Tesla Canada, 2026-02-02 | F | merger documents dated 2026-02-02; entity renamed XAI Holdings LLC |
| X-N2 | https://www.freepressjournal.in/tech/elon-musks-xai-rebrands-to-spacexai-unveils-new-logo | Free Press Journal, 2026-07-07 | F | SpaceXAI rebrand "went live this week"; Grok under the SpaceXAI name |
| X-N3 | https://finance.yahoo.com/news/elon-musk-admits-xai-passing-120627338.html | Benzinga via Yahoo Finance, 2026-03-18 | F | past candidates re-contacted; "rebuilt from the foundations up" |
| X-N4 | https://www.ft.com/content/e5fbc6c2-d5a6-4b97-a105-6a96ea849de5 | Financial Times, 2026-03-13 | U (paywall; quoted in an HN comment) | recruiters re-offering unsuccessful candidates |

Not used as evidence: the Dataford template ("how would you architect a real-time chat interface"), PracHub's question list, the Aced and Exponent guides (the origin of the "no LeetCode" and "no behavioural round" framing), techinterview.org, designgurus, calibrd. X (the social app): no post-2025 frontend report exists; one 2025 Glassdoor snippet (phone screen, two coding rounds, system design, hiring-manager round) and two pre-interview Blind posts; no X loop is proposed.

## Cross-company notes

- **Glassdoor is the largest pool for all three and we only see snippets.** Agoda has eight snippet reviews, JPMorgan nine pages, xAI two unreadable reviews. A signed-in read would upgrade most S and U items.
- **Templates rank first for every query.** Dataford holds five JPMorgan slugs and one each for Agoda and xAI; Prepfully holds six Agoda pages. None of their prompts appears in a first-person report.
- **Themes that recur, for a later catalog mapping:**
  - a React component built against an API: the Pokémon list and cards at JPMorgan (snippets, not yet located), "display a list of elements" at Agoda (AG4), "Write a small app in React" at xAI (postings);
  - hooks and lifecycle questions everywhere (`useCallback` versus `useMemo`, `useState` versus `useRef`, `useContext`, `useRef`);
  - utility functions: a debounce (Agoda A2), memoization (JPMorgan J12, Agoda AG1), a `reduce` polyfill (J12), a pipeline with an async limit (Agoda A4), a generic async promise hook (J1);
  - frontend architecture of a search or booking page (Agoda A1, A2, A4), which no JPMorgan or xAI report has;
  - an HTML/CSS build from a screenshot (xAI postings), which neither JPMorgan nor Agoda reports;
  - web security questions (XSS and CSRF at Agoda A1, XSS and secure lifecycle at JPMorgan J12).
- **Readiness for a sourced company page:**
  - Agoda has the most primary material: two full-text 2025 to 2026 loops with every question, an official four-round description and an interviewer's guide.
  - JPMorgan has the most demand and hiring, but the loop is team-run and most reports are short; the page must lead with the recurring questions, not a fixed format.
  - xAI rests on its own postings plus one London account; the company is now SpaceXAI, and the frontend postings with a loop are all closed.

## Verification (2026-10-21)

The coordinating session checked these items against their sources after the agents reported:
- xAI X1 (Taro London): "Standard 15-minute phone interview, followed by a 1-hour pair coding session", "chat interface in React", `useCallback`. X2: "What is useRef and how is it used?". X7 (Aced MTS L3): "Pick one of the six prompts and build a demoable product in 4 hours", GitHub and Loom. X-O8 (Built In London): the four stages verbatim. X-O4 and X-O6 were read earlier the same day. One agent-listed question ("Why do you want to join an AI-first company?") is not on the Aced page and was dropped.
- Agoda A3 (Medium through RSS): the seven-step email list with durations, "also conducted through HackerRank", "your manager is the one who gives you the offer directly". A4 (LeetCode through GraphQL): "This is a JavaScript coding round! Not a react machine coding round, nor a system design round", the pipeline function with an async limit, "create a doctor appointment booking application". A7 (Blind): "8 HTML/CSS questions and 2 JavaScript coding problems", "without a managerial round", "Recruiters and interviewers were from bangkok!". A12 (frontendgeek): the molecular-weight stack problem, "180000 Thai bhat it is base pay". AO1 and AO6 in the agent's archive captures ("Hacker Rank online test", "final decision within 2 weeks", "Rspack and Vite", "Play the role of a lint tool").
- JPMorgan J12 (frontendgeek): the three rounds, "write a generic memoization function", "polyfill for the reduce function", "Congratulations!" on day 10. J15 (Blind): "explain closure, diff between shallow clone and deep clone, Object.assign usecase, difference between useCallback and useMemo", "zero consistency". J-O1: "The interview process will differ for each position", "several people in multiple rounds". J1, J2, J3, J4, J8 and J13 were read in full during the selection round earlier the same day.

Every quoted phrase was found on its page. Misattributions caught during the round: the Agoda Code360 round 2 is DSA plus a JavaScript debounce, not two DSA problems; the JPMorgan "four stages ending with a managing director" belongs to the 2021 London offer report, not the 2017 one.

## Open items

- **Glassdoor:** the four JPMorgan 2025 snippets from the selection round (Pokémon list and cards, garbage collection, "remove the stars"), three Agoda reports (Bangalore 2025-11 and 2026-03, Bangkok 2024-10) and the two xAI reviews (hooks and a 10,000-user design; `useRef`) could not be re-surfaced or read. They stay U until a signed-in read.
- **Locked threads:** 1point3acres holds two xAI Bay Area frontend onsites (1125096, 1102668) behind a login; Prepfully and Dataford pages are gated or rate-limited.
- **Unread Medium posts:** a JPMorgan React second-round list (`@ajit34555`), a career-drill "Software Engineer-II @JP Morgan" post, Agoda posts by freezefrancis and asiriofficial, the rest of the member-only Frontend Army Agoda post.
- **Taro coverage is partial:** Taro has no browsable index; JPMorgan and Agoda frontend entries were found by search and the "Related" links, so more may exist.
- **xAI naming:** whether the page says xAI, SpaceXSI or SpaceXAI; the board slug and search demand are still "xai".
- **Done the same day after approval:** the catalog mapping below, the three authored previews (`jpmorgan-preview-content.ts`, `agoda-preview-content.ts`, `xai-preview-content.ts`) and the process tables recorded in `docs/references/jpmorgan-agoda-xai-interview-processes-2026-10.md`. No new catalog items were written. Still open: a Search Console readout four to six weeks after deploy, and the Glassdoor items above if a signed-in read becomes possible.

## Catalog mapping (2026-10-21)

Approved the same day: the three pages open as content-only authored guides, with no new catalog items, following the ElevenLabs step. Items pinned by the backend coding interview registry (`js-debounce`, `js-concurrency-map-limit`, `js-create-lru-cache`, `react-todo-list`, `react-pagination-table`) are linked from the guides but not tagged, so the coding registry needs no re-pin. Trivia entries carry tags only (sources are stripped on trivia pages). Every source below was read in full; Glassdoor, 1point3acres and templates are never cited on a page.

| Company | Item | Kind | Source on the item |
|---|---|---|---|
| JPMorgan Chase | `js-memoize-function` (Premium) | coding | J12 frontendgeek, SDE2 Bengaluru 2024-04: "write a generic memoization function" |
| JPMorgan Chase | `js-array-prototype-reduce` (Premium) | coding | J12: "write a polyfill for the reduce function" |
| JPMorgan Chase | `react-fetch-list-states` (free) | coding | J1 Aced, UK Senior/L5 2026: the generic async promise React hook with `useEffect` cleanup |
| JPMorgan Chase | `js-closures`, `js-event-loop`, `js-cookie-sessionstorage-localstorage`, `js-xss-dom-sinks`, `react-usememo-vs-usecallback`, `react-useref-vs-usestate`, `react-higher-order-components` | trivia | tags only (J3, J6, J8, J11, J12, J13, J15) |
| Agoda | `react-fetch-list-states` (free) | coding | A2 Code360, Gurgaon 2025-05: the React and TypeScript stock dashboard take-home |
| Agoda | `car-rental-booking-frontend` (Premium) | system design | A2: the travel booking frontend architecture round; `editorial.companyEvidence` added |
| Agoda | `realtime-search-debounce-cache` (Premium) | system design | A1 LeetCode, Bangkok 2026-07: the hotel search page architecture round; `editorial.companyEvidence` added |
| Agoda | `js-closures`, `js-cookie-sessionstorage-localstorage`, `js-xss-dom-sinks`, `http-caching-basics`, `js-testing-edge-cases-strategy`, `react-ssr-hydration`, `react-state-management-redux` | trivia | tags only (A1, A7, A12) |
| xAI | `react-chat-streaming-ui` (Premium) | coding | X1 Taro, London 2025-08: the one-hour pair-coding chat interface |
| xAI | `react-fetch-list-states` (free) | coding | X-O5 posting: "Coding interview in TypeScript: Write a small app in React" (closed posting, labelled as such) |
| xAI | `css-grid-card-gallery`, `css-flexbox-navbar` (free) | coding | X-O8 posting: the 45-minute HTML/CSS/Tailwind interview and the screenshot-to-UI round |
| xAI | `ai-chat-textarea-design` (free) | system design | X1: the chat interface extended to Send, Stop and stale stream events; `editorial.companyEvidence` added |
| xAI | `react-usememo-vs-usecallback`, `react-useref-vs-usestate`, `ai-streaming-data-handling`, `chat-conversation-state-management` | trivia | tags only (X1, X2) |

`react-fetch-list-states` now carries six sources (Revolut, Tesla, JPMorgan Chase, Agoda, xAI), the lint's maximum. The backend system-design registry was re-pinned for `realtime-search-debounce-cache` (int-sd-autocomplete-race-mid-v1) and `ai-chat-textarea-design` (int-sd-ai-chat-composer-mid-v1) with a 2026-10-21 maintenance review note, following the 2026-10-14 and 2026-10-17 precedents; not a new release approval.

Gaps left without new items: JPMorgan's generic async promise hook (no custom-hook item; the fetch starter rehearses its contract), Agoda's Core Web Vitals questions and debounce task (the debounce item is pinned, so it is linked only), xAI's four-hour take-home (reported for general software-engineer roles only).
