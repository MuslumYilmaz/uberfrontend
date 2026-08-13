import {
  CssStickyClassificationSnapshot,
  classifyCssStickySnapshot,
} from './css-sticky-inspection-classifier';

describe('classifyCssStickySnapshot', () => {
  const working: CssStickyClassificationSnapshot = {
    position: 'sticky',
    insetBlockStart: '0px',
    insetBlockEnd: 'auto',
    ownerMismatch: false,
    maxScroll: 360,
    stretched: false,
    availableTravel: 420,
    runwayNeeded: 96,
    covered: false,
    scrollDelta: 128,
    targetTopDelta: 0,
  };

  const cases: ReadonlyArray<{
    finding: ReturnType<typeof classifyCssStickySnapshot>;
    snapshot: Partial<CssStickyClassificationSnapshot>;
  }> = [
    { finding: 'position_not_sticky', snapshot: { position: 'relative' } },
    { finding: 'missing_inset', snapshot: { insetBlockStart: 'auto', insetBlockEnd: 'auto' } },
    { finding: 'unexpected_scroll_container', snapshot: { ownerMismatch: true } },
    { finding: 'no_scroll_range', snapshot: { maxScroll: 1 } },
    { finding: 'stretched_item', snapshot: { stretched: true } },
    { finding: 'no_containing_block_runway', snapshot: { availableTravel: 40 } },
    { finding: 'covered_by_sibling', snapshot: { covered: true } },
    { finding: 'working', snapshot: {} },
    { finding: 'inconclusive', snapshot: { targetTopDelta: 12 } },
  ];

  for (const testCase of cases) {
    it(`classifies ${testCase.finding}`, () => {
      expect(classifyCssStickySnapshot({ ...working, ...testCase.snapshot }))
        .toBe(testCase.finding);
    });
  }

  it('uses evidence order so a z-index symptom cannot hide a missing inset', () => {
    expect(classifyCssStickySnapshot({
      ...working,
      insetBlockStart: 'auto',
      insetBlockEnd: 'auto',
      covered: true,
    })).toBe('missing_inset');
  });

  it('accepts a non-auto block-end inset when block-start is auto', () => {
    expect(classifyCssStickySnapshot({
      ...working,
      insetBlockStart: 'auto',
      insetBlockEnd: '0px',
    })).toBe('working');
  });
});
