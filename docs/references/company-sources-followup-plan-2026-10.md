# Company sources follow-up plan, October 2026

Status: plan only. No development has started on any step. Written on 2026-10-15 from the findings in [company-sources-review-2026-10.md](company-sources-review-2026-10.md); the execution pattern (one company per step, lints, Karma, guard with a clean dist, SSR and critical e2e, backend re-pin) is the one in [company-pages-plan-2026-10.md](company-pages-plan-2026-10.md).

## What the review established

- Nine of the eleven pre-existing company pages now show the company's own preparation pages; Apple and Stripe publish none.
- 22 already-tagged items carry public interview report sources. The AI chat textarea case gained an OpenAI tag.
- Public accounts describe roughly 40 further question shapes for these companies. About half match catalog items that are not tagged for that company (several of them pinned by the backend registries); the other half have no catalog item at all.
- Microsoft's and Airbnb's coding tags (snake game, chessboard, chips input) have no public support. Stripe and Uber pages hold trivia only, and trivia cannot carry sources.

## Decisions to take before starting

| # | Decision | Options | Recommendation |
|---|---|---|---|
| D1 | What to do with tags that no public account supports (Amazon like button, snake, tic-tac-toe, chessboard, chips, dynamic counter; Microsoft snake and chessboard; Airbnb chips; Meta debounce, throttle, event emitter, merge sorted, palindrome, reverse string, maze, array sort, DOM renderer, transfer list; Apple delegated events, DOM walks, selector polyfills, median, merge sorted, reverse, anagram, dialog; Google add two promises, compose, curry, deep clone, deep equal, nested comments, image sliders, Angular two-way input) | keep as editorial groupings; remove; replace with reported shapes | Keep for now and make sourced items visible (Step 2). Removal shrinks Microsoft to trivia and Airbnb to nothing, which forces page retirements with redirects. Revisit after Steps 1 and 2 show how the pages read. |
| D2 | Whether new catalog items may be written for shapes reported at more than one company and absent from the catalog | none; the top three; all six | The top three in Step 8: promise retry with delay, flat list to tree, countdown timer. Each needs a separate yes because each is a new page. |
| D3 | Whether Amazon, Meta, Apple and Microsoft get authored guides like Waymo instead of the generic catalog preview | none; Amazon only; Amazon then Meta; all four | Amazon first (seven readable loop accounts plus the richest official page), then Meta. Apple and Microsoft only after the first two prove worth it in Search Console. |
| D4 | Whether sources get an optional `company` field so company pages can list reported rounds per item | yes; no | Yes. It is the cheapest way to make the sourcing work visible on the eleven pages without rewriting them. |
| D5 | Whether trivia items may carry sources | keep trivia source-free; extend the feature | Keep trivia source-free. The trivia pages strip reference blocks on purpose and the smoke suite rejects citations there; trivia evidence stays in the review document. |
| D6 | Stripe, Uber and Airbnb pages | keep generic and add sourced items; retire with redirects; author light pages | Keep generic and add the sourced items from Step 1. Retire only if a page still has no sourced coding item after Step 1 and shows no impressions by the next Search Console review. |

## Steps

### Step 0: decisions recorded in this document

Record the answers to D1 to D6 at the bottom of this file before Step 1 starts.

### Step 1: tag and source the strong matches on existing items (one re-pin batch)

Goal: every reported question that already has a catalog item is tagged for that company, with the public account as its source. Trivia items get the tag only.

