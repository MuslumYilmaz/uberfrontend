# Why Google is not sending organic traffic — 2026-10-11

> Historical audit. Do not load by default; route into context only for organic-traffic, Search Console, index-coverage or site-quality investigations. This is a diagnosis written from Google's point of view. It is inference from Search Console exports, the prerendered HTML in `frontend/dist`, live HTTP checks and competitor SERPs, not a statement about how Google's ranking systems actually work.

## Short answer

The site has no technical block. Canonicals, robots, breadcrumbs, schema, HTTPS, manual actions and security are all clean, so there is no "fix the tag and traffic returns" lever left. What the data shows is a quality and trust judgment: Google tried the site for a few months, saw almost no clicks, and has been shrinking it since July 2026.

| Signal | Value |
|---|---|
| 28-day impressions, July → September → October windows | 37.8K → 19.3K → 13.8K |
| 3 months (2026-07-09 to 2026-10-08) | 290 clicks, 80.4K impressions, CTR 0.4%, average position 17 |
| Last 28 days (2026-09-08 to 2026-10-05) | 89 clicks, 14.4K impressions, CTR 0.6%, average position 14.9 |
| Indexed of 437 sitemap URLs | 321. 96 "crawled, currently not indexed", 49 "discovered, currently not indexed" (never crawled) |
| External links | about 74 to 104 links from about 10 domains (reddit 14, github 12, goodaitools 9, dev.to 4, medium 4, directories) |
| Brand queries in the top-100 query export | none |
| Core Web Vitals field data | none on either device (too little traffic for CrUX) |

Raw exports are gitignored under `frontend/tmp/gsc-monitor/2026-09-19/` and `2026-10-08/`; the roadmap in `docs/references/seo-growth-roadmap-2026-10.md` holds the shipped fixes. This file records the reasons, not the plan.

## Findings, in Google's voice

### 1. The web already has these pages

About 60 of the 261 trivia pages are definition-level topics: "what is CSS", the `<br>` tag, `background-color`, "what does href mean", `margin` vs `padding`, `id` vs `class`. MDN, W3Schools and react.dev already own those queries. The 49 URLs that were discovered and never crawled are exactly this kind of page (css-definition, css-background-color, css-link-html, html-br-tag, js-sum-numbers, angular-routing, vue-directives). The href page earned 2,413 impressions at position 17.5 with zero clicks. A 15-month-old interview SaaS has no reason to outrank MDN on a definition.

The content itself is not thin. Measured in the prerender: median 570 answer words per trivia entry (p25 432, p75 721, minimum 177) and a median of about 800 unique words per page after removing shared template sentences. Word count is not the problem. "Nobody needs the Nth copy of this" is.

### 2. Pages were crawled and deliberately dropped

Former top earners were deindexed in early September 2026 with no deploy in between: react-render-nothing-return-value (about 1,000 impressions per 28 days lost), react-stale-state-closures, css-position-relative-absolute-fixed, vue-destructuring-breaks-reactivity-torefs-toref, ngrx-selectors-memoization-derived-state-performance. Their HTML is sound (index,follow, canonical, 30 to 45 inlinks). "Crawled, currently not indexed" is Google saying "I looked and decided not to keep it". The timing overlaps the August 2026 and September 2026 spam updates; there was no core update in that window (the last one started 2026-05-21).

### 3. Authority is close to zero

For "angular interview questions" the SERP is Simplilearn, roadmap.sh, Indeed, hackr.io, PWSkills, InterviewBit. The site's hubs rank far behind despite their size:

| Hub | Main-content words | Internal links | Query | Position |
|---|---|---|---|---|
| /react/interview-questions | 6,865 | 136 | react interview questions | 58.8 |
| /css/interview-questions | — | — | css interview questions | 53.2 |
| /vue/interview-questions | — | — | vue js interview questions | 30.5 |
| /angular/interview-questions | 6,884 | — | rxjs interview questions | 23.1 |

The link profile is reddit, github, goodaitools, dev.to, medium, f6s, tooldirs and similar directories. Top anchor texts are "https frontendatlas com", "visit" and "frontendatlas". There is no editorial link from a frontend publication, framework docs, newsletter or well-known engineer. Long hub pages do not close a domain-authority gap.

### 4. Nobody searches for the brand

No "frontendatlas" query appears in the top-100 query export; the closest branded term, "frontend insights", sits at position 50. Google's reputation signals (navigational demand, mentions, co-citation) are near zero. Three months of search produced 290 clicks in total, which is not enough user behaviour to build trust from.

### 5. Nobody is accountable for the content

