# Backend

## Setup

1) Install dependencies:

`npm install`

2) Create your local env file:

`cp .env.example .env`

Then edit `.env` with your values. Do not commit `.env` (it is gitignored).

## Auth (cookie-based)

- Short-lived access tokens are stored in an `httpOnly` cookie (`access_token`) to reduce XSS token theft risk.
- Long-lived refresh sessions are stored server-side and rotated through an `httpOnly` cookie (`refresh_token`).
- Protected routes accept the cookie (primary) and `Authorization: Bearer <token>` (fallback).
- The backend enables double-submit CSRF protection for cookie authentication in every `SameSite` mode:
  - Sets a non-`httpOnly` `csrf_token` cookie on login/signup/OAuth/refresh and repairs it during authenticated safe GET requests.
  - Requires a timing-safe `X-CSRF-Token` match on cookie-authenticated `POST/PUT/PATCH/DELETE` requests. Bearer-only requests and signed webhooks are unaffected.

### Required env vars

- `MONGO_TARGET`: Mongo selection target. Use `test` for local development, and reserve `production` for explicit production-local maintenance only.
- `JWT_SECRET`: JWT signing secret (32+ chars required in production).
- `ACCESS_TOKEN_EXPIRES_IN`: short access-token lifetime (recommended: `15m`).
- `REFRESH_SESSION_TTL_DAYS`: rolling refresh-session lifetime in days (recommended: `90`).
- `FRONTEND_ORIGINS`: Comma-separated allowed CORS origins (e.g. `http://localhost:4200,http://127.0.0.1:4310,https://frontendatlas.com`).
- `FRONTEND_ORIGIN`: Single allowed CORS origin (legacy fallback).
- `COOKIE_SAMESITE`: `lax` (default), `strict`, or `none`.
- `COOKIE_DOMAIN`: optional, e.g. `.frontendatlas.com` to share cookies across subdomains.
- `COOKIE_SECURE`: `true` in production over HTTPS, `false` for local HTTP dev.
- `API_RATE_LIMIT_MAX` / `API_RATE_LIMIT_WINDOW_MS`: general `/api/**` IP quota (defaults: `300` / `60000`).
- `WEBHOOK_RATE_LIMIT_MAX` / `WEBHOOK_RATE_LIMIT_WINDOW_MS`: billing webhook IP quota (defaults: `1200` / `60000`).
- `RATE_LIMIT_STORE`: `auto` (Upstash when configured), `redis`, or process-local `memory`.

### Billing (webhooks)

