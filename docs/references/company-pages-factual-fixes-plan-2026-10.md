# Company pages: factual fixes plan, October 2026

> Proposed plan written on 2026-10-22. Every item below was found by re-reading the cited source live; the exact quotes and the per-page counts are in `docs/audits/company-pages-factcheck-2026-10-22.md`. Nothing is implemented yet; the user asked for the plan first. Template and thin-content work is a separate plan, `company-pages-template-thin-plan-2026-10.md`.

## Rules for every fix

- Re-read the exact source quote before changing a sentence. Two earlier passes judged wording "fair" that the quotes contradict (the Spotify carousel on 2026-10-20, the ElevenLabs four-question detail before that).
- Never put a Taro city in a public label, and treat a Taro date on the 1st of a month as a placeholder: write the year, or "(Taro, approximate date)". The rule is in `docs/references/company-interview-processes-2026-10.md`.
- A claim that rests on a paywalled or blocked page (Aced member view, Glassdoor, 1point3acres, an unreadable Medium post) is either labelled as a preview on the page or removed.
- Content modules avoid apostrophes and possessives; editorial notes also avoid always/never/guaranteed/every candidate and keep titles at 60 characters or fewer.
- A changed authored title is pinned in `frontend/scripts/seo-smoke.mjs`, `frontend/e2e/seo-ssr.spec.ts` and `frontend/src/llms.txt`; a changed process title also sits in `company-interview-processes.ts`.
- `cdn/questions/**` edits are backend-impacting: rerun the catalog pipeline (`update-question-id-manifest.mjs`, `gen:data`, `lint:questions:check`) and re-pin the backend interview registries with a maintenance note.
- Each per-company commit re-dates that page only; keep one company per commit so the SEO inventory stays readable.

Paths below are relative to `frontend/src/app/shared/company-previews/` unless stated.

## Wave 1: wrong on the page

### W1.1 Airbnb: "no public report read" (four places)

Files: `company-editorial-notes.ts` lines 950 (description), 955 (intro), 999 (FAQ) and the hero subtitle of the airbnb entry.

| Now | Replace with |
|---|---|
| description: "A small Airbnb frontend practice grouping with the official Airbnb careers FAQ. No public frontend interview reports have been read for this page yet." | "How two public Airbnb frontend accounts and the official careers FAQ describe the loop: a technical screen with passing tests, React and plain JavaScript UI coding, and architecture questions." |
| intro: "... FrontendAtlas has not yet read a public frontend interview report for Airbnb in full, so this page makes no claim about the rounds." | "... Two public frontend accounts (Taro, 2022 and 2024) and Blind threads describe a technical screen where the tests must pass, UI coding in React or plain HTML, CSS and JavaScript, one algorithm question and one architecture question. They are too few for a stage-by-stage table, so the rounds below are a summary, not a sequence." |
| hero: "Three coding and two concept items grouped under Airbnb, plus the official careers FAQ. This page grows when public frontend interview reports can be read in full." | "One coding component in three frameworks and two concept items grouped under Airbnb, plus the official careers FAQ and what two public frontend accounts describe." |
| FAQ "Why is this page short?": "No public frontend interview report for Airbnb has been read in full yet ..." | "Only two full first-person Airbnb frontend accounts and a few Blind comment threads are readable, so this page summarises them without a stage table. It grows as more accounts can be read in full." |

Sources: AB1 Taro Jun 2022 ("Build a simple React component. Explain the architecture for a mock chat app. Develop the UI for a simple card game."), Taro Dec 2024 ("React component and some vanilla JS questions."), AB2, AB3 in the processes doc. The full authoring of the page (process table, reportsDescribe) is Step 4 of the template plan; W1.1 alone removes the false statements.

### W1.2 Apple: "publishes no interview guide" (four places) and the autocomplete source

