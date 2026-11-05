---
title: "Design a Hotel Search Page Frontend for Several Teams"
slug: "hotel-search-page-frontend"
family: "system-design"
tech: "frontend"
audience: "Frontend engineers preparing for system design interviews"
intent: "Teach a concrete hotel search page answer with URL-owned search state, team-owned units behind a shell contract, late replies that never render, cache lifetimes from the CDN to the browser and per-build telemetry."
target_words: 1900
primary_keyword: "hotel search page frontend system design"
status: "converted"
content_schema_version: 2
target_level: "senior"
timebox_minutes: 20
candidate_prompt: "Design the frontend of a hotel search page. Date, city and guest inputs sit on top, filters on the left and result cards on the right. A million people a day use it, and several teams ship parts of it on their own schedules. Decide where the search state lives and how the page splits into deployable units. Say what the CDN and the browser cache, and how a regression is traced to one deploy."
constraints:
  - "The URL is the source of truth."
  - "Each team deploys its unit on its own schedule."
  - "Prices change every few minutes."
expected_decisions:
  - "Split the page by ownership into a shell and three units with a typed contract between them."
  - "Keep the inputs and the filters in the URL, derive each unit from it, and ignore replies for superseded queries."
  - "Cache assets and HTML by version and prices briefly, and stamp every metric and funnel event with the unit build that produced it."
prerequisites:
  - "URL and history APIs"
  - "HTTP caching headers"
  - "Core Web Vitals"
core_skills:
  - "Ownership boundaries"
  - "URL-owned state"
  - "Stale reply handling"
  - "Release observability"
guided_mock: false
evaluation_must_cover:
  - "The URL owns the search and the filters."
  - "Units deploy independently behind a shell contract."
evaluation_strong_signals:
  - "A late reply for an old query never overwrites current results."
  - "Every metric and event names the unit build that produced it."
evaluation_expert_stretch: "Edge composition with per-unit rendering budgets."
evaluation_red_flag: "Each unit keeps its own copy of the filters."
notes_for_conversion:
  - "Practice version of the hotel search page architecture hour described in a July 2026 Agoda account on LeetCode; it is not the reported wording and names no product data."
  - "Keep ranking, inventory and payments behind the search backend contract."
  - "Maintain exact V2 practice parity across the draft, index and metadata, and ship exactly two local SVG diagrams."
search_intent: "Prepare a frontend system design answer for a hotel search page built by several teams."
reader_promise: "The reader can explain URL-owned search state, team-owned units behind a shell contract, late replies that never render, cache lifetimes from the CDN to the browser and per-build telemetry for a hotel search page."
unique_angle: "Follow one filter change through a slow results fetch, a shared link, a release by another team and a price change, with the URL owning the search and each team owning its deploy."
what_this_adds_beyond_basics: "Brings the usual follow-ups of the micro-frontend question into one answer: the URL as the single writer for the search, a queryId that keeps a late reply off the screen, a shell contract with a contract test before a unit mounts, three cache lifetimes with a purge path, and telemetry that names the unit build so one team can roll back alone."
competitor_query: "hotel search page frontend system design"
competitor_takeaways:
  - "Strong answers split a large page by team ownership behind a thin shell and keep one framework version pinned, rather than composing by visual block."
  - "Frontend versions of a search page keep the query in the URL for shareable links and server rendering, and cancel or ignore requests for superseded queries."
competitor_gaps:
  - "Public answers rarely say how a regression after a release is traced to one unit, or what a contract test between the shell and a unit checks."
  - "Cache lifetimes are usually listed as a CDN without saying which content gets which lifetime or how a price update reaches the edge."
sources:
  - "https://leetcode.com/discuss/post/8459009/"
  - "https://careersatagoda.com/blog/how-we-hire-agodas-tech-team-interview-process/"
  - "https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams"
  - "https://developer.mozilla.org/en-US/docs/Web/API/History/pushState"
  - "https://developer.mozilla.org/en-US/docs/Web/API/AbortController"
  - "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control"
  - "https://web.dev/articles/vitals"
  - "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions"
last_fact_checked_at: "2026-11-05"
reviewed_by: "FrontendAtlas editorial"
confidence: "high"
---
# Prompt

This hotel search page frontend system design exercise follows one traveller from a shared link to a list of cards and through a release by another team. The page has date, city and guest inputs on top, filters on the left and result cards on the right, with a support chat widget. A million people a day use it, several teams ship parts of it on their own schedules, and prices and availability change every few minutes.

Candidate prompt: Design the frontend of a hotel search page. Date, city and guest inputs sit on top, filters on the left and result cards on the right. A million people a day use it, and several teams ship parts of it on their own schedules. Decide where the search state lives and how the page splits into deployable units. Say what the CDN and the browser cache, and how a regression is traced to one deploy.

The browser-facing scope covers the inputs, the filters, the results list, the shell that composes them, the request lifecycle, the cache lifetimes and the telemetry. The search backend is a contract, not an implementation target: it owns availability, prices, ranking and the result pages. Inventory, payments and the ranking rules stay outside the frontend design.

# Clarifying Questions

