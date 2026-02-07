'use strict';

const { buildCvContext } = require('../services/tools/cv/context');
const { createRules } = require('../services/tools/cv/rules');
const { scoreCvContext } = require('../services/tools/cv/engine');
const { makeSnippet, maskPII, addEvidence } = require('../services/tools/cv/linter/evidence');
const { analyzeExtractionQuality } = require('../services/tools/cv/linter/analyzers/extraction-quality');
const { applyExtractionPenaltyAdjustments } = require('../services/tools/cv/linter/scoring/penalty-adjustments');

function analyze(text, roleId = 'senior_frontend_angular') {
  const ctx = buildCvContext(text, { roleId });
  return scoreCvContext(ctx, createRules());
}

function issueMap(report) {
  return new Map((report.issues || []).map((issue) => [issue.id, issue]));
}

describe('cv-linter vNext evidence helpers', () => {
  test('makeSnippet truncates and maskPII redacts email/phone patterns', () => {
    const longText = 'A'.repeat(180);
    expect(makeSnippet(longText, 140).length).toBeLessThanOrEqual(140);

    const masked = maskPII('Reach me at john.doe@example.com or +1 (555) 987-1234.');
    expect(masked).toContain('j***e@example.com');
    expect(masked).toContain('234');
    expect(masked).not.toContain('555');
    expect(masked).not.toContain('987');
  });

  test('addEvidence keeps normalized max 3 entries', () => {
    const issue = addEvidence(
      { id: 'x' },
      [
        { snippet: 'line one', lineStart: 1 },
        { snippet: 'line two', lineStart: 2 },
        { snippet: 'line three', lineStart: 3 },
        { snippet: 'line four', lineStart: 4 },
      ]
    );

    expect(issue.evidence).toHaveLength(3);
    expect(issue.evidence[0]).toEqual(expect.objectContaining({ snippet: 'line one', lineStart: 1 }));
  });

  test('triggered issues include bounded evidence snippets', () => {
    const report = analyze(`
No Contact

Experience
Built things quickly. • Fixed bugs. • Worked on tasks.
    `.trim());

    for (const issue of report.issues) {
      expect(Array.isArray(issue.evidence)).toBe(true);
      expect(issue.evidence.length).toBeGreaterThan(0);
      for (const evidence of issue.evidence) {
        expect(String(evidence.snippet || '').length).toBeLessThanOrEqual(140);
      }
    }
  });
});

describe('cv-linter extraction quality analyzer', () => {
  test('classifies high / medium / low quality consistently', () => {
    const high = analyzeExtractionQuality([
      { text: 'Built Angular modules and improved TTI by 20%.' },
      { text: 'Optimized change detection and reduced LCP by 320ms.' },
      { text: 'Implemented accessibility audits with WCAG checks.' },
    ], []);
    expect(high.level).toBe('high');

    const medium = analyzeExtractionQuality([
      { text: 'Built dashboards with observability and test coverage.' },
      { text: 'Reduced latency by 20%. • Developed shared release scripts.' },
      { text: 'This line is intentionally very long and verbose to increase average line length for extraction testing but still readable and noisy for scoring.' },
      { text: 'Refactored modules for better maintainability and faster loads.' },
      { text: 'A' },
      { text: 'B' },
      { text: 'Implemented release guardrails.' },
      { text: 'Improved CI stability and test reliability.' },
    ], [{ lineNumber: 2, text: 'Reduced latency by 20%. • Developed shared release scripts.' }]);
    expect(medium.level).toBe('medium');

    const low = analyzeExtractionQuality([
      { text: 'Improved perf by 20%. • Built shared library • Automated deployment.' },
      { text: 'Reduced bundle size by 35%. • Refactored legacy modules • Stabilized release flow.' },
      { text: 'This line is intentionally extremely long to emulate PDF extraction issues where wrapped bullets collapse into one very long row without useful separators and it keeps going beyond normal readable lengths for this test case.' },
      { text: 'foo-' },
      { text: 'bar' },
      { text: 'x' },
      { text: 'y' },
    ], [{ lineNumber: 1, text: 'merged' }, { lineNumber: 2, text: 'merged' }]);

    expect(low.level).toBe('low');
    expect(low.signals.midlineBulletTokens).toBeGreaterThan(0);
  });
});

