import { test, expect } from './fixtures';
import { buildMockUser, installAuthMock } from './auth-mocks';
import { WEB_QUESTION } from './helpers';

async function login(page: any, email: string, password = 'secret123') {
  await page.goto('/auth/login');
  await expect(page.getByTestId('login-page')).toBeVisible();
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
  await expect(page).toHaveURL('/dashboard');
}

function jsonHeaders() {
  return {
    'content-type': 'application/json; charset=utf-8',
  };
}

test('offline solve replays on reconnect and dashboard reflects xp + level', async ({ page }) => {
  const token = `e2e-token-gamification-offline-${Date.now()}`;
  const today = new Date().toISOString().slice(0, 10);
  const user = buildMockUser({
    _id: 'e2e-gamification-offline-user',
    username: 'offline_gamification_user',
    email: 'offline-gamification@example.com',
    solvedQuestionIds: [],
    stats: {
      xpTotal: 190,
      completedTotal: 0,
      perTech: {},
      streak: { current: 0, longest: 0, lastActiveUTCDate: null },
    },
  });

  const state = {
    completionCalls: 0,
    summary: {
      totalXp: 190,
      level: 1,
      nextLevelXp: 200,
      levelProgress: { current: 190, needed: 200, pct: 0.95 },
      streak: { current: 0, best: 0 },
      freezeTokens: 0,
      weekly: { completed: 0, target: 10, progress: 0 },
      today: { completed: 0, total: 3, progress: 0 },
    },
    dashboard: {
      nextBestAction: {
        id: 'practice_next',
        title: 'Keep your momentum',
        description: 'Continue with one focused coding question.',
        route: '/coding',
        cta: 'Continue practice',
      },
      dailyChallenge: {
        dayKey: today,
        questionId: 'mock-daily',
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
        totalXp: 190,
        level: 1,
        levelStepXp: 200,
        currentLevelXp: 190,
        nextLevelXp: 200,
        progress: 0.95,
      },
      progress: {
        questions: {
          solvedCount: 0,
          totalCount: 256,
          solvedPercent: 0,
          topTopics: [],
        },
        incidents: {
          passedCount: 0,
          totalCount: 0,
          passedPercent: 0,
        },
        practice: {
          completedCount: 0,
          totalCount: 256,
          completedPercent: 0,
        },
      },
      settings: {
        weeklyGoalEnabled: true,
        weeklyGoalTarget: 10,
        showStreakWidget: true,
        dailyChallengeTech: 'auto',
      },
    },
  };

  await installAuthMock(page, {
    token,
    user,
    validLogin: { emailOrUsername: user.email, password: 'secret123' },
  });

  await page.route(/\/api\/activity\/complete(?:\?.*)?$/, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: jsonHeaders() });
      return;
    }

    state.completionCalls += 1;
    user.solvedQuestionIds = [WEB_QUESTION.id];
    user.stats = {
      xpTotal: 200,
      completedTotal: 1,
      perTech: { html: { xp: 10, completed: 1 } },
      streak: { current: 1, longest: 1, lastActiveUTCDate: today },
    };
    state.summary = {
      totalXp: 200,
      level: 2,
      nextLevelXp: 400,
      levelProgress: { current: 0, needed: 200, pct: 0 },
      streak: { current: 1, best: 1 },
      freezeTokens: 0,
      weekly: { completed: 1, target: 10, progress: 0.1 },
      today: { completed: 1, total: 3, progress: 1 / 3 },
    };
    state.dashboard = {
      ...state.dashboard,
      weeklyGoal: {
        ...state.dashboard.weeklyGoal,
        completed: 1,
        progress: 0.1,
      },
      xpLevel: {
        totalXp: 200,
        level: 2,
        levelStepXp: 200,
        currentLevelXp: 0,
        nextLevelXp: 400,
        progress: 0,
      },
      progress: {
        ...state.dashboard.progress,
        questions: {
          ...state.dashboard.progress.questions,
          solvedCount: 1,
          solvedPercent: Math.round((1 / 256) * 100),
        },
        practice: {
          ...state.dashboard.progress.practice,
          completedCount: 1,
          completedPercent: Math.round((1 / 256) * 100),
        },
      },
    };

    await route.fulfill({
      status: 200,
      headers: jsonHeaders(),
      body: JSON.stringify({
        stats: user.stats,
        solvedQuestionIds: user.solvedQuestionIds,
        xpAwarded: 10,
        levelUp: true,
        logicalCompletionCreated: true,
        weeklyGoal: {
          completed: 1,
          target: 10,
          reached: false,
          bonusGranted: false,
        },
      }),
    });
  });

  await page.route(/\/api\/activity\/summary(?:\?.*)?$/, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: jsonHeaders() });
      return;
    }
    await route.fulfill({
      status: 200,
      headers: jsonHeaders(),
      body: JSON.stringify(state.summary),
    });
  });

  await page.route(/\/api\/dashboard(?:\?.*)?$/, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: jsonHeaders() });
      return;
    }
    await route.fulfill({
      status: 200,
      headers: jsonHeaders(),
      body: JSON.stringify(state.dashboard),
    });
  });

  await login(page, user.email);
  await page.goto(`/${WEB_QUESTION.tech}/coding/${WEB_QUESTION.id}`);
  await expect(page.getByTestId('coding-detail-page')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mark as complete' })).toBeVisible();

  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await page.getByRole('button', { name: 'Mark as complete' }).click();

  await expect(page.getByRole('button', { name: 'Syncing completion...' })).toBeVisible();
  await expect.poll(() => state.completionCalls).toBe(0);
  await expect
    .poll(() => page.evaluate(() => {
      try {
        const raw = localStorage.getItem('fa:activity:pending:v1');
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.length : 0;
      } catch {
        return 0;
      }
    }))
    .toBe(1);

  await page.evaluate(() => {
    window.dispatchEvent(new Event('online'));
    window.dispatchEvent(new Event('focus'));
  });

  await expect.poll(() => state.completionCalls).toBe(1);
  await expect(page.getByRole('button', { name: 'Mark as incomplete' })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => {
      try {
        const raw = localStorage.getItem('fa:activity:pending:v1');
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.length : 0;
      } catch {
        return 0;
      }
    }))
    .toBe(0);

  await page.goto('/dashboard');
  await expect(page.getByTestId('dashboard-page')).toBeVisible();
  await expect(page.getByText('1/10')).toBeVisible();
  await expect(page.getByText('Lv 2')).toBeVisible();
  await expect(page.getByText('200 XP to next')).toBeVisible();
});
