# Company pages: Search Console improvement plan, October 2026

> Written on 2026-10-22 from the Search Console read of the same day (performance data through 2026-10-21, Page indexing data dated 2026-10-12, sitemap last read 2026-10-21). Scope: the 26 live `/companies/<slug>/preview` pages and the `/companies` hub. Nothing in it is implemented. It proposes no new company pages; those follow the candidate selection rule in `company-pages-plan-2026-10.md` and need a separate yes each. Three other plans touch the same pages: `company-pages-factual-fixes-plan-2026-10.md` (waves 1 to 4 done on dev, not pushed), `company-pages-template-thin-plan-2026-10.md` (proposed) and `company-sources-followup-plan-2026-10.md` (not started). Where a step here overlaps one of them, this document points to it instead of repeating it.

## Why

The companies section is the fastest-growing click source on the site and the one with the best click-through rate, on a tiny number of impressions. The pages that convert are the ones without a process table, and the pages with the most impressions do not convert at all. The cheapest moves are therefore to finish the converting pages, to get the never-crawled pages crawled, and to stop reading noise.

### What the section does

Search Console, Web, `sc-domain:frontendatlas.com`, page filter `/companies/` (the hub `/companies` is excluded by the trailing slash and is covered separately below).

| Window | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| 90 days, 24 Jul to 21 Oct | 23 | 838 | 2.7% | 20.5 |
| Previous 90 days | 2 | 362 | 0.6% | 12.4 |
| 28 days, 24 Sep to 21 Oct | 13 | 158 | 8.2% | about 14 (impression-weighted from the page rows) |
| Previous 28 days | 4 | 194 | 2.1% | |

Site-wide the last 28 days had 89 clicks on 11,202 impressions, so company pages took 15 percent of the clicks from 1.4 percent of the impressions. 114 of the 838 impressions in 90 days are `site:frontendatlas.com` checks, so the real figure is about 720.

### Per page

Covered means the company has a GreatFrontEnd company guide or a Front End Interview Handbook company page; those eleven pages collected 779 impressions and 12 clicks in 90 days, all 12 on OpenAI and Netflix.

| Page | 90d clicks | 90d impressions | 90d position | 28d clicks | 28d impressions | 28d position | Covered | Process table |
|---|---|---|---|---|---|---|---|---|
| openai | 9 | 202 | 16.9 | 1 | 29 | 19.7 | yes | no |
| elevenlabs | 9 | 38 | 10.7 | 9 | 38 | 10.7 | no | no |
| netflix | 3 | 202 | 15.9 | 1 | 22 | 6.6 | yes | no |
| intuit | 1 | 12 | 39.9 | 1 | 12 | 39.9 | no | yes |
| waymo | 1 | 9 | 7.3 | 1 | 9 | 7.3 | no | no |
| google | 0 | 171 | 22.2 | 0 | 17 | 16.5 | yes | yes |
| amazon | 0 | 115 | 34.4 | 0 | 7 | 14.9 | yes | yes |
| apple | 0 | 62 | 28.0 | 0 | 5 | 19.6 | yes | yes |
| microsoft | 0 | 9 | 3.8 | 0 | 5 | 2.6 | yes | yes |
| airbnb | 0 | 7 | 4.9 | 0 | 4 | 5.3 | yes | no |
| uber | 0 | 7 | 7.9 | 0 | 6 | 4.5 | yes | yes |
| bytedance | 0 | 4 | 4.3 | 0 | 4 | 4.3 | yes | yes |
| stripe | 0 | 0 | | | | | yes | yes, never crawled |
| meta | 0 | 0 | | | | | yes | yes, never crawled |
| datadog, servicenow | 0 | 0 | | | | | no | yes, live since 2026-10-14 |
| walmart, tesla, revolut, spotify, booking-com, zalando | 0 | 0 | | | | | no | yes, live since 2026-10-19 |
| jpmorgan, agoda, xai, shopee | 0 | 0 | | | | | no | yes, live since 2026-10-21 |

Readings:

