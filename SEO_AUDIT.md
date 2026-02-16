# SEO Audit Report: `frontend` (FrontendAtlas)

Date: 2026-02-16

Scope:
- Repository audit for `/Users/muslumyilmaz/Desktop/uberfrontend/frontend`
- Local build/test/crawl/Lighthouse runs
- Live verification against `https://frontendatlas.com`

## Stack & SEO-Relevant Architecture

- Framework: Angular 17 app (`@angular/* 17.3.12`) with Angular application builder and server entry support (`frontend/package.json:41-49`, `frontend/angular.json:18-23`)
- Rendering strategy in code: prerendered static routes + browser hydration (`frontend/angular.json:66-69`, `frontend/angular.json:200-203`)
- Route/meta strategy: route-level SEO data + runtime SEO service updates (`frontend/src/app/app.routes.ts:30-934`, `frontend/src/app/core/services/seo.service.ts:45-83`)
- Sitemap/prerender generation: scripted from content sources (`frontend/scripts/generate-sitemap.mjs:64-132`, `frontend/scripts/generate-prerender-routes.mjs:71-149`)
- Deployment signal: static output with SPA fallback expectation on Vercel (`frontend/README.md:115-121`)
- Canonical host enforcement: client-side redirect in production JS (`frontend/src/main.ts:8-20`)

## Executive Summary (Top 10)

1. **P0**: Non-prerender and unknown URLs on production return `200` with **home metadata** (`index,follow`, canonical `/`) causing soft-404 and wrong indexing signals.
2. **P0**: Guide detail pages have missing `<h1>` in prerender output (36 pages), reducing content quality for non-JS crawlers.
3. **P0**: System-design detail pages ship with empty `<h1>`, generic title/description across 20 URLs, and missing detail JSON-LD in initial HTML.
4. **P0**: Auth/404/preview routes are not in prerender route list, but are linked/accessible; this creates local hard 404s and production home-fallback metadata.
5. **P1**: Query-param URLs are indexable in raw HTML on major list routes (`/coding?q=...`, `/tracks?...`, `/companies?...`).
6. **P1**: Robots policy conflicts with route metadata intent for tracks/companies preview paths.
7. **P1**: Production sitemap is behind repo-generated sitemap (490 live vs 497 local), missing 7 URLs.
8. **P1**: Initial bundle budget exceeded (1.36 MB initial vs 900 KB warning budget), with weak LCP/interactive scores on key pages.
9. **P1**: Security and caching headers are minimal; no CSP/X-Frame-Options/X-Content-Type-Options and no immutable asset caching.
10. **P2**: Observability is partial: SEO scripts exist, but no explicit live 404/canonical drift alerting and no visible Search Console verification tag in HTML.

## Implemented (2026-02-16)

P0 implementation updates completed in repo:

1. Soft-404 production fix (hosting policy)
   - Added `frontend/vercel.json` with `handle: filesystem` first, targeted rewrites only for private CSR paths, and explicit 404 fallback to `/404/index.html`.
   - Updated deployment note in `frontend/README.md` to remove global SPA fallback guidance.

2. Prerender coverage expansion
   - Extended `frontend/scripts/generate-prerender-routes.mjs` to include:
     - `/404`, `/auth/login`, `/auth/signup`, `/auth/callback`
     - track preview routes from `track-registry.json`
     - company preview routes derived from content + seeded slugs.
   - Current generation output: `Prerender routes generated ... (513)`.

3. System-design detail prerender completeness
   - Added `systemDesignDetailResolver` in `frontend/src/app/core/resolvers/question-detail.resolver.ts`.
   - Wired resolver to `/system-design/:id` in `frontend/src/app/app.routes.ts`.
   - Updated `frontend/src/app/features/system-design-list/system-design-detail/system-design-detail.component.ts` to consume resolved data before render and apply SEO/detail JSON-LD immediately.

4. Guide detail prerender H1 safety
   - Added SSR fallback H1 shell in:
     - `frontend/src/app/features/guides/playbook/playbook-host.component.ts`
     - `frontend/src/app/features/guides/system-design/system-design-host.component.ts`
     - `frontend/src/app/features/guides/behavioral/behavioral-host.component.ts`
   - Shell hides after article component mounts to avoid duplicate H1 after hydration.

5. Credible internal-link reporting
   - Reworked `frontend/scripts/seo-links.mjs` to produce deterministic internal-link checks from prerender HTML and routing policy.
   - Reports internal HTTP checks separately from non-links and external links; keeps `hard404` list.

6. Regression guardrails added
   - Added `frontend/scripts/seo-smoke.mjs` (curl-based checks for unknown 404 + canonical, system-design title/H1, guide H1).
   - Added `seo:smoke` script in `frontend/package.json`.
   - Updated CI workflow `.github/workflows/seo-guard.yml` to run build + `seo:meta-check` + `seo:links` + `seo:smoke`.

