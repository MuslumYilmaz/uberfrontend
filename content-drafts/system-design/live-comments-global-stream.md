---
title: "Live Comments for Global Streams (Real-time)"
slug: "live-comments-global-stream"
family: "system-design"
tech: "frontend"
audience: "Frontend engineers preparing for system design interviews"
intent: "Teach a concrete frontend architecture answer with explicit state, failure, accessibility, and rollout decisions."
target_words: 2400
primary_keyword: "live comments stream frontend system design"
status: "converted"
notes_for_conversion:
  - "Keep the route, question ID, and access level stable."
  - "Keep backend execution out of scope; describe only UI-facing contracts."
  - "Maintain parity with the five shipped RADIO sections."
search_intent: "Prepare a frontend system design answer for Live Comments for Global Streams (Real-time)."
reader_promise: "The reader can explain the frontend state, architecture, interfaces, failure recovery, accessibility, and rollout decisions for Live Comments for Global Streams (Real-time)."
unique_angle: "Design a live-comment stream with ordered resumable events, moderation-aware rendering, burst control, readable auto-follow behavior, and accessible interaction."
what_this_adds_beyond_basics: "Adds an end-to-end worked example, state ownership, recovery, accessibility, and measurable rollout guidance for Live Comments for Global Streams (Real-time)."
competitor_query: "Live Comments for Global Streams (Real-time) frontend system design"
competitor_takeaways:
  - "Catalog pages commonly list components but stop before reconciliation and failure recovery."
  - "Reference material is strongest when it anchors browser behavior in official platform guidance."
competitor_gaps:
  - "A state transition is often described without showing the visible UI result or preserved invariant."
  - "Accessibility, mobile reflow, cancellation, and rollback are frequently treated as afterthoughts."
sources:
  - "https://developer.mozilla.org/en-US/docs/Web/API/WebSocket"
  - "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/log_role"
last_fact_checked_at: "2026-07-28"
reviewed_by: "FrontendAtlas editorial migration"
confidence: "high"
---
# Prompt

live comments stream frontend system design. Design a live-comment stream with ordered resumable events, moderation-aware rendering, burst control, readable auto-follow behavior, and accessible interaction.

## Requirements

Design the browser side of a global live-comment stream that preserves resumable sequence order, moderation revisions, and the reader's follow-mode anchor during bursts.

### Use RADIO

Requirements define the audience, peak event shape, ordering and resume guarantees, follow-mode behavior, moderation authority, accessibility, and measurable success criteria.

---

What you are solving:
A real-time comment stream beside a live video. It must stay readable, ordered, and responsive during spikes (e.g., big moments), while supporting moderation and user interaction.

Decision surface:
- Real-time delivery (WebSocket/SSE)
- Buffering + batching to avoid re-render storms
- Virtualized list rendering
- Ordering + dedupe strategy
- Auto-scroll vs user scroll behavior
- Moderation UX and error handling

---

### User flow
1. **1) Open stream:** Load the latest N comments and establish a live connection.
2. **2) Ingest events:** Validate and reduce every authoritative event; coalesce store commits only enough to keep the interface responsive.
3. **3) Render safely:** Render a virtualized list and keep DOM size bounded.
4. **4) User scrolls:** Pause auto-scroll when the user scrolls up; show a “new comments” badge.
5. **5) Moderation:** Apply hide, mute, and removal updates without breaking sequence order, the reader's anchor, or the pending-new-comment count.

### Clarifying questions
- How many comments per second at peak?
- Strict ordering vs eventual ordering?
- Auto-scroll always on, or pause on user scroll?
- Do we show sender badges, avatars, emojis, GIFs?
- What moderation actions are required?
- Acceptable end-to-end delay (e.g., < 500ms)?
- Any slow-mode or rate-limit rules?

### Non-functional expectations
- Smooth scrolling under bursts, verified with field frame and long-task data.
- DOM size bounded via virtualization.
- Graceful fallback on slow networks.
- Consistent UX across devices.
- Observable latency + error metrics.

