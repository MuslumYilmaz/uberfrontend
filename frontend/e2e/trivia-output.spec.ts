import { type APIRequestContext, type Page } from '@playwright/test';
import { expect, test } from './fixtures';

const OUTPUT_ROUTE = '/javascript/trivia/js-event-loop-nested-microtask-output';
const VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 1280, height: 900 },
] as const;

interface SemanticOutputCase {
  name: string;
  route: string;
  wrongLines: readonly string[];
  canonicalLines: readonly string[];
}

const SEMANTIC_OUTPUT_CASES = [
  {
    name: 'argument mutation',
    route: '/javascript/trivia/js-argument-passing-object-mutation-output',
    wrongLines: ['2', '2'],
    canonicalLines: ['1', '2'],
  },
  {
    name: 'var hoisting',
    route: '/javascript/trivia/js-var-hoisting-shadowing-output',
    wrongLines: ['10', '20', '10'],
    canonicalLines: ['undefined', '20', '10'],
  },
  {
    name: 'map(parseInt) callback arity',
    route: '/javascript/trivia/js-map-parseint-callback-arity-output',
    wrongLines: ['[1, 2, 3]'],
    canonicalLines: ['[1, NaN, NaN]'],
  },
] as const satisfies readonly SemanticOutputCase[];

function collectHydrationIssues(page: Page): string[] {
  const issues: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      issues.push(message.text());
    }
  });
  page.on('pageerror', (error) => issues.push(error.message));
  return issues;
}

function relevantHydrationIssues(issues: string[]): string[] {
  return issues.filter((message) =>
    /NG05|hydration|hydrate|chunkloaderror|dynamically imported module|loading chunk|module script failed/i.test(message),
  );
}

async function optionOrder(page: Page): Promise<string[]> {
  return page.locator('.output-question-card__option-output').allTextContents();
}

async function findOptionIndexByLines(
  page: Page,
  expectedLines: readonly string[],
): Promise<number> {
  const renderedOutputs = page.locator('.output-question-card__option-output');
  for (let index = 0; index < await renderedOutputs.count(); index += 1) {
    const lines = await renderedOutputs.nth(index).locator('span').allTextContents();
    if (
      lines.length === expectedLines.length &&
      lines.every((line, lineIndex) => line === expectedLines[lineIndex])
    ) {
      return index;
    }
  }

  return -1;
}

async function assertSemanticOutputChallenge(
  page: Page,
  request: APIRequestContext,
  challenge: SemanticOutputCase,
): Promise<void> {
  const response = await request.get(challenge.route);
  expect(response.status()).toBe(200);
  const rawHtml = await response.text();

  expect(rawHtml).toContain('data-testid="output-question-placeholder"');
  expect(rawHtml).not.toMatch(/<input\b[^>]*type="radio"/i);

  const runtimeIssues = collectHydrationIssues(page);
  await page.goto(challenge.route);

  await expect(page.getByTestId('output-question-card')).toBeVisible();
  await expect(page.getByTestId('output-question-placeholder')).toHaveCount(0);
  await expect(page.locator('input[type="radio"]')).toHaveCount(3);
  expect(relevantHydrationIssues(runtimeIssues)).toEqual([]);

  const checkButton = page.getByTestId('output-question-check');
  const footerSubmit = page.getByTestId('footer-submit');
  const deepDive = page.getByTestId('trivia-full-answer');
  await expect(checkButton).toBeDisabled();
  await expect(footerSubmit).toBeDisabled();
  await expect(deepDive).toBeHidden();

  const initialOrder = await optionOrder(page);
  expect(initialOrder).toHaveLength(3);
  expect(new Set(initialOrder).size).toBe(3);

  const wrongOptionIndex = await findOptionIndexByLines(page, challenge.wrongLines);
  expect(wrongOptionIndex).toBeGreaterThanOrEqual(0);
  await page
    .locator('.output-question-card__option')
    .nth(wrongOptionIndex)
    .getByRole('radio')
    .check();
  await expect(checkButton).toBeEnabled();
  expect(await optionOrder(page)).toEqual(initialOrder);

  await checkButton.click();

  await expect(page.getByTestId('output-question-feedback')).toContainText('Not quite');
  await expect(page.getByTestId('output-question-canonical').locator('span')).toHaveText([
    ...challenge.canonicalLines,
  ]);
  expect(await optionOrder(page)).toEqual(initialOrder);
  await expect(footerSubmit).toBeEnabled();

  await page.getByTestId('output-question-deep-dive').click();
  await expect(deepDive).toBeVisible();
}

