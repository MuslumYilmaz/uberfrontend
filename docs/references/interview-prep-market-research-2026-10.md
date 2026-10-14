# Frontend interview-prep market research: what sells, what is missing, which companies are open

> Research record from 2026-10-14 (seven research agents, about 300 web searches through a US-only search proxy, Hacker News through the Algolia API, product and pricing pages, public job boards). Labels: verified = read on the owning platform; self-reported = vendor or founder claim; estimated = third-party or inferred. Reddit could not be read; Glassdoor, 1point3acres, LeetCode Discuss and Dataford return 403 or 429 to fetches, so their details come from search snippets unless stated. Companion documents: `docs/references/ai-product-frontend-track-2026-10.md` (the chosen bet), `docs/references/new-site-growth-2026-10.md` (how new sites grew), `docs/references/seo-growth-roadmap-2026-10.md` (measurement protocol).

## 1. What candidates pay for

| Rank | Product | Evidence |
|---|---|---|
| 1 | Company-specific questions and guides | The only product with verified revenue: Dataford, $36,841 MRR, 1,785 active subscriptions, $199,334 all-time (TrustMRR, Stripe-verified). Every bank gates company tags or company solutions: LeetCode, BigFrontEnd, FrontendLead, GreatFrontEnd's company filter, PracHub, Aced Pro |
| 2 | Question bank with ex-interviewer ("official") solutions, sold annual-first | GreatFrontEnd $39/month, $120/year, lifetime $180 "limited"; FrontendLead $49/month, $99/year, founder reports 1,000+ paying customers after six months of YouTube (self-reported); BigFrontEnd $6/month, $48/year. Prices verified on pricing pages; customer counts self-reported |
| 3 | Mock interviews with humans | Demand is real (interviewing.io from $179 a session, about $2,000 for three coaching sessions) but supply is contracting: Hello Interview ended 1:1 mocks on 2026-05-31 (verified), Pramp folded into free Aced practice, MemPrep is dead |
| 4 | A course from a trusted named person | NamasteDev (Akshay Saini) sells $79.99 to $129 courses, 5,000+ reviews on a 2.1M-subscriber channel; FrontendLead's buyers came after YouTube. Works only with an audience |
| 5 | Coaching and placement | Formation: $5,000 down plus $2,500 to $15,000 success fee; no verified numbers |
| 6 | AI-era prep sold on its own | No evidence it sells alone. Vendors bolt AI tiers onto a bank (Aced Expert, Hello Interview AI coding, educative AI mocks). HelloFrontend's standalone "Frontend AI track" launched on Product Hunt with 0 upvotes and the site shows "Deployment Paused" |
| 7 | Resume review | Never a standalone line item in this set |

Patterns across the paid products: annual plan as the anchor, monthly priced high as the decoy, lifetime only as a limited offer ($180 to $319), no refund or a 5 to 10 day window, purchasing-power pricing (GreatFrontEnd lists Turkey at 53% off), student discount of 40%, cashback for a review. Solutions are gated, questions are not.

What a solo site without an audience can sell: the annual-first bank with company-tagged content as the gate, credible only if the company content is sourced from real reports. Not realistic without an audience: a human-mock marketplace, placement at Formation prices, a named-person course. For FrontendAtlas (monthly plus lifetime today): consider an annual anchor around $99 to $120, keep lifetime limited, sell the AI material inside the bank.

Sources: https://www.greatfrontend.com/interviews/pricing · https://frontendlead.com/pricing · https://bigfrontend.dev/premium · https://www.hellointerview.com/mock-sunset · https://interviewing.io/faq · https://www.aced.io/upgrade · https://formation.dev/pricing · https://trustmrr.com/startup/dataford-inc · https://www.dataford.io/pricing · https://prachub.com/ · https://hunted.space/product/hellofrontend · https://apps.apple.com/us/app/namastedev-by-akshay-saini/id6752595204 · https://news.ycombinator.com/item?id=40212337 (FrontendLead Show HN)