### Follow-mode UI states
| State | What the user sees | What you track |
| --- | --- | --- |
| Live | Auto-scrolls to newest comments | isLive, newestCommentId |
| Paused | User scrolled up; show “new comments” badge | isPaused, newCount |
| Disconnected | Banner + retry button | connectionState, retryCount |

- **End-to-end freshness:** Starting cohort hypothesis, revised from field data
- **Batch policy:** Measured from freshness and rendering evidence
- **DOM cap:** 500-1000 rows

### Critical trade-off

Lower latency means more frequent renders. You must justify batching and explain how you avoid re-render storms during spikes.

---

### Explicit assumptions
- Peak comment rate, burst duration, and how long sequence gaps remain repairable.
- Moderation states, revision ordering, and whether removed bodies become tombstones.
- Follow-mode policy when the reader scrolls away from the live edge.
- Composer slow mode, optimistic echo, and reconnect behavior on constrained devices.

### Stream readability measures
| Metric | Target | Why it matters |
| --- | --- | --- |
| Snapshot-to-readable-log | Percentiles by cohort | Initial usefulness |
| INP | Field p75 by input | Composer and follow controls |
| Frame and long-task distribution | Field percentiles by device cohort | Smooth scroll/animation |

---

### Follow, moderation, and recovery constraints
- Auto-scroll behavior when the user scrolls up.
- Visible new-items indicator or badge.
- Moderation actions that can remove items without breaking layout.
- Clear empty/error states.

### Frontend boundary

The browser owns stream resume, comment merge, moderation overlays, follow mode, viewport anchoring, bounded rendering, and composer feedback. Global distribution, authoritative moderation decisions, and durable comment storage stay behind abstract resumable event and command contracts.

# Clarifying Questions

- Which user journey and input modes must Live Comments for Global Streams (Real-time) support first?
- Which state is authoritative, which state may be optimistic, and how is freshness represented?
- What ordering, identity, and version rules must survive retries or out-of-order responses?
- Which interactions must remain usable with keyboard, assistive technology, and narrow viewports?
- What should users see during loading, partial failure, cancellation, and recovery?
- Which performance budgets are hypotheses to measure rather than universal thresholds?

# Architecture

## Architecture / High-level design

The architecture should prevent re-render storms while keeping comments near real time. Use a streaming transport, a client buffer, a scheduler, and a virtualized list to keep DOM size bounded.

---

Client architecture
- Comment stream manager (WebSocket/SSE)
- Buffer queue + batch scheduler
- Feed store (bounded list + dedupe)
- Virtualized list
- Moderation layer (mute/delete/report)

Delivery pipeline
- Real-time transport with reconnect
- Server-issued sequence for ordering and gap detection
- Backpressure signals when overwhelmed
- Optional slow-mode controls

### Snapshot-to-live projection

WS/SSE -> Buffer/Queue -> Scheduler -> CommentStore (bounded) -> VirtualizedList -> UI. Add a Moderation Filter between Store and UI.

---

### Architecture decisions to explain
| Decision | Why it matters |
| --- | --- |
| Batch window size | Balances latency vs render cost |
| Ordering policy | Controls UX consistency |
| Virtualization | Prevents DOM growth |
| Auto-scroll rules | Avoids fighting the user |

### High-level data flow
1. **1) Connect:** Open a WebSocket/SSE channel and load the latest N comments.
2. **2) Buffer:** Push incoming events into a short queue instead of rendering immediately.
3. **3) Batch apply:** Drain an accepted burst in one measured store transaction, preserving event identity, sequence, and gaps.
4. **4) Render:** Render a virtualized list of the latest N items, applying moderation filters.
5. **5) Recover:** Reconnect with backoff and fill gaps using cursor-based fetch.

### Persist before deriving the viewport

Buffering + virtualization is the difference between smooth UX and a frozen page when chat spikes.

---

### Stream and follow-mode boundaries
| Boundary | Reason |
| --- | --- |
| Stream validator vs timeline reducer | Only schema-valid, deduplicated events may advance the contiguous cursor |
| Timeline order vs follow mode | Accepted comments can update pending count without moving the reader's anchor |
| Authoritative moderation vs local mute | Server tombstones preserve revision while personal hiding remains a projection |

