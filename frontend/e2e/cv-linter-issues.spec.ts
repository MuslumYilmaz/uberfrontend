import { test, expect } from './fixtures';

test('cv linter shows evidence, docx recovery CTA, and confidence-aware keyword warnings', async ({ page }) => {
  await page.route('**/api/tools/cv/analyze', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        scores: {
          overall: 64,
          ats: 15,
          structure: 14,
          impact: 17,
          consistency: 10,
          keywords: 8,
        },
        breakdown: [
          { id: 'ats', label: 'ATS & Readability', score: 15, max: 25 },
          { id: 'structure', label: 'Structure & Completeness', score: 14, max: 20 },
          { id: 'impact', label: 'Impact & Evidence', score: 17, max: 25 },
          { id: 'consistency', label: 'Consistency & Hygiene', score: 10, max: 15 },
          { id: 'keywords', label: 'Keyword Coverage', score: 8, max: 15 },
        ],
        issues: [
          {
            id: 'keyword_missing',
            severity: 'warn',
            category: 'keywords',
            scoreDelta: -6,
            title: 'Keyword coverage is low',
            message: 'Weighted keyword coverage is low.',
            explanation: 'Weighted keyword coverage is 42% (experience-weighted).',
            why: 'Role-aligned terms improve ATS matching.',
            fix: 'Add role keywords naturally in experience bullets.',
            evidence: [
              {
                line: 12,
                excerpt: 'Missing critical keywords in experience bullets',
                details: 'Missing critical keywords in experience bullets: accessibility, performance, change detection.',
                source: 'pdf',
                confidence: 0.44,
              },
            ],
          },
          {
            id: 'merged_bullets_suspected',
            severity: 'warn',
            category: 'ats',
            scoreDelta: -3,
            title: 'Merged bullets suspected after PDF extraction',
            message: 'Multiple bullets appear merged into single lines.',
            explanation: 'Merged bullets can undercount outcomes and keywords.',
            why: 'ATS parsers may misread merged bullets.',
            fix: 'Re-export PDF with one bullet per line.',
            evidence: [
              {
                line: 21,
                excerpt: 'Improved perf by 30%. • Built dashboards for releases.',
                details: 'Improved perf by 30%. • Built dashboards for releases. • Added retry logic.',
                source: 'pdf',
                confidence: 0.52,
              },
            ],
          },
          {
            id: 'low_extraction_quality',
            severity: 'info',
            category: 'ats',
            scoreDelta: 0,
            title: 'PDF extraction quality is low; some scores may be undercounted',
            message: 'Parsing quality is low.',
            explanation: 'Some checks are less reliable with merged PDF text.',
            why: 'Score confidence drops when extraction is noisy.',
            fix: 'Try DOCX for best results.',
            evidence: [
              {
                line: 21,
                excerpt: 'Merged bullet tokens detected',
                source: 'pdf',
                confidence: 0.38,
              },
            ],
          },
        ],
        keywordCoverage: {
          role: 'senior_frontend_angular',
          roleLabel: 'Senior Frontend (Angular)',
          total: 14,
          found: ['typescript', 'rxjs'],
          missing: ['accessibility', 'performance', 'change detection', 'ci/cd'],
          missingCritical: ['accessibility', 'performance', 'change detection'],
          skillsOnly: ['rxjs'],
          foundInExperienceCount: 0,
          coveragePct: 14,
        },
        meta: {
          source: 'text',
          extractionStatus: 'text_input',
          textLength: 1480,
          fallbackRecommended: false,
          role: 'senior_frontend_angular',
          timingsMs: {
            validation: 0,
            extraction: 0,
            scoring: 0,
            total: 0,
          },
        },
        debug: {
          extractionQuality: {
            level: 'low',
            score: 0.42,
          },
          missingKeywords: {
            critical: ['accessibility', 'performance', 'change detection'],
            strong: ['ci/cd', 'observability'],
          },
        },
      }),
    });
  });

  await page.goto('/tools/cv');
  await expect(page.getByTestId('cv-upload-card')).toBeVisible();

  await page.getByTestId('cv-use-sample').click();
  await page.getByTestId('cv-analyze-text').click();

  await expect(page.getByTestId('cv-results')).toBeVisible();
  await expect(page.getByTestId('cv-undercounted-badge')).toBeVisible();
  await expect(page.getByTestId('cv-docx-cta')).toBeVisible();
  await expect(page.getByTestId('cv-low-confidence').first()).toBeVisible();

  await page.getByTestId('cv-tab-issues').click();
  await expect(page.getByTestId('cv-issue-evidence-keyword_missing').getByText('Triggered by:')).toBeVisible();
  await expect(page.getByText(/\(line 12\)/)).toBeVisible();

  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByTestId('cv-docx-cta-button').click();
  const fileChooser = await fileChooserPromise;
  const accept = await fileChooser.element().getAttribute('accept');
  expect(String(accept || '')).toContain('.docx');

  const keywordChip = page.getByTestId('cv-keyword-chip-keyword_missing').first();
  await expect(keywordChip).toBeVisible();
  await keywordChip.click();
  await expect(page.getByTestId('cv-success-toast')).toContainText('Copied suggestion');
});