Validation snapshot after implementation:

```bash
$ npm run build
Prerender routes generated: .../src/prerender.routes.txt (513)
Prerendered 513 static routes.
```

```bash
$ npm run seo:meta-check
[seo:meta-check] pages scanned: 513
[seo:meta-check] missing h1: 0
```

```bash
$ npm run seo:links
[seo:links] scanned=6927 checked-internal=6912 non-links=10 external=5 hard-404=0
```

```bash
$ npm run seo:smoke
PASS unknown route returns 404
PASS /404 robots is noindex
PASS system-design detail title is non-generic
PASS system-design detail has non-empty h1
PASS guide detail has non-empty h1
```

## Scorecard (0-100)

| Category | Score | Rubric Note |
|---|---:|---|
| Crawlability & Indexability | 45 | High-impact route/status/canonical mismatches for non-prerender paths |
| Rendering / SSR / Prerender | 52 | Prerender is in place, but key detail templates render incomplete HTML |
| Metadata & Canonicalization | 62 | Tag coverage is broad, but correctness breaks on fallback routes and some detail types |
| Structured Data | 68 | Strong on coding/trivia/guides, weak for system-design detail in initial HTML |
| Internal Linking & IA | 60 | Core hubs link well; several reachable routes are not prerendered or directly discoverable |
| Performance (SEO-adjacent) | 61 | Build budget overrun + moderate LCP/interactive concerns |
| A11y & Semantics | 64 | Repeated missing/empty H1 and landmark/button naming issues from audits |
| Security Headers & Caching | 40 | Minimal baseline only |
| Observability | 58 | Good local scripts; incomplete production SEO telemetry/alerting |

---

## Evidence: Commands Run

- `npm run build`
- `npm run test`
- `PLAYWRIGHT_WEB_SERVER=1 npm run test:e2e -- e2e/seo.spec.ts`
- `npm run e2e:perf`
- `npm run seo:meta-check`
- `SEO_LIGHTHOUSE_ROUTES=... npm run seo:lighthouse`
- `npm run seo:links`
- `npm run seo:sitemap-sample`
- Live checks with `curl` for redirects, headers, robots/sitemaps, and route HTML snapshots

Key output snippets:

```bash
$ npm run build
Sitemap generated: .../src/sitemap.xml (497 URLs, 1 files)
Prerender routes generated: .../src/prerender.routes.txt (497)
[prerender-sitemap-diff] missing from prerender: 0
▲ [WARNING] bundle initial exceeded maximum budget. Budget 900.00 kB was not met by 492.88 kB with a total of 1.36 MB.
```

```bash
$ npm run seo:meta-check
[seo:meta-check] pages scanned: 497
[seo:meta-check] missing title: 0
[seo:meta-check] missing description: 0
[seo:meta-check] missing canonical: 0
[seo:meta-check] missing h1: 36
```

```bash
$ node (dist scan)
empty_h1_pages 20
sample /system-design/ai-chat-textarea-design, ... , /system-design/ui-component-state-from-mock
```

```bash
$ npm run e2e:perf
[perf] showcase longtasks: max=251.0ms total=1419.0ms tbt=669.0ms
```

```bash
$ npm run seo:links
[seo:links] scanned=2402 broken=2402 hard-failures=10
[seo:links] status 404: 10
sample: /auth/signup, /tracks/foundations-30d/preview, /tracks/crash-7d/preview, /companies/amazon/preview
```

```bash
$ curl -sI https://frontendatlas.com/
HTTP/2 200
server: Vercel
cache-control: public, max-age=0, must-revalidate
strict-transport-security: max-age=63072000
```

---

## Step 1: URL Inventory (Indexable Intent)

Dynamic URL generation sources:
- Tech question routes from `src/assets/questions/*/{coding,trivia,debug}.json` (`frontend/scripts/generate-prerender-routes.mjs:98-117`)
- System design IDs from `system-design/index.json` (`frontend/scripts/generate-prerender-routes.mjs:119-128`)
- Guide slugs from `guide.registry.ts` (`frontend/scripts/generate-prerender-routes.mjs:131-142`)

Local prerender inventory counts:

```bash
/ 1
/coding 1
/:tech/coding/:id 187
/:tech/trivia/:id 230
/:tech/debug/:id 4
/system-design/:id 20
/guides/interview-blueprint/:slug 13
/guides/framework-prep/:slug 4
/guides/system-design-blueprint/:slug 10
/guides/behavioral/:slug 9
total 497
```

### Route Inventory Table

