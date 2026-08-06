---
title: "Design an AI Chat Composer and Streaming Turn"
slug: "ai-chat-textarea-design"
family: "system-design"
tech: "frontend"
audience: "Frontend engineers preparing for system design interviews"
intent: "Teach a concrete frontend architecture answer with explicit state, failure, accessibility, and rollout decisions."
target_words: 1800
primary_keyword: "ai chat composer and streaming turn"
status: "converted"
content_schema_version: 2
target_level: "mid"
timebox_minutes: 15
candidate_prompt: "Design the composer and current reply for an AI chat app. A user may type Japanese with an IME, attach a file that is still uploading, press Enter twice, or stop a streaming answer and retry. An event from the old Send, Stop, or stream must never change the new active turn. Assign the state owned by the textarea, draft store, upload flow, and current turn. Explain recovery when a Send or Stop response is lost."
constraints:
  - "IME Enter cannot send."
  - "Only ready attachments may send."
  - "An active reply turns Send into Stop."
  - "Superseded events are ignored."
expected_decisions:
  - "Separate persisted draft, transient composition, and attachment readiness state."
  - "Choose stable identities for send retransmission, stream events, and Stop retransmission."
  - "Define terminal retry, sequence resume, and snapshot recovery without crossing turn identity."
prerequisites:
  - "Controlled text input"
  - "AbortController"
  - "Streaming event basics"
core_skills:
  - "IME-safe input"
  - "Command idempotency"
  - "Stream reconciliation"
  - "Draft persistence"
evaluation_must_cover:
  - "IME composition and unready attachments cannot send."
  - "Stable identities protect one logical send and active stream."
evaluation_strong_signals:
  - "Drafting continues, but Send becomes Stop during an active reply."
  - "Reconnect by sequence or snapshot; reject superseded stream events."
evaluation_expert_stretch: "Account drafts, cross-tab ownership, and safe Markdown."
evaluation_red_flag: "Local abort masquerades as server Stop, or stale streams mutate the active turn."
guided_mock: true
notes_for_conversion:
  - "Keep the route, question ID, and access level stable."
  - "Keep backend execution out of scope; describe only UI-facing contracts."
  - "Maintain parity with the five shipped RADIO sections."
search_intent: "Prepare a frontend system design answer for an AI chat composer and streaming turn."
reader_promise: "The reader can explain IME-safe input, attachment readiness, command idempotency, one-active-stream ownership, and stale-event recovery."
unique_angle: "Connect native text entry, recoverable drafts, upload readiness, and streaming cancellation through explicit command and stream identities."
what_this_adds_beyond_basics: "Adds a timeboxed response path, exact retransmission rules, authoritative Stop recovery, and a stale-stream walkthrough."
competitor_query: "AI chat composer streaming turn frontend system design"
competitor_takeaways:
  - "Composer examples are useful when native input semantics stay separate from network state."
  - "Streaming examples need command, message, stream, and sequence identity to explain races."
competitor_gaps:
  - "Stop is often described as AbortController.abort without authoritative server reconciliation."
  - "Retry often reuses an old command without distinguishing transport retransmission from new user intent."
sources:
  - "https://developer.mozilla.org/en-US/docs/Web/API/Element/compositionstart_event"
  - "https://developer.mozilla.org/en-US/docs/Web/API/AbortController"
last_fact_checked_at: "2026-08-06"
reviewed_by: "FrontendAtlas editorial"
confidence: "high"
---
# Prompt

Use the candidate prompt in the frontmatter verbatim. The primary query is **ai chat composer and streaming turn**, but the case is narrower than a complete chat product: cover the composer, upload readiness, and one current assistant reply. Treat older history and model execution as abstract contracts.

The product policy is deliberately explicit. A user can keep drafting while a response is active, yet the primary Send control becomes Stop. A second response cannot begin until the first reaches `complete`, `stopped`, or `failed`. This removes ambiguity about which answer Stop targets.

## Requirements

The shipped Requirements section opens with a five-step, 15-minute response path:

