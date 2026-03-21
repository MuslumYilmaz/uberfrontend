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
- If `COOKIE_SAMESITE=none`, the backend enables double-submit CSRF protection:
  - Sets a non-`httpOnly` `csrf_token` cookie on login/signup/OAuth.
  - Requires `X-CSRF-Token` header to match `csrf_token` on `POST/PUT/PATCH/DELETE` protected routes and refresh/logout requests.

### Required env vars

- `JWT_SECRET`: JWT signing secret (32+ chars required in production).
- `ACCESS_TOKEN_EXPIRES_IN`: short access-token lifetime (recommended: `15m`).
- `REFRESH_SESSION_TTL_DAYS`: rolling refresh-session lifetime in days (recommended: `90`).
- `FRONTEND_ORIGINS`: Comma-separated allowed CORS origins (e.g. `http://localhost:4200,http://127.0.0.1:4310,https://frontendatlas.com`).
- `FRONTEND_ORIGIN`: Single allowed CORS origin (legacy fallback).
- `COOKIE_SAMESITE`: `lax` (default), `strict`, or `none`.
- `COOKIE_DOMAIN`: optional, e.g. `.frontendatlas.com` to share cookies across subdomains.
- `COOKIE_SECURE`: `true` in production over HTTPS, `false` for local HTTP dev.

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
   - If the same user already has a recent active attempt for the same plan/provider, the backend reuses that attempt instead of creating a second one.
   - Success/cancel redirects include `?attempt=<attemptId>` so the frontend can correlate the return flow.

4b) Checkout attempt status:
   - Route: `GET /api/billing/checkout/attempts/:attemptId/status` (auth required).
   - Returns the correlated attempt state (`awaiting_webhook`, `applied`, `pending_user_match`, `failed`, `expired`) so the success page can show a deterministic activation state instead of trusting the redirect alone.
   - Current product contract is single-tier: the success page only verifies whether premium access became active. It does not try to prove a specific plan delta or transaction-by-transaction upgrade path yet.

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

**Cookie/SameSite**
- If your frontend + backend share the same site (recommended, e.g. `frontendatlas.com` and `api.frontendatlas.com`), keep `COOKIE_SAMESITE=lax` and consider `COOKIE_DOMAIN=.frontendatlas.com` if you set cookies from different subdomains.
- If your frontend is on a different site (different eTLD+1), use `COOKIE_SAMESITE=none` (enables CSRF double-submit; the frontend already sends `X-CSRF-Token` when the `csrf_token` cookie exists).

**Support email (optional)**
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`
- `SUPPORT_EMAIL` (defaults to `support@frontendatlas.com`)
- Contact form knobs (optional):
  - `CONTACT_BURST_WINDOW_MS` (default `60000`)
  - `CONTACT_BURST_MAX` (default `2`)
  - `CONTACT_WINDOW_MS` (default `3600000`)
  - `CONTACT_MAX` (default `5`)
  - `CONTACT_MIN_MESSAGE_CHARS` (default `10`)
  - `CONTACT_MAX_MESSAGE_CHARS` (default `4000`)
- Spam guard knobs (optional):
  - `BUG_REPORT_BURST_WINDOW_MS` (default `60000`)
  - `BUG_REPORT_BURST_MAX` (default `2`)
  - `BUG_REPORT_WINDOW_MS` (default `3600000`)
  - `BUG_REPORT_MAX` (default `5`)
  - `BUG_REPORT_DUP_WINDOW_MS` (default `600000`)
  - `BUG_REPORT_MIN_NOTE_CHARS` (default `8`)

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