| URL pattern | Index intent | Canonical rule | Title/Meta source | SSR/Prerender? | Notes/risks |
|---|---|---|---|---|---|
| `/` | index | self canonical | Route `data.seo` (`frontend/src/app/app.routes.ts:33-49`) | Yes | Healthy |
| `/coding` | index | forced `/coding` (`frontend/src/app/features/coding/coding-list/coding-list.component.ts:1105`) | Route + runtime list SEO | Yes | Query variants require hard noindex policy |
| `/:tech/coding/:id` | index | self canonical (`frontend/src/app/features/coding/coding-detail/coding-detail.component.ts:989`) | Runtime detail SEO + JSON-LD | Yes | Healthy in sampled pages |
| `/:tech/trivia/:id` | index | self canonical (`frontend/src/app/features/trivia/trivia-detail/trivia-detail.component.ts:542`) | Runtime detail SEO + JSON-LD | Yes | Healthy in sampled pages |
| `/:tech/debug/:id` | index | self canonical | Runtime detail SEO | Yes | Low volume |
| `/system-design` | index | self canonical | Route `data.seo` (`frontend/src/app/app.routes.ts:467-476`) | Yes | List page okay |
| `/system-design/:id` | index | self canonical | Route generic + runtime update (`frontend/src/app/features/system-design-list/system-design-detail/system-design-detail.component.ts:653-711`) | Yes | Initial HTML has generic meta, empty H1, missing detail schema |
| `/tracks` | index | self canonical | Route `data.seo` (`frontend/src/app/app.routes.ts:391-407`) | Yes | Query variants indexable |
| `/tracks/:slug/preview` | route says index | default canonical from URL | Route `data.seo` (`frontend/src/app/app.routes.ts:409-421`) + component override (`frontend/src/app/features/tracks/track-preview/track-preview.component.ts:48-52`) | **No** | Local hard 404 / prod home-fallback metadata |
| `/tracks/:slug` | noindex | default canonical from URL | Route `data.seo` (`frontend/src/app/app.routes.ts:424-437`) | No | Premium page direct loads depend on SPA fallback behavior |
| `/companies` | index | self canonical | Route `data.seo` (`frontend/src/app/app.routes.ts:196-223`) | Yes | Query variants indexable |
| `/companies/:slug/preview` | route says index | default canonical from URL | Route `data.seo` (`frontend/src/app/app.routes.ts:227-239`) + component override (`frontend/src/app/features/company/company-preview/company-preview.component.ts:56-60`) | **No** | Local hard 404 / prod home-fallback metadata |
| `/companies/:slug` (+ children) | noindex | default canonical from URL | Route `data.seo` (`frontend/src/app/app.routes.ts:242-329`) | No | Premium path behavior tied to fallback |
| `/guides/*` detail routes | index | self canonical via guide SEO util (`frontend/src/app/features/guides/guide-seo.util.ts:47-106`) | Runtime in host components | Yes | 36 guide detail pages missing H1 in initial HTML |
| `/auth/*` | noindex | default canonical from URL | Route `data.seo` (`frontend/src/app/app.routes.ts:102-142`) | **No** | Prod raw HTML returns home metadata (index) |
| `/profile`, `/dashboard`, `/admin/*` | noindex | default canonical from URL | Route `data.seo` (`frontend/src/app/app.routes.ts:52-61`, `frontend/src/app/app.routes.ts:76-92`, `frontend/src/app/app.routes.ts:693-704`) | No | Not prerendered |
| `/404` | noindex | self canonical expected | Route `data.seo` (`frontend/src/app/app.routes.ts:804-813`) | **No** | Live `/404` serves home metadata |

---

## Step 2: Crawlability & Indexability Findings

### F1 (P0): Soft-404 + home metadata for unknown and non-prerender routes

Evidence:

```bash
$ curl ... https://frontendatlas.com/non-existent-seo-check-abc123
status=200
<title>Frontend interview preparation roadmap | FrontendAtlas</title>
<meta name="robots" content="index,follow"
<link rel="canonical" href="https://frontendatlas.com/"
```

```bash
$ curl ... https://frontendatlas.com/auth/login
status=200
<title>Frontend interview preparation roadmap | FrontendAtlas</title>
<meta name="robots" content="index,follow"
<link rel="canonical" href="https://frontendatlas.com/"
```

```bash
$ curl ... https://frontendatlas.com/404
status=200
<title>Frontend interview preparation roadmap | FrontendAtlas</title>
<meta name="robots" content="index,follow"
<link rel="canonical" href="https://frontendatlas.com/"
```

Related code/config:
- SPA fallback deployment note (`frontend/README.md:120`)
- `/404` route exists but not in prerender list (`frontend/src/app/app.routes.ts:804-813`, and `/404` absent from `frontend/src/prerender.routes.txt`)

