---
title: "Scalable Notifications Feed (Real-time)"
slug: "scalable-notifications-feed"
family: "system-design"
tech: "frontend"
audience: "Frontend engineers preparing for system design interviews"
intent: "Teach a concrete frontend architecture answer with explicit state, failure, accessibility, and rollout decisions."
target_words: 2400
primary_keyword: "real-time notifications feed frontend system design"
status: "converted"
notes_for_conversion:
  - "Keep the route, question ID, and access level stable."
  - "Keep backend execution out of scope; describe only UI-facing contracts."
  - "Maintain parity with the five shipped RADIO sections."
search_intent: "Prepare a frontend system design answer for Scalable Notifications Feed (Real-time)."
reader_promise: "The reader can explain the frontend state, architecture, interfaces, failure recovery, accessibility, and rollout decisions for Scalable Notifications Feed (Real-time)."
unique_angle: "Design a real-time notifications feed with resumable delivery, deduplication, unread semantics, burst batching, bounded storage, virtualization, and recovery."
what_this_adds_beyond_basics: "Adds an end-to-end worked example, state ownership, recovery, accessibility, and measurable rollout guidance for Scalable Notifications Feed (Real-time)."
competitor_query: "Scalable Notifications Feed (Real-time) frontend system design"
competitor_takeaways:
  - "Catalog pages commonly list components but stop before reconciliation and failure recovery."
  - "Reference material is strongest when it anchors browser behavior in official platform guidance."
competitor_gaps:
  - "A state transition is often described without showing the visible UI result or preserved invariant."
  - "Accessibility, mobile reflow, cancellation, and rollback are frequently treated as afterthoughts."
sources:
  - "https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events"
  - "https://www.w3.org/WAI/ARIA/apg/patterns/feed/"
last_fact_checked_at: "2026-07-28"
reviewed_by: "FrontendAtlas editorial migration"
confidence: "high"
---
# Prompt

real-time notifications feed frontend system design. Design a real-time notifications feed with resumable delivery, deduplication, unread semantics, burst batching, bounded storage, virtualization, and recovery.

## Requirements

Treat the feed as a projection of durable notification events. Clarify freshness, ordering, unread behavior, and device constraints before choosing transport or rendering details.

---

What you’re solving:
A scrollable notifications panel that receives real-time updates (potentially in bursts). You must render new items without freezing the UI, keep memory bounded, and ensure unread counts are correct even when the panel is closed.

Decision surface:
- Real-time subscription strategy (WebSocket/SSE/polling).
- Batching / buffering vs re-rendering per event.
- Virtualized list rendering for large feeds.
- Correct ordering, dedupe, and unread count logic.
- Resilience to reconnects and bursts.

### Scope before transport

Define volume, unread semantics, ordering guarantees, resume behavior, and list size before selecting SSE, WebSocket, or polling. The client boundary separates event ingestion, normalized state, and rendering so a burst can become one bounded update instead of one render per event.

---

### High-level user flow
1. **1) User opens notifications:** Load initial batch (latest N) from REST. Establish a live connection (WebSocket/SSE).
2. **2) Stream starts:** Incoming events go into a short buffer/queue (not directly to UI).
3. **3) Batch apply:** Merge a burst in one measured store transaction; derive unread from accepted sequence positions and the read marker, never render cadence.
4. **4) Render efficiently:** UI reads from a bounded list (e.g., last 500). Use virtualization so DOM stays small.
5. **5) Panel closed:** Stop list paints; continue reducing authoritative events and derive the badge from accepted entities plus the read marker.
6. **6) Reconnect & recovery:** If the socket drops, reconnect with backoff and fetch deltas since last cursor.

### Clarifying questions
- How many notifications per minute at peak?
- Is strict ordering required, or is eventual ordering acceptable?
- How long should items stay in the client list (last 200/500/1000)?
- Is this a global feed or per-user feed?
- Do we need read receipts synced to server?
- Should we show a real-time badge when the panel is closed?
- Are there priority levels (mentions vs likes) that affect rendering?

### Non-functional expectations
- Avoid re-render per event (batch + throttle).
- DOM size is bounded (virtualization + trimming).
- Smooth scroll performance under heavy load.
- Stable behavior with flaky networks.
- Graceful handling of bursts (backpressure).
- INP <= 200ms for panel interactions.

- **Batch policy:** Measured burst coalescing
- **DOM cap:** 500-1000 items
- **Interaction budget:** <= 200ms

---

### Explicit assumptions
- Which surfaces share the read marker: header badge, open panel, background tab, or another device.
- Peak delivery burst, snapshot size, and resume-window guarantees.
- Whether mark-read advances through one contiguous sequence or explicit notification IDs.
- Freshness behavior when streaming degrades to polling or a cursor expires.

