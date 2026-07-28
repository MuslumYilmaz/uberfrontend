---
title: "AI UX Resilience and Control Patterns"
slug: "ai-ux-considerations"
family: "system-design"
tech: "frontend"
audience: "Frontend engineers preparing for system design interviews"
intent: "Teach a concrete frontend architecture answer with explicit state, failure, accessibility, and rollout decisions."
target_words: 2400
primary_keyword: "ai ux considerations frontend system design"
status: "converted"
notes_for_conversion:
  - "Keep the route, question ID, and access level stable."
  - "Keep backend execution out of scope; describe only UI-facing contracts."
  - "Maintain parity with the five shipped RADIO sections."
search_intent: "Prepare a frontend system design answer for AI UX Resilience and Control Patterns."
reader_promise: "The reader can explain the frontend state, architecture, interfaces, failure recovery, accessibility, and rollout decisions for AI UX Resilience and Control Patterns."
unique_angle: "Design trustworthy AI-assisted UX with explicit uncertainty, cancellable work, safe defaults, feedback loops, failure recovery, and accessible state changes."
what_this_adds_beyond_basics: "Adds an end-to-end worked example, state ownership, recovery, accessibility, and measurable rollout guidance for AI UX Resilience and Control Patterns."
competitor_query: "AI UX Resilience and Control Patterns frontend system design"
competitor_takeaways:
  - "Catalog pages commonly list components but stop before reconciliation and failure recovery."
  - "Reference material is strongest when it anchors browser behavior in official platform guidance."
competitor_gaps:
  - "A state transition is often described without showing the visible UI result or preserved invariant."
  - "Accessibility, mobile reflow, cancellation, and rollback are frequently treated as afterthoughts."
sources:
  - "https://www.nist.gov/itl/ai-risk-management-framework"
  - "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role"
last_fact_checked_at: "2026-07-28"
reviewed_by: "FrontendAtlas editorial migration"
confidence: "high"
---
# Prompt

ai ux considerations frontend system design. Design trustworthy AI-assisted UX with explicit uncertainty, cancellable work, safe defaults, feedback loops, failure recovery, and accessible state changes.

## Requirements

Design a frontend flow where an AI-generated proposal remains reviewable advice until the user confirms a permitted product action. Expose evidence freshness and uncertainty, preserve user edits, reconcile versioned outcomes, and never turn generated text into authority.

---

What you are solving:
A proposal-to-action UI for reviewing affected records, inspecting evidence, editing selection, confirming a high-impact command, and recovering from mixed per-item results.

Decision surface:
- inspectable proposal facts and evidence
- stale, incomplete, or permission-restricted evidence
- generated, locally edited, optimistic, and authoritative state
- version conflicts and partial outcomes
- safe rendering, cancellation, accessibility, and feedback

---

### Proposal-to-action review lifecycle
1. **Request proposal:** Capture intent and show cancellable pending work without blocking unrelated tasks.
2. **Review evidence:** Render affected items, evidence freshness, uncertainty, limitations, and capabilities.
3. **Edit and confirm:** Keep local review edits separate and confirm against the current proposal version.
4. **Reconcile outcomes:** Merge authoritative per-item success, failure, and conflict results.

### Clarifying questions
- What product decision is the proposal helping with?
- Which records, evidence, permissions, and versions must be visible?
- Which actions are reversible, destructive, or unavailable?
- Can the user edit scope before confirmation?
- When does a proposal expire or require refreshed evidence?
- How should partial command outcomes be recovered?

### Review safety and user-control expectations
- Pending AI work does not block unrelated tasks.
- Generated content is rendered as untrusted data.
- Stale evidence disables confirmation without erasing review context.
- Command retry is idempotent and version-aware.
- Uncertainty and mixed results are understandable without color alone.

### AI-assisted workflow states
| State | UI treatment | Why it matters |
| --- | --- | --- |
| Pending proposal | Cancellable progress that preserves intent | Slow work does not look frozen |
| Reviewable | Proposal, evidence, limitations, and editable items | Suggestion remains distinct from authority |
| Stale or blocked | Explanation plus disabled confirmation | Visible text cannot grant capability |
| Mixed outcome | Per-item result and recovery | A success headline cannot hide failures |

