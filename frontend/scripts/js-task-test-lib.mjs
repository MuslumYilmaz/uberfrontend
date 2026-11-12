// Runs a JavaScript coding task's tests against a solution in Node, with the same matchers and fake timers the
// browser sandbox gives them (loaded from src/app), so a check passes or fails here as it does on the site.
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { loadTsModule } from './load-ts-module.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const securityDir = path.join(scriptDir, '../src/app/core/security');
const { createSandboxExpect } = loadTsModule(path.join(securityDir, 'user-code-sandbox-matchers.ts'));
const { createSandboxFakeTimers } = loadTsModule(path.join(securityDir, 'user-code-sandbox-fake-timers.ts'));
const { createTestSuite } = loadTsModule(path.join(securityDir, 'user-code-sandbox-suite.ts'));

// Taken before any test can swap them for fake ones, like the worker's own timers.
const realSetTimeout = globalThis.setTimeout;
const realClearTimeout = globalThis.clearTimeout;
const fakeTimers = createSandboxFakeTimers(globalThis);
const AsyncFunction = Object.getPrototypeOf(async function noop() {}).constructor;
// The sandbox's limit for one test, unless the task sets testTimeoutMs.
const DEFAULT_TEST_TIMEOUT_MS = 1_000;

const show = (value) => {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
};
const expect = createSandboxExpect(show);

export function transpile(source, fileName) {
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
      strict: true,
    },
    reportDiagnostics: true,
    fileName,
  });
  const errors = (result.diagnostics || []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  assert.equal(
    errors.length,
    0,
    `${fileName} failed to transpile: ${errors.map((error) => ts.flattenDiagnosticMessageText(error.messageText, '\n')).join('; ')}`,
  );
  return result.outputText;
}

/** Imports a solution module and returns its default export; `label` keeps modules with equal sources apart. */
export async function importSolution(source, language, label) {
  const executable = language === 'ts' ? transpile(source, `${label}.ts`) : source;
  const encoded = Buffer.from(executable).toString('base64');
  return (await import(`data:text/javascript;base64,${encoded}#${label}-${language}`)).default;
}

function prepareTests(source, language, fileName) {
  let importedName = '';
  const withoutImport = source.replace(
    /^\s*import\s+([A-Za-z_$][\w$]*)\s+from\s+['"][^'"]+['"];?\s*$/m,
    (_match, name) => {
      importedName = name;
      return '';
    },
  );
  const injected = importedName
    ? `const ${importedName} = __solution;\n${withoutImport}`
    : withoutImport;
  return language === 'ts' ? transpile(injected, fileName) : injected;
}

async function withTimeout(run, ms, label) {
  let timer;
  try {
    await Promise.race([
      Promise.resolve().then(run),
      new Promise((_, reject) => {
        timer = realSetTimeout(() => reject(new Error(`${label} exceeded ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    realClearTimeout(timer);
  }
}

/**
 * Runs the task's JavaScript (`js`) or TypeScript (`ts`) tests in order and returns one result per test. A promise
 * rejection nobody handled, or an error thrown from a timer, fails the test that was running, as in the sandbox.
 */
export async function runTaskTests(question, language, solution) {
  const testField = language === 'ts' ? 'testsTs' : 'tests';
  const source = question[testField];
  assert.equal(typeof source, 'string', `${question.id} is missing ${testField}`);
  const executable = prepareTests(source, language, `${question.id}.${testField}.ts`);
  const suite = createTestSuite(' > ');
  const register = (name, fn) => {
    assert.equal(typeof fn, 'function', `${question.id}/${language} test "${name}" has no function`);
    suite.test(name, fn);
  };

  const loadTests = new AsyncFunction(
    '__solution', 'describe', 'test', 'it', 'expect', 'beforeAll', 'afterAll', 'beforeEach', 'afterEach',
    'useFakeTimers', 'useRealTimers', 'advanceTimersByTime', 'advanceTimersByTimeAsync',
    executable,
  );
  await loadTests(
    solution, suite.describe, register, register, expect, suite.beforeAll, suite.afterAll, suite.beforeEach, suite.afterEach,
    fakeTimers.useFakeTimers, fakeTimers.useRealTimers, fakeTimers.advanceTimersByTime, fakeTimers.advanceTimersByTimeAsync,
  );
  const cases = suite.tests();
  assert.ok(cases.length > 0, `${question.id}/${language} registered no tests`);

  const asyncErrors = [];
  const onAsyncError = (error) => asyncErrors.push(error);
  process.on('unhandledRejection', onAsyncError);
  process.on('uncaughtException', onAsyncError);
  const results = [];
  try {
    for (const testCase of cases) {
      const errorsBefore = asyncErrors.length;
      let error;
      try {
        await withTimeout(testCase.fn, question.testTimeoutMs ?? DEFAULT_TEST_TIMEOUT_MS, `${question.id}/${language}: ${testCase.fullName}`);
      } catch (thrown) {
        error = thrown;
      } finally {
        fakeTimers.useRealTimers();
      }
      // Node reports an unhandled rejection after the task that created it, so give it that turn.
      await new Promise((resolve) => realSetTimeout(resolve, 0));
      if (error === undefined && asyncErrors.length > errorsBefore) error = asyncErrors[errorsBefore];
      results.push({ name: testCase.name, fullName: testCase.fullName, passed: error === undefined, error });
    }
  } finally {
    process.off('unhandledRejection', onAsyncError);
    process.off('uncaughtException', onAsyncError);
  }
  return results;
}
