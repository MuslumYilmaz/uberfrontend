import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import {
  OVERLAP_SCENARIOS,
  SEED_STREAM_SENTENCES,
} from '../src/app/features/trivia/trivia-detail/rxjs-overlap-playground/rxjs-overlap-playground.content';
import { RECOMMENDED_OPERATOR } from '../src/app/features/trivia/trivia-detail/rxjs-overlap-playground/rxjs-overlap-playground.model';

const PLAYGROUND_ROUTE = '/angular/trivia/rxjs-switchmap-mergemap-exhaustmap-concatmap-angular-when-to-use';
const CANCELLATION_ROUTE = '/angular/trivia/angular-http-what-actually-cancels-request';
const GENERIC_TRIVIA_ROUTE = '/angular/trivia/angular-services';
const VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 834, height: 1112 },
  { width: 1366, height: 900 },
  { width: 1440, height: 900 },
] as const;

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

async function loadDeferredLab(page: Page, route = PLAYGROUND_ROUTE): Promise<void> {
  await page.goto(route);
  const slot = page.getByTestId('rxjs-overlap-playground-slot');
  await expect(slot).toBeAttached();
  await slot.scrollIntoViewIfNeeded();
  await expect(page.getByTestId('rxjs-overlap-playground')).toBeVisible();
  await expect(page.getByTestId('rxjs-overlap-playground-placeholder')).toHaveCount(0);
}

async function revealScenario(page: Page, id: string): Promise<void> {
  await page.getByTestId(`overlap-scenario-${id}`).click();
  await page.locator('input[name="overlap-prediction"]').first().check();
  await page.getByTestId('overlap-reveal').click();
  await expect(page.getByTestId('overlap-verdict')).toBeVisible();
}

async function expectNoDocumentOverflow(page: Page, label: string): Promise<void> {
  const metrics = await page.evaluate(() => {
    const documentRoot = document.documentElement;
    const lab = document.querySelector<HTMLElement>('[data-testid="rxjs-overlap-playground"]');
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

async function expectNoAxeViolations(page: Page, label: string): Promise<void> {
  const results = await new AxeBuilder({ page })
    .include('[data-testid="rxjs-overlap-playground"]')
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  expect(results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    targets: violation.nodes.slice(0, 3).map((node) => node.target),
  })), label).toEqual([]);
}

