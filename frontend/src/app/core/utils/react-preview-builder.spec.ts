import { rewriteReactModuleToUMD } from './react-preview-builder';

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
