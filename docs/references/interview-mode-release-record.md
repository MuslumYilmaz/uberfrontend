# Interview Mode release record

Copy this template for each release candidate. A completed record is evidence; it does not authorize a Production database write, secret change, deployment, or access/state change. Each action still requires its normal action-time approval.

## Candidate

- Commit SHA:
- Release/version:
- Preview frontend URL:
- Preview backend URL:
- Record owner:
- Operations owner:
- Privacy owner:
- Started at (UTC):
- System Design access: `off`

`internal` and `cohort` remain dormant compatibility/emergency controls. They are not stages or evidence for this release. Keep `INTERVIEW_ROLLOUT_BPS=0` and leave the rollout salt unset.

## Environment contracts

### Local

- `NODE_ENV=development`, `MONGO_TARGET=test`, exact `EXPECTED_MONGO_DB_NAME_TEST`, and a loopback `MONGO_URL_TEST` whose database is not `frontendatlas`.
- `INTERVIEW_MODE_ACCESS=preflight`, `INTERVIEW_SYSTEM_DESIGN_ACCESS=off`, `RATE_LIMIT_STORE=memory`, and `SENTRY_ENABLED=false`.
- Ordinary authenticated test users can run Coding Interview Mode; no admin role is required.

### Vercel Preview

- Database: exact `VERCEL_ENV=preview`, `MONGO_TARGET=test`, a Preview-only `MONGO_URL_TEST`, and matching `EXPECTED_MONGO_DB_NAME_TEST`. `MONGO_URL` must not exist in Preview, and neither configured database name may be `frontendatlas`.
- Access: `INTERVIEW_MODE_ACCESS=preflight`, `INTERVIEW_SYSTEM_DESIGN_ACCESS=off`, and `INTERVIEW_OPERATIONAL_STATE=normal`. Production rejects `preflight`.
- Redis: `RATE_LIMIT_STORE=redis`, `RATE_LIMIT_NAMESPACE=frontendatlas:preview:interview:v1`, and `RATE_LIMIT_REDIS_TIMEOUT_MS=1500`. Store the Upstash URL/token only as Preview secrets.
- Browser/API routing: the frontend requires `NG_APP_PREVIEW_API_BASE` to be the matching backend Preview origin. The backend requires that frontend origin in `FRONTEND_ORIGINS`/`FRONTEND_BASE`, its own origin in `SERVER_BASE`, plus `COOKIE_SAMESITE=none` and `COOKIE_SECURE=true`.
- Monitoring: use the existing Sentry project with `SENTRY_ENABLED=true`, `SENTRY_ENVIRONMENT=preview`, `SENTRY_RELEASE` exactly equal to `VERCEL_GIT_COMMIT_SHA`, `INTERVIEW_TELEMETRY_ENABLED=true`, and `REQUEST_METRICS_ENABLED=true`.
- `INTERVIEW_MONITORING_READY` and `INTERVIEW_NATIVE_SAFARI_READY` remain `false` until real evidence passes. Their pending state does not block technical preflight.

### Production preparation

- Keep `INTERVIEW_MODE_ACCESS=off`, `INTERVIEW_OPERATIONAL_STATE=drain`, and `INTERVIEW_SYSTEM_DESIGN_ACCESS=off` until every launch gate passes.
- Use `RATE_LIMIT_STORE=redis` with `RATE_LIMIT_NAMESPACE=frontendatlas:production:interview:v1`. Preview database values, credentials, API origins, and namespace must not be attached to Production.
- The Production runtime enforces this separation at startup when access is `public`: exact Production Mongo target/name, no `MONGO_URL_TEST`, System Design `off`, exact Redis store/namespace, BPS `0`, and an empty rollout salt.
- Keep rollout BPS at `0` and the rollout salt unset. This release moves directly from off to public; there is no internal or percentage cohort stage.
- Production database inspection begins read-only and dry-run. Index creation and backfill execution require separate approvals and the exact guarded confirmations emitted by the dry-runs.

