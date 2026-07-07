'use strict';

const { buildCvContext } = require('../services/tools/cv/context');
const { createRules } = require('../services/tools/cv/rules');
const { scoreCvContext } = require('../services/tools/cv/engine');
const { getRolePack, normalizeRoleId } = require('../services/tools/cv/keyword-packs');
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

function issueById(report, id) {
  return (report.issues || []).find((issue) => issue.id === id);
}

const ALL_ROLE_IDS = [
  'junior_frontend_general',
  'junior_frontend_angular',
  'junior_frontend_react',
  'mid_frontend_general',
  'mid_frontend_angular',
  'mid_frontend_react',
  'senior_frontend_general',
  'senior_frontend_angular',
  'senior_frontend_react',
];

describe('cv-linter role model levels', () => {
  test('normalizes all exact role IDs and preserves legacy aliases', () => {
    for (const roleId of ALL_ROLE_IDS) {
      expect(normalizeRoleId(roleId)).toBe(roleId);
    }

    expect(normalizeRoleId('angular')).toBe('senior_frontend_angular');
    expect(normalizeRoleId('react')).toBe('senior_frontend_react');
    expect(normalizeRoleId('general')).toBe('senior_frontend_general');
    expect(normalizeRoleId('general_fe')).toBe('senior_frontend_general');
    expect(normalizeRoleId('frontend')).toBe('senior_frontend_general');
  });

  test('role packs expose level and stack metadata', () => {
    expect(getRolePack('junior_frontend_react')).toEqual(expect.objectContaining({
      id: 'junior_frontend_react',
      label: 'Junior Frontend (React)',
      level: 'junior',
      stack: 'react',
    }));
    expect(getRolePack('mid_frontend_general')).toEqual(expect.objectContaining({
      id: 'mid_frontend_general',
      label: 'Mid Frontend (General FE)',
      level: 'mid',
      stack: 'general',
    }));
    expect(getRolePack('senior_frontend_angular')).toEqual(expect.objectContaining({
      id: 'senior_frontend_angular',
      label: 'Senior Frontend (Angular)',
      level: 'senior',
      stack: 'angular',
    }));
  });
});

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
      { id: 'keyword_missing_critical', scoreDelta: -4 },
      { id: 'stack_contradiction', scoreDelta: -5 },
    ];

    const adjusted = applyExtractionPenaltyAdjustments(issues, { level: 'low' });
    const byId = new Map(adjusted.map((item) => [item.id, item]));

    expect(byId.get('no_outcome_language').appliedScoreDelta).toBeCloseTo(-1.2, 2);
    expect(byId.get('low_bullet_count').appliedScoreDelta).toBeCloseTo(-1.6, 2);
    expect(byId.get('keyword_missing').appliedScoreDelta).toBeCloseTo(-3.66, 2);
    expect(byId.get('keyword_missing_critical').appliedScoreDelta).toBeCloseTo(-2.44, 2);
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

  test('framework keyword variants match Angular and React target packs', () => {
    const angularJsReport = analyze(`
Alex
alex@example.com
linkedin.com/in/alex

Experience
- Built AngularJS customer dashboards in TypeScript with RxJS observables.

Skills
Angular.js, Angular 2+, TypeScript, RxJS
    `.trim(), 'senior_frontend_angular');

    const reactJsReport = analyze(`
Riley
riley@example.com
linkedin.com/in/riley

Experience
- Built ReactJS analytics apps with useState, useEffect, Redux Toolkit, Jest, Mocha, and Chai.

Skills
React.js, Testing Library, Context API, Zustand
    `.trim(), 'senior_frontend_react');

    expect(new Set(angularJsReport.keywordCoverage.found).has('angular')).toBe(true);
    expect(new Set(reactJsReport.keywordCoverage.found).has('react')).toBe(true);
    expect(new Set(reactJsReport.keywordCoverage.found).has('hooks')).toBe(true);
    expect(new Set(reactJsReport.keywordCoverage.found).has('testing')).toBe(true);
    expect(new Set(reactJsReport.keywordCoverage.found).has('state management')).toBe(true);
  });

  test('target role affects keyword score for React-heavy and Angular-heavy CVs', () => {
    const reactHeavy = `
Alex
alex@example.com
linkedin.com/in/alex

Experience
- Built ReactJS commerce apps in TypeScript with useState and useEffect hooks, improving performance by 30%.
- Managed Redux Toolkit state management and Testing Library coverage, reducing defects by 25%.
- Improved accessibility and web vitals across checkout flows used by enterprise customers.

Skills
React.js, TypeScript, Redux Toolkit, Jest, Testing Library, Next.js, SSR, CI/CD
    `.trim();

    const angularHeavy = `
Casey
casey@example.com
linkedin.com/in/casey

Experience
- Built AngularJS enterprise dashboards in TypeScript with RxJS observables and NgRx state management, improving performance by 30%.
- Optimized Angular 2+ lazy loading and change detection, improving accessibility for enterprise customers.
- Expanded Jest testing and CI/CD checks to reduce frontend regression defects by 25%.

Skills
Angular.js, Angular 2+, TypeScript, RxJS, NgRx, Jest, Accessibility, Performance
    `.trim();

    const reactAsReact = analyze(reactHeavy, 'senior_frontend_react');
    const reactAsAngular = analyze(reactHeavy, 'senior_frontend_angular');
    const angularAsAngular = analyze(angularHeavy, 'senior_frontend_angular');
    const angularAsReact = analyze(angularHeavy, 'senior_frontend_react');

    expect(reactAsReact.keywordCoverage.weightedCoveragePct).toBeGreaterThan(reactAsAngular.keywordCoverage.weightedCoveragePct);
    expect(reactAsReact.scores.keywords).toBeGreaterThan(reactAsAngular.scores.keywords);
    expect(angularAsAngular.keywordCoverage.weightedCoveragePct).toBeGreaterThan(angularAsReact.keywordCoverage.weightedCoveragePct);
    expect(angularAsAngular.scores.keywords).toBeGreaterThan(angularAsReact.scores.keywords);
  });

  test('critical keyword penalty scales by missing critical count', () => {
    const oneMissing = analyze(`
Alex
alex@example.com
linkedin.com/in/alex

Experience
- Built Angular apps in TypeScript with RxJS and NgRx state management, improving performance by 20%.
- Expanded Jest testing and reduced release defects by 25%.
    `.trim());

    const twoMissing = analyze(`
Alex
alex@example.com
linkedin.com/in/alex

Experience
- Built Angular apps in TypeScript with RxJS and NgRx state management, improving performance by 20%.
    `.trim());

    const threeMissing = analyze(`
Alex
alex@example.com
linkedin.com/in/alex

Experience
- Built Angular apps in TypeScript with RxJS observables, improving performance by 20%.
    `.trim());

    const fiveMissing = analyze(`
Alex
alex@example.com
linkedin.com/in/alex

Experience
- Built Angular apps in TypeScript for enterprise users.
    `.trim());

    expect(issueById(oneMissing, 'keyword_missing_critical').scoreDelta).toBe(-2);
    expect(issueById(twoMissing, 'keyword_missing_critical').scoreDelta).toBe(-4);
    expect(issueById(threeMissing, 'keyword_missing_critical').scoreDelta).toBe(-6);
    expect(issueById(fiveMissing, 'keyword_missing_critical').scoreDelta).toBe(-8);
  });
});

