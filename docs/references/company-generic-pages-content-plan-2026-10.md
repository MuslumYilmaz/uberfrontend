# Generic company pages: editorial notes plan for ten previews

> Working plan approved on 2026-10-21. It covers the ten company preview pages that still render the generic catalog template, the internal-link layer that feeds all 22 company pages, and the per-company copy the new layer will carry. Research behind it: `docs/references/company-interview-processes-2026-10.md` (loop shapes and sources, cited below as PROC), `docs/references/walmart-nvidia-tesla-questions-2026-10.md`, `docs/references/europe-company-shortlist-2026-10.md`, `docs/references/company-sources-review-2026-10.md`, `docs/references/company-sources-followup-plan-2026-10.md` and `docs/references/company-pages-plan-2026-10.md`.

## Why

A Googlebot audit on 2026-10-21 found that rendering is not the problem on company pages. All 22 `/companies/<slug>/preview` routes are prerendered, `index,follow`, byte-identical for a Googlebot and a browser user agent, and Google's own renderer loads 73 of 74 resources (the one failure is the Sentry request that robots.txt blocks). Two other things keep pages out of the index:

1. **Discovery.** Each company preview has one internal link, from `/companies`. The home page links four cards plus OpenAI, question pages never link back to a company page, company pages do not link to each other, and the footer links only the hub. Meta and Stripe have been in the sitemap since February and March 2026 and sit in "Discovered, currently not indexed": Google has never fetched them.
2. **Thin, templated text on the generic pages.** Walmart, Tesla, Microsoft, Apple, Uber, Stripe, ByteDance, Booking.com, Zalando and Airbnb show 348 to 1,385 visible words, 32 to 86 percent of their visible lines also appear on another generic page, and every one carries the same title and description pattern (the description runs 172 to 179 characters, over the 160-character warning in `seo:meta-check`).

Decisions taken on 2026-10-21:

- Question pages link to a company page only from catalog items whose `sources[]` name that company (73 items). The rule in `frontend/scripts/public-trust-regressions.test.mjs` against per-question company badges stays as it is.
- The generic pages keep their machinery (counts chips, sample rows, public reports block, official pages table, process table, CTA) and gain a per-company editorial layer. They are not converted to authored guides; the generic template is also the fixture for several specs and smoke checks that use Microsoft, Apple and ByteDance.
- Airbnb is included, so the layer covers ten pages.
- The home page keeps its four cards and adds a compact list of all 22 company guides.

## The internal-link layer (all 22 pages)

Anchor text everywhere is `<Label> frontend interview questions`, the convention `/companies` and `frontend/src/llms.txt` already use. Labels come from `companyBrandFor()` in `frontend/src/app/shared/company-branding.ts`.

| Surface | Where | What |
|---|---|---|
| Home | `frontend/src/app/features/showcase/showcase.page.{ts,html,css}` | A list of all 22 company guides built from the build-time `SHOWCASE_STATIC_STATS.companyCounts`, rendered outside the lazy `sectionVisible.company` block so the server HTML and the hydrated page carry the same links. The four cards and the OpenAI priority link stay. |
| Company previews | `frontend/src/app/features/company/company-preview/company-preview.component.{ts,html,css}` | A "More company guides" section before the closing `</section>`, so it renders on the OpenAI, Google, Netflix, registry and catalog branches alike. Data comes from the generated metadata, not from `shared/company-previews/`, so no company page re-dates. |
| Question pages | `frontend/src/app/shared/components/question-sources/question-sources.component.{ts,css,spec.ts}` | Under the public reports list: "Reported in a public <Label> interview account." plus an internal link to the company guide. Only items with a company-scoped source get it (26 indexable pages, 39 links). Airbnb, Amazon, Microsoft, OpenAI, Spotify and Uber have no such item and rely on the other surfaces. |
| Footer (optional) | `frontend/src/app/core/content/site-footer.json` | A "Companies" group with Google, Meta, Amazon, Apple, Microsoft and Stripe, which fills the footer to its 24-route limit. |

