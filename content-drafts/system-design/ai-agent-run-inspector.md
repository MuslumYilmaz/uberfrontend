---
title: "AI Agent Run Inspector Frontend System Design"
slug: "ai-agent-run-inspector"
family: "system-design"
tech: "frontend"
audience: "Senior frontend engineers preparing for system design interviews"
intent: "Help the reader design a trustworthy browser UI for inspecting live and completed AI agent runs without drifting into agent-runtime or backend architecture."
target_words: 3600
primary_keyword: "AI agent run inspector frontend system design"
status: "converted"
notes_for_conversion:
  - "Convert into the system-design JSON bundle and update index.json."
  - "Keep the backend runtime abstract; describe only the contracts the inspector consumes."
  - "Preserve the normalized trace model, idempotent stream merge, accessibility model, and redaction boundary."
search_intent: "Prepare a senior-level frontend system design answer for an AI agent run inspector or trace viewer."
reader_promise: "The reader can explain how to stream, normalize, virtualize, inspect, and safely act on a hierarchical AI-agent trace in the browser."
unique_angle: "Treat the inspector as a live, partially ordered trace document with human approval actions, not as a chat transcript or a static logs table."
what_this_adds_beyond_basics: "It connects event identity, reconnect cursors, orphan spans, virtualized tree navigation, approval races, payload redaction, and restrained screen-reader announcements into one frontend design."
competitor_query: "\"AI Agent Run Inspector Frontend System Design\" OR \"AI agent trace viewer\" \"frontend system design interview\""
competitor_takeaways:
  - "GreatFrontEnd and similar libraries teach a reusable frontend system design framework and cover common application and component prompts."
  - "Current agent UI libraries demonstrate that developers need live event inspectors, tool-call visibility, approval surfaces, and persistent run state."
competitor_gaps:
  - "The reviewed interview catalogs do not provide a standalone end-to-end frontend system design case for an agent run inspector."
  - "Component examples show a trace timeline but rarely connect out-of-order stream reconciliation, orphan spans, virtualization, accessibility, and action races."
sources:
  - "https://www.greatfrontend.com/questions/formats/system-design"
  - "https://hellofrontend.com/frontend-system-design-interview-questions"
  - "https://stealthis.dev/library/"
  - "https://openai.github.io/openai-agents-python/tracing/"
  - "https://openai.github.io/openai-agents-python/human_in_the_loop/"
  - "https://opentelemetry.io/docs/specs/semconv/registry/attributes/gen-ai/"
  - "https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/"
  - "https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA23"
  - "https://developer.mozilla.org/en-US/docs/Web/API/AbortController"
last_fact_checked_at: "2026-07-28"
reviewed_by: "Codex research and editorial pass"
confidence: "high"
---

# Prompt

Design the frontend for an AI agent run inspector used by developers and operators to understand what happened during a live or completed agent execution. This AI agent observability UI can contain nested agent turns, model generations, retrievals, tool calls, handoffs, guardrails, approval requests, retries, and errors. The inspector should stream updates while the run is active, let a user navigate the hierarchy, filter and search spans, inspect redacted inputs and outputs, and take limited actions such as stop, retry, approve, or deny. Treat the agent runtime, trace persistence, and authorization service as backend black boxes. The interview is about the browser-side architecture, state model, rendering strategy, accessibility, resilience, and safe client contracts.

This AI agent run inspector frontend system design prompt is deliberately not a chat-app question; its product surface is an AI agent trace viewer. A chat transcript presents a mostly linear sequence of messages. An agent run is a hierarchical and sometimes concurrent execution document. A parent can start two tools in parallel; a child can arrive before its parent snapshot; one span can stream partial output while another waits for approval. The UI must stay understandable as those facts change.