- `BILLING_PROVIDER`: `gumroad` (default) or `lemonsqueezy` for active hosted checkout. `stripe` remains reserved and is intentionally not exposed as a runtime checkout provider yet.
- `GUMROAD_WEBHOOK_SECRET`: shared secret for Gumroad webhooks.
- `LEMONSQUEEZY_WEBHOOK_SECRET_TEST`: LemonSqueezy test webhook secret.
- `LEMONSQUEEZY_WEBHOOK_SECRET_LIVE`: LemonSqueezy live webhook secret.
- `LEMONSQUEEZY_WEBHOOK_SECRET`: legacy fallback (treated as test secret if _TEST is not set).
- `LEMONSQUEEZY_API_KEY`: LemonSqueezy API key for resolving customer portal/manage URLs.
- `LEMONSQUEEZY_API_KEY_TEST` / `LEMONSQUEEZY_API_KEY_LIVE`: mode-scoped read-only API keys for price/order audits. Each falls back to the legacy unscoped key only when its scoped value is absent.
- `LEMONSQUEEZY_STORE_ID`: numeric store id used by the optional read-only orders reconciliation.
- `STRIPE_WEBHOOK_SECRET`: reserved for future use.
- `POLAR_WEBHOOK_SECRET_TEST` / `POLAR_WEBHOOK_SECRET_LIVE`: Polar webhook secrets (Standard Webhooks `whsec_…`; the raw secret string is also accepted for secrets created before 2026-09-08). Polar payloads carry no test flag: the sandbox and the production organization are separate servers, so the secret that verifies the signature names the event mode, and a mode that differs from `PAYMENTS_MODE` is recorded as `processed_checkout_mismatch` without touching the user.
- `POLAR_ACCESS_TOKEN_TEST` / `POLAR_ACCESS_TOKEN_LIVE`: organization access tokens (sandbox / production) for the checkout and customer-portal APIs.
- `POLAR_<PLAN>_PRODUCT_ID_TEST` / `_LIVE`: the four product ids per mode. The lifetime id (or the product metadata `fa_plan_id=lifetime`) is how `order.paid` grants the one-time plan; the other ids let the webhook check that the product matches the plan the attempt sold.
- `PAYMENTS_MODE`: `test` or `live` for checkout-start URL selection. Production should use `live`. Local/E2E should stay on `test` unless you explicitly intend to hit live billing.
- `BILLING_TAX_INCLUSIVE`: public checkout metadata flag. Defaults to `true` because the store uses tax-inclusive pricing; set it explicitly to `false` only if the store setting is deliberately rolled back.
- `BILLING_OFFER_VERSION`: sequential pricing/offer version. Defaults to `pricing_baseline_v1`; use `interview_sprint_v2` when that offer is deliberately released.
- `BILLING_CHECKOUT_SURFACE`: `hosted_new_tab` (default) or `overlay`. Checkout attempts persist this value so historical funnel data is not reinterpreted after a rollout.
- `BILLING_DISCOUNT_CAMPAIGNS_JSON`: server-only JSON allowlist for bounded LemonSqueezy campaigns; defaults to `[]` (all campaigns off). Each enabled entry requires a normalized `campaignId`, `providerDiscountId`, provider-owned `discountCode`, exact mode/plan/source allowlists, and an `endsAt` timestamp. Optional `startsAt` controls activation. Invalid, expired, duplicated, or out-of-scope entries fail closed.
  - Configure the same validity window and redemption limits on the LemonSqueezy discount itself. The backend window controls URL creation, while LemonSqueezy remains authoritative when an already-created checkout URL is redeemed.
- Provider checkout URLs for `POST /api/billing/checkout/start`:
  - `GUMROAD_MONTHLY_URL`, `GUMROAD_QUARTERLY_URL`, `GUMROAD_ANNUAL_URL`
  - `LEMONSQUEEZY_MONTHLY_URL`, `LEMONSQUEEZY_QUARTERLY_URL`, `LEMONSQUEEZY_ANNUAL_URL`, `LEMONSQUEEZY_LIFETIME_URL`
  - `LEMONSQUEEZY_MONTHLY_URL_TEST`, `LEMONSQUEEZY_QUARTERLY_URL_TEST`, `LEMONSQUEEZY_ANNUAL_URL_TEST`, `LEMONSQUEEZY_LIFETIME_URL_TEST`
  - `LEMONSQUEEZY_MONTHLY_URL_LIVE`, `LEMONSQUEEZY_QUARTERLY_URL_LIVE`, `LEMONSQUEEZY_ANNUAL_URL_LIVE`, `LEMONSQUEEZY_LIFETIME_URL_LIVE`
  - `STRIPE_*` values are still reserved; `/api/billing/checkout/config` will report `configuredProvider: "stripe"` with `provider: null` and `enabled: false` until Stripe is fully implemented.
- Live LemonSqueezy checkout requires the matching `*_URL_LIVE` value. The legacy unscoped URL is test-only. A URL reused across test/live or copied from an earlier plan (including Lifetime) is disabled fail-closed.
- Hosted checkout URLs must use HTTPS on the configured provider's own domain.
- Gumroad checkout is exposed only in `PAYMENTS_MODE=live`; the app has no separate Gumroad sandbox URL contract.

### Polar webhooks

