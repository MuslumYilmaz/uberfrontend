# Company pages: template look and thin-content improvements, October 2026

> Proposed plan written on 2026-10-22 from the audit in `docs/audits/company-pages-factcheck-2026-10-22.md`. Nothing in it is implemented; the user asked for the plan first and will decide when to apply it. Wrong and unsupported facts are handled by a separate plan, `company-pages-factual-fixes-plan-2026-10.md`; the two overlap only on Airbnb and on metadata.

## Why

All 26 `/companies/<slug>/preview` pages were fetched from production on 2026-10-22 and their visible text compared line by line (header, mega menu and footer excluded; the 25-link sibling directory excluded from the shared-line figures).

| Kind | Pages | Unique words | Lines shared with another company page |
|---|---|---|---|
| Authored guides | 13 | 2,273 to 6,272 | 9 to 16 percent |
| Generic with own copy (Google, Netflix, OpenAI) | 3 | 1,046 to 2,410 | 7 to 11 percent |
| Editorial-notes pages on the generic template | 10 | 343 to 1,309 | 31 to 51 percent |

The body copy is unique on every page. What reads as a template is (a) one H2 skeleton on the authored pages with only the company name swapped, (b) about 250 to 460 identical words per notes page in the free/premium boxes, the sample-prompt rows and the trust line, and (c) three notes pages with under 800 unique words, Airbnb (343), Apple (655) and Stripe (748), all three covered by GreatFrontEnd and Front End Interview Handbook and all three without a click in 90 days. Google does not penalise a consistent layout when the main content is unique, so the aim is to remove the find-and-replace signals and to raise the unique share on the notes pages, not to redesign the pages.

## What repeats today

- **Authored H2s (13 pages).** "Prepare for product judgment, not X trivia", "What the public accounts establish, and what you still need to confirm", "Two product contexts for practising transferable frontend judgment", "Five X frontend interview practice questions", "Scope the ... before writing the first line", "A 7-day X frontend interview preparation plan", "Common X frontend interview preparation questions", "Build the underlying skills with free practice", "Sources and evidence limits", "Official preparation pages from X", "Continue with the full X practice set". The titles follow "X Frontend Interview Questions: N Prompts + Prep Guide" and the descriptions "Prepare for a(n) X frontend interview with N practice prompts ...". Every heading is a `title` field in `frontend/src/app/shared/company-previews/<slug>-preview-content.ts`; Google and Netflix carry the same headings hard-coded in their branches of `frontend/src/app/features/company/company-preview/company-preview.component.html` (lines 280, 370, 390, 487, 517, 537, 558).
- **Notes-page blocks (10 pages).** "What you can do now for free" and "What unlocks with premium" (component html lines 839 and 848, three identical bullets each), "Sample FrontendAtlas practice prompts" (line 859), the per-row lines "Previewed here; the full practice set requires Premium." and "Available from the public Question Library.", the counts line "Free in sample: N · Locked in full set: M", and the screen-reader text "Additional metadata: Kind: ..." on every row (`fa-question-row__sr-meta`, not visible, harmless).
- **All 26 pages.** The sentence "Editorial practice groupings, not verified official interview questions or endorsements." is the first visible text, before the H1. It comes from `frontend/src/app/core/content/public-editorial-facts.ts` and is pinned by the public-trust regression tests.

## Rules for the changes

- Template-level edits (the component html, shared strings, the trust-line position) re-date every company page once through the SEO inventory. Batch them in one commit and expect `gen:seo` to report all company pages pending.
- Per-company edits (a content module, one `COMPANY_EDITORIAL_NOTES` entry, one process-table entry) re-date only that page.
- Keep the trust sentence's wording; move it. Rewording it touches `public-editorial-facts.ts` and the trust regressions.
- Editorial notes rules (`company-editorial-notes.spec.ts`): title 60 characters or fewer and unique, description 70 to 160, no apostrophes, no always/never/guaranteed/every candidate, free steps before premium, two or three FAQs.
- Renamed authored titles are pinned in `frontend/scripts/seo-smoke.mjs`, `frontend/e2e/seo-ssr.spec.ts` and `frontend/src/llms.txt`.
- `ui-visual.spec.ts` shoots the viewport top, so moving the trust line shifts every company baseline (Linux through the UI Regression workflow with `update_baselines`, darwin with `--update-snapshots=changed`).

