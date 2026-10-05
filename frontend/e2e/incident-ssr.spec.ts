import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse, type DefaultTreeAdapterMap } from 'parse5';
import type { Page } from '@playwright/test';
import type { IncidentListItem, IncidentScenario, IncidentSessionState, IncidentStage } from '../src/app/core/models/incident.model';
import { test, expect } from './fixtures';
import { buildMockUser, installAuthMock } from './auth-mocks';

const catalogRoot = resolve(__dirname, '../../cdn/incidents');
const index = JSON.parse(readFileSync(resolve(catalogRoot, 'index.json'), 'utf8')) as IncidentListItem[];
const scenarios = index.map(({ id }) => JSON.parse(
  readFileSync(resolve(catalogRoot, id, 'scenario.json'), 'utf8'),
) as IncidentScenario);
const freeScenarios = scenarios.filter(({ meta }) => meta.access === 'free');
const premiumScenarios = scenarios.filter(({ meta }) => meta.access === 'premium');
const race = scenarios.find(({ meta }) => meta.id === 'stale-search-race')!;
const sessionKey = (id: string, scope = 'guest') => `fa:practice:session:v3:${scope}:incident:${id}`;
const progressKey = (scope = 'guest') => `fa:practice:progress:v3:${scope}`;
const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();

type HtmlNode = DefaultTreeAdapterMap['node'];
type HtmlElement = DefaultTreeAdapterMap['element'];
function elements(node: HtmlNode): HtmlElement[] {
  if ('tagName' in node && ['script', 'style', 'template'].includes(node.tagName)) return [];
  return [
    ...('tagName' in node ? [node] : []),
    ...('childNodes' in node ? node.childNodes.flatMap(elements) : []),
  ];
}
function attr(node: HtmlElement, name: string): string | undefined {
  return node.attrs.find((entry) => entry.name === name)?.value;
}
function htmlText(node: HtmlNode): string {
  if ('tagName' in node && ['script', 'style', 'template'].includes(node.tagName)) return '';
  if (node.nodeName === '#text') return (node as DefaultTreeAdapterMap['textNode']).value;
  return 'childNodes' in node ? node.childNodes.map(htmlText).join(' ') : '';
}
function byTestId(nodes: HtmlElement[], id: string): HtmlElement {
  const found = nodes.filter((node) => attr(node, 'data-testid') === id);
  expect(found, `${id} must occur once in real HTML`).toHaveLength(1);
  return found[0];
}

function bestAnswer(stage: IncidentStage): string | string[] {
  if (stage.type === 'priority-order') {
    return [...stage.expectedOrder, ...stage.candidates.map(({ id }) => id).filter((id) => !stage.expectedOrder.includes(id))];
  }
  if (stage.type === 'multi-select') return stage.options.filter(({ points }) => points > 0).map(({ id }) => id);
  return [...stage.options].sort((a, b) => b.points - a.points)[0].id;
}
function savedSession(scenario: IncidentScenario, activeStepIndex: number): IncidentSessionState {
  const submitted = scenario.stages.slice(0, activeStepIndex - 1);
  return {
    activeStepIndex,
    submittedStageIds: submitted.map(({ id }) => id),
    answers: Object.fromEntries(submitted.map((stage) => [stage.id, bestAnswer(stage)])),
  };
}
async function seedStorage(page: Page, values: Record<string, unknown>) {
  await page.addInitScript((entries) => {
    if (sessionStorage.getItem('incident-e2e-seeded')) return;
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, JSON.stringify(value));
    sessionStorage.setItem('incident-e2e-seeded', '1');
  }, values);
}
async function expectStep(page: Page, scenario: IncidentScenario, step: number) {
  const panel = step === 0
    ? page.locator('.incident-stage-card--overview')
    : step === scenario.stages.length + 1
      ? page.getByTestId('incident-debrief')
      : page.getByTestId(`incident-stage-${scenario.stages[step - 1].id}`);
  await expect(panel).toBeVisible();
  await expect(page.locator('.incident-stage-card:visible')).toHaveCount(1);
  await expect(page.locator('.incident-step-nav__item[aria-current="step"]')).toHaveCount(1);
  await expect(page.locator('.incident-step-nav__item[aria-current="step"]')).toHaveText(
    step === 0 ? 'Overview' : step === scenario.stages.length + 1 ? 'Debrief' : String(step),
  );
  await expect(page.locator('.incident-action-bar__meta > span')).toHaveCount(1);
  await expect(page.locator('.incident-action-bar__meta')).toHaveText(
    step === 0 ? 'Overview' : step === scenario.stages.length + 1 ? 'Debrief' : `Stage ${step} of ${scenario.stages.length}`,
  );
}