Assume a typical run has hundreds of spans and an extreme run can have tens of thousands. Span summaries are small, but input and output payloads can be large JSON documents. The run detail page opens from a paginated run list. The initial response gives a snapshot and a resume cursor; a server-sent event or fetch stream carries later events. The API may repeat events after reconnect. The frontend must merge them without changing an already applied result and never infer authority from arrival order alone.

The primary experience is a three-region layout: run summary and controls, a hierarchical trace view, and a detail inspector for the selected span. On a narrow screen, the inspector becomes a drawer or separate detail pane instead of squeezing the trace into unreadable columns. The default view should answer four questions quickly: Is the run still active? Where did it fail or pause? Which operation consumed time or tokens? What input and output are safe for this user to inspect?

Keep six concepts separate from the start:

| Concept | Meaning | Frontend responsibility |
| --- | --- | --- |
| Run | One end-to-end attempt | Route, summary, freshness, and run actions |
| Trace | The hierarchy available for inspection for one agent execution trace | Present a coherent tree and tool call inspector without inventing missing facts |
| Span | One agent, model, retrieval, tool, handoff, guardrail, or approval operation | Keep a compact normalized summary and lazy payload references |
| Event | An immutable streamed fact | Validate, deduplicate, order, and reduce it |
| Cursor | An opaque position for contiguous history | Resume from the last safely reduced position |
| Approval | A versioned request for human authority | Show safe context and pending intent while the server remains authoritative |

# Clarifying Questions

## Users and scope

- Is this an internal developer tool, a customer-facing audit view, or both? Start with an authenticated internal developer who can inspect runs for one project. Permission-aware customer views can reuse the architecture later.
- Are we showing one run or comparing many? The MVP includes a paginated run list and one run detail. Cross-run comparison, aggregate analytics, and evaluation dashboards are follow-ups.
- Which span kinds exist? Use a provider-neutral set: agent, model, tool, retrieval, handoff, guardrail, approval, and custom. Unknown kinds must render with a safe generic row instead of crashing an old client.
- Are reasoning tokens or hidden chain-of-thought displayed? No. The product shows supported summaries, structured events, tool inputs and outputs, errors, durations, and token counts. It does not invent or expose private reasoning.
- Which actions are in scope? Stop an active run, retry an eligible failed span or run, and approve or deny a pending tool action. Editing the workflow or executing tools in the browser is out of scope.

## Scale and freshness

- How many spans can one run contain? Optimize the default path for hundreds, keep interaction smooth at ten thousand or more, and avoid putting large payloads into the row model.
- How live must the UI feel? A visible lifecycle change should normally appear within a few hundred milliseconds of receipt, but rendering can batch bursts to animation frames.
- Can events arrive out of order or repeat? Yes. Every event has an immutable event id, run id, monotonic sequence within the run, server timestamp, and resume cursor. The client tolerates duplicates, gaps, and parents that have not arrived yet.
- How long can a run last? From seconds to hours. The page must reconnect, resume from the last acknowledged cursor, and show when the view is stale rather than pretending it is live.
- Can users open several tabs? Yes. Each tab can maintain its own read connection, while destructive actions use idempotency keys and server-confirmed state. Cross-tab optimization is optional.

## Security and accessibility

- Who redacts secrets? The server is the security boundary and must redact or omit sensitive fields before delivery. The client adds defensive masking and safe rendering, but client masking is not sufficient access control.
- Can payloads contain HTML or untrusted text? Yes. Render as escaped text or a structured JSON tree. Never inject tool output with raw HTML.
- What does keyboard navigation require? Users can move through visible trace rows, expand or collapse parents, open the selected span, reach action controls, and return focus predictably.
- Should every stream delta be announced? No. A polite status region announces meaningful transitions such as run failed, approval requested, reconnecting, or run completed. Token and span deltas remain visually updated without flooding assistive technology.
- What happens on mobile? Preserve readable lines and explicit controls. The trace uses compact rows with horizontal metadata reduced, while payloads scroll inside their own containers rather than widening the page.

## Success criteria

