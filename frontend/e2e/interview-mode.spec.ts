import fs from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { buildMockUser, installAuthMock } from './auth-mocks';
import { expect, test } from './fixtures';

import {
  CanonicalPublicQuestion,
  LEVELS,
  TRACKS,
  nowIso,
  futureIso,
  expectNoSeriousInterviewViolations,
  questionTechnologies,
  buildSession,
  buildJavascriptTask,
  buildReactTask,
  buildResult,
  InterviewApiMock,
  seedAuthenticatedInterview,
  selectSetupChoice,
  selectDropdownWithKeyboard,
  expectNoHorizontalOverflow
} from './interview-mocks';

test.use({
  // Firefox 144 rejects PrimeNG's bundled Inter variable font before app code
  // executes. Keep the cross-engine Interview assertions visible while the
  // repository-wide font asset issue is tracked independently.
  consoleErrorAllowlist: [
    'downloadable font: rejected by sanitizer .*Inter-roman\\.var\\.woff2',
  ],
});

test.describe('Interview Mode setup selection matrix', () => {
  for (const level of LEVELS) {
    for (const track of TRACKS) {
      test(`${level.label} × ${track.label} sends the pinned start contract`, async ({ page }) => {
        await page.setViewportSize({ width: 1366, height: 900 });
        const api = new InterviewApiMock();
        await seedAuthenticatedInterview(page, api);

        await page.goto('/interview');
        await expect(page.getByTestId('interview-setup')).toBeVisible();
        await selectSetupChoice(page, 'Level', level.label);
        await selectSetupChoice(page, 'Track', track.label);
        await page.getByTestId('interview-start').click();

        await expect(page).toHaveURL(new RegExp(`/interview/mock-session-1-${level.value}-${track.value}$`));
        await expect(page.getByTestId('interview-session')).toBeVisible();
        await expect.poll(() => api.createRequests.length).toBe(1);

        const created = api.createRequests[0];
        expect(created.body).toEqual({
          level: level.value,
          track: track.value,
          viewportWidth: 1366,
        });
        expect(created.headers['idempotency-key']).toBeTruthy();
        expect(api.currentSession?.questions.map((question) => question.technology))
          .toEqual(questionTechnologies(track.value));
      });
    }
  }
});

