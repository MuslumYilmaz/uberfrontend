import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const STICKY_ROUTE = '/css/trivia/css-position-sticky-not-working';
const GENERIC_TRIVIA_ROUTE = '/css/trivia/css-position-relative-absolute-fixed';
const VIEWPORTS = [360, 390, 834, 1366, 1440] as const;
const SERIOUS_IMPACTS = new Set(['serious', 'critical']);

async function loadDeferredLab(page: Page): Promise<void> {
  await page.goto(STICKY_ROUTE);
  const slot = page.getByTestId('css-sticky-debugging-lab-slot');
  await expect(slot).toBeAttached();
  await slot.scrollIntoViewIfNeeded();
  await expect(page.getByTestId('css-sticky-debugging-lab')).toBeVisible();
  await expect(page.locator('.sticky-lab__status')).toHaveText('ready');
}

async function expectNoHorizontalOverflow(page: Page, label: string): Promise<void> {
  const metrics = await page.evaluate(() => {
    const root = document.documentElement;
    const lab = document.querySelector<HTMLElement>('[data-testid="css-sticky-debugging-lab"]');
    return {
      documentClientWidth: root.clientWidth,
      documentScrollWidth: root.scrollWidth,
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

async function expectNoSeriousAxeViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .include('[data-testid="css-sticky-debugging-lab"]')
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  const serious = results.violations.filter((violation) =>
    SERIOUS_IMPACTS.has(String(violation.impact || '')),
  );

  expect(serious.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    targets: violation.nodes.slice(0, 3).map((node) => node.target),
  }))).toEqual([]);
}

