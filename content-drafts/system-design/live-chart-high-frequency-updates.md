---
title: "Live Chart Rendering (High Frequency Updates)"
slug: "live-chart-high-frequency-updates"
family: "system-design"
tech: "frontend"
audience: "Frontend engineers preparing for system design interviews"
intent: "Teach a concrete frontend architecture answer with explicit state, failure, accessibility, and rollout decisions."
target_words: 2400
primary_keyword: "live chart rendering frontend system design"
status: "converted"
notes_for_conversion:
  - "Keep the route, question ID, and access level stable."
  - "Keep backend execution out of scope; describe only UI-facing contracts."
  - "Maintain parity with the five shipped RADIO sections."
search_intent: "Prepare a frontend system design answer for Live Chart Rendering (High Frequency Updates)."
reader_promise: "The reader can explain the frontend state, architecture, interfaces, failure recovery, accessibility, and rollout decisions for Live Chart Rendering (High Frequency Updates)."
unique_angle: "Design a live chart that ingests bursty samples, renders on demand, bounds memory, downsamples by viewport, recovers from gaps, and remains accessible."
what_this_adds_beyond_basics: "Adds an end-to-end worked example, state ownership, recovery, accessibility, and measurable rollout guidance for Live Chart Rendering (High Frequency Updates)."
competitor_query: "Live Chart Rendering (High Frequency Updates) frontend system design"
competitor_takeaways:
  - "Catalog pages commonly list components but stop before reconciliation and failure recovery."
  - "Reference material is strongest when it anchors browser behavior in official platform guidance."
competitor_gaps:
  - "A state transition is often described without showing the visible UI result or preserved invariant."
  - "Accessibility, mobile reflow, cancellation, and rollback are frequently treated as afterthoughts."
sources:
  - "https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame"
  - "https://www.w3.org/WAI/tutorials/images/complex/"
last_fact_checked_at: "2026-07-28"
reviewed_by: "FrontendAtlas editorial migration"
confidence: "high"
---
# Prompt

live chart rendering frontend system design. Design a live chart that ingests bursty samples, renders on demand, bounds memory, downsamples by viewport, recovers from gaps, and remains accessible.

## Requirements

Design a live-chart pipeline that retains authoritative samples in a bounded window and schedules at most one paint of the latest projection during bursts.

---

Design a live line chart whose normal source cadence is about two samples per second but can burst much faster. Decide how samples enter a bounded time window, how the chart coalesces a burst into one pending paint, how it recovers from gaps, and how rendering remains useful during long sessions. Choose SVG, Canvas, WebGL, or a library from measured point count, series count, interaction, and accessibility needs.

Decision surface:
- Incremental updates vs full redraw: append + shift vs recompute whole series.
- Understanding of rendering primitives: SVG vs Canvas vs WebGL; ECharts/Chart.js vs custom.
- Whether you know when to use requestAnimationFrame instead of a raw timer.
- Awareness of memory growth (unbounded arrays) and how to cap it.
- How authoritative samples remain retained while paint notifications coalesce and the visible projection may be explicitly downsampled.
- When tools like OffscreenCanvas/Web Workers become relevant.

---

### High-level flow Describe

1. Data arrives: Every ~500ms, a new sample (timestamp + value) is pushed from some data source (WebSocket, SSE, polling, etc.) into your frontend stream.
2. Update in-memory buffer: You append the new point into a bounded buffer (e.g. last 60s or last N points) and drop/shift old points so the array doesn’t grow forever.
3. Schedule a render: Instead of redrawing immediately for every sample, mark the chart dirty and schedule one requestAnimationFrame callback only when no paint is already pending. Samples that arrive before that callback are coalesced.
4. Render efficiently: The scheduled callback reads the latest bounded snapshot, renders once, clears the pending handle, and schedules another frame only if data became dirty during rendering.
5. Run over time: As the chart runs for minutes or hours, memory remains bounded, the frame rate stays acceptable, and you can still zoom/pan or inspect data without the page freezing.