| Company | Item | Action | Source (see registry below) | Pinned |
|---|---|---|---|---|
| Uber | js-concurrency-map-limit | tag uber, add source | U-LC-2022: mapLimit with a concurrency limit, senior front end phone screen | coding registry |
| Uber | css-position-relative-absolute-fixed, css-visibility-vs-display | tag uber (trivia, no source) | U-TARO-2025: the five position values; display none vs visibility hidden | no |
| Netflix | react-debounced-search | tag netflix, add source | N-TARO-2024: filter results dynamically from a REST API by input, 200 ms debounce discussion | coding registry |
| Google | react-autocomplete-search-starter | tag google, add source | G-LC-2021: "somewhat autocomplete" with string manipulation | no |
| Google | js-promise-all | tag google, add source | G-LC-2019: consolidate the results of a list of callback functions into one array | no |
| Google | react-nested-checkboxes, angular-nested-checkboxes, vue-nested-checkboxes | optional: tag google, add source | G-BLIND-2025: a reply lists "build nested checkbox" as a typical exercise; weaker than a loop account | coding registry (three variants) |
| Meta | js-array-prototype-map | tag meta, add source | M-TARO-2021: implement map from scratch | no |
| Meta | js-flatten-once | tag meta, add source | M-BLIND-2021: flatten an array in the Facebook screen | no |
| Meta | realtime-search-debounce-cache | tag meta, add companyEvidence and source | M-BLIND-2022: front-end system design of a specific component such as autocomplete | system-design registry |
| Amazon | react-pagination-table | tag amazon, add source | A-LC-2022: a paginated widget of addresses, five per page, previous and next | coding registry |
| Amazon | react-accordion-faq | tag amazon, add source | A-LC-LIST-2020: "Design Accordion (Amazon onsite)" in a community list, secondhand | no |
| Amazon | image-upload-preview | tag amazon, add companyEvidence and source | A-LC-2020-OFFER: design an image service in the system design round | system-design registry |
| Apple | css-theme-variables-dark-mode | tag apple, add source | AP-MEDIUM-2022: how would you do a light and dark theme | no |
| Apple | js-stack-queue-implementation | tag apple, add source | AP-MEDIUM-2022: design a stack with push, pop and getMin | no |
| Apple | js-secure-cors-handling, js-cookie-options | tag apple (trivia, no source) | AP-MEDIUM-2022: what is CORS; cookies vs localStorage | no |
| ByteDance | js-microtasks-vs-macrotasks, js-event-loop | tag bytedance (trivia, no source) | BD-BLIND-2023: setTimeout vs promises; output order of console.log statements | no |
| ByteDance | css-cascade-order | tag bytedance (trivia, no source) | BD-BLIND-2024: CSS specificity question in the first technical round | no |
| Airbnb | js-event-loop, js-closures | tag airbnb (trivia, no source) | AB-BLIND-2024: event loop and closures in a frontend-focused loop | no |
| Stripe | js-group-by, js-lodash-get | tag stripe, add source | S-LC-2024: traversing and manipulating JSON objects in the timed screen | js-group-by is pinned |
| Stripe | js-debug-async-race, js-debug-stale-closure-autosave | tag stripe, add source | S-TARO-2023: bug finding in an unknown project; debug items count for prerender, not for the directory card | no |

Card counts after the step (coding, trivia and system design only): Uber 2 to 5, Stripe 1 to 3, Airbnb 3 to 5, Netflix 12 to 13, Google 44 to 46 or 49, Meta 49 to 52, Amazon 52 to 55, Apple 33 to 37, ByteDance 18 to 21.

