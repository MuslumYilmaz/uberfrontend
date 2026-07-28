---
title: "Netflix Continue Watching Frontend System Design"
slug: "netflix-scale-expansion"
family: "system-design"
tech: "frontend"
audience: "Frontend engineers preparing for system design interviews"
intent: "Teach a concrete frontend architecture answer with explicit state, failure, accessibility, and rollout decisions."
target_words: 2400
primary_keyword: "Netflix Continue Watching frontend system design"
status: "converted"
notes_for_conversion:
  - "Keep the route, question ID, and access level stable."
  - "Keep backend execution out of scope; describe only UI-facing contracts."
  - "Maintain parity with the five shipped RADIO sections."
search_intent: "Prepare a frontend system design answer for a cross-device Continue Watching carousel."
reader_promise: "The reader can explain state ownership, progress reconciliation, focus navigation, media loading, failure recovery, and rollout for a Continue Watching row."
unique_angle: "Treat cross-device progress and row removal as versioned client reconciliation problems while preserving spatial focus."
what_this_adds_beyond_basics: "Adds an end-to-end worked example, state ownership, recovery, accessibility, and measurable rollout guidance for Netflix Continue Watching Frontend System Design."
competitor_query: "Netflix Continue Watching Frontend System Design frontend system design"
competitor_takeaways:
  - "Catalog pages commonly list components but stop before reconciliation and failure recovery."
  - "Reference material is strongest when it anchors browser behavior in official platform guidance."
competitor_gaps:
  - "A state transition is often described without showing the visible UI result or preserved invariant."
  - "Accessibility, mobile reflow, cancellation, and rollback are frequently treated as afterthoughts."
sources:
  - "https://help.netflix.com/en/node/115312"
  - "https://www.w3.org/WAI/ARIA/apg/patterns/carousel/"
  - "https://web.dev/articles/vitals"
last_fact_checked_at: "2026-07-28"
reviewed_by: "FrontendAtlas editorial migration"
confidence: "high"
---
# Prompt

Netflix Continue Watching frontend system design. Design a resilient Continue Watching row across web, mobile, and TV with progress reconciliation, focus-safe actions, media loading, and measurable performance.

## Requirements and device scope

### Representative product scenario

This is a FrontendAtlas practice case based on a public Netflix product behavior. It is not presented as a confirmed or leaked Netflix interview question.

Design the browser and device UI for a Continue Watching row. A signed-in member sees partially watched titles, resumes from trustworthy progress, removes a title from the row, and moves through cards with pointer, touch, remote control, or keyboard. The same conceptual feature appears on desktop, mobile, and TV-like layouts, but input model, memory, viewport size, and content density differ. The backend recommendation service and media pipeline remain abstract service contracts; the design covers the frontend state, rendering, commands, and observable user experience.

### Clarify behavior before architecture

### Product decisions to lock
| Question | Starting assumption | Why it changes the frontend |
| --- | --- | --- |
| What is in the row? | Titles with resumable progress, ordered by a server-provided rank. | The client preserves server order and does not invent ranking. |
| Which actions exist? | Open details, resume playback, and remove from row. | Removal needs optimistic feedback plus server reconciliation. |
| How fresh is progress? | The initial payload may be cached and a fresher revision can arrive. | Each title needs a versioned progress field rather than last-response-wins. |
| Which devices matter? | Pointer and touch clients plus a TV-like directional focus environment. | Focus position and scroll anchor become explicit UI state. |
| What is out of scope? | Recommendation ranking, video encoding, DRM, and playback engine internals. | Only UI-facing contracts are discussed. |

### Functional requirements

### Member experience
- Render the row from a compact initial payload without shifting the surrounding page when posters load.
- Show useful progress and resume labels while treating server revisions as authoritative.
- Support previous and next controls, touch scrolling, pointer selection, keyboard navigation, and directional remote-style focus.
- Open a details or playback destination without losing the row position when the user returns.
- Remove a title with immediate visual feedback, undo when product policy allows it, and reconcile conflicts without silently restoring focus to the page start.
- Represent loading, partial data, empty row, unavailable artwork, stale progress, action failure, and signed-out states.
- Adapt card count, metadata density, image resolution, and interaction hints to device capability and available width.
- Preserve translated titles, bidirectional text, large text, reduced motion, and long locale strings without clipping.

### Quality attributes

Performance is evaluated with field evidence, not a universal device promise. Core Web Vitals can be tracked at the seventy-fifth percentile by device class, while the feature adds time to first usable row, poster success rate, focus-navigation latency, dropped-frame observations, and action reconciliation rate. The row should remain usable before every image arrives, keep memory bounded during long browsing sessions, cancel media work that no longer matches user intent, and avoid rerendering unaffected cards when one progress record changes.