- **Frame the boundary.** Name the composer, uploads, and current turn. Keep history and model execution outside the frontend scope.
- **Separate input and upload state.** `isComposing` belongs to the mounted textarea. Recoverable text belongs to a draft keyed by account and conversation. Each attachment owns a local upload phase and becomes sendable only with a finalized asset ID.
- **Create one logical send.** Snapshot text, ready attachment IDs, `commandId`, `clientMessageId`, and draft revision. If only the response is lost, retransmit that same command. Text entered after the snapshot is a new draft.
- **Stream and stop by identity.** One assistant placeholder accepts only matching, next-sequence events. A Stop intent gets one `stopCommandId`. Closing the browser reader with `AbortSignal` does not prove the server stopped.
- **Reconcile before retry.** Resume after `lastSequence` or fetch `getTurnSnapshot`. After an authoritative terminal state, Retry or Regenerate creates a new `commandId` and receives a new `streamId`.

Reject overlapping responses for this version. If a second Send were allowed while the first streamed, a delayed event could attach an answer to the wrong prompt and the user could not predict which turn Stop would cancel. Keeping drafting available preserves useful work without creating that ambiguity.

# Clarifying Questions

- Which browsers, mobile keyboards, IMEs, and assistive technologies are in the supported matrix?
- Must every attachment finish uploading before Send, and can a failed file be removed without losing text?
- Does Stop have an idempotent server command, an event that confirms terminal state, and a snapshot fallback?
- Is Retry after `stopped` or `failed` defined as a new generation from the preserved prompt?
- May multiple tabs show the same conversation, and if so which tab owns the current response command?

These questions change concrete ownership and recovery behavior. They do not expand the exercise into model orchestration, database design, or conversation-search architecture.

# Architecture

`ComposerView` owns native text entry, selection, composition events, shortcuts, autosize, and focus. `DraftStore` persists account-and-conversation text revisions but never serializes mounted-control IME state. `AttachmentCoordinator` maps local file handles to `local`, `uploading`, `ready`, or `error` and exposes finalized asset IDs. `TurnCoordinator` stores the immutable Send command, optimistic row, active assistant turn, and stable Stop command. `StreamAdapter` parses transport records and passes typed events to a reducer.

The reducer is the only writer for accepted turn state. It compares conversation, command, client message, assistant message, stream, and sequence identities before applying an acknowledgement or event. A replayed sequence is ignored. A gap triggers event resume or snapshot recovery. A result for a superseded stream cannot mutate the current response.

The primary control follows current-turn state:

- With no nonterminal turn, a composition-complete draft and ready attachments enable Send.
- While `pending` or `streaming`, the control is Stop. The textarea remains editable, but another Send is unavailable.
- While Stop is uncertain, partial text remains visible and the UI says stopping rather than stopped.
- After `complete`, `stopped`, or `failed`, Retry or Regenerate becomes available as a new user intent.

## Worked example: IME, Send loss, and Stop loss

A Japanese IME is composing when the user presses Enter. `isComposing` prevents submit, so Enter commits or selects text normally. After `compositionend`, the attachment is ready and the user sends. The coordinator freezes a command and immediately renders one optimistic user row.

The Send response times out. The coordinator retransmits the stored `commandId`; it does not create a second message. The server acknowledges the same command and returns `streamId s1`. Send renders as Stop while deltas for s1 arrive in sequence. The user types another draft without starting another response.

When Stop is activated, the coordinator stores `stopCommandId x1`, targets s1, and may abort local reading. The Stop response is also lost. Retrying uses x1 again, then event resume or `getTurnSnapshot` establishes authoritative `stopped`. Only then can Retry allocate a new command and accept `streamId s2`. A late delta for s1 fails the active-turn check and leaves s2 unchanged.

# Tradeoffs

Persisting drafts improves navigation recovery but introduces account isolation and retention obligations. Key storage by `accountId + conversationId`, detach the old namespace on account switch, and remove drafts on logout unless an approved bounded retention policy exists. IME composition remains transient because restoring a half-finished native composition is neither reliable nor meaningful.