## Technical preflight evidence

| Gate | Evidence | Owner | Timestamp (UTC) | Result |
| --- | --- | --- | --- | --- |
| Production remains `off + drain`; System Design remains `off` |  |  |  | Pending |
| Preview DB target/name isolation and `MONGO_URL` absence |  |  |  | Pending |
| Preview frontend calls only its matching Preview backend |  |  |  | Pending |
| `preflight` grants ordinary authenticated users and rejects guests |  |  |  | Pending |
| Health reports `gateProfile=preflight`, `gateReady=true`, `launchReady=false`, and `INTERVIEW_PREFLIGHT_READY` |  |  |  | Pending |
| Preview exposure indexes verified read-only |  |  |  | Pending |
| Preview exposure backfill dry-run counts reviewed |  |  |  | Pending |
| Two-process Redis counter, idempotency, 429, and `Retry-After` verifier |  |  |  | Pending |
| Backend/frontend tests and production build |  |  |  | Pending |
| Chromium, Firefox, and WebKit mocked plus full-stack CI matrices |  |  |  | Pending |
| Real ordinary-user create, save, refresh/resume, submit, and results flow |  |  |  | Pending |
| Sentry sanitized issue and metric ingestion |  |  |  | Pending |
| Sentry hard-alert email received |  |  |  | Pending |
| Vercel log sample contains no private Interview data |  |  |  | Pending |
| Account-deletion cascade |  |  |  | Pending |
| Backup system, policy owner, retention period, and deletion SLA |  |  |  | Pending |
| Latest restore/deletion exercise |  |  |  | Pending |
| 90-day response-bearing session and 365-day identity-only exposure retention |  |  |  | Pending |

## Native Safari and VoiceOver

- Tester:
- macOS version:
- Safari version:
- VoiceOver version:
- Viewport/device:
- Commit SHA:
- Test date (UTC):
- Evidence link:

Record pass/fail for keyboard-only setup, MCQ selection, coding editor, refresh/resume, save, submit, results, focus transitions, and timer announcements at 5 minutes, 1 minute, 10 seconds, and expiry. Keep `INTERVIEW_NATIVE_SAFARI_READY=false` until every required row passes.

## Monitoring

- Existing Sentry project/environment:
- Candidate `SENTRY_RELEASE`:
- Dashboard URL:
- Dashboard owner:
- Synthetic event/metric timestamp:
- Notification email recipient:
- Notification delivery evidence:
- Vercel structured-log saved-query and redaction evidence:
- Custom metric monitor supported: Yes / No
- Verified issue-alert fallback when metric monitors are unavailable:

Run the Sentry verifier only in the exact Preview scope. Its execute path requires `VERCEL_ENV=preview`, `SENTRY_ENVIRONMENT=preview`, `INTERVIEW_MODE_ACCESS=preflight`, and `SENTRY_RELEASE=VERCEL_GIT_COMMIT_SHA`.

| Signal | Window/threshold | Response | Evidence |
| --- | --- | --- | --- |
| Required readiness or Redis blocked | At least 1 in 5 minutes | Drain new starts |  |
| Core Interview HTTP 5xx | At least 2 in 5 minutes | Drain and roll back last deploy |  |
| Redis unavailable or active-session fallback | At least 1 in 5 minutes | Drain new starts |  |
| Protected-window literal or semantic overlap | Greater than 0 | Off + halt |  |
| Sanitized unexpected Interview 5xx issue | First seen/regressed | Notify immediately |  |
| Save conflict | At least 3 in 5 minutes | Warning email |  |
| Rate denied | At least 5 in 5 minutes, grouped by limiter/code | Warning email |  |

Keep `INTERVIEW_MONITORING_READY=false` until ingestion, queryability, thresholds, fallback issue signals, and real email delivery are proven. A configured flag alone is not evidence.

## Production data preparation

