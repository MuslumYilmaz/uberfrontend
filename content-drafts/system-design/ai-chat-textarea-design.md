---
title: "AI Chat Text Area (ChatGPT-Style)"
slug: "ai-chat-textarea-design"
family: "system-design"
tech: "frontend"
audience: "Frontend engineers preparing for system design interviews"
intent: "Teach a concrete frontend architecture answer with explicit state, failure, accessibility, and rollout decisions."
target_words: 2400
primary_keyword: "ai chat textarea frontend system design"
status: "converted"
notes_for_conversion:
  - "Keep the route, question ID, and access level stable."
  - "Keep backend execution out of scope; describe only UI-facing contracts."
  - "Maintain parity with the five shipped RADIO sections."
search_intent: "Prepare a frontend system design answer for AI Chat Text Area (ChatGPT-Style)."
reader_promise: "The reader can explain the frontend state, architecture, interfaces, failure recovery, accessibility, and rollout decisions for AI Chat Text Area (ChatGPT-Style)."
unique_angle: "Design an AI chat composer with IME-safe input, autosizing, attachments, draft persistence, send cancellation, streaming state, and accessible keyboard behavior."
what_this_adds_beyond_basics: "Adds an end-to-end worked example, state ownership, recovery, accessibility, and measurable rollout guidance for AI Chat Text Area (ChatGPT-Style)."
competitor_query: "AI Chat Text Area (ChatGPT-Style) frontend system design"
competitor_takeaways:
  - "Catalog pages commonly list components but stop before reconciliation and failure recovery."
  - "Reference material is strongest when it anchors browser behavior in official platform guidance."
competitor_gaps:
  - "A state transition is often described without showing the visible UI result or preserved invariant."
  - "Accessibility, mobile reflow, cancellation, and rollback are frequently treated as afterthoughts."
sources:
  - "https://developer.mozilla.org/en-US/docs/Web/API/Element/compositionstart_event"
  - "https://developer.mozilla.org/en-US/docs/Web/API/AbortController"
last_fact_checked_at: "2026-07-28"
reviewed_by: "FrontendAtlas editorial migration"
confidence: "high"
---
# Prompt

ai chat textarea frontend system design. Design an AI chat composer with IME-safe input, autosizing, attachments, draft persistence, send cancellation, streaming state, and accessible keyboard behavior.

## Requirements

---

Scope the case to the composer and current turn. The user must be able to enter text with an IME, attach files, recover a local draft, submit exactly once, inspect a streaming assistant response, stop it, and retry without confusing cancellation with deletion. Older history is an abstract paged input rather than a database-design exercise.

Decision surface:
- Does Enter submit only after composition has ended, while Shift+Enter keeps its newline behavior?
- Are local draft, upload readiness, pending send, and streaming response modeled as separate state?
- Do stable client message and command IDs make send retries idempotent?
- Can Stop race with completion without erasing valid partial text?
- Are errors, focus recovery, mobile reflow, and screen-reader updates explicit?

---

### Composer and current-turn lifecycle
1. **Compose:** Update one recoverable draft from `beforeinput`, input, and composition events; autosize within measured bounds.
2. **Prepare attachments:** Track each local file through validation and upload readiness without storing `File` objects in serializable state.
3. **Submit:** Snapshot text and finalized asset IDs under stable client message and command IDs before clearing the composer.
4. **Stream:** Reduce sequenced deltas into one assistant message and coalesce only visual commits.
5. **Stop or recover:** Abort the active request, preserve partial output, and reconcile a late terminal event or an idempotent retry.

### Clarifying questions
- Which browsers, mobile keyboards, IMEs, and assistive technologies matter?
- Must attachments finish uploading before send, or may a command reference pending assets?
- Does Stop only abort transport, or is there an idempotent server-side cancel command?
- Is a stopped partial response retryable as a new turn or resumable under the same stream identity?
- How is older history paged into the visible turn without changing the current composer contract?