Every page's JSON-LD author is `{"@type":"Organization","name":"FrontendAtlas Editorial"}`. There is no Person schema anywhere in the app, no named author byline, no `/about` route, and the editorial policy page is 358 words. For a site whose pitch is "interview-grade answers", anonymous authorship loses against roadmap.sh and GreatFrontEnd, where named ex-FAANG engineers sign the content.

### 6. Pages look templated at scale

Every trivia page carries the same scaffolding around the answer: an "Interview focus" paragraph generated from the title ("This Angular interview question tests whether you can explain <title>, connect it to production trade-offs..."), an "Interview answer drill" block, the sentence "Use this as one explanation rep, then continue with the <tech> interview questions cluster or a guided prep path", and a CTA cluster ("Open Essential 60 / Open Machine Coding Hub / Open Question Library / Open system design") repeated on all 261 pages. Median main text is 836 words of which about 570 are the answer, so roughly 30% of every page is template. The aside carries another 500+ words of related links.

Bulk-generation signatures are visible too: 52 trivia entries share `updatedAt` 2026-01-30, 40 share 2026-04-04, 30 share 2026-04-10. Google's scaled-content and site-reputation classifiers look for exactly this shape: a SaaS funnel wrapped around auto-templated Q&A pages.

### 7. When pages do show, nobody clicks

CTR is 0.4% to 0.6% at an average position of 15 to 17; the expected rate at that position is 1% to 2%. Pages with impressions and zero clicks in the 28-day export:

| Page | Impressions | Position | Clicks |
|---|---|---|---|
| /react/trivia/react-jsx-transform-and-why-not-required | 377 | 9.4 | 0 |
| /html/trivia/html-img-alt-attribute | 248 | 28.3 | 0 |
| /javascript/coding/js-is-object-empty | 224 | 62.3 | 0 |
| /angular/trivia/angular-lifecycle-constructor-oninit-afterviewinit-dom | 223 | 8.9 | 0 |
| /css/interview-questions | 192 | 13.9 | 0 |
| /angular/trivia/angular-observables-rxjs | 147 | 15.8 | 0 |
| /react/trivia/react-strictmode-double-invoke-effects | 146 | 7.5 | 0 |
| /angular/trivia/rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use | 503 | 7.9 | 1 |
| /angular/trivia/angular-http-what-actually-cancels-request | 1,127 | 7.1 | 2 |

Two causes. Titles are question-shaped and do not promise the answer ("Do you still need NgModules with standalone Angular components?"), so a searcher with a different phrasing skips them. A large share of impressions on the position 5 to 10 pages comes from LLM-agent style queries ("+site.angular.dev guide http making requests unsubscribing abort in progress request", "... official docs") that never click. Google reads low CTR relative to position as "users do not want this result" and demotes accordingly. The href page is also matched to "ahrefs html" (578 impressions), an intent it can never satisfy.

### 8. The one differentiator is invisible to Googlebot

The real-IDE workflow is the only thing competitors do not have, and Google cannot see it:

- Googlebot smartphone renders at phone width, so `showMobileDesktopGuard()` hides the whole workspace column (no Monaco, no Run tests, no editor assist).
- On a coding page 1,534 of the 1,546 main-content words sit inside an `<aside>` element, the description pane wrapper at `frontend/src/app/features/coding/coding-detail/coding-detail.component.html:9`. `<aside>` marks content as tangential; the `<main>` landmark itself holds about 12 words.
- The solution panel is in the DOM but `hidden`; 121 premium coding pages are noindex and outside the sitemap; only 75 coding/debug URLs are indexable.
- Indexed copies of js-debounce, js-sleep and react-todo-list date from 4 to 6 September 2026, before the solution prerender (f9d4d4ac, 2026-10-05) and the "common mistakes" section (cb3c37da), because sitemap lastmod gave no recrawl signal.

### 9. Several pages split the same intent

Four pages target the anchor element: html-a-tag, html-href-attribute, html-anchor-target, html-clickable-image. The lifecycle page ranks about 35 for "ngoninit vs constructor" while the dedicated page gets one impression. css-position-sticky-not-working and css-position-relative-absolute-fixed overlap, as do the three RxJS Subject pages. When Google cannot pick a winner it shows none of them strongly.

### 10. The site behaves like an app, not a document

- 225 KB to 257 KB of HTML per page; eager JS on the home page is main 231 KB + polyfills 36 KB + 57 KB CSS with 10 modulepreloads; total built JS 6.8 MB.
- Crawl stats (90 days): 18.1K requests, 68% JavaScript, 21% HTML; page-resource bot 51%; 163 404s per cycle on old hashed chunk files after deploys; 42 401s from api.frontendatlas.com/api/auth/me during render.
- The home page is a SaaS landing: H1 "Practice frontend interviews in a real coding workflow", 76 internal links, CTAs "Create a free account" and "Compare Premium plans". 177 prerendered pages are noindex. Every informational page funnels into Essential 60, tracks and pricing.
- Sitemap lastmod was inflated until e4ec7101 (351 of 437 URLs re-dated to 2026-10-07 by shared-template projection). Google learned the dates were unreliable, so changed pages are recrawled slowly.
- Minor: on the sample trivia page the visible "Updated Apr 12, 2026" disagrees with JSON-LD `dateModified` 2026-04-19; www → apex is a 2-hop chain ending in a 307.

