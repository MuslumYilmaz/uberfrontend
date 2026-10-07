import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse, type DefaultTreeAdapterMap } from 'parse5';
import type { Page } from '@playwright/test';
import type { TradeoffBattleListItem, TradeoffBattleScenario } from '../src/app/core/models/tradeoff-battle.model';
import { expect, test } from './fixtures';
import { buildMockUser, installAuthMock } from './auth-mocks';

const catalogRoot = resolve(__dirname, '../../cdn/tradeoff-battles');
const index = JSON.parse(readFileSync(resolve(catalogRoot, 'index.json'), 'utf8')) as TradeoffBattleListItem[];
const scenarios = index.map(({ id }) => JSON.parse(
  readFileSync(resolve(catalogRoot, id, 'scenario.json'), 'utf8'),
) as TradeoffBattleScenario);
const freeScenarios = scenarios.filter(({ meta }) => meta.access === 'free');
const premiumScenarios = scenarios.filter(({ meta }) => meta.access === 'premium');
const react = scenarios.find(({ meta }) => meta.id === 'context-vs-zustand-vs-redux')!;
const collections = scenarios.find(({ meta }) => meta.id === 'object-vs-map-keyed-collections')!;
const token = 'tradeoff-render-e2e-token';
const user = buildMockUser();
const progressKey = (scope = 'guest') => `fa:practice:progress:v3:${scope}`;
const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();
const legacyFallbackTitle = 'Frontend Tradeoff Battle for Interview Practice';
const legacyFallbackDescription =
  'Practice a frontend tradeoff interview question and learn how to compare options, defend a balanced choice, and explain the downsides clearly.';

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
function tradeoffTechLabel(tech: string): string {
  switch (tech) {
    case 'javascript': return 'JavaScript';
    case 'react': return 'React';
    case 'angular': return 'Angular';
    case 'vue': return 'Vue';
    case 'html': return 'HTML';
    case 'css': return 'CSS';
    case 'system-design': return 'System design';
    default: return 'Frontend';
  }
}
function expectedTitle(scenario: TradeoffBattleScenario): string {
  return `${scenario.meta.title} - ${tradeoffTechLabel(scenario.meta.tech)} Tradeoff Question`;
}
function expectedDescription(scenario: TradeoffBattleScenario): string {
  const tech = tradeoffTechLabel(scenario.meta.tech).toLowerCase();
  return `Practice this ${tech} tradeoff interview question. ${scenario.meta.summary} Learn how to compare the options and defend a balanced answer clearly.`;
}
function htmlText(node: HtmlNode): string {
  if ('tagName' in node && ['script', 'style', 'template'].includes(node.tagName)) return '';
  if (node.nodeName === '#text') return (node as DefaultTreeAdapterMap['textNode']).value;
  return 'childNodes' in node ? node.childNodes.map(htmlText).join(' ') : '';
}
function educationalText(scenario: TradeoffBattleScenario): string[] {
  return [
    scenario.strongAnswer.title, scenario.strongAnswer.summary, ...scenario.strongAnswer.reasoning,
    ...(scenario.strongAnswer.recommendation ? [scenario.strongAnswer.recommendation] : []),
    ...scenario.decisionMatrix.flatMap((row) => [row.title, row.prompt, ...row.cells.map((cell) => cell.note)]),
    ...scenario.options.flatMap((option) => [option.label, option.summary, ...option.whenItWins, ...option.watchOutFor]),
    ...scenario.interviewerPushback.flatMap((item) => [item.question, item.answer]),
    ...scenario.answerExamples.flatMap((item) => [item.title, item.answer, item.whyItWorks]),
    ...scenario.evaluationDimensions.flatMap((item) => [item.title, item.description]),
    ...scenario.answerFramework, ...scenario.antiPatterns,
  ];
}
function expectDetailSchema(graph: Array<Record<string, unknown>>, scenario: TradeoffBattleScenario) {
  expect(graph.find((entry) => entry['@type'] === 'LearningResource')).toMatchObject({
    '@id': `https://frontendatlas.com/tradeoffs/${scenario.meta.id}`,
    name: scenario.meta.title,
    isAccessibleForFree: scenario.meta.access === 'free',
  });
  expect(graph.some((entry) => entry['@type'] === 'BreadcrumbList')).toBe(true);
}
function expectInitialHead(html: string, nodes: HtmlElement[], scenario: TradeoffBattleScenario) {
  const title = nodes.find((node) => node.tagName === 'title');
  const detailTitle = expectedTitle(scenario);
  const detailDescription = expectedDescription(scenario);
  expect(title && normalize(htmlText(title))).toBe(detailTitle);
  const valueOf = (name: string, value: string, attribute = 'name') => nodes.find((node) =>
    node.tagName === 'meta' && attr(node, attribute) === name && attr(node, 'content') === value,
  );
  expect(valueOf('description', detailDescription)).toBeTruthy();
  expect(valueOf('og:title', detailTitle, 'property')).toBeTruthy();
  expect(valueOf('og:description', detailDescription, 'property')).toBeTruthy();
  expect(valueOf('twitter:title', detailTitle)).toBeTruthy();
  expect(valueOf('twitter:description', detailDescription)).toBeTruthy();
  expect(html).not.toContain(legacyFallbackTitle);
  expect(html).not.toContain(legacyFallbackDescription);
  const canonical = nodes.find((node) => node.tagName === 'link' && attr(node, 'rel') === 'canonical');
  expect(canonical && attr(canonical, 'href')).toBe(`https://frontendatlas.com/tradeoffs/${scenario.meta.id}`);
  const schema = html.match(/<script\b[^>]*id="seo-jsonld"[^>]*>([\s\S]*?)<\/script>/)?.[1];
  expectDetailSchema(JSON.parse(schema || '{}')['@graph'] || [], scenario);
}
async function openBattle(page: Page, scenario: TradeoffBattleScenario) {
  await page.goto(`/tradeoffs/${scenario.meta.id}`);
  await expect(page.getByRole('heading', { name: scenario.meta.title, exact: true })).toBeVisible();
  // Angular removes its hydration marker after claiming this server-rendered view.
  await page.waitForFunction(() => document.querySelector('app-tradeoff-detail')?.hasAttribute('ngh') === false);
  expect(await page.title()).toContain(scenario.meta.title);
  expectDetailSchema(JSON.parse(await page.locator('#seo-jsonld').textContent() || '{}')['@graph'] || [], scenario);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content',
    scenario.meta.access === 'premium' ? 'noindex,follow' : 'index,follow');
}
async function expectClosedAnalysis(page: Page, scenario: TradeoffBattleScenario) {
  const analysis = page.locator('#tradeoff-analysis');
  await expect(analysis).toHaveCount(1);
  await expect(analysis).toBeHidden();
  const text = normalize(await analysis.textContent() || '');
  for (const fragment of educationalText(scenario)) expect(text).toContain(normalize(fragment));
  await expect(page.locator('[aria-controls="tradeoff-analysis"]')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('button', { name: 'Mark as completed', exact: true })).toHaveCount(0);
}
async function reveal(page: Page, scenario: TradeoffBattleScenario) {
  await page.getByRole('button', { name: `${scenario.options[0].label} ${scenario.options[0].summary}`, exact: true }).click();
  const button = page.getByRole('button', { name: 'Reveal analysis', exact: true });
  await expect(button).toBeEnabled();
  await button.click();
  await expect(page.locator('#tradeoff-analysis')).toBeVisible();
  await expect(page.locator('[aria-controls="tradeoff-analysis"]')).toHaveAttribute('aria-expanded', 'true');
}

