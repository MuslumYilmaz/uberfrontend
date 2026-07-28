---
title: "AI Image Generation MVP (Two-Week Design)"
slug: "ai-image-generation-mvp"
family: "system-design"
tech: "frontend"
audience: "Frontend engineers preparing for system design interviews"
intent: "Teach a concrete frontend architecture answer with explicit state, failure, accessibility, and rollout decisions."
target_words: 2400
primary_keyword: "ai image generation frontend system design"
status: "converted"
notes_for_conversion:
  - "Keep the route, question ID, and access level stable."
  - "Keep backend execution out of scope; describe only UI-facing contracts."
  - "Maintain parity with the five shipped RADIO sections."
search_intent: "Prepare a frontend system design answer for AI Image Generation MVP (Two-Week Design)."
reader_promise: "The reader can explain the frontend state, architecture, interfaces, failure recovery, accessibility, and rollout decisions for AI Image Generation MVP (Two-Week Design)."
unique_angle: "Design an AI image generation frontend with prompt state, accepted async jobs, indeterminate progress, idempotent retry and cancel, safe media, and recovery."
what_this_adds_beyond_basics: "Adds an end-to-end worked example, state ownership, recovery, accessibility, and measurable rollout guidance for AI Image Generation MVP (Two-Week Design)."
competitor_query: "AI Image Generation MVP (Two-Week Design) frontend system design"
competitor_takeaways:
  - "Catalog pages commonly list components but stop before reconciliation and failure recovery."
  - "Reference material is strongest when it anchors browser behavior in official platform guidance."
competitor_gaps:
  - "A state transition is often described without showing the visible UI result or preserved invariant."
  - "Accessibility, mobile reflow, cancellation, and rollback are frequently treated as afterthoughts."
sources:
  - "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/202"
  - "https://developer.mozilla.org/en-US/docs/Web/API/AbortController"
last_fact_checked_at: "2026-07-28"
reviewed_by: "FrontendAtlas editorial migration"
confidence: "high"
---
# Prompt

ai image generation frontend system design. Design an AI image generation frontend with prompt state, accepted async jobs, indeterminate progress, idempotent retry and cancel, safe media, and recovery.

## Requirements

---

Design a minimal AI image generation frontend where users submit a prompt, monitor an accepted asynchronous job, cancel or retry safely, and inspect a completed image. Show numeric progress only when the service provides a trustworthy value; otherwise use an indeterminate waiting state with elapsed context.

Decision surface:
- Can you define a realistic MVP scope?
- Do you handle long-running async jobs cleanly?
- Do you model UI states and error handling?
- Do you think about storage and delivery of generated assets?

---

### Prompt-to-image journey

1. Prompt submission: User enters a prompt and hits Generate. UI validates input and starts a job.
2. Generation state: Show a stable waiting state, use determinate progress only when supported, and prevent accidental duplicate jobs with idempotent creation rather than a visual disable alone.
3. Completion: Render the image when the job finishes. Offer download or share.
4. Error and retry: If the job fails or times out, show a clear error and a retry button.
5. History: Show a short history list of recent generations with thumbnails.

### Asynchronous generation guarantees

- UI must not freeze during generation.
- Users should understand when to wait vs retry.
- Jobs should be resumable on page reload.
- Storage should be efficient and CDN-backed.
- Errors should be handled gracefully.

### MVP scope vs future scope

| Now (2 weeks) | Later | Why |
| --- | --- | --- |
| Single image per prompt | Batch or variations | Keeps API and UI simple |
| Basic prompt input | Advanced controls (style, seed) | Defer complexity |
| Polling or SSE | Full realtime queue view | MVP can use a simpler transport |

| Signal | Value | Interpretation |
| --- | --- | --- |
| MVP goal | Prompt -> image | Deliver the core flow quickly. |
| Async handling | Job status | Poll or stream until complete. |
| Storage | Object store + metadata | CDN for fast image delivery. |

### Scope checkpoint

A defensible two-week scope prioritizes a reliable prompt-to-image flow, honest lifecycle states, and recoverable commands. Enhancements belong after those core guarantees are measurable.

### Frontend boundary

