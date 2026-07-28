---
title: "Endless Short-Video Feed (TikTok-Style)"
slug: "endless-short-video-feed"
family: "system-design"
tech: "frontend"
audience: "Frontend engineers preparing for system design interviews"
intent: "Teach a concrete frontend architecture answer with explicit state, failure, accessibility, and rollout decisions."
target_words: 2400
primary_keyword: "endless short-video feed frontend system design"
status: "converted"
notes_for_conversion:
  - "Keep the route, question ID, and access level stable."
  - "Keep backend execution out of scope; describe only UI-facing contracts."
  - "Maintain parity with the five shipped RADIO sections."
search_intent: "Prepare a frontend system design answer for Endless Short-Video Feed (TikTok-Style)."
reader_promise: "The reader can explain the frontend state, architecture, interfaces, failure recovery, accessibility, and rollout decisions for Endless Short-Video Feed (TikTok-Style)."
unique_angle: "Design an endless short-video feed with fast first playback, one active player, intent-aware preloading, bounded media memory, and network-aware recovery."
what_this_adds_beyond_basics: "Adds an end-to-end worked example, state ownership, recovery, accessibility, and measurable rollout guidance for Endless Short-Video Feed (TikTok-Style)."
competitor_query: "Endless Short-Video Feed (TikTok-Style) frontend system design"
competitor_takeaways:
  - "Catalog pages commonly list components but stop before reconciliation and failure recovery."
  - "Reference material is strongest when it anchors browser behavior in official platform guidance."
competitor_gaps:
  - "A state transition is often described without showing the visible UI result or preserved invariant."
  - "Accessibility, mobile reflow, cancellation, and rollback are frequently treated as afterthoughts."
sources:
  - "https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play"
  - "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#preload"
last_fact_checked_at: "2026-07-28"
reviewed_by: "FrontendAtlas editorial migration"
confidence: "high"
---
# Prompt

endless short-video feed frontend system design. Design an endless short-video feed with fast first playback, one active player, intent-aware preloading, bounded media memory, and network-aware recovery.

## Requirements

Design the browser side of a short-video feed where one settled card owns playback, directional preload stays bounded, and rapid swipes cannot leak media work.

### Use RADIO

Requirements define the user journey, device and network constraints, playback policy, failure behavior, and measurable success criteria before architecture decisions are made.

---

What you are solving:
An endless short-video feed with instant playback, responsive scrolling, and predictable controls. The UI must stay smooth across device classes while handling variable networks, long sessions, and bursty user behavior (fast swipes).

Decision surface:
- Fast first play and prefetch strategy
- Handling variable networks and devices
- Virtualization + memory control
- Playback lifecycle (only one active player)
- CDN rendition selection and caching
- UI performance budgets and observability

---

### User flow
1. **1) Open feed:** Fetch the first page of metadata, render the first card, and show a poster immediately.
2. **2) Fast first play:** Preconnect to CDN, request video metadata, and start playback for the first visible card.
3. **3) Prefetch next items:** Prepare a measured directional neighbor window based on settled intent, swipe velocity, cache evidence, device memory, and network or Save-Data signals.
4. **4) Rapid scroll:** Pause offscreen videos, cancel in-flight downloads, and keep only one active decoder.
5. **5) Slow network:** Downshift quality, show a buffering UI, and resume when bandwidth recovers.

### Clarifying questions
- Target devices (mobile, TV, desktop)?
- Acceptable time-to-first-frame for Wi-Fi vs 4G?
- How many videos should be prefetched?
- Should videos autoplay on cellular by default?
- Do we need offline or data-saver modes?
- Any region-specific CDN constraints?
- What metrics define success?

### Non-functional expectations
- Smooth scroll and snap behavior verified with field frame data.
- Time-to-first-frame budgets segmented by device and network class.
- Bounded memory usage over long sessions.
- Graceful fallback on slow networks.
- Consistent UI across regions and devices.
- Strong observability for playback failures.