## 2. What candidates say is missing (2025 to 2026)

| Strength | Complaint | Evidence |
|---|---|---|
| Strong, 14 sources | Frontend system design is scarce and backend-centric; it is the round that fails senior loops | Ask HN 2025-07 (frontend dev lost in Redis and Kafka courses); LinkedIn senior FE rejection 2025-08; a 40-company senior FE log 2026-02 with Sumo Logic and Twilio rejections on this round; Gusto L4 2025-02; the same complaint on Blind in 2020 |
| Strong, 12 sources | Formats are unpredictable and LeetCode does not match what is asked | Blind 2026-05: "JS trivia, V8 internals, LeetCode, project deep dives, React coding, FE system design, hard to know what to study"; interviewers confirm the mismatch (a "ping this API and display it" task filters out about 80% of applicants, HN 2026-07) |
| Strong, 11 sources | Take-home burden, ghosting, no feedback | Plain.com dropped its take-home because candidates spent double-digit hours (2025-06); Glassdoor and the 40-company log report 10+ hour assignments and template rejections; no candidate-side take-home practice product exists |
| Strong, 13 sources | AI-era turbulence: AI-allowed rounds, cheating suspicion, debugging rounds, skill atrophy | interviewing.io's cheating experiment (HN 2025-02, 299 points); Meta's AI-assisted round (2025-10); Google piloting Gemini-assisted code comprehension; new round types "12 bugs to resolve" (Apollo.io) and "debug UI code from user reports" (Waymo, 2026-05); Karat: 62% of orgs still ban AI, 71% say skills are harder to assess |
| Strong, 11 sources | Mocks are expensive and inconsistent; nobody reviews the candidate's own code | A $180 Hello Interview mock called the "worst purchase" with self-contradicting feedback (Blind); GreatFrontEnd users request solution review of their own passing solutions (GitHub issues, 2026-09); AI graders criticised as canon-bound |
| Medium, 7 sources | "Interview in a week, where do I start" | Ask HN 2025-11 with zero replies; Blind 2025-09 "overwhelming"; sudheerj issue asking to label core vs legacy "for those whose interview is near" |
| Medium, 8 sources | Senior and staff prep missing; level mismatch | Gusto L4 assessed as L3; "candidates who walk into a senior frontend interview with a generalist's preparation tend to fail"; no first-person staff or principal FE loop write-ups exist; 71% of the May 2025 to May 2026 software-posting rebound came from senior roles |
| Medium | Non-US differences | India: 180-minute proctored vanilla-JS machine coding (Flipkart 2025); loops "focused on finding gaps"; Europe evidence is from 2020 to 2021 |
| Weak, 4 sources | Everything is React; Angular and Vue are rare | A Waymo React candidate was handed an Angular debugging round (2026-05); Vue developers told it is rare to be asked Vue; GreatFrontEnd's Angular questions repo has 36 stars against 6,039 for React |

What candidates praise, so it is already solved: GreatFrontEnd as the polished default bank; Hello Interview as the default for backend system design; interviewing.io's anonymous mocks with FAANG engineers and its free AI interviewer; humane formats such as pair programming on a seeded-bug app and reviewing a real pull request.

The three largest and most recent gaps: frontend system design for the 2025 to 2026 prompt set (AI chat frontend, collaborative editor, live comments, data tables, company-flavoured variants); debugging and AI-assisted rounds, which no frontend product practises; feedback on the candidate's own work below mock prices.

Sources: https://news.ycombinator.com/item?id=44646567 · https://www.teamblind.com/post/has-anyone-gone-through-frontend-interviews-in-2026-xolh3xen · https://leetcode.com/discuss/post/7580886/ · https://www.plain.com/blog/how-we-do-frontend-system-design-interviews · https://news.ycombinator.com/item?id=43124027 · https://prachub.com/interview-experiences/waymo-senior-frontend-engineer-interview-experience-rejected-30-minutes-after-pushing-on-the-process · https://github.com/greatfrontend/greatfrontend/issues · https://www.teamblind.com/post/horrible-experience-in-hello-interview-mock-interview-g4o10kqp · https://scrimba.com/articles/frontend-interview-prep-guide-2026/ (vendor, cites Karat)