### Streaming chart guarantees

- The chart should feel smooth, not jumpy, over long periods (minutes+).
- Memory usage must stay bounded (no unbounded growth of points).
- Paint requests may be coalesced during bursts as long as the next paint uses the latest retained state.
- The main thread must not be blocked by heavy chart calculations.
- On low FPS devices, the chart should degrade gracefully (e.g. fewer drawn points).
- The design should make it possible to test and debug data vs rendering separately.

### Early design axes

| Axis | Options | Design rationale |
| --- | --- | --- |
| Rendering primitive | SVG vs Canvas vs WebGL / chart library | Start with a library or semantic SVG when the measured series and point count remain modest. Move to Canvas or WebGL only when profiling shows DOM or draw cost is the limiting factor, while retaining an accessible data summary. |
| Update strategy | Incremental vs full redraw | Compare the library’s incremental path with a bounded full redraw under representative series and viewport sizes. Do not assume a point threshold or redraw strategy before profiling. |
| Render loop control | Timer vs requestAnimationFrame | Decouple data arrival from painting with a bounded store and at most one pending requestAnimationFrame. Do not run an empty perpetual loop when no visual change is waiting. |
| Data retention | Sliding window vs full history | Choose an explicit retention contract such as a recent time window or point budget. The ring buffer evicts data outside that contract while historical inspection uses a separate query path. |
| Off-main-thread work | Main thread vs Web Worker + OffscreenCanvas | Move transformation or drawing to a worker only when representative profiling attributes interaction delay to chart work and the added transfer and synchronization cost remains worthwhile. |

| Signal | Value | Interpretation |
| --- | --- | --- |
| Update cadence | ~500 ms | Data tick frequency; rendering may be decoupled from this. |
| Memory rule | Bounded buffer | Keep only the last N points / last X seconds. |
| Render control | requestAnimationFrame | Never paint more often than the display refreshes. |

### Scope checkpoint

A complete answer explains bounded buffering, burst coalescing, on-demand painting, measured renderer choice, viewport-aware downsampling, gap recovery, background-tab behavior, and an accessible nonvisual summary.

### Frontend boundary

The client owns stream validation, ring buffers, visible-window selection, render scheduling, renderer choice, inspection, and accessible summaries. Server-side metric production, aggregation authority, and historical storage remain abstract contracts.

# Clarifying Questions

- How long of a history window do we need to show (last 30s, 5min, 1h)?
- What is the maximum update rate (500ms always, or bursts faster than that)?
- Do we ever need to pause, zoom, or scroll back in time, or is it just a live strip chart?
- How many series do we need to render at once (1 line vs 10+ lines)?
- What are the target devices? Desktop only, or also low-end mobiles?
- Is using a third-party chart lib acceptable, or are we expected to implement custom Canvas/WebGL?

# Architecture

Structure the live chart around stream validation, bounded per-series buffers, an on-demand render scheduler, and a replaceable renderer. This keeps data cadence separate from paint cadence without spending frames when nothing changed.

---

Use a stream adapter feeding per-series ring buffers, a selector that builds the visible time window, and a render scheduler with at most one pending animation-frame callback. Data arrival and painting are decoupled without running an empty frame loop. The renderer remains replaceable and is chosen after profiling.

The pipeline is source to validated samples to bounded buffers to visible-window selector to scheduled paint. Renderer choice follows profiling. Worker-based transformation or OffscreenCanvas is a later option only when measured main-thread cost justifies its complexity.

---

### Core building blocks

