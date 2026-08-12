import { expect, test } from './fixtures';
import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const EVENT_LOOP_ROUTE = '/javascript/trivia/js-event-loop';
const RELATED_CHALLENGE_ROUTE = '/javascript/trivia/js-event-loop-nested-microtask-output';
const GENERIC_TRIVIA_ROUTE = '/javascript/trivia/js-closures';
const VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 834, height: 1112 },
  { width: 1366, height: 900 },
  { width: 1440, height: 900 },
] as const;

const WRONG_PREDICTION = 'timer-first';
const WRONG_CHECKPOINT = 'timer';
const WRONG_PAINT = 'after-each-microtask';

type RuntimeIssue = {
  readonly type: 'console' | 'pageerror';
  readonly text: string;
};

function collectRuntimeIssues(page: Page): RuntimeIssue[] {
  const issues: RuntimeIssue[] = [];

  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'error') {
      issues.push({ type: 'console', text: message.text() });
    }
  });
  page.on('pageerror', (error) => {
    issues.push({ type: 'pageerror', text: error.message });
  });

  return issues;
}

function hydrationIssues(issues: readonly RuntimeIssue[]): RuntimeIssue[] {
  return issues.filter(({ text }) =>
    /NG05|hydration|hydrate|chunkloaderror|loading chunk|dynamically imported module|module script failed/i.test(text),
  );
}

async function loadDeferredLab(page: Page): Promise<void> {
  await page.goto(EVENT_LOOP_ROUTE);

  const slot = page.getByTestId('javascript-event-loop-experience-slot');
  await expect(slot).toBeAttached();
  await slot.scrollIntoViewIfNeeded();
  await expect(page.getByTestId('javascript-event-loop-experience')).toBeVisible();
  await expect(page.getByTestId('event-loop-experience-placeholder')).toHaveCount(0);
}

async function completeWithWrongAnswers(page: Page): Promise<void> {
  await page.locator(`input[name="event-loop-prediction"][value="${WRONG_PREDICTION}"]`).check();
  await page.getByTestId('event-loop-submit-prediction').click();
  await page.getByTestId('event-loop-start-trace').click();

  await page.locator(`input[name="event-loop-checkpoint"][value="${WRONG_CHECKPOINT}"]`).check();
  await page.getByTestId('event-loop-submit-checkpoint').click();
  await expect(page.getByTestId('event-loop-checkpoint-feedback')).toContainText('Not quite');
  await page.getByTestId('event-loop-drain-microtasks').click();

  await page.locator(`input[name="event-loop-paint"][value="${WRONG_PAINT}"]`).check();
  await page.getByTestId('event-loop-submit-paint').click();
  await expect(page.getByTestId('event-loop-paint-feedback')).toContainText('Not quite');
  await page.getByTestId('event-loop-finish-trace').click();

  await expect(page.getByTestId('event-loop-result')).toBeVisible();
}

async function expectNoDocumentOverflow(page: Page, label: string): Promise<void> {
  const metrics = await page.evaluate(() => {
    const documentRoot = document.documentElement;
    const lab = document.querySelector<HTMLElement>('[data-testid="javascript-event-loop-experience"]');

    return {
      documentClientWidth: documentRoot.clientWidth,
      documentScrollWidth: documentRoot.scrollWidth,
      labClientWidth: lab?.clientWidth ?? 0,
      labScrollWidth: lab?.scrollWidth ?? 0,
    };
  });

  expect(metrics.documentScrollWidth, `${label}: document overflow`).toBeLessThanOrEqual(
    metrics.documentClientWidth + 1,
  );
  expect(metrics.labScrollWidth, `${label}: lab overflow`).toBeLessThanOrEqual(
    metrics.labClientWidth + 1,
  );
}