The client owns prompt and option state, idempotent job commands, lifecycle monitoring, honest progress, safe image presentation, cancellation, retry, and history navigation. The generation service is an abstract asynchronous job contract; model execution and asset storage stay outside the browser.

# Clarifying Questions

- How long does generation typically take?
- Do we need progress events or just a spinner?
- How many images per prompt?
- Should results be stored permanently or expire?
- Do we need content moderation in the flow?
- What is the rate limit per user?

# Architecture

---

The UI submits a prompt to a Generate API that returns a job id. A JobStatus poller (or SSE stream) updates the UI until completion. When done, the image is served from object storage/CDN.

Boundary checks:
- One accepted asynchronous job lifecycle.
- Separation between local view state and versioned job updates.
- Safe asset metadata, placeholder, URL, and media-failure states behind an abstract job/asset contract.
- Resume from the stored status URL after reload.

---

### Core building blocks

| Piece | Responsibility | Design rationale |
| --- | --- | --- |
| PromptForm | Collects prompt and submits | Validates input and kicks off generation. |
| GenerationStore | Tracks job state and results | Single source of truth for UI. |
| JobStatusClient | Polls or streams job updates | Updates progress and completion. |
| Asset Delivery | Serves images via CDN | Fast, cacheable delivery. |
| Metadata DB | Stores job records and output URLs | Enables history and resume. |

---

```text
type JobStatus = 'queued' | 'running' | 'cancelling' | 'cancelled' | 'done' | 'failed';
type JobProgress =
  | { kind: 'indeterminate' }
  | { kind: 'determinate'; value: number };

interface GenerationJob {
  id: string;
  statusUrl: string;
  prompt: string;
  status: JobStatus;
  version: number;
  progress?: JobProgress;
  image?: { url: string; width: number; height: number };
  error?: { code: string; message: string; retryable: boolean };
}

interface PendingCommand {
  idempotencyKey: string;
  kind: 'create' | 'retry' | 'cancel';
  jobId?: string;
  basedOnVersion?: number;
}

```

### MVP lifecycle decisions

- Use a job id to track progress.
- Show a loading state until the job is done.
- Persist job metadata so history loads fast.
- Keep the MVP flow simple and reliable.

### Generation architecture failure patterns

- Blocking the UI until the image returns.
- No way to recover if the app reloads mid-job.
- Hard-coding image data into the API response.
- No clear separation between job state and UI.

### High-level flow

1. Submit prompt: Before transport begins, store the create idempotency key and prompt snapshot. POST /generations returns 202 Accepted, a Location status URL, job ID, and initial version; only then can the pending command link to the job.
2. Track status: Poll or stream job updates until status=done.
3. Render result: When done, show the image from CDN and update history.
4. Handle failures: If status=failed, preserve the prompt and expose the versioned retry command.

| Signal | Value | Interpretation |
| --- | --- | --- |
| Async control | Job status | Simple polling or SSE works for MVP. |
| Storage | Object store + DB | Separates binary assets from metadata. |
| UX focus | Clear loading state | Users know the job is running. |

### Asynchronous job boundary

For an MVP, simplicity wins. A single job flow with solid error handling and a clear loading state is better than a complex UI that is hard to ship in two weeks.

### Worked example: create response is lost, then cancel races completion

The user submits once but the 202 response is lost. Retrying must recover the same job instead of creating a duplicate. Later, a cancel command races the job reaching done.

### Scenario walkthrough

| Event | Store change | Visible UI | Invariant |
| --- | --- | --- | --- |
| Create is submitted | Store idempotency key k1 and pending prompt snapshot. | The UI shows submitting without inventing a job ID. | One intent has one command identity. |
| Response is lost | Retry k1 rather than creating k2. | The UI remains uncertain but recoverable. | Network uncertainty does not duplicate work. |
| Job is recovered | Normalize job j7 version 2 with indeterminate progress. | Show elapsed waiting and Cancel. | No fabricated percentage appears. |
| Cancel races done | Apply the newer unique authoritative version; done may beat an earlier cancelling state. | Render the image or confirmed cancellation with one explanation. | Unique monotonic job versions define order; contradictory equal versions trigger a status refetch. |