No `SHARED_CONTENT_RELEASES` entry is needed: the shared template and component edits re-date no company page, the home page re-dates itself, and discovery comes from the links rather than from `lastmod`.

## The editorial notes layer (ten generic pages)

- Registry: `frontend/src/app/shared/company-previews/company-editorial-notes.ts`, keyed by slug, with its model and spec fixture beside it. The inventory in `frontend/scripts/seo-content-inventory.mjs` lists it in `COMPANY_SCOPED_REGISTRIES`, so each page is dated only by its own entry.
- Template: hero kicker, H1 and subtitle come from the entry when one exists; a short intro and a "What public interview reports describe" section sit between the hero and the process table; a "How to prepare with this grouping" list sits between the process table and the proof grid; FAQs sit between the official pages table and the CTA. Everything else stays where it is, so the existing pins on the generic markup keep passing.
- SEO: the entry supplies the title, H1 and description; the page publishes a CollectionPage with `dateModified` and a BreadcrumbList, no ItemList and no FAQPage. Titles stay at 60 characters or fewer and unique site-wide; descriptions between 70 and 160.
- The company reports generator (`frontend/scripts/gen-company-reports.mjs`) treats a missing `access` field as premium while the app treats it as free. It is corrected with the layer, which removes the wrong Premium chip from the two Stripe debug items.

## Rules for the copy

- The disclaimer stays verbatim: "Editorial practice groupings, not verified official interview questions or endorsements."
- Say "public interview reports" and "practice version modelled on a reported round". Never "known questions", "candidate reports", "How X evaluates", "questions used in this company", "and counting".
- Stage text says what the reports describe, not what the company always does; "always", "never", "guaranteed" and "every candidate" are banned.
- No Taro city labels; a Taro date on the first of a month is a placeholder.
- No apostrophes or possessives in content modules.
- Re-read every claim on its source before writing it. Never reproduce a take-home brief.
- Prep steps list only items tagged with the company; free items come before premium ones; items that exist as editorial groupings without a public report are labelled as such, never as reported prompts.

## What every generic page shows today

Identical on all ten pages: title `<Label> Frontend Interview Questions Preview`; description `Preview the FrontendAtlas editorial <Label> practice grouping across coding, concept prompts, and system design. It does not claim official question provenance or endorsement.`; kicker `Public preview`; subtitle `Review a FrontendAtlas editorial practice grouping across coding, concept questions, and system design before choosing the full practice set.`; the proof grid (`What you can do now for free`, `What unlocks with premium`, six bullets); `Sample FrontendAtlas practice prompts`; the public reports block where sources exist; the official pages table where a page was read; the two CTA buttons. Thirty-three lines are the same on every page.

The sections below give, per company, the replacement copy for the parts that change and the facts it may rest on. Character counts are for the title.

## 1. Walmart (`/companies/walmart/preview`)

42 tagged items; a 15-row process table across three variants; 10 items with Walmart-scoped sources; no official Walmart page exists.

- Title: `Walmart Frontend Interview Process and Practice Questions` (57). H1: `Walmart Frontend Interview Questions and Process`.
- Description: `How public reports describe Walmart frontend interviews: HackerRank and Karat screens, React fundamentals rounds, and practice items for each stage.`
- Subtitle: Walmart Global Tech loops reported from India and the US, from the 2024 MCQ assessment to the 2026 HackerRank Frontend Engineering Assessment, with free and premium items for each round.
- What public reports describe:
  - India SDE 3 (UI): three 60-minute rounds (DSA; JavaScript, React and web fundamentals; hiring manager). An HR call appears in one account only.
  - India SDE-2 (October 2024): 20 MCQ on HTML, CSS and JavaScript, two easy coding questions in JavaScript and 10 MCQ on React or Angular, then a LeetCode-medium round, a React round and a final round.
  - US and senior: a Karat screen (about ten minutes of short answers, then coding), HackerRank screens including the 2026 assessment that pairs a coding problem with debugging a React or Angular app with AI assistance, and onsites that mix coding, design and hiring manager rounds.
  - Most detail comes from Walmart Global Tech India; US reports mostly describe the format.