test.describe('CSS position sticky debugging lab', () => {
  test.use({
    consoleErrorAllowlist: [
      'Content Security Policy',
      'Refused to load',
      'sticky-lab\\.invalid',
    ],
  });

  test('measures the default failure, applies the suggested fix, and proves sticky geometry', async ({ page }) => {
    await loadDeferredLab(page);

    await page.getByTestId('sticky-run-inspection').click();
    const finding = page.getByTestId('sticky-inspection-finding');
    await expect(finding).toContainText('missing inset');

    await page.getByTestId('sticky-apply-fix').click();
    await page.getByTestId('sticky-run-inspection').click();
    await expect(finding).toContainText('working');

    const previewFrame = page.getByTestId('sticky-preview-frame');
    await previewFrame.scrollIntoViewIfNeeded();
    const frame = page.frameLocator('[data-testid="sticky-preview-frame"]');
    const geometry = await frame.locator('[data-sticky-target]').evaluate(async (target) => {
      const scroller = target.closest<HTMLElement>('[data-scroll-root]');
      if (!scroller) throw new Error('Sticky lab scroll owner was not found.');
      const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      scroller.scrollTop = 32;
      await nextFrame();
      await nextFrame();
      const firstTop = target.getBoundingClientRect().top;
      scroller.scrollTop = Math.min(scroller.scrollHeight - scroller.clientHeight, 128);
      await nextFrame();
      await nextFrame();
      const secondTop = target.getBoundingClientRect().top;

      return { firstTop, secondTop };
    });
    expect(Math.abs(geometry.secondTop - geometry.firstTop)).toBeLessThanOrEqual(2);
    await expectNoSeriousAxeViolations(page);
  });

  test('loads Monaco only after explicit activation and preserves a safe opaque preview', async ({ page }) => {
    const monacoRequests: string[] = [];
    page.on('request', (request) => {
      if (/\/assets\/monaco\//i.test(request.url())) monacoRequests.push(request.url());
    });

    await loadDeferredLab(page);
    expect(monacoRequests).toEqual([]);

    const preview = page.getByTestId('sticky-preview-frame');
    await expect(preview).toHaveAttribute('sandbox', 'allow-scripts');
    await expect(preview).toHaveAttribute('referrerpolicy', 'no-referrer');

    await page.getByTestId('sticky-activate-editor').click();
    await expect(page.locator('app-monaco-editor .monaco-editor')).toBeVisible();
    await expect.poll(() => monacoRequests.length).toBeGreaterThan(0);
  });

  test('rejects same-source child commands whose claimed parent origin is wrong', async ({ page }) => {
    await loadDeferredLab(page);
    const frame = page.frameLocator('[data-testid="sticky-preview-frame"]');

    await frame.locator('body').evaluate(() => {
      const scope = window as Window & { __stickyHostCommands?: Array<Record<string, unknown>> };
      scope.__stickyHostCommands = [];
      window.addEventListener('message', (event) => {
        if (event.source === window.parent && event.data && typeof event.data === 'object') {
          scope.__stickyHostCommands?.push(event.data as Record<string, unknown>);
        }
      });
    });

    await page.getByTestId('sticky-run-inspection').click();
    await expect(page.getByTestId('sticky-inspection-finding')).toContainText('missing inset');

    const state = await frame.locator('body').evaluate(() => {
      const scope = window as Window & { __stickyHostCommands?: Array<Record<string, unknown>> };
      const inspect = scope.__stickyHostCommands?.find((message) => message['kind'] === 'inspect');
      const userStyle = document.getElementById('fa-user-css');
      const firstAncestor = document.querySelector<HTMLElement>('[data-sticky-target]')?.parentElement;
      if (!inspect || !userStyle || !firstAncestor) {
        throw new Error('Sticky preview protocol state was unavailable.');
      }
      const cssBefore = userStyle.textContent;

      window.dispatchEvent(new MessageEvent('message', {
        source: window.parent,
        origin: 'https://attacker.invalid',
        data: {
          ...inspect,
          runId: Number(inspect['runId']) + 100,
          runToken: 'attacker-origin-run-token',
          css: '[data-sticky-target] { display: none !important; }',
        },
      }));
      window.dispatchEvent(new MessageEvent('message', {
        source: window.parent,
        origin: 'https://attacker.invalid',
        data: {
          ...inspect,
          kind: 'highlight',
          ancestorIndex: 0,
        },
      }));

      return {
        cssBefore,
        cssAfter: userStyle.textContent,
        ancestorOutline: firstAncestor.style.outline,
      };
    });

    expect(state.cssAfter).toBe(state.cssBefore);
    expect(state.ancestorOutline).toBe('');

    await page.getByTestId('sticky-apply-fix').click();
    await page.getByTestId('sticky-run-inspection').click();
    await expect(page.getByTestId('sticky-inspection-finding')).toContainText('working');
  });

  test('keeps hostile CSS inside the sandbox and does not create breakout markup or requests', async ({ page }) => {
    const externalRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('sticky-lab.invalid')) externalRequests.push(request.url());
    });

    await loadDeferredLab(page);
    await page.getByTestId('sticky-activate-editor').click();
    await expect(page.locator('app-monaco-editor .monaco-editor')).toBeVisible();

    await page.evaluate((source) => {
      const monaco = (window as any).monaco;
      const model = (monaco?.editor?.getModels?.() || []).find((candidate: any) =>
        candidate.uri.toString().includes('sticky-lab-missing-inset.css'),
      );
      if (!model) throw new Error('Sticky lab Monaco model was not found.');
      model.setValue(source);
    }, `@import url("https://sticky-lab.invalid/import.css");
.demo-scroll { height: 260px; overflow-y: auto; }
.sticky-target {
  position: sticky;
  top: 0;
  background-image: url("https://sticky-lab.invalid/leak.png");
}
</style><img data-breakout src="https://sticky-lab.invalid/breakout.png">`);

    await page.getByTestId('sticky-run-inspection').click();
    await expect(page.getByTestId('sticky-inspection-finding')).toBeVisible();
    await expect(page.frameLocator('[data-testid="sticky-preview-frame"]').locator('[data-breakout]')).toHaveCount(0);
    expect(externalRequests).toEqual([]);
  });

  test('supports the complete diagnose-and-fix flow with keyboard activation', async ({ page }) => {
    await loadDeferredLab(page);

    const gridCase = page.getByTestId('sticky-case-flex-grid-stretch');
    await gridCase.focus();
    await page.keyboard.press('Enter');
    await expect(gridCase).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.sticky-lab__status')).toHaveText('ready');

    const editorButton = page.getByTestId('sticky-activate-editor');
    await editorButton.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('app-monaco-editor .monaco-editor')).toBeVisible();

    const runButton = page.getByTestId('sticky-run-inspection');
    await runButton.focus();
    await page.keyboard.press('Enter');
    const finding = page.getByTestId('sticky-inspection-finding');
    await expect(finding).toContainText('stretched item');
    await expect(page.locator('[data-focus-target="inspector-result"]')).toBeFocused();

    const applyButton = page.getByTestId('sticky-apply-fix');
    await applyButton.focus();
    await page.keyboard.press('Space');
    await runButton.focus();
    await page.keyboard.press('Enter');
    await expect(finding).toContainText('working');
  });

  test('proves every suggested case fix with real browser measurements', async ({ page }) => {
    await loadDeferredLab(page);
    const cases = [
      ['missing-inset', 'missing inset'],
      ['unexpected-scroll-container', 'unexpected scroll container'],
      ['no-travel-room', 'no containing block runway'],
      ['flex-grid-stretch', 'stretched item'],
      ['sticks-but-hidden', 'covered by sibling'],
    ] as const;

    for (const [caseId, expectedBrokenFinding] of cases) {
      if (caseId !== 'missing-inset') {
        await page.getByTestId(`sticky-case-${caseId}`).click();
        await expect(page.locator('.sticky-lab__status')).toHaveText('ready');
      }

      const finding = page.getByTestId('sticky-inspection-finding');
      await page.getByTestId('sticky-run-inspection').click();
      await expect(finding).toContainText(expectedBrokenFinding);
      await page.getByTestId('sticky-apply-fix').click();
      await page.getByTestId('sticky-run-inspection').click();
      await expect(finding).toContainText('working');
    }
  });

  test('reflows without page or lab clipping at supported widths', async ({ page }) => {
    for (const width of VIEWPORTS) {
      await page.setViewportSize({ width, height: width < 834 ? 844 : 960 });
      await loadDeferredLab(page);
      await expectNoHorizontalOverflow(page, `${width}px initial`);

      if (width < 768) {
        await page.getByRole('button', { name: 'Preview' }).click();
        await expect(page.locator('.sticky-lab__panel--preview')).toBeVisible();
        await page.getByRole('button', { name: 'Inspector' }).click();
        await expect(page.locator('.sticky-lab__panel--inspector')).toBeVisible();
      }

      await expectNoHorizontalOverflow(page, `${width}px panels`);
    }
  });

  test('does not load the sticky lab or Monaco on an unrelated trivia page', async ({ page }) => {
    const loadedScripts: Array<Promise<string>> = [];
    const monacoRequests: string[] = [];
    page.on('response', (response) => {
      if (response.request().resourceType() !== 'script') return;
      loadedScripts.push(response.text().catch(() => ''));
    });
    page.on('request', (request) => {
      if (/\/assets\/monaco\//i.test(request.url())) monacoRequests.push(request.url());
    });

    await page.goto(GENERIC_TRIVIA_ROUTE);
    await expect(page.getByTestId('trivia-detail-main')).toBeVisible();
    await page.waitForLoadState('networkidle');

    expect(monacoRequests).toEqual([]);
    expect((await Promise.all(loadedScripts)).some((body) =>
      body.includes('css_sticky_editor_inspector_v1'),
    )).toBe(false);
    await expect(page.getByTestId('css-sticky-debugging-lab')).toHaveCount(0);
  });
});
