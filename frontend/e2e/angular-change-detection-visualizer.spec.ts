import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import {
  CD_DIAGNOSIS_HEADINGS,
  CD_SCENARIOS,
} from '../src/app/features/trivia/trivia-detail/angular-change-detection-visualizer/angular-change-detection-visualizer.content';

const VISUALIZER_ROUTE = '/angular/trivia/angular-change-detection-strategies';
const SIBLING_ROUTE = '/angular/trivia/angular-onpush-change-detection-debugging-real-bug';
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

async function loadDeferredLab(page: Page, route = VISUALIZER_ROUTE): Promise<void> {
  await page.goto(route);
  const slot = page.getByTestId('angular-change-detection-visualizer-slot');
  await expect(slot).toBeAttached();
  await slot.scrollIntoViewIfNeeded();
  await expect(page.getByTestId('angular-change-detection-visualizer')).toBeVisible();
  await expect(page.getByTestId('angular-change-detection-visualizer-placeholder')).toHaveCount(0);
}

async function runScenario(page: Page, id: string): Promise<void> {
  await page.getByTestId(`cd-scenario-${id}`).click();
  await page.getByTestId('cd-run-scenario').click();
}

async function expectNoDocumentOverflow(page: Page, label: string): Promise<void> {
  const metrics = await page.evaluate(() => {
    const documentRoot = document.documentElement;
    const lab = document.querySelector<HTMLElement>('[data-testid="angular-change-detection-visualizer"]');
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
    .include('[data-testid="angular-change-detection-visualizer"]')
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  expect(results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    targets: violation.nodes.slice(0, 3).map((node) => node.target),
  })), label).toEqual([]);
}