test.describe('RxJS overlap playground lab', () => {
  test.use({ consoleErrorAllowlist: ['\\/api\\/auth\\/me'] });

  test('hydrates the deferred lab and lets a keyboard user predict, reveal, and repair a race', async ({ page }) => {
    const runtimeIssues = collectRuntimeIssues(page);
    await loadDeferredLab(page);

    await expect(page.getByRole('heading', {
      level: 2,
      name: 'Run the same trigger stream through switchMap, mergeMap, concatMap, and exhaustMap',
    })).toBeVisible();
    await expect(page.locator('[data-testid^="overlap-lane-"]')).toHaveCount(1);
    await expect(page.locator('input[name="overlap-prediction"]')).toHaveCount(4);
    await expectNoAxeViolations(page, 'initial');

    const chip = page.getByTestId('overlap-scenario-stale-overwrite');
    await chip.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('overlap-scenario-card')).toContainText('The slow old response arrives last and wins');
    await expect(page.getByTestId('overlap-stream')).toContainText('A at 0 ms (500 ms request), B at 100 ms (200 ms request)');

    const wrongChoice = page.locator('input[name="overlap-prediction"][value="B@300"]');
    await wrongChoice.focus();
    await page.keyboard.press('Space');
    await expect(wrongChoice).toBeChecked();
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('overlap-reveal')).toBeFocused();
    await page.keyboard.press('Enter');

    const verdict = page.getByTestId('overlap-verdict');
    await expect(verdict).toBeFocused();
    await expect(verdict).toHaveAttribute('data-fit', 'false');
    await expect(verdict).toContainText('mergeMap breaks the promise');
    await expect(page.getByTestId('overlap-prediction-feedback')).toHaveAttribute('data-correct', 'false');
    await expect(page.locator('[data-testid="overlap-hazards"] li[data-hazard="stale-overwrite"]')).toHaveCount(1);
    await expect(page.getByTestId('overlap-ui-mergeMap')).toHaveText('UI shows: B at 300 ms, then A at 500 ms');
    await expect(page.locator('[data-testid="overlap-lane-text-mergeMap"] li')).toHaveCount(2);

    const applyFix = page.getByTestId('overlap-apply-fix');
    await applyFix.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('overlap-verdict')).toHaveAttribute('data-fit', 'true');
    await expect(page.getByTestId('overlap-ui-switchMap')).toHaveText('UI shows: B at 300 ms');
    await expect(page.locator('[data-testid="overlap-lane-switchMap"] .overlap-lab__tail')).toHaveCount(1);
    await expect(page.getByTestId('overlap-related-http-cancel')).toHaveAttribute('href', CANCELLATION_ROUTE);
    await expect(page.getByTestId('overlap-related-http-cancel-switchmap')).toHaveAttribute(
      'href',
      `${CANCELLATION_ROUTE}#cancellation-scenario-switch-map`,
    );
    await expectNoAxeViolations(page, 'after fix');

    expect(hydrationIssues(runtimeIssues)).toEqual([]);
  });

  test('replays every preset to its documented UI result and hazards, then repairs it', async ({ page }) => {
    await loadDeferredLab(page);

    for (const scenario of OVERLAP_SCENARIOS) {
      await revealScenario(page, scenario.id);
      const operator = scenario.preset.operator;
      await expect(page.getByTestId(`overlap-ui-${operator}`), scenario.id).toHaveText(`UI shows: ${scenario.expectedUiSummary}`);
      const hazards = await page.locator('[data-testid="overlap-hazards"] li').evaluateAll((items) =>
        items.map((item) => item.getAttribute('data-hazard')).sort());
      expect(hazards, scenario.id).toEqual([...scenario.expectedHazards].sort());
      await expect(page.getByTestId('overlap-verdict'), scenario.id).toHaveAttribute('data-fit', 'false');

      await page.getByTestId('overlap-apply-fix').click();
      const fixed = RECOMMENDED_OPERATOR[scenario.preset.intent];
      await expect(page.getByTestId(`overlap-ui-${fixed}`), `${scenario.id} fixed`).toHaveText(`UI shows: ${scenario.expectedFixUiSummary}`);
      await expect(page.getByTestId('overlap-verdict'), `${scenario.id} fixed`).toHaveAttribute('data-fit', 'true');
    }

    await expect(page.getByTestId('overlap-score')).toContainText('Scenarios revealed: 7 of 7.');
  });

  test('compares all four operators on the seed stream and on a custom burst', async ({ page }) => {
    await loadDeferredLab(page);

    await page.getByTestId('overlap-view-compare').click();
    await expect(page.locator('[data-testid^="overlap-lane-"]')).toHaveCount(4);
    await expect(page.getByTestId('overlap-prediction')).toHaveCount(0);
    await page.getByTestId('overlap-reveal').click();

    const compare = page.getByTestId('overlap-compare');
    await expect(compare).toBeVisible();
    await expect(compare.locator('tbody tr')).toHaveCount(4);
    await expect(page.getByTestId('overlap-ui-switchMap')).toHaveText('UI shows: B at 400 ms');
    await expect(page.getByTestId('overlap-ui-mergeMap')).toHaveText('UI shows: A at 300 ms, then B at 400 ms');
    await expect(page.getByTestId('overlap-ui-concatMap')).toHaveText('UI shows: A at 300 ms, then B at 600 ms');
    await expect(page.getByTestId('overlap-ui-exhaustMap')).toHaveText('UI shows: A at 300 ms');
    await expect(compare.locator('tr[data-operator="switchMap"]')).toHaveAttribute('data-fit', 'true');
    for (const sentence of SEED_STREAM_SENTENCES) {
      expect(sentence.length).toBeGreaterThan(20);
    }

    await page.getByTestId('overlap-editor').locator('summary').click();
    await page.getByTestId('overlap-burst-fast-typing').click();
    await expect(page.getByTestId('overlap-trigger-count')).toHaveText('4 of 6 triggers');
    await expect(page.getByTestId('overlap-stage')).toHaveText('Ready to reveal');
    await page.getByTestId('overlap-reveal').click();
    await expect(page.getByTestId('overlap-ui-switchMap')).toHaveText('UI shows: D at 540 ms');
    await expect(page.getByTestId('overlap-ui-exhaustMap')).toHaveText('UI shows: A at 300 ms');
    await expect(page.getByTestId('overlap-score')).toContainText('Compare runs: 2.');
  });

  test('lets a keyboard user build a custom stream without overflow', async ({ page }) => {
    await loadDeferredLab(page);

    await page.getByTestId('overlap-editor').locator('summary').click();
    await expect(page.getByTestId('overlap-add-trigger')).toBeVisible();
    await page.getByTestId('overlap-add-trigger').click();
    await expect(page.getByTestId('overlap-trigger-count')).toHaveText('3 of 6 triggers');
    const thirdTime = page.locator('[data-testid="overlap-triggers"] > li').nth(2).locator('input[type="number"]').first();
    await expect(thirdTime).toBeFocused();
    await thirdTime.fill('50');
    await thirdTime.press('Tab');
    await expect(page.getByTestId('overlap-stream')).toContainText('A at 0 ms, B at 50 ms, C at 100 ms');

    const firstRequest = page.locator('[data-testid="overlap-triggers"] > li').first().locator('input[type="number"]').nth(1);
    await firstRequest.fill('600');
    await firstRequest.press('Tab');
    await expect(page.getByTestId('overlap-stream')).toContainText('A at 0 ms (600 ms request)');

    const duration = page.getByTestId('overlap-duration');
    await duration.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('overlap-duration-value')).toHaveText('350 ms');

    await page.locator('[data-testid^="overlap-remove-"]').last().click();
    await expect(page.getByTestId('overlap-trigger-count')).toHaveText('2 of 6 triggers');
    await expectNoDocumentOverflow(page, 'custom stream');
  });

  test('preselects a scenario from the URL fragment', async ({ page }) => {
    await page.goto(`${PLAYGROUND_ROUTE}#overlap-scenario-cancel-not-server`);
    const slot = page.getByTestId('rxjs-overlap-playground-slot');
    await slot.scrollIntoViewIfNeeded();
    await expect(page.getByTestId('rxjs-overlap-playground')).toBeVisible();

    await expect(page.getByTestId('overlap-scenario-card')).toContainText('switchMap cancelled the client, the server still charged');
    await expect(page.locator('input[name="overlap-operator"][value="switchMap"]')).toBeChecked();
    await expect(page.locator('#overlap-scenario-cancel-not-server')).toHaveCount(1);
  });

  test('has no document overflow in single, compare, and revealed states at supported widths', async ({ page }) => {
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      await loadDeferredLab(page);
      await expectNoDocumentOverflow(page, `${viewport.width}px initial`);

      await revealScenario(page, 'typeahead-search');
      await expectNoDocumentOverflow(page, `${viewport.width}px revealed`);

      await page.getByTestId('overlap-view-compare').click();
      await page.getByTestId('overlap-reveal').click();
      await expect(page.getByTestId('overlap-compare')).toBeVisible();
      await expectNoDocumentOverflow(page, `${viewport.width}px compare`);
    }
  });

  test('keeps state changes immediate with reduced motion and still steps the cursor', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await loadDeferredLab(page);

    const motionContract = await page.locator('.overlap-lab__radio').first().evaluate((element) => {
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

    await page.locator('input[name="overlap-prediction"][value="B@400"]').check();
    await page.getByTestId('overlap-reveal').click();
    await expect(page.getByTestId('overlap-verdict')).toContainText('switchMap fits');
    await expect(page.getByTestId('overlap-play')).toHaveCount(0);
    await page.getByTestId('overlap-prev-event').click();
    await expect(page.getByTestId('overlap-cursor-value')).toHaveText('400 ms');
    await page.getByTestId('overlap-next-event').click();
    await expect(page.getByTestId('overlap-cursor-value')).toHaveText('1200 ms');
  });

  test('keeps the defer placeholder and initial lab shell height stable', async ({ page }) => {
    for (const viewport of [
      { width: 1366, height: 420 },
      { width: 390, height: 420 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(PLAYGROUND_ROUTE);

      const slot = page.getByTestId('rxjs-overlap-playground-slot');
      await expect(page.getByTestId('rxjs-overlap-playground-placeholder')).toBeAttached();
      const placeholderHeight = await slot.evaluate((element) => element.getBoundingClientRect().height);

      await slot.scrollIntoViewIfNeeded();
      const lab = page.getByTestId('rxjs-overlap-playground');
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

  test('does not download the playground chunk on a generic Angular trivia route', async ({ page }) => {
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
          /rxjs-overlap-playground/i.test(url)
          || body.includes('trigger_duration_overridden'),
        )
        .map(({ url }) => url),
    ).toEqual([]);
  });
});