A strong answer should commit to a normalized client store, a deterministic event reducer, a derived flattened tree for virtualization, and separate action state. It should make reconnect behavior explicit, keep payloads out of hot render paths, define accessible interaction semantics, and place redaction before the browser. It should also say what is not being designed: the model loop, tool execution engine, trace database, queue, and distributed runtime.

# Architecture

## Page composition

The run list uses cursor pagination and compact summaries: run id, workflow name, status, start time, duration, span count, error count, and aggregate token or cost values when authorized. Opening a run loads a route-addressable detail page so refresh, back navigation, and support links remain reliable.

The detail shell contains:

1. `RunHeader`: workflow name, status, freshness, elapsed time, aggregate counts, stop or retry controls.
2. `TraceToolbar`: text search, kind/status filters, expand/collapse controls, and an errors-only shortcut.
3. `TraceTree`: a virtualized tree or treegrid of span summaries.
4. `SpanInspector`: selected span metadata, timing, attributes, redacted input/output, errors, and approval controls.
5. `ConnectionStatus`: reconnecting, stale, gap detected, or caught-up states.
6. `LiveAnnouncements`: a small polite live region for important lifecycle messages.

Desktop can show the tree and inspector side by side. Tablet uses a resizable split only if both sides preserve useful minimum widths. Mobile opens the inspector as a full-height drawer or nested route. Selection lives in URL state when practical, for example `?span=span_42`, so a support link can open the relevant operation. Expansion and filters stay local to the page and do not need canonical URLs.

## Data flow

For real-time trace streaming, the route loader first fetches a run snapshot. The snapshot contains run metadata, span summaries, pending approvals, the latest contiguous sequence, and a resume cursor. The client normalizes it into entity maps and establishes a stream from that cursor.

The stream adapter performs transport work only: parse frames, validate the envelope, reject events for another run, and forward typed events to the reducer. Each envelope is a discriminated union: its `type` selects a concrete `data` shape for snapshots, span changes, approvals, or terminal run facts. The reducer switches exhaustively and sends the default branch to `assertNever`, so adding an event type requires an explicit merge policy. It then checks event identity and sequence before an idempotent merge. If span 18 arrives before parent span 12, span 18 enters the entity map and an `orphansByParentId` index. When span 12 arrives, selectors can place the child correctly without rewriting the event history.

The store has three conceptual slices:

- Server document state: run, spans, child indexes, approvals, received event ids, contiguous sequence, cursor, and data freshness.
- View state: expanded ids, selected span id, search query, active filters, column preferences, and inspector tab.
- Action state: pending stop/retry/approve requests, idempotency keys, optimistic labels, and server errors.

Keeping these slices distinct prevents a filter change from touching stream entities and prevents a failed approval request from corrupting the authoritative span state.

## Event reconciliation

Arrival order is not enough. The reducer follows these rules:

- Ignore an event id already applied.
- Reject an event whose run id does not match the route.
- Apply lifecycle fields only when the event sequence is newer than the field's recorded sequence.
- Preserve immutable identity fields even if a malformed later event disagrees.
- Store unknown span kinds as `custom` with the original kind label.
- Track sequence gaps. Continue rendering known events, mark the connection as catching up, and request a delta or new snapshot if the gap does not close.
- Treat `run.completed`, `run.failed`, and `run.stopped` as terminal server facts. A late local command response cannot overwrite a newer terminal event.
- Apply `run.snapshot` only during initial load or explicit recovery. Rebase entities, event identity, contiguous sequence, and cursor atomically before reducing later deltas.
- Keep `approval.requested` and `approval.resolved` payloads versioned and distinct, while `run.completed`, `run.failed`, and `run.stopped` carry status-compatible terminal run payloads.
- Derive the “waiting for approval” header label from a running run plus pending approval entities; do not add it as a competing authoritative run lifecycle.
- Update the resume cursor only after the corresponding event is safely reduced.