test.describe('Angular change detection visualizer lab', () => {
  test.use({ consoleErrorAllowlist: ['\\/api\\/auth\\/me'] });

  test('hydrates the deferred lab and lets a keyboard user run, diagnose, and repair a bug', async ({ page }) => {
    const runtimeIssues = collectRuntimeIssues(page);
    await loadDeferredLab(page);

    await expect(page.getByRole('heading', {
      level: 2,
      name: 'Simulate Angular change detection: Default vs OnPush vs zoneless',
    })).toBeVisible();
    await expect(page.getByTestId('cd-tree').locator('> li')).toHaveCount(7);
    await expect(page.locator('[data-testid^="cd-trigger-"]')).toHaveCount(10);
    await expect(page.getByTestId('cd-trace-empty')).toBeVisible();
    await expectNoAxeViolations(page, 'initial');

    const scenarioChip = page.getByTestId('cd-scenario-push-mutation');
    await scenarioChip.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('cd-scenario-card')).toContainText('The list keeps the old users after push()');
    await expect(page.getByTestId('cd-strategy-list')).toHaveText('OnPush');

    const run = page.getByTestId('cd-run-scenario');
    await run.focus();
    await page.keyboard.press('Enter');

    await expect(page.getByTestId('cd-checked-count')).toHaveText('Checked 3 of 7');
    await expect(page.getByTestId('cd-trace').locator('> li')).toHaveCount(7);
    await expect(page.locator('[data-node="list"]')).toHaveAttribute('data-outcome', 'skipped');
    await expect(page.locator('[data-node="list"]')).toHaveAttribute('data-stale', 'true');
    await expect(page.locator('[data-node="item-1"]')).toHaveAttribute('data-outcome', 'skipped');
    await expect(page.locator('[data-node="footer"]')).toHaveAttribute('data-outcome', 'checked');
    const diagnosis = page.getByTestId('cd-diagnosis');
    await expect(diagnosis).toContainText('Stale: same input reference');
    await expect(diagnosis).toContainText('Pass a new reference');
    await expect(diagnosis).toBeFocused();

    const applyFix = page.getByTestId('cd-apply-fix');
    await applyFix.focus();
    await page.keyboard.press('Enter');

    await expect(page.getByTestId('cd-diagnosis')).toHaveCount(0);
    await expect(page.getByTestId('cd-fresh')).toContainText('Fresh: 4 of 7 views checked, every value matches');
    await expect(page.locator('[data-node="list"]')).toHaveAttribute('data-outcome', 'updated');
    await expect(page.locator('[data-node="list"]')).toHaveAttribute('data-stale', 'false');
    await expect(page.getByTestId('cd-related-onpush-bug')).toHaveAttribute('href', SIBLING_ROUTE);
    await expectNoAxeViolations(page, 'after fix');

    expect(hydrationIssues(runtimeIssues)).toEqual([]);
  });

  test('replays every preset bug to its documented check count, diagnosis, and fix', async ({ page }) => {
    await loadDeferredLab(page);

    for (const scenario of CD_SCENARIOS) {
      await runScenario(page, scenario.id);
      await expect(page.getByTestId('cd-checked-count'), scenario.id).toHaveText(`Checked ${scenario.expectedCheckedCount} of 7`);

      if (scenario.expectedDiagnosis) {
        await expect(page.getByTestId('cd-diagnosis'), scenario.id).toContainText(CD_DIAGNOSIS_HEADINGS[scenario.expectedDiagnosis]);
        await page.getByTestId('cd-apply-fix').click();
        await expect(page.getByTestId('cd-fresh'), `${scenario.id} fixed`).toContainText(
          `Fresh: ${scenario.expectedFixedCheckedCount} of 7 views checked`,
        );
      } else {
        await expect(page.getByTestId('cd-diagnosis'), scenario.id).toHaveCount(0);
        await expect(page.getByTestId('cd-fresh'), scenario.id).toContainText('Fresh: 1 of 7 views checked');
        await expect(page.locator('[data-node="app"]')).toHaveAttribute('data-outcome', 'traversed');
      }
    }

    const zonelessRadio = page.locator('input[name="cd-mode"][value="zoneless"]');
    await expect(zonelessRadio).toBeChecked();
    await page.locator('input[name="cd-mode"][value="zone"]').check();
    await page.getByTestId('cd-run-scenario').click();
    await expect(page.getByTestId('cd-checked-count')).toHaveText('Checked 7 of 7');
  });

  test('preselects a scenario from the URL fragment used by the sibling page', async ({ page }) => {
    await page.goto(`${VISUALIZER_ROUTE}#cd-scenario-zoneless-timer`);
    const slot = page.getByTestId('angular-change-detection-visualizer-slot');
    await slot.scrollIntoViewIfNeeded();
    await expect(page.getByTestId('angular-change-detection-visualizer')).toBeVisible();

    await expect(page.getByTestId('cd-scenario-card')).toContainText('Default everywhere, but zoneless skips the timer');
    await expect(page.locator('input[name="cd-mode"][value="zoneless"]')).toBeChecked();
    await expect(page.locator('#cd-scenario-zoneless-timer')).toHaveCount(1);
  });

  test('has no document overflow before or after a run at supported widths', async ({ page }) => {
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      await loadDeferredLab(page);
      await expectNoDocumentOverflow(page, `${viewport.width}px initial`);

      await runScenario(page, 'manual-subscribe');
      await expect(page.getByTestId('cd-diagnosis')).toBeVisible();
      await expectNoDocumentOverflow(page, `${viewport.width}px diagnosed`);

      await page.getByTestId('cd-apply-fix').click();
      await expect(page.getByTestId('cd-fresh')).toBeVisible();
      await expectNoDocumentOverflow(page, `${viewport.width}px fixed`);
    }
  });

  test('keeps state changes immediate with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await loadDeferredLab(page);

    const motionContract = await page.locator('.cd-lab__radio').first().evaluate((element) => {
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

    await runScenario(page, 'timer-in-service');
    await expect(page.getByTestId('cd-diagnosis')).toContainText('Stale: OnPush saw no trigger');
  });

  test('keeps the defer placeholder and initial lab shell height stable', async ({ page }) => {
    for (const viewport of [
      { width: 1366, height: 420 },
      { width: 390, height: 420 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(VISUALIZER_ROUTE);

      const slot = page.getByTestId('angular-change-detection-visualizer-slot');
      await expect(page.getByTestId('angular-change-detection-visualizer-placeholder')).toBeAttached();
      const placeholderHeight = await slot.evaluate((element) => element.getBoundingClientRect().height);

      await slot.scrollIntoViewIfNeeded();
      const lab = page.getByTestId('angular-change-detection-visualizer');
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

  test('does not download the visualizer chunk on a generic Angular trivia route', async ({ page }) => {
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
          /angular-change-detection-visualizer/i.test(url)
          || body.includes('manual-subscribe-no-mark'),
        )
        .map(({ url }) => url),
    ).toEqual([]);
  });
});