- Clicks come from authored pages on uncovered companies within days of going live (ElevenLabs 9 clicks on 38 impressions, 24 percent CTR) and from the two covered pages that carry their own copy (OpenAI, Netflix). Covered pages on the notes template sit at positions 15 to 35 and do not turn impressions into clicks.
- The two covered pages that convert are also the two authored pages without a process table and without a "what the public accounts describe" block. The OpenAI page is the thinnest authored page on the site in raw text.
- Netflix's 28-day position of 6.6 is a query-mix effect: impressions fell from 63 to 22 while the remaining queries rank higher. Do not read it as a ranking gain.
- Positions across the filter moved from 12.4 to 20.5 while impressions grew from 362 to 838: more queries at lower positions, the same pattern as the whole site.
- Backlinks play no part: the Links report (138 links, 47 sites, unchanged since 2026-10-18) lists no company page among its top targets.
- Internal links are no longer the gap found in the 2026-10-21 audit: every preview carries the 25-link sibling directory, the home page and the hub link all 26, tagged items link back (the AI chat textarea design links OpenAI), the footer links the hub.

### Queries (90 days, visible rows only)

Visible queries carry 177 of the 838 impressions and 2 of the 23 clicks; the rest is anonymised, so query rows describe intent, not volume.

| Query | Clicks | Impressions | Position | Previous 90 days |
|---|---|---|---|---|
| openai frontend interview | 2 | 16 | 13.9 | 5 impressions at 11.4 |
| google front end engineer interview | 0 | 8 | 39.8 | 1 at 35 |
| google frontend interview questions | 0 | 7 | 26.4 | 3 at 16 |
| amazon front end engineer interview | 0 | 4 | 43.5 | |
| google frontend interview | 0 | 3 | 37.7 | 20 at 21.4 |
| openai interview questions | 0 | 3 | 70.3 | |
| elevenlabs interview process | 0 | 1 | 29 | |
| openai online assessment | 0 | 1 | 16 | |
| openai interview preparation | 0 | 1 | 47 | |
| how to prepare for openai interview | 0 | 1 | 49 | |
| apple frontend interview experience | 0 | 1 | 24 | 1 at 39 |
| google frontend interview experience | 0 | 1 | 24 | |

Process intent ("process", "online assessment", "how to prepare", "experience") already produces impressions on the pages that have no table. The Google page lost its head query: "google frontend interview" went from 20 impressions at 21.4 to 3 at 37.7.

### Other state

- Generative AI features report, 90 days: 2,364 impressions over 211 pages site-wide; no company page is among the 20 most cited pages.
- Page indexing (data dated 2026-10-12): no company page in "Crawled, not indexed"; Meta and Stripe in "Discovered, not indexed" and "unknown to Google" respectively, both in the sitemap since February and March 2026. Indexing was requested for both on 2026-10-21 together with Amazon, Walmart, Tesla, Google, Apple, ByteDance, Uber and Microsoft.
- Sitemap: read on 2026-10-21 with 432 URLs; the live file has 436, so the four pages from PR #241 were not yet in the read copy.
- Last crawls seen in URL Inspection on 2026-10-21: Uber 2026-07-19, ByteDance 09-18, Microsoft 10-03, Apple 10-10, Amazon 10-11, Google 10-13, Walmart and Tesla 10-19. Company pages are recrawled every 3 to 12 weeks, so a change stays invisible for weeks without a request.
- `/companies` hub, 90 days: 42 visible impressions, 40 of them `site:`; two one-impression queries at positions 74 and 79. The hub is an internal-linking page (370 inlinks target it), not a search landing page.

## Rules

