# GA4 Conversion Baseline Runbook

This runbook configures the GA4 property after the application changes are
deployed. Apply it once, create only missing definitions, and do not start the
baseline before the production deployment.

## Deployment Boundary

1. Record the production deployment timestamp and the Europe/Istanbul calendar
   date.
2. Treat the first complete Europe/Istanbul calendar day after deployment as
   baseline day 1.
3. Do not combine pre-deployment and post-deployment events in one comparison.
4. Stop using these retired events from the deployment timestamp onward:
   `aha_*`, `run_checks`, `signup_prompt_shown`, `signup_completed`,
   `checkout_started`, and `checkout_completed`.
5. If any retired event is currently marked as a key event, remove that key
   event designation. Historical data remains unchanged.
6. Start qualified-session comparisons only after the deployment. The
   `decision_session_qualified` contract is not available retroactively.

## Unwanted Referrals

In **Admin > Data streams > Web stream > Configure tag settings > Show all >
List unwanted referrals**, add only the entries that do not already exist:

| Match type | Referral domain |
| --- | --- |
| Referral domain exactly matches | `accounts.google.com` |
| Referral domain exactly matches | `frontendatlas.lemonsqueezy.com` |

This setting is not retroactive.

## Decision-Session Qualification

The application emits `decision_session_qualified` at most once per loaded app
runtime, and only while the document is visible. A runtime qualifies by either
of these methods:

| Event parameter | Allowed value | Meaning |
| --- | --- | --- |
| `qualification_method` | `trusted_interaction` | A trusted `pointerdown`, `keydown`, or `touchstart`; when the User Activation API is available, `hasBeenActive` must also be true |
| `qualification_method` | `foreground_15s` | 15 cumulative seconds with the document visible |
| `qualification_version` | `v1` | The qualification contract in this runbook |

The event has no path, email, username, or other user-entered/PII parameter. A
page reload starts a new app runtime and can emit a new qualification event.

Use this event only as an analysis inclusion signal. It does not suppress,
rewrite, rate-limit, or block raw analytics events or HTTP traffic. Do not use
it as a WAF, crawler, robots, or sitemap rule.

## Custom Dimensions

In **Admin > Custom definitions > Custom dimensions**, read the existing
definitions first. For each missing row below, create an event-scoped custom
dimension whose dimension name and event parameter are exactly the same.

| Dimension name | Scope | Event parameter |
| --- | --- | --- |
| `src` | Event | `src` |
| `tech` | Event | `tech` |
| `kind` | Event | `kind` |
| `workspace_type` | Event | `workspace_type` |
| `access_state` | Event | `access_state` |
| `action_type` | Event | `action_type` |
| `outcome` | Event | `outcome` |
| `auth_state` | Event | `auth_state` |
| `prompt_context` | Event | `prompt_context` |
| `auth_action` | Event | `auth_action` |
| `auth_mode` | Event | `auth_mode` |
| `failure_reason` | Event | `failure_reason` |
| `plan_id` | Event | `plan_id` |
| `surface` | Event | `surface` |
| `variant` | Event | `variant` |
| `page_layout` | Event | `page_layout` |
| `recommended_plan` | Event | `recommended_plan` |
| `risk_reversal_variant` | Event | `risk_reversal_variant` |
| `method` | Event | `method` |
| `checkout_mode` | Event | `checkout_mode` |
| `launch_mode` | Event | `launch_mode` |
| `provider` | Event | `provider` |
| `qualification_method` | Event | `qualification_method` |
| `qualification_version` | Event | `qualification_version` |

Do not register `question_id` as a custom dimension. It is intentionally kept
out because of its high cardinality.

## Key Events

In **Admin > Key events**, create or enable exactly these key events:

- `challenge_completion_saved`
- `sign_up`
- `purchase`

Do not mark prompt views, CTA clicks, `begin_checkout`, or
`checkout_verified` as key events for this baseline. Do not mark
`decision_session_qualified` as a key event; it is the analysis denominator.

## Funnel Exploration

Create one exploration named **Activation and conversion baseline v3**. Create
a session segment named **Qualified decision sessions v1** that includes
sessions containing `decision_session_qualified` with
`qualification_version` exactly matching `v1`, and apply it to the four product
decision tabs below. Do not add the qualification event as the first funnel
step because it may occur before or after the first product event.

For tabs 1-4, select **Funnel exploration**, use a **closed funnel**, and leave
steps as indirectly followed by so unrelated events between steps do not break
the funnel.

### Tab 1: Challenge activation

1. `challenge_viewed`
   - `event_name` exactly matches `challenge_viewed`
   - `access_state` exactly matches `available`
2. `challenge_attempt_started`
   - `event_name` exactly matches `challenge_attempt_started`
3. `challenge_attempt_result`
   - `event_name` exactly matches `challenge_attempt_result`
   - `outcome` matches `passed` OR `manual`
4. `challenge_completion_saved`
   - `event_name` exactly matches `challenge_completion_saved`

### Tab 2: Auth acquisition

This tab covers direct header, mobile menu, dashboard, and modal-driven auth
traffic instead of treating the gated modal as the only auth entry point.

1. `auth_page_viewed`
   - `event_name` exactly matches `auth_page_viewed`
2. `auth_submit_started`
   - `event_name` exactly matches `auth_submit_started`
3. `sign_up_or_login`
   - `event_name` matches `sign_up` OR `login`

Break down by `auth_mode`, `method`, and `src`. The `sign_up` event is emitted
only when the backend reports that this request actually created the account;
OAuth button/page intent is not account-creation truth.

