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
- Public forms in production also require `TURNSTILE_SECRET_KEY`, `TURNSTILE_ALLOWED_HOSTNAMES`, `PUBLIC_FORM_REDIS_REQUIRED=true`, `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN`.

### Billing (webhooks)

- `BILLING_PROVIDER`: `gumroad` (default) or `lemonsqueezy` for active hosted checkout. `stripe` remains reserved and is intentionally not exposed as a runtime checkout provider yet.
- `GUMROAD_WEBHOOK_SECRET`: shared secret for Gumroad webhooks.
- `LEMONSQUEEZY_WEBHOOK_SECRET_TEST`: LemonSqueezy test webhook secret.
- `LEMONSQUEEZY_WEBHOOK_SECRET_LIVE`: LemonSqueezy live webhook secret.
- `LEMONSQUEEZY_WEBHOOK_SECRET`: legacy fallback (treated as test secret if _TEST is not set).
- `LEMONSQUEEZY_API_KEY`: LemonSqueezy API key for resolving customer portal/manage URLs.
- `STRIPE_WEBHOOK_SECRET`: reserved for future use.
- `PAYMENTS_MODE`: `test` or `live` for checkout-start URL selection. Production should use `live`. Local/E2E should stay on `test` unless you explicitly intend to hit live billing.
- Provider checkout URLs for `POST /api/billing/checkout/start`:
  - `GUMROAD_MONTHLY_URL`, `GUMROAD_QUARTERLY_URL`, `GUMROAD_ANNUAL_URL`
  - `LEMONSQUEEZY_MONTHLY_URL`, `LEMONSQUEEZY_QUARTERLY_URL`, `LEMONSQUEEZY_ANNUAL_URL`, `LEMONSQUEEZY_LIFETIME_URL`
  - `LEMONSQUEEZY_MONTHLY_URL_TEST`, `LEMONSQUEEZY_QUARTERLY_URL_TEST`, `LEMONSQUEEZY_ANNUAL_URL_TEST`, `LEMONSQUEEZY_LIFETIME_URL_TEST`
  - `LEMONSQUEEZY_MONTHLY_URL_LIVE`, `LEMONSQUEEZY_QUARTERLY_URL_LIVE`, `LEMONSQUEEZY_ANNUAL_URL_LIVE`, `LEMONSQUEEZY_LIFETIME_URL_LIVE`
  - `STRIPE_*` values are still reserved; `/api/billing/checkout/config` will report `configuredProvider: "stripe"` with `provider: null` and `enabled: false` until Stripe is fully implemented.
- Live LemonSqueezy checkout requires the matching `*_URL_LIVE` value. The legacy unscoped URL is test-only. A URL reused across test/live or copied from an earlier plan (including Lifetime) is disabled fail-closed.
- Hosted checkout URLs must use HTTPS on the configured provider's own domain.
- Gumroad checkout is exposed only in `PAYMENTS_MODE=live`; the app has no separate Gumroad sandbox URL contract.

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

## Run

- Dev (auto-reload): `npm run dev`
- Start: `npm start`

## Local development notes

- Local backend runs default to `MONGO_TARGET=test`. With the repo's local env, both `npm start` and `npm run dev` connect to `mongodb://127.0.0.1:27017/test`.
- `mongodb://127.0.0.1:27017/frontendatlas` is production-only on this machine and must not be used for routine local development or testing.
- Set `MONGO_TARGET=production` only when you explicitly intend to work against the production-local database.
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
- Public contact and bug-report protection is intentionally separate: set `PUBLIC_FORM_REDIS_REQUIRED=true` in production. Those two routes fail closed with `FORM_PROTECTION_UNAVAILABLE` if Upstash is missing or unavailable; the global API limiter keeps the fallback behavior above.

**Cookie/SameSite**
- If your frontend + backend share the same site (recommended, e.g. `frontendatlas.com` and `api.frontendatlas.com`), keep `COOKIE_SAMESITE=lax` and consider `COOKIE_DOMAIN=.frontendatlas.com` if you set cookies from different subdomains.
- If your frontend is on a different site (different eTLD+1), use `COOKIE_SAMESITE=none` (enables CSRF double-submit; the frontend already sends `X-CSRF-Token` when the `csrf_token` cookie exists).

