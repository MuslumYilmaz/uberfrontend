import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// The Angular preview compiles each file with ts.transpileModule and the JIT compiler; this transform gives the
// signal APIs the decorators the Angular CLI's JIT transform adds. The preview embeds the function's source, so the
// test rebuilds it from that source alone, as the preview document does.
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const modulePath = path.join(scriptDir, '../src/app/core/utils/angular-signal-jit-transform.ts');
const moduleJs = ts.transpileModule(fs.readFileSync(modulePath, 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText;
const { faSignalJitTransformer: compiled } = await import(`data:text/javascript,${encodeURIComponent(moduleJs)}`);
const faSignalJitTransformer = new Function(`return (${compiled.toString()});`)();

// The preview document loads the vendored TypeScript, not this repo's; both must take the transform.
const vendoredTs = createRequire(import.meta.url)('../src/assets/vendor/typescript/typescript.js');

function compileWith(ts, source) {
  const out = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      experimentalDecorators: true,
      useDefineForClassFields: false,
    },
    fileName: 'app.component.ts',
    reportDiagnostics: true,
    transformers: { before: [faSignalJitTransformer(ts)] },
  });
  assert.equal(out.diagnostics.length, 0, out.diagnostics.map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n')).join('\n'));
  return out.outputText.replace(/\s+/g, ' ');
}

for (const [label, compiler] of [[`typescript ${ts.version}`, ts], [`vendored typescript ${vendoredTs.version}`, vendoredTs]]) {
  const compile = (source) => compileWith(compiler, source);

  // Inputs: the field name is the binding unless an alias is given; required comes from input.required.
  {
    const js = compile(`
      import { Component, input as signalInput } from '@angular/core';
      @Component({ selector: 'app-x', template: '' })
      export class X {
        label = signalInput('a');
        id = signalInput.required<string>({ alias: 'itemId' });
        size = signalInput(1, { alias: 'width', transform: Number });
      }
    `);
    assert.match(js, /import \* as __faNgCore from "@angular\/core";/);
    assert.match(js, /__faNgCore\.Input\(\{ isSignal: true, alias: "label", required: false, transform: undefined \}\)/);
    assert.match(js, /__faNgCore\.Input\(\{ isSignal: true, alias: "itemId", required: true, transform: undefined \}\)/);
    assert.match(js, /__faNgCore\.Input\(\{ isSignal: true, alias: "width", required: false, transform: undefined \}\)/);
    assert.match(js, /__decorate\(\[ __faNgCore\.Input\([^)]*\) \], X\.prototype, "label", void 0\)/);
  }

  // model() is an input and a <name>Change output; output() and outputFromObservable() are outputs.
  {
    const js = compile(`
      import { Component, model, output } from '@angular/core';
      import { outputFromObservable } from '@angular/core/rxjs-interop';
      import { Subject } from 'rxjs';
      @Component({ selector: 'app-x', template: '' })
      export class X {
        private readonly changes$ = new Subject<number>();
        value = model(0);
        checked = model.required<boolean>({ alias: 'on' });
        picked = output<string>();
        closed = output({ alias: 'dismiss' });
        changed = outputFromObservable(this.changes$, { alias: 'valueChanged' });
      }
    `);
    assert.match(js, /__faNgCore\.Input\(\{ isSignal: true, alias: "value", required: false \}\), __faNgCore\.Output\("valueChange"\)/);
    assert.match(js, /__faNgCore\.Input\(\{ isSignal: true, alias: "on", required: true \}\), __faNgCore\.Output\("onChange"\)/);
    assert.match(js, /__faNgCore\.Output\("picked"\)/);
    assert.match(js, /__faNgCore\.Output\("dismiss"\)/);
    assert.match(js, /__faNgCore\.Output\("valueChanged"\)/);
  }

  // Signal queries keep their predicate and options, flagged as signal queries.
  {
    const js = compile(`
      import { Component, ElementRef, contentChild, viewChild, viewChildren } from '@angular/core';
      @Component({ selector: 'app-x', template: '<div #box></div>' })
      export class X {
        box = viewChild<ElementRef>('box');
        rows = viewChildren('row', { read: ElementRef });
        tpl = contentChild.required('tpl');
      }
    `);
    assert.match(js, /__faNgCore\.ViewChild\('box', \{ isSignal: true \}\)/);
    assert.match(js, /__faNgCore\.ViewChildren\('row', \{ \.\.\.\{ read: ElementRef \}, isSignal: true \}\)/);
    assert.match(js, /__faNgCore\.ContentChild\('tpl', \{ isSignal: true \}\)/);
  }

  // Left alone: decorated fields, look-alike functions, classes Angular does not compile, and files without signals.
  {
    const js = compile(`
      import { Component, Directive, Input, input } from '@angular/core';
      function output(name: string) { return name; }
      class Plain { value = input(1); }
      @Directive({ selector: '[x]' })
      export class D {
        @Input() legacy = input(2);
        local = output('x');
        kept = input(3);
      }
    `);
    assert.equal((js.match(/__faNgCore\.Input/g) || []).length, 1, 'only D.kept is transformed');
    assert.match(js, /__faNgCore\.Input\(\{ isSignal: true, alias: "kept"/);
    assert.doesNotMatch(js, /__faNgCore\.Output/);

    const untouched = compile(`
      import { Component, signal } from '@angular/core';
      @Component({ selector: 'app-x', template: '' })
      export class X { count = signal(0); }
    `);
    assert.doesNotMatch(untouched, /__faNgCore/);
  }

  console.log(`angular-signal-jit-transform: ok with ${label}`);
}