# Tradeoffs

## Data

Model the generation job as a versioned asynchronous resource. Progress is optional and can be determinate or indeterminate; it is never fabricated from elapsed time. Keep pending create, retry, and cancel commands separate from server-confirmed job state.

---

Model each generation as a Job with status, prompt, and output URLs. The UI renders a list of jobs and shows the active one.

State-model checks:
- Clear job status field.
- Output URL stored separately from prompt.
- Metadata to render history.
- Error fields for failures.

---

### Core entities

| Entity | What it represents | Why it matters |
| --- | --- | --- |
| GenerationJob | A single prompt-to-image request | Primary UI unit |
| JobStatus | queued/running/cancelling/cancelled/done/failed | Drives loading and error UI |
| Asset | Image URL + metadata | Displayed in the results grid |

```typescript
type JobStatus = 'queued' | 'running' | 'cancelling' | 'cancelled' | 'done' | 'failed';
type JobProgress =
  | { kind: 'indeterminate' }
  | { kind: 'determinate'; value: number };

interface GenerationJob {
  id: string;
  statusUrl: string;
  prompt: string;
  status: JobStatus;
  version: number;
  progress?: JobProgress;
  image?: { url: string; width: number; height: number };
  error?: { code: string; message: string; retryable: boolean };
  createdAt: number;
}

interface PendingCommand {
  idempotencyKey: string;
  kind: 'create' | 'retry' | 'cancel';
  promptSnapshot?: string;
  jobId?: string;
  basedOnVersion?: number;
}

interface GenerationState {
  jobsById: Record<string, GenerationJob>;
  activeJobId?: string;
  pendingByKey: Record<string, PendingCommand>;
}

```

### Explicit state

- Job status and timestamps.
- Output URL for the generated image.
- Error field for failed jobs.
- A list of recent jobs for history.

### Generation-state pitfalls

- No status field, so UI cannot show progress.
- No job id, so polling is impossible.
- Embedding base64 images instead of URLs.
- No history list, so users lose past results.

| Signal | Value | Interpretation |
| --- | --- | --- |
| Primary entity | GenerationJob | Everything revolves around the job lifecycle. |
| Output | imageUrl | Serve via CDN for speed. |
| History | jobs[] | Small list of recent items. |

### State checkpoint

The MVP model remains compact but precise: versioned status, honest progress semantics, safe output metadata, retryable error, and separate pending command intent.

### Command, job, and media ownership

Store prompt snapshots separately from versioned jobs and pending commands. A create command is keyed before any job ID exists and links to the returned statusUrl later. Progress is a tagged union of determinate and indeterminate. Every authoritative transition has a unique monotonic version; equal-version contradictions trigger refetch rather than client precedence.

### Client model

| Record | Key fields | Owner |
| --- | --- | --- |
| PromptDraft | text, options, safety acknowledgement | Local state |
| GenerationJob | id, status, version, progress, output | Server cache |
| PendingCommand | key, kind, basedOnVersion | Action state |
| JobMonitor | cursor, poll delay, freshness | Runtime |

## Interfaces

Define a simple API contract: create job, fetch status, and deliver image URLs.

---

Expose a generate endpoint that returns a job id, then a status endpoint for polling or a stream endpoint for realtime updates.

Contract checks:
- Create is idempotent before a job ID exists and returns a status URL.
- Every job transition has a unique monotonic version.
- Polling and optional streaming expose the same lifecycle model.
- Cancel and retry require command identity plus the observed job version.
- Output URLs carry safe display metadata.

---

```typescript
interface CreateGenerationInput {
  prompt: string;
  idempotencyKey: string;
}

interface VersionedJobCommand {
  jobId: string;
  basedOnVersion: number;
  idempotencyKey: string;
}

interface GenerationAdapter {
  create(input: CreateGenerationInput, signal: AbortSignal): Promise<GenerationJob>;
  getStatus(statusUrl: string, signal: AbortSignal): Promise<GenerationJob>;
  retry(input: VersionedJobCommand, signal: AbortSignal): Promise<GenerationJob>;
  cancel(input: VersionedJobCommand, signal: AbortSignal): Promise<GenerationJob>;
}
```

