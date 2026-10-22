# Company pages audit, 2026-10-22: template look, thin-content risk and factual errors

Scope: the 26 live `/companies/<slug>/preview` pages on main (deployed with PR #241 on 2026-10-21). Method: every page was fetched from production and its visible text extracted (header, mega menu and footer excluded); cross-page duplication was measured on lines of 25 characters or more; six research agents re-read every cited source live (Taro `__NEXT_DATA__`, Blind payloads with comments, LeetCode GraphQL, Code360 and enginebogie APIs, Medium RSS, official careers pages, Wayback for bot-blocked sites) and reported only non-OK claims with exact quotes; one finding per group was re-checked by hand against the live source before it was accepted. No page was edited in this audit.

## 1. Template look

Three page kinds exist. Authored guides (13): Waymo, ElevenLabs, Datadog, Intuit, ServiceNow, Amazon, Meta, Revolut, Spotify, JPMorgan Chase, Agoda, xAI, Shopee. Editorial-notes pages on the generic template (10): Walmart, Tesla, Microsoft, Apple, Uber, Airbnb, Stripe, ByteDance, Booking.com, Zalando. Generic pages with their own copy (3): Google, Netflix, OpenAI.

| Page | Kind | GFE or FEIH page exists | Unique words | Lines shared with another company page | 90-day clicks / impressions | Live since |
|---|---|---|---|---|---|---|
| airbnb | notes | yes | 343 | 45% | 0 / 7 | old |
| apple | notes | yes | 655 | 51% | 0 / 62 | old |
| stripe | notes | yes | 748 | 33% | 0 / 0 | old |
| microsoft | notes | yes | 824 | 37% | 0 / 9 | old |
| booking-com | notes | no | 877 | 44% | 0 / 0 | 10-19 |
| bytedance | notes | yes | 888 | 43% | 0 / 4 | old |
| zalando | notes | no | 890 | 43% | 0 / 0 | 10-19 |
| uber | notes | yes | 934 | 31% | 0 / 7 | old |
| tesla | notes | no | 1,132 | 31% | 0 / 0 | 10-19 |
| walmart | notes | no | 1,309 | 35% | 0 / 0 | 10-19 |
| openai | generic | yes | 1,046 | 11% | 9 / 202 | old |
| google | generic | yes | 2,213 | 10% | 0 / 171 | old |
| netflix | generic | yes | 2,410 | 7% | 3 / 202 | old |
| waymo | authored | no | 2,273 | 14% | 1 / 9 | 10-14 |
| elevenlabs | authored | no | 2,377 | 13% | 9 / 38 | 10-14 |
| datadog | authored | no | 2,651 | 15% | 0 / 0 | 10-14 |
| servicenow | authored | no | 2,801 | 16% | 0 / 0 | 10-14 |
| intuit | authored | no | 3,317 | 14% | 1 / 12 | 10-14 |
| revolut | authored | no | 3,496 | 15% | 0 / 0 | 10-19 |
| meta | authored | yes | 3,629 | 13% | 0 / 0 | old |
| spotify | authored | no | 3,720 | 13% | 0 / 0 | 10-19 |
| xai | authored | no | 3,957 | 12% | 0 / 0 | 10-21 |
| amazon | authored | yes | 4,266 | 12% | 0 / 115 | old |
| jpmorgan | authored | no | 4,761 | 12% | 0 / 0 | 10-21 |
| agoda | authored | no | 5,481 | 14% | 0 / 0 | 10-21 |
| shopee | authored | no | 6,272 | 9% | 0 / 0 | 10-21 |

Shared lines exclude the "Other company frontend interview guides" directory (25 links on every page). GSC figures are 2026-07-22 to 2026-10-19 (data lag two days).

What repeats across pages:

- Authored pages share one H2 skeleton with the company name swapped in: "Prepare for product judgment, not X trivia" (13 pages), "What the public accounts establish, and what you still need to confirm", "Two product contexts for practising transferable frontend judgment" (11), "Five X frontend interview practice questions", "Scope the ... before writing the first line", "A 7-day X frontend interview preparation plan", "Common X frontend interview preparation questions", "Build the underlying skills with free practice" (14), "Sources and evidence limits" (14), "Continue with the full X practice set". Titles follow "X Frontend Interview Questions: N Prompts + Prep Guide" and descriptions "Prepare for a(n) X frontend interview with N practice prompts ...". The headings live in each `<slug>-preview-content.ts`, so they can be varied per company without template work.
- Editorial-notes pages share the block order and about 250 to 460 words of identical copy per page: the "What you can do now for free" and "What unlocks with premium" boxes (identical on 10 pages), "Sample FrontendAtlas practice prompts", the per-row "Previewed here; the full practice set requires Premium." lines and the trust line "Editorial practice groupings, not verified official interview questions or endorsements." (first visible sentence on all 26 pages, before the H1).
- The body text is unique on every page: no two pages share a paragraph of the guide, the process narrative or the FAQs.

Assessment: the layout is consistent by design and Google does not penalise a consistent template when the main content is unique. The risk is concentrated in the notes pages, where 31 to 51 percent of lines repeat on other company pages and the unique part is 343 to 1,309 words, and in the formulaic authored headings, which read as find-and-replace.

## 2. Thin-content risk

- Airbnb (343 unique words) is the only page that reads as thin to a rater: one component in three framework variants plus two trivia items, no process table, no sourced item, a meta description and three body sentences saying no public report has been read (false, see section 3), 7 impressions and 0 clicks in 90 days, and GFE and FEIH both have Airbnb pages. Options: author it from the eight sources already read (AB1 to AB8 in `docs/references/company-interview-processes-2026-10.md`), or `noindex` it until then.
- Apple (655) and Stripe (748) are next. Both are covered by GFE and FEIH and have never produced a click; Stripe is still unknown to Google (no referring page or sitemap read on 2026-10-21).
- Microsoft lists snake game and chessboard items that its own prep step says "no public account reports ... as Microsoft prompts" (decision D1 in `docs/references/company-sources-followup-plan-2026-10.md` is still open).
- Five pages have no process table by design: Airbnb, ElevenLabs, Netflix, OpenAI, Waymo.
- Metadata: OpenAI description 171 characters (cut in SERPs); xAI title 66 and JPMorgan 62 characters; Google carries a "Current process note — reviewed July 2026" with "upcoming" wording that is stale.
- No placeholder text, broken markup, leaked notes or invalid JSON-LD was found; every page is `index,follow`, self-canonical, SSG-rendered with Organization, WebSite, CollectionPage, BreadcrumbList and, on authored pages, ItemList.

## 3. Factual errors (verified against live sources)

Counts per page are claims checked / OK. Only non-OK claims are listed; "wrong" means a readable source contradicts the page, "unsupported" means no cited source says it, "overstated" means the source is weaker or narrower.

### Wrong on the page (fix first)

| Page | Claim on the page | What the source says | Where |
|---|---|---|---|
| airbnb | "No public frontend interview reports have been read for this page yet" (meta description), "FrontendAtlas has not yet read a public frontend interview report for Airbnb in full" (intro), the same in the FAQ and the hero | Eight Airbnb sources were read in full on 2026-10-20 (AB1 to AB8). Taro Jun 2022 FE: "Build a simple React component. Explain the architecture for a mock chat app. Develop the UI for a simple card game." Taro Dec 2024: "React component and some vanilla JS questions." | `company-editorial-notes.ts` (airbnb description, intro, FAQ) |
| apple | "Apple publishes no interview guide" (subtitle), "No official Apple preparation page exists; the careers site has no interview content" (intro), FAQ "No. The careers site has no interview content", process summary "Apple publishes no interview process page" | https://www.apple.com/careers/us/interview_tips.html is live: "Interview Tips - Careers at Apple", "you may also be asked to prepare and deliver a relevant presentation, case study, or technical assessment — or to participate in writing or coding exercises". It has no stages and no frontend content. | `company-editorial-notes.ts` (apple), `company-interview-processes.ts` (apple summary), `company-official-guides.ts` (no Apple row; file comment), `docs/references/company-sources-review-2026-10.md`, `company-interview-processes-2026-10.md` |
| apple | vue-autocomplete-search source: "LeetCode Discuss: Apple IC3 frontend interview experience, June 2025" | The post's only coding task is "Nested Tabs Rendering Problem"; the autocomplete search bar is in Taro Aug 2022: "Do an autocomplete search bar in TypeScript in Vue.js or React.js." The note itself says it came from "public search previews". | `cdn/questions/vue/coding.json` (backend-impacting) |
| revolut | "Revolut publishes no interview process page." | Revolut's engineering careers page (archived 2025-10-05 and 2026-06-16; live page blocks tools) lists "Intro call: share your experience and career goals with an IT recruiter / Tech interviews / Team fit / Offer". | `company-interview-processes.ts` (revolut summary); add an official row |
| amazon | Source note on the official FEE prep page: "It names no exercises." | The page: "your interviewer might ask you to design an Instagram widget, Type Ahead widget, Infinite scrolling, or Carousel Widget" and "View a sample coding interview question and answer." | `amazon-preview-content.ts` |
| microsoft | "Spread versus rest parameters: Syntax questions that precede the machine coding round." | Machine coding is round 1 in all three cited Bangalore loops; the JavaScript concept round follows it. | `company-editorial-notes.ts` (microsoft prep step) |
| uber | "two of them designed a calendar" and "two accounts were asked to design a calendar" | Three cited accounts: Medium Nov 2022 "Design Collaborative Calendar Application", LC Jun 2025 "design google calendar", LC Nov 2025 "design google calendar". | `company-editorial-notes.ts` (uber), `company-interview-processes.ts` (uber design row) |

| xai | "xAI (now SpaceXAI)" in the title, H1 and process title; the page treats the SpaceXSI careers-page title as a stray | Wikipedia summary on 2026-10-22: "SpaceXSI, legally SpaceXAI LLC, formerly xAI". The company was renamed SpaceXSI in October 2026 (announcement 4 October, X account changed 10 October); x.ai/careers reads "Why SpaceXSI ... © 2026 SpaceXAI LLC". | `xai-preview-content.ts` (title, H1, FAQ), `company-interview-processes.ts` (xai title), smoke and SSR fixtures that pin the title |
| jpmorgan | "The company's own careers pages use JPMorgan Chase, and this guide follows them." | The careers pages brand themselves "JPMorganChase" (`<title>How we hire | JPMorganChase`); "JPMorgan Chase" survives only in the legal names. | `jpmorgan-preview-content.ts` |

### Unsupported by the cited sources (a readable source exists elsewhere, or none)

| Page | Claim | Finding | Where |
|---|---|---|---|
| elevenlabs | Day 4 "two React tasks and two medium algorithm problems in ninety minutes"; FAQ "The public account mentions React tasks"; hero "fixing a practical React problem live" | The cited Aced account says only "a technical assessment to do that takes 90mins ... a technical round that includes live coding collaborating with the interviewer to fix a practical problem". React is supported by sources the page does not cite: Aced c79e72 "a practical front-end debugging round in a small React app", Taro EL3 "Fix React bug", EL4 "some React knowledge check", EL5 "TypeScript and React". Cite them. | `elevenlabs-preview-content.ts` |
| spotify | "another candidate relayed being told the web round was ... such as an image carousel"; prompt 2 "modelled on a reported round"; react-image-slider source note | The Blind comment quotes the recruiter as "practical application of HTML, CSS, JS" and adds "e.g. build an image carousel" as the candidate's own example, then asks whether it would be debugging instead. No account reports a carousel task. (A 2026-10-20 read called this wording fair; the exact quote shows it is not.) | `spotify-preview-content.ts`, `cdn/questions/react/coding.json` (react-image-slider, backend-impacting) |
| booking-com | 2025 loops with "a take-home and a pairing session" (hero, caveat, FAQ); "15 to 30 minute recruiter call"; "fit interview of about an hour" | One Aug 2025 account: "Take-home assignment + First technical session"; none mentions pairing. Both durations come from an uncited full-stack account ("Recruiter call (15 min)", "Fit Interview (60 min)"). A thin Sep 2025 frontend developer account also exists although the page says frontend accounts stop in mid-2023. | `company-editorial-notes.ts` (booking-com), `company-interview-processes.ts` |
| google | Caveat "one account had none" (frontend rounds), screen "45–60 minutes", ranges ending in 2026 | All rest on a Medium April 2026 post that is unreadable today (403, not in the author's feed, no Wayback capture) and is not labelled as a preview on the page. | `company-interview-processes.ts` (google) |
| stripe | "one screen was a three-part exercise"; hero "reports from 2021 to 2025" | True per Taro Canada Sep 2025 ("broken into a 3-part exercise through CoderPad"), which the page does not cite; the only 2021 source is an uncited full-stack Blind thread, and the table says 2022 to 2025. | `company-editorial-notes.ts` (stripe), `company-interview-processes.ts` |
| datadog | "these round types occurred between 2021 and 2025" | Cited accounts are 2024 and 2025. | `datadog-preview-content.ts` |
| tesla | hero and description "three to five round onsite" | No cited account has five rounds; the table says three or four. | `company-editorial-notes.ts` (tesla) |

| jpmorgan | Aced account details: "UK, around May 2026", "a recruiter screen", "a generic async promise React hook", "'Tell me about yourself'" | The Aced page is paywalled; its public summary gives only Senior/L5, rejected, two weeks, "Generic types and useEffect cleanup in a live coding environment". The other details came from a member view or nowhere. Also "Executive Director" appears in no cited source, and "contacted by email only and went straight to team interviews" is in no cited account. | `jpmorgan-preview-content.ts`, `company-interview-processes.ts` |
| xai | Aced MTS account details: "December 2025", "one of six prompts, X and xAI API keys, a GitHub repository and a Loom video within 24 hours", "a 15-minute screen" | Paywalled; the public summary supports only L3, rejected, four weeks, a short recruiter screen, a 4-hour take-home and a 1-hour in-person session. The "4-hour intensive programming challenge" quote comes from andys.blog, which the page does not cite. | `xai-preview-content.ts` |
| shopee | "on Glider.ai in the accounts that name the platform", "proctored", "60 to 70 minutes"; "campus accounts also describe a frontend variant with five JavaScript problems"; the 2023 senior loop in the caveat | Neither cited assessment account names Glider.ai or proctoring (one says "70 mins"); the five-problem variant is a blocked 1point3acres thread not labelled as a snippet; the 2023 loop is a GoodJob entry the page does not cite. | `shopee-preview-content.ts` |

### Overstated (precision fixes)

- amazon: Leadership Principles row "behavioural questions that open every interview" (official page: two or three per interviewer, accounts started technical; the guide body was fixed in a243dbd8, the official-guides row was not); "Closures, asked directly in two accounts" (one); India 2025 "multiple-choice assessment" (one coding question plus MCQs); prompt 6 "probing authentication, storage and API design" (no account mentions storage).
- meta: "Every public account describes plain JavaScript and DOM work" (two screens asked data-structure questions, which the page's own FAQ concedes); "Two accounts say the screen questions matched BigFrontend" (one matched, one recommends it).
- google: hiring committee "then team matching" (order varies; LC Jun 2021 matched first); system design "frontend and API focus" (one L5 reply had a non-frontend round); "upcoming" AI pilot (planned for H2 2026 per Business Insider 2026-05-07).
- netflix: the culture memo row says interview questions draw on it; that statement is on the new-grad and intern pages.
- waymo: "the May 2026 posting asked for production Angular experience" (the candidate's recollection, no posting read); "timed UI build" (no timing in the report); the PracHub report is "curated and edited by PracHub".
- datadog: Paris advice reads "mention virtualisation and context providers as follow-ups" where the account says "not worry about optimizations"; prompt 3 attributes Valbonne problems to the Lisbon account.
- intuit: FAQ 2025 detail (codebase the day before, stories on the spot); prompt 5 mixes the Oct 2023 and Nov 2025 posts; "Python and SQL" loop also had an algorithm problem.
- servicenow: "Accounts from India", "This table covers India only" and the variant title rest on two Taro city labels; two "one hour" durations come from a single account.
- uber: "Most of the public accounts come from India" (2 of 7); "The 2022 accounts took a 35-minute CodeSignal test" (one account); "levels L3 to L6" (guide tabs end at L6+); hub wording.
- bytedance: "nine outside Taro and about sixteen on it" counts six new-grad and intern loops; US assessment row says "HackerRank or CodeSignal" while its sources name only CodeSignal; a Singapore account is shown under US; the TikTok early-careers row sits under "Published by ByteDance" (TikTok US is a joint venture with ByteDance at 19.9 percent since 2026-01-22).
- walmart: "SDE 3 (UI) accounts from India describe three 60-minute rounds" (one of three has no durations or location); "reports from 2022 to 2026" (sources include 2020 and 2021); the React debug session is a Walmart-badged commenter on an SWE3 thread; "went deep on module federation" (was asked about it); messaging inbox "Reported in Blind Jan 2022" is advice, not a round.
- tesla: "Most accounts open with a recruiter or HR call" (two); colour contrast "reported in a 2022 Codility assessment" (the account lists tasks without stage labels); login form attributed to the assessment while the catalog note puts a CSS task in the onsite; "one brief marked confidential" could not be read (vector-outline PDF).
- microsoft: "one of the few companies with official hiring guidance" (22 of the 26 companies here have official pages); "machine coding of one to two hours" (one account); "five or six rounds" (one Bangalore account had four); the behavioural row ignores the technical hiring-manager rounds of 2020 and 2021.
- apple: "The nine frontend accounts agree on a screen followed by a team loop" (four describe both stages).
- revolut: prompt 3 "three JavaScript tasks in 85 minutes" (the Madrid account names no language); the Bar Raiser video description is now readable.
- spotify: two final-round rows cite a Blind thread that describes only a 75-minute phone screen with "no ds algo"; the algorithms row cites a thread with no algorithm round; "60–75 minutes" screen; the "New York" full-stack Lever posting is gone; "Mural for diagrams" (page says only "CoderPad and Mural"); the how-we-hire source note points at a page that shows three steps only.
- zalando: "all from Berlin" (two of three loops); the 2020 assessment named no platform and allowed three working days; official-pages-disagree wording; hiring-manager row miscited; take-home review "45 minutes, 2 reports" (one gives a duration).

- jpmorgan: "60 to 90 minutes of live coding" (one 90-minute figure, from a pre-interview briefing; others 30 to 45 minutes); "Three 45-minute rounds in one day" (one hour, one hour, 45 minutes); "employees on Blind carry a JPMC badge" (the badge reads JPMorgan Chase); the level mapping "Software Engineer III as mid level" is in no cited source; "10 public reports" and "6 public reports" count pre-interview briefings.
- agoda: "most of them Bangkok relocation loops interviewed from India" (one account states India); the preliminary-call row cites a 2026 account whose contact was by email; "15 to 30 minutes" (one account says 15); the Blind note merges two commenters; the Gurgaon rejection-then-Bangkok-offer account is a Senior Fullstack loop the page does not cite.
- xai: "engineers, not recruiters, evaluate applications" (page says "technical team members"); the Built In dates are the Built In listing window only (a mirror shows the grok.com role from 2025-03-17).
- shopee: Nowcoder "Guangdong" is the poster's university tag; "two campus accounts ... with first and second technical rounds" (the March 2020 post covers one round); "relocation material" (the post mentions Singapore cost-of-living references); "an HTTP and security hour" (no duration given).

### Cross-cutting

- Taro cities appear in public labels on Meta (London, New York), Datadog (Valbonne, Paris, Lisbon), Intuit (Los Angeles), Tesla (Fremont), Stripe debug items (Barcelona), Revolut and ServiceNow, against the rule in `docs/references/company-interview-processes-2026-10.md`: "Never put a Taro city in a public label."
- Taro dates on the 1st of a month are placeholders by the same rule, but the pages present them as exact months ("Taro, Oct 2024", "January 2024", "September 2022").
- Official links: no dead link. amazon.jobs "interviewing-at-amazon" 301s to /content/en/how-we-hire (update the URL). careers.servicenow.com, lifeatspotify.com, revolut.com, openai.com/interview-guide, jobs.uber.com and netflixtechblog.com block tools but load in browsers; ByteDance and TikTok campus pages are JavaScript shells that no tool could read today.
- Several readable sources sit in the research docs without being cited on the pages (ElevenLabs EL2 to EL5, Stripe Taro Canada 2025, Uber LC 1064199 and 6840169, Booking.com Aug 2025 and Sep 2025, Airbnb AB1 to AB8). Citing them removes most "unsupported" rows without new research.

## 4. Fix order

1. Airbnb and Apple "no report / no official page" statements, the xAI title (SpaceXSI), the JPMorganChase branding sentence, the Revolut summary, the Amazon source note, the Microsoft round order and the Uber calendar count: wrong on the page.
2. Paywalled Aced details on the JPMorgan and xAI pages, ElevenLabs React citations, Spotify carousel wording plus the react-image-slider note, Booking.com 2025 loop and durations, Google claims that rest on the unreadable Medium post, Tesla "five rounds", Stripe and Datadog ranges, the Apple autocomplete source.
3. Taro cities and placeholder months in labels across pages (one pass over the content modules, the process registry and the two debug items).
4. Precision fixes from the overstated list, the Amazon URL redirect, the Google "upcoming" wording.
5. Structure: vary the authored H2s per company; shorten the OpenAI description; decide Airbnb (author or noindex) and the Microsoft unsupported items (D1).

Every CDN change (`cdn/questions/**`) re-runs the catalog pipeline and the backend interview registry pins; the company pages then re-date through `gen:seo`.
