---
title: "Drag-and-Drop Dashboard Frontend System Design"
slug: "dashboard-widgets-draggable-resizable"
family: "system-design"
tech: "frontend"
audience: "Frontend engineers preparing for system design interviews"
intent: "Teach a concrete frontend architecture answer with explicit state, failure, accessibility, and rollout decisions."
target_words: 2400
primary_keyword: "drag-and-drop dashboard frontend system design"
status: "converted"
notes_for_conversion:
  - "Keep the route, question ID, and access level stable."
  - "Keep backend execution out of scope; describe only UI-facing contracts."
  - "Maintain parity with the five shipped RADIO sections."
search_intent: "Prepare a frontend system design answer for Drag-and-Drop Dashboard Frontend System Design."
reader_promise: "The reader can explain the frontend state, architecture, interfaces, failure recovery, accessibility, and rollout decisions for Drag-and-Drop Dashboard Frontend System Design."
unique_angle: "Design a customizable dashboard with pointer and keyboard movement, grid constraints, optimistic layout persistence, versioned migrations, and responsive reflow."
what_this_adds_beyond_basics: "Adds an end-to-end worked example, state ownership, recovery, accessibility, and measurable rollout guidance for Drag-and-Drop Dashboard Frontend System Design."
competitor_query: "Drag-and-Drop Dashboard Frontend System Design frontend system design"
competitor_takeaways:
  - "Catalog pages commonly list components but stop before reconciliation and failure recovery."
  - "Reference material is strongest when it anchors browser behavior in official platform guidance."
competitor_gaps:
  - "A state transition is often described without showing the visible UI result or preserved invariant."
  - "Accessibility, mobile reflow, cancellation, and rollback are frequently treated as afterthoughts."
sources:
  - "https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events"
  - "https://www.w3.org/WAI/ARIA/apg/patterns/grid/"
last_fact_checked_at: "2026-07-28"
reviewed_by: "FrontendAtlas editorial migration"
confidence: "high"
---
# Prompt

drag-and-drop dashboard frontend system design. Design a customizable dashboard with pointer and keyboard movement, grid constraints, optimistic layout persistence, versioned migrations, and responsive reflow.

## Interview framing and requirements

Frame this as a frontend layout editor, not as a generic drag-and-drop feature.

### Contextual practice links
- [Frontend system design question bank](/system-design) — Use this prompt alongside other frontend architecture scenarios.
- [Frontend system design answer blueprint](/guides/system-design-blueprint/radio-framework) — Structure the design before diving into layout math.
- [Performance optimization guide](/guides/system-design-blueprint/performance) — Use it for the pointermove, render-loop, and INP trade-offs.
- [Machine coding hub](/machine-coding) — Turn the same interaction into implementation practice.
- [Related dashboard performance scenario](/system-design/model-training-progress-dashboard) — Compare layout interaction performance with high-frequency dashboard updates.

### What to lock down in the first 5 minutes
| Area | Question to ask | Defensible decision signal |
| --- | --- | --- |
| Requirements | How many widgets, which widget types, and can users add/remove/reorder them? | Defines whether you need a reusable layout engine or a narrow page-specific editor. |
| Grid/layout data model | Fixed 12-column grid, free-form canvas, or breakpoint-specific layouts? | Keeps positions in logical grid units so snapping, resize, and persistence are deterministic. |
| Drag and resize ownership | Does the layout container own all pointer and keyboard interaction, or can widgets opt in? | Prevents widget content from mixing chart state with drag math. |
| Collision and snapping | When a candidate rectangle overlaps another widget, do we reject, push, swap, compact, or allow overlap? | Turns a vague drag feature into explicit product behavior. |
| Performance | How many widgets and how heavy are they during drag? | Separates the hot pointermove/rAF loop from slower framework state commits. |
| Persistence | Save automatically on drop, on explicit Save, or sync to a server per user? | Clarifies optimistic local layout, conflict handling, and versioned migrations. |
| Accessibility | Can users move and resize widgets without a pointer device? | Adds keyboard move/resize controls, focus management, and an alternate layout editor. |