Files: `company-editorial-notes.ts` 863 (subtitle), 865 (intro), 932 (FAQ); `company-interview-processes.ts` 1069 (summary); `company-official-guides.ts` (no Apple row, file comment names Apple as a company without a page); `cdn/questions/vue/coding.json` line 1973 (and the react and angular autocomplete variants if they carry the same source).

| Now | Replace with |
|---|---|
| subtitle: "Apple publishes no interview guide, so this page rests on public interview reports ..." | "Apple publishes general interview tips but no process or frontend guide, so this page rests on public interview reports ..." |
| intro: "No official Apple preparation page exists; the careers site has no interview content." | "The Apple careers site has a general interview-tips page with advice before, during and after an interview and a note that some roles include a technical assessment or coding exercises; it lists no stages and no frontend content." |
| FAQ "Does Apple publish a preparation page?": "No. The careers site has no interview content ..." | "Only a general tips page, linked in the official pages table. The stages here come from public reports." |
| process summary: "Apple publishes no interview process page. ..." | "Apple publishes interview tips but no process page. ..." |

Add an Apple row to `company-official-guides.ts`: label "Interview tips", url `https://www.apple.com/careers/us/interview_tips.html`, covers "General advice before, during and after an interview, and a note that some roles include a presentation, case study, technical assessment or coding exercises; no stages or frontend content.", checked Oct 2026. Update the file comment.

Autocomplete source: the LeetCode post 6979238 (Apple IC3, June 2025) contains only a nested-tabs rendering task; the autocomplete search bar is in the Taro August 2022 account (AP5 in the processes doc: "Do an autocomplete search bar in TypeScript in Vue.js or React.js."). Replace the source on `vue-autocomplete-search` (and siblings) with AP5, label without the Taro city, and correct section 2 of `docs/references/company-sources-review-2026-10.md`, which recorded the preview-based attribution.

### W1.3 xAI: the company is SpaceXSI

Files: `xai-preview-content.ts` lines 4, 29, 30 (title, H1), 50 and 229 (the sentences that call the SpaceXSI title a stray), the FAQ "Is xAI still called xAI?"; `company-interview-processes.ts` (xai process title); the title pins in `seo-smoke.mjs`, `e2e/seo-ssr.spec.ts`, `llms.txt`.

Facts (Wikipedia summary on 2026-10-22: "SpaceXSI, legally SpaceXAI LLC, formerly xAI"; the careers page reads "Why SpaceXSI ... © 2026 SpaceXAI LLC"): merged into SpaceX in February 2026, rebranded SpaceXAI in July 2026 and SpaceXSI in October 2026 (announced 4 October, X account changed 10 October); the Greenhouse board still uses the `xai` slug.

| Now | Replace with |
|---|---|
| title "xAI (now SpaceXAI) Frontend Interview Questions: 4 Prompts + Guide" | "xAI (now SpaceXSI) Frontend Interview Questions: 4 Prompts + Guide" (66) or "xAI (now SpaceXSI) Frontend Interview Questions and Guide" (58) |
| H1 "xAI (now SpaceXAI) Frontend Interview Questions" | "xAI (now SpaceXSI) Frontend Interview Questions" |
| "on 21 October 2026 the careers page title read SpaceXSI ..." (lines 50, 229) | "By October 2026 the careers page was branded SpaceXSI after a second rename, with SpaceXAI LLC as the legal entity in its footer; the job board still lived at the xai slug." |
| FAQ answer | "No. xAI merged into SpaceX in February 2026, was rebranded SpaceXAI in July 2026 and SpaceXSI in October 2026. The legal entity is SpaceXAI LLC and the job board still uses the xai slug, which is why this guide keeps xAI in its name." |

Keep the label "xAI" and the slug. Add the SpaceXSI spelling to the description once.

### W1.4 JPMorgan Chase: the spelling sentence and the paywalled Aced details

Files: `jpmorgan-preview-content.ts` line 256 (FAQ "Which spelling") and the source-boundary, source-note and FAQ sentences that use the Aced account; `company-interview-processes.ts` 1809, 1843, 1850 and the summary.