test.describe('tradeoff production initial HTML', () => {
  test.skip(process.env.PLAYWRIGHT_SSR !== '1', 'Requires production prerender output (PLAYWRIGHT_SSR=1).');

  for (const scenario of freeScenarios) {
    test(`${scenario.meta.id}: complete analysis exists once in real HTML before any interaction`, async ({ request }) => {
      const response = await request.get(`/tradeoffs/${scenario.meta.id}`);
      expect(response.status()).toBe(200);
      const html = await response.text();
      const nodes = elements(parse(html));
      expectInitialHead(html, nodes, scenario);
      const analysis = nodes.filter((node) => attr(node, 'id') === 'tradeoff-analysis');
      expect(analysis).toHaveLength(1);
      expect(attr(analysis[0], 'hidden')).toBeDefined();
      const text = normalize(htmlText(analysis[0]));
      for (const fragment of educationalText(scenario)) expect(text).toContain(normalize(fragment));
      const revealButton = nodes.find((node) => attr(node, 'aria-controls') === 'tradeoff-analysis');
      expect(revealButton && attr(revealButton, 'aria-expanded')).toBe('false');
      const robots = nodes.find((node) => node.tagName === 'meta' && attr(node, 'name') === 'robots');
      expect(robots && attr(robots, 'content')).not.toMatch(/noindex/i);
    });
  }

  for (const scenario of premiumScenarios) {
    test(`${scenario.meta.id}: anonymous initial HTML excludes premium analysis`, async ({ request }) => {
      const response = await request.get(`/tradeoffs/${scenario.meta.id}`);
      expect(response.status()).toBe(200);
      const html = await response.text();
      const document = parse(html);
      const nodes = elements(document);
      expectInitialHead(html, nodes, scenario);
      expect(nodes.filter((node) => attr(node, 'id') === 'tradeoff-analysis')).toHaveLength(0);
      const text = normalize(htmlText(document));
      expect(text).not.toContain(normalize(scenario.strongAnswer.summary));
      for (const item of scenario.interviewerPushback) expect(text).not.toContain(normalize(item.answer));
      const robots = nodes.find((node) => node.tagName === 'meta' && attr(node, 'name') === 'robots');
      expect(robots && attr(robots, 'content')).toMatch(/noindex/i);
    });
  }
});

