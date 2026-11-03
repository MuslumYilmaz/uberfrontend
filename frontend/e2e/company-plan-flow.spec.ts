import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Page } from '@playwright/test';
import { buildMockUser, installAuthMock } from './auth-mocks';
import { expect, test } from './fixtures';

// Five people through the company plan flow: form, preview, pricing, payment and the way back. The account, its plan
// and the checkout attempt are answered from memory, so nothing reaches a backend and no checkout ever opens.

type Answers = { companies: { slug: string; list?: string }[]; level: string; when: string };
type SavedPlan = Answers & { createdAt: string; passedRounds: string[]; markedDone: string[] };
type Account = { premium: boolean; plan: SavedPlan | null; solved: string[]; writes: Answers[] };

const PLAN_DATA = JSON.parse(readFileSync(resolve(__dirname, '../../cdn/questions/company-plan-data.json'), 'utf8'));

const newAccount = (overrides: Partial<Account> = {}): Account => ({ premium: false, plan: null, solved: [], writes: [], ...overrides });

const savedPlan = (answers: Answers): SavedPlan => ({ ...answers, createdAt: new Date().toISOString(), passedRounds: [], markedDone: [] });

async function signIn(page: Page, account: Account): Promise<void> {
  const user = () => ({
    ...buildMockUser({
      _id: 'e2e-plan-user',
      username: 'plan_user',
      email: 'plan@example.com',
      accessTier: account.premium ? 'premium' : 'free',
    }),
    entitlements: { pro: { status: account.premium ? 'active' : 'none', validUntil: null }, projects: { status: 'none', validUntil: null } },
    solvedQuestionIds: account.solved,
    companyPlan: account.plan,
  });
  await installAuthMock(page, {
    token: `e2e-token-plan-${Date.now()}`,
    user: user(),
    validLogin: { emailOrUsername: 'plan@example.com', password: 'secret123' },
  });
  // Registered after the auth mock, so these answer first and follow the account as it changes.
  await page.route('**/api/auth/me', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user()) }));
  await page.route('**/api/users/me/company-plan', async (route) => {
    const request = route.request();
    const body = request.postDataJSON();
    if (request.method() === 'PUT') {
      account.writes.push(body);
      account.plan = savedPlan(body);
    } else if (request.method() === 'PATCH' && account.plan) {
      const field = body.kind === 'round' ? 'passedRounds' : 'markedDone';
      const rest = account.plan[field].filter((id) => id !== body.id);
      account.plan = { ...account.plan, [field]: body.on ? [...rest, body.id] : rest };
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ companyPlan: account.plan }) });
  });
  await page.addInitScript(() => localStorage.setItem('fa:auth:session', '1'));
}

/** Lemon Squeezy sends the buyer back to the success page; the attempt reads as applied. */
async function mockPaidAttempt(page: Page, attemptId: string): Promise<void> {
  await page.route(/lemonsqueezy\.com/, (route) => route.abort());
  await page.route(/\/api\/billing\/checkout\/attempts\/[^/?]+\/client-state(?:\?.*)?$/, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  await page.route(/\/api\/billing\/checkout\/attempts\/[^/?]+\/status(?:\?.*)?$/, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      attemptId,
      provider: 'lemonsqueezy',
      planId: 'quarterly',
      mode: 'test',
      state: 'applied',
      rawStatus: 'applied',
      entitlementActive: true,
      accessTierEffective: 'premium',
      billingEventId: 'test:company-plan',
      lastErrorCode: null,
      lastErrorMessage: null,
      offerVersion: 'interview_sprint_v3',
      purchase: null,
    }),
  }));
}

/** Opens the picker, picks the companies and closes it, as a person does with Done. */
async function pickCompanies(page: Page, companies: string[]): Promise<void> {
  await page.getByTestId('company-plan-slot').click();
  for (const slug of companies) await page.getByTestId(`company-plan-option-${slug}`).click();
  await page.getByTestId('company-plan-picker').getByRole('button', { name: 'Done' }).click();
}