| Now | Replace with |
|---|---|
| "The company's own careers pages use JPMorgan Chase, and this guide follows them." | "The careers pages write the firm as JPMorganChase, one word, while the legal names stay JPMorgan Chase & Co. and JPMorgan Chase Bank, N.A. This guide uses JPMorgan Chase, the spelling candidates search for; Blind badges read JPMorgan Chase." |
| "employees on Blind carry a JPMC badge" | "employees on Blind carry a JPMorgan Chase badge" |
| Aced account: "UK, around May 2026, with a recruiter screen and a live-coding interview on a generic async promise React hook", "'Tell me about yourself' in the project discussion" | Keep only the public summary: a senior (L5) candidate, rejected after a two-week loop, live coding that needed generic types and a useEffect cleanup without references. Drop the country, month, recruiter screen and the hook wording, or label them "from a member-only view". |
| 1809: "some candidates were contacted by email only and went straight to team interviews" | drop the clause (no cited account says it) |
| 1843: "Three 45-minute rounds in one day" | "Three rounds of 45 to 60 minutes in one day" |
| 1850: "a behavioural round with a Director or Executive Director" | "a behavioural round with a Director or a senior executive" |
| summary and row: "60 to 90 minutes of live coding" | "30 to 90 minutes of live coding: a 90-minute stage in one London briefing, 30- to 45-minute coding conversations elsewhere" |

### W1.5 Revolut: "publishes no interview process page"

File: `company-interview-processes.ts` line 1546; `company-official-guides.ts` (add a row).

Replace with: "The Revolut engineering careers page lists four steps, an intro call with an IT recruiter, tech interviews, team fit and offer, without formats or durations. The Bar Raiser stage appears in the careers video, not in that list." Add the row: label "Engineering careers page", url `https://www.revolut.com/careers/team/engineering/`, covers "Four hiring steps (intro call, tech interviews, team fit, offer) and the engineering stack; no formats or durations.", checked Oct 2026, with the note that the live page blocks tools and was read from an archived copy. Update the Bar Raiser source note: the video description is now readable ("Our Bar Raiser interview is where we get to know how you work and what drives you").

### W1.6 Amazon: the official page "names no exercises"

Files: `amazon-preview-content.ts` line 318 (source note); `company-official-guides.ts` (Leadership Principles row, hub URL).

| Now | Replace with |
|---|---|
| "It names no exercises." | "It names example design prompts, an Instagram widget, a type-ahead widget, infinite scrolling and a carousel widget, and links a sample coding question, but not the questions asked in interviews." |
| Leadership Principles row: "The principles behind the behavioural questions that open every interview in the loop." | "The principles behind the two or three behavioural questions each interviewer typically asks." |
| hub URL `amazon.jobs/en/landing_pages/interviewing-at-amazon` | `https://www.amazon.jobs/content/en/how-we-hire` (the old URL 301s there) |

### W1.7 Microsoft: round order

File: `company-editorial-notes.ts` line 297. "Syntax questions that precede the machine coding round." becomes "Syntax questions from the JavaScript concept round that follows machine coding." (machine coding is round 1 in all three cited Bangalore loops).

### W1.8 Uber: the calendar count

Files: `company-editorial-notes.ts` line 792; `company-interview-processes.ts` line 1159. "two of them designed a calendar" and "two accounts were asked to design a calendar" become "three of them designed a calendar: a collaborative calendar in 2022 and Google Calendar in two 2025 loops".

## Wave 2: unsupported by the cited sources

### W2.1 ElevenLabs: React and algorithm detail

File: `elevenlabs-preview-content.ts` lines 35 (hero), 133 (prompt 3 title), 221 (Day 4), 234 (FAQ), and the source list.

The cited Aced account (925c04) says only: "They send you a technical assessment to do that takes 90mins. Then a recruiter screen ... Then a technical round that includes live coding collaborating with the interviewer to fix a practical problem." React is supported by sources the page does not cite: Aced c79e72 ("a recruiter screen, a LeetCode-style Python round, a practical front-end debugging round in a small React app, and then a final decomposition interview"; "no system design at all"), Taro EL3 ("Fix React bug", "Finish React component"), EL4 ("some React knowledge check"), EL5 ("TypeScript and React"); URLs in the processes doc.

