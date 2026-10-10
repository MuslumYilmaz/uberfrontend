# Organic landing engagement on system-design pages — 2026-10-10

> Point-in-time baseline from GA4 plus the changes shipped against it. Re-measure 4–6 weeks after deployment; the title changes also need a Google recrawl before CTR can move.

## Scope and evidence

| Item | Value |
|---|---|
| Source | GA4 property, Search Console-linked report "Google organic search traffic: Landing page" |
| Window | 2026-07-12 through 2026-10-09 (90 days) |
| Traffic cut | Google organic only (Bing excluded on request); about 280 clicks in total |
| Engagement definition | GA4 engaged session: more than 10 s, 2+ page views, or a key event. Engagement rate = engaged sessions / sessions |
| Comparison group | Trivia detail pages in the same report, which sat between 85% and 100% engagement |

## Baseline (before this change)

| Landing page | Clicks | Users | Engagement rate | Avg. engagement time | Avg. position |
|---|---:|---:|---:|---:|---:|
| `/system-design/dashboard-widgets-draggable-resizable` | 34 | 37 | 44.7% | 12 s | 22.3 |
| `/system-design/ai-chat-textarea-design` | 8 | 11 | 27.3% | 7 s | 10.9 |
| `/system-design/notification-toast-system` | 3 | 4 | 20.0% | 2 s | n/a |
| `/system-design/offline-email-client` | 3 | 4 | 12.5% | 2 min 45 s | n/a |

Samples below ten users are directional only. The dashboard page is the one with enough volume to read.

## Hypotheses and the evidence behind them

1. **The answer was not on the first screen.** The detail page opened with a "Try first" practice card (candidate prompt, constraints, prerequisites, evaluation spine, actions) and rendered every RADIO answer section as a collapsed `<details>`. A searcher who wanted the design answer saw a practice brief and five closed headings. Source: `frontend/src/app/features/system-design-list/system-design-detail/system-design-detail.component.html` and the `openSectionKeys` default in the component.
2. **Title and intent did not match on two pages.** The dashboard page ranked for implementation-minded queries at position 22 while its title read as a generic "Frontend System Design" label. The AI chat page lives at a `textarea-design` slug while its title said "Composer and Streaming Turn", so the snippet did not echo what people searched.
3. **Measurement could not separate "did not find the answer" from "read it and left".** No event recorded whether a visitor opened an answer section or reached the answer by scrolling. Google Analytics itself only loads after a trusted interaction or 15 visible seconds (`telemetry-bootstrap.service.ts`), so a search visitor who left after 7–12 seconds without clicking never reached GA at all, while Search Console still counted the click.

## What shipped

- **First RADIO section open by default** on real detail pages. The embedded home-page preview keeps every section collapsed. Back after "Start reference answer" returns to that default instead of closing everything.
- **Compact "Try first" card.** The eyebrow, candidate prompt and action buttons stay visible; constraints, prerequisites and the evaluation spine moved into one collapsed disclosure ("Constraints and what good looks like").
- **Intent-aligned metadata.**
  - Dashboard: `<title>` "Drag-and-Drop Dashboard System Design: Grid, Resize, Persist"; description leads with the design answer and its parts. The machine-coding link is now labelled for implementation-minded visitors.
  - AI chat: `<title>` "AI Chat Textarea Design: IME-Safe Enter, Streaming Replies"; description names the textarea and the streaming rules. A "Build it" links block points to the React chat streaming exercise (premium) and the free `takeLatest` exercise.
  - H1s, slugs and primary keywords did not change.
- **Two new GA4 events** from the detail component:
  - `system_design_section_opened` — only user-initiated opens (code-driven opens such as the default, `#answer` or TOC navigation are filtered out). Params: `question_id`, `section_key`, `section_index`, `open`.
  - `system_design_read_engaged` — once per page after 10 visible seconds when the reader either reached 25% scroll depth or opened a section. Params: `question_id`, `seconds_visible`, `max_depth_percent`, `sections_opened`, `first_section_default_open`.
- **Search landers qualify GA immediately.** A referrer from google.*, bing.com or duckduckgo.com now qualifies the decision session on arrival (`search_referrer` method) instead of waiting 15 seconds, so short visits from search are measurable. Hidden tabs qualify when they become visible.

## How to read the result in GA4

1. **Landing-page table:** Reports → Search Console → "Google organic search traffic: Landing page". Compare the four pages above on engagement rate and average engagement time for the same 90-day span after deployment.
2. **Exploration:** Explore → Free form. Dimensions: Landing page + query string, Device category. Metrics: Sessions, Engaged sessions, Average engagement time per session, Event count. Add a filter `Event name` exactly matches `system_design_read_engaged`, and a second tab for `system_design_section_opened` with `section_key` as a breakdown.
3. **Key event:** Admin → Events → mark `system_design_read_engaged` as a key event so it counts toward engaged sessions and shows in the landing-page report.
4. **Qualification mix:** Admin → Events → `decision_session_qualified`, breakdown by the `qualification_method` parameter (contract in `docs/references/ga4-conversion-baseline.md`). Expect `search_referrer` to appear and `foreground_15s` to shrink; compare total qualified sessions before and after to confirm the referrer path did not double count.

## Caveats

- Events queue inside `AnalyticsService.track` until GA initialises; for non-search referrers the 15-second rule still applies, so direct and social visitors shorter than that remain invisible.
- On short pages the viewport can already cover 25% of the document, so `max_depth_percent` alone is weak evidence; `sections_opened` and `seconds_visible` are the stronger signals.
- Search Console clicks and GA sessions never reconcile exactly: consent, blockers and the qualification gate all drop GA sessions.
- A changed `<title>` needs a recrawl; expect 2–6 weeks before the SERP snippet and CTR reflect it.