- Route: `POST /api/billing/webhooks/polar`, verified with the `webhook-id`, `webhook-timestamp` and `webhook-signature` headers (HMAC-SHA256 over `id.timestamp.body`, five-minute tolerance). The `webhook-id` is the idempotency key, so a redelivery answers `{ ok: true, duplicate: true }`.
- Entitlement mapping (`services/billing/providers/polar.js`): `subscription.*` events apply the subscription state (`active`/`trialing` → active until `current_period_end`; `cancel_at_period_end` or `past_due` → cancelled until the paid-through date; `canceled` with a past `ended_at`, `revoked`, `unpaid` → none); `order.paid` grants `lifetime` only for the lifetime product and otherwise just records the verified payment on the attempt; `order.refunded` revokes on a full refund and ignores a partial one; checkout, customer, refund and benefit events are acknowledged without changes.
- Correlation: the checkout attempt is found by `metadata.fa_checkout_attempt_id`, or by `checkout_id` against the attempt's `providerCheckoutId`; the user by `customer.external_id` (our user id) or `metadata.fa_user_id`. A reference that is not one of our ids is kept as a pending entitlement bound by email, exactly like Lemon Squeezy.
- Amounts: Polar orders are tax inclusive (`total = subtotal - discount`, `net = total - tax`). The attempt stores the tax-exclusive subtotal (`net + discount`) so `subtotal - discount + tax = total` holds for every provider and the analytics value stays `total - tax`.
- Refunding an order in Polar does not end the subscription; cancel the subscription in the dashboard as well when a refund should stop access.

### Polar checkout and portal

- With `BILLING_PROVIDER=polar`, `POST /api/billing/checkout/start` creates a checkout session per attempt (`POST /v1/checkouts/`, `services/billing/providers/polar-checkouts.js`): the plan's product id, `external_customer_id` = our user id, the attempt and attribution as `metadata`, `success_url` / `return_url` on the frontend origin, `embed_origin` when the overlay surface is on, `allow_discount_codes: false`, and the first `X-Forwarded-For` hop as `customer_ip_address` for tax and currency detection. Sessions expire after an hour; the five-minute attempt reuse window stays well inside that.
- Regional and student prices are ad-hoc fixed prices on the session (`prices[productId]`), so nothing is created in Polar and the list price never changes. A campaign from `BILLING_DISCOUNT_CAMPAIGNS_JSON` with `provider: "polar"` applies its `providerDiscountId` as `discount_id` and, as with Lemon Squeezy, wins over the regional price; a Polar entry may omit `discountCode`. Polar would stack a discount on an ad-hoc price, so the backend never sends both.
- The session's returned `amount` must equal the requested price and the URL must be on the host of the mode (`sandbox.polar.sh` / `polar.sh`); otherwise the start fails closed (`CHECKOUT_CREATE_FAILED` or `CUSTOM_CHECKOUT_UNAVAILABLE`, 503) and no attempt is stored. `GET /api/billing/checkout/config` lists a plan as available only when the token and its product id are configured, and publishes the regional block whenever the provider is Polar.
- `GET /api/billing/manage-url` for a Polar customer creates a short-lived customer session (`POST /v1/customer-sessions/` with `external_customer_id`) on every call and stores nothing; before the first confirmed checkout the customer does not exist yet and the route answers `MANAGE_URL_NOT_READY`. An account with both Lemon Squeezy and Polar metadata uses the provider of its latest event.

### Polar operations

- `npm run audit:billing-reconciliation` reconciles verified purchases for both providers and, per provider with read credentials, the provider's recent orders (`providers/polar-orders.js` reads `GET /v1/orders/` newest first until the window start). `GET /api/admin/billing/reconciliation?includeProviderOrders=true&provider=polar` does the same for one provider (default: `BILLING_PROVIDER`, else Lemon Squeezy).
- `npm run audit:billing-price-parity` follows the configured provider: for Polar it reads each plan's product (`GET /v1/products/{id}`) and compares the fixed price, currency, billing interval and interval count with `PLAN_CATALOG`, and flags archived products.
- `POST /api/admin/billing/simulate/polar` replays Polar-shaped events for a test account (`scenario`: `activate`, `renew`, `cancel`, `refund`, `lifetime`, `expire`, `revoke`; `validUntil` for activate/renew/cancel; optional `attemptId`, `externalId`, `planId`, `amountCents`) through the real normalizer, with the same lease and CAS path as the webhook.
- `scripts/prod-integrity-repair.js` treats Polar pending entitlements like Lemon Squeezy ones (user-bound; stale records without a valid binding are ignored, never claimed by email).
- The full-stack E2E backend refuses any live Polar value (`POLAR_*_LIVE`, `POLAR_ACCESS_TOKEN_LIVE`, `POLAR_WEBHOOK_SECRET_LIVE`).

