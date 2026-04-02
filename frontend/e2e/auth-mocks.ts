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
  meSequence?: Array<{ status: number; error?: string; user?: MockUser }>;
  forceLoginError?: { status: number; error: string };
  forceSignupError?: { status: number; error: string };
  loginSequence?: Array<{ status: number; error?: string; token?: string; user?: MockUser }>;
  signupSequence?: Array<{ status: number; error?: string; token?: string; user?: MockUser }>;
  refreshSequence?: Array<{ status: number; error?: string; token?: string }>;
  changePassword?: { currentPassword: string; currentPasswordConfirm: string; newPassword: string };
  forceChangePasswordError?: { status: number; error: string };
  changePasswordSequence?: Array<{ status: number; error?: string }>;
};

type MockPracticeProgressRecord = {
  family: string;
  itemId: string;
  started: boolean;
  completed: boolean;
  passed: boolean;
  bestScore: number;
  lastPlayedAt: string | null;
  extension: Record<string, unknown>;
};

function buildDashboardProgress(user: MockUser) {
  const solvedCount = Array.isArray(user.solvedQuestionIds) ? user.solvedQuestionIds.length : 0;
  const questionTotalCount = 0;
  const incidentTotalCount = 0;
  const practiceCompletedCount = solvedCount;
  const practiceTotalCount = questionTotalCount + incidentTotalCount;

  return {
    questions: {
      solvedCount,
      totalCount: questionTotalCount,
      solvedPercent: 0,
      topTopics: [],
    },
    incidents: {
      passedCount: 0,
      totalCount: incidentTotalCount,
      passedPercent: 0,
    },
    practice: {
      completedCount: practiceCompletedCount,
      totalCount: practiceTotalCount,
      completedPercent: 0,
    },
  };
}

function getCorsHeaders(req: Request) {
  const origin = req.headers()['origin'] || '*';
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-credentials': 'true',
    'access-control-allow-headers': 'authorization,content-type,x-csrf-token',
    'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
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

function cookieValueFromHeader(cookieHeader: string, name: string): string | null {
  const parts = String(cookieHeader || '')
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean);
  const hit = parts.find((p) => p.startsWith(`${name}=`));
  if (!hit) return null;
  return hit.slice(name.length + 1);
}

async function cookieValueFromContext(page: Page, url: string, name: string): Promise<string | null> {
  try {
    const cookies = await page.context().cookies(url);
    const hit = cookies.find((cookie) => cookie.name === name);
    return hit?.value ?? null;
  } catch {
    return null;
  }
}

function cookieAttributes(req: Request): string {
  const origin = req.headers()['origin'] || '';
  let reqOrigin = '';
  try { reqOrigin = new URL(req.url()).origin; } catch { /* ignore */ }
  const crossSite = !!origin && !!reqOrigin && origin !== reqOrigin;

  if (crossSite && reqOrigin.startsWith('https://')) {
    return 'Path=/; HttpOnly; SameSite=None; Secure';
  }

  return 'Path=/; HttpOnly; SameSite=Lax';
}

function authCookies(req: Request, token: string) {
  // Mimic backend: httpOnly access token cookie.
  const attrs = cookieAttributes(req);
  return {
    'set-cookie': `access_token=${encodeURIComponent(token)}; ${attrs}`,
  } as Record<string, string>;
}

