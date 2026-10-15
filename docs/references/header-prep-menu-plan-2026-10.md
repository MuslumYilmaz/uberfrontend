# Header prep menu plan: GreatFrontEnd-style menu with every link in initial HTML

> Working plan written on 2026-10-14. Implementation has not started. Update the status table at the bottom at the end of every step. The GreatFrontEnd header was inspected in Chrome on 2026-10-14; the link and size numbers below come from the local production build of the same day (`frontend/dist`, 578 public prerendered pages, 591 HTML files).

## Why

- For guests above 1180px, the marketing header on `/` and `/showcase` shows the brand, five primary links, Pricing, Log in and the CTA. It reads as crowded.
- GreatFrontEnd shows a logo, a product switcher, Dashboard and a "Prepare" trigger. Prepare opens a panel with four tabs on the left (Practice questions, Recommended strategy, Time-savers, Guides) and three or four cards on the right: icon, title, one-line description, decorative chips. Each card is one link; the chips are not links.
- GreatFrontEnd's panel is not in the initial HTML. It mounts on open, renders only the active tab and unmounts on close, so its header gives crawlers nothing beyond the logo and one Dashboard link; a 30-link footer carries its sitewide linking. Copying that mechanism would take our header links out of initial HTML.
- Our app header has the same weakness today: its "Interview Prep" panel sits behind `*ngIf`, so the only sitewide hub link in initial HTML is `/interview-questions`. Most other hubs get links from blocks on trivia and coding detail pages; hub, guide, tradeoff and incident pages do not carry those blocks.

| Hub | Public pages linking to it today | After this plan |
|---|---|---|
| `/focus-areas` | 4 | 578 |
| `/tradeoffs` | 34 | 578 |
| `/css/interview-questions` | 39 | 578 |
| `/react/interview-questions` | 49 | 578 |
| `/incidents` | 88 | 578 |
| `/tracks` | 326 | 578 |
| `/system-design` | 330 | 578 |
| `/companies` | 348 | 578 |

## Decisions recorded on 2026-10-14 and 2026-10-15

- Copy GreatFrontEnd's look, not its mechanism. Every link of every section is server-rendered in each page's initial HTML; opening, closing and switching sections only toggle visibility.
- Technology chips are real links to the six dedicated hubs `/{javascript,react,angular,vue,html,css}/interview-questions`. The combined `/html-css/interview-questions` hub is never linked from the menu.
- Pricing stays in the marketing header's top bar exactly as today: a guest utility link that appears after auth resolves. The app header's right side (avatar, CTA) does not change.
- "Interview Questions" stays a visible top-level link in both headers.
- One menu catalog and one panel component serve both headers.
- The menu links existing pages only. No page is created for it.
- No link that today's prerendered headers carry leaves initial HTML: the logo link to `/` and `/interview-questions` on every page, plus `/guides/interview-blueprint/intro`, `/interview-questions/essential`, `/coding` and `/tracks` on the home page. Bytes are never saved by dropping a link.
- Confirmed on 2026-10-15: `/html-css/interview-questions` and `/guides` stay out of the menu. Neither is linked from any header today (the combined hub gets its 43 links from page content, `/guides` gets none), so leaving them out removes nothing.

## Facts the plan rests on

