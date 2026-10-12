# GreatFrontEnd sitemap and indexing audit, with trivia overlap — 2026-10-11

> Historical audit. Do not load by default; route into context only for competitor-SEO, sitemap-strategy or trivia-topic-selection work. Everything here was measured on 2026-10-11 from `https://www.greatfrontend.com/robots.txt`, both sitemaps, about 50 sample pages fetched with a Chrome and a Googlebot user agent, and a status/robots/canonical sweep of all 1,085 sitemap URLs. The overlap section joins GreatFrontEnd's quiz list with our 261 trivia pages and the Search Console exports under `frontend/tmp/gsc-monitor/2026-10-08/` (gitignored). "Indexable" below means the technical signals allow indexing; we have no view of GreatFrontEnd's actual index.

## Short answer

GreatFrontEnd uses no `noindex` anywhere except its 404 page. Index control is done with canonicals and with what is left out of the sitemap. The sitemap holds the English canonical question pages, listing hubs, playbooks, company guides and the blog; framework variants, translations and the system design question pages are crawlable but not in the sitemap. Their main sitemap `lastmod` is the deploy timestamp on every URL, so it carries no information. Their SEO engine is 283 free quiz pages whose full answer is server-rendered; coding questions server-render the official solution when it is free and only an upsell block when it is premium.

## Sitemap inventory

Two sitemaps, both referenced from robots.txt, no sitemap index: `/sitemap.xml` (908 URLs) and `/blog/sitemap.xml` (177 URLs). No hreflang alternates inside either file.

| Group | URLs | Notes |
|---|---|---|
| `/questions/quiz/*` | 284 | all free, answer fully server-rendered |
| `/questions/javascript/*` | 205 | `?language=ts` variant canonicals to the base URL |
| `/questions/algo/*` | 92 | |
| `/questions/user-interface/*` | 59 | base URL only; the five framework variants are not in the sitemap |
| `/questions/system-design` | 1 | none of the 20 system design question pages is in the sitemap |
| Format and stack listing hubs | 24 | `/questions/react-interview-questions`, `/questions/formats/quiz`, etc. |
| `/interviews/company/*/questions-guides` | 38 | one page per company (Adobe to Uber, including Anthropic, OpenAI, Harvey, Ramp); `/interviews/company/google` itself is a 404 |
| `/interviews/*` (focus areas, study plans, pricing, faq, roadmap, promotions) | 25 | |
| Four playbooks (front-end interview, React, system design, behavioral) | 38 | |
| `/projects/*` (challenges, skills, tracks, submissions) | 120 | separate product, no hreflang |
| Blog posts / tags / series | 139 / 25 / 10 | plus `/blog`, `/blog/explore`, `/blog/latest` |
| Other (jobs 9, legal 2, login, sign-up, about, team, contact, affiliates, rewards) | 21 | login and sign-up are in the sitemap; `/rewards` is a 404 |

Every one of the 1,085 URLs returned 200 on a GET sweep except that `/rewards` is a 404 on repeated checks; `changefreq` is `daily` and `priority` is `0.7` on every entry.

## Index and canonical decisions

- **No meta robots, no `X-Robots-Tag`.** The only `noindex` is on the 404 page. robots.txt disallows only `/logout`, `/password/`, `/payment/`, `/profile`.
- **UI framework variants.** `/questions/user-interface/<slug>/{react,vanilla,vue,angular,svelte}` (about 285 URLs) all return 200 with a framework-specific title ("Accordion II in Vue") and `rel=canonical` to the base slug. The base page is the React version. The Vue, Svelte and Angular listing hubs link to these variants, so those hubs point at pages that are canonicalised away. This is also why GreatFrontEnd effectively does not index Angular or Vue question pages.
- **Translations.** `/zh-CN/...` and `/pt-BR/...` are self-canonical with on-page hreflang (`en-US`, `x-default`, `pt-BR`, `zh-CN`). They are absent from the sitemap. The pt-BR debounce page still carries the English title, so some locales are partial translations. Projects pages have no hreflang.
- **System design questions.** The 20 question pages are indexable, self-canonical and linked from `/questions/system-design`, but excluded from the sitemap. 18 to 19 of the 20 are premium, which reads as a deliberate choice not to push thin premium pages.
- **Query parameters.** `?language=ts` canonicals to the clean URL; no `noindex`.
- **Legacy paths redirect with 307**, the Next.js default, not 301: `/prepare` → `/interviews/dashboard` → `/interviews/get-started` (chain), `/front-end-interview-guidebook` → `/front-end-interview-playbook`, `/system-design/*` → `/front-end-system-design-playbook/*` → 404 with `noindex` and a canonical to the home page.

## lastmod

All 908 main-sitemap URLs share one `lastmod` (`2026-10-11T03:21:17.752Z` at fetch time), which is the generation timestamp; the CDN served the file from cache (`x-vercel-cache: HIT`, `age` about 7.5 hours). Question pages' JSON-LD say `datePublished` = `dateModified` = 2022, so the sitemap contradicts the page. The blog sitemap is the opposite: post `lastmod` matches the post's `dateModified` (checked on the React questions post, 2026-09-08T11:30), and tag/series pages carry no `lastmod`. This is the same shared-template inflation we fixed in e4ec7101; GreatFrontEnd has not.

## Paywall and rendering, as Googlebot sees it

Chrome and Googlebot user agents receive byte-identical HTML; there is no cloaking. Access tiers are `free`, `standard` and `premium`. Counts below come from the `"access"` markers in each listing page's RSC payload; the JavaScript listing's payload includes extra entries, so that row is approximate.

| Format | free | standard | premium |
|---|---|---|---|
| Quiz | 283 | 0 | 0 |
| Algo | 11 | 81 | 0 |
| UI | 7 | 11 | 41 |
| System design | 2 | 0 | 18 |
| JavaScript (listing payload) | 24 | 130 | 199 |

- **Quiz pages** server-render the TL;DR and the complete answer (about 16k characters of visible text on the event-delegation page). This is the long-tail engine.
- **Coding questions** keep the problem description in the RSC payload (rendered after hydration) and server-render the **official solution** when it is free (debounce, data table: solution code and "Alternative implementation" prose are in visible HTML). When the solution is premium (array-reduce, accordion) the only visible content is the "Premium solution — Unlock the official solution" block.
- **System design** free questions server-render the full article; premium ones (Pinterest) serve metadata and navigation only.
- **JSON-LD** is `Article` on every question with `isAccessibleForFree` true or false, but no `hasPart` / `cssSelector`, so premium pages do not follow Google's paywalled-content markup and sit in the index as thin pages. `datePublished` and `dateModified` are the 2022 creation dates. Blog posts use `Person` ("GreatFrontEnd Team") plus `publisher`.
- Pages are heavy: home 3.3 MB of HTML, JavaScript listing 5 MB, `/blog` 13.7 MB.

