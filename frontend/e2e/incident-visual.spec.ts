import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';
import type { IncidentListItem, IncidentScenario, IncidentStage } from '../src/app/core/models/incident.model';
import { test, expect } from './fixtures';
import { buildMockUser, installAuthMock } from './auth-mocks';

test.use({ reducedMotion: 'reduce', colorScheme: 'dark', headless: true });

// Capture these references against the unchanged production build before
// modifying the incident renderer; compare the replacement build without -u.
// Committed references were captured with Chromium on macOS (Darwin).
const catalogPath = path.resolve(process.cwd(), '../cdn/incidents');
const freeIncidents = (JSON.parse(readFileSync(path.join(catalogPath, 'index.json'), 'utf8')) as IncidentListItem[])
  .filter((incident) => incident.access === 'free')
  .map((incident) => JSON.parse(readFileSync(path.join(catalogPath, incident.id, 'scenario.json'), 'utf8')) as IncidentScenario);

async function prepare(page: Page) {
  await page.clock.setFixedTime(new Date('2026-10-05T10:00:00Z'));
  await installAuthMock(page, {
    token: 'incident-visual-guest',
    user: buildMockUser({ _id: 'incident-visual-guest', username: 'incident_visual' }),
  });
  await page.addInitScript(() => {
    localStorage.setItem('fa:exp:assignment:premium_gate_copy_v1', 'value');
    localStorage.setItem('fa:exp:assignment:signup_prompt_copy_v1', 'benefit');
  });
}

async function capture(page: Page, name: string) {
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(0, 0);
  // The submit handler schedules mobile feedback scrolling in requestAnimationFrame.
  // Let that callback run before restoring the same screenshot position.
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await page.evaluate(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.querySelectorAll<HTMLElement>('main, .layout-content, .content').forEach((element) => {
      element.scrollTop = 0;
    });
  });
  await expect.poll(() => page.evaluate(async () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    return window.scrollY;
  })).toBe(0);
  await expect(page.locator('.incident-stage-card:visible')).toHaveCount(1);
  await expect(page.locator('.incident-step-nav__item[aria-current="step"]')).toHaveCount(1);
  await expect(page.locator('.incident-action-bar__meta span:visible')).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await expect(page).toHaveScreenshot(`${name}.png`, {
    fullPage: true,
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixels: 0,
  });
}

async function chooseBestAnswer(page: Page, stage: IncidentStage, captureReordering?: string) {
  const panel = page.getByTestId(`incident-stage-${stage.id}`);
  if (stage.type === 'single-select') {
    const best = stage.options.reduce((current, option) => option.points > current.points ? option : current);
    await panel.getByRole('radio', { name: best.label, exact: true }).click();
    await expect(panel.getByRole('radio', { name: best.label, exact: true })).toHaveAttribute('aria-checked', 'true');
    return;
  }
  if (stage.type === 'multi-select') {
    for (const option of stage.options.filter((option) => option.points > 0)) {
      await panel.getByRole('checkbox', { name: option.label, exact: true }).click();
      await expect(panel.getByRole('checkbox', { name: option.label, exact: true })).toHaveAttribute('aria-checked', 'true');
    }
    return;
  }

  const order = stage.candidates.map((candidate) => candidate.id);
  const rowFor = (id: string) => panel.locator('.incident-priority__item').filter({
    has: page.locator('.incident-priority__title', {
      hasText: stage.candidates.find((candidate) => candidate.id === id)!.label,
    }),
  });
  // Exercise actual ordering controls, even when content starts in ideal order.
  await rowFor(order[0]).getByRole('button', { name: 'Down', exact: true }).click();
  [order[0], order[1]] = [order[1], order[0]];
  if (captureReordering) await capture(page, captureReordering);

  for (const [targetIndex, id] of stage.expectedOrder.entries()) {
    let currentIndex = order.indexOf(id);
    while (currentIndex > targetIndex) {
      await rowFor(id).getByRole('button', { name: 'Up', exact: true }).click();
      [order[currentIndex - 1], order[currentIndex]] = [order[currentIndex], order[currentIndex - 1]];
      currentIndex--;
    }
  }
  await expect(panel.locator('.incident-priority__title')).toHaveText(
    order.map((id) => stage.candidates.find((candidate) => candidate.id === id)!.label),
  );
}

test.describe('Incident production visual contract', () => {
  test.skip(process.env.INCIDENT_VISUAL !== '1', 'Opt in with INCIDENT_VISUAL=1; reference screenshots are platform-specific.');
  test.skip(process.platform !== 'darwin', 'Committed incident screenshot references were captured on macOS (Darwin).');
  test.skip(({ browserName }) => browserName !== 'chromium', 'References use Chromium.');

  for (const scenario of freeIncidents) {
    const widths = scenario.meta.id === 'stale-search-race' ? [360, 390, 834, 1366, 1440] : [390, 1440];
    for (const width of widths) {
      test(`${scenario.meta.id} keeps its complete flow at ${width}px`, async ({ page }) => {
        test.setTimeout(120_000);
        await page.setViewportSize({ width, height: 900 });
        await prepare(page);
        await page.goto(`/incidents/${scenario.meta.id}`);
        await expect(page.getByRole('heading', { name: scenario.meta.title, exact: true })).toBeVisible();
        await page.waitForLoadState('networkidle');
        await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;scroll-behavior:auto!important}' });
        const name = `${scenario.meta.id}-${width}`;
        const detailed = scenario.meta.id === 'stale-search-race';
        await capture(page, `${name}-overview`);
        await page.getByRole('button', { name: 'Begin simulator', exact: true }).click();

        for (const [index, stage] of scenario.stages.entries()) {
          const panel = page.getByTestId(`incident-stage-${stage.id}`);
          await expect(panel).toBeVisible();
          await expect(page.getByTestId(`incident-feedback-${stage.id}`)).toBeHidden();
          await expect(page.locator('.incident-action-bar__meta')).toHaveText(`Stage ${index + 1} of ${scenario.stages.length}`);
          await chooseBestAnswer(page, stage, detailed && stage.type === 'priority-order' ? `${name}-priority-reordered` : undefined);
          if (detailed && index === 0) await capture(page, `${name}-stage-1-selected`);
          await page.getByRole('button', { name: 'Submit response', exact: true }).click();
          await expect(page.getByTestId(`incident-feedback-${stage.id}`)).toBeVisible();
          await expect(panel.getByRole('heading', { name: 'Strong call', exact: true })).toBeVisible();
          await capture(page, `${name}-stage-${index + 1}-submitted`);
          await page.getByRole('button', {
            name: index < scenario.stages.length - 1 ? 'Next stage' : 'View debrief', exact: true,
          }).click();
        }

        await expect(page.getByTestId('incident-debrief')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Passed · 100/100', exact: true })).toBeVisible();
        await capture(page, `${name}-debrief`);
        await page.getByRole('button', { name: 'Replay', exact: true }).click();
        await expect(page.getByRole('heading', { name: 'What failed in production?', exact: true })).toBeVisible();
        await expect(page.locator('.incident-stage-card:visible')).toHaveCount(1);
        await expect(page.getByRole('button', { name: 'Debrief', exact: true })).toBeDisabled();
        if (detailed) await capture(page, `${name}-replay`);
      });
    }
  }
});