Header wiring
- `frontend/src/app/app.component.ts:56-58` renders the marketing header where `isMarketingPath` is true (`/` and `/showcase`, `core/utils/marketing-route.util.ts`), no header on auth routes, and the app header everywhere else. Exactly one header renders per page; `e2e/ui-visual.spec.ts:51-55` guards against two.
- App header panel: `header.component.html:154` wraps it in `<ng-container *ngIf="megaOpen()">`. The panel is `id="prepare-mega" role="dialog"` with a search field (:165), the "Start here" action list (:180-211) and search results (:213). Both triggers point `aria-controls` at `prepare-mega`.
- App header logic (`header.component.ts`): `studyPrimaryActions` (:156-221) builds seven actions; the first is a "Continue" row built from localStorage `fa:recent:study` (:76), loaded on every navigation (:229) and on open (:478). `openOnly` (:470) focuses search; `/` and Ctrl/Meta+K open the panel (:445); Escape restores trigger focus (:434); `syncMegaAnchor` (:649) assumes a 640px panel (:651, css :271-282); `isStudyActive` lists the routes that light up the trigger and misses `/machine-coding` and `/tools`. Analytics: `header_study_opened`, `header_study_primary_cta_clicked`, `header_study_browse_full_library_clicked`, `header_top_nav_clicked` with `surface: 'app'` (:727). `AnalyticsService.track` takes free-form params, so new params need no registry change.
- Marketing header: `primaryLinks` (`marketing-header.component.ts:40-71`), `guestUtilityLinks` with Pricing and Log in (:73-85), `loggedInUtilityLinks` (:87-98), `isPrimaryLinkActive` (:187-206). Desktop nav at `.html:12-25`; utility links and CTA are auth-gated (`ngSwitch`, signed-out case at :43); the mobile panel sits behind `*ngIf` (:99-183); the layout collapses at 1180px (`.css:239-255`). Analytics: `header_top_nav_clicked` with `surface: 'marketing'`.
- Hydration: `provideClientHydration` without event replay (`app.config.base.ts:46-47`). Any structural difference between the server render and the first client render of the panel can raise NG05xx errors.

Audits that judge the result
- `frontend/scripts/audit-internal-link-equity.mjs` puts anchors inside `header`, `nav`, `footer`, `aside` or `role="banner|navigation"` in the navigation zone (:62-64); both headers have `role="banner"` roots. It fails on links to canonical aliases (:190-193), requires `CRITICAL_HUBS` (:14-19) within depth 2 of `/`, and prints the legacy quotas, pricing max 90 among them, as information only (:281-285).
- `frontend/scripts/audit-tech-hub-internal-links.mjs:237-238` fails every CSS detail page that links `/html-css/interview-questions`, navigation zone included. `CONTEXTUAL_HUB_LINKS` (:33) requires content-zone links; menu links never satisfy it, so no body link may be removed on the grounds that the menu covers it.
- Every target in the menu table below is self-canonical, `index,follow` and in `sitemap.xml` on the 2026-10-14 build. `/guides` canonicalizes to `/guides/interview-blueprint` and is not in the sitemap; linking it would fail the alias rule. `/tracks/<id>` without `/preview` counts as private in the audit; the menu links the preview URL.
- `frontend/scripts/perf-contract.mjs:30-37` thresholds turn into CI failures in `--strict` mode, which the Playwright Critical job uses (:16-22, :366). Local 2026-10-14 build: `eagerJsBytes` 1,192,151 of 1,260,000; `codingHtmlBytes` 608,670 of 620,000; `totalHtmlBytes` 113,819,221 of 104,000,000. The total is already over locally while Playwright E2E passed on dev on 2026-10-12, so the local `dist` is stale or larger than CI's; re-measure on a clean build before judging. The menu adds markup and CSS to all 591 HTML files, and `/coding` has about 11 KB of headroom.
- Design budget (`frontend/scripts/check-design-budget.mjs`, patterns in `scripts/design-system-metrics.mjs:22-26`): no raw `fa-btn`, `fa-chip` or `fa-card` classes, no `::ng-deep`, no raw color literals, no inline `styles: [...]`. Link-style actions use `a[faButton]` (`variant` neutral, primary, ghost or danger; `size` sm, md or lg).
- Link catalogs shared by the app and node scripts already exist as JSON: `src/app/core/content/priority-links.json`, typed by `priority-links.ts` and validated by `validatePriorityLinks` (`scripts/priority-links.mjs:43`) against the tracked `src/prerender.routes.txt`.
- The installed `primeicons` is 6.0.1; every icon in the table below exists in it (`pi-bullseye` and `pi-file-check` do not).