### Starting measurement budgets
| Signal | Initial budget | Interpretation |
| --- | --- | --- |
| LCP and INP | Use current Web Vitals guidance at p75 | Segment field data by device class and connection instead of claiming every session passes. |
| First usable row | Define from navigation start until cards accept focus or touch | Measure the feature directly because page-level LCP may describe another element. |
| Interaction frames | Profile scroll and focus movement on representative hardware | A high-refresh display and a low-power TV do not share one fixed frame budget. |
| Memory | Bound decoded images and detached card nodes | Use device telemetry to choose cache and overscan limits. |

### Requirement checkpoint

A complete answer names the authoritative fields, device-specific interaction model, optimistic action boundary, restoration behavior, and field metrics before choosing frameworks or separate frontend deployments.

# Clarifying Questions

- Which user journey and input modes must Netflix Continue Watching Frontend System Design support first?
- Which state is authoritative, which state may be optimistic, and how is freshness represented?
- What ordering, identity, and version rules must survive retries or out-of-order responses?
- Which interactions must remain usable with keyboard, assistive technology, and narrow screen widths?
- What should users see during loading, partial failure, cancellation, and recovery?
- Which performance budgets are hypotheses to measure rather than universal thresholds?

# Architecture

## Architecture / High-level design

Use a feature boundary that can live inside the existing home-page shell. Independent deployment is optional, not the starting goal. The important boundary is behavioral: a row controller obtains UI-facing data, a normalized store owns authoritative entities, a viewport renders visible cards, a media manager schedules artwork, and an action coordinator reconciles member commands. Components read selectors and emit intents; they do not call unrelated services or mutate cached entities directly.

```text
Home shell
└─ ContinueWatchingFeature
   ├─ RowController ── UI data adapter
   ├─ NormalizedStore ── progress + row revisions
   ├─ CarouselViewport ── cards + spatial focus
   ├─ MediaPreloadManager ── poster priority + cancellation
   ├─ ActionCoordinator ── remove/resume reconciliation
   └─ FeatureTelemetry ── field performance + outcome signals
```

### Client boundaries
| Boundary | Owns | Does not own |
| --- | --- | --- |
| UI data adapter | Request cancellation, validation, response mapping, and cache headers | Card focus or optimistic labels |
| Normalized store | Rows, title cards, progress revisions, and mutation overlays | Decoded image resources |
| Carousel viewport | Visible range, scroll anchor, focus identity, and semantic controls | Ranking or server persistence |
| Media preload manager | Priority, deduplication, cancellation, and decoded-image budget | Member progress |
| Action coordinator | Idempotency keys, pending commands, conflicts, rollback, and messages | Fabricating successful server state |
| Telemetry | Feature timings, errors, reconciliation outcomes, and experiment dimensions | Personal content in log payloads |

### Read, render, and restore

### Initial and returning navigation
1. **Read cached shell data:** Render validated summaries when available, mark their freshness, and reserve stable poster geometry.
2. **Request the row contract:** Send locale and supported capability hints; abort when profile, route, or row identity changes.
3. **Normalize by identity:** Merge row ordering separately from title and progress entities so one progress update touches one card.
4. **Render the useful window:** Mount the visible cards and modest measured overscan; schedule nearby artwork after the first useful cards.
5. **Restore member context:** On back navigation, restore the row anchor and selected title if it still exists, otherwise choose the nearest meaningful card.

### Worked example: stale progress and optimistic removal

```text
row_rev_20
├─ title_a  progress 43% rev 8
├─ title_b  progress 12% rev 3  ← focused
└─ title_c  progress 77% rev 6

fresh delta: title_a progress 51% rev 9
local command: remove title_b, based on row_rev_20
server response: conflict, row_rev_21 still contains title_b
```

### One action through store and UI
| Event | Store change | Visible result | Invariant |
| --- | --- | --- | --- |
| Cached row opens | Store title A at 43% with progress revision 8. | Cards become usable immediately and stale freshness is visible only where helpful. | A cached value is evidence, not permanent truth. |
| Fresh progress arrives | Merge 51% only because revision 9 is newer. | Title A updates without rerendering unrelated cards or stealing focus. | Field revision wins over response arrival order. |
| Member removes focused title B | Add a pending removal overlay with an idempotency key; preserve the base entity. | Title B collapses and focus moves to the nearest surviving card with a pending status message. | Responsive feedback does not fabricate server success. |
| Server reports row revision 21 conflict | Clear the overlay, merge the authoritative order, and retain the command error. | Title B returns in its server position; focus moves to it or a clear recovery message depending on current navigation. | Server revision wins while spatial context remains meaningful. |
| Member retries | Create a new command key against row revision 21. | Controls remain usable and duplicate responses converge on one mutation record. | Retries do not double-apply a removal. |