## Sitemap hygiene errors

- `/interviews/study-plans/blind75` and `/interviews/study-plans/gfe75` canonical to `/interviews/blind75` and `/interviews/gfe75`; both pairs are in the sitemap.
- `/projects/promotions` canonicals to `/interviews/promotions`.
- Blog tags `career`, `career%20`, `carrer`, `carrer%20` are four pages; two are self-canonical, `carrer%20` canonicals to `carrer`, so unnormalised CMS tags leak into the sitemap.
- `/rewards` is in the sitemap and returns 404. `/sign-up` and `/login` are in the sitemap.
- Blog posts have no `article:published_time`; `og:type` is `website` everywhere.

## What this changes for FrontendAtlas (verified 2026-10-11)

| Idea from the audit | Our state | Action |
|---|---|---|
| Fold framework/language variants into one canonical | No duplicate slugs across tech prefixes in `frontend/src/prerender.routes.txt`; query-parameter URLs get `noindex,follow` | None |
| Server-render quiz answers | Trivia pages are prerendered with `index,follow`, self-canonical and the full answer in HTML (checked live with a Googlebot UA) | None; the gap is topic choice, not rendering |
| Paywall markup (`hasPart`) on premium | Premium coding pages are `noindex,follow` via `robotsForContentAccess` and excluded from the sitemap (39 of 88 JavaScript coding routes are listed) | None; indexing thin previews would add weak pages during index shedding |
| Normalise generated tag pages | We have no tag or topic routes; `lint-tags` and `lint-topics` enforce canonical tags in the registry | None |
| Real `lastmod` | Per-entry dating since e4ec7101 | Keep; this is a relative advantage |
| Angular, Vue, RxJS depth | GreatFrontEnd canonicalises its Vue/Angular/Svelte variants away and has no Angular/Vue quiz pages | Keep investing here; it is the uncontested field |

## Wave 1 shipped on dev (2026-10-12)

Scope: steps 1 and 2 of the recommendation above, applied to the catalog in one change set.

| Action | Count | Detail |
|---|---|---|
| Retired trivia identities (301 to a merge target or the tech hub) | 25 | recorded under `retired` in `frontend/scripts/question-id-manifest.json` with `redirectTo`, `retiredAt` and `reason`; permanent redirects in `frontend/vercel.json` |
| Merge targets re-titled as the interviewer's follow-up and extended with the absorbed content | 8 | js-hoisting, js-promises-async-await, js-check-data-type-with-typeof, js-event-delegation, react-rerender-decision-and-render, react-diffing-algorithm, react-strictmode-double-invoke-effects (title kept), css-cascade-order; css-make-element-responsive absorbed media queries and kept its title |
| Re-titled with a new opening block that answers the bug or follow-up | 13 | react-controlled-vs-uncontrolled, react-error-boundaries-what-they-solve, react-useeffect-vs-uselayouteffect, react-usememo-vs-usecallback, react-useref-vs-usestate, react-portals, css-position-relative-absolute-fixed, css-box-model, css-visibility-vs-display, js-this-keyword, js-mutability-vs-immutability, js-spread-vs-rest-parameters, js-tree-shaking |
| Trivia pages after the wave | 236 | was 261; sitemap 437 to 412 URLs |

Merges: js-hoisting-tdz and js-var-let-const-hoisting into js-hoisting (js-var-hoisting-shadowing-output stays, it is the interactive output format); react-component-rerendering and react-prevent-unnecessary-rerenders into react-rerender-decision-and-render; react-reconciliation and react-virtual-dom into react-diffing-algorithm; css-specificity-hierarchy and css-id-vs-class into css-cascade-order; js-promise-fundamental-understanding, js-callbacks and js-calback-hell-resolved-with-promise into js-promises-async-await; react-strictmode-purpose into react-strictmode-double-invoke-effects; js-data-types and js-nan-property into js-check-data-type-with-typeof; js-event-bubbling-capturing into js-event-delegation; css-media-queries into css-make-element-responsive. Folded into the hub with no merge target: css-definition, css-make-text-bold, css-center-text, css-change-text-size, css-background-color, css-border-property, css-text-color, css-link-html, html-br-tag.

Governance: `validate-question-identities` now accepts a removal only when the manifest records the identity as retired with an absolute `redirectTo`, rejects a retired identity that reappears in the catalog, and `update-question-id-manifest` carries the retired list forward. Progress semantics are unchanged: removed questions drop out of totals and historical XP is kept (see `frontend/docs/question-governance.md`).

Measurement follows the roadmap protocol: URL Inspection for the 21 re-titled or merged pages on deploy day (daily quota about 10, so three days), index status only at day 14, impressions and CTR at six to eight weeks. The retired review snapshots under `content-reviews/trivia/` were left in place as history; the competitive-readiness lint reads reviews by catalog entry, so they are inert. The pre-existing 66 competitive-readiness errors on dev (angular-http, js-equality, forms, strictmode and others) were not touched by this wave.

## Trivia overlap with GreatFrontEnd's quiz list

GreatFrontEnd's 283 quiz slugs are the question text: 133 start with "what", 60 with "explain", 51 with "how", 9 with "describe". The match below was produced by IDF-weighted token overlap on our trivia titles and SEO titles against the slugs, then hand-reviewed one by one against the full slug list; automatic matches that only shared generic words (attribute, callback, pattern, render) were rejected, and misses such as `js-closures`, `js-equality-vs-strict-equality` and `debounce-vs-throttle-search-input` were added. Status and 28-day impressions come from the 2026-10-08 Search Console exports (window 2026-09-08 to 2026-10-05).

| Verdict | Pages | Indexed | Indexed, 0 impr. | Crawled, not indexed | Discovered, never crawled | 28d impressions |
|---|---|---|---|---|---|---|
| Head-on: same question exists as a GreatFrontEnd quiz | 81 | 44 | 10 | 22 | 5 | 1,275 |
| Concept shared, our angle differs (why / bug / predict output) | 39 | 23 | 5 | 6 | 5 | 817 |
| No GreatFrontEnd quiz equivalent | 141 | 77 | 3 | 37 | 24 | 7,923 |