### Playback-facing UI states
| State | What the user sees | What you track |
| --- | --- | --- |
| Idle / Poster | Poster image with play affordance | isVisible, posterLoaded |
| Playing | Video plays with controls | activeVideoId, playbackStartTime |
| Buffering | Spinner + muted state | bufferedRanges, bitrate |
| Error | Retry UI or fallback low-res | errorCode, retryCount |

- **Time to first frame:** Measured by cohort
- **Prefetch policy:** Adaptive to swipe, memory, Save-Data, and network evidence
- **Scroll budget:** Field frame and long-task data

### Critical trade-off

More prefetching improves instant playback but increases memory and bandwidth. justify the prefetch window and show how you cancel downloads on rapid scroll.

---

### Explicit assumptions
- Autoplay, codec, reduced-motion, and inline-playback support across target devices.
- Rendition coverage for viewport sizes, Save-Data users, and constrained connections.
- Swipe velocity, session length, and low-memory pressure that shape the preload window.
- First-frame, rebuffer, and interaction budgets segmented by device and network cohort.

### Playback success measures
| Metric | Target | Why it matters |
| --- | --- | --- |
| LCP/media TTFF | Segment by device and network | Separate page render from playback startup |
| INP | Field p75 by input | Responsive interaction |
| Frame delivery | Distribution and long tasks | Scroll and snap quality |

### Frontend boundary

The client controls viewport intent, active-player ownership, media element reuse, preload cancellation, memory pressure, and playback UI. Server-side ranking, encoding, and recommendation stay behind abstract feed contracts; CDN topology and origin selection stay behind abstract media-delivery contracts.

# Clarifying Questions

- Which user journey and input modes must Endless Short-Video Feed (TikTok-Style) support first?
- Which state is authoritative, which state may be optimistic, and how is freshness represented?
- What ordering, identity, and version rules must survive retries or out-of-order responses?
- Which interactions must remain usable with keyboard, assistive technology, and narrow viewports?
- What should users see during loading, partial failure, cancellation, and recovery?
- Which performance budgets are hypotheses to measure rather than universal thresholds?

# Architecture

## Architecture / High-level design

The architecture is a client pipeline: feed shell, visibility tracking, prefetch manager, media adapter, and playback controller. The media adapter translates feed rendition metadata into browser-supported source selection and preload work; it does not pretend MP4 files provide segmented ABR.

---

Client architecture
- Feed shell + virtualized list
- Visibility observer (viewport + direction)
- Video card component with lifecycle hooks
- Prefetch manager with a measured directional window
- Playback controller (single active player)

Delivery pipeline
- CDN-hosted MP4 rendition candidates
- Choose one compatible rendition before an item starts
- Client cache with TTL + LRU
- Retry + fallback for slow networks
- Analytics hooks for playback health

### Client media modules
| Module | Responsibility | Why it matters |
| --- | --- | --- |
| FeedShell | Loads metadata + manages virtualized list | Controls DOM size and scroll performance |
| VisibilityObserver | Detects active card + scroll direction | Drives autoplay and prefetch window |
| PrefetchManager | Queues upcoming media requests | Improves time-to-first-frame |
| PlaybackController | Ensures a single active player | Prevents multiple decoders running |
| MediaAdapter | Selects supported MP4 rendition and coordinates bounded preload resources | Separates feed metadata from browser behavior |

---

### High-level data flow
1. **1) Fetch metadata:** Load feed metadata (id, poster, media URLs, duration) and render the first card.
2. **2) Start playback:** When the first card enters the viewport, the PlaybackController starts playback and records TTFF.
3. **3) Prefetch:** PrefetchManager schedules a measured neighbor policy based on direction, memory, and recent abandonment.
4. **4) Select rendition:** Choose a supported MP4 source before the item starts; use a lower rendition on a later attempt when evidence supports it.
5. **5) Cleanup:** Pause offscreen videos, cancel downloads, and evict cache entries via LRU.

### Playback has one owner

You win by controlling the pipeline: visibility drives playback, a small prefetch window drives instant play, and a bounded cache keeps memory predictable.

---

