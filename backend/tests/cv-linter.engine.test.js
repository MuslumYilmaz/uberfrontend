'use strict';

const { CATEGORY_MAX_SCORES } = require('../services/tools/cv/constants');
const { buildCvContext } = require('../services/tools/cv/context');
const { scoreCvContext } = require('../services/tools/cv/engine');
const { createRules } = require('../services/tools/cv/rules');

const STRONG_CV = `
Jane Doe
jane.doe@example.com | +1 555-123-4567 | linkedin.com/in/janedoe

Summary
Senior frontend engineer focused on performance, accessibility, and maintainable architecture.

Experience
Senior Frontend Engineer | Acme Corp | Jan 2021 - Present
- Built Angular dashboard using RxJS observables and ngrx state management, reducing page load time by 42%.
- Optimized change detection with signals and lazy loading, improving web vitals for 1.2M monthly users.
- Implemented SSR rendering and accessibility audits, increasing conversion by 11%.
- Led testing strategy with unit tests and integration testing, cutting regression bugs by 38%.

Projects
- Designed a reusable component platform with performance budgets and CI/CD pipeline checks.

Skills
Angular, TypeScript, ngrx, RxJS, observables, change detection, signals, state management,
accessibility, SSR, testing, lazy loading, web vitals, performance

Education
BSc Computer Engineering, 2018
`.trim();

const WEAK_CV = `
frontend developer

about me
Responsible for frontend tasks.
Responsible for fixing bugs.
Responsible for ui updates.

- worked on website
- made pages
- did coding
`.trim();

function runReport(text, roleId = 'senior_frontend_angular') {
  const context = buildCvContext(text, { roleId });
  return scoreCvContext(context, createRules());
}

describe('cv-linter engine', () => {
  test('strong fixture scores higher than weak fixture', () => {
    const strong = runReport(STRONG_CV);
    const weak = runReport(WEAK_CV);

    expect(strong.scores.overall).toBeGreaterThan(weak.scores.overall);
    expect(strong.issues.some((issue) => issue.id === 'missing_email')).toBe(false);
    expect(weak.issues.some((issue) => issue.id === 'missing_email')).toBe(true);
    expect(weak.issues.some((issue) => issue.id === 'no_experience_section')).toBe(true);
  });

  test('category scores are clamped to configured max bounds', () => {
    const report = runReport(WEAK_CV);
    for (const row of report.breakdown) {
      const max = CATEGORY_MAX_SCORES[row.id];
      expect(row.score).toBeGreaterThanOrEqual(0);
      expect(row.score).toBeLessThanOrEqual(max);
    }
    expect(report.scores.overall).toBeGreaterThanOrEqual(0);
    expect(report.scores.overall).toBeLessThanOrEqual(100);
  });

  test('keyword synonym matching is deterministic', () => {
    const synonymHeavy = `
Alex Roe
alex@example.com
linkedin.com/in/alexroe

Experience
- Built frontend pipeline checks and test automation for a shared platform.
- Improved state mgmt architecture for micro-frontend teams.

Skills
CI/CD, unit tests, state management, performance, accessibility
`.trim();

    const report = runReport(synonymHeavy, 'senior_frontend_general');
    const found = new Set(report.keywordCoverage.found);

    expect(found.has('ci/cd')).toBe(true);
    expect(found.has('testing')).toBe(true);
    expect(found.has('state management')).toBe(true);
  });
});