The 81 head-on pages are 31% of trivia but earn 13% of trivia impressions, and 27 of them (one in three) have been crawled and dropped or never crawled. The 141 pages with no GreatFrontEnd equivalent earn 79% of impressions; 77 of those 141 are Angular and Vue. By tech, the head-on set is 44 JavaScript, 22 React, 10 CSS and 5 HTML; no Angular or Vue page is head-on.

Reading: for a head-on page we are the third copy behind MDN and a stronger domain, which matches the "Crawled, currently not indexed" pattern in `docs/audits/gsc-issues.md`. Options per page are to re-angle it to the interviewer's follow-up (what breaks, when it is the wrong choice, predict the output), to fold it into the tech hub as a section, or to leave it as a low-expectation support page. The concept-shared set is already the re-angled form and should keep its angle. The no-equivalent set is where new trivia should go.

### Head-on overlap: GreatFrontEnd has a quiz page on the same question (81 pages)

| Our page | Status (2026-10-08) | 28d impr. | GreatFrontEnd quiz |
|---|---|---|---|
| `/css/trivia/css-grid-vs-flexbox` | indexed | 10 | [have-you-played-around-with-the-new-css-flexbox-or-grid-specs](https://www.greatfrontend.com/questions/quiz/have-you-played-around-with-the-new-css-flexbox-or-grid-specs) |
| `/css/trivia/css-pseudo-classes-elements` | indexed | 1 | [describe-pseudo-elements-and-discuss-what-they-are-used-for](https://www.greatfrontend.com/questions/quiz/describe-pseudo-elements-and-discuss-what-they-are-used-for) |
| `/css/trivia/css-position-relative-absolute-fixed` | crawled, not indexed | 0 | [whats-the-difference-between-a-relative-fixed-absolute-and-statically-](https://www.greatfrontend.com/questions/quiz/whats-the-difference-between-a-relative-fixed-absolute-and-statically-positioned-element) |
| `/css/trivia/css-float-clear` | indexed, 0 impressions | 0 | [describe-floats-and-how-they-work](https://www.greatfrontend.com/questions/quiz/describe-floats-and-how-they-work) |
| `/css/trivia/css-specificity-hierarchy` | discovered, never crawled | 0 | [what-is-css-selector-specificity-and-how-does-it-work](https://www.greatfrontend.com/questions/quiz/what-is-css-selector-specificity-and-how-does-it-work) |
| `/css/trivia/css-z-index` | indexed, 0 impressions | 0 | [describe-z-index-and-how-stacking-context-is-formed](https://www.greatfrontend.com/questions/quiz/describe-z-index-and-how-stacking-context-is-formed) |
| `/css/trivia/css-media-queries` | crawled, not indexed | 0 | [have-you-used-or-implemented-media-queries-or-mobile-specific-layouts-](https://www.greatfrontend.com/questions/quiz/have-you-used-or-implemented-media-queries-or-mobile-specific-layouts-css) |
| `/css/trivia/css-visibility-vs-display` | crawled, not indexed | 0 | [what-are-the-different-ways-to-visually-hide-content-and-make-it-avail](https://www.greatfrontend.com/questions/quiz/what-are-the-different-ways-to-visually-hide-content-and-make-it-available-only-for-screen-readers) |
| `/css/trivia/css-link-html` | discovered, never crawled | 0 | [css-link-between-head-and-js-script-just-before-body](https://www.greatfrontend.com/questions/quiz/css-link-between-head-and-js-script-just-before-body) |
| `/css/trivia/css-box-model` | crawled, not indexed | 0 | [explain-your-understanding-of-the-box-model-and-how-you-would-tell-the](https://www.greatfrontend.com/questions/quiz/explain-your-understanding-of-the-box-model-and-how-you-would-tell-the-browser-in-css-to-render-your-layout-in-different-box-models) |
| `/html/trivia/html-data-attribute` | indexed | 55 | [what-are-data-attributes-good-for](https://www.greatfrontend.com/questions/quiz/what-are-data-attributes-good-for) |
| `/html/trivia/html-img-srcset` | indexed | 25 | [why-you-would-use-a-srcset-attribute-in-an-image-tag](https://www.greatfrontend.com/questions/quiz/why-you-would-use-a-srcset-attribute-in-an-image-tag) |
| `/html/trivia/html-block-inline-elements` | indexed | 13 | [whats-the-difference-between-inline-and-inline-block](https://www.greatfrontend.com/questions/quiz/whats-the-difference-between-inline-and-inline-block) |
| `/html/trivia/html-dom` | indexed, 0 impressions | 0 | [what-is-the-dom-and-how-is-it-structured](https://www.greatfrontend.com/questions/quiz/what-is-the-dom-and-how-is-it-structured) |
| `/html/trivia/html-dom-tree-structure` | indexed, 0 impressions | 0 | [what-is-the-dom-and-how-is-it-structured](https://www.greatfrontend.com/questions/quiz/what-is-the-dom-and-how-is-it-structured) |
| `/javascript/trivia/js-check-data-type-with-typeof` | indexed | 82 | [how-do-you-check-the-data-type-of-a-variable](https://www.greatfrontend.com/questions/quiz/how-do-you-check-the-data-type-of-a-variable) |
| `/javascript/trivia/js-hoisting` | indexed | 46 | [explain-hoisting](https://www.greatfrontend.com/questions/quiz/explain-hoisting) |
| `/javascript/trivia/js-null-undefined-undeclared` | indexed | 22 | [whats-the-difference-between-a-variable-that-is-null-undefined-or-unde](https://www.greatfrontend.com/questions/quiz/whats-the-difference-between-a-variable-that-is-null-undefined-or-undeclared-how-would-you-go-about-checking-for-any-of-these-states) |
| `/javascript/trivia/js-deferred-scripts` | indexed | 19 | [describe-the-difference-between-script-async-and-script-defer](https://www.greatfrontend.com/questions/quiz/describe-the-difference-between-script-async-and-script-defer) |
| `/javascript/trivia/js-calback-hell-resolved-with-promise` | indexed | 14 | [what-are-the-pros-and-cons-of-using-promises-instead-of-callbacks](https://www.greatfrontend.com/questions/quiz/what-are-the-pros-and-cons-of-using-promises-instead-of-callbacks) |
| `/javascript/trivia/js-mock-vs-stub-vs-spy` | indexed | 13 | [what-are-mocks-and-stubs-and-how-are-they-used-in-testing](https://www.greatfrontend.com/questions/quiz/what-are-mocks-and-stubs-and-how-are-they-used-in-testing) |
| `/javascript/trivia/js-microtasks-vs-macrotasks` | indexed | 9 | [explain-the-concept-of-a-microtask-queue](https://www.greatfrontend.com/questions/quiz/explain-the-concept-of-a-microtask-queue) |
| `/javascript/trivia/js-object-destructuring` | indexed | 9 | [explain-the-concept-of-destructuring-assignment-for-objects-and-arrays](https://www.greatfrontend.com/questions/quiz/explain-the-concept-of-destructuring-assignment-for-objects-and-arrays) |
| `/javascript/trivia/js-closures` | indexed | 8 | [what-is-a-closure-and-how-why-would-you-use-one](https://www.greatfrontend.com/questions/quiz/what-is-a-closure-and-how-why-would-you-use-one) |
| `/javascript/trivia/js-use-strict-describe` | indexed | 8 | [what-is-use-strict-what-are-the-advantages-and-disadvantages-to-using-](https://www.greatfrontend.com/questions/quiz/what-is-use-strict-what-are-the-advantages-and-disadvantages-to-using-it) |
| `/javascript/trivia/js-event-delegation` | indexed | 5 | [explain-event-delegation](https://www.greatfrontend.com/questions/quiz/explain-event-delegation) |
| `/javascript/trivia/js-arrow-vs-regular-functions` | indexed | 5 | [can-you-offer-a-use-case-for-the-new-arrow-function-syntax-how-does-th](https://www.greatfrontend.com/questions/quiz/can-you-offer-a-use-case-for-the-new-arrow-function-syntax-how-does-this-new-syntax-differ-from-other-functions) |
| `/javascript/trivia/js-shallow-vs-deep-copy` | indexed | 5 | [explain-the-difference-between-shallow-copy-and-deep-copy](https://www.greatfrontend.com/questions/quiz/explain-the-difference-between-shallow-copy-and-deep-copy) |
| `/javascript/trivia/js-object-creation-methods` | indexed | 5 | [what-are-the-various-ways-to-create-objects-in-javascript](https://www.greatfrontend.com/questions/quiz/what-are-the-various-ways-to-create-objects-in-javascript) |
| `/javascript/trivia/js-call-apply-bind` | indexed | 4 | [whats-the-difference-between-call-and-apply](https://www.greatfrontend.com/questions/quiz/whats-the-difference-between-call-and-apply) |
| `/javascript/trivia/js-prototype-vs-proto` | indexed | 3 | [what-is-the-prototype-chain-and-how-does-it-work](https://www.greatfrontend.com/questions/quiz/what-is-the-prototype-chain-and-how-does-it-work) |
| `/javascript/trivia/js-garbage-collection-and-gc-pauses` | indexed | 3 | [how-does-javascript-garbage-collection-work](https://www.greatfrontend.com/questions/quiz/how-does-javascript-garbage-collection-work) |
| `/javascript/trivia/js-block-scoped-or-function-scoped` | indexed | 3 | [explain-the-difference-between-global-scope-function-scope-and-block-s](https://www.greatfrontend.com/questions/quiz/explain-the-difference-between-global-scope-function-scope-and-block-scope) |
| `/javascript/trivia/js-esm-vs-cjs` | indexed | 3 | [explain-the-differences-between-commonjs-modules-and-es-modules](https://www.greatfrontend.com/questions/quiz/explain-the-differences-between-commonjs-modules-and-es-modules) |
| `/javascript/trivia/js-higher-order-function` | indexed | 2 | [what-is-the-definition-of-a-higher-order-function](https://www.greatfrontend.com/questions/quiz/what-is-the-definition-of-a-higher-order-function) |
| `/javascript/trivia/js-prototypal-inheritance` | indexed | 2 | [explain-how-prototypal-inheritance-works](https://www.greatfrontend.com/questions/quiz/explain-how-prototypal-inheritance-works) |
| `/javascript/trivia/js-map-vs-object` | indexed | 2 | [what-is-the-difference-between-a-map-object-and-a-plain-object-in-java](https://www.greatfrontend.com/questions/quiz/what-is-the-difference-between-a-map-object-and-a-plain-object-in-javascript) |
| `/javascript/trivia/js-tree-shaking` | crawled, not indexed | 2 | [explain-the-concept-of-tree-shaking-in-module-bundling](https://www.greatfrontend.com/questions/quiz/explain-the-concept-of-tree-shaking-in-module-bundling) |
| `/javascript/trivia/js-equality-vs-strict-equality` | indexed | 2 | [what-is-the-difference-between-double-equal-and-triple-equal](https://www.greatfrontend.com/questions/quiz/what-is-the-difference-between-double-equal-and-triple-equal) |
| `/javascript/trivia/js-cookie-sessionstorage-localstorage` | indexed | 1 | [describe-the-difference-between-a-cookie-sessionstorage-and-localstora](https://www.greatfrontend.com/questions/quiz/describe-the-difference-between-a-cookie-sessionstorage-and-localstorage) |
| `/javascript/trivia/js-data-types` | crawled, not indexed | 1 | [what-are-the-various-data-types-in-javascript](https://www.greatfrontend.com/questions/quiz/what-are-the-various-data-types-in-javascript) |
| `/javascript/trivia/js-performance-profiling-workflow` | indexed | 1 | [what-are-some-tools-that-can-be-used-to-measure-and-analyze-javascript](https://www.greatfrontend.com/questions/quiz/what-are-some-tools-that-can-be-used-to-measure-and-analyze-javascript-performance) |
| `/javascript/trivia/js-undefined-vs-not-defined` | indexed | 1 | [whats-the-difference-between-a-variable-that-is-null-undefined-or-unde](https://www.greatfrontend.com/questions/quiz/whats-the-difference-between-a-variable-that-is-null-undefined-or-undeclared-how-would-you-go-about-checking-for-any-of-these-states) |
| `/javascript/trivia/js-var-let-const-hoisting` | crawled, not indexed | 0 | [explain-the-difference-in-hoisting-between-var-let-and-const](https://www.greatfrontend.com/questions/quiz/explain-the-difference-in-hoisting-between-var-let-and-const) |
| `/javascript/trivia/js-event-bubbling-capturing` | discovered, never crawled | 0 | [describe-event-bubbling](https://www.greatfrontend.com/questions/quiz/describe-event-bubbling) |
| `/javascript/trivia/js-currying` | indexed, 0 impressions | 0 | [what-is-currying-and-how-does-it-work](https://www.greatfrontend.com/questions/quiz/what-is-currying-and-how-does-it-work) |
| `/javascript/trivia/js-arrow-functions` | indexed, 0 impressions | 0 | [can-you-offer-a-use-case-for-the-new-arrow-function-syntax-how-does-th](https://www.greatfrontend.com/questions/quiz/can-you-offer-a-use-case-for-the-new-arrow-function-syntax-how-does-this-new-syntax-differ-from-other-functions) |
| `/javascript/trivia/js-spread-vs-rest-parameters` | crawled, not indexed | 0 | [what-are-the-benefits-of-using-spread-syntax-and-how-is-it-different-f](https://www.greatfrontend.com/questions/quiz/what-are-the-benefits-of-using-spread-syntax-and-how-is-it-different-from-rest-syntax) |
| `/javascript/trivia/js-design-patterns` | indexed, 0 impressions | 0 | [what-are-design-patterns-and-why-are-they-useful](https://www.greatfrontend.com/questions/quiz/what-are-design-patterns-and-why-are-they-useful) |
| `/javascript/trivia/js-map-set-get` | indexed, 0 impressions | 0 | [what-are-sets-and-maps-and-how-are-they-used](https://www.greatfrontend.com/questions/quiz/what-are-sets-and-maps-and-how-are-they-used) |
| `/javascript/trivia/js-web-workers-basics` | indexed, 0 impressions | 0 | [what-are-web-workers-and-how-can-they-be-used-to-improve-performance](https://www.greatfrontend.com/questions/quiz/what-are-web-workers-and-how-can-they-be-used-to-improve-performance) |
| `/javascript/trivia/js-this-keyword` | crawled, not indexed | 0 | [explain-how-this-works-in-javascript](https://www.greatfrontend.com/questions/quiz/explain-how-this-works-in-javascript) |
| `/javascript/trivia/js-hoisting-tdz` | crawled, not indexed | 0 | [what-are-the-potential-issues-caused-by-hoisting](https://www.greatfrontend.com/questions/quiz/what-are-the-potential-issues-caused-by-hoisting) |
| `/javascript/trivia/js-promises-async-await` | indexed, 0 impressions | 0 | [what-is-asyncawait-and-how-does-it-simplify-asynchronous-code](https://www.greatfrontend.com/questions/quiz/what-is-asyncawait-and-how-does-it-simplify-asynchronous-code) |
| `/javascript/trivia/js-promise-fundamental-understanding` | crawled, not indexed | 0 | [what-are-promises-and-how-do-they-work](https://www.greatfrontend.com/questions/quiz/what-are-promises-and-how-do-they-work) |
| `/javascript/trivia/js-promise-combinators-all-allsettled-race-any` | discovered, never crawled | 0 | [how-is-promiseall-different-from-promiseallsettled](https://www.greatfrontend.com/questions/quiz/how-is-promiseall-different-from-promiseallsettled) |
| `/javascript/trivia/js-callbacks` | crawled, not indexed | 0 | [what-are-callback-functions-and-how-are-they-used](https://www.greatfrontend.com/questions/quiz/what-are-callback-functions-and-how-are-they-used) |
| `/javascript/trivia/js-mutability-vs-immutability` | crawled, not indexed | 0 | [explain-the-difference-between-mutable-and-immutable-objects](https://www.greatfrontend.com/questions/quiz/explain-the-difference-between-mutable-and-immutable-objects) |
| `/javascript/trivia/debounce-vs-throttle-search-input` | crawled, not indexed | 0 | [explain-the-concept-of-debouncing-and-throttling](https://www.greatfrontend.com/questions/quiz/explain-the-concept-of-debouncing-and-throttling) |
| `/react/trivia/react-jsx-transform-and-why-not-required` | indexed | 377 | [what-is-jsx-and-how-does-it-work](https://www.greatfrontend.com/questions/quiz/what-is-jsx-and-how-does-it-work) |
| `/react/trivia/react-useeffect-purpose` | indexed | 95 | [what-does-the-dependency-array-of-useeffect-affect](https://www.greatfrontend.com/questions/quiz/what-does-the-dependency-array-of-useeffect-affect) |
| `/react/trivia/react-core-problem-and-non-goals` | indexed | 95 | [what-is-react-describe-the-benefits-of-react](https://www.greatfrontend.com/questions/quiz/what-is-react-describe-the-benefits-of-react) |
| `/react/trivia/react-diffing-algorithm` | indexed | 64 | [what-is-reconciliation-in-react](https://www.greatfrontend.com/questions/quiz/what-is-reconciliation-in-react) |
| `/react/trivia/react-why-hooks-have-rules` | indexed | 52 | [what-are-the-rules-of-react-hooks](https://www.greatfrontend.com/questions/quiz/what-are-the-rules-of-react-hooks) |
| `/react/trivia/react-keys-in-lists` | indexed | 44 | [what-is-the-purpose-of-the-key-prop-in-react](https://www.greatfrontend.com/questions/quiz/what-is-the-purpose-of-the-key-prop-in-react) |
| `/react/trivia/react-rerender-decision-and-render` | indexed | 37 | [what-does-re-rendering-mean-in-react](https://www.greatfrontend.com/questions/quiz/what-does-re-rendering-mean-in-react) |
| `/react/trivia/react-error-boundaries-what-they-solve` | crawled, not indexed | 32 | [what-are-error-boundaries-in-react-for](https://www.greatfrontend.com/questions/quiz/what-are-error-boundaries-in-react-for) |
| `/react/trivia/react-virtual-dom` | indexed | 28 | [what-is-virtual-dom-in-react](https://www.greatfrontend.com/questions/quiz/what-is-virtual-dom-in-react) |
| `/react/trivia/react-fragments-dom-and-reconciliation` | indexed | 22 | [what-are-react-fragments-used-for](https://www.greatfrontend.com/questions/quiz/what-are-react-fragments-used-for) |
| `/react/trivia/react-context-performance-issues` | indexed | 22 | [what-are-some-pitfalls-about-using-context-in-react](https://www.greatfrontend.com/questions/quiz/what-are-some-pitfalls-about-using-context-in-react) |
| `/react/trivia/react-one-way-data-flow` | indexed | 16 | [explain-one-way-data-flow-of-react-and-its-benefits](https://www.greatfrontend.com/questions/quiz/explain-one-way-data-flow-of-react-and-its-benefits) |
| `/react/trivia/react-render-props-vs-hocs` | indexed | 6 | [what-are-render-props-in-react-and-what-are-they-for](https://www.greatfrontend.com/questions/quiz/what-are-render-props-in-react-and-what-are-they-for) |
| `/react/trivia/react-higher-order-components` | indexed | 1 | [what-are-higher-order-components-in-react](https://www.greatfrontend.com/questions/quiz/what-are-higher-order-components-in-react) |
| `/react/trivia/react-controlled-vs-uncontrolled` | crawled, not indexed | 0 | [what-is-the-difference-between-controlled-and-uncontrolled-react-compo](https://www.greatfrontend.com/questions/quiz/what-is-the-difference-between-controlled-and-uncontrolled-react-components) |
| `/react/trivia/react-component-rerendering` | crawled, not indexed | 0 | [what-does-re-rendering-mean-in-react](https://www.greatfrontend.com/questions/quiz/what-does-re-rendering-mean-in-react) |
| `/react/trivia/react-reconciliation` | discovered, never crawled | 0 | [what-is-reconciliation-in-react](https://www.greatfrontend.com/questions/quiz/what-is-reconciliation-in-react) |
| `/react/trivia/react-portals` | crawled, not indexed | 0 | [what-are-react-portals-used-for](https://www.greatfrontend.com/questions/quiz/what-are-react-portals-used-for) |
| `/react/trivia/react-useeffect-vs-uselayouteffect` | crawled, not indexed | 0 | [what-is-the-difference-between-useeffect-and-uselayouteffect-in-react](https://www.greatfrontend.com/questions/quiz/what-is-the-difference-between-useeffect-and-uselayouteffect-in-react) |
| `/react/trivia/react-usememo-vs-usecallback` | crawled, not indexed | 0 | [what-is-the-usememo-hook-in-react-and-when-should-it-be-used](https://www.greatfrontend.com/questions/quiz/what-is-the-usememo-hook-in-react-and-when-should-it-be-used) |
| `/react/trivia/react-useref-vs-usestate` | crawled, not indexed | 0 | [what-is-the-useref-hook-in-react-and-when-should-it-be-used](https://www.greatfrontend.com/questions/quiz/what-is-the-useref-hook-in-react-and-when-should-it-be-used) |
| `/react/trivia/react-strictmode-purpose` | crawled, not indexed | 0 | [what-is-react-strict-mode-and-what-are-its-benefits](https://www.greatfrontend.com/questions/quiz/what-is-react-strict-mode-and-what-are-its-benefits) |

### Concept shared, angle differs: GreatFrontEnd covers the concept, our page asks a why/bug/predict variant (39 pages)

| Our page | Status (2026-10-08) | 28d impr. | Nearest GreatFrontEnd quiz |
|---|---|---|---|
| `/css/trivia/css-hardware-acceleration` | indexed | 9 | [is-there-any-reason-youd-want-to-use-translate-instead-of-absolute-pos](https://www.greatfrontend.com/questions/quiz/is-there-any-reason-youd-want-to-use-translate-instead-of-absolute-positioning-or-vice-versa-and-why) |
| `/css/trivia/css-margin-vs-padding` | indexed | 3 | [explain-your-understanding-of-the-box-model-and-how-you-would-tell-the](https://www.greatfrontend.com/questions/quiz/explain-your-understanding-of-the-box-model-and-how-you-would-tell-the-browser-in-css-to-render-your-layout-in-different-box-models) |
| `/css/trivia/css-make-element-responsive` | crawled, not indexed | 1 | [how-is-responsive-design-different-from-adaptive-design](https://www.greatfrontend.com/questions/quiz/how-is-responsive-design-different-from-adaptive-design) |
| `/css/trivia/css-cascade-order` | indexed, 0 impressions | 0 | [what-is-css-selector-specificity-and-how-does-it-work](https://www.greatfrontend.com/questions/quiz/what-is-css-selector-specificity-and-how-does-it-work) |
| `/css/trivia/css-padding-property` | crawled, not indexed | 0 | [explain-your-understanding-of-the-box-model-and-how-you-would-tell-the](https://www.greatfrontend.com/questions/quiz/explain-your-understanding-of-the-box-model-and-how-you-would-tell-the-browser-in-css-to-render-your-layout-in-different-box-models) |
| `/css/trivia/css-display-flex` | discovered, never crawled | 0 | [what-is-the-css-display-property-and-can-you-give-a-few-examples-of-it](https://www.greatfrontend.com/questions/quiz/what-is-the-css-display-property-and-can-you-give-a-few-examples-of-its-use) |
| `/css/trivia/css-margin-property` | indexed, 0 impressions | 0 | [explain-your-understanding-of-the-box-model-and-how-you-would-tell-the](https://www.greatfrontend.com/questions/quiz/explain-your-understanding-of-the-box-model-and-how-you-would-tell-the-browser-in-css-to-render-your-layout-in-different-box-models) |
| `/html/trivia/html-iframe-tag` | indexed | 48 | [how-do-iframe-on-a-page-communicate](https://www.greatfrontend.com/questions/quiz/how-do-iframe-on-a-page-communicate) |
| `/html/trivia/html-parsing-rendering` | indexed | 18 | [difference-between-document-load-event-and-document-domcontentloaded-e](https://www.greatfrontend.com/questions/quiz/difference-between-document-load-event-and-document-domcontentloaded-event) |
| `/html/trivia/web-accessibility-make-page-accessible` | indexed, 0 impressions | 0 | [what-are-the-different-ways-to-visually-hide-content-and-make-it-avail](https://www.greatfrontend.com/questions/quiz/what-are-the-different-ways-to-visually-hide-content-and-make-it-available-only-for-screen-readers) |
| `/javascript/trivia/js-event-loop` | indexed | 31 | [what-is-event-loop-what-is-the-difference-between-call-stack-and-task-](https://www.greatfrontend.com/questions/quiz/what-is-event-loop-what-is-the-difference-between-call-stack-and-task-queue) |
| `/javascript/trivia/js-map-filter-reduce` | indexed | 25 | [what-are-the-different-methods-for-iterating-over-an-array](https://www.greatfrontend.com/questions/quiz/what-are-the-different-methods-for-iterating-over-an-array) |
| `/javascript/trivia/js-type-coercion` | indexed | 21 | [what-is-the-difference-between-double-equal-and-triple-equal](https://www.greatfrontend.com/questions/quiz/what-is-the-difference-between-double-equal-and-triple-equal) |
| `/javascript/trivia/js-intl-datetime-timezone` | indexed | 11 | [what-is-the-intl-namespace-object-for](https://www.greatfrontend.com/questions/quiz/what-is-the-intl-namespace-object-for) |
| `/javascript/trivia/js-repaint-reflow` | indexed | 11 | [what-are-some-techniques-for-reducing-reflows-and-repaints](https://www.greatfrontend.com/questions/quiz/what-are-some-techniques-for-reducing-reflows-and-repaints) |
| `/javascript/trivia/js-xss-dom-sinks` | indexed | 7 | [what-is-cross-site-scripting-xss-and-how-can-you-prevent-it](https://www.greatfrontend.com/questions/quiz/what-is-cross-site-scripting-xss-and-how-can-you-prevent-it) |
| `/javascript/trivia/js-async-await-example-when-promise-is-preferred` | indexed | 6 | [what-is-asyncawait-and-how-does-it-simplify-asynchronous-code](https://www.greatfrontend.com/questions/quiz/what-is-asyncawait-and-how-does-it-simplify-asynchronous-code) |
| `/javascript/trivia/js-var-hoisting-shadowing-output` | indexed | 5 | [explain-hoisting](https://www.greatfrontend.com/questions/quiz/explain-hoisting) |
| `/javascript/trivia/js-classes` | crawled, not indexed | 4 | [what-are-the-differences-between-es6-class-and-es5-function-constructo](https://www.greatfrontend.com/questions/quiz/what-are-the-differences-between-es6-class-and-es5-function-constructors) |
| `/javascript/trivia/js-truthy-falsy-pass-by-value-reference-strict-equality-use-case` | indexed | 4 | [what-is-the-difference-between-double-equal-and-triple-equal](https://www.greatfrontend.com/questions/quiz/what-is-the-difference-between-double-equal-and-triple-equal) |
| `/javascript/trivia/js-object-create-vs-new` | indexed | 2 | [what-is-the-purpose-of-the-new-keyword](https://www.greatfrontend.com/questions/quiz/what-is-the-purpose-of-the-new-keyword) |
| `/javascript/trivia/js-event-loop-nested-microtask-output` | indexed, 0 impressions | 0 | [explain-the-concept-of-a-microtask-queue](https://www.greatfrontend.com/questions/quiz/explain-the-concept-of-a-microtask-queue) |
| `/javascript/trivia/js-foreach-vs-map` | discovered, never crawled | 0 | [what-are-the-different-methods-for-iterating-over-an-array](https://www.greatfrontend.com/questions/quiz/what-are-the-different-methods-for-iterating-over-an-array) |
| `/javascript/trivia/http-caching-basics` | indexed, 0 impressions | 0 | [explain-the-concept-of-caching-and-how-it-can-be-used-to-improve-perfo](https://www.greatfrontend.com/questions/quiz/explain-the-concept-of-caching-and-how-it-can-be-used-to-improve-performance) |
| `/javascript/trivia/js-secure-cors-handling` | crawled, not indexed | 0 | [explain-the-same-origin-policy-with-regards-to-javascript](https://www.greatfrontend.com/questions/quiz/explain-the-same-origin-policy-with-regards-to-javascript) |
| `/javascript/trivia/js-testing-edge-cases-strategy` | crawled, not indexed | 0 | [what-are-some-best-practices-for-writing-maintainable-and-effective-te](https://www.greatfrontend.com/questions/quiz/what-are-some-best-practices-for-writing-maintainable-and-effective-tests) |
| `/javascript/trivia/sse-vs-websocket-real-time` | crawled, not indexed | 0 | [what-are-server-sent-events](https://www.greatfrontend.com/questions/quiz/what-are-server-sent-events) |
| `/javascript/trivia/web-performance-optimize-load-time` | discovered, never crawled | 0 | [what-are-some-common-performance-bottlenecks-in-javascript-application](https://www.greatfrontend.com/questions/quiz/what-are-some-common-performance-bottlenecks-in-javascript-applications) |
| `/react/trivia/react-strictmode-double-invoke-effects` | indexed | 146 | [what-is-react-strict-mode-and-what-are-its-benefits](https://www.greatfrontend.com/questions/quiz/what-is-react-strict-mode-and-what-are-its-benefits) |
| `/react/trivia/react-why-props-immutable` | indexed | 143 | [why-does-react-recommend-against-mutating-state](https://www.greatfrontend.com/questions/quiz/why-does-react-recommend-against-mutating-state) |
| `/react/trivia/react-derived-state-anti-pattern` | indexed | 127 | [what-are-some-react-anti-patterns](https://www.greatfrontend.com/questions/quiz/what-are-some-react-anti-patterns) |
| `/react/trivia/react-why-batching-state-updates` | indexed | 80 | [explain-what-happens-when-setstate-is-called-in-react](https://www.greatfrontend.com/questions/quiz/explain-what-happens-when-setstate-is-called-in-react) |
| `/react/trivia/react-pure-function-of-props-and-state` | indexed | 49 | [what-is-the-difference-between-state-and-props-in-react](https://www.greatfrontend.com/questions/quiz/what-is-the-difference-between-state-and-props-in-react) |
| `/react/trivia/react-lifting-state-up` | indexed | 43 | [how-do-you-decide-between-using-react-state-context-and-external-state](https://www.greatfrontend.com/questions/quiz/how-do-you-decide-between-using-react-state-context-and-external-state-managers) |
| `/react/trivia/react-default-vs-named-exports-runtime-break` | indexed | 14 | [how-do-you-import-and-export-modules-in-javascript](https://www.greatfrontend.com/questions/quiz/how-do-you-import-and-export-modules-in-javascript) |
| `/react/trivia/react-mixing-state-and-props-responsibilities` | indexed | 7 | [what-is-the-difference-between-state-and-props-in-react](https://www.greatfrontend.com/questions/quiz/what-is-the-difference-between-state-and-props-in-react) |
| `/react/trivia/react-prevent-unnecessary-rerenders` | indexed | 2 | [how-would-one-optimize-the-performance-of-react-contexts-to-reduce-rer](https://www.greatfrontend.com/questions/quiz/how-would-one-optimize-the-performance-of-react-contexts-to-reduce-rerenders) |
| `/react/trivia/react-why-event-delegation` | discovered, never crawled | 0 | [explain-event-delegation](https://www.greatfrontend.com/questions/quiz/explain-event-delegation) |
| `/react/trivia/react-concurrent-rendering` | discovered, never crawled | 0 | [what-is-react-fiber-and-how-is-it-an-improvement-over-the-previous-app](https://www.greatfrontend.com/questions/quiz/what-is-react-fiber-and-how-is-it-an-improvement-over-the-previous-approach) |

### No GreatFrontEnd quiz equivalent (141 pages)

- **angular** (43): `angular-http-what-actually-cancels-request`, `rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use`, `angular-lifecycle-constructor-oninit-afterviewinit-dom`, `angular-observables-rxjs`, `rxjs-tap-vs-map-angular-when-to-use`, `angular-template-driven-vs-reactive-forms-which-scales`, `rxjs-subject-vs-behaviorsubject-vs-replaysubject-vs-asyncsubject`, `angular-forroot-forchild`, `angular-prevent-memory-leaks-unsubscribe-patterns`, `angular-zonejs-change-detection`, `angular-controlvalueaccessor-vs-custom-two-way-binding`, `rxjs-sharereplay-angular-how-it-breaks-your-app`, `angular-ngoninit-vs-constructor`, `angular-appmodule-standalone-changes`, `ngrx-store-vs-component-state-angular-when-to-use`, `ngrx-data-flow-end-to-end-angular`, `angular-onpush-change-detection-debugging-real-bug`, `angular-data-binding`, `angular-services`, `angular-ngif-dom-lifecycle`, `angular-custom-two-way-binding`, `angular-hierarchical-dependency-injection-real-bug`, `angular-component-metadata`, `angular-dependency-injection`, `angular-lifecycle-hooks`, `angular-template-compilation-and-binding`, `angular-directives`, `angular-structural-vs-attribute-directives`, `angular-change-detection-strategies`, `angular-routing`, `angular-lazy-loading`, `ngrx-reducer-pure-function-immutability-side-effects`, `ngrx-selectors-memoization-derived-state-performance`, `angular-performance-optimization`, `angular-event-binding-dom-vs-output-change-detection`, `angular-interpolation-vs-property-binding`, `angular-pipes`, `angular-ngmodules-vs-standalone`, `angular-vs-angularjs`, `angular-component-vs-service-responsibilities`, `angular-ngfor-trackby`, `angular-input-output`, `angular-ngonchanges-vs-ngdocheck`
- **vue** (34): `vue-native-vs-component-events`, `vue-nexttick-dom-update-queue`, `vue-computed-properties`, `vue-provide-inject-vs-prop-drilling-tradeoffs`, `vue-reactivity-vs-react-concepts`, `vue-v-for-keys-why-not-index`, `vue-methods-in-templates`, `vue-composition-api-vs-mixins`, `vue-router-navigation`, `vue-v-bind-v-on-fundamental-template-syntax`, `vue-reactivity-system`, `vue-internal-rendering-pipeline`, `vue-v-if-component-creation-destruction`, `vue-virtual-dom-diffing`, `vue-data-must-be-function`, `vue-v-for-keys`, `vue-ref-vs-reactive-difference-traps`, `vue-v-bind-reactive-attributes`, `vuex-state-management`, `vue-architecture-decisions-scalability`, `vue-slots-default-named-scoped-slot-props`, `vue-lifecycle-hooks`, `vue-child-mutates-prop-directly`, `vue-composition-api`, `vue-directives`, `vue-conditional-list-rendering`, `vue-watch-vs-watcheffect-differences-infinite-loops`, `vue-destructuring-breaks-reactivity-torefs-toref`, `vue-sfc-vs-global-components`, `vue-reactive-interpolation-into-dom`, `vue-v-model-syntax-sugar-expansion`, `vue-v-show-vs-v-if-dom-lifecycle`, `vue-computed-vs-watchers`, `vue-why-declare-emits-type-safety-maintenance`
- **javascript** (23): `js-async-race-conditions`, `js-compare-two-objects`, `js-escape-vs-sanitize`, `js-array-sort-pitfalls`, `content-delivery-caching-strategies-streaming`, `chat-conversation-state-management`, `ai-streaming-data-handling`, `js-cookie-options`, `js-map-parseint-callback-arity-output`, `js-static-vs-dynamic-typing`, `js-current-trends`, `js-bigint-data-type`, `js-passing-by-value-and-by-reference`, `ai-ux-integration-challenges`, `js-argument-passing-object-mutation-output`, `js-memory-leaks-common-sources`, `js-queue-vs-stack`, `js-why-eval-function-considered-dangerous`, `js-null-coalescing-operator`, `js-nan-property`, `js-big-o-notation`, `js-memoization`, `prompt-engineering-frontend`
- **react** (8): `react-stale-state-closures`, `react-usestate-purpose`, `react-render-nothing-return-value`, `react-18-whats-new`, `react-hooks-youve-used`, `react-function-treated-as-component-rules`, `react-conditional-rendering`, `react-functional-vs-class-components`
- **css** (14): `css-position-sticky-not-working`, `css-inline-internal-external`, `css-color-property`, `css-id-vs-class`, `css-font-family`, `css-units-em-rem-percent-px`, `css-text-color`, `css-definition`, `css-custom-properties`, `css-change-text-size`, `css-background-color`, `css-border-property`, `css-center-text`, `css-make-text-bold`
- **html** (19): `html-href-attribute`, `html-img-alt-attribute`, `html-clickable-image`, `html-anchor-target`, `html-a-tag`, `html-form-default-method`, `html-title-tag`, `html-div-vs-span`, `html-meta-tag`, `html-semantic-elements`, `html-aria-roles`, `html-head-tag`, `html-vs-xhtml`, `html-ol-ul-dl-difference`, `html-id-vs-class`, `html-input-placeholder`, `html-shadow-dom`, `html-tags`, `html-br-tag`