## Step 1: company-specific H2s on the authored pages

Rule: an H2 names something only that page has (a lens, a prompt subject, a reported round). Keep the structural headings that describe a section's function ("Sources and evidence limits", "Official preparation pages from X", the prompt-count heading, the plan and FAQ headings). Replace the two that read as slogans on every page, `studyFirst.title` and `roleLenses.title`, and drop the word "trivia". Drafts to adjust at implementation:

| Page | `studyFirst.title` | `roleLenses.title` |
|---|---|---|
| waymo | What the Waymo frontend loop rewards: tree logic, Angular debugging and chat UI design | Simulation tooling and operations dashboards as practice contexts |
| elevenlabs | What ElevenLabs loops reward: timed delivery and audio interface judgment | Creator tools and the developer platform as practice contexts |
| datadog | What Datadog loops reward: live data tables, log views and CoderPad speed | Dashboards and live data views as practice contexts |
| intuit | What Intuit loops reward: the craft demo and AI-assisted product screens | Data-entry screens and AI-assisted features as practice contexts |
| servicenow | What ServiceNow loops reward: polyfills with edge cases and platform UI fundamentals | Workflow screens and the platform UI runtime as practice contexts |
| amazon | What the Amazon Front End Engineer loop rewards: UI builds, design objectives and Leadership Principles | Seller tools and the shopping experience as practice contexts |
| meta | What the Meta Front End Engineer loop rewards: plain JavaScript utilities and DOM work | Utilities, built-ins and component design as practice areas |
| revolut | What Revolut loops reward: a one-hour fetch-and-render task and the Bar Raiser | Customer-facing web products and internal web apps as practice contexts |
| spotify | What Spotify web loops reward: a fetch-to-DOM build and the values conversation | Internationalisation and internal business tools as practice contexts |
| jpmorgan | What JPMorgan Chase team loops reward: generic hooks, polyfills and secure data screens | Secure data-handling screens and AI-assisted interfaces as practice contexts |
| agoda | What Agoda loops reward: a hotel search page, a React take-home and web fundamentals | Booking surfaces and partner tools as practice contexts |
| xai | What xAI loops reward: a chat interface in a one-hour pairing session and a 45-minute TypeScript app | Chat products and AI composers as practice contexts |
| shopee | What Shopee loops reward: Promise from scratch, a hover menu and HTTP fundamentals | Campus and social hiring tracks as practice contexts |

Google and Netflix get the same treatment in the component html (two headings each). The meta descriptions keep their pattern; only the xAI, OpenAI and JPMorgan metadata change (Step 6).

Cost: one commit per page, 13 plus 2. Each re-dates its own page only.

## Step 2: shrink the shared blocks on the ten notes pages

1. **Free and premium boxes** (html lines 839 and 848). Make them data-driven: optional `freeNow: string[]` and `premiumUnlocks: string[]` on the notes entry, naming the actual free and premium items of that page (the prep steps already list them), with the current three generic bullets as the fallback for pages without an entry. Saves about 100 identical words per page.
2. **Row copy.** Replace "Previewed here; the full practice set requires Premium." and "Available from the public Question Library." under every sample row with the Free or Premium chip that the row already carries, and keep one sentence under the list heading ("Free items open in the Question Library; premium items need a plan."). Saves 8 to 10 identical lines per page.
3. **List heading** (line 859). "Sample FrontendAtlas practice prompts" becomes "Practice items grouped under X"; the counts line stays.
4. Leave the hero chip row, the kickers and the sibling directory as they are.

All four are template-level: one commit together with Step 3.

## Step 3: trust-line placement

Keep the sentence, move it from above the H1 to directly under the hero subtitle (or into the chip row as a muted note) on all company pages. The first visible text of each page then becomes the breadcrumb and the H1, which is what Google tends to use for the snippet when the description does not match the query. Template-level; ships with Step 2; needs the UI baseline refresh.

## Step 4: Airbnb

Decision to take: author the page from the eight sources already read (AB1 to AB8 in `docs/references/company-interview-processes-2026-10.md`, read in full on 2026-10-20), or `noindex` it until then. Recommendation: author it; the sources exist, the official FAQ row exists, and the page currently contradicts the research record in four places (factual plan, wave 1).

