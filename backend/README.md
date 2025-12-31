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
- `FRONTEND_ORIGIN`: Allowed CORS origin (e.g. `http://localhost:4200`).
- `COOKIE_SAMESITE`: `lax` (default), `strict`, or `none`.
- `COOKIE_SECURE`: `true` in production over HTTPS, `false` for local HTTP dev.

## Run

- Dev (auto-reload): `npm run dev`
- Start: `npm start`

## Local development notes

- The frontend defaults to proxying `/api` to the backend (no CORS needed). See `frontend/src/environments/environment.ts`.
- If you disable the proxy and use a full `apiBase` URL from the browser, set `FRONTEND_ORIGIN` to your frontend origin and keep `credentials: true` requests enabled on the frontend.