- **Primary UX goal:** Review before action
- **Freshness:** Proposal version and evidence state
- **Resilience:** Per-item outcomes

### Scope checkpoint

Separate AIProposal, ReviewState, UserDecision, PendingCommand, and authoritative Outcome. Cancellation only stops local waiting unless the action contract confirms otherwise.

### Frontend boundary

The frontend owns intent capture, uncertainty presentation, review controls, cancellable pending work, safe defaults, feedback, provenance display, and accessible state changes. Server-side model selection, inference, policy evaluation, and product mutations remain authoritative behind abstract proposal and action contracts.

# Clarifying Questions

- Which user journey and input modes must AI UX Resilience and Control Patterns support first?
- Which state is authoritative, which state may be optimistic, and how is freshness represented?
- What ordering, identity, and version rules must survive retries or out-of-order responses?
- Which interactions must remain usable with keyboard, assistive technology, and narrow viewports?
- What should users see during loading, partial failure, cancellation, and recovery?
- Which performance budgets are hypotheses to measure rather than universal thresholds?

# Architecture

## Architecture / High-level design

Use a structured pipeline: intent capture -> proposal adapter -> evidence and capability validation -> review store -> versioned action coordinator -> per-item outcome reducer.

---

ProposalAdapter validates structured, escaped data. ReviewStore owns selection and edits. CapabilityGate derives allowed actions from evidence freshness and permissions. ActionCoordinator submits one idempotent versioned command and reconciles per-item outcomes.

Boundary checks:
- proposal is separate from user decision
- evidence and capabilities have explicit freshness
- local edits survive safe refreshes
- pending command overlays rather than rewrites authority
- outcomes retain item-level success, failure, and recovery

---

### Core building blocks
| Piece | Responsibility | Design rationale |
| --- | --- | --- |
| ProposalAdapter | Validates structured generated content | Treats output as untrusted data. |
| ReviewStore | Owns selected items and edits | Keeps user intent inspectable. |
| CapabilityGate | Combines version, freshness, and permission | Display text never grants authority. |
| ActionCoordinator | Submits command and merges item results | Optimism cannot fabricate success. |

---

```text
Intent -> ProposalAdapter -> Proposal cache -> CapabilityGate
       -> ReviewStore -> ActionCoordinator -> Outcome reducer
```

### Proposal authority and action decisions
- Proposal, review, command, and outcome have separate owners.
- Cancel stops local waiting; it does not claim remote work stopped.
- Confirmation revalidates proposal version and capability.
- Retry keeps the same command ID only for an idempotent contract.

### Unsafe proposal and action coupling
- Treating generated prose as an executable command.
- Hiding stale or restricted evidence.
- Replacing per-item outcomes with one success banner.
- Rendering generated markup without an allowlisted formatter.

### High-level flow
1. **Request:** Capture intent under a request identity.
2. **Review:** Validate proposal structure, evidence, and capabilities.
3. **Confirm:** Snapshot reviewed IDs and edits under one versioned command.
4. **Reconcile:** Merge per-item outcomes and focus recoverable failure.

- **State model:** proposal + review + command + outcome
- **Control:** review/confirm/recover
- **Capability:** freshness and permission

### Proposal and action ownership

AI UX reliability comes from separating generated advice, user review, product capability, command intent, and authoritative outcomes.

### Worked example: uncertain suggestion affects a destructive edit

An assistant proposes removing three records but reports incomplete evidence. The UI must not convert a probabilistic suggestion into an automatic destructive command or hide which records were inferred.

### Scenario walkthrough
| Event | Store change | Visible UI | Invariant |
| --- | --- | --- | --- |
| Suggestion arrives | Store proposal, confidence label, evidence references, and capability. | Render a review state rather than completed success. | Suggestion is not an action. |
| Evidence is incomplete | Mark unsupported records and disable bulk confirmation. | Explain what needs review in plain language. | Uncertainty changes interaction. |
| User edits selection | Create explicit local intent containing only reviewed records. | Preview shows the exact effect and undo policy. | User authority is inspectable. |
| Command resolves | Merge authoritative per-record outcomes and retain failures. | Show partial success with focused recovery. | One headline never hides mixed results. |

