import AxeBuilder from '@axe-core/playwright';
import type {
  APIResponse,
  BrowserContext,
  Locator,
  Page,
  Response,
} from '@playwright/test';
import { expect, test } from './fixtures';

type CapturedInterviewResponse = {
  body: unknown;
  method: string;
  path: string;
  requestAction: string;
  status: number;
};

const runFullStack = process.env.E2E_INTERVIEW_FULLSTACK === '1';
const SERIOUS_AXE_IMPACTS = new Set(['serious', 'critical']);
const NEVER_PUBLIC_FIELDS = new Set([
  'answerKey',
  'answerProof',
  'optionRationales',
  'codingPrivate',
  'privateTests',
  'hiddenTests',
  'referenceSolution',
  'correctAnswer',
  'correctAnswerId',
  'systemDesignPrivate',
  'sourceEvidence',
  'finalApproval',
  'definitionHash',
  'selectionDefinitionHash',
  'conceptId',
  'review',
]);
const RESULT_ONLY_FEEDBACK_FIELDS = new Set([
  'correctOptionId',
  'explanation',
  'selectedOptionExplanation',
  'remediationTopics',
  'rubric',
]);

function assertLocalTarget(baseURL: string | undefined): string {
  const resolved = new URL(baseURL || 'http://127.0.0.1:4237');
  expect(['127.0.0.1', 'localhost']).toContain(resolved.hostname);
  return resolved.origin;
}

function resolveLocalApiTarget(): string {
  const resolved = new URL(
    process.env.E2E_INTERVIEW_API_BASE || 'http://127.0.0.1:3001',
  );
  expect(['127.0.0.1', 'localhost']).toContain(resolved.hostname);
  return resolved.origin;
}

function isInterviewApiResponse(response: Response): boolean {
  const url = new URL(response.url());
  return url.pathname.startsWith('/api/interviews');
}

function collectFieldPaths(
  value: unknown,
  names: ReadonlySet<string>,
  path = '$',
  matches: string[] = [],
): string[] {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectFieldPaths(entry, names, `${path}[${index}]`, matches));
    return matches;
  }
  if (!value || typeof value !== 'object') return matches;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const childPath = `${path}.${key}`;
    if (names.has(key)) matches.push(childPath);
    collectFieldPaths(child, names, childPath, matches);
  }
  return matches;
}

function expectNoPrivateArtifactFields(payload: unknown, label: string): void {
  expect(
    collectFieldPaths(payload, NEVER_PUBLIC_FIELDS),
    `${label} exposed private artifact fields`,
  ).toEqual([]);
}

function expectNoEarlyAnswerFeedback(payload: unknown, label: string): void {
  expect(
    collectFieldPaths(payload, RESULT_ONLY_FEEDBACK_FIELDS),
    `${label} exposed answer feedback before results`,
  ).toEqual([]);
}

function captureInterviewResponses(
  page: Page,
  captures: Array<Promise<CapturedInterviewResponse>>,
): void {
  page.on('response', (response) => {
    if (!isInterviewApiResponse(response)) return;
    captures.push((async () => {
      let body: unknown = null;
      try {
        body = await response.json();
      } catch {
        body = null;
      }
      return {
        body,
        method: response.request().method(),
        path: new URL(response.url()).pathname,
        requestAction: checkRunAction(response),
        status: response.status(),
      };
    })());
  });
}

async function completeSignupNavigation(page: Page): Promise<void> {
  const dashboard = page.getByTestId('dashboard-page');
  const verificationFallback = page.getByTestId('signup-verification-continue');
  await expect(dashboard.or(verificationFallback).first()).toBeVisible({ timeout: 30_000 });
  if (await verificationFallback.isVisible()) await activateWithKeyboard(verificationFallback);
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
  await expect(dashboard).toBeVisible();
}

async function responseJson(response: APIResponse | Response): Promise<any> {
  return response.json();
}

function csrfCookie(contextCookies: Awaited<ReturnType<BrowserContext['cookies']>>) {
  return contextCookies.find((cookie) => cookie.name === 'csrf_token');
}

