# Trivia query-gap wave baseline

- Recorded: 2026-10-09
- GSC data through: 2026-10-06
- Reporting window: 2026-07-07 through 2026-10-06 (90 days, page filter, Web search, worldwide, all devices)
- Companion change: per-entry sitemap dating (`fix(seo): date question pages by their own content only`), deployed in the same release
- Comparison unit: exact page with visible query rows

## Pre-change evidence

| Route | Visible queries | Impressions | Clicks | Position range |
|---|---|---:|---:|---|
| `/html/trivia/html-href-attribute` | href definition 221 @12.5, define href 166 @13.8, href example 178 @24.5, what does href mean 54 @15.4, what is href 39 @15.7, what does href stand for 39 @25.5 + 33 @26.2, href meaning 36 @16.1, which attribute specifies the destination of a hyperlink 16 @10.4 | ~1,000 human | 0 | 10 to 26 |
| `/angular/trivia/rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use` | exhaustmap vs switchmap 121 @7.1, switchmap vs exhaustmap 63 @7.0, four-operator comparison 99 @8.0, switchmap vs mergemap 36 @10.9, switchmap vs concatmap 29 @8.2, concatmap vs switchmap 21 @8.2, rxjs variants 15 to 18 @6.7 to 8.5 | ~450 | 1 | 7 to 11 |
| `/angular/trivia/angular-lifecycle-constructor-oninit-afterviewinit-dom` | ngoninit vs ngafterviewinit 77 @7.1, ngafterviewinit vs ngoninit 31 @7.7, angular oninit vs afterviewinit 19 @9.5, ngoninit vs constructor 11 @34.9, angular constructor vs ngoninit 7 @30.7, constructor vs ngoninit 4 @40 | ~150 | 0 | 7 to 40 |
| `/html/trivia/html-img-alt-attribute` | alt attribute 17 @9.2, alt-attribute 7 @10.1, alt attribute in html 20 @20, html img alt 21 @31.2, alt attribute html 12 @23.3, alt tag 6 @18.5, ~30 long-tail variants at 30 to 60 | ~250 | 0 | 9 to 60 |
| `/react/trivia/react-jsx-transform-and-why-not-required` | jsxs 52 @13.1, react/jsx-runtime 2 @23.5 | ~60 | 0 | 13 to 24 |
| `/html/trivia/html-anchor-target` | what is the role of the target attribute inside anchor elements 18 @8.3, which of the following target attributes opens a link in the parent of the current context 16 @7.1 | ~35 | 0 | 7 to 8 |
| `/react/trivia/react-why-props-immutable` | props are immutable 11 @9.1, props are mutable or immutable 3 @9.0 | ~15 | 0 | 9 |

Positions are GSC averages over countries and devices and are directional only. Search Console omits anonymized low-volume queries.

## Live metadata before the change

| Route | Observed before | Cause |
|---|---|---|
| `/html/trivia/html-anchor-target` | Title "HTML the purpose of the target attribute in an <a> tag" and a template description | Authored `seo.title` and `seo.description` failed the retargeted-intent gate |
| `/html/trivia/html-img-alt-attribute` | Template description "Practice the purpose of the alt attribute in the <img> tag with a quick interview answer …" | Authored `seo.description` failed the gate |
| `/react/trivia/react-jsx-transform-and-why-not-required` | Template description "Understand JSX get transformed, and why doesn't React require it: quick answer …" | Authored `seo.description` failed the gate; template grammar defect |

## Treatment

| Route | Change |
|---|---|
| href | Definition-first quick answer and "What does href stand for?" section (hypertext reference), "href examples" code block, element table examples rendered as code instead of live links |
| RxJS operators | "RxJS" named in the core idea; pairwise sections switchMap vs exhaustMap, switchMap vs mergeMap, switchMap vs concatMap with verdict, pick and timeline; one shared-timeline comparison table |
| Angular lifecycle | "ngOnInit vs ngAfterViewInit" section with first-render order and the default ViewChild pitfall; inline link "constructor vs ngOnInit" to `/angular/trivia/angular-ngoninit-vs-constructor` |
| img alt | Answer-first `seo.description` and shorter title; definition-first opening; "alt attribute examples" code block |
| anchor target | Answer-first `seo.title` and `seo.description`; quick-answer section covering `_self`, `_blank`, `_parent`, `_top` and frame names with a link to the href page; repaired security tip example |
| JSX transform | Direct-answer `description`; answer-first `seo.description`; "What are jsx and jsxs?" section |
| props immutability | Direct-answer `description` |
| a tag | Inline link "href attribute" to the href page |

Frozen: `seo.title` and `seo.description` of the href, lifecycle and RxJS pages (changed on 2026-10-07; measured separately). The RxJS H1 is unchanged. The HttpClient cancellation page keeps exactly one link to the RxJS page.

## Ownership watch

- `constructor vs ngoninit` family: the lifecycle page should stop appearing (position 30 to 40) and `/angular/trivia/angular-ngoninit-vs-constructor` should take the impressions.
- `css interview questions` family is outside this wave.

## Evaluation schedule

| Checkpoint | Decision |
|---|---|
| T0 | Record the deployment, request indexing for the 8 URLs in URL Inspection, confirm the live `<title>` and `<meta name="description">` on the three repaired pages, confirm the sitemap `lastmod` distribution is spread across content dates. |
| T+14 | Recrawl, index status and query-to-URL ownership only. No performance decision. |
| Recrawl +35 days | Compare position and CTR per query family. Targets: RxJS pairwise queries into the top 5, href definition and meaning queries into the top 10, alt attribute family into the top 10, "jsxs" into the top 10. Report inconclusive if the query rows are too thin. |

Do not make another title, H1, description or primary internal-link change on these routes before the recrawl-plus-35-day decision unless a factual, canonical, indexing or accessibility defect is found.