Streaming payload fragments need an additional boundary. Small summaries can append in the entity record. Large tool or model output should use a bounded preview and a payload reference. The inspector requests full redacted payload content only when opened. This avoids copying megabytes of JSON on every stream tick.

## Worked example: follow one run through the reducer

Start with `run_42` at contiguous sequence 40. Its snapshot contains `span_agent_10` and cursor `c40`. Sequence 42 then starts `span_tool_17`, but its parent `span_handoff_12` has not arrived because sequence 41 is missing:

```text
run_42 [running]
└─ span_agent_10 [running]
   └─ span_handoff_12 [running]
      └─ span_tool_17 [waiting for approval]
         └─ approval_9 [denied in another tab]
```

| Event | Store update | Visible result | Invariant |
| --- | --- | --- | --- |
| Snapshot through seq 40 | Normalize the run and known root | Header and root render | Streaming starts from one coherent base |
| Seq 42 child before seq 41 parent | Store the tool under `orphanIdsByParentId` and record a gap | Show unresolved evidence and Catching up | Arrival order is not tree authority |
| Seq 41 parent arrives | Insert the parent, attach the orphan, advance through `c42` | Tool moves under its parent without losing selection | One span ID remains one entity |
| Reconnect repeats seq 42 | Reject the seen event ID | Tree and counts do not change | Replay is idempotent |
| Seq 43 requests approval v3 | Keep `approval_9` separate from the pending Approve command | Inspector says Submitting, not Approved | Optimistic feedback is not server truth |
| Another tab denies at v4 | Apply the newer server version and clear local pending state | Disable controls, move focus to the outcome, announce once | Every tab converges |

The example shows why event identity, sequence or revision, and cursor are not interchangeable. Identity prevents duplicate work, sequence protects field freshness, and the contiguous cursor protects recovery. Normalized entities preserve partial evidence, while separate action state prevents a responsive control from fabricating an outcome.

## Rendering path

The normalized tree is transformed into a flat visible row list from roots, child indexes, expansion state, search matches, and filters. The flattening selector is memoized by the exact inputs that affect visibility. Each row contains only stable display fields: id, depth, kind, label, status, duration, child count, match state, and whether it is expanded.

Virtualization renders the visible window plus modest overscan. Row height should be fixed or drawn from a small set of predictable sizes; multiline payloads belong in the inspector, not in rows. Bursts of span deltas are buffered and committed at most once per animation frame. A high-priority status such as approval requested can bypass a longer debounce, but still flows through the same reducer.

Component subscriptions should be entity-specific. Updating span 900 must not rerender every visible row. The selected inspector subscribes to the selected span and payload resource, while the header subscribes to run aggregates. Expensive search over tens of thousands of summaries can move to a Web Worker after measurement. The first version can use indexed lowercase summaries in memory.

## Action coordination

Stop, retry, approve, and deny are commands, not ordinary state toggles. Render one only when the latest entity advertises the capability, then send the current version and a client-generated idempotency key. A pending label can respond immediately without fabricating the final lifecycle event. The response and matching stream event may arrive in either order and must converge on the same version. A conflict clears pending intent and explains the newer server outcome. Retry creates a new run or attempt ID rather than rewriting the old trace.

# Tradeoffs

## Tree versus timeline

A pure timeline makes concurrency and duration easy to scan but hides logical parentage. A pure tree explains ownership but can hide overlap between siblings. The MVP uses a hierarchical treegrid with duration and relative-start metadata in each row. A waterfall timeline is a later alternate visualization over the same normalized entities. Do not maintain two competing state models.

## SSE, fetch stream, or WebSocket

The inspector is primarily server-to-client, so SSE or a fetch stream is a strong default. SSE supplies reconnection semantics but has header and request-shape constraints; fetch streaming offers more control and integrates with `AbortController`. WebSocket is justified if the same channel must carry many bidirectional collaborative commands, which this MVP does not require. Action commands remain ordinary authenticated requests and stream back as authoritative events.

