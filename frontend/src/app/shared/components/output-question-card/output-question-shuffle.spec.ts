import { shuffleOutputOptions } from './output-question-shuffle';

describe('shuffleOutputOptions', () => {
  it('performs a deterministic Fisher-Yates shuffle without mutating the source', () => {
    const source = ['a', 'b', 'c'];
    const samples = [0, 0];

    const result = shuffleOutputOptions(source, () => samples.shift() ?? 0);

    expect(result).toEqual(['b', 'c', 'a']);
    expect(source).toEqual(['a', 'b', 'c']);
  });

  it('clamps invalid custom random values to a valid index', () => {
    expect(shuffleOutputOptions(['a', 'b'], () => 1)).toEqual(['a', 'b']);
    expect(shuffleOutputOptions(['a', 'b'], () => Number.NaN)).toEqual(['b', 'a']);
  });
});
