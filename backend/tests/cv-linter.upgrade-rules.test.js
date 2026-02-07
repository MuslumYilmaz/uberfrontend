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

  test('stack contradiction rule triggers without clarifier and skips with clarifier', () => {
    const contradictory = `
Taylor
taylor@example.com | linkedin.com/in/taylor

Experience
- Built MERN ecommerce platform for checkout operations.
- Led Angular migration for storefront shell and added new Angular modules.
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
});