| Now | Replace with |
|---|---|
| hero "fixing a practical React problem live" | "fixing a practical problem live" |
| prompt 3 title "Fix a practical React problem live with the interviewer" | "Fix a practical problem live with the interviewer" (React stays as the practice framing in the body) |
| Day 4 "Timed drills: two React tasks and two medium algorithm problems in ninety minutes." | "Timed drills: a mix of frontend tasks and medium algorithm problems in ninety minutes." |
| FAQ "The public account mentions React tasks and the senior role was titled full-stack, frontend-leaning." | "The senior account does not name a stack. A second Aced account describes a practical front-end debugging round in a small React app, and three Taro full-stack accounts mention React tasks and React knowledge checks, so React is the safe default; prepare the same contracts in your own framework first." |

Add c79e72 and EL3 to EL5 to the source notes with their quotes; mark the Aced accounts as unverified and, for 925c04, in progress. Correct item 5 of the corrections list in `docs/references/company-interview-processes-2026-10.md`, which records the React wording as already removed.

### W2.2 Spotify: the image carousel was not a reported task

Files: `spotify-preview-content.ts` lines 41 (hero), 58 (source summary), 116 (prompt 2 title and its "modelled on a reported round" label), 268 (Day 3); `cdn/questions/react/coding.json` line 641 (react-image-slider source note, companies tag); `company-interview-processes.ts` (Spotify rows SP1 and SP2 citations).

The Blind comment reads: 'I was told that Web Interview for Spotify final round is "practical application of HTML, CSS, JS" e.g. build an image carousel. Would it be debugging code rather than crafting from the ground up?' The quoted part ends before "e.g."; the carousel is the same April 2022 candidate's own example (not "another candidate"), repeated as a question in the sibling thread.

