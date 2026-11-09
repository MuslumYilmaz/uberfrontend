import { linkModules } from './user-code-sandbox-modules';

describe('linkModules', () => {
  // Each module gets a readable fake URL, so a test can read what every file was rewritten to.
  const linker = () => {
    const modules: string[] = [];
    const toUrl = (code: string) => {
      modules.push(code);
      return `blob:module-${modules.length}`;
    };
    return { modules, toUrl };
  };

  it('links each file once, from the leaves up, and points the tests at the files they name', () => {
    const { modules, toUrl } = linker();
    const tests = linkModules(
      [
        { path: 'src/money.js', code: "export const cents = (amount) => Math.round(amount * 100);\n" },
        { path: 'src/invoice.js', code: "import { cents } from './money.js';\nexport * from './lib/format';\n" },
        { path: 'src/lib/format/index.js', code: "import { cents } from '../../money';\nexport const show = (n) => `$${cents(n)}`;\n" },
        { path: 'src/unused.js', code: 'throw new Error("never linked");\n' },
      ],
      "import { cents } from './src/money.js';\nimport { show } from \"./src/invoice.js\";\nconst later = () => import('./src/money');\n",
      toUrl,
    );

    expect(modules.length).toBe(3);
    expect(modules[0]).toContain('Math.round');
    expect(modules[1]).toContain("import { cents } from 'blob:module-1';");
    expect(modules[2]).toContain("import { cents } from 'blob:module-1';\nexport * from 'blob:module-2';");
    expect(tests).toBe(
      "import { cents } from 'blob:module-1';\nimport { show } from \"blob:module-3\";\nconst later = () => import('blob:module-1');\n",
    );
  });

  it('leaves package imports alone and names the file behind a missing or circular import', () => {
    const { toUrl } = linker();
    expect(linkModules([], "import { describe } from 'vitest';\n", toUrl)).toBe("import { describe } from 'vitest';\n");
    expect(() => linkModules([{ path: 'src/a.js', code: "import './b.js';" }], "import './src/a.js';", toUrl))
      .toThrowError("Cannot find './b.js' imported from src/a.js.");
    expect(() => linkModules([{ path: 'src/a.js', code: '' }], "import '../src/a.js';", toUrl))
      .toThrowError("Cannot find '../src/a.js' imported from the tests.");
    expect(() => linkModules(
      [{ path: 'src/a.js', code: "import './b.js';" }, { path: 'src/b.js', code: "import './a.js';" }],
      "import './src/a.js';",
      toUrl,
    )).toThrowError(/^Circular import: src\/a\.js → src\/b\.js → src\/a\.js\./);
  });
});