| Piece | Responsibility | How you explain it |
| --- | --- | --- |
| Data source | Produces new samples every ~500ms (or faster in bursts). | "A data source (WebSocket, SSE or polling) pushes (timestamp, value) samples into the frontend stream." |
| Live store / buffer | Owns a bounded sliding window of recent points. | "A small store keeps only the last X seconds or last N points. Every new sample is appended; old samples are evicted so memory stays bounded." |
| On-demand render scheduler | Decides when to redraw the chart; coalesces multiple updates. | scheduleRender marks the view dirty and creates one animation-frame callback only when none is pending. The callback paints the newest visible snapshot and stops unless more data became dirty. |
| Chart renderer | Draws the line series using the profiled library or browser primitive. | The renderer reads a bounded, downsampled view model. SVG, Canvas, or WebGL remains an implementation decision, not an architectural invariant. |
| Optional worker/offscreen layer | Offloads heavy work from the main thread (later optimization). | "If the stream is heavy, we can move data processing or even rendering to a Web Worker with OffscreenCanvas, so the main thread stays responsive." |

---

State & components at a glance
Represent a minimal architecture with a store and a chart view:

```text
interface SamplePoint { t: number; v: number }

interface RingBuffer<T> {
  push(value: T): void;
  snapshot(): readonly T[];
}

interface RenderState {
  dirty: boolean;
  frameId: number | null;
}

class LiveChartController {
  private renderState: RenderState = { dirty: false, frameId: null };

  constructor(
    private readonly points: RingBuffer<SamplePoint>,
    private readonly render: (points: readonly SamplePoint[]) => void,
  ) {}

  push(sample: SamplePoint): void {
    this.points.push(sample);
    this.renderState.dirty = true;
    this.scheduleRender();
  }

  private scheduleRender(): void {
    if (this.renderState.frameId !== null) return;
    this.renderState.frameId = requestAnimationFrame(() => {
      this.renderState.frameId = null;
      if (!this.renderState.dirty) return;
      this.renderState.dirty = false;
      this.render(this.points.snapshot());
      if (this.renderState.dirty) this.scheduleRender();
    });
  }
}

```

Data can arrive more or less often than display frames. The scheduler coalesces pending work and draws the latest visible snapshot only when needed.

### Rendering pipeline decisions

- Data arrival and rendering are decoupled (source vs rAF).
- The store keeps a sliding window of points, not infinite history.
- Each new sample updates the store and marks the chart as dirty.
- The scheduled paint uses the latest buffer, not one update per sample.
- Renderer choice follows measured point count, draw cost, interaction, and accessibility needs.

### Architecture pitfalls to avoid

- Redrawing synchronously inside every data tick (e.g. every WebSocket message).
- Letting the points array grow unbounded over time.
- Creating new chart instances on each update instead of updating one instance.
- Running heavy aggregation or downsampling inside the animation-frame callback.
- Tying the chart directly to the data source instead of an intermediate store.

### High-level flow

1. Initialize chart: Create the chart instance (library or custom Canvas), configure axes and styles, and initialize an empty LiveChartStore with a max window size.
2. Start data stream: Subscribe to a WebSocket/SSE/polling source. Every time a sample arrives, normalize it into SamplePoint and call store.push(point).
3. Schedule the first needed paint: When accepted data marks the view dirty, request one animation frame if none is pending. Render the latest points once and stop until another change arrives.
4. Incremental vs full updates: If the charting API allows, append the new point and remove the oldest point from the series (incremental). Otherwise, re-set the series data from the current points buffer and let the renderer redraw the line.
5. Long-running behavior: As time passes, the store keeps the buffer bounded; old data is dropped or aggregated. If CPU usage becomes high, you can later move expensive math to a Worker or adjust how many points you draw.

| Signal | Value | Interpretation |
| --- | --- | --- |
| Core pipeline | Source → Buffer → Selector → Scheduled paint | Each stage has a clear job. |
| Memory rule | Sliding window | Always cap the number of points in memory. |
| Rendering primitive | Profile-driven | SVG, Canvas, WebGL, or a library can be correct for different workloads. |

### Stream and paint ownership

The architecture combines a validated stream, bounded ring buffers, visible-window selection, and an on-demand paint scheduler. Renderer choice follows profile evidence, while an accessible table or summary gives nonvisual access to current values.