test.describe('incident initial HTML content', () => {
  test.skip(process.env.PLAYWRIGHT_SSR !== '1', 'Requires a production prerender server (PLAYWRIGHT_SSR=1).');

  for (const scenario of freeScenarios) {
    test(`${scenario.meta.id}: all educational content exists without JavaScript or clicks`, async ({ request }) => {
      const response = await request.get(`/incidents/${scenario.meta.id}`);
      expect(response.status()).toBe(200);
      const document = parse(await response.text());
      const nodes = elements(document);
      for (const stage of scenario.stages) {
        const panel = byTestId(nodes, `incident-stage-${stage.id}`);
        const text = normalize(htmlText(panel));
        expect(text).toContain(normalize(stage.prompt));
        if (stage.helperText) expect(text).toContain(normalize(stage.helperText));
        const feedback = normalize(htmlText(byTestId(nodes, `incident-feedback-${stage.id}`)));
        if (stage.type === 'priority-order') {
          for (const candidate of stage.candidates) expect(text).toContain(normalize(candidate.label));
          for (const expectedId of stage.expectedOrder) {
            const label = stage.candidates.find(({ id }) => id === expectedId)!.label;
            expect(feedback).toContain(normalize(`Expected: ${label}`));
          }
        } else {
          for (const option of stage.options) {
            expect(text).toContain(normalize(option.label));
            expect(feedback).toContain(normalize(option.feedback));
          }
        }
      }
      const debrief = normalize(htmlText(byTestId(nodes, 'incident-debrief')));
      for (const item of scenario.debrief.idealRunbook) expect(debrief).toContain(normalize(item));
      for (const block of scenario.debrief.teachingBlocks) {
        if ('title' in block && block.title) expect(debrief).toContain(normalize(block.title));
        for (const text of 'text' in block ? [block.text] : block.items) expect(debrief).toContain(normalize(text));
      }
      expect(debrief).not.toContain('Review again · 0/100');
      const robots = nodes.find((node) => node.tagName === 'meta' && attr(node, 'name') === 'robots');
      expect(robots && attr(robots, 'content')).not.toMatch(/noindex/i);
    });
  }

  for (const scenario of premiumScenarios) {
    test(`${scenario.meta.id}: anonymous HTML keeps solutions behind Premium`, async ({ request }) => {
      const response = await request.get(`/incidents/${scenario.meta.id}`);
      expect(response.status()).toBe(200);
      const document = parse(await response.text());
      const nodes = elements(document);
      expect(nodes.filter((node) => attr(node, 'data-testid') === 'incident-debrief')).toHaveLength(0);
      expect(nodes.filter((node) => (attr(node, 'class') || '').split(' ').includes('incident-stage-card'))).toHaveLength(0);
      const text = normalize(htmlText(document));
      for (const item of scenario.debrief.idealRunbook) expect(text).not.toContain(normalize(item));
      for (const stage of scenario.stages) {
        if (stage.type !== 'priority-order') {
          for (const option of stage.options) expect(text).not.toContain(normalize(option.feedback));
        }
      }
      const robots = nodes.find((node) => node.tagName === 'meta' && attr(node, 'name') === 'robots');
      expect(robots && attr(robots, 'content')).toMatch(/noindex/i);
    });
  }
});