### Composer reliability and accessibility expectations
- Composition and text selection remain correct while autosizing.
- Draft persistence never overwrites a newer local revision.
- A replayed send acknowledgement or stream delta is idempotent.
- Long output does not force one framework render per token.
- Live announcements communicate terminal changes rather than every chunk.

### Scope checkpoint

The design is coherent when composition-safe input, recoverable local intent, one send identity, sequenced stream updates, and honest Stop or retry behavior use the same turn model.

### Frontend boundary

The browser owns composition-safe input, autosizing, attachment state, draft persistence, send commands, stream presentation, cancellation, and focus recovery. Server-side model execution and durable conversation history stay behind abstract current-turn and paged-history contracts; this design stops at composer, message, and stream behavior.

# Clarifying Questions

- Which user journey and input modes must AI Chat Text Area (ChatGPT-Style) support first?
- Which state is authoritative, which state may be optimistic, and how is freshness represented?
- What ordering, identity, and version rules must survive retries or out-of-order responses?
- Which interactions must remain usable with keyboard, assistive technology, and narrow viewports?
- What should users see during loading, partial failure, cancellation, and recovery?
- Which performance budgets are hypotheses to measure rather than universal thresholds?

# Architecture

## Architecture / High-level design

---

Use a composer controller for input semantics, an attachment adapter for upload readiness, a normalized current-turn store, a stream adapter, and an action coordinator. The network layer emits typed snapshot, delta, terminal, and error events; the reducer owns idempotency and sequencing.

Boundary checks:
- Composition state is not inferred from key names alone.
- Draft text is independent from the sent user message.
- An active send command and assistant stream each have stable identities.
- Transport cancellation and authoritative message status are reconciled.
- Older history remains behind an abstract paging adapter.

---

### Core building blocks
| Piece | Responsibility | Design rationale |
| --- | --- | --- |
| Composer controller | Applies composition, shortcut, paste, and autosize rules | Keeps input semantics out of network state. |
| Attachment adapter | Validates files and maps local handles to finalized asset IDs | Separates ephemeral browser objects from serializable state. |
| Current-turn store | Owns draft, pending command, user message, and assistant stream | Gives reconciliation one canonical state graph. |
| Stream adapter | Parses lowercase SSE or fetch-stream records into typed events | Keeps protocol parsing away from components. |
| Action coordinator | Sends, stops, retries, and resolves races | Gives every user intent one idempotent command boundary. |

---

```text
Composer events
  -> ComposerController
      -> draft + composition state
      -> AttachmentAdapter
  -> ActionCoordinator.send(commandId, clientMessageId)
      -> current-turn store
      -> StreamAdapter
          -> message.started
          -> message.delta(sequence)
          -> message.completed | message.stopped | message.failed
      -> reducer
          -> visible message
          -> focused recovery control
```

### Composer and stream decisions
- The reducer ignores duplicate sequence numbers and does not concatenate replayed text.
- Draft clearing happens only after the submitted snapshot is recoverable.
- Stop preserves received text while waiting for terminal reconciliation.
- Older history may be virtualized or paged independently of the current turn.

### Composer and current-turn failure patterns
- Treating Enter as submit while `isComposing` is true.
- Reusing one boolean for attachment upload, send, and stream state.
- Appending every network chunk directly to component-local text.
- Assuming `AbortController.abort()` proves the remote action stopped.

### High-level flow
1. **Prepare:** Validate composition state and attachment readiness.
2. **Snapshot:** Create immutable send input under stable command and client message IDs.
3. **Acknowledge:** Reconcile the server message ID without replacing local identity.
4. **Reduce:** Merge sequenced stream events into one assistant message.
5. **Recover:** On Stop, failure, or reconnect, preserve partial text and expose a meaningful next action.

### Composer and stream ownership

The architecture is sound when input semantics, local intent, transport parsing, and authoritative turn state meet only through typed events and commands.

### Worked example: Enter during IME composition followed by cancel

A Japanese input method is composing text when Enter is pressed, then the user submits the completed prompt with an attachment and cancels the streaming response. Keyboard shortcuts must respect composition and cancellation must not erase the sent turn.