### Feed freshness and interaction measures
| Metric | Target | Why it matters |
| --- | --- | --- |
| Snapshot-to-useful-feed | Percentiles by cohort | Initial usefulness |
| INP | Field p75 by input | Responsive interaction |
| Frame delivery | Distribution and long tasks | Burst and scroll quality |

### Frontend boundary

The frontend owns stream adaptation, cursor resume, event deduplication, unread presentation, list ordering, bounded rendering, and connection status. Server-side notification production, fan-out, durable retention, and read-marker authority stay behind abstract snapshot, stream, and command contracts.

# Clarifying Questions

- Which user journey and input modes must Scalable Notifications Feed (Real-time) support first?
- Which state is authoritative, which state may be optimistic, and how is freshness represented?
- What ordering, identity, and version rules must survive retries or out-of-order responses?
- Which interactions must remain usable with keyboard, assistive technology, and narrow viewports?
- What should users see during loading, partial failure, cancellation, and recovery?
- Which performance budgets are hypotheses to measure rather than universal thresholds?

# Architecture

## Architecture / High-level design

---

Suggested framing:
A snapshot establishes ordered notification identities, an authoritative read marker, and a resume cursor. A stream adapter validates sequenced events, an idempotent reducer merges bursts, and selectors derive the badge and virtualized rows.

Boundary checks:
- Clear separation of ingest vs render.
- Bounded list + virtualization.
- Reconnect strategy and fallback.
- Event identity for replay dedupe, sequence for ordering, and an opaque cursor for resume.
- Backpressure / batching decisions.

### Snapshot-to-projection path

Snapshot + resumable stream -> validator -> ingest queue -> idempotent reducer -> normalized entities/read marker -> selectors -> virtualized list and badge.

---

### Core building blocks
| Piece | Responsibility | How you explain it |
| --- | --- | --- |
| Realtime source | Push notifications to the client (WS/SSE/polling). | Prefer WebSocket/SSE for push. Polling is fallback when sockets fail. |
| Ingest buffer | Short queue for incoming events. | Buffer events to batch UI updates and handle bursts. |
| Scheduler | Coalesces store commits. | It preserves every accepted event identity and sequence while controlling render frequency. |
| Feed store | Owns entities, order, cursor, and read marker. | Unread derives from accepted positions and the authoritative marker. |
| Virtualized list | Renders only visible rows. | Keeps DOM size small even if the feed contains hundreds/thousands. |

---

### Panel open vs closed
1. **Panel open:** Render the virtualized list, batch accepted events, and project unread from entities plus the confirmed marker.
2. **Panel closed:** Stop list paints, continue reducing authoritative events, and derive the badge from entities plus the marker.

Important: ingestion can be much faster than rendering. The scheduler is what keeps the UI stable.

---

### Delivery, state, and projection boundaries
| Boundary | Reason |
| --- | --- |
| Transport adapter vs reducer | Protocol frames become validated variants before normalized state changes |
| Entity positions vs read marker | Unread derives from accepted sequence positions rather than render timing |
| Normalized store vs feed projection | Filters, panel visibility, and virtualization never mutate notification authority |

### Ordered notification projection

Make the notification path explicit: snapshot and resumable events enter one reducer, normalized entities and read markers produce a bounded visible feed, and components subscribe to stable selectors.

### Worked example: reconnect across an unread boundary

The panel last reduced cursor c120 and the member read through notification n118. While offline, the server emits n121 through n124. Reconnect may replay n120 and deliver the new events in a burst.

### Scenario walkthrough
| Event | Store change | Visible UI | Invariant |
| --- | --- | --- | --- |
| Connection drops | Keep entities and read boundary; mark freshness stale. | The existing feed remains usable. | Loss of transport does not erase evidence. |
| Resume from c120 | Open one stream with the last safely reduced cursor. | Show reconnecting without a blocking spinner. | Cursor advances only after reduction. |
| Replay n120 arrives | Ignore the known event identity. | Counts and rows do not change. | Replay is idempotent. |
| n121 to n124 arrive | Batch normalize, order by server sequence, then compute unread from the stable boundary. | One update and a concise new-items affordance appear. | Unread does not depend on render timing. |

# Tradeoffs

The central tradeoff is Design a real-time notifications feed with resumable delivery, deduplication, unread semantics, burst batching, bounded storage, virtualization, and recovery. The preferred design keeps browser-owned state explicit and treats server behavior as a UI-facing contract. A different rendering or state strategy is justified only when measured interaction cost, device constraints, or collaboration requirements change the evidence.

## Data model

Your data model should include notification entities, feed state, and cursor/unread tracking so the UI can stay in sync across sessions and reconnects.

---

