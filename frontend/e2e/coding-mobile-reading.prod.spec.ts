import { readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { parse, type DefaultTreeAdapterMap } from 'parse5';
import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';
import { buildMockUser, installAuthMock } from './auth-mocks';
import { getMonacoModelValue, setMonacoModelValue, waitForMonacoModel } from './helpers';

type HtmlNode = DefaultTreeAdapterMap['node'];
type HtmlElement = DefaultTreeAdapterMap['element'];
type ReadingCase = {
  tech: string;
  id: string;
  summary: string;
  overview: string;
  requirements: string[];
  faq: string[];
  model: string;
  draft: string;
};

const cases: ReadingCase[] = [
  { tech: 'react', id: 'react-counter', model: 'src/App.tsx', draft: '// mobile-resize-react\nexport default function App() { return <p>Draft preserved</p>; }' },
  { tech: 'html', id: 'html-links-and-images', model: 'q-html-links-and-images-html', draft: '<main data-mobile-draft="html">Draft preserved</main>' },
  { tech: 'javascript', id: 'js-number-clamp', model: 'q-js-number-clamp-code', draft: '// mobile-resize-js\nexport default function clamp(value) { return value; }' },
].map((entry) => {
  const questions = JSON.parse(readFileSync(resolve(__dirname, `../../cdn/questions/${entry.tech}/coding.json`), 'utf8'));
  const question = questions.find((q: { id: string }) => q.id === entry.id);
  return {
    ...entry,
    summary: question.description.summary,
    overview: question.solutionBlock.overview,
    requirements: question.description.specs?.requirements ?? [],
    faq: (question.description.specs?.faq ?? []).flatMap((item: { question: string; answer: string }) => [item.question, item.answer]),
  };
});

function elements(node: HtmlNode): HtmlElement[] {
  if ('tagName' in node && ['script', 'style', 'template'].includes(node.tagName)) return [];
  return [
    ...('tagName' in node ? [node] : []),
    ...('childNodes' in node ? node.childNodes.flatMap(elements) : []),
  ];
}

function htmlText(node: HtmlNode): string {
  if ('tagName' in node && ['script', 'style', 'template'].includes(node.tagName)) return '';
  if (node.nodeName === '#text') return (node as DefaultTreeAdapterMap['textNode']).value;
  return 'childNodes' in node ? node.childNodes.map(htmlText).join(' ') : '';
}

const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();
const routeFor = (item: ReadingCase) => `/${item.tech}/coding/${item.id}`;

function htmlPanelText(html: string, testId: string): string {
  const panels = elements(parse(html)).filter((node) => node.attrs.some((attr) => attr.name === 'data-testid' && attr.value === testId));
  expect(panels, `${testId} must occur once in HTML outside scripts/templates`).toHaveLength(1);
  return normalize(htmlText(panels[0]));
}

async function expectNoOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

async function expectMobileReader(page: Page) {
  await expect(page.getByTestId('coding-mobile-notice')).toBeVisible();
  await expect(page.getByTestId('coding-detail-page')).toBeVisible();
  await expect(page.getByTestId('coding-workspace-panel')).toHaveCount(0);
  await expect(page.getByTestId('coding-description-splitter')).toHaveCount(0);
  await expect(page.locator('app-monaco-editor')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /load (?:solution )?into editor|run (?:tests|checks)|preview (?:solution|what you need to build)/i })).toHaveCount(0);
  await expectNoOverflow(page);
}

async function openSolution(page: Page) {
  await page.getByTestId('coding-solution-tab').click();
  const warning = page.getByTestId('solution-warning');
  if (await warning.isVisible()) await page.getByTestId('solution-warning-view').click();
  await expect(warning).toBeHidden();
  await expect(page.getByTestId('coding-solution-panel')).toBeVisible();
  await expect(page.getByTestId('coding-solution-panel').locator('pre code').first()).not.toBeEmpty();
}