### Scenario walkthrough
| Event | Store change | Visible UI | Invariant |
| --- | --- | --- | --- |
| Enter during composition | Observe composition state and do not submit. | The IME commits or selects text normally. | Shortcut does not corrupt input. |
| Composition ends | Update the draft and validated attachment references. | Autosize follows measured content within bounds. | Draft is one coherent value. |
| User sends | Create a client message ID and pending send command, then clear only after local snapshot. | Message appears pending and composer resets safely. | Sent content remains recoverable. |
| User stops stream | Abort the active response command and retain received text as partial. | Stop becomes Retry or Continue by product policy. | Cancellation is not message deletion. |

# Tradeoffs

The central tradeoff is Design an AI chat composer with IME-safe input, autosizing, attachments, draft persistence, send cancellation, streaming state, and accessible keyboard behavior. The preferred design keeps browser-owned state explicit and treats server behavior as a UI-facing contract. A different rendering or state strategy is justified only when measured interaction cost, device constraints, or collaboration requirements change the evidence.

## Data model

Model the composer and current turn explicitly. Unsent text, attachment work, a pending send command, the optimistic user message, and sequenced assistant output have different lifetimes and failure paths.

---

`ComposerDraft` is scoped by conversation and stores a local revision plus composition state. `AttachmentDraft` tracks readiness. `PendingSend` correlates the optimistic user message, while `StreamMessage` accepts events only from its own stream identity and next sequence.

State-model checks:
- Draft revision and IME composition are explicit.
- Attachment readiness cannot be inferred from a URL.
- Client message and command IDs make an uncertain send retry idempotent.
- Stream identity and sequence reject stale or duplicate deltas.

---

### Core entities
| Entity | What it represents | Why it matters |
| --- | --- | --- |
| ComposerDraft | Scoped unsent text and composition state | Prevents navigation or IME events from losing intent |
| AttachmentDraft | Local file-to-asset lifecycle | Ensures only finalized asset IDs are sent |
| PendingSend | Command and optimistic message identity | Makes uncertain retries and echoed messages converge |
| StreamMessage | Assistant identity, stream sequence, text, and terminal phase | Prevents stale or duplicate chunks from corrupting the turn |

```ts
type AttachmentPhase = 'local' | 'uploading' | 'ready' | 'error';
type StreamPhase = 'pending' | 'streaming' | 'complete' | 'stopped' | 'error';

interface ComposerDraft {
  conversationId: string;
  text: string;
  revision: number;
  savedAt: number;
  isComposing: boolean;
  attachmentLocalIds: string[];
}

interface AttachmentDraft {
  localId: string;
  phase: AttachmentPhase;
  assetId: string | null;
  error: string | null;
}

interface PendingSend {
  commandId: string;
  clientMessageId: string;
  draftRevision: number;
  phase: 'sending' | 'acknowledged' | 'error';
}

interface StreamMessage {
  messageId: string;
  streamId: string;
  lastSequence: number;
  text: string;
  phase: StreamPhase;
}
```

### Explicit state
- Draft revision and composition state.
- Attachment phase and finalized asset identity.
- Command and client message IDs for send reconciliation.
- Stream ID, last accepted sequence, partial text, and terminal phase.

### Conversation-state pitfalls
- One `isLoading` flag shared by uploads, send acknowledgement, and response streaming.
- No client identity to reconcile an echoed optimistic message.
- No stream sequence, so replay duplicates text.
- Persisting `File`, DOM nodes, or `AbortController` in serializable state.

- **Primary local entity:** ComposerDraft
- **Command identity:** commandId + clientMessageId
- **Stream ordering:** streamId + sequence

### State checkpoint

The model is trustworthy when unsent intent, attachment readiness, send acknowledgement, and assistant streaming cannot overwrite one another.

### Draft, send-command, and stream ownership

Keep ComposerDraft, AttachmentDraft, composition state, and PendingSend separate from conversation messages. A sent user message gets a client ID for idempotent reconciliation. Streaming assistant text is a versioned or sequenced message resource, while the local composer draft can persist independently across navigation.

