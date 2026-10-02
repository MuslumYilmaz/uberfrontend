import { premiumPracticeLabel, resolvePremiumPracticeCount } from './premium-practice-count.util';

describe('premium practice count compatibility', () => {
  it('prefers valid catalog counts and falls back for old or malformed payloads', () => {
    expect(resolvePremiumPracticeCount(171, 165)).toBe(171);
    for (const value of [undefined, null, NaN, Infinity, -1, 0, 1.5, '171']) {
      expect(resolvePremiumPracticeCount(value, 165)).toBe(165);
    }
  });

  it('omits numeric claims when neither source has a usable count', () => {
    expect(premiumPracticeLabel(resolvePremiumPracticeCount(undefined, undefined))).toBe('Premium practice library');
    expect(premiumPracticeLabel(resolvePremiumPracticeCount(0, 0))).toBe('Premium practice library');
    expect(premiumPracticeLabel(resolvePremiumPracticeCount(171, 165))).toBe('171 Premium practice prompts');
  });
});