| Now | Replace with |
|---|---|
| hero and summary "... such as an image carousel" | "... one candidate asked whether that would be debugging or building from scratch, giving an image carousel as an example; no account reports a carousel task" |
| prompt 2 "modelled on a reported round" | label it a practice build suggested by a candidate's example, not a reported round, or replace it with the reported "build a feature with JS/HTML/CSS" shape |
| Day 3 "an image carousel and a traffic light" | "a carousel as a practice build and a traffic light (reported in a 2025 Taro account)" |
| react-image-slider note "One web engineer thread describes the practical round as applying HTML, CSS and JavaScript to a feature such as an image carousel." | Remove the Spotify source and tag from the item (the company page lists sourced items only), or rewrite the note: "One web engineer thread quotes a recruiter describing the practical round as applying HTML, CSS and JavaScript; the candidate gave an image carousel as their own example. This slider is a practice version of that shape, not a reported task." |
| SP1 and SP2 rows citing "Blind, Apr 2022" k27u5vu7 | cite hNTex8N7 (the hired candidate's final round, Oct 2021 to Mar 2022) and 00wjs6rg for the algorithms round; k27u5vu7 describes only a 75-minute phone screen and belongs on the technical-screen row |

Also: "In October 2026 they include ... senior full-stack engineers in London, Stockholm and New York" loses "and New York"; "CoderPad for technical work and Mural for diagrams" becomes "CoderPad and Mural for the technical parts"; the "How we hire" source note points at `/start-your-journey`; three Glassdoor-only prompts (output order, traffic light, memoization and event delegation) can cite the Taro accounts that corroborate them.

### W2.3 Booking.com: the 2025 loop and the durations

Files: `company-editorial-notes.ts` lines 479, 495, 568 and the hero; `company-interview-processes.ts` (recruiter and fit rows).

| Now | Replace with |
|---|---|
| "2025 general software engineer accounts describe a different loop with a take-home and a pairing session." (hero "Newer general software loops add a take-home.", caveat, FAQ) | "One August 2025 software engineer account describes a take-home followed by a technical session, then system design and an engineering manager round; a May 2025 senior full-stack loop had an easy React exercise and system design." Cite the two Taro accounts (Amsterdam, Aug and May 2025, cities not in labels). Drop "pairing session". |
| "The frontend detail ... stops in mid-2023." / FAQ "run from 2021 to mid-2023" | "Detailed frontend accounts stop in mid-2023; a thin September 2025 frontend developer account describes a recruiter call and a live-coding round with two engineers." |
| "A 15 to 30 minute recruiter call follows" | "A short recruiter call follows (15 minutes in one full-stack account)" and cite that account, or drop the range |
| "a fit interview of about an hour" / row "About 60 minutes with engineering managers" | "a fit interview with engineering managers (60 minutes in one full-stack account)" |
| "two easy algorithm problems" | "two algorithm problems, mostly easy (one account had a medium)" |
| "no frontend-titled account mentions system design" | "no frontend-titled account describes a system design round" |

### W2.4 Google: claims resting on an unreadable Medium post

File: `company-interview-processes.ts` lines 880 (caveat), 900 (screen row), the evidence label "Medium, Apr 2026", and the "upcoming" pilot sentence in `company-preview.component.html`.

| Now | Replace with |
|---|---|
| "The number of frontend rounds varies, and one account had none." | "The number of frontend rounds varies; one 2026 account, read as a preview only, had none." (or cite LC 417531, 2019, which the research doc holds) |
| "45–60 minutes of coding in a shared document" | "About an hour of coding in a shared document" |
| "Hiring committee and team match: A committee review after the loop, then team matching." | "A hiring committee review and team matching after the loop; the order varies." |
| system design "A design round with a frontend and API focus. L5 and above." | add "in most accounts; one L5 candidate reported a non-frontend design round" |
| "describes an upcoming AI-assisted code-comprehension pilot" | "describes an AI-assisted code-comprehension pilot planned for the second half of 2026" and re-date the note |
| label "Medium, Apr 2026" | "Medium, Apr 2026 (preview)" |

### W2.5 Tesla: "three to five rounds"

File: `company-editorial-notes.ts` lines 343, 346, 351, 352. "3 to 5 onsite rounds", "a three to five round onsite", "Assessment, screen, then a three to five round onsite" and "three to five rounds of about 45 minutes" all become "three or four" (no cited account has five). "Most accounts open with a recruiter or HR call" becomes "Two accounts open with a recruiter or HR call". The colour-contrast item note "reported in a 2022 Codility assessment" becomes "listed in a 2022 account that also had a Codility assessment"; align the css-positioning catalog note, which places a CSS task in the onsite.

### W2.6 Stripe and Datadog: date ranges and an uncited account

- `company-editorial-notes.ts` line 686 area: hero "reports from 2021 to 2025" becomes "2022 to 2025" (the only 2021 source is an uncited full-stack thread); "onsite of five rounds" becomes "four or five rounds". Add the Taro Canada September 2025 account ("The question was broken into a 3-part exercise through CoderPad.") to the technical-screen row; it is the source of "one screen was a three-part exercise". Note that the cited LeetCode SDE2 account describes a 45-minute screen against the row's 60.
- `datadog-preview-content.ts`: "these round types occurred between 2021 and 2025" becomes "between 2024 and 2025"; the Paris advice becomes "complete each step and do not worry about optimisations such as context providers or virtualisation"; prompt 3 cites both the Lisbon and the Valbonne accounts.

### W2.7 xAI and Shopee: paywalled and blocked sources

- `xai-preview-content.ts`: the Aced MTS account keeps only its public summary (L3, rejected, four-week loop, a short recruiter screen, a four-hour AI-assisted take-home, a one-hour in-person session on an unfamiliar class); "December 2025", "one of six prompts", the API keys, the GitHub repository and Loom video within 24 hours and the 15-minute screen are member-only detail: label or drop. Add `andys.blog/xai/` (9 October 2025) as the source of the "4-hour intensive programming challenge" quote. "engineers, not recruiters, evaluate applications" becomes "technical team members, not recruiters".
- `shopee-preview-content.ts`: "on Glider.ai in the accounts that name the platform", "proctored" and "60 to 70 minutes" become "a 70-minute online assessment in the 2022 account" unless the LeetCode OA posts are cited; the "five JavaScript problems" variant is a blocked 1point3acres thread, label it a search snippet or drop it; the 2023 senior loop in the caveat gets its GoodJob source.

## Wave 3: Taro labels

Rule: no city, and a 1st-of-month date is written as the year or "(Taro, approximate date)". Constants to change:

- `meta-preview-content.ts` lines 11, 14, 20 (London, December 2021; United States, January 2022; New York, April 2025).
- `datadog-preview-content.ts` lines 10, 13, 16, 19 (Valbonne, Paris, Lisbon ×2) and the duplicated "Taro, Oct 2024" evidence entry.
- `intuit-preview-content.ts` line 17 (Los Angeles, September 2022).
- Tesla car-rental item and process rows ("Fremont, January 2024"), `cdn/questions/javascript/debug.json` Stripe items ("Barcelona, October 2023"), Revolut (Madrid, Portugal, Poland, Krakow, Georgia) and ServiceNow (Hyderabad; the "India only" table framing rests on two Taro cities) labels.
- Process-table evidence labels of the form "Taro, Mon YYYY" where the source date is the 1st: write "Taro, YYYY".

## Wave 4: precision

One-line edits, wording in the audit's "Overstated" list: Amazon (closures in one account; the India 2025 assessment had one coding question plus MCQs; no account mentions storage), Meta ("most accounts" instead of "every account"; one BigFrontend match plus one recommendation), Netflix (memo row), Waymo (candidate's recollection of the posting; no timed build; "edited by PracHub"), Intuit (2025 codebase-plus-stories detail; prompt 5 cites both posts; one algorithm problem in the 2025 loop), ServiceNow (location framing; single-account durations), Uber (two of seven accounts from India; one CodeSignal account; L6+; hub wording; cite LC 1064199 and 6840169), ByteDance (six new-grad or intern loops in the counts; CodeSignal-only US assessment row; Singapore account moved out of the US block; "Published by ByteDance and TikTok" with a joint-venture note), Walmart (one SDE 3 account without durations; sources from 2020; the debug session is a commenter; "asked about" module federation; the inbox prompt is Blind advice; "mostly from the US"), Microsoft ("publishes official hiring guidance"; one account gives two hours; four rounds in one Bangalore account; technical hiring-manager rounds in 2020 and 2021), Apple (four of nine accounts describe both stages), Revolut (the Madrid screen names no language), Zalando (two of three loops from Berlin; the 2020 assessment named no platform and allowed three working days; the official-pages wording; the hiring-manager and take-home-review rows), JPMorgan (briefings counted as reports; the level mapping), Agoda (one account states India; preliminary-call citation; 15 minutes; two commenters; cite the Senior Fullstack Gurgaon-then-Bangkok account), Shopee (university tag, one-round March 2020 post, cost-of-living material, no duration for the HTTP round).