- **What must independent deploys mean?** Separate builds composed on one page by a shell, each released on its own cadence, with one pinned framework version. Separate routes or repositories are a team choice, not the requirement.
- **Does a filter change refetch or re-rank?** It refetches. The backend owns ranking and facet counts, so the page sends the new query and renders what comes back.
- **Must a shared link reproduce the list?** Yes. The city, dates, guests, filters, sort and page live in the URL, and the page rebuilds from it on load.
- **How fresh must a price be?** It is a quote with a time. The card shows the quoted time, the property page refetches, and the backend confirms the price at booking.
- **What does a regression look like?** A worse LCP or INP, or a higher error rate, on one slot after one team's release. Telemetry must say which unit build produced each number.
- **What does accessibility require?** Real checkboxes in a labelled group, a keyboard-reachable date picker, a combobox for the city, a polite live region that summarizes each reply, and focus that stays where the traveller put it.

# Architecture

The browser splits into a shell and three team-owned units. The shell owns routing, layout, the design system version, the telemetry client and the unit manifest; it reads the URL into a SearchQuery and mounts the inputs, filters and results units through a typed contract with a mount, update and unmount surface. The inputs unit keeps the city suggestions, the date picker and the guest counts before they are committed. The filters unit keeps the facet counts from the last reply and the selection being edited. The results unit keeps the current queryId, the loaded pages, the card images and the sort. A search gateway owns the request lifecycle with one AbortController per query and a short price cache.

The canonical flow: Mia opens a shared link for Bangkok, 12 to 15 March, two guests, with the pool filter on. The shell parses the URL into query q_41 and mounts the units with it; the results unit shows skeleton cards while the gateway fetches. Before the reply arrives she adds the breakfast filter. The filters unit writes to the URL, the shell derives query q_42, and the gateway aborts the q_41 request and sends q_42 with a new queryId. A proxy returns the q_41 reply anyway, because the abort raced it; the results unit compares the reply's queryId with the current one, finds q_41 superseded, and keeps the skeletons. The q_42 reply arrives with 38 results and facet counts, the results unit renders page one, the filters unit updates its counts from the same reply, and the live region announces that 38 hotels match. While she scrolls, the filters team ships build f_219; her tab keeps the build it loaded until the next navigation, and the new build's contract test ran before the manifest pointed at it.

# Tradeoffs

**The URL as the single writer versus state in each unit.** Copies of the filters in three units drift after a slow reply or a missed event, so a user sees cards for one filter set under checkboxes for another. The URL costs one serializer, written through the shell router with [URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams), and gives every unit the same truth plus a shareable link.

**Replace while typing versus push on commit.** Every keystroke as a history entry makes the back button useless. Typing updates the URL with replace and a committed change pushes an entry through the [History API](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState), so the history holds searches, not keystrokes.

**Abort versus ignore.** An [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) cancels the old request and saves bandwidth, but an abort can race a reply that is already on its way. The queryId check is what keeps a late reply off the screen; the abort is an optimization on top of it.

**Composition by team versus by visual block.** Three units mapped to three teams cost a shell, a contract and a manifest. Splitting by visual block without a team behind each piece pays the same cost and buys nothing, so the split follows ownership.

**Three cache lifetimes versus one.** Hashed assets can live for a year as immutable because a change produces a new name; HTML needs a short lifetime so the new names reach the browser; prices are private and short-lived. One lifetime for all three either breaks releases or shows stale prices, which [Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control) can express per response.

# Failure Modes

**A reply for an older query arrives late.** The results unit compares its queryId with the current one and ignores it, keeping the loading state for the current query.

**The search request fails.** The results slot shows an error state with a retry; the inputs and the filters keep working, and the URL still holds the search, so the retry needs no re-entry.

**A unit fails to load.** The shell renders a fallback in that slot and reports the build. The other units keep working, so a broken filters build cannot blank the results.

**The price changed since the quote.** The property page refetches and shows the new price with its time. A traveller never pays a price the page invented.

**A chunk from an older build is missing.** Hashed assets stay published for recent builds and the shell reloads on a missing chunk, so a tab opened before a release keeps working.

**The CDN serves stale HTML.** HTML carries a short lifetime and a version header, and the shell checks the manifest on navigation, so a user reaches the new build within one navigation.

# Metrics

Track LCP, INP and CLS per route and per unit build at p75, as [web.dev defines the Core Web Vitals](https://web.dev/articles/vitals), the time from search to first cards, the share of replies ignored as stale, the retry rate after search errors, and the search-to-view-to-book-to-pay funnel keyed by searchId, split by device class and connection type. Judge a release by the change in those numbers for its own unit, not by the page as a whole, and alert when the share of stale replies or the error rate for one slot rises after a manifest change. Run keyboard and screen-reader passes over the combobox, the date picker, the filter group and the results [live region](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions).

# Rollout

Ship the URL-owned query and the gateway with the queryId check behind the existing page first, then the shell and the manifest with one unit extracted, then the remaining units. Keep a kill switch that pins every slot to its last known good build while the inputs and the filters stay usable. Before expansion, automate a filter change during an in-flight reply, a shared link on a phone, a failed search request, an older contractVersion and a missing chunk, and review the live region, focus handling and keyboard paths with assistive technology.