describe('cv-linter level-aware scoring', () => {
  test('junior projects-only CV avoids missing experience when projects have bullets', () => {
    const text = `
Taylor Roe
taylor@example.com
linkedin.com/in/taylorroe

Projects
- Built a responsive JavaScript portfolio with accessible HTML and CSS components.
- Integrated a REST API and documented the project workflow on GitHub.

Skills
JavaScript, HTML, CSS, responsive design, GitHub, API integration, accessibility
    `.trim();

    const juniorContext = buildCvContext(text, { roleId: 'junior_frontend_general' });
    const juniorReport = scoreCvContext(juniorContext, createRules());
    const seniorReport = analyze(text, 'senior_frontend_general');

    expect(juniorContext.projectBulletCount).toBe(2);
    expect(issueById(juniorReport, 'no_experience_section')).toBeUndefined();
    expect(issueById(seniorReport, 'no_experience_section')).toBeDefined();
  });

  test('missing LinkedIn penalty is lighter for junior and mid roles', () => {
    const text = `
Taylor Roe
taylor@example.com

Experience
- Built responsive checkout views with JavaScript and TypeScript.
- Improved accessibility in forms and navigation patterns.
- Added Jest testing for user-facing interactions.
- Integrated REST APIs for account settings.
- Optimized performance for dashboard rendering.
- Documented GitHub workflows and CI/CD checks.

Education
BSc Computer Science
    `.trim();

    const junior = issueById(analyze(text, 'junior_frontend_general'), 'missing_linkedin');
    const mid = issueById(analyze(text, 'mid_frontend_general'), 'missing_linkedin');
    const senior = issueById(analyze(text, 'senior_frontend_general'), 'missing_linkedin');

    expect(junior).toEqual(expect.objectContaining({ severity: 'info', scoreDelta: -1 }));
    expect(mid).toEqual(expect.objectContaining({ severity: 'warn', scoreDelta: -2 }));
    expect(senior).toEqual(expect.objectContaining({ severity: 'warn', scoreDelta: -3 }));
  });

  test('bullet count thresholds differ by junior, mid, and senior roles', () => {
    const text = `
Taylor Roe
taylor@example.com
linkedin.com/in/taylorroe

Experience
- Built accessible checkout views with JavaScript and TypeScript.
- Implemented form validation with clear error states.
- Refactored styling for responsive layouts across breakpoints.
- Improved keyboard navigation through reusable focus helpers.

Education
BSc Computer Science
    `.trim();

    expect(issueById(analyze(text, 'junior_frontend_general'), 'low_bullet_count')).toBeUndefined();
    expect(issueById(analyze(text, 'mid_frontend_general'), 'low_bullet_count')).toBeDefined();
    expect(issueById(analyze(text, 'senior_frontend_general'), 'low_bullet_count')).toBeDefined();
  });

  test('numeric density thresholds differ by junior, mid, and senior roles', () => {
    const text = `
Taylor Roe
taylor@example.com
linkedin.com/in/taylorroe

Experience
- Improved checkout performance by 12% through render cleanup.
- Built accessible checkout views with React and TypeScript.
- Implemented form validation with clear error states.
- Refactored styling for responsive layouts across breakpoints.
- Added Jest testing for user-facing interactions.
- Integrated REST APIs for account settings.

Education
BSc Computer Science
    `.trim();

    expect(issueById(analyze(text, 'junior_frontend_react'), 'low_numeric_density')).toBeUndefined();
    expect(issueById(analyze(text, 'mid_frontend_react'), 'low_numeric_density')).toBeUndefined();
    expect(issueById(analyze(text, 'senior_frontend_react'), 'low_numeric_density')).toBeDefined();
  });

  test('experience metric and scope penalties are level-aware', () => {
    const text = `
Taylor Roe
taylor@example.com
linkedin.com/in/taylorroe

Experience
- Built accessible checkout views with React and TypeScript.
- Implemented form validation with clear error states.
- Refactored styling for responsive layouts across breakpoints.
- Improved keyboard navigation through reusable focus helpers.

Education
BSc Computer Science
    `.trim();

    const juniorReport = analyze(text, 'junior_frontend_react');
    const midReport = analyze(text, 'mid_frontend_react');
    const seniorReport = analyze(text, 'senior_frontend_react');

    expect(issueById(juniorReport, 'no_metrics_in_experience')).toEqual(expect.objectContaining({
      severity: 'info',
      scoreDelta: -1,
    }));
    expect(issueById(juniorReport, 'no_scope_language')).toBeUndefined();
    expect(issueById(midReport, 'no_metrics_in_experience')).toEqual(expect.objectContaining({
      severity: 'warn',
      scoreDelta: -3,
    }));
    expect(issueById(midReport, 'no_scope_language')).toEqual(expect.objectContaining({
      severity: 'info',
      scoreDelta: -1,
    }));
    expect(issueById(seniorReport, 'no_metrics_in_experience')).toEqual(expect.objectContaining({
      severity: 'warn',
      scoreDelta: -4,
    }));
    expect(issueById(seniorReport, 'no_scope_language')).toEqual(expect.objectContaining({
      severity: 'info',
      scoreDelta: -2,
    }));
  });

  test('junior and mid keyword packs expose role labels, gaps, and weighted coverage', () => {
    const juniorText = `
Taylor Roe
taylor@example.com
linkedin.com/in/taylorroe

Projects
- Built JavaScript pages with HTML and CSS for a personal portfolio.

Education
BSc Computer Science
    `.trim();

    const midText = `
Morgan Lee
morgan@example.com
linkedin.com/in/morganlee

Experience
- Built React hooks in TypeScript with Redux Toolkit state management for checkout flows.
- Added Testing Library and Jest coverage, improving release confidence by 18%.
- Optimized performance and API integration for dashboard users.

Skills
React.js, TypeScript, useState, useEffect, Redux Toolkit, Testing Library, API integration, CI/CD
    `.trim();

    const junior = analyze(juniorText, 'junior_frontend_general');
    const mid = analyze(midText, 'mid_frontend_react');

    expect(junior.keywordCoverage.roleLabel).toBe('Junior Frontend (General FE)');
    expect(junior.keywordCoverage.weightedCoveragePct).toBeGreaterThan(0);
    expect(junior.keywordCoverage.missingCritical).toEqual(expect.arrayContaining([
      'responsive design',
      'git / github',
      'api integration',
    ]));

    expect(mid.keywordCoverage.roleLabel).toBe('Mid Frontend (React)');
    expect(mid.keywordCoverage.weightedCoveragePct).toBeGreaterThan(40);
    expect(mid.keywordCoverage.missingCritical).toEqual(expect.arrayContaining(['accessibility']));
  });
});

