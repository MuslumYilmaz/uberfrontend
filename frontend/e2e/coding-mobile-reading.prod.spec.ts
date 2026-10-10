import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { parse, parseFragment, type DefaultTreeAdapterMap } from 'parse5';
import postcss from 'postcss';
import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';
import { buildMockUser, installAuthMock } from './auth-mocks';
import { getMonacoModelValue, setMonacoModelValue, waitForMonacoModel } from './helpers';
import { listQuestionFailureHints } from '../src/app/core/utils/failure-explain-rules';

type HtmlNode = DefaultTreeAdapterMap['node'];
type HtmlElement = DefaultTreeAdapterMap['element'];
type SolutionCode = { language: 'js' | 'ts' | 'html' | 'css' | 'file'; code: string; file?: string };
type SolutionCase = { tech: string; kind: 'coding' | 'debug'; id: string; access: string; codes: SolutionCode[]; legacy?: string };
type CatalogQuestion = {
  id: string;
  access?: string;
  solution?: string;
  solutionAsset?: string;
  solutionBlock?: { approaches?: Array<Partial<Record<'codeJs' | 'codeTs' | 'codeHtml' | 'codeCss', string>>> };
};

const catalogRoot = resolve(__dirname, '../../cdn');
const frameworkTechs = new Set(['react', 'angular', 'vue']);
const solutionCases: SolutionCase[] = ['javascript', 'react', 'angular', 'vue', 'html', 'css'].flatMap((tech) =>
  (['coding', 'debug'] as const).flatMap((kind) => {
    const path = resolve(catalogRoot, `questions/${tech}/${kind}.json`);
    if (!existsSync(path)) return [];
    return (JSON.parse(readFileSync(path, 'utf8')) as CatalogQuestion[]).map((question) => {
      const codes: SolutionCode[] = [];
      if (frameworkTechs.has(tech) && question.solutionAsset) {
        const asset = JSON.parse(readFileSync(resolve(catalogRoot, question.solutionAsset.replace(/^assets\//, '')), 'utf8'));
        for (const [file, value] of Object.entries(asset.files || {})) {
          let code = typeof value === 'string' ? value : (value as { code?: string })?.code;
          const normalizedFile = file.replace(/^\/+/, '');
          // The existing workspace SDK compatibility contract adds zone.js to
          // main.ts; the read-only solution has always used that same snapshot.
          if (typeof code === 'string' && normalizedFile === 'src/main.ts' && !/zone\.js/.test(code)) {
            code = `import 'zone.js';\n${code}`;
          }
          if (typeof code === 'string' && code.trim()) codes.push({ language: 'file', file: normalizedFile, code });
        }
      } else {
        for (const approach of question.solutionBlock?.approaches || []) {
          for (const [field, language] of [['codeJs', 'js'], ['codeTs', 'ts'], ['codeHtml', 'html'], ['codeCss', 'css']] as const) {
            const authoredCode = approach[field];
            // Older web records store escape sequences literally. Decode that
            // authoring representation before comparing parsed HTML/CSS; never
            // perform this decoding on JavaScript strings or framework files.
            const code = (language === 'html' || language === 'css')
              ? authoredCode?.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t')
                .replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\')
              : authoredCode;
            if (code?.trim()) codes.push({ language, code });
          }
        }
      }
      return {
        tech, kind, id: question.id, access: question.access || 'free', codes,
        legacy: !codes.length && typeof question.solution === 'string' ? question.solution : undefined,
      };
    });
  }),
);
const publicSolutions = solutionCases.filter((item) => item.access !== 'premium');
const screenshotDirectory = process.env.CODING_SOLUTION_SCREENSHOT_DIR;
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
const solutionRoute = (item: SolutionCase) => `/${item.tech}/${item.kind}/${item.id}`;
const attr = (node: HtmlElement, name: string) => node.attrs.find((entry) => entry.name === name)?.value;

// JS/TS and framework files are not reformatted. For HTML/CSS compare parsed
// structure: ignore presentation indentation while retaining literal values,
// selectors, attributes and code inside raw-text elements.
function canonicalCode(code: string, language: SolutionCode['language']): string {
  const source = code.replace(/\r\n?/g, '\n').trim();
  if (language === 'css') {
    const visit = (node: any): unknown => ({
      type: node.type,
      ...Object.fromEntries(['prop', 'value', 'selector', 'name', 'params', 'text', 'important']
        .filter((key) => node[key] !== undefined).map((key) => [key, node[key]])),
      ...(node.nodes ? { nodes: node.nodes.map(visit) } : {}),
    });
    return JSON.stringify(visit(postcss.parse(source)));
  }
  if (language === 'html') {
    const visit = (node: HtmlNode, raw = false): unknown => {
      if (node.nodeName === '#comment') return { comment: normalize((node as DefaultTreeAdapterMap['commentNode']).data) };
      if (node.nodeName === '#text') {
        const value = (node as DefaultTreeAdapterMap['textNode']).value;
        // The existing formatter inserts boundary newlines even inside code,
        // textarea and script. Keep every interior character of those blocks.
        return (raw ? value.trim() : normalize(value)) || null;
      }
      const element = 'tagName' in node ? node : null;
      const isRaw = raw || !!element && ['pre', 'code', 'textarea', 'script', 'style'].includes(element.tagName);
      return {
        name: node.nodeName,
        ...(element ? { attrs: element.attrs.map(({ name, value }) => [name,
          // Its legacy tag formatter also indents embedded SVG data URLs.
          // Compare that markup structurally; ordinary attributes stay exact.
          value.startsWith('data:image/svg+xml;utf8,')
            ? `data:image/svg+xml;utf8,${canonicalCode(value.slice('data:image/svg+xml;utf8,'.length), 'html')}`
            : value,
        ]).sort() } : {}),
        ...('childNodes' in node ? { children: node.childNodes.map((child) => visit(child, isRaw)).filter((child) => child !== null) } : {}),
      };
    };
    return JSON.stringify({
      tree: visit(parseFragment(source)),
      // Fragment parsing discards outer document tags and doctypes. Preserve
      // their lexical sequence too so missing authored wrappers cannot pass.
      tags: Array.from(source.matchAll(/<\/?[a-z][\w:-]*(?=[\s/>])|<!doctype\s+[^>]*>/gi), ([tag]) => normalize(tag)),
    });
  }
  return source;
}

function solutionPanel(html: string): HtmlElement {
  const panels = elements(parse(html)).filter((node) => attr(node, 'data-testid') === 'coding-solution-panel');
  expect(panels, 'one solution panel in actual HTML, outside scripts/templates').toHaveLength(1);
  return panels[0];
}

function expectInitialSolutionCode(html: string, item: SolutionCase) {
  const panel = solutionPanel(html);
  expect(attr(panel, 'hidden'), `${solutionRoute(item)} starts closed`).toBeDefined();
  const sourceBlocks = elements(panel).filter((node) => node.tagName === 'pre'
    && (attr(node, 'data-solution-language') !== undefined || attr(node, 'data-solution-file') !== undefined));
  const actual = sourceBlocks.map((pre) => {
    const children = pre.childNodes.filter((node): node is HtmlElement => 'tagName' in node && node.tagName === 'code');
    expect(children, 'source must be real pre > code, not an attribute or JSON payload').toHaveLength(1);
    const file = attr(pre, 'data-solution-file');
    const language = file ? 'file' : attr(pre, 'data-solution-language') as SolutionCode['language'];
    return JSON.stringify([language, file || '', canonicalCode(htmlText(children[0]), language)]);
  }).sort();
  const expected = item.codes.map(({ language, file, code }) =>
    JSON.stringify([language, file || '', canonicalCode(code, language)])).sort();
  expect(actual, `complete solution sources without duplicates: ${solutionRoute(item)}`).toEqual(expected);
  if (item.legacy) {
    const content = normalize(htmlText(panel));
    // Legacy debug solutions are existing Markdown prose. Backticks become
    // inline-code elements, so check every complete surrounding text segment
    // and the inline payload rather than treating delimiters as source text.
    for (const legacy of item.legacy.split('`').map(normalize).filter(Boolean)) {
      expect(content).toContain(legacy);
      expect(content.split(legacy)).toHaveLength(2);
    }
  }
  expect(elements(panel).filter((node) => node.tagName === 'app-monaco-editor')).toHaveLength(0);
}

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

async function revealSolution(page: Page) {
  await page.getByTestId('coding-solution-tab').click();
  const warning = page.getByTestId('solution-warning');
  if (await warning.isVisible()) await page.getByTestId('solution-warning-view').click();
  await expect(warning).toBeHidden();
  await expect(page.getByTestId('coding-solution-panel')).toBeVisible();
}

async function openSolution(page: Page) {
  await revealSolution(page);
  await expect(page.getByTestId('coding-solution-panel').locator('pre:visible code').first()).not.toBeEmpty();
}

test.describe('coding solution source in production HTML', () => {
  test.skip(process.env.PLAYWRIGHT_SSR !== '1', 'Requires production prerender HTML.');
  for (const item of publicSolutions) {
    test(`${solutionRoute(item)} includes its complete authored source before interaction`, async ({ request }) => {
      const response = await request.get(solutionRoute(item));
      expect(response.status()).toBe(200);
      expectInitialSolutionCode(await response.text(), item);
    });
  }
  test('a question with authored failure hints prerenders them next to its solution', async ({ request }) => {
    const hints = listQuestionFailureHints('js-sleep');
    expect(hints.length).toBeGreaterThan(0);
    const response = await request.get('/javascript/coding/js-sleep');
    expect(response.status()).toBe(200);
    const sections = elements(parse(await response.text())).filter((node) => attr(node, 'data-testid') === 'coding-common-mistakes');
    expect(sections).toHaveLength(1);
    const text = normalize(htmlText(sections[0]));
    for (const hint of hints) {
      expect(text).toContain(normalize(hint.title));
      expect(text).toContain(normalize(hint.actions[0]));
    }
  });
  test('premium HTML excludes solution snapshots and code payloads', async ({ request }) => {
    for (const id of ['react-debounced-search', 'js-throttle', 'angular-contact-form-starter']) {
      const item = solutionCases.find((entry) => entry.id === id)!;
      const response = await request.get(solutionRoute(item));
      expect(response.status()).toBe(200);
      const html = await response.text();
      const nodes = elements(parse(html));
      expect(nodes.some((node) => attr(node, 'data-testid') === 'coding-solution-panel')).toBe(false);
      expect(nodes.some((node) => attr(node, 'data-testid') === 'coding-common-mistakes')).toBe(false);
      expect(nodes.some((node) => attr(node, 'data-solution-file') !== undefined || attr(node, 'data-solution-language') !== undefined)).toBe(false);
      expect(html).not.toContain('question-solution:');
      // Check raw document and decoded serialized JSON as well as rendered text.
      for (const source of item.codes) {
        const needle = source.code.trim();
        if (needle.length < 40) continue;
        expect(html).not.toContain(needle);
        expect(html).not.toContain(JSON.stringify(needle).slice(1, -1));
      }
      expect(nodes.find((node) => node.tagName === 'meta' && attr(node, 'name') === 'robots')?.attrs)
        .toContainEqual({ name: 'content', value: 'noindex,follow' });
    }
  });
});

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
      expectInitialSolutionCode(html, publicSolutions.find((entry) => entry.id === item.id)!);

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
        await expect(solution.locator('app-monaco-editor')).toHaveCount(0);
        expect(await solution.locator('pre[data-solution-language], pre[data-solution-file]').count()).toBeGreaterThan(0);
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
        const code = solution.locator('pre:visible code').first();
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

  for (const id of [
    'js-implement-new', 'react-autocomplete-search-starter', 'ng-debug-counter-change-detection',
    'vue-counter', 'css-flexbox-navbar',
  ]) {
    test(`${id}: authored code survives hydration and selected mobile solution views`, async ({ page, context, baseURL }) => {
      const item = publicSolutions.find((entry) => entry.id === id)!;
      await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: baseURL });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(solutionRoute(item));
      await expectMobileReader(page);
      const solution = page.getByTestId('coding-solution-panel');
      await expect(solution).toBeHidden();
      await expect(solution.locator('app-monaco-editor')).toHaveCount(0);
      expect(await solution.locator('pre[data-solution-language], pre[data-solution-file]').count()).toBe(item.codes.length);
      await openSolution(page);
      if (frameworkTechs.has(item.tech)) {
        const tabs = solution.locator('.sol-file-tab:visible');
        expect(await tabs.count()).toBe(item.codes.length);
        await tabs.last().click();
        await expect(tabs.last()).toHaveClass(/active/);
        await expect(solution.locator('pre:visible[data-solution-file]')).toHaveCount(1);
      }
      const visiblePre = solution.locator('pre:visible[data-solution-language], pre:visible[data-solution-file]');
      expect(await visiblePre.count()).toBeGreaterThan(0);
      for (const pre of await visiblePre.all()) {
        const file = await pre.getAttribute('data-solution-file');
        const language = file ? 'file' : await pre.getAttribute('data-solution-language') as SolutionCode['language'];
        const code = await pre.locator('code').textContent() || '';
        expect(item.codes.filter((entry) => entry.language === language && (!file || entry.file === file))
          .map((entry) => canonicalCode(entry.code, entry.language))).toContain(canonicalCode(code, language));
      }
      const firstCode = await visiblePre.first().locator('code').textContent();
      await solution.getByRole('button', { name: /^Copy (?:file|HTML|CSS|code)$/ }).first().click();
      await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(firstCode);
      await expectMobileReader(page);
      await page.getByRole('button', { name: 'Description', exact: true }).click();
      await expect(solution).toBeHidden();
      await expect(solution.locator('app-monaco-editor')).toHaveCount(0);
    });
  }

  for (const item of cases) {
    test(`${item.id}: desktop solution stays lazy and viewing preserves the draft`, async ({ page, context, baseURL }) => {
      await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: baseURL });
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(routeFor(item));
      await waitForMonacoModel(page, item.model);
      const solution = page.getByTestId('coding-solution-panel');
      await expect(solution).toBeHidden();
      await expect(solution.locator('app-monaco-editor')).toHaveCount(0);
      const sourceCount = await solution.locator('pre[data-solution-language], pre[data-solution-file]').count();
      expect(sourceCount).toBeGreaterThan(0);
      await setMonacoModelValue(page, item.model, item.draft);
      await revealSolution(page);
      await expect(solution.locator('app-monaco-editor').first()).toBeVisible();
      await expect(solution.locator('pre:visible')).toHaveCount(0);
      await expect(solution.locator('pre[data-solution-language], pre[data-solution-file]')).toHaveCount(sourceCount);
      await expect.poll(() => getMonacoModelValue(page, item.model)).toBe(item.draft);
      if (item.tech === 'react') {
        const tabs = solution.locator('.sol-file-tab:visible');
        await tabs.last().click();
        await expect(tabs.last()).toHaveClass(/active/);
        await expect(solution.locator('app-monaco-editor')).toHaveCount(1);
        const fileName = (await tabs.last().textContent())!.trim();
        const code = publicSolutions.find((entry) => entry.id === item.id)!.codes
          .find((entry) => entry.file?.split('/').pop() === fileName)!.code;
        await solution.getByRole('button', { name: 'Copy file', exact: true }).click();
        await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(code);
        await expect.poll(() => getMonacoModelValue(page, item.model)).toBe(item.draft);
      }
      if (item.tech === 'javascript') {
        const language = page.getByTestId('js-language-select');
        await language.selectOption('ts');
        await expect(solution.locator('app-monaco-editor').first()).toBeVisible();
        await expect(solution.locator('pre:visible')).toHaveCount(0);
        const typescript = publicSolutions.find((entry) => entry.id === item.id)!.codes.find((entry) => entry.language === 'ts')!.code;
        await solution.getByRole('button', { name: 'Copy code', exact: true }).first().click();
        await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(typescript);
        await language.selectOption('js');
        await expect.poll(() => getMonacoModelValue(page, item.model)).toBe(item.draft);
        await page.getByTestId('solution-load-approach-0').click();
        await expect.poll(() => getMonacoModelValue(page, item.model)).not.toBe(item.draft);
        await expect(page.getByTestId('restore-banner')).toBeVisible();
      }
      await page.getByRole('button', { name: 'Description', exact: true }).click();
      await expect(solution).toBeHidden();
      await expect(solution.locator('app-monaco-editor')).toHaveCount(0);
    });
  }

  test('visual parity capture for unchanged coding readers and workspaces', async ({ page }) => {
    test.skip(!screenshotDirectory, 'Set CODING_SOLUTION_SCREENSHOT_DIR to capture baseline or changed UI.');
    test.setTimeout(300_000);
    mkdirSync(screenshotDirectory!, { recursive: true });
    const capture = async (name: string) => {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.preview-loading:visible, .preview-only-loading:visible')).toHaveCount(0, { timeout: 30_000 });
      await expect.poll(async () => (await Promise.all(page.frames().map(async (frame) => {
        try {
          return await frame.evaluate(async () => {
            await document.fonts.ready;
            return document.readyState === 'complete' && Array.from(document.images).every((image) => image.complete);
          });
        } catch { return false; } // A preview may replace its frame while booting.
      }))).every(Boolean)).toBe(true);
      // Monaco applies syntax tokens after its model exists. Wait for stable
      // pixels instead of accepting a partially highlighted editor or preview.
      let previous: Buffer | undefined;
      let latest: Buffer;
      let stable = 0;
      await expect.poll(async () => {
        latest = await page.screenshot({ fullPage: true, animations: 'disabled', caret: 'hide' });
        stable = previous?.equals(latest) ? stable + 1 : 0;
        previous = latest;
        return stable;
      }, { timeout: 10_000, intervals: [150] }).toBeGreaterThanOrEqual(2);
      writeFileSync(resolve(screenshotDirectory!, `${name}.png`), latest!);
    };
    for (const item of cases) {
      for (const width of [360, 390, 767, 768, 834, 1366, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(routeFor(item));
        await expect(page.getByTestId('coding-description-panel')).toBeVisible();
        if (width >= 768) await waitForMonacoModel(page, item.model);
        else await expectMobileReader(page);
        await capture(`${item.id}-${width}-description`);
        await revealSolution(page);
        const solution = page.getByTestId('coding-solution-panel');
        if (width >= 768) await expect(solution.locator('.monaco-editor').first()).toBeVisible();
        else await expect(solution.locator('pre:visible code').first()).not.toBeEmpty();
        await capture(`${item.id}-${width}-solution`);
        if (item.tech === 'react' && [390, 1440].includes(width)) {
          const tabs = solution.locator('.sol-file-tab:visible');
          await tabs.last().click();
          await expect(tabs.last()).toHaveClass(/active/);
          await capture(`${item.id}-${width}-last-file`);
        }
        if (item.tech === 'javascript' && width === 1440) {
          await page.getByTestId('js-language-select').selectOption('ts');
          await capture(`${item.id}-${width}-typescript`);
        }
        if (width >= 768) {
          await solution.locator('app-monaco-editor').first().scrollIntoViewIfNeeded();
          await capture(`${item.id}-${width}-solution-code`);
        }
      }
    }
  });

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
    await expect(page.locator('pre[data-solution-language], pre[data-solution-file]')).toHaveCount(0);
    await expectNoOverflow(page);
  });
});