### LemonSqueezy prod setup

1) Environment variables (backend):
   - `LEMONSQUEEZY_WEBHOOK_SECRET_TEST`: secret for LS test webhooks.
   - `LEMONSQUEEZY_WEBHOOK_SECRET_LIVE`: secret for LS live webhooks.
   - `BILLING_PROVIDER=lemonsqueezy` (optional; route still works by provider path).

2) Webhook configuration in LemonSqueezy:
   - Callback URL (backend): `https://api.frontendatlas.com/api/billing/webhooks/lemonsqueezy`
   - Signing secret (test): same value as `LEMONSQUEEZY_WEBHOOK_SECRET_TEST`
   - Signing secret (live): same value as `LEMONSQUEEZY_WEBHOOK_SECRET_LIVE`
   - Events: `order_created`, `order_refunded`, `subscription_created`, `subscription_updated`, `subscription_cancelled` (optionally payment success/failed).

3) Domain routing:
   - Ensure `api.frontendatlas.com` points to the backend Vercel project (`frontendatlas-be`) and the env vars are set there.

4) Checkout start:
   - Route: `POST /api/billing/checkout/start` (auth required).
   - The backend creates a `CheckoutAttempt`, appends custom metadata like `fa_checkout_attempt_id`, and returns the final hosted checkout URL.
   - `analyticsSource` (campaign/referrer) and `analyticsSurface` (UI placement) are normalized and persisted independently; either field is used as a compatibility fallback only when the other is omitted.
   - Optional `analyticsSessionId`, `experimentId`, `offerVersion`, and `checkoutSurface` values are allow-list normalized, persisted on the attempt, and forwarded to LemonSqueezy as non-PII custom attribution.
   - Clients may send only a campaign identifier (`campaignId`). The backend resolves the LemonSqueezy code and provider discount id from `BILLING_DISCOUNT_CAMPAIGNS_JSON`; raw client coupon/code/discount-id fields are ignored. Campaign attribution is part of attempt reuse, so discounted and undiscounted attempts cannot be reused across each other.
   - Every LemonSqueezy checkout URL is rebuilt with `discount=0`, after removing inherited `discount` and `checkout[discount_code]` query values. A valid active campaign is then pre-applied with server-owned `checkout[discount_code]`; the coupon input remains hidden.
   - Reconciliation groups verified attempts by campaign and records discount/amount totals. `recordedRevenueExcludingTaxCents` is deliberately not a final net-revenue metric: LemonSqueezy, recovery, and affiliate fees are not stored on `CheckoutAttempt`, and must be joined from provider exports before using it for the business KPI.
   - `providerDiscountId` is the server-configured intended discount identity. The current orders audit verifies the provider-reported discount amount when available; it does not fetch LemonSqueezy discount-redemption resources to prove that identifier independently.
   - If the same user already has a recent active attempt for the same plan/provider, the backend reuses that attempt instead of creating a second one.
   - Success/cancel redirects include `?attempt=<attemptId>` so the frontend can correlate the return flow.

4b) Checkout attempt status:
   - Route: `GET /api/billing/checkout/attempts/:attemptId/status` (auth required).
   - Returns the correlated attempt state (`awaiting_webhook`, `applied`, `pending_user_match`, `failed`, `expired`) so the success page can show a deterministic activation state instead of trusting the redirect alone.
   - Current product contract is single-tier: the success page only verifies whether premium access became active. It does not try to prove a specific plan delta or transaction-by-transaction upgrade path yet.
   - `POST /api/billing/checkout/attempts/:attemptId/client-state` is authenticated and accepts `provider_opened`, `popup_blocked`, `success_redirected`, or `cancel_redirected`. Timestamps are first-write/idempotent. Redirect state is monotonic (`created` < `cancel_redirected` < `success_redirected`) and cannot overwrite webhook/server terminal states.