### Gap-aware comment projection

Make the comment path explicit: snapshot and live frames pass validation, deduplication, ordering, moderation, and follow-mode placement before the visible list changes.

---

Ordering strategy
Use server-issued sequence for ordering, event identity for replay dedupe, and an opaque cursor for resume. Timestamps remain display metadata.

Auto-scroll rules
If the user scrolls up, pause auto-scroll and show a badge; resume only when they return to the bottom.

### Worked example: burst while the viewer reads older comments

The viewer has moved upward and disabled follow mode when a popular moment produces two hundred comments, including a later moderation removal. The UI must preserve reading position, process authority, and avoid one announcement per comment.

### Scenario walkthrough
| Event | Store change | Visible UI | Invariant |
| --- | --- | --- | --- |
| Viewer leaves the live edge | Set follow mode paused and record the first visible anchor. | Current comments remain stable. | New data cannot steal reading position. |
| Burst arrives | Deduplicate and batch accepted events into the normalized store. | A new-comments count appears instead of inserting above the anchor. | Ingestion is decoupled from placement. |
| Moderator removes one item | Apply a versioned tombstone to that comment identity. | The row becomes a compact removed state without collapsing the anchor. | Moderation authority wins. |
| Viewer returns live | Merge pending ordered IDs and clear the count after placement. | Scroll once to the live edge by explicit action. | Auto-follow resumes only by user intent. |

# Tradeoffs

The central tradeoff is Design a live-comment stream with ordered resumable events, moderation-aware rendering, burst control, readable auto-follow behavior, and accessible interaction. The preferred design keeps browser-owned state explicit and treats server behavior as a UI-facing contract. A different rendering or state strategy is justified only when measured interaction cost, device constraints, or collaboration requirements change the evidence.

## Data model

Keep comment entities normalized and separate from UI state (visibility, moderation, scroll position).

---

```ts
type ModerationState =
  | { kind: 'visible'; revision: number }
  | { kind: 'removed'; revision: number; reason: string };

interface Comment {
  id: string;
  sequence: number;
  author: { id: string; label: string; avatarUrl?: string };
  body: string | null;
  createdAt: string;
  moderation: ModerationState;
}

type CommentEventEnvelope = {
  schemaVersion: 1;
  eventId: string;
  sequence: number;
  cursor: string;
};

type CommentEvent =
  | (CommentEventEnvelope & { type: 'comment.upserted'; comment: Comment })
  | (CommentEventEnvelope & {
      type: 'comment.removed';
      commentId: string;
      moderation: ModerationState;
    });
```

### Core entities
- Comment: stable ID, sequence, safe author label, nullable body, and canonical moderation state
- Timeline: ordered IDs, contiguous sequence, opaque resume cursor, and unresolved gap
- ModerationState: authoritative visible or removed state with a monotonic revision
- IngestQueue: validated events waiting for one bounded store transaction
- FollowState: live or paused placement, anchor identity, and pending count

### Client-owned state
| State | Why | Notes |
| --- | --- | --- |
| Normalized comments | Avoid duplication and re-render | Stable ids |
| Ingest queue | Coalesce store commits | Never drops accepted authoritative events |
| Scroll intent | Prevent auto-scroll fighting user | Track if user is at bottom |

---

### Timeline-data integrity checks
- Stable IDs for dedupe and ordering.
- Derive safe comment rows from normalized entities, moderation state, and follow mode.
- Separate bounds for rendered rows, retained bodies, and compact sequence/anchor metadata.
- Metrics payloads for UX health.

---

### View model note

Keep a render-ready view model separate from raw payloads to avoid expensive transforms on every tick.

### Comment order, moderation, and follow-mode ownership

Separate comment entities from ordered timeline IDs, stream cursor, moderation version, follow mode, and composer commands. A tombstone retains identity and layout context without exposing removed content. The new-item counter derives from IDs not yet placed into the paused viewport, rather than from every received frame.