The frontend architecture isolates transport behind an adapter, so this choice does not leak into rows or reducers. The important interview signal is the resume cursor and idempotent merge, not naming a fashionable protocol.

## Snapshot plus delta versus event-only replay

Replaying every historical event simplifies audit semantics but makes page load expensive for long runs. A snapshot gives a fast, compact starting point; deltas make it live. The cost is versioning the snapshot and detecting gaps. Choose snapshot plus resumable deltas for the UI. Full raw event export can be a separate audited capability.

## Nested objects versus normalized entities

A nested tree looks natural but makes an out-of-order child, partial update, and entity-specific subscription awkward. Normalized maps plus child indexes handle partial arrival and targeted updates. The visible nested order is derived. This adds selector complexity but pays for itself once the run is live or large.

## Optimistic versus server-confirmed actions

Immediate optimistic approval is dangerous because an approval can execute a side effect. Show pending interaction feedback, but keep the authoritative approval status server-confirmed. Stop can also remain pending until confirmed. Safe optimism here means responsive controls and preserved intent, not claiming the action happened.

## Client masking versus server redaction

Client masking improves defense in depth and protects copy or casual viewing, but data already delivered to the browser is accessible to the user. Therefore permissions and redaction belong before delivery. Payload summaries should reveal that data was redacted without exposing the original value or secret length.

## Fixed versus variable row height

Variable rows can display more context but make virtualization and keyboard focus recovery harder. Use compact fixed-height rows and move details to the inspector. Allow a single optional wrapped error preview only if measured and supported by the chosen virtualizer.

# Failure Modes

## Connection and ordering failures

When the stream disconnects, keep the last snapshot visible, mark it stale, and reconnect from the last reduced cursor with exponential backoff and jitter. Do not clear a useful trace into a spinner. If the server reports an invalid cursor or retention gap, request a fresh snapshot and preserve local selection if that span still exists.

Duplicate events are normal after resume and must be ignored by event id. A missing sequence creates a catch-up state rather than an immediate fatal error. If the gap persists, fetch a delta range or snapshot. A child whose parent never arrives appears under an “Unattached spans” group with its original parent id visible for debugging.

A `span.completed` event can arrive before the final payload resource is available. The row may show completed while the inspector labels the payload as processing or unavailable. These are different states and should not be collapsed.

## Human-in-the-loop approval UI races

The user can press Stop exactly as the run completes. The terminal run event wins. The stop control resolves with a neutral “Run already completed” message rather than changing status to cancelled.

Two operators can answer one approval. Version preconditions and idempotency keys prevent double execution. The losing client updates to the server decision, identifies that it was resolved elsewhere, and disables the controls.

A retry request may succeed but the response can be lost. Retrying with the same idempotency key should return the same new run reference. The old run remains immutable and links to the retry.

## Rendering and memory failures

A trace burst can deliver thousands of events in one second. Parse envelopes incrementally, batch reducer notifications, render only the visible rows, and cap in-memory event-id history according to the snapshot/cursor contract. Keep large payloads lazy and release cached payload bodies with an LRU policy.

Deep or malformed parent chains can cause recursion overflow or cycles. Flatten iteratively, track visited ids, cap visual depth, and render cycle members in a diagnostic group. The client should report invalid trace structure without freezing.

JSON payloads may be huge or syntactically invalid. Show size and type before loading, offer a bounded text fallback, parse off the main thread when needed, and never syntax-highlight an unbounded document synchronously.

## Security failures

Tool outputs can contain scripts, secret tokens, personal data, or terminal escape sequences. Render escaped text, use a JSON renderer that creates DOM nodes rather than HTML strings, and prevent clickable dangerous URLs by default. Copy/download actions must respect permission metadata and should identify redacted content.