5) Manage URL (customer portal):
   - Route: `GET /api/billing/manage-url` (auth required).
   - Requires `LEMONSQUEEZY_API_KEY` if the webhook payload did not include a portal URL.

6) Provider semantics that are intentionally different:
   - LemonSqueezy `subscription_cancelled` without an end date keeps the user's existing paid-through window instead of expiring access immediately.
   - Gumroad cancellation without an end date expires access immediately.
   - Those differences are intentional and covered by tests; do not normalize them away without an explicit product decision.

### Billing audits

- `npm run audit:billing-price-parity` reads the configured LemonSqueezy variants and compares their amount/interval to the backend catalog. It requires the matching `LEMONSQUEEZY_API_KEY_TEST|LIVE` (with the legacy unscoped key as fallback) and mode-scoped `LEMONSQUEEZY_*_VARIANT_ID_TEST|LIVE` values; it never mutates LemonSqueezy.
- `npm run audit:billing-reconciliation` compares recently verified purchases with applied premium entitlements in an explicitly selected test database. With the matching `LEMONSQUEEZY_API_KEY_TEST|LIVE` (or the legacy unscoped fallback) and `LEMONSQUEEZY_STORE_ID`, it also reads recent provider orders and detects missing attempts or unverified purchases. The CLI refuses production targets. The admin-only `GET /api/admin/billing/reconciliation?mode=live&includeProviderOrders=true` endpoint exposes the complete read-only production report for scheduled monitoring; without that opt-in, its report is explicitly local-only.

## Run

- Dev (auto-reload): `npm run dev`
- Start: `npm start`

## Local development notes

- Local backend runs default to `MONGO_TARGET=test`. With the repo's local env, both `npm start` and `npm run dev` connect to the isolated `mongodb://127.0.0.1:27017/fa_interview_local` database and require the matching `EXPECTED_MONGO_DB_NAME_TEST` value.
- `mongodb://127.0.0.1:27017/frontendatlas` is production-only on this machine and must not be used for routine local development or testing.
- Set `MONGO_TARGET=production` only when you explicitly intend to work against the production-local database.
- `.env.example` configures the safe local Interview preflight: `INTERVIEW_MODE_ACCESS=preflight`, `INTERVIEW_SYSTEM_DESIGN_ACCESS=off`, `MONGO_TARGET=test`, `RATE_LIMIT_STORE=memory`, and `SENTRY_ENABLED=false`. The backend rejects preflight against Production, the `frontendatlas` database, or a non-loopback local Mongo host.
- Start the backend with `npm start`, then run `npm run start:e2e` from `frontend/`. Register at `http://127.0.0.1:4200/auth/signup?redirectTo=%2Finterview`; local signup may offer **Continue for now** when SMTP is absent.
- Preflight does not require an admin role: every authenticated local test user can discover Interview Mode while the gate is ready. The legacy role helper remains available for compatibility testing but is not part of the normal local flow.
- Prepare the isolated test database with `npm run migrate:interview-exposure-indexes -- --database=fa_interview_local`. It is dry-run by default; execution requires `--execute --confirm=CREATE_INTERVIEW_EXPOSURE_INDEXES:<database>:<plannedCount>:<expiredCount>` using the exact values printed by dry-run. Then use `npm run verify:interview-exposure-store -- --database=fa_interview_local` to verify the unique/history/365-day TTL contract read-only.
- Sign in and open `http://127.0.0.1:4200/interview` in a viewport at least 768px wide. Free users retain the Mongo-backed monthly Coding Interview quota; Premium users retain unlimited access. System Design remains unavailable.
- The frontend uses `environment.apiBase` for API calls (default: `/api` with `frontend/proxy.conf.json`).
- If you prefer a full URL, set `apiBase` to `http://localhost:3001`.
- When using a full `apiBase` URL from the browser, set `FRONTEND_ORIGINS` to include your frontend origin and keep `credentials: true` requests enabled on the frontend.
- In local development, the backend also tolerates the repo's common frontend ports (`4200`, `4310`, `4173`) on `localhost` and `127.0.0.1` to reduce noisy CORS rejects during Playwright and preview runs.