# Tradeoffs

The central tradeoff is Design trustworthy AI-assisted UX with explicit uncertainty, cancellable work, safe defaults, feedback loops, failure recovery, and accessible state changes. The preferred design keeps browser-owned state explicit and treats server behavior as a UI-facing contract. A different rendering or state strategy is justified only when measured interaction cost, device constraints, or collaboration requirements change the evidence.

## Data model

Model generated advice, user review, command intent, and authoritative results as separate records. Their versions and owners prevent a visually convincing proposal from becoming product truth.

---

AIProposal contains structured affected items, evidence, uncertainty, capabilities, version, and expiry. ReviewState owns local selection and edits. PendingCommand records confirmed intent. CommandOutcome retains one result per affected item.

State-model checks:
- Proposal version and evidence freshness are explicit.
- Local edits cannot mutate cached proposal data.
- Command identity and version precondition make retry safe.
- Per-item outcomes cannot collapse into false complete success.

---

### Core entities
| Entity | What it represents | Why it matters |
| --- | --- | --- |
| AIProposal | Structured advice, evidence, and capabilities | Keeps recommendation separate from authority |
| ReviewState | User selection, edits, and acknowledgement | Makes intent inspectable |
| PendingCommand | Versioned action intent | Makes uncertain retry idempotent |
| CommandOutcome | Per-item authoritative result | Supports accurate mixed outcomes |

```ts
type EvidenceFreshness = 'current' | 'stale' | 'unavailable' | 'restricted';
type ItemOutcomeStatus = 'succeeded' | 'failed' | 'conflict';

interface EvidenceRef {
  id: string;
  label: string;
  freshness: EvidenceFreshness;
}

interface AIProposal {
  id: string;
  version: number;
  summary: string;
  affectedItemIds: string[];
  evidence: EvidenceRef[];
  uncertainty: string;
  capabilities: Array<'review' | 'apply'>;
  expiresAt: string;
}

interface ReviewState {
  proposalId: string;
  selectedItemIds: string[];
  edits: Record<string, string>;
  acknowledgedRisk: boolean;
}

interface ItemOutcome {
  itemId: string;
  status: ItemOutcomeStatus;
  message: string;
  retryable: boolean;
}
```

### Explicit state
- Proposal identity, version, expiry, and evidence freshness.
- Local selected IDs, edits, and acknowledgement.
- Idempotent command ID and proposal-version precondition.
- Per-item status, message, and retry eligibility.

### Proposal lifecycle pitfalls
- A confidence number with no evidence or calibration semantics.
- Capabilities inferred from generated text.
- One success boolean for a multi-item command.

- **Primary model:** AIProposal
- **Safety:** ReviewState and version precondition
- **Recovery:** Per-item CommandOutcome

### State checkpoint

A trustworthy model never conflates proposal content, reviewed user intent, an optimistic pending command, and authoritative per-item outcomes.

### Proposal, review, command, and outcome ownership

Represent AIProposal separately from UserDecision and CommandOutcome. Proposal data includes supported summary, confidence or uncertainty wording, evidence references, expiry, and permitted actions. UserDecision records reviewed items and edits. PendingCommand and per-item outcomes prevent an optimistic banner from fabricating a complete result.

### Client model
| Record | Key fields | Owner |
| --- | --- | --- |
| AIProposal | id, summary, evidence, uncertainty, expiresAt | Server cache |
| ReviewState | selected IDs, edits, acknowledgement | Local state |
| PendingCommand | commandId, proposalVersion, phase | Action overlay |
| Outcome | itemId, status, recovery | Authoritative result |

# Failure Modes

## Optimizations and deep dive

Optimize the review and action path without weakening authority. Preserve local edits, revalidate capability at confirmation, and keep mixed-result recovery beside the affected items.

---

Progressive rendering is useful only when proposal fields are structurally stable. The client may coalesce visual updates, but evidence, proposal version, selected items, and command outcomes must remain inspectable and internally consistent.

Review comprehension and action-recovery evidence:
- Users can identify evidence and affected items.
- Stale proposals cannot retain apply capability.
- Partial failures expose accurate next actions.

---