Tests that pin today's headers
- Unit, `header.component.spec.ts`: crawlable hub link (:90), current state and analytics (:104), mobile prep navigation (:131), focus while auth resolves (:153), auth placeholders (:200), compact launcher actions (:280), named dialog and focus restore (:332), `/` and Ctrl/Meta+K (:361), primary-action analytics (:388), labelled mobile trigger (:411).
- Unit, `marketing-header.component.spec.ts`: primary order (:55), utility switch (:92), pending neutrality (:131), mobile menu IA (:153), active states (:209), hub before auth (:235), mobile hub navigation (:246), CTA prominence (:269).
- E2E: the "contextual links remain crawlable and navigable" test in `seo-ssr.spec.ts` requires a visible, followable `/interview-questions` header link with JavaScript disabled on `/` (testid `marketing-header-primary-link`) and `/coding` (testid `header-interview-hub`). `production-public-remediation.prod.spec.ts:301-315` requires neutral auth slots in prerendered headers, and its `openHydratedRoute` (:211-235) fails on NG05 or hydration console output. `auth.spec.ts:157-170` expects exactly two guest utility links (Pricing, Log in). `header.mobile.spec.ts` covers route variants (:134), desktop actions (:173), the 1180px fit (:192) and hub navigation (:224). `ui-visual.spec.ts` screenshots public routes at six widths with the header in view.

## Menu content

Copy was revised on 2026-10-15 against each destination's H1 and meta description. Titles double as sitewide anchor text, so they name the destination; established site labels (Frontend interview preparation guide, Interview Questions, Question Library, Study Plans, Essential 60, CV Linter) are kept, and descriptions avoid counts that go stale. Titles stay at or under 40 characters and descriptions at or under 90, which keeps the per-page HTML small. Keys reuse today's `header-study-*` keys where the destination is the same, so analytics `action` values stay continuous.

| Section | Key | Icon | Title | Description | Route |
|---|---|---|---|---|---|
| Start here | `interview_blueprint` | `pi-map` | Frontend interview preparation guide | How the rounds work, what interviewers score and a prep order for your timeline. | `/guides/interview-blueprint/intro` |
| Start here | `plan_30d` | `pi-calendar` | 30-day interview roadmap | A week-by-week plan across JavaScript, UI coding, frameworks and system design. | `/tracks/foundations-30d/preview` |
| Start here | `essential_60` | `pi-star` | Essential 60 | A curated shortlist of 60 questions, from JavaScript utilities to system design. | `/interview-questions/essential` |
| Start here | `system_design_blueprint` | `pi-share-alt` | System design blueprint | A 45-minute answer template with a checklist, worked examples and real prompts. | `/guides/system-design-blueprint` |
| Practice | `interview_questions` | `pi-question-circle` | Interview Questions | Questions and answers by framework and round: coding, debugging, UI and system design. | `/interview-questions` |
| Practice | `question_library` | `pi-bolt` | Question Library | Every coding challenge in one place, with in-browser editing, tests and filters. | `/coding` |
| Practice | `machine_coding` | `pi-th-large` | Machine coding | Build interview-style UI, from widgets and forms to tables and async flows. | `/machine-coding` |
| Practice | `system_design` | `pi-sitemap` | Frontend system design | Architecture prompts with worked examples, RADIO drills and scoring rubrics. | `/system-design` |
| Focused practice | `study_plans` | `pi-directions-alt` | Study Plans | Guided 7-day and 30-day tracks with weekly checkpoints. | `/tracks` |
| Focused practice | `companies` | `pi-building` | Company guides | Company-style practice for Google, Meta, Amazon, OpenAI and more. | `/companies` |
| Focused practice | `focus_areas` | `pi-filter` | Focus areas | Pick a weak area and jump straight to its prep path. | `/focus-areas` |
| Focused practice | `tradeoffs` | `pi-sliders-h` | Tradeoff questions | Defend choices like Context vs Redux, SSE vs WebSocket and CSR vs SSR. | `/tradeoffs` |
| Focused practice | `incidents` | `pi-exclamation-triangle` | Debugging incidents | Trace a production-style bug to its root cause, fix it and guard against regressions. | `/incidents` |
| Guides and tools | `framework_prep` | `pi-compass` | Framework prep paths | 7, 14 and 30-day paths for JavaScript, React, Angular and Vue interviews. | `/guides/framework-prep` |
| Guides and tools | `behavioral` | `pi-comments` | Behavioral interview guide | Story frameworks and example answers for behavioral rounds. | `/guides/behavioral` |
| Guides and tools | `cv_linter` | `pi-file` | CV Linter | An ATS-style resume score with section fixes and keyword gaps. | `/tools/cv` |