- **Evidence.** Every table row cites a source read in full; thin pages say "in one account" or "reports" in the stage text, as the Tesla and Walmart entries already do. Never Glassdoor, 1point3acres, Prepfully or Dataford; Taro labels carry no cities and use "Taro (approx.)" for placeholder-dated accounts (factual fixes wave 3). Blind commenters are marked as commenters, recruiter plans as plans.
- **Re-dating.** A per-company edit (a content module, a process entry, a notes entry) re-dates that page only. A template edit (the shared preview html, shared strings, the trust line) re-dates all 26 pages. Ship the template work of the thin plan in the same deploy window as the per-page work here, then request indexing once per page.
- **Pins.** `frontend/e2e/seo-ssr.spec.ts` lists the companies with tables (`COMPANIES_WITH_PROCESS_TABLES`), asserts that airbnb, netflix, openai, elevenlabs and waymo have none, and checks placement, heading, table count, official and report anchors per `INTERVIEW_PROCESS_CASES` entry. `frontend/scripts/seo-smoke.mjs` pins titles, descriptions and headings (Netflix headings included). `company-interview-processes.spec.ts` checks evidence labels (about 28 characters so the Evidence column does not wrap at 360 px). Titles stay unchanged in this plan; `frontend/src/llms.txt` pins them too.
- **Measurement.** Read per page with the two-day lag, never from the 24-hour view. Drop `site:` rows before computing CTR. Compare 28-day windows with the baseline table above. Read the Generative AI features report per page as well. Query rows describe intent only.
- **Indexing requests.** About 10 requests a day before "Kota Aşıldı". Inspect first and request only when the last crawl predates the deploy. The user approves the requests per session.

## Step 0: baseline

This document. Done on 2026-10-22.

## Step 1: OpenAI process table and account block

Why first: the best covered page (202 impressions, 9 clicks in 90 days), the only visible query family with clicks ("openai frontend interview", position 13.9), process-intent queries landing at positions 16 to 49, and no table. The research exists: `company-interview-processes-2026-10.md`, OpenAI section (official page OA-O1 read on the Wayback copy, accounts OA1 to OA7, a proposed table marked thin).

Changes:

1. **Registry entry.** Add `openai` to `frontend/src/app/shared/company-previews/company-interview-processes.ts` from the proposed table: résumé review of about one week (OA-O1); recruiter or hiring-manager call (OA-O1, OA1, OA2, OA6 as a plan, OA7); technical screen in two parts, refactor or fix existing JavaScript or a React exercise in CoderPad, then a system design or architecture round (OA1, OA2, OA3 as a commenter, OA5 as a plan); the 2026 agentic coding alternative, 60 minutes in a Python codebase with AI tools (OA6 as a plan); final interviews of 4 to 6 hours with 4 to 6 people over 1 to 2 days, with one 2023 full-stack account adding a project presentation and mixed design and frontend coding (OA-O1, OA4); decision within a week and references (OA-O1). `summary` states that only the screens are confirmed for frontend roles and that no frontend account describes the final loop; `caveat` carries the LeetCode disagreement (a 2024 recruiter: "absolutely no leetcode style"; OA2: no LeetCode for FE; a full-stack commenter expected one). `checkedAt` is the day OA-O1, OA2 and OA6 are re-read before the commit. Practice link: `/system-design/ai-chat-textarea-design`, the OpenAI-tagged case.
2. **Placement.** The OpenAI branch of `frontend/src/app/features/company/company-preview/company-preview.component.html` keeps its own layout; render the table between the study-focus section (`id="openai-study-focus"`) and the prompts (`id="openai-prompts"`), the same position as Amazon and Google (context first, table, then prompts).
3. **Account block.** Under the study-focus section add two or three paragraphs on what the public accounts describe: the two-part technical screen, the 2026 agentic-coding option, the absence of a frontend account for the final loop, and the one-year cooldown reported in OA2. Keep the trust note. This gives the page the structure the Google and Netflix branches already have ("what the company publishes and what you still need to confirm").
4. **Description.** Shorten the 171-character description to the thin plan's Step 6 wording (160 or fewer). Title unchanged.
5. **Tests.** Move `openai` from the "no table yet" list into `COMPANIES_WITH_PROCESS_TABLES`; add an `INTERVIEW_PROCESS_CASES` entry (heading "OpenAI frontend interview process", one table, `after: 'id="openai-study-focus"'`, `before: 'id="openai-prompts"'`, `officialUrl` the openai.com interview guide, `reportUrl` one Blind account, `practicePath` the AI chat textarea design). Update the smoke description pin if the OpenAI description is pinned. Extend `company-interview-processes.spec.ts` coverage for the new entry.

