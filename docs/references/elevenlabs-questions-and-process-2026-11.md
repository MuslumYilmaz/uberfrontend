# ElevenLabs: reported interview questions and interview process (second pass)

> Working record started on 2026-11-03. It extends the first ElevenLabs research of 2026-10-20 (EL1 to EL5, `docs/references/company-interview-processes-2026-10.md`, section "ElevenLabs"). It lists every interview question and task that public reports attribute to ElevenLabs, with a source and access status for each, and says which of them the live guide already uses.
>
> Companion documents:
> - `docs/references/disney-questions-and-process-2026-11.md` and `docs/references/cloudflare-questions-and-process-2026-11.md` use the same format.
> - `frontend/src/app/shared/company-previews/elevenlabs-preview-content.ts` is the live guide.
>
> The user asked on 2026-11-03 for a deeper search for more questions, written to an md only; at that point no page, catalog tag, process table or plan entry had been changed. The improvement plan of 2026-11-21 and 2026-11-22 has since changed all four (see Status).
>
> Re-checked on 2026-11-21 (step 0 of the improvement plan): raw saves are now kept under `research_notes/elevenlabs-2026-11/raw/`, one new account (EC-15) and one new posting (EP-18) were added, and the live page's rows are mapped in Status. Taro answered HTTP 429 to curl, so its pages were read in the user's own Chrome (see Verification).

## Where the page stood before this pass

- **Accounts in the process table (5):**
  - EL1: Aced, senior, frontend-leaning, 2026.
  - EL2: Aced, frontend-leaning, 2025-11.
  - EL3 to EL5: Taro, full-stack, 2024 and 2025.
- **Questions the guide uses (four reported, one of our own):**
  - synchronise audio playback with transcript highlighting;
  - design a review interface for a voice-dubbing project;
  - fix a practical React problem live;
  - clear a 90-minute technical assessment;
  - stream generated audio to the screen (not modelled on a report).
- **Catalog:** four items carry ElevenLabs sources: `js-timer-manager`, `js-poll-until`, `js-debug-async-race` and `react-autocomplete-search-starter`. `ai-ux-considerations` has an ElevenLabs content tag.
- **Process table and plan:** one variant (`Full-stack engineers, frontend-leaning`). The directory signature is `90-minute assessment`.

## What this pass adds

- **Sources:**
  - all 39 ElevenLabs pages on Taro (the first pass used 3);
  - four first-person accounts outside Taro that the first pass did not have (EC-3, EC-4, EC-5 on Aced; EC-6 on PracHub);
  - the Aced question bank in full (19 items);
  - two candidate repositories that name an ElevenLabs frontend assessment or coding assessment (G);
  - official text the first pass did not have: the application forms' questions, the candidate privacy and AI notice, a 2025 post on the AI recruiter agents, and today's 148 postings (EO-1 to EO-14, EP-1 to EP-17).
- **Questions.** About 40 distinct reported questions (see the Count under The question list), against the four reported questions the guide uses. Eight are frontend or product tasks, four of them new. Six official application-form questions come on top.
- **Process facts:**
  - The 90-minute assessment is the usual first step for engineers in 2025 and 2026, often on CoderPad and mixing React and algorithm questions.
  - A live React round has been the same task since 2024: wire a component to a fake ElevenLabs service from its type declarations.
  - Final conversations are with the CTO or a co-founder.
  - AI rules appear in several reports (see Verdict).

## Research rules

- **Access codes.**
  - F: read in full.
  - S: verbatim in a search snippet.
  - U: unreadable.
  - P: a prep site's question bank, guide or question page. Aced bank items marked "I was asked this" are counted as P, not as accounts.
  - T: read in full, but on a prep site's own page. Used as corroboration only.
  - G: a candidate's public GitHub repository, read through the GitHub API. Repositories are individuals' accounts, so their URLs stay in the git-excluded notes.
  - (c): a commenter's own account.
- **Quotes.**
  - Every quote comes from a saved page.
  - Taro pages were read from their public URLs with curl; no Taro API was called.
  - Aced, PracHub and Blind pages were read through WebFetch. WebFetch returned sentence-level quotations for longer pages, and marked some lines as paraphrase. This record quotes only the returned sentences and never a line marked as paraphrase.
- **Aced** is the former Exponent (its footer says "Aced (formerly Exponent)"). Its experience pages are self-reported and show relative dates; the dates given here are the interview months the pages showed on 2026-11-03.
- **Aced access, 2026-11-21.** Experience pages now show visitors only the first stage (`hasAccess: false` in the page data); later stages need an Aced account.
  - The full texts of EL2, EC-3 and EC-5 are still public, because the bank's question pages embed them (items 7, 10, 12, 13, 15).
  - EL1's assessment and technical lines and EC-4's assessment and technical lines are no longer public. They are marked in their rows.
- **Not cited.** Glassdoor, 1point3acres (HTTP 403 for our tools), LeetCode (closed to this session), interviewquery, Prepfully, Dataford and other templated pages. Reddit was not attempted. PracHub's and TechPrep's guide pages are P.
- **Taro.**
  - Taro interview pages are Glassdoor reviews re-hosted with rewritten text; each report is counted once.
  - Placeholder timestamps (the 1st of a month at 00:00, 07:00 or 08:00 UTC; 14 of 39 pages) are marked `*`.
  - Several 2026 pages carry no location.
- **Another Eleven Labs.** A 2023 repository titled "Eleven-labs Interview test - CRUD Application" may belong to a different company with a similar name. Nothing in it ties it to the AI company, so it is excluded.
- **Scope.**
  - Every engineering role at ElevenLabs. The company runs one assessment-first loop across engineering, and the first pass found no frontend-only loop.
  - Each question is labelled with the role that reported it, so frontend and full-stack evidence stays separate from backend, forward deployed and growth roles.

## Method

1. **Taro, full sweep.** All 39 ElevenLabs pages in Taro's public sitemap index were fetched once, all HTTP 200. Each account's fields were saved, and every account was read.
2. **Community sources.** A research reader used WebSearch (33 calls) and WebFetch (about 50 calls).
   - Aced: the bank (19 items across roles; 16 under Software Engineer, 2 under Frontend Engineer) and 5 experience pages.
   - PracHub: 1 experience, the guide and question pages.
   - TechPrep: an editorial blog page; no community account.
   - Blind: 5 threads, none naming a round.
   - Hacker News: 6 Algolia queries, nothing relevant.
   - LeetCode: 5 searches, nothing.
   - 1point3acres: three thread titles (U).
   - Medium, dev.to, Hashnode, Substack, GeeksforGeeks, LinkedIn, X and Bluesky: no first-person account.
3. **GitHub.** 20 repository-name searches and 4 code searches. READMEs and file lists were read for 13 repositories.
4. **Postings and official pages.** A second reader covered ElevenLabs' own text.
   - **Ashby:** the public job-board API returned 148 postings with their text, and every posting was searched for process words. The application form of 17 postings was read through the endpoint the job page calls.
   - **Pages:** the careers page and FAQ, the privacy policy, the candidate privacy and AI notice (a PDF found through search; the careers page does not link it), and the blog.
   - **Frontend stack:** the `elevenlabs/ui` and `elevenlabs/packages` repositories and npm. `ui.elevenlabs.io` answered HTTP 429, so the same documentation was read from the repository.
   - Three closed frontend postings were read from third-party job boards (EPC-1 to EPC-3).
   - 9 WebSearch calls.
5. **Catalog.** 475 items in `cdn/questions`, no edits. Pins were read from the backend authoring registries (68 ids).
6. **Verification.** Every quotation in this file was checked by script against the saved pages (see Verification).

## Verdict

- **The loop is the same across engineering roles, and it starts with a timed assessment.**
  - Official: "Steps vary by role, but most processes include a pre-screen, virtual interviews (sometimes with a skills assessment like a take-home or case study), a hiring manager conversation, and a final round with a founder or Bar Raiser." (EO-1, unchanged since 2026-10-20).
  - Reports from 2024 to 2026: a 90-minute assessment, often on CoderPad and often before the recruiter call (EL1, EL6, EL7, EL8, EC-3). Then a recruiter screen, a live technical round, a product or system design round, and a final conversation with the CTO or a co-founder (EL5, EL10, EL18, EL19, EL20).
  - A 2026 recruiter email quoted by a candidate: "The first step is a **Python based technical assessment** via CoderPad." and "this **90-minute challenge**" (G, forward deployed role).
- **Frontend-leaning candidates get React inside the assessment, then a practical React round.**
  - Assessment mixes: "2 front end questions and 2 leetcode questions" (EL7, 2026), "4 React/JavaScript/algorithm tasks (1.5 hr)" (EL6, 2026), "React + leetcode medium difficulty questions" (EL1, 2026), "Fix React bug" and "Finish React component implementation" (EL3, 2024).
  - The live round recurs as one task from 2024 to 2026: wire a React component to a fake ElevenLabs service known only by its types, without running code (EL3, EL9, EL8). EL8: "You're also given a fake ElevenLabs service which exposes a couple of methods via fake types, and nothing more."
  - The audio-transcript task (EL2, bank 8) is the other named live task. ElevenLabs ships the same idea as a product component: a transcript viewer "with word-by-word highlighting synced to audio playback." (EO-8).
  - A 2026 frontend assessment take-home built a product landing page from a design, with media and motion, and asked for notes on AI use and time (G).
