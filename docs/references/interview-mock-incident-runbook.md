# Interview Mock incident and rollback runbook

This runbook covers the operational controls that exist in this repository. It does not authorize a production rollout, artifact promotion, billing refund, or production database write. Production actions require the normal incident commander, deployment, database, and customer-support approvals.

## Safety invariants

- Keep `INTERVIEW_SYSTEM_DESIGN_ACCESS=off` throughout this direct-public release.
- Enable `public` while still drained only after the release record proves every required artifact/dependency. Readiness is deliberately disabled during drain; after changing to `normal`, immediately restore drain if health reports `gateReady: false` or a required artifact/dependency as blocked.
- Preview `preflight` and Production `public` require approved artifacts. Candidate artifacts are limited to explicitly enabled development/test evaluation outside `preflight`; never set a production path override to a candidate package.
- New Preview `preflight` and Production `public` starts are fail-closed when the shared Redis rate limiter is unavailable. Active save and submit traffic intentionally uses the mutation limiter's in-process fallback so an already-started session can drain.
- `halt` stops user mutation endpoints. A safe GET may still apply the existing canonical server-deadline reconciliation for an expired session; this is not permission for another mutation. Use halt only when continuing risks data integrity, answer leakage, security, or materially misleading results.
- A technical void removes the result and restores an eligible free monthly quota slot. It is not a cash refund and must not be represented as one.

## Signals to have open

Before changing state, record the incident start time and inspect:

- `GET /api/health/interview`: HTTP status, `gateProfile`, `gateRequired`, `gateReady`, `launchReady`, `artifacts.coding`, `systemDesignRequired`, `artifacts.systemDesign`, `dependencies.redisRateLimit`, and `dependencies.exposureStore`. `dependencies.cohort` is relevant only to the dormant cohort compatibility mode. During `drain` or `halt`, inspect the same fields because health deliberately does not fail the instance when no new starts are allowed.
- `interview.http.requests` and `interview.http.duration_ms` split only by method, normalized path, operation, and status. Format, level, and track belong only on applicable bounded lifecycle events. Do not add user IDs, session IDs, prompts, options, answers, code, or drafts to telemetry.
- `interview.lifecycle` counts for `availability_checked`, `create_started`, `create_succeeded`, `create_failed`, `resumed`, `save_conflict`, `deadline_rejected`, `mcq_submitted`, `timed_out`, `abandoned`, `completed`, `technical_voided`, `quota_denied`, `rate_denied`, `rate_limit_unavailable`, `rate_limit_fallback`, `artifact_unavailable`, `inventory_exhausted`, `selection_overlap`, `readiness_checked`, and `request_failed`.
- `interview.readiness.ready`, `interview.readiness.redis_latency_ms`, `interview.selection.literal_overlap`, `interview.selection.semantic_overlap`, and `interview.selection.target_exposure_count`. Redis latency is emitted only when the Redis launch dependency is required; `off`, `drain`, and `halt` do not probe Redis.
- Redis availability/latency plus `RATE_LIMIT_UNAVAILABLE` responses, split by the bounded limiter `code`. `quota_denied` is quota enforcement, `rate_denied` is an actual 429, `rate_limit_unavailable` is a fail-closed Redis 503, and `rate_limit_fallback` is an active-session process-local fallback; do not combine these signals.
- Mongo availability/latency, write conflicts, and transaction errors.

Expected quota, ownership, validation, deadline, conflict, and abuse-control 4xx responses are tracked separately and are not counted as service-availability failures. For authenticated, authorized, schema-valid requests, the initial rolling 28-day SLOs are:

- save and submit success at least 99.9%;
- availability, create, and results success at least 99.5%;
- server p95 availability at most 1 second;
- server p95 create, submit, and results at most 1.5 seconds;
- server p95 save at most 750 milliseconds.

During the first 24 hours after direct-public launch, apply the same targets to the complete observation window. Start and completion counts are informational, not keep-public thresholds. A single required artifact or Redis readiness 503 pages the on-call and requires an immediate drain. Two core Interview 5xx responses in five minutes require drain and rollback of the last deployment. Any protected-window selection overlap, private-answer leak, silently lost save, or misleading authoritative result requires `off + halt`. Alert on 429 by limiter code so expected fair-use enforcement is not mixed with an abuse spike or configuration error.

## Pre-launch operational evidence

Use `docs/references/interview-mode-release-record.md` for the candidate and keep every evidence link secret-free.

