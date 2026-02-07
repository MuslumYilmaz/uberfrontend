import { CvIssue } from '../../../core/models/cv-linter.model';
import {
  buildHeuristicEvidence,
  buildRegexEvidence,
  buildRoleKeywordSuggestions,
  computeIssueConfidence,
  shouldShowDocxBanner,
} from './cv-linter-issues.util';

function makeIssue(overrides: Partial<CvIssue> = {}): CvIssue {
  return {
    id: 'keyword_missing',
    severity: 'warn',
    category: 'keywords',
    scoreDelta: -6,
    title: 'Keyword coverage is low',
    message: 'Keyword coverage is low.',
    explanation: 'Keyword coverage is low.',
    why: 'Keywords help ATS matching.',
    fix: 'Use missing terms naturally in experience bullets.',
    ...overrides,
  };
}

describe('cv-linter issues utils', () => {
  it('builds regex evidence with excerpt and details', () => {
    const evidence = buildRegexEvidence(
      'Built a MERN checkout module and later migrated to Angular frontend architecture.',
      /\bmern\b/i,
      22,
      'pdf',
      0.78
    );

    expect(evidence).toBeTruthy();
    expect(evidence?.line).toBe(22);
    expect(evidence?.excerpt).toContain('MERN');
    expect(evidence?.details).toContain('Angular frontend');
    expect(evidence?.confidence).toBeCloseTo(0.78, 2);
  });

  it('builds heuristic evidence from the strongest candidate', () => {
    const evidence = buildHeuristicEvidence([
      { text: 'Worked on dashboard bugs', score: 0.42, line: 31, source: 'raw_text' },
      { text: 'Improved performance by 38% for checkout route', score: 0.91, line: 28, source: 'pdf' },
      { text: 'Updated CI config', score: 0.63, line: 35, source: 'docx' },
    ]);

    expect(evidence?.excerpt).toContain('Improved performance');
    expect(evidence?.line).toBe(28);
    expect(evidence?.source).toBe('pdf');
    expect(evidence?.confidence).toBeCloseTo(0.91, 2);
  });

  it('shows DOCX banner when either extraction issue exists', () => {
    expect(shouldShowDocxBanner([makeIssue({ id: 'merged_bullets_suspected' })], 'high')).toBeTrue();
    expect(shouldShowDocxBanner([makeIssue({ id: 'low_extraction_quality', severity: 'info' })], 'high')).toBeTrue();
    expect(shouldShowDocxBanner([makeIssue({ id: 'missing_linkedin' })], 'low')).toBeTrue();
    expect(shouldShowDocxBanner([makeIssue({ id: 'missing_linkedin' })], 'high')).toBeFalse();
  });

  it('generates role-aware keyword suggestions for Senior Frontend (Angular)', () => {
    const suggestions = buildRoleKeywordSuggestions(
      'senior_frontend_angular',
      'keyword_missing_critical',
      { critical: ['accessibility', 'performance'], strong: ['ci/cd'] }
    );

    expect(suggestions.length).toBeGreaterThan(0);
    const labels = suggestions.map((item) => item.label);
    expect(labels[0]).toContain('accessibility');
    expect(labels).toContain('performance');
    expect(labels).toContain('CI/CD');
  });

  it('computes low-confidence for extraction-sensitive issues under low extraction quality', () => {
    const sensitive = makeIssue({ id: 'keyword_missing', severity: 'warn' });
    const nonSensitive = makeIssue({ id: 'stack_contradiction', category: 'consistency', severity: 'warn' });

    const sensitiveConfidence = computeIssueConfidence(sensitive, true);
    const nonSensitiveConfidence = computeIssueConfidence(nonSensitive, true);

    expect(sensitiveConfidence).toBeLessThan(0.6);
    expect(nonSensitiveConfidence).toBeGreaterThan(0.6);
  });
});