### Client model
| Record | Key fields | Owner |
| --- | --- | --- |
| ComposerDraft | text, revision, savedAt | Local draft |
| AttachmentDraft | localId, phase, assetId, error | Upload state |
| PendingSend | clientMessageId, commandId, phase | Action overlay |
| StreamMessage | messageId, sequence, text, terminal | Conversation cache |

# Failure Modes

## Optimizations and deep dive

This step is about scale and UX safety: long conversations, large responses, and unreliable networks. Explain how you keep the chat fast and reliable over time.

---

Ship composition-safe input, recoverable drafts, attachment readiness, idempotent send, and honest Stop behavior first. Add virtualization or visual delta batching only after measuring current-turn and long-list costs.

Composer and current-turn resilience evidence:
- Long histories do not block the composer.
- The design avoids re-render storms during streaming.
- Stop, uncertain send, and retry converge by identity.
- Draft and attachment failures preserve recoverable user intent.

---

### Composer performance controls
| Lever | What it does | Why it helps |
| --- | --- | --- |
| Virtualized list | Render only visible messages | Keeps scrolling smooth on long histories |
| Chunk batching | Batch token updates (every 50-100ms) | Avoids excessive re-renders |
| Context summarization | Summarize older turns | Stays within model limits |
| Retry + backoff | Retry failed streams | Improves resilience |

### Measured optimizations
- Virtualize long message lists.
- Batch streaming chunks before state updates.
- Summarize old context when it grows too large.
- Abort in-flight streams on new requests.
- Cache recent conversations for quick load.

### Composer failure and recovery
- Stale streams overwriting newer messages.
- UI jank from per-token renders.
- History payloads that are too large to load.
- Error states that lose the user's prompt.
- Stop button that does not actually cancel.

### Scenario: long history and interrupted stream
1. **1. Very long conversation:** Load only the latest N messages, show a Load more button, and virtualize the list.
2. **2. User sends a new prompt:** Abort any existing stream and start a new one to avoid overlap.
3. **3. Stream hiccup:** Show a retry CTA and keep the partial response so the user does not lose progress.

- **Main metric:** Time-to-first-token
- **Secondary metric:** Scroll smoothness
- **Error metric:** Stream failure rate

### Composer resilience invariant

A great chat UX is resilient: it streams smoothly, cancels reliably, and scales to long histories without slowing down.

### Composition, send, and stream recovery

### Failure modes
| Failure | Response | Invariant |
| --- | --- | --- |
| Draft storage fails | Keep in-memory text and show nonblocking recovery status. | Typing never stops. |
| Attachment fails | Keep text and the failed attachment row with retry or remove. | One file does not erase the prompt. |
| Send response is lost | Retry the same client message identity. | Duplicate user turns are avoided. |
| Stream reconnects | Resume by cursor or fetch the message snapshot. | Partial content converges. |

### Accessibility behavior

The textarea has a persistent label and instructions for Enter versus modified Enter without overriding platform composition. Attachments expose name, phase, error, and remove control. Streaming deltas are not announced token by token; meaningful completion, failure, or stop state uses a concise polite message. Focus remains in the composer after ordinary send unless navigation requires otherwise.

### Rollout and measurement

Test IME composition, mobile keyboards, voice input, paste, long drafts, large text, RTL, attachment races, duplicate send, stream interruption, and route restoration. Track accidental empty sends, draft loss, duplicate messages, stop latency, attachment recovery, and input responsiveness.