## Deployment (recommended: Vercel serverless)

This backend is compatible with Vercel serverless functions:
- No WebSockets / SSE / long-running background jobs
- Stateless REST endpoints
- MongoDB connection is cached across invocations

### Vercel project settings (backend)

- Root Directory: `backend`
- Build Command: (leave empty)
- Output Directory: (leave empty)
- Install Command: `npm install` (default)

Routes are handled via `backend/api/[...all].js`, so your API is available at:
- `https://<your-backend-domain>/api/*`

### Interview preflight and direct-public release

- Every Vercel Preview backend must set `MONGO_TARGET=test`, a Preview-only `MONGO_URL_TEST`, and exact `EXPECTED_MONGO_DB_NAME_TEST`; remove `MONGO_URL` from the Preview scope. Startup fails closed if the target/name contract is missing, mismatched, or points to the `frontendatlas` database.
- Set `VERCEL_ENV=preview`, `INTERVIEW_MODE_ACCESS=preflight`, `INTERVIEW_SYSTEM_DESIGN_ACCESS=off`, and `INTERVIEW_OPERATIONAL_STATE=normal`. Preflight is available to ordinary authenticated test users, uses only public/gold Interview artifacts, and is rejected in Production.
- Set the Preview frontend's `NG_APP_PREVIEW_API_BASE` to the exact matching backend Preview origin. The generated browser config rejects the Production API and foreign Vercel projects.
- Set backend `FRONTEND_ORIGINS` and `FRONTEND_BASE` to the exact frontend Preview origin, `SERVER_BASE` to the backend Preview origin, and use `COOKIE_SAMESITE=none`, `COOKIE_SECURE=true` for the cross-site Preview cookies.
- Set `RATE_LIMIT_STORE=redis` with the Preview-only `frontendatlas:preview:interview:v1` namespace. New preflight sessions fail closed when the shared limiter is unavailable; active save/submit keeps the bounded fallback behavior.
- Scope `SENTRY_ENVIRONMENT=preview` and set `SENTRY_RELEASE` exactly to `VERCEL_GIT_COMMIT_SHA`. `npm run verify:interview-sentry -- --execute --confirm=VERIFY_INTERVIEW_SENTRY` requires that exact Preview runtime, release, and preflight scope.
- Monitoring and native Safari flags may remain `false` during technical preflight; their status is reported but does not make `INTERVIEW_PREFLIGHT_READY` fail. They must both be evidence-backed before Production public readiness can pass.
- Keep Production at `INTERVIEW_MODE_ACCESS=off`, `INTERVIEW_OPERATIONAL_STATE=drain`, and System Design `off` during preparation. Use the separate `frontendatlas:production:interview:v1` Redis namespace, keep rollout BPS at `0`, and leave rollout salt unset.
- Vercel Production refuses `public` startup unless `MONGO_TARGET=production`, `MONGO_URL` exactly matches `EXPECTED_MONGO_DB_NAME`, `MONGO_URL_TEST` is absent, System Design is `off`, the Redis store/Production namespace are exact, and cohort BPS/salt remain unused.
- There are no admin/internal or percentage rollout stages and no completion-count threshold. After the complete release record passes, change Production to `public` while still drained and re-check the environment/data evidence. Then change the operational state to `normal` and immediately require `INTERVIEW_RELEASE_READY`; on failure return to `drain`, then `off + drain`. Production database writes, secrets, and both environment changes require separate action-time approval.
- The full checklist and evidence fields live in `docs/references/interview-mode-release-record.md`.

### Required environment variables (production)