### Tab 3: Gated auth prompt

1. `auth_prompt_shown`
   - `event_name` exactly matches `auth_prompt_shown`
2. `auth_prompt_action`
   - `event_name` exactly matches `auth_prompt_action`
   - `auth_action` matches `sign_up` OR `login`
3. `auth_submit_started`
   - `event_name` exactly matches `auth_submit_started`
4. `sign_up_or_login`
   - `event_name` matches `sign_up` OR `login`

### Tab 4: Pricing purchase

1. `pricing_viewed`
   - `event_name` exactly matches `pricing_viewed`
   - This is the 25%-visible plan-card exposure on every pricing surface, not
     merely a `/pricing` route load.
2. `pricing_plan_cta_clicked`
   - `event_name` exactly matches `pricing_plan_cta_clicked`
   - `method` matches `checkout` OR `continue_intent`
3. `checkout_opened`
   - `event_name` exactly matches `checkout_opened`
4. `purchase`
   - `event_name` exactly matches `purchase`

Use `surface` to compare `pricing_page`, `showcase_pricing`, gate, and sticky
placements. Use `pricing_page_viewed` separately for route-discovery analysis;
it is deliberately not the total pricing-offer denominator. `begin_checkout`
remains the standard GA commerce event and must agree with `checkout_opened`,
but it is not a second denominator step.

### Tab 5: Raw traffic sanity

Create a **Free form** tab without the qualified-session segment. Compare raw
sessions, `decision_session_qualified`, `pricing_viewed`, `auth_page_viewed`,
`sign_up`, `checkout_opened`, and `purchase` by date, country, source/medium,
browser, and device category. Keep this tab diagnostic: it preserves crawl and
automation visibility and must not be presented as a human-only conversion
rate.

## Production Validation

After deployment, verify the following in Realtime or DebugView before starting
the baseline:

1. A visible, trusted interaction emits one `decision_session_qualified` with
   only `qualification_method=trusted_interaction` and
   `qualification_version=v1` as its application parameters. Repeated trusted
   interactions in the same loaded runtime do not emit another one.
2. A synthetic DOM interaction does not qualify the runtime. Time spent hidden
   does not count toward the fallback; 15 cumulative visible seconds emits one
   event with `qualification_method=foreground_15s`.
3. Raw product and conversion events still arrive whether or not the runtime
   has qualified. Qualification is an exploration segment, not collection
   filtering.
4. A guest successful JS challenge emits, in order,
   `challenge_viewed`, `challenge_attempt_started`,
   `challenge_attempt_result` with `outcome=passed`, and
   `auth_prompt_shown`. It must not emit `challenge_completion_saved` before
   authentication.
5. A failed guest attempt emits `challenge_attempt_result` with
   `outcome=failed` and does not emit `auth_prompt_shown`.
6. Password and OAuth flows use `auth_submit_failed.failure_reason` only from
   the approved category list and never send email, username, password, token,
   credential, authorization, or secret fields.
7. Opening a hosted checkout emits `checkout_opened` and then
   `begin_checkout`. A blocked popup emits `checkout_launch_failed` with
   `launch_mode=blocked`, offers the same-tab recovery action, and emits neither
   successful-open event until that action actually navigates.
8. A test-mode order never emits `purchase`.
9. A verified paid live order emits one `purchase` per `transaction_id`, with
   `currency`, `value`, `tax`, and `items`. `value` excludes tax and equals the
   sum of item values.
10. Entitlement application emits `checkout_verified`, including when verified
   order metadata arrives after the entitlement event.
11. Early queued events and page views retain their original event/page order.
    `page_path` and `page_location` use the canonical pathname only, so query
    strings and hashes do not split a route into separate report rows.

## First Readout

Evaluate after 28 complete baseline days. Do not redesign pricing or navigation
before all applicable minimum-volume checks can be read. Apply the **Qualified
decision sessions v1** segment to the product-decision counts below, while
retaining the unsegmented raw sanity tab:

| Area | Minimum volume |
| --- | --- |
| Challenge | 100 `challenge_viewed` events with `access_state=available` and 20 attempts |
| Auth acquisition | 30 `auth_page_viewed` events and 10 submit starts |
| Gated auth | 30 `auth_prompt_shown` events |
| Pricing | 30 `pricing_viewed` events and 10 purchase-eligible plan CTA clicks |

These are early product-decision guardrails, not statistical-significance
thresholds. Choose the next change from the first material drop-off:

| Drop-off | Next area to investigate |
| --- | --- |
| Challenge view to attempt | Workspace UX |
| Auth prompt to action | Prompt value proposition and actions |
| Auth action to completion | Password form or OAuth flow |
| Pricing view to plan CTA | Pricing value proposition |
| Checkout start to purchase | Hosted checkout flow |

Report raw and qualified-session rates side by side. Raw all-session conversion
is bot/crawler-contaminated and often behaves like a lower bound; qualified
conversion is engagement-weighted and can exclude real sub-15-second bounces,
so it can behave like an upper bound. Call the latter **decision-qualified**,
never “bot-free” or “clean human.” Exact bot subtraction is not available from
GA4 alone because Vercel ASN/JA4 request signals are not joined to a GA session
identifier.

Production deployment is deliberately outside this runbook and requires a
separate explicit approval.

## References

- [GA4 unwanted referrals](https://support.google.com/analytics/answer/10327750)
- [GA4 recommended `purchase` event](https://developers.google.com/analytics/devguides/collection/ga4/reference/events#purchase)
- [Lemon Squeezy order object](https://docs.lemonsqueezy.com/api/orders/the-order-object)