### Client model
| Record | Key fields | Owner |
| --- | --- | --- |
| Comment | id, sequence, author label, body, moderation state | Entity store |
| Timeline | ordered IDs, cursor, gap | Stream store |
| FollowState | live or paused, anchorId, pending count | View state |
| ComposerCommand | clientId, phase, error | Action overlay |

# Failure Modes

## Optimizations and deep dive

Optimizations should focus on preventing UI overload during comment spikes while keeping latency low.

---

### Frontend performance strategies
- Coalesce accepted bursts according to measured freshness and rendering cost.
- Virtualize list to cap DOM size.
- Collapse spam bursts or rate-limit duplicates.
- Pause auto-scroll when the user scrolls up.
- Lazy-render avatars and badges.

### Reliability and rollout
- Reconnect with exponential backoff + jitter.
- Fallback to polling if stream fails.
- Use feature flags for moderation UI.
- Monitor freshness, gap repair, duplicate rejection, and render latency.
- Rollback if UX degrades.

### Metrics you can quote
| Metric | Target | Why it matters |
| --- | --- | --- |
| End-to-end freshness | Percentiles by cohort | Live feel |
| Frame and long-task distribution | Field percentiles by device cohort | Smooth scrolling |
| Retained-row budget | Chosen from heap and interaction profiling | Avoid memory growth without losing resumable identity |

- **Batch policy:** Measured
- **Render budget:** Profiled by device class
- **Reconnect:** Visible freshness and measured gap repair

### Common pitfalls

A live-comment burst should be reduced in batches while stable sequence indexes preserve order. Per-message rendering, unbounded bodies, and repeated global sorting make the viewer lose both responsiveness and reading context.

---

### Keeping bursty comment streams readable
1. **1) Batch updates:** Coalesce a burst into one reducer transaction when needed; every accepted event still participates in ordering and gap detection.
2. **2) Bound visible rows:** Virtualize visible comment rows while retaining compact sequence, moderation, and anchor metadata.
3. **3) Cancel stale work:** Abort prefetches or network work when user intent changes.
4. **4) Measure:** Log LCP/INP and feature-specific KPIs to validate rollout.

---

### Backpressure policy
| Scenario | Policy | Why |
| --- | --- | --- |
| Burst spikes | Bound the queue and request server delta or explicit sampling | Protect responsiveness without silent event loss |
| Slow device | Lower render cadence | Keep UI responsive |
| User paused | Render badge only | Avoid wasted work |

### Gap, moderation, and follow-mode recovery

### Failure modes
| Failure | Response | Invariant |
| --- | --- | --- |
| Reconnect replays data | Ignore known event identities and resume cursor safely. | No repeated comments appear. |
| Moderation races a render | Apply the newest moderation revision before deriving the row. | Removed content does not flash back. |
| Composer response is lost | Retain client command identity and reconcile the echoed event. | Retry cannot double-post. |
| Long session grows | Evict distant bodies by policy while retaining anchor metadata. | Memory remains bounded. |

### Accessibility behavior

Use a named log or list with explicit controls for jumping to live and loading older comments. Paused readers keep focus and anchor. Announce a grouped new-comment count, moderation outcome, or connection state rather than each message. The composer has a persistent label, safe error association, and composition-safe keyboard submission. Treat bodies as untrusted: render safe text or product-approved formatting and apply an explicit external-link policy.

### Rollout and measurement

Validate chronological merge and moderation with recorded event fixtures before enabling the live transport. Observe gap frequency, duplicate rejection, pending-count accuracy, anchor shifts, composer reconciliation, long-session memory, and announcement rate.

### Technical references
- [MDN WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) — Browser bidirectional transport behavior and backpressure caveat.
- [MDN ARIA log role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/log_role) — Semantics for ordered live additions such as chat messages.

### Moderation and composer convergence

Moderation is a versioned change to an existing comment identity, not a second unrelated message. The reducer can replace visible body content with a tombstone, retain sequence and height metadata for anchoring, and remove interactive actions that are no longer permitted. A late unmoderated replay cannot restore the body because its moderation revision is older. This model also supports author deletion without treating client-side hiding as the security boundary.

