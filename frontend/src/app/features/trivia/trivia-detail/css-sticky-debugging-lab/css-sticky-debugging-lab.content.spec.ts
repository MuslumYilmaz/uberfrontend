import {
  CSS_STICKY_CASE_IDS,
  CSS_STICKY_CASES,
  getCssStickyCase,
} from './css-sticky-debugging-lab.content';

describe('CSS sticky debugging lab content', () => {
  it('defines the five stable, unique case IDs in product order', () => {
    expect(CSS_STICKY_CASE_IDS).toEqual([
      'missing-inset',
      'unexpected-scroll-container',
      'no-travel-room',
      'flex-grid-stretch',
      'sticks-but-hidden',
    ]);
    expect(new Set(CSS_STICKY_CASES.map((stickyCase) => stickyCase.id)).size).toBe(5);
  });

  it('keeps trusted fixtures deterministic and CSS-only editing bounded to a target', () => {
    for (const stickyCase of CSS_STICKY_CASES) {
      expect(stickyCase.html).toContain('data-sticky-target');
      expect(stickyCase.targetSelector).toBe('[data-sticky-target]');
      expect(stickyCase.initialCss.length).toBeGreaterThan(80);
      expect(stickyCase.fixedCss).not.toBe(stickyCase.initialCss);
      expect(stickyCase.suggestedFix.length).toBeGreaterThan(20);
      expect(stickyCase.html).not.toMatch(/<script|on\w+=|javascript:/i);
    }
  });

  it('maps each case to its expected first broken diagnosis', () => {
    expect(getCssStickyCase('missing-inset').finding).toBe('missing_inset');
    expect(getCssStickyCase('unexpected-scroll-container').finding).toBe('unexpected_scroll_container');
    expect(getCssStickyCase('no-travel-room').finding).toBe('no_containing_block_runway');
    expect(getCssStickyCase('flex-grid-stretch').finding).toBe('stretched_item');
    expect(getCssStickyCase('sticks-but-hidden').finding).toBe('covered_by_sibling');
  });

  it('keeps z-index out of geometry-only fixes', () => {
    for (const stickyCase of CSS_STICKY_CASES.slice(0, 4)) {
      expect(stickyCase.fixedCss).not.toContain('z-index');
    }
    expect(getCssStickyCase('sticks-but-hidden').fixedCss).toContain('z-index');
  });
});