**Public contact and bug-report forms**
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`
- `SUPPORT_EMAIL` (defaults to `support@frontendatlas.com`)
- `TURNSTILE_SECRET_KEY`: Managed Cloudflare Turnstile secret; never expose it to frontend code.
- `TURNSTILE_ALLOW_DUMMY_KEYS=false`: set to `true` only with `NODE_ENV=test` or `NODE_ENV=development` and Cloudflare's exact official dummy secret. Production, staging, and unknown runtime values reject both this flag and known dummy secrets with `503`.
- `TURNSTILE_ALLOWED_HOSTNAMES`: exact comma-separated response hostnames, without schemes/ports/paths (for example `frontendatlas.com,www.frontendatlas.com`).
- `TURNSTILE_VERIFY_TIMEOUT_MS` (default `3000`) and `TURNSTILE_TOKEN_MAX_AGE_MS` (default `300000`). Siteverify uses the request IP, validates the form action and hostname, and makes one transient retry with the same idempotency key.
- `PUBLIC_FORM_REDIS_REQUIRED=true`: required in production; no memory fallback is used there. `PUBLIC_FORM_REDIS_TIMEOUT_MS` bounds each Upstash request (default `3000`).
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`: shared quota and exact-deduplication store.
- Shared form knobs (optional):
  - `PUBLIC_FORM_DUP_WINDOW_MS` (default `600000`)
  - `PUBLIC_FORM_MAX_URL_CHARS` (default `2000`); non-empty `url` values must use `http`/`https` and match a configured `FRONTEND_ORIGINS` origin.
- Contact form knobs (optional):
  - `CONTACT_BURST_WINDOW_MS` (default `60000`)
  - `CONTACT_BURST_MAX` (default `2`)
  - `CONTACT_WINDOW_MS` (default `3600000`)
  - `CONTACT_MAX` (default `5`)
  - `CONTACT_EMAIL_HOURLY_WINDOW_MS` / `CONTACT_EMAIL_HOURLY_MAX` (defaults `3600000` / `3`)
  - `CONTACT_EMAIL_DAILY_WINDOW_MS` / `CONTACT_EMAIL_DAILY_MAX` (defaults `86400000` / `5`)
  - `CONTACT_MAX_NAME_CHARS` / `CONTACT_MAX_EMAIL_CHARS` (defaults `120` / `320`)
  - `CONTACT_MIN_MESSAGE_CHARS` (default `10`)
  - `CONTACT_MAX_MESSAGE_CHARS` (default `4000`)
- Bug-report knobs (optional):
  - `BUG_REPORT_BURST_WINDOW_MS` (default `60000`)
  - `BUG_REPORT_BURST_MAX` (default `2`)
  - `BUG_REPORT_WINDOW_MS` (default `3600000`)
  - `BUG_REPORT_MAX` (default `5`)
  - `BUG_REPORT_MIN_NOTE_CHARS` (default `8`)
  - `BUG_REPORT_MAX_NOTE_CHARS` (default `4000`)

Both `POST /api/contact` and `POST /api/bug-report` accept `verificationToken` plus an empty `website` honeypot field and keep `204` as the success response. Protection failures use `{ code, error }`: `FORM_VERIFICATION_REQUIRED` (`400`), `FORM_VERIFICATION_FAILED` (`403`), `FORM_RATE_LIMITED` (`429`, with `Retry-After`), and `FORM_PROTECTION_UNAVAILABLE` (`503`). Quota and duplicate keys contain hashes only; decision logs contain only form/outcome/reason labels.

For local/E2E automation, use `NODE_ENV=test` or `NODE_ENV=development`, Cloudflare's official Turnstile test sitekey and matching test secret, set `TURNSTILE_ALLOW_DUMMY_KEYS=true`, and include `localhost` in `TURNSTILE_ALLOWED_HOSTNAMES`. This explicit test mode accepts Cloudflare's fixed dummy metadata (`action=test` and its fixed challenge timestamp) while still requiring a successful Siteverify response and an allowed hostname. Tests can set `PUBLIC_FORM_REDIS_REQUIRED=false` to use the process-local store without network access. Never deploy the Turnstile test secret or enable dummy keys in production. See [Cloudflare's testing guide](https://developers.cloudflare.com/turnstile/troubleshooting/testing/) and [Siteverify guide](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

Deployment order: provision the Managed widget and Upstash first, deploy the token-sending frontend, then enable backend enforcement with the production secret, allowed hostnames, and `PUBLIC_FORM_REDIS_REQUIRED=true`. During the first seven days, monitor PII-free accepted/rejected reasons, `429`/`503` rates, and Turnstile Analytics; tune quotas through environment variables only and do not introduce automatic fail-open behavior.

### Quick verification checklist

- Health: `GET /api/hello`
- Contact:
  - `POST /api/contact` with a valid `verificationToken` and empty `website` returns `204` and delivers an email
- Auth:
  - `POST /api/auth/signup` sets `access_token` + `refresh_token` cookies
  - `POST /api/auth/refresh` rotates the refresh session and reissues `access_token`
  - `GET /api/auth/me` returns user when access cookie is present
- Bug report:
  - `POST /api/bug-report` with a valid `verificationToken` and empty `website` returns `204` and delivers an email

## Alternative hosting (Render/Fly/Railway)

If you prefer a long-running Node server (no serverless limits/cold starts), this backend also works as a standard service:
- Start command: `npm start`
- Port: `process.env.PORT`
- Health route: `GET /api/hello`