```http
POST /api/images/generations
Idempotency-Key: create-8f31
Content-Type: application/json

{ "prompt": "a blue robot" }

202 Accepted
Location: /api/images/jobs/job_123
{
  "id": "job_123",
  "statusUrl": "/api/images/jobs/job_123",
  "prompt": "a blue robot",
  "status": "queued",
  "version": 1,
  "createdAt": 1785190000
}

GET /api/images/jobs/job_123

200 OK
{
  "id": "job_123",
  "statusUrl": "/api/images/jobs/job_123",
  "prompt": "a blue robot",
  "status": "running",
  "version": 2,
  "progress": { "kind": "indeterminate" },
  "createdAt": 1785190000
}

POST /api/images/jobs/job_123/retry
Idempotency-Key: retry-44bd
If-Match: "job_123-v5"

202 Accepted
{ "status": "queued", "version": 6 }

POST /api/images/jobs/job_123/cancel
Idempotency-Key: cancel-bd92
If-Match: "job_123-v2"

202 Accepted
{ "status": "cancelling", "version": 3 }
```

### Core interfaces

| Contract surface | Shape (example) | How you explain it |
| --- | --- | --- |
| POST /generate | 202 + Location + statusUrl + job version | Creates or recovers one long-running job for the idempotency key. |
| GET /jobs/:id | versioned status + optional progress | UI polls with backoff or resumes a stream. Progress can be indeterminate. |
| GET /jobs/:id/stream | versioned lifecycle events | Optional realtime updates that may omit a numeric percentage. |
| POST /jobs/:id/retry or /cancel | idempotency key + based-on version | Retry requeues a confirmed failed job; cancel records intent, and both return a newer job version. |
| imageUrl | CDN URL | Result is served from object storage. |

### Public behavior

- jobId and status
- determinate or indeterminate progress
- versioned output metadata when done
- idempotent create, retry, and cancel commands

### Job-monitor internals

- raw model internals
- binary image blobs in API responses
- long-lived polling without backoff

### Integration flow

1. Create job: Persist the create idempotency key first, accept 202 Accepted, store job ID, statusUrl, and version, and monitor that Location resource.
2. Watch status: Poll with backoff or resume a lifecycle stream. Show a spinner or elapsed state when the service cannot produce trustworthy numeric progress.
3. Render output: Display the image from the CDN URL.

| Signal | Value | Interpretation |
| --- | --- | --- |
| Main endpoint | /generate | Creates the generation job. |
| Result | imageUrl | CDN-delivered output. |
| Realtime | optional SSE | Nice-to-have for MVP. |

### Contract checkpoint

Keep the contract minimal and job-based. That is the simplest reliable way to ship an MVP quickly.

### UI-facing contract

Create returns 202 Accepted with Location, statusUrl, job ID, and version. Monitoring uses conditional polling or resumable events. Cancel and retry are idempotent versioned commands. The service assigns a unique monotonically increasing version to every transition; equal-version contradictions cause refetch. Job progress may be absent, and image URLs are rendered under a restrictive content policy.

### Prompt-to-terminal-job path

1. Create idempotent generation job: Snapshot prompt, allocate an idempotency key, and accept an asynchronous job resource.
2. Monitor versioned status resource: Poll with backoff or resume events while exposing freshness and honest progress.
3. Reconcile job and command versions: Apply only newer job versions and resolve command responses in any order.
4. Render capability-safe output: Reserve image geometry, validate metadata, and expose download or retry according to capability.

# Failure Modes

Discuss how you would improve the MVP once it works: faster perceived latency, better reliability, and more efficient storage.

---

After the MVP ships, measure completion distributions, cancellation outcomes, retry duplication, and error recovery. Add resumable lifecycle streaming only when it improves freshness; never invent a percentage when the service exposes only queued or running.

Generation quality checks:
- Completion, cancellation, retry, and recovery outcomes drive optimization.
- Perceived progress remains honest when numeric progress is unavailable.
- Thumbnail and cache policies bound bandwidth, memory, and storage.
- Every uncertain command retains an idempotent recovery path.

---

### Job lifecycle optimizations