- How to prepare with this grouping: `js-valid-parentheses` (free); the free trivia `react-ssr-hydration`, `react-state-management-redux`, `react-code-splitting-module-federation`; `react-debug-api-misuse` (premium; the AI-assisted debugging round); `react-select-compound-api` (premium); `react-implement-usememo-context` (premium); `messaging-inbox-frontend` (premium; a practice version, not a reported prompt).
- FAQs: Is there a system design round? (US senior onsites report design rounds; the India SDE 3 (UI) accounts have none.) Which platform runs the screen? (HackerRank, including CodePair, and Karat.) Are these the real Walmart questions? (No; practice versions modelled on public reports.)
- Do not write: an HR round in every India loop; an assessment or system design round for SDE 3 (UI); any Angular detail (it exists only in a republication); `react-file-explorer` or throttle as reported prompts; a Walmart logo (the brand centre forbids it, so the page keeps its monogram).

## 2. Tesla (`/companies/tesla/preview`)

21 tagged items; a 15-row process table across two variants; 10 items with Tesla-scoped sources; no official Tesla page exists.

- Title: `Tesla Frontend Interview Process and Practice Questions` (55). H1: `Tesla Frontend Interview Questions and Process`.
- Description: `How public reports describe Tesla frontend interviews: a Codility assessment, an hour-long technical screen, 3 to 5 onsite rounds, and team-specific take-homes.`
- Subtitle: Recruiter call, Codility assessment, technical screen and a 3 to 5 round onsite as described in public reports from 2020 to 2026, with the free and premium items that rehearse each stage.
- What public reports describe:
  - A recruiter or HR call first; in one account the call came after the assessment.
  - A Codility assessment (two hours for five questions in one account); other assessments ran three hours with HTML and CSS, a like button and a string puzzle.
  - A one-hour technical screen.
  - An onsite of three to five rounds of about 45 minutes: algorithm, system design, React and behavioural in one account; Angular, TypeScript and system design in a 2024 loop.
  - Team match can end without an offer after a passed loop (2026).
  - Take-homes are team-specific; React in most accounts, Angular once, Vue once; interns get one or two rounds.
- How to prepare with this grouping: `js-color-contrast-ratio`, `html-forms-validation-required`, `html-semantic-layout`, `css-positioning-badge`, `react-fetch-list-states`, `js-shallow-clone` (free); `js-deep-clone`, `react-like-button`, `react-battery-site-layout` (premium; our own catalog and wording), `car-rental-booking-frontend` (premium; a practice version).
- FAQs: Does Tesla use a take-home? (Some teams do; the briefs are never reproduced here.) Which framework? (React mostly; Angular in a 2024 loop; Vue once.) Is there system design? (In several onsite accounts, including an intern final.)
- Do not write: anything from the gear-shifter brief, which is marked confidential; city labels; the recruiter plan as an account; the "three minutes with Elon" line; the general SDE-1 loop as a frontend role.

## 3. Microsoft (`/companies/microsoft/preview`)

18 tagged items; an 11-row process table across two variants; two official pages; no item with a Microsoft-scoped source.