- **Product thinking is tested in its own round.**
  - Redesign an Excel-tracked dubbing workflow as an interface (EC-3; bank 10, three interviews).
  - Plan a transcription studio's features and roadmap (EL2; bank 13).
  - A product round in a sketching app (EL10).
  - Adapt a product for a key account (EL20, growth).
  - EL1's tip: "Practice live coding questions that are more practical rather than leetcode style as well as sense of product/product thinking."
- **Company-wide practical coding has its own recurring tasks.**
  - Folder permissions with inheritance, overrides and timestamps appear in five accounts from 2024 to 2026 and the bank (Q16).
  - The dubbing re-review status (Q17), duplicate files (Q18) and merging sorted lists (Q19).
- **AI.**
  - Official: ElevenLabs encourages candidates to use AI to prepare ("we encourage candidates to use it to empower your preparation", EO-5).
  - AI recruiter agents answer common questions before the first recruiter call (EO-5, EO-6).
  - The candidate notice says applications may be assessed by AI (EO-4).
  - No official rule on AI during assessments or interviews was found.
  - Reports and the recruiter email rule AI out of the coding itself: "complete the problems yourself without using AI coding tools." (G, 2026-10); "they said not to use LLMs" (EL2).
  - One 2026 assessment ended with an AI asking about the candidate's last answer (EC-6, paraphrase). One candidate says "they have an AI note taker in every interview" (EL26).
  - The 2026 frontend take-home asked candidates to state their AI use (G).
- **Official application questions.** The application forms ask, depending on the posting: "Why ElevenLabs, and why now?", "What's the most impactful thing you've built? What was your specific contribution?", "How did you know it worked? What did success actually look like?" and "Have you used ElevenLabs - even in a personal or side project? What did you build or explore?". Other forms ask "What makes you excited about the ElevenLabs mission?" and "Finally, tell us about a hard problem in your past!" (EO-2). The same themes return in the recruiter calls (Section F).
- **Hiring today.**
  - One open posting leans frontend: "Full-Stack Engineer (Frontend Leaning) - Studio" (EP-1, published 2026-11-03), for "a video editor people want to live in".
  - Nine more full-stack postings lean backend or name no leaning.
  - Closed 2026 postings ask frontend and design engineers for "Next.js, React, and likely design libraries like Shadcn, Framer Motion or D3" (EPC-1).
- **Readiness.** The guide's evidence goes from five accounts and four questions to 38 accounts that name a question or stage (EL1 to EL34, EC-3 to EC-6) and about 40 questions. The new frontend evidence is strong enough to add two prompts (Q2 and Q10) and to name the assessment's React content. The company-wide coding tasks (Q16, Q17) are useful page copy, labelled as non-frontend.

## Sources

Taro URLs share the prefix `https://www.jointaro.com/interviews/companies/elevenlabs/experiences/`; the tables give the slug after it. EL1 to EL5 keep the ids of the first pass.

### Accounts with frontend or full-stack content

| id | source | date | role, location | access | content |
|---|---|---|---|---|---|
| EL1 = EC-1 | Aced, https://www.aced.io/experiences/eleven-labs-senior-frontend-engineer-interview-925c04 | interview Jul 2026 (listing) | "Full-Stack Frontend (leaning) · L5 – ElevenLabs", United Kingdom, remote; in progress | F (sentences) | "They send you a technical assessment to do that takes 90mins."; "Then a recruiter screen to share more about your background and what interests you about elevenlabs."; "Then a technical round that includes live coding collaborating with the interviewer to fix a practical problem."; assessment: "React + leetcode medium difficulty questions. Overall 4 questions to be answered in 90mins."; technical: "Livecoding to real life problem."; tip: "Practice live coding questions that are more practical rather than leetcode style as well as sense of product/product thinking." (the assessment, technical and tip lines are behind Aced's account wall since 2026-11-21; the listing title now reads `Full-Stack Frontend Leaning`) |
| EL2 = EC-2 | Aced, https://www.aced.io/experiences/eleven-labs-frontend-engineer-interview-c79e72 | interview Nov 2025 (listing) | full-stack, "a front-end leaning generalist engineering role", United States; rejected | F (sentences) | a recruiter screen, a LeetCode-style Python round ("they said not to use LLMs"), then the React round: "They gave me a small React codebase and had me run the app, click around, figure out what was broken,"; "and implement the missing functionality."; "The app was an audio player with a transcript,"; "and they wanted the piece of text currently being read by the audio to highlight in yellow."; "It wasn't a one-line bug."; "The core functionality basically wasn't implemented, so I had to reason through how to build the logic,"; "including using a timer."; "I worked in a small JavaScript/React file, maybe around 150 lines."; the final decomposition round is Aced bank item 13, with follow-ups "Do you want to talk about the task list view?", "Do you maybe want to talk about the transcription view?", "What do you think about authentication?" and "What do you think about roles?" |
| EL3 | full-stack-engineer-united-states-august-1-2024-no-offer-positive-675ce47d/ | 2024-08* | Full Stack Engineer, United States | F | "React and LeetCode problems on CoderPad.io."; first round "Fix React bug", "Finish React component implementation", "Solve Valid Sudoku LeetCode problem", "Solve one other LeetCode problem"; second round "Implement hypothetical text-to-speech AI React component with an engineer"; "Interview with the Head of Organization (did not get that far)." |
| EL4 | full-stack-engineer-poland-august-1-2024-accepted-offer-positive-766f1de3/ | 2024-08*, accepted offer | Full Stack Engineer, Poland | F | "Async LeetCode easy/medium question and some React knowledge check."; "Coding interview with an interesting real-life problem and changing constraints."; "System Design interview." |
| EL5 | full-stack-engineer-united-kingdom-may-1-2025-accepted-offer-positive-8ac03948/ | 2025-05*, accepted offer | Full Stack Engineer, United Kingdom | F | "A take-home technical exercise", "A technical interview", "A product interview", "A call with the CTO"; "Some fairly typical TypeScript and React problem-solving exercises."; "The time from the initial call to the offer was one month." |
| EL6 | full-stack-engineer-october-27-2026-no-offer-negative-c63c5ddb/ | 2026-10-28 | Full Stack Engineer | F | "First, a LeetCode alternative with 4 React/JavaScript/algorithm tasks (1.5 hr). The last task is the most difficult."; "Second, a call with HR about my background and questions related to the role." |
| EL7 | senior-software-engineer-july-7-2026-no-offer-positive-dcb455b0/ | 2026-07-08 | Senior Software Engineer | F | "Was given an online assessment that had 2 front end questions and 2 leetcode questions."; "After that they scheduled a recruiter round to talk about past experience and interest in ElevenLabs."; question "What are you interested in ElevenLabs?" |
| EL8 | senior-software-engineer-new-york-new-york-january-24-2026-no-offer-neutral-ae62f4d3/ | 2026-01-25 | Senior Software Engineer, New York | F | "First round was a technical screener - some basic react and JS algorithm questions."; "Second round was the recruiter screening. The entire call was fully dedicated to my questions"; "Third round was the technical assessment - 1 hour call with a senior engineer"; about 15 minutes on background and motivation, then a live React coding challenge the candidate calls fully practical, in quotation marks; "You're given the skeleton of a React component which renders another component which you're told to assume just works."; "You're also given a fake ElevenLabs service which exposes a couple of methods via fake types, and nothing more."; "You're not producing or running any actual working React code"; questions "What excites you about ElevenLabs?" and "Talk about a project or feature you worked on that you're really proud of." |
| EL9 | senior-software-engineer-germany-january-1-2025-no-offer-negative-e52ed2a9/ | 2025-01* | Senior Software Engineer, Germany | F | "One interview with a recruiter.", "An online assessment.", "An interview with a team member, which involved creating a small React app interacting with a voice SDK (this was completed easily)."; question "Implement a small React app requesting voice API." |
| EL10 | full-stack-engineer-netherlands-november-4-2024-accepted-offer-positive-1e936674/ | 2024-11-04, accepted offer | Full Stack Engineer, Netherlands | F | "One async on Coderpad", "One live coding with an interviewer", "One product-oriented in a sketching app"; "Afterwards, I got to meet the person leading the team I'd be joining and one of the co-founders."; "Small coding tasks on Coderpad"; "One larger task live with an interviewer" |
| EL11 | fullstack-engineer-june-15-2026-accepted-offer-positive-378d0525/ | 2026-06-16, accepted offer | Fullstack Engineer | F | "A take-home assessment, followed by multiple rounds of fairly challenging interviews."; "The recruiter checked in before and after every call and provided materials on how to prepare for each interview."; "LeetCode-style take-home assessment, then fairly standard SWE interviews." |
| EL12 | fullstack-software-engineer-september-7-2026-no-offer-negative-09a41a00/ | 2026-09-08 | Fullstack Software Engineer | F | "I had several technical questions, a system design interview, followed by a manager calibration interview and team fit interviews."; "they could not find a team fit"; question "Are you ready to work up to 10 hrs per day and during weekends?" |
| EL13 | full-stack-engineer-finland-august-12-2024-accepted-offer-positive-3d462e8c/ | 2024-08-12, accepted offer | Full Stack Engineer, Finland | F | "One online technical assessment", "Three online interviews with various people from the company"; "Typical LeetCode-type questions, as well as some product/system design questions." |
| EL14 | full-stack-software-engineer-london-england-may-29-2026-no-offer-neutral-e6e7dc8d/ | 2026-05-30 | Full Stack Software Engineer, London | F | "30 min call with a recruiter then a 1h technical interview with an engineer."; "The first tech interview involved writing code in a Google Doc and reasoning about its time complexity."; "A variant on a LeetCode problem that had a practical application" |
| EL15 | junior-full-stack-engineer-united-states-january-1-2024-no-offer-neutral-1ff2e70f/ | 2024-01* | Junior Full Stack Engineer, United States | F | an initial interview only; question "Why did you want this job?" |

