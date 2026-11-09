import { clampMetaDescription, fitSeoTitle, labelledSeoTitle } from './seo-text.util';

describe('seo text limits', () => {
  it('keeps the label only when the whole title fits a search result', () => {
    expect(labelledSeoTitle('Object vs Map', 'JavaScript Tradeoff Question')).toBe('Object vs Map - JavaScript Tradeoff Question');
    const long = 'Reactive forms vs template-driven forms for a growing Angular workflow';
    expect(labelledSeoTitle(long, 'Angular Tradeoff Question')).toBe(long);
  });

  it('drops optional title qualifiers only when the title would not fit', () => {
    expect(fitSeoTitle('Implement debounce() in JavaScript: Coding Challenge + Tests | FrontendAtlas'))
      .toBe('Implement debounce() in JavaScript: Coding Challenge + Tests');
    expect(fitSeoTitle('Implement shallowClone() in JavaScript: Object & Array Challenge + Tests'))
      .toBe('Implement shallowClone() in JavaScript: Object & Array Challenge');
    const fits = 'Short title + Tests | FrontendAtlas';
    expect(fitSeoTitle(fits)).toBe(fits);
  });

  it('leaves a description that fits alone', () => {
    const text = 'Short enough for a search result.';
    expect(clampMetaDescription(`  ${text} `)).toBe(text);
  });

  it('cuts a long description at the last sentence that fits', () => {
    const first = 'A'.repeat(100) + '.';
    const result = clampMetaDescription(`${first} ${'B'.repeat(100)} and more words.`);
    expect(result).toBe(first);
  });

  it('cuts at a word and marks the cut when no sentence ends early enough', () => {
    const result = clampMetaDescription('word, '.repeat(60));
    expect(result.length).toBeLessThanOrEqual(170);
    expect(result.endsWith('word…')).toBeTrue();
  });
});
