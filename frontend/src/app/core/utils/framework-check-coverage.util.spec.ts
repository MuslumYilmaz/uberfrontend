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

  it('names role, label and text locators as the task page shows them, once each, next to the selectors', () => {
    const locators: FrameworkTest = {
      id: 'locators',
      name: 'locators',
      steps: [
        { type: 'setValue', by: { role: 'textbox' }, value: 'Milk' },
        { type: 'click', by: { role: 'button', name: 'Add' } },
        { type: 'expectText', selector: '.value', text: '1' },
        { type: 'setValue', by: { role: 'combobox', label: 'City' }, value: 'san' },
        { type: 'setValue', by: { label: 'Board size' }, value: '8' },
        { type: 'expectExists', by: { text: 'No tasks yet.' } },
        { type: 'click', by: { role: 'button', name: 'Add' }, index: 1 },
      ],
    };

    expect(checkSelectors([locators])).toEqual([
      'textbox',
      'button "Add"',
      '.value',
      'combobox labelled "City"',
      'control labelled "Board size"',
      'text "No tasks yet."',
    ]);
  });
});