Why it matters:
- Crawlers can index invalid URLs as homepage duplicates.
- 404 diagnostics in Search Console become noisy and canonical consolidation degrades.

Recommendation:
- Prerender all user-facing non-index routes (auth, preview, `/404`) with correct robots/canonical.
- Configure host to return real `404` for unknown non-files.

---

### F2 (P0): Guide/system-design detail rendering incomplete in initial HTML

Evidence (local prerender output):

```bash
$ rg -n '<h1' .../guides/interview-blueprint/intro/index.html
NO_H1

$ node (scan)
missing_h1_pages 36
```

```bash
$ node (scan)
empty_h1_pages 20
sample /system-design/ai-chat-textarea-design, ...
```

```bash
$ curl ... https://frontendatlas.com/system-design/infinite-scroll-list
status=200
title=System design scenario | FrontendAtlas
h1=(empty/missing)
```

Related source:
- Guide hosts dynamically import and render article components asynchronously (`frontend/src/app/features/guides/playbook/playbook-host.component.ts:97-105`, `frontend/src/app/features/guides/system-design/system-design-host.component.ts:86-93`, `frontend/src/app/features/guides/behavioral/behavioral-host.component.ts:85-92`)
- System-design detail SEO is updated after async data load in component (`frontend/src/app/features/system-design-list/system-design-detail/system-design-detail.component.ts:326-330`, `frontend/src/app/features/system-design-list/system-design-detail/system-design-detail.component.ts:449-472`)

Why it matters:
- Non-JS crawlers receive thin/empty primary content and generic metadata.

Recommendation:
- Move guide/system-design detail data loading to resolvers or prerender-safe synchronous flow.
- Ensure meaningful `<h1>` and detail meta are present in first HTML response.

---

### F3 (P1): Query parameter variants remain indexable in raw HTML

Evidence:

```bash
$ curl ... https://frontendatlas.com/coding?q=react
status=200
<title>Frontend interview questions (coding) | FrontendAtlas</title>
<meta name="robots" content="index,follow"
<link rel="canonical" href="https://frontendatlas.com/coding"
```

```bash
$ curl ... https://frontendatlas.com/tracks?src=test
status=200
<meta name="robots" content="index,follow"
<link rel="canonical" href="https://frontendatlas.com/tracks"
```

Related source:
- Query noindex logic exists but is runtime (`frontend/src/app/core/services/seo.service.ts:202-207`, `frontend/src/app/features/coding/coding-list/coding-list-seo.util.ts:27-39`)
- Explicit `robots: 'index,follow'` for tracks/companies route data (`frontend/src/app/app.routes.ts:404`, `frontend/src/app/app.routes.ts:460`) overrides query noindex in `resolveRobots()` (`frontend/src/app/core/services/seo.service.ts:202-206`)

Why it matters:
- Duplicate URL surfaces for filtered/tracked list pages.

Recommendation:
- Add edge/header rule: if query string exists, return `X-Robots-Tag: noindex, follow`.
- Optionally normalize known tracking params with redirects.

---

### F4 (P1): Robots policy conflicts with route metadata intent

Evidence:
- Robots disallow tracks/companies descendants (`frontend/src/robots.txt:8-10`)
- Preview routes are marked `index,follow` in route SEO (`frontend/src/app/app.routes.ts:237`, `frontend/src/app/app.routes.ts:419`)

Why it matters:
- Mixed directives make indexing intent unclear and harder to debug.

Recommendation:
- Choose one policy:
- Option A: Keep preview pages indexable, remove blocking rules.
- Option B: Keep disallow and set preview route robots to `noindex,follow`.

---

### F5 (P1): Production sitemap is behind repo-generated sitemap

Evidence:

```bash
local_count 497 live_count 490
missing_on_live 7 /changelog, /guides, /guides/framework-prep/angular-prep-path, /guides/framework-prep/javascript-prep-path, /guides/framework-prep/react-prep-path, /guides/framework-prep/vue-prep-path, /legal/editorial-policy
```

Relevant generator logic includes these routes (`frontend/scripts/generate-sitemap.mjs:67-88`, `frontend/scripts/generate-sitemap.mjs:123-129`).

Why it matters:
- Missing URLs in live sitemap delay discovery/indexing of priority pages.

Recommendation:
- Enforce deploy-time gate: fail deploy if live sitemap diff from generated set exceeds 0.

---

### F6 (P2): Trailing slash duplicates are served as 200 variants

Evidence:

```bash
$ curl -I /guides/interview-blueprint/intro      -> HTTP/2 200, same ETag
$ curl -I /guides/interview-blueprint/intro/     -> HTTP/2 200, same ETag
```

Canonical is normalized without trailing slash (`frontend/src/app/core/services/seo.service.ts:185`).