### Media pipeline boundaries
| Boundary | Reason |
| --- | --- |
| Viewport intent vs playback controller | Only the settled card can activate the shared player |
| Feed entities vs media sessions | Decoded resources can be evicted without losing card identity or anchor |
| Rendition selection vs activation | One attempt identity guards source choice, preload completion, and play promises |

### Viewport-to-playback flow

Make the media path explicit: page intent becomes normalized feed entities, a settled viewport identity, one active playback session, prioritized media work, and finally the rendered card.

### Worked example: three fast swipes on a constrained connection

Video A is playing, B is partially buffered, and the user swipes rapidly through B toward C. The frontend must follow the final viewport intent without allowing three decoders, stale autoplay, or abandoned preloads to consume the session.

### Scenario walkthrough
| Event | Store change | Visible UI | Invariant |
| --- | --- | --- | --- |
| B crosses activation threshold | Mark B as candidate but wait for settled intent. | A keeps playing during the short gesture. | Only one player owns audible playback. |
| User continues to C | Cancel B priority work and promote C preload. | B poster remains; no stale playback starts. | Preload follows current intent. |
| C settles | Pause A, attach the reusable player to C, and attempt play from user gesture context. | C shows honest buffering or playback state. | A failed play promise is handled. |
| Memory pressure rises | Release distant decoded media and shrink preload distance. | Nearby posters remain stable. | Long sessions keep bounded resources. |

# Tradeoffs

The central tradeoff is Design an endless short-video feed with fast first playback, one active player, intent-aware preloading, bounded media memory, and network-aware recovery. The preferred design keeps browser-owned state explicit and treats server behavior as a UI-facing contract. A different rendering or state strategy is justified only when measured interaction cost, device constraints, or collaboration requirements change the evidence.

## Data model

Keep the data model optimized for rendering and playback state. Separate raw media metadata from UI state (playback, progress, visibility).

---

```ts
interface MediaRendition {
  url: string;
  mimeType: string;
  width: number;
  height: number;
  bitrateKbps: number;
}

interface VideoItem {
  id: string;
  posterUrl: string;
  posterAspectRatio: number;
  durationMs: number;
  renditions: MediaRendition[];
  captionsUrl?: string;
}

interface FeedPage {
  items: VideoItem[];
  nextCursor: string | null;
}
```

### Core entities
- VideoItem: id, poster geometry, duration, and supported MP4 rendition candidates
- FeedState: ordered ids, cursor, hasMore
- PlaybackState: isPlaying, progress, muted
- NetworkState: bandwidth class, connection type
- CacheEntry: url, ttl, lastAccess

### Client-owned state
| State | Why | Notes |
| --- | --- | --- |
| Normalized video items | Avoid duplication and re-render | Use stable ids |
| Viewport visibility | Control autoplay and pause | IntersectionObserver |
| Media session cache | Bound playback resources | Release distant decoded resources while retaining feed identity |

---

### Media-data integrity checks
- Stable IDs for dedupe and ordering.
- Derive card readiness and controls from normalized metadata plus the media session.
- Cache metadata (TTL, size cap, eviction).
- Metrics payloads for UX health.

### Media identity, readiness, and active-player ownership

Represent each feed item as immutable metadata plus a MediaSession record for local readiness, playback phase, buffered ranges, and recoverable error. A single ActivePlayback record owns the attached media element and attempt generation. Viewport state stores candidate and settled item identities so a fast gesture cannot activate every crossed card.

### Client model
| Record | Key fields | Owner |
| --- | --- | --- |
| FeedPage | ordered IDs, cursor, generation | Query cache |
| MediaSession | itemId, readiness, buffered, error | Bounded session cache |
| ActivePlayback | itemId, attemptId, muted, phase | Player controller |
| ViewportIntent | candidateId, settledId, direction | View state |

# Failure Modes

## Optimizations and deep dive

Optimizations should protect the render pipeline and reduce playback stalls. The deep dive here is about controlling network, CPU, and memory while keeping playback instant.

---

