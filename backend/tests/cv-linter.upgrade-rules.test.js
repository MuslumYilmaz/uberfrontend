'use strict';

const { buildCvContext } = require('../services/tools/cv/context');
const { scoreCvContext } = require('../services/tools/cv/engine');
const { createRules } = require('../services/tools/cv/rules');

function runReport(text, roleId = 'senior_frontend_angular') {
  const context = buildCvContext(text, { roleId });
  const report = scoreCvContext(context, createRules());
  return { context, report };
}

function issueIds(report) {
  return new Set((report.issues || []).map((issue) => issue.id));
}

function issueById(report, id) {
  return (report.issues || []).find((issue) => issue.id === id);
}

describe('cv-linter upgraded heuristics and rules', () => {
  test('skills alias detection prevents false positive missing_skills_section', () => {
    const text = `
Alex Doe
alex@example.com | linkedin.com/in/alexdoe
Senior Frontend Engineer with 6 years building accessible enterprise UIs.
Languages: TypeScript, JavaScript
Technologies: Angular, RxJS, NgRx, Jest, Cypress

Experience
- Built dashboard modules improving page speed by 28%.
    `.trim();

    const { context, report } = runReport(text);
    const ids = issueIds(report);

    expect(context.sectionsPresent.skills).toBe(true);
    expect(context.sectionDetection.headingSuggestion.skills).toBe(true);
    expect(ids.has('missing_skills_section')).toBe(false);
    expect(ids.has('implicit_skills_heading_suggestion')).toBe(true);
  });

  test('summary heuristic detects intro paragraph without heading', () => {
    const text = `
Jane Doe
jane@example.com | linkedin.com/in/janedoe
Senior frontend engineer with 8 years of experience in Angular platforms, performance tuning, and accessibility standards.
Focused on shipping scalable UI architecture for high-traffic products.

Experience
- Optimized change detection and reduced interaction latency by 35%.

Skills
Angular, TypeScript, RxJS, Testing
    `.trim();

    const { context, report } = runReport(text);
    const ids = issueIds(report);

    expect(context.sectionsPresent.summary).toBe(true);
    expect(context.sectionDetection.headingSuggestion.summary).toBe(true);
    expect(ids.has('missing_summary_section')).toBe(false);
    expect(ids.has('implicit_summary_heading_suggestion')).toBe(true);
  });

  test('bullet parser recognizes unicode, symbol, and numbered bullets', () => {
    const text = `
Chris
chris@example.com
linkedin.com/in/chris

Experience
• Built feature flags for checkout
● Reduced bundle size by 18%
◦ Improved Lighthouse score to 95
- Shipped search indexing
* Implemented CI gates
1. Designed alerting workflows
2) Automated release checklist
    `.trim();

    const { context } = runReport(text);
    expect(context.bulletCount).toBeGreaterThanOrEqual(7);
  });

  test('merged_bullets_suspected is detected for merged PDF bullet lines', () => {
    const text = `
Mina Doe
mina@example.com | linkedin.com/in/minadoe

Experience
Improved API response times by 20%. • Developed monitoring dashboards for release regressions.
    `.trim();

    const { context, report } = runReport(text);
    const ids = issueIds(report);

    expect(context.mergedBullets.suspected).toBe(true);
    expect(ids.has('merged_bullets_suspected')).toBe(true);
  });

  test('date ranges with hyphen separators do not trigger merged bullet detection', () => {
    const text = `
Robin
robin@example.com | linkedin.com/in/robin

Experience
Senior Engineer | Jan 2021 - Present
Engineer | Mar 2019 - Dec 2020
- Built dashboard modules and improved release stability by 21%.
    `.trim();

    const { context, report } = runReport(text);
    const ids = issueIds(report);

    expect(context.mergedBullets.suspected).toBe(false);
    expect(ids.has('merged_bullets_suspected')).toBe(false);
  });

  test('stack contradiction rule triggers on hard conflicts and skips with explicit clarifier', () => {
    const contradictory = `
Taylor
taylor@example.com | linkedin.com/in/taylor

Experience
- Built MERN ecommerce platform for checkout operations.
- Built Angular storefront modules for the same platform.
    `.trim();

    const clarified = `
Taylor
taylor@example.com | linkedin.com/in/taylor

Experience
- Built MERN-style backend services with Angular frontend + Node backend architecture.
- Migrated from React to Angular during platform modernization.
    `.trim();

    const contradictoryReport = runReport(contradictory).report;
    const clarifiedReport = runReport(clarified).report;

    expect(issueIds(contradictoryReport).has('stack_contradiction')).toBe(true);
    expect(issueIds(clarifiedReport).has('stack_contradiction')).toBe(false);
  });

  test('stack contradiction is softened when mixed-stack context cues are present', () => {
    const text = `
Alex
alex@example.com | linkedin.com/in/alex

Experience
- Developed a MERN stack scheduling platform for operations.
- Introduced real-time updates via Angular UI modules for planners.
    `.trim();

    const report = runReport(text).report;
    const stackIssue = issueById(report, 'stack_contradiction');

    expect(stackIssue).toBeDefined();
    expect(stackIssue.severity).toBe('info');
    expect(stackIssue.scoreDelta).toBe(-2);
  });

  test('date format detector lists multiple formats and reports inconsistency', () => {
    const text = `
Robin
robin@example.com | linkedin.com/in/robin

Experience
Senior Engineer | Jan 2021 - Present
Engineer | 03/2019 - 12/2020
Intern | 2018

Skills
Angular, TypeScript, RxJS
    `.trim();

    const { context, report } = runReport(text);
    const ids = issueIds(report);

    expect(context.dateFormats.usedFormats).toEqual(expect.arrayContaining(['MMM YYYY', 'MM/YYYY', 'YYYY']));
    expect(context.dateFormats.suggestedFormat).toBe('MMM YYYY');
    expect(ids.has('inconsistent_date_format')).toBe(true);
  });

  test('irrelevant non-CV text does not get full impact/consistency scores', () => {
    const text = `
Invoice Q1
Payment instructions and legal references.
Project code list and operational notes.
Section A: Fulfillment Terms
Section B: Internal Policies
    `.trim();

    const { context, report } = runReport(text);
    const ids = issueIds(report);

    expect(context.likelyNonCv).toBe(true);
    expect(ids.has('insufficient_impact_evidence')).toBe(true);
    expect(ids.has('insufficient_consistency_signals')).toBe(true);
    expect(report.scores.impact).toBeLessThanOrEqual(6);
    expect(report.scores.consistency).toBeLessThanOrEqual(5);
  });

  test('cv-like input with structured bullets avoids non-CV guardrails', () => {
    const text = `
Alex Doe
alex@example.com | +1 555 777 9999 | linkedin.com/in/alex
Summary
Senior frontend engineer focused on accessibility and performance.
Skills
Angular, TypeScript, RxJS, NgRx, Jest
Experience
- Improved checkout LCP by 28% across 1.2M monthly sessions.
- Reduced regression rate by 35% by expanding Jest and Cypress coverage.
- Built state management modules with NgRx and improved release stability by 22%.
Education
BSc Computer Science
    `.trim();

    const { context, report } = runReport(text);
    const ids = issueIds(report);

    expect(context.likelyNonCv).toBe(false);
    expect(ids.has('insufficient_impact_evidence')).toBe(false);
    expect(ids.has('insufficient_consistency_signals')).toBe(false);
    expect(report.scores.impact).toBeGreaterThan(0);
    expect(report.scores.consistency).toBeGreaterThan(0);
  });

  test('keyword penalties are de-duplicated when critical keywords are missing', () => {
    const text = `
Alex
alex@example.com | linkedin.com/in/alex

Experience
- Built Angular applications in TypeScript with RxJS and state management, reducing support tickets by 14%.
- Improved testing strategy and performance for checkout flows used by enterprise customers.

Skills
Angular, TypeScript, RxJS, State management, Testing, Performance
    `.trim();

    const report = runReport(text).report;
    const ids = issueIds(report);

    expect(ids.has('keyword_missing_critical')).toBe(true);
    expect(ids.has('keyword_missing')).toBe(false);
  });

  test('non-critical keyword gaps still trigger keyword_missing without critical penalty', () => {
    const text = `
Alex
alex@example.com | linkedin.com/in/alex

Experience
- Built Angular applications in TypeScript with RxJS state management and testing, improving reliability by 18%.
- Improved accessibility and performance across high-traffic UI flows and reduced keyboard navigation issues by 22%.
    `.trim();

    const report = runReport(text).report;
    const ids = issueIds(report);

    expect(ids.has('keyword_missing')).toBe(true);
    expect(ids.has('keyword_missing_critical')).toBe(false);
  });

  test('borderline numeric ratio uses softened low_numeric_density penalty', () => {
    const text = `
Alex
alex@example.com | linkedin.com/in/alex

Experience
- Led frontend module planning for internal commerce tooling.
- Coordinated handoff workflows across platform squads.
- Improved release stability by 12% through component refactors.
- Maintained CI quality checks for UI deployments.
- Partnered with product on scope definition and sequencing.
- Refined reusable component interfaces for adoption.
- Reduced production incidents by 18% with stricter guards.
- Prepared rollout plans for internationalized UI updates.
- Reviewed code quality and standardized review checklists.
- Supported API integration planning for backend teams.
- Improved documentation for onboarding frontend engineers.
    `.trim();

    const report = runReport(text).report;
    const issue = issueById(report, 'low_numeric_density');

    expect(issue).toBeDefined();
    expect(issue.severity).toBe('info');
    expect(issue.scoreDelta).toBe(-2);
  });

  test('borderline outcome ratio uses softened no_outcome_language penalty', () => {
    const text = `
Alex
alex@example.com | linkedin.com/in/alex

Experience
- Built dashboard modules for customer success workflows.
- Coordinated UI backlog slicing with design and product teams.
- Maintained release checklists and deployment readiness notes.
- Worked with QA to validate complex checkout scenarios.
- Defined coding standards for shared UI libraries.
- Supported sprint planning and delivery reviews.
- Reviewed pull requests and release notes for risk surfacing.
- Reduced incident triage time by 15% with clearer ownership paths.
- Cut onboarding cycle time by 10% via checklist standardization.
    `.trim();

    const report = runReport(text).report;
    const issue = issueById(report, 'no_outcome_language');

    expect(issue).toBeDefined();
    expect(issue.severity).toBe('info');
    expect(issue.scoreDelta).toBe(-1);
  });
});