## Wave 5: research records

- `docs/references/company-interview-processes-2026-10.md`: Apple official page exists; ElevenLabs correction 5 was partial; Spotify carousel is the candidate's example.
- `docs/references/company-sources-review-2026-10.md`: Apple official page; the autocomplete source attribution in section 2.
- `company-official-guides.ts` file comment: Apple is no longer an example of a company without a page.

## Verification per wave

Waves 1, 2 and 4 (content modules, editorial notes, process registry): the Karma specs for `company-editorial-notes`, `authored-company-previews` and `company-interview-processes`, `npm run gen:seo` (one pending page per commit), `rm -rf dist && npm run verify:seo-prerender-guard` (smoke pins, including the xAI title), `PLAYWRIGHT_WEB_SERVER=1 npm run test:e2e:critical`, the seo-ssr extended suite for the authored and editorial cases, `npm run lint:text` and cspell (both run in pre-push). Wave 2.2 and W1.2 (CDN sources): `node scripts/update-question-id-manifest.mjs`, `npm run gen:data`, `npm run lint:questions:check`, the question-tags and link-equity tests, `cd backend && npm run generate:interview-content:check && npm test`, then the registry re-pin. Wave 3: the SSR reflow test at 360 px for the Evidence cells (labels at about 28 characters). After the main deploy: Search Console indexing requests for every changed page.

