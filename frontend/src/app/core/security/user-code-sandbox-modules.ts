import type { BundleFile } from '../utils/file-bundle.util';

/** The quoted specifier of a static import, a re-export, a side-effect import or a dynamic import, when relative. */
const RELATIVE_SPECIFIER = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"])(\.{1,2}\/[^'"\n]*)\2/g;

/**
 * Links a multi-file task without a bundler: each file the tests reach becomes its own module at a URL from
 * `toUrl`, and each relative import is rewritten to the URL of the file it names. Imports resolve from the
 * importing file's folder, the tests import from the root, and `./money` finds `money.js` or `money/index.js`.
 * Returns the tests with their imports rewritten. Throws, naming the importing file, for a missing file or a
 * circular import, which separate module URLs cannot express.
 */
export function linkModules(files: readonly BundleFile[], testCode: string, toUrl: (code: string) => string): string {
  const sources = new Map(files.map((file) => [file.path.replace(/^\.?\//, ''), file.code]));
  const urls = new Map<string, string>();
  const linking: string[] = [];

  const resolve = (from: string, specifier: string): string => {
    const parts = from.split('/').slice(0, -1);
    for (const part of specifier.split('/')) {
      // Above the root the path can only miss, so it keeps the step and fails below.
      if (part === '..' && parts.length && parts[parts.length - 1] !== '..') parts.pop();
      else if (part === '..') parts.push(part);
      else if (part && part !== '.') parts.push(part);
    }
    const target = parts.join('/');
    const found = [target, `${target}.js`, `${target}/index.js`].find((candidate) => sources.has(candidate));
    if (!found) throw new Error(`Cannot find '${specifier}' imported from ${from || 'the tests'}.`);
    return found;
  };

  const link = (path: string): string => {
    const known = urls.get(path);
    if (known) return known;
    if (linking.includes(path)) {
      const cycle = [...linking.slice(linking.indexOf(path)), path].join(' → ');
      throw new Error(`Circular import: ${cycle}. Move what both files need into a file of its own.`);
    }
    linking.push(path);
    const url = toUrl(rewrite(path, sources.get(path) ?? ''));
    linking.pop();
    urls.set(path, url);
    return url;
  };

  const rewrite = (from: string, code: string): string =>
    code.replace(RELATIVE_SPECIFIER, (_match, lead: string, quote: string, specifier: string) =>
      `${lead}${quote}${link(resolve(from, specifier))}${quote}`);

  return rewrite('', testCode);
}