describe('cv-linter extraction-based penalty down-weighting', () => {
  test('reduces only bullet-dependent penalties', () => {
    const issues = [
      { id: 'no_outcome_language', scoreDelta: -3 },
      { id: 'low_bullet_count', scoreDelta: -4 },
      { id: 'keyword_missing', scoreDelta: -6 },
      { id: 'stack_contradiction', scoreDelta: -5 },
    ];

    const adjusted = applyExtractionPenaltyAdjustments(issues, { level: 'low' });
    const byId = new Map(adjusted.map((item) => [item.id, item]));

    expect(byId.get('no_outcome_language').appliedScoreDelta).toBeCloseTo(-1.2, 2);
    expect(byId.get('low_bullet_count').appliedScoreDelta).toBeCloseTo(-1.6, 2);
    expect(byId.get('keyword_missing').appliedScoreDelta).toBeCloseTo(-3.66, 2);
    expect(byId.get('stack_contradiction').appliedScoreDelta).toBe(-5);
  });
});

describe('cv-linter keyword coverage v2', () => {
  test('skills-only keywords get partial credit and experience usage gets full credit', () => {
    const skillsOnlyText = `
Alex Doe
alex@example.com
linkedin.com/in/alex

Skills
Angular, TypeScript, RxJS, state mgmt, unit tests, pipeline
    `.trim();

    const experienceText = `
Alex Doe
alex@example.com
linkedin.com/in/alex

Experience
- Built Angular platform in TypeScript with RxJS and ngrx state management, improving render time by 24%.
- Added unit tests and CI/CD pipeline checks to reduce regression incidents by 35%.
    `.trim();

    const skillsOnlyReport = analyze(skillsOnlyText);
    const experienceReport = analyze(experienceText);

    expect(skillsOnlyReport.keywordCoverage.foundInExperienceCount).toBe(0);
    expect(skillsOnlyReport.keywordCoverage.weightedCoveragePct).toBeLessThan(skillsOnlyReport.keywordCoverage.coveragePct);
    expect(experienceReport.keywordCoverage.foundInExperienceCount).toBeGreaterThan(0);
    expect(experienceReport.keywordCoverage.weightedCoveragePct).toBeGreaterThan(skillsOnlyReport.keywordCoverage.weightedCoveragePct);
  });

  test('synonyms are matched and missing critical list is produced', () => {
    const text = `
Casey
casey@example.com
linkedin.com/in/casey

Experience
- Improved pipeline reliability and expanded unit tests for frontend modules.
- Led state mgmt cleanup and improved lighthouse scores.
    `.trim();

    const report = analyze(text);
    const found = new Set(report.keywordCoverage.found);

    expect(found.has('ci/cd')).toBe(true);
    expect(found.has('testing')).toBe(true);
    expect(found.has('state management')).toBe(true);
    expect(Array.isArray(report.debug?.missingKeywords?.critical)).toBe(true);
  });
});

describe('cv-linter outcome language v2', () => {
  test('metric presence counts as outcome evidence', () => {
    const text = `
Jordan
jordan@example.com
linkedin.com/in/jordan

Experience
- Maintained release pipeline and reduced p95 latency from 600ms to 280ms.
- Worked on dashboard revamp, improving conversion by 12%.
- Implemented alerts and cut page crashes by 30%.
- Automated deploy checks and reduced rollback rate by 40%.
- Refined caching and reduced API time by 120ms.
- Improved bundle splitting and reduced JS payload by 22%.
    `.trim();

    const report = analyze(text);
    expect(issueMap(report).has('no_outcome_language')).toBe(false);
  });

  test('small bullet samples produce info instead of warning', () => {
    const text = `
Sam
sam@example.com
linkedin.com/in/sam

Experience
- Worked on frontend tasks.
- Built UI components.
- Fixed bugs in dashboard.
    `.trim();

    const report = analyze(text);
    const issue = issueMap(report).get('no_outcome_language');
    expect(issue).toBeDefined();
    expect(issue.severity).toBe('info');
  });

  test('low extraction quality downgrades no_outcome_language and adds extraction issue', () => {
    const text = `
Morgan
morgan@example.com
linkedin.com/in/morgan

Experience
Built features quickly. • Shipped updates often. • Managed releases.
Improved dashboards. • Implemented modules. • Worked across teams.
Maintained apps. • Handled bugs. • Supported launches.
    `.trim();

    const report = analyze(text);
    const issues = issueMap(report);

    expect(issues.has('low_extraction_quality')).toBe(true);
    const outcomeIssue = issues.get('no_outcome_language');
    if (outcomeIssue) {
      expect(outcomeIssue.severity).toBe('info');
    }
  });
});