Chips on the `interview_questions` card: JavaScript, React, Angular, Vue, HTML, CSS, each linking `/{tech}/interview-questions`.

Totals: 16 cards and 6 chips, 22 unique routes. With the top-level "Interview Questions" link each header carries 23 menu-related anchors in initial HTML; Pricing, Log in and the CTA stay client-only as today. Every `CRITICAL_HUBS` entry except `/html-css/interview-questions` is covered. "Continue where I left off" stays an app-header-only, client-only row above the sections.

## Step 0: this document

Done on 2026-10-14. Router rule `header_prep_menu_plan` in `docs/ai-context/router.yaml`.

## Step 1: menu catalog and validator (no UI change)

- Copy review: the user confirms or rewrites the titles and descriptions in the table above.
- `frontend/src/app/core/content/prep-menu.json`: `{ "sections": [{ "id", "label", "items": [{ "key", "title", "description", "icon", "route", "chips"?: [{ "key", "label", "route" }] }] }] }`.
- `frontend/src/app/core/content/prep-menu.ts`: types and a typed export, same pattern as `priority-links.ts`.
- `frontend/scripts/prep-menu.mjs`: `validatePrepMenu({ menu, prerenderRoutes, criticalHubs })`. Errors:
  - missing or untrimmed label, title over 40 or description over 90 characters;
  - route that is not a clean path (query, fragment or trailing slash);
  - duplicate route or key anywhere in the menu;
  - route missing from `src/prerender.routes.txt`;
  - route on the deny list: `/guides`, `/html-css/interview-questions`, `/pricing`, and anything under `/auth`, `/dashboard`, `/profile`, `/admin` or `/billing`;
  - a `CRITICAL_HUBS` entry, imported from `audit-internal-link-equity.mjs`, missing from the menu, `/html-css/interview-questions` excepted;
  - more than 24 routes, an unknown section id, or an icon outside the allowlist of the 16 icons above.
- `frontend/scripts/prep-menu.test.mjs` (node:test): the real catalog passes, and one failing fixture per rule. Add it to `test:link-equity` in `frontend/package.json`; that file had unrelated uncommitted changes on 2026-10-14, so check `git status` first.

Verify: `cd frontend && node --test scripts/prep-menu.test.mjs && npm run test:link-equity`.

## Step 2: shared panel component (not wired yet)

- `frontend/src/app/shared/components/prep-menu/prep-menu-panel.component.{ts,html,css,spec.ts}`: standalone, OnPush, `styleUrls` only.
- Inputs: `open`, `currentPath`, `surface` (`'app' | 'marketing'`), `panelId`, `testIdPrefix`. Outputs: `itemSelected({ key, section, route })` and `sectionChanged(id)`. One projected slot above the sections for the app header's search field and Continue row. Positioning moves out of `syncMegaAnchor` into a helper both headers use.
- Markup rules:
  - One root `<nav [id]="panelId" aria-label="Interview prep" [hidden]="!open">`, always rendered. Sections, cards and chips are iterated with `@for` and never wrapped in `@if`, `*ngIf` or `@defer`.
  - Section switcher: a `role="tablist"` of buttons with `role="tab"`, `aria-selected` and `aria-controls`; each section is a `role="tabpanel"` with `[hidden]="active !== section.id"`. Arrow keys, Home and End move between tabs; click always switches; hover switches only for `pointerType === 'mouse'`.
  - A card is a `div` holding the icon, a title `<a>` with `routerLink` and no `queryParams` whose stretched `::after` makes the whole card clickable, the description, and chip `<a>` elements raised above that overlay. An anchor never contains another anchor.
  - `aria-current="page"` on the anchor whose route equals `currentPath`.
  - Test ids: `{testIdPrefix}-{key}` on title links, `{testIdPrefix}-chip-{key}` on chips, `{testIdPrefix}-tab-{id}` on tabs.
