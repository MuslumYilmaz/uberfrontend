# Backlink outreach registry

Use `docs/references/backlink-outreach-registry.tsv` as the single source of truth for backlink research, outreach, submissions, and link verification. Read it before searching Gmail, Semrush, or a publisher's submission channel.

The registry is the only persistent output for backlink/outreach work by default. Continue opportunity research, candidate scoring, university checks and relevant GSC impact analysis when requested; present rankings, findings and summaries in chat. Do not create separate report, audit, raw-data or intermediate research files unless the user explicitly requests files. Keep contact outcomes, uncertainty, public evidence and institutional or publisher identities needed to prevent duplicate outreach in the registry itself.

## Required check order

1. Search the registry by `root_domain`, `host`, `source_url`, and `frontendatlas_url`, including institutional aliases and related publisher identities recorded in `result_reason`.
2. Search GitHub, because the registry misses some pull requests and issues (on 2026-10-08 about 20 GitHub targets from February to August 2026 were absent): `gh search prs --author MuslumYilmaz --limit 500`, `gh search issues --author MuslumYilmaz --limit 300` and `gh search prs "frontendatlas.com"`. Treat sister organizations of a site that already links, or was already asked, as reached.
3. Stop by default when the same root domain already exists. Continue only when the existing row clearly documents a distinct approved opportunity or an intentional re-check date.
4. Search Gmail for the domain, organization/publication name, contact channel, source URL, and FrontendAtlas URL. Do not copy personal email addresses, phone numbers, or private reply text into the registry. When Gmail is not available in the session, say that prior contact was checked against the registry and GitHub only.
5. Check whether the domain already links to FrontendAtlas: the Search Console Links report first, Semrush when its daily quota allows. Record the date and non-sensitive result.
   For every donor, keep root-domain metrics separate from exact-page evidence: verify exact Page AS, link `rel`, content ownership, and the official acceptance channel. Never treat a high root AS as proof that a UGC or `nofollow` link is a high-value page-level opportunity.
6. Re-open the official source/submission page immediately before taking action. Confirm the channel is current and the proposed asset still fits.
7. After the action, update the registry and attach public evidence when available: a live source page, public issue/PR, or official public submission page. A private Gmail URL is not evidence.

## Pull request rule

On 2026-10-18 the user cleaned up the open link pull requests. All 74 open external pull requests carried a FrontendAtlas link: 35 were closed without comment (dead repositories, declined, or ignored and off-topic), and the link was removed from six so that only the documentation fix remains (rspack 15830, ngxtension 708, infinum frontend-handbook 231, vueuse 5651, alibaba/hooks 2967, bits-ui 2184). The other 33 still carry the link and wait for a recheck on 2026-11-18. On 2026-10-19 the user moved outreach off pull requests because the number of link pull requests had started to look like spam.

- Do not open a pull request to place a FrontendAtlas link unless the user reopens that channel. A pull request from the user's account stands on its documentation fix alone and carries no FrontendAtlas link.
- A row whose link was removed moves to `closed`, or to `human_negative` when a maintainer had already declined the link; `result_reason` records what happened to the pull request. A merge without the link is not a backlink.

## Round history

Read `result_reason` alongside the state and date fields; every round below is reconciled in the registry unless stated otherwise.

University and faculty outreach (2026-08-25 to 2026-09-20): the Global Faculty Pilot and two university rounds are complete, with their contact outcomes, delivery failures, remaining drafts and institutional aliases in the registry. Rules that still apply: a contacted institution stays suppressed across departments, aliases and channels, and the expiry of 90 days does not authorize a repeat; faculty and course-owner outreach keeps at most one contact per institution in 90 days and at most two open contacts per FrontendAtlas target (a real open send counts even when its row is `deferred`), and a `human_positive` or `live_link` result closes the remaining faculty queue for that target; reuse an eligible unsent draft rather than writing a duplicate; no bulk mail or BCC; an expired pause, a blank contact date or `deferred` is not proof that no outreach happened. Historical institutional-root placeholder URLs are not verified placements; leave unknown URLs empty rather than inventing them.

