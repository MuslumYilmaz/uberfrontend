import { makeReactPreviewHtml, relativeModuleOrder, rewriteReactModuleToUMD } from './react-preview-builder';

describe('relativeModuleOrder', () => {
  it('lists each imported file before the files that import it, App last, through nested paths, a cycle and gaps', () => {
    const files = {
      'src/App.tsx': "import { a } from './lib/a';\nimport b from './b';\nimport './App.css';\nimport { gone } from './missing';",
      'src/lib/a.ts': "import { shared } from '../shared';\nexport const a = shared;",
      'src/b.tsx': "import { shared } from './shared';\nimport { a } from './lib/a';\nexport default a + shared;",
      'src/shared.ts': "import { a } from './lib/a';\nexport const shared = 1;",
      'src/App.css': '.x {}',
      'src/unused.ts': 'export const unused = 1;',
    };

    expect(relativeModuleOrder(files, 'src/App.tsx')).toEqual(['src/shared.ts', 'src/lib/a.ts', 'src/b.tsx', 'src/App.tsx']);
  });
});

describe('makeReactPreviewHtml compile errors', () => {
  async function overlayOf(files: Record<string, string>): Promise<{ meta: string; message: string }> {
    const frame = document.createElement('iframe');
    frame.srcdoc = makeReactPreviewHtml(files, window.location.origin);
    document.body.appendChild(frame);
    try {
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        const meta = frame.contentDocument?.getElementById('_fa_overlay_meta')?.textContent || '';
        if (meta) return { meta, message: frame.contentDocument?.getElementById('_fa_overlay_msg')?.textContent || '' };
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      throw new Error('the preview showed no compile error');
    } finally {
      frame.remove();
    }
  }

  const app = [
    "import { next } from './counter';",
    'export default function App() {',
    '  return <p>{next(1)}</p>;',
    '}',
  ];

  it('names the imported file and its own line when the error is there', async () => {
    const { meta, message } = await overlayOf({
      'src/App.tsx': app.join('\n'),
      'src/counter.ts': ['export function next(value: number) {', '  return value +;', '}'].join('\n'),
    });

    expect(meta).toMatch(/^counter\.ts:2:\d+$/);
    expect(message).toContain('>    2 |   return value +;');
    expect(message).not.toContain('export default function App');
  });

  it("names App's own line after the files it imports", async () => {
    const broken = [...app];
    broken[2] = '  return <p>{next(1)</p>;';
    const { meta, message } = await overlayOf({
      'src/App.tsx': broken.join('\n'),
      'src/counter.ts': ['export function next(value: number) {', '  return value + 1;', '}'].join('\n'),
    });

    expect(meta).toMatch(/^App\.tsx:3:\d+$/);
    expect(message).toContain('>    3 |   return <p>{next(1)</p>;');
  });
});

describe('rewriteReactModuleToUMD', () => {
  it('keeps every line where the editor shows it, so a compile error points at the right line', () => {
    const src = [
      "import React, { useState } from 'react';",
      "import './App.css';",
      "import { format } from './format';",
      '',
      'export type Todo = { id: number; text: string };',
      '',
      'export const LIMIT = 3;',
      'export default function App() {',
      '  const [todos, setTodos] = useState<Todo[]>([]);',
      '  return <p>{todos.length}</p>;',
      '}',
    ].join('\n');

    const out = rewriteReactModuleToUMD(src).split('\n');

    expect(out.length).toBe(src.split('\n').length);
    expect(out[4]).toBe('type Todo = { id: number; text: string };');
    expect(out[6]).toBe('const LIMIT = 3;');
    expect(out[7]).toBe('function App() {');
    expect(out[8]).toContain('useState<Todo[]>([])');
  });

  it('keeps the lines of a React import that spans several lines', () => {
    const src = [
      'import React, {',
      '  useState,',
      '  useId as makeId,',
      "} from 'react';",
      'export default function App() {',
      '  return <p>{makeId()}</p>;',
      '}',
    ].join('\n');

    const out = rewriteReactModuleToUMD(src).split('\n');

    expect(out.length).toBe(7);
    expect(out[0]).toBe('const { useId: makeId } = React;');
    expect(out[4]).toBe('function App() {');
  });
});
