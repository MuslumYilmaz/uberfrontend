# Backend

## Setup

1) Install dependencies:

`npm install`

2) Create your local env file:

`cp .env.example .env`

Then edit `.env` with your values. Do not commit `.env` (it is gitignored).

## Auth (cookie-based)

- Access tokens are stored in an `httpOnly` cookie (`access_token`) to reduce XSS token theft risk.
- Protected routes accept the cookie (primary) and `Authorization: Bearer <token>` (fallback).
- If `COOKIE_SAMESITE=none`, the backend enables double-submit CSRF protection:
  - Sets a non-`httpOnly` `csrf_token` cookie on login/signup/OAuth.
  - Requires `X-CSRF-Token` header to match `csrf_token` on `POST/PUT/PATCH/DELETE` protected routes.

### Required env vars

- `JWT_SECRET`: JWT signing secret (32+ chars required in production).
- `FRONTEND_ORIGINS`: Comma-separated allowed CORS origins (e.g. `http://localhost:4200,https://frontendatlas.com`).
- `FRONTEND_ORIGIN`: Single allowed CORS origin (legacy fallback).
- `COOKIE_SAMESITE`: `lax` (default), `strict`, or `none`.
- `COOKIE_DOMAIN`: optional, e.g. `.frontendatlas.com` to share cookies across subdomains.
- `COOKIE_SECURE`: `true` in production over HTTPS, `false` for local HTTP dev.

### Billing (webhooks)

- `BILLING_PROVIDER`: `gumroad` (default), `lemonsqueezy`, or `stripe` (future use).
- `GUMROAD_WEBHOOK_SECRET`: shared secret for Gumroad webhooks.
- `LEMONSQUEEZY_WEBHOOK_SECRET_TEST`: LemonSqueezy test webhook secret.
- `LEMONSQUEEZY_WEBHOOK_SECRET_LIVE`: LemonSqueezy live webhook secret.
- `LEMONSQUEEZY_WEBHOOK_SECRET`: legacy fallback (treated as test secret if _TEST is not set).
- `LEMONSQUEEZY_API_KEY`: LemonSqueezy API key for resolving customer portal/manage URLs.
- `STRIPE_WEBHOOK_SECRET`: reserved for future use.

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

3) Manage URL (customer portal):
   - Route: `GET /api/billing/manage-url` (auth required).
   - Requires `LEMONSQUEEZY_API_KEY` if the webhook payload did not include a portal URL.

## Run

- Dev (auto-reload): `npm run dev`
- Start: `npm start`

## Local development notes

- The frontend uses `environment.apiBase` for API calls (default: `/api` with `frontend/proxy.conf.json`).
- If you prefer a full URL, set `apiBase` to `http://localhost:3001`.
- When using a full `apiBase` URL from the browser, set `FRONTEND_ORIGINS` to include your frontend origin and keep `credentials: true` requests enabled on the frontend.

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

**Bug report email (optional)**
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`
- Spam guard knobs (optional):
  - `BUG_REPORT_BURST_WINDOW_MS` (default `60000`)
  - `BUG_REPORT_BURST_MAX` (default `2`)
  - `BUG_REPORT_WINDOW_MS` (default `3600000`)
  - `BUG_REPORT_MAX` (default `5`)
  - `BUG_REPORT_DUP_WINDOW_MS` (default `600000`)
  - `BUG_REPORT_MIN_NOTE_CHARS` (default `8`)

### Quick verification checklist

- Health: `GET /api/hello`
- Auth:
  - `POST /api/auth/signup` sets `access_token` cookie
  - `GET /api/auth/me` returns user when cookie is present
- Bug report:
  - `POST /api/bug-report` returns `204` and delivers an email

## Alternative hosting (Render/Fly/Railway)

If you prefer a long-running Node server (no serverless limits/cold starts), this backend also works as a standard service:
- Start command: `npm start`
- Port: `process.env.PORT`
- Health route: `GET /api/hello`
