#!/usr/bin/env node

// The code editor type-checks sandbox files against small hand-written stubs. rxjs had none, so every import from it
// was `any`: generic calls such as `new Subject<string>()` and types such as `Observable<User[]>` showed as errors in
// correct code. This generates loose declarations from the installed rxjs and @angular/core/rxjs-interop typings:
// every export resolves, generic calls and types are accepted, and only the classes sandbox code calls methods on or
// extends get real shapes. Rerun after upgrading rxjs or Angular.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const CHECK = process.argv.includes('--check');
const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(frontendRoot, 'src/app/generated/editor-rxjs-typings.ts');
const require = createRequire(path.join(frontendRoot, 'package.json'));
const rxjsRoot = path.dirname(require.resolve('rxjs/package.json'));
const angularCoreRoot = path.dirname(require.resolve('@angular/core/package.json'));

const PRECISE = {
  Observable: [
    'export class Observable<T = any> {',
    '  constructor(subscribe?: (subscriber: Subscriber<T>) => any);',
    '  subscribe(observerOrNext?: any, error?: (error: any) => void, complete?: () => void): Subscription;',
    '  pipe(...operations: any[]): Observable<any>;',
    '  forEach(next: (value: T) => void): Promise<void>;',
    '}',
  ],
  Subject: [
    'export class Subject<T = any> extends Observable<T> {',
    '  next(value: T): void;',
    '  error(err: any): void;',
    '  complete(): void;',
    '  asObservable(): Observable<T>;',
    '  readonly observed: boolean;',
    '}',
  ],
  BehaviorSubject: ['export class BehaviorSubject<T = any> extends Subject<T> { constructor(value: T); readonly value: T; getValue(): T; }'],
  ReplaySubject: ['export class ReplaySubject<T = any> extends Subject<T> { constructor(bufferSize?: number, windowTime?: number, timestampProvider?: any); }'],
  AsyncSubject: ['export class AsyncSubject<T = any> extends Subject<T> {}'],
  Subscription: ['export class Subscription { constructor(initialTeardown?: () => void); readonly closed: boolean; unsubscribe(): void; add(teardown: any): void; remove(teardown: any): void; }'],
  Subscriber: ['export class Subscriber<T = any> extends Subscription { next(value?: T): void; error(err?: any): void; complete(): void; }'],
};

function exportsOf(typingsFile) {
  const program = ts.createProgram([typingsFile], { noEmit: true, skipLibCheck: true, types: [] });
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(typingsFile);
  if (!source) throw new Error(`Missing typings: ${typingsFile}`);
  return checker.getExportsOfModule(checker.getSymbolAtLocation(source))
    .map((exported) => {
      const target = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
      const flags = target.flags;
      const kind = flags & ts.SymbolFlags.Class ? 'class'
        : flags & ts.SymbolFlags.Function ? 'function'
          : flags & (ts.SymbolFlags.Variable | ts.SymbolFlags.Enum) ? 'const'
            : flags & (ts.SymbolFlags.Interface | ts.SymbolFlags.TypeAlias) ? 'type'
              : null;
      if (!kind) throw new Error(`${typingsFile}: unclassified export ${exported.getName()}`);
      return { name: exported.getName(), kind };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

function moduleLines(moduleName, items, { precise = false, reexport = null } = {}) {
  const lines = [`declare module '${moduleName}' {`];
  if (reexport) lines.push(`  export * from '${reexport}';`);
  if (precise) {
    for (const [name, shape] of Object.entries(PRECISE)) {
      if (items.some((item) => item.name === name)) lines.push(...shape.map((line) => `  ${line}`));
    }
  }
  const declarations = items
    .filter((item) => !(precise && PRECISE[item.name]))
    .map(({ name, kind }) => ({
      class: `export class ${name}<T=any,R=any>{constructor(...a:any[]);[k:string]:any}`,
      function: `export function ${name}<T=any,R=any,S=any>(...a:any[]):any;`,
      const: `export const ${name}:any;`,
      type: `export type ${name}<T=any,R=any,S=any>=any;`,
    })[kind]);
  // A few declarations per line keep the generated file short.
  let line = '';
  for (const declaration of declarations) {
    if (line && line.length + declaration.length > 110) {
      lines.push(`  ${line}`);
      line = '';
    }
    line = line ? `${line} ${declaration}` : declaration;
  }
  if (line) lines.push(`  ${line}`);
  lines.push('}');
  return lines;
}

const rxjs = exportsOf(path.join(rxjsRoot, 'dist/types/index.d.ts'));
const operators = exportsOf(path.join(rxjsRoot, 'dist/types/operators/index.d.ts'));
const interop = exportsOf(path.join(angularCoreRoot, 'types/rxjs-interop.d.ts'));
// rxjs re-exports every operator since 7.2, so they are declared once, in rxjs/operators.
const operatorNames = new Set(operators.map((item) => item.name));
const lines = [
  ...moduleLines('rxjs', rxjs.filter((item) => !operatorNames.has(item.name)), { precise: true, reexport: 'rxjs/operators' }),
  ...moduleLines('rxjs/operators', operators),
  ...moduleLines('@angular/core/rxjs-interop', interop),
];
const source = [
  '// Auto-generated by scripts/generate-editor-rxjs-typings.mjs. Do not edit by hand.',
  `// rxjs ${require('rxjs/package.json').version}, @angular/core ${require('@angular/core/package.json').version}.`,
  'export const EDITOR_RXJS_TYPINGS = [',
  ...lines.map((line) => `  ${JSON.stringify(line)},`),
  "].join('\\n');",
  '',
].join('\n');

if (CHECK) {
  const current = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
  if (current !== source) {
    console.error('[editor-rxjs-typings] ERROR: src/app/generated/editor-rxjs-typings.ts is stale.');
    console.error('[editor-rxjs-typings] Run: node scripts/generate-editor-rxjs-typings.mjs');
    process.exit(1);
  }
  console.log(`[editor-rxjs-typings] check passed: ${rxjs.length} rxjs, ${operators.length} operator and ${interop.length} rxjs-interop exports`);
} else {
  fs.writeFileSync(outputPath, source);
  console.log(`[editor-rxjs-typings] wrote ${path.relative(frontendRoot, outputPath)} (${lines.length} lines)`);
}