describe('cv-linter implicit bullet detection', () => {
  test('counts markerless achievement lines in experience as bullets', () => {
    const context = buildCvContext(`
Jordan
jordan@example.com
linkedin.com/in/jordan

Experience
Senior Frontend Engineer | Acme Corp | Jan 2022 - Present
Acme Corp
Built ReactJS dashboards using Redux Toolkit, improving UI performance by 30%
Optimized checkout accessibility and reduced keyboard navigation defects by 22%
Implemented Testing Library coverage and cut regression bugs by 35%

Education
BSc Computer Science
    `.trim());

    expect(context.bulletCount).toBe(3);
    expect(context.experienceBulletCount).toBe(3);
    expect(context.bulletLines.map((bullet) => bullet.line)).toEqual([
      'Built ReactJS dashboards using Redux Toolkit, improving UI performance by 30%',
      'Optimized checkout accessibility and reduced keyboard navigation defects by 22%',
      'Implemented Testing Library coverage and cut regression bugs by 35%',
    ]);
  });

  test('does not count date, title, company, or location lines as implicit bullets', () => {
    const context = buildCvContext(`
Jordan
jordan@example.com
linkedin.com/in/jordan

Experience
Senior Frontend Engineer | Acme Corp | Jan 2022 - Present
Acme Corp
January 2022 - Present
New York, NY

Education
BSc Computer Science
    `.trim());

    expect(context.bulletCount).toBe(0);
    expect(context.experienceBulletCount).toBe(0);
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

describe('cv-linter confidence and evidence normalization', () => {
  test('warn and info issues consistently include evidence and confidence', () => {
    const report = analyze(`
No Contact Header

Experience
- Worked on frontend tasks.
- Built dashboard widgets.
- Fixed bugs in UI pages.
- Improved a flow by 10%.
    `.trim());

    for (const issue of report.issues) {
      if (issue.severity === 'warn' || issue.severity === 'info') {
        expect(Array.isArray(issue.evidence)).toBe(true);
        expect(issue.evidence.length).toBeGreaterThan(0);
      }
      expect(Number.isFinite(issue.confidence)).toBe(true);
      expect(issue.confidence).toBeGreaterThanOrEqual(0);
      expect(issue.confidence).toBeLessThanOrEqual(1);
    }
  });
});
