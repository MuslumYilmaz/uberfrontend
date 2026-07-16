import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test } from './fixtures';

const IS_PRODUCTION_SSR =
  process.env.PLAYWRIGHT_WEB_SERVER === '1' && process.env.PLAYWRIGHT_SSR === '1';

const CANONICAL_BASE = (process.env.PLAYWRIGHT_CANONICAL_BASE || 'https://frontendatlas.com')
  .replace(/\/$/, '');

const CODING_UNLOCK =
  'Premium unlocks the runnable workspace, behavioral checks, implementation walkthrough, and edge-case discussion.';
const SYSTEM_DESIGN_UNLOCK =
  'Premium unlocks the full architecture walkthrough, evaluation rubric, trade-offs, and failure-mode analysis.';
const COMPANY_PRACTICE_DISCLAIMER =
  'Editorial practice groupings, not verified official interview questions or endorsements.';
const COVERAGE_REFERENCE_DISCLAIMER =
  'These references informed topic coverage; they do not verify company provenance or a numeric score.';

type PremiumPreviewCase = {
  path: string;
  h1: string;
  unlock: string;
  requiredPracticeCopy: readonly string[];
};

const PREMIUM_PREVIEWS: readonly PremiumPreviewCase[] = [
  {
    path: '/react/coding/react-contact-form-starter',
    h1: 'Contact Form (Component + HTTP)',
    unlock: CODING_UNLOCK,
    requiredPracticeCopy: ['controlled React fields', 'validation feedback', 'duplicate submissions', 'success, and error states'],
  },
  {
    path: '/system-design/multi-step-form-autosave',
    h1: 'Multi-step Form with Autosave',
    unlock: SYSTEM_DESIGN_UNLOCK,
    requiredPracticeCopy: ['step state', 'save cadence', 'versioned drafts', 'validation behavior', 'successful submission'],
  },
  {
    path: '/javascript/coding/js-throttle',
    h1: 'Throttle Function',
    unlock: CODING_UNLOCK,
    requiredPracticeCopy: ['first call', 'Ignore additional calls', 'arguments and calling context', 'interval boundary'],
  },
  {
    path: '/javascript/coding/js-promise-all',
    h1: 'Implement Promise.all',
    unlock: CODING_UNLOCK,
    requiredPracticeCopy: ['plain values and promises', 'input order', 'empty input', 'any input rejects'],
  },
  {
    path: '/react/coding/react-use-effect-once',
    h1: 'StrictMode-safe Effect Setup and Cleanup',
    unlock: CODING_UNLOCK,
    requiredPracticeCopy: ['effect setup', 'reactive dependency', 'StrictMode', 'room dependency', 'unmounts'],
  },
  {
    path: '/angular/coding/angular-tabs-switcher',
    h1: 'Angular Tabs / Multi-View Switcher',
    unlock: CODING_UNLOCK,
    requiredPracticeCopy: ['typed active-state', 'Angular @if control flow', 'one content panel', 'accessible tab controls'],
  },
] as const;

const PRICING_PREVIEW_PATHS = [
  '/react/coding/react-contact-form-starter',
  '/system-design/multi-step-form-autosave',
  '/javascript/coding/js-throttle',
] as const;

const FREE_REACT_ROUTES = [
  '/react/coding/react-counter',
  '/react/coding/react-autocomplete-search-starter',
] as const;

const RAW_SEO_LABELS = [
  'form interaction latency frontend interview',
  'multi-step form frontend system design rubric',
  'multi step form autosave system design mistakes',
] as const;