test.describe('JavaScript event loop learn-by-predicting lab', () => {
  test.use({ consoleErrorAllowlist: ['\\/api\\/auth\\/me'] });

  test('hydrates the deferred lab and lets a keyboard user finish after three wrong first answers', async ({ page }) => {
    const runtimeIssues = collectRuntimeIssues(page);
    await loadDeferredLab(page);

    await expect(page.getByRole('heading', {
      level: 2,
      name: 'Predict the browser event loop before it runs',
    })).toBeVisible();
    await expect(page.getByRole('group', {
      name: 'Choose the complete output order before starting the trace.',
    })).toBeVisible();
    await expect(page.locator('input[name="event-loop-prediction"]')).toHaveCount(3);
    const initialA11y = await new AxeBuilder({ page })
      .include('[data-testid="javascript-event-loop-experience"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(initialA11y.violations).toEqual([]);

    const wrongPrediction = page.locator(
      `input[name="event-loop-prediction"][value="${WRONG_PREDICTION}"]`,
    );
    await wrongPrediction.focus();
    await page.keyboard.press('Space');
    await expect(wrongPrediction).toBeChecked();

    await page.keyboard.press('Tab');
    await expect(page.getByTestId('event-loop-submit-prediction')).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page.getByTestId('event-loop-result')).toHaveCount(0);
    await expect(page.getByTestId('event-loop-checkpoint-feedback')).toHaveCount(0);
    await expect(page.getByText('Prediction locked. The trace now reveals the order one state at a time.')).toBeVisible();

    const startTrace = page.getByTestId('event-loop-start-trace');
    await startTrace.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('group', { name: 'Choose one scheduling outcome.' })).toBeVisible();

    const wrongCheckpoint = page.locator(
      `input[name="event-loop-checkpoint"][value="${WRONG_CHECKPOINT}"]`,
    );
    await wrongCheckpoint.focus();
    await page.keyboard.press('Space');
    await expect(wrongCheckpoint).toBeChecked();
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('event-loop-submit-checkpoint')).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page.getByTestId('event-loop-checkpoint-feedback')).toContainText('Common misconception');
    const drainMicrotasks = page.getByTestId('event-loop-drain-microtasks');
    await expect(drainMicrotasks).toBeEnabled();
    await drainMicrotasks.focus();
    await page.keyboard.press('Enter');

    await expect(page.getByRole('group', { name: 'Choose the accurate browser-runtime rule.' })).toBeVisible();
    const wrongPaint = page.locator(
      `input[name="event-loop-paint"][value="${WRONG_PAINT}"]`,
    );
    await wrongPaint.focus();
    await page.keyboard.press('Space');
    await expect(wrongPaint).toBeChecked();
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('event-loop-submit-paint')).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page.getByTestId('event-loop-paint-feedback')).toContainText('Watch the checkpoint boundary');
    const finishTrace = page.getByTestId('event-loop-finish-trace');
    await expect(finishTrace).toBeEnabled();
    await finishTrace.focus();
    await page.keyboard.press('Enter');

    const result = page.getByTestId('event-loop-result');
    await expect(result).toContainText('Your first-answer score: 0 / 3');
    await expect(result).toContainText('start → end → promise → timer');
    await expect(result).toContainText('current task → drain microtasks → browser may render → next task');
    await expect(page.getByTestId('event-loop-related-challenge')).toHaveAttribute(
      'href',
      RELATED_CHALLENGE_ROUTE,
    );
    const completedA11y = await new AxeBuilder({ page })
      .include('[data-testid="javascript-event-loop-experience"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(completedA11y.violations).toEqual([]);

    expect(hydrationIssues(runtimeIssues)).toEqual([]);
  });

  test('has no document overflow before or after completion at supported widths', async ({ page }) => {
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      await loadDeferredLab(page);
      await expectNoDocumentOverflow(page, `${viewport.width}px initial`);

      await completeWithWrongAnswers(page);
      await expectNoDocumentOverflow(page, `${viewport.width}px complete`);
    }
  });

  test('keeps state changes immediate and understandable with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await loadDeferredLab(page);

    const motionContract = await page.locator('.event-loop-experience__choice').first().evaluate((element) => {
      const style = getComputedStyle(element);
      const toMilliseconds = (rawValue: string): number => {
        const value = Number.parseFloat(rawValue);
        return rawValue.trim().endsWith('ms') ? value : value * 1_000;
      };

      return {
        prefersReducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
        transitionDurationsMs: style.transitionDuration.split(',').map(toMilliseconds),
        animationDurationsMs: style.animationDuration.split(',').map(toMilliseconds),
      };
    });

    expect(motionContract.prefersReducedMotion).toBe(true);
    expect(motionContract.transitionDurationsMs.every((duration) => duration <= 0.02)).toBe(true);
    expect(motionContract.animationDurationsMs.every((duration) => duration <= 0.02)).toBe(true);

    await page.locator(`input[name="event-loop-prediction"][value="${WRONG_PREDICTION}"]`).check();
    await page.getByTestId('event-loop-submit-prediction').click();
    await expect(page.getByTestId('event-loop-start-trace')).toBeVisible();
    await expect(page.getByText('Prediction locked. The trace now reveals the order one state at a time.')).toBeVisible();
  });

  test('keeps the defer placeholder and initial lab shell height stable', async ({ page }) => {
    for (const viewport of [
      { width: 1366, height: 420 },
      { width: 390, height: 420 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(EVENT_LOOP_ROUTE);

      const slot = page.getByTestId('javascript-event-loop-experience-slot');
      await expect(page.getByTestId('event-loop-experience-placeholder')).toBeAttached();
      const placeholderHeight = await slot.evaluate((element) => element.getBoundingClientRect().height);

      await slot.scrollIntoViewIfNeeded();
      const lab = page.getByTestId('javascript-event-loop-experience');
      await expect(lab).toBeVisible();
      const labHeight = await slot.evaluate((element) => element.getBoundingClientRect().height);
      const labCardHeight = await lab.evaluate((element) => element.getBoundingClientRect().height);

      expect.soft(
        Math.abs(labHeight - placeholderHeight),
        `${viewport.width}px placeholder=${placeholderHeight} lab=${labHeight}`,
      ).toBeLessThanOrEqual(48);
      expect.soft(
        labHeight - labCardHeight,
        `${viewport.width}px slot=${labHeight} card=${labCardHeight}`,
      ).toBeLessThanOrEqual(64);
    }
  });

  test('does not download the event-loop lab chunk on a generic trivia route', async ({ page }) => {
    const scriptBodies: Array<Promise<{ url: string; body: string } | null>> = [];

    page.on('response', (response) => {
      if (response.request().resourceType() !== 'script') return;
      scriptBodies.push(
        response.text()
          .then((body) => ({ url: response.url(), body }))
          .catch(() => null),
      );
    });

    await page.goto(GENERIC_TRIVIA_ROUTE);
    await expect(page.getByTestId('trivia-detail-main')).toBeVisible();
    await page.waitForLoadState('networkidle');

    const scripts = (await Promise.all(scriptBodies)).filter(
      (script): script is { url: string; body: string } => script !== null,
    );
    expect(scripts.length).toBeGreaterThan(0);
    expect(
      scripts
        .filter(({ url, body }) =>
          /javascript-event-loop-experience/i.test(url)
          || body.includes('promise_timer_render_v1'),
        )
        .map(({ url }) => url),
    ).toEqual([]);
  });
});