test('loads the approved canonical 185-question contract into the MCQ UI', async ({ page }) => {
  const canonicalRoot = path.resolve(
    process.cwd(),
    '../content-drafts/interview-mcq/generated',
  );
  const publicArtifact = JSON.parse(fs.readFileSync(
    path.join(canonicalRoot, 'frontend-interview-bank-v1.public.json'),
    'utf8',
  )) as {
    bankVersion: string;
    status: string;
    items: CanonicalPublicQuestion[];
  };
  const releaseArtifact = JSON.parse(fs.readFileSync(
    path.join(canonicalRoot, 'frontend-interview-bank-v1.release.json'),
    'utf8',
  )) as { itemCount: number; contentHash: string; status: string };

  expect(publicArtifact.bankVersion).toBe('1.3.0');
  expect(publicArtifact.status).toBe('editorial-gold');
  expect(publicArtifact.items).toHaveLength(185);
  expect(releaseArtifact).toEqual(expect.objectContaining({
    itemCount: 185,
    status: 'editorial-gold',
    contentHash: '9e2aed2606cf0fbaa54cad46c890d48e518be0266a3a91cb95cfb4777038a4e8',
  }));

  const selectedIds = [
    'int-js-number-finite-input-validation-jr-v1',
    'int-js-urlsearchparams-repeated-value-contract-jr-v1',
    'int-js-optional-chain-side-effect-short-circuit-jr-v1',
    'int-html-details-summary-disclosure-jr-v1',
    'int-css-custom-property-fallback-resolution-jr-v1',
  ];
  const byId = new Map(publicArtifact.items.map((item) => [item.id, item]));
  const selected = selectedIds.map((id) => {
    const item = byId.get(id);
    expect(item, `${id} must exist in the canonical artifact`).toBeTruthy();
    return item as CanonicalPublicQuestion;
  });
  expect(selected.map((item) => item.technology)).toEqual([
    'javascript',
    'javascript',
    'javascript',
    'html',
    'css',
  ]);
  expect(selected.map((item) => item.difficultyBand).sort()).toEqual([
    'core',
    'core',
    'core',
    'foundation',
    'stretch',
  ]);

  const session = buildSession('junior', 'core-web', 'canonical-1-3-ui-session');
  session.bankVersion = publicArtifact.bankVersion;
  session.questions = selected.map((item) => ({
    id: item.id,
    revision: item.revision,
    technology: item.technology,
    competency: item.competency,
    prompt: item.prompt,
    options: item.options,
    selectedOptionId: null,
  }));
  const api = new InterviewApiMock({ initialSession: session });
  await seedAuthenticatedInterview(page, api);

  await page.goto(`/interview/${session.id}`);
  await expect(page.getByTestId('interview-session')).toBeVisible();
  for (let index = 0; index < selected.length; index += 1) {
    await page.locator('.question-nav button').nth(index).click();
    const visibleText = (text: string) => text.replace(/(?<!`)`([^`\n]+)`(?!`)/g, '$1');
    await expect(page.getByTestId('interview-question-prompt')).toContainText(visibleText(selected[index].prompt));
    await expect(page.locator('fieldset input[type="radio"]')).toHaveCount(3);
    for (const option of selected[index].options) {
      await expect(page.getByRole('radio', { name: visibleText(option.label), exact: true })).toBeVisible();
    }
  }
});

test('mocked MCQ shell has named groups, deterministic focus, bounded timer semantics, and no serious axe violations', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const session = buildSession('mid', 'react', 'a11y-mcq-session');
  const api = new InterviewApiMock({ initialSession: session });
  await seedAuthenticatedInterview(page, api);

  await page.goto(`/interview/${session.id}`);
  const firstPrompt = page.getByTestId('interview-question-prompt');
  await expect(firstPrompt).toBeFocused();
  await expect(page.getByRole('group', { name: session.questions[0].prompt })).toBeVisible();
  await expect(page.getByRole('timer', { name: /Question time:/ })).toHaveAttribute('aria-live', 'off');
  await page.getByRole('button', { name: 'Questions · 0/5 answered', exact: true }).click();
  await expect(page.locator('.question-nav button').first()).toHaveAccessibleName(
    'Question 1, unanswered',
  );

  await page.locator('.question-nav button').nth(1).click();
  await expect(page.getByTestId('interview-question-prompt')).toBeFocused();
  await expect(page.getByTestId('interview-question-prompt')).toContainText(
    session.questions[1].prompt,
  );
  await expect(page.locator('.question-nav')).toBeHidden();
  await page.getByRole('button', { name: 'Questions · 0/5 answered', exact: true }).click();
  await page.getByRole('button', { name: 'Review answers', exact: true }).first().click();
  await expect(page.getByTestId('interview-review-heading')).toBeFocused();
  await expectNoHorizontalOverflow(page);
  await expectNoSeriousInterviewViolations(page, 'mocked MCQ shell');
});

test('mocked coding file tabs expose labelled panels and support arrow-key roving focus', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  const session = buildSession('junior', 'core-web', 'a11y-coding-session');
  const task = buildJavascriptTask();
  task.files.push({
    path: 'README.md',
    language: 'markdown',
    content: 'Use the public requirements as the source of truth.',
    readOnly: true,
  });
  session.status = 'coding_active';
  session.mcqDeadlineAt = null;
  session.coding = {
    readyDeadlineAt: null,
    deadlineAt: futureIso(1500),
    task,
    draft: null,
    checkRuns: [],
    runCount: 0,
  };
  const api = new InterviewApiMock({ initialSession: session });
  await seedAuthenticatedInterview(page, api);

  await page.goto(`/interview/${session.id}`);
  const tabs = page.getByRole('tab');
  await expect(tabs).toHaveCount(2);
  await expect(tabs.first()).toHaveAttribute('tabindex', '0');
  await expect(tabs.nth(1)).toHaveAttribute('tabindex', '-1');
  await tabs.first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  const labelledBy = await page.getByRole('tabpanel').getAttribute('aria-labelledby');
  await expect(tabs.nth(1)).toHaveAttribute('id', labelledBy || '__missing__');
  await expectNoSeriousInterviewViolations(page, 'mocked coding workspace');
});

test('completes MCQ → local JS checks → coding submit → raw results without progress writes', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  const api = new InterviewApiMock();
  await seedAuthenticatedInterview(page, api);
  const progressWrites: string[] = [];
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname;
    if (
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())
      && (
        path.includes('/api/activity/')
        || path.includes('/api/practice-progress')
        || path.includes('/api/daily/')
        || path.includes('/api/weekly-goal')
        || path.includes('/api/users/me/solved')
        || path.includes('/api/achievements')
        || /\/api\/xp(?:\/|$)/.test(path)
      )
    ) {
      progressWrites.push(`${request.method()} ${path}`);
    }
  });

  await page.goto('/interview');
  await selectSetupChoice(page, 'Level', 'Junior');
  await page.getByTestId('interview-start').click();
  await expect(page.getByTestId('interview-timer')).toContainText('Question time');
  await expect(page.getByText(/Correct|Incorrect/, { exact: true })).toHaveCount(0);

  for (let index = 0; index < 5; index += 1) {
    await page.locator('fieldset input[type="radio"]').first().check();
    await expect.poll(() => api.answerRequests.length).toBe(index + 1);
    if (index < 4) {
      await page.getByRole('button', { name: 'Next', exact: true }).click();
    } else {
      await page.getByRole('button', { name: 'Review answers', exact: true }).last().click();
    }
  }

  await expect(page.getByText('5/5 answered', { exact: true })).toBeVisible();
  await page.getByTestId('submit-mcq').click();
  await expect(page.getByRole('heading', { name: 'Your coding task is next' })).toBeVisible();
  await page.getByTestId('start-coding').click();

  await expect(page.getByRole('heading', { name: 'Validate Username' })).toBeVisible();
  await expect(page.getByText('Interview coding awards 0 XP.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Run checks', exact: true })).toBeVisible();
  await expect(page.getByTestId('submit-coding')).toBeVisible();
  await expect(page.getByText('Draft saved')).toBeVisible();

  await page.getByRole('button', { name: 'Run checks', exact: true }).click();
  await expect(page.getByText('1/1 checks passed')).toBeVisible();
  expect(api.checkRequests.map((request) => request.body['action'])).toEqual(['prepare', 'complete']);
  expect(api.checkRequests[1].body['checks']).toEqual([
    { id: 'valid-username', passed: true },
  ]);

  await page.reload();
  await expect(page.getByText('1/1 checks passed')).toBeVisible();
  await expect(page.getByText('Passed · accepts a valid username', { exact: true })).toBeVisible();

  await page.getByTestId('submit-coding').click();
  await expect(page).toHaveURL(/\/interview\/[^/]+\/results$/);
  await expect(page.getByTestId('interview-results')).toBeVisible();
  await expect(page.getByText('Preparation feedback only')).toBeVisible();
  await expect(page.getByText('This session awarded 0 XP and did not change solved progress.')).toBeVisible();
  await expect(page.getByText('1 browser checks passed for the submitted draft.', { exact: false })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Answer review' })).toBeVisible();
  await expect(page.getByText(/Hire|Strong Hire|readiness/i)).toHaveCount(0);
  expect(progressWrites).toEqual([]);
});

test('clears passing evidence after an edited draft is saved and reloaded, then restores failed names without details', async ({ page }) => {
  const session = buildSession('junior', 'core-web', 'draft-bound-checks');
  const task = buildJavascriptTask();
  session.status = 'coding_active';
  session.coding = {
    readyDeadlineAt: null, deadlineAt: futureIso(1500), task,
    draft: { hash: 'checked-draft', files: task.files, updatedAt: nowIso() },
    checkRuns: [{
      draftHash: 'checked-draft', checks: [{ id: 'valid-username', name: 'accepts a valid username', passed: true }],
      passedCount: 1, totalCount: 1, ranAt: nowIso(), authoritative: false, evidenceSource: 'client-self-report',
    }],
    runCount: 1,
  };
  const api = new InterviewApiMock({ initialSession: session });
  await seedAuthenticatedInterview(page, api);
  await page.goto(`/interview/${session.id}`);
  await expect(page.getByText('1/1 checks passed')).toBeVisible();
  const editor = page.getByRole('textbox', { name: 'Editor content' });
  const editedCode = 'export default function validateUsername() { return false; }';
  await expect(page.locator('.editor-shell .monaco-editor .view-lines')).toBeVisible();
  // Monaco's input textarea is intentionally hidden in Firefox. Send the
  // replacement through its keyboard input so the model receives the edit.
  await page.locator('.editor-shell .monaco-editor .view-line').first().click();
  await editor.focus();
  await expect(editor).toBeFocused();
  // Monaco uses the emulated user agent for keybindings, while Playwright's
  // ControlOrMeta uses the host OS (e.g. Windows Firefox emulated on macOS).
  const selectAll = await page.evaluate(() => (
    /Macintosh|iPad|iPhone/.test(navigator.userAgent) ? 'Meta+A' : 'Control+A'
  ));
  await editor.press(selectAll);
  await page.keyboard.insertText(editedCode);
  await expect.poll(() => api.draftRequests.length).toBe(1);
  expect(api.draftRequests[0].body['files']).toEqual([
    expect.objectContaining({ content: editedCode }),
  ]);
  await expect(page.getByText('Draft saved', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText(/Run checks for the current draft\./)).toBeVisible();
  await expect(page.getByText('1/1 checks passed')).toHaveCount(0);
  await page.getByRole('button', { name: 'Run checks', exact: true }).click();
  await expect(page.getByText('0/1 checks passed')).toBeVisible();
  await page.reload();
  await expect(page.getByText('0/1 checks passed')).toBeVisible();
  await expect(page.locator('.check-results strong')).toContainText('accepts a valid username');
  await expect(page.getByText('Run checks again for failure details.')).toBeVisible();
  await page.getByTestId('submit-coding').click();
  await expect(page.getByTestId('interview-results')).toBeVisible();
  await expect(page.locator('.check-list strong')).toContainText('accepts a valid username');
});

for (const width of [360, 390, 768, 834, 1366, 1440]) {
  test(`formats inline code safely and keeps accessible labels and task prose readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const session = buildSession('junior', 'core-web', `inline-code-${width}`);
    session.questions[0].prompt = 'Choose `<button>` with `/[a-z]+/g`; preserve `unmatched.';
    session.questions[0].options[0].label = 'Use `<img src=x onerror=alert(1)>` safely.';
    session.questions[0].options[1].label = `Use \`${'longIdentifier'.repeat(15)}\` safely.`;
    const api = new InterviewApiMock({ initialSession: session });
    await seedAuthenticatedInterview(page, api);
    await page.goto(`/interview/${session.id}`);
    const prompt = page.getByTestId('interview-question-prompt');
    await expect(prompt).toBeFocused();
    await expect(prompt.locator('code')).toHaveText(['<button>', '/[a-z]+/g']);
    await expect(prompt).toContainText('preserve `unmatched.');
    const option = page.getByRole('radio', { name: 'Use <img src=x onerror=alert(1)> safely.', exact: true });
    await option.focus();
    await page.keyboard.press('Space');
    await expect(option).toBeChecked();
    await expect(page.locator('fieldset img')).toHaveCount(0);
    await expectNoHorizontalOverflow(page);

    // Move the same mock session to coding with duplicated prose and a distinct constraint.
    const task = buildJavascriptTask();
    task.prompt = `Implement \`${'longIdentifier'.repeat(15)}\` and \`<button>\`.`;
    task.publicRequirements = [{
      id: 'duplicate', title: ` ${task.title} `,
      prompt: task.prompt.replace(/ /g, '  '), constraints: ['Keep `value` unchanged.'],
    }];
    api.currentSession!.status = 'coding_active';
    api.currentSession!.coding = {
      readyDeadlineAt: null, deadlineAt: futureIso(1500), task,
      draft: null, checkRuns: [], runCount: 0,
    };
    await page.reload();
    await expect(page.getByRole('heading', { name: task.title })).toHaveCount(1);
    await expect(page.locator('.requirement-group strong, .requirement-group p')).toHaveCount(0);
    await expect(page.locator('.requirement-group code')).toHaveText('value');
    await expectNoHorizontalOverflow(page);
  });
}

test('completes guided system design setup → autosave → refresh → twist → evidence report', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  const api = new InterviewApiMock({ systemDesignEnabled: true });
  await seedAuthenticatedInterview(page, api);

  await page.goto('/interview');
  await page.getByRole('radio', { name: /System design mock/ }).check();
  await selectSetupChoice(page, 'Track', 'React');
  await expect(page.getByText('15 minutes guided system design')).toBeVisible();
  await page.getByTestId('interview-start').click();

  await expect(page).toHaveURL(/\/interview\/mock-system-design-1-mid-react$/);
  await expect(page.getByTestId('system-design-round')).toBeVisible();
  await expect(page.getByTestId('interview-timer')).toContainText('System design time');
  expect(api.createRequests[0].body).toEqual({
    format: 'system-design',
    level: 'mid',
    track: 'react',
    viewportWidth: 1366,
  });

  await page.setViewportSize({ width: 834, height: 900 });
  await expectNoHorizontalOverflow(page);
  const sidebarBox = await page.locator('.design-sidebar').boundingBox();
  const workspaceBox = await page.locator('.design-workspace').boundingBox();
  expect(sidebarBox).not.toBeNull();
  expect(workspaceBox).not.toBeNull();
  expect(workspaceBox!.y).toBeGreaterThan(sidebarBox!.y);
  await page.setViewportSize({ width: 1366, height: 900 });

  const keyboardClarification = page.getByLabel('Is keyboard navigation required?');
  await keyboardClarification.focus();
  await keyboardClarification.press('Space');
  await expect(keyboardClarification).toBeChecked();
  await expect(page.getByText(/Interviewer: Yes, full keyboard navigation is required/))
    .toBeVisible();
  await expect.poll(() => api.systemDesignDraftRequests.length).toBeGreaterThanOrEqual(1);

  const staleClarification = page.getByLabel('Can stale results remain visible?');
  const cacheClarification = page.getByLabel('Can cached results be shared across users?');
  const unseenClarification = page.getByLabel('How many results can a query return?');
  await staleClarification.check();
  await cacheClarification.check();
  const beforeThreeAnswersSave = api.systemDesignDraftRequests.length;
  await expect.poll(() => api.systemDesignDraftRequests.length)
    .toBeGreaterThan(beforeThreeAnswersSave);

  await cacheClarification.uncheck();
  const beforeReleasedSelectionSave = api.systemDesignDraftRequests.length;
  await expect.poll(() => api.systemDesignDraftRequests.length)
    .toBeGreaterThan(beforeReleasedSelectionSave);
  await expect(unseenClarification).toBeDisabled();
  await expect(cacheClarification).toBeEnabled();
  const beforeReuseSave = api.systemDesignDraftRequests.length;
  await cacheClarification.check();
  await expect(page.getByText('3/3 selected')).toBeVisible();
  await expect.poll(() => api.systemDesignDraftRequests.length).toBeGreaterThan(beforeReuseSave);

  await page.reload();
  await expect(page.getByLabel('Is keyboard navigation required?')).toBeChecked();
  await expect(page.getByLabel('Can stale results remain visible?')).toBeChecked();
  await expect(page.getByLabel('Can cached results be shared across users?')).toBeChecked();
  await expect(page.getByLabel('How many results can a query return?')).toBeDisabled();
  await expect(page.getByText(/Interviewer: Yes, full keyboard navigation is required/))
    .toBeVisible();

  await page.getByRole('button', { name: 'Next stage' }).click();
  await page.getByLabel('Preserve request ordering').check();
  await page.getByLabel('Keep keyboard focus stable').check();
  await page.getByLabel('Bound duplicate network requests').check();
  await page.getByRole('button', { name: 'Next stage' }).click();

  const inputCard = page.locator('.palette-card').filter({ hasText: 'Search input' });
  const inputLaneSelect = inputCard.getByRole('combobox');
  await selectDropdownWithKeyboard(inputLaneSelect, 'UI', 1);
  const controllerCard = page.locator('.palette-card').filter({ hasText: 'Request controller' });
  const controllerLaneSelect = controllerCard.getByRole('combobox');
  await selectDropdownWithKeyboard(controllerLaneSelect, 'Data', 2);
  await page.getByRole('button', { name: 'Next stage' }).click();

  const connectionBuilder = page.locator('.connection-builder');
  await selectDropdownWithKeyboard(
    connectionBuilder.getByRole('combobox').nth(0),
    'Search input',
    1,
  );
  await selectDropdownWithKeyboard(
    connectionBuilder.getByRole('combobox').nth(2),
    'Request controller',
    2,
  );
  await page.getByRole('button', { name: 'Add connection' }).click();
  await page.getByLabel('Abort obsolete requests').check();
  await page.getByLabel('Prevent stale results').check();
  await page.getByRole('button', { name: 'Continue to production twist' }).click();
  await page.getByTestId('reveal-system-design-twist').click();

  await expect(page.getByText('The user changes locale while an older request is still in flight.'))
    .toBeVisible();
  await page.getByLabel('Include locale in request and cache identity').check();
  await expect(page.getByText('Design saved')).toBeVisible();
  await page.getByTestId('submit-system-design').click();

  await expect(page).toHaveURL(/\/interview\/mock-system-design-1-mid-react\/results$/);
  await expect(page.getByRole('heading', { name: 'Your design' })).toBeVisible();
  await expect(page.getByText('Not enough evidence')).toBeVisible();
  await expect(page.getByText('Request identity', { exact: true })).toBeVisible();
  await expect(page.getByText('This session awarded 0 XP and did not change solved progress.'))
    .toBeVisible();
  await expect(page.getByText(/Correct|Incorrect/, { exact: true })).toHaveCount(0);
  expect(api.systemDesignTwistRequests[0].body['draftHash']).toBeTruthy();
  expect(api.systemDesignSubmitRequests[0].body['draftHash']).toBeTruthy();
});

test('renders the bounded framework interview shell without normal solution/progress controls', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  const session = buildSession('junior', 'react', 'framework-shell-session');
  session.status = 'coding_active';
  session.mcqDeadlineAt = null;
  session.coding = {
    readyDeadlineAt: null,
    deadlineAt: futureIso(1500),
    task: buildReactTask(),
    draft: null,
    checkRuns: [],
    runCount: 0,
  };
  const api = new InterviewApiMock({ initialSession: session });
  await seedAuthenticatedInterview(page, api);

  await page.goto(`/interview/${session.id}`);
  await expect(page.getByRole('heading', { name: 'React Counter (Guarded Decrement)' })).toBeVisible();
  const frameworkPanel = page.locator('app-coding-framework-panel');
  await expect(frameworkPanel).toBeVisible();
  // Monaco's input textarea is intentionally visually hidden in Firefox. The
  // rendered editor surface is the cross-engine contract; the textarea remains
  // present and labelled for Monaco's own keyboard/input handling.
  await expect(frameworkPanel.locator('.monaco-editor')).toBeVisible();
  await expect(frameworkPanel.getByRole('textbox')).toHaveAttribute('aria-label', 'Editor content');
  await expect(page.getByRole('button', { name: 'Run checks', exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Rebuild preview', exact: true })).toBeVisible();
  await expect(page.getByText('Interview coding awards 0 XP.')).toBeVisible();
  await expect(page.getByText(/Solution loaded|Showing solution preview/)).toHaveCount(0);
  await expect.poll(() => api.draftRequests.length).toBeGreaterThanOrEqual(1);
});

test('an expired MCQ deadline is reconciled through the backend transition', async ({ page }) => {
  const session = buildSession('mid', 'core-web', 'expired-mcq-session');
  session.serverNow = nowIso();
  session.mcqDeadlineAt = new Date(Date.now() - 1000).toISOString();
  const api = new InterviewApiMock({ initialSession: session });
  await seedAuthenticatedInterview(page, api);
  let timeoutSubmitCount = 0;
  page.on('request', (request) => {
    if (request.method() === 'POST' && new URL(request.url()).pathname.endsWith('/mcq/submit')) {
      timeoutSubmitCount += 1;
    }
  });

  await page.goto(`/interview/${session.id}`);
  await expect(page.getByRole('heading', { name: 'Your coding task is next' })).toBeVisible();
  expect(timeoutSubmitCount).toBe(1);
  expect(api.currentSession?.status).toBe('coding_ready');
  await expect(page.getByTestId('interview-timer')).toContainText('Start coding within');
});

test('leaving, resuming, and refreshing preserve question position, review state, answers, and timer', async ({ page }) => {
  const session = buildSession('senior', 'vue', 'resume-session');
  session.questions[0].selectedOptionId = 'q1-b';
  const api = new InterviewApiMock({ initialSession: session });
  await seedAuthenticatedInterview(page, api);

  await page.goto('/interview');
  await expect(page.getByRole('heading', { name: 'Continue your vue interview' })).toBeVisible();
  await page.getByRole('button', { name: 'Resume interview' }).click();
  await expect(page).toHaveURL(`/interview/${session.id}`);
  await expect(page.getByText(session.questions[0].prompt)).toBeVisible();
  await expect(page.locator('input[type="radio"][value="q1-b"]')).toBeChecked();
  const orderBefore = await page.locator('.question-nav button').evaluateAll((buttons) => buttons.map((button) => button.getAttribute('aria-label')));

  await page.locator('.question-nav button').nth(3).click();
  await expect(page.getByText(session.questions[3].prompt)).toBeVisible();
  await page.goto('/interview');
  await page.getByRole('button', { name: 'Resume interview' }).click();
  await expect(page.getByText(session.questions[3].prompt)).toBeVisible();

  await page.getByRole('button', { name: 'Review answers' }).click();
  await expect(page.getByRole('heading', { name: 'Check for unanswered questions' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Check for unanswered questions' })).toBeVisible();
  expect(await page.locator('.question-nav button').evaluateAll((buttons) => buttons.map((button) => button.getAttribute('aria-label')))).toEqual(orderBefore);
  await page.locator('.question-nav button').first().click();
  await expect(page.locator('input[type="radio"][value="q1-b"]')).toBeChecked();
  await expect(page.getByTestId('interview-timer')).toContainText('Question time');
  expect(api.getSessionCount).toBeGreaterThanOrEqual(2);
});

test('free quota gate prevents a start request', async ({ page }) => {
  const api = new InterviewApiMock({
    quota: {
      remaining: 0,
      limit: 1,
      resetAt: '2026-08-01T00:00:00.000+03:00',
      unlimited: false,
    },
  });
  await seedAuthenticatedInterview(page, api);

  await page.goto('/interview');
  await expect(page.getByRole('heading', { name: 'No coding attempts remaining' })).toBeVisible();
  await expect(page.getByTestId('interview-start')).toBeDisabled();
  expect(api.createRequests).toEqual([]);
});

test('an off deployment keeps a direct URL in the authenticated safe shell', async ({ page }) => {
  const api = new InterviewApiMock({ enabled: false, accessMode: 'off' });
  await seedAuthenticatedInterview(page, api);

  await page.goto('/interview');

  await expect(page).toHaveURL(/\/interview$/);
  await expect(page.getByTestId('interview-setup')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Interview Mode is currently unavailable' }))
    .toBeVisible();
  expect(api.createRequests).toEqual([]);
});

test('premium users can abandon and immediately start a second unlimited session', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  const api = new InterviewApiMock({
    quota: { remaining: null, limit: null, resetAt: null, unlimited: true },
  });
  await seedAuthenticatedInterview(page, api, 'premium');

  await page.goto('/interview');
  await expect(page.getByText('Unlimited attempts')).toBeVisible();
  await page.getByTestId('interview-start').click();
  await expect(page.getByTestId('interview-session')).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'End interview' }).click();
  await expect(page).toHaveURL(/\/interview\?ended=abandoned$/);
  await expect(page.getByTestId('interview-setup')).toBeVisible();
  await expect(page.getByText('Interview ended', { exact: true })).toBeVisible();
  await expect(page.getByText(/Answer review is withheld/)).toBeVisible();
  await expect(page.getByTestId('interview-results')).toHaveCount(0);
  expect(api.endRequests).toHaveLength(1);

  await expect(page.getByText('Unlimited attempts')).toBeVisible();
  await page.getByTestId('interview-start').click();
  await expect(page).toHaveURL(/mock-session-2-mid-core-web$/);
  await expect(page.getByTestId('interview-session')).toBeVisible();
  expect(api.createRequests).toHaveLength(2);
  expect(api.quota.unlimited).toBe(true);
  expect(api.quota.remaining).toBeNull();
});

for (const width of [360, 390, 768, 834, 1366, 1440]) {
  test(`active MCQ snippets stay inside the session layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const active = buildSession('mid', 'react', `snippet-session-${width}`);
    const api = new InterviewApiMock({ initialSession: active });
    await seedAuthenticatedInterview(page, api);

    await page.goto(`/interview/${active.id}`);
    await expect(page.getByTestId('interview-session')).toBeVisible();
    await expect(page.locator('.question-code')).toContainText('longRuntimeIdentifier');
    await expect(page.locator('legend')).toHaveCSS('font-size', '16px');
    await expect(page.locator('.option').first()).toHaveCSS('font-size', '14px');
    const navigation = page.getByRole('navigation', { name: 'Interview questions' });
    if (width <= 900) {
      await expect(navigation).toBeHidden();
      await page.getByRole('button', { name: 'Questions · 0/5 answered', exact: true }).click();
    }
    const rows = await navigation.locator('button').evaluateAll((buttons) =>
      buttons.map((button) => ({ x: button.getBoundingClientRect().x, y: button.getBoundingClientRect().y, width: button.getBoundingClientRect().width })),
    );
    expect(rows).toHaveLength(5);
    rows.forEach((row, index) => {
      expect(row.width).toBeGreaterThan(190);
      expect(row.x).toBe(rows[0].x);
      if (index) expect(row.y).toBeGreaterThan(rows[index - 1].y);
    });
    await expect(navigation.getByRole('button').first()).toHaveAttribute('aria-current', 'step');
    await expectNoHorizontalOverflow(page);
  });
}

for (const width of [360, 390, 768, 834, 1366, 1440]) {
  test(`setup and results reflow at ${width}px without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 700 ? 844 : 900 });
    const completed = buildSession('mid', 'react', `responsive-${width}`);
    completed.status = 'completed';
    const api = new InterviewApiMock({
      initialResult: buildResult(completed, { submitted: true, attempted: true }),
    });
    await seedAuthenticatedInterview(page, api);

    await page.goto('/interview');
    await expect(page.getByTestId('interview-setup')).toBeVisible();
    await expectNoHorizontalOverflow(page);
    if (width < 768) {
      await expect(page.getByTestId('interview-mobile-block')).toBeVisible();
      await expect(page.getByTestId('interview-start')).toBeDisabled();
      expect(api.createRequests).toEqual([]);
    } else {
      await expect(page.getByTestId('interview-mobile-block')).toBeHidden();
      await expect(page.getByTestId('interview-start')).toBeEnabled();
    }

    await page.goto(`/interview/${completed.id}/results`);
    await expect(page.getByTestId('interview-results')).toBeVisible();
    await expect(page.getByText('Preparation feedback only')).toBeVisible();
    const badge = await page.locator('.requirement-status').first().boundingBox();
    const prose = await page.locator('.rubric article > div').first().boundingBox();
    expect(badge!.height).toBeLessThan(45);
    if (width < 700) {
      expect(prose!.width).toBeGreaterThan(width - 120);
      expect(badge!.y + badge!.height).toBeLessThanOrEqual(prose!.y);
    }
    await expect(page.locator('.timing-grid strong').first()).toHaveText('02:04');
    await page.locator('.answer-list details summary').first().click();
    await expect(page.locator('.question-code').first()).toContainText('longRuntimeIdentifier');
    await expectNoHorizontalOverflow(page);
  });
}


for (const runner of ['javascript', 'framework'] as const) {
  for (const width of [768, 1440]) {
    test(`${runner} editor and results resize without changing draft evidence at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      const session = buildSession('junior', runner === 'javascript' ? 'core-web' : 'react', `resize-${runner}-${width}`);
      const task = runner === 'javascript' ? buildJavascriptTask() : buildReactTask();
      if (runner === 'framework') {
        const starter = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/assets/sb/react/question/react-counter.v1.json'), 'utf8'));
        task.files = Object.entries(starter.files as Record<string, string>).map(([filePath, content]) => ({
          path: filePath, content, readOnly: false,
          language: filePath.endsWith('.tsx') ? 'typescript' : filePath.endsWith('.css') ? 'css' : filePath.endsWith('.html') ? 'html' : 'json',
        }));
      }
      session.status = 'coding_active';
      session.mcqDeadlineAt = null;
      session.coding = {
        readyDeadlineAt: null, deadlineAt: futureIso(1500), task,
        draft: { hash: 'checked-draft', files: task.files, updatedAt: nowIso() },
        checkRuns: [{
          draftHash: 'checked-draft', checks: [{ id: 'saved-check', name: 'Preserves saved evidence', passed: true }],
          passedCount: 1, totalCount: 1, ranAt: nowIso(), authoritative: false, evidenceSource: 'client-self-report',
        }], runCount: 1,
      };
      const api = new InterviewApiMock({ initialSession: session });
      await seedAuthenticatedInterview(page, api);
      await page.goto(`/interview/${session.id}`);
      await expect(page.getByText('Passed · Preserves saved evidence', { exact: true })).toBeVisible();
      const separator = page.getByRole('separator', { name: 'Resize code editor and check results' });
      await expect(separator).toBeVisible();
      const top = page.locator('fa-split-pane .split-pane__top');
      const before = (await top.boundingBox())!.height;
      const requests = api.draftRequests.length;
      await separator.focus();
      await page.keyboard.press('ArrowUp');
      await expect.poll(async () => (await top.boundingBox())!.height).toBeLessThan(before - 20);
      await page.keyboard.press('Home');
      // Browser layout engines can return fractional values for integer CSS pixels.
      await expect.poll(async () => (await top.boundingBox())!.height).toBeCloseTo(runner === 'javascript' ? 240 : 320, 1);
      await page.keyboard.press('End');
      await expect.poll(async () => (await page.locator('.split-pane__bottom').boundingBox())!.height).toBeCloseTo(160, 1);
      const handle = (await separator.boundingBox())!;
      const maxHeight = (await top.boundingBox())!.height;
      if (runner === 'javascript' && width === 1440) {
        await page.screenshot({ path: test.info().outputPath('split-before-drag.png') });
      }
      await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
      await page.mouse.down();
      await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2 - 160, { steps: 5 });
      await page.mouse.up();
      await expect.poll(async () => (await top.boundingBox())!.height).toBeLessThan(maxHeight - 140);
      if (runner === 'javascript' && width === 1440) {
        await page.screenshot({ path: test.info().outputPath('split-after-drag.png') });
      }
      if (width > 900) {
        await page.mouse.wheel(0, 500);
        // Direct production loads first hydrate the static signed-out shell.
        // Require its header to be removed before measuring the active shell.
        await expect(page.getByRole('banner')).toHaveCount(1);
        await expect.poll(async () => {
          const banner = (await page.getByRole('banner').boundingBox())!;
          const header = (await page.locator('.session-header').boundingBox())!;
          return header.y - (banner.y + banner.height);
        }).toBeGreaterThanOrEqual(0);
        const header = (await page.locator('.session-header').boundingBox())!;
        const brief = (await page.locator('.coding-brief').boundingBox())!;
        expect(brief.y).toBeGreaterThanOrEqual(header.y + header.height);
      }
      await expect(page.getByRole('button', { name: 'Run checks', exact: true }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: 'Submit interview', exact: true })).toBeEnabled();
      expect(api.draftRequests.length).toBe(requests);
      expect(api.currentSession!.coding!.draft!['hash']).toBe('checked-draft');
      await expect(page.getByText('Passed · Preserves saved evidence', { exact: true })).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await expectNoSeriousInterviewViolations(page, `${runner} resizable workspace`);
      await page.setViewportSize({ width: 390, height: 844 });
      await expect(separator).toBeHidden();
      await expect(page.getByText('Passed · Preserves saved evidence', { exact: true })).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });
  }
}

for (const failureMode of ['all', 'one'] as const) {
  test(`real JS worker shows ${failureMode} failed checks and permits submitting the saved draft`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const session = buildSession('junior', 'core-web', `failure-${failureMode}`);
    const task = buildJavascriptTask();
    task.files[0].content = failureMode === 'all'
      ? 'export default function validateUsername() { return null; }'
      : 'export default function validateUsername() { return true; }';
    session.status = 'coding_active';
    session.mcqDeadlineAt = null;
    session.coding = { readyDeadlineAt: null, deadlineAt: futureIso(1500), task, draft: null, checkRuns: [], runCount: 0 };
    const api = new InterviewApiMock({ initialSession: session });
    api.javascriptRunnerConfig = {
      kind: 'javascript', language: 'javascript',
      tests: [
        "import validateUsername from './validateUsername';",
        "test('accepts a valid username', () => expect(validateUsername('alice_1')).toBe(true));",
        "test('rejects an invalid username', () => expect(validateUsername('!')).toBe(false));",
      ].join('\n'),
      checks: [
        { id: 'valid-username', name: 'accepts a valid username' },
        { id: 'invalid-username', name: 'rejects an invalid username' },
      ],
    };
    await seedAuthenticatedInterview(page, api);
    await page.goto(`/interview/${session.id}`);
    await expect(page.getByText('Draft saved', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Run checks', exact: true }).click();
    await expect(page.getByText(`${failureMode === 'all' ? 0 : 1}/2 checks passed`, { exact: true })).toBeVisible();
    await expect(page.locator('.check-results .check-failed')).toHaveCount(failureMode === 'all' ? 2 : 1);
    await expect(page.locator('.check-failed span').first()).not.toBeEmpty();
    const completed = api.checkRequests.find((request) => request.body['action'] === 'complete');
    expect(completed?.body['checks']).toEqual([
      { id: 'valid-username', passed: failureMode === 'one' },
      { id: 'invalid-username', passed: false },
    ]);
    if (process.env.UPGRADE_GALLERY_DIR) {
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 900 });
        if (width >= 768) {
          await page.getByRole('separator', { name: 'Resize code editor and check results' }).press('Home');
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({
          path: path.join(process.env.UPGRADE_GALLERY_DIR, `interview-${failureMode}-failed-${width}.png`),
          fullPage: true, animations: 'disabled',
        });
      }
      await page.setViewportSize({ width: 1440, height: 900 });
    }
    await page.getByTestId('submit-coding').click();
    await expect(page.getByTestId('interview-results')).toBeVisible();
    await expect(page.locator('.check-list__failed')).toHaveCount(failureMode === 'all' ? 2 : 1);
  });
}
