---
title: "Infinite Scroll List System Design"
slug: "infinite-scroll-list"
family: "system-design"
tech: "frontend"
audience: "Frontend engineers preparing for system design interviews"
intent: "Teach a concrete frontend architecture answer with explicit state, failure, accessibility, and rollout decisions."
target_words: 2400
primary_keyword: "infinite scroll list frontend system design"
status: "converted"
notes_for_conversion:
  - "Keep the route, question ID, and access level stable."
  - "Keep backend execution out of scope; describe only UI-facing contracts."
  - "Maintain parity with the five shipped RADIO sections."
search_intent: "Prepare a frontend system design answer for Infinite Scroll List System Design."
reader_promise: "The reader can explain the frontend state, architecture, interfaces, failure recovery, accessibility, and rollout decisions for Infinite Scroll List System Design."
unique_angle: "Design an infinite-scroll list with cursor pagination, request recovery, bounded DOM rendering, stable scroll anchors, and accessible alternatives."
what_this_adds_beyond_basics: "Adds an end-to-end worked example, state ownership, recovery, accessibility, and measurable rollout guidance for Infinite Scroll List System Design."
competitor_query: "Infinite Scroll List System Design frontend system design"
competitor_takeaways:
  - "Catalog pages commonly list components but stop before reconciliation and failure recovery."
  - "Reference material is strongest when it anchors browser behavior in official platform guidance."
competitor_gaps:
  - "A state transition is often described without showing the visible UI result or preserved invariant."
  - "Accessibility, mobile reflow, cancellation, and rollback are frequently treated as afterthoughts."
sources:
  - "https://developers.google.com/search/docs/crawling-indexing/javascript/lazy-loading"
  - "https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API"
  - "https://www.w3.org/WAI/ARIA/apg/patterns/feed/"
  - "https://developer.mozilla.org/en-US/docs/Web/API/History/scrollRestoration"
  - "https://web.dev/articles/virtualize-long-lists-react-window"
last_fact_checked_at: "2026-07-28"
reviewed_by: "FrontendAtlas editorial migration"
confidence: "high"
---
# Prompt

infinite scroll list frontend system design. Design an infinite-scroll list with cursor pagination, request recovery, bounded DOM rendering, stable scroll anchors, and accessible alternatives.

## Requirements and a 60-second answer

Begin by turning “infinite scroll” from an interaction pattern into a bounded product problem. Confirm what is being browsed, whether results can change while the session is open, how users return to an item, and whether the collection must remain discoverable without JavaScript. The design below assumes a one-way, changing feed with an unknown total, cursor pagination, variable-height rows, and scroll restoration after navigation.

### A strong 60-second answer

### Interview-ready opening

Render a server-addressable first page, then ask a data controller for cursor-based pages as an IntersectionObserver sentinel approaches the viewport. The controller admits only one request for a cursor, aborts obsolete work, rejects responses from an older filter generation, and merges results through a stable ID map so retries or overlapping pages cannot create duplicates. The view starts as a normal list and adds windowing only after measurement shows that mounted DOM is the bottleneck. For variable-height rows, the window keeps a measurement cache and a small overscan range. Loading, end, and retry states remain in the list flow; aria-busy and polite status announcements explain changes; a visible Load More control provides keyboard, assistive-technology, and recovery access. Before navigation, save an anchor item and intra-item offset instead of only a fragile document pixel. Verification covers duplicates, gaps, stale responses, position restoration, bounded DOM size, and long tasks on a representative mid-range device.

### Choose the browsing model before the architecture

### Infinite scroll, Load More, or pagination
| Model | Best fit | Main cost | Decision |
| --- | --- | --- | --- |
| Infinite scroll | Exploratory feeds where the next item is more important than a precise destination | Weak sense of progress, difficult footer access, and more restoration work | Use for continuous discovery, but keep an explicit fallback control |
| Load More | Discovery where users benefit from a deliberate pause and a stable footer | Adds an action between batches | Often the most accessible default and the fallback for automatic loading |
| Pagination | Search results, audit trails, and collections that need durable page URLs | Interrupts continuous browsing | Prefer when position, sharing, search discovery, and back navigation dominate |

### Clarify the contract

### Questions that materially change the design
- Can items change during the session? Assume yes, so the server supplies deterministic order and an opaque cursor.
- Is the total known or is random access required? Assume an unknown total and forward browsing.
- Are rows fixed height? Assume variable text and media, so measurement and anchor correction are required.
- Should return navigation restore context? Assume yes, by item identity and intra-item offset.
- Must the collection be discoverable without automatic loading? Assume durable pages and visible sequential links.

