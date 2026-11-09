import { diffLines, diffStats, foldUnchanged } from './line-diff.util';

describe('line diff', () => {
  it('keeps shared lines and lists a replaced line as removed, then added', () => {
    const rows = diffLines('a\nb\nc\n', 'a\nB\nc\nd\n');
    expect(rows.map((row) => `${row.kind}:${row.text}`)).toEqual(['same:a', 'removed:b', 'added:B', 'same:c', 'added:d']);
    expect(rows[0]).toEqual({ kind: 'same', text: 'a', oldLine: 1, newLine: 1 });
    expect(rows[2]).toEqual({ kind: 'added', text: 'B', newLine: 2 });
    expect(diffStats(rows)).toEqual({ added: 2, removed: 1 });
  });

  it('treats a new file as all added and normalises line endings', () => {
    expect(diffLines('', 'one\r\ntwo').map((row) => row.kind)).toEqual(['added', 'added']);
    expect(diffLines('same\r\n', 'same\n')).toEqual([{ kind: 'same', text: 'same', oldLine: 1, newLine: 1 }]);
  });

  it('folds long unchanged runs, keeping context around each change', () => {
    const before = Array.from({ length: 20 }, (_, index) => `line ${index + 1}`).join('\n');
    const after = before.replace('line 10', 'line ten');
    const folded = foldUnchanged(diffLines(before, after), 2);
    expect(folded[0]).toEqual({ kind: 'gap', lines: 7 });
    expect(folded.filter((row) => row.kind === 'same').map((row) => 'text' in row ? row.text : '')).toEqual(['line 8', 'line 9', 'line 11', 'line 12']);
    expect(folded[folded.length - 1]).toEqual({ kind: 'gap', lines: 8 });
  });
});