### Worked example: burst followed by background-tab suspension

A chart normally receives two samples per second, then gets one hundred samples in a burst just before the tab is hidden. The renderer should not queue one hundred paints or assume animation frames continue in the background.

### Scenario walkthrough

| Event | Store change | Visible UI | Invariant |
| --- | --- | --- | --- |
| Burst enters | Validate order and append to bounded per-series ring buffers. | The chart remains on its last coherent frame. | Sample storage is independent from paint count. |
| First sample marks dirty | Create one pending animation-frame handle. | No synchronous redraw blocks ingestion. | At most one paint is pending. |
| Remaining burst arrives | Update buffers and dirty state without adding frame callbacks. | One later paint uses the newest visible window. | Intermediate visual states may coalesce. |
| Tab backgrounds and returns | Cancel or tolerate the pending frame, apply retention policy, then schedule from latest state on visibility return. | The chart catches up once with stale-gap context. | Suspension does not create a replay storm. |

# Tradeoffs

## Data

---

Model accepted samples in bounded per-series ring buffers and keep paint scheduling in separate runtime state. A retention policy decides whether source samples are preserved or aggregated; render coalescing never implies sample loss.

State-model checks:
- Sample identity, timestamp, value, and optional sequence are explicit.
- Bounded buffers enforce the visible retention contract.
- Sample retention and paint coalescing are separate policies.
- Dirty state and animation-frame handles remain runtime-only.
- Sequence gaps are represented instead of silently sorted away.

---

```typescript
type SeriesId = string;
type SampleRetention = 'preserve' | 'aggregate-window' | 'latest-per-series';

interface SamplePoint {
  id: string;
  t: number;
  v: number;
  sequence?: number;
}

interface LiveChartConfig {
  windowMs: number;
  maxPointsPerSeries: number;
  sampleRetention: SampleRetention;
}

interface SeriesBuffer {
  id: SeriesId;
  points: readonly SamplePoint[];
  lastSequence: number | null;
  gapAfterSequence: number | null;
}

interface LiveChartState {
  config: LiveChartConfig;
  series: Record<SeriesId, SeriesBuffer>;
  freshness: 'live' | 'stale' | 'gap';
}

interface RenderRuntime {
  dirty: boolean;
  frameId: number | null;
  lastPaintAt: number | null;
}

```

### Core entities

| Entity | Fields (example) | How you explain it |
| --- | --- | --- |
| SamplePoint | t, v | "Each data point is a { t, v } pair: t is the timestamp in ms, v is the numeric value. All rendering and windowing logic uses this structure." |
| LiveChartConfig | windowMs, maxPointsPerSeries, sampleRetention | The configuration bounds memory and states whether accepted samples are preserved, aggregated, or reduced to the latest value. |
| SeriesState | id, points[] | "SeriesState tracks one line on the chart: it has an id and a sorted points[] array that holds only the points within the current window and under maxPoints." |
| RenderRuntime | dirty, frameId, lastPaintAt | Runtime scheduling state coalesces paints independently from sample retention. |
| SeriesBuffer | points, lastSequence, gapAfterSequence | The buffer preserves the chosen retention contract and makes missing source data visible. |

### Required fields

- A time-based window (windowMs) so you don’t hold hours of data in memory by accident.
- A maxPoints cap per series, to keep draw calls cheap and arrays small.
- Per-series points[] that are sorted by time for easier rendering and trimming.
- Dirty state plus a nullable pending frame handle so the scheduler avoids duplicate or empty work.
- A freshness or gap state that survives render coalescing.
- A sample-retention policy separate from the always-coalesced paint scheduler.

### Chart-state pitfalls

- Letting points[] grow indefinitely with no cap.
- Mixing chart instance or library objects into your state (keep it serializable).
- Storing duplicate data (same sample in multiple arrays) without a reason.
- Relying purely on index-based trimming without aligning to timestamps (time window).
- Not distinguishing between config and runtime state (e.g. hardcoding window size).
- No way to measure backlog, so you don’t know when to drop vs queue.