Re-pin batch at the end: coding registry for js-concurrency-map-limit, react-debounced-search, react-pagination-table, js-group-by and, if chosen, the three nested checkbox variants (definition and review hashes, the gold approval's registryContentHash with a dated note, the artifact pins, the runtime gate test literal); system-design registry for realtime-search-debounce-cache and image-upload-preview. Procedure and script pattern: Step 8 and Step 9 notes in the company pages plan.

Verification: lint:questions:check, lint:system-design:quality (companyEvidence parity), question-tags test, link-equity (card count equals catalog count), guard with a clean dist, SSR e2e, backend generate, validate, check and Jest.

Size: medium. One or two sessions.

### Step 2: make sourced items visible on the eleven pages

Goal: a reader of a generic company page can see which prompts come from public accounts and which are editorial groupings.

- Add an optional `company` (slug) field to `QuestionSource`; the question lint requires it to be one of the item's companies when present. Backfill every existing source (all current sources name one company in their label).
- On the generic catalog preview, render a "Reported in public interview accounts" block before the premium CTA: for each sample item with a source for this company, the item title and the source label as a nofollow link. Mark sourced sample rows with a small "Public report" chip; leave unsourced rows unchanged under the existing editorial disclaimer.
- Keep the authored branches unchanged; they already carry sources per prompt.
- Tests: question-sources lint test for the field, company preview spec for the block and chip, one SSR assertion on Amazon, smoke check that Apple shows the block only if it has sourced items.

Depends on Step 1 for useful coverage. Size: medium.

### Step 3: apply D1 to the unsupported tags

Goal: either confirm the editorial tags or remove them, per company, in one commit per company.

- If kept: no catalog change. Optionally add a sentence to the generic preview disclaimer that unsourced items are editorial groupings; the existing `COMPANY_PRACTICE_DISCLAIMER` already says this.
- If removed: untagging changes card counts, pinned registry hashes (tabs switchers, chips inputs, nested checkboxes and several Amazon items are pinned), the `/companies` directory and the sitemap; a page that drops to zero items disappears from prerender and the sitemap and needs the retirement procedure (retired manifest record and a redirect), as in the trivia retirement wave.
- Order: Microsoft and Airbnb first (their coding tags have no support at all), then the partial lists for Amazon, Meta, Apple and Google.

Size: small if kept, medium if removed. Blocked on D1.

### Step 4: Amazon authored guide

Goal: replace the generic Amazon preview with a Waymo-style guide built from the seven readable loop accounts and the official Front End Engineer prep page.

- Prompts (five to seven): carousel component (A-LC-2020-LOOP), modal with language tabs (A-LC-2020-LOOP), five-star rating widget (A-LC-2020-PHONE), paginated widget of addresses (A-LC-2022), countdown timer (A-LC-2020-LOOP; needs the Step 8 item or stays link-only), front-end system design of an image service or a restaurant ordering app (A-LC-2020-OFFER, A-LC-2022), a file explorer UI (A-LC-2024). Each prompt links the practice item and the public account.
- Loop shape from the official page: online assessment (90-minute coding, 20-minute system design scenarios, work-style survey), 60-minute phone screen split between Leadership Principles and front-end coding, four 55-minute interviews; Leadership Principles open every round (A-LC-2022, A-LC-2020-OFFER, A-BLIND-2023).
- Files: `amazon-preview-content.ts`, registry and slug entries, llms line, smoke, SSR and sitemap rows, editorial case; the logo already exists. The page title and description change, so the page re-dates and needs a Search Console request after deploy.
- Pinned items touched only if Step 1 did not already tag them.

Size: large. One session. Blocked on D3.

### Step 5: Meta authored guide

Lesson from Step 4: converting a slug to an authored guide breaks every test that used that slug as a generic catalog example. For Meta, move the fixtures in `frontend/scripts/audit-internal-link-equity.test.mjs` (the `/companies/meta/preview` route used as a generic preview) to a slug that stays generic (Microsoft, Apple or ByteDance) in the same change; spec files only use `meta` as a company tag, which is unaffected.

Goal: the same for Meta from the Taro accounts (2021 London intern, 2022 intern, 2024 San Francisco, 2025 New York), the Medium 2022 account, the Blind 2021 and 2022 threads and the two official pages.

- Prompts: implement map from scratch and DOM traversal into a twin tree (M-TARO-2021), clearAllTimeout and a map class keyed by DOM nodes (M-TARO-2022, M-BLIND-2021, M-MEDIUM-2022), memoization (M-MEDIUM-2022), stack and queue in JavaScript (M-TARO-2024), traverse the DOM and collect nodes (M-BLIND-2021), front-end system design of an autocomplete component (M-BLIND-2022), plus the algorithm screens (number of islands, circular linked list) as a caution.
- Official context: the 60-minute initial Front End Engineer interview and the AI-native coding interview with a built-in assistant in CoderPad.

Size: large. Blocked on D3 and on Step 4 results.

### Step 6: Apple authored guide

Goal: a guide from AP-MEDIUM-2022 (tooltip library, theme, min stack, critical rendering path, CORS and cookies, code review), AP-TARO-2019 (array and string drills, promises in sequence), AP-TARO-2022 (HTML form with radio buttons, fix errors on a page) and the 2025 preview (React output prediction, nested tabs from a flat list, autocomplete, security). No official page exists; the guide must say so.

Size: large. Lowest priority of the four because the accounts are older and thinner.

### Step 7: Microsoft authored guide

Goal: a guide built on the machine-coding shapes the accounts agree on: a weekly calendar view in plain JavaScript (MS-LC-2020, MS-TARO-2020), a full-page search with pagination and highlighted snippets (MS-LC-2021), a React grid component and a CSS spinner (MS-LC-2024), Excel-style expression evaluation and output prediction (MS-LC-2021), a multi-step form with validation (search preview only), plus the official hiring and interview tips pages. This step is the natural place to retire the snake and chessboard emphasis if D1 chooses removal.

Size: large. Blocked on D1 and D3.

### Step 8: new catalog items (each needs its own yes)

| Candidate | Reported at | Nearest existing item | Proposed shape | Size |
|---|---|---|---|---|
| Promise retry with delay | Google 2021 (G-LC-2021), Intuit 2025 (I-LC-2025) | js-poll-until, js-sleep | free JavaScript item: retry a promise-returning function n times with a delay, reject with the last error; tests for success on the second attempt, exhaustion, zero retries | small |
| Flat list to tree | ByteDance 2023 (BD-BLIND-2023), Apple 2025 preview (nested tabs from a flat list) | js-filter-tree-render-indented | free JavaScript item: build a tree from `{id, parentId}` records, preserve order, detect orphans | small |
| Countdown timer component | Amazon 2020 (A-LC-2020-LOOP), ByteDance 2023 (BD-BLIND-2023 "async timer") | react-counter, js-timer-manager | React item, premium: start, pause, reset, drift-free ticking, cleanup on unmount; framework tests | medium |
| Promise sequence or queue | Google 2019 and 2021 (G-LC-2019, G-LC-2021), Apple 2019 (AP-TARO-2019) | js-concurrency-map-limit | free JavaScript item: run tasks one after another, each starting when the previous settles | small |
| Weekly calendar view | Microsoft 2020 twice (MS-LC-2020, MS-TARO-2020), Uber 2022 design (U-MEDIUM-2022) | none | machine-coding item with overlapping events; large starter and tests | large |
| Store keyed by DOM nodes | Meta 2022 (M-MEDIUM-2022), Blind 2021 (M-BLIND-2021 "map class") | none | free JavaScript item: set, get, has keyed by DOM nodes without mutating them; WeakMap discussion | small |

Each new item follows the Step 3 Waymo pattern: catalog entry, decision graph, failure-explain rules, id manifest, assist-sync validation, visual baseline check, and tagging for the reporting companies with sources. Blocked on D2.

### Step 9: Stripe, Uber and Airbnb after Step 1

- Uber: with the official frontend guide, mapLimit and the two trivia tags, the page has enough for a light authored guide later (loop from U-TARO-2022: screening UI component, design and architecture, front-end coding, algorithms bar raiser, behavioural; U-MEDIUM-2022: vanilla JavaScript DOM and async machine coding, collaborative calendar design). Not before Steps 4 and 5.
- Stripe: evidence is process-shaped (three-part incremental exercise, bug squash in an unfamiliar repository, integration round with API docs, front-end system design). A guide would be about the process and would link the debug items and the JSON drills; the page says Stripe publishes no preparation page.
- Airbnb: thinnest evidence (HTML, CSS and JavaScript screens, a React component, a mock chat app architecture, a card game UI). Keep generic.
- Retirement, if D6 chooses it for a page: remove the tags, add the retired manifest record and the redirect, and run the sitemap and link-equity checks, as in the trivia retirement wave.

Blocked on D6 and on Step 1.

### Step 10: trivia evidence policy

If D5 keeps trivia source-free, nothing to build; the review document keeps the trivia evidence (Amazon phone screen 2020: block vs inline, reflow vs repaint, event loop; Apple 2022: prototype inheritance, preventDefault vs stopPropagation, CORS, cookies; ByteDance 2023: setTimeout vs promises). If D5 extends the feature: lint change, trivia template placement, the smoke rule that rejects citations on trivia pages, and the SEO reason that reference blocks were stripped from trivia must be revisited first.

### Step 11: after deploy

- Request indexing in Search Console for every company page whose title or description changed (Steps 4 to 7) and for the pages that gained sourced items; quota is about nine per day.
- Confirm the official pages table and the reported-rounds block on the live pages.
- Review impressions and clicks per company page at the next Search Console review before deciding D6 retirements.

## Order and dependencies

1. Step 0 (decisions), then Step 1 (tags and sources, one re-pin batch).
2. Step 2 (visibility) right after Step 1; it is what makes Step 1 worth reading.
3. Step 3 (D1) can run in parallel with Step 2 if D1 is "keep"; otherwise after Step 2.
4. Step 4 (Amazon), then Step 5 (Meta); Steps 6 and 7 only after a Search Console read of the first two.
5. Step 8 items can be slotted before Step 4 if the Amazon guide wants a countdown timer prompt with a practice page.
6. Step 9 and Step 11 close the plan.

## Risks and notes

- Every tag or source on a pinned item re-pins the coding or system-design registry; batch them per step and keep the approval note pattern. The gold approval binding and the artifact pins change on every coding re-pin.
- Tagging an existing item re-dates its page and the aggregating hubs; tags and sources must land in one commit.
- Pinned items currently avoided by the earlier steps remain pinned; do not edit their starter code, tests or descriptions in these steps.
- Public search previews (the 2025 and 2026 LeetCode articles) are usable only with the "could not be read in full" note; prefer readable accounts for item sources.
- New pages (Step 8, Steps 4 to 7) need a separate yes each, per the working agreement.

## Source registry

| Code | Source | URL |
|---|---|---|
| G-LC-2019 | LeetCode Discuss, Google front end engineer onsite, Sunnyvale, spring 2019 | https://leetcode.com/discuss/post/342364/ |
| G-LC-2020 | LeetCode Discuss, Google phone screen, implement throttle, April 2020 | https://leetcode.com/discuss/post/592667/ |
| G-LC-2021 | LeetCode Discuss, Google L3/L4 frontend, June 2021 | https://leetcode.com/discuss/post/1274542/ |
| G-BLIND-2020 | Blind, Google frontend interview questions thread, December 2020 | https://www.teamblind.com/post/google-frontend-interview-questions-thread-yqyqmvon |
| G-BLIND-2025 | Blind, how to prepare for Google frontend interview, March 2025 | https://www.teamblind.com/post/how-to-prepare-for-google-frontend-interview-7sgcbbcx |
| A-LC-2020-PHONE | LeetCode Discuss, Amazon FEE II phone screen, March 2020 | https://leetcode.com/discuss/post/546992/ |
| A-LC-2020-LOOP | LeetCode Discuss, Amazon FEE 2 loop, Seattle, April 2020 | https://leetcode.com/discuss/post/591141/ |
| A-LC-2020-OFFER | LeetCode Discuss, Amazon virtual onsite FEE II offer, June 2020 | https://leetcode.com/discuss/post/694045/ |
| A-LC-2020-PHONE2 | LeetCode Discuss, Amazon phone interview FEE I or II, June 2020 | https://leetcode.com/discuss/post/678045/ |
| A-LC-2021 | LeetCode Discuss, Amazon frontend onsite rejection, October 2021 | https://leetcode.com/discuss/post/1503301/ |
| A-LC-2022 | LeetCode Discuss, Amazon virtual onsite FEE II Vancouver offer, April 2022 | https://leetcode.com/discuss/post/1984996/ |
| A-LC-2024 | LeetCode Discuss, Amazon onsite FEE 2 L5 Seattle reject, October 2024 | https://leetcode.com/discuss/post/5934170/ |
| A-LC-2025 | LeetCode Discuss, Amazon Frontend Engineer I, India, January 2025 | https://leetcode.com/discuss/post/6329840/ |
| A-LC-LIST-2020 | LeetCode Discuss, community list of front end interview questions, July 2020 | https://leetcode.com/discuss/post/742791/ |
| A-BLIND-2023 | Blind, Amazon FEE I OA, phone screen and loop, 2022 | https://www.teamblind.com/post/amazon-frontend-fee-i-oa-phone-screen-loop-interview-2022-qqdjoknw |
| M-TARO-2021 | Taro, Meta front end developer intern, London, December 2021 | https://www.jointaro.com/interviews/companies/meta/experiences/front-end-developer-intern-london-england-december-1-2021-no-offer-positive-4f6ff45b/ |
| M-TARO-2022 | Taro, Meta front end engineer intern, United States, January 2022 | https://www.jointaro.com/interviews/companies/meta/experiences/front-end-engineer-intern-united-states-january-1-2022-accepted-offer-positive-2e0f20e4/ |
| M-TARO-2024 | Taro, Meta front end developer, San Francisco, June 2024 | https://www.jointaro.com/interviews/companies/meta/experiences/front-end-developer-san-francisco-ca-june-27-2024-no-offer-positive-07526bae/ |
| M-TARO-2025 | Taro, Meta frontend engineer, New York, April 2025 | https://www.jointaro.com/interviews/companies/meta/experiences/frontend-engineer-new-york-ny-april-1-2025-no-offer-positive-ae322f20/ |
| M-MEDIUM-2022 | Medium, Meta front end engineer interview experience, March 2022 | https://medium.com/@stylus07/meta-interview-experience-cdf53eea63f3 |
| M-BLIND-2021 | Blind, front end interview questions by company, October 2021 | https://www.teamblind.com/post/Went-through-Frontend-Interviews-recently-here-are-the-kinda-questions-they-ask-dbyQb3ob |
| M-BLIND-2022 | Blind, Meta frontend system design, March 2022 | https://www.teamblind.com/post/meta-frontend-system-design-yexyrusi |
| AP-TARO-2019 | Taro, Apple front end developer, Hyderabad, December 2019 | https://www.jointaro.com/interviews/companies/apple/experiences/front-end-developer-hyderabad-december-24-2019-no-offer-positive-7397b890/ |
| AP-TARO-2022 | Taro, Apple front end developer, Cupertino, July 2022 | https://www.jointaro.com/interviews/companies/apple/experiences/front-end-developer-cupertino-ca-july-1-2022-no-offer-negative-9299c7ea/ |
| AP-MEDIUM-2022 | Medium, Apple senior frontend developer interview, July 2022 | https://srijansinghgulati.medium.com/my-apple-interview-experience-and-why-i-declined-the-offer-5ff442962bd8 |
| AP-LC-2025 | LeetCode Discuss, Apple IC3 frontend interview experience, June 2025 (preview only) | https://leetcode.com/discuss/post/6979238/ |
| MS-LC-2020 | LeetCode Discuss, Microsoft front end engineer, Bangalore, January 2020 | https://leetcode.com/discuss/post/489795/ |
| MS-LC-2021 | LeetCode Discuss, Microsoft FEE, Bangalore, June 2021 | https://leetcode.com/discuss/post/1254448/ |
| MS-LC-2024 | LeetCode Discuss, Microsoft frontend SDE 2, July 2024 | https://leetcode.com/discuss/post/5456468/ |
| MS-TARO-2020 | Taro, Microsoft frontend developer, Bengaluru, April 2020 | https://www.jointaro.com/interviews/companies/microsoft/experiences/frontend-developer-bengaluru-april-1-2020-no-offer-negative-4d89aa0e/ |
| N-TARO-2024 | Taro, Netflix senior frontend engineer, Warsaw, November 2024 | https://www.jointaro.com/interviews/companies/netflix/experiences/senior-frontend-engineer-warsaw-masovia-november-1-2024-no-offer-negative-c999399f/ |
| N-TARO-2020 | Taro, Netflix senior front end engineer, Los Angeles, October 2020 | https://www.jointaro.com/interviews/companies/netflix/experiences/senior-front-end-engineer-los-angeles-ca-october-1-2020-no-offer-positive-86100381/ |
| BD-BLIND-2023 | Blind, ByteDance new grad frontend engineer breakdown, January 2023 | https://www.teamblind.com/post/bytedance-new-grad-frontend-engineer-interview-breakdown-vqyvjs1l |
| BD-BLIND-2024 | Blind, TikTok front end interview experience, September 2024 | https://www.teamblind.com/post/my-tiktok-front-end-interview-experience-any-idea-what-end-result-might-look-like-jfcdhq5r |
| BD-LC-2021 | LeetCode Discuss, TikTok frontend new grad 2022 offer, October 2021 | https://leetcode.com/discuss/post/1540236/ |
| AB-TARO-2022 | Taro, Airbnb front end engineer, San Francisco, June 2022 | https://www.jointaro.com/interviews/companies/airbnb/experiences/front-end-engineer-san-francisco-ca-june-1-2022-declined-offer-negative-afab47f0/ |
| AB-BLIND-2024 | Blind, Airbnb frontend interview, February 2024 | https://www.teamblind.com/post/airbnb-frontend-interview-fyzmjrb5 |
| S-LC-2024 | LeetCode Discuss, Stripe software engineer 2 initial screen, October 2024 | https://leetcode.com/discuss/post/5883632/ |
| S-TARO-2023 | Taro, Stripe frontend engineer, Barcelona, October 2023 | https://www.jointaro.com/interviews/companies/stripe/experiences/frontend-engineer-barcelona-october-1-2023-no-offer-neutral-ceb407e7/ |
| S-TARO-2025 | Taro, Stripe frontend developer, Canada, September 2025 | https://www.jointaro.com/interviews/companies/stripe/experiences/frontend-developer-canada-september-19-2025-no-offer-positive-caea53c0/ |
| S-MEDIUM-2025 | Medium, Stripe intern interview experience 2025 to 2026, November 2025 | https://medium.com/@diyaag2020/my-stripe-interview-experience-2025-2026-a-journey-to-the-final-round-19990fa6876a |
| U-LC-2022 | LeetCode Discuss, Uber phone screen senior front end engineer, August 2022 | https://leetcode.com/discuss/post/2409192/ |
| U-TARO-2022 | Taro, Uber frontend engineer II, Bengaluru, April 2022 | https://www.jointaro.com/interviews/companies/uber/experiences/frontend-engineer-ii-bengaluru-april-1-2022-no-offer-positive-f0d40cc2/ |
| U-TARO-2025 | Taro, Uber frontend developer, Brazil, November 2025 | https://www.jointaro.com/interviews/companies/uber/experiences/frontend-developer-brazil-november-5-2025-no-offer-negative-0b9b9ae1/ |
| U-MEDIUM-2022 | Medium, Uber SDE 2 frontend interview experience, November 2022 | https://medium.com/@iamjaasi/uber-sde-2-frontend-interview-experience-40c1a7437cc0 |
| OA-TARO-2024 | Taro, OpenAI senior frontend software engineer, May 2024 | https://www.jointaro.com/interviews/companies/openai/experiences/senior-frontend-software-engineer-united-states-may-30-2024-no-offer-negative-32a807aa/ |
| OA-BLIND-2024 | Blind, preparing for OpenAI frontend engineer interview, September 2024 | https://www.teamblind.com/post/preparing-for-openai-frontend-engineer-interview-hb1zxdy6 |
| I-LC-2025 | LeetCode Discuss, Intuit senior frontend engineer interview, November 2025 | https://leetcode.com/discuss/post/7320927/ |

## Decisions taken

Recorded on 2026-10-15 after the owner accepted the recommendations:

- D1: keep the unsupported tags as editorial groupings; make sourced items visible instead (Step 2).
- D2: write the top three new items (promise retry with delay, flat list to tree, countdown timer); each is approved as a page.
- D3: authored guides for Amazon first, then Meta; Apple and Microsoft wait for a Search Console read.
- D4: add the optional `company` field to sources and the reported-rounds block (Step 2).
- D5: trivia stays source-free.
- D6: Stripe, Uber and Airbnb stay generic and gain the Step 1 items; retirement only after a Search Console review.
- Order chosen by the owner: Step 3 (new items) first, then Steps 1, 2, 4, 5, 6.

## Status

| Step | Status | Date |
|---|---|---|
| 3 New items | done, uncommitted: js-retry-with-delay (free; Google 2021, Intuit 2025; 7 tests, two approaches, decision graph, hint rules), js-build-tree-from-flat-list (free; ByteDance 2023, Apple 2025 preview; 8 tests, two approaches, decision graph, hint rules), react-countdown-timer (premium; Amazon 2020; sandbox and solution assets, two framework tests). Catalog solution execution 91/91, hint rule spec 45/45, framework asset pins 198/263, manifest 437, prerender 600 routes, sitemap 420 URLs, guard green with a clean dist (115 smoke checks), seo-ssr + editorial-correctness 109/109, seo + routing-and-access 26/26, backend check green. Residual: the /coding list visual baseline may need a Linux refresh in CI. | 2026-10-15 |
| 1 Tag and source the strong matches | done, uncommitted: 11 coding items, 1 CSS coding item, 2 debug items and 2 system design cases tagged with sources; 8 trivia tags; Google nested checkboxes skipped (reply-level evidence). Card counts: Uber 5, Stripe 3, Airbnb 3 (framework variants count as one family, so the chips input stays one entry), Netflix 13, Google 45, Meta 51, Amazon 42, Apple 37, ByteDance 22. Coding registry re-pinned for js-concurrency-map-limit, js-group-by, react-debounced-search and react-pagination-table (approval and artifact pins refreshed); system design registry re-pinned for the realtime search and image upload scenarios; the backend content tests that hard-code the coding registryContentHash and the image-upload bundle hash were updated. Lints, content tests and backend Jest 1015/1015 green; guard green with a clean dist (115 smoke checks), seo-ssr + editorial-correctness 109/109, seo + routing-and-access 26/26 | 2026-10-15 |
| 2 Make sourced items visible | done, uncommitted: `company` field on sources (lint requires a slug that is one of the entry's companies; 87 existing sources backfilled across coding, debug and system design meta), `gen-company-reports.mjs` writes `cdn/questions/company-reports.json` (87 reported items across 14 companies) in gen:data with a --check in the lint chains, `QuestionService.loadCompanyReports` with TransferState and a normaliser, `reports` on the resolved preview for catalog pages, a public interview reports block before the official pages table on generic previews and a visible Public report chip on sourced sample rows; inventory fingerprints now include sources and per-company report lists. Twelve pinned coding variants and four system design scenarios re-pinned for the field backfill; backend Jest 1015/1015; lint, unit, generator and content tests green; prerender guard from a clean dist, SSR e2e (111, including the new Amazon/Microsoft raw-HTML test and an Amazon reflow test covering the reports block at 360 to 1440px) and critical e2e (26) green | 2026-10-15 |
| 4 Amazon authored guide | done, uncommitted: `amazon-preview-content.ts` registered (slug list, script list, llms line, smoke and SSR authored cases, sitemap slug list, editorial case); seven prompts (five-star rating, carousel, language tabs modal, countdown timer, paginated addresses, image service or ordering app design, file explorer) each linked to a practice item and a public account; sources list the official FEE prep and Leadership Principles pages plus nine accounts and the community list; the generic Amazon checks from Step 2 (smoke, SSR raw and reflow, Karma fixtures) moved to ByteDance, Microsoft and Apple because Amazon is now editorial. Title 59 and description 158 characters, so the page re-dates and needs a Search Console request after deploy. Trust, authored list, inventory (28), seo-dates (69), link-equity (23), sitemap and date parity green; tsc clean; company Karma specs 44/44; prerender guard from a clean dist green (124 smoke checks, perf contract, link equity); SSR and editorial e2e 114/114 (Amazon authored raw-HTML, schema and reflow cases included); critical e2e 26/26. No catalog change, so no backend re-pin. Strict spelling lint still exits 1 on pre-existing CDN trivia words and never flags the module | 2026-10-15 |
| 5 Meta authored guide | done, uncommitted: `meta-preview-content.ts` registered (slug list, script list, llms line, smoke and SSR authored cases, sitemap slug list, editorial case); seven prompts (map from scratch, clearAllTimeout, memoize, twin DOM node, DOM traversal that collects nodes, stack and queue plus a short algorithm screen, autocomplete component design) each linked to a practice item and a public account; sources list the hiring process and initial FEE interview pages plus seven accounts (four Taro, Medium via the RSS feed, two Blind). The official Initial Interview Guide PDF could not be read by our tools (no text streams), so only the page is cited. The link-equity test fixtures moved from Meta to Microsoft. Title 57 and description 156 characters, so the page re-dates and needs a Search Console request after deploy. Trust, authored list, inventory (28), link-equity (23), seo-dates (69), sitemap and date parity green; tsc clean; company Karma specs 42/42; prerender guard from a clean dist green (131 smoke checks, perf contract, link equity); SSR and editorial e2e 117/117 (Meta authored raw-HTML, schema and reflow cases included); critical e2e 26/26. The first build exposed the phrase "candidate reports" inside a sentence of the Meta module ("an L5 candidate reports two rounds"); the trust test only scanned the legacy company-detail template, so it now scans every `*-preview-content.ts` module and the preview template for the forbidden provenance claims, the sentence was reworded and the guard and e2e chain rerun. No catalog change, so no backend re-pin | 2026-10-15 |
| 6 Apple and 7 Microsoft authored guides | waiting, per D3, on a Search Console read of the Amazon and Meta pages after deploy | |
| 8 to 10 | not started; Step 8 items each need a separate yes | |
| 11 After deploy | not started: Search Console requests for the re-dated pages (Amazon, Meta, the items that gained sources), live checks of the official pages table and the reported-rounds block | |