async function expectNoSeriousViolations(
  page: Page,
  root: string,
  label: string,
): Promise<void> {
  const results = await new AxeBuilder({ page })
    .include(root)
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  const violations = results.violations.filter((violation) => (
    SERIOUS_AXE_IMPACTS.has(String(violation.impact || ''))
  ));
  expect(
    violations,
    `${label}: ${violations.map((violation) => violation.id).join(', ')}`,
  ).toEqual([]);
}

async function activateWithKeyboard(locator: Locator): Promise<void> {
  await locator.focus();
  await expect(locator).toBeFocused();
  await locator.press('Enter');
}

async function chooseRadioWithKeyboard(locator: Locator): Promise<void> {
  await locator.focus();
  await expect(locator).toBeFocused();
  await locator.press('Space');
  await expect(locator).toBeChecked();
}

async function appendToActiveCodeEditor(page: Page, marker: string): Promise<void> {
  const fallback = page.locator('.editor-shell textarea.editor-fallback');
  const monacoSurface = page
    .locator('.editor-shell app-monaco-editor .monaco-editor')
    .first();
  await expect(fallback.or(monacoSurface).first()).toBeVisible({ timeout: 30_000 });

  if (await fallback.isVisible()) {
    await fallback.focus();
    await expect(fallback).toBeFocused();
  } else {
    const monacoInput = page
      .locator('.editor-shell app-monaco-editor textarea.inputarea')
      .first();
    await monacoSurface.click();
    await expect(monacoInput).toBeFocused();
  }

  await page.keyboard.press('ControlOrMeta+End');
  await page.keyboard.insertText(`\n// ${marker}`);
}

function checkRunAction(response: Response): string {
  try {
    return String(response.request().postDataJSON()?.action || '');
  } catch {
    return '';
  }
}