### How the data evolves over time

1. Initialization: On mount, create empty per-series buffers with a product-defined time window, point cap, sample-retention policy, and idle RenderRuntime.
2. New sample arrives: The data source produces { t, v } for a series id. You normalize it into SamplePoint and push it into the corresponding SeriesState.points array.
3. Trim & cap: After inserting, you drop any points older than now - windowMs, and if points.length > maxPoints, you trim the oldest points until the cap is respected.
4. Mark as dirty: Mark RenderRuntime dirty and request one frame if none is pending. Do not discard accepted samples merely because several arrivals share one visual paint.
5. Render & reset flags: When the scheduled callback draws successfully, clear the pending frame handle, update lastRenderedAt, and schedule one more callback only if new data made the view dirty during rendering.

| Signal | Value | Interpretation |
| --- | --- | --- |
| Core primitive | SamplePoint { t, v } | Everything else is just managing arrays of these. |
| Memory guardrail | windowMs + maxPoints | Together they cap time span and number of points. |
| Burst control | dirty + frameId | At most one paint is pending while retained samples continue to merge. |

### State checkpoint

If you can describe the live chart as SamplePoint arrays inside a bounded LiveChartState with clear windowing and overload rules, you show that you’re designing a streaming system as data first, not as a tangle of chart-library calls.

### Sample and render state ownership

Keep timestamped samples in per-series ring buffers with sequence or source revision when available. RenderState stores dirty and pending frame handle; the handle is runtime-only. ViewWindow describes time range and pixel width for downsampling. AccessibleSummary stores latest value, trend, range, and freshness independently from canvas pixels.

### Client model

| Record | Key fields | Owner |
| --- | --- | --- |
| SeriesBuffer | seriesId, ring, lastSequence, gaps | Controller |
| RenderState | dirty, frameId, lastPaintAt | Runtime |
| ViewWindow | start, end, pixelWidth | View state |
| AccessibleSummary | latest, min, max, trend, freshness | Semantic view |

## Interfaces

Expose a small chart API that accepts series metadata, samples, a visible time window, and interaction callbacks while hiding buffering, the on-demand render scheduler, and downsampling. Consumers should not manage animation-frame handles.

---

Expose series definitions, a controller that accepts samples, renderer selection, visibility, and an accessible summary. Internally the module owns bounded buffers, the visible window, and on-demand render scheduling.

Contract checks:
- Simple inputs: series ids, config (window length, max points), and a way to feed samples.
- Simple outputs: a React/Angular/Vue view, or props to pass into a chart component.
- No leaking of internal details like requestAnimationFrame, queues, or downsampling logic.
- A clear place where overload behavior (drop vs queue) is configured.

---

```typescript
interface LiveSeriesConfig {
  id: SeriesId;
  label: string;
  unit: string;
  color?: string;
}

interface LiveChartOptions {
  windowMs: number;
  maxPointsPerSeries: number;
  sampleRetention: SampleRetention;
}

interface LiveChartController {
  pushSample(seriesId: SeriesId, sample: SamplePoint): void;
  setVisible(visible: boolean): void;
  setWindow(windowMs: number): void;
  destroy(): void;
}

interface LiveChartProps {
  series: LiveSeriesConfig[];
  controller: LiveChartController;
  renderer: 'svg' | 'canvas' | 'webgl';
  accessibleSummary: string;
  onInspectPoint?: (seriesId: SeriesId, timestamp: number) => void;
}

```

### Core interfaces