### Frontend performance strategies
- Preconnect to CDN and warm the first media request.
- Prefetch next N videos during idle time; cancel on rapid scroll.
- Virtualize offscreen items and keep DOM size bounded.
- Pause/stop playback when cards exit the viewport.
- Use low-res posters and upgrade when stable.
- Throttle scroll-driven state updates to avoid re-render storms.

### Playback reliability
- Choose a conservative MP4 rendition before playback from measured session evidence.
- Fallback to low-res or poster-only on bad networks.
- Abort in-flight requests when the user skips quickly.
- Capture errors with a retry UI and silent auto-retry.

### Performance targets you can quote
| Metric | Target | Why it matters |
| --- | --- | --- |
| Time-to-first-frame | Percentiles by cohort | Perceived playback startup |
| Rebuffer rate | < 1% | Smooth session quality |
| INP | <= 200ms | Fast touch/scroll feedback |
| Frame delivery | Distribution and long tasks | Visible jank control |

- **Prefetch policy:** Adaptive and measured
- **Scroll budget:** Profiled by device
- **TTFF budget:** Starting cohort hypothesis

### Unreliable shortcut

Vague answers like “use CDN” without showing how prefetching, cancellation, and playback lifecycle actually work on the client.

---

### Keeping swipes smooth while media work changes
1. **1) Coalesce measured work:** Coalesce viewport and progress presentation only when profiling shows excess commits; playback and user intent still update immediately.
2. **2) Bound card rendering:** Virtualize offscreen video cards while retaining stable item and scroll-anchor identity.
3. **3) Cancel stale work:** Abort prefetches or network work when user intent changes.
4. **4) Measure:** Log LCP/INP and feature-specific KPIs to validate rollout.

### Playback and preload recovery

### Failure modes
| Failure | Response | Invariant |
| --- | --- | --- |
| Autoplay is rejected | Show an explicit play control and keep the card focused. | The UI never claims playback started. |
| Network stalls | Keep poster and controls visible with retry or lower-quality choice. | Scrolling remains available. |
| Media decode fails | Quarantine that candidate and try a compatible fallback. | One broken item does not stop the feed. |
| Tab backgrounds | Pause visual work and apply a clear playback policy. | Return does not start multiple players. |

### Accessibility behavior

Cards expose a stable heading, playback control, mute state, captions availability, and progress without requiring a swipe gesture. Keyboard and switch users can move sequentially and trigger playback explicitly. Reduced motion removes snap animation where feasible, captions and audio descriptions remain selectable, and status updates avoid announcing every time tick.

### Rollout and measurement

Profile first play, gesture response, decoder count, memory, abandoned bytes, and failed play promises by device class. Roll out preload distance and player reuse independently so regressions can be attributed and disabled without changing feed identity.