const PUBLIC_COPY_GUARDS: readonly RegExp[] = [
  /\bTODO\s*:/i,
  /\bTBD\b/i,
  /\[insert\b/i,
  /\bplaceholder\b/i,
  /\byour company\b/i,
  /\byour jurisdiction\b/i,
  /\(Add a support phone number here/i,
  /FrontendAtlas Team/i,
  /FrontendAtlas Editor\b/i,
  /\binternal review\b/i,
  /\bsenior frontend engineer\b/i,
  /\b8\+ years\b/i,
  /crawlable focus links/i,
  /thin keyword pages/i,
  /crawlable entry points/i,
  /search-engine quality content/i,
  /free, indexable pages/i,
  /use these crawlable routes/i,
  /long-tail prompts/i,
  /internal prompt paths/i,
  /preview pages stay indexable/i,
  /FrontendAtlas metadata/i,
  /importance signals/i,
  /shipped FrontendAtlas practice routes/i,
  /\bSEO keywords?\b/i,
] as const;

const PREMIUM_COPY_GUARDS: readonly RegExp[] = [
  /…\./,
  /….|\.\.\.\./,
  /\bExpect\b[\s\S]{0,160}\bdecisions under\b[\s\S]{0,120}\bconstraints\b/i,
  /\bpublic\/index\.html\b/i,
  /\bsrc\/[\w./-]+/i,
  /`{1,3}[^`]+`{1,3}/,
] as const;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function expectedCanonical(path: string): string {
  return path === '/' ? `${CANONICAL_BASE}/` : `${CANONICAL_BASE}${path}`;
}

function extractMeta(html: string, name: string): string {
  const tag = html.match(new RegExp(`<meta\\s+[^>]*name=["']${escapeRegExp(name)}["'][^>]*>`, 'i'))?.[0] || '';
  return tag.match(/\scontent=["']([^"']*)["']/i)?.[1] || '';
}

function extractCanonical(html: string): string {
  const tag = html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*>/i)?.[0] || '';
  return tag.match(/\shref=["']([^"']*)["']/i)?.[1] || '';
}

function rawBodyMarkup(html: string): string {
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || html;
  return body
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ');
}

async function readRawHtml(request: APIRequestContext, path: string): Promise<string> {
  const response = await request.get(path);
  expect(response.status(), `HTTP status for ${path}`).toBe(200);
  return response.text();
}

function assertCopyIsPublicFacing(text: string, path: string): void {
  for (const pattern of PUBLIC_COPY_GUARDS) {
    expect(text, `${path} must not expose ${pattern}`).not.toMatch(pattern);
  }
}

async function openHydratedRoute(page: Page, path: string, h1: string | RegExp): Promise<string> {
  const runtimeIssues: string[] = [];
  const issuePattern =
    /NG05|hydration|hydrate|chunkloaderror|dynamically imported module|loading chunk|module script failed/i;

  page.on('console', (message) => {
    if ((message.type() === 'warning' || message.type() === 'error') && issuePattern.test(message.text())) {
      runtimeIssues.push(`[console.${message.type()}] ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => runtimeIssues.push(`[pageerror] ${error.message}`));

  const response = await page.goto(path, { waitUntil: 'load' });
  expect(response?.status(), `HTTP status for ${path}`).toBe(200);
  expect(new URL(page.url()).pathname, `route identity for ${path}`).toBe(path);
  await expect(page.locator('h1').first()).toContainText(h1);
  await expect(page.locator('[data-testid="offline-banner"]')).toHaveCount(0);
  await expect(page.getByText(/Question not found|Track preview not found/i)).toHaveCount(0);

  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));

  expect(runtimeIssues, `hydration/runtime issues for ${path}`).toEqual([]);
  const bodyText = normalizeText(await page.locator('body').innerText());
  assertCopyIsPublicFacing(bodyText, path);
  return bodyText;
}

function assertNoQuestionScoreOrCompanyBadge(text: string, path: string): void {
  expect(text, `${path} has no public /100 score`).not.toMatch(/\b\d{1,3}\s*\/\s*100\b/);
  expect(text, `${path} has no compact company-count badge`).not.toMatch(/\bGoogle\s*\+\d+\b/i);
}

test.describe('production/SSR public remediation smoke', () => {
  test.skip(
    !IS_PRODUCTION_SSR,
    'Run against the built SSR/prerender output with PLAYWRIGHT_WEB_SERVER=1 PLAYWRIGHT_SSR=1.',
  );

  test('homepage renders honest traction, counts, and canonical editorial attribution', async ({ page }) => {
    const bodyText = await openHydratedRoute(
      page,
      '/',
      'Practice frontend interviews in a real coding workflow',
    );

    const trust = page.getByTestId('showcase-trust-section');
    await expect(trust).toContainText('Built for credible practice');
    await expect(trust).toContainText('Frontend interview practice that shows its work.');
    await expect(trust).toContainText(
      'Hands-on coding, runnable examples, regression tests, and transparent editorial updates—inside one focused workflow.',
    );
    await expect(trust.getByTestId('trust-milestone-value')).toHaveText('100');
    await expect(trust).toContainText('FrontendAtlas accounts created');
    await expect(trust).toContainText('Early milestone · July 2026');
    await expect(trust).toContainText('FrontendAtlas Editorial');
    await expect(trust).toContainText('Built and maintained as an independent frontend interview-prep project');
    const proofItems = trust.getByTestId('trust-proof-item');
    await expect(proofItems).toHaveCount(5);
    for (const item of [
      'Runnable examples',
      'Regression tests',
      'Official-source checks where relevant',
      'Correction reports',
      'Dated updates',
    ]) {
      await expect(proofItems.filter({ hasText: item })).toHaveCount(1);
    }
    const foundationsCard = page.locator('.track-card').filter({
      hasText: 'Foundations Track (30 days)',
    });
    await page.locator('#tracks-title').scrollIntoViewIfNeeded();
    await expect(foundationsCard).toContainText('113 unique prompts');

    [
      /inflated user counts/i,
      /invented customer logos/i,
      /anonymous praise/i,
      /trusted by 100 developers/i,
      /100 active learners/i,
      /loved by developers/i,
      /helping 100 developers land jobs/i,
      /community of 100 developers/i,
      /and counting/i,
    ].forEach((claim) => expect(bodyText).not.toMatch(claim));
  });

  test('coding hub explains Practice priority without unsupported scores or company badges', async ({ page }) => {
    const bodyText = await openHydratedRoute(page, '/coding', 'Frontend Coding Challenges');
    await expect(page.getByTestId('coding-list-loading')).toBeHidden();
    await expect(page.locator('[data-testid^="question-card-"]')).not.toHaveCount(0);
    const codingCardsText = normalizeText(
      (await page.locator('[data-testid^="question-card-"]').allInnerTexts()).join(' '),
    );
    expect(codingCardsText, '/coding question cards have no global #rank label').not.toMatch(
      /(?:^|\s)#\d+\b/,
    );
    expect(bodyText).toContain('Practice priority');
    await expect(page.getByTestId('coding-list-priority-methodology')).toHaveText(
      'Practice priority is relative FrontendAtlas editorial ordering—not measured interview frequency.',
    );
    expect(bodyText).not.toMatch(/\bImportance(?: score)?\b/i);
    assertNoQuestionScoreOrCompanyBadge(bodyText, '/coding');
    await expect(page.locator('app-company-signal')).toHaveCount(0);
    await expect(page.locator('[aria-label^="Practice priority:"]').first()).toBeVisible();

    const jsonLd = await page.locator('script#seo-jsonld').textContent();
    expect(jsonLd || '').not.toMatch(/"companies?"\s*:/i);
  });

  test('pricing preserves the three exact Premium evidence links', async ({ page }) => {
    await openHydratedRoute(page, '/pricing', 'Prepare faster with deeper frontend interview reps');
    const section = page.locator('.unlock-preview');
    await expect(section).toContainText('Premium unlock preview');

    const hrefs = await section.locator('a.unlock-preview__link').evaluateAll((links) =>
      links.map((link) => link.getAttribute('href')),
    );
    expect(hrefs).toEqual([...PRICING_PREVIEW_PATHS]);
    for (const path of PRICING_PREVIEW_PATHS) {
      await expect(section.locator(`a[href="${path}"]`)).toHaveCount(1);
    }
  });

  test('Foundations preview presents 113 unique prompts and explicitly explains overlap', async ({ page }) => {
    const bodyText = await openHydratedRoute(
      page,
      '/tracks/foundations-30d/preview',
      'Foundations Track: 30-Day Frontend Interview Preparation Roadmap',
    );

    await expect(page.locator('.preview-metrics')).toContainText('113');
    await expect(page.locator('.preview-metrics')).toContainText('unique prompts');
    await expect(page.locator('.distribution-grid')).toContainText(/51\s*JavaScript/);
    await expect(page.locator('.distribution-grid')).toContainText(/27\s*framework coding/);
    await expect(page.locator('.distribution-grid')).toContainText(/30\s*HTML\/CSS/);
    await expect(page.locator('.distribution-grid')).toContainText(/39\s*concept questions/);
    await expect(page.locator('.distribution-grid')).toContainText(/5\s*system design/);
    expect(bodyText).toContain('Category counts overlap because one prompt can cover multiple skills.');
    expect(bodyText).toContain('Todo List (Standalone Component with @for)');
    expect(bodyText).not.toContain('113 questions');
    expect(bodyText).not.toContain('with ngFor');
  });

  test('refund policy has a complete request path and no template placeholder', async ({ page }) => {
    const bodyText = await openHydratedRoute(page, '/legal/refund', 'Refund Policy');
    expect(bodyText).toContain('Refund requests: support@frontendatlas.com');
    expect(bodyText).toContain(
      'By limited usage, we mean the paid library has not been substantially consumed. We assess this case by case based on request timing and available account records.',
    );
    expect(bodyText).toContain('This policy does not limit mandatory consumer rights');
    expect(bodyText).toContain('Effective date: 2025-12-31');
  });

  test('Editorial Policy describes the actual independent maintenance workflow', async ({ page }) => {
    const bodyText = await openHydratedRoute(page, '/legal/editorial-policy', 'Editorial Policy');
    expect(bodyText).toContain('FrontendAtlas Editorial');
    expect(bodyText).toContain('Built and maintained as an independent frontend interview-prep project');
    expect(bodyText).toContain('Runnable examples verify behavior');
    expect(bodyText).toContain('Regression tests protect runner, content, routing, access, and rendering contracts.');
    expect(bodyText).toContain('Official-source checks are used');
    expect(bodyText).toContain('Correction reports and dated updates');
  });

  test('Essential is an evidence-linked grouped shortlist without scores, ranks, or company badges', async ({ page }) => {
    const bodyText = await openHydratedRoute(
      page,
      '/interview-questions/essential',
      'FrontendAtlas Essential 60',
    );
    expect(bodyText).toContain('Updated April 23, 2026');
    expect(bodyText).toContain('FrontendAtlas Editorial');
    expect(bodyText).toContain('Coverage references (5)');
    expect(bodyText).toContain(COVERAGE_REFERENCE_DISCLAIMER);
    expect(bodyText).not.toContain('Updated May 21, 2026');
    expect(bodyText).not.toContain('reference surfaces checked');
    assertNoQuestionScoreOrCompanyBadge(bodyText, '/interview-questions/essential');

    const references = page.getByTestId('essential-coverage-references').locator('a');
    await expect(references).toHaveCount(5);
    const referenceUrls = await references.evaluateAll((links) =>
      links.map((link) => link.getAttribute('href') || ''),
    );
    expect(referenceUrls.every((url) => url.startsWith('https://'))).toBe(true);
    await expect(page.locator('[data-testid^="essential-group-"]')).not.toHaveCount(0);
    const essentialGroupsText = normalizeText(
      (await page.locator('[data-testid^="essential-group-"]').allInnerTexts()).join(' '),
    );
    expect(essentialGroupsText, 'Essential prompt groups have no global #rank label').not.toMatch(
      /(?:^|\s)#\d+\b/,
    );
    await expect(page.locator('[data-testid^="company-signal-"]')).toHaveCount(0);
    await expect(page.locator('app-company-signal')).toHaveCount(0);
  });

  test('company-group surface explains the limits of editorial attribution', async ({ page }) => {
    const bodyText = await openHydratedRoute(page, '/companies', 'Company Frontend Interview Questions');
    expect(bodyText).toContain(COMPANY_PRACTICE_DISCLAIMER);
    await expect(page.getByTestId('company-practice-disclaimer')).toHaveText(
      COMPANY_PRACTICE_DISCLAIMER,
    );
  });

  test('changelog leads with a July 15 remediation entry only after the release gate', async ({ page }) => {
    await openHydratedRoute(page, '/changelog', 'Product changelog');
    const latest = page.getByTestId('changelog-latest');
    await expect(latest.locator('time')).toHaveAttribute('datetime', '2026-07-15');
    await expect(latest.locator('time')).toHaveText('Jul 15, 2026');

    const firstTimelineEntry = page.getByTestId('changelog-entry').first();
    await expect(firstTimelineEntry.locator('time')).toHaveAttribute('datetime', '2026-07-15');
    await expect(firstTimelineEntry).toContainText(/React.{0,80}check/i);
    await expect(firstTimelineEntry).toContainText(/Premium.{0,40}preview/i);
    await expect(firstTimelineEntry).toContainText(/framework|Angular/i);
    await expect(firstTimelineEntry).toContainText(/legal|refund/i);
    await expect(firstTimelineEntry).toContainText(/trust|editorial/i);
  });

  for (const previewCase of PREMIUM_PREVIEWS) {
    test(`Premium preview is complete and non-spoiling on ${previewCase.path}`, async ({ page }) => {
      const solutionAssetRequests: string[] = [];
      page.on('request', (request) => {
        const pathname = new URL(request.url()).pathname;
        if (/\/assets\/sb\/[^/]+\/solution\//i.test(pathname)) {
          solutionAssetRequests.push(pathname);
        }
      });

      const bodyText = await openHydratedRoute(page, previewCase.path, previewCase.h1);
      const preview = page.getByTestId('premium-preview-rich');
      await expect(preview).toHaveCount(1);
      await expect(preview).toBeVisible();
      await expect(page.getByTestId('premium-preview')).toHaveCount(0);
      await expect(page.locator('.locked-shell')).toBeVisible();
      await expect(page.locator('.locked-meta')).toContainText('By FrontendAtlas Editorial');
      await expect(page.getByTestId('premium-preview-unlock')).toHaveText(previewCase.unlock);
      await expect(preview.getByRole('heading', { name: 'Challenge summary' })).toBeVisible();
      await expect(preview.getByRole('heading', { name: "What you'll practice" })).toBeVisible();
      await expect(preview.getByRole('heading', { name: 'What Premium unlocks' })).toBeVisible();

      const summary = normalizeText(await page.getByTestId('premium-preview-summary').innerText());
      expect(summary.length, `summary length for ${previewCase.path}`).toBeGreaterThan(80);
      expect(summary, `complete summary for ${previewCase.path}`).toMatch(/[.!?]$/);
      expect(summary.toLowerCase(), `summary does not repeat title on ${previewCase.path}`).not.toMatch(
        new RegExp(`^${escapeRegExp(previewCase.h1.toLowerCase())}(?:\\b|:)`),
      );

      const outcomes = page.getByTestId('premium-preview-outcomes').locator('li');
      const outcomeCount = await outcomes.count();
      expect(outcomeCount, `outcome count for ${previewCase.path}`).toBeGreaterThanOrEqual(3);
      expect(outcomeCount, `outcome count for ${previewCase.path}`).toBeLessThanOrEqual(5);
      for (let index = 0; index < outcomeCount; index += 1) {
        const outcome = normalizeText(await outcomes.nth(index).innerText());
        expect(outcome, `complete outcome ${index + 1} for ${previewCase.path}`).toMatch(/[.!?]$/);
      }

      const previewText = normalizeText(await preview.innerText());
      for (const required of previewCase.requiredPracticeCopy) {
        expect(previewText, `${previewCase.path} covers ${required}`).toContain(required);
      }
      for (const label of RAW_SEO_LABELS) {
        expect(previewText.toLowerCase(), `${previewCase.path} hides raw SEO label ${label}`).not.toContain(label);
      }
      for (const pattern of PREMIUM_COPY_GUARDS) {
        expect(previewText, `${previewCase.path} rejects ${pattern}`).not.toMatch(pattern);
      }
      expect(previewText).not.toMatch(/\b(?:react|angular|vue)\b/);
      expect(bodyText).not.toMatch(/\bGoogle\s*\+\d+\b/i);

      await expect(
        page.locator(
          '[data-testid*="solution"], [data-testid*="editor"], [data-testid*="run-tests"], [data-testid*="run-checks"]',
        ),
      ).toHaveCount(0);
      await expect(page.getByRole('button', { name: /show|reveal|view solution/i })).toHaveCount(0);
      expect(
        solutionAssetRequests,
        `${previewCase.path} must not fetch a Premium solution asset while locked`,
      ).toEqual([]);

      const robots = normalizeText(
        (await page.locator('meta[name="robots"]').getAttribute('content')) || '',
      ).toLowerCase();
      // The runtime SEO service intentionally hardens non-production hosts to
      // nofollow. The raw prerender assertion below verifies the production
      // noindex,follow policy emitted into the built route.
      expect(robots).toBe('noindex,nofollow');
    });
  }

  test('Angular Tabs public preview teaches @if without exposing legacy syntax or paid controls', async ({ page }) => {
    const bodyText = await openHydratedRoute(
      page,
      '/angular/coding/angular-tabs-switcher',
      'Angular Tabs / Multi-View Switcher',
    );
    expect(bodyText).toContain('Angular @if control flow');
    expect(bodyText).not.toMatch(/\*ngIf|\*ngFor|\bNgIf\b|\bNgFor\b|\bNgSwitch\b/);
    await expect(page.locator('[role="tab"]')).toHaveCount(0);
    await expect(page.locator('.locked-shell')).toBeVisible();
  });

  test('autosave preview uses human guide labels instead of raw SEO anchor text', async ({ page }) => {
    const bodyText = await openHydratedRoute(
      page,
      '/system-design/multi-step-form-autosave',
      'Multi-step Form with Autosave',
    );
    expect(bodyText).toContain('Performance and interaction latency');
    expect(bodyText).toContain('Evaluation rubric');
    expect(bodyText).toContain('Common autosave failure modes');
    for (const label of RAW_SEO_LABELS) {
      expect(bodyText.toLowerCase()).not.toContain(label);
    }
  });

  test('raw prerender HTML preserves access/indexing and excludes Premium solution payloads', async ({ request }) => {
    for (const previewCase of PREMIUM_PREVIEWS) {
      const html = await readRawHtml(request, previewCase.path);
      const body = rawBodyMarkup(html);
      const robots = normalizeText(extractMeta(html, 'robots')).replace(/\s+/g, '').toLowerCase();

      expect(extractCanonical(html), `canonical URL for ${previewCase.path}`).toBe(
        expectedCanonical(previewCase.path),
      );
      expect(robots, `robots for ${previewCase.path}`).toBe('noindex,follow');
      expect(body, `locked shell for ${previewCase.path}`).toMatch(/\blocked-shell\b/i);
      expect(body, `no paid editor/test UI on ${previewCase.path}`).not.toMatch(
        /data-testid=["'][^"']*(?:solution|editor|run-tests|run-checks)[^"']*["']/i,
      );
      expect(body, `no solution controls on ${previewCase.path}`).not.toMatch(
        /\b(?:Show|Reveal|View) solution\b/i,
      );
      expect(body, `no rendered solution file tabs on ${previewCase.path}`).not.toMatch(
        /\bsolution-files-tabs\b/i,
      );
      expect(html, `no solutionBlock transfer state on ${previewCase.path}`).not.toMatch(
        /(?:"|&quot;)solutionBlock(?:"|&quot;)\s*:/i,
      );
      expect(html, `no solutionAsset transfer state on ${previewCase.path}`).not.toMatch(
        /(?:"|&quot;)solutionAsset(?:"|&quot;)\s*:/i,
      );
      expect(html, `no solution asset URL on ${previewCase.path}`).not.toMatch(
        /assets\/sb\/[^"'\s<]*\/solution\//i,
      );
    }

    for (const path of FREE_REACT_ROUTES) {
      const html = await readRawHtml(request, path);
      const body = rawBodyMarkup(html);
      const robots = normalizeText(extractMeta(html, 'robots')).replace(/\s+/g, '').toLowerCase();

      expect(extractCanonical(html), `canonical URL for ${path}`).toBe(expectedCanonical(path));
      expect(robots, `free indexing for ${path}`).toBe('index,follow');
      expect(body, `free route is not paywalled on ${path}`).not.toMatch(/\blocked-shell\b/i);
    }
  });
});
