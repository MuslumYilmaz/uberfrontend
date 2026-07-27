# Interview coding registry v1 — candidate audit

- Audit date: 2026-07-27
- Registry: `frontend-interview-coding-registry-v1`
- Version: `1.0.0`
- Status: `candidate`
- Registry content hash: `f99909dbb7ddc1362c27af9de4048ee1927130dbbfd2d8f99945f0aa78c1929d`
- Definition hash: `0bd6ffc57dcf6bf2955b7b4d6ad9bde6016b070b0df74b8fd4dd90f2ce647639`

## Verdict

The registry contains all 24 approved V1 coding variants: two choices for
every track and level. Every source question, starter asset, pressure scenario,
time limit, round limit, requirement projection, rubric, runner contract,
remediation list, and review record is versioned and included in a deterministic
content hash.

All 24 variants are review-enabled inside this candidate. The registry itself
is deliberately not public-production gold: `finalApproval` is null. Public
access must remain fail-closed until the project owner approves this exact
post-audit registry hash and the release is regenerated as `editorial-gold`.

## Coverage matrix

| Track | Junior — 25 min | Mid — 35 min | Senior — 45 min |
| --- | --- | --- | --- |
| Core Web | `js-validate-username`, `js-escape-html` | `js-take-latest`, `js-fetch-json-timeout` | `js-create-lru-cache`, `js-concurrency-map-limit` |
| React | Counter, Todo List | Pagination Table, Shopping Cart | Debounced Search, Chips Autocomplete |
| Angular | Counter, Todo List | Pagination Table, Shopping Cart | Debounced Search, Chips Autocomplete |
| Vue | Counter, Todo List | Pagination Table, Shopping Cart | Debounced Search, Chips Autocomplete |

Framework rows use two, three, and four cumulative rounds respectively. Core
Web uses one implementation contract rather than pressure rounds, while
retaining the level time limit. Counts are exact:

- 24 variants: six per track and eight per level;
- six JavaScript runner variants and 18 framework-preview variants;
- 27 named JavaScript checks;
- 54 selected framework requirement groups and 60 selected framework checks;
- 70 rubric groups in total;
- 18 distinct framework starter assets and six shared pressure scenarios.

## Source and review integrity

The authoring registry pins the complete current source-question record for
each of the 24 catalog IDs. Framework variants also pin their starter and
pressure assets separately. Any catalog, starter, pressure, time, round,
rubric, or remediation edit makes deterministic generation fail until the
definition and review binding are deliberately refreshed.

Technical and editorial reviews are AI-labelled and bind the complete
definition hash. Each of the six Senior framework variants also has its own
passed level review. Those reviews cover the all-four-round scope:

- Debounced Search: debounce ownership, terminal-state recovery,
  latest-request-wins control, accessible state, and teardown;
- Chips Autocomplete: normalized identity, keyboard lifecycle, invite limits,
  ARIA relationships, and cleanup.

Senior framework variants become selectable only while their variant review
and the shared technical/editorial review remain passed.

## Public/private boundary

The public artifact contains only:

- variant identity, version, track, level, title, prompt, timing, and round
  limit;
- source question identity/version and variant content hash;
- pinned safe starter files for every task, plus the original starter-asset
  reference for framework provenance;
- the selected requirement prompts and constraints;
- the review-derived `enabled` flag.

It contains no solution, solution asset, debrief, hint, rubric, remediation,
review, check implementation, or catalog test field.

The backend-private artifact adds rubric groups, remediation topics, source
hash evidence, review records, and executable local runner configuration.
JavaScript runner configuration retains `tests`/`testsTs` and stable named
check IDs. Framework configuration retains only the cumulative check groups
through the variant's round limit. A backend may return this runner material
from a dedicated check-prepare operation; it must not include it in the
ordinary session DTO.

Artifact hashes:

| Artifact | SHA-256 |
| --- | --- |
| Public | `7028d2c9d6469bf4ab6b9a84d06fe48d87d34e7d7fd6e614d62fab72d054c250` |
| Private | `6a661884a4b1f16af165467002e7455cbe1700461625e635e203b03c5c98d116` |

## Runtime evidence

Passed on 2026-07-27:

- `node backend/content/interview/tools/generate-interview-content.mjs`
- `node backend/content/interview/tools/generate-interview-content.mjs --check`
- `node backend/content/interview/tools/validate-interview-content.mjs`
- `node frontend/scripts/framework-content-regressions.test.mjs`
- `node frontend/scripts/catalog-solution-execution.test.mjs`
  - 88 JavaScript solutions / 447 checks passed
  - 88 TypeScript solutions / 389 checks passed
- `npm run test:e2e:framework-catalog:prod`
  - 53/53 canonical framework solution flows passed in Chromium against the
    production SSR build
- pressure-family production E2E subset from
  `e2e/react-framework-checks.prod.spec.ts`
  - 18/18 Counter, Todo List, Pagination Table, Shopping Cart, Debounced
    Search, and Chips Autocomplete flows passed across React, Angular, and Vue
  - the unsupported-pressure fallback and 360/390 px mobile guard also passed
  - 25/25 tests passed overall
- all framework starter files were deterministically normalized from the same
  pinned assets into the backend public package; an active interview therefore
  does not depend on a later CDN starter fetch
- Git whitespace validation for the interview content and audit paths

An initial attempt reused another temporary server on port 4200; that server
closed during the run and produced connection failures across the suite. A
fresh runner-owned production server was then used for both successful runs
above. The failed attempt did not identify a content or check assertion defect.

## Security and product limits

- These are locally verified browser checks, not secure hidden tests. Check
  logic delivered to a browser can be inspected or manipulated.
- No isolated worker, network sandbox, anti-cheat claim, or hiring prediction
  is provided by this registry.
- Existing questions and some solution assets already belong to the normal
  catalog; previous exposure can make an interview easier. V1 accepts that
  tradeoff.
- The registry never grants normal premium catalog or solution access. The
  runtime must resolve starter/check material only inside the active interview
  session and apply the original solution entitlement on the result page.
- Candidate code must not be placed in analytics or ordinary application logs.

## Promotion rule

Promotion requires explicit project-owner approval of registry version `1.0.0`
and content hash
`f99909dbb7ddc1362c27af9de4048ee1927130dbbfd2d8f99945f0aa78c1929d`.
That approval must be recorded in both the private package and release, and
production loading must continue to reject this candidate until then.