### Review-flow optimization controls
| Lever | What it does | Why it helps |
| --- | --- | --- |
| Structured progressive fields | Commits complete proposal sections instead of raw tokens | Earlier feedback without presenting malformed evidence |
| Capability revalidation | Checks current authority immediately before confirmation | Prevents a stale proposal from retaining an Apply action |
| Idempotent command retry | Reuses command identity after an uncertain response | Avoids duplicate product mutations |
| Per-item recovery | Keeps failed and conflicted outcomes attached to their rows | Makes mixed results understandable and retryable |

### Measured optimizations
- Coalesce proposal paints only after profiling review responsiveness.
- Cancel local waiting with AbortController while treating remote cancellation as a separate contract.
- Cache evidence labels only within their freshness and privacy boundary.
- Virtualize affected-item review when measured row count and complexity justify it.
- Preserve user edits when refreshing a stale proposal.

### Proposal and action recovery
- A late proposal overwrites a newer reviewed version.
- Apply remains enabled after evidence or permissions become stale.
- An uncertain retry creates duplicate actions.
- A mixed outcome collapses into one misleading success banner.

### Scenario: stale evidence and mixed outcomes
1. **Request:** Preserve the user's intent while proposal generation is cancellably pending.
2. **Review:** Display evidence freshness, uncertainty, affected items, and editable parameters.
3. **Confirm:** Revalidate capability and submit reviewed inputs against one proposal version.
4. **Reconcile:** Apply authoritative per-item outcomes, preserving failures and conflict recovery.

- **Comprehension:** Users can identify evidence and affected items.
- **Reliability:** Duplicate-action prevention and mixed-result recovery.
- **Control:** Edit, cancel, reject, and reversal outcomes.

### Truthful-action invariant

The lifecycle is resilient when a proposal cannot become an action without review, current authority, a versioned command, and truthful per-item reconciliation.

### Stale-proposal and mixed-outcome recovery

### Failure modes
| Failure | Response | Invariant |
| --- | --- | --- |
| Response is slow | Keep the task usable and expose Cancel. | Pending AI does not block unrelated work. |
| Output is malformed | Reject unsafe structure and show a bounded fallback. | Untrusted content never becomes raw HTML. |
| Proposal becomes stale | Disable confirmation and request current evidence. | Old advice cannot act on new state. |
| Partial command fails | Show per-item outcome and retry eligibility. | Users see the true mixed result. |

### Accessibility behavior

AI state changes use concise status messages instead of streaming token announcements. Review controls have labels that describe effect, uncertainty is communicated in text rather than color, focus moves only after user-triggered navigation, and Cancel remains keyboard reachable. Generated content supports zoom, selection, copy, and screen-reader reading order.

### Rollout and measurement

Start read-only with no destructive actions, evaluate comprehension and correction, then add low-risk commands behind capability flags. Test malformed output, stale proposals, cancellation, partial success, mobile overflow, large text, screen readers, and reduced motion. Monitor reversals, edits before acceptance, abandonment, recovery, and accessibility defects.

### Technical references
- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) — Risk framing for trustworthy AI systems.
- [W3C status role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role) — Non-interruptive status announcement semantics.

### Calibrated explanation and user control

An explanation should help the user decide, not imitate certainty. Prefer concrete evidence references, affected objects, constraints, and missing information over a generic confidence percentage whose calibration is unknown. When the service does provide a calibrated score, pair it with the decision threshold and a plain-language limitation. Keep model-generated rationale separate from verified product facts so a later refresh can update one without rewriting the user decision.

Feedback is part of the interaction contract. Capture whether the suggestion was accepted as-is, edited, rejected, or abandoned, but do not dark-pattern users into training consent. Explain where feedback goes, avoid recording sensitive free text by default, and keep correction available after an optimistic action. For high-impact flows, provide preview, confirmation, and a durable recovery path outside the transient AI panel.

Provenance also needs a freshness model. Evidence can be current, stale, unavailable, or permission-restricted, and those states should change whether confirmation is allowed. Link to the product record the user may inspect rather than displaying opaque source identifiers. If evidence disappears after a proposal is shown, invalidate the action capability while preserving the proposal as historical context. This prevents a visually unchanged recommendation from acting on a materially different world.