| Interface / prop | Shape (example) | How you explain it |
| --- | --- | --- |
| LiveSeriesConfig | { id, label, color? } | "LiveSeriesConfig lets the caller declare one or more lines by id. The id is used to route incoming samples; label/color are just presentation details." |
| LiveChartOptions.windowMs | number (ms) | "windowMs defines how much recent history we keep visible on the chart, e.g. last 60 seconds. Older points are trimmed automatically." |
| LiveChartOptions.maxPointsPerSeries | number | "maxPoints caps the number of points per series in memory and on screen. This is our main memory and performance guardrail." |
| LiveChartOptions.sampleRetention | 'preserve' \| 'aggregate-window' \| 'latest-per-series' | The contract states how accepted samples are retained. Paints always coalesce to at most one pending frame without changing this policy. |
| LiveChartController.pushSample | (seriesId, { t, v }) => void | "The rest of the app calls pushSample whenever a new data point arrives (from WebSocket, polling, etc.). The hook updates its buffers and marks the chart dirty." |
| LiveChartProps.renderer | 'svg' \| 'canvas' \| 'webgl' | The selected renderer is explicit at the boundary but chosen from profile evidence rather than hard-coded into the controller. |
| LiveChartController.setVisible | (visible: boolean) => void | Visibility pauses visual work when the widget is hidden while the controller applies an explicit retention policy to incoming samples. |

### Public behavior

- A way to declare series (ids + labels).
- Config for window, maxPointsPerSeries, and sampleRetention.
- A simple pushSample(seriesId, sample) entry point.
- A reference/element where the chart will render (canvas or container).
- Visibility and destroy controls for subscriptions, pending frames, observers, and worker resources.

### Renderer-internal state

- Raw requestAnimationFrame handles or timer ids.
- Internal buffers or points[] arrays unless there is a clear use case.
- Chart-library-specific details (ECharts options, Chart.js internals) from the core API.
- Per-frame callbacks that force consumers to manage drawing themselves, unless this is explicitly a low-level API.
- Implementation flags like hasNewDataInternal that don’t map to real decisions for consumers.

### Integration flow

1. Declare series & config: The feature defines the lines it wants to show, creates a controller with the measured window and overload policy, and passes the controller plus series metadata into LiveChart.
2. Wire data source: Wherever WebSocket/SSE/polling lives, it calls pushSample(seriesId, { t, v }) on each new reading.
3. Render chart view: The chart mounts the selected renderer host. Accepted samples mark the controller dirty; it schedules one paint, draws the latest bounded snapshot, and remains idle when no visual change is pending.
4. Handle lifecycle: On visibility changes, call setVisible(false) to pause visual scheduling while applying the declared retention policy. On unmount, call destroy() to cancel frames, observers, subscriptions, and worker resources.
5. Tweak behavior: If measured performance or memory changes, adjust windowMs, maxPointsPerSeries, or sampleRetention without changing view integration.

| Signal | Value | Interpretation |
| --- | --- | --- |
| Main inputs | series + options | What to draw and how much history to keep. |
| Main action | pushSample | Single entry point for all incoming data. |
| Main abstraction | LiveChartController + LiveChart | Hides buffering & rAF; exposes a simple view. |

### Contract checkpoint

From the outside, your live chart should feel like: "declare series, call pushSample, and get a smooth chart." If a teammate never has to think about requestAnimationFrame, buffering, or downsampling, you’ve designed a good API.

### UI-facing contract

The stream adapter emits typed samples and lifecycle gaps. pushSample never requires the caller to know animation frames. setVisible controls visual scheduling and retention policy. Renderer implementations consume the same bounded view model, and the chart exposes a table or summary even when Canvas or WebGL draws pixels.

### Sample-to-paint path

1. Validate sample envelope: Reject malformed points, duplicate sequence, and impossible timestamps according to policy.
2. Retain bounded sample: Append in bounded storage and record a gap without sorting the entire history.
3. Schedule one pending paint: Set dirty and request one frame only if none is pending.
4. Paint visible projection: Select and downsample to the viewport, render once, then stop unless dirtied again.

# Failure Modes

Cover how you keep updates smooth, how you control memory, and how you behave under overload (bursts of data or big datasets).

---