### Interview opening

A strong opening is: Model every widget as a rectangle on a logical grid, use a layout engine for snapping and collision resolution, keep pointermove work outside expensive framework rerenders, and persist a versioned layout snapshot after the interaction commits.

---

### Early trade-offs to state explicitly
| Decision | Option A | Option B | Practical choice |
| --- | --- | --- | --- |
| CSS Grid vs absolute positioning | CSS Grid is semantic and good for static responsive tracks, but drag previews are harder because grid placement triggers layout. | Absolute positioned containers with transform previews are easier for interactive movement, but you must own all grid math. | Use a logical grid model and render widgets as positioned boxes; use transforms during drag and commit final grid coordinates. |
| Logical coordinates vs raw pixels | Grid coordinates like x/y/width/height survive row height, gap, and breakpoint changes. | Raw pixels feel direct but make snapping, persistence, and responsive remapping brittle. | Persist logical coordinates and derive pixels from container width, column count, row height, and gap. |
| Save on every move vs commit | Saving every move protects against crashes but adds JSON/stringify/storage or network work to the hot path. | Saving on drag/resize end is cheaper but needs local optimistic state until persistence finishes. | Update local layout optimistically during interaction, then persist on pointerup or explicit Save. |

```text
Deterministic grid/snap/collision example

Grid: 6 columns, rowHeight = 80px, gap = 8px
Widget A: { id: 'a', x: 0, y: 0, width: 2, height: 2 }
Widget B: { id: 'b', x: 2, y: 0, width: 2, height: 2 }
Widget C: { id: 'c', x: 4, y: 1, width: 2, height: 1 }

Before
row 0: A A B B . .
row 1: A A B B C C
row 2: . . . . . .

User drags A right by 2 columns.
Candidate A: x = 2, y = 0, width = 2, height = 2
Collision: A overlaps B at columns 2-3, rows 0-1.
Resolution policy: push the blocking widget down, then compact if there is empty space.

After
row 0: . . A A . .
row 1: . . A A C C
row 2: . . B B . .
row 3: . . B B . .
```

### Unreliable shortcut vs defensible decision
| Evaluation area | Unreliable shortcut | Defensible decision |
| --- | --- | --- |
| Scope | Use a drag-and-drop library and save positions. | Define grid rules, collision policy, resize constraints, persistence timing, keyboard support, and responsive layouts before selecting a library. |
| State model | Each widget stores its own left/top CSS. | The dashboard owns one layout array in grid units; widget content stays separate from layout math. |
| Interaction performance | Update React/Angular state on every mousemove. | Pointermove records the latest candidate; requestAnimationFrame applies a cheap transform and framework state commits at lower-frequency boundaries. |
| Persistence | Write localStorage whenever anything changes. | Persist a compact, versioned snapshot on drop/save, handle failed server sync, and migrate older layout versions. |
| Accessibility | Drag handles are enough. | Provide keyboard move/resize steps, focusable handles, live position feedback, and a non-drag layout editor fallback. |

- **Model:** Grid rectangles
- **Hot path:** pointermove -> rAF
- **Commit point:** pointerup / Save

### Scope checkpoint

This prompt is about frontend interaction architecture: a deterministic grid layout model, explicit collision behavior, smooth rendering boundaries, resilient persistence, and accessible controls.

### Frontend boundary

The browser owns pointer and keyboard interaction, preview geometry, collision feedback, optimistic layout overlays, responsive projection, and undo. Server-side layout validation and durable storage stay behind abstract revision-aware snapshot and save contracts, with schemaVersion reserved for format migration.

# Clarifying Questions

