import { interviewDisplayLabel } from './interview-display-label';

describe('interviewDisplayLabel', () => {
  it('turns topic identifiers into readable words while preserving acronyms', () => {
    expect(interviewDisplayLabel('accessible-images')).toBe('Accessible images');
    expect(interviewDisplayLabel('html_aria-api')).toBe('HTML ARIA API');
    expect(interviewDisplayLabel('css-dom-layout')).toBe('CSS DOM layout');
  });
  it('preserves human-authored casing and safely handles empty labels', () => {
    expect(interviewDisplayLabel('React Effect lifecycle')).toBe('React Effect lifecycle');
    expect(interviewDisplayLabel('')).toBe('');
  });
});