- Title: `Microsoft Frontend Interview Process and Practice Guide` (55). H1: `Microsoft Frontend Interview Questions and Process`.
- Description: `What Microsoft publishes about its hiring loop and what public reports add for frontend roles: machine coding, JS and React concepts, DSA and design rounds.`
- Subtitle: Microsoft publishes its own hiring tips; public reports from 2020 to 2025 add the frontend detail: a short recruiter call, machine coding in JavaScript or React, concept rounds, DSA and design. Loops differ by team and country.
- What public reports describe:
  - Official pages: a brief screening conversation, two to four conversations of up to an hour, by phone, on Teams or in person, with no outside assistance unless explicitly permitted.
  - Reports: a take-home in one account; machine coding of one to two hours (plain JavaScript in the 2020 to 2021 Bangalore accounts, React components in 2024 to 2025); JavaScript and React concepts (output questions, polyfills, promises); DSA, sometimes on non-frontend material; low-level, application and component design; behavioural and hiring manager rounds; a senior leader round in 2020.
  - Loop sizes from two to six rounds; no screening platform is named.
- How to prepare with this grouping: the 12 free JavaScript trivia items tagged with Microsoft; `angular-snake-game` (free) and the chessboard and snake variants (premium) as editorial groupings, not reported prompts. Tag candidates for a separate decision: `js-dom-renderer`, `react-dynamic-table`.
- FAQs: How many rounds? (The official page says two to four conversations; Bangalore accounts report five or six.) Virtual or on site? (The student page says virtual; the general page allows phone, Teams or in person.) Can I use AI? (The official page allows no outside assistance unless explicitly permitted.)
- Do not write: snake or chessboard as reported prompts. The technical-interviewing page cited in PROC is missing from `company-official-guides.ts`; adding it is a separate change.

## 4. Apple (`/companies/apple/preview`)

38 tagged items; an 11-row process table; 5 items with Apple-scoped sources; no official Apple page exists.

- Title: `Apple Frontend Interview Process and Practice Questions` (55). H1: `Apple Frontend Interview Questions and Process`.
- Description: `How public reports describe Apple frontend interviews: a recruiter call, a 45 to 60 minute coding screen in React, JS or TS, and a team loop of 4 to 7 short rounds.`
- Subtitle: Apple publishes no interview guide, so this page rests on public reports from 2021 to 2025: a CoderPad screen, then a team loop of 4 to 7 rounds that differs by team.
- What public reports describe:
  - A one-hour assessment with two coding questions and 20 MCQ in two accounts.
  - A recruiter call; a hiring manager conversation early in some loops.
  - A technical screen of 45 to 60 minutes in React, JavaScript or TypeScript, sometimes with DSA; one was mostly conversational with about 15 minutes of coding.
  - A team loop of four to seven rounds of 30 to 45 minutes, mostly JavaScript, React and CSS; one account had four coding rounds with no behavioural and no system design round.
  - A director meeting in one account; CoderPad in one.
- How to prepare with this grouping: `css-theme-variables-dark-mode`, `js-build-tree-from-flat-list`, `js-debounce` (free); `js-unique-array`, `js-stack-queue-implementation` (the min stack), `vue-autocomplete-search` and `angular-autocomplete-search-starter` (premium). The remaining premium tags (delegated events, DOM walks, selector polyfills, array polyfills, median, merge, reverse, anagram, dialog) are editorial groupings.
- FAQs: Does Apple publish a preparation page? (No.) Is there system design? (Not in the frontend-titled accounts; one says there was none.) Is the loop the same for every team? (No.)
- Do not write: that the June 2025 LeetCode account was read in full until its access status is settled; the unsupported tags as reported prompts.

## 5. Uber (`/companies/uber/preview`)

5 tagged items; a 9-row process table; three official pages; one item with an Uber-scoped source.