### 11. Every crawler except Googlebot gets 429 — resolved 2026-10-12

Until 2026-10-11 Vercel Attack Challenge Mode was on (`x-vercel-mitigated: challenge`). Live checks that day: a desktop Chrome UA from curl, GPTBot, ClaudeBot and an unverified bingbot UA all received HTTP 429. Googlebot got 200 (98% of crawl requests), so Google was not harmed, but ChatGPT and Perplexity citations, link previews, SEO tools and any unverified crawler were shut out.

Challenge mode was switched off on 2026-10-12. Re-check the same day: Chrome UA, GPTBot, ClaudeBot, bingbot, PerplexityBot and plain curl all receive HTTP 200 on `/` and `/angular/interview-questions`, and the `x-vercel-mitigated` header is gone. Residual: AI-crawler access is now governed only by `frontend/src/robots.txt`, so any future crawler rules belong there; watch the Vercel firewall for a return of bot-driven load that prompted the mode in the first place.

## What is not the problem

- Technical SEO: canonicals, robots meta, breadcrumbs (148 valid), schema, HTTPS, manual actions, security issues — all clean in Search Console.
- Content length: trivia answers are 400 to 700 words of real explanation; the pages are not thin by word count.
- Metadata: template descriptions were eliminated (b96530e6) and long titles shortened (12b9f739); these changes produced little movement, which is consistent with a site-level judgment rather than page-level tags.
- GA4 numbers: about half of GA users were bot-like before d5f6c9c9; GA engagement figures from before 2026-10-10 are not evidence either way.

## What would change Google's mind

- Merge or upgrade the roughly 60 definition-level pages. Either consolidate them into the hubs or give each something MDN cannot (the sticky, RxJS overlap and change-detection labs are the right shape, but exist on three pages).
- Put a named person behind the content: author bylines, a real biography, an `/about` page and Person schema on articles.
- Earn editorial links and mentions from 10 to 20 sites the frontend community recognises (newsletters, framework docs community pages, known engineers' blogs). Directory listings do not count.
- Render the coding pages' solution idea and what the editor does statically, outside `<aside>`, visible at phone width.
- Shrink the template scaffolding and the CTA cluster that repeats on all 261 trivia pages; make each page read as an article first and a funnel second.
- Resolve the cannibalising page groups so one URL owns each intent.
- Done 2026-10-12: challenge mode is off, so AI crawlers, Bing and link previewers can reach the site again and it can earn citations outside Google.
- Keep the current discipline on lastmod and request indexing after content changes to the top pages (daily quota about 10).

## Evidence and method

- Search Console exports: `frontend/tmp/gsc-monitor/2026-09-19/` (queries 14d top-100, pages 28d, links, index) and `frontend/tmp/gsc-monitor/2026-10-08/` (pages 28d, crawled-not-indexed, discovered-not-indexed); GSC re-read in Chrome on 2026-10-11 for crawl stats, links and index counts.
- Prerender analysis over `frontend/dist/frontendatlas/browser` (615 HTML files, 437 sitemap URLs, 177 noindex): main-content word counts with `<script>`, `<style>` and `<aside>` stripped; shared-sentence boilerplate detection across all 261 trivia pages; landmark breakdown of a coding page; JSON-LD type counts; eager asset sizes from `index.html`.
- Catalog analysis over `cdn/questions/*/trivia.json`: answer-block word counts, difficulty mix (206 intermediate, 47 easy, 8 hard), `basics` tag count (106), `updatedAt` clustering, definition-style id/title pattern match (60 entries).
- Live HTTP checks with curl on 2026-10-11 against https://frontendatlas.com for browser, GPTBot, ClaudeBot, bingbot user agents and the www host; repeated on 2026-10-12 after challenge mode was switched off (all 200, PerplexityBot and plain curl added).
- Competitor SERPs via web search on 2026-10-11 for "angular interview questions and answers", "switchmap vs mergemap vs concatmap vs exhaustmap", "react component return null render nothing", "what does href mean in html", and "frontendatlas".

Related: `docs/audits/seo-audit.md` (2026-02 technical audit), `docs/audits/gsc-metadata-audit-2026-10-07.md`, `docs/audits/organic-landing-engagement-2026-10-10.md`, `docs/references/seo-growth-roadmap-2026-10.md`.