Expected result: a snippet that answers process queries, the "openai frontend interview" family moving from 13.9 towards the first page, and clicks on process-intent queries that today land at positions 16 to 49. Readout: Step 8.

Risk: the evidence is thin and the openai.com page answers 403 to our tools. Every row carries its label; the official row links the live URL as `company-official-guides.ts` already does. If the re-read of OA-O1 fails, the table ships with the account rows only and the official rows wait.

## Step 2: Netflix process table and re-dated source note

Why: 202 impressions and 3 clicks in 90 days, the same structural gap as OpenAI, and a source note dated July 2026 on the page. Research: `company-interview-processes-2026-10.md`, Netflix section (official pages NF-O1 and NF-O2 for new graduates and interns, accounts NF1 to NF8, a proposed table that asks for "one account" or "reports" on every row).

Changes:

1. **Registry entry** with two variants, as Walmart has: experienced frontend and UI engineers (recruiter screen with light technical questions: NF2, NF4, NF5 plan, NF6 commenter; hiring manager screen before the technical rounds: NF2, NF4 commenter, NF6 commenter, NF8; a one-hour live JavaScript screen with several small tasks: NF3, with NF5 and NF6 as plan and commenter; a take-home reviewed in the onsite in 2020 and older loops: NF2, NF6; an onsite of one coding interview, a take-home review and two behavioural interviews in 2020, two technical and two behavioural in a 2024 plan: NF2, NF5, NF6) and new graduates and interns (a take-home assessment, then two rounds or about two to three, with questions on the culture memo: NF-O1, NF-O2). `summary` opens with the Netflix-badged commenters' statement that each team runs its own process. `caveat` lists the order differences, take-home versus live screen, and "no LeetCode" (NF2, NF7) against "possibly DS/A" (NF5). Do not use the search-summary claim about the Warsaw account (the Taro text has no take-home or all-day onsite).
2. **Placement.** The Netflix branch is driven by `frontend/src/app/features/company/company-preview/netflix-preview-content.ts`; render the table after the published-context section (`id="netflix-published-context"`) and before the prompts (`id="netflix-practice-prompts"`).
3. **Source note.** Re-date "Source boundary · reviewed July 2026" with the commit (thin plan Step 6) and let it mention the table.
4. **Tests** as in Step 1. Title, description and the pinned headings stay unchanged.

Expected result: a page that answers "netflix frontend interview" process intent, which today produces impressions at positions 18 to 38 and no clicks. Readout: Step 8.

## Step 3: ElevenLabs thin table

Why: the only page converting at scale (24 percent CTR), one process-intent impression already ("elevenlabs interview process", position 29), no table. Research: ElevenLabs section (official FAQ EL-O1, accounts EL1 to EL5, a proposed table marked thin; EL2 reads like an edited summary and is labelled so). The factual fixes wave 2 (d34c70c0) already corrected the React and algorithm detail on the guide; the table must follow that wording.

Rows: recruiter call (EL-O1, EL1, EL2, EL3, EL5); coding assessment whose format varies, a 90-minute assessment, an async CoderPad task with LeetCode plus React, a Python LeetCode round or a take-home (EL1 to EL5); a live technical round fixing a practical problem or building a component with an engineer (EL1, EL3, EL4); a product or decomposition interview (EL2, EL5); a final conversation with a founder, the CTO or a Bar Raiser (EL-O1, EL3, EL5). Role label: full-stack, frontend-leaning engineers, 2024 to 2026. Keep the title; the page is working. Move `elevenlabs` into `COMPANIES_WITH_PROCESS_TABLES` and add a case entry.

## Step 4: Waymo thin table

