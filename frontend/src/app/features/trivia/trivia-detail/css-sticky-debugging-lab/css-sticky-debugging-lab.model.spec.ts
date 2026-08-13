import {
  clampCssSource,
  createCssStickyLabState,
  isBrokenStickyFinding,
} from './css-sticky-debugging-lab.model';

describe('CSS sticky debugging lab model', () => {
  it('creates an isolated first-attempt state', () => {
    const state = createCssStickyLabState('missing-inset', '.target { position: sticky; }');

    expect(state).toEqual(jasmine.objectContaining({
      selectedCaseId: 'missing-inset',
      pane: 'code',
      status: 'idle',
      editorActive: false,
      stale: false,
      inspection: null,
      attempt: 1,
      sawBrokenFinding: false,
      completed: false,
    }));
  });

  it('distinguishes a proved broken state from working and inconclusive states', () => {
    expect(isBrokenStickyFinding('missing_inset')).toBeTrue();
    expect(isBrokenStickyFinding('covered_by_sibling')).toBeTrue();
    expect(isBrokenStickyFinding('working')).toBeFalse();
    expect(isBrokenStickyFinding('inconclusive')).toBeFalse();
  });

  it('caps user CSS without interpreting or rewriting its contents', () => {
    const breakout = 'a'.repeat(20_000) + '</style><script>unsafe()</script>';
    const clamped = clampCssSource(breakout);

    expect(clamped.length).toBe(20_000);
    expect(clamped).toBe('a'.repeat(20_000));
    expect(clampCssSource('x { color: red; }')).toBe('x { color: red; }');
  });
});
