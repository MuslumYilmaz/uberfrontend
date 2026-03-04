import { buildFailureHint } from './failure-explain-rules';

describe('failure-explain-rules', () => {
  it('maps undefined assertion mismatch to missing return hint', () => {
    const hint = buildFailureHint({
      errorLine: 'Expected undefined to be Hello World',
      firstFailName: 'capitalizes words',
    });
    expect(hint.ruleId).toBe('missing-return');
    expect(hint.actions.length).toBeGreaterThanOrEqual(2);
  });

  it('falls back to generic debugging hint', () => {
    const hint = buildFailureHint({
      errorLine: 'Completely unknown failure phrase',
      firstFailName: 'mystery test',
      category: 'unknown',
    });
    expect(hint.ruleId).toBe('generic-debug');
  });
});