### Functional requirements
- Render a useful first page quickly and reserve media dimensions to prevent layout shifts.
- Load the next cursor near the viewport without issuing duplicate requests.
- Represent initial loading, incremental loading, empty, partial error, retry, and end states.
- Preserve stable order and remove duplicate IDs across overlapping or repeated responses.
- Restore filters, loaded data, focus, and the reading position after navigation.

### Quality requirements
- Keep input and scrolling responsive on a representative mid-range device.
- Bound mounted DOM nodes and retained page data for long sessions.
- Support keyboard and screen-reader operation without relying on the sentinel.
- Expose recoverable failures in context instead of replacing successful content.
- Keep important collection content reachable through discoverable URLs and links.

### Requirements references
- [Google Search: lazy-loaded content](https://developers.google.com/search/docs/crawling-indexing/javascript/lazy-loading) — Use Google’s guidance when automatic loading must coexist with discoverable, linkable collection pages.

### Requirement boundary

Do not promise infinite retention, perfect real-time consistency, and constant DOM size at once. State which consistency model the product needs, which historical pages may be evicted, and how users recover content that is no longer mounted.

### Frontend boundary

The browser owns observation, request admission, page merging, scroll anchoring, rendering, and accessible fallback controls. The server exposes only an abstract cursor-page and ordering contract; storage, ranking, and service topology remain outside this frontend design and never determine DOM windowing.

# Clarifying Questions

- Which user journey and input modes must Infinite Scroll List System Design support first?
- Which state is authoritative, which state may be optimistic, and how is freshness represented?
- What ordering, identity, and version rules must survive retries or out-of-order responses?
- Which interactions must remain usable with keyboard, assistive technology, and narrow screen widths?
- What should users see during loading, partial failure, cancellation, and recovery?
- Which performance budgets are hypotheses to measure rather than universal thresholds?

# Architecture

## Architecture and data flow

Use a small pipeline with explicit ownership: the route owns the query and restoration key, a feed controller owns remote-data correctness, the list viewport owns rendering and observation, and a row renderer owns item presentation. This separation matters because a visibility signal is only a request hint. It must not be allowed to mutate cursors or append results directly.

### The boxes to draw

### State and data ownership
- The route owns normalized filters, sort order, feed identity, the first page, and the restoration key.
- The controller owns entities, order, cursors, request generations, cancellation, errors, and cache policy.
- The page API owns deterministic ordering and opaque cursor semantics.

### Rendering ownership
- The viewport owns the sentinel, virtual range, loading and retry rows, announcements, and anchor capture.
- The item renderer owns semantic row markup, a stable key, reserved media geometry, and item actions.
- Neither rendering layer mutates server cursors or invents pagination state.

### Forward data flow

### From first render to the next page
1. **1. Hydrate a useful first page:** The route renders initial items and the next cursor in HTML. The client normalizes them into an ID-keyed entity map plus an ordered ID array, then attaches one observer to the sentinel.
2. **2. Convert visibility into intent:** When the sentinel enters a prefetch margin, the viewport emits loadNext. The controller ignores the signal when there is no next cursor, the same cursor is already in flight, the retry delay is active, or the feed generation has changed.
3. **3. Start an owned request:** The controller captures the current generation and cursor, creates an AbortController, marks that cursor as pending, and calls the page API. Repeated observer callbacks therefore collapse into one request.
4. **4. Validate before merging:** On response, the controller first compares the captured generation with the active one. A response for old filters is discarded. Valid items are merged by stable ID, their ordered IDs are appended only once, and nextCursor changes only after the page commits.
5. **5. Render and announce:** The viewport derives its rendered range from ordered IDs, the measurement cache, scroll position, and overscan. It removes the loading row, announces how many items were added, and leaves focus where the user placed it.

### Guard duplicate sentinel triggers

IntersectionObserver may fire several times while layout shifts, the loading row changes height, or the user crosses the threshold repeatedly. A boolean isLoading guard helps, but cursor identity is the stronger lock. Keep an inFlightCursor set or one active request record, and make loadNext idempotent for that cursor. Do not advance the cursor when the request starts. If the request fails, the same cursor remains available for Retry; if it succeeds, commit the returned nextCursor atomically with the merged page.

### Concurrency practice
- [Implement takeLatest request behavior](/javascript/coding/js-take-latest) — Practice admitting only the latest request result when filters or queries change.
- [Build abortable JavaScript helpers](/javascript/coding/js-abortable-helpers) — Practice propagating AbortSignal through reusable asynchronous utilities.

### Query and viewport ownership

The important arrow is not sentinel to network. It is sentinel to intent, intent to a guarded controller transition, validated response to normalized state, and derived state to the viewport. That boundary contains duplicate triggers, retries, filter races, and rendering complexity.

### Worked example: filter change during a pending next page

The user has items 1 through 40, the sentinel requests cursor c40, and then the user changes the status filter before that request resolves. Follow identity, generation, and anchor state instead of relying on promise completion order.

### Scenario walkthrough
| Event | Store change | Visible UI | Invariant |
| --- | --- | --- | --- |
| Sentinel requests c40 | Record one pending cursor under filter generation 7. | Keep the current list and show an inline loading row. | One cursor has at most one admitted request. |
| Filter changes | Abort generation 7, start generation 8, and retain the old view as transitional content. | Move focus to the refreshed list heading only after explicit submission. | Old pages cannot join a new query. |
| Old c40 resolves | Reject it because its generation and cache key are stale. | No duplicate or wrong-filter item appears. | Transport completion is not acceptance. |
| New first page resolves | Normalize IDs, replace query order, and derive a new anchor. | Render the new results and preserve a visible Load More control. | The URL, list, and announced count agree. |

# Tradeoffs

The central tradeoff is Design an infinite-scroll list with cursor pagination, request recovery, bounded DOM rendering, stable scroll anchors, and accessible alternatives. The preferred design keeps browser-owned state explicit and treats server behavior as a UI-facing contract. A different rendering or state strategy is justified only when measured interaction cost, device constraints, or collaboration requirements change the evidence.

## Pagination, state, and data correctness

Model the feed as a state machine, not an items array plus loosely related booleans. The core model needs normalized entities, deterministic order, committed pagination state, active request identity, and separate initial versus incremental failures. This makes impossible combinations harder to represent and gives every async result a clear acceptance rule.

### Cursor pagination is the default for a mutable feed

### Cursor versus offset pagination
| Property | Cursor | Offset |
| --- | --- | --- |
| Changing data | Continues after an opaque ordering boundary and better resists insertions ahead of the user | A new item shifts later offsets and can create duplicates or skipped records |
| Random access | Usually sequential unless the server exposes saved boundaries | Simple page-number jumps and shareable offsets |
| Client contract | Treat nextCursor as opaque and commit it only with a successful page | Track page or offset and require a stable sort with a tie-breaker |
| Best fit | Unknown, mutable feeds and timelines | Mostly stable catalogs, admin tables, and bounded search results |

### Ordering invariant

The server must define deterministic order, such as rankedAt descending with item ID as a tie-breaker. A cursor represents that ordering boundary. The client may deduplicate repeated IDs, but it cannot repair a server contract that produces ambiguous order or silently omits items.

### State worth naming in the interview

### Content and request state
- Feed identity: feedKey, normalizedFilters, sort, and generation.
- Content: entitiesById, orderedIds, and loadedPages, with each ID appearing once in order.
- Pagination: committed nextCursor and hasMore.
- Request: status, requestedCursor, requestId, and AbortController.

### Recovery and viewport state
- Failures: separate initialError, incrementalError, and failedCursor.
- Restoration: anchorItemId, anchorOffsetPx, focusedItemId, and savedRange.
- Windowing: measuredHeights keyed by ID, estimatedHeight, visibleRange, and overscan.
- Every async result carries one immutable generation.

### Stable ordering and ID deduplication

### Commit algorithm
1. **1. Capture request identity:** Before fetching, capture generation, requestedCursor, and a unique requestId. Mark that cursor in flight without changing the committed nextCursor.
2. **2. Reject obsolete work:** After resolution, compare the captured generation and requestId with current state. If filters changed, the request was replaced, or cancellation won the race, ignore the response even when the network could not be aborted.
3. **3. Merge by stable ID:** For each item, update entitiesById. Append its ID to orderedIds only when that ID has not appeared. Preserve the server page order rather than sorting again using client clocks.
4. **4. Commit the page atomically:** Store page membership, clear the matching error, and update nextCursor or hasMore in the same transition. If the server returns the same cursor again, stop and report a contract error instead of looping.
5. **5. Preserve retry semantics:** On failure, remove the in-flight marker but retain failedCursor and the committed nextCursor. Retry asks for exactly that cursor, so a transient error cannot skip a page.

### Reject stale responses by generation

A filter or sort change creates a new feed generation. Abort active requests as an efficiency measure, clear page and cursor state according to the product’s transition policy, and start the new initial load. The generation comparison remains the correctness mechanism because an abort may arrive after a response, a cache may resolve synchronously, or a transport may ignore AbortSignal. Debouncing input reduces requests but does not prevent stale results; generation-based acceptance does.

### Correctness test

After any sequence of duplicate observer events, failures, retries, filter changes, and out-of-order responses, the visible order must contain no duplicate IDs, no page committed from an old generation, and no cursor advanced without its page.

```typescript
type FeedItemId = string;

type FeedPage = {
  requestedCursor?: string;
  itemIds: readonly FeedItemId[];
  nextCursor?: string;
  orderingVersion?: string;
};

type FeedRequestState = {
  requestId: string;
  generation: number;
  requestedCursor?: string;
  controller: AbortController;
};

type FeedState<T extends { id: FeedItemId }> = {
  queryKey: string;
  filters: Readonly<Record<string, string | readonly string[]>>;
  sort: string;
  generation: number;
  entitiesById: Readonly<Record<FeedItemId, T>>;
  orderedIds: readonly FeedItemId[];
  pages: readonly FeedPage[];
  nextCursor?: string;
  hasMore: boolean;
  activeRequest?: FeedRequestState;
  failedCursor?: string;
  anchor?: { itemId: FeedItemId; offsetPx: number };
};
```

### Cursor pages, query state, and viewport invariants

Model PageRecord by complete query key, with ordered IDs, next cursor, admitted cursors, freshness, and request generation. Keep entities normalized by stable ID. View state stores an anchor item and intra-item offset, not only a document pixel that becomes invalid when row height changes.

### Client model
| Record | Key fields | Owner |
| --- | --- | --- |
| PageRecord | queryKey, ids, nextCursor, admittedCursors | Server-page cache |
| EntityMap | id to validated item | Normalized cache |
| ListViewState | anchorId, offset, visibleRange | Route session |
| RequestState | generation, cursor, AbortController | Controller runtime |

# Failure Modes

## Virtualization, accessibility, recovery, and verification

Optimize from evidence. A semantic list is simplest and may handle hundreds of light rows. Add windowing when profiling shows mounted nodes, layout, paint, or retained media dominate, then re-test correctness and accessibility.

### Choose whether to virtualize

### Simple list versus virtualization
| Approach | Use when | Benefits | Costs |
| --- | --- | --- | --- |
| Simple list | The loaded collection remains moderate and rows are inexpensive | Native document flow, straightforward focus and find-in-page, simple restoration | DOM and memory grow with every retained page |
| Virtualized list | Measured DOM, layout, paint, or row memory exceeds the performance budget | Mounted nodes remain near the viewport and long sessions stay bounded | Requires height estimation, measurement, overscan, focus policy, and stronger restoration tests |

### Fixed-height versus variable-height windowing
| Row geometry | Range calculation | Correction strategy | Risk |
| --- | --- | --- | --- |
| Fixed height | Calculate start and end indexes from scroll offset and one known row size | Usually no runtime measurement; reserve media to preserve the contract | Unexpected wrapping or user font settings can invalidate the assumption |
| Variable height | Estimate unseen rows and use measured cumulative heights for visible rows | Cache height by item ID, observe changes, and adjust relative to a stable anchor | Late media, expansion, or font changes can move content unless correction is anchored |

### Bound rendering and retained data

Key the measurement cache by item ID because insertions change indexes. Render the visible range plus small two-way overscan. Estimate unseen heights, update them from ResizeObserver, and compensate relative to the current anchor when content above the viewport changes.

Windowing bounds DOM, not memory. Apply a bounded data cache based on recent pages and restoration needs. Evict distant payloads only when they can be reloaded from a known boundary; retain lightweight page and anchor metadata. Pause expensive media and subscriptions outside the active range.

### Restore by identity, then correct geometry

### Navigation restoration
1. **1. Capture a stable anchor:** Record the first visible item ID, its offset within the viewport, focused item ID, feedKey, filters, and cached range.
2. **2. Reconstruct enough data:** Restore the matching feed and pages; reload an evicted anchor from a durable boundary.
3. **3. Place the anchor:** Reveal and measure the anchor, then correct to its saved intra-item offset. Use scrollY only for unchanged layouts.
4. **4. Stabilize and restore focus:** Reserve image dimensions and restore focus only when its prior target still exists.

### Accessibility is part of the loading model

### Semantic and keyboard behavior
- Prefer native list semantics; use ARIA feed only when its article navigation fits.
- Keep focused content mounted or move focus before recycling it.
- Provide visible Load More using the same guarded command as the sentinel.
- Keep the footer reachable without racing automatic loads.

### Loading and announcements
- Set aria-busy while appending without disabling loaded items.
- Politely announce a concise result such as “20 more items loaded.”
- Do not announce observer events, skeletons, or measurement corrections.
- Keep inline Retry where loading stopped and distinguish empty, end, offline, and permission states.

### Recovery and search discovery

Keep loaded rows usable when a later page fails. Inline Retry repeats failedCursor. Distinguish offline, timeout, server, malformed response, and authorization failures. A repeated cursor, invalid order, or missing ID stops automatic loading and emits telemetry instead of looping.

For search discovery, render a useful first page on a stable URL, then expose persistent page URLs through ordinary sequential links. Each page remains addressable while JavaScript appends it into the experience. Do not rely on fragments, IntersectionObserver, or synthetic scrolling for discovery.

### Verification plan

### Correctness and resilience
- Repeat sentinel events and assert one request and commit per cursor.
- Return overlapping pages and assert stable order without duplicate IDs or gaps.
- Resolve an old-filter response last and assert it cannot write.
- Fail and retry a page without advancing its cursor.
- Change row heights and verify anchor plus intra-item offset restoration.

### Performance and accessibility
- Keep DOM node count within the window budget during a long session.
- Profile long tasks, interaction latency, layout shifts, and scrolling on a mid-range device.
- Test changing row heights on slow, offline, and flaky networks.
- Load more with keyboard and screen reader.
- Find the first page and sequential links in raw HTML.

### Deep-dive resources
- [Frontend performance system-design guide](/guides/system-design-blueprint/performance) — Set measurable DOM, rendering, and long-task budgets.
- [System-design evaluation guide](/guides/system-design-blueprint/evaluation) — Evaluate correctness, trade-offs, observability, and tests.
- [W3C ARIA Authoring Practices: Feed Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/feed/) — Check when feed semantics and keyboard interaction fit.
- [MDN History.scrollRestoration](https://developer.mozilla.org/en-US/docs/Web/API/History/scrollRestoration) — Compare browser restoration with application anchors.
- [web.dev: Virtualize large lists with react-window](https://web.dev/articles/virtualize-long-lists-react-window) — Review fixed-size and variable-size windowing.

### Optimization checkpoint

Ship the guarded semantic flow before adding windowing and cache limits. Measure the rendered list, retained data, position restoration, focus, and recovery so each optimization answers observed evidence.

### Pagination failure and viewport recovery

### Failure modes
| Failure | Response | Invariant |
| --- | --- | --- |
| Observer fires repeatedly | Coalesce by cursor and query generation. | No duplicate network or commit work. |
| Page fails | Keep committed items and render retry in list order. | Retry reuses the failed cursor. |
| Row height changes | Recompute from anchor identity and measured offset. | Reading position stays stable. |
| Windowing breaks focus | Mount the target before moving focus and retain a Load More path. | Keyboard navigation remains predictable. |

### Accessibility behavior

Use a semantic list and expose loading with aria-busy plus a concise polite status. Infinite loading is never the only path: a keyboard-operable Load More control supports recovery and user pacing. Restored focus targets a real item or the list heading, and offscreen virtual rows are not represented as simultaneously focusable.

### Rollout and measurement

First prove pagination correctness without windowing, then measure DOM and interaction cost on representative content. Enable windowing only for cohorts where it improves long-session performance, while tracking duplicate IDs, missing pages, anchor restoration, retry success, and accessibility regressions.

# Metrics

Measure task completion and recovery before optimizing isolated rendering numbers. Track time to first useful UI, interaction latency by input mode, request and mutation failure rates, stale-response suppressions, retry outcomes, focus-restoration failures, layout overflow, and accessibility regressions. Segment field results by device capability, network class, viewport, and reduced-motion preference. Numeric targets begin as testable budgets and should be revised from production distributions.

# Rollout

Ship the smallest client slice that preserves identity, cancellation, recovery, accessibility, and observability. Validate the UI-facing contracts with deterministic fixtures, release behind a feature flag where appropriate, compare user outcomes and error distributions, and expand only after the failure and rollback paths have been exercised.

## Interface contracts for components and pagination

Define meaning, cancellation, and ownership before framework hooks. The list accepts a page loader and item renderer; the loader exposes opaque pagination without leaking transport details. Parents cannot set internal loading flags, and the list cannot invent server cursors.

### Page API contract

### Request and response

`PageLoader` receives one structured request containing the stable query key, normalized filters, sort order, page limit, opaque cursor, and `AbortSignal`. It returns ordered items, `nextCursor`, and optionally an ordering version. No `nextCursor` means the end. The client stores and returns the opaque cursor without parsing or incrementing it.

### Request guarantees
- Use an explicit limit and normalized filter object so cache keys are deterministic.
- Pass AbortSignal through every transport and transformation layer that can stop work.
- On Retry, send the committed cursor again instead of deriving a later cursor.

### Response guarantees
- Every item has a stable ID, and continuation uses deterministic ordering.
- nextCursor commits with its items and may be absent on the final page.
- A repeated cursor becomes a contract error instead of an automatic loop.

### Component contract

InfiniteScrollList receives feedKey, initialPage, pageLoader, renderItem, getItemId, estimatedItemHeight, overscan, and restoration data. Optional callbacks report an error, committed page, or end. Do not expose observer instances, measurement nodes, raw scroll events, cursor setters, or contradictory state flags.

### Viewport responsibilities
- Render semantic containers, one sentinel, loading, inline Retry, and end states.
- Expose aria-busy and concise announcements from controller state.
- Capture anchor and focus identity before navigation.

### Renderer responsibilities
- Render one semantic item without loading pages.
- Reserve media dimensions and report geometry changes.
- Use stable item ID for rendering and measurement, never array index.

### Lifecycle and failure semantics

### Request lifecycle
1. **1. Initialize:** Normalize initialPage under feedKey and render it, or issue one initial request.
2. **2. Request more:** Observer visibility and Load More invoke the same guarded loadNext command.
3. **3. Cancel or replace:** Unmount or a new feedKey aborts work; generation checks reject late completion.
4. **4. Recover:** Prior rows remain interactive, and Retry repeats failedCursor.
5. **5. Finish:** No nextCursor disables loading and emits the end event once per generation.

### Observer configuration

Match IntersectionObserver root to the scroll container and tune rootMargin against page size and latency. Recreate it only when configuration changes, disconnect on teardown, and let the callback dispatch intent rather than fetch or render.

### API reference
- [MDN Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) — Review observer roots, thresholds, root margins, and lifecycle behavior.

### Avoid a leaky component

If callers must synchronize cursor, loading, observer state, and retries, the component exports its races. Prefer immutable inputs and guarded commands.

### UI-facing contract

`PageLoader.load` receives the complete query identity, normalized filters, sort order, page limit, opaque cursor, and `AbortSignal`. Its result contains ordered items, the next opaque cursor, and an optional ordering version. The controller validates the cursor relationship, ignores a stale generation, deduplicates by item identity, and never derives a next cursor from list length.

### A query change through the loader
1. **Observe intent:** IntersectionObserver is a prefetch hint; the visible Load More button invokes the same admission path.
2. **Admit once:** Reject repeat requests for a cursor already pending or committed.
3. **Merge safely:** Validate the generation, normalize entities, append unseen IDs, and advance only after a successful page.
4. **Restore context:** After navigation or variable-height measurement, mount the anchor and restore its intra-item offset.

```typescript
type PageRequest = {
  queryKey: string;
  filters: Readonly<Record<string, string | readonly string[]>>;
  sort: string;
  limit: number;
  cursor?: string;
  signal: AbortSignal;
};

type PageResult<T> = {
  items: readonly T[];
  nextCursor?: string;
  orderingVersion?: string;
};

interface PageLoader<T> {
  load(input: PageRequest): Promise<PageResult<T>>;
}
```

## Final interview close

Use one query-aware `PageLoader`, commit every opaque cursor atomically with its page, reject stale generations, and preserve an identity-based scroll anchor. Begin with a semantic list and add windowing only when representative measurements justify its focus and restoration costs.

## Technical references

- [MDN IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) — Observer semantics and asynchronous visibility changes.
- [W3C ARIA feed pattern](https://www.w3.org/WAI/ARIA/apg/patterns/feed/) — Keyboard and loading considerations for progressively loaded article feeds.