If the API accidentally sends a sensitive field without redaction, the browser cannot make that data secret. The UI can apply known-key masking and telemetry, but the incident still requires a server-side fix. The answer should state this boundary clearly.

## Accessibility failures

Virtualization can remove the focused row from the DOM. Maintain active row identity separately, scroll it into the rendered window before moving focus, and use a roving focus model. Expansion must expose `aria-expanded`; hierarchy needs level and position information appropriate to the chosen tree or treegrid pattern.

Announcing every delta makes the product unusable. The live region reports only connection changes, approval requests, terminal run states, and user-triggered action results. Visual status updates remain available without forced speech.

On mobile, long trace ids, URLs, stack traces, and JSON keys can widen the entire document. Apply safe wrapping to prose and metadata; payload/code containers receive their own horizontal scroll. The header actions wrap into multiple rows without shrinking labels word by word.

# Metrics

Measure the frontend, not the model runtime:

- Time to first useful trace: route navigation until the run header and first visible spans render.
- Live update latency: client receipt timestamp to visible lifecycle update, reported at p50 and p95.
- Interaction responsiveness: INP for expanding rows, changing filters, selecting a span, and opening payload details.
- Frame health during bursts: long-task count, dropped-frame proxy, and maximum reducer/render batch duration.
- Resume correctness: successful reconnects without a forced snapshot, duplicate-event count, persistent-gap count, and stale-view duration.
- Memory: heap growth by span count, loaded payload bytes, and memory after closing large payloads.
- Action trust: approval/stop double-submit attempts, conflict rate, expired approvals, and time until authoritative confirmation.
- Accessibility: keyboard completion of expand/select/inspect/return flows, focus-loss defects, and excessive live-region announcement defects.
- Debugging outcome: time from opening a failed run to selecting the failing span. This is a product metric influenced by filtering and error emphasis, not merely a rendering metric.

Define budgets for a representative mid-range device. The exact numbers depend on product constraints, but the answer should set them before choosing optimizations. A reasonable interview target is no page-wide overflow at supported widths, responsive keyboard navigation at ten thousand spans, and no unbounded memory growth during an hour-long live run.

# Rollout

Start with read-only completed runs behind a feature flag. This validates snapshot normalization, tree rendering, filters, payload safety, and permissions without action risk. Instrument load time, selection latency, payload size, and client errors.

Next enable live updates for internal users. Exercise reconnects, duplicates, gaps, orphans, and bursts with deterministic fixtures. Add a kill switch that falls back to periodic snapshot refresh if the streaming adapter becomes unreliable.

Then enable Stop for a small internal cohort, followed by approval and retry actions. Each action receives an independent flag, idempotency key, version precondition, audit metadata, and clear rollback path. Do not bundle every mutation into one launch.

Run accessibility review before broad availability, including keyboard-only navigation, screen-reader behavior, zoom, reduced motion, high contrast, and narrow screens. Load-test the browser with synthetic traces at hundreds, ten thousand, and pathological depth. Verify that untrusted and large payload fixtures cannot execute markup or block the main thread.

The final rollout adds customer-facing permission profiles only after the redaction and authorization contracts are audited. Later improvements can include a waterfall timeline, run comparison, saved filters, shareable redacted snapshots, aggregate evaluations, and cross-run search. They should reuse the same stable run/span model rather than reshape the core inspector.

## Interview answer checkpoint

Before finishing, be able to explain five decisions without reading the page:

1. Why a snapshot plus resumable deltas gives the browser a coherent base without replaying unbounded history.
2. Why event ID, sequence or revision, and cursor solve different duplicate, freshness, and recovery problems.
3. Why normalized spans and a derived virtualized treegrid are safer than a mutable nested object for orphans, search, and large runs.
4. Why payloads remain lazy, escaped, permission-aware, and server-redacted.
5. Why stop and approval controls require independent pending state, idempotency, version conflicts, predictable focus, and restrained announcements.