## 3. Is the market saturated

| Cell | Verdict | Occupants |
|---|---|---|
| Junior to mid question banks, React or framework-neutral, US-priced | Saturated | GreatFrontEnd 500+ questions, BigFrontEnd 600+, FrontendLead, FrontendExpert, free repos with 44,000 to 61,000 stars |
| Behavioral; US big-tech company guides; free junior content; India-priced React video courses | Saturated | GreatFrontEnd playbooks and 37 company guides, techinterview.org (about 370 guides), Dataford, PracHub, NamasteDev |
| Human mocks | Contested and shrinking | interviewing.io, Aced; Hello Interview exited, Pathrise closed, Outco paused |
| Generic frontend system design | Contested and closing | GreatFrontEnd, BigFrontEnd, FrontendLead, educative's Grokking course (60 lessons), NamasteDev |
| AI-era practical builds (streaming chat, cancel, agent UIs) | Thin | GreatFrontEnd names the topics in its OpenAI guide without practice pages; PracHub has two question pages; HelloFrontend's track is paused; Hello Interview's AI track is not frontend |
| Senior and staff self-serve architecture and tradeoff practice | Thin | Formation (coaching, $5,000+), interviewing.io staff practice, Frontend Masters' "senior" course is component drills |
| Candidate-side take-home practice and review | Empty | Only hiring-side tools (CodeSubmit, Reviewly); Linear, Trendyol and Getir run take-homes |
| Angular-specific mid to senior prep | Thin | GreatFrontEnd's 59 Angular tasks are the same 59 components as its Vue list; BigFrontEnd, FrontendLead and Hello Interview have none; sudheerj's repo last pushed 2026-04; one Udemy course |
| Local-company guides for Turkey and Europe | Empty but small | GreatFrontEnd's guides are all US; Turkish demand did not show up in search (section 4) |

Demand context: Indeed's US software-development posting index stood at 78.3 on 2026-10-02 (February 2020 = 100), Germany 48.3, UK 61.3 (verified, FRED). Senior roles drove 71% of the rebound from May 2025 to May 2026 and AI-titled roles 37% (verified, Indeed Hiring Lab). Dice reports AI fluency in 75% of US tech openings in June 2026 (via CIO). AI tools are allowed in interviews at Anthropic, Cursor, Replit, Vercel, Shopify, Stripe, Canva and Linear and banned at most of Google, Apple, Amazon, Microsoft and Netflix (techinterview.org tracker, 2026-05). Prep spend is under pressure: Interview Kickstart laid off about 50 people and reportedly saw enrolments fall 20 to 25% (Inc42, 2026-06).

Sources: https://fred.stlouisfed.org/series/IHLIDXUSTPSOFTDEVE · https://hiringlab.indeed.com/2026/07/08/ai-and-job-postings-from-destruction-to-creation/ · https://www.cio.com/article/4201347/information-technology-jobs-report.html · https://www.techinterview.org/post/3233474911/ai-tool-policy-tracker-tech-companies-2026/ · https://inc42.com/buzz/blume-backed-interview-kickstart-lays-off-nearly-50-employees-amid-ai-automation-push/ · https://www.greatfrontend.com/questions/angular · https://master.dev/courses/interviewing-frontend-v2/

## 4. Which companies are searched for, uncovered, and sourced