test.describe('incident hydrated interaction and access', () => {
  test.use({ consoleErrorAllowlist: ['\\/api\\/auth\\/me'] });
  test.beforeEach(async ({ page }) => {
    // No request in this suite may reach a real backend. Auth/progress overrides below
    // retain the real request/response flow for access and persisted attempts.
    await page.addInitScript(() => {
      (window as Window & { __FA_API_BASE__?: string }).__FA_API_BASE__ = window.location.origin;
    });
    await page.route('**/api/**', (route) => route.fulfill({ status: 200, json: {} }));
    await installAuthMock(page, { token: 'incident-e2e-token', user: buildMockUser() });
  });

  for (const scenario of freeScenarios) {
    test(`${scenario.meta.id}: fresh load shows only Overview and keeps later steps locked`, async ({ page }) => {
      await page.goto(`/incidents/${scenario.meta.id}`);
      await expectStep(page, scenario, 0);
      await expect(page.getByRole('button', { name: '2', exact: true })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Debrief', exact: true })).toBeDisabled();
      await expect(page.locator('.incident-feedback:visible')).toHaveCount(0);
      await page.getByRole('button', { name: 'Begin simulator', exact: true }).click();
      await expectStep(page, scenario, 1);
      await expect(page.getByRole('button', { name: 'Submit response', exact: true })).toBeDisabled();
      await page.getByRole('button', { name: 'Previous', exact: true }).click();
      await expectStep(page, scenario, 0);
    });
  }

  for (const step of [1, 2, 4, 5]) {
    test(`reload resumes saved step ${step} without duplicate panels or lost best score`, async ({ page }) => {
      const session = savedSession(race, step);
      const reflection = 'Only the currently active query may commit a result.';
      await seedStorage(page, {
        [sessionKey(race.meta.id)]: session,
        [progressKey()]: {
          [`incident:${race.meta.id}`]: {
            family: 'incident', id: race.meta.id, started: true, completed: true,
            passed: true, bestScore: 100, lastPlayedAt: '2026-10-01T12:00:00.000Z',
            extension: { reflectionNote: reflection },
          },
        },
      });
      await page.goto(`/incidents/${race.meta.id}`);
      await expectStep(page, race, step);
      await expect(page.locator('.incident-hero__chips')).toContainText('Best 100/100');
      await page.reload();
      await expectStep(page, race, step);
      await expect(page.locator('.incident-hero__chips')).toContainText('Best 100/100');
      expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), sessionKey(race.meta.id))).toEqual(session);
      if (step === 5) {
        await expect(page.getByRole('heading', { name: 'Passed · 100/100', exact: true })).toBeVisible();
        await expect(page.getByTestId('incident-reflection-note')).toHaveValue(reflection);
      } else if (step > 1) {
        await page.getByRole('button', { name: String(step - 1), exact: true }).click();
        await expectStep(page, race, step - 1);
        await expect(page.getByTestId(`incident-feedback-${race.stages[step - 2].id}`)).toBeVisible();
      }
    });
  }

  test('complete attempt keeps feedback selection, score, keyboard focus, replay and route state', async ({ page }) => {
    await page.goto(`/incidents/${race.meta.id}`);
    // A prerendered button can be visible before Angular attaches its handlers.
    // Starting browser progress confirms that the interactive incident has mounted.
    await expect.poll(() => page.evaluate((id) => {
      const progress = JSON.parse(localStorage.getItem('fa:practice:progress:v3:guest') || '{}');
      return progress[`incident:${id}`]?.started === true;
    }, race.meta.id)).toBe(true);
    await page.getByRole('button', { name: 'Begin simulator', exact: true }).click();
    for (const [stageIndex, stage] of race.stages.entries()) {
      await expectStep(page, race, stageIndex + 1);
      const panel = page.getByTestId(`incident-stage-${stage.id}`);
      const answer = bestAnswer(stage);
      if (stage.type === 'priority-order') {
        const order = answer as string[];
        for (let i = 0; i < order.length; i += 1) {
          const up = panel.getByTestId(`incident-priority-up-${order[i]}`);
          const labels = (await panel.locator('.incident-priority__title').allTextContents()).map(normalize);
          const currentIndex = labels.indexOf(normalize(stage.candidates.find(({ id }) => id === order[i])!.label));
          expect(currentIndex).toBeGreaterThanOrEqual(i);
          for (let moves = currentIndex - i; moves > 0; moves -= 1) await up.click();
        }
        await panel.getByTestId(`incident-priority-down-${order[0]}`).click();
        await panel.getByTestId(`incident-priority-up-${order[0]}`).click();
      } else {
        for (const id of Array.isArray(answer) ? answer : [answer]) {
          await panel.getByTestId(`incident-option-${stage.id}-${id}`).click();
        }
      }
      await page.getByRole('button', { name: 'Submit response', exact: true }).click();
      const feedback = page.getByTestId(`incident-feedback-${stage.id}`);
      await expect(feedback).toBeVisible();
      await expect(feedback.locator('.incident-feedback__head')).toContainText('25/25');
      if (stage.type !== 'priority-order') {
        const selected = Array.isArray(answer) ? answer : [answer];
        await expect(feedback.locator('.incident-feedback__entry:visible')).toHaveCount(selected.length);
        for (const option of stage.options) {
          await expect(feedback.getByText(option.feedback, { exact: true })).toBeVisible({ visible: selected.includes(option.id) });
        }
      }
      const next = page.getByRole('button', { name: stageIndex === race.stages.length - 1 ? 'View debrief' : 'Next stage', exact: true });
      await next.focus();
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => document.activeElement?.closest('[hidden]') !== null)).toBe(false);
      await next.click();
    }
    await expectStep(page, race, 5);
    await expect(page.getByRole('heading', { name: 'Passed · 100/100', exact: true })).toBeVisible();
    await page.getByTestId('incident-reflection-note').fill('Guard cache and network commits with the active query.');
    await page.reload();
    await expectStep(page, race, 5);
    await expect(page.getByTestId('incident-reflection-note')).toHaveValue('Guard cache and network commits with the active query.');
    const adjacent = scenarios[scenarios.findIndex(({ meta }) => meta.id === race.meta.id) + 1];
    await page.getByRole('button', { name: 'Next incident', exact: true }).click();
    await expect(page).toHaveURL(`/incidents/${adjacent.meta.id}`);
    await expectStep(page, adjacent, 0);
    await expect(page.locator('.incident-hero__chips')).not.toContainText('Best 100/100');
    await page.goBack();
    await expectStep(page, race, 5);
    await expect(page.getByTestId('incident-reflection-note')).toHaveValue('Guard cache and network commits with the active query.');
    await page.getByRole('button', { name: 'Replay', exact: true }).click();
    await expectStep(page, race, 0);
    await expect(page.locator('.incident-hero__chips')).toContainText('Best 100/100');
    await expect(page.getByRole('button', { name: 'Debrief', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'Begin simulator', exact: true }).click();
    await expect(page.getByRole('radio', { checked: true })).toHaveCount(0);
  });

  for (const tier of ['guest', 'free', 'premium'] as const) {
    test(`${tier} access preserves every Premium scenario boundary`, async ({ page, baseURL }) => {
      test.setTimeout(90_000);
      if (tier !== 'guest') {
        await installAuthMock(page, {
          token: 'incident-e2e-token',
          user: buildMockUser({ accessTier: tier, _id: `incident-e2e-${tier}` }),
        });
        await page.context().addCookies([{ name: 'access_token', value: 'incident-e2e-token', url: baseURL! }]);
        await page.addInitScript(() => localStorage.setItem('fa:auth:session', '1'));
      }
      for (const scenario of premiumScenarios) {
        await page.goto(`/incidents/${scenario.meta.id}`);
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/i);
        if (tier === 'premium') {
          await expectStep(page, scenario, 0);
          await page.getByRole('button', { name: 'Begin simulator', exact: true }).click();
          await expectStep(page, scenario, 1);
        } else {
          await expect(page.locator('.locked-shell')).toBeVisible();
          await expect(page.locator('.incident-stage-card')).toHaveCount(0);
          await expect(page.getByTestId('incident-debrief')).toHaveCount(0);
          await expect(page.getByRole('button', { name: 'Begin simulator', exact: true })).toHaveCount(0);
        }
      }
    });
  }
});