Why: 1 click on 9 impressions at position 7.3 in its first days, no table, and an official how-we-hire page with concrete stage text. Research: Waymo section (WM-O1 official, WM1 a PracHub-curated senior frontend account, WM2 a software engineer loop with a UI round, WM3 a Waymo-badged commenter, WM4 an intern).

Rows: a sourcer or recruiter conversation (WM-O1, WM2); one or two behavioural or technical phone or video interviews, a tree filter in the one frontend account (WM-O1, WM1); a virtual onsite of up to five 45-minute interviews, four frontend rounds in the one account: Angular debugging from user-reported issues, a Promise question in plain TypeScript, an AI chat system design, an autocomplete with debounce (WM-O1, WM1); a hiring-manager round and an algorithms round in the software-engineer loop (WM2). `caveat`: "varies based on the interviewer" (WM3) and the official rule that AI tools are not permitted unless the instructions say so. Only the preview changes; the premium Waymo pages stay `noindex`.

## Step 5: Airbnb

Handled by the thin plan, Step 4 (author the page from AB1 to AB8, add the table, switch the metadata to the process pattern, or `noindex` it until then). This plan adds only the measurement: Airbnb had 7 impressions and no click in 90 days at position 4.9, so the baseline is effectively zero and any click after the rewrite is signal.

## Step 6: crawl and index sweep

1. Around 2026-10-28, inspect Meta and Stripe. If Meta is still "Discovered, not indexed" and Stripe still unknown, request again; both are in the sitemap and linked from the home page, the hub and 25 sibling pages, so there is no structural reason left for Google to skip them.
2. Request indexing, inspect-first, in this order and over two sessions: booking-com, revolut, spotify, zalando, datadog, intuit, servicenow, elevenlabs, jpmorgan, agoda, xai, shopee. The first eight were queued on 2026-10-21; the last four went live with PR #241 and were missing from the sitemap copy Google read that day.
3. After the next main deploy that carries the factual fixes waves 1 to 4, Steps 1 to 4 here and the thin plan's template commit: request the changed pages again, starting with openai, netflix, elevenlabs, waymo, airbnb and google, then the rest in the order of the baseline table.
4. Watch Page indexing for any company page entering "Crawled, not indexed" (none today) and for the two "Discovered" pages leaving that list. Check that the next sitemap read shows 436 URLs.

## Step 7: Google page, hold and measure

The page is covered by GreatFrontEnd and the Front End Interview Handbook, its table went live on 2026-10-20, Google last crawled it on 2026-10-13 and indexing was requested on 2026-10-21. No content work before the recrawl shows the table. Readout on 2026-11-05: positions for "google frontend interview", "google frontend interview questions" and "google front end engineer interview". If they stay at 30 or worse with the table indexed, the only remaining lever is the H2 and metadata treatment of the thin plan (Step 1 and Step 6 there); the candidate rule says not to spend more on covered companies.

## Step 8: readouts

| Date | What to read | Threshold that counts as working |
|---|---|---|
| 2026-10-28 | URL Inspection for Meta, Stripe and the ten pages requested on 2026-10-21 | both Meta and Stripe indexed or at least crawled |
| 2026-11-05 | 28-day page rows for all 26 pages, Google head queries, the pages that went live on 10-14, 10-19 and 10-21 | ElevenLabs at 5 or more clicks per 28 days; at least one click on a 10-19 or 10-21 page |
| two weeks after the deploy of Steps 1 to 4 | OpenAI, Netflix, ElevenLabs, Waymo page rows and their visible queries | process-intent queries appear in the visible rows for OpenAI and Netflix |
| six weeks after that deploy | the same rows against this document's baseline | OpenAI at 4 or more clicks per 28 days (baseline 1), Netflix at 2 or more (baseline 1), "openai frontend interview" on the first page, ElevenLabs holding 5 or more |

If a threshold is missed, record it here and stop investing in that page; the readout decides, not the plan.

## Not in this plan