### Technical references
- [MDN HTMLMediaElement play](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play) — Playback promise and autoplay failure behavior.
- [MDN preload attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#preload) — Browser media preload hints and limitations.

### Device capability and media budget

Treat media policy as an adaptive client decision rather than one global preload count. A constrained phone may keep the active player, current poster, and one lightweight next candidate, while a capable device on a stable connection can prepare more. Capability evidence includes memory pressure, decoded-frame cost, connection changes, save-data preference, visibility, and recent swipe velocity. Adapt at safe boundaries so one card does not change quality repeatedly during playback. Record why a candidate was selected so field failures can be separated by format, device, and policy.

Player reuse also needs explicit hygiene. Before attaching the shared media element to a new item, pause the old source, detach item-specific listeners, invalidate the prior attempt, apply muted and captions preferences, set the new source, and handle the play promise. A late canplay, error, or play resolution from the old attempt is ignored. Posters keep fixed geometry throughout this handoff. This sequence prevents audio overlap, stale controls, decoder accumulation, and layout movement during rapid navigation.

Network adaptation should avoid reacting to one noisy sample. Use recent startup, rebuffer, throughput, and device evidence to adjust future candidates at item boundaries. Keep the user-selected captions, mute, and quality preference authoritative. If a lower-quality fallback is chosen, communicate only when that knowledge helps recovery; do not cover every card with transport detail. Test the policy with fast reverse swipes, orientation changes, Bluetooth interruptions, and data-saver transitions. After memory pressure, release inactive decoders and verify that current playback remains continuous.

# Metrics

Measure task completion and recovery before optimizing isolated rendering numbers. Track time to first useful UI, interaction latency by input mode, request and mutation failure rates, stale-response suppressions, retry outcomes, focus-restoration failures, layout overflow, and accessibility regressions. Segment field results by device capability, network class, viewport, and reduced-motion preference. Numeric targets begin as testable budgets and should be revised from production distributions.

# Rollout

Ship the smallest client slice that preserves identity, cancellation, recovery, accessibility, and observability. Validate the UI-facing contracts with deterministic fixtures, release behind a feature flag where appropriate, compare user outcomes and error distributions, and expand only after the failure and rollback paths have been exercised.

## Interface definition (API)

The API should be cursor-based and optimized for video playback. It returns the same poster geometry and MP4 rendition fields consumed by `VideoItem`; source selection happens before an attempt and does not imply segmented ABR.

---

```ts
interface FeedClient {
  getPage(input: {
    cursor?: string;
    deviceClass: 'mobile' | 'desktop' | 'tv';
    signal: AbortSignal;
  }): Promise<FeedPage>;
}

interface RenditionEvidence {
  saveData: boolean;
  viewportWidth: number;
  recentStartupMs: number | null;
  recentRebufferRatio: number | null;
}

interface MediaSelector {
  select(item: VideoItem, evidence: RenditionEvidence): MediaRendition;
}

interface PreloadManager {
  prepare(input: {
    item: VideoItem;
    rendition: MediaRendition;
    priority: 'active' | 'directional-neighbor';
    signal: AbortSignal;
  }): Promise<void>;
  release(itemId: string): void;
}

interface PlaybackController {
  activate(input: {
    item: VideoItem;
    rendition: MediaRendition;
    attemptId: string;
  }): Promise<void>;
  pause(itemId: string): void;
  release(itemId: string): void;
}
```

```http
GET /api/feed?cursor=next&device=mobile

200 OK
{
  "items": [
    {
      "id": "vid_123",
      "posterUrl": "https://cdn.example.com/posters/vid_123.jpg",
      "posterAspectRatio": 0.5625,
      "durationMs": 18000,
      "renditions": [
        {
          "url": "https://cdn.example.com/vid_123_360p.mp4",
          "mimeType": "video/mp4",
          "width": 360,
          "height": 640,
          "bitrateKbps": 800
        },
        {
          "url": "https://cdn.example.com/vid_123_720p.mp4",
          "mimeType": "video/mp4",
          "width": 720,
          "height": 1280,
          "bitrateKbps": 2000
        }
      ]
    }
  ],
  "nextCursor": "feed_c2"
}

```

### API design notes
| Decision | Reason |
| --- | --- |
| Cursor pagination | Stable ordering for endless feeds |
| CDN URLs | Low-latency media delivery |
| Multiple MP4 renditions | Choose a lower-cost source before the next attempt without claiming mid-stream adaptation |

---

### UI-facing API fields
| Field | Why it matters |
| --- | --- |
| id | Stable keys for virtualization and diffing |
| cursor/next | Pagination and recovery |
| posterUrl/posterAspectRatio | Stable reserved geometry before media is ready |
| renditions | Supported source candidates for the media selector |
| durationMs | Progress, seek bounds, and accessibility metadata |

### UI-facing contract

The feed contract returns stable IDs, poster and media candidates, duration metadata, and an opaque cursor. A media selector chooses a supported candidate from device and connection evidence. All fetch and preload work accepts AbortSignal; the player controller also guards play-promise resolution with the active attempt identity.

### From feed page to released media session
1. **Page:** Prefetch the next cursor near the measured threshold and merge unseen IDs.
2. **Prioritize:** Load the settled card first, then one measured neighbor in the direction of travel.
3. **Activate:** Transfer the single player only after viewport intent settles and visibility policy passes.
4. **Release:** Pause detached items, clear sources when appropriate, and evict distant session resources.