function clearAuthCookies(req: Request) {
  const attrs = cookieAttributes(req);
  return {
    'set-cookie': `access_token=; ${attrs}; Max-Age=0`,
  } as Record<string, string>;
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
  const meSequence = Array.isArray(opts.meSequence) ? [...opts.meSequence] : [];
  const loginSequence = Array.isArray(opts.loginSequence) ? [...opts.loginSequence] : [];
  const signupSequence = Array.isArray(opts.signupSequence) ? [...opts.signupSequence] : [];
  const refreshSequence = Array.isArray(opts.refreshSequence) ? [...opts.refreshSequence] : [];
  const changePasswordSequence = Array.isArray(opts.changePasswordSequence) ? [...opts.changePasswordSequence] : [];
  const practiceProgressRecords = new Map<string, MockPracticeProgressRecord>();
  let currentToken = opts.token;
  let currentUser = opts.user;
  let sessionActive = false;

  const startSession = (token: string, user?: MockUser) => {
    currentToken = token;
    currentUser = user ?? currentUser;
    sessionActive = true;
  };

  const endSession = () => {
    sessionActive = false;
  };

  const isAuthorized = async (req: Request) => {
    const auth = req.headers()['authorization'] || '';
    const cookie = cookieValueFromHeader(req.headers()['cookie'] || '', 'access_token');
    if (cookie === encodeURIComponent(currentToken) || auth === `Bearer ${currentToken}`) {
      return true;
    }

    const browserCookie = await cookieValueFromContext(page, req.url(), 'access_token');
    if (browserCookie === encodeURIComponent(currentToken)) {
      return true;
    }

    // Some browsers do not reliably persist cookies from mocked fetch/XHR responses.
    // Keep an explicit session flag so /me and guarded routes behave consistently.
    return sessionActive;
  };

  // Activity + dashboard endpoints hit after auth redirects; mock them to avoid noisy 401s in E2E.
  await page.route(/\/api\/(activity\/.*|dashboard$|daily\/complete$|weekly-goal$|practice-progress(?:\/.*)?$).*/, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname;

    if (req.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: getCorsHeaders(req) });
    }

    if (!(await isAuthorized(req))) {
      return jsonResponse(route, req, 401, { error: 'Invalid or expired token' });
    }

    if (req.method() === 'GET' && path.endsWith('/practice-progress')) {
      return jsonResponse(route, req, 200, {
        records: Array.from(practiceProgressRecords.values()),
      });
    }

    if (req.method() === 'PUT' && path.includes('/practice-progress/')) {
      const match = path.match(/\/practice-progress\/([^/]+)\/(.+)$/);
      if (!match) {
        return jsonResponse(route, req, 400, { error: 'Invalid practice progress path' });
      }

      const [, family, encodedItemId] = match;
      const itemId = decodeURIComponent(encodedItemId);
      const body = parseJsonBody(req) || {};
      const key = `${family}:${itemId}`;
      const previous = practiceProgressRecords.get(key);
      const nextRecord: MockPracticeProgressRecord = {
        family,
        itemId,
        started: body.started === true,
        completed: body.completed === true,
        passed: body.passed === true,
        bestScore: typeof body.bestScore === 'number'
          ? body.bestScore
          : previous?.bestScore ?? 0,
        lastPlayedAt: typeof body.lastPlayedAt === 'string'
          ? body.lastPlayedAt
          : previous?.lastPlayedAt ?? null,
        extension: body.extension && typeof body.extension === 'object'
          ? body.extension as Record<string, unknown>
          : previous?.extension ?? {},
      };
      practiceProgressRecords.set(key, nextRecord);
      return jsonResponse(route, req, 200, { record: nextRecord });
    }

    if (req.method() === 'GET' && path.endsWith('/activity/summary')) {
      return jsonResponse(route, req, 200, {
        totalXp: 0,
        level: 1,
        nextLevelXp: 200,
        levelProgress: { current: 0, needed: 200, pct: 0 },
        streak: { current: 0, best: 0 },
        freezeTokens: 0,
        weekly: { completed: 0, target: 10, progress: 0 },
        today: { completed: 0, total: 1, progress: 0 },
      });
    }

    if (req.method() === 'GET' && path.endsWith('/activity/recent')) {
      return jsonResponse(route, req, 200, []);
    }

    if (req.method() === 'GET' && path.endsWith('/activity/heatmap')) {
      return jsonResponse(route, req, 200, []);
    }

    if (req.method() === 'GET' && path.endsWith('/dashboard')) {
      const today = new Date();
      const dayKey = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`;
      return jsonResponse(route, req, 200, {
        nextBestAction: {
          id: 'practice_next',
          title: 'Keep your momentum',
          description: 'Continue with one focused coding question.',
          route: '/coding',
          cta: 'Continue practice',
        },
        dailyChallenge: {
          dayKey,
          questionId: 'mock-daily-challenge',
          title: 'Daily challenge',
          kind: 'coding',
          tech: 'javascript',
          difficulty: 'easy',
          route: '/coding',
          available: true,
          completed: false,
          streak: { current: 0, longest: 0 },
        },
        weeklyGoal: {
          enabled: true,
          target: 10,
          completed: 0,
          progress: 0,
          weekKey: 'mock-week',
          bonusXp: 50,
          bonusGranted: false,
        },
        xpLevel: {
          totalXp: 0,
          level: 1,
          levelStepXp: 200,
          currentLevelXp: 0,
          nextLevelXp: 200,
          progress: 0,
        },
        progress: buildDashboardProgress(currentUser),
        settings: {
          weeklyGoalEnabled: true,
          weeklyGoalTarget: 10,
          showStreakWidget: true,
          dailyChallengeTech: 'auto',
        },
      });
    }

    if (req.method() === 'POST' && path.endsWith('/daily/complete')) {
      return jsonResponse(route, req, 200, {
        completed: true,
        dayKey: 'mock-day',
        streak: { current: 1, longest: 1 },
        weeklyGoal: {
          completed: 1,
          target: 10,
          progress: 0.1,
          reached: false,
          bonusGranted: false,
        },
        xpAwarded: 10,
        xp: {
          totalXp: 10,
          level: 1,
          levelStepXp: 200,
          currentLevelXp: 10,
          nextLevelXp: 200,
          progress: 5,
        },
      });
    }

    if (req.method() === 'POST' && path.endsWith('/weekly-goal')) {
      const body = parseJsonBody(req) || {};
      const enabled = typeof body.enabled === 'boolean' ? body.enabled : true;
      const target = Number(body.target || 10);
      const showStreakWidget = typeof body.showStreakWidget === 'boolean' ? body.showStreakWidget : true;
      const dailyChallengeTech = typeof body.dailyChallengeTech === 'string' ? body.dailyChallengeTech : 'auto';
      return jsonResponse(route, req, 200, {
        weeklyGoal: {
          enabled,
          target,
          completed: 0,
          progress: 0,
          weekKey: 'mock-week',
        },
        settings: {
          weeklyGoalEnabled: enabled,
          weeklyGoalTarget: target,
          showStreakWidget,
          dailyChallengeTech,
        },
      });
    }

    return jsonResponse(route, req, 404, { error: `Not mocked: ${path}` });
  });

  await page.route(/\/api\/auth\/.*/, async (route) => {
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
      startSession(opts.token, opts.user);

      const dest = new URL(redirectUri);
      if (state) dest.searchParams.set('state', state);
      if (mode) dest.searchParams.set('mode', mode);

      // WebKit rejects route.fulfill() with redirect status codes. Serve a tiny
      // HTML redirect page instead so mocked OAuth flows behave consistently.
      return route.fulfill({
        status: 200,
        headers: {
          ...authCookies(req, opts.token),
          ...getCorsHeaders(req),
          'content-type': 'text/html; charset=utf-8',
        },
        body: [
          '<!doctype html>',
          '<html><head>',
          `<meta http-equiv="refresh" content="0;url=${dest.toString().replace(/"/g, '&quot;')}">`,
          '</head><body>',
          `<script>location.replace(${JSON.stringify(dest.toString())});</script>`,
          '</body></html>',
        ].join(''),
      });
    }

    // Login
    if (req.method() === 'POST' && path.endsWith('/login')) {
      if (loginSequence.length) {
        const next = loginSequence.shift()!;
        const token = next.token ?? opts.token;
        const user = next.user ?? currentUser;
        if (next.status >= 200 && next.status < 300) {
          startSession(token, user);
          return jsonResponse(route, req, next.status, { token, user }, authCookies(req, token));
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
      startSession(opts.token, opts.user);
      return jsonResponse(route, req, 200, { token: opts.token, user: currentUser }, authCookies(req, opts.token));
    }

    // Signup
    if (req.method() === 'POST' && path.endsWith('/signup')) {
      if (signupSequence.length) {
        const next = signupSequence.shift()!;
        const token = next.token ?? opts.token;
        const user = next.user ?? currentUser;
        if (next.status >= 200 && next.status < 300) {
          startSession(token, user);
          return jsonResponse(route, req, next.status, { token, user }, authCookies(req, token));
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
      startSession(opts.token, opts.user);
      return jsonResponse(route, req, 201, { token: opts.token, user: currentUser }, authCookies(req, opts.token));
    }

    // Refresh
    if (req.method() === 'POST' && path.endsWith('/refresh')) {
      if (refreshSequence.length) {
        const next = refreshSequence.shift()!;
        const token = next.token ?? currentToken;
        if (next.status >= 200 && next.status < 300) {
          startSession(token);
          return jsonResponse(route, req, next.status, { ok: true, token }, authCookies(req, token));
        }
        const message = next.error ?? 'Invalid or expired refresh session';
        return jsonResponse(route, req, next.status, { error: message });
      }

      // Default to a no-op success so auth-refresh interception does not introduce
      // extra browser noise into guest/mock-driven specs that are not testing refresh.
      return jsonResponse(route, req, 200, { ok: true });
    }

    // Logout (clears cookie)
    if (req.method() === 'POST' && path.endsWith('/logout')) {
      endSession();
      return jsonResponse(route, req, 200, { ok: true }, clearAuthCookies(req));
    }

    // Change password
    if (req.method() === 'POST' && path.endsWith('/change-password')) {
      if (changePasswordSequence.length) {
        const next = changePasswordSequence.shift()!;
        if (next.status >= 200 && next.status < 300) {
          return jsonResponse(route, req, next.status, { ok: true });
        }
        const message = next.error ?? (next.status === 401 ? 'Invalid current password' : 'Change password failed');
        return jsonResponse(route, req, next.status, { error: message });
      }

      if (opts.forceChangePasswordError) {
        return jsonResponse(route, req, opts.forceChangePasswordError.status, { error: opts.forceChangePasswordError.error });
      }

      if (opts.changePassword) {
        const body = parseJsonBody(req) || {};
        const ok =
          String(body.currentPassword || '') === opts.changePassword.currentPassword &&
          String(body.currentPasswordConfirm || '') === opts.changePassword.currentPasswordConfirm &&
          String(body.newPassword || '') === opts.changePassword.newPassword;
        if (!ok) return jsonResponse(route, req, 400, { error: 'Invalid change password payload' });
        return jsonResponse(route, req, 200, { ok: true });
      }
    }

    // Me
    if (req.method() === 'GET' && path.endsWith('/me')) {
      if (meSequence.length) {
        const next = meSequence.shift()!;
        if (next.status >= 200 && next.status < 300) {
          const user = next.user ?? currentUser;
          currentUser = user;
          return jsonResponse(route, req, next.status, user);
        }
        const message = next.error ?? 'Invalid or expired token';
        return jsonResponse(route, req, next.status, { error: message });
      }

      if (!(await isAuthorized(req))) return jsonResponse(route, req, 401, { error: 'Invalid or expired token' });
      return jsonResponse(route, req, 200, currentUser);
    }

    return jsonResponse(route, req, 404, { error: `Not mocked: ${path}` });
  });
}