test.describe('Interview Mode real Angular → Express → Mongo lifecycle', () => {
  test.describe.configure({ mode: 'serial' });
  test.use({
    realBackendRequests: true,
    // The owned runner deliberately has no SMTP credentials. Signup degrades
    // to the explicit verification fallback while Interview/auth cookies stay
    // real; keep every other browser error fatal.
    consoleErrorAllowlist: [
      '\/api\/auth\/email-verification\/request',
      'downloadable font: rejected by sanitizer .*Inter-roman\\.var\\.woff2',
    ],
  });
  test.skip(
    !runFullStack,
    'Real Interview full-stack E2E is disabled (set E2E_INTERVIEW_FULLSTACK=1).',
  );

  test('uses real signup cookies and CSRF, persists MCQ/coding state, and reveals answers only in results', async ({
    page,
    context,
    baseURL,
  }) => {
    test.setTimeout(180_000);
    assertLocalTarget(baseURL);
    const apiOrigin = resolveLocalApiTarget();
    // Point the real Angular service layer at the owned Express process. This
    // is a runtime base override, not request interception or response mocking.
    await page.addInitScript((origin) => {
      (window as any).__FA_API_BASE__ = origin;
    }, apiOrigin);
    await page.setViewportSize({ width: 1366, height: 900 });

    const captures: Array<Promise<CapturedInterviewResponse>> = [];
    const mutationHeaders: Array<{ path: string; csrf: string | undefined }> = [];
    captureInterviewResponses(page, captures);
    page.on('request', (request) => {
      const path = new URL(request.url()).pathname;
      if (
        path.startsWith('/api/interviews')
        && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())
      ) {
        mutationHeaders.push({
          path,
          csrf: request.headers()['x-csrf-token'],
        });
      }
    });

    const health = await context.request.get(`${apiOrigin}/api/health`);
    expect(health.status()).toBe(200);
    const interviewHealth = await context.request.get(`${apiOrigin}/api/health/interview`);
    expect(interviewHealth.status()).toBe(200);
    expect(await responseJson(interviewHealth)).toEqual(expect.objectContaining({
      ok: true,
      launchReady: true,
      accessMode: 'public',
      operationalState: 'normal',
      systemDesignRequired: false,
      artifacts: expect.objectContaining({
        coding: expect.objectContaining({ ready: true }),
        systemDesign: expect.objectContaining({ status: 'not-required' }),
      }),
      dependencies: expect.objectContaining({
        redisRateLimit: expect.objectContaining({ configured: true, ready: true }),
        monitoring: expect.objectContaining({ ready: true }),
        nativeSafari: expect.objectContaining({ ready: true }),
      }),
    }));

    const stamp = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const email = `interview-browser-${stamp}@example.com`;
    const username = `interview_browser_${stamp.replace(/-/g, '_')}`;
    const password = 'safePassword123';

    await page.goto('/auth/signup');
    await expect(page.getByTestId('signup-page')).toBeVisible();
    await page.getByTestId('signup-email').fill(email);
    await page.getByTestId('signup-username').fill(username);
    await page.getByTestId('signup-password').fill(password);
    await page.getByTestId('signup-confirm').fill(password);
    await activateWithKeyboard(page.getByTestId('signup-submit'));
    await completeSignupNavigation(page);

    const cookies = await context.cookies();
    const accessCookie = cookies.find((cookie) => cookie.name === 'access_token');
    const csrf = csrfCookie(cookies);
    expect(accessCookie?.httpOnly).toBe(true);
    expect(accessCookie?.value).toBeTruthy();
    expect(csrf?.httpOnly).toBe(false);
    expect(csrf?.value).toBeTruthy();

    // APIRequestContext shares the browser cookie jar but does not run the
    // Angular CSRF interceptor. A cookie-authenticated mutation without the
    // matching header must be rejected before it can create a session.
    const rejectedCsrf = await context.request.post(`${apiOrigin}/api/interviews`, {
      data: {
        format: 'coding',
        level: 'mid',
        track: 'core-web',
        viewportWidth: 1366,
      },
      headers: { 'content-type': 'application/json' },
    });
    expect(rejectedCsrf.status()).toBe(403);
    expect(await responseJson(rejectedCsrf)).toEqual(expect.objectContaining({
      code: 'AUTH_CSRF_INVALID',
    }));
    const activeAfterRejectedCsrf = await context.request.get(
      `${apiOrigin}/api/interviews/active`,
    );
    expect(activeAfterRejectedCsrf.status()).toBe(200);
    expect((await responseJson(activeAfterRejectedCsrf)).session).toBeNull();

    const availabilityPromise = page.waitForResponse((response) => (
      response.request().method() === 'GET'
      && new URL(response.url()).pathname === '/api/interviews/availability'
    ));
    await page.goto('/interview');
    const availabilityResponse = await availabilityPromise;
    expect(availabilityResponse.status()).toBe(200);
    const availabilityRead = await context.request.get(
      `${apiOrigin}/api/interviews/availability`,
    );
    expect(availabilityRead.status()).toBe(200);
    const availability = await responseJson(availabilityRead);
    expect(availability.accessMode).toBe('public');
    expect(availability.formats).toContainEqual(expect.objectContaining({
      id: 'system-design',
      available: false,
    }));
    await expectNoSeriousViolations(page, '[data-testid="interview-setup"]', 'setup');

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByTestId('interview-mobile-block')).toContainText(
      'A larger screen is required to start',
    );
    await expect(page.getByTestId('interview-start')).toBeDisabled();
    await page.setViewportSize({ width: 1366, height: 900 });
    await expect(page.getByTestId('interview-start')).toBeEnabled();

    const createPromise = page.waitForResponse((response) => (
      response.request().method() === 'POST'
      && new URL(response.url()).pathname === '/api/interviews'
    ));
    await activateWithKeyboard(page.getByTestId('interview-start'));
    const createResponse = await createPromise;
    expect(createResponse.status()).toBe(201);
    await expect(page).toHaveURL(/\/interview\/[^/]+$/);
    const sessionId = new URL(page.url()).pathname.split('/').filter(Boolean).at(-1)!;
    const createdRead = await context.request.get(
      `${apiOrigin}/api/interviews/${sessionId}`,
    );
    expect(createdRead.status()).toBe(200);
    const create = await responseJson(createdRead);
    expect(create.session.questions).toHaveLength(5);
    expectNoPrivateArtifactFields(create, 'created session');
    expectNoEarlyAnswerFeedback(create, 'created session');
    expect(String(create.session.id)).toBe(sessionId);
    await expect(page).toHaveURL(new RegExp(`/interview/${sessionId}$`));
    await expect(page.getByTestId('interview-timer')).toContainText('MCQ time');
    await expect(page.getByTestId('interview-question-prompt')).toBeFocused();
    await expectNoSeriousViolations(page, '[data-testid="interview-session"]', 'MCQ');

    for (let index = 0; index < 5; index += 1) {
      const question = create.session.questions[index];
      const savePromise = page.waitForResponse((response) => {
        const path = new URL(response.url()).pathname;
        return response.request().method() === 'PUT'
          && path === `/api/interviews/${sessionId}/mcq/${question.id}`;
      });
      await chooseRadioWithKeyboard(page.locator('fieldset input[type="radio"]').first());
      const saveResponse = await savePromise;
      expect(saveResponse.status()).toBe(200);

      if (index === 0) {
        const chosenOptionId = question.options[0].id;

        // This second HTTP read cannot be satisfied by Angular/localStorage; it
        // verifies the answer was committed to the isolated Mongo database.
        const persistedResponse = await context.request.get(
          `${apiOrigin}/api/interviews/${sessionId}`,
        );
        expect(persistedResponse.status()).toBe(200);
        const persisted = await responseJson(persistedResponse);
        expect(
          persisted.session.responses.find(
            (entry: any) => entry.questionId === question.id,
          )?.selectedOptionId,
        ).toBe(chosenOptionId);
        expectNoPrivateArtifactFields(persisted, 'persisted active session');
        expectNoEarlyAnswerFeedback(persisted, 'persisted active session');

        // Exercise both a crash-style reload and the setup-page resume path.
        // The browser receives the state again from Express/Mongo; no Interview
        // request is intercepted or fulfilled by Playwright.
        await page.reload();
        await expect(page.getByTestId('interview-session')).toBeVisible();
        await expect(page.locator('fieldset input[type="radio"]').first()).toBeChecked();
        await expect(page.getByTestId('interview-question-prompt')).toBeFocused();

        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/interview');
        await expect(page.getByTestId('interview-mobile-block')).toContainText(
          'You can resume here',
        );
        const resume = page.getByRole('button', { name: 'Resume interview', exact: true });
        await expect(resume).toBeEnabled();
        await activateWithKeyboard(resume);
        await expect(page).toHaveURL(new RegExp(`/interview/${sessionId}$`));
        await expect(page.locator('fieldset input[type="radio"]').first()).toBeChecked();
        await page.setViewportSize({ width: 1366, height: 900 });
      }

      if (index < 4) {
        await activateWithKeyboard(page.getByRole('button', { name: 'Next', exact: true }));
      } else {
        await activateWithKeyboard(
          page.getByRole('button', { name: 'Review answers', exact: true }).last(),
        );
      }
    }

    await expect(page.getByText('5/5 answered')).toBeVisible();
    await expect(page.getByTestId('interview-review-heading')).toBeFocused();
    await expectNoSeriousViolations(page, '[data-testid="interview-session"]', 'MCQ review');
    const mcqSubmitPromise = page.waitForResponse((response) => (
      response.request().method() === 'POST'
      && new URL(response.url()).pathname === `/api/interviews/${sessionId}/mcq/submit`
    ));
    await activateWithKeyboard(page.getByTestId('submit-mcq'));
    const mcqSubmitResponse = await mcqSubmitPromise;
    expect(mcqSubmitResponse.status()).toBe(200);
    await expect(page.getByTestId('interview-coding-ready-heading')).toBeVisible();
    await expect(page.getByTestId('interview-coding-ready-heading')).toBeFocused();
    await expectNoSeriousViolations(
      page,
      '[data-testid="interview-session"]',
      'coding ready',
    );

    const codingStartPromise = page.waitForResponse((response) => (
      response.request().method() === 'POST'
      && new URL(response.url()).pathname === `/api/interviews/${sessionId}/coding/start`
    ));
    const codingDraftPromise = page.waitForResponse((response) => (
      response.request().method() === 'PUT'
      && new URL(response.url()).pathname === `/api/interviews/${sessionId}/coding/draft`
    ));
    await activateWithKeyboard(page.getByTestId('start-coding'));
    expect((await codingStartPromise).status()).toBe(200);
    const codingDraftResponse = await codingDraftPromise;
    expect(codingDraftResponse.status()).toBe(200);
    await expect(page.getByText('Draft saved')).toBeVisible();
    await expect(page.getByTestId('interview-coding-heading')).toBeFocused();
    await expect(page.getByTestId('submit-coding')).toBeEnabled();
    await expectNoSeriousViolations(
      page,
      '[data-testid="interview-session"]',
      'coding active',
    );

    const draftMarker = `interview-browser-draft-${stamp}`;
    const mutatedDraftPromise = page.waitForResponse((response) => (
      response.request().method() === 'PUT'
      && new URL(response.url()).pathname === `/api/interviews/${sessionId}/coding/draft`
    ));
    await appendToActiveCodeEditor(page, draftMarker);
    const mutatedDraftResponse = await mutatedDraftPromise;
    expect(mutatedDraftResponse.status()).toBe(200);
    await expect(page.getByText('Draft saved')).toBeVisible();

    // Verify a user-authored (not just starter) draft made a second round trip
    // and is present in the server/Mongo serialization before checks or submit.
    const persistedDraftResponse = await context.request.get(
      `${apiOrigin}/api/interviews/${sessionId}`,
    );
    expect(persistedDraftResponse.status()).toBe(200);
    const persistedDraft = await responseJson(persistedDraftResponse);
    const persistedDraftFiles = persistedDraft.session.coding?.draft?.files || [];
    expect(
      persistedDraftFiles.some((file: any) => String(file.content).includes(draftMarker)),
    ).toBe(true);
    expect(persistedDraft.session.coding?.draft?.hash).toMatch(/^[a-f0-9]{64}$/);
    expectNoPrivateArtifactFields(persistedDraft, 'persisted coding draft');
    expectNoEarlyAnswerFeedback(persistedDraft, 'persisted coding draft');

    // Exercise the ARIA tablist contract without mouse input. Single-file
    // tasks still prove focusability; multi-file tasks additionally prove
    // Home/End selection and focus movement.
    const fileTabs = page.getByRole('tab');
    const fileTabCount = await fileTabs.count();
    expect(fileTabCount).toBeGreaterThan(0);
    if (fileTabCount > 1) {
      await fileTabs.first().focus();
      await fileTabs.first().press('End');
      await expect(fileTabs.last()).toHaveAttribute('aria-selected', 'true');
      await expect(fileTabs.last()).toBeFocused();
      await fileTabs.last().press('Home');
      await expect(fileTabs.first()).toHaveAttribute('aria-selected', 'true');
      await expect(fileTabs.first()).toBeFocused();
    } else {
      await fileTabs.first().focus();
      await expect(fileTabs.first()).toBeFocused();
    }

    const checkPreparePromise = page.waitForResponse((response) => (
      response.request().method() === 'POST'
      && new URL(response.url()).pathname === `/api/interviews/${sessionId}/coding/check-runs`
      && checkRunAction(response) === 'prepare'
    ));
    const checkCompletePromise = page.waitForResponse((response) => (
      response.request().method() === 'POST'
      && new URL(response.url()).pathname === `/api/interviews/${sessionId}/coding/check-runs`
      && checkRunAction(response) === 'complete'
    ));
    await activateWithKeyboard(page.getByRole('button', { name: 'Run checks', exact: true }));
    expect((await checkPreparePromise).status()).toBe(200);
    expect((await checkCompletePromise).status()).toBe(200);
    await expect(page.getByText(/\d+\/\d+ checks passed/)).toBeVisible({ timeout: 30_000 });

    const codingSubmitPromise = page.waitForResponse((response) => (
      response.request().method() === 'POST'
      && new URL(response.url()).pathname === `/api/interviews/${sessionId}/coding/submit`
    ));
    const resultsPromise = page.waitForResponse((response) => (
      response.request().method() === 'GET'
      && new URL(response.url()).pathname === `/api/interviews/${sessionId}/results`
    ));
    await activateWithKeyboard(page.getByTestId('submit-coding'));
    const codingSubmitResponse = await codingSubmitPromise;
    expect(codingSubmitResponse.status()).toBe(200);

    const resultsResponse = await resultsPromise;
    expect(resultsResponse.status()).toBe(200);
    const resultsRead = await context.request.get(
      `${apiOrigin}/api/interviews/${sessionId}/results`,
    );
    expect(resultsRead.status()).toBe(200);
    const results = await responseJson(resultsRead);
    expect(results.results.coding.submitted).toBe(true);
    expect(results.results.coding.authoritativeEvaluation).toBe(false);
    expect(results.results.coding.draftHash).toBe(
      persistedDraft.session.coding.draft.hash,
    );
    expect(results.results.employmentPrediction).toBeNull();
    expect(results.results.coding.rubric).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: 'not_evaluated',
          checkIds: [],
        }),
      ]),
    );
    expect(JSON.stringify(results)).not.toContain(draftMarker);
    expectNoPrivateArtifactFields(results, 'results');
    const feedbackPaths = collectFieldPaths(results, RESULT_ONLY_FEEDBACK_FIELDS);
    expect(feedbackPaths.some((path) => path.endsWith('.correctOptionId'))).toBe(true);
    expect(feedbackPaths.every((path) => (
      /^\$\.results\.mcq\.questions\[\d+\]\.(?:correctOptionId|explanation|selectedOptionExplanation|remediationTopics)$/.test(path)
      || path === '$.results.coding.rubric'
    )), `Unexpected result-feedback path: ${feedbackPaths.join(', ')}`).toBe(true);
    for (const question of results.results.mcq.questions) {
      expect(question.options.map((option: any) => option.id)).toContain(question.correctOptionId);
    }
    await expect(page).toHaveURL(new RegExp(`/interview/${sessionId}/results$`));
    await expect(page.getByTestId('interview-results')).toBeVisible();
    await expect(page.getByText('Preparation feedback only')).toBeVisible();
    await expectNoSeriousViolations(page, '[data-testid="interview-results"]', 'results');

    const persistedCompletedResponse = await context.request.get(
      `${apiOrigin}/api/interviews/${sessionId}`,
    );
    expect(persistedCompletedResponse.status()).toBe(200);
    const persistedCompleted = await responseJson(persistedCompletedResponse);
    expect(persistedCompleted.session.status).toBe('completed');
    expect(persistedCompleted.session.responses).toHaveLength(5);
    expect(
      persistedCompleted.session.coding.draft.files
        .some((file: any) => String(file.content).includes(draftMarker)),
    ).toBe(true);
    expectNoPrivateArtifactFields(persistedCompleted, 'completed session');
    expectNoEarlyAnswerFeedback(persistedCompleted, 'completed session');

    expect(mutationHeaders.length).toBeGreaterThanOrEqual(9);
    expect(mutationHeaders.every((entry) => entry.csrf === csrf!.value)).toBe(true);

    const captured = await Promise.all(captures);
    expect(captured.length).toBeGreaterThanOrEqual(12);
    const checkBundleResponses = captured.filter((response) => (
      collectFieldPaths(response.body, new Set(['runnerConfig'])).length > 0
    ));
    expect(checkBundleResponses).toHaveLength(1);
    expect(checkBundleResponses[0]).toEqual(expect.objectContaining({
      method: 'POST',
      path: `/api/interviews/${sessionId}/coding/check-runs`,
      requestAction: 'prepare',
      status: 200,
    }));
    expect(
      collectFieldPaths(checkBundleResponses[0].body, new Set(['runnerConfig'])),
    ).toEqual(['$.prepared.runnerConfig']);
    for (const response of captured) {
      const label = `${response.method} ${response.path} (${response.status})`;
      expectNoPrivateArtifactFields(response.body, label);
      if (response.path.endsWith('/results')) {
        expect(collectFieldPaths(response.body, RESULT_ONLY_FEEDBACK_FIELDS).length).toBeGreaterThan(0);
      } else {
        expectNoEarlyAnswerFeedback(response.body, label);
      }
    }
  });
});