- **Renaming `/companies/<slug>/preview`.** It would need 26 redirects, new pins in the smoke, SSR, sitemap and link-equity tests and re-dates for every page, and there is no evidence the suffix costs rankings: OpenAI and ElevenLabs rank and convert with it.
- **New company pages.** They follow the candidate selection rule and need a separate yes each. The next research round named there is Anduril, Brex, Jane Street, Sierra, Perplexity, Lovable, Suno and Glean.
- **Rewriting the nine covered notes pages.** They are dead weight for clicks; the thin plan's Steps 2 and 3 remove their template signals at template cost, which is the right scope for them.
- **Hub page SEO.** 42 impressions in 90 days, 40 of them `site:` checks. It stays an internal-linking page.
- **Chasing `site:` or agent-style queries.** They never click; exclude them from every readout.

## Verification

Per step: the Karma specs for `company-preview`, `company-interview-processes`, `authored-company-previews` and `company-editorial-notes`; `npm run lint:design-system:strict` when html or css changes; `npm run gen:seo` (pending count 1 for a per-company commit); `rm -rf dist && npm run verify:seo-prerender-guard` (smoke pins); `PLAYWRIGHT_WEB_SERVER=1 npm run test:e2e:critical`; the seo-ssr extended suite for `COMPANIES_WITH_PROCESS_TABLES`, the "no table yet" list and the `INTERVIEW_PROCESS_CASES` entries; the 360 px reflow check for the Evidence cells; `npm run lint:text` and cspell (pre-push); `node scripts/gen-data-version.mjs --check` before the commit. After deploy: the raw HTML of each changed page shows `data-testid="company-interview-process"`, then the Step 6 requests.

## Build notes, 2026-10-22

- Every cited page was re-read before the entries were written (Taro, Blind, Aced, PracHub and the official pages through WebFetch; the OpenAI guide on the Wayback copy with curl; the two LeetCode accounts through the GraphQL API). Three research-doc claims failed the re-read and are not used: the Netflix "no leetcode at any stage" line (a Disney Streaming Services commenter), the OpenAI one-year cool-down and "no LC for FE" lines, and the Waymo "My phone interview was leetcode" line. `company-interview-processes-2026-10.md` carries dated corrections in the affected rows.
- Verified before the commit: 66 targeted Karma specs, the inventory node tests (33, two fixtures updated for the new entries), `npm run lint:design-system:strict`, `npm run lint:text`, `npm run lint:questions:check`, `npm run gen:seo` (pending = the four pages only), the prerender guard on a clean dist (build, meta check, perf contract, link audits, smoke), the SSR and editorial-correctness suites in `PLAYWRIGHT_SSR=1` mode (148 passed) and the critical suite (95 passed). The pre-commit hook ran 47 more specs.
- Not verified: the live pages after deploy, Search Console indexing of the four pages (Step 6), and the mobile reflow of the longer Waymo and Netflix rows on a real device (the SSR reflow test covers 360 px).

## Status

| Step | State | Date |
|---|---|---|
| 0 Baseline | done | 2026-10-22 |
| 1 OpenAI | built on dev as 01d70726, not pushed: registry entry (6 stages, OA-O1 plus OA1 to OA7), source-boundary note before the table, description 153 characters | 2026-10-22 |
| 2 Netflix | built on dev as 01d70726: two variants (experienced hires from NF2 to NF6 and NF8, new graduates and interns from NF-O1 and NF-O2), source note re-dated | 2026-10-22 |
| 3 ElevenLabs | built on dev as 01d70726: five stages from EL-O1 and EL1 to EL5, no locations, Taro accounts labelled approximate | 2026-10-22 |
| 4 Waymo | built on dev as 01d70726: two variants (frontend loop from WM-O1, WM1, WM3, WM4; the 2026 software engineer loop from WM2) | 2026-10-22 |
| 5 Airbnb | see the thin plan, Step 4 | 2026-10-22 |
| 6 Crawl and index sweep | proposed; first check 2026-10-28 | 2026-10-22 |
| 7 Google | hold; readout 2026-11-05 | 2026-10-22 |
| 8 Readouts | scheduled | 2026-10-22 |