### Responsive and accessible composition

On desktop, native links or buttons inside a horizontally scrollable region are usually easier to operate than inventing a composite widget. On a TV-like surface where directional focus is the primary input, use an explicit spatial-navigation controller that tracks item identity rather than DOM index. Previous and next buttons remain named controls. Do not auto-rotate the row. When virtualization removes offscreen cards, restore focus only after the destination card is mounted. Reduced motion disables decorative scaling and smooth-scroll choreography without removing progress or selection feedback.

### Keep the branded case frontend-scoped

Separate frontend deployments, a global store, or a virtualizer are not automatically required by audience size. Choose each after team ownership, state sharing, DOM cost, and target-device profiling demonstrate the need.

# Tradeoffs

The central tradeoff is Treat cross-device progress and row removal as versioned client reconciliation problems while preserving spatial focus. The preferred design keeps browser-owned state explicit and treats server behavior as a UI-facing contract. A different rendering or state strategy is justified only when measured interaction cost, device constraints, or collaboration requirements change the evidence.

## Data model

Separate durable server facts from transient interaction state and optimistic overlays. Row order is a versioned server fact. A card contains display metadata and references progress by title identity. Focus, visible range, and pending commands are client state. Keeping these layers separate lets a failed command disappear without reconstructing the server snapshot and lets a progress delta update one entity without replacing the row.

```typescript
type Id = string;

type ArtworkCandidate = {
  url: string;
  width: number;
  height: number;
  format: 'avif' | 'webp' | 'jpeg';
};

interface ContinueWatchingRow {
  id: Id;
  titleIds: Id[];
  revision: number;
  fetchedAt: string;
  nextCursor?: string;
}

interface TitleCard {
  id: Id;
  name: string;
  artwork: ArtworkCandidate[];
  resumeTarget: string;
  maturity?: string;
  runtimeSeconds?: number;
}

interface WatchProgress {
  titleId: Id;
  positionSeconds: number;
  durationSeconds: number;
  completed: boolean;
  revision: number;
  updatedAt: string;
}

interface RowViewState {
  focusedTitleId?: Id;
  anchorTitleId?: Id;
  visibleStart: number;
  visibleEnd: number;
  inputMode: 'pointer' | 'touch' | 'keyboard' | 'spatial';
}

interface PendingRemoval {
  commandId: string;
  titleId: Id;
  basedOnRowRevision: number;
  phase: 'sending' | 'conflicted' | 'failed';
}

interface ContinueWatchingState {
  rowsById: Record<Id, ContinueWatchingRow>;
  titlesById: Record<Id, TitleCard>;
  progressByTitleId: Record<Id, WatchProgress>;
  viewByRowId: Record<Id, RowViewState>;
  removalByTitleId: Record<Id, PendingRemoval>;
}
```

### Ownership and merge policy
| State | Authority | Merge rule | Persistence |
| --- | --- | --- | --- |
| Row order | Server row revision | Accept only a newer complete revision or a valid delta based on the current revision. | Query cache |
| Watch progress | Per-title server revision | Merge independently so a late row response cannot lower fresh progress. | Query cache |
| Pending removal | Local intent until acknowledged | Overlay the base row; clear on success, conflict, or terminal error. | Memory, optionally short-lived session recovery |
| Focus and anchor | Current client session | Keep identity, then derive the nearest valid position after row changes. | Navigation state |
| Decoded poster | Media manager | Deduplicate by candidate URL and evict by measured memory policy. | Browser cache plus bounded memory |
| Experiment assignment | Server-provided stable assignment | Do not switch the visible variant midway through one page session. | Request or session scope |

### Derived state

The visible title IDs are derived from the authoritative row order minus sending removals. Progress percentage is clamped for display but the raw seconds and revision remain available for resume behavior and diagnostics. Artwork candidates are selected from rendered size, pixel density, format support, and network policy; the selected URL is not duplicated into every view object. A card is considered interactive when its title identity and destination are valid, even if artwork has failed.

### Data invariants
- One title identity maps to one title entity within the active profile scope.
- Progress never moves backward solely because an older response arrived later.
- A pending command never overwrites the authoritative row revision.
- Focus is stored by identity and never by a fragile array index alone.
- Large image bytes and decoded bitmaps are not placed in application state.
- Profile, locale, maturity permissions, and experiment assignment participate in cache isolation.
- Telemetry excludes title names and personal viewing details unless an approved measurement contract explicitly requires them.