- Which user journey and input modes must Drag-and-Drop Dashboard Frontend System Design support first?
- Which state is authoritative, which state may be optimistic, and how is freshness represented?
- What ordering, identity, and version rules must survive retries or out-of-order responses?
- Which interactions must remain usable with keyboard, assistive technology, and narrow viewports?
- What should users see during loading, partial failure, cancellation, and recovery?
- Which performance budgets are hypotheses to measure rather than universal thresholds?

# Architecture

## Architecture and ownership

The architecture should make one boundary obvious: the dashboard layout system owns grid math and interactions; individual widgets render charts, tables, or KPIs without knowing collision rules.

### Frontend building blocks
| Piece | Responsibility | Do not let it own |
| --- | --- | --- |
| Dashboard shell | Loads default or saved layout, owns grid config, renders positioned widget containers, and coordinates persistence. | Per-widget business data, chart internals, or low-level pointer math. |
| Layout engine | Converts candidate rectangles into legal grid positions, applies snapping, bounds, min sizes, collision resolution, and compaction. | DOM events or framework component lifecycle. |
| Interaction controller | Uses pointerdown/move/up, pointer capture, keyboard controls, and resize handles to produce grid deltas. | Persistence, server sync, or widget content state. |
| Render layer | Maps grid rectangles to CSS variables, transform previews, placeholders, and committed positions. | Collision decisions or storage format decisions. |
| Persistence adapter | Serializes versioned snapshots to localStorage or an API and handles save failures or migrations. | Per-frame visual updates. |

---

### Render strategy trade-off
| Strategy | Works well for | Cost | Use here |
| --- | --- | --- | --- |
| CSS Grid placement | Static or low-frequency dashboard layout where semantic grid tracks matter. | Changing grid-row/grid-column during drag can force layout and move many items. | Useful for the committed layout if the dashboard is small and CSS handles breakpoints. |
| Absolute positioned grid | Interactive drag/resize where the app derives left/top/width/height from grid coordinates. | You own collision math, bounds, and responsive remapping. | Best default for a draggable editor because preview movement can use transform. |
| Transform-only drag preview | High-frequency pointer movement while the user drags one widget. | The visual preview can temporarily differ from committed DOM order/layout. | Use during interaction, then commit final grid coordinates on pointerup. |

### Interaction flow
1. **1. Start:** Pointerdown on a handle records the starting pointer, widget rectangle, grid config, and scroll/container bounds; setPointerCapture keeps events flowing even if the pointer leaves the handle.
2. **2. Preview:** Pointermove stores the latest pointer position and schedules one requestAnimationFrame. The frame computes a candidate grid delta and applies a cheap transform or placeholder update.
3. **3. Resolve:** The layout engine clamps bounds, snaps to cells, enforces minWidth/minHeight, and resolves collisions according to the product policy.
4. **4. Commit:** Pointerup releases capture, finalizes the layout array, emits one layout change, and persists the versioned snapshot.
5. **5. Recover:** If persistence fails, keep the optimistic local layout visible, show a non-blocking save error, and retry or let the user save again.

### Collision strategies
| Strategy | User experience | Implementation cost | When to choose it |
| --- | --- | --- | --- |
| Reject | The dragged widget cannot enter occupied cells. | Low; just test overlap and clamp. | Dense dashboards where predictable constraints matter more than fluid rearranging. |
| Push and compact | Blocking widgets move down or sideways and empty gaps are compacted. | Medium to high; needs deterministic ordering to avoid loops. | Dashboard builders where users expect automatic rearrangement. |
| Swap | The active widget trades places with the widget it overlaps most. | Medium; simpler than full compaction but can feel jumpy. | Small grids with similarly sized tiles. |
| Allow overlap | Widgets can stack or partially cover each other. | Low layout cost but higher UX/accessibility cost. | Canvas-like tools, not most analytics dashboards. |

### Versioned layout ownership

Do not describe a backend dashboard service. The important frontend design is the client layout engine, interaction controller, render boundary, persisted snapshot, and accessible editing surface.

### Worked example: remote layout update during a drag