- Title: `Uber Frontend Interview Process and Practice Questions` (54). H1: `Uber Frontend Interview Questions and Process`.
- Description: `Uber publishes its frontend loop: a HackerRank assessment, a coding and design phone screen, and three 60 minute interviews. Public reports add the detail.`
- Subtitle: Uber is one of the few companies with an official frontend interview guide. This page pairs it with public reports from 2021 to 2026 and the practice items that fit each stage.
- What public reports describe:
  - The official guide: a 30-minute recruiter call, a HackerRank assessment, a 60-minute phone screen on coding plus design and architecture, then three 60-minute interviews (algorithms and data structures; depth in specialization; collaboration and leadership). Steps vary by role, location and business need.
  - The official candidate story: a vanilla JavaScript assessment, then algorithms, web specialization, system design and a hiring manager conversation.
  - Reports: a 35-minute CodeSignal test with two DSA questions and eight frontend MCQ in 2022; a phone screen that sometimes builds a React component; a specialization round that is a UI build or a JavaScript problem; a separate system design round at mid and senior levels (a calendar in two accounts); one loop done in a day. Most accounts are from India.
- How to prepare with this grouping: `css-position-relative-absolute-fixed`, `css-visibility-vs-display`, `js-promises-async-await`, `js-truthy-falsy-pass-by-value-reference-strict-equality-use-case` (free); `js-concurrency-map-limit` (premium; the reported mapLimit task).
- FAQs: HackerRank or CodeSignal? (The guide says HackerRank; the 2021 to 2022 accounts used CodeSignal.) Is design a separate round? (The guide puts it inside the phone screen; the candidate story and four accounts have a separate round.) Do recruiter labels match the rounds? (Two accounts got different rounds than announced.)
- Do not write: the 2024 Blind plan as an account; progress bar or poll widgets as documented mappings.

## 6. Stripe (`/companies/stripe/preview`)

5 tagged items, two of them debug exercises; a 7-row process table; one official page; 4 items with Stripe-scoped sources.

- Title: `Stripe Frontend Interview Process and Practice Questions` (56). H1: `Stripe Frontend Interview Questions and Process`.
- Description: `How public reports describe Stripe frontend interviews: a 60 minute multi-part CoderPad screen, then an onsite with coding, bug squash, integration and frontend design.`
- Subtitle: Stripe describes its process only in general terms; public reports from 2021 to 2025 fill in the frontend loop: a multi-part CoderPad screen and an onsite built around a bug squash, an integration exercise and frontend design.
- What public reports describe:
  - The careers FAQ: a recruiter screen, a technical or skills-based assessment and interviews with the team; timelines vary by role, level and location.
  - A 30-minute recruiter call.
  - A 60-minute CoderPad screen with two to four exercises; three parts in one account, a four-digit code entry form in another.
  - An onsite with a programming exercise, a bug squash in an unfamiliar project, an integration of two provided tools, frontend design and a manager conversation; about three weeks plus two for an answer in one account; rounds can be swapped.
- How to prepare with this grouping: `js-debug-async-race`, `js-debug-stale-closure-autosave` (free; the bug squash shape); `js-group-by`, `js-lodash-get` (premium; the JSON manipulation screen); `js-bigint-data-type` (free trivia).
- FAQs: What is the bug squash? (Finding and fixing bugs in a project you have not seen before.) Is the screen in JavaScript? (The JSON screen account says it suits JavaScript candidates.) Does Stripe publish preparation material? (The careers FAQ only; candidates mention recruiter-provided documents.)
- Do not write: that the JSON screen was a Java screen; the Stripe Atlas recruiting guide as Stripe process; that Stripe publishes no page (outdated).

## 7. ByteDance and TikTok (`/companies/bytedance/preview`)

22 tagged items; a 25-row process table across three variants; two official pages; 3 items with ByteDance-scoped sources.

- Title: `ByteDance and TikTok Frontend Interview Process and Prep` (57). H1: `ByteDance and TikTok Frontend Interview Questions`.
- Description: `How public reports describe ByteDance and TikTok frontend loops: HackerRank or CodeSignal assessments, a DSA round, a frontend round and a hiring manager design round.`
- Subtitle: Early-careers pages from ByteDance and TikTok plus public reports from 2020 to 2025: assessments on HackerRank or CodeSignal, two technical rounds and a hiring manager round, with regional variants.
- What public reports describe:
  - Official early-careers pages: two to three interviews on coding, algorithm and design skills; practice on HackerRank and Nowcoder; an assessment depending on role and region.
  - US experienced loops: an assessment for some candidates on HackerRank or CodeSignal; a 15 to 30 minute recruiter call; two technical rounds of about an hour (one DSA, one frontend with a React component or a JavaScript utility); a hiring manager round that often includes frontend design; HR.
  - Singapore, Australia and new-graduate variants; one to two week timelines; a CodeSignal frontend problem in four levels, or four questions in 70 minutes.