async function answerForm(page: Page, companies: string[], when: string, level: string): Promise<void> {
  await page.goto('/companies');
  await pickCompanies(page, companies);
  await page.getByTestId('company-plan-continue').click();
  await page.getByTestId(`company-plan-when-${when}`).click();
  await page.getByTestId(`company-plan-level-${level}`).click();
}

const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

test.describe('company plan, five people', () => {
  test('Ayşe, junior, Amazon tomorrow, on a phone: the same list as everyone, the student switch, three free tasks and the way to pricing', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await answerForm(page, ['amazon'], 'tomorrow', 'junior');

    await expect(page).toHaveURL('/companies/preview?companies=amazon&when=tomorrow&level=junior');
    await expect(page.getByRole('heading', { level: 1, name: 'Your Amazon plan at a glance' })).toBeVisible();
    const switchLine = page.getByTestId('company-plan-switch-line');
    await expect(switchLine).toContainText('These rounds come from experienced hires.');
    await expect(switchLine.getByRole('button', { name: 'Interviewing as a student or new graduate?' })).toBeVisible();
    await expect(page.getByTestId('company-plan-open-task')).toHaveCount(3);
    await expect(page.getByText('Coding tasks need a larger screen.')).toBeVisible();
    expect(await overflow(page)).toBe(0);

    await page.getByTestId('company-plan-build').click();
    await expect(page).toHaveURL('/pricing?src=company_plan_amazon');
    await expect(page.getByTestId('company-plan-pricing-strip')).toContainText('Your Amazon plan is waiting');
    expect(await overflow(page)).toBe(0);
  });

  test('Mehmet, senior, three companies this week, free account: the plan goes to the account and the plan page leads to its preview', async ({ page }) => {
    const account = newAccount();
    await signIn(page, account);
    await page.goto('/companies');
    await pickCompanies(page, ['netflix', 'openai', 'spotify']);
    await page.getByTestId('company-plan-continue').click();
    await expect(page.getByText('When is your first interview?')).toBeVisible();
    await page.getByTestId('company-plan-when-this-week').click();
    await page.getByTestId('company-plan-level-senior').click();

    const title = 'Your Netflix, OpenAI and Spotify plan at a glance';
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    await expect(page.getByTestId('company-plan-cta-note')).toHaveText('Saved to your account. Your plan is part of Premium, and you land on it right after payment.');
    expect(account.writes).toEqual([{ companies: [{ slug: 'netflix' }, { slug: 'openai' }, { slug: 'spotify' }], level: 'senior', when: 'this-week' }]);

    await page.goto('/companies/plan');
    await expect(page).toHaveURL('/companies/preview');
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    await expect(page.getByTestId('header-company-plan')).toBeVisible();
  });

  test('Elif, staff, GitLab later, Premium with a solved task: progress, a passed round and the way back from a task', async ({ page }) => {
    const solvedId: string = PLAN_DATA.companies.gitlab.variants[0].tasks[0].id;
    const account = newAccount({
      premium: true,
      plan: savedPlan({ companies: [{ slug: 'gitlab' }], level: 'staff', when: 'later' }),
      solved: [solvedId],
    });
    await signIn(page, account);
    await page.goto('/companies/plan');

    await expect(page.getByRole('heading', { level: 1, name: 'Welcome back to your GitLab plan' })).toBeVisible();
    await expect(page.locator(`#plan-task-${solvedId} [data-testid="company-plan-task-check"]`)).toBeDisabled();
    await expect(page.getByTestId('company-plan-progress')).toContainText('1 of ');

    // Found by name: once passed, the round has no tasks left to be found by.
    const rounds = page.getByTestId('company-plan-round');
    const name = await rounds.filter({ has: page.getByTestId('company-plan-task') }).last().locator('h3').innerText();
    const round = rounds.filter({ has: page.getByRole('heading', { level: 3, name, exact: true }) });
    await round.getByTestId('company-plan-round-pass').click();
    await expect(round.getByTestId('company-plan-round-pass')).toHaveText('Passed. Undo');
    await expect.poll(() => account.plan?.passedRounds.length).toBe(1);

    await page.getByTestId('company-plan-next').click();
    await expect(page.getByTestId('footer-left')).toContainText('Back to plan');
    await page.getByTestId('footer-left').click();
    await expect(page).toHaveURL('/companies/plan');
  });

  test('Can, mid-level, searches Facebook and Vercel: an alias finds Meta, and an unmapped company still gets free tasks', async ({ page }) => {
    await page.goto('/companies');
    await page.getByTestId('company-plan-slot').click();
    await page.locator('#company-plan-search').fill('Facebook');
    await page.getByTestId('company-plan-option-meta').click();
    await page.getByTestId('company-plan-picker').getByRole('button', { name: 'Done' }).click();
    await page.getByTestId('company-plan-continue').click();
    await page.getByTestId('company-plan-when-later').click();
    await page.getByTestId('company-plan-level-mid').click();
    await expect(page.getByRole('heading', { level: 1, name: 'Your Meta plan at a glance' })).toBeVisible();

    await page.goto('/companies');
    await page.getByTestId('company-plan-slot').click();
    await page.locator('#company-plan-search').fill('Vercel');
    await page.getByTestId('company-plan-custom').click();
    await page.getByTestId('company-plan-continue').click();
    await page.getByTestId('company-plan-when-later').click();
    await page.getByTestId('company-plan-level-mid').click();

    await expect(page.getByRole('heading', { level: 1, name: 'We have not mapped Vercel yet' })).toBeVisible();
    await expect(page.getByTestId('company-plan-rest-task')).toHaveCount(0);
    await page.getByTestId('company-plan-start-first').click();
    await expect(page.getByTestId('footer-left')).toContainText('Back to plan');
  });

  test('Zeynep, mid-level, Agoda in Gurgaon: switches the list, signs up, pays and finds the plan the next day', async ({ page }) => {
    await answerForm(page, ['agoda'], 'next-week', 'mid');
    await expect(page.getByTestId('company-plan-warning').first()).toContainText('No report from a mid-level candidate at Agoda');
    await page.getByTestId('company-plan-switch-line').getByRole('button').click();
    await expect(page).toHaveURL(/lists=agoda(:|%3A)gurgaon/);
    await page.getByTestId('company-plan-build').click();
    await expect(page).toHaveURL('/pricing?src=company_plan_agoda');
    await expect(page.getByTestId('company-plan-pricing-strip')).toContainText('Your Agoda plan is waiting');

    // Signs up: the plan started as a guest moves to the new account.
    const account = newAccount();
    await signIn(page, account);
    await page.reload();
    await expect.poll(() => account.plan?.companies).toEqual([{ slug: 'agoda', list: 'gurgaon' }]);

    // Pays, and Lemon Squeezy sends her back.
    account.premium = true;
    await mockPaidAttempt(page, 'chk_e2e_company_plan');
    await page.goto('/billing/success?attempt=chk_e2e_company_plan');
    await expect(page).toHaveURL('/companies/plan');
    await expect(page.getByRole('heading', { level: 1, name: 'Your Agoda plan is ready' })).toBeVisible();
    const gurgaon = PLAN_DATA.companies.agoda.variants.find((list: { id: string }) => list.id === 'gurgaon').title;
    await expect(page.locator('.plan-company__meta')).toContainText(gurgaon);

    // The next day on another device: nothing in the browser, the plan on the account.
    await page.evaluate(() => {
      localStorage.removeItem('fa:company-plan:draft:v1');
      sessionStorage.clear();
    });
    await page.goto('/companies');
    await expect(page.getByTestId('company-plan-resume')).toContainText('Continue your Agoda plan');
    await page.getByTestId('company-plan-resume-open').click();
    await expect(page).toHaveURL('/companies/plan');
  });
});