A user drags widget w7 from column one to column three based on layout revision 12 while another tab saves revision 13. Pointer movement stays local, then the final command reconciles the conflict.

### Scenario walkthrough
| Event | Store change | Visible UI | Invariant |
| --- | --- | --- | --- |
| Drag starts | Snapshot revision 12 and create a transient preview geometry. | The widget follows a transform preview with clear drop targets. | Pointermove does not persist. |
| Remote revision 13 arrives | Queue the authoritative base without replacing the active preview. | The drag does not jump under the pointer. | Interaction state stays coherent. |
| Drop occurs | Solve constraints against the newest known base and send one command. | Show pending placement while keeping undo available. | Only settled geometry is persisted. |
| Server conflicts | Merge revision 13 and recompute or roll back the overlay. | Explain the changed layout and restore focus to w7. | Authoritative revision wins without losing context. |

# Tradeoffs

The central tradeoff is Design a customizable dashboard with pointer and keyboard movement, grid constraints, optimistic layout persistence, versioned migrations, and responsive reflow. The preferred design keeps browser-owned state explicit and treats server behavior as a UI-facing contract. A different rendering or state strategy is justified only when measured interaction cost, device constraints, or collaboration requirements change the evidence.

## Grid data model and persistence

The data model should make every visual decision reproducible: a widget is a rectangle in grid units, not a pile of DOM styles. Pixels are derived from the grid config at render time.

```ts
type LayoutSchemaVersion = 2;

type Breakpoint = 'desktop' | 'tablet' | 'mobile';

interface GridConfig {
  columns: number;
  rowHeight: number;
  gap: number;
}

interface WidgetLayout {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
}

interface DashboardSnapshot {
  schemaVersion: LayoutSchemaVersion;
  revision: number;
  layouts: Partial<Record<Breakpoint, WidgetLayout[]>>;
  updatedAt: string;
}

interface InteractionState {
  activeId: string | null;
  mode: 'idle' | 'drag' | 'resize' | 'keyboard-move' | 'keyboard-resize';
  baseRevision: number;
  startRect?: WidgetLayout;
  candidateRect?: WidgetLayout;
}

interface PendingLayout {
  commandId: string;
  basedOnRevision: number;
  breakpoint: Breakpoint;
  patch: WidgetLayout[];
}

```

### What each field buys you
| Field | Why it exists | Failure if missing |
| --- | --- | --- |
| id | Stable identity across rerenders, persistence, and widget data joins. | A reordered dashboard can attach saved size/position to the wrong widget. |
| x, y | Logical grid origin for snap, collision, and responsive remapping. | Raw pixels become stale when container width or column count changes. |
| width, height | Logical rectangle size in columns/rows. | Resize logic cannot enforce grid-aligned collisions. |
| minWidth, minHeight | Prevents charts, controls, or tables from becoming unusable. | Resize handles can create broken or inaccessible widget states. |
| schemaVersion | Selects the persisted-format migration. | Old document shapes break silently. |
| revision | Supplies a monotonic save precondition. | Another tab can be overwritten without conflict detection. |

---

### Persistent vs transient state
| State | Examples | Where it lives |
| --- | --- | --- |
| Persistent layout | schemaVersion, revision, breakpoint key, and widget rectangles. | localStorage or server snapshot; restored on page load. |
| Transient interaction | activeId, pointer start, candidate rectangle, keyboard step, placeholder position. | Component/controller memory only; never persisted. |
| Widget runtime state | Chart filters, table sort, data loading, error state. | Owned by widget or data layer; not mixed into layout collision math. |
| Persistence status | saving, saved, failed, stale authoritative revision. | Dashboard shell or sync adapter; visible without blocking drag. |