### Why normalization helps here

Normalization is justified by independent progress deltas, cross-row title reuse, and targeted subscriptions. If a smaller product has one static row and no deltas, a query result plus local view state can be simpler.

# Failure Modes

## Optimizations for resilience, performance, and accessibility

### Failure and recovery

### Failure modes
| Failure | User-visible response | Recovery |
| --- | --- | --- |
| Row request is slow | Keep a validated cached row or stable skeleton geometry; do not block the whole home page. | Retry with backoff only while the route and profile remain active. |
| Poster fails | Show a branded neutral placeholder and keep the title control operable. | Try a lower-cost candidate only when the failure policy permits it. |
| Progress response is stale | Keep the newer per-title revision already in the store. | Record the rejected revision and request a focused refresh if gaps persist. |
| Removal is resolved elsewhere | Merge the newer row, clear local pending state, and announce the outcome once. | Restore focus by title identity or nearest surviving neighbor. |
| Authentication expires | Disable member-specific actions and show a non-destructive sign-in path. | After sign-in succeeds again, reload under the new profile scope. |
| Low-memory device evicts media | Cards retain dimensions and labels while artwork reloads. | Reduce preload distance and decoded-image retention based on observed pressure. |
| Locale text overflows | Allow intentional wrapping or truncation with an accessible full name. | Test long translations, bidirectional text, and enlarged text in CI. |
| Experiment configuration disagrees | Keep the page-session assignment stable rather than flickering variants. | Refresh the assignment on the next safe navigation boundary. |

### Measured rendering strategy

A typical Continue Watching row is not automatically large enough to justify virtualization. Start with semantic controls and lazy artwork. Profile DOM count, focus-navigation cost, decoded-image memory, and return-navigation behavior on representative TV and mobile hardware. Introduce windowing only when measured limits require it, because unmounting cards complicates accessibility, browser find behavior, focus restoration, and image reuse. When windowing is justified, overscan in the direction of travel and pin the focused item until focus moves safely.

### Media and render priorities
- Reserve aspect-ratio geometry before artwork loads to protect layout stability.
- Fetch the first useful visible images before speculative offscreen candidates.
- Cancel obsolete requests when profile, route, size class, or travel direction changes.
- Decode near-future artwork without retaining every decoded bitmap from a long session.
- Subscribe cards to their own title and progress entities instead of the entire row object.
- Avoid decorative hover scaling as the only focus indicator; provide a durable visible focus style.
- Treat smooth scrolling and animation as optional presentation that respects reduced-motion preferences.

### Accessibility and input

Give the region a visible heading and accessible name. Previous and next controls use native buttons with action-oriented labels. Each title is a link or button with a useful title and progress label; decorative artwork gets empty alternative text when the control name already communicates the title. Do not auto-rotate. On pointer and keyboard web layouts, preserve normal Tab behavior and avoid forcing every card into an ARIA carousel pattern. On spatial-focus platforms, arrow movement, row boundaries, focus persistence, and escape behavior are explicit and tested. Status announcements are limited to meaningful action outcomes rather than every progress update.

### Rollout and diagnosis

### Safe release sequence
1. **Instrument the current row:** Establish field baselines for first usable row, artwork failures, focus movement, removals, and return-navigation restoration.
2. **Ship contract compatibility:** Validate old and new payload revisions, malformed records, and unknown optional fields before changing presentation.
3. **Canary by capability:** Start with a controlled device and app cohort so low-memory, spatial-focus, and touch regressions remain separable.
4. **Compare user outcomes:** Watch resume success, removal conflict, abandonment, field Web Vitals, and error recovery rather than only request latency.
5. **Rollback presentation safely:** Keep compatible stored entities and disable only the new view or command path when its guardrails regress.

### Interview answer checkpoint

Be ready to defend five decisions: separate row and progress revisions, overlay rather than overwrite optimistic removal, restore focus by identity, schedule media by intent and capability, and gate rollout with field outcomes.

