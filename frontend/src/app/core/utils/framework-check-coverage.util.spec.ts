import type { FrameworkTest } from '../models/question.model';
import { checkSelectors, frameworkCheckCoverage } from './framework-check-coverage.util';

const check = (selectors: string[]): FrameworkTest => ({
  id: selectors.join('|'),
  name: selectors.join(' '),
  steps: selectors.map((selector) => ({ type: 'click', selector })),
});

describe('frameworkCheckCoverage', () => {
  it('reads one check or fewer as a smoke check, more as full coverage, and none as a hand-marked task', () => {
    expect(frameworkCheckCoverage({ frameworkTests: [] })).toBe('none');
    expect(frameworkCheckCoverage(null)).toBe('none');
    expect(frameworkCheckCoverage({ frameworkTests: [check(['.item'])] })).toBe('smoke');
    expect(frameworkCheckCoverage({ frameworkTests: [check(['.item']), check(['.input'])] })).toBe('full');
  });

  it('lets a task state its coverage, but never claims coverage for a task without checks', () => {
    expect(frameworkCheckCoverage({ frameworkTests: [check(['.item'])], checkCoverage: 'full' })).toBe('full');
    expect(frameworkCheckCoverage({ frameworkTests: [check(['.a']), check(['.b'])], checkCoverage: 'smoke' })).toBe('smoke');
    expect(frameworkCheckCoverage({ frameworkTests: [], checkCoverage: 'full' })).toBe('none');
  });
});

describe('checkSelectors', () => {
  it('lists each selector once, in the order the checks first use it', () => {
    expect(checkSelectors([check(['.input', '.primary']), check(['.item', '.input']), { id: 'wait', name: 'wait', steps: [{ type: 'wait' }] }]))
      .toEqual(['.input', '.primary', '.item']);
    expect(checkSelectors(undefined)).toEqual([]);
  });
});
