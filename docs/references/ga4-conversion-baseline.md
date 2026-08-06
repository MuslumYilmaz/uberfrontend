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

## Unwanted Referrals

In **Admin > Data streams > Web stream > Configure tag settings > Show all >
List unwanted referrals**, add only the entries that do not already exist:

| Match type | Referral domain |
| --- | --- |
| Referral domain exactly matches | `accounts.google.com` |
| Referral domain exactly matches | `frontendatlas.lemonsqueezy.com` |

This setting is not retroactive.

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
| `checkout_mode` | Event | `checkout_mode` |
| `provider` | Event | `provider` |

Do not register `question_id` as a custom dimension. It is intentionally kept
out because of its high cardinality.

## Key Events

In **Admin > Key events**, create or enable exactly these key events:

- `challenge_completion_saved`
- `sign_up`
- `purchase`

Do not mark prompt views, CTA clicks, `begin_checkout`, or
`checkout_verified` as key events for this baseline.

## Funnel Exploration

Create one exploration named **Activation and conversion baseline v2**. Add the
three tabs below. For every tab, select **Funnel exploration**, use a **closed
funnel**, and leave steps as indirectly followed by so unrelated events between
steps do not break the funnel.

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

### Tab 2: Auth conversion

1. `auth_prompt_shown`
   - `event_name` exactly matches `auth_prompt_shown`
2. `auth_prompt_action`
   - `event_name` exactly matches `auth_prompt_action`
   - `auth_action` matches `sign_up` OR `login`
3. `auth_submit_started`
   - `event_name` exactly matches `auth_submit_started`
4. `sign_up_or_login`
   - `event_name` matches `sign_up` OR `login`

### Tab 3: Pricing purchase

1. `pricing_viewed`
   - `event_name` exactly matches `pricing_viewed`
   - `src` exactly matches `pricing_page`
2. `pricing_plan_cta_clicked`
   - `event_name` exactly matches `pricing_plan_cta_clicked`
3. `begin_checkout`
   - `event_name` exactly matches `begin_checkout`
4. `purchase`
   - `event_name` exactly matches `purchase`

## Production Validation

After deployment, verify the following in Realtime or DebugView before starting
the baseline:

1. A guest successful JS challenge emits, in order,
   `challenge_viewed`, `challenge_attempt_started`,
   `challenge_attempt_result` with `outcome=passed`, and
   `auth_prompt_shown`. It must not emit `challenge_completion_saved` before
   authentication.
2. A failed guest attempt emits `challenge_attempt_result` with
   `outcome=failed` and does not emit `auth_prompt_shown`.
3. Password and OAuth flows use `auth_submit_failed.failure_reason` only from
   the approved category list and never send email, username, password, token,
   credential, authorization, or secret fields.
4. Opening a hosted checkout emits `begin_checkout`.
5. A test-mode order never emits `purchase`.
6. A verified paid live order emits one `purchase` per `transaction_id`, with
   `currency`, `value`, `tax`, and `items`. `value` excludes tax and equals the
   sum of item values.
7. Entitlement application emits `checkout_verified`, including when verified
   order metadata arrives after the entitlement event.

## First Readout

Evaluate after 28 complete baseline days. Do not redesign pricing or navigation
before all applicable minimum-volume checks can be read:

| Area | Minimum volume |
| --- | --- |
| Challenge | 100 `challenge_viewed` events with `access_state=available` and 20 attempts |
| Auth | 30 `auth_prompt_shown` events |
| Pricing | 30 `pricing_viewed` events with `src=pricing_page` and 10 plan CTA clicks |

These are early product-decision guardrails, not statistical-significance
thresholds. Choose the next change from the first material drop-off:

| Drop-off | Next area to investigate |
| --- | --- |
| Challenge view to attempt | Workspace UX |
| Auth prompt to action | Prompt value proposition and actions |
| Auth action to completion | Password form or OAuth flow |
| Pricing view to plan CTA | Pricing value proposition |
| Checkout start to purchase | Hosted checkout flow |

Production deployment is deliberately outside this runbook and requires a
separate explicit approval.

## References

- [GA4 unwanted referrals](https://support.google.com/analytics/answer/10327750)
- [GA4 recommended `purchase` event](https://developers.google.com/analytics/devguides/collection/ga4/reference/events#purchase)
- [Lemon Squeezy order object](https://docs.lemonsqueezy.com/api/orders/the-order-object)
