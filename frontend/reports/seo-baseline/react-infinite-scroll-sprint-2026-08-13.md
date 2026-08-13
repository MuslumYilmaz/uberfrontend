# React Interview + Infinite Scroll SEO Sprint Baseline

- Recorded: 2026-08-13
- Treatment routes:
  - `/react/interview-questions`
  - `/system-design/infinite-scroll-list`
- Primary reporting view: Google Search Console, Web, United States, all devices, exact-page filters
- Diagnostic view: Google Search Console, Web, worldwide, all devices, exact-page filters
- Exclusion: branded queries containing `frontendatlas` do not count toward success thresholds

## Search ownership

| Query cluster | Owning route | Included queries |
|---|---|---|
| React questions and answers | `/react/interview-questions` | `react interview questions and answers`, `react interview questions`, `react interview questions for experienced developers`, `react interview questions for beginners`, `react hooks interview questions` |
| React 19 questions | `/react/interview-questions` | `react 19 interview questions`, `react 19 interview questions and answers` |
| React preparation | `/guides/framework-prep/react-prep-path` | queries containing `how to prepare`, `preparation`, `study plan`, `roadmap`, `7 day`, `14 day`, or `30 day` |
| Infinite scroll system design | `/system-design/infinite-scroll-list` | `infinite scroll system design`, `infinite scroll frontend system design`, `infinite scroll system design interview` |

Ownership guardrails:

- For the React questions-and-answers and React 19 clusters, `/react/interview-questions` must receive at least 70% of visible FrontendAtlas impressions across every ranking URL, not only the hub and React preparation path.
- For the React preparation cluster, `/guides/framework-prep/react-prep-path` must remain the most visible owner.
- `/system-design/infinite-scroll-list` owns the broad prompt. Modifier-specific guides continue to own `infinite scroll virtualization system design`, `infinite scroll system design evaluation`, and `infinite scroll frontend system design mistakes`.

## Pre-treatment baseline

These values are the latest 28-day page totals reviewed on 2026-08-13. On the actual deploy date, record the precise last 28 completed days again before evaluating the treatment.

| Route | Clicks | Impressions | CTR | Average position | Primary objective |
|---|---:|---:|---:|---:|---|
| `/react/interview-questions` | 1 | 1,097 | 0.1% | 19.8 | Improve broad React Q&A ownership and qualified clicks while preserving visibility |
| `/system-design/infinite-scroll-list` | 4 | 701 | 0.6% | 14.1 | Move the exact system-design prompt toward page one |

Search Console query rows are diagnostic rather than totals because anonymized and low-volume queries may be omitted.

## Semrush and SERP snapshot

| Query | US volume | KD | AI Overview in reviewed US desktop SERP | Role |
|---|---:|---:|---|---|
| `react interview questions and answers` | 390 | 28 | Not observed on 2026-08-13 | React primary |
| `infinite scroll system design` | 20 | Not measured | Not observed on 2026-08-13 | Infinite-scroll primary |

An absent AI Overview is a dated observation, not a permanent query property. Recheck the same US desktop SERPs at T0, T+14, and T+35. Do not interpret unavailable KD as an easy keyword.

## Evaluation schedule

| Checkpoint | Action |
|---|---|
| T0 | Record deploy date and exact pre-deploy 28-day window; verify 200 status, self-canonical, `index,follow`, one non-empty H1, crawlable content, and valid JSON-LD; request indexing in the order below. |
| T+14 | Check indexing, query ownership, unexpected ranking loss, and current AI Overview state only. Do not make a performance decision. |
| T+35 | Compare the first complete 28-day post-deploy window with the frozen baseline. Separate position movement from CTR movement. |
| T+63 | Use a second complete window when click volume is too low or the first result is mixed. |

Do not make another material title, H1, meta-description, section-ownership, or internal-link change to either treatment page before T+35 unless there is a factual or technical indexing defect.

## Success thresholds

### React interview questions

Directional success requires at least two of the following:

- At least 3 non-brand clicks
- At least 878 impressions, preserving 80% of the baseline
- Average position at or better than 18

The questions-and-answers and React 19 clusters must also meet the 70% ownership guardrail. Treat a CTR improvement as a snippet signal only when average position and query mix are comparable; otherwise report ranking and CTR effects separately.

### Infinite scroll system design

Directional success requires at least two of the following:

- At least 6 non-brand clicks
- At least 560 impressions, preserving 80% of the baseline
- Average position at or better than 12.5
- The primary query reaches the top 10

Strong success requires at least 8 non-brand clicks, average position at or better than 10.5, and the primary query in the top 10.

## URL Inspection order after deploy

1. `/react/interview-questions`
2. `/system-design/infinite-scroll-list`
3. `/system-design`
4. `/guides/system-design-blueprint`
5. `/guides/system-design-blueprint/intro`