- Layout: on desktop the panel is `min(92vw, 860px)` wide with the tab column on the left and cards on the right; below 640px it becomes a full-width sheet under the header with a horizontally scrollable tab row. Colors, radii, spacing and type come from `src/styles/tokens.scss`. Chips use `a[faButton]` with `size="sm"` and `variant="ghost"` if that matches the design, otherwise a component class built only from tokens.
- Byte budget per page: at most 8 KB of panel markup and 2 KB of added CSS. No inline SVG; descriptions are plain text. The replaced study-panel and mobile-panel CSS is deleted in Steps 3 and 4 so the net CSS change stays near zero.
- Spec: a closed panel still contains every catalog route as an anchor; switching tabs changes only `hidden`; keyboard tab navigation works; `aria-current` follows `currentPath`; `itemSelected` carries key, section and route; no anchor is nested; no `href` has a query string.

Verify: `cd frontend && npx ng test --watch=false --browsers=ChromeHeadlessUnit --include src/app/shared/components/prep-menu/prep-menu-panel.component.spec.ts && npm run lint:design-system:strict && npm run check:design-budget`.

## Step 3: app header integration

- Replace the `*ngIf="megaOpen()"` block (`header.component.html:154`) with an always-rendered `<app-prep-menu-panel panelId="prepare-mega" surface="app" testIdPrefix="header-study">`. Only the backdrop stays conditional. Keep `aria-controls="prepare-mega"` and `aria-expanded` on both triggers and drop `aria-haspopup="dialog"`: the panel never trapped focus, so it is a disclosure, not a dialog.
- Search moves into the projected slot. While a search term exists the sections are hidden, not removed, and the client-only results render below them.
- Continue row: rendered only while the menu is open, so it is absent from the server render and the first client render. Recents loading stays as it is.
- `studyPrimaryActions` gives way to the catalog plus the Continue row; `visibleItems`, `rowIndex` and `activateActive` follow. ArrowUp, ArrowDown and Enter from the search field walk the active section's links outside search mode and the results inside it. `/`, Ctrl/Meta+K and the Escape focus return keep working.
- `isStudyActive` derives its route list from the catalog plus the tech prefixes, which adds `/machine-coding` and `/tools`.
- Analytics keep their names: `header_study_opened`; `header_study_primary_cta_clicked` with `action` set to the catalog key plus `section` and `surface: 'app'`; `header_study_browse_full_library_clicked` for `question_library`.
- Tests: rewrite the compact launcher test (:280) and the primary-action analytics test (:388) for sections; move :332 from dialog to disclosure semantics; keep :90, :104, :131, :153, :200, :361 and :411 green; add "every catalog route is in the DOM while the panel is closed" and "Continue renders only after browser-ready".

Verify: `cd frontend && npx ng test --watch=false --browsers=ChromeHeadlessUnit --include src/app/shared/components/header/header.component.spec.ts --include src/app/shared/components/prep-menu/prep-menu-panel.component.spec.ts`.

## Step 4: marketing header integration