Three layers exist for any "<company> frontend interview" query. GreatFrontEnd's 37 editorial guides, all US companies (from the AI segment: OpenAI, Anthropic, Harvey). Templated programmatic pages from Dataford, Prepfully, PracHub and techinterview.org, which take two to five of the top ten results for nearly any employer but carry generic content (the same event-loop and debounce questions everywhere). Real candidate reports on Glassdoor, Blind, LeetCode Discuss, 1point3acres, Taro, PracHub, Naukri Code360 and LearnersBucket. "No competitor" is therefore rare; "a competitor with a template" is the normal state, and a page wins only as a sourced, worked guide. No volume tool was available: "searched for" is inferred from report density, forum footprint and open postings. Verdicts: open+sourced = no sourced guide ranks and public reports with real questions exist.

### AI labs and AI-native companies

| Company | Reports with questions | Who ranks | Verdict |
|---|---|---|---|
| Waymo | PracHub, May 2026 senior FE loop, read in full: phone screen filters an n-ary tree by substring and renders it as an indented UI; onsite has Angular debugging from user bug reports, a pure TypeScript Promise problem, frontend system design of an AI chat, an autocomplete with debounce; a second senior FE onsite thread on 1point3acres (locked) | 1point3acres, PracHub experience, Prepfully PM pages; no FE guide | Open+sourced, best in segment; 0 FE-titled openings today |
| ElevenLabs | Glassdoor 2026-09 OA (2 FE + 2 LeetCode) and 2024-08 (fix a React bug, finish a component, later a text-to-speech component; "expect voice streaming"); Aced bank: sync audio playback with transcript highlighting, design a collaboration UI for voice dubbing | Aced (paywalled experience page), techprep, PracHub | Open+sourced, partial Aced coverage; 14 full-stack roles, 2 frontend-leaning |
| Scale AI | Blind "fullstack practical" thread (about 28,000 views): HackerRank test with a React/TS part, AI tools reportedly allowed; Glassdoor: CSS grid question | interviewpal, Prepfully, 1point3acres, Aced | Open+sourced, weak: FE is a sub-round |
| Perplexity | 1point3acres 2026-04 FE online assessment: infinite-scroll page, component design, CSS; LeetCode FE post (two DSA mediums); PracHub 2026 guide says the loop is Python-first | interviewquery, 1point3acres, Glassdoor, PracHub | Open+sourced, thin; 0 FE-titled openings |
| Mistral | Official loop in the Paris posting: 45-minute TypeScript live coding, 45-minute system design; Glassdoor "vibe coding" round | Job boards only | Open+sourced, thin, Paris |
| Glean | LeetCode new-grad loop: two-hour "table module" build; 1point3acres FE thread locked | 1point3acres, generic blogs | Open+sourced, thin; 1 FE opening |
| Anthropic, Harvey | GreatFrontEnd guides; PracHub "design a desktop AI chat frontend" | GreatFrontEnd, educative, Aced | Covered |
| OpenAI | GreatFrontEnd, educative, designgurus, Dataford, 1point3acres | Saturated | Covered |
| xAI, Replit | Glassdoor London: one-hour live pair coding building a chat interface in React (xAI) | Dataford FE guides | Covered by Dataford |
| Cursor, Sierra, Cohere, Lovable, Runway, Cognition | Process known (work trials, seeded-bug debugging, HackerRank), no FE questions | Aced, techprep, Dataford SWE pages | Open, unsourced |

### US scale-ups and large tech

GreatFrontEnd covers 19 of the companies checked (Figma, Canva, Shopify, Databricks, Snowflake, Rippling, Ramp, Coinbase, Robinhood, Palantir, Atlassian, Roblox, Discord, Reddit, Pinterest, Snap, LinkedIn, Adobe, Dropbox); techinterview.org has a guide for nearly everything else, including FE-specific guides for Vercel, Linear and Notion; Dataford and Prepfully rank for the rest.