- Add `reportsDescribe` paragraphs: a technical screen where the tests must pass (AB2, 2024), UI coding in React or plain HTML, CSS and JavaScript (AB1 2022: a simple React component, the architecture of a mock chat app, the UI of a simple card game; AB6, AB8), one LeetCode-medium algorithm question and one architecture question in an L5 loop (AB3, an Airbnb-badged commenter), and an experience round. Mark Blind commenters as commenters.
- Add an Airbnb entry to `company-interview-processes.ts` from the doc's draft rows (technical screen; onsite UI coding; algorithms; architecture; experience), evidence labels at 28 characters or fewer, no Taro cities.
- Replace the four "no report read" statements and the hero count sentence (factual plan W1.1).
- Switch the metadata to the process pattern: title "Airbnb Frontend Interview Process and Practice Questions" (56), description along the lines of "How two public Airbnb frontend accounts and the official careers FAQ describe the loop: a technical screen with passing tests, React and plain JavaScript UI coding, and architecture questions." (within 160).
- Do not tag catalog items unless a reported shape matches one; the chips input stays an editorial grouping and says so.
- Expected result: unique words from 343 to roughly 900, a process table, and a page that no longer announces its own thinness in the SERP.

If the page is not authored this month, publish `noindex` for airbnb through the SEO publisher and drop it from the sitemap until it is.

## Step 5: Apple, Stripe and Microsoft

- **Apple.** Add the official interview-tips row (factual plan W1.2) and correct the copy. The AP1 to AP9 accounts already feed `reportsDescribe`; no new items.
- **Stripe.** Add the Taro Canada September 2025 account (three-part CoderPad exercise) to the technical-screen row and the notes (factual plan W2.6). Nothing more: the page is covered by GFE and FEIH, Google has not fetched it in eight months, and the follow-up plan's D6 says retire it only if it stays sourceless and impression-less.
- **Microsoft.** Take decision D1 from `company-sources-followup-plan-2026-10.md`: the snake game, chessboard and compare-two-objects items are grouped under Microsoft with no public account. Recommendation: remove the Microsoft tags from those items so the page lists sourced items and the official rows only (check the question-tags pins and the link-equity fixture counts before removing).

## Step 6: metadata and dated notes

- OpenAI description (171 characters) to 160 or fewer: "Practice for OpenAI frontend interviews: streaming chat UI, stale stream handling, optimistic React state, accessibility and conversation history design."
- xAI title: the rename to SpaceXSI is in the factual plan (W1.3). "xAI (now SpaceXSI) Frontend Interview Questions: 4 Prompts + Guide" keeps the 66-character length; "xAI (now SpaceXSI) Frontend Interview Questions and Guide" is 58 if the length matters.
- JPMorgan Chase title (62): keep, or "JPMorgan Chase Frontend Interview Questions: 5 Prompts" (55).
- Google "Current process note — reviewed July 2026": re-date and replace "upcoming" after the factual fix (W2.4). Netflix "Source boundary · reviewed July 2026": re-date when the page is next touched.

## Step 7: measure

Request indexing for every changed page after deploy, read Search Console per page at two and six weeks, and compare the ten notes pages' impressions before and after. Watch the Page indexing report for any notes page entering "Crawled – not indexed".

## Order of work

1. Step 4 (Airbnb) and Step 1 (authored H2s), one commit per page.
2. Steps 2 and 3 in one template commit, with the UI baseline refresh.
3. Steps 5 and 6.
4. Step 7 after the main deploy.

## Verification

Per page: `npm run lint:design-system:strict` when html or css changes, the Karma specs for `company-preview`, `company-editorial-notes` and `authored-company-previews`, `npm run gen:seo` (pending count 1 for a per-company commit, all company pages for the template commit), `rm -rf dist && npm run verify:seo-prerender-guard`, `PLAYWRIGHT_WEB_SERVER=1 npm run test:e2e:critical`, the seo-ssr extended suite for the `EDITORIAL_NOTE_CASES` marker order, `npm run perf:contract:strict`. Tag removals (Step 5) also run `lint:questions:check`, the question-tags and link-equity tests and the backend `generate:interview-content:check`.

## Status

| Step | State | Date |
|---|---|---|
| 1 to 7 | proposed, not started | 2026-10-22 |