### Saved layout lifecycle
1. **1. Load:** Read the newest compatible snapshot for the user and breakpoint; fall back to a default layout if missing or invalid.
2. **2. Migrate:** If snapshot.schemaVersion is older, run the matching migration before rendering.
3. **3. Edit locally:** During drag/resize, update candidate layout locally and keep visual feedback immediate.
4. **4. Commit:** On pointerup, keyboard confirm, or explicit Save, write a new snapshot and mark the local layout as pending/saved.
5. **5. Resolve conflict:** If a save returns a newer authoritative revision, merge or roll back under the declared conflict policy.

### Responsive layout policy
| Policy | Benefit | Trade-off |
| --- | --- | --- |
| One desktop layout scaled down | Simple persistence and predictable desktop editing. | Mobile can become a cramped stack unless you derive a separate mobile order. |
| Separate layouts per breakpoint | Best user control for desktop, tablet, and mobile. | More snapshot data and migration paths. |
| Desktop editable, mobile read-only stacked order | Good for dashboards where drag/resize is mainly a desktop workflow. | Mobile users need a separate reorder/settings interface if editing is required. |

### Data-model signal

Persist the smallest stable layout contract. Do not persist pointer positions, DOM measurements, isDragging flags, or chart runtime state inside the layout snapshot.

### Snapshot, breakpoint, interaction, and pending-save ownership

Represent canonical rectangles in logical grid coordinates, separate from transient pixel preview. DashboardSnapshot carries schemaVersion for migration and revision for concurrency. PendingLayout overlays a command until reconciliation.

### Client model
| Record | Key fields | Owner |
| --- | --- | --- |
| LayoutDocument | schemaVersion, revision, widgets, columns, breakpoints | Server cache |
| WidgetRect | id, x, y, width, height, constraints | Canonical grid |
| DragSession | widgetId, origin, candidate, pointerId | Local interaction |
| PendingLayout | commandId, basedOnRevision, breakpoint, patch | Optimistic overlay |

# Failure Modes

## Performance, sync, and edge cases

The performance answer should name the expensive boundary. The costly mistake is not drag itself; it is doing layout reads, collision scans, widget rerenders, JSON serialization, storage writes, or network mutations for every pointermove.

### Hot-path boundaries
| Boundary | What happens there | What to avoid | Better approach |
| --- | --- | --- | --- |
| pointermove | Receives many events per second and records latest pointer coordinates. | setState/store dispatch plus collision and persistence work on every event. | Store latest input in a controller/ref and schedule one rAF if none is pending. |
| requestAnimationFrame | Runs at most once per frame and computes the visible candidate rectangle. | Reading layout after writing styles, causing forced reflow. | Read container metrics before the interaction, then write transform/placeholder styles together. |
| Framework commit | Updates durable layout state and rerenders containers. | Rerendering every heavy chart/table on each tiny pointer delta. | Commit on grid-cell change, drag end, or a throttled preview; memoize widget content. |
| Persistence | Serializes layout and writes localStorage or calls an API. | JSON.stringify, storage writes, and fetch requests inside the move loop. | Persist on pointerup/keyboard confirm/Save with retry and visible save status. |

---

### Optimization trade-offs
| Topic | Choice | Trade-off |
| --- | --- | --- |
| rAF batching | Batch visual updates in requestAnimationFrame. | Keeps frames predictable, but the code must handle dropped intermediate pointer events by using the latest input. |
| Collision indexing | Bucket widgets by row/column or active region. | Reduces scans for large dashboards, but adds bookkeeping and invalidation complexity. |
| Transform previews | Move the active widget with transform before committing grid position. | Smooth preview, but final layout still needs a committed rectangle and accessible DOM order policy. |
| Widget memoization | Keep chart/table internals stable while only containers move. | Improves drag smoothness, but stale props bugs are possible if widget data dependencies are hidden. |
| Virtualization | Render only visible widgets in very tall dashboards. | Useful for large dashboards, but drag across virtual boundaries needs placeholder and scroll handling. |