- Exact database name:
- Read-only verifier evidence:
- Backfill dry-run: `wouldInsert`, `alreadyPresent`, `conflictingExisting`, `invalid`, and duplicates:
- Index dry-run: planned count, expired count, mismatches, and unreviewed extra indexes:
- Index creation approval/evidence:
- Post-index verifier result (`5/5` required):
- Backfill execution approval/evidence:
- Final dry-run (`wouldInsert=0`; duplicate/invalid/conflict all `0`):

Use this order while Production remains `off + drain`:

1. Run the read-only verifier and detailed backfill dry-run against exact `MONGO_TARGET=production`, `EXPECTED_MONGO_DB_NAME`, and `--database=<exact-database>`.
2. Separately approve the create-only index migration. Production execute requires `INTERVIEW_EXPOSURE_INDEX_ALLOW_PRODUCTION=true`, `--allow-production`, `--execute`, and `--confirm=CREATE_INTERVIEW_EXPOSURE_INDEXES:<database>:<plannedCount>:<expiredCount>` using the exact values printed by dry-run. It must not drop, rename, or synchronize indexes.
3. Require the post-migration read-only verifier to report all five required indexes ready.
4. Separately approve idempotent backfill execution. It requires `INTERVIEW_EXPOSURE_BACKFILL_ALLOW_PRODUCTION=true`, `--allow-production`, `--execute`, `--expected-inserts=<wouldInsert>`, and `--confirm=BACKFILL_INTERVIEW_EXPOSURES:<database>:<wouldInsert>` using the exact dry-run values.
5. Run the final dry-run and record zero remaining inserts, duplicates, invalid entries, and conflicts.

## Rollback rehearsal

- Incident commander:
- Flag owner:
- Started at (UTC):
- Completed at (UTC):
- Result: Pending / Pass / Fail
- Last-deploy rollback procedure:
- Evidence for `normal -> drain -> halt -> drain -> normal`:
- Availability/create/resume/save/submit/results result at each state:

`halt` blocks user mutation endpoints. A safe GET may still perform the existing canonical server-deadline reconciliation when a session has expired; record that separately and do not misclassify it as a user mutation bypass.

## Direct public launch

There are no internal, 1%, 5%, or 25% rollout stages and no minimum completion count. Every technical and operational gate above remains mandatory.

- Pre-launch health evidence with Production `off + drain`:
- Production Redis namespace/credentials approval:
- Production database approvals complete:
- Monitoring attestation approval:
- Native Safari attestation approval:
- GitHub `Interview Cross-browser Gate`/ruleset evidence:
- Public access change approval and timestamp:
- Environment/data re-check after setting `INTERVIEW_MODE_ACCESS=public` while still `drain`:
- `normal` state change approval and timestamp:
- Immediate `INTERVIEW_RELEASE_READY` health evidence after `normal`:
- First successful authenticated Production flow evidence:

### Public launch decision

- Decision: Hold / Launch public
- Decision owner:
- Signed by:
- Decision timestamp (UTC):
- Signed at (UTC):
- Decision notes:

If the immediate post-`normal` health check is not `INTERVIEW_RELEASE_READY`, restore `drain`, then set access `off` while keeping drain. Critical signals use the incident runbook immediately.

## First 24-hour review

Observed start and completion counts are informational; neither is a launch or keep-public threshold.

- Observation start/end (UTC):
- Starts/completions/abandonments:
- Readiness/Redis events:
- Core 5xx and latency summary:
- Save conflicts and rate denials:
- Protected-window overlap:
- Incidents and mitigations:
- Decision: Keep public / Drain / Halt / Off
- Review owner:
- Signed by:
- Decision timestamp (UTC):
- Signed at (UTC):
- Remaining risks and follow-ups:

`Launch public` is forbidden while any required evidence or rehearsal is `Pending`/`Fail`. After launch, a critical alert forces `Drain`, `Halt`, or `Off`; it cannot be waived by the 24-hour review.