| Lever | What it does | Why it helps |
| --- | --- | --- |
| Progress events | Show incremental status | Improves perceived latency |
| Thumbnail previews | Load low-res first | Faster visual feedback |
| Result caching | Cache recent generations | Avoids re-fetching |
| Retry/backoff | Retry failed jobs | Higher success rate |

### Measured optimizations

- Show a low-res preview first.
- Limit concurrency per user.
- Cache recent results and thumbnails.
- Add retry with backoff for failures.
- Use CDN with cache headers for images.

### Generation failure and recovery

- Jobs stuck in running state.
- Large image payloads slowing the UI.
- No retry path after errors.
- Duplicate submissions creating multiple jobs.

### Scenario: slow, large, or uncertain generation

1. Slow generation: Add versioned lifecycle events and show either trustworthy determinate progress or a clear indeterminate waiting state.
2. Large outputs: Render a thumbnail first, then load full image.
3. Errors: Keep the prompt, reuse an idempotency key when retrying an uncertain create response, and use a new explicit retry command only after a confirmed terminal failure.

| Signal | Value | Interpretation |
| --- | --- | --- |
| Primary metric | Time to first preview | Users feel the feature is fast. |
| Reliability | Job success rate | Track errors and retries. |
| Cost | Image bandwidth | Optimize with caching. |

### MVP reliability invariant

Ship a simple, reliable MVP first. Then optimize perceived speed and reliability based on real metrics.

### Job and media recovery failures

### Failure modes

| Failure | Response | Invariant |
| --- | --- | --- |
| Create times out | Retry the same key and query the returned Location. | No duplicate generation is created. |
| Progress is unknown | Use an indeterminate state and elapsed context. | The UI stays truthful. |
| Image fails to load | Keep job metadata and provide retry or download recovery. | A broken preview does not erase output. |
| Permission expires | Hide protected output and reauthenticate before refetch. | Client cache is not an authorization boundary. |

### Accessibility behavior

Prompt and option controls have persistent labels, errors link to the relevant control, and submission status is announced once. Progress exposes determinate values only when real and otherwise uses readable indeterminate text. Generated images have user-editable alternative text or an appropriate description workflow, while animation and skeleton motion respect reduced-motion settings.

### Rollout and measurement

Ship polling and a compact job history before optional streaming. Test lost responses, duplicate retries, cancel-complete races, long queues, unsafe output, image failures, auth expiry, mobile overflow, and reduced motion. Observe duplicate-job prevention, terminal convergence, cancellation outcome, and recovery.

### Technical references

- [MDN 202 Accepted](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/202) — Semantics for accepted but incomplete asynchronous work.
- [MDN AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) — Browser cancellation for monitoring and obsolete requests.

# Metrics

- MVP goal: Prompt -> image. Deliver the core flow quickly.
- Async handling: Job status. Poll or stream until complete.
- Storage: Object store + metadata. CDN for fast image delivery.
- Async control: Job status. Simple polling or SSE works for MVP.
- Storage: Object store + DB. Separates binary assets from metadata.
- UX focus: Clear loading state. Users know the job is running.
- Primary entity: GenerationJob. Everything revolves around the job lifecycle.
- Output: imageUrl. Serve via CDN for speed.
- History: jobs[]. Small list of recent items.
- Main endpoint: /generate. Creates the generation job.
- Result: imageUrl. CDN-delivered output.
- Realtime: optional SSE. Nice-to-have for MVP.
- Primary metric: Time to first preview. Users feel the feature is fast.
- Reliability: Job success rate. Track errors and retries.
- Cost: Image bandwidth. Optimize with caching.

# Rollout

### Scenario: slow, large, or uncertain generation

1. Slow generation: Add versioned lifecycle events and show either trustworthy determinate progress or a clear indeterminate waiting state.
2. Large outputs: Render a thumbnail first, then load full image.
3. Errors: Keep the prompt, reuse an idempotency key when retrying an uncertain create response, and use a new explicit retry command only after a confirmed terminal failure.

### Technical references

- [MDN 202 Accepted](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/202) — Semantics for accepted but incomplete asynchronous work.
- [MDN AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) — Browser cancellation for monitoring and obsolete requests.
