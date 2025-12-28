import type { Page, Request, Route } from '@playwright/test';

type MockUser = {
  _id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  accessTier?: 'free' | 'premium';
  prefs: {
    tz: string;
    theme: 'dark' | 'light' | 'system';
    defaultTech: 'javascript' | 'typescript' | 'react' | 'angular' | 'vue' | 'html' | 'css' | 'system-design';
    keyboard: 'default' | 'vim';
    marketingEmails: boolean;
  };
  stats?: any;
  billing?: any;
  coupons?: any[];
  solvedQuestionIds?: string[];
  createdAt: string;
};

type AuthMockOptions = {
  token: string;
  user: MockUser;
  validLogin?: { emailOrUsername: string; password: string };
  validSignup?: { email: string; username: string; password: string };
  forceLoginError?: { status: number; error: string };
  forceSignupError?: { status: number; error: string };
  loginSequence?: Array<{ status: number; error?: string; token?: string; user?: MockUser }>;
  signupSequence?: Array<{ status: number; error?: string; token?: string; user?: MockUser }>;
};

function getCorsHeaders(req: Request) {
  const origin = req.headers()['origin'] || '*';
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-credentials': 'true',
    'access-control-allow-headers': 'authorization,content-type',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-max-age': '86400',
  } as Record<string, string>;
}

function jsonResponse(route: Route, req: Request, status: number, body: unknown, extraHeaders?: Record<string, string>) {
  return route.fulfill({
    status,
    headers: {
      ...getCorsHeaders(req),
      'content-type': 'application/json',
      ...(extraHeaders || {}),
    },
    body: JSON.stringify(body),
  });
}

function parseJsonBody(req: Request): any {
  const raw = req.postData() || '';
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function buildMockUser(overrides?: Partial<MockUser>): MockUser {
  return {
    _id: 'e2e-user',
    username: 'e2e_user',
    email: 'e2e@example.com',
    role: 'user',
    accessTier: 'free',
    prefs: {
      tz: 'UTC',
      theme: 'dark',
      defaultTech: 'javascript',
      keyboard: 'default',
      marketingEmails: false,
    },
    solvedQuestionIds: [],
    createdAt: new Date().toISOString(),
    ...(overrides || {}),
  };
}

export async function installAuthMock(page: Page, opts: AuthMockOptions) {
  const loginSequence = Array.isArray(opts.loginSequence) ? [...opts.loginSequence] : [];
  const signupSequence = Array.isArray(opts.signupSequence) ? [...opts.signupSequence] : [];

  await page.route('http://localhost:3001/api/auth/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname;

    // CORS preflight
    if (req.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: getCorsHeaders(req) });
    }

    // OAuth "start" endpoints: redirect back to the provided redirect_uri.
    if (req.method() === 'GET' && path.includes('/oauth/') && path.endsWith('/start')) {
      const redirectUri = url.searchParams.get('redirect_uri') || `${page.url().split('/').slice(0, 3).join('/')}/auth/callback`;
      const state = url.searchParams.get('state') || '';
      const mode = url.searchParams.get('mode') || '';

      const dest = new URL(redirectUri);
      if (state) dest.searchParams.set('state', state);
      if (mode) dest.searchParams.set('mode', mode);
      dest.hash = `token=${encodeURIComponent(opts.token)}`;

      return route.fulfill({
        status: 302,
        headers: {
          location: dest.toString(),
        },
      });
    }

    // Login
    if (req.method() === 'POST' && path.endsWith('/login')) {
      if (loginSequence.length) {
        const next = loginSequence.shift()!;
        const token = next.token ?? opts.token;
        const user = next.user ?? opts.user;
        if (next.status >= 200 && next.status < 300) {
          return jsonResponse(route, req, next.status, { token, user });
        }
        const message = next.error ?? (next.status === 401 ? 'Invalid credentials' : 'Login failed');
        return jsonResponse(route, req, next.status, { error: message });
      }

      if (opts.forceLoginError) {
        return jsonResponse(route, req, opts.forceLoginError.status, { error: opts.forceLoginError.error });
      }

      const body = parseJsonBody(req) || {};
      const ok =
        !opts.validLogin ||
        (String(body.emailOrUsername || '') === opts.validLogin.emailOrUsername &&
          String(body.password || '') === opts.validLogin.password);

      if (!ok) return jsonResponse(route, req, 401, { error: 'Invalid credentials' });
      return jsonResponse(route, req, 200, { token: opts.token, user: opts.user });
    }

    // Signup
    if (req.method() === 'POST' && path.endsWith('/signup')) {
      if (signupSequence.length) {
        const next = signupSequence.shift()!;
        const token = next.token ?? opts.token;
        const user = next.user ?? opts.user;
        if (next.status >= 200 && next.status < 300) {
          return jsonResponse(route, req, next.status, { token, user });
        }
        const message = next.error ?? (next.status === 409 ? 'Account already exists' : 'Sign up failed');
        return jsonResponse(route, req, next.status, { error: message });
      }

      if (opts.forceSignupError) {
        return jsonResponse(route, req, opts.forceSignupError.status, { error: opts.forceSignupError.error });
      }

      const body = parseJsonBody(req) || {};
      const ok =
        !opts.validSignup ||
        (String(body.email || '') === opts.validSignup.email &&
          String(body.username || '') === opts.validSignup.username &&
          String(body.password || '') === opts.validSignup.password);

      if (!ok) return jsonResponse(route, req, 400, { error: 'Invalid signup payload' });
      return jsonResponse(route, req, 201, { token: opts.token, user: opts.user });
    }

    // Me
    if (req.method() === 'GET' && path.endsWith('/me')) {
      const auth = req.headers()['authorization'] || '';
      const ok = auth === `Bearer ${opts.token}`;
      if (!ok) return jsonResponse(route, req, 401, { error: 'Invalid or expired token' });
      return jsonResponse(route, req, 200, opts.user);
    }

    return jsonResponse(route, req, 404, { error: `Not mocked: ${path}` });
  });
}
