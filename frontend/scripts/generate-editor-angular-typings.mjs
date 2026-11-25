#!/usr/bin/env node

// The code editor gives Angular projects hand-written stubs (src/app/core/utils/editor-angular-typings.ts): precise
// shapes for what the tasks use, and nothing else, so importing any other name from @angular/core, @angular/forms or
// @angular/common/http showed "has no exported member" in correct code. This generates loose declarations for the
// rest of each module's public exports, from the installed typings: every name resolves, as a value, a type or both,
// generic types take their own number of type arguments, and the stubs' precise shapes stay as they are. Shipping the
// real typings instead would add about 1.7 MB to the editor, written for a newer TypeScript than the editor runs.
// Rerun after upgrading Angular.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { loadTsModule } from './load-ts-module.mjs';

const CHECK = process.argv.includes('--check');
const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(frontendRoot, 'src/app/generated/editor-angular-loose-typings.ts');
const require = createRequire(path.join(frontendRoot, 'package.json'));
const angularRoot = path.dirname(path.dirname(require.resolve('@angular/core/package.json')));
const stubs = loadTsModule(path.join(frontendRoot, 'src/app/core/utils/editor-angular-typings.ts'));

const MODULES = [
  { name: '@angular/core', typings: 'core/types/core.d.ts', stub: stubs.EDITOR_ANGULAR_CORE_TYPINGS, constant: 'EDITOR_ANGULAR_CORE_LOOSE_TYPINGS' },
  { name: '@angular/forms', typings: 'forms/types/forms.d.ts', stub: stubs.EDITOR_ANGULAR_FORMS_TYPINGS, constant: 'EDITOR_ANGULAR_FORMS_LOOSE_TYPINGS' },
  { name: '@angular/common/http', typings: 'common/types/http.d.ts', stub: stubs.EDITOR_ANGULAR_HTTP_TYPINGS, constant: 'EDITOR_ANGULAR_HTTP_LOOSE_TYPINGS' },
];

/** The names a stub declares inside its `declare module` block, which the loose declarations leave to it. */
function stubNames(stub) {
  const source = ts.createSourceFile('stub.d.ts', stub, ts.ScriptTarget.Latest, true);
  const names = new Set();
  const visit = (node) => {
    if ((ts.isClassDeclaration(node) || ts.isFunctionDeclaration(node) || ts.isInterfaceDeclaration(node)
      || ts.isTypeAliasDeclaration(node) || ts.isEnumDeclaration(node)) && node.name) names.add(node.name.text);
    if (ts.isVariableStatement(node)) {
      for (const declaration of node.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) names.add(declaration.name.text);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return names;
}

/** Each public export: whether it is a class, a function, a value, a type, and how many type parameters it takes. */
function exportsOf(typingsFile) {
  const program = ts.createProgram([typingsFile], { noEmit: true, skipLibCheck: true, types: [] });
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(typingsFile);
  if (!source) throw new Error(`Missing typings: ${typingsFile}`);
  return checker.getExportsOfModule(checker.getSymbolAtLocation(source))
    .filter((exported) => !exported.getName().startsWith('ɵ'))
    .map((exported) => {
      const target = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
      const flags = target.flags;
      const declarations = target.declarations ?? [];
      const arity = Math.max(0, ...declarations.map((declaration) => declaration.typeParameters?.length ?? 0));
      return {
        name: exported.getName(),
        isClass: !!(flags & ts.SymbolFlags.Class),
        isFunction: !!(flags & ts.SymbolFlags.Function),
        isValue: !!(flags & (ts.SymbolFlags.Variable | ts.SymbolFlags.Enum)),
        isType: !!(flags & (ts.SymbolFlags.Interface | ts.SymbolFlags.TypeAlias | ts.SymbolFlags.Enum)),
        arity,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

const params = (count) => (count ? `<${Array.from({ length: count }, (_unused, index) => `T${index}=any`).join(',')}>` : '');

function declarationsOf(item) {
  if (item.isClass) return [`export class ${item.name}${params(item.arity)}{constructor(...a:any[]);[k:string]:any;static [k:string]:any}`];
  const out = [];
  if (item.isFunction) out.push(`export function ${item.name}(...a:any[]):any;`);
  else if (item.isValue) out.push(`export const ${item.name}:any;`);
  if (item.isType) out.push(`export type ${item.name}${params(item.arity)}=any;`);
  if (!out.length) throw new Error(`unclassified export ${item.name}`);
  return out;
}

function moduleSource({ name, typings, stub }) {
  const known = stubNames(stub);
  const items = exportsOf(path.join(angularRoot, typings)).filter((item) => !known.has(item.name));
  const lines = [`declare module '${name}' {`];
  // A few declarations per line keep the generated file short.
  let line = '';
  for (const declaration of items.flatMap(declarationsOf)) {
    if (line && line.length + declaration.length > 110) {
      lines.push(`  ${line}`);
      line = '';
    }
    line = line ? `${line} ${declaration}` : declaration;
  }
  if (line) lines.push(`  ${line}`);
  lines.push('}');
  return { lines, count: items.length };
}

const parts = MODULES.map((module) => ({ module, ...moduleSource(module) }));
const source = [
  '// Auto-generated by scripts/generate-editor-angular-typings.mjs. Do not edit by hand.',
  `// @angular/core, @angular/forms and @angular/common ${require('@angular/core/package.json').version}: the exports the stubs in`,
  '// core/utils/editor-angular-typings.ts leave out, declared loosely so that importing them shows no error.',
  ...parts.flatMap(({ module, lines }) => [
    `export const ${module.constant} = [`,
    ...lines.map((line) => `  ${JSON.stringify(line)},`),
    "].join('\\n');",
  ]),
  '',
].join('\n');
const summary = parts.map(({ module, count }) => `${count} ${module.name}`).join(', ');

if (CHECK) {
  const current = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
  if (current !== source) {
    console.error('[editor-angular-typings] ERROR: src/app/generated/editor-angular-loose-typings.ts is stale.');
    console.error('[editor-angular-typings] Run: node scripts/generate-editor-angular-typings.mjs');
    process.exit(1);
  }
  console.log(`[editor-angular-typings] check passed: ${summary} loose exports`);
} else {
  fs.writeFileSync(outputPath, source);
  console.log(`[editor-angular-typings] wrote ${path.relative(frontendRoot, outputPath)}: ${summary} loose exports, ${source.length} bytes`);
}