### Accounts outside Taro (company-wide engineering)

| id | source | date | role, location | access | content |
|---|---|---|---|---|---|
| EC-3 | Aced, https://www.aced.io/experiences/eleven-labs-software-engineer-interview-8e1b37 | interview May 2025 (listing; submitted 2026-04-13) | Software Engineer, full stack, United States, remote; rejected after the final round | F (sentences) | recruiter: "Can you walk me through your background and what you're looking for?"; "This was a 90-minute CoderPad with 2 LeetCode-medium-ish questions."; product behavioral: "What product experience do you have, why did you build these products, and what were the challenges?"; coding round: "Instead of tracking dubbing work in a giant spreadsheet, can you write functions that handle edits" "and propagate which lines or files need to be re-reviewed?"; "If someone changes a line, how should the review status roll up?"; "Each row was basically a line, editors could approve it or ask for tweaks,"; "and if a voice actor re-recorded something then that line had to get surfaced again for review"; "and the status had to propagate upward."; final round: "They reused the same dubbing-review workflow but made me redesign the spreadsheet process into an actual interface."; "If the current dubbing workflow lives in Excel, how would you redesign it into a real product interface" "for editors and voice actors?"; "Can you make this feel more like a video player than a document?" |
| EC-4 | Aced, https://www.aced.io/experiences/eleven-labs-software-engineer-interview-605512 | interview Jul 2026 | Software Engineer, India, remote; waiting | F (sentences) | recruiter: "Why did you leave your last role? Why eleven labs and standard questions from recruiter etc"; assessment: "It had 3 parts. Each part 1 question. First two were easy and the last one was medium to hard."; "Map, Queues and BFS traversal questions"; technical: "You have to evaluate the calculate permissions for the records from Groups for entities" (the assessment and technical lines are behind Aced's account wall since 2026-11-21) |
| EC-5 | Aced, https://www.aced.io/experiences/eleven-labs-solutions-architect-interview-ce0689 | interview Aug 2025 (listing) | Forward Deployed Engineer (the page slug says solutions architect), United Kingdom; rejected after a verbal yes | F (sentences) | a recruiter screen, a timed assessment, live coding in a Google Doc in Python, a case study and a final round with the CTO or a founder (the round list is WebFetch's summary); recruiter: "Tell me about the biggest project you're proud of, and be specific about what you built yourself." and "What exactly was your individual contribution, not just the team's?"; coding: "Given a file system with folders and files where each folder can allow or disallow users or groups, write functions to check whether a given user ID has access to a file."; "How would you handle inherited permissions from parent folders?"; "What happens when nested folders have conflicting permission changes over time?"; case study: "Imagine I'm the CTO of an airline. When planes break or schedules change, our operators reschedule everything manually and we don't like that. We want to hire you to help us. What would you do?"; final: "What exactly does a forward deployed engineer own here?" |
| EC-6 | PracHub, https://prachub.com/interview-experiences/elevenlabs-software-engineer-interview-experience-three-question-oa-with-a-surprise-2-minute-ai-follow-up | interview Sep 2026 | Software Engineer; level and location not shown | F (sentences; the problem statements are paraphrase) | title "Three-Question OA With a Surprise 2-Minute AI Follow-up"; "3 questions, increasing in difficulty I guess, with time limits of 25 minutes, 30 minutes and 45 minutes respectively."; the three problems (paraphrase, not quoted): the next larger number that shares no digit with n; merging equal-level stones and returning the fewest left; the lowest-cost shirt colours with no colour twice in a row; afterwards an AI asked, with two minutes to answer, why the author took a step in the last problem (paraphrase) |
| EC-15 | PracHub, https://prachub.com/interview-experiences/elevenlabs-software-engineer-interview-experience-live-coding-and-product-decomposition-onsite-rejected | interview Nov 2026; page "Published Nov 11, 2026" (the guide lists it as "Published 2026-10-01") | Software Engineer; level and location not shown; rejected | F (sentences; "Curated and edited by PracHub") | added 2026-11-21. "The ElevenLabs onsite is 4 rounds:" "V1: Live coding", "V2: Product decomposition", "HM", "CTO"; V1: "The V1 problem was wrapped in an AI shell."; "want_to_speak is always correct, while spoken_text may contain repeated characters, words or word phrases."; "You have to return the longest prefix of want_to_speak."; "The first part is reviewing a junior dev's code."; "He used LCS: first build a DP matrix to get the LCS length, then rebuild the LCS from right to left."; "There were two mistakes. One was that his DP matrix index goes out of range."; "The second part asks you to implement function_v2."; V2: "V2 was really open-ended." (a voice chat system for a retailer's website); feedback: "The feedback was: we felt there were gaps in AI fluency and product design skills that are critical for this role." |

### Other Taro accounts that name questions or stages (company-wide)

| id | slug | date | role, location | access | content |
|---|---|---|---|---|---|
| EL16 | software-engineer-london-england-march-9-2026-no-offer-neutral-9f916c8f/ | 2026-03-10 | Software Engineer, London | F | "In order to pass you need to have both high algorithmic skills and python sophisticated coding."; "System design was rather easy, but I overcomplicated by trying to make a better system and they really want to have something simple."; questions "Merging sorted list with dropping duplicates.", "Async DB processing." and "Design voice chat for retail product search." |
| EL17 | software-engineer-may-6-2026-no-offer-positive-eb7aa7e6/ | 2026-05-07 | Software Engineer | F | "Offline screening LeetCode problems: you have 1:30 or so to solve 2 medium problems and one medium-hard."; "Technical coding interview: live coding LeetCode-style problem." |
| EL18 | automation-engineer-january-6-2026-accepted-offer-positive-0e2247eb/ | 2026-01-07, accepted offer | Automation Engineer | F | "I did a coding exam, followed by two technical interviews (one coding, one design-based), an HR interview, and an interview with the CTO."; "In the second interview, they asked me to design a system for a real use case they have." |
| EL19 | senior-mobile-engineer-april-7-2026-accepted-offer-positive-6c4d800a/ | 2026-04-08, accepted offer | Senior Mobile Engineer | F | "A CoderPad challenge, with a medium difficulty", "An interview with someone from HR", "Another interview for system design", "A final interview with the CTO" |
| EL20 | growth-engineer-february-1-2026-accepted-offer-positive-b700cab8/ | 2026-02-02, accepted offer | Growth Engineer | F | "One was a product interview about an ElevenLabs use case"; "To finish, I had a short culture interview with the CTO."; question "How would you adapt this ElevenLabs product to be used by this kind of key account?" |
| EL21 | growth-engineer-london-england-february-3-2026-accepted-offer-positive-a94117d4/ | 2026-02-04, accepted offer | Growth Engineer, London | F | "Expect to be able to handle voice streaming since the company does voice streaming." |
| EL22 | software-engineer-spain-may-1-2024-no-offer-neutral-fec0ec2e/ | 2024-05* | Software Engineer, Spain | F | "The process began with a take-home LeetCode-style exercise featuring four questions, which were not overly difficult."; "the second part involved implementing a hierarchical permission system."; question "Why do you want to work for ElevenLabs?" |
| EL23 | backend-engineer-singapore-december-1-2024-no-offer-negative-d4322bee/ | 2024-12* | Backend Engineer, Singapore | F | "The HR interview went well, and the CoderPad session also went well."; "one LeetCode-style and one ML system design"; question "How to implement a hierarchical file permissioning system." |
| EL24 | software-engineer-united-kingdom-october-1-2025-no-offer-neutral-63ae7f05/ | 2025-10* | Software Engineer, United Kingdom | F | "Technical interview was limited to one specific scenario which was related to security."; "When new constraints were added, it wasn't clear if that included the previous ones or replaced them." |
| EL25 | software-engineer-warsaw-masovia-june-1-2025-no-offer-positive-1b096a87/ | 2025-06* | Software Engineer, Warsaw | F | "The interview process starts with a short introduction about past experience, followed by a deep dive into some of past projects."; "The next stage consists of a system design task and a coding exercise focused on algorithms and data structures." |
| EL26 | senior-software-engineer-september-14-2026-no-offer-negative-b64557f7/ | 2026-09-15 | Senior Software Engineer | F | "It's additionally weird that they have an AI note taker in every interview, but for some reason there's no feedback that can be given." |
| EL27 | solutions-architect-october-18-2026-no-offer-positive-32b53c99/ | 2026-10-19 | Solutions Architect | F | "Recruiter Screen, Take Home Assignment, Two Technical Interviews, then Hiring Manager interview."; "Apparently there is a bar raiser as well." |
| EL28 | software-engineer-london-england-november-20-2025-no-offer-positive-50679eb6/ | 2025-11-21 | Software Engineer, London | F | "They explained the process was that stage, then some OA which was a mix of programming, after that it goes to in-person interviews."; question "What's your motivation for working at ElevenLabs?" |
| EL29 | software-engineer-poland-november-1-2024-accepted-offer-positive-01db3ae8/ | 2024-11*, accepted offer | Software Engineer, Poland | F | "A very smooth process, using automated checkers initially, but talking to humans afterwards." |
| EL30 | senior-software-engineer-london-england-june-24-2026-no-offer-negative-8999a1f4/ | 2026-06-25 | Senior Software Engineer, London | F | a one-hour algorithm interview ended early; question "Standard algo and data structure." |
| EL31 | mobile-engineer-new-york-ny-september-1-2024-accepted-offer-positive-ae6f8fd7/ | 2024-09*, accepted offer | Mobile Engineer, New York | F | "The questions were creative and required algorithm knowledge." |
| EL32 | growth-engineer-london-united-kingdom-august-6-2026-no-offer-negative-e695ef67/ | 2026-08-07 | Growth Engineer, London | F | "They asked if I would be comfortable creating AI showcases, for example making AI voices for dogs, and coming up with similar ideas." |
| EL33 | grc-engineer-ranson-west-virginia-august-5-2026-no-offer-negative-694c053f/ | 2026-08-06 | GRC Engineer | F | "Something about parameterized strings in a URL and their exploitability." |
| EL34 | engineer-united-kingdom-august-16-2025-no-offer-negative-96661ac8/ | 2025-08-16 | Engineer, United Kingdom | F | a recruiter screen, then a coding task; question "What do you know about ElevenLabs?" |