test.describe('tradeoff hydrated analysis', () => {
  test.skip(process.env.PLAYWRIGHT_SSR !== '1', 'Requires production prerender output (PLAYWRIGHT_SSR=1).');
  test.use({ consoleErrorAllowlist: ['\\/api\\/auth\\/me'] });
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as Window & { __FA_API_BASE__?: string }).__FA_API_BASE__ = window.location.origin;
      (window as Window & { __FA_SEO_HOST__?: string }).__FA_SEO_HOST__ = 'frontendatlas.com';
    });
    // All auth and progress stays in mocks, never in a real backend.
    await page.route('**/api/**', (route) => route.fulfill({ status: 200, json: {} }));
    await installAuthMock(page, { token, user });
  });

  for (const scenario of freeScenarios) {
    test(`${scenario.meta.id}: JavaScript preserves the closed analysis without creating progress`, async ({ page }) => {
      await openBattle(page, scenario);
      await expectClosedAnalysis(page, scenario);
      await expect(page.getByRole('button', { name: 'Reveal analysis', exact: true })).toBeDisabled();
      const record = await page.evaluate(({ key, id }) => JSON.parse(localStorage.getItem(key) || '{}')[`tradeoff-battle:${id}`], {
        key: progressKey(), id: scenario.meta.id,
      });
      expect(record).toBeUndefined();
    });
  }

  test('reveal survives reload, adjacent navigation resets state, and guests must sign in to complete', async ({ page }) => {
    await openBattle(page, collections);
    await reveal(page, collections);
    await page.reload();
    await expect(page.locator('#tradeoff-analysis')).toBeVisible();
    await expect(page.locator('.tradeoff-option.is-selected')).toContainText(collections.options[0].label);
    await expect(page.getByRole('button', { name: 'Mark as completed', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Mark as completed', exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText('Create a free account');
    // Reload clears only the dialog and retains the locally revealed analysis.
    await page.reload();
    await expect(page.locator('#tradeoff-analysis')).toBeVisible();
    const next = scenarios.find(({ meta }) => meta.id === index[index.findIndex(({ id }) => id === collections.meta.id) + 1].id)!;
    await page.locator('.tradeoff-detail__footer a').filter({ hasText: /^Next$/ }).click();
    await expect(page).toHaveURL(new RegExp(`/tradeoffs/${next.meta.id}$`));
    await expectClosedAnalysis(page, next);
    await expect(page.locator('.tradeoff-option.is-selected')).toHaveCount(0);
    await page.goBack();
    await expect(page.locator('#tradeoff-analysis')).toBeVisible();
    const record = await page.evaluate(({ key, id }) => JSON.parse(localStorage.getItem(key) || '{}')[`tradeoff-battle:${id}`], {
      key: progressKey(), id: collections.meta.id,
    });
    expect(record.completed).toBe(false);
    expect(record.extension.revealed).toBe(true);
  });

  test('signed-in progress is written as completed only by the explicit completion action', async ({ page, baseURL }) => {
    await page.context().addCookies([{ name: 'access_token', value: token, url: baseURL! }]);
    await page.addInitScript(() => localStorage.setItem('fa:auth:session', '1'));
    const writes: Array<{ completed?: boolean }> = [];
    page.on('request', (request) => {
      if (request.method() === 'PUT' && request.url().includes(`/api/practice-progress/tradeoff-battle/${react.meta.id}`)) {
        writes.push(request.postDataJSON());
      }
    });
    const progressHydrated = page.waitForResponse((response) =>
      response.request().method() === 'GET' && /\/api\/practice-progress$/.test(response.url()) && response.status() === 200);
    await openBattle(page, react);
    await progressHydrated;
    await reveal(page, react);
    await expect.poll(() => writes.length).toBeGreaterThan(0);
    expect(writes.some((record) => record.completed)).toBe(false);
    await page.getByRole('button', { name: 'Mark as completed', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Completed', exact: true })).toBeDisabled();
    await expect.poll(() => writes.some((record) => record.completed)).toBe(true);
    await page.reload();
    await expect(page.locator('#tradeoff-analysis')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Completed', exact: true })).toBeDisabled();
  });

  test('premium guest rendering does not expose analysis after JavaScript', async ({ page }) => {
    await openBattle(page, premiumScenarios[0]);
    await expect(page.locator('#tradeoff-analysis')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'View pricing', exact: true })).toBeVisible();
    await expect(page.locator('app-tradeoff-detail')).not.toContainText(premiumScenarios[0].strongAnswer.summary);
  });

  for (const width of [360, 390, 834, 1440]) {
    test(`revealed analysis keeps section spacing and avoids overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await openBattle(page, react);
      await reveal(page, react);
      const layout = await page.locator('#tradeoff-analysis').evaluate((element) => {
        const sections = Array.from(element.children).map((child) => child.getBoundingClientRect());
        return {
          display: getComputedStyle(element).display,
          parentGap: Number.parseFloat(getComputedStyle(element.parentElement!).rowGap),
          gaps: sections.slice(1).map((section, i) => section.top - sections[i].bottom),
          pageOverflow: document.documentElement.scrollWidth - window.innerWidth,
        };
      });
      expect(layout.display).toBe('grid');
      expect(layout.parentGap).toBeGreaterThan(0);
      for (const gap of layout.gaps) expect(gap).toBeCloseTo(layout.parentGap, 1);
      expect(layout.pageOverflow).toBeLessThanOrEqual(1);
    });
  }
});