- How to prepare with this grouping: `js-build-tree-from-flat-list` (free); the 14 free trivia items; `js-array-prototype-map`, `js-array-prototype-reduce` (premium; representative drills for "implement a built-in method"). The other premium tags (add strings, three sum, flatten depth, lodash get, concurrency map limit) are editorial groupings. Tag candidates for a separate decision: `js-throttle`, `react-fetch-list-states`.
- FAQs: Is the hiring manager round behavioural only? (Accounts disagree.) Where does system design appear? (It varies by account.) Does every loop start with an assessment? (No; two accounts had none.)
- Do not write: the TikTok review that a search summary credited to NVIDIA; the unsupported tags as reported prompts.

## 8. Booking.com (`/companies/booking-com/preview`)

16 tagged items; an 11-row process table; one official page; 7 items with Booking.com-scoped sources.

- Title: `Booking.com Frontend Interview Process and Practice` (51). H1: `Booking.com Frontend Interview Questions and Process`.
- Description: `How public reports from 2021 to 2023 describe Booking.com frontend interviews: a HackerRank test, a recruiter call, coding rounds with two engineers and a fit interview.`
- Subtitle: Booking.com publishes a four-step journey; public frontend reports from 2021 to 2023 add the detail: a 90 to 100 minute HackerRank test, one or two 60 minute coding rounds in vanilla JS or React, and a fit interview. Newer general SWE loops add a take-home.
- What public reports describe:
  - The official page: Application, Interview, Business and Feedback; three to six weeks; feedback within a week.
  - A HackerRank test of 90 to 100 minutes with about five items: two easy algorithm problems, two HTML and CSS MCQ and one React component.
  - A 15 to 30 minute recruiter call, sometimes with technical questions.
  - One or two coding rounds of about 60 minutes with two engineers, in vanilla JavaScript or React; a typeahead or autocomplete recurs.
  - Backend coding and system design only for full-stack and senior roles; a fit interview of about 60 minutes with engineering managers.
  - 2025 general software loops add a take-home and a pairing session; frontend evidence stops in mid-2023; mostly Amsterdam.
- How to prepare with this grouping: `react-autocomplete-search-starter`, `js-debounce`, `js-flatten-once`, `html-forms-validation-required` (free); `angular-autocomplete-search-starter`, `vue-autocomplete-search`, `js-throttle`, `react-debounced-search`, `realtime-search-debounce-cache` (premium; practice versions of the reported autocomplete round); `js-group-by`, `react-contact-form-starter` (premium; editorial groupings).
- FAQs: Is there system design for frontend? (Not in the frontend-titled accounts.) Is the HackerRank test monitored? (One account describes a live 40-minute session with three engineers.) How recent are the reports? (Mid-2023.)
- Do not write: Taro mirrors of the same review as separate accounts; the withdrawn Angular and RxJS argument; the old official URL.

## 9. Zalando (`/companies/zalando/preview`)

20 tagged items; a 6-row process table; two official pages; 3 items with Zalando-scoped sources, all from one 2024 account.