| Company | Reports with questions | Who ranks | Verdict |
|---|---|---|---|
| Datadog | Taro Paris 2025-09 offer report (incremental live coding on tables, FE plus API design); Glassdoor: transform a telemetry stream, design a real-time event viewer, design the frontend of a live-updating logs view; three Blind threads (2021, 2024) | Dataford template, Glassdoor | Open+sourced, richest in segment; 439 open roles |
| Intuit | Glassdoor 2025: implement a Promise class, CSS position values, currency parsing without string methods, closures, React internals, five-hour final | Dataford template, Glassdoor | Open+sourced |
| ServiceNow | Glassdoor and 1point3acres: debounce, setTimeout without setTimeout, forEach without forEach, flatten JSON, sticky navigation, nested comments design, autocomplete, high-performance list rendering | Dataford template, Glassdoor | Open+sourced |
| Miro | Glassdoor Berlin and Amsterdam 2021 to 2025: AsyncTaskQueue with concurrency control, wireframe-to-code discussion, React/TS code review, design a real-time whiteboard; Taro Berlin 2022 offer | Glassdoor only, no prep page at all | Open+sourced; EU-based, small hiring |
| Block (Square) | Glassdoor 2025 loop: vanilla-JS screen, two pair-programming rounds, system design (hotel booking), project deep dive | Glassdoor under "Block"; FrontendLead and Prepfully templates under "Square" | Open+sourced under the Block name |
| Grammarly, Cloudflare | FrontendLead discuss threads (DSA screens), Blind, Taro Lisbon 2025 (TS type for JSON, debug a React app) | Gated Prepfully and Dataford | Weakly covered; hiring unclear |
| GitHub, Workday, Slack | Process only or dated | Prepfully gated, Dataford | Unsourced or tiny |

### Europe and Turkey

| Company | Reports with questions | Who ranks | Verdict |
|---|---|---|---|
| Miro | See above | Glassdoor only | Open+sourced |
| Adyen | Glassdoor 2018 to 2025: take-home on a public API, live coding on the assignment, JS and framework call with two FE engineers; 237 open roles, none FE-titled | Glassdoor, Prepfully stubs | Open+sourced |
| Celonis | Glassdoor Munich 2022 senior FE: OOP, dynamic component rendering, lifecycle, dependency injection, testing (Angular-shaped); 2 open senior FE roles in Madrid | jobrise, Glassdoor, interviewquery SWE | Open+sourced, one dated source; fits the author |
| BlaBlaCar, Trade Republic, Datadog Paris, Monzo | Official or reported process only | Job posts, Medium (member-only) | Open, unsourced |
| Zalando, Spotify, Revolut, N26, Booking.com, Klarna, Bolt, DeepL, SAP | Glassdoor questions exist (debounce, event loop, React state, RxJS and Angular lifecycle at Booking) | Dataford, Prepfully, Aced, cleverprep templates | Covered by templates, beatable |
| Trendyol | Glassdoor backend process (one-week case study, live coding); 0 engineering openings on Lever today; no frontend case repo surfaced | tr.indeed, kariyer.net HR pages, jobmentis | Open, unsourced |
| Getir, Hepsiburada, Insider, Peak, Dream Games, iyzico, Papara, banks | One Sass question at Getir; otherwise nothing | techcareer.net generic page, Indeed, Glassdoor mirrors | Tiny |

Eight Turkish-language company queries ("trendyol frontend mülakat soruları" and similar) returned no company-plus-frontend result at all: Indeed company FAQ pages, kariyer.net pages for warehouse roles, LinkedIn profiles. techcareer.net and kariyer.net built only generic "frontend mülakat soruları" pages. Turkish-language company pages are not an evidence-backed bet.

### India and remote-first

