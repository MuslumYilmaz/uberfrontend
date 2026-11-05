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
    await expect(phoneNote).toContainText('Tonight on a phone, read the Amazon guide: its rounds and open prompts.');
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

test.describe('company plan from a company guide', () => {
  test('Deniz reads the ElevenLabs guide on a phone: the card above it opens the form at the date, with ElevenLabs picked', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/companies/elevenlabs/preview');
    const card = page.getByTestId('company-plan-entry');
    await expect(card).toContainText('Interviewing at ElevenLabs?');
    expect(await overflow(page)).toBe(0);

    // The first three prompts are open; the fourth keeps its title and opening, and its details sit under a blur.
    const gate = page.getByTestId('company-prompt-gate');
    await expect(gate).toContainText('The answer guides for prompts 4 and 5 are in Premium');
    await expect(gate.getByRole('link', { name: 'Build my ElevenLabs plan' })).toHaveAttribute('href', '/companies?company=elevenlabs');
    const prompts = page.locator('.company-prompt');
    await expect(prompts.nth(2).locator('.company-prompt__details')).not.toHaveAttribute('inert', /.*/);
    await expect(prompts.nth(3).locator('h3')).toBeVisible();
    await expect(prompts.nth(3).locator('.company-prompt__details')).toHaveAttribute('inert', '');

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
    await expect(frameworkLine).toContainText('UI tasks and extra practice follow Angular, your choice; the reported JavaScript tasks stay as reported.');
    expect(await overflow(page)).toBe(0);
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

  test('a guest on the Airbnb guide reads the free questions, sees Premium names only under a blur, and is led into the plan', async ({ page }) => {
    await page.goto('/companies/airbnb/preview');
    // The process stays open; only the name of a Premium practice page is blurred.
    await expect(page.getByTestId('company-interview-process')).toContainText('Explain closures');
    await expect(page.locator('.interview-process__locked')).toHaveCount(1);
    await expect(page.locator('[data-testid="company-prep-steps"] .company-locked').first()).toHaveAttribute('inert', '');
    await expect(page.getByTestId('company-preview-question-js-closures')).toContainText('Explain Closures in JavaScript');
    await expect(page.locator('.sample-list .fa-question-row__concealed').first()).toBeVisible();
    const gate = page.getByTestId('company-sample-gate');
    await expect(gate).toContainText('The locked questions open with Premium');
    await gate.getByRole('link', { name: 'Build my Airbnb plan' }).click();
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
    await expect(set).toContainText(/The full Agoda set: \d+ questions/);
    await expect(set.getByRole('link', { name: 'Open the Agoda set' })).toHaveAttribute('href', '/companies/agoda/all');
    await expect(page.getByTestId('company-prompt-gate')).toHaveCount(0);
    await expect(page.locator('.company-prompt--locked')).toHaveCount(0);

    const sidebarPlan = page.getByTestId('sidebar-company-plan');
    await expect(sidebarPlan).toContainText('Your Agoda plan');
    await expect(sidebarPlan).toContainText(/0 of \d+ solved/);
    await expect(page.getByTestId('sidebar-company-plan-next')).toHaveAttribute('href', /^\/(javascript|react|angular|vue|html|css|system-design|guides)\//);

    await card.getByRole('link', { name: 'Open my plan' }).click();
    await expect(page).toHaveURL('/companies/plan');
    await expect(page.getByRole('heading', { level: 1, name: 'Your Agoda plan is ready' })).toBeVisible();
  });

  test('Ferhat reads the Google guide behind the account gate: a visitor gets the lead-in, a free account the rounds and sources, Premium the answer guides', async ({ page }) => {
    // As a visitor: every round in full with its counts but no evidence links, and the first prompt; two gates to a free account.
    await page.goto('/companies/google/preview');
    const process = page.getByTestId('company-interview-process');
    await expect(process.locator('.premium-locked')).toHaveCount(0);
    await expect(process.locator('.interview-process__sources')).toHaveCount(0);
    await expect(process.locator('.interview-process__strength').first()).toBeVisible();
    await expect(process.locator('.interview-process__tag').first()).toHaveText('Free account');
    const processGate = page.getByTestId('company-process-gate');
    await expect(processGate).toContainText('The sources behind each round open with a free account');
    await expect(processGate.getByRole('link', { name: 'Create a free account' })).toHaveAttribute('href', /^\/auth\/signup\?redirectTo=%2Fcompanies%2Fgoogle%2Fpreview/);
    await expect(processGate.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', /^\/auth\/login\?redirectTo=/);
    const prompts = page.locator('.company-prompt');
    await expect(prompts.nth(0).locator('.company-prompt__details')).not.toHaveAttribute('inert', /.*/);
    await expect(prompts.nth(1).locator('.company-prompt__statement .premium-locked')).toHaveAttribute('data-nosnippet', '');
    await expect(prompts.nth(1).locator('.company-prompt__details')).toHaveAttribute('inert', '');
    await expect(page.getByTestId('company-prompt-gate')).toContainText(/Prompts 2 to \d+ open with a free account/);

    // As a free account: every round and source, every prompt statement; the answer guides past the first wait for Premium.
    await signIn(page, newAccount());
    await page.goto('/companies/google/preview');
    await expect(page.getByTestId('company-process-gate')).toHaveCount(0);
    await expect(process.locator('.interview-process__tag')).toHaveCount(0);
    // A stacked table keeps each row's sources behind "Show the sources"; a wide one shows them at once.
    await expect(process.locator('.interview-process__sources').first()).toBeAttached();
    const sourcesToggle = process.locator('.interview-process__toggle').first();
    if (await sourcesToggle.isVisible()) {
      await expect(async () => {
        await sourcesToggle.click();
        await expect(sourcesToggle).toHaveAttribute('aria-expanded', 'true', { timeout: 1000 });
      }).toPass();
    }
    await expect(process.locator('.interview-process__sources a').first()).toBeVisible();
    await expect(prompts.nth(1).locator('.company-prompt__statement .premium-locked')).toHaveCount(0);
    await expect(prompts.nth(1).locator('.company-prompt__details')).toHaveAttribute('inert', '');
    await expect(page.getByTestId('company-prompt-gate')).toContainText(/The answer guides for prompts 2 to \d+ are in Premium/);
    expect(await overflow(page)).toBe(0);
  });
});
