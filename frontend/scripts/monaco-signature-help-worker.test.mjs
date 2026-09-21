import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const customWorkerPath = '/assets/monaco/signature-help-worker.js';
const customWorkerSource = readFileSync(
  new URL('../src/assets/monaco/signature-help-worker.js', import.meta.url),
  'utf8',
);
const bundledWorkerSource = readFileSync(
  new URL('../node_modules/monaco-editor/esm/vs/language/typescript/ts.worker.js', import.meta.url),
  'utf8',
);

// Keep Monaco's actual bundled TypeScript and worker implementation. Only remove
// the browser transport import and ESM exports so it can run in a Node VM.
const transportImport = /^import \{ initialize \} from "\.\.\/\.\.\/editor\/editor\.worker\.js";$/m;
const exportStart = bundledWorkerSource.lastIndexOf('\nexport {\n');
assert.match(bundledWorkerSource, transportImport);
assert.ok(exportStart > 0, 'Expected the installed Monaco worker ESM export block');
const context = vm.createContext({ console, setTimeout, clearTimeout });
context.self = context;
context.importScripts = (path) => {
  assert.equal(path, customWorkerPath);
  vm.runInContext(customWorkerSource, context, { filename: customWorkerPath });
};
vm.runInContext(
  bundledWorkerSource.slice(0, exportStart).replace(transportImport, ''),
  context,
  { filename: 'monaco-ts.worker.js' },
);

const knownFailure = 'Debug Failure. Expected 1 < 1.';
const brokenCall = 'const layers = Object.assign({}, |...[]);';
const validCall = 'function add(left, right) { return left + right; }\nadd(1, |2);';
const signatureOptions = {
  triggerReason: { kind: 'characterTyped', triggerCharacter: ',' },
};

function createWorker(language, custom = false) {
  const fileName = `file:///signature-help-repro.${language}`;
  let source = '';
  const model = {
    uri: { path: `/signature-help-repro.${language}`, toString: () => fileName },
    version: 0,
    getValue: () => source,
  };
  const worker = context.create(
    { getMirrorModels: () => [model] },
    {
      compilerOptions: { allowJs: true, target: context.ts.ScriptTarget.ESNext },
      extraLibs: {},
      ...(custom ? { customWorkerPath } : {}),
    },
  );
  return {
    worker,
    fileName,
    setSource(markedSource) {
      const position = markedSource.indexOf('|');
      assert.notEqual(position, -1, 'The fixture must identify the cursor with |');
      source = markedSource.replace('|', '');
      model.version += 1;
      return position;
    },
  };
}

for (const language of ['js', 'ts']) {
  test(`${language}: installed Monaco reproduces the production signature-help assertion`, async () => {
    const { worker, fileName, setSource } = createWorker(language);
    try {
      const position = setSource(brokenCall);
      for (const options of [signatureOptions, { triggerReason: { kind: 'invoked' } }]) {
        await assert.rejects(
          worker.getSignatureHelpItems(fileName, position, options),
          (error) => error.message.trim() === knownFailure,
        );
      }
    } finally {
      worker.getLanguageService().dispose();
    }
  });

  test(`${language}: custom worker recovers and keeps language features on the same model`, async () => {
    const { worker, fileName, setSource } = createWorker(language, true);
    try {
      const brokenPosition = setSource(brokenCall);
      assert.equal(
        await worker.getSignatureHelpItems(fileName, brokenPosition, signatureOptions),
        undefined,
      );

      const validPosition = setSource(validCall);
      const help = await worker.getSignatureHelpItems(fileName, validPosition, signatureOptions);
      assert.equal(help.argumentIndex, 1);
      assert.equal(help.argumentCount, 2);
      assert.equal(help.items.length, 1);
      assert.deepEqual(
        Array.from(help.items[0].parameters, (parameter) => parameter.name),
        ['left', 'right'],
      );

      const quickInfo = await worker.getQuickInfoAtPosition(fileName, validCall.indexOf('add(1') + 1);
      assert.equal(quickInfo.kind, 'function');
      assert.match(quickInfo.displayParts.map((part) => part.text).join(''), /add\(left:/);

      const completionPosition = setSource('function add(left, right) { return left + right; }\nad|');
      const completions = await worker.getCompletionsAtPosition(fileName, completionPosition);
      assert.ok(completions.entries.some((entry) => entry.name === 'add'));

      setSource('function add( {|');
      assert.ok((await worker.getSyntacticDiagnostics(fileName)).length > 0);

      const emptyPosition = setSource('|');
      assert.equal(
        await worker.getSignatureHelpItems(fileName, emptyPosition, signatureOptions),
        undefined,
      );
    } finally {
      worker.getLanguageService().dispose();
    }
  });
}

function wrapSignatureHelp(implementation) {
  class BaseWorker {
    getSignatureHelpItems(...args) {
      return implementation.apply(this, args);
    }
  }
  // Load the production asset rather than duplicating its error handling here.
  context.importScripts(customWorkerPath);
  const CustomWorker = context.customTSWorkerFactory(BaseWorker);
  return new CustomWorker();
}

for (const delivery of ['throw', 'reject']) {
  test(`custom worker handles an exact assertion from a synchronous ${delivery === 'throw' ? 'throw' : 'call returning a rejected promise'}`, async () => {
    const worker = wrapSignatureHelp(() => {
      const error = new Error(`${knownFailure} `);
      if (delivery === 'throw') throw error;
      return Promise.reject(error);
    });
    assert.equal(await worker.getSignatureHelpItems('file:///test.js', 10, signatureOptions), undefined);
  });

  test(`custom worker preserves unrelated ${delivery === 'throw' ? 'thrown errors' : 'promise rejections'} by identity`, async () => {
    const errors = [
      new Error('Debug Failure. Expected 2 < 2.'),
      new Error(`${knownFailure} Unexpected additional failure`),
      new Error('Worker request cancelled'),
      { message: 'A non-Error rejection' },
      null,
    ];
    for (const error of errors) {
      const worker = wrapSignatureHelp(() => {
        if (delivery === 'throw') throw error;
        return Promise.reject(error);
      });
      await assert.rejects(
        worker.getSignatureHelpItems('file:///test.ts', 10, signatureOptions),
        (actual) => actual === error,
      );
    }
  });
}

test('custom worker forwards arguments and preserves successful and empty results', async () => {
  const args = ['file:///test.js', 10, signatureOptions];
  for (const result of [{ items: [{ parameters: [] }] }, undefined]) {
    let receiver;
    const worker = wrapSignatureHelp(function (...actualArgs) {
      receiver = this;
      assert.deepEqual(actualArgs, args);
      return Promise.resolve(result);
    });
    assert.equal(await worker.getSignatureHelpItems(...args), result);
    assert.equal(receiver, worker);
  }
});