test.describe('JavaScript output challenge', () => {
  test.use({ consoleErrorAllowlist: ['\\/api\\/auth\\/me'] });

  test('SSR keeps the deep dive in the DOM and hydrates the placeholder into one stable challenge', async ({ page, request }) => {
    const response = await request.get(OUTPUT_ROUTE);
    expect(response.status()).toBe(200);
    const rawHtml = await response.text();

    expect(rawHtml).toContain('data-testid="output-question-placeholder"');
    expect(rawHtml).not.toMatch(/<input\b[^>]*type="radio"/i);
    expect(rawHtml).toMatch(/id="trivia-output-deep-dive"[^>]*hidden/i);
    expect(rawHtml).toContain('Why the nested microtask still wins');
    expect(rawHtml).not.toContain('Interview quick answer');

    const runtimeIssues = collectHydrationIssues(page);
    await page.goto(OUTPUT_ROUTE);

    await expect(page.getByTestId('output-question-card')).toBeVisible();
    await expect(page.getByTestId('output-question-placeholder')).toHaveCount(0);
    await expect(page.locator('input[type="radio"]')).toHaveCount(3);
    expect(relevantHydrationIssues(runtimeIssues)).toEqual([]);
  });

  test('locks one randomized order, reveals the canonical output, and resets on refresh', async ({ page }) => {
    await page.goto(OUTPUT_ROUTE);

    const checkButton = page.getByTestId('output-question-check');
    const footerSubmit = page.getByTestId('footer-submit');
    const deepDive = page.getByTestId('trivia-full-answer');
    await expect(checkButton).toBeDisabled();
    await expect(footerSubmit).toBeDisabled();
    await expect(deepDive).toBeHidden();

    const initialOrder = await optionOrder(page);
    expect(initialOrder).toHaveLength(3);
    expect(new Set(initialOrder).size).toBe(3);

    await page.locator('input[type="radio"]').first().check();
    await expect(checkButton).toBeEnabled();
    expect(await optionOrder(page)).toEqual(initialOrder);

    await checkButton.click();
    await expect(page.locator('.output-question-card__fieldset')).toHaveAttribute('disabled', '');
    for (const radio of await page.locator('input[type="radio"]').all()) {
      await expect(radio).toBeDisabled();
    }
    await expect(page.getByTestId('output-question-feedback')).toContainText(/Correct|Not quite/);
    await expect(page.getByTestId('output-question-canonical')).toContainText('A');
    await expect(page.getByTestId('output-question-canonical')).toContainText('B');
    expect((await page.getByTestId('output-question-canonical').textContent())?.replace(/\s+/g, '')).toContain('AECDB');
    expect(await optionOrder(page)).toEqual(initialOrder);
    await expect(footerSubmit).toBeEnabled();
    await expect(deepDive).toBeHidden();

    await page.getByTestId('output-question-deep-dive').click();
    await expect(deepDive).toBeVisible();

    await page.reload();
    await expect(checkButton).toBeDisabled();
    await expect(footerSubmit).toBeDisabled();
    await expect(page.getByTestId('output-question-feedback')).toHaveCount(0);
    await expect(deepDive).toBeHidden();
  });

  for (const challenge of SEMANTIC_OUTPUT_CASES) {
    test(`hydrates the ${challenge.name} challenge and reveals its canonical explanation after a wrong answer`, async ({
      page,
      request,
    }) => {
      await assertSemanticOutputChallenge(page, request, challenge);
    });
  }

  test('fits 360px, 390px, and desktop without document overflow while code remains scroll-safe', async ({ page }) => {
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      await page.goto(OUTPUT_ROUTE);
      await expect(page.getByTestId('output-question-card')).toBeVisible();

      const metrics = await page.evaluate(() => {
        const root = document.documentElement;
        const card = document.querySelector('[data-testid="output-question-card"]') as HTMLElement | null;
        const code = document.querySelector('.output-question-card__code') as HTMLElement | null;
        const options = Array.from(
          document.querySelectorAll<HTMLElement>('.output-question-card__option'),
        );
        return {
          documentScrollWidth: root.scrollWidth,
          documentClientWidth: root.clientWidth,
          cardScrollWidth: card?.scrollWidth ?? 0,
          cardClientWidth: card?.clientWidth ?? 0,
          codeOverflowX: code ? getComputedStyle(code).overflowX : '',
          optionOverflow: options.some((option) => option.scrollWidth > option.clientWidth + 1),
        };
      });

      expect(metrics.documentScrollWidth, `${viewport.width}px document overflow`).toBeLessThanOrEqual(
        metrics.documentClientWidth + 1,
      );
      expect(metrics.cardScrollWidth, `${viewport.width}px card overflow`).toBeLessThanOrEqual(
        metrics.cardClientWidth + 1,
      );
      expect(metrics.codeOverflowX).toBe('auto');
      expect(metrics.optionOverflow, `${viewport.width}px option overflow`).toBe(false);
    }
  });
});
