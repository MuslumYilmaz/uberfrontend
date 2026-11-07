import { joinFileBundle, parseFileBundle, replaceBundleFile } from './file-bundle.util';

describe('file bundle', () => {
  const files = [
    { path: 'src/money.js', code: "export const cents = (amount) => Math.round(amount * 100);\n" },
    { path: 'src/cart.js', code: "import { cents } from './money.js';\n\nexport const total = (items) => items.length;\n" },
  ];

  it('reads the files back exactly as they were joined', () => {
    const bundle = joinFileBundle(files);
    expect(bundle.startsWith('// @file src/money.js\n')).toBeTrue();
    expect(parseFileBundle(bundle)).toEqual(files);
  });

  it('keeps every trailing newline, so an edit at the end of a file round-trips', () => {
    for (const code of ['', 'a', 'a\n', 'a\n\n\n']) {
      const bundle = replaceBundleFile(joinFileBundle(files), 'src/money.js', code);
      expect(parseFileBundle(bundle)?.[0].code).toBe(code);
      expect(parseFileBundle(bundle)?.[1]).toEqual(files[1]);
    }
  });

  it('treats any other code as a single file', () => {
    expect(parseFileBundle('export default function sum(a, b) { return a + b; }\n')).toBeNull();
    expect(parseFileBundle('\n// @file src/a.js\nx')).toBeNull();
    expect(parseFileBundle('// @file src/a.js\nx\n// @file src/a.js\ny')).toBeNull();
    expect(replaceBundleFile('const a = 1;\n', 'src/a.js', 'b')).toBe('const a = 1;\n');
  });
});
