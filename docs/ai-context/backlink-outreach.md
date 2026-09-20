# Backlink outreach registry

Use `docs/references/backlink-outreach-registry.tsv` as the single source of truth for backlink research, outreach, submissions, and link verification. Read it before searching Gmail, Semrush, or a publisher's submission channel.

The registry is the only persistent output for backlink/outreach work by default. Continue opportunity research, candidate scoring, university checks and relevant GSC impact analysis when requested; present rankings, findings and summaries in chat. Do not create separate report, audit, raw-data or intermediate research files unless the user explicitly requests files. Keep contact outcomes, uncertainty, public evidence and institutional or publisher identities needed to prevent duplicate outreach in the registry itself.

## Required check order

1. Search the registry by `root_domain`, `host`, `source_url`, and `frontendatlas_url`, including institutional aliases and related publisher identities recorded in `result_reason`.
2. Stop by default when the same root domain already exists. Continue only when the existing row clearly documents a distinct approved opportunity or an intentional re-check date.
3. Search Gmail for the domain, organization/publication name, contact channel, source URL, and FrontendAtlas URL. Do not copy personal email addresses, phone numbers, or private reply text into the registry.
4. Check Semrush for an active FrontendAtlas referring domain and record the date and non-sensitive result.
   For every donor, keep root-domain metrics separate from exact-page evidence: verify exact Page AS, link `rel`, content ownership, and the official acceptance channel. Never treat a high root AS as proof that a UGC or `nofollow` link is a high-value page-level opportunity.
5. Re-open the official source/submission page immediately before taking action. Confirm the channel is current and the proposed asset still fits.
6. After the action, update the registry and attach public evidence when available: a live source page, public issue/PR, or official public submission page. A private Gmail URL is not evidence.

On 2026-09-19 the user explicitly reopened university research and outreach, including US institutions and relevant course, department, library, and career-resource pages. There is no university quota in the current continuation: use the same 30/25/25/10/10 scoring and minimum 70/100 as other opportunities, with a specific placement and current official channel. Reassess existing uncontacted rows rather than treating an expired pause, a blank contact date, or `deferred` as proof that no prior outreach occurred. Previous contacts, rejections, positive responses, live links, and uncertain submissions remain suppressed unless a separate follow-up is explicitly authorized. This continuation authorizes at most 10 individually verified new contacts from the existing queue; no bulk mail or BCC.

The subsequent university-only round authorized on 2026-09-19 starts with the existing queue and may discover new universities to screen at least 30 institutions after prior-contact suppression. Contact at most 10 qualified universities sequentially; community colleges and non-university publishers are excluded. Suppress previously contacted institutions permanently for this round, across departments, aliases and channels; expiry of 90 days does not authorize a repeat. Reuse an eligible existing unsent draft rather than creating a duplicate. Retain faculty per-target limits, counting actual open sends even when their current state is deferred.

The university-only round was completed and reconciled on 2026-09-20. Its contact outcomes, delivery failures, remaining drafts, historical corrections and institutional aliases are retained in the registry. Read `result_reason` alongside the state and date fields. Historical institutional-root placeholder URLs are not verified backlink placements; leave unknown URLs empty rather than inventing them.

The historical Global Faculty Pilot beginning 2026-08-25 retains its own non-US, English or verified-English, current faculty/course-owner scope, documented 7/10 hard gates, and maximum 12 unique root domains. Its daily and weekly send caps were removed by the user on 2026-08-25. For faculty/course-owner outreach, retain at most one contact per institution in 90 days and at most two open contacts per FrontendAtlas target; a `human_positive` or `live_link` result closes the remaining faculty queue for that target. Do not generalize the pilot's 12-domain capacity into a limit on the newly reopened general university queue. Keep existing university rows and stronger terminal/live outcomes; update a deferred row only after its individual eligibility and history are rechecked.

The 2026-08-19 Semrush snapshot is fully represented: 87 active referring domains use `existing_ref_domain` or the stronger `live_link`; all eight lost domains remain recorded. Seven lost domains use `closed`, while Emerge Talent uses `contacted` because a reclaim message is pending and its lost-link context is preserved in `result_reason`. The latest fully reconciled Semrush view is the 2026-08-24 snapshot: 99 total referring domains, 91 active domains, and zero active domains missing from the registry after update. A domain-level snapshot row may use the root URL when the exact historical donor page is unknown; `result_reason` must say that the exact source URL was not backfilled.

## Schema and identity

The TSV header is fixed:

`root_domain`, `host`, `target_name`, `category`, `source_url`, `frontendatlas_url`, `route_type`, `state`, `contacted_on`, `last_checked_on`, `next_check_on`, `result_reason`, `evidence_url`

The unique opportunity key is the exact tuple `host + source_url + frontendatlas_url`. Normalize domains to lowercase, omit URL fragments and tracking parameters, and use clean HTTPS URLs when the source supports HTTPS. Use ISO `YYYY-MM-DD` dates; leave an unknown date blank instead of estimating it.

`category` is a compact grouping such as `editorial`, `resource_library`, `newsletter`, `academic`, `university_career`, `open_source_data`, `referring_domain_snapshot`, or `directory`. `route_type` describes the public channel, for example `email`, `form`, `issue`, `pull_request`, `newsletter_reply`, `editorial_pitch`, `organic_submission`, or `semrush_snapshot`.

## Allowed states

- `candidate`: researched and eligible, but not yet actioned.
- `planned_not_sent`: proposed or approved historically, with no verified delivery evidence.
- `contacted`: an email or direct message was verified as sent.
- `submitted`: a form, issue, PR, or editorial submission was verified.
- `scheduled`: an outbound message is scheduled but not yet sent.
- `human_positive`: a person responded positively, but publication/linking is not complete.
- `human_negative`: a person declined or said the resource would not be added.
- `published`: content was published, but the intended link is not yet verified.
- `live_link`: the clean intended link is live on the source page.
- `existing_ref_domain`: the domain already appears as an active FrontendAtlas referring domain, but the intended contextual placement is not otherwise classified.
- `deferred`: intentionally paused until `next_check_on`.
- `excluded`: permanently ineligible under the recorded reason.
- `closed`: the opportunity ended without a more specific positive or negative state.

Only one current state is stored. Preserve important prior stages tersely in `result_reason`; never paste a private reply. When historical delivery cannot be verified, prefer `planned_not_sent` over guessing `contacted` or `submitted`.

## Updates and verification

- A sent email moves to `contacted`; a successful form, public issue, or PR moves to `submitted`.
- A positive reply does not become `live_link` until the exact `href` is present on a public page.
- For a gained link, verify direct `href`, redirects, `rel`, contextual placement, source canonical, and indexability. Recheck Semrush after 7–14 days and record the next check date.
- For a rejection, distinguish `human_negative` (a direct editorial decision) from `excluded` (the channel/domain should not be tried again).
- Do not buy placements, subscriptions, or accounts solely to submit a resource.
- Do not store credentials, email addresses, telephone numbers, message bodies, private Gmail URLs, or unpublished personal data.

## Registry integrity checks

Before relying on or committing the TSV, verify:

- every row has exactly 13 tab-separated fields;
- `state` is one of the allowed values above;
- all non-empty date fields are valid ISO dates;
- the `host + source_url + frontendatlas_url` key is unique;
- domains are lowercase;
- no email address or private Gmail URL is present.
