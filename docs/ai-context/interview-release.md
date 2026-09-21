# Interview release context

Use this context for Interview Mode staging, readiness, rollout, live, incident, Redis, monitoring, retention, or release-gate work.

## Required references

- `docs/references/interview-mock-incident-runbook.md` is the operational source of truth.
- `docs/references/interview-mode-release-record.md` is the evidence template for each candidate.
- `docs/references/release-guardrails.md` defines the repository and required-check guardrails.

## Non-negotiable boundaries

- Preview uses `preflight`, ordinary authenticated test users, an isolated test DB target/name contract, and its own Redis namespace. `preflight` is forbidden in Production.
- Keep Production Interview access `off` with operational state `drain` throughout Preview and Production data preparation; keep System Design `off` through this release.
- Never use or write the Production MongoDB for local/Preview verification. Production index/backfill work follows read-only and dry-run checks and requires separate action-time approval.
- Do not mark monitoring or native Safari ready without the recorded real-world evidence.
- This release has no internal or percentage cohort stages and no completion threshold. After every technical gate passes, Production moves directly from `off + drain` to `public + drain`, then `normal`.
- Keep `internal` and `cohort` behavior only as dormant backward-compatible/emergency controls; they are not release evidence.
- Upstash credentials, Vercel secrets, GitHub rulesets, Production backfill/index work, and public access/state changes require explicit approval at action time.
- Closely monitor the first 24 hours, then record `Keep public`, `Drain`, `Halt`, or `Off`; a critical signal triggers the runbook immediately rather than waiting for that review.