For authored comments, allocate a client command ID before sending. The pending row can show local intent, but it remains visually distinct until an authoritative event echoes the command identity. If the response is lost, reconnect may still reconcile the row. A rejected message keeps the composer text or provides a recoverable draft rather than disappearing. Rate-limit and permission errors need different instructions, and focus stays near the composer after a user-triggered failure.

Follow mode is a user-visible state, not a scroll-position guess recalculated on every frame. Enter it only when the viewer reaches the live edge or activates Jump to live, and leave it when intentional upward movement crosses a measured boundary. Preserve the anchor through font loading, deleted comments, and composer resizing. On mobile, keep video controls and comment composer reachable without turning the whole document into a horizontally overflowing split view. Verify this behavior with keyboard, touch, zoom, and large text. Reconnect tests also cover duplicate acknowledgements and permission changes while an unsent draft exists.

# Metrics

Measure task completion and recovery before optimizing isolated rendering numbers. Track time to first useful UI, interaction latency by input mode, request and mutation failure rates, stale-response suppressions, retry outcomes, focus-restoration failures, layout overflow, and accessibility regressions. Segment field results by device capability, network class, viewport, and reduced-motion preference. Numeric targets begin as testable budgets and should be revised from production distributions.

# Rollout

Ship the smallest client slice that preserves identity, cancellation, recovery, accessibility, and observability. Validate the UI-facing contracts with deterministic fixtures, release behind a feature flag where appropriate, compare user outcomes and error distributions, and expand only after the failure and rollback paths have been exercised.

## Interface definition (API)

The API should support cursor-based history and a real-time stream. The client merges both into a single ordered list.

---

```http
GET /api/streams/s1/comments?position=latest

200 OK
{
  "schemaVersion": 1,
  "items": [
    {
      "id": "c1",
      "sequence": 418,
      "author": { "id": "u1", "label": "Mina" },
      "body": "Nice!",
      "createdAt": "2026-07-28T10:00:00Z",
      "moderation": { "kind": "visible", "revision": 0 }
    }
  ],
  "contiguousSequence": 418,
  "resumeCursor": "rc_418",
  "olderPageCursor": "older_400"
}

WS /api/streams/s1/comments/live?cursor=rc_418
{
  "schemaVersion": 1,
  "eventId": "evt_419",
  "sequence": 419,
  "cursor": "rc_419",
  "type": "comment.upserted",
  "comment": {
    "id": "c2",
    "sequence": 419,
    "author": { "id": "u2", "label": "Sam" },
    "body": "Great moment",
    "createdAt": "2026-07-28T10:00:01Z",
    "moderation": { "kind": "visible", "revision": 0 }
  }
}
```

### API design notes
| Decision | Reason |
| --- | --- |
| Cursor pagination | Stable ordering + incremental fetch |
| Stream + REST | Backfill + live updates |
| Sequence + event ID | Deterministic order, gap detection, and replay dedupe |

---

### UI-facing API fields
| Field | Why it matters |
| --- | --- |
| id | Stable keys for virtualization and diffing |
| cursor/next | Pagination and recovery |
| sequence/moderation.revision | Ordering and authoritative tombstones |
| schemaVersion/capabilities | Compatible parsing and explicit feature support |
| timestamps | Display and latency telemetry, never canonical ordering |

---

### Resume and schema details
- Cursor or lastSeen for delta fetch.
- Event type or priority for filtering.
- Locale + device hints for payload shaping.
- Schema version and capabilities for compatible rollout.

### UI-facing contract

Snapshot and delta events carry immutable comment IDs, sequence, cursor, and moderation revision. Send-comment accepts a client-generated idempotency key so an uncertain response can reconcile with the echoed event. Removed content is omitted or redacted by the server contract; client hiding is not the security boundary.

### From resumable snapshot to visible comment
1. **Open:** Normalize a snapshot and establish the last contiguous cursor.
2. **Receive:** Validate frames, ignore duplicate IDs, detect gaps, and batch store commits.
3. **Place:** Insert at the live edge only in follow mode; otherwise update the pending count.
4. **Command:** Overlay a pending local comment and reconcile it with the authoritative event.