### Optimistic layout vs persisted layout
| Approach | Benefit | Risk | Mitigation |
| --- | --- | --- | --- |
| Optimistic local layout | The dashboard feels instant after drop. | Save can fail or another device can have a newer revision. | Show save status and keep the authoritative revision. |
| Wait for server before applying | UI always reflects persisted truth. | Drag/drop feels laggy and failure blocks editing. | Use only for highly regulated dashboards; otherwise prefer optimistic commit. |
| LocalStorage only | Simple and works offline on one device. | No cross-device sync and data can be cleared. | Good baseline for interview scope; mention server sync as an extension. |
| Server-backed per-user layout | Cross-device restore and policy support. | Needs conflicts, auth, migrations, and failure states. | Persist on commit; use schemaVersion for migration and revision for conflicts. |

### Performance validation path
1. **1. Baseline:** Record dragging and resizing 20-50 widgets with charts/tables loaded.
2. **2. Inspect frames:** Look for long tasks, forced reflow, excessive component updates, layout/paint spikes, and INP regressions.
3. **3. Move work:** Move storage, analytics, server sync, and heavy collision compaction out of pointermove.
4. **4. Protect widgets:** Memoize heavy widgets and move only their containers or a drag preview layer.
5. **5. Verify edges:** Test dense collisions, fast pointer movement, window resize during edit, failed saves, keyboard moves, and mobile stacked layouts.

### Layout interaction and synchronization edge cases
| Edge case | Frontend behavior |
| --- | --- |
| Window resizes mid-drag | Either freeze the grid metrics until drop or cancel/recompute safely; do not mix old pointer math with new columns. |
| Widget removed while layout exists | Ignore unknown saved ids and migrate the snapshot on next save. |
| Breakpoint changes | Choose separate breakpoint layouts or derive a stacked mobile order from desktop. |
| Corrupt saved JSON | Discard it, restore defaults, and avoid blocking the page. |
| Keyboard and pointer edits race | Use one active interaction lock so two controllers cannot mutate the same layout at once. |

### Performance signal

Identify the exact expensive update boundary. Keep pointer input cheap, batch visual work in rAF, commit durable layout intentionally, and persist only after interaction end.

### Conflict, viewport, and interaction recovery

### Failure modes
| Failure | Response | Invariant |
| --- | --- | --- |
| Pointer capture is lost | Cancel preview and restore origin. | No half-dragged state remains. |
| Save response is uncertain | Retain command identity and query the authoritative layout. | Retry cannot double-apply. |
| Breakpoint changes | Project the logical layout through explicit responsive policy. | Stored desktop pixels are not reused blindly. |
| Keyboard move collides | Announce the blocked position and preserve focus. | Pointer and keyboard share constraints. |

### Accessibility behavior

Every widget has a visible handle and keyboard move and resize commands with understandable increments. Announce the candidate position and successful placement through a restrained status region. Drag is never the only path; focus remains on the widget, and reduced motion removes decorative movement without hiding collision or selection state.

### Rollout and measurement

Ship read-only layout projection, then pointer preview, keyboard operations, and persistence as separate flags. Profile pointer latency with real widget contents and monitor failed saves, conflict recovery, undo success, clipped layouts, focus loss, and mobile reflow.

### Technical references
- [MDN Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) — Unified pointer input and pointer capture concepts.
- [W3C grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) — Keyboard interaction considerations for composite grids.

# Metrics

Measure task completion and recovery before optimizing isolated rendering numbers. Track time to first useful UI, interaction latency by input mode, request and mutation failure rates, stale-response suppressions, retry outcomes, focus-restoration failures, layout overflow, and accessibility regressions. Segment field results by device capability, network class, viewport, and reduced-motion preference. Numeric targets begin as testable budgets and should be revised from production distributions.

# Rollout

Ship the smallest client slice that preserves identity, cancellation, recovery, accessibility, and observability. Validate the UI-facing contracts with deterministic fixtures, release behind a feature flag where appropriate, compare user outcomes and error distributions, and expand only after the failure and rollback paths have been exercised.

## Public API and accessible controls

