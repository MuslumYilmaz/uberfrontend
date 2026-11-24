// Every Angular project a reader can open in the code editor (task starters, official and pressure-round solutions,
// debugging tasks) type-checks against the editor's stub typings with no error: a stub that is too narrow shows
// readers a red error in correct code. Two fixtures also prove that types reach the code (inject's type argument,
// a form control's value), so a stub that falls back to `any` cannot pass by hiding every error.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { loadTsModule } from './load-ts-module.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../..');
const appDir = path.join(scriptDir, '../src/app');
const typings = loadTsModule(path.join(appDir, 'core/utils/editor-angular-typings.ts'));
const loose = loadTsModule(path.join(appDir, 'generated/editor-angular-loose-typings.ts'));
const { EDITOR_RXJS_TYPINGS } = loadTsModule(path.join(appDir, 'generated/editor-rxjs-typings.ts'));

// The libraries and compiler options monaco-editor.component.ts gives the TypeScript worker: each Angular module's
// stub, then the loose declarations of its other exports.
const LIBS = {
  '/node_modules/@angular/core/index.d.ts': `${typings.EDITOR_ANGULAR_CORE_TYPINGS}\n${loose.EDITOR_ANGULAR_CORE_LOOSE_TYPINGS}`,
  '/node_modules/@angular/forms/index.d.ts': `${typings.EDITOR_ANGULAR_FORMS_TYPINGS}\n${loose.EDITOR_ANGULAR_FORMS_LOOSE_TYPINGS}`,
  '/node_modules/@angular/common/http/index.d.ts': `${typings.EDITOR_ANGULAR_HTTP_TYPINGS}\n${loose.EDITOR_ANGULAR_HTTP_LOOSE_TYPINGS}`,
  '/node_modules/rxjs/index.d.ts': EDITOR_RXJS_TYPINGS,
  '/node_modules/@types/fa-test/index.d.ts': typings.EDITOR_TEST_GLOBALS_TYPINGS,
  '/node_modules/@types/fa-node-shim/index.d.ts': typings.EDITOR_NODE_SHIM_TYPINGS,
};
const OPTIONS = {
  target: ts.ScriptTarget.ES2020,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  esModuleInterop: true,
  skipLibCheck: true,
  strict: false,
  experimentalDecorators: true,
  useDefineForClassFields: false,
  allowImportingTsExtensions: true,
  noEmit: true,
  lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
  types: [],
};
// The editor ignores "cannot find module" for imports it has no typings for (diagnosticCodesToIgnore).
const IGNORED_CODES = new Set([2307, 2792]);

/** The diagnostics the editor would show in a project's TypeScript files, as "path:line TScode message". */
function editorDiagnostics(files) {
  const all = { ...LIBS, ...files };
  const host = ts.createCompilerHost(OPTIONS);
  const defaultGetSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (fileName, languageVersion) => (all[fileName] != null
    ? ts.createSourceFile(fileName, all[fileName], languageVersion, true)
    : defaultGetSourceFile(fileName, languageVersion));
  host.fileExists = (fileName) => all[fileName] != null || ts.sys.fileExists(fileName);
  host.readFile = (fileName) => all[fileName] ?? ts.sys.readFile(fileName);
  const program = ts.createProgram(Object.keys(all), OPTIONS, host);
  return ts.getPreEmitDiagnostics(program)
    .filter((diagnostic) => diagnostic.file && files[diagnostic.file.fileName] != null && !IGNORED_CODES.has(diagnostic.code))
    .map((diagnostic) => {
      const { line } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start ?? 0);
      return `${diagnostic.file.fileName}:${line + 1} TS${diagnostic.code} ${ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')}`;
    });
}