The remaining Taro pages (EL35 to EL39: 2026-10 Paris, 2026-09 senior, 2026-05 software engineer, 2025-06 United Arab Emirates, 2025-05 Switzerland, 2024-10 London SEO and 2024-07 London; seven pages in all) are about communication, a cancelled process or a mismatch of interviewers, and name no question. One of them (2026-05) says "a frontend engineer interviewing for a senior backend role".

### Aced question bank (EC-bank, P)

The bank shows 19 ElevenLabs items across roles (16 under Software Engineer; the Frontend Engineer filter shows items 10 and 13). Every item is marked "I was asked this". Interview counts and role labels are the page's.

| # | question (as the bank shows it) | role labels and count | type |
|---|---|---|---|
| 7 | "Write a program that scans the file system to identify and report duplicate files," "handling real files, extensions, and file reading operations." | Forward Deployed Engineer, Software Engineer; "2 interviews"; also Anthropic | coding |
| 8 | "Design and implement logic to synchronize audio playback timing with transcript highlighting." | Forward Deployed Engineer, Software Engineer; "2 interviews" | coding |
| 10 | "You are an editor managing a voice-dubbing project currently tracked in Excel." "Design a new interface to review progress, manage feedback, and collaborate with voice actors." ("Focus on user flows and UI, not backend systems.") | Software Engineer (2), Frontend Engineer; 3 interviews | product design |
| 12 | "Given a hierarchical file system with inherited and overridden permissions," "write a function to determine whether a user has access to a file at a specific time." ("historical permission states matter because each change has a timestamp.") | Software Engineer, Forward Deployed Engineer, Solutions Architect; "4 interviews" | coding |
| 13 | "Imagine you're an engineer working on our audio transcription studio for teams dubbing content from one language" "into another. Walk us through feature ideas, how you'd prioritize them, and how you'd turn that into a roadmap." | Frontend Engineer; 1 interview (EL2's final round) | product design |
| 14 | "Design and implement a system to manage a voice-dubbing workflow, replacing an Excel-based process." "Given operations for editing, reviewing, and approving voice lines, correctly track status changes," "re-reviews, and collaboration state." | Software Engineer; "1 interview" | coding |
| 15 | "Imagine you are the CTO of an airline. Flights sometimes need rescheduling due to delays or breakdowns." "Currently, this is done manually. How would you automate it?" | Software Engineer (2), Solutions Architect; 3 interviews | system design |
| 16 | "Design a product for collaborative audio transcription and dubbing tool?" | Product Manager; 1 interview | product design |
| 2, 5 | "Reverse a linked list."; "Find the longest substring without repeating characters." | shared with many companies | coding |
| 1, 3, 4, 9, 11, 17, 18, 19 | "Tell me about something you built end-to-end without relying on others."; "What is the project you are most proud of?"; "Have you worked with AI or generative AI products before?"; "Tell me about the most complex project you have led."; "Tell me about the accomplishment you are most proud of."; "Tell me about a project you worked on."; "What are you most proud of in your career?"; "Why do you want to work at ElevenLabs?" | mostly shared with other companies | behavioral |
| 6 | "Monthly Post Success Analysis." | all-roles list only; shared with LinkedIn | not opened |

### Candidate repositories (G)

- **A frontend assessment (2026-08).**
  - A repository titled "ElevenLabs Frontend Assessment" (created 2026-08-21, Next.js, TypeScript, Tailwind).
  - It builds a product landing page from a design: feature, stat and use-case cards, a logo scroller, an FAQ, a video in a modal with a mute control, numbers that count up, and sections that animate in as they enter the viewport.
  - The README has sections on the work left undone, "Deliberate Deviations from Design", "AI Usage" and "Time Spent", with "**~8 hours total**". On AI it says "AI-generated or AI-assisted code accounts for roughly **~20%** of the codebase."
  - The brief itself is not in the repository.
- **A coding assessment for a forward deployed engineer (2026-10).**
  - A candidate's preparation repository quotes the recruiter's email of 2026-10-20: "The first step is a **Python based technical assessment** via CoderPad.", "The assessment consists of LeetCode-style coding problems with binary scoring." and "You’re welcome to use Google or Stack Overflow to check things like syntax or documentation, but we ask that you complete the problems yourself without using AI coding tools."
  - The email also says "Don't worry - you won't need expert-level Python knowledge to complete this **90-minute challenge**." and "**The link expires after 30 days.**"
- **Other take-homes for non-frontend roles (2026).**
  - "ElevenLabs‘ Assignment" (a mock order and shipping backend for a support agent) and a second NovaMart repository.
  - A voice grocery assistant on ElevenLabs Agents.
  - "Built as a take-home exercise for the ElevenLabs design team.": a Figma plugin with a React panel that translates text layers.
  - These suggest role-specific take-homes for forward deployed and design roles. They are not frontend interview evidence.
- 13 repositories were read; three others are interview-coach apps, a hackathon entry and a site clone, and are not used.

### Prep-site pages (P, not accounts)

| id | page | what it adds |
|---|---|---|
| EC-7 | PracHub guide, https://prachub.com/interview-guide/elevenlabs-software-engineer-interview-questions-guide-2026 | "1 candidate reports"; editorial prompts that echo EC-3: "Implement an event-driven status propagation engine that tracks dubbing line updates across nested audio files" |
| EC-8 | TechPrep blog, https://www.techprep.app/blog/elevenlabs-interview-process | editorial: "fixing a React-based audio transcription tool where text highlighting falls out of sync with audio playback"; "one of ElevenLabs' own conversational AI agents (Becky or Oscar)" before the recruiter call |
| EC-9 | Substack, https://aiengineeringinsider.substack.com/p/ai-engineering-interviews-in-europe | a forward deployed engineer prompt tagged as reported: "Design a permission system where workspaces, folders and resources form a tree, with inherited and overridden permissions." |
| EC-13 | Aced guide, https://www.aced.io/guides/elevenlabs-software-engineer-interview | editorial: "a timed CoderPad assessment you complete on your own."; "roughly 90 minutes for two to three medium-difficulty questions." |
| EC-14 | PracHub question page | a product manager prompt: "Design a collaborative tool that lets a team transcribe audio and produce dubbed versions of it." |

### Unreadable (U)

- EC-10, EC-11: two 1point3acres online-assessment threads (titles "11实验室OA|ElevenLabs面经" and "十一实验室OA|elevenlabs面经"). A search summary, not page text, mentions a CoderPad assessment of three questions in 1.5 hours.
- EC-12: the 1point3acres ElevenLabs company page.
- Blind: five ElevenLabs threads were read and name no round. The company interview channel answered HTTP 404.

### Postings (Ashby, open on 2026-11-03)

The board lists 148 postings: 47 in Engineering & Product. One title leans frontend and ten say full-stack. No posting describes the interview process. All but one carry the line "AI first: We use AI to move faster with higher-quality results."

On 2026-11-21 the board lists 122 postings, 49 in Engineering & Product, with eleven full-stack titles. EP-1 is still open. The one new frontend-relevant posting is EP-18.

| id | posting | content |
|---|---|---|
| EP-1 | "Full-Stack Engineer (Frontend Leaning) - Studio", published 2026-11-03; remote (US, Poland, UK, Bulgaria) | "You’re a product-minded, frontend-leaning full-stack engineer. Deep backend skills aren’t required."; "Strong frontend engineer who has built complex, interactive UIs."; "You’ll build the tools that make Studio a video editor people want to live in."; no framework named |
| EP-2 | "Full-Stack Engineer", Agents - Core, published 2024-09-06 and still listed | "Experience with Web Development using Typescript/React"; "We do not require any formal experience, certifications, or degrees." |
| EP-3 | "Full-Stack Engineer - Ads Engine", published 2026-11-02 | "Strong full-stack product engineer (frontend- or backend-leaning is fine) who can build a pipeline, an agent tool and the UI" |
| EP-6 to EP-10 | five backend-leaning full-stack postings, 2026-10 and 2026-11 | EP-6 asks for "Evidence of independent, end-to-end ownership and confidence working across the stack, including frontend delivery when needed." |
| EP-16 | "Growth PM", 2026-08 | a bonus: "Working front-end web development skills (HTML, CSS, JavaScript, React) to build test variants without waiting on engineering" |
| EP-18 | "Website Growth Engineer", London, published 2026-11-09 (added 2026-11-21) | "Strong experience building production web applications using React, TypeScript, and modern web technologies" |
| EPC-1 | "Frontend Leaning Engineer - Creative & Studio", posted 2026-09-09, closed (read on Built In) | "Frontend Engineer experience with an eye for design, and are proficient in Next.js, React, and likely design libraries like Shadcn, Framer Motion or D3." |
| EPC-2 | "Design Engineer", posted 2026-03-28, closed (read on Built In) | "You’re a strong frontend engineer with an eye for design, and are proficient in Next.js, React, and likely design libraries like Framer Motion or D3." |
| EPC-3 | "Software Engineer (SEO)", closed (read on Working Nomads) | "Our technology stack is Next.js (React, Typescript) with a Python backend (FastAPI)." |

### Official pages

| id | URL | date | access | content |
|---|---|---|---|---|
| EO-1 | https://elevenlabs.io/careers | undated (read 2026-11-03) | F | the interview FAQ quoted in the Verdict; "Your recruiting partner will walk you through what to expect for your specific process."; "We have a hybrid setup, with main offices in London, New York, San Francisco, and Warsaw, as well as satellite offices around the world." |
| EO-2 | the Ashby job pages and their application forms | undated | F | the form questions quoted in the Verdict; after applying: "Thank you for applying to ElevenLabs! We'll be in touch via email shortly." |
| EO-3 | https://elevenlabs.io/privacy-policy | "Updated 9 October 2026" | F | no section on job applicants |
| EO-4 | https://elevenlabs.io/assets/pdf/candidate-privacy-notice.pdf ("Applicant and Candidate Privacy Notice and Artificial Intelligence (AI) Notice") | undated | F | the notice says applicants' data may be involved in "automated decision making and/ or assessment by AI in support of these processes"; "Video interviews. The interview process may use a video recording technology to capture your interview session for the purpose of assessing your qualifications for the position to which you have applied and/or suitability for future hiring opportunities."; "We do not make recruiting or hiring decisions based solely on automated decision-making or profiling (as those terms are defined under applicable local laws)." |
| EO-5 | https://elevenlabs.io/blog/agents-and-candidate-experience | 2025-08-21 | F | "In the first half of 2025, we conducted 3,200 interviews and hired 143 new teammates across 39 countries."; "Built using ElevenLabs, these agents are now an integral part of the interview experience, answering common questions before a candidate’s first live conversation with a recruiter."; "we encourage candidates to use it to empower your preparation." |
| EO-6 | the two AI recruiter agents' public widget settings | undated | F (sentences) | "Talk to Oscar, our AI recruiter!"; "Talk to Becky, our AI recruiter!" |

Searched and NOT FOUND: an official page on trials, timelines, reapplying, scams or the Bar Raiser; any named assessment tool; any official rule on AI during assessments or interviews; a `how we hire` page.

### Stack context (not interview evidence)

| id | URL | date | content |
|---|---|---|---|
| EO-7 | https://elevenlabs.io/blog/elevenlabs-ui | 2025-10-07 | "ElevenLabs UI is a new open source library of customizable React components for building interfaces with the ElevenLabs Agents & Audio SDKs."; "Built on shadcn/ui, it provides full control over UI primitives like waveforms, orbs, messages & more." |
| EO-8 | https://github.com/elevenlabs/ui | repository updated 2026-10-16 | the transcript viewer: "A component for displaying an audio transcript with word-by-word highlighting synced to audio playback."; the waveform animates with `requestAnimationFrame` "for smooth 60fps updates"; the audio player: "The audio player uses the HTML5 audio element under the hood" |
| EO-9 | https://elevenlabs.io/blog/elevenagents-react-sdk-v1-0 | 2026-03-27 | "Any state change (status, mode, mute, volume) re-rendered every component that consumed conversation state."; "Six new hooks each subscribe to an individual slice of conversation state. Components only re-render when the data they consume changes." |
| EO-10, EO-11 | the `@elevenlabs/react` and `@elevenlabs/client` packages and the widget docs | 2026 | "React hooks and components for building multimodal agents with React/Next.js"; "Our widget is multimodal and able to process both text and audio." |
| EO-12, EO-13 | WebRTC and latency posts | 2025-07-21; 2026-06-23 | "Most audio players do not begin playback at the first byte."; "A 500 ms default buffer is common, and it is added directly to perceived latency." |
| EO-14 | the open-source fund post | 2025-12-15 | the frontend projects ElevenLabs funds include ProseMirror, TanStack Query, Tailwindcss and pixijs |

## The question list

Each row is a question or task as the sources report it, with the role that reported it. The `page` column says whether the live guide already uses it; the `catalog` column gives the nearest item (see the mapping proposal below).

### A. Frontend and React tasks

| # | question or task | round | roles, dates | sources | page | catalog |
|---|---|---|---|---|---|---|
| Q1 | In a small React audio player with a transcript, make the text currently being read highlight, building the missing logic with a timer | live React round | full-stack, frontend-leaning, 2025-11; bank: forward deployed and software engineers | EL2; bank 8; EC-8 (P) | yes (prompt 1) | no item; gap 1 |
| Q2 | Wire a React component to a fake ElevenLabs service from its type declarations, without running the code: a component that renders a child you must assume works | live React round, one hour with a senior engineer | senior, 2026-01; full-stack, 2024-08 ("hypothetical text-to-speech AI React component"); senior, 2025-01 ("small React app requesting voice API") | EL8, EL3, EL9 | no | `react-chat-streaming-ui` (nearest); gap 2 |
| Q3 | "Fix React bug" and "Finish React component implementation" | asynchronous CoderPad round | full-stack, 2024-08 | EL3 | partly (the assessment card) | `react-debug-api-misuse`; `js-debug-async-race` (already tagged) |
| Q4 | Frontend questions inside the timed assessment: "2 front end questions and 2 leetcode questions"; "4 React/JavaScript/algorithm tasks (1.5 hr)"; "React + leetcode medium difficulty questions"; "some basic react and JS algorithm questions"; "some React knowledge check" | the assessment | senior and full-stack, 2024 to 2026 | EL7, EL6, EL1, EL8, EL4 | yes (prompt 4) | `react-autocomplete-search-starter`, `js-timer-manager`, `js-poll-until` (already tagged) |
| Q5 | Fix a practical problem live with the interviewer | live round | senior, frontend-leaning, 2026 | EL1 | yes (prompt 3) | `js-debug-async-race` (already tagged) |
| Q6 | "One larger task live with an interviewer" | live round | full-stack, 2024-11 | EL10 | no | not named |
| Q7 | Build a product landing page from a design: cards, a logo scroller, an FAQ, a video in a modal with mute, counting numbers and scroll-in transitions; document the AI use and the time spent | frontend take-home (assessment) | 2026-08 | G | no | `react-accordion-faq`, `css-grid-card-gallery`, `html-dialog-confirm-a11y` (links); gap 3 |
| Q8 | "Some fairly typical TypeScript and React problem-solving exercises." | take-home | full-stack, 2025-05 | EL5 | partly (stack row) | not named |

### B. Product and design rounds

| # | question or task | round | roles, dates | sources | page | catalog |
|---|---|---|---|---|---|---|
| Q9 | Redesign an Excel-tracked voice-dubbing project as an interface to review progress, manage feedback and work with voice actors; follow-up: make it feel more like a video player than a document | product design or final round | full-stack, 2025-05; bank: software engineers (2), frontend engineer | EC-3; bank 10 | yes (prompt 2) | `ai-ux-considerations` (content tag) |
| Q10 | Feature ideas, priorities and a roadmap for an audio transcription studio used by dubbing teams; follow-ups on the task list view, the transcription view, authentication and roles | final decomposition round, one hour, verbal | frontend-leaning, 2025-11; bank: frontend engineer | EL2; bank 13 | no (the guide mentions decomposition only) | no item; product |
| Q11 | A product-oriented round in a sketching app | product round | full-stack, 2024-11 | EL10 | no | not named |
| Q12 | "Design voice chat for retail product search." EC-15 (2026-11) had a close variant in its product decomposition round: a voice chat system for a retailer's website | system design; product decomposition | software engineer, 2026-03 and 2026-11 | EL16, EC-15 | no | `ai-chat-textarea-design` (pinned, link) |
| Q13 | "How would you adapt this ElevenLabs product to be used by this kind of key account?" | product interview | growth engineer, 2026-02 | EL20 | no | product |
| Q14 | Design a system for one of ElevenLabs' real use cases | design interview | automation engineer, 2026-01 | EL18 | no | not named |
| Q15 | Product or system design questions; a system design interview; an ML system design | design rounds | full-stack, 2024; backend, 2024 | EL13, EL4, EL23 | partly (the product or design row) | not named |

### C. Practical coding (all engineering roles)

| # | question or task | round | roles, dates | sources | page | catalog |
|---|---|---|---|---|---|---|
| Q16 | Folder permissions: folders allow or deny users or groups, permissions are inherited unless overridden, and each change has a timestamp; check whether a user can access a file at a given time | live coding | bank: software, forward deployed and solutions roles, "4 interviews"; forward deployed, 2025-08; software engineers, 2024-05 and 2026-07; backend, 2024-12 | bank 12; EC-5; EL22; EC-4; EL23; EC-9 (P) | no | no item; gap 4 |
| Q17 | A dubbing workflow kept in a spreadsheet: functions that handle edits and make re-recorded lines, and the files above them, need review again | coding round | full-stack, 2025-05; bank: software engineer | EC-3; bank 14; EC-7 (P) | no | `react-nested-checkboxes` (pinned, link); gap 5 |
| Q18 | Scan a file system and report duplicate files, with real file operations | coding | bank: forward deployed and software engineers, "2 interviews" | bank 7 | no | no item |
| Q19 | "Merging sorted list with dropping duplicates." and "Async DB processing." | coding, in Python | software engineer, 2026-03 | EL16 | no | `js-merge-sorted-arrays`; `js-unique-array` (pinned) |
| Q20 | A real-life problem whose constraints change as you go; a security scenario with added constraints | coding interview | full-stack, 2024-08; software engineer, 2025-10 | EL4, EL24 | no | not named |
| Q21 | A LeetCode variant with a practical application, written in a Google Doc, with its time complexity | technical interview, one hour | full-stack, 2026-05 | EL14 | no | not named |

### D. Assessment and algorithm problems

- "Solve Valid Sudoku LeetCode problem" (EL3, 2024-08).
- The three timed problems of a 2026-09 assessment (EC-6, paraphrase only): the next larger number with no digit in common with n; merging stones of equal level; the cheapest shirt colours with no colour twice in a row.
- "Map, Queues and BFS traversal questions" (EC-4, 2026-07).
- A live coding problem in two parts (EC-15, 2026-11): the agent's spoken text repeats characters, words or phrases of the intended text, and "You have to return the longest prefix of want_to_speak." First review a junior's LCS solution with two bugs, then write a simpler version (the page's hint: the spoken text only repeats, never drops or substitutes words).
- "Reverse a linked list." and "Find the longest substring without repeating characters." (bank 2 and 5, shared with many companies).
- Formats: two LeetCode mediums in a 90-minute CoderPad (EC-3); two mediums and a medium-hard in about 1:30 (EL17); four tasks with the last the hardest (EL6); three parts from easy to medium-hard (EC-4).

### E. Case studies (forward deployed and solutions roles)

- The airline: "Imagine I'm the CTO of an airline. When planes break or schedules change, our operators reschedule everything manually and we don't like that. We want to hire you to help us. What would you do?" (EC-5, 2025-08; bank 15 lists it for software engineers too, 3 interviews). Follow-ups: "How would you understand what actually matters to us?" and "What would your proposed system actually look like?"
- The role: "What exactly does a forward deployed engineer own here?" (EC-5).

### F. Behavioral and motivation

- **Why ElevenLabs:**
  - "What excites you about ElevenLabs?" (EL8).
  - "What are you interested in ElevenLabs?" (EL7).
  - "Why do you want to work for ElevenLabs?" (EL22).
  - "What do you know about ElevenLabs?" (EL34).
  - "What's your motivation for working at ElevenLabs?" (EL28).
  - "Why do you want to work at ElevenLabs?" (bank 19).
- **Projects:**
  - "Talk about a project or feature you worked on that you're really proud of." (EL8).
  - "Tell me about the biggest project you're proud of, and be specific about what you built yourself." and "What exactly was your individual contribution, not just the team's?" (EC-5).
  - "What product experience do you have, why did you build these products, and what were the challenges?" (EC-3).
  - "Tell me about something you built end-to-end without relying on others." (bank 1).
- **AI experience:** "Have you worked with AI or generative AI products before?" (bank 4).
- **Pace:** "Are you ready to work up to 10 hrs per day and during weekends?" (EL12).
- **Growth roles:** creating AI showcases, "for example making AI voices for dogs" (EL32).

### Count

- **Frontend and product questions:** eight named tasks (Q1, Q2, Q3's two tasks, Q5, Q7, Q9, Q10). The guide uses four of them (Q1, Q4's assessment, Q5, Q9). Q2, Q3, Q7 and Q10 are new.
- **Company-wide named questions:**
  - six practical coding tasks (Q16 to Q21, counting Q19's two as one row);
  - seven assessment problems;
  - two design prompts (Q12, Q13);
  - the airline case;
  - about fifteen behavioral questions.
- **In all:** about 40 distinct questions, against the four reported questions the guide had.

## Loop by role and year

### Full-stack and frontend-leaning engineers, 2024 to 2026 (EL1 to EL14, EC-3)

1. **The assessment comes first in most accounts, often before the recruiter call** (EL1, EL6, EL7, EL8):
   - 90 minutes in 2025 and 2026 (EL1, EL6, EC-3);
   - usually on CoderPad (EL3, EL10, EC-3);
   - a mix of React and algorithm questions for frontend-leaning candidates (EL1, EL6, EL7, EL8, EL4).
2. **A recruiter screen.** In one 2026 account the call was "fully dedicated to my questions" (EL8).
3. **A live technical round with an engineer**, one of:
   - a practical React task: the fake-service wiring (EL3, EL8, EL9), the audio transcript (EL2) or fixing a practical problem (EL1);
   - a LeetCode-style or practical coding problem (EL14, EL4).
4. **A product round** (EL5, EL10, EL2's decomposition, EC-3) **or a system design round** (EL4, EL12, EL13).
5. **A final conversation** with the CTO (EL5), the head of the organisation (EL3) or a co-founder (EL10). Some loops add manager calibration and team-fit interviews (EL12).

### Other engineering roles, 2024 to 2026 (EL16 to EL34, EC-4 to EC-6)

- The same assessment-first shape, with algorithm or practical Python coding (EL16, EL17, EC-4, EC-6) and permission and workflow problems (Q16 to Q18).
- Final conversations with the CTO (EL18, EL19, EL20).
- Forward deployed and solutions candidates get a case study (EC-5) and sometimes a take-home (EL27, G). EL27 heard of "a bar raiser".

### Facts across roles

- **Duration:** "The time from the initial call to the offer was one month." (EL5); two to four weeks in several accounts.
- **Preparation help:** recruiters sent materials (EL11).
- **Feedback:** no feedback after rejection (EL26).
- **Office presence:** EC-5 lost an offer when ElevenLabs decided to hire only in San Francisco (paraphrase).

### Official frame (EO-1, EO-4, EO-5)

- The FAQ gives the steps: a pre-screen, virtual interviews that sometimes include a take-home or case study, a hiring manager conversation, and a final round with a founder or Bar Raiser. The recruiting partner explains the steps for each process.
- Before the first recruiter call, candidates can talk to AI recruiter agents built on ElevenLabs (EO-5).
- Interviews may be recorded on video, and applications may be assessed with AI support. Hiring decisions are not made by automated decision-making alone (EO-4).

## Comparison with the current ElevenLabs page

| Item | Page now | What this pass supports |
|---|---|---|
| Practice prompts | five: transcript highlight, dubbing review interface, practical React fix, 90-minute assessment, streaming playback (ours) | keep the four reported ones. Candidates for new or replacement prompts: the fake-service React wiring (Q2, three accounts 2024 to 2026), the transcription studio roadmap (Q10), the folder-permissions check (Q16, the most repeated practical coding task), the dubbing re-review status (Q17) and the landing-page take-home (Q7) |
| Process table | one variant, five accounts (EL1 to EL5) | add EL6 to EL14 and EC-3 as sources; name CoderPad and the 90-minute length in the assessment row; add the co-founder (EL10) to the final row |
| Assessment card | four formats | add the 2026 mixes (EL6, EL7) and the AI rules (see Verdict) |
| Signature | `90-minute assessment` | still right: EL1, EL6, EC-3, EL17 and the 2026 recruiter email (G) all describe it |
| Plan rounds | five rounds, one variant | the same five rounds; the notes can name the fake-service task and the folder-permissions task |
| Sources block | Aced bank, EL1 to EL5, careers page | add EL6 to EL14, EC-3 to EC-6 and the official pages below |
| FAQ | no AI answer | an AI answer can cite the recruiter email (G) and the reports (EL2, EC-6), plus any official rule found below |

## Catalog mapping proposal (not applied)

The rules are the CrowdStrike record's: tag with a source only an unpinned coding, debug or system design item that matches a task from an F report, with room under the 6-source cap. Trivia cannot carry sources.

### Tag with a source

| # | id | file | access | why it matches | source | sources now | pin |
|---|---|---|---|---|---|---|---|
| 1 | `react-chat-streaming-ui` | react/coding.json | premium | A React UI that calls an AI service and renders its response. EL8, EL3 and EL9 wire a React component to an ElevenLabs voice service. The note must say it practises wiring a component to an AI service, not the reported task | EL8 | 3 (openai, intuit, xai) | unpinned |
| 2 | `react-debug-api-misuse` | react/coding.json | premium | A broken React screen to fix. EL3's first round was "Fix React bug" on CoderPad | EL3 | 2 (walmart; the Cloudflare and Disney records also propose sources) | unpinned |
| 3 | `ai-ux-considerations` | system-design/index.json | premium | A review flow for AI output. EC-3 redesigned a dubbing review spreadsheet into an interface for editors and voice actors. The item already has an ElevenLabs content tag | EC-3 | 0 | unpinned |

If all three records' proposals are applied, `react-debug-api-misuse` reaches 5 of 6 sources.

Draft source entry for item 1 (label 8 to 120 characters, note at most 280):

```json
{
  "label": "Taro: ElevenLabs senior software engineer interview, New York, 2026",
  "url": "https://www.jointaro.com/interviews/companies/elevenlabs/experiences/senior-software-engineer-new-york-new-york-january-24-2026-no-offer-neutral-ae62f4d3/",
  "company": "elevenlabs",
  "publisher": "Taro",
  "date": "2026-01",
  "note": "A one-hour live React round: wire a component skeleton to a fake ElevenLabs service given only as types, without running the code. This exercise practises wiring a React UI to an AI service; it is not the reported task."
}
```

### Link only

- **Q1, the transcript highlight:** `live-chart-high-frequency-updates` (pinned), which the guide already links.
- **Q16, folder permissions:** `js-build-tree-from-flat-list` (free) and `js-filter-tree-render-indented` (free); both are tree walks, not access checks.
- **Q17, re-review status:** `react-nested-checkboxes` (pinned; parent and child state kept in sync).
- **Q19, merging sorted lists:** `js-merge-sorted-arrays` (premium) and `js-unique-array` (pinned). These come from a Python loop for a software engineer, so the record proposes links, not a frontend tag.
- **Q7, the landing page:** `react-accordion-faq` (premium; the FAQ), `css-grid-card-gallery` (free; the cards), `html-dialog-confirm-a11y` (premium; the video modal).
- **Q12, voice chat for search:** `ai-chat-textarea-design` (pinned) and `realtime-search-debounce-cache` (pinned).

### Gaps (reported, with no matching item)

1. **Audio playback synced with transcript highlighting** (Q1). The guide's walkthrough describes it, but no catalog item practises it. It is the most specific ElevenLabs frontend task and appears in two sources.
2. **Wiring a component to a service known only by its types**, reasoning without running code (Q2). It recurs from 2024 to 2026.
3. **A design-to-code landing page with media and motion**: count-up numbers, viewport-triggered reveals, a modal video player with mute (Q7).
4. **An access check over a permission tree** with inheritance, overrides and timestamps (Q16). It is the most repeated practical task across ElevenLabs roles, though not a frontend one.
5. **Status that rolls up a hierarchy** when a child changes, as in the dubbing re-review (Q17).

## Practice prompts for the page (proposal)

Our own practice versions; none copies a reported task. Prompts 1 and 2 could replace the fifth prompt, which is not modelled on a report.

| # | title | statement | modelled on | links to |
|---|---|---|---|---|
| 1 | Wire a React component to a voice service you cannot run | You get a component skeleton, a child component you must trust, and a voice service described only by its types. Explain and write the code that makes the child work: when to call the service, what state to keep, and how to handle a slow or failed request, without running anything. | EL8 (2026-01), EL3 (2024-08), EL9 (2025-01) | `react-chat-streaming-ui`, `js-debug-async-race` |
| 2 | Plan a transcription studio for dubbing teams | Propose features for a studio where teams transcribe audio and produce dubbed versions, rank them, and turn them into a roadmap. Be ready to go deeper on the task list, the transcript view, sign-in and team roles. | EL2 (2025-11), bank 13 | `ai-ux-considerations` |
| 3 | Check access in a folder tree that changes over time | Folders allow or deny users and groups, children inherit unless they override, and every change has a time. Write the function that answers whether a user could open a file at a given moment, and explain how you store the history. | bank 12; EC-5 (2025-08); EL22 (2024-05); EL23 (2024-12); EC-4 (2026-07) | `js-build-tree-from-flat-list`, `js-filter-tree-render-indented` |
| 4 | Track which dubbed lines need review again | Each line can be approved or sent back, and a re-recorded line must be reviewed again. Write the functions that apply edits and update the review status of the line and the file above it. | EC-3 (2025-05), bank 14 | `react-nested-checkboxes` |
| 5 | Turn a product page design into a responsive page | From a design, build a product page with cards, an FAQ, a video in a modal with a mute control, counting numbers and sections that appear on scroll. Note what you would do with more time and where you used AI. | G (2026-08) | `react-accordion-faq`, `css-grid-card-gallery`, `html-dialog-confirm-a11y` |

## Open items

- **Unreadable (U).** Two 1point3acres assessment threads (EC-10, EC-11) and the company page (EC-12). The user can open them and paste the text.
- **Paraphrase only.** EC-6's three problem statements and its AI follow-up are paraphrase, so the record names them but does not quote them. EC-5's round list is WebFetch's summary; only its questions are quoted.
- **Aced dates.** Aced shows relative dates, and its listing and pages disagree for EC-3 (May 2025 in the listing, "2 years ago" on the page). The record uses the listing months.
- **Bank items are not accounts.** Bank items carry interview counts but no dates or roles beyond labels. Items 7, 12, 14 and 15 are listed for software engineers, but the readable accounts behind them are mostly forward deployed or general software engineers.
- **The frontend assessment (Q7)** rests on one repository. Whether all frontend candidates get it, or only some teams, is NOT FOUND.
- **Glassdoor.** Search summaries repeat Glassdoor reviews that match EL3 and EL8. Glassdoor is not opened by rule.
- **Not found:**
  - a Blind, Hacker News, LeetCode or Medium account that names an ElevenLabs task;
  - a TechPrep community account;
  - an ElevenLabs frontend-titled account newer than EL1.

## Verification

- **Method.** The Disney record's two scripts, kept in the session scratchpad (git-excluded):
  - `check_quotes.py` finds every phrase in straight double quotes (after removing code spans and fenced blocks) in the saved pages: Taro `.txt`, WebFetch returns, READMEs, posting text and official-page saves. Whitespace, curly quotes, dashes and HTML entities are normalised; wording, case and punctuation are not.
  - `check_attribution.py` checks that each quote in a source-table row appears in the file of the source that row names.
- **Result.** Last run on 2026-11-03, after the final edits:
  - `check_quotes.py`: 266 of 266 distinct quoted phrases (309 occurrences) found verbatim in the saved pages.
  - `check_attribution.py` (adapted to the EL, EC, EO and EP ids): 187 quotes in source-table rows, every one found in the named source's own file.
- **Coverage.**
  - Taro quotes were matched against the page data saved by curl.
  - Aced, PracHub and Blind quotes were matched against the WebFetch returns, which are sentence-level quotations.
  - GitHub quotes were matched against the READMEs saved through the API.
  - Official quotes were matched against the reader's saves: curl text for elevenlabs.io and the PDF, the Ashby API JSON for postings, and WebFetch returns for third-party job boards.
  - Search terms, proposed names and column labels are in backticks, so the scripts count only source quotes.
- **Re-check on 2026-11-21.** The 2026-11-03 saves were in a session scratchpad and are gone, so the sources were saved again under `research_notes/elevenlabs-2026-11/raw/`:
  - Aced with curl: the 5 experience pages, the experiences listing, the guide, the bank (all roles, software engineer, frontend engineer) and the 8 ElevenLabs question pages.
  - PracHub through WebFetch (curl gets HTTP 403): EC-6, EC-7 and the new EC-15.
  - Official: the careers page, the privacy policy, the candidate notice PDF and its text, three blog posts, the Ashby job board JSON, the `elevenlabs/ui` README with its transcript viewer and audio player docs, and the npm READMEs of the two SDK packages.
  - Editorial: the TechPrep post (EC-8) and the Substack post (EC-9).
  - Taro: curl got HTTP 429 all day. The 32 pages EL3 to EL34, and the one EL35 to EL39 page that the record quotes, were read one at a time in the user's own Chrome through the Claude in Chrome extension. Each file keeps the account fields of the page data. One recruiter's full name in EL32 is replaced with "[name removed]". No Taro API was called.
  - Taro freshness: the company page still lists 39 ElevenLabs pages, the same 39 as on 2026-11-03.
- **Result.** `research_notes/check_binance_quotes_2026-11-18.mjs` with `--raw=research_notes/elevenlabs-2026-11/raw` finds 232 of the 284 quoted phrases. That count includes this re-check's additions, and every added quote is found. Before the Taro pages were read, it found 113 of the 266 phrases of 2026-11-03.
  - Each of the 90 quotes in the Taro source rows is in its own page's file.
  - The 52 phrases it does not find, by reason:
    - 16 from candidate repositories (G): not saved again, because they are not cited.
    - 8 from EL1 and EC-4: behind Aced's account wall since 2026-11-21.
    - 7 from the Ashby application forms and the page shown after applying: not reachable without applying.
    - 7 from closed postings on Built In and Working Nomads (EPC-1 to EPC-3): not saved again.
    - 2 bank interview counts ("2 interviews", "4 interviews"): the bank draws them in the browser, and the saved HTML does not hold them.
    - 2 1point3acres thread titles: not opened, by rule.
    - 2 from the AI recruiter widget settings (EO-6): not saved again.
    - 8 whose page has changed or was not saved: EC-13's sentence (the Aced guide has been rewritten), EC-14 (the PracHub question page), EO-7's "Built on shadcn/ui" sentence (the blog text has changed), one EO-8 phrase, EO-10 and EO-11 (the npm READMEs have been rewritten), and EO-12 and EO-13 (the record kept no URLs).
- **What the page relies on.** Of the page's sources, careers, Aced (EL2, EC-3, EC-5, the bank) and PracHub (EC-6) were checked again. The Taro accounts behind rows 2, 3, 5, 6, 10, 11, 12 and 17 (the 19-row numbering before step 3) were also checked again. EL1's public summary still shows the 90-minute assessment and the live fix of a practical problem, so rows 3 and 7 stand; only its stage details are gated. EC-4 (row 16) is the one page source that can no longer be checked on a public page.

## Status

| Step | State | Date |
|---|---|---|
| Research record (second pass) | written: Taro sweep, community, GitHub and official passes, question list, comparison and catalog proposal | 2026-11-03 |
| U sources (1point3acres) | waiting for the user to paste them, if wanted | |
| Guide, process table, plan | applied after this record: the live guide carries 19 reported questions and 6 behavioural ones (mapping below) | before 2026-11-21 |
| Tags | `ai-ux-considerations` applied earlier; `react-chat-streaming-ui` (EL8) and `react-debug-api-misuse` (EL3) applied in step 4, so the ElevenLabs set had 8 items | 2026-11-21 |
| New practice tasks (step 4b) | `react-voice-service-wiring` (row 2), `js-folder-access-over-time` (row 10), `js-dubbing-review-status` (row 9), `js-debug-spoken-prefix-review` (row 11) and `ai-voice-shopping-assistant` (row 13); the ElevenLabs set has 13 items | 2026-11-21 to 2026-11-22 |
| Fact-check of the guide, process table, rows and catalog notes (step 5) | applied: overstated counts, order and tool claims corrected; EC-6 is not marked curated; the bank was last updated November 2026 | 2026-11-22 |
| Second buyer read (step 6) | rows 6 and 18 got answer guides and were locked; row 7 got its own practice task | 2026-11-22 |
| Re-check (step 0 of the improvement plan) | raw saves, quote check, freshness sweep: EC-15 and EP-18 added; Aced has no new experience and its bank still has 19 items | 2026-11-21 |
| Taro re-check | read in the user's Chrome: 33 pages saved, every Taro quote found, still 39 ElevenLabs pages | 2026-11-21 |

### Live page rows and their record rows (updated 2026-11-22, after steps 2 to 6 of the improvement plan)

A row is open when its unlock would give nothing beyond its topic; every locked row has its own answer guide.

| # | page row id | lock | round on the page | record row | page sources | answer guide | practice |
|---|---|---|---|---|---|---|---|
| 1 | `audio-transcript-highlight` | open (first row) | Live technical round | Q1 | EL2, bank | `audio-transcript-sync` | `react-debug-transcript-sync` |
| 2 | `fake-voice-service-component` | locked | Live technical round | Q2 | EL8, EL9, EL3 | `voice-service-from-types` | `react-voice-service-wiring` |
| 3 | `assessment-react-and-algorithm-tasks` | locked | Coding assessment | Q4 | EL6, EL7, EL1, EL8, EL4 | `timed-assessment-react-and-algorithms` | none (the free starter its guide suggests stays in the open sections) |
| 4 | `dubbing-review-interface` | locked | Product or design round | Q9 | EC-3, bank | `dubbing-review-interface` | `ai-ux-considerations` |
| 5 | `coderpad-react-bug` | locked | Coding assessment | Q3 (first task) | EL3 | `coderpad-react-bug` | `react-debug-api-misuse` |
| 6 | `coderpad-finish-react-component` | locked | Coding assessment | Q3 (second task) | EL3 | `finish-a-partly-written-component` | `react-contact-form-starter` |
| 7 | `live-practical-fix` | locked | Live technical round | Q5 | EL1 | `fix-a-practical-react-problem` | `js-debug-bug-squash-invoices` (the async-race task stays the stage's open practice) |
| 8 | `transcription-studio-roadmap` | locked | Product or design round | Q10 | EL2, bank | `transcription-studio-roadmap` | none |
| 9 | `dubbing-re-review-status` | locked | Live technical round | Q17 | EC-3, bank | `re-review-status-roll-up` | `js-dubbing-review-status` |
| 10 | `folder-permissions` | locked | Live technical round | Q16 | EC-5, EL22, EL23, bank | `folder-access-at-a-time` | `js-folder-access-over-time` |
| 11 | `spoken-prefix-with-repeats` | locked | Live technical round | D (EC-15), added 2026-11-21 | EC-15 | `spoken-prefix-with-repeats` | `js-debug-spoken-prefix-review` |
| 12 | `adapt-product-key-account` | locked | Product or design round | Q13 | EL20 | `adapt-product-for-key-account` | none |
| 13 | `voice-chat-product-search` | locked | Product or design round | Q12, added 2026-11-21 | EL16, EC-15 | `voice-shopping-search-design` | `ai-voice-shopping-assistant` |
| 14 | `valid-sudoku` | open | Coding assessment | D (EL3) | EL3 | none | none |
| 15 | `next-larger-distinct-digits` | locked | Coding assessment | D (EC-6) | EC-6 | `next-larger-with-no-shared-digit` | none |
| 16 | `merge-equal-level-stones` | locked | Coding assessment | D (EC-6) | EC-6 | `fewest-stones-after-merging` | none |
| 17 | `shirt-colours-no-repeat` | locked | Coding assessment | D (EC-6) | EC-6 | `cheapest-shirt-colours` | none |
| 18 | `map-queue-bfs-problems` | locked | Coding assessment | D (EC-4) | EC-4 | `maps-queues-breadth-first` | `js-maze-path` |
| 19 | `merge-sorted-drop-duplicates` | locked | not stated | Q19 (first part) | EL16 | `merge-sorted-and-dedupe` | `js-merge-sorted-arrays` |
| 20 | `reverse-linked-list` | open | not stated | D (bank 2) | bank | none | none |
| 21 | `longest-substring-no-repeats` | locked | not stated | D (bank 5) | bank | `longest-run-without-repeats` | `js-longest-substring-without-repeating` |

- **Behavioural rows (open):** `why-elevenlabs`, `proudest-project`, `product-experience`, `built-end-to-end-alone`, `ai-product-experience`, `long-hours`.
- **Record rows not on the page:** Q6, Q7 (G), Q8, Q11, Q14, Q15, Q18, Q20, Q21 and the airline case.