## Status

| Wave | State | Date |
|---|---|---|
| 1 | done on dev, not pushed: 47048006 Airbnb, be6d0775 Apple (copy, official row, vue autocomplete source, research docs), 46e17691 xAI (SpaceXSI), 461b9ba8 JPMorgan Chase, c6340e8c Revolut (summary, official row, video note), b9b596a3 Amazon (note, Leadership Principles row, hub URL), cf81ece6 Microsoft, 35883a82 Uber. Karma company-previews specs 36/36; prerender guard on a clean dist run after the last commit (see the session report). The JPMorgan Aced account keeps its 2026-05 evidence date from the 2026-10-21 full read; the page copy uses only the public summary. | 2026-10-22 |
| 2 | done on dev, not pushed: d34c70c0 ElevenLabs (cites c79e72 and EL3 to EL5, four-question phrase removed, react-autocomplete-search-starter note), eee32dd3 Spotify (carousel as the candidate's example, row citations, Taro corroboration, Lever and Mural wording, Start your journey links), 78a8c23c Booking.com (2025 loop, durations, BK12 full-stack account cited, research addendum), f98dde3d Google (preview label, hour-long screen, committee order, L5 design note, pilot wording, note re-dated with its pins), 60e87525 Tesla (three or four rounds, two accounts open with a call, colour-contrast and login-form attribution, CSS note), d9491b32 Stripe (ST8 three-part screen cited, 2022 to 2025, four or five rounds), 3268c804 Datadog (2024 to 2025, Paris advice, prompt attribution), 918500c5 and ac78b25d xAI (public Aced summary, blog source, technical team members), 99ca7b29 Shopee (assessment FAQ, GoodJob source). Karma company specs 70/70; guard and SSR suite run after the last commit (session report). | 2026-10-22 |
| 3 | done on dev, not pushed: 9f8dd5e3 registry (63 placeholder-dated Taro sources render as "Taro (approx.), Mon YYYY"; 22 real-dated keep "Taro"), 7c0498a9 catalog (17 source labels lose cities and placeholder months, company reports regenerated), and the module pass (Datadog, Revolut, Meta, JPMorgan Chase, Intuit, xAI labels and sentences; ServiceNow table no longer India-only). Locations from LeetCode, Blind, frontendgeek and postings stay. Guard and SSR suite run after the last commit (session report). | 2026-10-22 |
| 4 | done on dev, not pushed, in three passes: a1af2e80 authored guides and official rows (Amazon, Meta, Waymo, Intuit, Revolut, Agoda, JPMorgan Chase, Shopee; Netflix memo, Uber hub, Waymo AI rule, TikTok joint-venture note), 287fe910 notes pages (Uber, ByteDance, Walmart, Microsoft, Zalando), and the registry pass (ServiceNow durations, ByteDance US assessment, Zalando rows and role label, Agoda prep call and Gurgaon note with the senior full-stack source in the guide, JPMorgan briefing labels, Microsoft caveat and rows, Uber 2021 CodeSignal and 2025 rounds sources). Not changed: the Walmart messaging-inbox catalog source keeps its "reported-interview-question" evidence type because its note already says the prompt is not reported; the Tesla confidential-brief sentence stays (PDF unreadable either way). Guard and SSR suite per session report. | 2026-10-22 |
| 5 | proposed, not started. | 2026-10-22 |