/** A project's TypeScript files, keyed by absolute path as the editor names them. */
function typeScriptFiles(project) {
  return Object.fromEntries(
    Object.entries(project.files ?? {})
      .filter(([filePath]) => filePath.endsWith('.ts'))
      .map(([filePath, entry]) => [
        filePath.startsWith('/') ? filePath : `/${filePath}`,
        typeof entry === 'string' ? entry : String(entry?.code ?? entry?.content ?? ''),
      ]),
  );
}

const projectsDir = path.join(repoRoot, 'cdn/sb/angular');
let checked = 0;
const failures = [];
for (const folder of ['question', 'solution', 'debug']) {
  for (const name of fs.readdirSync(path.join(projectsDir, folder)).filter((file) => file.endsWith('.json')).sort()) {
    const files = typeScriptFiles(JSON.parse(fs.readFileSync(path.join(projectsDir, folder, name), 'utf8')));
    if (!Object.keys(files).length) continue;
    checked += 1;
    for (const diagnostic of editorDiagnostics(files)) failures.push(`${folder}/${name} ${diagnostic}`);
  }
}
assert.ok(checked > 50, `expected the Angular starters, solutions and debugging tasks, found ${checked} projects`);
assert.deepEqual(failures, [], `the editor would show errors in correct Angular code:\n${failures.join('\n')}`);

const fixture = (body) => ({
  '/src/app/app.component.ts': [
    "import { Component, ElementRef, inject } from '@angular/core';",
    "import { FormControl } from '@angular/forms';",
    '',
    "@Component({ selector: 'app-root', standalone: true, template: '' })",
    'export class AppComponent {',
    '  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);',
    "  private readonly query = new FormControl('');",
    ...body.map((line) => `  ${line}`),
    '}',
    '',
  ].join('\n'),
});
assert.deepEqual(editorDiagnostics(fixture([
  'readonly tag: string = this.host.nativeElement.tagName;',
  'readonly subscription = this.query.valueChanges.subscribe((value) => value.trim());',
])), [], 'typed injection and a typed value stream must type-check');
const wrong = editorDiagnostics(fixture([
  'readonly tag: number = this.host.nativeElement.tagName;',
  'readonly subscription = this.query.valueChanges.subscribe((value) => { const length: boolean = value; });',
]));
assert.equal(wrong.filter((line) => line.includes('TS2322')).length, 2, `types must reach the code:\n${wrong.join('\n')}`);

// Names the stubs leave out still resolve, as values, as types and with their type arguments, instead of showing
// "has no exported member" in correct code.
assert.deepEqual(editorDiagnostics({
  '/src/app/extra.ts': [
    "import { ApplicationRef, Injector, TemplateRef, ViewContainerRef, ViewEncapsulation, Directive, isSignal } from '@angular/core';",
    "import type { ApplicationConfig, Provider } from '@angular/core';",
    "import { FormArray, FormBuilder, ValidatorFn } from '@angular/forms';",
    "import { HttpContext, HttpParams } from '@angular/common/http';",
    '',
    "@Directive({ selector: '[appTpl]', standalone: true })",
    'export class TplDirective {',
    '  constructor(private readonly view: ViewContainerRef, private readonly tpl: TemplateRef<unknown>, private readonly app: ApplicationRef) {}',
    '  render(): void { this.view.createEmbeddedView(this.tpl); this.app.tick(); }',
    '}',
    'export const providers: Provider[] = [];',
    'export const appConfig: ApplicationConfig = { providers };',
    'export const encapsulation: ViewEncapsulation = ViewEncapsulation.None;',
    'export const minimum: ValidatorFn = () => null;',
    'export const signalCheck = (value: unknown) => isSignal(value);',
    'export const parts = (injector: Injector, fb: FormBuilder) => [injector.get(FormBuilder), fb.array([]) as FormArray, new HttpParams(), new HttpContext()];',
  ].join('\n'),
}), [], 'exports the stubs leave out must resolve');

console.log(`[editor-angular-typings] ${checked} Angular projects type-check with no editor error; typed inject and form values reach the code; the other exports resolve`);
