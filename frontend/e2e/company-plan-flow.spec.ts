import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Page } from '@playwright/test';
import { buildMockUser, installAuthMock } from './auth-mocks';
import { expect, test } from './fixtures';
import { COMPANY_INTERVIEW_PROCESSES } from '../src/app/shared/company-previews/company-interview-processes';

// Five people through the company plan flow: form, preview, pricing, payment and the way back. The account, its plan
// and the checkout attempt are answered from memory, so nothing reaches a backend and no checkout ever opens.

type Answers = { companies: { slug: string; list?: string }[]; level: string; when: string; passedRounds?: string[] };
type SavedPlan = Answers & { createdAt: string; passedRounds: string[]; markedDone: string[] };
type Account = { premium: boolean; plan: SavedPlan | null; solved: string[]; writes: Answers[] };

const PLAN_DATA = JSON.parse(readFileSync(resolve(__dirname, '../../cdn/questions/company-plan-data.json'), 'utf8'));

const newAccount = (overrides: Partial<Account> = {}): Account => ({ premium: false, plan: null, solved: [], writes: [], ...overrides });

// The backend keeps the rounds the form stated as passed (services/company-plan.js); so does this stand-in.
const savedPlan = (answers: Answers): SavedPlan => ({
  ...answers,
  createdAt: new Date().toISOString(),
  passedRounds: Array.isArray(answers.passedRounds) ? answers.passedRounds : [],
  markedDone: [],
});

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

/** Fills the form; `next` names the round that is next per company, else every plan starts from its first round. */
async function answerForm(page: Page, companies: string[], when: string, level: string, next: Record<string, string> = {}): Promise<void> {
  await page.goto('/companies');
  await pickCompanies(page, companies);
  await page.getByTestId('company-plan-continue').click();
  await page.getByTestId(`company-plan-when-${when}`).click();
  await page.getByTestId(`company-plan-level-${level}`).click();
  await answerNextRound(page, companies, next);
}

/** The fourth step: with one company the round clicked finishes the form; with several, the button does. */
async function answerNextRound(page: Page, companies: string[], next: Record<string, string> = {}): Promise<void> {
  await expect(page.getByTestId('company-plan-next-step')).toBeVisible();
  for (const [slug, round] of Object.entries(next)) await page.getByTestId(`company-plan-next-${slug}-${round}`).click();
  if (companies.length > 1 || !Object.keys(next).length) await page.getByTestId('company-plan-see-plan').click();
}

const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

