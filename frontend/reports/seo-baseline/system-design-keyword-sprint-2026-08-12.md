# Frontend System Design Keyword Sprint Baseline

- Recorded: 2026-08-12
- Treatment routes:
  - `/system-design`
  - `/guides/interview-blueprint/system-design`
  - `/guides/system-design-blueprint/radio-framework`
- Primary reporting view: Google Search Console, Web, United States, all devices, exact page filters
- Diagnostic view: Google Search Console, Web, worldwide, all devices
- Exclusion: queries containing `frontendatlas` are branded and do not count toward the success thresholds

## Keyword ownership

| Query cluster | Owning route | Included queries |
|---|---|---|
| Questions and practice | `/system-design` | `frontend system design interview`, `front end system design interview`, `frontend system design interview questions`, `front end system design interview questions`, `frontend system design questions`, `system design questions for front end developer`, `frontend system design examples` |
| Preparation | `/guides/interview-blueprint/system-design` | `frontend system design interview preparation`, `how to prepare for frontend system design interview`, `frontend system design interview guide`, `frontend system design interview format`, `frontend system design interview guidance` |
| RADIO | `/guides/system-design-blueprint/radio-framework` | `radio framework`, `radio framework system design`, `radio framework frontend system design`, `radio framework interview`, `radio framework template`, `radio framework example` |

Ownership guardrail: within these three treatment URLs, the intended owner must be the most visible URL and receive at least 70% of the visible impressions for its query cluster.

## Provisional pre-deploy baseline

These are the latest available 28-day values reviewed on 2026-08-12. Freeze a new baseline for the last 28 completed days on the actual deploy date and record its exact date range before judging the treatment.

| Route | Clicks | Impressions | CTR | Average position | Primary objective |
|---|---:|---:|---:|---:|---|
| `/guides/system-design-blueprint/radio-framework` | 4 | 699 | 0.57% | 6.74 | Improve qualified CTR and clicks without losing first-page visibility |
| `/system-design` | 0 | 247 | 0% | 15.63 | Move the interview/question cluster toward page one |
| `/guides/interview-blueprint/system-design` | 0 | 31 | 0% | 11.71 | Establish visibility for preparation-specific queries |

Page totals are the primary KPIs. Query rows are diagnostic because Search Console suppresses anonymized queries and exposes only a subset of long-tail rows.

## Evaluation schedule

| Checkpoint | Action |
|---|---|
| T0 | Record deploy date, annotate the SEO release, and freeze the prior 28 completed days |
| T+7 | Confirm 200 status, self-canonical, indexability, rendered H1/content, and valid structured data; do not make a performance decision |
| T+14 | Directional review only; inspect page totals, query ownership, and unexpected ranking loss |
| T+35 | Compare the first complete post-deploy 28-day window with the frozen pre-deploy window |
| T+63 | Use a second 28-day window when click volume is too small for a stable T+35 decision |

Do not make a second material title, H1, meta-description, or internal-link change to the three treatment pages before the T+35 review unless there is a technical indexing defect.

## Success thresholds

### RADIO guide

Directional success requires all of the following:

- CTR at least 0.85%
- At least 6 non-brand clicks
- At least 560 impressions, preserving 80% of the provisional baseline
- Average position no worse than 7.74

Strong success is CTR of at least 1.0% with at least 7 non-brand clicks. Treat the result as confirmed only if the second 28-day window continues in the same direction.

### Questions and practice hub

Directional success requires at least two of the following:

- At least 2 non-brand clicks
- At least 300 impressions
- Average position at or better than 13.5, or at least one owned-cluster query in the top 10

Strong success requires at least 2 non-brand clicks, at least 350 impressions, and average position at or better than 12.

### Preparation guide

Directional success requires at least two of the following:

- At least 1 non-brand click
- At least 50 impressions
- Preparation-cluster average position at or better than 10.5

Strong success requires at least 2 non-brand clicks and at least 75 impressions. Because the provisional baseline is small, treat the first 28-day result as directional.

### Sprint-level decision

Call the sprint successful when at least two treatment pages pass their directional threshold, the third has no material technical or organic regression, total non-brand clicks across the three pages increase from 4 to at least 8, and query ownership meets the 70% guardrail.

Use unchanged `/system-design/:id` routes as a seasonality control. If treatment and control impressions move together, do not attribute the shared movement entirely to this sprint. Treat a CTR change as a snippet signal only when average position remains within roughly one position; otherwise separate ranking and query-mix effects.

## Medium handoff

No external Medium edit is part of this repository change. Before the next measurement window:

1. Confirm the article consistently defines `O` as `Optimizations and deep dive`.
2. If the story is intended as a syndication copy, set its canonical to `https://frontendatlas.com/guides/system-design-blueprint/radio-framework` when the publishing workflow supports it.
3. Otherwise keep the Medium article as a concise introduction and add a prominent link labeled `Updated 45-minute RADIO template and worked examples` to the FrontendAtlas guide.
4. Retain attribution to Yangshun Tay and GreatFrontEnd's authoritative RADIO source.
