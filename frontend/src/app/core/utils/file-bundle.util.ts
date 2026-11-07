/** One file of a multi-file task. */
export type BundleFile = { readonly path: string; readonly code: string };

/**
 * A multi-file JavaScript task keeps its files in one code string, each after a `// @file <path>` line, so the
 * draft, its versions and the solution stay a single string wherever a task's code is stored. A file's code is
 * kept exactly, trailing newlines included: the editor shows one file, and every keystroke round-trips.
 */
const FILE_MARKER = /^\/\/ @file ([A-Za-z0-9_][A-Za-z0-9_./-]*\.js)$/;

/** The files in a bundle, in order, or null when the code is a single file. */
export function parseFileBundle(source: string): BundleFile[] | null {
  const lines = String(source ?? '').split('\n');
  if (!FILE_MARKER.test(lines[0])) return null;

  const files: { path: string; lines: string[] }[] = [];
  for (const line of lines) {
    const marker = FILE_MARKER.exec(line);
    if (marker) files.push({ path: marker[1], lines: [] });
    else files[files.length - 1].lines.push(line);
  }
  if (new Set(files.map((file) => file.path)).size !== files.length) return null;
  return files.map((file) => ({ path: file.path, code: file.lines.join('\n') }));
}

/** The code string for a set of files; parsing it gives the same files back. */
export function joinFileBundle(files: readonly BundleFile[]): string {
  return files.map((file) => `// @file ${file.path}\n${file.code}`).join('\n');
}

/** The bundle with one file's code replaced; any other code string comes back unchanged. */
export function replaceBundleFile(source: string, path: string, code: string): string {
  const files = parseFileBundle(source);
  if (!files?.some((file) => file.path === path)) return source;
  return joinFileBundle(files.map((file) => (file.path === path ? { path, code } : file)));
}