Why it matters:
- Canonical handles consolidation, but redirect-level normalization is cleaner.

Recommendation:
- Add host-level redirect to canonical slash policy.

---

## Step 3: Metadata Quality (On-page)

### Meta Coverage Report (live HTML snapshots, 2026-02-16)

| URL | Title OK? | Description OK? | Canonical OK? | OG/Twitter OK? | H1 OK? | Issues |
|---|---|---|---|---|---|---|
| `/` | Yes | Yes | Yes | Yes | Yes | None |
| `/coding` | Yes | Yes | Yes | Yes | Yes | None |
| `/javascript/coding/js-abortable-helpers` | Yes | Yes | Yes | Yes | Yes | None |
| `/system-design/infinite-scroll-list` | **No** | **No** | Yes | Partial (generic) | **No** | Generic title/desc, empty H1 |
| `/guides/interview-blueprint/intro` | Yes | Yes | Yes | Yes | **No** | Missing H1 in initial HTML |
| `/guides/framework-prep/javascript-prep-path` | **No** | **No** | **No** | **No** | **No** | Home fallback metadata on prod |
| `/tracks` | Yes | Yes | Yes | Yes | Yes | Query variants still indexable |
| `/tracks/foundations-30d/preview` | **No** | **No** | **No** | **No** | **No** | Home fallback metadata |
| `/companies` | Yes | Yes | Yes | Yes | Yes | Query variants still indexable |
| `/auth/login` | **No** | **No** | **No** | **No** | **No** | Should be noindex but gets home index tags |
| `/404` | **No** | **No** | **No** | **No** | **No** | Should be noindex not-found, gets home index tags |

Additional metadata checks:
- Local prerender scan reports no missing title/description/canonical/OG/Twitter over 497 pages (`npm run seo:meta-check`)
- But quality issues remain (missing or empty H1 + generic duplicates):

```bash
duplicate_title_groups 8
20 | System design scenario | FrontendAtlas
```

---

## Step 4: JavaScript Rendering / SSR / Prerender Validation

Detected mode:
- **Hybrid static prerender + CSR hydration**, not full runtime SSR in current deployment.

Evidence:
- Prerender routes configured (`frontend/angular.json:66-69`)
- Deployment points to static browser output (`frontend/README.md:117-121`)

Crawler-view validation results:
- Good: many tech detail routes include full metadata/content in initial HTML.
- Bad: guide/system-design/auth/preview/404 have major gaps depending on route class and prerender coverage.

Important deployment caveat:
- Local Lighthouse route checks redirected to production due `enforceCanonicalOrigin()` in prod builds (`frontend/src/main.ts:8-20`), so those scores reflect live domain behavior.

### Minimal migration path

1. Keep prerender architecture, but add all directly linked non-index routes to prerender list (`/404`, `/auth/*`, `/tracks/:slug/preview`, `/companies/:slug/preview`).
2. Move system-design and guide detail data hydration into resolver-driven route activation so initial HTML includes final H1/meta/schema.
3. Add host-level unknown-route 404 status handling (do not serve homepage metadata on unknown paths).
4. If dynamic SEO grows further, move selected route groups to runtime SSR deployment.

Routes to prioritize first:
- `/`
- `/coding`
- `/system-design/:id`
- `/guides/*/:slug`
- `/tracks/:slug/preview`
- `/companies/:slug/preview`
- `/auth/login`, `/auth/signup`, `/404`

---

## Step 5: Structured Data (JSON-LD)

### Current coverage snapshot (local prerender, 497 pages)

```bash
pages_with_jsonld 497
Organization: 497
WebSite: 497
BreadcrumbList: 457
TechArticle: 457
HowTo: 187
FAQPage: 230
ItemList: 1
```

### Schema Coverage Table

| Route type | Current schema | Missing schema | Risk | Recommendation |
|---|---|---|---|---|
| Home/global | Organization, WebSite | None critical | Low | Keep |
| Coding list (`/coding`) | ItemList + global graph | None critical | Low | Keep |
| Coding detail | BreadcrumbList, TechArticle, HowTo | None critical | Low | Keep |
| Trivia detail | BreadcrumbList, TechArticle, FAQPage | None critical | Low | Keep |
| Guide detail | BreadcrumbList, TechArticle present | Content/H1 missing weakens trust | Medium | Fix prerender body completeness |
| System-design detail | Often only Organization + WebSite in initial HTML | Breadcrumb/Article/LearningResource/FAQ missing at crawl time | **High** | Resolve data before render; emit full detail graph in initial HTML |
| Tracks/Companies hubs | Mostly global graph | Optional ItemList/Breadcrumb | Low-Med | Add ItemList for richer SERP interpretation |