Begin with bounded buffers, the simplest suitable renderer, and one pending paint scheduled only when dirty. Measure interaction latency, draw cost, memory, and CPU over long sessions before tuning window size, downsampling, workers, or renderer choice.

Chart quality checks:
- Correct sample retention precedes rendering optimization.
- Full redraw and incremental paths are compared with representative data.
- Paint coalescing is not described as sample dropping.
- Ring buffers and time windows bound long-session memory.
- Workers, OffscreenCanvas, Canvas, and WebGL require measured justification.

---

### Baseline performance safeguards

- Choose SVG, Canvas, WebGL, or a chart library from measured draw cost, point count, interaction, and accessibility requirements.
- Keep a bounded sliding window (by time and/or maxPoints) instead of storing all history.
- Keep at most one pending requestAnimationFrame and schedule it only when data or interaction makes the view dirty.
- Keep the animation-frame callback small; prepare bounded visible data before paint or in measured background work.
- Reuse the same chart/canvas instance; avoid re-creating the chart object on every update.

### Deep-dive topics that impress

- Profile full redraw and incremental update strategies with representative series counts and viewport sizes before choosing a renderer.
- Describe a downsampling strategy (e.g. keep min/max in buckets) when there are more points than pixels.
- Mention using a ring buffer instead of shifting arrays to avoid GC pressure.
- Discuss moving data processing (and maybe rendering) to a Web Worker + OffscreenCanvas under heavy load.
- Explain that render notifications may coalesce while retained samples remain governed by an explicit data contract.

### Deep-dive decisions

| Topic | Angle | Decision rationale |
| --- | --- | --- |
| Incremental vs full redraw | Trade-offs by point count | Profile bounded full redraw and incremental updates with representative series, viewport, interaction, and device conditions; choose the simpler path that meets the product budget. |
| Paint coalescing under bursts | What happens under bursts | Coalesce multiple dirty notifications into one paint of the latest retained buffer. Any aggregation or sample loss must come from the explicit data-retention contract, not the frame scheduler. |
| Memory management | Sliding window & caps | Configure a measured time or point retention budget and enforce it on insertion. The buffer remains bounded over long sessions without pretending the chosen budget fits every workload. |
| Downsampling | Too many points per pixel | When several retained points map to one horizontal pixel, create a derived display series using an explicit min/max/average or domain-specific aggregation. Keep the retained source window separate from this visual projection. |
| OffscreenCanvas / Workers | Offloading heavy work | If representative profiles attribute interaction delay to chart transforms, move eligible work to a Web Worker. OffscreenCanvas is a further measured option when browser support and transfer costs fit the product. |

### Rendering optimization rollout

1. Ship a correct, bounded baseline: Implement a sliding time window with bounded ring buffers and an on-demand render scheduler. Begin with the simplest renderer that meets interaction needs, then run long sessions to measure memory, CPU, gaps, and background-tab recovery.
2. Profile real usage: Use performance tools to record a few minutes of activity. Look at frame time, CPU hotspots, GC pauses, and memory usage as the chart runs.
3. Tweak window & caps: Adjust windowMs and maxPoints so you balance "enough history" with "cheap redraws". Often you don’t need minute-level detail for a live strip chart.
4. Introduce downsampling: If you still have too many points, apply a downsampling strategy (e.g. per-pixel min/max) before drawing, so the renderer sees fewer points without losing visual shape.
5. Offload work if needed: If the main thread is still overloaded, move transformations to a Worker and consider OffscreenCanvas so rendering doesn’t block input, hover states, or other UI.

| Signal | Value | Interpretation |
| --- | --- | --- |
| Key performance lever | Bounded points | Cap how much you draw each frame. |
| Key smoothness lever | rAF-driven redraw | Aligns rendering with screen refresh. |
| Key scalability lever | Downsampling + Workers | Keeps charts responsive on large or long-running streams. |

### Bounded rendering invariant