Streaming output should be buffered into readable updates rather than committing one UI change per token. Preserve the user's selection and scroll intent while text grows, stop scheduling paints when the panel is hidden, and announce only meaningful lifecycle transitions. A cancelled request can still deliver a late chunk, so acceptance is guarded by request identity in addition to AbortSignal. Any action proposed by the model is revalidated against current capabilities immediately before confirmation; display text alone never grants authority. Record rejected late chunks and capability failures without logging sensitive prompt content. Treat model text as untrusted content: render it through safe text or an allowlisted formatter, keep external links visibly identifiable, and require a separate user gesture before navigation or execution. Copy actions preserve provenance labels and exclude hidden instruction or control metadata.

# Metrics

Measure task completion and recovery before optimizing isolated rendering numbers. Track time to first useful UI, interaction latency by input mode, request and mutation failure rates, stale-response suppressions, retry outcomes, focus-restoration failures, layout overflow, and accessibility regressions. Segment field results by device capability, network class, viewport, and reduced-motion preference. Numeric targets begin as testable budgets and should be revised from production distributions.

# Rollout

Ship the smallest client slice that preserves identity, cancellation, recovery, accessibility, and observability. Validate the UI-facing contracts with deterministic fixtures, release behind a feature flag where appropriate, compare user outcomes and error distributions, and expand only after the failure and rollback paths have been exercised.

## Interface definition (API)

Expose structured proposal and action contracts. The client requests a proposal with AbortSignal, submits reviewed inputs with a version precondition and command ID, and receives authoritative per-item outcomes.

---

ProposalClient returns escaped structured fields, inspectable evidence, expiry, and explicit capabilities. ActionClient accepts only reviewed item IDs and edits against the proposal version.

Contract checks:
- AbortSignal cancels local waiting, not authoritative work by assumption.
- Proposal version and evidence freshness are visible.
- Command identity makes uncertain retries idempotent.
- Mixed results retain one outcome per item.

---

```ts
interface ApplyProposalCommand {
  commandId: string;
  proposalId: string;
  basedOnVersion: number;
  selectedItemIds: string[];
  edits: Record<string, string>;
}

interface AIReviewClient {
  requestProposal(intent: string, signal: AbortSignal): Promise<AIProposal>;
  refreshProposal(proposalId: string, signal: AbortSignal): Promise<AIProposal>;
  applyProposal(input: ApplyProposalCommand, signal: AbortSignal): Promise<{
    commandId: string;
    items: ItemOutcome[];
  }>;
}
```

### Core interfaces
| Contract surface | Shape (example) | How you explain it |
| --- | --- | --- |
| requestProposal | intent + context version | Returns structured reviewable advice. |
| refreshProposal | proposal ID | Revalidates evidence and capability. |
| applyProposal | command ID + version + reviewed inputs | Returns per-item authority. |

### Public behavior
- proposal identity, version, evidence, expiry, and capabilities
- reviewed item IDs and edits
- command identity and per-item outcomes

### Model and policy mechanics outside the view
- long blocking requests
- streaming without a request id
- raw internal errors without user-friendly mapping

### Integration flow
1. **Request:** Preserve cancellable pending intent.
2. **Review:** Validate proposal, evidence, and current capabilities.
3. **Apply and reconcile:** Send one versioned command and render per-item outcomes.

- **Authority:** explicit confirmation
- **Freshness:** proposal version
- **Recovery:** command ID and item outcomes

### Contract checkpoint

The contract is complete only when proposal freshness, user-reviewed input, idempotent command identity, and per-item authoritative outcomes are explicit.

### UI-facing contract

The assistant contract returns structured, escaped proposal content and capabilities rather than executable markup. Cancellable requests accept AbortSignal. Destructive commands require explicit reviewed inputs, version or proposal preconditions, and idempotency. The client never treats hidden reasoning as a required display field.

### From uncertain proposal to reconciled outcomes
1. **Frame:** State what the system can and cannot know before showing a recommendation.
2. **Review:** Expose evidence, affected items, editable parameters, and a safe default.
3. **Confirm:** Require explicit intent for high-impact actions and preserve an audit-friendly summary.
4. **Reconcile:** Render authoritative per-item outcomes and keep recovery next to failures.