test.describe('company plan, five people', () => {
  test('Ayşe, junior, Amazon tomorrow, on a phone: the same list as everyone, the student switch, three free tasks and the way to pricing', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    // She passed the online assessment, so the plan starts at the phone screen.
    await answerForm(page, ['amazon'], 'tomorrow', 'junior', { amazon: 'phone-screen' });

    await expect(page).toHaveURL('/companies/preview?companies=amazon&when=tomorrow&level=junior&passed=amazon%2Fexperienced%2Fonline-assessment');
    await expect(page.getByRole('heading', { level: 1, name: 'Your Amazon plan at a glance' })).toBeVisible();
    await expect(page.locator('.preview__chip', { hasText: 'From the Phone screen' })).toBeVisible();
    await expect(page.getByTestId('company-plan-rest-task').filter({ hasText: 'Online assessment' })).toHaveCount(0);
    await expect(page.getByTestId('company-plan-panel')).toContainText(/\d of \d reported rounds left/);
    const switchLine = page.getByTestId('company-plan-switch-line');
    await expect(switchLine).toContainText('These rounds come from experienced hires.');
    await expect(switchLine.getByRole('button', { name: 'Interviewing as a student or new graduate?' })).toBeVisible();
    await expect(page.getByTestId('company-plan-open-task')).toHaveCount(3);
    const phoneNote = page.getByTestId('company-plan-phone-note');
    await expect(phoneNote).toContainText('Tonight on a phone, read the Amazon guide: its rounds and its open reported question.');
    await expect(phoneNote).toContainText(/Premium also opens its other \d+ reported questions there, readable on this phone tonight\./);
    await expect(phoneNote.getByRole('link', { name: 'Read the Amazon guide' })).toHaveAttribute('href', '/companies/amazon/preview');
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
    await expect(page.getByRole('heading', { level: 2, name: 'Which round is next at each company?' })).toBeVisible();
    await answerNextRound(page, ['netflix', 'openai', 'spotify']);

    const title = 'Your Netflix, OpenAI and Spotify plan at a glance';
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    await expect(page.getByTestId('company-plan-cta-note')).toHaveText(/^Saved to your account\. \d+ of \d+ tasks are open now\. Premium opens (the locked one|the \d+ locked ones) and your plan page, and you land on it right after payment\.$/);
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
    await answerNextRound(page, ['meta']);
    await expect(page.getByRole('heading', { level: 1, name: 'Your Meta plan at a glance' })).toBeVisible();

    await page.goto('/companies');
    await page.getByTestId('company-plan-slot').click();
    await page.locator('#company-plan-search').fill('Vercel');
    await page.getByTestId('company-plan-custom').click();
    await page.getByTestId('company-plan-continue').click();
    await page.getByTestId('company-plan-when-later').click();
    await page.getByTestId('company-plan-level-mid').click();

    // An unlisted company has no rounds to ask about, so the level is the last answer.
    await expect(page.getByRole('heading', { level: 1, name: 'We have not mapped Vercel yet' })).toBeVisible();
    await expect(page.getByTestId('company-plan-rest-task')).toHaveCount(0);
    await page.getByTestId('company-plan-start-first').click();
    await expect(page.getByTestId('footer-left')).toContainText('Back to plan');
  });

  test('Zeynep, mid-level, Agoda in Gurgaon: switches the list, signs up, pays and finds the plan the next day', async ({ page }) => {
    await answerForm(page, ['agoda'], 'next-week', 'mid');
    await expect(page.getByTestId('company-plan-warning').first()).toContainText('None of the accounts behind these rounds comes from a mid-level candidate');
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

test.describe('company plan from a company guide', () => {
  test('Deniz reads the ElevenLabs guide on a phone: the card above it opens the form at the date, with ElevenLabs picked', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/companies/elevenlabs/preview');
    const card = page.getByTestId('company-plan-entry');
    await expect(card).toContainText('Interviewing at ElevenLabs?');
    expect(await overflow(page)).toBe(0);

    // The reported questions replace the prompts: the first is open, the others show their round under a lock, and
    // the offer in the list leads into the same plan.
    const rows = page.getByTestId('company-question-row');
    await expect(rows.first().locator('h3')).toBeVisible();
    await expect(rows.first()).not.toHaveClass(/cq-row--locked/);
    await expect(rows.nth(1)).toHaveClass(/cq-row--locked/);
    await expect(rows.nth(1).locator('.cq-row__round')).toBeVisible();
    await expect(page.getByTestId('company-question-offer').getByRole('link', { name: 'Build my ElevenLabs plan first' }))
      .toHaveAttribute('href', '/companies?company=elevenlabs');

    await card.getByRole('link', { name: 'Build my ElevenLabs plan' }).click();
    await expect(page).toHaveURL('/companies?company=elevenlabs');
    await expect(page.getByRole('heading', { level: 2, name: 'When is your interview?' })).toBeVisible();
    await expect(page.locator('.plan-step').first()).toContainText('ElevenLabs');
    expect(await overflow(page)).toBe(0);

    await page.getByTestId('company-plan-when-next-week').click();
    await page.getByTestId('company-plan-level-senior').click();
    await answerNextRound(page, ['elevenlabs']);
    await expect(page).toHaveURL('/companies/preview?companies=elevenlabs&when=next-week&level=senior');
    await expect(page.getByRole('heading', { level: 1, name: 'Your ElevenLabs plan at a glance' })).toBeVisible();

    // Deniz builds in Angular, the framework they use: the plan says whose choice it is and the address keeps it.
    const frameworkLine = page.getByTestId('company-plan-framework-line');
    await expect(frameworkLine).toContainText('UI tasks follow React, the framework in the reports.');
    await frameworkLine.getByRole('button', { name: 'Use Angular' }).click();
    await expect(page).toHaveURL('/companies/preview?companies=elevenlabs&when=next-week&level=senior&framework=angular');
    await expect(page.locator('.preview__chip', { hasText: 'Angular, your choice' })).toBeVisible();
    await expect(frameworkLine).toContainText('Tasks with an Angular version, and the extra practice, follow Angular, your choice; the rest stay as reported.');
    expect(await overflow(page)).toBe(0);
  });

  test('Gizem builds a plan as a guest and signs in on the way back: the sign-up page names her plan, and the preview says it is saved', async ({ page }) => {
    // The account exists but nobody is signed in: the session starts at the login form, as it does for a visitor.
    const account = newAccount();
    await installAuthMock(page, {
      token: `e2e-token-plan-guest-${Date.now()}`,
      user: {
        ...buildMockUser({ _id: 'e2e-plan-guest', username: 'plan_guest', email: 'guest@example.com', accessTier: 'free' }),
        entitlements: { pro: { status: 'none', validUntil: null }, projects: { status: 'none', validUntil: null } },
        solvedQuestionIds: [],
        companyPlan: null,
      },
      validLogin: { emailOrUsername: 'guest@example.com', password: 'secret123' },
    });
    await page.route('**/api/users/me/company-plan', async (route) => {
      const request = route.request();
      if (request.method() === 'PUT') {
        account.writes.push(request.postDataJSON());
        account.plan = savedPlan(request.postDataJSON());
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ companyPlan: account.plan }) });
    });

    await answerForm(page, ['agoda'], 'next-week', 'mid');
    const planUrl = '/companies/preview?companies=agoda&when=next-week&level=mid';
    await expect(page).toHaveURL(planUrl);
    const saveLine = page.getByTestId('company-plan-save-line');
    await expect(saveLine).toContainText('It keeps your plan and your progress on every device.');
    await saveLine.getByRole('link', { name: 'Save this plan with a free account' }).click();
    await expect(page).toHaveURL(/\/auth\/signup\?redirectTo=%2Fcompanies%2Fpreview/);
    await expect(page.getByTestId('signup-plan-note')).toHaveText('Your Agoda plan will be saved to this account.');

    // She already has an account: the sign-in page keeps the way back and the plan's name.
    await page.getByTestId('signup-link-login').click();
    await expect(page.getByTestId('login-plan-note')).toHaveText('Your Agoda plan will be saved to your account.');
    await page.getByTestId('login-email').fill('guest@example.com');
    await page.getByTestId('login-password').fill('secret123');
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL(planUrl);
    await expect(page.getByTestId('company-plan-cta-note')).toHaveText(/^Saved to your account\. \d+ of \d+ tasks are open now\. Premium opens (the locked one|the \d+ locked ones) and your plan page, and you land on it right after payment\.$/);
    await expect(page.getByTestId('company-plan-save-line')).toHaveCount(0);
    expect(account.writes).toEqual([{ companies: [{ slug: 'agoda' }], level: 'mid', when: 'next-week' }]);
  });

  test('Deniz opens a Premium task from the plan on a phone: the locked page says what a phone gets and leads back to the plan', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await answerForm(page, ['elevenlabs'], 'next-week', 'senior');
    const planUrl = '/companies/preview?companies=elevenlabs&when=next-week&level=senior';
    await expect(page).toHaveURL(planUrl);

    const locked = page.locator('[data-testid="company-plan-rest-task"].plan-row--locked[href*="/coding/"]').first();
    await expect(locked).toBeVisible();
    await locked.click();
    await expect(page).toHaveURL(/\/coding\//);
    await expect(page.getByTestId('coding-locked-phone-note'))
      .toHaveText('On a phone this task opens as a question with its solution; the workspace is on a desktop or tablet.');
    expect(await overflow(page)).toBe(0);

    const back = page.getByTestId('coding-locked-return');
    await expect(back).toHaveText('Back to plan');
    await back.click();
    await expect(page).toHaveURL(planUrl);
    await expect(page.getByRole('heading', { level: 1, name: 'Your ElevenLabs plan at a glance' })).toBeVisible();
  });

  test('a guest on the Airbnb guide reads the open first question, sees the others locked with their topics, and is led into the plan', async ({ page }) => {
    await page.goto('/companies/airbnb/preview');
    // The process stays open; only the name of the Premium practice page in it is blurred.
    await expect(page.getByTestId('company-interview-process')).toContainText('React autocomplete search');
    await expect(page.locator('.interview-process__locked')).toHaveCount(1);
    await expect(page.locator('[data-testid="company-prep-steps"] .company-locked').first()).toHaveAttribute('inert', '');
    const list = page.getByTestId('company-question-list');
    await expect(list.locator('.cq-row').first()).toContainText('Card game UI');
    await expect(list.locator('.cq-row__question.premium-locked').first()).toHaveAttribute('data-nosnippet', '');
    await page.getByTestId('company-question-offer').getByRole('link', { name: 'Build my Airbnb plan first' }).click();
    await expect(page).toHaveURL('/companies?company=airbnb');
  });

  test('the same address loaded on its own hydrates the first step, then opens at the date', async ({ page }) => {
    await page.goto('/companies?company=agoda');
    await expect(page.getByRole('heading', { level: 2, name: 'When is your interview?' })).toBeVisible();
    await expect(page.locator('.plan-step').first()).toContainText('Agoda');
  });

  test('Ece, a Premium member, reads the Agoda guide: the card leads back to the plan, and nothing asks to unlock', async ({ page }) => {
    await signIn(page, newAccount({ premium: true, plan: savedPlan({ companies: [{ slug: 'agoda' }], when: 'later', level: 'mid' }) }));
    await page.goto('/companies/agoda/preview');
    await expect(page).toHaveURL('/companies/agoda/preview');
    const card = page.getByTestId('company-plan-entry');
    await expect(card).toContainText('Continue your Agoda plan');
    await expect(card).toContainText(/Later or no date · Mid-level · 0 of \d+ solved/);
    await expect(page.locator('.preview-chip', { hasText: 'Full practice set requires Premium' })).toBeHidden();
    await expect(page.getByRole('link', { name: 'Unlock the full Agoda practice set' })).toBeHidden();
    const set = page.getByTestId('company-set-entry');
    await expect(set).toContainText(/The FrontendAtlas Agoda practice set: \d+ questions/);
    await expect(set.getByRole('link', { name: 'Open the Agoda set' })).toHaveAttribute('href', '/companies/agoda/all');
    // The question list opens every question to a member and makes no offer.
    await expect(page.getByTestId('company-question-offer')).toHaveCount(0);
    await expect(page.locator('.cq-row--locked')).toHaveCount(0);

    const sidebarPlan = page.getByTestId('sidebar-company-plan');
    await expect(sidebarPlan).toContainText('Your Agoda plan');
    await expect(sidebarPlan).toContainText(/0 of \d+ solved/);
    await expect(page.getByTestId('sidebar-company-plan-next')).toHaveAttribute('href', /^\/(javascript|react|angular|vue|html|css|system-design|guides)\//);

    await card.getByRole('link', { name: 'Open my plan' }).click();
    await expect(page).toHaveURL('/companies/plan');
    await expect(page.getByRole('heading', { level: 1, name: 'Your Agoda plan is ready' })).toBeVisible();
  });

  // Every guide shows the reported-question list: the rounds, the first question and the source names are open, the
  // source links open with a free account and the other questions with Premium.
  test('Ferhat reads the Meta guide: a visitor gets the rounds, the first question and the source names, a free account the source links', async ({ page }) => {
    await page.goto('/companies/meta/preview');
    const process = page.getByTestId('company-interview-process');
    await expect(process.locator('.interview-process__reporter').first()).toBeVisible();
    await expect(process.locator('a[href^="http"]')).toHaveCount(0);
    const list = page.getByTestId('company-question-list');
    await expect(list.locator('.cq-row__question.premium-locked').first()).toHaveAttribute('data-nosnippet', '');
    const sources = page.getByTestId('company-guide-sources');
    await expect(sources.getByTestId('company-guide-sources-gate')).toContainText('The links open with a free account.');
    await expect(sources.locator('a[href^="http"]')).toHaveCount(0);

    await signIn(page, newAccount());
    await page.goto('/companies/meta/preview');
    await expect(sources.getByTestId('company-guide-sources-gate')).toHaveCount(0);
    await expect(sources.locator('a[href^="http"]').first()).toBeAttached();
    // The other questions stay locked for a free account.
    await expect(list.locator('.cq-row__question.premium-locked').first()).toBeAttached();
    expect(await overflow(page)).toBe(0);
  });

  test('Selin, with a free account and one task solved, sees on the ElevenLabs guide how many of its practice tasks are solved', async ({ page }) => {
    // The plan's task ids: a question by its id, a guide by its route.
    const taskId = (path: string) => (path.startsWith('/guides/') ? path : path.slice(path.lastIndexOf('/') + 1));
    const questions = COMPANY_INTERVIEW_PROCESSES['elevenlabs'].questions ?? [];
    const tasks = [...new Set(questions.flatMap((question) => (question.practice ? [taskId(question.practice.path)] : [])))];
    const rowsWithTask = questions.filter((question) => question.practice && taskId(question.practice.path) === tasks[0]).length;
    await signIn(page, newAccount({ solved: [tasks[0]] }));
    await page.goto('/companies/elevenlabs/preview');
    const list = page.getByTestId('company-question-list');
    await expect(list.getByTestId('company-question-progress')).toHaveText(`Your ElevenLabs prep: 1 of the ${tasks.length} practice tasks in this list solved`);
    await expect(list.getByTestId('company-question-solved')).toHaveCount(rowsWithTask);
    expect(await overflow(page)).toBe(0);
  });

  test('Hande drills a Meta behavioural question on a phone: her story survives a reload, and each question keeps its own', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/companies/meta/preview');
    const drill = page.getByTestId('behavioral-drill');
    await drill.scrollIntoViewIfNeeded();
    // The behavioural questions are open, so a visitor picks any of them.
    await expect(drill.getByTestId('behavioral-drill-question-disagreement')).toBeChecked();
    await expect(drill.getByTestId('behavioral-drill-question-criticism')).toBeEnabled();

    await drill.getByTestId('behavioral-drill-situation').fill('Design and I disagreed on the checkout error states a week before launch.');
    await drill.getByTestId('behavioral-drill-action').fill('We met, we listed the cases and our designer drew them.');
    await expect(drill.getByTestId('behavioral-drill-notes')).toContainText('say what you did');
    await drill.getByTestId('behavioral-drill-check-0').check();
    expect(await overflow(page)).toBe(0);

    // The story is read back once the page is in the browser, after a reload too.
    await page.reload();
    await expect(drill.getByTestId('behavioral-drill-situation')).toHaveValue('Design and I disagreed on the checkout error states a week before launch.');
    await expect(drill.getByTestId('behavioral-drill-check-0')).toBeChecked();

    await drill.getByTestId('behavioral-drill-question-criticism').check();
    await expect(drill.getByTestId('behavioral-drill-asked')).toContainText('criticism you received');
    await expect(drill.getByTestId('behavioral-drill-situation')).toHaveValue('');
    await drill.getByTestId('behavioral-drill-question-disagreement').check();
    await expect(drill.getByTestId('behavioral-drill-situation')).toHaveValue('Design and I disagreed on the checkout error states a week before launch.');
  });
});