| Company | Reports with questions | Who ranks | Verdict |
|---|---|---|---|
| Swiggy | LeetCode 2024 and 2025: OA with React API task, 60-minute autosuggest machine coding, file-explorer machine coding, polyfills; gist with a credit-card form task | Dataford and Prepfully templates | Open+sourced |
| Zomato | LeetCode 2025: event loop, reconciliation, implement useState and useEffect, design Google Calendar; Aced: portals, Fiber, virtualization | Aced UGC page, Prepfully | Open+sourced |
| Razorpay | LearnersBucket 2021 (machine coding with must-have and nice-to-have tiers), Code360 2022 | Prepfully, Dataford, Code360 | Open+sourced |
| Myntra, Paytm | LeetCode 2024 (React perf, LLD of the Myntra app); GeeksforGeeks 2019 and Code360 2025 for Paytm | Templates | Open+sourced, DSA-heavy |
| Flipkart | GeeksforGeeks, frontendgeek, devtools.tech, Substack, LeetCode: WhatsApp-style chat in vanilla JS in 90 minutes, feedback review system, Google Calendar design | Fragmented small Indian FE sites | Covered, crowded |
| Zepto, Atlassian India | LearnersBucket paid guides | LearnersBucket | Covered |
| GitLab | Official 90-minute merge-request review interview in the handbook | Dataford, Glassdoor | Process only, reproducible as an exercise |
| Automattic, Zapier, Canonical, PostHog | Dated or process-only | Glassdoor, Dataford, techinterview.org | Unsourced or tiny |

The Indian space is saturated at the templated and user-generated layer (Code360, GeeksforGeeks, LearnersBucket, Dataford, Prepfully) and empty at the worked-guide layer, but it is India-priced and user-generated competitors rank higher on an Indian SERP than on the US proxy used here.

Sources: https://prachub.com/interview-experiences/waymo-senior-frontend-engineer-interview-experience-rejected-30-minutes-after-pushing-on-the-process · https://www.glassdoor.com/Interview/ElevenLabs-Full-Stack-Engineer-Interview-Questions-EI_IE9081894.0,10_KO11,30.htm · https://www.aced.io/guides/elevenlabs-software-engineer-interview/questions · https://www.teamblind.com/post/scale-ai-fullstack-practical-interview-6w7m1pa3 · https://www.1point3acres.com/interview/thread/1172704 · https://www.jointaro.com/interviews/companies/datadog/experiences/senior-frontend-engineer-paris-september-1-2025-accepted-offer-positive-2a1ddfe8/ · https://www.glassdoor.com/Interview/Datadog-Front-End-Developer-Interview-Questions-EI_IE762009.0,7_KO8,27.htm · https://www.glassdoor.co.uk/Interview/Intuit-Interview-E2293-RVW56196663.htm · https://www.1point3acres.com/interview/post/7711064 · https://www.glassdoor.com/Interview/Miro-Senior-Frontend-Engineer-Interview-Questions-EI_IE2106300.0,4_KO5,29.htm · https://clear.glassdoor.nl/Interview/Adyen-Interview-Questions-E684495_P225.htm · https://www.glassdoor.co.uk/Interview/Celonis-Interview-E1307503-RVW60382983.htm · https://leetcode.com/discuss/post/4172860 · https://leetcode.com/discuss/post/8359475 · https://learnersbucket.com/tech/razorpay-frontend-interview-experience · https://handbook.gitlab.com/handbook/hiring/interviewing/technical/ · https://www.greatfrontend.com/interviews/company · https://www.techinterview.org/companies/ · https://prachub.com/companies

## 5. What is still unverified

- Purchase attribution by landing page: the repo records no purchase per page (Lemon Squeezy owns the GA4 `purchase` event). Reading it in GA4 is the one measurement that tests the ranking in section 1.
- Search Console, 16-month window, for the query families named in the AI track document.
- Real Google results for the top queries; the search tool used here is a proxy, ignored the `site:` operator and showed frontendatlas.com only when filtered.
- Full reads of the Glassdoor, 1point3acres and LeetCode reports cited above (fetches blocked); only the PracHub Waymo report, the Blind Scale AI thread and the Aced ElevenLabs pages were read in full.
- HelloFrontend's pricing and track scope.
- Whether the Angular coding workspace runs tests, which the Angular variant of the flagship challenge depends on.