The robust design keeps bounded ring buffers, schedules paint only when dirty, coalesces bursts, downsamples to visible resolution, resumes after background suspension, and moves proven heavy work off the main thread.

### Stream and renderer failures

### Failure modes

| Failure | Response | Invariant |
| --- | --- | --- |
| Sequence gap appears | Mark freshness and request a repair range. | Known data remains inspectable. |
| Renderer throws | Isolate the chart view and keep the semantic summary. | One canvas failure does not remove context. |
| Resize races paint | Invalidate the view window and coalesce one new paint. | Axes match the current viewport. |
| Worker stalls | Fall back to bounded main-thread processing or a reduced summary. | Interaction remains available. |

### Accessibility behavior

A chart needs a named figure, textual summary, units, current freshness, and a data-table or inspection alternative appropriate to the product. Pointer hover is never the only way to inspect a point. Keyboard navigation and focus indicators are explicit, motion can be reduced, and burst updates are summarized rather than announced sample by sample.

### Rollout and measurement

Baseline the simplest renderer with representative series, points, viewport sizes, refresh rates, and hardware. Add downsampling, worker transforms, Canvas, or WebGL only after profile evidence. Monitor long tasks, input delay, buffer evictions, gaps, paint count per accepted sample, memory, and summary freshness.

### Technical references

- [MDN requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) — Frame scheduling behavior and background-tab pausing.
- [W3C complex images tutorial](https://www.w3.org/WAI/tutorials/images/complex/) — Text alternatives for charts and other complex images.

# Metrics

- Update cadence: ~500 ms. Data tick frequency; rendering may be decoupled from this.
- Memory rule: Bounded buffer. Keep only the last N points / last X seconds.
- Render control: requestAnimationFrame. Never paint more often than the display refreshes.
- Core pipeline: Source → Buffer → Selector → Scheduled paint. Each stage has a clear job.
- Memory rule: Sliding window. Always cap the number of points in memory.
- Rendering primitive: Profile-driven. SVG, Canvas, WebGL, or a library can be correct for different workloads.
- Core primitive: SamplePoint { t, v }. Everything else is just managing arrays of these.
- Memory guardrail: windowMs + maxPoints. Together they cap time span and number of points.
- Burst control: dirty + frameId. At most one paint is pending while retained samples continue to merge.
- Main inputs: series + options. What to draw and how much history to keep.
- Main action: pushSample. Single entry point for all incoming data.
- Main abstraction: LiveChartController + LiveChart. Hides buffering & rAF; exposes a simple view.
- Key performance lever: Bounded points. Cap how much you draw each frame.
- Key smoothness lever: rAF-driven redraw. Aligns rendering with screen refresh.
- Key scalability lever: Downsampling + Workers. Keeps charts responsive on large or long-running streams.

# Rollout

### Rendering optimization rollout

1. Ship a correct, bounded baseline: Implement a sliding time window with bounded ring buffers and an on-demand render scheduler. Begin with the simplest renderer that meets interaction needs, then run long sessions to measure memory, CPU, gaps, and background-tab recovery.
2. Profile real usage: Use performance tools to record a few minutes of activity. Look at frame time, CPU hotspots, GC pauses, and memory usage as the chart runs.
3. Tweak window & caps: Adjust windowMs and maxPoints so you balance "enough history" with "cheap redraws". Often you don’t need minute-level detail for a live strip chart.
4. Introduce downsampling: If you still have too many points, apply a downsampling strategy (e.g. per-pixel min/max) before drawing, so the renderer sees fewer points without losing visual shape.
5. Offload work if needed: If the main thread is still overloaded, move transformations to a Worker and consider OffscreenCanvas so rendering doesn’t block input, hover states, or other UI.

### Technical references

- [MDN requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) — Frame scheduling behavior and background-tab pausing.
- [W3C complex images tutorial](https://www.w3.org/WAI/tutorials/images/complex/) — Text alternatives for charts and other complex images.