- `NODE_ENV=production`
- `MONGO_URL` (MongoDB connection string)
- `JWT_SECRET` (32+ chars)
- `FRONTEND_ORIGINS` (exact allowed origins for CORS, e.g. `https://frontendatlas.com`)
- `SERVER_BASE` (backend base URL, used for OAuth callback URLs)
- `FRONTEND_BASE` (frontend base URL, used for OAuth redirect URLs)
- `COOKIE_SECURE=true`
- `TRUST_PROXY=true` (recommended on Vercel so `req.ip` and cookies behave correctly behind proxies)

**Rate limiting on Vercel**
- Configure `RATE_LIMIT_STORE=redis` with `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` so API and webhook quotas are shared across serverless instances.
- `RATE_LIMIT_STORE=auto` falls back to process-local memory when Upstash is absent or unavailable. This preserves availability but does not provide a global quota across Vercel instances.
- Keep `RATE_LIMIT_REDIS_FAIL_CLOSED=false` unless rejecting requests during a Redis outage is an explicit availability tradeoff.
- Defaults are `API_RATE_LIMIT_MAX=300` per minute and `WEBHOOK_RATE_LIMIT_MAX=1200` per minute; both windows and limits are configurable with the corresponding `_WINDOW_MS` and `_MAX` variables.

**Cookie/SameSite**
- If your frontend + backend share the same site (recommended, e.g. `frontendatlas.com` and `api.frontendatlas.com`), keep `COOKIE_SAMESITE=lax` and consider `COOKIE_DOMAIN=.frontendatlas.com` if you set cookies from different subdomains.
- If your frontend is on a different site (different eTLD+1), use `COOKIE_SAMESITE=none` (enables CSRF double-submit; the frontend already sends `X-CSRF-Token` when the `csrf_token` cookie exists).

**Public contact and bug-report forms**
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`
- `SUPPORT_EMAIL` (defaults to `support@frontendatlas.com`)
- Each endpoint is limited per IP (burst and hourly) by the shared rate limiter above. Non-empty `url` values must use `http`/`https` and match a configured `FRONTEND_ORIGINS` origin.
- Contact form knobs (optional):
  - `CONTACT_BURST_WINDOW_MS` (default `60000`)
  - `CONTACT_BURST_MAX` (default `2`)
  - `CONTACT_WINDOW_MS` (default `3600000`)
  - `CONTACT_MAX` (default `5`)
  - `CONTACT_MAX_NAME_CHARS` / `CONTACT_MAX_EMAIL_CHARS` (defaults `120` / `320`)
  - `CONTACT_MIN_MESSAGE_CHARS` (default `10`)
  - `CONTACT_MAX_MESSAGE_CHARS` (default `4000`)
- Bug-report knobs (optional):
  - `BUG_REPORT_BURST_WINDOW_MS` (default `60000`)
  - `BUG_REPORT_BURST_MAX` (default `2`)
  - `BUG_REPORT_WINDOW_MS` (default `3600000`)
  - `BUG_REPORT_MAX` (default `5`)
  - `BUG_REPORT_DUP_WINDOW_MS` (default `600000`): a client repeating the same report within this window gets `429`
  - `BUG_REPORT_MIN_NOTE_CHARS` (default `8`)
  - `BUG_REPORT_MAX_NOTE_CHARS` (default `4000`)
  - `BUG_REPORT_MAX_URL_CHARS` (default `2000`, shared with the contact form)

Both `POST /api/contact` and `POST /api/bug-report` return `204` on success. Rate-limited requests return `429` with a `Retry-After` header.

### Quick verification checklist

- Health: `GET /api/hello`
- Contact:
  - `POST /api/contact` returns `204` and delivers an email
- Auth:
  - `POST /api/auth/signup` sets `access_token` + `refresh_token` cookies
  - `POST /api/auth/refresh` rotates the refresh session and reissues `access_token`
  - `GET /api/auth/me` returns user when access cookie is present
- Bug report:
  - `POST /api/bug-report` returns `204` and delivers an email

## Alternative hosting (Render/Fly/Railway)

If you prefer a long-running Node server (no serverless limits/cold starts), this backend also works as a standard service:
- Start command: `npm start`
- Port: `process.env.PORT`
- Health route: `GET /api/hello`