Do not set `INTERVIEW_MONITORING_READY=true` or `INTERVIEW_NATIVE_SAFARI_READY=true` until all evidence below is attached to the release record:

- a named dashboard owner and a Sentry dashboard URL showing endpoint success/latency, readiness, lifecycle funnel, save conflicts, timeouts, protected overlap, 429, Redis fallback, and 503 metrics;
- a timestamped successful synthetic Sentry event/metric ingestion, tested paging route, and evidence that each hard drain/halt threshold reaches the current on-call destination;
- the saved Vercel structured-log query using only redacted Interview route contracts, plus a reviewed sample proving request bodies, query strings, cookies, user/session IDs, answers, drafts, and code are absent;
- a secret-free successful run of the real two-process Upstash verifier against the production-equivalent staging store whose output proves `applicationProcesses:2`, `sharedCounterAcrossProcesses:true`, `idempotentRetryChargedOnce:true`, and `thirdUniqueRequestHttpStatus:429`;
- native Safari and VoiceOver sign-off with macOS, Safari, viewport, keyboard, focus, timer-announcement, coding-editor, resume, and results evidence;
- named privacy and operations owners plus dated evidence links for account-deletion cascade, the 90-day response-bearing session TTL and 365-day identity-only exposure retention, and backup retention/deletion. The release record must name the backup system, policy owner, retention duration, deletion SLA, and last restore/deletion exercise; backup deletion remains an infrastructure policy and cannot be inferred from Mongo indexes.
- a timestamped rollback rehearsal showing `normal -> drain -> halt -> drain -> normal`, active-session behavior at each state, the last-deploy rollback command/procedure, the incident commander, and the owner authorized to change each operator readiness flag.

The readiness endpoint treats these two flags as operator attestations, not as evidence by themselves. A flag without the linked release record is a failed release gate.
Monitoring readiness additionally requires an enabled, initialized Sentry SDK plus Interview lifecycle and request metrics. Verify the fixed PII-free synthetic issue and readiness gauge before enabling the attestation:

```bash
cd backend
npm run verify:interview-sentry
npm run verify:interview-sentry -- --execute --confirm=VERIFY_INTERVIEW_SENTRY
```

The first command is dry-run only. Execute only with exact `VERCEL_ENV=preview`, `SENTRY_ENVIRONMENT=preview`, `INTERVIEW_MODE_ACCESS=preflight`, and `SENTRY_RELEASE=VERCEL_GIT_COMMIT_SHA`; then record the matching Sentry issue, metric, and email-delivery evidence.

## State progression

### 1. Normal to drain

Use drain for artifact, dependency, capacity, or product-quality degradation where active sessions can still be preserved.

1. Set `INTERVIEW_OPERATIONAL_STATE=drain` and a concise `INTERVIEW_SHUTDOWN_NOTICE` with a support-safe explanation. Apply through the normal configuration deployment process.
2. Verify authenticated `/api/interviews/availability` returns `canCreate: false`, `operationalState: drain`, `activeSessionPolicy: continue`, and any owned active-session summary.
3. Verify create returns `503 INTERVIEW_DRAINING` while active control, resume, save, and submit remain available.
4. Watch active-session count, save conflicts, timeouts, completion, and abandonment until the active population reaches the incident commander's acceptable level.
5. Keep System Design off independently. Do not broaden access while draining.

### 2. Drain to halt

Escalate when allowing active sessions to continue could lose data, expose private answers, accept untrustworthy runner evidence, violate ownership/auth boundaries, or produce misleading results.

1. Set `INTERVIEW_OPERATIONAL_STATE=halt` and an actionable `INTERVIEW_SHUTDOWN_NOTICE`.
2. Verify active mutation routes return `503 INTERVIEW_HALTED`; `/control` must report the halted policy so open clients freeze their controls.
3. Verify a safe GET does not accept a user mutation. If an expired session is reconciled to its canonical deadline state during GET, record that deadline transition separately; do not classify it as a halt bypass.
4. Preserve the exact incident time window and affected session IDs from server-side evidence. Do not collect drafts or answer payloads into the incident ticket.
5. Send the active-session communication below. Decide whether sessions will resume after recovery or be technically voided.

### 3. Access rollback

Set `INTERVIEW_MODE_ACCESS=off`. Access off hides discovery and prevents new starts but does not itself halt active saves/submits. Pair it with `drain` when active sessions may finish, or `halt` when they may not. Keep dormant cohort BPS at `0` and do not introduce a rollout salt as an incident workaround.

After configuration propagation:

- Verify guest and authenticated discovery surfaces no longer offer a new start.
- Verify direct create is denied and no candidate artifact path is selected.
- Verify the active-session policy matches the incident decision.
- Keep the rollback in place until artifact health, Redis, exposure indexes, Mongo, error rate, and a controlled ordinary-user Preview preflight flow against the same release are healthy.

Return from `halt` to `drain` first and validate active resume/save/submit. Re-prove the Production artifact and dependency evidence while drained, then follow the direct-public sequence below to return to `normal` and check readiness immediately. Never jump directly from an unresolved halt to live starts.

## Release-readiness health response

During `drain` or `halt`, `/api/health/interview` deliberately reports `gateProfile: disabled`, `gateRequired: false`, `gateReady: false`, and `INTERVIEW_RELEASE_DISABLED`. These values alone do not indicate an incident or prove that the artifacts and dependencies are healthy.

In Preview `preflight` or Production `public` mode, when `operationalState: normal` and `gateRequired: true`, respond as follows if `/api/health/interview` returns `503 INTERVIEW_ARTIFACTS_BLOCKED` or `503 INTERVIEW_DEPENDENCIES_BLOCKED`, or reports `gateReady: false`:

1. Drain immediately; do not point runtime paths at candidate files and do not promote content as an incident workaround.
2. Record `accessMode`, `operationalState`, `gateProfile`, `gateRequired`, `gateReady`, dependency codes, artifact kind, and artifact status from the health response. The response intentionally contains no questions or answers.
3. Run the repository's generation check and content validation against a clean, reviewed checkout. Compare release metadata, final approval, version, and SHA-256 parity through the owning validators.
4. Repair the source/release pipeline under the normal content-review process and re-prove the required artifact and dependency evidence while drained. Follow the direct-public sequence below; immediately after returning to `normal`, check health on every instance and restore drain if readiness fails.

System Design remains off for this release. A System Design failure must not be bypassed by enabling it under the main Interview flag.

Before direct public launch, prepare Production while access is `off` and operational state is `drain`. The verifier is read-only; the migrator and backfill are dry-run by default and never copy prompts, answers, code, or drafts:

```bash
cd backend
npm run verify:interview-exposure-store -- --database=<exact-database-name>
npm run backfill:interview-content-exposures -- --database=<exact-database-name>
npm run migrate:interview-exposure-indexes -- --database=<exact-database-name>
```

Production execution requires exact `MONGO_TARGET=production`, `EXPECTED_MONGO_DB_NAME`, `--database`, `--allow-production`, and separate action-time approval. Create-only index execution additionally requires `INTERVIEW_EXPOSURE_INDEX_ALLOW_PRODUCTION=true`, `--execute`, and `--confirm=CREATE_INTERVIEW_EXPOSURE_INDEXES:<database>:<plannedCount>:<expiredCount>` using the exact dry-run values. It must refuse duplicates, invalid data, index mismatches, and unreviewed extra indexes; it never drops or renames indexes and creates the TTL index last.

After the read-only verifier reports all five indexes ready, backfill execution requires `INTERVIEW_EXPOSURE_BACKFILL_ALLOW_PRODUCTION=true`, `--execute`, `--expected-inserts=<wouldInsert>`, and `--confirm=BACKFILL_INTERVIEW_EXPOSURES:<database>:<wouldInsert>` using the exact dry-run values. Require a final dry-run with `wouldInsert=0` and duplicate/invalid/conflict counts all zero. The operation is idempotent by session ID; older sessions already deleted by the 90-day session TTL cannot be reconstructed and remain a documented historical gap.

## Redis fail-closed response

`RATE_LIMIT_UNAVAILABLE` on a Preview preflight or Production public create means the distributed limiter cannot enforce a global limit. Do not switch those operations to memory fallback outside local preflight.

1. Drain new starts and confirm active save/submit remains usable.
2. Check Redis credentials, endpoint health, namespace, latency, and error rate without printing tokens.
3. Run `npm run verify:interview-redis-multi-instance -- --execute` with the staging acknowledgement and verify two application worker processes share one counter, a retry with the same idempotency key is charged once across processes, and the third unique HTTP request returns 429 with `Retry-After` before returning to normal.
4. Treat repeated `429` separately: identify the limiter code, confirm `Retry-After`, and compare account and IP distributions without storing raw identifiers in Interview telemetry.

## Active-session communication

Use plain language and do not promise a score or refund before the disposition is known:

> Interview Mock is temporarily paused because of a technical issue. Your session cannot continue right now. Please keep this page open if possible. We will either restore access or void the affected attempt and restore any eligible free quota. Practice coding checks are browser-reported evidence, not an authoritative hiring assessment.

For drain-only incidents, replace “cannot continue” with “new sessions are paused; your active session can continue.” Support should reference the account and incident window through authorized systems, not ask the user to send answer text or source code.

## Technical void and quota restoration

The authenticated admin route is the preferred tool for one session:

```text
POST /api/interviews/:sessionId/technical-void
{ "reasonCode": "platform_outage" }
```

Approved reasons are `content_integrity`, `platform_outage`, `preview_runtime`, `runner_unavailable`, and `starter_unavailable`.

For an incident batch, the repository CLI accepts exact session IDs only (maximum 500), is dry-run by default, emits aggregate output only, and uses one Mongo transaction for session voids, free-quota restoration, and abandon-window cleanup. It therefore requires a transaction-capable Mongo deployment.
The verifier ID must resolve to an admin user both before execution and inside the transaction.

Dry run against the exact target database:

```bash
cd backend
npm run incident:void-interviews -- \
  --session-id=<id-1>,<id-2> \
  --verified-by=<admin-user-id> \
  --reason-code=platform_outage \
  --database=<exact-database-name>
```

Review `requested`, `matched`, `eligible`, `alreadyVoided`, `freeQuotaRefunds`, and `byStatus`. If any target is missing, the tool refuses the entire operation.

Production execution additionally requires all of the following:

- change/incident approval and a current database backup or recovery point;
- `MONGO_TARGET=production` with the exact expected database guard configured;
- `INTERVIEW_INCIDENT_VOID_ALLOW_PRODUCTION=true` in the operator's one-time environment;
- `--allow-production`, `--execute`, and the exact token printed by the dry-run procedure: `--confirm=VOID_INTERVIEW_SESSIONS:<count>:<reason>`.

After execution, verify aggregate changed/refunded counts, sample affected sessions through the admin route, free quota availability, results rejection with `INTERVIEW_SESSION_VOIDED`, and the absence of active affected sessions. Re-running the exact batch is idempotent for already-voided sessions.

Premium Interview access does not reserve a monthly quota slot, so the tool has no subscription or payment transaction to refund. Any cash or subscription credit requires a separate approved billing workflow; no such Interview-specific bulk billing workflow is implemented in this repository.

## Recovery exit checklist

- Root cause and affected window are documented without private response content.
- Required artifacts are ready on every instance and System Design remains independently gated.
- Redis global enforcement is proven across at least two instances.
- Mongo writes and transactions are healthy.
- A real ordinary-user Preview preflight availability -> create -> save -> refresh/resume -> submit -> results flow passes without API interception against the same release.
- 503, 429, save-conflict, timeout, completion, and repeat-rate dashboards are healthy against approved baselines.
- Affected sessions are resumed or technically voided; eligible free quota is restored; user communication is sent.
- A named owner, rollback trigger, and on-call coverage are active before returning to `normal`. Immediately after that transition with Production access `public`, verify every instance reports `INTERVIEW_RELEASE_READY`; if readiness fails, restore `drain`, then `off + drain`.

## Direct public launch and first 24 hours

System Design remains off. There are no internal, 1%, 5%, or 25% stages and no minimum completion count:

1. Complete ordinary-user Preview preflight plus Redis, cross-browser, Sentry/email, log-redaction, native Safari/VoiceOver, retention, Production data, and rollback evidence in the release record.
2. Keep Production `off + drain`; obtain separate approvals for Production Redis credentials, database execution, monitoring/native-Safari attestations, and environment changes.
3. Set Production access to `public` while state remains `drain`; re-check the approved environment and data evidence. Readiness remains deliberately disabled while drained.
4. Set the operational state to `normal`, immediately verify every instance reports `gateProfile=release`, `gateReady=true`, and `INTERVIEW_RELEASE_READY`, then verify the first authenticated flow. If readiness fails, return to `drain`, then `off + drain`.
5. Monitor closely for 24 hours and record `Keep public`, `Drain`, `Halt`, or `Off`. Starts and completions are context only, never a pass threshold.

Do not wait for the 24-hour review on a hard signal: readiness/Redis blocks force drain; two core 5xx in five minutes force drain and deploy rollback; protected overlap, private-data leakage, silent save loss, or misleading results force `off + halt`. Resume only after root-cause correction and all direct-public gates are re-proven.