test.describe('coding mobile reading against production prerender', () => {
  test.skip(process.env.PLAYWRIGHT_SSR !== '1', 'Requires a production prerender server (PLAYWRIGHT_SSR=1).');
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    // Keep every API write local, including optional telemetry. More specific
    // auth/progress mocks below and the shared fixture own their response shape.
    await page.route('**/api/**', async (route) => {
      if (/\/(?:editor-assist\/sync|billing\/checkout\/config|interviews\/availability)(?:\?|$)/.test(route.request().url())) {
        await route.fallback();
        return;
      }
      const request = route.request();
      const headers = {
        'access-control-allow-origin': request.headers()['origin'] || new URL(page.url()).origin,
        'access-control-allow-credentials': 'true',
        'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        'access-control-allow-headers': request.headers()['access-control-request-headers'] || 'content-type',
      };
      await route.fulfill({
        status: request.method() === 'OPTIONS' ? 204 : 200,
        headers,
        contentType: 'application/json',
        body: request.method() === 'OPTIONS' ? '' : JSON.stringify({ ok: true }),
      });
    });
    await installAuthMock(page, { token: 'mobile-reader-guest', user: buildMockUser() });
    await page.route(/^https:\/\/frontendatlas\.vercel\.app\/assets\/.+\.json(?:\?.*)?$/, async (route) => {
      const asset = decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\/assets\//, '');
      const root = resolve(__dirname, '../../cdn');
      const path = resolve(root, asset);
      if (!path.startsWith(root + sep)) throw new Error(`Unexpected CDN asset path: ${asset}`);
      await route.fulfill({ status: 200, contentType: 'application/json', body: readFileSync(path, 'utf8') });
    });
    // Production chooses its CDN preference before Angular's app initializer.
    await page.goto('/robots.txt');
    await page.evaluate(() => localStorage.setItem('fa:cdn:enabled', '0'));
  });

  for (const item of cases) {
    test(`${item.id}: initial HTML survives hydration and mobile tabs at 360/390/767px`, async ({ page, request, context, baseURL }) => {
      const response = await request.get(routeFor(item));
      expect(response.status()).toBe(200);
      const html = await response.text();
      const initialDescription = htmlPanelText(html, 'coding-description-panel');
      const initialSolution = htmlPanelText(html, 'coding-solution-panel');
      for (const content of [item.summary, ...item.requirements, ...item.faq]) {
        expect(initialDescription).toContain(normalize(content));
      }
      expect(initialSolution).toContain(normalize(item.overview));

      await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: baseURL });
      for (const width of [360, 390, 767]) {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(routeFor(item));
        await expectMobileReader(page);
        const description = page.getByTestId('coding-description-panel');
        const solution = page.getByTestId('coding-solution-panel');
        await expect(description).toBeVisible();
        // textContent includes the intentionally closed solution panel. It does
        // not mistake Angular transfer-state JSON for rendered page content.
        for (const content of [item.summary, ...item.requirements, ...item.faq]) {
          expect(normalize(await description.textContent() ?? '')).toContain(normalize(content));
        }
        expect(normalize(await solution.textContent() ?? '')).toContain(normalize(item.overview));
        await expect(solution).toBeHidden();
        if (item.tech === 'javascript') await expect(description.locator('pre code')).toContainText('clamp(3, 0, 5)');

        // The reader scrolls with the document instead of trapping long text
        // inside the old fixed-height workspace pane.
        const scrolling = await description.evaluate((element) => {
          const pane = element.closest('[data-testid="coding-description-pane"]')!;
          const content = element.parentElement!;
          const layout = pane.closest('[data-testid="coding-detail-page"]')!;
          return {
            paneOverflow: getComputedStyle(pane).overflowY,
            contentOverflow: getComputedStyle(content).overflowY,
            layoutPosition: getComputedStyle(layout).position,
            clippedHeight: pane.scrollHeight - pane.clientHeight,
            bodyOverflow: getComputedStyle(document.body).overflowY,
            documentCanScroll: document.documentElement.scrollHeight > window.innerHeight,
          };
        });
        expect(scrolling.paneOverflow).toBe('visible');
        expect(scrolling.contentOverflow).toBe('visible');
        expect(scrolling.layoutPosition).toBe('relative');
        expect(scrolling.clippedHeight).toBeLessThanOrEqual(1);
        expect(scrolling.bodyOverflow).not.toMatch(/hidden|clip/);
        if (scrolling.documentCanScroll) {
          await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
          await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
        }

        await openSolution(page);
        if (item.tech === 'react') {
          const tabs = solution.locator('.sol-file-tab');
          expect(await tabs.count()).toBeGreaterThan(1);
          await tabs.last().click();
          await expect(tabs.last()).toHaveClass(/active/);
        }
        const code = solution.locator('pre code').first();
        const value = await code.textContent();
        await solution.getByRole('button', { name: /^Copy (?:file|HTML|code)$/ }).first().click();
        await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(value);
        await expectMobileReader(page);
        await page.getByRole('button', { name: 'Description', exact: true }).click();
        await expect(description).toBeVisible();
        await expect(solution).toBeHidden();
      }
    });

    test(`${item.id}: workspace returns at 768/834/1440px`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 900 });
      await page.goto(routeFor(item));
      await expectMobileReader(page);
      for (const width of [768, 834, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await expect(page.getByTestId('coding-mobile-notice')).toHaveCount(0);
        await expect(page.getByTestId('coding-workspace-panel')).toBeVisible();
        await expect(page.getByTestId('coding-description-panel')).toBeVisible();
        await expectNoOverflow(page);
      }
    });

    test(`${item.id}: rapid resize preserves edited and empty drafts`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(routeFor(item));
      await waitForMonacoModel(page, item.model);
      const models = item.tech === 'html'
        ? [{ key: item.model, draft: item.draft }, { key: 'q-html-links-and-images-css', draft: 'main { color: rebeccapurple; }' }]
        : [{ key: item.model, draft: item.draft }];
      for (const empty of [false, true]) {
        for (const model of models) await setMonacoModelValue(page, model.key, empty ? '' : model.draft);
        // No debounce wait: a resize immediately after editing must flush before
        // destroying the panel, including an intentionally blank file.
        await page.setViewportSize({ width: 390, height: 900 });
        await expectMobileReader(page);
        await page.setViewportSize({ width: 1440, height: 900 });
        await expect(page.getByTestId('coding-workspace-panel')).toBeVisible();
        for (const model of models) {
          await expect.poll(() => getMonacoModelValue(page, model.key)).toBe(empty ? '' : model.draft);
        }
      }
    });
  }

  test('mobile expands a collapsed description without overwriting the desktop preference', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/javascript/coding/js-number-clamp');
    await waitForMonacoModel(page, 'q-js-number-clamp-code');
    await page.getByRole('button', { name: 'Hide description', exact: true }).click();
    await expect(page.getByTestId('coding-description-rail')).toBeVisible();
    await page.setViewportSize({ width: 390, height: 800 });
    await expectMobileReader(page);
    await expect(page.getByTestId('coding-description-panel')).toContainText(cases[2].summary);
    await expect(page.getByTestId('coding-description-rail')).toHaveCount(0);
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.getByTestId('coding-description-rail')).toBeVisible();
  });

  test('mobile question links navigate and browser back restores the reader', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/react/coding/react-counter');
    await expectMobileReader(page);
    const link = page.getByTestId('coding-breadcrumb').getByRole('link').nth(1);
    const href = await link.getAttribute('href');
    await link.click();
    await expect(page).toHaveURL(new URL(href!, page.url()).href);
    await page.goBack();
    await expectMobileReader(page);
    await expect(page.getByTestId('coding-description-panel')).toContainText(cases[0].summary);
  });

  test('premium reader still withholds question and solution panels for visitors', async ({ page, request }) => {
    const path = '/react/coding/react-debounced-search';
    const response = await request.get(path);
    const nodes = elements(parse(await response.text()));
    expect(nodes.some((node) => node.attrs.some((attr) => attr.name === 'data-testid' && attr.value === 'coding-solution-panel'))).toBe(false);
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto(path);
    await expect(page.locator('.locked-title')).toBeVisible();
    await expect(page.getByTestId('coding-description-panel')).toHaveCount(0);
    await expect(page.getByTestId('coding-solution-panel')).toHaveCount(0);
    await expect(page.getByTestId('coding-workspace-panel')).toHaveCount(0);
    await expect(page.locator('app-monaco-editor')).toHaveCount(0);
    await expectNoOverflow(page);
  });
});