- Top bar: brand, the "Interview Prep" trigger, the "Interview Questions" link (keeps testid `marketing-header-primary-link` for the crawlable-links test in `seo-ssr.spec.ts`), then Pricing and Log in for guests or Dashboard and Profile for signed-in users, then the CTA. Utility links and CTA stay auth-gated exactly as today.
- `primaryLinks` shrinks to Interview Questions; Prep Guide, Essential 60, Question Library and Study Plans move into the catalog.
- The same panel with `panelId="marketing-prep-menu"`, `surface="marketing"` and `testIdPrefix="marketing-header-menu"`, without search or a Continue row. Escape closes it and returns focus to the trigger.
- Below 1180px the Menu button opens the same panel as a sheet. The account block (utility links and CTA, with today's pending placeholders) renders inside the sheet only while it is open, so prerendered HTML keeps neutral auth slots. The old mobile panel (`.html:99-183`) is deleted, so the prep links exist once per page.
- Active state: the trigger is active when `currentPath` matches a catalog route, and `aria-current` marks the page inside the panel. `isPrimaryLinkActive` keeps only the Interview Questions case.
- Analytics: `header_study_opened` with `surface: 'marketing'`; menu clicks send `header_top_nav_clicked` with a new `area: 'prep_menu'` and the destination.
- Tests: rewrite `marketing-header.component.spec.ts` :55, :153 and :209; keep :92, :106, :123, :131, :185, :235, :246 and :269 green. Update `header.mobile.spec.ts` :134, :192 and :224. `auth.spec.ts:157-170` and `production-public-remediation.prod.spec.ts:301-315` must pass unchanged.

Verify: `cd frontend && npx ng test --watch=false --browsers=ChromeHeadlessUnit --include src/app/shared/components/marketing-header/marketing-header.component.spec.ts --include src/app/shared/components/header/header.component.spec.ts --include src/app/shared/components/prep-menu/prep-menu-panel.component.spec.ts`, then `PLAYWRIGHT_WEB_SERVER=1 npx playwright test e2e/header.mobile.spec.ts e2e/auth.spec.ts --project=chromium`.

## Step 5: build-level link guarantees

- `frontend/scripts/audit-prep-menu-links.mjs` and its test: on the production build, every canonical, indexable public page renders exactly one header; that header contains the logo link to `/`, the top-level Interview Questions link and every catalog route as clean, followable anchors; the menu root carries `hidden`. Reuse `parsePage` from `audit-internal-link-equity.mjs`. Wire it as `seo:prep-menu` into `verify:seo-prerender-guard` after `seo:tech-hub-links`.
- Extend the "contextual links remain crawlable and navigable" test in `seo-ssr.spec.ts`: with JavaScript disabled, `/` and `/coding` contain every catalog route inside the header, the menu is not visible, and the top-level Interview Questions link is visible.
- `npm run seo:link-equity` and `npm run seo:tech-hub-links` report zero failures. Record the new navigation-source counts for the hubs in the status table.
- Run the production build and Playwright dev-server suites one after another, never in parallel: the second exits on the Monaco asset-sync lock.

Verify: `cd frontend && rm -rf dist && npm run build && npm run seo:link-equity && npm run seo:tech-hub-links && npm run seo:prep-menu`, then `PLAYWRIGHT_WEB_SERVER=1 PLAYWRIGHT_SSR=1 PLAYWRIGHT_REUSE_SERVER=0 PLAYWRIGHT_PORT=4225 npx playwright test e2e/seo-ssr.spec.ts --project=chromium`.

## Step 6: budgets, visuals, accessibility

- Size: on a clean build (delete `frontend/dist` first; the SSR asset reader can fall back to a stale copy), run `npm run perf:contract -- --no-write` before Step 3 and after Step 4, and record `eagerJsBytes`, `codingHtmlBytes` and `totalHtmlBytes`. If the delta exceeds the Step 2 byte budget, shorten descriptions and remove wrapper elements first; never remove a catalog route, the logo link or the top-level Interview Questions link to save bytes. If a threshold is still crossed after that, raise it in `perf-contract.mjs` in the same change with a dated comment, as the file requires.
- Dates: `npm run check:seo-dates` must report no moved sitemap dates; this is a template-only change.
- UI regression: marketing header screenshots change on purpose. Refresh the Linux baselines through the UI Regression workflow with `update_baselines` and review every changed image (`docs/references/ui-regression.md`). App header screenshots with the panel closed must not change; a diff there is a bug. Add open-panel scenarios for both headers at 1440 and 390.
- Accessibility: `e2e/accessibility.smoke.spec.ts`, plus a manual keyboard pass at 1440 and 390: Tab order, arrow keys in the tab row, Escape, focus return.
- Hydration: the `openHydratedRoute` checks in `production-public-remediation.prod.spec.ts` stay clean on `/` and `/coding`.

Verify: `cd frontend && npm run perf:contract:strict && npm run check:seo-dates && npm run build:ui-test && npm run test:e2e:ui && npm run verify:seo-prerender-guard`.

## Step 7: release and measurement

- Merge through dev to main. No Search Console requests are needed for a navigation change.
- At four and eight weeks, compare Search Console impressions and indexing for `/focus-areas`, `/tradeoffs`, `/incidents` and the six tech hubs against the pre-release baseline, and read GA4 `header_study_opened` by surface and menu clicks by section.
- Rollback: revert the Step 3 and Step 4 commits. The catalog and the validators can stay.

## Implementation notes (2026-10-15)

- The panel uses `ViewEncapsulation.None`; every selector carries the `pm` prefix, and the icon rule is scoped as `.pm .pm-icon` so it outranks the `.pi` rules that PrimeIcons loads later. Encapsulation attributes alone cost about 2.7 KB per page.
- Cards have no text wrapper: icon, title link, description and chips sit directly in the card grid.
- The app header renders its search field and the Continue row only while the menu is open, so neither reaches the server render.
- Marketing routes skip PrimeIcons on load (`app.component.ts` `configureRouteRuntime`). The marketing header calls `AppUiStylesService.ensureCoreLoaded()` on trigger hover or focus and on open.
- The mobile app-header flow taps the Practice tab before the Interview Questions card; `header.mobile.spec.ts` follows that.
- The validator checks section ids against a pattern instead of a fixed list.
- Both headers share one link style since 2026-10-15: plain semibold text with the same hover and active states, and the same brand letter-spacing and size; the app header's bordered link boxes are gone.

## Results on the 2026-10-15 build

Per page, against the 2026-10-14 build:

| Page | Header markup bytes | Header and panel CSS bytes |
|---|---|---|
| `/` | 2,024 to 8,949 | +3,628 |
| `/coding` and other app pages | 2,450 to 9,244 | −934 |

Perf contract, strict mode passes:

| Metric | Value | Threshold |
|---|---|---|
| `eagerJsBytes` | 1,204,312 | 1,260,000 |
| `initialBytes` | 1,338,614 | 1,400,000 |
| `codingHtmlBytes` | 595,634 | 620,000 |
| `totalHtmlBytes` | 99,548,902 | 104,000,000 |

Internal link graph (`seo:link-equity`, 418 canonical indexable pages):

| Measure | 2026-10-14 build | 2026-10-15 build |
|---|---|---|
| Unique internal edges | 18,420 | 23,589 |
| Deepest click depth from `/` | 3 | 2 |
| Pages deeper than two clicks | 13 | 0 |
| Pages linking `/focus-areas` | 4 | 417 |
| Pages linking `/tradeoffs` | 11 | 417 |
| Pages linking `/incidents` | 89 | 417 |
| Pages linking `/guides/behavioral` | 4 | 417 |
| Pages linking `/css/interview-questions` | 39 | 417 |

`seo:prep-menu`, `seo:tech-hub-links` and `seo:links` (no hard 404) pass; `check:seo-dates` reports no pending date changes.

UI visual suite against the macOS references: pixels inside the 56px header band changed only on `home` at 1366 and 1440, and those two macOS references were updated. The 13 other diffs sit below the header and come from macOS references last refreshed on 2026-10-05 and 2026-10-09, before the content waves of 2026-10-12 and 2026-10-14 (for example the home proof chip now reads 490+ questions instead of 514+). The Linux references for `home` at 1366 and 1440 must be refreshed through the UI Regression workflow; the same run can pick up any content-driven Linux diffs.

Accessibility: `e2e/accessibility.smoke.spec.ts` passes, and axe (WCAG 2.0 and 2.1 A and AA) reports no violations inside the open menu for both headers, all four sections, at 1440 and 390.

## Out of scope

- A sitewide footer.
- Company chips that link individual company pages.
- Pricing as a server-rendered link: it would change the neutral auth-slot contract and needs its own decision.
- A top-bar search icon or a product switcher.
- New pages.

## Status

| Step | Status | Date | Notes |
|---|---|---|---|
| 0 | Done | 2026-10-14 | This document and the router rule; link-preservation rule and the two exclusions recorded on 2026-10-15 |
| 1 | Done | 2026-10-15 | Catalog, validator and tests in `test:link-equity`; card copy revised the same day |
| 2 | Done | 2026-10-15 | Panel component and unit tests |
| 3 | Done | 2026-10-15 | App header on the panel; dead study-panel CSS removed |
| 4 | Done | 2026-10-15 | Marketing top bar: Interview Prep, Interview Questions, Pricing, Log in, CTA |
| 5 | Done | 2026-10-15 | `seo:prep-menu` in `verify:seo-prerender-guard`; raw-HTML menu check in `seo-ssr.spec.ts` |
| 6 | In progress | 2026-10-15 | Sizes, dates, hydration and accessibility pass locally; macOS home references updated; Linux references need the UI Regression workflow |
| 7 | Not started | | |