Visual delta batching can reduce rendering work, but accepted sequence state must advance independently from paint timing. Add batching only after profiling representative responses and low-end devices. Older history may be paged or virtualized separately; current-turn correctness cannot depend on whether historical messages are mounted.

Local abort gives immediate browser feedback but cannot stand in for server authority. Waiting only for Stop acknowledgement can also stall if its response is lost. The combined contract uses a stable Stop identity, resumable events, and an authoritative snapshot. This costs more state than a single loading boolean, but it makes user-visible stopping and retry honest.

## Data model

`ComposerDraft` contains account, conversation, text, revision, saved time, and local attachment references. `ComposerInteractionState` contains `isComposing` and remains in memory. `AttachmentDraft` contains local identity, phase, finalized asset identity, and error. `PendingSend` stores conversation, `commandId`, `clientMessageId`, submitted revision, and acknowledgement phase. `StreamMessage` stores conversation, send identities, server message, `streamId`, `lastSequence`, partial text, and terminal phase.

Identity reuse depends on the cause. A lost Send response reuses `commandId` and `clientMessageId`. A lost Stop response reuses `stopCommandId`. User Retry or Regenerate after terminal state creates a new Send identity and new stream. Mixing those cases either duplicates user messages or lets an old intent control a new turn.

## Interface contract

`ChatTurnClient.send` accepts the stable Send command, conversation, and `AbortSignal`, then echoes accepted identities with message and stream IDs. `openEvents` takes conversation, stream, `afterSequence`, and a local signal. `stop` accepts `stopCommandId`, conversation, stream, and a signal. `getTurnSnapshot` accepts the complete current-turn identity and returns authoritative text, sequence, and phase.

The UI adapter exposes draft, composition state, attachments, active turn, and `primaryAction: 'send' | 'stop'`. It offers a transport retransmit for an uncertain Send and a separate terminal Retry operation that requires a newly allocated command. Components do not parse SSE, select stale-event winners, or infer remote cancellation from an exception.

# Failure Modes

- Draft persistence failure keeps text in memory and presents nonblocking status.
- Attachment failure preserves the prompt and gives that file Retry and Remove controls.
- Duplicate Enter while Send is pending does not create another command.
- Send response loss retransmits the immutable command and converges on one optimistic row.
- Stop response loss retransmits the same Stop identity and reconciles through events or snapshot.
- Reconnect resumes after the last accepted sequence; a snapshot handles an expired cursor.
- A late old-stream event is ignored by identity even when it carries a higher sequence.
- Partial assistant Markdown is sanitized with allowlisted link protocols and never passed directly to `innerHTML`.

For accessibility, keep a persistent textarea label, explain Enter behavior without overriding composition, and expose attachment name, phase, error, Retry, and Remove controls. Do not announce every token. Announce the transition to stopping and the meaningful terminal outcome once. Keep focus in the composer after ordinary Send; move it only when a requested recovery action needs attention.

# Metrics

Measure duplicate-message rate, stale-event suppression, Stop latency, successful recovery after lost responses, draft loss, attachment recovery, input responsiveness, and focus-restoration failures. Segment results by input mode, browser, device capability, viewport, and network cohort. Profile before enabling list virtualization or visual delta batching, and verify that paint scheduling never changes accepted stream order.

# Rollout

Start with deterministic fixtures for composition events, attachment transitions, duplicate Enter, repeated Send, repeated Stop, sequence replay, event gaps, snapshot recovery, terminal Retry, and stale old-stream events. Add keyboard and narrow-layout coverage, then test account switch, logout cleanup, cross-tab ownership, and hostile Markdown rendering.

Release the one-active-response policy with observability around command reuse and suppressed stale events. Compare user recovery outcomes before changing performance strategies. Preserve the current route, access, progress, and guided-mock behavior.

## Technical references

- [MDN composition events](https://developer.mozilla.org/en-US/docs/Web/API/Element/compositionstart_event) — Native IME composition lifecycle for text controls.
- [MDN AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) — Local request and stream cancellation semantics.