The public API should hide pointer math and collision internals. Consumers provide widgets and receive committed layout snapshots; the layout system owns movement, resize, keyboard editing, and persistence hooks.

```ts
type LayoutSaveReason = 'drag' | 'resize' | 'keyboard' | 'reset' | 'save' | 'undo';

interface LayoutCommit {
  commandId: string;
  basedOnRevision: number;
  breakpoint: Breakpoint;
  layout: WidgetLayout[];
  reason: LayoutSaveReason;
}

interface DashboardLayoutProps {
  breakpoint: Breakpoint;
  grid: GridConfig;
  snapshot: DashboardSnapshot;
  editable: boolean;
  renderWidget: (widget: WidgetLayout) => unknown;
  onLayoutCommit: (commit: LayoutCommit) => void;
  onLayoutPreview?: (preview: { breakpoint: Breakpoint; layout: WidgetLayout[] }) => void;
  onSaveStatusChange?: (status: 'idle' | 'saving' | 'saved' | 'failed' | 'conflict') => void;
}

interface LayoutClient {
  saveLayout(input: LayoutCommit & { signal: AbortSignal }): Promise<DashboardSnapshot>;
  getLayout(input: { signal: AbortSignal }): Promise<DashboardSnapshot>;
}

interface DashboardLayoutHandle {
  resetLayout(): void;
  undo(): void;
  focusWidget(id: string): void;
  moveWidgetByKeyboard(id: string, delta: { x: number; y: number }): void;
  resizeWidgetByKeyboard(id: string, delta: { width: number; height: number }): void;
}

```

### API decisions
| Interface choice | Good version | Avoid |
| --- | --- | --- |
| Commit callback | onLayoutCommit fires once after drag, resize, keyboard confirm, reset, or explicit Save. | Calling parent on every pointermove and forcing app-wide rerenders. |
| Preview callback | Optional and documented as throttled/rAF-batched for analytics or ghost UI only. | Treating preview updates as durable layout state. |
| Widget rendering | renderWidget receives layout metadata but does not receive pointer events or collision internals. | Letting every widget implement its own drag and resize behavior. |
| Imperative handle | Expose focused operations like reset, focusWidget, keyboard move, keyboard resize. | Exposing raw internal maps, DOM nodes, or collision queues. |
| Persistence status | Report saving/saved/failed so the page can show non-blocking feedback. | Blocking pointer interactions while a layout save request is pending. |

### Keyboard and accessible alternatives
| Need | Implementation | Why it matters |
| --- | --- | --- |
| Move without pointer | Focusable widget handles support arrow keys for one-cell moves and Shift+Arrow for larger moves. | Keyboard users can reorder the dashboard without drag gestures. |
| Resize without pointer | A focused resize handle or menu updates width/height in grid steps and announces the new size. | Resize is not hidden behind mouse-only corners. |
| Screen reader feedback | Announce position and size changes in a polite live region, e.g. Revenue chart moved to column 3 row 2. | Users get confirmation without needing to infer visual movement. |
| Fallback editor | Offer a list/table editor for order, width, and height when drag is hard on mobile or assistive tech. | Complex spatial editing remains usable across devices. |

### API signal

A strong API makes the hard part look boring: layout in, committed layout out, widget renderer as a slot, and accessible controls included by the layout system.

### UI-facing contract

`saveLayout` accepts a revision precondition, idempotency key, breakpoint, and the complete logical layout for that breakpoint. It returns a full authoritative snapshot or a newer conflict snapshot. Components receive grid-to-pixel projections and intent callbacks; they do not issue storage writes from pointermove.

### From drag intent to revision-aware reconciliation
1. **Capture:** Start one drag session from pointer or keyboard intent and preserve the authoritative origin.
2. **Preview:** Compute transforms and collision feedback without rewriting every widget entity.
3. **Commit:** On drop, validate constraints and send one breakpoint-scoped command against the base revision.
4. **Reconcile:** Replace or remove the overlay from the returned server revision and restore meaningful focus.