### Technical references
- [MDN composition events](https://developer.mozilla.org/en-US/docs/Web/API/Element/compositionstart_event) — IME composition lifecycle for text controls.
- [MDN AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) — Cancellation primitive for request and stream work.

# Metrics

Measure task completion and recovery before optimizing isolated rendering numbers. Track time to first useful UI, interaction latency by input mode, request and mutation failure rates, stale-response suppressions, retry outcomes, focus-restoration failures, layout overflow, and accessibility regressions. Segment field results by device capability, network class, viewport, and reduced-motion preference. Numeric targets begin as testable budgets and should be revised from production distributions.

# Rollout

Ship the smallest client slice that preserves identity, cancellation, recovery, accessibility, and observability. Validate the UI-facing contracts with deterministic fixtures, release behind a feature flag where appropriate, compare user outcomes and error distributions, and expand only after the failure and rollback paths have been exercised.

## Interface definition (API)

Expose a composer-oriented client contract: draft state, attachment readiness, send, Stop, retry, and the current turn. Keep raw transport parsing and history implementation outside view components.

---

A `useChatComposer` adapter returns the draft, attachments, current turn, and intent methods. `send` accepts finalized attachment IDs plus stable command and client message identities. Every stream event carries `streamId`, `messageId`, and `sequence`.

Contract checks:
- Composition and attachment state are visible to the view.
- Send and Stop are explicit commands with abortable transport.
- Stream events correlate to exactly one assistant resource.
- Raw protocol parsing stays private, and conversation-history loading remains outside this composer contract.

---

```ts
interface SendCommand {
  commandId: string;
  clientMessageId: string;
  text: string;
  attachmentIds: string[];
}

interface UseChatComposerResult {
  draft: ComposerDraft;
  attachments: AttachmentDraft[];
  activeTurn: StreamMessage | null;
  updateText(text: string): void;
  send(command: SendCommand): Promise<void>;
  stop(): Promise<void>;
  retry(commandId: string): Promise<void>;
}

interface ChatTurnClient {
  send(input: SendCommand & { conversationId: string; signal: AbortSignal }): Promise<{
    messageId: string;
    assistantMessageId: string;
    streamId: string;
  }>;
  stop(input: { streamId: string; commandId: string; signal: AbortSignal }): Promise<void>;
}
```

```text
event: message.delta
data: {"streamId":"s_123","messageId":"m_123","sequence":1,"delta":"hello"}

event: message.completed
data: {"streamId":"s_123","messageId":"m_123","sequence":2}
```

### Core interfaces
| Contract surface | Shape (example) | How you explain it |
| --- | --- | --- |
| useChatComposer | draft, attachments, activeTurn, send, stop, retry | Keeps composition and turn intent separate from transport parsing. |
| send | commandId, clientMessageId, text, attachmentIds | Snapshots one composition-complete turn for idempotent reconciliation. |
| stream events | streamId, messageId, sequence, delta or terminal phase | Incrementally updates exactly one assistant resource. |
| stop | streamId + commandId | Requests authoritative stop while AbortSignal closes local transport work. |

### Public behavior
- Draft text, composition state, and attachment phases.
- Send, Stop, and retry intents.
- Current turn identity, partial text, and terminal phase.

### Transport and buffering behind the adapter
- Raw SSE parsing in the view.
- Visual commit timers or internal buffers.
- Database details leaking into components.

### Integration flow
1. **Restore:** Adapter restores the scoped draft independently from recent messages.
2. **Send:** After composition and attachment validation, UI calls `send` with stable identities.
3. **Stream:** Adapter accepts matching next-sequence events and batches visual text commits when profiling justifies it.
4. **Stop:** Local transport closes, a stop command is sent, and terminal status still reconciles.

### Contract checkpoint

The contract is complete when draft ownership, attachment readiness, command identity, stream identity, Stop, and retry are visible while raw protocol parsing stays hidden.

### UI-facing contract

`send` accepts text, finalized attachment IDs, command ID, client message ID, and AbortSignal at the client boundary. The stream adapter exposes sequenced deltas and terminal state. Stop sends an idempotent command while AbortSignal closes local transport work; the UI still reconciles authoritative message status after cancellation races.

### From composition-safe draft to terminal turn
1. **Compose:** Honor beforeinput and composition events, update draft, and autosize within a measured maximum.
2. **Prepare:** Wait for required attachment finalization and preserve accessible error links.
3. **Send:** Snapshot content under one client ID and reconcile the echoed server message.
4. **Stream:** Batch visual deltas, expose Stop, and keep partial content on recoverable interruption.
