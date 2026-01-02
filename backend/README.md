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
- `COOKIE_SECURE`: `true` in production over HTTPS, `false` for local HTTP dev.

## Run

- Dev (auto-reload): `npm run dev`
- Start: `npm start`

## Local development notes

- The frontend uses `environment.apiBase` for API calls (default: `http://localhost:3001`).
- If you prefer a local proxy, set `apiBase` to `/api` and use `frontend/proxy.conf.json`.
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
- If your frontend + backend share the same site (recommended, e.g. `frontendatlas.com` and `api.frontendatlas.com`), keep `COOKIE_SAMESITE=lax`.
- If your frontend is on a different site (different eTLD+1), use `COOKIE_SAMESITE=none` (enables CSRF double-submit; the frontend already sends `X-CSRF-Token` when the `csrf_token` cookie exists).

**Bug report email (optional)**
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`

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
