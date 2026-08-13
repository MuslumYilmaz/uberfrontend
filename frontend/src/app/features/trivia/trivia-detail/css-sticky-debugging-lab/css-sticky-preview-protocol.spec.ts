import { CssStickyInspection } from './css-sticky-debugging-lab.model';
import {
  CSS_STICKY_MAX_ANCESTORS,
  CSS_STICKY_MAX_STRING_LENGTH,
  normalizeCssStickyHttpOrigin,
  normalizeCssStickyInspection,
} from './css-sticky-preview-protocol';

describe('CSS sticky preview protocol', () => {
  it('accepts only canonical HTTP(S) tuple origins', () => {
    expect(normalizeCssStickyHttpOrigin('https://frontendatlas.com'))
      .toBe('https://frontendatlas.com');
    expect(normalizeCssStickyHttpOrigin('http://localhost:4200'))
      .toBe('http://localhost:4200');

    for (const origin of [
      null,
      '*',
      'null',
      'file:///tmp/index.html',
      'https://frontendatlas.com/',
      'https://frontendatlas.com/path',
      'https://frontendatlas.com#fragment',
      'https://user:secret@frontendatlas.com',
      'https://frontendatlas.com:443',
    ]) {
      expect(normalizeCssStickyHttpOrigin(origin)).withContext(String(origin)).toBeNull();
    }
  });

  it('bounds strings, numbers, evidence, and ancestor snapshots from the child', () => {
    const raw = validInspection() as unknown as Record<string, unknown>;
    raw['summary'] = 'x'.repeat(500);
    raw['evidence'] = Array.from({ length: 20 }, () => 'e'.repeat(500));
    raw['ancestors'] = Array.from({ length: 20 }, (_, index) => ({
      index,
      selector: 's'.repeat(500),
      tagName: 'div',
      overflowX: 'visible',
      overflowY: 'auto',
      display: 'block',
      alignItems: 'normal',
      alignSelf: 'auto',
      clientHeight: Number.MAX_VALUE,
      scrollHeight: Number.MAX_VALUE,
      isScrollContainer: true,
    }));

    const normalized = normalizeCssStickyInspection(raw);

    expect(normalized).not.toBeNull();
    expect(normalized?.summary.length).toBe(CSS_STICKY_MAX_STRING_LENGTH);
    expect(normalized?.evidence.length).toBe(6);
    expect(normalized?.evidence[0].length).toBe(CSS_STICKY_MAX_STRING_LENGTH);
    expect(normalized?.ancestors.length).toBe(CSS_STICKY_MAX_ANCESTORS);
    expect(normalized?.ancestors[0].selector.length).toBe(CSS_STICKY_MAX_STRING_LENGTH);
    expect(normalized?.ancestors[0].scrollHeight).toBe(10_000_000);
  });

  it('rejects unknown findings, invalid ancestor indexes, and malformed envelopes', () => {
    expect(normalizeCssStickyInspection({ ...validInspection(), finding: 'raw-child-error' })).toBeNull();
    expect(normalizeCssStickyInspection({
      ...validInspection(),
      ancestors: [{ ...validInspection().ancestors[0], index: -1 }],
    })).toBeNull();
    expect(normalizeCssStickyInspection({ finding: 'working' })).toBeNull();
  });
});

export function validInspection(): CssStickyInspection {
  return {
    finding: 'missing_inset',
    working: false,
    summary: 'The sticky axis has no inset.',
    evidence: ['inset-block-start: auto'],
    computed: {
      position: 'sticky',
      insetBlockStart: 'auto',
      insetBlockEnd: 'auto',
      zIndex: 'auto',
    },
    ancestors: [{
      index: 0,
      selector: '[data-scroll-root]',
      tagName: 'main',
      overflowX: 'auto',
      overflowY: 'auto',
      display: 'block',
      alignItems: 'normal',
      alignSelf: 'auto',
      clientHeight: 260,
      scrollHeight: 600,
      isScrollContainer: true,
    }],
    geometry: {
      targetTopBefore: 12,
      targetTopAfter: -84,
      targetHeight: 48,
      containingBlockHeight: 500,
      scrollOwnerTop: 12,
      scrollTopBefore: 96,
      scrollTopAfter: 224,
      maxScroll: 340,
      availableTravel: 452,
    },
    suspectAncestorIndex: null,
  };
}