Validation plan:
- Local extraction: parse `script#seo-jsonld` from `dist/frontendatlas/browser/**/index.html`
- Live extraction: `curl -s <URL> | rg 'seo-jsonld'`
- External validator (manual): Schema Markup Validator / Rich Results Test on top landing + detail pages

---

## Step 6: Performance & Resource Loading Findings

### Evidence

```bash
$ npm run build
Initial total 1.36 MB
WARNING: initial budget 900 kB exceeded by 492.88 kB
```

```bash
$ npm run e2e:perf
max=251.0ms total=1419.0ms tbt=669.0ms
```

```bash
$ lighthouse (prod via redirect)
/            perf=66 a11y=84 seo=100
/coding      perf=60 a11y=86 seo=100 (rerun)
/js detail   perf=76 a11y=92 seo=100
/guide intro perf=79 a11y=93 seo=100
```

```bash
$ source-map-explorer main-*.js --tsv (top contributors)
@angular/animations browser.mjs 58779
header.component.ts 32799
app-sidebar.component.ts 17927
app.routes.ts 15529
premium-required-dialog.component.ts 8735
```

```bash
$ curl -I assets
cache-control: public, max-age=0, must-revalidate
```

### SEO impact
- Higher LCP/interactive times reduce crawl efficiency and can affect rankings/user signals.
- No immutable caching leaves repeat-visit performance on the table.

### Concrete fixes
- Split heavy landing/home sections and defer non-critical UI blocks.
- Tighten bundle budgets and enforce CI fail on regression.
- Serve hashed JS/CSS/fonts/images with long `immutable` cache-control.
- Keep HTML at `max-age=0, must-revalidate`.
- Preload critical hero font if used above the fold.

---

## Step 7: Internal Linking & Site Architecture

Findings:
- Link checker found hard failures to non-prerender but linked paths:

```bash
unique 404s:
/auth/signup
/tracks/foundations-30d/preview
/tracks/crash-7d/preview
/companies/amazon/preview
```

- Heuristic crawl over prerender output found 57 prerendered routes without direct `href` discovery from static HTML.

```bash
prerender_routes_without_direct_href 57
sample: /angular/coding/angular-dynamic-table-starter, ...
```

- Track cards intentionally link preview routes (`frontend/src/app/features/tracks/track-list/track-list.component.html:50`), but those preview routes are not prerendered.

Recommendation:
- Align internal links with directly crawlable/prerendered destinations.
- Add “related questions” and breadcrumb links on thin/long-tail pages to reduce orphan risk.

---

## Step 8: A11y / Semantic Overlap Findings

Lighthouse a11y failures seen in audited routes:
- `button-name`
- `landmark-one-main`
- `heading-order`
- `label`
- `list`
- `frame-title`

Evidence from route-level report extraction:

```bash
home: button-name, frame-title, heading-order, label, list
coding: aria-required-children, button-name, color-contrast
guide/detail: button-name, landmark-one-main
```

Code-level overlap:
- System design detail renders empty title in `<h1>` before async data (`frontend/src/app/features/system-design-list/system-design-detail/system-design-detail.component.html:8`, `frontend/src/app/features/system-design-list/system-design-detail/system-design-detail.component.ts:449-472`).
- Multiple route classes have missing/empty H1 in initial HTML (command evidence above).

Recommendation:
- Treat non-empty H1 and one-main-landmark as hard CI checks for all indexable routes.

---

## Prioritized Backlog