### Technical references
- [Netflix Help: remove titles from Continue Watching](https://help.netflix.com/en/node/115312) — Public product behavior across computers, TVs, and mobile devices.
- [W3C WAI-ARIA carousel pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) — Keyboard, control, labeling, and rotation guidance for carousel-like interfaces.
- [web.dev: Web Vitals](https://web.dev/articles/vitals) — Field measurement guidance and percentile context for LCP, INP, and CLS.

# Metrics

Measure task completion and recovery before optimizing isolated rendering numbers. Track time to first useful UI, interaction latency by input mode, request and mutation failure rates, stale-response suppressions, retry outcomes, focus-restoration failures, layout overflow, and accessibility regressions. Segment field results by device capability, network class, viewport, and reduced-motion preference. Numeric targets begin as testable budgets and should be revised from production distributions.

# Rollout

Ship the smallest client slice that preserves identity, cancellation, recovery, accessibility, and observability. Validate the UI-facing contracts with deterministic fixtures, release behind a feature flag where appropriate, compare user outcomes and error distributions, and expand only after the failure and rollback paths have been exercised.

## Interface contracts for the UI

The server endpoints are abstract contracts viewed from the client. They expose stable identity, explicit revisions, device-appropriate artwork candidates, and idempotent commands. They do not leak recommendation-service topology into components. Obsolete reads and media work are cancellable when route, profile, or intent changes. Once a destructive command may have reached the service, the action coordinator retains its identity until an idempotent retry, response, or refresh confirms the outcome.

```http
GET /ui/home/rows/continue-watching?profile=p_7&locale=en-US
If-None-Match: "cw-p7-20"

200 OK
ETag: "cw-p7-21"
{
  "row": {
    "id": "continue-watching",
    "revision": 21,
    "fetchedAt": "2026-07-28T08:30:05Z",
    "titleIds": ["title_a", "title_b", "title_c"]
  },
  "titles": [{
    "id": "title_a",
    "name": "Example title",
    "resumeTarget": "/watch/title_a",
    "artwork": [{
      "url": "https://media.example/a-480.webp",
      "width": 480,
      "height": 270,
      "format": "webp"
    }]
  }],
  "progress": [{
    "titleId": "title_a",
    "positionSeconds": 1530,
    "durationSeconds": 3000,
    "completed": false,
    "revision": 9,
    "updatedAt": "2026-07-28T08:30:00Z"
  }]
}
```

```http
DELETE /ui/home/rows/continue-watching/items/title_b
Idempotency-Key: remove-2bd6
If-Match: "cw-p7-21"

200 OK
{
  "rowRevision": 22,
  "removedTitleId": "title_b"
}

409 Conflict
{
  "code": "ROW_REVISION_CHANGED",
  "currentRowRevision": 22,
  "message": "The row changed on another device."
}
```

```typescript
type DeviceCapabilities = {
  viewportWidthPx: number;
  devicePixelRatio: number;
  inputMode: RowViewState['inputMode'];
  supportedImageFormats: readonly ArtworkCandidate['format'][];
};

type ContinueWatchingPayload = {
  row: ContinueWatchingRow;
  titles: readonly TitleCard[];
  progress: readonly WatchProgress[];
  etag?: string;
};

type RemoveTitleResult =
  | { status: 'removed'; rowRevision: number; removedTitleId: string }
  | { status: 'conflict'; currentRowRevision: number };

interface ContinueWatchingClient {
  loadRow(input: {
    profileId: string;
    locale: string;
    capabilities: DeviceCapabilities;
    signal: AbortSignal;
  }): Promise<ContinueWatchingPayload>;

  removeTitle(input: {
    rowId: string;
    titleId: string;
    basedOnRevision: number;
    idempotencyKey: string;
  }): Promise<RemoveTitleResult>;
}
```

### Contract choices
| Choice | Frontend benefit | Failure behavior |
| --- | --- | --- |
| Row and progress revisions | Different facts can reconcile independently. | A stale response is ignored or triggers a focused refetch. |
| ETag and conditional load | A returning view can validate cached data cheaply. | A missing cache simply receives a complete payload. |
| Idempotency key | A lost response can be retried without removing another item. | The same key resolves to the same command outcome. |
| If-Match precondition | Conflicting cross-device changes are explicit. | The client fetches or accepts the newer row and explains the conflict. |
| AbortSignal for reads and media | Obsolete row and artwork work releases resources. | A dispatched removal stays tracked by idempotency key instead of being mistaken for a cancelled product action. |
| Capability hints | The payload can avoid obviously unsuitable assets. | The UI still has a safe generic candidate fallback. |

### Error semantics

Authentication failure transitions the feature to a signed-out or profile-unavailable state instead of retrying forever. A revision conflict is recoverable and distinct from validation or permission failure. Network uncertainty keeps the base row visible and labels the command outcome as unknown until an idempotent retry or refresh resolves it. Invalid individual title records are quarantined so one malformed card does not remove the entire row. The client records contract violations without rendering raw server details to the member.

### Avoid endpoint-shaped components

A card should receive a render-ready title identity and callbacks. It should not know URLs, ETags, idempotency keys, or revision conflict codes.