Semrush snapshots (2026-08-19 and 2026-08-24): fully represented. The 2026-08-24 view had 99 total and 91 active referring domains with none missing from the registry; all eight lost domains stay recorded, seven as `closed` and Emerge Talent as `contacted` with a pending reclaim. A domain-level snapshot row may use the root URL when the exact donor page is unknown, and `result_reason` must say the exact source URL was not backfilled. These snapshots are no longer the current view: the Search Console Links report showed 138 links from 47 sites on 2026-10-18, most of them not editorial, and the free Semrush plan allows about 10 lookups a day.

Narrow candidate round (2026-10-12), built on the yield measured in the registry: pull requests reached a live link in about 18% of attempts, email in about 1%, and issue-only requests in none of 77. Scope: about 10 new targets, only for under-pitched FrontendAtlas pages (the Angular change detection visualizer, its OnPush debugging sibling, the HttpClient cancellation page and the lifecycle hooks page). Saturated targets got no new ask, and each FrontendAtlas target carries at most three open asks counting existing ones. No repeat contact with any previously contacted publisher or sister publication; never-contacted `deferred`, `candidate` and unverified `planned_not_sent` rows may be re-screened, but an uncertain submission counts as contacted. Channels were pull requests with a real documentation improvement and newsletters with an official organic submission channel. Scoring stayed 30/25/25/10/10 with the 70 threshold, not lowered to reach the target count, and each row records whether its placement precedent sits in the same section or only elsewhere on the site. Five candidates cleared the threshold and no source qualified for the lifecycle hooks page. Only ngxtension was acted on: pull request 708 opened on 2026-10-13 and lost its link in the 2026-10-18 cleanup. ngtips, Angular Challenges and NG-ZORRO are pull request channels and stay unsent under the pull request rule; Angular Addicts (a newsletter) is unsent. Their Angular 22 precondition is met: the change detection pages were repositioned for Angular 22 in d90166b1, live since 2026-10-14.

List repositories (2026-10-13), outside that round's page scope and at the user's direction: three list repositories that publish to their own site got pull requests for `/guides/framework-prep`, which is now at its three-ask cap: liuchong/awesome-roadmaps 38, aycanogut/front-end-resources 92 and mrdulin/resources 34 (scored 67, sent because the user asked for all three). Discovery of this repository type is exhausted until FrontendAtlas has a new asset type. Move a row to `live_link` only once the href is on the published site, not when the pull request merges.

Non-pull-request round (2026-10-19): ten of the strongest link opportunities among domains absent from the registry, universities included; a new subdomain of a recorded institution does not count as new. Channels were email, official resource-suggestion forms, newsletter submissions and free editorial collaborations, and on university sites course and faculty pages, department libraries and career centers. Pull requests, paid placements, UGC, general directories and community-only posts were excluded; the 30/25/25/10/10 scoring and 70 threshold applied. The user sent all ten personally from drafts the same day: seven emails and three forms, all to university career pages, pointing to `/guides/interview-blueprint/coding-interviews`. The rows are `contacted` or `submitted` on the user's confirmation; delivery was not independently verified, and Gmail was not available to that session, so prior contact was checked against the registry only. A second list of ten prepared the same day (Imperial College London Careers, Pluralsight, Jaspero and others) has no registry rows; ask the user before treating any of them as uncontacted.

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

The TSV has been gitignored since 2026-10-02 (d4373bd6). It exists only on this machine, `git status` never shows edits and there is no history, so copy it before a bulk edit. Nine lines contain double quotes, which Python's `csv` module misparses; edit by splitting and joining on tabs, and append inside the closing quote of a quote-wrapped cell.

Before relying on or bulk-editing the TSV, verify:

- every row has exactly 13 tab-separated fields;
- `state` is one of the allowed values above;
- all non-empty date fields are valid ISO dates;
- the `host + source_url + frontendatlas_url` key is unique;
- domains are lowercase;
- no email address or private Gmail URL is present.