| Priority | Issue | Impact | Effort | Owner | Exact fix location | Acceptance criteria |
|---|---|---|---|---|---|---|
| P0 | Soft-404 home fallback for unknown/non-prerender routes | Critical indexing/canonical pollution | M | Frontend + Infra | `frontend/README.md:120`, hosting config (new `frontend/vercel.json`) | Unknown routes return 404; `/auth/login`, `/404`, preview routes return correct route-specific HTML/meta |
| P0 | Guide detail initial HTML missing H1/content | Critical for non-JS crawl quality | M | Frontend | `frontend/src/app/features/guides/*-host.component.ts` | All guide detail routes have non-empty H1 and body text > 500 chars in prerender HTML |
| P0 | System-design detail generic metadata + empty H1 + weak schema | Critical duplicate/thin pages | M | Frontend | `frontend/src/app/features/system-design-list/system-design-detail/system-design-detail.component.ts`, `frontend/src/app/app.routes.ts:492-503` | Each `/system-design/:id` prerender page has unique title, non-empty H1, and detail JSON-LD types |
| P0 | Missing prerender coverage for directly linked routes | Critical crawlability + UX consistency | M | Frontend | `frontend/scripts/generate-prerender-routes.mjs` | No internal hard 404s in `npm run seo:links`; direct loads render route-correct meta |
| P1 | Query-param pages indexable in raw HTML | Duplicate URL risk | M | Infra + Frontend | `frontend/src/app/core/services/seo.service.ts:202-207`, hosting headers | Query URLs emit `X-Robots-Tag: noindex, follow`; canonical points to clean URL |
| P1 | Robots policy conflicts (tracks/companies preview) | Indexing intent ambiguity | S | SEO + Frontend | `frontend/src/robots.txt`, `frontend/src/app/app.routes.ts:227-239`, `frontend/src/app/app.routes.ts:409-421` | Robots policy and route robots meta are aligned and documented |
| P1 | Bundle budget overrun | CWV/UX pressure | M | Frontend | `frontend/angular.json:80-90`, home/list components | Initial bundle < 900KB warning budget and Lighthouse LCP/INP trend improves |
| P1 | Asset caching/security headers weak | SEO-adjacent performance + trust | S | Infra | new `frontend/vercel.json` | Has CSP baseline, XCTO, XFO/Frame-Ancestors, Referrer-Policy; immutable cache for hashed assets |
| P1 | Live sitemap drift from repo output | Discovery/index lag | S | CI/Release | `frontend/scripts/generate-sitemap.mjs`, deploy pipeline | CI blocks deploy if generated sitemap differs from deployed sitemap set |
| P2 | Internal link depth/orphan gaps | Crawl depth inefficiency | M | Frontend + SEO | nav/hub templates + link rules | 0 business-critical orphan routes; route discovery report integrated in CI |
| P2 | A11y-semantic regressions | SEO quality overlap | S | Frontend | templates flagged by Lighthouse | 0 empty H1 pages, no landmark-one-main failures on key templates |
| P2 | SEO observability incomplete | Slower incident detection | S | SEO + Data | analytics/search-console setup | Alerts for soft-404 spikes, canonical-to-home anomalies, sitemap drift |

---

## Quick Wins / Roadmap

### Same-day (Quick Wins)
- Add `/404`, `/auth/login`, `/auth/signup`, preview routes to prerender route generation.
- Align robots intent for preview routes (`index` vs `noindex`) and remove conflicts.
- Add CI check for empty H1 and duplicate generic titles in prerender output.

### Medium (1-2 sprints)
- Resolver-first rendering for system-design and guide detail pages.
- Add hosting headers for query `X-Robots-Tag`, security hardening, and immutable assets.
- Enforce sitemap deploy parity checks.

### Long-term (quarter)
- Move SEO-critical dynamic routes to runtime SSR if prerender complexity continues to grow.
- Add full SEO quality gate in CI: status/meta/schema/content checks on sampled sitemap URLs.

---

## Ready-to-Implement Diffs (Top 5)

### Diff 1: Prerender all directly linked non-index routes

```diff
*** a/frontend/scripts/generate-prerender-routes.mjs
--- b/frontend/scripts/generate-prerender-routes.mjs
@@
-const OUT_PATH = path.join(SRC_DIR, 'prerender.routes.txt');
+const OUT_PATH = path.join(SRC_DIR, 'prerender.routes.txt');
+const TRACK_REGISTRY = path.join(QUESTIONS_DIR, 'track-registry.json');
@@
 function buildRoutes() {
   const routes = new Set();
 
   [
@@
+    '/404',
+    '/auth/login',
+    '/auth/signup',
+    '/auth/callback',
+    '/profile',
+    '/dashboard',
@@
   ].forEach((route) => addRoute(routes, route));
+
+  if (fs.existsSync(TRACK_REGISTRY)) {
+    const registry = readJson(TRACK_REGISTRY);
+    const tracks = Array.isArray(registry?.tracks) ? registry.tracks : [];
+    for (const track of tracks) {
+      if (!track?.slug) continue;
+      addRoute(routes, `/tracks/${track.slug}/preview`);
+      addRoute(routes, `/tracks/${track.slug}`);
+    }
+  }
```

### Diff 2: Make system-design detail SEO prerender-safe via resolver

```diff
*** a/frontend/src/app/app.routes.ts
--- b/frontend/src/app/app.routes.ts
@@
-import { globalCodingListResolver } from './core/resolvers/question-list.resolver';
+import { globalCodingListResolver, systemDesignDetailResolver } from './core/resolvers/question-list.resolver';
@@
       {
         path: ':id',
@@
+        resolve: {
+          questionDetail: systemDesignDetailResolver,
+        },
         data: {
           seo: {
             title: 'System design scenario',
```

```diff
*** a/frontend/src/app/features/system-design-list/system-design-detail/system-design-detail.component.ts
--- b/frontend/src/app/features/system-design-list/system-design-detail/system-design-detail.component.ts
@@
   ngOnInit(): void {
+    const preloaded = this.route.snapshot.data['questionDetail'] as SDQuestion | undefined;
+    if (preloaded) {
+      this.q.set(preloaded);
+      this.updateSeo(preloaded);
+    }
     this.qs.loadSystemDesign().subscribe((list) => {
```