- Title: `Zalando Frontend Interview Process and Practice` (47). H1: `Zalando Frontend Interview Questions and Process`.
- Description: `What Zalando publishes about its hiring loop and what public reports add for frontend roles: a Codility take-home, its review, JS fundamentals and system design rounds.`
- Subtitle: Zalando publishes two process pages; public reports from 2019 to 2024 add the Berlin frontend loop: a 2 to 3 hour Codility take-home, a hiring manager call, then a final day that reviews the take-home and covers JS fundamentals, system design and a manager conversation.
- What public reports describe:
  - Official pages: a 30-minute talent acquisition call, a case study or coding exercise, 45 to 60 minutes with the hiring manager, then a final round of three to five interviews of 45 to 60 minutes; the 2023 blog describes coding, system design and general technical interviews of an hour each over two to three weeks.
  - Reports: a Codility take-home of two to three hours (a React and Node app in 2024, algorithm tasks in 2022, React plus API design due in three working days in 2020); a hiring manager conversation that is sometimes non-technical; a final day with a 45-minute take-home review, an hour of JavaScript fundamentals with two senior frontend engineers, live coding in some loops, an hour of system design and 45 minutes with the engineering manager. Berlin only.
- How to prepare with this grouping: `react-autocomplete-search-starter`, `js-debounce` (free; the reported search box and debounce); the free trivia from the 2024 account (`js-deferred-scripts`, `html-parsing-rendering`, `web-performance-optimize-load-time`, `css-cascade-order`, `html-aria-roles`, `js-prototypal-inheritance`, `js-cookie-options`, `js-xss-dom-sinks`, `js-tree-shaking`) and the other free trivia tags; `realtime-search-debounce-cache` (premium; practice version); `js-memoize-function`, `react-shopping-cart` (premium; editorial groupings).
- FAQs: Is the take-home a React app? (The 2024 account built a React and Node search box; earlier accounts had algorithm tasks.) Does the hiring manager come before or after the challenge? (The two official pages disagree.) How long does it take? (Two to three weeks per the 2023 blog.)
- Do not write: Prepfully "verified" claims; any Taro account (Taro has no Zalando pages).

## 10. Airbnb (`/companies/airbnb/preview`)

5 tagged items; no process table; no public reports; one official page.

- Title: `Airbnb Frontend Interview Practice and Official FAQ` (51). H1: `Airbnb Frontend Interview Practice`.
- Description: `A small Airbnb frontend practice grouping with the official Airbnb careers FAQ. No public frontend interview reports have been read for this page yet.`
- Subtitle: Three coding and two concept items grouped under Airbnb, plus the official careers FAQ. This page grows when public frontend interview reports can be read in full.
- Intro, from the official FAQ: the process can involve a test, a video or an event, candidates meet several members of the team, response times are stated, and the page warns about recruiting scams.
- What public interview reports describe: not rendered.
- How to prepare with this grouping: `js-closures`, `js-event-loop` (free); `react-chips-input-autocomplete`, `angular-chips-input-autocomplete`, `vue-chips-input-autocomplete` (premium; editorial groupings).
- FAQs (two): Why is this page short? (No public frontend interview report for Airbnb has been read in full yet.) Does Airbnb publish interview guidance? (The careers FAQ, linked in the official pages table.)
- Do not write: any process claim; language that implies reports exist.

## Order of work

1. This document and its router rule.
2. The link layer, one commit per surface: home list, company sibling section, sourced-item links, footer (optional).
3. The editorial notes layer with an empty registry, plus the company reports access fix.
4. One content commit per company, in this order: Walmart, ByteDance, Microsoft, Tesla, Booking.com, Zalando, Stripe, Uber, Apple, Airbnb. Each commit adds the registry entry, the slug in `EDITORIAL_NOTE_COMPANIES`, the `llms.txt` line, a smoke row and an e2e case.
5. After deploy: Search Console indexing requests for the ten pages, then the 4 to 6 week readout alongside the process-table readout.

## Status

| Step | State | Notes |
|---|---|---|
| 1. Plan document | done 2026-10-21 | |
| 2. Link layer | pending | |
| 3. Editorial notes layer | pending | |
| 4. Company entries | pending | |
| 5. Indexing requests and readout | pending | |