```ts
type NotificationItem = {
  id: string;
  sequence: number;
  kind: 'mention' | 'comment' | 'system';
  title?: string;
  text: string;
  createdAt: string;
  actor?: { id: string; name: string; avatarUrl?: string };
  link?: string;
};

type ReadMarker = {
  lastReadSequence: number;
  version: number;
};

type FeedState = {
  entities: Record<string, NotificationItem>;
  orderedIds: string[];
  receivedEventIds: Set<string>;
  contiguousSequence: number;
  resumeCursor: string | null;
  readMarker: ReadMarker;
  freshness: 'fresh' | 'reconnecting' | 'stale';
  gapAfterSequence: number | null;
};

```

---

### Fields that matter
- id: dedupe across reconnects
- sequence: canonical ordering and gap detection
- createdAt: display metadata
- kind: safe presentation and filtering (mentions vs system)
- link: deep-link into the product

### Tracked client state
- read marker for derived unread state
- opaque resumeCursor plus contiguous sequence
- payload and rendered-row bounds
- connection + error state
- in-flight buffer size (for backpressure)

A resume cursor is an opaque transport token, not a timestamp or notification ID. Advance it only after accepting a contiguous range.

### Notification identity, cursor, and read-marker ownership

Store notification entities, ordered IDs, received event IDs, contiguous cursor, read boundary, and freshness separately. Unread count is derived from authoritative notification position and the user read marker, not incremented blindly per transport frame. View state tracks filters, panel visibility, and anchor identity.

### Client model
| Record | Key fields | Owner |
| --- | --- | --- |
| NotificationItem | id, sequence, kind, createdAt, read eligibility | Entity store |
| StreamState | cursor, received IDs, gap, freshness | Connection store |
| ReadMarker | lastReadSequence, pending command | Versioned user state |
| FeedView | filters, anchorId, visible range | Local view |

### Unread semantics across surfaces

Unread is a relationship between an ordered notification position and a versioned read marker, not a counter that increments whenever transport data arrives. The header badge, open panel, background tab, and another device may observe the same event at different times. Derive counts from accepted entities and the confirmed marker, overlay a pending mark-read command separately, and converge when a newer marker arrives. Deleting or filtering a notification does not automatically mean it was read.

# Failure Modes

## Optimizations and deep dive

The deep dive is about protecting UI performance under heavy streams. Mention batching, virtualization, and backpressure as first-class strategies.

---

### Optimization levers
| Problem | Technique | Why it helps |
| --- | --- | --- |
| Re-render storm | Measured burst coalescing | Coalesces store commits without changing event semantics. |
| Huge DOM | Virtualized list + windowing | Only renders visible rows, keeps DOM small. |
| Unbounded memory | Trim to last N items / time window | Prevents feed from growing forever. |
| Burst load | Bound queue plus gap recovery | Refreshes from delta or snapshot rather than losing authoritative events. |
| Main-thread jank | Throttle progress and use rAF | Keeps scrolling and input responsive. |

---

### Performance best practices
- Use requestAnimationFrame for UI updates when visible.
- Memoize row components; avoid rerendering unchanged rows.
- Use stable keys and avoid re-sorting large arrays on every tick.
- Compute unread count incrementally, not by scanning whole list.
- Pause list rendering when the panel is closed.

### Failure / recovery strategies
- Exponential backoff + jitter on reconnect.
- Fetch missed notifications using cursor or timestamp.
- Fallback to polling when sockets are blocked.
- Surface a subtle banner when realtime is degraded.

- **Interaction budget:** <= 200ms
- **Batch cadence:** Measured from freshness and rendering evidence
- **DOM cap:** 500-1000

### Common pitfalls

A notification burst should become one bounded store commit. Blind unread increments, perpetual retention, and a full timeline sort on every event create both correctness and responsiveness failures.

---

### Keeping notification bursts responsive without losing events
1. **1) Batch updates:** Schedule one store commit for a burst when profiling shows per-event commits are expensive; the reducer still processes every accepted event.
2. **2) Bound row rendering:** Virtualize notification rows while retaining normalized identities, cursor evidence, and the reader's anchor.
3. **3) Cancel stale work:** Abort prefetches or network work when user intent changes.
4. **4) Measure:** Log LCP/INP and feature-specific KPIs to validate rollout.

### Resume, marker, and burst recovery

### Failure modes
| Failure | Response | Invariant |
| --- | --- | --- |
| Cursor expires | Fetch a new snapshot and preserve selection by notification ID. | The feed recovers without duplicate rows. |
| Sequence gap persists | Pause cursor advancement and request a delta or snapshot. | Known content stays visible but stale. |
| Read marker conflicts | Merge the newer server marker and clear stale local intent. | Unread converges across devices. |
| Burst exceeds render budget | Batch store notification and window the measured list. | Ingestion does not force one render per event. |

### Accessibility behavior

Use a named feed or list, meaningful notification headings, and explicit read controls. New events do not move focus or auto-scroll a reader away from the current position. Announce a grouped count or connection transition instead of each burst item, and keep retry and Load More keyboard operable.