### Diff 3: Ensure guide detail pages always emit SSR-visible H1/summary

```diff
*** a/frontend/src/app/features/guides/playbook/playbook-host.component.ts
--- b/frontend/src/app/features/guides/playbook/playbook-host.component.ts
@@
 @Component({
@@
-    <ng-container #vc></ng-container>
+    <article *ngIf="current" class="guide-ssr-shell">
+      <h1>{{ current.title }}</h1>
+      <p>{{ current.summary }}</p>
+    </article>
+    <ng-container #vc></ng-container>
     <app-offline-banner></app-offline-banner>
 `
 })
 export class PlaybookHostComponent implements OnDestroy {
+    current: { title: string; summary?: string } | null = null;
@@
-        this.seo.updateTags(
+        this.current = { title: current.title, summary: current.summary || '' };
+        this.seo.updateTags(
             buildGuideDetailSeo(this.seo, hostConfig.seoSectionTitle, hostConfig.guideBase, current)
         );
```

### Diff 4: Add frontend hosting config for security + cache + query noindex

```diff
*** /dev/null
--- b/frontend/vercel.json
@@
+{
+  "headers": [
+    {
+      "source": "/(.*)",
+      "headers": [
+        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
+        { "key": "X-Content-Type-Options", "value": "nosniff" },
+        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
+        { "key": "Content-Security-Policy", "value": "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.frontendatlas.com;" }
+      ]
+    },
+    {
+      "source": "/(.*)\\.(js|css|woff2|png|webp|jpg|svg)",
+      "headers": [
+        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
+      ]
+    }
+  ]
+}
```

### Diff 5: Align preview route indexing policy with robots rules

```diff
*** a/frontend/src/app/app.routes.ts
--- b/frontend/src/app/app.routes.ts
@@
       {
         path: ':slug/preview',
@@
-          seo: { title: 'Company Interview Preview', description: 'Preview ...', robots: 'index,follow' },
+          seo: { title: 'Company Interview Preview', description: 'Preview ...', robots: 'noindex,follow' },
         },
       },
@@
       {
         path: ':slug/preview',
@@
-          seo: { title: 'Interview Track Preview', description: 'Preview ...', robots: 'index,follow' },
+          seo: { title: 'Interview Track Preview', description: 'Preview ...', robots: 'noindex,follow' },
         },
       },
```

---

## Scripts (Current + Recommended Usage)

Already present in `frontend/package.json:34-37`:
- `npm run seo:sitemap-sample`
- `npm run seo:meta-check`
- `npm run seo:lighthouse`
- `npm run seo:links`

Recommended CI schedule:
- On every PR: `npm run build`, `npm run seo:meta-check`, `npm run seo:links`
- Nightly: `npm run seo:sitemap-sample` against production domain
- Weekly: Lighthouse route suite for top landing + top detail pages

---

## How to Monitor SEO Health Over Time

### Google Search Console

Track weekly:
- Coverage: soft 404, crawled currently not indexed, submitted URL not found (404)
- Pages report: canonical chosen by Google vs user canonical
- Sitemaps: submitted vs indexed URL delta
- Core Web Vitals: mobile/desktop trends by URL groups

### Log/Alerting

Set alerts for:
- 404 rate spikes by path prefix
- 200 responses where route should be 404/noindex
- Canonical anomalies (e.g., non-home pages canonicalizing to `/`)
- Sudden drops in rendered body text length on sampled sitemap URLs

### Analytics Events

- `AnalyticsService` currently emits only if `window.gtag` exists (`frontend/src/app/core/services/analytics.service.ts:8-15`)
- Home HTML currently shows no explicit analytics snippet (`curl` check: "no analytics snippet found in rendered home HTML")
- Add explicit monitoring events for:
- `seo_soft_404_detected`
- `canonical_mismatch_detected`
- `not_found_page_viewed`

### Reproducible prod checks

```bash
# Status + canonical/meta sanity for critical routes
for u in \
  https://frontendatlas.com/ \
  https://frontendatlas.com/coding \
  https://frontendatlas.com/auth/login \
  https://frontendatlas.com/404 \
  https://frontendatlas.com/non-existent-seo-check-abc123; do
  curl -s -o /tmp/p.html -w "\n$u status=%{http_code}\n" "$u"
  rg -o '<title>[^<]+</title>' /tmp/p.html -m1
  rg -o '<meta name="robots" content="[^"]+"' /tmp/p.html -m1
  rg -o '<link rel="canonical" href="[^"]+"' /tmp/p.html -m1
  echo
 done
```
