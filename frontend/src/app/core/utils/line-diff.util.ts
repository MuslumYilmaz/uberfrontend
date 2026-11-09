/** One line of a two-file comparison: kept, added by the change, or removed by it. */
export type DiffRow =
  | { readonly kind: 'same'; readonly text: string; readonly oldLine: number; readonly newLine: number }
  | { readonly kind: 'added'; readonly text: string; readonly newLine: number }
  | { readonly kind: 'removed'; readonly text: string; readonly oldLine: number };

/** A run of unchanged lines folded away, so a long file shows its changes with a little context. */
export type DiffGap = { readonly kind: 'gap'; readonly lines: number };

const MAX_LINES = 2000;

/** The lines a diff shows for a file. */
export function linesOf(text: string): string[] {
  if (!text) return [];
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  // A file that ends with a newline has no empty last line to show.
  if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
  return lines;
}

/**
 * Line diff by longest common subsequence. Removed lines come before the added lines that replace them, as in a
 * unified diff. Files are small practice files, so the quadratic table is fine; a very long file falls back to
 * showing everything removed and everything added.
 */
export function diffLines(before: string, after: string): DiffRow[] {
  const a = linesOf(before);
  const b = linesOf(after);
  if (a.length > MAX_LINES || b.length > MAX_LINES) {
    return [
      ...a.map((text, index) => ({ kind: 'removed' as const, text, oldLine: index + 1 })),
      ...b.map((text, index) => ({ kind: 'added' as const, text, newLine: index + 1 })),
    ];
  }
  const width = b.length + 1;
  const lcs = new Uint16Array((a.length + 1) * width);
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      lcs[i * width + j] = a[i] === b[j]
        ? lcs[(i + 1) * width + j + 1] + 1
        : Math.max(lcs[(i + 1) * width + j], lcs[i * width + j + 1]);
    }
  }
  const rows: DiffRow[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      rows.push({ kind: 'same', text: a[i], oldLine: i + 1, newLine: j + 1 });
      i += 1;
      j += 1;
    } else if (lcs[(i + 1) * width + j] >= lcs[i * width + j + 1]) {
      rows.push({ kind: 'removed', text: a[i], oldLine: i + 1 });
      i += 1;
    } else {
      rows.push({ kind: 'added', text: b[j], newLine: j + 1 });
      j += 1;
    }
  }
  for (; i < a.length; i += 1) rows.push({ kind: 'removed', text: a[i], oldLine: i + 1 });
  for (; j < b.length; j += 1) rows.push({ kind: 'added', text: b[j], newLine: j + 1 });
  return rows;
}

/** Folds every run of unchanged lines longer than twice the context, keeping `context` lines on each side. */
export function foldUnchanged(rows: readonly DiffRow[], context = 3): (DiffRow | DiffGap)[] {
  const out: (DiffRow | DiffGap)[] = [];
  let at = 0;
  while (at < rows.length) {
    if (rows[at].kind !== 'same') {
      out.push(rows[at]);
      at += 1;
      continue;
    }
    let end = at;
    while (end < rows.length && rows[end].kind === 'same') end += 1;
    const run = rows.slice(at, end);
    const keepStart = at === 0 ? 0 : context;
    const keepEnd = end === rows.length ? 0 : context;
    if (run.length > keepStart + keepEnd + 1) {
      out.push(...run.slice(0, keepStart), { kind: 'gap', lines: run.length - keepStart - keepEnd }, ...run.slice(run.length - keepEnd));
    } else {
      out.push(...run);
    }
    at = end;
  }
  return out;
}

/** Lines the change adds and removes, for a file's "+3 −1" summary. */
export function diffStats(rows: readonly DiffRow[]): { readonly added: number; readonly removed: number } {
  return {
    added: rows.filter((row) => row.kind === 'added').length,
    removed: rows.filter((row) => row.kind === 'removed').length,
  };
}