### Rollout and measurement

Begin with snapshots and polling, verify unread semantics, then enable resumable streaming for a cohort. Track duplicate rejection, gaps, unread corrections, reconnect duration, render batches, anchor movement, and assistive-technology announcement volume.

### Technical references
- [MDN Server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) — One-way event-stream behavior and browser API.
- [W3C ARIA feed pattern](https://www.w3.org/WAI/ARIA/apg/patterns/feed/) — Progressively loaded feed semantics and keyboard considerations.

### Memory and privacy boundaries

Bound recent entities, received-event identity history, and rendered rows according to the snapshot and resume contract. Payload details that are no longer needed can be evicted while compact ordering and marker metadata remain. Notification text can contain personal data, so telemetry records event class, timing, and reducer outcome rather than message content. Browser storage is optional and scoped by account; signing out clears user-specific cached data before another session can read it.

Notification importance must not be inferred from arrival frequency. A quiet security event may deserve a persistent surface while a large batch of low-priority updates may collapse into one summary. Keep delivery state, read state, and presentation urgency separate so reconnects cannot replay alerts or mark unseen items as read. If the active filter excludes a new item, update the relevant count without moving the reader's anchor.

# Metrics

Measure task completion and recovery before optimizing isolated rendering numbers. Track time to first useful UI, interaction latency by input mode, request and mutation failure rates, stale-response suppressions, retry outcomes, focus-restoration failures, layout overflow, and accessibility regressions. Segment field results by device capability, network class, viewport, and reduced-motion preference. Numeric targets begin as testable budgets and should be revised from production distributions.

# Rollout

Ship the smallest client slice that preserves identity, cancellation, recovery, accessibility, and observability. Validate the UI-facing contracts with deterministic fixtures, release behind a feature flag where appropriate, compare user outcomes and error distributions, and expand only after the failure and rollback paths have been exercised.

## Interface definition (API)

Define a small client‑side API that the rest of the app can use. It should support subscribe, mark read, and filters, without exposing internal buffering details.

---

```ts
type NotificationEventEnvelope = {
  schemaVersion: 1;
  eventId: string;
  sequence: number;
  cursor: string;
};

type NotificationEvent =
  | (NotificationEventEnvelope & {
      type: 'notification.upserted';
      notification: NotificationItem;
    })
  | (NotificationEventEnvelope & {
      type: 'notification.removed';
      notificationId: string;
    })
  | (NotificationEventEnvelope & {
      type: 'read-marker.updated';
      readMarker: ReadMarker;
    });

type NotificationsSnapshot = {
  schemaVersion: 1;
  notifications: NotificationItem[];
  readMarker: ReadMarker;
  contiguousSequence: number;
  resumeCursor: string;
  nextPageCursor?: string;
};

interface NotificationsClient {
  getSnapshot(input: { pageCursor?: string; signal: AbortSignal }): Promise<NotificationsSnapshot>;
  subscribe(input: {
    resumeCursor: string;
    onEvent: (event: NotificationEvent) => void;
    onGap: (afterSequence: number) => void;
  }): () => void;
  markRead(input: {
    throughSequence: number;
    basedOnMarkerVersion: number;
    commandId: string;
    signal: AbortSignal;
  }): Promise<ReadMarker>;
}
```

---

### Notification-client behavior
- Subscription returns an unsubscribe cleanup fn.
- Live stream only pushes deltas, not full list.
- markRead overlays one pending marker command and reconciles the returned marker version.
- Filters should not mutate the raw store (derive view).

### Error and reconnect behavior
- Reconnect with exponential backoff.
- On reconnect, resume from the last safely reduced cursor and repair gaps before advancing it.
- If stream unavailable, fall back to polling.

### UI-facing contract

The snapshot supplies ordered notifications, read marker, contiguous cursor, and optional next-page cursor. Each stream variant carries exactly its required payload: an upsert has a notification, a removal has notificationId, and a read-marker update has readMarker. Mark-read is an idempotent command with a version precondition. Components receive normalized selectors and never interpret transport frames directly.

### From snapshot to converged unread state
1. **Load snapshot:** Validate and normalize one coherent base before opening the stream.
2. **Resume:** Connect from the last reduced cursor and expose freshness.
3. **Reduce:** Ignore duplicates, detect gaps, and merge a burst in one store transaction.
4. **Read:** Advance the marker only from explicit policy and reconcile cross-device versions.

### Snapshot and command compatibility

Version the envelope rather than making components branch on endpoint generations. Unknown optional notification kinds render a generic safe row; an unsupported required envelope version triggers a snapshot fallback. Mark-read accepts a highest contiguous sequence or explicit IDs according to product semantics and returns the authoritative marker version. The stream can confirm the same command before or after the HTTP response, so both paths reduce through one reconciliation function.
